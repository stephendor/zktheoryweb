/**
 * config.ts: sources, scope and column names for the South West
 * apprenticeship achievement insight (scripts/insights/sw-apprenticeships/run.ts).
 *
 * Inputs (download by hand; see scripts/insights/README.md):
 *  - DfE Explore Education Statistics, Apprenticeships 2025/26 release:
 *    "Achievement Rates Providers - Volumes and Rates by Provider, SSA T1,
 *    Level, Standard-framework name" (CSV);
 *    (na05_app_narts_provider_level_fwk_std_ptype_202526_14.csv);
 *  - Ofsted further education and skills management information, providers
 *    as at 31 August 2025 (CSV), for region and local authority, joined by
 *    UKPRN.
 *
 * The rates column names are checked against the 2025/26 file. The Ofsted
 * column names are not yet: the pipeline checks headers before reading and
 * stops, printing the real header, if one is missing.
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
  /** DfE's provider_type for independent training providers. */
  providerType: /^Private Sector Public Funded$/,
  region: 'South West',
  /** Also in scope, though in the South East region. */
  localAuthorities: ['Hampshire', 'Portsmouth', 'Southampton'],
};

/** Chosen from the 2022/23 to 2024/25 spread of independent providers' retention (median about 58% to 69%). */
export const RETENTION_BANDS = [
  { label: 'Under 60%', max: 60 },
  { label: '60% to under 75%', max: 75 },
  { label: '75% and over', max: Infinity },
] as const;

export const COLS = {
  rates: {
    year: 'time_period',
    ukprn: 'provider_ukprn',
    providerType: 'provider_type',
    ssa: 'ssa_tier_1',
    level: 'level',
    standard: 'std_fwk_name_stcode',
    leavers: 'leavers',
    achievementRate: 'achievement_rate',
    retentionRate: 'retention_rate',
    /** Optional: the age-band breakdown uses these when the file has them. */
    ageGroup: 'age_group',
    ageYouthAdult: 'age_youth_adult',
  },

  /**
   * Ofsted's "Further education and skills: inspection data as at 31 August
   * 2025" CSV. Candidate names, first match wins: earlier editions used
   * "Region" (government office region) and "Ofsted region".
   */
  ofsted: {
    ukprn: ['Provider UKPRN', 'UKPRN'],
    region: ['Region', 'Provider region', 'Ofsted region'],
    localAuthority: ['Local authority', 'Provider local authority'],
  },
} as const;

/** The filter value that marks an all-categories subtotal row. */
export const TOTAL_VALUES = /^total$/i;
