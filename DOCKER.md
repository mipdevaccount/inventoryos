# Commander V3 - Docker Deployment Guide

## Quick Start

### Development Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### Production Environment

```bash
# Copy and configure environment
cp .env.production .env
# Edit .env with production values

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | React application (nginx) |
| Backend | 8000 | FastAPI application |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache & message queue |
| Celery Worker | - | Background job processor |
| Celery Beat | - | Task scheduler |

## Initial Setup

### 1. Run Database Migrations

```bash
# Access backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Import CSV data
python scripts/migrate_csv_to_db.py

# Create admin user
python scripts/create_admin.py

# Exit container
exit
```

### 2. Verify Services

```bash
# Check all services are healthy
docker-compose ps

# Test backend API
curl http://localhost:8000/health

# Test frontend
curl http://localhost/
```

### 3. Login

- Navigate to `http://localhost`
- Login with:
  - Email: `admin@commander.com`
  - Password: `admin123`
- **Change password immediately!**

## Database Management

### Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U commander commander_v3 > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
docker-compose exec -T postgres psql -U commander commander_v3 < backup_20250130.sql
```

### Access Database

```bash
# PostgreSQL shell
docker-compose exec postgres psql -U commander commander_v3
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f celery-worker

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df
```

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend python -c "from db.database import engine; print(engine.connect())"
```

### Celery Jobs Not Running

```bash
# Check worker logs
docker-compose logs celery-worker

# Check beat scheduler
docker-compose logs celery-beat

# Verify Redis connection
docker-compose exec redis redis-cli ping
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U commander
```

## Scaling

### Scale Celery Workers

```bash
# Run 4 worker instances
docker-compose up -d --scale celery-worker=4
```

### Scale Backend API

```bash
# Run 3 backend instances (requires load balancer)
docker-compose up -d --scale backend=3
```

## Security

### Production Checklist

- [ ] Change all default passwords
- [ ] Set strong `SECRET_KEY` (32+ characters)
- [ ] Enable HTTPS (add SSL certificates)
- [ ] Set `DEBUG=false`
- [ ] Configure firewall rules
- [ ] Enable Redis password authentication
- [ ] Regular security updates
- [ ] Automated backups

### Generate Secure Keys

```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate passwords
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

## Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild containers
docker-compose up -d --build

# Run new migrations
docker-compose exec backend alembic upgrade head
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Performance Tuning

### PostgreSQL

Edit `docker-compose.yml` to add PostgreSQL configuration:

```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### Redis

```yaml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Celery

```yaml
celery-worker:
  command: celery -A celery_config worker --concurrency=4 --max-tasks-per-child=1000
```

## Health Checks

All services include health checks:

```bash
# Check service health
docker-compose ps

# Manually trigger health check
docker-compose exec backend python -c "import requests; print(requests.get('http://localhost:8000/health').json())"
```

## Development Tips

### Hot Reload

Development docker-compose includes volume mounts for hot reload:
- Backend code changes reload automatically
- Frontend requires rebuild (`docker-compose up -d --build frontend`)

### Access Container Shell

```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec postgres bash
```

### Run Tests

```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
docker-compose exec frontend npm test
```

---

**For production deployment, see `DEPLOYMENT.md`**
