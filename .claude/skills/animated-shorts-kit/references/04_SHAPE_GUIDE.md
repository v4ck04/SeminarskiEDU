# SHAPE GUIDE - cut-out characters + toon set (reference: Ricks Clips shorts)

Scope: silhouettes, angles, proportions, line weight. NOT colour/light, NOT detail level.
Rule zero (user): keep things simple and stylised. Change the *shape* of a part, never add parts. Box-like cars without doors stay.

Reference studied: videos 02 (railroad), 04 (storm oil), 06 (pachinko window); 12 frames, crops in `compare_sheet.jpg` (top band).
Numbers below are measured on 1080x1920 frames scaled to 540x960, relative to head width (HW).

## 1. What the reference actually does (measured)
| feature | Ricks Clips | ours before | gap |
|---|---|---|---|
| head | near-round to egg, h:w 1.0-1.15, widest just BELOW centre (cheeks/jaw), often sheared/tilted 3-8 deg | ellipse, h:w 0.92 (wider than tall), perfectly symmetric | read as "circles" |
| head : body | body width 0.75-0.9 HW, body height 1.3-1.9 head heights, no neck, head overlaps body | 0.73 HW, 1.35 | ok |
| torso | long capsule/bean, firm shoulders, belly side rounder than back, slight lean | symmetric barrel | asymmetry missing |
| outline | 2.5-3.2 % HW, dark warm brown, a little heavier on the lower/shadow edge, round ends | 2.3 % HW, uniform | slightly thin, mechanical |
| brows | heavy wedges: 6-7 % HW at the inner end, tapering to a point; angle carries the mood | uniform 3 % HW strokes | biggest "designed" cue |
| eyes | black ovals / lidded half-ovals, spacing ~0.3 HW | same | ok |
| mouth | small (10-15 % HW), often off-level / off-centre | centred, uniform line | small fix |
| hair | helmet/bowl shapes with a sharp part notch, asymmetric side patches, pointed locks | rounded symmetric scallops | needs points + asymmetry |
| hats | oversized, tilted 5-15 deg, brims with pointed upturned tips, crowns tapered/pinched | level, elliptical brims, domed crowns | needs tilt + points |
| limbs | thin dark sticks ~5 % HW, slight taper, knees can bend sharply | uniform sticks | taper |
| hands / feet | ball hands ~12 % HW; feet tiny hooks / wedges | balls / ellipse shoes | wedge shoes |
| props | chunky simplified solids; posts taper, bases flare; ink outlines on everything; objects "lean" forward | straight cylinders, level car | taper/flare/rake |

## 2. Rules (character)
1. **Head = egg with a jaw, never a circle.** Superellipse exponent 2.0-2.8 (2 = round, 2.8 = square jaw); jaw widening -0.13..+0.21 (negative = egg narrowing to the chin); h:w 0.97-1.08; shear 0-0.05 (sign varies per character). Side view: chin pushed 7 % rx forward, skull 3 % back.
2. **Every character gets a shape signature** (table `SHAPES` in charparts.ts): dumpling (goldman), egg (woman, youngwoman), square jaw (man, cop, rancher, shopper2), pear (grandma), long bean (magee, preacher, youngman), round (kid, shopper). Two neighbours in a shot should not share the same head family.
3. **Torso = one sack per outfit family**: suit = trapezoid, firm shoulders (corner r = 0.2 body h), squared hem corners (r 0.07); dress = A-line, narrow rounded shoulders, sharp flared hem (r 0.03) with a 16 mm bow; overalls = broad barrel, widest at 45 %; vest = long capsule; kid = round pod. Front view: per-character lean 1-2 cm at the shoulders. Side view: belly +10 %, back -7 %.
4. **Outline**: 13.5 mm (~2.8 % HW) on head/body/hats; limbs 10.5 mm. Brush weight: ink shape offset (5, 7) mm down/back under the fill -> lower/back edge ~2x the top edge. Never thinner than 0.8x, never a uniform "vector" line on big shapes.
5. **Tapers**: brows, smiles/frowns, closed/happy eyes, hair strands are brush strokes thick in the middle or inner end, pointed at the ends. Brow inner end 24 mm (28 mm angry), mid 18, tip 3. Limbs taper to the extremity: thigh 32->28, shin 28->23, upper arm 27->23, forearm 23->19 mm; widths equal at joints.
6. **Points and notches over scallops**: hair parts are sharp V notches placed off-centre (x = -0.3 rx), fringes end in pointed locks, sideburns and napes are pointed, bob ends flick outward to a point.
7. **Hats sit askew** (front tilt per character, 0 to +-0.22 rad; side view brim snapped 0.07 rad down at the front). Brims are lenses with pointed tips lifted 1-3 cm; crowns taper inward (fedora: pinched with a centre dent; boater: trapezoid); caps puff forward over a pointed peak.
8. **Asymmetry budget**: at most 3 asymmetric cues per character (e.g. head shear + hat tilt + side part). Cops/preachers stay more upright (stiff = symmetric is characterisation too).
9. **Shoes**: wedge - square heel, tapered toe tipping up (side); small trapezoid widening to the toe (front).
10. Faces: features stay small and high-contrast; no nose (reference has none); mouth may sit 2-4 mm off-level.

