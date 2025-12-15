-- Seed Data for Revas Application
-- Initial master data for development and testing

-- ============================================
-- MASTER REGION
-- ============================================
INSERT INTO master_region (code, name) VALUES
  ('REG1', 'Regional 1 - Jakarta'),
  ('REG2', 'Regional 2 - Surabaya'),
  ('REG3', 'Regional 3 - Medan'),
  ('REG4', 'Regional 4 - Makassar'),
  ('REG5', 'Regional 5 - Bandung')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- MASTER SBU
-- ============================================
INSERT INTO master_sbu (code, name, region_id) VALUES
  ('JKB', 'Jakarta Bogor', (SELECT id FROM master_region WHERE code = 'REG1')),
  ('JKT', 'Jakarta Timur', (SELECT id FROM master_region WHERE code = 'REG1')),
  ('BDG', 'Bandung', (SELECT id FROM master_region WHERE code = 'REG5')),
  ('SBY', 'Surabaya', (SELECT id FROM master_region WHERE code = 'REG2')),
  ('MDN', 'Medan', (SELECT id FROM master_region WHERE code = 'REG3')),
  ('MKS', 'Makassar', (SELECT id FROM master_region WHERE code = 'REG4'))
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- MASTER SEGMENT PLN GROUP
-- ============================================
INSERT INTO master_segment_pln_group (code, name) VALUES
  ('UID', 'Unit Induk Distribusi'),
  ('UIP', 'Unit Induk Pembangkitan'),
  ('UIT', 'Unit Induk Transmisi'),
  ('HOLDING', 'Holding PLN'),
  ('ANAK', 'Anak Perusahaan PLN')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- MASTER CUSTOMER (Sample)
-- ============================================
INSERT INTO master_customer (name, segment_industri, status_pelanggan, pln_group_segment_id) VALUES
  ('PLN UID JBB', 'Distribusi', 'Aktif', (SELECT id FROM master_segment_pln_group WHERE code = 'UID')),
  ('PLN UID JTM', 'Distribusi', 'Aktif', (SELECT id FROM master_segment_pln_group WHERE code = 'UID')),
  ('PLN UIP Suralaya', 'Pembangkitan', 'Aktif', (SELECT id FROM master_segment_pln_group WHERE code = 'UIP')),
  ('PLN UIT JBT', 'Transmisi', 'Aktif', (SELECT id FROM master_segment_pln_group WHERE code = 'UIT')),
  ('PLN Pusat', 'Holding', 'Aktif', (SELECT id FROM master_segment_pln_group WHERE code = 'HOLDING')),
  ('PT Telkom Indonesia', 'Telekomunikasi', 'Aktif', NULL),
  ('Bank Mandiri', 'Perbankan', 'Aktif', NULL),
  ('Pertamina', 'Energi', 'Aktif', NULL)
ON CONFLICT DO NOTHING;

-- ============================================
-- MASTER SERVICE CATEGORY
-- ============================================
-- Level 1 Categories
INSERT INTO master_service_category (code, name, level, parent_id) VALUES
  ('CONN', 'Connectivity', 1, NULL),
  ('CLOUD', 'Cloud Services', 1, NULL),
  ('SECURITY', 'Security Services', 1, NULL),
  ('MANAGED', 'Managed Services', 1, NULL)
ON CONFLICT (code) DO NOTHING;

-- Level 2 Categories (Children)
INSERT INTO master_service_category (code, name, level, parent_id) VALUES
  ('CONN-FIBER', 'Fiber Optic', 2, (SELECT id FROM master_service_category WHERE code = 'CONN')),
  ('CONN-WIRELESS', 'Wireless', 2, (SELECT id FROM master_service_category WHERE code = 'CONN')),
  ('CONN-SATELLITE', 'Satellite', 2, (SELECT id FROM master_service_category WHERE code = 'CONN')),
  ('CLOUD-IAAS', 'IaaS', 2, (SELECT id FROM master_service_category WHERE code = 'CLOUD')),
  ('CLOUD-PAAS', 'PaaS', 2, (SELECT id FROM master_service_category WHERE code = 'CLOUD')),
  ('CLOUD-SAAS', 'SaaS', 2, (SELECT id FROM master_service_category WHERE code = 'CLOUD')),
  ('SEC-FIREWALL', 'Firewall', 2, (SELECT id FROM master_service_category WHERE code = 'SECURITY')),
  ('SEC-VPN', 'VPN', 2, (SELECT id FROM master_service_category WHERE code = 'SECURITY'))
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- MASTER TIME MONTH (2025)
-- ============================================
INSERT INTO master_time_month (year, month, month_name, start_date, end_date) VALUES
  (2025, 1, 'January', '2025-01-01', '2025-01-31'),
  (2025, 2, 'February', '2025-02-01', '2025-02-28'),
  (2025, 3, 'March', '2025-03-01', '2025-03-31'),
  (2025, 4, 'April', '2025-04-01', '2025-04-30'),
  (2025, 5, 'May', '2025-05-01', '2025-05-31'),
  (2025, 6, 'June', '2025-06-01', '2025-06-30'),
  (2025, 7, 'July', '2025-07-01', '2025-07-31'),
  (2025, 8, 'August', '2025-08-01', '2025-08-31'),
  (2025, 9, 'September', '2025-09-01', '2025-09-30'),
  (2025, 10, 'October', '2025-10-01', '2025-10-31'),
  (2025, 11, 'November', '2025-11-01', '2025-11-30'),
  (2025, 12, 'December', '2025-12-01', '2025-12-31')
