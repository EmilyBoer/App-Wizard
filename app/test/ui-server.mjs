// Test server: the real app with a fake Claude and fake job sites.
import { createApi } from '../core/api.mjs';
import { startServer } from '../server/http.mjs';
import { fakeClaude, fakeFetch, tmpDir } from './helpers.mjs';

const base = process.env.APP_WIZARD_DATA || tmpDir();
let emit = () => {};
const api = createApi({ base, fetchImpl: fakeFetch(), claudeFactory: fakeClaude(), onEvent: (e) => emit(e) });
const s = await startServer(api, { port: Number(process.env.PORT || 4399), full: true });
emit = s.emit;
console.log(`ready http://127.0.0.1:${s.port} data=${base}`);
