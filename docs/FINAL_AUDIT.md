# Final Audit — FUPRE Campus Marketplace

**Date of automated run:** 2026-10-18
**Environment:** Windows 11; Python 3.12.10 in `backend/venv` (the PATH default is Python 3.14.8, which Django 4.2 does not support); Node 20.20.2; npm 10.8.2.
**Full log:** `docs/verification-log.txt`

---

## 1. Automated checks — observed results

| Check | Command | Observed result | Status |
|---|---|---|---|
| Django system check | `python manage.py check` | `System check identified no issues (0 silenced).` | PASS |
| Migration drift | `python manage.py makemigrations --check --dry-run` | `No changes detected` | PASS |
| Apply migrations | `python manage.py migrate` | `api.0002_alter_user_groups_alter_user_username ... OK` | PASS |
| Seed data | `python manage.py seed_marketplace` | `Seeded 8 categories, 5 users, 12 products (0 new), 5 messages` | PASS |
| Backend test suite | `python manage.py test api.tests -v 2` | `Ran 27 tests in 42.459s` — `OK` | PASS |
| Frontend install | `npm install` (in `frontend/`) | `added 159 packages` — 11 audit vulnerabilities reported | PASS |
| Frontend production build | `npm run build` | `vite v5.4.21`, 1545 modules, `dist/index-*.js` 300.05 kB | PASS |

Two warnings were produced and are not failures:

- WhiteNoise warned that `backend/staticfiles/` does not exist. It is created by `collectstatic` during deployment.
- DRF warned that the user list was unordered. `UserViewSet` now orders by `-date_joined`.

`npm install` reports 11 dependency advisories (5 moderate, 6 high) from the frontend toolchain. This was not remediated with `npm audit fix --force` because that can introduce breaking upgrades; it must not be described as a “zero-vulnerability” build.

---

## 2. Database evidence

| Item | Value |
|---|---|
| Configured engine | **SQLite fallback** — `backend/db.sqlite3`; no `DATABASE_URL` is set |
| PostgreSQL server version | Not tested — no PostgreSQL connection string supplied |
| Database name | `db.sqlite3` |
| Evidence tables created | `migrate` applied contenttypes, auth, api, admin, sessions migrations successfully |

Chapter 4 must therefore say the local verification used SQLite. Do not claim PostgreSQL was tested until `/api/health/` returns `PostgreSQL` in an environment with `DATABASE_URL` configured.

---

## 3. Functional requirement results

Automated API tests exercise the server-side behaviour of every FR. “PASS” below means the named test passed in the run above. Browser-level checks are still NOT RUN.

