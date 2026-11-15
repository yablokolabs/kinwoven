# Reproduce the Kinwoven runtime proof

This runbook reproduces the v3 evidence in `docs/media/runtime-proof-v3.json`. It proves Chrome-local
inference and the opt-in cloud path on the live app. It does **not** prove execution on a family
laptop, and it does not exercise sign-in, Firestore or Storage.

## What the scripts do

`probe.py` has five Modal functions:

- `version_probe` prints the Chrome and Playwright versions.
- `raw_probe` creates a raw Chrome Prompt API session, runs a prompt online, then repeats it offline.
- `app_probe` is the older placeholder-Firebase build check. It is kept for the v2 historical
  evidence and is not the current live proof.
- `live_app_probe` opens https://kinwoven-proof.web.app in the persistent Chrome profile, drives the
  on-device flow, records the provenance and network trace, and writes `ondevice-live.webm`,
  `ondevice-live.png` and `ondevice-live-evidence.json`.
- `cloud_probe` opens the live app in the separate fresh profile `/data/cloud-profile`, selects the
  cloud option, and writes `cloud-live.webm`, `cloud-live.png` and `cloud-live-evidence.json`.

The scripts use the synthetic kitchen-table fixture in `assets/generated/`. The current prompt is
`kinwoven-draft-v3`. The on-device model can still add wording; the app's review card flags a short
word list, but it is not a semantic checker.

## Prerequisites

- A Modal account and `modal` CLI. The recorded run used `modal==1.6.4`.
- Node 22 and the project dependencies.
- A real `.env.local` with the public Firebase web values and the reCAPTCHA Enterprise App Check site
  key. Keep it untracked. Do not use secrets in the browser build.
- No GPU. The functions request 8 CPU and 32 GB memory; the recorded run used a CPU container.
- The Modal volume `kinwoven-chrome-profile`. Keeping it avoids downloading the model again. The
  on-device profile is `/data/profile`; the cloud fallback profile is `/data/cloud-profile` and must
  not contain the on-device model.

Authenticate Modal in the environment where you run the commands. Do not commit Modal tokens or the
Firebase/App Check values.

## 1. Build and deploy the app

```bash
npm run typecheck
npm test -- --run
npm run build
firebase deploy --only hosting --project kinwoven-proof --non-interactive
```

The Modal image uploads the current `dist/` and `assets/generated/`; deploy the same build to Hosting
so the live URL and the uploaded files match. No Firestore, Storage, Functions, billing or App Check
enforcement change is needed.

## 2. Prove on-device execution

```bash
modal run tools/modal-on-device/probe.py::live_app_probe
```

A pass requires:

- the heading `Read your story`;
- provenance beginning `On-device draft` and containing `prompt kinwoven-draft-v3`;
- no request to `firebasevertexai.googleapis.com`, `googleapis.com`, `firebase`, `gstatic.com`,
  `cloudfunctions.net` or `run.app` after the draft starts;
- `cloud_inference_requests` empty in the evidence;
- `ondevice-live.webm`, `ondevice-live.png` and `ondevice-live-evidence.json` on the modal volume.

## 3. Prove cloud execution

```bash
modal run tools/modal-on-device/probe.py::cloud_probe
```

A pass requires:

- provenance beginning `Cloud draft`, containing `gemini-3.5-flash-lite`,
  `prompt kinwoven-draft-v3` and `App Check on`;
- `x-firebase-appcheck: true` on the `firebasevertexai.googleapis.com` request;
- `cloud_inference_requests` containing exactly the expected Gemini request;
- the photo rendered at a non-zero natural width.

## 4. Download the evidence

```bash
modal volume get --force kinwoven-chrome-profile ondevice-live.webm ./ondevice-live.webm
modal volume get --force kinwoven-chrome-profile ondevice-live.png ./ondevice-live.png
modal volume get --force kinwoven-chrome-profile ondevice-live-evidence.json ./ondevice-live-evidence.json
modal volume get --force kinwoven-chrome-profile cloud-live.webm ./cloud-live.webm
modal volume get --force kinwoven-chrome-profile cloud-live.png ./cloud-live.png
modal volume get --force kinwoven-chrome-profile cloud-live-evidence.json ./cloud-live-evidence.json
```

Inspect the JSON and remove request URLs that contain the public API key or reCAPTCHA site key before
publishing. Do not publish the raw evidence files; the sanitized combined file is
`docs/media/runtime-proof-v3.json`. The synthetic fixture is already labelled.

## 5. App Check rejection

Replay the same captured request body and headers from the live page, once with
`X-Firebase-AppCheck` and once without it. The expected results are:

- with the header: `200`;
- without the header: `401` `UNAUTHENTICATED`, message `Firebase App Check token is invalid.`

Keep the token in browser memory. Save only the statuses and error message. Do not log request
headers, the token, or the request body.

## Important limitations

- This is **Chrome running in a Modal container**, not a family member's laptop.
- The Firebase project and App Check are real for `live_app_probe`. The older `app_probe` used a
  test-only placeholder and must not be presented as the live proof.
- Sign-in, Firestore and Storage are implemented in source but have not been demonstrated.
- Raw Chrome offline inference passed. App-level offline drafting previously timed out and is not
  covered by this run.
- Chrome's Prompt API is desktop Chrome only. It is not available in Chrome for Android or Android TV.
- The runtime manifest reports `v3Nano` `2025.08.14.1358`, component `2025.8.21.1028`. No inspected
  manifest or API response labels it “Gemini Nano 4”; equivalence is not established.
- The exact Chrome flags that matter are the removal of Playwright's
  `--disable-component-update` and `--disable-background-networking` defaults, plus
  `--enable-features=CDPScreenshotNewSurface,OnDeviceModelForceCpuBackend`. The persistent profile
  keeps the downloaded model between runs.
