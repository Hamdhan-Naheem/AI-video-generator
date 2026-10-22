import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {measureAudioDuration} from '../narration/elevenlabs';
import {validateDraftTimeline, type DraftTimeline} from './timeline';

const root = resolve(process.cwd());
const draftDir = join(root, 'm0', 'runs', 'electricity', 'gemini-live-phase2b-retry1', 'draft-4a');
const ffmpeg = join(root, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

async function main() {
  const timeline = JSON.parse(await readFile(join(draftDir, 'timeline.json'), 'utf8')) as DraftTimeline;
  validateDraftTimeline(timeline);
  const video = join(draftDir, 'video-only.mp4');
  const audio = join(draftDir, 'audio-timeline.wav');
  const output = join(draftDir, 'draft.mp4');
  const audioDuration = await measureAudioDuration(audio, root);
  if (Math.abs(audioDuration - 75) > 0.01) throw new Error('Derived audio must be 75 seconds before muxing');
  await readFile(video); // fail before invoking FFmpeg when the rendered video is absent
  await new Promise<void>((accept, reject) => {
    const child = spawn(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', audio,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', '75', '-movflags', '+faststart', output], {windowsHide: true, timeout: 120000});
    let diagnostic = '';
    child.stderr.on('data', (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString()).slice(-2000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`Local draft mux failed (${code}): ${diagnostic}`)));
  });
  console.log(`Saved narrated draft: ${output}`);
}

main().catch((error) => {console.error(error instanceof Error ? error.message : 'Draft mux failed'); process.exitCode = 1;});
