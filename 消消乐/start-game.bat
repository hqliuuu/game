@echo off
setlocal
cd /d "%~dp0"
set NODE_EXE=C:\Users\10504\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
if exist "%NODE_EXE%" (
  start "match3-server" /min "%NODE_EXE%" ".\tools\static-server.js" 5173
) else (
  start "match3-server" /min node ".\tools\static-server.js" 5173
)
timeout /t 1 >nul
start "" "http://localhost:5173"
