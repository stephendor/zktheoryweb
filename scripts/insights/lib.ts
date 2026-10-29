/**
 * lib.ts: shared helpers for the public-data insight pipelines under
 * scripts/insights/. Streaming readers for large delimited files, download
 * and unzip with no npm dependencies, and the aggregate/suppression rules
 * every insight page follows.
 *
 * Disclosure rules (all insight pages):
 *  - aggregates only; no organisation is named or identifiable;
 *  - any count below SUPPRESS_BELOW is withheld (null), and so is any
 *    statistic computed from fewer than SUPPRESS_BELOW organisations.
 */
import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createInterface } from 'node:readline';

export const SUPPRESS_BELOW = 5;

export type Row = Record<string, string>;

/** Split one CSV line, honouring double quotes ("" is an escaped quote). */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      out.push(field);
      field = '';
    } else field += c;
  }
  out.push(field);
  return out;
}

/**
 * Stream a delimited text file as header-keyed rows. Tab-delimited files
 * (the Charity Commission extract) are split on tabs; a record whose field
 * count falls short is joined with the following line(s), since free-text
 * fields can contain line breaks.
 */
export async function* readDelimited(path: string, delimiter: '\t' | ','): AsyncGenerator<Row> {
  const rl = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  const split = delimiter === ',' ? splitCsvLine : (l: string) => l.split('\t');
  let header: string[] | null = null;
  let pending = '';
  for await (const raw of rl) {
    const line = header ? raw : raw.replace(/^﻿/, '');
    if (!header) {
      header = split(line).map((h) => h.trim());
      continue;
    }
    pending = pending ? `${pending}\n${line}` : line;
    const fields = split(pending);
    if (fields.length < header.length) continue;
    pending = '';
    const row: Row = {};
    header.forEach((h, i) => (row[h] = (fields[i] ?? '').trim()));
    yield row;
  }
}

/** Read just the header of a delimited file. */
export async function readHeader(path: string, delimiter: '\t' | ','): Promise<string[]> {
  const rl = createInterface({ input: createReadStream(path, 'utf8'), crlfDelay: Infinity });
  for await (const line of rl) {
    rl.close();
    const clean = line.replace(/^﻿/, '');
    return (delimiter === ',' ? splitCsvLine(clean) : clean.split('\t')).map((h) => h.trim());
  }
  return [];
}

/** Fail loudly, listing the real header, when an expected column is missing. */
export function requireColumns(file: string, header: string[], needed: string[]): void {
  const missing = needed.filter((c) => !header.includes(c));
  if (missing.length) {
    throw new Error(
      `${file}: missing column(s) ${missing.join(', ')}.\nHeader found: ${header.join(', ')}\n` +
        "Update the column names in this pipeline's config.ts to match the published file."
    );
  }
}

export function num(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null;
  const n = Number(value.replace(/[£,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Linear-interpolated quantile (type 7, as in R and NumPy) of a sorted array. */
export function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(values: number[]): number {
  return quantileSorted(
    [...values].sort((a, b) => a - b),
    0.5
  );
}

/** A count, withheld when below the threshold (zero is shown as zero). */
export function suppressCount(n: number): number | null {
  return n > 0 && n < SUPPRESS_BELOW ? null : n;
}

/**
 * Suppress a set of counts that add up to a published total. Small counts
 * are withheld first; if that leaves exactly one non-zero cell withheld, it
 * could be worked out from the total, so the next smallest non-zero count
 * is withheld too.
 */
export function suppressPartition(raw: number[]): (number | null)[] {
  const out: (number | null)[] = raw.map(suppressCount);
  const hidden = raw.filter((n, i) => n > 0 && out[i] === null).length;
  if (hidden === 1) {
    const shown = raw.map((n, i) => ({ n, i })).filter(({ n, i }) => n > 0 && out[i] !== null);
    shown.sort((a, b) => a.n - b.n);
    if (shown[0]) out[shown[0].i] = null;
  }
  return out;
}

/** A statistic over `n` organisations, withheld when n is below the threshold. */
export function suppressStat(n: number, value: number): number | null {
  return n < SUPPRESS_BELOW ? null : value;
}

export function roundTo(value: number | null, step: number): number | null {
  return value === null ? null : Math.round(value / step) * step;
}

export function pct(part: number, whole: number): number | null {
  return whole === 0 ? null : Math.round((1000 * part) / whole) / 10;
}

/** Download a URL to a file (Node's fetch honours HTTPS_PROXY only via the environment's own setup). */
export async function download(url: string, to: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, Buffer.from(await res.arrayBuffer()));
}

/**
 * Unzip with the system tool: bsdtar (`tar -xf`, built into Windows 10+ and
 * macOS) or `unzip` (Linux). No npm dependency.
 */
export function unzip(zip: string, into: string): void {
  mkdirSync(into, { recursive: true });
  for (const [cmd, args] of [
    ['tar', ['-xf', zip, '-C', into]],
    ['unzip', ['-o', '-q', zip, '-d', into]],
  ] as const) {
    const r = spawnSync(cmd, args, { stdio: 'pipe' });
    if (r.status === 0) return;
  }
  throw new Error(
    `Could not unzip ${zip}: neither "tar -xf" nor "unzip" worked. Unzip it by hand into ${into}.`
  );
}

export function assertExists(path: string, hint: string): void {
  if (!existsSync(path)) throw new Error(`${path} not found. ${hint}`);
}
