import type {PlanningDraft} from '../planning/schema';
import type {NarrationTiming, TimedSpan} from '../narration/timing';
import {completeNarration} from '../narration/timing';

export const DRAFT_FPS = 30;
export const DRAFT_DURATION_SECONDS = 75;
export const DRAFT_AUDIO_STATIC_PATH = 'm0-phase4a-audio.wav';
export const DRAFT_PADDING = {
  introduction: 1.3,
  betweenScenes: [0.55, 0.65, 1.1, 1.1, 0.9, 0.6],
} as const;

export type DraftScene = PlanningDraft['storyboard']['scenes'][number] & {
  startSeconds: number;
  endSeconds: number;
  speechStartSeconds: number;
  speechEndSeconds: number;
  words: TimedSpan[];
  subtitles: TimedSpan[];
};
export type SilentInterval = {startSeconds: number; endSeconds: number; reason: string};
export type DraftTimeline = {
  version: 'm0.draft.v1';
  approvedSha256: string;
  originalAudioDurationSeconds: number;
  durationSeconds: number;
  fps: number;
  audioStaticPath: string;
  sourceCutsSeconds: number[];
  insertedSilence: SilentInterval[];
  scenes: DraftScene[];
};

const shifted = (span: TimedSpan, seconds: number): TimedSpan => ({
  text: span.text,
  startSeconds: span.startSeconds + seconds,
  endSeconds: span.endSeconds + seconds,
});

export function buildDraftTimeline(plan: PlanningDraft, timing: NarrationTiming, approvedSha256: string): DraftTimeline {
  if (plan.storyboard.scenes.length !== 7 || timing.scenes.length !== 7 || DRAFT_PADDING.betweenScenes.length !== 6) {
    throw new Error('Phase 4A requires the approved seven-scene narration');
  }
  if (completeNarration(plan).trim().split(/\s+/u).length !== 150) throw new Error('Approved narration word count changed');
  if (Math.abs(timing.actualAudioDurationSeconds - 66.716735) > 0.02) throw new Error('Original audio duration changed');
  if (!/^[a-f0-9]{64}$/.test(approvedSha256)) throw new Error('Approved hash is invalid');
  const cuts = [0];
  for (let i = 0; i < 6; i++) {
    const current = timing.scenes[i];
    const next = timing.scenes[i + 1];
    if (current.sceneId !== plan.storyboard.scenes[i].id || next.sceneId !== plan.storyboard.scenes[i + 1].id || current.endSeconds >= next.startSeconds) {
      throw new Error(`Scene timing/order mismatch at ${i + 1}`);
    }
    cuts.push((current.endSeconds + next.startSeconds) / 2);
  }
  cuts.push(timing.actualAudioDurationSeconds);
  const outro = DRAFT_DURATION_SECONDS - timing.actualAudioDurationSeconds - DRAFT_PADDING.introduction - DRAFT_PADDING.betweenScenes.reduce((a, b) => a + b, 0);
  if (outro < 0.5 || outro > 3) throw new Error('Final visual hold is outside the supported range');
  const insertedSilence: SilentInterval[] = [{startSeconds: 0, endSeconds: DRAFT_PADDING.introduction, reason: 'opening title reveal'}];
  const scenes: DraftScene[] = [];
  let offset = DRAFT_PADDING.introduction;
  for (let i = 0; i < 7; i++) {
    const source = plan.storyboard.scenes[i];
    const measured = timing.scenes[i];
    if (source.id !== measured.sceneId || source.narration !== measured.text) throw new Error(`Narration/scene mismatch in ${source.id}`);
    if (measured.startSeconds < cuts[i] - 0.002 || measured.endSeconds > cuts[i + 1] + 0.002) throw new Error(`Source cut crosses speech in ${source.id}`);
    const scene: DraftScene = {
      ...source,
      startSeconds: i === 0 ? 0 : cuts[i] + offset,
      endSeconds: cuts[i + 1] + offset + (i < 6 ? DRAFT_PADDING.betweenScenes[i] : outro),
      speechStartSeconds: measured.startSeconds + offset,
      speechEndSeconds: measured.endSeconds + offset,
      words: measured.words.map((word) => shifted(word, offset)),
      subtitles: measured.subtitles.map((subtitle) => shifted(subtitle, offset)),
    };
    scenes.push(scene);
    if (i < 6) {
      insertedSilence.push({startSeconds: cuts[i + 1] + offset, endSeconds: cuts[i + 1] + offset + DRAFT_PADDING.betweenScenes[i], reason: `${source.id} diagram/scene hold`});
      offset += DRAFT_PADDING.betweenScenes[i];
    }
  }
  insertedSilence.push({startSeconds: DRAFT_DURATION_SECONDS - outro, endSeconds: DRAFT_DURATION_SECONDS, reason: 'closing visual hold'});
  const timeline: DraftTimeline = {
    version: 'm0.draft.v1', approvedSha256, originalAudioDurationSeconds: timing.actualAudioDurationSeconds,
    durationSeconds: DRAFT_DURATION_SECONDS, fps: DRAFT_FPS, audioStaticPath: DRAFT_AUDIO_STATIC_PATH,
    sourceCutsSeconds: cuts, insertedSilence, scenes,
  };
  validateDraftTimeline(timeline);
  return timeline;
}

