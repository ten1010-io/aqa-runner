#!/bin/bash
# Terminal launcher (macOS/Linux). Run it from a terminal:
#   cd /path/to/aqa-runner-macos-arm64
#   ./run.command                       # discovers cases/*.yaml, headless
#   ./run.command --tester me --headed  # extra flags pass straight through
HERE="$(cd "$(dirname "$0")" && pwd)"

# Clear the download quarantine so Gatekeeper does not stall the first launch.
xattr -dr com.apple.quarantine "$HERE" 2>/dev/null

cd "$HERE"
NODE="$HERE/node/bin/node"
[ -x "$NODE" ] || NODE="node"   # dev checkout: use system node

SECRETS=()
[ -f "$HERE/secrets.env" ] && SECRETS=(--secrets "$HERE/secrets.env")

# No cases path → run.js discovers cases/. Missing secrets are prompted inline
# (masked) right here in the terminal. Extra args ("$@") pass through.
exec "$NODE" "$HERE/src/run.js" "${SECRETS[@]}" "$@"
