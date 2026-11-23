import { call, esc, act, toast, on } from '../lib.js';

// Account: email, confirmation, password, LinkedIn. Reached from Account in the top menu.
export async function render(root, _params, app) {
  const repaint = () => render(root, _params, app);
    const { account: a } = await call('auth.status');
    root.innerHTML = `<div class="page" style="max-width:760px"><div class="head"><div><h1>Account</h1><p class="muted">Your sign-in details. Questions? See <a href="#/help/account">Help</a>.</p></div></div>
<section class="card"><h2>Your account</h2>
<p>${esc(a.name)} · ${esc(a.email)} ${a.verified ? '<span class="tag new">Confirmed</span>' : '<span class="tag closed">Not confirmed yet</span>'}</p>
${a.verified ? '' : '<p class="muted small">We sent a link to confirm your email. It lets you reset your password if you forget it.</p><div class="row"><button class="btn secondary" data-act="resend" data-busy="Sending…">Send the link again</button></div><div class="note att hidden" id="devlink"></div>'}
${a.linkedin ? '<p class="small muted">You can also log in with LinkedIn.</p>' : ''}</section>
<section class="card"><h2>${a.hasPassword ? 'Change your password' : 'Add a password'}</h2>
${a.hasPassword ? '' : '<p class="muted small">You sign in with LinkedIn. To add a password, log out and use “Forgot your password?” with this email.</p>'}
${a.hasPassword ? `<form class="stack" id="pw" novalidate>
<label class="field">Current password<input type="password" name="current" autocomplete="current-password" required></label>
<label class="field">New password<input type="password" name="next" autocomplete="new-password" required minlength="8"><span class="tiny muted" style="font-weight:400">At least 8 characters. This logs you out everywhere else.</span></label>
<div class="note alert hidden" role="alert"></div>
<div class="row"><button class="btn primary" type="submit">Save new password</button></div></form>` : ''}</section>
<section class="card quiet"><h2>Log out</h2><p class="muted small">You can log back in any time.</p><div class="row"><button class="btn secondary" data-act="logout">Log out</button></div></section></div>`;
    const el = root;
    on(el, { logout: () => call('auth.logout').then(() => app.go('#/login')), resend: (b) => act(b, async () => { const r = await call('auth.resendVerify'); const d = el.querySelector('#devlink'); if (r.devLink && d) { d.innerHTML = `Email isn’t set up yet, so here’s the link: <a href="${esc(r.devLink)}">confirm my email</a>.`; d.classList.remove('hidden'); } }, { done: 'Sent. Check your email.' }) });
    const f = el.querySelector('#pw');
    if (f) f.onsubmit = async (e) => {
      e.preventDefault();
      const err = f.querySelector('.alert'); err.classList.add('hidden');
      try { await act(f.querySelector('[type=submit]'), () => call('auth.changePassword', Object.fromEntries(new FormData(f)))); toast('Password changed.'); repaint(); }
      catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
    };
  }
