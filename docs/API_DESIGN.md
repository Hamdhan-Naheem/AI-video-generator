# AI Video Creator V1 — API Design

## 1. Status and authority

Version **0.1 — Technical design / Pending owner review**, 22 October 2026, Asia/Colombo. Read with [DATABASE_DESIGN.md](DATABASE_DESIGN.md), [PRD v2.5](PRD.md), [Architecture v1.2](SYSTEM_ARCHITECTURE.md), [UI/UX v0.2](UI_UX_DESIGN.md), [ROADMAP](ROADMAP.md) and [M1 plan](M1_IMPLEMENTATION_PLAN.md). This is a proposed complete V1 contract, not implemented endpoints or authorization to begin development. Source document review status is preserved. M0 **Completed / Owner Approved**, M1 **Not Started / Planning Prepared**, M2–M6 **Not Started**.

One Next.js application provides lightweight authenticated Route Handlers; one independent Node.js worker consumes PostgreSQL work. No Express service, broker, provider proxy exposed to users, public worker endpoint or render within HTTP requests. All AI work is queued; user navigation does not drive background execution.

## 2. Operation placement and common security

| Operation family | Interface / rationale |
| --- | --- |
| Signup/login/logout/recovery/password | Supabase Auth SDK through thin same-app Server Actions where form validation/cookies/throttling are needed; do not duplicate Auth into custom identity/password tables or a parallel REST service. Provider direct paths remain protected by provider policy. |
| Safe owned reads | Server Components/Route Handlers use user-context Supabase SELECT with RLS; server rendering may call the same domain service without an HTTP round trip. Browser direct safe SELECT cannot bypass current-state RLS. |
| Domain mutations | Next.js Route Handler validates input then invokes narrow transactional RPC using verified user context. Any RPC granted to authenticated users remains safe if called directly. |
| Upload bytes | Session-authenticated Storage INSERT into exact allocated staging key. Next.js allocates/finalizes; no large-file proxy through Vercel. |
| Private asset access | Next.js reauthorizes owner/lifecycle/project/asset and uses a server-only Storage signing capability; no ordinary Storage SELECT/list/sign access. |
| Worker | Private database transactions and Storage SDK; no browser-addressable worker HTTP control surface. |
| Operator | Narrow deployment-authorized backend command, never an ordinary authenticated admin route or metadata role flag. |

All protected routes verify identity server-side, query authoritative current accounts state, validate ownership for **every** ID/reference, and use no-store/private responses. A valid JWT alone does not override restriction/deletion. Verify signatures with supported SSR Auth integration; use fresh provider user information for sensitive account actions and provisioning. Do not trust unvalidated `getSession()` user data. [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).

Cookie-authenticated mutations require same-origin/CSRF validation using the chosen Next.js deployment origin and supported server-action protections; GET has no side effects. JSON routes reject unsupported content types and unknown fields. Service credentials never reach browser, plans, child renderer or logs. Clear/partition caches on logout/account switch; no shared caching of refreshed cookies or signed links. Ordinary API bodies never accept owner/operator/account-state/quota/lease fields. Return 404 for foreign **or missing** resource identifiers, avoiding ownership enumeration; return own lifecycle errors without another account's existence.

### 2.1 Lifecycle access classes

Every operation below declares one class, inherited in addition to its row-specific checks:

- **Public Auth:** no existing app session; provider auth/rate rules. Recovery acknowledgements generic. No access to private data.
- **Self:** verified own current identity; active or restricted account, no arbitrary target user. Deleting accounts only deletion status/retry/logout; recovery remains provider-managed without workspace reactivation.
- **Read/Edit:** active or generation_restricted, own live project and safe operation only; no expensive dispatch hidden inside a save.
- **Costly:** active account, owned current inputs/approvals, provider availability/rights/configured quotas. Account restriction blocks planning/samples/uploads/video. Global video pause blocks new video submissions/retries and unclaimed/retry video jobs, not normal planning/samples by otherwise eligible accounts.
- **Deletion:** verified exact caller, explicit confirmation for initiation; restricted status/retry available during deletion. No ordinary workspace reads in deletion states.
- **Worker/Operator:** private deployment capability plus per-task owner/lease/state checks; not a client role.

### 2.2 HTTP, error, rate and replay conventions

Success: `{ "data": <typed response>, "requestId": "opaque-correlation-id" }`. Async acceptance **202** with owned job/task ID and polling path; ordinary reads/patches **200**, project/revision creation **201**, completed no-body action **204**. Idempotent replay returns existing resource and `replayed:true` (200, or 202 while pending), never new provider work. Server Actions return equivalent typed result, not HTTP API aliases.

Errors: `{ "error": { "code":"SAVE_CONFLICT", "message":"This project changed in another tab.", "fields":[], "retryable":false }, "requestId":"..." }`. `fields` contains safe path/code/message only, never echoed input. No SQL/provider stack, raw keys, storage paths, other user IDs, provider account balance or credentials. Appropriate known reset guidance may appear as `retryAfterSeconds`/`resetAt`; omit unknown values rather than inventing an ETA.

| HTTP | Application codes / behavior |
| --- | --- |
| 400 / 413 / 415 | INVALID_REQUEST, REQUEST_TOO_LARGE, UNSUPPORTED_MEDIA; field guidance, no expensive work |
| 401 | AUTH_REQUIRED, SESSION_EXPIRED; no private response; preserve acknowledged server data |
| 403 | ACCOUNT_RESTRICTED, DELETION_IN_PROGRESS; ordinary resource existence still concealed |
| 404 | NOT_FOUND for absent or foreign resources |
| 409 | SAVE_CONFLICT, STALE_REVISION, STALE_APPROVAL, IDEMPOTENCY_CONFLICT, RETRY_CONFLICT, UPLOAD_CONFLICT |
| 422 | INPUT_NOT_READY, INVALID_PLAN, UNSUPPORTED_COMBINATION, VOICE_UNAVAILABLE, ASSET_UNAVAILABLE, DURATION_REVIEW_REQUIRED, RETRY_NOT_ELIGIBLE |
| 429 | RATE_LIMITED, USER_LIMIT_REACHED, SHARED_LIMIT_REACHED; only known retry/reset guidance |
| 503 | GENERATION_PAUSED, SERVICE_UNAVAILABLE, ELIGIBILITY_UNAVAILABLE; fail closed for new expensive stages |
| 500 | INTERNAL_ERROR with correlation ID; sanitized, no false success |

All rows inherit the common authentication/ownership/error policy above. Row-specific codes below are in addition. **Rate classes:** `auth` signup/login/recovery/IP + provider direct controls; `read` bounded owner reads/polling/search; `write` owner mutations/autosaves; `upload` count/byte/storage/in-flight allocation reservations; `planning` idea/script/refine/repair/chunk request and provider caps; `sample` short sample/voice/provider caps; `video` full attempt/outstanding/shared provider/render/output capacity; `cleanup` bounded abuse protection with **no generation quota/hold dependency**. Numeric values/reset periods are backend configuration selected from evidence; no new fixed entitlement. Enforce atomic counters on chargeable admission, not a process-memory limiter in one Vercel instance. Coarse abuse limiter includes direct RPC invocation; request-rate limits alone do not grant provider allowance.

