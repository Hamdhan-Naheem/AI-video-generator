import {makeTimedSections, type TimedScene, type TimedSpan} from '../narration/timing';
import {completeShowcaseScript, showcasePlanFor, type ShowcaseScript} from './script-candidates';
import {SHOWCASE_FPS, type ShowcasePlan} from './plans';

export type VoiceoverScene = {
  sceneId: string;
  startFrame: number;
  endFrame: number;
  speechStartSeconds: number;
  speechEndSeconds: number;
  words: TimedSpan[];
  subtitles: TimedSpan[];
};
export type ShowcaseVoiceoverTimeline = {
  version: 'm0.showcase.voiceover.v1';
  candidateSha256: string;
  audioStaticPath: string;
  originalAudioDurationSeconds: number;
  durationFrames: number;
  sourceCutsSeconds: number[];
  insertedSilenceSeconds: {start: number; end: number}[];
  scenes: VoiceoverScene[];
};

const INTRO_SECONDS = 0.6;
const BETWEEN_SECONDS = 0.4;
const OUTRO_SECONDS = 0.8;
const shifted = (span: TimedSpan, delta: number): TimedSpan => ({...span, startSeconds: span.startSeconds + delta, endSeconds: span.endSeconds + delta});

export function makeShowcaseTiming(candidate: ShowcaseScript, originalAlignment: unknown, actualAudioDurationSeconds: number): TimedScene[] {
  return makeTimedSections(candidate.scenes.map(({sceneId, text}) => ({sceneId, text})), originalAlignment, actualAudioDurationSeconds);
}

/** Build from measured speech only. The 12-second silent showcase plan is never treated as audio timing. */
export function buildShowcaseVoiceoverTimeline(candidate: ShowcaseScript, candidateSha256: string, alignment: unknown, actualAudioDurationSeconds: number, audioStaticPath: string): ShowcaseVoiceoverTimeline {
  if (!/^[a-f0-9]{64}$/.test(candidateSha256)) throw new Error('Approved showcase script hash is invalid');
  if (!/^[a-z0-9][a-z0-9_.-]*\.wav$/i.test(audioStaticPath)) throw new Error('Voice-over audio must use a local static WAV filename');
  const timing = makeShowcaseTiming(candidate, alignment, actualAudioDurationSeconds);
  const plan = showcasePlanFor(candidate.category);
  const cuts = [0];
  for (let i = 0; i < timing.length - 1; i++) {
    if (timing[i].endSeconds > timing[i + 1].startSeconds) throw new Error('Showcase narration scene timings overlap');
    cuts.push((timing[i].endSeconds + timing[i + 1].startSeconds) / 2);
  }
  cuts.push(actualAudioDurationSeconds);
  const silence: ShowcaseVoiceoverTimeline['insertedSilenceSeconds'] = [{start: 0, end: INTRO_SECONDS}];
  const scenes: VoiceoverScene[] = [];
  let offset = INTRO_SECONDS;
  for (let i = 0; i < timing.length; i++) {
    const source = timing[i];
    if (source.sceneId !== plan.scenes[i].id || source.text !== candidate.scenes[i].text) throw new Error(`Showcase scene narration mismatch at ${i + 1}`);
    const startSeconds = i === 0 ? 0 : cuts[i] + offset;
    const endSeconds = cuts[i + 1] + offset + (i < timing.length - 1 ? BETWEEN_SECONDS : OUTRO_SECONDS);
    scenes.push({sceneId: source.sceneId, startFrame: Math.round(startSeconds * SHOWCASE_FPS), endFrame: Math.round(endSeconds * SHOWCASE_FPS), speechStartSeconds: source.startSeconds + offset, speechEndSeconds: source.endSeconds + offset, words: source.words.map((word) => shifted(word, offset)), subtitles: source.subtitles.map((subtitle) => shifted(subtitle, offset))});
    if (i < timing.length - 1) {
      silence.push({start: cuts[i + 1] + offset, end: cuts[i + 1] + offset + BETWEEN_SECONDS});
      offset += BETWEEN_SECONDS;
    }
  }
  const total = actualAudioDurationSeconds + INTRO_SECONDS + (timing.length - 1) * BETWEEN_SECONDS + OUTRO_SECONDS;
  const durationFrames = Math.ceil(total * SHOWCASE_FPS);
  silence.push({start: total - OUTRO_SECONDS, end: durationFrames / SHOWCASE_FPS});
  scenes.at(-1)!.endFrame = durationFrames;
  const timeline: ShowcaseVoiceoverTimeline = {version: 'm0.showcase.voiceover.v1', candidateSha256, audioStaticPath, originalAudioDurationSeconds: actualAudioDurationSeconds, durationFrames, sourceCutsSeconds: cuts, insertedSilenceSeconds: silence, scenes};
  validateShowcaseVoiceoverTimeline(plan, candidate, timeline);
  return timeline;
}

