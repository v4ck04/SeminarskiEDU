# Workflow — the 4 steps

## Step 1 · Give Claude eyes (references)
Claude has no taste of its own — its taste is the reference you give it.
- Collect 5–10 of the most viewed shorts in the style you want (your own downloads).
- Ask Claude to MEASURE them with its own tools, not to describe them: every frame (contact sheets), cuts vs camera moves, camera motion per second, colour/brightness, caption size and position, loudness (LUFS), words per second, where the hook ends.
- Numbers can be wrong too: a cut detector counts fast camera moves as cuts. Check a few by eye before you trust a number.
- Turn the measurements into written rules (see 02/03/04). Every second of a great short has a rule behind it.

## Step 2 · A team of agents, one job each
- One agent per problem: characters, world, light & colour, logic (who walks through what), camera/director.
- Each agent: own files only (no two agents editing the same file); the main session merges.
- Cost: an agent round can use 100–180k tokens. Simple jobs → a lighter model (e.g. Sonnet); hard, precise jobs → the strongest model (e.g. Opus).

## Step 3 · Hire a director
- Before any camera work, a director agent writes the shot list: who stands where, where the camera goes, which word the camera pushes in on, where the camera TRAVELS instead of cutting.
- Then measure the result (e.g. camera shake: px moved between frames) and compare versions with numbers.
- Check with code: logic + framing checkers on every frame (06_CHECKS.md). No render until they pass.

## Step 4 · You are the judge
- Run a judge agent each round (score characters, world, light, camera, logic, overall /10 vs the reference) — but decide yourself. Reject "logic" complaints that are just cartoon magic; fix only what a viewer would really notice.
- Claude must watch the WHOLE video (contact sheets of every ~0.5 s) before saying "done" — a few stills hide problems (props sinking into the floor, camera inside faces).

## Time savers
- Render on your own computer: a double-click render script (render.command / .bat) is ~30 s for a preview vs ~1.5 h for 15 s on a cloud machine.
- Never delete a version: v1, v2, v3… each archived; one day the new version is worse and you go back in one click.
- Put every improvement INTO the shared engine (characters, sets, camera, checkers) — not into one video's copy — so the next video starts better.
