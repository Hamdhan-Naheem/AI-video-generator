import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {createElevenLabsAdapter, loadLocalElevenLabsConfig, saveNarrationCheckpoint} from './elevenlabs';
import {completeNarration} from './timing';
import {getApprovedDraftForNarration} from '../planning/review-store';

const root = resolve(process.cwd());
const runDir = join(root, 'm0', 'runs', 'electricity', 'gemini-live-phase2b-retry1');
const narrationDir = join(runDir, 'narration');
const approvedSha256 = '8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10';
const bellaVoiceId = 'hpp4J3VqNfWAUOO0d1Us';
const writeJsonOnce = (name: string, value: unknown) => writeFile(join(narrationDir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});

async function main() {
  const approved = await getApprovedDraftForNarration(runDir);
  const rawCandidate = await readFile(join(runDir, 'candidate.json'));
  const currentSha256 = createHash('sha256').update(rawCandidate).digest('hex');
  if (currentSha256 !== approvedSha256) throw new Error('Approved candidate hash changed; no narration request made');
  const narration = completeNarration(approved);
  if (Array.from(narration).length !== 974 || narration.trim().split(/\s+/u).length !== 150 || approved.storyboard.scenes.length !== 7 || approved.input.targetDurationSeconds !== 75) {
    throw new Error('Approved script no longer matches controlled M0 input; no narration request made');
  }
  const config = loadLocalElevenLabsConfig(root);
  if (config.voiceId !== bellaVoiceId || config.modelId !== 'eleven_flash_v2_5') throw new Error('Configured voice or model is not Bella / Flash v2.5; no narration request made');
  await mkdir(narrationDir, {recursive: true});
  const dispatchedAt = new Date().toISOString();
  await writeJsonOnce('dispatch-intent.json', {
    approvedSha256, voiceId: bellaVoiceId, modelId: config.modelId,
    characters: Array.from(narration).length, dispatchedAt, maximumGenerationRequests: 1,
  });

  let requests = 0;
  let responseStatus: number | null = null;
  let requestId: string | null = null;
  let traceId: string | null = null;
  let characterCost: string | null = null;
  let responseMs: number | null = null;
  const started = performance.now();
  const fetchOnce: typeof fetch = async (input, init) => {
    if (++requests !== 1) throw new Error('Narration request limit exceeded');
    const response = await fetch(input, init);
    responseMs = Math.round(performance.now() - started);
    responseStatus = response.status;
    requestId = response.headers.get('request-id');
    traceId = response.headers.get('x-trace-id');
    characterCost = response.headers.get('character-cost');
    if (response.ok) {
      const raw = await response.clone().text();
      if (raw.length > 30_000_000) throw new Error('Provider response exceeds bounded checkpoint size');
      await writeFile(join(narrationDir, 'response.raw.json'), raw, {flag: 'wx'});
      // Preserve valid audio before strict alignment or duration checks can reject a response.
      try {
        const encoded = (JSON.parse(raw) as {audio_base64?: unknown}).audio_base64;
        if (typeof encoded === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
          await writeFile(join(narrationDir, 'audio.raw.mp3'), Buffer.from(encoded, 'base64'), {flag: 'wx'});
        }
      } catch {
        // The raw response remains available for safe offline diagnosis.
      }
    }
    return response;
  };

  try {
    const result = await createElevenLabsAdapter(config, fetchOnce).synthesizeApproved(runDir);
    const timing = await saveNarrationCheckpoint(runDir, root, result);
    const words = timing.scenes.flatMap((scene) => scene.words.map((word) => ({sceneId: scene.sceneId, ...word})));
    const subtitles = timing.scenes.flatMap((scene) => scene.subtitles.map((subtitle) => ({sceneId: scene.sceneId, ...subtitle})));
    const scenes = timing.scenes.map(({sceneId, text, startSeconds, endSeconds}) => ({sceneId, text, startSeconds, endSeconds}));
    await writeJsonOnce('words.json', words);
    await writeJsonOnce('subtitles.json', subtitles);
    await writeJsonOnce('scenes.json', scenes);
    const record = {
      status: 'succeeded', approvedSha256, voiceId: bellaVoiceId, voiceName: 'Bella - Professional, Bright, Warm',
      modelId: config.modelId, requestCount: requests, dispatchedAt, completedAt: new Date().toISOString(),
      responseStatus, responseMs, totalMs: Math.round(performance.now() - started), requestId, traceId, characterCost,
      narrationCharacters: Array.from(narration).length, narrationWords: words.length, sceneCount: scenes.length,
      audioBytes: result.audio.length, audioSha256: createHash('sha256').update(result.audio).digest('hex'),
      actualAudioDurationSeconds: timing.actualAudioDurationSeconds, estimatedDurationSeconds: timing.estimatedDurationSeconds,
      acceptedDurationRangeSeconds: [72, 78], durationWithinAcceptedRange: timing.actualAudioDurationSeconds >= 72 && timing.actualAudioDurationSeconds <= 78,
    };
    await writeJsonOnce('generation.json', record);
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Narration generation or validation failed';
    await writeJsonOnce('generation.json', {
      status: 'failed', approvedSha256, voiceId: bellaVoiceId, modelId: config.modelId,
      requestCount: requests, dispatchedAt, completedAt: new Date().toISOString(), responseStatus,
      responseMs, totalMs: Math.round(performance.now() - started), requestId, traceId, characterCost, error: message,
    });
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Controlled narration run failed');
  process.exitCode = 1;
});
