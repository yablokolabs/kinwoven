# Reproduce the on-device proof

This is the setup behind `docs/media/on-device-modal.png`. It proves Chrome-local
inference in a Modal Linux CPU container. It does **not** prove execution on a
family laptop, cloud inference, App Check, or a real Firebase project.

## What the scripts do

`probe.py` has three Modal functions:

- `version_probe` prints the Chrome and Playwright versions.
- `raw_probe` creates the Chrome Prompt API session, runs a prompt online, then
  repeats it with the browser offline. It records `raw-evidence.json`.
- `app_probe` drives the actual Kinwoven UI through photo, notes, question and a
  local-only draft. It records the rendered provenance, the network trace during
  the draft, `app-evidence.json` and a full-page screenshot.

The app probe uses a synthetic kitchen-table photo and notes. The draft prompt
is the current `kinwoven-draft-v2`; the model may still add a detail, so the
screenshot can include the app's "Check before approving" review card.

## Prerequisites

- A Modal account and `modal` CLI. The recorded run used `modal==1.6.4`.
- Node 22 and the project dependencies.
- No GPU. The functions request 8 CPU and 32 GB memory, and the recorded
  container reported 24 vCPU and 171.83 GiB visible memory.
- The Modal profile volume `kinwoven-chrome-profile`. The functions create it if
  missing; keeping it avoids downloading the model again.

Authenticate Modal in the environment where you run the commands. Do not commit
Modal tokens.

## 1. Build a test-only app

The on-device path needs Firebase AI Logic initialization, but it does not need a
real Firebase project. Use placeholder identifiers only for the local proof. Do
not use this build for cloud calls or deployment.

```bash
cat > .env.test.local <<'EOF'
VITE_FIREBASE_API_KEY=test-only-placeholder
VITE_FIREBASE_AUTH_DOMAIN=test-only.invalid
VITE_FIREBASE_PROJECT_ID=test-only-placeholder
VITE_FIREBASE_STORAGE_BUCKET=test-only.invalid
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:test-only
VITE_APPCHECK_SITE_KEY=
VITE_APPCHECK_DEBUG=false
EOF
npm run typecheck
npx vite build --mode test
rm .env.test.local
```

`.env.test.local` is ignored by Git. Confirm the build contains the placeholder
project id and no real credentials before uploading it to Modal.

## 2. Warm and prove the raw Chrome model

```bash
modal run tools/modal-on-device/probe.py::version_probe
modal run tools/modal-on-device/probe.py::raw_probe
```

The first model download can take several minutes. The function waits for the
download, then runs the raw prompt online and offline. A pass requires
`availability` to be `downloadable` or `available`, and both `online.text` and
`offline.text` to be `local-ready`.

The recorded environment used:

- **Chrome:** `Google Chrome 157.0.8103.78`
- **Playwright:** `1.55.0`
- **Display:** Xvfb `:99`, `1920x1080x24`
- **Backend:** CPU, with `OnDeviceModelForceCpuBackend`
- **Profile:** persistent volume mounted at `/data/profile`
- **Model:** v3Nano `2025.08.14.1358`, component `2025.8.21.1028`

## 3. Prove the Kinwoven UI

```bash
modal run tools/modal-on-device/probe.py::app_probe
```

The app probe starts a local static server, launches the same persistent Chrome
profile, and performs the local-only flow. A pass requires:

- the heading `Read your story`;
- provenance beginning `On-device draft`;
- no request to `googleapis.com`, `firebase`, `gstatic.com`,
  `cloudfunctions.net` or `run.app` after the draft starts;
- a screenshot and evidence file written to the Modal volume.

## 4. Download the evidence

```bash
modal volume get kinwoven-chrome-profile app-evidence.json ./app-evidence.json
modal volume get kinwoven-chrome-profile app-online.png ./app-online.png
modal volume get kinwoven-chrome-profile raw-evidence.json ./raw-evidence.json
```

Inspect the JSON and mask any local paths before publishing. The synthetic
fixture is already labelled.

## Important limitations

- This is **Chrome running in a Modal container**, not a family member's laptop.
- The Firebase web values are test-only placeholders. No real Firebase project,
  App Check configuration, cloud inference, sign-in, Firestore or Storage call
  is exercised.
- Raw Chrome offline inference passed. App-level offline drafting previously
  timed out and is not covered by this run.
- Chrome's Prompt API is desktop Chrome only. It is not available in Chrome for
  Android or on Android TV.
- The exact Chrome flags that matter are the removal of Playwright's
  `--disable-component-update` and `--disable-background-networking` defaults,
  plus `--enable-features=CDPScreenshotNewSurface,OnDeviceModelForceCpuBackend`.
  The persistent profile keeps the downloaded model between runs.
