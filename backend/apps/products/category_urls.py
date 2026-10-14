
from django.urls import path
from .views import CategoryListView, CategoryDetailView, AdminStatsView
urlpatterns=[
    path('categories/', CategoryListView.as_view()),
    path('categories/<slug:slug>/', CategoryDetailView.as_view()),
    path('admin/stats/', AdminStatsView.as_view()),
]
