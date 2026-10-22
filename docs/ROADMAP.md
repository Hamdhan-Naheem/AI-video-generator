# AI Video Creator V1 — development roadmap

Source of truth: [`PRD.md`](PRD.md) v2.5, especially §§8, 11–12, 23, 28–31, and [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) v1.2, especially §§2–4, 6, 9, 18, 21–24. They record owner-approved alignment decisions dated 22 October 2026; revised documents remain pending owner review. This is a plan, not evidence implementation has begun. No provider plans or final numerical allowances are committed here.

## Milestone sequence and release discipline

M0 proves the risky video path; M1–M4 build the multi-user application; M5 validates it locally and privately; M6 prepares an explicitly approved public deployment. Later implementation details may be refined with evidence without silently changing confirmed product scope or architecture. Track actual status in [`PROGRESS.md`](PROGRESS.md).

The PRD §23 P0/P1/P2 classification controls every exit check: no public release with any failed P0; P1 remains V1 scope and any narrow release exception needs explicit owner approval with impact, mitigation, owner and follow-up; P2 provisional numbers are measured and tracked, while functioning core video, safety and readability remain required.

**Current milestone decision (21 October 2026):** M0 is **Completed / Owner Approved** for the revised local feasibility scope. M1 is next, **Not Started / Planning Prepared** in [M1_IMPLEMENTATION_PLAN.md](M1_IMPLEMENTATION_PLAN.md); implementation requires separate authorization. M2–M6 remain Not Started. The M0 work and exit criteria below remain the approved scope and historical basis for sign-off, with evidence in [PROGRESS.md](PROGRESS.md).

## M0 — Technical Feasibility

**Objective:** Finish offline reliability evidence for the owner-approved, complete 75-second electricity Educational/Cartoon Teacher video and two narrated category demonstrations before full feature development. The 17.27-second LUMA MINI and 28.27-second NORTHSTAR mock videos prove local presentation feasibility, not complete V1 category workflows.

**Work:**

- Preserve the demonstrated local Node.js/Remotion/browser/media runtime, validated Gemini/ElevenLabs electricity path and saved approved assets. Record current Free-plan narration as noncommercial prototype use; commercial use needs rights for the actual recordings and cannot assume a later plan grants retroactive rights.
- Build a minimal supervised local runner with human script/scene approval, Zod/registry checks, private atomic checkpoints and versioned authored templates/teacher assets. Avoid building SaaS Auth/UI/queue merely for this proof.
- Generate actual narration and normalized timing; derive scene, subtitle and deterministic mouth/blink/head/gesture cues. Include teacher opening/closing, teacher beside a diagram, and a visual-only explanation scene.
- Preserve the reviewed 75-second, 1080 × 1920, 30 fps H.264/AAC electricity MP4 and owner-approved narrated product/software drafts. Verify subtitle-enabled and subtitle-disabled rendering behavior with the saved audio; check readability and absence of clipping.
- Strengthen at least 10 narration/scene-transition/subtitle/visual-anchor measurements, quiet speech and pauses; record P2 deviations separately from functional failures. Test text normalization, Unicode/repeated phrases and 62/75/90-second timeline fits using offline data, without claiming real generated 62/90-second exports.
- Inject failure during a bounded local Remotion render and restart from pinned approved assets/narration/cues with zero provider calls. Measure CPU, memory, scratch/output disk and elapsed time; estimate storage/bandwidth from measured sizes and documented assumptions. Record local recovery and rendering constraints.

**Exit evidence:** Three owner-approved narrated prototypes plus observed mid-render failure/local restart with asset reuse, bounded resource and capacity measurements, stronger anchor/subtitle evidence, offline boundary results and documented limitations. The owner accepted this evidence and closed M0 on 21 October 2026. Functional/unsafe failures would have blocked M0; a missed provisional P2 number alone does not. Numeric reviewer scores (PRD §9.3/AC60) and pilot comprehension (PRD §4.2/AC62) remain **Not Verified — P2 evidence outstanding** and are traced to M5 local/private quality evaluation below. Durable worker, private uploads, full voice/style matrix and production isolation have later gates.

## M1 — Application Foundation

**Objective:** Establish the local multi-user web/data foundation.

**Work:**

