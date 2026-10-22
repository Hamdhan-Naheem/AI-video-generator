import {mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {checkControlledElectricityDraft} from './controlled-electricity';
import {createGeminiPlanner, loadLocalGeminiConfig} from './gemini';
import {saveNewCandidate} from './review-store';

const root = process.cwd();
const attempt = process.argv[2];
if (attempt && attempt !== 'retry1') throw new Error('Unknown Gemini attempt ID; no request sent');
const runId = attempt === 'retry1' ? 'gemini-live-phase2b-retry1' : 'gemini-live-phase2b';
const runDir = resolve(root, 'm0/runs/electricity', runId);
const model = 'gemini-3.8-flash';
const input = {
  type: 'educational',
  style: 'cartoon_teacher',
  topic: 'How Electricity Is Generated',
  instructions: 'Create a clear, engaging vertical 9:16 educational storyboard. Distinguish generation from transmission. Include multiple energy sources and a teacher introduction and conclusion. Estimate 72–78 seconds around a 75-second target; no estimates are audio timestamps.',
  language: 'en',
  targetDurationSeconds: 75,
} as const;

const config = loadLocalGeminiConfig(root);
if (config.model !== model) throw new Error('Configured GEMINI_MODEL differs from the authorized gemini-3.8-flash; no request sent');

// Creating this fixed run directory is the durable one-use gate. Never delete it to retry.
await mkdir(runDir);
const startedAt = new Date().toISOString();
let dispatchAttempts = 0;
let httpStatus: number | undefined;
let rawResponse: string | undefined;
let validationResult = 'not_received';
let wordCount: number | undefined;
let durationEstimate: number | undefined;
let sceneCount: number | undefined;
let warnings: string[] = [];
let errorMessage: string | undefined;

const fetchOnce: typeof fetch = async (url, init) => {
  if (dispatchAttempts !== 0) throw new Error('Second Gemini dispatch is forbidden for this run');
  dispatchAttempts = 1;
  await writeFile(resolve(runDir, 'dispatch-intent.json'), JSON.stringify({model, startedAt, purpose: 'one controlled electricity storyboard', maximumRequests: 1}, null, 2) + '\n', {flag: 'wx'});
  const response = await fetch(url, {...init, redirect: 'error'});
  httpStatus = response.status;
  rawResponse = await response.clone().text().catch(() => undefined);
  return response;
};

try {
  const plan = await createGeminiPlanner(config, fetchOnce).generate(input);
  const checked = checkControlledElectricityDraft(plan);
  validationResult = 'passed';
  wordCount = checked.wordCount;
  durationEstimate = plan.storyboard.estimatedDurationSeconds;
  sceneCount = plan.storyboard.scenes.length;
  warnings = checked.warnings;
  await saveNewCandidate(runDir, plan, 'gemini_response');
  console.log(`Gemini candidate saved Pending Review: ${sceneCount} scenes, ${durationEstimate}s estimated, ${wordCount} narration words. No approval or narration was generated.`);
} catch (error) {
  validationResult = error instanceof Error && /Invalid planning draft|Controlled M0/.test(error.message) ? 'failed' : 'not_completed';
  errorMessage = error instanceof Error ? error.message : 'Controlled Gemini generation failed';
  console.error(`${errorMessage} No automatic retry was made.`);
  process.exitCode = 1;
} finally {
  const completedAt = new Date().toISOString();
  let usageMetadata: Record<string, unknown> | undefined;
  let modelVersion: string | undefined;
  let finishReason: string | undefined;
  if (rawResponse) {
    await writeFile(resolve(runDir, 'provider-response.json'), rawResponse.replaceAll(config.apiKey, '[REDACTED]'), {flag: 'wx'});
    try {
      const parsed = JSON.parse(rawResponse) as {usageMetadata?: Record<string, unknown>; modelVersion?: string; candidates?: {finishReason?: string}[]};
      usageMetadata = parsed.usageMetadata;
      modelVersion = parsed.modelVersion;
      finishReason = parsed.candidates?.[0]?.finishReason;
    } catch { /* Keep the raw response for local diagnostics. */ }
  }
  await writeFile(resolve(runDir, 'generation.json'), JSON.stringify({
    source: 'real_gemini_api',
    model,
    modelVersion: modelVersion ?? null,
    api: 'v1beta generateContent',
    routing: 'standard',
    startedAt,
    completedAt,
    durationMs: Date.parse(completedAt) - Date.parse(startedAt),
    dispatchAttempts,
    httpStatus: httpStatus ?? null,
    finishReason: finishReason ?? null,
    usageMetadata: usageMetadata ?? null,
    validationResult,
    wordCount: wordCount ?? null,
    estimatedDurationSeconds: durationEstimate ?? null,
    sceneCount: sceneCount ?? null,
    warnings,
    error: errorMessage ?? null,
    reviewStatus: validationResult === 'passed' && !errorMessage ? 'pending_review' : 'no_candidate',
  }, null, 2) + '\n', {flag: 'wx'});
}
