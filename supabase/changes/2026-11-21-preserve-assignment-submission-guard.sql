-- Keep the dedicated assignment-submission guard as the sole guard for that table.
-- It already enforces student resubmission and teacher grading transitions, including clearing stale grades.
-- Applied to Supabase project ertbyybmzizpdcaehhkw on 2026-11-21.

drop trigger if exists guard_assignment_submissions_sensitive_updates on public.assignment_submissions;

create or replace function private.guard_sensitive_updates()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Allow trusted database maintenance roles and users whose signed JWT has the trusted admin claim.
  if (select private.is_admin()) then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if new.role is distinct from old.role
       or new.account_status is distinct from old.account_status
       or new.id is distinct from old.id then
      raise exception 'Administrative profile fields can only be changed by an administrator'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_table_name = 'teacher_profiles' then
    if new.user_id is distinct from old.user_id
       or new.review_status is distinct from old.review_status
       or new.reviewed_at is distinct from old.reviewed_at
       or new.reviewed_by is distinct from old.reviewed_by
       or new.review_note is distinct from old.review_note then
      raise exception 'Teacher review fields can only be changed by an administrator'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_table_name = 'course_enrollments' then
    if old.student_id = (select auth.uid()) then
      if old.status <> 'pending'
         or new.status is distinct from old.status
         or new.payment_status is distinct from old.payment_status
         or new.amount is distinct from old.amount
         or new.currency is distinct from old.currency
         or new.course_id is distinct from old.course_id
         or new.student_id is distinct from old.student_id
         or new.teacher_id is distinct from old.teacher_id
         or new.teacher_confirmed_at is distinct from old.teacher_confirmed_at
         or new.id is distinct from old.id then
        raise exception 'Students may only update payment proof details on pending enrollments'
          using errcode = '42501';
      end if;
      return new;
    end if;

    if private.can_manage_course(old.course_id) then
      if old.status <> 'pending'
         or new.student_id is distinct from old.student_id
         or new.teacher_id is distinct from old.teacher_id
         or new.course_id is distinct from old.course_id
         or new.amount is distinct from old.amount
         or new.currency is distinct from old.currency
         or new.proof_path is distinct from old.proof_path
         or new.payment_method is distinct from old.payment_method
         or new.id is distinct from old.id
         or new.status not in ('active','rejected')
         or new.payment_status not in ('paid','rejected') then
        raise exception 'Teachers may only review pending course enrollments'
          using errcode = '42501';
      end if;
      return new;
    end if;

    raise exception 'Not authorized to update this enrollment'
      using errcode = '42501';
  end if;

  if tg_table_name = 'teacher_subscriptions' then
    if old.teacher_id = (select auth.uid()) then
      if old.status <> 'pending'
         or new.status is distinct from old.status
         or new.teacher_id is distinct from old.teacher_id
         or new.plan_id is distinct from old.plan_id
         or new.amount is distinct from old.amount
         or new.currency is distinct from old.currency
         or new.period_start is distinct from old.period_start
         or new.period_end is distinct from old.period_end
         or new.reviewed_by is distinct from old.reviewed_by
         or new.reviewed_at is distinct from old.reviewed_at
         or new.id is distinct from old.id then
        raise exception 'Teachers may only update proof details on pending subscriptions'
          using errcode = '42501';
      end if;
      return new;
    end if;

    raise exception 'Not authorized to update this subscription'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_sensitive_updates() from public, anon, authenticated;
