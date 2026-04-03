/**
 * TransitionsTimeline.data.test.ts — Task 3.6a — Agent_Interactive_Core
 *
 * Unit tests for buildTimelineData().
 *
 * Uses mock data shaped like Astro collection entry `.data` objects so the
 * transformation can be verified independently of the Astro runtime.
 *
 * Pass `currentYear: 2026` explicitly to keep yearMax snapshots stable
 * regardless of when tests run.
 */

import { describe, it, expect } from 'vitest';
import {
  buildTimelineData,
  type TransitionInput,
  type ChapterInput,
} from './TransitionsTimeline.data';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSITIONS: TransitionInput[] = [
  { transition_number: 1, title: 'From the Body to the Budget',  date_start: 1830, date_end: 1905 },
  { transition_number: 2, title: 'The Welfare State Settlement', date_start: 1905, date_end: 1945 },
  { transition_number: 3, title: 'The Technocratic Turn',        date_start: 1945, date_end: 1975 },
  { transition_number: 4, title: 'The Market Consensus',         date_start: 1975, date_end: 2000 },
  { transition_number: 5, title: 'The Algorithmic State',        date_start: 2000 },
];

/** 18 chapters mirroring the real content stubs. */
function makeMockChapters(): ChapterInput[] {
  return [
    { chapter_number:  1, title: 'The Statistician\'s Stomach', transition: 1, threads: ['scottish-thread'] },
    { chapter_number:  2, title: 'The Eugenic Ledger',          transition: 1, threads: ['scottish-thread', 'gender-thread'] },
    { chapter_number:  3, title: 'Ch 3',  transition: 2, threads: [] },
    { chapter_number:  4, title: 'The Grocery List as Resistance', transition: 2, threads: ['gender-thread'] },
    { chapter_number:  5, title: 'Ch 5',  transition: 3, threads: [] },
    { chapter_number:  6, title: 'Ch 6',  transition: 3, threads: [] },
    { chapter_number:  7, title: 'Ch 7',  transition: 4, threads: [] },
    { chapter_number:  8, title: 'Ch 8',  transition: 4, threads: [] },
    { chapter_number:  9, title: 'Ch 9',  transition: 4, threads: [] },
    { chapter_number: 10, title: 'Ch 10', transition: 5, threads: [] },
    { chapter_number: 11, title: 'Ch 11', transition: 5, threads: [] },
    { chapter_number: 12, title: 'Ch 12', transition: 5, threads: [] },
    { chapter_number: 13, title: 'Ch 13', transition: 5, threads: [] },
    { chapter_number: 14, title: 'Ch 14', transition: 5, threads: [] },
    { chapter_number: 15, title: 'Ch 15', transition: 5, threads: [] },
    { chapter_number: 16, title: 'Ch 16', transition: 4, threads: [] },
    { chapter_number: 17, title: 'Ch 17', transition: 4, threads: [] },
    { chapter_number: 18, title: 'Ch 18', transition: 5, threads: [] },
  ];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('buildTimelineData', () => {
  // Build once; tests share the same result object.
  const data = buildTimelineData(MOCK_TRANSITIONS, makeMockChapters(), 2026);

  it('produces 5 transition bands', () => {
    expect(data.transitions).toHaveLength(5);
  });

  it('transitions are ordered by number (1 → 5)', () => {
    const numbers = data.transitions.map((t) => t.number);
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  it('yearMin is the earliest date_start (1830)', () => {
    expect(data.yearMin).toBe(1830);
  });

  it('yearMax uses supplied currentYear for open-ended transition 5 (2026)', () => {
    expect(data.yearMax).toBe(2026);
  });

  it('transition 5 has dateEnd === undefined', () => {
    const t5 = data.transitions.find((t) => t.number === 5);
    expect(t5?.dateEnd).toBeUndefined();
  });

  it('transition bands have correct slug-format ids', () => {
    const ids = data.transitions.map((t) => t.id);
    expect(ids).toEqual([
      'transition-01',
      'transition-02',
      'transition-03',
      'transition-04',
      'transition-05',
    ]);
  });

  it('transition 1 chapters contain ch-1 and ch-2 (sorted)', () => {
    const t1 = data.transitions.find((t) => t.number === 1);
    expect(t1?.chapters.map((c) => c.number)).toEqual([1, 2]);
  });

  it('transition 4 has 3 chapters (ch-7, ch-8, ch-9, ch-16, ch-17)', () => {
    const t4 = data.transitions.find((t) => t.number === 4);
    expect(t4?.chapters.map((c) => c.number)).toEqual([7, 8, 9, 16, 17]);
  });

  it('scots-thread chapterNumbers === [1, 2]', () => {
    const scottish = data.threads.find((t) => t.slug === 'scottish-thread');
    expect(scottish?.chapterNumbers).toEqual([1, 2]);
  });

  it('gender-thread chapterNumbers === [2, 4]', () => {
    const gender = data.threads.find((t) => t.slug === 'gender-thread');
    expect(gender?.chapterNumbers).toEqual([2, 4]);
  });

  it('produces exactly 2 thread strands', () => {
    expect(data.threads).toHaveLength(2);
  });

  it('colour tokens are CSS custom property names starting with --color-', () => {
    for (const t of data.transitions) {
      expect(t.colour).toMatch(/^--color-/);
    }
    for (const strand of data.threads) {
      expect(strand.colour).toMatch(/^--color-/);
    }
  });

  it('is deterministic when input transitions are provided in reverse order', () => {
    const shuffled = [...MOCK_TRANSITIONS].reverse();
    const data2 = buildTimelineData(shuffled, makeMockChapters(), 2026);
    expect(data2.transitions.map((t) => t.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('chapters without a transition field are excluded from all bands', () => {
    const noTransitionChapter: ChapterInput = {
      chapter_number: 99, title: 'Sample', transition: undefined, threads: [],
    };
    const data3 = buildTimelineData(
      MOCK_TRANSITIONS,
      [...makeMockChapters(), noTransitionChapter],
      2026,
    );
    const allChapterNums = data3.transitions.flatMap((t) => t.chapters.map((c) => c.number));
    expect(allChapterNums).not.toContain(99);
  });
});
