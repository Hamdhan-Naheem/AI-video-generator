import {planningTemplateIds} from './registry';
import type {PlanningDraft} from './schema';

/** Additional M0 checks after the general planning schema has accepted a draft. */
export function checkControlledElectricityDraft(plan: PlanningDraft): {wordCount: number; warnings: string[]} {
  const {input, storyboard} = plan;
  if (input.type !== 'educational' || input.style !== 'cartoon_teacher' || input.topic !== 'How Electricity Is Generated' || input.language !== 'en' || input.targetDurationSeconds !== 75) {
    throw new Error('Controlled M0 input does not match the authorized electricity video');
  }
  if (storyboard.scenes.length < 6 || storyboard.scenes.length > 10) {
    throw new Error('Controlled M0 storyboard must contain 6–10 scenes');
  }
  if (storyboard.estimatedDurationSeconds < 72 || storyboard.estimatedDurationSeconds > 78) {
    throw new Error('Controlled M0 storyboard estimate must be 72–78 seconds around the 75-second target');
  }
  for (const id of planningTemplateIds) {
    if (!storyboard.scenes.some((scene) => scene.templateId === id)) {
      throw new Error(`Controlled M0 storyboard is missing required layout ${id}`);
    }
  }
  const narration = storyboard.narrationSections.map((section) => section.text).join(' ');
  const wordCount = narration.trim().split(/\s+/u).length;
  const warnings: string[] = [];
  if (wordCount < 135 || wordCount > 195) {
    warnings.push(`Narration has ${wordCount} words; verify its fit to 75 seconds with actual speech timing later`);
  }
  warnings.push('Scientific accuracy, clarity, visuals, and real spoken duration require human review; estimates are not audio timestamps');
  return {wordCount, warnings};
}
