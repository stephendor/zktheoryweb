/**
 * insight-format.ts: number formatting and chart axes for the insight pages.
 */

/** £1,065,700,000 -> "£1.1bn"; £1,234,567 -> "£1.2m"; £45,000 -> "£45,000". */
export function gbp(value: number): string {
  if (Math.abs(value) >= 1_000_000_000)
    return `£${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}bn`;
  if (Math.abs(value) >= 1_000_000)
    return `£${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`;
  return `£${Math.round(value).toLocaleString('en-GB')}`;
}

export function count(value: number): string {
  return value.toLocaleString('en-GB');
}

/** Rounded-up axis maximum and evenly spaced ticks from 0. */
export function niceAxis(max: number, ticks = 4): { max: number; ticks: number[] } {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const top = Math.ceil(max / step) * step;
  return {
    max: top,
    ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(6)),
  };
}
