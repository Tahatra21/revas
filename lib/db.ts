import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL || "postgres://jmaharyuda@localhost:5432/revas_db";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Legacy helpers for raw SQL (used by existing APIs)
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    // console.log('executed query', { text, duration, rows: res.rowCount });
    return res.rows;
}

export async function getClient() {
    const client: any = await pool.connect();
    const query = client.query;
    const release = client.release;
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds!')
        console.error(`The last executed query on this client was: ${client.lastQuery}`)
    }, 5000);
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args: any[]) => {
        client.lastQuery = args;
        return query.apply(client, args);
    }
    client.release = () => {
        clearTimeout(timeout);
        // set the methods back to their old un-monkey-patched version
        client.query = query;
        client.release = release;
        return release.apply(client);
    }
    return client;
}
