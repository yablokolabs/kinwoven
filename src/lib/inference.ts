import type { DraftBody, Provenance } from '../types';
import { cloudModel, isFirebaseConfigured } from './config';
import { getFirebaseApp } from './firebase';
import {
  assertSourceAllowed,
  modeForChoice,
  normalizeInferenceSource,
  type PrivacyChoice,
} from './policy';
import { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildDraftPrompt } from './prompt';
import { extractJsonObject, parseDraftBody } from './schema';
import type { PromptInput } from './prompt';

export class InferenceUnavailableError extends Error {
  constructor(
    message: string,
    readonly code: 'not-configured' | 'device-unavailable' | 'app-check',
  ) {
    super(message);
    this.name = 'InferenceUnavailableError';
  }
}

export type AiDraftInput = PromptInput & {
  choice: PrivacyChoice;
  onProgress?: (fraction: number) => void;
};

export type AiDraftResult = {
  body: DraftBody;
  provenance: Provenance;
};

/**
 * Requests one draft through Firebase AI Logic's hybrid InferenceMode.
 * Local-only requests use ONLY_ON_DEVICE and are checked against the source the
 * SDK reports, so a fallback can never be mistaken for on-device work.
 */
export async function draftWithAi({
  facts,
  question,
  answer,
  choice,
  onProgress,
}: AiDraftInput): Promise<AiDraftResult> {
  if (!isFirebaseConfigured) {
    throw new InferenceUnavailableError(
      'Model drafting needs this app connected to a Firebase project. Until then you can use a plain draft built from your own words.',
      'not-configured',
    );
  }

  const [{ getAI, getGenerativeModel, GoogleAIBackend, InferenceMode, Schema }, app] =
    await Promise.all([import('firebase/ai'), getFirebaseApp()]);

  const draftResponseSchema = Schema.object({
    properties: {
      caption: Schema.string(),
      story: Schema.string(),
      uncertain: Schema.array({ items: Schema.string() }),
      sourceFactIds: Schema.array({ items: Schema.string() }),
    },
  });

  const ai = getAI(app, { backend: new GoogleAIBackend() });
  const mode = modeForChoice(choice);
  const model = getGenerativeModel(ai, {
    mode:
      mode === 'ONLY_ON_DEVICE'
        ? InferenceMode.ONLY_ON_DEVICE
        : InferenceMode.PREFER_ON_DEVICE,
    inCloudParams: {
      model: cloudModel,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: draftResponseSchema,
      },
    },
    onDeviceParams: {
      promptOptions: { responseConstraint: draftResponseSchema },
      createOptions: {
        expectedInputs: [{ type: 'text', languages: ['en'] }],
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [
          { role: 'system', content: [{ type: 'text', value: SYSTEM_INSTRUCTION }] },
        ],
      },
    },
  });

  // Must follow a user gesture. Awaited for local-only work so the model is ready.
  const ready = model.initializeDeviceModel((progress) => onProgress?.(progress));
  if (choice === 'local') {
    await ready;
  } else {
    void ready.catch(() => undefined);
  }

  const startedAt = performance.now();
  const result = await model.generateContent(
    buildDraftPrompt({ facts, question, answer }),
  );
  const durationMs = Math.round(performance.now() - startedAt);

  const source = normalizeInferenceSource(result.response.inferenceSource);
  assertSourceAllowed(choice, source);

  const text = result.response.text();
  const body = parseDraftBody(extractJsonObject(text), facts.map((fact) => fact.id));

  return {
    body,
    provenance: {
      kind: 'model',
      mode,
      source,
      durationMs,
      promptVersion: PROMPT_VERSION,
      modelLabel: source === 'IN_CLOUD' ? cloudModel : 'on-device Chrome model',
    },
  };
}
