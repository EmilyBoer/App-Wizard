import { call, esc, on } from '../lib.js';

// Help: every question on one page, as an accordion. Search narrows the list.
// A link to #/help/<id> opens that answer and scrolls to it.
export async function render(root, [id], app) {
  root.innerHTML = `<div class="page help-page" style="max-width:820px"><h1>Help</h1><p class="muted">Short answers to common questions.</p>
<label class="sr" for="q">Search help</label><input type="search" id="q" class="help-search" placeholder="Search: edit my resume, password, LinkedIn, fonts…">
<div class="faq" id="res"></div>
<div class="help-ask"><b>Can’t find it?</b> <span class="muted">Ask Margo in plain words.</span> <button class="btn secondary small" data-act="ask">Ask Margo</button></div></div>`;
  const q = root.querySelector('#q'), res = root.querySelector('#res');
  const search = async (openId) => {
    const r = await call('help.search', { q: q.value });
    res.innerHTML = r.length ? r.map((a) => `<details id="help-${esc(a.id)}" ${a.id === openId ? 'open' : ''}><summary>${esc(a.title)}</summary><div class="help-body">${linkify(esc(a.body))}</div></details>`).join('') : '<p class="muted">No answers match. Try other words, or ask Margo.</p>';
  };
  q.oninput = () => search();
  on(root, { ask: () => app.openChat() });
  await search(id);
  if (id) root.querySelector(`#help-${CSS.escape(id)}`)?.scrollIntoView({ block: 'start' });
  else q.focus();
}
const linkify = (s) => s.replace(/https?:\/\/[^\s<]+[^\s<.,)]/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.replace(/^https:\/\//, '')}</a>`).replace(/(Profile, Settings|Setup, Job sites|Setup, Your materials|Profile, What we’ve learned|Profile, Resume design)/g, (m) => `<a href="#${{ 'Profile, Settings': '/claude', 'Setup, Job sites': '/setup/7', 'Setup, Your materials': '/setup/2', 'Profile, What we’ve learned': '/profile/learned', 'Profile, Resume design': '/profile/design' }[m]}">${m}</a>`);
