alter table public.guardian_students
  drop constraint if exists guardian_students_guardian_id_student_id_key;

create or replace function private.protect_profile_privileges()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user not in ('postgres','supabase_admin')
     and not (select private.is_admin())
     and (
       new.role is distinct from old.role
       or new.account_status is distinct from old.account_status
     ) then
    raise exception 'Role and account status can only be changed by trusted administration';
  end if;
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function private.protect_teacher_review()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_user not in ('postgres','supabase_admin')
     and not (select private.is_admin())
     and (
       new.review_status is distinct from old.review_status
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.review_note is distinct from old.review_note
     ) then
    raise exception 'Teacher review fields can only be changed by trusted administration';
  end if;
  return new;
end;
$function$;

revoke execute on function private.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function private.protect_teacher_review() from public, anon, authenticated;
