from django.urls import path
from .views import get_messages, upload_voice_message

urlpatterns = [
    path("messages/", get_messages, name="get_messages"),
    path("upload-voice/", upload_voice_message, name="upload_voice_message"),
]