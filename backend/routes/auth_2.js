
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { run, get } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Register FR1
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required').isLength({ min: 2 }),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
  body('matric_no').optional().trim(),
  body('department').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, matric_no, department } = req.body;
  try {
    const existing = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO users (name, email, password_hash, matric_no, department, role) VALUES (?,?,?,?,?,?)",
      [name, email, hash, matric_no || null, department || null, 'student']
    );

    const token = jwt.sign({ user_id: result.id, email, role: 'student', name }, process.env.JWT_SECRET || 'fupre_final_year_secret_2026', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.status(201).json({ message: 'Account created', token, user: { user_id: result.id, name, email, role: 'student' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login FR2
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'fupre_final_year_secret_2026', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role, matric_no: user.matric_no, department: user.department, avatar: user.avatar }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Me
router.get('/me', async (req, res) => {
  // optional auth via middleware if needed but we handle token manually for simplicity
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await get("SELECT user_id, name, email, role, matric_no, department, avatar, created_at FROM users WHERE user_id = ?", [decoded.user_id]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
