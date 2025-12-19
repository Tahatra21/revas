const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found in env, using default");
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkData() {
    const client = await pool.connect();
    try {
        console.log('Checking master_time_month for 2025...');
        const timeResult = await client.query('SELECT COUNT(*) FROM master_time_month WHERE year = 2025');
        console.log('master_time_month count:', timeResult.rows[0].count);

        console.log('Checking revenue_actual_monthly for 2025...');
        const actualResult = await client.query(`
            SELECT COUNT(*) FROM revenue_actual_monthly a
            JOIN master_time_month t ON a.time_month_id = t.id
            WHERE t.year = 2025
        `);
        console.log('revenue_actual_monthly count:', actualResult.rows[0].count);

        console.log('Checking revenue_target_monthly for 2025...');
        const targetResult = await client.query(`
            SELECT COUNT(*) FROM revenue_target_monthly tm
            JOIN master_time_month t ON tm.time_month_id = t.id
            WHERE t.year = 2025
        `);
        console.log('revenue_target_monthly count:', targetResult.rows[0].count);

        if (targetResult.rows[0].count > 0) {
            const sampleTarget = await client.query(`
                SELECT * FROM revenue_target_monthly tm
                JOIN master_time_month t ON tm.time_month_id = t.id
                WHERE t.year = 2025 LIMIT 1
            `);
            console.log('Sample target:', sampleTarget.rows[0]);
        }

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkData();
