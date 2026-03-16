from django.urls import path
from .views import message_list_create

urlpatterns = [
    path("messages/", message_list_create, name="message_list_create"),
]