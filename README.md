# Revas Application - README

**Revenue Monitoring Application for PLN Group**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)]()
[![Production Ready](https://img.shields.io/badge/production-ready-success)]()

---

## 🎯 Overview

Revas adalah aplikasi monitoring revenue yang komprehensif untuk PLN Group dalam melacak, mengelola, dan menganalisis operasi revenue di berbagai Strategic Business Unit (SBU).

### Key Features
- 📊 Real-time dashboard dengan KPI dan charts
- 🔄 Complete pipeline management workflow
- 💰 Revenue target dan actual tracking
- 📁 Master data management
- 🔐 JWT authentication dengan protected routes
- 🔔 Toast notifications
- 📱 Responsive dark theme UI

---

## 🔄 Application Flow

### 1. Authentication Flow

```mermaid
graph TD
    A[User Access App] --> B{Authenticated?}
    B -->|No| C[Redirect to /login]
    B -->|Yes| D[Access Dashboard]
    C --> E[Enter Credentials]
    E --> F[POST /api/auth/login]
    F --> G{Valid?}
    G -->|Yes| H[Store JWT Token]
    G -->|No| I[Show Error]
    H --> D
    I --> E
    D --> J[Protected Routes]
```

**Penjelasan:**
1. User mengakses aplikasi
2. Protected Route memeriksa JWT token di localStorage
3. Jika tidak ada token → redirect ke `/login`
4. User login dengan username/password
5. API memvalidasi credentials dengan bcrypt
6. Jika valid → generate JWT token
7. Token disimpan di localStorage
8. User diarahkan ke dashboard

---

### 2. Dashboard Flow

```mermaid
graph LR
    A[Dashboard Page] --> B[Fetch Summary API]
    A --> C[Fetch Full Dashboard API]
    B --> D[Display KPI Cards]
    C --> E[Display Charts]
    C --> F[Display Top Customers]
    G[Year Selector] --> B
    G --> C
```

**Penjelasan:**
1. Dashboard load → fetch data dari 2 API endpoints
2. `/api/dashboard/summary` → KPI data (Target, Realization, Achievement, Pipeline)
3. `/api/dashboard/full` → Charts data (Monthly Revenue, Pipeline by Color, Top Customers)
4. User bisa filter berdasarkan tahun
5. Data di-refresh otomatis saat tahun berubah

---

### 3. Pipeline Management Flow

```mermaid
graph TD
    A[Pipeline List] --> B[Search/Filter]
    A --> C[Create New]
    A --> D[View Details]
    B --> E[GET /api/pipeline?filters]
    C --> F[Pipeline Form]
    F --> G[POST /api/pipeline]
    G --> H[Redirect to Detail]
    D --> I[GET /api/pipeline/:id]
    I --> J[Edit Mode]
    I --> K[Delete]
    J --> L[PUT /api/pipeline/:id]
    K --> M[DELETE /api/pipeline/:id]
```

**Penjelasan:**
1. **List View**: Menampilkan semua pipeline dengan search & filter
2. **Create**: Form dengan 20+ fields untuk buat pipeline baru
3. **Detail**: View detail pipeline dengan opsi edit/delete
4. **Edit**: Update pipeline data
5. **Delete**: Soft delete pipeline

---

### 4. Master Data Flow

```mermaid
graph TD
    A[Master Data Pages] --> B[Regions]
    A --> C[SBUs]
    A --> D[Customers]
    A --> E[Service Categories]
    B --> F[CRUD Operations]
    C --> F
    D --> F
    E --> F
    F --> G[GET /api/master/*]
    F --> H[POST /api/master/*]
    F --> I[PUT /api/master/*/id]
    F --> J[DELETE /api/master/*/id]
```

**Penjelasan:**
1. Setiap master data memiliki halaman CRUD sendiri
2. **Regions**: Manage wilayah
3. **SBUs**: Manage Strategic Business Units (dengan relasi ke Region)
4. **Customers**: Manage pelanggan (dengan relasi ke PLN Segment)
5. **Service Categories**: Manage kategori layanan (hierarchical level 1 & 2)

---

### 5. Revenue Management Flow

```mermaid
graph TD
    A[Revenue Management] --> B[Yearly Targets]
    A --> C[Monthly Targets]
    A --> D[Monthly Actuals]
    B --> E[Input Target by SBU]
    E --> F[POST /api/revenue/target/yearly]
    F --> G[Upsert Logic]
    C --> H[Input Monthly Target]
    H --> I[POST /api/revenue/target/monthly]
    I --> G
    D --> J[Input Actual Revenue]
    J --> K[POST /api/revenue/actual/monthly]
    K --> G
```

**Penjelasan:**
1. **Yearly Targets**: Set target tahunan per SBU dan kategori (NR/CO/TOTAL)
2. **Monthly Targets**: Set target bulanan per SBU
3. **Monthly Actuals**: Input realisasi revenue bulanan
4. Semua menggunakan **upsert logic** (update if exists, insert if not)

---

### 6. Data Flow Architecture

```mermaid
graph TB
    subgraph Frontend
        A[React Components] --> B[API Calls]
    end
    
    subgraph Backend
        B --> C[Next.js API Routes]
        C --> D[Auth Middleware]
        D --> E[Database Query]
    end
    
    subgraph Database
        E --> F[(PostgreSQL)]
        F --> G[Master Tables]
        F --> H[Transaction Tables]
        F --> I[User Table]
    end
    
    G --> J[Regions, SBUs, Customers, etc]
    H --> K[Pipeline, Revenue Targets, Actuals]
    I --> L[Users with JWT]
```

**Penjelasan:**
1. **Frontend**: React components dengan client-side state management
2. **API Layer**: Next.js Route Handlers dengan JWT validation
3. **Database**: PostgreSQL dengan relational schema
4. **Security**: JWT tokens, bcrypt passwords, parameterized queries

---

## 🗂️ Database Schema

```mermaid
erDiagram
    USERS ||--o{ PIPELINE_POTENSI : creates
    MASTER_REGION ||--o{ MASTER_SBU : contains
    MASTER_SBU ||--o{ PIPELINE_POTENSI : manages
    MASTER_SBU ||--o{ REVENUE_TARGET_YEARLY : has
    MASTER_SBU ||--o{ REVENUE_TARGET_MONTHLY : has
    MASTER_SBU ||--o{ REVENUE_ACTUAL_MONTHLY : has
    MASTER_CUSTOMER ||--o{ PIPELINE_POTENSI : owns
    MASTER_SERVICE_CATEGORY ||--o{ PIPELINE_POTENSI : categorizes
    MASTER_TIME_MONTH ||--o{ REVENUE_ACTUAL_MONTHLY : tracks
    MASTER_TIME_MONTH ||--o{ REVENUE_TARGET_MONTHLY : tracks
    
    USERS {
        int id PK
        string username
        string password_hash
        string role
        timestamp created_at
    }
    
    MASTER_REGION {
        int id PK
        string code
        string name
        boolean is_active
    }
    
    MASTER_SBU {
        int id PK
        string code
        string name
        int region_id FK
        boolean is_active
    }
    
    PIPELINE_POTENSI {
        int id PK
        int sbu_id FK
        int customer_id FK
        string nama_layanan
        decimal est_revenue
        string warna_status_potensi
        timestamp created_at
    }
    
    REVENUE_TARGET_YEARLY {
        int id PK
        int year
        int sbu_id FK
        string category
        decimal target_amount
    }
    
    REVENUE_ACTUAL_MONTHLY {
        int id PK
        int time_month_id FK
        int sbu_id FK
        string type_pendapatan
        decimal amount
    }
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd revas

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dengan database credentials Anda

# Setup database
psql -U postgres -d revas_db -f database/schema.sql
psql -U postgres -d revas_db -f database/auth.sql
psql -U postgres -d revas_db -f database/seed.sql

# Generate admin password hash
node scripts/generate-hash.js

# Update admin password di database
psql -U postgres -d revas_db -c "UPDATE users SET password_hash = 'HASH_FROM_SCRIPT' WHERE username = 'admin';"

# Run development server
npm run dev
```

Access aplikasi di [http://localhost:3000/login](http://localhost:3000/login)

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 📁 Project Structure

```
revas/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (17 endpoints)
│   │   ├── auth/          # Authentication
│   │   ├── dashboard/     # Dashboard data
│   │   ├── master/        # Master data CRUD
│   │   ├── pipeline/      # Pipeline management
│   │   └── revenue/       # Revenue tracking
│   ├── master/            # Master data pages
│   ├── pipeline/          # Pipeline management pages
│   ├── revenue/           # Revenue tracking pages
│   ├── login/             # Login page
│   ├── page.tsx           # Dashboard
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── auth/             # Protected routes
│   ├── dashboard/        # Chart components
│   ├── layout/           # Navigation & layout
│   └── ui/               # Reusable UI components
├── database/             # SQL scripts
│   ├── schema.sql        # Main schema
│   ├── auth.sql          # User table
│   └── seed.sql          # Sample data
├── docs/                 # Documentation
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── JWT_AUTH.md       # Auth documentation
├── lib/                  # Utilities
│   ├── auth.ts           # JWT utilities
│   ├── db.ts             # Database helper
│   └── middleware.ts     # Auth middleware
└── scripts/              # Utility scripts
    ├── deploy-production.sh
    └── generate-hash.js
```

---

## 🔧 Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** TailwindCSS v3 (Linear Dark Theme)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL
- **Authentication:** JWT with bcrypt
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 📊 Features Detail

### Dashboard
- **KPI Cards**: Target Yearly, Realization, Achievement %, Pipeline Most Likely
- **Monthly Revenue Chart**: Bar chart NR vs CO per bulan
- **Pipeline Composition**: Donut chart berdasarkan status warna
- **Top 5 Customers**: Table dengan total estimated revenue
- **Year Selector**: Filter semua data berdasarkan tahun

### Pipeline Management
- **List View**: Search by customer/service, filter by SBU & status
- **Create Form**: 20+ fields terorganisir dalam 4 sections
- **Detail View**: View lengkap dengan edit/delete options
- **Status Colors**: HIJAU (most likely), KUNING (medium), MERAH (low)

### Master Data
- **Regions**: CRUD untuk wilayah
- **SBUs**: CRUD dengan dropdown region selection
- **Customers**: CRUD dengan dropdown PLN segment
- **Service Categories**: CRUD hierarchical (level 1 & 2)

### Revenue Management
- **Yearly Targets**: Input target tahunan by SBU & category
- **Monthly Targets**: Input target bulanan by SBU
- **Monthly Actuals**: Input realisasi revenue bulanan
- **Upsert Logic**: Auto-update jika data sudah ada

---

## 🔐 Security

- JWT token-based authentication
- Password hashing dengan bcrypt (10 salt rounds)
- Protected routes enforcement
- SQL injection prevention (parameterized queries)
- Environment variable protection
- HTTPS/SSL support (production)

---

## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) - Comprehensive production deployment
- [Authentication Guide](docs/JWT_AUTH.md) - JWT authentication setup
- [Database Guide](database/README.md) - Database schema dan setup

---

## 🧪 Testing

```bash
# Build for production
npm run build

# Type checking
npm run type-check

# Lint
npm run lint
```

---

## 🚀 Production Deployment

### Automated Deployment
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### Manual Deployment
Lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) untuk instruksi lengkap.

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/revas_db
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_NAME=Revas
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

---


## 💾 Backup & Restore

Revas dilengkapi dengan automatic JSON backup script untuk full database snapshot.

### Backup Database
Untuk melakukan backup seluruh data ke dalam file JSON di folder `/database`:

```bash
npx tsx scripts/backup_db.ts
# Output: database/backup_full.json
```

### Restore Database
Untuk mengembalikan data dari file backup:

```bash
npx tsx scripts/restore_db.ts
```

> **Note:** Restore script menggunakan metode `Upsert`. Data yang sudah ada akan diperbarui, data baru akan ditambahkan.

---

## 📈 API Endpoints


### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Verify token

### Master Data
- `GET/POST /api/master/region` - Regions
- `GET/PUT/DELETE /api/master/region/[id]` - Region by ID
- `GET/POST /api/master/sbu` - SBUs
- `GET/PUT/DELETE /api/master/sbu/[id]` - SBU by ID
- `GET/POST /api/master/customer` - Customers
- `GET/POST /api/master/service-category` - Service categories
- `GET/POST /api/master/segment-pln` - PLN segments

### Pipeline
- `GET/POST /api/pipeline` - List/Create pipelines
- `GET/PUT/DELETE /api/pipeline/[id]` - Pipeline details

### Revenue
- `GET/POST /api/revenue/target/yearly` - Yearly targets (upsert)
- `GET/POST /api/revenue/target/monthly` - Monthly targets (upsert)
- `GET/POST /api/revenue/actual/monthly` - Actual revenue (upsert)

### Dashboard
- `GET /api/dashboard/summary?year=2025` - KPI summary
- `GET /api/dashboard/full?year=2025` - Full dashboard data

---

## 🎯 User Journey

### 1. First Time User
```
Login → Dashboard → Explore KPIs → View Pipeline List → Create New Pipeline → Set Revenue Targets
```

### 2. Daily Operations
```
Login → Dashboard → Check Achievement % → Update Pipeline Status → Input Actual Revenue
```

### 3. Monthly Review
```
Login → Dashboard → Change Year → Review Monthly Chart → Export Top Customers → Update Targets
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📝 License

Copyright © 2025 PLN Group. All rights reserved.

---

## 👥 Support

Untuk issues atau pertanyaan:
- Check documentation di `/docs`
- Review database guide di `/database/README.md`
- Contact system administrator

---

## 🎉 Acknowledgments

Built with ❤️ for PLN Group revenue assurance monitoring operations. By JMaharyuda

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** 2025-12-15
