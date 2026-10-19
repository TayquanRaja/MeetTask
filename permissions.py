from rest_framework.permissions import BasePermission


def role_required(*roles):
    class RolePermission(BasePermission):
        def has_permission(self, request, view):
            u = request.user
            return bool(u and u.is_authenticated and u.is_active and u.role in roles)
    return RolePermission


IsAdmin = role_required("ADMIN")
IsManager = role_required("MANAGER")
IsMember = role_required("MANAGER", "EMPLOYEE")


class CanCreateMeetings(BasePermission):
    """Managers by default; admins can grant or revoke this per user (employees included)."""

    message = "You do not have permission to create meetings."

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.is_active and u.can_create_meetings)