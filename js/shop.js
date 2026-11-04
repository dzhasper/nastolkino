/* Магазин приколов: монеты, рамки для аватара, фоны и виды профиля, титулы, эффекты имени, редкие аватары.
   Всё оформление хранится в профиле игрока (look) и видно остальным в комнате. Рамки рисуются пикселями на холсте 48×48. */
const Shop = (() => {
  "use strict";

  /* ---------------------------------------------------------------- каталог */
  const CATS = [
    { key: "frame", name: "Рамки", icon: "🖼️" },
    { key: "bg", name: "Фоны", icon: "🏞️" },
    { key: "style", name: "Карточки", icon: "🪪" },
    { key: "title", name: "Титулы", icon: "🏷️" },
    { key: "fx", name: "Эффекты", icon: "✨" },
    { key: "ava", name: "Аватары", icon: "🐉" },
    { key: "toy", name: "Игрушки", icon: "🧸" },
    { key: "hat", name: "Приколы", icon: "🎩" },
    { key: "mg", name: "Мутагены", icon: "💉" },
  ];
  const I = (cat, id, name, price, extra = {}) => Object.assign({ cat, id, name, price }, extra);
  const ITEMS = [
    I("frame", "none", "Без рамки", 0),
    I("frame", "wood", "Дерево", 60), I("frame", "silver", "Серебро", 90), I("frame", "hazard", "Опасность", 90),
    I("frame", "cactus", "Кактус", 100), I("frame", "web", "Паутина", 120), I("frame", "pumpkin", "Тыквы", 120),
    I("frame", "bones", "Кости", 140), I("frame", "barbed", "Колючка", 140), I("frame", "sheriff", "Шериф", 150),
    I("frame", "win95", "Окно 95", 150), I("frame", "vhs", "Кассета", 160), I("frame", "blood", "Кровь", 180),
    I("frame", "ice", "Лёд", 200), I("frame", "neon", "Неон", 220, { anim: "hue" }), I("frame", "matrix", "Матрица", 240, { anim: "flicker" }),
    I("frame", "gold", "Золото", 260, { anim: "shine" }), I("frame", "fire", "Огонь", 300, { anim: "flame" }),
    I("frame", "rainbow", "Радуга", 340, { anim: "hue" }), I("frame", "crown", "Корона", 400, { anim: "shine" }),
    I("frame", "diamond", "Бриллиант", 500, { anim: "twinkle" }),
    I("frame", "pixels", "Пиксели", 40, { fresh: 1 }), I("frame", "candy", "Карамель", 70, { fresh: 1 }),
    I("frame", "cards", "Карточный стол", 220, { fresh: 1 }), I("frame", "shells", "Патронташ", 260, { fresh: 1 }),
    I("frame", "ghost", "Призрак", 380, { fresh: 1, strip: 4, speed: .9 }), I("frame", "lightning", "Молния", 480, { fresh: 1, strip: 4, speed: .5 }),
    I("frame", "lava", "Лава", 560, { fresh: 1, strip: 4, speed: .7 }), I("frame", "galaxy", "Галактика", 750, { fresh: 1, strip: 6, speed: 1.2 }),
    I("frame", "plasma", "Плазма", 1000, { fresh: 1, strip: 6, speed: .8 }), I("frame", "dragon", "Драконья чешуя", 1000, { fresh: 1, strip: 4, speed: 1 }),
    I("frame", "royal", "Королевская", 2000, { fresh: 1, strip: 6, speed: 1.1 }),
    I("frame", "bubbles", "Пузыри", 140, { fresh: 1, strip: 4, speed: 1.2 }), I("frame", "hearts", "Сердечки", 180, { fresh: 1, strip: 4, speed: .8 }),
    I("frame", "glass", "Витраж", 220, { fresh: 1 }), I("frame", "confetti", "Конфетти", 280, { fresh: 1, strip: 4, speed: .6 }),
    I("frame", "gears", "Шестерёнки", 320, { fresh: 1, strip: 4, speed: .8 }), I("frame", "eyes", "Глаза", 450, { fresh: 1, strip: 4, speed: 1.6 }),
    I("frame", "snake", "Радужный змей", 600, { fresh: 1, strip: 6, speed: 1 }), I("frame", "aquarium", "Аквариум", 700, { fresh: 1, strip: 6, speed: 1.4 }),
    I("frame", "portal", "Портал", 900, { fresh: 1, strip: 6, speed: .9 }),
    // набор Создателя: только у администратора, из кейсов не выпадает (можно лишь подарить обменом)
    I("frame", "bwfire", "Чёрно-белое пламя", 0, { excl: 1, strip: 6, speed: .7 }),
    I("bg", "throne", "Трон Создателя", 0, { excl: 1 }),
    I("style", "creator", "Создатель", 0, { excl: 1, desc: "Чёрная карта в чёрно-белом пламени с печатью Создателя" }),
    I("title", "creator", "Создатель Настолкино", 0, { excl: 1, text: "Создатель Настолкино" }),
    I("fx", "bwflame", "Чёрно-белое пламя", 0, { excl: 1 }),
    I("ava", "key", "Ключ Создателя", 0, { excl: 1, emoji: "🗝️" }),
    // титулы за собранные коллекции питомцев (выдаёт сервер)
    I("title", "dragonlord", "Повелитель драконов", 0, { excl: 1, text: "Повелитель драконов", desc: "Все 6 коллекционных драконов" }),
    I("title", "elements", "Хранитель стихий", 0, { excl: 1, text: "Хранитель стихий", desc: "Все 4 стихийных духа" }),
    // мутагены: 200 шприцов (только от администратора и 0,01% из «Питомника»)
    ...(typeof Pets !== "undefined" && Pets.MG_COUNT ? Array.from({ length: Pets.MG_COUNT }, (_, i) => I("mg", String(i + 1), Pets.mgName(i + 1), 0, { mg: Pets.mgMut(i + 1).key })) : []),
    // кейс «Питомник»: игрушки (питомцы сами выбирают) и приколы на голову. Списки — из js/pets.js
    ...(typeof Pets !== "undefined" ? Pets.TOYS.map(([id, name, emoji, tier]) => I("toy", id, name, 0, { petcase: 1, tier, emoji }))
      .concat(Pets.HATS.map(([id, name, tier]) => (tier >= 4 ? I("hat", id, name, 0, { excl: 1, prem: 1, desc: "только в премиум-пропуске" }) : I("hat", id, name, 0, { petcase: 1, tier })))) : []),
    // сезонные кейсы: каждая вещь выпадает только из своего кейса (tier: 0 обычная … 3 легендарная)
    ...[["s_ice", [["title", "s_ice1", "Дитя метели", 0, { text: "Дитя метели" }], ["ava", "s_ice1", "Снеговик", 0, { emoji: "☃️" }], ["frame", "s_snow", "Снежинки", 1],
        ["title", "s_ice2", "Повелитель льда", 1, { text: "Повелитель льда" }], ["ava", "s_ice2", "Ледышка", 1, { emoji: "🧊" }], ["bg", "s_ice", "Северное сияние", 2],
        ["fx", "s_ice", "Сияние", 2], ["frame", "s_aurora", "Северное сияние", 3, { strip: 6, speed: 1.4 }], ["style", "s_ice", "Ледяная карта", 3, { desc: "Морозное стекло, снег и сияние" }]]],
      ["s_moon", [["title", "s_moon1", "Дитя луны", 0, { text: "Дитя луны" }], ["ava", "s_moon1", "Полнолуние", 0, { emoji: "🌕" }], ["frame", "s_fangs", "Клыки", 1],
        ["title", "s_moon2", "Охотник на вампиров", 1, { text: "Охотник на вампиров" }], ["ava", "s_moon2", "Капля крови", 1, { emoji: "🩸" }], ["bg", "s_moon", "Кровавая луна", 2],
        ["fx", "s_moon", "Лунный пульс", 2], ["frame", "s_bloodmoon", "Кровавая луна", 3, { strip: 6, speed: 1 }], ["style", "s_moon", "Проклятый свиток", 3, { desc: "Пергамент, кровь и луна" }]]],
      ["s_neon", [["title", "s_neon1", "Хакер", 0, { text: "Хакер" }], ["ava", "s_neon1", "Кибер-рука", 0, { emoji: "🦾" }], ["frame", "s_circuit", "Схема", 1],
        ["title", "s_neon2", "Призрак сети", 1, { text: "Призрак сети" }], ["ava", "s_neon2", "НЛО", 1, { emoji: "🛸" }], ["bg", "s_neon", "Неон-сити", 2],
        ["fx", "s_neon", "Неон", 2], ["frame", "s_holo", "Голограмма", 3, { strip: 6, speed: .6 }], ["style", "s_neon", "Кибер-ID", 3, { desc: "Неоновое удостоверение с помехами" }]]],
      ["s_dragon", [["title", "s_dragon1", "Сын неба", 0, { text: "Сын неба" }], ["ava", "s_dragon1", "Фонарик", 0, { emoji: "🏮" }], ["frame", "s_clouds", "Облака", 1],
        ["title", "s_dragon2", "Хозяин дракона", 1, { text: "Хозяин дракона" }], ["ava", "s_dragon2", "Дракончик", 1, { emoji: "🐲" }], ["bg", "s_dragon", "Храм дракона", 2],
        ["fx", "s_dragon", "Золото дракона", 2], ["frame", "s_gdragon", "Золотой дракон", 3, { strip: 6, speed: 1.2 }], ["style", "s_dragon", "Свиток императора", 3, { desc: "Красный лак, золото и печать дракона" }]]],
    ].flatMap(([season, list]) => list.map(([cat, id, name, tier, extra]) => I(cat, id, name, 0, Object.assign({ season, tier }, extra || {})))),

    I("bg", "none", "Без фона", 0), I("bg", "rpg", "Замок", 90), I("bg", "arcade", "Аркада", 80), I("bg", "office", "Офис", 100), I("bg", "classic", "Нуар", 100),
    I("bg", "90s", "Район 90-х", 100), I("bg", "halloween", "Кладбище", 120), I("bg", "bunker", "Бункер", 120), I("bg", "west", "Салун", 120),
    I("bg", "shop", "Лавка", 150), I("bg", "winter", "Зимний лес", 160), I("bg", "sakura", "Сакура", 180), I("bg", "ocean", "Подводный мир", 180),
    I("bg", "dungeon", "Подземелье", 200), I("bg", "space", "Космос", 220),
    I("bg", "studio", "Мастерская", 120, { fresh: 1 }), I("bg", "casino", "Казино", 250, { fresh: 1 }), I("bg", "cellar", "Подвал", 300, { fresh: 1 }),

    I("style", "rpg", "Ролевая игра", 0, { desc: "Синее окно героя, уровень и полоски" }),
    I("style", "dossier", "Досье", 150, { desc: "Папка детектива со штампом" }),
    I("style", "terminal", "Терминал", 180, { desc: "Зелёный экран бункера" }),
    I("style", "vhs", "Кассета", 180, { desc: "Наклейка на видеокассете из 90-х" }),
    I("style", "badge", "Пропуск", 200, { desc: "Бейдж сотрудника со штрихкодом" }),
    I("style", "tarot", "Карта таро", 200, { desc: "Мистическая карта с римским числом" }),
    I("style", "wanted", "Разыскивается", 220, { desc: "Плакат с наградой за твою голову" }),
    I("style", "arcade", "Аркада", 250, { desc: "Таблица рекордов игрового автомата" }),
    I("style", "vip", "VIP-карта", 1000, { fresh: 1, desc: "Чёрная карта с золотом и бегущим бликом" }),

    I("title", "none", "Без титула", 0, { text: "" }),
    I("title", "honest", "Честный житель", 50, { text: "Честный житель" }), I("title", "suspect", "Вечно подозреваемый", 60, { text: "Вечно подозреваемый" }),
    I("title", "paranoid", "Главный параноик", 70, { text: "Главный параноик" }), I("title", "alibi", "Мастер алиби", 90, { text: "Мастер алиби" }),
    I("title", "eye", "Глаз-алмаз", 100, { text: "Глаз-алмаз" }), I("title", "soul", "Душа компании", 100, { text: "Душа компании" }),
    I("title", "devil", "Адвокат дьявола", 120, { text: "Адвокат дьявола" }), I("title", "silent", "Тихий убийца", 140, { text: "Тихий убийца" }),
    I("title", "bluff", "Король блефа", 160, { text: "Король блефа" }), I("title", "self", "Сам себе мафия", 180, { text: "Сам себе мафия" }),
    I("title", "hood", "Легенда района", 220, { text: "Легенда района" }), I("title", "night", "Хозяин ночи", 260, { text: "Хозяин ночи" }),
    I("title", "untouch", "Неприкасаемый", 300, { text: "Неприкасаемый" }), I("title", "godfather", "Крёстный отец", 400, { text: "Крёстный отец" }),
    I("title", "sharper", "Шулер", 350, { fresh: 1, text: "Шулер" }), I("title", "lucky", "Счастливчик", 500, { fresh: 1, text: "Счастливчик" }),
    I("title", "cellar", "Хозяин подвала", 750, { fresh: 1, text: "Хозяин подвала" }), I("title", "legend", "Легенда Настолкино", 1000, { fresh: 1, text: "Легенда Настолкино" }),
    I("title", "immortal", "Бессмертный", 1500, { fresh: 1, text: "Бессмертный" }),

    I("fx", "none", "Обычное имя", 0), I("fx", "glow", "Сияние", 120), I("fx", "wave", "Волна", 160), I("fx", "gold", "Золотое имя", 180),
    I("fx", "glitch", "Глитч", 220), I("fx", "rainbow", "Радуга", 250), I("fx", "fire", "Пламя", 300),
    I("fx", "shake", "Дрожь", 180, { fresh: 1 }), I("fx", "toxic", "Радиоактив", 260, { fresh: 1 }), I("fx", "ghosty", "Призрачное", 320, { fresh: 1 }),
    I("fx", "frost", "Иней", 350, { fresh: 1 }), I("fx", "bloody", "Кровавое", 600, { fresh: 1 }), I("fx", "royal", "Королевское", 1000, { fresh: 1 }),

    I("ava", "dragon", "Дракон", 40, { emoji: "🐉" }), I("ava", "dino", "Динозавр", 40, { emoji: "🦖" }), I("ava", "invader", "Пришелец", 50, { emoji: "👾" }),
    I("ava", "wizard", "Волшебник", 50, { emoji: "🧙" }), I("ava", "shark", "Акула", 50, { emoji: "🦈" }), I("ava", "bat", "Летучая мышь", 60, { emoji: "🦇" }),
    I("ava", "spider", "Паук", 60, { emoji: "🕷️" }), I("ava", "skull", "Череп", 70, { emoji: "💀" }), I("ava", "clown", "Клоун", 70, { emoji: "🤡" }),
    I("ava", "oni", "Демон", 80, { emoji: "👹" }), I("ava", "genie", "Джинн", 80, { emoji: "🧞" }), I("ava", "villain", "Злодей", 90, { emoji: "🦹" }),
    I("ava", "scorpion", "Скорпион", 60, { emoji: "🦂", fresh: 1 }), I("ava", "snake", "Змей", 90, { emoji: "🐍", fresh: 1 }), I("ava", "eagle", "Орёл", 120, { emoji: "🦅", fresh: 1 }),
    I("ava", "orb", "Шар судьбы", 200, { emoji: "🔮", fresh: 1 }), I("ava", "joker", "Джокер", 300, { emoji: "🃏", fresh: 1 }), I("ava", "jolly", "Весёлый Роджер", 500, { emoji: "☠️", fresh: 1 }),
  ];
  // сезонный пропуск: на каждый месяц — своя рамка и два титула (выдаёт сервер на 15-м и 30-м уровне). Названия — как в server/worker.js (PASS_THEMES)
  const PASS_THEMES = [["Ледяной венец", "#e8f8ff", "#8ad8ff", "#2a5a9a", "#ffffff"], ["Вьюга", "#f0f4ff", "#a8b8e8", "#3a4a8a", "#c8e8ff"], ["Первоцвет", "#f4ffe0", "#9ae07a", "#2a6a2a", "#ffe066"],
    ["Капель", "#e0f4ff", "#6ac8f0", "#1a5a8a", "#ffffff"], ["Цветущий сад", "#fff0f8", "#ff9ad0", "#8a2a6a", "#fff4a0"], ["Солнцестояние", "#fffbe0", "#ffd23f", "#b86a10", "#ff5a2a"],
    ["Зной", "#fff0d0", "#ff9a3a", "#8a2a0a", "#ffe066"], ["Звездопад", "#e8e0ff", "#8a7aff", "#1a1050", "#ffe066"], ["Листопад", "#fff0d8", "#e08a3a", "#6a2a0a", "#c8301a"],
    ["Тыквенная ночь", "#ffd8a0", "#ff7a18", "#2a1006", "#7aff6a"], ["Туманный", "#eef0f4", "#a8b0c0", "#3a4050", "#d8e8ff"], ["Снегопад", "#ffffff", "#c8e0ff", "#4a6a9a", "#ff3355"]];
  const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
  // рамка пропуска: двойной гранёный обод, по нему бегут волны света, вокруг летают искры, в углах мигают камни, сверху — герб сезона.
  // Премиум — та же рамка, но в золоте и фиолете: две волны, вдвое больше искр, пульсирующий ореол и корона над гербом
  const passFrame = ([, light, mid, dark, acc], prem) => (t, R, f, n) => {
    const L = prem ? "#fff4c0" : light, M = prem ? "#ffcf3a" : mid, D = prem ? "#4a1680" : dark, AC = prem ? "#ff4fd8" : acc, ph = f / n;
    if (prem) t.ring(1, (x, y, d, u) => ((Math.floor(u * 24) + f) % 3 === 0 ? (f % 2 ? "#ff4fd8aa" : "#ffcf3aaa") : "#ffcf3a44"), 6);   // ореол
    const wave = (u, k) => { const q = ((u - ph * k) % 1 + 1) % 1; return Math.min(q, 1 - q); };
    t.ring(6, (x, y, d, u, sd) => {
      if (d === 0 || d === 5) return "#05030acc";
      const w = Math.min(wave(u, 1), prem ? wave(u + .5, 1) : 1);
      if (w < .035 && d < 4) return "#ffffff";
      if (w < .07 && d < 4) return L;
      if (d === 1) return sd === "t" || sd === "l" ? L : M;
      if (d === 4) return prem ? AC : D;
      return (sd === "t" || sd === "l") ? (d === 2 ? M : D) : (d === 2 ? D : "#05030a");
    });
    // камни в углах — вспыхивают по очереди
    t.corners((x, y, i) => { t.Rr(x - 2, y - 2, 5, 5, "#05030a"); t.Rr(x - 1, y - 1, 3, 3, i === f % 4 ? "#ffffff" : i % 2 ? AC : L); t.P(x, y, i === f % 4 ? AC : "#ffffff"); });
    // искры летают по кругу и тянут хвост
    const sparks = prem ? 4 : 2;
    for (let j = 0; j < sparks; j++) for (let tr = 0; tr < 3; tr++) {
      const [sx, sy] = PER(ph + j / sparks - tr * .025, 7);
      t.P(sx, sy, tr === 0 ? "#ffffff" : tr === 1 ? (prem ? AC : L) : (prem ? "#ffcf3a88" : M + "88"));
    }
    // герб сезона сверху: щит со звездой (у премиума — корона над ним)
    t.Rr(19, 0, 10, 9, "#05030a"); t.Rr(20, 1, 8, 6, M); t.Rr(21, 7, 6, 1, M); t.Rr(22, 8, 4, 1, D); t.Rr(20, 1, 8, 1, L);
    t.star(24, 4, f % 2 && prem ? "#ffffff" : AC, D);
    if (prem) { [[19, 0], [24, -1], [28, 0]].forEach(([cx, cy]) => t.P(cx, cy + 1, f % 2 ? "#ffffff" : "#ffcf3a")); }
    // лента снизу
    t.Rr(17, 43, 14, 4, "#05030a"); t.Rr(18, 44, 12, 2, prem ? AC : M); t.Rr(18, 44, 12, 1, L);
    if (f % 3 === 0) t.P(18 + ((f * 5) % 12), 44, "#ffffff");
  };
  for (let y = 26; y <= 30; y++) for (let m = 1; m <= 12; m++) {
    const tag = String(y) + String(m).padStart(2, "0"), th = PASS_THEMES[m - 1], when = `сезонный пропуск · ${MONTHS[m - 1]} 20${y}`;
    ITEMS.push(I("frame", "ps" + tag, th[0], 0, { excl: 1, strip: 6, speed: 1.4, pass: tag, desc: when }),
      I("frame", "pp" + tag, th[0] + " · премиум", 0, { excl: 1, strip: 8, speed: 1.1, pass: tag, prem: 1, desc: when + " · премиум-дорожка, 30-й уровень" }),
      I("title", "pt" + tag + "p", `Премиум сезона «${th[0]}»`, 0, { excl: 1, pass: tag, text: `Премиум «${th[0]}»`, desc: when + " · премиум, 30-й уровень" }),
      I("title", "pt" + tag + "a", `Сезон «${th[0]}»`, 0, { excl: 1, pass: tag, text: `Сезон «${th[0]}»`, desc: when + " · 15-й уровень" }),
      I("title", "pt" + tag + "b", `Покоритель сезона «${th[0]}»`, 0, { excl: 1, pass: tag, text: `Покоритель «${th[0]}»`, desc: when + " · 30-й уровень" }));
  }
  const byId = (cat, id) => ITEMS.find((x) => x.cat === cat && x.id === id);
  const byKey = (k) => { const [c, i] = String(k).split(":"); return byId(c, i); };

  /* ---------------------------------------------------------------- кейсы: вещи только выбиваются. Таблицы — такие же в server/worker.js */
  const TIERS = [
    { name: "Обычная", color: "#9aa4b8" }, { name: "Редкая", color: "#4fa8ff" },
    { name: "Эпическая", color: "#b05cff" }, { name: "Легендарная", color: "#ffb020" }, { name: "Эксклюзив", color: "#f2f2f2" },
    { name: "Мутаген", color: "#4dff88" },
  ];
  const tier = (it) => (it.mg ? 5 : it.excl ? 4 : it.tier != null ? it.tier : it.price >= 750 ? 3 : it.price >= 300 ? 2 : it.price >= 150 ? 1 : 0);
  const CASES = [
    { key: "basement", name: "Подвальный кейс", price: 100, w: [70, 24, 5, 1], food: .25, egg: 0, desc: "В основном обычные вещи, иногда еда для питомцев" },
    { key: "dark", name: "Тёмный кейс", price: 300, w: [30, 42, 22, 6], food: .1, egg: .003, desc: "Редкие и эпические вещи, бывает легендарка" },
    { key: "legend", name: "Легендарный кейс", price: 1000, w: [0, 35, 45, 20], food: 0, egg: .015, desc: "Без обычных вещей, каждая пятая — легендарка" },
    { key: "zoo", name: "Кейс «Питомник»", price: 250, w: [55, 28, 13, 4], food: 0, egg: .004, pool: "pet", desc: "Игрушки, приколы на голову и бутылочки роста. Только здесь. Шанс 0,01% — мутаген" },
  ];
  const DUP = [25, 60, 150, 400];                                 // повтор превращается в монеты
  // сезонные кейсы: появляются на несколько минут (раз в день или по команде админа). Таблицы — такие же в server/worker.js (SEASONS)
  const SEASONS = [
    { key: "s_ice", name: "Ледяная ночь", emoji: "❄️", price: 400, w: [50, 30, 15, 5], color: "#7ad8ff", desc: "Иней, северное сияние и вечный холод" },
    { key: "s_moon", name: "Кровавая луна", emoji: "🌕", price: 400, w: [50, 30, 15, 5], color: "#ff3b4a", desc: "Ночь, когда луна наливается кровью" },
    { key: "s_neon", name: "Неоновый город", emoji: "🌃", price: 400, w: [50, 30, 15, 5], color: "#ff3ec8", desc: "Дождь, неон и помехи в сети" },
    { key: "s_dragon", name: "Золотой дракон", emoji: "🐲", price: 400, w: [50, 30, 15, 5], color: "#ffc23b", desc: "Фонари, облака и золото императора" },
  ];
  const seasonByKey = (k) => SEASONS.find((x) => x.key === k);
  const seasonPool = (k) => ITEMS.filter((x) => x.season === k);
  const POOL = ITEMS.filter((x) => x.price > 0);
  const caseByKey = (k) => CASES.find((c) => c.key === k);
  const rnd = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  function rollTier(w) { let r = rnd() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; } return w.length - 1; }
  const poolOf = (c) => (c && c.pool === "pet" ? ITEMS.filter((x) => x.petcase) : POOL);
  const rollItem = (t, c) => { const list = poolOf(c).filter((x) => tier(x) === t); return list[Math.floor(rnd() * list.length)]; };
  const DEFAULT = { frame: "none", bg: "none", style: "rpg", title: "none", fx: "none" };
  const REWARD = { game: 20, win: 30, alive: 10 };

  /* ---------------------------------------------------------------- рамки: пиксельный рисунок 48×48, аватар в центре 8..40 */
  const N = 48, A = 8, B = 40;                                  // аватар занимает квадрат A..B
  const BAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function painter(ctx) {
    const P = (x, y, c) => { if (c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } };
    const Rr = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    // кольцо толщиной t вокруг аватара: f(x, y, d — глубина от внешнего края, u — путь по периметру 0..1, side)
    const ring = (t, f, o = 0) => {
      const a = A - t - o, b = B + t + o;
      for (let y = a; y < b; y++) for (let x = a; x < b; x++) {
        const inside = x >= A - o && x < B + o && y >= A - o && y < B + o;
        if (inside) continue;
        if ((x === a || x === b - 1) && (y === a || y === b - 1)) continue;   // срезанные углы — «пиксельное» скругление
        const d = Math.min(x - a, y - a, b - 1 - x, b - 1 - y);
        const side = y - a === d ? "t" : b - 1 - y === d ? "b" : x - a === d ? "l" : "r";
        const per = (side === "t" ? x - a : side === "r" ? (b - a) + (y - a) : side === "b" ? 2 * (b - a) + (b - 1 - x) : 3 * (b - a) + (b - 1 - y)) / (4 * (b - a));
        P(x, y, f(x, y, d, per, side));
      }
    };
    const bevel = (light, mid, dark, t = 4) => ring(t, (x, y, d, u, s) => d === 0 || d === t - 1 ? "#000000cc" : (s === "t" || s === "l") ? (d === 1 ? light : mid) : (d === 1 ? mid : dark));
    const star = (cx, cy, c, c2) => { P(cx, cy - 2, c); Rr(cx - 1, cy - 1, 3, 1, c); Rr(cx - 2, cy, 5, 1, c); Rr(cx - 1, cy + 1, 3, 1, c); P(cx - 1, cy + 2, c); P(cx + 1, cy + 2, c); if (c2) P(cx, cy, c2); };
    const corners = (fn) => [[A - 3, A - 3], [B + 2, A - 3], [A - 3, B + 2], [B + 2, B + 2]].forEach(([x, y], i) => fn(x, y, i));
    return { P, Rr, ring, bevel, star, corners };
  }
  // точка на периметре рамки: u от 0 до 1 по часовой, o — отступ от аватара
  const PER = (u, o = 3) => { const L = A - o, M = B + o - 1, w = M - L, p = (((u % 1) + 1) % 1) * 4, k = Math.floor(p), q = p - k; return [[L + q * w, L], [M, L + q * w], [M - q * w, M], [L, M - q * w]][k]; };
  const FRAMES = {
    wood(t) { t.ring(4, (x, y, d, u, s) => d === 0 || d === 3 ? "#2a1408" : ((s === "t" || s === "b" ? x : y) * 7 + d * 3) % 11 < 2 ? "#6a3a18" : d === 1 ? "#b8743a" : "#9a5a28");
      t.corners((x, y) => { t.P(x, y, "#e8d8b0"); }); },
    silver(t) { t.bevel("#ffffff", "#b8c0cc", "#6a7280"); t.corners((x, y) => t.P(x, y, "#ffffff")); },
    gold(t) { t.bevel("#fff4b0", "#ffd23f", "#b87a10"); t.corners((x, y, i) => { t.Rr(x - 1, y - 1, 3, 3, "#000"); t.P(x, y, ["#ff3355", "#3ec8ff", "#7aff6a", "#c86aff"][i]); }); },
    hazard(t) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#000" : ((x + y) >> 1) % 4 < 2 ? "#f5c400" : "#111"); },
    cactus(t) { t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? "#0e3a18" : d === 1 ? "#5aa85a" : "#2f7a3a");
      for (let i = 0; i < 40; i++) { const u = i / 40, p = u * 4, k = Math.floor(p), f = p - k; const L = A - 5, M = B + 4, w = M - L;
        const [x, y, dx, dy] = [[L + f * w, L, 0, -1], [M, L + f * w, 1, 0], [M - f * w, M, 0, 1], [L, M - f * w, -1, 0]][k]; if (i % 2) t.P(x + dx, y + dy, "#e8f4c8"); }
      t.Rr(22, 0, 4, 3, "#ff5a8a"); t.P(23, 1, "#ffd23f"); t.P(24, 1, "#ffd23f"); },
    web(t) { t.ring(2, (x, y, d) => d === 0 ? "#9a9aa8" : "#3a3a48");
      [[A - 3, A - 3, 1, 1], [B + 2, A - 3, -1, 1], [A - 3, B + 2, 1, -1], [B + 2, B + 2, -1, -1]].forEach(([x, y, sx, sy]) => {
        for (let i = 0; i < 9; i++) { t.P(x + sx * i, y, "#d8d8e8"); t.P(x, y + sy * i, "#d8d8e8"); t.P(x + sx * i * .7, y + sy * i * .7, "#d8d8e8"); }
        [3, 6].forEach((r) => { for (let k = 0; k <= r; k++) t.P(x + sx * k, y + sy * (r - k * .6), "#b8b8c8"); });
      });
      t.Rr(B + 1, B + 4, 3, 3, "#111"); t.P(B + 1, B + 3, "#111"); t.P(B + 3, B + 3, "#111"); t.P(B + 2, B + 4, "#ff3355"); },
    pumpkin(t) { t.ring(3, (x, y, d) => d === 1 ? "#ff8a1a" : "#2a1006");
      t.corners((x, y) => { t.Rr(x - 3, y - 2, 7, 5, "#ff7a18"); t.Rr(x - 2, y - 3, 5, 7, "#ff7a18"); t.Rr(x - 1, y - 4, 2, 2, "#2f7a3a");
        t.P(x - 2, y - 1, "#ffe066"); t.P(x + 2, y - 1, "#ffe066"); t.Rr(x - 1, y + 1, 3, 1, "#ffe066"); t.P(x, y - 2, "#c84a10"); }); },
    bones(t) { t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? "#3a3428" : (Math.floor(u * 40) % 5 === 0 ? "#b8b0a0" : "#f0ead8"));
      t.Rr(19, 0, 10, 8, "#f0ead8"); t.Rr(18, 2, 12, 4, "#f0ead8"); t.Rr(21, 3, 2, 2, "#000"); t.Rr(25, 3, 2, 2, "#000"); t.Rr(21, 7, 6, 2, "#d8d0c0"); t.P(22, 8, "#000"); t.P(25, 8, "#000"); },
    barbed(t) { t.ring(3, (x, y, d, u) => d === 1 ? (Math.floor(u * 80) % 4 < 2 ? "#a8a8b0" : "#5a5a64") : null);
      for (let i = 0; i < 16; i++) { const u = i / 16, p = u * 4, k = Math.floor(p), f = p - k, L = A - 2, M = B + 1, w = M - L;
        const [x, y] = [[L + f * w, L], [M, L + f * w], [M - f * w, M], [L, M - f * w]][k];
        t.P(x - 1, y - 1, "#c8c8d0"); t.P(x + 1, y + 1, "#c8c8d0"); t.P(x + 1, y - 1, "#7a7a84"); t.P(x - 1, y + 1, "#7a7a84"); t.P(x - 2, y - 2, "#e8e8f0"); t.P(x + 2, y + 2, "#e8e8f0"); } },
    sheriff(t) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#2a1408" : d === 1 ? "#a8642a" : "#7a4418");
      t.corners((x, y) => t.star(x, y, "#ffd23f", "#b87a10")); t.star(24, 3, "#ffd23f", "#b87a10"); },
    win95(t) { t.ring(4, (x, y, d, u, s) => d === 0 ? "#000" : s === "t" || s === "l" ? (d === 1 ? "#ffffff" : "#dfdfdf") : (d === 1 ? "#404040" : "#808080"));
      t.Rr(A - 4, A - 9, B - A + 8, 6, "#000080"); t.Rr(A - 4, A - 9, B - A + 8, 1, "#1084d0"); t.Rr(B, A - 8, 3, 3, "#c0c0c0"); t.P(B + 1, A - 7, "#000");
      for (let i = 0; i < 4; i++) t.P(A - 2 + i * 2, A - 7, "#ffffff"); },
    vhs(t) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#000" : "#1a1a1a");
      ["#ff2b6a", "#ffd400", "#00e5ff", "#7aff6a"].forEach((c, i) => t.Rr(A - 4, B + 1 + i, B - A + 8, 1, c));
      t.Rr(A - 3, A - 3, 3, 3, "#ff2a2a"); t.Rr(B, A - 3, 2, 1, "#fff"); },
    blood(t, R) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#2a0004" : d === 1 ? "#d0101e" : "#8a0010");
      for (let i = 0; i < 8; i++) { const x = A - 2 + Math.floor(R() * (B - A + 4)), len = 2 + Math.floor(R() * 6); t.Rr(x, B + 4, 2, len, "#a0081a"); t.Rr(x, B + 4 + len, 2, 2, "#d0101e"); t.P(x, B + 4 + len, "#ff5a6a"); } },
    ice(t, R) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#2a5a8a" : (x + y) % 7 === 0 ? "#ffffff" : d === 1 ? "#c8f0ff" : "#7ac8f0");
      for (let x = A - 3; x < B + 3; x += 3) { const len = 1 + Math.floor(R() * 5); for (let k = 0; k < len; k++) t.Rr(x, B + 4 + k, Math.max(1, 2 - Math.floor(k / 2)), 1, k < 2 ? "#c8f0ff" : "#ffffff"); }
      t.corners((x, y) => { t.P(x, y, "#ffffff"); t.P(x - 1, y, "#c8f0ff"); t.P(x + 1, y, "#c8f0ff"); t.P(x, y - 1, "#c8f0ff"); t.P(x, y + 1, "#c8f0ff"); }); },
    neon(t) { t.ring(5, (x, y, d) => d === 0 ? "#ff2bd688" : d === 1 ? "#ff3ec8" : d === 2 ? "#14001e" : d === 3 ? "#43f0ff" : "#43f0ff66"); },
    matrix(t, R) { t.ring(5, (x, y, d) => d === 0 || d === 4 ? "#003a10" : R() < .45 ? (R() < .3 ? "#d8ffd8" : "#2aff5a") : "#001a06"); },
    fire(t, R) { t.ring(4, (x, y, d) => d === 0 || d === 3 ? "#3a0800" : d === 1 ? "#ff8a1a" : "#d0300a");
      for (let x = A - 4; x < B + 4; x++) { const h = 3 + Math.round(Math.abs(Math.sin(x * .9)) * 4 + R() * 2); for (let k = 0; k < h; k++) t.P(x, A - 4 - k, k > h - 2 ? "#ffe066" : k > h - 4 ? "#ffa01a" : "#ff4a0a"); }
      for (let y = A; y < B + 4; y += 3) { t.P(A - 5, y, "#ff8a1a"); t.P(B + 4, y + 1, "#ff8a1a"); } },
    rainbow(t) { const C = ["#ff3355", "#ff8a1a", "#ffd23f", "#4aff7a", "#3ec8ff", "#6a5aff", "#c86aff"]; t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? "#00000088" : C[Math.floor(u * 28) % 7]); },
    crown(t) { t.bevel("#fff4b0", "#ffd23f", "#b87a10");
      t.Rr(14, 4, 20, 5, "#ffd23f"); t.Rr(14, 8, 20, 1, "#b87a10"); [[14, 0], [23, -1], [32, 0]].forEach(([x, y]) => { t.Rr(x, y + 1, 2, 4, "#ffd23f"); t.P(x, y, "#fff4b0"); });
      t.Rr(18, 2, 2, 3, "#ffd23f"); t.Rr(28, 2, 2, 3, "#ffd23f"); t.P(18, 6, "#ff3355"); t.Rr(23, 5, 2, 2, "#3ec8ff"); t.P(29, 6, "#ff3355"); },
    diamond(t) { t.ring(4, (x, y, d, u) => d === 0 || d === 3 ? "#0a3a5a" : (Math.floor(u * 32) + d) % 3 === 0 ? "#ffffff" : (Math.floor(u * 32) + d) % 3 === 1 ? "#9af0ff" : "#3ac8f0");
      [[A - 6, 16], [B + 5, 30], [20, A - 6], [30, B + 5], [A - 5, B + 4]].forEach(([x, y]) => { t.P(x, y, "#ffffff"); t.P(x - 1, y, "#c8f8ff"); t.P(x + 1, y, "#c8f8ff"); t.P(x, y - 1, "#c8f8ff"); t.P(x, y + 1, "#c8f8ff"); }); },
  };
  // новые рамки. Анимированные рисуются покадрово: f — номер кадра, n — всего кадров
  Object.assign(FRAMES, {
    pixels(t, R) { const C = ["#ff3355", "#ffd23f", "#3ec8ff", "#7aff6a", "#c86aff", "#ffffff"]; t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#000" : C[(x * 7 + y * 13) % C.length])); },
    candy(t) { t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#5a0010" : ((x + y) >> 1) % 3 === 0 ? "#ffffff" : "#e01030")); },
    cards(t) {
      t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#3a2a10" : d === 1 ? "#c8a040" : "#106028"));
      const suit = (x, y, c, k) => { if (k % 2) { t.Rr(x - 1, y - 2, 3, 4, c); t.Rr(x - 2, y - 1, 5, 2, c); } else { t.Rr(x - 2, y - 1, 2, 2, c); t.Rr(x + 1, y - 1, 2, 2, c); t.Rr(x - 2, y, 5, 2, c); t.P(x, y + 2, c); } };
      t.corners((x, y, i) => { t.Rr(x - 3, y - 4, 7, 9, "#f4f0e4"); suit(x, y, i === 1 || i === 2 ? "#c8101a" : "#111", i); });
    },
    shells(t) {
      t.ring(3, (x, y, d) => (d === 1 ? "#5a3a1a" : "#2a1a0a"));
      for (let i = 0; i < 12; i++) { const u = i / 12, p = u * 4, k = Math.floor(p), f = p - k, L = A - 4, M = B + 2, w = M - L;
        const [x, y] = [[L + f * w, L - 1], [M + 1, L + f * w], [M - f * w, M + 1], [L - 1, M - f * w]][k];
        t.Rr(x, y, 3, 3, "#c01020"); t.P(x, y, "#ff5060"); t.Rr(x + (k % 2 ? 0 : 3), y + (k % 2 ? 3 : 0), k % 2 ? 3 : 1, k % 2 ? 1 : 3, "#d8b040"); }
    },
    ghost(t, R, f, n) {                                          // полупрозрачные души плывут по кругу
      t.ring(3, (x, y, d) => (d === 1 ? "#c8d8e888" : "#4a5a6a66"));
      for (let i = 0; i < 5; i++) { const a = (i / 5 + f / n / 5) * Math.PI * 2, x = 24 + Math.cos(a) * 21, y = 24 + Math.sin(a) * 21;
        t.Rr(x - 2, y - 2, 4, 4, "#f0f8ffcc"); t.Rr(x - 1, y + 2, 1, 2, "#f0f8ff88"); t.Rr(x + 1, y + 2, 1, 1, "#f0f8ff66"); t.P(x - 1, y - 1, "#000"); t.P(x + 1, y - 1, "#000"); }
    },
    lightning(t, R, f) {                                         // молнии бьют в разных местах
      t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#0a0a2a" : d === 1 ? "#2a3a8a" : "#1a2060"));
      const spots = [[A - 6, 14], [B + 3, 30], [22, A - 6], [30, B + 3]], [sx, sy] = spots[f % 4];
      let x = sx, y = sy; for (let i = 0; i < 9; i++) { t.Rr(x, y, 2, 2, i % 3 ? "#ffffff" : "#9ad8ff"); x += i % 2 ? 2 : -1; y += 1; }
      t.ring(4, (xx, yy, d) => (d === 1 && (xx + yy + f * 5) % 9 === 0 ? "#c8e8ff" : null));
    },
    lava(t, R, f) {                                              // текущая лава и капли
      t.ring(4, (x, y, d, u) => { if (d === 0 || d === 3) return "#2a0400"; const v = Math.sin(u * 40 - f * 1.6) + (d === 1 ? .4 : 0); return v > .8 ? "#ffd23f" : v > .1 ? "#ff7a10" : "#c02008"; });
      for (let i = 0; i < 4; i++) { const x = 12 + i * 8, len = (f + i) % 4 + 1; t.Rr(x, B + 4, 2, len, "#ff5a10"); t.P(x, B + 4 + len, "#ffd23f"); }
    },
    galaxy(t, R, f, n) {                                         // звёзды мерцают, планета летает вокруг
      t.ring(5, (x, y, d) => (d === 0 || d === 4 ? "#0a0420" : d === 2 ? "#3a1a6a" : "#20104a"));
      for (let i = 0; i < 14; i++) { const a = i * 2.39, r = 21 + (i % 3), x = 24 + Math.cos(a) * r, y = 24 + Math.sin(a) * r; if ((i + f) % 3) t.P(x, y, i % 2 ? "#ffffff" : "#c8a8ff"); }
      const a = (f / n) * Math.PI * 2, px = 24 + Math.cos(a) * 22, py = 24 + Math.sin(a) * 22;
      t.Rr(px - 2, py - 2, 4, 4, "#ff8a3a"); t.P(px - 1, py - 1, "#ffd8a0"); t.Rr(px - 4, py, 8, 1, "#c8a8ff");
    },
    plasma(t, R, f, n) {                                         // переливающаяся плазма
      const C = ["#ff3355", "#ff8a1a", "#ffd23f", "#4aff7a", "#3ec8ff", "#6a5aff", "#c86aff"];
      t.ring(5, (x, y, d) => { if (d === 0) return "#ffffff55"; if (d === 4) return "#00000088"; const v = Math.sin(x * .45 + f / n * 6.28) + Math.sin(y * .4 - f / n * 6.28); return C[Math.floor((v + 2) * 1.74) % C.length]; });
      t.corners((x, y, i) => { if ((i + f) % 2) { t.P(x, y, "#ffffff"); t.P(x - 1, y, "#ffffff88"); t.P(x + 1, y, "#ffffff88"); t.P(x, y - 1, "#ffffff88"); t.P(x, y + 1, "#ffffff88"); } });
    },
    dragon(t, R, f) {                                            // чешуя с бегущим бликом и глаз дракона
      t.ring(5, (x, y, d, u) => { if (d === 0 || d === 4) return "#0a1a08"; const sc = ((x >> 1) + (y >> 1)) % 2; const hl = Math.abs(((u * 4 + f / 4) % 1) - .5) < .07; return hl ? "#e8ff9a" : sc ? (d === 1 ? "#5aa83a" : "#2a7a2a") : "#c8a040"; });
      t.Rr(20, 0, 8, 5, "#c8a040"); t.Rr(22, 1, 4, 3, f === 3 ? "#000" : "#ffd23f"); if (f !== 3) t.Rr(23, 1, 2, 3, "#000");   // глаз моргает
      [[A - 6, A + 2], [B + 4, A + 2]].forEach(([x, y]) => { for (let i = 0; i < 4; i++) t.Rr(x + (x < 24 ? -i : i) * .5, y + i * 2, 2, 2, "#2a7a2a"); });
    },
    bwfire(t, R, f, n) {                                         // рамка Создателя: чёрное кольцо, вокруг пляшет чёрно-белое пламя
      t.ring(3, (x, y, d) => (d === 0 ? "#000000" : d === 1 ? "#2a2a2a" : "#0c0c0c"));
      const C = ["#3a3a3a", "#8a8a8a", "#d8d8d8", "#ffffff"];
      const flame = (x, y, dx, dy, u) => {
        const h = 1 + Math.floor(2.6 * (1 + Math.sin(u * 47 + f * 2.2 + Math.cos(u * 13 - f * 1.3) * 2)));
        for (let k = 0; k < h; k++) t.P(x + dx * k, y + dy * k, C[Math.min(3, Math.floor((k / h) * 4 + (h > 4 ? 1 : 0)))]);
      };
      const L = A - 4, M = B + 3;
      for (let x = L + 1; x < M; x++) { flame(x, L, 0, -1, x / 48); flame(x, M, 0, 1, x / 48 + .5); }
      for (let y = L + 1; y < M; y++) { flame(L, y, -1, 0, y / 48 + .25); flame(M, y, 1, 0, y / 48 + .75); }
      for (let i = 0; i < 6; i++) { const k = (i * 7 + f * 3) % 32; t.P(A + k, A + ((i * 5 + f) % 3), "#ffffffaa"); t.P(B - 1 - ((i * 3 + f) % 3), A + ((k + 9) % 32), "#ffffff88"); }   // искры по краю аватара
      t.corners((x, y, i) => { t.Rr(x - 1, y - 1, 3, 3, "#000"); t.P(x, y, (i + f) % 2 ? "#ffffff" : "#7a7a7a"); });
    },
    // ---- необычные рамки обычных кейсов
    bubbles(t, R, f, n) { t.ring(3, (x, y, d) => (d === 0 ? "#0a3a6a" : d === 1 ? "#3a9ae8" : "#1a6ab8"));
      for (let i = 0; i < 10; i++) { const [x, y] = PER(i / 10 + f / n / 10, 5 + ((i + f) % 3)); t.P(x, y, "#bfefff"); t.P(x + 1, y, "#ffffff88"); if (i % 3 === 0) { t.P(x, y - 1, "#bfefff"); t.P(x - 1, y, "#bfefff"); t.P(x + 1, y + 1, "#7ad8ff"); } } },
    hearts(t, R, f) { t.ring(3, (x, y, d) => (d === 0 || d === 2 ? "#8a0a3a" : "#ff5a9a"));
      const heart = (x, y, big) => { const c = "#ff2a6a"; t.Rr(x - 2, y - 1, 2, 2, c); t.Rr(x + 1, y - 1, 2, 2, c); t.Rr(x - 2, y, 5, 2, c); t.Rr(x - 1, y + 2, 3, 1, c); t.P(x, y + 3, c); if (big) { t.P(x - 3, y, c); t.P(x + 3, y, c); } t.P(x - 1, y - 1, "#ffc0d8"); };
      t.corners((x, y, i) => heart(x, y, (i + f) % 2 === 0)); [[24, A - 4], [24, B + 3]].forEach(([x, y], i) => heart(x, y, (i + f) % 2 === 1)); },
    glass(t) { const C = ["#e8203a", "#2a6ae8", "#ffd23f", "#3ac84a", "#a83ae8", "#ff8a1a"];
      t.ring(5, (x, y, d, u) => (d === 0 || d === 4 || Math.floor(u * 48) % 4 === 0 ? "#141018" : C[Math.floor(u * 12) % C.length] + (d === 1 ? "" : "cc"))); },
    confetti(t, R, f, n) { t.ring(3, (x, y, d) => (d === 1 ? "#ffffff" : "#1a1a2a"));
      const C = ["#ff3355", "#ffd23f", "#3ec8ff", "#7aff6a", "#c86aff", "#ff8a1a"];
      for (let i = 0; i < 26; i++) { const x = (i * 37) % 48, y = ((i * 13) % 48 + f * 4) % 48; if (x > A - 1 && x < B && y > A - 1 && y < B) continue; t.Rr(x, y, (i % 2) + 1, 1 + (i % 3 === 0), C[i % C.length]); } },
    gears(t, R, f, n) { t.ring(4, (x, y, d, u) => (d === 0 || d === 3 ? "#2a1a08" : (Math.floor(u * 64 + f) % 4 < 2) ? "#c8903a" : "#8a5a1a"));
      for (let i = 0; i < 24; i++) { const [x, y] = PER(i / 24 + f / n / 24, 5); if (i % 2) t.Rr(x, y, 2, 2, "#c8903a"); }
      t.corners((x, y) => { t.Rr(x - 2, y - 2, 5, 5, "#8a5a1a"); t.Rr(x - 1, y - 1, 3, 3, "#c8903a"); t.P(x, y, "#2a1a08"); }); },
    eyes(t, R, f, n) { t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#0a0410" : d === 1 ? "#3a1450" : "#2a0a3a"));
      [[A - 3, A - 3], [24, A - 3], [B + 2, A - 3], [A - 3, 24], [B + 2, 24], [A - 3, B + 2], [24, B + 2], [B + 2, B + 2]].forEach(([x, y], i) => {
        if ((i + f) % 4 === 3) { t.Rr(x - 2, y, 5, 1, "#ff3b6b"); return; }                              // моргнул
        t.Rr(x - 2, y - 1, 5, 3, "#f4f0e0"); t.Rr(x - 1, y - 1, 3, 3, "#c8101e"); t.P(x + ((f + i) % 3) - 1, y, "#000000"); t.P(x - 2, y - 1, "#3a1450"); t.P(x + 2, y + 1, "#3a1450"); }); },
    snake(t, R, f, n) { t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#0a0a14" : "#16162a"));
      const C = ["#ff3355", "#ff8a1a", "#ffd23f", "#4aff7a", "#3ec8ff", "#6a5aff", "#c86aff"];
      for (let i = 0; i < 70; i++) { const [x, y] = PER(f / n - i / 160, 2.5); t.Rr(x, y, 2, 2, C[Math.floor(i / 10) % C.length]); }
      const [hx, hy] = PER(f / n, 2.5); t.Rr(hx - 1, hy - 1, 4, 4, "#ff3355"); t.P(hx, hy, "#ffffff"); t.P(hx + 2, hy, "#ffffff"); },
    aquarium(t, R, f, n) { t.ring(6, (x, y, d) => (d === 0 || d === 5 ? "#0a2a4a" : (y + f) % 7 === 0 ? "#5ac8ff" : d < 3 ? "#1a7ac8" : "#1a5aa8"));
      for (let i = 0; i < 4; i++) { const [x, y] = PER(f / n + i / 4, 3); const c = ["#ff8a1a", "#ffd23f", "#ff3b6b", "#7aff6a"][i]; t.Rr(x - 1, y, 3, 2, c); t.P(x - 2, y, c); t.P(x - 2, y + 1, c); t.P(x + 1, y, "#000"); }
      for (let i = 0; i < 6; i++) { const [x, y] = PER(i / 6 + .05, 5); t.P(x, y - ((f + i) % 3), "#bfefff"); } },
    portal(t, R, f, n) { t.ring(6, (x, y, d, u) => { const v = Math.sin(u * Math.PI * 16 + d * 1.3 - f / n * Math.PI * 2); return d === 0 ? "#05020a" : v > .6 ? "#b8ff3a" : v > 0 ? "#6a1ae8" : v > -.6 ? "#3a0a8a" : "#12042a"; });
      for (let i = 0; i < 8; i++) { const [x, y] = PER(i / 8 - f / n / 4, 7); t.P(x, y, i % 2 ? "#b8ff3a" : "#c88aff"); } },
    // ---- сезонные рамки
    s_snow(t) { t.bevel("#e8fbff", "#9be3ff", "#3a8ac8"); [[A - 3, A - 3], [24, A - 3], [B + 2, A - 3], [A - 3, 24], [B + 2, 24], [A - 3, B + 2], [24, B + 2], [B + 2, B + 2]].forEach(([x, y]) => t.star(x, y, "#ffffff", "#7ad8ff")); },
    s_aurora(t, R, f, n) {                                       // северное сияние бежит по кругу, мерцают звёзды
      t.ring(5, (x, y, d, u) => { if (d === 0 || d === 4) return "#04101c"; const v = Math.sin(u * Math.PI * 6 + f / n * Math.PI * 2) + Math.sin(u * Math.PI * 14 - f / n * Math.PI * 2) * .5 + (d - 2) * .3;
        return v > .95 ? "#ffffff" : v > .3 ? "#1affb0" : v > -.3 ? "#2ad8ff" : v > -.9 ? "#7a5aff" : "#2a1a5a"; });
      for (let i = 0; i < 12; i++) { const a = i * 2.1, r = 22 + (i % 2), x = 24 + Math.cos(a) * r, y = 24 + Math.sin(a) * r; if ((i + f) % 3) t.P(x, y, i % 2 ? "#ffffff" : "#bfefff"); }
    },
    s_fangs(t) { t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#1a0004" : d === 1 ? "#8a0a14" : "#5a0610"));
      for (let x = A + 2; x < B - 2; x += 5) { t.Rr(x, A, 2, 1, "#f4f0e0"); t.P(x, A + 1, "#f4f0e0"); t.Rr(x, B - 1, 2, 1, "#f4f0e0"); t.P(x + 1, B - 2, "#f4f0e0"); }
      [[A + 3, B + 4], [B - 6, B + 4], [24, B + 4]].forEach(([x, y], i) => { t.Rr(x, y, 1, 2 + i, "#a0000c"); t.P(x, y + 2 + i, "#ff2a3a"); }); },
    s_bloodmoon(t, R, f, n) {                                    // кровь течёт, луна пульсирует
      t.ring(5, (x, y, d, u) => (d === 0 || d === 4 ? "#120002" : ((u * 60 + d * 3 + f * 2) % 9) < 2 ? "#ff2a3a" : d === 2 ? "#8a0010" : "#5a000a"));
      for (let i = 0; i < 5; i++) { const x = 10 + i * 7, len = (f + i * 2) % 6 + 1; t.Rr(x, B + 4, 2, len, "#a0000c"); t.P(x, B + 4 + len, "#ff2a3a"); }
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy <= 16 + (f % 2) * 3) t.P(B + 3 + dx, A - 3 + dy, dx + dy < -3 ? "#ff8a8a" : f % 2 ? "#ff3b4a" : "#d0202e");
    },
    s_circuit(t) { t.ring(4, (x, y, d) => (d === 0 || d === 3 ? "#021006" : "#0a3a1a"));
      t.ring(4, (x, y, d, u) => (d === 1 && Math.floor(u * 24) % 3 === 0 ? "#d8b040" : d === 2 && Math.floor(u * 24 + 1) % 4 === 0 ? "#d8b040" : null));
      t.corners((x, y) => { t.Rr(x - 1, y - 1, 3, 3, "#d8b040"); t.P(x, y, "#3aff8a"); }); },
    s_holo(t, R, f, n) {                                         // голограмма с бегущими полосами и сбоем
      t.ring(5, (x, y, d, u) => { if (d === 0 || d === 4) return "#00000088"; if ((y + f * 2) % 4 === 0) return "#ffffff"; return ((u * 2 + f / n) % 1) < .5 ? "#00e5ff" : "#ff2bd6"; });
      t.Rr(A - 5 + (f % 2 ? 2 : -2), 10 + f * 5, 8, 2, "#00e5ffaa"); t.Rr(B - 3 - (f % 2 ? 2 : -2), 36 - f * 4, 8, 1, "#ff2bd6aa");
    },
    s_clouds(t) { t.bevel("#ff6a5a", "#c8202a", "#7a0a10", 4); t.ring(4, (x, y, d) => (d === 2 && (x + y) % 6 === 0 ? "#ffd23f" : null));
      [[A - 3, A - 3], [B + 2, A - 3], [A - 3, B + 2], [B + 2, B + 2], [24, A - 3], [24, B + 2]].forEach(([x, y]) => { t.Rr(x - 2, y, 5, 1, "#ffd23f"); t.P(x - 2, y - 1, "#ffd23f"); t.P(x + 2, y + 1, "#ffd23f"); t.P(x, y - 1, "#fff4b0"); }); },
    s_gdragon(t, R, f, n) {                                      // золотой дракон ползёт вокруг аватара
      t.bevel("#fff4b0", "#ffd23f", "#b87a10", 5);
      const h = f / n, L = A - 3, M = B + 2, w = M - L, at = (u) => { const p = ((u % 1) + 1) % 1 * 4, k = Math.floor(p), q = p - k; return [[L + q * w, L], [M, L + q * w], [M - q * w, M], [L, M - q * w]][k]; };
      t.ring(5, (x, y, d, u) => { const k = (h - u + 1) % 1; return k < .35 && d >= 1 && d <= 3 ? (d === 2 ? (Math.floor(u * 90) % 2 ? "#d0202a" : "#ff4a2a") : "#7a0a10") : null; });
      const [hx, hy] = at(h); t.Rr(hx - 2, hy - 2, 5, 5, "#ffd23f"); t.P(hx, hy - 1, "#ff2a2a"); t.P(hx - 2, hy - 3, "#fff4b0"); t.P(hx + 2, hy - 3, "#fff4b0");
    },
    royal(t, R, f, n) {                                          // золото, камни по очереди вспыхивают, корона с искрой
      t.bevel("#fff4b0", "#ffd23f", "#b87a10", 5);
      const gems = ["#ff3355", "#3ec8ff", "#7aff6a", "#c86aff", "#ff3355", "#3ec8ff"];
      for (let i = 0; i < 12; i++) { const u = i / 12, p = u * 4, k = Math.floor(p), q = p - k, L = A - 3, M = B + 2, w = M - L;
        const [x, y] = [[L + q * w, L], [M, L + q * w], [M - q * w, M], [L, M - q * w]][k];
        t.Rr(x - 1, y - 1, 3, 3, "#000"); t.P(x, y, i % n === f ? "#ffffff" : gems[i % gems.length]); }
      t.Rr(14, 3, 20, 5, "#ffd23f"); t.Rr(14, 7, 20, 1, "#b87a10");
      [[14, 0], [23, -2], [32, 0]].forEach(([x, y]) => { t.Rr(x, y + 1, 2, 3, "#ffd23f"); t.P(x, y, "#fff4b0"); });
      t.Rr(23, 4, 2, 2, "#ff3355");
      const sx = 15 + f * 3; t.P(sx, 2, "#ffffff"); t.P(sx - 1, 2, "#ffffffaa"); t.P(sx + 1, 2, "#ffffffaa"); t.P(sx, 1, "#ffffffaa"); t.P(sx, 3, "#ffffffaa");
    },
  });
  ITEMS.filter((x) => x.cat === "frame" && x.pass).forEach((x) => { FRAMES[x.id] = passFrame(PASS_THEMES[Number(x.pass.slice(2)) - 1], !!x.prem); });   // рамки пропуска
  const frameCache = {};
  function frameUrl(key) {
    if (!FRAMES[key]) return "";
    if (frameCache[key]) return frameCache[key];
    const it = byId("frame", key), n = (it && it.strip) || 1;
    const c = document.createElement("canvas"); c.width = N * n; c.height = N;   // анимированная рамка — лента кадров
    const ctx = c.getContext("2d");
    for (let f = 0; f < n; f++) {
      let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
      const R = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 8) / 16777216; };
      ctx.save(); ctx.translate(f * N, 0); FRAMES[key](painter(ctx), R, f, n); ctx.restore();
    }
    return (frameCache[key] = c.toDataURL());
  }
  const frameImg = (key) => {
    if (!key || key === "none" || !FRAMES[key]) return "";
    const it = byId("frame", key);
    if (it && it.strip) return `<i class="frame strip s${it.strip}" style="background-image:url(${frameUrl(key)});animation-duration:${it.speed || 1}s"></i>`;
    return `<img class="frame ${it && it.anim ? "fa-" + it.anim : ""}" src="${frameUrl(key)}" alt="">`;
  };

  /* ---------------------------------------------------------------- кошелёк (store — профиль игрока из app.js) */
  let store = null;
  const today = () => new Date().toISOString().slice(0, 10);
  function attach(s) {
    store = s;
    if (typeof store.coins !== "number") store.coins = 150 + (store.games || 0) * REWARD.game + (store.wins || 0) * REWARD.win;   // стартовый подарок
    store.owned = Array.isArray(store.owned) ? store.owned : [];
    store.look = Object.assign({}, DEFAULT, store.look || {});
  }
  const owns = (it) => (it.price === 0 && !it.excl && !it.season && !it.petcase && !it.mg) || store.owned.includes(it.cat + ":" + it.id);
  const look = () => Object.assign({}, DEFAULT, store.look);
  function buy(it) {
    if (owns(it)) return { ok: true };
    if (store.coins < it.price) return { ok: false, need: it.price - store.coins };
    store.coins -= it.price;
    store.owned.push(it.cat + ":" + it.id);
    return { ok: true, bought: true };
  }
  function equip(it) {
    if (!owns(it)) return false;
    if (it.cat === "ava") store.avatar = it.emoji;
    else store.look[it.cat] = it.id;
    return true;
  }
  // без сервера кейс открывается на телефоне (только вещи)
  function openCaseLocal(key) {
    const c = caseByKey(key);
    if (!c) return { error: "Нет такого кейса" };
    if (store.coins < c.price) return { error: `Не хватает ${c.price - store.coins} монет` };
    store.coins -= c.price;
    const t = rollTier(c.w), it = rollItem(t, c), k = it.cat + ":" + it.id, dup = store.owned.includes(k);
    if (dup) store.coins += DUP[t]; else store.owned.push(k);
    return { type: "item", item: k, tier: t, dup, refund: dup ? DUP[t] : 0 };
  }
  function reward(won, alive) {
    const sum = REWARD.game + (won ? REWARD.win : 0) + (alive ? REWARD.alive : 0);
    store.coins += sum;
    return sum;
  }
  const chestReady = () => store.chest !== today();
  function openChest() {
    if (!chestReady()) return 0;
    const sum = 15 + Math.floor(Math.random() * 10) * 5;        // 15–60 монет
    store.chest = today(); store.coins += sum;
    return sum;
  }
  const ownedAvatars = () => ITEMS.filter((x) => x.cat === "ava" && owns(x)).map((x) => x.emoji);

  /* ---------------------------------------------------------------- карточка профиля в выбранном виде */
  const RANKS = ["Новичок", "Свидетель", "Завсегдатай", "Детектив", "Шулер", "Консильери", "Капо", "Крёстный отец"];
  const level = (games) => Math.floor((games || 0) / 5) + 1;
  const rank = (lv) => RANKS[Math.min(lv - 1, RANKS.length - 1)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const titleText = (lk) => { const t = byId("title", lk.title); return t && t.text ? t.text : ""; };
  const nameFx = (name, fx) => {
    const n = esc(name);
    if (!fx || fx === "none") return `<span class="nmfx">${n}</span>`;
    if (fx === "wave") return `<span class="nmfx fx-wave">${[...String(name)].map((ch, i) => `<i style="animation-delay:${i * .08}s">${esc(ch) === " " ? "&nbsp;" : esc(ch)}</i>`).join("")}</span>`;
    return `<span class="nmfx fx-${fx}" data-t="${n}">${n}</span>`;
  };
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];

  // p: { name, avatarHtml (уже с рамкой), games, wins, coins }, lk — оформление
  function card(p, lk, opts = {}) {
    lk = Object.assign({}, DEFAULT, lk || {});
    const lv = level(p.games), rate = p.games ? Math.round((p.wins / p.games) * 100) : 0;
    const title = titleText(lk) || rank(lv);
    const name = nameFx(p.name, lk.fx);
    const scene = lk.bg && lk.bg !== "none" && typeof Pixel !== "undefined" ? Pixel.scene(lk.bg) : "";
    const bg = scene ? `<div class="pc-scene" style="background-image:url(${scene})"></div>` : `<div class="pc-scene empty"></div>`;
    const avatar = `<div class="pc-av">${p.avatarHtml}</div>`;
    const bar = (v, n = 10) => "█".repeat(Math.round(v * n)) + "░".repeat(n - Math.round(v * n));
    const xp = ((p.games || 0) % 5) / 5;
    const T = {
      rpg: `${bg}<div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div>
          <div class="pc-lv">LV ${lv}</div></div></div>
        <div class="pc-bars"><div class="bar-label">${Pixel.sprite("heart", 2)} Сила · побед ${rate}%</div><div class="bar hp"><i style="width:${Math.max(rate, 3)}%"></i></div>
          <div class="bar-label">${Pixel.sprite("star", 2)} Опыт · до LV ${lv + 1}: ${5 - ((p.games || 0) % 5)} игр</div><div class="bar xp"><i style="width:${Math.max(xp * 100, 3)}%"></i></div></div>
        <div class="pc-loot">${Pixel.sprite("end", 2)} ×${p.wins || 0}<span>${Pixel.sprite("star", 2)} ×${p.games || 0}</span>${Pixel.sprite("skull", 2)} ×${Math.max(0, (p.games || 0) - (p.wins || 0))}</div>`,
      dossier: `<div class="pc-tab">ДЕЛО № ${String(1000 + (p.games || 0) * 7).slice(-4)}</div><div class="pc-body"><div class="pc-photo">${avatar}<i class="clip"></i></div>
          <div class="pc-main"><div class="pc-field"><i>Имя</i><b class="pc-name">${name}</b></div><div class="pc-field"><i>Кличка</i><b>${esc(title)}</b></div>
          <div class="pc-field"><i>Дел раскрыто</i><b>${p.wins || 0} из ${p.games || 0}</b></div><div class="pc-field"><i>Уровень опасности</i><b>${lv}</b></div></div></div>
        <div class="pc-evidence">${bg}<span>Место последней встречи</span></div><div class="pc-stamp">Совершенно секретно</div>`,
      terminal: `<div class="pc-head">&gt; ДОСЬЕ ЖИТЕЛЯ БУНКЕРА_</div>${bg}<div class="pc-body">${avatar}<div class="pc-main">
          <div>ИМЯ....... <b class="pc-name">${name}</b></div><div>СТАТУС.... ${esc(title)}</div><div>УРОВЕНЬ... ${lv}</div></div></div>
        <pre class="pc-pre">ПОБЕДЫ  [${bar(rate / 100)}] ${rate}%\nОПЫТ    [${bar(xp)}] ${Math.round(xp * 100)}%\nПАРТИЙ  ${p.games || 0}   ВЫЖИЛ ${p.wins || 0}</pre>`,
      vhs: `<div class="pc-top"><span>VHS</span><span>E-180 · SP</span></div><div class="pc-label">${bg}<div class="pc-body">${avatar}<div class="pc-main">
          <div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div></div></div></div>
        <div class="pc-stripes"><i></i><i></i><i></i><i></i></div><div class="pc-rec"><b>●</b> REC · LV ${lv} · ${p.wins || 0} побед · ${p.games || 0} игр</div>`,
      badge: `<div class="pc-hole"></div><div class="pc-co"><b>ООО «Мафия»</b><span>пропуск № ${String(4000 + (p.games || 0))}</span></div>${bg}
        <div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div>
          <div class="pc-dept">Уровень доступа: ${lv} · Побед: ${p.wins || 0}</div></div></div><div class="pc-barcode"></div>`,
      tarot: `<div class="pc-num">${ROMAN[Math.min(lv, 20) - 1]}</div><div class="pc-window">${bg}${avatar}</div><div class="pc-name">${name}</div>
        <div class="pc-sub">✦ ${esc(title)} ✦</div><div class="pc-stats">${p.games || 0} партий · ${p.wins || 0} побед · ${rate}%</div>`,
      wanted: `<div class="pc-w1">Разыскивается</div><div class="pc-w2">живым или мёртвым</div><div class="pc-photo">${bg}${avatar}</div>
        <div class="pc-name">${name}</div><div class="pc-sub">по кличке «${esc(title)}»</div>
        <div class="pc-reward">Награда $${((p.wins || 0) * 100 + 50).toLocaleString("ru-RU")}</div><div class="pc-stats">${p.games || 0} дел · уровень ${lv}</div>`,
      vip: `<div class="pc-shine"></div><div class="pc-top"><b>VIP</b><span>НАСТОЛКИНО · CLUB</span></div><div class="pc-chipx"></div>
        <div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div></div></div>
        <div class="pc-num">${String(4000 + (p.games || 0) * 37).padStart(4, "0")} ${String(1000 + (p.wins || 0) * 91).slice(-4)} ${String(lv).padStart(2, "0")}${String(rate).padStart(2, "0")} ${String(p.coins || 0).padStart(4, "0").slice(-4)}</div>
        <div class="pc-foot"><span>LV ${lv}</span><span>${p.wins || 0} побед</span><span>${rate}%</span></div>${bg}`,
      s_ice: `<div class="pc-frost"></div>${bg}<div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div></div></div>
        <div class="pc-foot"><span>❄ LV ${lv}</span><span>${p.wins || 0} побед</span><span>${rate}%</span></div>`,
      s_moon: `<div class="pc-moon"></div><div class="pc-name">${name}</div><div class="pc-sub">— ${esc(title)} —</div><div class="pc-window">${bg}${avatar}</div>
        <div class="pc-stats">${p.games || 0} ночей · ${p.wins || 0} побед · уровень ${lv}</div>`,
      s_neon: `<div class="pc-scan"></div>${bg}<div class="pc-top"><b>CYBER·ID</b><span>#${String(1000 + (p.games || 0) * 13).slice(-4)}</span></div>
        <div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div><div class="pc-code">LV ${lv} · WIN ${rate}%</div></div></div><div class="pc-barcode"></div>`,
      s_dragon: `${bg}<div class="pc-seal">龍</div><div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div>
          <div class="pc-code">Уровень ${lv} · ${p.wins || 0} побед</div></div></div>`,
      creator: `<div class="pc-flames"><i></i><i></i><i></i></div>${bg}<div class="pc-seal">✦ СОЗДАТЕЛЬ ✦</div>
        <div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div>
          <div class="pc-admin">ADMIN · НАСТОЛКИНО</div></div></div>
        <div class="pc-foot"><span>LV ${lv}</span><span>${p.wins || 0} побед</span><span>${p.games || 0} партий</span></div>`,
      arcade: `${bg}<div class="pc-hs">HIGH SCORE</div><div class="pc-body">${avatar}<div class="pc-main"><div class="pc-p1">PLAYER 1</div>
          <div class="pc-name">${name}</div><div class="pc-sub">${esc(title)}</div></div></div>
        <div class="pc-table"><div><span>LEVEL</span><b>${String(lv).padStart(2, "0")}</b></div><div><span>WINS</span><b>${String(p.wins || 0).padStart(3, "0")}</b></div>
          <div><span>GAMES</span><b>${String(p.games || 0).padStart(3, "0")}</b></div><div><span>RATE</span><b>${rate}%</b></div></div>`,
    };
    return `<div class="pcard pc-${lk.style} ${opts.mini ? "mini" : ""}">${T[lk.style] || T.rpg}</div>`;
  }

  // демо-образы для скриншотов (гости в разных рамках)
  function demo(i) {
    if (!store) return;
    const sets = [null, ["gold", "space", "tarot", "bluff", "gold"], ["fire", "halloween", "wanted", "silent", "fire"], ["neon", "arcade", "arcade", "soul", "rainbow"],
      ["crown", "sakura", "badge", "godfather", "glow"], ["web", "dungeon", "dossier", "paranoid", "glitch"], ["ice", "winter", "terminal", "eye", "wave"]];
    const s = sets[i]; if (!s) return;
    ["frame", "bg", "style", "title", "fx"].forEach((k, j) => { store.look[k] = s[j]; store.owned.push(k + ":" + s[j]); });
    store.games = 5 + i * 4; store.wins = 2 + i * 2;
    if (typeof saveProfile === "function") { saveProfile(); if (typeof syncProfile === "function") syncProfile(); }
  }

  return { CATS, ITEMS, DEFAULT, REWARD, TIERS, CASES, DUP, POOL, poolOf, SEASONS, seasonByKey, seasonPool, tier, caseByKey, rollTier, rollItem, openCaseLocal, byKey, byId, attach, owns, look, buy, equip, reward, chestReady, openChest, ownedAvatars, frameImg, frameUrl,
    card, nameFx, level, rank, titleText, demo, get coins() { return store ? store.coins : 0; } };
})();
