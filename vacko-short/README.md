# VACKO — YouTube Short #1: „Why Most People Stay Broke"

Gotov video: **`VACKO-why-most-people-stay-broke.mp4`**

- 1080 × 1920 (9:16), 30 fps, **40,0 s**, H.264 High (yuv420p, BT.709)
- Audio traka postoji, ali je **potpuno tiha** (AAC 48 kHz stereo, −91 dB): bez glasa, muzike i efekata
- Tekst na ekranu je tačno onaj iz brifa (američki engleski); ime brenda je samo **VACKO**

Stil prati referentni video: kinetička tipografija (sitne uvodne reči + krupna 3D ključna reč), „studio" svetla
pozadina sa svetlom kroz prozor i senkama palme, tamne navy scene sa brojačima, novac/kovanice koje lete,
ručno iscrtani krugovi i strelice. Sve je u brend bojama: navy `#101827`, emerald `#16C784`, gold `#F5C451`, white `#FFFFFF`.

## Tajming (za voiceover i titlove)

| Vreme | Scena | Tekst na ekranu | Šta se dešava |
|---|---|---|---|
| 0:00–0:05 | 1 · Hook | WHY MOST PEOPLE / **STAY BROKE** | Ruka u odelu drži telefon, ček (PAYCHECK $3,250.00) uleće i skenira se, stanje skače sa $186.40 na $3,436.40, oko telefona iskaču troškovi |
| 0:05–0:12 | 2 · Problem | IT’S NOT ALWAYS / HOW MUCH YOU **EARN** | Isti broj stanja ostaje na mestu (match cut), novčanice lete u troškove: Shopping 0:06,4 · Food Delivery 0:07,2 · Subscriptions 0:08,0 · Impulse Buys 0:08,9 · Credit Card 0:09,7 → stanje **$38.18** (zlatni krug 0:10,6) |
| 0:12–0:20 | 3 · Pravi razlog | IT’S HOW YOU / **MANAGE** YOUR MONEY | Dva grafikona: INCOME +100 % (emerald stubovi rastu), SAVINGS +2 % (zlatni novčići stoje u mestu dok EXPENSES rastu) |
| 0:20–0:23,5 | 4 · Rešenje 01 | SPEND / **SMARTER** | Novčanik: novčanice se uredno slažu, emerald kvačica |
| 0:23,7–0:27 | 4 · Rešenje 02 | SAVE / **CONSISTENTLY** | Staklena tegla se puni novčićima u ravnomernom ritmu |
| 0:27,4–0:30 | 4 · Rešenje 03 | TRACK / **YOUR MONEY** | Tablet sa kontrolnom tablom: štednja raste do $12,480, „On track" |
| 0:30,3–0:31 | prelaz | — | Kamera ulazi u ekran tableta |
| 0:31–0:35 | 5 · Brend | BUILD BETTER / **MONEY HABITS** | Zlatni i emerald novčići dolete i slože se u VACKO znak; blesak na 0:33,95 |
| 0:35–0:40 | 5 · Logo | **VACKO** · SMART MONEY. SMARTER FUTURE. | Logo + slogan, završni kadar (dovoljno mirno za poslednju rečenicu / CTA) |

### VO skripta

Engleska VO skripta je u **[`VO-script.md`](VO-script.md)**: tabela sa startom svake rečenice i čist tekst za AI voice alat.

### Gde staviti titlove

Sav tekst i važni elementi su između **y ≈ 250 i 1240 px**, levo-desno u okviru 70–1010 px (YouTube dugmad desno i opis dole ih ne pokrivaju).
Za titlove je ostavljena mirna zona **y ≈ 1380–1520 px** (iznad naziva kanala i opisa na dnu).
Mali „VACKO" potpis stoji gore na sredini (y ≈ 190–230) u scenama 1–4.

## Brend elementi u videu

- **Znak:** zlatni prsten (novčić) + „V" koji je istovremeno kvačica i strelica koja raste i izlazi iz prstena.
  Ako već imaš svoj VACKO logo (SVG ili PNG sa providnom pozadinom), pošalji ga i zameniću ga u završnoj sceni i u potpisu gore.
- **Fontovi:** Montserrat (naslovi, brojevi), Inter (tekst u aplikaciji) — oba su besplatna (OFL) i nalaze se u `assets/fonts/`.

## Ponovni render / izmene

Treba: Node 18+, Playwright sa Chromium-om, ffmpeg.

```bash
cd vacko-short
node tools/render.mjs video --out VACKO-why-most-people-stay-broke.mp4 --workers 4   # ceo video (~4 min)
node tools/render.mjs stills --times 2.5,8,16,22,34 --scale 0.5                    # pojedinačni kadrovi → out/stills/
node tools/render.mjs sheet --every 1                                              # pregled 1 kadar/s → out/stills/sheet.png
```

Pregled u browseru: pokreni bilo koji lokalni server u ovom folderu (npr. `npx serve .`) i otvori `index.html?play`.

Struktura: `index.html` (pozornica) · `src/main.js` (montaža, prelazi) · `src/s1.js`–`src/s5.js` (scene) ·
`src/art.js` (telefon, ček, novčanice, novčići, ikonice, ruka) · `src/bg.js` (pozadine, zrno) · `src/type.js` (kinetička tipografija) · `src/logo.js` (VACKO znak).
Svaki kadar je čista funkcija vremena (`window.film.frame(t)`), pa je render uvek identičan.
