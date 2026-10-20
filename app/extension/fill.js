// Fills the application form on the current page. Never submits.
(() => {
  if (window.__appWizardRunning) { window.__appWizardPanel?.show(); return; }
  window.__appWizardRunning = true;

  const send = (msg) => new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').replace(/[*:]/g, '').trim();

  // Field rules: label words -> profile field.
  const RULES = [
    [/^first name|given name|^first$|legal first/, 'firstName'],
    [/^last name|family name|surname|^last$|legal last/, 'lastName'],
    [/^(full )?name$|^your name|^legal name/, 'fullName'],
    [/e-?mail/, 'email'],
    [/phone|mobile|cell/, 'phone'],
    [/^(current )?location|^city|where are you (located|based)|^address/, 'location'],
    [/linkedin/, 'linkedin'],
    [/website|portfolio|personal site|^url|github/, 'website'],
    [/current (company|employer)|^company$|most recent employer/, 'currentCompany'],
    [/current (title|role|position)|^title$|job title/, 'currentTitle'],
  ];

  function labelFor(el) {
    const bits = [];
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) bits.push(l.innerText); }
    const wrap = el.closest('label'); if (wrap) bits.push(wrap.innerText);
    if (el.getAttribute('aria-label')) bits.push(el.getAttribute('aria-label'));
    const lb = el.getAttribute('aria-labelledby'); if (lb) lb.split(/\s+/).forEach((id) => { const n = document.getElementById(id); if (n) bits.push(n.innerText); });
    if (!bits.length) {
      const field = el.closest('.field, .application-question, [class*="question"], [class*="field"], fieldset, li, div');
      const legend = field?.querySelector('legend, label, .label, [class*="label"], h3, h4');
      if (legend && legend !== el) bits.push(legend.innerText);
    }
    if (el.placeholder) bits.push(el.placeholder);
    if (el.name) bits.push(el.name.replace(/[_\-[\]]+/g, ' '));
    return norm(bits.find((b) => norm(b)) || '');
  }

  function setValue(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.style.outline = '2px solid #0E7A4D';
  }

  function chooseOption(select, answer) {
    const a = norm(answer);
    const opts = [...select.options];
    const hit = opts.find((o) => norm(o.text) === a) || opts.find((o) => a && norm(o.text).startsWith(a.split(' ')[0]) && norm(o.text).includes(a.split(' ').slice(-1)[0])) || opts.find((o) => a && (norm(o.text).includes(a) || a.includes(norm(o.text))) && norm(o.text).length > 1);
    if (hit) { setValue(select, hit.value); return true; }
    return false;
  }

  function similar(a, b) {
    const A = new Set(norm(a).split(' ').filter((w) => w.length > 2)), B = new Set(norm(b).split(' ').filter((w) => w.length > 2));
    if (!A.size || !B.size) return 0;
    let n = 0; for (const w of A) if (B.has(w)) n++;
    return n / Math.min(A.size, B.size);
  }

  function savedAnswer(label, answers) {
    let best = null, score = 0;
    for (const a of answers) { const s = similar(label, a.question); if (s > score) { score = s; best = a; } }
    const KEYS = { authorized: /authori[sz]ed|legally (able|eligible)|eligible to work/, sponsorship: /sponsor/, veteran: /veteran/, disability: /disabilit/, gender: /gender|sex\b/, race: /race|ethnic/, salary: /salary|compensation|pay expectation/, start: /start date|when can you start|notice period/, relocate: /relocat/, hear: /hear about|how did you find/, pronouns: /pronoun/, leaving: /why are you leaving|reason for leaving/ };
    for (const [k, re] of Object.entries(KEYS)) if (re.test(label)) { const a = answers.find((x) => x.key === k); if (a) return a; }
    return score >= 0.6 ? best : null;
  }

  async function attachFile(input, b64, name) {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], name, { type: 'application/pdf' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async function run(panel) {
    panel.status('Asking App Wizard…');
    const r = await send({ type: 'fill', url: location.href });
    if (!r?.ok) return panel.status(r?.error || 'App Wizard didn’t answer. Is it open?', true);
    const { fields, answers, job, resume, letter } = r.data;
    const filled = [], needs = [];
    const els = [...document.querySelectorAll('input, textarea, select')].filter((el) => !el.disabled && el.type !== 'hidden' && el.offsetParent !== null || el.type === 'file');
    const radiosDone = new Set();
    for (const el of els) {
      const label = labelFor(el);
      if (!label) continue;
      if (el.type === 'file') {
        if (/resume|cv/.test(label) && resume?.pdfBase64) { await attachFile(el, resume.pdfBase64, resume.file); filled.push('Resume'); }
        else if (/cover/.test(label) && letter?.pdfBase64) { await attachFile(el, letter.pdfBase64, letter.file); filled.push('Cover letter'); }
        else if (/resume|cv|cover/.test(label)) needs.push({ label, note: 'Attach your file: download the PDF from App Wizard first.' });
        continue;
      }
      if (el.type === 'radio' || el.type === 'checkbox') {
        const group = el.name || label;
        if (radiosDone.has(group)) continue;
        radiosDone.add(group);
        const groupLabel = norm(el.closest('fieldset')?.querySelector('legend')?.innerText || el.closest('[class*="question"], .field')?.querySelector('label, .label')?.innerText || label);
        const a = savedAnswer(groupLabel, answers);
        if (a) {
          const opts = [...document.querySelectorAll(`input[name="${CSS.escape(el.name)}"]`)];
          const hit = opts.find((o) => similar(labelFor(o), a.answer) >= 0.6 || norm(labelFor(o)) === norm(a.answer));
          if (hit) { hit.click(); filled.push(groupLabel); continue; }
        }
        if (el.required || /\*/.test(groupLabel)) needs.push({ label: groupLabel });
        continue;
      }
      if (el.value && el.tagName !== 'SELECT') continue;
      const rule = RULES.find(([re]) => re.test(label));
      if (rule && fields[rule[1]]) { setValue(el, fields[rule[1]]); filled.push(label); continue; }
      const a = savedAnswer(label, answers);
      if (a) {
        if (el.tagName === 'SELECT' ? chooseOption(el, a.answer) : (setValue(el, a.answer), true)) { filled.push(label); continue; }
      }
      if (/cover letter/.test(label) && el.tagName === 'TEXTAREA' && letter?.text) { setValue(el, letter.text); filled.push('Cover letter'); continue; }
      if (el.tagName === 'SELECT' && el.value) continue;
      if (el.tagName === 'TEXTAREA' || el.required || el.getAttribute('aria-required') === 'true') { needs.push({ label, el }); el.style.outline = '2px solid #D2461C'; }
    }
    panel.result({ filled, needs, job });
  }

  // ----- panel (shadow DOM so the page's styles don't leak in) -----
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
  .p{font:14px/1.4 system-ui,sans-serif;color:#14213D;background:#fff;border:2px solid #14213D;box-shadow:3px 3px 0 #14213D;border-radius:16px;width:340px;max-height:70vh;overflow:auto;padding:14px 16px;display:flex;flex-direction:column;gap:8px}
  h2{font-size:16px;margin:0;display:flex;gap:6px;align-items:center;justify-content:space-between}
  button{font:inherit;font-weight:600;padding:6px 10px;border-radius:10px;border:1px solid #14213D;background:#fff;color:#14213D;cursor:pointer}
  button.pr{background:#D2461C;color:#fff;border:2px solid #14213D;font-weight:700}
  .s{color:#56607A;font-size:13px}.bad{color:#C23B3B}.ok{color:#0E7A4D}
  ul{margin:0;padding-left:18px} li{margin:2px 0}
  .need{background:#FFE8DF;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:6px}
  </style><div class="p" role="dialog" aria-label="App Wizard"><h2><span>✦ App Wizard</span><button data-x aria-label="Close">×</button></h2><div id="body" class="s">Starting…</div></div>`;
  document.documentElement.append(host);
  const body = root.getElementById('body');
  root.querySelector('[data-x]').onclick = () => (host.style.display = 'none');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const panel = {
    show() { host.style.display = ''; run(panel); },
    status(t, bad) { body.className = 's' + (bad ? ' bad' : ''); body.textContent = t; },
    result({ filled, needs, job }) {
      body.className = '';
      body.innerHTML = `${job ? `<div class="s">${esc(job.title)} · ${esc(job.company)}</div>` : ''}
<div class="ok"><b>Filled ${filled.length} field${filled.length === 1 ? '' : 's'}</b> (outlined in green). Check them.</div>
${needs.length ? `<b>Needs you (${needs.length})</b>${needs.map((n, i) => `<div class="need"><span>${esc((n.label[0] || "").toUpperCase() + n.label.slice(1, 120))}</span>${n.note ? `<span class="s">${esc(n.note)}</span>` : n.el ? `<button data-draft="${i}">Draft an answer</button>` : ''}</div>`).join('')}` : '<div class="s">Nothing left that we know of.</div>'}
<div class="s">Press submit yourself when it all looks right.</div>
${job?.trackerId ? '<button class="pr" data-done>I submitted it</button>' : ''}`;
      body.querySelectorAll('[data-draft]').forEach((b) => (b.onclick = async () => {
        const n = needs[Number(b.dataset.draft)];
        b.textContent = 'Drafting…';
        const r = await send({ type: 'answer', question: n.label, url: location.href });
        if (!r?.ok) { b.textContent = r?.error || 'Try again'; return; }
        if (r.data.needsYou) { b.replaceWith(Object.assign(document.createElement('span'), { className: 's', textContent: `This one is yours to answer: ${r.data.why || 'it’s personal.'}` })); return; }
        setValue(n.el, r.data.answer); n.el.style.outline = '2px solid #2357C8';
        b.replaceWith(Object.assign(document.createElement('span'), { className: 's', textContent: 'Drafted from your profile (outlined in blue). Read it and edit as you like.' }));
      }));
      body.querySelector('[data-done]')?.addEventListener('click', async (e) => { await send({ type: 'submitted', trackerId: job.trackerId }); e.target.replaceWith(Object.assign(document.createElement('div'), { className: 'ok', textContent: 'Marked as applied in your tracker. Nice work!' })); });
    },
  };
  window.__appWizardPanel = panel;
  window.__appWizardTest = { labelFor, savedAnswer, RULES };
  run(panel);
})();
