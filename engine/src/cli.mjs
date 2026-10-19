#!/usr/bin/env node
// Try the job sources engine from the command line.
//
//   node src/cli.mjs add <website>            What is this site, and can we read it?
//   node src/cli.mjs jobs <sources.json>      Pull live jobs from every source in the file
//        [--max-age 30] [--out jobs.json]
//   node src/cli.mjs check <job link>         Is this job still open?

import { readFile, writeFile } from 'node:fs/promises';
import { identifyWebsite } from './detect.mjs';
import { fetchAll, checkJobLink } from './engine.mjs';

const [, , command, target, ...rest] = process.argv;
const flag = (name) => { const i = rest.indexOf(name); return i >= 0 ? rest[i + 1] : null; };

function usage() {
  console.log(`Usage:
  node src/cli.mjs add <website>
  node src/cli.mjs jobs <sources.json> [--max-age 30] [--out jobs.json]
  node src/cli.mjs check <job link>`);
  process.exit(1);
}

async function toSpecs(list) {
  const specs = [];
  for (const item of list) {
    if (typeof item !== 'string') { specs.push(item); continue; }
    const found = await identifyWebsite(item);
    if (found.kind === 'board' || found.kind === 'webpage') specs.push(found);
    else console.log(`  skipped ${found.label}: ${found.suggestion}`);
  }
  return specs;
}

const badge = { fresh: 'NEW   ', recent: 'RECENT', older: 'OLDER ', unknown: '?     ' };

async function main() {
  if (!command || !target) usage();

  if (command === 'add') {
    const r = await identifyWebsite(target);
    if (r.kind === 'board') console.log(`✓ ${r.label}. We can read this company's live job list directly.`);
    else if (r.kind === 'webpage') console.log(`✓ ${r.label}: found ${r.count} job listing(s) on the page.`);
    else console.log(`✗ ${r.label}: ${r.suggestion}`);
    console.log(JSON.stringify(r, null, 2));
    return;
  }

  if (command === 'check') {
    const r = await checkJobLink(target);
    const mark = r.open === true ? '✓ OPEN' : r.open === false ? '✗ CLOSED' : '? CAN\'T TELL';
    console.log(`${mark}: ${r.reason}`);
    if (r.job) console.log(`  ${r.job.title} · ${r.job.company} · ${r.job.location}`);
    return;
  }

  if (command === 'jobs') {
    const file = JSON.parse(await readFile(target, 'utf8'));
    const specs = await toSpecs(file.sources || file);
    const maxAge = flag('--max-age');
    const { jobs, report } = await fetchAll(specs, { maxAgeDays: maxAge ? Number(maxAge) : null });
    console.log('\nSources:');
    for (const r of report) console.log(`  ${r.error ? '✗' : '✓'} ${r.source}/${r.board}: ${r.error || `${r.jobs} open jobs`}`);
    console.log(`\n${jobs.length} jobs, newest first:\n`);
    for (const j of jobs) {
      const age = j.ageDays === null ? '' : `${j.ageDays}d`;
      console.log(`  ${badge[j.freshness]} ${age.padStart(4)}  ${j.title} · ${j.company} · ${j.location || '—'}${j.remote ? ' · remote' : ''}`);
      console.log(`               ${j.url}`);
    }
    const out = flag('--out');
    if (out) { await writeFile(out, JSON.stringify({ fetchedAt: new Date().toISOString(), report, jobs }, null, 2)); console.log(`\nSaved to ${out}`); }
    return;
  }

  usage();
}

main().catch((err) => { console.error(err.message); process.exit(1); });
