#!/bin/bash
# Double-click launcher (macOS). Bundled portable node at ./node/bin/node.
HERE="$(cd "$(dirname "$0")" && pwd)"
NODE="$HERE/node/bin/node"
SECRETS=()
[ -f "$HERE/secrets.env" ] && SECRETS=(--secrets "$HERE/secrets.env")
# Headless by default — no visible window, ~3x faster. To watch the browser,
# run the CLI directly with --headed (see README "CLI (advanced)").
"$NODE" "$HERE/src/run.js" "$HERE/cases.compiled.yaml" "${SECRETS[@]}"
echo
echo "Report written under reports/. Press Enter to close."
read _
