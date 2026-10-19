from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BacklogViewSet, ProjectViewSet

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="projects")
router.register("backlog", BacklogViewSet, basename="backlog")
urlpatterns = [path("", include(router.urls))]