- Set up the shared TypeScript codebase, Next.js App Router/Tailwind web process, independent Node.js worker boundary and development-only Supabase configuration. Pin validated dependencies from M0.
- Implement Supabase email/password signup with mandatory confirmation disabled and immediate own-dashboard access; login/logout, password recovery, session handling, password policy and throttling. Do not add owner allowlists or extra authentication flows.
- Define owner-scoped PostgreSQL/RLS state for users, projects, drafts, revisions, assets, job/control/lifecycle foundations and private Supabase Storage paths. Enforce current account state in addition to token identity and test direct cross-account access before exposing user data.
- Implement dashboard/project creation, minimal account settings, bounded private source upload validation, ownership checks, failed-upload cleanup/recovery and conflict-safe acknowledged draft saving. Keep secrets server/worker-only.
- Align those existing M1 auth/basic-settings responsibilities with Full Name/Email/Password/Confirm Password/Terms-Privacy signup, matching confirmation without password/confirmation persistence, own-name Save Changes, read-only email and secure authenticated provider-supported password change with reauthentication where required. Legal content, acknowledgement interaction and any recording policy remain owner decisions before affected implementation; no consent schema is assumed. M4 retains full lifecycle and deletion. Shared UI foundations use one Pearl & Ocean Teal system and five-step Studio shell without moving later AI functionality into M1.

**Exit evidence:** Two independent development accounts complete signup/login/recovery and see only their own dashboard, drafts and private files; direct cross-user API/RLS/Storage attempts fail; malformed/failed uploads recover without leaking or publishing partial data; autosave conflicts and session expiry are tested. Foundation remains local and does not imply public readiness.

## M2 — AI Content Planning

**Objective:** Turn each supported source into an accurate, reviewable, immutable approved plan.

**Work:**

- Implement Product, Educational and Project Explainer intake with bounded photos, screenshots, pasted text and supported text-based PDF/DOCX extraction. Test current Gemini image/structured-output and long-document behavior. Handle scans, mixed pages, malicious expansion, oversize/malformed input and source limitations honestly.
- Implement the exact three-style compatibility/default matrix and simple automatically selected versioned teacher/presenter presets. Validate all selected templates, actions, claims and character references server-side.
- Queue Gemini understanding, ideas, English scripts, scene plans and refinements through durable worker tasks. Use schema-constrained output where supported plus Zod/semantic checks; never execute model-produced code/URLs.
- Show correctable understanding, especially project status and screenshot limitations. Support script/scene editing, revisions, duration-fit review and explicit approval of an immutable version; invalidate affected approval/artifacts when style or character changes.

**Exit evidence:** All three types and seven compatible type/style combinations yield reviewable plans; two unsupported combinations are rejected in UI and backend; product/project claims are grounded in supplied content; malformed or conflicting sources fail safely; approval points to the exact saved revision. This is planning coverage, not proof every layout renders.

## M3 — Video Generation Pipeline

**Objective:** Make approved revisions generate recoverable, synchronized private videos through the independent worker.

**Work:**

- Implement atomic job admission/idempotency, per-user/shared reservations, PostgreSQL claims/leases/heartbeats/fencing, progress, checkpoints, bounded retry and reconciliation. Queue all AI work, including scripts and samples; prove accepted jobs recover after a worker restart.
- Verify all three English voice presets, Flash/timestamp compatibility, samples, normalized timing and intended-use rights before synthesis. Synthesize only approved words, preserve aligned audio and derive captions, visual anchors and speech-reactive character cues locally. Reuse safe checkpoints.
- Render all seven compatible type/style pairs with prepared teacher/presenter assets and readable source-grounded photo/diagram/screenshot/character layouts in bounded, credential-free child work. Enforce preflight, stage and publication checks for ownership, revision, lifecycle and operational state.
- Probe media, audio and real generated 62/75/90-second duration fits and return-to-review paths; publish private output only after conditional exact-revision finalization. Preserve previous Ready versions when new attempts fail; recover failed uploads and clean orphan attempts.

**Exit evidence:** A submitted approved job survives browser closure and worker restart; leases, fencing, checkpoints and upload recovery are demonstrated; three voices and all seven pairs are exercised; real lower/default/upper duration cases pass or return to review without silent rewriting; rendered MP4s pass technical and visual checks; provider failures and uncertain outcomes remain bounded and recorded.

## M4 — Application Completion

**Objective:** Complete the user journey and operational safety controls.

**Work:**

