import { mkdirSync } from 'node:fs';
import { runOp } from './ops.js';
import { runAssert } from './assert.js';

function scrub(text, secretValues) {
  let out = String(text ?? '');
  for (const v of secretValues) { if (v) out = out.split(v).join('****'); }
  return out;
}

export async function runCase(browser, irCase, opts) {
  const { tester = '', secrets = new Map(), outDir = '.', screenshot = false, onLog } = opts || {};
  const secretValues = [...secrets.values()].filter(Boolean);
  const relDir = `artifacts/${irCase.case_id}`;
  const fullDir = `${outDir}/${relDir}`;
  mkdirSync(fullDir, { recursive: true });

  const row = {
    case_id: irCase.case_id, name: irCase.name, status: 'pass', tester,
    finished_at: '', failure_reason: '', expected_vs_actual: '',
    evidence_path: '', discuss_note: '', jira_key: '',
  };

  const context = await browser.newContext({
    // Internal/self-signed cert targets raise ERR_CERT_AUTHORITY_INVALID, which
    // aborts every step. Ignore TLS errors by default; set AQA_TLS_VERIFY=1 to enforce.
    ignoreHTTPSErrors: process.env.AQA_TLS_VERIFY !== '1',
  });
  const page = await context.newPage();
  let lastLocator = null;

  try {
    for (const [i, step] of irCase.steps.entries()) {
      if (step.op === 'assert') {
        await runAssert(page, step.assert);
        onLog?.(`[${irCase.case_id}] step ${i + 1}: assert ${step.assert.type}`);
      } else {
        const { locator, log } = await runOp(page, step, secrets);
        lastLocator = locator || lastLocator;
        onLog?.(`[${irCase.case_id}] step ${i + 1}: ${log}`);
      }
      if (screenshot) {
        const relShot = `${relDir}/step-${i + 1}.png`;
        await page.screenshot({ path: `${outDir}/${relShot}` }).catch(() => {});
        row.evidence_path = relShot;
      }
    }
    // Every step and assert passed. A case encodes its expectation entirely in
    // its asserts — including negative scenarios (e.g. assert a Create button is
    // `disabled` when a required field is empty). So all-steps-pass IS the pass.
    row.status = 'pass';
  } catch (err) {
    // A step or assert threw → the case failed.
    row.status = 'fail';
    row.failure_reason = scrub(String(err.message ?? err), secretValues);
    row.expected_vs_actual = scrub(`Expected: step to succeed\nActual: ${String(err.message ?? err)}`, secretValues);
    const relShot = `${relDir}/failure.png`;
    await page.screenshot({ path: `${outDir}/${relShot}` }).catch(() => {});
    row.evidence_path = relShot;
  } finally {
    row.finished_at = new Date().toISOString();
    await context.close();
  }
  return row;
}
