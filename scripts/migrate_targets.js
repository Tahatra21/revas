const { Pool } = require('pg');
// require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    // Try default local logic if env not loaded
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding columns to revenue_target_yearly...');

        await client.query(`
      ALTER TABLE revenue_target_yearly 
      ADD COLUMN IF NOT EXISTS target_komitmen NUMERIC(20, 2) DEFAULT 0;
    `);
        console.log('Added target_komitmen');

        await client.query(`
      ALTER TABLE revenue_target_yearly 
      ADD COLUMN IF NOT EXISTS target_beyond_rkap NUMERIC(20, 2) DEFAULT 0;
    `);
        console.log('Added target_beyond_rkap');

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