export function validateShowcaseVoiceoverTimeline(plan: ShowcasePlan, candidate: ShowcaseScript | undefined, timeline: ShowcaseVoiceoverTimeline): void {
  if (!timeline || typeof timeline !== 'object' || !Array.isArray(timeline.scenes) || !Array.isArray(timeline.sourceCutsSeconds) || !Array.isArray(timeline.insertedSilenceSeconds)) throw new Error('Showcase voice-over timeline is missing or malformed');
  if ((candidate && plan.category !== candidate.category) || timeline.scenes.length !== plan.scenes.length || timeline.sourceCutsSeconds.length !== plan.scenes.length + 1) throw new Error('Showcase voice-over scene count/category is invalid');
  if (!/^[a-f0-9]{64}$/.test(timeline.candidateSha256) || !/^[a-z0-9][a-z0-9_.-]*\.wav$/i.test(timeline.audioStaticPath)) throw new Error('Showcase approval hash or local audio path is invalid');
  if (!Number.isSafeInteger(timeline.durationFrames) || !Number.isFinite(timeline.originalAudioDurationSeconds) || timeline.originalAudioDurationSeconds <= 0 || timeline.durationFrames <= plan.scenes.at(-1)!.startFrame + plan.scenes.at(-1)!.durationFrames) throw new Error('Narrated showcase duration is invalid');
  if (timeline.sourceCutsSeconds[0] !== 0 || Math.abs(timeline.sourceCutsSeconds.at(-1)! - timeline.originalAudioDurationSeconds) > 0.001) throw new Error('Saved narration source cuts are incomplete');
  if (timeline.sourceCutsSeconds.some((cut, i) => !Number.isFinite(cut) || (i > 0 && cut <= timeline.sourceCutsSeconds[i - 1]))) throw new Error('Showcase source cuts overlap or are out of order');
  for (let i = 0; i < timeline.scenes.length; i++) {
    const scene = timeline.scenes[i];
    if (!scene || !Array.isArray(scene.words) || !Array.isArray(scene.subtitles)) throw new Error(`Showcase scene ${i + 1} is missing timing data`);
    if (scene.words.some((word) => !word || typeof word.text !== 'string') || scene.subtitles.some((subtitle) => !subtitle || typeof subtitle.text !== 'string')) throw new Error(`Showcase scene ${i + 1} has malformed word or subtitle timing data`);
    if (!Number.isSafeInteger(scene.startFrame) || !Number.isSafeInteger(scene.endFrame) || scene.sceneId !== plan.scenes[i].id || scene.startFrame !== (i ? timeline.scenes[i - 1].endFrame : 0) || scene.endFrame <= scene.startFrame || scene.endFrame > timeline.durationFrames) throw new Error('Showcase voice-over scenes have wrong order or coverage');
    const wordText = scene.words.map(({text}) => text).join(' ');
    const subtitleText = scene.subtitles.map(({text}) => text).join(' ');
    if (!wordText || wordText !== subtitleText || (candidate && (wordText !== candidate.scenes[i].text || subtitleText !== candidate.scenes[i].text))) throw new Error('Showcase word/subtitle text differs from reviewed script');
    if (!Number.isFinite(scene.speechStartSeconds) || !Number.isFinite(scene.speechEndSeconds) || scene.speechStartSeconds < scene.startFrame / SHOWCASE_FPS - 1 / SHOWCASE_FPS || scene.speechEndSeconds > scene.endFrame / SHOWCASE_FPS + 0.001 || scene.speechEndSeconds <= scene.speechStartSeconds) throw new Error('Showcase speech timing escapes its scene');
    for (const [kind, spans] of [['word', scene.words], ['subtitle', scene.subtitles]] as const) {
      if (!spans.length) throw new Error(`Showcase ${kind} timing is missing`);
      for (let j = 0; j < spans.length; j++) {
        const span = spans[j];
        if (!Number.isFinite(span.startSeconds) || !Number.isFinite(span.endSeconds) || span.endSeconds <= span.startSeconds || span.startSeconds < scene.speechStartSeconds - 0.001 || span.endSeconds > scene.speechEndSeconds + 0.001 || (j && span.startSeconds < spans[j - 1].endSeconds - 0.001)) throw new Error(`Showcase ${kind} timing overlaps or escapes its scene`);
      }
    }
  }
  if (timeline.scenes.at(-1)!.endFrame !== timeline.durationFrames) throw new Error('Showcase voice-over does not cover the full duration');
  for (let i = 0; i < timeline.insertedSilenceSeconds.length; i++) {
    const gap = timeline.insertedSilenceSeconds[i];
    if (!Number.isFinite(gap.start) || !Number.isFinite(gap.end) || gap.start < 0 || gap.end > timeline.durationFrames / SHOWCASE_FPS + 0.001 || gap.end <= gap.start || (i && gap.start < timeline.insertedSilenceSeconds[i - 1].end - 0.001) || timeline.scenes.some((scene) => scene.words.some((word) => word.startSeconds < gap.end && word.endSeconds > gap.start))) throw new Error('Showcase inserted silence overlaps speech or composition bounds');
  }
  if (candidate && completeShowcaseScript(candidate).length === 0) throw new Error('Showcase narration is empty');
}

/** FFmpeg can derive a padded local WAV from the saved single-take audio, with no provider call. */
export function showcaseAudioFilter(timeline: ShowcaseVoiceoverTimeline): string {
  const parts: string[] = [];
  const inputs: string[] = [];
  for (let i = 0; i < timeline.scenes.length; i++) {
    const gap = timeline.insertedSilenceSeconds[i];
    parts.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${(gap.end - gap.start).toFixed(6)}[p${i}]`);
    inputs.push(`[p${i}]`);
    parts.push(`[${i}:a]atrim=start=${timeline.sourceCutsSeconds[i].toFixed(6)}:end=${timeline.sourceCutsSeconds[i + 1].toFixed(6)},asetpts=PTS-STARTPTS,aformat=sample_rates=44100:channel_layouts=stereo[s${i}]`);
    inputs.push(`[s${i}]`);
  }
  const last = timeline.insertedSilenceSeconds.at(-1)!;
  parts.push(`anullsrc=r=44100:cl=stereo,atrim=duration=${(last.end - last.start).toFixed(6)}[p${timeline.scenes.length}]`);
  inputs.push(`[p${timeline.scenes.length}]`);
  parts.push(`${inputs.join('')}concat=n=${inputs.length}:v=0:a=1,apad,atrim=duration=${(timeline.durationFrames / SHOWCASE_FPS).toFixed(6)}[out]`);
  return parts.join(';');
}
