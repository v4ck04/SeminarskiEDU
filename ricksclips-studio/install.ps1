<#
.SYNOPSIS
  RickClips Studio installer for Windows.

.DESCRIPTION
  Inspects the machine (Python, FFmpeg, Git, disk space, GPU), offers to
  install anything missing through winget (asks first), creates the .venv
  virtual environment, installs the Python dependencies and runs the
  environment check.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install.ps1
  powershell -ExecutionPolicy Bypass -File .\install.ps1 -WithOptional -Yes
#>
param(
    [switch]$Yes,            # answer "yes" to install prompts
    [switch]$WithOptional,   # also install requirements-optional.txt
    [switch]$SkipFFmpeg      # don't offer to install FFmpeg
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Say($msg, $color = "Gray") { Write-Host $msg -ForegroundColor $color }
function Ok($msg)   { Write-Host "[ok] $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[!]  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "[x]  $msg" -ForegroundColor Red }

function Confirm-Step($question) {
    if ($Yes) { return $true }
    $answer = Read-Host "$question [y/N]"
    return ($answer -match '^(y|yes)$')
}

function Refresh-Path {
    $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $user = [Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$machine;$user"
}

function Have-Winget { return [bool](Get-Command winget -ErrorAction SilentlyContinue) }

Say "=== RickClips Studio - Windows setup ===" "Cyan"
Say "Project folder: $Root"

# ---------------------------------------------------------------- Python
function Find-Python {
    $candidates = @(
        @{ exe = "py"; args = @("-3") },
        @{ exe = "python"; args = @() },
        @{ exe = "python3"; args = @() }
    )
    foreach ($c in $candidates) {
        if (-not (Get-Command $c.exe -ErrorAction SilentlyContinue)) { continue }
        try {
            $ver = & $c.exe @($c.args + @("-c", "import sys; print('%d.%d' % sys.version_info[:2])")) 2>$null
            if ($LASTEXITCODE -eq 0 -and $ver -match '^\d+\.\d+$') {
                $parts = $ver.Split(".")
                if ([int]$parts[0] -eq 3 -and [int]$parts[1] -ge 10) {
                    return @{ exe = $c.exe; args = $c.args; version = $ver }
                }
            }
        } catch { }
    }
    return $null
}

$py = Find-Python
if (-not $py) {
    Warn "Python 3.10+ was not found."
    if ((Have-Winget) -and (Confirm-Step "Install Python 3.12 with winget?")) {
        winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements
        Refresh-Path
        $py = Find-Python
    }
    if (-not $py) {
        Fail "Install Python 3.10 or newer from https://www.python.org/downloads/ (tick 'Add to PATH'), then run this script again."
        exit 1
    }
}
Ok "Python $($py.version) ($($py.exe))"

# ---------------------------------------------------------------- Git
if (Get-Command git -ErrorAction SilentlyContinue) {
    Ok (git --version)
} else {
    Warn "Git not found (optional). Install with: winget install --id Git.Git -e"
}

# ---------------------------------------------------------------- FFmpeg
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg -and -not $SkipFFmpeg) {
    Warn "FFmpeg was not found on PATH. RickClips Studio needs a full FFmpeg build (libass, libx264)."
    if ((Have-Winget) -and (Confirm-Step "Install FFmpeg (Gyan.FFmpeg full build) with winget?")) {
        winget install --id Gyan.FFmpeg -e --accept-package-agreements --accept-source-agreements
        Refresh-Path
        $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
    }
}
if ($ffmpeg) {
    $ffv = (& ffmpeg -hide_banner -version | Select-Object -First 1)
    Ok $ffv
    $filters = (& ffmpeg -hide_banner -filters 2>$null) -join "`n"
    foreach ($f in @("subtitles", "loudnorm", "sidechaincompress", "blackdetect")) {
        if ($filters -notmatch "\s$f\s") { Warn "FFmpeg filter '$f' is missing - install a full build (winget install Gyan.FFmpeg)." }
    }
} else {
    Warn "FFmpeg still not found. If you just installed it, open a new terminal. You can also set ffmpeg.ffmpeg_path in config\settings.json."
}

# ---------------------------------------------------------------- disk + GPU
try {
    $drive = (Get-Item $Root).PSDrive
    $freeGb = [math]::Round($drive.Free / 1GB, 1)
    if ($freeGb -lt 5) { Warn "Only $freeGb GB free on $($drive.Name):" } else { Ok "Disk: $freeGb GB free on $($drive.Name):" }
} catch { Warn "Could not read free disk space." }

try {
    $gpus = (Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join ", "
    if ($gpus) { Ok "GPU: $gpus" }
    if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
        Ok ("NVIDIA: " + (nvidia-smi --query-gpu=name,memory.total --format=csv,noheader))
    }
} catch { Warn "Could not query GPU information." }

# ---------------------------------------------------------------- venv + packages
$venvPy = Join-Path $Root ".venv\Scripts\python.exe"
if (-not (Test-Path $venvPy)) {
    Say "Creating virtual environment .venv ..."
    & $py.exe @($py.args + @("-m", "venv", ".venv"))
    if ($LASTEXITCODE -ne 0) { Fail "Could not create the virtual environment."; exit 1 }
}
Ok "Virtual environment: .venv"

Say "Installing Python packages (requirements.txt) ..."
& $venvPy -m pip install --upgrade pip | Out-Null
& $venvPy -m pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) { Fail "pip install failed - see the messages above."; exit 1 }
Ok "Core packages installed"

if ($WithOptional -or (Confirm-Step "Install optional packages (Claude API SDK, faster-whisper transcription, OCR)?")) {
    & $venvPy -m pip install -r requirements-optional.txt
    if ($LASTEXITCODE -ne 0) { Warn "Some optional packages failed to install; the studio still works without them." }
}

# ---------------------------------------------------------------- .env
if (-not (Test-Path (Join-Path $Root ".env"))) {
    Copy-Item (Join-Path $Root ".env.example") (Join-Path $Root ".env")
    Ok "Created .env from .env.example - add API keys there if you use paid services."
}

# ---------------------------------------------------------------- final check
Say ""
Say "Running environment check ..." "Cyan"
& $venvPy (Join-Path $Root "studio.py") doctor
Say ""
Say "Next steps:" "Cyan"
Say "  1. Put 5-20 reference MP4s in training\input\"
Say "  2. .\studio.cmd analyze"
Say "  3. .\studio.cmd produce `"Your topic`""
Say "  Or open this folder in Claude Code and run: /ricksclips-studio status"
