-- Migration: Change target columns from BIGINT to NUMERIC for decimal support
-- Date: 2025-12-16

-- Alter columns to support decimal values (in Billion IDR)
ALTER TABLE revenue_target_yearly 
ALTER COLUMN target_rkap TYPE NUMERIC(15, 2),
ALTER COLUMN co_tahun_berjalan TYPE NUMERIC(15, 2),
ALTER COLUMN target_nr TYPE NUMERIC(15, 2);

-- Note: NUMERIC(15, 2) allows up to 999,999,999,999.99 Billion IDR
