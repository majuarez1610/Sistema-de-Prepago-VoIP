const path = require('path');
const mysql = require('mysql2/promise');

const dotenvResult = require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
  override: true
});

const envFromFile = dotenvResult.parsed || {};

function readDbConfig(key, fallback) {
  if (Object.prototype.hasOwnProperty.call(envFromFile, key)) {
    return envFromFile[key];
  }
  return fallback;
}

const pool = mysql.createPool({
  host: readDbConfig('DB_HOST', 'localhost'),
  port: Number(readDbConfig('DB_PORT', 3306)),
  user: readDbConfig('DB_USER', 'root'),
  password: readDbConfig('DB_PASSWORD', ''),
  database: readDbConfig('DB_NAME', 'intelligent_network_db'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testDatabaseConnection
};
