# Seminarski rad: Analiza i unapređenje kvaliteta usluge dostave hrane – primer kompanije Wolt

BAPUSS, predmet Menadžment kvaliteta. Student: Veljko Pavlović, 1B1/0057/25. Mentor: Prof. dr Zorana Antić.

Format po Uputstvu za izradu seminarskih radova (BAPUSS): A4, margine 2,5 cm, prored 1, Times New Roman 12, izvori u fusnotama, literatura po abecednom redu, izvori ispod slika i tabela fontom 10. Ukupno 15 strana, 16 izvora, 4 slike i 4 tabele.

## Predaja

Prema obaveštenju na stranici predmeta: rad se predaje u terminu konsultacija, najkasnije 14. januara 2027. (14–16.30 h, kabinet 240), a odobreni radovi se prezentuju na vežbama najkasnije 15. i 16. januara 2027.

## Struktura (po obrascu „Mini projekat“ iz udžbenika, str. 301–304)

Uvod; teorijski okvir (ISO 9000:2015, principi menadžmenta kvalitetom, SERVQUAL, istraživanja dostave hrane); Mini projekat: projektni tim i zadatak, opis organizacije, Faza 1 (1a–1v), Faza 2 (2a–2g), Faza 3 (3a–3v), Faza 4; zaključak; literatura. Odgovori na stavke upisani su u okvire, kao u obrascu.

Faza 2 (istraživanje na terenu) je, po dogovoru, zamenjena analizom javno dostupnih ocena i recenzija (App Store Srbija, Google Play, Trustpilot), prikupljenih 18.11.2026, uz navedena ograničenja.

## Provera izvora

| Izvor | Kako je provereno |
|---|---|
| Antić, Z. (2022), Menadžment kvaliteta, BAPUSS | Obavezna literatura na zvaničnoj stranici predmeta (bpa.edu.rs, šk. 2026/27); obrazac str. 301–304 |
| ISO 9000:2015 | Pun tekst (law.resource.org); tačke 2.3, 3.6.2, 3.6.4, 3.6.9, 3.9.2, 3.9.3, 3.12.2, 3.12.3 |
| Parasuraman et al. (1985) | Apstrakt i metapodaci (Crossref, Semantic Scholar) |
| Parasuraman et al. (1988), SERVQUAL | Metapodaci (više nezavisnih kataloga), dimenzije i broj tvrdnji |
| Ray et al. (2019); Kapoor & Vij (2018); Koay et al. (2022); Suhartanto et al. (2019) | Apstrakti i metapodaci (Crossref, Semantic Scholar) |
| Wolt (2022), saopštenje o DoorDash-u | Pun tekst (press.wolt.com) |
| Wolt (2025), uslovi korišćenja za Srbiju (ažurirano 30.06.2025) | Pun tekst; tačke 1, 3.2, 5.4, 6, 7.4, 7.5, 10.1, 14.2–14.4 |
| Wolt (2026), Wolt+ Srbija | Pun tekst stranice |
| Zakon o zaštiti potrošača, Sl. glasnik RS 35/2026 | Pun tekst (paragraf.rs); čl. 63, 100–103 |
| App Store (Srbija), Google Play | Stranice aplikacije, 18.11.2026 (ocena, broj ocena, prikazane recenzije) |
| Trustpilot (wolt.com) | Stranica profila, 18.11.2026 (zbirna ocena, raspodela, prikazane recenzije) |

## Slike

- Slika 1 (`slika_tok.png`): tok usluge i učesnici – crtež autora (`dijagrami.py`).
- Slika 2 (`slika1.png`): prosečne ocene na tri platforme (`slika1.py`).
- Slika 3 (`slika2.png`): tri recenzije sa App Store-a (Srbija), snimak ekrana 18.11.2026; korisnička imena i promotivni kod uklonjeni.
- Slika 4 (`slika_ishikawa.png`): dijagram uzroka i posledice za zakašnjelu ili hladnu porudžbinu (`dijagrami.py`).

## Презентација (10 слајдова)

Урађена у Canva шаблону „White and Black Modern Financial Report“ (PPTX извоз из Canva-е који је послао корисник).
Слајдови одговарају на питања из обрасца мини пројекта:

| Слајд | Садржај |
|---|---|
| 1 | Насловни слајд |
| 2 | Увод: предмет, циљ, извори података |
| 3 | Фаза 1: 1а, 1б, 1в |
| 4 | Фаза 2: 2а (оцене корисника, графикон) |
| 5 | Фаза 2: 2б, 2в (тачност информација, рецензија) |
| 6 | Фаза 2: 2г (процена по моделу SERVQUAL) |
| 7 | Фаза 3: 3а, 3б (табела поређења) |
| 8 | Фаза 3: 3в (усаглашеност и рекламације) |
| 9 | Фаза 4: Ишикава дијаграм и корективне мере |
| 10 | Закључак и захвалница |

- `Veljko Pavlovic - Wolt prezentacija.pptx` – PowerPoint, са белешкама за излагање испод сваког слајда
- `Veljko Pavlovic - Wolt prezentacija.pdf` – иста презентација као PDF (10 страна)
- `prezentacija_slike.py`, `prezentacija_ikone.js` – припрема слика (графикон, исечци рецензија, иконе) у директоријум `assets/`
- `prezentacija_sablon.py` – попуњава шаблон, мења фонт у Inter (Canva фонтови из шаблона немају ћирилицу) и ређа слајдове

Поновна израда (из радног директоријума у коме је `assets/`):

```bash
python3 prezentacija_slike.py 1.9398 1.9151
NODE_PATH=<node_modules са react, react-dom, react-icons, sharp> node prezentacija_ikone.js
python3 prezentacija_sablon.py <sablon.pptx> assets "Veljko Pavlovic - Wolt prezentacija.pptx"
LANG=sr_RS.UTF-8 soffice --headless --convert-to pdf "Veljko Pavlovic - Wolt prezentacija.pptx"
```

PDF садржи уграђен фонт Inter. Ако се PPTX отвара на рачунару без фонта Inter (бесплатан, Google Fonts), PowerPoint ће га заменити сличним фонтом.

## Белешке за одбрану

- `Veljko Pavlovic - Beleske za odbranu.pdf` – текст за сваки слајд, бројеви, појмови и могућа питања са одговорима (9 страна, A4); извоз документа https://claude.ai/artifact/Nc6WMrwnkgc56ELN4KEzih
- `Veljko Pavlovic - Sta reci na svakom slajdu.pdf` – само текст за излагање по слајдовима (2 стране, A4), без имена аутора
