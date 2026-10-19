@echo off
cd /d %~dp0
echo Dang bat DB...
docker compose up -d db
echo Dang chay API tai http://localhost:4000/swagger  (dong cua so nay de tat)
npx pnpm@9.15.9 dev
pause
