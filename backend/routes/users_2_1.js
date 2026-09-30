
import express from 'express';
import { get, run, all } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get profile - FR4
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await get("SELECT user_id, name, email, role, matric_no, department, avatar, created_at FROM users WHERE user_id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // get seller stats
    const stats = await get("SELECT COUNT(*) as total_listings, SUM(CASE WHEN status='available' THEN 1 ELSE 0 END) as active FROM products WHERE seller_id = ?", [req.params.id]);
    res.json({ ...user, ...stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update own profile
router.put('/profile', authenticate, async (req, res) => {
  const { name, department, matric_no } = req.body;
  try {
    await run("UPDATE users SET name = COALESCE(?, name), department = COALESCE(?, department), matric_no = COALESCE(?, matric_no) WHERE user_id = ?",
      [name || null, department || null, matric_no || null, req.user.user_id]);
    const updated = await get("SELECT user_id, name, email, role, matric_no, department, avatar, created_at FROM users WHERE user_id = ?", [req.user.user_id]);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required' });
  try {
    const user = await get("SELECT * FROM users WHERE user_id = ?", [req.user.user_id]);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(400).json({ message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await run("UPDATE users SET password_hash = ? WHERE user_id = ?", [hash, req.user.user_id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: list users
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await all("SELECT user_id, name, email, role, matric_no, department, created_at FROM users ORDER BY created_at DESC");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: delete user
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
  try {
    if (req.params.id == req.user.user_id) return res.status(400).json({ message: 'Cannot delete yourself' });
    await run("DELETE FROM users WHERE user_id = ?", [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
