const fs = require('fs');
const path = require('path');

const root = process.cwd();

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(path.relative(root, full).replace(/\\/g, '/'));
  }
  return out;
}

function normalizeRef(ref) {
  const clean = String(ref || '').trim();
  if (!clean) return '';
  return clean.split('#')[0].split('?')[0].trim();
}

function loadServerGetRoutes() {
  const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  return [...serverJs.matchAll(/app\.get\(\s*['\"]([^'\"]+)['\"]/g)]
    .map((m) => m[1])
    .filter((route) => route.startsWith('/'));
}

function findMissingStaticRefs(allFiles, serverGetRoutes) {
  const fileSet = new Set(allFiles);
  const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
  const misses = [];

  for (const file of htmlFiles) {
    const abs = path.join(root, file);
    const content = fs.readFileSync(abs, 'utf8');
    const re = /(?:href|src)="([^"]+)"/g;
    let match;
    while ((match = re.exec(content))) {
      const refRaw = (match[1] || '').trim();
      if (!refRaw) continue;
      if (/^(https?:|mailto:|tel:|#|javascript:|data:)/i.test(refRaw)) continue;

      const ref = normalizeRef(refRaw);
      if (!ref) continue;
      if (/^\/api\//i.test(ref)) continue;

      const resolved = ref.startsWith('/')
        ? ref.slice(1)
        : path.relative(root, path.resolve(path.dirname(abs), ref)).replace(/\\/g, '/');

      const isRouteLink = ref.startsWith('/') && !ref.includes('.') && !ref.endsWith('/');
      if (isRouteLink && serverGetRoutes.includes(ref)) {
        continue;
      }

      if (!fileSet.has(resolved)) {
        misses.push({ file, ref: refRaw, resolved });
      }
    }
  }

  return misses;
}

function routePatternToRegex(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withParams = escaped.replace(/:\\w+/g, '[^/]+');
  return new RegExp(`^${withParams}$`);
}

function findUnmatchedClientApiRoutes() {
  const portalJs = fs.readFileSync(path.join(root, 'portal.js'), 'utf8');
  const serverJs = fs.readFileSync(path.join(root, 'server.js'), 'utf8');

  const clientRoutes = [...portalJs.matchAll(/apiFetch\(\s*['\"](\/api\/[^'\"?]+)/g)]
    .map((m) => m[1])
    .filter(Boolean);

  const serverRoutes = [...serverJs.matchAll(/app\.(?:get|post|put|patch|delete)\(\s*['\"](\/api\/[^'\"]+)/g)]
    .map((m) => m[1])
    .filter(Boolean);

  const uniqueClient = [...new Set(clientRoutes)].sort();
  const uniqueServer = [...new Set(serverRoutes)].sort();

  const unmatched = uniqueClient.filter((clientRoute) => {
    return !uniqueServer.some((serverRoute) => routePatternToRegex(serverRoute).test(clientRoute));
  });

  return {
    uniqueClient,
    uniqueServer,
    unmatched,
  };
}

function main() {
  const allFiles = walk(root);
  const serverGetRoutes = loadServerGetRoutes();

  const missingStaticRefs = findMissingStaticRefs(allFiles, serverGetRoutes);
  const apiAudit = findUnmatchedClientApiRoutes();

  console.log('=== STATIC PATH AUDIT ===');
  if (missingStaticRefs.length === 0) {
    console.log('PASS: no missing local href/src targets in HTML files');
  } else {
    console.log('FAIL: missing local href/src targets found');
    for (const miss of missingStaticRefs) {
      console.log(`- ${miss.file} -> ${miss.ref} -> ${miss.resolved}`);
    }
  }

  console.log('\n=== API ROUTE AUDIT ===');
  console.log(`Client routes: ${apiAudit.uniqueClient.length}`);
  console.log(`Server routes: ${apiAudit.uniqueServer.length}`);
  if (apiAudit.unmatched.length === 0) {
    console.log('PASS: all client apiFetch routes match an Express route');
  } else {
    console.log('FAIL: unmatched client apiFetch routes found');
    for (const route of apiAudit.unmatched) {
      console.log(`- ${route}`);
    }
  }

  const hasFailure = missingStaticRefs.length > 0 || apiAudit.unmatched.length > 0;
  process.exitCode = hasFailure ? 1 : 0;
}

main();
