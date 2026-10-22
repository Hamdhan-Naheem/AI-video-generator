# AI Video Creator V1 — Consolidated UI/UX Design Specification

## 1. Document Overview and Status

| Field | Value |
| --- | --- |
| Document version | 0.2 — approved decisions aligned; draft for owner review |
| Prepared | 22 October 2026, Asia/Colombo |
| Status | **Draft — Pending Owner Approval**; not an implementation authorization |
| Product authority | [PRD.md](PRD.md) v2.5, owner-approved alignment decisions recorded; revised document pending owner review |
| System authority | [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) v1.2, corresponding documentation alignment pending owner review |
| Visual direction | Owner-supplied Google Stitch decisions in the consolidated UI/UX brief |
| Visual-file verification | No local Stitch export or application-screen reference found; screenshots were not inspected as Stitch designs |
| Milestones | M0 **Completed / Owner Approved**; M1 **Not Started / Planning Prepared**; M2–M6 **Not Started** |
| Scope | Full intended V1 UI/UX, with implementation assigned to the existing milestones |

This document consolidates the supplied design decisions into one future design-system reference. The PRD controls functionality and release priorities; architecture controls authentication, ownership, durable work and private media boundaries. A screen illustration is not evidence that its backend exists. This draft does not replace either approved document.

**Alignment decision, 22 October 2026:** the owner explicitly authorized exactly five Studio steps, separate script/storyboard and final generation decisions, the Full Name/Email/Password/Confirm Password/Terms-Privacy signup form, and limited name/password Account Settings. PRD v2.5 and Architecture v1.2 now record these decisions; the former four/five-step, signup-field and basic-settings conflicts are resolved as requirements. Mandatory account deletion remains intact. This revised design document remains **Draft / Owner Review**; legal content/acknowledgement interaction and recording policy, actual visual references and implementation details remain open in section 15. No development is authorized.

Version history: v0.1 (22 October 2026) inventoried supplied UI decisions and requirements conflicts; v0.2 (22 October 2026) records the owner's approved alignment without claiming visual inspection, completed implementation or approval of this entire draft.

Labels used throughout:

- **PRD baseline:** approved product functionality; mandatory at its assigned milestone.
- **Owner-supplied UI decision:** direction explicitly supplied in the design brief; visual fidelity remains unverified without assets.
- **Proposed token/implementation detail:** documented recommendation for review, not a value measured from Stitch.
- **Outstanding detail:** a remaining legal, visual-reference or implementation decision is not inferred from approval of the product direction.

The application theme in this document styles the website and workspace. It does not add video-theme selection, character customization, branding controls or music to V1. Those remain conditional post-V1 enhancements.

## 2. Source Documents and Stitch References

### 2.1 Authority and evidence

| Source | What it governs | Review result |
| --- | --- | --- |
| [AGENTS.md](../AGENTS.md) | Project constraints, trust boundaries and progress discipline | Read; no implementation or service setup authorized |
| [README.md](../README.md) | Current local prototype and planned application | Read; M0 output is not a live multi-user SaaS |
| [PRD.md](PRD.md) v2.5 | Features, five steps, approved signup/basic settings, auth, inputs, lifecycle and AC01–AC63 | Actual source provisions reviewed and updated only under explicit owner authorization |
| [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) v1.2 | Next.js/worker/Supabase responsibilities, two approval decisions, account state, private access and recovery | Existing technical architecture preserved; UX/profile responsibilities aligned |
| [ROADMAP.md](ROADMAP.md) | M1–M6 implementation and acceptance assignments | Read; full UI scope does not move AI/rendering work into M1 |
| [PROGRESS.md](PROGRESS.md) | Observed status, M0 sign-off and outstanding P2 evidence | Read; no new acceptance pass inferred from documentation |
| [M1_IMPLEMENTATION_PLAN.md](M1_IMPLEMENTATION_PLAN.md) | Small foundation/auth/data/upload/security phases | Read; M1 remains planning only |
| Owner's consolidated Stitch/UI brief supplied for this task | Palette, screen names, layout preferences and interactions | Used as written owner direction; external visuals not independently verified |
| Owner's Approved Requirements Alignment decisions, 22 October 2026 | Five steps, two approvals, signup fields, limited settings and mandatory deletion | Requirements aligned; legal/recording and missing asset details remain explicit |

### 2.2 Local reference search

The repository was searched for design/Stitch references and image, SVG, HTML, archive, PDF and design-tool filenames, including ignored output/run folders. Dependency internals, `.git` and private environment files were excluded from this search. No local application-screen Stitch export, font manifest, design-token export or approval-linked design reference was found.

The following exact local locations contain **other material**, not the approved application UI designs:

| Existing location | Actual material | Relevance |
| --- | --- | --- |
| `output/frame-early.png`, `output/frame-middle.png`, `output/frame-late.png`, `output/frame-final.png` | M0 video-frame samples | Not landing/auth/dashboard/Studio references |
| `m0/runs/electricity/gemini-live-phase2b-retry1/final-4b/scene-01.png` through `scene-07.png` | Electricity video-frame validation | Video output evidence only |
| `m0/runs/phase6b-subtitles/20261021-063914/` | Video subtitle-on/off samples and anchor frames | Not application light/dark designs |
| `m0/runs/showcase-phase5b/` and `m0/runs/showcase-phase5c1/` | Fictional product/software video samples | NORTHSTAR's illustrated dashboard is not the AI Video Creator workspace UI |
| `output/learning/AI_Video_Creator_Interview_Guide.html` | Local explanatory learning guide | Not a Stitch export or application design system |

Only filenames and existing project records establish this inventory. No claim is made that these files were visually inspected for application design fidelity. No remote Stitch project was opened or independently matched to an approval. No missing export path is asserted to exist.

### 2.3 Design-reference inventory to receive before visual implementation

All entries currently have **no local Stitch reference**. Record the real project/screen identifier, export filename, revision/date, approval provenance and supported viewport/theme when supplied. Do not replace these missing entries with guessed asset paths.

| Requested reference | Minimum reference information still needed |
| --- | --- |
| Landing Page | Approved desktop/mobile composition, hero/footer and example-video treatment |
| Sign Up | Shared auth template with approved Full Name/Email/Password/Confirm Password and legal acknowledgement; legal interaction details still pending |
| Sign In | Auth template, password visibility and validation treatment |
| Forgot Password | Form and neutral acknowledgement state |
| Reset Password | Valid recovery, expired-link and success treatments |
| Dashboard | Option A quick-create, recent projects and empty state |
| My Projects | Cards, search, filters, action menu and empty state |
| Drafts | Selected Draft filter/navigation treatment in My Projects; no separate visual system |
| Account Settings | Supplied settings reference plus required deletion/status/confirmation treatment |
| Video Details | Shared Studio shell, controls and category/source-input treatment |
| Script & Storyboard | Desktop editor/cards and mobile tabs |
| Voice & Subtitles | Selection/sample/subtitle controls and final approval summary |
| Generate Video | Actual-progress, queued/failure/completed treatments and the subtle loading SVG/icon |
| Preview & Download | Portrait player, project metadata and download failures |
| Shared visual assets | Approved wordmark/logo, icon family, chosen font/weights, rights, theme toggle and common controls |

The brief describes approximately **1440 px desktop** and **390 px mobile** references. These are reference viewports, not verified measurements or production breakpoints. Not every desktop dark screen needs its own screenshot to establish theme support: all screens must still derive a desktop dark variant from the shared tokens and receive review. Actual asset delivery and theme/viewport gaps must remain visible in this inventory.

## 3. Approved Product UX Principles

