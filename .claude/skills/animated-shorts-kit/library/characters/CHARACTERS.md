# Character bank — 20 characters

All share one style: white ball head (#fdf9f6), dot eyes, line mouth, thin dark stick limbs, ball hands, dark warm ink outline (#241726) heavier on the lower edge, body ~1.5–2 heads, costume = identity. Exact colours/shapes live in `code/src/engine/chars/charparts.ts` (LOOKS + SHAPES); the rig (walk, grip a cart, carry a basket, gaze, 16 expressions, mouth shapes) is `rig.tsx`.

| # | id | role | age | costume | shape |
|---|---|---|---|---|---|
| 1 | `goldman` | Store owner / inventor hero | adult man | fedora, round glasses, navy suit, apron, red tie | proud dumpling-shaped ball head |
| 2 | `woman` | Shopper | adult woman | teal cloche hat, orange dress with cream dots | round egg head, pert hat |
| 3 | `man` | Strong worker | adult man | grey flat cap, cream shirt, blue overalls, big arms, mustache | square ball head, wide |
| 4 | `grandma` | Grandma | elderly woman | white bun, glasses, purple dress with lace | soft pear, a bit smaller |
| 5 | `youngman` | Young man | young man | straw boater, slick hair, mustard vest, navy trousers | ball head, rakish hat |
| 6 | `youngwoman` | Young woman | young woman | wavy blond hair, teal dress with light dots | round egg |
| 7 | `shopper` | Tired shopper | adult woman | orange cloche, blue dress with dots | round |
| 8 | `shopper2` | Gentleman shopper | adult man | grey fedora, brick-red suit, mustache | squarish |
| 9 | `kid` | Kid | child | teal cap, mustard shirt, blue shorts | round, big head, small body |
| 10 | `magee` | Old inventor | elderly man | tan fedora, grey hair, brown suit, glasses, mustache | ball head, slight forward lean |
| 11 | `preacher` | Stern preacher | adult man | black fedora, black suit, white collar | narrow, stiff |
| 12 | `rancher` | Rancher | adult man | wide tan hat, brown vest, blue trousers, mustache | wide square jaw |
| 13 | `cop` | Policeman | adult man | navy police cap, navy uniform, gold buttons, mustache | square jaw, upright |
| 14 | `nurse` | Nurse | adult woman | white cloche with teal band, white dress, teal trim | round egg |
| 15 | `teacher` | Teacher | adult woman | hair bun, glasses, mustard dress | soft round |
| 16 | `banker` | Banker | adult man | black fedora, grey suit, red tie, mustache | squarish, leans back |
| 17 | `oldman` | Old man | elderly man | brown flat cap, white hair, glasses, brown vest | soft, leans forward, a bit smaller |
| 18 | `paperboy` | Paperboy | child | red cap, cream shirt, grey shorts | round, big head |
| 19 | `mechanic` | Mechanic | adult man | blue cap, blue overalls over cream shirt, big arms | wide square jaw |
| 20 | `baker` | Baker | adult woman | wavy hair, pink dress with dots, apron | round |

## Make your own
Copy any entry in LOOKS/SHAPES and change: hat (fedora/cloche/cap/boater), hairStyle (part/bob/bun/slick/kid/wave), outfit (suit/vest/overalls/dress/kid), main/second/accent colours, glasses, mustache, apron, dots, scale (kids ~0.65), wide (big men ~1.1–1.2). Add the new id to the `Who` type.

Expressions (`Expr` in charparts.ts): neutral, happy, fake, sad, smirk, worried, surprised, closed, wink, angry, smug, tired, proud, rage, grin, shock — plus talking mouth shapes.