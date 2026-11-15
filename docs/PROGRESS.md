# Persistent progress

Build status: developer-ready application implemented; live model inference, Firebase setup, hardware tests, user testing, deployment and submission remain pending.

Public release, Nov 15, 2026: published the source, docs and demo at
https://github.com/yablokolabs/kinwoven on the public `main` branch. Pre-push audit found no
`.env.local` (only `.env.example` placeholders), no private transcripts, family media or signed links;
the synthetic photos stay labelled, and `dist/`, `demo/out/`, `demo/stills/`, `.DS_Store` and
`demo/public/narration.wav` are ignored. Removed the unused "Built with care" line from
`demo/src/scenes/Outro.tsx`. The rendered outro comes from `demo/src/scenes/Video.tsx`; frame 126 s
shows only the brand, promise, local-first chip and synthetic-photo disclosure, with no footer or tool
attribution. Checks before the push: `npm run typecheck` exit 0, 24/24 tests, `npm run build` exit 0,
demo `npx tsc -p .` exit 0. No video re-render was needed because the rendered component did not change.

- [x] Scope grandparent-friendly memory story and hybrid inference behavior.
- [x] Prepare build, privacy, evaluation and demo guidance.
- [ ] M0 — prove actual local and cloud SDK requests.
- [ ] M1 — accessible capture and offline local persistence. Built; capture flow exercised in moli, reopening across a reload not yet tested.
- [ ] M2 — factual, source-linked hybrid drafts. Built with schema and source checks; live model inference still unproven.
- [ ] M3 — revision approval and story playback. Built; approval and invalidation unit-tested, player driven in moli.
- [ ] M4 — explicit authenticated family sharing and access checks.
- [ ] M5 — real usability evaluation, demo and submission artifacts.

Next action: run the M0 proof on supported Chrome hardware, then test offline reopening. Name availability remains unverified.

Attribution audit, Nov 14, 2026: repository contains documentation and brand PNGs only, no application UI. Searched README, all docs and asset notes for footer, powered-by, badge, credit and copyright text. No footer attribution exists; the product rule is recorded in AGENTS.md and asset credits stay in docs/SOURCES.md and assets/README.md. Both brand PNGs were downscaled and viewed: logo carries only the wordmark and tagline, icon only the mark, no footer or credit text baked in.

