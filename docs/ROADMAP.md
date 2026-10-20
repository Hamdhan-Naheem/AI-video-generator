# AI Video Creator V1 — development roadmap

Source of truth: approved [`PRD.md`](PRD.md) v2.3, especially §§8, 23, 28–31, and [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) v1.0, especially §§2–4, 18, 21–24. This is a plan, not evidence that implementation has begun. No dates, provider plans or final numerical allowances are committed here.

## Milestone sequence and release discipline

M0 proves the risky video path; M1–M4 build the multi-user application; M5 validates it locally and privately; M6 prepares an explicitly approved public deployment. Later implementation details may be refined with evidence without silently changing confirmed product scope or architecture. Track actual status in [`PROGRESS.md`](PROGRESS.md).

The PRD §23 P0/P1/P2 classification controls every exit check: no public release with any failed P0; P1 remains V1 scope and any narrow release exception needs explicit owner approval with impact, mitigation, owner and follow-up; P2 provisional numbers are measured and tracked, while functioning core video, safety and readability remain required.

## M0 — Technical Feasibility

**Objective:** Prove a complete, reviewable 75-second-target electricity Educational Video in Cartoon Teacher style before full feature development.

**Work:**

- Validate a compatible local Node.js/Remotion/browser/media runtime, current Gemini structured-output/image capability, three ElevenLabs English voices/timing, and rights for intended testing. Use the approved providers only; paid use needs separate authorization.
- Build a minimal supervised local runner with human script/scene approval, Zod/registry checks, private atomic checkpoints and versioned authored templates/teacher assets. Avoid building SaaS Auth/UI/queue merely for this proof.
- Generate actual narration and normalized timing; derive scene, subtitle and deterministic mouth/blink/head/gesture cues. Include teacher opening/closing, teacher beside a diagram, and a visual-only explanation scene.
- Render and inspect a playable private vertical MP4. Probe duration, H.264/AAC, audio, dimensions and subtitle-on/off behavior; ensure the subtitle-off variant reuses audio. Target 72–78 seconds for requested 75, within hard 62–90 seconds.
- Measure at least 10 narration/visual anchors, quiet speech and pauses; record P2 timing/reviewer results separately from functional failures. Test text normalization, Unicode/repeated phrases, 62/75/90-second fit, presenter assets, all seven allowed type/style combinations and rejection of two unsupported combinations at feasibility level.
- Inject a render failure and restart; show saved narration/cues are reused. Record stage/total time, peak CPU/RAM, disk/output size, provider units, retries and render/storage/bandwidth estimates. Assess PDF/DOCX/image limits and private upload/runtime feasibility without claiming the SaaS is complete.

**Exit evidence:** Reviewed real electricity MP4; validated plan, approved script, audio/timing/cue records, output probe and visual review; recovery demonstration; resource/provider measurement report; documented unresolved decisions. Functional/unsafe failures block M0; a missed provisional P2 number alone does not.

## M1 — Application Foundation

**Objective:** Establish the local multi-user web/data foundation.

**Work:**

- Set up the shared TypeScript codebase, Next.js App Router/Tailwind web process, independent Node.js worker boundary and development-only Supabase configuration. Pin validated dependencies from M0.
- Implement Supabase email/password signup with mandatory confirmation disabled and immediate own-dashboard access; login/logout, password recovery, session handling, password policy and throttling. Do not add owner allowlists or extra authentication flows.
- Define owner-scoped PostgreSQL/RLS state for users, projects, drafts, revisions, assets, job/control/lifecycle foundations and private Supabase Storage paths. Enforce current account state in addition to token identity.
- Implement dashboard/project creation, minimal account settings, private source upload validation, ownership checks and conflict-safe acknowledged draft saving. Keep secrets server/worker-only.

**Exit evidence:** Two independent development accounts complete signup/login/recovery and see only their own dashboard, drafts and private files; direct cross-user API/RLS/Storage attempts fail; autosave conflicts and session expiry are tested. Foundation remains local and does not imply public readiness.

