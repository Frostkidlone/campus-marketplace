
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Category, Product, Message
from decimal import Decimal

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed marketplace with demo data. Safe to run repeatedly; use --reset to rebuild seeded products/messages.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all products and messages before reseeding. Destructive; opt-in only.',
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)
        self.stdout.write("Seeding categories...")
        categories_data = [
            {"category_name": "Textbooks", "slug": "textbooks", "icon": "📚", "description": "Academic textbooks"},
            {"category_name": "Electronics", "slug": "electronics", "icon": "💻", "description": "Electronics and gadgets"},
            {"category_name": "Furniture", "slug": "furniture", "icon": "🪑", "description": "Hostel furniture"},
            {"category_name": "Lab Equipment", "slug": "lab-equipment", "icon": "🔬", "description": "Laboratory equipment"},
            {"category_name": "Clothing", "slug": "clothing", "icon": "👕", "description": "Clothing and lab coats"},
            {"category_name": "Stationery", "slug": "stationery", "icon": "📝", "description": "Stationery and notebooks"},
            {"category_name": "Tools", "slug": "tools", "icon": "🔧", "description": "Engineering tools"},
            {"category_name": "Accessories", "slug": "accessories", "icon": "🎧", "description": "Accessories"},
        ]
        for cat_data in categories_data:
            Category.objects.get_or_create(category_name=cat_data['category_name'], defaults=cat_data)
        
        # Create demo users per Fig 4.3
        self.stdout.write("Seeding users per Fig 4.3...")
        users_data = [
            {"username": "admin@fupre.edu.ng", "email": "admin@fupre.edu.ng", "password": "admin123", "role": "admin", "is_staff": True, "first_name": "Admin", "last_name": "User", "matric_no": "FUPRE/ADMIN/001", "department": "Computer Science"},
            {"username": "john@fupre.edu.ng", "email": "john@fupre.edu.ng", "password": "student123", "role": "student", "first_name": "John", "last_name": "Doe", "matric_no": "FUPRE/CS/2020/001", "department": "Computer Science"},
            {"username": "ada.okoro@fupre.edu.ng", "email": "ada.okoro@fupre.edu.ng", "password": "student123", "role": "student", "first_name": "Ada", "last_name": "Okoro", "matric_no": "FUPRE/CS/2020/002", "department": "Petroleum Engineering"},
            {"username": "david.efe@fupre.edu.ng", "email": "david.efe@fupre.edu.ng", "password": "student123", "role": "student", "first_name": "David", "last_name": "Efe", "matric_no": "FUPRE/ME/2020/003", "department": "Mechanical Engineering"},
            {"username": "chidi.loku@fupre.edu.ng", "email": "chidi.loku@fupre.edu.ng", "password": "student123", "role": "student", "first_name": "Chidi", "last_name": "Loku", "matric_no": "FUPRE/CS/2020/004", "department": "Computer Science"},
        ]
        created_users = {}
        for u_data in users_data:
            data = dict(u_data)
            pwd = data.pop('password')
            email = data['email']
            data.pop('username', None)
            user, created = User.objects.get_or_create(
                username=email,
                defaults=data,
            )
            if created:
                user.set_password(pwd)
                user.save()
                self.stdout.write(f"Created {email}")
            created_users[email] = user

        # Create products matching the demo catalogue
        self.stdout.write("Seeding demo products...")
        if reset:
            Product.objects.all().delete()
            Message.objects.all().delete()
            self.stdout.write(self.style.WARNING("Reset: deleted existing products and messages."))
        
        john = created_users.get('john@fupre.edu.ng') or User.objects.first()
        ada = created_users.get('ada.okoro@fupre.edu.ng') or john
        david = created_users.get('david.efe@fupre.edu.ng') or john
        chidi = created_users.get('chidi.loku@fupre.edu.ng') or john
        
        cat_map = {c.category_name: c for c in Category.objects.all()}
        
        products_data = [
            # Fig 4.5 - 4 cards
            {"product_name": "Used Scientific Calculator - Casio fx-991ES Plus", "price": Decimal("6500.00"), "condition_type": "Like New", "status": "available", "location": "Hostel Block A", "views": 128, "seller": john, "category": cat_map.get("Electronics"), "description": "Barely used scientific calculator, perfect for engineering calculations."},
            {"product_name": "Engineering Mathematics Textbook", "price": Decimal("3200.00"), "condition_type": "Good", "status": "reserved", "location": "Campus", "views": 64, "seller": ada, "category": cat_map.get("Textbooks"), "description": "Engineering Maths textbook, 3rd edition."},
            {"product_name": "Portable Study Desk", "price": Decimal("12000.00"), "condition_type": "Fair", "status": "sold", "location": "Campus", "views": 203, "seller": david, "category": cat_map.get("Furniture"), "description": "Foldable study desk, suitable for hostel."},
            {"product_name": "Lab Coat Size M", "price": Decimal("4800.00"), "condition_type": "New", "status": "available", "location": "Campus", "views": 42, "seller": chidi, "category": cat_map.get("Clothing"), "description": "New lab coat, size M, never used."},
            # Fig 4.6 - 6 cards
            {"product_name": "Digital Vernier Caliper 150mm", "price": Decimal("25000.00"), "condition_type": "Like New", "status": "available", "location": "Engineering Lab", "views": 89, "seller": john, "category": cat_map.get("Tools"), "description": "150mm digital vernier caliper, accurate measurement."},
            {"product_name": "Wireless Headphones - Noise Cancelling", "price": Decimal("120000.00"), "condition_type": "New", "status": "available", "location": "Hostel Block B", "views": 156, "seller": ada, "category": cat_map.get("Electronics"), "description": "High-quality wireless headphones with noise cancellation."},
            {"product_name": "Ergonomic Office Chair", "price": Decimal("65500.00"), "condition_type": "Good", "status": "available", "location": "Campus", "views": 78, "seller": david, "category": cat_map.get("Furniture"), "description": "Ergonomic chair, comfortable for long study sessions."},
            {"product_name": "A5 Notebook Pack (5 pcs)", "price": Decimal("3200.00"), "condition_type": "New", "status": "available", "location": "Campus", "views": 34, "seller": chidi, "category": cat_map.get("Stationery"), "description": "Pack of 5 A5 notebooks, 100 pages each."},
            {"product_name": "Mechanical Keyboard Blue Switch", "price": Decimal("45000.00"), "condition_type": "Like New", "status": "available", "location": "Hostel Block A", "views": 112, "seller": john, "category": cat_map.get("Electronics"), "description": "Mechanical keyboard with blue switches, RGB lighting."},
            {"product_name": "Safety Goggles Anti Fog", "price": Decimal("7500.00"), "condition_type": "New", "status": "available", "location": "Lab", "views": 67, "seller": ada, "category": cat_map.get("Lab Equipment"), "description": "Anti-fog safety goggles for lab work. Fig 4.9 reference."},
            {"product_name": "Safety Helmet - Engineering", "price": Decimal("8500.00"), "condition_type": "Good", "status": "available", "location": "Engineering Block", "views": 45, "seller": david, "category": cat_map.get("Lab Equipment"), "description": "Safety helmet for site visits. Fig 4.9 David Efe reference."},
            {"product_name": "Scientific Calculator - Extra", "price": Decimal("7000.00"), "condition_type": "Good", "status": "available", "location": "Campus", "views": 23, "seller": chidi, "category": cat_map.get("Electronics"), "description": "Additional calculator for backup."},
        ]
        
        created_products = 0
        for p_data in products_data:
            data = dict(p_data)
            seller = data.pop('seller')
            product_name = data.pop('product_name')
            _, created = Product.objects.get_or_create(
                product_name=product_name,
                seller=seller,
                defaults=data,
            )
            created_products += int(created)

        # Seed messages matching the demo conversations
        self.stdout.write("Seeding demo messages...")
        goggles = Product.objects.filter(product_name__icontains="Goggles").first()
        helmet = Product.objects.filter(product_name__icontains="Helmet").first()
        
        if goggles and ada and john:
            Message.objects.get_or_create(sender=john, receiver=ada, product=goggles, message_text="Hi, is the FUPRE Lab Goggles still available?")
            Message.objects.get_or_create(sender=ada, receiver=john, product=goggles, message_text="Yes, it's still available. Are you interested?")
            Message.objects.get_or_create(sender=john, receiver=ada, product=goggles, message_text="Sounds good, I can meet you at the campus gate by 4pm tomorrow.")

        if helmet and david and john:
            Message.objects.get_or_create(sender=john, receiver=david, product=helmet, message_text="Hi David, is the Safety Helmet still available?")
            Message.objects.get_or_create(sender=david, receiver=john, product=helmet, message_text="Yes it is. We can meet at Engineering Block.")

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {Category.objects.count()} categories, {User.objects.count()} users, "
            f"{Product.objects.count()} products ({created_products} new), {Message.objects.count()} messages"
        ))
