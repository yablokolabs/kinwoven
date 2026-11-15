import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {Chip, Eyebrow, Glass, Pop, Title, hexA} from '../components/ui';
import {SOFT, useT} from '../hooks';
import {C, F} from '../theme';

const pad = '104px 120px 96px';

const PhotoCard: React.FC<{
  at: number;
  src: string;
  caption: string;
  rotate?: number;
  width?: number;
}> = ({at, src, caption, rotate = -3, width = 560}) => {
  const {sp} = useT();
  const p = sp(at, SOFT);
  return (
    <div
      style={{
        width,
        opacity: Math.min(1, p * 1.5),
        transform: `translateY(${(1 - p) * 90}px) rotate(${rotate}deg)`,
      }}
    >
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 26,
          border: '1px solid rgba(255,246,234,0.18)',
          background: '#1d1018',
          boxShadow: `0 46px 110px rgba(0,0,0,0.6), 0 0 90px ${hexA(C.coral, 0.18)}`,
        }}
      >
        <Img src={staticFile(src)} style={{display: 'block', width: '100%'}} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 18,
            padding: '18px 22px',
            background: 'rgba(20,9,18,0.94)',
          }}
        >
          <span style={{fontFamily: F.body, fontSize: 18, color: C.ink}}>{caption}</span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 12,
              letterSpacing: 1.5,
              color: C.muted,
              whiteSpace: 'nowrap',
            }}
          >
            SYNTHETIC
          </span>
        </div>
      </div>
    </div>
  );
};

const Shot: React.FC<{src: string; at: number; width?: number; alt: string}> = ({
  src,
  at,
  width = 1280,
  alt,
}) => {
  const {sp} = useT();
  const p = sp(at, SOFT);
  return (
    <div
      style={{
        width,
        opacity: Math.min(1, p * 1.6),
        transform: `translateY(${(1 - p) * 70}px) scale(${0.975 + 0.025 * p})`,
        overflow: 'hidden',
        borderRadius: 26,
        border: '1px solid rgba(255,246,234,0.22)',
        background: '#1b0f17',
        boxShadow: `0 50px 120px rgba(0,0,0,0.68), 0 0 90px ${hexA(C.coralSoft, 0.12)}`,
      }}
    >
      <div
        style={{
          height: 46,
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '0 20px',
          background: 'linear-gradient(180deg, rgba(255,246,234,0.1), rgba(255,246,234,0.04))',
          borderBottom: '1px solid rgba(255,246,234,0.1)',
        }}
      >
        {['#d98a6a', '#d9b06a', '#8fbfa3'].map((color) => (
          <span key={color} style={{width: 11, height: 11, borderRadius: 99, background: color}} />
        ))}
        <span
          style={{
            marginLeft: 12,
            padding: '5px 18px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,246,234,0.08)',
            fontFamily: F.mono,
            fontSize: 13,
            color: C.muted,
          }}
        >
          kinwoven.local · on this device
        </span>
      </div>
      <Img src={staticFile(src)} alt={alt} style={{display: 'block', width: '100%'}} />
    </div>
  );
};

