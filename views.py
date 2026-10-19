import mimetypes
import os
from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import URLValidator
from django.db import transaction
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from apps.core.services import audit, notify
from .models import ProofFile, Task, TaskEvent, TaskProof
from .serializers import TaskSerializer

EMPLOYEE_FIELDS = {"status"}
ORDERINGS = {"deadline", "-deadline", "priority", "-priority", "status", "-status",
             "created_at", "-created_at"}
# Actions that return the full task, including its proof history.
DETAIL_ACTIONS = {"retrieve", "submit_proof", "withdraw_proof", "approve_proof", "request_changes"}


def _clean_link(raw):
    link = (raw or "").strip()
    if not link:
        return ""
    if len(link) > 500:
        raise ValidationError("The link is too long (max 500 characters).")
    try:
        URLValidator(schemes=["http", "https"])(link)
    except DjangoValidationError:
        raise ValidationError("Enter a valid link that starts with http:// or https://.")
    return link


def _check_files(files):
    if len(files) > settings.MAX_PROOF_FILES:
        raise ValidationError(f"Attach at most {settings.MAX_PROOF_FILES} files at a time.")
    for f in files:
        ext = os.path.splitext(f.name)[1].lower()
        if ext not in settings.ALLOWED_PROOF_EXT:
            raise ValidationError(f"'{os.path.basename(f.name)}' is not an allowed file type. "
                                  f"Allowed: {', '.join(sorted(settings.ALLOWED_PROOF_EXT))}")
        if f.size == 0:
            raise ValidationError(f"'{os.path.basename(f.name)}' is empty.")
        if f.size > settings.MAX_PROOF_MB * 1024 * 1024:
            raise ValidationError(f"'{os.path.basename(f.name)}' is too large. Max {settings.MAX_PROOF_MB} MB per file.")


def _require_role(user, role, message):
    if user.role != role:
        raise PermissionDenied(message)


class TaskViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = TaskSerializer
    # "post" is only used by the proof actions below. Tasks themselves are still never created or deleted here.
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        u = self.request.user
        if u.role == "MANAGER":
            qs = Task.objects.for_manager(u)
        elif u.role == "EMPLOYEE":
            qs = Task.objects.filter(assignee=u)
        else:
            return Task.objects.none()
        p = self.request.query_params
        if p.get("status"):
            qs = qs.filter(status=p["status"])
        if p.get("priority"):
            qs = qs.filter(priority=p["priority"])
        if p.get("q"):
            qs = qs.filter(title__icontains=p["q"])
        if p.get("overdue") == "1":
            qs = qs.exclude(status__in=["DONE", "IN_REVIEW"]).filter(deadline__lt=timezone.localdate())
        if p.get("meeting"):
            qs = qs.filter(meeting_id=p["meeting"])
        if p.get("project"):
            qs = qs.filter(project_id=p["project"])
        ordering = p.get("ordering", "deadline")
        if ordering not in ORDERINGS:
            ordering = "deadline"
        return qs.select_related("assignee", "meeting", "project", "approved_by").order_by(ordering, "-id")

    def get_serializer_context(self):
        return {**super().get_serializer_context(), "detail": self.action in DETAIL_ACTIONS}

    def _locked(self):
        """The task the URL points to (permission-checked), re-read with a row lock inside a transaction."""
        task = self.get_object()
        return Task.objects.select_for_update(of=("self",)).select_related("assignee", "meeting", "project").get(pk=task.pk)

    def partial_update(self, request, *a, **kw):
        task, u = self.get_object(), request.user
        data = request.data
        if u.role == "EMPLOYEE" and not set(data.keys()) <= EMPLOYEE_FIELDS:
            raise PermissionDenied("Employees can only update task status.")
        if u.role == "MANAGER" and "status" in data:
            raise PermissionDenied("Only the assigned employee can change task status.")
        if u.role == "EMPLOYEE" and "status" in data:
            new_status = data.get("status")
            if task.status == "IN_REVIEW" and new_status != "IN_REVIEW":
                raise ValidationError("This task is waiting for your manager's review. Withdraw your proof first if you need to change it.")
            if new_status == "IN_REVIEW":
                raise ValidationError("Use 'Submit for review' to send proof to your manager.")
            if new_status == "DONE" and task.proof_required:
                raise ValidationError("This task needs proof. Submit proof so your manager can approve it.")
        s = self.get_serializer(task, data=data, partial=True)
        s.is_valid(raise_exception=True)
        old_status, old_assignee = task.status, task.assignee_id
        new_assignee = s.validated_data.get("assignee")
        if new_assignee and new_assignee.id != old_assignee:
            if task.status == "DONE":
                raise ValidationError("Completed tasks cannot be reassigned.")
            if task.status == "IN_REVIEW":
                raise ValidationError("This task is waiting for proof review. Approve it or ask for changes before reassigning.")
            if task.meeting_id:
                if not task.meeting.links.filter(user=new_assignee).exists():
                    raise ValidationError("Assignee must be a participant of the meeting.")
            elif new_assignee.role != "EMPLOYEE" or not new_assignee.is_active:
                raise ValidationError("Assignee must be an active employee.")
        t = s.save()
        if t.status != old_status:
            t.completed_at = timezone.now() if t.status == "DONE" else None
            t.save(update_fields=["completed_at"])
            TaskEvent.objects.create(task=t, actor=u, description=f"Status: {old_status} → {t.status}")
            audit(u, "TASK_STATUS", t, old=old_status, new=t.status)
            if t.status == "DONE":
                notify(t.owner, "TASK_DONE", f"Completed: {t.title}",
                       f"By {t.assignee.display_name}", f"/tasks/{t.id}")
        if t.assignee_id != old_assignee:
            TaskEvent.objects.create(task=t, actor=u, description=f"Reassigned to {t.assignee.display_name}")
            audit(u, "TASK_REASSIGNED", t, to=t.assignee_id)
            notify(t.assignee, "TASK_ASSIGNED", f"New task: {t.title}", "", f"/tasks/{t.id}")
        if "proof_required" in data and s.validated_data.get("proof_required") is not None:
            audit(u, "TASK_PROOF_REQUIRED", t, value=t.proof_required)
        if t.backlog_item_id:  # keep the backlog item in sync
            bi = t.backlog_item
            bi.deadline, bi.priority = t.deadline, t.priority
            bi.save(update_fields=["deadline", "priority"])
        return Response(self.get_serializer(t).data)

    # ---- proof of completion -------------------------------------------------

    @action(detail=True, methods=["post"], url_path="submit-proof", parser_classes=[MultiPartParser, FormParser])
    def submit_proof(self, request, pk=None):
        u = request.user
        _require_role(u, "EMPLOYEE", "Only the assigned employee can submit proof.")
        files = request.FILES.getlist("files")
        link = _clean_link(request.data.get("link"))
        note = (request.data.get("note") or "").strip()
        if len(note) > 2000:
            raise ValidationError("The note is too long (max 2000 characters).")
        if not files and not link:
            raise ValidationError("Add at least one file or a link as proof.")
        _check_files(files)
        with transaction.atomic():
            task = self._locked()
            if task.status == "DONE":
                raise ValidationError("This task is already completed.")
            if task.status == "IN_REVIEW":
                raise ValidationError("Your proof is already waiting for review. Withdraw it first to send a new one.")
            proof = TaskProof.objects.create(task=task, submitted_by=u, note=note, link=link)
            for f in files:
                name = os.path.basename(f.name)[:200]
                ProofFile.objects.create(
                    proof=proof, file=f, name=name, size=f.size,
                    content_type=mimetypes.guess_type(name)[0] or "application/octet-stream")
            old = task.status
            task.status = "IN_REVIEW"
            task.completed_at = None
            task.save(update_fields=["status", "completed_at"])
            what = f"{len(files)} file{'s' if len(files) != 1 else ''}" + (" and a link" if link and files else "")
            TaskEvent.objects.create(task=task, actor=u, description=f"Proof submitted ({what or 'a link'}). Status: {old} → IN_REVIEW")
            audit(u, "PROOF_SUBMITTED", task, proof=proof.id, files=len(files), has_link=bool(link))
            notify(task.owner, "PROOF_SUBMITTED", f"Proof submitted: {task.title}",
                   f"{task.assignee.display_name} sent {what or 'a link'} for your review.",
                   f"/tasks/{task.id}", dedupe_key=f"proof-submitted-{proof.id}")
        return Response(self.get_serializer(task).data, status=201)

    @action(detail=True, methods=["post"], url_path="withdraw-proof")
    def withdraw_proof(self, request, pk=None):
        u = request.user
        _require_role(u, "EMPLOYEE", "Only the assigned employee can withdraw proof.")
        with transaction.atomic():
            task = self._locked()
            if task.status != "IN_REVIEW":
                raise ValidationError("There is no proof waiting for review on this task.")
            proof = task.proofs.filter(status="SUBMITTED").first()
            if proof:
                proof.status = "WITHDRAWN"
                proof.save(update_fields=["status"])
            task.status = "IN_PROGRESS"
            task.save(update_fields=["status"])
            TaskEvent.objects.create(task=task, actor=u, description="Proof withdrawn. Status: IN_REVIEW → IN_PROGRESS")
            audit(u, "PROOF_WITHDRAWN", task, proof=proof.id if proof else None)
            notify(task.owner, "PROOF_WITHDRAWN", f"Proof withdrawn: {task.title}",
                   f"{task.assignee.display_name} took the proof back to edit it.", f"/tasks/{task.id}")
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["post"], url_path="approve-proof")
    def approve_proof(self, request, pk=None):
        u = request.user
        _require_role(u, "MANAGER", "Only the manager can approve proof.")
        comment = (request.data.get("comment") or "").strip()[:2000]
        with transaction.atomic():
            task = self._locked()
            proof = task.proofs.filter(status="SUBMITTED").first()
            if task.status != "IN_REVIEW" or not proof:
                raise ValidationError("There is no proof waiting for review on this task.")
            now = timezone.now()
            proof.status, proof.reviewed_by, proof.reviewed_at, proof.review_comment = "APPROVED", u, now, comment
            proof.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])
            task.status, task.completed_at = "DONE", now
            task.save(update_fields=["status", "completed_at"])
            TaskEvent.objects.create(task=task, actor=u, description="Proof approved. Status: IN_REVIEW → DONE")
            audit(u, "PROOF_APPROVED", task, proof=proof.id)
            notify(task.assignee, "PROOF_APPROVED", f"Approved: {task.title}",
                   comment or f"{u.display_name} approved your proof. The task is closed.", f"/tasks/{task.id}")
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["post"], url_path="request-changes")
    def request_changes(self, request, pk=None):
        u = request.user
        _require_role(u, "MANAGER", "Only the manager can request changes.")
        comment = (request.data.get("comment") or "").strip()[:2000]
        if not comment:
            raise ValidationError("Tell the employee what needs to change.")
        with transaction.atomic():
            task = self._locked()
            proof = task.proofs.filter(status="SUBMITTED").first()
            if task.status != "IN_REVIEW" or not proof:
                raise ValidationError("There is no proof waiting for review on this task.")
            proof.status, proof.reviewed_by, proof.reviewed_at, proof.review_comment = "CHANGES_REQUESTED", u, timezone.now(), comment
            proof.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])
            task.status = "IN_PROGRESS"
            task.save(update_fields=["status"])
            TaskEvent.objects.create(task=task, actor=u, description="Changes requested on proof. Status: IN_REVIEW → IN_PROGRESS")
            audit(u, "PROOF_CHANGES_REQUESTED", task, proof=proof.id)
            notify(task.assignee, "PROOF_CHANGES", f"Changes requested: {task.title}", comment, f"/tasks/{task.id}")
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["get"], url_path=r"proof-files/(?P<file_id>[0-9]+)")
    def proof_file(self, request, pk=None, file_id=None):
        task = self.get_object()  # only the assignee and the task's manager can reach this
        pf = ProofFile.objects.filter(pk=file_id, proof__task=task).first()
        if not pf:
            raise Http404
        try:
            handle = pf.file.open("rb")
        except (FileNotFoundError, ValueError):
            raise Http404
        if request.user.role == "MANAGER":
            audit(request.user, "PROOF_FILE_VIEWED", task, file=pf.id)
        resp = FileResponse(handle, as_attachment=True, filename=pf.name,
                            content_type=pf.content_type or "application/octet-stream")
        resp["X-Content-Type-Options"] = "nosniff"
        return resp
