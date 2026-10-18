
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, CategoryViewSet, ProductViewSet, MessageViewSet,
    FavoriteViewSet, TransactionRecordViewSet,
    health_check, public_stats, admin_stats,
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'favorites', FavoriteViewSet, basename='favorite')
router.register(r'transactions', TransactionRecordViewSet, basename='transaction')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health'),
    path('stats/', public_stats, name='public-stats'),
    path('admin/stats/', admin_stats, name='admin-stats'),
]
