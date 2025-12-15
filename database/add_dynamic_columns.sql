-- Add storage for dynamic table structure
ALTER TABLE revenue_imports ADD COLUMN IF NOT EXISTS table_headers JSONB;
ALTER TABLE revenue_summary_pln ADD COLUMN IF NOT EXISTS row_data JSONB;
