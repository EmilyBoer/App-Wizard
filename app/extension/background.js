// Talks to the App Wizard desktop app on this computer only.
const BASE = 'http://127.0.0.1:47321';

async function callApp(path, body) {
  const { token } = await chrome.storage.local.get('token');
  const res = await fetch(BASE + path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-app-wizard-token': token || '' }, body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'App Wizard didn’t answer. Is it open?');
  return data;
}

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  (async () => {
    try {
      if (msg.type === 'ping') { const r = await fetch(BASE + '/ext/ping').then((x) => x.json()); reply({ ok: true, ...r }); return; }
      if (msg.type === 'fill') reply({ ok: true, data: await callApp('/ext/fill', { url: msg.url }) });
      else if (msg.type === 'answer') reply({ ok: true, data: await callApp('/ext/answer', { question: msg.question, url: msg.url }) });
      else if (msg.type === 'submitted') reply({ ok: true, data: await callApp('/ext/submitted', { trackerId: msg.trackerId }) });
      else reply({ ok: false, error: 'Unknown' });
    } catch (e) { reply({ ok: false, error: e.message }); }
  })();
  return true;
});
