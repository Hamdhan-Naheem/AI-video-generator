import {loadEnvFile} from 'node:process';
import {resolve} from 'node:path';

// Server-only local configuration check. Never import this from a Remotion composition.
loadEnvFile(resolve(process.cwd(), '.env'));
const required = ['GEMINI_API_KEY', 'ELEVENLABS_API_KEY'];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing required .env variable name(s): ${missing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('Required provider variable names are present. No API request was made.');
}
