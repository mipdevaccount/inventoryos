# Commander V3 Database

PostgreSQL database for production deployment.

## Setup

### 1. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE commander_v3;
CREATE USER commander WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE commander_v3 TO commander;
\q
```

### 3. Set Environment Variable

```bash
export DATABASE_URL="postgresql://commander:your_secure_password@localhost/commander_v3"
```

Or add to `.env` file:
```
DATABASE_URL=postgresql://commander:your_secure_password@localhost/commander_v3
```

### 4. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Initialize Alembic

```bash
cd backend
alembic init alembic
```

### 6. Run Migrations

```bash
# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

### 7. Import CSV Data

```bash
python scripts/migrate_csv_to_db.py
```

## Database Schema

See `db/models/` for SQLAlchemy model definitions.

### Tables

- **products** - Product catalog
- **vendors** - Vendor directory
- **purchase_orders** - Purchase orders
- **po_items** - PO line items
- **jobs** - Manufacturing jobs
- **bom** - Bill of materials
- **consumption_history** - Historical consumption data
- **vendor_performance** - Vendor delivery tracking
- **reorder_recommendations** - Cached ML recommendations

## Alembic Commands

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

## Backup & Restore

### Backup
```bash
pg_dump commander_v3 > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
psql commander_v3 < backup_20250130.sql
```
