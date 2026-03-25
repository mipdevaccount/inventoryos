"""
Celery configuration for background tasks
"""
from celery import Celery
from celery.schedules import crontab
import os

# Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "commander",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.recommendations", "tasks.maintenance"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Scheduled tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Generate recommendations every 6 hours
    "generate-recommendations": {
        "task": "tasks.recommendations.generate_all_recommendations",
        "schedule": crontab(minute=0, hour="*/6"),  # Every 6 hours
    },
    # Update vendor performance daily
    "update-vendor-performance": {
        "task": "tasks.maintenance.update_vendor_metrics",
        "schedule": crontab(minute=0, hour=2),  # 2 AM daily
    },
    # Cleanup expired cache hourly
    "cleanup-cache": {
        "task": "tasks.maintenance.cleanup_expired_cache",
        "schedule": crontab(minute=0),  # Every hour
    },
}

if __name__ == "__main__":
    celery_app.start()
