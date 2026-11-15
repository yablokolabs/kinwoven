import { z } from 'zod';
import type { DraftBody } from '../types';

export class DraftValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DraftValidationError';
  }
}

const draftSchema = z.object({
  caption: z.string().trim().min(1).max(160),
  story: z.string().trim().min(1).max(1500),
  uncertain: z.array(z.string().trim().min(1).max(240)).max(6),
  sourceFactIds: z.array(z.string().min(1)).min(1).max(12),
});

/** Pulls the first JSON object out of model text, tolerating code fences and chatter. */
export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new DraftValidationError('The draft did not contain a JSON object.');
  }
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    throw new DraftValidationError('The draft was not valid JSON.');
  }
}

/**
 * AI output is untrusted data. Fields and length are checked, and every cited
 * source must be a fact the family actually entered.
 */
export function parseDraftBody(raw: unknown, validFactIds: string[]): DraftBody {
  const parsed = draftSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DraftValidationError(
      `The draft did not match the expected shape${first ? ` (${first.path.join('.') || 'root'}: ${first.message})` : ''}.`,
    );
  }
  const unknownSources = parsed.data.sourceFactIds.filter((id) => !validFactIds.includes(id));
  if (unknownSources.length > 0) {
    throw new DraftValidationError('The draft cited a detail that is not in your notes.');
  }
  return {
    ...parsed.data,
    sourceFactIds: [...new Set(parsed.data.sourceFactIds)],
  };
}
