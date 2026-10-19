
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


# Security
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.getenv("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost").split(",")
    if host.strip()
]


# Applications
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "rest_framework",
    "corsheaders",
    "apps.accounts",
    "apps.core",
    "apps.meetings",
    "apps.tasks",
    "apps.projects",
    "apps.planner",
]


# Middleware
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
]


# Core configuration
ROOT_URLCONF = "config.urls"
TEMPLATES = []
AUTH_USER_MODEL = "accounts.User"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

USE_TZ = True
TIME_ZONE = "Asia/Karachi"


# Database
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    }
}


# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "PAGE_SIZE": 20,
}


# JWT authentication
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
}


# CORS
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173",
    ).split(",")
    if origin.strip()
]


# Private media storage
# Files are served through authorized API endpoints only.
PRIVATE_MEDIA_ROOT = BASE_DIR / "private_media"

MAX_AUDIO_MB = int(os.getenv("MAX_AUDIO_MB", "50"))
ALLOWED_AUDIO_EXT = {
    ".mp3",
    ".wav",
    ".m4a",
    ".ogg",
    ".webm",
}


# Proof-of-completion uploads
MAX_PROOF_MB = int(os.getenv("MAX_PROOF_MB", "20"))
MAX_PROOF_FILES = int(os.getenv("MAX_PROOF_FILES", "10"))

ALLOWED_PROOF_EXT = {
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
    ".txt",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
}


# AI and transcription
TRANSCRIBER = os.getenv("TRANSCRIBER", "dev")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")

AI_ADAPTER = os.getenv("AI_ADAPTER", "mock")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "")


EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = "tayquanraja@gmail.com"
EMAIL_HOST_PASSWORD = "wlvr ehzf vyih jrcs"
DEFAULT_FROM_EMAIL = "MeetTask <tayquanraja@gmail.com>"
FRONTEND_URL = "http://localhost:5173"