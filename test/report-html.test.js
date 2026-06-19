import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderReport } from '../src/report-html.js';

const tpl = readFileSync(new URL('../assets/report-template.html', import.meta.url), 'utf8');
const meta = { executed_at: '2026-06-19T09:00:00Z', finished_at: '2026-06-19T09:05:00Z', duration: '5m', base_url: 'https://app.x', engine: 'aqa-runner', browser: 'chromium', commit_hash: 'abc123' };

test('fills meta + counts and leaves no placeholders', () => {
  const rows = [
    { case_id: 'a-1', name: 'ok', status: 'pass', tester: 'alice', finished_at: 't' },
    { case_id: 'a-2', name: 'bad', status: 'fail', tester: 'alice', finished_at: 't', failure_reason: 'boom', expected_vs_actual: 'E\nA', evidence_path: 'artifacts/a-2/failure.png' },
  ];
  const html = renderReport(meta, rows, tpl);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);     // no {{TOKEN}}
  assert.match(html, /aqa-runner/);
  assert.match(html, />2<\/div>\s*<div class="card-label">Total/); // total = 2
  assert.match(html, /boom/);                        // failure reason rendered
});

test('renders exactly one case block per row', () => {
  const rows = [{ case_id: 'a-1', name: 'ok', status: 'pass', tester: 'al', finished_at: 't' }];
  const html = renderReport(meta, rows, tpl);
  assert.equal((html.match(/class="case"/g) || []).length, 1);
});

test('omits IF blocks when field empty (pass row has no failure section)', () => {
  const rows = [{ case_id: 'a-1', name: 'ok', status: 'pass', tester: 'al', finished_at: 't' }];
  const html = renderReport(meta, rows, tpl);
  assert.doesNotMatch(html, /Failure Reason/);
});
