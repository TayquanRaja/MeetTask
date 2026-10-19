import os
from django.conf import settings
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsManager
from apps.core.services import audit
from .models import AIOutput, Meeting
from .serializers import MeetingSerializer, OutputSerializer
from .services import approval, pipeline


class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    http_method_names = ["get", "post", "put", "patch", "head", "options"]  # no delete

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "upload_audio"):
            return [IsManager()]
        return [IsAuthenticated()]

    def get_queryset(self):
        u, qs = self.request.user, Meeting.objects.all()
        if u.role == "MANAGER":
            qs = qs.filter(manager=u)
        elif u.role == "EMPLOYEE":
            qs = qs.filter(participants=u)
        else:
            return Meeting.objects.none()
        q, st = self.request.query_params.get("q"), self.request.query_params.get("status")
        if q:
            qs = qs.filter(title__icontains=q)
        if st:
            qs = qs.filter(status=st)
        return qs.distinct()

    def perform_create(self, s):
        m = s.save()
        audit(self.request.user, "MEETING_CREATED", m)

    @action(detail=True, methods=["post"], url_path="upload-audio")
    def upload_audio(self, request, pk=None):
        m = self.get_object()
        f = request.FILES.get("audio")
        if not f:
            raise ValidationError("No audio file provided (field name: 'audio').")
        ext = os.path.splitext(f.name)[1].lower()
        if ext not in settings.ALLOWED_AUDIO_EXT:
            raise ValidationError(f"Unsupported format. Allowed: {', '.join(sorted(settings.ALLOWED_AUDIO_EXT))}")
        if f.size > settings.MAX_AUDIO_MB * 1024 * 1024:
            raise ValidationError(f"File too large. Max {settings.MAX_AUDIO_MB} MB.")
        if m.status == "PROCESSING":
            raise ValidationError("Already processing.")
        if m.status == "APPROVED":
            raise ValidationError("Approved meetings cannot be reprocessed.")
        if not m.links.exists():
            raise ValidationError("Add at least one participant first.")
        m.audio.save(f"meeting_{m.id}{ext}", f)
        m.status = "PROCESSING"
        m.save(update_fields=["status"])
        audit(request.user, "AUDIO_UPLOADED", m, size=f.size)
        pipeline.start(m.id)
        return Response({"status": "PROCESSING"}, status=202)

    @action(detail=True, methods=["get"])
    def transcript(self, request, pk=None):
        m = self.get_object()
        t = getattr(m, "transcript", None)
        if not t:
            return Response({"available": False})
        u = request.user
        if u.role == "MANAGER":
            audit(u, "TRANSCRIPT_VIEWED", m)
            return Response({"available": True, "source": t.source,
                             "original": t.original_text, "sanitized": t.sanitized_text})
        if m.is_confidential:
            raise PermissionDenied("Transcript of a confidential meeting is restricted to the manager.")
        return Response({"available": True, "source": t.source, "sanitized": t.sanitized_text})

    @action(detail=True, methods=["get"])
    def output(self, request, pk=None):
        m = self.get_object()
        qs = m.outputs.all()
        if request.user.role != "MANAGER":
            qs = qs.filter(status="APPROVED")
        o = qs.first()
        return Response(OutputSerializer(o).data if o else None)


class OutputViewSet(viewsets.GenericViewSet):
    serializer_class = OutputSerializer
    permission_classes = [IsManager]

    def get_queryset(self):
        return AIOutput.objects.filter(meeting__manager=self.request.user)

    def partial_update(self, request, pk=None):
        o = self.get_object()
        if o.status != "PENDING_REVIEW":
            raise ValidationError("Only outputs pending review can be edited.")
        s = self.get_serializer(o, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        audit(request.user, "OUTPUT_EDITED", o, fields=list(s.validated_data.keys()))
        return Response(s.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        o = self.get_object()
        out, created = approval.approve(o.pk, request.user)
        return Response({"status": out.status, "tasks_created": created})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        o = self.get_object()
        approval.reject(o.pk, request.user, request.data.get("reason", ""))
        return Response({"status": "REJECTED"})

    @action(detail=True, methods=["post"])
    def resubmit(self, request, pk=None):
        o = self.get_object()
        approval.resubmit(o.pk, request.user)
        return Response({"status": "PENDING_REVIEW"})