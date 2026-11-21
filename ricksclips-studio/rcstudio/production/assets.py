"""Visual asset pipeline with licence tracking.

Search order (configurable in settings.json -> assets.providers):
  library        your own footage/images in production/footage/library/
                 (optional sidecar <file>.json with tags/license/attribution)
  generated      procedural visuals (when the script asks for them)
  pexels         Pexels API (PEXELS_API_KEY)          - Pexels License
  pixabay        Pixabay API (PIXABAY_API_KEY)        - Pixabay Content License
  nasa           NASA Image and Video Library (no key) - public domain, verify credits
  wikimedia      Wikimedia Commons (no key)            - only PD / CC0 / CC BY / CC BY-SA
  openai_images  AI image generation (OPENAI_API_KEY, disabled by default)

A candidate is used only if its title/tags match the scene's search keywords
(min_relevance). If nothing qualifies a clearly labelled placeholder is
rendered and reported - unrelated footage is never substituted silently.
Every asset is recorded in asset-manifest.json with source, licence and
attribution.
"""
from __future__ import annotations

import base64
import html
import re
import shutil
from pathlib import Path

import cv2
import requests
from PIL import Image

from .. import ffmpeg, log, paths
from ..config import load_settings
from ..utils import StudioError, env_key, now_iso, read_json, say, text_hash, tokenize, write_json

_log = log.get("assets")
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".webm", ".mkv"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def relevance(query: str, text: str) -> float:
    """Share of query keywords found; candidates that also contain the query's word pairs
    in order (e.g. "radio telescope", not "radio galaxy ... telescope") rank higher."""
    qt = tokenize(query)
    q = set(qt)
    if not q:
        return 0.0
    ct = tokenize(text)
    score = len(q & set(ct)) / len(q)
    pairs = list(zip(qt, qt[1:]))
    if pairs:
        cpairs = set(zip(ct, ct[1:]))
        score *= 0.8 + 0.2 * (sum(1 for pr in pairs if pr in cpairs) / len(pairs))
    return score


PERSON_WORDS = re.compile(r"\b(person|people|man|woman|men|women|astronaut|scientist|astronomer|crowd|face|portrait|"
                          r"child|kid|team|engineer|speaker|host|presenter|audience|he|she)\b", re.I)


def prominent_face(path: Path, kind: str) -> bool:
    """True if a clearly visible human face is in the asset (unwanted unless the scene asks for people)."""
    from .. import faces
    from .compositor import imread
    if not faces.available()[0]:
        _log.warning("face safeguard unavailable: %s", faces.available()[1])
        return False
    try:
        if kind == "image":
            img = imread(path)
        else:
            with ffmpeg.FrameReader(path, 360, 640, start=0.5) as r:
                img = r.read()
            if img is None:
                return False
        h, w = img.shape[:2]
        sc = 640 / max(h, w)
        img = cv2.resize(img, (int(w * sc), int(h * sc)), interpolation=cv2.INTER_AREA)
        found = faces.detect(img) or []
        return any(fw >= 0.045 and score >= 0.75 for (_x, _y, fw, _fh, score) in found)
    except Exception as e:  # a broken file is handled by verify_media; never crash on the safeguard
        _log.info("face check skipped for %s: %s", path, e)
        return False


def people_likely(c: dict) -> bool:
    """Metadata hint that a stock result is an event/portrait photo (e.g. NASA HQ photo office)."""
    return bool(c.get("people_likely")) or str(c.get("id", "")).upper().startswith("NASA-NHQ")


def license_allowed(lic: str, allowed: list[str]) -> bool:
    l = (lic or "").lower().replace("-", " ").replace("_", " ")
    for a in allowed:
        a2 = a.lower().replace("-", " ")
        if l.startswith(a2) or a2 in l:
            # 'cc by' must not accept non-commercial / no-derivatives variants
            if re.search(r"\b(nc|nd)\b", l):
                return False
            return True
    return False


class Candidate(dict):
    """id, provider, kind (video|image), url, page_url, title, text, license, license_url,
    author, author_url, width, height, duration"""


