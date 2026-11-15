# Acceptance and proof

## Runtime and privacy
- Supported real Chrome: initialize the device model from a user gesture, wait for readiness, run the local-only caption task, record ON_DEVICE. Use trace evidence to confirm no application media upload/cloud inference.
- Offline: previously prepared app and memory reopen, local inference succeeds, edits persist, approved story plays. If any part is unsupported, show the actual limitation.
- Cloud: App Check-enabled Firebase AI Logic returns IN_CLOUD on a permitted request. Separately test PREFER_ON_DEVICE fallback on unsupported hardware.
- App Check enforcement, run Nov 15, 2026: replaying the same live v3 Gemini request body and headers without `X-Firebase-AppCheck` returned 401 `UNAUTHENTICATED` (`Firebase App Check token is invalid.`). The same request with the token returned 200. No enforcement setting was changed. Token values stayed in browser memory and are not in the evidence.
- Live v3 run, Nov 15, 2026: on the deployed app, Chrome 157.0.8103.78 on a Modal CPU container produced `On-device draft · on-device Chrome model · 25.8s · prompt kinwoven-draft-v3`; the SDK reported `on_device`, the tea/radio answer was present, and no cloud inference request was recorded. The same app produced `Cloud draft · gemini-3.5-flash-lite · 3.4s · prompt kinwoven-draft-v3 · App Check on`. The on-device draft still added unsupported day/filler wording and a question; the review card flags some of it. Sanitized evidence: `docs/media/runtime-proof-v3.json`.
- Runtime label, Nov 15, 2026: Chrome reports `v3Nano` 2025.08.14.1358, component 2025.8.21.1028. No inspected manifest or API response labels it “Gemini Nano 4”; equivalence is not established and is not claimed.
- Unsupported model + local-only: useful error and manual draft path, zero cloud fallback.
- Consent withdrawn before request: request never sent. Cancellation after sending cannot recall remote input; UI states what happened.

## Correctness and access
- Tea/radio omission, run Nov 15, 2026: the v2 request included `Family answer: The tea was still warm when the radio played our song.`, but the system instruction defined only note facts as supplied facts and the closing prompt referred to `the facts above`. The model omitted the answer and asked about the song instead. Prompt v3 labels the answer as a confirmed fact, requires it in the story and forbids moving it into `uncertain`; `src/lib/prompt.test.ts` covers that contract. The live v3 cloud draft now includes `The tea was still warm when the radio played our song.` The live v3 on-device draft also includes the answer but repeats it and adds a closing question, so the on-device factuality limit remains.
- Sunday-morning regression, run Nov 15, 2026: notes were `The table was in the kitchen.`, `We ate there every Sunday.` and `The radio was always on.`; the answer added that Mum hummed while pouring tea. The v1 on-device draft returned `A simple Sunday morning tradition...` and added generic praise. Source IDs were valid, so the schema could not catch it. Prompt v2 explicitly forbids expanding Sunday into a time of day and the deterministic review flags unsupported words; the v2 capture removed `morning`, kept `Sunday`, and flagged `day`, `family`, `remember` and `photo`. The review is a word list, not a semantic proof; a family still reads and approves. Keep this exact fixture in the regression set.
- Unknown people/date: draft omits specifics and asks a question.
- Invented source IDs/malformed JSON: rejected; no automatic publication.
- Edit after approval: old approval cannot publish the new draft.
- Concurrent revisions and retried publication: consistent immutable snapshot and no duplicate publication.
- Family outsider access and role escalation fail in rules emulator.
- Photo corrupted, storage full or upload interrupted: preserve original and explain recovery.

## Grandparent usability
Ask a consenting older relative to select a photo, answer one question, correct a caption and play the approved story. Observe first without coaching. Record task completion, assistance needed and unclear labels. Report actual results and sample size, not generalized accessibility claims. If no participant is available, label the inspection as developer testing.

Use a 12-case factual fixture set with missing dates, ambiguous relationships, contradictory notes, no text, long notes and prompt injection. Include the exact Sunday-morning case above. Run on local and cloud and report schema success, groundedness review, latency and corrections. Do not claim representative model performance from 12 cases. Separate fixtures from consented family demonstrations.