ON CONFLICT (year, month) DO NOTHING;

-- ============================================
-- SAMPLE PIPELINE DATA
-- ============================================
INSERT INTO pipeline_potensi (
  sbu_id, customer_id, jenis_layanan, service_category_id, 
  nama_layanan, est_revenue, warna_status_potensi, 
  current_status, periode_snapshot
) VALUES
  (
    (SELECT id FROM master_sbu WHERE code = 'JKB'),
    (SELECT id FROM master_customer WHERE name = 'PLN UID JBB'),
    'Connectivity',
    (SELECT id FROM master_service_category WHERE code = 'CONN-FIBER'),
    'Fiber Optic Backbone Jakarta-Bogor',
    160000000,
    'HIJAU',
    'Proses BA',
    '2025-01-15'
  ),
  (
    (SELECT id FROM master_sbu WHERE code = 'SBY'),
    (SELECT id FROM master_customer WHERE name = 'PLN UID JTM'),
    'Cloud Services',
    (SELECT id FROM master_service_category WHERE code = 'CLOUD-IAAS'),
    'Cloud Infrastructure for ERP',
    250000000,
    'KUNING',
    'Negosiasi',
    '2025-01-20'
  ),
  (
    (SELECT id FROM master_sbu WHERE code = 'JKT'),
    (SELECT id FROM master_customer WHERE name = 'PT Telkom Indonesia'),
    'Security Services',
    (SELECT id FROM master_service_category WHERE code = 'SEC-FIREWALL'),
    'Enterprise Firewall Solution',
    180000000,
    'HIJAU',
    'Kontrak Ditandatangani',
    '2025-02-01'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE REVENUE TARGET
-- ============================================
INSERT INTO revenue_target_yearly (year, sbu_id, kategori, target_amount) VALUES
  (2025, (SELECT id FROM master_sbu WHERE code = 'JKB'), 'NR', 5000000000),
  (2025, (SELECT id FROM master_sbu WHERE code = 'JKB'), 'CO', 2000000000),
  (2025, (SELECT id FROM master_sbu WHERE code = 'SBY'), 'NR', 4500000000),
  (2025, (SELECT id FROM master_sbu WHERE code = 'SBY'), 'CO', 1800000000),
  (2025, (SELECT id FROM master_sbu WHERE code = 'BDG'), 'NR', 3500000000),
  (2025, (SELECT id FROM master_sbu WHERE code = 'BDG'), 'CO', 1500000000)
ON CONFLICT (year, sbu_id, kategori) DO NOTHING;

-- ============================================
-- SAMPLE REVENUE ACTUAL
-- ============================================
INSERT INTO revenue_actual_monthly (time_month_id, sbu_id, type_pendapatan, amount) VALUES
  (
    (SELECT id FROM master_time_month WHERE year = 2025 AND month = 1),
    (SELECT id FROM master_sbu WHERE code = 'JKB'),
    'NR',
    420000000
  ),
  (
    (SELECT id FROM master_time_month WHERE year = 2025 AND month = 1),
    (SELECT id FROM master_sbu WHERE code = 'JKB'),
    'CO',
    180000000
  ),
  (
    (SELECT id FROM master_time_month WHERE year = 2025 AND month = 1),
    (SELECT id FROM master_sbu WHERE code = 'SBY'),
    'NR',
    380000000
  ),
  (
    (SELECT id FROM master_time_month WHERE year = 2025 AND month = 1),
    (SELECT id FROM master_sbu WHERE code = 'SBY'),
    'CO',
    150000000
  )
ON CONFLICT (time_month_id, sbu_id, type_pendapatan) DO NOTHING;
