import { describe, expect, it } from 'vitest';
import { DraftValidationError, extractJsonObject, parseDraftBody } from './schema';

const valid = {
  caption: 'A Sunday at the table',
  story: 'We ate there every Sunday. The radio was always on.',
  uncertain: ['Do you remember the year?'],
  sourceFactIds: ['f1', 'f2'],
};

describe('parseDraftBody', () => {
  it('accepts a well formed draft and keeps only known sources', () => {
    const parsed = parseDraftBody(valid, ['f1', 'f2', 'f3']);
    expect(parsed.story).toContain('radio');
    expect(parsed.sourceFactIds).toEqual(['f1', 'f2']);
  });

  it('rejects a citation to a fact the family never entered', () => {
    expect(() => parseDraftBody({ ...valid, sourceFactIds: ['f1', 'made-up'] }, ['f1'])).toThrow(
      DraftValidationError,
    );
  });

  it('rejects a draft with no sources', () => {
    expect(() => parseDraftBody({ ...valid, sourceFactIds: [] }, ['f1'])).toThrow(DraftValidationError);
  });

  it('rejects an empty story', () => {
    expect(() => parseDraftBody({ ...valid, story: '   ' }, ['f1'])).toThrow(DraftValidationError);
  });

  it('rejects an overlong story instead of rendering it', () => {
    expect(() => parseDraftBody({ ...valid, story: 'a'.repeat(1501) }, ['f1'])).toThrow(
      DraftValidationError,
    );
  });

  it('rejects non-string content', () => {
    expect(() => parseDraftBody({ ...valid, caption: 42 }, ['f1'])).toThrow(DraftValidationError);
  });
});

describe('extractJsonObject', () => {
  it('tolerates code fences and surrounding chatter', () => {
    const wrapped = 'Here is the draft:\n```json\n{"caption":"c","story":"s"}\n```\nEnjoy.';
    expect(extractJsonObject(wrapped)).toEqual({ caption: 'c', story: 's' });
  });

  it('throws when there is no object', () => {
    expect(() => extractJsonObject('no json here')).toThrow(DraftValidationError);
  });
});
