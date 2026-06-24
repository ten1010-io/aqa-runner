import { toLocator } from './selector.js';
import { resolveStepValue, maskFor } from './secrets.js';

export async function runOp(page, step, secrets) {
  switch (step.op) {
    case 'goto':
      await page.goto(step.url);
      return { locator: null, log: `goto ${step.url}` };

    case 'fill': {
      const loc = toLocator(page, step.selector);
      const { value, masked } = resolveStepValue(step, secrets);
      await loc.fill(value);
      return { locator: loc, log: `fill ${maskFor(value, masked)}` };
    }

    case 'click': {
      const loc = toLocator(page, step.selector);
      await loc.click();
      // A click on a login page submits credentials and triggers an async
      // client-side redirect to the app. Without waiting, the next step
      // navigates before the session cookie is set, lands unauthenticated, gets
      // bounced back to the login page, and its assertions burn the full
      // timeout — slow AND a false failure. Settle the redirect, but only while
      // on a login path, so ordinary in-app clicks are not penalized. The path
      // is overridable via AQA_LOGIN_PATH (default "/login").
      const loginPath = process.env.AQA_LOGIN_PATH || '/login';
      if (page.url().includes(loginPath)) {
        await page.waitForURL((u) => !u.pathname.includes(loginPath), { timeout: 10000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      }
      return { locator: loc, log: 'click' };
    }

    case 'select': {
      const loc = toLocator(page, step.selector);
      await loc.selectOption(step.value);
      return { locator: loc, log: `select ${step.value}` };
    }

    case 'check': {
      const loc = toLocator(page, step.selector);
      if (step.checked === false) await loc.uncheck();
      else await loc.check();
      return { locator: loc, log: step.checked === false ? 'uncheck' : 'check' };
    }

    case 'hover': {
      const loc = toLocator(page, step.selector);
      await loc.hover();
      return { locator: loc, log: 'hover' };
    }

    case 'press': {
      if (step.selector) {
        const loc = toLocator(page, step.selector);
        await loc.press(step.key);
        return { locator: loc, log: `press ${step.key}` };
      }
      await page.keyboard.press(step.key);
      return { locator: null, log: `press ${step.key}` };
    }

    default:
      throw new Error(`Unknown op: ${step.op}`);
  }
}
