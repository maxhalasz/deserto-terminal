/* ===================== Jornal: mais páginas internas (f3-04) =====================
   Seis layouts novos de página interna, SOMADOS aos 12 que já existiam. Este arquivo só acrescenta:
   não edita NEWS_PRESETS / NEWS_DEFAULTS / NEWS_PRESET_ORDER já definidos em news-engine.js, apenas
   registra chaves novas (se uma chave já existir, avisa no console e NÃO sobrescreve). Assim documento
   salvo com os layouts antigos abre idêntico, e o texto padrão dos antigos não muda.
   Os ids entram no seletor "Tipo da nova página" e nos botões "Páginas internas" sozinhos (doc-pages.js e
   editor.js leem NEWS_PRESET_ORDER); como são acrescentados no FIM da lista, a ordem dos botões antigos
   não muda. Numeração das páginas: A2 cidade, B2 reportagem, B3 agenda, B4 passatempos, C1 negócios,
   C2 anúncios (o índice "INSIDE" da capa continua como estava; quem quiser edita o texto).
   Fonte monoespaçada (calendário e caça-palavras): IBM Plex Mono, carregada por ensureFonts antes de montar. */

const NEWS_FONT_MONO = ["500 16px 'IBM Plex Mono'"];

const _NEWS2_DEFAULTS = {
  /* ---- A2 · Cidade e delegacia ---- */
  'tn.band': 'AROUND TOWN',
  'tn1.kicker': 'LOCAL NEWS', 'tn1.headline': 'Harbor School sends pupils home at noon',
  'tn1.deck': 'Teachers say the children hummed one note at recess. The principal says there is no cause for concern.', 'tn1.byline': 'By Dale Hennessey',
  'tn1.body': 'The Harbor School closed early on Wednesday after the thirty-one pupils in attendance stopped playing at the noon recess and stood in the yard. Teachers said the children were not frightened. “They were listening,” said Miss Calloway, who has taught the upper form for nineteen years.\n' +
    'The principal, Mr. Thaddeus Finch, said the pupils had been humming a single note for several minutes before the bell. He said the note was “not a tune” and that it stopped when the bell was rung. The bell, according to the school janitor, was not rung.\n' +
    'Parents were called at 12:10. Twenty-nine children were collected within the hour. The two who were not collected were walked home by Miss Calloway, who said their houses were “quiet, and not empty.”\n' +
    'Dr. Anna Voss examined six pupils at the mainland clinic on Wednesday afternoon and found nothing wrong. She said each of them asked her the same question: whether she could hear it too. She said she could not, and asked that this be printed.\n' +
    'Classes will resume Monday. Mr. Finch asked parents to keep children away from the lower shore road and to see that they sleep with the window closed. Asked why, he said it was “a matter of draughts.”',
  'photo.7.cap': 'The yard of the Harbor School at noon on Wednesday. The children are facing the water. Photo: a parent',
  'blot:title': 'SHERIFF’S BLOTTER',
  'blot': 'Mon 11, 21:40. Resident reports lights on the water. Deputy finds boats.\n' +
    'Tue 12, 03:12. Caller on Harbor Street reports knocking at an upstairs window, from outside. No ladder found. No marks on the wall.\n' +
    'Tue 12, 03:12. A second caller reports the same window. The first caller lives alone.\n' +
    'Wed 13, 02:00. Dog barking at the pier. Dog found, not barking, facing the water.\n' +
    'Thu 14, 03:12. Seven calls from the pier telephone in one minute. No voice on the line. The telephone is not connected.',
  'tn.brief:title': 'TOWN BRIEFS',
  'tn.brief': 'Library. Closed Friday. The book drop was emptied overnight by someone other than the librarian.\n' +
    'Ferry. The ticket office sold seven tickets Monday. No passengers boarded.\n' +
    'Dance. The Legion hall dance is moved to Saturday. The band has stopped practicing the last song and asks that no one request it.\n' +
    'Lamps. Harbor Street lamps will be lit at four o’clock until further notice.\n' +
    'Lost property. Eleven umbrellas, one oar, and a child’s drawing of a long room.',
  'tn.pq': '“I counted the children twice. I counted them a third time. Then I stopped counting.”\n— Teacher, name withheld',
  'tn2.headline': 'Salt found in the Harbor Street well', 'tn2.byline': 'Staff',
  'tn2.body': 'The Harbor Street public well tested salty on Tuesday, the water board announced, for the second time in a month. Harbor Board chair Edward Pruitt said the well “is not connected to the sea” and that the reading was the fault of the instrument.\n' +
    'The instrument was replaced on Wednesday. The second instrument gave the same reading. The board has asked residents not to draw water after dark and has recommended that the pump be run only in daylight, “as a courtesy.”\n' +
    'Residents say the water tastes of nothing before dawn and of salt at night. A woman who lives beside the well said it has also begun to make a sound, “like somebody saying a name under the stones.”',
  'tn3.headline': 'Library book returned after fifty years', 'tn3.byline': 'Staff',
  'tn3.body': 'A copy of The Diver’s Handbook, checked out of the Harbor Library in 1974, was returned on Monday morning by someone who left it in the book drop. The librarian, Miss Hester Crane, said the due slip carried a name that does not match any member of the library’s register.\n' +
    'The book is in good condition. A page near the back has been folded down. Miss Crane said it is the page on decompression and that she has not read it. A fine of $4,380 has been assessed. The library asks the borrower to come forward and says the fine will be forgiven if the borrower comes before dark.',
  'ad.11:title': 'ALDOUS & SON', 'ad.11': 'Funeral directors. Open at all hours. We have never turned anyone away.',
  'ad.12:title': 'THE HARBOR CAFE', 'ad.12': 'Pie and coffee until nine. A chair is always kept for the regular.',
  'ad.13:title': 'THE HARBOR CLOCK', 'ad.13': 'Repairs and winding. The clock runs eleven minutes slow. We have not been asked to correct it.',

  /* ---- B2 · Reportagem especial ---- */
  'ft.band': 'FEATURE',
  'ft.kicker': 'SPECIAL FEATURE', 'ft.headline': 'Seventy years on the water',
  'ft.deck': 'The platform came to this town in 1954 and brought work, money and a new sound at night. Residents remember each of them differently.', 'ft.byline': 'By Dale Hennessey',
  'photo.8.cap': 'The platform being towed into position, May 1954. The man at the left edge of the frame has never been identified. Photo: Harbor Office archive',
  'ft.body': 'When the platform was towed into position in the spring of 1954, the town turned out on the quay to watch. Children were let out of school. The Legion band played. Old men who had fished the bank for fifty years stood with their caps in their hands and said it looked like a church put to sea.\n' +
    'It brought work. By autumn the Harbor Office had hired sixty riggers, forty deckhands and a cook. By the following spring the town had a second bakery, a second doctor and a street of lodging houses that did not stay empty. The platform paid on Fridays. The taverns on Quay Lane stayed open until the last supply boat had gone.\n' +
    'It also brought a sound. The first rigger to hear it, a man named Odd Halvorsen, said it began on the third night, a long low note under the floor of the bunkhouse. He asked the foreman about it. The foreman said it was the pumps. The pumps, according to the foreman’s own logbook, were not running.\n' +
    'By 1957 the sound had a name in the town, though not an official one. Fishermen called it the hymn. Mothers told their children it was the sea clearing its throat. The platform’s own crew, interviewed for this article, said it was nothing at all and asked that their names not be used.\n' +
    'In 1974 the crew gave a dinner for the families of the town. Forty-three sat down at forty-two places. In 1986 the lower deck was sealed after an inspection, and unsealed the following spring without explanation. The inspector’s report, requested by this newspaper, was found to contain a page headed “Findings” and no other text.\n' +
    'The foghorn was automated in 1999 and its keeper pensioned off. He is said to have stayed on in the lamp house for two more winters, and to have sounded the horn by hand at 03:12 each night, as a courtesy. The harbor log records the horn every night. The keeper’s signature does not appear.\n' +
    'Few residents will say they are afraid. Most say they are used to it. A woman on Church Lane, who asked that her house not be described, said the town learned long ago to sleep with its ears covered and to count the people at the table before eating. “We are not afraid,” she said. “We are careful.”\n' +
    'Asked whether the platform’s operator knew about the sound, a company spokesman said the platform was “fully inspected and in good order.” Asked who had inspected it, he said he would find out and call back. He has not called back.',
  'tl:title': 'THE PLATFORM, YEAR BY YEAR',
  'tl': '1954|Towed into position\n1957|First oil\n1963|Harbor lamps lit nightly\n1974|Dinner at the Legion hall\n1986|Lower deck sealed\n1987|Lower deck reopened\n1999|Foghorn automated\n2008|Night shift extended\nThis week|Contact lost, 03:12',
  'pq3': '“We are not afraid. We are careful.”\n— Resident, Church Lane',
  'nums:title': 'BY THE NUMBERS',
  'nums': 'Years in service|70\nCrew on the company roster|42\nCrew counted from the pier|43\nDivers listed|6\nFigures on the loading dock|7\nHours of silence|30',
  'ad.14:title': 'ST. BRENDAN’S', 'ad.14': 'Evening prayer daily at dusk. The doors close at dark. Please do not knock after.',
  'ad.15:title': 'HARBOR OFFICE', 'ad.15': 'Passes for the supply boat issued weekdays, 8 to 4. Return passes issued on request.',
  'ad.16:title': 'THE LAMP SHOP', 'ad.16': 'Wicks, oil and glass chimneys. Special price on lamps for upstairs windows.',

  /* ---- B3 · Agenda, rádio e almoço ---- */
  'ag.band': 'THE WEEK AHEAD',
  'cal:title': 'MARCH',
  'cal': 'Su Mo Tu We Th Fr Sa\n·· ·· ·· ·· ·· 01 02\n03 04 05 06 07 08 09\n10 11 12 13[14]15 16\n17 18 19 20 21 22 23\n24 25 26 27 28 29 30\n31',
  'ev:title': 'THIS WEEK AND NEXT',
  'ev': 'Fri 15|Fish fry, Legion hall, 6 p.m.\nSat 16|Bake sale, St. Brendan’s\nSun 17|Prayer service, 10 a.m.\nMon 18|Board of Health, 4 p.m.\nTue 19|Harbor Board, 7 p.m.\nWed 20|Story hour, library (closed)\nThu 21|Choir practice (cancelled)\nFri 22|Dance, Legion hall, 8 p.m.\nSat 23|Rowing club, dawn\nSun 24|Evening prayer, doors close at dusk',
  'radio:title': 'RADIO · WHBR 1340 AM',
  'radio': '06:00|Farm and Harbor Report\n07:00|Morning Hymns\n09:00|Tides and Weather\n12:00|Noon News\n14:00|Request Hour\n17:00|Marine Forecast\n19:00|Evening Concert\n23:00|Sign-off\n03:12|Program not listed',
  'lunch:title': 'HARBOR SCHOOL LUNCH',
  'lunch': 'Mon|Fish chowder, bread\nTue|Cheese sandwich, peaches\nWed|Closed early\nThu|Fish chowder, bread\nFri|Fish chowder, seven bowls laid',
  'ag1.headline': 'Legion dance moves to Saturday', 'ag1.byline': 'Staff',
  'ag1.body': 'The Legion post’s spring dance has been moved from Friday to Saturday, commander Frank Pilcher announced on Wednesday, “to give everyone time to get home.” The band will play until ten. Tickets are fifty cents and include coffee.\n' +
    'Pilcher said the hall will be swept and the chairs set out in rows, as usual, and that members are asked to bring their own. He said there would be one empty chair at the front and that no one should sit in it. He did not say whose it was.',
  'ag2.headline': 'Story hour cancelled again', 'ag2.byline': 'Staff',
  'ag2.body': 'Miss Hester Crane has cancelled story hour at the library for the third week running. She said the children no longer ask for stories. They ask, she said, whether it is all right to stop.\n' +
    'The library will remain open for returns. The book drop is emptied each morning at nine.\n' +
    'Miss Crane added that the overdue list has been cleared. All of it. She said she does not know who cleared it, and that the ledger is now in a hand she does not recognize.',
  'ad.17:title': 'WHBR 1340 AM', 'ad.17': 'The voice of the harbor. On the air from six until eleven, and at other times.',
  'ad.18:title': 'GRANT’S HARDWARE', 'ad.18': 'Locks, bolts and window latches. Doors rehung to open outward.',
  'ad.19:title': 'DR. VOSS', 'ad.19': 'Mainland clinic, weekdays 9 to 5. Walk-ins welcome. Night calls are not accepted.',

  /* ---- B4 · Passatempos ---- */
  'fun.band': 'PUZZLES AND DIVERSIONS',
  'ws.kicker': 'PUZZLE', 'ws.headline': 'Harbor Word Find',
  'ws.deck': 'Find the eighteen words. They run in every direction, backward too. The letters left over, read in order, spell the answer.',
  'ws.grid': 'C O U N R O H G O F N\nN R E T N A L R B C L\nR O B R A H E E H L A\nY A U Q T T L O E T N\nR S H E S L I N M A G\nE A A O G R N A G I I\nP L R P M A L R N T S\nE T H E H R O E A R E\nE S E C V M A R K E R\nK P I E R C H A P E L\nE D I T E N D I V E R',
  'ws.words:title': 'WORDS TO FIND',
  'ws.words': 'BELL\nCHANNEL\nCHAPEL\nCHOIR\nDIVER\nFOGHORN\nHARBOR\nKEEPER\nLAMP\nLANTERN\nMARKER\nORGAN\nPIER\nQUAY\nROSTER\nSALT\nSIGNAL\nTIDE',
  'ws.note': 'Answer on page B6.',
  'stars:title': 'THE STARS THIS WEEK',
  'stars': 'Aries. A good week for starting things. Do not start them after dark.\n' +
    'Taurus. Stay near home. The lamp will tell you when to come in.\n' +
    'Gemini. You will be asked to choose between two roads. Take the third.\n' +
    'Cancer. Water is on your side this week, which is not the same as being kind.\n' +
    'Leo. Someone you trust is listening. Speak plainly and not too loudly.\n' +
    'Virgo. Count your change. Count your guests. Count again.\n' +
    'Libra. A balanced week. Seven will seem like six.\n' +
    'Scorpio. Avoid the pier on Tuesday. If you are already there, stay where you are.\n' +
    'Sagittarius. A letter arrives. Do not read past the first page.\n' +
    'Capricorn. Old debts come due. Pay them in daylight.\n' +
    'Aquarius. Your dreams are not your own this week. Return them if you can.\n' +
    'Pisces. Your birthday is near. The sea has sent a card.',
  'recipe:title': 'RECIPE OF THE WEEK: HARBOR CHOWDER',
  'recipe': 'Serves six. Set a seventh bowl, as is the custom.\n' +
    'Two pounds of white fish in chunks, four potatoes, one onion, three slices of salt pork, two cups of milk, one cup of water, salt and pepper.\n' +
    'Fry the pork until crisp. Add the onion and cook until soft. Add the potatoes and water and simmer twenty minutes. Add the fish and milk and simmer ten more. Season. Do not stir after dark.\n' +
    'Serve with hard bread. Leave the seventh bowl on the step until morning. It will be empty.',
  'adv.kicker': 'ADVICE', 'adv.headline': 'Ask Mrs. Aldous', 'adv.byline': 'Church Lane',
  'adv.body': 'Dear Mrs. Aldous: My husband goes down to the pier every night and comes back before dawn. He says he has only been listening. He is very tired. What should I do? — Tired, Quay Lane\n' +
    'Dear Tired: Keep his supper warm and leave the door unlatched. Do not follow him. Do not ask what he heard. When he is ready he will tell you, and you will wish he had not.\n' +
    'Dear Mrs. Aldous: Our boy has begun to hum at night. We cannot make out the tune. — Worried, Harbor Street\n' +
    'Dear Worried: It is not a tune. Hold him until he stops. Then sleep in the same room.\n' +
    'Dear Mrs. Aldous: I have set a place for my brother at every meal since he went to the platform in January. Last night the plate was empty. Should I be pleased? — Hopeful, Church Lane\n' +
    'Dear Hopeful: Be pleased, and set two places tomorrow.\n' +
    'Dear Mrs. Aldous: Is it rude to leave a party early? — Anxious, Quay Lane\n' +
    'Dear Anxious: Leave before dark. No one will notice, and those who do will understand.',
  'ad.20:title': 'THE PIER ARCADE', 'ad.20': 'Games for all ages. Closed after dark. The machines are not to be played after dark.',
  'ad.21:title': 'CALLOWAY’S BOOKS', 'ad.21': 'New and used. Hymnals, atlases and tide tables. Ask for the book at the back.',
  'ad.22:title': 'HARBOR TOYS', 'ad.22': 'Kites, marbles and tin boats. Special price on whistles. We do not stock horns of any kind.',

  /* ---- C1 · Negócios e imóveis ---- */
  'bz.band': 'BUSINESS AND PROPERTY',
  'bz1.kicker': 'BUSINESS', 'bz1.headline': 'Operator says output “unchanged” for fifth week',
  'bz1.deck': 'The platform’s reported figure matches the week it lost contact with its dive team.', 'bz1.byline': 'By Ruth Alden',
  'bz1.body': 'The platform operator reported on Wednesday that crude output was “unchanged” for the fifth consecutive week, a statement that analysts at the mainland exchange described as “remarkable, given the circumstances.” The figure, 14,212 barrels, is identical to the figure reported for the week of the incident, and for each week before it.\n' +
    'The company’s weekly return, filed at the Harbor Office, lists a headcount of forty-two. The company’s own payroll lists forty-one. A clerk at the Harbor Office, asked which figure was correct, said the counter had not been touched since Tuesday and that she would not touch it.\n' +
    'Shipping agents report that the supply boat has taken on stores for forty-three persons, including bread, milk and eleven pounds of salt. Salt consumption, a mainland analyst noted, is “well above plan.”\n' +
    'Shares in the operator’s parent company were unchanged in thin trading. A spokesman said the company remains “confident in its people.” Asked how many, he said he would find out and call back.',
  'mkt:title': 'MARKET PRICES',
  'mkt': 'Cod, per lb|$0.42\nMackerel, per lb|$0.29\nHerring, per lb|$0.18\nLamp oil, per gal|$1.10\nBlack cloth, per yd|sold out\nRope, 50 ft|$2.40\nSalt, per sack|$0.85\nCandles, dozen|$0.60\nEels|not quoted',
  'deeds:title': 'PROPERTY TRANSFERS',
  'deeds': 'Harbor Street, four rooms. W. M. Kessler to The Occupant. $1.\n' +
    'Quay Lane, chandlery. Estate of J. Brandt to the Town. $1.\n' +
    'Church Lane, cottage. Mrs. H. Aldous to Mrs. H. Aldous. No consideration.\n' +
    'Lower Shore Road, lot 9. Ødemark A. to the Harbor Board. Recorded 03:12.\n' +
    'Quay Lane, boathouse. Frank Pilcher to a buyer not named. Cash.',
  'bz2.headline': 'Bakery extends hours to dusk', 'bz2.byline': 'Staff',
  'bz2.body': 'The Harbor bakery will open at five and close at dusk, owner Gerda Lund announced. The bakery will no longer take orders after dark, a policy she called “in everyone’s interest.” Bread will be left on the step for customers who cannot come by day. Customers are asked to leave payment under the stone. The stone is moved every night. Mrs. Lund says she does not know by whom.',
  'bz3.headline': 'Chandlery out of black cloth', 'bz3.byline': 'Staff',
  'bz3.body': 'The Harbor Chandlery has sold out of black cloth for the second time this month. The proprietor said he has ordered more from the mainland and does not expect it before the end of the week. A customer buying the last bolt said it was “for the neighbors.” The proprietor did not ask which.\n' +
    'The proprietor said he has also run short of candles, lamp wicks and nails, and that the nails are being bought in sevens. He said he does not ask why. “A man who sells nails learns not to,” he said. The chandlery closes at dusk. It has not reopened after dusk since Monday, though the lamp inside is lit.',
  'bz4.headline': 'Ferry company posts a loss', 'bz4.byline': 'Staff',
  'bz4.body': 'The Harbor Ferry Company reported a loss for the quarter, its first since 1954. Passengers have declined to board once the sun goes down. The company said it is considering a daytime-only timetable. Its night crossing continues to run every evening, empty, at the posted time.\n' +
    'The company’s manager, Mr. Hale, said the ferry has carried no passengers after dark since Sunday. He said he sees no reason to cancel the crossing, since the boat has returned every night with the same number aboard. Asked how many, he said none, and then said that was what he had meant to say.',
  'ad.23:title': 'HARBOR STEAM LAUNDRY', 'ad.23': 'Oilskins, uniforms and bedding. Returned washed and folded. Items not claimed in thirty days are kept.',
  'ad.24:title': 'SALT AND SONS', 'ad.24': 'Fish merchants. We buy all that comes in. We do not ask where from.',
  'ad.25:title': 'THE ABYSSAL POST', 'ad.25': 'One year, four dollars, delivered before dawn. If a Thursday should pass without an issue, check the pier.',

  /* ---- C2 · Vitrine de anúncios ---- */
  'dp.band': 'ADVERTISEMENTS',
  'dp.1:title': 'ØDEMARK A. OFFSHORE', 'dp.1': 'NOW HIRING. Riggers, deckhands, cooks and technicians. All shifts. Night shift preferred. Hazard allowance paid weekly. No experience required. Apply at the Harbor Office. Next of kin will be recorded.',
  'dp.2:title': 'BELL’S LAUNCH', 'dp.2': 'Water taxi, pier to platform. Fares paid in advance. Return fares paid on arrival.',
  'dp.3:title': 'RED ANCHOR TAVERN', 'dp.3': 'Quay Lane. Beer, chowder and cards. We close at dusk and do not reopen for anyone who knocks.',
  'dp.4:title': 'MRS. ALDOUS, PIANO', 'dp.4': 'Lessons for all ages. Hymns a specialty. Students are asked not to practice after dark.',
  'dp.5:title': 'HARBOR COAL AND OIL', 'dp.5': 'Coal, lamp oil and kindling. Delivered before dusk. Orders for after dark are held until morning.',
  'photo.9.cap': 'ADVERTISEMENT. The Ødemark A. platform. “A good place to work.”',
  'dp.6:title': 'THE GREY COAT', 'dp.6': 'Coats, boots and oilskins in all sizes, from child to diver. Harbor Street, opposite the pier.',
  'dp.7:title': 'HARBOR PHOTO STUDIO', 'dp.7': 'Portraits, weddings and funerals. Groups of any size. We count everyone in the frame.',
  'dp.8:title': 'FIRST HARBOR SAVINGS', 'dp.8': 'Your money, safe on dry land. Accounts of absent depositors are held until claimed.',
  'dp.fine': 'Advertisements are accepted in good faith. The publisher does not guarantee that any advertised business is open, in business, or exists.',

  /* ---- acréscimos (preenchem as páginas) ---- */
  'tn.offices:title': 'TOWN OFFICES',
  'tn.offices': 'Harbor Office|8–5\nLibrary|Mon–Thu, 10–4\nPost office|9–12\nSheriff|Always\nClinic (mainland)|9–5\nSt. Brendan’s|Dawn to dusk',
  'photo.10.cap': 'The Legion hall on Wednesday evening, with the chairs set out for Saturday. Photo: Harbor Office',
  'ag.board:title': 'BULLETIN BOARD',
  'ag.board': 'Found. A silver whistle on the pier steps. Claim at the Harbor Office. Do not blow it.\n' +
    'Lost. Black umbrella, Quay Lane. Not needed after dark.\n' +
    'Wanted. Someone to read to Mr. Pruitt in the evenings. He prefers to be read to from the back of the room.\n' +
    'Found. One child’s mitten, red. Ask at the school. Ask nobody else.\n' +
    'For sale. Piano stool, oak. The piano is not for sale.\n' +
    'Notice. The Friday fish fry serves at six. Please be seated by six, and please count your party.',
  'bz.cls.title': 'HELP WANTED AND SERVICES',
  'bz.cls': 'HELP WANTED. Rigger, platform, nights. Pay doubled for the lower deck. Apply at the Harbor Office, ask for Mr. Brandt.\n' +
    'HELP WANTED. Baker’s boy, five o’clock start. Must be able to find the way home in the dark.\n' +
    'HELP WANTED. Clerk, chandlery, Quay Lane. Light duties. Previous clerk not available for reference.\n' +
    'SERVICES. Nets mended. Boots resoled. Clocks wound by the hour or by the week.\n' +
    'SERVICES. Accounts kept. Wills drawn. Estates settled quickly, with or without the heirs.\n' +
    'FOR SALE. Oilskins, assorted sizes, never worn, one pair slightly damp.\n' +
    'WANTED. Lamp oil, in quantity. No questions.\n' +
    'NOTICE. Tenants of Harbor Street are reminded that rent is due on the first. The landlord is no longer accepting rent in person.\n' +
    'OPPORTUNITY. Share in a fishing boat. The boat is sound. The sea is not our concern.\n' +
    'FOR RENT. Harbor Street, four rooms, furnished. Previous tenant’s effects remain.',
  'dp.9:title': 'MISS GRAY, SEAMSTRESS', 'dp.9': 'Mourning dress made to order in one day. Black cloth supplied by the customer.',
  'dp.10:title': 'THE ANCHOR BOARDING HOUSE', 'dp.10': 'Rooms by the week. Rooms facing the sea are not available. Rooms facing the land are all taken.',
  'dp.11:title': 'LOST: PILOT', 'dp.11': 'Brown terrier, answers to his name. Reward. If found, do not follow him.',
};
Object.keys(_NEWS2_DEFAULTS).forEach(k=>{
  if (k in NEWS_DEFAULTS) console.warn('news-pages2: chave já existe, mantida a antiga:', k);
  else NEWS_DEFAULTS[k] = _NEWS2_DEFAULTS[k];
});

