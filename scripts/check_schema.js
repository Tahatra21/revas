const { Pool } = require('pg');
// require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        console.log('Checking columns in revenue_target_yearly...');

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'revenue_target_yearly';
    `);

        console.log('Columns:', res.rows.map(r => r.column_name).join(', '));

        console.log('Sample Data:');
        const data = await client.query(`SELECT * FROM revenue_target_yearly LIMIT 5`);
        console.log(JSON.stringify(data.rows, null, 2));

    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

checkSchema();
