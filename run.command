#!/bin/bash
# Double-click launcher (macOS). Bundled portable node at ./node/bin/node.
HERE="$(cd "$(dirname "$0")" && pwd)"

# Clear the quarantine flag the bundle picks up when downloaded/transferred.
# Without this, Gatekeeper scans each unsigned binary on first launch — a long
# blank stall before anything runs, plus a "cannot verify fsevents.node" popup.
xattr -dr com.apple.quarantine "$HERE" 2>/dev/null

cd "$HERE"
NODE="$HERE/node/bin/node"
SECRETS=()
[ -f "$HERE/secrets.env" ] && SECRETS=(--secrets "$HERE/secrets.env")

# No cases path: run.js auto-discovers the compiled YAML in ./cases.
# Missing credentials are prompted for (native dialog). Headless by default —
# run the CLI with --headed to watch the browser (see README).
"$NODE" "$HERE/src/run.js" "${SECRETS[@]}"

echo
echo "Report written under reports/. Press Enter to close."
read _