# ----------------------------------------------------------------------------- providers
class Library:
    name = "library"

    def available(self):
        return True, "local folder"

    def search(self, query: str, kind: str, n: int) -> list[Candidate]:
        out = []
        for p in sorted(paths.footage_library().rglob("*")):
            ext = p.suffix.lower()
            if ext not in VIDEO_EXT | IMAGE_EXT:
                continue
            side = read_json(p.with_suffix(p.suffix + ".json"), {}) or {}
            text = " ".join([p.stem.replace("_", " ").replace("-", " "), " ".join(side.get("tags", [])),
                             side.get("description", "")])
            out.append(Candidate(id=str(p.relative_to(paths.footage_library())), provider=self.name,
                                 kind="video" if ext in VIDEO_EXT else "image", local=str(p), url=None,
                                 page_url=side.get("source_url"), title=p.name, text=text,
                                 license=side.get("license", "user-provided"),
                                 license_url=side.get("license_url"), author=side.get("attribution") or side.get("author"),
                                 author_url=None))
        return out


class Pexels:
    name = "pexels"

    def available(self):
        return (True, "API key set") if env_key("PEXELS_API_KEY") else (False, "PEXELS_API_KEY not set")

    def search(self, query, kind, n):
        h = {"Authorization": env_key("PEXELS_API_KEY") or ""}
        if kind == "video":
            r = requests.get("https://api.pexels.com/videos/search", headers=h, timeout=30,
                             params={"query": query, "orientation": "portrait", "per_page": n})
            r.raise_for_status()
            out = []
            for v in r.json().get("videos", []):
                files = [f for f in v.get("video_files", []) if f.get("file_type") == "video/mp4" and f.get("width")]
                if not files:
                    continue
                good = [f for f in files if min(f["width"], f["height"]) >= 1080]
                f = min(good, key=lambda f: f["width"] * f["height"]) if good else max(files, key=lambda f: f["width"] * f["height"])
                slug = re.sub(r"[-/]", " ", v.get("url", "").rstrip("/").split("/")[-1])
                out.append(Candidate(id=f"pexels-v{v['id']}", provider=self.name, kind="video", url=f["link"],
                                     page_url=v.get("url"), title=slug, text=slug, license="Pexels License",
                                     license_url="https://www.pexels.com/license/", author=v.get("user", {}).get("name"),
                                     author_url=v.get("user", {}).get("url"), width=f["width"], height=f["height"],
                                     duration=v.get("duration")))
            return out
        r = requests.get("https://api.pexels.com/v1/search", headers=h, timeout=30,
                         params={"query": query, "orientation": "portrait", "per_page": n})
        r.raise_for_status()
        out = []
        for p in r.json().get("photos", []):
            slug = re.sub(r"[-/]", " ", p.get("url", "").rstrip("/").split("/")[-1])
            out.append(Candidate(id=f"pexels-p{p['id']}", provider=self.name, kind="image",
                                 url=p["src"].get("large2x") or p["src"]["original"], page_url=p.get("url"),
                                 title=p.get("alt") or slug, text=f"{p.get('alt', '')} {slug}", license="Pexels License",
                                 license_url="https://www.pexels.com/license/", author=p.get("photographer"),
                                 author_url=p.get("photographer_url"), width=p.get("width"), height=p.get("height")))
        return out


class Pixabay:
    name = "pixabay"

    def available(self):
        return (True, "API key set") if env_key("PIXABAY_API_KEY") else (False, "PIXABAY_API_KEY not set")

    def search(self, query, kind, n):
        key = env_key("PIXABAY_API_KEY")
        if kind == "video":
            r = requests.get("https://pixabay.com/api/videos/", timeout=30,
                             params={"key": key, "q": query, "per_page": max(3, n), "safesearch": "true"})
            r.raise_for_status()
            out = []
            for h in r.json().get("hits", []):
                vids = h.get("videos", {})
                v = vids.get("large") if vids.get("large", {}).get("url") else vids.get("medium", {})
                if not v.get("url"):
                    continue
                out.append(Candidate(id=f"pixabay-v{h['id']}", provider=self.name, kind="video", url=v["url"],
                                     page_url=h.get("pageURL"), title=h.get("tags", ""), text=h.get("tags", ""),
                                     license="Pixabay Content License", license_url="https://pixabay.com/service/license-summary/",
                                     author=h.get("user"), author_url=None, width=v.get("width"), height=v.get("height"),
                                     duration=h.get("duration")))
            return out
        r = requests.get("https://pixabay.com/api/", timeout=30,
                         params={"key": key, "q": query, "per_page": max(3, n), "safesearch": "true",
                                 "orientation": "vertical", "image_type": "photo"})
        r.raise_for_status()
        return [Candidate(id=f"pixabay-p{h['id']}", provider=self.name, kind="image", url=h.get("largeImageURL"),
                          page_url=h.get("pageURL"), title=h.get("tags", ""), text=h.get("tags", ""),
                          license="Pixabay Content License", license_url="https://pixabay.com/service/license-summary/",
                          author=h.get("user"), author_url=None, width=h.get("imageWidth"), height=h.get("imageHeight"))
                for h in r.json().get("hits", [])]


