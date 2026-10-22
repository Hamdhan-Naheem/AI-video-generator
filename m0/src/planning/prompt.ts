import {planningTemplateIds, animationActionIds, sceneTemplates} from './registry';
import {PlanningInputSchema, type PlanningInput} from './schema';

// Deliberately small JSON Schema subset for Gemini responseFormat. Local Zod validation is authoritative.
const stringSchema = {type: 'string'} as const;
const numberSchema = {type: 'number'} as const;
export const geminiStoryboardJsonSchema = {
  type: 'object',
  properties: {
    title: stringSchema,
    summary: stringSchema,
    narrationSections: {
      type: 'array',
      items: {type: 'object', properties: {sceneId: stringSchema, text: stringSchema}, required: ['sceneId', 'text']},
    },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: stringSchema,
          order: {type: 'integer'},
          templateId: {type: 'string', enum: [...planningTemplateIds]},
          narration: stringSchema,
          visuals: {type: 'array', items: {type: 'object', properties: {kind: {type: 'string', enum: ['label', 'diagram', 'flow', 'icon', 'character']}, description: stringSchema}, required: ['kind', 'description']}},
          animationActions: {type: 'array', items: {type: 'string', enum: [...animationActionIds]}},
          estimatedDurationSeconds: numberSchema,
        },
        required: ['id', 'order', 'templateId', 'narration', 'visuals', 'animationActions', 'estimatedDurationSeconds'],
      },
    },
    estimatedDurationSeconds: numberSchema,
  },
  required: ['title', 'summary', 'narrationSections', 'scenes', 'estimatedDurationSeconds'],
} as const;

export function buildPlanningPrompt(rawInput: unknown): {system: string; user: string; input: PlanningInput} {
  const input = PlanningInputSchema.parse(rawInput);
  if (input.type !== 'educational' || input.style !== 'cartoon_teacher') {
    throw new Error('Phase 2A generation supports only the educational Cartoon Teacher example; other type/style inputs are model foundations only');
  }
  const system = [
    'You are planning an English educational video for a human editor. Return only JSON matching the supplied schema.',
    'Your output is a draft, never approved content. Do not request provider calls, code execution, files, URLs, or new component identifiers.',
    'Use only these planning-supported layout IDs and their stated purposes:',
    ...planningTemplateIds.map((id) => `- ${id}: ${sceneTemplates[id].description}`),
    `Use only these animation action IDs: ${animationActionIds.join(', ')}. The renderer applies authored controls; actual speech timing comes from recorded narration alignment, never storyboard estimates.`,
    ...planningTemplateIds.map((id) => `- ${id} allows: ${sceneTemplates[id].actions.join(', ')}`),
    'The six-second Phase 1 preview is a separate fixed composition. Do not use its ID in this storyboard or claim these scenes can be rendered yet.',
    'Create about 6-10 sequential scenes with unique IDs scene-01, scene-02, etc. Every narrationSections item must repeat exactly its matching scene narration.',
    'Make the estimated scene durations positive and sum exactly to estimatedDurationSeconds. Estimates are not actual audio measurements.',
    'Use plain text for narration and visual descriptions. No HTML, Markdown code fences, scripts, executable instructions, arbitrary paths, or remote URLs.',
    'Explain electricity generation accurately for beginners: water, steam, or wind can turn turbines; the turbine drives a generator; transmission carries generated electricity onward. Do not imply all electricity comes from water.',
    'Start with teacher_intro_v1 and end with teacher_conclusion_v1. Include teacher_explanation_v1, teacher_beside_diagram_v1, and full_screen_diagram_v1 scenes with meaningful turbine, generator, and transmission descriptions. The full-screen diagram has no teacher actions. Keep factual uncertainty visible for human review.',
    'Aim for an English narration script suitable for roughly 75 seconds. The user must review and approve all wording and visuals before narration synthesis.',
  ].join('\n');
  const user = JSON.stringify({
    videoType: input.type,
    presentationStyle: input.style,
    topic: input.topic,
    instructions: input.instructions ?? '',
    language: input.language,
    targetDurationSeconds: input.targetDurationSeconds,
    estimatedNarrationWordsGuide: [125, 175],
  });
  return {system, user, input};
}
