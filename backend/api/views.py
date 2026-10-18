
from rest_framework import viewsets, permissions, status, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Count, Q
from django.contrib.auth import get_user_model
from .models import Category, Product, Message, Favorite, TransactionRecord
from .serializers import (
    UserSerializer, PublicUserSerializer, UserRegistrationSerializer, CategorySerializer,
    ProductSerializer, MessageSerializer, FavoriteSerializer, TransactionRecordSerializer
)

User = get_user_model()

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'role', None) == 'admin')

class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or getattr(request.user, 'role', None) == 'admin':
            return True
        if hasattr(obj, 'seller'):
            return obj.seller == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class UserViewSet(viewsets.ModelViewSet):
    # Explicit ordering keeps pagination deterministic for the admin list.
    queryset = User.objects.all().order_by('-date_joined')
    
    def get_permissions(self):
        # FIXED per audit: public registration only, all other user actions require admin
        # Prevents authenticated student from listing/updating/deleting other users
        if self.action == 'create':
            return [AllowAny()]
        if self.action == 'public_profile':
            return [AllowAny()]
        if self.action in ['me', 'update_me']:
            return [IsAuthenticated()]
        # All other actions (list, retrieve, update, destroy) require admin
        return [IsAdmin()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserRegistrationSerializer
        if self.action == 'public_profile':
            return PublicUserSerializer
        return UserSerializer

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        # Safe self-service endpoint for ordinary users per audit
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['patch', 'put'], permission_classes=[IsAuthenticated])
    def update_me(self, request):
        # Allow students to update only their own profile, never permissions or status
        forbidden = {'role', 'is_staff', 'is_superuser', 'is_active'}
        if forbidden.intersection(request.data.keys()):
            return Response({"error": "Cannot update role, staff, superuser, or active status."}, status=status.HTTP_403_FORBIDDEN)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[AllowAny], url_path='public')
    def public_profile(self, request, pk=None):
        # Public seller card: never exposes email, matric number, or account status
        user = self.get_object()
        return Response(PublicUserSerializer(user).data)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(product_count=Count('products'))
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdmin()]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('seller', 'category').all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q') or self.request.query_params.get('search')
        if q:
            qs = qs.filter(Q(product_name__icontains=q) | Q(description__icontains=q))
        category = self.request.query_params.get('category')
        if category and category != 'All' and category != 'all':
            if category.isdigit():
                qs = qs.filter(category_id=category)
            else:
                qs = qs.filter(category__category_name__icontains=category)
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        condition = self.request.query_params.get('condition')
        if condition and condition != 'Any' and condition != 'any':
            qs = qs.filter(condition_type=condition)
        min_price = self.request.query_params.get('min_price') or self.request.query_params.get('price_min')
        max_price = self.request.query_params.get('max_price') or self.request.query_params.get('price_max')
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except:
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except:
                pass
        # Seller filter for dashboard
        seller_id = self.request.query_params.get('seller_id') or self.request.query_params.get('seller')
        if seller_id:
            try:
                qs = qs.filter(seller_id=int(seller_id))
            except:
                pass
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def perform_update(self, serializer):
        product = self.get_object()
        if product.seller != self.request.user and not (self.request.user.is_staff or getattr(self.request.user, 'role', None) == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own listings.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.seller != self.request.user and not (self.request.user.is_staff or getattr(self.request.user, 'role', None) == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own listings.")
        instance.delete()

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def increment_views(self, request, pk=None):
        product = self.get_object()
        product.views = product.views + 1
        product.save(update_fields=['views'])
        return Response({'views': product.views})
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def status(self, request, pk=None):
        # Alias for PATCH /products/{id}/ to support frontend /products/{id}/status call per audit
        product = self.get_object()
        if product.seller != request.user and not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only update your own listing status.")
        new_status = request.data.get('status')
        if new_status not in ['available', 'reserved', 'sold']:
            return Response({"error": "Invalid status"}, status=status.HTTP_400_BAD_REQUEST)
        product.status = new_status
        product.save(update_fields=['status', 'updated_at'])
        return Response(ProductSerializer(product).data)

class MessageViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(Q(sender=user) | Q(receiver=user))
        # Conversation filtering is enforced server-side so the UI cannot leak
        # messages from another conversation into the selected thread.
        other = self.request.query_params.get('other_user')
        if other:
            try:
                other_id = int(other)
            except (TypeError, ValueError):
                return qs.none()
            qs = qs.filter(
                Q(sender_id=other_id, receiver=user) |
                Q(sender=user, receiver_id=other_id)
            )
        product = self.request.query_params.get('product')
        if product:
            try:
                qs = qs.filter(product_id=int(product))
            except (TypeError, ValueError):
                return qs.none()
        return qs.select_related('sender', 'receiver', 'product').order_by('created_at')

    def perform_create(self, serializer):
        # FIXED: sender derived from auth, receiver validated by the serializer
        receiver_id = serializer.validated_data.pop('receiver_id')
        product_id = serializer.validated_data.pop('product_id', None)
        body_product = serializer.validated_data.pop('product', None)
        product = body_product
        if product_id is not None:
            product = Product.objects.filter(id=product_id).first()
            if product is None:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({"product_id": "Product does not exist."})
        serializer.save(sender=self.request.user, receiver_id=receiver_id, product=product)

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        qs = Message.objects.filter(receiver=request.user, is_read=False)
        other = request.data.get('other_user')
        product = request.data.get('product')
        if other:
            qs = qs.filter(sender_id=other)
        if product:
            qs = qs.filter(product_id=product)
        updated = qs.update(is_read=True)
        return Response({'marked_read': updated})

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        messages = Message.objects.filter(Q(sender=user) | Q(receiver=user)).select_related('sender', 'receiver', 'product').order_by('-created_at')
        conv_map = {}
        for m in messages:
            other = m.receiver if m.sender == user else m.sender
            key = (other.id, m.product.id if m.product else 0)
            if key not in conv_map:
                unread_qs = Message.objects.filter(sender=other, receiver=user, is_read=False)
                if m.product_id:
                    unread_qs = unread_qs.filter(product_id=m.product_id)
                else:
                    unread_qs = unread_qs.filter(product__isnull=True)
                conv_map[key] = {
                    'other_user': PublicUserSerializer(other).data,
                    'product': ProductSerializer(m.product).data if m.product else None,
                    'last_message': MessageSerializer(m).data,
                    'unread_count': unread_qs.count(),
                }
        return Response(list(conv_map.values()))

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related('product__seller', 'product__category')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TransactionRecordViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return TransactionRecord.objects.filter(Q(buyer=user) | Q(seller=user)).select_related('product', 'buyer', 'seller')

    def perform_create(self, serializer):
        product = serializer.validated_data['product']
        # FIXED: buyer is current user, seller derived from product, prevent self-buy
        if product.seller_id == self.request.user.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Cannot create transaction for your own product.")
        if product.status != 'available':
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Product is not available.")
        serializer.save(buyer=self.request.user, seller=product.seller)

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    from django.db import connection
    db_engine = connection.settings_dict['ENGINE']
    is_postgres = 'postgres' in db_engine
    return Response({
        'status': 'ok',
        'database': 'PostgreSQL' if is_postgres else 'SQLite (fallback - set DATABASE_URL for PostgreSQL)',
        'engine': db_engine,
        'stack': 'Django + DRF (thesis aligned)',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_stats(request):
    """Aggregate counts only - safe for the home page, no personal data."""
    return Response({
        'students': User.objects.filter(is_active=True, role='student').count(),
        'listings': Product.objects.count(),
        'available': Product.objects.filter(status='available').count(),
        'exchanges': TransactionRecord.objects.filter(status='completed').count(),
    })


@api_view(['GET'])
@permission_classes([IsAdmin])
def admin_stats(request):
    """System-wide totals for the admin dashboard. Admin-only."""
    return Response({
        'users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'products': Product.objects.count(),
        'active_listings': Product.objects.filter(status='available').count(),
        'messages': Message.objects.count(),
        'transactions': TransactionRecord.objects.count(),
    })
