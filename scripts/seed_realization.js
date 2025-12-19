const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedRealization() {
    const client = await pool.connect();
    try {
        console.log('Seeding dummy realization data for 2025 (Jan-Jun)...');

        // Get month IDs for Jan-Jun 2025
        const months = await client.query(`
            SELECT id, month FROM master_time_month 
            WHERE year = 2025 AND month <= 6
            ORDER BY month
        `);

        // SBU IDs (assuming 1-12)
        const sbuIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

        for (const month of months.rows) {
            console.log(`Processing month ${month.month}...`);
            for (const sbuId of sbuIds) {
                // Generate random NR and CO amounts (Miliar)
                const amountNr = Math.floor(Math.random() * 40 + 5); // 5-45
                const amountCo = Math.floor(Math.random() * 50 + 10); // 10-60

                // Insert NR
                await client.query(`
                    INSERT INTO revenue_actual_monthly (time_month_id, sbu_id, type_pendapatan, amount)
                    VALUES ($1, $2, 'NR', $3)
                    ON CONFLICT (time_month_id, sbu_id, type_pendapatan)
                    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
                `, [month.id, sbuId, amountNr]);

                // Insert CO
                await client.query(`
                    INSERT INTO revenue_actual_monthly (time_month_id, sbu_id, type_pendapatan, amount)
                    VALUES ($1, $2, 'CO', $3)
                    ON CONFLICT (time_month_id, sbu_id, type_pendapatan)
                    DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
                `, [month.id, sbuId, amountCo]);
            }
        }

        console.log('Seeding complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seedRealization();
