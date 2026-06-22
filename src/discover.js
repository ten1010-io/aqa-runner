import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const CANONICAL_NAME = 'cases.compiled.yaml';

// Find the compiled IR file to run inside casesDir.
// Returns { path } on success, or { error, dir, files } describing why not:
//   - 'missing-dir' : the folder does not exist
//   - 'empty'       : no .yaml/.yml files in the folder
//   - 'multiple'    : more than one candidate and none named cases.compiled.yaml
export function discoverCases(casesDir) {
  if (!existsSync(casesDir)) return { error: 'missing-dir', dir: casesDir, files: [] };
  const files = readdirSync(casesDir)
    .filter((f) => /\.ya?ml$/i.test(f))
    .sort();
  if (files.length === 0) return { error: 'empty', dir: casesDir, files: [] };
  if (files.includes(CANONICAL_NAME)) return { path: join(casesDir, CANONICAL_NAME) };
  if (files.length === 1) return { path: join(casesDir, files[0]) };
  return { error: 'multiple', dir: casesDir, files };
}

// Every secret key referenced via value_ref across the IR (deduped, in first-seen order).
export function requiredSecretKeys(ir) {
  const keys = [];
  const seen = new Set();
  for (const c of ir.cases || []) {
    for (const s of c.steps || []) {
      if (s.value_ref !== undefined && !seen.has(s.value_ref)) {
        seen.add(s.value_ref);
        keys.push(s.value_ref);
      }
    }
  }
  return keys;
}
