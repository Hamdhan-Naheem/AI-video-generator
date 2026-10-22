import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {graphicKindFor} from '../src/video/EducationalGraphics';
import {framesForDuration, validateFrameCoverage} from '../src/video/duration-boundary';
import {mouthOpenAt, validateDraftTimeline, type DraftTimeline} from '../src/video/timeline';
import {validateRenderSettings} from '../src/video/render-settings';
import {cueFrame} from '../src/showcase/ShowcaseVideo';
import {productShowcasePlan, softwareShowcasePlan} from '../src/showcase/plans';
import {showcaseScriptSeeds} from '../src/showcase/script-candidates';
import {validateShowcaseVoiceoverTimeline, type ShowcaseVoiceoverTimeline} from '../src/showcase/voiceover-timeline';

const root = resolve();
const electricityRoot = join(root, 'm0/runs/electricity/gemini-live-phase2b-retry1');
const draft = JSON.parse(readFileSync(join(electricityRoot, 'draft-4a/timeline.json'), 'utf8')) as DraftTimeline;
const luma = JSON.parse(readFileSync(join(root, 'm0/runs/showcase-phase5c1/luma-mini-v1/narration/timeline.json'), 'utf8')) as ShowcaseVoiceoverTimeline;
const northstar = JSON.parse(readFileSync(join(root, 'm0/runs/showcase-phase5c1/northstar-v2/narration/timeline.json'), 'utf8')) as ShowcaseVoiceoverTimeline;
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
const frame = (seconds: number) => Math.ceil(seconds * 30 - 1e-9);

test('approved three-category files and timelines remain pinned', () => {
  assert.equal(sha256(join(electricityRoot, 'candidate.json')), draft.approvedSha256);
  assert.equal(sha256(join(electricityRoot, 'final-4b/electricity-final-1080x1920.mp4')), '4167fe0878c3572a78061ac28e69f769058bb237fd2528acf71cbe780486f4d2');
  assert.equal(sha256(join(root, 'm0/runs/showcase-phase5c1/luma-mini-v1/narration/draft-narrated.mp4')), '91d6942bf2996d76cbfc6d0184c0cef00f66a1498578fa7f2b1830763dbb5bd3');
  assert.equal(sha256(join(root, 'm0/runs/showcase-phase5c1/northstar-v2/narration/draft-narrated.mp4')), '09e5a9d71e9c0e695ab9dc64ad9c0437c2ea948affc6441b2a98e50704d90cb9');
  validateDraftTimeline(draft);
  validateShowcaseVoiceoverTimeline(productShowcasePlan, showcaseScriptSeeds['luma-mini-v1'], luma);
  validateShowcaseVoiceoverTimeline(softwareShowcasePlan, showcaseScriptSeeds['northstar-v2'], northstar);
  assert.equal(luma.candidateSha256, 'c8c048405edf5190107594dd93193719c8ffc00a60efdff4939e0f21846f8dba');
  assert.equal(northstar.candidateSha256, '1e7fb3312bec9be6b1da5c8703588b017ecbdba4b329c86f79cc65fc93695418');
});

test('electricity uses every narration segment once with contiguous scenes, subtitles and relevant diagrams', () => {
  assert.equal(draft.scenes.length, 7);
  assert.equal(draft.scenes.flatMap((scene) => scene.words).length, 150);
  assert.equal(draft.scenes.flatMap((scene) => scene.subtitles).length, 28);
  assert.equal(draft.sourceCutsSeconds.length, 8);
  assert.equal(draft.sourceCutsSeconds[0], 0);
  assert.equal(draft.sourceCutsSeconds.at(-1), draft.originalAudioDurationSeconds);
  validateFrameCoverage(2250, draft.scenes.map((scene) => ({startFrame: Math.round(scene.startSeconds * 30), endFrame: Math.round(scene.endSeconds * 30)})));
  assert.ok(draft.scenes[0].speechStartSeconds >= draft.insertedSilence[0].endSeconds);
  assert.ok(draft.scenes.at(-1)!.speechEndSeconds <= draft.insertedSilence.at(-1)!.startSeconds);
  const expected = ['socket', 'conversion', 'turbine', 'generator', 'current', 'transmission', 'summary'];
  assert.deepEqual(draft.scenes.map((scene) => graphicKindFor(scene.visuals.map((visual) => visual.description).join(' '), scene.templateId)), expected);
  assert.ok(draft.scenes[0].animationActions.includes('teacher_wave'));
  assert.ok(draft.scenes[2].animationActions.includes('turbine_spin'));
  assert.ok(draft.scenes[3].animationActions.includes('generator_pulse'));
  assert.ok(draft.scenes[4].animationActions.includes('electricity_flow'));
  assert.ok(draft.scenes[5].animationActions.includes('electricity_flow'));
  assert.ok(draft.scenes[6].animationActions.includes('teacher_wave'));
  for (const scene of draft.scenes) {
    for (const subtitle of scene.subtitles) {
      assert.ok(frame(subtitle.startSeconds) >= Math.floor(scene.startSeconds * 30));
      assert.ok(frame(subtitle.endSeconds) <= 2250);
      assert.ok(scene.words.some((word) => word.startSeconds >= subtitle.startSeconds - 0.001 && word.endSeconds <= subtitle.endSeconds + 0.001));
    }
  }
});

