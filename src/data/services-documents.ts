/**
 * services-documents.ts
 * Every printable one-page document linked from /services: the HTML page it
 * is printed from and the PDF path under public/. Used by
 * scripts/build-example-pdfs.ts (to print) and services-examples.test.ts
 * (to check each PDF is tagged and one page).
 */
import { servicesExamples } from './services-examples';
import { checklists, serviceSheets } from './services-resources';

export const servicesDocuments: { page: string; pdf: string }[] = [
  ...servicesExamples.map((e) => ({ page: `services/examples/${e.slug}/`, pdf: `services/examples/${e.pdf}` })),
  ...checklists.map((c) => ({ page: `services/resources/${c.slug}/`, pdf: `services/resources/${c.pdf}` })),
  ...serviceSheets.map((s) => ({ page: `services/sheets/${s.slug}/`, pdf: `services/sheets/${s.pdf}` })),
];
