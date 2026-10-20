// Helpers shared by every screen.

const bridge = window.aw || {
  mode: 'web',
  async call(method, args) {
    const res = await fetch(`/api/${encodeURIComponent(method)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(args || {}) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Something went wrong.');
    return body.result;
  },
  onEvent(fn) { try { const es = new EventSource('/events'); es.onmessage = (e) => fn(JSON.parse(e.data)); } catch {} },
  pdf: null, reveal: null, open: (url) => window.open(url, '_blank', 'noopener'),
};
export const aw = bridge;
export const call = (m, a) => bridge.call(m, a);

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
export const sparkle = (n = 16) => `<svg width="${n}" height="${n}" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0 Q10 10 20 10 Q10 10 10 20 Q10 10 0 10 Q10 10 10 0Z" fill="var(--spark)"></path></svg>`;
export const tag = (text, kind = 'muted') => `<span class="tag ${kind}">${esc(text)}</span>`;
export const chip = (text, on, attrs = '') => `<button type="button" class="chip" aria-pressed="${on ? 'true' : 'false'}" ${attrs}>${esc(text)}</button>`;
export const radio = (name, value, label, checked) => `<label class="radio"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${checked ? 'checked' : ''}>${esc(label)}</label>`;

export function toast(msg, err = false) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.setAttribute('role', err ? 'alert' : 'status');
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), err ? 7000 : 3500);
}

/** Run an action from a button: shows a spinner, reports errors kindly. */
export async function act(btn, fn, { done } = {}) {
  const label = btn?.innerHTML;
  if (btn) { btn.classList.add('busy'); btn.innerHTML = `<span class="spin"></span> ${btn.dataset.busy || 'Working…'}`; }
  try { const r = await fn(); if (done) toast(done); return r; }
  catch (e) { toast(e.message, true); throw e; }
  finally { if (btn && btn.isConnected) { btn.classList.remove('busy'); btn.innerHTML = label; } }
}
export const quiet = (p) => p.catch(() => {});

export function modal(html, { onMount, wide } = {}) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" style="${wide ? 'width:min(980px,100%)' : ''}">${html}</div>`;
  const close = () => back.remove();
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  document.body.append(back);
  back.querySelector('input, textarea, select, button')?.focus();
  onMount?.(back.querySelector('.modal'), close);
  return close;
}

export function readFiles(fileList) {
  return Promise.all([...fileList].map((f) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: f.name, data: String(r.result).split(',')[1] || '' });
    r.onerror = () => reject(new Error(`Couldn't read ${f.name}`));
    r.readAsDataURL(f);
  })));
}

/** Wire a drop zone + hidden file input. */
export function dropZone(el, input, onFiles) {
  el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', () => el.classList.remove('over'));
  el.addEventListener('drop', (e) => { e.preventDefault(); el.classList.remove('over'); if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files); });
  input.addEventListener('change', () => { if (input.files.length) onFiles(input.files); input.value = ''; });
}

/** Delegate clicks on [data-act] inside root to handlers[name](el, event). */
export function on(root, handlers) {
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const fn = handlers[el.dataset.act];
    if (fn) { e.preventDefault(); Promise.resolve(fn(el, e)).catch(() => {}); }
  });
}

export function ago(iso) {
  if (!iso) return '';
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 90) return 'just now';
  if (d < 3600) return `${Math.round(d / 60)} min ago`;
  if (d < 86400) return `${Math.round(d / 3600)} hours ago`;
  const days = Math.round(d / 86400);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
export const posted = (j) => (j.ageDays == null ? '' : j.ageDays === 0 ? 'Posted today' : j.ageDays === 1 ? 'Posted yesterday' : `Posted ${j.ageDays} days ago`);
export function when(iso) {
  if (!iso) return 'Time not set';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export const VERDICT = { strong: ['Strong match', 'good'], good: ['Good match', 'info'], stretch: ['Stretch', 'att'], skip: ['Weak match', 'muted'] };
export const BUCKET = { strong: ['Strong', 'good'], good: ['Good', 'info'], maybe: ['Maybe', 'att'], weak: ['Weak', 'muted'] };
export const STATUS_TAG = { found: 'muted', saved: 'info', ready: 'att', applied: 'good', interviewing: 'info', offer: 'good', rejected: 'muted', skipped: 'muted', closed: 'muted' };

export function working(text) { return `<div class="working"><span class="spin"></span>${esc(text)}</div>`; }
