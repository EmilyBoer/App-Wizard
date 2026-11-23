// Sending email (password resets, confirming an email address).
//
// With RESEND_API_KEY and MARGO_MAIL_FROM set, mail goes out through Resend (resend.com).
// Without them, nothing is sent: the message is printed to the server log, so it still works
// while there's no domain to send from. The sender address must be on a domain verified in Resend.

export function makeMailer({ fetchImpl = fetch, env = process.env, log = console.log } = {}) {
  const key = env.RESEND_API_KEY, from = env.MARGO_MAIL_FROM;
  const ready = Boolean(key && from);
  async function send({ to, subject, text }) {
    if (!ready) {
      log(`\n[mail not set up, so not sent] To: ${to}\nSubject: ${subject}\n\n${text}\n`);
      return { sent: false };
    }
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) { log(`[mail failed] ${res.status} ${await res.text().catch(() => '')}`); return { sent: false, failed: true }; }
    return { sent: true };
  }
  return { ready, send };
}

// The messages. Plain text, in Margo's voice. (Copy owns the final wording.)
export const MAIL = {
  reset: ({ name, link }) => ({
    subject: 'Reset your Margo password',
    text: `Hi ${name || 'there'},\n\nSomeone asked to reset the password for your Margo account. If that was you, choose a new one here:\n\n${link}\n\nThe link works for one hour, and only once. If you didn't ask for this, you can ignore this email. Your password hasn't changed.\n\nMargo`,
  }),
  verify: ({ name, link }) => ({
    subject: 'Confirm your email for Margo',
    text: `Hi ${name || 'there'},\n\nThanks for joining Margo. Confirm this is your email so we can reach you about your job search and help if you ever get locked out:\n\n${link}\n\nThe link works for 3 days.\n\nMargo`,
  }),
};
