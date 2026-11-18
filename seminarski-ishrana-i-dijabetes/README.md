# Seminarski rad: Ishrana i dijabetes

VZŠ „Visan“, Beograd. Predmet: Ishrana i dijetetika. Student: Aleksandra Đurić, 75-II.

- `Aleksandra Djuric - Ishrana i dijabetes.docx`: rad u Word formatu.
- `Aleksandra Djuric - Ishrana i dijabetes.pdf`: rad u PDF formatu (Vodič preporučuje PDF za predaju).

## Pre predaje

1. Upisati mentora na naslovnoj strani (zvanje, titula, ime i prezime; označeno žutom bojom).
2. Naslov mejla prema Vodiču: `Ishrana i dijetetika, Aleksandra Djuric, 75-II, Ishrana i dijabetes`.

## Format (prema Vodiču VZŠ „Visan“)

Logo škole (`logo-visan.png`) je na naslovnoj strani. Ćirilica, Times New Roman 12, prored 1,5, margine 2,5 cm, obostrano poravnanje. Naslovna strana i sadržaj nisu numerisani; numeracija počinje od Uvoda, u donjem desnom uglu. Slika ima naziv i izvor ispod (12 pt i 11 pt, kurziv), a tabela naziv iznad i izvor ispod. Citiranje je u obliku (Autor, godina), a literatura je navedena azbučnim redom, u originalnom pismu. Rad je pisan u trećem licu. Ukupno 9 strana, 10 izvora, 1 slika i 1 tabela.

## Provera izvora

| Izvor | Kako je provereno |
|---|---|
| WHO, Diabetes (fact sheet, ažuriran 11.11.2026) | Pun tekst stranice |
| Evert et al. (2019), Diabetes Care | Pun tekst (Europe PMC, PMC7011201) |
| Jenkins et al. (1981), Am J Clin Nutr | Apstrakt i metapodaci (PubMed) |
| Knowler et al. (2002), NEJM | Apstrakt i metapodaci; podaci za Sliku 1 |
| Lean et al. (2018), Lancet | Apstrakt i metapodaci |
| Radna grupa za izradu vodiča (2005) | Pun tekst nacionalnog vodiča (AZUS) |
| Ракочевић и сар. (2022), Institut „Batut“ | Pun tekst izveštaja; godina izdanja prema metapodacima PDF-a |
| Reynolds et al. (2019), Lancet | Apstrakt i metapodaci |
| Salas-Salvadó et al. (2011), Diabetes Care | Apstrakt i metapodaci |
| Tuomilehto et al. (2001), NEJM | Apstrakt i metapodaci |

## Ponovna izrada

```
python3 slika1.py
node build.js prolaz1.docx            # pa LibreOffice -> PDF, pages.py -> strane.json
node build.js prolaz2.docx strane.json
python3 tocfield.py prolaz2.docx konacno.docx
```
