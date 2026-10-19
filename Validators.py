import re

from rest_framework.exceptions import ValidationError


def validate_strong_password(password):
    """Min 8 characters, with an uppercase letter, a lowercase letter, a number and a special character."""
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain an uppercase letter.")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain a lowercase letter.")
    if not re.search(r"\d", password):
        errors.append("Password must contain a number.")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("Password must contain a special character (for example ! @ # $ %).")
    if errors:
        raise ValidationError(errors)