
from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    class Meta:
        model=User
        fields=['id','username','full_name','email','phone_number','matric_number','department','password','password_confirm']
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm":"Passwords do not match"})
        return attrs
    def create(self, validated_data):
        user=User.objects.create_user(username=validated_data['username'],email=validated_data['email'],password=validated_data['password'],full_name=validated_data.get('full_name',''),phone_number=validated_data.get('phone_number',''),matric_number=validated_data.get('matric_number',''),department=validated_data.get('department',''))
        return user
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['id','username','full_name','email','phone_number','matric_number','department','is_staff','date_joined','is_student']
        read_only_fields=['id','is_staff','date_joined']
class LoginSerializer(serializers.Serializer):
    username=serializers.CharField()
    password=serializers.CharField()