| FR | Test performed | Observed | Status |
|---|---|---|---|
| FR1 | Register with valid details | `test_registration_forces_student_role` — 201, role `student` | PASS |
| FR1 | Register without email | `test_registration_requires_email` — 400 | PASS |
| FR1 | Duplicate email (different case) | `test_registration_rejects_duplicate_email_case_insensitive` — 400, one record | PASS |
| FR1 | Weak password | `test_registration_applies_password_validators` — 400 | PASS |
| FR1 | Client sends `role=admin`, `is_staff=true` | Role remained `student`, `is_staff` false | PASS |
| FR2 | Login with correct credentials | `test_login_and_current_user` — access + refresh returned | PASS |
| FR2 | Load `/users/me/` | Current user returned | PASS |
| FR2 | Logout / protected-page redirect | Not automated; browser check pending | NOT RUN |
| FR3 | Create listing while logged in | `test_product_creation_sets_seller_from_token` — seller from token | PASS |
| FR3 | Price must be positive | `test_product_price_must_be_positive` — 400 | PASS |
| FR4 | Edit own listing | `test_owner_can_edit_listing_and_status` — 200 | PASS |
| FR4 | Edit/delete another student's listing | `test_other_student_cannot_edit_or_delete_listing` — 403, record intact | PASS |
| FR5 | Change own status | `test_owner_can_edit_listing_and_status` — `reserved` persisted | PASS |
| FR5 | Change another student's status | `test_other_student_cannot_update_status` — 403 | PASS |
| FR6 | Keyword search `?q=calculator` | `test_public_search_and_filters` — 1 match | PASS |
| FR7 | Category and price filters | `test_public_search_and_filters` — expected subsets | PASS |
| FR7 | Status/condition filters | Implemented; not separately automated | PARTIAL |
| FR8 | Product detail | `test_product_detail_and_view_increment` — 200 | PASS |
| FR8 | View counter | Increment returned `before + 1` | PASS |
| FR9 | Send message | `test_message_sender_is_derived_and_participants_can_read` — 201, sender from token | PASS |
| FR9 | Participant can read | Receiver inbox and detail returned the message | PASS |
| FR9 | Unrelated student cannot read | `test_unrelated_student_cannot_read_messages` — empty inbox, 404 detail | PASS |
| FR9 | Messages are immutable | `test_messages_are_immutable` — PATCH/DELETE 405 | PASS |
| FR9 | Conversation scoping | `test_conversation_query_is_scoped` — only the requested thread | PASS |
| FR9 | Self-message rejected | `test_cannot_message_self` — 400 | PASS |
| FR10 | Student denied user list and admin stats | `test_student_cannot_list_users_or_view_admin_stats` — 403 | PASS |
| FR10 | Admin user list and real totals | `test_admin_can_list_users_and_view_stats` — 200, 4 users, 1 product | PASS |
| FR10 | Admin deactivates user; student cannot self-activate change | `test_admin_can_deactivate_user_but_student_cannot_change_own_status` — 200 / 403 | PASS |
| FR10 | Student cannot manage categories | `test_student_cannot_manage_categories` — 403 | PASS |
| FR10 | Admin deletes listing | `test_admin_can_moderate_listing` — 204, record gone | PASS |
| FR11 | Record persists after write | `test_records_persist_after_write` — count +1 | PASS |
| Extra | Category slug generation | `test_category_slug_is_generated` — `lab-equipment` | PASS |
| Extra | Public seller profile privacy | `test_public_profile_hides_private_fields` — no email/matric | PASS |
| Extra | Favorites create/list/idempotence | `test_favorite_create_list_and_idempotence` — one record | PASS |
| Extra | Favorite rejects missing product | `test_favorite_rejects_missing_product` — 400 | PASS |

---

## 4. Browser checks — NOT RUN

The Vite production build succeeds, but no browser session has been exercised. These rows must stay open until performed.

| Check | Viewports | Observed | Status |
|---|---|---|---|
| Navbar collapses into a working mobile menu | 375 px | — | NOT RUN |
| Listing grid reflows without horizontal scroll | 375 / 768 / 1280 px | — | NOT RUN |
| Forms usable with touch-sized controls | 375 px | — | NOT RUN |
| Empty states show when there are no results | desktop | — | NOT RUN |
| Error message appears for wrong login | desktop | — | NOT RUN |
| Register → login → dashboard flow | desktop | — | NOT RUN |
| Create/edit/status/delete listing through the UI | desktop | — | NOT RUN |
| Contact seller → send/receive message | desktop | — | NOT RUN |
| Admin activate/deactivate and listing deletion | desktop | — | NOT RUN |

Take screenshots from the running application only. Do not reuse screenshots from another build.

---

## 5. Claims checklist

Before the report is submitted, confirm the document does **not** state any of the following unless it is literally true on the submitted build:

- [ ] "Real-time messaging" — the implementation is REST request/response.
- [ ] "Verified FUPRE students" — there is no institutional verification.
- [ ] "Secure payment" / "online payment" — payments are out of scope.
- [ ] "PostgreSQL" — only if `DATABASE_URL` was configured and `/api/health/` reported PostgreSQL. The observed run used SQLite.
- [ ] "All tests passed" — the 27 automated API tests passed; the browser checklist has not been run and must not be described as passed.
- [ ] "Deployed successfully" — no deployment was performed.
- [ ] A functional-test table with anticipated rather than observed results.

---

## 6. Known open items

1. Browser/UI acceptance checklist not run.
2. PostgreSQL not exercised; no `DATABASE_URL` supplied.
3. No genuine screenshots of this build exist yet.
4. `npm install` reports 11 dependency advisories in the toolchain.
5. List pages show the first 20 records only; pagination controls are absent from the UI.
6. `TransactionRecord` has no UI and must not be described as a completed user-facing feature.