class NASA:
    name = "nasa"

    def available(self):
        return True, "no key needed"

    def search(self, query, kind, n):
        r = requests.get("https://images-api.nasa.gov/search", timeout=30,
                         params={"q": query, "media_type": "image", "page_size": n})
        r.raise_for_status()
        out = []
        for it in r.json().get("collection", {}).get("items", [])[:n]:
            d = (it.get("data") or [{}])[0]
            nid = d.get("nasa_id")
            if not nid:
                continue
            author = d.get("photographer") or d.get("secondary_creator") or f"NASA {d.get('center', '')}".strip()
            # NASA HQ photo-office images (NHQ...) are almost always events and portraits of people
            event = nid.upper().startswith("NHQ") or (d.get("center") == "HQ" and d.get("photographer"))
            out.append(Candidate(id=f"nasa-{nid}", provider=self.name, kind="image", url=None, nasa_id=nid,
                                 people_likely=bool(event),
                                 page_url=f"https://images.nasa.gov/details/{nid}", title=d.get("title", ""),
                                 text=" ".join([d.get("title", ""), " ".join(d.get("keywords", []) or []),
                                                (d.get("description") or "")[:200]]),
                                 license="Public domain (NASA media - not copyrighted in the US; verify third-party credits)",
                                 license_url="https://www.nasa.gov/nasa-brand-center/images-and-media/",
                                 author=author, author_url=None))
        return out

    def resolve(self, c: Candidate) -> str | None:
        r = requests.get(f"https://images-api.nasa.gov/asset/{c['nasa_id']}", timeout=30)
        r.raise_for_status()
        hrefs = [i["href"] for i in r.json().get("collection", {}).get("items", [])]
        for suffix in ("~large.jpg", "~orig.jpg", "~medium.jpg", "~large.png", "~orig.png"):
            for h in hrefs:
                if h.lower().endswith(suffix):
                    return h.replace("http://", "https://")
        return None


class Wikimedia:
    name = "wikimedia"

    def available(self):
        return True, "no key needed"

    def search(self, query, kind, n):
        ua = load_settings().get("assets", {}).get("http_user_agent", "RickClipsStudio/1.0")
        r = requests.get("https://commons.wikimedia.org/w/api.php", timeout=30, headers={"User-Agent": ua},
                         params={"action": "query", "generator": "search", "gsrsearch": f"{query} filetype:bitmap",
                                 "gsrnamespace": 6, "gsrlimit": n, "prop": "imageinfo",
                                 "iiprop": "url|extmetadata|size", "iiurlwidth": 1600, "format": "json"})
        r.raise_for_status()
        out = []
        for p in (r.json().get("query", {}).get("pages", {}) or {}).values():
            ii = (p.get("imageinfo") or [{}])[0]
            md = ii.get("extmetadata", {})
            lic = md.get("LicenseShortName", {}).get("value", "")
            artist = re.sub(r"<[^>]+>", "", html.unescape(md.get("Artist", {}).get("value", ""))).strip()
            desc = re.sub(r"<[^>]+>", "", html.unescape(md.get("ImageDescription", {}).get("value", "")))[:200]
            title = p.get("title", "").replace("File:", "")
            out.append(Candidate(id=f"wikimedia-{p.get('pageid')}", provider=self.name, kind="image",
                                 url=ii.get("thumburl") or ii.get("url"), page_url=ii.get("descriptionurl"),
                                 title=title, text=f"{title} {desc}", license=lic,
                                 license_url=md.get("LicenseUrl", {}).get("value"), author=artist or "unknown",
                                 author_url=None, width=ii.get("thumbwidth"), height=ii.get("thumbheight")))
        return out


