// Local data store: one folder per user, plain JSON files, written atomically.
// Nothing leaves the computer except what is sent to Claude to do a task.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const COLLECTIONS = ['profile', 'want', 'voice', 'design', 'sites', 'answers', 'materials', 'jobs', 'tracker', 'documents', 'interviews', 'learning', 'chat', 'settings', 'setup'];

const DEFAULTS = {
  profile: { contact: {}, roles: [], education: [], skills: [], conflicts: [], underselling: [], certifications: [] },
  want: { examples: [], titles: [], suggestedTitles: [], work: [], places: {}, ambiguous: [], payFloor: null, where: [], level: [], jobType: [], dealBreakers: [], summary: null, keywords: [] },
  voice: { samples: [], dials: { formal: 2, detail: 2, confidence: 2, color: 2 }, never: ['passionate', 'synergy', 'rockstar', 'results-driven'], approvedLines: [], notes: [] },
  design: { template: 'classic', customFonts: [], paper: 'letter', length: 'one', yearsBack: 15, canva: null },
  sites: { list: [] },
  answers: { list: [] },
  materials: { list: [] },
  jobs: { list: [], lastFetch: null, report: [] },
  tracker: { list: [] },
  documents: { list: [] },
  interviews: { list: [] },
  learning: { events: [], rules: [], lastReview: null },
  chat: { messages: [] },
  settings: { claudeKey: '', model: 'claude-sonnet-5-5', fastModel: 'claude-haiku-5-5', morningHour: 7, morningCount: 3, morningOn: true, extensionToken: '' },
  setup: { step: 1, done: [] },
};

export function defaults(name) { return structuredClone(DEFAULTS[name] ?? {}); }

export function id(prefix = '') { return prefix + crypto.randomBytes(6).toString('hex'); }

export class Store {
  constructor(root) {
    this.root = root;
    fs.mkdirSync(root, { recursive: true });
    this.cache = new Map();
  }
  file(name) { return path.join(this.root, `${name}.json`); }
  get(name) {
    if (this.cache.has(name)) return structuredClone(this.cache.get(name));
    let value = defaults(name);
    try { value = { ...value, ...JSON.parse(fs.readFileSync(this.file(name), 'utf8')) }; } catch {}
    this.cache.set(name, value);
    return structuredClone(value);
  }
  set(name, value) {
    const tmp = this.file(name) + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
    fs.renameSync(tmp, this.file(name));
    this.cache.set(name, structuredClone(value));
    return value;
  }
  update(name, fn) {
    const value = this.get(name);
    const out = fn(value) ?? value;
    return this.set(name, out);
  }
  dir(sub) { const d = path.join(this.root, sub); fs.mkdirSync(d, { recursive: true }); return d; }
}

