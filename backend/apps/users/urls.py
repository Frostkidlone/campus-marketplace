
from django.urls import path
from .views import RegisterView, LoginView, MeView, UserListView, UserDetailAdminView
from rest_framework_simplejwt.views import TokenRefreshView
urlpatterns=[
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('admin/users/', UserListView.as_view()),
    path('admin/users/<int:pk>/', UserDetailAdminView.as_view()),
]
