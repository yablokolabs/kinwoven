import { useState } from 'react';
import type { Memory } from '../types';
import { isFirebaseConfigured } from '../lib/config';
import { shareApprovedStory } from '../lib/share';

type Props = {
  memory: Memory;
  onBack: () => void;
};

export default function Share({ memory, onBack }: Props) {
  const [spaceId, setSpaceId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const snapshot = memory.approval?.snapshot;

  if (!snapshot) {
    return (
      <section className="screen">
        <h1>Nothing approved to share</h1>
        <button className="button button-primary" onClick={onBack}>
          Back
        </button>
      </section>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <section className="screen">
        <h1>Family sharing is not set up</h1>
        <p className="lede">
          This copy has no Firebase project, so it cannot sign in family members or store a shared
          copy. Everything you made is still saved on this device.
        </p>
        <p className="small">
          To turn sharing on, follow the setup in README.md and restart with the VITE_FIREBASE_*
          values in .env.local.
        </p>
        <button className="button button-primary" onClick={onBack}>
          Back
        </button>
      </section>
    );
  }

  return (
    <section className="screen">
      <h1>Share this approved story</h1>
      <p className="lede">
        This sends exactly the approved version {snapshot.revision} and its photo to one family
        space. Later edits are not shared and need a new approval.
      </p>

      <article className="card preview">
        <h2>{snapshot.caption}</h2>
        <p>{snapshot.story}</p>
        <p className="small">Approved {new Date(memory.approval!.approvedAt).toLocaleString()}</p>
      </article>

      <label className="field">
        <span className="label">Family space name</span>
        <input
          className="input"
          value={spaceId}
          onChange={(event) => setSpaceId(event.target.value)}
          placeholder="e.g. rossi-family"
          autoComplete="off"
        />
      </label>

      <label className="choice">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>
          <strong>I agree to upload this story and photo</strong>
          <span className="hint">Only members of that family space can open the shared copy.</span>
        </span>
      </label>

      {message && (
        <p className="status" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="notice notice-error" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button className="button button-quiet" onClick={onBack} disabled={busy}>
          Back
        </button>
        <button
          className="button button-primary"
          disabled={busy || !confirmed || !spaceId.trim()}
          onClick={async () => {
            setBusy(true);
            setError('');
            setMessage('');
            try {
              const result = await shareApprovedStory(memory, spaceId);
              setMessage(`Shared version ${snapshot.revision} to ${result.spaceId}.`);
              setConfirmed(false);
            } catch (caught) {
              setError(caught instanceof Error ? caught.message : 'Sharing failed.');
            } finally {
              setBusy(false);
            }
          }}
        >
          Share to family space
        </button>
      </div>
    </section>
  );
}
