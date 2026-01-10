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

// Initialize the connection only if it doesn't exist
const queryClient = globalForDb.conn ?? postgres(env.DATABASE_URL, {
    max: 10,
    prepare: false, 
    connect_timeout: 30,       // 30 seconds to connect
    idle_timeout: 60,          // Close idle connections after 60s
    max_lifetime: 60 * 30,     // Max 30 minutes per connection
});

// In development, save the connection to the global object
if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = queryClient;
}

export const db = drizzle(queryClient);
export type Db = typeof db;