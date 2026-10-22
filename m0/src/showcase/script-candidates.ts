import {z} from 'zod';
import {productShowcasePlan, softwareShowcasePlan, type ShowcaseCategory} from './plans';

const SceneScriptSchema = z.object({sceneId: z.string().min(1), text: z.string().trim().min(1), visualReason: z.string().trim().min(1)}).strict();
export const ShowcaseScriptSchema = z.object({
  version: z.literal('m0.showcase.script.v1'),
  id: z.enum(['luma-mini-v1', 'northstar-v1', 'northstar-v2']),
  category: z.enum(['product', 'project_explainer']),
  language: z.literal('en'),
  targetNarrationSeconds: z.number().int().positive(),
  scenes: z.array(SceneScriptSchema).length(3),
}).strict();
export type ShowcaseScript = z.infer<typeof ShowcaseScriptSchema>;

export const showcaseScriptSeeds: Record<ShowcaseScript['id'], ShowcaseScript> = {
  'luma-mini-v1': {
    version: 'm0.showcase.script.v1', id: 'luma-mini-v1', category: 'product', language: 'en', targetNarrationSeconds: 20,
    scenes: [
      {sceneId: 'product-hero', text: 'Meet LUMA MINI, a portable lamp made to bring a warm glow wherever you settle in.', visualReason: 'Introduces the illustrated lamp during its entrance and title reveal.'},
      {sceneId: 'product-features', text: 'Tap to set the mood, recharge when you need to, and carry comfortable light from room to room.', visualReason: 'Matches the touch-control, rechargeable and warm-glow feature cards without adding specifications.'},
      {sceneId: 'product-cta', text: 'Make space for your next bright moment. Discover LUMA MINI.', visualReason: 'Matches the final product shot and Discover call to action.'},
    ],
  },
  'northstar-v1': {
    version: 'm0.showcase.script.v1', id: 'northstar-v1', category: 'project_explainer', language: 'en', targetNarrationSeconds: 30,
    scenes: [
      {sceneId: 'software-dashboard', text: 'Meet NORTHSTAR, a fictional workspace that gives every project a clearer view. Its dashboard brings the work ahead, what is moving, and what is done into one place.', visualReason: 'Names the fictional application and describes only the visible overview board and columns.'},
      {sceneId: 'software-workflow', text: 'Move a task from to do into progress, and watch the board reflect the next step for your team.', visualReason: 'Follows the animated task card as it moves between the To Do and In Progress columns.'},
      {sceneId: 'software-insights', text: 'Progress cards and a weekly chart show how work is moving. See the work, see the next step, with NORTHSTAR.', visualReason: 'Matches the numeric progress cards and animated weekly chart, then closes on the application name.'},
    ],
  },
  'northstar-v2': {
    version: 'm0.showcase.script.v1', id: 'northstar-v2', category: 'project_explainer', language: 'en', targetNarrationSeconds: 30,
    scenes: [
      {sceneId: 'software-dashboard', text: 'Meet NORTHSTAR, a simple workspace that keeps every project on track. See upcoming tasks, work in progress, and completed work together on one clear dashboard.', visualReason: 'Introduces NORTHSTAR while the existing dashboard shows the To Do, In Progress and Done columns.'},
      {sceneId: 'software-workflow', text: 'Move a task from To Do to In Progress, and watch the board update.', visualReason: 'Follows the existing task-card movement from the To Do column to In Progress.'},
      {sceneId: 'software-insights', text: 'Progress cards and a weekly chart help your team understand how work is moving forward. With NORTHSTAR, everyone knows what to focus on next.', visualReason: 'Matches the existing progress cards and weekly chart, then closes on the NORTHSTAR message.'},
    ],
  },
};

export function completeShowcaseScript(candidate: ShowcaseScript): string {
  return candidate.scenes.map(({text}) => text).join(' ');
}

export function validateShowcaseScript(value: unknown): ShowcaseScript {
  const candidate = ShowcaseScriptSchema.parse(value);
  const plan = candidate.category === 'product' ? productShowcasePlan : softwareShowcasePlan;
  if (candidate.category === 'product' ? candidate.id !== 'luma-mini-v1' : candidate.id !== 'northstar-v1' && candidate.id !== 'northstar-v2') throw new Error('Script identifier/category mismatch');
  if (candidate.targetNarrationSeconds !== (candidate.category === 'product' ? 20 : 30)) throw new Error('Script target duration changed');
  for (let i = 0; i < plan.scenes.length; i++) {
    if (candidate.scenes[i].sceneId !== plan.scenes[i].id) throw new Error(`Script scene mapping changed at position ${i + 1}`);
  }
  return candidate;
}

export const showcasePlanFor = (category: ShowcaseCategory) => category === 'product' ? productShowcasePlan : softwareShowcasePlan;

for (const seed of Object.values(showcaseScriptSeeds)) validateShowcaseScript(seed);
