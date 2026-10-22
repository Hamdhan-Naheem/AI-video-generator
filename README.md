# AI Video Creator V1

AI Video Creator is a planned multi-user web application for turning a user's ideas, photos, educational topics, screenshots and supported documents into private, narrated, downloadable videos. Users review the AI's understanding and script before generation. Development begins locally, proceeds through private multi-account testing, and reaches public deployment only after the approved release gates pass.

**Current status (21 October 2026): M0 — Completed / Owner Approved. M1 — Not Started / Planning Prepared.** The approved local feasibility work produced the electricity, LUMA MINI and NORTHSTAR narrated videos and recorded local recovery, resource, timing and subtitle evidence. The multi-user SaaS remains future work; [the M1 implementation plan](docs/M1_IMPLEMENTATION_PLAN.md) is documentation only and requires separate authorization before coding or service setup. Numeric reviewer scores and pilot comprehension remain **Not Verified — P2 evidence outstanding**, assigned to M5 quality/private testing.

## V1 at a glance

- One dashboard; exactly five shared-layout Studio steps: Video Details → Script & Storyboard → Voice & Subtitles → Generate Video → Preview & Download.
- Separate script/scene approval and final complete-configuration confirmation; preliminary approval does not start full narration/rendering.
- Signup includes Full Name, Email Address, Password, matching Confirm Password and Terms/Privacy acknowledgement; email/password remain credentials, with immediate session/dashboard and no mandatory email confirmation. Basic settings allow own-name editing, read-only email and secure authenticated password change; mandatory account deletion remains.
- Three video types: Product Video, Educational Video and Project Explainer.
- Three presentation styles: Animated Explainer, Cartoon Teacher and Cartoon Presenter. Cartoon Teacher applies only to Educational Video; see the full matrix in `docs/PRD.md` §8.
- English narration and three English voice presets; English subtitles and on-video text by default.
- Private vertical 9:16 H.264/AAC MP4, 62–90 seconds inclusive, with a default requested target of 75 seconds.
- Prepared 2D characters with basic speech-reactive animation; no manual timeline editor or realistic human avatar.

## Selected technology

| Area | Decision |
| --- | --- |
| Web | Next.js App Router, React, TypeScript, Tailwind CSS, lightweight Route Handlers |
| Validation | Zod and server-side input/media checks |
| Planning and speech | Gemini for content planning; ElevenLabs for English narration and timing |
| Video | Remotion, authored React components and bounded local media utilities |
| Identity, data and files | Supabase Auth, PostgreSQL with RLS, private Supabase Storage |
| Background work | Independent Node.js worker with PostgreSQL-backed durable tasks, leases and recovery |
| Public deployment, after approval | Vercel web/API, production Supabase and a separately hosted worker |

The offline prototype pins Remotion/CLI 4.0.537, React/React DOM 19.2.9 and TypeScript 5.9.3. Provider model/voice versions, final resource limits and production worker hosting remain later decisions. No paid service is activated by Phase 1.

## Documents

- [`docs/PRD.md`](docs/PRD.md) — v2.5 records owner-approved UX/signup/settings alignment; revised document pending review, all acceptance IDs/priorities retained.
- [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) — v1.2 corresponding UX/profile/approval responsibilities; technical boundaries preserved, revised document pending review.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned M0–M6 work and exit evidence.
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — actual milestone status, decisions and evidence.
- [`docs/M1_IMPLEMENTATION_PLAN.md`](docs/M1_IMPLEMENTATION_PLAN.md) — reviewable M1 foundation phases and requirement-to-test matrix; planning only.
- [`docs/UI_UX_DESIGN.md`](docs/UI_UX_DESIGN.md) — v0.2, Draft / Owner Review; shared design system, five-step screens, missing Stitch references and alignment audit in §14.1.
- [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) — v0.1 technical design for owner review: owned entities, private Storage/RLS, immutable approvals, durable work and staged schema responsibilities; no migrations applied.
- [`docs/API_DESIGN.md`](docs/API_DESIGN.md) — v0.1 technical design for owner review: Auth/domain/worker contracts and all 63 acceptance criteria mapped to planned verification; no endpoints implemented.
- [`AGENTS.md`](AGENTS.md) — permanent instructions for Codex contributors.

The phase sections below preserve what was known at each stage. For current status and acceptance scope, use the status above and the formal sign-off in `docs/PROGRESS.md` together with the authoritative PRD and roadmap.

## Local M0 Phase 1 setup

Use Node.js 22 or newer and npm 10 or newer from the project root. The tested local versions were Node.js 22.12.0 and npm 10.9.0. Install the pinned packages from `package-lock.json`:

```powershell
npm ci
```

Run the offline preview or render:

```powershell
npm run preview
npm run render:demo
```

