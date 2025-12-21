import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getEnv } from '../env';

const env = getEnv();

const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
const migrationDb = drizzle(migrationClient);

await migrate(migrationDb, { migrationsFolder: 'drizzle' });
await migrationClient.end();
