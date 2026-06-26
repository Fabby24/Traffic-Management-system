const mysql = require('mysql2');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = db.promise();
async function testConnection() {
  try {
    await promisePool.query('SELECT 1');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}
testConnection();

module.exports = promisePool;