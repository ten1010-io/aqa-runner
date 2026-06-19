export const COLUMNS = [
  'case_id', 'name', 'status', 'tester', 'finished_at',
  'failure_reason', 'expected_vs_actual', 'evidence_path', 'discuss_note', 'jira_key',
];

export function csvField(value) {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function toCSV(rows) {
  const header = COLUMNS.join(',');
  const body = rows.map((r) => COLUMNS.map((c) => csvField(r[c] ?? '')).join(',')).join('\n');
  return body ? `${header}\n${body}\n` : `${header}\n`;
}