- Implement authorized private preview/download, revisions and output history, project duplication and reference-safe project deletion. Keep acknowledged content and old successful outputs during recoverable errors.
- Implement explicit, idempotent permanent account deletion: immediately deny new work/access, fence in-flight jobs, durably clean owned data and Storage before privileged Auth deletion, and resume cleanup after partial failure/restart without affecting other users or shared assets.
- Add backend-configurable generation, script/idea/refinement, sample, concurrency, storage and shared provider limits with transactional reservations and clear recoverable user messages. Defer final numerical values/reset periods to measured evidence.
- Add narrowly authorized backend-only generation pause, account restriction/restoration and content-free audit records. Persist controls; hold/recheck work as specified, while deletion cleanup continues through holds. No admin dashboard, payment flow or automatic upgrade.
- Finish responsive five-step Studio UX, integrated basic settings and separately placed mandatory deletion/confirmation/recovery, error handling, accessibility and private media. Script/scenes are explicitly approved in Step 2, with complete configuration separately confirmed in Step 4 after Step 3 settings; both decisions remain backend-enforced before full generation.

**Exit evidence:** Full signup-to-download and revision/duplicate/delete flows work locally; quota and hold races cannot bypass state; deletion survives injected Storage/Auth/restart/late-write failures; other users' work and prior valid content remain isolated and preserved.

## M5 — Local and Private Testing

**Objective:** Execute the full PRD acceptance matrix and measure realistic quality, usage and recovery in local and nonpublic environments.

**Work:**

- Run all three types, approved styles, three voices, source variants, subtitle states and 62/90-second boundaries. Review full videos for claims, readability, captions, synchronization, silence and character behavior; collect P2 timing/completion/usability measures. Specifically collect the outstanding numeric owner/tester speech, readability and distraction scores (PRD §9.3/AC60) and pilot-user comprehension results (PRD §4.2/AC62); record actual evidence without treating M0 owner approval as those measurements.
- Use at least two independent accounts for complete private journeys, simultaneous queue admission and fairness, direct cross-user API/RLS/Storage attacks, stale sessions, password recovery and signup-abuse review.
- Inject worker crashes, provider throttling/uncertain outcomes, duplicate requests, quota races, render/upload failures, account/project deletion, Storage/Auth failures, late writes, pause/restriction/restoration and partial cleanup. Verify safe resume and another user's unaffected state.
- Measure provider units, CPU/RAM/disk, stage and queue time, storage/egress and capacity; choose justified backend limit values/reset periods. Validate recovery email, private upload limits, retention/backup and operator audit behavior.
- Record each PRD §23 acceptance ID with priority, result, evidence and owner. Fix P0 failures; document P1 issues for resolution or explicit narrow exception review; track P2 misses without overstating guarantees.

**Exit evidence:** Local and private-test evidence covers the entire matrix; all P0 pass, required P1 outcomes are known, P2 measures are visible, and no unresolved isolation, data-loss, unsafe execution or unbounded billing/retry issue remains.

## M6 — Public Deployment Preparation

**Objective:** Prepare a controlled production release after M0–M5 and release checks.

**Work:**

- Select an independent Node.js worker host from measured CPU/RAM/disk/browser/native-media/deadline needs. Configure Vercel web/lightweight APIs, production Supabase and worker with isolated production secrets/data/queues; prove local/development workers cannot claim production jobs.
- Verify production email recovery/redirects, private Storage, operational authority, configured quotas/ceilings, monitoring, reconciliation, audit, backup/restore, retention/deletion policy and incident/runbook ownership.
- Confirm applicable provider, voice, artwork and hosting rights/terms, actual operating costs and data handling. Seek explicit approval before any paid activation or public deployment.
- Re-run production-specific P0 gates, including worker processing while development computer is off and browsers closed. Record any P1 exception with explicit owner approval, impact, mitigation, owner and follow-up; retain P2 measurements.
- Prepare the release checklist and owner review. Open public signup only after all P0 gates pass and deployment approval is recorded.

**Exit evidence:** Documented release checklist, isolated working production topology and independent worker validation, rights/cost decisions, approved P1 exceptions if any, P2 record and explicit deployment authorization. Preparation does not itself authorize activation or launch.

## Owner-approved post-V1 enhancement backlog

The owner approved these capabilities as conditional **post-V1** work, not V1 scope or M0–M6 exit criteria. PRD v2.5 §27 retains the v2.4 exclusions of background music and advanced branding, while §§8–9 and AC09/F20 retain simple character presets and exactly three presentation styles. A later request to move an item into V1 would require an explicit PRD revision and, where provider/media/worker boundaries change, an architecture review. Visual themes vary appearance within an approved style; they do not add a fourth style or sixth Studio step.

M1–M6 labels in the dependency descriptions below identify the existing subsystem that a later post-V1 project would extend; they do not schedule this work into current V1 milestones.

