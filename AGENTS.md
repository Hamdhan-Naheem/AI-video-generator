# Codex project instructions — AI Video Creator V1

## Authority and scope

- Read `docs/PRD.md` (approved v2.3) and `docs/SYSTEM_ARCHITECTURE.md` (approved v1.0) before planning or changing implementation. The PRD defines product requirements and release priorities; the architecture defines the selected system boundaries. Do not silently change either approved document.
- This file and `docs/ROADMAP.md` organize future work; they do not supersede the approved documents. Record a conflict or material change for project-owner review before implementing a different product/architecture decision.
- Respect the scope of each request. Documentation setup alone does not authorize application code, dependency installation, external service configuration, provider calls, deployment, or paid usage.

## Fixed V1 product rules

- Build a multi-user SaaS, developed locally first, privately tested, then considered for public release. Do not replace multi-user authorization with an owner allowlist.
- Keep one dashboard and four creation stages: Describe → Review Script → Generate and Preview → Download.
- Support exactly three video types: Product Video, Educational Video, Project Explainer. Support exactly three independent presentation styles: Animated Explainer, Cartoon Teacher, Cartoon Presenter. Teacher is allowed only for Educational Video; the other two styles follow the compatibility/default matrix in PRD §8.
- Produce English narration, English text/subtitles by default, three English voice presets, and private vertical 9:16 H.264/AAC MP4 output of 62–90 seconds inclusive (default requested target 75 seconds). A user's approved narration must not be silently rewritten.
- Use prepared 2D teacher/presenter assets with basic speech-reactive mouth activity, pause closure, blink, subtle head motion and limited gestures. Do not promise phoneme-accurate lip sync or substitute a paid avatar provider.
- Preserve acknowledged drafts and earlier successful outputs across revisions and recoverable failures. Enforce ownership, current account state, private files, immutable approved revisions, bounded work and recoverable account deletion.

## Technology and system decisions

- Use Next.js App Router, React, TypeScript and Tailwind CSS for the web app; lightweight Next.js Route Handlers for authenticated operations; Zod plus server-side validation at trust boundaries.
- Use Gemini for understanding/planning, ElevenLabs for English narration and timing, and Remotion with authored React components for rendering. Treat model output as validated data selecting allowlisted components, never executable code or arbitrary URLs. Derive cartoon speech cues locally from audio/timing.
- Use Supabase Auth (email/password signup without mandatory confirmation, immediate private dashboard, login/logout and separate email-link recovery), PostgreSQL with RLS for durable owner-scoped state, and private Supabase Storage for assets and outputs.
- Keep one shared codebase with two application processes: Next.js and an independent Node.js worker. Queue all AI work in PostgreSQL with atomic admission/reservations, leases, checkpoints, fencing and recovery; do not render within web requests. Use an internal worker reconciliation loop for stale work and cleanup. No new broker, separate Express service or microservice estate without a reviewed decision.
- M0 is a minimal supervised local runner with private checkpoints and a real reviewed MP4. It does not require the complete SaaS UI/Auth/queue and does not count as proof of multi-user release safety. Reuse its provider, validation, timing and rendering components later.
- Keep development, private-test and production configuration/data/credentials separate. Production requires Vercel for web/lightweight APIs, production Supabase, and an independently hosted worker that runs without a user's browser or the development computer. Select exact versions, worker host, numerical limits and plans from M0/private-test evidence; do not assume free commercial usage.
- Do not add authentication methods, AI/avatar providers, admin dashboard, payments, fixed free-video entitlement or additional V1 stages outside the approved scope. Paid service activation and public deployment require explicit authorization.

## Development workflow

1. Check `docs/PROGRESS.md` and the relevant PRD acceptance criteria/architecture sections before each milestone task. Work in roadmap order unless the project owner directs otherwise.
2. For M0, validate the complete 75-second-target electricity Cartoon Teacher path before full application implementation. Record actual output, resource/provider measurements, recovery evidence, functional issues and P2 measurements separately.
3. Keep domain rules shared across web and worker but revalidate at each trust boundary. Version approved plans, templates, character assets and task snapshots; reject stale or incompatible work. Avoid exposing secrets to the browser, renderer children, logs or committed files.
4. Make changes in reviewable increments. Document unresolved choices, reasons for changed proposed defaults, affected acceptance criteria and follow-up tests. Do not treat a proposed numeric target as an already verified guarantee.
5. Update `docs/PROGRESS.md` only from observed evidence. Record milestone status, completed items, remaining items, test evidence, blockers and decisions. A roadmap checklist is a plan, not proof of completion.

## Verification and release rules

- Write meaningful tests for schema/timing/cue rules, API/RLS ownership, admission/quota races, durable-job crash/retry/fencing, account deletion, operational holds and full browser flows as those features are built. Include direct cross-user data/Storage attempts and at least two independent accounts.
- Inspect rendered videos visually and audibly for all allowed type/style combinations, voices, duration boundaries, subtitles, readable layout, quiet/paused speech activity and approved claims. Probe MP4 format/duration/audio; a successful probe alone does not establish quality.
- Exercise worker restart, provider uncertainty, Storage and Auth cleanup failures, late artifacts, stale sessions, deletion during work, pause/restriction/restoration, quota exhaustion and preservation of other users' data.
- Track PRD §23 criteria by ID and priority. Every P0 must pass before public deployment, with no waiver. P1 is required V1 behavior; a narrow exception needs explicit owner approval and a recorded impact, mitigation, owner and follow-up. Measure P2 targets without treating a missed provisional number as an automatic release failure or excusing broken core behavior.
- Complete local development and private multi-account testing before M6 release preparation. Confirm licensing, costs, environment isolation, recovery email, backend operator access, backup/retention policy, and independent worker operation before seeking public deployment approval.

## Progress tracking

- `docs/ROADMAP.md` holds planned milestone tasks and exit evidence. `docs/PROGRESS.md` holds actual status and evidence.
- Use `Not Started`, `In Progress`, `Blocked`, or `Complete` for each M0–M6 milestone. Advance to `Complete` only when its exit conditions are evidenced; record a date and evidence location. Preserve honest partial status and blockers.
- Keep the completed-documentation inventory separate from implementation status. Documentation completion does not start M0 or satisfy any implementation/release acceptance check.
