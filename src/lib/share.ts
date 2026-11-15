import type { Memory } from '../types';
import { isFirebaseConfigured } from './config';
import { getMedia } from './db';
import { getFirebaseApp } from './firebase';
import { approvalIsCurrent, snapshotOf } from './revision';

export class ShareError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShareError';
  }
}

export type ShareResult = {
  spaceId: string;
  contentHash: string;
};

/**
 * Publishes exactly one approved revision. Refuses when the approval is stale,
 * the photo is missing, or the signed-in account is not a member of the space.
 */
export async function shareApprovedStory(memory: Memory, spaceId: string): Promise<ShareResult> {
  const trimmedSpace = spaceId.trim();
  if (!trimmedSpace) throw new ShareError('Enter the family space name first.');
  if (!isFirebaseConfigured) {
    throw new ShareError(
      'Family sharing needs this app connected to a Firebase project with Authentication, Firestore, Storage and App Check.',
    );
  }
  if (!memory.approval) throw new ShareError('Approve a version before sharing it.');
  if (!(await approvalIsCurrent(memory))) {
    throw new ShareError('This version is out of date. Review and approve the current draft.');
  }

  const snapshot = memory.approval.snapshot;
  const asset = await getMedia(memory.photoId);
  if (!asset) throw new ShareError('The photo for this story is missing on this device.');
  const expectedSnapshot = snapshotOf(memory);
  if (expectedSnapshot.revision !== snapshot.revision) {
    throw new ShareError('This version is out of date. Review and approve the current draft.');
  }

  const app = await getFirebaseApp();
  const [{ getAuth, signInAnonymously }, { getFirestore, doc, getDoc, setDoc, serverTimestamp }, storageModule] =
    await Promise.all([
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/storage'),
    ]);

  const auth = getAuth(app);
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ShareError('A sign-in is required to share with family.');

  const db = getFirestore(app);
  const membership = await getDoc(doc(db, 'familySpaces', trimmedSpace, 'members', uid));
  if (!membership.exists()) {
    throw new ShareError(
      'This account is not a member of that family space yet. Ask the space owner to add you.',
    );
  }

  const storage = storageModule.getStorage(app);
  const mediaPath = `families/${trimmedSpace}/stories/${memory.id}/${snapshot.revision}-${memory.approval.contentHash.slice(0, 12)}.${asset.mimeType === 'image/png' ? 'png' : 'jpg'}`;
  await storageModule.uploadBytes(storageModule.ref(storage, mediaPath), asset.blob, {
    contentType: asset.mimeType,
    cacheControl: 'private, max-age=0',
  });

  await setDoc(doc(db, 'familySpaces', trimmedSpace, 'stories', memory.id), {
    snapshot,
    approvedRevision: snapshot.revision,
    contentHash: memory.approval.contentHash,
    mediaPath,
    publishedAt: serverTimestamp(),
    publishedBy: uid,
  });

  return { spaceId: trimmedSpace, contentHash: memory.approval.contentHash };
}
