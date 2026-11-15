# Product and implementation

## Product thesis
A photo can preserve a face while losing the story. Relatives living apart may have pictures on their phones, while grandparents hold the details. Kinwoven makes it easy to supply those details, approve a readable story and enjoy it together. ENJOY inspires the family viewing experience; this build adds evidence-linked hybrid AI and a deliberately small grandparent workflow.

## Bounded MVP
1. Select 3–8 JPEG/PNG photos and enter short known facts. Keep originals local. Show one photo at a time.
2. Generate one helpful follow-up question grounded in missing information. Typed answers are the baseline. A relative may help type. Recording, speech recognition and language coverage are stretch work requiring separate proof.
3. Draft brief captions and a 60–120 word story from confirmed facts. Review and edit with clear source references. Ask for missing information instead of inventing it.
4. Approve a specific revision, then play an accessible photo story with large captions, pause, previous and next. AI drafts the words and chapter order; the slideshow uses normal application code. Prepare a printable or downloadable text keepsake if the core flow is complete.
5. Optionally share the approved snapshot to an authenticated family space. Show that upload and cloud inference are different choices.

## Architecture
React + TypeScript + Vite; Firebase JS SDK supporting the current hybrid API; runtime schema validation with a small existing-compatible library; IndexedDB for local media and drafts; service worker for the app shell and deliberately cached local files. Firebase Authentication, Firestore, App Check and Cloud Storage support optional sharing. Firebase Hosting is the proposed web deployment. Verify account, billing and quotas before choosing storage or deployment operations.

Use plain TypeScript modules for inference policy, story validation, IndexedDB and publication snapshots. Keep components small. A local draft should remain usable without a Firebase sign-in. Cloud inference still requires valid configured Firebase/App Check access. Authenticated family sharing has its own access rules.

## Product screens
- Welcome: Start a memory; Try a clearly disclosed sample; privacy explanation.
- Capture: one photo, short known facts and one question. Persistent Back and Save and stop.
- Draft: caption, source facts, uncertain details, Edit and Approve this version.
- Playback: very large captions and three controls, Pause, Previous, Next. Keyboard and accessible names.
- Share: exact approved content preview and selected family. Reconfirm only the actual external sharing action.

Use a warm cream background, dark plum or charcoal text, generous spacing and real family photographs. Target 18–22px body text and 48px or larger controls. Respect reduced motion and focus visibility. No autoplay sound or inferred emotional scores. Avoid account setup before the first local memory.

## Milestones
M0: real device capability and SDK proof. M1: local capture and offline persistence. M2: validated hybrid drafting. M3: review and approved playback. M4: optional authenticated family sharing and rules. M5: usability test, real inference evidence, demo and submission. Native Android begins only after M0–M4 work and hardware is verified. If only one platform is proven, submit only that platform.
