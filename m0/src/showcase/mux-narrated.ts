import {spawn} from 'node:child_process';
import {access, readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {measureAudioDuration} from '../narration/elevenlabs';
import {getApprovedShowcaseScript} from './script-store';

async function main() {
  const id = process.argv[2];
  if (id !== 'luma-mini-v1' && id !== 'northstar-v2') throw new Error('Use only luma-mini-v1 or northstar-v2');
  const root = resolve();
  const runDir = join(root, 'm0', 'runs', 'showcase-phase5c1', id);
  const narrationDir = join(runDir, 'narration');
  const {sha256} = await getApprovedShowcaseScript(runDir);
  const timeline = JSON.parse(await readFile(join(narrationDir, 'timeline.json'), 'utf8'));
  if (timeline.candidateSha256 !== sha256) throw new Error('Timeline approval hash changed');
  const video = join(narrationDir, 'video-only.mp4');
  const audio = join(narrationDir, 'audio-timeline.wav');
  const output = join(narrationDir, 'draft-narrated.mp4');
  await access(video);
  try {
    await access(output);
    throw new Error('Narrated draft already exists; no overwrite');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const duration = timeline.durationFrames / 30;
  if (Math.abs((await measureAudioDuration(audio, root)) - duration) > 0.05) throw new Error('Derived audio duration differs from timeline');
  const ffmpeg = join(root, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  await new Promise<void>((accept, reject) => {
    const child = spawn(ffmpeg, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-n', '-i', video, '-i', audio,
      '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', duration.toFixed(6), '-movflags', '+faststart', output], {windowsHide: true, timeout: 120000});
    let diagnostic = '';
    child.stderr.on('data', (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString()).slice(-3000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`Local showcase mux failed (${code}): ${diagnostic}`)));
  });
  console.log(`Saved narrated draft: ${output}`);
}

main().catch((error) => {console.error(error instanceof Error ? error.message : 'Showcase mux failed'); process.exitCode = 1;});
