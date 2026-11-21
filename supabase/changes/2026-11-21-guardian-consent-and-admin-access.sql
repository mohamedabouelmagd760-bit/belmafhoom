-- Applied to Supabase project ertbyybmzizpdcaehhkw on 2026-11-21.
-- Adds explicit guardian consent, student approval/revocation, and admin review access.

create table if not exists public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  guardian_student_id uuid not null references public.guardian_students(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  consent_version text not null default '2026-11',
  consented_at timestamptz not null default now(),
  unique (guardian_student_id),
  constraint guardian_consent_parties_differ check (student_id <> guardian_id)
);
alter table public.guardian_consents enable row level security;
grant select, insert on public.guardian_consents to authenticated;
create policy guardian_consents_read_participants on public.guardian_consents
for select to authenticated using (
  student_id = (select auth.uid()) or guardian_id = (select auth.uid()) or (select private.is_admin())
);
create policy guardian_consents_student_insert on public.guardian_consents
for insert to authenticated with check (
  student_id = (select auth.uid())
  and exists (select 1 from public.guardian_students gs
    where gs.id = guardian_student_id and gs.student_id = (select auth.uid())
      and gs.guardian_id = guardian_consents.guardian_id and gs.status = 'pending')
  and exists (select 1 from public.profiles p where p.id = guardian_id and p.role = 'guardian')
);

create index if not exists guardian_consents_guardian_id_idx on public.guardian_consents(guardian_id);
create index if not exists guardian_consents_student_id_idx on public.guardian_consents(student_id);
create unique index if not exists guardian_students_one_open_link_per_pair
on public.guardian_students(guardian_id,student_id) where status in ('pending','active');

create or replace function private.guardian_link_consent_status()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not exists (select 1 from public.profiles p where p.id = new.guardian_id and p.role='guardian' and p.account_status='active')
       or not exists (select 1 from public.profiles p where p.id = new.student_id and p.role='student' and p.account_status='active') then
      raise exception 'Active guardian and student accounts are required';
    end if;
    if new.status <> 'pending' then raise exception 'Guardian link must begin pending'; end if;
    return new;
  end if;
  if new.id <> old.id or new.guardian_id <> old.guardian_id or new.student_id <> old.student_id or new.created_at <> old.created_at then
    raise exception 'Guardian link identity is immutable';
  end if;
  if auth.uid() = old.student_id and not private.is_admin() then
    if old.status = 'pending' and new.status = 'active' then
      if not exists (select 1 from public.guardian_consents gc where gc.guardian_student_id=old.id and gc.student_id=old.student_id and gc.guardian_id=old.guardian_id) then
        raise exception 'Explicit student consent is required';
      end if;
    elsif not ((old.status = 'pending' and new.status = 'rejected') or (old.status = 'active' and new.status = 'rejected')) then
      raise exception 'Student can only approve, reject, or revoke a guardian link';
    end if;
  elsif private.is_admin() then null;
  else raise exception 'Only the linked student or an administrator can confirm this request';
  end if;
  return new;
end;
$$;

drop trigger if exists guardian_link_consent_status on public.guardian_students;
create trigger guardian_link_consent_status before insert or update on public.guardian_students
for each row execute function private.guardian_link_consent_status();

drop policy if exists guardian_students_update_student_or_admin on public.guardian_students;
create policy guardian_students_update_student_or_admin on public.guardian_students
for update to authenticated using (student_id = (select auth.uid()) or (select private.is_admin()))
with check (student_id = (select auth.uid()) or (select private.is_admin()));

-- Consolidate guardian visibility into existing SELECT policies to avoid multiple permissive policies.
drop policy if exists guardian_read_child_assignment_submissions on public.assignment_submissions;
drop policy if exists guardian_read_child_enrollments on public.course_enrollments;
drop policy if exists guardian_read_student_profile on public.student_profiles;
drop policy if exists teacher_profiles_admin_update on public.teacher_profiles;

drop policy if exists assignment_submissions_read_participants on public.assignment_submissions;
create policy assignment_submissions_read_participants on public.assignment_submissions
for select to authenticated using (
  student_id = (select auth.uid()) or (select private.is_admin())
  or exists (select 1 from public.assignments a where a.id=assignment_submissions.assignment_id and private.can_manage_course(a.course_id))
  or exists (select 1 from public.guardian_students gs where gs.student_id=assignment_submissions.student_id and gs.guardian_id=(select auth.uid()) and gs.status='active')
);

drop policy if exists course_enrollments_read_participants on public.course_enrollments;
create policy course_enrollments_read_participants on public.course_enrollments
for select to authenticated using (
  student_id=(select auth.uid()) or teacher_id=(select auth.uid()) or (select private.is_admin())
  or exists (select 1 from public.guardian_students gs where gs.student_id=course_enrollments.student_id and gs.guardian_id=(select auth.uid()) and gs.status='active')
);

