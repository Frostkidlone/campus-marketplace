
from django.urls import path
from .views import ProductListCreateView, ProductDetailView, MyProductsView, AdminProductListView
urlpatterns=[
    path('', ProductListCreateView.as_view()),
    path('my/', MyProductsView.as_view()),
    path('admin/all/', AdminProductListView.as_view()),
    path('<int:pk>/', ProductDetailView.as_view()),
]
