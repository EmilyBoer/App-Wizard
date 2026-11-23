// "Continue with LinkedIn": Sign In with LinkedIn using OpenID Connect.
//
// LinkedIn gives ordinary apps only the person's name, email, email-verified flag and photo
// (scopes openid, profile, email). Not their work history and not their connections.
// The client secret stays on the server; the browser only ever sees LinkedIn's sign-in page.
//
// Settings: LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET from the LinkedIn developer app
// (Auth tab). The redirect address <public url>/auth/linkedin/callback must be listed there
// under "Authorized redirect URLs".

import crypto from 'node:crypto';

export function linkedInConfig(env = process.env) {
  const clientId = env.LINKEDIN_CLIENT_ID, clientSecret = env.LINKEDIN_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

// Handles /auth/linkedin/start and /auth/linkedin/callback for one server.
// handle(req, res, url, appBase, signIn): signIn(req, profile) does the rest: picks the visitor's api and signs them in; it returns { created, headers } (headers carry the new cookie).
export function linkedInRoutes({ config, publicUrl, fetchImpl = fetch }) {
  const pending = new Map(); // state -> created time (10 minutes to come back)
  const redirectUri = () => `${publicUrl()}/auth/linkedin/callback`;

  return async function handle(req, res, url, appBase, signIn, baseHeaders = {}) {
    const go = (hash, extra = {}) => { res.writeHead(302, { ...baseHeaders, ...extra, location: appBase + hash, 'cache-control': 'no-store' }); res.end(); };
    if (url.pathname === '/auth/linkedin/start') {
      if (!config) return go('#/login/linkedin-off');
      const state = crypto.randomBytes(24).toString('base64url');
      pending.set(state, Date.now());
      for (const [k, t] of pending) if (Date.now() - t > 10 * 60e3) pending.delete(k);
      const q = new URLSearchParams({ response_type: 'code', client_id: config.clientId, redirect_uri: redirectUri(), state, scope: 'openid profile email' });
      res.writeHead(302, { ...baseHeaders, location: `https://www.linkedin.com/oauth/v2/authorization?${q}`, 'cache-control': 'no-store' });
      return res.end();
    }
    if (url.pathname === '/auth/linkedin/callback') {
      const state = url.searchParams.get('state'), code = url.searchParams.get('code');
      const started = state && pending.get(state);
      pending.delete(state);
      if (url.searchParams.get('error')) return go('#/login/linkedin-cancelled');
      if (!config || !started || Date.now() - started > 10 * 60e3 || !code) return go('#/login/linkedin-failed');
      try {
        const tokenRes = await fetchImpl('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: redirectUri() }).toString(),
        });
        if (!tokenRes.ok) throw new Error(`token ${tokenRes.status}`);
        const { access_token: accessToken } = await tokenRes.json();
        const infoRes = await fetchImpl('https://api.linkedin.com/v2/userinfo', { headers: { authorization: `Bearer ${accessToken}` } });
        if (!infoRes.ok) throw new Error(`userinfo ${infoRes.status}`);
        const u = await infoRes.json();
        const { created, headers = {} } = await signIn(req, { sub: u.sub, email: u.email, name: u.name || [u.given_name, u.family_name].filter(Boolean).join(' '), picture: u.picture, emailVerified: u.email_verified === true || u.email_verified === 'true' });
        return go(created ? '#/build' : '#/journey', headers);
      } catch (err) {
        console.error('LinkedIn sign-in failed:', err.message);
        const code = /already an account/.test(err.message) ? 'linkedin-email-taken' : /didn’t share an email/.test(err.message) ? 'linkedin-no-email' : 'linkedin-failed';
        return go(`#/login/${code}`);
      }
    }
    return false;
  };
}
