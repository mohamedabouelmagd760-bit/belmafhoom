grant select on public.exam_attempts to authenticated;
revoke insert, update, delete on public.exam_attempts from authenticated;

grant update on public.guardian_students to authenticated;

grant insert on public.teacher_subscription_plans to authenticated;
