# Kinwoven

<p align="center"><img src="assets/logo.png" alt="Kinwoven — Every photo has a story" width="380"></p>

**The photo is saved. The story is still yours to tell.**

Kinwoven helps a family turn one photo and a few remembered details into a short, approved story
and an accessible show. A grandparent sees one photo and one gentle question at a time; the family
confirms the words; playback uses only the version they approved.

## See it work

[Watch the two-minute demo](docs/media/kinwoven-demo.mp4) with sound on. It follows one
synthetic photo from capture to approval, then shows the live on-device and cloud runtime proof,
the App Check rejection/success check and the deployed URL. The photo in the demo and the still
fixtures in `assets/generated/` are AI-generated test material, not family media; the film labels
the photo on screen. The on-device segment is Chrome 157 in a Modal CPU container, not a family
laptop.

The app is live at [kinwoven-proof.web.app](https://kinwoven-proof.web.app).

## Architecture

![Kinwoven architecture: photo and notes in local IndexedDB, on-device drafting by default, SHA-256 approval, an opt-in App Check cloud route, and an explicit share to an immutable published snapshot](docs/diagrams/architecture.png)

[SVG](docs/diagrams/architecture.svg) · [editable diagram source](docs/diagrams/architecture.html)

The left zone never uploads. The dashed route is the only cloud path and is chosen per draft.
Approval binds a revision to a SHA-256 hash. Sharing is a separate, confirmed action that writes
an immutable snapshot for family devices to read.

## Status: on-device and cloud proven

- Working: local capture, notes, question, editable draft, revision-bound approval, story player,
  IndexedDB persistence, and a publishing path for an explicitly approved snapshot.
- Proven on-device: on the live deployed app with its real Firebase project and App Check, Chrome
  157.0.8103.78 on a Modal Linux CPU container completed `On-device draft · on-device Chrome model ·
  25.8s · prompt kinwoven-draft-v3`. The SDK reported `on_device`; the request trace recorded no
  Firebase AI Logic or other cloud inference call. See the
  [proof screenshot](docs/media/on-device-live-v3.png) and
  [sanitized evidence](docs/media/runtime-proof-v3.json).
- Proven cloud: the same deployed app produced `Cloud draft · gemini-3.5-flash-lite · 3.4s · prompt
  kinwoven-draft-v3 · App Check on`; its story includes the tea/radio answer. Replaying the same
  request without `X-Firebase-AppCheck` returned 401 `UNAUTHENTICATED`
  (`Firebase App Check token is invalid.`), while the request with the header returned 200. Tokens
  stayed in browser memory and are not in the evidence. See
  [cloud screenshot](docs/media/cloud-live-v3.png).
- Prompt v3 is deployed at https://kinwoven-proof.web.app. It requires the family answer in the
  story; both live v3 drafts include it. The on-device model still added unsupported day/filler
  wording and a question, which the review card flags for editing.
- Implemented but unproven: anonymous sign-in, Firestore/Storage publishing, and app-level offline
  drafting. The raw Chrome Prompt API completed offline, but the app-level retry timed out.
- Runtime-label caveat: the event wording says “Gemini Nano 4.” The inspected Chrome runtime reports
  `v3Nano` 2025.08.14.1358, component 2025.8.21.1028; no inspected manifest or API response labels it
  Gemini Nano 4. Equivalence is not established, so do not claim that requirement is met.
- The interface and the full local flow (photo, notes, question, draft, approval, playback) were
  rendered and driven in moli 1.1.24 and again in actual Chrome during the on-device proof.
- The plain draft path (`kind: 'template'`) exists so the product stays usable without a model. It is
  labelled in the UI and is not AI output.
- The on-device model can add details not in the notes. Source ids are checked, and the draft screen
  flags a short list of unsupported time, people, feeling and filler words for correction. That check
  is not a semantic fact checker; every draft still needs family reading, editing and approval.

Checks actually run are listed in [docs/PROGRESS.md](docs/PROGRESS.md). The on-device Modal capture
is reproducible with [the probe and runbook](tools/modal-on-device/README.md). Setup for a reviewer
with supported hardware is below.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test
npm run build
```

No Firebase project is needed to try capture, a plain draft, approval and playback on one device.
The app opens straight into the local flow; there is no account step. Model drafting needs the
Firebase values below.

## Connect Firebase (needed for AI drafting and family sharing)

1. Create a Firebase project and register a Web app. Open **AI Services → AI Logic** and follow the
   guided setup; choose the Gemini Developer API for the free tier.
2. Copy the web config into `.env.local` from [.env.example](.env.example). These values are public
   identifiers; no private key belongs in a web app.
3. Register a **reCAPTCHA Enterprise** App Check provider and put its site key in `VITE_APPCHECK_SITE_KEY`. Add the deployed hostname to the reCAPTCHA key; use a debug token for local development instead of adding `localhost`.
   For localhost only, set `VITE_APPCHECK_DEBUG=true`, then register the debug token printed in the
   console under **App Check → Apps → Manage debug tokens**. Never ship that flag.
4. Enable **Authentication → Anonymous**, create a **Firestore** database and a **Cloud Storage**
   bucket. Deploy the rules:

```bash
npx firebase-tools deploy --only firestore:rules,storage
```

5. On-device drafting requires **Chrome on desktop 139+** with the Chrome Prompt API available, per
   the [Firebase hybrid docs](https://firebase.google.com/docs/ai-logic/hybrid/web/get-started).
   Check `await LanguageModel.availability()` before blaming the app.

### Family spaces

Membership documents live at `familySpaces/{spaceId}/members/{uid}`. Create them in the Firebase
console or with an admin script; clients cannot write them. A member must exist before that account
can read or publish stories. Publishing writes
`familySpaces/{spaceId}/stories/{storyId}` and the photo at
`families/{spaceId}/stories/{storyId}/{revision}-{hash}.{jpg|png}`.

## How privacy is enforced

- Photo blobs and drafts are stored in IndexedDB on the device. There is no application upload in
  the local flow.
- The privacy choice applies per draft. The default sends `ONLY_ON_DEVICE`; choosing cloud sends
  `PREFER_ON_DEVICE` and is the only path that can reach a hosted model.
- Every draft records what the SDK reported in `response.inferenceSource`, plus wall-clock duration,
  prompt version and the fact ids cited. A cloud result on a local-only request is treated as an
  error and is not saved.
- Drafts are parsed and bounded by zod before rendering; citations to facts the family never entered
  are rejected. Text renders as text, never as HTML.
- Approvals bind to a revision and a SHA-256 content hash covering the words, cited sources and
  photo id. Any later edit clears the approval, and playback reads only the stored snapshot.
- Writes compare the stored revision first, so a stale tab cannot overwrite a newer revision.

## Project layout

```
src/
  lib/db.ts          IndexedDB memories and photo blobs, revision-guarded writes
  lib/revision.ts    snapshot creation, approval validity, hashing
  lib/inference.ts   Firebase AI Logic hybrid request, readiness, source checking
  lib/policy.ts      privacy choice → InferenceMode, local-only source guard
  lib/prompt.ts      versioned system instruction and fact-only draft prompt
  lib/schema.ts      zod validation of untrusted model output
  lib/factuality.ts  short unsupported-word review for model drafts
  lib/template.ts    labelled non-AI draft from the family's own words
  lib/share.ts       approved-snapshot publishing with a membership preflight
  screens/           Welcome, Capture, Question, Draft, Play, Share
tools/modal-on-device/  reproducible Chrome CPU proof and runbook
firestore.rules      membership-only access; published snapshots are immutable
storage.rules        private family media, member-only, bounded size and type
```

## Known limits

- On-device model drafts can contain unsupported filler. The review card catches a short list of
  common words, not every inference; human editing and approval are required.
- English is the only tested language. No speech capture, native Android, TV app or multilingual
  promise is made.
- Playback uses one photo per memory; multi-photo stories are not built.
- App Check protects cloud access; it is not a substitute for the membership rules.
- `DELETE` of published stories is denied by design. Removing local stories deletes them from this
  device only.

Licensed under the [MIT License](LICENSE).
