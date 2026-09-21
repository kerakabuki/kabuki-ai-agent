import http from 'node:http';
import { runtime } from './reception-runtime.mjs';
const { mf } = await runtime({ persist: true });
const port = 8789;
const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://127.0.0.1:${port}`;
    // この小さなプロキシは127.0.0.1にのみ待ち受ける。公開Workerには含めない。
    if (req.url === '/preview-admin') {
      res.writeHead(302, { Location: '/kerakabuki/reception/2026/admin', 'Set-Cookie': 'kl_session=local-manager; Path=/; HttpOnly; SameSite=Strict', 'Cache-Control': 'no-store' });res.end();return;
    }
    let size = 0; const chunks = [];
    for await (const chunk of req) { size += chunk.length; if (size > 72000) { res.writeHead(413);res.end();return; } chunks.push(chunk); }
    const response = await mf.dispatchFetch(origin + req.url, { method: req.method, headers: req.headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
    res.writeHead(response.status, Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  } catch { res.writeHead(503);res.end('Preview unavailable'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/kerakabuki/reception/2026\nLocal admin: http://127.0.0.1:${port}/preview-admin`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, async () => { server.close();await mf.dispose();process.exit(); });
