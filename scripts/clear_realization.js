const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function clearRealization() {
    const client = await pool.connect();
    try {
        console.log('Clearing revenue_actual_monthly table...');
        await client.query('DELETE FROM revenue_actual_monthly');
        console.log('Table cleared.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

clearRealization();
