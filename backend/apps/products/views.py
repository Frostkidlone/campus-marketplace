
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from django.db.models import Q
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer, ProductCreateSerializer
try:
    from django_filters.rest_framework import DjangoFilterBackend
    HAS=True
except:
    HAS=False
    DjangoFilterBackend=None
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self,request,view,obj):
        if request.method in permissions.SAFE_METHODS: return True
        return obj.seller==request.user or request.user.is_staff
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class=ProductSerializer
    filter_backends=[DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter] if HAS else [filters.SearchFilter, filters.OrderingFilter]
    def get_queryset(self):
        qs=Product.objects.filter(status='available').select_related('seller','category')
        q=self.request.query_params.get('q')
        cat=self.request.query_params.get('category_slug')
        cond=self.request.query_params.get('condition')
        minp=self.request.query_params.get('min_price')
        maxp=self.request.query_params.get('max_price')
        if q: qs=qs.filter(Q(title__icontains=q)|Q(description__icontains=q))
        if cat: qs=qs.filter(category__slug=cat)
        if cond: qs=qs.filter(condition=cond)
        if minp: qs=qs.filter(price__gte=minp)
        if maxp: qs=qs.filter(price__lte=maxp)
        return qs
    def get_serializer_class(self):
        if self.request.method=='POST': return ProductCreateSerializer
        return ProductSerializer
    def perform_create(self,serializer): serializer.save(seller=self.request.user)
    def create(self,request,*args,**kwargs):
        serializer=self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product=serializer.save(seller=request.user)
        return Response(ProductSerializer(product, context={'request':request}).data, status=status.HTTP_201_CREATED)
class MyProductsView(generics.ListAPIView):
    serializer_class=ProductSerializer
    permission_classes=[permissions.IsAuthenticated]
    def get_queryset(self): return Product.objects.filter(seller=self.request.user).order_by('-created_at')
class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset=Product.objects.all().select_related('seller','category')
    serializer_class=ProductSerializer
    permission_classes=[permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    def retrieve(self,request,*args,**kwargs):
        instance=self.get_object()
        instance.views+=1
        instance.save(update_fields=['views'])
        return Response(self.get_serializer(instance).data)
    def get_serializer_class(self):
        if self.request.method in ['PUT','PATCH']: return ProductCreateSerializer
        return ProductSerializer
    def update(self,request,*args,**kwargs):
        partial=kwargs.pop('partial',False)
        instance=self.get_object()
        serializer=ProductCreateSerializer(instance,data=request.data,partial=partial)
        serializer.is_valid(raise_exception=True)
        product=serializer.save()
        return Response(ProductSerializer(product, context={'request':request}).data)
class CategoryListView(generics.ListCreateAPIView):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer
    permission_classes=[permissions.AllowAny]
class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset=Category.objects.all()
    serializer_class=CategorySerializer
    permission_classes=[permissions.IsAdminUser]
    lookup_field='slug'
class AdminProductListView(generics.ListAPIView):
    queryset=Product.objects.all().select_related('seller','category').order_by('-created_at')
    serializer_class=ProductSerializer
    permission_classes=[permissions.IsAdminUser]
class AdminStatsView(generics.GenericAPIView):
    permission_classes=[permissions.IsAdminUser]
    def get(self,request):
        from apps.users.models import User
        stats={"total_users":User.objects.count(),"total_products":Product.objects.count(),"active_listings":Product.objects.filter(status='available').count(),"sold_listings":Product.objects.filter(status='sold').count(),"reported_listings":Product.objects.filter(status='reported').count(),"total_categories":Category.objects.count(),}
        return Response(stats)
