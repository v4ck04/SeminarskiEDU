@echo off
rem "A Secretary Died With $9 Million" - Blender version. Double-click, or run from cmd.
rem Needs Blender 4.2 LTS (free, blender.org). Three steps, all automatic:
rem   1. build.py   builds the 3D scene from code   -> blender\secretary.blend
rem   2. render     renders 1335 frames              -> blender\render\frames\0001.png ...
rem   3. compose.py frames + sound + captions       -> secretary-short\out\secretary-short.mp4
rem If it stops (closed window, power), run it again: finished frames are skipped, it continues where it stopped.
rem Options (set before running):
rem   set BLENDER=D:\Blender\blender.exe     if Blender is not in the default folder
rem   set ENGINE=cycles                      Cycles instead of EEVEE (nicer light, much slower; needs a good GPU)
rem   set SCALE=50                           half resolution test (540x960), fast
rem   set CAPS=no                            video without captions
setlocal EnableDelayedExpansion
cd /d "%~dp0blender" || exit /b 1
if "%BLENDER%"=="" (
  for %%V in (4.5 4.4 4.3 4.2) do if exist "C:\Program Files\Blender Foundation\Blender %%V\blender.exe" if "!BLENDER!"=="" set "BLENDER=C:\Program Files\Blender Foundation\Blender %%V\blender.exe"
)
if "%BLENDER%"=="" set "BLENDER=C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
if not exist "%BLENDER%" (
  echo Blender not found at "%BLENDER%".
  echo Install Blender 4.2 LTS from https://www.blender.org/download/lts/4-2/ or set BLENDER=path\to\blender.exe
  exit /b 1
)
set "OPTS="
if /i "%ENGINE%"=="cycles" set "OPTS=%OPTS% --cycles"
if not "%SCALE%"=="" set "OPTS=%OPTS% --scale %SCALE%"
echo [1/3] Building the scene...
"%BLENDER%" -b -P build.py -- %OPTS% || goto fail
echo [2/3] Rendering 1335 frames (this is the long part)...
"%BLENDER%" -b secretary.blend -a || goto fail
echo [3/3] Making the MP4...
set "COPTS="
if /i "%CAPS%"=="no" set "COPTS=--nocaps"
"%BLENDER%" -b -P compose.py -- %COPTS% || goto fail
echo.
echo Done: %~dp0out\secretary-short.mp4
endlocal
exit /b 0
:fail
echo.
echo Something failed. Send me the last lines above.
exit /b 1
