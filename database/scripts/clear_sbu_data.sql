-- Script untuk menghapus semua data SBU
-- Jalankan script ini untuk reset data SBU

-- Delete all SBU records
DELETE FROM master_sbu;

-- Reset auto-increment ID (optional)
ALTER SEQUENCE master_sbu_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_records FROM master_sbu;
