import { existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertOutsideSourceRoots,
  assertNotPromotedOutputPath,
  boundedNumberOption,
  defaultLinkerMetadataCandidatesPath,
  defaultLinkerReportPath,
  numberOption,
  optionFromArgsOrEnv,
  parsePhase3Args,
  requiredOption,
  stringOption,
  writeJson,
} from './cli';

function tempRoot(): string {
  return mkdtempSync(join(tmpdir(), 'phase3-cli-'));
}

function mkdir(path: string): string {
  mkdirSync(path, { recursive: true });
  return path;
}

function createDirectoryLink(target: string, linkPath: string): boolean {
  try {
    symlinkSync(target, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
    return true;
  } catch {
    return false;
  }
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

describe('numberOption', () => {
  it('parses finite numeric options', () => {
    expect(numberOption({ 'min-score': '0.75' }, 'min-score', 0.5)).toBe(0.75);
  });

  it('rejects non-finite numeric options', () => {
    expect(() => numberOption({ 'min-score': 'Infinity' }, 'min-score', 0.5)).toThrow(
      'Option --min-score must be a finite number.'
    );
  });
});

describe('boundedNumberOption', () => {
  it('accepts values within the supplied range', () => {
    expect(
      boundedNumberOption({ 'min-score': '1' }, 'min-score', 0.5, { min: 0, max: 1 })
    ).toBe(1);
  });

  it('rejects values below the supplied range', () => {
    expect(() =>
      boundedNumberOption({ 'min-score': '-0.01' }, 'min-score', 0.5, {
        min: 0,
        max: 1,
      })
    ).toThrow('Option --min-score must be greater than or equal to 0.');
  });

  it('rejects values above the supplied range', () => {
    expect(() =>
      boundedNumberOption({ 'min-score': '1.01' }, 'min-score', 0.5, {
        min: 0,
        max: 1,
      })
    ).toThrow('Option --min-score must be less than or equal to 1.');
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

  it('rejects linker output equal to a source root', () => {
    const root = resolve('vaults/tda');

    expect(() => assertOutsideSourceRoots(root, [root])).toThrow(
      'Refusing to write Phase 3 linker output inside a source root'
    );
  });

  it('allows linker output beside a source root', () => {
    const parent = tempRoot();
    const root = join(parent, 'vault');
    const outputPath = join(parent, 'reports', 'cross-vault-linker.report.json');

    expect(() => assertOutsideSourceRoots(outputPath, [root])).not.toThrow();
  });

  it('rejects output inside the real path of a linked source root when links are available', () => {
    const parent = tempRoot();
    const realRoot = mkdir(join(parent, 'real-vault'));
    const linkedRoot = join(parent, 'linked-vault');

    if (!createDirectoryLink(realRoot, linkedRoot)) {
      expect(existsSync(linkedRoot)).toBe(false);
      return;
    }

    expect(() =>
      assertOutsideSourceRoots(join(realRoot, 'reports', 'linker.json'), [linkedRoot])
    ).toThrow('Refusing to write Phase 3 linker output inside a source root');
  });

  it('rejects output whose existing linked ancestor resolves inside a source root', () => {
    const parent = tempRoot();
    const realRoot = mkdir(join(parent, 'real-vault'));
    const linkedRoot = join(parent, 'linked-vault');

    if (!createDirectoryLink(realRoot, linkedRoot)) {
      expect(existsSync(linkedRoot)).toBe(false);
      return;
    }

    expect(() =>
      assertOutsideSourceRoots(join(linkedRoot, 'new-reports', 'linker.json'), [realRoot])
    ).toThrow('Refusing to write Phase 3 linker output inside a source root');
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
