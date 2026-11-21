-- Prevent authenticated account owners from editing administrative or financial state.
-- Applied to Supabase project ertbyybmzizpdcaehhkw on 2026-11-21.

create or replace function private.guard_sensitive_updates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_course uuid;
begin
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

  if tg_table_name = 'assignment_submissions' then
    if old.student_id = (select auth.uid()) then
      if old.status not in ('submitted','returned')
         or new.status <> 'submitted'
         or new.assignment_id is distinct from old.assignment_id
         or new.student_id is distinct from old.student_id
         or new.grade is distinct from old.grade
         or new.feedback is distinct from old.feedback
         or new.graded_by is distinct from old.graded_by
         or new.graded_at is distinct from old.graded_at
         or new.id is distinct from old.id then
        raise exception 'Students may only submit or resubmit their own answers'
          using errcode = '42501';
      end if;
      return new;
    end if;

    select a.course_id into target_course
    from public.assignments a
    where a.id = old.assignment_id;

    if target_course is not null and private.can_manage_course(target_course) then
      if new.assignment_id is distinct from old.assignment_id
         or new.student_id is distinct from old.student_id
         or new.answer_text is distinct from old.answer_text
         or new.file_path is distinct from old.file_path
         or new.submitted_at is distinct from old.submitted_at
         or new.id is distinct from old.id
         or new.status not in ('graded','returned')
         or new.graded_by is distinct from (select auth.uid())
         or new.graded_at is null then
        raise exception 'Teachers may only grade or return submissions for their courses'
          using errcode = '42501';
      end if;
      return new;
    end if;

    raise exception 'Not authorized to update this submission'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.guard_sensitive_updates() from public, anon, authenticated;

drop trigger if exists guard_profiles_sensitive_updates on public.profiles;
create trigger guard_profiles_sensitive_updates
before update on public.profiles
for each row execute function private.guard_sensitive_updates();

drop trigger if exists guard_teacher_profiles_sensitive_updates on public.teacher_profiles;
create trigger guard_teacher_profiles_sensitive_updates
before update on public.teacher_profiles
for each row execute function private.guard_sensitive_updates();

drop trigger if exists guard_course_enrollments_sensitive_updates on public.course_enrollments;
create trigger guard_course_enrollments_sensitive_updates
before update on public.course_enrollments
for each row execute function private.guard_sensitive_updates();

drop trigger if exists guard_teacher_subscriptions_sensitive_updates on public.teacher_subscriptions;
create trigger guard_teacher_subscriptions_sensitive_updates
before update on public.teacher_subscriptions
for each row execute function private.guard_sensitive_updates();

drop trigger if exists guard_assignment_submissions_sensitive_updates on public.assignment_submissions;
create trigger guard_assignment_submissions_sensitive_updates
before update on public.assignment_submissions
for each row execute function private.guard_sensitive_updates();
