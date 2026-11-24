// Tekst seminarskog rada „Republika – primer: Srbija“ (Uvod u pravo).
// Oznake: *kurziv*, [[fn:izvor|strana]] = fusnota (uvek na kraju rečenice).

const meta = {
  fakultet: ["FAKULTET ZA PRAVNE I POSLOVNE STUDIJE", "DR LAZAR VRKATIĆ", "NIŠ"],
  predmet: "Predmet: Uvod u pravo",
  naslov: "REPUBLIKA – PRIMER: SRBIJA",
  mentor: "Boriša Lečić",
  student: "Anđela Denić, 27332",
  mestoGodina: "Niš, 2026.",
};

// Izvori: puni oblik za prvo navođenje, kratki za kasnija.
const izvori = {
  ustav: {
    full: "*Ustav Republike Srbije*, „Službeni glasnik RS“, br. 98/2006 i 115/2021, čl. {p}.",
    short: "*Ustav Republike Srbije*, čl. {p}.",
    unit: "čl.",
  },
  odluka: {
    full: "*Odluka o proglašenju Ustava Republike Srbije*, „Službeni glasnik RS“, br. 98/2006.",
    short: "*Odluka o proglašenju Ustava Republike Srbije*.",
  },
  zpr: {
    full: "*Zakon o predsedniku Republike*, „Službeni glasnik RS“, br. 111/2007, čl. {p}.",
    short: "*Zakon o predsedniku Republike*, čl. {p}.",
    unit: "čl.",
  },
  rik: {
    full: "Republička izborna komisija: *Odluka o utvrđivanju teksta Informacije o Aktu o promeni Ustava Republike Srbije*, 02 broj 014-125/21, Beograd, 3. decembar 2021, tač. {p}.",
    short: "Republička izborna komisija: *Odluka o utvrđivanju teksta Informacije o Aktu o promeni Ustava Republike Srbije*, tač. {p}.",
    unit: "tač.",
  },
  kulic: {
    full: "Kulić, Ž., Kulić, M.: *Uvod u pravo*, Evropski univerzitet Brčko distrikta, Brčko, 2015, str. {p}.",
    short: "Kulić, Ž., Kulić, M.: *Uvod u pravo*, str. {p}.",
  },
  sav: {
    full: "Savanović, A.: *Šta jeste „republikanizam“? Republika kao „forma vlasti“ i republika kao „forma vladavine“*, Politeia, god. 12, br. 24, Banja Luka, 2022, str. {p}.",
    short: "Savanović, A.: *Šta jeste „republikanizam“?*, str. {p}.",
  },
  vrabec: {
    full: "Vrabec, S., Akšamović, L.: *Ustavno-politološke osnove o instituciji državnoga poglavara*, Pravni vjesnik, god. 30, br. 3–4, Osijek, 2014, str. {p}.",
    short: "Vrabec, S., Akšamović, L.: *Ustavno-politološke osnove o instituciji državnoga poglavara*, str. {p}.",
  },
  popovic: {
    full: "Popović, D.: *Glas za parlamentarnu republiku*, Anali Pravnog fakulteta u Beogradu, god. 72, br. 1, Beograd, 2024, str. {p}.",
    short: "Popović, D.: *Glas za parlamentarnu republiku*, str. {p}.",
  },
  pejic19: {
    full: "Pejić, I.: *The Constitutional Rationalization of the Separation of Powers: The Case of Serbia*, Zbornik radova Pravnog fakulteta u Nišu, god. 58, br. 84, Niš, 2019, str. {p}.",
    short: "Pejić, I.: *The Constitutional Rationalization of the Separation of Powers*, str. {p}.",
  },
  pejic25: {
    full: "Pejić, I.: *Neposredan izbor i odgovornost predsednika Republike*, Zbornik radova Pravnog fakulteta u Nišu, god. 64, br. 104, Niš, 2025, str. {p}.",
    short: "Pejić, I.: *Neposredan izbor i odgovornost predsednika Republike*, str. {p}.",
  },
  markovic: {
    full: "Marković, R.: *Ustav Republike Srbije iz 2006 – kritički pogled*, Anali Pravnog fakulteta u Beogradu, god. 54, br. 2, Beograd, 2006, str. {p}.",
    short: "Marković, R.: *Ustav Republike Srbije iz 2006 – kritički pogled*, str. {p}.",
  },
  petr: {
    full: "Petranović, B.: *Istorija Jugoslavije 1918–1988*, knj. 2: *Narodnooslobodilački rat i revolucija 1941–1945*, Nolit, Beograd, 1988, str. {p}.",
    short: "Petranović, B.: *Istorija Jugoslavije 1918–1988*, knj. 2, str. {p}.",
  },
};

