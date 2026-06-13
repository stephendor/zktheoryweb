import { describe, expect, it } from 'vitest';
import {
  mergeDerivedConnections,
  type HandAuthoredConnection,
} from './mergeDerivedConnections';
import type { DerivedConnection } from './contracts';

const handAuthored: HandAuthoredConnection[] = [
  {
    targetKind: 'paper',
    targetId: 'paper-10',
    href: '/tda/papers/paper-10/',
    label: 'Paper 10',
    title: 'Topological Fairness Analysis',
    palette: 'tda',
  },
];

const confirmedGenerated: DerivedConnection = {
  id: 'ch17-paper10-generated',
  source: {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
  },
  target: {
    kind: 'paper',
    id: 'paper-10',
    status: 'resolved',
    label: 'Paper 10',
    title: 'Topological Fairness Analysis',
  },
  connectionType: 'two-lenses',
  confidence: 'confirmed',
  rationale: 'Generated duplicate of a hand-authored connection.',
  origin: 'manual-fixture',
};

const reviewedGenerated: DerivedConnection = {
  id: 'ch17-method-generated',
  source: {
    kind: 'chapter',
    id: 'ch-17',
    status: 'resolved',
    label: 'Chapter 17',
    title: 'Toward an Ethics of Measurement',
  },
  target: {
    kind: 'method',
    id: 'persistent-homology',
    status: 'resolved',
    label: 'Method',
    title: 'Persistent Homology',
  },
  connectionType: 'method-used',
  confidence: 'reviewed',
  rationale: 'Reviewed generated method connection.',
  origin: 'manual-fixture',
};

const proposedGenerated: DerivedConnection = {
  ...reviewedGenerated,
  id: 'ch17-proposed-generated',
  confidence: 'proposed',
  target: {
    kind: 'interlude',
    id: 'mm3-logistic-regression',
    status: 'resolved',
    label: 'Interlude',
    title: 'Logistic Regression and Classification',
  },
};

describe('mergeDerivedConnections', () => {
  it('keeps hand-authored links first and removes generated duplicates', () => {
    const merged = mergeDerivedConnections(handAuthored, [
      confirmedGenerated,
      reviewedGenerated,
    ]);

    expect(merged.map((entry) => entry.title)).toEqual([
      'Topological Fairness Analysis',
      'Persistent Homology',
    ]);
    expect(merged[0]?.source).toBe('hand-authored');
    expect(merged[1]?.source).toBe('generated');
  });

  it('filters proposed generated connections from public output', () => {
    const merged = mergeDerivedConnections([], [proposedGenerated]);
    expect(merged).toEqual([]);
  });

  it('maps generated references to renderable connection cards', () => {
    const merged = mergeDerivedConnections([], [reviewedGenerated]);

    expect(merged[0]).toMatchObject({
      href: '/tda/methods/persistent-homology/',
      label: 'Method',
      palette: 'tda',
      source: 'generated',
    });
  });
});
