-- Revas Database Schema
-- PostgreSQL DDL for Revenue Monitoring Application

-- ============================================
-- MASTER TABLES
-- ============================================

-- Master Region
CREATE TABLE IF NOT EXISTS master_region (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master SBU (Strategic Business Unit)
CREATE TABLE IF NOT EXISTS master_sbu (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  region_id INTEGER REFERENCES master_region(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Segment PLN Group
CREATE TABLE IF NOT EXISTS master_segment_pln_group (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Customer
CREATE TABLE IF NOT EXISTS master_customer (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  segment_industri VARCHAR(100),
  status_pelanggan VARCHAR(50),
  pln_group_segment_id INTEGER REFERENCES master_segment_pln_group(id),
  alamat TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Service Category (Hierarchical: Level 1 & 2)
CREATE TABLE IF NOT EXISTS master_service_category (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  parent_id INTEGER REFERENCES master_service_category(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Time Month (Time Dimension)
CREATE TABLE IF NOT EXISTS master_time_month (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  month_name VARCHAR(20),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, month)
);

-- ============================================
-- TRANSACTION TABLES
-- ============================================

-- Pipeline Potensi (Main Pipeline Data)
CREATE TABLE IF NOT EXISTS pipeline_potensi (
  id SERIAL PRIMARY KEY,
  sbu_id INTEGER NOT NULL REFERENCES master_sbu(id),
  customer_id INTEGER NOT NULL REFERENCES master_customer(id),
  jenis_layanan VARCHAR(100),
  service_category_id INTEGER REFERENCES master_service_category(id),
  service_category2_id INTEGER REFERENCES master_service_category(id),
  segment_industri VARCHAR(100),
  b2b_flag VARCHAR(10),
  type_pendapatan VARCHAR(50),
  nama_layanan VARCHAR(255) NOT NULL,
  kapasitas VARCHAR(100),
  satuan_kapasitas VARCHAR(50),
  originating VARCHAR(255),
  terminating VARCHAR(255),
  nilai_otc BIGINT,
  nilai_mrc BIGINT,
  est_revenue BIGINT NOT NULL,
  mapping_revenue BIGINT,
  sumber_anggaran VARCHAR(100),
  fungsi VARCHAR(100),
  no_invoice VARCHAR(100),
  warna_status_potensi VARCHAR(20) NOT NULL CHECK (warna_status_potensi IN ('HIJAU', 'KUNING', 'MERAH')),
  current_status VARCHAR(100),
  periode_snapshot DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Target Yearly
CREATE TABLE IF NOT EXISTS revenue_target_yearly (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  sbu_id INTEGER NOT NULL REFERENCES master_sbu(id),
  kategori VARCHAR(50) NOT NULL,
  target_amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, sbu_id, kategori)
);

-- Revenue Target Monthly
CREATE TABLE IF NOT EXISTS revenue_target_monthly (
  id SERIAL PRIMARY KEY,
  time_month_id INTEGER NOT NULL REFERENCES master_time_month(id),
  sbu_id INTEGER NOT NULL REFERENCES master_sbu(id),
  kategori VARCHAR(50) NOT NULL,
  target_amount BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(time_month_id, sbu_id, kategori)
);

-- Revenue Actual Monthly
CREATE TABLE IF NOT EXISTS revenue_actual_monthly (
  id SERIAL PRIMARY KEY,
  time_month_id INTEGER NOT NULL REFERENCES master_time_month(id),
  sbu_id INTEGER NOT NULL REFERENCES master_sbu(id),
  type_pendapatan VARCHAR(50) NOT NULL CHECK (type_pendapatan IN ('NR', 'CO', 'LAIN_LAIN')),
  amount BIGINT NOT NULL,
  source_reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(time_month_id, sbu_id, type_pendapatan)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Pipeline Potensi Indexes
CREATE INDEX IF NOT EXISTS idx_pipeline_sbu ON pipeline_potensi(sbu_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_customer ON pipeline_potensi(customer_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_status ON pipeline_potensi(warna_status_potensi);
CREATE INDEX IF NOT EXISTS idx_pipeline_periode ON pipeline_potensi(periode_snapshot);
CREATE INDEX IF NOT EXISTS idx_pipeline_sbu_status ON pipeline_potensi(sbu_id, warna_status_potensi);

-- Revenue Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_target_yearly_year ON revenue_target_yearly(year);
CREATE INDEX IF NOT EXISTS idx_revenue_target_yearly_sbu ON revenue_target_yearly(sbu_id);
CREATE INDEX IF NOT EXISTS idx_revenue_actual_time ON revenue_actual_monthly(time_month_id);
CREATE INDEX IF NOT EXISTS idx_revenue_actual_sbu ON revenue_actual_monthly(sbu_id);

-- Master Data Indexes
CREATE INDEX IF NOT EXISTS idx_sbu_region ON master_sbu(region_id);
CREATE INDEX IF NOT EXISTS idx_customer_segment ON master_customer(pln_group_segment_id);
CREATE INDEX IF NOT EXISTS idx_service_category_parent ON master_service_category(parent_id);

-- ============================================
-- UPDATE TRIGGERS FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_master_region_updated_at BEFORE UPDATE ON master_region
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_sbu_updated_at BEFORE UPDATE ON master_sbu
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_customer_updated_at BEFORE UPDATE ON master_customer
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_potensi_updated_at BEFORE UPDATE ON pipeline_potensi
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_target_yearly_updated_at BEFORE UPDATE ON revenue_target_yearly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_target_monthly_updated_at BEFORE UPDATE ON revenue_target_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_actual_monthly_updated_at BEFORE UPDATE ON revenue_actual_monthly
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