test('twelve teacher speech onsets respond within 250 ms and at least five pauses close the mouth', () => {
  const teacherScenes = draft.scenes.filter((scene) => scene.animationActions.includes('teacher_mouth_demo'));
  const samples = [
    ...teacherScenes.flatMap((scene) => scene.words.slice(0, 2).map((word) => ({scene, word}))),
    ...[teacherScenes[0], teacherScenes.at(-1)!].map((scene) => ({scene, word: scene.words[2]})),
  ];
  assert.equal(samples.length, 12);
  const deviations: number[] = [];
  for (const {scene, word} of samples) {
    let firstOpen: number | undefined;
    for (let f = frame(word.startSeconds); f <= frame(word.startSeconds + 0.25); f++) {
      if (mouthOpenAt(f / 30, scene)) { firstOpen = f / 30; break; }
    }
    assert.notEqual(firstOpen, undefined, `${scene.id}: ${word.text}`);
    const deviation = firstOpen! - word.startSeconds;
    deviations.push(deviation);
    assert.ok(deviation >= -0.001 && deviation <= 0.25, `${scene.id}: ${word.text} ${deviation}`);
  }
  const pauses = draft.insertedSilence.filter((gap) => gap.endSeconds - gap.startSeconds >= 0.3);
  assert.ok(pauses.length >= 5);
  for (const gap of pauses) {
    for (let f = frame(gap.startSeconds); f < Math.floor(gap.endSeconds * 30); f++) {
      const time = f / 30;
      const scene = draft.scenes.find((item) => time >= item.startSeconds && time < item.endSeconds) ?? draft.scenes.at(-1)!;
      assert.equal(mouthOpenAt(time, scene), false, `mouth during silence at ${time}`);
    }
  }
  console.log(`Measured cue-to-approved-word onset deviations: max ${(Math.max(...deviations) * 1000).toFixed(1)} ms across ${deviations.length} sampled words; ${pauses.length} inserted pauses checked.`);
});

test('seven scene visual starts and subtitle anchors follow the saved narration clock', () => {
  const leads = draft.scenes.map((scene) => scene.speechStartSeconds - scene.startSeconds);
  assert.ok(Math.abs(leads[0] - 1.3) < 0.001, 'intentional title hold');
  assert.ok(leads.slice(1).every((lead) => lead >= 0 && lead <= 0.4), 'diagram/teacher scene precedes its speech by at most 400 ms');
  for (const scene of draft.scenes) {
    assert.ok(Math.abs(scene.subtitles[0].startSeconds - scene.words[0].startSeconds) <= 0.001);
    assert.ok(Math.abs(scene.subtitles.at(-1)!.endSeconds - scene.words.at(-1)!.endSeconds) <= 0.001);
  }
  console.log(`Seven scene-to-speech leads (ms): ${leads.map((lead) => Math.round(lead * 1000)).join(', ')}; first/last subtitle anchors equal word timestamps.`);
});

test('LUMA product events and NORTHSTAR UI events remain within their narration scenes', () => {
  for (const [timeline, plan, candidate] of [
    [luma, productShowcasePlan, showcaseScriptSeeds['luma-mini-v1']],
    [northstar, softwareShowcasePlan, showcaseScriptSeeds['northstar-v2']],
  ] as const) {
    validateShowcaseVoiceoverTimeline(plan, candidate, timeline);
    validateFrameCoverage(timeline.durationFrames, timeline.scenes);
    assert.equal(timeline.scenes.map((scene) => scene.sceneId).join(','), plan.scenes.map((scene) => scene.id).join(','));
    assert.ok(timeline.scenes[0].speechStartSeconds >= timeline.insertedSilenceSeconds[0].end);
    assert.ok(timeline.scenes.at(-1)!.speechEndSeconds <= timeline.insertedSilenceSeconds.at(-1)!.start);
    for (const scene of timeline.scenes) for (const cue of scene.subtitles) assert.ok(cue.startSeconds >= scene.startFrame / 30 && cue.endSeconds <= scene.endFrame / 30);
  }
  const features = luma.scenes[1];
  for (const word of ['tap', 'recharge', 'comfortable']) {
    const localFrame = cueFrame(features, word, -1);
    assert.ok(localFrame >= 0 && localFrame < features.endFrame - features.startFrame, word);
    const spoken = features.words.find((item) => item.text.toLowerCase().replace(/[^a-z]/g, '') === word)!;
    assert.ok(Math.abs((features.startFrame + localFrame) / 30 - spoken.startSeconds) <= 1 / 30 + 0.001);
  }
  assert.equal(luma.scenes[0].sceneId, 'product-hero');
  assert.equal(luma.scenes[2].sceneId, 'product-cta');
  assert.ok(luma.scenes[2].speechStartSeconds < (luma.scenes[2].startFrame + 30) / 30);
  const workflow = northstar.scenes[1];
  const move = cueFrame(workflow, 'move', -1);
  assert.ok(move >= 0 && move < workflow.endFrame - workflow.startFrame);
  const insights = northstar.scenes[2];
  const weekly = cueFrame(insights, 'weekly', -1);
  assert.ok(weekly >= 0 && weekly < insights.endFrame - insights.startFrame);
  assert.equal(northstar.scenes[0].sceneId, 'software-dashboard');
});

