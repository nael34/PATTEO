@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Installer Node.js puis relancer. Version de reference : 24.14.0.
  pause
  exit /b 1
)
node -e "if(Number(process.versions.node.split('.')[0])<20)process.exit(1)"
if errorlevel 1 (
  echo Node.js 20 ou plus recent est necessaire.
  pause
  exit /b 1
)
if not exist "node_modules\stripe\package.json" (
  call npm.cmd ci
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Ouvrir http://localhost:4187 - Ctrl+C pour arreter.
call npm.cmd run dev
pause
