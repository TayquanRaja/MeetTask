from django.utils import timezone
from rest_framework import serializers
from .models import ProofFile, Task, TaskProof


class ProofFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProofFile
        fields = ["id", "name", "size", "content_type"]


class ProofSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.display_name", read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    files = ProofFileSerializer(many=True, read_only=True)

    class Meta:
        model = TaskProof
        fields = ["id", "status", "note", "link", "submitted_by_name", "created_at",
                  "reviewed_by_name", "reviewed_at", "review_comment", "files"]

    def get_reviewed_by_name(self, p):
        return p.reviewed_by.display_name if p.reviewed_by_id else None


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source="assignee.display_name", read_only=True)
    meeting_title = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    project_color = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source="approved_by.display_name", read_only=True)
    is_overdue = serializers.SerializerMethodField()
    history = serializers.SerializerMethodField()
    proofs = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = ["id", "title", "description", "meeting", "meeting_title", "project", "project_name",
                  "project_color", "assignee", "assignee_name", "deadline", "priority", "status",
                  "proof_required", "approved_by_name", "approved_at", "completed_at", "created_at",
                  "is_overdue", "history", "proofs"]
        read_only_fields = ["meeting", "project", "approved_at", "completed_at"]

    def get_meeting_title(self, t):
        return t.meeting.title if t.meeting_id else None

    def get_project_name(self, t):
        return t.project.name if t.project_id else None

    def get_project_color(self, t):
        return t.project.color if t.project_id else None

    def get_is_overdue(self, t):
        # A task waiting for the manager's review is not the assignee's lateness.
        return bool(t.deadline and t.status not in ("DONE", "IN_REVIEW") and t.deadline < timezone.localdate())

    def get_history(self, t):
        if not self.context.get("detail"):
            return []
        return [{"actor": e.actor.display_name if e.actor else "system", "description": e.description,
                 "created_at": e.created_at} for e in t.events.select_related("actor")]

    def get_proofs(self, t):
        if not self.context.get("detail"):
            return []
        qs = t.proofs.select_related("submitted_by", "reviewed_by").prefetch_related("files")
        return ProofSerializer(qs, many=True).data
