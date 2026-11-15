# Kinwoven demo video

Source for the 2:10 narrated walkthrough delivered at `docs/media/kinwoven-demo.mp4` (the
renderer writes a copy to `out/`, which Git ignores). It was built from the
`explainer-video` skill in [`yablokolabs/remotion-video-skill`](https://github.com/yablokolabs/remotion-video-skill):
the template's scene frame, background, glass components and HUD, re-skinned to Kinwoven's plum,
clay and gold palette.

## What the film shows

1. Hook: one photo, and the details only the family remembers.
2. Why the meaning is usually what goes missing.
3. Capture: photo and plain notes stay on the device.
4. One question, plus the per-draft privacy choice.
5. A live on-device draft and a live cloud draft, both `prompt kinwoven-draft-v3`, followed by the
   App Check rejection/success check and a revision-bound approval.
6. Playback of the approved version.
7. The architecture diagram: local by default, explicit share only.
8. Outro with the logo.

The walkthrough screenshots in `public/shots/` were recaptured from the running app at 1920×1080
with Playwright after the twilight UI pass. The runtime-proof clips in `public/proof/` and the
full-page frames in `public/media/` are from the live v3 app: on-device in Chrome 157 on a Modal CPU
container, cloud in a fresh Chrome profile. The photo is the synthetic kitchen fixture from
`assets/generated/`, not family media. Evidence is in `../docs/media/runtime-proof-v3.json`.

## Narration

`narration.json` holds one line per scene with its absolute start and window. The track was spoken
locally with piper's `en_GB-jenny_dioco-medium` voice (British female, synthetic) using the skill's
`narrate-local.py`; no hosted voice service was used. The generated `public/narration.wav` is ignored
by Git. The voice model file is licensed separately by its publisher.

## Render

```bash
cd demo
npm install
npx remotion render Video out/kinwoven-demo.mp4 --concurrency=4
cp out/kinwoven-demo.mp4 ../docs/media/kinwoven-demo.mp4
```

`npm run stills` previews frames first. The architecture card uses
`public/architecture.png`, exported from `docs/diagrams/architecture.html`.
