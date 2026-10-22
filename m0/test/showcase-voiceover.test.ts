import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {createElevenLabsAdapter, measureAudioDuration, saveShowcaseNarrationCheckpoint} from '../src/narration/elevenlabs';
import {completeShowcaseScript, showcasePlanFor, showcaseScriptSeeds} from '../src/showcase/script-candidates';
import {approveShowcaseCandidate, getApprovedShowcaseScript, seedShowcaseCandidate, showShowcaseCandidate} from '../src/showcase/script-store';
import {buildShowcaseVoiceoverTimeline, showcaseAudioFilter, validateShowcaseVoiceoverTimeline} from '../src/showcase/voiceover-timeline';

const root = resolve();
const ffmpeg = join(root, 'node_modules', '@remotion', `compositor-${process.platform === 'win32' ? 'win32-x64-msvc' : process.platform === 'darwin' ? 'darwin-x64' : 'linux-x64-gnu'}`, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
const fakeAlignment = (script: string) => {
  const chars = Array.from(script);
  return {characters: chars, character_start_times_seconds: chars.map((_, index) => index * 0.07), character_end_times_seconds: chars.map((_, index) => (index + 1) * 0.07)};
};
const run = (args: string[]) => new Promise<void>((accept, reject) => {
  const child = spawn(ffmpeg, args, {windowsHide: true, timeout: 30000});
  let diagnostic = '';
  child.stderr.on('data', (chunk: Buffer) => { diagnostic = (diagnostic + chunk.toString()).slice(-1500); });
  child.on('error', reject);
  child.on('close', (code) => code === 0 ? accept() : reject(new Error(`Offline FFmpeg failed: ${diagnostic}`)));
});

test('versioned scripts start pending, need exact hash approval, and edits revoke it', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'showcase-approval-'));
  try {
    for (const id of ['luma-mini-v1', 'northstar-v1', 'northstar-v2'] as const) {
      const dir = join(temp, id);
      const {hash} = await seedShowcaseCandidate(dir, id);
      assert.match(await showShowcaseCandidate(dir), /Status: pending_review/);
      await assert.rejects(() => seedShowcaseCandidate(dir, id), /already exists/);
      await assert.rejects(() => getApprovedShowcaseScript(dir), /not approved/);
      await assert.rejects(() => approveShowcaseCandidate(dir, '0'.repeat(64)), /exact SHA-256/);
      await approveShowcaseCandidate(dir, hash);
      assert.equal((await getApprovedShowcaseScript(dir)).sha256, hash);
      const path = join(dir, 'candidate.json');
      const edited = JSON.parse(await readFile(path, 'utf8'));
      edited.scenes[0].text += ' Extra.';
      await writeFile(path, `${JSON.stringify(edited, null, 2)}\n`);
      await assert.rejects(() => getApprovedShowcaseScript(dir), /not approved/);
      assert.match(await showShowcaseCandidate(dir), /CHANGED SINCE REVIEW/);
    }
  } finally { await rm(temp, {recursive: true, force: true}); }
});

test('NORTHSTAR v2 preserves approved-for-review wording across the three software scenes', () => {
  const candidate = showcaseScriptSeeds['northstar-v2'];
  assert.equal(completeShowcaseScript(candidate), 'Meet NORTHSTAR, a simple workspace that keeps every project on track. See upcoming tasks, work in progress, and completed work together on one clear dashboard. Move a task from To Do to In Progress, and watch the board update. Progress cards and a weekly chart help your team understand how work is moving forward. With NORTHSTAR, everyone knows what to focus on next.');
  assert.deepEqual(candidate.scenes.map((scene) => scene.sceneId), showcasePlanFor('project_explainer').scenes.map((scene) => scene.id));
});

