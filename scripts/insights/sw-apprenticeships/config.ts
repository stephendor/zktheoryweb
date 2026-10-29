/**
 * config.ts: sources, scope and column names for the South West
 * apprenticeship achievement insight (scripts/insights/sw-apprenticeships/run.ts).
 *
 * Inputs (download by hand; see scripts/insights/README.md):
 *  - DfE Explore Education Statistics, Apprenticeships 2025/26 release:
 *    "Achievement Rates Providers - Volumes and Rates by Provider, SSA T1,
 *    Level, Standard-framework name" (CSV);
 *  - Ofsted further education and skills management information, providers
 *    as at 31 August 2025 (CSV), for provider type, region and local
 *    authority, joined by UKPRN.
 *
 * Column names were written without access to the live files, from the
 * data catalogue's description. The pipeline checks headers before reading
 * and stops, printing the real header, if one is missing.
 */

export const RATES_DATASET_URL =
  'https://explore-education-statistics.service.gov.uk/data-catalogue/data-set/107f0f84-fac2-4655-bc72-19422a5acf33';

/** Academic years in scope, as time_period codes and labels. */
export const YEARS = [
  { code: '202223', label: '2022/23' },
  { code: '202324', label: '2023/24' },
  { code: '202425', label: '2024/25' },
] as const;

/** Providers in scope must have this many leavers in the year (inclusive). */
export const LEAVERS_MIN = 20;
export const LEAVERS_MAX = 600;

/** A provider's rate in one breakdown (age band, sector subject area) needs at least this many leavers. */
export const MIN_LEAVERS_IN_CELL = 5;

export const SCOPE = {
  providerType: /independent (learning|training) provider/i,
  region: 'South West',
  /** Also in scope, though in the South East region. */
  localAuthorities: ['Hampshire', 'Portsmouth', 'Southampton'],
};

export const RETENTION_BANDS = [
  { label: 'Under 70%', max: 70 },
  { label: '70% to under 80%', max: 80 },
  { label: '80% and over', max: Infinity },
] as const;

export const COLS = {
  rates: {
    year: 'time_period',
    ukprn: 'provider_ukprn',
    ssa: 'ssa_tier_1',
    level: 'level',
    standard: 'std_fwk_name',
    leavers: 'leavers',
    /** DfE's published retention rate (%) for the row. */
    retentionRate: 'retention_rate',
    achievers: 'achievers',
    /** Optional: used for the age-band measure when the file has it. */
    age: 'age_summary',
  },
  ofsted: {
    ukprn: 'Provider UKPRN',
    type: 'Provider type',
    region: 'Provider region',
    localAuthority: 'Local authority',
  },
} as const;

/** Filter values that mark an all-categories subtotal row (excluded, to avoid double counting). */
export const TOTAL_VALUES = /^(total|all|all ages|all levels)$/i;
