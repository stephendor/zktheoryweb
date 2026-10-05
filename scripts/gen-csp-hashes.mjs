import { collectInlineScriptHashes } from './lib/inline-script-hashes.mjs';

// Extraction lives in scripts/lib/inline-script-hashes.mjs so that
// scripts/check-csp-hashes.mjs verifies exactly what this prints.
const seen = collectInlineScriptHashes('dist');

console.log(`// ${seen.size} unique inline script hashes\n`);
for (const [hash, origin] of seen) {
  console.log(`'sha256-${hash}' // ${origin}`);
}

// Output the full script-src value for copy-paste
const hashes = [...seen.keys()].map((h) => `'sha256-${h}'`).join(' ');
console.log('\n// Full script-src value:');
console.log(`script-src 'self' ${hashes}`);
