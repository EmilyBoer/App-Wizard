// Accounts: password reset, email confirmation, password change, LinkedIn sign-in,
// the developer skip, and the sales page at the hosted front door.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../core/api.mjs';
import { startHosted } from '../server/hosted.mjs';
import { fakeClaude, fakeFetch, tmpDir } from './helpers.mjs';

// A mailer that keeps what it would have sent.
function inbox() {
  const sent = [];
  return { ready: true, sent, send: async (m) => { sent.push(m); return { sent: true }; }, link: (i = -1) => sent.at(i).text.match(/https?:\/\/\S+/)[0] };
}
const tokenOf = (link) => link.split('/').pop();
const make = (opts = {}) => createApi({ base: tmpDir(), fetchImpl: fakeFetch(), claudeFactory: fakeClaude(), persistSession: false, appUrl: 'https://margo.test/app/', ...opts });

test('a new account gets a confirm-email link, and the link confirms it once', async () => {
  const mail = inbox();
  const api = make({ mailer: mail });
  const acct = await api.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  assert.equal(acct.verified, false);
  assert.equal(mail.sent.length, 1);
  assert.equal(mail.sent[0].to, 'ana@example.com');
  assert.match(mail.link(), /^https:\/\/margo\.test\/app\/#\/verify\//);
  const done = await api.call('auth.verify', { token: tokenOf(mail.link()) });
  assert.equal(done.verified, true);
  assert.equal((await api.call('auth.status')).account.verified, true);
  await assert.rejects(api.call('auth.verify', { token: tokenOf(mail.link()) }), /expired|used/i);
});

test('forgot password: same answer for unknown emails, the link works once, and old sessions end', async () => {
  const mail = inbox();
  const base = tmpDir();
  const laptop = make({ base, mailer: mail });
  await laptop.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  const phone = make({ base, mailer: mail });
  await phone.call('auth.login', { email: 'ana@example.com', password: 'password-one' });

  const before = mail.sent.length;
  const unknown = await phone.call('auth.requestReset', { email: 'nobody@example.com' });
  assert.deepEqual(unknown, { ok: true, devLink: null });
  assert.equal(mail.sent.length, before, 'nothing is sent for an email with no account');

  await phone.call('auth.requestReset', { email: 'ANA@example.com ' });
  const link = mail.link();
  assert.match(link, /#\/reset\//);
  await assert.rejects(phone.call('auth.reset', { token: tokenOf(link), password: 'short' }), /8 characters/);
  await phone.call('auth.reset', { token: tokenOf(link), password: 'password-two' });
  await assert.rejects(phone.call('auth.reset', { token: tokenOf(link), password: 'password-three' }), /expired|used/i);

  // The laptop was signed in with the old password: it's signed out now.
  assert.equal((await laptop.call('auth.status')).loggedIn, false);
  await assert.rejects(laptop.call('auth.login', { email: 'ana@example.com', password: 'password-one' }));
  await laptop.call('auth.login', { email: 'ana@example.com', password: 'password-two' });
  assert.equal((await laptop.call('auth.status')).loggedIn, true);
});

test('changing your password needs the current one and signs out other sessions', async () => {
  const base = tmpDir();
  const a = make({ base, mailer: inbox() }), b = make({ base, mailer: inbox() });
  await a.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  await b.call('auth.login', { email: 'ana@example.com', password: 'password-one' });
  await assert.rejects(a.call('auth.changePassword', { current: 'wrong-password', next: 'password-two' }));
  await a.call('auth.changePassword', { current: 'password-one', next: 'password-two' });
  assert.equal((await a.call('auth.status')).loggedIn, true, 'the session that changed it stays in');
  assert.equal((await b.call('auth.status')).loggedIn, false);
});

test('reset links show on screen only on your own computer when email isn’t set up', async () => {
  const quietMail = { ready: false, send: async () => ({ sent: false }) };
  const local = make({ mailer: quietMail, devMode: true });
  await local.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  assert.match((await local.call('auth.requestReset', { email: 'ana@example.com' })).devLink, /#\/reset\//);
  const hosted = make({ mailer: quietMail, devMode: false });
  await hosted.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  assert.equal((await hosted.call('auth.requestReset', { email: 'ana@example.com' })).devLink, null);
});

test('LinkedIn sign-in makes an account once, and links to an existing confirmed account', async () => {
  const base = tmpDir();
  const api = make({ base, mailer: inbox() });
  const first = api.signInLinkedIn({ sub: 'li-1', email: 'lee@example.com', name: 'Lee Park', emailVerified: true });
  assert.equal(first.created, true);
  assert.equal((await api.call('auth.status')).account.linkedin, true);
  assert.equal((await api.call('profile.get')).contact.name, 'Lee Park');
  await api.call('auth.logout');
  assert.equal(api.signInLinkedIn({ sub: 'li-1', email: 'lee@example.com', name: 'Lee Park', emailVerified: true }).created, false);
  // No password on a LinkedIn-only account: logging in by email says so.
  await api.call('auth.logout');
  await assert.rejects(api.call('auth.login', { email: 'lee@example.com', password: 'anything-at-all' }), /LinkedIn/);

  // An email account that isn't confirmed can't be taken over by a LinkedIn sign-in with the same email.
  const mail = inbox();
  const other = make({ base, mailer: mail });
  await other.call('auth.create', { name: 'Ana', email: 'ana@example.com', password: 'password-one' });
  assert.throws(() => other.signInLinkedIn({ sub: 'li-2', email: 'ana@example.com', name: 'Ana', emailVerified: true }), /already an account/);
  await other.call('auth.verify', { token: tokenOf(mail.link()) });
  assert.equal(other.signInLinkedIn({ sub: 'li-2', email: 'ana@example.com', name: 'Ana', emailVerified: true }).created, false);
});

test('developer skip works only in developer mode and lands with setup done', async () => {
  await assert.rejects(make().call('dev.skip'), /own computer/i);
  // Inside setup, on your own account: finishes setup and keeps your answers.
  const mine = make({ devMode: true, mailer: inbox() });
  await mine.call('auth.create', { name: 'Emily', email: 'emily@example.com', password: 'password-one' });
  assert.ok(!(await mine.call('app.overview')).setup.done.includes(10));
  await mine.call('dev.finishSetup');
  assert.ok((await mine.call('app.overview')).setup.done.includes(10));
  assert.equal((await mine.call('profile.get')).contact.name, 'Emily');
  await assert.rejects(make({ mailer: inbox() }).call('dev.finishSetup'), /own computer/i);
  const api = make({ devMode: true, mailer: inbox() });
  assert.equal((await api.call('auth.status')).dev, true);
  const r = await api.call('dev.skip');
  assert.equal(r.fresh, true);
  const status = await api.call('auth.status');
  assert.equal(status.loggedIn, true);
  const o = await api.call('app.overview');
  assert.ok(o.setup.done.includes(10));
  await api.call('auth.logout');
  assert.equal((await api.call('dev.skip')).fresh, false, 'the second time reuses the same sample account');
});

test('hosted: the sales page is the front door, Margo is at /app/, and developer skip is refused', async () => {
  const s = await startHosted({ base: tmpDir(), port: 0, host: '127.0.0.1', fetchImpl: fakeFetch(), claudeFactory: fakeClaude(), secureCookies: false, guardFetch: false, mailer: inbox(), linkedin: null });
  try {
    const home = await (await fetch(`http://127.0.0.1:${s.port}/`)).text();
    assert.match(home, /on autopilot/); assert.match(home, /\/app\/#\/signup/);
    const app = await (await fetch(`http://127.0.0.1:${s.port}/app/`)).text();
    assert.match(app, /app\.js/);
    const css = await fetch(`http://127.0.0.1:${s.port}/app/app.css`);
    assert.match(css.headers.get('content-type'), /css/);
    const sneaky = await (await fetch(`http://127.0.0.1:${s.port}/app/..%2f..%2fpackage.json`)).text();
    assert.doesNotMatch(sneaky, /"name"/);
    const skip = await fetch(`http://127.0.0.1:${s.port}/api/dev.skip`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    assert.equal(skip.status, 400);
    const status = await (await fetch(`http://127.0.0.1:${s.port}/api/auth.status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })).json();
    assert.equal(status.result.dev, false); assert.equal(status.result.hosted, true); assert.equal(status.result.linkedin, false);
    const li = await fetch(`http://127.0.0.1:${s.port}/auth/linkedin/start`, { redirect: 'manual' });
    assert.equal(li.headers.get('location'), '/app/#/login/linkedin-off');
  } finally { await s.close(); }
});

test('hosted: LinkedIn sign-in checks state, signs in with a fresh cookie, and keeps the secret on the server', async () => {
  const calls = [];
  const liFetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('accessToken')) return new Response(JSON.stringify({ access_token: 'tok-1' }), { status: 200 });
    if (String(url).includes('userinfo')) return new Response(JSON.stringify({ sub: 'li-9', email: 'kim@example.com', email_verified: true, name: 'Kim Lee' }), { status: 200 });
    return new Response('no', { status: 404 });
  };
  const s = await startHosted({ base: tmpDir(), port: 0, host: '127.0.0.1', fetchImpl: fakeFetch(), claudeFactory: fakeClaude(), secureCookies: false, guardFetch: false, mailer: inbox(), linkedin: { clientId: 'cid', clientSecret: 'shh-secret' }, linkedInFetch: liFetch, publicUrl: 'https://margo.test' });
  try {
    const u = `http://127.0.0.1:${s.port}`;
    const start = await fetch(`${u}/auth/linkedin/start`, { redirect: 'manual' });
    const go = new URL(start.headers.get('location'));
    assert.equal(go.origin, 'https://www.linkedin.com');
    assert.equal(go.searchParams.get('redirect_uri'), 'https://margo.test/auth/linkedin/callback');
    assert.equal(go.searchParams.get('scope'), 'openid profile email');
    assert.ok(!start.headers.get('location').includes('shh-secret'));
    const cookie = start.headers.get('set-cookie').split(';')[0];

    const forged = await fetch(`${u}/auth/linkedin/callback?code=x&state=made-up`, { redirect: 'manual', headers: { cookie } });
    assert.equal(forged.headers.get('location'), '/app/#/login/linkedin-failed');
    assert.equal(calls.length, 0, 'a made-up state never reaches LinkedIn');

    const back = await fetch(`${u}/auth/linkedin/callback?code=abc&state=${go.searchParams.get('state')}`, { redirect: 'manual', headers: { cookie } });
    assert.equal(back.headers.get('location'), '/app/#/build');
    const fresh = back.headers.get('set-cookie').split(';')[0];
    assert.notEqual(fresh, cookie, 'signing in issues a new session id');
    assert.match(calls[0].init.body, /client_secret=shh-secret/);
    const st = await (await fetch(`${u}/api/auth.status`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: fresh }, body: '{}' })).json();
    assert.equal(st.result.account.email, 'kim@example.com');
    // The same state can't be used twice.
    const again = await fetch(`${u}/auth/linkedin/callback?code=abc&state=${go.searchParams.get('state')}`, { redirect: 'manual' });
    assert.equal(again.headers.get('location'), '/app/#/login/linkedin-failed');
  } finally { await s.close(); }
});
