import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertOutsideSourceRoots,
  assertNotPromotedOutputPath,
  defaultLinkerMetadataCandidatesPath,
  defaultLinkerReportPath,
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

  it('preserves explicit empty --flag= values for validation', () => {
    expect(parsePhase3Args(['--out='])).toEqual({ out: '' });
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

  it('throws an actionable message when a required option is explicitly empty', () => {
    expect(() =>
      requiredOption({ 'tda-vault': '' }, 'tda-vault', 'PHASE3_TDA_VAULT', {
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

  it('throws an actionable message when an optional string option is explicitly empty', () => {
    expect(() => stringOption({ out: '' }, 'out', 'fallback.json')).toThrow(
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

describe('linker defaults and output guards', () => {
  it('keeps linker report outputs under reports/phase3', () => {
    expect(defaultLinkerReportPath.replaceAll('\\', '/')).toContain(
      'reports/phase3/cross-vault-linker.report.json'
    );
    expect(defaultLinkerMetadataCandidatesPath.replaceAll('\\', '/')).toContain(
      'reports/phase3/cross-vault-linker.metadata-candidates.md'
    );
  });

  it('rejects linker output inside a source root', () => {
    const root = resolve('vaults/tda');
    const outputPath = join(root, 'reports', 'cross-vault-linker.report.json');

    expect(() => assertOutsideSourceRoots(outputPath, [root])).toThrow(
      'Refusing to write Phase 3 linker output inside a source root'
    );
  });

  it('allows linker output beside a source root', () => {
    const parent = tempRoot();
    const root = join(parent, 'vault');
    const outputPath = join(parent, 'reports', 'cross-vault-linker.report.json');

    expect(() => assertOutsideSourceRoots(outputPath, [root])).not.toThrow();
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
