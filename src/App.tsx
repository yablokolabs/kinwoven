import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaAsset, Memory } from './types';
import { RevisionConflictError } from './lib/concurrency';
import { deleteMemory, getMedia, listMemories, putMemory, saveMedia } from './lib/db';
import { draftWithAi } from './lib/inference';
import type { PrivacyChoice } from './lib/policy';
import { approvalIsCurrent, createApproval } from './lib/revision';
import { SAMPLE_SNAPSHOT } from './lib/sample';
import { templateDraft } from './lib/template';
import Welcome from './screens/Welcome';
import Capture from './screens/Capture';
import Question from './screens/Question';
import Draft from './screens/Draft';
import Play from './screens/Play';
import Share from './screens/Share';

type Step = 'welcome' | 'capture' | 'question' | 'draft' | 'play' | 'share' | 'sample';

const STEP_ORDER: Step[] = ['capture', 'question', 'draft', 'play'];
const STEP_LABELS = ['Photo', 'Question', 'Draft', 'Play'];

function StepRail({ step }: { step: Step }) {
  const current = STEP_ORDER.indexOf(step);
  if (current < 0) return null;
  return (
    <nav className="step-rail" aria-label="Your progress" data-current={current}>
      <ol>
        {STEP_ORDER.map((name, index) => (
          <li
            key={name}
            className={`step${index < current ? ' is-done' : ''}${index === current ? ' is-current' : ''}`}
            aria-current={index === current ? 'step' : undefined}
          >
            <span className="step-dot" aria-hidden="true">
              {index < current ? '✓' : index + 1}
            </span>
            <span className="step-label">{STEP_LABELS[index]}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function newMemory(): Memory {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    revision: 1,
    photoId: '',
    facts: [],
    question: 'What do you remember about this day that the photo cannot show?',
    answer: '',
    draft: null,
    provenance: null,
    approval: null,
  };
}

export default function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [memory, setMemory] = useState<Memory | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [draftError, setDraftError] = useState('');
  const [fallbackAvailable, setFallbackAvailable] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState('');

  const persistedRevision = useRef(0);
  const memoryRef = useRef<Memory | null>(null);
  const saveQueue = useRef<Memory | null>(null);
  const saving = useRef(false);
  const photoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);

  const refreshList = useCallback(async () => {
    try {
      setMemories(await listMemories());
    } catch {
      setMemories([]);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const flush = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (saveQueue.current) {
        const next = saveQueue.current;
        saveQueue.current = null;
        try {
          const stored = await putMemory(next, persistedRevision.current);
          persistedRevision.current = stored.revision;
        } catch (error) {
          if (error instanceof RevisionConflictError) {
            setConflict(true);
            saveQueue.current = null;
            return;
          }
          throw error;
        }
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not save on this device.');
    } finally {
      saving.current = false;
    }
  }, []);

  useEffect(() => {
    if (!memory) return;
    saveQueue.current = memory;
    const timer = setTimeout(() => {
      void flush();
    }, 500);
    return () => clearTimeout(timer);
  }, [memory, flush]);

  const showPhoto = useCallback(async (asset: MediaAsset) => {
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    const url = URL.createObjectURL(asset.blob);
    photoUrlRef.current = url;
    setPhotoUrl(url);
  }, []);

  useEffect(
    () => () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    },
    [],
  );

  function resetToWelcome() {
    setStep('welcome');
    setMemory(null);
    memoryRef.current = null;
    persistedRevision.current = 0;
    setDraftError('');
    setFallbackAvailable(false);
    setProgress(null);
    setBusy(false);
    setConflict(false);
    setStatus('');
    setNotice('');
    if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current);
    photoUrlRef.current = null;
    setPhotoUrl(null);
    void refreshList();
  }

  function startNew() {
    const draft = newMemory();
    memoryRef.current = draft;
    persistedRevision.current = 0;
    setMemory(draft);
    setDraftError('');
    setFallbackAvailable(false);
    setStatus('');
    setNotice('');
    setConflict(false);
    setStep('capture');
  }

  async function openMemory(target: Memory) {
    memoryRef.current = target;
    persistedRevision.current = target.revision;
    setMemory(target);
    setDraftError('');
    setFallbackAvailable(false);
    setStatus('');
    setNotice('');
    setConflict(false);
    setStep(target.draft ? 'draft' : 'question');
    if (target.photoId) {
      const asset = await getMedia(target.photoId);
      if (asset) await showPhoto(asset);
    }
  }

  function patchMemory(patch: Partial<Memory>): Memory | null {
    const current = memoryRef.current;
    if (!current) return null;
    const next: Memory = { ...current, ...patch, revision: current.revision + 1, approval: null };
    memoryRef.current = next;
    setMemory(next);
    return next;
  }

  async function choosePhoto(file: File) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setNotice('Please choose a JPEG or PNG photo.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setNotice('That photo is larger than 12 MB. Please choose a smaller copy.');
      return;
    }
    const asset: MediaAsset = {
      id: crypto.randomUUID(),
      blob: file,
      mimeType: file.type,
      name: file.name || 'photo',
      size: file.size,
    };
    try {
      await saveMedia(asset);
      await showPhoto(asset);
      patchMemory({ photoId: asset.id });
      setNotice('');
    } catch {
      setNotice('The photo could not be saved on this device.');
    }
  }

  async function saveNotes(notes: string) {
    const current = memoryRef.current;
    if (!current) return;
    const facts = notes
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((text, index) => ({ id: `${current.id}-f${index + 1}`, text }));
    patchMemory({ facts });
    setStep('question');
  }

  async function makeDraft(choice: PrivacyChoice) {
    const current = memoryRef.current;
    if (!current) return;
    setBusy(true);
    setDraftError('');
    setFallbackAvailable(false);
    setProgress(choice === 'local' ? 0 : null);
    try {
      const result = await draftWithAi({
        facts: current.facts,
        question: current.question,
        answer: current.answer,
        choice,
        onProgress: (fraction) => setProgress(Math.round(fraction * 100)),
      });
      patchMemory({ draft: result.body, provenance: result.provenance });
      setStatus(
        result.provenance.kind === 'model' && result.provenance.source === 'ON_DEVICE'
          ? `Drafted on this device in ${(result.provenance.durationMs / 1000).toFixed(1)}s.`
          : result.provenance.kind === 'model'
            ? `Drafted in the cloud in ${(result.provenance.durationMs / 1000).toFixed(1)}s with App Check.`
            : 'Draft ready.',
      );
      setStep('draft');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Drafting did not finish.';
      setDraftError(message);
      setFallbackAvailable(true);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function usePlainDraft() {
    const current = memoryRef.current;
    if (!current) return;
    setBusy(true);
    setDraftError('');
    try {
      const { body, provenance } = templateDraft({
        facts: current.facts,
        question: current.question,
        answer: current.answer,
      });
      patchMemory({ draft: body, provenance });
      setFallbackAvailable(false);
      setStatus('Plain draft built from your words. No AI was used.');
      setStep('draft');
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Could not build a draft.');
    } finally {
      setBusy(false);
    }
  }

  async function commitText(caption: string, story: string, nextMemory?: Memory) {
    const base = nextMemory ?? memoryRef.current;
    if (!base?.draft) return null;
    if (base.draft.caption === caption && base.draft.story === story) return base;
    const next: Memory = {
      ...base,
      draft: { ...base.draft, caption, story },
      revision: base.revision + 1,
      approval: null,
      updatedAt: Date.now(),
    };
    memoryRef.current = next;
    setMemory(next);
    saveQueue.current = next;
    await flush();
    return next;
  }

  async function approve(caption: string, story: string) {
    setNotice('');
    const committed = await commitText(caption, story);
    if (!committed?.draft) return;
    if (conflict) {
      setNotice('This story changed elsewhere. Reload it before approving.');
      return;
    }
    const approval = await createApproval(committed);
    const next: Memory = { ...committed, approval };
    memoryRef.current = next;
    setMemory(next);
    saveQueue.current = next;
    await flush();
    setStatus(`Approved version ${approval.revision}. Any later edit needs a new approval.`);
  }

  async function openPlay() {
    const current = memoryRef.current;
    if (!current) return;
    if (!(await approvalIsCurrent(current))) {
      setNotice('This version is not approved yet. Approve the current draft first.');
      return;
    }
    setNotice('');
    setStep('play');
  }

  async function openShare() {
    const current = memoryRef.current;
    if (!current) return;
    if (!(await approvalIsCurrent(current))) {
      setNotice('This version is not approved yet. Approve the current draft first.');
      return;
    }
    setNotice('');
    setStep('share');
  }

  async function removeMemory(id: string) {
    try {
      await deleteMemory(id);
      await refreshList();
    } catch {
      setNotice('That story could not be removed.');
    }
  }

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="masthead">
        <span className="brand">
          <span className="mark-shell" aria-hidden="true">
            <img className="brand-mark" src="/icon.png" alt="" width={34} height={34} />
          </span>
          Kinwoven
        </span>
        <span className="privacy-note">
          <span className="status-dot" aria-hidden="true" />
          Your photo and words stay on this device until you share them.
        </span>
      </header>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {conflict && (
        <p className="notice notice-error" role="alert">
          A newer version of this story exists. <button className="link" onClick={resetToWelcome}>Go back and reopen it</button> so nothing is overwritten.
        </p>
      )}

      <main id="main">
        <StepRail step={step} />

        {step === 'welcome' && (
          <Welcome
            memories={memories}
            onStart={startNew}
            onOpen={(target) => void openMemory(target)}
            onSample={() => setStep('sample')}
            onDelete={(id) => void removeMemory(id)}
          />
        )}

        {step === 'capture' && memory && (
          <Capture
            photoUrl={photoUrl}
            initialNotes={memory.facts.map((fact) => fact.text).join('\n')}
            onPhoto={(file) => void choosePhoto(file)}
            onBack={resetToWelcome}
            onNext={(notes) => void saveNotes(notes)}
          />
        )}

        {step === 'question' && memory && (
          <Question
            question={memory.question}
            answer={memory.answer}
            busy={busy}
            error={draftError}
            fallbackAvailable={fallbackAvailable}
            progress={progress}
            onQuestion={(question) => patchMemory({ question })}
            onAnswer={(answer) => patchMemory({ answer })}
            onBack={() => setStep('capture')}
            onDraft={(choice) => void makeDraft(choice)}
            onPlainDraft={() => void usePlainDraft()}
          />
        )}

        {step === 'draft' && memory && (
          <Draft
            key={`${memory.id}-${memory.provenance ? 'drafted' : 'fresh'}`}
            memory={memory}
            photoUrl={photoUrl}
            status={status}
            notice={notice}
            onBack={() => setStep('question')}
            onApprove={approve}
            onPlay={() => void openPlay()}
            onShare={() => void openShare()}
          />
        )}

        {step === 'play' && memory?.approval && (
          <Play snapshot={memory.approval.snapshot} photoUrl={photoUrl} onBack={() => setStep('draft')} />
        )}

        {step === 'share' && memory && (
          <Share memory={memory} onBack={() => setStep('draft')} />
        )}

        {step === 'sample' && (
          <Play snapshot={SAMPLE_SNAPSHOT} photoUrl={null} sample onBack={resetToWelcome} />
        )}
      </main>
    </div>
  );
}
