from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Category, Product, Message, Favorite, TransactionRecord


@admin.register(User)
class MarketplaceUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'is_staff')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    fieldsets = UserAdmin.fieldsets + (
        ('Marketplace profile', {'fields': ('role', 'matric_no', 'department', 'avatar')}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'slug', 'icon')
    search_fields = ('category_name',)
    prepopulated_fields = {'slug': ('category_name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'seller', 'category', 'price', 'condition_type', 'status', 'created_at')
    list_filter = ('status', 'condition_type', 'category')
    search_fields = ('product_name', 'description', 'seller__username')
    raw_id_fields = ('seller',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'receiver', 'product', 'message_text', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('message_text', 'sender__username', 'receiver__username')
    raw_id_fields = ('sender', 'receiver', 'product')


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    raw_id_fields = ('user', 'product')


@admin.register(TransactionRecord)
class TransactionRecordAdmin(admin.ModelAdmin):
    list_display = ('buyer', 'seller', 'product', 'status', 'created_at')
    list_filter = ('status',)
    raw_id_fields = ('buyer', 'seller', 'product')
