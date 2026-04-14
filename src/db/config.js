// db/config.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false  // This bypasses SSL certificate validation
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,  // Increased from 5000
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Please check your DATABASE_URL in .env file');
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

const isRetryableDnsError = (error) =>
  error && (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const query = async (text, params, attempt = 1) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    console.log('Executed query', { text: text.slice(0, 60), duration: Date.now() - start, rows: res.rowCount });
    return res;
  } catch (error) {
    if (isRetryableDnsError(error) && attempt < 3) {
      const waitMs = 250 * attempt;
      console.warn(`Transient DB DNS error (${error.code}), retrying query in ${waitMs}ms...`);
      await sleep(waitMs);
      return query(text, params, attempt + 1);
    }
    console.error('Query error:', error.message);
    throw error;
  }
};

const getClient = async (attempt = 1) => {
  try {
    return await pool.connect();
  } catch (error) {
    if (isRetryableDnsError(error) && attempt < 3) {
      const waitMs = 250 * attempt;
      console.warn(`Transient DB DNS error (${error.code}), retrying connection in ${waitMs}ms...`);
      await sleep(waitMs);
      return getClient(attempt + 1);
    }
    throw error;
  }
};

module.exports = { pool, query, getClient };