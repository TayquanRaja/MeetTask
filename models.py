from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models

private_storage = FileSystemStorage(location=settings.PRIVATE_MEDIA_ROOT, base_url=None)


class Meeting(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT"
        PROCESSING = "PROCESSING"
        PENDING_REVIEW = "PENDING_REVIEW"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"
        FAILED = "FAILED"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    scheduled_at = models.DateTimeField()
    is_confidential = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    processing_error = models.CharField(max_length=300, blank=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="managed_meetings")
    project = models.ForeignKey("projects.Project", null=True, blank=True, on_delete=models.SET_NULL, related_name="meetings")
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, through="MeetingParticipant", related_name="meetings")
    audio = models.FileField(storage=private_storage, upload_to="audio/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_at"]


class MeetingParticipant(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="links")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    pseudonym = models.CharField(max_length=10)  # P1, P2...

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["meeting", "user"], name="uniq_meeting_user"),
            models.UniqueConstraint(fields=["meeting", "pseudonym"], name="uniq_meeting_pseudonym"),
        ]


class Transcript(models.Model):
    meeting = models.OneToOneField(Meeting, on_delete=models.CASCADE, related_name="transcript")
    original_text = models.TextField()      # restricted: manager only
    sanitized_text = models.TextField()     # what Gemini receives
    source = models.CharField(max_length=20)  # whisper | dev_adapter
    created_at = models.DateTimeField(auto_now=True)


class AIOutput(models.Model):
    class Status(models.TextChoices):
        PENDING_REVIEW = "PENDING_REVIEW"
        APPROVED = "APPROVED"
        REJECTED = "REJECTED"

    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name="outputs")
    version = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING_REVIEW, db_index=True)
    summary = models.TextField()
    mom = models.TextField()
    discussion_points = models.JSONField(default=list)
    decisions = models.JSONField(default=list)
    action_items = models.JSONField(default=list)
    generated_by = models.CharField(max_length=20)  # gemini | mock
    model_name = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-version"]
        unique_together = [("meeting", "version")]


class Review(models.Model):
    output = models.ForeignKey(AIOutput, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    decision = models.CharField(max_length=10)  # APPROVED | REJECTED
    reason = models.TextField(blank=True)
    changes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)