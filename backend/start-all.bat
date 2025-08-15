@echo off
title BitSwapDEX - Start All Services

echo [1/5] 🔁 Starting Backend API...
start "Backend API" cmd /k "cd /d %~dp0 && npm run api"

timeout /t 2 >nul

echo [2/5] 🤖 Starting Telegram Bot (NO AI)...
start "Telegram Bot" cmd /k "cd /d %~dp0 && npm run bot"

timeout /t 2 >nul

echo [3/5] 🤖 Starting Telegram AI Bot...
start "AI Telegram Bot" cmd /k "cd /d %~dp0 && npm run ai-telegram"

timeout /t 2 >nul

echo [4/5] 🧠 Starting Frontend AI Assistant...
start "AI Frontend" cmd /k "cd /d %~dp0 && npm run ai-frontend"

timeout /t 2 >nul

echo [5/5] 🧾 Starting Cron Tasks...
start "Cron Jobs" cmd /k "cd /d %~dp0 && npm run cron"

timeout /t 2 >nul

echo [6/6] 🔍 Starting Worker (Solana Verification)...
start "Worker" cmd /k "cd /d %~dp0 && npm run start-worker"

timeout /t 2 >nul

echo ✅ All services are now running. You can minimize or close this window.
pause
