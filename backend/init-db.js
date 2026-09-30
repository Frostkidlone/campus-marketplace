
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
DROP TABLE IF EXISTS favorites;
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
  condition_type TEXT DEFAULT 'Used',
  status TEXT DEFAULT 'available',
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
  status TEXT DEFAULT 'pending',
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
    console.log("Tables created - matching screenshots");

    // Seed categories - matching Figure 3.9 and screenshots
    const categories = [
      ['Electronics', 'Phones, laptops, calculators', 'Smartphone'],
      ['Books', 'Textbooks and lecture materials', 'Book'],
      ['Furniture', 'Study desks, chairs', 'Home'],
      ['Apparel', 'Lab coats and wears', 'Shirt'],
      ['Measuring Tools', 'Vernier caliper etc', 'Ruler'],
      ['Stationery', 'Notebooks and pens', 'BookOpen'],
      ['Lab Equipment', 'Goggles, helmets', 'Safety'],
      ['Others', 'Miscellaneous', 'Package']
    ];
    const stmt = db.prepare("INSERT INTO categories (category_name, description, icon) VALUES (?,?,?)");
    categories.forEach(c => stmt.run(c));
    stmt.finalize();

    // Seed users - matching screenshot usernames
    const hashAdmin = await bcrypt.hash("admin123", 10);
    db.run("INSERT INTO users (name, email, password_hash, role, department) VALUES (?,?,?,?,?)",
      ["Admin", "admin@fupre.edu.ng", hashAdmin, "admin", "ICT"]);

    const hashJohn = await bcrypt.hash("student123", 10);
    db.run("INSERT INTO users (name, email, password_hash, role, matric_no, department) VALUES (?,?,?,?,?,?)",
      ["John Doe", "john@fupre.edu.ng", hashJohn, "student", "ENG2001234", "Computer Science"]);

    // Users matching screenshots
    const users = [
      ["Chidi Loku", "chidi.loku@fupre.edu.ng", "ENG2001111", "Electrical"],
      ["Ada Kponmwen", "ada.kponmwen@fupre.edu.ng", "ENG2002222", "Mechanical"],
      ["Tolu Williams", "tolu.williams@fupre.edu.ng", "ENG2003333", "Civil"],
      ["Kelvin Obor", "kelvin.obor@fupre.edu.ng", "ENG2004444", "Chemical"],
      ["Ada Okoro", "ada.okoro@fupre.edu.ng", "ENG2005555", "Petroleum"],
      ["David Efe", "david.efe@fupre.edu.ng", "ENG2006666", "Marine"],
    ];
    for (const [name, email, matric, dept] of users) {
      const h = await bcrypt.hash("student123", 10);
      db.run("INSERT INTO users (name, email, password_hash, role, matric_no, department) VALUES (?,?,?,?,?,?)",
        [name, email, h, "student", matric, dept]);
    }

    // Seed products EXACTLY matching screenshots
    setTimeout(() => {
      db.all("SELECT user_id, email FROM users", (e, usersList) => {
        db.all("SELECT category_id, category_name FROM categories", (e, cats) => {
          const catMap = {}; cats.forEach(c=>catMap[c.category_name]=c.category_id);
          const userMap = {}; usersList.forEach(u=>userMap[u.email]=u.user_id);

          // Products matching Product Listing Page screenshot (Figure attached 1)
          const products = [
            // Screenshot 1 - Product Listing Page (4 cards)
            [userMap['chidi.loku@fupre.edu.ng'], catMap['Electronics'], "Used Scientific Calculator - Casio fx-991ES Plus", 6500, "Casio fx-991ES Plus scientific calculator, used, working perfectly", "Like New", "available", "Hostel Block A", 128],
            [userMap['ada.kponmwen@fupre.edu.ng'], catMap['Books'], "Textbook: Engineering Mathematics - 4th Edition", 3200, "Engineering Mathematics 4th Edition, good condition", "Good", "reserved", "Campus", 64],
            [userMap['tolu.williams@fupre.edu.ng'], catMap['Furniture'], "Portable Study Desk - Foldable Wooden Design", 12000, "Foldable wooden study desk, fair condition", "Fair", "sold", "Hostel Block A", 203],
            [userMap['kelvin.obor@fupre.edu.ng'], catMap['Apparel'], "Mechanical Engineering Lab Coat - Size M, Cotton", 4800, "Lab coat Size M cotton, new", "New", "available", "Campus", 42],

            // Screenshot 2 - Marketplace Search 12 results (6 cards)
            [userMap['chidi.loku@fupre.edu.ng'], catMap['Measuring Tools'], "Digital Vernier Caliper 150mm", 25000, "Digital Vernier Caliper 150mm, Like New", "Like New", "available", "FUPRE Campus", 129],
            [userMap['ada.kponmwen@fupre.edu.ng'], catMap['Electronics'], "Wireless Headphones", 120000, "Wireless Headphones, New, Featured", "New", "available", "Effurun, Delta", 342],
            [userMap['tolu.williams@fupre.edu.ng'], catMap['Furniture'], "Ergonomic Office Chair", 65500, "Ergonomic Office Chair, Used", "Used", "available", "School Gate, FUPRE", 89],
            [userMap['kelvin.obor@fupre.edu.ng'], catMap['Stationery'], "A5 Hardcover Notebook - Pack of 3", 3200, "A5 Hardcover Notebook Pack of 3, Like New", "Like New", "available", "Library, FUPRE", 56],
            [userMap['ada.okoro@fupre.edu.ng'], catMap['Electronics'], "Mechanical Keyboard - Blue Switch", 45000, "Mechanical Keyboard Blue Switch, New Featured", "New", "available", "Engineering Dept, FUPRE", 203],
            [userMap['david.efe@fupre.edu.ng'], catMap['Lab Equipment'], "Safety Goggles - Anti Fog", 7500, "Safety Goggles Anti Fog, New", "New", "available", "Science Lab, FUPRE", 44],

            // Extra for testing all 12 cases
            [userMap['john@fupre.edu.ng'], catMap['Books'], "Engineering Mathematics Textbook - Stroud 6th Edition", 3500, "Clean, slightly used 6th Edition", "Used", "available", "Hostel Block A", 15],
            [userMap['ada.okoro@fupre.edu.ng'], catMap['Lab Equipment'], "FUPRE Lab Goggles", 3500, "Lab goggles for engineering practicals", "New", "available", "Campus", 23],
            [userMap['david.efe@fupre.edu.ng'], catMap['Lab Equipment'], "Safety Helmet", 12000, "Safety helmet for engineering site", "New", "available", "Campus", 12],
          ];

          const ps = db.prepare("INSERT INTO products (seller_id, category_id, product_name, price, description, condition_type, status, location, views) VALUES (?,?,?,?,?,?,?,?,?)");
          products.forEach(p=>ps.run(p));
          ps.finalize(() => {
            console.log("Products seeded matching screenshots");

            // Seed messages matching screenshot 3 - Messages (FR13)
            setTimeout(() => {
              db.get("SELECT user_id FROM users WHERE email='ada.okoro@fupre.edu.ng'", (e, ada) => {
                db.get("SELECT user_id FROM users WHERE email='david.efe@fupre.edu.ng'", (e, david) => {
                  db.get("SELECT product_id FROM products WHERE product_name='FUPRE Lab Goggles'", (e, goggles) => {
                    db.get("SELECT product_id FROM products WHERE product_name='Safety Helmet'", (e, helmet) => {
                      if (!ada || !david) return;
                      const msgs = [
                        [david.user_id, ada.user_id, goggles ? goggles.product_id : 1, "Hi, is the FUPRE Lab Goggles still available?"],
                        [ada.user_id, david.user_id, goggles ? goggles.product_id : 1, "Yes, it's still available. Just listed it yesterday."],
                        [david.user_id, ada.user_id, goggles ? goggles.product_id : 1, "Sounds good, I can meet you at the campus gate by 4pm if that works?"],
                        [ada.user_id, david.user_id, goggles ? goggles.product_id : 1, "Perfect, 4pm works for me. I'll bring it then."],
                        [david.user_id, ada.user_id, helmet ? helmet.product_id : 2, "About Safety Helmet - Okay, price is N12,000. Are you still selling?"],
                        [ada.user_id, david.user_id, goggles ? goggles.product_id : 1, "About FUPRE Lab Goggles - Sounds good, I can meet you at the..."],
                      ];
                      const ms = db.prepare("INSERT INTO messages (sender_id, receiver_id, product_id, message_text) VALUES (?,?,?,?)");
                      msgs.forEach(m=>ms.run(m));
                      ms.finalize(() => {
                        console.log("Messages seeded matching screenshot 3");
                        db.close();
                      });
                    });
                  });
                });
              });
            }, 500);
          });
        });
      });
    }, 800);
  });
});
