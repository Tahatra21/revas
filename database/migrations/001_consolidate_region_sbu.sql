-- ============================================
-- MIGRATION: Consolidate Region & SBU Master Data
-- ============================================
-- This script removes the master_region table and 
-- the region_id foreign key from master_sbu
-- ============================================

-- Step 1: Remove foreign key constraint
ALTER TABLE master_sbu DROP CONSTRAINT IF EXISTS master_sbu_region_id_fkey;

-- Step 2: Drop region_id column from master_sbu
ALTER TABLE master_sbu DROP COLUMN IF EXISTS region_id;

-- Step 3: Drop indexes
DROP INDEX IF EXISTS idx_sbu_region;

-- Step 4: Drop triggers
DROP TRIGGER IF EXISTS update_master_region_updated_at ON master_region;

-- Step 5: Drop master_region table (CASCADE to handle any remaining dependencies)
DROP TABLE IF EXISTS master_region CASCADE;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify the migration:

-- 1. Check that master_region table no longer exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'master_region';
-- (Should return 0 rows)

-- 2. Check master_sbu structure (should not have region_id)
-- \d master_sbu

-- 3. Verify SBU data is intact
-- SELECT COUNT(*) FROM master_sbu;
