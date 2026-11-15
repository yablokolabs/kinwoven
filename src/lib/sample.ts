import type { DraftSnapshot } from '../types';

/**
 * Synthetic test fixture. Not family material and not model output.
 * Every screen that uses it must say so.
 */
export const SAMPLE_SNAPSHOT: DraftSnapshot = {
  caption: 'Sample story: the kitchen table',
  story:
    'This is a sample story shown so you can try the player. Every detail here is invented for testing. ' +
    'In a real memory, this text comes from the notes a family confirmed, and it stays on this device until they decide to share it. ' +
    'The sample is not family material, and no model wrote it.',
  uncertain: ['Sample only: replace this with questions from your own family.'],
  sourceFactIds: ['sample-fact'],
  photoId: 'sample-photo',
  revision: 1,
};
