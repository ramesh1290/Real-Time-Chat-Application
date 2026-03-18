import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Message, MessageReceipt, MessageReaction


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "global_chat"
        self.room_group_name = f"chat_{self.room_name}"

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type", "chat")

        if message_type == "typing":
            username = data.get("username")
            is_typing = data.get("isTyping", False)

            if not username:
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_status",
                    "username": username,
                    "isTyping": is_typing,
                }
            )
            return

        if message_type == "delivered":
            message_id = data.get("message_id")
            username = data.get("username")

            if not message_id or not username:
                return

            receipt = await self.update_receipt(message_id, username, "delivered")
            if not receipt:
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "receipt_update",
                    "message_id": message_id,
                    "username": username,
                    "status": "delivered",
                }
            )
            return

        if message_type == "seen":
            message_id = data.get("message_id")
            username = data.get("username")

            if not message_id or not username:
                return

            receipt = await self.update_receipt(message_id, username, "seen")
            if not receipt:
                return

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "receipt_update",
                    "message_id": message_id,
                    "username": username,
                    "status": "seen",
                }
            )
            return

        # NEW: handle emoji reaction safely
        if message_type == "reaction":
            message_id = data.get("message_id")
            username = data.get("username")
            emoji = data.get("emoji")

            if not message_id or not username or not emoji:
                return

            try:
                reaction = await self.save_or_update_reaction(
                    message_id,
                    username,
                    emoji
                )

                if not reaction:
                    return

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "reaction_update",
                        "message_id": reaction.message.id,
                        "username": reaction.username,
                        "emoji": reaction.emoji,
                    }
                )
            except Exception as e:
                print("Reaction error:", e)

            return

        username = data.get("username")
        text = data.get("text")

        if not username or not text:
            return

        message = await self.save_message(username, text)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message_type": "chat",
                "id": message.id,
                "username": message.username,
                "text": message.text,
                "created_at": message.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": event.get("message_type", "chat"),
            "id": event["id"],
            "username": event["username"],
            "text": event["text"],
            "created_at": event["created_at"],
        }))

    async def typing_status(self, event):
        await self.send(text_data=json.dumps({
            "type": "typing",
            "username": event["username"],
            "isTyping": event["isTyping"],
        }))

    async def receipt_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "receipt_update",
            "message_id": event["message_id"],
            "username": event["username"],
            "status": event["status"],
        }))

    # NEW: send reaction update to all users
    async def reaction_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "reaction_update",
            "message_id": event["message_id"],
            "username": event["username"],
            "emoji": event["emoji"],
        }))

    @sync_to_async
    def save_message(self, username, text):
        return Message.objects.create(username=username, text=text)

    @sync_to_async
    def update_receipt(self, message_id, username, status):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None

        if message.username.strip().lower() == username.strip().lower():
            return None

        receipt, created = MessageReceipt.objects.get_or_create(
            message=message,
            username=username,
            defaults={"status": status}
        )

        if not created:
            if receipt.status != "seen":
                if status == "seen" or receipt.status != status:
                    receipt.status = status
                    receipt.save()

        return receipt

    # NEW: safely switch one user's reaction on one message
    @sync_to_async
    def save_or_update_reaction(self, message_id, username, emoji):
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return None

        # cleanup old duplicates if any old bad data exists
        duplicates = MessageReaction.objects.filter(
            message=message,
            username=username
        )

        if duplicates.count() > 1:
            first = duplicates.first()
            duplicates.exclude(id=first.id).delete()

        reaction = MessageReaction.objects.filter(
            message=message,
            username=username
        ).first()

        if reaction:
            reaction.emoji = emoji
            reaction.save()
            return reaction

        return MessageReaction.objects.create(
            message=message,
            username=username,
            emoji=emoji
        )