1. **One identity:** Pearl & Ocean Teal across public, auth and workspace screens. Layouts may differ; tokens and component states must remain shared.
2. **Clear purpose:** show the user's content, next action and truthful state. Keep provider names, infrastructure, engines, fake analytics and diagnostic labels out of normal workflows.
3. **Review before generation:** a script draft is not approval. Generation uses an explicitly approved current revision and settings; edits invalidate affected approval.
4. **Private by default:** show only owned projects/assets. A hidden button or filtered list does not replace server authorization/RLS.
5. **Preserve work:** display Saved only after acknowledgement; retain previous valid drafts and prior successful videos through recoverable failure.
6. **Honest progress:** queued, waiting, active, failed and ready states come from actual backend state. No fabricated percentages, time estimates, credits or capacity claims.
7. **Appropriate simplicity:** exactly three categories and three compatible styles; no collaboration, publishing, payments, advanced editor or manual character customization.
8. **Responsive accessibility:** shared semantics, focus, labels, reflow and reduced motion across light/dark desktop, tablet and mobile web.

## 4. Screen Inventory and Navigation

The brief contains **14 inventory entries**. Drafts is a filtered My Projects view rather than an additional independent screen design. The five Studio steps are now the approved user-facing workflow and share one layout/wizard; technical job stages remain separate.

| Area | Inventory entry | Navigation and guard |
| --- | --- | --- |
| Public | Landing Page | Branding/navigation, Sign In and Create Account CTAs; no private user data |
| Auth | Sign Up | Shared AuthLayout; healthy signup establishes a session and opens Dashboard immediately |
| Auth | Sign In | Shared AuthLayout; valid session opens own Dashboard; Sign Up/recovery links |
| Auth | Forgot Password | Shared AuthLayout; generic send result and return to Sign In |
| Auth | Reset Password | Shared AuthLayout; valid recovery context only; successful update leads to ordinary Sign In |
| Workspace | Dashboard | Authenticated owner workspace and quick creation |
| Workspace | My Projects | Owner-scoped project listing, search, filters and context actions |
| Workspace | Drafts | My Projects with Draft filter selected; uses the same card/list components |
| Workspace | Account Settings | Real editable own Full Name, read-only email, secure Change Password and separately placed required account deletion |
| Studio | Step 1 reference — Video Details | Owned draft; preserves entered dashboard idea |
| Studio | Step 2 reference — Script & Storyboard | Valid owned inputs; review/correction and explicit script decision |
| Studio | Step 3 reference — Voice & Subtitles | Current reviewed content, planned three English voice presets and subtitle setting |
| Studio | Step 4 reference — Generate Video | Final approved content/settings and authoritative submission eligibility |
| Studio | Step 5 reference — Preview & Download | Verified owned completed artifact, or truthful unavailable/error state |

Workspace navigation contains Dashboard, My Projects, Drafts and Account Settings using one active-state convention. Log Out remains available. Do not create another dashboard or separate Drafts data/visual system. The wizard contains exactly the five approved steps; this does not create new backend statuses or service boundaries.

Required PRD behaviors absent from the supplied screen list fit **within existing screens**: source-intake feedback, correctable understanding, revision recovery, previous successful versions, duplicate/delete project confirmations, availability messages and account deletion/restricted cleanup status. They are functional design gaps, not permission to add unrelated navigation. Terms/Privacy links require owner-provided legal destinations/content; this draft does not invent a legal product or new account-verification screen.

## 5. User Flows

| Journey | Required behavior |
| --- | --- |
| New visitor | Landing → Sign Up → session established → own Dashboard. “Authentication” is the session result, not an extra confirmation or mandatory second login screen. If signup succeeds but session creation fails, offer safe login/session retry without duplicate signup or email-verification demands. |
| Existing user | Landing/Sign In → valid session → own Dashboard; protect direct private URLs and clear private cached content on logout/account change. |
| Dashboard quick create | Enter idea → Create Video → owned draft/Video Details with idea prefilled. This action does not initiate chargeable AI work. Until a save is acknowledged, do not claim the idea is durably saved. |
| New video | Video Details → Script & Storyboard → Voice & Subtitles → Generate Video → Preview & Download. Approve script/scenes in Step 2, choose supported settings in Step 3, then separately confirm the complete current generation snapshot in Step 4. |
| Continue project | Dashboard/My Projects → owned project → appropriate acknowledged saved stage, current revision and genuine job/output state. Do not always reset to a blank first panel. |
| Drafts | Drafts navigation → My Projects, Draft filter selected. Empty Drafts state offers Create Video or a filter reset. |
| Completed project | My Projects → current verified output → portrait preview/download. If a newer revision fails, keep an accurately labeled Previous Version available. |
| Recovery | Forgot Password → generic acknowledgement → valid email recovery link → Reset Password → ordinary Sign In. Invalid/expired/used link offers another recovery request. |
| Processing return | Leave Studio for Dashboard/My Projects and return to the same durable accepted work. Leaving does not imply cancellation. A stopped local worker means queued/waiting, not actively rendering. |
| Failure/review return | Preserve saved draft/approved identity. Show input correction, eligible retry or support guidance based on actual error; an uncertain provider outcome must not cause an uncontrolled duplicate request. |
| Account deletion | Settings → explicit confirmation → accepted deletion/restricted status → verified cleanup completion or incomplete-deletion recovery. Refresh/stale sessions must not restore ordinary workspace access. |

On session expiry, preserve acknowledged work and offer Sign In. Restore private state only after authorization; do not expose cached project content on a public auth screen. Warn about genuinely unsaved local edits before navigation where necessary; do not warn that leaving cancels a server-accepted job. No owner allowlist, signup OTP, MFA, social login, phone login, magic-link login or mandatory email confirmation is introduced.

## 6. Pearl & Ocean Teal Design Tokens

### 6.1 Approved base palette

| Semantic foundation | Light | Dark | Status |
| --- | --- | --- | --- |
| `color.background` | `#F8FAF9` | `#111C1C` | Owner-supplied approved page backgrounds |
| `color.surface` | `#FFFFFF` | `#1D2B2A` | Owner-supplied approved primary surfaces |
| `color.text` | `#172925` | `#F4F8F6` | Owner-supplied approved primary text |
| `color.textMuted` | `#667772` | `#9CACAA` | Owner-supplied approved secondary text |
| `color.accent` / `action.primary.background` | `#168578` | `#60CBB0` | Owner-supplied approved primary teal |
| `color.borderSubtle` | `#D6E8E3` | `#324440` | Owner-supplied approved decorative/divider border |
| `color.mint` | `#BCEFE2` | No dark counterpart supplied | Owner-supplied light accent tint; do not assume identical dark use |

Light mode is the initial default. Dark mode must work across every desktop/mobile screen and state. Components reference semantic tokens rather than checking theme and hardcoding separate page palettes. No page-specific teal, sidebar gray, corner radius or shadow should be copied independently from a slightly different Stitch export.

### 6.2 Additional semantic roles — proposed derivatives for review

All values in this table are **proposals**, not sampled Stitch values. They preserve the base palette and provide contrast-aware interactive/status roles. Approve them with the shared component review before implementation; verify every foreground/background pair in the final UI.

