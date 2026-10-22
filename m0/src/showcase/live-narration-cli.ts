import {createHash} from 'node:crypto';
import {access, mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {createElevenLabsAdapter, loadLocalElevenLabsConfig, saveShowcaseNarrationCheckpoint} from '../narration/elevenlabs';
import {completeShowcaseScript} from './script-candidates';
import {getApprovedShowcaseScript} from './script-store';

const approvedHashes = {
  'luma-mini-v1': 'c8c048405edf5190107594dd93193719c8ffc00a60efdff4939e0f21846f8dba',
  'northstar-v2': '1e7fb3312bec9be6b1da5c8703588b017ecbdba4b329c86f79cc65fc93695418',
} as const;

const writeJsonOnce = (dir: string, name: string, value: unknown) => writeFile(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});

async function main() {
  const id = process.argv[2];
  if (id !== 'luma-mini-v1' && id !== 'northstar-v2') throw new Error('Use only luma-mini-v1 or northstar-v2');
  const root = resolve();
  const runDir = join(root, 'm0', 'runs', 'showcase-phase5c1', id);
  const narrationDir = join(runDir, 'narration');
  const {candidate, sha256} = await getApprovedShowcaseScript(runDir);
  if (candidate.id !== id || sha256 !== approvedHashes[id]) throw new Error('Approved candidate/hash differs from the authorized script; no request made');
  try {
    await access(narrationDir);
    throw new Error('Narration run already exists or may have been dispatched; no duplicate request made');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const config = loadLocalElevenLabsConfig(root);
  if (config.voiceId !== 'hpp4J3VqNfWAUOO0d1Us' || config.modelId !== 'eleven_flash_v2_5') throw new Error('Configured voice/model differs from authorized Bella/Flash v2.5; no request made');
  const script = completeShowcaseScript(candidate);
  const expectedCharacters = id === 'luma-mini-v1' ? 236 : 368;
  if (Array.from(script).length !== expectedCharacters || candidate.scenes.length !== 3) throw new Error('Approved narration metrics changed; no request made');
  await mkdir(narrationDir);
  const dispatchedAt = new Date().toISOString();
  await writeJsonOnce(narrationDir, 'dispatch-intent.json', {id, approvedSha256: sha256, voiceId: config.voiceId, modelId: config.modelId, characters: expectedCharacters, dispatchedAt, maximumGenerationRequests: 1});

  let requestCount = 0;
  let responseStatus: number | null = null;
  let responseMs: number | null = null;
  let requestId: string | null = null;
  let traceId: string | null = null;
  let characterCost: string | null = null;
  const started = performance.now();
  const fetchOnce: typeof fetch = async (input, init) => {
    if (++requestCount !== 1) throw new Error('Narration request limit exceeded');
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
      try {
        const encoded = (JSON.parse(raw) as {audio_base64?: unknown}).audio_base64;
        if (typeof encoded === 'string' && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
          await writeFile(join(narrationDir, 'audio.raw.mp3'), Buffer.from(encoded, 'base64'), {flag: 'wx'});
        }
      } catch {
        // The raw response remains available for offline diagnosis.
      }
    }
    return response;
  };

  try {
    const result = await createElevenLabsAdapter(config, fetchOnce).synthesizeApprovedShowcase(runDir);
    const timeline = await saveShowcaseNarrationCheckpoint(runDir, root, result);
    const record = {
      status: 'succeeded', id, approvedSha256: sha256, voiceId: config.voiceId,
      voiceName: 'Bella - Professional, Bright, Warm', modelId: config.modelId,
      requestCount, dispatchedAt, completedAt: new Date().toISOString(),
      responseStatus, responseMs, totalMs: Math.round(performance.now() - started),
      requestId, traceId, characterCost, narrationCharacters: expectedCharacters,
      narrationWords: script.trim().split(/\s+/u).length, sceneCount: timeline.scenes.length,
      audioBytes: result.audio.length, audioSha256: createHash('sha256').update(result.audio).digest('hex'),
      actualAudioDurationSeconds: timeline.originalAudioDurationSeconds,
      derivedVideoDurationSeconds: timeline.durationFrames / 30,
    };
    await writeJsonOnce(narrationDir, 'generation.json', record);
    console.log(JSON.stringify(record, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Narration generation or validation failed';
    await writeJsonOnce(narrationDir, 'generation.json', {
      status: 'failed', id, approvedSha256: sha256, voiceId: config.voiceId, modelId: config.modelId,
      requestCount, dispatchedAt, completedAt: new Date().toISOString(), responseStatus,
      responseMs, totalMs: Math.round(performance.now() - started), requestId, traceId, characterCost, error: message,
    });
    throw new Error(message);
  }
}

main().catch((error) => {console.error(error instanceof Error ? error.message : 'Controlled narration run failed'); process.exitCode = 1;});
