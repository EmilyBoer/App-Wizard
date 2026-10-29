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
import * as builder from './screens/builder.js';
import * as claudePage from './screens/claude.js';
import * as extensionPage from './screens/extension.js';

const root = document.getElementById('app');
const NAV = [['Profile', '#/profile'], ['Journey', '#/journey'], ['Interviews', '#/interviews'], ['Documents', '#/documents'], ['Claude', '#/claude'], ['Extension', '#/extension'], ['Help', '#/help']];
const ROUTES = { login, setup, build: builder, claude: claudePage, extension: extensionPage, journey: dashboard, dashboard, tracker: dashboard, job, interviews, interview: interviews, documents, doc: documents, profile, help };

export const app = {
  overview: null,
  async refresh() { try { app.overview = await call('app.overview'); paintNav(); } catch {} return app.overview; },
  go(hash) { if (location.hash === hash) route(); else location.hash = hash; },
  openChat(jobId, starter) { chat.open({ jobId, app, starter }); },
};
window.margot = app; window.appWizard = app; // old name kept for the extension and tests

function shell() {
  root.innerHTML = `
<header class="top"><div class="top-in">
  <a class="brand" href="#/journey" aria-label="Margot, home">${sparkle(18)}margot</a>
  <nav class="nav" aria-label="Main"></nav>
  <button class="ask" data-act="chat">${sparkle(12)}Ask Margot</button>
  <button class="btn small logout" data-act="me">Log out</button>
</div></header>
<main id="screen"></main>`;
  on(root.querySelector('.top'), {
    chat: () => app.openChat(currentJobId()),
    me: () => { if (confirm('Log out of Margot?')) call('auth.logout').then(() => app.go('#/login')); },
  });
}

function currentJobId() { const m = location.hash.match(/^#\/job\/([^/]+)/); return m ? decodeURIComponent(m[1]) : null; }

function paintNav() {
  const nav = root.querySelector('.nav');
  if (!nav || !app.overview) return;
  const o = app.overview;
  const here = location.hash.split('/')[1] || 'dashboard';
  const map = { job: 'journey', dashboard: 'journey', tracker: 'journey', interview: 'interviews', doc: 'documents', setup: 'profile' };
  const active = map[here] || here;
  const badge = { Journey: o.newJobs };
  nav.innerHTML = NAV.filter(([n]) => !(n === 'Claude' && o.builtInKey)).map(([n, h]) => {
    const isOn = h.slice(2) === active;
    return `<a href="${h}" class="${isOn ? 'on' : ''}" ${isOn ? 'aria-current="page"' : ''}>${n}${badge[n] ? `<span class="count">${badge[n]}</span>` : ''}${n === 'Extension' ? ' <span class="soon">soon</span>' : ''}${n === 'Claude' && !o.hasKey ? ' <span class="count">!</span>' : ''}</a>`;
  }).join('');
  root.querySelector('.logout')?.setAttribute('aria-label', `Log out${o.account?.name ? ` (${o.account.name})` : ''}`);
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
  const done = app.overview.setup.done.includes(10);
  let screen = ROUTES[name];
  // Until setup is finished, setup is the only place to be.
  if (!screen || name === 'login' || (!done && name !== 'build')) {
    return app.go(done ? '#/journey' : '#/build');
  }
  // Setup only runs the first time. After that, answers are changed in Profile.
  if (done && name === 'build') return app.go('#/profile');
  document.body.classList.toggle('building', name === 'build');
  // A fresh container per screen, so click handlers from earlier screens never pile up.
  const el = document.createElement('main');
  el.id = 'screen';
  root.querySelector('#screen').replaceWith(el);
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
