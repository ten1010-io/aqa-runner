import { spawnSync } from 'node:child_process';

// Prompt the user for one secret value, masked. Tries a native GUI dialog first
// (macOS osascript with hidden answer; Windows masked console read), and falls
// back to a muted TTY prompt. Throws if the user cancels or there is no way to
// ask (no GUI and no interactive terminal) — the caller should abort.
export async function promptSecret(key) {
  const label = `Enter value for "${key}"`;

  // Prefer an inline masked prompt when run interactively in a terminal (the
  // recommended way to run). No popup — type the value right where you launched.
  if (process.stdin.isTTY) return ttyPrompt(label);

  // No interactive terminal (e.g. double-clicked) → fall back to a native dialog.
  if (process.platform === 'darwin') {
    const r = macDialog(label);
    if (r.value !== undefined) return r.value;
    if (r.cancelled) throw new Error(`Cancelled: secret "${key}" was not provided.`);
  } else if (process.platform === 'win32') {
    const r = winPrompt(label);
    if (r.value !== undefined) return r.value;
  }

  throw new Error(
    `Missing secret "${key}": no secrets.env entry, no interactive terminal, and ` +
    'no GUI dialog available. Provide it via secrets.env or --secrets.'
  );
}

function macDialog(label) {
  const osa =
    `display dialog ${q(label)} default answer "" with hidden answer ` +
    `with title "aqa-runner" buttons {"Cancel", "OK"} default button "OK"\n` +
    'text returned of result';
  const r = spawnSync('osascript', ['-e', osa], { encoding: 'utf8' });
  if (r.status === 0) return { value: (r.stdout || '').replace(/\n$/, '') };
  const err = `${r.stderr || ''}${r.error ? r.error.message : ''}`;
  if (/-128|User canceled|cancell?ed/i.test(err)) return { cancelled: true };
  return { unavailable: true };
}

function winPrompt(label) {
  // Masked read in the (visible) console the .bat launcher opens.
  const ps =
    `$s = Read-Host -AsSecureString ${q(label)}; ` +
    '[Runtime.InteropServices.Marshal]::PtrToStringAuto(' +
    '[Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))';
  const r = spawnSync('powershell', ['-NoProfile', '-Command', ps],
    { encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  if (r.status === 0) return { value: (r.stdout || '').replace(/\r?\n$/, '') };
  return { unavailable: true };
}

function ttyPrompt(label) {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) return reject(new Error('no TTY'));
    process.stdout.write(`${label}: `);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let buf = '';
    const onKey = (ch) => {
      if (ch === '\r' || ch === '\n' || ch === '\u0004') {        // Enter / EOT
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onKey);
        process.stdout.write('\n');
        resolve(buf);
      } else if (ch === '\u0003') {                               // Ctrl-C
        stdin.setRawMode(false);
        process.stdout.write('\n');
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {                // Backspace
        buf = buf.slice(0, -1);
      } else {
        buf += ch;
      }
    };
    stdin.on('data', onKey);
  });
}

// AppleScript / PowerShell string literal: wrap in quotes, escape backslashes and quotes.
function q(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
