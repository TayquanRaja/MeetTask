from rest_framework import serializers
from .models import Todo


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = ["id", "title", "due_date", "is_done", "done_at", "created_at"]
        read_only_fields = ["done_at", "created_at"]