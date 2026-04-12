const path = require('path');
const { MessageChannel, Worker, receiveMessageOnPort } = require('worker_threads');
const { POSTGRES_SCHEMA_SQL, POSTGRES_SAFE_MIGRATIONS, TABLE_COLUMNS, COLUMN_CASE_MAP } = require('./postgres-schema');
const sleepSignal = new Int32Array(new SharedArrayBuffer(4));

function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let depth = 0;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const prev = index > 0 ? sql[index - 1] : '';
    if (char === '\'' && prev !== '\\') {
      inString = !inString;
    }
    if (!inString) {
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);
      if (char === ';' && depth === 0) {
        if (current.trim()) statements.push(current.trim());
        current = '';
        continue;
      }
    }
    current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

function replacePlaceholders(sql) {
  let parameterIndex = 0;
  let inString = false;
  let output = '';
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    const prev = index > 0 ? sql[index - 1] : '';
    if (char === '\'' && prev !== '\\') {
      inString = !inString;
      output += char;
      continue;
    }
    if (!inString && char === '?') {
      parameterIndex += 1;
      output += `$${parameterIndex}`;
      continue;
    }
    output += char;
  }
  return output;
}

function translateCommonSql(sql) {
  return replacePlaceholders(
    String(sql || '')
      .replace(/strftime\('%s',\s*'now'\)/gi, 'EXTRACT(EPOCH FROM NOW())::BIGINT')
      .replace(/\bAUTOINCREMENT\b/gi, '')
      .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
      .replace(/\bREAL\b/gi, 'DOUBLE PRECISION')
      .replace(/\bINTEGER PRIMARY KEY AUTOINCREMENT\b/gi, 'BIGSERIAL PRIMARY KEY')
      .replace(/\bINTEGER PRIMARY KEY\b/gi, 'BIGINT PRIMARY KEY')
      .replace(/\bINTEGER\b/gi, 'BIGINT')
  );
}

function getInsertTargetTable(sql) {
  const match = String(sql || '').match(/^\s*INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)/i);
  return match ? match[1] : null;
}

function maybeAppendReturningId(sql) {
  const trimmed = String(sql || '').trim();
  if (!/^INSERT\s+INTO\b/i.test(trimmed)) return trimmed;
  if (/\bRETURNING\b/i.test(trimmed)) return trimmed;
  const tableName = getInsertTargetTable(trimmed);
  if (!tableName) return trimmed;
  const columns = TABLE_COLUMNS[tableName] || [];
  if (!columns.includes('id')) return trimmed;
  return `${trimmed} RETURNING id`;
}

function buildAliasCaseMap(sql) {
  const aliasMap = {};
  const pattern = /\bAS\s+([A-Za-z_][A-Za-z0-9_]*)\b/gi;
  let match = pattern.exec(String(sql || ''));
  while (match) {
    aliasMap[match[1].toLowerCase()] = match[1];
    match = pattern.exec(String(sql || ''));
  }
  return aliasMap;
}

function remapRowKeys(sql, row) {
  if (!row || typeof row !== 'object') return row;
  const aliasMap = buildAliasCaseMap(sql);
  const mapped = {};
  Object.keys(row).forEach((key) => {
    const normalizedKey = String(key).toLowerCase();
    const targetKey = aliasMap[normalizedKey] || COLUMN_CASE_MAP[normalizedKey] || key;
    mapped[targetKey] = row[key];
  });
  return mapped;
}

class PostgresStatement {
  constructor(database, sql) {
    this.database = database;
    this.sql = String(sql || '');
  }

  get(...params) {
    const result = this.database.query(this.sql, params);
    return result.rows.length ? remapRowKeys(this.sql, result.rows[0]) : undefined;
  }

  all(...params) {
    const result = this.database.query(this.sql, params);
    return result.rows.map((row) => remapRowKeys(this.sql, row));
  }

  run(...params) {
    const sql = maybeAppendReturningId(this.sql);
    const result = this.database.query(sql, params);
    const row = result.rows.length ? remapRowKeys(sql, result.rows[0]) : null;
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: row && Object.prototype.hasOwnProperty.call(row, 'id') ? row.id : undefined,
    };
  }
}

class PostgresDatabase {
  constructor(connectionString) {
    const channel = new MessageChannel();
    this.responsePort = channel.port1;
    this.worker = new Worker(path.join(__dirname, 'postgres-worker.js'), {
      workerData: { connectionString, responsePort: channel.port2 },
      transferList: [channel.port2],
    });
    this.requestId = 0;
    this.transactionId = null;
    this.fatalWorkerError = null;

    this.worker.on('error', (error) => {
      this.fatalWorkerError = error;
    });
    this.worker.on('exit', (code) => {
      if (code !== 0 && !this.fatalWorkerError) {
        this.fatalWorkerError = new Error(`PostgreSQL worker exited with code ${code}`);
      }
    });
  }

  pragma() {
    return null;
  }

  exec(sql) {
    const statements = splitSqlStatements(translateCommonSql(sql));
    statements.forEach((statement) => {
      if (!statement) return;
      this.query(statement, []);
    });
  }

  prepare(sql) {
    return new PostgresStatement(this, sql);
  }

  transaction(fn) {
    return (...args) => {
      const beginResult = this.callWorker('begin', {});
      const previousTransactionId = this.transactionId;
      this.transactionId = beginResult.transactionId;
      try {
        const result = fn(...args);
        this.callWorker('commit', { transactionId: this.transactionId });
        return result;
      } catch (error) {
        try {
          this.callWorker('rollback', { transactionId: this.transactionId });
        } catch (_rollbackError) {
          // Ignore rollback failures and rethrow the original error.
        }
        throw error;
      } finally {
        this.transactionId = previousTransactionId;
      }
    };
  }

  query(sql, params) {
    return this.callWorker('query', {
      sql: translateCommonSql(sql),
      params,
      transactionId: this.transactionId,
    });
  }

  close() {
    try {
      this.callWorker('close', {});
    } catch (_error) {
      // Ignore close-time errors.
    }
    this.responsePort.close();
    return this.worker.terminate();
  }

  callWorker(type, payload) {
    if (this.fatalWorkerError) throw this.fatalWorkerError;

    const requestId = ++this.requestId;
    this.worker.postMessage({ requestId, type, payload });

    while (true) {
      if (this.fatalWorkerError) throw this.fatalWorkerError;

      const received = receiveMessageOnPort(this.responsePort);
      if (received && received.message) {
        const message = received.message;
        if (message.requestId !== requestId) {
          continue;
        }

        if (message.error) {
          const error = new Error(message.error.message || 'PostgreSQL worker error');
          error.name = message.error.name || 'Error';
          error.stack = message.error.stack || error.stack;
          throw error;
        }

        return message.result;
      }

      Atomics.wait(sleepSignal, 0, 0, 10);
    }
  }
}

function bootstrapPostgresSchema(db) {
  db.exec(POSTGRES_SCHEMA_SQL);
}

function runSafePostgresMigrations(db) {
  POSTGRES_SAFE_MIGRATIONS.forEach((sql) => {
    try {
      db.exec(sql);
    } catch (error) {
      console.warn('[db] Safe migration skipped:', sql, error && error.message);
    }
  });
}

module.exports = {
  PostgresDatabase,
  bootstrapPostgresSchema,
  runSafePostgresMigrations,
};