Build environment, Nov 14, 2026: moli 1.1.24 headless browser installed at /root/.local/bin/moli (CLI fetch verified; file:// URLs need an explicit capability grant, so local pages are served over 127.0.0.1). Playwright browser binaries chromium-1148 and chromium_headless_shell-1148 are present, but no chrome/chromium executable is on PATH. Lightpanda and firecrawl are not installed; Firecrawl also needs a hosted API key and is not used. Python 3 and Node 20+ available; ImageMagick, Pillow and ffmpeg are absent.

## Checkpoint — Nov 14, 2026 (implementation)

Implemented: React + TypeScript + Vite application with IndexedDB photo and memory storage; capture, question, editable draft, approval and playback screens; explicit family share screen behind configuration; Firebase AI Logic hybrid module using `ONLY_ON_DEVICE` by default and `PREFER_ON_DEVICE` only when the family allows cloud for that draft; `initializeDeviceModel()` after the button gesture and awaited for local-only work; `response.inferenceSource`, duration, prompt version and source fact ids recorded and displayed; zod validation of model output with source-reference checking; SHA-256 approval bound to revision, words, sources and photo id; revision-guarded writes; Firestore and Storage rules; MIT license; `.env.example`; README setup and reviewer notes.

Checks actually run: `npm install` exit 0 (220 packages; npm warned EBADENGINE for `@firebase/storage-compat` requiring Node >=24.12 while this machine runs Node 22.23.5 — browser bundles unaffected, noted as a risk); `npm run typecheck` exit 0; `npm test` 24/24 passed across approval binding, invalidation, conflict guard, schema rejection and policy mapping; `npm run build` exit 0 (155 modules, dist emitted); built app served with `vite preview` and rendered in moli 1.1.24, where a scripted run completed photo upload, notes, question, plain-draft fallback, approval and playback. The accessibility tree reported the Story player with the approved caption, capture and player images both loaded the uploaded PNG at natural width 2172, and IndexedDB then held one memory and one photo. The fixture was the brand PNG copied into `dist/` for that run, not family material. An earlier run appeared to show a broken photo, but the harness had fetched a missing path and received 614 bytes of `index.html` labelled as an image; the corrected run used real PNG bytes. Entry chunk contains no Firebase backend strings, consistent with lazy Firebase loading. Rendered screens show no footer attribution.

UI refresh, Nov 14, 2026: replaced the stylesheet with a warmer editorial system — sticky blurred masthead with a local-only chip, four-step progress rail on photo/question/draft/play, oversized pill actions, tactile privacy tiles with custom radios, framed photos using `contain` so nothing is cropped, and a player with slide dots, grouped controls and a 9 s autoplay progress line. All motion respects `prefers-reduced-motion`; labels, copy, approval rules and data flow are unchanged. Verified with `npm run typecheck` exit 0, `npm test` 24/24, `npm run build` exit 0, and moli 1.1.24 full-page renders of welcome, capture, draft and player at the default desktop viewport, including an uploaded PNG fixture showing uncropped in both draft and player. Not visually checked at phone width (moli exposes no viewport flag) and no automated contrast measurement was run.

Demo package, Nov 14, 2026: installed the requested `ui-ux-futuristic-designer` skill via skillfish and applied its glass, depth and multi-layer-shadow principles to Kinwoven's warm palette. The masthead now uses `assets/icon.png` through `public/icon.png` (and `assets/logo.png` heads the README). Added `docs/diagrams/architecture.{html,svg,png}`, generated with `cathrynlavery/diagram-design`; its `self_check.py` reports OK and the PNG was exported at 2x (2360×1442) with Playwright. Added three synthetic photographs under `assets/generated/`, labelled there and in the demo. Built `demo/`, a Remotion project from `yablokolabs/remotion-video-skill`: eight scenes, 130 s timeline, screenshots captured from the running app at 1920×1080, and narration spoken locally with piper `en_GB-jenny_dioco-medium` (129.4 s track, no speed-ups or truncation). Verified: `npx tsc -p demo` exit 0, stills reviewed twice and corrected for chapter-bar overlap and a mid-entrance approval card. Final MP4 render: 1920×1080 H.264, AAC stereo, 130.0 s, 38.7 MB, mean audio −18.8 dB and peak −2.9 dB; delivered at `docs/media/kinwoven-demo.mp4` and linked from the README. Frames were re-extracted from the encoded file and inspected.

UI futuristic pass 2, Nov 15, 2026: moved the soft-tech skin into a twilight archive direction rather than another light editorial pass. The page now sits on deep plum space with a dotted field, slow orbital rings, warm gold and clay light, a rotating luminous ring around the logo, a filled glowing step circuit, dark glass cards and fields, ivory-to-gold primary actions, holographic photo corner brackets, and a HUD-style corner mark. Labels, copy, reading order, approval rules and data flow are unchanged; reduced motion disables the orbit, status ping and screen rise. Verified with `npm run typecheck` exit 0, `npm test` 24/24 and `npm run build` exit 0. No automated contrast measurement or browser visual review was run this pass; phone-width layout remains unverified.

UI recapture and demo re-render, Nov 15, 2026: recaptured `welcome`, `capture`, `question`, `draft` and `play` at 1920×1080 from the running app in Chrome for Testing 159 through Playwright, using the same synthetic kitchen-table photo, three notes, tea/radio answer and labelled plain-draft path as the previous demo. The draft frame keeps the source-notes card, plain-draft provenance line and approval controls in view. Re-rendered the Remotion film with the existing narration and timeline. Verified `npx tsc -p .` in `demo/` exit 0; preview stills at 30, 48, 65 and 85 s reviewed before the full render; frames from the encoded file at 30, 48, 65, 85, 100 and 122 s reviewed after it. Final MP4: 130.005 s, 1920×1080 H.264 at 30 fps, AAC stereo 48 kHz, 56,055,603 bytes (3.45 Mb/s), mean audio −18.8 dB and peak −2.9 dB; full decode exit 0. Delivered at `docs/media/kinwoven-demo.mp4`; the screenshot PNGs in `demo/public/shots/` are replaced with the twilight UI captures. No browser visual review at phone width and no automated contrast measurement were run.

Not proven: no Chrome 139+ on this machine, so no on-device model inference and no `ON_DEVICE` result; no Firebase project, App Check key or family space, so no cloud inference, sign-in, Firestore or Storage calls; IndexedDB reopening across a reload was not exercised; no user testing, deployment or submission.

Blockers: supported Chrome desktop hardware; a Firebase project with App Check configured; operator authorization for any deployment or publication.

Next action: run M0 on supported Chrome, log `inferenceSource` plus a network trace for both local and cloud requests, and store redacted evidence paths here.

Checkpoint template: timestamp; commit; implemented behavior; actual test commands/results; device/browser and inferenceSource; redacted evidence paths; unresolved blocker; next concrete action. No family content or secrets in checkpoints.
