#!/usr/bin/env bash
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate --no-input
python manage.py shell << END
from apps.users.models import User
from apps.products.models import Category
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(username='admin', email='admin@fupre.edu.ng', password='Admin@123', full_name='Admin User')
    print("Admin created: admin / Admin@123")
cats = [
    ("Electronics", "electronics", "Phones, laptops, gadgets"),
    ("Books", "books", "Textbooks, lecture materials"),
    ("Clothing", "clothing", "Wears, shoes, accessories"),
    ("Furniture", "furniture", "Chairs, tables, hostel items"),
    ("Food Items", "food", "Food stuff and provisions"),
    ("Accessories", "accessories", "Bags, jewelry, other"),
    ("Accommodation", "accommodation", "Hostel and lodge listings"),
    ("Services", "services", "Tutoring, printing, etc"),
]
for name, slug, desc in cats:
    Category.objects.get_or_create(slug=slug, defaults={"name": name, "description": desc})
print("Categories seeded")
END
echo "Build done"
