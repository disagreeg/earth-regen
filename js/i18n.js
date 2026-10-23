window.GG = window.GG || {};
GG.i18n = (function () {
  'use strict';

  const I = {};
  const C = function () { return GG.config; };
  const SET_KEY = 'earthregen.settings';

  I.langs = [
    { id: 'en', name: 'English', label: 'ENGLISH' },
    { id: 'ru', name: 'Русский', label: 'РУССКИЙ' },
  ];

  let lang = 'en';
  I.lang = function () { return lang; };
  I.isRu = function () { return lang === 'ru'; };

  const UI = {

    'ui.toastNote':   ['Note', 'Заметка'],
    'ui.toastBad':    ['Refused', 'Отказ'],

    'cam.back':       ['Back to the map', 'Вернуться к карте'],

    'practice.tag':   ['PRACTICE ROOM', 'ТРЕНИРОВКА'],
    'practice.sub':   ['Nothing here reaches your run',
                       'Ничего отсюда не попадёт в вашу игру'],
    'practice.leave': ['LEAVE', 'ВЫЙТИ'],

    'practice.st.ideal':   ['ENOUGH POWER', 'ЭНЕРГИИ ХВАТАЕТ'],
    'practice.st.starved': ['A QUARTER', 'ЧЕТВЕРТЬ'],
    'practice.st.dead':    ['NO POWER', 'БЕЗ ЭНЕРГИИ'],

    'practice.stw.ideal':   ['ENOUGH CREW', 'БРИГАДЫ ХВАТАЕТ'],
    'practice.stw.starved': ['A QUARTER', 'ЧЕТВЕРТЬ'],
    'practice.stw.dead':    ['NO CREW', 'БЕЗ БРИГАДЫ'],
    'practice.split':      ['%total in and out. Split %ratio',
                            '%total на входе и на выходе. Деление %ratio'],
    'practice.allOne':     ['%total in and out. All of it %res',
                            '%total на входе и на выходе. Всё — %res'],
    'practice.making':     ['%total of %res', '%total — %res'],
    'practice.idle':       ['Nothing is moving yet', 'Пока ничего не движется'],

    'practice.batch':      ['Gathering a batch', 'Набирает партию'],

    'practice.again':      ['START AGAIN', 'ЗАНОВО'],

    'practice.prioPick':   ['PRIORITY: %name', 'ПРИОРИТЕТ: %name'],
    'practice.prioOn':     ['The %name can take %res now, so it gets all %rate.',
                            '«%name» сейчас принимает поток %gen, поэтому получает все %rate.'],
    'practice.prioOff':    ['The %name cannot take %res now, so all %rate goes to the %other.',
                            '«%name» сейчас не принимает поток %gen, поэтому все %rate идут в «%other».'],
    'practice.loadForms':  ['load|loads', 'загрузка|загрузки|загрузок'],
    'practice.kit':        ['%name: %n, %now (%base without kits).',
                            '%name: %n, %now (%base без комплектов).'],
    'practice.kitRobot':   ['%name: %n, draws %draw of %full by day.',
                            '%name: %n, днём берёт %draw из %full.'],
    'practice.kitNext':    ['Next load wants %next.', 'Следующей нужно %next.'],
    'practice.kitMax':     ['It takes no more.', 'Больше не берёт.'],

    'practice.perm':       ['%name: %n, %gain for good.', '%name: %n, %gain навсегда.'],
    'practice.permBare':   ['%name: %n.', '%name: %n.'],
    'practice.permNext':   ['Next: %need, %pct gathered.', 'Следующий: %need, собрано %pct.'],
    'practice.u.recruit':  ['recruit|recruits', 'рекрут|рекрута|рекрутов'],
    'practice.u.array':    ['array|arrays', 'массив|массива|массивов'],
    'practice.u.diamond':  ['diamond|diamonds', 'алмаз|алмаза|алмазов'],
    'practice.u.dome':     ['dome|domes', 'купол|купола|куполов'],
    'practice.u.stretch':  ['stretch|stretches', 'участок|участка|участков'],
    'practice.all.ideal':  ['ENOUGH SUPPLY', 'ПОСТАВОК ХВАТАЕТ'],
    'practice.all.starved':['A QUARTER', 'ЧЕТВЕРТЬ'],
    'practice.all.dead':   ['NO SUPPLY', 'БЕЗ ПОСТАВОК'],
    'practice.frg.even':      ['BATTERIES + STEEL', 'БАТАРЕИ + СТАЛЬ'],
    'practice.frg.moreSteel': ['MORE STEEL', 'БОЛЬШЕ СТАЛИ'],
    'practice.frg.moreCell':  ['MORE BATTERIES', 'БОЛЬШЕ БАТАРЕЙ'],
    'practice.permWait':   ['Waiting on %res.', 'Не хватает %res.'],
    'practice.rb.both':    ['CREW + POWER', 'БРИГАДА + ЭНЕРГИЯ'],
    'practice.rb.crew':    ['ONLY CREW', 'ТОЛЬКО БРИГАДА'],
    'practice.rb.power':   ['ONLY POWER', 'ТОЛЬКО ЭНЕРГИЯ'],
    'practice.rb.moreCrew':  ['MORE CREW', 'БОЛЬШЕ БРИГАДЫ'],
    'practice.rb.morePower': ['MORE POWER', 'БОЛЬШЕ ЭНЕРГИИ'],
    'practice.rb.crew2':     ['ONLY CREW x2', 'ТОЛЬКО БРИГАДА x2'],
    'practice.rb.power2':    ['ONLY POWER x2', 'ТОЛЬКО ЭНЕРГИЯ x2'],
    'practice.rubble':     ['Glass %g, Aggregate %a. Crew pulls to glass, power to aggregate.',
                            'Стекло %g, щебень %a. Бригада тянет к стеклу, энергия к щебню.'],

    'practice.lim.none':   ['NO LIMIT', 'БЕЗ ПРЕДЕЛА'],
    'practice.lim.some':   ['LIMIT', 'ПРЕДЕЛ'],
    'practice.lim.zero':   ['LIMIT 0', 'ПРЕДЕЛ 0'],

    'practice.spl.even':   ['1 : 1', '1 : 1'],
    'practice.spl.lean':   ['1 : 3', '1 : 3'],
    'practice.spl.allA':   ['ALL TO A', 'ВСЁ В А'],
    'practice.limNone':    ['No limit, so all %in leaves as it arrives. Nothing is kept.',
                            'Без предела, поэтому все %in уходят сразу. Ничего не копится.'],
    'practice.limSome':    ['%out leaves and %keep stays behind. Holding %held.',
                            'Уходит %out, остаётся %keep. На складе %held.'],
    'practice.limFull':    ['Full at %held. It only takes in the %out it lets out, so the supplies back up.',
                            'Полон: %held. Принимает только те %out, что отдаёт, поэтому поставки встают.'],
    'practice.limZero':    ['Nothing leaves, so all %in stays behind. Holding %held.',
                            'Ничего не уходит, поэтому все %in остаются. На складе %held.'],
    'practice.limZeroFull':['Full at %held. Nothing leaves, so nothing more comes in.',
                            'Полон: %held. Ничего не уходит, поэтому ничего и не приходит.'],

    'practice.half.ideal':   ['ENOUGH CREW', 'БРИГАДЫ ХВАТАЕТ'],
    'practice.half.starved': ['HALF', 'ПОЛОВИНА'],
    'practice.half.dead':    ['NO CREW', 'БЕЗ БРИГАДЫ'],

    'practice.act.gem':    ['DROP A DIAMOND', 'УРОНИТЬ АЛМАЗ'],
    'practice.act.bolt':   ['DROP LIGHTNING', 'ВЫЗВАТЬ МОЛНИЮ'],

    'practice.beacon.manual': ['MANUAL', 'ВРУЧНУЮ'],
    'practice.beacon.auto':   ['AUTO', 'АВТО'],
    'practice.bcManual':   ['Press PULL on the card to bring a meteorite down. A pull costs %cost, charge %held.',
                            'Нажмите «ВЫЗВАТЬ» на карточке, чтобы сбить метеорит. Одна тяга стоит %cost, заряд %held.'],
    'practice.bcAuto':     ['It pulls a meteorite by itself whenever it has %cost. Charge %held.',
                            'Сама сбивает метеорит, как только набирает %cost. Заряд %held.'],
    'practice.bcComing':   ['One is on its way.', 'Один уже летит.'],
    'practice.bcFull':     ['The sky is full: %n meteorites are down, so it cannot pull another. START AGAIN clears it.',
                            'Небо заполнено: упало %n метеорита, больше не вызвать. «ЗАНОВО» очистит его.'],

    'practice.stkNow':     ['Lightning. Each strike puts %kw into the vault, and it holds it until the sky clears. Stored %held.',
                            'Молния. Каждый удар даёт хранилищу %kw, и оно держит их, пока небо не прояснится. Запас %held.'],
    'practice.stkRun':     ['The %name runs on the stored lightning at %out. Stored %held.',
                            '«%name» работает от пойманной молнии: %out. Запас %held.'],
    'practice.stkEmpty':   ['Nothing stored. Drop lightning to charge the vault.',
                            'Запас пуст. Вызовите молнию, чтобы зарядить хранилище.'],

    'practice.agency.posts':    ['POSTS FIRST', 'СНАЧАЛА ПУНКТЫ'],
    'practice.agency.exchange': ['EXCHANGES FIRST', 'СНАЧАЛА БИРЖИ'],
    'practice.agLine':     ['The Bank\'s interest fills its budget: %budget of %cap. Hands hired: %p at the posts, %e at the exchange.',
                            'Проценты банка идут в бюджет: %budget из %cap. Нанято: %p в пунктах, %e на бирже.'],

    'practice.rkBuild':    ['Building: %pct of the parts are in.', 'Постройка: собрано %pct деталей.'],
    'practice.rkFuel':     ['Built. Loading %res: %have of %need.', 'Построен. Заправка (%res): %have из %need.'],
    'practice.rkCrew':     ['Fuelled. The crew is boarding: %have of %need WF.',
                            'Заправлен. Экипаж садится: %have из %need WF.'],
    'practice.rkReady':    ['Ready. Press LAUNCH on the card.', 'Готов. Нажмите «ЗАПУСК» на карточке.'],

    'practice.robot.enough': ['ENOUGH POWER', 'ЭНЕРГИИ ХВАТАЕТ'],
    'practice.robot.double': ['2X POWER', '2X ЭНЕРГИИ'],
    'practice.robot.none':   ['NO POWER', 'БЕЗ ЭНЕРГИИ'],
    'practice.robot.steady': ['STEADY', 'ОБЫЧНЫЙ'],
    'practice.robot.over':   ['OVERDRIVE', 'ФОРСАЖ'],
    'practice.rbEnough':   ['Power in matches what it spends, so the cell stays at %held. Making %wf.',
                            'Энергии приходит ровно столько, сколько он тратит, поэтому батарея стоит на %held. Даёт %wf.'],
    'practice.rbMore':     ['Twice the power it spends. The extra fills the cell: %held. Making %wf.',
                            'Энергии вдвое больше, чем он тратит. Излишек заряжает батарею: %held. Даёт %wf.'],
    'practice.rbFull':     ['The cell is full at %held, so the extra power is wasted. Making %wf.',
                            'Батарея полна (%held), поэтому лишняя энергия пропадает. Даёт %wf.'],
    'practice.rbNone':     ['No power in, so it works off its own cell: %held left. Making %wf.',
                            'Энергии нет, поэтому он работает от своей батареи: осталось %held. Даёт %wf.'],
    'practice.rbEmpty':    ['The cell is empty, so it makes nothing. START AGAIN puts half a charge back.',
                            'Батарея пуста, поэтому он ничего не даёт. «ЗАНОВО» возвращает половину заряда.'],
    'practice.rbOver':     ['Overdrive: x%out workforce for x%drain power.',
                            'Форсаж: рабочей силы x%out за энергию x%drain.'],
    'practice.fuelPick':   ['FUEL: %res', 'ТОПЛИВО: %res'],
    'practice.rkFlyGems':  ['In flight. Back in %sec with %kg diamonds. Shortened here: a real flight takes %real.',
                            'В полёте. Вернётся через %sec с алмазами (%kg). Здесь короче: настоящий полёт длится %real.'],
    'practice.rkFly':      ['In flight. Back in %sec with %kg of metal. Shortened here: a real flight takes %real.',
                            'В полёте. Вернётся через %sec с %kg металла. Здесь короче: настоящий полёт длится %real.'],
    'practice.rkHold':     ['Home. Unloading %kg of metal.', 'Вернулась. Выгружает %kg металла.'],

    'practice.pr.pick':    ['%res: %what', '%res: %what'],
    'practice.pr.gems':    ['Diamonds', 'Алмазы'],

    'practice.pr.anyOther': ['Any other material', 'Любой другой материал'],
    'practice.prOther':    ['%what from %res, %n so far. Next: %paper paper, %kg of %res, %kw. Press again for another material.',
                            '%what из %res, готово %n. Дальше: %paper бумаги, %kg %res, %kw. Нажмите ещё раз для другого материала.'],
    'practice.prLine':     ['Printing %what, %n so far. The next print wants %paper paper, %kg of %res and %kw.',
                            'Печатает «%what», готово %n. Следующему нужно %paper бумаги, %kg %res и %kw.'],

    'practice.gemIdle':    ['No diamond on the ground. Drop one and watch the arm. Charge %bank.',
                            'Алмазов на земле нет. Уроните один и смотрите на руку. Заряд %bank.'],
    'practice.gemReach':   ['The arm is reaching for the diamond. It costs %per of charge.',
                            'Рука тянется за алмазом. Это стоит %per заряда.'],
    'practice.gemShort':   ['A diamond is down, but the arm needs %per and has %bank.',
                            'Алмаз лежит, но руке нужно %per, а есть %bank.'],
    'practice.gemFull':    ['The tray is full at %till. Press COLLECT on the card.',
                            'Лоток полон: %till. Нажмите «СОБРАТЬ» на карточке.'],

    'practice.res.use':    ['USE IT', 'ТРАТИТЬ'],
    'practice.res.hold':   ['HOLD IT', 'БЕРЕЧЬ'],
    'practice.batOnPass':  ['Supply on for %sec. All %in goes to the %name, which needs %want. Nothing is stored.',
                            'Питание есть ещё %sec. Все %in идут в «%name», хотя нужно %want. Ничего не копится.'],
    'practice.batOnKeep':  ['Supply on for %sec. All %in goes to the %name, which needs %want. The reserve (%held) waits until the supply stops.',
                            'Питание есть ещё %sec. Все %in идут в «%name», хотя нужно %want. Запас (%held) ждёт, пока питание не пропадёт.'],
    'practice.batOnKeepHold': ['Supply on for %sec. All %in goes to the %name, which needs %want. HOLD IT keeps the reserve (%held).',
                            'Питание есть ещё %sec. Все %in идут в «%name», хотя нужно %want. «Беречь» держит запас (%held).'],
    'practice.batOnBank':  ['Supply on for %sec. %out goes to the %name and %bank is stored. Stored %held.',
                            'Питание есть ещё %sec. В «%name» идёт %out, ещё %bank копится. Запас %held.'],
    'practice.batOnFull':  ['Supply on for %sec. %out goes to the %name. Full at %held, so the other %waste is lost.',
                            'Питание есть ещё %sec. В «%name» идёт %out. Запас полон (%held), остальные %waste теряются.'],
    'practice.batOnShut':  ['Supply on for %sec. LIMIT 0 lets nothing out, so all %in is stored. Stored %held.',
                            'Питание есть ещё %sec. Предел 0 ничего не выпускает, поэтому все %in копятся. Запас %held.'],
    'practice.batOnShutFull': ['Supply on for %sec. LIMIT 0 lets nothing out and the store is full, so all %in is lost.',
                            'Питание есть ещё %sec. Предел 0 ничего не выпускает, а запас полон, поэтому все %in теряются.'],
    'practice.batOffUse':  ['Supply off for %sec. The %name runs on the reserve at %out. Stored %held.',
                            'Питания нет ещё %sec. «%name» работает от запаса: %out. Осталось %held.'],
    'practice.batOffHold': ['Supply off for %sec. HOLD IT keeps %held stored, so the %name stops.',
                            'Питания нет ещё %sec. «Беречь» держит в запасе %held, поэтому «%name» стоит.'],
    'practice.batOffShut': ['Supply off for %sec. LIMIT 0 lets nothing out, so the %name stops. Stored %held.',
                            'Питания нет ещё %sec. Предел 0 ничего не выпускает, поэтому «%name» стоит. Запас %held.'],
    'practice.batOffEmpty':['Supply off for %sec and nothing is stored, so the %name stops.',
                            'Питания нет ещё %sec, а запас пуст, поэтому «%name» стоит.'],
    'practice.flt.ideal':  ['ENOUGH %res', '%gen ХВАТАЕТ'],
    'practice.flt.starved':['A QUARTER', 'ЧЕТВЕРТЬ'],
    'practice.flt.dead':   ['NO %res', 'БЕЗ %gen'],
    'practice.pass':       ['%done of %total processed. %left pass through raw.',
                            '%done из %total обработано. %left уходит сырьём.'],
    'practice.conv':       ['Making %made of %full. Held back by %res.',
                            'Делает %made из %full. Сдерживает: %res.'],
    'practice.convSome':   ['Making %made. Held back by %res.',
                            'Делает %made. Сдерживает: %res.'],
    'practice.convTop':    ['Making %made, as fast as %res allows.',
                            'Делает %made. Упирается в: %res.'],
    'practice.convFree':   ['Making %made at full speed.',
                            'Делает %made на полной скорости.'],

    'practice.try':        ['TRY IT', 'ПОПРОБОВАТЬ'],

    'gd.yourScore':   ['Your score', 'Ваш счёт'],
    'gd.newMachines': ['New machines', 'Новые машины'],
    'gd.forGood':     ['kept for good', 'навсегда'],
    'gd.onSite':      ['on %s', 'место: %s'],
    'gd.meteorite':   ['Meteorite', 'Метеорит'],
    'gd.boosts':      ['Boosts', 'Бусты'],
    'gd.prioA':       ['Output A, fed first', 'Выход A, первым'],
    'gd.prioB':       ['Output B, the rest', 'Выход B, остаток'],
    'gd.or':          ['or', 'или'],

    'gd.letGo':       ['let go', 'отпустить'],
    'gd.click':       ['click', 'щелчок'],
    'gd.tap':         ['tap', 'нажать'],
    'gd.slots':       ['Slots', 'Гнёзда'],
    'gd.worksFull':   ['Works when full', 'Работает, когда полны'],
    'gd.common':      ['Common', 'Обычный'],
    'gd.rare':        ['Rare', 'Редкий'],

    'gd.crewOnly':    ['Crew only', 'Только рабочие'],
    'gd.crewPower':   ['Crew and power', 'Рабочие и энергия'],
    'gd.powerOnly':   ['Power only', 'Только энергия'],
    'gd.crewTill':    ['The crew empties the till for you. Less crew, slower.',
                       'Бригада сама опустошает кассу. Меньше людей, медленнее.'],
    'gd.crewBurn':    ['The crew burns the pile for you. Less crew, slower.',
                       'Бригада сама сжигает кучу. Меньше людей, медленнее.'],
    'practice.recTop':     ['★★ MUST TRY', '★★ ОБЯЗАТЕЛЬНО'],
    'practice.recGood':    ['★ WORTH A LOOK', '★ СТОИТ ВЗГЛЯНУТЬ'],

    'mg.title':       ['This one needs a mouse',
                       'Здесь нужна мышь'],
    'mg.body':        ['Earth ReGen is played with a mouse. You drag wires between sockets a ' +
                       'few pixels tall, and pick rubbish up by dragging across a tip. ' +
                       'There is no touch support yet.',
                       'В Earth ReGen играют мышью. Провода тянут между гнёздами высотой в ' +
                       'несколько пикселей, а мусор собирают, проводя курсором по куче. ' +
                       'Сенсорного управления пока нет.'],
    'mg.come':        ['Come back on a desktop or a laptop and it will play properly.',
                       'Зайдите с компьютера или ноутбука — там всё работает как надо.'],
    'mg.anyway':      ['Let me look anyway',
                       'Всё равно посмотреть'],

    'ui.menu':        ['Menu', 'Меню'],
    'ui.save':        ['Save', 'Сохранить'],
    'ui.close':       ['Close', 'Закрыть'],
    'ui.diamonds':    ['DIAMONDS', 'АЛМАЗЫ'],
    'ui.prisms':      ['PRISM', 'ПРИЗМА'],

    'ui.prismHead':    ['Prism', 'Призма'],
    'ui.prismWait':    ['waiting for %n more', 'ждёт ещё %n'],
    'ui.prismWorking': ['Working', 'Работает'],
    'ui.prismOut':     ['Output from the same input', 'Выход из того же сырья'],
    'ui.prismPower':   ['Power it needs', 'Нужно энергии'],
    'ui.prismCrew':    ['Crew it needs', 'Нужно рабочих'],
    'ui.prismBoth':    ['Power and crew it needs', 'Нужно энергии и рабочих'],
    'ui.prismTake':    ['TAKE OUT %n', 'ВЫНУТЬ %n'],
    'ui.prismSlotOut': ['Click to take it out', 'Нажмите, чтобы вынуть'],
    'ui.prismDrag':    ['Drag a Prism from the top bar onto this card or the machine.',
                        'Перетащите призму из верхней панели на эту карточку или на машину.'],
    'ui.skillTree':   ['SKILL TREE', 'ДЕРЕВО НАВЫКОВ'],
    'ui.fit':         ['Fit', 'Сброс'],
    'ui.codexTip':    ['Codex: everything in the game',
                       'Справочник — всё, что есть в игре'],
    'ui.afkTip':      ['What your machines produce, as they produce it. A till counts while it fills, not ' +
                       'when you press it, and hand work never counts.',
                       'Что производят ваши машины, в момент производства. Касса считается, пока ' +
                       'наполняется, а не когда вы её нажимаете, а работа руками не учитывается.'],
    'ui.codex':       ['CODEX', 'СПРАВОЧНИК'],
    'ui.ciSkills':    ['Machine Tree', 'Дерево машин'],
    'ui.moneySkills': ['Money Skills', 'Навыки денег'],

    'ui.selAll':      ['SELECT ALL HERE', 'ВЫБРАТЬ ВСЁ ЗДЕСЬ'],
    'ui.selAllDone':  ['%n machines selected', 'Выбрано машин: %n'],
    'ui.selAllNone':  ['No machines here to select', 'Здесь нет машин для выбора'],

    'ui.stats':       ['Stats', 'Статистика'],
    'ui.statsNote':   ['One reading every %s s of play, of what your machines really earned in that time. ' +
                       'The last %m minutes are kept with the run.',
                       'Одно измерение каждые %s с игры: сколько машины реально заработали за это время. ' +
                       'Последние %m минут хранятся вместе с забегом.'],
    'ui.statsCi':     ['Clean Index per hour', 'Индекс чистоты в час'],
    'ui.statsMoney':  ['Money per hour', 'Деньги в час'],
    'ui.statsNow':    ['Now', 'Сейчас'],
    'ui.statsAvg':    ['Average', 'В среднем'],
    'ui.statsPeak':   ['Peak', 'Пик'],
    'ui.statsWait':   ['Collecting the first readings. The graph starts after two of them, about %s s.',
                       'Собираем первые измерения. График появится после двух, примерно через %s с.'],
    'ui.statsAgo':    ['%m min ago', '%m мин назад'],
    'ui.statsNowX':   ['now', 'сейчас'],
    'ui.statsTip':    ['Click for the last hour.', 'Нажмите, чтобы увидеть последний час.'],

    'ui.dockFind':    ['Find a machine', 'Найти машину'],
    'ui.dockFindTip': ['Type part of a name. Enter picks up the first one, Esc clears.',
                       'Введите часть названия. Enter берёт первую, Esc очищает.'],
    'ui.dockNone':    ['No machine matches', 'Нет подходящих машин'],

    'ui.minimap':     ['Map', 'Карта'],
    'ui.minimapHide': ['Fold the map away', 'Свернуть карту'],
    'ui.minimapShow': ['Open the map', 'Развернуть карту'],
    'ui.minimapTip':  ['Click or drag to move the view', 'Нажмите или тяните, чтобы сдвинуть вид'],
    'ui.boosts':      ['Boosts', 'Усиления'],
    'ui.goals':       ['Goals', 'Цели'],
    'ui.blueprints':  ['Blueprints', 'Чертежи'],

    'ui.selMore':     ['SELECT MORE', 'ВЫБРАТЬ ЕЩЁ'],
    'ui.selMoreDone': ['DONE SELECTING', 'ГОТОВО'],
    'ui.selMoreNote': ['then tap other machines to add them, and move, demolish or save ' +
                       'the whole group at once',
                       'потом нажимайте на другие машины, чтобы добавить их, и переносите, ' +
                       'сносите или сохраняйте всю группу разом'],

    'ui.moveTo':      ['MOVE TO ANOTHER PLACE', 'ПЕРЕНЕСТИ В ДРУГОЕ МЕСТО'],
    'ui.moveNote':    ['nothing is charged and nothing is lost, and they keep everything ' +
                       'they have made',
                       'ничего не стоит и ничего не теряется — всё нажитое едет с ними'],
    'ui.moveHint':    ['Fly to where you want them and click to drop. Escape puts them back.',
                       'Летите куда нужно и щёлкните, чтобы поставить. Escape вернёт их.'],
    'ui.demolishNone': ['Nothing is selected to demolish',
                        'Не выбрано, что сносить'],
    'ui.moveNone':    ['Select a machine first, then press M',
                       'Сначала выберите машину, потом нажмите M'],

    'ui.flipNone':    ['Select a machine first, then press F',
                       'Сначала выберите машину, потом нажмите F'],
    'ui.flipStuck':   ['There are no sockets to turn round',
                       'Здесь нет разъёмов, чтобы разворачивать'],
    'ui.moveAlone':   ['There is nowhere else to go yet',
                       'Пока некуда переносить'],
    'ui.moveStuck':   ['An on-site machine belongs to its slot and stays put',
                       'Машина на участке привязана к своему слоту и остаётся на месте'],
    'ui.moveOnSite':  ['left behind: an on-site machine belongs to its slot',
                       'осталось на месте: машина на площадке принадлежит своему гнезду'],
    'ui.movingN':     ['MOVING % MACHINES', 'ПЕРЕНОС: % МАШИН'],
    'ui.movingOne':   ['MOVING 1 MACHINE', 'ПЕРЕНОС: 1 МАШИНА'],
    'ui.perHour':     ['/h', '/ч'],

    'ui.build':       ['Build', 'Строительство'],
    'ui.locked':      ['Locked', 'Закрыто'],
    'ui.free':        ['FREE', 'ДАРОМ'],
    'ui.max':         ['MAX', 'МАКС'],

    'ui.youHave':     ['you have', 'у вас'],
    'ui.shortBy':     ['short by', 'не хватает'],

    'ui.gridDown':    ['Grid down', 'Сеть обесточена'],
    'ui.restart':     ['RESTART', 'ЗАПУСТИТЬ'],
    'ui.gridBack':    ['The grid is back up', 'Сеть снова в строю'],
    'ui.allSections': ['All sections', 'Все разделы'],
    'ui.objectives':  ['OBJECTIVES', 'ЦЕЛИ'],
    'ui.trials':      ['TRIALS', 'ИСПЫТАНИЯ'],
    'ui.plan':        ['THE PLAN', 'ПЛАН'],

    'ui.outLimitHead': ['OUTPUT LIMIT (BLANK FOR NO LIMIT)',
                        'ПРЕДЕЛ ВЫДАЧИ — ПУСТО = БЕЗ ПРЕДЕЛА'],
    'ui.outLimitOff': ['No limit', 'Без предела'],

    'ui.flowLimitHead': ['OUTPUT LIMIT (BLANK FOR NO LIMIT)',
                        'ПРЕДЕЛ ВЫДАЧИ — ПУСТО = БЕЗ ПРЕДЕЛА'],
    'ui.flowLimitOff':  ['Take the limit off', 'Снять предел'],
    'ui.flowLimitNone': ['Gives whatever is asked for', 'Отдаёт столько, сколько просят'],
    'ui.flowLimitAt':   ['Capped at %s kg/h', 'Не больше %s кг/ч'],

    'ui.crewLimitNone': ['Passes on all the workforce that arrives', 'Передаёт всю рабочую силу, что приходит'],
    'ui.crewLimitAt':   ['Capped at %s', 'Не больше %s'],
    'ui.crewLimitLost': ['%s over the limit is lost', '%s сверх предела теряется'],
    'ui.laneLimitHead': ['SHELF %n: OUTPUT LIMIT (BLANK FOR NONE)',
                         'ПОЛКА %n: ПРЕДЕЛ ВЫДАЧИ (ПУСТО = БЕЗ ПРЕДЕЛА)'],
    'ui.laneEmpty':     ['empty, any material', 'пусто, любой материал'],
    'ui.fuelHead':      ['FUEL', 'ТОПЛИВО'],
    'ui.fuelRocket':    ['%k kg a flight, away %m min', '%k кг на полёт, в полёте %m мин'],
    'ui.fuelOil':       ['1 kg gives %k KW', '1 кг даёт %k кВт'],
    'ui.fuelReactor':   ['%k kg a run, %m min at full power', '%k кг на запуск, %m мин на полной мощности'],

    'ui.drainHead':   ['THE RESERVE', 'ЗАПАС'],
    'ui.drainFull':   ['Use it', 'Тратить'],
    'ui.drainHold':   ['Hold it', 'Беречь'],
    'ui.drainFullNote': ['Passes on what arrives, and draws the reserve for anything more',
                         'Отдаёт всё, что приходит, а сверх того берёт из запаса'],
    'ui.drainHoldNote': ['Passes on what arrives. The reserve is kept back',
                         'Отдаёт только то, что приходит. Запас не трогает'],

    'ui.drainAuto':   ['Auto', 'Само'],
    'ui.drainAutoNote': ['Passes on what arrives, and keeps it instead when the storage ahead is full',
                         'Отдаёт всё, что приходит, но придерживает, когда хранилище впереди полное'],
    'ui.drainAutoNow': ['Auto: keeping what arrives, the storage ahead is full',
                        'Само: придерживает — хранилище впереди полное'],

    'ui.inDev':       ['IN DEVELOPMENT', 'В РАЗРАБОТКЕ'],
    'ui.inDevNote':   ['Not in this build yet, but it is being made',
                       'Пока не в этой сборке — она в работе'],
    'ui.demoEndTitle': ['That is the demo. Thank you for playing',
                        'На этом демо заканчивается — спасибо, что играли'],
    'ui.demoEndText': ['Earth ReGen is in active development. Everything marked IN ' +
                       'DEVELOPMENT is being built: more places, more machines, an ' +
                       'ending. Your save keeps working, so keep cleaning, or come back ' +
                       'when the next build lands.',
                       'Earth ReGen активно разрабатывается. Всё, что помечено В РАЗРАБОТКЕ, ' +
                       'делается прямо сейчас: новые места, новые машины, финал. Сохранение ' +
                       'никуда не денется — продолжайте убирать или возвращайтесь, когда ' +
                       'выйдет следующая сборка.'],

    'ui.demoEndFollow': ['Press Follow on this page and itch will email you when the '
                       + 'next build lands.',
                        'Нажмите Follow на странице игры, и itch пришлёт письмо, когда '
                       + 'выйдет следующая сборка.'],

    'ui.demoEndGo':   ['Click anywhere to carry on', 'Нажмите в любом месте, чтобы продолжить'],

    'ui.calcHint':    ['You can type a sum here, like 1/3',
                       'Здесь можно писать выражение, например 1/3'],
    'ui.outLimitNone': ['Gives whatever is asked for', 'Отдаёт столько, сколько просят'],
    'ui.outLimitAt':  ['Capped at %s KW/h', 'Не больше %s кВт/ч'],
    'ui.planNote':    ['One step at a time, in order. Nothing here locks anything; it is a ' +
                       'signpost rather than a gate. Finishing an act pays a bonus.',
                       'По одному шагу, по порядку. Ничего здесь ничего не запирает — это ' +
                       'указатель, а не преграда. За завершённый акт платят премию.'],
    'ui.planStep':    ['Plan:', 'План:'],
    'ui.newPlaceTag': ['A NEW PLACE', 'НОВОЕ МЕСТО'],
    'ui.newPlaceOpen': ['is open', 'открыто'],
    'ui.builtBadge':  ['BUILT', 'ГОТОВ'],
    'ui.planAct':     ['Act finished:', 'Акт пройден —'],
    'ui.planAllDone': ['The Plan is complete:', 'План выполнен —'],
    'ui.planDone':    ['Every step is done. Thank you for playing this build.',
                       'Все шаги пройдены. Спасибо, что играли в эту сборку.'],
    'ui.actDone':     ['ACT COMPLETE', 'АКТ ПРОЙДЕН'],
    'ui.actReward':   ['Reward', 'Награда'],
    'ui.actNext':     ['Next', 'Дальше'],

    'ui.planComplete': ['PLAN COMPLETE', 'ПЛАН ВЫПОЛНЕН'],
    'ui.premise':     ['You began with your bare hands, one piece of rubbish at a time, and this ' +
                       'whole map grew from that. The real world is the same. Wherever you live, ' +
                       'a bag and an hour are enough to start. What our planet looks like tomorrow ' +
                       'depends on what each of us does today.',
                       'Вы начали голыми руками, по одному куску мусора за раз, и из этого выросла ' +
                       'вся эта карта. В настоящем мире всё так же. Где бы вы ни жили, чтобы ' +
                       'начать, хватит мешка и одного часа. Какой наша планета будет завтра, ' +
                       'зависит от того, что каждый из нас делает сегодня.'],

    'fc.title':       ['Full Circle', 'Полный круг'],
    'fc.lead':        ['You began with your bare hands. Full Circle takes you back there, ' +
                       'into a bigger world.',
                       'Вы начинали голыми руками. «Полный круг» возвращает вас туда же, ' +
                       'но в мир побольше.'],
    'fc.happens':     ['What happens', 'Что произойдёт'],
    'fc.h1':          ['Every machine and wire is removed, in every place.',
                       'Все машины и провода исчезнут, во всех местах.'],
    'fc.h2':          ['Clean Index and money go back to zero.',
                       'Индекс чистоты и деньги обнулятся.'],
    'fc.h3':          ['Both skill trees are unbought, so only the Wastelands are open.',
                       'Оба дерева навыков сбросятся, открытыми останутся только Пустоши.'],
    'fc.keep':        ['What you keep', 'Что останется'],
    'fc.k1':          ['Your diamonds, and the Capacity levels you bought with them.',
                       'Алмазы и уровни «Вместимости», купленные за них.'],
    'fc.k2':          ['Objectives and Trials you have won, and the machines Trials unlocked.',
                       'Выполненные цели и испытания, и машины, которые открыли испытания.'],
    'fc.k3':          ['Your blueprints, so a factory can be stamped back down in one go.',
                       'Чертежи: завод можно поставить обратно одним движением.'],
    'fc.k4':          ['Your records, your time played, and every note you have read.',
                       'Ваши рекорды, время в игре и все прочитанные подсказки.'],

    'fc.k5':          ["Your best Outreach Hub's recruits and your best Grid Foundry's arrays. " +
                       'The first one of each you build again starts with them.',
                       'Рекруты вашего лучшего Центра агитации и массивы лучшей Энерголитейной. ' +
                       'Первая такая машина, построенная заново, начнёт с ними.'],
    'fc.c3':          ['A hand sweep is worth %w times more, so the start is quicker.',
                       'Уборка руками приносит в %w раз больше, поэтому начало быстрее.'],
    'fc.change':      ['What changes', 'Что изменится'],
    'fc.c1':          ['Every Trash Site, grove, pool, spill and waste site holds %m times more.',
                       'Каждая свалка, роща, пруд, разлив и площадка отходов вмещает в %m раз больше.'],
    'fc.c2':          ['Every build limit on the Capacity board is %c times higher, so a limit of ' +
                       '%a becomes %b. Diamond levels still add on top.',
                       'Каждый лимит построек на панели «Вместимость» в %c раза выше: лимит %a ' +
                       'становится %b. Уровни за алмазы добавляются сверху, как раньше.'],
    'fc.good':        ['Good', 'Плюсы'],
    'fc.g1':          ['Each place lasts much longer, with room for bigger factories.',
                       'Каждое место служит намного дольше, и в нём хватит места для больших заводов.'],
    'fc.g2':          ['More generators and workers at once, so the new run grows faster.',
                       'Больше генераторов и рабочих одновременно, поэтому новый забег растёт быстрее.'],
    'fc.g3':          ['Blueprints and diamonds make the first hour quick.',
                       'Чертежи и алмазы делают первый час быстрым.'],
    'fc.bad':         ['Bad', 'Минусы'],
    'fc.b1':          ['Everything you built is gone for good.',
                       'Всё, что вы построили, исчезнет навсегда.'],
    'fc.b2':          ['The Plan does not come back, and its rewards are not paid again.',
                       'План не вернётся, и его награды не выплачиваются снова.'],
    'fc.b3':          ['You can do this once, and it cannot be undone.',
                       'Это можно сделать один раз, и отменить нельзя.'],
    'fc.cancel':      ['Keep my world', 'Оставить мой мир'],
    'fc.go':          ['Go Full Circle', 'Пройти полный круг'],
    'fc.arm':         ['Press again to start over', 'Нажмите ещё раз, чтобы начать заново'],
    'fc.done':        ['Full Circle. A bigger world, and your own two hands.',
                       'Полный круг. Мир побольше и ваши собственные руки.'],
    'fc.planLead':    ['You can start over in a world %m times bigger.',
                       'Можно начать заново в мире, который в %m раз больше.'],
    'fc.planBtn':     ['See what Full Circle does', 'Что даёт «Полный круг»'],
    'fc.planAfter':   ['Full Circle done. Every site in this world is %m times bigger.',
                       'Полный круг пройден. Каждый участок в этом мире в %m раз больше.'],
    'ui.devHidden':   ['Dev strip hidden. Press ` to bring it back',
                       'Панель разработчика скрыта — нажмите `, чтобы вернуть'],
    'ui.planHide':    ['Hide this line', 'Скрыть эту строку'],
    'ui.planHidden':  ['Hidden. The Plan is still on the Objectives board.',
                       'Скрыто. План остался на доске Целей.'],
    'ui.boostsCaps':  ['BOOSTS', 'УСИЛЕНИЯ'],
    'ui.claim':       ['CLAIM', 'ЗАБРАТЬ'],

    'ui.andA':        ['and a', 'и'],
    'ui.claimed':     ['CLAIMED', 'ПОЛУЧЕНО'],
    'ui.objDone':     ['OBJECTIVE DONE', 'ЦЕЛЬ ВЫПОЛНЕНА'],
    'ui.ciTreeNote':  ['Clean Index skills unlock new machines. Clean Index is a score, not money: taking a ' +
                       'skill spends none of it.',
                       'Навыки Индекса Чистоты открывают новые машины. Индекс чистоты — это счёт, а не деньги: ' +
                       'навык его не тратит.'],
    'ui.moneyTreeNote':['Money skills only upgrade machines you already have. Buying one ' +
                       'reveals what comes after it, so the tree unfolds as you go.',
                       'Денежные навыки улучшают только те машины, которые у вас уже есть. ' +
                       'Покупка одного открывает следующий, так что дерево раскрывается по ' +
                       'ходу игры.'],
    'ui.trialsNote':  ['The long way round. Every one of these pays at least',
                       'Долгий путь. Каждое из них приносит не меньше'],
    'ui.capacity':    ['CAPACITY', 'ВМЕСТИМОСТЬ'],

    'ui.trialDone':       ['TRIAL COMPLETE', 'ИСПЫТАНИЕ ПРОЙДЕНО'],
    'ui.trialWaiting':    ['%r waiting in %g', '%r ждут в разделе «%g»'],
    'ui.trialNewMachine': ['NEW MACHINE', 'НОВАЯ МАШИНА'],
    'ui.trialInDock':     ['In the build dock, under %g', 'В меню строительства, в разделе «%g»'],
    'ui.trialClaimed':    ['TRIAL CLAIMED', 'НАГРАДА ПОЛУЧЕНА'],

    'ui.notEnough':   ['NOT ENOUGH %s', 'НЕ ХВАТАЕТ %s'],
    'ui.cxBoosts':    ['BOOSTS &amp; GOALS', 'УСИЛЕНИЯ И ЦЕЛИ'],

    'ui.or':          [' or ', ' или '],
    'ui.listSep':     [', ', ', '],
    'ui.machines':    ['machines', 'машин'],
    'ui.machinesN':   ['machine|machines', 'машина|машины|машин'],
    'ui.instant':     ['instant', 'мгновенно'],
    'ui.sunIsUp':     ['the sun is up', 'солнце уже взошло'],

    'ui.boostGo':     ['ACTIVATE', 'ЗАПУСТИТЬ'],
    'ui.boostRestart':['RESTART', 'ПРОДЛИТЬ'],
    'ui.boostUse':    ['USE', 'ПРИМЕНИТЬ'],
    'ui.boostLeft':   ['%t left', 'осталось %t'],
    'ui.boostUsed':   ['used %n×', 'использован %n×'],

    'ui.ciAbbr':      ['CI', 'ИЧ'],
    'ui.ciPerH':      ['CI/h', 'ИЧ/ч'],

    'ui.stopped':     ['Attention', 'Внимание'],

    'ui.stoppedTip':  ['Machines that need you. Press to visit them one by one',
                       'Машины, которым нужно ваше внимание — нажмите, чтобы обойти их по очереди'],

    'ui.kwPerKg':     ['KW/h per kg/h', 'кВт/ч на кг/ч'],
    'ui.wfPerKg':     ['WF/h per kg/h', 'РС/ч на кг/ч'],
    'ui.ciPerWf':     ['CI/h per WF/h', 'ИЧ/ч на РС/ч'],
    'ui.kwStore':     ['KW store', 'кВт запаса'],
    'ui.kwPerKgBurn': ['KW/h per kg/h burned', 'кВт/ч на кг/ч сожжённого'],
    'ui.ciPerKgBurn': ['CI per kg burned', 'ИЧ за сожжённый кг'],
    'ui.ciPerKw':     ['CI/h per KW/h', 'ИЧ/ч на кВт/ч'],

    'ui.ciCostPerKw': ['CI given up per KW/h', 'ИЧ отдаётся за кВт/ч'],
    'ui.makes':       ['make', 'дают'],

    'ui.pressesGem':  ['presses %n %c, one more every %e batches',
                       'выдаёт %n %c, ещё один каждые %e партий'],
    'ui.perKgBurned': ['per kg burned', 'на сожжённый кг'],

    'ui.kgOf':        ['kg', 'кг'],

    'ui.kwOf':        ['KW', 'кВт'],
    'ui.aBatch':      ['a batch', 'за партию'],

    'ui.wfOf':        ['WF-hours of building', 'чел-часов строительства'],

    'ui.paysCi':      ['then pays %n for ever', 'потом даёт %n навсегда'],

    'ui.gemIn':       ['%n %c in %t', '%n %c через %t'],

    'ui.printIn':     ['in %t', 'через %t'],
    'ui.usePrinted':  ['PRINTED ×%n', 'НАПЕЧАТАНО ×%n'],
    'ui.meltdown':    ['MELTDOWN', 'РАСПЛАВ'],
    'ui.saved':       ['SAVED', 'ИЗ ЗАПАСА'],
    'ui.maxAtOnce':   ['max %n at once', 'не больше %n сразу'],

    'ui.onePerPlace':    ['one per place', 'одна на место'],
    'ui.maxPerPlace':    ['max %n per place', 'не больше %n на место'],
    'ui.onePerPlaceTip': ['Only one can be built in each place.', 'В каждом месте можно построить только одну.'],
    'ui.maxPerPlaceTip': ['Up to %n can be built in each place.', 'В каждом месте можно построить не больше %n.'],
    'ui.here':           ['here', 'здесь'],

    'ui.powerUpBy':   ['%k kg of %r is +%m on it for good, and the next load wants %g kg more',
                       '%k кг «%r» — это +%m навсегда, а следующая порция просит на %g кг больше'],
    'ui.kgPerWf':     ['kg/h per WF/h', 'кг/ч на РС/ч'],

    'ui.upTo':        ['up to %n', 'до %n'],
    'ui.kgOutPerIn':  ['kg out per kg in', 'кг на выходе с кг на входе'],
    'ui.tillOf':      ['till of', 'касса на'],
    'ui.per':         ['per', 'на'],
    'ui.licenceFor':  ['%c for %m min of running', '%c за %m мин работы'],
    'ui.fissionLoad': ['%k kg runs it %m min at %p KW/h', '%k кг — %m мин работы при %p кВт/ч'],
    'ui.rocketFlightGems': ['%m min away, back with %k diamonds and %c CI',
                            '%m мин в полёте, назад с алмазами (%k) и %c ИЧ'],
    'ui.rocketFlight': ['%m min away, back with %k of metal and %c CI',
                        '%m мин в полёте, назад с %k металла и %c ИЧ'],
    'ui.boostNote':   ['Boosts last %t and expire on their own. They stack freely. Every %n ' +
                       'uses, a boost costs %d ◆ more.',
                       'Усиления длятся %t и заканчиваются сами. Они свободно складываются. ' +
                       'Каждые %n применений усиление дорожает на %d ◆.'],
    'ui.boostFirstFree':['Your first one is free, so take any of them.',
                       'Первое бесплатно — берите любое.'],

    'ui.built':       ['built', 'построено'],

    'ui.selCount':    ['%n machines selected', 'выбрано машин: %n'],
    'ui.close':       ['Close', 'Закрыть'],
    'ui.selClear':    ['Clear selection', 'Снять выделение'],
    'ui.selDesc':     ['Drag any one to move the whole group. Shift-click a machine to add or drop it, or ' +
                       'Shift-drag a box round several.',
                       'Тяните любую, чтобы двигать всю группу. Shift и щелчок добавляют или убирают машину, ' +
                       'а Shift с перетаскиванием обводит несколько.'],
    'ui.selWires':    ['Wires inside the group', 'Проводов внутри группы'],
    'ui.bpName':      ['name it (optional)', 'название (необязательно)'],
    'ui.bpSave':      ['SAVE %n MACHINES', 'СОХРАНИТЬ МАШИН: %n'],
    'ui.bpSaveOne':   ['SAVE 1 MACHINE', 'СОХРАНИТЬ 1 МАШИНУ'],
    'ui.bpOnSite':    ['%n of them stand in a plot and cannot be saved, because they belong ' +
                       'to their slot',
                       '%n из них стоят в площадке и не сохраняются — они принадлежат ' +
                       'своему гнезду'],
    'ui.bpKeeps':     ['the wiring between them is kept', 'провода между ними сохраняются'],
    'ui.bpRename':    ['Click to rename', 'Нажмите, чтобы переименовать'],
    'ui.bpNeed':      ['need %s more', 'не хватает %s'],
    'ui.demoConfirmAll': ['PRESS AGAIN TO DEMOLISH ALL %n',
                       'НАЖМИТЕ ЕЩЁ РАЗ, ЧТОБЫ СНЕСТИ ВСЕ %n'],
    'ui.splitHead':   ['SPLIT RATIO, ANY TWO NUMBERS', 'ПРОПОРЦИЯ ДЕЛЕНИЯ — ЛЮБЫЕ ДВА ЧИСЛА'],
    'ui.splitEven':   ['Split evenly', 'Поровну'],
    'ui.splitHead5':  ['SPLIT RATIO, ANY FIVE NUMBERS', 'ПРОПОРЦИЯ ДЕЛЕНИЯ, ЛЮБЫЕ ПЯТЬ ЧИСЕЛ'],

    'ui.splitByRatio':  ['Ratio', 'Пропорция'],
    'ui.splitByAmount': ['Amount', 'Количество'],
    'ui.splitHeadAmt':  ['A GETS THIS MUCH, B GETS THE REST', 'A ПОЛУЧАЕТ СТОЛЬКО, B — ОСТАЛЬНОЕ'],
    'ui.splitHeadAmt5': ['A TO D GET THESE IN ORDER, E GETS THE REST', 'A–D ПОЛУЧАЮТ СТОЛЬКО ПО ПОРЯДКУ, E — ОСТАЛЬНОЕ'],
    'ui.splitRest':     ['the rest', 'остальное'],

    'ui.prioHead':    ['PRIORITY OUTPUT', 'ПРИОРИТЕТНЫЙ ВЫХОД'],
    'ui.prioSide':    ['Output %s', 'Выход %s'],
    'ui.prioOn':      ['Everything goes to %s', 'Всё идёт на %s'],
    'ui.prioOff':     ['%s cannot use any, so everything goes to %s', '%s сейчас не берёт, всё идёт на %s'],
    'ui.hireHead':    ['TAKE ON CASUAL LABOUR', 'НАНЯТЬ ВРЕМЕННЫХ РАБОЧИХ'],
    'ui.hireShift':   ['%s shift', 'смена %s'],
    'ui.hireHand':    ['%n hand', '%n рабочий'],
    'ui.hireHands':   ['%n hands', '%n рабочих'],
    'ui.hireGo':      ['HIRE %n  %c', 'НАНЯТЬ %n  %c'],
    'ui.hireFull':    ['ALL %n WORKING', 'ВСЕ %n РАБОТАЮТ'],
    'ui.hireOff':     ['%n% off', 'скидка %n%'],
    'ui.hireEnds':    ['next contract ends in %s', 'ближайший контракт кончится через %s'],
    'ui.hireWorks':   ['each hand works %s', 'каждый работает %s'],

    'ui.capsNote':    ['These machines make something out of nothing, so there is a limit on ' +
                       'how many can stand at once. Each level adds %n, and the five of them ' +
                       'cost %c ◆. Some of the cheaper machines are cheaper to raise.',
                       'Эти машины делают что-то из ничего, поэтому есть предел на то, ' +
                       'сколько их может стоять разом. Каждый уровень добавляет %n, а все ' +
                       'пять стоят %c ◆. Для машин подешевле и уровни дешевле.'],
    'ui.capsEmpty':   ['Nothing with a build limit is unlocked yet.',
                       'Пока не открыто ничего, у чего есть предел на постройку.'],

    'sk.lv':          ['LV', 'УР'],

    'sk.unknown':     ['Not known yet. Reach the number and take it to find out what it opens.',
                       'Пока неизвестно. Наберите число и возьмите навык — тогда и узнаете, ' +
                       'что он открывает.'],
    'sk.now':         ['now', 'сейчас'],
    'sk.perLevel':    ['per level', 'за уровень'],
    'sk.handSweep':   ['Hand sweep', 'Уборка руками'],
    'sk.handPlant':   ['Hand planting', 'Посадка руками'],
    'sk.unlocks':     ['Unlocks node:', 'Открывает машину:'],
    'sk.gains':       ['gains %r input', 'получает вход «%r»'],
    'sk.value':       ['value', 'цена'],

    'lv.up':          ['LEVEL', 'УРОВЕНЬ'],
    'lv.new':         ['UNLOCKED', 'ОТКРЫТО'],

    'ui.locked':      ['LOCKED', 'ЗАКРЫТО'],

    'ui.newTag':      ['NEW', 'НОВОЕ'],

    'of.head':        ['WHILE YOU WERE AWAY', 'ПОКА ВАС НЕ БЫЛО'],
    'of.away':        ['away', 'отсутствия'],
    'of.counted':     ['counted', 'засчитано'],
    'of.cleaned':     ['cleaned', 'убрано'],
    'of.trash':       ['Trash cleaned', 'Мусора убрано'],

    'of.nothing':     ['Nothing was banked.', 'Ничего не начислено.'],
    'of.slower':      ['Time away counts %n× slower', 'Время без игры идёт в %n раз медленнее'],
    'ts.tab':         ['Your Tree', 'Ваше древо'],
    'ts.skills':      ['skills owned', 'навыков открыто'],
    'ts.levels':      ['levels bought', 'уровней куплено'],
    'ts.spent':       ['spent on upgrades', 'потрачено на улучшения'],
    'ts.ciSkills':    ['Clean Index skills', 'навыков за Индекс Чистоты'],
    'ts.empty':       ['Nothing bought yet. Every skill you buy will be listed here, with what it changed.',
                       'Пока ничего не куплено. Каждый купленный навык появится здесь — с тем, что он изменил.'],
    'ts.note':        ['Everything your skills have changed, from what it was to what it is now.',
                       'Всё, что изменили ваши навыки: от того, что было, к тому, что стало.'],
    'sk.tillCap':     ['till capacity', 'вместимость кассы'],
    'sk.perBatch':    ['per batch', 'за партию'],
    'sk.perPrint':    ['per print', 'за оттиск'],
    'sk.metalPerFlight': ['metal per flight', 'металл за полёт'],
    'sk.extraGemPct':    ['chance of an extra diamond a flight', 'шанс лишнего алмаза за полёт'],
    'sk.holdGems':       ['diamonds the hold keeps', 'алмазов в трюме'],
    'sk.tray':           ['prisms of diamonds on the bar', 'запас алмазов, в призмах'],
    'sk.luckPct':        ['chance to find a coin', 'шанс найти монету'],
    'sk.visitSec':       ['a balloon crate lasts', 'ящик с шара действует'],
    'sk.gustGap':        ['time between gusts', 'время между порывами'],
    'sk.goldSec':        ['Golden Hour after sunrise', 'золотой час после рассвета'],
    'sk.windPct':        ['chance to stay one more shift', 'шанс остаться ещё на смену'],
    'sk.hiredHands':     ['Hired hands', 'Нанятые работники'],
    'sk.petName':        ['Rain on restored ground', 'Дождь на восстановленной земле'],
    'sk.petCi':          ['CI an hour on each restored ground', 'ИЧ в час с каждого восстановленного участка'],
    'sk.coreName':       ['Prism in a reactor', 'Призма в реакторе'],
    'sk.coreMelt':       ['seconds before the core melts', 'секунд до расплавления ядра'],
    'ui.petrichor':      ['Petrichor', 'Петрикор'],
    'sk.conName':        ['Star groups', 'Созвездия'],
    'sk.conPct':         ['chance on a night', 'шанс за ночь'],
    'con.greatBear':     ['Great Bear', 'Большая Медведица'],
    'con.littleBear':    ['Little Bear', 'Малая Медведица'],
    'con.cassiopeia':    ['Cassiopeia', 'Кассиопея'],
    'con.cygnus':        ['Cygnus', 'Лебедь'],
    'con.leo':           ['Leo', 'Лев'],
    'con.draco':         ['Draco', 'Дракон'],
    'sk.aurName':        ['Northern lights', 'Северное сияние'],
    'sk.aurPct':         ['chance on a night', 'шанс за ночь'],
    'ui.aurora':         ['Aurora', 'Сияние'],
    'sk.gemName':        ['A ground restored', 'Участок восстановлен'],
    'sk.gemPct':         ['chance of a diamond', 'шанс алмаза'],
    'sk.noteName':       ['A Storm ends', 'Конец шторма'],
    'sk.notePct':        ['chance of a banknote', 'шанс банкноты'],
    'sk.moonName':       ['Full moon', 'Полнолуние'],
    'sk.moonPct':        ["Solar Panels' share of day power", 'доля дневной энергии солнечных панелей'],
    'ui.fullMoon':       ['Full moon', 'Полнолуние'],
    'sk.calmName':       ['After a Storm', 'После шторма'],
    'sk.calmSec':        ['turbines slow down over', 'турбины замедляются за'],
    'sk.gridName':       ['Grid after a strike', 'Сеть после удара молнии'],
    'sk.gridBack':       ['time to come back on its own', 'время до самовосстановления'],
    'sk.starName':       ['Shooting star', 'Падающая звезда'],
    'sk.starSec':        ['a caught star\'s boost lasts', 'ускорение от пойманной звезды длится'],
    'ui.holdGems':       ['%n / %c diamonds', 'алмазов: %n / %c'],
    'sk.flightTime':  ['flight time', 'время полёта'],
    'sk.ciPerDome':   ['Clean Index per dome', 'Индекс чистоты за купол'],

    'sk.meteors':     ['Meteorites', 'Метеориты'],
    'sk.diamonds':    ['Diamonds', 'Алмазы'],
    'sk.boosts':      ['Boosts', 'Усиления'],
    'sk.away':        ['Time away', 'Время вне игры'],
    'sk.rockChance':  ['chance a minute', 'шанс в минуту'],
    'sk.rareChance':  ['rare one chance', 'шанс редкого'],
    'sk.rockKg':      ['mass', 'масса'],
    'sk.rockMax':     ['on the ground at once', 'на земле одновременно'],
    'sk.dayLen':      ['day length', 'длина дня'],
    'sk.nightLen':    ['night length', 'длина ночи'],
    'sk.gemEvery':    ['time between', 'время между'],
    'sk.boostLen':    ['timed boost length', 'длительность усиления'],
    'sk.offlineRate': ['progress while away', 'прогресс вне игры'],
    'sk.perKgMade':   ['per kg made', 'на кг продукции'],

    'sk.powerMul':    ['what one load is worth', 'сколько даёт одна порция'],

    'sk.kitPerLoad':  ['kit per load', 'комплекта на порцию'],
    'sk.banked':      ['banked per', 'копится на'],
    'sk.warnLead':    ['warning time', 'время предупреждения'],
    'sk.reactorKw':   ['reactor power', 'мощность реактора'],
    'sk.handsAtOnce': ['hands at once', 'рабочих разом'],
    'sk.odDrain':     ['overdrive draw', 'расход разгона'],
    'sk.shiftLen':    ['shift length', 'длина смены'],
    'sk.longestShift':['longest shift', 'самая долгая смена'],
    'sk.kwPerRecruit':['energy per recruit', 'энергии на сторонника'],
    'sk.wfPerRecruit':['workforce per recruit', 'рабочей силы на сторонника'],
    'sk.f.wfRate':    ['workforce', 'рабочая сила'],
    'sk.f.energyRate':['energy', 'энергия'],
    'sk.f.intakeRate':['wire intake', 'приём по проводу'],
    'sk.f.processRate':['throughput', 'пропускная способность'],
    'sk.f.ciPerEntry':['yield', 'отдача'],
    'sk.f.ciPerWF':   ['CI per WF/h', 'ИЧ на РС/ч'],
    'sk.f.ciPerKW':   ['CI per KW/h', 'ИЧ на кВт/ч'],
    'sk.f.store':     ['charge', 'заряд'],
    'sk.f.need':      ['recruit cost', 'цена сторонника'],

    'sk.f.kwPerKg':   ['energy per kg', 'энергия на кг'],
    'sk.f.licence':   ['a shift costs', 'смена стоит'],
    'sk.f.blockChance':['grid spared', 'сеть уцелела'],
    'sk.f.ciPerKw':   ['CI spent per KW/h', 'ИЧ за кВт/ч работы'],
    'sk.f.pumpPerKw': ['water per KW/h', 'вода за кВт/ч'],

    'sk.f.buffer':    ['capacity', 'вместимость'],

    'sk.f.maxKw':     ['most power it uses', 'предел мощности'],

    'sk.f.interestPct': ['interest a minute', 'процент в минуту'],

    'sk.f.returnBonus': ['CI on water put back', 'ИЧ за возвращённую воду'],
    'sk.f.byKg':        ['oil per kg cleaned', 'нефть на кг очищенной'],
    'sk.goldHeld':      ['gold it holds', 'вмещает золота'],

    'ui.agNoDock':      ['Put it on a Bank, between the two posts', 'Поставьте его на Банк, между двумя столбиками'],
    'ui.agBudget':      ['Saved from the Bank: %b of %p', 'Накоплено от Банка: %b из %p'],

    'ui.agOrderHead':   ['Hires first at', 'Сначала нанимает в'],
    'ui.agPosts':       ['Hiring Posts', 'Пунктах найма'],
    'ui.agExchanges':   ['Labour Exchanges', 'Биржах труда'],
    'ui.agContract':    ['Labour Exchange contract', 'Контракт на Бирже труда'],
    'ui.agSound':       ['Hire sound', 'Звук найма'],
    'ui.autoLaunch':    ['Launch by itself', 'Запускать само'],
    'ui.autoStart':     ['Start by itself', 'Включать само'],
    'ui.agSoundOn':     ['On', 'Вкл'],
    'ui.agSoundOff':    ['Off', 'Выкл'],
    'ui.agFound':       ['Here: %p Hiring Posts, %e Labour Exchanges', 'Здесь: пунктов найма %p, бирж труда %e'],

    'ui.agFound2':      ['Here: %p, %e', 'Здесь: %p, %e'],
    'ui.agPost1':       ['%n Hiring Post', 'пунктов найма %n'],
    'ui.agPostN':       ['%n Hiring Posts', 'пунктов найма %n'],
    'ui.agEx1':         ['%n Labour Exchange', 'бирж труда %n'],
    'ui.agExN':         ['%n Labour Exchanges', 'бирж труда %n'],
    'ui.agSaved':       ['saved from the Bank %b', 'накоплено от Банка %b'],

    'ui.agPostsHead':   ['Hire at the Hiring Posts here', 'Нанять в пунктах найма этого места'],
    'ui.agPostsFull':   ['ALL POSTS FULL', 'ВСЕ ПУНКТЫ ЗАНЯТЫ'],
    'ui.agNoPosts':     ['NO HIRING POST HERE', 'ЗДЕСЬ НЕТ ПУНКТА НАЙМА'],
    'ui.agExHead':      ['Hire at Labour Exchanges', 'Нанять на биржах труда'],
    'ui.agExFull':      ['ALL EXCHANGES FULL', 'ВСЕ БИРЖИ ЗАНЯТЫ'],
    'ui.agNoEx':        ['NO LABOUR EXCHANGE HERE', 'ЗДЕСЬ НЕТ БИРЖИ ТРУДА'],
    'ui.agManualNote':  ['it hires only when you press. On a Bank it hires by itself',
                         'нанимает только по нажатию. На Банке нанимает само'],
    'ui.agOnce':        ['The hands below, then waits', 'Сколько указано, потом ждёт'],
    'ui.agEach':        ['One by one', 'По одному'],
    'ui.bankSpot':      ['Room for an Agency', 'Место для агентства'],
    'ui.bankSpotYes':   ['Yes', 'Да'],
    'ui.bankSpotNo':    ['No', 'Нет'],
    'sk.ciPerKgBuried': ['CI per kg buried', 'ИЧ за кг захоронения'],

    'ui.overdrive':   ['Overdrive: x%o work, x%d power', 'Форсаж: x%o работы, x%d энергии'],
    'ui.odOn':        ['OVERDRIVE', 'ФОРСАЖ'],
    'ui.odOff':       ['STEADY', 'РОВНО'],
    'sk.f.kwPerWf':   ['power per WF/h', 'энергия на РС/ч'],
    'sk.f.bank':      ['charge cell', 'аккумулятор'],

    'sk.gate':        ['Requires the %s', 'Требуется: %s'],
    'sk.freeBare':    ['Free. Every Trash Site here is gone',
                       'Бесплатно — все свалки здесь вычищены'],

    'sk.freeWorked':  ['Free. There is nothing left to work below',
                       'Бесплатно — внизу больше нечего делать'],
    'sk.weatherStat': ['Weather', 'Погода'],

    'tut.skip':       ['Skip tutorial', 'Пропустить обучение'],
    'tut.gotIt':      ['Got it', 'Понятно'],
    'tut.remindLater':['Remind me later', 'Напомнить позже'],
    'tut.iKnow':      ['I know about that', 'Я знаю об этом'],
    'tut.tip':        ['TIP', 'СОВЕТ'],

    'cx.machines':    ['MACHINES', 'МАШИНЫ'],
    'cx.materials':   ['MATERIALS', 'МАТЕРИАЛЫ'],
    'cx.weather':     ['WEATHER', 'ПОГОДА'],
    'cx.controls':    ['CONTROLS', 'УПРАВЛЕНИЕ'],
    'cx.note':        ['Everything here is read from the game itself, so it can never be out of date.',
                       'Всё здесь читается из самой игры — устареть это не может.'],
    'cx.watchOut':    ['WATCH OUT', 'ОСТОРОЖНО'],
    'cx.whyBuild':    ['WHY BUILD IT', 'ЗАЧЕМ СТРОИТЬ'],
    'cx.noteLbl':     ['NOTE', 'ПРИМЕЧАНИЕ'],
    'cx.in':          ['IN', 'ВХОД'],
    'cx.out':         ['OUT', 'ВЫХОД'],
    'cx.none':        ['none', 'нет'],

    'cx.machineUnknown': ['Not known yet. Buy the skill in front of this one to find out ' +
                          'what it does.',
                          'Пока неизвестно. Купите навык перед этим, чтобы узнать, что она делает.'],
    'cx.currencies':  ['Currencies', 'Валюты'],
    'cx.materialsHead':['Materials', 'Материалы'],
    'cx.moreMat':     ['More materials show up here once you unlock a machine that makes them.',
                       'Новые материалы появятся здесь, когда вы откроете машину, которая их делает.'],
    'cx.moreWx':      ['Each kind of weather shows up here the first time it reaches you.',
                       'Каждая погода появится здесь, когда впервые до вас доберётся.'],
    'cx.objectivesHead':['Objectives', 'Цели'],
    'cx.worth':       ['worth %v a kg', 'стоит %v за кг'],
    'cx.flowRate':    ['a continuous rate, never stored',
                       'непрерывный поток, нигде не хранится'],
    'cx.flowMaterial':['kilograms, pulled from a buffer',
                       'килограммы, которые забирают из буфера'],
    'cx.min':         ['min', 'мин'],
    'cx.wxIntro':     ['Cataclysms sweep %p only. Each place with a sky rolls its own, once a ' +
                       'minute, one at a time.',
                       'Катаклизмы бывают только в %p. В каждом месте с небом своя погода: ' +
                       'один бросок в минуту, по одному за раз.'],
    'cx.wxAnd':       ['and', 'и'],

    'cx.wxStack':     ['<b>Weather and boosts add up rather than multiplying.</b> Two things ' +
                       'lifting the same number each add their own bonus, so Rain &times;2 on ' +
                       'planting during a Grove Rush &times;2 comes to &times;3. Two things ' +
                       'lifting different numbers do still multiply, so Rally and Grove Rush ' +
                       'both count in full. A multiplier of zero stops the machine dead.',
                       '<b>Погода и бусты складываются, а не перемножаются.</b> Два эффекта, ' +
                       'поднимающие одно и то же число, добавляют каждый свою прибавку: дождь ' +
                       '&times;2 на посадке во время Рывка рощи &times;2 даёт &times;3. Если ' +
                       'числа разные, они по-прежнему перемножаются, и Митинг с Рывком рощи ' +
                       'считаются оба. Множитель ноль останавливает машину полностью.'],
    'cx.boostIntro':  ['Bought with diamonds. A boost <b>multiplies</b> where a skill adds, ' +
                       'so it lifts the upgrades you already own. Two of them on the ' +
                       '<b>same</b> number add their bonuses instead: &times;3 and &times;2 ' +
                       'comes to &times;4.',
                       'Покупаются за алмазы. Буст <b>умножает</b> там, где навык прибавляет, ' +
                       'поэтому он поднимает и уже купленные улучшения. Два буста на ' +
                       '<b>одно</b> число складывают прибавки: &times;3 и &times;2 дают ' +
                       '&times;4.'],
    'cx.hourNote':    ['One in-game hour is one real minute, and every rate you see is per ' +
                       'in-game hour.',
                       'Один игровой час равен одной реальной минуте, и все скорости указаны ' +
                       'за игровой час.'],
    'cx.replay':      ['REPLAY THE TUTORIAL', 'ПРОЙТИ ОБУЧЕНИЕ ЗАНОВО'],

    'cx.ctlSweepK':   ['Move the cursor into a plot', 'Навести курсор на участок'],
    'cx.ctlSweepV':   ['Picks up Clean Index by hand, once each time you go in. On a Grove ' +
                       'Plot the same move plants a tree. A machine standing there stops ' +
                       'both.',
                       'Собирает Индекс Чистоты руками, по разу за каждый заход. На Роще то ' +
                       'же движение сажает дерево. Машина, стоящая там, не даёт делать ни то, ' +
                       'ни другое.'],

    'cx.ctlSweepDragK': ['Drag across a plot', 'Провести по участку'],
    'cx.ctlSweepDragV': ['Hold and sweep to pick up Clean Index by hand. The further you ' +
                       'sweep inside the plot the more you get. On a Grove Plot the same ' +
                       'move plants trees. A machine standing there stops both.',
                       'Прижмите и водите, собирая Индекс Чистоты руками. Чем дальше ' +
                       'проведёте внутри участка, тем больше соберёте. На Роще то же ' +
                       'движение сажает деревья. Машина, стоящая там, не даёт делать ' +
                       'ни то, ни другое.'],
    'cx.ctlClickK':   ['Click a machine', 'Щелчок по машине'],
    'cx.ctlClickV':   ['Opens its panel, where DEMOLISH lives',
                       'Открывает её панель, где находится кнопка СНЕСТИ'],
    'cx.ctlShiftK':   ['Shift-click machines', 'Shift + щелчок по машинам'],
    'cx.ctlShiftV':   ['Select several. Drag any one to move the group, demolish them ' +
                       'together, or save them as a blueprint, wiring and all.',
                       'Выделяет несколько. Потяните любую, чтобы сдвинуть всю группу, ' +
                       'снесите их разом или сохраните как чертёж — вместе с проводами.'],

    'cx.ctlBandK':    ['Shift-drag empty ground', 'Shift + перетаскивание по пустому месту'],
    'cx.ctlBandV':    ['Draws a box and adds every machine inside it to the selection. ' +
                       'A plain drag still moves the map.',
                       'Рисует рамку и добавляет все машины внутри неё к выделению. ' +
                       'Обычное перетаскивание по-прежнему двигает карту.'],

    'cx.ctlBandBoxK': ['Drag empty ground', 'Перетаскивание по пустому месту'],
    'cx.ctlBandBoxV': ['Draws a box and picks every machine inside it. Hold Shift to add to what is picked.',
                       'Рисует рамку и выделяет все машины внутри неё. С зажатым Shift добавляет к выделенному.'],

    'cx.ctlBendK':    ['Drag a wire', 'Потянуть провод'],
    'cx.ctlBendV':    ['Puts a corner in it. Drag the corner to move it, right-click it to remove it, middle-click ' +
                       'the wire to straighten it.',
                       'Ставит на нём точку изгиба. Потяните точку, чтобы сдвинуть её, правый клик убирает её, ' +
                       'средний клик по проводу выпрямляет его.'],
    'cx.ctlDotK':     ['Double-click a wire', 'Двойной клик по проводу'],
    'cx.ctlDotV':     ['Drops a dot that every wire from that output passes through. Drag it to move them all, ' +
                       'click it to run a new wire from it, right-click it to remove it.',
                       'Ставит узел, через который идут все провода этого выхода. Потяните его, чтобы сдвинуть их ' +
                       'все, щёлкните, чтобы вести от него новый провод, правый клик убирает его.'],
    'cx.ctlZoomBoxK': ['Wheel', 'Колесо'],
    'cx.ctlZoomBoxV': ['Zooms the map', 'Приближает и отдаляет карту'],
    'cx.ctlMmbBoxK':  ['Middle or right drag', 'Тянуть средней или правой кнопкой'],
    'cx.ctlMmbBoxV':  ['Moves the map. On a skill board a left drag works too.',
                       'Двигает карту. На доске навыков работает и левая кнопка.'],
    'cx.ctlWireK':    ['Drag port &rarr; port', 'Протянуть от гнезда к гнезду'],
    'cx.ctlWireV':    ['Runs a wire. Either direction works, and an input takes exactly one.',
                       'Прокладывает провод. Тянуть можно в любую сторону, и вход принимает ' +
                       'ровно один.'],

    'cx.ctlSquareK':  ['Ctrl + drag a wire', 'Ctrl + протянуть провод'],
    'cx.ctlSquareV':  ['Draws it with right angles instead of a curve. The wire keeps ' +
                       'whatever it was drawn with.',
                      'Рисует его прямыми углами вместо дуги. Провод сохраняет тот вид, ' +
                      'с которым его протянули.'],
    'cx.ctlSquare2K': ['Ctrl + click a wire', 'Ctrl + щелчок по проводу'],
    'cx.ctlSquare2V': ['Switches one that is already built between the two shapes',
                      'Переключает уже проложенный провод между двумя видами'],
    'cx.ctlKeepWireK': ['Shift + let go of a wire', 'Shift + отпустить провод'],
    'cx.ctlKeepWireV': ['It stays in your hand, so one output can be wired into many sockets. ' +
                        'Esc puts it down',
                       'Он остаётся в руке, и один выход можно провести во много разъёмов. ' +
                       'Esc убирает его'],
    'cx.ctlCutK':     ['Right-click a wire', 'Правый щелчок по проводу'],
    'cx.ctlCutV':     ['Cuts it', 'Перерезает его'],
    'cx.ctlSelAllV':  ['Selects every machine in the place you are in, ready to move, save or demolish. ' +
                       'Shift-click takes one back out.',
                       'Выбирает все машины в этом месте: их можно перенести, сохранить или снести. ' +
                       'Shift-клик убирает одну.'],
    'cx.ctlUndoK':    ['Ctrl + Z', 'Ctrl + Z'],
    'cx.ctlUndoV':    ['Undoes your last build, move, wire or cut. Demolishing cannot be undone.',
                       'Отменяет последнюю постройку, перенос, провод или разрез. Снос не отменяется.'],

    'cx.ctlCutTouchK': ['Press an input', 'Нажатие на вход'],
    'cx.ctlCutTouchV': ['Cuts the wire running into it',
                        'Перерезает идущий в него провод'],
    'cx.ctlShiftTouchK': ['SELECT MORE on a card', 'ВЫБРАТЬ ЕЩЁ на карточке'],
    'cx.ctlShiftTouchV': ['Then tap machines to add them. Move the group, demolish it ' +
                        'together, or save it as a blueprint, wiring and all.',
                        'Затем нажимайте на машины, чтобы добавить их. Группу можно ' +
                        'перенести, снести разом или сохранить как чертёж — вместе с ' +
                        'проводами.'],
    'cx.ctlZoomK':    ['Wheel / drag empty map', 'Колесо / тянуть пустую карту'],
    'cx.ctlZoomV':    ['Zoom and pan', 'Приближение и перемещение'],
    'cx.ctlMmbK':     ['Middle-drag', 'Тянуть средней кнопкой'],
    'cx.ctlMmbV':     ['Pans the map or a skill board. Left-drag does the same on both.',
                       'Двигает карту или доску навыков. Левой кнопкой работает так же.'],
    'cx.ctlKeyPanK':  ['W A S D or the arrows', 'W A S D или стрелки'],
    'cx.ctlKeyPanWK': ['W A S D', 'W A S D'],
    'cx.ctlKeyPanV':  ['Moves the map. Hold Shift to go faster.', 'Двигает карту. С Shift быстрее.'],

    'cx.ctlBoardWheelK': ['Wheel on a skill board', 'Колесо на доске навыков'],
    'cx.ctlBoardWheelV': ['Scrolls it. Hold Ctrl to zoom instead.',
                          'Прокручивает её. С Ctrl приближает.'],
    'cx.ctlBoardWheelZV': ['Zooms it, anchored on the cursor. Hold Ctrl to scroll instead.',
                           'Приближает её от курсора. С Ctrl прокручивает.'],
    'cx.ctlPlacesV':  ['Flies to a place, counting the buttons at the top of the map. ' +
                       'A move in hand comes with you.',
                       'Перелёт к месту по порядку кнопок сверху карты. Груз в руках летит с вами.'],
    'cx.ctlMoveV':    ['Lifts the machines you have selected. Fly somewhere and click ' +
                       'to drop them. Nothing is charged.',
                       'Поднимает выбранные машины. Перелетите и щёлкните, чтобы поставить. Ничего не стоит.'],
    'cx.ctlDemolishV': ['Demolishes what you have selected. Press it twice: the first ' +
                        'press arms it, the second does it.',
                        'Сносит выбранное. Нажмите дважды: первое нажатие взводит, второе сносит.'],
    'cx.ctlFlipV':    ['Turns the selected machines round, so the inputs sit on the ' +
                       'right and the outputs on the left.',
                       'Разворачивает выбранные машины: входы справа, выходы слева.'],
    'cx.ctlDockV':    ['Picks a machine out of the build tray, in the order the cards ' +
                       'sit in.',
                       'Выбирает машину из нижней панели, в порядке карточек.'],
    'cx.ctlHomeK':    ['Home or H', 'Home или H'],
    'cx.ctlHomeV':    ['Brings the camera back to your machines',
                       'Возвращает камеру к вашим машинам'],
    'cx.ctlTK':       ['T', 'T'],
    'cx.ctlTV':       ['Opens the skill boards', 'Открывает доски навыков'],
    'cx.ctlEscK':     ['Esc', 'Esc'],
    'cx.ctlEscV':     ['Backs out one layer at a time', 'Закрывает по одному слою за раз'],

    'ui.sockets':        ['Sockets', 'Разъёмы'],
    'ui.socketsNormal':  ['IN LEFT', 'ВХОД СЛЕВА'],
    'ui.socketsFlipped': ['IN RIGHT', 'ВХОД СПРАВА'],
    'ui.alerts':      ['Alerts', 'Оповещения'],
    'ui.alertsOn':    ['ON', 'ВКЛ'],
    'ui.alertsMuted': ['MUTED', 'ЗАГЛУШЕНЫ'],

    'ui.stWorking':   ['WORKING', 'РАБОТАЕТ'],
    'ui.stIdle':      ['IDLE', 'ПРОСТАИВАЕТ'],
    'ui.secIn':       ['IN', 'ВХОД'],
    'ui.secOut':      ['OUT', 'ВЫХОД'],
    'ui.secInside':   ['INSIDE', 'ВНУТРИ'],
    'ui.secDetails':  ['DETAILS', 'ПОДРОБНО'],
    'ui.secMachines': ['MACHINES', 'МАШИНЫ'],
    'tut.wxNow':      ['NOW', 'СЕЙЧАС'],
    'ui.secSelling':  ['SELLING NOW', 'СЕЙЧАС ПРОДАЁТ'],
    'ui.allPrices':   ['All %n prices', 'Все цены: %n'],

    'ui.codexWord':   ['Codex', 'Справочник'],
    'ui.findWord':    ['Find', 'Найти'],
    'ui.findTip':     ['Find a machine on the map (Ctrl+F)', 'Найти машину на карте (Ctrl+F)'],
    'ui.findPh':      ['Name, machine or place', 'Имя, машина или место'],
    'ui.findNone':    ['Nothing called that', 'Ничего с таким именем'],
    'ui.findHere':    ['here', 'здесь'],
    'ui.nameHead':    ['Name', 'Имя'],
    'ui.nameTip':     ['Your own name for this machine. Enter keeps it', 'Своё имя для этой машины. Enter сохраняет'],
    'ui.rename':      ['Rename', 'Переименовать'],
    'ui.renameKeep':  ['Keep this name', 'Сохранить имя'],

    'ui.sockOrderIn':  ['SOCKET ORDER · IN', 'ПОРЯДОК РАЗЪЁМОВ · ВХОД'],
    'ui.sockOrderOut': ['SOCKET ORDER · OUT', 'ПОРЯДОК РАЗЪЁМОВ · ВЫХОД'],
    'ui.untangle':     ['UNTANGLE', 'РАСПУТАТЬ'],
    'ui.sockUsual':    ['Back to the usual order', 'Вернуть обычный порядок'],
    'ui.healedPct':   ['Healed %p%.', 'Восстановлено на %p%.'],
    'ui.forecast':      ['Forecasting', 'Прогноз'],

    'ui.incoming':      ['incoming', 'надвигается'],

    'ui.pillIn':        ['in %ss', 'через %s с'],

    'ui.wxStop':        ['STOP', 'СТОП'],
    'ui.wxInfo':        ['Press to see what it does', 'Нажмите, чтобы увидеть, что она делает'],
    'wx.fx.gen':        ['Every generator', 'Все генераторы'],
    'wx.fx.crew':       ['People (robots keep going)', 'Люди (роботы работают)'],
    'wx.fx.plant':      ['Trees and planting', 'Деревья и посадка'],
    'wx.fx.dig':        ['Cleaners and diggers', 'Уборщики и копатели'],
    'wx.fx.sweep':      ['Sweeping by hand', 'Уборка руками'],
    'wx.fx.burnRate':   ['Burning', 'Сжигание'],
    'wx.fx.burnValue':  ['What a burn pays', 'Доход от сжигания'],
    'wx.fx.battery':    ['Batteries', 'Аккумуляторы'],
    'wx.fx.trips':      ['The grid comes back slowly afterwards', 'Потом сеть поднимается медленно'],

    'wx.shielded':      ['SHIELDED', 'ЗАЩИЩЕНО'],
    'wx.gridSafe':      ['%s, grid safe', '%s, сеть цела'],
    'wx.gridSafeTip':   ['Your Surge Arrestors caught this strike. Generators and batteries keep working.',
                         'Грозозащита приняла этот удар. Генераторы и батареи работают.'],
    'ui.mastWatching':  ['WATCHING', 'СЛЕДИТ'],
    'ui.mastCharging':  ['CHARGING', 'ЗАРЯЖАЕТСЯ'],

    'ui.meteorites':    ['Meteorites', 'Метеориты'],
    'ui.autoPull':      ['AUTO PULL', 'АВТОПРИТЯЖЕНИЕ'],
    'ui.byHand':        ['BY HAND', 'ВРУЧНУЮ'],
    'ui.demolish':    ['DEMOLISH', 'СНЕСТИ'],
    'ui.demolishSure':['PRESS AGAIN', 'НАЖМИТЕ ЕЩЁ РАЗ'],
    'ui.demolishAll': ['DEMOLISH ALL', 'СНЕСТИ ВСЁ'],

    'ui.demoWhy':     ['Delete %s? You will lose: %l.', 'Снести: %s? Пропадёт: %l.'],
    'ui.demoWhyNone': ['Delete %s? Press again to confirm.', 'Снести: %s? Нажмите ещё раз.'],
    'ui.demoGroup':   ['these %n machines', 'машины (%n)'],
    'ui.loss.kw':        ['stored energy', 'запас энергии'],
    'ui.loss.wf':        ['stored workforce', 'запас рабочей силы'],
    'ui.loss.kg':        ['material inside', 'материал внутри'],
    'ui.loss.recruits':  ['recruits', 'рекруты'],
    'ui.loss.arrays':    ['arrays', 'массивы'],
    'ui.loss.stretches': ['road stretches', 'участки дороги'],
    'ui.loss.loads':     ['fertilizer loads', 'загрузки удобрения'],
    'ui.loss.batches':   ['batches', 'партии'],
    'ui.loss.domes':     ['domes', 'купола'],
    'ui.loss.kits':      ['kits eaten', 'съеденные наборы'],
    'ui.loss.crew':      ['hired hands', 'нанятые рабочие'],
    'ui.loss.licence':   ['paid licence', 'оплаченная лицензия'],
    'ui.loss.work':      ['a half-built batch', 'начатая партия'],
    'ui.loss.rocket':    ['built Skytrawlers', 'построенных космотралов'],
    'ui.loss.flight':    ['a flight in the air, with its cargo', 'полёт в пути, вместе с грузом'],
    'ui.loss.till':      ['till', 'касса'],

    'ui.ov.head':        ['OVERLAY', 'ОБЗОР'],
    'ui.ov.mat':         ['Material', 'Материал'],
    'ui.ov.status':      ['Status', 'Состояние'],
    'ui.ov.flow':        ['Flow', 'Поток'],
    'ui.ov.off':         ['Off', 'Выкл.'],
    'ui.ov.find':        ['Find a material', 'Найти материал'],
    'ui.ov.hide':        ['Hide the overlay bar', 'Скрыть панель обзора'],
    'ui.ov.show':        ['Show the overlay bar', 'Показать панель обзора'],
    'ui.ov.none':        ['Nothing like that is wired here', 'Здесь такое не идёт по проводам'],
    'ui.ov.empty':       ['nothing right now', 'сейчас пусто'],
    'ui.ov.work':        ['Working', 'В работе'],
    'ui.ov.slow':        ['Held back', 'Не тянет'],
    'ui.ov.stop':        ['Stopped', 'Стоит'],
    'ui.ov.idle':        ['Idle', 'Простаивает'],
    'ui.ov.workWhy':     ['Everything it needs is arriving.', 'Всё нужное поступает.'],
    'ui.ov.idleWhy':     ['Nothing is reaching it, and nothing is wrong with it.', 'К ней ничего не идёт, и с ней всё в порядке.'],

    'ui.ov.waste':       ['Waste', 'Потери'],
    'ui.ov.wasting':     ['Wasting', 'Теряет'],
    'ui.ov.wIdle':       ['Not working, so all of it is lost.', 'Не работает, поэтому теряется всё.'],
    'ui.ov.wFull':       ['Full, so what still arrives is lost.', 'Полна, поэтому всё, что ещё приходит, теряется.'],
    'ui.ov.wCap':        ['More power than it can ever use.', 'Больше энергии, чем она может взять.'],
    'ui.ov.wMore':       ['More power than its input needs.', 'Больше энергии, чем нужно для того, что в неё входит.'],
    'ui.ov.wMoreWf':     ['More workforce than its input needs.', 'Больше рабочей силы, чем нужно для того, что в неё входит.'],
    'ui.ov.wLine':       ['%r: given %g, lost %l', '%r: дано %g, потеряно %l'],
    'ui.ov.lgChain':     ['Showing one chain', 'Показана одна цепочка'],
    'ui.ov.lgPicked':    ['The machine you picked', 'Выбранная машина'],
    'ui.ov.lgLinked':    ['What feeds it and what it feeds', 'Что её питает и что питает она'],
    'ui.ov.lgBack':      ['Click anywhere to go back', 'Щёлкните где угодно, чтобы вернуться'],
    'ui.ov.lgHint':      ['Right-click a machine to see its chain', 'Щёлкните правой кнопкой по машине, чтобы увидеть её цепочку'],
    'ui.ov.lgGives':     ['Gives out %r', 'Отдаёт: %r'],
    'ui.ov.lgUses':      ['Uses or makes %r', 'Берёт или делает: %r'],
    'ui.ov.lgCarry':     ['Wires carrying it', 'Провода, по которым оно идёт'],
    'ui.ov.lgNothing':   ['Carries nothing', 'Ничего не несёт'],
    'ui.ov.lgGrey':      ['Working and idle machines stay grey', 'Работающие и простаивающие машины остаются серыми'],
    'ui.ov.lgSock':      ['The socket it is waiting on', 'Гнездо, которого ей не хватает'],
    'ui.ov.lgHoverM':    ['Hover a machine for the reason', 'Наведите на машину, чтобы узнать причину'],
    'ui.ov.lgLittle':    ['Carries a little', 'Несёт немного'],
    'ui.ov.lgLot':       ['Carries the most', 'Несёт больше всех'],
    'ui.ov.lgHoverW':    ['Hover a wire for the amount', 'Наведите на провод, чтобы узнать сколько'],
    'ui.ov.lgWLittle':   ['Throws a little away', 'Теряет немного'],
    'ui.ov.lgWMost':     ['Throws most of it away', 'Теряет почти всё'],
    'ui.ov.lgWWires':    ['Its wires stay in colour', 'Её провода остаются цветными'],
    'ui.ov.lgHoverN':    ['Hover a machine for the numbers', 'Наведите на машину, чтобы увидеть цифры'],

    'ui.lift.btn':       ['LIFT', 'ПОДНЯТЬ'],
    'ui.lift.hint':      ['Click to set it down. Esc puts it back.', 'Нажмите, чтобы опустить. Esc вернёт его на место.'],
    'ui.lift.overlap':   ['It overlaps a ground or a machine', 'Мешает участок или машина'],
    'ui.lift.money':     ['Not enough money (%p)', 'Не хватает денег (%p)'],

    'ui.keep.title':     ['Demolish this machine?', 'Снести машину?'],
    'ui.keep.titleN':    ['Demolish %n machines?', 'Снести %n машину?|Снести %n машины?|Снести %n машин?'],
    'ui.keep.lost':      ['You will lose', 'Вы потеряете'],
    'ui.keep.hint':      ['Moving keeps everything.', 'При переносе всё сохранится.'],
    'ui.keep.keep':      ['Keep it', 'Оставить'],
    'ui.keep.move':      ['Move it instead', 'Лучше перенести'],
    'ui.keep.go':        ['Demolish', 'Снести'],
    'ui.keep.goAll':     ['Demolish all', 'Снести всё'],
    'ui.keep.recruits':  ['recruit|recruits', 'рекрут|рекрута|рекрутов'],
    'ui.keep.arrays':    ['array|arrays', 'массив|массива|массивов'],
    'ui.keep.domes':     ['dome|domes', 'купол|купола|куполов'],
    'ui.keep.stretches': ['road stretch|road stretches', 'участок дороги|участка дороги|участков дороги'],
    'ui.keep.loads':     ['fertilizer load|fertilizer loads', 'загрузка удобрения|загрузки удобрения|загрузок удобрения'],
    'ui.keep.gold':      ['gold in the vault', 'золота в хранилище'],
    'ui.saveBlueprint':['SAVE AS A BLUEPRINT', 'СОХРАНИТЬ КАК ЧЕРТЁЖ'],
    'ui.status':      ['Status', 'Состояние'],
    'ui.held':        ['Held', 'В машине'],
    'ui.output':      ['Output', 'Выход'],
    'ui.demand':      ['Demand', 'Запрос'],
    'ui.selected':    ['selected', 'выбрано'],

    'mn.skipSplash':  ['click to skip', 'нажмите, чтобы пропустить'],
    'mn.play':        ['PLAY', 'ИГРАТЬ'],
    'mn.settings':    ['SETTINGS', 'НАСТРОЙКИ'],

    'mn.newsOk':       ['GOT IT', 'ПОНЯТНО'],
    'mn.set_general':  ['GENERAL', 'ОБЩИЕ'],
    'mn.set_controls': ['CONTROLS', 'УПРАВЛЕНИЕ'],
    'mn.set_audio':    ['SOUND', 'ЗВУК'],
    'mn.set_ui':       ['INTERFACE', 'ИНТЕРФЕЙС'],
    'mn.set_build':    ['BUILDING', 'СТРОЙКА'],
    'mn.exit':        ['EXIT', 'ВЫЙТИ'],
    'mn.back':        ['&lsaquo; BACK', '&lsaquo; НАЗАД'],
    'mn.tagline':     ['Clean it up, one machine at a time',
                       'Очистить планету, одна машина за раз'],
    'mn.chooseSlot':  ['CHOOSE A SLOT', 'ВЫБЕРИТЕ СЛОТ'],
    'mn.codex':       ['CODEX', 'КОДЕКС'],
    'mn.codexNone':   ['No run yet. Start one and every machine you unlock will be listed here.',
                       'Пока ни одного запуска. Начните игру — и каждая открытая машина появится здесь.'],
    'mn.slot':        ['SLOT', 'СЛОТ'],

    'ld.title':       ['CATCHING UP', 'НАГОНЯЕМ'],

    'ld.tip1':        ['Select a machine and press F to flip it, so its inputs and outputs swap sides.',
                       'Выберите машину и нажмите F, чтобы отразить её: входы и выходы поменяются местами.'],
    'ld.tip2':        ['Hold Shift and drag across empty ground to select many machines at once.',
                       'Зажмите Shift и тяните по пустому месту, чтобы выбрать сразу несколько машин.'],
    'ld.tip3':        ['Solar Panels only make power during the day.',
                       'Солнечные панели дают энергию только днём.'],
    'ld.tip4':        ['You can show or hide the outlet bar on machine cards in Settings.',
                       'Полосу выхода на карточках машин можно включить или скрыть в Настройках.'],
    'ld.tip5':        ['Every control and key is listed in the Codex, on the Controls tab.',
                       'Всё управление и все клавиши собраны в Справочнике, во вкладке «Управление».'],
    'ld.tip6':        ['Press H or Home to bring the camera back to your machines.',
                       'Нажмите H или Home, чтобы вернуть камеру к своим машинам.'],
    'ld.tip7':        ['Hold Ctrl while dragging a wire to draw it with right angles.',
                       'Зажмите Ctrl, когда тянете провод, чтобы он шёл под прямыми углами.'],
    'ld.tip8':        ['Press 1 to 9 to fly between your places.',
                       'Нажимайте клавиши от 1 до 9, чтобы перелетать между местами.'],

    'err.title':      ['SOMETHING WENT WRONG', 'ЧТО-ТО ПОШЛО НЕ ТАК'],
    'err.saved':      ['Your run has been saved and the game is still running.',
                       'Игра сохранена и продолжает работать.'],
    'err.close':      ['DISMISS', 'ПОНЯТНО'],

    'sv.title':       ['SAVING IS NOT GETTING THROUGH', 'СОХРАНЕНИЕ НЕ ПРОХОДИТ'],
    'sv.body':        ['The browser refused to store this run. Open the menu and press ' +
                       'EXPORT on this slot to keep a copy of it.',
                       'Браузер отказался сохранить этот прогон. Откройте меню и нажмите ' +
                       'EXPORT на этой ячейке, чтобы забрать копию.'],

    'ui.autosaving':  ['Autosaving', 'Сохраняем'],
    'ui.autosaveHold':['please do not close the game', 'не закрывайте игру'],

    'mn.emptySlot':   ['Empty. Start a new run', 'Пусто — начните новую игру'],
    'mn.newGame':     ['NEW GAME', 'НОВАЯ ИГРА'],
    'mn.continue':    ['CONTINUE', 'ПРОДОЛЖИТЬ'],
    'mn.new':         ['NEW', 'НОВАЯ'],
    'mn.delete':      ['DELETE', 'УДАЛИТЬ'],
    'mn.export':      ['EXPORT', 'ЭКСПОРТ'],
    'mn.import':      ['IMPORT', 'ИМПОРТ'],
    'mn.expOk':       ['Save file downloaded.', 'Файл сохранения скачан.'],
    'mn.expNone':     ['Nothing to export yet.', 'Пока нечего выгружать.'],
    'mn.impOk':       ['Save imported.', 'Сохранение загружено.'],
    'mn.impBad':      ['That file is not an Earth ReGen save.',
                       'Это не похоже на сохранение Earth ReGen.'],
    'mn.impVer':      ['That save is from a different game version and cannot be loaded.',
                       'Это сохранение от другой версии игры — его нельзя загрузить.'],
    'mn.impFail':     ['Import failed. The slot is untouched.',
                       'Не удалось загрузить — сохранение не записалось.'],
    'mn.loadBroken':  ['This save could not be opened. Nothing was changed and a copy is kept.',
                       'Это сохранение не открылось. Ничего не изменено, копия сохранена.'],
    'mn.played':      ['played', 'сыграно'],
    'mn.complete':    ['% complete', '% пройдено'],
    'mn.volAll':      ['Overall volume', 'Общая громкость'],
    'mn.volAllHint':  ['Scales both of the sliders below.',
                       'Управляет обоими ползунками ниже.'],
    'mn.volSfx':      ['Sound effects', 'Звуковые эффекты'],
    'mn.volMus':      ['Music', 'Музыка'],
    'mn.display':     ['Display', 'Экран'],
    'mn.window':      ['WINDOW', 'В ОКНЕ'],
    'mn.fullscreen':  ['FULL SCREEN', 'ПОЛНЫЙ ЭКРАН'],
    'mn.fsHint':      ['Full screen can also be toggled at any time with F11.',
                       'Полный экран также переключается клавишей F11.'],
    'mn.size':        ['Menu size', 'Размер меню'],
    'mn.wxNotice':    ['Weather notices', 'Оповещения о погоде'],
    'mn.wx_all':      ['Everywhere', 'Везде'],
    'mn.wx_here':     ['Where I am', 'Где я'],
    'mn.wx_off':      ['Off', 'Выкл'],

    'mn.skinChoice':  ['Interface', 'Интерфейс'],
    'mn.skinChoice_classic': ['Classic', 'Классический'],
    'mn.skinChoice_new':     ['New', 'Новый'],
    'mn.outletBar':   ['Outlet bar on cards', 'Полоса выхода на карточках'],
    'mn.outletBar_off': ['Off', 'Выкл'],
    'mn.outletBar_on':  ['On', 'Вкл'],

    'mn.gridSnap':      ['Placing machines', 'Расстановка машин'],
    'mn.gridSnap_free': ['Free', 'Свободно'],
    'mn.gridSnap_grid': ['Grid', 'По сетке'],
    'mn.wireBends':     ['Wire bending', 'Изгиб проводов'],
    'mn.wireBends_off': ['Off', 'Выкл'],
    'mn.wireBends_on':  ['On', 'Вкл'],
    'mn.gridStyle':       ['Grid look', 'Вид сетки'],
    'mn.gridStyle_lines': ['Lines', 'Линии'],
    'mn.gridStyle_dots':  ['Dots', 'Точки'],
    'mn.gridStyleHint':   ['How the grid on the map is drawn.', 'Как нарисована сетка на карте.'],
    'mn.wireAlign':     ['Wire magnet', 'Магнит проводов'],
    'mn.wireAlign_off': ['Off', 'Выкл'],
    'mn.wireAlign_on':  ['On', 'Вкл'],
    'mn.wireAlignHint': ['While you drag a machine, a wire that is nearly level snaps level and glows.',
                         'Пока вы тащите машину, почти ровный провод выравнивается и вспыхивает.'],
    'mn.wxHints':       ['Weather hints', 'Подсказки погоды'],
    'mn.wxHints_auto':  ['Auto', 'Авто'],
    'mn.wxHints_on':    ['On', 'Вкл'],
    'mn.wxHints_off':   ['Off', 'Выкл'],
    'mn.wxHintsHint':   ['Press the weather pill to see what the weather changes. ' +
                         'Auto: on if you played the tutorial, off if you skipped it.',
                         'Нажмите на плашку погоды, чтобы увидеть, что она меняет. ' +
                         'Авто: включено, если вы прошли обучение, и выключено, если пропустили.'],
    'mn.bendHint':      ['Points on wires. Drag a wire to add a point, drag a point to move it, right-click a point to remove it, middle-click a wire to straighten it. Double-click a wire for a dot every wire from that output passes through.',
                         'Точки на проводах. Потяните провод, чтобы добавить точку, потяните точку, чтобы сдвинуть её, правый клик по точке убирает её, средний клик по проводу выпрямляет его. Двойной клик по проводу ставит узел, через который идут все провода этого выхода.'],
    'mn.treeLines':          ['Money board lines', 'Линии навыков денег'],
    'mn.treeLines_straight': ['Straight', 'Прямые'],
    'mn.treeLines_curved':   ['Curved', 'Изогнутые'],
    'mn.treeLinesHint':      ['How the links between money skills are drawn.',
                              'Как нарисованы связи между навыками денег.'],
    'mn.colourBlind':        ['Colour blindness', 'Дальтонизм'],
    'mn.tips':          ['Hints', 'Подсказки'],
    'mn.tips_on':       ['On', 'Вкл'],
    'mn.tips_off':      ['Off', 'Выкл'],
    'mn.tipsHint':      ['Notes about panels, places and machines worth building. Off: you still get the ' +
                         'notes about a machine you have just built, and the warnings that CI is falling ' +
                         'or where to go next.',
                         'Заметки о панелях, местах и машинах, которые стоит построить. Выкл: остаются ' +
                         'заметки о только что построенной машине и предупреждения о падении CI и о том, ' +
                         'куда идти дальше.'],
    'mn.attention':          ['Attention counts', 'Счётчик «Внимание»'],
    'mn.attention_all':      ['Every stop', 'Все остановки'],
    'mn.attention_real':     ['Skip waiting', 'Без ожидающих'],
    'mn.attention_off':      ['Off', 'Выкл.'],
    'mn.colourBlind_off':    ['Off', 'Выкл.'],
    'mn.colourBlind_deut':   ['Green-blind', 'Зелёный'],
    'mn.colourBlind_prot':   ['Red-blind', 'Красный'],
    'mn.colourBlind_trit':   ['Blue-blind', 'Синий'],

    'mn.dragSelect':         ['Drag on empty map', 'Перетаскивание по карте'],
    'mn.dragSelect_pan':     ['Move the map', 'Двигать карту'],
    'mn.dragSelect_box':     ['Select box', 'Рамка выделения'],
    'mn.dragSelectHint':     ['Select box: a left drag on empty map picks every machine inside the box, and ' +
                              'the middle or right button moves the map.',
                              'Рамка выделения: левая кнопка на пустом месте выделяет все машины в рамке, а ' +
                              'средняя или правая кнопка двигают карту.'],
    'mn.sweepGesture':       ['Hand sweeping', 'Уборка руками'],
    'mn.sweepGesture_hover': ['Hover', 'Наведение'],
    'mn.sweepGesture_drag':  ['Hold and drag', 'Зажать и вести'],
    'mn.sweepHint':          ['Hover: move the cursor into a site, again and again. Hold and drag: hold ' +
                              'the mouse button on a site and move back and forth. A touch screen always drags.',
                              'Наведение: заводите курсор на участок снова и снова. Зажать и вести: зажмите ' +
                              'кнопку мыши на участке и водите туда-сюда. На сенсорном экране всегда ведёте пальцем.'],
    'mn.planetView':     ['Planet view (prototype)', 'Вид планеты (прототип)'],
    'mn.planetView_off': ['Off', 'Выкл'],
    'mn.planetView_on':  ['On', 'Вкл'],
    'mn.planetViewHint': ['Still in development. When the planet heals a stage, a card offers to show it. On the ' +
                          'planet, drag to turn it and click a place to land there.',
                          'Ещё в разработке. Когда планета переходит на новую стадию, карточка предлагает её ' +
                          'показать. На планете тяните, чтобы вращать, и нажмите на место, чтобы туда приземлиться.'],
    'pv.healing':        ['The planet is healing', 'Планета оживает'],
    'pv.stageFromTo':    ['Stage %a → %b of %n', 'Стадия %a → %b из %n'],
    'pv.see':            ['SEE IT', 'ПОСМОТРЕТЬ'],
    'pv.back':           ['BACK TO THE MAP', 'НАЗАД К КАРТЕ'],
    'pv.healingCap':     ['HEALING  ·  STAGE %a → %b', 'ОЖИВАЕТ  ·  СТАДИЯ %a → %b'],
    'pv.stageCap':       ['STAGE %a OF %n', 'СТАДИЯ %a ИЗ %n'],
    'pv.landing':        ['LANDING IN %s', 'ПОСАДКА: %s'],
    'pv.notOpen':        ['not open yet', 'ещё закрыто'],
    'pv.prototype':      ['PROTOTYPE', 'ПРОТОТИП'],
    'pv.hint':           ['Drag to turn  ·  wheel to go higher or lower  ·  click a place to land',
                          'Тяните, чтобы вращать  ·  колесо: выше или ниже  ·  нажмите на место, чтобы приземлиться'],
    'mn.gridHint':      ['Machines land on the grid you can see on the map.',
                         'Машины встают на сетку, которая видна на карте.'],
    'mn.outletHint':  ['A second bar on converter cards, showing what is waiting to leave.',
                       'Вторая полоса на карточках переработчиков: сколько ждёт отправки.'],
    'mn.sizeHint':    ['How large the title and slot screens are drawn. The game itself ' +
                       'is not affected.',
                       'Насколько крупно рисуются заглавный экран и экран сохранений. ' +
                       'На саму игру не влияет.'],
    'mn.language':    ['Language', 'Язык'],

    'mn.langHint':    ['The Russian translation is complete: every machine, skill, ' +
                       'objective and tutorial step.',
                       'Русский перевод полный — машины, навыки, цели и все шаги обучения.'],
    'mn.newRun':      ['NEW RUN', 'НОВАЯ ИГРА'],
    'mn.nameRun':     ['NAME THIS RUN', 'НАЗВАНИЕ ИГРЫ'],
    'mn.nameHint':    ['Optional. Leave it blank and the card just says SLOT',
                       'Необязательно — если оставить пустым, будет просто СЛОТ'],
    'mn.tutorAsk':    ['Would you like the guided first run?',
                       'Хотите пройти обучение?'],

    'mn.tutorBlurb':  ['Sweeping by hand, your first machine, wiring it up and emptying ' +
                       'a till. Leave it whenever you like.',
                       'Уборка вручную, первая машина, провода и первая касса. Выйти можно ' +
                       'в любой момент.'],
    'mn.tutorYes':    ['YES, GUIDE ME', 'ДА, ПОКАЖИТЕ'],
    'mn.tutorNo':     ['NO, I KNOW THE GAME', 'НЕТ, Я ЗНАЮ ИГРУ'],
    'mn.saved':       ['Your run is saved.', 'Игра сохранена.'],
    'mn.mayClose':    ['You can close this window now.', 'Теперь можно закрыть окно.'],
    'mn.backToMenu':  ['BACK TO MENU', 'НАЗАД В МЕНЮ'],
    'mn.stage':       ['STAGE', 'СТАДИЯ'],
    'mn.cleaned':     ['cleaned', 'очищено'],
    'mn.preview':     ['preview', 'просмотр'],
    'mn.auto':        ['auto', 'авто'],
    'mn.autoBtn':     ['AUTO', 'АВТО'],
    'mn.liveBtn':     ['LIVE', 'ЖИВОЙ'],
    'mn.noRun':       ['No run yet', 'Игры ещё нет'],
    'mn.nothingYet':  ['nothing cleaned yet', 'ещё ничего не очищено'],
    'mn.today':       ['today', 'сегодня'],

    'cg.base': ['Every number in this list is a base number, before any money skill upgrades.', 'Все числа в этом списке базовые, без улучшений денежных навыков.'],
    'cg.secWhat': ['WHAT IT DOES', 'ЧТО ДЕЛАЕТ'],
    'cg.failed': ['This card failed to build: ', 'Карточка не построилась: '],
    'cg.unlockedBy': ['Unlocked by <b>%1</b> in the Machine Tree', 'Открывается навыком <b>%1</b> в Дереве машин'],
    'cg.openMat': ['OPEN MATERIALS', 'ОТКРЫТЬ МАТЕРИАЛЫ'],
    'cg.priceNote': ['You can find the price of every material in the Materials tab.', 'Цену каждого материала можно посмотреть во вкладке «Материалы».'],
    'cg.fuelNote': ['Pick the fuel in its panel.', 'Топливо выбирается в её панели.'],
    'cg.optional': ['optional', 'по желанию'],
    'cg.till': ['Till', 'Касса'],
    'cg.collect': ['COLLECT', 'СОБРАТЬ'],
    'cg.or': ['or', 'или'],
    'cg.and': [' and ', ' и '],
    'cg.aLoad': ['a load', 'за загрузку'],
    'cg.anyMat': ['Any material', 'Любой материал'],
    'cg.anyMatLower': ['any other material', 'любой другой материал'],
    'cg.byHand': ['%1, by hand', '%1, вручную'],
    'cg.exhaust': ['Exhaust', 'Выхлоп'],
    'cg.away': ['Away', 'В полёте'],
    'cg.gameHours': ['%1 game hours', '%1 ч игры'],
    'cg.none': ['none', 'нет'],
    'cg.recruits': ['Recruits', 'Новобранцы'],
    'cg.w.power': ['power', 'энерги'],
    'cg.w.crew': ['crew', 'бригад'],
    'cg.w.hazardous': ['hazardous', 'опасн'],
    'cg.grp.needs': ['WHAT IT NEEDS', 'ЧТО НУЖНО'],
    'cg.grp.gives': ['WHAT IT GIVES', 'ЧТО ДАЁТ'],
    'cg.grp.kit': ['THE KIT', 'КОМПЛЕКТ'],
    'cg.grp.crew': ['HANDS AND PRICE', 'РАБОТНИКИ И ЦЕНА'],
    'cg.grp.rules': ['RULES', 'ПРАВИЛА'],
    'cg.grp.tips': ['GOOD TO KNOW', 'ПОЛЕЗНО ЗНАТЬ'],
    'cg.l.afterLoads': ['After %1 loads', 'После %1 загрузок'],
    'cg.l.Price': ['Price', 'Цена'],
    'cg.l.Next hand': ['Next hand', 'Следующий'],
    'cg.l.Discount': ['Discount', 'Скидка'],
    'cg.l.Overdrive': ['Overdrive', 'Форсаж'],
    'cg.l.Charge cell': ['Charge cell', 'Заряд'],
    'cg.l.Till': ['Till', 'Касса'],
    'cg.l.One load': ['One load', 'Одна загрузка'],
    'cg.l.Each load': ['Each load', 'Каждая загрузка'],
    'cg.l.Most': ['Most', 'Максимум'],
    'cg.l.Pumping out': ['Pumping out', 'Откачка'],
    'cg.l.Putting back': ['Putting back', 'Возврат'],
    'cg.l.Pays back': ['Pays back', 'Приносит'],
    'cg.l.Limit': ['Limit', 'Предел'],
    'cg.l.Each dome': ['Each dome', 'Каждый купол'],
    'cg.l.Build': ['Build', 'Постройка'],
    'cg.l.Crew': ['Crew', 'Бригада'],
    'cg.l.Fuel': ['Fuel', 'Топливо'],
    'cg.l.Hold': ['Hold', 'Трюм'],
    'cg.l.Used by': ['Used by', 'Используют'],
    'cg.l.Feeds': ['Feeds', 'Питает'],
    'cg.l.Loads': ['Loads', 'Загрузки'],
    'cg.l.Power': ['Power', 'Энергия'],
    'cg.l.Other fuel': ['Other fuel', 'Другое топливо'],
    'cg.s.manualT': ['MANUAL: ANYWHERE BUT A BANK', 'ВРУЧНУЮ: ГДЕ УГОДНО, КРОМЕ БАНКА'],
    'cg.s.manual': ['Press its buttons and it hires at the Hiring Posts and Labour Exchanges in its place, paying with your money.', 'Нажимайте его кнопки, и оно нанимает работников в Пунктах найма и на Биржах труда своего места за ваши деньги.'],
    'cg.s.autoT': ['AUTO: ON A BANK', 'АВТО: НА БАНКЕ'],
    'cg.s.auto':
      ['It hires by itself as soon as there is room, %1 hands for %2 game hours (%2 real minutes) at a time, paying with what the Bank earns. It saves up to %3 times its dearest contract for that.',
       'Оно нанимает само, как только есть место: %1 работников на %2 ч игры (%2 мин реального времени) за раз, и платит из того, что зарабатывает Банк. Для этого оно копит до %3 своих самых дорогих контрактов.'],
    'cg.r.hirePrice': ['a hand costs %1 of a Volunteer for its shift', 'работник стоит %1 от Волонтёра за свою смену'],
    'cg.r.nextHand': ['every hand already on the books makes the next one %1 dearer', 'каждый уже нанятый работник делает следующего дороже на %1'],
    'cg.r.bulk': ['%1 at once %2 off', '%1 сразу: скидка %2'],
    'cg.r.exPrice': ['a hand costs %1x a Hiring Post hand for every %2 min', 'работник стоит %1x от работника Пункта найма за каждые %2 мин'],
    'cg.r.exDiscount': ['a contract over %1 min is %2 off, and %3 hands or more another %4', 'контракт дольше %1 мин дешевле на %2, а от %3 работников ещё на %4'],
    'cg.r.overdrive': ['x%1 the workforce for x%2 the power', 'x%1 рабочей силы за x%2 энергии'],
    'cg.r.cell': ['holds %1 KW', 'держит %1 кВт'],
    'cg.r.till': ['holds %1', 'вмещает %1'],
    'cg.r.tillGrows': ['holds %1, and every load of %2 makes it bigger by the same share', 'вмещает %1 и растёт с каждой загрузкой (%2) на ту же долю'],
    'cg.r.fertLoad': ['%1 %2, and every load after it needs %3 more', '%2: %1, и каждой следующей загрузке нужно на %3 больше'],
    'cg.r.fertEach': ['+%1 Clean Index for good (+%2 for every %3)', '+%1 Индекса Чистоты навсегда (+%2 на каждые %3)'],
    'cg.r.fertMost': ['x%1 after %2 loads (%3 in all); then it takes no more', 'x%1 после %2 загрузок (всего %3); дальше он больше не берёт'],
    'cg.r.pumpOut': ['%1 lifts %2 of %3', '%1 поднимают %2: %3'],
    'cg.r.pumpOut2': ['%1 lifts %2 of %3 or %4', '%1 поднимают %2: %3 или %4'],
    'cg.r.pumpBack': ['%1 goes back down with no power at all', '%1 уходит обратно вообще без энергии'],
    'cg.r.payBack': ['%1 for every kg on a %2', '%1 за каждый кг (%2)'],
    'cg.r.payBack2': ['%1 for every kg on a %2, %3 on an %4', '%1 за каждый кг (%2), %3 (%4)'],
    'cg.r.pumpLimit': ['it can only put clean water back while the ground has room for it, so never more than it has lifted out of that ground', 'чистую воду он возвращает, только пока на участке есть для неё место, то есть не больше, чем он оттуда поднял'],
    'cg.r.gemTill': ['holds %1 diamonds', 'вмещает алмазов: %1'],
    'cg.r.dome': ['pays %1 for ever, and needs nothing more', 'приносит %1 навсегда, и больше ему ничего не нужно'],
    'cg.r.build': ['%1, once', '%1, один раз'],
    'cg.r.crew': ['%1 a flight', '%1 за полёт'],
    'cg.r.fuel': ['%1 %2, exhaust %3, away %4 game hours (%4 real minutes)', '%1 (%2), выхлоп %3, в полёте %4 ч игры (%4 мин реального времени)'],
    'cg.r.hold': ['keeps up to %1 diamonds until you COLLECT', 'хранит до %1 алмазов, пока вы не нажмёте СОБРАТЬ'],
    'cg.r.noSale': ['%1: cannot be sold', '%1: не продаётся'],
    'cg.r.sell': ['%1: sells for %2 a kg', '%1: продаётся по %2 за кг'],
    'cg.r.sellBurn': ['%1: sells for %2 a kg, or a Landfill burns it for %3 a kg', '%1: продаётся по %2 за кг, или Полигон сжигает его за %3 за кг'],
    'cg.r.noBurn': ['. A Landfill cannot burn it', '. Полигон не может его сжечь'],
    'cg.r.lockedOne': ['a machine you have not unlocked yet', 'одна машина, которую вы ещё не открыли'],
    'cg.r.lockedMany': ['%1 machines you have not unlocked yet', 'ещё не открытые машины: %1'],
    'cg.r.kitLoad': ['%1, and every load after it needs %2 more', '%1, и каждой следующей загрузке нужно на %2 больше'],
    'cg.r.kitEach': ['adds %1 of the %2\'s base output for good', 'навсегда добавляет %1 базовой выработки машины «%2»'],
    'cg.r.kitSolar': ['gives back %1 of the %2\'s power, while the sun is up', 'возвращает %1 энергии машины «%2», пока светит солнце'],
    'cg.r.kitSun': ['it runs overdriven day and night on no power at all, as a %1', 'работает в форсаже днём и ночью совсем без энергии, как «%1»'],
    'cg.r.noLimit': ['no limit', 'без предела'],
    'cg.r.robotPower': ['%1 for every %2 it makes', '%1 на каждые %2, которые он делает'],
    'cg.r.robotSun': ['it becomes a %1: overdriven day and night, on no power', 'он становится машиной «%1»: форсаж днём и ночью, без энергии'],
    'cg.r.loadAdds': ['each load adds %1 of its base output for good', 'каждая загрузка навсегда добавляет %1 базовой выработки'],
    'cg.r.loadAfter': [', and the load after it needs %1 more', ', и следующей загрузке нужно на %1 больше'],
    'cg.r.beacon': ['a meteorite for %1, landing in its own place, close to the beacon', 'метеорит за %1, он падает в том же месте, рядом с маяком'],
    'cg.r.otherFuel': ['%1 %2 gives %3', '%1 (%2) даёт %3'],
    'cg.r.eitherFuel': [', on either fuel', ', на любом топливе'],
    'cg.r.otherFission': ['%1 %2 runs it %3 real minutes at %4', '%1 (%2): %3 мин работы при %4'],
    'cg.m.drill': ['Planting: its crew banks the Clean Index for you, so there is nothing to collect', 'Посадка: бригада сама сдаёт Индекс Чистоты, собирать нечего'],
    'cg.m.planting': ['Planting: the till fills', 'Посадка: касса наполняется'],
    'cg.m.plantFull': ['The till is full: the planter stops', 'Касса полна: садовник встаёт'],
    'cg.m.collectEmpties': ['COLLECT empties it', 'СОБРАТЬ опустошает её'],
    'cg.c.vault': ['No wire comes in. Every lightning strike puts %1 into its cells, and they hold %2.', 'Провод к нему не идёт. Каждый удар молнии кладёт %1 в его батареи, а вмещают они %2.'],
    'cg.m.strike': ['Lightning strikes it: +%1 into its cells', 'В него бьёт молния: +%1 в батареи'],
    'cg.m.strike2': ['Another strike: its cells are full', 'Ещё удар: батареи полны'],
    'cg.m.vaultOut': ['It gives its power out to whatever is wired to it', 'Он отдаёт энергию всему, что к нему подключено'],
    'cg.c.prism': ['Each batch needs a fifth of the first batch more gold, acid and power. The diamonds stay the same.', 'Каждой партии нужно больше золота, кислоты и энергии, на пятую часть первой партии. Алмазов нужно столько же.'],
    'cg.c.press': ['Each batch needs a fifth of the first batch more charcoal and power, and every %1 batches press one more stone.', 'Каждой партии нужно больше угля и энергии, на пятую часть первой партии, а каждые %1 партий дают на камень больше.'],
    'cg.m.prismFirst': ['the gold, acid and diamonds come in first', 'сначала приходят золото, кислота и алмазы'],
    'cg.m.pressFirst': ['the charcoal comes in first', 'сначала приходит древесный уголь'],
    'cg.m.pressPower': ['then %1 of power presses it', 'потом %1 энергии прессуют его'],
    'cg.m.pressDone': ['done, %1', 'готово, %1'],
    'cg.m.oneMore': [', one stone more than before', ', на камень больше, чем раньше'],
    'cg.m.batch': ['Batch %1: %2', 'Партия %1: %2'],
    'cg.c.print': ['Amounts are for the first print. Each print of the same thing costs more than the last.', 'Количества указаны для первой печати. Каждая печать того же самого дороже прошлой.'],
    'cg.m.printIn': ['Paper and %1 come in first', 'Сначала приходят бумага и %1'],
    'cg.m.printPower': ['Then the power prints it', 'Потом энергия печатает'],
    'cg.m.printed': ['Printed: %1', 'Напечатано: %1'],
    'cg.p.builtOnce': ['Built once', 'Строится один раз'],
    'cg.p.everyFlight': ['Every flight', 'Каждый полёт'],
    'cg.m.rocketBuild': ['Built once: the parts come in', 'Строится один раз: приходят детали'],
    'cg.m.rocketLoad': ['Every flight: %1 and crew load together', 'Каждый полёт: %1 и бригада грузятся вместе'],
    'cg.m.rocketAway': ['LAUNCH: away %1 game hours (%1 real minutes)', 'ЗАПУСК: в полёте %1 ч игры (%1 мин реального времени)'],
    'cg.m.rocketHome': ['Home: %1 and %2 in its hold', 'Дома: %1 и %2 в трюме'],
    'cg.p.pumpOut': ['Part 1: pumping out', 'Часть 1: откачка'],
    'cg.p.pumpBack': ['Part 2: putting back', 'Часть 2: возврат'],
    'cg.c.pump': ['Part 1 needs power; part 2 needs none. Every kilogram of clean water that goes back makes the ground cleaner.', 'Части 1 нужна энергия, части 2 не нужна. Каждый килограмм чистой воды, ушедший обратно, делает участок чище.'],
    'cg.m.onSpill': ['On an %1: ', 'На участке «%1»: '],
    'cg.m.onPool': ['On a %1: ', 'На участке «%1»: '],
    'cg.m.pump1': ['part 1 lifts its %1 out', 'часть 1 откачивает: %1'],
    'cg.m.pump2': ['part 2 puts clean water back, %1 for every kg', 'часть 2 возвращает чистую воду, %1 за каждый кг'],
    'cg.m.normal': ['Normal', 'Обычно'],
    'cg.m.overdrive': ['Overdrive', 'Форсаж'],
    'cg.m.robot': ['%1: %2 in, %3 out', '%1: %2 на входе, %3 на выходе'],
    'cg.m.rockCommon': ['A common meteorite', 'Обычный метеорит'],
    'cg.m.rockRare': ['A rare meteorite', 'Редкий метеорит'],
    'cg.c.idlePower': ['Idle means the machine on the priority side wants no power right now: a batch machine between batches, or a full battery.', 'Простой значит, что машине на приоритетной стороне сейчас не нужна энергия: машина партий между партиями или полный аккумулятор.'],
    'cg.c.idleCrew': ['Idle means the machine on the priority side cannot use workforce right now: its pool is full, its batch is waiting for parts, or a digger\'s output is full.', 'Простой значит, что машина на приоритетной стороне сейчас не может взять рабочую силу: её запас полон, её партия ждёт деталей или выход копателя полон.'],
    'cg.m.prioBusy': ['The priority side is working: it gets everything', 'Приоритетная сторона работает: она получает всё'],
    'cg.m.prioIdle': ['The priority side is idle: all goes to the other', 'Приоритетная сторона простаивает: всё идёт на другую'],
    'cg.m.splitEven': ['Enough power: an even split', 'Энергии хватает: поровну'],
    'cg.m.splitShort': ['Short of power: more goes to %1', 'Энергии мало: больше уходит в выход «%1»'],
    'cg.m.splitNone': ['No power: all of it %1', 'Энергии нет: всё уходит в выход «%1»'],
    'cg.m.crewOnly': ['Crew only', 'Только бригада'],
    'cg.m.crewPower': ['Crew and power', 'Бригада и энергия'],
    'cg.m.powerOnly': ['Power only', 'Только энергия'],
    'cg.m.recAll': ['Enough power: all of it recycled', 'Энергии хватает: всё переработано'],
    'cg.m.recShort': ['Short of power: the rest passes straight through', 'Энергии мало: остальное проходит насквозь'],
    'cg.m.battIn': ['Power coming in: it fills up', 'Приходит энергия: запас растёт'],
    'cg.m.battFull': ['Full: it passes on what arrives', 'Запас полон: что приходит, идёт дальше'],
    'cg.m.battOut': ['The supply stops: it gives its store back', 'Подача прекратилась: запас уходит дальше'],
    'cg.m.day': ['Day: it makes power', 'День: она делает энергию'],
    'cg.m.night': ['Night: it rests until sunrise', 'Ночь: она отдыхает до рассвета'],
    'cg.m.selling': ['Selling: the till fills', 'Продажа: касса наполняется'],
    'cg.m.tillFull': ['The till is full: the line behind it stops', 'Касса полна: линия за ней встаёт'],
    'cg.c.batch': ['Amounts are for one batch.', 'Количества указаны на одну партию.'],
    'cg.m.batchDone': ['Batch done: out it comes', 'Партия готова и выходит'],
    'cg.m.gathering': ['Gathering one whole batch', 'Собирается целая партия'],
    'cg.m.matsFirst': ['First the materials come in', 'Сначала приходят материалы'],
    'cg.m.crewBuilds': ['Then the crew builds it', 'Потом бригада строит'],
    'cg.m.handsFull': ['Full: %1 hands at most', 'Полно: не больше %1 работников'],
    'cg.m.handCosts': ['Every hand costs more than the one before', 'Каждый работник дороже предыдущего'],
    'cg.m.newShift': ['A new shift', 'Новая смена'],
    'cg.m.hubBigger': ['The next one needs bigger pools: %1 of each', 'Следующему нужны запасы больше: по %1'],
    'cg.m.hubFill': ['Filling both pools to %1', 'Оба запаса наполняются до %1'],
    'cg.m.hubSigns': ['A recruit signs on, for good', 'Новобранец записывается навсегда'],
    'cg.what.windTurbine': ['Makes power from the wind.', 'Делает энергию из ветра.'],
    'cg.what.recycler': ['Turns trash into recycled trash, using 1 KW for every kilogram. Recycled trash sells and burns for more than plain trash.', 'Превращает мусор в переработанный мусор, тратя 1 кВт на каждый килограмм. Переработанный мусор продаётся и сжигается дороже обычного.'],
    'cg.what.tradePost': ['A Market that collects by itself, so you never press COLLECT. Wire workforce in to run it.', 'Рынок, который собирает выручку сам, так что СОБРАТЬ нажимать не нужно. Чтобы он работал, подведите к нему рабочую силу.'],
    'cg.what.incinerator': ['A Landfill that collects by itself, so you never press COLLECT. Wire workforce in to run it.', 'Полигон, который собирает сам, так что СОБРАТЬ нажимать не нужно. Чтобы он работал, подведите к нему рабочую силу.'],
    'cg.what.tradingFloor': ['A Trade Post with two input wires and twice the till.', 'Торговый пост с двумя входными проводами и вдвое большей кассой.'],
    'cg.what.burnYard': ['An Incinerator with two input wires and twice the pile.', 'Мусоросжигатель с двумя входными проводами и вдвое большей кучей.'],
    'cg.what.waterPump': ['Pumps dirty water out of a pool or a spill, using power. The clean water that goes back down pays Clean Index.', 'Откачивает грязную воду из пруда или пятна, тратя энергию. Чистая вода, которая уходит обратно, приносит Индекс Чистоты.'],
    'cg.what.treePlanter': ['Uses workers to plant trees on a Grove Plot, and the trees earn Clean Index.', 'Работники сажают деревья в Роще, а деревья приносят Индекс Чистоты.'],
    'cg.what.foreman': ['A crew boss who works like four Volunteers.', 'Начальник бригады, который работает как четыре Волонтёра.'],
    'cg.what.gemCollector':
      ['A jointed arm that grabs every diamond landing in its place, however far away it falls, and drops it in its tray. Wire workforce in to charge it: each catch uses some of the charge.',
       'Шарнирная рука, которая хватает каждый алмаз, упавший в её месте, как бы далеко он ни упал, и кладёт его в лоток. Подведите рабочую силу, чтобы зарядить её: каждый захват тратит часть заряда.'],
    'cg.what.strikeVault': ['A lightning rod over a bank of cells. When lightning strikes it, the cells keep the charge as power.', 'Громоотвод над рядом батарей. Когда в него бьёт молния, батареи сохраняют разряд как энергию.'],
    'cg.what.clearingHouse': ['What comes in on its first two inputs is sold, and what comes in on the third is burned. The money and the Clean Index go into two tills, and its crew empties both.', 'То, что приходит на первые два входа, продаётся, а то, что на третий, сжигается. Деньги и Индекс Чистоты идут в две кассы, и его бригада опустошает обе.'],
    'cg.what.pavingTrain': ['Lays a road from oil and aggregate, one stretch at a time. Every finished stretch brings power and workforce, for good.', 'Кладёт дорогу из нефти и щебня, участок за участком. Каждый готовый участок навсегда даёт энергию и рабочую силу.'],
    'cg.what.seedDrill': ['Grows Clean Index on a Grove Plot like a Tree Planter, but its own crew collects the Clean Index for you.', 'Выращивает Индекс Чистоты в Роще, как Садовник, но собирает его за вас своя бригада.'],
    'cg.what.meteorBeacon': ['Calls a meteorite down when you choose. It stores power, and every call spends some of it.', 'Вызывает метеорит, когда вы решите. Он копит энергию, и каждый вызов тратит её часть.'],
    'cg.what.depot': ['A much bigger Salvage Store. It holds three kinds of salvage.', 'Намного больший Склад материалов. Вмещает три вида материалов.'],
    'cg.what.fuelPlant':
      ['Presses plutonium into small pellets and seals them in aluminium cladding. A kilogram of pellets goes much further than turbofuel or uranium rods, and they leave no exhaust behind.',
       'Прессует плутоний в маленькие таблетки и запаивает их в алюминиевую оболочку. Килограмм таблеток работает намного дольше, чем турботопливо или урановые стержни, и не оставляет выхлопа.'],
    'cg.what.magnetSeparator': ['3 KW/h turns 1 kg/h of heavy trash into metal.', '3 кВт/ч превращают 1 кг/ч тяжёлого мусора в металл.'],
    'cg.what.timberReclaimer': ['3 kg/h of aggregate and 3 WF/h make 1 kg/h of scrap timber.', '3 кг/ч щебня и 3 РС/ч дают 1 кг/ч вторичной древесины.'],
    'cg.what.eddySeparator': ['Uses power to split metal into aluminium and steel: 4 KW for each kg. With too little power, you get mostly steel.', 'Тратит энергию, чтобы разделить металл на алюминий и сталь: 4 кВт на каждый кг. Если энергии мало, выходит в основном сталь.'],
    'cg.what.fineSorter': ['Workforce picks light trash apart into plastic and organic waste: 3 WF for each kg. With too little workforce, you get mostly organic waste.', 'Рабочая сила разбирает лёгкий мусор на пластик и органику: 3 РС на каждый кг. Если рабочей силы мало, выходит в основном органика.'],
    'cg.what.hazardPlant': ['Workforce pulls hazardous waste out of light trash: 2 WF/h turns 3 kg/h of light trash into 1 kg/h.', 'Рабочая сила вытаскивает опасные отходы из лёгкого мусора: 2 РС/ч превращают 3 кг/ч лёгкого мусора в 1 кг/ч.'],
    'cg.what.rubbleSorter': ['Breaks heavy trash into glass and aggregate. Each kg needs 2 WF and 2 KW. More workforce gives more glass, more power gives more aggregate.', 'Разбивает тяжёлый мусор на стекло и щебень. Каждому кг нужно 2 РС и 2 кВт. Больше рабочей силы даёт больше стекла, больше энергии даёт больше щебня.'],
    'cg.what.charKiln': ['5 KW/h bakes 1 kg/h of scrap timber down into 0.5 kg/h of charcoal.', '5 кВт/ч выжигают 1 кг/ч вторичной древесины в 0.5 кг/ч древесного угля.'],
    'cg.what.fertilizerPlant': ['Hazardous waste and organic waste with 5 KW make fertilizer.', 'Опасные отходы и органика с 5 кВт дают удобрение.'],
    'cg.what.fibrePress': ['A second road to timber, from 4 kg/h of organic waste and 3 WF/h.', 'Второй путь к древесине: из 4 кг/ч органики и 3 РС/ч.'],
    'cg.what.paperMill': ['Workers cut scrap timber into chips with steel blades and beat the chips into a wet pulp. The pulp is pressed flat and dried into sheets of paper.', 'Работники стальными ножами режут вторичную древесину в щепу и разбивают щепу в мокрую массу. Массу прессуют и сушат в листы бумаги.'],
    'cg.what.gearWorks': ['Spins organic waste into a tough fibre and sews it into hazmat suits. Each suit is lined with thin sheets of lead, which stop radiation.', 'Прядёт из органики прочное волокно и шьёт из него защитные костюмы. Каждый костюм подбит тонкими листами свинца, которые останавливают радиацию.'],
    'cg.what.fluidTank': ['A drum that holds one fluid and keeps it when you carry it.', 'Бак, который держит одну жидкость и сохраняет её, когда вы его переносите.'],
    'cg.what.waterCleaner': ['Filters polluted water through charcoal. Clean water comes out of one output, and the hazardous waste the charcoal caught comes out of the other.', 'Фильтрует грязную воду через древесный уголь. Чистая вода выходит из одного выхода, а опасные отходы, пойманные углём, из другого.'],
    'cg.what.oilSeparator': ['Soaks the crude out of oily water with plastic pads, using power. Clean water comes out of one output, and the oil wrung out of the pads comes out of the other.', 'Впитывает нефть из нефтяной воды пластиковыми подушками, тратя энергию. Чистая вода выходит из одного выхода, а нефть, отжатая из подушек, из другого.'],
    'cg.what.pyrolysisPlant': ['4 KW/h cooks 1 kg/h of plastic into 0.5 kg/h of oil.', '4 кВт/ч превращают 1 кг/ч пластика в 0.5 кг/ч нефти.'],
    'cg.what.rodWorks': ['Dissolves nuclear waste in acid to pull the uranium out of it. The uranium is pressed into small pellets and sealed in long aluminium tubes, which are the rods.', 'Растворяет ядерные отходы в кислоте, чтобы вытянуть из них уран. Уран прессуют в маленькие таблетки и запаивают в длинные алюминиевые трубки — это и есть стержни.'],
    'cg.what.diamondPress': ['Squeezes charcoal into diamonds, one batch at a time. Each batch is bigger than the last, and every fifth one presses a stone more.', 'Сжимает древесный уголь в алмазы, партия за партией. Каждая партия больше прошлой, и каждая пятая даёт на камень больше.'],
    'cg.what.prioPowerSplitter': ['It has two outputs, and one of them is the priority. While the priority side has somewhere to send it, all the power goes there. When it has nowhere to go, all of it goes to the other output.', 'У него два выхода, и один из них приоритетный. Пока приоритетной стороне есть куда отдать энергию, вся она идёт туда. Когда некуда, вся идёт на другой выход.'],
    'cg.what.prioCrewSplitter':
      ['It has two outputs, and one of them is the priority. While the priority side has somewhere to send it, all the workforce goes there. When it has nowhere to go, all of it goes to the other output.',
       'У него два выхода, и один из них приоритетный. Пока приоритетной стороне есть куда отдать рабочую силу, вся она идёт туда. Когда некуда, вся идёт на другой выход.'],
    'cg.what.etchingWorks': ['Pours acid into aluminium forms and makes Advanced Cells, far better batteries than plain ones. Each load makes a Storm Turbine stronger for good.', 'Заливает кислоту в алюминиевые формы и делает Расширенные ячейки, батареи намного лучше обычных. Каждая загрузка навсегда делает Штормовой ветряк сильнее.'],
    'cg.what.glazingWorks': ['Makes an industrial glass that lets a Solar Panel catch more of the sunlight. Each load makes the panel stronger for good.', 'Делает промышленное стекло, с которым Солнечная панель ловит больше света. Каждая загрузка навсегда делает панель сильнее.'],
    'cg.what.bladeWorks': ['Makes long, light blades for wind turbines. Each load makes a Wind Turbine spin faster, for good.', 'Делает длинные лёгкие лопасти для ветряков. Каждая загрузка навсегда заставляет Ветряк крутиться быстрее.'],
    'cg.what.fluidSplitter': ['Splits one fluid wire into two, by the weights you set. It carries one fluid at a time.', 'Делит один провод жидкости на два, по заданным вами весам. Несёт одну жидкость за раз.'],
    'cg.what.leachingPlant': ['Dissolves scrap metal in acid until the gold drops out. The rest comes out as slag.', 'Растворяет металлолом в кислоте, пока не выпадет золото. Остальное выходит шлаком.'],
    'cg.what.circuitWorks': ['Workers make microschemes from glass, acid and a thread of gold.', 'Работники делают микросхемы из стекла, кислоты и золотой нити.'],
    'cg.what.biodome':
      ['Gathers scrap timber, steel, glass and fertilizer, then a crew builds a glass dome with its own air and weather inside. Once a dome stands, it pays Clean Index for ever and needs nothing more.',
       'Собирает вторичную древесину, сталь, стекло и удобрение, а потом бригада строит стеклянный купол со своим воздухом и погодой внутри. Готовый купол навсегда приносит Индекс Чистоты, и больше ему ничего не нужно.'],
    'cg.what.wasteCleaner': ['Digs nuclear waste out of a Nuclear Waste Site.', 'Выкапывает ядерные отходы с Ядерной свалки.'],
    'cg.what.cleaner': ['Uses workers to pull trash out of a Trash Site.', 'Работники вытаскивают мусор со Свалки.'],
    'cg.what.oreDigger': ['Stands on a meteorite and breaks it apart with workforce and power, collecting the metal inside.', 'Стоит на метеорите и разбивает его рабочей силой и энергией, собирая металл изнутри.'],
    'cg.what.puDigger': ['Digs plutonium out of a plutonium meteorite. The rock is radioactive, so workers need hazmat gear to dig there. Robots do not.', 'Выкапывает плутоний из плутониевого метеорита. Порода радиоактивна, поэтому работникам там нужно защитное снаряжение. Роботам не нужно.'],
    'cg.what.repository':
      ['Melts nuclear waste together with glass in a furnace run on power, so the waste is locked inside the glass. The glass is sealed in steel drums and buried deep in the rock, where it can do no more harm. Every kilogram it buries pays Clean Index.',
       'Плавит ядерные отходы со стеклом в печи на энергии, так что отходы запираются внутри стекла. Стекло запаивают в стальные бочки и хоронят глубоко в скале, где оно больше не навредит. Каждый захороненный килограмм приносит Индекс Чистоты.'],
    'cg.what.reactor': ['Splits the atoms inside uranium rods. The heat boils water, and the steam turns a turbine for a lot of power.', 'Расщепляет атомы в урановых стержнях. Жар кипятит воду, а пар крутит турбину и даёт много энергии.'],
    'cg.what.turbofuelRefinery': ['Cracks oil over hot charcoal into turbofuel.', 'Расщепляет нефть над раскалённым древесным углём в турботопливо.'],
    'cg.what.rocket': ['Flies up to clear orbital debris and brings Clean Index and diamonds home.', 'Летает наверх убирать орбитальный мусор и привозит домой Индекс Чистоты и алмазы.'],
    'cg.what.printWorks': ['Prints boosts and diamonds from paper and one other material.', 'Печатает усиления и алмазы из бумаги и одного другого материала.'],
    'cg.what.outreachHub': ['Feed it workforce and power, and it finds new people who stay as permanent workers. Each worker from the same hub costs more than the last.', 'Дайте ему рабочую силу и энергию, и он находит новых людей, которые остаются постоянными работниками. Каждый следующий работник из того же центра дороже прошлого.'],
    'cg.what.panelWorks': ['Workers set microscheme chips under glass to make Solar Kits. A Robot fitted with them runs on sunlight too.', 'Работники ставят чипы микросхем под стекло и делают Комплекты панелей. Робот с ними работает и от солнца.'],
    'cg.note.crewJunction': ['You can put a limit on its output in its panel.', 'В его панели можно ограничить выход.'],
    'cg.note.fluidSplitter': ['Set the ratio of the two outputs in its panel.', 'Соотношение двух выходов задаётся в его панели.'],
    'cg.note.rocket': ['Turn on "Launch by itself" in its panel and it launches as soon as it is ready.', 'Включите «Запускать само» в её панели, и она взлетит, как только будет готова.'],
    'cg.note.hiringAgency': ['It works in one of two ways, and where you build it decides which: on a Bank, or anywhere else.', 'Оно работает одним из двух способов, и выбор зависит от того, где его построить: на Банке или где-то ещё.'],
    'cg.note.reactor': ['Turn on "Start by itself" in its panel and it starts as soon as its fuel is in.', 'Включите «Включать само» в его панели, и он запустится, как только придёт топливо.'],
    'cg.note.crewSplitter': ['Set the ratio of the two outputs in its panel.', 'Соотношение двух выходов задаётся в его панели.'],
    'cg.note.prioCrewSplitter': ['Choose which output is the priority in its panel.', 'Какой выход приоритетный, выбирается в его панели.'],
    'cg.note.prioPowerSplitter': ['Choose which output is the priority in its panel.', 'Какой выход приоритетный, выбирается в его панели.'],
    'cg.note.salvageSplitter': ['Type the ratio of the two outputs in its panel.', 'Соотношение двух выходов вводится в его панели.'],
    'cg.note.oilGenerator': ['Burning oil dirties the air, so every KW/h it makes costs Clean Index. Keep an eye on your Clean Index while it runs.', 'Горящая нефть загрязняет воздух, поэтому каждый его кВт/ч стоит Индекса Чистоты. Следите за Индексом Чистоты, пока он работает.'],
    'cg.watch.gridFoundry': ['Every array this foundry has raised makes its next one dearer. Its arrays belong to the machine, so move it rather than demolishing it.', 'Каждый массив, поднятый этой литейной, делает следующий дороже. Массивы принадлежат машине, поэтому переносите её, а не сносите.'],
    'cg.watch.hazardPlant': ['Light trash the workforce cannot cover is not lost: it passes straight out of the second output.', 'Лёгкий мусор, на который не хватило рабочей силы, не теряется: он сразу уходит во второй выход.'],
    'cg.watch.fertilizerPlant': ['Every load of fertilizer a Tree Planter takes makes its basket bigger as well as its Clean Index, up to double.', 'Каждая загрузка удобрения в Садовника увеличивает и его корзину, и его Индекс Чистоты, вплоть до двух раз.'],
    'cg.watch.prismPress': ['Its diamonds go in by hand, on its card, so it can never run fully on its own.', 'Алмазы в него кладутся вручную, на его карточке, поэтому полностью сам он работать не может.'],
    'cg.watch.fluidTank': ['It sends out %1 when it is built. Change that number in its panel whenever you need to.', 'Построенная, она отдаёт %1. Это число можно поменять в её панели, когда нужно.'],
    'cg.watch.groundLifter':
      ['Click any ground in this place and press LIFT. Set it down where you like. Its machines and wires come with it. Each move costs money. It can only move ground inside one place, never from one place to another.',
       'Нажмите на любой участок в этом месте и нажмите ПОДНЯТЬ. Поставьте его, куда хотите: его машины и провода переедут вместе с ним. Каждый перенос стоит денег. Участки двигаются только внутри одного места, из места в место нельзя.'],
    'cg.tips.weightSorter': ['The best it can do is half light and half heavy, and light trash is worth much more. No amount of power makes it all light.', 'Лучшее, что он может, это половина лёгкого и половина тяжёлого, а лёгкий мусор стоит намного дороже. Никакая энергия не сделает весь мусор лёгким.'],
    'cg.tips.oreDigger': ['It is the only machine that gets lead.\nEvery meteorite has its own mix, so these numbers are averages.', 'Это единственная машина, которая добывает свинец.\nУ каждого метеорита свой состав, так что эти числа средние.'],
    'cg.tips.foreman': ['Every upgrade you buy for Volunteers reaches the Foreman four times over.', 'Каждое улучшение Волонтёров действует на Бригадира в четыре раза сильнее.'],
    'cg.tips.eddySeparator': ['The best split is half aluminium and half steel. No amount of power makes it give only aluminium.', 'Лучшее деление: половина алюминия и половина стали. Никакая энергия не заставит его давать только алюминий.'],
    'cg.tips.fineSorter': ['The best split is half plastic and half organic waste. No amount of workforce makes it give only plastic.', 'Лучшее деление: половина пластика и половина органики. Никакая рабочая сила не заставит его давать только пластик.'],
    'cg.why.hiringAgency': ['Hired hands are a good source of workforce, but someone has to hire them by hand, shift after shift. The Hiring Agency takes that job off your hands.', 'Нанятые работники — хороший источник рабочей силы, но кто-то должен нанимать их вручную, смену за сменой. Кадровое агентство берёт эту работу на себя.'],
  };

  I.t = function (k) {
    const row = UI[k];
    if (!row) return k;
    return (lang === 'ru' && row[1]) ? row[1] : row[0];
  };

  I.dur = function (sec, short) {
    const s = short ? GG.util.eta(sec) : GG.util.time(sec);
    if (lang !== 'ru') return s;
    const r = s.replace(/(\d)h\b/g, '$1ч').replace(/(\d)m\b/g, '$1м').replace(/(\d)s\b/g, '$1с');

    return short ? r.replace(/ /g, '') : r;
  };

  const INS = {

    's': 'с',

    'Capacity': 'Вместимость',        'Site left': 'Осталось на свалке',

    'Lifting': 'Откачка',           'Putting back': 'Возврат',
    'Status': 'Состояние',            'Max throughput': 'Предел переработки',
    'Charge': 'Заряд',                'Demand': 'Запрос',
    'Output': 'Выход',                'Emptying': 'Опустошение',
    'Carrying': 'Несёт',
    'Shelf 1': 'Полка 1', 'Shelf 2': 'Полка 2', 'Shelf 3': 'Полка 3',
    'SHELF 1': 'ПОЛКА 1', 'SHELF 2': 'ПОЛКА 2', 'SHELF 3': 'ПОЛКА 3',              'Wires in': 'Проводов внутрь',
    'Recruits': 'Сторонники',         'Next recruit at': 'Следующий сторонник при',
    'Workforce pool': 'Запас рабочей силы', 'Energy pool': 'Запас энергии',
    'Crew needed': 'Нужна бригада',   'Crew covers': 'Бригада покрывает',
    'Energy needed': 'Нужна энергия', 'Energy per kg': 'Энергия на кг',
    'Could cook': 'Может сварить',    'Could lift': 'Может извлечь',
    'For a full kilo': 'На полный килограмм', 'Split': 'Деление',
    'Working': 'В работе',            'Per WF/h': 'На РС/ч',
    'Plot grown': 'Роща выросла',     'Loads taken': 'Порций принято',
    'Arrays standing': 'Массивов стоит', 'Each array': 'Каждый массив',
    'Road laid': 'Уложено дороги', 'Each stretch': 'Каждый участок',
    'Assembly': 'Сборка',             'Stack': 'Склад',

    'One load is worth': 'Одна порция даёт', 'The next load wants': 'Следующая порция',
    'Fed so far': 'Скормлено',

    'Pressing': 'Прессование',        'Batches pressed': 'Партий спрессовано',
    'Cut': 'Выдано',
    'Till is full, press COLLECT': 'Касса полна — нажмите СОБРАТЬ',

    'Till is full, press BURN': 'Касса полна — нажмите СЖЕЧЬ',
    'Both tills are full': 'Обе кассы полны',
    'Next batch': 'Следующая партия',

    'Pays back': 'Возвращает',

    'PARTS': 'ДЕТАЛИ',                'ASSEMBLY': 'СБОРКА',
    'PRESSING': 'ПРЕСС',              'WORKFORCE': 'РАБ. СИЛА',
    'PRINTING': 'ПЕЧАТЬ',
    'ENERGY': 'ЭНЕРГИЯ',              'CHARGE': 'ЗАРЯД',
    'CAPACITY': 'ВМЕСТИМОСТЬ',

    'WAITING': 'В ВЫХОДЕ',

    'OUTLET': 'ВЫХОД',

    'SELLING': 'ПРОДАЖА',            'BURNING': 'СЖИГАНИЕ',

    'Labour': 'Труд',                 'Making': 'Производит',
    'Licence': 'Лицензия',            'A shift costs': 'Смена стоит',
    'In the tank': 'В баке',          'Burning': 'Сжигает',
    'Now': 'Сейчас',                  'Rests in': 'Отдых через',
    'Wakes in': 'Просыпается через',  'Built': 'Построено',
    'A warning costs': 'Предупреждение стоит', 'Warning': 'Предупреждение',
    'Generating': 'Вырабатывает',     'Building': 'Строит',
    'Campaigning': 'Агитирует',       'Pulling metal': 'Извлекает металл',
    'Meeting demand': 'Покрывает запрос',

    'Needs a Volunteer wired in': 'Нужен подведённый Волонтёр',
    'Needs energy wired in': 'Нужна подведённая энергия',
    'Needs workforce wired in': 'Нужна подведённая рабочая сила',
    'Nothing coming in': 'Ничего не поступает',
    'Nothing is asking for energy': 'Никто не просит энергии',
    'Nothing to read here': 'Здесь нечего читать',
    'Watching, the sky is clear': 'Наблюдает — небо чистое',
    'Too little charge to read anything': 'Слишком мало заряда, чтобы что-то прочесть',
    'No power': 'Нет энергии',
    'No power, so pure glass': 'Нет энергии — чистое стекло',
    'No crew, so pure aggregate': 'Нет бригады — чистый щебень',
    'No crew, so everything passes through': 'Нет бригады — всё проходит насквозь',
    'No heavy trash': 'Нет тяжёлого мусора',
    'No light trash': 'Нет лёгкого мусора',
    'Short of both, so it works less trash': 'Не хватает обоих — обрабатывает меньше мусора',
    'Short-handed, so the rest passes through': 'Не хватает рук — остальное проходит насквозь',
    'Both inputs cover it, the surplus is wasted': 'Обоих входов хватает — излишек пропадает',
    'Best split, a bigger crew is wasted': 'Лучшее деление — большая бригада уже лишняя',
    'Best split, extra energy is wasted': 'Лучшее деление — лишняя энергия пропадает',
    'Gathering parts': 'Собирает детали',
    'The road is finished': 'Дорога закончена',
    'Parts are ready, it needs workforce': 'Детали готовы — нужна рабочая сила',
    'Carbon is ready, it needs power': 'Углерод готов — нужна энергия',
    'The stack is full and nothing is taking them': 'Склад полон — их никто не забирает',

    'No workforce': 'Нет рабочей силы',
    'Short-handed, so the crew sets the rate': 'Не хватает рук — темп задаёт бригада',
    'Throttled, the stack is nearly full': 'Придушен — склад почти полон',
    'Stopped, no oil to burn': 'Остановлен — нечего жечь',
    'Stopped, press RUN': 'Остановлен — нажмите ПУСК',
    'Stopped, press START': 'Остановлен — нажмите СТАРТ',
    'Stopped, no uranium rods': 'Остановлен — нет урановых стержней',
    'Stopped, no plutonium pellets': 'Остановлен — нет плутониевых таблеток',
    'One load': 'Одна загрузка', 'Loaded': 'Загружено',

    'Still needed': 'Ещё нужно', 'Fuel': 'Топливо',
    'Built from': 'Строится из', 'Then': 'Дальше',
    'A flight': 'Полёт', 'In the hold': 'В трюме', 'Being built': 'Строится',
    'Empty the hold': 'Разгрузите трюм', 'Waiting for fuel': 'Ждёт топливо',
    'Waiting for crew': 'Ждёт экипаж', 'Ready, press LAUNCH': 'Готова — нажмите ЗАПУСК',
    'Exhaust': 'Выхлоп', 'Not enough CI for the exhaust': 'Не хватает ИЧ на выхлоп',
    'NOT ENOUGH CI': 'МАЛО ИЧ', 'NO CI': 'НЕТ ИЧ',
    'Running, but no oil is arriving': 'Работает, но нефть не поступает',
    'Waiting on energy': 'Ждёт энергию',
    'Waiting on workforce': 'Ждёт рабочую силу',

    'Waiting on materials': 'Ждёт материалы',
    'Short of materials': 'Не хватает материалов',

    'EMPTY': 'ПУСТО',
    'RESTORED': 'ВОССТАНОВЛЕНО',
    'HELD WIRE': 'ПРИДЕРЖАН',
    'RUNNING': 'РАБОТАЕТ',
    'NO OIL IN THE TANK': 'В БАКЕ НЕТ НЕФТИ',
    'NO RODS': 'НЕТ СТЕРЖНЕЙ',
    'NO PELLETS': 'НЕТ ТАБЛЕТОК',
    'IN FLIGHT': 'В ПОЛЁТЕ', 'EMPTY THE HOLD': 'РАЗГРУЗИТЕ ТРЮМ', 'HOLD FULL': 'ТРЮМ ПОЛОН', 'LAUNCH': 'ЗАПУСК',
    'START': 'СТАРТ',
    'FULL CREW': 'БРИГАДА ПОЛНАЯ',
    'Stopped': 'Стоит',
    'Held back': 'Не тянет',
    'STORM': 'ШТОРМ',
    'STRUCK': 'МОЛНИЯ',
    'NO GEAR': 'НЕТ СНАРЯЖЕНИЯ',
    'Only its robots are digging': 'Копают только роботы',
    'NO INDEX': 'НЕТ ИЧ',
    'SHORT': 'НЕ ХВАТАЕТ',
    'FULL': 'ПОЛНО',
    'BLOCKED': 'ЗАБИТ',
    'NO WIRE': 'НЕТ ПРОВОДА',
    'NO DEMAND': 'НЕТ СПРОСА',
    'READY': 'ГОТОВ',
    'A load of rods is in, press START': 'Стержни загружены — нажмите СТАРТ',

    'BUILDING': 'СТРОИТСЯ', 'NO PARTS': 'НЕТ ДЕТАЛЕЙ', 'HOLD FULL': 'ТРЮМ ПОЛОН',
    'NO FUEL': 'НЕТ ТОПЛИВА', 'CREWING': 'ЭКИПАЖ',
    'Gathering the parts to build it': 'Собирает детали для постройки',
    'Empty the metal out before the next flight': 'Выгрузите металл перед следующим полётом',
    'The crew is getting it ready': 'Экипаж готовит её к полёту',
    'Ready to fly, press LAUNCH': 'Готова к полёту — нажмите ЗАПУСК',
    'BANKING': 'КОПИТ',
    'OFF': 'ВЫКЛ', 'Switched off for now': 'Сейчас выключено',
    'NO BANK': 'НЕТ БАНКА',

    'NO ROCKS': 'НЕТ МЕТЕОРИТОВ', 'NOT YET': 'ЕЩЁ РАНО', 'ON ITS WAY': 'В ПУТИ',
    'NO ROOM': 'НЕТ МЕСТА', 'CHARGING': 'ЗАРЯЖАЕТСЯ',
    'Meteorites never fall here': 'Сюда метеориты не падают',
    'This place is waiting for its first meteorite': 'Это место ждёт свой первый метеорит',
    'The sky here is already full': 'Небо здесь уже занято',
    'No room for a meteorite in range': 'В радиусе нет места для метеорита',
    'Not charged yet': 'Ещё не заряжен',
    'One is already on its way': 'Один уже в пути',
    'SAVING': 'КОПИТ НА НАЙМ',
    'NOTHING TO HIRE': 'НЕГДЕ НАНИМАТЬ',
    'WASTING': 'ИЗБЫТОК',
    'HELD': 'ПРИДЕРЖАН',

    'ADD': 'ДОБАВИТЬ', 'DIAMONDS IN': 'АЛМАЗЫ ВНУТРИ', 'NO DIAMONDS': 'НЕТ АЛМАЗОВ',
    'Waiting for diamonds, press ADD under its card': 'Ждёт алмазы — нажмите ДОБАВИТЬ под карточкой',
    'Set': 'Готово',
    'BACKED UP': 'ПОДПЁРТ',
    'NO POWER': 'НЕТ ЭНЕРГИИ',
    'DONE': 'ГОТОВО',
    'NO CREW': 'НЕТ БРИГАДЫ',
    'LOW POWER': 'МАЛО ЭНЕРГИИ',
    'LOW CREW': 'МАЛО РУК',
    'A storm has put the fire out': 'Шторм погасил огонь',
    'No Clean Index left to spend on power': 'Не осталось Индекса Чистоты на энергию',
    'Clean Index is short, so it burns less oil': 'Индекса Чистоты мало, поэтому он жжёт меньше нефти',
    'Lightning has frozen the grid': 'Молния заморозила сеть',
    'Lightning has taken the grid down': 'Молния обесточила сеть',
    'Lightning: the run is paused': 'Молния: работа на паузе',
    'Output is full and nothing is taking it':
      'Выход забит — ниже по цепи никто не забирает',
    'Output is full and nothing is wired to it': 'Выход забит — к нему ничего не подключено',
    'The output limit is 0, so nothing leaves': 'Предел выдачи 0 — наружу ничего не идёт',
    'One output is full, the rest still moves':
      'Один из выходов забит — остальное ещё идёт',

    'One output is full, so the whole machine has stopped':
      'Один из выходов забит — машина встала целиком',
    'One output has no wire, so the whole machine has stopped':
      'К одному из выходов не подведён провод — машина встала целиком',
    'Nothing downstream needs power': 'Ниже по цепи энергия никому не нужна',
    'No power coming in': 'Энергия не поступает',

    'POOL FULL': 'ЗАПАС ПОЛОН',
    'Workforce is full and waits for power': 'Рабочая сила набрана и ждёт энергию',
    'Power is full and waits for workforce': 'Энергия набрана и ждёт рабочую силу',
    'This ground is fully restored': 'Эта земля полностью восстановлена',
    'No workforce coming in': 'Рабочая сила не поступает',
    'Short of workforce, so mostly the cheap half':
      'Не хватает рабочей силы — идёт в основном дешёвая половина',
    'Short of power, so mostly the cheap half':
      'Не хватает энергии — идёт в основном дешёвая половина',
    'Working (day)': 'Работает (день)',
    'Resting (night)': 'Отдыхает (ночь)',
    'idle': 'простаивает',
    'not running': 'не работает',
    'nothing yet': 'пока ничего',
    'nothing wired in': 'ничего не подведено',
    'nothing yet, any grade': 'пока ничего — любой сорт',

    'Takes': 'Берёт',                 'Makes': 'Даёт',

    'Prints': 'Печатает',            'Otherwise': 'Иначе',
    'Printed': 'Напечатано',
    'Also out': 'Ещё на выход',       'Note': 'Как это работает',
    'What it is': 'Что это',          'Fills to': 'Заполняется до',
    'Holds': 'Хранит',                'Gives': 'Отдаёт',
    'Hires': 'Нанимает',              'Each hand': 'Каждый работник',
    'Then': 'Дальше',                 'Pays': 'Платит',
    'Costs': 'Стоит',
    'Most power': 'Предел мощности',
    'Robots': 'Роботы',
    'Crew': 'Бригада',                'Also takes': 'Ещё принимает',
    'Sells': 'Продаёт',               'Burns': 'Сжигает',
    'Which does': 'Что это даёт',     'Watch out': 'Осторожно',

    'Ground rather than a machine, and you build on it': 'Земля, а не машина — на ней строят',
    'what the machines downstream ask for, until it runs dry':
      'ровно столько, сколько просят машины ниже по цепи, пока не опустеет',
    'everything that reaches it, and its reserve on top when more is wanted':
      'всё, что приходит, и запас сверх того, когда просят больше',

    'what the machines downstream can use, and its reserve on top when they want more':
      'столько, сколько машины ниже по цепи могут взять, и запас сверх того, когда им нужно больше',
    'To bank it': 'Чтобы копить',
    'set an output limit, and it keeps back whatever is over that':
      'поставьте предел выдачи — всё, что сверх него, уйдёт в запас',

    'nothing to do, whatever downstream cannot use stays in the cells':
      'ничего делать не нужно — всё, что ниже по цепи взять не могут, остаётся в ячейках',
    'works like a Volunteer while the contract runs':
      'работает как Волонтёр, пока идёт контракт',
    'a contract signed while hands are working costs more for every one of them':
      'контракт, подписанный когда работники уже наняты, стоит дороже за каждого из них',
    'workforce AND energy, into two separate pools':
      'рабочую силу И энергию, в два отдельных запаса',
    'their sum, out of one wire': 'их сумму, одним проводом',
    'each shelf out of its own wire': 'каждую полку своим проводом',
    'Full, and ready to be carried': 'Полна и готова к перевозке',
    'Every shelf is full': 'Все полки заполнены',
    'More power than it can use, and the rest is thrown away':
      'Энергии больше, чем машина может использовать, остальное пропадает',
    'It only hires while it sits on a Bank': 'Нанимает только стоя на Банке',
    'Waiting for its Bank to earn the next contract': 'Ждёт, пока Банк заработает на следующий контракт',
    'Pays with': 'Платит из',
    'Hires at': 'Нанимает в',
    'No Hiring Post or Labour Exchange in this place': 'Здесь нет ни Пункта найма, ни Биржи труда',
    'The storage ahead is full, so it is keeping what arrives':
      'Хранилище впереди полное, поэтому она придерживает то, что приходит',
    'Full, and the power arriving above what leaves is being lost':
      'Полна: энергия, приходящая сверх того, что уходит, теряется',
    'Holds': 'Хранит',
    'one wire in': 'один провод на вход',
    'two wires out, split by the two weights you type':
      'два провода на выход, в заданной вами пропорции',
    'five wires out, split by the five weights you type':
      'пять проводов на выход, в заданной вами пропорции',
    'if one output is full, the others keep their share':
      'если один выход заполнен, остальные получают свою долю',
    'two wires out, all of it to one side':
      'два провода на выход, всё на одну сторону',
    'if one output is full, the other keeps its share':
      'если один выход заполнен, второй получает свою долю',
    'a blocked output throttles both sides, so the ratio you typed is the promise':
      'забитый выход придерживает обе стороны — заданная пропорция соблюдается всегда',

    'the crew you wire in sets how fast it empties':
      'бригада, которую вы подвели, задаёт скорость разгрузки',
    'always': 'всегда',

    '80 KW straight into the cells': '80 кВт прямо в ячейки',
    'Every strike': 'За каждый разряд',

    'four times whatever a Volunteer makes, so every upgrade to them reaches it':
      'вчетверо больше того, что делает Волонтёр, так что каждое их улучшение доходит и до него',
    'banked the instant it is made; a plot fills as it goes':
      'зачисляется сразу же, как только сделано; роща заполняется по ходу дела',

    'banked the instant it is made':
      'зачисляется сразу же, как только сделано',
    'one kilogram in makes more than a kilogram out, because this step is a step UP':
      'из одного килограмма выходит больше килограмма — это шаг ВВЕРХ',
    'one load: x1.1 on everything it grows, for ever':
      'одна загрузка: ×1.1 ко всему, что он выращивает, навсегда',
    'straight out of the ground, and the site pays the mass':
      'прямо из земли — массу отдаёт свалка',
    'mass is conserved; anything the supply cannot cover passes straight out of the second socket':
      'масса сохраняется; всё, на что не хватило питания, выходит через второй разъём',
    'the rest of the kilo is gone, because this step is a step UP rather than a filter':
      'остаток килограмма пропадает — это шаг ВВЕРХ, а не фильтр',
    'a steady flow rather than a batch. Short of any one of them it simply makes less, and the rest waits in the hopper':
      'ровный поток, а не партия — при нехватке любого из них он просто делает меньше, ' +
      'остальное ждёт в бункере',
    'one kilo of EACH, not one kilo between them':
      'по килограмму КАЖДОГО, а не килограмм на двоих',
  };

  const SPEC = [

    [/^(.+) kg (.+) \+ (.+) kg (.+) \+ (.+) KW$/, '$1 кг $2 + $3 кг $4 + $5 кВт'],
    [/^(.+) kg (.+) \+ one material \+ (.+) KW$/, '$1 кг $2 + один материал + $3 кВт'],
    [/^(.+) from (.+) kg (.+)$/, '$1 из $2 кг $3'],
    [/^any other material, for one (.+) at (.+) times the cost$/,
     'любой другой материал — один $1, но в $2 раза дороже'],
    [/^it gathers both before it draws any power, and each print costs more than the last$/,
     'Сначала он набирает оба, и только потом берёт энергию. Каждая следующая печать дороже предыдущей'],
    [/^it has no print for that material, so it presses a diamond instead, at (.+) times the cost$/,
     'Для этого материала печати нет, поэтому он жмёт алмаз — в $1 раза дороже'],
    [/^each print costs more than the last, counted separately for each boost and for diamonds, and kept across every Print Works you build$/,
     'Каждая следующая печать дороже предыдущей. Счёт отдельный для каждого усиления и для алмазов и общий для всех Печатных цехов'],

    [/^each 1 WF\/h empties ([\d.,]+) (\S+) and ([\d.,]+) (\S+) from its tills at the same time$/,
     'каждый 1 РС/ч вычерпывает $1 $2 и $3 $4 из касс одновременно'],
    [/^each 1 WF\/h clears ([\d.,]+) (\S+), so give it less crew than it earns and it still fills up$/,
     'каждый 1 РС/ч вычерпывает $1 $2, так что если бригады меньше, чем заработка, он всё равно наполнится'],

    [/^one load runs it for (\d+) real minutes$/, 'одной загрузки хватает на $1 реальных минут'],

    [/^after that, every flight needs only turbofuel and crew$/,
     'после этого каждому полёту нужны только турботопливо и экипаж'],
    [/^built once; each flight is away (\d+) real minutes$/,
     'строится один раз; каждый полёт длится $1 реальных минут'],

    [/^lifted out of the ground it stands on, and that ground pays the mass$/,
     'поднято из земли, на которой он стоит, — и эта земля платит за массу'],

    [/^straight out of the rock it stands on, and the rock pays the mass$/,
     'прямо из глыбы, на которой он стоит, — и глыба платит за массу'],
    [/^straight out of the rock, and the rock pays the mass\. Every meteorite carries its own mix, so these are averages$/,
     'прямо из глыбы, — и глыба платит за массу. У каждого метеорита свой состав, ' +
     'так что это средние значения'],

    [/^([\d.]+) CI per KW\/h$/, '$1 ИЧ за кВт/ч'],

    [/^([\d.,]+[KMB]?) CI a launch$/, '$1 ИЧ за запуск'],

    [/^([\d.]+)% of its value a minute$/, '$1% от его стоимости в минуту'],
    [/^the gold is kept, never used up$/, 'золото хранится и не расходуется'],
    [/^only what the Bank under it earns$/, 'только то, что зарабатывает Банк под ним'],
    [/^its Bank's earnings, or your money by hand$/, 'доходов своего Банка, а вручную из ваших денег'],
    [/^the Hiring Posts and Labour Exchanges in its place$/, 'Пунктах найма и Биржах труда своего места'],

    [/^it piles up in a till of (\d+) and JAMS when full, so press (.+); the plot fills as it goes$/,
     'копится в кассе на $1 и ЗАБИВАЕТСЯ, когда та полна — нажмите «$2»; роща заполняется по ходу дела'],

    [/^it fills its cell first, then works at up to ([\d.]+) WF\/h$/,
     'сначала заряжает батарею, потом работает — до $1 РС/ч'],
    [/^each load gives back (\d+)% of its steady power while the sun is up, and the load after it wants ([\d.]+) kg more$/,
     'каждая порция возвращает $1% его обычного расхода, пока светит солнце, а следующая просит на $2 кг больше'],
    [/^with (\d+) loads it runs overdriven on no power at all$/,
     'с $1 порциями он работает в форсаже вообще без энергии'],
    [/^every kilogram it eats is worth \+([\d.]+) on this machine for good, and the load after it wants ([\d.]+) kg more$/,
     'каждый съеденный килограмм даёт +$1 к этой машине навсегда, а следующая порция просит на $2 кг больше'],
    [/^one batch, the FIRST one\. Every batch costs a fifth of this one more than the last, and every (\d+) batches press one more stone$/,
     'одна партия, ПЕРВАЯ — каждая следующая дороже этой на пятую часть, и каждые $1 партий выходит на один камень больше'],

    [/^one batch, the FIRST one\. Every batch costs a fifth of this one more than the last, and the diamonds are put in by hand and never rise$/,
     'одна партия, ПЕРВАЯ — каждая следующая дороже этой на пятую часть, а алмазы вкладываются вручную и не дорожают'],
    [/^only while a licence is running, and (\d+) CI buys (\d+) real minutes$/,
     'только пока действует лицензия — $1 ИЧ даёт $2 реальных минут'],
    [/^while the sun is up, (\d+)s on and (\d+)s off$/,
     'пока светит солнце — $1 с работы, $2 с отдыха'],
    [/^bleeds ([\d.]+) KW\/h with nothing wired out$/,
     'теряет $1 кВт/ч, когда на выход ничего не подключено'],
    [/^up to (\d+) hands, for up to ([\d.]+) min$/,
     'до $1 работников, на срок до $2 мин'],
    [/^one recruit when BOTH pools reach ([\d.]+), and it works like a Volunteer for ever$/,
     'одного постоянного сторонника, когда ОБА запаса достигнут $1 — он работает как Волонтёр навсегда'],
    [/^every recruit this machine has raised makes its next one ([\d.]+)% dearer$/,
     'каждый поднятый этой машиной сторонник делает следующего дороже на $1%'],
    [/^every array this machine has raised makes its next one ([\d.]+)% dearer$/,
     'каждый поднятый этой машиной массив делает следующий дороже на $1%'],

    [/^every stretch this machine has laid makes its next one ([\d.]+)% dearer$/,
     'каждый уложенный этой машиной участок делает следующий дороже на $1%'],

    [/^every dome this machine has built makes its next one ([\d.]+)% dearer, in materials and in labour alike$/,
     'каждый построенный этой машиной купол делает следующий дороже на $1% — и по ' +
     'материалам, и по труду'],
    [/^up to (\d+) wires of the same thing$/, 'до $1 проводов с одним и тем же'],
    [/^([\d.,]+) kg of one fluid$/, '$1 кг одной жидкости'],

    [/^([\d.,]+) kg of one material$/, '$1 кг одного материала'],
    [/^up to (\d+) wires into each of (\d+) shelves$/, 'до $1 проводов на каждую из $2 полок'],
    [/^([\d.,]+) kg on each shelf, one material a shelf$/, '$1 кг на каждой полке, по одному материалу'],
    [/^([\d.,]+) kg\/h, set in its panel$/, '$1 кг/ч — задаётся в её панели'],
    [/^1 wire, and every grade below has a price$/, '1 провод — цена каждого сорта ниже'],
    [/^(\d+) wires, and every grade below has a price$/, '$1 провода — цена каждого сорта ниже'],
    [/^(.+) into a till of ([\d.]+)$/, '$1 в кассу вместимостью $2'],

    [/^1 wire into (.+), a till of ([\d.]+)$/, '1 провод в $1, касса на $2'],
    [/^(\d+) wires into (.+), a till of ([\d.]+)$/, '$1 провода в $2, касса на $3'],
    [/^each till JAMS its own half when it fills, so the other side carries on working$/,
     'каждая касса ЗАБИВАЕТ только свою половину, когда полна, — другая сторона продолжает работать'],
    [/^it JAMS when the till is full, so press (.+) to empty it$/,
     'она ЗАБИВАЕТСЯ, когда касса полна — нажмите «$1», чтобы опустошить'],
    [/^energy, into a bank of ([\d.]+) KW$/, 'энергию, в накопитель на $1 кВт'],

    [/^a meteorite for ([\d.,K]+) KW, in its own place and within ([\d.,K]+) of it$/,
     'метеорит за $1 кВт, в своём месте и в радиусе $2 от маяка'],
    [/^nothing, and it spends ([\d.]+) KW to name the next weather before it lands$/,
     'ничего — он тратит $1 кВт, чтобы назвать следующую погоду до того, как она придёт'],
    [/^the best split there is; short of it you get (.+) instead$/,
     'лучшее возможное разделение; при нехватке вместо этого идёт $1'],
    [/^a tug of war: workforce pulls toward (.+), energy toward (.+)$/,
     'перетягивание каната: рабочая сила тянет к $1, энергия — к $2'],

    [/^one kilogram of (.+) is worth that much Clean Index, and the power only sets how fast it is worked through\. With none of it the machine does nothing at all$/,
     'один килограмм — $1 — стоит столько Индекса чистоты, а мощность лишь задаёт, ' +
     'насколько быстро он расходуется; совсем без неё машина не делает ничего'],
    [/^one array, giving that much energy for ever at a (.+)'s rate, so every skill on that machine reaches it$/,
     'один массив: столько энергии навсегда, по ставке машины «$1» — так что все её ' +
     'улучшения действуют и здесь'],

    [/^one stretch of road, paying that much for ever at a (.+)'s rate and a (.+)'s, so every skill on either machine reaches it$/,
     'один участок дороги: столько навсегда, по ставкам машин «$1» и «$2» — так что ' +
     'улучшения обеих действуют и здесь'],

    [/^one dome, paying that much Clean Index for ever and consuming nothing afterwards$/,
     'один купол: столько Индекса чистоты навсегда, и больше он ничего не потребляет'],

    [/^one (.+)$/, 'один $1'],
  ];

  const UNITS = [

    [/ stretches$/, ' участков'],

    [/^In · /, 'Вход · '], [/^Out · /, 'Выход · '],
    [/^Waiting on /, 'Ждёт: '], [/^Running dry, supplying /, 'Иссякает — отдаёт '],
    [/^Running, (\d+)s left$/, 'Работает, осталось $1 с'],

    [/^In flight, (\d+)s left$/, 'В полёте, осталось $1 с'],
    [/^BUILDING (\d+)%$/, 'СТРОИТСЯ $1%'], [/^FUEL /, 'ТОПЛИВО '], [/^CREW /, 'ЭКИПАЖ '],

    [/^Short of /, 'Не хватает: '], [/ per kg\b/g, ' на кг'],

    [/^DAY /, 'ДЕНЬ '], [/^NIGHT /, 'НОЧЬ '],

    [/^NO /, 'НЕТ '],
    [/^Till is full, press BURN$/, 'Касса полна — нажмите СЖЕЧЬ'],
    [/^Till is full, press /, 'Касса полна — нажмите '],

    [/ kg waiting$/, ' кг ждёт'],
    [/\bKW\/h\b/g, 'кВт/ч'], [/\bWF\/h\b/g, 'РС/ч'], [/\bkg\/h\b/g, 'кг/ч'],
    [/\bCI\/h\b/g, 'ИЧ/ч'], [/\$\/h\b/g, '$/ч'], [/◆\/h/g, '◆/ч'],
    [/\bKW\b/g, 'кВт'], [/\bWF\b/g, 'РС'], [/\bkg\b/g, 'кг'], [/\bCI\b/g, 'ИЧ'],
    [/(\d)s left\b/g, '$1 с осталось'], [/(\d)s ahead\b/g, '$1 с заранее'],

    [/(\d)s\b/g, '$1 с'],
    [/\bof oil\b/g, 'нефти'], [/\bof\b/g, 'из'],
    [/Wired to nothing, bleeding/, 'Ни к чему не подключён — теряет'],

    [/\bmachines\b/g, 'машин'], [/\bmachine\b/g, 'машина'],
    [/\brecruits\b/g, 'сторонников'], [/\brecruit\b/g, 'сторонник'],
    [/\barrays\b/g, 'массивов'], [/\barray\b/g, 'массив'],

    [/\bloads\b/g, 'порций'], [/\bload\b/g, 'порция'],
    [/\blevel (\d+)\b/g, 'уровень $1'],
    [/\bhand\b/g, 'работник'], [/\bhands\b/g, 'работников'],
  ];
  I.ins = function (s) {
    if (typeof s !== 'string' || !s) return s;
    if (lang !== 'ru') return s;
    if (INS[s] !== undefined) return INS[s];

    if (RU.label && RU.label[s] !== undefined) return RU.label[s];

    for (let i = 0; i < SPEC.length; i++) {
      if (SPEC[i][0].test(s)) return s.replace(SPEC[i][0], SPEC[i][1]);
    }
    let out = s;
    UNITS.forEach(function (u) { out = out.replace(u[0], u[1]); });
    return out;
  };

  I.insMissing = function () { return I.__insSeen ? [...I.__insSeen].sort() : []; };

  const MSG = {
    'Saved': 'Сохранено',
    'Wire removed': 'Провод убран',
    'Wire straightened': 'Провод выпрямлен',
    'That wire is gone': 'Этого провода больше нет',

    'Nothing can be built in here': 'Здесь ничего нельзя построить',
    'Nothing can be moved in here': 'Здесь ничего нельзя передвинуть',
    'Nothing can be wired in here': 'Здесь ничего нельзя соединить',
    'Could not open the practice room': 'Не удалось открыть тренировку',
    'Could not save your run first': 'Не удалось сначала сохранить вашу игру',
    'Could not copy your run': 'Не удалось скопировать вашу игру',
    'Already in the practice room': 'Вы уже в тренировке',
    'No run is open': 'Игра не открыта',
    'The menu is open': 'Открыто меню',

    'Undone': 'Отменено',
    'Nothing to undo': 'Нечего отменять',
    'Nothing here reaches your run': 'Ничего отсюда не попадёт в вашу игру',
    'None printed': 'Ничего не напечатано',
    'That was done in another place': 'Это сделано в другом месте',
    'That machine is gone': 'Этой машины уже нет',
    'No room to put it back': 'Некуда вернуть',

    'Wire squared off': 'Провод выпрямлен',
    'Wire curved': 'Провод скруглён',
    'Wire connected': 'Провод подключён',
    'A robot has every Solar Kit now, so its kit wire was removed':
      'У робота теперь все солнечные наборы, провод для наборов убран',

    'A robot has every Solar Kit now, so its kit and power wires were removed':
      'У робота теперь все солнечные наборы, провода для наборов и энергии убраны',
    'A robot has every Solar Kit now, so its power wire was removed':
      'У робота теперь все солнечные наборы, провод энергии убран',
    'Use DEMOLISH in the panel on the right': 'Используйте СНЕСТИ на панели справа',
    'A machine already works this site': 'На этой свалке уже работает машина',
    'This site is stripped bare': 'Эта свалка выбрана до дна',
    'This plot is fully grown': 'Эта роща выросла полностью',
    'A Trash Site is stripped bare — nothing left in it':
      'Свалка выбрана до дна — в ней ничего не осталось',
    'No room there': 'Здесь нет места',
    'No room for the whole group there': 'Здесь не хватит места на всю группу',
    'Both slots are taken': 'Оба гнезда заняты',
    'Blueprint deleted': 'Чертёж удалён',
    'Tutorial restarted': 'Обучение начато заново',
    'Tutorial closed': 'Обучение закрыто',
    'Tutorial closed. Replay it from the Codex':
      'Обучение закрыто — повторить можно из Справочника',
    'A diamond appeared on the map': 'На карте появился алмаз',
    'Your Surge Arrestors caught it. The grid is untouched':
      'Ваша Грозозащита приняла удар — сеть не пострадала',

    'Not enough diamonds': 'Не хватает алмазов',
    'It has its diamonds': 'Алмазы уже внутри',
    'Nothing to add': 'Нечего добавлять',

    'No Prism left': 'Призм не осталось',
    'All its slots are full': 'Все гнёзда заняты',
    'This machine cannot take a Prism': 'Эта машина не принимает призму',
    'Already claimed': 'Уже получено',
    'Not done yet': 'Ещё не выполнено',
    'Already at max level': 'Уже максимальный уровень',
    'Not in this build yet': 'Пока не в этой сборке',
    'Already at the highest limit': 'Уже максимальный предел',
    'That machine has no limit': 'У этой машины нет предела',
    'Not unlocked': 'Не открыто',
    'Not open yet': 'Ещё не открыто',
    'Locked': 'Закрыто',
    'Overlaps a site': 'Пересекается со свалкой',
    'Overlaps another machine': 'Пересекается с другой машиной',

    'Only free-standing machines can be moved': 'Переносить можно только отдельно стоящие машины',
    'Moving is switched off': 'Перенос отключён',
    'Nothing left to move': 'Переносить больше нечего',
    'Blocked': 'Нельзя',
    'That input already has a wire': 'К этому входу уже подведён провод',
    'Wire one of them to something else first': 'Сначала подключите один из них к чему-то другому',
    'A splitter cannot carry that': 'Делитель не может это нести',
    'Cannot wire a machine to itself': 'Нельзя соединить машину саму с собой',
    'A wire cannot cross between two places': 'Провод не может идти между двумя местами',
    'A blueprint can only hold free-standing machines':
      'Чертёж может содержать только отдельно стоящие машины',
    'No such socket': 'Такого гнезда нет',
    'Missing machine': 'Машина отсутствует',
    'Not a Hiring Post': 'Это не Пункт найма',
    'Nothing to collect': 'Собирать нечего',
    'Nothing to pick up': 'Подбирать нечего',
    'Nothing to run': 'Запускать нечего',
    'No oil in the tank': 'В баке нет нефти',
    'No uranium rods loaded': 'Урановые стержни не загружены',

    'Nothing to launch': 'Запускать нечего', 'Not built yet': 'Ещё не построен',
    'Empty the metal out of the hold first': 'Сначала выгрузите металл из трюма',
    'Every Hiring Post is full': 'Все пункты найма заполнены', 'No Labour Exchange has room': 'Ни на одной бирже нет мест',
    'Not enough turbofuel': 'Мало турботоплива', 'The crew is not ready': 'Экипаж не готов',
    'Not enough CI for the exhaust': 'Не хватает ИЧ на выхлоп',
    'The sun is already up': 'Солнце уже взошло',
    'Nothing that uses it is unlocked yet': 'Ещё не открыто ничего, что это использует',
    'Nothing to read here': 'Здесь нечего читать',
    'Unknown boost': 'Неизвестное усиление',
    'Unknown objective': 'Неизвестная цель',
    'Unknown skill': 'Неизвестный навык',
    'This plot is fully grown': 'Этот участок полностью зарос',
    'Only a machine can clean this': 'Это может очистить только машина',

    'A meteorite came down in %s': 'Метеорит упал: %s',
    'A plutonium rock came down in %s': 'Упала плутониевая глыба: %s',
    'Only on a plutonium rock': 'Только на плутониевой глыбе',
    'Not on a plutonium rock': 'Не на плутониевой глыбе',
    'Not while it is in flight': 'Не во время полёта',
    'Not while it is running': 'Не во время работы',
    'No plutonium pellets loaded': 'Плутониевые таблетки не загружены',
    'Not enough plutonium pellets': 'Мало плутониевых таблеток',
    'The meteorite is dug out': 'Метеорит выработан',

    'Nothing to pull': 'Нечего вызывать',
    'Not charged yet': 'Ещё не заряжен',
    'Nowhere for one to fall': 'Некуда падать',
    'The sky is already full': 'Небо уже занято',
    'One is already on its way': 'Один уже в пути',
    'The meteorite found nowhere to land. Charge returned': 'Метеориту некуда упасть. Заряд возвращён',

    'Meteorites never fall here': 'Сюда метеориты не падают',
    'This place is waiting for its first meteorite': 'Это место ждёт свой первый метеорит',
    'The sky here is already full': 'Небо здесь уже занято',
    'No room for a meteorite in range': 'В радиусе нет места для метеорита',
    'Waiting on energy': 'Ждёт энергию',

    'No room for another one': 'Нет места для ещё одного',
    'EMPTY': 'ПУСТО', 'NONE': 'НЕТ', 'MACHINE': 'МАШИНА',
  };

  const MSG_RULES = [

    [/^(.+) printed a diamond$/, '$1 напечатал алмаз'],
    [/^(.+) printed (\d+) diamonds$/, '$1 напечатал алмазов: $2'],
    [/^(.+) printed (.+), it waits in Boosts$/, '$1 напечатал: $2. Ждёт в «Усилениях»'],
    [/^(.+) printed (.+)$/, '$1 напечатал: $2'],
    [/^Built (.+?)( for .*)?$/, 'Построено: $1$2'],
    [/^Demolished (.+)$/, 'Снесено: $1'],
    [/^Stamped (.+)$/, 'Поставлен чертёж: $1'],
    [/^Blueprint saved: (.+)$/, 'Чертёж сохранён: $1'],
    [/^Claimed (.+?) — \+(.+)$/, 'Получено: $1 — +$2'],
    [/^Unlocked: (.+)$/, 'Открыто: $1'],
    [/^Arrived at (.+)$/, 'Прибытие: $1'],

    [/^(.+) — coming back, stage (\d+) of (\d+)$/, '$1 — возвращается к жизни, стадия $2 из $3'],

    [/^(.+) is open\. There is nothing left to strip here\.$/,
     '$1 открыт. Здесь больше нечего разбирать.'],
    [/^Hired (\d+) for (.+)$/, 'Нанято: $1 на $2'],
    [/^Docked to a Bank$/, 'Поставлено на Банк'],
    [/^Taken off its Bank$/, 'Снято с Банка'],
    [/^Only on a Bank with room for an Agency$/, 'Только на Банке, где есть место для агентства'],
    [/^It can only stand on a Bank$/, 'Оно может стоять только на Банке'],
    [/^An Agency stands on it$/, 'На нём стоит агентство'],
    [/^Diamond collected: (.+)$/, 'Алмаз подобран — $1'],
    [/^Objective ready to claim: (.+)$/, 'Цель выполнена, можно забрать: $1'],
    [/^Someone joined the cause — (.+)$/, 'К вам присоединились — $1'],

    [/^A (.+) raised an array — (\d+) now standing$/,
     '$1 — массив поднят, всего: $2'],
    [/^A (.+) laid a stretch — (.+)$/,
     '$1 — участок уложен, всего: $2'],

    [/^A (.+) is finished, (\d+) now standing$/,
     '$1 — купол готов, всего: $2'],
    [/^A (.+) took its fertilizer — it now grows ×(.+)$/,
     '$1 — удобрение принято, рост ×$2'],

    [/^A (.+) cut a diamond — press COLLECT$/,
     '$1 — алмаз готов, нажмите СОБРАТЬ'],
    [/^A (.+) cut (\d+) diamonds — press COLLECT$/,
     '$1 — алмазов готово: $2, нажмите СОБРАТЬ'],

    [/^A (.+) made a Prism\. Press COLLECT\.$/, '$1 сделал призму. Нажмите СОБРАТЬ.'],
    [/^A (.+) made (\d+) Prisms\. Press COLLECT\.$/, '$1 сделал призм: $2. Нажмите СОБРАТЬ.'],
    [/^A hired hand went home$/, 'Наёмный работник ушёл домой'],
    [/^(\d+) hired hands went home$/, '$1 наёмных работников ушли домой'],
    [/^A Trash Site is stripped bare and gone(.*)$/, 'Свалка выбрана до дна и исчезла$1'],
    [/^(.+) has worn off$/, '$1 закончилось'],
    [/^The (.+) has passed$/, '$1 — закончилось'],
    [/^(.+) incoming over (.+) — (.+)$/, '$1 надвигается на $2 — $3'],
    [/^(.+) over (.+) — (.+)$/, '$1 над $2 — $3'],
    [/^([^—]+) over ([^—]+)$/, '$1: $2'],
    [/^(.+) — the sun is back up$/, '$1 — солнце снова взошло'],
    [/^(.+): you may now build (.+)$/, '$1: теперь можно строить $2'],

    [/^Within reach: (.+) — (.+)$/, 'Уже доступно: $1 — $2'],
    [/^Not enough (.+)$/, 'Не хватает: $1'],
    [/^Cannot build on a (.+)$/, 'Нельзя строить на: $1'],
    [/^Must be built on a (.+)$/, 'Должно стоять на: $1'],
    [/^Only on a (.+)$/, 'Только на: $1'],

    [/^All (\d+) are built — raise the limit in Capacity$/,
     'Все $1 уже построены — поднимите предел во «Вместимости»'],

    [/^There is only ever one$/, 'Он такой один'],
    [/^There are only ever (\d+)$/, 'Их бывает только $1'],

    [/^The Strike Vault took the bolt: (.+) KW banked$/,
     'Грозовой накопитель принял разряд: $1 кВт в запасе'],
    [/^All (\d+) are already working$/, 'Все $1 уже работают'],
    [/^All (.+)$/, 'Все $1'],
    [/^Already running, (.+)$/, 'Уже работает — $1'],
    [/^Cooling after a meltdown, (.+) left$/, 'Остывает после расплавления, осталось $1'],
    [/^Rods: ([\d.]+) of ([\d.]+) kg loaded$/, 'Стержни: загружено $1 из $2 кг'],
    [/^Pellets: ([\d.]+) of ([\d.]+) kg loaded$/, 'Таблетки: загружено $1 из $2 кг'],
    [/^Already in flight, (\d+)s left$/, 'Уже в полёте — осталось $1 с'],
    [/^A Skytrawler is back with ([\d.,KM]+) kg of metal$/, 'Космотрал вернулся: $1 кг металла'],
    [/^A Skytrawler is back with (\d+) diamonds$/, 'Космотрал вернулся: алмазов $1'],
    [/^A Skytrawler is back, but its hold is full$/, 'Космотрал вернулся, но трюм полон'],
    [/^The Skytrawler is built, now it needs turbofuel and crew$/,
     'Космотрал построен, теперь ему нужны турботопливо и экипаж'],
    [/^This machine is carrying (.+)$/, 'Эта машина несёт: $1'],
    [/^This shelf is carrying (.+)$/, 'Эта полка несёт: $1'],

    [/^Its output goes to (.+), which takes nothing this can carry$/,
     'Его выход идёт в $1 — туда не подходит ничего из того, что это может нести'],
    [/^Its output goes to (.+), which does not take (.+)$/,
     'Его выход идёт в $1 — туда не принимается: $2'],
    [/^(.+) does not take (.+)$/, '$1 не принимает: $2'],

    [/^One to a place, and this one already has one$/,
     'По одной на место, и одна здесь уже стоит'],
    [/^One to a place, and this one already has (.+)$/,
     'По одной на место, а здесь уже есть: $1'],
    [/^Nothing to read here — only in (.+)$/, 'Здесь нечего читать — только в: $1'],

    [/^No weather falls here — only in (.+)$/,
     'Здесь не бывает погоды — только в: $1'],

    [/^Moved (\d+) machines? to (.+?) — (\d+) wires? cut, they could not follow$/,
     'Перенесено машин: $1 — в «$2»; проводов оборвано: $3, они не смогли последовать'],
    [/^Moved (\d+) machines? — (\d+) wires? cut, they could not follow$/,
     'Перенесено машин: $1 — проводов оборвано: $2, они не смогли последовать'],
    [/^Moved (\d+) machines? to (.+)$/, 'Перенесено машин: $1 — в «$2»'],
    [/^Moved (\d+) machines?$/, 'Перенесено машин: $1'],
    [/^A (.+) can only stand where the weather is$/,
     '$1 может стоять только там, где бывает погода'],
    [/^One (.+) to a place, and this one has one already$/,
     'По одной на место: $1 — здесь уже есть'],
    [/^One (.+) to a place, and this one has no room$/,
     'По одной на место: $1 — здесь нет места'],
  ];
  I.msg = function (s) {
    if (typeof s !== 'string' || !s) return s;
    if (lang !== 'ru') return s;
    if (MSG[s] !== undefined) return MSG[s];
    for (let i = 0; i < MSG_RULES.length; i++) {
      const r = MSG_RULES[i];
      if (r[0].test(s)) return I.ins(s.replace(r[0], r[1]));
    }
    return I.ins(s);
  };

  const RU = {

    label: {
      'Workforce': 'Рабочая сила',

      'Out': 'Выход',
      'In': 'Вход',

      'Solar Kit': 'Комплект панелей',
      'Energy': 'Энергия',
      'Trash': 'Мусор',
      'Trash A': 'Мусор А',
      'Trash B': 'Мусор Б',
      'Recycled trash': 'Переработанный мусор',
      'Light trash': 'Лёгкий мусор',
      'Heavy trash': 'Тяжёлый мусор',
      'Metal': 'Металл',
      'Aluminium': 'Алюминий',
      'Steel': 'Сталь',
      'Lead': 'Свинец',
      'Hazmat Gear': 'Защитное снаряжение',
      'Uranium Rods': 'Урановые стержни',
      'Turbofuel': 'Турботопливо',
      'Plutonium': 'Плутоний',
      'Plutonium Pellets': 'Плутониевые таблетки',
      'Nuclear waste': 'Ядерные отходы',
      'Hazardous waste': 'Опасные отходы',
      'Batteries': 'Батареи',
      'Plastic': 'Пластик',

      'Organic waste': 'Органика',
      'Fertilizer': 'Удобрение',
      'Oil': 'Нефть',
      'Glass': 'Стекло',
      'Aggregate': 'Щебень',
      'Scrap timber': 'Вторичная древесина',
    'Fluid': 'Жидкость',
      'Charcoal': 'Древесный уголь',

      'Paper': 'Бумага',
      'Material': 'Материал',
      'Printed': 'Напечатано',
      'Acid': 'Кислота',
      'Gold': 'Золото',
      'Slag': 'Шлак',
      'Microschemes': 'Микросхемы',
      'Clean water': 'Чистая вода',
      'Polluted water': 'Грязная вода',
      'Oily water': 'Нефтяная вода',

      'Blade kit': 'Комплект лопастей',
      'Blade kits': 'Комплекты лопастей',
      'Glazing kit': 'Комплект остекления',
      'Glazing kits': 'Комплекты остекления',
      'Advanced cell': 'Расширенная ячейка',
      'Advanced cells': 'Расширенные ячейки',
      'Field tonic': 'Полевой тоник',

      'GATHERING': 'КОПИТ',
      'MACHINE SLOT': 'МЕСТО ПОД МАШИНУ',
      'GROVE SLOT': 'МЕСТО ПОД ПОСАДКУ',
      'PUMP SLOT': 'МЕСТО ПОД НАСОС',
      'DIGGER SLOT': 'МЕСТО ПОД РУДОКОП',
      'SKY FULL': 'НЕБО ЗАНЯТО',
      'Material': 'Материал',
      'Salvage': 'Вторсырьё',
      'Salvage A': 'Вторсырьё А',
      'Salvage B': 'Вторсырьё Б',
      'Output A': 'Выход А',
      'Output B': 'Выход Б',
      'Output C': 'Выход В', 'Output D': 'Выход Г', 'Output E': 'Выход Д',
      'Anything': 'Что угодно',
      'Money': 'Деньги',
      'Clean Index': 'Индекс Чистоты',
      'Diamonds': 'Алмазы',
      'Prism': 'Призма',
      'Set': 'Готово',
      'Till': 'Касса',

      'Cut': 'Выдано',
      'Unburned': 'Не сожжено',
      'Grown': 'Выращено',
      'BURN': 'СЖЕЧЬ',
      'PULL': 'ВЫЗВАТЬ',
      'COLLECT': 'СОБРАТЬ',
      'HIRE': 'НАНЯТЬ',
      'RUN': 'ПУСК',
      'START': 'СТАРТ',
      'LAUNCH': 'ЗАПУСК',

      'kg': 'кг', 'WF': 'РС', 'KW': 'кВт',
      'kg/h': 'кг/ч', 'WF/h': 'РС/ч', 'KW/h': 'кВт/ч',

      'CI/h': 'ИЧ/ч', '$/h': '$/ч',
    },

    res: {
      wf:        { name: 'Рабочая сила' },
      energy:    { name: 'Энергия' },
      trash:     { name: 'Мусор' },
      rtrash:    { name: 'Переработанный мусор' },
      light:     { name: 'Лёгкий мусор' },
      heavy:     { name: 'Тяжёлый мусор' },
      metal:     { name: 'Металл' },
      alu:       { name: 'Алюминий' },
      steel:     { name: 'Сталь' },
      lead:      { name: 'Свинец' },
      nukeWaste: { name: 'Ядерные отходы' },
      gear:      { name: 'Защитное снаряжение' },
      rod:       { name: 'Урановые стержни' },
      turbofuel: { name: 'Турботопливо' },
      pluto:     { name: 'Плутоний' },
      nfuel:     { name: 'Плутониевые таблетки' },
      hazard:    { name: 'Опасные отходы' },
      cell:      { name: 'Батареи' },
      plastic:   { name: 'Пластик' },
      organic:   { name: 'Органика' },
      fert:      { name: 'Удобрение' },
      oil:       { name: 'Нефть' },
      glass:     { name: 'Стекло' },
      aggregate: { name: 'Щебень' },
      wood:      { name: 'Вторичная древесина' },
      coal:      { name: 'Древесный уголь' },

      paper:     { name: 'Бумага' },
      dirtyWater:{ name: 'Грязная вода' },
      oilyWater: { name: 'Нефтяная вода' },
      water:     { name: 'Чистая вода' },

      blade:     { name: 'Комплект лопастей' },
      tonic:     { name: 'Полевой тоник' },
      glazing:   { name: 'Комплект остекления' },
      acid:      { name: 'Кислота' },
      gold:      { name: 'Золото' },
      slag:      { name: 'Шлак' },
      chip:      { name: 'Микросхемы' },
      advCell:   { name: 'Расширенная ячейка' },
      panel:     { name: 'Комплект панелей' },
    },

    resGen: {
      wf: 'рабочей силы', energy: 'энергии',
      nukeWaste: 'ядерных отходов', gear: 'снаряжения', rod: 'урановых стержней', turbofuel: 'турботоплива',
      pluto: 'плутония', nfuel: 'плутониевых таблеток',
      trash: 'мусора', rtrash: 'переработанного мусора',
      light: 'лёгкого мусора', heavy: 'тяжёлого мусора',
      metal: 'металла', alu: 'алюминия', steel: 'стали', lead: 'свинца',
      hazard: 'опасных отходов', cell: 'батарей',
      plastic: 'пластика', organic: 'органики',
      fert: 'удобрения', oil: 'нефти',
      glass: 'стекла', aggregate: 'щебня',
      wood: 'вторичной древесины', coal: 'древесного угля',
      dirtyWater: 'грязной воды',
      oilyWater: 'нефтяной воды',
      water: 'чистой воды',
      blade: 'комплекта лопастей', tonic: 'полевого тоника',
      glazing: 'комплекта остекления',
      acid: 'кислоты', gold: 'золота', slag: 'шлака', chip: 'микросхем', advCell: 'расширенных ячеек',
      panel: 'комплектов панелей',
    },

    cur: {
      ci:      { name: 'Индекс Чистоты', short: 'ИЧ', rate: 'ИЧ/ч' },
      money:   { name: 'Деньги',         short: '$',  rate: '$/ч'  },
      diamond: { name: 'Алмаз',          short: '◆',  rate: '◆/ч'  },
      prism:   { name: 'Призма',         short: '✦',  rate: '✦/ч'  },
    },

    cat: {
      workforce:   { name: 'Рабочие' },
      energy:      { name: 'Энергия' },
      trash:       { name: 'Мусор' },
      money:       { name: 'Деньги' },
      ci:          { name: 'Индекс Чистоты' },
      manufacture: { name: 'Производство' },
      fluids:      { name: 'Жидкости' },
      special:     { name: 'Особые' },
      trials:      { name: 'Испытания' },
    },

    loc: {
      home: { name: 'Пустоши',
              desc: 'Где всё началось. Две старые свалки, больше ничего — и небо, которое никогда не ' +
                    'меняется.' },
      greenhaven: { name: 'Гринхейвен',
              desc: 'Земля, которую стоит спасти. Две куда более крупные свалки и два ' +
                    'участка, где действительно можно что-то посадить.' },
      mirewater: { name: 'Мутноводье',
              desc: 'Куда всё это в итоге стекло. Две самые большие из оставшихся свалок, ' +
                    'роща вдвое больше гринхейвенской и два пруда с водой, в которой давно ' +
                    'никто не живёт.' },
      blackmere: { name: 'Черноозёрье',
              desc: 'Где развалились танкеры. Три свалки, две рощи и два пятна, лежащих на ' +
                    'воде, которая не двигалась годами.' },
      glowmoor: { name: 'Светотопь',
              desc: 'Бывший край реакторов. Четыре свалки, две рощи, пруд, разлив и две ' +
                    'площадки, где отходы ещё светятся.' },
    },

    node: {

      pracFeed: { name: 'Подача',
        desc: 'Запас, который не кончается. Смените его темп и посмотрите, ' +
              'что машина сделает с меньшим.'},
      pracPower: { name: 'Подача энергии',
        desc: 'Энергия из ничего, с любым темпом. Убавьте его и смотрите, что меняется.'},

      pracCrew: { name: 'Подача бригады',
        desc: 'Рабочая сила из ничего, с любым темпом.'},
      pracDrain: { name: 'Сток',
        desc: 'Всё, что сюда приходит, исчезает. Здесь ничего не накапливается.'},
      trashSite: { name: 'Свалка',
        desc: 'Держит двух Уборщиков и пустеет по мере разбора.'},
      oilSite: { name: 'Нефтяное пятно', doneName: 'Чистая лагуна',
        desc: 'Нефть, растёкшаяся тонким слоем по стоячей воде. Держит два Водяных насоса ' +
              'и оживает по мере того, как в него возвращают чистую воду. Руками здесь не справиться.'},
      waterSite: { name: 'Грязный пруд', doneName: 'Чистый пруд',
        desc: 'Стоячая вода. Держит два Водяных насоса и оживает по мере того, как в неё ' +
              'возвращают чистую воду. Руками здесь не справиться.'},
      waterPump: { name: 'Водяной насос',
        desc: 'Опускает трубу в стоячую воду и вытягивает её под давлением. По той же трубе ' +
              'чистая вода уходит обратно.'},
      treeSite: { name: 'Роща', doneName: 'Цветущая роща',
        desc: 'Помещаются два Лесовода, и она зеленеет по мере их работы. Здесь можно сажать и руками.'},
      strikeVault: { name: 'Грозовой накопитель',
        desc: 'Мачта и глубокий заземляющий стержень, а внизу батарея ячеек. ' +
              'Разряд уходит по стержню, и заряд принимают ячейки, а не земля.' },
      gemCollector: { name: 'Сборщик алмазов',
        desc: 'Шарнирная рука дотягивается до алмазов поблизости и складывает их в лоток.' },
      foreman: { name: 'Бригадир',
        desc: 'Бригадир работает как четыре Волонтёра. Каждое улучшение для них ' +
              'действует на Бригадира вчетверо.' },
      depot: { name: 'Склад-стеллаж',
        why: 'Завод, который то захлёбывается, то голодает, трудно развести проводами. ' +
             'Три полки, каждая из которых отдаёт свой материал с заданной вами ' +
             'скоростью, превращают рваную подачу в ровную.',
        desc: 'Три склада в одной раме. Каждая полка держит один материал и ' +
              'отдаёт его не быстрее, чем вы зададите.' },
      clearingHouse: { name: 'Расчётный двор',
        desc: 'Два провода идут на продажу, третий — на сжигание. У каждой стороны ' +
              'свой счёт, и одна бригада разбирает обе.' },
      pavingTrain: { name: 'Укладчик', doneName: 'Готовая дорога',
        desc: 'Разогревает щебень, обволакивает его маслом до сцепления и кладёт ' +
              'горячей полосой, которую тут же укатывают.',
        descMore: 'Каждый готовый участок уходит дальше в стороны: по нему приходит ' +
              'ещё одна бригада, а вдоль обочины тянутся столбы.' },
      player: { name: 'Волонтёр',
        desc: 'Пара рук, навсегда.',
        descMore: 'Подведите к нему Бродильный чан: каждый килограмм полевого тоника ' +
              'навсегда делает его быстрее.' },
      windTurbine: { name: 'Ветряк',
        desc: 'Ветер толкает лопасти, а вал за ними вращает генератор.',
        descMore: 'Подведите к нему Лопастный цех: каждый килограмм комплекта лопастей ' +
              'навсегда раскручивает его сильнее.' },
      solarPanel: { name: 'Солнечная панель',
        desc: 'Ячейки превращают дневной свет прямо в ток. После заката они не дают ничего.',
        descMore: 'Подведите к ней Стекольный цех: каждый килограмм комплекта остекления ' +
              'навсегда делает её мощнее.' },
      powerStorage: { name: 'Аккумулятор',
        desc: 'Батарея элементов. Принимает всё, что линия не успела израсходовать, и ' +
              'отдаёт позже.'},
      powerVault: { name: 'Энергохранилище',
        desc: 'Те же элементы в пять рядов и вдвое больше вводов.'},
      labourExchange: { name: 'Биржа труда',
        desc: 'Контора, которая нанимает целую бригаду разом, на оговорённый срок.'},
      cleaner: { name: 'Уборщик',
        desc: 'Руки, разбирающие свалку. Он должен стоять на ней.'},
      treePlanter: { name: 'Садовник',
        desc: 'Люди с лопатами сажают саженцы в расчищенную землю. Ставится на Рощу.'},

      meteorite: { name: 'Метеорит', rareName: 'Редкий метеорит',
        desc: 'Богатая металлом глыба, ещё тёплая после падения. На ней работает один ' +
              'рудокоп, а когда она опустеет, кратер затянется.' },
      wasteSite: { name: 'Ядерная свалка',
        desc: 'Вмещает три машины и пустеет, пока её копают.' },
      oreDigger: { name: 'Рудокоп',
        desc: 'Разбивает упавшую глыбу и вручную и машиной отбирает металл из щебня.' },
      meteorBeacon: { name: 'Метеоритный маяк',
        why: 'Метеорит падает, когда ему вздумается. С маяком момент выбираете вы, и ' +
             'металл из камня превращается в то, подо что можно строить завод.',
        desc: 'Тарелка, которая цепляется за падающую глыбу и сводит её раньше срока. ' +
              'Копит заряд, и каждый вызов тратит его часть.' },
      seedDrill: { name: 'Сеялка',
        desc: 'Режет борозду, кладёт в неё семена на одной глубине и закрывает землёй. ' +
              'Ставится на Рощу.'},
      hiringPost: { name: 'Пункт найма',
        desc: 'Доска у ворот, где подёнщики записываются на смену. Каждый следующий дороже ' +
              'предыдущего.'},
      stormTurbine: { name: 'Штормовой ветряк',
        desc: 'Низкая, тяжёлая, на растяжках: непогода её раскручивает, а не останавливает.',
        descMore: 'Подведите к нему Травильный цех: каждый килограмм расширенной ячейки ' +
              'навсегда раскручивает его сильнее.'},
      droneCleaner: { name: 'Дрон-уборщик',
        desc: 'Разбирает свалку на энергии, а не на людях.'},
      tradePost: { name: 'Торговый пост',
        desc: 'Рынок, который освобождает себя сам, если подвести к нему бригаду.'},
      incinerator: { name: 'Мусоросжигатель',
        desc: 'Полигон, который освобождает себя сам, если подвести к нему бригаду.'},
      recycler: { name: 'Переработчик',
        desc: 'Дробит и промывает сырой мусор до сырья, с которым уже можно работать. То, ' +
              'на что не хватило энергии, проходит насквозь.'},
      weightSorter: { name: 'Весовой сортировщик',
        desc: 'Поток воздуха поднимает лёгкое с ленты, тяжёлое остаётся на ней. Недодайте ' +
              'энергии, и разделение уходит в тяжёлый мусор.',
        spec: 'При нехватке энергии он делает тяжёлый мусор, а не ничего. Половина энергии ' +
              'означает не половину выхода, а худшее разделение.' },

      fluidSplitter: { name: 'Делитель жидкостей',
        desc: 'Один провод жидкости на два. Несёт по одной за раз.'},
      fluidTank: { name: 'Цистерна',
        why: 'Запасите нефть в бочке, пока с сетью всё в порядке и она не нужна. Когда ' +
             'позже энергии станет не хватать, откройте кран, и у Нефтяного генератора ' +
             'топливо уже будет ждать.',
        desc: 'Запаянная бочка на поддоне. Какая жидкость дойдёт до неё первой, ту она и ' +
              'держит, и другую не примет, пока её не осушат.'},
      trashJunction: { name: 'Склад материалов',
        desc: 'Несколько линий сваливают в один штабель, и то, что не увезли, ' +
        'лежит там дальше. Отдаёт не быстрее, чем вы задали.'},
      crewJunction: { name: 'Узел бригад',
        desc: 'Сводит рабочую силу: пять проводов в один.'},
      powerSplitter: { name: 'Делитель энергии',
        why: 'Аккумулятор с несколькими проводами делит энергию поровну, и ' +
             'простаивающая машина забирает столько же, сколько работающая. Это первый ' +
             'инструмент, которым можно направить энергию туда, где она нужна.',
        desc: 'Один провод энергии на две машины, и не поровну.'},
      crewSplitter: { name: 'Делитель бригад',
        desc: 'Один провод рабочей силы на две машины, и не поровну.'},
      prioPowerSplitter: { name: 'Приоритетный делитель энергии',
        why: 'Машине, работающей партиями, энергия нужна не всё время. Поставьте её на ' +
             'приоритетную сторону: она питается первой, а как только останавливается, ' +
             'поток уходит на другой провод. Алмазный пресс там работает сам.',
        desc: 'Отдаёт всю энергию приоритетной стороне, пока ей есть куда её деть. Когда ' +
              'нет, всё уходит на другую сторону.'},
      prioCrewSplitter: { name: 'Приоритетный делитель бригад',
        desc: 'Отдаёт всю рабочую силу приоритетной стороне, пока ей есть куда её деть. ' +
              'Когда нет, всё уходит на другую сторону.'},
      outreachHub: { name: 'Центр агитации',
        why: 'Любая другая бригада стоит денег или расходится в конце смены. Центр ' +
             'покупает людей один раз и навсегда, за энергию и труд, которые у вас и ' +
             'так есть. Он медленный, так что стройте его рано и запаситесь терпением.',
        desc: 'Обходит дома и стоит с лотками, пока люди не запишутся. Найденные остаются ' +
              'насовсем.'},
      magnetSeparator: { name: 'Магнитный разделитель',
        desc: 'Магнитный барабан проходит над тяжёлым мусором и вытягивает из него металл.'},
      eddySeparator: { name: 'Вихревой разделитель',
        desc: 'Вращающееся поле отбрасывает алюминий в сторону, а сталь падает вниз.'},
      hazardPlant: { name: 'Цех опасных отходов',
        desc: 'Руками выбирают ядовитую часть лёгкого мусора и запечатывают её в бочки. То, ' +
              'на что не хватило рук, проходит насквозь.'},
      fineSorter: { name: 'Тонкий сортировщик',
        desc: 'Руками перебирают лёгкий мусор кусок за куском: пластик в один бак, всё, что ' +
              'когда-то росло, в другой.'},
      fertilizerPlant: { name: 'Завод удобрений',
        desc: 'Греет органику вместе с опасным шламом, пока то, что остаётся, не станет ' +
              'пригодным для почвы.'},
      cellAssembler: { name: 'Сборщик батарей',
        desc: 'Катает из алюминия корпуса и заполняет их той опасной химией, без которой ' +
              'элемент не держит заряд.'},
      gridFoundry: { name: 'Энерголитейная',
        why: 'У генератора есть предел постройки, и алмазы поднимают его лишь до ' +
             'определённой точки. У массивов, которые она возводит, предела нет вовсе, ' +
             'поэтому дальше сеть растёт только за их счёт.',
        desc: 'Отливает из собранной стали раму и набивает её элементами, по целому массиву ' +
              'за раз.'},
      market: { name: 'Рынок',
        desc: 'Продаёт что угодно. Нажимайте СОБРАТЬ, пока касса не полна, иначе вся линия встанет.'},
      landfill: { name: 'Полигон',
        desc: 'Нажимайте СЖЕЧЬ, пока куча не полна, иначе вся линия встанет.'},
      salvageSplitter: { name: 'Делитель материалов',
        desc: 'Один провод материала на два. Несёт по одному виду за раз.'},
      tradingFloor: { name: 'Торговый зал',
        desc: 'Торговый пост со вторым входом и вдвое большей кассой.'},
      burnYard: { name: 'Сжигательный двор',
        desc: 'Мусоросжигатель со вторым входом и вдвое большей кучей.'},
      pyrolysisPlant: { name: 'Пиролизный завод',
        desc: 'Греет пластик без доступа кислорода, пока тот не разложится и не стечёт ' +
              'маслом.'},
      timberReclaimer: { name: 'Лесовосстановитель',
        desc: 'Древесина из щебня.'},
      fibrePress: { name: 'Волоконный пресс',
        desc: 'Прессует растительное волокно в плиту под нагревом, пока она не станет как ' +
              'пилёная доска.'},
      charKiln: { name: 'Углевыжигательная печь',
        desc: 'Пережигает вторичную древесину почти без доступа воздуха. Вода и газы '
            + 'уходят, оставляя почти чистый углерод.'},

      bladeWorks: { name: 'Лопастный цех',
        desc: 'Выклеивает оболочку лопасти из пластика, вклеивает вдоль неё алюминиевый ' +
              'лонжерон и балансирует готовый набор вручную.'},
      glazingWorks: { name: 'Стекольный цех',
        why: 'Солнечных панелей можно поставить всего несколько, зато те, что уже ' +
             'стоят, можно навсегда сделать лучше. Комплект — это улучшение, которое ' +
             'ограниченный генератор всё ещё может принять.',
        desc: 'Вытягивает стекло в тонкий ровный лист и прокладывает по швам свинцовую ' +
              'ленту. Жар спекает их в одну пластину.'},

      etchingWorks: { name: 'Травильный цех',
        desc: 'Травит алюминиевую фольгу кислотой, пока её поверхность не станет лесом ' +
              'каналов, а потом сматывает фольгу влажной в ячейку.'},
      panelWorks: { name: 'Панельный цех',
        desc: 'Раскладывает микросхемы сеткой и запаивает под стеклом. Падающий свет ' +
              'поднимает в них ток.' },
      leachingPlant: { name: 'Цех выщелачивания',
        desc: 'Растворяет металлолом в горячей кислоте. Золото уходит в раствор и '  +
              'выпадает чистым, а всё остальное оседает шлаком.' },
      circuitWorks: { name: 'Цех микросхем',
        desc: 'Перемалывает стекло в пластины, вытравливает на них рисунок кислотой ' +
              'и укладывает по нему золотые дорожки.' },
      acidWorks: { name: 'Кислотный завод',
        desc: 'Прокаливает кислотный шлам с древесным углём, пока тот не распадётся на ' +
              'горячий газ. Промывка этого газа водой снова даёт кислоту.'},
      brewVat: { name: 'Бродильный чан',
        desc: 'Сбраживает органические отходы в подогреваемом стеклянном сосуде, пока ' +
              'они не уварятся в густой горький тоник.'},
      waterCleaner: { name: 'Очиститель воды',
        desc: 'Прогоняет грязную воду через слой древесного угля. Углерод удерживает то, что ' +
              'было в воде, и выходит вместе с этим.'},
      oilSeparator: { name: 'Нефтеотделитель',
        desc: 'Нефть и вода расходятся сами, если их достаточно замедлить. Замедляют ' +
              'пластинчатые пакеты, а оставшуюся плёнку снимает полипропиленовый сорбент.'},
      diamondPress: { name: 'Алмазный пресс',
        desc: 'Сжимает древесный уголь под таким давлением и жаром, что углероду остаётся ' +
              'только выкристаллизоваться.' },
      prismPress: { name: 'Пресс призм',
        desc: 'Растворяет золото в кислоте вокруг алмазов, затем пропускает через раствор ток, ' +
              'пока он не застынет в один кристалл.' },

      paperMill: { name: 'Бумажная фабрика',
        desc: 'Измельчает древесный лом, вываривает его до массы и прессует влажные ' +
              'листы, чтобы те высохли.' },
      printWorks: { name: 'Печатный цех',
        desc: 'Перемалывает всё, что в него загрузили, в пигмент и печатает им под ' +
              'нагревом и давлением.',
        why: 'Шесть материалов печатают каждый своё усиление, так что решает то, чего у ' +
             'вас больше всего.' },
      oilGenerator: { name: 'Нефтяной генератор',
        why: 'К тому моменту, когда его можно построить, завод упирается в энергию, а ' +
             'Индекс Чистоты приходит быстрее, чем его есть на что тратить. Это обмен ' +
             'одного на другое.',
        desc: 'Жертвует Индексом Чистоты ради большой мощности и платит за каждый час ' +
              'работы.'},
      rubbleSorter: { name: 'Сортировщик обломков',
        desc: 'Обломки идут под дробилку и через сита. Руки тянут разделение к стеклу, ' +
              'энергия — к щебню.'},
      forecastMast: { name: 'Метеомачта',
        why: 'Она ничего не производит, поэтому весь смысл в этих тридцати секундах. ' +
             'Их хватит, чтобы придержать аккумулятор до того, как Молния заморозит ' +
             'сеть, или чтобы Форсаж уже работал, когда Шторм накроет ваши ветряки.',
        desc: 'Ничего не производит. Он покупает предупреждение — до того, как переменится небо.'},
      airCleaner: { name: 'Воздухоочиститель',
        why: 'Это первый способ получать Индекс Чистоты из одной лишь энергии. Внутрь ' +
             'не идёт ничего, кроме электричества, и под ним нет участка земли, ' +
             'который может закончиться.',
        desc: 'Прогоняет воздух через мокрые фильтры и вымывает из него сажу.' },
      wasteCleaner: { name: 'Очиститель отходов',
        desc: 'Выкапывает радиоактивные отходы из земли. Стоит только на ядерной свалке.' },
      gearWorks: { name: 'Мастерская снаряжения',
        desc: 'Прокладывает костюмы листовым свинцом и шьёт их из обработанного волокна.' },
      turbofuelRefinery: { name: 'Завод турботоплива',
        desc: 'Расщепляет нефть на раскалённом угле в лёгкое быстрое топливо.' },
      groundLifter: { name: 'Подъёмник участков',
        desc: 'Площадка для тяжёлого дрона. Дрон цепляет участок земли на четыре троса, поднимает его вместе со всем, что на нём стоит, и опускает в другом месте.' },
      uniSplitter: { name: 'Большой делитель',
        desc: 'Один провод на пять. Первый провод решает, что он несёт: энергию, бригаду, материал или жидкость.' },
      uniSplitPower: { name: 'Большой делитель',
        desc: 'Один провод на пять. Первый провод решает, что он несёт: энергию, бригаду, материал или жидкость.' },
      uniSplitCrew: { name: 'Большой делитель',
        desc: 'Один провод на пять. Первый провод решает, что он несёт: энергию, бригаду, материал или жидкость.' },
      uniSplitMat: { name: 'Большой делитель',
        desc: 'Один провод на пять. Первый провод решает, что он несёт: энергию, бригаду, материал или жидкость.' },
      uniSplitFluid: { name: 'Большой делитель',
        desc: 'Один провод на пять. Первый провод решает, что он несёт: энергию, бригаду, материал или жидкость.' },
      fuelPlant: { name: 'Плутониевый завод',
        desc: 'Прессует плутоний в мелкие таблетки и запаивает их в алюминиевую оболочку.' },
      puDigger: { name: 'Плутониевый копатель',
        desc: 'Разбивает светящуюся глыбу за защитным экраном и выбирает из неё плутоний.' },
      rocket: { name: 'Космотрал',
        desc: 'Поднимается на орбиту, собирает сетью летающий мусор и привозит пойманные в нём алмазы.' },
      rodWorks: { name: 'Цех урановых стержней',
        desc: 'Растворяет ядерные отходы в кислоте, а остаток запаковывает в алюминиевые трубки.' },
      reactor: { name: 'Ядерный реактор',
        desc: 'Стержни стоят в воде, пока делятся их атомы. Тепло кипятит воду и крутит турбину.' },
      repository: { name: 'Глубинное хранилище',
        desc: 'Сплавляет радиоактивные отходы со стеклом, запаивает в сталь и хоронит ' +
              'глубоко в скале.' },
      robot: { name: 'Робот', sunName: 'Солнечный робот',
        desc: 'Набирает заряд от сети, потом тратит его на работу.' },
      hiringAgency: { name: 'Кадровое агентство',
        desc: 'Следит, чтобы в конторах найма рядом были работники, и нанимает, как только есть место.' },
      bank: { name: 'Банк',
        why: 'Первый в игре доход деньгами, за которым не стоит никакого завода.',
        desc: 'Хранит золото в сейфе и каждую минуту получает на него проценты.' },
      biodome: { name: 'Биокупол',
        why: 'За всем остальным, что приносит Индекс Чистоты, стоит линия снабжения. ' +
             'За готовым куполом не стоит ничего, поэтому его доход идёт, даже когда ' +
             'вы разбираете остальной завод.',
        desc: 'Стекло, наглухо укрытое над очищенной землёй. Внутри работает бригада, ' +
              'а купол держит свой воздух и свою погоду.' },
    },

    wx: {
      rain: { name: 'Дождь',
        noteUp: 'Деревья x2', noteDown: 'Копание x0,5\nУборка руками x0,5',
        desc: 'Всё мокрое и тяжёлое. Уборщики, Дроны и голые руки приносят вдвое ' +
              'меньше — но деревья ещё никогда не были так счастливы.' },
      storm: { name: 'Шторм',
        noteUp: 'Турбины x2,5', noteDown: 'Свалки и Мусоросжигатели не жгут',
        noteUpPaid: 'Турбины x2,5\nРоботам всё равно', noteDownPaid: 'Волонтёры, Бригадир, наёмные x0,5',
        desc: 'Ничто не желает гореть. Полигоны и Мусоросжигатели прекращают горение ' +
              'полностью, с бригадой или без, — зато все ветряки переживают лучший день ' +
              'в своей жизни.',
        descPaid: 'Ветер слишком сильный для работы. Волонтёры, Бригадир и наёмные рабочие ' +
                  'прячутся и работают вполсилы, а роботам всё равно. Все ветряки ' +
                  'переживают лучший день в своей жизни.' },
      lightning: { name: 'Молния',
        noteUp: 'Сжигание x5\nУборка руками x5', noteDown: 'Генераторы не дают энергии\nБатареи замирают',
        noteMore: 'Сеть поднимается сама. ЗАПУСТИТЬ на плашке возвращает всё разом.',
        desc: 'Сеть легла — полностью. Ни один генератор не даёт ни ватта, и каждая ' +
              'батарея держит заряд, не отдавая ни капли. Зато горит всё, и всё, что вы ' +
              'подбираете руками, стоит впятеро дороже.' },
      heat: { name: 'Жара',
        noteUp: 'Солнечные x2,5', noteDown: 'Посадки x1/3',
        desc: 'Солнце стоит прямо над головой и не собирается двигаться. Солнечные ' +
              'панели работают в два с половиной раза сильнее — а всё зелёное, ' +
              'посаженное руками или машиной, на такое не подписывалось.',
        descDay: 'Солнце стоит прямо над головой. Солнечные панели работают в два с ' +
                 'половиной раза сильнее — а всё зелёное, посаженное руками или машиной, ' +
                 'на такое не подписывалось.' },
    },

    boost: {
      overdrive: { name: 'Форсаж',
        desc: 'Каждый генератор энергии работает в два с половиной раза сильнее.' },
      scrapSurge: { name: 'Всплеск цен',
        desc: 'Любой сорт мусора стоит вдвое дороже на Рынке, Полигоне и в их версиях с персоналом.' },
      goldenTouch: { name: 'Золотые руки',
        desc: 'Уборка Свалки вручную приносит вчетверо больше Индекса Чистоты.' },
      rally: { name: 'Митинг',
        desc: 'Каждый Волонтёр и каждый наёмный работник даёт в 2,5 раза больше рабочей силы.' },
      grove: { name: 'Бурный рост',
        desc: 'На Роще всё растёт вдвое быстрее, и у машин, и при посадке вручную.' },
      sunrise: { name: 'Рассвет',
        desc: 'Затаскивает солнце обратно за горизонт. Каждая Солнечная панель ' +
              'начинает работать сию секунду. Доступно только ночью.' },
    },

    skill: {
      player: { name: 'Волонтёры',
        desc: 'Волонтёр даёт 1 рабочую силу в час (1 РС/ч), бесплатно и навсегда. Подключите его к Уборщику, и тот начнёт копать.' },
      market: { name: 'Рынок',
        desc: 'Продаёт выкопанное: 1 кг/ч обычного мусора за $1/ч, и дороже за всё, чего ' +
              'коснулась машина.' },
      recycling: { name: 'Переработка',
        desc: 'Ветряк даёт энергию. Подключите его и мусор к Переработчику, и тот превратит мусор в переработанный: на Рынке он продаётся дороже, а на Полигоне сгорает в больше Индекса чистоты. Цены на все материалы есть в карточке Рынка или Полигона.' },
      weightSorting: { name: 'Весовая сортировка',
        desc: 'Энергией делит переработанный мусор на лёгкий и тяжёлый. Лёгкий продаётся дороже. Если энергии мало, почти всё выходит тяжёлым.' },
      solar: { name: 'Солнечная энергия',
        desc: 'Солнечная панель даёт вчетверо больше энергии, чем Ветряк, но только днём. Ночью она не даёт ничего, так что энергию надо брать откуда-то ещё.' },
      powerStore: { name: 'Аккумулятор',
        desc: 'Аккумулятор. Генераторы подключаются на вход, машины на выход. Задайте на его карточке предел отдачи, и всё, что сверх предела, сохранится на потом.' },
      stormPower: { name: 'Штормовая энергия',
        desc: 'Штормовой ветряк даёт втрое больше энергии, чем Ветряк, но стоит гораздо дороже.' },
      automation: { name: 'Автоматизация',
        desc: 'Уборщик на энергии: 1 кВт/ч на каждый кг/ч, который он выкапывает.' },
      staffing: { name: 'Персонал',
        desc: 'Рынок и Полигон, которые собирают сами, так что жать СОБРАТЬ больше не нужно. Им нужна рабочая сила: каждый 1 РС/ч собирает $1,5 в час на Рынке или 1,5 ИЧ на Полигоне.' },
      hiring: { name: 'Подённый найм',
        desc: 'Нанимайте за деньги до 3 рабочих разом. Каждый работает как Волонтёр 10 минут, потом уходит.' },
      crewRouting: { name: 'Маршрутизация бригад',
        desc: 'Сводит до пяти проводов рабочей силы в один, чтобы одна машина получила рабочую силу нескольких.' },
      trashRouting: { name: 'Хранение материалов',
        desc: 'Сводит до пяти проводов одного материала в один и хранит то, что ещё не ушло.' },
      crewDispatch: { name: 'Распределение бригад',
        desc: 'Делит один провод рабочей силы надвое в той пропорции, которую вы наберёте.' },
      materialRouting: { name: 'Маршрутизация вторсырья',
        desc: 'Делит один поток материала надвое в той пропорции, которую вы наберёте. По ' +
              'одному сорту за раз.' },
      outreach: { name: 'Агитация',
        desc: 'Дайте ему рабочую силу и энергию, и он найдёт новых людей, которые останутся постоянными рабочими. Каждый следующий рабочий из одного центра стоит дороже прежнего, поэтому второй центр снова начинает с дешёвых.' },
      greenhaven: { name: 'Гринхейвен',
        desc: 'Открывает новое место, Гринхейвен: ещё две свалки и две Рощи, где Садовник растит деревья за Индекс чистоты. Если сначала вычистить Пустоши дочиста, оно откроется бесплатно.' },
      magnetics: { name: 'Магнетизм',
        desc: '3 кВт/ч превращают 1 кг/ч тяжёлого мусора в металл по 15,50 за кг.' },
      powerRouting: { name: 'Маршрутизация энергии',
        desc: 'Делит один провод энергии на два. Наберите доли на его карточке: 1 и 1 дают каждому половину, 3 и 1 дают первому три четверти.' },
      eddyCurrents: { name: 'Вихревые токи',
        desc: 'Энергией делит металл на алюминий и сталь: 4 кВт на каждый кг. Алюминий продаётся дороже. Если энергии мало, выходит в основном сталь.' },
      hazardHandling: { name: 'Обращение с опасными отходами',
        desc: 'Рабочая сила извлекает опасные отходы из лёгкого мусора: 2 РС/ч превращают 3 кг/ч лёгкого мусора в 1 кг/ч. Опасные отходы хорошо продаются, но сжечь их нельзя.' },
      cellAssembly: { name: 'Сборка батарей',
        desc: 'Рабочая сила собирает батареи из алюминия и опасных отходов: 3 кг алюминия, 1 кг опасных отходов и 5 РС дают 1 кг батарей.' },
      bigStorage: { name: 'Глубокое хранение',
        desc: 'Аккумулятор побольше: держит 50 кВт вместо 10 и принимает десять проводов энергии вместо пяти.' },
      labourHire: { name: 'Биржа труда',
        desc: 'Нанимайте целую бригаду разом: до 10 рабочих на срок до часа. Размер бригады и длину смены задайте на её карточке. Каждый рабочий дороже, чем в Пункте найма, но за большие и долгие наймы даётся скидка.' },
      fineSorting: { name: 'Тонкая сортировка',
        desc: 'Рабочая сила разбирает лёгкий мусор на пластик и органику: 3 РС на каждый кг. Пластик продаётся дороже. Если рабочей силы мало, выходит в основном органика.' },
      fertilising: { name: 'Удобрения',
        desc: 'Опасные отходы и органика с 5 кВт дают удобрение. Порция, скормленная ' +
              'Садовнику, даёт +10% и к тому, что он растит, и к объёму корзины, ' +
              'вплоть до двойного.' },
      gridForging: { name: 'Ковка сети',
        desc: 'Строит вечные энергомассивы из батарей и стали. Каждый массив даёт столько же энергии, сколько Ветряк. Каждый новый требует больше прежнего.' },
      cleanAir: { name: 'Чистый воздух',
        desc: 'Небо тоже можно чистить, медленно, пока есть энергия.' },
      robotics: { name: 'Робототехника',
        desc: 'Руки, работающие от энергии, а не за плату.' },
      rubbleSorting: { name: 'Сортировка обломков',
        desc: 'Дробит тяжёлый мусор на стекло и щебень, они стоят одинаково. На каждый кг нужно 2 РС и 2 кВт. Больше рабочей силы даёт больше стекла, больше энергии даёт больше щебня.' },
      bulkTrade: { name: 'Оптовая торговля',
        desc: 'Рынок и Полигон с двумя входами каждый. Каждый РС/ч приносит 2 $/ч у одного и ' +
              '2 ИЧ/ч у другого.' },
      refining: { name: 'Нефтепереработка',
        desc: '4 кВт/ч перерабатывают 1 кг/ч пластика в 0,5 кг/ч нефти по $54 за ' +
              'килограмм.' },
      forecasting: { name: 'Прогноз погоды',
        desc: 'Тридцать секунд предупреждения перед каждым катаклизмом, и каждое стоит 10 кВт.' },
      timberReclaiming: { name: 'Восстановление древесины',
        desc: '3 кг/ч щебня и 3 РС/ч дают 1 кг/ч вторичной древесины по 64 за кг.' },
      charring: { name: 'Углежжение',
        desc: '5 кВт/ч пережигают 1 кг/ч вторичной древесины в 0,5 кг/ч древесного ' +
              'угля. Половина веса уходит, а остаток стоит куда дороже за килограмм.' },
      fibrePressing: { name: 'Прессование волокна',
        desc: 'Второй путь к древесине: 4 кг/ч органики и 3 РС/ч, из той половины, ' +
              'которую вы выбрасывали.' },
      mirewater: { name: 'Мутноводье',
        desc: 'Открывает Мутноводье: две большие свалки, двойная роща и два Грязных пруда. ' +
              'Насос вытягивает грязную воду, Очиститель прогоняет её через уголь, а Индекс чистоты ' +
              'начисляется, когда она возвращается.' },
      blackmere: { name: 'Черноозёрье',
        desc: 'Три свалки, две рощи, два Нефтяных пятна. Снимите нефть, верните воду — начислится ' +
              'Индекс чистоты.' },
      fluidStorage: { name: 'Хранение жидкостей',
        desc: 'Бочка, которая держит одну жидкость и не теряет её при переносе. Больше ничто не ' +
              'возит жидкость между местами.' },
      diamondPressing: { name: 'Прессование алмазов',
        desc: 'Пресс, который выжимает из угля алмазы, партиями. Каждая партия больше ' +
              'предыдущей, а каждая пятая даёт на камень больше. Алмаз в итоге ' +
              'стоит столько же, сколько первый.' },

      brewing: { name: 'Полевое пивоварение',
        desc: 'Бродильный чан: сбраживает органику в подогреваемом стеклянном сосуде в ' +
              'полевой тоник. Каждый выпитый Волонтёром килограмм навсегда делает его быстрее, ' +
              'а следующий стоит немного дороже.' },
      bladeFitting: { name: 'Оснастка лопастей',
        desc: 'Лопастный цех: выклеивает наборы лопастей из пластика и алюминия. Каждый принятый ' +
              'Ветряком килограмм навсегда делает его мощнее, следующий стоит чуть дороже.' },
      glazing: { name: 'Остекление',
        desc: 'Комплекты из свинца и стекла. Каждый навсегда делает Солнечную панель мощнее.' },
      goldRecovery: { name: 'Извлечение золота',
        desc: 'Металлолом растворяют в кислоте, пока не выпадет золото.' },
      acidRecovery: { name: 'Регенерация кислоты',
        desc: 'Опасные отходы и уголь — обратно в кислоту. Она текучая, нужна Цистерна.' },
      panelFitting: { name: 'Оснастка панелей',
        desc: 'Комплекты из стекла и микросхем. Каждый принятый Роботом покрывает ' +
              'часть его питания, пока светит солнце.' },
      biodomes: { name: 'Биокупола',
        desc: 'Купола строятся один раз. Они работают и тогда, когда земля уже пуста.' },
      glowmoor: { name: 'Светотопь',
        desc: 'Четыре свалки, две рощи, пруд, разлив и две ядерные свалки.' },
      rocketry: { name: 'Уборка орбиты',
        desc: 'Турботопливо и ракета, которая поднимается на орбиту за космическим мусором ' +
              'и привозит домой алмазы.' },
      printing: { name: 'Печать',
        desc: 'Древесина в бумагу и пресс, который превращает материалы в усиления и алмазы.' },
      prismatics: { name: 'Призматика',
        desc: 'Радужный кристалл из золота, кислоты и алмазов. В машине он даёт больше из ' +
              'того же сырья, но ей нужно больше энергии или рабочих.' },
      nuclearPower: { name: 'Ядерная энергетика',
        desc: 'Урановые стержни из ядерных отходов и реактор, который их сжигает.' },
      hotCore: { name: 'Горячее ядро',
        desc: 'Стержни стоят теснее, и за раз делится больше атомов.' },
      banking: { name: 'Банковское дело',
        desc: 'Золото в сейфе приносит деньги, пока лежит там.' },
      deeperVaults: { name: 'Глубже в скалу',
        desc: 'Шахты уходят глубже, в древнюю сухую скалу.' },
      betterRates: { name: 'Выгодный процент',
        desc: 'Золото в сейфе приносит больший процент.' },
      biggerVaults: { name: 'Просторный сейф',
        desc: 'В сейфе больше места на полках.' },
      advCells: { name: 'Расширенные ячейки',
        desc: 'Ячейки из кислоты и алюминия. Каждая навсегда делает Штормовой ветряк мощнее. ' +
              'У жидкостей появляется свой делитель.' },
      oilPower: { name: 'Нефтяная энергия',
        desc: '1 кг/ч масла даёт 30 кВт/ч, и каждый кВт-час отдаёт 0,4 Индекса Чистоты.' },

      extraHands: { name: 'Лишние руки',
        desc: 'Каждый Волонтёр работает чуть усерднее.' },
      keenEye: { name: 'Острый глаз',
        desc: 'Вы быстрее замечаете стоящее.' },
      strongBacks: { name: 'Крепкие спины',
        desc: 'У бригады открывается второе дыхание.' },
      haggling: { name: 'Торг',
        desc: 'Набиваете цену на самое обычное.' },
      greenPremium: { name: 'Зелёная надбавка',
        desc: 'За переработанное покупатели платят охотнее.' },
      fairTrade: { name: 'Честная торговля',
        desc: 'Доброе имя на рынке поднимает сразу все цены.' },
      wideStalls: { name: 'Широкие прилавки',
        desc: 'Касса побольше: Рынок дольше работает без вас.' },
      densePacking: { name: 'Плотная укладка',
        desc: 'Выжимаете больше из обычного мусора.' },
      purityBonus: { name: 'Бонус за чистоту',
        desc: 'Чем чище сырьё, тем лучше оно горит.' },
      richSoil: { name: 'Плодородная почва',
        desc: 'Химия почвы получше — и в дело идут сразу все сорта.' },
      secondWind: { name: 'Второе дыхание',
        desc: 'Когда у нанятого работника кончается смена, есть небольшой шанс, что он останется ещё на одну бесплатно.' },
      deepFill: { name: 'Глубокая засыпка',
        desc: 'Место под костёр побольше, и куча не встаёт так быстро.' },
      tallerMasts: { name: 'Высокие мачты',
        desc: 'Мачты выше — ветер ровнее.' },
      brightPanels: { name: 'Чистые панели',
        desc: 'Чистое стекло и точнее поворот за солнцем.' },
      longerBlades: { name: 'Длинные лопасти',
        desc: 'Длинные лопасти захватывают круг пошире.' },

      balancedBlades: { name: 'Балансировка лопастей',
        desc: 'Каждую лопасть взвешивают перед подъёмом, и набора лопастей хватает надольше.' },
      strongBrew: { name: 'Крепкий тоник',
        desc: 'Завариваете крепче, и полевой тоник действует сильнее.' },
      mirrorBanks: { name: 'Зеркальные отражатели',
        desc: 'Зеркала по бокам возвращают свет на элементы.' },
      lowIron: { name: 'Осветлённое стекло',
        desc: 'Меньше железа в расплаве. Стекло пропускает больше света.' },
      galeRigging: { name: 'Штормовая оснастка',
        desc: 'Такелаж держит в полный шторм, и большие мачты не приходится убирать.' },
      fineEtch: { name: 'Тонкое травление',
        desc: 'Каналы тоньше — в фольге умещается больше поверхности.' },
      denseCells: { name: 'Плотные ячейки',
        desc: 'Элементы плотнее — ночь тянется легче.' },
      bigCells: { name: 'Большие ячейки',
        desc: 'Второй блок элементов.' },
      fastReset: { name: 'Быстрый перезапуск',
        desc: 'После удара молнии сеть сама восстанавливается немного быстрее.' },
      lightFreight: { name: 'Лёгкий фрахт',
        desc: 'Лёгкий мусор дёшево везти и дорого продать.' },
      scrapBroker: { name: 'Скупщик лома',
        desc: 'Даже тяжёлый отсев Весового сортировщика можно продать.' },
      cleanAsh: { name: 'Чистая зола',
        desc: 'Лёгкий мусор горит чисто.' },
      deepCompaction: { name: 'Глубокая утрамбовка',
        desc: 'Тяжёлое дробят, прежде чем отправить в огонь.' },
      stormChasers: { name: 'Охотники за штормом',
        desc: 'Большие мачты разворачивают навстречу непогоде.' },
      practisedHands: { name: 'Намётанные руки',
        desc: 'Теперь вы точно знаете, куда смотреть.' },
      luckySweep: { name: 'Удачная уборка',
        desc: 'Иногда при уборке вручную находится монета.' },
      greenThumb: { name: 'Лёгкая рука',
        desc: 'Саженцы получше и почва получше.' },
      scrapTrade: { name: 'Торговля ломом',
        desc: 'Металл живёт вне мусорной торговли, и это ваш вход туда.' },
      extraShift: { name: 'Лишняя смена',
        desc: 'Ещё одна пара рук у ворот: один пункт тянет целую бригаду.' },
      persuasiveOutreach: { name: 'Убедительная агитация',
        desc: 'Убедительнее говорите — и люди приходят дешевле.' },
      efficientOutreach: { name: 'Экономная агитация',
        desc: 'Меньше техники под током — и новичок обходится дешевле по энергии.' },
      goldenHour: { name: 'Золотой час',
        desc: 'Недолго после рассвета солнечные панели дают больше энергии.' },
      gusts: { name: 'Порывы',
        desc: 'Время от времени сильный порыв подхватывает один Штормовой ветряк, и пока он дует, тот даёт больше энергии.' },
      supplyBalloon: { name: 'Шар с припасами',
        desc: 'Каждые несколько минут по небу поднимается шар с припасами. Нажмите на него, чтобы отправить ящик волонтёру для временного ускорения.' },
      bulkHaulage: { name: 'Оптовые перевозки',
        desc: 'Лёгкое возите паллетами.' },
      fineAsh: { name: 'Мелкая зола',
        desc: 'Мельче размалываете перед тем, как отправить в огонь.' },
      marketStanding: { name: 'Репутация на рынке',
        desc: 'Имя, которое знают, и всё, что вы продаёте, стоит дороже.' },
      shootingStar: { name: 'Падающая звезда',
        desc: 'Иногда ночью по небу пролетает падающая звезда. Поймайте её, и на короткое время включится случайное ускорение.' },
      alloyBroker: { name: 'Скупщик сплавов',
        desc: 'Тот, кто отличает алюминий от стали и платит за оба.' },
      refinedFreight: { name: 'Тонкий фрахт',
        desc: 'Специалисты платят как следует за то, что выходит из лёгкого мусора.' },
      sealedFreight: { name: 'Герметичный фрахт',
        desc: 'Запечатанные бочки идут выше сортом.' },
      petrichor: { name: 'Петрикор',
        desc: 'Пока идёт дождь, каждый восстановленный участок здесь даёт Индекс чистоты.' },
      constellation: { name: 'Созвездие',
        desc: 'В некоторые ночи загорается созвездие. Нажмите на его звёзды по порядку и получите ускорение про запас.' },
      tighterCells: { name: 'Плотные сборки',
        desc: 'Меньше портите на каждой батарее.' },
      leanFrames: { name: 'Лёгкие каркасы',
        desc: 'Мачта легче, а держит не хуже.' },
      tunedPress: { name: 'Отлаженный пресс',
        desc: 'Ровнее плиты — меньше усилия уходит впустую.' },
      cleanTraces: { name: 'Чистые дорожки',
        desc: 'Меньше брака в дорожках, и за каждую микросхему платят больше.' },
      prismCore: { name: 'Призменное ядро',
        desc: 'Призма в ядерном реакторе удваивает его мощность, но ядро нагревается. Выньте призму вовремя, иначе ядро расплавится и призма пропадёт.' },
      lightCut: { name: 'Лёгкая фракция',
        desc: 'Более чистая фракция турботоплива, и за неё платят больше.' },
      domeGardens: { name: 'Сады под куполом',
        desc: 'Грядки в каждом готовом куполе засажены плотнее.' },
      widerNets: { name: 'Широкие сети',
        desc: 'Сеть шире, и порой в ней четвёртый алмаз.' },
      quickTurnaround: { name: 'Быстрый оборот',
        desc: 'Спрямлённая траектория, и ракета возвращается быстрее.' },
      deepHold: { name: 'Глубокий трюм',
        desc: 'Трюм попросторнее: между сборами в нём ждёт больше алмазов.' },
      busySky: { name: 'Оживлённое небо', desc: 'Метеориты падают чаще.' },
      heavierRocks: { name: 'Тяжёлые камни', desc: 'Каждый упавший метеорит тяжелее.' },
      luckySky: { name: 'Счастливое небо', desc: 'Среди упавших метеоритов больше редких.' },
      openGround: { name: 'Свободная земля', desc: 'На земле может лежать на один метеорит больше.' },
      longDay: { name: 'Долгий день', desc: 'Над каждой солнечной панелью дни длиннее, а ночи короче.' },
      keenGlint: { name: 'Зоркий блеск', desc: 'Алмазы появляются быстрее.' },
      lastingBoosts: { name: 'Долгие усиления', desc: 'Каждое усиление с таймером длится дольше.' },
      nightShift: { name: 'Ночная смена', desc: 'Пока вас нет, фабрика успевает больше.' },
      warmRollers: { name: 'Тёплые валики',
        desc: 'Нагретые валики быстрее закрепляют краску, поэтому каждый оттиск требует меньше энергии.' },
      diamondTray: { name: 'Алмазный лоток',
        desc: 'Второй лоток у ванны держит алмазы следующей призмы.' },
      pureCarbon: { name: 'Чистый углерод',
        desc: 'Отсеиваете золу и прессуете то, что осталось.' },
      seedStock: { name: 'Отборные семена',
        desc: 'Полный карман семян получше.' },
      deepBanks: { name: 'Глубокие банки',
        desc: 'Ёмкость глубже — только у большого Хранилища.' },
      willingHands: { name: 'Охотные руки',
        desc: 'Расходится молва, что вам стоит помочь.' },
      longShifts: { name: 'Длинные смены',
        desc: 'Каждая пара рук задерживается подольше за те же деньги.' },
      surgeArrestors: { name: 'Грозозащита',
        desc: 'Разрядники на каждой мачте, и порой удар проходит мимо.' },
      deepEarthing: { name: 'Глубокое заземление',
        desc: 'Стержни уходят глубже, перемычки становятся толще. ' +
              'Больше разрядов уходит в землю, а не в вашу сеть.' },
      canopyCover: { name: 'Полог леса',
        desc: 'Сажаете плотнее, и деревья укрывают друг друга.' },
      leadSeam: { name: 'Свинцовая жила',
        desc: 'Глыбу читают до того, как разбить, и идут по тяжёлой жиле, а не дробят ' +
              'её вместе со всем остальным.' },
      steadyFeed: { name: 'Ровная подача',
        desc: 'Семена идут одним темпом, как бы быстро вы ни шли.' },
      widerIntakes: { name: 'Широкие воздуховоды',
        desc: 'Прогоняет за раз больше воздуха.' },
      fineFilters: { name: 'Тонкие фильтры',
        desc: 'Сетка потоньше берёт больше из того же воздуха.' },
      fasterServos: { name: 'Быстрые сервоприводы',
        desc: 'Шустрее суставы, больше работы за тот же час.' },
      efficientAutodrive: { name: 'Экономичный автопривод',
        desc: 'Плавнее управление, меньше уходит впустую.' },
      chargeBanks: { name: 'Батарейные блоки',
        desc: 'Внутри больше ячеек, хватает на дольше.' },
      thinFilm: { name: 'Тонкая плёнка',
        desc: 'Элементы тоньше и ложатся шире, так что на одну порцию их уходит меньше.' },
      fullBaskets: { name: 'Полные корзины',
        desc: 'Есть куда складывать, пока никто не смотрит.' },
      leanBurn: { name: 'Экономное горение',
        desc: 'Более чистое горение отдаёт меньше заработанного.' },
      hotBurn: { name: 'Горячее горение',
        desc: 'Гоните горячее и берёте больше с каждого килограмма.' },
      longContracts: { name: 'Долгие контракты',
        desc: 'Биржа труда выпишет смену подлиннее.' },
      bankedEmbers: { name: 'Сохранённые угли',
        desc: 'Держите жар до утра, и утренняя смена начинает с горячего.' },
      counterHands: { name: 'Руки за прилавком',
        desc: 'Касса, за которой работают не глядя.' },
      sortedLoads: { name: 'Сортированные партии',
        desc: 'Всё лёгкое разобрано и сложено как надо.' },
      vaultRacks: { name: 'Стеллажи хранилища',
        desc: 'Больше стеллажей с ячейками в большом Хранилище.' },
      afterStorm: { name: 'После шторма',
        desc: 'Когда шторм заканчивается, турбины замедляются постепенно, а не сразу.' },
      widerBaskets: { name: 'Широкие корзины',
        desc: 'В широкие корзины влезает больше, пока их никто не опустошил.' },
      stackedBays: { name: 'Ярусные отсеки',
        desc: 'Отсеки в два яруса, так что влезает гораздо больше, прежде чем что-то сдвинется.' },
      deepBays: { name: 'Глубокие отсеки',
        desc: 'Борта отсеков выше, так что сложить можно больше, ' +
        'прежде чем что-то придётся увозить.' },
      deepDrums: { name: 'Глубокие бочки',
        desc: 'Бочка выше — вмещает больше жидкости.'},
      crudePremium: { name: 'Надбавка за сырьё',
        desc: 'Продаёте бочками тем, кому это нужно.' },
      moonlight: { name: 'Лунный свет',
        desc: 'Раз в несколько ночей восходит полная луна, и солнечные панели до рассвета дают немного энергии.' },
      timberTrade: { name: 'Торговля древесиной',
        desc: 'Спасённые балки идут дороже дров.' },
      banknote: { name: 'Банкнота',
        desc: 'Во время шторма ветер иногда приносит банкноту. Нажмите на неё, чтобы подобрать.' },
      wideBore: { name: 'Густой забор',
        desc: 'Забор стоит у самого дна, где грязи больше всего, и каждый поднятый килограмм ' +
              'уносит её больше.' },
      packedBed: { name: 'Высокая колонна',
        desc: 'Колонна с углём выше. Внутри помещается больше воды и угля.' },
      plateStack: { name: 'Густой съём',
        desc: 'Скиммеры сидят глубже в пятне и с каждым килограммом снимают больше нефти.' },
      wrungPads: { name: 'Большой корпус',
        desc: 'Корпус вокруг пластин больше. Внутри помещается больше нефтяной воды и сорбента.' },
      charPremium: { name: 'Надбавка за уголь',
        desc: 'Жжёте медленнее — сорт выходит выше.' },
      hiddenDiamond: { name: 'Скрытый алмаз',
        desc: 'Когда участок полностью восстановлен, из него появляется алмаз.' },
      richBlend: { name: 'Богатая смесь',
        desc: 'Смешиваете как следует, и мешок идёт дороже.' },
      aurora: { name: 'Северное сияние',
        desc: 'В некоторые ночи загорается северное сияние, и пока оно светит, ваши ускорения не убывают.' },
      deepRoots: { name: 'Глубокие корни',
        desc: 'Корни, которые ищут сами, требуют меньше.' },
      clearCargo: { name: 'Прозрачный груз',
        desc: 'И пластик, и стекло хорошо переносят дорогу.' },
      longRange: { name: 'Дальний обзор',
        desc: 'Мачта выше видит дальше.' },
      fullManifest: { name: 'Полная опись',
        desc: 'Одна ведомость на весь двор.' },
    },

    story: {
      act1: { name: 'Глубже платят больше' },
      act2: { name: 'Пятерых не хватит' },
      act3: { name: 'Земля кончается' },
      act4: { name: 'Мусор становится электростанцией' },

      recycler: { text: 'Откройте Переработчик, затем поставьте его между Уборщиком и Рынком — с входом и выходом.',
        why: 'Тот же килограмм стоит дороже после того, как его тронула машина. Вот и вся ' +
             'экономика, в одном проводе.' },
      turbine: { text: 'Постройте Ветряк, чтобы Переработчику было на чём работать.',
        why: 'С этого места машине нужны сразу две разные вещи, а не одна.' },
      sorter: { text: 'Разделите переработанный мусор Весовым сортировщиком и продайте ОБЕ половины.',
        why: 'Дешёвая половина дешева намеренно. Морить сортировщик голодом — не хитрость.' },
      battery: { text: 'Заведите в одно Хранилище энергии два разных вида генераторов.',
        why: 'Солнце садится. Батарея — это то, что переносит линию через ночь.' },
      halfSite: { text: 'Выработайте одну Свалку наполовину от её запаса.',
        why: 'Земля конечна. Это часы, а не декорация.' },

      fiveVol: { text: 'Поставьте пятого Волонтёра и упритесь в потолок.',
        why: 'У всего, что делает что-то из ничего, есть предел. Вот зачем нужна была ' +
             'вкладка Вместимости.' },
      hire: { text: 'Наймите первую смену на Бирже найма.',
        why: 'Рабочую силу можно арендовать поминутно, а не только покупать навсегда.' },
      recruit: { text: 'Получите первого постоянного рекрута в Центре агитации.',
        why: 'Рабочая сила, которая не кончается и не берёт ренты, — и первое, до чего ' +
             'не дотягивается предел.' },
      staffed: { text: 'Посадите бригаду на Торговый пост или Инсинератор.',
        why: 'Касса, которая опустошает себя сама. Кнопка никогда не была смыслом.' },
      split21: { text: 'Пустите Разветвитель питания на 2 и 1, чтобы энергия реально шла.',
        why: 'Эти два поля — решение. Поровну не значение по умолчанию, а такой же выбор.' },

      moveHub: { text: 'Перевезите Центр агитации в Гринхейвен — именно перевезите, а не стройте заново.',
        why: 'Гринхейвен открывается одним Чистым Индексом. Переезд ничего не стоит, и все ' +
             'рекруты едут вместе с машиной; новый Центр агитации на месте начнёт с нуля.' },
      fullSite: { text: 'Вычистите одну Свалку до нуля.',
        why: 'Земля конечна, и вот как выглядит её конец. Свалка остаётся на месте — пустая, ' +
             'с машинами, которые на ней стоят.' },

      greenhaven: { text: 'Откройте Гринхейвен.',
        why: 'Чистый Индекс — это ключ, а не кошелёк. Ничего не списывается.' },
      planter: { text: 'Поставьте Древопосадчик в Рощу.',
        why: 'Первый Чистый Индекс в игре, который не выкопан из земли.' },
      relocate: { text: 'Перевезите целую фабрику в Гринхейвен одним движением.',
        why: 'Переезд — не перестройка: он ничего не стоит, и провода, кассы и рекруты ' +
             'едут вместе с машинами.' },
      weather: { text: 'Переживите свой первый катаклизм в Гринхейвене.',
        why: 'У здешнего неба есть цена — а молния оставляет после себя работу.' },
      drone: { text: 'Заставьте Дрон-уборщик копать — энергия внутрь, мусор наружу, без бригады.',
        why: 'Энергия может заменить людей на свалке. И это единственный копатель, ' +
             'которому всё равно, сколько Волонтёров разрешает ваш предел.' },
      rubble: { text: 'Разделите тяжёлый мусор на стекло и щебень, оба вывести проводами.',
        why: 'Дешёвая половина Весового сортировщика наконец во что-то превращается. ' +
             'Рабочая сила тянет к стеклу, энергия — к щебню; вот и весь регулятор.' },
      hazard: { text: 'Запустите Опасный цех: лёгкий мусор внутрь, опасные отходы наружу и на продажу.',
        why: 'Первая половина батареи. Это не горит, значит это рыночный материал — ' +
             'а Сборщику ячеек он понадобится позже.' },
      grove: { text: 'Доведите одну Рощу до половины.',
        why: 'Первый кусок мира, который действительно возвращается к жизни.' },

      metal: { text: 'Достаньте первый металл из тяжёлого мусора и продайте его.',
        why: 'Материал вне мусорной экономики: его не берёт ни одна печь и не трогает ' +
             'ни одна надбавка на мусор.' },
      eddy: { text: 'Разделите металл на алюминий и сталь, и отведите оба провода.',
        why: 'Тот же приём сортировщика, на два шага глубже — а глубже и есть деньги.' },
      cells: { text: 'Соберите первый килограмм батарей.',
        why: 'Первая вещь в игре, собранная сразу из двух разных веток.' },
      array: { text: 'Поднимите первый массив на Энерголитейной.',
        why: 'Мусор только что стал электростанцией, которая не выключается. Дальше эта ' +
             'сборка не идёт — спасибо, что играли.',
        whyFull: 'Мусор только что стал электростанцией, которая не выключается.' },

      act5: { name: 'Следом — воздух' },
      act6: { name: 'Тихие воды' },
      act7: { name: 'Кормить можно всё' },
      act8: { name: 'Нефть, свинец и кислота' },
      act9: { name: 'Золото под стеклом' },
      act10: { name: 'Светящаяся земля' },

      airHome: { text: 'Постройте Воздухоочиститель в Пустошах и заставьте его чистить воздух.',
        why: 'Первое, что вы чистите, но не можете подмести. Энергия внутрь, Чистый Индекс наружу.' },
      robotCell: { text: 'Зарядите ячейку Робота до самого верха.',
        why: 'Робот работает на запасённом заряде, так что полная ячейка держит его, когда ' +
             'энергия проседает.' },
      mastWarn: { text: 'Получите предупреждение от Метеомачты, пока погода не сменилась.',
        why: 'Погода перестаёт быть сюрпризом, когда вы платите за то, чтобы следить за небом.' },
      pyrolysis: { text: 'Запустите Пиролизный завод: пластик внутрь, нефть наружу и по проводу.',
        why: 'Пластик был дешёвой половиной. Жар без воздуха делает из него что-то куда дороже.' },
      charLine: { text: 'Соберите одну цепочку: Сортировщик обломков, Лесовосстановитель, ' +
                        'Углевыжигательная печь.',
        why: 'Обломки становятся древесиной, а древесина — почти чистым углеродом.' },
      airMax: { text: 'Запустите Воздухоочиститель на 25 кВт или больше, купив Широкие воздуховоды ' +
                      'и Тонкие фильтры до конца.',
        why: 'Денежные навыки — это то, как машина вырастает из того, для чего её построили.' },

      pumpMire: { text: 'Поставьте Водяной насос на пруд в Мутноводье и выведите грязную воду проводом.',
        why: 'Энергия вытягивает грязь из воды.' },
      cleanWater: { text: 'Запустите Очиститель воды, оба выхода — по проводам.',
        why: 'Уголь держит грязь, а то, что проходит сквозь него, чистое.' },
      oilPyro: { text: 'Запустите Нефтяной генератор на нефти с вашего Пиролизного завода.',
        why: 'Единственное место, где Чистый Индекс тратится. Такая мощь стоит очков.' },
      fertLoad: { text: 'Заведите Завод удобрений в Садовника и дайте ему взять одну полную загрузку.',
        why: 'Каждая загрузка ускоряет рост — навсегда.' },
      tankCarry: { text: 'Перевезите Цистерну с жидкостью внутри в другое место.',
        why: 'Провод дотягивается только до того, что видно. Цистерна — это то, как ' +
             'жидкость путешествует.' },
      coalStore: { text: 'Заполните Склад материалов углём до верха и заведите его в Очиститель воды.',
        why: 'Полный склад — это запас. Очиститель работает, даже когда печь стоит.' },

      rockLead: { text: 'Разбейте упавший метеорит Рудокопом и выведите свинец проводом.',
        why: 'Свинец приходит только с неба.' },
      fibreKiln: { text: 'Заведите Волоконный пресс в Углевыжигательную печь.',
        why: 'Из растительных волокон тоже выходит древесина, и печи всё равно, откуда она.' },
      kilnShare: { text: 'Кормите углём одной Углевыжигательной печи Алмазный пресс и Очиститель ' +
                         'воды одновременно, чтобы оба работали.',
        why: 'Одна печь, две голодные машины. Сколько кому — решаете вы.' },
      bladeKits: { text: 'Запустите Лопастный цех и выведите комплекты проводом.',
        why: 'Пластик и алюминий, превращённые в деталь для старой машины.' },
      tonicBrew: { text: 'Запустите Бродильный чан и выведите тоник проводом.',
        why: 'Отходы, превращённые в то, что можно выпить.' },
      threeFed: { text: 'Кормите Волонтёра, Ветряк и Садовника одновременно, каждого — от своего ' +
                        'производителя.',
        why: 'Три линии сразу, и каждая кормит машину, построенную много часов назад.' },

      oilSplit: { text: 'Разделите нефтяную воду на нефть и воду, оба выхода — по проводам.',
        why: 'Разлив приносит деньги, как только его разобрали на части.' },
      rareGold: { text: 'Разбейте редкий метеорит Рудокопом и выведите золото проводом.',
        why: 'Золото падает только в редких камнях, и его там совсем немного.' },
      panelDouble: { text: 'Удвойте мощность одной Солнечной панели Комплектами остекления.',
        why: 'Каждая загрузка добавляет мощность навсегда, и каждая чуть дороже предыдущей.' },
      acidLoop: { text: 'Сделайте кислоту из опасных отходов, которые выбрасывает ваш Очиститель воды.',
        why: 'Грязь, которую вы вынули из воды, становится нужным вам веществом.' },
      acidShare: { text: 'Разделите один Кислотный завод Делителем жидкостей между Травильным ' +
                         'цехом и Цистерной.',
        why: 'Кислота на сейчас и кислота на потом. Как делить — решаете вы.' },
      oilTank: { text: 'Заполните Цистерну нефтью до верха и заведите её в Нефтяной генератор.',
        why: 'Запасённая нефть — это энергия, которую можно сжечь потом, когда понадобится.' },

      goldLeach: { text: 'Разделите лом на золото и шлак в Цехе выщелачивания, оба — по проводам.',
        why: 'Почти всё — шлак. Вот сколько на самом деле стоит золото.' },
      chips: { text: 'Запустите Цех микросхем и выведите микросхемы проводом.',
        why: 'Золото, стекло и кислота в одной маленькой детали.' },
      robotKit: { text: 'Дайте Роботу Комплект панелей.',
        why: 'Робот, который днём сам оплачивает часть своей энергии.' },
      prioDome: { text: 'Дайте Биокуполу бригаду с приоритетной стороны Приоритетного делителя бригад.',
        why: 'Купол получает бригаду первым. Остальным — что осталось.' },
      domes100: { text: 'Пусть ваши Биокуполы вместе дают больше 300 Чистого Индекса в час.',
        why: 'Каждый купол платит вечно. Когда их достаточно, это стабильный доход.' },

      wasteDig: { text: 'Заставьте Очиститель отходов копать. Дайте бригаде снаряжение из ' +
                        'Мастерской снаряжения или пошлите Роботов — им оно не нужно.',
        why: 'Людям здесь нужна защита. Машинам — нет.' },
      bury: { text: 'Выкопайте ядерные отходы и захороните их в Глубинном хранилище.',
        why: 'Некоторый мусор нельзя очистить, его можно только запечатать.' },
      bankGold: { text: 'Заведите золото из Цеха выщелачивания в Банк.',
        why: 'Деньги, которые растут, пока лежат.' },
      reactorRepo: { text: 'Питайте Глубинное хранилище от Ядерного реактора.',
        why: 'Отходы, которые вы выкопали, теперь оплачивают захоронение остальных.' },
      rocketMetal: { text: 'Дождитесь, пока космотрал вернётся с орбиты.',
        why: 'Часть лома никогда не лежала на земле.' },
      printLine: { text: 'Соберите Лопастный цех, Бумажную фабрику и Печатный цех в одну цепочку ' +
                         'и напечатайте что-нибудь.',
        why: 'Лопасти режут массу, из массы выходит бумага, а из бумаги — печать.' },
      cleanFive: { text: 'Заработайте 5 000 000 Чистого Индекса за всё время.',
        why: 'Одна земля вас туда не доведёт. Доведут построенные вами купола и лом, ' +
             'снятый с орбиты.' },
    },

    goal: {
      firstSweep: { name: 'Первый заход',
        desc: 'Пройдите рукой по Свалке 20 раз.' },
      firstBurn: { name: 'В огонь',
        desc: 'Сожгите свой первый мусор на Полигоне.' },
      firstCash: { name: 'Первая выручка',
        desc: 'Заработайте первые деньги на Рынке.' },
      firstPower: { name: 'Под напряжением',
        desc: 'Откройте свой первый генератор энергии.' },
      perfectSplit: { name: 'Идеальное деление',
        desc: 'Запустите Весовой сортировщик на полную — ровное деление 50 на 50.' },
      evenPower: { name: 'Поровну',
        desc: 'Разделите энергию ровно пополам Делителем энергии — по половине на выход, и чтобы ' +
              'энергия шла.' },
      heavyMerge: { name: 'Плотный поток',
        desc: 'Сведите два потока тяжёлого мусора в один Склад материалов.' },
      firstGem: { name: 'Удачная находка',
        desc: 'Поймайте алмаз, когда он появится на карте.' },
      maxedSkill: { name: 'Мастерство',
        desc: 'Доведите любой денежный навык до 5-го уровня.' },
      threeSources: { name: 'Смешанная сеть',
        desc: 'Запитайте один Аккумулятор от трёх разных типов генераторов сразу.' },
      halfSite: { name: 'Половина вывезена',
        desc: 'Выберите Свалку до половины её запаса.' },
      handHundred: { name: 'Голыми руками',
        desc: 'Уберите 50 кг одними только проходами рукой.' },
      bigSweep: { name: 'Идеальный проход',
        desc: 'Сделайте один проход рукой по Свалке, который даст больше 0,4 ИЧ.' },
      batHunter: { name: 'Охотник на летучих мышей',
        desc: 'Нажмите на 13 летучих мышей, пока идёт Хэллоуин.' },
      fullCrew: { name: 'Полная бригада',
        desc: 'Пусть в одном Пункте найма одновременно работают трое наёмных.' },
      bigCrew: { name: 'Сбор',
        desc: 'Запитайте один Узел бригад от пяти источников рабочей силы сразу.' },
      powerKg: { name: 'Без людей',
        desc: 'Вывезите 300 кг из земли одними только Дронами-уборщиками.' },
      firstMetal: { name: 'Цена лома',
        desc: 'Продайте свой первый металл на Рынке.' },
      drainSite: { name: 'Выжженная земля',
        desc: 'Выберите Свалку до самого дна.' },
      hiredFive: { name: 'Вся ведомость',
        desc: 'Запитайте один Узел бригад от пяти Пунктов найма, и в каждом — полная ' +
              'бригада.' },
      spendGems: { name: 'Большие траты',
        desc: 'Потратьте 20 алмазов.' },
      firstTree: { name: 'Пустить корни',
        desc: 'Поставьте своего первого Садовника.' },
      newLand: { name: 'Земли позеленее',
        desc: 'Откройте Гринхейвен.' },
      allWeather: { name: 'Охотник за штормом',
        desc: 'Увидьте каждый вид погоды своими глазами. Считается, только если вы в том месте, где она идёт.' },
      yardBare: { name: 'Ничего не осталось',
        desc: 'Выберите до дна все Свалки в Пустошах.' },
      firstCells: { name: 'Батарейный блок',
        desc: 'Соберите свой первый килограмм батарей.' },
      bothTimber: { name: 'Два волокна',
        desc: 'Получите вторичную древесину обоими способами — восстановлением из обломков ' +
              'и прессованием из органических отходов.' },
      charredWood: { name: 'Пережжённое',
        desc: 'Пережгите 15 кг вторичной древесины в древесный уголь на Углевыжигательной печи.' },
      bigArray: { name: 'Своя сеть',
        desc: 'Доведите одну Энерголитейную до выработки больше 3 кВт/ч.' },
      bigOutreach: { name: 'Движение',
        desc: 'Доведите один Центр агитации до притока больше 5 РС/ч сторонников.' },
      fullVault: { name: 'Полный банк',
        desc: 'Запитайте одно Энергохранилище от десяти источников энергии сразу.' },
      splitChain: { name: 'Каскад',
        desc: 'Выстройте пять Делителей энергии в одну цепочку.' },
      kiloCI: { name: 'Чистая тысяча',
        desc: 'Заработайте суммарно 1 000 Индекса Чистоты.' },
      kiloMoney: { name: 'Первое состояние',
        desc: 'Заработайте суммарно $1 000.' },
      boltBlocked: { name: 'Заземлено',
        desc: 'Пусть Грозозащита полностью отведёт удар Молнии от вашей сети, пока вы в игре.' },
      fullGrove: { name: 'Сомкнутый полог',
        desc: 'Вырастите Рощу до 100%.' },
      fiveSuns: { name: 'Пять солнц',
        desc: 'Подключите пять солнечных роботов напрямую к одному узлу бригад.' },
      robotWaste: { name: 'Без костюмов',
        desc: 'Выкопайте 100 кг ядерных отходов бригадой из одних роботов.' },
      bankFull: { name: 'Золотой запас',
        desc: 'Заполните Банк золотом до предела.' },
      bankGold: { name: 'Золотой стандарт',
        desc: 'Держите в Банках 3 кг золота одновременно.' },
      warehouse: { name: 'Склад',
        desc: 'Держите в Складах материалов 200 кг одновременно, и не меньше 25 кг ' +
              'каждого из четырёх разных материалов.' },
      bigHire: { name: 'Полная смена',
        desc: 'Наймите десять работников на целый час в одной Бирже труда.' },
      firstRock: { name: 'С неба', desc: 'Полностью выработайте один метеорит.' },
      tenCraters: { name: 'Десять кратеров', desc: 'Полностью выработайте десять метеоритов.' },
      fullBloom: { name: 'Полный цвет',
        desc: 'Добейтесь, чтобы один Садовник выращивал больше 2 000 ИЧ/ч.' },
      oilSacrifice: { name: 'Плата натурой',
        desc: 'Отдайте суммарно 300 Индекса Чистоты за лицензии Нефтяного генератора.' },
      pureGlass: { name: 'Чистый прогон',
        desc: 'Запустите Сортировщик обломков на одной бригаде — чтобы всё выходило стеклом и ни ' +
              'крошки щебня.' },
      allGenerators: { name: 'Все мачты',
        desc: 'Поставьте в одном месте ПЯТЬ генераторов каждого вида сразу — пять ' +
              'Ветряков, пять Солнечных панелей и пять Штормовых ветряков вместе.' },
      richPlanter: { name: 'Глубокая грядка',
        desc: 'Кормите одного Садовника, пока удобрение не разгонит его в полтора раза: ×1,5, пять ' +
              'порций.' },
      photoFinish: { name: 'Фотофиниш',
        desc: 'Выберите две Свалки в одном месте до самого дна, с разницей не больше 60 секунд.' },
      perfectBurn: { name: 'Идеальный обжиг',
        desc: 'Сделайте 10 кг древесного угля из мусора с лучшим выходом, какой есть: 1 кг на каждые 6 кг, ничего не теряя по пути.' },
      fleetStorm: { name: 'Флот в шторм',
        desc: 'Запустите три космотрала за один Шторм.' },
      oneCleaner: { name: 'Оба метода',
        desc: 'Выкопайте 500 кг Уборщиками и 500 кг Дронами-уборщиками. Уборка руками не в счёт.' },
      twinFeed: { name: 'Два одинаковых',
        desc: 'Подайте в оба гнезда Торгового зала или Сжигательного двора один и тот же ' +
              'сорт одновременно.' },
      stampBlueprint: { name: 'Оттиск',
        desc: 'Сохраните группу машин как чертёж и поставьте её обратно в другом месте.' },
      gemFifty: { name: 'Старатель',
        desc: 'Подберите с земли 50 алмазов.' },
      forgeCycle: { name: 'На своём',
        desc: 'Приведите Центру агитации сторонника на одной энергии Энерголитейной: без ветряков, ' +
              'панелей и батарей, только на ваших массивах.' },
      allForecast: { name: 'Читать небо',
        desc: 'Увидьте приближение каждого вида погоды — по одному предупреждению Метеомачты на ' +
              'каждый.' },
      firstPressed: { name: 'Первая грань',
        desc: 'Выдавите свой первый алмаз из древесного угля на Алмазном прессе.' },

      firstTonic: { name: 'Второе дыхание',
        desc: 'Дайте Волонтёру первую порцию тоника.' },
      firstBlade: { name: 'Свежие лопасти',
        desc: 'Дайте Ветряку первый комплект лопастей.' },
      firstGlazing: { name: 'Первый свет',
        desc: 'Дайте Солнечной панели первый комплект остекления.' },
      acidDrum: { name: 'Запечатано и убрано',
        desc: 'Подержите кислоту в Цистерне.' },

      openMire: { name: 'Тихие воды', desc: 'Откройте Мутноводье.' },
      openBlack: { name: 'Чёрное золото', desc: 'Откройте Черноозёрье.' },
      openGlow: { name: 'Навстречу свечению', desc: 'Откройте Светотопь.' },
      clearPool: { name: 'Чистый пруд', desc: 'Доведите Грязный пруд до 100%.' },
      spillMopped: { name: 'Пятно убрано', desc: 'Доведите Нефтяное пятно до 100%.' },
      fullCircle: { name: 'Полный круг',
        desc: 'Верните чистую воду в пруд Водяным насосом.' },
      clearSkies: { name: 'Чистое небо',
        desc: 'Пусть Воздухоочиститель работает в каждом месте одновременно.' },
      chargedAir: { name: 'Заряженный воздух',
        desc: 'Дайте Штормовому ветряку первую Расширенную ячейку.' },
      finePrint: { name: 'Мелкий шрифт', desc: 'Сделайте первый килограмм микросхем.' },
      glassGarden: { name: 'Стеклянный сад', desc: 'Достройте свой первый Биокупол.' },
      domeEverywhere: { name: 'Купол повсюду',
        desc: 'Пусть достроенный Биокупол стоит в каждом месте одновременно.' },
      splitAtom: { name: 'Расщепить атом', desc: 'Впервые запустите Ядерный реактор.' },
      rainDance: { name: 'Танец дождя',
        desc: 'Запустите Митинг и Бурный рост вместе, пока дождь поливает работающего Садовника.' },
      offPress: { name: 'Из-под пресса', desc: 'Напечатайте первое усиление в Печатном цехе.' },
      fullCatalogue: { name: 'Полный каталог',
        desc: 'Напечатайте по одному усилению каждого вида, который умеет Печатный цех.' },

      rareFind: { name: 'Редкая находка', desc: 'Выкопайте целиком редкий метеорит, в котором есть золото.' },
      longHaul: { name: 'Дальний рейс',
        desc: 'Перенесите 20 машин в другое место за один переезд.' },
      weatherStation: { name: 'Метеостанция',
        desc: 'Пусть в каждом месте с погодой стоит полностью заряженная Метеомачта.' },
      printedStone: { name: 'Печатный камень', desc: 'Напечатайте алмаз в Печатном цехе.' },
      tripleStack: { name: 'Тройной заряд', desc: 'Пусть три усиления работают одновременно.' },
      bottledBolt: { name: 'Молния в бутылке', desc: 'Заполните Грозовой накопитель до краёв.' },
      greatArray: { name: 'Великий массив',
        desc: 'Пусть одна Энерголитейная даёт 20 кВт/ч без единого усиления.' },
      grassroots: { name: 'Народное движение',
        desc: 'Пусть один Центр агитации даёт 25 РС/ч сторонников без единого усиления.' },
      diamondMine: { name: 'Алмазный прииск', desc: 'Выдавите 25 алмазов на Алмазных прессах.' },
      goldRush: { name: 'Золотая лихорадка', desc: 'Получите 10 кг золота.' },
      reactorRow: { name: 'Ряд реакторов',
        desc: 'Пусть три Ядерных реактора работают одновременно.' },
      missionControl: { name: 'Центр управления полётами', desc: 'Запустите 5 космотралов.' },
      fullCapacity: { name: 'Полная вместимость',
        desc: 'Купите хотя бы один уровень каждой машины на доске Вместимости.' },
      strongVolunteer: { name: 'Одни сильные руки',
        desc: 'Пусть один Волонтёр даёт 50 РС/ч без Митинга.' },
      moneyMaster: { name: 'Мастер денег',
        desc: 'Доведите каждый денежный навык до последнего уровня.' },
      allBoosts: { name: 'Всё и сразу',
        desc: 'Пусть все усиления с таймером работают одновременно.' },
      printingPress: { name: 'Типография', desc: 'Сделайте 10 оттисков в Печатных цехах.' },
      worldReborn: { name: 'Мир возрождён',
        desc: 'Доведите каждое место до последней стадии восстановления.' },
      nothingAnywhere: { name: 'Нигде ничего',
        desc: 'Опустошите до дна каждую Свалку в каждом месте.' },
      glassCity: { name: 'Стеклянный город', desc: 'Достройте 10 куполов в одном Биокуполе.' },
      cleanTide: { name: 'Чистый прилив',
        desc: 'Верните в пруды 1000 кг чистой воды.' },
      crewRiver: { name: 'Река рук',
        desc: 'Пусть из одного Узла бригад выходит 1000 РС/ч.' },
      powerRiver: { name: 'Шлюз',
        desc: 'Пусть из одного Аккумулятора или Энергохранилища выходит 2000 кВт/ч.' },
      millionCI: { name: 'Чистый миллион',
        desc: 'Наберите в сумме 1 000 000 Индекса чистоты.' },
      allTrials: { name: 'Испытание огнём', desc: 'Пройдите все Испытания.' },
      allPowered: { name: 'Полный ход',
        desc: 'Кормите пять Волонтёров и пять Ветряков, пока каждый из них не выйдет на ' +
              'двойную отдачу.' },
      soldCells: { name: 'Обналичить',
        desc: 'Продайте и батареи, и сталь через один Торговый зал вместо Энерголитейной.' },
    },

    news: {
      update13: {
        title: 'Обновление 13: Хэллоуин, новые денежные навыки и новый справочник',
        text: 'С 24 по 31 октября вас ждут хэллоуинские сюрпризы. Часть денежных навыков была скучной или почти ничего ' +
              'не давала, и их сменили новые, которые видно на карте: монета при уборке руками или падающая звезда, ' +
              'которую можно поймать. Вкладка «Машины» в справочнике тоже новая: у каждой машины теперь своя ' +
              'карточка, и она гораздо понятнее показывает, как машина работает. А ещё много мелких исправлений и ' +
              'доработок. Остальное в девлоге.\n\n' +
              'Буду рад вашим мыслям и предложениям об этом в комментариях.',
      },
      update12: {
        title: 'Обновление 12: видимый воздух и новое обучение',
        text: 'Теперь воздух видно: бурый над грязными местами и чистый, когда вы их уберёте. ' +
              'А строить стало ещё удобнее. Остальное в девлоге.\n\n' +
              'Буду рад вашим мыслям и предложениям об этом в комментариях.',
      },
      update11: {
        title: 'Обновление 11: режимы обзора',
        text: 'Это обновление сильно выручит на больших заводах. Выберите нужный режим на панели ОБЗОР слева ' +
              '(или F1–F6) и находите слабые места и другие проблемы завода намного быстрее. ' +
              'Мелкие изменения описаны в девлоге.\n\n' +
              'Буду рад вашим мыслям и предложениям об этом в комментариях.',
      },
      update9: {
        title: 'Обновление 9: новые звуки и анимации',
        text: 'Внимание: привязка к сетке теперь включена по умолчанию. Изменить это можно в любой ' +
              'момент в Настройках, вкладка Стройка, пункт «Расстановка машин». Почти все звуковые ' +
              'эффекты новые, и я добавил новые анимации и улучшил картинку. Если что-то кажется ' +
              'странным или раньше было лучше, напишите в комментариях. Я отвечу и посмотрю.',
      },
      update8: {
        title: 'Обновление 8: ночь, аккуратная карточка машины и починка сортировщика',
        text: 'На карточках машин теперь есть полоса выхода: что ждёт отправки. ' +
              'Скрыть её можно в Настройках, вкладка Интерфейс. Остальное в девлоге.',
      },
      update7: {
        title: 'Обновление 7: мини-карта, поиск машин и изгиб проводов',
        text: 'Изгиб проводов по умолчанию выключен: включите его в Настройках, вкладка Стройка. ' +
              'Остальное в девлоге.',
      },
      update6: {
        title: 'Обновление 6: тренировки',
        text: 'Нажмите ПОПРОБОВАТЬ у машины в справочнике, чтобы испытать её без риска. ' +
              'Остальное в девлоге.',
      },
      update5: {
        title: 'Обновление 5',
        text: 'Интерфейс перерисован. Если прежний нравился больше, в настройках можно ' +
              'его вернуть, и заглянуть туда стоит в любом случае: там появилось ' +
              'несколько новых пунктов. Посмотрите заодно и вкладку УПРАВЛЕНИЕ. ' +
              'Всё, что изменилось, перечислено в девлоге Обновления 5 на странице игры.',
      },
    },

    tut: {

      look: { title: 'Осмотритесь',
        text: 'Тяните карту. Колесо мыши приближает.',
        textTouch: 'Тяните карту. Двумя пальцами приближайте.',
        keys: 'Тяните|Колесо мыши|Двумя пальцами' },
      sweep: { title: 'Уборка руками',
        text: 'Заводите курсор на зелёный участок и уводите обратно.',
        textDrag: 'Зажмите и водите по зелёному участку.',
        textDragMouse: 'Зажмите и водите по зелёному участку.',
        keys: 'Заводите|уводите обратно|зелёному участку' },
      ciWhat: { title: 'Индекс чистоты',
        text: 'Ваш счёт уборки. Он не тратится: каждый новый рубеж открывает новые машины.',
        keys: 'не тратится|новые машины' },
      volunteerSkill: { title: 'Ваш первый навык',
        text: 'Возьмите Волонтёров.', keys: 'Волонтёров' },
      placeVolunteer: { title: 'Постройте Волонтёра',
        text: 'Перетащите его на карту.', keys: 'на карту' },
      placeCleaner: { title: 'Постройте Уборщика',
        text: 'Он ставится в пунктирную ячейку.', keys: 'пунктирную ячейку' },
      inspect: { title: 'Загляните внутрь',
        text: 'Щёлкните по машине.', keys: 'машине' },
      wireCrew: { title: 'Протяните провод',
        text: 'Рабочую силу к Уборщику.',
        textTouch: 'Рабочую силу к Уборщику.',
        keys: 'Рабочую силу|Уборщику' },
      placeLandfill: { title: 'Постройте Полигон',
        text: 'Он сжигает мусор в Индекс чистоты.', keys: 'Индекс чистоты' },
      wireTrash: { title: 'Замкните цепочку',
        text: 'Мусор в Полигон.', keys: 'Мусор|Полигон' },
      burn: { title: 'Заберите заработанное',
        text: 'Нажмите СЖЕЧЬ на её карточке, чтобы забрать.', keys: 'СЖЕЧЬ' },
      marketSkill: { title: 'А теперь пусть работает', keys: 'Рынка',
        text: 'Индекс чистоты дошёл до Рынка. Возьмите его в Дереве машин.',
        quietTitle: 'До Рынка',
        quietText: 'Пусть работает — или подметайте дальше руками, — пока Индекс чистоты ' +
              'не дойдёт до Рынка.' },
      placeMarket: { title: 'Постройте Рынок', keys: 'Рынок',
        text: 'Поставьте Рынок. Он продаёт мусор за деньги.' },
      wireMarket: { title: 'Разделите поток', keys: 'Рынку',
        text: 'Подведите Уборщика ещё и к Рынку. Выход может питать много машин, а вход принимает только один провод.' },

      cutWire: { title: 'Перережьте провод', keys: 'Правый клик|Нажмите на вход',
        text: 'Правый клик по проводу — и он перерезан, весь мусор пойдёт в одну сторону. ' +
              'Деньги или Чистый Индекс — решать вам, провод можно вернуть в любой момент.',
        textTouch: 'Нажмите на вход, в который идёт провод, — он будет перерезан, весь мусор ' +
              'пойдёт в одну сторону. Деньги или Чистый Индекс — решать вам, провод можно ' +
              'вернуть в любой момент.' },
      collect: { title: 'Заберите деньги', keys: 'СОБРАТЬ',
        text: 'Нажмите СОБРАТЬ на Рынке, чтобы опустошить его кассу.' },
      moneySkill: { title: 'Потратьте их', keys: 'Лишние руки',
        text: 'Откройте Навыки денег и возьмите Лишние руки. Это дерево раскрывается по ' +
              'ходу дела: каждый купленный навык открывает следующий.',
        quietTitle: 'Копим на первое улучшение',
        quietText: 'За деньги улучшения покупаются во втором дереве. Пусть Рынок ' +
              'торгует, пока не хватит на Лишние руки.' },
      diamond: { title: 'Алмаз', keys: 'алмаз',
        text: 'Раз в несколько минут где-то на карте появляется алмаз и ждёт. Нажмите на ' +
              'него.' },
      claim: { title: 'Заберите награду за цель', keys: 'ЗАБРАТЬ',
        text: 'Вы уже выполняли цели, сами того не замечая. Нажмите Цели, перейдите на ' +
              'вкладку ЦЕЛИ и нажмите ЗАБРАТЬ, чтобы получить алмаз.' },

      boost: { title: 'Первое усиление бесплатно', keys: 'бусты|Бусты',
        text: 'Алмазы покупают временные бусты. Они длятся три реальные минуты. Первый — ' +
              'бесплатно.',
        textChosen: 'Алмазы покупают временные бусты. Они длятся три реальные минуты. ' +
              'Откройте Бусты и запустите %s.' },
      done: { title: 'Вот и вся игра',
        text: 'Дальше те же три шага: открыть машину, разобраться, что ей нужно, подвести ' +
              'провода. При встрече со сложной приходит короткая заметка.' },
    },

    hint: {

      gemsIdle: { title: 'Алмазы копятся',
        text: 'У вас хватает на буст, и уже давно ни один не работал.' },
      skillsNoBuild: { title: 'Улучшения платят за каждую машину',
        text: 'Улучшение добавляет к каждой вашей машине этого вида. Сначала стройте, потом улучшайте.' },
      trials2: { title: 'Испытания',
        text: 'Это трудные. За каждое пройденное — алмазы и новая машина.',
        textNoMachine: 'Это трудные. За каждое пройденное — алмазы.' },
      plan2: { title: 'План',
        text: 'План подсказывает, что делать дальше — по шагу за раз. В нём четыре главы, ' +
              'и за каждую пройденную платят деньгами.' },
      caps2: { title: 'Предел, который двигается',
        text: 'Некоторых машин можно построить лишь ограниченное число. Поднять предел можно только ' +
              'алмазами: Бусты, вкладка ВМЕСТИМОСТЬ.' },
      codex2: { title: 'Всё записано',
        text: 'СПРАВОЧНИК перечисляет каждую машину с настоящими числами, каждый материал, погоду, ' +
              'бусты и цели.' },
      practice1: { title: 'Тренировка',
        text: 'ПОПРОБОВАТЬ открывает тренировку, безопасную копию машины. Оставьте её без сырья или ' +
              'перекройте выход и посмотрите, что будет: это ничего не стоит, а ваша игра подождёт. ' +
              '★★ ОБЯЗАТЕЛЬНО учат больше всего. В справочнике есть все тренировки.' },
      rates2: { title: 'А оно вообще растёт?',
        text: 'Вверху экрана: ИЧ/ч и $/ч. Это скорость, с которой производят ваши машины.' },

      group2: { title: 'Расстановка машин',

        text: 'Shift-клик выбирает несколько, Shift с перетаскиванием обводит их рамкой. Потом тяните все сразу.',
        keys: 'Shift-клик|Shift с перетаскиванием',
        textTouch: 'Машины двигаются группами. Нажмите на одну, нажмите ВЫБРАТЬ ЕЩЁ на её ' +
              'панели, затем нажимайте на остальные, чтобы добавить их.' },
      group3: { title: 'Выделить сразу несколько',
        text: 'Вместо того чтобы щёлкать по одной, зажмите Shift и растяните рамку по ' +
              'пустому месту. В группу попадёт всё, чего она коснётся.' },

      layout2: { title: 'Порядок на карте',

        text: 'F разворачивает отобранные машины. Зажмите Ctrl при протяжке, и провод будет прямоугольным. ' +
              'Сетка: Настройки, Расстановка машин.',
        keys: 'F|Ctrl',
        textTouch: 'Плашка «Разъёмы» на панели машины разворачивает её. Сетка: Настройки, Расстановка машин.' },
      prismFit: { title: 'Как вставить призму',
        text: 'Перетащите призму из верхней панели на машину, которая делает материал. Поздним машинам ' +
              'нужно больше одной: работает, когда заполнены все гнёзда.' },
      manyWires: { title: 'Много проводов сразу',
        text: 'Отпустите провод с зажатым Shift, и он останется в руке. Щёлкайте по следующим разъёмам. ' +
              'Esc, правый щелчок или пустая карта убирают его.' },
      goGreenhaven: { title: 'Гринхейвен открыт',
        text: 'Нажмите его название вверху карты, чтобы полететь туда.' },
      overlays: { title: 'Обзор',
        text: 'Каждый режим показывает на карте что-то одно. F1–F6 переключают их. Правый щелчок по машине ' +
              'подсвечивает её цепочку.',
        textTouch: 'Каждый режим показывает на карте что-то одно. Нажмите режим, чтобы включить его.',
        keys: 'F1–F6|Правый щелчок|Нажмите режим' },
      travel2: { title: 'Теперь мест два',
        text: 'Нажмите название вверху или его цифру, чтобы перелететь. Всё, что осталось позади, ' +
              'продолжает работать.',
        keys: 'название вверху|цифру' },
      relocate2: { title: 'Перенесите завод целиком',
        text: 'Строить заново не нужно. Выберите машины, затем:',
        rowTail: 'Это бесплатно, и провода едут вместе с ними.' },
      weather: { title: 'Погода здесь',
        textRows: 'Погода налетает примерно раз в минуту, на полминуты.',
        keys: 'раз в минуту',
        text: 'В Гринхейвене есть погода. Примерно раз в минуту что-нибудь налетает на ' +
              'полминуты. Сейчас идёт дождь, так что можно посмотреть, как это ' +
              'выглядит.\nДОЖДЬ: деревья x2, копание и голые руки x0,5.\nШТОРМ: ' +
              'турбины x2,5, но Свалки и Мусоросжигатели перестают жечь.\nМОЛНИЯ: ни ' +
              'один генератор не даёт ни ватта, батареи замирают, но сжигание и ' +
              'голые руки стоят x5. Сеть после этого лежит и поднимается сама; ' +
              'ЗАПУСТИТЬ на плашке возвращает всё разом.\nЖАРА: солнечные x2,5, всё ' +
              'зелёное x1/3.',
        textFull: 'В Гринхейвене есть погода. Примерно раз в минуту что-нибудь налетает на ' +
              'полминуты. Сейчас идёт дождь, так что можно посмотреть, как это ' +
              'выглядит.\nДОЖДЬ: деревья x2, копание и голые руки x0,5.\nШТОРМ: ' +
              'турбины x2,5, но Волонтёры, Бригадир и наёмные рабочие работают на x0,5. ' +
              'Роботам всё равно.\nМОЛНИЯ: ни ' +
              'один генератор не даёт ни ватта, батареи замирают, но сжигание и ' +
              'голые руки стоят x5. Сеть после этого лежит и поднимается сама; ' +
              'ЗАПУСТИТЬ на плашке возвращает всё разом.\nЖАРА: солнечные x2,5, всё ' +
              'зелёное x1/3.' },
      recycler: { title: 'Переработчик',
        text: 'Перерабатывает 1 кг/ч мусора на 1 кВт/ч на входе. Мусор, на который не хватило ' +
              'энергии, выходит через второй выход, так что подведите ОБА выхода куда-нибудь.' },
      weightSorter: { title: 'Весовой сортировщик',
        text: 'Энергии ему нужно ВДВОЕ больше, чем мусора: 2 кВт/ч на каждый 1 кг/ч на ' +
              'входе. Дайте столько — и получите чистое деление 50/50 на лёгкий и ' +
              'тяжёлый, а это то, что нужно: лёгкий стоит 7,25, а тяжёлый всего ' +
              '2,80.' },
      powerStorage: { title: 'Аккумулятор',
        text: 'Отдачу можно ограничить. Задайте ПРЕДЕЛ ВЫДАЧИ в его панели.' },
      solarPanel: { title: 'Солнечная панель',
        text: 'Энергию она даёт только ДНЁМ, а ночью отдыхает. Значок на карточке отсчитывает время до рассвета.' },
      fluidTank: { title: 'Цистерна',
        text: 'Отдаёт она медленно, поэтому машина за ней может выглядеть голодной. Скорость ' +
              'задаёте вы: в её панели есть ПРЕДЕЛ ВЫДАЧИ. Очистите поле — и она отдаст ' +
              'столько, сколько попросят.' },
      groundLifter: { title: 'Подъёмник участков',
        text: 'Нажмите на любой участок в этом месте и выберите ПОДНЯТЬ. Опустите его где хотите. ' +
              'Машины и провода переедут вместе с ним. Каждый перенос стоит денег. ' +
              'Участки двигаются только внутри одного места, из места в место нельзя.' },
      uniSplitter: { title: 'Большой делитель',
        text: 'Он становится тем, что подключено первым. Чтобы сменить вид, уберите все ' +
              'провода. Ненужным выходам поставьте 0.' },
      powerSplitter: { title: 'Делитель энергии',
        text: 'Деление задаёте вы. Нажмите на машину и впишите два числа в её панели.' },

      trashJunction: { title: 'Склад материалов',
        text: 'Это ещё и узел. До пяти проводов с одним материалом входят, а ' +
        'выходит один, и то, что не увезли, лежит дальше.' + '\n\n' +
        'Первый пришедший материал решает, что склад держит, и это ' +
        'не меняется, пока он не опустеет. Выпустите старый материал, ' +
        'прежде чем слать другой.' },
      droneCleaner: { title: 'Дрон-уборщик',
        text: 'Он занимает площадку, на которой стоит, и подметать её руками больше не ' +
              'выйдет.' },
      magnetSeparator: { title: 'Магнитный разделитель',
        text: 'Тяжёлый мусор, на который не хватило энергии, не пропадает: он выходит через ' +
              'второй выход.' },
      panelWorks: { title: 'Панельный цех',
        text: 'Комплекты работают только при солнце. Ночью Робот снова берёт из ' +
              'сети, так что оставьте ему откуда брать.' },
      hiringAgency: { title: 'Кадровое агентство',
        text: 'На Банке нанимает само, платя тем, что заработал Банк. В любом другом месте ' +
              'нанимает только по кнопкам в панели и платит из ваших денег.' },
      labourExchange: { title: 'Биржа труда',
        text: 'В её панели выбирается, сколько рабочих нанять и на какой срок. Выберите ' +
              'и то и другое, затем нажмите «НАНЯТЬ».' },
      robot: { title: 'Робот',
        text: 'Сначала заряжается, потом работает, поэтому робот с пустой батареей ' +
              'пока ничего не даёт. Форсаж включается в его панели: ' +
              'больше рабочей силы и больше энергии на каждую единицу.' },
      wasteCleaner: { title: 'Очиститель отходов',
        text: 'Он стоит на Ядерной свалке. Людям на нём нужно защитное снаряжение, роботам нет.' },
      airCleaner: { title: 'Воздухоочиститель',

        text: 'У него есть предел, и энергия сверх него пропадает, поэтому смотрите ' +
              'на строку «Предел мощности» в карточке, прежде чем подводить ещё.' },
      outreachHub: { title: 'Центр агитации',
        text: 'До первого сторонника он не даёт НИЧЕГО, поэтому всё, что за ним, сначала ' +
              'показывает ноль. Подведите ещё и энергию, иначе запас рабочей силы ' +
              'наполнится и машина встанет навсегда. Набранные сторонники принадлежат ' +
              'самой машине: снос теряет их всех.' },
      forecastMast: { title: 'Метеомачта',
        text: 'Мачта, у которой в запасе меньше одного предупреждения, молчит, ' +
              'поэтому подведите к ней провод заранее. Выключите её в инспекторе — ' +
              'она продолжит заряжаться, ничего не тратя, и так вы скопите ' +
              'несколько предупреждений впрок.' },

      rock2: { title: 'Метеорит',
        text: 'Упал метеорит. Голыми руками его не разбить: поставьте на него Рудокоп и подведите ' +
              'энергию и рабочую силу. Будут падать ещё.' },
      fuelPlant: { title: 'Плутоний',
        text: 'В Светотопи теперь падают плутониевые глыбы. Они светятся зелёным, и первая ' +
              'откроет Плутониевый копатель. У Космотралов и Ядерных реакторов на панели ' +
              'появился переключатель ТОПЛИВО.' },
      rare2: { title: 'Редкий метеорит',
        text: 'Этот редкий. Он меньше, но богаче: больше свинца, немного золота и никакой стали. ' +
              'Подведите провод и к золотому выходу Рудокопа.' },
      ciFalling: { title: 'Индекс Чистоты падает',
        text: 'Что-то из построенного тратит Индекс Чистоты быстрее, чем его дают ' +
              'остальные машины. Следите за числом слева вверху. Пока это длится, ' +
              'следующее открытие только отдаляется.' },
      tradePost: { title: 'Торговый пост',
        text: 'Он разгружается ровно с той скоростью, какую даёт ему бригада. Дайте ' +
              'меньше, чем он зарабатывает, и касса всё равно наполнится, а за ней ' +
              'встанет и всё, что в него идёт.' },
      incinerator: { title: 'Мусоросжигатель',
        text: 'Он сжигает ровно с той скоростью, какую даёт ему бригада. Дайте меньше, ' +
              'чем в него поступает, и куча всё равно вырастет, а за ней встанет и ' +
              'всё, что в него идёт.' },
      rubbleSorter: { title: 'Сортировщик обломков',
        text: 'Рабочие тянут выход к стеклу, энергия — к щебню. Если дать только одно из двух, его нужно вдвое больше, ' +
              'чтобы успевать.' },
      eddySeparator: { title: 'Вихревой разделитель',
        text: 'Недокормите его энергией — и перекос уйдёт в дешёвую сталь.' },
      fineSorter: { title: 'Тонкий сортировщик',
        text: 'Недокормите его рабочей силой — и перекос уйдёт в дешёвые органические отходы.' },
      hazardPlant: { title: 'Цех опасных отходов',
        text: '2 РС/ч превращают 3 кг/ч лёгкого мусора в 1 кг/ч опасных отходов, вчетверо дороже. ' +
              'Лёгкий мусор, который команда не покрыла, выходит через второй выход. Опасные отходы ' +
              'нельзя сжечь.' },
      cellAssembler: { title: 'Сборщик батарей',
        text: 'Ему нужны ТРИ вещи разом: 3 кг/ч алюминия, 1 кг/ч опасных отходов и 5 РС/ч. Все три ' +
              'дают 1 кг/ч батарей. Урежьте любое вдвое — выход упадёт вдвое.' },
      strikeVault: { title: 'Грозовой накопитель',
        text: 'Чаще всего он молчит: молния бьёт примерно раз в 20 минут. ' +
              'Каждый разряд разом отдаёт 80 кВт в ячейки, даже если грозозащита отвела его в землю. Во ' +
              'время разряда энергию никто не производит, поэтому пойманное выходит уже потом. Он ' +
              'один, и только там, где бывает погода.' },
      gridFoundry: { title: 'Энерголитейная',
        text: 'Каждый поднятый этой литейной массив делает следующий в ней дороже. ' +
              'Массивы принадлежат самой машине, поэтому её лучше перемещать, а не сносить.',
        extra: 'Её массивы строятся без предела.' },

      meteorBeacon: { title: 'Метеоритный маяк',
        text: 'Вызывает для вас метеорит. Чтобы вызвать, нужна энергия.' },
      depot: { title: 'Склад-стеллаж',
        text: 'Намного больше Склада материалов. Хранит три вида утиля.' },
      prioPowerSplitter: { title: 'Приоритетный делитель энергии',
        text: 'Одна сторона питается первой. Остаток идёт на другую.' },
      fibrePress: { title: 'Волоконный пресс',
        text: 'Волоконный пресс делает ровно ту же вторичную древесину, что и ' +
              'Лесовосстановитель, из 4 кг/ч органических отходов и 3 РС/ч.' },
      diamondPress: { title: 'Алмазный пресс',
        text: 'Сначала он наполняется древесным углём. Пока угля нет, он вообще не тянет ' +
              'энергию.' },
      printWorks: { title: 'Печатный цех',
        text: 'Сначала он набирает бумагу и материал и до этого не берёт энергию вовсе. ' +
              'Каждая следующая печать дороже предыдущей.' },
      oilGenerator: { title: 'Нефтяной генератор',
        text: 'Когда доход Индекса Чистоты не покрывает расход, генератор сжигает ' +
              'только ту долю, которую может оплатить, и пишет НЕ ХВАТАЕТ.' },
      treePlanter: { title: 'Садовник',
        text: 'Он встаёт, как только корзина полна, — нажмите СОБРАТЬ, чтобы он работал ' +
              'дальше.' },
    },
  };
  I.ru = RU;

  function visit(cb) {
    const c = C();
    if (!c) return;
    Object.keys(c.nodeTypes).forEach(function (id) {
      const t = c.nodeTypes[id];
      cb(t, 'name', 'node', id);
      cb(t, 'desc', 'node', id);

      cb(t, 'descMore', 'node', id);
      cb(t, 'doneName', 'node', id);
      cb(t, 'rareName', 'node', id);

      cb(t, 'spec', 'node', id);

      cb(t, 'why', 'node', id);
      ['in', 'out'].forEach(function (d) {
        (((t.ports || {})[d]) || []).forEach(function (p) { cb(p, 'label', 'label'); });
      });
      (t.virtualOut || []).forEach(function (p) { cb(p, 'label', 'label'); });
      if (t.collect) { cb(t.collect, 'label', 'label'); cb(t.collect, 'holdLabel', 'label'); }

      if (t.collectB) { cb(t.collectB, 'label', 'label'); cb(t.collectB, 'holdLabel', 'label'); }
      if (t.action) cb(t.action, 'label', 'label');

      if (t.overdrive) cb(t.overdrive, 'sunName', 'node', id);
    });
    Object.keys(c.resources).forEach(function (id) {
      const r = c.resources[id];
      cb(r, 'name', 'res', id);
      cb(r, 'rate', 'label'); cb(r, 'unit', 'label');
    });
    Object.keys(c.currencies).forEach(function (id) {
      cb(c.currencies[id], 'name', 'cur', id);

      cb(c.currencies[id], 'short', 'cur', id);
      cb(c.currencies[id], 'rate', 'cur', id);
    });

    (c.categories || []).forEach(function (x) {
      cb(x, 'name', 'cat', x.id); cb(x, 'sub', 'label');
    });
    (c.locations || []).forEach(function (x) {
      cb(x, 'name', 'loc', x.id); cb(x, 'desc', 'loc', x.id); cb(x, 'sub', 'loc', x.id);
    });
    (c.skills || []).forEach(function (x) {
      cb(x, 'name', 'skill', x.id); cb(x, 'desc', 'skill', x.id);
    });
    (c.objectives || []).forEach(function (x) {
      cb(x, 'name', 'goal', x.id); cb(x, 'desc', 'goal', x.id);
    });

    ((c.story || {}).acts || []).forEach(function (a) {
      cb(a, 'name', 'story', a.id);
      (a.steps || []).forEach(function (s) {
        cb(s, 'text', 'story', s.id); cb(s, 'why', 'story', s.id);
        cb(s, 'whyFull', 'story', s.id);
      });
    });
    (c.boosts || []).forEach(function (x) {
      cb(x, 'name', 'boost', x.id); cb(x, 'desc', 'boost', x.id);
    });
    ((c.weather || {}).events || []).forEach(function (x) {
      cb(x, 'name', 'wx', x.id); cb(x, 'desc', 'wx', x.id);
      cb(x, 'descPaid', 'wx', x.id);
      cb(x, 'descDay', 'wx', x.id);

      ['noteUp', 'noteDown', 'noteUpPaid', 'noteDownPaid', 'noteMore'].forEach(f => cb(x, f, 'wx', x.id));
    });

    const nw = (c.ui || {}).whatsNew;
    if (nw && nw.id) { cb(nw, 'title', 'news', nw.id); cb(nw, 'text', 'news', nw.id); }

    const tut = c.tutorial || {};
    (tut.steps || []).forEach(function (s) {
      cb(s, 'title', 'tut', s.id); cb(s, 'text', 'tut', s.id); cb(s, 'btn', 'tut', s.id);

      cb(s, 'quietTitle', 'tut', s.id); cb(s, 'quietText', 'tut', s.id);
      cb(s, 'textChosen', 'tut', s.id); cb(s, 'textDrag', 'tut', s.id);
      cb(s, 'textTouch', 'tut', s.id); cb(s, 'textDragMouse', 'tut', s.id);
      cb(s, 'keys', 'tut', s.id);

      (s.choices || []).forEach(function (ch, i) {
        cb(ch, 'desc', 'tut', s.id + '.choice' + i);
      });
    });
    (tut.hintList || []).forEach(function (h, i) {
      const k = h.id || h.node || ('hint' + i);
      cb(h, 'title', 'hint', k); cb(h, 'text', 'hint', k);

      cb(h, 'textTouch', 'hint', k); cb(h, 'textDrag', 'hint', k);

      cb(h, 'textNoMachine', 'hint', k);
      cb(h, 'textFull', 'hint', k);
      cb(h, 'textRows', 'hint', k);

      cb(h, 'keys', 'hint', k); cb(h, 'extra', 'hint', k); cb(h, 'rowTail', 'hint', k);
    });
  }

  let touched = null;
  function snapshot() {
    touched = [];
    visit(function (obj, field) {
      if (typeof obj[field] === 'string') touched.push([obj, field, obj[field]]);
    });
  }
  function restore() {
    if (touched) touched.forEach(function (t) { t[0][t[1]] = t[2]; });
  }

  function put(obj, field, kind, id) {
    if (typeof obj[field] !== 'string') return;
    if (kind === 'label') {
      const v = RU.label[obj[field]];
      if (v) obj[field] = v;
      return;
    }
    const row = RU[kind] && RU[kind][id];
    if (row && typeof row[field] === 'string') obj[field] = row[field];
  }

  I.missing = function () {
    const was = lang;
    I.setLang('en', true);
    const out = [];
    visit(function (obj, field, kind, id) {
      if (typeof obj[field] !== 'string' || !obj[field]) return;
      if (kind === 'label') { if (!RU.label[obj[field]]) out.push('label: ' + obj[field]); return; }
      const row = RU[kind] && RU[kind][id];
      if (!row || typeof row[field] !== 'string') out.push(kind + '.' + id + '.' + field);
    });
    I.setLang(was, true);
    return out;
  };

  I.resGen = function (id) {
    if (lang !== 'ru') return '';
    return (RU.resGen && RU.resGen[id]) || '';
  };

  I.refresh = function () {
    if (GG.sim && GG.sim.invalidate) GG.sim.invalidate();
    if (!GG.ui) return;
    if (GG.ui.refreshPalette) GG.ui.refreshPalette();
    if (GG.ui.buildTree) GG.ui.buildTree();
    if (GG.ui.buildPlaces) GG.ui.buildPlaces();
    if (GG.ui.syncLaunchers) GG.ui.syncLaunchers();
    if (GG.ui.relabel) GG.ui.relabel();
    if (GG.ui.rebuildInspector) GG.ui.rebuildInspector();
    if (GG.menu && GG.menu.isOpen && GG.menu.isOpen() && GG.menu.render) GG.menu.render();
  };

  I.setLang = function (id, quiet) {
    id = (id === 'ru') ? 'ru' : 'en';
    if (!touched) snapshot();
    restore();
    lang = id;
    if (id !== 'en') visit(put);
    try { document.documentElement.setAttribute('lang', id); } catch (e) {}
    if (!quiet) { save(); I.refresh(); }
    return lang;
  };

  function save() {
    try {
      const d = JSON.parse(localStorage.getItem(SET_KEY) || '{}') || {};
      d.lang = lang;
      localStorage.setItem(SET_KEY, JSON.stringify(d));
      if (GG.state && GG.state.mirror) GG.state.mirror(SET_KEY);
    } catch (e) {}
  }

  I.init = function () {
    let want = 'en';
    try {
      const d = JSON.parse(localStorage.getItem(SET_KEY) || 'null');
      if (d && d.lang) want = d.lang;
    } catch (e) {}
    I.setLang(want, true);
  };

  return I;
})();

GG.i18n.init();
