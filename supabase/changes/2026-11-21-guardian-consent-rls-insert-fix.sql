create or replace function private.guardian_consent_insert_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_link public.guardian_students%rowtype;
begin
  if auth.uid() is null or new.student_id is distinct from auth.uid() then
    raise exception 'Consent must be created by the linked student';
  end if;

  select * into v_link
  from public.guardian_students gs
  where gs.id = new.guardian_student_id
  for share;

  if not found
     or v_link.student_id is distinct from new.student_id
     or v_link.guardian_id is distinct from new.guardian_id
     or v_link.status <> 'pending' then
    raise exception 'A matching pending guardian request is required';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = new.student_id
      and p.role = 'student'
      and p.account_status = 'active'
  ) or not exists (
    select 1 from public.profiles p
    where p.id = new.guardian_id
      and p.role = 'guardian'
      and p.account_status = 'active'
  ) then
    raise exception 'Active student and guardian accounts are required';
  end if;

  new.consent_version := '2026-11';
  new.consented_at := now();
  return new;
end;
$function$;

revoke execute on function private.guardian_consent_insert_guard() from public, anon, authenticated;

drop trigger if exists guardian_consent_insert_guard on public.guardian_consents;
create trigger guardian_consent_insert_guard
before insert on public.guardian_consents
for each row execute function private.guardian_consent_insert_guard();

drop policy if exists guardian_consents_student_insert on public.guardian_consents;
create policy guardian_consents_student_insert
on public.guardian_consents
for insert
to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1
    from public.guardian_students gs
    where gs.id = guardian_consents.guardian_student_id
      and gs.student_id = (select auth.uid())
      and gs.guardian_id = guardian_consents.guardian_id
      and gs.status = 'pending'
  )
);