| Token / state | Light proposal | Dark proposal | Use |
| --- | --- | --- | --- |
| `action.primary.foreground` | `#FFFFFF` | `#111C1C` | Text/icon on the corresponding approved teal fill |
| `action.primary.hover` | `#116F64` | `#79D8BF` | Shared hover fill, retaining the theme's button foreground |
| `action.primary.active` | `#0D5D54` | `#8DE2CD` | Pressed fill; no layout shift |
| `text.link` | `#116F64` | `#60CBB0` | Underlined text link; hover/visited/focus states reviewed together |
| `focus.ring` | `#168578` | `#60CBB0` | Visible keyboard focus with an offset contrasting with the underlying control |
| `border.control` | `#738F87` | `#718D86` | Control edge when its boundary is needed for identification |
| `surface.selected` | `#BCEFE2` | `#23463D` | Selected card/navigation background, plus label/check/structural selection cue |
| `action.disabled.background` | `#EFF3F1` | `#263733` | Inactive fill; muted theme text and explicit unavailable state |
| `status.success.text` / `.surface` | `#176647` / `#E9F5EF` | `#8BDFC0` / `#183B32` | Success label and background |
| `status.warning.text` / `.surface` | `#805300` / `#FFF4D8` | `#F2D28B` / `#3B3019` | Recoverable warning or waiting guidance |
| `status.error.text` / `.surface` | `#A52B36` / `#FDEEF0` | `#FFAFB7` / `#44262C` | Validation/destructive/failure emphasis |

Use primary text on selected surfaces unless a separately checked text pair is selected. Disabled controls must remain understandable; do not lower the opacity of an entire region containing necessary helper text. Error/destructive actions use the same component anatomy, with a semantic variant, rather than an unrelated red button system. Success/warning/error always include words or meaningful icons, not color alone.

### 6.3 Contrast findings from local token calculations

These are mathematical sRGB pair checks, not rendered-screen accessibility results. Ratios are rounded here for reporting; implementation gates use unrounded values.

| Pair | Approximate ratio | Consequence |
| --- | --- | --- |
| White on light primary teal | 4.51:1 | Suitable normal-text button pair at full opacity; little margin, so do not lighten fill/text or introduce translucency without checking |
| Light muted text on pearl page / white surface | 4.51:1 / 4.72:1 | Preserve full-opacity helper text; do not reduce its contrast further |
| Light teal text on pearl page | 4.30:1 | Do not use this pair for ordinary small text; use the proposed darker link token or primary text |
| Subtle light border on white / dark border on dark surface | 1.27:1 / 1.42:1 | Keep for decorative separators; use the stronger control-edge role where the boundary is essential to identifying a control |
| Dark action foreground on dark-mode teal | 8.84:1 | Use dark text on the bright teal button; white is not the default dark-button foreground |
| Dark muted text on dark surface | 6.21:1 | Suitable for secondary content at full opacity |
| Proposed light/dark control edge on surface | 3.50:1 / 4.09:1 | A stronger boundary option for interactive controls |
| Proposed status text on its status surface | 6.08:1 or greater across the listed pairs | Restrained status surfaces retain readable labels |

### 6.4 Typography, spacing and geometry contracts

The final font is **not verified**. Manrope and Plus Jakarta Sans are candidates from the brief, not a selected font pair. Inspect an actual approved reference/font manifest, select one family with recorded weights and rights, then use it across public/auth/workspace. A system fallback is an implementation fallback, not proof of the Stitch font. No font installation or external font request is authorized by this document.

| Token family | Shared contract | Measurement status |
| --- | --- | --- |
| `type.page`, `type.section`, `type.card` | Consistent heading hierarchy; page > section > card; reduce by shared responsive role without losing hierarchy | Font sizes/weights/line heights pending reference review |
| `type.body`, `type.label`, `type.helper`, `type.error`, `type.button` | Readable body; persistent labels; helper/error text not tiny; consistent button labels | Exact values pending; no screenshot-derived pixel claim |
| `space.xs` through `space.2xl` | One ordered scale for gaps, padding, section rhythm and dialog spacing | Base unit/values pending |
| `radius.control`, `radius.card`, `radius.dialog` | Controls share geometry; panels use shared variants | Exact radii pending |
| `border.width`, `focus.width`, `focus.offset` | One normal edge rule, separate clearly visible focus treatment | Exact widths pending; contrast must pass |
| `shadow.card`, `shadow.overlay` | Restrained depth with themed ink; focus/error not communicated by shadow alone | Exact offsets/blur/alpha pending |
| `control.height`, `control.padding`, `button.standard`, `button.primaryLarge` | Inputs/buttons align; loading does not change dimensions; mobile may expand width | Heights/padding pending; comfortable touch targets are required |
| `layout.authWidth`, `layout.contentWidth`, `layout.studioWidth`, `layout.gutter` | Different functional layouts consume named width/gutter tokens | Widths pending actual references |
| `breakpoint.compact`, `breakpoint.medium`, `breakpoint.wide` | A shared content-driven responsive system | Exact cutoffs pending; 390/1440 are test/reference sizes only |

Do not fill these pending values with invented measurements attributed to Stitch. Later implementation may propose explicit numbers with rationale and shared-component review.

## 7. Shared Layouts and Reusable Components

Conceptual names below describe future responsibilities, not code files created by this task.

| Component / layout | Shared responsibility |
| --- | --- |
| `PublicSiteHeader` | Brand, restrained navigation, auth CTAs and common theme control |
| `AuthLayout` | Shared centered card, common brand/header/footer, form spacing and error region |
| `AppLayout` | Authenticated desktop/sidebar and compact navigation shell with shared gutters |
| `AppSidebar` | Dashboard/My Projects/Drafts/Settings navigation and consistent active state |
| `AppHeader` | Current context, accessible mobile navigation, account/logout and theme control |
| `ThemeToggle` | One theme affordance and accessible name/state across layouts |
| `PageHeader` | Shared page heading, concise context and appropriate primary action |
| `PrimaryButton`, `SecondaryButton` | Default/hover/pressed/focus/loading/disabled variants, plus semantic destructive use |
| `TextInput`, `TextArea` | Persistent label, helper, required/invalid state and linked error; no placeholder-only labels |
| `SelectableCard` | Category/style/voice selection with keyboard-operable radio semantics and visible checked state |
| `StatusBadge` | Canonical state presentation with text/icon and consistent spacing; never a fake metric |
| `ProjectCard` | Owner project information, one context-sensitive main action and accessible overflow actions |
| `EmptyState`, `LoadingState`, `ErrorState` | Same illustration/icon restraint, copy hierarchy and recovery-action placement |
| `ConfirmationDialog` | Named modal, focus containment/return, explicit cancel/confirm and truthful action consequences |
| `StudioLayout` | Same header, content frame, save state, progress, actions and responsive behavior across all Studio references |
| `WizardProgress` | Exactly five approved steps, shared progress/return behavior and current-step semantics; no backend-status inference |
| `VideoPlayer` | Portrait private MP4 playback, accessible controls, loading/error handling and clear aspect containment |

Use one shared icon family, stroke weight, optical sizing and interaction convention; its actual set/license is pending references. Decorative icons are hidden from assistive technology; meaningful icon-only controls have accessible names. Password visibility and navigation controls are functional; decorative internal form icons or provider logos are unnecessary.

**Studio Steps 1–5 must never become five unrelated layouts.** All five approved steps share `StudioLayout` and `WizardProgress`; only the main panel and relevant action labels change. Avoid duplicating sidebar, header, progress markup or button styles per step. Layout variants belong to the shared component contract rather than arbitrary page overrides.

## 8. Responsive and Theme Rules

