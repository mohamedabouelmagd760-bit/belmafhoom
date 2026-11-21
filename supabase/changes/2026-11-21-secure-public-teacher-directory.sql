-- Public, privacy-limited directory of active, approved teachers.
-- The directory contains no phone numbers, private account metadata, or student data.
create table if not exists public.public_teacher_directory (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 avatar_url text,
 bio text,
 subjects text[] not null default '{}',
 stages text[] not null default '{}',
 updated_at timestamptz not null default now()
);
alter table public.public_teacher_directory enable row level security;
revoke all on public.public_teacher_directory from public, anon, authenticated;
grant select on public.public_teacher_directory to anon, authenticated;
create policy public_teacher_directory_read on public.public_teacher_directory
 for select to anon, authenticated using (true);

create or replace function private.sync_public_teacher_directory()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, private
as $$
declare target_id uuid; p public.profiles%rowtype; t public.teacher_profiles%rowtype;
begin
 if tg_table_name = 'profiles' then
  if tg_op = 'DELETE' then target_id := old.id; else target_id := new.id; end if;
 else
  if tg_op = 'DELETE' then target_id := old.user_id; else target_id := new.user_id; end if;
 end if;
 select * into p from public.profiles where id = target_id;
 select * into t from public.teacher_profiles where user_id = target_id;
 if p.id is not null and p.role = 'teacher'::public.app_role
  and p.account_status = 'active'::public.account_status
  and t.user_id is not null and t.review_status = 'approved'::public.teacher_review_status then
  insert into public.public_teacher_directory(user_id,display_name,avatar_url,bio,subjects,stages,updated_at)
  values(p.id,p.display_name,p.avatar_url,t.bio,coalesce(t.subjects,'{}'),coalesce(t.stages,'{}'),now())
  on conflict(user_id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,
   bio=excluded.bio,subjects=excluded.subjects,stages=excluded.stages,updated_at=now();
 else
  delete from public.public_teacher_directory where user_id=target_id;
 end if;
 if tg_op = 'DELETE' then return old; end if;
 return new;
end;
$$;
revoke all on function private.sync_public_teacher_directory() from public, anon, authenticated;
drop trigger if exists sync_public_teacher_directory_from_profiles on public.profiles;
create trigger sync_public_teacher_directory_from_profiles
 after insert or update of role,account_status,display_name,avatar_url or delete on public.profiles
 for each row execute function private.sync_public_teacher_directory();
drop trigger if exists sync_public_teacher_directory_from_teacher_profiles on public.teacher_profiles;
create trigger sync_public_teacher_directory_from_teacher_profiles
 after insert or update of bio,subjects,stages,review_status or delete on public.teacher_profiles
 for each row execute function private.sync_public_teacher_directory();
insert into public.public_teacher_directory(user_id,display_name,avatar_url,bio,subjects,stages)
select p.id,p.display_name,p.avatar_url,tp.bio,coalesce(tp.subjects,'{}'),coalesce(tp.stages,'{}')
from public.profiles p join public.teacher_profiles tp on tp.user_id=p.id
where p.role='teacher'::public.app_role and p.account_status='active'::public.account_status
 and tp.review_status='approved'::public.teacher_review_status
on conflict(user_id) do update set display_name=excluded.display_name,avatar_url=excluded.avatar_url,
 bio=excluded.bio,subjects=excluded.subjects,stages=excluded.stages,updated_at=now();
