/**
 * The insights registry: drafts are not built unless INSIGHTS_PREVIEW=1,
 * and every published insight has its frozen JSON.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { builtInsights, guides, insights, showDraftInsights } from './insights';
import { gbp, niceAxis } from '../lib/insight-format';

describe('insights registry', () => {
  it('builds no drafts in a normal build', () => {
    expect(showDraftInsights).toBe(false);
    expect(builtInsights.every((i) => !i.draft)).toBe(true);
  });

  it('has its frozen JSON for every published insight', () => {
    for (const i of insights.filter((x) => !x.draft)) {
      expect(existsSync(join(process.cwd(), 'src/data/insights', i.dataFile)), i.dataFile).toBe(
        true
      );
    }
  });

  it('lists the guides under /services/guides/', () => {
    for (const g of guides) expect(g.href).toMatch(/^\/services\/guides\/[a-z0-9-]+\/$/);
  });
});

describe('insight formatting', () => {
  it('formats pounds', () => {
    expect(gbp(456_700_000)).toBe('£456.7m');
    expect(gbp(2_000_000)).toBe('£2m');
    expect(gbp(23_000)).toBe('£23,000');
  });

  it('makes a rounded axis that covers the maximum', () => {
    expect(niceAxis(450)).toEqual({ max: 600, ticks: [0, 200, 400, 600] });
    expect(niceAxis(24)).toEqual({ max: 30, ticks: [0, 10, 20, 30] });
    expect(niceAxis(0)).toEqual({ max: 1, ticks: [0, 1] });
  });
});
