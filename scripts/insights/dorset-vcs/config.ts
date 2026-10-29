/**
 * config.ts: sources, areas and column names for the Dorset voluntary
 * sector insight (scripts/insights/dorset-vcs/run.ts).
 *
 * The column names follow the Charity Commission's register extract data
 * definitions. They were written without access to the live files (the
 * build environment could not reach them), so the pipeline checks every
 * header before reading and stops, printing the real header, if one is
 * missing. Fix the name here if that happens.
 */

export const CC_BASE = 'https://ccewuksprdoneregsadata1.blob.core.windows.net/data/txt';

export const CC_FILES = {
  charity: 'publicextract.charity',
  partA: 'publicextract.charity_annual_return_parta',
  history: 'publicextract.charity_annual_return_history',
  classification: 'publicextract.charity_classification',
} as const;

/** ONS postcode to local authority lookup, November 2025 (ArcGIS item id). */
export const ONS_LOOKUP_ITEM = 'c4f84c38814d4b82aa4760ade686c3cc';
export const ONS_LOOKUP_URL = `https://www.arcgis.com/sharing/rest/content/items/${ONS_LOOKUP_ITEM}/data`;

export const AREAS = [
  { code: 'E06000059', name: 'Dorset' },
  { code: 'E06000058', name: 'Bournemouth, Christchurch and Poole' },
] as const;

/** Upper bounds (exclusive) and labels for latest-income bands. */
export const INCOME_BANDS = [
  { label: 'Under £10k', max: 10_000 },
  { label: '£10k–£100k', max: 100_000 },
  { label: '£100k–£500k', max: 500_000 },
  { label: '£500k–£1.5m', max: 1_500_000 },
  { label: 'Over £1.5m', max: Infinity },
] as const;

export const TREND_YEARS = 5;

export const COLS = {
  charity: {
    extractDate: 'date_of_extract',
    org: 'organisation_number',
    linked: 'linked_charity_number',
    status: 'charity_registration_status',
    type: 'charity_type',
    latestIncome: 'latest_income',
    postcode: 'charity_contact_postcode',
  },
  partA: {
    org: 'organisation_number',
    periodEnd: 'fin_period_end_date',
    income: 'total_gross_income',
    volunteers: 'count_volunteers',
    govContracts: 'income_from_government_contracts',
    govGrants: 'income_from_government_grants',
    /** Yes/no flags: the income fields are left blank when a charity has none. */
    receivesContracts: 'charity_receives_govt_funding_contracts',
    receivesGrants: 'charity_receives_govt_funding_grants',
    /** True on each charity's most recent Part A. */
    latest: 'latest_fin_period_submitted_ind',
  },
  history: {
    org: 'organisation_number',
    periodEnd: 'fin_period_end_date',
    income: 'total_gross_income',
  },
  classification: {
    org: 'organisation_number',
    type: 'classification_type',
    description: 'classification_description',
  },
  /** Candidate names for the ONS lookup's postcode and LAD columns (first match wins). */
  onsPostcode: ['pcds', 'pcd', 'pcd7', 'pcd8'],
  /** LADnnCD in the postcode-to-LAD lookups; laua (NSPL) or oslaua (ONSPD) in the full postcode products. */
  onsLad: /^lad\d{2}cd$|^ladcd$|^laua$|^oslaua$/i,
} as const;

export const REGISTERED = 'Registered';
