from django.contrib import admin
from .models import Message,MessageReceipt,MessageReaction
admin.site.register(Message)
admin.site.register(MessageReceipt)
admin.site.register(MessageReaction)
# Register your models here.
