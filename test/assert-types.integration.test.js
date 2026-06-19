import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { runAssert } from '../src/assert.js';

const pageUrl = 'file://' + fileURLToPath(new URL('./fixtures/login.html', import.meta.url));
let browser;
let page;
before(async () => {
  browser = await chromium.launch();
  const context = await browser.newContext();
  page = await context.newPage();
  await page.goto(pageUrl);
});
after(async () => { await browser.close(); });

test('hidden: #dash is hidden before click', async () => {
  await runAssert(page, { type: 'hidden', selector: { strategy: 'css', css: '#dash' } });
});

test('text_contains: Sign in button contains "Sign"', async () => {
  await runAssert(page, { type: 'text_contains', selector: { strategy: 'role', role: 'button', name: 'Sign in' }, expected: 'Sign' });
});

test('enabled: Sign in button is enabled', async () => {
  await runAssert(page, { type: 'enabled', selector: { strategy: 'role', role: 'button', name: 'Sign in' } });
});

test('disabled: #locked button is disabled', async () => {
  await runAssert(page, { type: 'disabled', selector: { strategy: 'css', css: '#locked' } });
});

test('value_equals: Nickname input has value "preset"', async () => {
  await runAssert(page, { type: 'value_equals', selector: { strategy: 'label', label: 'Nickname' }, expected: 'preset' });
});

test('count: 2 buttons on page', async () => {
  await runAssert(page, { type: 'count', selector: { strategy: 'css', css: 'button' }, expected: 2 });
});

test('value_equals: negative — wrong value throws', async () => {
  await assert.rejects(
    runAssert(page, { type: 'value_equals', selector: { strategy: 'label', label: 'Nickname' }, expected: 'wrong' }),
  );
});
