
import express from 'express';
import { all, get, run } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate, authorize(['admin']));

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await get("SELECT COUNT(*) as count FROM users");
    const productsCount = await get("SELECT COUNT(*) as count FROM products");
    const messagesCount = await get("SELECT COUNT(*) as count FROM messages");
    const activeProducts = await get("SELECT COUNT(*) as count FROM products WHERE status='available'");
    const recentUsers = await all("SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5");
    const recentProducts = await all("SELECT p.*, u.name as seller_name FROM products p JOIN users u ON p.seller_id=u.user_id ORDER BY p.created_at DESC LIMIT 5");

    res.json({
      total_users: usersCount.count,
      total_products: productsCount.count,
      total_messages: messagesCount.count,
      active_listings: activeProducts.count,
      recent_users: recentUsers,
      recent_products: recentProducts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
