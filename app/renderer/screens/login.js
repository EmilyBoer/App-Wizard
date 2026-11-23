import { call, esc, sparkle, act, toast } from '../lib.js';

// The signed-out screen. Modes: log in, sign up, forgot password, choose a new password
// (from an emailed link), and confirming an email address. Reached from the sales page as
// #/signup or #/login; emailed links arrive as #/reset/<token> and #/verify/<token>.
const LINKEDIN_NOTES = {
  'linkedin-cancelled': 'LinkedIn sign-in was cancelled. You can try again, or use your email.',
  'linkedin-failed': 'We couldn’t finish signing you in with LinkedIn. Try again, or use your email.',
  'linkedin-off': 'LinkedIn sign-in isn’t switched on yet. Use your email for now.',
  'linkedin-email-taken': 'There’s already a Margo account with that email. Log in with your password, then you can use LinkedIn next time.',
  'linkedin-no-email': 'LinkedIn didn’t share an email address, so we couldn’t make your account. Sign up with your email instead.',
};

export async function render(root, _params, app) {
  const status = await call('auth.status');
  const [, route = '', arg = ''] = location.hash.split('/');
  let mode = route === 'reset' && arg ? 'reset' : route === 'signup' ? 'create' : route === 'login' ? 'login' : route === 'forgot' ? 'forgot' : status.hasAccounts || status.hosted ? 'login' : 'create';
  if (status.hosted && !route) mode = 'create';
  let note = LINKEDIN_NOTES[decodeURIComponent(arg)] || '';
  let devLink = '';

  const title = { login: 'Welcome back', create: 'Let’s get you set up', forgot: 'Reset your password', reset: 'Choose a new password', sent: 'Check your email' };
  const lede = {
    login: 'Log in to pick up where you left off.',
    create: 'Takes about 25 minutes. You can stop any time; we save as you go.',
    forgot: 'Tell us your email and we’ll send a link to choose a new password.',
    reset: 'Pick a new password. It signs you out everywhere else.',
    sent: 'If there’s a Margo account with that email, a reset link is on its way. It works for one hour.',
  };

  const fields = () => {
    if (mode === 'sent') return '';
    if (mode === 'forgot') return '<label class="field">Email<input type="email" name="email" autocomplete="email" required></label>';
    if (mode === 'reset') return '<label class="field">New password<input type="password" name="password" autocomplete="new-password" required minlength="8"><span class="tiny muted" style="font-weight:400">At least 8 characters.</span></label>';
    return `${mode === 'create' ? '<label class="field">Your name<input type="text" name="name" autocomplete="name" required></label>' : ''}
      <label class="field">Email<input type="email" name="email" autocomplete="email" required></label>
      <label class="field">Password<input type="password" name="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required minlength="8">${mode === 'create' ? '<span class="tiny muted" style="font-weight:400">At least 8 characters.</span>' : ''}</label>
      ${mode === 'login' ? '<button type="button" class="btn link small" data-mode="forgot" style="align-self:flex-start">Forgot your password?</button>' : ''}`;
  };
  const submitLabel = { login: 'Log in', create: 'Create my account', forgot: 'Send the reset link', reset: 'Save and log in' };

  const paint = () => {
    const withLinkedIn = status.linkedin && (mode === 'login' || mode === 'create');
    root.innerHTML = `
<div class="login">
  <section class="art">
    ${status.hosted ? '<a class="brand" href="/" style="text-decoration:none;color:inherit">' + sparkle(22) + 'margo</a>' : `<div class="brand">${sparkle(22)}margo</div>`}
    <div class="stack" style="max-width:480px">
      <div class="big-line">Apply on autopilot,<br>in <span class="accent-word" style="text-decoration:underline;text-decoration-color:var(--pink);text-decoration-thickness:4px;text-underline-offset:6px">your</span> voice.</div>
      <p style="font-size:18px;line-height:28px">An AI extension of you that finds the right jobs, writes in your voice, and preps you for interviews. You approve every step.</p>
    </div>
    <p class="small muted">${status.hosted ? 'Your account and everything in it are private to you.' : 'Everything stays on this computer.'}</p>
  </section>
  <section class="form">
    <h1>${title[mode]}</h1>
    <p class="muted">${lede[mode]}</p>
    ${note ? `<div class="note info" role="status">${esc(note)}</div>` : ''}
    ${devLink ? `<div class="note att" role="status">Email isn’t set up yet, so here’s the link we would have sent: <a href="${esc(devLink)}">open it</a>.</div>` : ''}
    ${withLinkedIn ? `<a class="btn secondary big linkedin" href="/auth/linkedin/start" style="justify-content:center">Continue with LinkedIn</a>
    <div class="or" aria-hidden="true"><span>or with your email</span></div>` : ''}
    ${mode === 'sent' ? '' : `<form class="stack" novalidate>
      ${fields()}
      <div class="note alert hidden" role="alert"></div>
      <button class="btn primary big" type="submit">${submitLabel[mode]}</button>
    </form>`}
    <p class="small">${mode === 'login' ? 'New here?' : mode === 'create' ? 'Already have an account?' : ''}
      <button class="btn link" data-mode="${mode === 'login' ? 'create' : 'login'}">${mode === 'login' ? 'Create an account' : mode === 'create' ? 'Log in' : 'Back to log in'}</button></p>
    ${status.dev ? `<div class="dev-skip">
      <button type="button" class="btn link small" data-dev>Developer skip</button>
      <span class="tiny muted">Only on your own computer. Opens a sample account with setup done.</span>
    </div>` : ''}
  </section>
</div>`;
    root.querySelectorAll('[data-mode]').forEach((b) => { b.onclick = () => { mode = b.dataset.mode; note = ''; devLink = ''; if (location.hash.match(/^#\/(reset|verify|login|signup|forgot)/)) history.replaceState(null, '', location.pathname + location.search); paint(); }; });
    root.querySelector('[data-dev]')?.addEventListener('click', async (e) => {
      await act(e.currentTarget, () => call('dev.skip'));
      root.innerHTML = ''; app.go('#/journey');
    });
    const form = root.querySelector('form');
    if (form) form.onsubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const err = form.querySelector('.alert');
      err.classList.add('hidden');
      try {
        if (mode === 'forgot') {
          const r = await act(form.querySelector('[type=submit]'), () => call('auth.requestReset', data));
          mode = 'sent'; devLink = r.devLink || ''; return paint();
        }
        if (mode === 'reset') {
          await act(form.querySelector('[type=submit]'), () => call('auth.reset', { token: arg, password: data.password }));
          history.replaceState(null, '', location.pathname + location.search);
          toast('Password saved. You’re logged in.');
          root.innerHTML = ''; return app.go('#/journey');
        }
        const r = await act(form.querySelector('[type=submit]'), () => call(mode === 'login' ? 'auth.login' : 'auth.create', data));
        if (r?.devLink) toast('Email isn’t set up yet. The confirm link is in Profile.');
        root.innerHTML = '';
        app.go(mode === 'create' ? '#/build' : '#/journey');
      } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
    };
    root.querySelector('form input')?.focus();
  };
  paint();
}
