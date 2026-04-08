#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Check if the route is defined in the file
const serverPath = path.join(__dirname, 'server.js');
const serverCode = fs.readFileSync(serverPath, 'utf-8');

// Look for the GET /api/portal/forms route
const routeRegex = /app\.get\s*\(\s*['"\/]\/api\/portal\/forms['"]/;
const hasRoute = routeRegex.test(serverCode);

console.log('Checking server.js for the GET /api/portal/forms route:');
console.log('Route found:', hasRoute);

// Check for the helper functions
const functions = [
  'function getSignedOnboardingFormRecord',
  'function renderSignedOnboardingFormHtml',
  'function serveSignedOnboardingForm',
  'function canJobsiteAccessEmployeeForm',
];

console.log('\nChecking for helper functions:');
functions.forEach(func => {
  const found = serverCode.includes(func);
  console.log(`  ${func}: ${found ? '✓' : '✗'}`);
});

// Check the exact route line
const lines = serverCode.split('\n');
const routeLine = lines.findIndex(line => line.includes("app.get('/api/portal/forms/:formType/:employeeId'"));
console.log(`\nRoute definition at line: ${routeLine + 1}`);
if (routeLine >= 0) {
  console.log('Route line content:');
  console.log(lines[routeLine]);
}

// Check serveSignedOnboardingForm function
const serveFunc = serverCode.match(/function serveSignedOnboardingForm\(.*?\{[\s\S]*?\n\s*\}/);
if (serveFunc) {
  console.log('\nFirst few lines of serveSignedOnboardingForm:');
  console.log(serveFunc[0].split('\n').slice(0, 5).join('\n'));
}
