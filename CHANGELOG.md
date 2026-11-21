## 2026-11-21 — Exam availability guard
- Hardened `private.start_exam_attempt`: starting an exam now also rechecks that its course is still published, its teacher still owns the course, and that teacher remains approved and active. This closes the stale-publication gap if a course is unpublished, reassigned, or a teacher is suspended after the exam was first published.
- Applied directly to Supabase project `ertbyybmzizpdcaehhkw`; the matching SQL is saved in `supabase/changes/2026-11-21-exam-availability-guard.sql`.

## 2026-11-21 — Final security and workflow hardening
- Corrected guardian consent checks so cross-account role validation runs in a narrowly scoped `SECURITY DEFINER` trigger, while the student-facing RLS policy only checks the pending link owned by that student.
- Removed the unconditional guardian/student pair uniqueness constraint; the partial unique index now blocks only pending/active duplicates and allows a new request after rejection or revocation.
- Restricted trigger-only private helper functions from direct `PUBLIC`, `anon`, and `authenticated` execution.
- Updated trusted maintenance triggers so the project owner can bootstrap the first administrator through a trusted database session without weakening application-user protections.
- Exam starts now require an active student profile, reuse a still-valid in-progress attempt, and finalize an expired attempt before allocating another; exam publishing now requires a published course and an approved, active teacher.
- Restored the missing table grants needed by the actual UI: guardian link updates, exam attempt reads, and admin plan creation. Exam attempts are now read-only to clients; mutations remain behind RPCs.
- Hardened the auth callback's `next` redirect by validating the resolved destination origin, including backslash-based URL edge cases.
- Verified the guardian request → student consent → activation → revocation → re-request flow in a rollback-only database test; verified admin bootstrap and subscription-plan creation in rollback-only tests. Security and Health Advisors return zero lints.

# Changelog

## 2026-11-21 — Dependency security refresh
- Updated Next.js and eslint-config-next from 15.2.4 to 15.5.29, the patched 15.x maintenance release available as of 2026-11-21.
- Updated React and React DOM from 19.0.0 to 19.0.7, the latest published 19.0 patch shown in the React release index.
- Added server-side admin authorization checks to the admin page and every admin Server Action; both trusted JWT `app_metadata.role` and the database profile role must be `admin`.
- Dependency installation and lockfile generation could not be completed because registry.npmjs.org DNS resolution failed in this environment; install and verify dependencies before deployment.

## 2026-11-21 — Sensitive row-update protection
- Added a private trigger guard on profiles and teacher profiles to prevent self-service role/account-status escalation and teacher self-approval.
- Restricted student enrollment updates to payment-proof details; only course owners or trusted admins can review pending enrollment state.
- Restricted teacher subscription updates to proof details while pending; activation periods and review fields remain administrative.
- Preserved the existing dedicated assignment-submission guard (including resubmission grade reset) rather than layering a duplicate trigger over it.
- Verified the five database triggers are attached, the trigger function is not directly executable by anon/authenticated, and Supabase Security/Health Advisors return zero lints.
- Ran rollback-only database checks confirming student self-activation of course enrollments and teacher self-activation of platform subscriptions are blocked; teacher role/approval escalation is blocked while ordinary profile edits and payment-proof uploads remain permitted.

## 2026-11-21 — Consolidated platform update
- Added teacher course editor: course details, sections, lessons, files, YouTube/Vimeo embeds, publish/archive, and pending enrollment review.
- Added student course learning page and short-lived private file links.
- Added assignment creation, publication, student submissions, file attachments, grading, and feedback.
- Added multiple-choice exam authoring, answer-key management, timed attempts enforced by database RPC/RLS, and result pages.
- Added teacher platform subscription requests, manual proof uploads, admin review, and plan management.
- Added guardian link requests, explicit student consent, guardian progress view, and revocation.
- Added profile editing, per-lesson progress tracking, and installable web app manifest/icon.
- Applied guardian consent and admin RLS changes to Supabase project `ertbyybmzizpdcaehhkw`.
- Security Advisor returned no security lints after changes. Full build and real-account tests remain pending because npm dependencies could not be installed in this environment.
- Hardened existing public-table grants: removed `TRUNCATE`, `TRIGGER`, and `REFERENCES` from `anon` and `authenticated`, revoked direct execution of the auth signup trigger function, and restricted exam RPCs to authenticated users. Verified the effective privileges in Supabase.
