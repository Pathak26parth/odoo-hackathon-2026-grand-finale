const mysql = require('mysql2/promise');
const env = require('./env');

const dbConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  waitForConnections: true,
  connectionLimit: env.DB_CONNECTION_LIMIT,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true // Return date strings for timezone preservation
};

const pool = mysql.createPool(dbConfig);

/**
 * Execute parameterized query using pool
 * @param {string} sql
 * @param {Array} params
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error(`[Database Error] SQL: ${sql}`);
    console.error(`[Database Error] Message: ${error.message}`);
    throw error;
  }
}

/**
 * Run operations within a single database transaction
 * @param {Function} callback - (connection) => Promise<any>
 */
async function transaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test MySQL connection
 */
async function testConnection() {
  try {
    await pool.query('SELECT 1 + 1 AS result');
    console.log(`[Database] Successfully connected to MySQL database "${env.DB_NAME}" on ${env.DB_HOST}:${env.DB_PORT}`);
    return true;
  } catch (error) {
    console.error(`[Database] Connection failure to MySQL: ${error.message}`);
    return false;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  testConnection,
  dbConfig
};
