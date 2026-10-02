/**
 * check-overrides.mjs: fail when an npm `overrides` entry resolves, in the
 * installed tree, outside the range that the owning package declares.
 *
 * Why: an open-ended override such as `"vite": ">=7.3.3"` satisfies a security
 * advisory today and silently crosses a major tomorrow, past what the host
 * framework supports. `npm install` accepts that; only this check notices.
 *
 * For each overridden package name, every installed package (and the root
 * package.json) that declares a dependency on it is an "owner". The version an
 * owner would actually resolve (node resolution from the owner's directory) must
 * satisfy the range the owner declared.
 *
 * Reviewed exceptions: package.json may carry `overrideRangeExceptions`, an array of
 * { override, owner, installed, reason }. An exception waives exactly one
 * (override, owner) pair at exactly one installed version, so a later bump
 * re-triggers the check. An exception that no longer matches a violation is
 * itself reported (kind "stale-exception"), so exceptions cannot rot.
 *
 * Usage: node scripts/check-overrides.mjs [projectRoot]
 * Exit code 1 on any violation.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const DEP_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/** Override keys may be "name" or "name@range"; return the bare package name. */
function overrideName(key) {
  const at = key.lastIndexOf('@');
  return at > 0 ? key.slice(0, at) : key;
}

/** Every package directory under a node_modules tree, nested installs included. */
function collectInstalled(nodeModulesDir, out = []) {
  if (!fs.existsSync(nodeModulesDir)) return out;
  for (const entry of fs.readdirSync(nodeModulesDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || !(entry.isDirectory() || entry.isSymbolicLink())) continue;
    const dirs = entry.name.startsWith('@')
      ? fs
          .readdirSync(path.join(nodeModulesDir, entry.name), { withFileTypes: true })
          .filter((e) => e.isDirectory() || e.isSymbolicLink())
          .map((e) => path.join(nodeModulesDir, entry.name, e.name))
      : [path.join(nodeModulesDir, entry.name)];
    for (const dir of dirs) {
      const pkg = readJson(path.join(dir, 'package.json'));
      if (!pkg) continue;
      out.push({ dir, pkg });
      collectInstalled(path.join(dir, 'node_modules'), out);
    }
  }
  return out;
}

/** Installed version of `name` as seen from `fromDir` (walks up node_modules). */
function resolveInstalled(name, fromDir, rootDir) {
  let dir = fromDir;
  for (;;) {
    const pkg = readJson(path.join(dir, 'node_modules', name, 'package.json'));
    if (pkg?.version) return pkg.version;
    if (dir === rootDir || path.dirname(dir) === dir) return null;
    dir = path.dirname(dir);
  }
}

/** @returns {{override: string, owner: string, range: string, installed: string}[]} */
export function checkOverrides(rootDir) {
  const rootPkg = readJson(path.join(rootDir, 'package.json'));
  const overrides = rootPkg?.overrides ?? {};
  const names = [...new Set(Object.keys(overrides).map(overrideName))];
  if (names.length === 0) return [];

  const installed = collectInstalled(path.join(rootDir, 'node_modules'));
  const owners = [
    {
      label: `${rootPkg.name ?? 'root'} (root package.json)`,
      dir: rootDir,
      fields: [...DEP_FIELDS, 'devDependencies'].map((f) => rootPkg[f] ?? {}),
    },
    ...installed.map(({ dir, pkg }) => ({
      label: pkg.name ?? path.basename(dir),
      dir,
      fields: DEP_FIELDS.map((f) => pkg[f] ?? {}),
    })),
  ];

  const exceptions = Array.isArray(rootPkg.overrideRangeExceptions)
    ? rootPkg.overrideRangeExceptions
    : [];
  const used = new Set();
  const violations = [];
  const seen = new Set();
  for (const name of names) {
    for (const owner of owners) {
      for (const deps of owner.fields) {
        const range = deps[name];
        if (typeof range !== 'string' || !semver.validRange(range)) continue; // alias, URL, tag, ...
        const version = resolveInstalled(name, owner.dir, rootDir);
        if (!version) continue; // optional or peer dependency that is not installed
        if (semver.satisfies(version, range, { includePrerelease: true })) continue;
        const id = `${name}|${owner.label}|${range}|${version}`;
        if (seen.has(id)) continue;
        seen.add(id);
        const waiver = exceptions.findIndex(
          (e) =>
            e.override === name && e.owner === owner.label && e.installed === version && e.reason
        );
        if (waiver >= 0) {
          used.add(waiver);
          continue;
        }
        violations.push({ override: name, owner: owner.label, range, installed: version });
      }
    }
  }
  exceptions.forEach((e, i) => {
    if (!used.has(i)) {
      violations.push({
        override: e.override,
        owner: e.owner,
        range: '(stale exception)',
        installed: String(e.installed),
        stale: true,
      });
    }
  });
  return violations;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const root = path.resolve(process.argv[2] ?? process.cwd());
  const rootPkg = readJson(path.join(root, 'package.json'));
  const checked = Object.keys(rootPkg?.overrides ?? {});
  const violations = checkOverrides(root);
  if (violations.length > 0) {
    console.error('check-overrides: FAIL. Installed version outside the range its owner declares:');
    for (const v of violations) {
      console.error(
        v.stale
          ? `  overrideRangeExceptions entry for "${v.override}" / ${v.owner} @ ${v.installed} matches no violation; remove it`
          : `  override "${v.override}": installed ${v.installed}, but ${v.owner} declares ${v.range}`
      );
    }
    console.error(
      'Bound the override to the major the consumer supports (or drop it) and reinstall.'
    );
    process.exit(1);
  }
  console.log(
    `check-overrides: OK (${checked.length} override(s) checked: ${checked.join(', ') || 'none'})`
  );
}
