---
name: animated-shorts-kit
description: Make viral-style 2D-character / 3D-world animated story shorts (YouTube Shorts, TikTok, Reels) with Claude, Three.js and Remotion. Use when someone wants to plan, script, build, check or improve an animated short — story formula, 20 ready characters, grocery-store and 1930s-downtown sets, camera rules, agent team, logic/framing checkers and a version workflow.
---

# Animated Shorts Kit

A starter kit from a real 2-video project (a 1930s shopping-cart story and a parking-meter story).
It gets you to roughly 60–70% of a finished short on day one; your own taste and the last round of fixes do the rest.

## What is inside
| Folder | What | Read it when |
|---|---|---|
| `references/01_WORKFLOW.md` | The 4-step method + versions, render, checks | Always first |
| `references/02_STORY_FORMULA.md` | Hook, story arc, details, ending, captions, sound | Writing the script |
| `references/03_CAMERA_GRAMMAR.md` | Measured camera rules (push-ins, travel instead of cutting, framing) | Planning shots |
| `references/04_SHAPE_GUIDE.md` | Character shapes, proportions, line weight | Building/editing characters |
| `references/05_AGENT_TEAM.md` | Ready prompts for the agent team, the director and the judge | Improving a version |
| `references/06_CHECKS.md` | Logic + framing checklists and hard gates | Before every render |
| `references/07_BASIC_LIGHT.md` | Simple light rules + basic look code | Lighting a scene |
| `library/characters/` | 20 characters (JSON + description) | Casting |
| `library/environments/` | Grocery store, workshop, downtown street, cars, props, base palette | Building the set |
| `code/` | A working mini studio (tested): characters/rig, sets, camera, checkers, basic render, `render.command` | Building the video — read `code/CODE_README.md` |

## How to work with the user
1. Ask what the story is (or help pick one). Fact-check it, and check nobody has already made the same short.
2. Write the script with `02_STORY_FORMULA.md` (45–65 s, one-sentence hook, no year/"once upon a time" opening).
3. Plan shots with `03_CAMERA_GRAMMAR.md`; cast from `library/characters`; pick sets from `library/environments`.
4. Build with `code/` (see `code/CODE_README.md`): copy `src/videos/01_example`, edit timeline/stage/takes/set. Missing pieces: write them in the same style (flat toon materials, dark ink outlines, white ball heads).
5. Run the checks in `06_CHECKS.md` with code, not by eye. Then render a preview on the user's own computer (never a huge cloud render).
6. Watch the WHOLE preview (contact sheets every ~0.5 s), fix, and keep every version (v1, v2, v3…) in an archive.
7. The user is the final judge: an agent checks everything word for word; cartoon magic (a chair becoming a cart) is fine.

## Not included
The premium light/colour layer (grading, light that tells the story, premium materials) is a separate kit. This kit has the basic version: `references/07_BASIC_LIGHT.md` + `code/src/engine/look/look.ts` + the palette in `library/environments/ENVIRONMENTS.md`.
