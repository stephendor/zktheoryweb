import type { LinkableNote, LinkEvidence } from './contracts';

const stopwords = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

const conceptFields = ['concepts', 'tags', 'keywords'] as const;

function sorted(values: Iterable<string>): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function normalizedTokens(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(
      (token) =>
        token.length >= 3 && !stopwords.has(token) && !/^\d+$/.test(token),
    );

  return sorted(new Set(tokens));
}

function normalizeCitekey(value: string): string {
  return value.trim().replace(/^@/, '').replace(/[.,;!?]+$/, '').toLowerCase();
}

function normalizeConcept(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function stringsFrom(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  }

  return [];
}

function conceptsFrom(note: LinkableNote): string[] {
  const concepts = new Set<string>();

  for (const field of conceptFields) {
    for (const value of stringsFrom(note.frontmatter[field])) {
      const concept = normalizeConcept(value);
      if (concept.length >= 3) {
        concepts.add(concept);
      }
    }
  }

  return sorted(concepts);
}

function sharedValues(left: Iterable<string>, right: Iterable<string>): string[] {
  const rightValues = new Set(right);
  return sorted([...new Set(left)].filter((value) => rightValues.has(value)));
}

function evidence(kind: LinkEvidence['kind'], value: string, weight: number): LinkEvidence {
  return { kind, value, weight };
}

export function evidenceForPair(
  tdaNote: LinkableNote,
  countingLivesNote: LinkableNote,
): LinkEvidence[] {
  const tdaCitekeys = tdaNote.citekeys.map(normalizeCitekey).filter(Boolean);
  const countingLivesCitekeys = countingLivesNote.citekeys
    .map(normalizeCitekey)
    .filter(Boolean);
  const sharedCitekeys = sharedValues(tdaCitekeys, countingLivesCitekeys).map((value) =>
    evidence('shared-citekey', value, 0.55),
  );

  const tdaConcepts = conceptsFrom(tdaNote);
  const countingLivesConcepts = conceptsFrom(countingLivesNote);
  const sharedConceptValues = sharedValues(tdaConcepts, countingLivesConcepts);
  const sharedConcepts = sharedConceptValues.map((value) =>
    evidence('shared-concept', value, 0.25),
  );

  // Tokens already accounted for by a shared concept must not be re-counted as
  // weaker title- or broader-token evidence, otherwise a concept word that also
  // appears in both titles (e.g. "measurement") would be scored twice.
  const conceptTokens = new Set(sharedConceptValues.flatMap(normalizedTokens));

  const tdaTitleTokens = normalizedTokens(tdaNote.title);
  const countingLivesTitleTokens = normalizedTokens(countingLivesNote.title);
  const sharedTitleTokenValues = sharedValues(
    tdaTitleTokens,
    countingLivesTitleTokens,
  ).filter((value) => !conceptTokens.has(value));
  const sharedTitleTokens = sharedTitleTokenValues.map((value) =>
    evidence('title-token', value, 0.15),
  );

  const coveredTokens = new Set([
    ...sharedTitleTokenValues,
    ...conceptTokens,
  ]);
  const tdaBroaderTokens = normalizedTokens(`${tdaNote.title} ${tdaConcepts.join(' ')}`);
  const countingLivesBroaderTokens = normalizedTokens(
    `${countingLivesNote.title} ${countingLivesConcepts.join(' ')}`,
  );
  const sharedBroaderTokens = sharedValues(tdaBroaderTokens, countingLivesBroaderTokens)
    .filter((value) => !coveredTokens.has(value))
    .map((value) => evidence('shared-token', value, 0.1));

  return [
    ...sharedCitekeys,
    ...sharedConcepts,
    ...sharedTitleTokens,
    ...sharedBroaderTokens,
  ];
}

export function scoreEvidence(evidence: LinkEvidence[]): number {
  const score = evidence.reduce((total, item) => total + item.weight, 0);
  return Math.min(1, Math.round(score * 1000) / 1000);
}