| Context | Required behavior |
| --- | --- |
| Desktop | Workspace sidebar where appropriate, spacious bounded content and useful multi-column panels; auth remains centered; landing uses its public layout |
| Tablet | Collapse columns/sidebar when content stops fitting, preserving navigation and action order; no independent tablet palette |
| Mobile web | Compact header and accessible navigation, single-column cards/forms, large clear actions, no clipped footer or horizontal page overflow |
| Studio on mobile | Compact progress, meaningful current-stage label, scrollable main content, Script/Storyboard tabs and safe space around persistent controls |
| Portrait preview | Preserve 9:16 in its container without pushing page controls offscreen; player controls remain reachable |
| Light/dark parity | Same content, errors, dialogs, filters, pending states and navigation in both themes at every size |
| Zoom / long content | Wrap long project titles, errors and button labels; no essential information depends on truncation/hover |

Light is the initial default; explicit theme selection must apply globally rather than resetting on each screen. Whether preference is device-local or account-persisted is pending handoff and must not create a new profile-schema requirement here. Do not introduce automatic OS-theme behavior contrary to the default without a documented decision. App theme changes do not mutate video colors, approved scripts or render artifacts.

Mobile navigation must expose the same permitted destinations as desktop, indicate the active destination and support keyboard dismissal/focus return. Script/Storyboard tabs are real panels with selection semantics, not decorative demo-state selectors. A sticky action area may be considered only after reference review and must not cover focused fields, validation or captions.

## 9. Detailed Screen Specifications

### 9.1 Landing Page

Use a text-focused hero, generous whitespace and Pearl & Ocean Teal. Include product features/benefits, the three video categories, How It Works, eligible example videos or honest placeholders, Who It's For, a simple CTA and a minimal footer. No hero photography, decorative background image, large blue/purple section, FAQ, invented pricing, testimonials, customer counts or user statistics.

The footer contains essential branding, approved legal links and copyright only. Brand wording/logo and legal content are pending supplied references. “How It Works” reflects exactly the approved five-step Studio flow without claiming five backend services or an extra stage.

Public example media needs verified rights for the actual recording/artwork. Existing Free-plan Bella recordings remain **noncommercial prototype assets** and must not be silently placed on a commercial promotional landing page. Use licensed examples or labeled placeholders while rights are unresolved. Failure to load an optional example must leave text and CTAs usable. Public activation stays M6, not M1.

### 9.2 Authentication — one visual template

All four auth screens use `AuthLayout` and the same labels, inputs, buttons, focus, error/success treatment, header and restrained footer. No prefilled credentials, duplicate design-preview controls, internal technical labels, provider/organization branding, social login or fake identity badges. Never retrieve or display an existing password; a password input starts empty, not with misleading masked stored characters.

| Screen | Baseline controls and interaction | States |
| --- | --- | --- |
| Sign Up | Full Name, Email Address, Password, matching Confirm Password, Terms/Privacy acknowledgement and Create Account; healthy success goes immediately to own Dashboard. Email/password remain the credentials; name is editable profile data. | Empty, field/mismatch errors, submit pending, signup failure/throttle, account-created/session-retry, authenticated success |
| Sign In | Email/password, accessible password-visibility action, Forgot Password and Sign In; use one consistent show/hide convention wherever applicable. | Empty, invalid credentials, request failure/throttle, pending, valid session, expired-session return |
| Forgot Password | Email, Send Reset Link, return to Sign In; generic result regardless of account existence. | Validation, sending, neutral acknowledgement, retryable failure/throttle |
| Reset Password | New password and matching confirmation, submit update only in a valid recovery context; confirmation is a UI check, not existing-password retrieval. Success ends recovery context and directs ordinary login. | Valid/invalid/expired/used recovery, password-policy/mismatch errors, saving, failure, success |

**Approved Sign Up behavior:** collect the approved fields and reject mismatched password confirmation before submission. Never persist confirmation/plaintext passwords; use the existing Supabase credential and security boundary. Full Name may later be edited by its authenticated owner and does not establish verified identity or authority. The Terms/Privacy acknowledgement remains part of the form, but actual legal text/links, whether an affirmative required checkbox or linked acknowledgement text is intended, and any recording/version/retention decision still require explicit owner clarification before affected implementation. Displaying links is not automatically a consent record; no consent table/API or compliance policy is designed here. Signup still establishes a session without mandatory email confirmation or a required separate login.

Passwords support paste/password managers, correctly named autocomplete and clear policy messaging. Keep raw passwords and recovery tokens out of routine logs/errors. Account lookup, email ownership and session refresh follow the approved architecture; the visual design does not add an email-confirmation screen.

### 9.3 Dashboard — Option A quick creation

Place the welcome heading and prominent video-idea input with Create Video first, followed by Explore Ideas with three simple example prompts and Recent Projects. Example prompts can be static authored starting points; clicking one fills editable text and does not secretly call AI. Differentiate this from the PRD's optional AI Suggest Ideas operation, which returns three generated concepts only after an intentional later M2 action.

Create Video opens an owned draft/Video Details view with the entered idea preserved. It must not synthesize speech or start chargeable planning just by leaving Dashboard. Validate required idea input and retain it if creation/save fails. A personal welcome uses the actual authorized Full Name when available, with a neutral fallback; it is never a fabricated role or identity badge.

Recent cards contain actual title/type/status/update information and thumbnail if available, using the same `ProjectCard` as My Projects. Empty state offers a clear first-video action; loading and list failure do not invent projects. Exclude credits, quotas as balances, GPU/engine details, workflow bars and analytics unsupported by actual product state. Required limit/availability messages remain accessible when an action is genuinely blocked; hiding a quota dashboard does not remove backend safeguards.

### 9.4 My Projects and Drafts

Provide search, status filters, compact responsive project cards and an honest result count only when actually known. Search/filter scope is the current owner's authorized project list. Do not turn filtering into global discovery, sharing, collaboration or another data store. Pending matching details and exact UI wording are implementation decisions, not new API contracts here.

Cards show title, category, truthful current state, actual updated information and one main action: Continue Editing, Review, View Progress, or Preview & Download as appropriate. Required Duplicate and Delete Project remain available through a consistent accessible secondary/overflow menu when implemented in M4. A simple card does not remove PRD F15/F18. Delete requires explicit confirmation, describes the affected project and preserves unrelated/shared assets. Duplication opens a new independent unapproved draft.

The following presentation mapping preserves existing PRD/architecture project/job concepts; it defines no new database enums:

| Supplied UI label | PRD relationship to resolve/use | Main action |
| --- | --- | --- |
| Draft | PRD Draft | Continue Editing |
| Awaiting Review | Secondary current-revision review condition under its actual Draft/Needs Attention state; script or final confirmation is still required. | Review Script & Storyboard / Review Settings as appropriate |
| Queued | Job substate under Generating; worker may be waiting/stopped locally | View Progress |
| Processing | Active job substate under Generating | View Progress |
| Completed | Presentation synonym for succeeded, validated and privately available Ready output | Preview & Download |
| Failed | Failed attempt/Needs Attention relationship; do not discard a prior successful output | Resolve Issue; Previous Version remains available where applicable |

Do not label a file Completed merely because bytes were uploaded. A valid previous video may coexist with a newer Draft/Generating/Needs Attention revision. Show that distinction rather than overwriting historical success with a misleading single badge. Empty states distinguish no projects, no search/filter results and no drafts; failures offer retry without clearing acknowledged content. Drafts opens this same view with Draft selected.

### 9.5 Account Settings

Keep one basic account screen with real information and restrained sections. **Profile Information** contains editable Full Name, read-only Email Address and Save Changes. **Password & Security** contains Change Password. Only the authenticated eligible owner may save their name; do not allow the profile action to alter email, roles, lifecycle or ownership. Password changes use secure authenticated Supabase-supported behavior with reauthentication where required; exact provider/session behavior is validated before implementation. Preserve Forgot Password/Reset Password. No existing password is retrieved, displayed or represented as misleading prefilled masked characters. Exclude photos, public profiles, roles/organizations/teams, social accounts, billing and advanced preferences. Do not invent Verified Identity, Organization Controlled, enterprise/cluster labels, password age or security scores.

