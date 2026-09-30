
import express from 'express';
import { all, get, run } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all - FR14
router.get('/', async (req, res) => {
  try {
    const categories = await all("SELECT * FROM categories ORDER BY category_name ASC");
    // also get product count per category
    const counts = await all("SELECT category_id, COUNT(*) as count FROM products WHERE status != 'inactive' GROUP BY category_id");
    const countMap = {};
    counts.forEach(c => countMap[c.category_id] = c.count);
    const enriched = categories.map(cat => ({ ...cat, product_count: countMap[cat.category_id] || 0 }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, authorize(['admin']), async (req, res) => {
  const { category_name, description, icon } = req.body;
  if (!category_name) return res.status(400).json({ message: 'Name required' });
  try {
    const result = await run("INSERT INTO categories (category_name, description, icon) VALUES (?,?,?)", [category_name, description || null, icon || null]);
    const cat = await get("SELECT * FROM categories WHERE category_id = ?", [result.id]);
    res.status(201).json(cat);
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ message: 'Category exists' });
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
