import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const require = createRequire(import.meta.url);
const USE_MYSQL = process.env.USE_MYSQL === 'true' || !!process.env.DB_HOST;

let pool = null;
let sqliteDb = null;

function getSqliteDB() {
  if (!sqliteDb) {
    const sqlite = require('sqlite3').verbose();
    sqliteDb = new sqlite.Database(dbPath);
    sqliteDb.exec("PRAGMA foreign_keys = ON;");
  }
  return sqliteDb;
}

async function getMysqlPool() {
  if (!pool) {
    const mysql = await import('mysql2/promise');
    pool = mysql.default.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fupre_marketplace',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
    });
    console.log('📦 MySQL pool created - Production mode (matches Chapter 4 MySQL correction)');
  }
  return pool;
}

export function getDB() {
  if (USE_MYSQL) {
    return { type: 'mysql' };
  } else {
    return getSqliteDB();
  }
}

export async function run(query, params = []) {
  if (USE_MYSQL) {
    const p = await getMysqlPool();
    const [result] = await p.execute(query, params);
    return { id: result.insertId, changes: result.affectedRows };
  } else {
    const db = getSqliteDB();
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
}

export async function get(query, params = []) {
  if (USE_MYSQL) {
    const p = await getMysqlPool();
    const [rows] = await p.execute(query, params);
    return rows[0] || null;
  } else {
    const db = getSqliteDB();
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

export async function all(query, params = []) {
  if (USE_MYSQL) {
    const p = await getMysqlPool();
    const [rows] = await p.execute(query, params);
    return rows;
  } else {
    const db = getSqliteDB();
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}
