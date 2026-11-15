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
 * The SDK reports lowercase source values such as "on_device". Normalize the
 * value before policy checks or display so a valid local result is not lost.
 */
export function normalizeInferenceSource(raw: unknown): InferenceSource {
  if (typeof raw !== 'string') return 'UNKNOWN';
  switch (raw.trim().toLowerCase()) {
    case 'on_device':
    case 'on-device':
      return 'ON_DEVICE';
    case 'in_cloud':
    case 'in-cloud':
      return 'IN_CLOUD';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Runtime check on what the SDK reports it actually used. A local-only request
 * that reports cloud inference is a failure, not a silent downgrade. An
 * unknown source is also rejected because it cannot support a privacy claim.
 */
export function assertSourceAllowed(choice: PrivacyChoice, actual: InferenceSource): void {
  if (actual === 'UNKNOWN') {
    throw new Error(
      'The model did not report where this draft ran. Nothing was saved. Please try again.',
    );
  }
  if (isLocalOnly(choice) && actual !== 'ON_DEVICE') {
    throw new Error(
      'This draft was set to stay on this device, but inference did not run on the device. Nothing was saved.',
    );
  }
}
