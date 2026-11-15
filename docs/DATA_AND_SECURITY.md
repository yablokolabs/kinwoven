# Data and security

Local records: Memory{id,revision,photoIds,facts,draft,approval,status}; Photo{id,blobKey,localMime,caption}; Fact{id,text,photoIds,origin,confirmedBy}; Draft{revision,promptVersion,inferenceSource,sourceFactIds}; Approval{revision,contentHash,approvedAt}; Publication{id,familyId,snapshotRevision,contentHash,createdBy}.

Local-only records and blobs live in IndexedDB and do not enter Firestore, Storage, analytics or crash reports. Explain shared-browser privacy and provide a clear delete-local-data action. Shared content uses separate family-scoped records and explicit upload. Do not turn on blanket persistence for private remote family collections without a sign-out/cache policy.

Shared paths should be family-scoped. Authenticated owner/member roles are enforced in Firestore and Storage rules, not model output or client flags. Keep participant membership management minimal. Use emulator tests to prove outsiders cannot read or write media, change membership or publish another family's story. App Check complements authentication and rules.

Use immutable approved snapshots and transactional publication checks. Editing drafts cannot mutate previously approved snapshots. Clearly state whether a withdrawn publication remains in another device's existing offline cache. Never promise remote deletion can erase downloaded copies. Upload partially completed files to staging and publish only on successful completion; retries use stable IDs and avoid duplicate snapshots.

Use short-lived media access where supported and avoid public buckets. Remove unnecessary EXIF metadata from shared derivatives. Do not silently upload originals to a model or use cloud thumbnails in a local-only story. Service credentials stay server-side. Firebase client config is not an authorization boundary. Enforce actual quotas, allowed origins, upload limits and retention behavior before hosting publicly.
