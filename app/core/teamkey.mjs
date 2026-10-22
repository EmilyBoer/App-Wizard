// A Claude key built into a tester copy of the app, so testers never need their own.
// It lives in app/config/claude.json ({"key": "sk-ant-..."}), which is never committed to GitHub.
// Give that key a low spending limit in Claude Console: anyone with the app could find it.
import fs from 'node:fs';
import path from 'node:path';

export function loadTeamKey(appDir) {
  if (process.env.ANTHROPIC_API_KEY) return 'env';
  try {
    const { key } = JSON.parse(fs.readFileSync(path.join(appDir, 'config', 'claude.json'), 'utf8'));
    if (/^sk-ant-/.test(String(key || '').trim())) { process.env.ANTHROPIC_API_KEY = key.trim(); return 'built-in'; }
  } catch { /* no built-in key: people connect their own */ }
  return null;
}
