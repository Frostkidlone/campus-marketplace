
# FIX REGISTRATION FAILED AFTER VERCEL + RENDER

## Why you saw Registration failed
Your screenshot shows generic error. On Render logs you likely have one of:

1. relation users_user does not exist
2. password validation error
3. CORS or VITE_API_URL wrong

## STEP BY STEP FIX (Do this now)

### BACKEND - RENDER
1. Go to Render Dashboard > Your Web Service
2. Settings:
   - Root Directory: backend
   - Build Command: ./build.sh
   - Start Command: gunicorn config.wsgi:application
   - Make build.sh executable: add `chmod +x build.sh` before in build command if needed
   Full Build Command: chmod +x build.sh && ./build.sh

3. Environment Variables (CRITICAL):
   SECRET_KEY = django-insecure-fupre-2026-final
   DEBUG = False
   ALLOWED_HOSTS = *
   DATABASE_URL = (auto added when you attach Postgres - DO NOT edit manually)
   CORS_ALLOWED_ORIGINS = https://YOUR-VERCEL-URL.vercel.app

4. Add Postgres: Render > New > Postgres > Create > Connect to your web service

5. Manual Migration (if build.sh didn't run):
   Go to Shell tab in Render web service:
   python manage.py migrate
   python manage.py shell
   >>> from apps.users.models import User
   >>> from apps.products.models import Category
   >>> User.objects.create_superuser(username='admin', email='admin@fupre.edu.ng', password='Admin@123', full_name='Admin')
   >>> for name, slug in [("Electronics","electronics"),("Books","books"),("Clothing","clothing"),("Furniture","furniture"),("Food Items","food"),("Accessories","accessories")]:
   ...     Category.objects.get_or_create(slug=slug, defaults={"name":name})
   >>> exit()

6. Check logs: Should see "Migrations applied" no error

### FRONTEND - VERCEL
1. Vercel Dashboard > Project > Settings > Environment Variables
   Add:
   VITE_API_URL = https://fupre-marketplace-api.onrender.com/api
   (replace with your actual render url, MUST end with /api, https)

2. Redeploy: Deployments > Redeploy

### TEST BACKEND DIRECTLY
Visit: https://your-backend.onrender.com/api/categories/
Should return JSON [] or categories, NOT 500

If you get 500, check Render logs - you forgot migrate.

### TEST REGISTRATION WITH POSTMAN
POST https://your-backend.onrender.com/api/auth/register/
{
  "full_name": "Patrick Guest",
  "username": "patrickguest1",
  "email": "patrick1@gmail.com",
  "phone_number": "08012345678",
  "matric_number": "COS/9982/2022",
  "department": "Computer Science",
  "password": "Student@2026Strong",
  "password_confirm": "Student@2026Strong"
}
Password must be 8+ chars, not too common.

If Postman works but Vercel fails: VITE_API_URL is wrong or CORS.

### FINAL CHECKLIST
- Render build.sh executed?
- DATABASE_URL exists?
- /api/categories/ returns 200?
- VITE_API_URL correct?
- Using strong password?

After this, registration will work.
