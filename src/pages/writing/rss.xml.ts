/**
 * rss.xml.ts — Task 2.5 — Agent_Design_Templates
 * RSS feed for the writing section (essays + notes).
 *
 * Route: /writing/rss.xml
 * Feed: all non-draft essays and notes, sorted by date descending.
 */

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const [essays, notes] = await Promise.all([
    getCollection('essays', ({ data }) => !data.draft),
    getCollection('notes',  ({ data }) => !data.draft),
  ]);

  type EssayEntry = (typeof essays)[number] & { variant: 'essay' };
  type NoteEntry  = (typeof notes)[number]  & { variant: 'note'  };

  const allEntries: Array<EssayEntry | NoteEntry> = [
    ...essays.map((e): EssayEntry => ({ ...e, variant: 'essay' })),
    ...notes.map((e): NoteEntry  => ({ ...e, variant: 'note'  })),
  ].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: 'zktheory.org — Writing',
    description:
      'Essays and notes on poverty measurement, TDA, and research methodology',
    site: context.site!,
    items: allEntries.map((entry) => {
      const collection = entry.variant === 'essay' ? 'essays' : 'notes';
      const summary =
        'summary' in entry.data
          ? (entry.data as { summary?: string }).summary ?? ''
          : '';
      return {
        title: entry.data.title,
        pubDate: entry.data.date,
        description: summary,
        link: `/writing/${collection}/${entry.id}/`,
      };
    }),
    customData: `<language>en-gb</language>`,
  });
}
