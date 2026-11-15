import type { DraftBody, Fact, Provenance } from '../types';
import { PROMPT_VERSION } from './prompt';

export type TemplateInput = {
  facts: Fact[];
  question: string;
  answer: string;
};

function sentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * A plain draft that rearranges the family's own sentences. It is not model
 * output, adds no facts, and is labelled as such everywhere it is shown.
 */
export function templateDraft({ facts, answer }: TemplateInput): {
  body: DraftBody;
  provenance: Provenance;
} {
  if (facts.length === 0) {
    throw new Error('Add at least one note before making a draft.');
  }
  const notes = facts.map((fact) => sentence(fact.text));
  const answerText = answer.trim() ? sentence(answer) : '';
  const storyParts = [...notes, answerText].filter(Boolean);
  const captionSource = facts[0].text.trim().replace(/\s+/g, ' ');
  const caption =
    captionSource.length > 96 ? `${captionSource.slice(0, 93).trimEnd()}...` : captionSource;

  const uncertain: string[] = [];
  if (!facts.some((fact) => /\d{4}/.test(fact.text))) {
    uncertain.push('Do you remember the year this photo was taken?');
  }
  if (!answer.trim()) {
    uncertain.push('What is one thing the photo cannot show?');
  }

  return {
    body: {
      caption: sentence(caption),
      story: storyParts.join(' '),
      uncertain,
      sourceFactIds: facts.map((fact) => fact.id),
    },
    provenance: { kind: 'template', promptVersion: PROMPT_VERSION },
  };
}
