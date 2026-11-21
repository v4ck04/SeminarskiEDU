@echo off
REM Runs RickClips Studio with the project's virtual environment.
set "HERE=%~dp0"
if exist "%HERE%.venv\Scripts\python.exe" (
  "%HERE%.venv\Scripts\python.exe" "%HERE%studio.py" %*
) else (
  echo Virtual environment not found. Run install.ps1 first.
  exit /b 1
)
