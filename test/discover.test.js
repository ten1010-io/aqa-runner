import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverCases, requiredSecretKeys, CANONICAL_NAME } from '../src/discover.js';

function tmp() {
  return mkdtempSync(join(tmpdir(), 'aqa-discover-'));
}

test('missing folder → error missing-dir', () => {
  const r = discoverCases(join(tmpdir(), 'definitely-not-here-xyz-123'));
  assert.equal(r.error, 'missing-dir');
});

test('empty folder → error empty', () => {
  const dir = tmp();
  try {
    assert.equal(discoverCases(dir).error, 'empty');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('single yaml → returns its path', () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, 'whatever.yaml'), 'ir_version: 1');
    assert.equal(discoverCases(dir).path, join(dir, 'whatever.yaml'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('prefers cases.compiled.yaml when multiple present', () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, 'a.yaml'), 'x');
    writeFileSync(join(dir, CANONICAL_NAME), 'x');
    assert.equal(discoverCases(dir).path, join(dir, CANONICAL_NAME));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('multiple non-canonical yaml → error multiple with file list', () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, 'a.yaml'), 'x');
    writeFileSync(join(dir, 'b.yml'), 'x');
    const r = discoverCases(dir);
    assert.equal(r.error, 'multiple');
    assert.deepEqual(r.files, ['a.yaml', 'b.yml']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('ignores non-yaml files', () => {
  const dir = tmp();
  try {
    writeFileSync(join(dir, 'notes.txt'), 'x');
    writeFileSync(join(dir, 'README.md'), 'x');
    writeFileSync(join(dir, 'only.yaml'), 'x');
    assert.equal(discoverCases(dir).path, join(dir, 'only.yaml'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('requiredSecretKeys collects value_ref keys, deduped in order', () => {
  const ir = { cases: [
    { steps: [{ op: 'fill', value_ref: 'auth_password' }, { op: 'fill', value: 'literal' }] },
    { steps: [{ op: 'fill', value_ref: 'token' }, { op: 'fill', value_ref: 'auth_password' }] },
  ] };
  assert.deepEqual(requiredSecretKeys(ir), ['auth_password', 'token']);
});

test('requiredSecretKeys returns empty when no secrets needed', () => {
  const ir = { cases: [{ steps: [{ op: 'goto', url: 'x' }, { op: 'fill', value: 'a' }] }] };
  assert.deepEqual(requiredSecretKeys(ir), []);
});
