import logging
import re
import secrets
import string
import unicodedata

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from apps.core.services import audit
from .models import User
from .permissions import IsAdmin, IsManager
from .serializers import LoginSerializer, ProfileSerializer, UserSerializer
from .Validators import validate_strong_password

log = logging.getLogger(__name__)

# No look-alike characters (0/O, 1/l/I)
_LOWER = "".join(c for c in string.ascii_lowercase if c != "l")
_UPPER = "".join(c for c in string.ascii_uppercase if c not in "IO")
_DIGITS = "".join(c for c in string.digits if c not in "01")
_SPECIAL = "!@#$%&*?"


def generate_password(length=12):
    """Random password that always satisfies the strong-password rules."""
    pools = [_LOWER, _UPPER, _DIGITS, _SPECIAL]
    chars = [secrets.choice(p) for p in pools]
    everything = "".join(pools)
    chars += [secrets.choice(everything) for _ in range(length - len(chars))]
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


def generate_username(first_name, last_name):
    """firstnamelastname + the next free number: johnsmith1, johnsmith2, ..."""
    raw = unicodedata.normalize("NFKD", f"{first_name}{last_name}").encode("ascii", "ignore").decode()
    base = re.sub(r"[^a-z0-9]", "", raw.lower()) or "user"
    pattern = re.compile(rf"^{re.escape(base)}(\d+)$")
    taken = User.objects.filter(username__istartswith=base).values_list("username", flat=True)
    nums = [int(m.group(1)) for m in (pattern.match(u.lower()) for u in taken) if m]
    return f"{base}{max(nums, default=0) + 1}"


def check_new_password(password, user):
    validate_strong_password(password)
    try:
        validate_password(password, user)
    except DjangoValidationError as e:
        raise ValidationError(list(e.messages))


def _send(subject, body, to):
    try:
        send_mail(subject, body, getattr(settings, "DEFAULT_FROM_EMAIL", None), [to], fail_silently=False)
        return True
    except Exception:
        log.exception("Could not send email to %s", to)
        return False


def send_credentials(user, password):
    """Email the username and temporary password. Returns True if the mail was sent."""
    login_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/") + "/login"
    body = (
        f"Hello {user.display_name},\n\n"
        "An account has been created for you.\n\n"
        f"Username: {user.username}\n"
        f"Temporary password: {password}\n"
        + f"\nSign in at: {login_url}\n"
        + "\nYou will be asked to choose a new password the first time you sign in."
        "\nPlease keep these details private.\n"
    )
    return _send("Your account details", body, user.email)


def send_reset_link(user, link):
    body = (
        f"Hello {user.display_name},\n\n"
        "We received a request to reset the password for your account "
        f"(username: {user.username}).\n\n"
        f"Reset your password here:\n{link}\n\n"
        "This link can be used once and expires after a short time. "
        "If you did not request this, you can ignore this email and your password will stay the same.\n"
    )
    return _send("Reset your password", body, user.email)


class ForgotThrottle(AnonRateThrottle):
    rate = "5/hour"


class ResetThrottle(AnonRateThrottle):
    rate = "20/hour"


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        """Users edit their own first name, last name, phone and department."""
        s = ProfileSerializer(request.user, data=request.data, partial=True)
        s.is_valid(raise_exception=True)
        s.save()
        audit(request.user, "PROFILE_UPDATED", request.user, fields=list(s.validated_data.keys()))
        return Response(UserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """Any signed-in user can change their own password. Clears the must_change_password flag."""

    def post(self, request):
        current = request.data.get("current_password", "")
        new = request.data.get("new_password", "")
        u = request.user
        if not u.check_password(current):
            raise ValidationError("Current password is incorrect.")
        if new == current:
            raise ValidationError("New password must be different from the current one.")
        check_new_password(new, u)
        u.set_password(new)
        u.must_change_password = False
        u.save(update_fields=["password", "must_change_password"])
        audit(u, "PASSWORD_CHANGED", u)
        return Response({"detail": "Password changed."})


class ForgotPasswordView(APIView):
    """Public. Emails a reset link to the account matching the username or email entered.
    Always returns the same response so it can't be used to discover which accounts exist."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ForgotThrottle]

    def post(self, request):
        ident = (request.data.get("identifier") or "").strip()
        if not ident:
            raise ValidationError("Enter your username or email.")
        qs = User.objects.filter(is_active=True)
        user = (qs.filter(email__iexact=ident) if "@" in ident else qs.filter(username__iexact=ident)).first()
        if user and user.email:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            send_reset_link(user, f"{base}/reset-password/{uid}/{token}")
        return Response({"detail": "Reset link sent. Check your email inbox."})


class ResetPasswordView(APIView):
    """Public. Sets a new password using the uid and token from the emailed link."""
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ResetThrottle]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        new = request.data.get("new_password", "")
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
        if not user or not user.is_active or not default_token_generator.check_token(user, token):
            raise ValidationError("This reset link is invalid or has expired. Request a new one.")
        check_new_password(new, user)
        user.set_password(new)
        user.must_change_password = False
        user.save(update_fields=["password", "must_change_password"])
        audit(user, "PASSWORD_RESET", user)
        return Response({"detail": "Password updated. You can sign in now."})


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = User.objects.all().order_by("username")
        q, role = self.request.query_params.get("q"), self.request.query_params.get("role")
        if q:
            qs = qs.filter(Q(username__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))
        if role:
            qs = qs.filter(role=role)
        return qs

    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        password = generate_password()
        first, last = s.validated_data["first_name"], s.validated_data["last_name"]
        user = None
        for _ in range(5):  # retry in the rare case two admins create the same name at once
            try:
                with transaction.atomic():
                    user = s.save(username=generate_username(first, last),
                                  password=password, must_change_password=True)
                break
            except IntegrityError:
                continue
        if user is None:
            raise ValidationError("Could not generate a unique username. Please try again.")
        audit(request.user, "USER_CREATED", user, role=user.role)
        sent = send_credentials(user, password)
        data = dict(self.get_serializer(user).data)
        data["email_sent"] = sent
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="next-username")
    def next_username(self, request):
        """Preview of the username that will be generated for this name (used by the create form)."""
        first = request.query_params.get("first_name", "")
        last = request.query_params.get("last_name", "")
        if not first.strip() or not last.strip():
            return Response({"username": ""})
        return Response({"username": generate_username(first, last)})

    def perform_update(self, s):
        if s.instance.role == "ADMIN":
            raise ValidationError("Admin accounts cannot be edited or deactivated here.")
        i = s.instance
        old = {"role": i.role, "is_active": i.is_active, "can_create_meetings": i.can_create_meetings}
        u = s.save()
        audit(self.request.user, "USER_UPDATED", u, old=old,
              new={"role": u.role, "is_active": u.is_active, "can_create_meetings": u.can_create_meetings})

    def perform_destroy(self, instance):
        raise ValidationError("Deactivate users instead of deleting them.")


class EmployeeListView(APIView):
    """Managers need a list of employees to add as participants (no emails or roles exposed)."""
    permission_classes = [IsManager]

    def get(self, request):
        qs = User.objects.filter(role="EMPLOYEE", is_active=True).order_by("first_name", "username")
        return Response([{"id": u.id, "name": u.display_name} for u in qs])