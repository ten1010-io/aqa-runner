import { mkdirSync } from 'node:fs';
import { runOp } from './ops.js';
import { runAssert } from './assert.js';

export async function runCase(browser, irCase, opts) {
  const { tester = '', secrets = new Map(), artifactsDir = 'artifacts', screenshot = false } = opts || {};
  const caseDir = `${artifactsDir}/${irCase.case_id}`;
  mkdirSync(caseDir, { recursive: true });

  const row = {
    case_id: irCase.case_id, name: irCase.name, status: 'pass', tester,
    finished_at: '', failure_reason: '', expected_vs_actual: '',
    evidence_path: '', discuss_note: '', jira_key: '',
  };

  const context = await browser.newContext();
  const page = await context.newPage();
  let lastLocator = null;

  try {
    for (const [i, step] of irCase.steps.entries()) {
      if (step.op === 'assert') {
        await runAssert(page, step.assert);
      } else {
        const { locator } = await runOp(page, step, secrets);
        lastLocator = locator || lastLocator;
      }
      if (screenshot) {
        const shot = `${caseDir}/step-${i + 1}.png`;
        await page.screenshot({ path: shot }).catch(() => {});
        row.evidence_path = shot;
      }
    }
    // All steps succeeded.
    if (irCase.expected_result === 'pass') {
      row.status = 'pass';
    } else {
      // expected_result: 'fail' but everything passed → the error state never blocked us.
      row.status = 'fail';
      row.failure_reason = 'Expected an error/validation state, but all steps succeeded.';
      row.expected_vs_actual = 'Expected: error state\nActual: flow completed without error';
      const shot = `${caseDir}/failure.png`;
      await page.screenshot({ path: shot }).catch(() => {});
      row.evidence_path = shot;
    }
  } catch (err) {
    // A step/assert threw.
    if (irCase.expected_result === 'fail') {
      // The expected error path manifested as a failing step → that IS a pass.
      row.status = 'pass';
    } else {
      row.status = 'fail';
      row.failure_reason = String(err.message ?? err);
      row.expected_vs_actual = `Expected: step to succeed\nActual: ${String(err.message ?? err)}`;
      const shot = `${caseDir}/failure.png`;
      await page.screenshot({ path: shot }).catch(() => {});
      row.evidence_path = shot;
    }
  } finally {
    row.finished_at = new Date().toISOString();
    await context.close();
  }
  return row;
}
