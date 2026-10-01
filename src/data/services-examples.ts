/**
 * services-examples.ts
 * Single source for the three synthetic example reports on /services.
 *
 * Each example renders as an accessible HTML page at
 * /services/examples/<slug>/ (src/pages/services/examples/[slug].astro).
 * The downloadable PDFs in public/services/examples/ are printed from those
 * pages by scripts/build-example-pdfs.ts, so they are tagged, carry a
 * document language and chart alternatives, and cannot drift from the HTML.
 *
 * After editing anything here, run `npm run build:example-pdfs` and commit
 * the regenerated PDFs.
 *
 * Every organisation, person and figure below is made up.
 */

export type ValueFormat = 'int' | 'gbp-k' | 'pct';

export interface LineSeries {
  name: string;
  values: number[];
  tone: 'primary' | 'secondary' | 'muted';
  dashed?: boolean;
  /** Label lines drawn at the end of the line, e.g. ['All projects', '200']. */
  endLabel: string[];
}

export interface LineChartSpec {
  kind: 'line';
  title: string;
  /** Text alternative: what the chart shows, for screen readers and the PDF. */
  alt: string;
  categories: string[];
  categoryHeading: string;
  series: LineSeries[];
  format: ValueFormat;
  yMin: number;
  yMax: number;
  yTicks: number[];
  yLabel: string;
  xLabel?: string;
  threshold?: { value: number; label: string };
}

export interface BarChartSpec {
  kind: 'bar';
  title: string;
  alt: string;
  categoryHeading: string;
  valueHeading: string;
  /** `label` may contain '\n' to break it over two lines in the chart. */
  bars: { label: string; value: number; display: string; highlight?: boolean }[];
  xMin: number;
  xMax: number;
  xTicks: number[];
  xLabel: string;
  reference?: { value: number; label: string };
}

export type ChartSpec = LineChartSpec | BarChartSpec;

export interface ServicesExample {
  slug: string;
  /** File name in public/services/examples/. */
  pdf: string;
  /** Short name used in link text and the page <title>. */
  name: string;
  description: string;
  heading: string;
  subtitle: string;
  tiles: { value: string; label: string }[];
  table: {
    title: string;
    headers: string[];
    rows: string[][];
    total?: string[];
    note: string;
  };
  charts: [ChartSpec, ChartSpec];
  checks: { title: string; items: string[] };
  insights: { title: string; items: string[] };
  closing: string;
}

const MONTHS = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

const CLOSING_TAIL =
  'It runs from the spreadsheets and exports the organisation already uses. ' +
  'The first step is a £295 Reporting & Insight Review — details at zktheory.org/services.';

