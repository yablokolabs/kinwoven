import type { InferenceSource } from '../types';

export type PrivacyChoice = 'local' | 'cloud';

export type HybridMode = 'ONLY_ON_DEVICE' | 'PREFER_ON_DEVICE';

/** Default is local. Cloud is only ever used when the family picks it for this draft. */
export function modeForChoice(choice: PrivacyChoice): HybridMode {
  return choice === 'cloud' ? 'PREFER_ON_DEVICE' : 'ONLY_ON_DEVICE';
}

export function isLocalOnly(choice: PrivacyChoice): boolean {
  return choice === 'local';
}

/**
 * Runtime check on what the SDK reports it actually used. A local-only request
 * that reports cloud inference is a failure, not a silent downgrade.
 */
export function assertSourceAllowed(choice: PrivacyChoice, actual: InferenceSource): void {
  if (isLocalOnly(choice) && actual !== 'ON_DEVICE') {
    throw new Error(
      'This draft was set to stay on this device, but inference did not run on the device. Nothing was saved.',
    );
  }
}
