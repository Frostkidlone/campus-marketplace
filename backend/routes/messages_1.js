
import express from 'express';
import { all, get, run } from '../config/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get conversations for current user - FR13
router.get('/conversations', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    // Get latest message per conversation partner + product
    const conversations = await all(`
      SELECT 
        m.*,
        p.product_name,
        p.image as product_image,
        p.price,
        sender.name as sender_name,
        receiver.name as receiver_name,
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        CASE WHEN m.sender_id = ? THEN receiver.name ELSE sender.name END as other_user_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      JOIN users receiver ON m.receiver_id = receiver.user_id
      LEFT JOIN products p ON m.product_id = p.product_id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `, [userId, userId, userId, userId]);

    // Group by other_user + product to get unique conversations
    const grouped = {};
    conversations.forEach(msg => {
      const key = `${msg.other_user_id}-${msg.product_id || 'general'}`;
      if (!grouped[key]) grouped[key] = msg;
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with specific user and optionally product
router.get('/:otherUserId', authenticate, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const otherId = req.params.otherUserId;
    const { product_id } = req.query;

    let query = `
      SELECT m.*, sender.name as sender_name, p.product_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.user_id
      LEFT JOIN products p ON m.product_id = p.product_id
      WHERE ((m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?))
    `;
    const params = [userId, otherId, otherId, userId];

    if (product_id) {
      query += " AND m.product_id = ?";
      params.push(product_id);
    }

    query += " ORDER BY m.created_at ASC";

    const messages = await all(query, params);

    // mark as read
    await run("UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?", [userId, otherId]);

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message - FR12, FR13
router.post('/', authenticate, async (req, res) => {
  try {
    const { receiver_id, product_id, message_text } = req.body;
    if (!receiver_id || !message_text) return res.status(400).json({ message: 'receiver_id and message_text required' });
    if (receiver_id == req.user.user_id) return res.status(400).json({ message: 'Cannot message yourself' });

    const receiver = await get("SELECT user_id FROM users WHERE user_id = ?", [receiver_id]);
    if (!receiver) return res.status(404).json({ message: 'Receiver not found' });

    if (product_id) {
      const product = await get("SELECT product_id FROM products WHERE product_id = ?", [product_id]);
      if (!product) return res.status(404).json({ message: 'Product not found' });
    }

    const result = await run(
      "INSERT INTO messages (sender_id, receiver_id, product_id, message_text) VALUES (?,?,?,?)",
      [req.user.user_id, receiver_id, product_id || null, message_text]
    );

    const message = await get("SELECT * FROM messages WHERE message_id = ?", [result.id]);
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
