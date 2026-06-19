import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSecrets, resolveStepValue, maskFor } from '../src/secrets.js';

test('parses KEY=VALUE lines, ignoring comments/blanks', () => {
  const m = parseSecrets('# comment\nPASSWORD=hunter2\n\nTOKEN=abc=def\n');
  assert.equal(m.get('PASSWORD'), 'hunter2');
  assert.equal(m.get('TOKEN'), 'abc=def'); // only first = splits
  assert.equal(m.has('# comment'), false);
});

test('resolves a value_ref step from secrets and marks masked', () => {
  const m = new Map([['PASSWORD', 'hunter2']]);
  const r = resolveStepValue({ value_ref: 'PASSWORD', sensitive: true }, m);
  assert.deepEqual(r, { value: 'hunter2', masked: true });
});

test('resolves a literal value step unmasked', () => {
  const r = resolveStepValue({ value: 'alice@example.com' }, new Map());
  assert.deepEqual(r, { value: 'alice@example.com', masked: false });
});

test('throws when value_ref is missing from secrets', () => {
  assert.throws(() => resolveStepValue({ value_ref: 'NOPE' }, new Map()), /NOPE/);
});

test('maskFor masks only when masked=true', () => {
  assert.equal(maskFor('hunter2', true), '****');
  assert.equal(maskFor('alice', false), 'alice');
});
