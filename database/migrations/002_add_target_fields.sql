-- Migration: Add Target RKAP, CO Tahun Berjalan, and Target NR fields
-- Date: 2025-12-16

-- Add new columns
ALTER TABLE revenue_target_yearly 
ADD COLUMN IF NOT EXISTS target_rkap BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS co_tahun_berjalan BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_nr BIGINT DEFAULT 0;

-- Drop old unique constraint (year, sbu_id, kategori)
ALTER TABLE revenue_target_yearly 
DROP CONSTRAINT IF EXISTS revenue_target_yearly_year_sbu_id_kategori_key;

-- Add new unique constraint (year, sbu_id only)
-- This allows one row per SBU per year with all three targets
ALTER TABLE revenue_target_yearly 
DROP CONSTRAINT IF EXISTS revenue_target_yearly_year_sbu_id_key;

ALTER TABLE revenue_target_yearly 
ADD CONSTRAINT revenue_target_yearly_year_sbu_id_key UNIQUE(year, sbu_id);

-- Note: kategori column is kept for backwards compatibility but will be deprecated
