@echo off
cd /d "%~dp0..\backend\ChatHistoryService"
dotnet run --urls http://localhost:5001


