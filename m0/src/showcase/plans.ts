import {compatibleStyles} from '../planning/registry';

export const SHOWCASE_FPS = 30;
export const SHOWCASE_WIDTH = 1080;
export const SHOWCASE_HEIGHT = 1920;

export const showcaseLayouts = {
  product_hero: 'product',
  product_features: 'product',
  product_cta: 'product',
  software_dashboard: 'project_explainer',
  software_workflow: 'project_explainer',
  software_insights: 'project_explainer',
} as const;

export type ShowcaseLayout = keyof typeof showcaseLayouts;
export type ShowcaseCategory = 'product' | 'project_explainer';
export type ShowcaseScene = {
  id: string;
  layout: ShowcaseLayout;
  startFrame: number;
  durationFrames: number;
  eyebrow: string;
  title: string;
  caption: string;
};
export type ShowcasePlan = {
  category: ShowcaseCategory;
  style: 'animated_explainer';
  brand: string;
  accent: string;
  scenes: ShowcaseScene[];
};

export const productShowcasePlan: ShowcasePlan = {
  category: 'product', style: 'animated_explainer', brand: 'LUMA', accent: '#EBD38C',
  scenes: [
    {id: 'product-hero', layout: 'product_hero', startFrame: 0, durationFrames: 120, eyebrow: 'MEET LUMA MINI', title: 'A little light.\nA lot of life.', caption: 'A fictional portable lamp for brighter moments.'},
    {id: 'product-features', layout: 'product_features', startFrame: 120, durationFrames: 120, eyebrow: 'MADE TO MOVE', title: 'Light that follows you.', caption: 'Touch control  •  Rechargeable  •  Warm glow'},
    {id: 'product-cta', layout: 'product_cta', startFrame: 240, durationFrames: 120, eyebrow: 'YOUR SPACE, REIMAGINED', title: 'Make room\nfor glow.', caption: 'Discover LUMA MINI  →'},
  ],
};

export const softwareShowcasePlan: ShowcasePlan = {
  category: 'project_explainer', style: 'animated_explainer', brand: 'NORTHSTAR', accent: '#7EE4D8',
  scenes: [
    {id: 'software-dashboard', layout: 'software_dashboard', startFrame: 0, durationFrames: 120, eyebrow: 'INTRODUCING NORTHSTAR', title: 'A clearer view\nof every project.', caption: 'A fictional workspace for planning together.'},
    {id: 'software-workflow', layout: 'software_workflow', startFrame: 120, durationFrames: 120, eyebrow: 'KEEP WORK MOVING', title: 'From idea\nto done.', caption: 'Move a task. See the whole team stay in sync.'},
    {id: 'software-insights', layout: 'software_insights', startFrame: 240, durationFrames: 120, eyebrow: 'SEE WHAT MATTERS', title: 'Progress at\na glance.', caption: 'Simple updates. Clear next steps.'},
  ],
};

export function showcaseDurationFrames(plan: ShowcasePlan): number {
  return plan.scenes.reduce((end, scene) => Math.max(end, scene.startFrame + scene.durationFrames), 0);
}

export function validateShowcasePlan(plan: ShowcasePlan): void {
  if (!compatibleStyles[plan.category].includes(plan.style)) throw new Error('Showcase category/style combination is unsupported');
  if (!plan.brand.trim() || !/^#[0-9a-fA-F]{6}$/.test(plan.accent)) throw new Error('Showcase brand or accent is invalid');
  if (plan.scenes.length < 3) throw new Error('Showcase needs opening, middle and closing scenes');
  let end = 0;
  const ids = new Set<string>();
  for (const scene of plan.scenes) {
    if (showcaseLayouts[scene.layout] !== plan.category) throw new Error(`Layout ${scene.layout} does not belong to ${plan.category}`);
    if (scene.startFrame !== end || !Number.isInteger(scene.durationFrames) || scene.durationFrames < 30) throw new Error(`Scene ${scene.id} has a gap, overlap or invalid duration`);
    if (!scene.id || ids.has(scene.id) || !scene.eyebrow.trim() || !scene.title.trim() || !scene.caption.trim()) throw new Error(`Scene ${scene.id} has missing or duplicate content`);
    ids.add(scene.id);
    end += scene.durationFrames;
  }
  if (end < 300 || end > 450) throw new Error('Showcase must last 10–15 seconds at 30 fps');
}

validateShowcasePlan(productShowcasePlan);
validateShowcasePlan(softwareShowcasePlan);
