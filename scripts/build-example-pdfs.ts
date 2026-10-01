/**
 * build-example-pdfs.ts
 * Prints every printable /services document from the built site (dist/) to
 * a tagged, one-page A4 PDF under public/services/:
 *   /services/examples/<slug>/   -> public/services/examples/<pdf>
 *   /services/resources/<slug>/  -> public/services/resources/<pdf>
 *   /services/sheets/<slug>/     -> public/services/sheets/<pdf>
 *
 * Chromium's tagged-PDF output carries the page's structure (headings,
 * lists, table header cells), the document language from <html lang> and the
 * charts' text alternatives, which ReportLab could not produce.
 *
 * Usage: npm run build:example-pdfs   (builds the site first, then prints)
 * Then rebuild or redeploy so dist/ picks up the new PDFs, and commit them.
 */
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import type { AddressInfo } from 'node:net';
import { chromium } from '@playwright/test';
import { servicesDocuments } from '../src/data/services-documents';

const DIST = resolve('dist');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/ has no build. Run `npm run build` first (or use `npm run build:example-pdfs`).');
  process.exit(1);
}

// Minimal static server for dist/ so fonts and CSS load exactly as deployed.
const server = createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  let file = normalize(join(DIST, urlPath));
  if (!file.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
const { port } = server.address() as AddressInfo;

const browser = await chromium.launch();
let failed = false;
try {
  const page = await browser.newPage({ colorScheme: 'light' });
  for (const job of servicesDocuments) {
    const url = `http://127.0.0.1:${port}/${job.page}`;
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`${url} returned ${response?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });

    const out = resolve('public', job.pdf);
    mkdirSync(dirname(out), { recursive: true });
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true });

    const pdf = readFileSync(out).toString('latin1');
    const pages = (pdf.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    const tagged = pdf.includes('/StructTreeRoot') && pdf.includes('/Lang');
    console.log(`${job.pdf}: ${pages} page(s), ${Math.round(statSync(out).size / 1024)} KB, tagged: ${tagged}`);
    if (pages !== 1 || !tagged) failed = true;
  }
} finally {
  await browser.close();
  server.close();
}

if (failed) {
  console.error('At least one PDF is not a single tagged page. Adjust the @media print rules for that page.');
  process.exit(1);
}
