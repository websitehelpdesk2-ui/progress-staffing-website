const http = require('http');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(process.cwd(), 'data', 'app.db'));
const counts = db.prepare(
  "SELECT SUM(CASE WHEN role = 'employee' THEN 1 ELSE 0 END) AS employeeCount, SUM(CASE WHEN role = 'employee' AND COALESCE(isActive, 0) = 0 THEN 1 ELSE 0 END) AS inactiveEmployeeCount FROM users"
).get();

console.log('DB_EMPLOYEE_COUNT=' + Number(counts.employeeCount || 0));
console.log('DB_INACTIVE_EMPLOYEE_COUNT=' + Number(counts.inactiveEmployeeCount || 0));

const loginBody = JSON.stringify({
  email: 'admin@progressstaffingagency.com',
  password: 'ChangeMe123!',
});

const loginReq = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginBody),
    },
  },
  (loginRes) => {
    let loginData = '';
    loginRes.on('data', (chunk) => {
      loginData += chunk;
    });
    loginRes.on('end', () => {
      const cookieHeader = loginRes.headers['set-cookie'];
      console.log('LOGIN_STATUS=' + loginRes.statusCode);
      if (!cookieHeader || loginRes.statusCode !== 200) {
        console.log('LOGIN_BODY=' + loginData);
        process.exit(1);
        return;
      }

      const cookie = Array.isArray(cookieHeader)
        ? cookieHeader.map((value) => value.split(';')[0]).join('; ')
        : String(cookieHeader).split(';')[0];

      const recipientsReq = http.request(
        {
          hostname: 'localhost',
          port: 3000,
          path: '/api/admin/misc-docs/recipients',
          method: 'GET',
          headers: { Cookie: cookie },
        },
        (recipientsRes) => {
          let recipientsData = '';
          recipientsRes.on('data', (chunk) => {
            recipientsData += chunk;
          });
          recipientsRes.on('end', () => {
            console.log('RECIPIENTS_STATUS=' + recipientsRes.statusCode);
            const payload = JSON.parse(recipientsData || '{}');
            const employees = Array.isArray(payload.employees) ? payload.employees : [];
            const inactiveReturned = employees.filter((employee) => !employee.isActive).length;
            console.log('DB_EMPLOYEE_COUNT=' + Number(counts.employeeCount || 0));
            console.log('DB_INACTIVE_EMPLOYEE_COUNT=' + Number(counts.inactiveEmployeeCount || 0));
            console.log('API_EMPLOYEE_COUNT=' + employees.length);
            console.log('API_INACTIVE_EMPLOYEE_COUNT=' + inactiveReturned);
            console.log('FIRST_EMPLOYEES=' + JSON.stringify(employees.slice(0, 5)));
            process.exit(recipientsRes.statusCode === 200 ? 0 : 1);
          });
        }
      );

      recipientsReq.on('error', (error) => {
        console.log('RECIPIENTS_ERROR=' + error.message);
        process.exit(1);
      });

      recipientsReq.end();
    });
  }
);

loginReq.on('error', (error) => {
  console.log('LOGIN_ERROR=' + error.message);
  process.exit(1);
});

loginReq.write(loginBody);
loginReq.end();
