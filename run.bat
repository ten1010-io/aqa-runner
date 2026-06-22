@echo off
REM Double-click launcher. Expects bundled portable node at .\node\node.exe
REM and cases.compiled.yaml in this folder. Optional secrets.env auto-detected.
setlocal
set HERE=%~dp0
set NODE=%HERE%node\node.exe
set SECRETS=
if exist "%HERE%secrets.env" set SECRETS=--secrets "%HERE%secrets.env"
REM Headless by default - no visible window, ~3x faster. To watch the browser,
REM run the CLI directly with --headed (see README "CLI (advanced)").
"%NODE%" "%HERE%src\run.js" "%HERE%cases.compiled.yaml" %SECRETS%
echo.
echo Report written under reports\. Press any key to close.
pause >nul
