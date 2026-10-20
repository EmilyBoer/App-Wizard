import { call, esc, sparkle, act } from '../lib.js';

export async function render(root, _params, app) {
  const { hasAccounts } = await call('auth.status');
  let mode = hasAccounts ? 'login' : 'create';
  const paint = () => {
    root.innerHTML = `
<div class="login">
  <section class="art">
    <div class="brand" style="color:#fff">${sparkle(22)}App Wizard</div>
    <div class="stack" style="max-width:460px">
      <div style="font-family:var(--display);font-size:44px;line-height:48px;font-weight:800;letter-spacing:-.02em">Job applications, minus the dread.</div>
      <p style="font-size:18px;line-height:28px;opacity:.85">Set it up once. Every morning, App Wizard finds jobs that fit and has your resume and cover letter ready. You check them and press send.</p>
    </div>
    <p class="small" style="opacity:.7">Everything stays on this computer.</p>
  </section>
  <section class="form">
    <h1>${mode === 'login' ? 'Welcome back' : 'Let’s get you set up'}</h1>
    <p class="muted">${mode === 'login' ? 'Log in to pick up where you left off.' : 'Takes about 25 minutes. You can stop any time; we save as you go.'}</p>
    <form class="stack" novalidate>
      ${mode === 'create' ? '<label class="field">Your name<input type="text" name="name" autocomplete="name" required></label>' : ''}
      <label class="field">Email<input type="email" name="email" autocomplete="email" required></label>
      <label class="field">Password<input type="password" name="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required minlength="8">${mode === 'create' ? '<span class="tiny muted" style="font-weight:400">At least 8 characters.</span>' : ''}</label>
      <div class="note alert hidden" role="alert"></div>
      <button class="btn primary big" type="submit">${mode === 'login' ? 'Log in' : 'Create my account'}</button>
    </form>
    <p class="small">${mode === 'login' ? 'New here?' : 'Already have an account?'} <button class="btn link" data-switch>${mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
  </section>
</div>`;
    root.querySelector('[data-switch]').onclick = () => { mode = mode === 'login' ? 'create' : 'login'; paint(); };
    const form = root.querySelector('form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const err = form.querySelector('.alert');
      err.classList.add('hidden');
      try {
        await act(form.querySelector('[type=submit]'), () => call(mode === 'login' ? 'auth.login' : 'auth.create', data));
        root.innerHTML = '';
        app.go(mode === 'create' ? '#/setup/2' : '#/dashboard');
      } catch (ex) { err.textContent = ex.message; err.classList.remove('hidden'); }
    };
    root.querySelector('input')?.focus();
  };
  paint();
  void esc;
}
