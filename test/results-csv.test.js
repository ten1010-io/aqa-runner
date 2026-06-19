import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvField, toCSV } from '../src/results-csv.js';

test('csvField leaves plain text unquoted', () => {
  assert.equal(csvField('alice'), 'alice');
});

test('csvField quotes commas, newlines, and doubles quotes', () => {
  assert.equal(csvField('Login, wrong'), '"Login, wrong"');
  assert.equal(csvField('a\nb'), '"a\nb"');
  assert.equal(csvField('say "hi"'), '"say ""hi"""');
});

test('toCSV writes header in exact column order', () => {
  const csv = toCSV([]);
  assert.equal(csv.trim(), 'case_id,name,status,tester,finished_at,failure_reason,expected_vs_actual,evidence_path,discuss_note,jira_key');
});

test('toCSV emits a pass row with empty optional fields', () => {
  const csv = toCSV([{ case_id: 'login-001', name: 'Valid login', status: 'pass', tester: 'alice', finished_at: '2026-06-19T09:00:00Z' }]);
  const lines = csv.trim().split('\n');
  assert.equal(lines[1], 'login-001,Valid login,pass,alice,2026-06-19T09:00:00Z,,,,,');
});
