# Seminarski rad: Enteralna i parenteralna ishrana

VZŠ „Visan“, Beograd. Predmet: Ishrana i dijetetika. Student: Aleksandra Đurić, 75-II. Mentor: Prof. dr Snežana Pakić.

- `Aleksandra Djuric - Enteralna i parenteralna ishrana.docx`: rad u Word formatu.
- `Aleksandra Djuric - Enteralna i parenteralna ishrana.pdf`: rad u PDF formatu.

Naslov mejla prema Vodiču: `Ishrana i dijetetika, Aleksandra Djuric, 75-II, Enteralna i parenteralna ishrana`.

## Format (prema Vodiču VZŠ „Visan“)

Logo škole na naslovnoj strani. Ćirilica, Times New Roman 12, prored 1,5, margine 2,5 cm, obostrano poravnanje. Naslovna strana i sadržaj nisu numerisani; numeracija od Uvoda, dole desno. Slika i tabela sa nazivom i izvorom. Citiranje (Autor, godina), literatura azbučnim redom u originalnom pismu, rad u trećem licu. Ukupno 9 strana, 13 izvora, 1 slika i 1 tabela.

## Provera izvora

| Izvor | Kako je provereno |
|---|---|
| Cederholm et al. (2017), ESPEN definicije | Pun tekst (espen.org) |
| Bischoff et al. (2020), ESPEN kućna enteralna ishrana | Pun tekst (espen.org) |
| Pironi et al. (2020), ESPEN kućna parenteralna ishrana | Pun tekst (espen.org) |
| Singer et al. (2023), ESPEN ishrana u intenzivnoj nezi | Pun tekst (espen.org) |
| Krznarić (2006), Medicus | Pun tekst (Hrčak) |
| Kondrup et al. (2003), NRS 2002 | Apstrakt i metapodaci (PubMed) |
| Cederholm et al. (2019), GLIM | Apstrakt i metapodaci |
| Gauderer et al. (1980), PEG | Apstrakt i metapodaci |
| Dudrick et al. (1968) | Metapodaci; navodi se samo ono što piše u naslovu rada |
| Harvey et al. (2014), CALORIES | Apstrakt i metapodaci; podaci za Sliku 1 |
| Reignier et al. (2018), NUTRIREA-2 | Apstrakt i metapodaci; podaci za Sliku 1 |
| Casaer et al. (2011), EPaNIC | Apstrakt i metapodaci |
| da Silva et al. (2020), ASPEN sindrom ponovnog hranjenja | Apstrakt i metapodaci |

## Ponovna izrada

```
python3 slika1.py
node build.js prolaz1.docx            # pa LibreOffice -> PDF, pages.py -> strane.json
node build.js prolaz2.docx strane.json
python3 tocfield.py prolaz2.docx konacno.docx
```
