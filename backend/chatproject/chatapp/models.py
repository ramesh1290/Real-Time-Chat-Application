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