## M2 — AI Content Planning

**Objective:** Turn each supported source into an accurate, reviewable, immutable approved plan.

**Work:**

- Implement Product, Educational and Project Explainer intake with bounded photos, screenshots, pasted text and supported text-based PDF/DOCX extraction. Handle scans, oversize/malformed input and source limitations honestly.
- Implement the exact three-style compatibility/default matrix and simple automatically selected versioned teacher/presenter presets. Validate all selected templates, actions, claims and character references server-side.
- Queue Gemini understanding, ideas, English scripts, scene plans and refinements through durable worker tasks. Use schema-constrained output where supported plus Zod/semantic checks; never execute model-produced code/URLs.
- Show correctable understanding, especially project status and screenshot limitations. Support script/scene editing, revisions, duration-fit review and explicit approval of an immutable version; invalidate affected approval/artifacts when style or character changes.

**Exit evidence:** All three types and seven compatible type/style combinations yield reviewable plans; two unsupported combinations are rejected in UI and backend; product/project claims are grounded in supplied content; malformed or conflicting sources fail safely; approval points to the exact saved revision.

## M3 — Video Generation Pipeline

**Objective:** Make approved revisions generate recoverable, synchronized private videos through the independent worker.

**Work:**

- Implement atomic job admission/idempotency, per-user/shared reservations, PostgreSQL claims/leases/heartbeats/fencing, progress, checkpoints, bounded retry and reconciliation. Queue all AI work, including scripts and samples.
- Synthesize only approved English narration with ElevenLabs, preserve aligned audio, normalize timing and derive captions, visual anchors and speech-reactive character cues locally. Reuse safe checkpoints and never silently rewrite approved words.
- Render authored Remotion scenes and prepared assets in bounded, credential-free local child work. Enforce preflight, stage and publication checks for ownership, revision, lifecycle and operational state.
- Probe media, duration and audio; publish private output only after conditional exact-revision finalization. Preserve previous Ready versions when new attempts fail, and clean orphan attempts.

**Exit evidence:** A submitted approved job survives browser closure and worker restart; progress and recovery are truthful; duplicate and late results cannot publish; rendered MP4s pass technical and visual checks; provider failures and uncertain outcomes remain bounded and recorded.

## M4 — Application Completion

**Objective:** Complete the user journey and operational safety controls.

**Work:**

- Implement authorized private preview/download, revisions and output history, project duplication and reference-safe project deletion. Keep acknowledged content and old successful outputs during recoverable errors.
- Implement explicit, idempotent permanent account deletion: immediately deny new work/access, fence in-flight jobs, durably clean owned data and Storage before privileged Auth deletion, and resume cleanup after partial failure/restart without affecting other users or shared assets.
- Add backend-configurable generation, script/idea/refinement, sample, concurrency, storage and shared provider limits with transactional reservations and clear recoverable user messages. Defer final numerical values/reset periods to measured evidence.
- Add narrowly authorized backend-only generation pause, account restriction/restoration and content-free audit records. Persist controls; hold/recheck work as specified, while deletion cleanup continues through holds. No admin dashboard, payment flow or automatic upgrade.
- Finish responsive four-stage UX, account settings/deletion confirmation, error recovery, accessibility and private media handling.

**Exit evidence:** Full signup-to-download and revision/duplicate/delete flows work locally; quota and hold races cannot bypass state; deletion survives injected Storage/Auth/restart/late-write failures; other users' work and prior valid content remain isolated and preserved.

## M5 — Local and Private Testing

**Objective:** Execute the full PRD acceptance matrix and measure realistic quality, usage and recovery in local and nonpublic environments.

**Work:**

- Run all three types, approved styles, three voices, source variants, subtitle states and 62/90-second boundaries. Review full videos for claims, readability, captions, synchronization, silence and character behavior; collect P2 timing/completion/usability measures.
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
