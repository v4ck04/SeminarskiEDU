# Checks — run with code, every frame, before every render
Reference implementation: `code/src/engine/check/` (check_logic.ts, check_framing.ts, gates.ts).

## Logic (hard gates)
- Person walking into / through another person, a car, a wall, a shelf, a table.
- Hand inside a shelf; hand not on the cart handle it is pushing; cart through cart.
- People, carts, cars not standing on the floor; baskets sinking into the floor.

## Framing (hard gates)
- Subject's face/head cut by the frame edge.
- Camera inside geometry (walls, cars, carts, under the floor) or < 0.5 m from a head in view.
- Subject hidden for ≥ 5 frames, or a foreground person covering the subject.
## Framing (warnings)
- Subject off-centre, too small/too big, feet cut, no headroom, face under the caption, signs unreadable.

## Rule
No render while a hard gate fails. A waiver only with a written reason you (the human) accepted.
Measured example: version 2 of our first video had 7,906 framing errors on 1,511 frames; version 3 had 0.
