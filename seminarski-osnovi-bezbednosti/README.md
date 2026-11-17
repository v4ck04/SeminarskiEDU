# Seminarski rad: Ranjivost zajednice i posledice opasnosti prirodnog porekla

Predmet: Osnovi bezbednosti (FLV, Novi Sad). Student: Anđela Denić, 27332. Mentor: prof. Marijan Đurovski.

- `Seminarski_rad_Ranjivost_zajednice_Andjela_Denic.docx`: rad za predaju (MS Word).
- `Seminarski_rad_Ranjivost_zajednice_Andjela_Denic_pregled.pdf`: pregled preloma (LibreOffice).

## Pre predaje

1. Upisati osnovni udžbenik iz predmeta (stavka 12 u literaturi, označena žutom bojom).
2. Proveriti titulu mentora (sada: „prof.“) i godinu na naslovnoj strani (sada: 2026).
3. U Word-u kliknuti na sadržaj i pritisnuti F9 (Update Field) ako se brojevi strana razlikuju.

## Format (prema uputstvu FLV)

A4, Times New Roman 12, prored 1,5, margine 2,5 cm, obostrano poravnanje. Naslovi TNR 14 bold, centrirano, velika slova; podnaslovi TNR 12 bold, centrirano. Naslovna strana i sadržaj nisu numerisani. Izvori su u fusnotama na dnu strane, broj fusnote je na kraju rečenice. Strane reči su u kurzivu, a strana imena su u srpskoj transkripciji sa originalom u zagradi. Ukupno 15 strana (naslovna, sadržaj i 13 numerisanih), 11 proverenih izvora i 3 tabele.

## Provera izvora

Svaki citat i podatak proveren je u originalnom dokumentu, sa brojem strane:

| Izvor | Kako je provereno |
|---|---|
| Wisner i dr., *At Risk* (2004) | Pun tekst I dela knjige (PreventionWeb); str. 11, 49–55 |
| UN A/71/644 (2016) | Pun tekst; definicije na str. 13, 14, 18, 22, 24 |
| UNISDR, Okvir iz Sendaja (2015) | Pun tekst; str. 10 i 14 |
| Cardona i dr., IPCC SREX, pogl. 2 (2012) | Pun tekst; str. 67 |
| Cutter i dr. (2003) | Apstrakt (RePEc) i metapodaci (Crossref); str. 242 |
| Adger (2006) | Apstrakt (repozitorijum UEA) i Crossref; str. 268 |
| Cvetković (2017), Vojno delo | Pun tekst (SCIndeks); str. 153, 156, 163, 188 |
| Cvetković (2016), Zbornik MS | Apstrakt (CEEOL) i Crossref; str. 303 |
| Trgovčević i dr. (2020) | Apstrakt i Crossref; str. 1 |
| Vlada RS, *Serbia Floods 2014* | Pun tekst (EK); stranice navedene uz svaki podatak |
| Zakon, Sl. glasnik RS 87/2018 | Pun tekst; čl. 1, 2, 3, 5, 29 |

Napomena: smrtni ishodi navedeni su prema proceni potreba (34, od toga 13 usled utapanja). Kasniji izvori navode veće brojke.

## Ponovna izrada

```
node build.js prolaz1.docx            # pa LibreOffice -> PDF, pages.py -> strane.json
node build.js prolaz2.docx strane.json
python3 tocfield.py prolaz2.docx konacno.docx
```