**Replay keys:** `Idempotency-Key` is a proposed opaque UUID for project creation/allocation/planning/sample/video/duplicate/deletion operations. Scope by verified user + operation kind; compare canonical request hash. Same key/different input →409. Browser persists pending identity across timeout/navigation and polls before creating a new intent. Same current configuration racing across different keys resolves to the same active video execution under account lock; intentional rerun requires explicit new intent. Safe saves use `expectedVersion` instead; if acknowledgement is lost, reload the committed version and compare local edits. A repeated old-version save may return SAVE_CONFLICT, never silently overwrite. Keys and job histories retain replay protection throughout supported recovery; don't expire into duplicate billable dispatch. Keys aren't bearer auth.

## 3. Schemas and response projections

Contracts use JSON Schema 2020-12 semantics. The notation `Name{field:Type, optional?:Type}` means `type:object`, all unmarked fields `required`, `additionalProperties:false`. `ID` = UUID string, `Version` = positive integer serialized safely (reject unsafe JS integers), `Hash` = 64 lowercase hex string; timestamps RFC3339 UTC. Arrays carry explicit bounds below. Nullable means JSON null is permitted; optional is absence, not undefined. Response optional fields are omitted unless stated. Zod implementations must mirror these schemas and reject unknown fields. Proposal: cap general JSON bodies at 1 MiB and pagination 1–50/default20; validate against full 60,000-character draft/12-scene payload in M1/M2 and revise with evidence if needed. Binary upload caps are separate PRD limits.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$defs": {
    "Id": {"type":"string","format":"uuid"},
    "Hash": {"type":"string","pattern":"^[a-f0-9]{64}$"},
    "TargetSeconds": {"type":"integer","minimum":62,"maximum":90,"default":75},
    "VideoType": {"enum":["product","educational","project_explainer"]},
    "Style": {"enum":["animated_explainer","cartoon_teacher","cartoon_presenter"]},
    "Empty": {"type":"object","properties":{},"additionalProperties":false},
    "ContentApprovalRequest": {
      "type":"object","additionalProperties":false,
      "required":["revisionId","contentHash","expectedVersion","confirmed"],
      "properties": {
        "revisionId":{"$ref":"#/$defs/Id"}, "contentHash":{"$ref":"#/$defs/Hash"},
        "expectedVersion":{"type":"integer","minimum":1}, "confirmed":{"const":true}
      }
    },
    "GenerationRequest": {
      "type":"object","additionalProperties":false,
      "required":["revisionId","contentApprovalId","configurationHash","expectedVersion","confirmed"],
      "properties": {
        "revisionId":{"$ref":"#/$defs/Id"}, "contentApprovalId":{"$ref":"#/$defs/Id"},
        "configurationHash":{"$ref":"#/$defs/Hash"},
        "expectedVersion":{"type":"integer","minimum":1}, "confirmed":{"const":true}
      }
    }
  }
}
```

The definitions below complete the field schemas used in operation tables; route IDs and field names agree with the database document. CamelCase JSON maps to snake_case SQL via trusted services, not mass assignment.

Path UUIDs, enums, numbers and booleans are parsed strictly; strings such as `"false"` are not booleans. JSON Schema string length counts Unicode code points, unlike JavaScript string.length; code-unit narration spans are a separate explicitly converted convention. Unless already fixed by the existing M0 schema, proposed small descriptive fields (audience/name/fact/label) cap at300 code points, arrays at20 items, correction/instruction text at1,000, understanding/limitations at2,000 each; source text keeps its separate60,000 bound. These are reviewed technical bounds, not new product questionnaires. Optional category fields remain optional except PRD-required data at planning/approval.

The M2 Content extension must use a concrete versioned envelope: `{schemaVersion,input,storyboard,understanding:{purpose,audience,keyPoints,limitations,conflicts},sources:[{assetId,sha256}],sceneBindings:[{sceneId,narrationStart,narrationEnd,assetIds,citations:[{assetId,page?,excerpt?}],character:{id,version,visible}|null}],registryVersions:{templates,characters}}`. All objects are strict; input/storyboard preserve validated existing field semantics, narration spans cover concatenated approved text exactly, citations refer to owned pinned assets, page positive and within validated document. Scene IDs/binding order/count match storyboard; assetIds refer only to sources or approved derivatives; missing character required by layout fails. Any extra schema fields or registry expansion require an explicit version/review at M2. This describes the target SaaS adapter, not a claim M0 already parses it or that the current education-only registry supports all seven pairs.

| Schema | Fields / constraints |
| --- | --- |
| CreateProject | `{title?:string(1..160),videoType:VideoType,presentationStyle?:Style,targetSeconds?:TargetSeconds,description?:string(0..2000)}`; choose compatible default style; generated safe title if omitted; no AI request |
| DraftPatch | `{expectedVersion:Version,patch:{title?:string(1..160),videoType?:VideoType,presentationStyle?:Style,targetSeconds?:TargetSeconds,resumeStep?:integer(1..5),details?:Details,voicePresetId?:string or null,voiceRegistryVersion?:string or null,subtitlesEnabled?:boolean}}`; at least one patch field; merge explicit fields then validate complete resulting state; no approval/pointer fields writable |
| Details | `{description?:string(0..2000),sourceText?:string(0..60000),audience?:string,objectives?:string[],productName?:string,productFacts?:string[],primaryAssetId?:ID,projectName?:string,projectStatus?:Concept\|Prototype\|Available,selectedIdea?:{taskId:ID,ideaId:string},corrections?:string}`; extra bounded optional fact fields only after reviewed schema; combined extracted/pasted context ≤60,000 proposed; fact claims/price currency validated before approval. Audience/objectives/facts/correction limits inherit current planning validators or reviewed M2 schema, never unbounded. |
| AllocateSource | `{expectedVersion:Version,fileName:string,mimeType:allowed MIME,byteLength:positive integer,role:photo\|screenshot\|document}`; sanitize display name, max proposed255; do not use filename as object path; proposed five images/one document,10MB/file,25MP/image,100PDF pages; allocation is not validation |
| PlanningRequest | `{expectedVersion:Version,baseRevisionId?:ID,operation:ideas\|script\|regenerate\|refine,instructions?:string(0..1000),confirmedReplacement?:true}`; regenerate/refine require current base; regeneration requires explicit replacement confirmation; no arbitrary provider prompt or asset URL |
| SaveRevision | `{expectedVersion:Version,parentRevisionId?:ID,content:Content}`; source references must already be owned/valid/pinned; full plan, not arbitrary partial executable scene code |
| Content | Versioned envelope preserving current `PlanningDraftSchema` fields (`input`, `storyboard`, ordered scene `id/order/templateId/narration/visuals/animationActions/estimatedDurationSeconds`, `narrationSections`); extend under an explicit SaaS schema version for understanding, citations/source asset IDs, character/registry versions and UTF-16 narration spans. 4–12 ordered scenes, usually6–10, exact narration-section equality, English, finite estimates; estimates never audio timestamps. Existing `m0.plan.v1`/templates untouched; M2 pins full extended schema/registry before accepting it. No unimplemented template passes rendering preflight merely because planning allows it. |
| RestoreRevision | `{expectedVersion:Version,fromRevisionId:ID}`; new unapproved revision, no mutation of historical row |
| AssetLinkChange | `{expectedVersion:Version,assetId:ID,role:source\|primary,position?:integer(0..5)}` for attach; detach uses asset path ID and expectedVersion; same-owner valid source only |
| SampleRequest | `{voicePresetId:string,voiceRegistryVersion:string,revisionId:ID,sentenceIndex:integer>=0}`; server selects **one sentence from owned reviewed content**, proposed maximum15s; no arbitrary full text. If too long reject/ask selection, do not silently synthesize a full script. |
| RetryRequest | `{expectedAttemptId:ID,expectedJobVersion:string(1..128),confirmed:true}`; compare opaque `statusVersion` returned by G02, backed by jobs.status_version; never conflate draft version or client-selected lease authority |
| MediaAccessRequest | `{purpose:playback\|download}`; asset ID in path, no bucket/key/expiry input |
| ConfirmDelete | `{confirmed:true}`; server derives account or uses owned project path. GET-only confirmation screen has no deletion side effect. |
| ProfilePatch | `{expectedVersion:Version,fullName:string(1..100 code points after trim)}`; no email/state/role/quota fields |

Projections: `ProjectSummary{id,title,videoType,presentationStyle,projectState,updatedAt,resumeStep,currentRevisionId?:ID,currentJobId?:ID,previousVideo?:VideoSummary}`; `Draft{saveVersion,videoType,presentationStyle,targetSeconds,resumeStep,details,voicePresetId:null|string,subtitlesEnabled,contentApproval?:ApprovalSummary}`. `Revision{id,revisionNo,contentHash,content,approvalStatus:pending_review|approved}`: approvalStatus is a computed current content decision, not the DB job state. `ApprovalSummary{id,kind,revisionId,snapshotHash,approvedAt,isCurrent}`. `VideoSummary{id,revisionId,durationSeconds,width,height,fps,videoCodec,audioCodec,createdAt,isCurrent}`; **only measured valid metadata**, no object key. `JobView` in §7. Each projection excludes raw private asset manifests, provider secrets/reference payloads and lease tokens. Get full source text/content only through owned detail/revision response; don't include it in list cards/logs.

## 4. Authentication, profile and session contracts

Auth is provider-managed; actions below adapt forms/cookies and error messages, not a redundant identity API. Schema fields not included below are rejected. Confirmation password is validated before provider submission; never sent as stored metadata or persisted/logged. Password rules follow configured provider/server policy; proposed minimum8 from PRD must be verified, not client-only.

| ID / operation | Input → result / validation | Auth, authorization, errors, limits, replay | Tables / requirements / milestone |
| --- | --- | --- | --- |
| A01 `signUpAction` → `auth.signUp` | `{fullName,email,password,confirmPassword}` plus **only the owner-resolved minimal acknowledgement interaction**; matching confirmation, trimmed bounded name/valid email/provider password → session + `/dashboard`; pass initial name metadata only. No consent row assumed. | Public Auth; auth rate, weak/mismatch/invalid input; generic safe signup failure. Provider duplicate semantics tested, no auto-create retry after uncertain response; offer login/session recovery. Confirmation disabled; no owner allowlist. | Auth/accounts/profiles; F01; AC01/AC04/AC05; M1 |
| A02 `signInAction` → `auth.signInWithPassword` | `{email,password}` → session then verified own-state dashboard or restricted deletion status. No account lookup by name. | Public Auth; generic INVALID_CREDENTIALS and RATE_LIMITED; no password logging, no auto retry; provider session established before reading app state. | Auth/accounts; AC02/AC05/AC06; M1 |
| A03 `signOutAction` → `auth.signOut` | Empty → clear supported auth cookies/session/client private caches; public Sign In. Verify actual selected SDK scope/session effects. | Any authenticated lifecycle; auth rate; no workspace lookup required; repeated logout safe. Already downloaded/signed bearer links have expiry limitations. | Auth; AC02; M1 |
| A04 `requestRecoveryAction` → `auth.resetPasswordForEmail` | `{email}` → same generic acknowledgement whether account exists; redirect fixed server allowlist, never arbitrary body redirect | Public Auth; auth/IP/provider controls; no enumeration/token logs or blind resend loop | Auth; AC03/AC05; M1; M6 production email |
| A05 recovery callback + `resetPasswordAction` | Supported Auth recovery code exchange in restricted reset context; `{password,confirmPassword}` → provider password update then ordinary Sign In; use/expiry/context verified, remove callback secrets from URL/logs | Valid recovery context only, not a general login/activation method; invalid/used/expired → RECOVERY_INVALID; auth rate, no replay of update | Auth; AC03; M1 |
| A06 `changePasswordAction` → provider `auth.updateUser` | `{password,confirmPassword}` plus transient current-password reauthentication only if selected supported flow requires it → password changed, truthful session outcome; do not store either password | Self; fresh provider identity, provider-supported reauth when required; REAUTH_REQUIRED/INVALID_CREDENTIALS/WEAK_PASSWORD. Never use admin reset to bypass reauth. No email change. See decision §12. | Auth/accounts; F01, AC05/AC06 + §23.3 proposed supplement; M1 |
| A07 supported SSR refresh/session guard | Cookie refresh via supported client, verified identity → own app capabilities; no custom `/refresh` credential endpoint. Missing/expired identity redirects page or401 JSON. | Current account checked independently; no shared response cache, race-safe refresh; no missing-profile auto-provision from JWT | Auth/accounts; AC02/AC04/AC06/AC49; M1 |
| A08 `GET /api/me` | No body → `{id,fullName,email,profileVersion,capabilities}`; email from fresh Auth; capabilities contain safe allowed actions, not internal controls | Self, read rate; deleting user routed to narrow deletion status rather than ordinary profile;401/403/503 | Auth/accounts/profiles; F01; AC01/AC06; M1 |
| A09 `PATCH /api/me/profile` | ProfilePatch → `{fullName,profileVersion,updatedAt}`; optimistic version, own name only | Self, write rate; SAVE_CONFLICT/INVALID_REQUEST; reload after lost acknowledgement, reject email/state fields; narrow `save_profile` | profiles/accounts; F01,AC06, proposed §23.3; M1 |

Signup succeeds into a session and own dashboard without email link. If provider created identity but no session arrives, don't claim dashboard success or create another account; offer safe sign-in and verified provisioning reconciliation. Legal text/checkbox-vs-linked acknowledgement/recording are an isolated open branch of A01, not a justification for speculative consent storage or blocking this design draft.

[Supabase password updates](https://supabase.com/docs/reference/javascript/auth-updateuser) are authenticated provider operations. Reauthentication details depend on selected SDK/configuration and must be proven in M1.2. If provider demands a nonce/email security flow conflicting with excluded OTP/UI requirements, report the precise conflict for owner decision; do not silently weaken provider security or introduce a new auth method. Current-password reauthentication, where supported, must verify returned subject equals current user and never switch account based on body-supplied email.

## 5. Projects, drafts and source-file contracts

All project paths use `:projectId` UUID. Query lists are bounded with opaque owner-bound cursor and stable `(updatedAt,id)` ordering; cursor is pagination, not auth. Errors/rate classes defined §2 apply to each row.

| ID / method and route | Request → response | Authorization, validation, errors / replay / limits | Tables / PRD / milestone |
| --- | --- | --- | --- |
| P01 `POST /api/projects` | CreateProject → `{project:ProjectSummary,draft:Draft}` | Edit; compatible pair/62–90, Idempotency-Key, write rate; atomic create/project draft with acknowledged version; no provider call | projects/drafts/accounts; F02/F03/F14; AC07/AC08/AC34; M1 |
| P02 `GET /api/projects` | Query `{q?:string<=160,state?:Draft\|Generating\|Ready\|Needs Attention,type?:VideoType,cursor?:opaque,limit?:1..50}` → `{items:ProjectSummary[],nextCursor:null\|string}` | Read; escaped literal search, no raw SQL/filter fragments; invalid cursor400, read rate; Drafts uses state filter, not new table/endpoint | projects/drafts/jobs/assets projections; AC06/AC08/AC34/AC43; M1 basic fields, M4 complete states |
| P03 `GET /api/projects/:projectId` | No body → `{project,draft,currentRevision?:Revision,currentJob?:JobView,previousVideo?:VideoSummary,generationConfiguration?:ConfigurationSummary}` | Read, own live parent;404; read rate; no signs/expensive action on GET | project/draft/revision/approval/jobs/asset projections; AC06/AC08/AC24/AC34/AC36; M1 foundation, M2–M4 extensions |
| P04 `PATCH /api/projects/:projectId/draft` | DraftPatch → `{draft,project,invalidated:[content_approval\|generation_confirmation\|audio\|timeline\|render]}` | Edit, version compare and server derived invalidation;409 preserves local edits. write rate; `save_draft` narrow RPC; no full narration approval by save | drafts/projects/approvals; AC14/AC23/AC34/AC63; M1 basic, M2/M3 settings |
| P05 `POST /api/projects/:projectId/duplicate` | `{expectedVersion:Version,title?:string(1..160)}` → new project/draft unapproved | Edit; write rate+Idempotency-Key; snapshot source and shared same-owner asset links transactionally, no jobs/approval/Ready inheritance; source deleted/conflict409 | projects/drafts/revisions/project_assets; F15; AC06/AC35/AC63; M4 |
| P06 `DELETE /api/projects/:projectId` | ConfirmDelete →202 `{cleanupTaskId,status:"pending"}` | Read/Edit owner plus destructive confirmation; cleanup rate, Idempotency-Key; mark unavailable/fence before acknowledgement; no repeated delete changes;404 foreign | projects/jobs/assets/cleanup_tasks; F18; AC37/AC51/AC63; M4 |
| U01 `POST /api/projects/:projectId/uploads` | AllocateSource →201 `{assetId,intakeJobId,expiresAt,transport:{kind:"supabase_session_insert",destination:<restricted allocation instructions>}}` | Costly upload; upload rate/storage reservation+Idempotency-Key; exact approved types/counts/caps/expectedVersion; no signed bearer upload by default; server chooses key | assets/jobs/usage_buckets/usage_entries; F04; AC06/AC15/AC40; M1 |
| U02 `storage.from(...).upload` (no app route) | Allocated bytes, exact destination, current session, `upsert:false` → Storage receipt | RLS exact-key allocation and current active lifecycle; no arbitrary paths/replace/list/read; Storage/provider coarse limits and upload rate; interrupted/uncertain existing object → U03 inspection or new allocation, not overwrite | Storage objects/assets; AC06/AC15/AC49/AC56; M1 |
| U03 `POST /api/projects/:projectId/uploads/:assetId/complete` | Empty →202 `{assetId,intakeJobId,status:"pending_validation"}` | Costly upload class; same owner+allocation project, unexpired receipt/object existence/size lookup; repeat returns existing task/status; UPLOAD_CONFLICT/INPUT_NOT_READY; upload rate, no duplicate intake/reservation | assets/jobs/attempts; AC15/AC31/AC63; M1 safe staging, M2 extraction |
| U04 `GET /api/projects/:projectId/uploads/:assetId` | No body → `{assetId,status:allocated\|pending_validation\|valid\|invalid,metadata:<safe size/type/dimensions/pages>,warnings:[],replacementAllowed:boolean}` | Read; exact owned allocation/reference; read rate; no raw bucket/key/parser exceptions; pending not understood/usable | assets/jobs; AC15/AC16/AC63; M1/M2 |
| U05 `POST /api/projects/:projectId/sources` | AssetLinkChange → `{draft,source:<safe metadata>}` | Edit; same owner **validated** source asset, versioned attach/order/primary; invalidates affected content/final approval; write rate, version replay | project_assets/assets/drafts; AC14/AC15/AC34/AC39; M1 valid staging links, M2 full intake |
| U06 `DELETE /api/projects/:projectId/sources/:assetId` | `{expectedVersion:Version}` → `{draft,cleanupPending:boolean}` | Edit; detach only this draft link, not immutable historical pin; write rate/version; invalidates affected decisions; conditional orphan cleanup preserves approvals/jobs/duplicate links, never blind Storage delete | project_assets/assets/jobs; AC35/AC37/AC63; M1 upload recovery subset, M4 full references |

Upload transport exception: user must receive the **one staging destination** needed by the authenticated Storage SDK. It is not returned in ordinary source/project metadata, is not trusted as authorization and must never allow another prefix. A signed **download** URL necessarily addresses media; don't return its internal object key separately or log it. If “no internal paths” is interpreted as zero transport exposure, direct browser Storage upload cannot meet that literally: owner review would need to change the approved transport, rather than hiding the conflict. Current design preserves Architecture §7.1 direct upload and §7.2 authorized bearer access.

Failed upload recovery preserves saved draft and known valid sources. Client may retry completion/status; worker/reconciliation checks allocated/partial objects and removes abandoned keys, releases **unused** capacity only after verifying state. Validate Storage retry semantics, size metadata and account-state race before M1.4 approval. No source-download URL is handed to Gemini/renderer; worker materializes bounded authorized bytes.

## 6. Script and storyboard contracts

Templates/actions come from pinned versioned registry. Existing M0 education IDs and actions remain unchanged; do not assume product/presenter templates already exist. Planning-supported and render-ready are distinct gates. A saved script is Pending Review until an explicit current content approval; no automatic approval after model generation.

Every revision save/approval also compares Content.input type/style/target and pinned source identities with the current acknowledged draft; a valid schema for a different configuration is still stale. Directly editing narration must update matching scene/narration-section spans and revalidate the whole plan before saving/approval. Editable review data never changes historical approved bytes.

| ID / method and route | Request → response | Authorization, validation, errors / limits / replay | Tables / PRD / milestone |
| --- | --- | --- | --- |
| S01 `POST /api/projects/:projectId/planning` | PlanningRequest →202 `{job:JobView}`; ideas returns three distinct concepts through job result, script/refine returns new revision | Costly planning; validated sources/category facts/English/matrix/current base, planning rate+atomic reservations+Idempotency-Key. Regenerate requires confirmation; unknown templates/foreign assets422. No provider work in HTTP. | jobs/attempts/usage_entries/revisions/assets; F05–F08; AC14–AC20/AC22/AC39/AC40/AC63; M2 |
| S02 `GET /api/projects/:projectId/revisions` | Query `{cursor?,limit?}` → `{items:<revision summaries>[],nextCursor}` | Read, owned project; read rate,404; bounded retained history not unlimited archive | revisions/approvals; AC20/AC34/AC63; M2 |
| S03 `GET /api/projects/:projectId/revisions/:revisionId` | No body → `{revision:Revision,contentApproval?:ApprovalSummary}` | Read, same owner/project revision, read rate; factual source warnings and separate estimated timing visible, no private raw provider payload | revisions/project_assets/approvals; AC18/AC19/AC22; M2 |
| S04 `POST /api/projects/:projectId/revisions` | SaveRevision →201 `{revision,draftVersion}` | Edit, bounded schema/registry/English/source semantics and expected base. No provider call; write rate; reject422 invalid plan,409 conflict; new revision unapproved | revisions/project_assets/drafts; AC14/AC19/AC20/AC22/AC34/AC39/AC63; M2 |
| S05 `POST /api/projects/:projectId/revisions/restore` | RestoreRevision →201 `{revision,draftVersion}` | Edit same-owner historical source; write rate/version conflict; makes a new unapproved revision and retains predecessor, never flips an old approval back to current | revisions/drafts/project_assets; AC20/AC34/AC63; M2 |
| S06 `POST /api/projects/:projectId/content-approvals` | ContentApprovalRequest → `{approval:ApprovalSummary,draftVersion}` | Edit, explicit `confirmed:true`, exact current hash/revision/version/sources; write rate, exact repeated current decision returns same approval; stale409/invalid422 | revisions/approvals/drafts; F07/F16; AC14/AC19/AC22/AC23; M2 |

Worker planning result commits conditional on base save/revision. A newer edit wins; historical result can remain reviewable but cannot overwrite current acknowledged content. Failed regeneration/refinement/repair preserves last valid revision; user can restore it without additional AI. Schema repair has a separately bounded budget under request allowance and recorded attempts; no unlimited “repair JSON” loop. Understanding corrections are saved explicitly and used by subsequent S01; selecting an idea references an owned completed ideas task.

## 7. Voice, final confirmation, jobs and recovery

`GET P03` supplies a `ConfigurationSummary{revisionId,contentApprovalId,configurationHash,saveVersion,videoType,presentationStyle,targetSeconds,voicePresetId,subtitlesEnabled,readyToConfirm,issues:[]}` generated server-side from current sources/registries/settings. It does not record consent or start work. Internal full final snapshot also pins provider model/settings/builds; normal UI uses friendly names and doesn't display providers.

| ID / method and route | Request → response | Authorization, validation, errors / limits / replay | Tables / PRD / milestone |
| --- | --- | --- | --- |
| V01 `GET /api/voice-options` | No body → `{registryVersion,defaultPresetId,voices:[{presetId,name,language:"en",available,sampleAvailable}]}` exactly three configured choices | Self/read rate; no provider request on GET; availability from validated config/worker health checks; no raw provider keys/voice IDs; unavailable → select another, never substitution | versioned deployment registry/accounts; F09; AC21/AC22; M3 |
| V02 `POST /api/voice-samples` | SampleRequest →200 `{assetId,cached:true}` or202 `{job}` | Costly sample; sample/provider limits+Idempotency-Key; own reviewed sentence/voice/version/short length; exact valid same-owner cache reused, otherwise queued intentional request. VOICE_UNAVAILABLE/INPUT_NOT_READY422 | assets/jobs/attempts/usage_entries/revisions; F09/F22; AC21/AC33/AC40/AC52; M3 |
| V03 save voice/subtitles | P04 DraftPatch fields; updated save version and configuration hash via P03 | Edit/write; no generation; voice registry must match, subtitle is actual boolean, no arbitrary provider model/settings from client; invalidates final decision/dependencies | drafts/approvals; AC14/AC21/AC23/AC28/AC34; M3 control, M4 UX |
| G01 `POST /api/projects/:projectId/generations` | GenerationRequest + Idempotency-Key →202 `{generationApprovalId,job:JobView,replayed:false}` | Costly video; **explicit final confirmation**, exact current content approval/config hash/save version; atomically freeze final approval+job+capacity. Preliminary S06 alone cannot synthesize. STALE_APPROVAL409, config/voice/assets422, cap429, pause503 | approvals/jobs/attempts/usage_buckets/usage_entries; F16/F22; AC14/AC23/AC24/AC40/AC41; M3, full UX M4 |
| G02 `GET /api/jobs/:jobId` | No body → JobView; polling read only, adaptive bounded interval/backoff, stop on terminal state | Read account plus owned job/live project when present; read rate; no queue inspection or provider call. Closing browser doesn't cancel accepted work | jobs/attempts/assets safe projections; AC06/AC24/AC25/AC36/AC44; M2 planning, M3 all kinds |
| G03 `POST /api/jobs/:jobId/retry` | RetryRequest + Idempotency-Key →202 existing job/next eligible attempt | Costly for AI/video (intake safe recovery classified appropriately); verify failed attempt/state token, same immutable snapshot and current approval/config eligibility, budget/quota/controls; obsolete configuration409 STALE_APPROVAL. Uncertainty blocks retry pending reconciliation. No simultaneous/manual unlimited retry or blind new synthesis; cap slot/reservations reconciled once | jobs/attempts/usage_entries/assets; AC25/AC30/AC31/AC33/AC40/AC57; M3 |

G01 combines **confirmation and submission in one transaction**: separate from Step 2 content approval but no redundant “confirm then enqueue” network gap. UI presents exact current summary, then user explicitly clicks final Generate. A rendering failure retry uses the already explicit confirmed immutable job snapshot; it doesn't automatically approve new content. A new configuration requires another G01 current decision. If selected content changes after job acceptance, current eligibility/ownership remains checked and the immutable job can finish only under its own snapshot; its output cannot become current for different content.

`JobView{id,kind,state,stageLabel,updatedAt,statusVersion,currentAttemptId?,result?,error?,retryAllowed,holdReason?,previousVideo?}`. `state` is canonical job code; stageLabel is truthful friendly vocabulary, no synthetic percentage/ETA. `statusVersion` is an opaque encoding of jobs.status_version, an exact concurrency comparison token, never a user-settable lease. Result schema is discriminated by kind: planning ideas `{ideas:[{id,title,description}]}` exactly3, planning script `{revisionId,promoted:boolean}`, intake `{assetId,status}`, sample `{assetId}`, video `{video:VideoSummary}`. Errors are sanitized code/message/action (`revise`,`reselect_voice`,`retry`,`wait`,`contact_support`), no provider details. Internal stage names need not be exposed; canonical states remain available to drive UI. `retryAllowed` is advisory and rechecked at G03.

A browser timeout after G01 returns to G02/P03 or repeats the **same** key. A worker/provider timeout is different: persist dispatch intent/request reference and uncertain consumption; reconcile known outcome before another call. Local idempotency cannot guarantee exactly-once external billing. Never automatically call providers from a retried DB transaction. Eligible bounded retry/backoff may occur within the one accepted job under approved PRD policy; operator pause/deletion/restriction and attempt budget still apply. UI must not suggest retry while uncertainty remains unresolved.

## 8. Completed videos and private access

| ID / method and route | Request → response | Authorization, validation, errors / limits / replay | Tables / PRD / milestone |
| --- | --- | --- | --- |
| M01 `GET /api/projects/:projectId/videos` | `{cursor?,limit?}` → `{items:VideoSummary[],nextCursor}` | Read, only retained verified succeeded artifacts belonging to this owner/project; read rate; old versions labeled accurately | assets/jobs/approvals/projects; F13/F17; AC29/AC36/AC38/AC63; M3 metadata, M4 history UX |
| M02 `GET /api/projects/:projectId/videos/:assetId` | No body → `{video:VideoSummary,accessAvailable:boolean}` | Read exact same project and succeeded private valid video;404 or own ASSET_UNAVAILABLE; read rate; existence metadata not proof of available bytes | assets/jobs; AC29/AC36/AC38; M3 verification, M4 retrieval |
| M03 `POST /api/media/:assetId/access` | MediaAccessRequest → `{url,expiresAt,contentType,fileName?}` | Read/Self for allowed sample; traverse live owner/project/result or own valid sample. Server-only signing; read/link-issuance rate; no expensive job. Playback/download expiry proposed10min, not chosen by client. Use attachment name for download. | assets/jobs/project_assets/accounts; F17/F09; AC06/AC38/AC49/AC51; M3 internal publication checks, M4 user media |

Expired media access is reauthorized by M03, not video regeneration. No permanently stored signed URLs; no logging of bearer query strings, shared caches or object paths. Output download verifies requested purpose and uses correct MIME/disposition. Already-issued links may remain valid until expiry despite deletion/restriction, downloaded files outside recall. Do not claim instant revocation. Successful response means access issued, not that a browser saved the file. If MP4 missing/corrupt, mark inaccessible/recover from preserved checkpoints under existing budget and display truthful state; no falsely Ready result.

Sample playback uses M03 same ownership check, no extra synthesis. No public voice proxy or arbitrary private-file download endpoint is added.

## 9. Account deletion and privileged interfaces

| ID / operation | Request → result / authorization | Reliability, errors and rate | Entities / requirements / milestone |
| --- | --- | --- | --- |
| D01 `POST /api/account/deletion` | ConfirmDelete + Idempotency-Key; verified fresh self identity →202 `{cleanupTaskId,status:"pending",message}`. No body target ID; cancel before submit has no effect. | Deletion class/cleanup rate, atomic lifecycle deny+fencing+durable task; repeats reuse account task even different keys. Auth failure401/state unavailable503, no destructive partial acknowledgement | accounts/jobs/cleanup_tasks; F23; AC48/AC49; M4 |
| D02 `GET /api/account/deletion` | Verified same live identity; no body → `{cleanupTaskId,status:pending\|running\|retry_wait\|incomplete\|completed,message,retryAllowed}` | Narrow deletion-status path only, cleanup/read rate; no manifests/keys/foreign task query. After Auth removal401/no ordinary status lookup; client may show last safe acknowledged state, backend finishes independently | accounts/cleanup_tasks; AC48–AC51; M4 |
| D03 `POST /api/account/deletion/retry` | Empty + Idempotency-Key; verified same live deleting identity →202 existing cleanup task | cleanup rate, serialized remaining-stage retry; never reactivate or spend generation quota. After Auth deletion backend-only recovery. No rerun of completed deletion; sanitized dependency error | cleanup_tasks/accounts; AC50/AC51/AC58; M4 |
| O01 deployment `change_control` command | Backend-authorized `{action:pause_generation\|resume_generation\|restrict_account\|restore_account,subjectId?:ID,expectedVersion:Version,reasonCode}` → persisted control version/audit reference | No ordinary HTTP route/RPC grant; control version compare, fail closed if commit fails; authorized maintenance rate, content-free audit; restoration cannot reverse deletion | controls/audit/accounts/jobs; AC54–AC58; M4 |
| O02 deployment cleanup/reconciliation command | Backend-authorized task ID/dry-run or bounded retry request → safe checkpoint/outcome | No public status endpoint, no user metadata authority, no repeated chargeable provider request to diagnose uncertainty; cleanup fairness independent of generation holds | cleanup_tasks/jobs/attempts/assets/usage_entries; AC25/AC31/AC50/AC58; M3 general, M4 deletion |

No separate deletion-request table or confirmation-token service is needed: explicit destructive confirmation on the authenticated screen followed by D01 records the decision in the durable task. This preserves simple signup. Self-status after Auth removal cannot be authenticated normally: backend cleanup finishes using surviving manifest; don't invent an unauthenticated polling token that leaks account lifecycle. Completed UI is shown only with actual verified evidence, otherwise honest incomplete/unknown guidance. Cleanup removes Storage-owned/late objects before verified privileged Auth deletion, then purges remaining content and minimizes tombstone; missing/stale profiles don't recreate it. Generation pause/restriction/allowance exhaustion never blocks cleanup.

## 10. Background-worker interface and representative flows

Worker uses the same TypeScript domain rules and database contracts in DATABASE_DESIGN §8; no internet-facing worker API. Database connection capability is separate from render subprocess environment. Proposed transaction messages (all strict, private, no credentials in payload):

| Contract | Input → result / guards |
| --- | --- |
| claim | `{workerId,eligibleKinds,capacity}` → `{jobId,ownerId,inputSnapshot,leaseEpoch,leaseExpiresAt}` or none; short eligible FIFO skip-locked transaction, account/control/quota current; intake allocation waiting for bytes not claimable |
| heartbeat | `{jobId,workerId,leaseEpoch}` → extended expiry; exact current holder/unexpired lease, else LOST_LEASE and child cancellation/fencing |
| authorize stage dispatch | `{jobId,leaseEpoch,stage,inputHash}` → attempt/reservation identity after current-state/budget checks; commit intent **before** network, no external call inside DB transaction |
| checkpoint | `{jobId,leaseEpoch,attemptId,ownedAssetIds,checksums,validation}` → committed checkpoint; own matching attempt/object existence required, stale epoch rejected |
| complete | `{jobId,leaseEpoch,attemptId,outputAssetId,probe}` → success only after media validation/private existence/account/project/control/current-lease gates; conditional current/history pointers |
| fail/hold | `{jobId,leaseEpoch,attemptId,classification,safeCode}` → retry_wait/needs_attention/failed/held/cancelled, bounded backoff or review; usage known/uncertain retained |
| reconcile | Scan expired leases/orphans/usage/incomplete cleanup → verified same-job recovery or fenced cleanup; don't dispatch uncertain providers blindly |

Shared lock order/global-control semantics are defined once in DATABASE_DESIGN §8. Global pause lets already-running approved execution finish subject to account checks but holds queued/retry video work. Account restriction stops next expensive stage and publication, retaining checkpoints. Deletion fences all later publication and removes late bytes. Source/voice/render children receive only authorized local assets/pinned components and sanitized environment; no provider/service credentials or arbitrary URL fetches.

### 10.1 Examples (illustrative IDs, no live service requests)

Create request: `POST /api/projects`, `Idempotency-Key: <client-generated UUID>`:

```json
{"title":"Electricity","videoType":"educational","presentationStyle":"cartoon_teacher","targetSeconds":75,"description":"How electricity is generated"}
```

Save request: `PATCH /api/projects/11111111-1111-4111-8111-111111111111/draft`:

```json
{"expectedVersion":4,"patch":{"subtitlesEnabled":true,"resumeStep":3}}
```

Content approval: `POST /api/projects/11111111-1111-4111-8111-111111111111/content-approvals`:

```json
{"revisionId":"22222222-2222-4222-8222-222222222222","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expectedVersion":5,"confirmed":true}
```

Step 4 final submission uses fresh P03 configurationHash; it is a separate deliberate user decision after voice/subtitles selection:

```json
{"revisionId":"22222222-2222-4222-8222-222222222222","contentApprovalId":"33333333-3333-4333-8333-333333333333","configurationHash":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","expectedVersion":7,"confirmed":true}
```

Accepted response (202):

```json
{"data":{"generationApprovalId":"44444444-4444-4444-8444-444444444444","job":{"id":"55555555-5555-4555-8555-555555555555","kind":"video_generation","state":"queued","stageLabel":"Waiting to start","updatedAt":"2026-10-22T08:00:00Z","statusVersion":"opaque-state-v1","retryAllowed":false},"replayed":false},"requestId":"example-request"}
```

Flow: create/acknowledge draft → allocate/upload/validate sources → request planning and poll → review/edit/approve immutable content → select voice/subtitles and save → explicitly confirm final snapshot/enqueue → worker preflight/synthesize-or-reuse/compose/render/probe/private-upload/conditional commit → owned preview/download. Dashboard-return restores acknowledged step and actual status. Any settings/content change returns to affected approval; it does not mutate running snapshots or remove previous good output.

## 11. Requirements traceability and planned verification

Every row below preserves the actual PRD identifier and priority. Entity abbreviations: Auth=managed identity; accounts/profiles/projects/drafts/revisions/approvals/assets/links/jobs/attempts/buckets/entries/controls/audit/cleanup refer exactly to DATABASE_DESIGN's named tables (`drafts`=project_drafts, `links`=project_assets). Registry is pinned application configuration, not a new table. **All tests here are Planned, not Passed**; M0 evidence is recorded separately in PROGRESS. Implementation milestone is followed by integrated M5 verification unless M6 is explicit.

| AC | Priority | Entities / operation IDs | Milestone and verification to produce |
| --- | --- | --- | --- |
| AC01 | P0 | Auth/accounts/profiles; A01/A08 | M1 signup fields/mismatch/nonpersistence/session/own dashboard, no email activation |
| AC02 | P0 | Auth/accounts; A02/A03/A07 | M1 valid/invalid login, logout, direct unauthenticated page/API denial and cache clearing |
| AC03 | P0 | Auth; A04/A05 | M1 generic recovery; valid/invalid/expired/used link, reset then normal login; M6 redirects/email |
| AC04 | P0 | Auth/accounts; A01/A07 | M1 two signups/no allowlist/no confirmation gate or excluded methods; inspect provider configuration |
| AC05 | P0 | Auth/accounts/buckets; A01–A06 | M1 policy and direct-provider/app throttling; M5 mailbox-squatting/enumeration/account farming review |
| AC06 | P0 | All owned entities; all protected operations | M1 introduced paths then M2–M4 additions; M5 A/B direct API/RPC/RLS/Storage list/read/edit/media/duplicate/delete denial |
| AC07 | P0 | drafts/revisions/registry; P01/P04/S01/G01 | M1 pair constraints; M2 all seven accepted/two rejected UI/server; M5 repeat |
| AC08 | P0 | projects/drafts; P01–P04 | M1 acknowledged basics, M4 five-step shared Studio/resume/default inputs for all types; M5 browser journeys |
| AC09 | P1 | drafts/registry/revisions; P04/S01/G01 | M2 presets/plans, M3 render each preset/no-character style/stale-ID denial |
| AC10 | P1 | revisions/registry/assets; S03/G01/M03 | M3 full teacher intro/conclusion and presenter beside graphics/character-free middle playback |
| AC11 | P1 | assets/registry/attempts; G01 | M3 closed/open/blink/head/gesture deterministic rendering, no user animation controls |
| AC12 | P1 | alignment/cue assets; G01/M03 | M3 full speech/pause review; M5 measure separate P2 thresholds, no phoneme claim |
| AC13 | P1 | revisions/assets/registry; G01/M03 | M3 representative character/subtitle/graphic layout review; core readable AC61 separate |
| AC14 | P0 | drafts/revisions/approvals/assets; P04/S06/G01 | M2/M3 type/style/character/text/settings invalidation matrix, stale rejection, compatible reuse |
| AC15 | P0 | assets/links/buckets/entries; U01–U06/P04 | M1 byte/type/count/path failure recovery; M2 decoder/parser/page/expansion/context/scanned/encrypted bounds |
| AC16 | P1 | assets/revisions; S01/S03 | M2 long/mixed/conflicting document summary and extraction-gap disclosure |
| AC17 | P1 | jobs/revisions/drafts; S01/P04 | M2 exactly3 distinct ideas, own selection affects subsequent script |
| AC18 | P0 | revisions/links; S01/S03/S04/S06 | M2 correct understanding, source/product claims/project status safeguards, approval review |
| AC19 | P0 | revisions/registry/approvals; S03/S04/S06 | M2 separate scene narration/visual/actions/estimates, malformed/unallowlisted rejection |
| AC20 | P1 | revisions/drafts/jobs; S01/S04/S05 | M2 edit/refine/regenerate failure preserves previous; restore creates new unapproved revision |
| AC21 | P1 | registry/assets/jobs; V01/V02/G01 | M3 all three English samples/full narration; unavailable voice prompts reselection, no substitute |
| AC22 | P0 | revisions/approvals/alignment assets; S06/G01 | M2 English plan; M3 exact approved spoken words/no stage directions, normalized subtitle mapping |
| AC23 | P0 | approvals/jobs/buckets/entries; S06/G01 | M3 preliminary approval cannot dispatch; final current config/cap/idempotency tab races |
| AC24 | P0 | jobs/attempts; G01/G02 | M3 close/refresh browser, accepted work continues; return actual progress |
| AC25 | P0 | jobs/attempts/assets; worker/G02/G03 | M3 stop/restart/expired lease/stale commit, one valid publication/checkpoint reuse |
| AC26 | P2 | timeline/cue assets; worker/M03 | M3/M5 measure sampled caption/visual anchors vs proposed250ms; record deviations separately |
| AC27 | P0 | alignment/timeline/assets; worker/G01 | M3 malformed/missing essential alignment cannot publish Ready |
| AC28 | P1 | drafts/approvals/assets; P04/G01 | M3 subtitles on/off pixels, compatible identical audio/cues |
| AC29 | P0 | video assets/jobs/approvals; worker/M01–M03 | M3 real62/75/90 target fits, MP4 H.264/AAC/9:16/valid settings/audio/decode; M5 every Ready sample |
| AC30 | P0 | revisions/attempts/approvals; G01/G02/S04/S06 | M3 out-of-fit speech, max3s purposeful holds, one budgeted natural adjustment or explicit review; no cutoff/rewrite |
| AC31 | P0 | assets/jobs/attempts; worker/G03 | M3 render fails→saved audio/cues; upload fails→valid existing output; no unnecessary synthesis |
| AC32 | P0 | registry/assets/approvals; G01/worker | M3 missing character/mouth assets/unsupported templates/actions fail preflight/review, no style swap |
| AC33 | P0 | attempts/entries/jobs; S01/V02/G01/G03 | M2/M3 temporary429/5xx/timeouts bounded; bad key/credit/content no loop; uncertain dispatch no blind retry |
| AC34 | P0 | drafts/revisions; P03/P04/S04 | M1 acknowledged save/resume/two-tab conflict; M4 all five steps; M5 failed-write preservation |
| AC35 | P1 | projects/links/assets/revisions; P05/P06 | M4 independent unapproved duplicate; original delete preserves duplicate bytes |
| AC36 | P0 | jobs/approvals/assets/projects; worker/M01 | M3 late older result can't replace newer/current; prior success retained/labeled through failure |
| AC37 | P0 | projects/jobs/assets/cleanup; P06/worker | M4 delete during work denies new access/publication; only unreferenced owned bytes cleaned |
| AC38 | P0 | accounts/projects/assets; M01–M03 | M4 foreign/expired/stale media access; reissue only current ownership/lifecycle, bearer limitations disclosed |
| AC39 | P0 | revisions/assets/registry; S01/S04/G01 | M2/M3 reject executable/URL/path/foreign/action payloads, credential-free bounded renderer inputs |
| AC40 | P0 | buckets/entries/jobs/attempts; S01/V02/G01/G03 | M2–M4 atomic all-metric reservation races/direct bypass/uncertainty/sample/retry accounting; preserve drafts |
| AC41 | P0 | jobs; all Costly routes/worker | M3 web enqueue only, independent worker continues without browser/request; no detached serverless promises |
| AC42 | P0 | M0 evidence; release checklist | M0 sign-off retained; M1–M6 staged implementation and release gates, not revalidated by this document |
| AC43 | P0 | All owned tables; end-to-end operations | M1 introduced isolation; M5 two complete A/B upload/generate/revise/duplicate/delete/download journeys |
| AC44 | P0 | jobs/attempts/entries; G01/G02/worker | M3/M5 eligible FIFO/capacity/fairness two-user queue, isolated retries/results/per-user keys |
| AC45 | P0 | all; A01→M03 | M5 full local then private multi-account three-type journeys/recovery before public hosting |
| AC46 | P0 | environment-specific queue/Storage/Auth; worker | M6 production Vercel/Supabase/worker independence with developer computer off/browsers closed |
| AC47 | P0 | release documentation/control config | M6 all47P0, P1 decisions/P2 evidence, rights/costs/isolation and explicit activation approval |
| AC48 | P0 | accounts/cleanup; D01/D02 | M4 cancel no effect, explicit same-self auth, foreign target rejected, repeat same task |
| AC49 | P0 | accounts/jobs/assets/cleanup; D01/worker/all guards | M4/M5 stale-token/RLS/Storage races deny A new work/access/publication; B unaffected |
| AC50 | P0 | cleanup/accounts/assets/Auth; D01–D03/worker | M4 Storage before Auth, injected restart/Auth/late-write/post-Auth failures, durable no-reactivation completion |
| AC51 | P0 | cleanup/audit/entries/assets; D01/M03/worker | M4/M5 all data classes/minimal fields/expiry/shared built-ins safe; signed/download limits; M6 actual backup/provider policy |
| AC52 | P0 | buckets/entries/control config; all Costly paths | M3/M4 configure small test limits/periods/request classes/caps; M5 measured settings, no fixed free-video entitlement |
| AC53 | P1 | controls/accounts/jobs; API errors/G02 | M4 limit/pause/restriction clear recoverable messages/known reset only, permitted reads remain, no payments |
| AC54 | P0 | controls/audit/accounts; O01 | M4/M5 ordinary user/metadata cannot operate; backend authority/audit/failure truth |
| AC55 | P0 | controls/jobs/attempts; O01/G01/G03/worker | M4 pause submission/queued/retry vs running policy, reads/deletion continue |
| AC56 | P0 | accounts/jobs/assets; O01/all Costly/worker | M4 stale valid session restricted across upload/script/sample/video; no next costly stage/publication, B unaffected |
| AC57 | P0 | controls/accounts/jobs/entries; O01/worker | M4 restoration rechecks state/quota/approval and same checkpoints/IDs, no deletion reversal or duplicate usage |
| AC58 | P0 | accounts/controls/cleanup/jobs; O01/O02/worker | M4/M5 unavailable authority fails costly work closed, holds persist after restart, cleanup overrides holds/quotas |
| AC59 | P1 | five-step UI projections; A/P/S/V/G/M/D | M4/M5 keyboard/focus/contrast/responsive/forms/recovery review, shared steps unchanged |
| AC60 | P2 | cue assets/resource measurements/reviewer evidence | M5 outstanding numeric speech/readability/distraction scores and nonessential polish; Not Verified after M0 |
| AC61 | P0 | revisions/audio/timeline/video assets; M03/worker | M3/M5 full seven-pair audiovisual review: understandable speech/scene/caption pairing, legibility, no mouth through silence |
| AC62 | P2 | attempts/usage/resource metrics + pilot evidence | M5 latency/completion/usability/comprehension measures known workload, outstanding pilot still Not Verified |
| AC63 | P0 | drafts/revisions/assets/links/jobs; P/S/G/D | M1–M5 failure/refinement/duplicate/quota/pause/restriction preserve acknowledged work/old successes except explicit deletion |

Total baseline **63 unique AC01–AC63: 47 P0, 13 P1, 3 P2**. No priority/pass condition changed. PRD §23.3 proposed own-name/password verification remains supplemental for owner review, not AC64 or an inferred pass. Public release cannot waive P0. Narrow P1 exceptions require owner impact/mitigation/owner/follow-up; P2 measurements don't excuse broken AC61. Entity/API design alone cannot verify media quality, rights, production independence or user comprehension.

## 12. Implementation readiness and outstanding decisions

| Decision / dependency | Smallest unresolved issue | Resolve before |
| --- | --- | --- |
| Authorization to implement | Technical design approval does not start M1 | Any application coding/service setup |
| Development baseline | Compatible Next.js/Supabase SSR/PostgreSQL versions, migration execution, private exposed schemas and real Storage metadata/RLS tests | M1.1–M1.4; no dependency changes now |
| Signup legal details | Exact legal links/text, minimal required interaction, whether acknowledgement recording/version/retention is needed; no table/fields invented | Affected A01 implementation; core database/API drafting continues |
| Password-change flow | Prove supported provider reauth/session behavior without silently adding excluded OTP flows or bypassing security; reviewer accepts §23.3 supplemental coverage | M1.2 account settings security |
| Proposed technical caps | Name/title/file name/body/page caps and strict schema sizes versus complete source/draft payload; approve/update with evidence | Relevant M1/M2 contracts |
| Storage transport disclosure | SDK needs one allocated destination; preserve scoped transport exception rather than general metadata paths; zero-path requirement would require explicit architecture change | M1.4 transport review |
| Hash/schema/registry | Pin canonical serialization, complete SaaS source-grounded Content extension and approved schema/action/character versions; map M0 without rewriting historical candidates | M2 revision/model contracts; M3 dependent builds |
| Three voices/provider uncertainty | Actual eligible English presets/model/timing/rights, safe permitted samples and provider history reconciliation evidence | M3 before synthesis; no provider call authorized here |
| Limits, operator and retention | Configured quotas/periods/resource limits, narrow deployment operator credential, idempotency retention, backup/deletion policy and exact signed-link TTL | Relevant M3/M4 implementation; M5 validation/M6 release |
| Visual fidelity | Approved Stitch/font/icon/logo/deletion-state exports remain missing; don't invent inspected references | Shared visual implementation/final M4/M5 review |
| Commercial release | Existing Free-plan media noncommercial; actual recording/artwork/provider/hosting rights/cost approvals required | Any commercial use / M6 launch |

Recommendation: designs are ready for **owner technical review and sequential M1 foundation planning**, not unconditional migrations or full V1 implementation. Proposed schema mechanics and route contracts must be verified in the actual development environment. Resolve M1-specific prerequisites during the separately authorized phase; later model/voice/worker-host questions do not justify building them now. Keep all original milestone assignments and acceptance evidence intact. No feature, service, migration, endpoint, rendering or provider request was implemented in this design task.
