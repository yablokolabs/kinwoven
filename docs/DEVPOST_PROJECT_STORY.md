# Kinwoven — Devpost project story

Verified November 15, 2026. Public source: https://github.com/yablokolabs/kinwoven (MIT).
Live app: https://kinwoven-proof.web.app. Demo: [2:40 film](media/kinwoven-demo.mp4).

## Inspiration

Family photos are easy to save and difficult to turn into something grandparents can comfortably enjoy. The person who remembers why a photo matters may be the person least interested in navigating another complicated app. Kinwoven starts with one photo and one gentle question, so the family's own words become the story. ENJOY's shared family-screen concept inspired the viewing experience.

## What it does

Kinwoven is a web app for one memory at a time. A family chooses a photo, adds a few details they know for certain, and answers one question the photo cannot. Kinwoven shapes those facts into a short caption and story, shows which notes it used and flags wording it cannot support, then lets the family edit and approve. Playback uses only the approved revision; a later edit clears the approval.

The default draft is made on the device. Cloud drafting is a separate, explicit choice for one draft. If the model is unavailable, a clearly labelled plain draft built from the family's own words keeps the flow usable. The local path does not upload the photo or notes. The cloud path sends only the text prompt; the photo remains local in this build.

## How we built it

Kinwoven is a React 19, TypeScript and Vite web app using Firebase AI Logic through `firebase` 13.3.0. The hybrid request uses `getAI`, `GoogleAIBackend`, `getGenerativeModel` and `InferenceMode`. Local-only drafting uses `ONLY_ON_DEVICE`; the family's explicit cloud choice uses `PREFER_ON_DEVICE`. Both paths share the versioned `kinwoven-draft-v3` system instruction and the same structured JSON schema. Model output is parsed and validated with zod before display, and cited fact ids are checked against the notes the family actually entered.

The app records the inference source the SDK reports in `response.inferenceSource`, normalizes it, and displays it. It does not infer the source from the requested mode. A local-only request that reports cloud inference is rejected and nothing is saved. Model initialization follows a user gesture; the UI shows readiness progress during the wait.

Photo blobs and memories live in IndexedDB on the device. Approval binds the words, cited sources and photo id to a SHA-256 content hash and a revision. Writes are revision-guarded. Firebase App Check with reCAPTCHA Enterprise protects the cloud path. Anonymous Auth, Firestore and Storage rules are implemented, but this submission does not claim sign-in or family sharing as verified.

## Runtime proof

Two separate live runs were captured on the deployed app.

- On-device: Chrome 157.0.8103.78 on a Modal Linux CPU container produced `On-device draft · on-device Chrome model · 25.8s · prompt kinwoven-draft-v3`. The SDK reported `on_device`; the request trace recorded no Firebase AI Logic or other cloud inference request. The run used a synthetic fixture, not family media. It ran in a CPU container, not on a family laptop or phone.
- Cloud: the same deployed app produced `Cloud draft · gemini-3.5-flash-lite · 3.4s · prompt kinwoven-draft-v3 · App Check on`, and the story included the family's tea-and-radio answer.
- App Check: replaying the same live request without the `X-Firebase-AppCheck` header returned 401 `UNAUTHENTICATED`; the request with the token returned 200. Token values stayed in browser memory and are not in the evidence.

Evidence: `docs/media/runtime-proof-v3.json`, `docs/media/on-device-live-v3.png` and `docs/media/cloud-live-v3.png`. The 2:40 film includes a dedicated 30-second on-device chapter with the real wait, the returned draft and a zero cloud-request count.

The inspected Chrome runtime reports `v3Nano` 2025.08.14.1358, component 2025.8.21.1028. No inspected manifest or API response labels it "Gemini Nano 4"; equivalence with that marketing name is not established and is not claimed.

## Challenges we ran into

The SDK returned the inference source as lowercase `on_device`, while the first implementation compared against uppercase `ON_DEVICE`. A valid local draft was rejected. The fix normalizes both cases and rejects unknown sources, so the privacy decision still depends on what the SDK reports rather than what the app requested.

