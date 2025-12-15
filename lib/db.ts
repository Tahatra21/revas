import { Pool, QueryResult, QueryResultRow } from "pg";

// Create a connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
    process.exit(-1);
});

/**
 * Generic query function with TypeScript support
 * @param text SQL query string with $1, $2, etc. placeholders
 * @param params Array of parameter values
 * @returns Array of rows matching type T
 */
export async function query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<T[]> {
    const start = Date.now();
    try {
        const result: QueryResult<T> = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log query performance in development
        if (process.env.NODE_ENV === "development") {
            console.log("Executed query", {
                text: text.substring(0, 100),
                duration,
                rows: result.rowCount,
            });
        }

        return result.rows;
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient() {
    return await pool.connect();
}

export default pool;