**Mandatory missing PRD treatment:** include Delete Account, explicit confirmation and the deleting/incomplete/deleted states specified in PRD §§11.4/22.4 and AC48–AC51. This does not add an unapproved feature; it preserves an existing P0 obligation. The final visual placement must be reviewed alongside the supplied simple settings design. Cancellation makes no change. Confirmation explains permanent project/source/video deletion, stopping work, inability to recall downloaded copies and the residual lifetime of already issued signed links. Do not report deletion success until required data cleanup and Auth removal are verified.

After deletion acceptance, only a narrowly authorized cleanup-status/retry view remains while permitted; no ordinary dashboard, private-project reads or new uploads/generation. Incomplete cleanup remains restricted and recoverable. Current-account checks, not a stale token or optimistic success screen, control access. Deletion remains M4 with M1 data/authorization foundations and M5 failure tests; the approved limited profile/authenticated-password controls align with M1 basic account/auth responsibilities. Actual deletion entry/dialog/in-progress/incomplete/completed visuals are still missing design references.

## 10. Video Creation Studio Workflow

### 10.1 Approved five-step Studio

PRD v2.5 §§11–12 and AC08 now require exactly **Video Details → Script & Storyboard → Voice & Subtitles → Generate Video → Preview & Download**, replacing the former four-stage indicator by explicit owner decision on 22 October 2026. There is no sixth step. All five use one Studio layout and wizard component; only step-specific content/actions change.

| User-facing step | Required decision or result |
| --- | --- |
| 1 — Video Details | Owned inputs, compatible category/style, automatic character preset and target |
| 2 — Script & Storyboard | Correctable understanding and explicit approval of the current script/planned scenes |
| 3 — Voice & Subtitles | Supported English voice/sample and subtitle choices; no full narration automatically starts |
| 4 — Generate Video | Separate explicit final confirmation of complete current content/assets/settings, then genuine durable-job progress/recovery |
| 5 — Preview & Download | Verified private portrait MP4, authorized playback/download and review return |

These are UI steps, not five backend services, task kinds, database states or mandatory independently deployed pages. Canonical lifecycle, technical worker stages, idempotency/retry/reuse and private-publication checks remain governed by the architecture. This document makes no persistence-field, routing or endpoint design decision.

### 10.2 Step 1 reference — Video Details

Required visible fields are video idea, category, compatible visual style and supported target duration. Dashboard text appears prefilled and remains editable. Actions are Back to Dashboard, Save Draft and Continue to Script. No AI prompt enhancement control is added. Continue must not imply that unvalidated inputs or a save already succeeded.

| Display category supplied in brief | PRD type | Allowed styles | PRD default |
| --- | --- | --- | --- |
| Educational | Educational Video | Animated Explainer, Cartoon Teacher, Cartoon Presenter | Cartoon Teacher |
| Product Branding | Product Video | Animated Explainer, Cartoon Presenter | Animated Explainer |
| Software Explainer | Project Explainer | Animated Explainer, Cartoon Presenter | Animated Explainer |

These labels describe the same three types; they do not create extra types. Final canonical/display naming is a handoff decision. Exactly seven type/style pairs are accepted; product/project Cartoon Teacher is rejected by UI and server. Use automatic prepared teacher/presenter presets; no character picker/editor. Incompatible changes are explicit, reviewable and invalidate affected approval; no silent style fallback.

Duration follows the PRD: **integer seconds, hard 62–90 inclusive, default target 75**. Accepted final duration for target T is `max(62, T - 3)` through `min(90, T + 3)`, verified from actual media. Illustrative 30/60/90 controls are not valid production options. UI helper text distinguishes a requested target, planning estimates and later measured duration; no rendering-time promise.

**Required PRD input gap in the simplified design:** place the appropriate existing category-input module inside Video Details, rather than removing input capabilities or creating a new stage. Product intake covers required product identification/description, available photos and confirmed facts; education covers topic and optional audience/objectives/support; project intake covers screenshot/text/PDF/DOCX paths, name/status (Concept/Prototype/Available) and limitations. Render actual upload/pending/invalid/replacement states and bounded previews. Exact source extraction/understanding belongs to M2; M1 handles owned staging and initial safety. Follow PRD §§6.3/7/13 limits rather than inventing new upload formats. No public source URLs, website crawling, OCR or music upload is added.

### 10.3 Step 2 reference — Script & Storyboard

Desktop uses a script editor on the left and compact expandable scene cards on the right. Mobile uses Script and Storyboard tabs showing one primary panel at a time. Cards distinguish narration, authored visual description, character visibility/actions and **estimated** duration; they are not actual audio timestamps. Include the correctable understanding/source limitations required by F06/AC18, especially unsupported product claims and screenshot-only software assumptions.

User-initiated script generation has a genuine preparing/queued/loading state and a failure state preserving the last successful draft. Do not call AI on every keystroke or claim audio exists. Support direct edits, permitted scene edits, refinement and regeneration confirmation; retain prior successful content and restore-previous behavior under F08/AC20/AC63. Unsupported templates/actions or incomplete understanding block approval with actionable guidance, not executable AI output.

Save Draft acknowledges a successful save; editing invalidates affected approval. Step 2 requires an explicit current script/storyboard approval before continuing. **That preliminary decision is not final generation authorization and does not start full narration/rendering.** Step 3 settings selection is followed by the separate explicit Step 4 complete-configuration confirmation described in section 10.7.

### 10.4 Step 3 reference — Voice & Subtitles

Show exactly three configured English voice options, a clear selected/default state, appropriately permitted short sample playback, a subtitle on/off switch (default on) and a concise actual review summary. Actions are Save Draft, Back to Script and Continue to Generation. Use the same cards/switch/helper/error tokens in both themes.

Marcus, Sarah and David are illustrative names only. No provider identity, voice ID, availability, accent or commercial-use claim is confirmed by those labels. M0 Bella alone does not verify the three-voice matrix. M3 must establish identities, compatible endpoint/model behavior and intended-use rights before use. Unavailable voices prompt reselection rather than silent substitution.

Distinguish playback of an existing eligible cached sample from an intentional sample-generation request. A preview is short speech (PRD proposed maximum 15 seconds), not full narration; it remains subject to real availability/usage safeguards without showing fabricated balances. Provide loading, sample failure and selected-but-unavailable states. A voice change invalidates dependent audio/timeline/render approval; subtitle visibility requires an updated confirmed revision and compatible audio may be reused. Burned-in captions are part of the video, not the player's ordinary caption toggle.

### 10.5 Step 4 reference — Generate Video

Require explicit final generation confirmation for the current content/settings snapshot. Repeated clicks or returning to a pending submission refer to the same accepted work under backend idempotency; a disabled button alone is insufficient. Invalid approval, limit/pause/restriction, missing assets or unsuitable inputs produce clear guidance and preserve saved work.

Use a small subtle animated video/SVG icon integrated in the shared surface; no separate black SVG panel and no decorative demo-state controls. Reduced-motion mode uses a static indicator plus status text. Progress is a truthful named stage, not fake percentages or invented completion time:

| User-facing label | Display rule |
| --- | --- |
| Waiting to start / Queued | Accepted work is queued or the local worker is stopped; do not pretend an active stage is running |
| Preparing narration | Actual narration stage is active |
| Creating animations | Actual authored animation/cue preparation is active |
| Synchronizing voice and visuals | Actual alignment/timeline processing is active |
| Rendering your video | Actual rendering/output work is active |
| Video ready | Media validation, private availability and final publication have completed |

