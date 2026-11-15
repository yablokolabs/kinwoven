import { useState } from 'react';
import type { Memory } from '../types';

type Props = {
  memory: Memory;
  photoUrl: string | null;
  status: string;
  notice: string;
  onBack: () => void;
  onApprove: (caption: string, story: string) => Promise<void>;
  onPlay: () => void;
  onShare: () => void;
};

export default function Draft({
  memory,
  photoUrl,
  status,
  notice,
  onBack,
  onApprove,
  onPlay,
  onShare,
}: Props) {
  const draft = memory.draft;
  const [caption, setCaption] = useState(draft?.caption ?? '');
  const [story, setStory] = useState(draft?.story ?? '');
  const [approving, setApproving] = useState(false);

  if (!draft) {
    return (
      <section className="screen">
        <h1>No draft yet</h1>
        <button className="button button-primary" onClick={onBack}>
          Back to the question
        </button>
      </section>
    );
  }

  const provenance = memory.provenance;
  const sourceNotes = memory.facts.filter((fact) => draft.sourceFactIds.includes(fact.id));
  const edited = caption !== draft.caption || story !== draft.story;
  const approved = Boolean(memory.approval) && !edited;

  return (
    <section className="screen">
      <h1>Read your story</h1>

      {photoUrl && (
        <div className="draft-photo">
          <img src={photoUrl} alt="The photo for this story" className="photo photo-wide" />
        </div>
      )}

      <p className="small provenance chip">
        {provenance?.kind === 'model'
          ? provenance.source === 'ON_DEVICE'
            ? `On-device draft · ${provenance.modelLabel} · ${(provenance.durationMs / 1000).toFixed(1)}s · prompt ${provenance.promptVersion}`
            : `Cloud draft · ${provenance.modelLabel} · ${(provenance.durationMs / 1000).toFixed(1)}s · prompt ${provenance.promptVersion} · App Check on`
          : 'Plain draft built from your words. No AI was used.'}
      </p>

      <label className="field">
        <span className="label">Caption</span>
        <input className="input" value={caption} onChange={(event) => setCaption(event.target.value)} />
      </label>

      <label className="field">
        <span className="label">Story</span>
        <textarea
          className="textarea textarea-story"
          rows={6}
          value={story}
          onChange={(event) => setStory(event.target.value)}
        />
      </label>

      <div className="card">
        <h2>Built from your notes</h2>
        <ul className="plain-list">
          {sourceNotes.map((fact) => (
            <li key={fact.id}>{fact.text}</li>
          ))}
        </ul>
        {draft.uncertain.length > 0 && (
          <>
            <h2>Still unknown</h2>
            <ul className="plain-list">
              {draft.uncertain.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {approved ? (
        <p className="status" role="status">
          Approved version {memory.approval?.revision}. Playing uses only this version.
        </p>
      ) : memory.approval ? (
        <p className="notice" role="status">
          You edited this version, so the earlier approval no longer applies. Approve again before
          playing or sharing.
        </p>
      ) : null}

      {status && <p className="status">{status}</p>}
      {notice && <p className="notice">{notice}</p>}

      <div className="actions actions-wrap">
        <button className="button button-quiet" onClick={onBack}>
          Back
        </button>
        <button
          className={approved ? 'button' : 'button button-primary'}
          onClick={async () => {
            setApproving(true);
            try {
              await onApprove(caption, story);
            } finally {
              setApproving(false);
            }
          }}
          disabled={approving || !caption.trim() || !story.trim()}
        >
          Approve this version
        </button>
        <button
          className={approved ? 'button button-primary' : 'button'}
          onClick={onPlay}
          disabled={!approved}
        >
          Play our story
        </button>
      </div>

      <button className="button button-quiet" onClick={onShare} disabled={!approved}>
        Share with family
      </button>
      <p className="small">Sharing is a separate, confirmed action. Nothing is uploaded before it.</p>
    </section>
  );
}
