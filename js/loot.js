/* Генератор вещей: рамки (материал × узор), карточки, фоны, переливы имени, титулы, аватары, приколы и игрушки для питомцев,
   а ещё наборы сезонных сундуков: утро / день / вечер / ночь, Хэллоуин, Золотой дракон, супер-сундуки.
   Коды и редкость вещей такие же в server/worker.js (блок LOOT) — тест tests_js/server.test.js сверяет списки.
   Порядок в списках титулов и аватаров менять нельзя (код вещи = номер): новое — только в конец. */
const Loot = (() => {
  "use strict";

  /* ---------------------------------------------------------------- материалы: код, основа прилагательного, имя, светлый, средний, тёмный, акцент */
  const MATS = [
    ["ruby", "Рубинов", "Рубин", "#ffb3bd", "#e8203a", "#5a0610", "#fff0a0"], ["emerald", "Изумрудн", "Изумруд", "#b8ffd0", "#18b45a", "#063a1c", "#fff4b0"],
    ["sapphire", "Сапфиров", "Сапфир", "#b8d8ff", "#2a62e8", "#0a1a5a", "#e8f4ff"], ["amethyst", "Аметистов", "Аметист", "#e8c8ff", "#9a4ae8", "#2e0a5a", "#ffd0f8"],
    ["topaz", "Топазов", "Топаз", "#fff0b0", "#ffb020", "#6a3a00", "#ffffff"], ["obsidian", "Обсидианов", "Обсидиан", "#8a8aa0", "#2a2a38", "#08080c", "#b06aff"],
    ["pearl", "Жемчужн", "Жемчуг", "#ffffff", "#e8e2f0", "#9a90b0", "#ffb8e0"], ["coral", "Кораллов", "Коралл", "#ffd0c0", "#ff6a50", "#7a1a10", "#fff0d0"],
    ["mint", "Мятн", "Мята", "#d8fff0", "#5ae8b8", "#0a5a44", "#ffffff"], ["lilac", "Сиренев", "Сирень", "#f0e0ff", "#c09af0", "#4a2a7a", "#fff0ff"],
    ["copper", "Медн", "Медь", "#ffc8a0", "#c8682a", "#4a1a06", "#ffe0b0"], ["bronze", "Бронзов", "Бронза", "#f0d0a0", "#a8743a", "#3a2408", "#fff0c0"],
    ["chrome", "Хромов", "Хром", "#ffffff", "#b8c4d4", "#3a4454", "#8ae0ff"], ["jade", "Нефритов", "Нефрит", "#c8f0d8", "#4aa87a", "#123a24", "#f0fff0"],
    ["amber", "Янтарн", "Янтарь", "#ffe0a0", "#ff9a1a", "#5a2a00", "#fff4c0"], ["ash", "Пепельн", "Пепел", "#e0e0e0", "#8a8a8a", "#2a2a2a", "#ff5a3a"],
    ["cherry", "Вишнёв", "Вишня", "#ffb0c8", "#b8103a", "#3a0012", "#ffd0e0"], ["lime", "Лаймов", "Лайм", "#f0ffb0", "#a8e81a", "#2a4a00", "#ffffff"],
    ["sky", "Небесн", "Небо", "#e0f4ff", "#6ac0ff", "#12407a", "#ffffff"], ["sunset", "Закатн", "Закат", "#ffe0a0", "#ff6a3a", "#4a0a3a", "#ffd23f"],
    ["toxic", "Кислотн", "Кислота", "#e0ffa0", "#7aff1a", "#0a3a00", "#ff2bd6"], ["cocoa", "Шоколадн", "Шоколад", "#e0b890", "#7a4a28", "#2a1206", "#ffd8a0"],
    ["ink", "Чернильн", "Чернила", "#a0b0ff", "#2a3a9a", "#050820", "#ffffff"], ["rose", "Розов", "Роза", "#ffe0ec", "#ff7aac", "#7a1a44", "#ffffff"],
  ];
  const END = { m: "ый", f: "ая", n: "ое", p: "ые" };
  const adj = (stem, g) => stem + END[g];
  // узоры рамок: код, имя, род, редкость, кадров анимации, длительность круга
  const PATS = [["edge", "грань", "f", 0], ["braid", "плетение", "n", 0], ["check", "клетка", "f", 0], ["dots", "россыпь", "f", 0],
    ["rhomb", "ромбы", "p", 1], ["scale", "чешуя", "f", 1], ["lace", "кружево", "n", 1], ["stars", "звёзды", "p", 1, 4, 1.2], ["rope", "канат", "m", 1],
    ["spikes", "шипы", "p", 2], ["wave", "волна", "f", 2, 6, 1.2], ["pulse", "пульс", "m", 2, 4, .8], ["gem", "огранка", "f", 2, 4, 1],
    ["flame", "пламя", "n", 3, 4, .6], ["vortex", "вихрь", "m", 3, 6, 1], ["aura", "аура", "f", 3, 6, 1.4]];
  // пейзажи для фонов: код, имя, род, редкость
  const SCENES = [["hills", "холмы", "p", 0], ["sea", "море", "n", 0], ["peaks", "горы", "p", 1], ["city", "город", "m", 1], ["sky", "небо", "n", 2]];
  const PRICE = [80, 200, 450, 900];                       // «цена» — только чтобы вещь считалась выбиваемой (в лавке не продаётся)

  // титулы: текст и редкость (0 обычный … 3 легендарный). Код — "t" + номер
  const TITLES = ("Душа вечеринки|Тихоня|Любитель пиццы|Король дивана|Вечный новичок|Мастер угадайки|Просто зашёл|Ночной перекус|Главный по чаю|Капитан Очевидность|"
    + "Чемпион по зевоте|Ловец удачи|Кот в мешке|Добрый сосед|Вечно в пути|Мистер Пунктуальность|Хранитель пульта|Повелитель мемов|Шутник|Весельчак|Ворчун|Соня|"
    + "Оптимист|Пессимист|Реалист|Мечтатель|Болтун|Молчун|Фантазёр|Лентяй со стажем|Ценитель котиков|Друг собак|Любитель печенек|Мастер обнимашек|Кофеман|"
    + "Сладкоежка|Чайный гуру|Странник|Турист|Новенький|Старожил|Местный|Гость из будущего|Человек-загадка|Тот самый|Просто красавчик|Солнышко|Зайка|Котик|"
    + "Пёсик|Рыбка|Птичка|Ёжик в тумане|Морковка|Пельмешек|Плюшка|Булочка|Блинчик|Пончик|Кексик").split("|").map((t) => [t, 0])
    .concat(("Гроза района|Хитрый лис|Серый кардинал|Мастер интриг|Ловкач|Тёмная лошадка|Шахматист|Стратег|Тактик|Аналитик|Провидец|Сыщик|Агент 007|Тайный агент|"
    + "Двойной агент|Информатор|Свидетель|Присяжный|Судья|Адвокат|Прокурор|Комиссар|Инспектор|Шериф|Ковбой|Пират|Корсар|Капитан|Штурман|Боцман|Рыцарь|"
    + "Оруженосец|Паладин|Лучник|Маг-недоучка|Алхимик|Бард|Менестрель|Трубадур|Скоморох|Фокусник|Иллюзионист|Акробат|Укротитель|Дрессировщик питомцев|"
    + "Заводчик|Ветеринар|Кормилец|Нянька|Садовник").split("|").map((t) => [t, 1]))
    .concat(("Гроссмейстер|Король покера|Человек без лица|Неуловимый|Хамелеон|Мастер маскировки|Игрок с большой буквы|Кукловод|Дирижёр хаоса|Повелитель случая|"
    + "Любимчик фортуны|Барон|Граф|Герцог|Князь|Маркиз|Виконт|Магистр|Архимаг|Чародей|Некромант|Охотник за головами|Наёмник|Ассасин|Ниндзя|Самурай|Сёгун|"
    + "Викинг|Берсерк|Друид").split("|").map((t) => [t, 2]))
    .concat("Император|Владыка|Титан|Феникс|Легенда арены|Непобедимый|Абсолют|Всевидящий|Бог рандома|Хозяин судьбы|Последний герой|Избранный".split("|").map((t) => [t, 3]));
  // аватары-эмодзи: код — "e" + номер
  const AVAS = [..."🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🐔🐧🐦🐤🦆🐺🐗🐴🐝🐛🦋🐌🐞🐢🐙🦑🦀🐡🐠🐬🐳🦭🐊🦒🦓🦔🦥🦦🦨🦘🦡"].map((e) => [e, 0])
    .concat(["🍕", "🍔", "🍟", "🌭", "🍿", "🍩", "🍪", "🎂", "🍰", "🧁", "🍫", "🍬", "🍭", "🍓", "🍉", "🍒", "🥑", "🌶️", "🍄", "🌵", "🌻", "🌈", "⛄", "🔥", "💧", "🌪️",
      "🎸", "🎺", "🎻", "🥁", "🎮", "🕹️", "🎲", "🧩", "🪀", "🎯"].map((e) => [e, 1]))
    .concat(["🤖", "🤠", "🥷", "🧜", "🧚", "🧝", "🦸", "🎅", "🤶", "🧑‍🚀", "🧑‍🎤", "🕵️", "👑", "💎", "🗿"].map((e) => [e, 2]))
    .concat(["🎭", "🪄", "🧿", "🫅", "🏆"].map((e) => [e, 3]));
  const AVA_NAMES = { "🐶": "Щенок", "🐱": "Котёнок", "🐭": "Мышонок", "🐹": "Хомяк", "🐰": "Кролик", "🦊": "Лиса", "🐻": "Медведь", "🐼": "Панда", "🐨": "Коала", "🐯": "Тигр",
    "🦁": "Лев", "🐮": "Бурёнка", "🐷": "Хрюша", "🐸": "Лягушка", "🐵": "Обезьянка", "🐔": "Курица", "🐧": "Пингвин", "🐦": "Птичка", "🐤": "Цыплёнок", "🦆": "Утка",
    "🐺": "Волк", "🐗": "Кабан", "🐴": "Лошадка", "🐝": "Пчела", "🐛": "Гусеница", "🦋": "Бабочка", "🐌": "Улитка", "🐞": "Божья коровка", "🐢": "Черепаха", "🐙": "Осьминог",
    "🦑": "Кальмар", "🦀": "Краб", "🐡": "Рыба-ёж", "🐠": "Рыбка", "🐬": "Дельфин", "🐳": "Кит", "🦭": "Тюлень", "🐊": "Крокодил", "🦒": "Жираф", "🦓": "Зебра", "🦔": "Ёжик",
    "🦥": "Ленивец", "🦦": "Выдра", "🦨": "Скунс", "🦘": "Кенгуру", "🦡": "Барсук", "🍕": "Пицца", "🍔": "Бургер", "🍟": "Картошка фри", "🌭": "Хот-дог", "🍿": "Попкорн",
    "🍩": "Пончик", "🍪": "Печенька", "🎂": "Торт", "🍰": "Пирожное", "🧁": "Капкейк", "🍫": "Шоколадка", "🍬": "Конфета", "🍭": "Леденец", "🍓": "Клубника", "🍉": "Арбуз",
    "🍒": "Вишенки", "🥑": "Авокадо", "🌶️": "Перчик", "🍄": "Мухомор", "🌵": "Кактус", "🌻": "Подсолнух", "🌈": "Радуга", "⛄": "Снеговик-2", "🔥": "Огонёк", "💧": "Капля",
    "🌪️": "Смерч", "🎸": "Гитара", "🎺": "Труба", "🎻": "Скрипка", "🥁": "Барабан", "🎮": "Геймпад", "🕹️": "Джойстик", "🎲": "Кубик", "🧩": "Пазл", "🪀": "Йо-йо", "🎯": "Мишень",
    "🤖": "Робот", "🤠": "Ковбой", "🥷": "Ниндзя", "🧜": "Русал", "🧚": "Фея", "🧝": "Эльф", "🦸": "Супергерой", "🎅": "Дед Мороз", "🤶": "Снегурочка", "🧑‍🚀": "Космонавт",
    "🧑‍🎤": "Рок-звезда", "🕵️": "Детектив", "👑": "Корона", "💎": "Бриллиант", "🗿": "Истукан", "🎭": "Маски", "🪄": "Волшебная палочка", "🧿": "Оберег", "🫅": "Монарх", "🏆": "Кубок" };

  // приколы на голову и игрушки «Питомника» (сверх старых — те в js/pets.js). Рисунки шапок — ниже, HAT_ART
  const ZOO_HATS = [["wreath", "Венок", 0], ["beanie", "Шапка-бини", 0], ["frog", "Шапка-лягушка", 0], ["cowboy", "Ковбойская шляпа", 1], ["headphones", "Наушники", 1],
    ["santa", "Колпак Деда Мороза", 1], ["pirate", "Треуголка", 2], ["wizard", "Шляпа волшебника", 2], ["antlers", "Оленьи рога", 2], ["unicorn", "Рог единорога", 3]];
  const ZOO_TOYS = [["carrot", "Морковка", "🥕", 0], ["donut", "Пончик-пищалка", "🍩", 0], ["balloon", "Шарик", "🎈", 0], ["drum", "Барабан", "🥁", 1], ["dice", "Кубик", "🎲", 1],
    ["puzzle", "Пазл", "🧩", 1], ["robot", "Робот", "🤖", 2], ["guitar", "Гитарка", "🎸", 2], ["saucer", "Летающая тарелка", "🛸", 3]];

  /* ---------------------------------------------------------------- сезонные сундуки (новые; старые четыре — в js/shop.js)
     when: dawn 6–11, noon 11–17, dusk 17–22, night 22–6 по Москве; any — в случайное время; super — очень редко, три рулетки сразу.
     Вещь: [раздел, код, имя, редкость, доп.]. Рамка: pat — узор, pal — [светлый, средний, тёмный, акцент], emb — значок сверху */
  const P = (l, m, d, a) => [l, m, d, a];
  const SETS = [
    { key: "s_dawn", name: "Рассвет", emoji: "🌅", when: "dawn", price: 350, w: [50, 30, 15, 5], color: "#ffb36a", desc: "Только утром: роса, первые лучи и сонные петухи", items: [
      ["title", "x_dawn1", "Ранняя пташка", 0, { text: "Ранняя пташка" }], ["title", "x_dawn2", "Кто рано встаёт", 1, { text: "Кто рано встаёт" }],
      ["ava", "x_dawn1", "Петушок", 0, { emoji: "🐓" }], ["ava", "x_dawn2", "Утро в горах", 1, { emoji: "🌄" }],
      ["frame", "x_dawn1", "Утренняя роса", 1, { pat: "lace", pal: P("#ffffff", "#a8e0ff", "#2a5a8a", "#ffe8f0"), emb: "drop" }],
      ["frame", "x_dawn2", "Первый луч", 2, { pat: "wave", pal: P("#fff4d0", "#ffb36a", "#8a3a2a", "#ffffff"), emb: "sun" }],
      ["frame", "x_dawn3", "Восход", 3, { pat: "aura", pal: P("#fff0f4", "#ff9ab8", "#6a1a4a", "#ffe066"), emb: "sun" }],
      ["bg", "x_dawn", "Рассвет над холмами", 1, { scene: "hills", pal: P("#ffd0a0", "#ff8a6a", "#4a2a5a", "#fff4b0") }],
      ["style", "x_dawn", "Утренняя карта", 2, { kind: "foil", pal: P("#fff0d8", "#ff9a6a", "#5a2a4a", "#ffe066") }],
      ["fx", "x_dawn", "Рассветное имя", 2, { pal: P("#ffe066", "#ff9ab8", "#ff6a3a", "#ffffff") }],
      ["hat", "sunhat", "Панамка", 0], ["hat", "sunflower", "Подсолнух", 1], ["toy", "croissant", "Круассан", 0, { emoji: "🥐" }], ["toy", "alarm", "Будильник", 1, { emoji: "⏰" }]] },
    { key: "s_noon", name: "Полдень", emoji: "☀️", when: "noon", price: 350, w: [50, 30, 15, 5], color: "#ffd23f", desc: "Только днём: зной, море и солнечные зайчики", items: [
      ["title", "x_noon1", "Солнечный зайчик", 0, { text: "Солнечный зайчик" }], ["title", "x_noon2", "Хозяин полудня", 1, { text: "Хозяин полудня" }],
      ["ava", "x_noon1", "Крутой", 0, { emoji: "😎" }], ["ava", "x_noon2", "Солнце", 1, { emoji: "🌞" }],
      ["frame", "x_noon1", "Зной", 1, { pat: "pulse", pal: P("#fffbe0", "#ffd23f", "#b86a10", "#ffffff"), emb: "sun" }],
      ["frame", "x_noon2", "Полуденный блеск", 2, { pat: "gem", pal: P("#ffffff", "#fff0a0", "#c8900a", "#3ec8ff"), emb: "sun" }],
      ["frame", "x_noon3", "Солнечный круг", 3, { pat: "vortex", pal: P("#fff8c0", "#ffc21a", "#a84a00", "#ffffff"), emb: "sun" }],
      ["bg", "x_noon", "Полдень у моря", 1, { scene: "sea", pal: P("#bfefff", "#3ac0ff", "#0a4a7a", "#ffe066") }],
      ["style", "x_noon", "Пляжная карта", 2, { kind: "foil", pal: P("#fffbe0", "#ffc21a", "#1a6a9a", "#ffffff") }],
      ["fx", "x_noon", "Солнечное имя", 2, { pal: P("#ffe066", "#ffffff", "#ffb020", "#ffe066") }],
      ["hat", "cap", "Кепка", 0], ["hat", "shades", "Очки на лбу", 1], ["toy", "icecream", "Мороженое", 0, { emoji: "🍦" }], ["toy", "beachball", "Пляжный мяч", 1, { emoji: "🏐" }]] },
    { key: "s_dusk", name: "Закат", emoji: "🌇", when: "dusk", price: 350, w: [50, 30, 15, 5], color: "#ff6a3a", desc: "Только вечером: сумерки, фламинго и огни города", items: [
      ["title", "x_dusk1", "Закатный странник", 0, { text: "Закатный странник" }], ["title", "x_dusk2", "Хозяин вечера", 1, { text: "Хозяин вечера" }],
      ["ava", "x_dusk1", "Вечерний город", 0, { emoji: "🌆" }], ["ava", "x_dusk2", "Фламинго", 1, { emoji: "🦩" }],
      ["frame", "x_dusk1", "Сумерки", 1, { pat: "lace", pal: P("#ffd0a0", "#a05aa0", "#2a0a3a", "#ffe066"), emb: "star" }],
      ["frame", "x_dusk2", "Багровый закат", 2, { pat: "wave", pal: P("#ffe0a0", "#ff5a3a", "#3a0a2a", "#ffd23f"), emb: "sun" }],
      ["frame", "x_dusk3", "Последний луч", 3, { pat: "aura", pal: P("#ffe8c0", "#ff7a4a", "#4a0a3a", "#ff9ad0"), emb: "sun" }],
      ["bg", "x_dusk", "Город на закате", 1, { scene: "city", pal: P("#ffb36a", "#c84a6a", "#2a0a3a", "#ffe066") }],
      ["style", "x_dusk", "Вечерняя карта", 2, { kind: "foil", pal: P("#ffd0a0", "#c84a6a", "#2a0a3a", "#ffe066") }],
      ["fx", "x_dusk", "Закатное имя", 2, { pal: P("#ffd23f", "#ff6a3a", "#c84ad0", "#ffd23f") }],
      ["hat", "beret", "Берет", 0], ["hat", "fedora", "Шляпа детектива", 1], ["toy", "marshmallow", "Зефирки", 0, { emoji: "🍡" }], ["toy", "candle", "Свечка", 1, { emoji: "🕯️" }]] },
    { key: "s_night", name: "Полночь", emoji: "🌙", when: "night", price: 350, w: [45, 32, 17, 6], color: "#7a6aff", desc: "Только ночью: луна, совы и рамки, которых днём не достать", items: [
      ["title", "x_night1", "Ночной дозор", 0, { text: "Ночной дозор" }], ["title", "x_night2", "Повелитель полуночи", 1, { text: "Повелитель полуночи" }],
      ["title", "x_night3", "Тот, кто не спит", 2, { text: "Тот, кто не спит" }],
      ["ava", "x_night1", "Сова", 0, { emoji: "🦉" }], ["ava", "x_night2", "Млечный путь", 1, { emoji: "🌌" }], ["ava", "x_night3", "Месяц", 2, { emoji: "🌙" }],
      ["frame", "x_night1", "Лунный свет", 1, { pat: "lace", pal: P("#ffffff", "#b8c8ff", "#1a2050", "#fff4b0"), emb: "moon" }],
      ["frame", "x_night2", "Ночная мгла", 2, { pat: "pulse", pal: P("#c8d0ff", "#4a4ad0", "#05051a", "#ffffff"), emb: "moon" }],
      ["frame", "x_night3", "Звёздная ночь", 2, { pat: "stars", pal: P("#fff4b0", "#3a3aa0", "#05051a", "#ffffff"), emb: "moon" }],
      ["frame", "x_night4", "Полночь", 3, { pat: "vortex", pal: P("#d8d0ff", "#5a3ae0", "#05031a", "#ffe066"), emb: "moon" }],
      ["bg", "x_night", "Звёздное небо", 2, { scene: "sky", pal: P("#4a4ad0", "#1a1a6a", "#05051a", "#fff4b0") }],
      ["style", "x_night", "Ночная карта", 3, { kind: "foil", pal: P("#c8d0ff", "#3a3aa0", "#05051a", "#fff4b0") }],
      ["fx", "x_night", "Лунное имя", 2, { pal: P("#ffffff", "#b8c8ff", "#7a6aff", "#ffffff") }],
      ["hat", "nightcap", "Ночной колпак", 0], ["hat", "moonhat", "Полумесяц", 2], ["toy", "moontoy", "Лунный мячик", 1, { emoji: "🌙" }], ["toy", "owl", "Плюшевая сова", 2, { emoji: "🦉" }]] },
    { key: "s_halloween", name: "Хэллоуин", emoji: "🎃", when: "any", price: 450, w: [45, 32, 17, 6], color: "#ff7a18", desc: "Тыквы, ведьмы, призраки — для тебя и для питомцев", items: [
      ["title", "x_hw1", "Ведьмин подмастерье", 0, { text: "Ведьмин подмастерье" }], ["title", "x_hw2", "Тыквенный король", 1, { text: "Тыквенный король" }],
      ["title", "x_hw3", "Ночь всех святых", 1, { text: "Ночь всех святых" }], ["title", "x_hw4", "Призрак Настолкино", 2, { text: "Призрак Настолкино" }],
      ["ava", "x_hw1", "Тыква", 0, { emoji: "🎃" }], ["ava", "x_hw2", "Привидение", 0, { emoji: "👻" }], ["ava", "x_hw3", "Паутина", 0, { emoji: "🕸️" }],
      ["ava", "x_hw4", "Вампир", 1, { emoji: "🧛" }], ["ava", "x_hw5", "Зомби", 1, { emoji: "🧟" }], ["ava", "x_hw6", "Ведьма", 2, { emoji: "🧙‍♀️" }],
      ["frame", "x_hw1", "Тыквенная лоза", 1, { pat: "braid", pal: P("#ffd08a", "#ff7a18", "#1a2a06", "#5ac83a"), emb: "pumpkin" }],
      ["frame", "x_hw2", "Паучье логово", 1, { pat: "lace", pal: P("#e0e0f0", "#6a6a80", "#0a0a14", "#a05bff"), emb: "spider" }],
      ["frame", "x_hw3", "Летучие мыши", 2, { pat: "stars", pal: P("#ffb060", "#4a1a6a", "#0a0414", "#ff7a18"), emb: "bat" }],
      ["frame", "x_hw4", "Ведьмин котёл", 2, { pat: "pulse", pal: P("#c8ff9a", "#3ac83a", "#0a1a06", "#a05bff"), emb: "pumpkin" }],
      ["frame", "x_hw5", "Призрачный огонь", 3, { pat: "flame", pal: P("#e0ffd0", "#5aff6a", "#06200a", "#c86aff"), emb: "skull" }],
      ["frame", "x_hw6", "Ночь тыкв", 3, { pat: "vortex", pal: P("#ffd08a", "#ff7a18", "#120604", "#ffe066"), emb: "pumpkin" }],
      ["bg", "x_hw1", "Тыквенное поле", 1, { scene: "hills", pal: P("#ff9a3a", "#5a1a6a", "#0a0414", "#ff7a18") }],
      ["bg", "x_hw2", "Город-призрак", 2, { scene: "city", pal: P("#7aff8a", "#2a1a4a", "#05020a", "#ffb020") }],
      ["style", "x_hw1", "Тыквенная карта", 2, { kind: "foil", pal: P("#ffd08a", "#ff7a18", "#1a0a04", "#5ac83a") }],
      ["style", "x_hw2", "Гримуар", 3, { kind: "foil", pal: P("#d0ffc0", "#4a1a6a", "#05020a", "#7aff6a") }],
      ["fx", "x_hw1", "Тыквенное имя", 1, { pal: P("#ffb020", "#ff7a18", "#ffe066", "#ff7a18") }],
      ["fx", "x_hw2", "Призрачное зелёное", 2, { pal: P("#c8ff9a", "#5aff6a", "#c86aff", "#c8ff9a") }],
      ["hat", "batbow", "Бантик-мышка", 0], ["hat", "witch", "Ведьмин колпак", 1], ["hat", "horns", "Рожки чертёнка", 1], ["hat", "pumpkinhead", "Тыква на голове", 2],
      ["hat", "reaper", "Капюшон жнеца", 3],
      ["toy", "candy", "Ведёрко конфет", 0, { emoji: "🍬" }], ["toy", "ghost", "Призрачок", 1, { emoji: "👻" }], ["toy", "spider", "Паучок на резинке", 1, { emoji: "🕷️" }],
      ["toy", "skull", "Черепушка", 2, { emoji: "💀" }], ["toy", "potion", "Зелье", 2, { emoji: "🧪" }]] },
    { key: "s_cosmos", name: "Космическая сокровищница", emoji: "🌌", when: "super", triple: true, price: 2500, w: [0, 20, 45, 35], color: "#a05bff",
      desc: "Супер-редкий: появляется очень редко и даёт сразу ТРИ вещи", items: [
      ["title", "x_cos1", "Пришелец", 1, { text: "Пришелец" }], ["title", "x_cos2", "Звёздный странник", 2, { text: "Звёздный странник" }],
      ["title", "x_cos3", "Покоритель галактик", 3, { text: "Покоритель галактик" }],
      ["ava", "x_cos1", "Гуманоид", 1, { emoji: "👽" }], ["ava", "x_cos2", "Спутник", 1, { emoji: "🛰️" }], ["ava", "x_cos3", "Сатурн", 2, { emoji: "🪐" }],
      ["ava", "x_cos4", "Падающая звезда", 2, { emoji: "🌠" }], ["ava", "x_cos5", "Комета", 3, { emoji: "☄️" }],
      ["frame", "x_cos1", "Млечный путь", 2, { pat: "stars", pal: P("#ffffff", "#6a4ad0", "#0a041a", "#7ae0ff"), emb: "star" }],
      ["frame", "x_cos2", "Туманность", 2, { pat: "wave", pal: P("#ffc8f0", "#a05bff", "#14062a", "#7ae0ff"), emb: "comet" }],
      ["frame", "x_cos3", "Кольца Сатурна", 2, { pat: "pulse", pal: P("#ffe8c0", "#c8904a", "#1a0a2a", "#ffffff"), emb: "planet" }],
      ["frame", "x_cos4", "Сверхновая", 3, { pat: "aura", pal: P("#ffffff", "#ff7ae0", "#1a0430", "#7ae0ff"), emb: "comet" }],
      ["frame", "x_cos5", "Чёрная дыра", 3, { pat: "vortex", pal: P("#ffb0f0", "#6a2ad0", "#000000", "#ffe066"), emb: "eye" }],
      ["bg", "x_cos1", "Неизвестная планета", 2, { scene: "peaks", pal: P("#ff9ae0", "#6a2ad0", "#0a041a", "#7ae0ff") }],
      ["bg", "x_cos2", "Галактика", 3, { scene: "sky", pal: P("#a05bff", "#2a0a5a", "#05020f", "#ffffff") }],
      ["style", "x_cos", "Звёздная карта", 3, { kind: "foil", pal: P("#ffc8f0", "#6a2ad0", "#05020f", "#7ae0ff") }],
      ["fx", "x_cos", "Космос", 3, { pal: P("#7ae0ff", "#ff7ae0", "#a05bff", "#7ae0ff") }],
      ["hat", "antennae", "Антенны", 1], ["hat", "ufohat", "НЛО на голове", 2], ["hat", "astro", "Шлем космонавта", 3],
      ["toy", "comet", "Хвостатая комета", 2, { emoji: "☄️" }], ["toy", "planet", "Планетка", 2, { emoji: "🪐" }], ["toy", "satellite", "Спутник", 3, { emoji: "🛰️" }]] },
    { key: "s_olymp", name: "Сокровище богов", emoji: "🏛️", when: "super", triple: true, price: 3000, w: [0, 15, 45, 40], color: "#ffe066",
      desc: "Супер-редкий: дары Олимпа, сразу ТРИ вещи за одно открытие", items: [
      ["title", "x_ol1", "Герой мифов", 1, { text: "Герой мифов" }], ["title", "x_ol2", "Полубог", 2, { text: "Полубог" }],
      ["title", "x_ol3", "Избранник Олимпа", 2, { text: "Избранник Олимпа" }], ["title", "x_ol4", "Громовержец", 3, { text: "Громовержец" }],
      ["ava", "x_ol1", "Храм", 1, { emoji: "🏛️" }], ["ava", "x_ol2", "Молния", 1, { emoji: "⚡" }], ["ava", "x_ol3", "Амфора", 2, { emoji: "🏺" }],
      ["ava", "x_ol4", "Трезубец", 2, { emoji: "🔱" }], ["ava", "x_ol5", "Единорог", 3, { emoji: "🦄" }],
      ["frame", "x_ol1", "Лавровый венок", 2, { pat: "braid", pal: P("#f0ffc0", "#7ab83a", "#1a3a06", "#ffe066"), emb: "crown" }],
      ["frame", "x_ol2", "Амброзия", 2, { pat: "gem", pal: P("#ffffff", "#ffe0f0", "#a06a8a", "#ffd23f"), emb: "crown" }],
      ["frame", "x_ol3", "Молния Зевса", 3, { pat: "pulse", pal: P("#ffffff", "#7ae0ff", "#0a1a4a", "#ffe066"), emb: "bolt" }],
      ["frame", "x_ol4", "Золотое руно", 3, { pat: "scale", pal: P("#fff8c0", "#ffc21a", "#7a4a00", "#ffffff"), emb: "crown" }],
      ["frame", "x_ol5", "Олимп", 3, { pat: "aura", pal: P("#ffffff", "#fff0a0", "#a88a3a", "#7ae0ff"), emb: "crown" }],
      ["bg", "x_ol1", "Храм на холме", 2, { scene: "city", pal: P("#fff4d0", "#e8c890", "#3a2a1a", "#ffe066") }],
      ["bg", "x_ol2", "Гора Олимп", 3, { scene: "peaks", pal: P("#fff8e0", "#c8b8ff", "#2a2050", "#ffe066") }],
      ["style", "x_ol", "Скрижаль богов", 3, { kind: "foil", pal: P("#fff8e0", "#e8c890", "#3a2a1a", "#ffd23f") }],
      ["fx", "x_ol", "Божественное", 3, { pal: P("#ffffff", "#ffe066", "#7ae0ff", "#ffffff") }],
      ["hat", "laurel", "Лавровый венок", 2], ["hat", "helmet", "Шлем Афины", 3], ["hat", "glory", "Сияние богов", 3],
      ["toy", "goldapple", "Золотое яблоко", 2, { emoji: "🍎" }], ["toy", "lyre", "Лира", 2, { emoji: "🪕" }], ["toy", "trident", "Трезубец", 3, { emoji: "🔱" }]] },
  ];
  // добавки к старым сезонным сундукам (дракон — сильно разнообразнее, остальным — вещи для питомцев и новые рамки)
  const EXTRA = {
    s_dragon: [
      ["frame", "x_dr1", "Облачный путь", 0, { pat: "braid", pal: P("#ffffff", "#ffd0d0", "#8a1018", "#ffd23f"), emb: "cloud" }],
      ["frame", "x_dr2", "Фонарики", 1, { pat: "dots", pal: P("#ffe066", "#e8202a", "#4a0408", "#ffd23f"), emb: "lantern" }],
      ["frame", "x_dr3", "Огненная чешуя", 2, { pat: "scale", pal: P("#ffe066", "#e8202a", "#3a0206", "#ffffff"), emb: "dragon" }],
      ["frame", "x_dr4", "Нефритовый дракон", 3, { pat: "wave", pal: P("#d8ffe0", "#2ab86a", "#04240e", "#ffd23f"), emb: "dragon" }],
      ["title", "x_dr1", "Мастер кунг-фу", 0, { text: "Мастер кунг-фу" }], ["title", "x_dr2", "Танцующий с драконом", 1, { text: "Танцующий с драконом" }],
      ["title", "x_dr3", "Хранитель жемчужины", 2, { text: "Хранитель жемчужины" }],
      ["ava", "x_dr1", "Красный конверт", 0, { emoji: "🧧" }], ["ava", "x_dr2", "Лунный пряник", 1, { emoji: "🥮" }], ["ava", "x_dr3", "Куклы", 1, { emoji: "🎎" }],
      ["ava", "x_dr4", "Красный дракон", 2, { emoji: "🀄" }],
      ["bg", "x_dr1", "Улица фонарей", 1, { scene: "city", pal: P("#ff5a3a", "#8a1018", "#1a0204", "#ffd23f") }],
      ["bg", "x_dr2", "Нефритовые горы", 2, { scene: "peaks", pal: P("#d8ffe0", "#4aa87a", "#0a2a14", "#ffd23f") }],
      ["style", "x_dr", "Нефритовая печать", 3, { kind: "foil", pal: P("#d8ffe0", "#2ab86a", "#04240e", "#ffd23f") }],
      ["fx", "x_dr", "Нефритовое имя", 2, { pal: P("#d8ffe0", "#2ab86a", "#ffd23f", "#d8ffe0") }],
      ["hat", "douli", "Соломенная шляпа", 0], ["hat", "dlantern", "Фонарик на голове", 1], ["hat", "dhorns", "Рога дракона", 2], ["hat", "dcrown", "Корона Императора", 3],
      ["toy", "lantern", "Фонарик", 0, { emoji: "🏮" }], ["toy", "dumpling", "Пельмешек", 0, { emoji: "🥟" }], ["toy", "firework", "Хлопушка", 1, { emoji: "🧨" }],
      ["toy", "fan", "Веер", 1, { emoji: "🪭" }], ["toy", "dpearl", "Жемчужина дракона", 3, { emoji: "🔮" }]],
    s_ice: [["frame", "x_ice1", "Иней", 1, { pat: "lace", pal: P("#ffffff", "#bfefff", "#2a5a8a", "#ffffff"), emb: "snow" }],
      ["frame", "x_ice2", "Вьюга", 2, { pat: "wave", pal: P("#ffffff", "#8ad8ff", "#0a2a5a", "#e8fbff"), emb: "snow" }],
      ["hat", "snowcap", "Снежная шапка", 1], ["toy", "snowball", "Снежок", 0, { emoji: "❄️" }], ["toy", "skates", "Коньки", 2, { emoji: "⛸️" }]],
    s_moon: [["frame", "x_moon1", "Клыкастая", 1, { pat: "spikes", pal: P("#ffd0d0", "#8a0a14", "#1a0204", "#ffffff"), emb: "moon" }],
      ["frame", "x_moon2", "Вой на луну", 2, { pat: "pulse", pal: P("#ffe0e0", "#c8101e", "#14020a", "#ffe066"), emb: "moon" }],
      ["hat", "fangs", "Клыки вампира", 1], ["toy", "bloodbag", "Пакет «сока»", 1, { emoji: "🩸" }], ["toy", "garlic", "Чесночок", 0, { emoji: "🧄" }]],
    s_neon: [["frame", "x_neon1", "Пиксельный шум", 1, { pat: "check", pal: P("#ff9af0", "#ff2bd6", "#14001e", "#43f0ff"), emb: "eye" }],
      ["frame", "x_neon2", "Кибер-пульс", 2, { pat: "pulse", pal: P("#c8ffff", "#00e5ff", "#05001a", "#ff2bd6"), emb: "bolt" }],
      ["hat", "visor", "Кибер-визор", 2], ["toy", "chip", "Микросхема", 1, { emoji: "💾" }], ["toy", "drone", "Мини-дрон", 2, { emoji: "🛸" }]],
  };

  /* ---------------------------------------------------------------- список вещей */
  const I = (cat, id, name, tier, extra) => Object.assign({ cat, id, name, tier, price: PRICE[tier] }, extra || {});
  function items() {
    const out = [];
    for (const [pk, pn, pg, pt, strip, speed] of PATS) for (const [mk, ms] of MATS)
      out.push(I("frame", `g_${pk}_${mk}`, `${adj(ms, pg)} ${pn}`, pt, strip ? { strip, speed, gen: 1 } : { gen: 1 }));
    for (const [mk, ms, mn] of MATS) { out.push(I("style", "k_" + mk, `${adj(ms, "f")} карта`, 1, { gen: 1, desc: "Глянцевая карта в цветах «" + mn + "»" }));
      out.push(I("style", "f_" + mk, `Голограмма «${mn}»`, 2, { gen: 1, desc: "Переливающаяся карта с бегущим бликом" })); }
    for (const [sk, sn, sg, st] of SCENES) for (const [mk, ms] of MATS) out.push(I("bg", `b_${sk}_${mk}`, `${adj(ms, sg)} ${sn}`, st, { gen: 1 }));
    for (const [mk, , mn] of MATS) out.push(I("fx", "n_" + mk, `Переливы «${mn}»`, 1, { gen: 1 }));
    TITLES.forEach(([text, t], i) => out.push(I("title", "t" + i, text, t, { text, gen: 1 })));
    AVAS.forEach(([emoji, t], i) => out.push(I("ava", "e" + i, AVA_NAMES[emoji] || "Аватар", t, { emoji, gen: 1 })));
    ZOO_HATS.forEach(([id, name, t]) => out.push(I("hat", id, name, t, { petcase: 1, price: 0 })));
    ZOO_TOYS.forEach(([id, name, emoji, t]) => out.push(I("toy", id, name, t, { petcase: 1, emoji, price: 0 })));
    const season = (key, list) => list.forEach(([cat, id, name, t, extra]) => out.push(I(cat, id, name, t, Object.assign({ season: key, price: 0 }, extra || {},
      cat === "frame" && extra && ["wave", "pulse", "gem", "flame", "vortex", "aura", "stars"].includes(extra.pat) ? { strip: (PATS.find((p) => p[0] === extra.pat) || [])[4] || 4, speed: (PATS.find((p) => p[0] === extra.pat) || [])[5] || 1 } : {}))));
    SETS.forEach((s) => season(s.key, s.items));
    Object.entries(EXTRA).forEach(([k, list]) => season(k, list));
    return out;
  }
  const ALL = items();
  const meta = {}; ALL.forEach((it) => { meta[it.cat + ":" + it.id] = it; });
  const matOf = (k) => { const m = MATS.find((x) => x[0] === k); return m ? [m[3], m[4], m[5], m[6]] : null; };

  /* ---------------------------------------------------------------- рамки: узоры по палитре (холст 48×48, аватар 8..40) */
  const A = 8, B = 40;
  const PERD = (u, o) => { const L = A - o, M = B + o - 1, w = M - L, p = (((u % 1) + 1) % 1) * 4, k = Math.floor(p), q = p - k;
    return [[L + q * w, L, 0, -1], [M, L + q * w, 1, 0], [M - q * w, M, 0, 1], [L, M - q * w, -1, 0]][k]; };
  const EMB = {                                                    // значки сверху рамки (по центру)
    sun: [[" a a a ", "  aaa  ", "aaLLLaa", " aLLLa ", "aaLLLaa", "  aaa  ", " a a a "], 7],
    moon: [["  LLL ", " LLD  ", "LLD   ", "LLD   ", "LLD   ", " LLD  ", "  LLL "], 6],
    star: [["   L   ", "  LaL  ", "LLaaaLL", " LaaaL ", " La La ", " L   L "], 7],
    drop: [["  L  ", " LaL ", " LaL ", "LaaaL", "LaaML", " LLL "], 5],
    pumpkin: [["   g   ", " aaMaa ", "aMaMaMa", "aLaMaLa", "aMLLLMa", " aaaaa "], 7],
    spider: [["   D   ", "D DDD D", " DaDaD ", "D DDD D", " D   D "], 7],
    bat: [["D  D  D", "DD D DD", " DDaDD ", "  DDD  "], 7],
    skull: [[" LLLLL ", "LDDLDDL", "LLLLLLL", " LDLDL ", "  LLL  "], 7],
    cloud: [["  LL   ", " LLLL L", "LLLLLLL", " MMMMM "], 7],
    lantern: [["  D  ", " aaa ", "aMaMa", "aMaMa", " aaa ", "  D  "], 5],
    dragon: [["DD   DD", " DaaaD ", "DaLaLaD", " aaaaa ", " aDaDa ", "  aaa  "], 7],
    crown: [["a  a  a", "aa a aa", "aaaaaaa", "aLaMaLa", "MMMMMMM"], 7],
    bolt: [["   aa", "  aa ", " aaaa", "  aa ", " aa  ", "aa   "], 5],
    comet: [["      LL", "    aLLL", "  aaMLL ", "aaM  L  "], 8],
    planet: [["   LL   ", "  LMML  ", "aaaaaaaa", "  LMML  ", "   LL   "], 8],
    eye: [["  LLL  ", " LaDaL ", "LaDDDaL", " LaDaL ", "  LLL  "], 7],
    snow: [["L  L  L", " L L L ", "  LLL  ", "LLLaLLL", "  LLL  ", " L L L ", "L  L  L"], 7],
  };
  function emblem(t, key, pal, f) {
    const e = EMB[key]; if (!e) return;
    const [rows, w] = e, x0 = 24 - Math.floor(w / 2), y0 = 0;
    const C = { L: pal[0], M: pal[1], D: pal[2], a: pal[3], g: "#3aa84a" };
    t.Rr(x0 - 1, y0, w + 2, rows.length + 1, "#05030acc");
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (C[ch]) t.P(x0 + i, y0 + j, ch === "a" && f % 2 && key !== "pumpkin" ? pal[0] : C[ch]); }));
  }
  function painter(pat, pal) {
    const [L, M, D, AC] = pal, K = "#05030acc";
    return (t, R, f, n) => {
      const ph = n > 1 ? f / n : 0;
      switch (pat) {
        case "edge": t.bevel(L, M, D, 4); t.corners((x, y) => { t.Rr(x - 1, y - 1, 3, 3, K); t.P(x, y, AC); }); break;
        case "braid": t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? K : (Math.floor(u * 56) + d) % 4 < 2 ? L : (Math.floor(u * 56) + d) % 4 === 2 ? M : D); break;
        case "check": t.ring(4, (x, y, d) => d === 0 || d === 3 ? K : ((x >> 1) + (y >> 1)) % 2 ? M : D); t.corners((x, y) => t.P(x, y, L)); break;
        case "dots": t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? K : d === 1 && Math.floor(u * 72) % 3 === 0 ? AC : d === 2 && Math.floor(u * 72) % 3 === 1 ? L : M); break;
        case "rhomb": t.ring(5, (x, y, d, u) => { if (d === 0 || d === 4) return K; const s = (u * 24) % 1; return Math.abs(s - .5) * 2 + Math.abs(d - 2) / 2 < .9 ? L : (Math.abs(s - .5) * 2 + Math.abs(d - 2) / 2 < 1.3 ? M : D); });
          t.corners((x, y) => t.P(x, y, AC)); break;
        case "scale": t.ring(5, (x, y, d, u) => { if (d === 0 || d === 4) return K; const s = (u * 30 + (d % 2) * .5) % 1; return d === 1 && s > .3 && s < .7 ? L : (s - .5) * (s - .5) * 4 + (d - 1) / 4 < .55 ? M : D; }); break;
        case "lace": t.ring(3, (x, y, d) => d === 1 ? M : K);
          for (let i = 0; i < 44; i++) { const [x, y] = PERD(i / 44, 4); t.P(x, y, i % 2 ? L : AC); const [x2, y2] = PERD(i / 44 + 1 / 88, 5); if (i % 2 === 0) t.P(x2, y2, L); } break;
        case "stars": t.ring(3, (x, y, d) => d === 1 ? M : d === 0 ? K : D);
          for (let i = 0; i < 8; i++) { const [x, y] = PERD(i / 8 + 1 / 16, 3); t.star(Math.round(x), Math.round(y), (i + f) % 2 ? L : AC, D); } break;
        case "rope": t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? K : (Math.floor(u * 100) + d * 2) % 6 < 3 ? L : (Math.floor(u * 100) + d * 2) % 6 < 5 ? M : D); break;
        case "spikes": t.bevel(L, M, D, 3);
          for (let i = 0; i < 28; i++) { const [x, y, dx, dy] = PERD(i / 28, 3); for (let k = 0; k < 3; k++) t.P(x + dx * k, y + dy * k, k === 2 ? AC : k ? L : M); } break;
        case "wave": t.ring(4, (x, y, d, u) => { if (d === 0 || d === 3) return K; const w = Math.sin((u * 6 - ph) * Math.PI * 2); return w > .75 ? AC : w > .2 ? L : w > -.4 ? M : D; }); break;
        case "pulse": t.ring(5, (x, y, d) => (d === 0 || d === 4 ? K : [D, M, L, AC][(d + f) % 4]));
          t.ring(1, (x, y, d, u) => (Math.floor(u * 20) + f) % 4 === 0 ? AC + "aa" : null, 5); break;
        case "gem": t.bevel(L, M, D, 4);
          [[A - 3, A - 3], [B + 2, A - 3], [A - 3, B + 2], [B + 2, B + 2], [24, A - 3], [24, B + 2], [A - 3, 24], [B + 2, 24]].forEach(([x, y], i) => {
            t.Rr(x - 2, y - 2, 5, 5, K); t.Rr(x - 1, y - 1, 3, 3, i % 4 === f % 4 ? "#ffffff" : AC); t.P(x - 1, y - 1, L); }); break;
        case "flame": t.ring(3, (x, y, d) => d === 1 ? M : d === 2 ? D : K);
          for (let i = 0; i < 64; i++) { const [x, y, dx, dy] = PERD(i / 64, 3), h = 1 + Math.round(Math.abs(Math.sin(i * .9 + f * 1.7)) * 3 + R() * 1.4);
            for (let k = 0; k < h; k++) t.P(x + dx * k, y + dy * k, k >= h - 1 ? AC : k >= h - 2 ? L : M); } break;
        case "vortex": t.ring(5, (x, y, d, u) => d === 0 || d === 4 ? K : [L, M, D, AC][Math.floor((u + ph / 4) * 20 + d * .6) % 4]); break;
        case "aura": t.ring(2, (x, y, d, u) => (Math.floor(u * 24) + f) % 3 === 0 ? AC + "aa" : M + "44", 5);
          t.ring(5, (x, y, d, u, s) => { if (d === 0 || d === 4) return K; const q = ((u - ph) % 1 + 1) % 1, w = Math.min(q, 1 - q); if (w < .04) return "#ffffff"; if (w < .08) return AC;
            return d === 1 ? (s === "t" || s === "l" ? L : M) : d === 2 ? M : D; });
          for (let j = 0; j < 3; j++) { const [sx, sy] = PERD(ph + j / 3, 7); t.P(sx, sy, "#ffffff"); const [tx, ty] = PERD(ph + j / 3 - .02, 7); t.P(tx, ty, AC); } break;
        default: t.bevel(L, M, D, 4);
      }
    };
  }
  function frame(id) {
    const it = meta["frame:" + id]; if (!it) return null;
    if (it.gen) { const [, pk, mk] = id.split("_"); return painter(pk, matOf(mk)); }
    if (it.pat) { const p = painter(it.pat, it.pal); return (t, R, f, n) => { p(t, R, f, n); if (it.emb) emblem(t, it.emb, it.pal, f); }; }
    return null;
  }

  /* ---------------------------------------------------------------- фоны: пиксельный пейзаж 96×48 по палитре */
  const bgCache = {};
  function bg(id) {
    const it = meta["bg:" + id]; if (!it || typeof document === "undefined") return "";
    if (bgCache[id]) return bgCache[id];
    let scene, pal;
    if (it.gen) { const [, sk, mk] = id.split("_"); scene = sk; pal = matOf(mk); } else { scene = it.scene; pal = it.pal; }
    const [L, M, D, AC] = pal, W = 96, H = 48, c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d"); let seed = 9; for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const R = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 8) / 16777216; };
    const mix = (a, b, k) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A1 = p(a), B1 = p(b); return "rgb(" + A1.map((v, i) => Math.round(v + (B1[i] - v) * k)).join(",") + ")"; };
    for (let y = 0; y < H; y++) { x.fillStyle = y < H * .55 ? mix(D, M, y / (H * .55)) : mix(M, L, Math.min(1, (y - H * .55) / (H * .45))); x.fillRect(0, y, W, 1); }   // небо с полосами
    const R1 = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    if (scene === "sky" || scene === "city" || scene === "peaks") for (let i = 0; i < 40; i++) R1(Math.floor(R() * W), Math.floor(R() * H * .5), 1, 1, R() < .3 ? AC : L);
    const disc = (cx, cy, r, col) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) R1(cx + xx, cy + yy, 1, 1, col); };
    disc(20 + Math.floor(R() * 56), 10 + Math.floor(R() * 6), scene === "sky" ? 5 : 6, AC);
    if (scene === "hills") { [[30, .3, mix(M, D, .3)], [36, .45, mix(M, D, .6)], [42, .6, D]].forEach(([base, amp, col], k) => {
        const ph = R() * 6; for (let xx = 0; xx < W; xx++) { const top = Math.round(base - 6 * amp * 2 * (1 + Math.sin(xx / (10 + k * 4) + ph))); R1(xx, top, 1, H - top, col); } }); }
    if (scene === "sea") { R1(0, 30, W, 18, mix(M, D, .5)); for (let yy = 31; yy < H; yy += 3) for (let xx = (yy * 7) % 6; xx < W; xx += 6) R1(xx, yy, 3, 1, mix(L, M, .4));
      for (let yy = 31; yy < 44; yy++) R1(44 + Math.round(Math.sin(yy) * 2), yy, 6 - Math.floor((yy - 31) / 3), 1, AC); }
    if (scene === "peaks") { for (let k = 0; k < 2; k++) { let px = -10 + R() * 10; while (px < W) { const w = 22 + R() * 18, h = 18 + R() * 14 - k * 6, base = H - (k ? 0 : 8), col = k ? D : mix(M, D, .45);
        for (let xx = 0; xx < w; xx++) { const top = Math.round(base - h * (1 - Math.abs(xx - w / 2) / (w / 2))); R1(Math.round(px + xx), top, 1, H - top, col); if (!k && top < base - h + 4) R1(Math.round(px + xx), top, 1, 2, L); }
        px += w * .7; } } }
    if (scene === "city") { let px = 0; while (px < W) { const w = 6 + Math.floor(R() * 9), h = 12 + Math.floor(R() * 22); R1(px, H - h, w, h, D);
        for (let yy = H - h + 2; yy < H - 2; yy += 3) for (let xx = px + 1; xx < px + w - 1; xx += 2) if (R() < .45) R1(xx, yy, 1, 1, R() < .5 ? AC : L); px += w + 1; } }
    if (scene === "sky") { for (let xx = 0; xx < W; xx++) { const yy = Math.round(22 + Math.sin(xx / 9) * 5); R1(xx, yy, 1, 3, AC + "66"); R1(xx, yy + 3, 1, 2, L + "44"); }
      R1(0, 42, W, 6, D); for (let xx = 0; xx < W; xx += 3) R1(xx, 40 + Math.floor(R() * 3), 2, 3, D); }
    return (bgCache[id] = c.toDataURL());
  }
  const isBg = (id) => !!meta["bg:" + id] && (meta["bg:" + id].gen || meta["bg:" + id].scene);
  // карточка-«генератор»: стекло или голограмма в цветах палитры
  function style(id) { const it = meta["style:" + id]; if (!it) return null; if (it.gen) return { kind: id[0] === "f" ? "foil" : "glass", pal: matOf(id.slice(2)) }; return it.pal ? { kind: it.kind, pal: it.pal } : null; }
  function fx(id) { const it = meta["fx:" + id]; if (!it) return null; return it.gen ? matOf(id.slice(2)) : it.pal || null; }

  /* ---------------------------------------------------------------- рисунки новых приколов на голову (формат как HAT_ART в js/pets.js) */
  const HAT_ART = {
    wreath: [[" g f g p ", "gfgggpgg", "g      g"], { g: "#3aa84a", f: "#ffe066", p: "#ff7ab0" }],
    beanie: [["   rr   ", " BBBBBB ", "BBBBBBBB", "wBwBwBwB"], { r: "#ff3b4a", B: "#2a7ae8", w: "#c8dcff" }],
    frog: [[" GG  GG ", "GwkGGwkG", "GGGGGGGG", "GGGGGGGG", "gggggggg"], { G: "#5ac83a", g: "#3a8a2a", w: "#ffffff", k: "#101010" }],
    cowboy: [["  bbbbb  ", "  bBBBb  ", "  rrrrr  ", "bbbbbbbbb", " b     b "], { b: "#8a5a2a", B: "#a8743a", r: "#3a1a0a" }],
    headphones: [["  kkkkk  ", " k     k ", "k       k", "rr     rr", "rr     rr"], { k: "#1a1a22", r: "#ff3b4a" }],
    santa: [["      ww", "   rrr w", "  rrrrr ", " rrrrrrr", "wwwwwwwww"], { r: "#e8202a", w: "#ffffff" }],
    pirate: [["   kkk   ", " kkkkkkk ", "kkkwkwkkk", "kkkkwkkkk", " kkkkkkk "], { k: "#1a1a22", w: "#ffffff" }],
    wizard: [["    b    ", "   bbb   ", "   bYb   ", "  bbbbb  ", "  bbbYb  ", "bbbbbbbbb"], { b: "#3a2aa0", Y: "#ffe066" }],
    antlers: [["b b   b b", " bb   bb ", "  b   b  ", "  bb bb  "], { b: "#8a5a2a" }],
    unicorn: [["   w   ", "  wy   ", "  ywy  ", "  wyw  ", " pywyp "], { w: "#ffffff", y: "#ffd0f0", p: "#ff9ad0" }],
    sunhat: [["  wwwww  ", " wWWWWWw ", "  ooooo  ", "wwwwwwwww"], { w: "#f0e0b0", W: "#fff4d8", o: "#ff9a3a" }],
    sunflower: [[" y y y ", "yybbbyy", " ybbby ", "yybbbyy", " y y y ", "   g   "], { y: "#ffd23f", b: "#6a3a10", g: "#3aa84a" }],
    cap: [["  rrrrr  ", " rrwrrrr ", "rrrrrrrrrrr"], { r: "#e8202a", w: "#ffffff" }],
    shades: [["kkkkkkkkk", "kbbkkkbbk", " kk   kk "], { k: "#101014", b: "#3ac0ff" }],
    beret: [["    k    ", " rrrrrrr ", "rrrrrrrrr", " rrrrrrr "], { r: "#c8101e", k: "#3a0206" }],
    fedora: [["  bbbbb  ", " bbBbBbb ", " kkkkkkk ", "bbbbbbbbb"], { b: "#4a3a2a", B: "#2a2018", k: "#1a1008" }],
    nightcap: [["       y", "   bbb b", "  bbbbb ", " bBbBbbb", "wwwwwwwww"], { b: "#3a3aa0", B: "#ffe066", w: "#ffffff", y: "#ffe066" }],
    moonhat: [["  yy   ", " yy    ", "yy     ", "yy    y", " yy  yy", "  yyyy "], { y: "#ffe066" }],
    batbow: [["k k   k k", "kkkk kkkk", "kkkkrkkkk", " kk   kk "], { k: "#1a0a20", r: "#ff3b4a" }],
    witch: [["      k  ", "     kk  ", "    kkk  ", "   kkkk  ", "   ppppp ", "kkkkkkkkkk"], { k: "#1a0a20", p: "#a05bff" }],
    horns: [["r       r", "rr     rr", " rr   rr "], { r: "#e8202a" }],
    pumpkinhead: [["    g    ", "  oOoOo  ", " oOoOoOo ", "oyoOoOoyo", "oOoyyyoOo", " ooooooo "], { o: "#ff7a18", O: "#e05a08", y: "#ffe066", g: "#3aa84a" }],
    reaper: [["   kkk   ", "  kkkkk  ", " kk   kk ", " k     k ", "kk     kk"], { k: "#14101c" }],
    antennae: [["g     g", " g   g ", "  g g  ", "  ggg  "], { g: "#7aff6a" }],
    ufohat: [["   cc   ", "  cccc  ", "mmmmmmmm", " ymymym "], { c: "#7ae0ff", m: "#a8b4c4", y: "#ffe066" }],
    astro: [["  wwwww  ", " wbbbbbw ", "wbbcbbbbw", "wbbbbbbbw", "wwwwwwwww"], { w: "#ffffff", b: "#3a5aa0", c: "#bfefff" }],
    laurel: [["g g   g g", "gg g g gg", " gg   gg "], { g: "#7ab83a" }],
    helmet: [["   rrr   ", "  yyyyy  ", " yYyyyYy ", "yyy   yyy", "yy     yy"], { y: "#ffc21a", Y: "#fff4b0", r: "#e8202a" }],
    glory: [[" y  w  y ", "  y w y  ", "yywwwwwyy", "  y w y  "], { y: "#ffe066", w: "#ffffff" }, [" w  y  w ", "  w y w  ", "wwyyyyyww", "  w y w  "]],
    douli: [["    y    ", "   yYy   ", "  yYyYy  ", " yYyYyYy ", "yyyyyyyyy"], { y: "#e8c890", Y: "#c8a060" }],
    dlantern: [["   k   ", "  rrr  ", " ryryr ", " ryryr ", "  rrr  ", "   y   "], { r: "#e8202a", y: "#ffd23f", k: "#3a1a0a" }],
    dhorns: [["g       g", "gg     gg", " gy   yg ", "  yy yy  "], { g: "#2ab86a", y: "#ffd23f" }],
    dcrown: [["y   r   y", "yy yyy yy", "yyyyyyyyy", "ygyyryygy", "rrrrrrrrr"], { y: "#ffd23f", r: "#e8202a", g: "#2ab86a" }],
    snowcap: [["   ww   ", " bbbbbb ", "bbwbbwbb", "wwwwwwww"], { b: "#8ad8ff", w: "#ffffff" }],
    fangs: [["kkkkkkk", "kwkkkwk", " w   w "], { k: "#1a0206", w: "#ffffff" }],
    visor: [["kkkkkkkkk", "kccmmmcck", " kkkkkkk "], { k: "#14001e", c: "#00e5ff", m: "#ff2bd6" }],
  };

  // супер-сундук и обычные сезонные — для js/shop.js
  const api = { MATS, PATS, SCENES, TITLES, AVAS, SETS, EXTRA, ZOO_HATS, ZOO_TOYS, ALL, meta, frame, bg, isBg, style, fx, HAT_ART, PRICE };
  return api;
})();
if (typeof module !== "undefined") module.exports = Loot;
