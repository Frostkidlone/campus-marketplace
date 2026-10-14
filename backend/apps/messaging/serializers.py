
from rest_framework import serializers
from .models import Conversation, Message
from apps.users.serializers import UserSerializer
from apps.products.serializers import ProductSerializer
class MessageSerializer(serializers.ModelSerializer):
    sender=UserSerializer(read_only=True)
    class Meta:
        model=Message
        fields=['id','conversation','sender','content','created_at','is_read']
        read_only_fields=['id','sender','created_at']
class ConversationSerializer(serializers.ModelSerializer):
    buyer=UserSerializer(read_only=True)
    seller=UserSerializer(read_only=True)
    product=ProductSerializer(read_only=True)
    last_message=serializers.SerializerMethodField()
    unread_count=serializers.SerializerMethodField()
    class Meta:
        model=Conversation
        fields=['id','product','buyer','seller','created_at','updated_at','last_message','unread_count']
    def get_last_message(self,obj):
        last=obj.messages.order_by('-created_at').first()
        if last: return MessageSerializer(last).data
        return None
    def get_unread_count(self,obj):
        request=self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        return 0
