
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from apps.products.models import Product
class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class=ConversationSerializer
    permission_classes=[permissions.IsAuthenticated]
    def get_queryset(self):
        user=self.request.user
        return Conversation.objects.filter(Q(buyer=user)|Q(seller=user)).select_related('buyer','seller','product')
    def create(self,request,*args,**kwargs):
        product_id=request.data.get('product')
        content=request.data.get('content')
        if not product_id or not content:
            return Response({"detail":"product and content required"}, status=400)
        product=get_object_or_404(Product, id=product_id)
        if product.seller==request.user:
            return Response({"detail":"You cannot message yourself"}, status=400)
        conversation,created=Conversation.objects.get_or_create(product=product,buyer=request.user,seller=product.seller)
        Message.objects.create(conversation=conversation,sender=request.user,content=content)
        conversation.save()
        return Response(ConversationSerializer(conversation, context={'request':request}).data, status=201)
class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class=MessageSerializer
    permission_classes=[permissions.IsAuthenticated]
    def get_queryset(self):
        conv_id=self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, Q(buyer=self.request.user) | Q(seller=self.request.user), id=conv_id)
        conversation.messages.filter(is_read=False).exclude(sender=self.request.user).update(is_read=True)
        return conversation.messages.all()
    def perform_create(self,serializer):
        conv_id=self.kwargs['conversation_id']
        conversation = get_object_or_404(Conversation, Q(buyer=self.request.user) | Q(seller=self.request.user), id=conv_id)
        serializer.save(conversation=conversation, sender=self.request.user)
        conversation.save()
