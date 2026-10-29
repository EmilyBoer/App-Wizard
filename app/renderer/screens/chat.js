import { call, esc, sparkle, toast, modal } from '../lib.js';

let drawer = null;

export function open({ jobId = null, app, starter } = {}) {
  drawer?.remove();
  drawer = document.createElement('aside');
  drawer.className = 'drawer';
  drawer.setAttribute('aria-label', 'Ask Margo');
  drawer.innerHTML = `<header>${sparkle(16)}<span class="grow">${jobId ? 'Chat about this job' : 'Ask Margo'}</span><button class="btn small" data-x aria-label="Close">Close</button></header>
<div class="msgs" aria-live="polite"></div>
<form class="composer"><label class="sr" for="cm">Message</label><textarea id="cm" rows="2" style="min-height:48px" placeholder="Ask anything, or tell me something about your work"></textarea><button class="btn primary" type="submit">Send</button></form>`;
  document.body.append(drawer);
  const msgs = drawer.querySelector('.msgs');
  const form = drawer.querySelector('form'), input = drawer.querySelector('textarea');
  drawer.querySelector('[data-x]').onclick = () => { drawer.remove(); drawer = null; };
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape' && drawer) { drawer.remove(); drawer = null; document.removeEventListener('keydown', k); } });

  const bubble = (m) => {
    const d = document.createElement('div');
    d.className = 'msg' + (m.role === 'user' ? ' me' : '');
    d.innerHTML = esc(m.text) + (m.helpLinks?.length ? `<div class="small" style="margin-top:6px">${m.helpLinks.map((h) => `<a href="#/help/${h.id}">${esc(h.title)}</a>`).join(' · ')}</div>` : '');
    for (const p of m.proposals || []) {
      const box = document.createElement('div');
      box.style.cssText = 'margin-top:8px;padding:8px 10px;border-radius:10px;background:var(--panel)';
      const label = p.type === 'add_bullet' ? `Add to ${esc(p.company || 'your profile')}:` : 'Remember this:';
      box.innerHTML = `<div class="small"><b>${label}</b> ${esc(p.text)}</div>${p.status === 'open' ? `<div class="row" style="margin-top:6px"><button class="btn small secondary" data-yes>Yes, add it</button><button class="btn small" data-edit>Not quite</button><button class="btn small" data-no>No</button></div>` : `<div class="tiny muted">${p.status === 'accepted' ? 'Added.' : 'Not added.'}</div>`}`;
      const decide = async (accept, text) => { await call('chat.decide', { messageId: m.id, proposalId: p.id, accept, text }); p.status = accept ? 'accepted' : 'declined'; box.querySelector('.row')?.remove(); box.insertAdjacentHTML('beforeend', `<div class="tiny muted">${accept ? 'Added.' : 'Not added.'}</div>`); if (accept) { toast(p.type === 'add_bullet' ? 'Added to your profile.' : 'Saved as a rule.'); app?.refresh(); } };
      box.querySelector('[data-yes]')?.addEventListener('click', () => decide(true));
      box.querySelector('[data-no]')?.addEventListener('click', () => decide(false));
      box.querySelector('[data-edit]')?.addEventListener('click', () => modal(`<h2>Fix the wording</h2><p class="muted small">Keep it true, especially numbers.</p><textarea id="pt">${esc(p.text)}</textarea><div class="row"><button class="btn primary" id="ps">Add it</button><button class="btn" data-close>Cancel</button></div>`, { onMount: (mm, close) => { mm.querySelector('#ps').onclick = () => { decide(true, mm.querySelector('#pt').value.trim()); close(); }; } }));
      d.append(box);
    }
    msgs.append(d);
    msgs.scrollTop = msgs.scrollHeight;
  };
  call('chat.history').then((h) => {
    const mine = h.filter((m) => (jobId ? m.jobId === jobId : !m.jobId)).slice(-20);
    if (!mine.length) bubble({ role: 'assistant', text: jobId ? 'Ask me anything about this job: how you fit, how to talk about a gap, what to ask them.' : 'Hi! Ask me anything about your search or how Margo works. If you tell me something about your work that isn’t in your profile, I’ll offer to add it.' });
    mine.forEach(bubble);
    if (starter) { input.value = starter; }
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    bubble({ role: 'user', text });
    const wait = document.createElement('div'); wait.className = 'msg'; wait.innerHTML = '<span class="spin"></span>'; msgs.append(wait);
    try { const reply = await call('chat.send', { text, jobId }); wait.remove(); bubble(reply); }
    catch (ex) { wait.remove(); bubble({ role: 'assistant', text: ex.message }); }
  };
  input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } };
  input.focus();
}
