import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getEnv } from '../env';

const env = getEnv();

/**
 * Global variable to preserve the connection across hot-reloads in development.
 * This prevents creating a new connection pool on every file save.
 */
const globalForDb = global as unknown as {
  conn: postgres.Sql | undefined;
};

// 1. Initialize the connection only if it doesn't exist
const queryClient = globalForDb.conn ?? postgres(env.DATABASE_URL, {
    max: 10,
    prepare: false, 
    connect_timeout: 10,
    // Add idle_timeout to close connections that aren't being used
    idle_timeout: 20, 
});

// 2. In development, save the connection to the global object
if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = queryClient;
}

export const db = drizzle(queryClient);
export type Db = typeof db;