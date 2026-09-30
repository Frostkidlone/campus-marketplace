
# FUPRE Market - Complete Deployment Guide (MySQL Version)

You corrected Chapter 4 to MySQL. This guide deploys your scaffold as MySQL in production so thesis + live link match.

## Your Database Setup

- **Local (no light needed for defense demo):** SQLite - single file `database.sqlite` - zero config
  - `npm run init-db` creates it
  - No MySQL server needed locally

- **Production (for live link in thesis):** MySQL - using `backend/mysql_schema.sql` + `backend/config/db.js` auto-switch
  - When `DB_HOST` env var exists, it uses MySQL (mysql2)
  - When no `DB_HOST`, it uses SQLite (sqlite3)

## Option A: FREE Deployment - Render (Backend) + Vercel (Frontend) - RECOMMENDED

This is what most FUPRE final year students use. Free, no credit card, 10 mins.

### Step 1: Push to GitHub (from your laptop, even with phone hotspot)

```bash
cd campus-marketplace
git init
git add .
git commit -m "FUPRE Marketplace - Final Year Project"
# Create new repo on github.com (call it fupre-marketplace)
git remote add origin https://github.com/YOUR_USERNAME/fupre-marketplace.git
git branch -M main
git push -u origin main
```

### Step 2: Create FREE MySQL Database (2 mins)

Use Railway.app (free MySQL, no credit card):

1. Go to railway.app → Login with GitHub → New Project → Provision MySQL
2. Click MySQL service → Variables tab → Copy:
   - MYSQLHOST
   - MYSQLUSER
   - MYSQLPASSWORD
   - MYSQLDATABASE
   - MYSQLPORT

OR use PlanetScale (also free):
- planetscale.com → Create database fupre-marketplace → Get connection string

### Step 3: Deploy Backend on Render (5 mins)

1. Go to render.com → Login with GitHub → New → Web Service
2. Connect your `fupre-marketplace` repo
3. Settings:
   - Name: fupre-marketplace-api
   - Root Directory: backend
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Free
4. Environment Variables (Render → Environment):
   ```
   NODE_ENV=production
   PORT=10000
   USE_MYSQL=true
   DB_HOST=your_mysql_host_from_railway
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_mysql_database
   DB_PORT=3306
   JWT_SECRET=fupre_final_year_secret_2026_change_this_to_random_32_chars
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://your-frontend.vercel.app (you'll get this after Step 4, put * for now)
   ```
5. Click Create Web Service → Wait 2-3 mins → Copy your backend URL e.g. https://fupre-marketplace-api.onrender.com

6. After deploy, go to Render → Shell tab → Run:
   ```bash
   npm run init-mysql
   # OR if init-mysql fails, run:
   # node init-mysql.js
   ```
   This creates tables and seeds admin@fupre.edu.ng / admin123 and john@fupre.edu.ng / student123

   Test: Visit https://your-backend.onrender.com/api/health → should return {status: ok}

### Step 4: Deploy Frontend on Vercel (3 mins)

1. Go to vercel.com → Login with GitHub → Add New → Project
2. Import `fupre-marketplace` repo
3. Settings:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
4. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
   (Use your Render backend URL from Step 3)
5. Deploy → Copy frontend URL e.g. https://fupre-marketplace.vercel.app

6. Go back to Render → Environment → Update FRONTEND_URL to your Vercel URL → Save (auto redeploys)

### Step 5: Test Live

- Frontend: https://your-frontend.vercel.app
- Register new account
- Login admin@fupre.edu.ng / admin123 → should go to /admin
- Create product listing with image
- Search and filter
- Send message
- Test on phone: open frontend URL on phone → should be responsive (Test Case 12)

Put these 2 links in your thesis Chapter 4:
- Live URL: https://your-frontend.vercel.app
- API Docs: https://your-backend.onrender.com

---

## Option B: cPanel Deployment (If FUPRE gives you cPanel)

Common in Nigeria.

### Backend on cPanel Node.js:

