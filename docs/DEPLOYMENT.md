# Revas Production Deployment Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed
- SSL/TLS certificates
- Domain name configured

## Step 1: Server Setup

### 1.1 Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx (for reverse proxy)
sudo apt install -y nginx
```

### 1.2 Create Database
```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE revas_db;
CREATE USER revas_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE revas_db TO revas_user;
\q
```

## Step 2: Application Deployment

### 2.1 Clone and Setup
```bash
# Create application directory
sudo mkdir -p /var/www/revas
cd /var/www/revas

# Upload your deployment package
# Extract the package
tar -xzf revas-production-*.tar.gz

# Install dependencies
npm ci --production
```

### 2.2 Configure Environment
```bash
# Copy production environment file
cp .env.production.example .env.production

# Edit with production values
nano .env.production
```

**Required Changes:**
- `DATABASE_URL`: Update with production database credentials
- `JWT_SECRET`: Generate a strong random secret (min 32 chars)
- `NEXT_PUBLIC_BASE_URL`: Your production domain

### 2.3 Setup Database Schema
```bash
# Run schema
psql -U revas_user -d revas_db -f database/schema.sql

# Run auth schema
psql -U revas_user -d revas_db -f database/auth.sql

# Run seed data (optional for production)
psql -U revas_user -d revas_db -f database/seed.sql
```

## Step 3: Security Configuration

### 3.1 Change Default Admin Password
```bash
# Login to PostgreSQL
psql -U revas_user -d revas_db

# Update admin password (use bcrypt hash)
UPDATE users 
SET password_hash = '$2b$10$YOUR_BCRYPT_HASH_HERE'
WHERE username = 'admin';
```

### 3.2 Configure Firewall
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Step 4: Nginx Configuration

### 4.1 Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/revas
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/revas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 5: Process Management

### 5.1 Create Systemd Service
```bash
sudo nano /etc/systemd/system/revas.service
```

**Service Configuration:**
```ini
[Unit]
Description=Revas Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/revas
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5.2 Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable revas
sudo systemctl start revas
sudo systemctl status revas
```

## Step 6: Monitoring & Logging

### 6.1 Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/revas
```

```
/var/www/revas/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 6.2 Monitor Application
```bash
# View logs
sudo journalctl -u revas -f

# Check status
sudo systemctl status revas

# Restart if needed
sudo systemctl restart revas
```

## Step 7: Backup Strategy

### 7.1 Database Backup Script
```bash
#!/bin/bash
# /var/www/revas/scripts/backup-db.sh

BACKUP_DIR="/var/backups/revas"
DATE=$(date +%Y%m%d-%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -U revas_user revas_db | gzip > $BACKUP_DIR/revas-db-$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "revas-db-*.sql.gz" -mtime +30 -delete
```

### 7.2 Setup Cron Job
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /var/www/revas/scripts/backup-db.sh
```

## Step 8: SSL/TLS with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Step 9: Performance Optimization

### 9.1 Enable Gzip Compression
Add to Nginx config:
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
```

### 9.2 PostgreSQL Optimization
```sql
-- Increase shared buffers
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Reload configuration
SELECT pg_reload_conf();
```

## Step 10: Health Checks

### 10.1 Create Health Check Endpoint
Already available at: `GET /api/auth/me`

### 10.2 Setup Monitoring
```bash
# Install monitoring tool (example: Uptime Kuma)
# Or use external service like UptimeRobot
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
sudo journalctl -u revas -n 50

# Check environment variables
cat /var/www/revas/.env.production

# Check Node.js version
node --version
```

### Database Connection Issues
```bash
# Test connection
psql -U revas_user -d revas_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## Security Checklist

- [ ] Changed default admin password
- [ ] JWT_SECRET is strong and random (32+ chars)
- [ ] Database password is strong
- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] Monitoring setup
- [ ] Rate limiting enabled
- [ ] Security headers configured

## Maintenance

### Update Application
```bash
cd /var/www/revas
sudo systemctl stop revas
npm ci --production
npm run build
sudo systemctl start revas
```

### Database Maintenance
```bash
# Vacuum database
psql -U revas_user -d revas_db -c "VACUUM ANALYZE;"

# Check database size
psql -U revas_user -d revas_db -c "SELECT pg_size_pretty(pg_database_size('revas_db'));"
```

## Support

For issues or questions:
- Check logs: `sudo journalctl -u revas -f`
- Review documentation in `/docs` directory
- Contact system administrator

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Version:** 1.0.0