export const servicesExamples: ServicesExample[] = [
  {
    slug: 'charity',
    pdf: 'charity-example.pdf',
    name: 'Charity funder and trustee pack',
    description:
      'Example funder and trustee pack for a small charity, built on made-up data: reach and outcomes by project, cost per outcome, and the checks before sign-off.',
    heading: 'Riverside Community Trust — Funder and trustee pack',
    subtitle: "July–September 2026 · Prepared from the Trust's existing activity and finance spreadsheets",
    tiles: [
      { value: '355', label: 'people reached this quarter' },
      { value: '104%', label: 'of outcome target met' },
      { value: '+118%', label: 'growth in Skills Café since Oct' },
      { value: '3', label: 'items to check before sign-off' },
    ],
    table: {
      title: 'Performance by project',
      headers: ['Project', 'People reached', '% of reach target', 'Sessions', 'Attendances', 'Outcomes', '% of outcome target'],
      rows: [
        ['Friendship Club', '118', '107%', '26', '361', '38', '109%'],
        ['Advice Drop-in', '149', '93%', '39', '456', '51', '93%'],
        ['Skills Café', '88', '147%', '24', '269', '29', '121%'],
      ],
      total: ['All projects', '355', '108%', '89', '1,086', '118', '104%'],
      note:
        'People reached counts each person once per quarter, the definition agreed with all three funders. ' +
        'Every figure reconciles to the session registers.',
    },
    charts: [
      {
        kind: 'line',
        title: 'Participants per month, Oct 2025 – Sep 2026',
        alt:
          'Line chart of participants per month from October 2025 to September 2026. ' +
          'All projects rose from 164 to 200. Skills Café rose from 22 to 48.',
        categories: MONTHS,
        categoryHeading: 'Month',
        series: [
          {
            name: 'All projects',
            values: [164, 164, 162, 172, 172, 177, 173, 187, 181, 189, 183, 200],
            tone: 'primary',
            endLabel: ['All projects', '200'],
          },
          {
            name: 'Skills Café',
            values: [22, 24, 20, 28, 32, 35, 33, 39, 40, 43, 51, 48],
            tone: 'secondary',
            endLabel: ['Skills Café', '48'],
          },
        ],
        format: 'int',
        yMin: 0,
        yMax: 230,
        yTicks: [0, 50, 100, 150, 200],
        yLabel: 'Participants',
      },
      {
        kind: 'bar',
        title: 'Cost per outcome achieved, last 12 months',
        alt:
          'Bar chart of cost per outcome achieved over the last 12 months: ' +
          'Skills Café £256, Advice Drop-in £166, Friendship Club £130.',
        categoryHeading: 'Project',
        valueHeading: 'Cost per outcome',
        bars: [
          { label: 'Skills Café', value: 256.25, display: '£256' },
          { label: 'Advice Drop-in', value: 165.96, display: '£166' },
          { label: 'Friendship Club', value: 129.58, display: '£130' },
        ],
        xMin: 0,
        xMax: 320,
        xTicks: [0, 50, 100, 150, 200, 250, 300],
        xLabel: '£ per outcome',
      },
    ],
    checks: {
      title: 'Checks before this pack goes to trustees',
      items: [
        '14 Advice Drop-in attendances in August have no matching participant record — likely a new volunteer using the old sign-in sheet.',
        'Skills Café September outcomes include 4 people also counted by the Friendship Club. Agreed rule: count the outcome once, against the project that delivered it.',
        'Funder B funds the Advice Drop-in and Skills Café and asks for total attendances, not people reached. Its figure is 725 attendances — shown separately so the two numbers are never confused.',
      ],
    },
    insights: {
      title: 'What this tells the trustees',
      items: [
        'Reach is on track overall (108% of target). The August dip at the Advice Drop-in is the summer closure week, not a trend.',
        'Skills Café is the fastest-growing project (+118% since October) but has the highest cost per outcome. Qualification outcomes lag attendance by about a term, so this should fall — worth watching in the next pack.',
        'The Friendship Club delivers outcomes at the lowest cost. That is strong evidence for its renewal application in January.',
      ],
    },
    closing:
      'A Reporting & Insight Build: one checked monthly process that produces this pack, the funder-specific figures and the exception list automatically. ' +
      CLOSING_TAIL,
  },
  {
    slug: 'training-provider',
    pdf: 'training-provider-example.pdf',
    name: 'Training provider monthly check',
    description:
      'Example monthly pre-submission check for an apprenticeship provider, built on made-up data: records to fix before the ILR goes in, funding against expectation, and retention by standard.',
    heading: 'Harbour Skills — Monthly pre-submission check',
    subtitle: 'R02 return, September 2026 · Checked across e-portfolio, MIS and CRM exports before ILR submission',
    tiles: [
      { value: '184', label: 'active apprentices checked' },
      { value: '11', label: 'records to fix before submission' },
      { value: '£4.6k', label: 'gap between expected and actual funding in Sep' },
      { value: '2', label: 'standards below average retention' },
    ],
    table: {
      title: 'Records to fix before submission (6 of 11 shown)',
      headers: ['Learner', "What doesn't match", 'Action', 'Owner'],
      rows: [
        ['L-0147', 'Planned end date differs: e-portfolio 14 Nov 2026, MIS 30 Jan 2027', 'Update MIS or e-portfolio', 'Quality'],
        ['L-0162', 'Break in learning in e-portfolio from 2 Sep, still active in ILR', 'Record break before submission', 'MIS'],
        ['L-0088', 'Off-the-job hours 41% behind planned pace', 'Tutor review with employer', 'Tutor'],
        ['L-0203', 'Withdrawal date recorded in CRM but not in MIS', 'Confirm date and record', 'MIS'],
        ['L-0119', 'Past planned end date by 63 days, no gateway recorded', 'Check gateway readiness', 'Quality'],
        ['L-0175', 'Employer name differs between contract and ILR', 'Correct to contract', 'Admin'],
      ],
      note:
        'Learner references are pseudonymised. The full list goes to the named owner with a due date before the submission deadline.',
    },
    charts: [
      {
        kind: 'line',
        title: 'Funding earned: expected vs actual, Oct 2025 – Sep 2026',
        alt:
          'Line chart of funding earned per month from October 2025 to September 2026. ' +
          'Expected funding rose from £64.0k to £67.8k. Actual funding stayed between £63.2k and £64.9k and ended at £63.2k, ' +
          'so the gap widened steadily from April to £4.6k in September.',
        categories: MONTHS,
        categoryHeading: 'Month',
        series: [
          {
            name: 'Expected',
            values: [64.0, 64.7, 65.0, 64.9, 65.3, 65.6, 66.2, 66.4, 67.0, 66.7, 67.9, 67.8],
            tone: 'muted',
            dashed: true,
            endLabel: ['Expected', '£67.8k'],
          },
          {
            name: 'Actual',
            values: [63.8, 64.3, 64.9, 64.3, 64.8, 64.7, 64.8, 64.3, 64.2, 63.4, 64.0, 63.2],
            tone: 'primary',
            endLabel: ['Actual', '£63.2k'],
          },
        ],
        format: 'gbp-k',
        yMin: 56,
        yMax: 72,
        yTicks: [56, 60, 64, 68, 72],
        yLabel: '£ thousand per month',
      },
      {
        kind: 'bar',
        title: 'Retention by standard, 2025/26',
        alt:
          'Bar chart of in-year retention by standard for 2025/26, against a provider average of 83%: ' +
          'Early Years Educator L3 91%, Team Leader L3 88%, Business Admin L3 86%, Customer Service L2 84%, ' +
          'Adult Care L2 73% and Hospitality L2 68%. Adult Care L2 and Hospitality L2 are below average and highlighted.',
        categoryHeading: 'Standard',
        valueHeading: 'In-year retention',
        bars: [
          { label: 'Early Years Educator L3', value: 91, display: '91%' },
          { label: 'Team Leader L3', value: 88, display: '88%' },
          { label: 'Business Admin L3', value: 86, display: '86%' },
          { label: 'Customer Service L2', value: 84, display: '84%' },
          { label: 'Adult Care L2', value: 73, display: '73%', highlight: true },
          { label: 'Hospitality L2', value: 68, display: '68%', highlight: true },
        ],
        xMin: 50,
        xMax: 100,
        xTicks: [50, 60, 70, 80, 90, 100],
        xLabel: 'In-year retention, % (highlighted = below average)',
        reference: { value: 83.3, label: 'Provider average 83%' },
      },
    ],
    checks: {
      title: "Checks before this month's return",
      items: [
        '7 learners are past their planned end date without a gateway record. They account for most of the funding gap from April onwards.',
        'Adult Care L2 and Hospitality L2 retention has fallen since March. Withdrawals cluster at two employers (E-12 and E-31).',
        'Off-the-job hours are behind planned pace for 19 learners. Three are at risk of breaching the minimum requirement this quarter.',
      ],
    },
    insights: {
      title: 'What this tells the management team',
      items: [
        'Funding is £4.6k a month below expectation and the gap has grown steadily since April. It is driven by learners overrunning planned end dates, not by fewer starts.',
        'Retention problems are concentrated in two standards and two employers, so a targeted employer review will do more than a provider-wide intervention.',
        'Fixing the 11 mismatched records before submission avoids corrections next month and keeps funding reports aligned with delivery.',
      ],
    },
    closing:
      'A Reporting & Insight Build: a monthly check that compares the systems automatically, lists what to fix before submission, and updates the funding and retention view. ' +
      CLOSING_TAIL,
  },
  {
    slug: 'alternative-provision',
    pdf: 'ap-example.pdf',
    name: 'Alternative provision commissioner summary',
    description:
      'Example half-termly commissioner summary for an alternative provision provider, built on made-up data: attendance, sessions delivered against commissioned and invoiced, and placements flagged for review.',
    heading: 'Coastline Learning — Half-termly commissioner summary',
    subtitle: 'Autumn half-term 1, 1 September – 16 October 2026 · Built from session registers and invoices',
    tiles: [
      { value: '26', label: 'active placements' },
      { value: '79%', label: 'attendance this half-term' },
      { value: '4', label: 'placements flagged for review' },
      { value: '2', label: 'registers missing' },
    ],
    table: {
      title: 'Summary by commissioner',
      headers: [
        'Commissioner',
        'Placements',
        'Sessions commissioned',
        'Sessions delivered',
        'Attendance',
        'Sessions invoiced',
        'Invoiced vs delivered',
      ],
      rows: [
        ['Westbrook Academy', '9', '315', '291', '81%', '291', '0'],
        ['Hillside School', '6', '210', '188', '76%', '196', '+8'],
        ['Local Authority (inclusion team)', '11', '462', '437', '79%', '437', '0'],
      ],
      total: ['All commissioners', '26', '987', '916', '79%', '924', '+8'],
      note:
        'Each commissioner receives their own page from the same checked data, ready for the half-termly placement review.',
    },
    charts: [
      {
        kind: 'line',
        title: 'Weekly attendance, all placements, autumn half-term 1',
        alt:
          'Line chart of weekly attendance across all placements in autumn half-term 1. ' +
          'Attendance fell from 83% in the week of 31 August to 75% in the week of 12 October, ' +
          'below the 80% review threshold from the week of 21 September.',
        categories: ['31 Aug', '7 Sep', '14 Sep', '21 Sep', '28 Sep', '5 Oct', '12 Oct'],
        categoryHeading: 'Week commencing',
        series: [
          {
            name: 'Attendance',
            values: [83, 81, 82, 79, 77, 77, 75],
            tone: 'primary',
            endLabel: ['75%'],
          },
        ],
        format: 'pct',
        yMin: 60,
        yMax: 95,
        yTicks: [60, 65, 70, 75, 80, 85, 90, 95],
        yLabel: 'Attendance, %',
        xLabel: 'Week commencing',
        threshold: { value: 80, label: 'Review threshold 80%' },
      },
      {
        kind: 'bar',
        title: 'Sustained attendance by referral route, last 3 terms',
        alt:
          'Bar chart of the share of placements with attendance above 80% for a full term, by referral route, over the last three terms: ' +
          'school referral with transition plan 78%, school referral with no plan 52%, ' +
          'local authority (EHCP) 66%, local authority (medical) 49%.',
        categoryHeading: 'Referral route',
        valueHeading: 'Placements with attendance above 80% for a full term',
        bars: [
          { label: 'School referral with\ntransition plan', value: 78, display: '78%' },
          { label: 'School referral,\nno plan', value: 52, display: '52%' },
          { label: 'Local authority\n(EHCP)', value: 66, display: '66%' },
          { label: 'Local authority\n(medical)', value: 49, display: '49%' },
        ],
        xMin: 0,
        xMax: 100,
        xTicks: [0, 20, 40, 60, 80, 100],
        xLabel: '% of placements above 80% attendance for a full term',
      },
    ],
    checks: {
      title: 'Checks before the placement reviews',
      items: [
        'Placements P-07, P-12 and P-19: attendance below 70% for three consecutive weeks. For discussion at review — no automatic action taken.',
        'Placement P-23: attendance fell from 92% to 61% in the last two weeks. Earlier than the three-week rule, flagged for a conversation.',
        'Registers missing for 2 group sessions at Hillside School (9 and 16 Oct), covering 8 placement sessions. Hillside has 8 more sessions invoiced than delivered — resolve before the invoice goes out.',
      ],
    },
    insights: {
      title: 'What this tells the leadership team',
      items: [
        'Attendance has drifted below the 80% threshold since late September. The fall is concentrated in four placements, not spread across the provision.',
        'School referrals that arrive with a transition plan sustain attendance far more often (78%) than those without (52%). That is a concrete ask to put to referring schools.',
        'Invoices match delivery for two of three commissioners. The Hillside variance is the 8 placement sessions on the two missing registers — fixing them keeps the invoice defensible.',
      ],
    },
    closing:
      'A Reporting & Insight Build: registers and invoices checked against each other every week, with commissioner summaries and review flags produced automatically. ' +
      CLOSING_TAIL,
  },
];

export function formatValue(value: number, format: ValueFormat): string {
  if (format === 'gbp-k') return `£${value.toFixed(1)}k`;
  if (format === 'pct') return `${value}%`;
  return value.toLocaleString('en-GB');
}
