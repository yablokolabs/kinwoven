import React from 'react';
import {
  Architecture,
  CaptureDemo,
  DraftDemo,
  Hook,
  OnDeviceProof,
  Outro,
  PlayDemo,
  Problem,
  QuestionDemo,
} from './scenes/Video';

export type SceneDef = {
  id: string;
  start: number;
  end: number;
  label: string;
  component: React.FC;
  chapter?: boolean;
  hue?: number;
  push?: number;
};

export const SCENES: SceneDef[] = [
  {id: 'hook', start: 0, end: 9, label: 'Intro', component: Hook, hue: 0},
  {id: 'problem', start: 9, end: 24, label: 'The problem', component: Problem, chapter: true, hue: 0.1},
  {id: 'capture', start: 24, end: 41, label: 'Capture', component: CaptureDemo, chapter: true, hue: 0.25, push: 0.02},
  {id: 'question', start: 41, end: 57, label: 'One question', component: QuestionDemo, chapter: true, hue: 0.35, push: 0.02},
  {id: 'draft', start: 57, end: 79, label: 'Draft & approve', component: DraftDemo, chapter: true, hue: 0.2, push: 0.02},
  {
    id: 'proof',
    start: 79,
    end: 109,
    label: 'On-device proof',
    component: OnDeviceProof,
    chapter: true,
    hue: 0.3,
    push: 0.015,
  },
  {id: 'play', start: 109, end: 123, label: 'Play', component: PlayDemo, chapter: true, hue: 0.45, push: 0.02},
  {
    id: 'architecture',
    start: 123,
    end: 149,
    label: 'How it works',
    component: Architecture,
    chapter: true,
    hue: 0.3,
    push: 0.015,
  },
  {id: 'outro', start: 149, end: 160, label: 'Outro', component: Outro, hue: 0},
];

export const TOTAL_SECONDS = SCENES[SCENES.length - 1].end;
