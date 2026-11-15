# Acceptance and proof

## Runtime and privacy
- Supported real Chrome: initialize the device model from a user gesture, wait for readiness, run the local-only caption task, record ON_DEVICE. Use trace evidence to confirm no application media upload/cloud inference.
- Offline: previously prepared app and memory reopen, local inference succeeds, edits persist, approved story plays. If any part is unsupported, show the actual limitation.
- Cloud: App Check-enabled Firebase AI Logic returns IN_CLOUD on a permitted request. Separately test PREFER_ON_DEVICE fallback on unsupported hardware.
- Unsupported model + local-only: useful error and manual draft path, zero cloud fallback.
- Consent withdrawn before request: request never sent. Cancellation after sending cannot recall remote input; UI states what happened.

## Correctness and access
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
