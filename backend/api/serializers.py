
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Category, Product, Message, Favorite, TransactionRecord

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_staff', 'matric_no', 'department', 'avatar', 'is_active', 'date_joined']
        read_only_fields = ['id', 'username', 'date_joined', 'role', 'is_staff']

    def validate_email(self, value):
        value = value.lower().strip()
        qs = User.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def update(self, instance, validated_data):
        # Login uses the email as username, so keep them in sync on profile edits.
        email = validated_data.get('email')
        if email and email.lower() != (instance.email or '').lower():
            validated_data['username'] = email
        return super().update(instance, validated_data)

class PublicUserSerializer(serializers.ModelSerializer):
    """Limited seller profile safe to expose to any visitor."""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'department', 'avatar']

class UserRegistrationSerializer(serializers.ModelSerializer):
    # FIXED per audit: role field removed from public registration - no privilege escalation
    # Accepts full_name or first_name/last_name, email, password, matric_no, department
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)  # alias for frontend compat

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'full_name', 'name', 'matric_no', 'department']
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_email(self, value):
        # Allow any valid email domain per correction - FUPRE has no official student domain
        # Normalize to lowercase and keep accounts unambiguous at login time
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        # Map name/full_name to first_name/last_name for frontend compat
        name_val = attrs.get('full_name') or attrs.get('name')
        if name_val and not attrs.get('first_name'):
            parts = name_val.strip().split(' ', 1)
            attrs['first_name'] = parts[0]
            attrs['last_name'] = parts[1] if len(parts) > 1 else ''
        email = attrs.get('email')
        if not email:
            raise serializers.ValidationError({'email': 'Email is required.'})
        # The frontend logs in with email as the username, so keep them identical.
        attrs['username'] = email
        if len(email) > User._meta.get_field('username').max_length:
            raise serializers.ValidationError({'email': 'Email is too long to use as a username.'})
        password = attrs.get('password')
        if password:
            try:
                # Run Django's configured validators (length, common, numeric, similarity)
                validate_password(password, user=User(
                    username=email,
                    email=email,
                    first_name=attrs.get('first_name', ''),
                    last_name=attrs.get('last_name', ''),
                ))
            except DjangoValidationError as exc:
                raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        # Remove aliases
        validated_data.pop('full_name', None)
        validated_data.pop('name', None)
        password = validated_data.pop('password')
        # SECURITY: Force role=student server-side, ignore any client-supplied role
        validated_data['role'] = 'student'
        # Ensure username
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email']
        user = User(**validated_data)
        user.set_password(password)  # Django PBKDF2, not bcrypt unless configured - per audit
        user.save()
        return user

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    class Meta:
        model = Category
        fields = ['id', 'category_name', 'slug', 'description', 'icon', 'product_count', 'created_at']

    def get_product_count(self, obj):
        # Works for annotated querysets (list) and freshly created instances.
        return getattr(obj, 'product_count', obj.products.count())

class ProductSerializer(serializers.ModelSerializer):
    seller = PublicUserSerializer(read_only=True)
    category_name = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id', 'seller', 'category', 'category_name', 'product_name', 'price', 'description', 'image', 'images', 'condition_type', 'status', 'location', 'views', 'created_at', 'updated_at']
        read_only_fields = ['id', 'views', 'created_at', 'updated_at', 'seller']

    def get_category_name(self, obj):
        return obj.category.category_name if obj.category else ''

    def validate_product_name(self, value):
        value = value.strip()
        if len(value) < 3:
            raise serializers.ValidationError("Product name must be at least 3 characters.")
        return value

    def validate_price(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Description is required.")
        return value.strip()

    def validate_image(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image must be smaller than 5MB.")
        return value

    def validate_images(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Images must be a list of image URLs.")
        return value

class MessageSerializer(serializers.ModelSerializer):
    sender = PublicUserSerializer(read_only=True)
    receiver = PublicUserSerializer(read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    receiver_name = serializers.CharField(source='receiver.username', read_only=True)
    # FIXED: receiver validation - accept receiver_id
    receiver_id = serializers.IntegerField(write_only=True, required=True)
    product_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'receiver_id', 'product', 'product_id', 'sender_name', 'receiver_name', 'message_text', 'is_read', 'created_at']
        read_only_fields = ['id', 'sender', 'receiver', 'is_read', 'created_at']
    
    def validate_receiver_id(self, value):
        # Validate receiver exists and is not self
        request = self.context.get('request')
        if request and request.user.id == value:
            raise serializers.ValidationError("Cannot send message to yourself.")
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Receiver does not exist.")
        return value
    
    def validate_product_id(self, value):
        if value is None:
            return None
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        # Prevent buyer == seller messaging to self via product
        if 'product' in attrs and attrs['product']:
            if request and attrs['product'].seller_id == request.user.id:
                # Allow seller to message buyer, but validate receiver is not seller themselves already handled
                pass
        return attrs

class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'product', 'product_id', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value).exists():
            raise serializers.ValidationError("Product does not exist.")
        return value

    def create(self, validated_data):
        # FIXED: product_id must be mapped to product; repeated favourites are idempotent.
        product_id = validated_data.pop('product_id')
        user = validated_data.pop('user')
        favorite, _ = Favorite.objects.get_or_create(user=user, product_id=product_id)
        return favorite

class TransactionRecordSerializer(serializers.ModelSerializer):
    # FIXED per audit: buyer/seller read-only, derived server-side
    buyer = UserSerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    
    class Meta:
        model = TransactionRecord
        fields = ['id', 'buyer', 'seller', 'product', 'status', 'meeting_location', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'buyer', 'seller', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        request = self.context.get('request')
        product = attrs.get('product')
        if not product:
            raise serializers.ValidationError("Product is required.")
        if product.status != 'available':
            raise serializers.ValidationError("Product is not available for transaction.")
        if request and product.seller_id == request.user.id:
            raise serializers.ValidationError("Cannot create transaction for your own product.")
        return attrs
