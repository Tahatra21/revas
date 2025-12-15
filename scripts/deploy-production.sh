#!/bin/bash

# Revas Production Deployment Script
# This script prepares the application for production deployment

set -e

echo "🚀 Revas Production Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found. Creating from template...${NC}"
    cp .env.example .env.production
    echo -e "${YELLOW}⚠️  Please update .env.production with production values before continuing!${NC}"
    exit 1
fi

# Check required environment variables
echo "📋 Checking environment variables..."
required_vars=("DATABASE_URL" "JWT_SECRET" "NEXT_PUBLIC_APP_NAME")
missing_vars=()

for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.production; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required environment variables:${NC}"
    printf '%s\n' "${missing_vars[@]}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables OK${NC}"

# Check JWT_SECRET strength
echo "🔒 Checking JWT_SECRET strength..."
jwt_secret=$(grep "^JWT_SECRET=" .env.production | cut -d '=' -f2)
if [ ${#jwt_secret} -lt 32 ]; then
    echo -e "${RED}❌ JWT_SECRET must be at least 32 characters long${NC}"
    exit 1
fi
echo -e "${GREEN}✅ JWT_SECRET strength OK${NC}"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Run TypeScript type check
echo "🔍 Running TypeScript type check..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript errors found. Please fix before deploying.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ TypeScript check passed${NC}"

# Build the application
echo "🏗️  Building production bundle..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf revas-production-$(date +%Y%m%d-%H%M%S).tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.ts \
    .env.production

echo -e "${GREEN}✅ Deployment package created${NC}"

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Production build complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Upload the .tar.gz file to your production server"
echo "2. Extract: tar -xzf revas-production-*.tar.gz"
echo "3. Install dependencies: npm ci --production"
echo "4. Setup database: psql -U postgres -d revas_db -f database/schema.sql"
echo "5. Run seed data: psql -U postgres -d revas_db -f database/seed.sql"
echo "6. Start the application: npm start"
echo ""
echo "⚠️  Remember to:"
echo "- Change default admin password after first login"
echo "- Setup SSL/TLS certificates"
echo "- Configure firewall rules"
echo "- Setup monitoring and logging"
echo "======================================"