test('synthetic alignment expands both scene plans and retains word/subtitle text without an avatar', () => {
  for (const candidate of Object.values(showcaseScriptSeeds)) {
    const script = completeShowcaseScript(candidate);
    const seconds = Array.from(script).length * 0.07;
    const plan = showcasePlanFor(candidate.category);
    const timeline = buildShowcaseVoiceoverTimeline(candidate, 'a'.repeat(64), fakeAlignment(script), seconds, 'showcase-voiceover.wav');
    assert.ok(timeline.durationFrames > 360);
    assert.deepEqual(timeline.scenes.map((scene) => scene.sceneId), plan.scenes.map((scene) => scene.id));
    assert.equal(timeline.scenes[0].startFrame, 0);
    assert.equal(timeline.scenes.at(-1)!.endFrame, timeline.durationFrames);
    assert.equal(timeline.scenes.flatMap((scene) => scene.words).map((word) => word.text).join(' '), script);
    assert.equal(timeline.scenes.flatMap((scene) => scene.subtitles).map((cue) => cue.text).join(' '), script);
    assert.equal(timeline.sourceCutsSeconds.length, 4);
    assert.equal(timeline.insertedSilenceSeconds.length, 4);
    assert.doesNotThrow(() => validateShowcaseVoiceoverTimeline(plan, candidate, timeline));
    const invalid = structuredClone(timeline);
    invalid.scenes[1].sceneId = 'wrong-scene';
    assert.throws(() => validateShowcaseVoiceoverTimeline(plan, candidate, invalid), /wrong order/);
    assert.throws(() => buildShowcaseVoiceoverTimeline(candidate, 'a'.repeat(64), undefined, seconds, 'showcase-voiceover.wav'));
    assert.throws(() => buildShowcaseVoiceoverTimeline(candidate, 'a'.repeat(64), fakeAlignment(script), seconds, 'https://external.example/audio.wav'), /local static WAV/);
  }
});

test('saved local audio can be padded and reused without synthesis', async () => {
  const candidate = showcaseScriptSeeds['luma-mini-v1'];
  const script = completeShowcaseScript(candidate);
  const sourceSeconds = Array.from(script).length * 0.07;
  const timeline = buildShowcaseVoiceoverTimeline(candidate, 'b'.repeat(64), fakeAlignment(script), sourceSeconds, 'showcase-voiceover.wav');
  const temp = await mkdtemp(join(tmpdir(), 'showcase-audio-'));
  try {
    const source = join(temp, 'saved-source.wav');
    const derived = join(temp, 'derived.wav');
    await run(['-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100', '-t', sourceSeconds.toFixed(6), '-ac', '2', source]);
    await run(['-nostdin', '-hide_banner', '-loglevel', 'error', ...Array.from({length: 3}, () => ['-i', source]).flat(), '-filter_complex', showcaseAudioFilter(timeline), '-map', '[out]', '-c:a', 'pcm_s16le', derived]);
    assert.ok(Math.abs((await measureAudioDuration(derived, root)) - timeline.durationFrames / 30) < 0.05);
    assert.ok(Math.abs((await measureAudioDuration(source, root)) - sourceSeconds) < 0.05);
    const runDir = join(temp, 'approved-run');
    const {hash} = await seedShowcaseCandidate(runDir, candidate.id);
    await approveShowcaseCandidate(runDir, hash);
    const sourceBytes = await readFile(source);
    const checkpoint = await saveShowcaseNarrationCheckpoint(runDir, root, {audio: sourceBytes, originalAlignment: fakeAlignment(script), normalizedAlignment: null, text: script});
    assert.equal(checkpoint.candidateSha256, hash);
    assert.ok(Math.abs(checkpoint.originalAudioDurationSeconds - sourceSeconds) < 0.05);
    assert.ok((await readFile(join(runDir, 'narration', 'audio.mp3'))).length > 0);
    await assert.rejects(() => saveShowcaseNarrationCheckpoint(runDir, root, {audio: sourceBytes, originalAlignment: fakeAlignment(script), normalizedAlignment: null, text: script}), /EEXIST/);
  } finally { await rm(temp, {recursive: true, force: true}); }
});

test('shared speech adapter blocks pending showcase scripts before transport and uses one mocked request after approval', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'showcase-adapter-'));
  try {
    const candidate = showcaseScriptSeeds['luma-mini-v1'];
    const {hash} = await seedShowcaseCandidate(temp, candidate.id);
    const script = completeShowcaseScript(candidate);
    let requests = 0;
    const fakeFetch: typeof fetch = async () => {
      requests++;
      return new Response(JSON.stringify({audio_base64: Buffer.from('offline-audio-fixture').toString('base64'), alignment: fakeAlignment(script)}), {status: 200});
    };
    const adapter = createElevenLabsAdapter({apiKey: 'offline-test-only', voiceId: 'hpp4J3VqNfWAUOO0d1Us', modelId: 'eleven_flash_v2_5', timeoutMs: 5000}, fakeFetch);
    await assert.rejects(() => adapter.synthesizeApprovedShowcase(temp), /not approved/);
    assert.equal(requests, 0);
    await approveShowcaseCandidate(temp, hash);
    const result = await adapter.synthesizeApprovedShowcase(temp);
    assert.equal(result.text, script);
    assert.equal(requests, 1);
  } finally { await rm(temp, {recursive: true, force: true}); }
});
