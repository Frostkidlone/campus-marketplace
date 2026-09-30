
import express from 'express';
import { all, get, run } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const favs = await all(`
      SELECT p.*, u.name as seller_name, c.category_name
      FROM favorites f
      JOIN products p ON f.product_id = p.product_id
      JOIN users u ON p.seller_id = u.user_id
      JOIN categories c ON p.category_id = c.category_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [req.user.user_id]);
    res.json(favs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:productId', authenticate, async (req, res) => {
  try {
    const product = await get("SELECT product_id FROM products WHERE product_id = ?", [req.params.productId]);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await run("INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?,?)", [req.user.user_id, req.params.productId]);
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    await run("DELETE FROM favorites WHERE user_id = ? AND product_id = ?", [req.user.user_id, req.params.productId]);
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
