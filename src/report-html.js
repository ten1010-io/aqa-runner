const CONDITIONAL_FIELDS = ['selector_drift', 'failure_reason', 'expected_vs_actual', 'discuss_note', 'evidence_path', 'jira_key'];

function htmlEscape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Extract the template between BEGIN-CASE and END-CASE markers.
function extractCaseBlock(tpl) {
  const start = tpl.indexOf('<!-- BEGIN-CASE -->');
  const end = tpl.indexOf('<!-- END-CASE -->');
  if (start === -1 || end === -1) throw new Error('Template missing BEGIN/END-CASE markers.');
  const block = tpl.slice(start + '<!-- BEGIN-CASE -->'.length, end);
  const head = tpl.slice(0, start);
  const tail = tpl.slice(end + '<!-- END-CASE -->'.length);
  return { head, block, tail };
}

// Keep or drop an <!-- IF-field --> ... <!-- ENDIF-field --> section.
function applyConditionals(block, row) {
  let out = block;
  for (const field of CONDITIONAL_FIELDS) {
    const re = new RegExp(`<!-- IF-${field} -->([\\s\\S]*?)<!-- ENDIF-${field} -->`, 'g');
    const present = field !== 'selector_drift' && row[field] != null && row[field] !== '';
    out = out.replace(re, present ? '$1' : '');
  }
  return out;
}

function renderCase(block, row) {
  let out = applyConditionals(block, row);
  const map = {
    status: row.status, STATUS: (row.status || '').toUpperCase(),
    case_id: htmlEscape(row.case_id), case_name: htmlEscape(row.name),
    tester: htmlEscape(row.tester), finished_at: htmlEscape(row.finished_at),
    failure_reason: htmlEscape(row.failure_reason), expected_vs_actual: htmlEscape(row.expected_vs_actual),
    discuss_note: htmlEscape(row.discuss_note), evidence_path: htmlEscape(row.evidence_path),
    jira_key: htmlEscape(row.jira_key),
  };
  return out.replace(/\{(\w+)\}/g, (m, k) => (k in map ? map[k] : m));
}

export function renderReport(meta, rows, template) {
  const { head, block, tail } = extractCaseBlock(template);
  const counts = { pass: 0, fail: 0, needs_discussion: 0 };
  for (const r of rows) counts[r.status] = (counts[r.status] || 0) + 1;

  const metaMap = {
    META_EXECUTED_AT: meta.executed_at, META_FINISHED_AT: meta.finished_at,
    META_DURATION: meta.duration, META_BASE_URL: htmlEscape(meta.base_url),
    META_ENGINE: meta.engine, META_BROWSER: meta.browser, META_COMMIT_HASH: meta.commit_hash,
    TOTAL: String(rows.length), PASSED: String(counts.pass),
    FAILED: String(counts.fail), NEEDS_DISCUSSION: String(counts.needs_discussion),
  };

  const renderedCases = rows.map((r) => renderCase(block, r)).join('\n');
  let html = head + renderedCases + tail;
  html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in metaMap ? metaMap[k] : m));
  return html;
}
