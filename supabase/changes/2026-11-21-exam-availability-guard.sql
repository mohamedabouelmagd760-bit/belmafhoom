-- Keep an already-published exam unavailable when its course is unpublished,
-- reassigned, or its teacher is no longer approved and active.
-- Applied directly to Supabase project ertbyybmzizpdcaehhkw on 2026-11-21.

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
    select 1
    from public.courses c
    where c.id = v_exam.course_id
      and c.teacher_id = v_exam.teacher_id
      and c.status = 'published'
      and private.teacher_is_publicly_eligible(c.teacher_id)
  ) then
    raise exception 'The course or teacher is no longer available';
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
