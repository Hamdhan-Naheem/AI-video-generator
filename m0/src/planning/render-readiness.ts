import {getTemplateStatus} from './registry';
import {parsePlanningDraft, type PlanningDraft} from './schema';

/**
 * Call this before any storyboard-driven render. The standalone Phase 1 demo
 * does not accept a plan and is intentionally outside this gate.
 */
export function assertStoryboardRenderReady(value: unknown): PlanningDraft {
  const plan = parsePlanningDraft(value);
  const unfinished = plan.storyboard.scenes.filter(
    (scene) => getTemplateStatus(scene.templateId) !== 'render_ready',
  );
  if (unfinished.length > 0) {
    const detail = unfinished.map((scene) => `${scene.id} (${scene.templateId})`).join(', ');
    throw new Error(`Storyboard rendering blocked: unimplemented Remotion scene template(s): ${detail}. These layouts are supported for planning only; the six-second Phase 1 demo does not render this plan.`);
  }
  return plan;
}
