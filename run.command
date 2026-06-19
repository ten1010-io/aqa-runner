#!/bin/bash
# Double-click launcher (macOS). Bundled portable node at ./node/bin/node.
HERE="$(cd "$(dirname "$0")" && pwd)"
NODE="$HERE/node/bin/node"
SECRETS=()
[ -f "$HERE/secrets.env" ] && SECRETS=(--secrets "$HERE/secrets.env")
"$NODE" "$HERE/src/run.js" "$HERE/cases.compiled.yaml" "${SECRETS[@]}" --headed
echo
echo "Report written under reports/. Press Enter to close."
read _
