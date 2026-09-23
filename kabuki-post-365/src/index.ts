import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { charactersRoutes } from './routes/characters';
import { imagesRoutes } from './routes/images';
import { postsRoutes } from './routes/posts';
import { calendarRoutes } from './routes/calendar';
import { generateRoutes } from './routes/instagram-generate';
import { reelsRoutes } from './routes/reels';
import { crosspostRoutes } from './routes/crossposts';
import { verifyRendererToken } from './lib/render-auth';
import { quizRoutes } from './routes/quiz';
import { exportRoutes } from './routes/export';
import { settingsRoutes } from './routes/settings';
import { naviRoutes } from './routes/navi';
import { autoPostRoutes } from './routes/auto-post';
import { shouldRunNow, runDailyPipeline, markDone, getJSTNow } from './lib/daily-run';
import { shouldRunStoryNow, runEveningStory } from './lib/story-post';

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

  if (c.req.path.startsWith('/api/v1/reels/jobs/')) {
    const bearer=(c.req.header('Authorization')||'').replace(/^Bearer /,'');
    if (await verifyRendererToken(bearer)) return next();
  }
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
app.route('/api/v1/reels', reelsRoutes);
app.route('/api/v1/crossposts', crosspostRoutes);
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
  if (r2Key.startsWith('reels/audio/')) return c.notFound();

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

// MP4 responses preserve MIME type and byte ranges for Meta and browser players.
app.on(['GET','HEAD'],'/media/*',async c=>{
  const key=decodeURIComponent(c.req.path.replace('/media/',''));
  if(!key || key.includes('..') || key.startsWith('reels/audio/')) return c.notFound();
  const object=await c.env.R2.get(key,{range:c.req.raw.headers});
  if(!object) return c.notFound();
  const h=new Headers();object.writeHttpMetadata(h);
  h.set('Accept-Ranges','bytes');h.set('Cache-Control','public,max-age=3600');
  h.set('ETag',object.httpEtag);
  if(c.req.header('Range') && object.range && 'offset' in object.range && object.range.offset!==undefined && 'length' in object.range && object.range.length!==undefined){
    h.set('Content-Range',`bytes ${object.range.offset}-${object.range.offset+object.range.length-1}/${object.size}`);
    h.set('Content-Length',String(object.range.length));
  }else h.set('Content-Length',String(object.size));
  return new Response(c.req.method==='HEAD'?null:object.body,{status:h.has('Content-Range')?206:200,headers:h});
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
    // 夕方の舞台裏ストーリーズ窓（19:00-19:45 JST = 10:00-10:45 UTC）は別フローで処理する。
    // 日替わりで選ばれた1スロットだけ実投稿し、朝のフィード投稿フローには影響させない。
    if (event.cron === '*/15 10 * * *') {
      ctx.waitUntil((async () => {
        const { run, reason } = await shouldRunStoryNow(env);
        console.log(`[scheduled:story] ${reason}`);
        if (!run) return;
        await runEveningStory(env);
      })());
      return;
    }

    // Retry processing containers in the morning until a confirmed publication.
    ctx.waitUntil((async () => {
      const { run, reason } = await shouldRunNow(env);
      console.log(`[scheduled] ${reason}`);
      if (!run) return;
      const date = getJSTNow().date;
      const report=await runDailyPipeline(env, date);
      if(report.results.some(r=>r.platforms.some(p=>p.success))) await markDone(env,date);
    })());
  },
};
