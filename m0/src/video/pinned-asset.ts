import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

/** Read a saved source asset before any derived output is written. */
export async function readPinnedAsset(path: string, label: string, expectedSha256: string): Promise<Buffer> {
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${label} is missing; restore the saved asset before rendering`);
    }
    throw error;
  }
  const actualSha256 = createHash('sha256').update(bytes).digest('hex');
  if (actualSha256 !== expectedSha256) {
    throw new Error(`${label} checksum mismatch; the saved asset may be corrupted or changed`);
  }
  return bytes;
}

export async function readRequiredJsonAsset(path: string, label: string): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${label} is missing; restore the saved asset before rendering`);
    }
    throw error;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`${label} contains malformed JSON; restore the saved asset before rendering`);
  }
}
