# Hybrid inference implementation contract

Read the current official Web get-started and configuration pages in SOURCES.md and pin the tested SDK version in the lockfile. Documentation was checked November 14, 2026. Verify current exports and type definitions before copying examples.

The guide uses `getAI`, `GoogleAIBackend`, `getGenerativeModel` and `InferenceMode` from `firebase/ai`. The documented modes include ONLY_ON_DEVICE, PREFER_ON_DEVICE and ONLY_IN_CLOUD. Model initialization requires user interaction. Follow the official initializeDeviceModel readiness and progress flow. Do not confuse model download with offline readiness.

## Request policy
- Keep on this device: ONLY_ON_DEVICE. If unavailable, explain and offer manual editing or an explicit cloud option. No silent fallback.
- Allow cloud for this draft: PREFER_ON_DEVICE. Consent applies to the displayed photo/notes and revision, not all future memories.
- Testing: ONLY_IN_CLOUD can separately verify cloud setup. Record this as forced cloud proof. Demonstrate actual fallback on an unsupported environment as an additional check.

Use `result.response.inferenceSource` to record ON_DEVICE or IN_CLOUD. Never derive it from the requested mode or network icon. Keep timing from monotonic client measurements. A returned local result does not prove the app made no other network calls; also inspect the request trace and upload behavior.

Start with short text-only tasks using confirmed notes on both execution paths. Images may be added through supported JPEG/PNG input after real capability checks. Never claim video analysis or local audio transcription from this SDK. Validate output schemas on both paths and bound input size. On model failure, preserve notes and allow manual editing. Do not substitute a different AI provider.

The offline demo requires the model already downloaded, app shell and selected photos saved locally, and successful reopening. Test those conditions independently. Do not assume Firestore offline caching contains media blobs or that a service worker caches the model. Record browser, OS, SDK version, hardware, model availability and actual inference source.

App Check is required for Firebase AI Logic per the supplied contest brief. Development debug tokens are private environment material, not public repo configuration. Explain reviewer setup without embedding your debug token. Use approved production attestation for a public hosted demo and verify its enforcement.

## Proof ledger
One record per request: opaque request ID, requested mode, actual inference source, local elapsed time, prompt/schema version, source IDs, success/error and environment. Keep memory content out of diagnostics. Remote diagnostics are opt-in and exclude photo/note content.
