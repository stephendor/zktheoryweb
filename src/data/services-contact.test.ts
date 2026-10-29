/**
 * Every services mailto: parses as a URL, goes to the services address, and
 * decodes back to the intended subject; bodies use CRLF line breaks.
 */
import { mailto, mailtos, professionalService, SERVICES_EMAIL } from './services-contact';

const SUBJECTS: Record<keyof typeof mailtos, string> = {
  enquiry: 'Reporting and analysis enquiry',
  freeSummary: 'Free one-page summary',
  freeSummaryCharity: 'Free summary: charity',
  freeSummaryTrainingProvider: 'Free summary: training provider',
  freeSummaryAlternativeProvision: 'Free summary: alternative provision',
  deprivationCheck: 'Free deprivation check',
  networks: 'Session or bulletin item for our members',
};

describe('services mailto links', () => {
  for (const [key, href] of Object.entries(mailtos)) {
    it(`${key} parses and carries its subject`, () => {
      const url = new URL(href);
      expect(url.protocol).toBe('mailto:');
      expect(url.pathname).toBe(SERVICES_EMAIL);
      expect(url.searchParams.get('subject')).toBe(SUBJECTS[key as keyof typeof mailtos]);
      // No raw spaces, newlines or ampersands left unencoded.
      expect(href).not.toMatch(/[\s]/);
      expect(href.split('&').length).toBeLessThanOrEqual(2);
    });
  }

  it('the free-summary body asks for name, number and type', () => {
    const body = new URL(mailtos.freeSummary).searchParams.get('body') ?? '';
    expect(body).toContain('Organisation name:');
    expect(body).toContain('Charity number, UKPRN or company number:');
    expect(body).toContain('Type (charity / training provider / alternative provision / other):');
    expect(body).toContain('\r\n');
    expect(body).not.toMatch(/[^\r]\n/);
  });

  it('encodes reserved characters (negative control)', () => {
    const href = mailto('A & B?', 'x=1&y=2');
    expect(new URL(href).searchParams.get('subject')).toBe('A & B?');
    expect(new URL(href).searchParams.get('body')).toBe('x=1&y=2');
  });
});

describe('ProfessionalService JSON-LD', () => {
  it('has the required fields and no prices or reviews', () => {
    expect(professionalService['@type']).toBe('ProfessionalService');
    expect(professionalService.email).toBe(SERVICES_EMAIL);
    expect(professionalService.url).toBe('https://zktheory.org/services/');
    expect(professionalService.areaServed.map((a) => a.name)).toEqual(['Dorset', 'United Kingdom']);
    const json = JSON.stringify(professionalService);
    expect(json).not.toMatch(/priceRange|review|aggregateRating/i);
  });
});
