const mysql = require('mysql2/promise');
const util = require('util');
const logger = require('../utils/logger');

let pool;

const initializePool = () => {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'elevate_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  pool.on('error', (err) => {
    logger.error('Unexpected MySQL pool error', { error: err.message });
  });
};

const query = async (text, params = [], options = {}) => {
  const { logSuccess = true, logErrors = true, silent = false } = options;
  const shouldLogErrors = silent ? false : logErrors;
  const start = Date.now();
  try {
    const connection = await pool.getConnection();
    try {
      const [rows, fields] = await connection.query(text, params);
      const rowCount = Array.isArray(rows)
        ? rows.length
        : rows && typeof rows.affectedRows === 'number'
          ? rows.affectedRows
          : 0;
      const duration = Date.now() - start;
      if (logSuccess) {
        logger.debug('Executed query', { duration, rows: rowCount });
      }
      return { rows, fields, rowCount };
    } finally {
      connection.release();
    }
  } catch (error) {
    if (shouldLogErrors) {
      logger.error('Database query failed', {
        error: error && error.message ? error.message : util.inspect(error),
        code: error && error.code ? error.code : undefined
      });
    }
    throw error;
  }
};

const getConnection = async () => pool.getConnection();

const testConnection = async (options = {}) => {
  await query('SELECT 1', [], {
    logSuccess: false,
    logErrors: options.logErrors !== false,
    silent: options.silent === true
  });
  logger.info('Database connection established');
};

const closePool = async () => {
  if (pool) {
    try {
      await pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error('Error closing database pool', { error: error.message });
    }
  }
};

module.exports = {
  pool: () => pool,
  initializePool,
  query,
  getConnection,
  testConnection,
  closePool
};
