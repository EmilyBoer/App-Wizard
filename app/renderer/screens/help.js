import { call, esc, on } from '../lib.js';

export async function render(root, [id], app) {
  if (id) {
    const a = await call('help.get', { id });
    root.innerHTML = `<div class="page" style="max-width:820px"><a href="#/help" class="small">← Help</a>${a ? `<h1>${esc(a.title)}</h1><div class="help-body">${linkify(esc(a.body))}</div>` : '<div class="note alert">Article not found.</div>'}
<section class="card quiet"><b>Still stuck?</b><span class="small muted">Ask the wizard: it knows these articles and your setup.</span><button class="btn secondary" data-act="ask" style="align-self:flex-start">Ask the wizard</button></section></div>`;
    on(root, { ask: () => app.openChat() });
    return;
  }
  root.innerHTML = `<div class="page" style="max-width:820px"><h1>Help</h1><p class="muted">Short answers to common questions.</p>
<label class="sr" for="q">Search help</label><input type="text" id="q" placeholder="Search: edit my resume, LinkedIn, fonts…" style="font-size:18px;padding:12px 16px">
<div class="list" id="res"></div>
<section class="card quiet"><b>Can’t find it?</b><span class="small muted">Ask the wizard in plain words.</span><button class="btn secondary" data-act="ask" style="align-self:flex-start">Ask the wizard</button></section></div>`;
  const q = root.querySelector('#q'), res = root.querySelector('#res');
  const search = async () => { const r = await call('help.search', { q: q.value }); res.innerHTML = r.length ? r.map((a) => `<a class="item" href="#/help/${a.id}" style="text-decoration:none;color:inherit"><div class="grow"><div>${esc(a.title)}</div></div><span aria-hidden="true">→</span></a>`).join('') : '<div class="item muted">No articles match. Try other words, or ask the wizard.</div>'; };
  q.oninput = search;
  on(root, { ask: () => app.openChat() });
  search(); q.focus();
}
const linkify = (s) => s.replace(/(Profile, Settings|Setup, Job sites|Setup, Your materials|Profile, What we’ve learned|Profile, Resume design)/g, (m) => `<a href="#${{ 'Profile, Settings': '/profile/settings', 'Setup, Job sites': '/setup/7', 'Setup, Your materials': '/setup/2', 'Profile, What we’ve learned': '/profile/learned', 'Profile, Resume design': '/setup/5' }[m]}">${m}</a>`);
