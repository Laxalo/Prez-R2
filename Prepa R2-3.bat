@echo off
setlocal enabledelayedexpansion
REM Raccourci unique de preparation client : demande le nom du client,
REM puis si on prepare le R2 (personnaliser l'ensemble des slides,
REM nouveau client) ou le R3 (finaliser uniquement les montants de la
REM derniere slide, post-RDV). Copie le prompt correspondant dans le
REM presse-papiers, puis ouvre Claude Code.
REM
REM Equivalent Windows de "Prepa R2-3.command" (voir ce fichier pour les
REM commentaires detailles - meme logique ici, sans les contournements
REM specifiques a bash 3.2 de macOS qui ne concernent pas ce script).

cd /d "%~dp0"

where claude >nul 2>nul
if errorlevel 1 (
  echo Commande "claude" introuvable dans le PATH.
  echo Verifie l'installation de Claude Code, puis reessaie.
  pause
  exit /b 1
)

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

set /p CLIENT="Nom du client : "
if "%CLIENT%"=="" (
  echo Nom de client requis.
  pause
  exit /b 1
)

echo.
echo R2 = personnaliser l'ensemble des slides ^(nouveau client, ou refonte complete^)
echo R3 = finaliser uniquement les montants de la derniere slide ^(post-RDV^)
set "MODE="
:askmode
set /p INPUT="R2 ou R3 ? : "
if /i "%INPUT%"=="2" set MODE=2
if /i "%INPUT%"=="r2" set MODE=2
if /i "%INPUT%"=="3" set MODE=3
if /i "%INPUT%"=="r3" set MODE=3
if "%MODE%"=="" (
  echo Reponds par 2 ^(ou R2^) / 3 ^(ou R3^).
  goto askmode
)

set "PROMPT_FILE=%TEMP%\prezr2_prompt_%RANDOM%.txt"

if "%MODE%"=="2" (
  if exist "data\clients\%CLIENT%.json" (
    echo.
    echo Attention : data\clients\%CLIENT%.json existe deja - il sera repersonnalise selon tes reponses.
  )
  (
    echo Nouveau client : %CLIENT%. Interviewe-moi selon la section "Procedure
    echo d'entretien client" de CLAUDE.md, une question a la fois ^(attends ma
    echo reponse avant de poser la suivante, ne saute aucun bloc^). Une fois
    echo toutes les reponses obtenues, cree data/clients/%CLIENT%.json ^(copie
    echo de data/clients/_demo.json, personnalisee avec mes reponses^) -
    echo uniquement ce fichier, ne touche a aucun autre fichier du projet.
    echo Applique les regles imperatives de CLAUDE.md sans me les redemander.
  ) > "%PROMPT_FILE%"
) else (
  if not exist "data\clients\%CLIENT%.json" (
    echo.
    echo Aucun fichier data\clients\%CLIENT%.json trouve - cree-le d'abord avec R2.
    pause
    exit /b 1
  )
  (
    echo Finalisation post-RDV pour %CLIENT%. Dans data/clients/%CLIENT%.json,
    echo uniquement ce fichier : recopie tel quel le titre, le budget et le
    echo aTerme, ainsi que le nom et les bullets de chaque preconisation, de la
    echo slide cloture-reflexion vers la slide cloture-detail ^(copie exacte -
    echo securite, ils sont normalement deja identiques^).
    echo.
    echo Puis, pour chaque preconisation de cloture-reflexion, pose-moi une a
    echo une, dans l'ordre, chaque question de son tableau questions[], telle
    echo qu'elle est ecrite. J'y reponds avec un montant. Une fois toutes les
    echo questions d'une preconisation repondues, propose-moi la formulation du
        echo champ montant correspondant sur cloture-detail ^(par exemple "500
    echo euros/mois", ou "500 euros/mois + 3000 euros en versement initial" s'il y a deux
    echo reponses^) avant de l'ecrire - je valide ou je corrige.
    echo.
    echo Ne modifie ni les questions[] de cloture-reflexion, ni aucun autre
    echo fichier du projet.
  ) > "%PROMPT_FILE%"
)

REM Copie le prompt dans le presse-papiers (clip = equivalent Windows de pbcopy).
type "%PROMPT_FILE%" | clip
echo.
echo Prompt copie dans le presse-papiers.
echo Une fois Claude Code ouvert : Ctrl+V puis Entree.
del "%PROMPT_FILE%" >nul 2>nul

timeout /t 1 /nobreak >nul
if "%MODE%"=="2" (
  REM R2 : personnalisation complete - on garde le modele par defaut.
  claude
) else (
  REM R3 : tache mecanique - modele moins cher, effort reduit.
  claude --model haiku --effort low
)
