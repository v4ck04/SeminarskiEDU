"""Shared helpers: subprocess, JSON IO, text utilities, progress output."""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import unicodedata
from pathlib import Path
from typing import Any, Iterable, Sequence

from . import log

_log = log.get("utils")


class StudioError(RuntimeError):
    """An error with a message meant for the user (no traceback needed)."""


# --- console -------------------------------------------------------------------
def _console_safe(text: str) -> str:
    enc = getattr(sys.stdout, "encoding", None) or "utf-8"
    try:
        text.encode(enc)
        return text
    except (UnicodeEncodeError, LookupError):
        return text.encode(enc, errors="replace").decode(enc, errors="replace")


def say(msg: str, *, level: str = "info") -> None:
    """Progress message for the user (stdout) mirrored to the log."""
    prefix = {"info": "  ", "step": "==>", "ok": "[ok]", "warn": "[!]", "fail": "[x]"}.get(level, "  ")
    print(_console_safe(f"{prefix} {msg}"), flush=True)
    getattr(_log, "warning" if level in ("warn", "fail") else "info")(msg)


# --- subprocess --------------------------------------------------------------------
def run(cmd: Sequence[str], *, cwd: str | Path | None = None, check: bool = True,
        timeout: float | None = None, input_bytes: bytes | None = None,
        capture: bool = True) -> subprocess.CompletedProcess:
    """Run a command (no shell). Raises StudioError with stderr tail on failure."""
    cmd = [str(c) for c in cmd]
    _log.debug("run: %s", " ".join(cmd))
    t0 = time.time()
    try:
        proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, input=input_bytes,
                              stdout=subprocess.PIPE if capture else None,
                              stderr=subprocess.PIPE if capture else None,
                              timeout=timeout)
    except FileNotFoundError as e:
        raise StudioError(f"Program not found: {cmd[0]} ({e})") from e
    except subprocess.TimeoutExpired as e:
        raise StudioError(f"Command timed out after {timeout}s: {cmd[0]}") from e
    _log.debug("run done in %.2fs rc=%s", time.time() - t0, proc.returncode)
    if check and proc.returncode != 0:
        err = (proc.stderr or b"").decode("utf-8", "replace")
        tail = "\n".join(err.strip().splitlines()[-15:])
        raise StudioError(f"Command failed ({proc.returncode}): {Path(cmd[0]).name} ...\n{tail}")
    return proc


# --- JSON ----------------------------------------------------------------------
def read_json(path: str | Path, default: Any = None) -> Any:
    p = Path(path)
    if not p.exists():
        return default
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def _json_default(o: Any):
    try:
        import numpy as np
        if isinstance(o, np.integer):
            return int(o)
        if isinstance(o, np.floating):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        if isinstance(o, np.bool_):
            return bool(o)
    except ImportError:  # pragma: no cover
        pass
    if isinstance(o, Path):
        return str(o)
    if isinstance(o, set):
        return sorted(o)
    raise TypeError(f"not JSON serializable: {type(o)}")


def write_json(path: str | Path, data: Any, indent: int = 2) -> Path:
    """Atomic JSON write (temp file + replace), safe on Windows."""
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=".tmp_", suffix=".json", dir=str(p.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=indent, ensure_ascii=False, default=_json_default)
            f.write("\n")
        os.replace(tmp, p)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)
    return p


def write_text(path: str | Path, text: str) -> Path:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


# --- misc ------------------------------------------------------------------------
def now_iso() -> str:
    return _dt.datetime.now().astimezone().isoformat(timespec="seconds")


def slugify(text: str, max_len: int = 48) -> str:
    t = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    t = re.sub(r"[^a-zA-Z0-9]+", "-", t).strip("-").lower()
    t = t[:max_len].strip("-")
    return t or "untitled"


def file_fingerprint(path: str | Path, chunk: int = 2 * 1024 * 1024) -> str:
    """Fast content fingerprint: size + sha256 of first/last chunk."""
    p = Path(path)
    size = p.stat().st_size
    h = hashlib.sha256(str(size).encode())
    with open(p, "rb") as f:
        h.update(f.read(chunk))
        if size > chunk * 2:
            f.seek(-chunk, os.SEEK_END)
            h.update(f.read(chunk))
    return h.hexdigest()[:16]


def text_hash(*parts: Any) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(json.dumps(p, sort_keys=True, default=str).encode("utf-8"))
    return h.hexdigest()[:16]


def stable_seed(*parts: Any) -> int:
    return int(text_hash(*parts)[:8], 16)


def fmt_time(t: float) -> str:
    t = max(0.0, float(t))
    m, s = divmod(t, 60)
    return f"{int(m):d}:{s:05.2f}"


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


STOPWORDS = set("""a an the of and or to in on at by for with from into onto over under is are was were be been
being it its this that these those as than then so such not no do does did can could will would should may might
must have has had you your we our they their he she his her him them i me my what which who whom whose when where
why how all any each every some most more many much few just only very also there here about after before while
out up down off again once""".split())


def tokenize(text: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", (text or "").lower())
    out = []
    for w in words:
        if w in STOPWORDS or len(w) < 2:
            continue
        # light stemming for matching
        for suf in ("ies", "es", "s"):
            if len(w) > 4 and w.endswith(suf):
                w = w[: -len(suf)] + ("y" if suf == "ies" else "")
                break
        out.append(w)
    return out


def words_of(text: str) -> list[str]:
    """Spoken words (keeps punctuation attached for caption display)."""
    return [w for w in re.split(r"\s+", (text or "").strip()) if w]


def normalize_word(w: str) -> str:
    return re.sub(r"[^a-z0-9']", "", w.lower())


def split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return []
    parts = re.split(r"(?<=[.!?])\s+(?=[\"'A-Z0-9])", text)
    out: list[str] = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        # don't split after common abbreviations
        if out and re.search(r"\b(Mr|Mrs|Ms|Dr|St|vs|etc|e\.g|i\.e|U\.S)\.$", out[-1]):
            out[-1] = out[-1] + " " + p
        else:
            out.append(p)
    return out


def hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return b, g, r


def bgr_to_hex(bgr: Iterable[float]) -> str:
    b, g, r = [int(clamp(round(v), 0, 255)) for v in bgr]
    return f"#{r:02X}{g:02X}{b:02X}"


def ease_in_out(p: float) -> float:
    import math
    p = clamp(p, 0.0, 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * p)


def ease_out(p: float) -> float:
    p = clamp(p, 0.0, 1.0)
    return 1 - (1 - p) ** 3


def env_key(name: str) -> str | None:
    v = os.environ.get(name, "").strip()
    return v or None


def load_dotenv_if_present() -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    from . import paths
    for p in (paths.root() / ".env", paths.REPO_ROOT / ".env"):
        if p.exists():
            load_dotenv(p, override=False)