// Blokovi teksta: h1, h2, p, table, caption, source
const telo = [
  { h1: "1. UVOD" },
  { p: "Prema oceni iz udžbeničke literature, vreme monarhija uglavnom je prošlo, njihov broj se smanjuje, a i tamo gde su opstale položaj monarha znatno se izmenio u odnosu na ranija vremena.[[fn:kulic|65]] Reč republika, međutim, ne znači isto u svim državama koje je nose u svom nazivu. Republike su bile i Sjedinjene Američke Države, i Francuska, i Sovjetski Savez, i Narodna Republika Kina, pa sama činjenica da država nema monarha malo govori o tome kako se u njoj stvarno vrši vlast.[[fn:sav|56]]" },
  { p: "Predmet ovog rada je republika kao oblik vladavine i njeno ostvarenje u Republici Srbiji. Srbija je republika od 1945. godine, kada je Ustavotvorna skupština ukinula monarhiju i proglasila Federativnu Narodnu Republiku Jugoslaviju,[[fn:petr|477–478]] a važeći Ustav počinje rečima da je Republika Srbija država srpskog naroda i svih građana koji u njoj žive, zasnovana na vladavini prava i socijalnoj pravdi.[[fn:ustav|1]]" },
  { p: "Cilj rada je da odgovori na tri pitanja: po čemu se republika razlikuje od monarhije, u kojim se oblicima organizacije vlasti republika javlja i kakav je model republike usvojen u Srbiji, uz slabosti koje u njemu uočava domaća pravna nauka. U radu su korišćeni normativni metod, analiza sadržaja pravne literature, istorijski i uporedni metod. Izvori obuhvataju udžbenik uvoda u pravo, naučne članke domaćih i regionalnih autora, istorijsku monografiju, Ustav Republike Srbije, Zakon o predsedniku Republike i zvanično obaveštenje Republičke izborne komisije o promeni Ustava iz 2021. godine." },
  { p: "Drugi deo rada određuje pojam republike, treći prikazuje oblike organizacije vlasti u republici, a četvrti razvoj republikanskog uređenja Srbije od 1945. do 2022. godine. Peti deo analizira važeći Ustav, a šesti ocene srpskog modela u domaćoj literaturi." },

  { h1: "2. POJAM I ODLIKE REPUBLIKE" },
  { h2: "2.1. Poreklo i značenje pojma" },
  { p: "Reč republika potiče od latinskog izraza *res publica*, koji se doslovno prevodi kao „javna stvar“. Prema Aleksandru Savanoviću, izraz je nastao kao latinski prevod grčkog pojma *politeia*, a taj prevod se tradicionalno pripisuje Ciceronu (Marcus Tullius Cicero).[[fn:sav|55]] Razvrstavanje država prema obliku vladavine ima još dužu tradiciju. Aristotel je u *Politici* razlikovao šest ustavnih oblika prema broju onih koji vladaju i načinu na koji vladaju, a Nikolo Makijaveli (Niccolò Machiavelli) u prvom poglavlju *Vladaoca* razlikuje republike i kneževine, odnosno monarhije.[[fn:vrabec|193]]" },
  { p: "Najjednostavnije određenje republike je negativno: republika je država koja nije monarhija. U tom smislu republika je sistem vlasti koji svoju moć i legitimitet izvodi od građana, a ne iz nasleđa ili božanskog prava.[[fn:sav|56]] Savanović upozorava da ovakvo određenje ne govori mnogo o stvarnoj raspodeli moći. Zato razlikuje republiku kao formu vlasti od republike kao forme vladavine: mnoge socijalističke republike bile su republike samo po obliku vlasti, a ne i po načinu vladanja, dok pojedine monarhije po načinu vladanja mogu biti primer republikanske vladavine.[[fn:sav|56]] Za pravnu analizu ovo razlikovanje je korisno, jer upućuje na to da se republikanski karakter države ne ocenjuje samo prema tituli šefa države, već i prema tome da li je vlast ograničena, podeljena i odgovorna." },

  { h2: "2.2. Republika i monarhija" },
  { p: "U pravnoj teoriji države se po obliku razvrstavaju prema više merila. Po obliku vladavine, odnosno po organizaciji i položaju šefa države, dele se na monarhije i republike. Po obliku političkog režima dele se na demokratije i autokratije, po obliku državnog uređenja na proste i složene države, a po odnosu zakonodavne, izvršne i sudske vlasti na države zasnovane na podeli vlasti i države zasnovane na jedinstvu vlasti.[[fn:kulic|64]] Iz ove podele sledi da pojam republike odgovara samo na pitanje ko je i kakav je šef države. Da li je država demokratska i kako su raspoređene njene vlasti, posebna su pitanja." },
  { p: "Šef države predstavlja državu u zemlji i inostranstvu, po pravilu komanduje oružanim snagama, stupa u odnose s drugim državama i međunarodnim organizacijama i, pod određenim uslovima, daje pomilovanje.[[fn:kulic|64]] Može biti inokosni ili kolegijalni organ. Kolegijalnog šefa države imala je i Socijalistička Federativna Republika Jugoslavija (SFRJ), u kojoj je tu funkciju do početka devedesetih godina vršilo Predsedništvo, sastavljeno od predstavnika republika i autonomnih pokrajina.[[fn:kulic|65]] Danas je kolegijalni šef države izuzetak, i gotovo jedini primer koji se održao je švajcarsko Savezno veće.[[fn:vrabec|194–195]]" },
  { p: "Jedinstveno merilo za razlikovanje republike i monarhije u teoriji nije utvrđeno. Većina autora kao bitno obeležje monarhije uzima naslednost položaja šefa države, zatim njegovu neodgovornost, a pojedini dodaju doživotnost i nepovredivost ličnosti monarha. Obeležja republike izvode se kao negacija navedenih.[[fn:vrabec|193]] Živko Kulić i Mirko Kulić ključnom razlikom smatraju pravni položaj šefa države: monarh je u principu pravno neodgovoran, a predsednik republike je pravno odgovoran.[[fn:kulic|65]] Oni naglašavaju da se ni u monarhijama redosled nasleđivanja ne poštuje uvek, pa suštinu monarhije više nalaze u pravnoj i političkoj neodgovornosti i velikim privilegijama monarha nego u naslednosti krune.[[fn:kulic|66]]" },
  { p: "Predsednik republike je uvek izborni organ. Može ga birati narod na neposrednim izborima, parlament u redovnom sastavu ili parlament u proširenom sastavu, a mandat mu je ograničen i najčešće traje četiri, pet ili sedam godina.[[fn:kulic|67]] Od ovog pravila postoje istorijski izuzeci. Mletački dužd imao je doživotni mandat, ali je on počivao na odluci građana, pa Savanović zaključuje da dužina mandata nije presudna za republikanski karakter države.[[fn:sav|56]] Domaći primer je Josip Broz Tito, izabran za doživotnog predsednika SFRJ, što je, prema oceni Kulića, više podsećalo na monarhijski nego na republikanski oblik vladavine.[[fn:kulic|67]]" },
  { p: "I pojam neodgovornosti zahteva preciziranje. Kada se govori o neodgovornosti šefa države u parlamentarnim sistemima, misli se na političku neodgovornost. Odgovornost za njegove akte pred predstavničkim telom preuzima resorni ministar ili vlada u celini, putem supotpisa (premapotpisa).[[fn:vrabec|194]] Osnovne razlike između dva oblika vladavine prikazane su u Tabeli 1." },
  { caption: "Tabela 1. Osnovne razlike između monarhije i republike" },
  { table: {
      widths: [2300, 3386, 3385],
      header: ["Obeležje", "Monarhija", "Republika"],
      rows: [
        ["Šef države", "Monarh (kralj, car, knez i sl.)", "Predsednik republike ili kolegijalni organ"],
        ["Dolazak na položaj", "Po pravilu nasleđivanjem, unutar dinastije", "Uvek izborom: neposredno ili u parlamentu"],
        ["Trajanje funkcije", "Po pravilu doživotno", "Ograničen mandat, najčešće 4, 5 ili 7 godina"],
        ["Odgovornost", "Pravno i politički neodgovoran", "Pravno odgovoran; politička odgovornost zavisi od sistema vlasti"],
        ["Izvor legitimiteta", "Tradicija, dinastija, nekada božansko pravo", "Volja građana"],
        ["Podvrste", "Apsolutna, staleška, ustavna, parlamentarna", "Neograničena i ograničena (predsednička, parlamentarna, mešovita)"],
      ],
  } },
  { source: "Izvor: sistematizacija na osnovu: Kulić, Ž., Kulić, M.: Uvod u pravo, str. 64–68; Vrabec, S., Akšamović, L., str. 193–194; Savanović, A., str. 56." },

  { h2: "2.3. Vrste republika" },
  { p: "U pravnoj teoriji razlikuje se više vrsta republika. Kulić i Kulić izdvajaju neograničenu republiku, u kojoj šef države dolazi na vlast ili je proširuje na protivpravan način, što je odlika totalitarnih država i diktatorskog načina vršenja vlasti, i ograničenu republiku, kojoj pripadaju savremene republike. Ograničene republike dalje se dele na predsedničke, u kojima šef države vrši i dužnost šefa vlade, parlamentarne, u kojima pored šefa države postoji i predsednik vlade odgovoran parlamentu, i mešovite, u kojima je vlada odgovorna i parlamentu i šefu države.[[fn:kulic|68]] Ova podela pokazuje da se oblik vladavine i organizacija vlasti prepliću." },

  { h1: "3. OBLICI ORGANIZACIJE VLASTI U REPUBLICI" },
  { p: "Načelo podele vlasti javlja se u tri oblika: kao predsednički, parlamentarni i mešoviti, odnosno predsedničko-parlamentarni sistem.[[fn:kulic|90]] Irena Pejić ističe da „čisti“ oblici podele vlasti više ne postoje ni u tradicionalnim ustavnim državama, dok nove demokratije traže načine da racionalizuju klasični parlamentarizam, često preko polupredsedničkog sistema.[[fn:pejic19|45]]" },
  { h2: "3.1. Predsednička republika" },
  { p: "Predsednički sistem najdoslednije je izveden u Sjedinjenim Američkim Državama, prema Ustavu iz 1787. godine. Zakonodavnu vlast vrši dvodomni Kongres, nosilac izvršne vlasti je predsednik, koga ne bira Kongres već narod posredstvom elektora, a na vrhu sudske vlasti nalazi se Vrhovni sud.[[fn:kulic|90]] Vlasti su razdvojene, ali se međusobno ograničavaju. Predsednik ima suspenzivni veto, koji Kongres može savladati samo dvotrećinskom većinom u oba doma, a Kongres utiče na predsednika preko budžeta, može ga pozvati na odgovornost za izdaju, mito i druga teška krivična dela i utiče na imenovanje kandidata za najviše državne funkcije.[[fn:kulic|91]] U Evropi predsednički sistem gotovo nigde nije prihvaćen. Dragoljub Popović kao noviji izuzetak navodi Tursku.[[fn:popovic|109]]" },
  { h2: "3.2. Parlamentarna republika" },
  { p: "Kolevka parlamentarnog sistema je Engleska. U ovom sistemu zakonodavna vlast pripada parlamentu, a izvršna vlast deli se između šefa države, koji se smatra stabilnim delom izvršne vlasti, i vlade, koja je njen nestabilni deo i koju bira parlament.[[fn:kulic|92]] Vlada ostaje na vlasti dok uživa podršku parlamenta, parlament joj može izglasati nepoverenje, a vlada pod određenim uslovima može šefu države predložiti raspuštanje parlamenta.[[fn:kulic|93]] Suštinu sistema čine ravnopravnost i saradnja zakonodavne i izvršne vlasti, njihov uzajamni uticaj, podela izvršne vlasti između šefa države i vlade i samostalnost sudova.[[fn:kulic|94]]" },
  { p: "Popović izdvaja tri obeležja parlamentarnog sistema: narod ne bira neposredno šefa države, šef države je lišen efektivnih ovlašćenja, a njihov stvarni nosilac je vlada odgovorna parlamentu.[[fn:popovic|109–110]] Šef države se bira u parlamentu, u redovnom sastavu, kao u Grčkoj, ili u proširenom sastavu, kao u Italiji, gde se zajedničkoj sednici domova pridružuju delegati regiona, i u Nemačkoj, gde ga bira Savezni sabor (*Bundesversammlung*), sastavljen od poslanika Bundestaga i jednakog broja članova izabranih u parlamentima pokrajina.[[fn:popovic|111–113]] Popović naglašava i da između parlamentarne republike i parlamentarne monarhije nema suštinske razlike u pogledu uticaja šefa države na političke odluke.[[fn:popovic|115]]" },
  { h2: "3.3. Polupredsednička (mešovita) republika" },
  { p: "Mešoviti sistem nastao je kombinovanjem elemenata predsedničkog i parlamentarnog sistema. Šef države ima široka ovlašćenja, legitimitet stiče neposredno od građana, a samo u pojedinim državama od parlamenta, i nezavisan je i od parlamenta i od vlade.[[fn:kulic|94]] Prvi put je uspostavljen u Francuskoj 1958. godine, a krajem osamdesetih i početkom devedesetih godina prošlog veka preuzele su ga i Rusija, Poljska, Srbija i Hrvatska, svaka uz sopstvene izmene.[[fn:kulic|95]] Prema Popoviću, u polupredsedničkom sistemu birači neposredno biraju šefa države, dok je vlada odgovorna predstavničkom telu, pa oba organa izvode legitimitet neposredno od naroda i nalaze se u istoj ravni.[[fn:popovic|105]]" },
  { p: "Osnovna slabost ovog sistema je mogućnost napetosti između šefa države i vlade, zbog čega se govori o dvoglavoj ili bicefalnoj egzekutivi. Kada se poklope predsednička i parlamentarna većina, sistem u praksi funkcioniše kao predsednički, a kada se razilaze, nastupa kohabitacija, odnosno saradnja predsednika i vlade različitih političkih usmerenja.[[fn:popovic|106–107]] Broj država sa ovim sistemom raste: prema podacima koje navodi Irena Pejić, udeo polupredsedničkih sistema porastao je sa 22% devedesetih godina na 33% 2007. godine. Ona navodi i upozorenje Kristofa Melersa (Christoph Möllers) da u ovom sistemu predsednik postaje utoliko jači ukoliko je parlament slabiji.[[fn:pejic19|50]] Odnos tri oblika republike prikazan je u Tabeli 2." },
  { caption: "Tabela 2. Predsednička, parlamentarna i polupredsednička republika" },
  { table: {
      widths: [2000, 2357, 2357, 2357],
      header: ["Obeležje", "Predsednička", "Parlamentarna", "Polupredsednička"],
      rows: [
        ["Izbor šefa države", "Narod (u SAD posredstvom elektora)", "Parlament u redovnom ili proširenom sastavu", "Neposredno od građana"],
        ["Nosilac izvršne vlasti", "Predsednik, koji je i šef vlade", "Vlada; šef države bez efektivnih ovlašćenja", "Podeljena između predsednika i vlade"],
        ["Odgovornost vlade", "Nema odgovornosti pred parlamentom", "Odgovorna parlamentu", "Odgovorna parlamentu (prema nekim shvatanjima i šefu države)"],
        ["Odnos vlasti", "Stroga podela uz uzajamna ograničenja", "Saradnja i uzajamni uticaj", "Moguća napetost; kohabitacija"],
        ["Primeri", "SAD", "Nemačka, Italija, Grčka", "Francuska (od 1958), Srbija"],
      ],
  } },
  { source: "Izvor: sistematizacija na osnovu: Kulić, Ž., Kulić, M.: Uvod u pravo, str. 68 i 90–95; Popović, D., str. 105–113; Pejić, I. (2019), str. 50 i 53." },

  { h1: "4. RAZVOJ REPUBLIKANSKOG OBLIKA VLADAVINE U SRBIJI" },
  { h2: "4.1. Prelazak iz monarhije u republiku" },
  { p: "Prema Branku Petranoviću, narodnooslobodilački pokret bio je republikanski po duhu, ali se tokom rata nije izričito deklarisao protiv monarhije. Odluka o suspenziji monarhije doneta u Jajcu 1943. godine bila je dovoljna za njeno kasnije ukidanje, a istovremeno je uvažavala obzire prema velikim silama, pre svega prema Velikoj Britaniji, koja je u ime ustavnog kontinuiteta naglašavala monarhijsku tradiciju.[[fn:petr|452]] Na Prvom kongresu Narodnog fronta, u avgustu 1945. godine, Josip Broz Tito je izjavio da monarhija nije moguća u Demokratskoj Federativnoj Jugoslaviji jer je nespojiva s federacijom, narodnom vlašću i demokratijom, a Narodni front je u svom programu najavio da će se zalagati da narod na izborima za Ustavotvornu skupštinu glasa za republikanski oblik vladavine.[[fn:petr|453]]" },
  { p: "Na izbore za Ustavotvornu skupštinu, održane 11. novembra 1945. godine, od 8.383.455 upisanih birača izašlo je 7.432.469, odnosno 88,66%, a savezna lista Narodnog fronta dobila je 6.725.047 glasova. Isti autor beleži da su ponašanje komunista i njihovu jednostranačku volju posle izbora kritikovali čak i pojedini političari iz samog Narodnog fronta.[[fn:petr|477]] Ustavotvorna skupština, sazvana 29. novembra 1945. godine, donela je na predlog 115 poslanika iz Srbije Deklaraciju o proglašenju Federativne Narodne Republike Jugoslavije, kojom je država definisana kao savezna narodna država republikanskog oblika. Time je prestalo namesništvo, monarhija je ukinuta, a kralj Petar II i ostali članovi dinastije Karađorđević lišeni su svih prava.[[fn:petr|477–478]]" },
  { h2: "4.2. Srbija kao republika u jugoslovenskoj federaciji" },
  { p: "Srbija je od tada republika u sastavu jugoslovenske federacije. Vlade federalnih jedinica obrazovane su u aprilu 1945. godine, a na čelu vlade Srbije bio je Blagoje Nešković.[[fn:petr|461]] Republikanski oblik vladavine u ovom periodu nije značio i podelu vlasti. Saveznim ustavom iz 1963. godine SFRJ se opredelila za skupštinski sistem jedinstva vlasti, a po uzoru na švajcarski model takav sistem prihvatilo je i svih šest republika.[[fn:kulic|98]] Funkciju šefa države na saveznom nivou vršilo je kolektivno Predsedništvo,[[fn:kulic|65]] dok je položaj doživotnog predsednika SFRJ odstupao od osnovnog obeležja republike, ograničenog trajanja mandata šefa države.[[fn:kulic|67]]" },
  { h2: "4.3. Ustavi iz 1990. i 2006. godine" },
  { p: "Sa raspadom jugoslovenske federacije početkom devedesetih godina sve republike su donele sopstvene ustave. Ustav Republike Srbije iz 1990. godine trebalo je da uvede sistem zasnovan na podeli vlasti, sa instrumentima za uravnoteženje grana vlasti. Prema Ireni Pejić, ustavna načela su od 1990. do 2000. godine primenjivana u nepovoljnim političkim uslovima,[[fn:pejic19|51]] od 2000. do 2003. godine sistem je imao pretežno parlamentarna obeležja, a posle izbora 2003. i 2004. godine prvi put je funkcionisao u uslovima „mirne“ kohabitacije.[[fn:pejic19|53]] Popović, međutim, smatra da je kohabitacija u pravom smislu postojala samo tokom mandata predsednika Milutinovića, posle pada Slobodana Miloševića s vlasti, dok se koalicione vlade u mandatima kasnijih predsednika ne mogu smatrati kohabitacijom.[[fn:popovic|107]]" },
  { p: "Novi Ustav Narodna skupština je usvojila 30. septembra 2006. godine, konačno je potvrđen na republičkom referendumu održanom 28. i 29. oktobra, a proglašen je 8. novembra 2006. godine.[[fn:odluka|-]] Ustav je stupio na snagu danom proglašenja.[[fn:ustav|206]] Ratko Marković kao jedini objektivan razlog za njegovo donošenje prihvata promenu državnog statusa Srbije, koja je posle istupanja Crne Gore iz državne zajednice Srbije i Crne Gore postala samostalna i suverena država.[[fn:markovic|5 i 7]] Isti autor ističe da je postupak bio maksimalno ubrzan i da se, iako formalnopravnih povreda nije bilo, teško može otkloniti prigovor da je Ustav delo političke nagodbe tri najveće parlamentarne stranke. Po sistematici i osnovnim institutima, prema njegovoj oceni, to je u velikoj meri korigovani Ustav iz 1990. godine.[[fn:markovic|5–6]] Popović dodaje da je i polupredsednički sistem organizacije vlasti preuzet iz prethodnog ustava.[[fn:popovic|105]]" },
  { p: "Ustav je promenjen 2021. godine. Akt o promeni Ustava, o kome su se građani izjašnjavali na referendumu raspisanom za 16. januar 2022. godine, odnosi se isključivo na pravosuđe: menjaju se odredbe o sudovima i javnim tužilaštvima (čl. 142–165), kao i sa njima povezani članovi o podeli vlasti, nadležnosti i načinu odlučivanja Narodne skupštine i sastavu Ustavnog suda. Najviši sud dobio je naziv Vrhovni sud, umesto ranijeg naziva Vrhovni kasacioni sud, a sudije više ne bira Narodna skupština, već isključivo Visoki savet sudstva.[[fn:rik|1, 4 i 5]] Odredbe o predsedniku Republike i Vladi ovom promenom nisu menjane, pa je odnos zakonodavne i izvršne vlasti ostao isti." },

  { h1: "5. REPUBLIKA SRBIJA PREMA VAŽEĆEM USTAVU" },
  { h2: "5.1. Ustavna načela republikanskog uređenja" },
  { p: "Prvi deo Ustava sadrži načela iz kojih se vidi republikanski karakter države. Suverenost potiče od građana, koji je vrše referendumom, narodnom inicijativom i preko svojih slobodno izabranih predstavnika, i nijedan državni organ, politička organizacija, grupa ili pojedinac ne može prisvojiti suverenost od građana niti uspostaviti vlast mimo njihove slobodno izražene volje. Vladavina prava je osnovna pretpostavka Ustava i ostvaruje se, između ostalog, slobodnim izborima, podelom vlasti i nezavisnom sudskom vlašću. Uređenje vlasti počiva na podeli vlasti na zakonodavnu, izvršnu i sudsku, a odnos tri grane vlasti zasniva se na međusobnom proveravanju i ravnoteži. Političke stranke slobodno se osnivaju, ali ne mogu neposredno vršiti vlast niti je sebi potčiniti.[[fn:ustav|2–5]]" },
  { p: "Ova načela pokazuju da Ustav republiku ne svodi na odsustvo monarha. Vlast potiče od građana, ograničena je pravom i podeljena između tri grane. Ustav uređuje i državna obeležja: Republika Srbija ima grb, zastavu i himnu, a himna je svečana pesma „Bože pravde“. Glavni grad je Beograd, u službenoj upotrebi su srpski jezik i ćiriličko pismo, a Srbija je svetovna država u kojoj su crkve i verske zajednice odvojene od države.[[fn:ustav|7 i 9–11]] Državna vlast ograničena je i pravom građana na pokrajinsku autonomiju i lokalnu samoupravu, a Ustav predviđa dve autonomne pokrajine, Vojvodinu i Kosovo i Metohiju.[[fn:ustav|12 i 182]] Ustav je najviši pravni akt, i svi zakoni i drugi opšti akti moraju biti u saglasnosti sa njim.[[fn:ustav|194]]" },
  { h2: "5.2. Narodna skupština" },
  { p: "Narodna skupština je najviše predstavničko telo i nosilac ustavotvorne i zakonodavne vlasti. Čini je 250 narodnih poslanika, koji se biraju na neposrednim izborima, tajnim glasanjem, a njihov mandat traje četiri godine.[[fn:ustav|98, 100 i 102]] Skupština donosi i menja Ustav, donosi zakone, usvaja budžet, odlučuje o ratu i miru, bira Vladu i nadzire njen rad.[[fn:ustav|99]] Pravo predlaganja zakona ima svaki narodni poslanik, Vlada, skupština autonomne pokrajine ili najmanje 30.000 birača, a na zahtev većine svih poslanika ili najmanje 100.000 birača Skupština raspisuje referendum o pitanju iz svoje nadležnosti. Predsednik Republike može raspustiti Skupštinu samo na obrazloženi predlog Vlade, a Skupština se raspušta i ako u roku od 90 dana od konstituisanja ne izabere Vladu.[[fn:ustav|107–109]]" },
  { h2: "5.3. Predsednik Republike" },
  { p: "Predsednik Republike izražava državno jedinstvo Republike Srbije. On predstavlja Republiku u zemlji i inostranstvu, ukazom proglašava zakone, predlaže Narodnoj skupštini kandidata za predsednika Vlade pošto sasluša mišljenje predstavnika izabranih izbornih lista, postavlja i opoziva ambasadore na predlog Vlade, daje pomilovanja i odlikovanja i, u skladu sa zakonom, komanduje Vojskom.[[fn:ustav|111–112]] Zakon o predsedniku Republike dodaje da je predsednik dužan da predloži onog kandidata za predsednika Vlade koji može da obezbedi izbor Vlade.[[fn:zpr|18]] Predsednik može zakon, uz pismeno obrazloženje, vratiti Skupštini na ponovno odlučivanje, ali je dužan da proglasi zakon koji Skupština ponovo izglasa većinom od ukupnog broja poslanika.[[fn:ustav|113]]" },
  { p: "Predsednik se bira na neposrednim izborima, tajnim glasanjem, na pet godina, i niko ne može biti biran više od dva puta.[[fn:ustav|114 i 116]] Predsednik se razrešava zbog povrede Ustava, odlukom Narodne skupštine donetom glasovima najmanje dve trećine poslanika, a Ustavni sud je dužan da u roku od 45 dana odluči o postojanju povrede Ustava.[[fn:ustav|118]] Marković zamera ovoj odredbi da je toliko nejasno formulisana da se iz nje ne vidi da Skupština može razrešiti predsednika samo kada Ustavni sud utvrdi povredu Ustava.[[fn:markovic|19]] Isti autor ističe da je komandovanje Vojskom najjače ovlašćenje predsednika i da njegovi akti ne podležu premapotpisu ministra ili Vlade.[[fn:markovic|18]]" },
  { h2: "5.4. Vlada" },
  { p: "Vlada je nosilac izvršne vlasti. Ona utvrđuje i vodi politiku, izvršava zakone, donosi uredbe radi njihovog izvršavanja, predlaže Skupštini zakone i usmerava rad organa državne uprave.[[fn:ustav|122–123]] Vlada je odgovorna Narodnoj skupštini za politiku Republike Srbije, za izvršavanje zakona i za rad organa državne uprave. Čine je predsednik Vlade, jedan ili više potpredsednika i ministri.[[fn:ustav|124–125]]" },
  { p: "Kandidat za predsednika Vlade iznosi Skupštini program Vlade i predlaže njen sastav, a Vlada je izabrana ako za nju glasa većina od ukupnog broja poslanika. Mandat Vlade traje do isteka mandata Skupštine koja ju je izabrala.[[fn:ustav|127–128]] Najmanje 50 poslanika može podneti interpelaciju u vezi sa radom Vlade ili pojedinog ministra, a glasanje o nepoverenju može zatražiti najmanje 60 poslanika. Nepoverenje je izglasano ako za njega glasa više od polovine svih poslanika.[[fn:ustav|129–130]] Ovi instrumenti predstavljaju parlamentarnu komponentu srpskog sistema, jer Vlada opstaje samo dok uživa poverenje Skupštine." },
  { h2: "5.5. Sudska vlast i Ustavni sud" },
  { p: "Sudska vlast pripada sudovima koji su nezavisni, a sudske odluke donose se u ime naroda. Najviši sud u Republici Srbiji je Vrhovni sud, a zabranjeno je osnivanje prekih, privremenih ili vanrednih sudova. Sudijska funkcija je stalna i traje do navršenja radnog veka.[[fn:ustav|142, 143 i 146]] Ustavni sud je samostalan i nezavisan državni organ koji štiti ustavnost i zakonitost i ljudska i manjinska prava i slobode, a njegove odluke su konačne, izvršne i opšteobavezujuće. Čini ga 15 sudija, koji se biraju i imenuju na devet godina: pet bira Narodna skupština, pet imenuje predsednik Republike, a pet opšta sednica Vrhovnog suda.[[fn:ustav|166 i 172]] U izboru sudija Ustavnog suda tako učestvuju sve tri grane vlasti. Osnovna obeležja najviših organa prikazana su u Tabeli 3." },
  { caption: "Tabela 3. Najviši organi vlasti Republike Srbije prema Ustavu iz 2006. godine" },
  { table: {
      widths: [1900, 2650, 1800, 2721],
      header: ["Organ", "Sastav i izbor", "Mandat", "Odgovornost i prestanak"],
      rows: [
        ["Narodna skupština", "250 poslanika, neposredni izbori, tajno glasanje", "4 godine", "Raspuštanje na predlog Vlade ili ako ne izabere Vladu u roku od 90 dana"],
        ["Predsednik Republike", "Neposredni izbori, tajno glasanje", "5 godina, najviše dva puta", "Razrešenje zbog povrede Ustava, 2/3 poslanika, uz odluku Ustavnog suda"],
        ["Vlada", "Predsednik, potpredsednici i ministri; bira je Skupština većinom svih poslanika", "Do isteka mandata Skupštine", "Odgovorna Skupštini; nepoverenje većinom svih poslanika"],
        ["Ustavni sud", "15 sudija: po 5 bira Skupština, imenuje predsednik Republike i opšta sednica Vrhovnog suda", "9 godina", "Samostalan i nezavisan; odluke konačne i opšteobavezujuće"],
      ],
  } },
  { source: "Izvor: Ustav Republike Srbije, čl. 100, 102, 109, 114, 116, 118, 124–130, 166 i 172." },

  { h1: "6. OCENA SRPSKOG MODELA REPUBLIKE" },
  { p: "Po ustavnom tekstu, Srbija spaja neposredno izabranog predsednika, što je predsednički element, i Vladu odgovornu Narodnoj skupštini, što je parlamentarni element. Zbog toga i Popović i Pejić srpski sistem svrstavaju u polupredsedničke.[[fn:popovic|105]] Pejić, međutim, ukazuje da su ovlašćenja predsednika formalno ograničena, jer je veto samo suspenzivan, a Skupštinu može raspustiti samo na predlog Vlade. Ta ovlašćenja postaju snažan instrument tek kada predsednik ima „svoju“ većinu u parlamentu i „svoju“ Vladu.[[fn:pejic19|53]] U domaćoj literaturi nema saglasnosti o prirodi sistema. Prema prikazu Irene Pejić, Ratko Marković je smatrao da sistem ima spoljna obeležja mešovitog, ali da više teži parlamentarnom, a Darko Simović da je Vlada jedini efektivni i operativni deo izvršne vlasti.[[fn:pejic19|54]]" },
  { p: "Popović smatra da polupredsednički sistem u Srbiji suštinski funkcioniše kao jedna vrsta predsedničkog, zbog skoro potpunog izostanka kohabitacije i hipertrofije predsedničke funkcije. Prema njegovom mišljenju, svi dosadašnji predsednici upuštali su se u utvrđivanje i vođenje politike, koje član 123 Ustava poverava Vladi.[[fn:popovic|107–108]] Slično ocenjuje i Pejić, prema kojoj je reč o polupredsedničkom sistemu u formalnom smislu, koji pod određenim političkim uslovima prelazi u oblik koji Sindi Skač (Cindy Skach) naziva „ustavnom diktaturom“.[[fn:pejic19|54]] U novijem radu dodaje da je Vlada dominirala u predlaganju zakona, a da Skupština nije koristila instrumente koje joj Ustav daje.[[fn:pejic25|28]] Kao poseban problem ističe da se mehanizam razrešenja predsednika teško pokreće, jer konačnu odluku donosi dvotrećinska politička većina čak i kada Ustavni sud utvrdi povredu Ustava.[[fn:pejic25|30]]" },
  { p: "Oba autora predlažu jačanje parlamentarnog elementa. Popović se zalaže za parlamentarnu republiku, u kojoj koncentracija vlasti u jednoj ličnosti ne bi bila moguća.[[fn:popovic|110]] Kao jednu od mogućnosti navodi izbor predsednika u proširenoj Narodnoj skupštini, na primer od 150 poslanika i 50 predsednika opština.[[fn:popovic|114]] Pejić predlaže „parlamentarnog predsednika“, koga bi birala Narodna skupština i koji bi bio neutralni arbitar u odnosima zakonodavne i izvršne vlasti.[[fn:pejic25|30–31]] Ako se neposredni izbor zadrži, o pravnoj odgovornosti predsednika bi, prema njenom predlogu, trebalo da odlučuje Ustavni ili Vrhovni sud.[[fn:pejic19|57]]" },
  { p: "Smatramo da republikanski karakter Srbije u formalnom smislu nije sporan: šef države se bira na ograničeno vreme, odgovara za povredu Ustava, a vlast potiče od građana i podeljena je. Otvoreno je pitanje na koje upozorava Savanović, da li je republika i forma vladavine, a ne samo forma vlasti.[[fn:sav|56]] Ravnoteža vlasti u Srbiji više zavisi od političkog odnosa snaga nego od ustavnog teksta, pa ni promena načina izbora predsednika ne bi bila dovoljna bez doslednije primene instrumenata parlamentarne kontrole." },

  { h1: "7. ZAKLJUČAK", newPage: true },
  { p: "Republika je oblik vladavine u kome se šef države bira, ima ograničen mandat i odgovoran je za svoj rad, a vlast izvodi legitimitet od građana. Ovim se republika razlikuje od monarhije, u kojoj se položaj šefa države po pravilu nasleđuje, traje doživotno i ne povlači pravnu i političku odgovornost. Pojam republike, međutim, odgovara samo na pitanje o položaju šefa države. Kako se vlast stvarno vrši, zavisi od organizacije vlasti, pa savremene republike mogu biti predsedničke, parlamentarne ili polupredsedničke, a između parlamentarne republike i parlamentarne monarhije razlika u uticaju šefa države na politiku gotovo da ne postoji." },
  { p: "Srbija je republika od 29. novembra 1945. godine, kada je Ustavotvorna skupština proglasila Federativnu Narodnu Republiku Jugoslaviju i ukinula monarhiju. U jugoslovenskoj federaciji republikanski oblik vladavine spajao se sa skupštinskim sistemom jedinstva vlasti, kolektivnim šefom države i doživotnim predsednikom federacije. Ustavom iz 1990. godine uvedena je podela vlasti sa neposredno izabranim predsednikom, a Ustav iz 2006. godine, donet posle osamostaljenja Srbije, zadržao je taj model. Promena Ustava iz 2021. godine odnosila se samo na pravosuđe." },
  { p: "Prema važećem Ustavu, Srbija je republika zasnovana na suverenosti građana, vladavini prava i podeli vlasti. Neposredno izabrani predsednik i Vlada odgovorna Narodnoj skupštini čine je polupredsedničkom republikom, iako su ovlašćenja predsednika u ustavnom tekstu ograničena. Domaća pravna nauka ukazuje na raskorak između teksta i prakse: pri poklapanju predsedničke i parlamentarne većine sistem funkcioniše bliže predsedničkom, a Skupština slabi kao kontrolni organ. Zbog toga deo autora predlaže prelazak na parlamentarnu republiku i izbor predsednika u Narodnoj skupštini." },
  { p: "Rad je pokazao da se republika ne može oceniti samo prema obliku. Pitanje da li je jedna država republika ima jasan odgovor u ustavnom tekstu, dok pitanje koliko je ona republikanska zavisi od toga da li se ustavna ograničenja vlasti poštuju u praksi. Ograničenje rada je u tome što se oslanja na normativnu analizu i stavove iz literature, bez empirijskog istraživanja rada Narodne skupštine. Dalja istraživanja mogla bi da uporede koliko su interpelacija, glasanje o nepoverenju i suspenzivni veto stvarno korišćeni od donošenja Ustava iz 2006. godine." },
];

