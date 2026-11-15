import type { Approval, DraftSnapshot, Memory } from '../types';
import { hashSnapshot } from './hash';

export function snapshotOf(memory: Memory): DraftSnapshot {
  if (!memory.draft) {
    throw new Error('This memory has no draft to approve yet.');
  }
  return {
    caption: memory.draft.caption,
    story: memory.draft.story,
    uncertain: [...memory.draft.uncertain],
    sourceFactIds: [...memory.draft.sourceFactIds],
    photoId: memory.photoId,
    revision: memory.revision,
  };
}

export async function createApproval(memory: Memory, approvedAt = Date.now()): Promise<Approval> {
  const snapshot = snapshotOf(memory);
  return {
    revision: memory.revision,
    contentHash: await hashSnapshot(snapshot),
    approvedAt,
    snapshot,
  };
}

/**
 * An approval stays valid only while it names the current revision, the current
 * content hash matches, and the stored snapshot still equals the live draft.
 */
export async function approvalIsCurrent(memory: Memory): Promise<boolean> {
  const approval = memory.approval;
  if (!approval || !memory.draft) return false;
  if (approval.revision !== memory.revision) return false;
  if (approval.snapshot.revision !== approval.revision) return false;
  const live = snapshotOf(memory);
  if (approval.contentHash !== (await hashSnapshot(live))) return false;
  return (
    approval.snapshot.caption === live.caption &&
    approval.snapshot.story === live.story &&
    approval.snapshot.photoId === live.photoId &&
    approval.snapshot.uncertain.join('\u0000') === live.uncertain.join('\u0000') &&
    [...approval.snapshot.sourceFactIds].sort().join('\u0000') ===
      [...live.sourceFactIds].sort().join('\u0000')
  );
}
