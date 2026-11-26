# Agent team — copy-paste prompts
Run them in parallel. Each agent edits ONLY its own files. Always start with "Answer in English only."

## Research round (read-only)
> Answer in English only. Spawn 4 agents in parallel using a lighter model: one reads references/04_SHAPE_GUIDE.md, one reads references/03_CAMERA_GRAMMAR.md, one reads references/02_STORY_FORMULA.md, one reads library/environments/ENVIRONMENTS.md. Each returns the 3 most important rules for THIS video, one line each. Then show all 12 rules in one table.

## Fix round (one problem each)
- **Characters agent** — "Compare our characters to the reference frames. Fix proportions, outlines, poses and joints. Edit only code/src/engine/chars/*."
- **World agent** — "Make the set rich and specific (props, signs, textures) so the main object is the most detailed thing. Edit only the kit files."
- **Logic agent** — "List every frame where a person walks through a person/wall/shelf/car, a hand is not on the handle it should hold, or something floats/sinks. Fix staging only (stage.ts)."
- **Camera agent / director** — see below.

## Director (strongest model)
> Read the script and 03_CAMERA_GRAMMAR.md. Write a shot list: for every line — who stands where, the camera position and size, which word the camera pushes in on, and where the camera travels from subject to subject instead of cutting. No heads cut off, no subject blocked, no camera inside walls. Then implement it in takes.ts and run the framing checker.

## Judge (every round)
> Spawn one judge agent. It reads the reference rules and our shot list / contact sheets and scores our video 1–10 for characters, world, light, camera, logic and overall, with one short reason each. Show it as a table.
Then YOU decide which points to fix. Cartoon magic is allowed.
