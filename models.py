from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "ADMIN"
        MANAGER = "MANAGER"
        EMPLOYEE = "EMPLOYEE"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.EMPLOYEE, db_index=True)
    department = models.CharField(max_length=100, blank=True, default="")
    job_title = models.CharField(max_length=100, blank=True, default="")
    phone = models.CharField(max_length=30, blank=True, default="")
    must_change_password = models.BooleanField(default=False)
    # Admin override for creating meetings. None = role default (managers yes, everyone else no).
    meeting_create_override = models.BooleanField(null=True, blank=True, default=None)

    @property
    def can_create_meetings(self):
        if self.meeting_create_override is not None:
            return self.meeting_create_override
        return self.role == self.Role.MANAGER

    @can_create_meetings.setter
    def can_create_meetings(self, value):
        self.meeting_create_override = bool(value)

    @property
    def display_name(self):
        return self.get_full_name() or self.username