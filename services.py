from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.accounts.models import User
from apps.core.services import audit, notify
from apps.tasks.models import Task, TaskEvent


def resolve_assignee(val):
    if val in (None, ""):
        return None
    try:
        return User.objects.get(pk=int(val), role="EMPLOYEE", is_active=True)
    except (User.DoesNotExist, ValueError, TypeError):
        raise ValidationError({"assignee_id": "Choose an active employee."})


def sync_task(item, assignee, actor):
    """Create the task on first assignment, or push edits and reassignment to the existing task."""
    task = getattr(item, "task", None)
    if task is None:
        if assignee is None:
            return None
        task = Task.objects.create(
            project=item.project, backlog_item=item, title=item.title, description=item.description,
            assignee=assignee, deadline=item.deadline, priority=item.priority,
            approved_by=actor, approved_at=timezone.now())
        TaskEvent.objects.create(task=task, actor=actor, description="Task created from project backlog")
        notify(assignee, "TASK_ASSIGNED", f"New task: {task.title}", f"Project: {item.project.name}",
               f"/tasks/{task.id}", dedupe_key=f"assigned-{task.id}")
        audit(actor, "BACKLOG_ASSIGNED", item, task=task.id, assignee=assignee.id)
        return task
    if assignee is None:
        raise ValidationError("An assigned item cannot be unassigned.")
    changed = task.assignee_id != assignee.id
    if changed and task.status == "DONE":
        raise ValidationError("Completed tasks cannot be reassigned.")
    if changed and task.status == "IN_REVIEW":
        raise ValidationError("This task is waiting for proof review. Approve it or ask for changes before reassigning.")
    task.title, task.description = item.title, item.description
    task.deadline, task.priority = item.deadline, item.priority
    if changed:
        task.assignee = assignee
    task.save()
    if changed:
        TaskEvent.objects.create(task=task, actor=actor, description=f"Reassigned to {assignee.display_name}")
        notify(assignee, "TASK_ASSIGNED", f"New task: {task.title}", f"Project: {item.project.name}", f"/tasks/{task.id}")
        audit(actor, "TASK_REASSIGNED", task, to=assignee.id)
    return task