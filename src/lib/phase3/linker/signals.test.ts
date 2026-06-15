import { describe, expect, it } from 'vitest';
import { evidenceForPair, normalizedTokens, scoreEvidence } from './signals';
import type { LinkableNote } from './contracts';

const siteReference = {
  kind: 'method',
  id: 'measurement',
  status: 'resolved',
  label: 'Method',
  title: 'Measurement',
} as const;

function note(overrides: Partial<LinkableNote>): LinkableNote {
  return {
    sourceId: 'tda-research',
    relativePath: 'note.md',
    title: 'Persistent Measurement',
    frontmatter: {},
    citekeys: [],
    siteReference,
    ...overrides,
  };
}

describe('normalizedTokens', () => {
  it('lowercases, removes punctuation, drops stopwords, and returns sorted tokens', () => {
    expect(normalizedTokens('The Ethics of Persistent Measurement')).toEqual([
      'ethics',
      'measurement',
      'persistent',
    ]);
  });
});

describe('evidenceForPair', () => {
  it('puts shared citekey evidence before weaker token evidence and includes shared concepts', () => {
    const evidence = evidenceForPair(
      note({
        title: 'Persistent Measurement',
        citekeys: ['bauer2021ripser'],
        frontmatter: {
          concepts: ['measurement', 'persistent homology'],
          tags: ['topology'],
        },
      }),
      note({
        sourceId: 'counting-lives',
        relativePath: 'ethics.md',
        title: 'Ethics of Measurement',
        citekeys: ['bauer2021ripser'],
        frontmatter: {
          concepts: ['measurement', 'poverty'],
          keywords: ['ethics'],
        },
      }),
    );

    expect(evidence[0]).toEqual({
      kind: 'shared-citekey',
      value: 'bauer2021ripser',
      weight: 0.55,
    });
    expect(evidence).toContainEqual({
      kind: 'shared-concept',
      value: 'measurement',
      weight: 0.25,
    });
    expect(evidence.find((item) => item.kind === 'shared-citekey')).toBeDefined();
    expect(evidence.findIndex((item) => item.kind === 'shared-citekey')).toBeLessThan(
      evidence.findIndex((item) => item.kind === 'title-token'),
    );
  });
});

describe('scoreEvidence', () => {
  it('caps at 1 and rounds to three decimals', () => {
    expect(
      scoreEvidence([
        { kind: 'shared-citekey', value: 'a', weight: 0.5555 },
        { kind: 'shared-concept', value: 'b', weight: 0.4444 },
      ]),
    ).toBe(1);

    expect(
      scoreEvidence([
        { kind: 'shared-concept', value: 'a', weight: 0.1114 },
        { kind: 'shared-token', value: 'b', weight: 0.1114 },
      ]),
    ).toBe(0.223);
  });
});
