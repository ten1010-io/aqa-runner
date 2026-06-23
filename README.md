# aqa-runner

Offline, LLM-free Playwright runner for compiled `aqa-inspect` test cases.
Runs `cases.compiled.yaml` (IR) inside an air-gapped network — no Claude, no npm,
no internet at run time.

## What it runs

`aqa-runner` executes **only** a compiled `cases.compiled.yaml` (it has
`ir_version: 1` at the top). A raw natural-language `cases.yaml` is rejected —
compile it first on an internet-connected machine with `aqa-inspect`
(see `ten1010-io/claude-toolkit`). Schema: [`schema/ir.md`](schema/ir.md).

## Getting a bundle (no build needed)

1. On an internet-connected machine, open the repo's **Releases**.
2. Download the zip for your OS:
   - `aqa-runner-windows-x64.zip`
   - `aqa-runner-macos-arm64.zip` (Apple Silicon)
3. Transfer the zip into the air-gap through your approved channel.

The zip is self-contained: portable Node + Playwright Chromium + the runner.
Nothing to install.

## Running

1. Unzip.
2. Put your `cases.compiled.yaml` into the **`cases/`** folder. The runner picks
   it up automatically — no path to type. (Keep just one `.yaml`, or name the one
   to run `cases.compiled.yaml`.)
3. **Run it from a terminal:**
   ```bash
   cd /path/to/aqa-runner-macos-arm64
   ./run.command                       # headless; discovers cases/*.yaml
   ./run.command --tester me --headed  # extra flags pass straight through
   ```
   (Windows: `run.bat`.)
4. **Credentials:** if a case needs a secret (e.g. a login password) and you have
   not supplied it, the runner asks for it right there in the terminal (masked
   input — nothing is echoed). To skip the prompt, drop a `secrets.env` next to
   the launcher:
   ```
   auth_password=your-password
   TOKEN=...
   ```
5. Open `reports/<timestamp>/report.html`.

If `cases/` has no YAML, the runner tells you to drop one in and opens the folder.

### macOS first-run note

The launchers now clear the download quarantine flag themselves, so Gatekeeper
should not stall or block on first run. If you ever need to clear it manually:

```bash
xattr -dr com.apple.quarantine /path/to/aqa-runner-macos-*
```

## CLI (advanced)

```
node src/run.js [cases.compiled.yaml] [--cases-dir DIR] [--secrets secrets.env] \
  [--tester NAME] [--out reports/DIR] [--headed] [--parallel N] [--screenshot]
```

With no path argument, the runner discovers the compiled YAML in `--cases-dir`
(default `cases`). Any secret the cases need but `secrets.env` / `--secrets` does
not supply is prompted for (native dialog, with a masked terminal fallback).

Exit code `0` = all pass, `1` = at least one fail.

### Environment variables

- `AQA_TLS_VERIFY=1` — enforce TLS certificate validation. By default the runner
  ignores certificate errors (e.g. `ERR_CERT_AUTHORITY_INVALID`) so targets with
  internal/self-signed certs run without manual browser overrides.
- `AQA_LOGIN_PATH` — login path used to detect a login-submit click and wait for
  its redirect before the next step (default `/login`). Set this if your app's
  login page lives at a different path.

## Output

- `results.csv` — same schema as `aqa-inspect`, so `aqa-jira` consumes it
  unchanged (`case_id, name, status, tester, finished_at, failure_reason,
  expected_vs_actual, evidence_path, discuss_note, jira_key`). Offline runs
  produce only `pass` / `fail`.
- `report.html` — self-contained HTML report.
- `reports/<timestamp>/artifacts/<case_id>/` — failure screenshots (referenced relatively from report.html).
