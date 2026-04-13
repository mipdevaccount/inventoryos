# Backend Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Define default environment variables
ENV DATABASE_URL="postgresql://commander:CHANGE_ME_STRONG_PASSWORD@postgres:5432/commander_v3" \
    REDIS_URL="redis://redis:6379/0" \
    SECRET_KEY="your-secret-key-change-in-production" \
    JWT_ALGORITHM="HS256" \
    ACCESS_TOKEN_EXPIRE_MINUTES="30" \
    ENVIRONMENT="production" \
    DEBUG="false" \
    ADMIN_PASSWORD="admin123"

# Copy application code
COPY . .

# Create non-root user (Standard Baseline UID 1000)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check (Standard Baseline pattern)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
