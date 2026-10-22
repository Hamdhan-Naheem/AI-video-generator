/** Authored planning IDs are data, never dynamic component names or code. */
export const presentationStyles = ['animated_explainer', 'cartoon_teacher', 'cartoon_presenter'] as const;
export const videoTypes = ['educational', 'product', 'project_explainer'] as const;

export const compatibleStyles = {
  educational: ['animated_explainer', 'cartoon_teacher', 'cartoon_presenter'],
  product: ['animated_explainer', 'cartoon_presenter'],
  project_explainer: ['animated_explainer', 'cartoon_presenter'],
} as const;

/** Allowlisted storyboard actions. The Phase 1 demo keeps its own fixed cues. */
export const animationActions = {
  teacher_mouth_demo: 'Speech-responsive teacher mouth activity from saved alignment',
  teacher_blink: 'Deterministic teacher blink',
  teacher_head_motion: 'Subtle deterministic head movement',
  teacher_wave: 'Teacher wave at opening or closing',
  turbine_spin: 'Animated turbine blades',
  generator_pulse: 'Generator glow pulse',
  electricity_flow: 'Animated electricity flow',
  fade_transition: 'Short scene opacity transition',
  caption_swap: 'Subtitle change using speech timing',
} as const;

export const animationActionIds = Object.keys(animationActions) as [keyof typeof animationActions, ...(keyof typeof animationActions)[]];
type ActionId = keyof typeof animationActions;
type TemplateDefinition = {
  status: 'preview_only' | 'planning_only' | 'render_ready';
  description: string;
  videoTypes: readonly (typeof videoTypes)[number][];
  styles: readonly (typeof presentationStyles)[number][];
  actions: readonly ActionId[];
};

const teacherActions = ['teacher_mouth_demo', 'teacher_blink', 'teacher_head_motion', 'teacher_wave', 'fade_transition', 'caption_swap'] as const;
const teacherDiagramActions = [...teacherActions, 'turbine_spin', 'generator_pulse', 'electricity_flow'] as const;
const diagramActions = ['turbine_spin', 'generator_pulse', 'electricity_flow', 'fade_transition', 'caption_swap'] as const;

export const sceneTemplates = {
  electricity_teacher_diagram_demo_v1: {
    status: 'preview_only',
    description: 'Fixed six-second Phase 1 composition; it does not consume storyboard scenes.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: animationActionIds,
  },
  teacher_intro_v1: {
    status: 'render_ready', description: 'Cartoon teacher opening with title and socket illustration.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: teacherActions,
  },
  teacher_explanation_v1: {
    status: 'render_ready', description: 'Cartoon teacher beside an energy-conversion graphic.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: teacherActions,
  },
  teacher_beside_diagram_v1: {
    status: 'render_ready', description: 'Cartoon teacher beside a turbine or transmission diagram.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: teacherDiagramActions,
  },
  full_screen_diagram_v1: {
    status: 'render_ready', description: 'Full-screen generator and electric-current diagrams without teacher.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: diagramActions,
  },
  teacher_conclusion_v1: {
    status: 'render_ready', description: 'Cartoon teacher conclusion and energy summary.',
    videoTypes: ['educational'], styles: ['cartoon_teacher'], actions: teacherActions,
  },
} as const satisfies Record<string, TemplateDefinition>;

/** Only these five layouts may occur in a new educational Cartoon Teacher storyboard. */
export const planningTemplateIds = [
  'teacher_intro_v1',
  'teacher_explanation_v1',
  'teacher_beside_diagram_v1',
  'full_screen_diagram_v1',
  'teacher_conclusion_v1',
] as const;

export const getTemplateStatus = (id: keyof typeof sceneTemplates): TemplateDefinition['status'] => sceneTemplates[id].status;

/** Implemented layout IDs; the fixed Phase 1 preview remains outside storyboard rendering. */
export const renderReadyTemplateIds = Object.keys(sceneTemplates).filter(
  (id) => getTemplateStatus(id as keyof typeof sceneTemplates) === 'render_ready',
);
