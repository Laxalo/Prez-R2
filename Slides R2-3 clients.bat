@echo off
setlocal enabledelayedexpansion
REM Raccourci d'ouverture : demande le nom du client puis delegue a
REM "Template slides.bat" (meme mecanisme que la version Mac
REM "Slides R2-3 clients.command" - voir ce fichier pour les commentaires).

cd /d "%~dp0"

echo Clients disponibles :
set FOUND=0
for %%f in (data\clients\*.json) do (
  if /i not "%%~nf"=="_demo" (
    set FOUND=1
    echo   - %%~nf
  )
)
if !FOUND! == 0 echo   ^(aucun client pour l'instant - seul _demo existe^)
echo.

set /p CLIENT="Nom du client (Entree seul = _demo) : "
if "%CLIENT%"=="" set "CLIENT=_demo"

call "Template slides.bat" "%CLIENT%"
