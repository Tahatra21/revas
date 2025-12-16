-- Migration: Add target_aktivasi column to pipeline_potensi
-- Date: 2025-12-16

ALTER TABLE pipeline_potensi 
ADD COLUMN IF NOT EXISTS target_aktivasi DATE;

-- Note: This stores the target activation date from Excel Column R