class OpenAIImages:
    name = "openai_images"

    def available(self):
        cfg = load_settings().get("assets", {}).get("openai_images", {})
        if not cfg.get("enabled"):
            return False, "disabled (assets.openai_images.enabled = false)"
        return (True, "enabled") if env_key("OPENAI_API_KEY") else (False, "OPENAI_API_KEY not set")

    def generate(self, description: str, dest: Path) -> Candidate:
        cfg = load_settings().get("assets", {}).get("openai_images", {})
        style = cfg.get("style") or "photorealistic, cinematic lighting"
        prompt = (f"{description}. Vertical 9:16 composition, {style}, "
                  "no text, no logos, no watermarks, no real people's likeness, no existing cartoon characters.")
        r = requests.post("https://api.openai.com/v1/images/generations", timeout=180,
                          headers={"Authorization": f"Bearer {env_key('OPENAI_API_KEY')}"},
                          json={"model": cfg.get("model", "gpt-image-1"), "prompt": prompt, "n": 1,
                                "size": cfg.get("size", "1024x1536"), "quality": cfg.get("quality", "medium")})
        if r.status_code != 200:
            raise StudioError(f"OpenAI image generation HTTP {r.status_code}: {r.text[:200]}")
        dest.write_bytes(base64.b64decode(r.json()["data"][0]["b64_json"]))
        return Candidate(id=f"openai-{text_hash(prompt)}", provider=self.name, kind="image", url=None, page_url=None,
                         title=description, text=description, license="AI-generated (OpenAI) - review OpenAI's terms",
                         license_url="https://openai.com/policies/terms-of-use", author="generated", author_url=None)


PROVIDERS = {"library": Library, "pexels": Pexels, "pixabay": Pixabay, "nasa": NASA, "wikimedia": Wikimedia,
             "openai_images": OpenAIImages}


def provider_status() -> dict:
    out = {"generated": (True, "procedural (offline)")}
    for n, cls in PROVIDERS.items():
        out[n] = cls().available()
    return out


