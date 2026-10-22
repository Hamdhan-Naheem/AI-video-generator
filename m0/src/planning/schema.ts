import {z} from 'zod';
import {animationActionIds, compatibleStyles, planningTemplateIds, presentationStyles, sceneTemplates, videoTypes} from './registry';

export const VideoTypeSchema = z.enum(videoTypes);
export const PresentationStyleSchema = z.enum(presentationStyles);
export const AnimationActionSchema = z.enum(animationActionIds);
export const SceneTemplateSchema = z.enum(planningTemplateIds);
export const ReviewStatusSchema = z.enum(['pending_review', 'approved', 'rejected']);

export const PlanningInputSchema = z.object({
  type: VideoTypeSchema,
  style: PresentationStyleSchema,
  topic: z.string().trim().min(3).max(2000),
  instructions: z.string().trim().max(1000).optional(),
  language: z.literal('en'),
  targetDurationSeconds: z.number().int().min(62).max(90),
  // Foundations for later product/project intake; no media processing is implemented here.
  productFacts: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
  projectStatus: z.enum(['Concept', 'Prototype', 'Available']).optional(),
}).strict().superRefine((input, ctx) => {
  if (!(compatibleStyles[input.type] as readonly string[]).includes(input.style)) {
    ctx.addIssue({code: 'custom', path: ['style'], message: `${input.style} is not supported for ${input.type}`});
  }
});

const safeText = (min: number, max: number) => z.string().trim().min(min).max(max).refine(
  (value) => !/(<\s*\/?\s*[a-z][^>]*>|```|(?:https?|file|data|javascript):\/\/?|\b(?:eval|require|import)\s*\(|\bprocess\.env\b|\.\.[\\/])/i.test(value),
  'Contains markup, code, URL, or path-like instructions; replace with plain reviewable text',
);

export const VisualElementSchema = z.object({
  kind: z.enum(['label', 'diagram', 'flow', 'icon', 'character']),
  description: safeText(2, 220),
}).strict();

export const SceneSchema = z.object({
  id: z.string().regex(/^scene-\d{2}$/, 'Use scene-01, scene-02, ...'),
  order: z.number().int().positive(),
  templateId: SceneTemplateSchema,
  narration: safeText(10, 700),
  visuals: z.array(VisualElementSchema).min(1).max(8),
  animationActions: z.array(AnimationActionSchema).max(9),
  estimatedDurationSeconds: z.number().finite().positive().max(40),
}).strict();

export const NarrationSectionSchema = z.object({
  sceneId: z.string().regex(/^scene-\d{2}$/),
  text: safeText(10, 700),
}).strict();

export const GeneratedStoryboardSchema = z.object({
  title: safeText(3, 120),
  summary: safeText(10, 450),
  narrationSections: z.array(NarrationSectionSchema).min(4).max(12),
  scenes: z.array(SceneSchema).min(4).max(12),
  estimatedDurationSeconds: z.number().finite().positive(),
}).strict();

export const PlanningDraftSchema = z.object({
  schemaVersion: z.literal('m0.plan.v1'),
  input: PlanningInputSchema,
  storyboard: GeneratedStoryboardSchema,
}).strict().superRefine(({input, storyboard}, ctx) => {
  const {scenes, narrationSections, estimatedDurationSeconds} = storyboard;
  const seen = new Set<string>();
  scenes.forEach((scene, index) => {
    if (seen.has(scene.id)) ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'id'], message: 'Scene ID must be unique'});
    seen.add(scene.id);
    if (scene.order !== index + 1 || scene.id !== `scene-${String(index + 1).padStart(2, '0')}`) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'order'], message: 'Scenes must be sequential from scene-01 and order 1'});
    }
    const template = sceneTemplates[scene.templateId];
    if (!(template.videoTypes as readonly string[]).includes(input.type) || !(template.styles as readonly string[]).includes(input.style)) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'templateId'], message: `${scene.templateId} is not supported for ${input.type}/${input.style}`});
    }
    scene.animationActions.forEach((action, actionIndex) => {
      if (!(template.actions as readonly string[]).includes(action)) {
        ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'animationActions', actionIndex], message: `${action} is not supported by ${scene.templateId}`});
      }
    });
    const hasCharacter = scene.visuals.some((visual) => visual.kind === 'character');
    const hasDiagram = scene.visuals.some((visual) => visual.kind === 'diagram' || visual.kind === 'flow');
    if (scene.templateId === 'full_screen_diagram_v1' && (hasCharacter || !hasDiagram)) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'visuals'], message: 'Full-screen diagram requires a diagram or flow and no character'});
    }
    if (scene.templateId === 'teacher_beside_diagram_v1' && (!hasCharacter || !hasDiagram)) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'visuals'], message: 'Teacher beside diagram requires both a character and a diagram or flow'});
    }
    if (['teacher_intro_v1', 'teacher_explanation_v1', 'teacher_conclusion_v1'].includes(scene.templateId) && !hasCharacter) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'visuals'], message: 'Teacher layout requires a character visual'});
    }
    if (scene.templateId === 'teacher_intro_v1' && index !== 0) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'templateId'], message: 'Teacher introduction must be the first scene'});
    }
    if (scene.templateId === 'teacher_conclusion_v1' && index !== scenes.length - 1) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'templateId'], message: 'Teacher conclusion must be the last scene'});
    }
    if (new Set(scene.animationActions).size !== scene.animationActions.length) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'scenes', index, 'animationActions'], message: 'Animation actions must be unique per scene'});
    }
  });
  if (narrationSections.length !== scenes.length) {
    ctx.addIssue({code: 'custom', path: ['storyboard', 'narrationSections'], message: 'Provide one narration section per scene'});
  }
  narrationSections.forEach((section, index) => {
    if (section.sceneId !== scenes[index]?.id || section.text !== scenes[index]?.narration) {
      ctx.addIssue({code: 'custom', path: ['storyboard', 'narrationSections', index], message: 'Section must match the corresponding scene ID and narration exactly'});
    }
  });
  const sum = scenes.reduce((total, scene) => total + scene.estimatedDurationSeconds, 0);
  if (Math.abs(sum - estimatedDurationSeconds) > 0.1) {
    ctx.addIssue({code: 'custom', path: ['storyboard', 'estimatedDurationSeconds'], message: 'Estimated total must equal the sum of scene estimates'});
  }
  if (estimatedDurationSeconds < input.targetDurationSeconds * 0.75 || estimatedDurationSeconds > input.targetDurationSeconds * 1.25) {
    ctx.addIssue({code: 'custom', path: ['storyboard', 'estimatedDurationSeconds'], message: 'Estimate is too far from the requested target; revise the script or target'});
  }
});

export type PlanningInput = z.infer<typeof PlanningInputSchema>;
export type PlanningDraft = z.infer<typeof PlanningDraftSchema>;
export type GeneratedStoryboard = z.infer<typeof GeneratedStoryboardSchema>;

export function parsePlanningDraft(value: unknown): PlanningDraft {
  const result = PlanningDraftSchema.safeParse(value);
  if (result.success) return result.data;
  const details = result.error.issues.map((issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`).join('; ');
  throw new Error(`Invalid planning draft: ${details}`);
}

export function assemblePlanningDraft(input: unknown, generated: unknown): PlanningDraft {
  return parsePlanningDraft({schemaVersion: 'm0.plan.v1', input, storyboard: generated});
}
