/**
 * services-documents.ts
 * Every printable document linked from /services: the HTML page it is
 * printed from and the PDF path under public/. Used by
 * scripts/build-example-pdfs.ts (to print) and services-examples.test.ts
 * (to check each PDF is tagged, and one page unless `multiPage`).
 *
 * Examples, checklists and sheets are one A4 page; guides may run longer.
 */
import { servicesExamples } from './services-examples';
import { checklists, serviceSheets } from './services-resources';

export interface ServicesDocument {
  page: string;
  pdf: string;
  /** Guides: allowed more than one page. Everything else must be exactly one. */
  multiPage?: boolean;
}

/** Guides printed to PDF (multi-page). */
export const guideDocuments: ServicesDocument[] = [
  {
    page: 'services/guides/trustees-report-impact-data/',
    pdf: 'services/guides/trustees-report-impact-data.pdf',
    multiPage: true,
  },
];

export const servicesDocuments: ServicesDocument[] = [
  ...servicesExamples.map((e) => ({
    page: `services/examples/${e.slug}/`,
    pdf: `services/examples/${e.pdf}`,
  })),
  ...checklists.map((c) => ({
    page: `services/resources/${c.slug}/`,
    pdf: `services/resources/${c.pdf}`,
  })),
  ...serviceSheets.map((s) => ({
    page: `services/sheets/${s.slug}/`,
    pdf: `services/sheets/${s.pdf}`,
  })),
  ...guideDocuments,
];
