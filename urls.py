from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ChangePasswordView, EmployeeListView, ForgotPasswordView, LoginView,
    MeView, ResetPasswordView, UserViewSet,
)

router = DefaultRouter()
router.register("users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", MeView.as_view()),
    path("auth/change-password/", ChangePasswordView.as_view()),
    path("auth/forgot-password/", ForgotPasswordView.as_view()),
    path("auth/reset-password/", ResetPasswordView.as_view()),
    path("employees/", EmployeeListView.as_view()),
    path("", include(router.urls)),
]