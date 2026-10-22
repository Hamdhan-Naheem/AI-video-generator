import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {readPinnedAsset, readRequiredJsonAsset} from '../src/video/pinned-asset';

const root = resolve(process.cwd());
const approvedHash = '8bc30961064f8f724cff74d9ee752705865cc05e8c9b0632244892f88e5bef10';
const originalAudioHash = 'a4da480bf6924abfcccae3b2d9d707e8d80685237daa69671d79b3a548e8e815';
const ffprobe = join(root, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe');
const sha256 = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');

test('saved approved script and narration are pinned; missing and corrupted recovery inputs fail closed', async () => {
  const run = join(root, 'm0', 'runs', 'electricity', 'gemini-live-phase2b-retry1');
  const candidate = join(run, 'candidate.json');
  const snapshot = join(run, 'approved', `${approvedHash}.json`);
  const audio = join(run, 'narration', 'audio.mp3');
  const alignment = join(run, 'narration', 'alignment.original.json');
  assert.equal(sha256(candidate), approvedHash);
  assert.equal(sha256(snapshot), approvedHash);
  assert.equal(sha256(audio), originalAudioHash);
  assert.ok(await readRequiredJsonAsset(alignment, 'Original alignment'));

  const fixture = mkdtempSync(join(tmpdir(), 'm0-recovery-'));
  try {
    const saved = join(fixture, 'audio.mp3');
    await assert.rejects(() => readPinnedAsset(saved, 'Saved narration', originalAudioHash), /missing/);
    writeFileSync(saved, 'corrupted local copy');
    await assert.rejects(() => readPinnedAsset(saved, 'Saved narration', originalAudioHash), /checksum mismatch/);
    const malformed = join(fixture, 'alignment.json');
    writeFileSync(malformed, '{broken');
    await assert.rejects(() => readRequiredJsonAsset(malformed, 'Saved alignment'), /malformed JSON/);
  } finally {
    rmSync(fixture, {recursive: true, force: true});
  }
});

test('recorded mid-render interruption remains isolated and recovered MP4 passes media checks', {skip: !process.env.PHASE6A_REPORT}, () => {
  const reportPath = resolve(process.env.PHASE6A_REPORT!);
  const report = JSON.parse(readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '')) as {
    status: string;
    interrupted: {interruptedAfterProgress: boolean; lastRenderedFrame: number; outputBytes: number};
    recovered: {lastRenderedFrame: number};
    failedOutputPublished: boolean;
    protectedAssetsUnchanged: boolean;
    protectedHashes: Record<string, string>;
    recoveredOutput: string;
  };
  assert.equal(report.status, 'recovered_and_validated');
  assert.equal(report.interrupted.interruptedAfterProgress, true);
  assert.ok(report.interrupted.lastRenderedFrame >= 20 && report.interrupted.lastRenderedFrame < 240);
  assert.equal(report.interrupted.outputBytes, 0);
  assert.equal(report.failedOutputPublished, false);
  assert.equal(report.recovered.lastRenderedFrame, 239);
  assert.equal(report.protectedAssetsUnchanged, true);
  for (const [path, expected] of Object.entries(report.protectedHashes)) assert.equal(sha256(path), expected, path);
  assert.ok(existsSync(report.recoveredOutput));
  const probe = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate', '-of', 'json', report.recoveredOutput], {encoding: 'utf8'})) as {
    format: {duration: string}; streams: {codec_name: string; width?: number; height?: number; r_frame_rate?: string}[];
  };
  assert.ok(Math.abs(Number(probe.format.duration) - 8) < 0.08);
  assert.ok(probe.streams.some((stream) => stream.codec_name === 'h264' && stream.width === 540 && stream.height === 960 && stream.r_frame_rate === '30/1'));
  assert.ok(probe.streams.some((stream) => stream.codec_name === 'aac'));
});
