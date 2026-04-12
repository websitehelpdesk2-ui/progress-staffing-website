const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { PostgresDatabase, bootstrapPostgresSchema, runSafePostgresMigrations } = require('./postgres');

function isProductionDeployment() {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const renderFlag = String(process.env.RENDER || '').trim().toLowerCase();
  return nodeEnv === 'production' || renderFlag === 'true';
}

function createDatabase() {
  const connectionString = String(process.env.DATABASE_URL || '').trim();
  if (connectionString) {
    return new PostgresDatabase(connectionString);
  }

  if (isProductionDeployment()) {
    throw new Error('DATABASE_URL is required in production. SQLite fallback is disabled for production deployments.');
  }

  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  return new Database(path.join(dataDir, 'app.db'));
}

module.exports = {
  bootstrapPostgresSchema,
  runSafePostgresMigrations,
  createDatabase,
  isProductionDeployment,
  isUsingPostgres: Boolean(String(process.env.DATABASE_URL || '').trim()),
};