const literatura = [
  "Kulić, Ž., Kulić, M.: *Uvod u pravo*, Evropski univerzitet Brčko distrikta, Brčko, 2015.",
  "Marković, R.: *Ustav Republike Srbije iz 2006 – kritički pogled*, Anali Pravnog fakulteta u Beogradu, god. 54, br. 2, Beograd, 2006, str. 5–46.",
  "*Odluka o proglašenju Ustava Republike Srbije*, „Službeni glasnik RS“, br. 98/2006.",
  "Pejić, I.: *The Constitutional Rationalization of the Separation of Powers: The Case of Serbia*, Zbornik radova Pravnog fakulteta u Nišu, god. 58, br. 84, Niš, 2019, str. 45–62, DOI: 10.5937/zrpfn0-23999.",
  "Pejić, I.: *Neposredan izbor i odgovornost predsednika Republike*, Zbornik radova Pravnog fakulteta u Nišu, god. 64, br. 104, Niš, 2025, str. 15–36, DOI: 10.5937/zrpfn1-57621.",
  "Petranović, B.: *Istorija Jugoslavije 1918–1988*, knj. 2: *Narodnooslobodilački rat i revolucija 1941–1945*, Nolit, Beograd, 1988.",
  "Popović, D.: *Glas za parlamentarnu republiku*, Anali Pravnog fakulteta u Beogradu, god. 72, br. 1, Beograd, 2024, str. 105–122, DOI: 10.51204/Anali_PFBU_24105A.",
  "Republička izborna komisija: *Odluka o utvrđivanju teksta Informacije o Aktu o promeni Ustava Republike Srbije*, 02 broj 014-125/21, Beograd, 3. decembar 2021, dostupno na: https://www.rik.parlament.gov.rs/extfile/sr/11646/odluka%20o%20informaciji%20o%20aktu%20za%20promenu.doc (pristupljeno 24.11.2026).",
  "Savanović, A.: *Šta jeste „republikanizam“? Republika kao „forma vlasti“ i republika kao „forma vladavine“*, Politeia, god. 12, br. 24, Banja Luka, 2022, str. 51–80, DOI: 10.5937/politeia0-41326.",
  "*Ustav Republike Srbije*, „Službeni glasnik RS“, br. 98/2006 i 115/2021.",
  "Vrabec, S., Akšamović, L.: *Ustavno-politološke osnove o instituciji državnoga poglavara*, Pravni vjesnik, god. 30, br. 3–4, Osijek, 2014, str. 191–205.",
  "*Zakon o predsedniku Republike*, „Službeni glasnik RS“, br. 111/2007.",
];

// Sve stavke literature su potvrđene; nema stavki za dopunu.
const dopuna = null;

module.exports = { meta, izvori, telo, literatura, dopuna };
