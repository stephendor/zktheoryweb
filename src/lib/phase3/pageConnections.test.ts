import { describe, expect, it } from 'vitest';
import type { DerivedConnection, Phase3Export } from './contracts';
import type { HandAuthoredConnection } from './mergeDerivedConnections';
import {
  derivedConnectionsForSource,
  renderableDerivedConnectionGroup,
  renderHandAuthoredConnections,
} from './pageConnections';

const source = {
  kind: 'chapter',
  id: 'ch-17',
  status: 'resolved',
  label: 'Chapter 17',
  title: 'Toward an Ethics of Measurement',
} as const;

function connection(
  id: string,
  confidence: DerivedConnection['confidence'],
  targetId = 'paper-10',
): DerivedConnection {
  return {
    id,
    source,
    target: {
      kind: 'paper',
      id: targetId,
      status: 'resolved',
      label: `Paper ${targetId}`,
      title: `Generated ${targetId}`,
    },
    connectionType: 'two-lenses',
    confidence,
    rationale: 'Generated test connection.',
    origin: 'manual-fixture',
  };
}

const data: Phase3Export = {
  manifest: {
    schemaVersion: '1.0.0',
    generatedAt: '2026-06-13T00:00:00.000Z',
    exporter: { name: 'manual-fixture', version: '1.0.0' },
    sources: [],
    warnings: [],
  },
  twoLenses: [],
  derivedConnections: [
    connection('confirmed', 'confirmed'),
    connection('reviewed', 'reviewed', 'paper-09'),
    connection('proposed', 'proposed', 'paper-08'),
    {
      ...connection('different-source', 'confirmed', 'paper-07'),
      source: { ...source, kind: 'paper', id: 'paper-10', label: 'Paper 10' },
    },
  ],
  learningPaths: [],
};

describe('derivedConnectionsForSource', () => {
  it('filters by source kind and id and omits proposed links', () => {
    expect(
      derivedConnectionsForSource(data, { kind: 'chapter', id: 'ch-17' }).map(
        (entry) => entry.id,
      ),
    ).toEqual(['confirmed', 'reviewed']);
  });
});

describe('renderHandAuthoredConnections', () => {
  it('renders hand-authored connections through the shared merge helper', () => {
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

    expect(renderHandAuthoredConnections(handAuthored)[0]).toMatchObject({
      source: 'hand-authored',
      href: '/tda/papers/paper-10/',
    });
  });
});

describe('renderableDerivedConnectionGroup', () => {
  it('dedupes generated links against hand-authored targets', () => {
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
    const generated = derivedConnectionsForSource(data, {
      kind: 'chapter',
      id: 'ch-17',
    });

    const group = renderableDerivedConnectionGroup(generated, { handAuthored });

    expect(group?.subheading).toBe('Derived from Phase 3');
    expect(group?.connections.map((entry) => entry.title)).toEqual([
      'Generated paper-09',
    ]);
    expect(group?.connections[0]?.href).toBe('/tda/papers/paper-09/');
  });
});
