const http = require('http');

const paths = [
  '/',
  '/index.html',
  '/apply.html',
  '/portal-login',
  '/portal-register',
  '/portal-register-employee',
  '/portal-register-jobsite',
  '/portal-scheduling',
  '/portal-onboarding',
  '/portal-contracts',
  '/portal-admin',
  '/portal-jobsite',
  '/portal-employee',
  '/api/health',
  '/api/auth/login',
];

function probe(path) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: 'localhost',
        port: 3000,
        path,
        method: 'GET',
      },
      (res) => {
        const status = res.statusCode;
        res.resume();
        resolve({ path, status });
      }
    );

    req.on('error', (error) => {
      resolve({ path, status: 'ERROR', error: error.message });
    });

    req.end();
  });
}

(async () => {
  const results = [];
  for (const p of paths) {
    results.push(await probe(p));
  }

  console.log('=== HTTP PROBE ===');
  for (const item of results) {
    if (item.status === 'ERROR') {
      console.log(`${item.path} -> ERROR (${item.error})`);
    } else {
      console.log(`${item.path} -> ${item.status}`);
    }
  }

  const failures = results.filter((r) => r.status === 'ERROR' || Number(r.status) >= 500);
  if (failures.length) {
    process.exitCode = 1;
  }
})();
