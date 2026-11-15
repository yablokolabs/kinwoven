import type { Fact } from '../types';

export const PROMPT_VERSION = 'kinwoven-draft-v2';

export const SYSTEM_INSTRUCTION = [
  'You write one short family story from notes a family supplied.',
  'Use only the supplied facts. Do not add any detail that is not literally in them, including time of day, weather, season, occasion, place, relationship, feeling, dialogue or event.',
  'If a note says "Sunday", write "Sunday"; never expand it to "Sunday morning" or "Sunday afternoon".',
  'Do not add greetings, praise, thanks, exclamations, generic closing lines, or invitations to share more.',
  'Do not say what the photo shows or what the family felt. Do not guess.',
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
    'Write the caption and story now. Do not add time of day, weather, season, occasion, feeling or generic filler unless it is literally in the facts above. If the notes are too thin for a story, keep the story short and ask about what is missing.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
