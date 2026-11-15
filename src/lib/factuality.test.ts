import { describe, expect, it } from 'vitest';
import { findUnsupportedDetails } from './factuality';

const facts = [
  'The table was in the kitchen.',
  'We ate there every Sunday.',
  'The radio was always on.',
];
const answer = 'The radio was always on. Mum would hum along while she poured the tea.';

describe('findUnsupportedDetails', () => {
  it('flags the exact Sunday-morning invention while keeping supported Sunday', () => {
    const flags = findUnsupportedDetails(
      'A simple Sunday morning tradition is remembered from photographs.',
      'The family ate together at a table in the kitchen every Sunday. The radio was always playing, and Mum would hum along while she poured tea. It is nice to remember the sounds of the day! We appreciate all of your wonderful memories.',
      [...facts, answer],
    );
    const terms = flags.map((flag) => flag.term.toLowerCase());

    expect(terms).toContain('morning');
    expect(terms).toContain('family');
    expect(terms).toContain('remember');
    expect(terms).toContain('wonderful');
    expect(terms).not.toContain('sunday');
    expect(terms).not.toContain('radio');
    expect(terms).not.toContain('mum');
    expect(terms).not.toContain('tea');
  });

  it('does not flag a time of day that the family did provide', () => {
    const flags = findUnsupportedDetails(
      'Sunday morning at the kitchen table.',
      'We had tea in the morning.',
      ['We had tea in the morning.', ...facts],
    );
    expect(flags.map((flag) => flag.term.toLowerCase())).not.toContain('morning');
  });

  it('flags a year that is absent from the notes', () => {
    const flags = findUnsupportedDetails('A 1998 kitchen table.', 'We ate there.', facts);
    expect(flags).toContainEqual({ term: '1998', category: 'date' });
  });

  it('accepts a year that is present in the notes', () => {
    const flags = findUnsupportedDetails(
      'A 1998 kitchen table.',
      'We ate there.',
      [...facts, 'This was 1998.'],
    );
    expect(flags.map((flag) => flag.term)).not.toContain('1998');
  });

  it('returns no flags for text built only from the notes', () => {
    const flags = findUnsupportedDetails(
      'The kitchen table.',
      'The table was in the kitchen. We ate there every Sunday. The radio was always on.',
      [...facts, answer],
    );
    expect(flags).toEqual([]);
  });
});
