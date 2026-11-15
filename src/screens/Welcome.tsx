import type { Memory } from '../types';

type Props = {
  memories: Memory[];
  onStart: () => void;
  onOpen: (memory: Memory) => void;
  onSample: () => void;
  onDelete: (id: string) => void;
};

export default function Welcome({ memories, onStart, onOpen, onSample, onDelete }: Props) {
  return (
    <section className="screen">
      <p className="eyebrow">A keepsake from one photo</p>
      <h1>One photo. One story you can keep.</h1>
      <p className="lede">
        Add a photo and a few details you remember. Kinwoven helps you shape them into a short story
        your family can read and play together.
      </p>

      <div className="hero-actions">
        <button className="button button-primary" onClick={onStart} autoFocus>
          Start a memory
        </button>
        <button className="button button-quiet" onClick={onSample}>
          See a sample story
        </button>
      </div>
      <p className="small">The sample is a labelled test fixture, not family material.</p>

      <div className="card">
        <h2>How your words are handled</h2>
        <ul className="plain-list">
          <li>Your photo and notes are saved in this browser on this device.</li>
          <li>By default, a draft is made by a model on this device. Nothing is uploaded.</li>
          <li>You can allow the cloud for a single draft if this device cannot run the model.</li>
          <li>Sharing with family is a separate step that you confirm.</li>
        </ul>
      </div>

      {memories.length > 0 && (
        <div className="card">
          <h2>Your stories on this device</h2>
          <ul className="memory-list">
            {memories.map((memory) => (
              <li key={memory.id}>
                <div>
                  <p className="memory-title">{memory.draft?.caption ?? 'Untitled memory'}</p>
                  <p className="small">
                    {memory.approval ? `Approved version ${memory.approval.revision}` : 'Not approved yet'}
                  </p>
                </div>
                <div className="row">
                  <button className="button button-small" onClick={() => onOpen(memory)}>
                    Open
                  </button>
                  <button
                    className="button button-small button-quiet"
                    onClick={() => {
                      if (confirm('Remove this story from this device?')) onDelete(memory.id);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
