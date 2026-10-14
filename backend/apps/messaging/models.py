
from django.db import models
from django.conf import settings
class Conversation(models.Model):
    product=models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='conversations')
    buyer=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='buyer_conversations')
    seller=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='seller_conversations')
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        unique_together=('product','buyer','seller')
        ordering=['-updated_at']
class Message(models.Model):
    conversation=models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender=models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content=models.TextField()
    created_at=models.DateTimeField(auto_now_add=True)
    is_read=models.BooleanField(default=False)
    class Meta: ordering=['created_at']
