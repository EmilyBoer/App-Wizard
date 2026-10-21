const $ = (s) => document.querySelector(s);
chrome.storage.local.get('token').then(({ token }) => { $('#token').value = token || ''; });
chrome.runtime.sendMessage({ type: 'ping' }, (r) => {
  const st = $('#status');
  if (!r?.ok) { st.textContent = 'Job Wizard isn’t open. Open the app, then try again.'; st.className = 's bad'; return; }
  st.textContent = r.loggedIn ? 'Connected to Job Wizard.' : 'Open Job Wizard and log in.'; st.className = 's ' + (r.loggedIn ? 'ok' : 'bad');
});
$('#save').onclick = async () => { await chrome.storage.local.set({ token: $('#token').value.trim() }); $('#save').textContent = 'Saved'; };
$('#fill').onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: ['fill.js'] });
  window.close();
};
