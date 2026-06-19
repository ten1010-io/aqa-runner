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
   - `aqa-runner-macos-x64.zip` (Intel)
   - `aqa-runner-macos-arm64.zip` (Apple Silicon)
3. Transfer the zip into the air-gap through your approved channel.

The zip is self-contained: portable Node + Playwright Chromium + the runner.
Nothing to install.

## Running

1. Unzip.
2. Put your `cases.compiled.yaml` in the unzipped folder.
3. (If the cases use secrets) add a `secrets.env` next to it:
   ```
   PW=your-password
   TOKEN=...
   ```
4. Double-click `run.command` (macOS) or `run.bat` (Windows).
5. Open `reports/<timestamp>/report.html`.

### macOS first-run note

macOS Gatekeeper may quarantine files arriving through transfer. If the
launcher will not open, clear the quarantine flag once:

```bash
xattr -dr com.apple.quarantine /path/to/aqa-runner-macos-*
```

## CLI (advanced)

```
node src/run.js <cases.compiled.yaml> [--secrets secrets.env] [--tester NAME] \
  [--out reports/DIR] [--headed] [--parallel N] [--screenshot]
```

Exit code `0` = all pass, `1` = at least one fail.

## Output

- `results.csv` — same schema as `aqa-inspect`, so `aqa-jira` consumes it
  unchanged (`case_id, name, status, tester, finished_at, failure_reason,
  expected_vs_actual, evidence_path, discuss_note, jira_key`). Offline runs
  produce only `pass` / `fail`.
- `report.html` — self-contained HTML report.
- `artifacts/<case_id>/` — failure screenshots.
