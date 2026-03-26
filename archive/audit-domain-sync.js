const fs = require('fs');
const path = require('path');

const root = process.cwd();
const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const portalJs = fs.readFileSync(path.join(root, 'portal.js'), 'utf8');

function extractLiteralDomainsFromArrayExpression(text) {
  return [...text.matchAll(/['\"]([a-z-]+)['\"]/g)].map((m) => m[1]);
}

const emittedDomains = new Set();

for (const m of serverJs.matchAll(/syncDomains\s*:\s*\[([^\]]*)\]/g)) {
  for (const domain of extractLiteralDomainsFromArrayExpression(m[1])) {
    emittedDomains.add(domain);
  }
}

for (const m of serverJs.matchAll(/emitDomainSyncToAdmins\([^,]+,\s*\[([^\]]*)\]\)/g)) {
  for (const domain of extractLiteralDomainsFromArrayExpression(m[1])) {
    emittedDomains.add(domain);
  }
}

if (serverJs.includes("domains: ['contracts']")) {
  emittedDomains.add('contracts');
}

const handledDomains = new Set(
  [...portalJs.matchAll(/set\.has\('([a-z-]+)'\)/g)].map((m) => m[1])
);

console.log('=== DOMAIN SYNC AUDIT ===');
console.log('Emitted domains:', [...emittedDomains].sort().join(', '));
console.log('Handled domains:', [...handledDomains].sort().join(', '));

const unhandled = [...emittedDomains].filter((d) => !handledDomains.has(d)).sort();
if (unhandled.length) {
  console.log('UNHANDLED_EMITTED_DOMAINS:');
  for (const d of unhandled) console.log('- ' + d);
  process.exitCode = 1;
} else {
  console.log('PASS: all emitted sync domains are handled in refreshPortalForDomains');
}
