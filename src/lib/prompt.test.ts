import { describe, expect, it } from 'vitest';
import { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildDraftPrompt } from './prompt';

describe('draft prompt', () => {
  it('uses the tightened prompt version', () => {
    expect(PROMPT_VERSION).toBe('kinwoven-draft-v2');
  });

  it('forbids expanding Sunday into a time of day', () => {
    expect(SYSTEM_INSTRUCTION).toContain('Sunday morning');
    expect(SYSTEM_INSTRUCTION).toContain('Do not add any detail');
  });

  it('passes every confirmed note and its id to the model', () => {
    const prompt = buildDraftPrompt({
      facts: [
        { id: 'f1', text: 'The table was in the kitchen.' },
        { id: 'f2', text: 'We ate there every Sunday.' },
      ],
      question: 'What do you remember?',
      answer: 'The radio was always on.',
    });
    expect(prompt).toContain('id: f1');
    expect(prompt).toContain('The table was in the kitchen.');
    expect(prompt).toContain('Family answer: The radio was always on.');
  });
});
