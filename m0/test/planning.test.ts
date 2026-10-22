import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import test from 'node:test';
import {checkControlledElectricityDraft} from '../src/planning/controlled-electricity';
import {createGeminiPlanner, GeminiPlanningError} from '../src/planning/gemini';
import {buildPlanningPrompt, geminiStoryboardJsonSchema} from '../src/planning/prompt';
import {planningTemplateIds, renderReadyTemplateIds} from '../src/planning/registry';
import {assertStoryboardRenderReady} from '../src/planning/render-readiness';
import {createFixtureCandidate, decideCandidate, getApprovedDraftForNarration, getApprovedDraftForRendering, refreshPendingFixtureCandidate, reviewCandidate, saveNewCandidate, showReview} from '../src/planning/review-store';
import {assemblePlanningDraft, parsePlanningDraft, PlanningInputSchema} from '../src/planning/schema';

const fixtureText = await readFile(resolve('m0/fixtures/electricity-plan.fixture.json'), 'utf8');
const fixture = JSON.parse(fixtureText) as Record<string, any>;
const cloneFixture = () => structuredClone(fixture);

test('offline electricity fixture validates as a 75-second planning estimate', () => {
  const plan = parsePlanningDraft(fixture);
  assert.equal(plan.storyboard.scenes.length, 7);
  assert.equal(plan.storyboard.estimatedDurationSeconds, 75);
  assert.deepEqual([...new Set(plan.storyboard.scenes.map((scene) => scene.templateId))].sort(), [...planningTemplateIds].sort());
  assert.equal(plan.storyboard.scenes[0].templateId, 'teacher_intro_v1');
  assert.equal(plan.storyboard.scenes.at(-1)?.templateId, 'teacher_conclusion_v1');
  assert.equal(plan.storyboard.scenes.filter((scene) => scene.templateId === 'full_screen_diagram_v1').length, 2);
  assert.match(plan.storyboard.narrationSections.map((section) => section.text).join(' '), /Transmission moves electricity; it does not generate it/);
  assert.equal(checkControlledElectricityDraft(plan).wordCount, 179);
});

test('controlled run checks scene coverage and estimated fit before accepting a candidate', () => {
  const tooShort = cloneFixture();
  tooShort.storyboard.scenes[0].estimatedDurationSeconds = 5;
  tooShort.storyboard.estimatedDurationSeconds = 70;
  assert.throws(() => checkControlledElectricityDraft(parsePlanningDraft(tooShort)), /72–78 seconds/);
  const missingLayout = cloneFixture();
  missingLayout.storyboard.scenes[1].templateId = 'teacher_beside_diagram_v1';
  missingLayout.storyboard.scenes[1].visuals.push({kind: 'diagram', description: 'Simple energy source overview diagram'});
  assert.throws(() => checkControlledElectricityDraft(parsePlanningDraft(missingLayout)), /missing required layout teacher_explanation_v1/);
});

test('all five documented layouts are accepted for educational Cartoon Teacher planning', () => {
  const plan = parsePlanningDraft(fixture);
  for (const templateId of planningTemplateIds) assert.ok(plan.storyboard.scenes.some((scene) => scene.templateId === templateId));
  assert.deepEqual(renderReadyTemplateIds, [...planningTemplateIds]);
});

test('layout semantics reject teacherless teacher scenes and characters in full-screen diagrams', () => {
  const teacherless = cloneFixture();
  teacherless.storyboard.scenes[2].visuals = teacherless.storyboard.scenes[2].visuals.filter((visual: {kind: string}) => visual.kind !== 'character');
  assert.throws(() => parsePlanningDraft(teacherless), /Teacher beside diagram requires both/);
  const fullScreenWithTeacher = cloneFixture();
  fullScreenWithTeacher.storyboard.scenes[3].visuals.push({kind: 'character', description: 'Teacher appears in this diagram'});
  assert.throws(() => parsePlanningDraft(fullScreenWithTeacher), /Full-screen diagram requires/);
  const conclusionInMiddle = cloneFixture();
  conclusionInMiddle.storyboard.scenes[1].templateId = 'teacher_conclusion_v1';
  assert.throws(() => parsePlanningDraft(conclusionInMiddle), /Teacher conclusion must be the last scene/);
});

test('parser rejects malformed and incomplete JSON', () => {
  assert.throws(() => JSON.parse('{bad json'));
  const plan = cloneFixture();
  delete plan.storyboard.scenes;
  assert.throws(() => parsePlanningDraft(plan), /scenes/);
});

