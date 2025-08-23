@echo off
setlocal ENABLEDELAYEDEXPANSION

REM Create tools directory
if not exist tools mkdir tools

set ZIP_NAME=nats-server-v2.10.14-windows-amd64.zip
set ZIP_URL=https://github.com/nats-io/nats-server/releases/download/v2.10.14/%ZIP_NAME%
set ZIP_PATH=tools\%ZIP_NAME%

echo Downloading NATS server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri '%ZIP_URL%' -OutFile '%ZIP_PATH%' -UseBasicParsing } catch { exit 1 }"
if errorlevel 1 (
  echo Failed to download NATS from %ZIP_URL%
  exit /b 1
)

echo Extracting...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force -Path '%ZIP_PATH%' -DestinationPath 'tools'"
if errorlevel 1 (
  echo Failed to extract archive.
  exit /b 1
)

for /d %%D in (tools\nats-server-*-windows-amd64) do set NATS_DIR=%%D
if not defined NATS_DIR (
  echo NATS directory not found after extraction.
  exit /b 1
)

echo Starting NATS with WebSocket on port 5080 using config file...
start "NATS Server" "%CD%\!NATS_DIR!\nats-server.exe" -c "%CD%\scripts\nats.conf"
echo Done. If the window didn't open, run: "!NATS_DIR!\nats-server.exe -c scripts\nats.conf"
echo.
echo Alternative manual command (if config doesn't work):
echo "!NATS_DIR!\nats-server.exe -p 4222 -m 8222 -js"
echo.
echo Note: WebSocket may not be available in this NATS version.
echo Check if you see "websocket" in the startup logs.
exit /b 0


