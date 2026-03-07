import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { charactersRoutes } from './routes/characters';
import { imagesRoutes } from './routes/images';
import { postsRoutes } from './routes/posts';
import { calendarRoutes } from './routes/calendar';
import { generateRoutes } from './routes/generate';
import { quizRoutes } from './routes/quiz';
import { exportRoutes } from './routes/export';
import { settingsRoutes } from './routes/settings';
import { naviRoutes } from './routes/navi';
import { autoPostRoutes } from './routes/auto-post';
import { executeAutoPost } from './lib/auto-post';

const app = new Hono<{ Bindings: Env }>();

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// CORS — restrict to known origins
app.use('/api/*', cors({
  origin: [
    'https://kabuki-post-365.kerakabuki.workers.dev',
    'https://kabukiplus.com',
    'http://localhost:5173',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Auth middleware — Bearer token for management API (skip NAVI public routes & health)
app.use('/api/v1/*', async (c, next) => {
  // Public NAVI endpoints don't require auth
  if (c.req.path.startsWith('/api/v1/navi/')) return next();

  const token = c.env.API_TOKEN;
  if (!token) return next(); // No token configured = skip auth (dev mode)

  const auth = c.req.header('Authorization');
  if (!auth || auth !== `Bearer ${token}`) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});

// API routes
app.route('/api/v1/characters', charactersRoutes);
app.route('/api/v1/images', imagesRoutes);
app.route('/api/v1/posts', postsRoutes);
app.route('/api/v1/calendar', calendarRoutes);
app.route('/api/v1/generate', generateRoutes);
app.route('/api/v1/quiz', quizRoutes);
app.route('/api/v1/export', exportRoutes);
app.route('/api/v1/settings', settingsRoutes);
app.route('/api/v1/navi', naviRoutes);
app.route('/api/v1/auto-post', autoPostRoutes);

// NAVI public image serving
app.get('/images/navi/:size/:imageId', async (c) => {
  const { size, imageId } = c.req.param();
  const validSizes = ['card', 'detail', 'thumb'];
  if (!validSizes.includes(size)) {
    return c.json({ error: 'Invalid size' }, 400);
  }
  const id = imageId.replace(/\.jpg$/, '');
  const r2Key = `navi/${size}/${id}.jpg`;
  const object = await c.env.R2.get(r2Key);
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }
  const headers = new Headers();
  headers.set('Content-Type', 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=31536000');
  return new Response(object.body, { headers });
});

// R2 image serving (originals, SNS variants)
app.get('/images/r2/*', async (c) => {
  const r2Key = c.req.path.replace('/images/r2/', '');
  if (!r2Key) return c.json({ error: 'No key specified' }, 400);

  const object = await c.env.R2.get(r2Key);
  if (!object) {
    return c.json({ error: 'Image not found' }, 404);
  }

  const ext = r2Key.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const headers = new Headers();
  headers.set('Content-Type', contentType);
  headers.set('Cache-Control', 'public, max-age=3600');
  return new Response(object.body, { headers });
});

// Auth verify endpoint (for frontend login)
app.post('/api/auth/verify', async (c) => {
  const token = c.env.API_TOKEN;
  if (!token) return c.json({ ok: true }); // dev mode
  const body = await c.req.json() as { token: string };
  if (body.token === token) return c.json({ ok: true });
  return c.json({ error: 'Invalid token' }, 401);
});

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'kabuki-post-365' }));

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(executeAutoPost(env));
  },
};
