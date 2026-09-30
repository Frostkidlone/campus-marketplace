
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { run, get, all } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random()*1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG/PNG/WEBP allowed'));
  }
});

// Get all products with search, filter - FR9, FR10
router.get('/', async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, status, condition, seller_id, sort = 'newest' } = req.query;
    let query = `
      SELECT p.*, u.name as seller_name, u.email as seller_email, c.category_name
      FROM products p
      JOIN users u ON p.seller_id = u.user_id
      JOIN categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      query += " AND (p.product_name LIKE ? OR p.description LIKE ?)";
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      query += " AND p.category_id = ?";
      params.push(category);
    }
    if (minPrice) {
      query += " AND p.price >= ?";
      params.push(minPrice);
    }
    if (maxPrice) {
      query += " AND p.price <= ?";
      params.push(maxPrice);
    }
    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    } else {
      query += " AND p.status != 'inactive'";
    }
    if (condition) {
      query += " AND p.condition_type = ?";
      params.push(condition);
    }
    if (seller_id) {
      query += " AND p.seller_id = ?";
      params.push(seller_id);
    }

    if (sort === 'price_low') query += " ORDER BY p.price ASC";
    else if (sort === 'price_high') query += " ORDER BY p.price DESC";
    else if (sort === 'popular') query += " ORDER BY p.views DESC";
    else query += " ORDER BY p.created_at DESC";

    const products = await all(query, params);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product - FR11
router.get('/:id', async (req, res) => {
  try {
    const product = await get(`
      SELECT p.*, u.name as seller_name, u.email as seller_email, u.matric_no, u.department, c.category_name
      FROM products p
      JOIN users u ON p.seller_id = u.user_id
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
    `, [req.params.id]);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // increment views
    await run("UPDATE products SET views = views + 1 WHERE product_id = ?", [req.params.id]);
    product.views = (product.views || 0) + 1;

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create listing - FR5
router.post('/', authenticate, upload.single('image'), [
  body('product_name').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('description').trim().notEmpty(),
  body('category_id').isInt(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ errors: errors.array() });
  }

  const { product_name, price, description, category_id, condition_type = 'used', location, status = 'available' } = req.body;
  try {
    const cat = await get("SELECT * FROM categories WHERE category_id = ?", [category_id]);
    if (!cat) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid category' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await run(
      `INSERT INTO products (seller_id, category_id, product_name, price, description, image, condition_type, status, location)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [req.user.user_id, category_id, product_name, price, description, imagePath, condition_type, status, location || null]
    );

    const newProduct = await get("SELECT * FROM products WHERE product_id = ?", [result.id]);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit listing - FR6
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const product = await get("SELECT * FROM products WHERE product_id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller_id !== req.user.user_id && req.user.role !== 'admin') {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Not authorized to edit this listing' });
    }

    const { product_name, price, description, category_id, condition_type, status, location } = req.body;
    let imagePath = product.image;

    if (req.file) {
      // delete old if exists
      if (product.image) {
        const oldPath = path.join(__dirname, '..', product.image);
        if (fs.existsSync(oldPath)) try { fs.unlinkSync(oldPath); } catch {}
      }
      imagePath = `/uploads/${req.file.filename}`;
    }

    await run(
      `UPDATE products SET product_name = COALESCE(?, product_name),
       price = COALESCE(?, price),
       description = COALESCE(?, description),
       category_id = COALESCE(?, category_id),
       condition_type = COALESCE(?, condition_type),
       status = COALESCE(?, status),
       location = COALESCE(?, location),
       image = ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ?`,
      [product_name || null, price || null, description || null, category_id || null, condition_type || null, status || null, location || null, imagePath, req.params.id]
    );

    const updated = await get("SELECT * FROM products WHERE product_id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete/Deactivate - FR7, FR8
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const product = await get("SELECT * FROM products WHERE product_id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller_id !== req.user.user_id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Actually delete file
    if (product.image) {
      const p = path.join(__dirname, '..', product.image);
      if (fs.existsSync(p)) try { fs.unlinkSync(p); } catch {}
    }

    await run("DELETE FROM products WHERE product_id = ?", [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update status specifically
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['available','reserved','sold','inactive'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

  try {
    const product = await get("SELECT * FROM products WHERE product_id = ?", [req.params.id]);
    if (!product) return res.status(404).json({ message: 'Not found' });
    if (product.seller_id !== req.user.user_id && req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    await run("UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?", [status, req.params.id]);
    res.json({ message: 'Status updated', status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
