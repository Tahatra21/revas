-- Fix constraint to allow PENDING status
ALTER TABLE revenue_imports DROP CONSTRAINT IF EXISTS revenue_imports_status_check;
ALTER TABLE revenue_imports ADD CONSTRAINT revenue_imports_status_check CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED'));
