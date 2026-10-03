const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_inclusive_ed",
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  enableKeepAlive: true,
});

async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.query("SELECT 1");
    console.log("Koneksi MySQL berhasil.");
    return true;
  } catch (error) {
    console.error("Koneksi MySQL gagal:", error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
};
