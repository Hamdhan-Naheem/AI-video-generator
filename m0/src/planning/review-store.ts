import {createHash} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {z} from 'zod';
import {sceneTemplates} from './registry';
import {assertStoryboardRenderReady} from './render-readiness';
import {parsePlanningDraft, ReviewStatusSchema, type PlanningDraft} from './schema';

const ReviewStateSchema = z.object({
  status: ReviewStatusSchema,
  candidateSha256: z.string().regex(/^[a-f0-9]{64}$/),
  source: z.enum(['offline_fixture', 'gemini_response', 'manual_edit']),
  updatedAt: z.iso.datetime(),
}).strict();
export type ReviewState = z.infer<typeof ReviewStateSchema>;

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const candidatePath = (dir: string) => join(dir, 'candidate.json');
const statePath = (dir: string) => join(dir, 'review-state.json');

async function writeAtomic(path: string, text: string) {
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, text, {flag: 'wx'});
  await rename(temporary, path);
}

async function readCandidate(dir: string): Promise<{plan: PlanningDraft; raw: string; sha256: string}> {
  const raw = await readFile(candidatePath(dir), 'utf8');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('Candidate JSON is malformed; correct it and run plan:review again'); }
  return {plan: parsePlanningDraft(parsed), raw, sha256: hash(raw)};
}

async function readState(dir: string): Promise<ReviewState> {
  return ReviewStateSchema.parse(JSON.parse(await readFile(statePath(dir), 'utf8')));
}

export function formatReview(plan: PlanningDraft, source: ReviewState['source']): string {
  const completeNarration = plan.storyboard.narrationSections.map((part) => part.text).join(' ');
  const lines = [
    '# Electricity planning candidate — manual review required',
    '',
    `Source: ${source === 'offline_fixture' ? 'OFFLINE FIXTURE — not a Gemini response' : source}`,
    'Status: Pending Review until an explicit approve command succeeds.',
    'All scene timing and narration length are estimates. No voice or factual verification has occurred.',
    'Storyboard layouts are allowlisted. Render readiness is checked again before rendering against the currently implemented registry.',
    '',
    `# ${plan.storyboard.title}`,
    '',
    `Type/style: ${plan.input.type} / ${plan.input.style}`,
    `Topic: ${plan.input.topic}`,
    `Language: ${plan.input.language}`,
    `Requested target: ${plan.input.targetDurationSeconds} seconds; estimated plan: ${plan.storyboard.estimatedDurationSeconds} seconds`,
    `Approximate narration words: ${completeNarration.trim().split(/\s+/).length} (planning guide only; actual audio controls final duration)`,
    '',
    '## Summary', '', plan.storyboard.summary, '',
    '## Complete narration', '', completeNarration, '',
    '## Scenes', '',
  ];
  for (const scene of plan.storyboard.scenes) {
    lines.push(`### ${scene.id} — estimate ${scene.estimatedDurationSeconds}s`, '', `Narration: ${scene.narration}`, '', `Template: ${scene.templateId} (${sceneTemplates[scene.templateId].status})`, `Visuals: ${scene.visuals.map((visual) => `${visual.kind}: ${visual.description}`).join(' | ')}`, `Actions: ${scene.animationActions.join(', ') || 'none'}`, '');
  }
  lines.push('## Reviewer checklist', '', '- Confirm the scientific explanation and wording.', '- Confirm generation is distinct from transmission.', '- Confirm all proposed visuals and actions are appropriate.', '- Confirm duration estimate is plausible; real audio timing remains unmeasured.', '');
  return lines.join('\n');
}

export async function createFixtureCandidate(dir: string, fixtureText: string): Promise<ReviewState> {
  let value: unknown;
  try { value = JSON.parse(fixtureText); } catch { throw new Error('Offline fixture JSON is malformed'); }
  return saveNewCandidate(dir, value, 'offline_fixture');
}

