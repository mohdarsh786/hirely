import { createApp } from './app';
import { getEnv } from './env';

const env = getEnv();
const app = createApp();

Bun.serve({
	port: env.PORT,
	fetch: app.fetch,
});

console.log(`API server listening on http://localhost:${env.PORT}`);
console.log(`Health check available at http://localhost:${env.PORT}/health`);
