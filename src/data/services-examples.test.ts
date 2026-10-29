/**
 * Checks for the printable /services documents (example reports, free
 * checklists, service sheets and guides):
 *  - every committed PDF is tagged (structure tree, marked content,
 *    document language) and exactly one page (guides: at least one), so an
 *    untagged replacement (e.g. a ReportLab export) fails here instead of
 *    shipping;
 *  - every totals row in the data adds up from its rows.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { servicesExamples } from './services-examples';
import { servicesDocuments } from './services-documents';

function pdfProblems(pdf: string, multiPage = false): string[] {
  const problems: string[] = [];
  if (!pdf.includes('/StructTreeRoot')) problems.push('no /StructTreeRoot (untagged)');
  if (!/\/MarkInfo\s*<<[^>]*\/Marked\s+true/.test(pdf)) problems.push('not marked as tagged (/MarkInfo)');
  if (!/\/Lang\s*\(/.test(pdf)) problems.push('no document language (/Lang)');
  const pages = (pdf.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
  if (multiPage ? pages < 1 : pages !== 1) problems.push(`${pages} pages, expected ${multiPage ? 'at least 1' : '1'}`);
  return problems;
}

function parseCount(cell: string): number | null {
  const clean = cell.replace(/,/g, '').replace(/^\+/, '');
  return /^-?\d+$/.test(clean) ? Number(clean) : null;
}

describe('services document PDFs', () => {
  it('flags an untagged PDF (negative control)', () => {
    const untagged = '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n3 0 obj << /Type /Page >> endobj';
    expect(pdfProblems(untagged)).toEqual([
      'no /StructTreeRoot (untagged)',
      'not marked as tagged (/MarkInfo)',
      'no document language (/Lang)',
    ]);
  });

  it('NEGATIVE CONTROL: a two-page PDF fails unless the document is multi-page', () => {
    const twoPages =
      '%PDF-1.4 /StructTreeRoot /MarkInfo << /Marked true >> /Lang (en) /Type /Page /Type /Page';
    expect(pdfProblems(twoPages)).toEqual(['2 pages, expected 1']);
    expect(pdfProblems(twoPages, true)).toEqual([]);
  });

  it('covers all thirteen documents, and only guides are multi-page', () => {
    expect(servicesDocuments).toHaveLength(13);
    expect(servicesDocuments.filter((d) => d.multiPage).every((d) => d.page.startsWith('services/guides/'))).toBe(
      true
    );
  });

  for (const doc of servicesDocuments) {
    it(`${doc.pdf} is tagged and ${doc.multiPage ? 'at least one page' : 'a single page'}`, () => {
      const pdf = readFileSync(join(process.cwd(), 'public', doc.pdf)).toString('latin1');
      expect(pdfProblems(pdf, doc.multiPage)).toEqual([]);
    });
  }
});

describe('services example data', () => {
  for (const example of servicesExamples) {
    const { rows, total } = example.table;
    if (!total) continue;

    it(`${example.slug}: totals row adds up`, () => {
      let checked = 0;
      total.forEach((cell, col) => {
        const expected = parseCount(cell);
        const values = rows.map((r) => parseCount(r[col]));
        if (expected === null || values.some((v) => v === null)) return; // text or percentage column
        expect(values.reduce((a, b) => a! + b!, 0), `${example.slug} column "${example.table.headers[col]}"`).toBe(expected);
        checked++;
      });
      expect(checked).toBeGreaterThan(0);
    });
  }
});
