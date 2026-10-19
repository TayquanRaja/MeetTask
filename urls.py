from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .analytics import AnalyticsView
from .views import AuditLogViewSet, DashboardView, NotificationViewSet

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("audit", AuditLogViewSet, basename="audit")

urlpatterns = [
    path("dashboard/", DashboardView.as_view()),
    path("analytics/", AnalyticsView.as_view()),
    path("", include(router.urls)),
]