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
5. A draft built only from those facts, then a revision-bound approval.
6. Playback of the approved version.
7. The architecture diagram: local by default, explicit share only.
8. Outro with the logo.

The app screenshots in `public/shots/` were recaptured from the running app at 1920×1080 with
Playwright after the twilight UI pass. The photo is the synthetic kitchen fixture from
`assets/generated/`, not family media.

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