## 3. Rules (props / set) - shape only, same part count
1. Posts never straight: cylinder top/bottom radius 0.55-0.6; add a flared foot (radius 2x post, top/bottom 0.4-0.45) only where a base already exists or replaces a straight base.
2. Containers read as objects with attitude: hydrant barrel tapers up, bins flare out (bucket), mailbox stays boxy.
3. Vehicles lean forward: raked windshield (~35 deg from vertical), roof crowned toward the back, hood dipping 4-6 cm to the grille, rounded tail. Still one extruded silhouette, no doors.
4. Corners: big set boxes keep hard edges (the toon ink pass outlines them); small hero props get bevel/round >= 6 % of their size.
5. Do NOT add trim, panels, bolts or extra meshes to make something "designed" - change the silhouette instead.

## 4. Where it lives (src/meter_shape)
* `charparts.ts`: `SHAPES` table, `brush()`, `inkUnder()`, `poly()`, `headPts()`, `sackPts()` + `sackFor()`, `LIMB_W`, prim types `t`/`p`, `limbTex` (kinds `shin`, `fore`), `footTex`, `hairFront2` (part/slick/kid + bob/wave), `hairSideBack` (pointed nape, forelock), `headTex`, `bodyTex`, `hatTex`, `browsTex`, `mouthTex` (line/smile/frown/smirk), `eyesTex` (happy/closed).
* `rig.tsx`: shin uses `limbTex('shin')`, forearm `limbTex('fore')` (one line).
* `street.tsx`: car silhouette points `P`, meter post (`taper`, `flare` geometries).
* `town.tsx`: `TAPER`/`FLARE`/`BUCKET` geometries for lamps, hydrants, bins, street-clock post.
* Review tools: `tools/lineup.tsx` (13-character line-up, own registerRoot), `tools/lineup_orig.tsx` + `tools/orig/` (frozen originals for before/after).