The brief's labels are presentation vocabulary. The worker's real stage order and coarser/finer state must drive them; do not animate a fixed timer through all labels or label completion before private publication. Include recoverable failure, input-review return, retry-in-progress, uncertain outcome and unavailable service states. Offer retry only when the backend deems it eligible; some failures need correction or support. Do not display provider names, credit/quotas dashboards, infrastructure, fake autosave or engine details. Necessary plain-language limit messages from AC53 remain required.

Returning to Dashboard/My Projects does not cancel accepted durable work. On return, load authorized actual status. A previous successful version remains accurately labeled if a new attempt fails. A local worker must run for local progress; production independence is a later M6 gate, not a promise made by this design.

### 10.6 Step 5 reference — Preview & Download

Use an accessible portrait **9:16** player and actual completed title/category/duration/update information, Download Video, My Projects and Back to Dashboard. Planned output configuration is **MP4, 1080 × 1920, 30 fps, H.264/AAC** under the PRD's validated settings; no 4K/60 fps claim or additional format selector. Show actual output metadata, not an estimate or a fictional export.

Playback/download require current authorized ownership and eligible private artifacts. A link expiry or playback error offers reauthorization/reissue or retry without regenerating narration/video. Do not expose raw Storage paths, tokens or provider errors. An accepted download action is not proof that the browser saved the file; wording should reflect actual browser behavior. Show unavailable/invalid media, network failure and expired-access states. No public sharing, social publishing or advanced editor is introduced.

PRD F13 also requires a route back to Script & Storyboard or applicable settings for revisions. Include a consistent secondary return/revise action within the five-step navigation; changes retain prior successful output, invalidate affected approval and reuse compatible saved work. This is not a manual timeline editor. Playback and export are both in approved Step 5; no extra Download stage is introduced.

### 10.7 Approval, saving and resume contract

Step 2 records explicit approval of the exact current script and planned scenes. Step 4, after Step 3 settings, separately confirms the exact current narration/scene plan, source identities/checksums, type/style/character/schema/template versions, voice/model/settings, subtitles and target, with the current content-approval identity. Neither preliminary approval nor step navigation automatically dispatches full narration/rendering. Content changes invalidate affected script/scene approval and final confirmation; voice/subtitle or other dependent settings invalidate the relevant final confirmation/artifacts, retaining valid unchanged content decisions where safe. Confirm again for the complete current snapshot before idempotent generation admission. Earlier intentional planning/sample requests retain their own eligibility/usage controls.

Show Unsaved Changes / Saving / Saved / Save Failed / Conflict only when true. Manual Save Draft and later autosave share durable acknowledgement and conflict rules; PRD's proposed one-second inactivity debounce is not evidence a save occurred. A conflict preserves local edits for recovery rather than overwriting acknowledged content. Resume restores the appropriate one of five UI steps plus saved content and actual content-approval/final-confirmation/job/output state. UI step count does not define storage fields or status enums; those contracts remain later design work.

## 11. Loading, Error and Empty States

| State | Shared presentation and next action |
| --- | --- |
| Loading initial data | Restrained skeleton/indicator for the real pending region; preserve page structure; no fake project/video values |
| Empty workspace / drafts / search | Context-specific explanation with a useful Create Video, clear-search or reset-filter action |
| Validation error | Persistent field label, adjacent specific message, summary/focus when appropriate; preserve input |
| Request failure | Plain explanation and eligible retry; do not discard prior success or expose secret/provider diagnostics |
| Unsaved / saving / saved | Visible actual persistence state; Saved only after server acknowledgement |
| Conflicting edit | Explain another version exists, preserve local text and offer safe reload/copy recovery |
| Confirmation | State exact consequence, explicit Cancel/Confirm, safe focus; regeneration/project deletion/account deletion have distinct consequences |
| Success | Confirm the completed operation without claiming another stage happened |
| Disabled action | Explain the prerequisite or actual restriction; no color-only or unexplained dead button |
| Processing / queued | Genuine stage/wait state, durable navigation and no fabricated percentage/ETA |
| Failed generation | Separate correctable input, eligible retry and support-needed outcomes; prior valid assets remain |
| Completed generation | Only validated current private output is labeled Ready/Completed |
| Auth required / access unavailable | Safe Sign In or generic authorized-access guidance; do not disclose foreign resource existence |
| Link expired / media unavailable | Reauthorize/reissue or retry actual playback/download; no implicit paid regeneration |
| Account deleting / deletion incomplete | Restricted cleanup status/reference with honest recovery; no normal data access or false success |
| Limit / pause / account restriction | Simple relevant recoverable message; reset time only if known; permitted saved content remains accessible |

Keep text, icons, hierarchy, spacing and action placement consistent across these states in all themes. Screen readers receive appropriate status announcements without repeated noisy updates. Loading should not continuously steal focus. Do not infer an autosave, successful deletion or accepted job from an animation alone.

## 12. Accessibility Standards

PRD AC59 establishes accessibility review; AC61 retains core readable/coherent media output. The following are handoff/QA targets, not a claim that an unimplemented interface has passed an audit:

