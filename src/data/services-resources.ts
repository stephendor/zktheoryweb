/**
 * services-resources.ts
 * Content for the free checklists (/services/resources/<slug>/) and the
 * focused-analysis service sheets (/services/sheets/<slug>/).
 * Moved from Business Planning/Website/services-resources-content.json
 * (2026-10-01); this file is now the source. Field names follow that JSON.
 * Site-only fields: slug, linkLabel and summary (used on /services).
 *
 * After editing, run `npm run build:example-pdfs` and commit the PDFs.
 */

export interface Checklist {
  slug: string;
  /** File name in public/services/resources/. */
  pdf: string;
  kicker: string;
  linkLabel: string;
  summary: string;
  title: string;
  lead: string;
  sections: { heading: string; items: { label: string; detail: string }[] }[];
  scoring: { band: string; meaning: string }[];
  questions: string[];
  note: string;
}

export interface ServiceSheet {
  slug: string;
  /** File name in public/services/sheets/. */
  pdf: string;
  kicker: string;
  summary: string;
  title: string;
  lead: string;
  for_whom: string[];
  question: string;
  what_you_get: string[];
  what_i_need: string[];
  how_it_works: string[];
  price: string;
  price_note: string;
  example_finding: string;
  example_note: string;
  best_time: string;
  data_statement: string;
}

