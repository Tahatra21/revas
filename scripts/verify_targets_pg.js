
require('dotenv').config();
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();

        // Find ID for KONFRA
        const res = await client.query("SELECT * FROM \"Unit\" WHERE code ILIKE '%KONFRA%'");
        if (res.rows.length === 0) {
            console.log("Unit KONFRA not found");
            return;
        }

        const unit = res.rows[0];
        console.log(`Unit: ${unit.name} (${unit.code})`);

        // Sum RKAP 2025 Targets
        const sumRes = await client.query(`
            SELECT SUM(amount) as total 
            FROM "Target" 
            WHERE "unitId" = $1 AND year = 2025 AND "targetType" = 'RKAP'
        `, [unit.id]);

        console.log(`Calculated RKAP 2025 (Sum of Months): ${sumRes.rows[0].total}`);

    } catch (err) {
        console.error("Error", err.stack);
    } finally {
        await client.end();
    }
}

main();
