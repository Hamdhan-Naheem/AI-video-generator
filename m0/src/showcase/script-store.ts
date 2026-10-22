import {createHash} from 'node:crypto';
import {mkdir, readFile, rename, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {z} from 'zod';
import {completeShowcaseScript, showcaseScriptSeeds, validateShowcaseScript, type ShowcaseScript} from './script-candidates';

const StateSchema = z.object({status: z.enum(['pending_review', 'approved']), candidateSha256: z.string().regex(/^[a-f0-9]{64}$/), updatedAt: z.iso.datetime()}).strict();
type State = z.infer<typeof StateSchema>;
const sha256 = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
const candidatePath = (dir: string) => join(dir, 'candidate.json');
const statePath = (dir: string) => join(dir, 'review-state.json');

async function writeAtomic(path: string, content: string) {
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, content, {flag: 'wx'});
  await rename(temp, path);
}

async function readCandidate(dir: string) {
  const raw = await readFile(candidatePath(dir), 'utf8');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error('Showcase candidate JSON is malformed'); }
  return {candidate: validateShowcaseScript(value), raw, hash: sha256(raw)};
}

async function readState(dir: string): Promise<State> {
  return StateSchema.parse(JSON.parse(await readFile(statePath(dir), 'utf8')));
}

export function scriptMetrics(candidate: ShowcaseScript) {
  const script = completeShowcaseScript(candidate);
  const words = script.trim().split(/\s+/u).length;
  return {script, words, characters: Array.from(script).length, estimatedSeconds: words * 66.716735 / 150};
}

export function formatScriptReview(candidate: ShowcaseScript, hash: string, status: string): string {
  const metrics = scriptMetrics(candidate);
  return [
    `# ${candidate.id} — narration candidate`, '',
    `Status: ${status}`, `Candidate SHA-256: ${hash}`, `Category: ${candidate.category}; language: English`,
    'Proposed voice: Bella — Professional, Bright, Warm (hpp4J3VqNfWAUOO0d1Us); model: eleven_flash_v2_5',
    `Words: ${metrics.words}; characters: ${metrics.characters}; measured-rate estimate: ${metrics.estimatedSeconds.toFixed(2)} seconds; planning target: approximately ${candidate.targetNarrationSeconds} seconds`,
    'Estimate uses the earlier 150-word / 66.716735-second Bella take. Actual speech duration and scene timing require a later recorded take.',
    '', '## Complete proposed narration', '', metrics.script, '', '## Visual mapping', '',
    ...candidate.scenes.flatMap((scene, index) => [`### Scene ${index + 1}: ${scene.sceneId}`, '', `Narration: ${scene.text}`, '', `Visual match: ${scene.visualReason}`, '']),
    'No script is approved by creating or viewing this file. Real audio requires separate authorization after exact-hash manual approval.', '',
  ].join('\n');
}

/** Seed once. Saved candidates stay independent and pending. */
export async function seedShowcaseCandidate(dir: string, id: ShowcaseScript['id']) {
  const candidate = validateShowcaseScript(showcaseScriptSeeds[id]);
  await mkdir(dir, {recursive: true});
  const raw = `${JSON.stringify(candidate, null, 2)}\n`;
  await writeFile(candidatePath(dir), raw, {flag: 'wx'}).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EEXIST') throw new Error('Showcase candidate already exists; it was not overwritten');
    throw error;
  });
  const hash = sha256(raw);
  const state: State = {status: 'pending_review', candidateSha256: hash, updatedAt: new Date().toISOString()};
  await writeAtomic(statePath(dir), `${JSON.stringify(state, null, 2)}\n`);
  await writeAtomic(join(dir, 'review.md'), formatScriptReview(candidate, hash, state.status));
  return {hash, state};
}

export async function reviewShowcaseCandidate(dir: string) {
  const {candidate, hash} = await readCandidate(dir);
  const state: State = {status: 'pending_review', candidateSha256: hash, updatedAt: new Date().toISOString()};
  await writeAtomic(statePath(dir), `${JSON.stringify(state, null, 2)}\n`);
  await writeAtomic(join(dir, 'review.md'), formatScriptReview(candidate, hash, state.status));
  return {candidate, hash, state};
}

export async function showShowcaseCandidate(dir: string) {
  const {candidate, hash} = await readCandidate(dir);
  const state = await readState(dir);
  return formatScriptReview(candidate, hash, state.candidateSha256 === hash ? state.status : 'CHANGED SINCE REVIEW — approval invalid');
}

export async function approveShowcaseCandidate(dir: string, exactHash: string) {
  const {candidate, raw, hash} = await readCandidate(dir);
  const state = await readState(dir);
  if (state.status !== 'pending_review' || hash !== exactHash || state.candidateSha256 !== hash) throw new Error('Approval blocked: review the current pending script and pass its exact SHA-256');
  const snapshotDir = join(dir, 'approved');
  await mkdir(snapshotDir, {recursive: true});
  await writeFile(join(snapshotDir, `${hash}.json`), raw, {flag: 'wx'}).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'EEXIST') throw error;
  });
  const next: State = {...state, status: 'approved', updatedAt: new Date().toISOString()};
  await writeAtomic(statePath(dir), `${JSON.stringify(next, null, 2)}\n`);
  await writeAtomic(join(dir, 'review.md'), formatScriptReview(candidate, hash, next.status));
  return hash;
}

/** Future synthesis must call this gate immediately before any dispatch. */
export async function getApprovedShowcaseScript(dir: string): Promise<{candidate: ShowcaseScript; sha256: string}> {
  const {candidate, hash} = await readCandidate(dir);
  const state = await readState(dir);
  if (state.status !== 'approved' || state.candidateSha256 !== hash) throw new Error('Current showcase script is not approved; audio generation is blocked');
  const snapshot = await readFile(join(dir, 'approved', `${hash}.json`), 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new Error('Approved showcase snapshot is missing; audio generation is blocked');
    throw error;
  });
  if (sha256(snapshot) !== hash) throw new Error('Approved showcase snapshot checksum mismatch; audio generation is blocked');
  return {candidate: validateShowcaseScript(JSON.parse(snapshot)), sha256: hash};
}