`preview` starts the local Remotion Studio. `render:demo` writes `output/offline-electricity-demo.mp4` (6 seconds, 1080 × 1920, 30 fps). The render is a silent layout and animation proof with synthetic mouth states and placeholder captions. It does not use Gemini, ElevenLabs, real speech alignment or audio-based mouth cues. The first render may download Remotion's local headless browser runtime.

Run the offline checks:

```powershell
npm run typecheck
npm run validate:offline
npm run check:env
```

`validate:offline` typechecks and lists the registered composition. `check:env` is a server-only local key-name presence check; it loads the existing root `.env` using Node.js and prints no values. It does not call either provider. On 20 October 2026, `check:env` passed with both required provider variable names present. Do not copy key values into source or docs.

Both Remotion commands explicitly load `.env.example`, which contains placeholders only, because the Remotion CLI otherwise reads `.env` by default. The private root `.env` is never imported into a composition or browser bundle. `.env`, local npm cache, dependencies and `output/` are Git-ignored. No keys are needed to render this offline demo.

M0 next needs a supervised approved script/scene plan, real ElevenLabs timing, local audio-derived cues, a complete 75-second render and resource/recovery measurements. Those are not Phase 1 outcomes. The later SaaS foundation will run local Next.js and an independent worker against a development Supabase environment. Public hosting and paid use require separate approval.

## M0 Phase 2A — offline planning and review

