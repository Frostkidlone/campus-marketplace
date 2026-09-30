
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'database.sqlite');

const require = createRequire(import.meta.url);
const sqlite = require('sqlite3').verbose();

let db;

export function getDB() {
  if (!db) {
    db = new sqlite.Database(dbPath);
    db.exec("PRAGMA foreign_keys = ON;");
  }
  return db;
}

export function run(query, params = []) {
  const database = getDB();
  return new Promise((resolve, reject) => {
    database.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(query, params = []) {
  const database = getDB();
  return new Promise((resolve, reject) => {
    database.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function all(query, params = []) {
  const database = getDB();
  return new Promise((resolve, reject) => {
    database.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}
