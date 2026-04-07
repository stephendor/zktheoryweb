import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

function walk(dir) {
  return fs.readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk('dist').filter(f => f.endsWith('.html'));
const seen = new Map(); // hash -> first file seen

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  // Exclude type="application/ld+json" — JSON-LD is not executable JS and is
  // exempt from script-src in CSP Level 2+. Only hash executable scripts.
  const re = /<script(?:\s(?!type="application\/ld\+json")[^>]*)?>([^<]+)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const body = m[1];
    if (body.trim().length === 0) continue;
    const hash = crypto.createHash('sha256').update(body).digest('base64');
    if (!seen.has(hash)) {
      seen.set(hash, path.relative('dist', file));
    }
  }
}

console.log(`// ${seen.size} unique inline script hashes\n`);
for (const [hash, origin] of seen) {
  console.log(`'sha256-${hash}' // ${origin}`);
}

// Output the full script-src value for copy-paste
const hashes = [...seen.keys()].map(h => `'sha256-${h}'`).join(' ');
console.log('\n// Full script-src value:');
console.log(`script-src 'self' ${hashes}`);