export const checklists: Checklist[] = [
  {
    slug: 'funder-trustee-reporting-checklist',
    pdf: 'funder-trustee-reporting-checklist.pdf',
    kicker: 'Free checklist for charities and community groups',
    linkLabel: 'Funder and trustee reporting checklist',
    summary: 'twelve checks before your figures go to funders or trustees.',
    title: 'Funder and trustee reporting checklist',
    lead: 'Twelve checks before your figures leave the building. Tick the ones that are true for your next report.',
    sections: [
      {
        heading: 'Before you start',
        items: [
          {
            label: 'One purpose, one deadline.',
            detail:
              "You know which report this is, who reads it, what decision it supports, the period it covers and when it's due.",
          },
          {
            label: 'One owner.',
            detail:
              "A named person assembles it, and you know who supplies each part, who checks it, who signs it off, and who covers if they're away.",
          },
          {
            label: 'A list of sources.',
            detail:
              'Each spreadsheet or system the figures come from is written down, with who keeps it and the cut-off date.',
          },
        ],
      },
      {
        heading: 'Counting the same way every time',
        items: [
          {
            label: 'Definitions written down.',
            detail:
              'What counts as a participant, a session, an attendance and an outcome is written in one place.',
          },
          {
            label: 'People and attendances kept apart.',
            detail:
              'You report unique people separately from total attendances, and say which one each funder asked for.',
          },
          {
            label: 'The same definitions for every funder.',
            detail:
              'Where a funder needs something different, you work it out from the same records and note the difference.',
          },
        ],
      },
      {
        heading: 'Checking before sign-off',
        items: [
          {
            label: 'Totals add back.',
            detail:
              'Every headline figure can be traced back to the activity records it came from.',
          },
          {
            label: 'Compared with last time.',
            detail: 'Big changes since the last report are explained, not quietly adjusted.',
          },
          {
            label: 'Duplicates and gaps checked.',
            detail:
              "You've looked for people counted twice, missing months or sites, and late returns.",
          },
          {
            label: 'Problems listed, not hidden.',
            detail:
              'Anything missing, doubtful or estimated is on a short list that the person signing off can see.',
          },
        ],
      },
      {
        heading: 'Making next time easier',
        items: [
          {
            label: 'A short how-to.',
            detail:
              'The steps, file locations and deadlines are written down so someone else could produce the report.',
          },
          {
            label: 'Evidence kept for bids.',
            detail:
              'Volunteer hours, feedback and outcomes are recorded in a way you could use in your next application.',
          },
        ],
      },
    ],
    scoring: [
      {
        band: '10–12:',
        meaning: 'a solid process. Your figures will stand up to questions.',
      },
      {
        band: '6–9:',
        meaning:
          'workable, but it relies on people remembering things. Start with the gaps in the first two sections.',
      },
      {
        band: '0–5:',
        meaning:
          'fragile. One absence or a new funder could cause real problems. Fix definitions and ownership first.',
      },
    ],
    questions: [
      'Which step causes the most last-minute chasing or copying?',
      'Which figure would be hardest for someone else to reproduce next month?',
      'What should trustees see as a known issue rather than discover as a surprise?',
    ],
    note: "This checklist is a practical guide, not accounting, audit or legal advice. You don't need to share any personal data to use it. If you'd like help, the £295 Reporting & Insight Review looks at one of your reports in detail: zktheory.org/services.",
  },
  {
    slug: 'apprenticeship-pre-submission-checklist',
    pdf: 'apprenticeship-pre-submission-checklist.pdf',
    kicker: 'Free checklist for apprenticeship and training providers',
    linkLabel: 'Monthly pre-submission checklist for apprenticeship providers',
    summary: 'twelve checks before each ILR return.',
    title: 'Monthly pre-submission checklist',
    lead: 'Twelve checks to run before each ILR return. Most take minutes with exports from your e-portfolio and MIS.',
    sections: [
      {
        heading: 'Do your systems agree?',
        items: [
          {
            label: 'Learner numbers match.',
            detail:
              "The count of active learners is the same in your e-portfolio, MIS and the ILR you're about to submit, or you know exactly why not.",
          },
          {
            label: 'Planned end dates match.',
            detail: "Each learner's planned end date is the same in every system.",
          },
          {
            label: 'Breaks in learning recorded everywhere.',
            detail:
              'Any learner on a break is shown as on a break in every system, from the same date.',
          },
          {
            label: 'Withdrawals dated and recorded.',
            detail:
              'Every learner who has left has a confirmed last day of learning, recorded consistently.',
          },
          {
            label: 'Employer details match the contract.',
            detail: 'Employer name and agreement details agree with the signed paperwork.',
          },
        ],
      },
      {
        heading: 'Are learners on track?',
        items: [
          {
            label: 'Past planned end date.',
            detail:
              'You have a list of learners past their planned end date, and each has a recorded reason and next step (such as gateway readiness).',
          },
          {
            label: 'Off-the-job hours on pace.',
            detail:
              'Recorded off-the-job hours are compared with planned pace, and learners falling behind are flagged to their tutor.',
          },
          {
            label: 'Progress reviews up to date.',
            detail: 'Every learner has had a progress review within your expected interval.',
          },
          {
            label: 'New starts complete.',
            detail:
              "New starters have a complete training plan, initial assessment and signed agreements before they're counted.",
          },
        ],
      },
      {
        heading: 'Does the money add up?',
        items: [
          {
            label: 'Funding expected against actual.',
            detail:
              "Last month's funding report is compared with what you expected, and the difference is explained.",
          },
          {
            label: 'Prices agree.',
            detail:
              'The agreed price for each learner matches across the contract, your MIS and the ILR.',
          },
          {
            label: 'Fixes logged.',
            detail:
              'Corrections made before submission are listed with who made them, so the same errors can be fixed at source.',
          },
        ],
      },
    ],
    scoring: [
      {
        band: '10–12:',
        meaning: 'strong control. Your returns and funding should hold few surprises.',
      },
      {
        band: '6–9:',
        meaning:
          'the basics are there, but mismatches are being found late. Automate the comparisons in the first section.',
      },
      {
        band: '0–5:',
        meaning:
          'high risk of corrections, funding surprises and inspection questions. Start with learner numbers and end dates.',
      },
    ],
    questions: [
      'Which mismatch do we find most often, and in which system does it start?',
      'How many learners are past planned end date today, and is that number rising?',
      'Could someone other than our MIS lead run these checks next month?',
    ],
    note: 'This checklist is a practical guide, not funding-rules or compliance advice. Always check against the current DfE funding rules and ILR specification. No learner data needs to be shared to use it. For a free one-page summary of your published achievement figures, email stephen@zktheory.org.',
  },
];

