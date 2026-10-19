from django.urls import include, path

urlpatterns = [
    path("api/", include("apps.accounts.urls")),
    path("api/", include("apps.core.urls")),
    path("api/", include("apps.meetings.urls")),
    path("api/", include("apps.tasks.urls")),
    path("api/", include("apps.projects.urls")),
    path("api/", include("apps.planner.urls")),
]