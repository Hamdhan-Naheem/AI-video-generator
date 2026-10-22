import {resolve} from 'node:path';
import {approveShowcaseCandidate, getApprovedShowcaseScript, reviewShowcaseCandidate, seedShowcaseCandidate, showShowcaseCandidate} from './script-store';
import type {ShowcaseScript} from './script-candidates';

const [action, id, exactHash] = process.argv.slice(2);
if (id !== 'luma-mini-v1' && id !== 'northstar-v1' && id !== 'northstar-v2') throw new Error('Use luma-mini-v1, northstar-v1 or northstar-v2');
const dir = resolve('m0', 'runs', 'showcase-phase5c1', id);

try {
  if (action === 'seed') {
    const result = await seedShowcaseCandidate(dir, id as ShowcaseScript['id']);
    console.log(`Saved Pending Review: ${id}; SHA-256 ${result.hash}`);
  } else if (action === 'show') {
    console.log(await showShowcaseCandidate(dir));
  } else if (action === 'review') {
    const result = await reviewShowcaseCandidate(dir);
    console.log(`Reset to Pending Review: ${id}; SHA-256 ${result.hash}`);
  } else if (action === 'approve') {
    if (!exactHash) throw new Error('Pass the exact candidate SHA-256 shown by showcase:show');
    console.log(`Approved ${id}: ${await approveShowcaseCandidate(dir, exactHash)}`);
  } else if (action === 'check-approved') {
    const approved = await getApprovedShowcaseScript(dir);
    console.log(`Approved ${id}: ${approved.sha256}`);
  } else {
    throw new Error('Use seed, show, review, approve or check-approved');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Showcase script operation failed');
  process.exitCode = 1;
}
