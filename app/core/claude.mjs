// Small Claude API client. Uses the Messages API directly (no SDK needed).
// Every task asks for JSON back and is checked before use.

export class ClaudeError extends Error { constructor(m) { super(m); this.name = 'ClaudeError'; } }

export function makeClaude({ apiKey, model = 'claude-sonnet-5-5', fastModel = 'claude-haiku-5-5', fetchImpl = fetch } = {}) {
  async function send({ system, content, fast = false, maxTokens = 4000 }) {
    if (!apiKey) throw new ClaudeError('Add your Claude API key in Profile, Settings first.');
    if (!/^sk-ant-/.test(apiKey.trim())) throw new ClaudeError('That doesn’t look like a Claude API key. Keys start with sk-ant-. Copy it again from console.anthropic.com.');
    let res;
    try { res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: fast ? fastModel : model,
        max_tokens: maxTokens,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: Array.isArray(content) && content[0]?.role ? content : [{ role: 'user', content }],
      }),
    }); } catch (e) { throw new ClaudeError(`Couldn't reach Claude. Check your internet connection. (${e.message})`); }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.error?.message || res.statusText;
      if (res.status === 401) throw new ClaudeError("Claude didn't accept this API key. Copy it again from console.anthropic.com (it starts with sk-ant-) and make sure nothing is cut off.");
      if (/credit balance/i.test(msg)) throw new ClaudeError('Your Claude Console account has no credit yet. In console.anthropic.com, go to Settings, Billing and add a few dollars, then try again.');
      if (res.status === 403) throw new ClaudeError(`This API key isn't allowed to do that (${msg}). Check the key's workspace in console.anthropic.com.`);
      if (res.status === 404 && /model/i.test(msg)) throw new ClaudeError(`Your account can't use the model "${fast ? fastModel : model}". Change it in Profile, Settings (try claude-sonnet-5-5).`);
      if (res.status === 429) throw new ClaudeError('Claude is busy or your usage limit was reached. Try again in a minute.');
      if (res.status >= 500 || res.status === 529) throw new ClaudeError('Claude is having trouble right now. Try again in a few minutes.');
      throw new ClaudeError(`Claude said: ${msg}`);
    }
    return (body.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
  }

  /** Ask for JSON. Retries once if the answer isn't valid JSON. */
  async function json(opts) {
    const system = opts.system + '\n\nReply with JSON only, no other text, matching the shape described.';
    let text = await send({ ...opts, system });
    try { return parseJson(text); } catch {
      text = await send({ ...opts, system: system + '\nYour last reply was not valid JSON. Reply with valid JSON only.' });
      return parseJson(text);
    }
  }
  return { send, json, ready: Boolean(apiKey) };
}

export function parseJson(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = t.search(/[[{]/);
  if (start < 0) throw new ClaudeError('No JSON in reply');
  return JSON.parse(t.slice(start));
}

/** Content blocks for files Claude can read directly. */
export function fileBlock({ mime, base64, text, name }) {
  if (mime === 'application/pdf') return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 }, title: name };
  if (/^image\/(png|jpeg|gif|webp)$/.test(mime)) return { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } };
  return { type: 'text', text: `File: ${name}\n\n${text ?? ''}` };
}
