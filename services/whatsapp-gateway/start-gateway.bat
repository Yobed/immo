@echo off
title Passerelle WhatsApp - BOGBE'S GROUPE
cd /d "%~dp0"
echo ========================================================
echo  DEMARRAGE PASSERELLE WHATSAPP SOUVERAINE (0 FCFA/MOIS)
echo ========================================================
echo.
set PORT=5685
set AUTH_DIR=%~dp0wa_auth
set API_KEY=bogbes_secret_key_2026
set WEBHOOK_URL=https://www.bogbesgroup.com/api/whatsapp/webhook
set N8N_SCRAPER_URL=https://kassio1-n8n-free.hf.space/webhook/wassender-immobilier

start "Cloudflare Tunnel" /B "C:\Users\WILFRIED\bin\cloudflared.exe" tunnel --url http://localhost:5685
"C:\Users\WILFRIED\bin\nodejs\node-v24.13.0-win-x64\node.exe" server.js
pause
