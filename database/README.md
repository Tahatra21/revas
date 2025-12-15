# Revas Database Setup

This directory contains database schema and seed files for the Revas application.

## Files

- `schema.sql` - Complete database schema (tables, indexes, triggers)
- `seed.sql` - Sample data for development and testing

## Setup Instructions

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE revas_db;

# Exit psql
\q
```

### 2. Run Schema

```bash
# Apply schema
psql -U postgres -d revas_db -f database/schema.sql
```

### 3. Run Seed Data (Optional)

```bash
# Insert sample data
psql -U postgres -d revas_db -f database/seed.sql
```

### 4. Update .env.local

Update your `.env.local` file with the correct database connection string:

```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/revas_db
```

## Verify Installation

```bash
# Connect to database
psql -U postgres -d revas_db

# List tables
\dt

# Check sample data
SELECT * FROM master_sbu;
SELECT * FROM pipeline_potensi;
```

## Reset Database

If you need to reset the database:

```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE IF EXISTS revas_db;"
psql -U postgres -c "CREATE DATABASE revas_db;"
psql -U postgres -d revas_db -f database/schema.sql
psql -U postgres -d revas_db -f database/seed.sql
```
