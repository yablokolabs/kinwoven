import { useEffect, useState } from 'react';
import type { DraftSnapshot } from '../types';

type Props = {
  snapshot: DraftSnapshot;
  photoUrl: string | null;
  sample?: boolean;
  onBack: () => void;
};

export default function Play({ snapshot, photoUrl, sample = false, onBack }: Props) {
  const slides = [snapshot.caption, ...snapshot.story.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)];
  const [index, setIndex] = useState(0);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduceMotion);

  useEffect(() => {
    if (!playing || index >= slides.length - 1) return;
    const timer = setTimeout(() => setIndex((current) => Math.min(current + 1, slides.length - 1)), 9000);
    return () => clearTimeout(timer);
  }, [playing, index, slides.length]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') setIndex((current) => Math.min(current + 1, slides.length - 1));
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(current - 1, 0));
      if (event.key === ' ') {
        event.preventDefault();
        setPlaying((current) => !current);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  const slide = slides[index] ?? snapshot.caption;
  const lastSlide = index >= slides.length - 1;

  return (
    <section className="screen player" aria-label={sample ? 'Sample story player' : 'Story player'}>
      {sample && <p className="notice">Sample story · synthetic test fixture, not family material.</p>}
      <div className="stage">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="stage-photo" />
        ) : (
          <div className="stage-placeholder" aria-hidden="true" />
        )}
        <p className="caption" aria-live="polite">
          {slide}
        </p>
        <div className={lastSlide ? 'autoplay is-done' : 'autoplay'} aria-hidden="true">
          <span key={index} style={{ animationPlayState: playing ? 'running' : 'paused' }} />
        </div>
      </div>

      <div className="player-bar">
        <p className="small">
          Part {index + 1} of {slides.length}
        </p>
        <div className="slide-dots" aria-hidden="true">
          {slides.map((_, dot) => (
            <span key={dot} className={dot === index ? 'slide-dot is-active' : 'slide-dot'} />
          ))}
        </div>
      </div>

      <div className="controls">
        <button
          className="button button-small"
          onClick={() => setIndex((current) => Math.max(current - 1, 0))}
          disabled={index === 0}
        >
          Previous
        </button>
        <button className="button button-small" onClick={() => setPlaying((current) => !current)}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          className="button button-small"
          onClick={() => setIndex((current) => Math.min(current + 1, slides.length - 1))}
          disabled={lastSlide}
        >
          Next
        </button>
      </div>

      <button className="button button-quiet" onClick={onBack}>
        Back
      </button>
    </section>
  );
}