test('type/style incompatibility, unknown template and unknown action are actionable', () => {
  const incompatible = cloneFixture();
  incompatible.input.type = 'product';
  assert.throws(() => parsePlanningDraft(incompatible), /not supported for product/);
  const template = cloneFixture();
  template.storyboard.scenes[0].templateId = 'unknown_layout_v1';
  assert.throws(() => parsePlanningDraft(template), /templateId/);
  const preview = cloneFixture();
  preview.storyboard.scenes[0].templateId = 'electricity_teacher_diagram_demo_v1';
  assert.throws(() => parsePlanningDraft(preview), /templateId/);
  const action = cloneFixture();
  action.storyboard.scenes[0].animationActions = ['run_arbitrary_code'];
  assert.throws(() => parsePlanningDraft(action), /animationActions/);
  const wrongLayoutAction = cloneFixture();
  wrongLayoutAction.storyboard.scenes[3].animationActions = ['teacher_wave'];
  assert.throws(() => parsePlanningDraft(wrongLayoutAction), /not supported by full_screen_diagram_v1/);
  const wrongType = cloneFixture();
  wrongType.input.type = 'product';
  wrongType.input.style = 'animated_explainer';
  assert.throws(() => parsePlanningDraft(wrongType), /not supported for product\/animated_explainer/);
});

test('product and project input foundations preserve their approved style rules', () => {
  const product = PlanningInputSchema.parse({...fixture.input, type: 'product', style: 'animated_explainer', productFacts: ['Confirmed product fact']});
  const project = PlanningInputSchema.parse({...fixture.input, type: 'project_explainer', style: 'cartoon_presenter', projectStatus: 'Prototype'});
  assert.equal(product.type, 'product');
  assert.equal(project.projectStatus, 'Prototype');
});

test('duplicate or out-of-order scenes and mismatched narration are rejected', () => {
  const duplicate = cloneFixture();
  duplicate.storyboard.scenes[1].id = 'scene-01';
  assert.throws(() => parsePlanningDraft(duplicate), /unique/);
  const order = cloneFixture();
  order.storyboard.scenes[1].order = 5;
  assert.throws(() => parsePlanningDraft(order), /sequential/);
  const narration = cloneFixture();
  narration.storyboard.narrationSections[1].text = 'Changed without matching scene.';
  assert.throws(() => parsePlanningDraft(narration), /match the corresponding scene/);
});

test('duration estimates and executable-looking content are rejected', () => {
  const duration = cloneFixture();
  duration.storyboard.scenes[0].estimatedDurationSeconds = -1;
  assert.throws(() => parsePlanningDraft(duration), /estimatedDurationSeconds/);
  const total = cloneFixture();
  total.storyboard.estimatedDurationSeconds = 115;
  assert.throws(() => parsePlanningDraft(total), /Estimate is too far/);
  const inconsistent = cloneFixture();
  inconsistent.storyboard.estimatedDurationSeconds = 76;
  assert.throws(() => parsePlanningDraft(inconsistent), /sum of scene estimates/);
  const unsafe = cloneFixture();
  unsafe.storyboard.scenes[0].visuals[0].description = 'Open https://example.com and run code';
  assert.throws(() => parsePlanningDraft(unsafe), /plain reviewable text/);
});

test('storyboard render preflight accepts the five authored layouts and rejects unknown or preview templates', () => {
  assert.equal(assertStoryboardRenderReady(fixture).storyboard.scenes.length, 7);
  const unknown = cloneFixture();
  unknown.storyboard.scenes[0].templateId = 'unknown_layout_v1';
  assert.throws(() => assertStoryboardRenderReady(unknown), /templateId/);
  const preview = cloneFixture();
  preview.storyboard.scenes[0].templateId = 'electricity_teacher_diagram_demo_v1';
  assert.throws(() => assertStoryboardRenderReady(preview), /templateId/);
});

test('prompt documents only the five planning layouts and their allowed actions', () => {
  const prompt = buildPlanningPrompt(fixture.input);
  for (const id of planningTemplateIds) assert.match(prompt.system, new RegExp(id));
  assert.deepEqual(geminiStoryboardJsonSchema.properties.scenes.items.properties.templateId.enum, [...planningTemplateIds]);
  assert.match(prompt.system, /actual speech timing comes from recorded narration alignment/);
  assert.match(prompt.system, /full_screen_diagram_v1 allows: turbine_spin/);
  assert.equal(assemblePlanningDraft(prompt.input, fixture.storyboard).input.type, 'educational');
  assert.throws(() => buildPlanningPrompt({...fixture.input, type: 'product', style: 'cartoon_presenter'}), /only the educational/);
});

