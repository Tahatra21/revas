-- Revenue Imports Table
CREATE TABLE IF NOT EXISTS revenue_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_filename VARCHAR(255) NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL,
    uploaded_by VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
    error_message TEXT,
    target_realisasi_column VARCHAR(100)
);

-- Revenue Detail Non Retail Table (Source Data)
CREATE TABLE IF NOT EXISTS revenue_detail_non_retail (
    id BIGSERIAL PRIMARY KEY,
    import_id UUID REFERENCES revenue_imports(id) ON DELETE CASCADE,
    sbu_code VARCHAR(100),
    grand_total NUMERIC(20, 2),
    grand_total_billion NUMERIC(20, 2),
    raw_json JSONB,
    source_rownum INTEGER
);

-- Revenue Summary PLN Table (Destination/Aggregated Data)
CREATE TABLE IF NOT EXISTS revenue_summary_pln (
    id BIGSERIAL PRIMARY KEY,
    import_id UUID REFERENCES revenue_imports(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    kode_bidang VARCHAR(100),
    realisasi_billion NUMERIC(20, 2),
    UNIQUE (import_id, kode_bidang)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_imports_year_month ON revenue_imports(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_revenue_detail_import_id ON revenue_detail_non_retail(import_id);
CREATE INDEX IF NOT EXISTS idx_revenue_summary_import_id ON revenue_summary_pln(import_id);
