// Turning Claude's draft profile into the saved profile, and the person's
// choices (settle a conflict, accept something we found) into changes.

import { id } from './store.mjs';

const key = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Merge a fresh draft with the saved profile, keeping ids and approved choices. */
export function mergeProfile(saved, draft) {
  const out = {
    contact: { ...(draft.contact || {}), ...pickFilled(saved.contact || {}) },
    summary: saved.summaryApproved ? saved.summary : (draft.summary || saved.summary || ''),
    summaryApproved: Boolean(saved.summaryApproved),
    roles: [], education: [], certifications: [], skills: [],
    conflicts: [], underselling: [],
  };
  const savedRoles = saved.roles || [];
  for (const r of draft.roles || []) {
    const old = savedRoles.find((s) => key(s.company) === key(r.company) && (key(s.title) === key(r.title) || s.start === r.start));
    const role = old ? { ...old } : { id: id('r_'), company: r.company, title: r.title, start: r.start, end: r.end, location: r.location || '', bullets: [], sources: [] };
    if (!old || !old.locked) Object.assign(role, { start: old?.settled?.start ?? r.start, end: old?.settled?.end ?? r.end, title: old?.settled?.title ?? r.title });
    role.sources = [...new Set([...(role.sources || []), ...(r.sources || [])])];
    const bullets = [...(role.bullets || [])];
    for (const b of r.bullets || []) {
      if (bullets.some((x) => similar(x.text, b.text))) continue;
      bullets.push({ id: id('b_'), text: b.text, sources: b.sources || [], added: new Date().toISOString() });
    }
    role.bullets = bullets;
    out.roles.push(role);
  }
  // roles only in the saved profile (added by hand) stay
  for (const s of savedRoles) if (!out.roles.some((r) => r.id === s.id) && s.manual) out.roles.push(s);
  out.roles.sort((a, b) => dateKey(b.end) - dateKey(a.end) || dateKey(b.start) - dateKey(a.start));

  out.education = uniqBy([...(saved.education || []), ...(draft.education || [])], (e) => key(e.school) + key(e.degree)).map((e) => ({ id: e.id || id('e_'), ...e }));
  out.certifications = uniqBy([...(saved.certifications || []), ...(draft.certifications || [])], (c) => key(c.name)).map((c) => ({ id: c.id || id('c_'), ...c }));
  const removedSkills = new Set((saved.removedSkills || []).map(key));
  out.skills = uniqBy([...(saved.skills || []), ...(draft.skills || [])], (s) => key(s.name)).filter((s) => !removedSkills.has(key(s.name)));
  out.removedSkills = saved.removedSkills || [];

  const settled = new Set((saved.conflicts || []).filter((c) => c.chosen != null).map(conflictKey));
  out.conflicts = [
    ...(saved.conflicts || []).filter((c) => c.chosen != null),
    ...(draft.conflicts || []).filter((c) => !settled.has(conflictKey(c)) && (c.options || []).length > 1).map((c) => ({ id: id('k_'), ...c, chosen: null })),
  ];
  const decided = saved.underselling || [];
  out.underselling = [...decided];
  for (const u of draft.underselling || []) {
    if (decided.some((d) => similar(d.text, u.text))) continue;
    if (out.roles.some((r) => r.bullets.some((b) => similar(b.text, u.text)))) continue;
    out.underselling.push({ id: id('u_'), ...u, status: 'pending' });
  }
  return out;
}

export function settleConflict(profile, conflictId, value) {
  const c = profile.conflicts.find((x) => x.id === conflictId);
  if (!c) throw new Error('That question is already settled.');
  c.chosen = value;
  const role = profile.roles.find((r) => key(r.company) === key(c.company));
  if (role && ['start', 'end', 'title', 'company'].includes(c.field)) {
    role[c.field] = value;
    role.settled = { ...(role.settled || {}), [c.field]: value };
  }
  return profile;
}

export function decideUnderselling(profile, itemId, decision, text) {
  const u = profile.underselling.find((x) => x.id === itemId);
  if (!u) throw new Error('Not found.');
  u.status = decision; // added | no
  if (decision === 'added') {
    const finalText = String(text || u.text).trim();
    let role = profile.roles.find((r) => key(r.company) === key(u.company)) || profile.roles[0];
    if (!role) throw new Error('Add a role first.');
    role.bullets.push({ id: id('b_'), text: finalText, sources: [u.source].filter(Boolean), confirmed: true, added: new Date().toISOString() });
    u.text = finalText;
  }
  return profile;
}

export function addBullet(profile, company, text, source = 'you') {
  const role = profile.roles.find((r) => key(r.company) === key(company)) || profile.roles[0];
  if (!role) throw new Error('Add a role first.');
  const b = { id: id('b_'), text: String(text).trim(), sources: [source], confirmed: true, added: new Date().toISOString() };
  role.bullets.push(b);
  return b;
}

export function pendingCount(profile) {
  return (profile.conflicts || []).filter((c) => c.chosen == null).length + (profile.underselling || []).filter((u) => u.status === 'pending').length;
}

function conflictKey(c) { return key(c.company) + '|' + c.field; }
function pickFilled(o) { return Object.fromEntries(Object.entries(o).filter(([, v]) => v)); }
function uniqBy(list, fn) { const seen = new Set(); return list.filter((x) => { const k = fn(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
export function dateKey(d) {
  if (!d || /present|now|current/i.test(d)) return 999999;
  const m = String(d).match(/(\d{4})(?:-(\d{1,2}))?/);
  return m ? Number(m[1]) * 100 + Number(m[2] || 6) : 0;
}

/** Word-overlap similarity, good enough to spot the same bullet written twice. */
export function similar(a, b, threshold = 0.72) {
  const A = new Set(key(a).split(' ').filter((w) => w.length > 2));
  const B = new Set(key(b).split(' ').filter((w) => w.length > 2));
  if (!A.size || !B.size) return false;
  let both = 0; for (const w of A) if (B.has(w)) both++;
  return both / Math.min(A.size, B.size) >= threshold;
}

export function yearsOfExperience(profile) {
  const starts = (profile.roles || []).map((r) => dateKey(r.start)).filter((d) => d > 0 && d < 999999);
  if (!starts.length) return 0;
  const first = Math.min(...starts);
  return Math.max(0, new Date().getFullYear() - Math.floor(first / 100));
}
