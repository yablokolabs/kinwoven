# Three-minute demo and submission

## Demo timing
0–20s: Show one meaningful photo. Explain: “We save thousands of photos. Often, only one person remembers the story.” Use a real observation if available; keep fictional sample narratives explicitly labeled.
20–55s: A grandparent or consenting family member sees one photo, answers one simple question and gets a readable draft. Show the actual interaction and readable controls. Avoid an invented testimonial.
55–95s: Correct a detail, approve the version and play a brief photo story. Let the family's own words provide the emotional moment. Music and narration are optional, properly licensed and never a substitute for product footage.
95–135s: Show the prepared supported device offline. Run a new drafting request with ON_DEVICE evidence. Include the actual readiness setup in supporting docs, not a fake instant-download animation.
135–165s: Demonstrate the permitted cloud path and genuine fallback evidence. State if a path is forced for testing. Show IN_CLOUD and App Check configuration proof with secrets masked.
165–180s: Show the approved story, project URL and public repo. Mention only implemented platforms. Keep the full YouTube video at or below three minutes, public, in English or with English subtitles.

## Runtime-proof video update (Nov 15, 2026)
Status: rendered and delivered at `docs/media/kinwoven-demo.mp4`; 130.005 s, 1920×1080 H.264, AAC stereo. The film is under the three-minute limit. The entrant still owns the public YouTube upload.

- `DraftDemo` now shows two live captures side by side: the on-device draft and the cloud draft, both from https://kinwoven-proof.web.app with `prompt kinwoven-draft-v3`. The on-device clip is real footage from Chrome 157 in a Modal CPU container, not a family laptop. The cloud clip is real footage from a fresh Chrome profile.
- The on-device panel reads `On-device draft · on-device Chrome model · 25.8s`; the cloud panel reads `Cloud draft · gemini-3.5-flash-lite · 3.4s · App Check on`. A quote under the panels shows the cloud story sentence that includes the family answer: “The tea was still warm when the radio played our song.”
- The App Check strip shows `no App Check · 401 UNAUTHENTICATED` → `App Check · 200 · draft`. The replay used the same captured request body and headers; the token stayed in browser memory and is not shown.
- Both fake `kinwoven.local` strings were replaced with `kinwoven-proof.web.app`, including the outro chip.
- The existing 130 s narration is unchanged because it already describes local-by-default and the opt-in App Check cloud route. No re-timing was needed.
- Evidence: `docs/media/runtime-proof-v3.json`, `docs/media/on-device-live-v3.png`, `docs/media/cloud-live-v3.png`. Demo assets: `demo/public/proof/on-device.webm`, `demo/public/proof/cloud.webm`.
- The runtime manifest reports `v3Nano` 2025.08.14.1358 / component 2025.8.21.1028. The rules say “Gemini Nano 4”; equivalence is not established and is not claimed in the film or docs.
- Checks: `npx tsc -p .` in `demo/` exit 0; stills at 60, 65, 70 and 76 s inspected before the final render; encoded frames at 0, 30, 48, 60, 65, 70, 76, 100, 122 and 126 s inspected; full decode exit 0; mean audio −18.8 dB, peak −2.9 dB.

## Required submission
The supplied brief requires working Firebase AI Logic at runtime, App Check, at least one eligible platform, public GitHub/GitLab source and an open-source license, description and public YouTube demo. A hosted free-to-use project is strongly encouraged. Use Apache-2.0 or another genuine open-source license. Verify license detectability. Include setup, environment template, reviewer instructions and actual device requirements.

Describe ENJOY as inspiration. Keep its private backlog out of the public repository unless publication rights are confirmed. If reusing existing app code, enumerate prior functionality and competition-period additions. Do not imply prior users or family feedback without evidence.

Deadline supplied: Nov 30, 2026, 22:00 GMT / Dec 1, 03:30 IST. Recheck the actual event portal. Record final commit, live URL, YouTube URL, selected platform(s), App Check evidence and submission confirmation.
