import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getEnv } from '../env';

const env = getEnv();

/**
 * PostgreSQL connection client
 * Configured with connection pooling and reasonable timeouts
 */
const queryClient = postgres(env.DATABASE_URL, {
	max: 10, // Maximum number of connections in pool
	prepare: false, // Disable prepared statements for serverless compatibility
	connect_timeout: 10, // Connection timeout in seconds
});

/**
 * Drizzle ORM database instance
 * Use this for all database operations throughout the application
 */
export const db = drizzle(queryClient);

export type Db = typeof db;
