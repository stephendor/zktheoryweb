/**
 * e2e/services.spec.ts
 *
 * Checks for the /services pages that axe does not cover:
 *  - every mailto: link parses, goes to the services address and has a subject;
 *  - the pages make no requests to other origins (no third-party scripts,
 *    fonts, analytics or images);
 *  - /services carries one ProfessionalService JSON-LD block, and no other
 *    services page does;
 *  - the deprivation check page has no download link (the workbook is sent
 *    by email, never hosted).
 *
 * Run `npm run build` first (`npm run test:e2e` does both).
 */
import { test, expect } from '@playwright/test';

const SERVICES_PAGES = [
  '/services/',
  '/services/resources/deprivation-check/',
  '/services/guides/trustees-report-impact-data/',
  '/services/insights/dorset-voluntary-sector-2026/',
  '/privacy/',
];

for (const url of SERVICES_PAGES) {
  test(`[services] ${url}: mailto links parse and carry a subject`, async ({ page }) => {
    await page.goto(url);
    // Page content only: the shared site footer has its own plain mailto.
    const hrefs = await page
      .locator('main a[href^="mailto:"]')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
    if (url !== '/privacy/') expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, href).not.toMatch(/\s/);
      const parsed = new URL(href);
      expect(parsed.pathname).toBe('stephen@zktheory.org');
      if (url !== '/privacy/') expect(parsed.searchParams.get('subject'), href).toBeTruthy();
    }
  });

  test(`[services] ${url}: no requests to other origins`, async ({ page, baseURL }) => {
    const origin = new URL(baseURL!).origin;
    const external: string[] = [];
    page.on('request', (req) => {
      const u = req.url();
      if (!u.startsWith(origin) && !u.startsWith('data:')) external.push(u);
    });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
}

test('[services] /services has the free-offer links and subjects', async ({ page }) => {
  await page.goto('/services/');
  const subjects = await page
    .locator('a[href^="mailto:"]')
    .evaluateAll((as) =>
      as.map((a) => new URL(a.getAttribute('href') ?? '').searchParams.get('subject'))
    );
  for (const subject of [
    'Reporting and analysis enquiry',
    'Free one-page summary',
    'Free summary: charity',
    'Free summary: training provider',
    'Free summary: alternative provision',
    'Free deprivation check',
    'Session or bulletin item for our members',
  ]) {
    expect(subjects, subject).toContain(subject);
  }
  await expect(
    page.getByRole('link', { name: /Ask for a free one-page summary of your organisation/ })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { level: 2, name: 'Free for small organisations' })
  ).toBeVisible();
  await expect(page.locator('main a[href="/services/insights/"]')).toBeVisible();
});

test('[services] /services has one ProfessionalService JSON-LD block', async ({ page }) => {
  await page.goto('/services/');
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks).toHaveLength(1);
  const data = JSON.parse(blocks[0]);
  expect(data['@type']).toBe('ProfessionalService');
  expect(data.email).toBe('stephen@zktheory.org');
  expect(data).not.toHaveProperty('priceRange');
  expect(data).not.toHaveProperty('review');
});

test('[services] other services pages carry no JSON-LD', async ({ page }) => {
  for (const url of ['/privacy/', '/services/resources/deprivation-check/']) {
    await page.goto(url);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  }
});

test('[services] deprivation check page offers no download', async ({ page }) => {
  await page.goto('/services/resources/deprivation-check/');
  const hrefs = await page
    .locator('a')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  expect(hrefs.filter((h) => /\.(xlsx?|ods|csv|pdf|zip)$/i.test(h))).toEqual([]);
  await expect(page.getByRole('link', { name: /Download/ })).toHaveCount(0);
});

test('[services] the trustees report guide is linked from the FAQ and the funder checklist', async ({
  page,
}) => {
  const guide = '/services/guides/trustees-report-impact-data/';
  for (const url of ['/services/', '/services/resources/funder-trustee-reporting-checklist/']) {
    await page.goto(url);
    await expect(page.locator(`a[href="${guide}"]`).first()).toBeVisible();
  }
  await page.goto(guide);
  await expect(page.getByRole('img', { name: /made-up data/ })).toBeVisible();
  await expect(page.getByText('Chart data')).toBeVisible();
  const pdf = page.getByRole('link', { name: /Download PDF/ });
  await expect(pdf).toHaveAttribute('href', '/services/guides/trustees-report-impact-data.pdf');
  const res = await page.request.get('/services/guides/trustees-report-impact-data.pdf');
  expect(res.ok()).toBe(true);
});

test('[services] the Dorset insight is published and listed, with charts and sources', async ({
  page,
}) => {
  await page.goto('/services/insights/');
  await expect(
    page.locator('a[href="/services/insights/dorset-voluntary-sector-2026/"]')
  ).toBeVisible();
  const res = await page.goto('/services/insights/dorset-voluntary-sector-2026/');
  expect(res?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /Dorset's voluntary sector in numbers, 2026/
  );
  await expect(page.getByRole('img', { name: /Bar chart of registered charities/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /full register download/ })).toBeVisible();
});
