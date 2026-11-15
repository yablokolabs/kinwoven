export class RevisionConflictError extends Error {
  constructor(
    readonly storedRevision: number,
    readonly expectedRevision: number,
  ) {
    super(
      `This story changed elsewhere (stored revision ${storedRevision}, expected ${expectedRevision}).`,
    );
    this.name = 'RevisionConflictError';
  }
}

/**
 * Refuses to overwrite a newer revision. A write may only proceed when the caller
 * built its change on top of the revision the store currently holds.
 */
export function assertExpectedRevision(current: number, expected: number): void {
  if (current !== expected) {
    throw new RevisionConflictError(current, expected);
  }
}
