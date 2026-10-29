/**
 * services-contact.ts
 * Every mailto: link on /services and its documents, built in one place so
 * the subjects and prompts are encoded the same way everywhere (RFC 6068:
 * percent-encoded, CRLF line breaks). Contact stays email-only: no forms.
 *
 * Also the ProfessionalService JSON-LD for /services (ServicesLayout renders
 * it when the page's frontmatter sets `professionalService: true`).
 */

export const SERVICES_EMAIL = 'stephen@zktheory.org';

/** mailto: URL with an encoded subject and optional body. */
export function mailto(subject: string, body?: string): string {
  const params = [`subject=${encodeURIComponent(subject)}`];
  if (body) params.push(`body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`);
  return `mailto:${SERVICES_EMAIL}?${params.join('&')}`;
}

const summaryBody = (numberLine: string, typeLine: string) =>
  [
    'Hello Stephen,',
    '',
    "Please send me a free one-page summary of our organisation's published figures.",
    '',
    'Organisation name:',
    numberLine,
    typeLine,
    '',
    'Thanks,',
  ].join('\n');

export const mailtos = {
  enquiry: mailto('Reporting and analysis enquiry'),
  freeSummary: mailto(
    'Free one-page summary',
    summaryBody(
      'Charity number, UKPRN or company number:',
      'Type (charity / training provider / alternative provision / other):'
    )
  ),
  freeSummaryCharity: mailto(
    'Free summary: charity',
    summaryBody('Charity number:', 'Type: charity')
  ),
  freeSummaryTrainingProvider: mailto(
    'Free summary: training provider',
    summaryBody('UKPRN:', 'Type: training provider')
  ),
  freeSummaryAlternativeProvision: mailto(
    'Free summary: alternative provision',
    summaryBody(
      'Company or charity number, and the council areas you work in:',
      'Type: alternative provision'
    )
  ),
  deprivationCheck: mailto(
    'Free deprivation check',
    [
      'Hello Stephen,',
      '',
      'Please send me the free deprivation check.',
      '',
      'Organisation name:',
      'Area you work in (Dorset, BCP, Somerset, Wiltshire or Swindon):',
      '',
      'Thanks,',
    ].join('\n')
  ),
  networks: mailto(
    'Session or bulletin item for our members',
    [
      'Hello Stephen,',
      '',
      'Organisation name:',
      'Who our members are:',
      'What we would like (online session / bulletin item / summaries for members):',
      '',
      'Thanks,',
    ].join('\n')
  ),
} as const;

export const professionalService = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Stephen Dorman: reporting and data analysis for small organisations',
  url: 'https://zktheory.org/services/',
  email: SERVICES_EMAIL,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Dorset' },
    { '@type': 'Country', name: 'United Kingdom' },
  ],
  description:
    'Reporting, monitoring and evaluation data, and fixed-price analysis for small charities, training providers and alternative provision, from Dorset and remotely across the UK.',
} as const;
