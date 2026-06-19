import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runOp } from '../src/ops.js';

function fakeLocator(rec, name) {
  return {
    fill: async (v) => rec.push(['fill', name, v]),
    click: async () => rec.push(['click', name]),
    selectOption: async (v) => rec.push(['select', name, v]),
    check: async () => rec.push(['check', name]),
    uncheck: async () => rec.push(['uncheck', name]),
    hover: async () => rec.push(['hover', name]),
    press: async (k) => rec.push(['press', name, k]),
  };
}
function fakePage(rec) {
  return {
    goto: async (u) => rec.push(['goto', u]),
    keyboard: { press: async (k) => rec.push(['kbpress', k]) },
    getByRole: () => fakeLocator(rec, 'role'),
    getByLabel: () => fakeLocator(rec, 'label'),
    getByText: () => fakeLocator(rec, 'text'),
    locator: () => fakeLocator(rec, 'css'),
  };
}

test('goto calls page.goto', async () => {
  const rec = [];
  await runOp(fakePage(rec), { op: 'goto', url: 'https://x/login' }, new Map());
  assert.deepEqual(rec[0], ['goto', 'https://x/login']);
});

test('fill resolves literal value', async () => {
  const rec = [];
  await runOp(fakePage(rec), { op: 'fill', selector: { strategy: 'label', label: 'Email' }, value: 'a@b.com' }, new Map());
  assert.deepEqual(rec.at(-1), ['fill', 'label', 'a@b.com']);
});

test('fill resolves secret via value_ref and returns masked log', async () => {
  const rec = [];
  const r = await runOp(fakePage(rec), { op: 'fill', selector: { strategy: 'label', label: 'Password' }, value_ref: 'PW', sensitive: true }, new Map([['PW', 's3cret']]));
  assert.deepEqual(rec.at(-1), ['fill', 'label', 's3cret']); // real value typed
  assert.match(r.log, /\*\*\*\*/);                            // log masked
  assert.doesNotMatch(r.log, /s3cret/);
});

test('check honors checked:false → uncheck', async () => {
  const rec = [];
  await runOp(fakePage(rec), { op: 'check', selector: { strategy: 'css', css: '#x' }, checked: false }, new Map());
  assert.deepEqual(rec.at(-1), ['uncheck', 'css']);
});

test('press with no selector uses page keyboard', async () => {
  const rec = [];
  await runOp(fakePage(rec), { op: 'press', key: 'Enter' }, new Map());
  assert.deepEqual(rec.at(-1), ['kbpress', 'Enter']);
});

test('unknown op throws', async () => {
  await assert.rejects(runOp(fakePage([]), { op: 'teleport' }, new Map()), /unknown op/i);
});
