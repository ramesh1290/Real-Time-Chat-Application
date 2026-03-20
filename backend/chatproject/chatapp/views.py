import cloudinary.uploader

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

from .models import Message
from .serializers import MessageSerializer


@api_view(["GET"])
def get_messages(request):
    messages = Message.objects.all().order_by("created_at")
    serializer = MessageSerializer(messages, many=True)
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

    try:
        upload_result = cloudinary.uploader.upload(
            voice,
            resource_type="video",
            folder="chat_voice_messages",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )

        secure_url = upload_result.get("secure_url")
        public_id = upload_result.get("public_id")

        if not secure_url:
            return Response(
                {"error": "Cloudinary upload failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        message = Message.objects.create(
            username=username,
            text="",
            voice_url=secure_url,
            voice_public_id=public_id,
        )

        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"Voice upload failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )