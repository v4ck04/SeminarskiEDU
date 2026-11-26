# Environment & prop bank
Reference code: `code/src/engine/kits/`. All sets are low-poly 3D with flat toon materials, procedural canvas textures (`code/src/engine/look/draw.ts`) and dark ink outlines.

## 1 · Corner grocery, 1930s (`kits/grocery/store.tsx`)
- Interior: striped wallpaper, wooden shelves full of cans/boxes/jars with labels, checkerboard tile floor (teal/cream), counter with cash register, pendant lamps, wall calendar ("DAY 1/2/3"), price tags, chalkboard, sacks (burlap), barrels, display window with the street behind.
- Front: awning with stripes, big shop sign ("GROCERY"), valance, door, display windows.
- Props: **shopping cart** (`Cart`: wire baskets, wheels, handle; sized to the cast with `CART_K`), wicker baskets with fruit, coins, light bulb ("idea"), workshop pegboard with tools, folding chair → cart build sequence, clock.
- Workshop corner: pegboard wall, workbench, tools, wood floor.

## 2 · 1930s downtown street (`kits/downtown/town.tsx`, `townData.ts`, `street.tsx`)
- A full block, both sides: 28 shop fronts with signs — bakery, hardware, barber shop, five & dime, cinema (RIALTO), tailor, hotels, bank, newspaper office, drug store, shoes, cafe, diner, laundry, books, music, toys, florist, insurance, garage… (brick red/yellow/dark or painted walls, awnings, blade signs, water tanks on roofs).
- Street: asphalt lanes, sidewalks, curbs, parking lanes, cross streets, end towers.
- Street furniture: lamp posts, fire hydrants, mailbox, bins, a street clock (`StreetClock`, settable hours).
- **Cars** (`Car`: colour, doors, driver, wheel spin) and **parking meters** (`Meter`: coin slot, flag, rise) + extras (table & chairs, light bulb, placards).
- Sky: day sky backdrop and a time-of-day switch (day / evening / night / indoor) in the original — basic version only in this kit.

## Palette (base, flat — not the premium light/grade)
| use | colours |
|---|---|
| ink (all outlines) | `#241726` |
| faces | `#fdf9f6` |
| warm oranges / reds | `#d0532f` `#c8432a` `#b2391f` `#f2992a` `#f2b234` |
| teals / blues | `#2f6f73` `#3f9a8c` `#3f8a86` `#2a5f9a` `#5b7fb5` `#3d4a66` |
| creams / neutrals | `#f4ead6` `#f2e3c0` `#fbf3e0` `#e8d8b0` `#efe0c0` |
| browns / wood | `#7a3b22` `#8a5a32` `#6b5240` `#4a2418` |
Rule: orange/warm vs teal/blue complementary scheme; medium brightness; never crushed blacks; the main story object is the most detailed and brightest thing.
