import {mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {loadEnvFile} from 'node:process';
import {spawn} from 'node:child_process';
import {z} from 'zod';
import {getApprovedDraftForNarration} from '../planning/review-store';
import {completeNarration, makeNarrationTiming, validateOriginalAlignment, type CharacterAlignment} from './timing';
import {completeShowcaseScript} from '../showcase/script-candidates';
import {getApprovedShowcaseScript} from '../showcase/script-store';
import {buildShowcaseVoiceoverTimeline} from '../showcase/voiceover-timeline';

const ConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  voiceId: z.string().regex(/^[A-Za-z0-9_-]{8,100}$/),
  modelId: z.enum(['eleven_flash_v2_5', 'eleven_multilingual_v2']),
  timeoutMs: z.number().int().min(1000).max(180000),
}).strict();
export type ElevenLabsConfig = z.infer<typeof ConfigSchema>;

/** Server-only. Loading configuration makes no provider request. */
export function loadLocalElevenLabsConfig(projectRoot: string): ElevenLabsConfig {
  loadEnvFile(resolve(projectRoot, '.env'));
  if (!process.env.ELEVENLABS_API_KEY?.trim()) throw new Error('ELEVENLABS_API_KEY is missing from root .env');
  if (!process.env.ELEVENLABS_VOICE_ID?.trim()) throw new Error('ELEVENLABS_VOICE_ID is required; choose an English voice available to this account');
  return ConfigSchema.parse({
    apiKey: process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID,
    modelId: process.env.ELEVENLABS_MODEL_ID || 'eleven_flash_v2_5',
    timeoutMs: Number(process.env.ELEVENLABS_TIMEOUT_MS || 120000),
  });
}

export type SpeechResult = {audio: Buffer; originalAlignment: CharacterAlignment; normalizedAlignment: unknown; text: string};

/** Exactly one fetch per invocation. No SDK, retries, or automatic regeneration. */
export function createElevenLabsAdapter(rawConfig: ElevenLabsConfig, fetchImpl: typeof fetch = fetch) {
  const config = ConfigSchema.parse(rawConfig);
  async function synthesizeText(text: string): Promise<SpeechResult> {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        let response: Response;
        try {
          response = await fetchImpl(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(config.voiceId)}/with-timestamps`, {
            method: 'POST', redirect: 'error', signal: controller.signal,
            headers: {'Content-Type': 'application/json', 'xi-api-key': config.apiKey},
            body: JSON.stringify({text, model_id: config.modelId, ...(config.modelId === 'eleven_flash_v2_5' ? {language_code: 'en'} : {}), output_format: 'mp3_44100_128'}),
          });
        } catch (error) {
          throw new Error(controller.signal.aborted ? `ElevenLabs request timed out after ${config.timeoutMs} ms; outcome uncertain; do not retry automatically` : 'ElevenLabs network request failed; outcome uncertain; do not retry automatically');
        }
        if (!response.ok) throw new Error(`ElevenLabs returned HTTP ${response.status}; no automatic retry`);
        const raw = await response.text();
        if (raw.length > 30_000_000) throw new Error('ElevenLabs response exceeds size limit');
        let value: unknown;
        try { value = JSON.parse(raw); } catch { throw new Error('ElevenLabs returned invalid JSON'); }
        const parsed = z.object({audio_base64: z.string().min(1), alignment: z.unknown(), normalized_alignment: z.unknown().optional()}).passthrough().parse(value);
        if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(parsed.audio_base64)) throw new Error('ElevenLabs returned invalid audio encoding');
        const audio = Buffer.from(parsed.audio_base64, 'base64');
        if (!audio.length) throw new Error('ElevenLabs returned empty audio');
        const originalAlignment = validateOriginalAlignment(parsed.alignment, text);
        return {audio, originalAlignment, normalizedAlignment: parsed.normalized_alignment, text};
      } finally { clearTimeout(timer); }
  }
  return {
    async synthesizeApproved(runDir: string): Promise<SpeechResult> {
      const approved = await getApprovedDraftForNarration(runDir);
      return synthesizeText(completeNarration(approved));
    },
    async synthesizeApprovedShowcase(runDir: string): Promise<SpeechResult> {
      const {candidate} = await getApprovedShowcaseScript(runDir);
      return synthesizeText(completeShowcaseScript(candidate));
    },
  };
}

/** Uses Remotion's locally installed ffprobe. Duration comes from decoded media, not text estimates. */
export async function measureAudioDuration(audioPath: string, projectRoot: string): Promise<number> {
  const binary = join(projectRoot, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
  const output = await new Promise<string>((accept, reject) => {
    const child = spawn(binary, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', audioPath], {windowsHide: true, timeout: 15000});
    let stdout = '';
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); if (stdout.length > 1000) child.kill(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept(stdout) : reject(new Error('Local audio probe failed')));
  });
  const duration = Number(output.trim());
  if (!Number.isFinite(duration) || duration <= 0) throw new Error('Local audio probe returned an invalid duration');
  return duration;
}

/** Call only in a separately authorized live phase. Exclusive files prevent silent overwrite. */
export async function saveNarrationCheckpoint(runDir: string, projectRoot: string, result: SpeechResult) {
  const approved = await getApprovedDraftForNarration(runDir);
  if (completeNarration(approved) !== result.text) throw new Error('Approved narration changed before checkpoint save');
  const destination = join(runDir, 'narration');
  await mkdir(destination, {recursive: true});
  const audioPath = join(destination, 'audio.mp3');
  await writeFile(audioPath, result.audio, {flag: 'wx'});
  await writeFile(join(destination, 'alignment.original.json'), `${JSON.stringify(result.originalAlignment, null, 2)}\n`, {flag: 'wx'});
  await writeFile(join(destination, 'alignment.normalized.json'), `${JSON.stringify(result.normalizedAlignment ?? null, null, 2)}\n`, {flag: 'wx'});
  const duration = await measureAudioDuration(audioPath, projectRoot);
  const timing = makeNarrationTiming(approved, result.originalAlignment, duration);
  await writeFile(join(destination, 'timing.json'), `${JSON.stringify(timing, null, 2)}\n`, {flag: 'wx'});
  return timing;
}

/** Future controlled showcase runner may checkpoint one approved take; Phase 5C.1 never calls this. */
export async function saveShowcaseNarrationCheckpoint(runDir: string, projectRoot: string, result: SpeechResult) {
  const {candidate, sha256} = await getApprovedShowcaseScript(runDir);
  if (completeShowcaseScript(candidate) !== result.text) throw new Error('Approved showcase narration changed before checkpoint save');
  const destination = join(runDir, 'narration');
  await mkdir(destination, {recursive: true});
  const audioPath = join(destination, 'audio.mp3');
  await writeFile(audioPath, result.audio, {flag: 'wx'});
  await writeFile(join(destination, 'alignment.original.json'), `${JSON.stringify(result.originalAlignment, null, 2)}\n`, {flag: 'wx'});
  await writeFile(join(destination, 'alignment.normalized.json'), `${JSON.stringify(result.normalizedAlignment ?? null, null, 2)}\n`, {flag: 'wx'});
  const duration = await measureAudioDuration(audioPath, projectRoot);
  const timeline = buildShowcaseVoiceoverTimeline(candidate, sha256, result.originalAlignment, duration, 'showcase-voiceover.wav');
  await writeFile(join(destination, 'timeline.json'), `${JSON.stringify(timeline, null, 2)}\n`, {flag: 'wx'});
  return timeline;
}
