import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toLocator } from '../src/selector.js';

function fakePage() {
  const calls = [];
  return {
    calls,
    getByRole: (role, opts) => (calls.push(['role', role, opts]), 'L'),
    getByLabel: (label) => (calls.push(['label', label]), 'L'),
    getByText: (text) => (calls.push(['text', text]), 'L'),
    locator: (css) => (calls.push(['css', css]), 'L'),
  };
}

test('role strategy → getByRole with name', () => {
  const p = fakePage();
  toLocator(p, { strategy: 'role', role: 'button', name: 'Sign in' });
  assert.deepEqual(p.calls[0], ['role', 'button', { name: 'Sign in' }]);
});

test('label strategy → getByLabel', () => {
  const p = fakePage();
  toLocator(p, { strategy: 'label', label: 'Email' });
  assert.deepEqual(p.calls[0], ['label', 'Email']);
});

test('text strategy → getByText', () => {
  const p = fakePage();
  toLocator(p, { strategy: 'text', text: 'Dashboard' });
  assert.deepEqual(p.calls[0], ['text', 'Dashboard']);
});

test('css strategy → locator', () => {
  const p = fakePage();
  toLocator(p, { strategy: 'css', css: '.primary' });
  assert.deepEqual(p.calls[0], ['css', '.primary']);
});

test('throws on unknown strategy', () => {
  assert.throws(() => toLocator(fakePage(), { strategy: 'xpath' }), /strategy/i);
});

test('throws on missing descriptor', () => {
  assert.throws(() => toLocator(fakePage(), undefined), /selector/i);
});
