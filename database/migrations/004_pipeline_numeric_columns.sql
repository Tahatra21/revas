-- Migration: Change pipeline amount columns to NUMERIC for decimal support
-- Date: 2025-12-16

-- Alter columns to support decimal values (in Billion IDR)
ALTER TABLE pipeline_potensi 
ALTER COLUMN nilai_otc TYPE NUMERIC(20, 4),
ALTER COLUMN nilai_mrc TYPE NUMERIC(20, 4),
ALTER COLUMN est_revenue TYPE NUMERIC(20, 4),
ALTER COLUMN mapping_revenue TYPE NUMERIC(20, 4);

-- Note: NUMERIC(20, 4) allows up to 16 digits before decimal and 4 after
-- This accommodates values like 167444444.4444 (hundred millions with 4 decimals)