1. cPanel → Setup Node.js App → Create Application
   - Node version: 20
   - Application mode: Production
   - Application root: fupre-marketplace/backend
   - Application URL: yourdomain.com/api
   - Application startup file: server.js
2. cPanel → MySQL Databases → Create database fupre_marketplace, user, password → Add user to database
3. phpMyAdmin → Import backend/mysql_schema.sql
4. cPanel → File Manager → backend/.env:
   ```
   PORT=3000 (cPanel gives you port)
   USE_MYSQL=true
   DB_HOST=localhost
   DB_USER=your_cpanel_mysql_user
   DB_PASSWORD=your_cpanel_mysql_password
   DB_NAME=your_cpanel_mysql_db
   DB_PORT=3306
   JWT_SECRET=your_random_secret
   FRONTEND_URL=https://yourdomain.com
   ```
5. SSH or Terminal in cPanel: cd backend && npm install && npm run init-mysql
6. Restart Node.js App in cPanel

### Frontend on cPanel:

```bash
cd frontend
npm install
npm run build
# Upload dist/* contents to public_html/ (or public_html/marketplace/)
```

Set VITE_API_URL before build to your backend URL.

---

## Option C: Local Deployment (When Light Returns)

For defense demo with no internet:

```bash
# Backend
cd backend
npm install
npm run init-db
npm run dev
# → http://localhost:5000/api/health

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Default accounts:
- Admin: admin@fupre.edu.ng / admin123 → /admin
- Student: john@fupre.edu.ng / student123

---

## Environment Variables Cheat Sheet

### Backend .env (local SQLite)
```
PORT=5000
JWT_SECRET=fupre_final_year_secret_2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
# No DB_HOST → uses SQLite
```

### Backend .env (production MySQL)
```
PORT=10000
NODE_ENV=production
USE_MYSQL=true
DB_HOST=containers-us-west-xyz.railway.app (from Railway MySQL)
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=railway
DB_PORT=3306
JWT_SECRET=random_32_chars_change_this
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend .env
```
VITE_API_URL=http://localhost:5000/api (local)
VITE_API_URL=https://your-backend.onrender.com/api (production)
```

---

## Troubleshooting

**Backend deploy fails on Render:**
- Check Logs tab → If "Cannot find module sqlite3" → It's okay, we use mysql2 in prod. Set USE_MYSQL=true
- If "MySQL connection failed" → Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT from Railway. Make sure MySQL service is running.

**Frontend can't login:**
- Check VITE_API_URL is correct backend /api URL
- Check Render backend FRONTEND_URL includes your Vercel URL (or * for testing)
- Check browser Console → Network tab → /api/auth/login should return 200 with token

**Images not showing:**
- Backend serves /uploads statically. Make sure uploads folder exists. On Render, uploads are ephemeral (deleted on redeploy) - for permanent, use Cloudinary or store in MySQL as base64 (future work).

**CORS error:**
- Backend cors origin = FRONTEND_URL. Set FRONTEND_URL to * temporarily to test, then set to exact Vercel URL.

---

## What to Put in Thesis Chapter 4 - Deployment Section

Write:

"The system was deployed using a three-tier architecture. The presentation tier (React + Vite) was deployed on Vercel, the application tier (Node.js + Express) on Render, and the data tier on Railway MySQL (relational database implementing Figure 3.9 ERD). Environment variables were configured for JWT_SECRET, DATABASE credentials, and FRONTEND_URL. The MySQL schema from backend/mysql_schema.sql was imported and seeded via npm run init-mysql creating admin and student accounts and 8 categories. The live application is accessible at https://your-frontend.vercel.app with API at https://your-backend.onrender.com/api/health, demonstrating successful deployment and satisfying NFR7 reliability and NFR8 scalability."

---

## Quick Commands Summary

```bash
# Push to GitHub
git add . && git commit -m "deploy" && git push

# Render auto-deploys on git push

# Vercel auto-deploys on git push

# Test live
curl https://your-backend.onrender.com/api/health
curl https://your-backend.onrender.com/api/categories
```

Need help with a specific step? Tell me which option (Render/Vercel or cPanel) and I'll walk you through that exact step with screenshots.
