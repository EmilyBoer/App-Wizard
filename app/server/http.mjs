// One small HTTP layer used two ways:
//  - full mode (npm run web): serves the app's screens and every action, for
//    running in a normal browser and for testing.
//  - extension mode (inside the desktop app): only the /ext/ actions, and only
//    with the pairing code, so the browser extension can fill forms.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { linkedInRoutes } from './linkedin.mjs';
import { staticFile } from './hosted.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../renderer');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.woff2': 'font/woff2' };
const EXT_METHODS = { fill: 'ext.fill', answer: 'ext.answer', submitted: 'ext.submitted' };

export function startServer(api, { port = 47321, host = '127.0.0.1', full = false, linkedin = null } = {}) {
  const listeners = new Set();
  const li = linkedInRoutes({ config: linkedin, publicUrl: () => `http://127.0.0.1:${server.address().port}` });
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${host}`);
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, x-app-wizard-token', 'access-control-allow-methods': 'GET, POST, OPTIONS' };
    if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
    try {
      if (url.pathname.startsWith('/ext/')) {
        const method = EXT_METHODS[url.pathname.slice(5)];
        if (url.pathname === '/ext/ping') return send(res, 200, { ok: true, app: 'Margo', loggedIn: Boolean(api.session) }, cors);
        if (!method) return send(res, 404, { error: 'Unknown' }, cors);
        if (!api.session) return send(res, 401, { error: 'Open Margo and log in first.' }, cors);
        const token = api.store().get('settings').extensionToken;
        if (!token || req.headers['x-app-wizard-token'] !== token) return send(res, 403, { error: 'Pair the extension first: Profile, Settings, Browser extension.' }, cors);
        return send(res, 200, await api.call(method, await body(req)), cors);
      }
      if (!full) return send(res, 404, { error: 'Not found' }, cors);
      // LinkedIn sign-in (local preview: the app lives at /).
      if (url.pathname.startsWith('/auth/linkedin/')) {
        const handled = await li(req, res, url, '/', async (_req, profile) => api.signInLinkedIn(profile));
        if (handled !== false) return;
      }
      // The sales page, for previewing on this computer (the hosted site serves it at /).
      if (url.pathname === '/site' || url.pathname.startsWith('/site/')) {
        if (url.pathname === '/site') { res.writeHead(301, { location: '/site/' }); return res.end(); }
        const f = staticFile(path.join(ROOT, 'site'), url.pathname.slice(5), 'index.html');
        res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
        return fs.createReadStream(f).pipe(res);
      }
      if (url.pathname === '/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(': hi\n\n');
        listeners.add(res); req.on('close', () => listeners.delete(res));
        return;
      }
      if (url.pathname.startsWith('/api/')) {
        const method = decodeURIComponent(url.pathname.slice(5));
        const result = await api.call(method, await body(req));
        return send(res, 200, { result: result ?? null });
      }
      // The sales page links to /app/ (where the hosted site keeps Margo); here Margo is at /.
      if (url.pathname === '/app' || url.pathname.startsWith('/app/')) { res.writeHead(302, { location: '/' }); return res.end(); }
      let file = path.normalize(path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      const user = err.name === 'UserError' || err.name === 'ClaudeError';
      if (!user) console.error(err);
      send(res, user ? 400 : 500, { error: user ? err.message : `Something went wrong: ${err.message}` }, cors);
    }
  });
  const emit = (ev) => { for (const l of listeners) l.write(`data: ${JSON.stringify(ev)}\n\n`); };
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve({ server, emit, port: server.address().port }));
  });
}

function send(res, status, obj, headers = {}) { res.writeHead(status, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 80 * 1024 * 1024) { reject(new Error('Too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(e); } });
  });
}
