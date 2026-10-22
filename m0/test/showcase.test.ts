import assert from 'node:assert/strict';
import test from 'node:test';
import {productShowcasePlan, softwareShowcasePlan, showcaseDurationFrames, showcaseLayouts, validateShowcasePlan, SHOWCASE_FPS} from '../src/showcase/plans';

test('both fictional category demos use three ordered, contiguous scenes and 12-second plans', () => {
  for (const plan of [productShowcasePlan, softwareShowcasePlan]) {
    assert.doesNotThrow(() => validateShowcasePlan(plan));
    assert.equal(showcaseDurationFrames(plan), 12 * SHOWCASE_FPS);
    assert.deepEqual(plan.scenes.map((scene) => scene.startFrame), [0, 120, 240]);
    assert.equal(plan.scenes.at(-1)!.startFrame + plan.scenes.at(-1)!.durationFrames, 360);
    assert.ok(plan.scenes.every((scene) => showcaseLayouts[scene.layout] === plan.category));
  }
  assert.deepEqual(productShowcasePlan.scenes.map((scene) => scene.layout), ['product_hero', 'product_features', 'product_cta']);
  assert.deepEqual(softwareShowcasePlan.scenes.map((scene) => scene.layout), ['software_dashboard', 'software_workflow', 'software_insights']);
});

test('category layouts cannot be silently substituted or reordered', () => {
  const mismatched = structuredClone(productShowcasePlan);
  mismatched.scenes[1].layout = 'software_workflow';
  assert.throws(() => validateShowcasePlan(mismatched), /does not belong/);
  const gap = structuredClone(softwareShowcasePlan);
  gap.scenes[1].startFrame = 125;
  assert.throws(() => validateShowcasePlan(gap), /gap, overlap/);
  const duplicate = structuredClone(productShowcasePlan);
  duplicate.scenes[1].id = duplicate.scenes[0].id;
  assert.throws(() => validateShowcasePlan(duplicate), /duplicate/);
});
