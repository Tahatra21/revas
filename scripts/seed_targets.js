const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const DATA = [
    { code: 'KONFRA', komitmen: 1990.00, beyond: 1999.25 },
    { code: 'APLIKASI', komitmen: 1387.00, beyond: 1396.25 },
    { code: 'JKB', komitmen: 48.00, beyond: 60.25 },
    { code: 'JBB', komitmen: 50.00, beyond: 59.25 },
    { code: 'JTG', komitmen: 52.00, beyond: 61.25 },
    { code: 'JBT', komitmen: 50.00, beyond: 60.25 },
    { code: 'BNR', komitmen: 42.00, beyond: 55.75 },
    { code: 'SBU', komitmen: 50.00, beyond: 59.25 },
    { code: 'SBT', komitmen: 62.00, beyond: 63.25 },
    { code: 'SBS', komitmen: 46.00, beyond: 55.75 },
    { code: 'SLW', komitmen: 52.00, beyond: 64.75 },
    { code: 'KLM', komitmen: 60.00, beyond: 64.75 }
];

async function seed() {
    const client = await pool.connect();
    try {
        console.log('Seeding revenue targets...');

        for (const item of DATA) {
            console.log(`Updating ${item.code}...`);

            // Get SBU ID
            const sbuRes = await client.query('SELECT id FROM master_sbu WHERE code = $1', [item.code]);
            if (sbuRes.rows.length === 0) {
                console.warn(`SBU ${item.code} not found!`);
                continue;
            }
            const sbuId = sbuRes.rows[0].id;

            // Update
            await client.query(`
        UPDATE revenue_target_yearly
        SET target_komitmen = $1, target_beyond_rkap = $2, updated_at = NOW()
        WHERE sbu_id = $3 AND year = 2025
      `, [item.komitmen, item.beyond, sbuId]);
        }

        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

seed();