# ----------------------------------------------------------------------------- download & verify
def _download(url: str, dest: Path, max_mb: float) -> Path:
    with requests.get(url, stream=True, timeout=60,
                      headers={"User-Agent": load_settings().get("assets", {}).get("http_user_agent", "RickClipsStudio/1.0")}) as r:
        r.raise_for_status()
        size = 0
        tmp = dest.with_suffix(dest.suffix + ".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(1 << 16):
                size += len(chunk)
                if size > max_mb * 1e6:
                    f.close()
                    tmp.unlink(missing_ok=True)
                    raise StudioError(f"download larger than {max_mb} MB")
                f.write(chunk)
        tmp.replace(dest)
    return dest


def verify_media(p: Path, kind: str) -> dict:
    if kind == "image":
        with Image.open(p) as im:
            im.verify()
        with Image.open(p) as im:
            return {"width": im.width, "height": im.height}
    info = ffmpeg.media_info(p)
    if not info.get("video") or info["duration"] <= 0.2:
        raise StudioError("not a playable video")
    return {"width": info["video"]["display_width"], "height": info["video"]["display_height"],
            "duration": round(info["duration"], 3)}


# ----------------------------------------------------------------------------- selection
def _cached_search(prov, query: str, kind: str, n: int, cache: dict) -> list[Candidate]:
    key = f"{prov.name}|{kind}|{query}"
    if key in cache:
        return [Candidate(c) for c in cache[key]]
    res = prov.search(query, kind, n)
    cache[key] = [dict(c) for c in res]
    return res


def fetch(slug: str, storyboard: dict, refresh: bool = False, providers: list[str] | None = None) -> dict:
    cfg = load_settings().get("assets", {})
    order = providers or cfg.get("providers", list(PROVIDERS))
    allowed = cfg.get("allowed_licenses", [])
    min_rel = float(cfg.get("min_relevance", 0.34))
    n = int(cfg.get("candidates_per_query", 12))
    max_mb = float(cfg.get("max_download_mb", 250))
    fdir = paths.project_dirs(slug)["footage"]
    man_path = fdir / "asset-manifest.json"
    old = {} if refresh else {e["scene"]: e for e in (read_json(man_path, {}) or {}).get("scenes", [])}
    cache_path = fdir / ".search-cache.json"
    cache = {} if refresh else (read_json(cache_path, {}) or {})
    used: set[str] = set()
    old_man = read_json(man_path, {}) or {}
    rejected = {r["asset_id"] for r in old_man.get("rejected", [])}
    entries = []
    status_cache: dict = {}
    for sc in storyboard["scenes"]:
        vis = sc["visual"]
        prev = old.get(sc["scene"])
        if prev and prev.get("status") in ("ok", "user") and prev.get("file") and (paths.root() / prev["file"]).exists() \
                and prev.get("query") == vis.get("query") and prev.get("variant") == vis.get("variant"):
            entries.append(prev)
            used.add(prev.get("asset_id", ""))
            continue
        if prev and prev.get("status") == "user":
            entries.append(prev)
            continue
        base = {"scene": sc["scene"], "query": vis.get("query", ""), "description": vis.get("description", ""),
                "requested_type": vis["type"], "variant": vis.get("variant", 0), "retrieved_at": now_iso()}
        if vis["type"] == "generated":
            entries.append({**base, "status": "generated", "provider": "generated", "generator": vis["generator"],
                            "on_screen_text": vis.get("on_screen_text", ""), "file": None,
                            "license": "original (procedurally generated by RickClips Studio)", "attribution": None})
            continue
        query = vis.get("query") or vis.get("description", "")
        kinds = ["video", "image"] if vis["type"] == "footage" else ["image", "video"]
        chosen, notes = None, []
        for pname in order:
            if pname in ("generated",) or pname not in PROVIDERS:
                continue
            prov = PROVIDERS[pname]()
            if pname not in status_cache:
                status_cache[pname] = prov.available()
            ok, why = status_cache[pname]
            if not ok:
                continue
            if pname == "openai_images":
                continue  # handled after real sources
            for kind in kinds:
                try:
                    cands = _cached_search(prov, query, kind, n, cache)
                except Exception as e:
                    notes.append(f"{pname} search failed: {str(e)[:120]}")
                    _log.warning("%s search failed for %r: %s", pname, query, e)
                    break
                scored = sorted(((relevance(query, c.get("text", "")), c) for c in cands
                                 if c["kind"] == kind and c["id"] not in used and c["id"] not in rejected),
                                key=lambda x: -x[0])
                scored = [(s, c) for s, c in scored if s >= min_rel and license_allowed(c.get("license", ""), allowed)]
                if not PERSON_WORDS.search(f"{query} {vis.get('description', '')}"):
                    scored = [(s, c) for s, c in scored if not people_likely(c)]
                for s, c in scored:
                    try:
                        if c.get("local"):
                            ext = Path(c["local"]).suffix.lower()
                            dest = fdir / f"scene_{sc['scene']:03d}_library{ext}"
                            shutil.copy(c["local"], dest)
                        else:
                            url = c.get("url") or (prov.resolve(c) if hasattr(prov, "resolve") else None)
                            if not url:
                                continue
                            ext = Path(url.split("?")[0]).suffix.lower() or (".mp4" if kind == "video" else ".jpg")
                            dest = fdir / f"scene_{sc['scene']:03d}_{pname}{ext}"
                            _download(url, dest, max_mb)
                        meta = verify_media(dest, c["kind"])
                        wants_people = PERSON_WORDS.search(f"{query} {vis.get('description', '')}")
                        if not wants_people and prominent_face(dest, c["kind"]):
                            dest.unlink(missing_ok=True)
                            notes.append(f"{c['id']}: rejected - shows a prominent person the scene did not ask for")
                            continue
                    except Exception as e:
                        notes.append(f"{c['id']}: {str(e)[:100]}")
                        continue
                    chosen = {**base, "status": "ok", "provider": pname, "asset_id": c["id"], "kind": c["kind"],
                              "file": str(dest.relative_to(paths.root())), "source_url": c.get("url"),
                              "page_url": c.get("page_url"), "title": c.get("title"), "relevance": round(s, 3),
                              "license": c.get("license"), "license_url": c.get("license_url"),
                              "attribution": c.get("author"), "attribution_url": c.get("author_url"), **meta}
                    if c["kind"] == "image" and vis["type"] == "footage":
                        chosen["note"] = "still image used (animated with motion) - no matching licensed video found"
                    used.add(c["id"])
                    break
                if chosen:
                    break
            if chosen:
                break
        if not chosen and "openai_images" in order:
            prov = OpenAIImages()
            ok, _ = prov.available()
            if ok:
                try:
                    dest = fdir / f"scene_{sc['scene']:03d}_openai.png"
                    c = prov.generate(vis.get("description") or query, dest)
                    meta = verify_media(dest, "image")
                    chosen = {**base, "status": "ok", "provider": "openai_images", "asset_id": c["id"], "kind": "image",
                              "file": str(dest.relative_to(paths.root())), "license": c["license"],
                              "license_url": c["license_url"], "attribution": "AI-generated", "relevance": 1.0, **meta}
                except Exception as e:
                    notes.append(f"openai_images: {str(e)[:100]}")
        if not chosen:
            active = [p for p, (ok, _) in status_cache.items() if ok]
            chosen = {**base, "status": "placeholder", "provider": "placeholder", "generator": "placeholder", "file": None,
                      "license": "original placeholder", "attribution": None,
                      "reason": ("no relevant, licence-compatible result for '" + query + "' from: "
                                 + (", ".join(active) or "no available provider (add API keys or library footage)")),
                      "notes": notes[:6]}
        entries.append(chosen)
        say(f"  scene {sc['scene']:>2}: {chosen['status']:<11} {chosen['provider']:<10} {query[:50]}",
            level="warn" if chosen["status"] == "placeholder" else "info")
    write_json(cache_path, cache)
    manifest = {"slug": slug, "updated_at": now_iso(), "scenes": entries,
                "summary": {s: sum(1 for e in entries if e["status"] == s) for s in ("ok", "user", "generated", "placeholder")},
                "audio": old_man.get("audio", []), "rejected": old_man.get("rejected", [])}
    write_json(man_path, manifest)
    return manifest


def assign_file(slug: str, scene: int, file: str, license_: str, attribution: str | None) -> dict:
    """Manually use your own file for a scene (you confirm you have the rights)."""
    fdir = paths.project_dirs(slug)["footage"]
    src = Path(file)
    if not src.exists():
        raise StudioError(f"File not found: {file}")
    ext = src.suffix.lower()
    kind = "video" if ext in VIDEO_EXT else "image" if ext in IMAGE_EXT else None
    if not kind:
        raise StudioError("Use a video (mp4/mov/webm) or image (jpg/png/webp) file")
    dest = fdir / f"scene_{scene:03d}_user{ext}"
    shutil.copy(src, dest)
    meta = verify_media(dest, kind)
    man_path = fdir / "asset-manifest.json"
    man = read_json(man_path, {"slug": slug, "scenes": []})
    man["scenes"] = [e for e in man["scenes"] if e["scene"] != scene]
    man["scenes"].append({"scene": scene, "status": "user", "provider": "user", "kind": kind,
                          "file": str(dest.relative_to(paths.root())), "license": license_ or "user-provided",
                          "attribution": attribution, "source_url": str(src), "retrieved_at": now_iso(), **meta})
    man["scenes"].sort(key=lambda e: e["scene"])
    man["summary"] = {s: sum(1 for e in man["scenes"] if e["status"] == s) for s in ("ok", "user", "generated", "placeholder")}
    write_json(man_path, man)
    return man


def reject(slug: str, scene: int, reason: str, storyboard: dict) -> dict:
    """Reject the asset chosen for a scene (blocklisted for this project) and fetch the next candidate."""
    fdir = paths.project_dirs(slug)["footage"]
    man_path = fdir / "asset-manifest.json"
    man = read_json(man_path)
    if not man:
        raise StudioError("No asset manifest yet - run the assets stage first")
    entry = next((e for e in man["scenes"] if e["scene"] == scene), None)
    if not entry:
        raise StudioError(f"Scene {scene} not found in the manifest")
    if entry.get("asset_id"):
        man.setdefault("rejected", []).append({"asset_id": entry["asset_id"], "scene": scene, "reason": reason,
                                               "title": entry.get("title"), "at": now_iso()})
    if entry.get("file"):
        (paths.root() / entry["file"]).unlink(missing_ok=True)
    man["scenes"] = [e for e in man["scenes"] if e["scene"] != scene]
    write_json(man_path, man)
    return fetch(slug, storyboard)


def use_generator(slug: str, scene: int, generator: str, text: str = "") -> dict:
    """Replace a scene's visual with an original procedural one (e.g. after rejecting stock results)."""
    from .generators import CLASSES
    if generator not in CLASSES or generator == "placeholder":
        raise StudioError(f"Unknown generator '{generator}'. Choose from {', '.join(n for n in CLASSES if n != 'placeholder')}")
    fdir = paths.project_dirs(slug)["footage"]
    man_path = fdir / "asset-manifest.json"
    man = read_json(man_path)
    for e in man["scenes"]:
        if e["scene"] == scene:
            if e.get("file") and e.get("status") == "ok":
                (paths.root() / e["file"]).unlink(missing_ok=True)
            e.update({"status": "user", "provider": "generated", "generator": generator, "on_screen_text": text,
                      "file": None, "kind": None, "license": "original (procedurally generated by RickClips Studio)",
                      "attribution": None, "note": "visual replaced by a generator during review", "retrieved_at": now_iso()})
            break
    else:
        raise StudioError(f"Scene {scene} not found in the manifest")
    man["summary"] = {s: sum(1 for e in man["scenes"] if e["status"] == s) for s in ("ok", "user", "generated", "placeholder")}
    write_json(man_path, man)
    return man
