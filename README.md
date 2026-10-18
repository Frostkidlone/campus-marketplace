# FUPRE Campus Marketplace

A web-based marketplace for campus students. Students register, publish listings, search and filter products, message buyers/sellers privately, and manage their own listings. Administrators manage accounts and moderate listings.

**Stack:** React 18 + Vite 5 + Tailwind CSS 3 (frontend) · Django 4.2 + Django REST Framework + SimpleJWT (backend) · PostgreSQL (production/configured) or SQLite (local fallback).

> Scope: the platform helps students discover each other and arrange an exchange. It does **not** process payments and does **not** claim to verify institutional student status.

---

## Repository layout

```
backend/
  config/                 Django settings and root URLs
  api/                    Models, serializers, views, tests
    management/commands/seed_marketplace.py
  manage.py
frontend/
  src/
    api/axios.js          API client, token refresh, error helper
    context/AuthContext.jsx
    components/           Navbar, ProtectedRoute, ProductCard, ProductImage
    pages/                Home, Search, ProductDetail, Login, Register,
                          Dashboard, CreateListing, Messages, Favorites,
                          Profile, AdminDashboard
docs/                     Audit notes and verification evidence
README.md
```

---

## Local setup

### Prerequisites

- Python 3.10–3.12 (Django 4.2 does not officially support 3.13+; use 3.12 on this machine)
- Node.js 18 or newer
- npm

### Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env        # Windows; use `cp` on macOS/Linux
python manage.py migrate
python manage.py seed_marketplace
python manage.py runserver 8000
```

`backend/.env` is read automatically by `python-dotenv`.

Minimal local `.env`:

```env
DEBUG=True
DJANGO_SECRET_KEY=dev-only-change-me
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:8000
SECURE_SSL_REDIRECT=False
```

### PostgreSQL (optional but supported)

Set `DATABASE_URL` before running migrations:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DBNAME
# Local PostgreSQL usually has no SSL. Defaults to False when DEBUG=True.
DB_SSL=False
```

If `DATABASE_URL` is absent, the project uses `backend/db.sqlite3`. Check which engine is active at `GET /api/health/`.

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Optional `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Vite reads this at build time, so rebuild after changing it.

---

## Seeded demo accounts

Created by `python manage.py seed_marketplace` (test data only):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@fupre.edu.ng` | `admin123` |
| Student | `john@fupre.edu.ng` | `student123` |
| Student | `ada.okoro@fupre.edu.ng` | `student123` |
| Student | `david.efe@fupre.edu.ng` | `student123` |

The seeder is non-destructive: it uses `get_or_create` and only deletes products/messages when `--reset` is passed explicitly.

```bash
python manage.py seed_marketplace --reset
```

New registrations always receive the `student` role. Administrator accounts must be created with `createsuperuser` or promoted deliberately in Django admin.

---

## API summary (all under `/api/`)

| Method & path | Auth | Purpose |
|---|---|---|
| `POST /users/` | public | Register (role forced to student) |
| `GET /users/me/` | any authenticated | Current user |
| `PATCH /users/update_me/` | any authenticated | Edit own profile; role/status fields rejected |
| `GET /users/{id}/public/` | public | Seller card without email or matric number |
| `GET /users/` | admin | List users |
| `PATCH /users/{id}/` | admin | Activate/deactivate an account |
| `POST /auth/login/` | public | JWT login (`username` = email) |
| `POST /auth/refresh/` | public | Refresh access token |
| `GET /categories/` | public | Categories with product counts |
| `POST /categories/` | admin | Create category (slug auto-generated) |
| `GET /products/` | public | List/search/filter listings |
| `POST /products/` | authenticated | Create listing (seller from token) |
| `GET /products/{id}/` | public | Listing details |
| `PATCH/DELETE /products/{id}/` | owner or admin | Edit/delete listing |
| `PATCH /products/{id}/status/` | owner or admin | Change availability |
| `POST /products/{id}/increment_views/` | public | Count a detail view |
| `GET/POST /messages/` | authenticated | Own messages / send message |
| `GET /messages/{id}/` | participant | Read one message |
| `POST /messages/mark-read/` | authenticated | Mark conversation messages read |
| `GET /messages/conversations/` | authenticated | Conversation summaries |
| `GET/POST/DELETE /favorites/` | authenticated | Saved listings |
| `GET /stats/` | public | Home-page aggregate counts |
| `GET /admin/stats/` | admin | System-wide totals |
| `GET /health/` | public | Active database engine |

