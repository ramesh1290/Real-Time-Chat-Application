from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from .models import Message
from .serializers import MessageSerializer


@api_view(["GET"])
def get_messages(request):
    messages = Message.objects.all().order_by("created_at")
    serializer = MessageSerializer(messages, many=True, context={"request": request})
    return Response(serializer.data)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_voice_message(request):
    username = request.data.get("username")
    voice = request.FILES.get("voice")

    if not username or not voice:
        return Response(
            {"error": "username and voice are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = Message.objects.create(
        username=username,
        text="",
        voice=voice
    )

    serializer = MessageSerializer(message, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)