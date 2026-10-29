/**
 * services-guides.ts
 * Worked-example data for the guides under /services/guides/.
 * Every organisation and figure here is made up.
 */
import type { BarChartSpec } from './services-examples';

/** "Families supported" counted four ways, from one made-up year of records. */
export const familiesCountedFourWays: BarChartSpec = {
  kind: 'bar',
  title: 'One year, four answers to "how many families did we support?" (made-up data)',
  alt: 'Bar chart of made-up data. The same year of records gives four different counts of families supported: 312 referred, 241 attended at least once, 158 attended four or more sessions, and 96 with a recorded outcome.',
  categoryHeading: 'How "supported" is defined',
  valueHeading: 'Families',
  bars: [
    { label: 'Referred', value: 312, display: '312' },
    { label: 'Attended at\nleast once', value: 241, display: '241' },
    { label: 'Attended four\nor more sessions', value: 158, display: '158', highlight: true },
    { label: 'Recorded\noutcome', value: 96, display: '96' },
  ],
  xMin: 0,
  xMax: 350,
  xTicks: [0, 100, 200, 300],
  xLabel: 'Families (made-up data)',
};

/** Volunteer roles, people and hours for the same made-up year. */
export const volunteerRoles = {
  headers: ['Role', 'Volunteers', 'Hours in the year'],
  rows: [
    ['Befrienders', '14', '1,120'],
    ['Session helpers', '11', '640'],
    ['Drivers', '6', '410'],
    ['Trustees', '8', '190'],
  ],
  total: ['Total', '39', '2,360'],
};