/** Refresh only an untouched, pending offline fixture. Keep the old draft for comparison. */
export async function refreshPendingFixtureCandidate(dir: string, fixtureText: string): Promise<ReviewState> {
  let value: unknown;
  try { value = JSON.parse(fixtureText); } catch { throw new Error('Offline fixture JSON is malformed'); }
  const plan = parsePlanningDraft(value);
  const state = await readState(dir);
  const oldRaw = await readFile(candidatePath(dir), 'utf8');
  if (state.status !== 'pending_review' || state.source !== 'offline_fixture' || hash(oldRaw) !== state.candidateSha256) {
    throw new Error('Only an unchanged Pending Review offline fixture can be refreshed; preserve manual decisions and edits');
  }
  const historyDir = join(dir, 'history');
  await mkdir(historyDir, {recursive: true});
  await writeFile(join(historyDir, `${state.candidateSha256}.json`), oldRaw, {flag: 'wx'});
  await writeAtomic(candidatePath(dir), `${JSON.stringify(plan, null, 2)}\n`);
  return reviewCandidate(dir, 'offline_fixture');
}

/** Future Gemini responses use this same explicit pending-review persistence path. */
export async function saveNewCandidate(dir: string, value: unknown, source: ReviewState['source']): Promise<ReviewState> {
  const plan = parsePlanningDraft(value);
  await mkdir(dir, {recursive: true});
  await writeFile(candidatePath(dir), `${JSON.stringify(plan, null, 2)}\n`, {flag: 'wx'}).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') throw new Error('Candidate already exists; review or edit it rather than overwriting it');
    throw error;
  });
  return reviewCandidate(dir, source);
}

export async function reviewCandidate(dir: string, source: ReviewState['source'] = 'manual_edit'): Promise<ReviewState> {
  const current = await readCandidate(dir);
  const state: ReviewState = {status: 'pending_review', candidateSha256: current.sha256, source, updatedAt: new Date().toISOString()};
  await writeAtomic(join(dir, 'review.md'), formatReview(current.plan, source));
  await writeAtomic(statePath(dir), `${JSON.stringify(state, null, 2)}\n`);
  return state;
}

export async function showReview(dir: string): Promise<string> {
  const current = await readCandidate(dir);
  const state = await readState(dir);
  if (state.candidateSha256 !== current.sha256) throw new Error('Candidate changed since review; run plan:review before viewing or deciding');
  return formatReview(current.plan, state.source).replace('Status: Pending Review until an explicit approve command succeeds.', `Status: ${state.status}.\nCandidate SHA-256: ${state.candidateSha256}`);
}

export async function decideCandidate(dir: string, decision: 'approved' | 'rejected'): Promise<ReviewState> {
  const current = await readCandidate(dir);
  const state = await readState(dir);
  if (state.candidateSha256 !== current.sha256) throw new Error('Candidate changed since review; run plan:review before deciding');
  if (state.status !== 'pending_review') throw new Error('Candidate is not pending review; run plan:review after any content change');
  if (decision === 'approved') {
    const approvedDir = join(dir, 'approved');
    await mkdir(approvedDir, {recursive: true});
    await writeFile(join(approvedDir, `${current.sha256}.json`), current.raw, {flag: 'wx'}).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'EEXIST') throw error;
    });
  }
  const next: ReviewState = {...state, status: decision, updatedAt: new Date().toISOString()};
  await writeAtomic(statePath(dir), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

/** Mandatory gate for a later narration stage; there is no narration call in Phase 2A. */
export async function getApprovedDraftForNarration(dir: string): Promise<PlanningDraft> {
  const current = await readCandidate(dir);
  const state = await readState(dir);
  if (state.status !== 'approved' || state.candidateSha256 !== current.sha256) throw new Error('Current candidate is not approved; narration is blocked');
  const snapshot = await readFile(join(dir, 'approved', `${current.sha256}.json`), 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new Error('Approved snapshot is missing; restore it before narration or rendering');
    throw error;
  });
  if (hash(snapshot) !== current.sha256) throw new Error('Approved snapshot checksum mismatch; narration is blocked');
  return parsePlanningDraft(JSON.parse(snapshot));
}

/** Future plan-driven rendering must pass both approval and implementation readiness. */
export async function getApprovedDraftForRendering(dir: string): Promise<PlanningDraft> {
  return assertStoryboardRenderReady(await getApprovedDraftForNarration(dir));
}
