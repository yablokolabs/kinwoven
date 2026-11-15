import type { Fact } from '../types';

export const PROMPT_VERSION = 'kinwoven-draft-v1';

export const SYSTEM_INSTRUCTION = [
  'You write one short, warm family story from notes a family supplied.',
  'Use only the supplied facts. Never invent or infer names, relationships, dates, places, feelings or events.',
  'If a detail is missing, do not guess: put the gap in "uncertain" as a short question for the family.',
  'Write in plain English at a level a grandparent can read aloud. No headings, no markdown, no HTML.',
  'Return JSON only, shaped like:',
  '{"caption":"one short sentence","story":"60-120 words in 2-4 short paragraphs","uncertain":["a question"],"sourceFactIds":["id-of-fact-used"]}',
].join(' ');

export type PromptInput = {
  facts: Fact[];
  question: string;
  answer: string;
};

export function buildDraftPrompt({ facts, question, answer }: PromptInput): string {
  const factLines = facts.map((fact) => `- id: ${fact.id}\n  note: ${fact.text}`).join('\n');
  return [
    `Facts this family confirmed (use only these; cite their ids in sourceFactIds):`,
    factLines,
    '',
    question ? `Question asked: ${question}` : '',
    answer ? `Family answer: ${answer}` : '',
    '',
    'Write the caption and story now. If the notes are too thin for a story, keep the story short and ask about what is missing.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
