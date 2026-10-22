import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {measureAudioDuration} from '../narration/elevenlabs';
import {getApprovedShowcaseScript} from './script-store';
import {showcasePlanFor} from './script-candidates';
import {buildShowcaseVoiceoverTimeline, showcaseAudioFilter} from './voiceover-timeline';

const writeJsonOnce = (dir: string, name: string, value: unknown) => writeFile(join(dir, name), `${JSON.stringify(value, null, 2)}\n`, {flag: 'wx'});

async function main() {
  const id = process.argv[2];
  if (id !== 'luma-mini-v1' && id !== 'northstar-v2') throw new Error('Use only luma-mini-v1 or northstar-v2');
  const root = resolve();
  const runDir = join(root, 'm0', 'runs', 'showcase-phase5c1', id);
  const narrationDir = join(runDir, 'narration');
  const {candidate, sha256} = await getApprovedShowcaseScript(runDir);
  const record = JSON.parse(await readFile(join(narrationDir, 'generation.json'), 'utf8'));
  if (record.status !== 'succeeded' || record.requestCount !== 1 || record.approvedSha256 !== sha256 || record.id !== id) throw new Error('One successful approved narration checkpoint is required');
  const audioPath = join(narrationDir, 'audio.mp3');
  const audio = await readFile(audioPath);
  if (createHash('sha256').update(audio).digest('hex') !== record.audioSha256) throw new Error('Original narration audio checksum changed');
  const duration = await measureAudioDuration(audioPath, root);
  if (Math.abs(duration - record.actualAudioDurationSeconds) > 0.001) throw new Error('Original narration audio duration changed');
  const alignment = JSON.parse(await readFile(join(narrationDir, 'alignment.original.json'), 'utf8'));
  const timeline = buildShowcaseVoiceoverTimeline(candidate, sha256, alignment, duration, 'showcase-voiceover.wav');
  const savedTimeline = JSON.parse(await readFile(join(narrationDir, 'timeline.json'), 'utf8'));
  if (!isDeepStrictEqual(timeline, savedTimeline)) throw new Error('Saved showcase timeline differs from approved audio/alignment');

  const binary = join(root, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  const derivedAudio = join(narrationDir, 'audio-timeline.wav');
  await new Promise<void>((accept, reject) => {
    const args = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', ...Array.from({length: 3}, () => ['-i', audioPath]).flat(), '-filter_complex', showcaseAudioFilter(timeline), '-map', '[out]', '-c:a', 'pcm_s16le', derivedAudio];
    const child = spawn(binary, args, {windowsHide: true, timeout: 120000});
    let diagnostic = '';
    child.stderr.on('data', (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString()).slice(-3000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`Local audio derivation failed (${code}): ${diagnostic}`)));
  });
  const derivedDuration = await measureAudioDuration(derivedAudio, root);
  if (Math.abs(derivedDuration - timeline.durationFrames / 30) > 0.05) throw new Error('Derived audio duration does not match the saved timeline');
  await writeJsonOnce(narrationDir, 'render-props.json', {plan: showcasePlanFor(candidate.category), voiceover: timeline, includeAudio: false, showSubtitles: true});
  await writeJsonOnce(narrationDir, 'words.json', timeline.scenes.flatMap((scene) => scene.words.map((word) => ({sceneId: scene.sceneId, ...word}))));
  await writeJsonOnce(narrationDir, 'subtitles.json', timeline.scenes.flatMap((scene) => scene.subtitles.map((cue) => ({sceneId: scene.sceneId, ...cue}))));
  await writeJsonOnce(narrationDir, 'scenes.json', timeline.scenes.map(({sceneId, startFrame, endFrame, speechStartSeconds, speechEndSeconds}) => ({sceneId, startFrame, endFrame, speechStartSeconds, speechEndSeconds})));
  await writeJsonOnce(narrationDir, 'prepare.json', {approvedSha256: sha256, originalAudioSha256: record.audioSha256, originalDurationSeconds: duration, derivedDurationSeconds: derivedDuration, outputDurationSeconds: timeline.durationFrames / 30, sceneCount: timeline.scenes.length});
  console.log(`${id}: original ${duration.toFixed(6)}s, derived ${derivedDuration.toFixed(6)}s, ${timeline.durationFrames} frames`);
}

main().catch((error) => {console.error(error instanceof Error ? error.message : 'Showcase preparation failed'); process.exitCode = 1;});
