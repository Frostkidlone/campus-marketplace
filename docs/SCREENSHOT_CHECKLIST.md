# Screenshot and Browser Acceptance Checklist

Use this while the application is running (`python manage.py runserver` and `npm run dev`). Every screenshot in Chapter 4 must come from this build, taken after `docs/verification-log.txt` was produced. Save files under `docs/screenshots/` with the names below.

## Before you start

1. Backend: `cd backend` → `venv\Scripts\activate` → `python manage.py migrate` → `python manage.py seed_marketplace` → `python manage.py runserver 8000`
2. Frontend: `cd frontend` → `npm run dev`
3. Open `http://localhost:5173`.
4. Keep the browser at 1280 px wide unless a step says otherwise. Use DevTools device mode for 375 px and 768 px.

## Screens

| # | File name | Steps | What the screenshot must show |
|---|---|---|---|
| 1 | `01-home.png` | Open `/` | Hero, real category counts, latest listings loaded from the API |
| 2 | `02-register.png` | Go to `/register`, fill a new account, submit | Success state; then sign in with the new account |
| 3 | `03-login-error.png` | Enter a wrong password | Visible inline error message (not a blank page) |
| 4 | `04-search-filters.png` | Go to `/products`, type a keyword, pick a category and price range | Filtered result grid and active filter controls |
| 5 | `05-product-detail.png` | Open any listing | Price, description, seller card, and "does not process payments" note |
| 6 | `06-create-listing.png` | Signed in, go to `/create-listing`, submit a listing | Success and the new listing visible in your dashboard |
| 7 | `07-dashboard.png` | Open `/dashboard` | Your listings with edit/status/delete actions |
| 8 | `08-edit-listing.png` | Edit a listing and change status to `reserved` | Updated badge visible on the listing |
| 9 | `09-messages.png` | From another account, contact the seller and send a message; reply from the seller | Thread showing both sides of the conversation |
| 10 | `10-admin-dashboard.png` | Sign in as `admin@fupre.edu.ng`, open `/admin` | Real totals plus user and listing management tables |
| 11 | `11-admin-deactivate.png` | Deactivate a student account | Status flips to inactive in the table |
| 12 | `12-mobile-375.png` | DevTools 375 px wide on `/products` | Menu button, stacked cards, no horizontal scrolling |
| 13 | `13-tablet-768.png` | DevTools 768 px wide on `/` | Grid reflows without overlap |
| 14 | `14-desktop-1280.png` | 1280 px on `/products` | Full grid layout |
| 15 | `15-protected-redirect.png` | Sign out, open `/dashboard` | Redirected to login |
| 16 | `16-favorites.png` | Signed in, save a listing, open `/favorites` | Saved listing appears; remove it and it disappears |

## Record observed results

Do not write "passed" for a row you did not perform. In the Chapter 4 table, use the actual outcome — including any failure — and describe what the screen showed. If something fails, note it and fix it before submission where possible.

## Scope statements that must appear in the report

- Messaging is REST request/response, not real-time.
- No online payment is processed; buyer and seller arrange the exchange themselves.
- Registration accepts any valid email; there is no institutional student verification.
- Local verification used SQLite unless `/api/health/` reported PostgreSQL.
