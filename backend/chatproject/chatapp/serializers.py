from rest_framework import serializers
from .models import Message, MessageReceipt, MessageReaction


class MessageReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReceipt
        fields = ["username", "status", "updated_at"]


class MessageReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageReaction
        fields = ["username", "emoji", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    receipts = MessageReceiptSerializer(many=True, read_only=True)
    reactions = MessageReactionSerializer(many=True, read_only=True)
    voice_url = serializers.SerializerMethodField()  # NEW

    class Meta:
        model = Message
        fields = [
            "id",
            "username",
            "text",
            "gif_url",
            "voice",
            "voice_url",
            "created_at",
            "receipts",
            "reactions",
        ]

    def get_voice_url(self, obj):
        request = self.context.get("request")
        if obj.voice:
            if request:
                return request.build_absolute_uri(obj.voice.url)
            return obj.voice.url
        return None