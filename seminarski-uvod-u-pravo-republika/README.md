# Seminarski rad: Republika – primer: Srbija

Predmet: Uvod u pravo. Student: Anđela Denić, 27332. Mentor: Boriša Lečić. Fakultet: Fakultet za pravne i poslovne studije dr Lazar Vrkatić, Niš. Mesto i godina: Niš, 2026.

- `Seminarski_rad_Republika_Srbija_Andjela_Denic.docx`: rad za predaju (MS Word).
- `Seminarski_rad_Republika_Srbija_Andjela_Denic_pregled.pdf`: pregled preloma (LibreOffice).

## Pre predaje

U Word-u kliknuti na sadržaj i pritisnuti F9 (Update Field) ako se brojevi strana razlikuju.

Zvanje mentora nije navedeno jer nije bilo poznato (na internetu nije pronađeno). Po potrebi dopisati ga na naslovnoj strani (npr. „prof. dr“ ili „doc. dr“).

## Format (isti kao rad „Ranjivost zajednice…“, FLV)

A4, Times New Roman 12, prored 1,5, margine 2,5 cm, obostrano poravnanje. Naslovi TNR 14 bold, centrirano, velika slova; podnaslovi TNR 12 bold, centrirano. Naslovna strana i sadržaj nisu numerisani, a zaključak i literatura počinju na posebnoj strani. Izvori su u fusnotama na dnu strane, broj fusnote je na kraju rečenice. Strane reči su u kurzivu, a strana imena su u srpskoj transkripciji sa originalom u zagradi. Ukupno 15 strana (naslovna, sadržaj i 13 numerisanih), 12 jedinica literature, 3 tabele i 85 fusnota.

## Provera izvora

Svaki citat i podatak proveren je u originalnom dokumentu, sa brojem strane ili člana:

| Izvor | Kako je provereno |
|---|---|
| Ustav RS, Sl. glasnik RS 98/2006 i 115/2021 | Pun tekst (paragraf.rs, prečišćen tekst); čl. 1–12, 98–146, 166, 172, 182, 194, 206 |
| Odluka o proglašenju Ustava RS (98/2006) | Pun tekst; datumi usvajanja, referenduma i proglašenja |
| Zakon o predsedniku Republike (111/2007) | Pun tekst; čl. 18 |
| RIK, Informacija o Aktu o promeni Ustava (2021) | Pun tekst dokumenta RIK; tač. 1, 4 i 5 |
| Kulić i Kulić, *Uvod u pravo* (2015) | Pun tekst udžbenika (EU Brčko); str. 64–68, 90–95, 98 |
| Savanović (2022), Politeia | Pun tekst i Crossref; str. 55–56 |
| Vrabec i Akšamović (2014), Pravni vjesnik | Pun tekst (Hrčak); str. 193–195 |
| Popović (2024), Anali PF Beograd | Pun tekst i Crossref; str. 105–115 |
| Pejić (2019), Zbornik PF Niš 84 | Pun tekst i Crossref; str. 45, 50–57 |
| Pejić (2025), Zbornik PF Niš 104 | Pun tekst i Crossref; str. 28–31 |
| Marković (2006), Anali PF Beograd | Pun tekst; str. 5–7, 18–19 |
| Petranović, *Istorija Jugoslavije 1918–1988*, knj. 2 | Pun tekst poglavlja „Proglašenje republike“ (znaci.org), str. 452–478; izdavač i godina (Nolit, 1988) potvrđeni u katalogu Open Library |

Napomene:

- Stavovi Popovića i Pejić o praksi predsedničke funkcije u Srbiji navedeni su kao ocene autora, sa izvorom, a ne kao utvrđene činjenice.
- O kohabitaciji posle 2000. godine autori se razilaze (Pejić: prva „mirna“ kohabitacija posle izbora 2003/2004; Popović: kohabitacija samo u mandatu predsednika Milutinovića), pa su navedena oba stava.

## Ponovna izrada

```
node build.js prolaz1.docx            # pa LibreOffice -> PDF, pages.py -> strane.json
node build.js prolaz2.docx strane.json
python3 tocfield.py prolaz2.docx konacno.docx
```
