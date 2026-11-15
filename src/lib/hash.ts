import type { DraftSnapshot } from '../types';

export function canonicalSnapshot(snapshot: DraftSnapshot): string {
  return JSON.stringify({
    caption: snapshot.caption,
    story: snapshot.story,
    uncertain: [...snapshot.uncertain],
    sourceFactIds: [...snapshot.sourceFactIds].sort(),
    photoId: snapshot.photoId,
    revision: snapshot.revision,
  });
}

/**
 * Content hash for an approval. Binds the approved words, the sources they cite
 * and the exact photo revision. Uses SHA-256 where available.
 */
export async function hashSnapshot(snapshot: DraftSnapshot): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalSnapshot(snapshot));
  const subtle = globalThis.crypto?.subtle;
  if (subtle) {
    const digest = await subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
  // Non-secure contexts have no SubtleCrypto. Detect accidental edits, not attackers.
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a-${hash.toString(16).padStart(8, '0')}-${bytes.length.toString(16)}`;
}
