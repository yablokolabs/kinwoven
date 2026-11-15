import { describe, expect, it } from 'vitest';
import { PROMPT_VERSION, SYSTEM_INSTRUCTION, buildDraftPrompt } from './prompt';

describe('draft prompt', () => {
  it('uses the tightened prompt version', () => {
    expect(PROMPT_VERSION).toBe('kinwoven-draft-v3');
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
    expect(prompt).toContain(
      'Family answer (also a confirmed fact; include it in the story): The radio was always on.',
    );
    expect(prompt).toContain('Use the notes and the family answer.');
    expect(prompt).toContain('notes or answer above');
  });

  it('treats the family answer as supplied information, not an uncertainty', () => {
    expect(SYSTEM_INSTRUCTION).toContain('The family answer is also supplied information');
    expect(SYSTEM_INSTRUCTION).toContain('Do not omit the family answer');
    expect(SYSTEM_INSTRUCTION).toContain('move it into "uncertain"');
  });

  it('regression: the tea and radio answer is labeled for inclusion', () => {
    const prompt = buildDraftPrompt({
      facts: [
        { id: 'f1', text: 'The table was in the kitchen' },
        { id: 'f2', text: 'We ate there every Sunday' },
        { id: 'f3', text: 'The blue bowl held apples' },
      ],
      question: 'What do you remember about this day that the photo cannot show?',
      answer: 'The tea was still warm when the radio played our song.',
    });

    expect(prompt).toContain(
      'Family answer (also a confirmed fact; include it in the story): The tea was still warm when the radio played our song.',
    );
    expect(prompt).toContain('Use the notes and the family answer.');
    expect(SYSTEM_INSTRUCTION).not.toContain('Use only the supplied facts. Do not add');
  });
});
