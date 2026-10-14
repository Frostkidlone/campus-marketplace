
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import RegisterSerializer, UserSerializer, LoginSerializer
class RegisterView(generics.CreateAPIView):
    queryset=User.objects.all()
    serializer_class=RegisterSerializer
    permission_classes=[permissions.AllowAny]
class LoginView(APIView):
    permission_classes=[permissions.AllowAny]
    def post(self, request):
        serializer=LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username=serializer.validated_data['username']
        password=serializer.validated_data['password']
        if '@' in username:
            try:
                u=User.objects.get(email=username)
                username=u.username
            except User.DoesNotExist: pass
        user=authenticate(username=username,password=password)
        if not user:
            return Response({"detail":"Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        refresh=RefreshToken.for_user(user)
        return Response({"refresh":str(refresh),"access":str(refresh.access_token),"user":UserSerializer(user).data})
class MeView(generics.RetrieveUpdateAPIView):
    serializer_class=UserSerializer
    permission_classes=[permissions.IsAuthenticated]
    def get_object(self): return self.request.user
class UserListView(generics.ListAPIView):
    queryset=User.objects.all()
    serializer_class=UserSerializer
    permission_classes=[permissions.IsAdminUser]
class UserDetailAdminView(generics.RetrieveUpdateDestroyAPIView):
    queryset=User.objects.all()
    serializer_class=UserSerializer
    permission_classes=[permissions.IsAdminUser]