test('short, medium, 75-second, synthetic 62-second and 90-second frame boundaries are exact', () => {
  assert.equal(framesForDuration(luma.durationFrames / 30), 518);
  assert.equal(framesForDuration(northstar.durationFrames / 30), 848);
  assert.equal(framesForDuration(draft.durationSeconds, {minSeconds: 62, maxSeconds: 90}), 2250);
  for (const [seconds, total] of [[62, 1860], [90, 2700]] as const) {
    assert.equal(framesForDuration(seconds, {minSeconds: 62, maxSeconds: 90}), total);
    const lengths = [0.14, 0.13, 0.16, 0.14, 0.14, 0.15, 0.14];
    const starts = [0, ...lengths.slice(0, -1).map((_, i) => Math.round(lengths.slice(0, i + 1).reduce((a, b) => a + b, 0) * total))];
    const scenes = starts.map((startFrame, i) => ({startFrame, endFrame: i === starts.length - 1 ? total : starts[i + 1]}));
    validateFrameCoverage(total, scenes);
    for (const scene of scenes) {
      const subtitleStart = scene.startFrame + 2;
      const subtitleEnd = scene.endFrame - 2;
      const animationFrame = scene.startFrame + 1;
      assert.ok(subtitleStart < subtitleEnd && subtitleEnd < total);
      assert.ok(animationFrame >= scene.startFrame && animationFrame < scene.endFrame);
    }
  }
  assert.equal(framesForDuration(62 + 1 / 60, {minSeconds: 62, maxSeconds: 90}), 1861);
  assert.equal(framesForDuration(89.999, {minSeconds: 62, maxSeconds: 90}), 2700);
  assert.throws(() => framesForDuration(61.999, {minSeconds: 62, maxSeconds: 90}), /outside supported bounds/);
  assert.throws(() => framesForDuration(90.0001, {minSeconds: 62, maxSeconds: 90}), /outside supported bounds/);
  assert.throws(() => framesForDuration(Number.NaN), /positive finite/);
  assert.throws(() => validateFrameCoverage(10, []), /empty/);
  assert.throws(() => validateFrameCoverage(10, [{startFrame: 0, endFrame: 6}, {startFrame: 5, endFrame: 10}]), /overlap/);
  assert.throws(() => validateFrameCoverage(10, [{startFrame: 0, endFrame: 9}]), /cover/);
});

test('malformed timings, subtitle settings and missing narration fail clearly', () => {
  const missing = structuredClone(draft) as DraftTimeline;
  (missing.scenes[0] as unknown as {words?: unknown}).words = undefined;
  assert.throws(() => validateDraftTimeline(missing), /missing timing data/);
  const nullWord = structuredClone(draft);
  (nullWord.scenes[0].words as unknown[])[0] = null;
  assert.throws(() => validateDraftTimeline(nullWord), /malformed word or subtitle timing data/);
  const corruptSubtitle = structuredClone(draft);
  corruptSubtitle.scenes[0].subtitles[0].startSeconds = Number.NaN;
  assert.throws(() => validateDraftTimeline(corruptSubtitle), /subtitle timing/);
  const duplicate = structuredClone(draft);
  duplicate.scenes[1].startSeconds = duplicate.scenes[0].startSeconds;
  assert.throws(() => validateDraftTimeline(duplicate), /gap or overlap/);
  const outside = structuredClone(draft);
  outside.scenes.at(-1)!.endSeconds = 76;
  assert.throws(() => validateDraftTimeline(outside), /duration or scene coverage/);
  const broken = structuredClone(luma);
  broken.scenes[0].subtitles[0].endSeconds = broken.scenes[0].endFrame / 30 + 1;
  assert.throws(() => validateShowcaseVoiceoverTimeline(productShowcasePlan, showcaseScriptSeeds['luma-mini-v1'], broken), /subtitle timing/);
  const nullCaption = structuredClone(luma);
  (nullCaption.scenes[0].subtitles as unknown[])[0] = null;
  assert.throws(() => validateShowcaseVoiceoverTimeline(productShowcasePlan, showcaseScriptSeeds['luma-mini-v1'], nullCaption), /malformed word or subtitle timing data/);
  assert.throws(() => validateShowcaseVoiceoverTimeline(productShowcasePlan, undefined, undefined as unknown as ShowcaseVoiceoverTimeline), /missing or malformed/);
  assert.throws(() => validateRenderSettings({showSubtitles: 'false'}, true), /boolean/);
  assert.throws(() => validateRenderSettings({includeAudio: true}, false), /Narration timing is required/);
  assert.doesNotThrow(() => validateRenderSettings({showSubtitles: false, includeAudio: true}, true));
});
