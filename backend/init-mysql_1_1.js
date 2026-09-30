
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

async function initMySQL() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'fupre_marketplace'}`);
  await connection.query(`USE ${process.env.DB_NAME || 'fupre_marketplace'}`);

  console.log('Creating tables...');

  // Read mysql_schema.sql and execute
  import fs from 'fs';
  import path from 'path';
  import { fileURLToPath } from 'url';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const schema = fs.readFileSync(path.join(__dirname, 'mysql_schema.sql'), 'utf8');
  
  // Split by ; and execute
  const statements = schema.split(';').filter(s => s.trim().length > 0);
  for (const stmt of statements) {
    try {
      await connection.query(stmt);
    } catch (e) {
      // Ignore errors for existing tables
      if (!e.message.includes('already exists')) {
        console.log('Statement error:', e.message.substring(0,100));
      }
    }
  }

  console.log('Tables created, seeding...');

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

  for (const [name, desc, icon] of categories) {
    await connection.query(
      "INSERT IGNORE INTO categories (category_name, description, icon) VALUES (?,?,?)",
      [name, desc, icon]
    );
  }

  // Seed admin
  const hash = await bcrypt.hash("admin123", 10);
  await connection.query(
    "INSERT IGNORE INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)",
    ["Admin", "admin@fupre.edu.ng", hash, "admin", "ICT"]
  );

  // Seed student
  const hash2 = await bcrypt.hash("student123", 10);
  await connection.query(
    "INSERT IGNORE INTO users (name, email, password_hash, role, matric_no, department) VALUES (?,?,?,?,?,?)",
    ["John Doe", "john@fupre.edu.ng", hash2, "student", "ENG2001234", "Computer Science"]
  );

  console.log('Seeding products...');
  const [users] = await connection.query("SELECT user_id FROM users WHERE email='john@fupre.edu.ng'");
  if (users.length > 0) {
    const userId = users[0].user_id;
    const [cats] = await connection.query("SELECT category_id, category_name FROM categories");
    const catMap = {};
    cats.forEach(c => catMap[c.category_name] = c.category_id);

    const products = [
      [userId, catMap['Textbooks & Lecture Materials'], "Engineering Mathematics Textbook - Stroud", 3500, "Clean, slightly used. 6th Edition. Perfect for ENG 101", "used", "available", "Hostel Block A"],
      [userId, catMap['Electronics & Gadgets'], "HP Laptop Charger 65W", 7000, "Original HP charger, works perfectly.", "like-new", "available", "Campus Gate"],
      [userId, catMap['Hostel Essentials'], "Study Table + Chair", 15000, "Sturdy wooden table and chair, 1 year used.", "used", "available", "Nekache Hostel"],
      [userId, catMap['Clothing & Fashion'], "Senator Wear - Size L", 12000, "Brand new senator, never worn.", "new", "available", "Effurun"],
      [userId, catMap['Accommodation Info'], "Self-Contain near Campus - 1 Year", 180000, "Spacious self-contain with water and light, close to FUPRE gate.", "new", "available", "Ugbomro"],
    ];

    for (const p of products) {
      await connection.query(
        "INSERT IGNORE INTO products (seller_id, category_id, product_name, price, description, condition_type, status, location) VALUES (?,?,?,?,?,?,?,?)",
        p
      );
    }
  }

  console.log('✅ MySQL seeding complete');
  await connection.end();
}

initMySQL().catch(console.error);
