
from django.contrib.auth.models import AbstractUser
from django.db import models
class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True)
    matric_number = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=100, blank=True)
    is_student = models.BooleanField(default=True)
    def __str__(self): return f"{self.full_name} ({self.username})"
    class Meta: ordering=['-date_joined']
