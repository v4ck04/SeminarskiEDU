"""Production project state and approval gates.

A project lives in the shared production tree (scripts/<slug>/, voice/<slug>/,
footage/<slug>/, ...). Its state file is production/scripts/<slug>/project.json.
"""
from __future__ import annotations

from pathlib import Path

from .. import log, paths
from ..utils import StudioError, now_iso, read_json, slugify, write_json

# dependency order: each stage consumes the outputs of the ones before it
STAGES = ["script", "voice", "storyboard", "assets", "subtitles", "audio", "preview", "final", "qc"]
APPROVABLE = {"script", "preview", "final"}


def project_file(slug: str) -> Path:
    return paths.scripts_root() / slug / "project.json"


def exists(slug: str) -> bool:
    return project_file(slug).exists()


def create(topic: str, slug: str | None = None) -> dict:
    base = slugify(slug or topic, 40)
    s, k = base, 2
    while exists(s):
        s, k = f"{base}-{k}", k + 1
    proj = {
        "slug": s, "topic": topic.strip(), "created_at": now_iso(), "updated_at": now_iso(),
        "stages": {st: {"status": "pending"} for st in STAGES},
        "approvals": {}, "overrides": {}, "history": [],
    }
    paths.project_dirs(s)
    save(proj)
    log.project_log(s)
    return proj


def load(slug: str) -> dict:
    p = project_file(slug)
    if not p.exists():
        known = ", ".join(list_slugs()[-10:]) or "none"
        raise StudioError(f"Project '{slug}' not found. Existing projects: {known}")
    proj = read_json(p)
    log.project_log(slug)
    return proj


def save(proj: dict) -> None:
    proj["updated_at"] = now_iso()
    write_json(project_file(proj["slug"]), proj)


def list_slugs() -> list[str]:
    root = paths.scripts_root()
    return sorted(p.parent.name for p in root.glob("*/project.json"))


def dirs(proj: dict) -> dict[str, Path]:
    return paths.project_dirs(proj["slug"])


def set_stage(proj: dict, stage: str, status: str, **info) -> None:
    st = proj["stages"].setdefault(stage, {})
    st.update({"status": status, "at": now_iso(), **info})
    proj["history"].append({"time": now_iso(), "stage": stage, "status": status})
    # a changed upstream stage invalidates approvals and outputs downstream
    if status == "done":
        idx = STAGES.index(stage)
        for later in STAGES[idx + 1:]:
            if proj["stages"].get(later, {}).get("status") == "done":
                proj["stages"][later]["status"] = "stale"
        for gate in list(proj["approvals"]):
            if gate in STAGES and STAGES.index(gate) > idx:
                proj["approvals"].pop(gate, None)
    save(proj)


def stage_done(proj: dict, stage: str) -> bool:
    return proj["stages"].get(stage, {}).get("status") == "done"


def approve(proj: dict, stage: str, note: str = "") -> None:
    if stage not in APPROVABLE:
        raise StudioError(f"Only {', '.join(sorted(APPROVABLE))} can be approved")
    needed = {"script": "script", "preview": "preview", "final": "final"}[stage]
    if not stage_done(proj, needed):
        raise StudioError(f"Cannot approve {stage}: the {needed} stage is not complete "
                          f"(status: {proj['stages'].get(needed, {}).get('status')}).")
    proj["approvals"][stage] = {"at": now_iso(), "note": note,
                                "hash": proj["stages"].get(needed, {}).get("hash")}
    save(proj)


def is_approved(proj: dict, stage: str) -> bool:
    """An approval only counts for the exact content that was approved."""
    a = proj.get("approvals", {}).get(stage)
    if not a:
        return False
    return a.get("hash") == proj["stages"].get(stage, {}).get("hash")


def summary(proj: dict) -> str:
    parts = []
    for st in STAGES:
        s = proj["stages"].get(st, {}).get("status", "pending")
        mark = {"done": "x", "stale": "~", "failed": "!", "pending": " ", "blocked": "?"}.get(s, " ")
        appr = " (approved)" if st in APPROVABLE and is_approved(proj, st) else ""
        parts.append(f"[{mark}] {st}{appr}")
    return "  ".join(parts)