export const serviceSheets: ServiceSheet[] = [
  {
    slug: 'impact-evidence-pack',
    pdf: 'impact-evidence-pack.pdf',
    kicker: 'For charities and community groups',
    summary: 'The figures your next bid or renewal needs.',
    title: 'Impact evidence pack',
    lead: 'The figures your next bid or renewal needs, drawn from the records you already keep.',
    for_whom: [
      'Small charities and community groups with a funding application or renewal coming up',
      'Trustees preparing the annual report',
      'Organisations whose impact figures are scattered across several spreadsheets',
    ],
    question:
      'What difference has our work made, who has it reached, and what does it cost to achieve an outcome? Answered with figures a funder can check.',
    what_you_get: [
      'Reach and trends: people, sessions and activity by project, site and month, against your targets',
      'Outcomes: what changed for the people you work with, using the measures you already record',
      'Cost per participant and per outcome by project, from your own finance figures',
      'Volunteer contribution: hours given and their equivalent value',
      'A 3–4 page evidence pack with charts and plain-English commentary, plus the figures in a spreadsheet you can reuse',
      'A short paragraph for each key figure you can paste straight into an application',
    ],
    what_i_need: [
      'Your activity or attendance records (spreadsheet exports are fine)',
      'Any outcome or feedback records',
      'Project costs from your accounts',
      'Which funder or report this is for, and the deadline',
    ],
    how_it_works: [
      '20-minute call to agree the scope and deadline',
      'You share summary records',
      'Pack delivered within 10 working days',
      'One round of changes included',
    ],
    price: '£600–£950 fixed price',
    price_note:
      'Price depends on the number of projects and data sources, and is confirmed before any work starts. Invoiced on booking, payable on delivery.',
    example_finding:
      'Across three projects, the lunch club reached the most people but the advice service produced outcomes at less than half the cost per outcome — a much stronger case for the renewal than headcount alone.',
    example_note: 'Illustrative example only, not a client result.',
    best_time: '6–8 weeks before a funding deadline or the annual report.',
    data_statement:
      "Your data. I work from summary figures and anonymised records. I don't need names or personal details; if a piece of work ever needs record-level data, we agree exactly what, how it's handled and when it's deleted, in writing, before anything is shared.",
  },
  {
    slug: 'survey-analysis',
    pdf: 'survey-analysis.pdf',
    kicker: 'For any small organisation',
    summary: 'What your survey responses actually say.',
    title: 'Survey analysis',
    lead: "You've collected the responses. I'll tell you what they actually say.",
    for_whom: [
      'Charities with beneficiary, member or volunteer surveys',
      'Training providers with learner or employer feedback',
      "Any organisation with a staff survey it hasn't had time to analyse",
    ],
    question:
      'What are people telling us, how strongly, does it differ between groups, and what has changed since last time?',
    what_you_get: [
      'Clear headline results for every question, with charts',
      "Comparisons that matter: by service, site, age group or length of involvement, with differences tested so you don't over-read small samples",
      'Themes from written comments, coded and counted, with representative quotes',
      'Change over time where you have earlier surveys',
      'A 4–6 page report with a one-page summary for trustees or managers, and the cleaned data back to you',
    ],
    what_i_need: [
      'The survey export (Google Forms, Microsoft Forms, SurveyMonkey or a spreadsheet)',
      'The questions as asked',
      'Any earlier results you want to compare with',
      'Who the report is for',
    ],
    how_it_works: [
      '15-minute call',
      'You send the anonymised export',
      'Report within 7 working days',
      'One round of changes and a 30-minute walk-through included',
    ],
    price: '£350–£750 fixed price',
    price_note:
      'Depends on the number of responses and the amount of written comment. Confirmed before work starts. Invoiced on booking, payable on delivery.',
    example_finding:
      'Overall satisfaction was 86%, but among people who had used the service for less than three months it was 61%. The early weeks were where people were being lost — something the headline figure hid completely.',
    example_note: 'Illustrative example only, not a client result.',
    best_time:
      'Any time; ideally within a month of the survey closing, while the results can still shape decisions.',
    data_statement:
      "Your data. I work from summary figures and anonymised records. I don't need names or personal details; if a piece of work ever needs record-level data, we agree exactly what, how it's handled and when it's deleted, in writing, before anything is shared.",
  },
  {
    slug: 'sar-data-pack',
    pdf: 'sar-data-pack.pdf',
    kicker: 'For apprenticeship and training providers',
    summary: 'Achievement, retention and progress evidence for training providers.',
    title: 'Self-assessment data pack',
    lead: 'The achievement, retention and progress evidence your self-assessment needs, in one checked pack.',
    for_whom: [
      'Independent training providers writing their annual self-assessment report and improvement plan',
      'Quality leads preparing for inspection',
      'Directors who want to see where results differ before they are published',
    ],
    question:
      'Where are our results strong or weak — by standard, age, employer, tutor caseload and cohort — and how do we compare nationally?',
    what_you_get: [
      "Achievement and retention by standard, level, age and cohort, against national rates from DfE's published data",
      'Where learners leave: withdrawals and breaks in learning by point in the programme, employer and caseload',
      'Learners past planned end date and the effect on achievement and funding',
      'Off-the-job hours and progress against planned pace',
      'A self-assessment-ready pack: charts, tables and short commentary you can lift into your report, plus the workbook behind it',
    ],
    what_i_need: [
      'Learner-level exports from your MIS or e-portfolio, pseudonymised (learner IDs, not names)',
      'Your most recent ILR-derived reports',
      "Last year's self-assessment report, if you have one",
    ],
    how_it_works: [
      '30-minute call to agree measures and format',
      'Secure transfer of pseudonymised exports under a written data agreement',
      'Pack delivered within 10 working days',
      'One round of changes included',
    ],
    price: '£750–£1,200 fixed price',
    price_note:
      'Depends on learner numbers and the number of systems. Confirmed before work starts. Invoiced on booking, payable on delivery.',
    example_finding:
      "The provider's overall achievement rate was close to national, but 16–18 learners on one standard were 14 points below. Most of the gap came from withdrawals in the first 12 weeks at two employers.",
    example_note: 'Illustrative example only, not a client result.',
    best_time:
      'Autumn term, before the self-assessment report is written — or any time ahead of inspection.',
    data_statement:
      'Your data. This work uses pseudonymised records (codes, not names). That is still personal data, so it runs only under a written data processing agreement: you stay in control, data is held in an agreed secure location, used only for this work, and deleted at the end. No health, safeguarding or other special-category fields are needed.',
  },
  {
    slug: 'commissioner-outcome-report',
    pdf: 'commissioner-outcome-report.pdf',
    kicker: 'For alternative provision and tuition providers',
    summary: "What each school and local authority's placements achieved.",
    title: 'Commissioner outcome report',
    lead: 'Show each school and local authority what their placements achieved — with figures that stand up at review.',
    for_whom: [
      'Alternative provision and tuition providers working with several schools or local authorities',
      'Providers preparing for recommissioning or a framework renewal',
      'Directors who want evidence of what works, not just activity',
    ],
    question:
      "What did each commissioner's placements achieve, which kinds of placement work best, and is what we invoiced matched by what we delivered?",
    what_you_get: [
      'A summary for each commissioner: placements, sessions commissioned and delivered, attendance and progress',
      'Outcomes by placement type and referral route: sustained attendance, reintegration, moves on to education, training or work',
      'Delivery against invoicing for each commissioner, with any differences explained',
      'Early-warning patterns: where and when attendance tends to fall',
      'A short report per commissioner plus an overall summary for your leadership team',
    ],
    what_i_need: [
      'Session registers and placement records, pseudonymised (placement codes, not names)',
      'Invoices or a delivery log',
      'Your outcome records (destinations, progress measures)',
      'A list of commissioners and what each one asks for',
    ],
    how_it_works: [
      '30-minute call',
      'Secure transfer of pseudonymised records under a written data agreement',
      'Reports delivered within 10 working days',
      'One round of changes included',
    ],
    price: '£600–£950 fixed price',
    price_note:
      'Depends on the number of commissioners and placements. Confirmed before work starts. Invoiced on booking, payable on delivery.',
    example_finding:
      'Placements that arrived with a transition plan from the referring school sustained attendance far more often than those without — a concrete, evidence-based request to put to every referring school.',
    example_note: 'Illustrative example only, not a client result.',
    best_time: 'Before the end of term, or 2–3 months ahead of a recommissioning decision.',
    data_statement:
      'Your data. This work uses pseudonymised records (codes, not names). That is still personal data, so it runs only under a written data processing agreement: you stay in control, data is held in an agreed secure location, used only for this work, and deleted at the end. No health, safeguarding or other special-category fields are needed.',
  },
];
