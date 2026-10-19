from datetime import date
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsMember
from apps.meetings.models import Meeting
from apps.tasks.models import Task
from .models import Todo
from .serializers import TodoSerializer


class TodoViewSet(viewsets.ModelViewSet):
    """Personal to-do list. Managers and employees only; each user sees only their own."""
    serializer_class = TodoSerializer
    permission_classes = [IsMember]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Todo.objects.filter(user=self.request.user)

    def perform_create(self, s):
        s.save(user=self.request.user)

    def perform_update(self, s):
        was = s.instance.is_done
        t = s.save()
        if t.is_done != was:
            t.done_at = timezone.now() if t.is_done else None
            t.save(update_fields=["done_at"])


class CalendarView(APIView):
    """Meetings, task deadlines and personal to-dos between ?start= and ?end= (YYYY-MM-DD)."""
    permission_classes = [IsMember]

    def get(self, request):
        try:
            start = date.fromisoformat(request.query_params["start"])
            end = date.fromisoformat(request.query_params["end"])
        except (KeyError, ValueError):
            raise ValidationError("start and end (YYYY-MM-DD) are required.")
        if end < start or (end - start).days > 62:
            raise ValidationError("Invalid date range.")
        u = request.user
        mq = Meeting.objects.filter(manager=u) if u.role == "MANAGER" else Meeting.objects.filter(participants=u)
        tq = Task.objects.for_manager(u) if u.role == "MANAGER" else Task.objects.filter(assignee=u)
        out = []
        for m in mq.filter(scheduled_at__date__gte=start, scheduled_at__date__lte=end).distinct():
            local = timezone.localtime(m.scheduled_at)
            out.append({"kind": "meeting", "id": m.id, "title": m.title, "date": local.date().isoformat(),
                        "time": local.strftime("%H:%M"), "status": m.status, "link": f"/meetings/{m.id}"})
        for t in tq.filter(deadline__gte=start, deadline__lte=end).select_related("assignee"):
            out.append({"kind": "task", "id": t.id, "title": t.title, "date": t.deadline.isoformat(), "time": None,
                        "status": t.status, "priority": t.priority, "assignee": t.assignee.display_name,
                        "link": f"/tasks/{t.id}"})
        for t in Todo.objects.filter(user=u, due_date__gte=start, due_date__lte=end):
            out.append({"kind": "todo", "id": t.id, "title": t.title, "date": t.due_date.isoformat(), "time": None,
                        "done": t.is_done})
        out.sort(key=lambda x: (x["date"], x["time"] or "99:99"))
        return Response(out)