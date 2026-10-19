from django.conf import settings
from django.core.mail import send_mail
from .models import AuditLog, Notification


def audit(actor, action, target=None, **detail):
    AuditLog.objects.create(
        actor=actor if getattr(actor, "pk", None) else None, action=action,
        target_type=target.__class__.__name__ if target is not None else "",
        target_id=str(target.pk) if target is not None else "", detail=detail)


def notify(user, kind, title, message="", link="", dedupe_key=None):
    """In-app notification always; email only if Gmail SMTP is configured. Never claims a send that didn't happen."""
    if dedupe_key and Notification.objects.filter(dedupe_key=dedupe_key).exists():
        return None
    n = Notification.objects.create(user=user, kind=kind, title=title, message=message,
                                    link=link, dedupe_key=dedupe_key)
    if settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD and user.email:
        try:
            send_mail(title, message or title, settings.DEFAULT_FROM_EMAIL, [user.email])
            n.email_status = "SENT"
        except Exception:
            n.email_status = "FAILED"
    else:
        n.email_status = "NOT_CONFIGURED"
    n.save(update_fields=["email_status"])
    return n