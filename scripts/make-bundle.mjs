// Assembles a self-contained bundle dir for the current OS/arch.
// Usage: node scripts/make-bundle.mjs <target-label> <node-dir> <out-dir>
import { cpSync, mkdirSync, existsSync, chmodSync } from 'node:fs';

const [, , target, nodeDir, outDir] = process.argv;
if (!target || !nodeDir || !outDir) {
  console.error('Usage: make-bundle.mjs <target-label> <node-dir> <out-dir>');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
for (const d of ['src', 'assets', 'node_modules', 'cases']) {
  if (existsSync(d)) cpSync(d, `${outDir}/${d}`, { recursive: true });
}
// Bundle the Playwright browsers cached into node_modules via PLAYWRIGHT_BROWSERS_PATH=0.
cpSync(nodeDir, `${outDir}/node`, { recursive: true });
for (const f of ['run.bat', 'run.command', 'aqa']) if (existsSync(f)) cpSync(f, `${outDir}/${f}`);
// Preserve the executable bit on the terminal launcher.
if (existsSync(`${outDir}/aqa`)) chmodSync(`${outDir}/aqa`, 0o755);
console.log(`Bundle for ${target} assembled at ${outDir}`);
