import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchesUrl, runAssert } from '../src/assert.js';

test('matchesUrl: substring match', () => {
  assert.equal(matchesUrl('https://app.x/dashboard', 'dashboard'), true);
  assert.equal(matchesUrl('https://app.x/login', 'dashboard'), false);
});

test('matchesUrl: /regex/ match', () => {
  assert.equal(matchesUrl('https://app.x/u/42', '/\\/u\\/\\d+/'), true);
  assert.equal(matchesUrl('https://app.x/u/abc', '/\\/u\\/\\d+/'), false);
});

test('url_matches assert passes/fails via page.url()', async () => {
  const page = { url: () => 'https://app.x/dashboard' };
  await runAssert(page, { type: 'url_matches', expected: 'dashboard' }); // no throw
  await assert.rejects(runAssert(page, { type: 'url_matches', expected: 'settings' }), /url_matches/);
});

test('unknown assert type throws', async () => {
  await assert.rejects(runAssert({}, { type: 'glows' }), /unknown assert/i);
});
