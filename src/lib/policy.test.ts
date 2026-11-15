import { describe, expect, it } from 'vitest';
import { assertSourceAllowed, modeForChoice, normalizeInferenceSource } from './policy';
import { templateDraft } from './template';

describe('privacy policy', () => {
  it('maps the default choice to on-device only', () => {
    expect(modeForChoice('local')).toBe('ONLY_ON_DEVICE');
  });

  it('maps the permitted cloud choice to prefer on-device with fallback', () => {
    expect(modeForChoice('cloud')).toBe('PREFER_ON_DEVICE');
  });

  it('normalizes the lowercase SDK source values', () => {
    expect(normalizeInferenceSource('on_device')).toBe('ON_DEVICE');
    expect(normalizeInferenceSource('in_cloud')).toBe('IN_CLOUD');
    expect(normalizeInferenceSource('ON_DEVICE')).toBe('ON_DEVICE');
    expect(normalizeInferenceSource('something-else')).toBe('UNKNOWN');
  });

  it('accepts an on-device result for a local-only draft', () => {
    expect(() => assertSourceAllowed('local', 'ON_DEVICE')).not.toThrow();
    expect(() => assertSourceAllowed('local', normalizeInferenceSource('on_device'))).not.toThrow();
  });

  it('rejects a cloud result for a local-only draft', () => {
    expect(() => assertSourceAllowed('local', 'IN_CLOUD')).toThrow(/stay on this device/);
  });

  it('rejects an unknown source', () => {
    expect(() => assertSourceAllowed('cloud', 'UNKNOWN')).toThrow(/did not report/);
  });

  it('accepts either source when the family allowed cloud for that draft', () => {
    expect(() => assertSourceAllowed('cloud', 'IN_CLOUD')).not.toThrow();
    expect(() => assertSourceAllowed('cloud', 'ON_DEVICE')).not.toThrow();
  });
});

describe('template draft', () => {
  const facts = [
    { id: 'f1', text: 'The table was in the kitchen' },
    { id: 'f2', text: 'We ate there every Sunday' },
  ];

  it('uses every note the family wrote and cites only those ids', () => {
    const { body, provenance } = templateDraft({ facts, question: 'q', answer: '' });
    expect(body.story).toContain('The table was in the kitchen.');
    expect(body.story).toContain('We ate there every Sunday.');
    expect(body.sourceFactIds).toEqual(['f1', 'f2']);
    expect(provenance.kind).toBe('template');
  });

  it('adds no new names, dates or events of its own', () => {
    const { body } = templateDraft({ facts, question: 'q', answer: '' });
    const allowed = new Set(
      `${facts.map((fact) => fact.text).join(' ')} Do you remember the year this photo was taken? What is one thing the photo cannot show?`
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/),
    );
    const words = body.story
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .split(/\s+/);
    expect(words.every((word) => allowed.has(word))).toBe(true);
  });

  it('refuses to draft when there are no notes', () => {
    expect(() => templateDraft({ facts: [], question: 'q', answer: '' })).toThrow(/at least one note/);
  });
});
