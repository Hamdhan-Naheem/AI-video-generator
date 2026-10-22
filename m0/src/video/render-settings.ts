/** Validate JSON props before Remotion starts rendering frames. Undefined uses the component default. */
export function validateRenderSettings(value: {showSubtitles?: unknown; includeAudio?: unknown}, hasNarration: boolean): void {
  if (!value || typeof value !== 'object') throw new Error('Render settings are missing');
  if (value.showSubtitles !== undefined && typeof value.showSubtitles !== 'boolean') throw new Error('showSubtitles must be a boolean');
  if (value.includeAudio !== undefined && typeof value.includeAudio !== 'boolean') throw new Error('includeAudio must be a boolean');
  if (value.includeAudio === true && !hasNarration) throw new Error('Narration timing is required when audio is enabled');
}
