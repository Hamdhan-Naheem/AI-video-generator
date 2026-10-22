import {spawn} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {measureAudioDuration} from '../narration/elevenlabs';
import {completeNarration, makeNarrationTiming} from '../narration/timing';
import {getApprovedDraftForRendering} from '../planning/review-store';
import {buildDraftTimeline, type DraftTimeline} from './timeline';
import {readPinnedAsset, readRequiredJsonAsset} from './pinned-asset';

const root = resolve(process.cwd());
const runDir = join(root, 'm0', 'runs', 'electricity', 'gemini-live-phase2b-retry1');
const narrationDir = join(runDir, 'narration');
const draftDir = join(runDir, 'draft-4a');
const approvedSha256 = '8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10';
const originalAudioSha256 = 'a4da480bf6924abfcccae3b2d9d707e8d80685237daa69671d79b3a548e8e815';

function ffmpegPath() {
  return join(root, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
}

function filterFor(timeline: DraftTimeline): string {
  const parts: string[] = [];
  const concatInputs = ['[p0]'];
  parts.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${timeline.insertedSilence[0].endSeconds.toFixed(6)}[p0]`);
  for (let i = 0; i < 7; i++) {
    parts.push(`[${i}:a]atrim=start=${timeline.sourceCutsSeconds[i].toFixed(6)}:end=${timeline.sourceCutsSeconds[i + 1].toFixed(6)},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[s${i}]`);
    concatInputs.push(`[s${i}]`);
    if (i < 6) {
      const interval = timeline.insertedSilence[i + 1];
      parts.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${(interval.endSeconds - interval.startSeconds).toFixed(6)}[p${i + 1}]`);
      concatInputs.push(`[p${i + 1}]`);
    }
  }
  const final = timeline.insertedSilence.at(-1)!;
  parts.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${(final.endSeconds - final.startSeconds).toFixed(6)}[p7]`);
  concatInputs.push('[p7]');
  parts.push(`${concatInputs.join('')}concat=n=${concatInputs.length}:v=0:a=1,apad,atrim=duration=75[out]`);
  return parts.join(';');
}

async function runFfmpeg(args: string[]) {
  await new Promise<void>((accept, reject) => {
    const child = spawn(ffmpegPath(), args, {windowsHide: true, timeout: 120000});
    let error = '';
    child.stderr.on('data', (chunk: Buffer) => { error = (error + chunk.toString()).slice(-4000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`Local FFmpeg audio derivation failed (${code}): ${error}`)));
  });
}

async function main() {
  const plan = await getApprovedDraftForRendering(runDir);
  await readPinnedAsset(join(runDir, 'candidate.json'), 'Approved candidate', approvedSha256);
  const audioPath = join(narrationDir, 'audio.mp3');
  await readPinnedAsset(audioPath, 'Original narration audio', originalAudioSha256);
  const original = await readRequiredJsonAsset(join(narrationDir, 'alignment.original.json'), 'Original narration alignment');
  const measured = await measureAudioDuration(audioPath, root);
  const timing = makeNarrationTiming(plan, original, measured);
  if (Array.from(completeNarration(plan)).length !== 974) throw new Error('Approved narration changed');
  const timeline = buildDraftTimeline(plan, timing, approvedSha256);
  await mkdir(draftDir, {recursive: true});
  const derivedAudio = join(draftDir, 'audio-timeline.wav');
  await runFfmpeg(['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', ...Array.from({length: 7}, () => ['-i', audioPath]).flat(), '-filter_complex', filterFor(timeline), '-map', '[out]', '-c:a', 'pcm_s16le', derivedAudio]);
  const derivedDuration = await measureAudioDuration(derivedAudio, root);
  if (Math.abs(derivedDuration - timeline.durationSeconds) > 0.05) throw new Error(`Derived audio duration ${derivedDuration} does not match timeline ${timeline.durationSeconds}`);
  await writeFile(join(draftDir, 'timeline.json'), `${JSON.stringify(timeline, null, 2)}\n`);
  await writeFile(join(draftDir, 'render-props.json'), `${JSON.stringify({timeline, includeAudio: false}, null, 2)}\n`);
  await writeFile(join(draftDir, 'prepare.json'), `${JSON.stringify({approvedSha256, originalAudioSha256, originalDurationSeconds: measured, derivedDurationSeconds: derivedDuration, outputDurationSeconds: timeline.durationSeconds, privateAudioPath: derivedAudio}, null, 2)}\n`);
  console.log(`Prepared seven-scene timeline: original ${measured.toFixed(6)}s, derived ${derivedDuration.toFixed(6)}s, 75.000000s visual duration`);
  console.log(`Saved ${derivedAudio}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : 'Draft preparation failed'); process.exitCode = 1; });
