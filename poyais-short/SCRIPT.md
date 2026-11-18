# He Sold a Country That Didn't Exist — script, sources and posting

A true-story short for **Vacko | Money Stories**: Gregor MacGregor and the Poyais scheme (London 1822, the Black River
coast of present-day Honduras 1823). Vertical 1080x1920, 30 fps, 55.0 s (1650 frames). The London river world of the
other shorts; a painted jungle backdrop stands in for the coast. Voice am_fenrir (1.22), 169 words.

## Facts (sources)
- MacGregor, a Scottish soldier of the South American wars, presented himself in London from 1821-22 as "Cazique"
  (prince) of Poyais; a guidebook by "Captain Thomas Strangeways" (a pseudonym) praised the country; Poyais money was
  printed; land was sold; about £200,000 of Poyais bonds were sold in autumn 1822 at 6 %:
  [The Hustle](https://thehustle.co/the-con-artist-who-sold-rich-investors-a-fake-country).
- Two ships, the Honduras Packet (London, Sept 1822, ~70 settlers) and the Kennersley Castle (Leith, Jan 1823, ~200),
  found only jungle; most settlers died (over 180), fewer than 50 returned to Britain:
  [Kennersley Castle (Wikipedia)](https://en.wikipedia.org/wiki/Kennersley_Castle_(1811_ship)),
  [Amusing Planet](https://www.amusingplanet.com/2025/05/the-poyais-scam-nation-that-never-was.html).
- He fled to France, tried to sell Poyais again there, was tried in Paris and acquitted (1826), and later retired to
  Venezuela. The settlers had exchanged their pounds for Poyais money (The Hustle).

## Script
1. In eighteen twenty-two, a Scottish soldier sold London a country that did not exist. — MacGregor on the stage holding up the map of Poyais, the crowd delighted
2. It was called Poyais. — flash; close on him and the map
3. Gregor MacGregor arrived calling himself its prince. Poyais, he said, had rich land, rivers full of fish, and a capital with a theater. — a dream bubble fills in: land, fish, the theater
4. There was even a guidebook, by a Captain Thomas Strangeways. There was no Captain Strangeways. — he holds up the guidebook; a grin
5. He printed Poyais money. He sold Poyais land. Then he sold Poyais bonds. Two hundred thousand pounds of them. — a banknote, the map, a bond; money bags fly to him
6. And people started packing. — the town walks off with its bags
7. Two ships of settlers sailed for Central America. — a sailing ship on the river
8. They found no capital. No theater. No town. Just jungle. — flash; the settlers on a jetty before a wall of jungle, pull back
9. Luckily, they had brought plenty of Poyais money. Unluckily, nobody had ever heard of it. — a settler holds the note up proudly, then lowers it
10. Most of them never came home. — dusk: the empty jetty, a barrel, a basket, a bag
11. Why did it work? Nobody could check. It's like buying a house from photos. The nicer the pictures, the fewer the questions. — MacGregor with a framed picture of a house; the question marks over the crowd vanish as it gets nicer
12. When the news reached London, MacGregor was in France, selling Poyais again. — sunset, the French flag, a new crowd, the same map
13. He was put on trial, and walked free. — between two guards; he strolls away waving
14. The best lie is a place nobody can visit. — crane up over the river, a ship sailing off

Mix -14.2 LUFS, true peak -1.5 dBTP (measured, not listened to).

## Render (cmd, drive D)
```
cd /d D:\Projekti\SeminarskiEDU
git stash
git pull
cd finance-short
set TEMP=D:\remotion-tmp
set TMP=D:\remotion-tmp
npx remotion render src/index.ts PoyaisShort D:\Videi\poyais-short.mp4 --codec h264 --crf 17 --gl=angle
```

## Posting
**Title:** He Sold a Country That Didn't Exist

**Description:**
```
In 1822, Gregor MacGregor sold London a country that didn't exist: Poyais. A guidebook, banknotes, land and
£200,000 of bonds, and two ships of settlers who found only jungle. The best lie is a place nobody can visit.

#shorts #history #scam #moneystories #poyais
```
**Tags:** Gregor MacGregor, Poyais, Poyais scheme, fake country, biggest scam in history, history short, con artist,
financial fraud, bond scam, money story, animated history, vacko money
