import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertNotPromotedOutputPath,
  optionFromArgsOrEnv,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-cli-'));
}

describe('parsePhase3Args', () => {
  it('parses --flag value pairs', () => {
    expect(parsePhase3Args(['--report', 'report.json', '--out', 'out.json'])).toEqual({
      report: 'report.json',
      out: 'out.json',
    });
  });

  it('parses --flag=value pairs', () => {
    expect(parsePhase3Args(['--report=report.json', '--out=out.json'])).toEqual({
      report: 'report.json',
      out: 'out.json',
    });
  });

  it('parses boolean flags', () => {
    expect(parsePhase3Args(['--dry-run', '--report', 'report.json'])).toEqual({
      'dry-run': true,
      report: 'report.json',
    });
  });
});

describe('optionFromArgsOrEnv', () => {
  it('lets string args override env values', () => {
    const args = parsePhase3Args(['--tda-vault', 'from-args']);

    expect(
      optionFromArgsOrEnv(args, 'tda-vault', 'PHASE3_TDA_VAULT', {
        PHASE3_TDA_VAULT: 'from-env',
      })
    ).toBe('from-args');
  });
});

describe('requiredOption', () => {
  it('throws an actionable message when the option is missing', () => {
    expect(() => requiredOption({}, 'tda-vault', 'PHASE3_TDA_VAULT', {})).toThrow(
      'Missing required option --tda-vault or environment variable PHASE3_TDA_VAULT.'
    );
  });

  it('throws an actionable message when a required option has no value', () => {
    expect(() =>
      requiredOption({ 'tda-vault': true }, 'tda-vault', 'PHASE3_TDA_VAULT', {
        PHASE3_TDA_VAULT: 'from-env',
      })
    ).toThrow('Option --tda-vault requires a value.');
  });
});

describe('stringOption', () => {
  it('throws an actionable message when an optional string flag has no value', () => {
    expect(() => stringOption({ out: true }, 'out', 'fallback.json')).toThrow(
      'Option --out requires a value.'
    );
  });
});

describe('assertNotPromotedOutputPath', () => {
  it('rejects the promoted public JSON path', () => {
    const promotedPath = resolve('src/data/generated/phase3/site-connections.json');

    expect(() => assertNotPromotedOutputPath(promotedPath, promotedPath)).toThrow(
      'Refusing to write a Phase 3 candidate to the promoted public JSON path'
    );
  });
});

describe('writeJson', () => {
  it('creates parent directories and writes formatted JSON with a trailing newline', () => {
    const root = tempRoot();
    const path = join(root, 'nested', 'report.json');

    writeJson(path, { ok: true, items: ['a'] });

    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf-8')).toBe('{\n  "ok": true,\n  "items": [\n    "a"\n  ]\n}\n');
  });
});
