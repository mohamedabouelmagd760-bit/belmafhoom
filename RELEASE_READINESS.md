# Belmafhoom — Release Readiness (2026-11-21)

## Verified in the connected Supabase project
- Project `ertbyybmzizpdcaehhkw` reports `ACTIVE_HEALTHY` (Postgres 17.12).
- Security Advisor: zero lints after the latest SQL change.
- Health Advisor: zero lints after the latest SQL change.
- All 25 public application tables have RLS enabled.
- The `belmafhoom-private` storage bucket is private, limited to 50 MiB, and accepts PDF/JPEG/PNG/WEBP.
- Exam RPC wrappers are executable by `authenticated`, not `anon`; internal trigger-only functions are not directly executable by application roles.
- `private.start_exam_attempt` now checks active student, published exam, current course publication, current teacher ownership/eligibility, active enrollment, and reuses a valid in-progress attempt. Its deployed definition was queried and verified.
- No public or materialized views were found in the `public`/`private` schemas during the audit.

## Verified in the source package
- 34 TypeScript/TSX source files transpile with zero syntax diagnostics.
- All relative imports checked resolve to a source file.
- No `dangerouslySetInnerHTML`, `eval`, or embedded service-role/secret key values were found in application source.
- ZIP integrity was checked after packaging.

## Not yet verified / required before production
- `npm install` and lockfile generation are blocked: DNS cannot resolve `registry.npmjs.org`; offline install also fails because the npm cache does not contain `@supabase/ssr` metadata.
- Therefore `next build`, ESLint, full TypeScript type-check, and browser testing have not run.
- No real-user end-to-end tests have been run for student, teacher, guardian, and admin roles.
- No production domain, hosting deployment, email deliverability, or payment gateway is configured.
- Configure the three public environment variables from `.env.example`, set the production Auth redirect URL, create the first admin through the trusted owner channel, then run a complete role-based acceptance test before opening registration.

## Performance note
The current Performance Advisor reports 32 informational `unused_index` findings. This is expected for a newly created database with no meaningful production traffic; do not remove indexes until query statistics from real usage show they are unnecessary.

## Mobile-only deployment preparation
- Added `MOBILE_DEPLOY_GUIDE_AR.md` with a phone-first GitHub/Vercel deployment path, Supabase environment setup, Auth redirect URLs, and pre-launch role-based acceptance checks.
- The guide deliberately does not embed any Supabase API key. The public project URL is prefilled; the owner must copy the public anon/publishable key from Supabase settings into Vercel Environment Variables.
- Deployment remains pending until the owner connects the GitHub/Vercel accounts, the remote build succeeds, and real-user acceptance tests pass.
