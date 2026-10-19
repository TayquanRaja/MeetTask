from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import MeetingViewSet, OutputViewSet

router = DefaultRouter()
router.register("meetings", MeetingViewSet, basename="meetings")
router.register("outputs", OutputViewSet, basename="outputs")
urlpatterns = [path("", include(router.urls))]