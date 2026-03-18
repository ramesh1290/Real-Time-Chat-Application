from django.urls import path
from .views import get_messages

urlpatterns = [
    # path("messages/", message_list_create, name="message_list_create"),
   path("messages/", get_messages, name="get_messages"),
]