from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Message
from .serializers import MessageSerializer

# @api_view(["GET", "POST"])
# def message_list_create(request):
#     if request.method == "GET":
#         messages = Message.objects.all().order_by("created_at")
#         serializer = MessageSerializer(messages, many=True)
#         return Response(serializer.data, status=status.HTTP_200_OK)

#     elif request.method == "POST":
#         serializer = MessageSerializer(data=request.data)
#         if serializer.is_valid():
#             serializer.save()
#             return Response(serializer.data, status=status.HTTP_201_CREATED)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

@api_view(["GET"])
def get_messages(request):
    messages = Message.objects.all().order_by("created_at")
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)
    