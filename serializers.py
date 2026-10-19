
from datetime import date

from django.utils import timezone
from rest_framework import serializers

from apps.tasks.serializers import TaskSerializer
from .models import BacklogItem, Project


def _unassigned(p):
    return [
        b for b in p.backlog.all()
        if getattr(b, "task", None) is None
    ]


def project_stats(p):
    tasks = list(p.tasks.all())
    today = timezone.localdate()
    backlog = len(_unassigned(p))
    total = len(tasks) + backlog

    done = sum(t.status == "DONE" for t in tasks)

    return {
        "total": total,
        "done": done,
        "backlog": backlog,
        "pending": sum(t.status == "PENDING" for t in tasks),
        "in_progress": sum(t.status == "IN_PROGRESS" for t in tasks),
        "in_review": sum(t.status == "IN_REVIEW" for t in tasks),
        "overdue": sum(
            1 for t in tasks
            if t.status not in ("DONE", "IN_REVIEW")
            and t.deadline
            and t.deadline < today
        ),
        "progress": round(done * 100 / total) if total else 0,
    }


class BacklogSerializer(serializers.ModelSerializer):
    assignee = serializers.SerializerMethodField()
    task_id = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = BacklogItem
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "deadline",
            "assignee",
            "task_id",
            "status",
            "is_overdue",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def get_assignee(self, b):
        t = getattr(b, "task", None)
        return (
            {"id": t.assignee_id, "name": t.assignee.display_name}
            if t else None
        )

    def get_task_id(self, b):
        t = getattr(b, "task", None)
        return t.id if t else None

    def get_status(self, b):
        t = getattr(b, "task", None)
        return t.status if t else "BACKLOG"

    def get_is_overdue(self, b):
        t = getattr(b, "task", None)
        return bool(
            t
            and t.status not in ("DONE", "IN_REVIEW")
            and t.deadline
            and t.deadline < timezone.localdate()
        )


class ProjectSerializer(serializers.ModelSerializer):
    color = serializers.RegexField(
        r"^#[0-9a-fA-F]{6}$",
        required=False,
    )
    stats = serializers.SerializerMethodField()
    meeting_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "color",
            "due_date",
            "status",
            "stats",
            "meeting_count",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_name(self, v):
        v = v.strip()

        qs = Project.objects.filter(
            manager=self.context["request"].user,
            name__iexact=v,
        )

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError(
                "You already have a project with this name."
            )

        return v

    def get_stats(self, p):
        return project_stats(p)

    def get_meeting_count(self, p):
        return p.meetings.count()


class ProjectDetailSerializer(ProjectSerializer):
    backlog = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    meetings = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + [
            "backlog",
            "tasks",
            "meetings",
            "members",
        ]

    def get_backlog(self, p):
        return BacklogSerializer(
            _unassigned(p),
            many=True,
        ).data

    def get_tasks(self, p):
        tasks = sorted(
            p.tasks.all(),
            key=lambda t: (
                t.deadline is None,
                t.deadline or date.max,
                t.id,
            ),
        )

        return TaskSerializer(
            tasks,
            many=True,
            context=self.context,
        ).data

    def get_meetings(self, p):
        meetings = sorted(
            p.meetings.all(),
            key=lambda m: m.scheduled_at,
            reverse=True,
        )

        return [
            {
                "id": m.id,
                "title": m.title,
                "scheduled_at": m.scheduled_at,
                "status": m.status,
            }
            for m in meetings
        ]

    def get_members(self, p):
        members = {}

        for t in p.tasks.all():
            member = members.setdefault(
                t.assignee_id,
                {
                    "id": t.assignee_id,
                    "name": t.assignee.display_name,
                    "total": 0,
                    "done": 0,
                },
            )

            member["total"] += 1
            member["done"] += t.status == "DONE"

        return sorted(
            members.values(),
            key=lambda m: -m["total"],
        )
