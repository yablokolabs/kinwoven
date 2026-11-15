import { useState } from 'react';

type Props = {
  photoUrl: string | null;
  initialNotes: string;
  onPhoto: (file: File) => void;
  onNext: (notes: string) => void;
  onBack: () => void;
};

export default function Capture({ photoUrl, initialNotes, onPhoto, onNext, onBack }: Props) {
  const [notes, setNotes] = useState(initialNotes);

  return (
    <section className="screen">
      <h1>Add one photo</h1>
      <p className="lede">Choose a photo from this device. The original stays here.</p>

      <div className={photoUrl ? 'photo-frame has-photo' : 'photo-frame'}>
        {photoUrl ? (
          <img src={photoUrl} alt="The photo you chose" className="photo" />
        ) : (
          <p className="photo-placeholder">No photo chosen yet</p>
        )}
      </div>

      <div className="upload">
        <input
          id="photo-input"
          type="file"
          accept="image/jpeg,image/png"
          className="file-input sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPhoto(file);
          }}
        />
        <label className="button button-quiet upload-button" htmlFor="photo-input">
          Choose a photo (JPEG or PNG)
        </label>
        <span className="small">JPEG or PNG, up to 12 MB.</span>
      </div>

      <label className="field">
        <span className="label">What do you know about this photo?</span>
        <span className="hint">One detail per line. Only what you know for certain.</span>
        <textarea
          className="textarea"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={'The table was in the kitchen\nWe ate there every Sunday'}
        />
      </label>

      <div className="actions">
        <button className="button button-quiet" onClick={onBack}>
          Back
        </button>
        <button
          className="button button-primary"
          disabled={!photoUrl || notes.trim().length === 0}
          onClick={() => onNext(notes)}
        >
          Next: one question
        </button>
      </div>
    </section>
  );
}
