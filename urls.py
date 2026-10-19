from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CalendarView, TodoViewSet

router = DefaultRouter()
router.register("todos", TodoViewSet, basename="todos")
urlpatterns = [path("calendar/", CalendarView.as_view()), path("", include(router.urls))]