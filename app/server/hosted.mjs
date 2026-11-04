// Hosted Margo: one server, many people (npm run hosted).
//
// The desktop app and `npm run web` serve one person on their own computer. This server is
// for testers on the internet, so it adds what that needs:
//  - one session per browser (an HttpOnly cookie), each with its own createApi and its own
//    signed-in account. Nobody can see anyone else's data.
//  - sessions survive restarts and redeploys (stored hashed in <data>/hosted-sessions.json).
//  - actions that only make sense on your own computer are refused (saving a PDF to a path
//    on disk, the browser extension).
//  - outbound fetches can't reach the server's own network (job links and job sites are
//    typed in by users).
//  - a slow-down on repeated sign-in attempts, and basic security headers.
//
// Settings (environment variables):
//  PORT            port to listen on (hosting services set this)
//  HOST            address to listen on (default 0.0.0.0)
//  MARGO_DATA      where accounts and data live (default ./data); put it on a persistent disk
//  ANTHROPIC_API_KEY  the shared Claude key (never commit it)
//  MARGO_SECURE_COOKIES  "0" to allow plain http cookies (local testing only)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import dns from 'node:dns/promises';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import { createApi } from '../core/api.mjs';
import { loadTeamKey } from '../core/teamkey.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../renderer');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.woff2': 'font/woff2' };
const COOKIE = 'margo_sid';
const SESSION_DAYS = 30;
const IDLE_MS = 2 * 60 * 60 * 1000; // drop an idle visitor's in-memory state after 2 hours (they stay signed in)
// Actions that read or write paths on the computer running Margo, or talk to the browser extension.
const REFUSED = new Set(['docs.pdfSaved', 'ext.token', 'ext.fill', 'ext.answer', 'ext.submitted']);
const AUTH = new Set(['auth.login', 'auth.create']);

export function startHosted({ base, port = 8080, host = '0.0.0.0', fetchImpl = fetch, claudeFactory, now, secureCookies = true, guardFetch = true } = {}) {
  fs.mkdirSync(base, { recursive: true });
  const safe = guardFetch ? safeFetch(fetchImpl) : fetchImpl;
  const sessionsFile = path.join(base, 'hosted-sessions.json');
  const readSessions = () => { try { return JSON.parse(fs.readFileSync(sessionsFile, 'utf8')); } catch { return {}; } };
  const writeSessions = (all) => { fs.writeFileSync(sessionsFile, JSON.stringify(all), { mode: 0o600 }); };
  const hash = (sid) => crypto.createHash('sha256').update(sid).digest('hex');
  const live = new Map(); // sid -> { api, listeners, seen }

  const visitor = (sid) => {
    let v = live.get(sid);
    if (!v) {
      const listeners = new Set();
      const api = createApi({ base, fetchImpl: safe, ...(claudeFactory ? { claudeFactory } : {}), ...(now ? { now } : {}), persistSession: false, onEvent: (e) => { for (const l of listeners) l.write(`data: ${JSON.stringify(e)}\n\n`); } });
      const saved = readSessions()[hash(sid)];
      if (saved && Date.now() - saved.seen < SESSION_DAYS * 864e5) api.restore(saved.accountId);
      v = { api, listeners, seen: Date.now() };
      live.set(sid, v);
    }
    v.seen = Date.now();
    return v;
  };
  const remember = (sid, accountId) => { const all = readSessions(); all[hash(sid)] = { accountId, seen: Date.now() }; writeSessions(prune(all)); };
  const forget = (sid) => { const all = readSessions(); delete all[hash(sid)]; writeSessions(all); };
  const prune = (all) => Object.fromEntries(Object.entries(all).filter(([, s]) => Date.now() - s.seen < SESSION_DAYS * 864e5));
  const touch = (sid, v) => { if (!v.api.session) return; const all = readSessions(); const k = hash(sid); if (all[k] && Date.now() - all[k].seen > 6 * 3600e3) { all[k].seen = Date.now(); writeSessions(all); } };

  // Slow down repeated sign-in attempts: 10 per 15 minutes per address.
  const attempts = new Map();
  const tooMany = (ip) => { const t = Date.now(); const list = (attempts.get(ip) || []).filter((x) => t - x < 15 * 60e3); list.push(t); attempts.set(ip, list); return list.length > 10; };

  const sweep = setInterval(() => {
    const t = Date.now();
    for (const [sid, v] of live) if (t - v.seen > IDLE_MS && !v.listeners.size) live.delete(sid);
    for (const [ip, list] of attempts) if (!list.some((x) => t - x < 15 * 60e3)) attempts.delete(ip);
  }, 10 * 60e3);
  sweep.unref();

  const server = http.createServer(async (req, res) => {
    const headers = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY', 'content-security-policy': "frame-ancestors 'none'" };
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname === '/healthz') return send(res, 200, { ok: true }, headers);
      if (url.pathname.startsWith('/ext/')) return send(res, 404, { error: 'The browser extension works with the desktop app only.' }, headers);

      let sid = cookie(req, COOKIE);
      if (!sid || !/^[A-Za-z0-9_-]{43}$/.test(sid)) sid = null;
      const setCookie = (value) => { headers['set-cookie'] = `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secureCookies ? '; Secure' : ''}`; };
      if (!sid) { sid = crypto.randomBytes(32).toString('base64url'); setCookie(sid); }

      if (url.pathname === '/events') {
        const v = visitor(sid);
        res.writeHead(200, { ...headers, 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(': hi\n\n');
        v.listeners.add(res); req.on('close', () => v.listeners.delete(res));
        return;
      }

      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' }, headers);
        if (!/^application\/json\b/.test(req.headers['content-type'] || '')) return send(res, 415, { error: 'Send JSON.' }, headers);
        const method = decodeURIComponent(url.pathname.slice(5));
        if (REFUSED.has(method)) return send(res, 400, { error: 'That only works in the desktop app.' }, headers);
        const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
        if (AUTH.has(method) && tooMany(ip)) return send(res, 429, { error: 'Too many tries. Wait a few minutes, then try again.' }, headers);
        const args = await body(req);
        let v = visitor(sid);
        if (AUTH.has(method)) {
          // A fresh session id on every sign-in, so an id set before signing in can't be reused.
          live.delete(sid); forget(sid);
          sid = crypto.randomBytes(32).toString('base64url'); setCookie(sid);
          v = visitor(sid);
        }
        let result;
        try { result = await v.api.call(method, args); }
        catch (err) { if (AUTH.has(method)) throw Object.assign(err, { name: 'UserError' }); throw err; }
        if (AUTH.has(method) && v.api.session) remember(sid, v.api.session.account.id);
        else if (method === 'auth.logout') { forget(sid); live.delete(sid); }
        else touch(sid, v);
        return send(res, 200, { result: result ?? null }, headers);
      }

      let file = path.normalize(path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname));
      if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
      res.writeHead(200, { ...headers, 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    } catch (err) {
      const user = err.name === 'UserError' || err.name === 'ClaudeError';
      if (!user) console.error(err);
      send(res, user ? 400 : 500, { error: user ? err.message : 'Something went wrong on our side. Try again in a moment.' }, headers);
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve({ server, port: server.address().port, close: () => { clearInterval(sweep); return new Promise((r) => server.close(r)); } }));
  });
}

