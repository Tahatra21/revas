const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/revas_db";
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrateWeights() {
    const client = await pool.connect();
    try {
        console.log('Creating master_revenue_weight table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS master_revenue_weight (
              id SERIAL PRIMARY KEY,
              year INTEGER NOT NULL UNIQUE,
              jan DECIMAL(5,2) DEFAULT 0,
              feb DECIMAL(5,2) DEFAULT 0,
              mar DECIMAL(5,2) DEFAULT 0,
              apr DECIMAL(5,2) DEFAULT 0,
              may DECIMAL(5,2) DEFAULT 0,
              jun DECIMAL(5,2) DEFAULT 0,
              jul DECIMAL(5,2) DEFAULT 0,
              aug DECIMAL(5,2) DEFAULT 0,
              sep DECIMAL(5,2) DEFAULT 0,
              oct DECIMAL(5,2) DEFAULT 0,
              nov DECIMAL(5,2) DEFAULT 0,
              dec DECIMAL(5,2) DEFAULT 0, -- Removed strict CHECK for initial creation flexibility
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Seeding default weights for 2025...');
        // Default curve: 5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100
        const query = `
            INSERT INTO master_revenue_weight (
                year, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec
            ) VALUES (
                2025, 5, 10, 15, 20, 25, 40, 45, 55, 65, 80, 90, 100
            )
            ON CONFLICT (year) DO NOTHING;
        `;

        await client.query(query);
        console.log('Migration and seeding complete.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrateWeights();
