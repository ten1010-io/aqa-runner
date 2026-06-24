@echo off
REM Double-click launcher (Windows). Bundled portable node at .\node\node.exe.
setlocal
set HERE=%~dp0

REM Clear the Mark-of-the-Web the bundle picks up when downloaded, so SmartScreen
REM does not stall or block the unsigned binaries on first launch.
powershell -NoProfile -Command "Get-ChildItem -LiteralPath '%HERE%' -Recurse | Unblock-File" >nul 2>&1

cd /d "%HERE%"
set NODE=%HERE%node\node.exe
set SECRETS=
if exist "%HERE%secrets.env" set SECRETS=--secrets "%HERE%secrets.env"

REM No cases path: run.js auto-discovers the compiled YAML in .\cases.
REM Missing credentials are prompted for. Headless by default — run the CLI
REM with --headed to watch the browser (see README).
"%NODE%" "%HERE%src\run.js" %SECRETS%

echo.
echo Report written under reports\. Press any key to close.
pause >nul
