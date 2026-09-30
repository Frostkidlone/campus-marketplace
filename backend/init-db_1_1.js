
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath);

const schema = `
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK(role IN ('student','admin')),
  matric_no TEXT,
  department TEXT,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  category_id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  images TEXT,
  condition_type TEXT DEFAULT 'used' CHECK(condition_type IN ('new','used','like-new')),
  status TEXT DEFAULT 'available' CHECK(status IN ('available','reserved','sold','inactive')),
  location TEXT,
  views INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(category_id) ON DELETE SET NULL
);

CREATE TABLE messages (
  message_id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  product_id INTEGER,
  message_text TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

CREATE TABLE transactions (
  transaction_id INTEGER PRIMARY KEY AUTOINCREMENT,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(buyer_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  favorite_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id),
  FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
`;

db.serialize(async () => {
  db.exec(schema, async (err) => {
    if (err) {
      console.error("Schema error", err);
      return;
    }
    console.log("Tables created");

    // Seed categories
    const categories = [
      ['Textbooks & Lecture Materials', 'Academic books, past questions, handouts', 'Book'],
      ['Electronics & Gadgets', 'Phones, laptops, accessories', 'Smartphone'],
      ['Clothing & Fashion', 'Wears, shoes, bags', 'Shirt'],
      ['Hostel Essentials', 'Buckets, mattresses, kitchen items', 'Home'],
      ['Accommodation Info', 'Hostel spaces, self-contain listings', 'Building'],
      ['Services', 'Tutoring, graphic design, haircuts, etc', 'Briefcase'],
      ['Food & Groceries', 'Snacks, provisions', 'Utensils'],
      ['Others', 'Miscellaneous items', 'Package']
    ];
    const stmt = db.prepare("INSERT INTO categories (category_name, description, icon) VALUES (?,?,?)");
    categories.forEach(c => stmt.run(c));
    stmt.finalize();

    // Seed admin
    const hash = await bcrypt.hash("admin123", 10);
    db.run("INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)",
      ["Admin", "admin@fupre.edu.ng", hash, "admin", "ICT"]);

    // Seed student
    const hash2 = await bcrypt.hash("student123", 10);
    db.run("INSERT INTO users (name, email, password_hash, role, matric_no, department) VALUES (?,?,?,?,?,?)",
      ["John Doe", "john@fupre.edu.ng", hash2, "student", "ENG2001234", "Computer Science"]);

    // Seed products
    setTimeout(() => {
      db.get("SELECT user_id FROM users WHERE email='john@fupre.edu.ng'", (e, user) => {
        if (!user) return;
        db.all("SELECT category_id, category_name FROM categories", (e, cats) => {
          const catMap = {};
          cats.forEach(c=>catMap[c.category_name]=c.category_id);
          const products = [
            [user.user_id, catMap['Textbooks & Lecture Materials'], "Engineering Mathematics Textbook - Stroud", 3500, "Clean, slightly used. 6th Edition. Perfect for ENG 101", "used", "available", "Hostel Block A"],
            [user.user_id, catMap['Electronics & Gadgets'], "HP Laptop Charger 65W", 7000, "Original HP charger, works perfectly. Selling because I got new laptop", "like-new", "available", "Campus Gate"],
            [user.user_id, catMap['Hostel Essentials'], "Study Table + Chair", 15000, "Sturdy wooden table and chair, 1 year used. Pickup at hostel", "used", "available", "Nekache Hostel"],
            [user.user_id, catMap['Clothing & Fashion'], "Senator Wear - Size L", 12000, "Brand new senator, never worn. Grey color", "new", "available", "Effurun"],
            [user.user_id, catMap['Accommodation Info'], "Self-Contain near Campus - 1 Year", 180000, "Spacious self-contain with water and light, close to FUPRE gate. Contact for inspection", "new", "available", "Ugbomro"],
          ];
          const ps = db.prepare("INSERT INTO products (seller_id, category_id, product_name, price, description, condition_type, status, location) VALUES (?,?,?,?,?,?,?,?)");
          products.forEach(p=>ps.run(p));
          ps.finalize(() => {
            console.log("Seed data inserted");
            db.close();
          });
        });
      });
    }, 500);
  });
});
