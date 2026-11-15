import { describe, expect, it } from 'vitest';
import type { Memory } from '../types';
import { RevisionConflictError, assertExpectedRevision } from './concurrency';
import { hashSnapshot } from './hash';
import { approvalIsCurrent, createApproval, snapshotOf } from './revision';

function memory(overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'm1',
    createdAt: 1,
    updatedAt: 1,
    revision: 4,
    photoId: 'photo-1',
    facts: [
      { id: 'f1', text: 'The table was in the kitchen.' },
      { id: 'f2', text: 'We ate there every Sunday.' },
    ],
    question: 'What do you remember?',
    answer: 'The radio was always on.',
    draft: {
      caption: 'Sunday at the kitchen table',
      story: 'The table was in the kitchen. We ate there every Sunday. The radio was always on.',
      uncertain: ['Do you remember the year?'],
      sourceFactIds: ['f1', 'f2'],
    },
    provenance: { kind: 'template', promptVersion: 'kinwoven-draft-v1' },
    approval: null,
    ...overrides,
  };
}

describe('approval binding', () => {
  it('binds an approval to the revision it saw', async () => {
    const m = memory();
    const approval = await createApproval(m, 123);
    const approved = { ...m, approval };
    expect(approval.revision).toBe(4);
    expect(await approvalIsCurrent(approved)).toBe(true);
  });

  it('invalidates the approval when a later edit changes the words', async () => {
    const m = memory();
    const approved = { ...m, approval: await createApproval(m) };
    const edited: Memory = {
      ...approved,
      revision: approved.revision + 1,
      draft: approved.draft ? { ...approved.draft, story: `${approved.draft.story} We stayed late.` } : null,
    };
    expect(await approvalIsCurrent(edited)).toBe(false);
  });

  it('invalidates the approval when only the photo changes', async () => {
    const m = memory();
    const approved = { ...m, approval: await createApproval(m) };
    const newPhoto: Memory = { ...approved, revision: approved.revision + 1, photoId: 'photo-2' };
    expect(await approvalIsCurrent(newPhoto)).toBe(false);
  });

  it('keeps the approved snapshot intact after the draft is edited', async () => {
    const m = memory();
    const approved = { ...m, approval: await createApproval(m) };
    approved.draft!.story = 'Something else entirely.';
    expect(approved.approval!.snapshot.story).toContain('The radio was always on.');
    expect(await approvalIsCurrent(approved)).toBe(false);
  });

  it('changes the hash when a cited source changes', async () => {
    const a = await hashSnapshot(snapshotOf(memory()));
    const b = await hashSnapshot(
      snapshotOf(
        memory({
          draft: { ...memory().draft!, sourceFactIds: ['f1'] },
        }),
      ),
    );
    expect(a).not.toBe(b);
  });
});

describe('revision guard', () => {
  it('refuses to overwrite a newer revision', () => {
    expect(() => assertExpectedRevision(5, 4)).toThrow(RevisionConflictError);
  });

  it('allows a write built on the stored revision', () => {
    expect(() => assertExpectedRevision(4, 4)).not.toThrow();
  });

  it('allows only creation at revision zero for a new memory', () => {
    expect(() => assertExpectedRevision(0, 0)).not.toThrow();
    expect(() => assertExpectedRevision(0, 3)).toThrow(RevisionConflictError);
  });
});
