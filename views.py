from django.db import transaction
from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from apps.accounts.permissions import IsManager
from apps.core.services import audit
from apps.tasks.models import Task
from .models import BacklogItem, Project
from .serializers import BacklogSerializer, ProjectDetailSerializer, ProjectSerializer
from .services import resolve_assignee, sync_task


def fresh(item):
    return BacklogItem.objects.select_related("task__assignee").get(pk=item.pk)


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsManager]
    pagination_class = None
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_serializer_class(self):
        return ProjectDetailSerializer if self.action == "retrieve" else ProjectSerializer

    def get_queryset(self):
        qs = Project.objects.filter(manager=self.request.user).prefetch_related(
            Prefetch("tasks", queryset=Task.objects.select_related("assignee", "meeting", "project", "approved_by")),
            "backlog__task", "meetings")
        st = self.request.query_params.get("status")
        return qs.filter(status=st) if st else qs

    def perform_create(self, s):
        p = s.save(manager=self.request.user)
        audit(self.request.user, "PROJECT_CREATED", p)

    def perform_update(self, s):
        p = s.save()
        audit(self.request.user, "PROJECT_UPDATED", p)

    @action(detail=True, methods=["post"], url_path="backlog")
    def add_item(self, request, pk=None):
        p = self.get_object()
        s = BacklogSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        assignee = resolve_assignee(request.data.get("assignee_id"))
        with transaction.atomic():
            item = s.save(project=p)
            sync_task(item, assignee, request.user)
        audit(request.user, "BACKLOG_CREATED", item)
        return Response(BacklogSerializer(fresh(item)).data, status=201)


class BacklogViewSet(viewsets.GenericViewSet):
    permission_classes = [IsManager]
    serializer_class = BacklogSerializer

    def get_queryset(self):
        return BacklogItem.objects.filter(project__manager=self.request.user).select_related("project", "task__assignee")

    def partial_update(self, request, pk=None):
        item = self.get_object()
        s = BacklogSerializer(item, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        task = getattr(item, "task", None)
        if "assignee_id" in request.data:
            assignee = resolve_assignee(request.data["assignee_id"])
        else:
            assignee = task.assignee if task else None
        with transaction.atomic():
            item = s.save()
            sync_task(item, assignee, request.user)
        return Response(BacklogSerializer(fresh(item)).data)

    def destroy(self, request, pk=None):
        item = self.get_object()
        if getattr(item, "task", None) is not None:
            raise ValidationError("Assigned items cannot be deleted.")
        item.delete()
        return Response(status=204)