drop policy if exists student_profile_select_owner_or_admin on public.student_profiles;
create policy student_profile_select_owner_or_admin on public.student_profiles
for select to authenticated using (
  user_id=(select auth.uid()) or (select private.is_admin())
  or exists (select 1 from public.guardian_students gs where gs.student_id=student_profiles.user_id and gs.guardian_id=(select auth.uid()) and gs.status='active')
);

drop policy if exists teacher_profile_update_owner on public.teacher_profiles;
create policy teacher_profile_update_owner on public.teacher_profiles
for update to authenticated using (user_id=(select auth.uid()) or (select private.is_admin()))
with check (user_id=(select auth.uid()) or (select private.is_admin()));

-- Preview access: show a published section only when it contains a preview lesson,
-- and permit authenticated preview users to read that lesson's private file.
drop policy if exists course_sections_read_authorized on public.course_sections;
create policy course_sections_read_authorized on public.course_sections
for select to authenticated using (
  private.can_manage_course(course_id)
  or exists (
    select 1 from public.courses c
    where c.id=course_sections.course_id and c.status='published'
      and private.teacher_is_publicly_eligible(c.teacher_id)
      and (
        exists (select 1 from public.course_enrollments e where e.course_id=c.id and e.student_id=(select auth.uid()) and e.status='active')
        or exists (select 1 from public.lessons l where l.section_id=course_sections.id and l.is_preview=true)
      )
  )
);

drop policy if exists belmafhoom_private_read_course_materials on storage.objects;
create policy belmafhoom_private_read_course_materials on storage.objects
for select to authenticated using (
  bucket_id='belmafhoom-private' and (storage.foldername(name))[1]='course-materials'
  and exists (
    select 1 from public.courses c
    where c.id::text=(storage.foldername(objects.name))[3]
      and c.teacher_id::text=(storage.foldername(objects.name))[2]
      and (
        c.teacher_id=(select auth.uid()) or (select private.is_admin())
        or exists (select 1 from public.course_enrollments e where e.course_id=c.id and e.student_id=(select auth.uid()) and e.status='active')
        or exists (
          select 1 from public.lessons l join public.course_sections s on s.id=l.section_id
          where s.course_id=c.id and l.content=objects.name and l.is_preview=true
            and c.status='published' and private.teacher_is_publicly_eligible(c.teacher_id)
        )
      )
  )
);

-- Per-student lesson completion tracking.
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id,lesson_id)
);
alter table public.lesson_progress enable row level security;
grant select,insert,update on public.lesson_progress to authenticated;
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create index if not exists lesson_progress_student_completed_idx on public.lesson_progress(student_id,completed_at);
create policy lesson_progress_read_authorized on public.lesson_progress
for select to authenticated using (
  student_id=(select auth.uid()) or (select private.is_admin())
  or exists (select 1 from public.lessons l join public.course_sections s on s.id=l.section_id
    where l.id=lesson_progress.lesson_id and private.can_manage_course(s.course_id))
  or exists (select 1 from public.guardian_students gs where gs.student_id=lesson_progress.student_id
    and gs.guardian_id=(select auth.uid()) and gs.status='active')
);
create policy lesson_progress_student_insert on public.lesson_progress
for insert to authenticated with check (
  student_id=(select auth.uid()) and exists (
    select 1 from public.lessons l join public.course_sections s on s.id=l.section_id
    join public.course_enrollments e on e.course_id=s.course_id
    where l.id=lesson_progress.lesson_id and e.student_id=(select auth.uid()) and e.status='active'
  )
);
create policy lesson_progress_student_update on public.lesson_progress
for update to authenticated using (student_id=(select auth.uid()))
with check (student_id=(select auth.uid()));
create or replace function private.protect_lesson_progress()
returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='INSERT' then
    if new.student_id<>auth.uid() then raise exception 'Progress must belong to the signed-in student'; end if;
  else
    if new.id<>old.id or new.student_id<>old.student_id or new.lesson_id<>old.lesson_id or new.created_at<>old.created_at then
      raise exception 'Progress identity is immutable';
    end if;
    if old.student_id<>auth.uid() then raise exception 'Only the student can update progress'; end if;
  end if;
  if not exists (
    select 1 from public.lessons l join public.course_sections s on s.id=l.section_id
    join public.course_enrollments e on e.course_id=s.course_id
    where l.id=new.lesson_id and e.student_id=new.student_id and e.status='active'
  ) then raise exception 'Active course enrollment required'; end if;
  new.updated_at:=now(); return new;
end;
$$;
create trigger protect_lesson_progress before insert or update on public.lesson_progress
for each row execute function private.protect_lesson_progress();