This phase adds [runtime planning schemas](m0/src/planning/schema.ts), an [authored template/action registry](m0/src/planning/registry.ts), a [prompt and JSON response schema](m0/src/planning/prompt.ts), and a [server-only Gemini REST adapter](m0/src/planning/gemini.ts). The adapter accepts an injected transport for offline tests, makes one request when explicitly invoked, has a timeout, performs no automatic retry, and validates the result locally with Zod. Model ID is configurable with `GEMINI_MODEL` in the existing root `.env`. For the Phase 2B attempt, the configured model was `gemini-3.8-flash`. Google's [model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) lists structured outputs, its [pricing](https://ai.google.dev/gemini-api/docs/pricing) lists Free-tier Standard access, and the selected project displayed Free tier in Google AI Studio. The request shape follows Google's [Generate Content API](https://ai.google.dev/api/generate-content).

The package lock pins Zod 4.5.4 to match Remotion 4.0.537, and `tsx` 4.23.15 runs only local TypeScript commands and tests.

The planning registry accepts exactly five educational Cartoon Teacher storyboard layouts: `teacher_intro_v1`, `teacher_explanation_v1`, `teacher_beside_diagram_v1`, `full_screen_diagram_v1`, and `teacher_conclusion_v1`. Phase 4A implements these five layouts for the approved electricity draft. The Gemini prompt and response schema list only these layouts and documented action IDs, including layout-specific allowed actions. Local validation rejects unsupported templates, actions and type/style combinations, as well as mismatched character/diagram visuals or misplaced introduction/conclusion scenes.

The existing `electricity_teacher_diagram_demo_v1` is a fixed six-second, standalone preview composition, not a supported 75-second storyboard template. [Render preflight](m0/src/planning/render-readiness.ts) checks the registry and rejects unknown, preview-only or unimplemented layouts before the draft is prepared. `render:demo` remains the separate Phase 1 proof. Product Video and Project Explainer input types and compatibility rules exist, but their rendering workflows are later work.

The seven-scene, 75-second estimate in [`m0/fixtures/electricity-plan.fixture.json`](m0/fixtures/electricity-plan.fixture.json) is an **offline handwritten fixture**, not Gemini output or measured narration. It uses all five planning layouts: teacher introduction, teacher explanation, teacher beside turbine and grid diagrams, full-screen generator and transmission diagrams, and teacher conclusion. Scene estimates sum to 75 seconds; real speech timing has not been measured. A human must review scientific accuracy, wording, visuals and estimated length.

### Local review workflow

From the project root, create the candidate once and read its complete narration and scenes:

```powershell
npm run plan:fixture
npm run plan:show
```

This writes ignored files under `m0/runs/electricity/`: `candidate.json`, `review.md`, and `review-state.json`. The candidate starts **Pending Review**. `plan:fixture` refuses to overwrite an existing candidate. An unchanged pending offline candidate can be updated with `npm run plan:refresh-fixture`; this preserves its old JSON under `m0/runs/electricity/history/` and leaves the replacement Pending Review. Approved, rejected, edited or hash-mismatched candidates cannot be refreshed. The existing local sample was refreshed this way for Phase 2A.1. To edit manually, change `candidate.json`, then validate it and reset it to Pending Review:

```powershell
npm run plan:review
npm run plan:show
```

Only after reading the current review may you explicitly approve by passing the exact SHA-256 displayed by `plan:show`:

```powershell
npm run plan:approve -- <candidate-sha256>
npm run plan:check-approved
```

Or reject it with `npm run plan:reject`. Approval creates a versioned immutable-name snapshot under `m0/runs/electricity/approved/`. The future narration gate checks the current candidate, decision and snapshot hashes. Editing the candidate after approval blocks that gate until a new review and explicit approval. None of these commands generates narration. In this workspace, the sample candidate has been created and **left Pending Review** for the project owner.

`npm run plan:check-render-ready -- gemini-live-phase2b-retry1` checks both explicit approval and storyboard render readiness. It now passes for the approved seven-scene electricity candidate. The command never renders.

Run the offline planning suite and TypeScript checker:

```powershell
npm run test:planning
npm run typecheck
```

The private `.env` is still unchanged and ignored. No provider endpoint is called by the fixture, review, test, preview or render commands.

## M0 Phase 2B — controlled Gemini attempt

The one-use `npm run plan:generate-once` command was added for the separately authorized Phase 2B request. It uses the existing server-side adapter with Standard `generateContent`, one candidate, structured JSON, low thinking, an 8,192-token output cap, a 90-second timeout, and no retry. A fixed ignored run directory acts as a durable dispatch guard. **The authorized request was dispatched once on 20 October 2026 and timed out. Do not rerun this command.** No validated response, usage metadata, Gemini candidate, or review file was received. The local [attempt record](m0/runs/electricity/gemini-live-phase2b/generation.json) records the uncertain outcome without keys. The earlier handwritten fixture candidate remains Pending Review and can still be inspected with `npm run plan:show`.

After a separately authorized retry with the VPN disabled, the one-use `npm run plan:generate-retry1` command sent one new Standard Gemini request with a 120-second timeout and no retry. It succeeded and saved a real Gemini candidate in `m0/runs/electricity/gemini-live-phase2b-retry1/`, separate from the first attempt and handwritten fixture. **Do not rerun this command.** Read the complete Pending Review draft with:

```powershell
npm run plan:show -- gemini-live-phase2b-retry1
```

The saved `review.md` contains the complete narration and scene descriptions; `generation.json` records model, elapsed time and token usage. Structural validation passed. At the close of Phase 2B, the candidate was Pending Review and no ElevenLabs audio existed. It was subsequently manually approved for Phase 3B. The five planning layouts remain unimplemented for storyboard rendering.

## M0 Phase 3A — offline ElevenLabs narration preparation

The server-only [ElevenLabs adapter](m0/src/narration/elevenlabs.ts) prepares one complete narration request to the [speech-with-timestamps endpoint](https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps/). It uses the approved seven-scene Gemini draft, the original character alignment, MP3 44.1 kHz/128 kbps, a bounded timeout and no SDK or retry. The adapter checks the existing approved-snapshot gate before any request. There is deliberately **no live narration npm command** in Phase 3A; using the adapter for a real request requires separate authorization. A future checkpoint writer preserves audio, original/normalized alignment and derived timing under the same ignored run directory without overwriting them.

Configuration is server-side in the existing root `.env`: `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, optional `ELEVENLABS_MODEL_ID` (`eleven_flash_v2_5` by default or `eleven_multilingual_v2`), and optional `ELEVENLABS_TIMEOUT_MS` (1,000–180,000; default 120,000). The voice ID was absent during Phase 3A; the owner later configured Bella privately. The default Flash model supports English and a 40,000-character request limit according to [ElevenLabs model documentation](https://elevenlabs.io/docs/overview/models). The multilingual v2 option uses its documented default language behavior because `language_code` is unsupported for that model.

The [timing utilities](m0/src/narration/timing.ts) require the original provider alignment to reproduce the approved text exactly in Unicode code-point order. They validate character arrays and timestamps, derive word/subtitle spans and seven ordered scene spans, and keep the storyboard's 75-second **estimate** separate from locally probed audio duration. Mismatched, missing or normalized-only alignment is rejected; no equal-split or phrase-search repair is attempted. Lip sync and plan-driven scene rendering remain future work. Run only offline checks:

```powershell
npm run validate:narration:offline
npm run test:planning
npm run validate:offline
```

At the close of Phase 3A, the Gemini candidate was **Pending Review**, unchanged. Its SHA-256 is `8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10`. The owner subsequently approved this exact candidate. The original manual review procedure was:

```powershell
npm run plan:show -- gemini-live-phase2b-retry1
npm run plan:approve -- 8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10 gemini-live-phase2b-retry1
npm run plan:check-approved -- gemini-live-phase2b-retry1
```

Approval alone generates no audio. The complete narration contains **974 characters** (including the single spaces joining scenes) and 150 words. [Published pricing](https://elevenlabs.io/pricing) lists Free at 10,000 credits/month and Flash v2.5 API usage at **0.5–1 credit per character**. The account balance and voice access were not queried in Phase 3A; Phase 3B checked them before generation.

## M0 Phase 3B — Bella narration

The owner manually approved the exact Gemini candidate. The Phase 3B preflight confirmed the approved snapshot, Free plan, available allowance, Bella's API access and English support, and Flash v2.5 compatibility. Exactly one authorized speech-with-timestamps request succeeded with Bella (`hpp4J3VqNfWAUOO0d1Us`) and `eleven_flash_v2_5`. The provider reported a 487-character-credit cost. Do not rerun the one-use `m0/src/narration/live-bella-cli.ts` runner; the audio and response are preserved under ignored `m0/runs/electricity/gemini-live-phase2b-retry1/narration/`.

The saved [`audio.mp3`](m0/runs/electricity/gemini-live-phase2b-retry1/narration/audio.mp3) lasts **66.716735 seconds**, below the accepted 72–78-second range. The same directory contains `alignment.original.json`, `timing.json`, `words.json`, `subtitles.json`, `scenes.json` and `generation.json`. Local checks confirmed full MP3 decoding, exact character-alignment text equality, 150 words, 28 subtitle cues and seven ordered scene spans. Listen to the take before deciding how to address its duration. On Windows, open it with:

```powershell
Invoke-Item -LiteralPath 'C:\Users\TS-0004\Desktop\ai-video-creator\m0\runs\electricity\gemini-live-phase2b-retry1\narration\audio.mp3'
```

At the close of Phase 3B, lip sync and storyboard rendering awaited the owner's audio review and separate authorization. The owner then authorized Phase 4A.

## M0 Phase 4A — offline seven-scene draft

The owner accepted the saved Bella take for an approximately 75-second visual treatment. Five authored Remotion layouts now render all seven approved electricity scenes. The original six-second `OfflineElectricityDemo` remains a separate composition. The approved candidate, original MP3 and original timestamps remain unchanged.

The [draft timeline](m0/runs/electricity/gemini-live-phase2b-retry1/draft-4a/timeline.json) starts with a 1.3-second title reveal, adds six scene-boundary holds totaling 4.9 seconds, and ends with a 2.083265-second visual hold. These 8.283265 added seconds turn the 66.716735-second narration into a 75-second timeline. Local FFmpeg cuts the decoded original audio only in measured gaps between scenes, inserts silence, and saves `audio-timeline.wav`. The timeline shifts word, subtitle and mouth activity by the same offsets. Mouth activity stops between words and throughout added silence; full-screen diagrams contain no speaking teacher.

Run from the project root:

```powershell
npm run typecheck
npm run test:planning
npm run test:narration
npm run test:draft
npm run draft:prepare
npm run validate:offline
npm run draft:render
npm run draft:mux
```

`draft:prepare` verifies the approved snapshot, unchanged audio hash, measured alignment and five render-ready templates before writing derived files. It keeps the derived WAV in the ignored private run directory. `draft:render` creates a 540 × 960, 30 fps video-only local preview; `draft:mux` adds the saved WAV with local FFmpeg to produce the H.264/AAC [narrated draft](m0/runs/electricity/gemini-live-phase2b-retry1/draft-4a/draft.mp4). These commands make no Gemini or ElevenLabs requests. Remotion Studio previews the video without narration; play the locally muxed draft for audiovisual review.

Open the narrated draft in Windows:

```powershell
Invoke-Item -LiteralPath 'C:\Users\TS-0004\Desktop\ai-video-creator\m0\runs\electricity\gemini-live-phase2b-retry1\draft-4a\draft.mp4'
```

After `draft:prepare`, open Remotion Studio with `npm run draft:preview`, then select `ElectricityStoryboardDraft`. The saved timeline is supplied through the private render props; a fresh checkout can load the other compositions without it. The owner approved this draft before the full-resolution Phase 4B render.

## M0 Phase 4B — approved full-resolution electricity video

After the owner approved the full 75-second Phase 4A draft, the same approved storyboard, Bella narration, derived 75-second audio timeline and Remotion composition produced the local [final MP4](m0/runs/electricity/gemini-live-phase2b-retry1/final-4b/electricity-final-1080x1920.mp4). The final render used the proven muted Remotion video plus local FFmpeg audio mux workflow; no Gemini or ElevenLabs request was made. The approved candidate, original audio/timestamps and 540 × 960 draft were preserved.

The final file is 1080 × 1920 (9:16), 30 fps, 2,250 frames, 75.000 seconds, H.264 video and 44.1 kHz stereo AAC audio. Both streams decoded fully. Seven sampled scene frames and six before/after scene-boundary pairs were inspected; the expected scene numbers changed in order, and sampled text/subtitles showed no visible clipping or overlap. The 150-word narration follows the seven contiguous original audio segments once, with the Phase 4A inserted silent intervals; the local timing tests check subtitle and mouth offsets. The owner has watched and approved both the complete draft and final-resolution video.

Open the final video on Windows:

```powershell
Invoke-Item -LiteralPath 'C:\Users\TS-0004\Desktop\ai-video-creator\m0\runs\electricity\gemini-live-phase2b-retry1\final-4b\electricity-final-1080x1920.mp4'
```

The final MP4 and validation frame samples are under ignored `m0/runs/electricity/gemini-live-phase2b-retry1/final-4b/`. M0 remains In Progress while its wider recovery, resource and acceptance checks are completed. Phase 4B does not start the M1 SaaS application.

## M0 Phase 5 — offline validation

The saved electricity composition now accepts `showSubtitles: false` in Remotion props; subtitles remain enabled by default. A one-second 540 × 960 subtitle-off sample, with audio sliced from the existing derived WAV, is saved at `m0/runs/electricity/gemini-live-phase2b-retry1/phase5/subtitles-off-sample.mp4`. The corresponding on/off frame captures are beside it. This option changes pixels only; the approved narration, alignment and final MP4 were not changed. The local render preparation checks pinned candidate/audio hashes and reports missing or changed source assets clearly.

Offline validation commands, from the project root:

```powershell
npm run typecheck
npm run test:planning
npm run test:narration
npm run test:draft
npm run plan:check-render-ready -- gemini-live-phase2b-retry1
```

The final file was probed and both streams decoded fully again during Phase 5. Fourteen scene speech start/end anchors were compared with silence boundaries detected in the final audio; the largest observed difference was 243 ms at a −35 dB threshold. This is a coarse onset/offset check, not phoneme-level verification. See [`docs/PROGRESS.md`](docs/PROGRESS.md) for the acceptance audit and remaining M0 work. The fixed male teacher currently accompanies Bella's female narration; configurable characters, voice matching and varied themes remain future enhancements.

**Use rights:** The Bella narration was generated on the ElevenLabs Free plan. ElevenLabs states that Free-plan output has no commercial license; noncommercial sharing requires attribution. This saved prototype must not be treated as cleared for commercial publication. Confirm all applicable voice, planning, artwork, dependency and hosting rights before any public/commercial use. [ElevenLabs publishing guidance](https://help.elevenlabs.io/hc/en-us/articles/13313564601361-Can-I-publish-the-content-I-generate-on-the-platform) and [billing documentation](https://elevenlabs.io/docs/overview/administration/billing) describe the current Free-plan distinction.

## M0 Phase 5B — silent product and software visual demos

Two additional, local-only Remotion compositions demonstrate distinct category layouts without changing the approved electricity composition. [ProductShowcaseDemo](m0/src/showcase/ShowcaseVideo.tsx) presents a fictional **LUMA MINI** portable lamp with an original inline SVG illustration, animated entrance, three feature cards and a call to action. **SoftwareExplainerDemo** presents a fictional **NORTHSTAR** workspace with an authored dashboard, a moving task card, animated panels and progress insights. Shared frame-based scene timing, validation and transitions live in [showcase plans](m0/src/showcase/plans.ts). These IDs are **demo-only** and are not added to the educational Gemini storyboard registry or described as a complete product/project generation pipeline.

Render independently from the project root:

```powershell
npm run render:product-demo
npm run render:software-demo
npm run test:showcase
```

Outputs are Git-ignored: [product demo](m0/runs/showcase-phase5b/product-demo.mp4) and [software demo](m0/runs/showcase-phase5b/software-demo.mp4). Each is a silent 12.000-second, 540 × 960, 30 fps H.264 MP4. The render scripts use `.env.example`; no provider key, paid asset, account or network service is needed. These mock demonstrations have on-screen English copy but no narration, audio track, source understanding, Gemini plan, approval flow, 62–90-second duration or private SaaS delivery. The owner later approved both visual designs. The complete M0 audit remains in [`docs/PROGRESS.md`](docs/PROGRESS.md), and M0 remains **In Progress**.

## M0 Phase 5C.1 — proposed showcase narration, offline only

The owner subsequently watched and approved both silent visual designs. LUMA MINI remains at `luma-mini-v1`. NORTHSTAR has an original `northstar-v1` candidate and a separate revised `northstar-v2` candidate. The owner manually approved the exact `luma-mini-v1` and `northstar-v2` snapshots; `northstar-v1` remains an unused Pending Review record. Bella is the proposed voice; no showcase speech has been generated.

| Candidate | Complete proposed script | Words | Characters | Estimated speech time from the prior Bella take |
| --- | --- | ---: | ---: | ---: |
| LUMA MINI | “Meet LUMA MINI, a portable lamp made to bring a warm glow wherever you settle in. Tap to set the mood, recharge when you need to, and carry comfortable light from room to room. Make space for your next bright moment. Discover LUMA MINI.” | 44 | 236 | 19.57 seconds |
| NORTHSTAR v1 (original) | “Meet NORTHSTAR, a fictional workspace that gives every project a clearer view. Its dashboard brings the work ahead, what is moving, and what is done into one place. Move a task from to do into progress, and watch the board reflect the next step for your team. Progress cards and a weekly chart show how work is moving. See the work, see the next step, with NORTHSTAR.” | 67 | 367 | 29.80 seconds |
| NORTHSTAR v2 (approved script) | “Meet NORTHSTAR, a simple workspace that keeps every project on track. See upcoming tasks, work in progress, and completed work together on one clear dashboard. Move a task from To Do to In Progress, and watch the board update. Progress cards and a weekly chart help your team understand how work is moving forward. With NORTHSTAR, everyone knows what to focus on next.” | 63 | 368 | 28.02 seconds |

The estimate uses 150 words / 66.716735 seconds from the saved electricity take. Actual narration and final scene lengths must be measured later; the two 12-second silent timelines are not treated as speech timing. Review files include sentence-to-scene mappings and why each sentence matches the visuals:

- [LUMA MINI review](m0/runs/showcase-phase5c1/luma-mini-v1/review.md) — `product-hero`, `product-features`, `product-cta`; SHA-256 `c8c048405edf5190107594dd93193719c8ffc00a60efdff4939e0f21846f8dba`.
- [NORTHSTAR v1 original review](m0/runs/showcase-phase5c1/northstar-v1/review.md) — preserved; SHA-256 `8c95a2bcd1892c502737f920cb865a0f7cbc20a1de882cc3ed0fd0a488bd4370`.
- [NORTHSTAR v2 approved review](m0/runs/showcase-phase5c1/northstar-v2/review.md) — `software-dashboard`, `software-workflow`, `software-insights`; SHA-256 `1e7fb3312bec9be6b1da5c8703588b017ecbdba4b329c86f79cc65fc93695418`.

Inspect the exact candidates from the project root:

```powershell
npm run showcase:script -- show luma-mini-v1
npm run showcase:script -- show northstar-v2
```

The manual approvals have already been completed and verified by the `check-approved` commands. The original exact-hash commands are retained here as the recorded approval procedure; do not rerun them:

```powershell
npm run showcase:script -- approve luma-mini-v1 c8c048405edf5190107594dd93193719c8ffc00a60efdff4939e0f21846f8dba
npm run showcase:script -- approve northstar-v2 1e7fb3312bec9be6b1da5c8703588b017ecbdba4b329c86f79cc65fc93695418
npm run showcase:script -- check-approved luma-mini-v1
npm run showcase:script -- check-approved northstar-v2
```

Approval snapshots are saved by exact candidate hash. Editing a candidate invalidates its approval gate; `npm run showcase:script -- review <id>` resets an edited valid candidate to Pending Review with a new hash. Approval alone never generates audio. On 21 October 2026, the read-only Phase 5C.2 preflight confirmed the account's Free tier, 487/10,000 credits used and **9,513 remaining**, Bella's API metadata and English support, Flash v2.5 text-to-speech compatibility, and the existing configuration's exact Bella voice ID/model. The official speech-with-timestamps endpoint is documented and this project previously received a successful Bella/Flash v2.5 timestamp response; current generation authorization cannot be proven without a POST. The model API reports a **0.5-credit-per-character** multiplier, giving **118** estimated credits for LUMA v1 (236 characters) and **184** for NORTHSTAR v2 (368 characters), **302 total** across two future requests. This is an estimate, not a charge. No showcase generation request has been dispatched; separate authorization is required. Free-plan narration has no commercial-use license.

The shared ElevenLabs speech-with-timestamps adapter now has a showcase approval-gated entry point, and the saved-audio checkpoint can derive a voice-over timeline from actual character alignment. The showcase composition accepts optional local audio and subtitle data, expands scene duration through Remotion metadata, and needs no speaking avatar. A local FFmpeg filter can create padded audio from one saved take for muxing without another provider request. Offline tests use mock transport and synthetic WAV/alignment only. Synthetic subtitle stills are under ignored `m0/runs/showcase-phase5c1/`; they are visual checks, not narrated outputs. Run `npm run test:showcase-voiceover` to check this foundation. Both original silent MP4s and the electricity final remain unchanged. M0 remains **In Progress**.

## M0 Phase 5C.2 — narrated showcase drafts for review

The owner separately authorized one Free-plan Bella / `eleven_flash_v2_5` speech-with-timestamps request for each exact approved script. Both requests succeeded without retry: `luma-mini-v1` SHA-256 `c8c048405edf5190107594dd93193719c8ffc00a60efdff4939e0f21846f8dba` cost **118** credits and produced **15.046531 seconds** of original audio; `northstar-v2` SHA-256 `1e7fb3312bec9be6b1da5c8703588b017ecbdba4b329c86f79cc65fc93695418` cost **184** credits and produced **26.044082 seconds**. The subscription API later reported 789/10,000 credits used, up from 487 before these requests, leaving **9,211**. Original MP3s, raw provider responses, character alignments, derived word/subtitle/scene cues and request metadata are saved in each ignored narration directory. The exact-hash gate and an existing-run guard block accidental duplicate requests. Do **not** rerun `live-narration-cli.ts` for either saved take.

The voice-over timelines use the measured speech and short intro/transition/outro holds. Each three-scene animation remains based on the approved visual design; product feature cards and the software task/chart movement now follow relevant recorded word cues. Remotion rendered muted 540 × 960 frames locally, and local FFmpeg muxed the saved derived WAV once per video. The drafts are **17.266667 seconds** (518 frames) and **28.266667 seconds** (848 frames), both 30 fps H.264/AAC 9:16 MP4s:

| Draft | Original audio | Raw timestamps and timing | Narrated video |
| --- | --- | --- | --- |
| LUMA MINI | [audio.mp3](m0/runs/showcase-phase5c1/luma-mini-v1/narration/audio.mp3) | [alignment.original.json](m0/runs/showcase-phase5c1/luma-mini-v1/narration/alignment.original.json), [timeline.json](m0/runs/showcase-phase5c1/luma-mini-v1/narration/timeline.json) | [draft-narrated.mp4](m0/runs/showcase-phase5c1/luma-mini-v1/narration/draft-narrated.mp4) |
| NORTHSTAR | [audio.mp3](m0/runs/showcase-phase5c1/northstar-v2/narration/audio.mp3) | [alignment.original.json](m0/runs/showcase-phase5c1/northstar-v2/narration/alignment.original.json), [timeline.json](m0/runs/showcase-phase5c1/northstar-v2/narration/timeline.json) | [draft-narrated.mp4](m0/runs/showcase-phase5c1/northstar-v2/narration/draft-narrated.mp4) |

From the project root, open the drafts on Windows:

```powershell
Start-Process -FilePath 'm0/runs/showcase-phase5c1/luma-mini-v1/narration/draft-narrated.mp4'
Start-Process -FilePath 'm0/runs/showcase-phase5c1/northstar-v2/narration/draft-narrated.mp4'
```

`npm run validate:offline`, `npm run test:showcase-voiceover` (5/5), `npm run test:showcase` (2/2) and `npm run test:narration` (8/8) passed. Both final streams decoded end to end, and sampled frames in every scene showed no obvious clipping or overlap. Character alignment, word/subtitle text and scene coverage validate against the exact scripts; the owner has not yet completed full audiovisual review. These are short fictional category prototypes, not a complete 62–90-second V1 generation path or commercial assets. Free-plan audio is for noncommercial prototype testing. The original silent demos and approved electricity MP4 remain untouched; M0 remains **In Progress**.

## Milestone status and approved acceptance order

M0 is **Completed / Owner Approved** as of 21 October 2026. M1 is **Not Started / Planning Prepared**. The owner has watched and approved all three narrated local videos: the seven-scene 75-second electricity Educational/Cartoon Teacher final at 1080 × 1920, the 17.27-second LUMA MINI Product Branding draft at 540 × 960, and the 28.27-second NORTHSTAR Software Project Explainer draft at 540 × 960. All are 30 fps H.264/AAC with approved visuals, narration and synchronization. The product/software examples are short fictional mockups, not 62–90-second source-grounded V1 production flows.

Phase 6A completed the bounded mid-render interruption, restart, resource and storage/bandwidth checks. Phase 6B completed the stronger timing, subtitle-mode and offline duration-boundary checks. Their measured evidence and limitations appear below; the owner subsequently approved formal M0 closure. Outstanding P2 scores/pilot comprehension are assigned to M5 and remain Not Verified.

PRD v2.5 preserves the owner-approved v2.4 milestone split: private uploads/Storage recovery and direct account isolation belong to M1 when those foundations exist; source-grounded planning and seven-pair validation to M2; voices/rendering/durable jobs to M3; completed application/lifecycle controls to M4; complete integrated acceptance to M5; and production gates to M6. The limited signup/name/password alignment fits M1 account/auth foundations, not full AI-generation work. Every P0 remains mandatory. Legal text/acknowledgement interaction and any recording policy remain open; missing Stitch assets and actual commercial rights are not inferred from UI approval. See [ROADMAP.md](docs/ROADMAP.md) and [PROGRESS.md](docs/PROGRESS.md) for full assignments and evidence.

The existing ElevenLabs Free-plan recordings are **noncommercial prototype assets**. Commercial use requires rights for the actual recordings and other assets; a later paid subscription is not presumed to license Free-plan recordings retroactively. The owner approved AI visual-theme recommendations, manual themes/backgrounds, advanced branding, character customization and voice matching, optional licensed/user-provided music with volume/fades/ducking, and later optional AI-generated music as conditional **post-V1** enhancements. They are outside current V1 acceptance. The earlier roadmap update made no provider request, render or asset change.

## M0 Phase 6A — bounded local render recovery

One controlled test rendered an eight-second, 540 × 960 excerpt of the approved electricity composition. Remotion reported at least 27 rendered frames before the harness interrupted only its own render process tree. The failed attempt had no completed MP4. A fresh process restarted from frame 0 using the saved approved candidate, Bella audio/alignment, timeline and render props; it encoded all 240 frames. FFmpeg muxed the saved derived audio, and FFprobe validated the recovered 8.000-second, 30 fps H.264/AAC file. This is process restart from saved inputs, not partial-frame resumption. No Gemini or ElevenLabs request occurred, and all approved scripts, narration files and three final videos retained their hashes.

The recovered render took **35.833 seconds**, with sampled peak process-tree working set **1,055,678,464 bytes** (about 1,007 MiB), sampled peak CPU **137% of one logical core**, and peak monitored run-directory use **101,064,940 bytes** (96.4 MiB). FFmpeg muxing took **0.544 seconds**. These Windows samples include observed Remotion/Chromium descendants and the redirected scratch folder; short-lived processes and scratch outside that folder may be missed. The original full-length 1080 × 1920 electricity MP4 is **8,505,633 bytes**. At that measured size, retaining 100 or 1,000 comparable full-length MP4s would use about **0.851 GB** or **8.506 GB**, and one download each would transfer the same amount. These are estimates for comparable 75-second content/encoding, excluding uploads, revisions and backups. The short excerpt is not a full-HD storage proxy.

Evidence and outputs are under ignored [Phase 6A run directory](m0/runs/phase6a-recovery/20261021-062618/) with [report.json](m0/runs/phase6a-recovery/20261021-062618/report.json) and [recovered-narrated-8s.mp4](m0/runs/phase6a-recovery/20261021-062618/recovered/recovered-narrated-8s.mp4). The repeatable local test harness is [phase6a-recovery.ps1](m0/scripts/phase6a-recovery.ps1). It creates a new ignored run directory by default; `-ResumeRun <existing-run-directory>` only finalizes a prior completed render and does not launch another render. Do not use it against an approved final output path. Offline verification:

```powershell
npm run typecheck
$env:PHASE6A_REPORT = 'm0/runs/phase6a-recovery/20261021-062618/report.json'
npm run test:phase6a
```

TypeScript and all **39/39** offline tests passed. An initial sandboxed Chromium launch and the sandboxed test runner encountered `spawn EPERM`; the bounded render and tests passed with local process-spawn permission. The first completed recovery render's Windows process exit code was unavailable to the harness, so completion was established from `Encoded 240/240`, the output file and FFprobe; the harness then finalized that saved render without rerendering. M0 remains **In Progress**. Phase 6B followed to check stronger visual-anchor/scene/subtitle timing, subtitle-on/off behavior and offline duration boundaries.

## M0 Phase 6B — offline timing, subtitle and duration evidence

The approved electricity timeline covers seven contiguous scenes, all 150 words, 28 captions and eight inserted pauses across 75 seconds. Twelve sampled teacher mouth cues followed saved word starts within **32.7 ms** at 30 fps; the mouth stayed closed through the pauses. Seven scene-to-speech leads were 1,300 ms for the intentional opening title and 163–349 ms elsewhere. Saved subtitle endpoints align with their words. Ten representative frames were extracted from the protected final MP4 to inspect teacher and diagram content. These are structural cue and frame checks; they do not establish phoneme-accurate lip sync. The earlier final-AAC acoustic edge check found a maximum 243 ms difference across 14 sampled starts/ends, and the owner approved full playback.

Subtitles on/off were rendered as stills for electricity, LUMA MINI and NORTHSTAR. In each case, the caption panel disappeared while a matching upper-image crop and saved props hash confirmed the other visuals were unchanged. Two short electricity H.264/AAC sample clips reused the same saved Bella audio and had byte-identical extracted AAC streams; the subtitle-off audio decoded as non-silent. Both modes keep the same scene ordering and duration. The local [Phase 6B report](m0/runs/phase6b-subtitles/20261021-063914/report.json) and sample media are Git-ignored; no full-length video was rerendered. The sample script creates a new ignored run directory when run again:

```powershell
$env:PHASE6A_REPORT = 'm0/runs/phase6a-recovery/20261021-062618/report.json'
npm run validate:offline
npm run test:phase6b
./m0/scripts/phase6b-subtitle-samples.ps1
```

The offline suite passed **46/46** tests. Saved narrated LUMA (518 frames), NORTHSTAR (848), and electricity (2,250) timelines remain valid. Synthetic 62/90-second timelines have exact 1,860/2,700-frame coverage, with invalid boundaries/settings rejected before output. Synthetic checks do not validate real generated 62/90-second videos. The approved three MP4 hashes and electricity candidate/Bella audio remain unchanged. [PROGRESS.md](docs/PROGRESS.md) records the detailed M0 criterion-by-criterion audit, resource/recovery limits and M1–M5 obligations. The owner formally signed off the revised local M0 feasibility scope on 21 October 2026; **M0 is Completed / Owner Approved** and **M1 is Not Started / Planning Prepared**. The [M1 implementation plan](docs/M1_IMPLEMENTATION_PLAN.md) proposes small security-first phases; none has begun. ElevenLabs Free-plan recordings remain noncommercial prototype assets, and a future paid subscription does not automatically license them retroactively.
