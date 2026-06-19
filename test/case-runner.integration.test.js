import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { runCase } from '../src/case-runner.js';

const pageUrl = 'file://' + fileURLToPath(new URL('./fixtures/login.html', import.meta.url));
let browser;
before(async () => { browser = await chromium.launch(); });
after(async () => { await browser.close(); });

test('pass case: fill, click, assert dashboard visible', async () => {
  const irCase = {
    case_id: 'login-001', name: 'Valid login', expected_result: 'pass',
    steps: [
      { op: 'goto', url: pageUrl },
      { op: 'fill', selector: { strategy: 'label', label: 'Email' }, value: 'a@b.com' },
      { op: 'fill', selector: { strategy: 'label', label: 'Password' }, value_ref: 'PW', sensitive: true },
      { op: 'click', selector: { strategy: 'role', role: 'button', name: 'Sign in' } },
      { op: 'assert', assert: { type: 'visible', selector: { strategy: 'text', text: 'Dashboard' } } },
    ],
  };
  const row = await runCase(browser, irCase, { tester: 'alice', secrets: new Map([['PW', 'x']]), outDir: 'reports/_t' });
  assert.equal(row.status, 'pass');
  assert.equal(row.discuss_note, '');
});

test('fail case: assert missing element → fail with reason + evidence', async () => {
  const irCase = {
    case_id: 'login-009', name: 'Bad', expected_result: 'pass',
    steps: [
      { op: 'goto', url: pageUrl },
      { op: 'assert', assert: { type: 'visible', selector: { strategy: 'text', text: 'NeverThere' } } },
    ],
  };
  const row = await runCase(browser, irCase, { tester: 'alice', secrets: new Map(), outDir: 'reports/_t' });
  assert.equal(row.status, 'fail');
  assert.ok(row.failure_reason.length > 0);
  assert.match(row.evidence_path, /login-009/);
  assert.ok(!row.evidence_path.startsWith('reports/'));
  assert.match(row.evidence_path, /^artifacts\//);
});
