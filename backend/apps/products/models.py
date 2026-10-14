
from django.db import models
from django.conf import settings
class Category(models.Model):
    name=models.CharField(max_length=100, unique=True)
    slug=models.SlugField(unique=True)
    description=models.TextField(blank=True)
    class Meta: verbose_name_plural="Categories"
    def __str__(self): return self.name
class Product(models.Model):
    CONDITION=[('new','New'),('like_new','Like New'),('used','Used'),('fair','Fair')]
    STATUS=[('available','Available'),('sold','Sold'),('unavailable','Unavailable'),('reported','Reported')]
    seller=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    category=models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    title=models.CharField(max_length=200)
    description=models.TextField()
    price=models.DecimalField(max_digits=10, decimal_places=2)
    condition=models.CharField(max_length=20, choices=CONDITION, default='used')
    status=models.CharField(max_length=20, choices=STATUS, default='available')
    image=models.ImageField(upload_to='products/', blank=True, null=True)
    location=models.CharField(max_length=100, blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    views=models.PositiveIntegerField(default=0)
    class Meta: ordering=['-created_at']
    def __str__(self): return self.title
