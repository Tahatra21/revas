-- Migration: Add missing columns to pipeline_potensi
-- Date: 2025-12-16

-- Add QTY column
ALTER TABLE pipeline_potensi 
ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1;

-- Add category 2026 column
ALTER TABLE pipeline_potensi 
ADD COLUMN IF NOT EXISTS category_2026 VARCHAR(100);

-- Add sub category column
ALTER TABLE pipeline_potensi 
ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);

-- Note: These store data from Excel columns Q, U, V
