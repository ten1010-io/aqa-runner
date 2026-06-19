import { expect } from 'playwright/test';
import { toLocator } from './selector.js';

export function matchesUrl(url, expected) {
  const m = /^\/(.*)\/([a-z]*)$/.exec(expected);
  if (m) return new RegExp(m[1], m[2]).test(url);
  return url.includes(expected);
}

export async function runAssert(page, spec) {
  switch (spec.type) {
    case 'visible':
      await expect(toLocator(page, spec.selector)).toBeVisible();
      return;
    case 'hidden':
      await expect(toLocator(page, spec.selector)).toBeHidden();
      return;
    case 'text_contains':
      await expect(toLocator(page, spec.selector)).toContainText(spec.expected);
      return;
    case 'enabled':
      await expect(toLocator(page, spec.selector)).toBeEnabled();
      return;
    case 'disabled':
      await expect(toLocator(page, spec.selector)).toBeDisabled();
      return;
    case 'value_equals':
      await expect(toLocator(page, spec.selector)).toHaveValue(spec.expected);
      return;
    case 'count':
      await expect(toLocator(page, spec.selector)).toHaveCount(Number(spec.expected));
      return;
    case 'url_matches':
      if (!matchesUrl(page.url(), spec.expected)) {
        throw new Error(`url_matches failed: "${page.url()}" does not match "${spec.expected}"`);
      }
      return;
    default:
      throw new Error(`Unknown assert type: ${spec.type}`);
  }
}
