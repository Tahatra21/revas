const { Pool } = require('pg');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found in env, using default");
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db"; // Trying revas_db
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Distributing yearly targets to monthly...');

        // 1. Get all yearly targets
        const yearlyTargets = await client.query(`
            SELECT * FROM revenue_target_yearly 
            WHERE target_rkap > 0
        `);

        console.log(`Found ${yearlyTargets.rows.length} yearly targets to process.`);

        const MONTHLY_CUMULATIVE_PCT = [5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100];

        for (const target of yearlyTargets.rows) {
            console.log(`Processing SBU ${target.sbu_id} for year ${target.year} (Target: ${target.target_rkap})...`);

            // 2. Get month IDs for this year
            const timeMonths = await client.query(
                "SELECT id, month FROM master_time_month WHERE year = $1 ORDER BY month",
                [target.year]
            );

            if (timeMonths.rows.length !== 12) {
                console.warn(`Skipping year ${target.year}: Found ${timeMonths.rows.length} months (expected 12).`);
                continue;
            }

            // 3. Distribute
            let prevPct = 0;
            for (let i = 0; i < 12; i++) {
                const month = timeMonths.rows[i];
                const cumulativePct = MONTHLY_CUMULATIVE_PCT[i];
                const monthlyPct = cumulativePct - prevPct;
                prevPct = cumulativePct;

                const monthlyAmount = Math.round(Number(target.target_rkap) * (monthlyPct / 100));
                const monthlyNr = Math.round(Number(target.target_nr) * (monthlyPct / 100));
                const monthlyCo = Math.round(Number(target.co_tahun_berjalan) * (monthlyPct / 100));
                const monthlyBeyond = Math.round(Number(target.target_beyond_rkap) * (monthlyPct / 100));

                await client.query(`
                    INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                    VALUES ($1, $2, 'RKAP', $3)
                    ON CONFLICT (time_month_id, sbu_id, kategori)
                    DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
                `, [month.id, target.sbu_id, monthlyAmount]);

                await client.query(`
                    INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                    VALUES ($1, $2, 'BEYOND', $3)
                    ON CONFLICT (time_month_id, sbu_id, kategori)
                    DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
                `, [month.id, target.sbu_id, monthlyBeyond]);

                await client.query(`
                    INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                    VALUES ($1, $2, 'NR', $3)
                    ON CONFLICT (time_month_id, sbu_id, kategori)
                    DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
                `, [month.id, target.sbu_id, monthlyNr]);

                await client.query(`
                    INSERT INTO revenue_target_monthly (time_month_id, sbu_id, kategori, target_amount)
                    VALUES ($1, $2, 'CO', $3)
                    ON CONFLICT (time_month_id, sbu_id, kategori)
                    DO UPDATE SET target_amount = EXCLUDED.target_amount, updated_at = NOW()
                `, [month.id, target.sbu_id, monthlyCo]);
            }
        }

        console.log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
