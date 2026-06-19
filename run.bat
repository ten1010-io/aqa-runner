@echo off
REM Double-click launcher. Expects bundled portable node at .\node\node.exe
REM and cases.compiled.yaml in this folder. Optional secrets.env auto-detected.
setlocal
set HERE=%~dp0
set NODE=%HERE%node\node.exe
set SECRETS=
if exist "%HERE%secrets.env" set SECRETS=--secrets "%HERE%secrets.env"
"%NODE%" "%HERE%src\run.js" "%HERE%cases.compiled.yaml" %SECRETS% --headed
echo.
echo Report written under reports\. Press any key to close.
pause >nul
