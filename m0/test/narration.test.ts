import assert from 'node:assert/strict';
import {readFile, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {test} from 'node:test';
import {createElevenLabsAdapter, measureAudioDuration} from '../src/narration/elevenlabs';
import {completeNarration, makeNarrationTiming, validateOriginalAlignment, type CharacterAlignment} from '../src/narration/timing';
import {decideCandidate, saveNewCandidate} from '../src/planning/review-store';
import {parsePlanningDraft} from '../src/planning/schema';

const root = resolve(process.cwd());
const realRun = join(root, 'm0/runs/electricity/gemini-live-phase2b-retry1');
const config = {apiKey: 'test-only', voiceId: 'testvoice123', modelId: 'eleven_flash_v2_5' as const, timeoutMs: 1000};

function alignmentFor(text: string): CharacterAlignment {
  const characters = Array.from(text);
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * 0.06),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * 0.06),
  };
}

test('pending review blocks TTS before fetch', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'narration-pending-'));
  try {
    await saveNewCandidate(dir, JSON.parse(await readFile(join(realRun, 'candidate.json'), 'utf8')), 'offline_fixture');
    let requests = 0;
    const adapter = createElevenLabsAdapter(config, async () => { requests++; throw new Error('unexpected request'); });
    await assert.rejects(adapter.synthesizeApproved(dir), /not approved/);
    assert.equal(requests, 0);
  } finally { await rm(dir, {recursive: true, force: true}); }
});

test('original alignment maps repeated words to ordered scenes and subtitles', async () => {
  const plan = parsePlanningDraft(JSON.parse(await readFile(join(realRun, 'candidate.json'), 'utf8')));
  const text = completeNarration(plan);
  const alignment = alignmentFor(text);
  const timing = makeNarrationTiming(plan, alignment, text.length * 0.06 + 0.5);
  assert.equal(timing.scenes.length, 7);
  assert.equal(timing.estimatedDurationSeconds, 75);
  assert.equal(timing.scenes[0].text, plan.storyboard.scenes[0].narration);
  assert.equal(timing.scenes.at(-1)?.sceneId, 'scene-07');
  assert.ok(timing.scenes[1].startSeconds > timing.scenes[0].endSeconds);
  assert.ok(timing.scenes.every((scene) => scene.words.length && scene.subtitles.length));
});

test('invalid or normalized-only alignment is rejected', () => {
  const valid = alignmentFor('Hi 👋, hi!');
  assert.equal(validateOriginalAlignment(valid, 'Hi 👋, hi!').characters.length, 9);
  assert.throws(() => validateOriginalAlignment(valid, 'Hi, hi!'), /does not match/);
  assert.throws(() => validateOriginalAlignment({...valid, character_end_times_seconds: []}, 'Hi 👋, hi!'), /lengths differ/);
  assert.throws(() => validateOriginalAlignment({...valid, character_start_times_seconds: valid.character_start_times_seconds.map((t, i) => i === 3 ? -1 : t)}, 'Hi 👋, hi!'));
  assert.throws(() => validateOriginalAlignment({...valid, character_start_times_seconds: valid.character_start_times_seconds.map((t, i) => i === 3 ? 0 : t)}, 'Hi 👋, hi!'), /out of order/);
  assert.throws(() => validateOriginalAlignment({...valid, character_end_times_seconds: valid.character_end_times_seconds.map((t, i) => i === 3 ? 0 : t)}, 'Hi 👋, hi!'), /negative character duration|out of order/);
  assert.throws(() => validateOriginalAlignment({...valid, characters: ['Hi', ...valid.characters.slice(1)]}, 'Hi 👋, hi!'), /one Unicode code point/);
});

test('offline alignment fixture has ordered word cues within its sample audio duration', async () => {
  const fixture = JSON.parse(await readFile(join(root, 'm0/fixtures/narration-alignment.sample.json'), 'utf8'));
  const words = fixture.sections.join(' ').split(/\s+/u);
  assert.equal(words.length, fixture.wordStartsSeconds.length);
  assert.equal(words.length, fixture.wordEndSeconds.length);
  for (let i = 0; i < words.length; i++) {
    assert.ok(fixture.wordStartsSeconds[i] < fixture.wordEndSeconds[i]);
    if (i) assert.ok(fixture.wordStartsSeconds[i] >= fixture.wordEndSeconds[i - 1]);
  }
  assert.ok(fixture.wordEndSeconds.at(-1) < fixture.audioDurationSeconds);
});

test('saved character-level sample validates and contains a silent separator', async () => {
  const fixture = JSON.parse(await readFile(join(root, 'm0/fixtures/character-alignment.sample.json'), 'utf8'));
  const alignment = validateOriginalAlignment(fixture.alignment, fixture.text);
  assert.equal(alignment.characters.length, Array.from(fixture.text).length);
  assert.equal(alignment.character_start_times_seconds[3], alignment.character_end_times_seconds[3]);
  assert.ok(alignment.character_end_times_seconds.at(-1)! < fixture.audioDurationSeconds);
});

test('approved snapshot allows exactly one mocked request and preserves original alignment', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'narration-test-'));
  try {
    const value = JSON.parse(await readFile(join(realRun, 'candidate.json'), 'utf8'));
    await saveNewCandidate(dir, value, 'offline_fixture');
    await decideCandidate(dir, 'approved');
    const text = completeNarration(parsePlanningDraft(value));
    let requests = 0;
    const adapter = createElevenLabsAdapter(config, async (_url, init) => {
      requests++;
      const body = JSON.parse(String(init?.body));
      assert.equal(body.text, text);
      assert.equal(body.model_id, 'eleven_flash_v2_5');
      assert.equal(body.language_code, 'en');
      return new Response(JSON.stringify({audio_base64: Buffer.from('sample audio').toString('base64'), alignment: alignmentFor(text), normalized_alignment: alignmentFor(text)}), {status: 200});
    });
    const result = await adapter.synthesizeApproved(dir);
    assert.equal(requests, 1);
    assert.equal(result.text, text);
    assert.equal(result.originalAlignment.characters.join(''), text);
  } finally { await rm(dir, {recursive: true, force: true}); }
});

test('HTTP error and missing timestamps fail without retry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'narration-test-'));
  try {
    await saveNewCandidate(dir, JSON.parse(await readFile(join(realRun, 'candidate.json'), 'utf8')), 'offline_fixture');
    await decideCandidate(dir, 'approved');
    let requests = 0;
    await assert.rejects(createElevenLabsAdapter(config, async () => { requests++; return new Response('{}', {status: 429}); }).synthesizeApproved(dir), /HTTP 429/);
    assert.equal(requests, 1);
    await assert.rejects(createElevenLabsAdapter(config, async () => new Response(JSON.stringify({audio_base64: 'YQ=='}))).synthesizeApproved(dir));
  } finally { await rm(dir, {recursive: true, force: true}); }
});

test('local audio probe measures WAV sample duration', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'narration-wav-'));
  try {
    const samples = 8000;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28); wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(samples * 2, 40);
    const path = join(dir, 'sample.wav');
    await writeFile(path, wav);
    assert.ok(Math.abs(await measureAudioDuration(path, root) - 1) < 0.01);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
