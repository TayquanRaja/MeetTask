from datetime import timedelta
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.permissions import IsManager
from apps.tasks.models import Task


def _day(dt):
    return timezone.localtime(dt).date() if dt else None


class AnalyticsView(APIView):
    """Weekly completion and per-employee on-time performance for the manager's tasks."""
    permission_classes = [IsManager]

    def get(self, request):
        try:
            weeks = min(max(int(request.query_params.get("weeks", 8)), 1), 26)
        except ValueError:
            weeks = 8
        today = timezone.localdate()
        first = today - timedelta(days=today.weekday()) - timedelta(weeks=weeks - 1)
        buckets = [{"week_start": (first + timedelta(weeks=i)).isoformat(),
                    "total": 0, "done": 0, "completed_in_week": 0} for i in range(weeks)]

        def slot(d):
            i = (d - first).days // 7
            return i if d >= first and 0 <= i < weeks else None

        tasks = list(Task.objects.for_manager(request.user).select_related("assignee"))
        emp = {}
        for t in tasks:
            i = slot(_day(t.created_at))
            if i is not None:  # cohort: tasks created that week, and how many of them are done
                buckets[i]["total"] += 1
                buckets[i]["done"] += t.status == "DONE"
            j = slot(_day(t.completed_at)) if t.completed_at else None
            if j is not None:
                buckets[j]["completed_in_week"] += 1

            e = emp.setdefault(t.assignee_id, {"id": t.assignee_id, "name": t.assignee.display_name, "assigned": 0,
                                               "done": 0, "open": 0, "overdue": 0, "on_time": 0, "late": 0})
            e["assigned"] += 1
            if t.status == "DONE":
                e["done"] += 1
                if t.deadline and t.completed_at:
                    if _day(t.completed_at) <= t.deadline:
                        e["on_time"] += 1
                    else:
                        e["late"] += 1
            else:
                e["open"] += 1
                if t.deadline and t.deadline < today and t.status != "IN_REVIEW":  # waiting on the manager, not late
                    e["overdue"] += 1

        for e in emp.values():
            judged = e["on_time"] + e["late"]  # only done tasks that had a deadline
            e["on_time_rate"] = round(e["on_time"] * 100 / judged) if judged else None
            e["completion_rate"] = round(e["done"] * 100 / e["assigned"]) if e["assigned"] else 0
        employees = sorted(emp.values(), key=lambda e: (e["on_time_rate"] is None, -(e["on_time_rate"] or 0), -e["done"]))

        judged = sum(e["on_time"] + e["late"] for e in employees)
        on_time = sum(e["on_time"] for e in employees)
        return Response({
            "weeks": buckets,
            "employees": employees,
            "totals": {
                "total": len(tasks),
                "done": sum(e["done"] for e in employees),
                "overdue": sum(e["overdue"] for e in employees),
                "on_time_rate": round(on_time * 100 / judged) if judged else None,
            },
        })