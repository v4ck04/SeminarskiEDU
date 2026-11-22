@echo off
rem "The Bank That Wanted Eight of Everything" - render the finished Short (picture + captions + soundtrack).
rem Double-click, or run from cmd. Needs Node.js 18+; the first run installs the Remotion packages (npm install).
rem   render.cmd                       2K: 1440x2560 (the channel standard)
rem   set SCALE=1 ^& render.cmd         1080x1920
rem   set GL=swangle ^& render.cmd      if the picture comes out black (software WebGL, much slower)
rem   render.cmd --props "{\"caps\":false}"   without the burned-in captions
setlocal
cd /d "%~dp0..\finance-short" || exit /b 1
if "%SCALE%"=="" set "SCALE=1.3333333333333333"
if "%GL%"=="" set "GL=angle"
if not exist node_modules (
  echo Installing packages, first run only...
  call npm install || exit /b 1
)
rem Remotion copies public\ into a temp bundle on every render: keep that off the system drive
set "TEMP=%~d0\remotion-tmp"
set "TMP=%~d0\remotion-tmp"
if not exist "%TEMP%" mkdir "%TEMP%"
if not exist out mkdir out
set "OUT=out\the-bank-that-wanted-eight.mp4"
if "%SCALE%"=="1.3333333333333333" set "OUT=out\the-bank-that-wanted-eight-2k.mp4"
call npx remotion render src/index.ts EightShort "%OUT%" --codec h264 --crf 16 --scale %SCALE% --gl=%GL% %*
if errorlevel 1 (
  echo.
  echo Render failed. If the picture was black, try:  set GL=swangle ^& render.cmd
  exit /b 1
)
echo.
echo Done: %CD%\%OUT%
endlocal
