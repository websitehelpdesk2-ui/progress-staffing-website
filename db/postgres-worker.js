const { parentPort, workerData } = require('worker_threads');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: workerData.connectionString });
const responsePort = workerData.responsePort || parentPort;
const transactions = new Map();
let transactionSequence = 0;

function serializeError(error) {
  return {
    name: error && error.name ? error.name : 'Error',
    message: error && error.message ? error.message : String(error),
    stack: error && error.stack ? error.stack : '',
  };
}

async function closeAllTransactions() {
  const entries = Array.from(transactions.entries());
  for (const [transactionId, client] of entries) {
    try {
      await client.query('ROLLBACK');
    } catch (_error) {
      // Ignore rollback failures during shutdown.
    }
    client.release();
    transactions.delete(transactionId);
  }
}

async function handleMessage(message) {
  const { requestId, type, payload } = message;

  try {
    let result;
    if (type === 'begin') {
      const client = await pool.connect();
      await client.query('BEGIN');
      const transactionId = `tx_${Date.now()}_${transactionSequence += 1}`;
      transactions.set(transactionId, client);
      result = { transactionId };
    } else if (type === 'query') {
      const transactionId = payload && payload.transactionId ? String(payload.transactionId) : '';
      const executor = transactionId ? transactions.get(transactionId) : pool;
      if (!executor) {
        throw new Error(`Unknown transaction id: ${transactionId}`);
      }
      const response = await executor.query(String(payload.sql || ''), Array.isArray(payload.params) ? payload.params : []);
      result = {
        rows: response.rows,
        rowCount: response.rowCount,
      };
    } else if (type === 'commit') {
      const transactionId = String(payload && payload.transactionId ? payload.transactionId : '');
      const client = transactions.get(transactionId);
      if (!client) {
        throw new Error(`Unknown transaction id: ${transactionId}`);
      }
      await client.query('COMMIT');
      client.release();
      transactions.delete(transactionId);
      result = { ok: true };
    } else if (type === 'rollback') {
      const transactionId = String(payload && payload.transactionId ? payload.transactionId : '');
      const client = transactions.get(transactionId);
      if (!client) {
        throw new Error(`Unknown transaction id: ${transactionId}`);
      }
      await client.query('ROLLBACK');
      client.release();
      transactions.delete(transactionId);
      result = { ok: true };
    } else if (type === 'close') {
      await closeAllTransactions();
      await pool.end();
      result = { ok: true };
      responsePort.postMessage({ requestId, result });
      process.exit(0);
      return;
    } else {
      throw new Error(`Unsupported postgres worker message type: ${type}`);
    }

    responsePort.postMessage({ requestId, result });
  } catch (error) {
    responsePort.postMessage({ requestId, error: serializeError(error) });
  }
}

parentPort.on('message', (message) => {
  handleMessage(message);
});

process.on('exit', () => {
  closeAllTransactions().catch(() => {});
});