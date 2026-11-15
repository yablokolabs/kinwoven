# Built-with tags

Use only tags verified in the completed build. Proven runtime tags:

- Firebase AI Logic (on-device and cloud)
- Gemini (cloud model `gemini-3.5-flash-lite`)
- Firebase App Check (reCAPTCHA Enterprise; 401 without a token, 200 with one)
- Firebase Hosting
- React
- TypeScript
- Vite
- IndexedDB
- Chrome (157.0.8103.78)

Implemented in source but not demonstrated at runtime; do not tag as proven: Firebase Authentication,
Cloud Firestore, Cloud Storage for Firebase, and the service-worker/offline path.

The inspected Chrome model manifest is `v3Nano` 2025.08.14.1358, component 2025.8.21.1028. The
event wording says “Gemini Nano 4”; equivalence is not established. Do not add a “Gemini Nano 4”
tag unless the event owner confirms it or a runtime label proves it.

Add Kotlin or Android only if implemented and demonstrated. Select exact model labels from the
tested runtime rather than assuming a model version.
