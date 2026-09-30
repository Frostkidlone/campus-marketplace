
# Deployment Guide — FUPRE Market

## Local
Backend: cd backend && npm install && npm run init-db && npm run dev
Frontend: cd frontend && npm install && npm run dev

## Render + Vercel
Backend on Render: Root backend, Build npm install, Start npm start, Env PORT, JWT_SECRET, FRONTEND_URL, NODE_ENV=production
Frontend on Vercel: Set VITE_API_URL to backend /api URL

## MySQL Production
Import backend/mysql_schema.sql, switch config/db.js to mysql2.

## Security for Viva
Show auth.js bcrypt + JWT, RBAC, ownership checks, express-validator, multer filter, parameterized queries.

Good luck!
