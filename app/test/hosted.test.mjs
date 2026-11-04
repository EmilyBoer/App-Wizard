// The hosted server: many people on one server, each kept apart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { startHosted, isPrivateAddress, safeFetch } from '../server/hosted.mjs';
import { fakeClaude, fakeFetch, tmpDir } from './helpers.mjs';

const start = (base) => startHosted({ base, port: 0, host: '127.0.0.1', fetchImpl: fakeFetch(), claudeFactory: fakeClaude(), secureCookies: false, guardFetch: false });

// A tiny browser: keeps its own cookie, like a separate person's laptop.
function browser(port) {
  let jar = '';
  const call = async (method, args = {}) => {
    const res = await fetch(`http://127.0.0.1:${port}/api/${method}`, { method: 'POST', headers: { 'content-type': 'application/json', ...(jar ? { cookie: jar } : {}) }, body: JSON.stringify(args) });
    const set = res.headers.get('set-cookie');
    if (set) jar = set.split(';')[0];
    const body = await res.json();
    return { status: res.status, ...body, cookie: set };
  };
  return { call, get jar() { return jar; }, set jar(v) { jar = v; } };
}

test('two people on one server never see each other’s data', async () => {
  const base = tmpDir();
  const s = await start(base);
  try {
    const a = browser(s.port), b = browser(s.port);
    assert.equal((await a.call('auth.create', { name: 'Ana One', email: 'ana@example.com', password: 'password-one' })).status, 200);
    assert.equal((await b.call('auth.create', { name: 'Ben Two', email: 'ben@example.com', password: 'password-two' })).status, 200);
    await a.call('profile.setContact', { phone: '555-0001' });
    const pa = await a.call('profile.get'), pb = await b.call('profile.get');
    assert.equal(pa.result.contact.name, 'Ana One');
    assert.equal(pb.result.contact.name, 'Ben Two');
    assert.notEqual(pb.result.contact.phone, '555-0001');
    assert.equal((await a.call('auth.status')).result.account.email, 'ana@example.com');
    assert.equal((await b.call('auth.status')).result.account.email, 'ben@example.com');
    // A stranger with no cookie is not signed in as either of them.
    const c = browser(s.port);
    assert.equal((await c.call('auth.status')).result.loggedIn, false);
    assert.equal((await c.call('profile.get')).status, 400);
  } finally { await s.close(); }
});

test('cookies are HttpOnly, a new id is issued at sign-in, and sign-out ends the session', async () => {
  const s = await start(tmpDir());
  try {
    const a = browser(s.port);
    const first = await a.call('auth.status');
    assert.match(first.cookie, /HttpOnly/); assert.match(first.cookie, /SameSite=Lax/);
    const before = a.jar;
    const created = await a.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
    assert.ok(created.cookie && a.jar !== before, 'sign-in rotates the session id');
    // The old id is worth nothing.
    const thief = browser(s.port); thief.jar = before;
    assert.equal((await thief.call('auth.status')).result.loggedIn, false);
    await a.call('auth.logout');
    assert.equal((await a.call('auth.status')).result.loggedIn, false);
  } finally { await s.close(); }
});

test('people stay signed in after the server restarts (a redeploy)', async () => {
  const base = tmpDir();
  let s = await start(base);
  const a = browser(s.port);
  await a.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  await s.close();
  s = await start(base);
  try {
    const again = browser(s.port); again.jar = a.jar;
    assert.equal((await again.call('auth.status')).result.account.email, 'ana@example.com');
    const stored = fs.readFileSync(path.join(base, 'hosted-sessions.json'), 'utf8');
    assert.ok(!stored.includes(a.jar.split('=')[1]), 'session ids are stored hashed');
  } finally { await s.close(); }
});

test('desktop-only actions are refused, and the extension routes are off', async () => {
  const s = await start(tmpDir());
  try {
    const a = browser(s.port);
    await a.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
    const r = await a.call('docs.pdfSaved', { id: 'x', file: '/etc/passwd' });
    assert.equal(r.status, 400);
    assert.match(r.error, /desktop app/);
    const ext = await fetch(`http://127.0.0.1:${s.port}/ext/ping`);
    assert.equal(ext.status, 404);
  } finally { await s.close(); }
});

test('repeated sign-in attempts are slowed down', async () => {
  const s = await start(tmpDir());
  try {
    const a = browser(s.port);
    let last;
    for (let i = 0; i < 12; i++) last = await a.call('auth.login', { email: 'nobody@example.com', password: 'wrong-password' });
    assert.equal(last.status, 429);
  } finally { await s.close(); }
});

test('outbound fetches can’t reach private networks', async () => {
  for (const ip of ['127.0.0.1', '10.0.0.5', '169.254.169.254', '192.168.1.1', '172.20.0.1', '::1', 'fd00::1', '::ffff:127.0.0.1', '0.0.0.0']) assert.ok(isPrivateAddress(ip), ip);
  for (const ip of ['8.8.8.8', '104.18.0.1', '2606:4700::1111']) assert.ok(!isPrivateAddress(ip), ip);
  const calls = [];
  const fakeNet = async (url) => { calls.push(url); return url.includes('redirect') ? { status: 302, headers: new Headers({ location: 'http://169.254.169.254/latest' }) } : { status: 200, headers: new Headers() }; };
  const lookup = async (h) => [{ address: h === 'inside.test' ? '10.1.2.3' : '93.184.216.34' }];
  const f = safeFetch(fakeNet, lookup);
  assert.equal((await f('https://jobs.example.com/x')).status, 200);
  await assert.rejects(f('http://inside.test/'), /can’t open/);
  await assert.rejects(f('http://127.0.0.1:8080/'), /can’t open/);
  await assert.rejects(f('file:///etc/passwd'), /Only web addresses/);
  await assert.rejects(f('https://jobs.example.com/redirect'), /can’t open/, 'a redirect into the private network is caught');
  assert.equal(calls.filter((c) => c.includes('169.254')).length, 0);
});