/* Anúncios lado a lado com a mesma altura: o que sobra de altura vira folga em cima e embaixo do texto. */
function newsEqualize(objs){
  objs = objs.filter(Boolean);
  const H = Math.max(0, ...objs.map(o=>o.height));
  objs.forEach(o=>{ const extra = H - o.height; if (extra > 1){ o.set('padY', o._padY() + extra/2); o.initDimensions(); } });
  return H;
}

const _NEWS2_PRESETS = {
  cidade: {label:'Cidade e delegacia (A2)', group:'interna', build: async (B)=>{
    const T = B.innerHeader('A2'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, LW = newsW(4), RX = newsX(4), RW = newsW(2), hw = newsW(2);
    const a1 = B.boxAtBottom('ad.11', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.12', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.13', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    const y = B.band('tn.band', LX, T, FW);
    const h = B.head('tn1', LX, y, LW, {size:44, upper:true, lh:1.02, rule:true, deckSize:17});
    const py = await B.photo('photo.7', LX, h, LW, 340, {variant:1});
    const f1 = B.flow('tn1.body', LX, py, LW, {cols:2, size:18, bottom:py + 380, minSize:12.5});
    const bl = B.txt('blot', RX, y, RW, {frame:'bar', title:true, size:15, lh:1.3});
    const tb = B.txt('tn.brief', RX, bl.bottom + 16, RW, {frame:'box', title:true, size:15, lh:1.3});
    const top1 = Math.max(f1, tb.bottom);
    B.vline(RX - NEWS_G.GUT/2, y, top1);
    const split = top1 + 16;
    B.rule(LX, split, LX + FW, split, 1.3);
    const s2 = B.head('tn2', LX, split + 14, hw, {size:25, rule:false}); B.flow('tn2.body', LX, s2, hw, {size:17, bottom:lim, minSize:12.5});
    const s3 = B.head('tn3', newsX(2), split + 14, hw, {size:25, rule:false}); B.flow('tn3.body', newsX(2), s3, hw, {size:17, bottom:lim, minSize:12.5});
    const pq = B.txt('tn.pq', RX, split + 14, RW, {frame:'rules', style:'italic', size:22, lh:1.24, weight:700, padY:11});
    B.txt('tn.offices', RX, pq.bottom + 16, RW, {frame:'bar', title:true, rows:true, size:16, lh:1.55});
    B.vline(newsX(2) - NEWS_G.GUT/2, split + 14, lim); B.vline(RX - NEWS_G.GUT/2, split + 14, lim);
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},

  reportagem: {label:'Reportagem especial (B2)', group:'interna', build: async (B)=>{
    const T = B.innerHeader('B2'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, LW = newsW(4), RX = newsX(4), RW = newsW(2);
    const a1 = B.boxAtBottom('ad.14', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.15', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.16', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    let y = B.band('ft.band', LX, T, FW);
    y = B.head('ft', LX, y, FW, {size:68, lh:1.0, align:'center', rule:true, deckSize:20});
    const py = await B.photo('photo.8', LX, y, FW, 380, {variant:0});
    B.flow('ft.body', LX, py, LW, {cols:2, size:22, bottom:lim, minSize:12.5});
    const tl = B.txt('tl', RX, py, RW, {frame:'bar', title:true, rows:true, size:17, lh:1.62});
    const pq = B.txt('pq3', RX, tl.bottom + 18, RW, {frame:'rules', style:'italic', size:25, lh:1.24, weight:700, padY:12});
    B.txt('nums', RX, pq.bottom + 18, RW, {frame:'box', title:true, rows:true, size:16, lh:1.6});
    B.vline(RX - NEWS_G.GUT/2, py, lim);
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},

  agenda: {label:'Agenda, rádio e almoço (B3)', group:'interna', build: async (B)=>{
    await ensureFonts(NEWS_FONT_MONO);
    const T = B.innerHeader('B3'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, RX = newsX(3) + 8, HW = newsW(3) - 8, wi = newsW(2);
    const a1 = B.boxAtBottom('ad.17', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.18', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.19', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    const y = B.band('ag.band', LX, T, FW);
    // esquerda: calendário do mês (monoespaçado) e eventos
    const cal = B.txt('cal', LX, y, HW, {frame:'box', title:true, font:'IBM Plex Mono', weight:500, size:26, lh:1.55, cs:300});
    const ev = B.txt('ev', LX, cal.bottom + 16, HW, {frame:'bar', title:true, rows:true, size:18, lh:1.62});
    // direita: rádio, almoço da escola e foto
    const rd = B.txt('radio', RX, y, HW, {frame:'bar', title:true, rows:true, size:18, lh:1.62});
    const lu = B.txt('lunch', RX, rd.bottom + 16, HW, {frame:'box', title:true, rows:true, size:18, lh:1.62});
    const colBot = Math.max(ev.bottom, lu.bottom + 16 + 250);
    const pb = await B.photo('photo.10', RX, lu.bottom + 16, HW, Math.max(200, colBot - (lu.bottom + 16) - 32), {variant:1});
    B.vline(newsX(3) - NEWS_G.GUT/2, y, Math.max(ev.bottom, pb));
    const split = Math.max(ev.bottom, pb) + 14;
    B.rule(LX, split, LX + FW, split, 1.3);
    // embaixo: duas matérias e o quadro de avisos
    const s1 = B.head('ag1', LX, split + 14, wi, {size:25, rule:false}); B.flow('ag1.body', LX, s1, wi, {size:21, bottom:lim, minSize:12.5});
    const s2 = B.head('ag2', newsX(2), split + 14, wi, {size:25, rule:false}); B.flow('ag2.body', newsX(2), s2, wi, {size:21, bottom:lim, minSize:12.5});
    B.txt('ag.board', newsX(4), split + 14, wi, {frame:'bar', title:true, size:16.5, lh:1.36});
    B.vline(newsX(2) - NEWS_G.GUT/2, split + 14, lim); B.vline(newsX(4) - NEWS_G.GUT/2, split + 14, lim);
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},

  passatempos: {label:'Passatempos (B4)', group:'interna', build: async (B)=>{
    await ensureFonts(NEWS_FONT_MONO);
    const T = B.innerHeader('B4'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, LW = newsW(4), RX = newsX(4), RW = newsW(2);
    const a1 = B.boxAtBottom('ad.20', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.21', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.22', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    const y = B.band('fun.band', LX, T, FW);
    // caça-palavras: grade monoespaçada + lista de palavras
    const h = B.head('ws', LX, y, LW, {size:40, rule:true, deckSize:17});
    const GW = 460;
    const gr = B.txt('ws.grid', LX, h + 4, GW, {frame:'box', font:'IBM Plex Mono', weight:500, size:29, lh:1.46, align:'center', cs:110, padY:14});
    const wl = B.txt('ws.words', LX + GW + 22, h + 4, LW - GW - 22, {frame:'box', title:true, size:16.5, lh:1.3});
    const note = B.txt('ws.note', LX, Math.max(gr.bottom, wl.bottom) + 8, LW, {style:'italic', size:13, lh:1.25, align:'right', fill:'#4a4540'});
    const top1 = note.obj ? note.bottom : Math.max(gr.bottom, wl.bottom);
    // coluna da direita: horóscopo e receita
    const st = B.txt('stars', RX, y, RW, {frame:'bar', title:true, size:14.5, lh:1.28});
    const rc = B.txt('recipe', RX, st.bottom + 16, RW, {frame:'box', title:true, size:14.5, lh:1.3});
    B.vline(RX - NEWS_G.GUT/2, y, Math.max(top1, rc.bottom));
    const split = Math.max(top1, rc.bottom) + 16;
    B.rule(LX, split, LX + FW, split, 1.3);
    // conselhos (embaixo, largura toda, 3 colunas)
    const ah = B.head('adv', LX, split + 14, FW, {size:30, rule:true});
    B.flow('adv.body', LX, ah, FW, {cols:3, size:25, bottom:lim, minSize:12.5, gut:22});
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},

  negocios: {label:'Negócios e imóveis (C1)', group:'interna', build: async (B)=>{
    const T = B.innerHeader('C1'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, LW = newsW(4), RX = newsX(4), RW = newsW(2), wi = newsW(2);
    const a1 = B.boxAtBottom('ad.23', newsX(0), newsW(2), BT, NEWS_AD), a2 = B.boxAtBottom('ad.24', newsX(2), newsW(2), BT, NEWS_AD), a3 = B.boxAtBottom('ad.25', newsX(4), newsW(2), BT, NEWS_AD);
    const lim = Math.min(a1, a2, a3) - 22;
    const y = B.band('bz.band', LX, T, FW);
    const h = B.head('bz1', LX, y, LW, {size:44, upper:true, lh:1.02, rule:true, deckSize:17});
    const f1 = B.flow('bz1.body', LX, h, LW, {cols:2, size:19, bottom:h + 430, minSize:12.5});
    const mk = B.txt('mkt', RX, y, RW, {frame:'bar', title:true, rows:true, size:16, lh:1.55});
    const de = B.txt('deeds', RX, mk.bottom + 16, RW, {frame:'box', title:true, size:15, lh:1.32});
    const top1 = Math.max(f1, de.bottom);
    B.vline(RX - NEWS_G.GUT/2, y, top1);
    const split = top1 + 16;
    B.rule(LX, split, LX + FW, split, 1.3);
    // três matérias curtas; o miolo da página termina onde começam os classificados
    const briefsBot = lim - 285;
    [['bz2', 0], ['bz3', 2], ['bz4', 4]].forEach(([r, c], i)=>{
      const x = newsX(c), hh = B.head(r, x, split + 14, wi, {size:23, rule:false});
      B.flow(r + '.body', x, hh, wi, {size:21, bottom:briefsBot, minSize:12.5});
      if (i) B.vline(x - NEWS_G.GUT/2, split + 14, briefsBot);
    });
    B.rule(LX, briefsBot + 10, LX + FW, briefsBot + 10, 1.3);
    const cy = B.band('bz.cls.title', LX, briefsBot + 22, FW);
    B.flow('bz.cls', LX, cy, FW, Object.assign({cols:3, bottom:lim}, NEWS_CLS, {size:20, minSize:12}));
    B.rule(LX, lim + 8, LX + FW, lim + 8, 1.3);
  }},

  anuncios: {label:'Vitrine de anúncios (C2)', group:'interna', build: async (B)=>{
    const T = B.innerHeader('C2'), BT = NEWS_G.BOTTOM, LX = newsX(0), FW = NEWS_G.W, GAP = 18;
    const AD = (size, tsize)=>Object.assign({}, NEWS_AD, {size, titleSize:tsize, lh:1.3});
    const fine = B.txt('dp.fine', LX, 0, FW, {style:'italic', size:13, lh:1.3, align:'center', fill:'#4a4540'});
    const fineTop = fine.obj ? BT - fine.obj.height : BT;
    if (fine.obj){ fine.obj.set('top', fineTop); fine.obj.setCoords(); }
    const end = fineTop - 14;
    let y = B.band('dp.band', LX, T, FW);
    const rows = [];   // cada linha: objetos (pra mexer em bloco), altura, e se pode esticar
    const addRow = (objs, H, stretch, boxes)=>{ rows.push({objs, top:y, H, stretch, boxes: boxes || []}); y += H + GAP; };
    const grab = (n0)=>B.cv.getObjects().slice(n0);
    let n0 = B.cv.getObjects().length;
    // linha 1: anúncio grande (4 col.) + pequeno (2 col.)
    const d1 = B.txt('dp.1', LX, y, newsW(4), AD(22, 50)), d2 = B.txt('dp.2', newsX(4), y, newsW(2), AD(18, 30));
    addRow(grab(n0), newsEqualize([d1.obj, d2.obj]), true, [d1.obj, d2.obj]);
    // linhas 2 e 3: três de 2 colunas cada
    [['dp.3', 'dp.4', 'dp.5'], ['dp.9', 'dp.10', 'dp.11']].forEach(ids=>{
      n0 = B.cv.getObjects().length;
      const r = ids.map((id, i)=>B.txt(id, newsX(i*2), y, newsW(2), AD(18, 29)).obj);
      addRow(grab(n0), newsEqualize(r), true, r);
    });
    // linha 4: foto-anúncio (4 col.) + dois pequenos empilhados (2 col.)
    n0 = B.cv.getObjects().length;
    const rowTop = y;
    const py = await B.photo('photo.9', LX, y, newsW(4), 300, {variant:0});
    const s1 = B.txt('dp.6', newsX(4), y, newsW(2), AD(17, 26));
    const s2 = B.txt('dp.7', newsX(4), s1.bottom + 14, newsW(2), AD(17, 26));
    // os dois anúncios empilhados crescem até a base da foto
    const img = grab(n0).find(o=>o.type === 'image');
    if (img && s1.obj && s2.obj){
      const extra = (img.top + img.getScaledHeight()) - (s2.obj.top + s2.obj.height);
      if (extra > 2){
        [s1.obj, s2.obj].forEach(o=>{ o.set('padY', o._padY() + extra/4); o.initDimensions(); });
        s2.obj.set('top', s1.obj.top + s1.obj.height + 14); s2.obj.setCoords();
      }
    }
    addRow(grab(n0), Math.max(py - 10, s2.obj ? s2.obj.top + s2.obj.height : 0) - rowTop, false, []);
    // linha 5: faixa do banco (largura toda)
    n0 = B.cv.getObjects().length;
    const bank = B.txt('dp.8', LX, y, FW, AD(22, 42));
    addRow(grab(n0), bank.obj ? bank.obj.height : 0, true, [bank.obj]);
    // a folga que sobra até a nota miúda é dividida entre as linhas que esticam (cada anúncio ganha ar em cima e embaixo do texto)
    const room = end - (y - GAP);
    const stretchable = rows.filter(r=>r.stretch);
    if (room > 0 && stretchable.length){
      const e = room/stretchable.length; let shift = 0;
      rows.forEach(r=>{
        r.objs.forEach(o=>{ o.set('top', o.top + shift); o.setCoords(); });
        if (r.stretch){ r.boxes.filter(Boolean).forEach(o=>{ o.set('padY', o._padY() + e/2); o.initDimensions(); o.setCoords(); }); shift += e; }
      });
    }
  }},
};
Object.keys(_NEWS2_PRESETS).forEach(k=>{
  if (NEWS_PRESETS[k]){ console.warn('news-pages2: layout já existe, mantido o antigo:', k); return; }
  NEWS_PRESETS[k] = _NEWS2_PRESETS[k];
  NEWS_PRESET_ORDER.push(k);
});
