import {loadEnvFile} from 'node:process';
import {resolve} from 'node:path';
import {z} from 'zod';
import {buildPlanningPrompt, geminiStoryboardJsonSchema} from './prompt';
import {assemblePlanningDraft, type PlanningDraft} from './schema';

const DEFAULT_MODEL_CANDIDATE = 'gemini-3.8-flash';
const MAX_RESPONSE_BYTES = 120_000;

const ConfigSchema = z.object({
  apiKey: z.string().trim().min(1),
  model: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, 'Model ID must be a simple Gemini model identifier'),
  timeoutMs: z.number().int().min(1_000).max(120_000),
}).strict();

export type GeminiPlannerConfig = z.infer<typeof ConfigSchema>;

/** Server-only. Do not import this module into Remotion compositions or browser code. */
export function loadLocalGeminiConfig(projectRoot: string): GeminiPlannerConfig {
  loadEnvFile(resolve(projectRoot, '.env'));
  if (!process.env.GEMINI_API_KEY?.trim()) throw new Error('GEMINI_API_KEY is missing from the root .env');
  // Candidate only. Recheck free-tier eligibility and chosen account limits before any approved live call.
  return ConfigSchema.parse({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL_CANDIDATE,
    timeoutMs: 120_000,
  });
}

export type FetchLike = typeof fetch;

export class GeminiPlanningError extends Error {
  constructor(public readonly code: 'NETWORK' | 'TIMEOUT' | 'HTTP' | 'RESPONSE' | 'VALIDATION', message: string) {
    super(message);
    this.name = 'GeminiPlanningError';
  }
}

export function createGeminiPlanner(rawConfig: GeminiPlannerConfig, fetchImpl: FetchLike = fetch) {
  const config = ConfigSchema.parse(rawConfig);
  return {
    /** Does exactly one request. No automatic retry, no local approval, no file persistence. */
    async generate(rawInput: unknown): Promise<PlanningDraft> {
      const prompt = buildPlanningPrompt(rawInput);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`;
        let response: Response;
        try {
          response = await fetchImpl(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey},
            redirect: 'error',
            body: JSON.stringify({
              systemInstruction: {parts: [{text: prompt.system}]},
              contents: [{role: 'user', parts: [{text: prompt.user}]}],
              generationConfig: {
                responseFormat: {text: {mimeType: 'APPLICATION_JSON', schema: geminiStoryboardJsonSchema}},
                candidateCount: 1,
                temperature: 0.3,
                maxOutputTokens: 8192,
                thinkingConfig: {thinkingLevel: 'low'},
              },
            }),
            signal: controller.signal,
          });
        } catch {
          throw new GeminiPlanningError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK', controller.signal.aborted ? 'Gemini request timed out; outcome may be uncertain. Do not retry automatically.' : 'Gemini request failed before a validated response; do not retry automatically.');
        }
        if (!response.ok) throw new GeminiPlanningError('HTTP', `Gemini returned HTTP ${response.status}; review the request and account limits before retrying.`);
        let bodyText: string;
        try { bodyText = await response.text(); } catch { throw new GeminiPlanningError(controller.signal.aborted ? 'TIMEOUT' : 'RESPONSE', controller.signal.aborted ? 'Gemini response timed out; outcome may be uncertain.' : 'Gemini response could not be read.'); }
        if (Buffer.byteLength(bodyText, 'utf8') > MAX_RESPONSE_BYTES) throw new GeminiPlanningError('RESPONSE', 'Gemini response exceeded the local size limit.');
        let body: unknown;
        try { body = JSON.parse(bodyText); } catch { throw new GeminiPlanningError('RESPONSE', 'Gemini response was not valid JSON.'); }
        const envelope = z.object({
          candidates: z.array(z.object({
            finishReason: z.string().optional(),
            content: z.object({parts: z.array(z.object({text: z.string().optional()}).passthrough())}).optional(),
          }).passthrough()).min(1),
        }).passthrough().safeParse(body);
        if (!envelope.success) throw new GeminiPlanningError('RESPONSE', 'Gemini response had no usable candidate.');
        const candidate = envelope.data.candidates[0];
        if (candidate.finishReason && candidate.finishReason !== 'STOP') throw new GeminiPlanningError('RESPONSE', 'Gemini stopped before completing the plan; review before any new attempt.');
        const jsonText = candidate.content?.parts.map((part) => part.text ?? '').join('') ?? '';
        if (!jsonText) throw new GeminiPlanningError('RESPONSE', 'Gemini returned no JSON planning text.');
        let generated: unknown;
        try { generated = JSON.parse(jsonText); } catch { throw new GeminiPlanningError('RESPONSE', 'Gemini planning text was not valid JSON.'); }
        try { return assemblePlanningDraft(prompt.input, generated); }
        catch (error) {
          throw new GeminiPlanningError('VALIDATION', error instanceof Error ? error.message : 'Gemini plan failed local validation.');
        }
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
