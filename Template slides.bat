@echo off
setlocal enabledelayedexpansion
REM Lance la presentation : demarre un serveur local et ouvre le poste
REM presentateur dans le navigateur par defaut. Se positionne toujours
REM sur son propre emplacement (double-clic possible depuis un raccourci
REM Bureau sans dependre du repertoire courant).
REM
REM Argument optionnel : nom du client (ex. "Template slides.bat dupont"
REM pour data\clients\dupont.json). Sans argument, utilise
REM data\clients\_demo.json.
REM
REM Equivalent Windows de "Template slides.command" (voir ce fichier
REM pour les commentaires detailles sur la logique - identique ici).

cd /d "%~dp0"

set "CLIENT=%~1"
if "%CLIENT%"=="" set "CLIENT=_demo"
set "CLIENT_FILE=data\clients\%CLIENT%.json"

if not exist "%CLIENT_FILE%" (
  echo Aucun client "%CLIENT%" : fichier introuvable ^(%CLIENT_FILE%^).
  echo.
  echo Clients disponibles :
  set FOUND=0
  for %%f in (data\clients\*.json) do (
    set FOUND=1
    echo   - %%~nf
  )
  if !FOUND! == 0 echo   ^(aucun - le dossier data\clients\ est vide^)
  pause
  exit /b 1
)

copy /y "%CLIENT_FILE%" "data\deck.json" >nul

where python >nul 2>nul
if errorlevel 1 (
  where python3 >nul 2>nul
  if errorlevel 1 (
    echo Python est introuvable sur cette machine.
    echo Installez-le depuis python.org ^(cocher "Add to PATH" a l'installation^), puis reessayez.
    pause
    exit /b 1
  )
  set "PYCMD=python3"
) else (
  set "PYCMD=python"
)

REM Choisit un port libre a partir de 8734.
set PORT=8734
:findport
netstat -ano | findstr /r /c:":%PORT% .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  set /a PORT+=1
  goto findport
)

start /min "" %PYCMD% -m http.server %PORT%

REM Attend que le serveur reponde avant d'ouvrir le navigateur.
set TRIES=0
:waitloop
%PYCMD% -c "import urllib.request,sys; urllib.request.urlopen('http://localhost:%PORT%/index.html', timeout=1)" >nul 2>nul
if not errorlevel 1 goto ready
set /a TRIES+=1
if !TRIES! GTR 50 goto ready
timeout /t 1 /nobreak >nul
goto waitloop
:ready

set "URL=http://localhost:%PORT%/presenter.html"
start "" "%URL%"

echo.
echo Poste presentateur ouvert : %URL%
echo Cette fenetre peut se fermer - la presentation continue normalement
echo ^(le serveur tourne en arriere-plan tant que Windows ne redemarre pas^).
timeout /t 2 /nobreak >nul
exit /b 0
