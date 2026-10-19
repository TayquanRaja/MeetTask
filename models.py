
import os
import uuid

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models


def proof_storage():
    """Store proof files privately without exposing public URLs."""
    return FileSystemStorage(
        location=settings.PRIVATE_MEDIA_ROOT,
        base_url=None,
    )


def proof_upload_to(instance, filename):
    """Use a unique filename instead of the original uploaded filename."""
    ext = os.path.splitext(filename)[1].lower()
    return f"proofs/task_{instance.proof.task_id}/{uuid.uuid4().hex}{ext}"


class TaskQuerySet(models.QuerySet):
    def for_manager(self, user):
        return self.filter(
            models.Q(meeting__manager=user)
            | models.Q(project__manager=user)
        )


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING"
        IN_PROGRESS = "IN_PROGRESS"
        IN_REVIEW = "IN_REVIEW"
        DONE = "DONE"

    class Priority(models.TextChoices):
        LOW = "LOW"
        MEDIUM = "MEDIUM"
        HIGH = "HIGH"

    # Meeting-related tasks
    meeting = models.ForeignKey(
        "meetings.Meeting",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="tasks",
    )
    ai_output = models.ForeignKey(
        "meetings.AIOutput",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="tasks",
    )
    source_index = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # Project and backlog-related tasks
    project = models.ForeignKey(
        "projects.Project",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="tasks",
    )
    backlog_item = models.OneToOneField(
        "projects.BacklogItem",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="task",
    )

    # Task details
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="tasks",
    )
    deadline = models.DateField(null=True, blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default="MEDIUM",
        db_index=True,
    )
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default="PENDING",
        db_index=True,
    )

    # Proof and approval workflow
    proof_required = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
    )
    approved_at = models.DateTimeField()
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)

    objects = TaskQuerySet.as_manager()

    class Meta:
        ordering = ["deadline", "-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["ai_output", "source_index"],
                name="uniq_task_per_item",
            )
        ]

    @property
    def owner(self):
        return (
            self.meeting.manager
            if self.meeting_id
            else self.project.manager
        )


class TaskEvent(models.Model):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
    )
    description = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class TaskProof(models.Model):
    """A proof submission; a task may have multiple submissions."""

    class Status(models.TextChoices):
        SUBMITTED = "SUBMITTED"
        APPROVED = "APPROVED"
        CHANGES_REQUESTED = "CHANGES_REQUESTED"
        WITHDRAWN = "WITHDRAWN"

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="proofs",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="+",
    )
    note = models.TextField(blank=True)
    link = models.URLField(max_length=500, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default="SUBMITTED",
        db_index=True,
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
    )
    review_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]


class ProofFile(models.Model):
    proof = models.ForeignKey(
        TaskProof,
        on_delete=models.CASCADE,
        related_name="files",
    )
    file = models.FileField(
        storage=proof_storage,
        upload_to=proof_upload_to,
        max_length=255,
    )
    name = models.CharField(
        max_length=200,
    )
    size = models.PositiveIntegerField()
    content_type = models.CharField(
        max_length=100,
        blank=True,
    )

    class Meta:
        ordering = ["id"]
