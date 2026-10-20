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
  design: { template: 'classic', fonts: { heading: 'Inter', body: 'Inter' }, customFonts: [], paper: 'letter', length: 'one', yearsBack: 15, accent: '#14213D', canva: null },
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
    if (list.some((a) => a.email === email)) throw new Error('There is already an account with that email on this computer. Log in instead.');
    const salt = crypto.randomBytes(16).toString('hex');
    const acct = { id: id('u_'), name: String(name).trim(), email, salt, hash: this.hash(password, salt), created: new Date().toISOString() };
    list.push(acct); this.save(list);
    return this.public(acct);
  }
  login({ email, password }) {
    email = String(email || '').trim().toLowerCase();
    const acct = this.list().find((a) => a.email === email);
    if (!acct || this.hash(String(password || ''), acct.salt) !== acct.hash) throw new Error("That email and password don't match. Try again?");
    return this.public(acct);
  }
  public(a) { return { id: a.id, name: a.name, email: a.email }; }
  storeFor(accountId) { return new Store(path.join(this.base, 'users', accountId)); }
}
