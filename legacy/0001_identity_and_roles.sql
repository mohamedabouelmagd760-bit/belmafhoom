-- بالمفهوم: identity, role requests, profiles and guardian relationships
-- Run in a NEW Supabase project after reviewing project settings.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student','teacher','guardian','admin');
create type public.account_status as enum ('pending','active','rejected','suspended');
create type public.teacher_review_status as enum ('pending','approved','rejected','suspended');
create type public.guardian_relationship as enum ('mother','father','legal_guardian','other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 120),
  phone text,
  role public.app_role not null default 'student',
  account_status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stage text check (stage in ('primary','preparatory','secondary')),
  grade text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bio text,
  public_photo_path text,
  review_status public.teacher_review_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  constraint teacher_review_consistency check (
    (review_status = 'pending' and reviewed_at is null)
    or (review_status <> 'pending')
  )
);

create table public.guardian_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_contact text check (preferred_contact in ('email','phone','both')),
  created_at timestamptz not null default now()
);

create table public.guardian_students (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.guardian_profiles(user_id) on delete cascade,
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  relationship public.guardian_relationship not null,
  status text not null default 'pending' check (status in ('pending','active','rejected','revoked')),
  requested_by uuid not null references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (guardian_id, student_id),
  check (guardian_id <> student_id)
);

create table public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.student_profiles(user_id) on delete cascade,
  guardian_id uuid not null references public.guardian_profiles(user_id) on delete cascade,
  consent_type text not null check (consent_type in ('account_creation','data_processing','course_access','communications')),
  consent_version text not null,
  status text not null check (status in ('granted','withdrawn')),
  recorded_at timestamptz not null default now(),
  unique(student_id, guardian_id, consent_type, consent_version)
);

create index guardian_students_guardian_idx on public.guardian_students(guardian_id, status);
create index guardian_students_student_idx on public.guardian_students(student_id, status);
create index profiles_role_status_idx on public.profiles(role, account_status);
create index teacher_review_idx on public.teacher_profiles(review_status);

-- Create profile rows from auth metadata. Role is allow-listed; admin is never accepted from client metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  safe_role public.app_role;
begin
  requested_role := coalesce(new.raw_user_meta_data ->> 'requested_role', 'student');
  if requested_role not in ('student','teacher','guardian') then
    requested_role := 'student';
  end if;
  safe_role := requested_role::public.app_role;

  insert into public.profiles (id, full_name, phone, role, account_status)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'مستخدم جديد'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    safe_role,
    case when safe_role = 'teacher' then 'pending'::public.account_status else 'active'::public.account_status end
  );

  if safe_role = 'student' then
    insert into public.student_profiles(user_id) values (new.id);
  elsif safe_role = 'teacher' then
    insert into public.teacher_profiles(user_id) values (new.id);
  elsif safe_role = 'guardian' then
    insert into public.guardian_profiles(user_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Protect privileged fields even if a client submits them in an UPDATE.
-- Trusted server-side admin workflows can use the service role after explicit bootstrap.
create or replace function public.prevent_self_privilege_escalation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.id and (
    new.role is distinct from old.role
    or new.account_status is distinct from old.account_status
  ) then
    raise exception 'Role and account status can only be changed by trusted administration.';
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileges
before update on public.profiles
for each row execute function public.prevent_self_privilege_escalation();

create or replace function public.prevent_teacher_review_edits()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.user_id and (
    new.review_status is distinct from old.review_status
    or new.reviewed_by is distinct from old.reviewed_by
    or new.reviewed_at is distinct from old.reviewed_at
    or new.review_note is distinct from old.review_note
  ) then
    raise exception 'Teacher review fields can only be changed by trusted administration.';
  end if;
  return new;
end;
$$;

create trigger protect_teacher_review
before update on public.teacher_profiles
for each row execute function public.prevent_teacher_review_edits();

-- RLS: users can read/update only their own rows; privileged fields are protected by triggers.
alter table public.profiles enable row level security;
alter table public.student_profiles enable row level security;
alter table public.teacher_profiles enable row level security;
alter table public.guardian_profiles enable row level security;
alter table public.guardian_students enable row level security;
alter table public.guardian_consents enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()));
create policy "student_profile_select_own" on public.student_profiles
for select to authenticated using (user_id = (select auth.uid()));
create policy "student_profile_update_own" on public.student_profiles
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "teacher_profile_select_own" on public.teacher_profiles
for select to authenticated using (user_id = (select auth.uid()));
create policy "teacher_profile_update_own" on public.teacher_profiles
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy "guardian_profile_select_own" on public.guardian_profiles
for select to authenticated using (user_id = (select auth.uid()));
create policy "guardian_profile_update_own" on public.guardian_profiles
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- A guardian may create a pending link request only for their own account.
create policy "guardian_link_select_participant" on public.guardian_students
for select to authenticated using (guardian_id = (select auth.uid()) or student_id = (select auth.uid()));
create policy "guardian_link_insert_self_pending" on public.guardian_students
for insert to authenticated with check (
  guardian_id = (select auth.uid())
  and requested_by = (select auth.uid())
  and status = 'pending'
);
-- No client-side policy permits activating/rejecting a link or changing review fields.
create policy "guardian_consent_select_participant" on public.guardian_consents
for select to authenticated using (guardian_id = (select auth.uid()) or student_id = (select auth.uid()));

-- Intentionally absent: public/admin policies and approval mutations.
-- Admin operations must be implemented in trusted server code after a secure admin bootstrap.
-- Never expose the Supabase service-role key to the browser.
