const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found, using default");
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function debugData() {
    const client = await pool.connect();
    try {
        console.log('--- Debugging Data ---');

        // 1. Check Yearly Targets
        console.log('\n1. Yearly Targets (Sample top 5):');
        const yearly = await client.query(`
            SELECT id, sbu_id, year, target_rkap, target_nr, co_tahun_berjalan 
            FROM revenue_target_yearly 
            WHERE year = 2025 
            LIMIT 5
        `);
        console.table(yearly.rows);

        // 2. Check Monthly Targets by Category
        console.log('\n2. Monthly Targets Summary (2025):');
        const monthlySummary = await client.query(`
            SELECT kategori, COUNT(*), SUM(target_amount) as total_amount
            FROM revenue_target_monthly tm
            JOIN master_time_month t ON tm.time_month_id = t.id
            WHERE t.year = 2025
            GROUP BY kategori
        `);
        console.table(monthlySummary.rows);

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

debugData();
