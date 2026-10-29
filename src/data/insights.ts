/**
 * insights.ts
 * The public-data insight pages under /services/insights/ and the guides
 * listed beside them on the /services/insights/ index.
 *
 * An insight with `draft: true` is not built, so it is in no page, sitemap,
 * search index or nav. Set INSIGHTS_PREVIEW=1 to build drafts locally for
 * review; never set it on Netlify. Each insight reads its frozen JSON from
 * src/data/insights/<dataFile>, written by its pipeline in scripts/insights/.
 */

export interface Insight {
  slug: string;
  title: string;
  description: string;
  /** File name in src/data/insights/. */
  dataFile: string;
  draft: boolean;
}

export interface Guide {
  href: string;
  title: string;
  description: string;
}

export const insights: Insight[] = [
  {
    slug: 'dorset-voluntary-sector-2026',
    title: "Dorset's voluntary sector in numbers, 2026",
    description:
      'Registered charities in Dorset and Bournemouth, Christchurch and Poole: size, income, five-year trends, government funding and volunteers, from the Charity Commission register.',
    dataFile: 'dorset-vcs-2026.json',
    draft: false,
  },
];

export const guides: Guide[] = [
  {
    href: '/services/guides/trustees-report-impact-data/',
    title: "The trustees' report: the impact and volunteer data to collect now",
    description:
      'What changed in 2026, and the impact and volunteer figures to record during the year.',
  },
];

export const showDraftInsights = process.env.INSIGHTS_PREVIEW === '1';

export const builtInsights = insights.filter((i) => !i.draft || showDraftInsights);

const dataFiles = import.meta.glob<unknown>('./insights/*.json', {
  eager: true,
  import: 'default',
});

/** The frozen JSON for an insight; throws at build time if it is missing. */
export function insightData<T>(insight: Insight): T {
  const data = dataFiles[`./insights/${insight.dataFile}`];
  if (!data) {
    throw new Error(
      `Insight "${insight.slug}" is not a draft but src/data/insights/${insight.dataFile} is missing. ` +
        'Run its pipeline in scripts/insights/ first.'
    );
  }
  return data as T;
}
