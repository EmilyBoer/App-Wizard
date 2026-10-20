// Small Claude API client. Uses the Messages API directly (no SDK needed).
// Every task asks for JSON back and is checked before use.

export class ClaudeError extends Error {}

export function makeClaude({ apiKey, model = 'claude-sonnet-5-5', fastModel = 'claude-haiku-5-5', fetchImpl = fetch } = {}) {
  async function send({ system, content, fast = false, maxTokens = 4000, temperature = 0.3 }) {
    if (!apiKey) throw new ClaudeError('Add your Claude API key in Profile, Settings first.');
    const res = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: fast ? fastModel : model,
        max_tokens: maxTokens,
        temperature,
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: Array.isArray(content) && content[0]?.role ? content : [{ role: 'user', content }],
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body?.error?.message || res.statusText;
      if (res.status === 401) throw new ClaudeError("Claude didn't accept the API key. Check it in Profile, Settings.");
      if (res.status === 429) throw new ClaudeError('Claude is busy or your usage limit was reached. Try again in a minute.');
      throw new ClaudeError(`Claude error: ${msg}`);
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