| Approved post-V1 capability | Dependency sequence for later implementation | Placement |
| --- | --- | --- |
| AI-recommended colors, backgrounds and visual themes from a user's prompt | M2: use Gemini to propose allowlisted, versioned palette/background/theme IDs with contrast/readability checks and user review; M3: render those IDs deterministically; M5: test claims, legibility and reproducibility | Post-V1 enhancement |
| Manual background color, theme and light branding choices | M2: bind validated choices to the approved revision; M3: render the selected variant; M4: add simple controls within Video Details / Script & Storyboard and preserve prior results; M5: test accessibility and saved-state behavior. A brand library/setup product remains outside the current PRD | Post-V1 enhancement |
| Customizable prepared cartoon characters and voice-character matching | M2: extend the versioned character/voice compatibility registry and approval rules; M3: reuse basic speech cues with the selected compatible asset; M4: add selection controls; M5: test all supported combinations, defaults, rights and stale revisions. Define the extent of customization before implementation; arbitrary generated/rigged avatars are not implied | Post-V1 enhancement |
| Optional background music for all three categories, using properly licensed tracks or user-provided audio | M1: private upload, ownership, file validation and rights metadata for user audio; M2: include the music choice in review/approval; M3: bounded local mixing; M4: music selection/on-off controls; M5: audio quality, rights and source/deletion tests; M6: commercial-rights review | Post-V1 enhancement |
| Music volume, fade-in/out and narration-aware ducking | M3: deterministic mix against the narration master clock with clipping/peak guards and reusable checkpoints; M4: bounded user controls; M5: test speech intelligibility, quiet passages, transitions and exports across all categories | Post-V1 enhancement, after the licensed/user-audio path |
| Optional AI-generated music | First decide provider, costs, licensing, privacy, moderation and failure limits; then adapt M2 approval, M3 generation/checkpoint/mixing and M5 rights/quality tests. A new AI provider or paid feature requires separate architecture and service authorization | Later post-V1 enhancement, after the basic music path |

**Post-V1 implementation order:** establish validated theme/character/music identities and rights first; bind selections to immutable approvals; render/mix from those snapshots; add controls inside the existing five Studio steps; then run cross-category, accessibility, ownership and licensing tests. Do not implement these items during M0–M6 without a new approved scope decision.

## Approved acceptance rescheduling trace

Every row remains a V1 obligation under PRD §§23, 28–29. The first milestone listed owns implementation and its direct tests; M5 verifies complete integrated scenarios. Commercial rights must be confirmed before any actual commercial use and again at M6 release review.

| Requirement formerly listed among M0 feasibility checks | Destination and dependency | Expected evidence |
| --- | --- | --- |
| Private uploads/Storage and failed-upload recovery | M1 when private Storage and ownership paths are introduced; M3 for generated-artifact checkpoint/publication integration; M5 regression | Bounded upload, authorized private access, failed-upload cleanup/retry, no partial or cross-user publication |
| Multiuser isolation and authorization | M1 with Auth, database and RLS; M5 adversarial regression | Two-account signup/recovery, direct cross-user API/RLS/Storage denials and current-account checks |
| Gemini image/long-document/source-grounded inputs and PDF/DOCX limits | M2 after M1 intake foundation; M5 end-to-end | Real bounded image/document cases, grounded claims and safe scan/malformed/expansion rejection |
| Seven compatible type/style combinations and presenter | M2 plan/registry validation, M3 render/asset coverage, M5 full visual matrix | Seven valid plans and renders, two invalid pairs rejected, prepared presenter and readable scenes |
| Three English voices and samples | M3 when narration/selection pipeline is built; M5 full matrix | Each configured voice produces authorized sample and full narration/timing without silent substitution |
| Real generated 62/90-second duration boundaries | M3 when complete production rendering exists; M5 integration | Actual probed 62/75/90 outputs or explicit return-to-review for out-of-window speech |
| Durable jobs, leases and worker restart | M3 with persistent job system; M5 crash/failure matrix | Accepted job survives restart, fenced stale claims, bounded retries and preserved approved work |
| Production queue, storage and rendering integration | M3 implementation after M1 foundation, M5 complete test; M6 production topology | Private exact-revision publication, orphan cleanup, queue/resource limits and isolated independent worker |
| Full cross-feature acceptance | M5 after M1–M4 implementation, M6 production-specific gates | PRD §23 P0/P1/P2 evidence matrix, all P0 passed before release |
