
from rest_framework import serializers
from .models import Product, Category
from apps.users.serializers import UserSerializer
class CategorySerializer(serializers.ModelSerializer):
    product_count=serializers.SerializerMethodField()
    class Meta:
        model=Category
        fields=['id','name','slug','description','product_count']
    def get_product_count(self,obj): return obj.products.filter(status='available').count()
class ProductSerializer(serializers.ModelSerializer):
    seller=UserSerializer(read_only=True)
    category_name=serializers.CharField(source='category.name', read_only=True)
    image_url=serializers.SerializerMethodField()
    class Meta:
        model=Product
        fields=['id','title','description','price','condition','status','category','category_name','seller','image','image_url','location','created_at','updated_at','views']
        read_only_fields=['seller','views','created_at','updated_at']
    def get_image_url(self,obj):
        if obj.image:
            request=self.context.get('request')
            if request: return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
class ProductCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model=Product
        fields=['title','description','price','condition','category','image','location','status']
