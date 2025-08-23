@echo off
echo Current directory: %CD%
echo.
echo Changing to NATS directory...
cd /d "%~dp0tools\nats-server-v2.10.0-windows-amd64"
echo New directory: %CD%
echo.
if not exist "nats-server.exe" (
    echo ERROR: nats-server.exe not found in: %CD%
    echo Available files:
    dir
    echo.
    echo Trying absolute path...
    cd /d "C:\Users\14006182\Desktop\jalali\scripts\tools\nats-server-v2.11.8-windows-amd64"
    echo New absolute directory: %CD%
    if not exist "nats-server.exe" (
        echo Still not found. Available files:
        dir
        pause
        exit /b 1
    )
)
echo Found nats-server.exe
echo.
echo Starting NATS server with: -p 4222 -m 8222 -js
echo.
nats-server.exe -p 4222 -m 8222 -js
pause
