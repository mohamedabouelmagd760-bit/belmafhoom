-- Applied to Supabase project ertbyybmzizpdcaehhkw on 2026-11-21.
-- Defense-in-depth: remove table privileges that bypass RLS or allow schema changes.

REVOKE TRUNCATE, TRIGGER, REFERENCES
ON ALL TABLES IN SCHEMA public
FROM anon, authenticated;

-- This function is invoked by the auth.users trigger and is not an RPC endpoint.
REVOKE EXECUTE ON FUNCTION private.handle_new_user()
FROM PUBLIC, anon, authenticated;

-- Exam workflows require a signed-in user. Do not expose these RPCs to anon/PUBLIC.
REVOKE EXECUTE ON FUNCTION public.set_exam_answer_key(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.start_exam_attempt(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_exam_attempt_result(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.set_exam_answer_key(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_exam_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_attempt_result(uuid) TO authenticated;

-- Verification queries (expected: all false except authenticated RPC checks).
SELECT
  has_table_privilege('anon', 'public.profiles', 'TRUNCATE') AS anon_can_truncate,
  has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE') AS authenticated_can_truncate,
  has_table_privilege('anon', 'public.profiles', 'TRIGGER') AS anon_can_create_trigger,
  has_table_privilege('authenticated', 'public.profiles', 'REFERENCES') AS authenticated_can_add_reference,
  has_function_privilege('anon', 'private.handle_new_user()', 'EXECUTE') AS anon_can_call_signup_trigger,
  has_function_privilege('anon', 'public.start_exam_attempt(uuid)', 'EXECUTE') AS anon_can_start_exam,
  has_function_privilege('authenticated', 'public.start_exam_attempt(uuid)', 'EXECUTE') AS authenticated_can_start_exam;