Prompt v2 omitted the family answer even though it was present in the request. The system instruction had described only the notes as supplied facts. Prompt v3 labels the answer as a confirmed fact, requires it in the story and forbids moving it into "uncertain"; regression tests cover the contract. The live cloud draft now includes the answer. The on-device draft includes it too, but still adds unsupported day/filler wording and a closing question.

The on-device wait is real: 25.8 seconds on the CPU container. That shaped the interface. The app asks for the model from the button gesture and shows a readiness progress card instead of pretending the draft is instant.

App-level offline drafting remains unresolved. An app-level retry timed out after 300 seconds, although a raw Chrome Prompt API probe completed offline. We report the raw result but do not claim app-level offline drafting as proven.

## Accomplishments that we're proud of

We proved both sides of the hybrid path on the live deployed app, with the actual source reported by the SDK rather than assumed. We also proved that the cloud path is gated by App Check, not merely carrying a token: the same request returned 401 without the header and 200 with it.

The product keeps a grandparent-friendly path through the whole flow: one photo, one question, one draft to read, one approval, one story to play. A model failure does not strand the family; the plain-draft path stays available and is labelled as non-AI. Approval is bound to an immutable revision, so an edit after approval cannot be published or played as the approved version.

The demo shows the on-device run with the real 25.8-second wait, the cloud run, the App Check rejection/success check and the live URL. The synthetic photo is labelled throughout; no family media was used.

## What we learned

Trust needs to be visible. A spinner is not proof, and a requested mode is not proof either. The interface now shows where the draft actually ran, how long it took, which prompt version produced it, and which notes it used. That made the local-versus-cloud distinction something a family can see rather than something the app merely promises.

The same principle applied to mistakes. The on-device model can add details the notes do not support. The review card flags a short list of unsupported time, people, feeling and filler words, but it is not a semantic fact checker. The family still reads and approves the whole draft. The proof also exposed the lowercase-source bug and the omitted-answer prompt bug, both of which are now covered by tests.

This was developer testing, not a family usability study. No claim is made about grandparent task completion or accessibility outcomes without participants.

## What's next for Kinwoven

- Fix app-level offline drafting and test reopening the app and a saved memory across a reload.
- Exercise anonymous sign-in, Firestore and Storage with real family spaces, then test membership checks and publication.
- Improve on-device fidelity and expand the review beyond a short word list.
- Test on supported family hardware, including a laptop and a phone-sized layout.
- Add tested language support, optional voice capture and multi-photo stories only after they work.

## Try it

Open https://kinwoven-proof.web.app. No account or credentials are needed for the core review flow.

For the on-device path, use Chrome desktop 139+ with the built-in Prompt API available. Use a non-private test photo. A synthetic fixture is available at:
https://raw.githubusercontent.com/yablokolabs/kinwoven/main/assets/generated/kitchen-table.jpg

1. Click "Start a memory" and choose the test photo.
2. Enter these notes, one per line:
   - The table was in the kitchen
   - We ate there every Sunday
   - The radio was always on
3. Click "Next: one question" and enter:
   The tea was still warm when the radio played our song.
4. Keep "Keep on this device" selected and click "Make my draft". The first run may take tens of seconds while Chrome prepares the model. The draft header should read "On-device draft · on-device Chrome model · ... · prompt kinwoven-draft-v3". In Chrome DevTools → Network, filtering for "firebasevertexai" should show no generateContent request for this draft.
5. Edit if needed, click "Approve this version", then "Play our story".
6. For the cloud path, start a new memory, repeat steps 2–3, select "Allow cloud for this draft" and click "Make my draft". The header should read "Cloud draft · gemini-3.5-flash-lite · ... · App Check on".

If the on-device model is unavailable, the app offers "Use a plain draft from my words instead"; it does not silently fall back to the cloud. Family sharing is outside this review build.

## Verified limits

- The on-device capture is Chrome 157 in a Modal CPU container, not a family laptop or phone.
- The on-device draft still adds some unsupported wording and a question. The review flags a short word list, not every inference; family editing and approval remain required.
- The cloud path is proven; app-level offline drafting, anonymous sign-in and Firestore/Storage publishing are not.
- English is the only tested language. There is no speech capture, native Android app, TV app or multi-photo story.
- The runtime label is `v3Nano`; "Gemini Nano 4" equivalence is not established.
