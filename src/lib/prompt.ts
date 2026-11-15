import type { Fact } from '../types';

export const PROMPT_VERSION = 'kinwoven-draft-v3';

export const SYSTEM_INSTRUCTION = [
  'You write one short family story from notes a family supplied.',
  'Use only the supplied facts and the family answer. The family answer is also supplied information, not a gap. Do not add any detail that is not literally in them, including time of day, weather, season, occasion, place, relationship, feeling, dialogue or event.',
  'If a note says "Sunday", write "Sunday"; never expand it to "Sunday morning" or "Sunday afternoon".',
  'Do not add greetings, praise, thanks, exclamations, generic closing lines, or invitations to share more.',
  'Do not say what the photo shows or what the family felt. Do not guess.',
  'Do not omit the family answer or move it into "uncertain"; it is already known. If a different detail is missing, do not guess: put that gap in "uncertain" as a short question for the family.',
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
    `Facts this family confirmed (use only these and the family answer; cite note ids in sourceFactIds):`,
    factLines,
    '',
    question ? `Question asked: ${question}` : '',
    answer ? `Family answer (also a confirmed fact; include it in the story): ${answer}` : '',
    '',
    'Write the caption and story now. Use the notes and the family answer. Do not add time of day, weather, season, occasion, feeling or generic filler unless it is literally in the notes or answer above. If the notes are too thin for a story, keep the story short and ask about what is missing.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
