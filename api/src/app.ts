import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppVariables } from './middleware/auth';
import { candidatesRoutes } from './routes/candidates';
import { resumesRoutes } from './routes/resumes';
import { interviewsRoutes } from './routes/interviews';
import { hrDocsRoutes } from './routes/hrDocs';
import { hrChatRoutes } from './routes/hrChat';
import { statsRoutes } from './routes/stats';
import organizationsRoutes from './routes/organizations';
import invitesRoutes from './routes/invites';
import publicRoutes from './routes/public';
import { getEnv } from './env';

export function createApp() {
	const env = getEnv();
	const app = new Hono<{ Variables: AppVariables }>();

	app.use('*', cors({
		origin: env.CORS_ORIGIN,
		credentials: true
	}));

	app.get('/health', (c) => c.json({
		status: 'ok',
		timestamp: new Date().toISOString()
	}));

	// Core routes
	app.route('/candidates', candidatesRoutes);
	app.route('/resumes', resumesRoutes);
	app.route('/interview', interviewsRoutes);
	app.route('/hr-docs', hrDocsRoutes);
	app.route('/hr-chat', hrChatRoutes);
	app.route('/stats', statsRoutes);

	// Organization routes
	app.route('/organizations', organizationsRoutes);
	app.route('/invites', invitesRoutes);

	// Public routes (no auth required)
	app.route('/public', publicRoutes);

	app.notFound((c) => c.json({ error: 'Endpoint not found' }, 404));

	app.onError((err, c) => {
		console.error('[ERROR]', {
			message: err.message,
			stack: err.stack,
			path: c.req.path,
			method: c.req.method,
		});
		return c.json({ error: 'Internal server error' }, 500);
	});

	return app;
}
