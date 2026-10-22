export const OUTPUT_FPS = 30;

/** Round up so the final frame never cuts off requested content. */
export function framesForDuration(seconds: number, bounds?: {minSeconds: number; maxSeconds: number}): number {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Requested duration must be a positive finite number');
  if (bounds && (!Number.isFinite(bounds.minSeconds) || !Number.isFinite(bounds.maxSeconds) || bounds.minSeconds <= 0 || bounds.maxSeconds < bounds.minSeconds || seconds < bounds.minSeconds || seconds > bounds.maxSeconds)) throw new Error('Requested duration is outside supported bounds');
  const frames = Math.ceil(seconds * OUTPUT_FPS - 1e-9);
  if (!Number.isSafeInteger(frames) || (bounds && frames / OUTPUT_FPS > bounds.maxSeconds + 1e-9)) throw new Error('Rounded duration exceeds supported frame bounds');
  return frames;
}

export function validateFrameCoverage(totalFrames: number, scenes: {startFrame: number; endFrame: number}[]): void {
  if (!Number.isSafeInteger(totalFrames) || totalFrames <= 0 || !Array.isArray(scenes) || scenes.length === 0) throw new Error('Timeline is empty or has an invalid duration');
  let cursor = 0;
  for (const scene of scenes) {
    if (!Number.isSafeInteger(scene.startFrame) || !Number.isSafeInteger(scene.endFrame) || scene.startFrame !== cursor || scene.endFrame <= scene.startFrame || scene.endFrame > totalFrames) throw new Error('Timeline scenes overlap, have a gap or exceed the video duration');
    cursor = scene.endFrame;
  }
  if (cursor !== totalFrames) throw new Error('Timeline scenes do not cover the video duration');
}