const Point: React.FC<{at: number; n: string; title: string; body: string}> = ({
  at,
  n,
  title,
  body,
}) => (
  <Pop at={at} x={-26} y={20}>
    <div style={{display: 'flex', gap: 16, alignItems: 'flex-start'}}>
      <div
        style={{
          flex: '0 0 auto',
          width: 38,
          height: 38,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          border: `1px solid ${hexA(C.coral, 0.5)}`,
          background: hexA(C.coral, 0.14),
          color: C.coralSoft,
          fontFamily: F.mono,
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        {n}
      </div>
      <div>
        <div style={{fontFamily: F.body, fontSize: 22, fontWeight: 700, color: C.ink}}>{title}</div>
        <div style={{marginTop: 4, fontFamily: F.body, fontSize: 18, lineHeight: 1.45, color: C.muted}}>
          {body}
        </div>
      </div>
    </div>
  </Pop>
);

const Header: React.FC<{eyebrow: string; title: string; size?: number; at?: number}> = ({
  eyebrow,
  title,
  size = 62,
  at = 0.25,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
    <Eyebrow text={eyebrow} at={at} />
    <Title text={title} at={at + 0.1} size={size} />
  </div>
);

export const Hook: React.FC = () => (
  <AbsoluteFill
    style={{
      padding: '110px 120px 100px',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 70,
    }}
  >
    <div style={{flex: 1.08, display: 'flex', flexDirection: 'column', gap: 26}}>
      <Eyebrow text="A keepsake from one photo" at={0.2} />
      <Title text="Every photo has a story." at={0.4} size={84} />
      <Title text="The rest lives in [the details]." at={1.05} size={84} />
      <Pop at={1.95} y={18}>
        <div
          style={{
            maxWidth: 720,
            fontFamily: F.body,
            fontSize: 27,
            lineHeight: 1.5,
            color: C.muted,
          }}
        >
          One photo and a few remembered things become a short story the family approves and keeps.
        </div>
      </Pop>
      <div style={{display: 'flex', gap: 12, marginTop: 4}}>
        <Pop at={2.3} y={12}>
          <Chip tone="coral" size={18}>
            Local-first
          </Chip>
        </Pop>
        <Pop at={2.5} y={12}>
          <Chip tone="green" size={18}>
            No account
          </Chip>
        </Pop>
      </div>
    </div>
    <div style={{flex: 0.92, display: 'flex', justifyContent: 'center'}}>
      <PhotoCard at={1.15} src="photo.jpg" caption="The kitchen table, and the radio" width={600} />
    </div>
  </AbsoluteFill>
);

const REASONS = [
  {n: '01', label: 'THE NAMES', title: 'The names', body: 'Who is in it, and who took the picture.'},
  {n: '02', label: 'THE RITUAL', title: 'The ritual', body: 'Why Sunday, and what was always on the table.'},
  {n: '03', label: 'THE SOUND', title: 'The sound', body: 'The song on the radio, and who hummed along.'},
];

export const Problem: React.FC = () => (
  <AbsoluteFill style={{padding: pad}}>
    <Header
      eyebrow="Why family stories disappear"
      title="The photo is saved. The meaning [is not]."
      size={78}
    />
    <div style={{display: 'flex', gap: 28, marginTop: 40}}>
      {REASONS.map((reason, i) => (
        <Pop key={reason.n} at={1.1 + i * 0.8} y={70} style={{flex: 1}}>
          <Glass style={{height: 300, padding: 30, display: 'flex', flexDirection: 'column', gap: 12}}>
            <div style={{fontFamily: F.mono, fontSize: 14, letterSpacing: 2.5, color: C.coralSoft}}>
              {reason.n} · {reason.label}
            </div>
            <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 36, color: C.ink}}>
              {reason.title}
            </div>
            <div style={{fontFamily: F.body, fontSize: 21, lineHeight: 1.5, color: C.muted}}>
              {reason.body}
            </div>
          </Glass>
        </Pop>
      ))}
    </div>
    <Pop at={3.0} y={18}>
      <div
        style={{
          marginTop: 34,
          padding: '22px 30px',
          borderRadius: 18,
          border: `1px solid ${hexA(C.coral, 0.5)}`,
          background: `linear-gradient(90deg, ${hexA(C.coral, 0.12)}, ${hexA(C.coralSoft, 0.2)}, ${hexA(C.coral, 0.12)})`,
          fontFamily: F.body,
          fontSize: 24,
          color: C.ink,
        }}
      >
        One question, asked while someone still remembers.{' '}
        <span style={{color: C.coralSoft}}>That is the whole idea.</span>
      </div>
    </Pop>
  </AbsoluteFill>
);

export const CaptureDemo: React.FC = () => (
  <AbsoluteFill style={{padding: pad}}>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30}}>
      <Header eyebrow="Step 1 · Photo" title="One photo. A few plain notes." size={58} />
      <Pop at={0.8} y={12}>
        <Chip tone="green" size={18}>
          Stays on this device
        </Chip>
      </Pop>
    </div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 24}}>
      <Shot src="shots/capture.png" at={1.0} alt="Kinwoven capture screen with a photo and notes" />
    </div>
  </AbsoluteFill>
);

export const QuestionDemo: React.FC = () => (
  <AbsoluteFill style={{padding: pad}}>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30}}>
      <Header
        eyebrow="Step 2 · One question"
        title="One thing the photo cannot show."
        size={58}
      />
      <Pop at={0.8} y={12}>
        <Chip tone="coral" size={18}>
          Your words, not the model&apos;s
        </Chip>
      </Pop>
    </div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 24}}>
      <Shot src="shots/question.png" at={1.0} alt="Kinwoven privacy question screen" />
    </div>
  </AbsoluteFill>
);

