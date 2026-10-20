import { call, aw, esc, sparkle, toast, on } from './lib.js';
import * as login from './screens/login.js';
import * as setup from './screens/setup.js';
import * as dashboard from './screens/dashboard.js';
import * as job from './screens/job.js';
import * as tracker from './screens/tracker.js';
import * as interviews from './screens/interviews.js';
import * as documents from './screens/documents.js';
import * as profile from './screens/profile.js';
import * as help from './screens/help.js';
import * as chat from './screens/chat.js';

const root = document.getElementById('app');
const NAV = [['Setup', '#/setup'], ['Dashboard', '#/dashboard'], ['Tracker', '#/tracker'], ['Interviews', '#/interviews'], ['Documents', '#/documents'], ['Profile', '#/profile'], ['Help', '#/help']];
const ROUTES = { login, setup, dashboard, job, tracker, interviews, interview: interviews, documents, doc: documents, profile, help };

export const app = {
  overview: null,
  async refresh() { try { app.overview = await call('app.overview'); paintNav(); } catch {} return app.overview; },
  go(hash) { if (location.hash === hash) route(); else location.hash = hash; },
  openChat(jobId, starter) { chat.open({ jobId, app, starter }); },
};
window.appWizard = app;

function shell() {
  root.innerHTML = `
<header class="top"><div class="top-in">
  <a class="brand" href="#/dashboard">${sparkle(18)}App Wizard</a>
  <nav class="nav" aria-label="Main"></nav>
  <button class="ask" data-act="chat">${sparkle(12)}Ask the wizard</button>
  <button class="avatar" data-act="me" aria-label="Account"></button>
</div></header>
<main id="screen"></main>`;
  on(root.querySelector('.top'), {
    chat: () => app.openChat(currentJobId()),
    me: () => { if (confirm('Log out of App Wizard?')) call('auth.logout').then(() => app.go('#/login')); },
  });
}

function currentJobId() { const m = location.hash.match(/^#\/job\/([^/]+)/); return m ? decodeURIComponent(m[1]) : null; }

function paintNav() {
  const nav = root.querySelector('.nav');
  if (!nav || !app.overview) return;
  const o = app.overview;
  const here = location.hash.split('/')[1] || 'dashboard';
  const map = { job: 'dashboard', interview: 'interviews', doc: 'documents' };
  const active = map[here] || here;
  const badge = { Dashboard: o.newJobs, Profile: o.pending };
  nav.innerHTML = NAV.map(([n, h]) => {
    const isOn = h.slice(2) === active;
    if (n === 'Setup' && o.setup.done.includes(10)) return '';
    return `<a href="${h}" class="${isOn ? 'on' : ''}" ${isOn ? 'aria-current="page"' : ''}>${n}${badge[n] ? `<span class="count">${badge[n]}</span>` : ''}</a>`;
  }).join('');
  const initials = String(o.account?.name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const av = root.querySelector('.avatar');
  av.textContent = initials; av.setAttribute('aria-label', `Account: ${o.account?.name || ''}. Log out`);
}

async function route() {
  const [, name = '', ...params] = location.hash.split('/');
  const status = await call('auth.status').catch(() => ({ loggedIn: false }));
  if (!status.loggedIn) {
    root.innerHTML = '';
    return login.render(root, [], app);
  }
  if (!root.querySelector('#screen')) shell();
  await app.refresh();
  let screen = ROUTES[name];
  if (!screen || name === 'login') {
    const done = app.overview.setup.done.includes(10);
    return app.go(done ? '#/dashboard' : `#/setup/${Math.max(2, app.overview.setup.step)}`);
  }
  const el = root.querySelector('#screen');
  el.innerHTML = '';
  window.scrollTo(0, 0);
  try { await screen.render(el, params.map(decodeURIComponent), app, name); }
  catch (e) { el.innerHTML = `<div class="page"><div class="note alert">${esc(e.message)}</div></div>`; console.error(e); }
  paintNav();
  el.querySelector('h1')?.setAttribute('tabindex', '-1');
}

aw.onEvent((ev) => {
  if (ev.type === 'progress') document.querySelectorAll('[data-progress]').forEach((n) => { if (!n.dataset.progress || n.dataset.progress === ev.task) n.textContent = ev.text; });
  if (ev.type === 'batch') { toast('Your morning batch is ready.'); app.refresh(); }
});
window.addEventListener('hashchange', () => { document.querySelector('.drawer')?.remove(); document.querySelector('.modal-back')?.remove(); route(); });
route();