## 5. Line weight (variable ink) - measured on Ricks Clips frames 02/04/06 (1080 px wide, head width HW ~ 250 px)
Reference findings (hand-inked look; every line varies, nothing is a uniform vector stroke):
| line | min | max | where thick / thin |
|---|---|---|---|
| head / body outline | 2 % HW | 5 % HW (ratio ~2.3-2.6) | thick on the lower and left (shadow) side, under hat brims and hair edges (occlusion), at the belly of curves; thin on the upper-right (light) side and at sharp corners; slow wobble +-10 % |
| hat brim | 1.5 % | 4.5 % | lower edge of the brim heavy, top edge thin; brim tips pointed |
| brows | 0.5 % (tip) | 3 % (inner third) | blunt thick start, taper to a point over the outer 60 % |
| eyelid bars / mouth | 0.4 % (tips) | 2.4 % (belly, ~40 % along) | both ends taper to points, belly slightly toward the start |
| clothing folds, buttons, seams | 0.6 % | 1.2 % | thin, tapered ends, never as heavy as the silhouette |
| limbs | ~ uniform thin sticks | | slight taper only |
Rules implemented (charparts.ts, `installInk`/`inkRibbon`):
1. Every `g.stroke()` on a part texture is replaced by a filled ribbon built from the recorded path (resampled every 2.2 mm). Strokes used as geometry (open lines > 9.5 mm, dashed, `rawInk` sections such as limb prims) are left alone.
2. Closed outlines: width = lw x 1.08 x f, f = 1 - 0.46 x (n . L) (+0.12 if the normal points down), L = towards-light (0.5, -0.87), clamp >= 0.52, so 0.54 .. 1.58 x lw (ratio ~2.9 max, ~2.3 typical); wobble 9 % (period 0.31 m) + 5 % (0.12 m); corners with >1.2 rad turn slim by 14 %; ribbon centre shifted outward by 0.14 w. Interior closed shapes vary less (strength = (lw-3 mm)/9 mm, min 0.3). Base lw: 13.5 mm silhouettes, thinner for details, so outer lines are automatically the heaviest.
3. Open thin lines (<= 9.5 mm): width = lw x (0.22 + sin(pi u')^0.75), peak at u = 0.4, ends 22 % of lw (pointed).
4. `brush()` (brows, mouths, happy eyes, strands) peaks at 42 % instead of 50 %; brows 29 mm inner / 21 mm mid / 2.5 mm tip.
5. Limbs, hands, shoes: ink layer = shape grown 0.58 x ink on the upper-right plus the same shape shifted (-0.38, +0.6) x ink grown 0.6 x ink -> lower-left edge ~1.1 x ink, upper-right 0.58 x.

## 6. Faces + proportions v2 (judge findings vs Ricks Clips, measured at equal head width) - src/meter_face
| rule | value | where |
|---|---|---|
| head colour | every head `FACE` #fdf9f6 (RC #fcf7f4); cel band only #ebe7ee; face materials take 20 % of the scene tint, `toneMapped: false` -> faces stay white in every light. `Look.skin` is no longer used for heads/hands | charparts `FACE`, `headTex`; rig `tintOf`/`isFace` |
| head shape | white ball, h:w 0.95-1.0 (`SK.RX/RY` 0.258/0.252, SHAPES w 0.98-1.05, h 0.96-1.0, sq 2.0-2.45, jaw -0.06..+0.14) | `SK`, `SHAPES` |
| head : body | body front width x0.84 (`bodyDims`), shoulders `SX` 0.135, hips `HX` 0.06 -> head ~1.15-1.25x body | `bodyDims`, `SK` |
| legs | `SK.T`/`SK.S` 0.18/0.18 (was 0.30/0.29) -> ~0.8 head heights; arms 0.215/0.20 (hands at hip line). `LEG_DROP` = 0.23 m exported for seats/props | `SK`, `LEG_DROP` |
| brows | ALWAYS drawn, blunt slabs 0.029->0.026->0.011 m thick (5-6 % HW), 0.112 m long (~22 % HW), 0.066 m above the face centre (close to the eyes, under hat brims); `flat` is tilted inner-end-down (deadpan attitude) | `browsTex` (key `brows3`), rig face group |
| eyes | default `lid`: tall black oval, flat upper lid bar cutting the top third, tilted down to the nose. Eyes with whites take a pupil step `eyesTex(k, q)` (q -2..2) | `eyesTex` |
| gaze | `PersonP.gaze` = world point or `'cam'`. -> look (pupils/eye block shift 0.024 m), turn 0.55 g (features slide 0.16 m x turn = up to ~15 % HW, compress 22 %), head roll -0.13 g rad (~7 deg). No gaze -> seeded resting 3/4 turn (0.22) + roll (0.05) so faces are never dead-front. Camera only while addressing the viewer (talking, wink, final present) | rig `computePose`; stage per-shot `gaze` + `autoGaze` (nearest partner <= 4 m, else meter <= 2.5 m) |
| mouths | defaults small + asymmetric (50-70 mm = 10-14 % HW, one corner higher): line, smile, smirk, frown, wavy, o; talking visemes A/E/O 0.07 m wide. Teeth grid / big open D only in peak exprs `rage`, `fake`, `shock`, `grin` | `EXPR`, `mouthTex` (key `mouth2`) |
| hair | under a hat the side hair stops high (short pointed sideburn, no low flaps); preacher hair darkened to #2a2024. Back view: dark cap down to ~0.4 ry with a rounded hairline + short nape point, white ears and nape below (no full black mask); bob/wave keep long hair with a pointed hem | `hairFront2`, `hairSideBack`, `headTex` |
| staging | in-car seat y = -0.07 + LEG_DROP (head stays in the window, exit steps down smoothly); sit = hips fixed at 0.5 m (chair) with dangling legs; placards / bulb lowered by LEG_DROP; table carry lift 0.1 | stage `seatOf`, `walk`, rig `SEAT_HIP` |
Review: `src/meter_face/tools/lineup_faces.tsx` (front / side / back / close-ups / expression rows), sheet `review_faces/compare.jpg`.
