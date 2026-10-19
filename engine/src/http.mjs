// Small fetch helpers. Every function takes an optional `fetchImpl` so tests can
// pass a fake and the app can pass its own (for example, one with a proxy).

const USER_AGENT = 'AppWizard/0.1 (job search assistant; reads public job listings)';
const TIMEOUT_MS = 20000;

export async function getText(url, { fetchImpl = fetch, headers = {} } = {}) {
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/json;q=0.9,*/*;q=0.8', ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'follow',
  });
  if (!res.ok) {
    const err = new Error(`${res.status} from ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.text();
}

export async function getJson(url, opts = {}) {
  const text = await getText(url, { ...opts, headers: { Accept: 'application/json', ...(opts.headers || {}) } });
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Not JSON from ${url}`);
  }
}
