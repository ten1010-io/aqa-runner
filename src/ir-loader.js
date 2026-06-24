import { parse } from 'yaml';

// v1 carried a per-case `expected_result` (pass|fail); v2 drops it — every case
// is judged purely by whether its steps/asserts pass. Both versions load: an
// `expected_result` left over on a v1 file is simply ignored.
export const SUPPORTED_IR_VERSIONS = new Set([1, 2]);

const VALID_OPS = new Set(['goto', 'fill', 'click', 'select', 'check', 'hover', 'press', 'assert']);

export function loadIR(text) {
  let doc;
  try {
    doc = parse(text);
  } catch (e) {
    throw new Error(`Invalid YAML: ${e.message}`);
  }
  if (!doc || typeof doc !== 'object') throw new Error('Empty or invalid IR file.');

  if (doc.ir_version === undefined) {
    throw new Error(
      'This file is not compiled (no ir_version). aqa-runner only executes a ' +
      'compiled cases.compiled.yaml. Compile it locally with aqa-inspect first.'
    );
  }
  if (!SUPPORTED_IR_VERSIONS.has(doc.ir_version)) {
    throw new Error(
      `Unsupported ir_version: ${doc.ir_version}. This runner supports ir_version ` +
      `${[...SUPPORTED_IR_VERSIONS].join(', ')}.`
    );
  }
  if (!Array.isArray(doc.cases) || doc.cases.length === 0) {
    throw new Error('IR has no cases.');
  }

  for (const c of doc.cases) {
    if (!c.case_id) throw new Error('A case is missing case_id.');
    if (!c.name) throw new Error(`Case ${c.case_id} is missing name.`);
    if (!Array.isArray(c.steps) || c.steps.length === 0) {
      throw new Error(`Case ${c.case_id} has no steps.`);
    }
    for (const [i, s] of c.steps.entries()) {
      if (s.action !== undefined) {
        throw new Error(
          `Case ${c.case_id} step ${i + 1} has a natural-language "action" — ` +
          'this file is not compiled. Compile it locally with aqa-inspect first.'
        );
      }
      if (!VALID_OPS.has(s.op)) {
        throw new Error(`Case ${c.case_id} step ${i + 1} has unknown op: ${s.op}`);
      }
      if (s.sensitive === true && s.value_ref === undefined && s.value !== undefined) {
        throw new Error(
          `Case ${c.case_id} step ${i + 1}: a sensitive step must use value_ref, not a literal value ` +
          '(a secret must never be baked into the IR).'
        );
      }
    }
  }
  return { ir_version: doc.ir_version, name: doc.name, description: doc.description, cases: doc.cases };
}
