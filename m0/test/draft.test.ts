import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {makeNarrationTiming} from '../src/narration/timing';
import {getApprovedDraftForRendering} from '../src/planning/review-store';
import {graphicKindFor} from '../src/video/EducationalGraphics';
import {buildDraftTimeline, mouthOpenAt, validateDraftTimeline} from '../src/video/timeline';
import {readPinnedAsset, readRequiredJsonAsset} from '../src/video/pinned-asset';

const runDir = resolve('m0/runs/electricity/gemini-live-phase2b-retry1');
const expectedHash = '8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10';
const plan = await getApprovedDraftForRendering(runDir);
const candidate = await readFile(join(runDir, 'candidate.json'));
const original = JSON.parse(await readFile(join(runDir, 'narration', 'alignment.original.json'), 'utf8')) as unknown;
const timing = makeNarrationTiming(plan, original, 66.716735);
const timeline = buildDraftTimeline(plan, timing, expectedHash);

test('approved snapshot and all five authored scene templates load', () => {
  assert.equal(createHash('sha256').update(candidate).digest('hex'), expectedHash);
  assert.deepEqual([...new Set(timeline.scenes.map((scene) => scene.templateId))].sort(), [
    'teacher_intro_v1', 'teacher_explanation_v1', 'teacher_beside_diagram_v1', 'full_screen_diagram_v1', 'teacher_conclusion_v1',
  ].sort());
  assert.deepEqual(timeline.scenes.map((scene) => scene.id), ['scene-01', 'scene-02', 'scene-03', 'scene-04', 'scene-05', 'scene-06', 'scene-07']);
});

test('source cuts preserve one complete audio traversal and added silent holds', () => {
  assert.equal(timeline.sourceCutsSeconds[0], 0);
  assert.equal(timeline.sourceCutsSeconds.at(-1), 66.716735);
  assert.equal(timeline.sourceCutsSeconds.length - 1, 7);
  assert.equal(timeline.insertedSilence.length, 8);
  const audioSeconds = timeline.sourceCutsSeconds.slice(1).reduce((total, cut, index) => total + cut - timeline.sourceCutsSeconds[index], 0);
  const silenceSeconds = timeline.insertedSilence.reduce((total, span) => total + span.endSeconds - span.startSeconds, 0);
  assert.ok(Math.abs(audioSeconds - 66.716735) < 1e-6);
  assert.ok(Math.abs(silenceSeconds - 8.283265) < 1e-6);
  assert.ok(Math.abs(audioSeconds + silenceSeconds - 75) < 1e-6);
  validateDraftTimeline(timeline);
});

test('all 150 words and 28 subtitles retain text and shifted speech timing', () => {
  assert.equal(timeline.scenes.flatMap((scene) => scene.words).length, 150);
  assert.equal(timeline.scenes.flatMap((scene) => scene.subtitles).length, 28);
  timeline.scenes.forEach((scene, index) => {
    assert.equal(scene.words.map((word) => word.text).join(' '), plan.storyboard.scenes[index].narration);
    assert.equal(scene.subtitles.map((subtitle) => subtitle.text).join(' '), plan.storyboard.scenes[index].narration);
    const offset = scene.speechStartSeconds - timing.scenes[index].startSeconds;
    assert.ok(Math.abs(scene.words[0].startSeconds - timing.scenes[index].words[0].startSeconds - offset) < 0.0001);
    assert.ok(Math.abs(scene.subtitles.at(-1)!.endSeconds - timing.scenes[index].subtitles.at(-1)!.endSeconds - offset) < 0.0001);
  });
});

test('teacher mouth closes during all inserted silence and full-screen scenes', () => {
  for (const gap of timeline.insertedSilence) {
    const middle = (gap.startSeconds + gap.endSeconds) / 2;
    const scene = timeline.scenes.find((item) => middle >= item.startSeconds && middle < item.endSeconds) ?? timeline.scenes.at(-1)!;
    assert.equal(mouthOpenAt(middle, scene), false);
  }
  assert.equal(mouthOpenAt(timeline.scenes[0].words[0].startSeconds + 0.1, timeline.scenes[0]), true);
  assert.equal(timeline.scenes[3].templateId, 'full_screen_diagram_v1');
  assert.equal(timeline.scenes[4].templateId, 'full_screen_diagram_v1');
});

test('every approved scene selects a distinct appropriate authored graphic', () => {
  assert.deepEqual(timeline.scenes.map((scene) => graphicKindFor(scene.visuals.map((visual) => visual.description).join(' '), scene.templateId)),
    ['socket', 'conversion', 'turbine', 'generator', 'current', 'transmission', 'summary']);
  assert.throws(() => graphicKindFor('unrelated image', 'teacher_beside_diagram_v1'), /No authored diagram/);
});

test('invalid duration, missing scene and tampered silence fail closed', () => {
  const missing = structuredClone(timeline);
  missing.scenes.pop();
  assert.throws(() => validateDraftTimeline(missing), /seven source segments/);
  const speechOverlap = structuredClone(timeline);
  speechOverlap.insertedSilence[0].endSeconds = 3;
  assert.throws(() => validateDraftTimeline(speechOverlap), /overlaps speech/);
  assert.throws(() => buildDraftTimeline(plan, {...timing, actualAudioDurationSeconds: 60}, expectedHash), /duration changed/);
});

test('missing and corrupted saved source assets fail with recoverable errors', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'm0-phase5-assets-'));
  try {
    const asset = join(dir, 'audio.mp3');
    const original = Buffer.from('saved audio fixture');
    const sha256 = createHash('sha256').update(original).digest('hex');
    await assert.rejects(() => readPinnedAsset(asset, 'Original narration audio', sha256), /missing; restore the saved asset/);
    await writeFile(asset, original);
    assert.deepEqual(await readPinnedAsset(asset, 'Original narration audio', sha256), original);
    await writeFile(asset, 'corrupt audio fixture');
    await assert.rejects(() => readPinnedAsset(asset, 'Original narration audio', sha256), /checksum mismatch/);
    const alignment = join(dir, 'alignment.original.json');
    await assert.rejects(() => readRequiredJsonAsset(alignment, 'Original narration alignment'), /missing; restore the saved asset/);
    await writeFile(alignment, '{invalid');
    await assert.rejects(() => readRequiredJsonAsset(alignment, 'Original narration alignment'), /malformed JSON/);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
