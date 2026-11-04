/* Питомцы: гены + мутации → уникальное существо.
   ДНК = 32 hex-символа генов (форма, цвет, уши, глаза, рот, узор, хвост, нрав…) + до трёх байт мутаций (их выдаёт сервер).
   Гены задают основу, мутации меняют облик поверх: зомби, вампир, огненный, сиамские близнецы…
   Рисуем пиксель-арт 40×40, 6 кадров анимации. */
"use strict";

(function (root) {
  const RARITY = [
    { name: "Обычный", color: "#b8b8c8" }, { name: "Редкий", color: "#4fa8ff" }, { name: "Эпический", color: "#b05cff" },
    { name: "Легендарный", color: "#ffb020" }, { name: "Мифический", color: "#ff4f9a" },
  ];
  // порядок еды обязан совпадать с server/worker.js (FOODS)
  const FOOD_KEYS = ["korm", "zhuk", "kasha", "sup", "konfeta", "yagody", "ryba", "syr", "pirog", "kotleta"];
  const FOOD_EMOJI = { korm: "🥣", zhuk: "🪲", kasha: "🍚", sup: "🍲", konfeta: "🍬", yagody: "🫐", ryba: "🐟", syr: "🧀", pirog: "🥟", kotleta: "🍖", zoloto: "🍏",
    pechenka: "🍪", morozhenoe: "🍦", tort: "🍰", energetik: "🥤", baton: "🍫", bronya: "🥫", perets: "🌶️", pyl: "✨", rost: "🍼", rost2: "🧃", dnk: "🍭" };
  const NAME_A = ["Шур", "Бул", "Мяк", "Хрум", "Пух", "Тоф", "Зю", "Бяк", "Кус", "Моч", "Фыр", "Жуж", "Плюх", "Тык", "Бор", "Гиз", "Чух", "Вин", "Ляп", "Ням", "Шмыг", "Бубл", "Крак", "Тяп"];
  const NAME_B = ["ик", "ша", "зя", "ок", "уся", "ыш", "он", "ка", "ля", "ёнок", "мяк", "ус", "ня", "бас"];
  const SOCIAL = [
    { name: "Одиночка", desc: "любит тишину, не терпит, когда его часто тискают" },
    { name: "Сам по себе", desc: "то ласковый, то гордый — как повезёт" },
    { name: "Компанейский", desc: "обожает внимание и быстро скучает один" },
  ];
  const TEMPER = ["Ленивый", "Шустрый", "Гордый", "Застенчивый", "Жадный", "Игривый", "Ворчливый", "Мечтательный", "Храбрый", "Хитрый"];
  const HOBBY = ["коллекционирует пуговицы", "смотрит на дождь", "считает звёзды", "строит башни из крошек", "охотится на носки",
    "поёт по ночам", "катается по полу", "прячется в коробках", "нюхает цветы", "грызёт карандаши", "слушает, как тикают часы",
    "гоняет пылинки", "спит на клавиатуре", "собирает фантики", "рисует лапой на стекле", "пугает тени",
    "пускает мыльные пузыри", "танцует под радио", "ловит бабочек", "медитирует", "собирает камушки", "копает ямки", "вьёт гнездо из носков", "гоняется за солнечным зайчиком",
    "подражает звукам", "смотрит мультики", "жонглирует орешками", "качается на шторах", "сочиняет стихи", "охраняет свою миску", "изучает звёздное небо", "строит рожицы"];
  const QUIRK = ["чихает, когда радуется", "боится огурцов", "храпит громче хозяина", "обижается на будильник", "любит, когда чешут пузо",
    "не любит, когда трогают уши", "засыпает посреди игры", "ревнует к телефону", "приносит подарки (обычно мусор)",
    "смотрит в одну точку по полчаса", "икает после еды", "здоровается с холодильником",
    "разговаривает во сне", "боится пылесоса", "чихает от пыли", "ходит задом наперёд", "прячет еду про запас", "обнимает игрушку во сне",
    "лает на почтальона", "ворует носки", "кривляется перед зеркалом", "мурчит, когда хвалят", "боится грозы", "считает овечек перед сном"];
  // что хобби и странность дают в игре (те же числа — в server/worker.js)
  const HOBBY_FX = [
    ["🔘", "Бронежилет из пуговиц: +2 к защите в бою"], ["🌧", "Философ: настроение падает на четверть медленнее"],
    ["✨", "Звездочёт: +5% к криту, ночью +10%"], ["🍞", "Ничего не пропадает: еда сытнее на 10%"],
    ["🧦", "Охотник: +5% к атаке"], ["🎵", "Поёт в бою: противник заслушивается и пропускает ход"],
    ["🌀", "Колобок: +4% к уклонению"], ["📦", "Прячется в коробку: первый удар по нему — мимо"],
    ["🌸", "Ценитель: лакомства радуют на 30% сильнее"], ["✏️", "Острые зубки: +3% к атаке и +2% к криту"],
    ["⏰", "Пунктуальный: +2 к скорости"], ["·", "Шустрик: энергия копится на четверть быстрее"],
    ["⌨️", "Соня: энергия копится быстрее, но может задремать в бою"], ["🍬", "Фантиковед: лакомства ещё и сытные (+10)"],
    ["🖐", "Художник: игры с игрушками радуют на 25% сильнее"], ["👤", "«БУ!»: в начале боя пугает врага — его атака −5%"],
    ["🫧", "Пузырёк: мини-игры радуют на 25% сильнее"], ["📻", "Танцор: +2 к скорости"],
    ["🦋", "Ловкач: +3% к уклонению и +2% к криту"], ["🧘", "Дзен: настроение падает на 30% медленнее"],
    ["🪨", "Каменщик: +2 к защите"], ["🕳", "Землекоп: в бою зарывается — +5% к уклонению"],
    ["🧦", "Гнездо: энергия копится на четверть быстрее"], ["☀️", "Зоркий: +3% к криту"],
    ["🦜", "Пересмешник: иногда передразнивает и бьёт ещё раз"], ["📺", "Мультяшка: лакомства радуют на 20% сильнее"],
    ["🥜", "Жонглёр: +4% к атаке"], ["🪟", "Акробат: +1 к скорости, +2% к уклонению"],
    ["📜", "Поэт: от поглаживаний +3 к радости"], ["🥣", "Сторож миски: еда сытнее на 8%"],
    ["🔭", "Астроном: ночью +5% к атаке"], ["🤪", "Кривляка: в начале боя смешит врага — его защита −2"],
  ];
  const QUIRK_FX = [
    "Когда счастлив — чихает", "Огурец среди игрушек — ужас и −10 к настроению", "Храпит во сне — слышно на весь экран",
    "Утром (7–9 по Москве) ворчит на будильник", "Гладить — радость сильнее (+6)", "Иногда обижается, если задеть уши",
    "Может уснуть посреди боя", "Ревнует к телефону", "Раз в день приносит подарок: мусор, монеты или еду",
    "Иногда зависает и смотрит в одну точку", "После еды икает", "Здоровается с холодильником",
    "Во сне бормочет что-то своё", "Боится пылесоса — дрожит и прячется", "Чихает, когда пыльно", "Иногда ходит задом наперёд",
    "Иногда не доедает и прячет порцию — еда возвращается в кладовку (15%)", "Спит в обнимку с игрушкой", "Лает на почтальона, даже если он кот",
    "Таскает носки и приносит их тебе", "Кривляется перед зеркалом", "Мурчит, когда хвалят: поглаживания +4", "Боится грозы — прячется под одеяло", "Перед сном считает овечек",
  ];
  const SHAPES = ["Колобок", "Шарик", "Бобик", "Грушка", "Призрачок", "Кубик", "Капелька"];

  // мутации: номер (байт в ДНК) обязан совпадать с server/worker.js (MUTS)
  const MUTATIONS = [
    [1, "giant", "size", "🗻", "Великан", "вымахал заметно крупнее сородичей"],
    [2, "tiny", "size", "🐜", "Кроха", "крошечный, помещается на ладошке"],
    [3, "pirate", "costume", "🏴‍☠️", "Пират", "бандана и повязка на глазу"],
    [4, "ninja", "costume", "🥷", "Ниндзя", "повязка и маска, ходит бесшумно"],
    [5, "wizard", "costume", "🧙", "Маг", "остроконечная шляпа со звездой"],
    [6, "hero", "costume", "🦸", "Супергерой", "плащ, маска и эмблема на груди"],
    [7, "cyborg", "costume", "🤖", "Киборг", "пол-морды железные, глаз-лазер, антенна"],
    [10, "zombie", "creature", "🧟", "Зомби", "зеленоватый, со швами и заплаткой"],
    [11, "mummy", "creature", "🧻", "Мумия", "весь в бинтах, виден один глаз"],
    [12, "ghost", "creature", "👻", "Призрак", "полупрозрачный, парит над полом"],
    [13, "skeleton", "creature", "💀", "Скелет", "видны рёбрышки, вместо глаз — глазницы"],
    [14, "vampire", "creature", "🧛", "Вампир", "бледный, клыки, плащ с высоким воротником"],
    [15, "werewolf", "creature", "🐺", "Оборотень", "шерсть торчком, волчьи уши, жёлтые глаза"],
    [16, "demon", "creature", "😈", "Демон", "рожки, красная шкура и хвост со стрелкой"],
    [17, "angel", "creature", "😇", "Ангел", "нимб и крылышки"],
    [18, "cthulhu", "creature", "🐙", "Ктулху", "щупальца вместо рта — древний и загадочный"],
    [19, "glitch", "creature", "📺", "Глитч", "иногда рассыпается на пиксели"],
    [20, "sixeyes", "eyes", "👁", "Шестиглазый", "шесть глаз — видит всё сразу"],
    [21, "bigeye", "eyes", "🧿", "Всевидящее око", "один огромный глаз"],
    [30, "twins", "twin", "👯", "Сиамские близнецы", "две головы на одном теле"],
    [31, "pair", "twin", "💞", "Сиамская пара", "два РАЗНЫХ существа срослись в одно — невероятная редкость"],
    [40, "fire", "element", "🔥", "Огненный", "вечно горит, но хозяина не обжигает"],
    [41, "ice", "element", "❄️", "Ледяной", "холодный, на макушке ледяные шипы"],
    [42, "storm", "element", "⚡", "Грозовой", "искрит молниями"],
    [43, "shadow", "element", "🌑", "Теневой", "соткан из тьмы, светятся только глаза"],
    [44, "crystal", "element", "💎", "Кристальный", "на спине растут кристаллы"],
    [45, "cosmic", "element", "🌌", "Космический", "внутри него мерцают звёзды"],
    [46, "bwfire", "element", "🔥", "Чёрно-белое пламя", "горит чёрно-белым огнём — такого пламени нет больше ни у кого"],
    [50, "cerberus", "twin", "🐕", "Цербер", "три головы, у каждой по три глаза. Ему не нужна еда — никогда"],
    [47, "phoenixfire", "element", "🔥", "Белое пламя феникса", "бело-серое пламя, из которого он рождается снова и снова"],
    [51, "phoenix", "creature", "🐦", "Феникс", "огненная птица: сгорает и возрождается из пепла — умереть насовсем не может"],
    // только от мутагенов (шприцы)
    [22, "threeeyes", "eyes", "👁", "Третий глаз", "глаз во лбу видит то, что скрыто: +5% к криту"],
    [60, "albino", "color", "🤍", "Альбинос", "белоснежный, с красными глазами"],
    [61, "melanist", "color", "🖤", "Меланист", "угольно-чёрный, только глаза горят"],
    [62, "golden", "color", "🥇", "Золотой", "шкура блестит чистым золотом"],
    [63, "rainbow", "color", "🌈", "Радужный", "переливается всеми цветами радуги"],
    [64, "antennae", "head", "📡", "Антенны", "ловит сигналы из космоса: +2 к скорости"],
    [65, "mushroom", "head", "🍄", "Грибница", "на макушке выросли грибы: +8 к здоровью"],
    [66, "horns", "head", "🦌", "Рога", "ветвистые рога: +2 к атаке"],
    [67, "slime", "slime", "🟢", "Слизень", "весь в слизи — по нему сложно попасть"],
    [68, "spikes", "spikes", "🦔", "Иглы", "на спине иглы: +2 к защите"],
    [69, "mustache", "face", "🥸", "Усач", "пышные усы, как у дворецкого"],
  ].map(([id, key, group, emoji, name, desc]) => ({ id, key, group, emoji, name, desc }));
  // коллекционные питомцы: каждый — в одном экземпляре на весь мир, не голодают, их нельзя потерять. Выдаёт только администратор.
  // Номера и бонусы обязаны совпадать с server/worker.js (COLLECT)
  const COLLECT = [
    [112, "dragon_gold", "dragons", 4, 5, "🐉", "Золотой дракон", "Сокровищница: раз в день приносит подарок. В бою +3 к атаке и +15 к здоровью", { hp: 15, atk: 3 }],
    [113, "dragon_black", "dragons", 4, 5, "🖤", "Чёрный дракон", "Тьма: +15% к уклонению, поджигает чёрным пламенем, ночью бьёт сильнее", { dodge: .15, burn: .2, night: .1 }],
    [114, "dragon_white", "dragons", 3, 4, "🤍", "Белый дракон", "Священный свет: +4 к защите, каждые три хода лечится", { def: 4, regen: .1 }],
    [115, "dragon_emerald", "dragons", 3, 4, "💚", "Изумрудный дракон", "Хранитель леса: +20 к здоровью, лечится, энергия копится вдвое быстрее", { hp: 20, regen: .05 }],
    [116, "dragon_ice", "dragons", 2, 3, "🧊", "Ледяной дракон", "Ледяное дыхание: +3 к скорости, часто замораживает", { spd: 3, freeze: .3 }],
    [117, "dragon_fire", "dragons", 2, 3, "🔥", "Огненный дракон", "Пламя: +2 к атаке, поджигает чаще всех", { atk: 2, burn: .35 }],
    [118, "spirit_fire", "spirits", 2, 2, "🔥", "Дух огня", "Пляшущее пламя: +2 к скорости, поджигает", { spd: 2, burn: .25 }],
    [119, "spirit_water", "spirits", 2, 2, "💧", "Дух воды", "Всегда спокоен: настроение не падает, в бою лечится", { regen: .08 }],
    [120, "spirit_earth", "spirits", 3, 3, "🪨", "Дух земли", "Каменная кожа: +6 к защите, +10 к здоровью", { def: 6, hp: 10 }],
    [121, "spirit_wind", "spirits", 3, 3, "🌪", "Дух ветра", "Неуловимый: +5 к скорости, +15% к уклонению", { spd: 5, dodge: .15 }],
  ].map(([id, key, set, rarity, hard, emoji, name, desc, fx]) => ({ id, key, set, rarity, hard, emoji, name, desc, fx }));
  const COLLECT_SETS = {
    dragons: { name: "Драконы", emoji: "🐉", bonus: "3 дракона у хозяина — все его драконы бьют на 5% сильнее. Все 6 — титул «Повелитель драконов»" },
    spirits: { name: "Стихийные духи", emoji: "🌀", bonus: "Все 4 — титул «Хранитель стихий»" },
  };
  COLLECT.forEach((c) => MUTATIONS.push({ id: c.id, key: c.key, group: "collect", emoji: c.emoji, name: c.name, desc: c.desc }));
  const MUT_ID = Object.fromEntries(MUTATIONS.map((m) => [m.id, m]));
  const collectOf = (dna) => { const s = String(dna).slice(32); for (let i = 0; i + 2 <= s.length; i += 2) { const c = COLLECT.find((x) => x.id === parseInt(s.slice(i, i + 2), 16)); if (c) return c; } return null; };
  // мутагены: 200 шприцов, у каждого своё название и своя мутация (так же считает server/worker.js)
  const MG_EFFECTS = ["giant", "tiny", "pirate", "ninja", "wizard", "hero", "cyborg", "zombie", "mummy", "ghost", "skeleton", "vampire", "werewolf", "demon", "angel", "cthulhu", "glitch",
    "sixeyes", "bigeye", "threeeyes", "twins", "fire", "ice", "storm", "shadow", "crystal", "cosmic", "albino", "melanist", "golden", "rainbow", "antennae", "mushroom", "horns", "slime", "spikes", "mustache"];
  const MG_ADJ = ["Багровый", "Ледяной", "Тёмный", "Звёздный", "Кислотный", "Древний", "Безумный", "Лунный", "Ржавый", "Хрустальный"];
  const MG_NOUN = ["туман", "коктейль", "эликсир", "яд", "нектар", "раствор", "концентрат", "серум", "бульон", "сок", "штамм", "вирус", "ген", "катализатор", "реагент", "экстракт", "дистиллят", "фермент", "вихрь", "импульс"];
  const MG_COUNT = 200;
  const mgMut = (n) => MUTATIONS.find((m) => m.key === MG_EFFECTS[((n - 1) * 7) % MG_EFFECTS.length]);
  const mgName = (n) => `${MG_ADJ[(n - 1) % 10]} ${MG_NOUN[Math.floor((n - 1) / 10) % MG_NOUN.length]}`;
  // шприц: одна текстура на все мутагены
  const syringe = (size = 40) => `<svg class="mg-syr" width="${size}" height="${size}" viewBox="0 0 16 16" shape-rendering="crispEdges"><g transform="rotate(40 8 8)">
    <rect x="5" y="0" width="6" height="1" fill="#cfd6e0"/><rect x="7" y="1" width="2" height="3" fill="#8a94a6"/><rect x="4" y="4" width="8" height="1" fill="#cfd6e0"/>
    <rect x="5" y="5" width="6" height="7" fill="#24303f"/><rect x="6" y="5" width="4" height="7" fill="#e8f2ff"/><rect x="6" y="8" width="4" height="4" fill="#4dff88"/><rect x="6" y="8" width="1" height="4" fill="#b8ffd0"/>
    <rect x="9" y="6" width="1" height="1" fill="#8a94a6"/><rect x="9" y="9" width="1" height="1" fill="#2a9a52"/><rect x="7" y="12" width="2" height="1" fill="#8a94a6"/><rect x="7.5" y="13" width="1" height="3" fill="#dfe6ee"/></g></svg>`;

  // игрушки и «приколы» на голову: выбиваются только из кейса «Питомник». Порядок обязан совпадать с server/worker.js
  const TOYS = [["ball", "Мячик", "⚽", 0], ["mouse", "Мышка на верёвочке", "🐭", 0], ["yarn", "Клубок", "🧶", 0], ["bone", "Косточка", "🦴", 0], ["sock", "Носок", "🧦", 0],
    ["bell", "Колокольчик", "🔔", 0], ["duck", "Резиновая уточка", "🦆", 1], ["feather", "Перо на палочке", "🪶", 1], ["frisbee", "Фрисби", "🥏", 1], ["box", "Коробка", "📦", 1],
    ["cucumber", "Огурец", "🥒", 1], ["teddy", "Плюшевый мишка", "🧸", 2], ["yoyo", "Йо-йо", "🪀", 2], ["kite", "Воздушный змей", "🪁", 2], ["laser", "Лазерная указка", "🔴", 3], ["rocket", "Космо-ракета", "🚀", 3]];
  const HATS = [["party", "Колпак", 0], ["bow", "Бантик", 0], ["flower", "Цветочек", 0], ["ushanka", "Ушанка", 1], ["tophat", "Цилиндр", 1], ["propeller", "Кепка с пропеллером", 1],
    ["chef", "Поварской колпак", 1], ["bucket", "Ведро", 2], ["viking", "Шлем викинга", 2], ["kingcrown", "Корона короля питомцев", 3],
    ["phalo", "Сияющий нимб", 4], ["pcrown", "Звёздная корона", 4]];                  // последние два — только из премиум-пропуска
  // «фишки»: особенности с настоящим влиянием на игру. Порядок обязан совпадать с server/worker.js
  const PERKS = [
    ["glutton", "Обжора", "🍗", "еда насыщает его меньше — проголодается быстро, корми чаще (зато каждая кормёжка радует)"],
    ["picky", "Малоежка", "🥄", "наедается маленькой порцией — еда сытнее в 1,4 раза"],
    ["sweet", "Сладкоежка", "🍬", "лакомства радуют вдвое сильнее и сытные, обычной еде не рад"],
    ["gourmet", "Гурман", "🧀", "любимая еда — вдвое лучше, остальная его не впечатляет"],
    ["fidget", "Непоседа", "⚡", "энергия восстанавливается в полтора раза быстрее"],
    ["lazy", "Лежебока", "🛋", "силы копит медленно, зато в бою толще: +5% здоровья"],
    ["bully", "Задира", "👊", "в бою бьёт на 8% сильнее"],
    ["coward", "Трусишка", "🙈", "бьёт слабее, зато ловко уворачивается"],
    ["lucky", "Везунчик", "🍀", "чаще бьёт критом"],
    ["cuddly", "Ласковый", "🤗", "от поглаживаний вдвое больше радости"],
    ["prickly", "Колючка", "🌵", "не любит, когда гладят, зато в бою +3 защиты"],
    ["player", "Игрун", "🎾", "игрушки радуют в полтора раза сильнее, реже скучает"],
    ["calm", "Тихоня", "🤫", "грустит вдвое медленнее"],
    ["drama", "Драма", "🎭", "все чувства — в полтора раза сильнее, и радость, и обида"],
  ].map(([key, name, emoji, desc]) => ({ key, name, emoji, desc }));
  const PERK_CLASH = [["glutton", "picky"], ["bully", "coward"], ["cuddly", "prickly"], ["fidget", "lazy"]];
  const byte = (dna, i) => parseInt(String(dna).slice(i * 2, i * 2 + 2), 16) || 0;
  function perks(dna) {
    const a = PERKS[byte(dna, 0) % PERKS.length], out = [a];
    if (byte(dna, 1) % 3 === 0) { const b = PERKS[(byte(dna, 1) >> 2) % PERKS.length]; if (b !== a && !PERK_CLASH.some((c) => c.includes(a.key) && c.includes(b.key))) out.push(b); }
    return out;
  }
  // как питомец относится к игрушкам (так же считает сервер)
  function toyPrefs(dna) {
    const v = byte(dna, 13) >> 4, fav = TOYS[byte(dna, 6) % TOYS.length][0];
    const mode = v < 4 ? "one" : v < 9 ? "easy" : v < 13 ? "some" : "lots";
    const dislikes = [];
    for (let k = 1; dislikes.length < 3 && k < 12; k++) { const t = TOYS[(byte(dna, 7) + k * 5) % TOYS.length][0]; if (t !== fav && !dislikes.includes(t)) dislikes.push(t); }
    if (byte(dna, 13) % QUIRK.length === 1 && fav !== "cucumber" && !dislikes.includes("cucumber")) dislikes.push("cucumber");   // боится огурцов
    const memory = Math.max(0, { one: 0, easy: 0, some: 2, lots: 4 }[mode] - (perks(dna).some((p) => p.key === "player") ? 1 : 0));
    return { fav, mode, memory, dislikes };
  }
  // режим сна: совы спят днём, жаворонки — ночью (время московское). Так же считает сервер.
  const CHRONO = [{ key: "owl", name: "Сова", desc: "днём спит (8:00–18:00), ночью бодрствует" }, { key: "lark", name: "Жаворонок", desc: "ночью спит (22:00–7:00), днём бодр" },
    { key: "any", name: "Как придётся", desc: "спит, когда захочет" }];
  const chrono = (dna) => CHRONO[Math.min(2, byte(dna, 10) % 5)];
  function sleepState(dna, t = Date.now() / 1000) {
    const h = Math.floor((t / 3600 + 3) % 24), c = chrono(dna).key;
    if (c === "owl" && h >= 8 && h < 18) return { asleep: true, wake: 18 };
    if (c === "lark" && (h >= 22 || h < 7)) return { asleep: true, wake: 7 };
    return { asleep: false };
  }
  const name = (dna) => NAME_A[byte(dna, 0) % NAME_A.length] + NAME_B[byte(dna, 1) % NAME_B.length];
  const receptive = (dna) => (byte(dna, 4) >> 2) % 5 === 0 && !collectOf(dna);   // принимает мутагены (значок 🧬) — каждый пятый
  // во сне не голодает; в домике голодает вчетверо медленнее (так же считает сервер)
  const SLEEP_WIN = [[8, 18], [22, 31]];
  function asleepSec(dna, a, b) {
    if (b <= a) return 0;
    const c = Math.min(2, byte(dna, 10) % 5);
    if (c === 2) return 0;
    const [s, e] = SLEEP_WIN[c], H = 3600, D = 86400, d0 = Math.floor((a + 3 * H) / D) - 1, d1 = Math.floor((b + 3 * H) / D);
    let sum = 0;
    for (let d = d0; d <= d1 && d - d0 < 400; d++) { const ws = d * D - 3 * H + s * H, we = d * D - 3 * H + e * H; sum += Math.max(0, Math.min(b, we) - Math.max(a, ws)); }
    return sum;
  }
  const hungerAt = (dna, fullAt, den, t = Date.now() / 1000) => Math.max(0, Math.min(100, Math.round(100 - (t - fullAt - .3 * asleepSec(dna, fullAt, t)) * (den ? .25 : 1) / 864)));
  // сколько раз в день сам хочет поиграть в мини-игры (компанейские — много, одиночки — раз)
  function funWant(dna, stage) {
    const s = byte(dna, 4) % 3, pk = perks(dna).map((p) => p.key);
    let w = (s === 2 ? 5 : s === 1 ? 3 : 1) + (stage === "b" ? 2 : stage === "t" ? 1 : 0);
    if (pk.includes("player")) w += 2;
    if (pk.includes("calm") || pk.includes("lazy")) w = Math.max(1, w - 1);
    return w;
  }
  // рост: малыш → подросток → взрослый (grown — когда станет взрослым)
  const STAGES = { b: { name: "Малыш", emoji: "🍼", mul: .7, care: "скучает в полтора раза быстрее и хочет играть чаще" }, t: { name: "Подросток", emoji: "🌱", mul: .85, care: "скучает чуть быстрее взрослых" }, "": { name: "Взрослый", emoji: "", mul: 1, care: "" } };
  const stageOf = (grown, t = Date.now() / 1000) => (!grown || t >= grown ? "" : t >= grown - 2 * 86400 ? "t" : "b");
  function muts(dna) {
    const s = String(dna).slice(32), out = [];
    for (let i = 0; i + 2 <= s.length; i += 2) { const m = MUT_ID[parseInt(s.slice(i, i + 2), 16)]; if (m && !out.includes(m)) out.push(m); }
    return out;
  }
  // гены второго в сиамской паре — выводятся из генов первого (так же на сервере)
  function partner(dna) {
    let s = "";
    for (let i = 0; i < 16; i++) s += (((byte(dna, (i + 5) % 16) ^ 0x5a) + i * 29) & 255).toString(16).padStart(2, "0");
    return s;
  }
  function fullName(dna) {
    const cl = collectOf(dna); if (cl) return cl.name;
    const ks = muts(dna).map((m) => m.key);
    return ks.includes("phoenix") ? "Феникс" : ks.includes("cerberus") ? "Цербер" : ks.includes("pair") ? `${name(dna)} & ${name(partner(dna))}` : ks.includes("twins") ? `${name(dna)}-${name(dna)}` : name(dna);
  }
  function traits(dna) {
    const fav = FOOD_KEYS[byte(dna, 5) % FOOD_KEYS.length];
    const dis = FOOD_KEYS[(FOOD_KEYS.indexOf(fav) + 1 + (byte(dna, 6) % (FOOD_KEYS.length - 1))) % FOOD_KEYS.length];
    const all = muts(dna), ms = all.filter((m) => m.group !== "collect"), pair = ms.some((m) => m.key === "pair"), p2 = pair ? partner(dna) : null, cl = collectOf(dna);
    return {
      name: fullName(dna), social: byte(dna, 4) % 3, fav, dis, shape: isGen2(dna) && byte(dna, 2) % 17 >= 7 ? SHAPES2[byte(dna, 2) % 17 - 7] : SHAPES[byte(dna, 2) % SHAPES.length], gen2: isGen2(dna), menace: isGen2(dna) && isMenace(dna),
      temper: TEMPER[byte(dna, 12) % TEMPER.length], hobby: HOBBY[byte(dna, 11) % HOBBY.length], quirk: QUIRK[byte(dna, 13) % QUIRK.length],
      code: String(dna).slice(0, 4).toUpperCase() + "-" + String(dna).slice(28, 32).toUpperCase(),
      perks: perks(dna), quirkIdx: byte(dna, 13) % QUIRK.length, hobbyIdx: byte(dna, 11) % HOBBY.length, chrono: chrono(dna), toys: toyPrefs(dna),
      muts: ms, element: ms.find((m) => m.group === "element") || null, immortal: !!cl || ms.some((m) => m.key === "cerberus"), collect: cl, reborn: ms.some((m) => m.key === "phoenix"),
      partner: p2 ? { name: name(p2), temper: TEMPER[byte(p2, 12) % TEMPER.length], hobby: HOBBY[byte(p2, 11) % HOBBY.length] } : null,
    };
  }
  // боевые характеристики — те же формулы в server/worker.js (petStats)
  function stats(dna, rarity) {
    const ks = muts(dna).map((m) => m.key);
    let hp = 70 + (byte(dna, 2) % 31) + rarity * 12, atk = 10 + (byte(dna, 7) % 9) + rarity * 3, def = 5 + (byte(dna, 10) % 7) + rarity * 2, spd = 5 + (byte(dna, 14) % 9) + rarity;
    if (ks.includes("giant")) hp = Math.round(hp * 1.2);
    if (ks.includes("tiny")) spd += 3;
    if (ks.includes("cyborg") || ks.includes("mummy")) def += 3;
    if (ks.includes("demon")) atk = Math.round(atk * 1.15);
    if (ks.includes("hero")) { hp += 6; atk += 1; def += 1; spd += 1; }
    if (ks.includes("cerberus")) { hp = Math.round(hp * 1.15); atk += 2; }
    if (ks.includes("phoenix")) { atk += 2; spd += 3; }
    if (ks.includes("horns")) atk += 2;
    if (ks.includes("spikes")) def += 2;
    if (ks.includes("mushroom")) hp += 8;
    if (ks.includes("antennae")) spd += 2;
    const cl = collectOf(dna);
    if (cl) { hp += cl.fx.hp || 0; atk += cl.fx.atk || 0; def += cl.fx.def || 0; spd += cl.fx.spd || 0; }
    return { hp, atk, def, spd };
  }
  // что умеет в бою (из мутаций и стихии)
  const SKILLS = {
    fire: "поджигает врага", ice: "может заморозить", storm: "чаще бьёт критом", shadow: "уворачивается", crystal: "кристальный щит",
    cosmic: "подлечивается звёздами", vampire: "пьёт здоровье", zombie: "встаёт один раз после поражения", angel: "лечится, когда плохо",
    werewolf: "звереет на половине здоровья", cthulhu: "оглушает щупальцами", twins: "бьёт дважды", pair: "бьёт дважды", wizard: "магия пробивает защиту",
    cerberus: "кусает тремя пастями", phoenix: "раз за бой возрождается из пепла", phoenixfire: "поджигает белым пламенем", bwfire: "поджигает чёрно-белым огнём", ghost: "уворачивается", ninja: "уворачивается", tiny: "юркий", glitch: "телепортируется от ударов", sixeyes: "меткий", bigeye: "меткий",
    threeeyes: "меткий", slime: "скользкий — уворачивается", horns: "бодается", spikes: "колючий", mushroom: "крепкий", antennae: "быстрый",
  };
  const skills = (dna) => muts(dna).filter((m) => SKILLS[m.key] || m.group === "collect").map((m) => ({ emoji: m.emoji, text: SKILLS[m.key] || m.desc }));
  const rarityName = (rarity, dna) => { const cl = collectOf(dna); if (cl) return RARITY[rarity].name + " · коллекция «" + COLLECT_SETS[cl.set].name + "»"; const el = muts(dna).find((m) => m.group === "element"); return RARITY[rarity].name + (el ? " · " + el.name : ""); };

  /* ---------------------------------------------------------------- цвета */
  const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${Math.max(0, Math.min(100, s))}% ${Math.max(0, Math.min(100, l))}%)`;
  function palette(dna, rarity, M) {
    const hue = Math.round(byte(dna, 3) * 360 / 256), hue2 = hue + 140 + (byte(dna, 14) % 80);
    const sat = [42, 62, 74, 80, 88][rarity], fluke = byte(dna, 15);
    let base = { h: hue, s: sat, l: 58 }, skin = "normal";
    const over = M.albino ? { h: hue, s: 8, l: 92 } : M.melanist ? { h: hue, s: 22, l: 13 } : M.golden ? { h: 44, s: 92, l: 56 } : M.cerberus ? { h: 0, s: 0, l: 17 } : M.zombie ? { h: 95, s: 24, l: 52 } : M.vampire ? { h: 265, s: 14, l: 84 } : M.mummy ? { h: 40, s: 34, l: 76 }
      : M.ghost ? { h: 195, s: 45, l: 86 } : M.skeleton ? { h: 250, s: 14, l: 22 } : M.werewolf ? { h: 26, s: 26, l: 44 }
      : M.demon ? { h: 356, s: 70, l: 46 } : M.angel ? { h: 46, s: 60, l: 90 } : M.cthulhu ? { h: 168, s: 40, l: 44 }
      : M.ice ? { h: 194, s: 72, l: 74 } : M.shadow ? { h: 265, s: 34, l: 16 } : M.cosmic ? { h: 238, s: 58, l: 20 } : null;
    if (over) { base = over; skin = "mut"; }
    else if (fluke >= 252 - rarity * 3) { skin = "albino"; base = { h: hue, s: 8, l: 90 }; }          // редкие окрасы
    else if (fluke < 3 + rarity * 2) { skin = "shadow"; base = { h: hue, s: 30, l: 16 }; }
    else if (rarity >= 3 && fluke % 7 === 0) { skin = "gold"; base = { h: 44, s: 92, l: 56 }; }
    const rainbow = M.rainbow || (rarity === 4 && skin === "normal"), dark = base.l < 30 && !rainbow;
    const step = M.rainbow ? 55 : 14;                                          // мутаген «Радужный» — вся радуга сверху вниз
    return {
      skin, hue, hue2,
      body: (dy) => (rainbow ? hsl(hue + dy * step, 85, 62) : hsl(base.h, base.s, base.l)),
      light: (dy) => (rainbow ? hsl(hue + dy * step, 90, 78) : hsl(base.h, base.s - 6, base.l + (dark ? 10 : 14))),
      dark: (dy) => (rainbow ? hsl(hue + dy * step, 70, 44) : hsl(base.h, base.s + 4, base.l - (dark ? 8 : 18))),
      line: M.cerberus ? "#ededed" : dark ? hsl(M.shadow ? 275 : hue, 70, 55) : hsl(base.h, Math.min(60, base.s), 14),
      accent: hsl(hue2, Math.max(50, sat), 60), accentDark: hsl(hue2, Math.max(50, sat), 42),
      eye: M.albino ? "#ff2b4b" : M.cerberus ? "#ffffff" : M.vampire ? "#ff2b3b" : M.werewolf || M.demon || M.mummy ? "#ffd23b" : M.shadow || skin === "shadow" ? hsl(M.shadow ? 280 : hue2, 100, 70) : dark ? "#f4f0ff" : "#14121c",
      glow: M.golden ? "#ffd23f" : M.cerberus || M.bwfire ? "#ffffff" : RARITY[rarity].color,
    };
  }

  /* ---------------------------------------------------------------- второе поколение: новые формы, глаза, рты и детали.
     Метка — контрольная сумма в байтах 14–15 (ставит сервер при рождении). У питомцев, созданных раньше, её нет — их облик не меняется */
  function isGen2(dna) {
    const hex = String(dna).slice(0, 32); if (hex.length < 32) return false;
    let h = 0x9e37; for (let i = 0; i < 14; i++) h = ((h * 31) ^ parseInt(hex.slice(i * 2, i * 2 + 2), 16) ^ (h >>> 7)) & 0xffff;
    return parseInt(hex.slice(28, 32), 16) === h;
  }
  const SHAPES2 = ["Растекашка", "Двойняшка", "Кристаллик", "Грибок", "Облачко", "Пушистик", "Броненосец", "Гусеничка", "Голем", "Звёздочка"];
  const MENACE = [2, 6, 8, 9];                                                   // гордый, ворчливый, храбрый, хитрый — выглядят грозно
  const isMenace = (dna) => MENACE.includes(byte(dna, 12) % 10);

  /* ---------------------------------------------------------------- форма тела по генам */
  const W = 40;
  function geo(dna, f, dead, cx, bottom, scale, M, g2) {
    const shape = M.ghost ? 4 : g2 ? byte(dna, 2) % 17 : byte(dna, 2) % 7;
    let rx = 7 + (byte(dna, 8) >> 6) + (shape === 3 || shape === 0 ? 1 : 0), ry = 7 + ((byte(dna, 9) >> 6) & 1) + (shape === 2 ? 2 : 0);
    if (shape === 2) rx -= 1;
    if (shape === 7 || shape === 13) { rx += 1; ry -= 1; }                     // растекашка и броненосец — шире и ниже
    if (shape === 10) { rx -= 1; ry += 1; }                                    // грибок — шляпка шире тела
    if (shape === 14) ry += 2;                                                 // гусеничка — высокая
    rx *= scale; ry *= scale;
    if (!dead && !M.ghost && (f === 1 || f === 3)) { rx += 1; ry -= 1; }
    const cy = bottom - ry;
    const inside = (x, y) => {
      const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry;
      if (v > 1 || v < -1.3) return false;
      switch (shape) {
        case 0: return Math.pow(Math.abs(u), 2.4) + Math.pow(Math.abs(v), 2.4) <= 1;
        case 3: { const w = .68 + .32 * (v + 1) / 2; return (u / w) ** 2 + v * v <= 1; }
        case 4: return v < 0 ? u * u + v * v <= 1 : Math.abs(u) <= 1 && v <= .82 + .16 * Math.sin(u * Math.PI * 2.5 + f * 1.3);
        case 5: return u ** 4 + v ** 4 <= 1;
        case 6: { const w = Math.sqrt(Math.max(.02, (v + 1) / 2)); return (u / w) ** 2 + v * v <= 1 && v > -1; }
        case 7: return v < .25 ? u * u + v * v <= 1 : Math.abs(u) <= .97 + (v - .25) * .55 + (Math.sin(u * 9 + f * .9) > .6 ? .06 : 0);   // растекается лужицей
        case 8: return ((u + .5) / .55) ** 2 + ((v + .05) / .9) ** 2 <= 1 || ((u - .5) / .55) ** 2 + ((v + .05) / .9) ** 2 <= 1 || (v > .35 && Math.abs(u) < .9);   // два шарика срослись
        case 9: return v < 0 ? Math.abs(u) + Math.abs(v) * .66 <= 1 : Math.abs(u) <= 1 - v * .38;   // гранёный кристалл
        case 10: return v < -.1 ? (u / 1.32) ** 2 + ((v + .1) / .9) ** 2 <= 1 : Math.abs(u) <= .66 + (v > .75 ? .08 : 0);   // шляпка и ножка
        case 11: return ((u + .52) / .5) ** 2 + ((v + .02) / .55) ** 2 <= 1 || (u / .62) ** 2 + ((v + .4) / .6) ** 2 <= 1 || ((u - .52) / .5) ** 2 + ((v + .02) / .55) ** 2 <= 1 || (v > 0 && Math.abs(u) < .96);   // облачко
        case 12: { const a = Math.atan2(v, u), r = .9 + .11 * Math.sin(a * 11 + f * .8); return u * u + v * v <= r * r; }   // пушистик: шерсть торчит
        case 13: return v <= .82 && (u / 1.12) ** 2 + ((v - .62) / 1.55) ** 2 <= 1;   // панцирь броненосца
        case 14: return u * u / .34 + ((v + .5) / .5) ** 2 <= 1 || (u / .78) ** 2 + ((v - .32) / .66) ** 2 <= 1;   // гусеничка: голова и туловище
        case 15: return u ** 6 + v ** 6 <= 1 && !(Math.abs(u) > .78 && v < -.72);   // голем: каменная глыба
        case 16: { const a = Math.atan2(v, u), r = .74 + .26 * Math.cos(5 * a + Math.PI / 2); return u * u + v * v <= r * r; }   // звёздочка
        default: return u * u + v * v <= 1;
      }
    };
    const top = Math.round(cy - ry * (shape === 6 ? 1 : shape === 7 || shape === 13 ? .95 : shape === 14 ? 1 : .92));
    const eyeY = Math.round(cy - ry * (shape === 10 ? -.28 : shape === 14 ? .52 : shape === 7 ? .3 : shape === 16 ? .02 : .12));
    return { shape, rx, ry, cx, cy, bottom, inside, top, eyeY, eX: Math.max(2, Math.round(rx * .4)), mY: eyeY + 3, ex: Math.round(rx * .55) };
  }

  /* ---------------------------------------------------------------- Феникс: белая огненная птица, поднятые крылья машут, хвост струится, горит бело-серым пламенем */
  function phoenixFrame(dna, f, dead, sleep) {
    const g = Array.from({ length: W }, () => Array(W).fill(null));
    const solid = Array.from({ length: W }, () => Array(W).fill(false));
    const put = (x, y, c, s = true) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < W) { g[y][x] = c; if (s) solid[y][x] = true; } };
    const empty = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < W && !g[y][x]; };
    const side = (fn) => { fn(-1); fn(1); };
    const tint = [[0, 0], [220, 10], [40, 9], [260, 8]][byte(dna, 3) % 4];       // гены: чистый, холодный, тёплый или лунный оттенок белого
    const G = (l) => hsl(tint[0], tint[1], l);
    const C = { line: G(9), dark: G(34), mid: G(56), light: G(78), white: G(95) };
    const live = !dead, cx = 19.5, bob = live && !sleep ? [0, -1, -1, 0, 1, 1][f] : 0, flap = live && !sleep ? [0, 1, 2, 1, 0, -1][f] : -2;
    const by = 22 + bob, hy = 12 + bob;
    // хвост: широкий веер из пяти перьев, струится
    [-2, -1, 0, 1, 2].forEach((k) => {
      const len = 12 - Math.abs(k);
      for (let j = 0; j < len; j++) {
        const sway = live ? Math.sin(j * .45 + f * 1.05 + k) * .8 * (j / len) : 0;
        const x = cx + k * (1.2 + j * .55) + sway, y = by + 6 + j * .78;
        const col = j > len - 3 ? C.white : j > len * .45 ? C.light : C.mid;
        put(x - .5, y, col); put(x + .5, y, k ? col : C.light); if (j > 1 && j < len - 2) put(x + (k < 0 ? -1.5 : 1.5), y, C.mid);
      }
    });
    // крылья: по пять маховых перьев, подняты буквой V
    const tips = [];
    side((s) => {
      const sx = cx + s * 3.5, sy = by - 4;
      [78, 63, 48, 34, 21].forEach((deg, i) => {
        const a = (deg - flap * 7) * Math.PI / 180, len = [12, 15, 16, 14, 11][i] + (byte(dna, 2 + i) % 2);
        for (let j = 0; j <= len; j++) {
          const x = sx + s * Math.cos(a) * j, y = sy - Math.sin(a) * j;
          const col = j > len * .72 ? C.white : j > len * .4 ? C.light : C.mid;
          put(x, y, col); put(x, y + 1, j > len * .72 ? C.light : C.mid);
          if (j === len) tips.push([x, y, s, a]);
        }
      });
      for (let r = 0; r < 6; r++) {                                                // кроющие перья у плеча
        const a = (70 - r * 10 - flap * 5) * Math.PI / 180;
        for (let j = 0; j < 6; j++) put(sx + s * Math.cos(a) * j, sy - Math.sin(a) * j + 1, r % 2 ? C.mid : C.dark);
      }
    });
    // тело-капля с пёрышками на груди
    for (let y = by - 7; y <= by + 7; y++) for (let x = 0; x < W; x++) {
      const v = (y + .5 - by) / 7.5, w = 5.2 * Math.sqrt(Math.max(0, 1 - v * v)) * (v < 0 ? .78 + .22 * (1 + v) : 1);
      const u = (x + .5 - cx) / Math.max(.1, w);
      if (Math.abs(u) > 1) continue;
      const lit = -(u * .45 + v * .6);
      let c = lit > .45 ? C.white : lit > -.1 ? C.light : lit > -.55 ? C.mid : C.dark;
      if (Math.abs(u) < .7 && v > -.4 && y % 2 === 0 && (x + (y >> 1)) % 3 === 0) c = C.mid;  // чешуйки-пёрышки
      put(x, y, c);
    }
    for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 15) put(cx + x - .5, hy + y, -(x + y) > 2 ? C.white : (x + y) > 3 ? C.mid : C.light);   // голова
    for (let y = hy + 3; y <= by - 6; y++) for (let x = -2; x <= 2; x++) put(cx + x - .5, y, C.light);   // шея
    // контур
    const out = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!solid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid[y + b] && solid[y + b][x + a])) out.push([x, y]);
    out.forEach(([x, y]) => put(x, y, C.line, false));
    // бело-серое пламя: хохолок, кончики крыльев, хвост, бока
    const flame = (x, y, h, dx = 0) => { for (let k = 0; k < h; k++) if (empty(x + dx * k, y - k)) put(x + dx * k + (live ? Math.sin(k + f * 1.7 + x) * .6 : 0), y - k, k > h - 2 ? "#ffffff" : k > h / 2 ? "#dcdce6" : "#9a9aa8", false); };
    if (live) {
      [-2, 0, 2].forEach((k, i) => flame(cx - .5 + k, hy - 5, 3 + ((i + f) % 3) + (k ? 0 : 2), k * .25));
      tips.forEach(([x, y, s2], i) => flame(x + s2, y - 1, 2 + ((i + f) % 3), s2 * .4));
      [-2, 0, 2].forEach((k, i) => flame(cx + k * (1.2 + 9 * .55), by + 15, 2 + ((i + f) % 2), 0));
      side((s2) => { for (let i = 0; i < 3; i++) { const y = by - 3 + i * 4 + (f % 2); flame(cx + s2 * 6.5, y, 2 + ((i + f) % 2), s2 * .5); } });
    } else for (let k = -2; k <= 2; k++) put(cx + k * 2, hy - 5, C.mid, false);
    // глаза и клюв
    [[cx - 2.5, hy], [cx + 1.5, hy]].forEach(([x, y]) => {
      if (dead) { put(x, y - 1, C.line); put(x + 1, y, C.line); put(x, y + 1, C.line); return; }
      if (f === 5 || sleep) { put(x, y, C.line); put(x + 1, y, C.line); return; }
      put(x - 1, y, C.dark); put(x + 2, y, C.dark); put(x - 1, y - 1, C.dark); put(x, y - 1, C.dark); put(x + 1, y - 1, C.dark); put(x + 2, y - 1, C.dark);   // «маска»
      put(x, y, "#ffffff"); put(x + 1, y, "#101018"); put(x, y + 1, "#101018"); put(x + 1, y + 1, "#101018");
    });
    put(cx - .5, hy + 2, C.dark); put(cx + .5, hy + 2, C.dark); put(cx - .5, hy + 3, C.line);
    const fx = [];
    if (live) for (let i = 0; i < 5; i++) fx.push([[5, 34, 9, 30, 3, 36][(f + i * 2) % 6], [6, 10, 3, 4, 15, 8][(f * 2 + i) % 6] + (i % 2) * 3, i % 2 ? "#dcdce6" : "#ffffff"]);
    return { g, fx, glow: live ? "#ffffff" : null, ghost: false, glitch: false, hatAt: hatPoint(solid, cx) };
  }

  /* ---------------------------------------------------------------- коллекционные: драконы */
  const DRAGON_PAL = {
    dragon_gold: { body: "#f2b818", dark: "#a86e06", light: "#ffe27a", belly: "#fff1b8", wing: "#c97f0a", memb: "#ffcf4a", horn: "#fff6d8", eye: "#e8301a", line: "#4a2a00", glow: "#ffd23f", fx: ["#fff6b0", "#ffd23f"] },
    dragon_black: { body: "#2c2438", dark: "#130d1b", light: "#4a3c62", belly: "#5c4a78", wing: "#1a1226", memb: "#5a2a8a", horn: "#d8d0e8", eye: "#c04aff", line: "#000000", glow: "#8a4aff", fx: ["#b07aff", "#4a1a7a"] },
    dragon_white: { body: "#eceff8", dark: "#a4adc8", light: "#ffffff", belly: "#ffffff", wing: "#b8c4e0", memb: "#dbe8ff", horn: "#8aa0c8", eye: "#2aa8ff", line: "#4a5070", glow: "#ffffff", fx: ["#ffffff", "#c8e4ff"] },
    dragon_emerald: { body: "#2fae5a", dark: "#17673a", light: "#6fe08a", belly: "#d0f0a0", wing: "#1b7a40", memb: "#86eca4", horn: "#f0e6b0", eye: "#ffd23f", line: "#0a2a14", glow: "#6aff8a", fx: ["#a8ff7a", "#2fae5a"] },
    dragon_ice: { body: "#8fd8ff", dark: "#3a86c8", light: "#e0f8ff", belly: "#ffffff", wing: "#4aa0dc", memb: "#c4eeff", horn: "#ffffff", eye: "#1a3a98", line: "#0a2a50", glow: "#8fe0ff", fx: ["#ffffff", "#bff0ff"] },
    dragon_fire: { body: "#e2401c", dark: "#8a1a0a", light: "#ff8a3a", belly: "#ffd04a", wing: "#9a1c08", memb: "#ff9a3a", horn: "#2a1a10", eye: "#ffe14d", line: "#2a0800", glow: "#ff6a2a", fx: ["#fff3a0", "#ff8a1f"] },
  };
  function dragonFrame(key, dna, f, dead, sleep) {
    const c = DRAGON_PAL[key];
    const g = Array.from({ length: W }, () => Array(W).fill(null)), solid = Array.from({ length: W }, () => Array(W).fill(false));
    const put = (x, y, col, s = true) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < W) { g[y][x] = col; if (s) solid[y][x] = true; } };
    const empty = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < W && !g[y][x]; };
    const side = (fn) => { fn(-1); fn(1); };
    const live = !dead, calm = sleep || dead, cx = 19.5, bob = calm ? 0 : [0, -1, -1, 0, 1, 1][f], flap = calm ? -3 : [0, 1, 2, 1, 0, -1][f];
    const by = 28 + bob, hy = 14 + bob;
    // крылья (сзади): кость от плеча к кончику, перепонка, два «пальца»
    side((s) => {
      const sx = cx + s * 4, sy = by - 6, a = (38 + flap * 9) * Math.PI / 180, len = calm ? 10 : 14;
      const tx = sx + s * Math.cos(a) * len, ty = sy - Math.sin(a) * len, lx = cx + s * 15, ly = by + 2;
      const inTri = (x, y) => { const d = (x1, y1, x2, y2) => (x - x2) * (y1 - y2) - (x1 - x2) * (y - y2); const d1 = d(sx, sy, tx, ty), d2 = d(tx, ty, lx, ly), d3 = d(lx, ly, sx, sy); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (inTri(x + .5, y + .5)) put(x, y, (x + y) % 5 === 0 ? c.light : c.memb);
      for (let j = 0; j <= len; j++) { put(sx + s * Math.cos(a) * j, sy - Math.sin(a) * j, c.wing); put(sx + s * Math.cos(a) * j, sy - Math.sin(a) * j + 1, c.wing); }
      [[.45, .55], [.8, .9]].forEach(([k1, k2]) => { const fx0 = tx + (lx - tx) * k1, fy0 = ty + (ly - ty) * k1; for (let j = 0; j <= 10; j++) { const t = j / 10; put(tx + (fx0 - tx) * t * 1 + 0, ty + (fy0 - ty) * t, c.wing); } void k2; });
      put(tx, ty - 1, c.horn);                                                          // коготок на сгибе
    });
    // хвост: изгибается вправо и вверх, на конце — пика
    let tx2 = 0, ty2 = 0;
    for (let j = 0; j < 12; j++) {
      const x = cx + 5 + j * 1.05, y = by + 5 - j * .7 + (live && !sleep ? Math.sin(j * .6 + f * 1.05) * 1.1 : 0);
      put(x, y, c.body); if (j < 8) put(x, y + 1, c.dark); tx2 = x; ty2 = y;
    }
    [[1, 0], [2, 0], [1, -1], [2, -1], [3, -1], [1, 1], [2, -2], [2, 1]].forEach(([a, b]) => put(tx2 + a, ty2 + b, c.dark));
    // лапки
    side((s) => { const fx = Math.round(cx + s * 4.5); for (let k = 0; k < 3; k++) { put(fx - 1, by + 5 + k, c.dark); put(fx, by + 5 + k, c.body); put(fx + 1, by + 5 + k, c.dark); } [-1, 0, 1].forEach((a) => put(fx + a, by + 8, c.horn)); });
    // туловище с брюшком
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const u = (x + .5 - cx) / 7.2, v = (y + .5 - by) / 7; if (u * u + v * v > 1) continue;
      const lit = -(u * .5 + v * .7);
      let col = lit > .5 ? c.light : lit < -.5 ? c.dark : c.body;
      const bu = (x + .5 - cx) / 3.6, bv = (y + .5 - by - 1) / 5.6;
      if (bu * bu + bv * bv <= 1) col = y % 2 ? c.belly : c.light;
      put(x, y, col);
    }
    for (let y = hy + 4; y <= by - 5; y++) for (let x = -2; x <= 2; x++) put(cx + x - .5, y, x === 2 ? c.dark : x === -2 ? c.light : c.body);   // шея
    // голова и морда
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const u = (x + .5 - cx) / 6.6, v = (y + .5 - hy) / 5.6; if (u * u + v * v > 1) continue;
      const lit = -(u * .5 + v * .7); put(x, y, lit > .5 ? c.light : lit < -.55 ? c.dark : c.body);
    }
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const u = (x + .5 - cx) / 4.2, v = (y + .5 - hy - 3.6) / 2.6; if (u * u + v * v <= 1) put(x, y, v < -.2 ? c.light : c.belly); }
    // рога и гребень
    side((s) => { const bx = cx + s * 3.6; [[0, 0], [s * .5, -1], [s, -2], [s * 1.6, -3], [s * 2.4, -4], [s * 3.4, -4.4]].forEach(([a, b], i) => { put(bx + a, hy - 4 + b, c.horn); if (i < 3) put(bx + a + s, hy - 4 + b, c.horn); }); });
    [[-.5, 0], [-.5, -1], [.5, -1]].forEach(([a, b]) => put(cx + a, hy - 5.5 + b, c.dark));
    // контур
    const out = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!solid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid[y + b] && solid[y + b][x + a])) out.push([x, y]);
    out.forEach(([x, y]) => put(x, y, c.line, false));
    // особенности вида
    if (key === "dragon_gold") { const y0 = hy - 7; [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [0, -1], [2, -1], [-2, -2], [0, -2], [2, -2]].forEach(([a, b]) => put(cx - .5 + a, y0 + b, b === 0 ? "#c8900a" : "#ffe14d", false)); put(cx - .5, y0, "#e8203a", false); }
    if (key === "dragon_emerald") side((s) => { const bx = cx + s * 6.4, y0 = hy - 8; put(bx, y0, "#5ad84a", false); put(bx + s, y0, "#2a9a2a", false); put(bx, y0 - 1, "#8aff6a", false); });
    if (key === "dragon_ice") [-3, -1, 1, 3].forEach((a, i) => { for (let k = 0; k < 2 + (i % 2); k++) put(cx - .5 + a, hy + 6.5 + k, k ? "#ffffff" : "#c8f0ff", false); });
    if (key === "dragon_black") side((s) => { put(cx + s * 7.5, by - 2, c.memb, false); put(cx + s * 8, by - 1, c.memb, false); });
    // глаза: вертикальный зрачок
    [[cx - 3.5, hy - .5], [cx + 2.5, hy - .5]].forEach(([x, y]) => {
      if (dead) { put(x - .5, y - 1, c.line); put(x + 1.5, y + 1, c.line); put(x + 1.5, y - 1, c.line); put(x - .5, y + 1, c.line); put(x + .5, y, c.line); return; }
      if (sleep || f === 5) { put(x - .5, y, c.line); put(x + .5, y, c.line); put(x + 1.5, y, c.line); return; }
      put(x - .5, y - 1, c.eye); put(x + .5, y - 1, c.eye); put(x + 1.5, y - 1, c.eye); put(x - .5, y, c.eye); put(x + 1.5, y, c.eye); put(x - .5, y + 1, c.eye); put(x + 1.5, y + 1, c.eye);
      put(x + .5, y, "#08060c"); put(x + .5, y + 1, "#08060c"); put(x + .5, y - 1, "#08060c"); put(x - .5, y - 1, "#ffffff");
    });
    put(cx - 2, hy + 3, c.dark); put(cx + 1, hy + 3, c.dark);                                    // ноздри
    if (!dead) { for (let a = -2; a <= 2; a++) put(cx + a - .5, hy + 5, c.line); put(cx + 1.5, hy + 6, "#ffffff"); put(cx - 2.5, hy + 6, "#ffffff"); }
    // эффекты (без контура)
    const fx = [];
    if (live && !sleep) {
      if (key === "dragon_gold" || key === "dragon_white") for (let i = 0; i < 3; i++) fx.push([[3, 36, 5, 34, 2, 37][(f + i * 2) % 6], [30, 34, 26, 31, 36, 28][(f * 2 + i) % 6], c.fx[i % 2]]);
      if (key === "dragon_fire" || key === "dragon_black") [-2, 1].forEach((a, i) => { for (let k = 0; k < 2 + ((f + i) % 3); k++) if (empty(cx + a + (k % 2 ? .5 : 0), hy + 2 - k)) put(cx + a + (k % 2 ? 1 : 0), hy + 1 - k - 2, k ? c.fx[1] : c.fx[0], false); });
      if (key === "dragon_ice" || key === "dragon_white") fx.push([[6, 33, 10, 29, 5, 34][f], [24, 30, 20, 26, 32, 22][f], "#ffffff"]);
      if (key === "dragon_emerald") fx.push([[7, 30, 12, 27, 5, 33][f], 2 + f * 5, f % 2 ? "#8aff6a" : "#2fae5a"]);
    }
    return { g, fx, glow: live ? c.glow : null, ghost: false, glitch: false, hatAt: hatPoint(solid, cx) };
  }

  /* ---------------------------------------------------------------- коллекционные: стихийные духи */
  const SPIRIT_PAL = {
    spirit_fire: { a: "#ff4a1f", b: "#ff9a2a", c: "#fff3a0", line: "#6a1400", eye: "#2a0800", glow: "#ff8a2a", fx: ["#ffd23f", "#ff6a1f"] },
    spirit_water: { a: "#1a6ad8", b: "#3ab4ff", c: "#c8f0ff", line: "#0a2a6a", eye: "#08143a", glow: "#3ab4ff", fx: ["#ffffff", "#8fe0ff"] },
    spirit_earth: { a: "#6a4a2a", b: "#8a6a3a", c: "#c8a870", line: "#2a1a08", eye: "#1a1008", glow: "#a8d85a", fx: ["#5aa83a", "#a88a5a"] },
    spirit_wind: { a: "#7accb8", b: "#bff0e2", c: "#ffffff", line: "#2a6a5a", eye: "#123a32", glow: "#c8f4e8", fx: ["#ffffff", "#bff0e2"] },
  };
  function spiritFrame(key, dna, f, dead, sleep) {
    const c = SPIRIT_PAL[key];
    const g = Array.from({ length: W }, () => Array(W).fill(null)), solid = Array.from({ length: W }, () => Array(W).fill(false));
    const put = (x, y, col, s = true) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < W) { g[y][x] = col; if (s) solid[y][x] = true; } };
    const side = (fn) => { fn(-1); fn(1); };
    const live = !dead, calm = sleep || dead, cx = 19.5, bob = calm ? 1 : [0, -1, -2, -1, 0, 1][f], cy = 25 + bob, r = 8.5;
    const sway = calm ? 0 : Math.sin(f * 1.05) * 2.6, tipY = cy - (key === "spirit_earth" ? 11 : 17);
    for (let y = Math.floor(tipY); y <= Math.ceil(cy + r); y++) {
      let hw, shift = 0;
      if (y >= cy) hw = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      else { const t = (cy - y) / (cy - tipY); hw = r * Math.pow(1 - t, key === "spirit_earth" ? .6 : 1.3); shift = sway * t * t; }
      for (let x = Math.floor(cx - hw + shift); x <= Math.ceil(cx + hw + shift); x++) {
        const d = Math.abs(x + .5 - cx - shift) / Math.max(.6, hw), dy = (y - cy) / r;
        if (d > 1) continue;
        let col = d < .35 && dy > -.9 ? c.c : d < .7 ? c.b : c.a;
        if (key === "spirit_earth") col = ((x * 3 + y * 5) % 7 === 0) ? c.c : ((x + y) % 3 === 0 ? c.a : c.b);
        if (key === "spirit_fire" && live && y < cy - 6 && (x + y + f) % 4 === 0) col = c.c;
        put(x, y, col);
      }
    }
    if (key === "spirit_earth") for (let x = -4; x <= 4; x++) put(cx + x, Math.round(tipY) + (Math.abs(x) > 2 ? 2 : 0) + (x % 2 ? 1 : 0), x % 2 ? "#4a9a2a" : "#6ac83a");   // мох
    side((s) => { put(cx + s * (r + .5), cy + 1, c.a); put(cx + s * (r + 1.5), cy + (live && !sleep ? (f + (s > 0 ? 3 : 0)) % 2 : 1), c.b); });       // ручки
    const out = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!solid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid[y + b] && solid[y + b][x + a])) out.push([x, y]);
    out.forEach(([x, y]) => put(x, y, c.line, false));
    // большие глаза и ротик
    [[cx - 3.5, cy - 1], [cx + 2.5, cy - 1]].forEach(([x, y]) => {
      if (dead) { put(x, y, c.eye); put(x + 1, y + 1, c.eye); put(x + 1, y - 1, c.eye); return; }
      if (sleep || f === 5) { put(x - .5, y + 1, c.eye); put(x + .5, y + 1, c.eye); put(x + 1.5, y + 1, c.eye); return; }
      for (let a = 0; a < 2; a++) for (let b = -1; b < 2; b++) put(x + a, y + b, "#ffffff");
      put(x + 1, y, c.eye); put(x + 1, y + 1, c.eye); put(x, y + 1, c.eye);
    });
    if (!dead) { put(cx - .5, cy + 3, c.line); put(cx + .5, cy + 3, c.line); put(cx - .5, cy + 4, sleep ? c.line : "#ff7a9a"); }
    const fx = [];
    if (live && !sleep) for (let i = 0; i < 5; i++) {
      const k = (f + i * 2) % 6;
      if (key === "spirit_fire") fx.push([Math.round(cx - 6 + ((i * 7 + f * 3) % 13)), Math.round(tipY - 1 - ((f + i) % 4) * 2), c.fx[i % 2]]);
      else if (key === "spirit_water") fx.push([[6, 32, 9, 30, 5, 34][k], 34 - ((f * 5 + i * 7) % 28), c.fx[i % 2]]);
      else if (key === "spirit_earth") fx.push([Math.round(cx + Math.cos((f + i * 1.25) * 1.05) * 13), Math.round(cy - 4 + Math.sin((f + i * 1.25) * 1.05) * 4), c.fx[i % 2]]);
      else fx.push([Math.round(cx + Math.cos((f * 1.05) + i * 1.3) * (10 + i)), Math.round(cy - 6 + i * 3 - (f % 3)), c.fx[i % 2]]);
    }
    return { g, fx, glow: live ? c.glow : null, ghost: key === "spirit_wind" && live, glitch: false, hatAt: hatPoint(solid, cx + sway * .4) };
  }
  // куда сажать шапку: верх головы над центром
  function hatPoint(solid, cx) {
    let best = W;
    for (let x = Math.round(cx) - 1; x <= Math.round(cx) + 1; x++) for (let y = 0; y < W; y++) if (solid[y] && solid[y][x]) { best = Math.min(best, y); break; }
    return [cx, best];
  }

  /* ---------------------------------------------------------------- один кадр */
  function frame(code, f, dead, sleep, stage) {
    const rarity = Math.max(0, Math.min(4, Number(code[0]) || 0)), dna = code.slice(1);
    const M = {}; muts(dna).forEach((m) => { M[m.key] = true; });
    if (M.phoenix) return phoenixFrame(dna, f, dead, sleep);
    const cl = collectOf(dna);
    if (cl) return cl.set === "dragons" ? dragonFrame(cl.key, dna, f, dead, sleep) : spiritFrame(cl.key, dna, f, dead, sleep);
    if (sleep && !dead) f = f % 2 ? 1 : 0;                                       // спит: только медленное дыхание
    const g = Array.from({ length: W }, () => Array(W).fill(null));
    const solid = Array.from({ length: W }, () => Array(W).fill(false));
    const mask = Array.from({ length: W }, () => new Uint8Array(W));             // 1 — само тело (на него ляжет светотень), 2 — контур
    let MODE = 0;
    const put = (x, y, c, s = true) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < W) { g[y][x] = c; mask[y][x] = MODE; if (s) solid[y][x] = true; } };
    const G2 = isGen2(dna), menace = G2 && isMenace(dna);
    const empty = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < W && !g[y][x]; };
    const isSolid = (x, y) => solid[Math.round(y)] && solid[Math.round(y)][Math.round(x)];
    const side = (fn) => { fn(-1); fn(1); };
    const live = !dead, wave = live ? f % 2 : 0;
    const baby = stage === "b", teen = stage === "t";                          // малыш: маленькое пухлое тело, огромные глаза; подросток — между
    const scale = (M.giant ? 1.15 : M.tiny ? .7 : 1) * (M.cerberus ? 1 : M.twins || M.pair ? .82 : 1.1) * (baby ? .64 : teen ? .82 : 1);
    const bottom = 36.5 - (M.ghost && live ? [1, 2, 3, 2, 1, 0][f] + 1 : 0);
    const genes = M.cerberus ? [{ dna, cx: 8.5, s: .72, lift: 4 }, { dna: partner(dna), cx: 19.5, s: .84, lift: 9 }, { dna: partner(partner(dna)), cx: 30.5, s: .72, lift: 4 }]
      : M.twins || M.pair ? [{ dna, cx: 13.5 }, { dna: M.pair ? partner(dna) : dna, cx: 25.5 }] : [{ dna, cx: 19.5 }];
    const B = genes.map((b) => Object.assign(b, { P: palette(b.dna, rarity, M), G: geo(b.dna, live ? f : 0, dead, b.cx, bottom - (b.lift || 0), scale * (b.s || 1), M, G2) }));
    const P0 = B[0].P;

    // ---- сзади тела: плащи, крылья, кристаллы, хвост демона
    B.forEach(({ G }) => {
      const { cx, cy, rx, ry } = G;
      if (M.vampire || M.hero) {
        const c1 = M.vampire ? "#1c0f22" : "#c81e2c", c2 = M.vampire ? "#8a1226" : "#8f1018";
        const y0 = Math.round(cy - ry * .35), y1 = Math.round(G.bottom) + 1;
        for (let y = y0; y <= y1; y++) { const t = (y - y0) / Math.max(1, y1 - y0), half = rx * .8 + t * 4 + (t > .5 && wave ? 1 : 0); for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) put(x, y, Math.abs(x - cx) > half - 1.5 ? c2 : c1); }
      }
      if (M.angel) side((s) => { const fl = wave ? -1 : 0; for (let i = 0; i < 5; i++) for (let j = 0; j <= 4 - Math.abs(i - 1); j++) put(cx + s * (rx + .5 + j), cy - 3 + i + fl, j === 4 - Math.abs(i - 1) ? "#c9d4f0" : "#ffffff"); });
      if (M.crystal) [[-.55, 2, 6], [.05, -1, 8], [.6, 3, 5]].forEach(([a, dy, h], k) => {
        const sx = Math.round(cx + a * rx), sy = G.top + dy;
        for (let i = 0; i < h; i++) { const w = i === 0 ? 0 : 1; for (let j = -w; j <= w; j++) put(sx + j, sy - h + i + 1, j < 0 ? "#e8fbff" : k === 1 ? (rarity === 4 ? "#ff8fd0" : "#4fd8ff") : "#7fe6ff"); }
      });
      if (M.demon) { const tx = Math.round(cx + rx), ty = Math.round(cy + ry * .5); [[0, 0], [1, -1], [2, -2], [3, -3], [3, -4], [3, -5], [2, -6], [3, -6], [4, -6], [3, -7]].forEach(([a, b]) => put(tx + a, ty + b, "#5a1018")); }
    });

    // ---- Цербер: общее туловище с четырьмя лапами, на нём три головы
    if (M.cerberus) {
      const bcx = 19.5, bcy = bottom - 6, brx = 15, bry = 7, Pb = B[1].P;
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
        const u = (x + .5 - bcx) / brx, v = (y + .5 - bcy) / bry;
        if (u * u + v * v <= 1) { const lit = -(u * .4 + v * .8); put(x, y, lit > .55 ? Pb.light(0) : lit < -.5 ? Pb.dark(0) : Pb.body(0)); }
      }
      [-11, -5, 5, 11].forEach((dx, i) => { const lx = Math.round(bcx + dx), ly = Math.round(bottom) - 1, step = live && (f + i) % 2 ? 1 : 0; for (let k = 0; k < 3; k++) { put(lx, ly + k - step, Pb.dark(2)); put(lx + 1, ly + k - step, Pb.dark(2)); } put(lx - 1, ly + 2 - step, "#f4f4f4"); put(lx + 2, ly + 2 - step, "#f4f4f4"); });
      const tx = Math.round(bcx + brx), ty = Math.round(bcy - 1);
      [[0, 0], [1, -1], [2, -2], [3, -2], [4, -3 + (live && f % 2)], [5, -4 + (live && f % 2)]].forEach(([a, b2]) => put(tx + a, ty + b2, Pb.dark(1)));
    }

    // ---- тела по генам
    (M.cerberus ? [B[0], B[2], B[1]] : B).forEach(({ G, P, dna: d }) => {
      const { cx, cy, rx, ry, top, ex } = G;
      MODE = 1;
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y)) {
        const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, dy = Math.round(v * 3), lit = -(u * .55 + v * .75);
        put(x, y, lit > .62 ? P.light(dy) : lit < -.55 ? P.dark(dy) : P.body(dy));
      }
      MODE = 0;
      // новые формы: свои детали (капли, шляпка в крапинку, грани, панцирь, трещины, сросшиеся шарики)
      if (G2) {
        const sh = G.shape;
        if (sh === 7) [-.62, .18, .7].forEach((k, i) => { const x = Math.round(cx + k * rx), y0 = Math.round(cy + ry * .98); for (let j = 0; j < 2 + ((f + i) % 3); j++) put(x, y0 + j, j ? P.body(3) : P.dark(3)); });
        if (sh === 9) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y) && Math.abs((x - cx) - (y - cy) * .4) < .6) put(x, y, P.light(0));
        if (sh === 10) for (let k = 0; k < 6; k++) { const x = Math.round(cx + (((byte(d, k) % 13) - 6) / 6) * rx * 1.1), y = Math.round(cy - ry * (.55 + (byte(d, k + 6) % 4) * .1)); if (G.inside(x, y) && G.inside(x + 1, y)) { put(x, y, "#fff6e8"); put(x + 1, y, "#fff6e8"); put(x, y + 1, "#f0e0c8"); } }
        if (sh === 10) for (let x = Math.round(cx - rx * 1.2); x <= Math.round(cx + rx * 1.2); x++) { const y = Math.round(cy - ry * .1); if (G.inside(x, y)) put(x, y, P.dark(1)); }
        if (sh === 13) [.05, .35, .62].forEach((k) => { const y = Math.round(cy - ry * .6 + k * ry * 1.3); for (let x = 0; x < W; x++) if (G.inside(x, y) && G.inside(x, y - 1)) put(x, y, P.dark(1)); });
        if (sh === 14) for (let x = 0; x < W; x++) { const y = Math.round(cy - ry * .05); if (G.inside(x, y) && !G.inside(x, y - 2)) put(x, y, P.dark(0)); }
        if (sh === 15) [[-.4, -.5, 1, 1], [.3, -.1, -1, 1], [-.1, .4, 1, 1]].forEach(([a, b, sx, sy]) => { let x = cx + a * rx, y = cy + b * ry; for (let j = 0; j < 4; j++) { if (G.inside(Math.round(x), Math.round(y))) put(x, y, P.dark(2)); x += sx * (j % 2 ? 1 : 0); y += sy; } });
      }
      const inB = (x, y) => G.inside(Math.round(x), Math.round(y));
      const pat = M.mummy || M.skeleton || M.cosmic || M.shadow || M.cerberus ? 0 : byte(d, 10) % 7;
      if (pat === 1) for (let i = 0; i < 5; i++) { const sx = Math.round(cx - rx + 2 + (byte(d, (i + 3) % 16) % Math.max(1, Math.round(rx * 2 - 3)))), sy = Math.round(cy - ry * .2 + (byte(d, (i + 8) % 16) % Math.max(1, Math.round(ry)))); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => inB(sx + a, sy + b) && put(sx + a, sy + b, P.accentDark)); }
      if (pat === 2) for (let y = Math.round(cy - ry); y < cy - 1; y++) if ((y + byte(d, 7)) % 4 === 0) for (let x = 0; x < W; x++) if (inB(x, y) && inB(x, y + 1)) put(x, y, P.dark(0));
      if (pat === 3 || pat === 6) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const u = (x + .5 - cx) / (rx * .62), v = (y + .5 - (cy + ry * .45)) / (ry * .55); if (u * u + v * v <= 1 && inB(x, y)) put(x, y, pat === 6 ? P.accent : hsl(P.hue, 30, 86)); }
      if (pat === 4) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (inB(x, y) && y > cy + ry * .25) put(x, y, (x + y) % 2 ? P.accent : P.accentDark);
      if (pat === 5) [[-.5, -.55], [.45, -.7], [.1, -.85]].forEach(([a, b]) => { const sx = cx + a * rx, sy = cy + b * ry; if (inB(sx, sy)) { put(sx, sy, "#fff6c0"); put(sx - 1, sy, P.accent); put(sx + 1, sy, P.accent); put(sx, sy - 1, P.accent); put(sx, sy + 1, P.accent); } });
      // уши / рога / антенны по генам (оборотню — волчьи, магу их закрывает шляпа)
      const ears = M.werewolf || M.cerberus ? 8 : M.wizard ? -1 : G2 ? (menace && byte(d, 7) % 3 === 0 ? 8 : byte(d, 7) % 12) : byte(d, 7) % 8;
      if (ears === 9) side((s) => { const bx = Math.round(cx + s * ex); for (let a = -1; a <= 1; a++) for (let b = -2; b <= 0; b++) if (a * a + (b + 1) * (b + 1) <= 2) put(bx + a, top + b, a === 0 && b === -1 ? "#ffb3c8" : P.dark(-3)); });   // медвежьи кругляши
      if (ears === 10) side((s) => { const bx = Math.round(cx + s * (rx * .82)); for (let i = 0; i < 7; i++) { put(bx + s * Math.floor(i / 3), top + 1 + i, P.dark(0)); put(bx + s * (1 + Math.floor(i / 3)), top + 1 + i, i > 1 && i < 6 ? P.body(0) : P.dark(0)); } });   // висячие, как у спаниеля
      if (ears === 11) side((s) => { const bx = cx + s * ex; for (let i = 0; i < 5; i++) for (let j = 0; j < 4 - Math.floor(i * .8); j++) put(bx + j - (3 - i) / 2, top + 1 - i, i > 0 && i < 3 && j === 1 ? "#ffb3c8" : P.body(-3)); put(bx + s, top - 5, P.line); put(bx + s, top - 6, P.line); });   // рысьи кисточки
      if (ears === 1) side((s) => { const bx = cx + s * ex; for (let i = 0; i < 4; i++) for (let j = 0; j < 4 - i; j++) put(bx + j - (3 - i) / 2, top + 1 - i, i > 0 && i < 3 && j === Math.floor((3 - i) / 2) ? "#ffb3c8" : P.body(-3)); });
      if (ears === 2) side((s) => { for (let i = 0; i < 7; i++) { put(cx + s * (ex - 1), top - i, P.body(-3)); put(cx + s * ex, top - i, i > 1 && i < 6 ? "#ffb3c8" : P.body(-3)); } });
      if (ears === 3) side((s) => { [[0, 0], [1, 0], [0, -1], [1, -1], [s < 0 ? -1 : 2, 0], [s < 0 ? -1 : 2, -1], [0, -2], [1, -2]].forEach(([a, b]) => put(cx + s * ex + a - .5, top + b, P.dark(-3))); });
      if (ears === 4) side((s) => { for (let i = 0; i < 4; i++) { put(cx + s * (ex - 1 + i * .5), top - i, "#efe6cf"); put(cx + s * (ex + i * .5), top - i, "#cfc2a0"); } });
      if (ears === 5) { for (let i = 1; i < 5; i++) put(cx, top - i, P.line); put(cx, top - 5, P.accent); put(cx - 1, top - 5, P.accent); put(cx, top - 6, P.accent); put(cx - 1, top - 6, P.accent); }
      if (ears === 6) { put(cx, top - 1, "#3b8f3b"); put(cx, top - 2, "#3b8f3b"); for (let i = 0; i < 3; i++) { put(cx + 1 + i, top - 3 - (i === 1 ? 1 : 0), "#6fd16f"); put(cx - 1 - i, top - 2 - (i === 1 ? 1 : 0), "#4fb34f"); } }
      if (ears === 7) side((s) => { const wx = cx + s * (rx + .5); for (let i = 0; i < 4; i++) for (let j = 0; j < 3 - (i >> 1); j++) put(wx + s * j, cy - 1 + i - (wave ? 1 : 0), i === 0 ? P.light(0) : P.accent); });
      if (ears === 8) side((s) => { const bx = cx + s * ex; for (let i = 0; i < 6; i++) { const w = Math.max(0, 2 - Math.floor(i / 2)); for (let j = -w; j <= w; j++) put(bx + j + s * Math.floor(i / 3), top + 1 - i, j === 0 && i > 0 && i < 4 ? (M.cerberus ? "#8a8a8a" : "#e8a0a8") : P.dark(-3)); } });
      if (menace && !M.spikes && G.shape !== 15) [-.5, -.18, .18, .5].forEach((k, i) => { const x = Math.round(cx + k * rx); let y = 0; while (y < W && !G.inside(x, y)) y++; if (y >= W || y < 2) return; put(x, y - 1, P.dark(-2)); if (i === 1 || i === 2) put(x, y - 2, P.line); });
      // хвост, лапки
      const tail = M.demon || M.cerberus ? 0 : byte(d, 14) % 4, tx = Math.round(cx + rx), ty = Math.round(cy + ry * .45);
      if (tail === 1) { put(tx, ty, P.body(1)); put(tx + 1, ty - 1, P.body(1)); }
      if (tail === 2) { const w = wave; [[0, 0], [1, -1], [2, -2], [2, -3], [1, -4 + w], [0, -4 + w]].forEach(([a, b]) => put(tx + a, ty + b, P.accentDark)); }
      if (tail === 3) { [[0, 0], [1, 0], [2, -1], [1, -1]].forEach(([a, b]) => put(tx + a, ty + b, P.light(0))); }
      if (G.shape !== 4 && !M.cerberus) side((s) => { const fx = Math.round(cx + s * rx * .45); put(fx, G.bottom + .2, P.dark(3)); put(fx + (s < 0 ? -1 : 1), G.bottom + .2, P.dark(3)); if (M.werewolf) put(fx + (s < 0 ? -2 : 2), G.bottom + .2, "#f4efe0"); });
      // украшения по генам — если нет костюма
      const acc = M.pirate || M.ninja || M.wizard || M.hero || M.cyborg || M.cerberus ? 0 : (byte(d, 6) >> 3) % 9;
      if (acc === 1) [[-1, 0], [-2, -1], [-2, 1], [0, 0], [1, 0], [2, -1], [2, 1]].forEach(([a, b]) => put(cx + ex * .4 + a + 2, top + 1 + b, "#ff4d6d"));
      if (acc === 2) for (let x = Math.round(cx - rx * .8); x <= Math.round(cx + rx * .8); x++) if (inB(x, cy + ry * .3)) { put(x, cy + ry * .3, "#e0403a"); if (x === Math.round(cx + rx * .3)) { put(x, cy + ry * .3 + 1, "#e0403a"); put(x, cy + ry * .3 + 2, "#b02a2a"); } }
      if (acc === 3 && rarity >= 3) { const cy2 = top - (ears === 5 || ears === 6 ? 7 : 2); [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [0, -1], [2, -1], [-2, -2], [0, -2], [2, -2]].forEach(([a, b]) => put(cx + a, cy2 + b, b === 0 ? "#d99a00" : "#ffd43b")); }
      if (M.cerberus) {                                    // контур головы поверх туловища и соседей — чтобы головы читались
        for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !G.inside(x + a, y + b) && solid[y + b] && solid[y + b][x + a])) put(x, y, "#9a9a9a");
      }
    });

    // ---- сиамские и Цербер: общее тело снизу, головы сверху
    for (let n = 0; n + 1 < B.length && !M.cerberus; n++) {
      const a = B[n], b = B[n + 1], y0 = Math.round(Math.max(a.G.cy, b.G.cy) - 1), y1 = Math.round(Math.max(a.G.bottom, b.G.bottom) - 1);
      for (let y = y0; y <= y1; y++) for (let x = Math.round(a.G.cx); x <= Math.round(b.G.cx); x++) if (!isSolid(x, y)) {
        const left = x < (a.G.cx + b.G.cx) / 2, Pp = left ? a.P : b.P, dy = Math.round(((y - y0) / Math.max(1, y1 - y0)) * 3);
        put(x, y, y === y1 ? Pp.dark(dy) : Pp.body(dy));
      }
    }

    // ---- мутации поверх тела (до контура)
    B.forEach(({ G, P }) => {
      const { cx, cy, rx, ry, top, eyeY, mY, ex, eX } = G;
      const inB = (x, y) => G.inside(Math.round(x), Math.round(y));
      if (M.vampire) side((s) => { const bx = Math.round(cx + s * rx * .8); for (let i = 0; i < 4; i++) { put(bx + s * Math.floor(i / 2), cy - ry * .3 - i, i % 2 ? "#8a1226" : "#1c0f22"); put(bx, cy - ry * .3 - i + 1, "#8a1226"); } });
      if (M.werewolf) side((s) => { [-2, 0, 2].forEach((dy, i) => { const ex2 = Math.round(cx + s * (rx + .5)); put(ex2, eyeY + dy + 1, P.dark(0)); if (i !== 1) put(ex2 + s, eyeY + dy + 2, P.dark(0)); }); put(cx + s, top - 1, P.dark(-3)); });
      if (M.mummy) {
        for (let y = Math.round(cy - ry); y <= Math.round(cy + ry); y++) for (let x = 0; x < W; x++) if (inB(x, y) && (y + Math.round(cx) + (x > cx ? 1 : 0)) % 3 === 0) put(x, y, "#b49f74");
        const lx = Math.round(cx + rx * .7), ly = Math.round(cy + 1);
        for (let i = 0; i < 6; i++) { put(lx + Math.floor(i / 2) + (wave && i > 2 ? 1 : 0), ly + i, "#e6d9b8"); put(lx + 1 + Math.floor(i / 2) + (wave && i > 2 ? 1 : 0), ly + i, "#cbbd96"); }
      }
      if (M.zombie) {
        const sx = Math.round(cx + rx * .35);
        for (let y = Math.round(cy - ry * .65); y <= Math.round(cy + ry * .25); y++) if (inB(sx, y)) { put(sx, y, "#2b3320"); if (y % 2 === 0) { if (inB(sx - 1, y)) put(sx - 1, y, "#2b3320"); if (inB(sx + 1, y)) put(sx + 1, y, "#2b3320"); } }
        const px = Math.round(cx - rx * .6), py = Math.round(cy + ry * .3);
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) if (inB(px + a, py + b)) put(px + a, py + b, (a + b) % 2 ? "#a07a4a" : "#8a6538");
      }
      if (M.skeleton) {
        for (let y = Math.round(cy + ry * .05); y <= Math.round(cy + ry * .7); y++) if (inB(cx - .5, y)) put(cx - .5, y, "#e8e4d8");
        [.18, .38, .58].forEach((k) => { const y = Math.round(cy + ry * k); for (let x = Math.round(cx - rx * .55); x <= Math.round(cx + rx * .55); x++) if (inB(x, y) && Math.abs(x - cx) > .6) put(x, y, "#e8e4d8"); });
      }
      if (M.cyborg) {
        for (let y = eyeY - 3; y <= eyeY + 2; y++) for (let x = Math.round(cx); x <= Math.round(cx + rx); x++) if (inB(x, y)) put(x, y, x === Math.round(cx) || y === eyeY - 3 || y === eyeY + 2 ? "#5a626e" : "#97a0ad");
        [[1, -2], [Math.round(rx) - 2, -2], [1, 1], [Math.round(rx) - 2, 1]].forEach(([a, b]) => inB(cx + a, eyeY + b) && put(cx + a, eyeY + b, "#d6dce4"));
        const ax = Math.round(cx + rx * .45);
        for (let i = 1; i < 5; i++) put(ax, top - i + (G.shape === 6 ? 1 : 0), "#5a626e");
        put(ax, top - 5 + (G.shape === 6 ? 1 : 0), wave ? "#ff2020" : "#901010");
      }
      if (M.hero) {
        const hy = Math.round(cy + ry * .45);
        [[0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([a, b]) => put(cx - .5 + a, hy + b, "#ffd43b")); put(cx - .5, hy, "#d8262f");
        for (let y = eyeY - 1; y <= eyeY + 1; y++) for (let x = Math.round(cx - eX - 2.5); x <= Math.round(cx + eX + 1.5); x++) if (inB(x, y)) put(x, y, "#1d1d33");
      }
      if (M.ninja) {
        for (let y = eyeY - 4; y <= eyeY - 3; y++) for (let x = 0; x < W; x++) if (inB(x, y)) put(x, y, "#d8262f");
        const kx = Math.round(cx + rx) + 1;
        for (let i = 0; i < 4; i++) { put(kx + i, eyeY - 4 + Math.floor(i / 2) + (wave ? 1 : 0), "#d8262f"); put(kx + i, eyeY - 2 + Math.floor(i / 2) + (wave ? 0 : 1), "#b01c24"); }
        for (let y = eyeY + 2; y <= mY + 1; y++) for (let x = Math.round(cx - rx * .8); x <= Math.round(cx + rx * .8); x++) if (inB(x, y)) put(x, y, y === eyeY + 2 ? "#3a3a4e" : "#2a2a3a");
      }
      if (M.pirate) {
        for (let y = Math.round(cy - ry * 1.05); y <= Math.round(cy - ry * .62); y++) for (let x = Math.round(cx - rx); x <= Math.round(cx + rx); x++) if (inB(x, y) || inB(x, y + 1)) put(x, y, (x + y) % 3 === 0 ? "#ffffff" : "#d62a2a");
        const kx = Math.round(cx - rx * .85), ky = Math.round(cy - ry * .7);
        for (let i = 1; i < 4; i++) { put(kx - i, ky + i - (wave ? 0 : 1), "#d62a2a"); put(kx - i + 1, ky + i + 1, "#b01c24"); }
      }
      if (M.wizard) {
        const brim = Math.round(cy - ry * .8), half = rx * .95;
        for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) put(x, brim, "#2c1650");
        for (let i = 1; i <= 11; i++) { const w = Math.max(0, rx * .62 * (1 - i / 11)), sh = Math.round(i * .3); for (let x = Math.round(cx - w + sh); x <= Math.round(cx + w + sh); x++) put(x, brim - i, i <= 2 ? "#ffd43b" : "#5a2fa0"); }
        put(cx + 1, brim - 6, "#ffe14d"); put(cx + 1, brim - 7, "#fff6b0");
      }
      if (M.demon) side((s) => { const bx = Math.round(cx + s * ex * .9); [[0, 0], [0, -1], [s, -2], [s, -3], [2 * s, -4]].forEach(([a, b], i) => { put(bx + a, top + b, i < 2 ? "#3a0a10" : "#1a0408"); if (i < 2) put(bx + a + s, top + b, "#5a1018"); }); });
      if (M.ice) [[-3, 3], [0, 4], [3, 3], [-6, 2], [5, 2]].forEach(([a, h]) => { const x = Math.round(cx + a * (rx / 8)); let y = 0; while (y < W && !isSolid(x, y)) y++; for (let i = 1; i <= h; i++) put(x, y - i, i === h ? "#ffffff" : i > h / 2 ? "#d6f6ff" : "#8fe0ff"); });
      if (M.antennae) side((s) => { const bx = Math.round(cx + s * Math.max(2, ex - 1)); for (let i = 1; i <= 4; i++) put(bx + (i > 2 ? s : 0), top - i, P.line); const bc = (f + (s > 0 ? 1 : 0)) % 2 ? "#7affd0" : "#ff5ad8"; [[0, 0], [1, 0], [0, -1], [1, -1]].forEach(([a, b]) => put(bx + s + a - (s < 0 ? 1 : 0), top - 5 + b, bc)); });
      if (M.mushroom) [[-3, 1], [3, 0]].forEach(([dx, big]) => {
        const x = Math.round(cx + dx); put(x, top - 1, "#f4ecd8"); if (big) put(x, top - 2, "#f4ecd8");
        const y = top - (big ? 3 : 2), w = big ? 2 : 1;
        for (let a = -w; a <= w; a++) put(x + a, y, a === -w || a === w ? "#b01c24" : "#e8343a");
        for (let a = -w + 1; a <= w - 1; a++) put(x + a, y - 1, "#e8343a");
        if (big) { put(x, y - 2, "#e8343a"); put(x - 1, y - 1, "#ffffff"); put(x + 1, y, "#ffffff"); } else put(x, y - 1, "#ffffff");
      });
      if (M.horns) side((s) => { const bx = Math.round(cx + s * Math.max(2, ex * .8));
        [[0, 0], [0, -1], [s, -2], [s, -3], [2 * s, -4], [2 * s, -5], [3 * s, -6]].forEach(([a, b]) => put(bx + a, top + b, "#d9b380"));
        [[0, -4], [-s, -5], [3 * s, -4], [4 * s, -4]].forEach(([a, b]) => put(bx + a, top + b, "#9a7448")); });
      if (M.spikes) [-.62, -.3, 0, .3, .62].forEach((k) => { const x = Math.round(cx + k * rx); let y = 0; while (y < W && !isSolid(x, y)) y++; if (y >= W) return; put(x, y - 1, P.dark(0)); put(x, y - 2, P.dark(-2)); put(x - 1, y - 1, P.dark(0)); put(x, y - 3, "#ffffff"); });
      if (M.slime) [[-.5, .1], [.35, -.35], [.1, .5], [-.2, -.6]].forEach(([a, b]) => { const x = cx + a * rx, y = cy + b * ry; if (inB(x, y)) { put(x, y, "#8dff6a"); if (inB(x + 1, y)) put(x + 1, y, "#4fd13a"); } });
      if (M.cthulhu) [-1.5, -.5, .5, 1.5].forEach((k, n) => {
        const L = Math.round(ry * .8) + 3 + (n % 2);
        for (let j = 0; j < L; j++) { const x = Math.round(cx + k * 1.7 + Math.sin((j + f + n * 2) * .9) * (j > 2 ? 1 : 0)), y = mY - 1 + j; put(x, y, j === L - 1 ? "#0b2622" : j % 3 === 2 ? "#a8f0d8" : "#123f38"); }
      });
    });

    // ---- контур
    const out = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!solid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid[y + b] && solid[y + b][x + a])) out.push([x, y]);
    MODE = 2; out.forEach(([x, y]) => put(x, y, P0.line, false)); MODE = 0;

    // ---- космос внутри тела
    if (M.cosmic && live) B.forEach(({ G, dna: d }) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y) && ((x * 7 + y * 13 + byte(d, (x + y) % 16)) % 19) === 0) put(x, y, (x + y + f) % 3 === 0 ? "#ffffff" : (x + f) % 2 ? "#9fb0ff" : "#ffe9a8", false); });

    // ---- мордочки
    const blink = live && (f === 5 || sleep), look = live && !sleep ? (f === 2 ? -1 : f === 4 ? 1 : 0) : 0;   // кадры 2 и 4 — косится влево/вправо
    B.forEach(({ G, P, dna: d }) => {
      const { cx, eyeY, eX, mY } = G, E = P.eye;
      const dot = (x, y, col = E) => {
        if (dead) { put(x - 1, y - 1, E); put(x + 1, y + 1, E); put(x + 1, y - 1, E); put(x - 1, y + 1, E); put(x, y, E); return; }
        if (blink) { put(x - 1, y, E); put(x, y, E); put(x + 1, y, E); return; }
        put(x, y, col); put(x, y + 1, col); put(x + 1, y, col); put(x + 1, y + 1, col);
        if (col === "#14121c") put(x + 1, y, "#ffffff"); else put(x, y + 1, "#14121c");
      };
      const eyeAt = (x, y, kind) => {
        if (dead || blink || kind === "dot") return dot(x, y);
        if (kind === "sleepy") { put(x - 1, y, E); put(x, y, E); put(x + 1, y, E); put(x, y + 1, E); return; }
        if (kind === "big") { [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([a, b]) => put(x + a, y + b, "#ffffff")); put(x, y, "#14121c"); put(x, y + 1, "#14121c"); return; }
        if (kind === "star") { put(x, y, "#ffe14d"); put(x - 1, y, "#ffe14d"); put(x + 1, y, "#ffe14d"); put(x, y - 1, "#ffe14d"); put(x, y + 1, "#ffe14d"); return; }
        if (kind === "heart") { put(x - 1, y - 1, "#ff3b6b"); put(x + 1, y - 1, "#ff3b6b"); put(x - 1, y, "#ff3b6b"); put(x, y, "#ff3b6b"); put(x + 1, y, "#ff3b6b"); put(x, y + 1, "#ff3b6b"); return; }
        if (kind === "baby") { for (let b = -1; b <= 1; b++) { put(x, y + b, E); put(x + 1, y + b, E); } put(x, y - 1, "#ffffff"); put(x + 1, y + 1, P.light(0)); return; }
        if (kind === "teen") { for (let b = -1; b <= 1; b++) { put(x, y + b, E); put(x + 1, y + b, E); } put(x, y - 1, "#ffffff"); return; }
        if (kind === "slit") { put(x - 1, y, "#ffffff"); put(x, y, "#ffffff"); put(x + 1, y, "#ffffff"); return; }
        if (kind === "socket") { [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([a, b]) => put(x + a, y + b, "#0a0810")); put(x, y, wave ? "#ffffff" : "#c8c8ff"); return; }
        if (kind === "laser") { put(x, y, "#ff2020"); put(x + 1, y, "#ffb0b0"); put(x, y + 1, "#c00000"); put(x + 1, y + 1, "#ff2020"); return; }
        if (kind === "patch") { for (let a = -1; a <= 2; a++) for (let b = -1; b <= 1; b++) put(x + a, y + b, "#121014"); for (let i = 1; i < 6; i++) put(x - i, y - 1 - Math.ceil(i / 2), "#121014"); return; }
        // второе поколение
        if (kind === "sparkle") { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) put(x + a, y + b, E); put(x - 1, y - 1, "#ffffff"); put(x + 1, y + 1, P.light(0)); put(x, y - 2, E); return; }
        if (kind === "lashes") { put(x, y, E); put(x + 1, y, E); put(x, y + 1, E); put(x + 1, y + 1, E); put(x + 1, y, "#ffffff"); const o = x < cx ? -1 : 2; put(x + o, y - 1, E); put(x + o + (o < 0 ? -1 : 1), y - 2, E); return; }
        if (kind === "slant") { const o = x < cx ? 1 : -1; put(x - 1, y - (o > 0 ? 1 : 0), E); put(x, y, E); put(x + 1, y - (o < 0 ? 1 : 0), E); put(x, y + 1, E); put(x + 1, y + 1, E); put(x - 1, y - 2 + (o > 0 ? 0 : 1), P.line); put(x, y - 2 + (o > 0 ? 1 : 0), P.line); put(x + 1, y - 2 + (o < 0 ? 0 : 1), P.line); return; }
        if (kind === "spiral") { [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].forEach(([a, b], i) => put(x + a, y + b, (i + f) % 3 ? "#ffffff" : E)); put(x, y, E); return; }
        if (kind === "glow") { const c = hsl(P.hue2, 100, 62); put(x - 1, y, c); put(x, y, "#ffffff"); put(x + 1, y, c); put(x, y + 1, hsl(P.hue2, 100, 40)); return; }
        if (kind === "beady") { put(x, y, E); put(x + 1, y, E); return; }
        return dot(x, y);
      };
      let kind = ["dot", "big", "sleepy", "cyclops", "three", "angry", rarity >= 2 ? "star" : "big", rarity >= 3 ? "heart" : "dot"][byte(d, 8) % 8];
      if (G2) kind = (menace ? ["slant", "glow", "angry", "beady", "slant", "cyclops", "dot", "three"] : ["sparkle", "lashes", "big", "sparkle", "spiral", "sleepy", rarity >= 2 ? "star" : "lashes", rarity >= 3 ? "heart" : "sparkle"])[byte(d, 8) % 8];
      if (M.vampire || M.werewolf || M.demon || M.shadow || M.zombie || M.mummy || M.cyborg || M.pirate) kind = kind === "three" ? "three" : "dot";
      if (M.cerberus || M.threeeyes) kind = "three";
      else if (baby || teen) kind = baby ? "baby" : kind === "big" || kind === "heart" || kind === "star" ? kind : "teen";
      if (M.sixeyes) {
        [Math.round(cx) - 5, Math.round(cx) - 1, Math.round(cx) + 3].forEach((x) => { dot(x, eyeY - 2); dot(x, eyeY + 1); });
      } else if (M.bigeye) {
        const x0 = cx - .5;
        if (dead || blink) { for (let a = -3; a <= 3; a++) put(x0 + a, eyeY, P.line); if (dead) { put(x0 - 1, eyeY - 1, P.line); put(x0 + 1, eyeY + 1, P.line); } }
        else {
          [3, 5, 7, 5, 3].forEach((w, i) => { for (let a = -(w - 1) / 2; a <= (w - 1) / 2; a++) put(x0 + a, eyeY - 2 + i, "#ffffff"); });
          const ix = x0 + (f === 2 ? -1 : f === 4 ? 1 : 0);
          [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([a, b]) => put(ix + a, eyeY + b, hsl(P.hue2, 80, 45)));
          put(ix, eyeY, "#0a0810"); put(ix + 1, eyeY - 1, "#ffffff");
        }
      } else if (M.skeleton) { eyeAt(cx - eX - .5, eyeY, "socket"); eyeAt(cx + eX - .5, eyeY, "socket"); }
      else if (kind === "cyclops") {
        if (dead || blink) dot(cx - .5, eyeY); else { for (let a = -2; a <= 2; a++) for (let b = -2; b <= 1; b++) if (Math.abs(a) + Math.abs(b + .5) < 3.2) put(cx + a - .5, eyeY + b, "#ffffff"); put(cx - .5, eyeY - .5, "#14121c"); put(cx + .5, eyeY - .5, "#14121c"); put(cx - .5, eyeY + .5, "#14121c"); put(cx + .5, eyeY + .5, "#14121c"); }
      } else {
        const k = kind === "three" || kind === "angry" ? "dot" : kind;
        eyeAt(cx - eX - .5 + look, eyeY, M.hero ? "slit" : k);
        if (!M.mummy) eyeAt(cx + eX - .5 + look, eyeY, M.hero ? "slit" : M.cyborg ? "laser" : M.pirate ? "patch" : M.zombie ? "big" : k);   // у мумии второй глаз под бинтом
        if (kind === "three") eyeAt(cx - .5, eyeY - 3, "dot");
        if ((kind === "angry" || M.demon) && live) { put(cx - eX - 2, eyeY - 2, P.line); put(cx - eX - 1, eyeY - 2, P.line); put(cx - eX, eyeY - 1, P.line); put(cx + eX + 1, eyeY - 2, P.line); put(cx + eX, eyeY - 2, P.line); put(cx + eX - 1, eyeY - 1, P.line); }
      }
      // рот
      const L = P.line;
      if (M.cthulhu || M.ninja) { /* щупальца или маска */ }
      else if (dead) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); }
      else if (M.vampire) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + 1.5, mY, L); put(cx - 1.5, mY + 1, "#ffffff"); put(cx + 1.5, mY + 1, "#ffffff"); }
      else if (M.werewolf || M.cerberus) { const mo = M.cerberus ? "#000000" : "#7a2030"; for (let a = -2; a <= 2; a++) put(cx + a - .5, mY, L); put(cx - .5, mY + 1, mo); put(cx + .5, mY + 1, mo); put(cx - 2.5, mY + 1, "#ffffff"); put(cx + 1.5, mY + 1, "#ffffff"); }
      else if (M.zombie) { put(cx - 1.5, mY, L); put(cx - .5, mY - 1, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); put(cx - .5, mY, "#e8e4c8"); }
      else if (M.skeleton) { for (let a = -2; a <= 2; a++) { put(cx + a - .5, mY, (a + 2) % 2 ? "#0a0810" : "#e8e4d8"); put(cx + a - .5, mY + 1, (a + 3) % 2 ? "#0a0810" : "#e8e4d8"); } }
      else if (G2 && byte(d, 9) % 12 >= 7) {
        const m2 = byte(d, 9) % 12;
        if (m2 === 7 || (menace && m2 === 9)) { for (let a = -2; a <= 1; a++) put(cx + a + .5, mY, L); put(cx - 1.5, mY + 1, "#ffffff"); put(cx + 1.5, mY + 1, "#ffffff"); put(cx - 1.5, mY + 2, "#e8e8f0"); put(cx + 1.5, mY + 2, "#e8e8f0"); }   // клыки
        else if (m2 === 8) { put(cx - 2.5, mY, L); put(cx - 1.5, mY + 1, L); put(cx - .5, mY, L); put(cx + .5, mY + 1, L); put(cx + 1.5, mY, L); }                    // «ω»
        else if (m2 === 9) { put(cx - 1.5, mY - 1, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); put(cx - .5, mY + 1, "#ff6a8a"); put(cx + .5, mY + 1, "#ff8aa8"); put(cx, mY + 2, "#ff6a8a"); }   // язык
        else if (m2 === 10) { for (let a = -3; a <= 3; a++) { put(cx + a - .5, mY, L); if (Math.abs(a) < 3) put(cx + a - .5, mY + 1, a % 2 ? "#ffffff" : "#e0e0e8"); } put(cx - 3.5, mY - 1, L); put(cx + 2.5, mY - 1, L); }   // зубастая ухмылка
        else { put(cx - 1.5, mY, "#ffa424"); put(cx - .5, mY, "#ffa424"); put(cx + .5, mY, "#ffa424"); put(cx - .5, mY + 1, "#d97a00"); put(cx - .5, mY - 1, "#ffc864"); }   // клювик
      }
      else {
        const mouth = byte(d, 9) % 7;
        if (mouth === 0) { put(cx - 1.5, mY - 1, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); }
        else if (mouth === 1) { for (let a = -2; a <= 2; a++) put(cx + a - .5, mY, L); put(cx - 1.5, mY + 1, "#fff"); put(cx + 1.5, mY + 1, "#fff"); }
        else if (mouth === 2) { put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx - .5, mY + 1, "#7a2030"); put(cx + .5, mY + 1, "#7a2030"); }
        else if (mouth === 3) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + .5, mY + 1, "#ff7a9a"); put(cx + 1.5, mY + 1, "#ff7a9a"); }
        else if (mouth === 4) { put(cx - 1.5, mY - 1, "#ffa424"); put(cx - .5, mY - 1, "#ffa424"); put(cx + .5, mY - 1, "#ffa424"); put(cx - .5, mY, "#d97a00"); }
        else if (mouth === 5) { put(cx - 2.5, mY - 1, L); put(cx - 1.5, mY, L); put(cx - .5, mY - 1, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); }
      }
      if (M.mustache && !M.ninja) {                                                 // усы-«руль»: толстые под носом, тонкие закрученные кончики
        const MU = "#2a180c", HI = "#7a5030", y0 = mY + 1;
        const px = [[-1, -1], [0, -1], [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [-5, 1], [-4, 1], [-3, 1], [-2, 1], [1, 1], [2, 1], [3, 1], [4, 1],
          [-6, 1], [5, 1], [-7, 0], [6, 0], [-7, -1], [6, -1], [-6, -2], [5, -2]];
        px.forEach(([k, b]) => put(cx - .5 + k, y0 + b, MU));
        [[-3, 0], [2, 0], [-1, -1]].forEach(([k, b]) => put(cx - .5 + k, y0 + b, HI));
      }
      if (G2 && live && !(M.cerberus || M.skeleton || M.ninja || M.mummy)) {
        const ex1 = Math.round(cx - eX - .5), ex2 = Math.round(cx + eX - .5);
        if (menace) {                                                              // грозные: нахмуренные брови, иногда шрам
          if (kind !== "slant") { put(ex1 - 1, eyeY - 3, L); put(ex1, eyeY - 2, L); put(ex1 + 1, eyeY - 2, L); put(ex2 + 2, eyeY - 3, L); put(ex2 + 1, eyeY - 2, L); put(ex2, eyeY - 2, L); }
          if (byte(d, 13) % 3 === 0) for (let i = 0; i < 4; i++) put(ex2 - 1 + i, eyeY - 2 + i, i % 2 ? "#c84a5a" : "#f0a0a8");
        } else {                                                                   // милые: веснушки и румянец
          if (byte(d, 13) % 2 === 0) [[-3, 1], [-2, 2], [-4, 2]].forEach(([a, b]) => { put(ex1 + a + 1, mY - 1 + b - 1, P.dark(0)); put(ex2 - a, mY - 1 + b - 1, P.dark(0)); });
          put(cx - eX - 2.5, mY - 1, "#ff8fab"); put(cx - eX - 3.5, mY - 1, "#ffb0c4"); put(cx + eX + 1.5, mY - 1, "#ff8fab"); put(cx + eX + 2.5, mY - 1, "#ffb0c4");
        }
      }
      if (live && (byte(d, 13) % 2 || baby) && !(M.cerberus || M.skeleton || M.zombie || M.mummy || M.ninja || M.shadow || M.cosmic || M.sixeyes)) { put(cx - eX - 2.5, mY - 1, "#ff8fab"); put(cx + eX + 1.5, mY - 1, "#ff8fab"); }
    });

    // ---- стихии и свечение (поверх, без контура)
    const fx = [];
    if (live) B.forEach(({ G, dna: d }) => {
      const { cx, rx, ry, bottom: bt } = G;
      if (M.fire || M.bwfire) {
        const FC = M.bwfire ? ["#ffffff", "#e2e2e2", "#9a9a9a", "#4a4a4a"] : ["#fff3a0", "#ffd23b", "#ff8a1f", "#ff4a1f"];
        for (let x = Math.round(cx - rx * .9); x <= Math.round(cx + rx * .9); x++) {
          if (x < 0 || x >= W) continue;
          let y = 0; while (y < W && !g[y][x]) y++;
          if (y >= W) continue;
          const h = Math.min(M.cerberus ? 4 : 9, 2 + ((x * 7 + f * 5 + byte(d, x % 16)) % 5) - (Math.abs(x - cx) > rx * .55 ? 2 : 0));
          for (let k = 0; k < h; k++) if (empty(x, y - 1 - k)) put(x, y - 1 - k, k === h - 1 ? FC[0] : k > h * .6 ? FC[1] : k > h * .3 ? FC[2] : FC[3], false);
        }
        side((s) => { for (let k = 0; k < 3 + ((f + (s > 0 ? 3 : 0)) % 3); k++) { const x = Math.round(cx + s * (rx + 1)) + (k > 1 ? s : 0), y = Math.round(G.cy + 2 - k); if (empty(x, y)) put(x, y, k > 1 ? FC[1] : FC[2], false); } });
        fx.push([Math.round(cx - rx + ((f * 5) % Math.max(1, Math.round(rx * 2)))), Math.max(1, G.top - 6 - f), FC[0]]);
      }
      if (M.storm) {
        const sx = f % 2 ? Math.round(cx + rx + 3) : Math.round(cx - rx - 3), sy = Math.round(G.cy - 4 + (f % 3) * 2);
        [[0, 0], [1, 1], [0, 2], [1, 3], [0, 4], [1, 5]].forEach(([a, b], i) => empty(sx + a, sy + b) && put(sx + a, sy + b, i % 2 ? "#7af0ff" : "#fff27a", false));
        fx.push([Math.round(cx + ((f * 7) % Math.max(1, Math.round(rx * 2))) - rx), G.top - 2, "#fff27a"]);
      }
      if (M.shadow) for (let i = 0; i < 9; i++) { const x = Math.round(cx - rx - 3 + ((i * 11 + byte(d, i)) % Math.round(rx * 2 + 6))), y = Math.round(bt - ((i * 5 + f * 2) % Math.round(ry * 2 + 2))); if (empty(x, y)) put(x, y, i % 3 ? "#3a1f5c" : "#6a3fa0", false); }
      if (M.ice) fx.push([[4, 35, 7, 33, 3, 36][f], [10, 16, 26, 6, 21, 12][f], "#e8fbff"]);
      if (M.slime) [[-.55, 0], [.4, 3]].forEach(([a, o]) => { const x = Math.round(cx + a * rx), y = Math.round(bt) + ((f + o) % 4); if (empty(x, y)) put(x, y, "#7dff6a", false); if (empty(x, y - 1) && (f + o) % 4) put(x, y - 1, "#4fd13a", false); });
      if (M.crystal) fx.push([Math.round(cx + [-.55, .05, .6][f % 3] * rx), G.top - 3 - (f % 3), "#ffffff"]);
      if (M.angel) {
        let y = 0; while (y < W && !g[y][Math.round(cx)]) y++;
        const hy = y - 3 - (f % 2), hx = cx - .5;
        for (let a = -2; a <= 2; a++) { put(hx + a, hy - 1, "#fff6b0", false); put(hx + a, hy + 1, "#e0b800", false); }
        put(hx - 3, hy, "#ffe14d", false); put(hx + 3, hy, "#ffe14d", false);
      }
    });
    // блёстки редких
    if (live && rarity >= 2) {
      const n = rarity === 2 ? 1 : rarity === 3 ? 2 : 3;
      for (let i = 0; i < n; i++) {
        const k = (f + i * 2) % 6;
        fx.push([[4, 35, 6, 34, 3, 36][(k + byte(dna, i)) % 6], [8, 12, 24, 6, 17, 26][(k * 5 + i) % 6], rarity === 4 ? hsl(P0.hue + k * 60, 100, 75) : P0.glow]);
      }
    }
    const hb = M.cerberus ? B[1] : B[0];
    return { g, mask, fx: sleep ? [] : fx, glow: live && rarity >= 3 ? P0.glow : null, ghost: !!M.ghost, glitch: !!M.glitch && live && !sleep, hatAt: hatPoint(solid, hb.G.cx),
      geo: { cx: hb.G.cx, cy: hb.G.cy, rx: hb.G.rx, ry: hb.G.ry }, tex: M.mummy || M.skeleton || M.cosmic || M.ghost ? 0 : (byte(dna, 11) >> 5) % 5, g2: G2 };
  }

  /* ---------------------------------------------------------------- «приколы» на голову: маленькие пиксельные шапки */
  const HAT_ART = {
    party: [["    w    ", "    y    ", "   rry   ", "   ryr   ", "  ryrry  ", "  rryry  ", " ryrryrr ", "wwwwwwwww"], { r: "#e8204a", y: "#ffd23f", w: "#ffffff" }],
    bow: [["pp   pp", "pPp pPp", "pPPkPPp", "pPp pPp", "pp   pp"], { p: "#ff4d8a", P: "#ff9ac0", k: "#c0104a" }],
    flower: [[" p p ", "ppcpp", " pcp ", "  g  ", " gg  "], { p: "#ff9ad0", c: "#ffd23f", g: "#3aa84a" }],
    ushanka: [["  bbbbb  ", " bBBBBBb ", "bBBBBBBBb", "fffffffff", "f       f", "f       f"], { b: "#5a3a20", B: "#7a5030", f: "#e0d0b0" }],
    tophat: [["  kkkkk  ", "  gkkkk  ", "  gkkkk  ", "  rrrrr  ", "kkkkkkkkk"], { k: "#1a1a22", g: "#4a4a5a", r: "#c0103a" }],
    propeller: [["rrrr rrrr", "    k    ", "  bbbbb  ", " bbybbbb ", "bbbbbbbbb", "    bbbbbb"], { r: "#ff3b4a", k: "#1a1a22", b: "#2a7ae8", y: "#ffd23f" },
      ["  rr rr  ", "    k    ", "  bbbbb  ", " bbybbbb ", "bbbbbbbbb", "    bbbbbb"]],
    chef: [[" www www ", "wwwwwwwww", "wwwwwwwww", " wwwwwww ", " ggggggg "], { w: "#ffffff", g: "#d0d0dc" }],
    bucket: [["  mmmmm  ", " mMMMMMm ", " mMMMMMm ", "mMMMMMMMm", "mmmmmmmmm"], { m: "#6a7484", M: "#a8b4c4" }],
    viking: [["h       h", "h       h", "hh mmm hh", " hmMMMmh ", " mMMMMMm ", "mmmmmmmmm"], { h: "#efe6cf", m: "#7a7a88", M: "#b4b4c4" }],
    kingcrown: [["y   y   y", "yy yry yy", "yyyyyyyyy", "yRyyByyGy", "YYYYYYYYY"], { y: "#ffd23f", Y: "#c8900a", r: "#ffffff", R: "#ff2a4a", B: "#3ec8ff", G: "#7aff6a" }],
    phalo: [["  yyyyy  ", " y     y ", "  yyyyy  ", "         ", "         "], { y: "#ffe066", w: "#ffffff" }, ["  ywyyy  ", " w     y ", "  yyywy  ", "         ", "         "]],
    pcrown: [["    w    ", "p  pPp  p", "pp ppp pp", "ppppppppp", "pYppBppYp", "YYYYYYYYY"], { p: "#a05bff", P: "#ff4fd8", Y: "#ffcf3a", B: "#3ec8ff", w: "#ffffff" },
      ["   w w   ", "p  pPp  p", "pp ppp pp", "ppppppppp", "pYppBppYp", "YYYYYYYYY"]],
  };
  function hatInto(fr, hat, f) {
    const art = HAT_ART[hat], at = fr.hatAt;
    if (!art || !at || at[1] >= W) return;
    const rows = art[2] && f % 2 ? art[2] : art[0], pal = art[1], w = rows[0].length;
    const x0 = Math.round(at[0] - (w - 1) / 2), y0 = at[1] + 1 - rows.length;
    const set = (xx, yy, c) => { if (xx >= 0 && yy >= 0 && xx < W && yy < W) { fr.g[yy][xx] = c; if (fr.mask) fr.mask[yy][xx] = 0; } };
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (pal[ch]) set(x0 + i, y0 + j, pal[ch]); }));
    if (hat === "kingcrown" && f % 3 === 0) set(x0 + 4, y0 - 2, "#ffffff");
  }

  /* ---------------------------------------------------------------- высокое разрешение: 40 → 80 пикселей (Scale2x), объёмная светотень,
     блик, фактура по генам (мех, чешуя, крапинки, полоски) и мягкий контур. Сами гены, цвета и черты — прежние */
  const HR = 2, WH = W * HR;
  const rgbaCache = {};
  let probe = null;
  function rgba(c) {
    if (!c) return 0;
    if (rgbaCache[c] !== undefined) return rgbaCache[c];
    if (!probe) { const cv = document.createElement("canvas"); cv.width = cv.height = 1; probe = cv.getContext("2d", { willReadFrequently: true }); }
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = "#000"; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data;
    return (rgbaCache[c] = ((d[3] << 24) | (d[2] << 16) | (d[1] << 8) | d[0]) >>> 0);
  }
  const shade = (v, k) => {                                                     // k > 0 — светлее, k < 0 — темнее
    let r = v & 255, gg = (v >>> 8) & 255, b = (v >>> 16) & 255; const a = v >>> 24;
    if (k > 0) { r += (255 - r) * k; gg += (255 - gg) * k; b += (255 - b) * k; } else { r *= 1 + k; gg *= 1 + k; b *= 1 + k; }
    return ((a << 24) | (Math.round(b) << 16) | (Math.round(gg) << 8) | Math.round(r)) >>> 0;
  };
  // Scale2x (EPX): углы сглаживаются, мелкие детали остаются чёткими
  function scale2x(src) {
    const out = new Uint32Array(WH * WH), at = (x, y) => (x < 0 || y < 0 || x >= W || y >= W ? 0 : src[y * W + x]);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const P = src[y * W + x], A = at(x, y - 1), Bq = at(x + 1, y), C = at(x - 1, y), D = at(x, y + 1);
      const o = (y * 2) * WH + x * 2;
      out[o] = C === A && C !== D && A !== Bq ? A : P;
      out[o + 1] = A === Bq && A !== C && Bq !== D ? Bq : P;
      out[o + WH] = D === C && D !== Bq && C !== A ? C : P;
      out[o + WH + 1] = Bq === D && Bq !== A && D !== C ? D : P;
    }
    return out;
  }
  const BAY4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function hiFrame(fr, seed, alpha) {
    const src = new Uint32Array(W * W), msk = new Uint8Array(W * W);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { src[y * W + x] = rgba(fr.g[y][x]); msk[y * W + x] = fr.mask ? fr.mask[y][x] : 0; }
    const out = scale2x(src), m2 = (x, y) => (x < 0 || y < 0 || x >= WH || y >= WH ? 0 : msk[(y >> 1) * W + (x >> 1)]);
    const body = (x, y) => m2(x, y) === 1 && out[y * WH + x] >>> 24 > 0;
    const G = fr.geo, tex = fr.tex || 0;
    if (G) {
      const hx = (G.cx - G.rx * .42) * HR, hy = (G.cy - G.ry * .5) * HR, hr = Math.max(2, G.rx * .3) * HR;
      for (let y = 0; y < WH; y++) for (let x = 0; x < WH; x++) {
        if (!body(x, y)) continue;
        const i = y * WH + x; let v = out[i];
        const edgeTL = !body(x - 1, y) || !body(x, y - 1) || !body(x - 1, y - 1), edgeBR = !body(x + 1, y + 1) || !body(x, y + 2) || !body(x + 2, y);
        if (edgeTL) v = shade(v, .16);                                          // контровой свет сверху-слева
        else if (edgeBR) v = shade(v, (BAY4[y & 3][x & 3] < 10 ? -.16 : -.08)); // тень снизу-справа
        const dh = ((x - hx) / hr) ** 2 + ((y - hy) / (hr * .7)) ** 2;
        if (dh < 1) v = shade(v, dh < .35 ? .42 : BAY4[y & 3][x & 3] < 8 ? .22 : .08);   // блик
        const n = (x * 13 + y * 7 + seed) % 17;
        if (tex === 1 && (x + y * 3 + seed) % 7 === 0 && !edgeTL) v = shade(v, -.1);                         // мех: короткие штрихи
        else if (tex === 2 && ((x + (y >> 1) * 2) % 6 === 0) && (y % 4 === 1) && !edgeTL) v = shade(v, -.13);   // чешуя
        else if (tex === 3 && n === 0) v = shade(v, .18);                                                     // крапинки
        else if (tex === 4 && ((y + (x >> 2)) % 8 < 1)) v = shade(v, -.08);                                    // мягкие полоски
        out[i] = v;
      }
      // контур: светлее там, где рядом освещённое тело (сверху-слева), темнее снизу
      for (let y = 0; y < WH; y++) for (let x = 0; x < WH; x++) {
        if (m2(x, y) !== 2) continue;
        const i = y * WH + x;
        if (body(x + 1, y + 1) && y < (G.cy * HR)) out[i] = shade(out[i], .22);
      }
    }
    if (alpha < 1) for (let i = 0; i < out.length; i++) if (out[i]) { const a = Math.round((out[i] >>> 24) * alpha); out[i] = ((a << 24) | (out[i] & 0xffffff)) >>> 0; }
    return out;
  }

  /* ---------------------------------------------------------------- в картинку */
  const cache = {};
  const FR = 6;
  function stripUrl(code, dead, sleep, hat, stage) {
    const key = code + (stage ? "." + stage : "") + (dead ? ":dead" : "") + (sleep ? ":zz" : "") + (hat ? ":" + hat : "") + ":hr2";
    if (cache[key]) return cache[key];
    if (typeof document === "undefined") return "";
    const c = document.createElement("canvas"); c.width = WH * FR; c.height = WH;
    const x = c.getContext("2d"), seed = byte(code.slice(1), 3) + byte(code.slice(1), 9);
    for (let f = 0; f < FR; f++) {
      const fr = frame(code, dead ? 0 : f, dead, sleep, stage);
      const ox = f * WH;
      if (hat) hatInto(fr, hat, f);
      if (fr.glow) {                                                    // мягкое свечение вокруг легендарных
        x.globalAlpha = [.5, .36, .26, .36, .5, .4][f]; x.fillStyle = fr.glow;
        for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) if (!fr.g[yy][xx] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => fr.g[yy + b2] && fr.g[yy + b2][xx + a2])) x.fillRect(ox + xx * HR, yy * HR, HR, HR);
        x.globalAlpha = 1;
      }
      const px = hiFrame(fr, seed, fr.ghost ? [.62, .7, .78, .7, .62, .55][f] : 1);
      const tmp = document.createElement("canvas"); tmp.width = tmp.height = WH;
      const tx = tmp.getContext("2d"), img = tx.createImageData(WH, WH);
      new Uint32Array(img.data.buffer).set(px);
      tx.putImageData(img, 0, 0);
      x.drawImage(tmp, ox, 0);
      fr.fx.forEach(([sx, sy, col]) => {                                // искры: крестик в высоком разрешении
        x.fillStyle = col; x.fillRect(ox + sx * HR, sy * HR, HR, HR); x.globalAlpha = .55;
        x.fillRect(ox + sx * HR - HR, sy * HR, HR, HR); x.fillRect(ox + sx * HR + HR, sy * HR, HR, HR); x.fillRect(ox + sx * HR, sy * HR - HR, HR, HR); x.fillRect(ox + sx * HR, sy * HR + HR, HR, HR);
        x.globalAlpha = 1; x.fillStyle = "#ffffff"; x.fillRect(ox + sx * HR, sy * HR, 1, 1);
      });
      if (fr.glitch && f !== 2 && f !== 5) { x.globalAlpha = .55; x.fillStyle = "#ff00d4"; x.fillRect(ox + (9 + f) * HR, (20 + f) * HR, 3 * HR, HR); x.fillStyle = "#00f0ff"; x.fillRect(ox + (27 - f) * HR, (27 - f) * HR, 3 * HR, HR); x.globalAlpha = 1; }
      if (fr.glitch && (f === 2 || f === 5)) {                          // глитч: строки съезжают, цветная кайма
        const y0 = (12 + (f * 3) % 12) * HR;
        for (let yy = y0; yy < y0 + 3 * HR; yy++) { const row = x.getImageData(ox, yy, WH, 1); x.clearRect(ox, yy, WH, 1); x.putImageData(row, ox + (f === 2 ? 2 : -2) * HR, yy); }
        x.clearRect(ox - 2 * HR, 0, 2 * HR, WH); x.clearRect(ox + WH, 0, 2 * HR, WH);
        x.globalAlpha = .7; x.fillStyle = "#ff00d4"; x.fillRect(ox + 8 * HR, y0 - HR, 6 * HR, HR); x.fillStyle = "#00f0ff"; x.fillRect(ox + 24 * HR, y0 + 4 * HR, 7 * HR, HR); x.globalAlpha = 1;
      }
    }
    if (dead) {                                                         // серым
      const img = x.getImageData(0, 0, c.width, c.height), d = img.data;
      for (let i = 0; i < d.length; i += 4) { const l = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11; d[i] = d[i + 1] = d[i + 2] = l * .8; }
      x.putImageData(img, 0, 0);
    }
    return (cache[key] = c.toDataURL());
  }

  function eggUrl(dna) {
    const key = "egg:" + dna + ":hr2";
    if (cache[key]) return cache[key];
    if (typeof document === "undefined") return "";
    const c = document.createElement("canvas"); c.width = WH * FR; c.height = WH;
    const x = c.getContext("2d"), hue = Math.round(byte(dna, 3) * 360 / 256);
    const wob = [0, 0, 1, 0, -1, 0], ex = 19.5, ey = 24;
    const inEgg = (xx, yy) => { const u = (xx + .5 - ex) / 10, v = (yy + .5 - ey) / 13, w = v < 0 ? u / (1 + v * .28) : u; return w * w + v * v <= 1; };
    for (let f = 0; f < FR; f++) {
      const g = Array.from({ length: W }, () => Array(W).fill(null)), mask = Array.from({ length: W }, () => new Uint8Array(W));
      for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) {
        const inside = inEgg(xx, yy);
        if (!inside && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a2, b2]) => inEgg(xx + a2, yy + b2))) { g[yy][xx] = "#2a2233"; mask[yy][xx] = 2; }
        if (!inside) continue;
        const u = (xx + .5 - ex) / 10, v = (yy + .5 - ey) / 13, lit = -(u * .5 + v * .8), spot = ((xx * 7 + yy * 13 + byte(dna, (xx + yy) % 16)) % 23) < 2;
        g[yy][xx] = spot ? hsl(hue, 60, 52) : lit > .55 ? "#fffaf0" : lit < -.5 ? "#d8cfc0" : "#f1ead8"; mask[yy][xx] = spot ? 0 : 1;
      }
      const px = hiFrame({ g, mask, geo: { cx: ex, cy: ey, rx: 10, ry: 13 }, tex: 0 }, 0, 1);
      const tmp = document.createElement("canvas"); tmp.width = tmp.height = WH;
      const tx = tmp.getContext("2d"), img = tx.createImageData(WH, WH);
      new Uint32Array(img.data.buffer).set(px); tx.putImageData(img, 0, 0);
      x.drawImage(tmp, f * WH + wob[f] * HR, 0);
    }
    return (cache[key] = c.toDataURL());
  }

  // HTML: живой анимированный спрайт. code = цифра редкости + ДНК (+ мутации) [+ ".b" малыш | ".t" подросток] [+ "-" шапка]
  const sprite = (code, size = 96, opts = {}) => {
    if (!code) return "";
    const [base0, hat] = String(code).split("-"), [base, stage] = base0.split(".");
    const url = opts.egg ? eggUrl(base.slice(1)) : stripUrl(base, opts.dead, opts.sleep, opts.dead ? null : opts.hat || hat || null, stage);
    return `<i class="pet-spr ${opts.dead ? "dead" : ""} ${stage && !opts.egg ? "grow-" + stage : ""} ${opts.cls || ""}" style="width:${size}px;height:${size}px;background-image:url(${url})"></i>`;
  };

  const api = { isGen2, SHAPES2, COLLECT, COLLECT_SETS, collectOf, asleepSec, hungerAt, funWant, RARITY, FOOD_KEYS, FOOD_EMOJI, SOCIAL, TEMPER, HOBBY, QUIRK, HOBBY_FX, QUIRK_FX, MUTATIONS, MG_EFFECTS, MG_COUNT, mgMut, mgName, syringe, receptive, STAGES, stageOf, TOYS, HATS, CHRONO, PERKS, perks, toyPrefs, chrono, sleepState, stats, skills, traits, name: fullName, muts, partner, rarityName, sprite, frame };
  root.Pets = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
