import { call, esc, act, toast, on, sparkle } from '../lib.js';

// Its own tab: connecting Claude is the one technical step, so it gets room to explain itself.
export async function render(root, _p, app) {
  const paint = async () => {
    const s = await call('settings.get');
    root.innerHTML = `<div class="page" style="max-width:860px">
<div><h1>Claude</h1><p class="muted">Claude is the AI inside Job Wizard. It reads your files, checks how well jobs fit, and writes your resumes and letters. During testing, Job Wizard uses your own Claude account.</p></div>
<section class="card ${s.hasKey ? '' : 'featured'}">
  <div class="row between"><h2>${s.hasKey ? 'Connected' : 'Not connected yet'}</h2>${s.hasKey ? '<span class="tag good">✓ Working</span>' : '<span class="tag att">Needed</span>'}</div>
  <ol class="stack-s" style="margin:0;padding-left:20px">
    <li>Sign in to the Claude Console (separate from the Claude chat app, but the same email works).</li>
    <li>Add a little credit under Settings, Billing. $5 lasts most people a month or more.</li>
    <li>Press <b>Create Key</b>, name it Job Wizard, copy it, and paste it below.</li>
  </ol>
  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="btn secondary" style="align-self:flex-start">Sign in to Claude Console</a>
  <label class="field">Your API key<div class="row"><input type="password" id="key" value="${esc(s.claudeKey)}" placeholder="sk-ant-…" style="flex:1 1 300px" autocomplete="off"><button class="btn ${s.hasKey ? '' : 'primary'}" data-act="key" data-busy="Checking…">Save and test</button></div></label>
  <div class="note alert hidden" id="keyerr" role="alert"></div>
</section>
<section class="card quiet"><h2>What it costs</h2><p class="small">You pay Anthropic directly for what Job Wizard uses: usually a few dollars a month. See exactly what you've spent any time in the Console under <a href="https://console.anthropic.com/usage" target="_blank" rel="noopener">Usage</a>. In the paid version of Job Wizard, there's no key to set up.</p></section>
<details class="card"><summary><b>Advanced: which Claude models to use</b></summary><div class="row-l" style="margin-top:12px"><label class="field">Writing model<input type="text" id="model" value="${esc(s.model)}"></label><label class="field">Fast model (sorting files, quick checks)<input type="text" id="fast" value="${esc(s.fastModel)}"></label></div></details>
</div>`;
    root.querySelectorAll('#model,#fast').forEach((i) => (i.onchange = () => call('settings.save', { model: root.querySelector('#model').value, fastModel: root.querySelector('#fast').value }).then(() => toast('Saved.'))));
  };
  on(root, {
    key: (b) => act(b, async () => {
      const err = root.querySelector('#keyerr'); err.classList.add('hidden');
      try { await call('settings.save', { claudeKey: root.querySelector('#key').value }); await call('settings.testKey'); }
      catch (e) { err.textContent = e.message; err.classList.remove('hidden'); throw e; }
      await paint(); app.refresh();
    }, { done: 'Claude is connected.' }),
  });
  await paint();
  void sparkle;
}
