import { useState } from 'react';
import type { PrivacyChoice } from '../lib/policy';

type Props = {
  question: string;
  answer: string;
  busy: boolean;
  error: string;
  fallbackAvailable: boolean;
  progress: number | null;
  onQuestion: (value: string) => void;
  onAnswer: (value: string) => void;
  onBack: () => void;
  onDraft: (choice: PrivacyChoice) => void;
  onPlainDraft: () => void;
};

export default function Question({
  question,
  answer,
  busy,
  error,
  fallbackAvailable,
  progress,
  onQuestion,
  onAnswer,
  onBack,
  onDraft,
  onPlainDraft,
}: Props) {
  const [choice, setChoice] = useState<PrivacyChoice>('local');

  return (
    <section className="screen">
      <h1>One thing the photo cannot show</h1>

      <label className="field">
        <span className="label">The question</span>
        <input
          className="input"
          value={question}
          onChange={(event) => onQuestion(event.target.value)}
        />
      </label>

      <label className="field">
        <span className="label">Your answer</span>
        <textarea
          className="textarea"
          rows={4}
          value={answer}
          onChange={(event) => onAnswer(event.target.value)}
          disabled={busy}
        />
      </label>

      <fieldset className="card">
        <legend>Where may this draft be made?</legend>
        <label className="choice">
          <input
            type="radio"
            name="privacy"
            value="local"
            checked={choice === 'local'}
            onChange={() => setChoice('local')}
            disabled={busy}
          />
          <span>
            <strong>Keep on this device</strong>
            <span className="hint">
              Local-only. The model runs in this browser and the photo is never sent.
            </span>
          </span>
        </label>
        <label className="choice">
          <input
            type="radio"
            name="privacy"
            value="cloud"
            checked={choice === 'cloud'}
            onChange={() => setChoice('cloud')}
            disabled={busy}
          />
          <span>
            <strong>Allow cloud for this draft</strong>
            <span className="hint">
              Tries this device first, then falls back to the cloud through Firebase AI Logic with
              App Check. Nothing is uploaded until you choose this.
            </span>
          </span>
        </label>
      </fieldset>

      {busy && (
        <div className="status progress-card" role="status">
          <p>
            {progress !== null
              ? `Getting the on-device model ready: ${progress}%`
              : 'Preparing your draft…'}
          </p>
          <div className="progress-track" aria-hidden="true">
            <span className="progress-fill" style={{ width: `${progress ?? 12}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="notice notice-error" role="alert">
          <p>{error}</p>
          {fallbackAvailable && (
            <button className="button button-small" onClick={onPlainDraft} disabled={busy}>
              Use a plain draft from my words instead
            </button>
          )}
        </div>
      )}

      <div className="actions">
        <button className="button button-quiet" onClick={onBack} disabled={busy}>
          Back
        </button>
        <button className="button button-primary" onClick={() => onDraft(choice)} disabled={busy}>
          Make my draft
        </button>
      </div>
    </section>
  );
}
