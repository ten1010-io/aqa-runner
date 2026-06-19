import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadIR } from '../src/ir-loader.js';

const valid = readFileSync(new URL('./fixtures/valid-ir.yaml', import.meta.url), 'utf8');
const raw = readFileSync(new URL('./fixtures/raw-cases.yaml', import.meta.url), 'utf8');

test('loads a valid IR file', () => {
  const ir = loadIR(valid);
  assert.equal(ir.ir_version, 1);
  assert.equal(ir.cases.length, 1);
  assert.equal(ir.cases[0].case_id, 'login-001');
});

test('rejects raw cases.yaml (no ir_version, has action steps)', () => {
  assert.throws(() => loadIR(raw), /not compiled|ir_version/i);
});

test('rejects unsupported ir_version', () => {
  assert.throws(() => loadIR('ir_version: 2\nname: x\ncases: []\n'), /version/i);
});

test('rejects empty cases', () => {
  assert.throws(() => loadIR('ir_version: 1\nname: x\ncases: []\n'), /cases/i);
});

test('rejects a step carrying a natural-language action', () => {
  const bad = 'ir_version: 1\nname: x\ncases:\n  - case_id: a-1\n    name: a\n    expected_result: pass\n    steps:\n      - action: "do it"\n';
  assert.throws(() => loadIR(bad), /not compiled|action/i);
});

test('rejects a sensitive step that carries a literal value', () => {
  const bad = 'ir_version: 1\nname: x\ncases:\n  - case_id: a-1\n    name: a\n    expected_result: pass\n    steps:\n      - op: fill\n        selector: { strategy: label, label: "Password" }\n        value: "hunter2"\n        sensitive: true\n';
  assert.throws(() => loadIR(bad), /sensitive|value_ref|baked/i);
});
