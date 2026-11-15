export type Fact = {
  id: string;
  text: string;
};

/** The part of a draft that is written by a model or built from the family's own words. */
export type DraftBody = {
  caption: string;
  story: string;
  /** Details the draft could not support from the provided facts, phrased as questions. */
  uncertain: string[];
  /** Fact ids the draft is allowed to use. Every entry must exist on the memory. */
  sourceFactIds: string[];
};

export type InferenceSource = 'ON_DEVICE' | 'IN_CLOUD' | 'UNKNOWN';

export type Provenance =
  | {
      kind: 'model';
      mode: 'ONLY_ON_DEVICE' | 'PREFER_ON_DEVICE';
      source: InferenceSource;
      durationMs: number;
      promptVersion: string;
      modelLabel: string;
    }
  | {
      kind: 'template';
      promptVersion: string;
    };

/** Immutable copy of exactly what a family approved. Never mutated after creation. */
export type DraftSnapshot = DraftBody & {
  photoId: string;
  revision: number;
};

export type Approval = {
  revision: number;
  contentHash: string;
  approvedAt: number;
  snapshot: DraftSnapshot;
};

export type Memory = {
  id: string;
  createdAt: number;
  updatedAt: number;
  /** Increments on every content change. Approval only ever points at one revision. */
  revision: number;
  photoId: string;
  facts: Fact[];
  question: string;
  answer: string;
  draft: DraftBody | null;
  provenance: Provenance | null;
  approval: Approval | null;
};

export type MediaAsset = {
  id: string;
  blob: Blob;
  mimeType: string;
  name: string;
  size: number;
};