test('review persistence is pending by default and content edits revoke the current approval gate', async () => {
  const outputRoot = resolve('output');
  await mkdir(outputRoot, {recursive: true});
  const dir = await mkdtemp(join(outputRoot, 'planning-test-'));
  try {
    const state = await createFixtureCandidate(dir, fixtureText);
    assert.equal(state.status, 'pending_review');
    assert.match(await showReview(dir), /OFFLINE FIXTURE/);
    await assert.rejects(() => saveNewCandidate(dir, fixture, 'gemini_response'), /already exists/);
    await assert.rejects(() => getApprovedDraftForNarration(dir), /not approved/);
    const approved = await decideCandidate(dir, 'approved');
    assert.equal(approved.status, 'approved');
    assert.equal((await getApprovedDraftForNarration(dir)).storyboard.title, fixture.storyboard.title);
    assert.equal((await getApprovedDraftForRendering(dir)).storyboard.scenes.length, 7);
    const approvedFile = join(dir, 'approved', `${approved.candidateSha256}.json`);
    assert.equal(createHash('sha256').update(await readFile(approvedFile, 'utf8')).digest('hex'), approved.candidateSha256);
    const snapshot = await readFile(approvedFile, 'utf8');
    await rm(approvedFile);
    await assert.rejects(() => getApprovedDraftForNarration(dir), /Approved snapshot is missing/);
    await writeFile(approvedFile, snapshot);

    const edited = cloneFixture();
    edited.storyboard.title = 'Electricity and the Grid';
    await writeFile(join(dir, 'candidate.json'), `${JSON.stringify(edited, null, 2)}\n`);
    await assert.rejects(() => getApprovedDraftForNarration(dir), /not approved/);
    await assert.rejects(() => decideCandidate(dir, 'approved'), /changed since review/);
    await reviewCandidate(dir);
    await assert.rejects(() => getApprovedDraftForNarration(dir), /not approved/);
    await decideCandidate(dir, 'rejected');
    await assert.rejects(() => getApprovedDraftForNarration(dir), /not approved/);
    assert.equal((await readFile(approvedFile, 'utf8')).length > 0, true);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

test('pending offline fixture can be refreshed with backup but approved or edited drafts cannot', async () => {
  const outputRoot = resolve('output');
  await mkdir(outputRoot, {recursive: true});
  const dir = await mkdtemp(join(outputRoot, 'planning-refresh-test-'));
  try {
    const original = await createFixtureCandidate(dir, fixtureText);
    const revised = cloneFixture();
    revised.storyboard.title = 'Electricity Generation and Delivery';
    const refreshed = await refreshPendingFixtureCandidate(dir, JSON.stringify(revised));
    assert.equal(refreshed.status, 'pending_review');
    assert.notEqual(refreshed.candidateSha256, original.candidateSha256);
    assert.equal(await readFile(join(dir, 'history', `${original.candidateSha256}.json`), 'utf8'), await readFile(resolve('m0/fixtures/electricity-plan.fixture.json'), 'utf8').then((raw) => `${JSON.stringify(parsePlanningDraft(JSON.parse(raw)), null, 2)}\n`));
    assert.match(await showReview(dir), /Electricity Generation and Delivery/);
    await decideCandidate(dir, 'approved');
    await assert.rejects(() => refreshPendingFixtureCandidate(dir, fixtureText), /Only an unchanged Pending Review/);
    await reviewCandidate(dir, 'manual_edit');
    await assert.rejects(() => refreshPendingFixtureCandidate(dir, fixtureText), /Only an unchanged Pending Review/);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});

test('Gemini adapter builds JSON-mode request using injected transport and validates response without a live call', async () => {
  let calls = 0;
  const mockFetch: typeof fetch = async (_url, init) => {
    calls += 1;
    const body = JSON.parse(String(init?.body));
    assert.equal(body.generationConfig.responseFormat.text.mimeType, 'APPLICATION_JSON');
    assert.equal(body.generationConfig.candidateCount, 1);
    assert.equal(body.generationConfig.maxOutputTokens, 8192);
    assert.equal(body.generationConfig.thinkingConfig.thinkingLevel, 'low');
    assert.equal(body.tools, undefined);
    assert.equal(init?.method, 'POST');
    assert.equal(init?.redirect, 'error');
    return Response.json({candidates: [{finishReason: 'STOP', content: {parts: [{text: JSON.stringify(fixture.storyboard)}]}}]});
  };
  const adapter = createGeminiPlanner({apiKey: 'mock-key-for-test-only', model: 'gemini-test', timeoutMs: 1000}, mockFetch);
  const plan = await adapter.generate(fixture.input);
  assert.equal(calls, 1);
  assert.equal(plan.storyboard.scenes.length, 7);
});

test('Gemini adapter handles HTTP and invalid-output errors without retrying', async () => {
  let calls = 0;
  const httpMock: typeof fetch = async () => {calls += 1; return new Response('', {status: 429});};
  const adapter = createGeminiPlanner({apiKey: 'mock-key-for-test-only', model: 'gemini-test', timeoutMs: 1000}, httpMock);
  await assert.rejects(() => adapter.generate(fixture.input), (error) => error instanceof GeminiPlanningError && error.code === 'HTTP');
  assert.equal(calls, 1);
  const invalidMock: typeof fetch = async () => Response.json({candidates: [{finishReason: 'STOP', content: {parts: [{text: '{}'}]}}]});
  const invalid = createGeminiPlanner({apiKey: 'mock-key-for-test-only', model: 'gemini-test', timeoutMs: 1000}, invalidMock);
  await assert.rejects(() => invalid.generate(fixture.input), (error) => error instanceof GeminiPlanningError && error.code === 'VALIDATION');
  const networkMock: typeof fetch = async () => {throw new Error('mock transport failure');};
  const network = createGeminiPlanner({apiKey: 'mock-key-for-test-only', model: 'gemini-test', timeoutMs: 1000}, networkMock);
  await assert.rejects(() => network.generate(fixture.input), (error) => error instanceof GeminiPlanningError && error.code === 'NETWORK');
});
