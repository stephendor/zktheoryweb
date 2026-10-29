/**
 * types.ts: schemas of the frozen insight JSON files in this folder, written
 * by the pipelines in scripts/insights/ and read by the insight pages.
 * A null number means the value was withheld (fewer than 5 organisations).
 */

export interface CountShare {
  label: string;
  count: number | null;
  /** Percentage of the group total, one decimal place. */
  share: number | null;
}

export interface DorsetVcsArea {
  code: string;
  name: string;
  charities: number | null;
  totalIncome: number | null;
  medianIncome: number | null;
  incomeBands: CountShare[];
}

export interface DorsetVcsInsight {
  schema: 'dorset-vcs/1';
  /** Date of the Charity Commission register extract (YYYY-MM-DD). */
  extractDate: string;
  generatedAt: string;
  postcodeLookup: string;
  totals: {
    charities: number;
    withIncome: number;
    noIncomeReported: number | null;
    /** £, rounded to the nearest £100,000. */
    totalIncome: number | null;
    /** £, rounded to the nearest £1,000. */
    medianIncome: number | null;
  };
  incomeBands: CountShare[];
  trend: {
    yearEnding: number;
    filers: number | null;
    medianIncome: number | null;
    totalIncome: number | null;
  }[];
  government: {
    charitiesWithPartA: number;
    shareReceiving: number | null;
    shareOfIncome: number | null;
  };
  volunteers: {
    charitiesReporting: number;
    total: number | null;
    median: number | null;
  };
  legalForm: CountShare[];
  classification: { what: CountShare[]; who: CountShare[]; how: CountShare[] };
  areas: DorsetVcsArea[];
  methods: string[];
  limits: string[];
}