// ----- outbound fetches can't reach private networks -----
export function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  const x = ip.toLowerCase();
  if (x.startsWith('::ffff:')) return isPrivateAddress(x.slice(7));
  return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || /^ff/.test(x);
}

export function safeFetch(fetchImpl = fetch, lookup = (h) => dns.lookup(h, { all: true })) {
  const check = async (u) => {
    const url = new URL(u);
    if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('Only web addresses (http or https) work here.'), { name: 'UserError' });
    const host = url.hostname.replace(/^\[|\]$/g, '');
    const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host);
    if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address))) throw Object.assign(new Error('We can’t open that address.'), { name: 'UserError' });
  };
  return async (input, opts = {}) => {
    let target = typeof input === 'string' ? input : input.url;
    for (let hop = 0; hop < 6; hop++) {
      await check(target);
      const res = await fetchImpl(target, { ...opts, redirect: 'manual' });
      if (![301, 302, 303, 307, 308].includes(res.status) || !res.headers?.get?.('location')) return res;
      target = new URL(res.headers.get('location'), target).toString();
      if (res.status === 303) opts = { ...opts, method: 'GET', body: undefined };
    }
    throw Object.assign(new Error('That address redirects too many times.'), { name: 'UserError' });
  };
}

function cookie(req, name) {
  const m = String(req.headers.cookie || '').split(/;\s*/).find((c) => c.startsWith(name + '='));
  return m ? decodeURIComponent(m.slice(name.length + 1)) : null;
}
function send(res, status, obj, headers = {}) { res.writeHead(status, { ...headers, 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > 80 * 1024 * 1024) { reject(Object.assign(new Error('That file is too big.'), { name: 'UserError' })); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('That request was garbled.'), { name: 'UserError' })); } });
  });
}

// Run directly: node server/hosted.mjs
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  loadTeamKey(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
  const base = path.resolve(process.env.MARGO_DATA || './data');
  const s = await startHosted({ base, port: Number(process.env.PORT || 8080), host: process.env.HOST || '0.0.0.0', secureCookies: process.env.MARGO_SECURE_COOKIES !== '0' });
  console.log(`Margo (hosted) on port ${s.port}, data in ${base}${process.env.ANTHROPIC_API_KEY ? '' : ' (no Claude key set)'}`);
}