/** Accounts live in <base>/accounts.json; each account has its own data folder. */
export class Accounts {
  constructor(base) {
    this.base = base;
    fs.mkdirSync(base, { recursive: true });
    this.file = path.join(base, 'accounts.json');
  }
  list() { try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch { return []; } }
  save(list) { fs.writeFileSync(this.file, JSON.stringify(list, null, 2)); }
  hash(password, salt) { return crypto.scryptSync(password, salt, 32).toString('hex'); }
  create({ name, email, password }) {
    email = String(email || '').trim().toLowerCase();
    if (!name || !email || !password) throw new Error('Name, email and password are all needed.');
    if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
    const list = this.list();
    if (list.some((a) => a.email === email)) throw new Error('There’s already an account with that email. Log in instead.');
    const salt = crypto.randomBytes(16).toString('hex');
    const acct = { id: id('u_'), name: String(name).trim(), email, salt, hash: this.hash(password, salt), created: new Date().toISOString() };
    list.push(acct); this.save(list);
    return this.public(acct);
  }
  login({ email, password }) {
    email = String(email || '').trim().toLowerCase();
    const acct = this.list().find((a) => a.email === email);
    if (acct && !acct.salt) throw new Error('This account signs in with LinkedIn. Use "Continue with LinkedIn", or reset your password to add one.');
    if (!acct || this.hash(String(password || ''), acct.salt) !== acct.hash) throw new Error("That email and password don't match. Try again?");
    return this.public(acct);
  }
  // ----- tokens for reset and verification: only a hash is kept, with an expiry -----
  token(a, kind, hours) {
    const raw = crypto.randomBytes(32).toString('base64url');
    a[kind] = { hash: crypto.createHash('sha256').update(raw).digest('hex'), expires: Date.now() + hours * 3600e3 };
    return raw;
  }
  takeToken(kind, raw) {
    const h = crypto.createHash('sha256').update(String(raw || '')).digest('hex');
    const list = this.list();
    const a = list.find((x) => x[kind]?.hash && crypto.timingSafeEqual(Buffer.from(x[kind].hash), Buffer.from(h)));
    if (!a || a[kind].expires < Date.now()) return { list, acct: null };
    delete a[kind];
    return { list, acct: a };
  }
  // Returns a raw token to email, or null when no account has that email (the caller says the same thing either way).
  requestReset(email) {
    email = String(email || '').trim().toLowerCase();
    const list = this.list(); const a = list.find((x) => x.email === email);
    if (!a) return null;
    const raw = this.token(a, 'reset', 1); this.save(list);
    return { token: raw, account: this.public(a) };
  }
  resetPassword(raw, password) {
    if (String(password || '').length < 8) throw new Error('Use at least 8 characters for your password.');
    const { list, acct } = this.takeToken('reset', raw);
    if (!acct) throw new Error('That reset link has expired or was already used. Ask for a new one.');
    acct.salt = crypto.randomBytes(16).toString('hex'); acct.hash = this.hash(password, acct.salt);
    acct.verified = true; // they proved they can read that inbox
    acct.epoch = (acct.epoch || 0) + 1; // signs out every other session
    this.save(list);
    return this.public(acct);
  }
  verifyToken(raw) {
    const { list, acct } = this.takeToken('verify', raw);
    if (!acct) throw new Error('That confirmation link has expired or was already used. You can send a new one from Profile.');
    acct.verified = true; this.save(list);
    return this.public(acct);
  }
  newVerifyToken(accountId) {
    const list = this.list(); const a = list.find((x) => x.id === accountId);
    if (!a || a.verified) return null;
    const raw = this.token(a, 'verify', 72); this.save(list);
    return raw;
  }
  changePassword(accountId, current, next) {
    if (String(next || '').length < 8) throw new Error('Use at least 8 characters for your new password.');
    const list = this.list(); const a = list.find((x) => x.id === accountId);
    if (!a) throw new Error('Please log in again.');
    if (a.salt && this.hash(String(current || ''), a.salt) !== a.hash) throw new Error("That current password doesn't match.");
    a.salt = crypto.randomBytes(16).toString('hex'); a.hash = this.hash(next, a.salt);
    a.epoch = (a.epoch || 0) + 1; this.save(list);
    return this.public(a);
  }
  // Sign in with LinkedIn: find by LinkedIn id, then by a verified email, else create.
  linkedIn({ sub, email, name, picture, emailVerified }) {
    if (!sub) throw new Error('LinkedIn didn’t send an account id. Try again.');
    email = String(email || '').trim().toLowerCase();
    const list = this.list();
    let a = list.find((x) => x.linkedinSub === sub);
    let created = false;
    // Join an existing account only when both sides have proved the email: otherwise someone could
    // sign up with another person's address first and wait for them to arrive through LinkedIn.
    if (!a && email && emailVerified) a = list.find((x) => x.email === email && x.verified);
    if (a) { a.linkedinSub = sub; if (emailVerified && a.email === email) a.verified = true; if (picture) a.picture = picture; }
    else {
      if (!email) throw new Error('LinkedIn didn’t share an email address, so we can’t make your account. Sign up with email instead.');
      if (list.some((x) => x.email === email)) throw new Error('There’s already an account with that email. Log in with your password.');
      a = { id: id('u_'), name: String(name || email.split('@')[0]).trim(), email, linkedinSub: sub, picture: picture || null, verified: Boolean(emailVerified), created: new Date().toISOString() };
      list.push(a); created = true;
    }
    this.save(list);
    return { account: this.public(a), created };
  }
  epoch(accountId) { return this.list().find((x) => x.id === accountId)?.epoch || 0; }
  public(a) { return { id: a.id, name: a.name, email: a.email, verified: Boolean(a.verified), linkedin: Boolean(a.linkedinSub), hasPassword: Boolean(a.salt) }; }
  storeFor(accountId) { return new Store(path.join(this.base, 'users', accountId)); }
}
