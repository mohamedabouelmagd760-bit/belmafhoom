create or replace function private.guardian_link_consent_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    if not exists (
      select 1 from public.profiles p
      where p.id = new.guardian_id and p.role = 'guardian' and p.account_status = 'active'
    ) or not exists (
      select 1 from public.profiles p
      where p.id = new.student_id and p.role = 'student' and p.account_status = 'active'
    ) then
      raise exception 'Active guardian and student accounts are required';
    end if;
    if new.status <> 'pending' then
      raise exception 'Guardian link must begin pending';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.guardian_id is distinct from old.guardian_id
     or new.student_id is distinct from old.student_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Guardian link identity is immutable';
  end if;

  if auth.uid() = old.student_id and not private.is_admin() then
    if old.status = 'pending' and new.status = 'active' then
      if not exists (
        select 1 from public.guardian_consents gc
        where gc.guardian_student_id = old.id
          and gc.student_id = old.student_id
          and gc.guardian_id = old.guardian_id
      ) then
        raise exception 'Explicit student consent is required';
      end if;
    elsif not (
      (old.status = 'pending' and new.status = 'rejected')
      or (old.status = 'active' and new.status = 'rejected')
    ) then
      raise exception 'Student can only approve, reject, or revoke a guardian link';
    end if;
  elsif private.is_admin() then
    null;
  else
    raise exception 'Only the linked student or an administrator can confirm this request';
  end if;
  return new;
end;
$function$;

revoke execute on function private.guardian_link_consent_status() from public, anon, authenticated;
revoke execute on function private.prepare_course_enrollment() from public, anon, authenticated;
revoke execute on function private.prepare_teacher_subscription() from public, anon, authenticated;
revoke execute on function private.protect_lesson_progress() from public, anon, authenticated;
revoke execute on function private.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function private.protect_teacher_review() from public, anon, authenticated;
revoke execute on function private.touch_updated_at() from public, anon, authenticated;

create or replace function private.start_exam_attempt(target_exam_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'private'
as $function$
declare
  v_student uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_attempt_no integer;
  v_attempt_id uuid;
  v_started_at timestamptz;
begin
  if v_student is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_student
      and p.role = 'student'
      and p.account_status = 'active'
  ) then
    raise exception 'An active student account is required';
  end if;

  select * into v_exam
  from public.exams
  where id = target_exam_id
  for update;

  if not found or v_exam.status <> 'published' then
    raise exception 'Exam is not available';
  end if;

  if v_exam.available_from is not null and now() < v_exam.available_from then
    raise exception 'Exam has not started';
  end if;

  if v_exam.available_until is not null and now() > v_exam.available_until then
    raise exception 'Exam is closed';
  end if;

  if not exists (
    select 1 from public.course_enrollments e
    where e.course_id = v_exam.course_id
      and e.student_id = v_student
      and e.status = 'active'
  ) then
    raise exception 'Active course enrollment required';
  end if;

  select a.id, a.started_at
  into v_attempt_id, v_started_at
  from public.exam_attempts a
  where a.exam_id = target_exam_id
    and a.student_id = v_student
    and a.status = 'in_progress'
  order by a.started_at desc
  limit 1
  for update;

  if v_attempt_id is not null then
    if now() <= v_started_at + make_interval(mins => v_exam.duration_minutes) then
      return v_attempt_id;
    end if;
    perform private.submit_exam_attempt(v_attempt_id);
  end if;

  select coalesce(max(a.attempt_number), 0) + 1
  into v_attempt_no
  from public.exam_attempts a
  where a.exam_id = target_exam_id
    and a.student_id = v_student;

  if v_attempt_no > v_exam.max_attempts then
    raise exception 'No attempts remaining';
  end if;

  insert into public.exam_attempts(exam_id, student_id, attempt_number)
  values (target_exam_id, v_student, v_attempt_no)
  returning id into v_attempt_id;

  return v_attempt_id;
end;
$function$;

create or replace function private.validate_exam_publish()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_question_count integer;
  v_invalid_count integer;
  v_course_teacher uuid;
  v_course_status text;
begin
  if new.status = 'published' and old.status <> 'published' then
    if not (private.can_manage_course(new.course_id) or private.is_admin()) then
      raise exception 'Not authorized to publish this exam';
    end if;

    select c.teacher_id, c.status::text
    into v_course_teacher, v_course_status
    from public.courses c
    where c.id = new.course_id;

    if not found or v_course_teacher is distinct from new.teacher_id then
      raise exception 'Exam teacher must own the selected course';
    end if;

    if v_course_status <> 'published' then
      raise exception 'The course must be published before its exams';
    end if;

    if not private.is_admin() and not private.teacher_is_publicly_eligible(new.teacher_id) then
      raise exception 'Teacher account must be approved and active';
    end if;

    select count(*) into v_question_count
    from public.exam_questions q
    where q.exam_id = new.id;

    if v_question_count = 0 then
      raise exception 'Add at least one question before publishing';
    end if;

    select count(*) into v_invalid_count
    from public.exam_questions q
    where q.exam_id = new.id
      and (
        (select count(*) from public.exam_choices c where c.question_id = q.id) < 2
        or not exists (
          select 1 from private.exam_answer_keys k where k.question_id = q.id
        )
      );

    if v_invalid_count > 0 then
      raise exception 'Every question needs at least two choices and one correct answer';
    end if;

    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$function$;

revoke execute on function private.validate_exam_publish() from public, anon, authenticated;
