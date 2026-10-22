import {createHash} from 'node:crypto';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {completeShowcaseScript, showcasePlanFor, validateShowcaseScript} from './script-candidates';
import {buildShowcaseVoiceoverTimeline} from './voiceover-timeline';

/** Synthetic timing for still-frame QA only; never represents generated speech. */
for (const id of ['luma-mini-v1', 'northstar-v1'] as const) {
  const dir = resolve('m0', 'runs', 'showcase-phase5c1', id);
  const raw = await readFile(join(dir, 'candidate.json'), 'utf8');
  const candidate = validateShowcaseScript(JSON.parse(raw));
  const text = completeShowcaseScript(candidate);
  const chars = Array.from(text);
  const alignment = {characters: chars, character_start_times_seconds: chars.map((_, index) => index * 0.07), character_end_times_seconds: chars.map((_, index) => (index + 1) * 0.07)};
  const voiceover = buildShowcaseVoiceoverTimeline(candidate, createHash('sha256').update(raw).digest('hex'), alignment, chars.length * 0.07, 'synthetic-smoke-only.wav');
  await mkdir(dir, {recursive: true});
  const path = join(dir, 'offline-smoke-props.json');
  await writeFile(path, `${JSON.stringify({plan: showcasePlanFor(candidate.category), voiceover, includeAudio: false, showSubtitles: true}, null, 2)}\n`);
  console.log(`${id}: synthetic visual props ${path}; ${voiceover.durationFrames} frames`);
}
