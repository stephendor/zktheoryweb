import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

function walk(dir) {
  return fs.readdirSync(dir).flatMap(f => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const seen = new Map();

for (const file of walk('dist').filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script(?:\s[^>]*)?>([^<]+)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const body = m[1];
    if (!body.trim()) continue;
    const h = crypto.createHash('sha256').update(body).digest('base64');
    if (!seen.has(h)) {
      const preview = body.trim().replace(/\s+/g, ' ').slice(0, 120);
      seen.set(h, { file: path.relative('dist', file), preview });
    }
  }
}

const entries = [...seen.values()];
const groups = new Map();
for (const e of entries) {
  const top = e.file.split(path.sep)[0];
  groups.set(top, (groups.get(top) ?? 0) + 1);
}

console.log('Total unique hashes:', seen.size);
console.log('By top-level dir:', Object.fromEntries(groups));
console.log('\nAll previews:');
for (const [hash, e] of seen) {
  console.log(`\n[${e.file}]`);
  console.log(e.preview);
}
