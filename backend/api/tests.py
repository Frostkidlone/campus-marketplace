from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Product, Message, Favorite

User = get_user_model()

PASSWORD = 'Str0ng-Pass-97'


class MarketplaceAPITestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(category_name='Electronics')
        self.student_a = User.objects.create_user(
            username='ada@test.com', email='ada@test.com', password=PASSWORD,
            first_name='Ada', last_name='Okoro', role='student',
        )
        self.student_b = User.objects.create_user(
            username='john@test.com', email='john@test.com', password=PASSWORD,
            first_name='John', last_name='Doe', role='student',
        )
        self.student_c = User.objects.create_user(
            username='david@test.com', email='david@test.com', password=PASSWORD,
            first_name='David', last_name='Efe', role='student',
        )
        self.admin = User.objects.create_user(
            username='admin@test.com', email='admin@test.com', password=PASSWORD,
            first_name='Admin', role='admin', is_staff=True,
        )
        self.product = Product.objects.create(
            seller=self.student_a, category=self.category,
            product_name='Used Scientific Calculator', price='6500.00',
            description='Barely used calculator.', condition_type='Like New',
            status='available', location='Hostel Block A',
        )

    def results(self, response):
        data = response.data
        if isinstance(data, dict) and 'results' in data:
            return data['results']
        return data

    # ---------- FR1: registration ----------
    def test_registration_forces_student_role(self):
        response = self.client.post('/api/users/', {
            'email': 'new@test.com', 'password': PASSWORD,
            'name': 'New Student', 'role': 'admin', 'is_staff': True,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='new@test.com')
        self.assertEqual(user.role, 'student')
        self.assertFalse(user.is_staff)
        self.assertEqual(user.username, 'new@test.com')

    def test_registration_requires_email(self):
        response = self.client.post('/api/users/', {
            'password': PASSWORD, 'name': 'No Email',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_registration_rejects_duplicate_email_case_insensitive(self):
        response = self.client.post('/api/users/', {
            'email': 'ADA@TEST.COM', 'password': PASSWORD, 'name': 'Copy Cat',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(User.objects.filter(email__iexact='ada@test.com').count(), 1)

    def test_registration_applies_password_validators(self):
        response = self.client.post('/api/users/', {
            'email': 'weak@test.com', 'password': '123456', 'name': 'Weak Pass',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    # ---------- FR2: authentication ----------
    def test_login_and_current_user(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'ada@test.com', 'password': PASSWORD,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        me = self.client.get('/api/users/me/')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['email'], 'ada@test.com')

    # ---------- FR3-FR5: product ownership ----------
    def test_product_creation_sets_seller_from_token(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.post('/api/products/', {
            'product_name': 'Mechanical Keyboard', 'price': '45000.00',
            'description': 'Blue switches.', 'category': self.category.id,
            'condition_type': 'Like New', 'location': 'Hostel Block B',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['seller']['id'], self.student_b.id)

    def test_product_price_must_be_positive(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.post('/api/products/', {
            'product_name': 'Invalid Price', 'price': '0.00',
            'description': 'Should fail.', 'category': self.category.id,
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('price', response.data)

    def test_other_student_cannot_edit_or_delete_listing(self):
        self.client.force_authenticate(self.student_b)
        patch = self.client.patch(f'/api/products/{self.product.id}/', {'price': '1.00'}, format='json')
        self.assertEqual(patch.status_code, status.HTTP_403_FORBIDDEN)
        delete = self.client.delete(f'/api/products/{self.product.id}/')
        self.assertEqual(delete.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Product.objects.filter(id=self.product.id).exists())

    def test_owner_can_edit_listing_and_status(self):
        self.client.force_authenticate(self.student_a)
        patch = self.client.patch(f'/api/products/{self.product.id}/', {'price': '7000.00'}, format='json')
        self.assertEqual(patch.status_code, status.HTTP_200_OK)
        status_response = self.client.patch(
            f'/api/products/{self.product.id}/status/', {'status': 'reserved'}, format='json'
        )
        self.assertEqual(status_response.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.status, 'reserved')

    def test_other_student_cannot_update_status(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.patch(
            f'/api/products/{self.product.id}/status/', {'status': 'sold'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_moderate_listing(self):
        self.client.force_authenticate(self.admin)
        response = self.client.delete(f'/api/products/{self.product.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists())

    # ---------- FR6-FR8: search, filter, detail ----------
    def test_public_search_and_filters(self):
        list_response = self.client.get('/api/products/?q=calculator')
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self.results(list_response)), 1)

        category_response = self.client.get(f'/api/products/?category={self.category.id}')
        self.assertEqual(len(self.results(category_response)), 1)

        price_response = self.client.get('/api/products/?min_price=7000')
        self.assertEqual(len(self.results(price_response)), 0)

    def test_product_detail_and_view_increment(self):
        detail = self.client.get(f'/api/products/{self.product.id}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)
        self.assertEqual(detail.data['id'], self.product.id)
        before = detail.data['views']
        increment = self.client.post(f'/api/products/{self.product.id}/increment_views/')
        self.assertEqual(increment.status_code, status.HTTP_200_OK)
        self.assertEqual(increment.data['views'], before + 1)

    # ---------- FR9: messaging privacy ----------
    def test_message_sender_is_derived_and_participants_can_read(self):
        self.client.force_authenticate(self.student_a)
        response = self.client.post('/api/messages/', {
            'receiver_id': self.student_b.id,
            'product_id': self.product.id,
            'message_text': 'Is this still available?',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['sender']['id'], self.student_a.id)
        message_id = response.data['id']

        self.client.force_authenticate(self.student_b)
        inbox = self.client.get('/api/messages/')
        self.assertEqual(len(self.results(inbox)), 1)
        detail = self.client.get(f'/api/messages/{message_id}/')
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_unrelated_student_cannot_read_messages(self):
        message = Message.objects.create(
            sender=self.student_a, receiver=self.student_b,
            product=self.product, message_text='Private conversation',
        )
        self.client.force_authenticate(self.student_c)
        inbox = self.client.get('/api/messages/')
        self.assertEqual(len(self.results(inbox)), 0)
        detail = self.client.get(f'/api/messages/{message.id}/')
        self.assertEqual(detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_messages_are_immutable(self):
        message = Message.objects.create(
            sender=self.student_a, receiver=self.student_b,
            message_text='Original',
        )
        self.client.force_authenticate(self.student_b)
        patch = self.client.patch(f'/api/messages/{message.id}/', {'message_text': 'Changed'}, format='json')
        self.assertEqual(patch.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        delete = self.client.delete(f'/api/messages/{message.id}/')
        self.assertEqual(delete.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_conversation_query_is_scoped(self):
        Message.objects.create(sender=self.student_a, receiver=self.student_b, message_text='A to B')
        Message.objects.create(sender=self.student_c, receiver=self.student_b, message_text='C to B')
        self.client.force_authenticate(self.student_b)
        response = self.client.get(f'/api/messages/?other_user={self.student_a.id}')
        messages = self.results(response)
        self.assertEqual(len(messages), 1)
        self.assertEqual(messages[0]['message_text'], 'A to B')

    def test_cannot_message_self(self):
        self.client.force_authenticate(self.student_a)
        response = self.client.post('/api/messages/', {
            'receiver_id': self.student_a.id,
            'message_text': 'Hello me',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------- FR10: administration ----------
    def test_student_cannot_list_users_or_view_admin_stats(self):
        self.client.force_authenticate(self.student_b)
        self.assertEqual(self.client.get('/api/users/').status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(self.client.get('/api/admin/stats/').status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users_and_view_stats(self):
        self.client.force_authenticate(self.admin)
        users = self.client.get('/api/users/')
        self.assertEqual(users.status_code, status.HTTP_200_OK)
        self.assertEqual(len(self.results(users)), 4)
        stats = self.client.get('/api/admin/stats/')
        self.assertEqual(stats.status_code, status.HTTP_200_OK)
        self.assertEqual(stats.data['users'], 4)
        self.assertEqual(stats.data['products'], 1)

    def test_admin_can_deactivate_user_but_student_cannot_change_own_status(self):
        self.client.force_authenticate(self.admin)
        response = self.client.patch(f'/api/users/{self.student_b.id}/', {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_b.refresh_from_db()
        self.assertFalse(self.student_b.is_active)

        self.client.force_authenticate(self.student_c)
        response = self.client.patch('/api/users/update_me/', {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_manage_categories(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.post('/api/categories/', {'category_name': 'Books'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_category_slug_is_generated(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post('/api/categories/', {'category_name': 'Lab Equipment'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['slug'], 'lab-equipment')

    def test_public_profile_hides_private_fields(self):
        response = self.client.get(f'/api/users/{self.student_a.id}/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('email', response.data)
        self.assertNotIn('matric_no', response.data)

    # ---------- Favorites (extra feature) ----------
    def test_favorite_create_list_and_idempotence(self):
        self.client.force_authenticate(self.student_b)
        first = self.client.post('/api/favorites/', {'product_id': self.product.id}, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = self.client.post('/api/favorites/', {'product_id': self.product.id}, format='json')
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Favorite.objects.filter(user=self.student_b).count(), 1)

        listing = self.client.get('/api/favorites/')
        self.assertEqual(listing.status_code, status.HTTP_200_OK)
        favorites = self.results(listing)
        self.assertEqual(len(favorites), 1)
        self.assertEqual(favorites[0]['product']['id'], self.product.id)

    def test_favorite_rejects_missing_product(self):
        self.client.force_authenticate(self.student_b)
        response = self.client.post('/api/favorites/', {'product_id': 99999}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------- FR11: persistence ----------
    def test_records_persist_after_write(self):
        before = Product.objects.count()
        self.client.force_authenticate(self.student_b)
        self.client.post('/api/products/', {
            'product_name': 'Persisted Item', 'price': '1500.00',
            'description': 'Stored in the database.', 'category': self.category.id,
        }, format='json')
        self.assertEqual(Product.objects.count(), before + 1)
        self.assertTrue(Product.objects.filter(product_name='Persisted Item').exists())
