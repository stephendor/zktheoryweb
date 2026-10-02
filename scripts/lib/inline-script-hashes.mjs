import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  return fs.readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/**
 * SHA-256 (base64) of every inline <script> body in the built HTML.
 * Returns Map<hash, first file (relative to distDir)>.
 */
export function collectInlineScriptHashes(distDir) {
  const seen = new Map();
  for (const file of walk(distDir).filter((f) => f.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    // Non-greedy ([\s\S]*?) so '<' inside minified bodies (D3 comparisons,
    // pagefind init) does not end the match early.
    // Exclude type="application/ld+json": JSON-LD is exempt from script-src.
    const re = /<script((?:\s[^>]*)?)\s*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
      const attrs = m[1] ?? '';
      const body = m[2];
      if (attrs.includes('application/ld+json')) continue;
      if (!body.trim()) continue;
      const hash = crypto.createHash('sha256').update(body).digest('base64');
      if (!seen.has(hash)) seen.set(hash, path.relative(distDir, file));
    }
  }
  return seen;
}