export const DraftDemo: React.FC = () => (
  <AbsoluteFill style={{padding: pad}}>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30}}>
      <Header eyebrow="Step 3 · Draft & approve" title="Only your facts. [One exact approval]." size={56} />
      <Pop at={0.8} y={12}>
        <Chip tone="green" size={18}>
          Plain draft path · labelled
        </Chip>
      </Pop>
    </div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 22}}>
      <Shot src="shots/draft.png" at={1.0} alt="Kinwoven draft screen with approval action" />
    </div>
    <Pop at={3.0} y={30} style={{position: 'absolute', right: 76, bottom: 96, width: 330}}>
      <Glass
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          background: 'rgba(23,11,20,0.94)',
          backdropFilter: 'blur(14px)',
        }}
        glow={C.green}
        active={0.6}
      >
        <div style={{fontFamily: F.mono, fontSize: 13, letterSpacing: 1.8, color: C.green}}>
          APPROVED · REVISION 3
        </div>
        <div style={{fontFamily: F.display, fontWeight: 700, fontSize: 28, color: C.ink}}>
          Bound to this version
        </div>
        <div style={{fontFamily: F.body, fontSize: 17, lineHeight: 1.45, color: C.muted}}>
          SHA-256 covers the words, the cited notes and the photo. Any later edit clears it.
        </div>
      </Glass>
    </Pop>
  </AbsoluteFill>
);

export const PlayDemo: React.FC = () => (
  <AbsoluteFill style={{padding: pad}}>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30}}>
      <Header eyebrow="Step 4 · Play" title="Play it together." size={62} />
      <Pop at={0.8} y={12}>
        <Chip tone="coral" size={18}>
          Approved version only
        </Chip>
      </Pop>
    </div>
    <div style={{display: 'flex', justifyContent: 'center', marginTop: 26}}>
      <Shot src="shots/play.png" at={1.0} alt="Kinwoven story player with large controls" />
    </div>
  </AbsoluteFill>
);

export const Architecture: React.FC = () => (
  <AbsoluteFill style={{padding: '74px 120px 92px'}}>
    <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 30}}>
      <Header
        eyebrow="Under the surface"
        title="Local by default. [Shared on purpose]."
        size={56}
      />
      <Pop at={0.8} y={12}>
        <Chip tone="coral" size={16}>
          No upload until you share
        </Chip>
      </Pop>
    </div>
    <Pop at={1.0} y={40} style={{marginTop: 20, display: 'flex', justifyContent: 'center'}}>
      <div
        style={{
          width: 1120,
          overflow: 'hidden',
          borderRadius: 22,
          border: '1px solid rgba(255,246,234,0.24)',
          boxShadow: `0 40px 100px rgba(0,0,0,0.62), 0 0 70px ${hexA(C.coralSoft, 0.16)}`,
        }}
      >
        <Img
          src={staticFile('architecture.png')}
          alt="Kinwoven architecture: local IndexedDB and draft engine, approval bound by SHA-256, opt-in App Check cloud path, explicit share to Firestore and Storage, family read."
          style={{display: 'block', width: '100%'}}
        />
      </div>
    </Pop>
  </AbsoluteFill>
);

export const Outro: React.FC = () => (
  <AbsoluteFill
    style={{
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 38,
      padding: '0 160px',
    }}
  >
    <Pop at={0.2} y={30}>
      <div
        style={{
          padding: '26px 34px',
          borderRadius: 26,
          background: '#fffaf1',
          border: '1px solid rgba(255,255,255,0.7)',
          boxShadow: `0 40px 90px rgba(0,0,0,0.5), 0 0 80px ${hexA(C.coralSoft, 0.28)}`,
        }}
      >
        <Img src={staticFile('logo.png')} style={{display: 'block', width: 520}} />
      </div>
    </Pop>
    <Title
      text="The photo is saved. The story is [yours to tell]."
      at={0.8}
      size={64}
      style={{justifyContent: 'center', textAlign: 'center', maxWidth: 1320}}
    />
    <Pop at={1.8} y={14}>
      <Chip tone="coral" size={20}>
        kinwoven.local · local-first · family-approved
      </Chip>
    </Pop>
    <Pop at={2.4} y={12}>
      <div style={{fontFamily: F.body, fontSize: 18, color: C.muted}}>
        Demo uses a synthetic test photo, not family material.
      </div>
    </Pop>
  </AbsoluteFill>
);
