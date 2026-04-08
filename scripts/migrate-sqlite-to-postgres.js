#!/usr/bin/env node

const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');
const { POSTGRES_SCHEMA_SQL, TABLE_COLUMNS } = require('../db/postgres-schema');

const SQLITE_PATH = path.resolve(process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'app.db'));
const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required to migrate SQLite data into PostgreSQL.');
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const pool = new Pool({ connectionString: DATABASE_URL });

const TABLES = [
  'users',
  'applications',
  'employee_profiles',
  'jobsite_profiles',
  'jobs',
  'job_assignments',
  'sessions',
  'password_reset_tokens',
  'admin_logs',
  'employee_documents',
  'employee_w4_forms',
  'employee_w9_forms',
  'employee_background_consent_forms',
  'employee_hipaa_compliance_forms',
  'employee_handbook_forms',
  'employee_compensation_agreement_forms',
  'shift_declines',
  'shift_offers',
  'direct_messages',
  'employee_time_clock_entries',
  'notification_subscriptions',
  'portal_notifications',
  'document_reminder_logs',
  'timesheets',
  'timesheet_reminder_logs',
  'contracts',
  'contract_bank',
  'misc_docs',
  'misc_doc_sends',
  'employee_excuse_forms',
  'user_passkeys',
];

function quoteValuesPlaceholders(length) {
  return Array.from({ length }, (_value, index) => `$${index + 1}`).join(', ');
}

function tableExists(tableName) {
  const row = sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName);
  return Boolean(row && row.name);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(POSTGRES_SCHEMA_SQL);

    for (const tableName of TABLES) {
      if (!tableExists(tableName)) continue;

      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
      if (!rows.length) continue;

      const columnNames = Object.keys(rows[0]);
      const insertSql = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${quoteValuesPlaceholders(columnNames.length)}) ON CONFLICT DO NOTHING`;

      for (const row of rows) {
        const values = columnNames.map((columnName) => row[columnName]);
        await client.query(insertSql, values);
      }

      const tableColumns = TABLE_COLUMNS[tableName] || [];
      if (tableColumns.includes('id')) {
        await client.query(
          `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${tableName}), 1), (SELECT COUNT(*) > 0 FROM ${tableName}))`,
          [tableName]
        );
      }
    }

    await client.query('COMMIT');
    console.log('SQLite to PostgreSQL import completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    sqlite.close();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('SQLite to PostgreSQL import failed:', error);
  process.exit(1);
});