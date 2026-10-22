import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createFixtureCandidate, decideCandidate, getApprovedDraftForNarration, getApprovedDraftForRendering, refreshPendingFixtureCandidate, reviewCandidate, showReview} from './review-store';

const root = process.cwd();
const runId = process.argv[2] === 'approve' ? process.argv[4] : process.argv[3];
if (runId && !['gemini-live-phase2b', 'gemini-live-phase2b-retry1'].includes(runId)) throw new Error('Unknown planning run ID');
const dir = resolve(root, 'm0/runs/electricity', runId ?? '');
const fixture = resolve(root, 'm0/fixtures/electricity-plan.fixture.json');
const action = process.argv[2];

try {
  switch (action) {
    case 'fixture': {
      await createFixtureCandidate(dir, await readFile(fixture, 'utf8'));
      console.log('OFFLINE FIXTURE copied to m0/runs/electricity/candidate.json. Status: Pending Review. Run npm run plan:show.');
      break;
    }
    case 'refresh-fixture': {
      await refreshPendingFixtureCandidate(dir, await readFile(fixture, 'utf8'));
      console.log('Pending offline fixture refreshed; previous candidate preserved under m0/runs/electricity/history/. Status: Pending Review. Run npm run plan:show.');
      break;
    }
    case 'review': {
      await reviewCandidate(dir);
      console.log('Current candidate validated and marked Pending Review. Read m0/runs/electricity/review.md before deciding.');
      break;
    }
    case 'show': console.log(await showReview(dir)); break;
    case 'approve': {
      const expectedSha = process.argv[3];
      const displayed = await showReview(dir);
      const currentSha = displayed.match(/Candidate SHA-256: ([a-f0-9]{64})/)?.[1];
      if (!expectedSha || expectedSha !== currentSha) throw new Error('Pass the exact Candidate SHA-256 shown by npm run plan:show: npm run plan:approve -- <sha256>');
      const state = await decideCandidate(dir, 'approved');
      console.log(`Explicit approval recorded for candidate SHA-256 ${state.candidateSha256}. No narration was generated.`);
      break;
    }
    case 'reject': {
      await decideCandidate(dir, 'rejected');
      console.log('Current candidate rejected. No narration can proceed.');
      break;
    }
    case 'check-approved': {
      await getApprovedDraftForNarration(dir);
      console.log('Current candidate has a matching approved snapshot. No narration was generated.');
      break;
    }
    case 'check-render-ready': {
      await getApprovedDraftForRendering(dir);
      console.log('Approved storyboard uses only implemented Remotion scene templates.');
      break;
    }
    default: throw new Error('Use fixture, refresh-fixture, review, show, approve, reject, check-approved, or check-render-ready');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Planning review command failed');
  process.exitCode = 1;
}
