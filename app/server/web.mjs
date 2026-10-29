// Run Margo in your browser: npm run web, then open the address shown.
// Same app as the desktop version, minus saving PDFs straight to a folder
// (the browser's print dialog is used instead) and the background morning run.

import os from 'node:os';
import path from 'node:path';
import { createApi } from '../core/api.mjs';
import { startServer } from './http.mjs';
import { loadTeamKey } from '../core/teamkey.mjs';
import { fileURLToPath } from 'node:url';
loadTeamKey(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

const base = process.env.APP_WIZARD_DATA || path.join(os.homedir(), '.app-wizard');
let emit = () => {};
const api = createApi({ base, onEvent: (e) => emit(e) });
const port = Number(process.env.PORT || 4321);
const started = await startServer(api, { port, full: true });
emit = started.emit;
console.log(`Margo is running at http://127.0.0.1:${started.port}  (data in ${base})`);
