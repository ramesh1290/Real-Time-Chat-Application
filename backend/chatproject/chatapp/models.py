from django.db import models

class Message(models.Model):
    username = models.CharField(max_length=100)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username}: {self.text[:20]}"
class MessageReceipt(models.Model):
    STATUS_CHOICES = (
        ("delivered", "Delivered"),
        ("seen", "Seen"),
    )

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="receipts"
    )
    username = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="delivered")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("message", "username")

    def __str__(self):
        return f"{self.username} - {self.message.id} - {self.status}"
# NEW: stores emoji reactions in DB
class MessageReaction(models.Model):
    EMOJI_CHOICES = [
        ("❤️", "Heart"),
        ("😂", "Laugh"),
        ("🔥", "Fire"),
        ("😮", "Wow"),
        ("😢", "Sad"),
        ("👍", "Like"),
    ]

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name="reactions"
    )
    username = models.CharField(max_length=100)
    emoji = models.CharField(max_length=10, choices=EMOJI_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # one user = one reaction per message
        unique_together = ("message", "username")

    def __str__(self):
        return f"{self.username} reacted {self.emoji} on message {self.message_id}"


        