export function mouthOpenAt(timeSeconds: number, scene: DraftScene): boolean {
  if (!scene.animationActions.includes('teacher_mouth_demo')) return false;
  const word = scene.words.find(({startSeconds, endSeconds}) => timeSeconds >= startSeconds && timeSeconds < endSeconds);
  if (!word) return false;
  return Math.floor((timeSeconds - word.startSeconds) * 10) % 3 !== 2;
}

export function validateDraftTimeline(timeline: DraftTimeline): void {
  if (!timeline || typeof timeline !== 'object' || !Array.isArray(timeline.scenes) || !Array.isArray(timeline.sourceCutsSeconds) || !Array.isArray(timeline.insertedSilence)) throw new Error('Draft timeline is missing or malformed');
  if (timeline.scenes.length !== 7 || timeline.sourceCutsSeconds.length !== 8) throw new Error('Draft timeline must contain seven source segments');
  if (!Number.isFinite(timeline.durationSeconds) || !Number.isFinite(timeline.originalAudioDurationSeconds) || timeline.fps !== 30 || Math.abs(timeline.durationSeconds - 75) > 0.01 || Math.abs(timeline.scenes[0].startSeconds) > 0.001 || Math.abs(timeline.scenes.at(-1)!.endSeconds - timeline.durationSeconds) > 0.001) throw new Error('Draft duration or scene coverage invalid');
  if (Math.abs(timeline.sourceCutsSeconds[0]) > 0.001 || Math.abs(timeline.sourceCutsSeconds.at(-1)! - timeline.originalAudioDurationSeconds) > 0.001) throw new Error('Source cuts omit original audio');
  if (timeline.sourceCutsSeconds.some((cut, i) => !Number.isFinite(cut) || (i > 0 && cut <= timeline.sourceCutsSeconds[i - 1]))) throw new Error('Source cuts are not ordered');
  for (let i = 0; i < 7; i++) {
    const scene = timeline.scenes[i];
    if (!scene || !Array.isArray(scene.words) || !Array.isArray(scene.subtitles)) throw new Error(`Draft scene ${i + 1} is missing timing data`);
    if (scene.words.some((word) => !word || typeof word.text !== 'string') || scene.subtitles.some((subtitle) => !subtitle || typeof subtitle.text !== 'string')) throw new Error(`Draft scene ${i + 1} has malformed word or subtitle timing data`);
    if ([scene.startSeconds, scene.endSeconds, scene.speechStartSeconds, scene.speechEndSeconds].some((value) => !Number.isFinite(value)) || scene.id !== `scene-${String(i + 1).padStart(2, '0')}` || scene.startSeconds < -0.001 || scene.endSeconds <= scene.startSeconds || scene.endSeconds > timeline.durationSeconds + 0.001 || scene.startSeconds > scene.speechStartSeconds || scene.speechEndSeconds > scene.endSeconds) throw new Error(`Invalid timing in ${scene.id}`);
    if (i && Math.abs(scene.startSeconds - timeline.scenes[i - 1].endSeconds) > 0.001) throw new Error('Draft scenes have a gap or overlap');
    if (scene.words.map((word) => word.text).join(' ') !== scene.narration) throw new Error(`Word text mismatch in ${scene.id}`);
    if (scene.subtitles.map((subtitle) => subtitle.text).join(' ') !== scene.narration) throw new Error(`Subtitle text mismatch in ${scene.id}`);
    for (const [kind, spans] of [['word', scene.words], ['subtitle', scene.subtitles]] as const) {
      if (!spans.length) throw new Error(`${kind} timing is missing in ${scene.id}`);
      for (let j = 0; j < spans.length; j++) {
        const span = spans[j];
        if (!Number.isFinite(span.startSeconds) || !Number.isFinite(span.endSeconds) || span.endSeconds <= span.startSeconds || span.startSeconds < scene.speechStartSeconds - 0.001 || span.endSeconds > scene.speechEndSeconds + 0.001 || (j && span.startSeconds < spans[j - 1].endSeconds - 0.001)) throw new Error(`Invalid or overlapping ${kind} timing in ${scene.id}`);
      }
    }
  }
  for (let i = 0; i < timeline.insertedSilence.length; i++) {
    const silence = timeline.insertedSilence[i];
    if (!Number.isFinite(silence.startSeconds) || !Number.isFinite(silence.endSeconds) || silence.startSeconds < 0 || silence.endSeconds > timeline.durationSeconds + 0.001 || silence.endSeconds <= silence.startSeconds || (i && silence.startSeconds < timeline.insertedSilence[i - 1].endSeconds - 0.001) || timeline.scenes.some((scene) => scene.words.some((word) => word.startSeconds < silence.endSeconds && word.endSeconds > silence.startSeconds))) throw new Error('Inserted silence overlaps speech or composition bounds');
  }
}
