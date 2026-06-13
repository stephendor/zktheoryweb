import { describe, expect, it } from 'vitest';
import {
  mergeDerivedConnections,
  type HandAuthoredConnection,
} from './mergeDerivedConnections';
import type { DerivedConnection, SiteReference } from './contracts';

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

function generatedConnectionForTarget(
  target: SiteReference,
): DerivedConnection {
  return {
    ...reviewedGenerated,
    id: `generated-${target.kind}-${target.id}`,
    target,
  };
}

interface GeneratedMappingCase {
  name: string;
  target: SiteReference;
  expectedHref?: string;
  expectedPalette: 'tda' | 'cl';
  expectedDataTodo?: 'pending-route';
}

const generatedMappingCases: GeneratedMappingCase[] = [
  {
    name: 'chapter',
    target: {
      kind: 'chapter',
      id: 'ch-17',
      status: 'resolved',
      label: 'Chapter',
      title: 'Toward an Ethics of Measurement',
    },
    expectedHref: '/counting-lives/chapters/ch-17/',
    expectedPalette: 'cl',
  },
  {
    name: 'paper',
    target: {
      kind: 'paper',
      id: 'paper-10',
      status: 'resolved',
      label: 'Paper',
      title: 'Topological Fairness Analysis',
    },
    expectedHref: '/tda/papers/paper-10/',
    expectedPalette: 'tda',
  },
  {
    name: 'method',
    target: reviewedGenerated.target,
    expectedHref: '/tda/methods/persistent-homology/',
    expectedPalette: 'tda',
  },
  {
    name: 'interlude',
    target: {
      kind: 'interlude',
      id: 'mm3-logistic-regression',
      status: 'resolved',
      label: 'Interlude',
      title: 'Logistic Regression and Classification',
    },
    expectedHref: '/counting-lives/interludes/mm3-logistic-regression/',
    expectedPalette: 'cl',
  },
  {
    name: 'learn-module with slug',
    target: {
      kind: 'learn-module',
      id: 'path3-module-6',
      slug: 'path3-module-6',
      status: 'resolved',
      label: 'Learning Module',
      title: 'Fairness and Poverty Measurement',
    },
    expectedHref: '/learn/path3-module-6/',
    expectedPalette: 'tda',
  },
  {
    name: 'learn-module without slug',
    target: {
      kind: 'learn-module',
      id: 'path3-module-7',
      status: 'resolved',
      label: 'Learning Module',
      title: 'Pending Learning Module',
    },
    expectedPalette: 'tda',
  },
  {
    name: 'interactive',
    target: {
      kind: 'interactive',
      id: 'barcode-comparator',
      status: 'resolved',
      label: 'Interactive',
      title: 'Barcode Comparator',
    },
    expectedHref: '/learn/interactives/barcode-comparator/',
    expectedPalette: 'tda',
  },
  {
    name: 'writing-note',
    target: {
      kind: 'writing-note',
      id: 'note-1',
      status: 'resolved',
      label: 'Writing Note',
      title: 'Measurement Note',
    },
    expectedHref: '/writing/notes/note-1/',
    expectedPalette: 'tda',
  },
  {
    name: 'writing-essay',
    target: {
      kind: 'writing-essay',
      id: 'essay-1',
      status: 'resolved',
      label: 'Writing Essay',
      title: 'Measurement Essay',
    },
    expectedHref: '/writing/essays/essay-1/',
    expectedPalette: 'tda',
  },
  {
    name: 'external',
    target: {
      kind: 'external',
      id: 'external-resource',
      href: 'https://example.com/resource',
      status: 'external',
      label: 'External',
      title: 'External Resource',
    },
    expectedHref: 'https://example.com/resource',
    expectedPalette: 'tda',
  },
  {
    name: 'href override',
    target: {
      kind: 'paper',
      id: 'paper-10',
      href: '/custom/paper-link/',
      status: 'resolved',
      label: 'Paper',
      title: 'Topological Fairness Analysis',
    },
    expectedHref: '/custom/paper-link/',
    expectedPalette: 'tda',
  },
  {
    name: 'pending target',
    target: {
      kind: 'learn-module',
      id: 'future-module',
      status: 'pending',
      label: 'Learning Module',
      title: 'Future Module',
    },
    expectedPalette: 'tda',
    expectedDataTodo: 'pending-route',
  },
];

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

  it.each(generatedMappingCases)(
    'maps generated $name targets to renderable cards',
    ({ target, expectedHref, expectedPalette, expectedDataTodo }) => {
      const merged = mergeDerivedConnections([], [
        generatedConnectionForTarget(target),
      ]);

      expect(merged).toHaveLength(1);
      expect(merged[0]).toMatchObject({
        label: target.label,
        title: target.title,
        palette: expectedPalette,
        source: 'generated',
      });

      if (expectedHref) {
        expect(merged[0]?.href).toBe(expectedHref);
      } else {
        expect(merged[0]).not.toHaveProperty('href');
      }

      if (expectedDataTodo) {
        expect(merged[0]?.dataTodo).toBe(expectedDataTodo);
      } else {
        expect(merged[0]).not.toHaveProperty('dataTodo');
      }
    },
  );
});