Search/filter query parameters on `GET /products/`: `q`, `category`, `status`, `condition`, `min_price`, `max_price`, `seller_id`. Results are paginated at 20 per page.

---

## Functional requirements traceability

| FR | Requirement | Implementation | Verification |
|---|---|---|---|
| FR1 | Register with validated details | `POST /api/users/`, `UserRegistrationSerializer`; duplicate email, password validators, forced student role | Automated tests pass |
| FR2 | Login/logout, protected pages, current user | SimpleJWT login/refresh, `ProtectedRoute`, `/users/me/` | API login/me pass; browser logout/protected-page check pending |
| FR3 | Create listing when authenticated | `POST /api/products/`, seller derived from token | Automated tests pass |
| FR4 | Edit only own listings | Ownership checks in `perform_update` / `perform_destroy` | Automated tests pass |
| FR5 | Update own listing status | `PATCH /api/products/{id}/status/` | Automated tests pass |
| FR6 | Keyword search on title/description | `?q=` filter | Automated tests pass |
| FR7 | Filter by category/status/condition/price | Query filters in `ProductViewSet.get_queryset` | Category/price automated; status/condition browser check pending |
| FR8 | Product details | `GET /api/products/{id}/` and detail page | API detail/view counter pass; browser check pending |
| FR9 | Private buyer–seller messaging | Scoped querysets, participant checks, sender from token | Automated tests pass; browser flow pending |
| FR10 | Admin user management + listing moderation | Admin-only user endpoints, `/admin/stats/`, listing delete | Automated tests pass; browser check pending |
| FR11 | Persistence | Django ORM over PostgreSQL/SQLite | Automated test passes against the configured database |

The `Verification` column records what was actually executed on 2026-10-18. See `docs/FINAL_AUDIT.md` and `docs/verification-log.txt` for the full output. Browser checks remain open.

---

## Tests and checks

Backend:

```bash
cd backend
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate
python manage.py seed_marketplace
python manage.py test api.tests -v 2
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

The automated suite in `backend/api/tests.py` covers registration, authentication, listing ownership, search/filter, messaging privacy, admin permissions, favorites, and persistence after a write.

### Manual acceptance checklist

1. Register a new account; confirm it is a student and can sign in.
2. Log in as the admin; confirm `/admin` loads real totals.
3. Create a listing, edit it, change its status, delete it.
4. Sign in as a second student and confirm the first student's listing cannot be edited or deleted.
5. Search by keyword and apply category/status/condition/price filters.
6. Open a listing and confirm the view counter increases once per browser session.
7. Save and remove a favorite.
8. Message a seller; confirm a third student cannot see the thread.
9. As admin, deactivate a user and delete a listing.
10. Check the layout at 375 px, 768 px, and 1280 px widths.

---

## Known limitations

- Messaging is request/response REST, not real-time. The UI does not claim WebSockets.
- No online payments. Buyers and sellers arrange the exchange themselves.
- No institutional verification. Any valid email address can register.
- Uploaded images are stored on local media storage unless external object storage is configured.
- List pages request the first page (20 items); pagination controls are not yet exposed in the UI.
- `TransactionRecord` exists in the API and schema but has no user interface and should not be presented as a completed feature in the report.

---

## Deployment notes

Backend (Render or similar):

- Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
- Start: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
- Environment: `DEBUG=False`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DATABASE_URL`

Frontend (Vercel or similar):

- Build: `npm install && npm run build`
- Output: `dist`
- Environment: `VITE_API_URL=https://your-backend.example/api`

Never expose the Django secret key through a `VITE_*` variable.

---

## Evidence policy

Chapter 4 tables must contain observed results. Run the commands above, keep the terminal output, and record the actual pass/fail values in `docs/FINAL_AUDIT.md`. Do not describe a test as passed, and do not claim PostgreSQL or deployment success, unless the corresponding command was actually run.
