# AI Video Creator V1

AI Video Creator is a planned multi-user web application for turning a user's ideas, photos, educational topics, screenshots and supported documents into private, narrated, downloadable videos. Users review the AI's understanding and script before generation. Development begins locally, proceeds through private multi-account testing, and reaches public deployment only after the approved release gates pass.

M0 Phase 1 now contains a local, offline Remotion prototype. It validates rendering only; it is not the complete 75-second M0 video or the multi-user application.

## V1 at a glance

- One dashboard; four stages: Describe → Review Script → Generate and Preview → Download.
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

- [`docs/PRD.md`](docs/PRD.md) — approved product requirements v2.3 and acceptance priorities.
- [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md) — approved architecture v1.0 and system invariants.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — planned M0–M6 work and exit evidence.
- [`docs/PROGRESS.md`](docs/PROGRESS.md) — actual milestone status, decisions and evidence.
- [`AGENTS.md`](AGENTS.md) — permanent instructions for Codex contributors.

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

`validate:offline` typechecks and lists the registered composition. `check:env` is a server-only local key-name presence check; it loads the existing root `.env` using Node.js and prints no values. It does not call either provider. As of 20 October 2026, the existing private file has `EVENTLABS_API_KEY` in place of the required `ELEVENLABS_API_KEY`, so `check:env` correctly reports the missing required name. Correct that name in the private file before any later, separately authorized provider integration; do not copy key values into source or docs.

Both Remotion commands explicitly load `.env.example`, which contains placeholders only, because the Remotion CLI otherwise reads `.env` by default. The private root `.env` is never imported into a composition or browser bundle. `.env`, local npm cache, dependencies and `output/` are Git-ignored. No keys are needed to render this offline demo.

M0 next needs a supervised approved script/scene plan, real ElevenLabs timing, local audio-derived cues, a complete 75-second render and resource/recovery measurements. Those are not Phase 1 outcomes. The later SaaS foundation will run local Next.js and an independent worker against a development Supabase environment. Public hosting and paid use require separate approval.
