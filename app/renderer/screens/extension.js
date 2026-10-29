import { call, esc, on, toast, sparkle } from '../lib.js';

export async function render(root) {
  root.innerHTML = `<div class="page" style="max-width:860px">
<div><span class="tag spark">Coming soon</span><h1>Browser extension</h1><p class="muted">Apply in your browser without retyping anything. The Margo extension fills in application forms with your details and the answers you approved. You check everything and press submit yourself.</p></div>
<div class="grid">
  <div class="card tight">${sparkle(18)}<b>Fills the boring parts</b><span class="small muted">Name, email, phone, links, current job, and your resume and cover letter for that job.</span></div>
  <div class="card tight">${sparkle(18)}<b>Asks before anything personal</b><span class="small muted">Gender, race, veteran and disability questions are only filled with answers you saved here first.</span></div>
  <div class="card tight">${sparkle(18)}<b>Never presses submit</b><span class="small muted">You always see the finished form and send it yourself. It's marked Applied in Journey.</span></div>
</div>
<details class="card"><summary><b>Testing it early</b></summary><div class="stack" style="margin-top:12px" id="early"><span class="small muted">Loading…</span></div></details>
</div>`;
  const early = root.querySelector('#early');
  root.querySelector('details').addEventListener('toggle', async (e) => {
    if (!e.target.open || early.dataset.done) return;
    early.dataset.done = '1';
    const token = await call('ext.token');
    early.innerHTML = `<ol class="small stack-s" style="margin:0;padding-left:20px"><li>In Chrome or Edge, open Extensions, turn on Developer mode, press Load unpacked, and pick the <span style="font-family:var(--mono)">extension</span> folder inside the app folder.</li><li>Press the Margo icon in your browser and paste this pairing code:</li></ol>
<div class="row"><input type="text" readonly value="${esc(token)}" id="tok" style="font-family:var(--mono);flex:1 1 320px"><button class="btn" data-act="copy">Copy</button></div>
<p class="small muted">Answers it can use for demographic and legal questions are set in <a href="#/setup/8">Application answers</a>.</p>`;
  });
  on(root, { copy: () => navigator.clipboard.writeText(root.querySelector('#tok').value).then(() => toast('Copied.')) });
}
