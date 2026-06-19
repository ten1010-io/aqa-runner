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
