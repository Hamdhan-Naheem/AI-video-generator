import {z} from 'zod';
import type {PlanningDraft} from '../planning/schema';

const AlignmentSchema = z.object({
  characters: z.array(z.string().min(1)),
  character_start_times_seconds: z.array(z.number().finite().nonnegative()),
  character_end_times_seconds: z.array(z.number().finite().nonnegative()),
}).strict();
export type CharacterAlignment = z.infer<typeof AlignmentSchema>;

export type TimedSpan = {text: string; startSeconds: number; endSeconds: number};
export type TimedScene = TimedSpan & {sceneId: string; words: TimedSpan[]; subtitles: TimedSpan[]};
export type NarrationTiming = {
  estimatedDurationSeconds: number;
  actualAudioDurationSeconds: number;
  scenes: TimedScene[];
};

/** Offsets use Unicode code points (Array.from), not UTF-16 code units. */
export function completeNarration(plan: PlanningDraft): string {
  return plan.storyboard.narrationSections.map(({text}) => text).join(' ');
}

export function validateOriginalAlignment(value: unknown, expectedText: string): CharacterAlignment {
  const alignment = AlignmentSchema.parse(value);
  const {characters, character_start_times_seconds: starts, character_end_times_seconds: ends} = alignment;
  if (characters.length !== starts.length || characters.length !== ends.length) throw new Error('Alignment character/time array lengths differ');
  if (characters.some((char) => Array.from(char).length !== 1)) throw new Error('Alignment must contain one Unicode code point per character');
  if (characters.join('') !== expectedText) throw new Error('Original alignment does not match approved narration exactly; normalized text cannot be mapped by guessing');
  for (let index = 0; index < characters.length; index++) {
    if (ends[index] < starts[index]) throw new Error(`Alignment has a negative character duration at ${index}`);
    if (index > 0 && starts[index] < starts[index - 1] - 0.001) throw new Error(`Alignment starts out of order at ${index}`);
    if (index > 0 && ends[index] < ends[index - 1] - 0.001) throw new Error(`Alignment ends out of order at ${index}`);
  }
  return alignment;
}

export function makeNarrationTiming(plan: PlanningDraft, original: unknown, actualAudioDurationSeconds: number): NarrationTiming {
  return {
    estimatedDurationSeconds: plan.storyboard.estimatedDurationSeconds,
    actualAudioDurationSeconds,
    scenes: makeTimedSections(plan.storyboard.narrationSections.map(({sceneId, text}) => ({sceneId, text})), original, actualAudioDurationSeconds),
  };
}

/** Shared character-to-word/caption mapping for reviewed narration in any video category. */
export function makeTimedSections(sections: {sceneId: string; text: string}[], original: unknown, actualAudioDurationSeconds: number): TimedScene[] {
  if (!Number.isFinite(actualAudioDurationSeconds) || actualAudioDurationSeconds <= 0) throw new Error('Measured audio duration is invalid');
  const text = sections.map(({text: sectionText}) => sectionText).join(' ');
  const alignment = validateOriginalAlignment(original, text);
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  if (ends.length === 0 || ends.at(-1)! > actualAudioDurationSeconds + 0.25) throw new Error('Alignment exceeds measured audio duration');
  const scenes: TimedScene[] = [];
  let offset = 0;
  for (const section of sections) {
    const chars = Array.from(section.text);
    const sectionStart = offset;
    const sectionEnd = offset + chars.length;
    const words: TimedSpan[] = [];
    let wordStart = -1;
    for (let i = sectionStart; i <= sectionEnd; i++) {
      const inWord = i < sectionEnd && !/\s/u.test(alignment.characters[i]);
      if (inWord && wordStart < 0) wordStart = i;
      if (!inWord && wordStart >= 0) {
        words.push({text: alignment.characters.slice(wordStart, i).join(''), startSeconds: starts[wordStart], endSeconds: ends[i - 1]});
        wordStart = -1;
      }
    }
    if (!words.length) throw new Error(`Scene ${section.sceneId} has no timed words`);
    const subtitles: TimedSpan[] = [];
    for (let i = 0; i < words.length; i += 6) {
      const group = words.slice(i, i + 6);
      subtitles.push({text: group.map((word) => word.text).join(' '), startSeconds: group[0].startSeconds, endSeconds: group.at(-1)!.endSeconds});
    }
    scenes.push({sceneId: section.sceneId, text: section.text, startSeconds: words[0].startSeconds, endSeconds: words.at(-1)!.endSeconds, words, subtitles});
    offset = sectionEnd + 1; // one separator between approved sections
  }
  return scenes;
}
