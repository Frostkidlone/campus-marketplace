
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

// MySQL pool for production - used when DATABASE_URL or DB_HOST is set
// For local SQLite dev, keep using db.js (sqlite3). For MySQL production, rename this file to db.js or set USE_MYSQL=true

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fupre_marketplace',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

export function getDB() {
  return pool;
}

export async function run(query, params = []) {
  // Convert SQLite ? placeholders to MySQL ? (same) and handle lastID
  const [result] = await pool.execute(query, params);
  return { id: result.insertId, changes: result.affectedRows };
}

export async function get(query, params = []) {
  const [rows] = await pool.execute(query, params);
  return rows[0] || null;
}

export async function all(query, params = []) {
  const [rows] = await pool.execute(query, params);
  return rows;
}

// Test connection
export async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connected');
    conn.release();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    return false;
  }
}
