#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { loadIR } from './ir-loader.js';
import { parseSecrets } from './secrets.js';
import { runCase } from './case-runner.js';
import { toCSV } from './results-csv.js';
import { renderReport } from './report-html.js';
import { discoverCases, requiredSecretKeys, CANONICAL_NAME } from './discover.js';
import { promptSecret } from './prompt.js';

const DEFAULT_CASES_DIR = 'cases';

function parseArgs(argv) {
  const a = { _: [], parallel: 2, headed: false, screenshot: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--secrets') a.secrets = argv[++i];
    else if (t === '--tester') a.tester = argv[++i];
    else if (t === '--out') a.out = argv[++i];
    else if (t === '--parallel') a.parallel = Number(argv[++i]);
    else if (t === '--cases-dir') a.casesDir = argv[++i];
    else if (t === '--headed') a.headed = true;
    else if (t === '--screenshot') a.screenshot = true;
    else a._.push(t);
  }
  return a;
}

// Friendly notice (GUI dialog if available, else stderr) when no cases file is found.
function reportNoCases(found) {
  mkdirSync(found.dir, { recursive: true });
  const msg = found.error === 'multiple'
    ? `Multiple YAML files found in "${found.dir}". Keep just one, or name the ` +
      `one to run "${CANONICAL_NAME}":\n\n- ${found.files.join('\n- ')}`
    : `No test cases found.\n\nPut your compiled "${CANONICAL_NAME}" into the ` +
      `"${found.dir}" folder, then run again.`;
  console.error(`[aqa-runner] ${msg}`);
  if (process.platform === 'darwin') {
    spawnSync('osascript', ['-e',
      `display dialog ${JSON.stringify(msg)} with title "aqa-runner" buttons {"OK"} default button "OK" with icon caution`]);
    spawnSync('open', [found.dir]);
  } else if (process.platform === 'win32') {
    spawnSync('explorer', [found.dir]);
  }
}

// Resolve every value_ref the IR needs; prompt for any not already supplied.
async function ensureSecrets(ir, secrets) {
  for (const key of requiredSecretKeys(ir)) {
    if (secrets.has(key)) continue;
    secrets.set(key, await promptSecret(key));
  }
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

  // Resolve the cases file: an explicit path wins; otherwise auto-discover the
  // single compiled YAML in the cases folder (default ./cases).
  let casesPath = args._[0];
  if (!casesPath) {
    const found = discoverCases(args.casesDir || DEFAULT_CASES_DIR);
    if (found.error) {
      reportNoCases(found);
      process.exit(2);
    }
    casesPath = found.path;
    console.error(`[aqa-runner] using ${casesPath}`);
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

  // Prompt for any secret the IR needs but secrets.env / --secrets did not supply.
  try {
    await ensureSecrets(ir, secrets);
  } catch (e) {
    console.error(`[ERROR] ${e.message}`);
    process.exit(2);
  }

  const outDir = args.out || `reports/${new Date().toISOString().replace(/[:.]/g, '-')}`;
  mkdirSync(outDir, { recursive: true });

  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: !args.headed });
  let rows;
  try {
    rows = await runPool(ir.cases, args.parallel, (c) =>
      runCase(browser, c, { tester: args.tester || '', secrets, outDir, screenshot: args.screenshot, onLog: (line) => process.stderr.write(line + '\n') }));
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
    engine: 'aqa-runner', browser: 'chromium', commit_hash: '',
  };
  writeFileSync(`${outDir}/report.html`, renderReport(meta, rows, tpl), 'utf8');

  const failed = rows.filter((r) => r.status === 'fail').length;
  console.log(`Done: ${rows.length} cases, ${rows.length - failed} pass, ${failed} fail → ${outDir}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
