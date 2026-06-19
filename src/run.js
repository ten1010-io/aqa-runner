#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { loadIR } from './ir-loader.js';
import { parseSecrets } from './secrets.js';
import { runCase } from './case-runner.js';
import { toCSV } from './results-csv.js';
import { renderReport } from './report-html.js';

function parseArgs(argv) {
  const a = { _: [], parallel: 2, headed: false, screenshot: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--secrets') a.secrets = argv[++i];
    else if (t === '--tester') a.tester = argv[++i];
    else if (t === '--out') a.out = argv[++i];
    else if (t === '--parallel') a.parallel = Number(argv[++i]);
    else if (t === '--headed') a.headed = true;
    else if (t === '--screenshot') a.screenshot = true;
    else a._.push(t);
  }
  return a;
}

async function runPool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function lane() {
    while (next < items.length) {
      const idx = next++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, size) }, lane));
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const casesPath = args._[0];
  if (!casesPath) {
    console.error('Usage: aqa-runner <cases.compiled.yaml> [--secrets secrets.env] [--tester NAME] [--out DIR] [--headed] [--parallel N] [--screenshot]');
    process.exit(2);
  }

  let ir;
  try {
    ir = loadIR(readFileSync(casesPath, 'utf8'));
  } catch (e) {
    console.error(`[ERROR] ${e.message}`);
    process.exit(2);
  }

  const secrets = args.secrets && existsSync(args.secrets)
    ? parseSecrets(readFileSync(args.secrets, 'utf8')) : new Map();

  const outDir = args.out || `reports/${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const artifactsDir = `${outDir}/artifacts`;
  mkdirSync(artifactsDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: !args.headed });
  let rows;
  try {
    rows = await runPool(ir.cases, args.parallel, (c) =>
      runCase(browser, c, { tester: args.tester || '', secrets, artifactsDir, screenshot: args.screenshot }));
  } finally {
    await browser.close();
  }
  const finishedAt = new Date().toISOString();

  writeFileSync(`${outDir}/results.csv`, toCSV(rows), 'utf8');

  const tpl = readFileSync(new URL('../assets/report-template.html', import.meta.url), 'utf8');
  const meta = {
    executed_at: startedAt, finished_at: finishedAt,
    duration: `${Math.round((Date.parse(finishedAt) - Date.parse(startedAt)) / 1000)}s`,
    base_url: ir.cases[0]?.steps?.find((s) => s.op === 'goto')?.url || '',
    engine: 'aqa-runner', browser: 'chromium', commit_hash: ir.ir_version + '',
  };
  writeFileSync(`${outDir}/report.html`, renderReport(meta, rows, tpl), 'utf8');

  const failed = rows.filter((r) => r.status === 'fail').length;
  console.log(`Done: ${rows.length} cases, ${rows.length - failed} pass, ${failed} fail → ${outDir}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
