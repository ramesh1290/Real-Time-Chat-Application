from rest_framework import serializers
from .models import Message, MessageReceipt, MessageReaction


class MessageReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReceipt
        fields = ["username", "status", "updated_at"]


# NEW: serializer for reactions
class MessageReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReaction
        fields = ["username", "emoji", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    receipts = MessageReceiptSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)  # NEW

    class Meta:
        model = Message
        fields = [
            "id",
            "username",
            "text",
            "created_at",
            "receipts",
            "reactions",
        ]