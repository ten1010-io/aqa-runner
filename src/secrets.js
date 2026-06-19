export function parseSecrets(text) {
  const m = new Map();
  for (const line of (text || '').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    m.set(t.slice(0, eq).trim(), t.slice(eq + 1));
  }
  return m;
}

export function resolveStepValue(step, secrets) {
  if (step.value_ref !== undefined) {
    if (!secrets.has(step.value_ref)) {
      throw new Error(`Secret "${step.value_ref}" not found in secrets.env`);
    }
    return { value: secrets.get(step.value_ref), masked: true };
  }
  return { value: step.value ?? '', masked: Boolean(step.sensitive) };
}

export function maskFor(value, masked) {
  return masked ? '****' : value;
}
