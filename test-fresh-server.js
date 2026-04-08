#!/usr/bin/env node
const http = require('http');
const spawn = require('child_process').spawn;

console.log('Starting fresh server instance for testing...');

// Start the server
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
});

// Give the server a moment to start
setTimeout(() => {
  console.log('\n\nTesting /api/portal/forms/background-consent/16...');
  
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/portal/forms/background-consent/16',
    method: 'GET',
    headers: {
      'Cookie': 'portal_token=invalid_token_just_to_test_response'
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      console.log('Body preview:', data.substring(0, 500));
      
      // Kill the server
      server.kill();
      process.exit(0);
    });
  });
  
  req.on('error', (e) => {
    console.error('Request error:', e.message);
    server.kill();
    process.exit(1);
  });
  
  req.end();
}, 3000);
