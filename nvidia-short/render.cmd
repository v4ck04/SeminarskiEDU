@echo off
rem "Eleven Days Without Jensen" (Nvidia) - render the finished Short (picture + captions + soundtrack).
rem Double-click, or run from cmd. Needs Node.js 18+; the first run installs the Remotion packages (npm install).
rem   render.cmd                       2K: 1440x2560 (the channel standard)
rem   set SCALE=1 ^& render.cmd         1080x1920
rem   set GL=swangle ^& render.cmd      if the picture comes out black (software WebGL, much slower)
rem   set CONC=2 ^& render.cmd          two frames at a time (faster, needs more GPU memory)
rem   render.cmd --props "{\"caps\":false}"   without the burned-in captions
setlocal
cd /d "%~dp0..\finance-short" || exit /b 1
if "%SCALE%"=="" set "SCALE=1.3333333333333333"
if "%GL%"=="" set "GL=angle"
if "%CONC%"=="" set "CONC=1"
if not exist node_modules (
  echo Installing packages, first run only...
  call npm install || exit /b 1
)
rem Remotion copies public\ into a temp bundle on every render: keep that off the system drive
set "TEMP=%~d0\remotion-tmp"
set "TMP=%~d0\remotion-tmp"
if not exist "%TEMP%" mkdir "%TEMP%"
if not exist out mkdir out
set "OUT=out\eleven-days-without-jensen.mp4"
if "%SCALE%"=="1.3333333333333333" set "OUT=out\eleven-days-without-jensen-2k.mp4"
call npx remotion render src/index.ts NvidiaShort "%OUT%" --codec h264 --crf 16 --scale %SCALE% --gl=%GL% --concurrency=%CONC% --timeout=900000 %*
if errorlevel 1 (
  echo.
  echo Render failed. Settings used: SCALE=%SCALE% GL=%GL% CONC=%CONC%
  echo If it failed creating the WebGL context, try 1080p:  set SCALE=1 ^& eight-short\render.cmd
  echo If the picture was black:  set GL=swangle ^& eight-short\render.cmd
  exit /b 1
)
echo.
echo Done: %CD%\%OUT%
endlocal