- Use semantic headings, landmarks, real form controls and buttons. Inputs have visible labels, required/policy guidance, correct autocomplete and programmatically associated errors.
- All workflows work by keyboard, including selectable cards, mobile navigation, project menus, tabs, dialogs and video controls. Keep visible focus, logical order, no focus traps outside actual modals, and focus return after dismissing a dialog/menu. Do not hide focused content behind persistent bars.
- For text, target at least **4.5:1** contrast for ordinary text and **3:1** for qualifying large text. Essential control/state cues target **3:1** against adjacent colors. Check unrounded ratios on the final theme combinations, including hover/focus/errors, not just the base palette. See [W3C text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- Provide comfortably sized controls; **44 × 44 CSS px** is a proposed practical touch target, not a measurement from Stitch or a claim that WCAG AA requires that exact size everywhere. [W3C Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) describes 24 × 24 CSS px or applicable spacing/exceptions. Review dense menus/cards/toggles rather than shrinking targets to match an unavailable image.
- Status/selection/error meaning uses words and semantics in addition to color. Tabs/cards expose current selection; progress exposes the current effective stage. Announce asynchronous save/job changes politely and urgent validation/access failures appropriately.
- Support text resizing/reflow, narrow viewports, keyboard zoom and long content without page-level horizontal overflow. Tables/cards/scene panels must adapt; do not fix production widths at the approximate screenshot dimensions.
- Respect reduced-motion preferences for decorative transitions/loading; retain all status information when motion is removed. Do not autoplay audible examples or voice samples. The finished-video player retains accessible controls and preserves approved burned-in subtitle behavior.
- Give uploaded previews useful descriptions and file labels, with safely rendered user text. Decorative icons/illustrations do not create repetitive announcements. Review privacy/focus behavior after session expiry/logout/account change.

Verify desktop/tablet/mobile and both themes with keyboard and assistive technology during implementation/private testing. Shared tokens alone do not establish accessibility compliance.

## 13. Design Consistency Requirements

Use the same semantic token registry and component variants for background, surface, text/muted text, teal/mint, borders, radius, shadow, typography, spacing, inputs, buttons, cards, icon family, sidebar/header, navigation, widths and breakpoints. The public/auth/workspace layout structures differ by purpose; their visual identity must not drift.

If two Stitch references disagree, record the variance, choose the shared-system treatment through owner/component review, and apply it everywhere. Do not solve it with isolated per-page color/radius/font overrides. Loading/error/disabled states are part of the same component definition; desktop dark cannot be omitted because an export is missing.

Cross-screen QA must explicitly compare auth forms, Dashboard/My Projects cards, all Studio reference panels, dialogs, mobile navigation and the player. Check typography/gutters/control heights/primary-action position in light and dark. No separate black loader panel, decorative infrastructure metrics, fake state tabs or inconsistent sidebar should survive a screenshot comparison. All screen state copy uses real information and distinguishes planned features from available behavior.

## 14. PRD/Milestone Traceability

The AC/F references below are actual identifiers from PRD v2.5; no new PRD acceptance ID is created. “Missing” in the reference column means **no local approved Stitch asset found**, not a proposed filename. All implementation results are **Not Implemented/Not Verified** for this UI task.

| Screen | Purpose and approved functionality | PRD reference | Implementation milestone | Required UI states | Key interactions | Available Stitch reference | Unresolved issues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Landing Page | Owner-supplied text-led marketing, categories/features/five-step How It Works/examples/CTA/minimal footer | UI brief; PRD §29, AC47 licensing/public release | M4 presentation integration; M5 QA; M6 public activation | Media loading/fallback, navigation/focus, both themes | Sign Up/Sign In; eligible examples only | Missing | Logo/copy/legal/rights |
| Sign Up | Approved full-name/email/password/confirmation/acknowledgement form, session and immediate own Dashboard | F01; AC01, AC04, AC05 | M1 auth/profile; M5 abuse/regression | Validation/mismatch, pending, failure/throttle, session retry, success | Create Account; no signup verification or password/confirmation persistence | Missing | Legal content, acknowledgement interaction and any recording decision |
| Sign In | Password login/logout and protected access | F01; AC02, AC05, AC06 | M1; M5 regression | Invalid credentials, pending, expiry, failure | Show/hide password; Forgot Password; login | Missing | Auth template/font measurements |
| Forgot Password | Generic recovery request | F01; AC03, AC05 | M1; M5 recovery tests | Validation, sending, neutral result, failure | Request reset; return Sign In | Missing | Recovery copy/legal destinations |
| Reset Password | Valid-context password update then ordinary login | F01; AC03 | M1; M5; M6 production redirects | Invalid/expired/used link, mismatch, saving, success | Save new password; request another link | Missing | Reference states; no existing-password display |
| Dashboard | Owner workspace, Option A quick-create and recent projects | F02, F14; AC06, AC34, AC43 (M1 subset) | M1 foundation; M4 later actions; M5 full journeys | Loading, empty, create/save/list error | Prefill Video Details; continue owned project | Missing | Real greeting if name unapproved; static prompts vs M2 AI ideas |
| My Projects | Owned search/filter/cards and context actions | F02, F13–F18; AC06, AC34–AC38, AC43, AC63 | M1 basic list/save; M4 duplicate/delete/media actions; M5 integration | Empty/no results, loading/error, each genuine state | Continue/review/progress/preview; overflow duplicate/delete | Missing | Display labels vs canonical project/job states |
| Drafts | Filtered My Projects | F02, F14; AC06, AC34 | M1 basic filtering; M4 full resume; M5 | No drafts/loading/filter error | Open Draft filter; resume | Missing | Shares My Projects reference; not separate schema/system |
| Account Settings | Own editable full name/read-only email, secure authenticated password change and mandatory deletion/status | F01, F23; AC05, AC06, AC48–AC51; §23.3 proposed supplemental checks | M1 limited profile/password controls/state foundations; M4 deletion; M5 tests | Loading/saving/error/reauthentication; confirm/deleting/incomplete/deleted | Save own name; provider-supported password change; separate explicit deletion | Missing | Provider-specific flow validation; deletion visuals; supplemental-check review |
| Video Details | Type/style, duration, owned category inputs | F03, F04, F19, F20; AC07–AC09, AC14–AC16, AC34, AC39 | M1 draft/staging; M2 full inputs/planning; M4 full navigation; M5 | Validation, upload pending/invalid, saving/conflict | Prefill, choose compatible options, Save Draft/Continue | Missing | Source-input visual gaps; illustrative duration controls must match 62–90 integer target |
| Script & Storyboard | Understanding, scene/narration edit, regenerate/refine and explicit current content approval | F05–F08, F14; AC17–AC20, AC22, AC23, AC34, AC39, AC63 | M2 planning/content approval; M4 complete review UX; M5 | Preparing/queued, editable, invalid, generation/save failure/conflict | Correct facts, expand cards, tabs, approve script/scenes without automatic narration | Missing | Actual source/editor reference details |
| Voice & Subtitles | Three English presets, permitted samples, subtitle toggle | F09, F12; AC21, AC22, AC28, AC30 | M3 voices/audio integration; M4 controls; M5 matrix | Loading/sample failure, selected/unavailable, saved/invalidated | Sample/select; final settings review | Missing | Actual eligible voice identities/rights; no illustrative-name assumptions |
| Generate Video | Approved durable job and honest stage/recovery | F16, F22, F24; AC23–AC25, AC27, AC29–AC33, AC36, AC40, AC41, AC44, AC52–AC58, AC63 | M3 jobs/render/private publication; M4 controls; M5 recovery | Confirmation, queued, active, failure/eligible retry, ready/held | Submit once; return to saved progress | Missing | Stage labels to real backend states; approved loader asset |
| Preview & Download | Step 5 private portrait playback/export and review return | F13, F17; AC06, AC28–AC30, AC36, AC38, AC61, AC63 | M3 verified artifact; M4 preview/download/revisions; M5 full journey | Player loading, ready, access expiry, download/media error | Watch, authorized Download, My Projects/Dashboard/review | Missing | Actual rights/metadata and responsive player reference |

Across all rows, AC59 applies to accessibility/usability, AC45 to integrated local/private acceptance and AC47 to public activation. Account restriction/deletion and private ownership must apply at introduced M1 paths immediately; later milestones add their operations rather than postpone M1 isolation tests. No successful UI checklist can substitute for direct two-account API/RLS/Storage tests.

**Requirement preservation:** PRD v2.5 retains **63 acceptance rows, AC01–AC63, including 47 P0** (13 P1 and 3 P2). Only the directly affected wording of AC01, AC08, AC23 and AC59 changes under explicit owner authorization; no ID/priority is removed, renumbered or downgraded. Two proposed supplemental own-name/password checks in PRD §23.3 remain outside the 63-row baseline for owner review, not new numbered criteria or Passed results. Every P0 remains mandatory before public release. Outstanding reviewer numeric scores and pilot comprehension stay **Not Verified — P2 evidence outstanding**, tracked to M5. Post-V1 visual recommendations, manual video themes/branding, character/voice matching and optional licensed/user/AI music stay outside V1 and M0–M6 exit scope.

### 14.1 Approved requirements alignment audit — 22 October 2026

“Aligned” below means documentation reflects the authorized decision; **implementation/testing remains Not Verified**. Original conflicts refer to the historical PRD v2.4 / Architecture v1.1 baseline, not current requirements.

| Approved decision | Original conflicting provision | Updated document sections | Acceptance reference | Milestone assignment | Verification status | Outstanding owner detail |
| --- | --- | --- | --- | --- | --- | --- |
| A — exactly five common-layout Studio steps | PRD v2.4 §§6.1/11.3/12/AC08 and architecture §2 required four stages | PRD v2.5 §§6.1/11.3/12/23.2; architecture v1.2 §2.1; this §10.1; README/AGENTS/M1 plan/roadmap | AC08 and AC59 wording revised; identifiers/priorities retained | M1 UI foundations only; M2–M4 full capabilities; M5 journeys | Documentation aligned; no application result claimed | Missing Studio visual exports; no workflow-count decision remains |
| B — content approval plus separate complete generation confirmation | Prior combined approval wording did not explicitly distinguish the two user decisions | PRD §§14/18.2; architecture §9; this §§10.3/10.5/10.7 | AC23 revised; AC14/AC19/AC22/AC63 retained | M2 script/scene decision; M3 final snapshot/admission; M4 full controls; M5 regression | Documentation aligned; backend behavior Not Verified | Exact copy/visual treatment from references; existing snapshot/idempotency invariants fixed |
| C — approved signup fields | PRD v2.4 §11.1 said signup collects email/password only | PRD §§11.1/21/23.2; architecture §6.1; this §9.2; M1 §M1.2 | F01/AC01 aligned; AC02–AC06 retained | M1 signup/profile; M5 validation/abuse regression | Documentation aligned; no form or credential change implemented | Legal content, required interaction and any acknowledgement recording/retention |
| D — limited own-name/read-only-email/password settings | Minimal settings lacked explicit name editing/authenticated password management | PRD §§11.4/21/23.3/30; architecture §§6.1/17; this §9.5; M1 §§M1.2–M1.3 | F01; AC05/AC06 remain; two proposed supplemental checks, no new AC row | M1 limited account/auth controls; M4 overall lifecycle; M5 integration | Documentation aligned; supplemental test-coverage addition proposed for review | Provider-specific flow validation; no new profile feature decision needed |
| E — mandatory deletion | Stitch brief omitted its visual treatment despite existing PRD requirement | PRD §11.4 and F23 retained; architecture §16.2; this §9.5/inventory | AC48–AC51 unchanged and mandatory | M1 state/authorization foundations; M4 deletion; M5 recovery | Documentation retained; deletion implementation Not Verified | Supply entry, destructive dialog and accepted/incomplete/completed visuals |
| Preserve duration contract | Illustrative 30/60/90 mockup values could conflict with PRD | PRD §§6.3/17 unchanged; this §10.2 | AC29/AC30 unchanged | M3 real fit; M5 boundaries | Requirements retained; no new video generated | Correct those display values in actual exports if present; files not inspected |
| Preserve canonical lifecycle | Friendly labels could be mistaken for new persisted states | PRD §11.2; architecture §12.2; this §9.4 | AC24/AC25/AC31/AC36/AC63 unchanged | M1 draft state; M3 jobs; M4 controls; M5 recovery | Presentation mapping documented; no enums/API designed | Actual state-specific visual references |
| Preserve shared design/rights | Minor external-screen variations and missing assets | This §§2/6–8/12–13; PRD release constraints retained | AC47/AC59/AC61 unchanged except AC59 step wording | Shared M1 UI foundation; M4/M5 full QA; M6 public rights | Palette preserved; no visual inspection or compliance result invented | Font/metrics/icons/semantic-token review and actual commercial asset rights |

## 15. Outstanding Design Decisions

The former workflow-count, signup-field, limited-settings and two-decision requirements conflicts are resolved by the owner's 22 October 2026 authorization, as audited in §14.1. Remaining items below are genuine details or missing evidence, **not a request to reauthorize the approved product direction**. No local issue label is a new PRD acceptance identifier.

| Outstanding item | Required decision or evidence | Timing / boundary |
| --- | --- | --- |
| Legal acknowledgement | Supply actual legal text/links; clarify required checkbox versus linked acknowledgement behavior and whether anything is recorded, with any version/retention requirements explicitly decided. Inclusion is approved; neither link display nor a UI check silently creates a consent record. | Before affected signup implementation or data/API design; no consent schema in this task |
| Deletion visual references | Supply the separate action, explicit destructive dialog, accepted/in-progress, incomplete/recovery and completed treatments. F23/AC48–AC51 remain mandatory. | Before final lifecycle UI review; M4 behavior remains assigned |
| Other actual Stitch assets | Supply approved desktop/mobile references and revision provenance, logo/icon/font manifest; verify shared tokens where exports disagree. Desktop dark support remains required without a dedicated export for every screen. | Before visual fidelity and final metrics review |
| Typography/geometry/theme details | Choose the actual font, token measurements, derived semantic colors and device/account theme preference; no guessed screenshot metrics or advanced preference product. | Shared UI handoff; database implications only under separately authorized later design |
| Password-flow details and supplemental tests | Validate the secure provider-supported authenticated change and any required reauthentication/session handling; review the two proposed supplemental checks in PRD §23.3 without altering the 63-row baseline. | Before relevant implementation; M1 limited auth/profile and M5 regression |
| Input/revision visual completeness | Incorporate existing source intake, correctable understanding, revision recovery and previous-output controls into the approved five steps. | M2–M4 functional design; M5 integrated review |
| Duration illustrations | Any supplied 30/60/90 mockup selector must be corrected to integer targets 62–90/default 75; final tolerance remains unchanged. No actual export was inspected. | Before duration-control implementation/visual approval |
| Landing assets and rights | Confirm final brand/copy/legal destinations and actual eligible commercial example media; retain placeholders until rights are established. Free-plan M0 narration stays noncommercial. | Before public marketing/M6 |
| Actual voice presets | Establish three eligible English identities, permitted samples, model/endpoint/rights and unavailable-state copy. Illustrative names are not provider IDs. | M3 integration, not new M1 generation scope |

The revised PRD, architecture and this design draft are ready for owner review of the recorded alignment; none is automatically approved as a whole. No database/API design or implementation starts without separate authorization.

## 16. Implementation Handoff Checklist

### Documentation review now

- [x] Read the required project sources and preserve M0/M1 status and milestone assignments.
- [x] Inventory all 14 supplied entries, treating Drafts as My Projects filtering.
- [x] Record no local Stitch assets found and distinguish existing M0 media from application UI references.
- [x] Specify one shared Pearl & Ocean Teal system with approved base colors and clearly proposed semantic derivatives.
- [x] Document desktop/tablet/mobile and light/dark parity, including desktop dark without dedicated screenshots.
- [x] Record the explicitly authorized five-step, signup/basic-settings and two-decision alignment in the relevant requirements; preserve status mappings and mandatory missing deletion visuals.
- [x] Map screens to actual PRD IDs and their existing implementation milestones; preserve all 63 criteria and 47 P0 priorities.

### Gates before affected implementation — not completed by this draft

- [ ] Owner reviews the revised documents; resolve actual legal/recording, supplemental-check and visual-detail questions in section 15 without reopening already approved A–E decisions.
- [ ] Actual approved Stitch exports/references, logo/icon/font information and approval provenance are recorded.
- [ ] Shared font, typography, spacing, geometry, component states and responsive cutoffs are reviewed once and applied consistently.
- [ ] Semantic/contrast proposals are approved and checked in real controls, including both themes and mobile.
- [ ] Five UI steps, canonical backend states and distinct content/final approvals remain aligned with the PRD during separately authorized later database/API design.
- [ ] M1 work is separately authorized and limited to foundation/auth/owned projects/drafts/staging/security. M2 planning, M3 generation and M4 completion stay later work.
- [ ] Two-account authorization/RLS/Storage tests accompany introduced private features; UI filtering alone never establishes isolation.
- [ ] Accessibility, saved-state conflict, queued/recovery, deletion and private-media states are tested at the responsible milestones; no test result inferred from this checklist.
- [ ] Commercial rights and public-release approval are established before actual marketing/public asset use.

**Stop point:** documentation draft only. M0 is **Completed / Owner Approved**; M1 is **Not Started / Planning Prepared**. No frontend/backend implementation, dependency installation, Supabase configuration, database/API design, migration, provider request or environment change is authorized by this draft.
