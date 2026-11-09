/* Магічні шахи: шахи 1×1, де в кожної фігури є життя, удар і власна навичка, гравці грають карти-чари,
   а дошка постійно змінює світ (стиль і правила) та форму. Рушій працює в телефоні хоста (як і інші ігри).
   • життя / удар: пішак 1/1, кінь 2/2, слон 2/2, тура 3/2, ферзь 3/2, король 4/1. Удар не добив — нападник лишається на місці;
   • перемога — знищити короля суперника (шаху й мату немає);
   • у кожної фігури навичка з перезарядкою (замість ходу); за вбивства фігура росте: ветеран (+1 життя) → герой (+1 удар);
   • у руці до 3 карт; карту грають до ходу, одна за хід; на початку ходу — шанс отримати нову;
   • кожні 3 раунди (у «шаленому» режимі — кожні 2) подія: новий світ (вулкан, зима, болото, буря, космос, пустеля)
     або катаклізм (провалля, зсув форми дошки, дзеркало, карусель, метеори, портали, туман…);
   • комбінації чар і світу дають комбо: танення, ланцюгова блискавка, паровий вибух, бронебійні кулі, чума… */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  const MIN_PLAYERS = 2, MAX_PLAYERS = 6, TURN_SECONDS = 75, ECLIPSE = 30, OFFLINE_SECONDS = 10, REALM_ROUNDS = 4;
  const HAND_MAX = 3, CHAT_LIMIT = 80, DRAW_CHANCE = .55, SHIELD_MAX = 3;   // щити не накопичуються безкінечно
  const PIECES = { K: { hp: 4, atk: 1, name: "Король" }, Q: { hp: 3, atk: 2, name: "Ферзь" }, R: { hp: 3, atk: 2, name: "Тура" }, B: { hp: 2, atk: 2, name: "Слон" }, N: { hp: 2, atk: 2, name: "Кінь" }, P: { hp: 1, atk: 1, name: "Пішак" } };
  const VALUE = { K: 60, Q: 9, R: 5, B: 3, N: 3, P: 1 };
  // навички фігур: замість ходу, з перезарядкою (у власних ходах)
  const SKILLS = {
    P: { e: "🛡", name: "Окоп", desc: "+1 щит собі й пішакам поруч. Четверо пішаків разом — «Фаланга»: по +2 щити", cd: 3 },
    N: { e: "🐎", name: "Тупіт", desc: "1 шкоди всім ворогам навколо коня", cd: 3 },
    B: { e: "✨", name: "Святе світло", desc: "Перша фігура на кожній діагоналі: своїм +1 життя, чужим −1", cd: 3 },
    R: { e: "💥", name: "Залп", desc: "1 шкоди першому ворогові в кожному з 4 напрямків", cd: 4 },
    Q: { e: "🌪", name: "Вибух сили", desc: "1 шкоди ворогам поруч і відкидає їх на клітинку. Відкинутий у безодню чи лаву — ще −1", cd: 4 },
    K: { e: "📯", name: "Наказ", desc: "Сусідні союзники отримують лють на 2 ходи. Король ❤️≤2 — «Останній бій»: ще й +1 щит", cd: 4 },
  };
  // карти-чари: tgt — у кого цілитися, two — друга ціль, w — як часто випадає
  const CARDS = {
    fire: { e: "🔥", name: "Вогняний слід", desc: "Фігура ходить двічі, а клітинки, з яких вона пішла, горять — туди не ступити", tgt: "own", w: 10 },
    gun: { e: "🔫", name: "Зброя", desc: "Пішак у бойовій розмальовці отримує рушницю: 3 постріли замість ходу, до 5 клітинок у будь-який бік", tgt: "ownP", w: 9 },
    shield: { e: "🛡", name: "Щит", desc: "Фігура гасить наступні 2 шкоди", tgt: "own", w: 8 },
    freeze: { e: "❄️", name: "Крига", desc: "Чужа фігура вмерзає в лід на 2 ходи", tgt: "enemy", w: 8 },
    tele: { e: "🌀", name: "Телепорт", desc: "Перенеси свою фігуру (не короля) на будь-яку вільну клітинку", tgt: "ownNK", two: "empty", w: 6 },
    heal: { e: "💚", name: "Зцілення", desc: "+2 життя своїй пораненій фігурі", tgt: "ownHurt", w: 7 },
    bolt: { e: "⚡", name: "Блискавка", desc: "1 шкоди будь-якій чужій фігурі, навіть королю. По воді й льоду б’є ланцюгом", tgt: "enemy", w: 9 },
    ghost: { e: "👻", name: "Привид", desc: "Цей хід фігура проходить крізь фігури, вогонь, стіни й безодню", tgt: "own", w: 6 },
    mine: { e: "💣", name: "Міна", desc: "Невидима для суперника: його фігура, що стане туди, отримає 2 шкоди, а сусіди — уламки", tgt: "empty", w: 6 },
    swap: { e: "🔄", name: "Обмін", desc: "Дві твої фігури міняються місцями", tgt: "own", two: "own", w: 4 },
    rage: { e: "😡", name: "Лють", desc: "+1 до удару фігури на 3 її ходи", tgt: "own", w: 7 },
    wall: { e: "🧱", name: "Стіна", desc: "Стіна на вільній клітинці на 3 раунди", tgt: "empty", w: 5 },
    poison: { e: "☠️", name: "Отрута", desc: "Чужа фігура (не король) втрачає 1 життя на початку 3 своїх ходів. Помре — заразить сусідів", tgt: "enemyNK", w: 6 },
    frog: { e: "🐸", name: "Жаба", desc: "Чужа тура, слон чи кінь стає пішаком", tgt: "enemyMinor", w: 4 },
    mirror: { e: "🪞", name: "Дзеркало", desc: "Фігура стає дзеркальною: наступний удар по ній повертається тому, хто вдарив", tgt: "own", w: 5 },
    volcano: { e: "🌋", name: "Вулкан", desc: "Лава хрестом на 2 раунди: 1 шкоди всім там. На льоду й воді — паровий вибух", tgt: "any", w: 4 },
    promote: { e: "⬆️", name: "Підвищення", desc: "Твій пішак стає конем, слоном чи турою", tgt: "ownP", w: 4 },
    haste: { e: "⏩", name: "Прискорення", desc: "Цей хід — два ходи будь-якими фігурами", tgt: "none", w: 5 },
    meteor: { e: "☄️", name: "Метеор", desc: "Позначає клітинку: на початку твого наступного ходу впаде метеор — 2 шкоди в центрі, 1 навколо", tgt: "any", w: 5 },
    vortex: { e: "🔃", name: "Вихор", desc: "Квадрат 3×3 навколо клітинки повертається на 90° — разом з фігурами й ефектами", tgt: "inner", w: 4 },
    clone: { e: "👥", name: "Двійник", desc: "Поруч з’являється примарна копія твоєї фігури (не короля й не ферзя) з 1 життям", tgt: "ownClone", w: 5 },
    vamp: { e: "🧛", name: "Вампіризм", desc: "3 ходи фігура лікується на стільки, скільки шкоди завдала", tgt: "own", w: 5 },
    blackhole: { e: "⚫", name: "Чорна діра", desc: "Клітинка стає безоднею: сусіди отримують 1 шкоди, фігури за 2 клітинки затягує ближче", tgt: "empty", w: 4 },
  };
  // світи: стиль дошки + постійне правило на кілька раундів
  const REALMS = {
    arcana: { e: "🔮", name: "Аркана", desc: "Звичайна чарівна дошка" },
    volcano: { e: "🌋", name: "Світ вулканів", desc: "Щораунду лава проривається на 2 клітинках, вогонь горить довше" },
    frost: { e: "❄️", name: "Вічна зима", desc: "Щораунду з’являється лід, крига тримає на хід довше, вогонь гасне" },
    swamp: { e: "🪷", name: "Болото", desc: "Тура, слон і ферзь грузнуть — не далі 3 клітинок; калюжі; отрута діє довше" },
    storm: { e: "⛈", name: "Світ бур", desc: "Щораунду блискавка б’є випадкову фігуру; вода й лід проводять струм" },
    cosmos: { e: "🌌", name: "Космос", desc: "Невагомість: після ходу по прямій фігура пролітає ще клітинку; портали" },
    desert: { e: "🏜", name: "Пустеля", desc: "Щораунду з піску виринає скриня з картою; вода висихає" },
  };
  // події: realm — зміна світу, решта — катаклізми
  const EVENTS = {
    volcano: { e: "🌋", name: "Світ вулканів", desc: "4 раунди дошка — вулкан: лава проривається щораунду", realm: true },
    frost: { e: "❄️", name: "Вічна зима", desc: "4 раунди криги: лід усюди, вогонь гасне, крига тримає довше", realm: true },
    swamp: { e: "🪷", name: "Болото", desc: "4 раунди трясовини: далекобійні фігури грузнуть, калюжі проводять струм", realm: true },
    storm: { e: "⛈", name: "Світ бур", desc: "4 раунди грози: блискавка щораунду, по воді й льоду — ланцюгом", realm: true },
    cosmos: { e: "🌌", name: "Космос", desc: "4 раунди невагомості: фігури пролітають далі, відкриваються портали", realm: true },
    desert: { e: "🏜", name: "Пустеля", desc: "4 раунди пісків: скрині з картами виринають щораунду", realm: true },
    quake: { e: "🕳", name: "Землетрус", desc: "4 провалля на 3 раунди" },
    shape: { e: "🗺", name: "Тектонічний зсув", desc: "Дошка змінює форму: частина клітинок провалюється в безодню на 3 раунди" },
    mirror: { e: "🪞", name: "Дзеркальний світ", desc: "Дошка віддзеркалюється: ліве стає правим — разом з фігурами" },
    carousel: { e: "🎠", name: "Карусель", desc: "5-та горизонталь їде праворуч, 4-та — ліворуч, разом з фігурами" },
    portals: { e: "🌀", name: "Портали", desc: "Дві пари порталів на 4 раунди: стань на один — вийдеш з іншого" },
    meteors: { e: "☄️", name: "Метеоритний дощ", desc: "3 метеори впадуть за раунд — тікай з позначених клітинок!" },
    fog: { e: "🌫", name: "Туман", desc: "2 раунди бачиш лише клітинки біля своїх фігур" },
    chaos: { e: "🔀", name: "Безлад", desc: "2 раунди коні ходять як слони, а слони — як коні" },
    rush: { e: "💨", name: "Шал", desc: "Цей раунд — по два ходи за хід" },
    rain: { e: "🃏", name: "Магічний дощ", desc: "Кожен отримує 2 карти" },
    bless: { e: "💖", name: "Благословення", desc: "Усі фігури лікують 1 життя, навички перезаряджено" },
  };
  // комбо: опис для меню (рушій кличе combo(назва))
  const COMBOS = [
    { e: "💧", name: "Танення", how: "🔥 Вогняний слід через лід", what: "лід тане на воду — вона проводить блискавку" },
    { e: "⚡", name: "Ланцюгова блискавка", how: "⚡ Блискавка чи гроза по фігурі на воді або льоду", what: "струм б’є всіх, хто стоїть на з’єднаній воді й льоду" },
    { e: "♨️", name: "Паровий вибух", how: "🌋 Лава на воду чи лід", what: "+1 шкоди й хмара пари, крізь яку не пройти" },
    { e: "🎯", name: "Бронебійні кулі", how: "😡 Лють + 🔫 Зброя", what: "постріл прошиває першу фігуру й влучає в наступну" },
    { e: "🦠", name: "Чума", how: "☠️ Отруєна фігура гине", what: "сусіди-союзники загиблої теж отруєні" },
    { e: "🧹", name: "Випалювання", how: "🔥 Вогняний слід на отруєну фігуру", what: "отрута згорає, фігура лікується" },
    { e: "🛡", name: "Фаланга", how: "🛡 Окоп пішака, коли поруч ще троє пішаків", what: "кожен отримує по 2 щити" },
    { e: "🧊", name: "Термошок", how: "❄️ Крига на фігуру у вогні чи лаві", what: "замість заморозки — 2 шкоди" },
    { e: "🕳", name: "У безодню", how: "🌪 Вибух сили ферзя відкидає ворога в безодню, провалля чи лаву", what: "ще −1 життя" },
    { e: "📯", name: "Останній бій", how: "📯 Наказ короля, коли в нього ❤️≤2", what: "союзники поруч отримують і лють, і щит" },
    { e: "🧛", name: "Кривава лють", how: "🧛 Вампіризм + 😡 Лють", what: "фігура лікується вдвічі більше" },
  ];
  const BLOCK = { fire: 1, lava: 1, hole: 1, wall: 1, steam: 1, void: 1 };
  const other = (c) => (c === "w" ? "b" : "w");
  const rc = (i) => [Math.floor(i / 8), i % 8];
  const at = (r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);
  const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]], ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]], ALL8 = DIAG.concat(ORTH);
  const KNIGHT = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const rnd = (n) => Math.floor(Math.random() * n);
  const pickW = (obj) => { const ks = Object.keys(obj), tot = ks.reduce((a, k) => a + obj[k].w, 0); let x = Math.random() * tot; for (const k of ks) { x -= obj[k].w; if (x < 0) return k; } return ks[0]; };
  const around = (sq) => { const [r, c] = rc(sq); return ALL8.map(([dr, dc]) => at(r + dr, c + dc)).filter((x) => x >= 0); };
  const atkOf = (p) => PIECES[p.t].atk + (p.rage ? 1 : 0) + (p.rank >= 2 ? 1 : 0);

  /* ---------------------------------------------------------------- ходи (спільне для хоста, телефону гравця й бота) */
  const enterable = (tiles, i) => !(tiles[i] && BLOCK[tiles[i].k]);
  // { board, tiles, rules, realm } + клітинка → список { to, attack }
  function movesOf(st, sq, opts = {}) {
    const p = st.board[sq]; if (!p || p.frozen) return [];
    const out = [], [r, c] = rc(sq), ghost = opts.ghost, rules = st.rules || {};
    const maxd = st.realm === "swamp" ? 3 : rules.slow ? 2 : 7;
    let t = p.t; if (rules.chaos) t = t === "N" ? "B" : t === "B" ? "N" : t;
    const add = (to) => {
      if (!enterable(st.tiles, to)) return;
      const q = st.board[to];
      if (!q) out.push({ to, attack: false }); else if (q.c !== p.c) out.push({ to, attack: true });
    };
    const slide = (dirs) => dirs.forEach(([dr, dc]) => {
      for (let d = 1; d <= maxd; d++) {
        const to = at(r + dr * d, c + dc * d); if (to < 0) break;
        if (!enterable(st.tiles, to)) { if (ghost) continue; break; }        // привид пролітає над вогнем, стінами й безоднею
        const q = st.board[to];
        if (!q) { out.push({ to, attack: false }); continue; }
        if (q.c !== p.c) out.push({ to, attack: true });
        if (!ghost) break;
      }
    });
    if (t === "N") KNIGHT.forEach(([dr, dc]) => { const to = at(r + dr, c + dc); if (to >= 0) add(to); });
    else if (t === "K") ALL8.forEach(([dr, dc]) => { const to = at(r + dr, c + dc); if (to >= 0) add(to); });
    else if (t === "R") slide(ORTH);
    else if (t === "B") slide(DIAG);
    else if (t === "Q") slide(ALL8);
    else if (t === "P") {
      const f = p.c === "w" ? -1 : 1, one = at(r + f, c), two = at(r + 2 * f, c);
      const free = (s) => s >= 0 && !st.board[s] && enterable(st.tiles, s);
      if (free(one)) { out.push({ to: one, attack: false }); if (!p.moved && free(two)) out.push({ to: two, attack: false }); }
      else if (ghost && one >= 0 && free(two)) out.push({ to: two, attack: false });
      [-1, 1].forEach((dc) => { const to = at(r + f, c + dc); if (to >= 0 && st.board[to] && st.board[to].c !== p.c && enterable(st.tiles, to)) out.push({ to, attack: true }); });
    }
    return out;
  }
  // постріли пішака з рушницею: 8 напрямків, до 5 клітинок, перша фігура на лінії (свої закривають напрямок)
  function shotsOf(st, sq) {
    const p = st.board[sq]; if (!p || !p.gun || p.frozen) return [];
    const [r, c] = rc(sq), out = [];
    ALL8.forEach(([dr, dc]) => {
      for (let d = 1; d <= 5; d++) {
        const to = at(r + dr * d, c + dc * d); if (to < 0) break;
        if (st.tiles[to] && (st.tiles[to].k === "wall" || st.tiles[to].k === "steam")) break;
        const q = st.board[to]; if (!q) continue;
        if (q.c !== p.c) out.push(to);
        break;
      }
    });
    return out;
  }
  // цілі навички (для перевірки, підсвітки й бота): { hit: [...], heal: [...], buff: [...] }
  function skillTargets(st, sq) {
    const p = st.board[sq]; if (!p) return null;
    const [r, c] = rc(sq), out = { hit: [], heal: [], buff: [] }, B = st.board;
    const first = (dr, dc, max = 7) => { for (let d = 1; d <= max; d++) { const to = at(r + dr * d, c + dc * d); if (to < 0) return -1; if (st.tiles[to] && st.tiles[to].k === "wall") return -1; if (B[to]) return to; } return -1; };
    if (p.t === "P") { out.buff = [sq].concat(around(sq).filter((x) => B[x] && B[x].c === p.c && B[x].t === "P")); }
    else if (p.t === "N") out.hit = around(sq).filter((x) => B[x] && B[x].c !== p.c);
    else if (p.t === "Q") out.hit = around(sq).filter((x) => B[x] && B[x].c !== p.c);
    else if (p.t === "K") out.buff = around(sq).filter((x) => B[x] && B[x].c === p.c);
    else if (p.t === "R") ORTH.forEach(([dr, dc]) => { const x = first(dr, dc); if (x >= 0 && B[x].c !== p.c) out.hit.push(x); });
    else if (p.t === "B") DIAG.forEach(([dr, dc]) => { const x = first(dr, dc); if (x < 0) return; if (B[x].c !== p.c) out.hit.push(x); else if (B[x].hp < B[x].max) out.heal.push(x); });
    return out;
  }
  const skillReady = (st, sq) => { const p = st.board[sq]; if (!p || p.frozen || p.cd) return false; const t = skillTargets(st, sq);
    return !!(t.hit.length || t.heal.length || (p.t === "P" ? t.buff.some((x) => (st.board[x].shield || 0) < 3) : t.buff.length)); };
  // клітинки, яких торкається хід (для вогняного сліду): старт і проміжні
  function pathOf(from, to) {
    const [r1, c1] = rc(from), [r2, c2] = rc(to), dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1), n = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    const straight = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
    const out = [from]; if (straight) for (let k = 1; k < n; k++) out.push(at(r1 + dr * k, c1 + dc * k));
    return out;
  }
  // які клітинки під ударом кольору color (для бота)
  function threats(st, color) {
    const s = new Set();
    st.board.forEach((p, i) => { if (p && p.c === color) { movesOf(st, i).forEach((m) => { if (m.attack) s.add(m.to); }); shotsOf(st, i).forEach((x) => s.add(x)); } });
    return s;
  }
  // форми дошки для «Тектонічного зсуву»: клітинки, що провалюються (лише порожні)
  const SHAPES = {
    rift: { name: "Розлом", cells: () => [24, 25, 26, 29, 30, 31, 32, 33, 34, 37, 38, 39] },                   // дошку розрізає навпіл, міст у центрі
    ring: { name: "Кільце", cells: () => [18, 19, 21, 26, 29, 34, 37, 42, 44, 45] },                           // рів довкола центру
    pit: { name: "Безодня в центрі", cells: () => [27, 28, 35, 36, 19, 20, 43, 44] },
    sides: { name: "Звуження", cells: () => [8, 16, 24, 32, 40, 48, 15, 23, 31, 39, 47, 55] },
    islands: { name: "Острови", cells: () => [17, 22, 41, 46, 26, 29, 34, 37, 19, 44] },
    zigzag: { name: "Зиґзаґ", cells: () => [16, 25, 34, 43, 23, 30, 37, 44, 20, 35] },
  };

  /* ---------------------------------------------------------------- кімната */
  class MChessRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "mchess";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "mchess", chaos: 1 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }
    resetGame() {
      this.board = Array(64).fill(null); this.tiles = Array(64).fill(null); this.seats = { w: null, b: null };
      this.turn = "w"; this.ply = 0; this.round = 1; this.hands = { w: [], b: [] }; this.rules = {}; this.next = null; this.nextAt = 0; this.lastEvent = null;
      this.realm = "arcana"; this.realmLeft = 0; this.skips = 0;
      this.ts = null; this.log = []; this.fx = []; this.fxSeq = 0; this.winner = null; this.results = null; this.ids = 0;
      this.stats = { w: { kills: 0, cards: 0, dmg: 0, combos: 0, skills: 0 }, b: { kills: 0, cards: 0, dmg: 0, combos: 0, skills: 0 } };
    }
    dump() { const out = {}; Object.keys(this).forEach((k) => { if (k !== "clock" && k !== "_ai") out[k] = this[k]; }); return JSON.parse(JSON.stringify(out)); }
    touch() { this.version += 1; }
    name(pid) { return this.members[pid] ? this.members[pid].name : "?"; }
    cname(c) { return this.seats[c] ? this.name(this.seats[c]) : c === "w" ? "Білі" : "Чорні"; }
    note(text) { this.log.push(text); this.log = this.log.slice(-30); }
    effect(k, sq, extra) { this.fxSeq += 1; this.fx.push(Object.assign({ k, sq, n: this.fxSeq }, extra || {})); this.fx = this.fx.slice(-24); }
    combo(name, c, sq) { if (c && this.stats[c]) this.stats[c].combos += 1; this.note(`💥 КОМБО «${name}»!`); this.effect("combo", sq == null ? -1 : sq, { name, c }); }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }
    online() { return this.order.filter((p) => this.members[p].online); }
    colorOf(pid) { return this.seats.w === pid ? "w" : this.seats.b === pid ? "b" : null; }
    st() { return { board: this.board, tiles: this.tiles, rules: this.rules, realm: this.realm }; }
    updateSettings(s) { if (s.chaos != null && [1, 2].includes(Number(s.chaos))) this.settings.chaos = Number(s.chaos); this.touch(); }
    pname(p) { return PIECES[p.t].name.toLowerCase() + (p.clone ? "-двійник" : ""); }

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`У кімнаті лише ${MAX_PLAYERS} місць`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();
    }
    leave(pid) {
      if (!this.members[pid]) return;
      const c = this.colorOf(pid);
      if (this.phase === "play" && c) { this.note(`${this.name(pid)} вийшов(ла) — перемога суперника`); this.finishGame(other(c)); this.members[pid].online = false; this.touch(); return; }
      delete this.members[pid]; this.order = this.order.filter((x) => x !== pid);
      if (pid === this.host && this.order.length) this.host = this.order[0];
      this.touch();
    }
    kick(by, pid) { if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Не можна"); this.leave(pid); }
    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole() {}

    start(by) {
      if (by !== this.host) throw new GameError("Почати може лише хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Партія вже триває");
      const on = this.online(); if (on.length < MIN_PLAYERS) throw new GameError("Потрібно двоє гравців");
      this.resetGame(); this.gameNo = (this.gameNo || 0) + 1; this.chat = { all: [] };
      const two = on.slice(0, 2); if (Math.random() < .5) two.reverse();
      this.seats = { w: two[0], b: two[1] };
      const back = ["R", "N", "B", "Q", "K", "B", "N", "R"];
      const put = (i, t, c) => { this.board[i] = { id: ++this.ids, t, c, hp: PIECES[t].hp, max: PIECES[t].hp, xp: 0, rank: 0, cd: 0 }; };
      back.forEach((t, k) => { put(k, t, "b"); put(56 + k, t, "w"); }); for (let k = 0; k < 8; k++) { put(8 + k, "P", "b"); put(48 + k, "P", "w"); }
      for (const c of ["w", "b"]) for (let k = 0; k < 2; k++) this.hands[c].push(pickW(CARDS));
      this.phase = "play"; this.turn = "w"; this.round = 1;
      this.planEvent();
      this.note(`Партія! Білі — ${this.cname("w")}, чорні — ${this.cname("b")}. Знищ короля суперника`);
      this.effect("start", -1);
      this.beginTurn(true);
      this.touch();
    }
    every() { return this.settings.chaos === 2 ? 2 : 3; }
    planEvent() {
      const all = Object.keys(EVENTS).filter((k) => k !== this.lastEvent && k !== this.realm);
      const realms = all.filter((k) => EVENTS[k].realm), rest = all.filter((k) => !EVENTS[k].realm);
      const wantRealm = Math.random() < (this.realm === "arcana" ? .5 : .25);
      const pool = wantRealm && realms.length ? realms : rest;
      this.next = pool[rnd(pool.length)]; this.nextAt = this.round + this.every();
    }

    /* ---------- хід */
    beginTurn(first) {
      const c = this.turn;
      this.ts = { moves: this.rules.rush ? 2 : 1, used: 0, card: false, fire: null, ghost: null, lock: null };
      // метеори, що мали впасти
      for (let i = 0; i < 64; i++) { const t = this.tiles[i]; if (t && t.k === "meteor" && t.at <= this.ply) { this.impact(i, t.own); if (this.phase !== "play") return; } }
      // отрута, лава, перезарядка навичок — на початку ходу власника
      for (let i = 0; i < 64; i++) { const p = this.board[i]; if (!p || p.c !== c) continue;
        if (p.cd) p.cd -= 1;
        if (p.poison) { p.poison -= 1; this.note(`☠️ Отрута: ${this.pname(p)} ${this.cname(c)} −1`); this.damage(i, 1, null, { silent: true }); if (this.phase !== "play") return; }
        if (this.board[i] && this.tiles[i] && this.tiles[i].k === "lava") { this.note(`🌋 Лава пече: ${this.pname(this.board[i])} (${this.cname(c)})`); this.damage(i, 1, null, { silent: true }); if (this.phase !== "play") return; } }
      if (!first && this.hands[c].length < HAND_MAX && Math.random() < DRAW_CHANCE) { this.hands[c].push(pickW(CARDS)); this.effect("draw", -1, { c }); }
      this.setTimer(TURN_SECONDS);
      if (!this.canMove(c) && !this.hands[c].length) {
        this.skips = (this.skips || 0) + 1;
        if (this.skips > 8) { this.note("Дошку заблоковано — нічия"); this.finishGame(null); return; }
        this.note(`${this.cname(c)} не має ходів — пропуск`); this.endTurn();
      } else this.skips = 0;
    }
    canMove(c, lock) {
      const st = this.st();
      for (let i = 0; i < 64; i++) { const p = this.board[i]; if (!p || p.c !== c) continue; if (lock != null && p.id !== lock) continue;
        if (movesOf(st, i, { ghost: this.ts && this.ts.ghost === p.id }).length || shotsOf(st, i).length || skillReady(st, i)) return true; }
      return false;
    }
    canMoveLocked() { return this.canMove(this.turn, this.ts.lock); }
    endTurn() {
      if (this.phase !== "play") return;
      const c = this.turn;
      this.board.forEach((p) => { if (p && p.c === c) { if (p.frozen) p.frozen -= 1; if (p.rage) p.rage -= 1; if (p.vamp) p.vamp -= 1; } });
      this.turn = other(c); this.ply += 1;
      if (this.turn === "w") {                                          // кінець раунду: клітинки тліють, правила спадають, світ діє, подія
        this.round += 1;
        this.tiles = this.tiles.map((t) => (t && t.ttl != null ? (t.ttl - 1 > 0 ? Object.assign(t, { ttl: t.ttl - 1 }) : null) : t));
        this.fixPortals();
        Object.keys(this.rules).forEach((k) => { this.rules[k] -= 1; if (this.rules[k] <= 0) delete this.rules[k]; });
        this.realmTick(); if (this.phase !== "play") return;
        if (this.round >= this.nextAt) { this.applyEvent(this.next); if (this.phase !== "play") return; this.planEvent(); }
        if (this.round > ECLIPSE) { this.eclipse(); if (this.phase !== "play") return; }
      }
      this.beginTurn(false);
      this.touch();
    }
    // затемнення: після 30-го раунду королі щораунду слабшають — партія не тягнеться вічно
    eclipse() {
      const ks = []; this.board.forEach((p, i) => { if (p && p.t === "K") ks.push(i); });
      this.note(`🌑 Затемнення: королі втрачають по 1 життю`);
      const left = ks.map((i) => { const p = this.board[i]; this.effect("hit", i, { dmg: 1 }); p.hp -= 1; return p; });
      const dead = left.filter((p) => p.hp <= 0);
      if (dead.length === 2) {                                            // обидва впали — перемагає той, у кого більше війська
        const army = (c) => this.board.reduce((a, p) => a + (p && p.c === c && p.t !== "K" ? VALUE[p.t] * p.hp : 0), 0), aw = army("w"), ab = army("b");
        ks.forEach((i) => { this.effect("die", i, { t: "K", c: this.board[i].c }); this.board[i] = null; });
        this.note(aw === ab ? "Обидва королі впали одночасно, війська рівні — нічия" : `Обидва королі впали — перемагає сильніше військо (${aw > ab ? "білі" : "чорні"})`);
        this.finishGame(aw === ab ? null : aw > ab ? "w" : "b");
      } else if (dead.length === 1) { const i = ks[left.indexOf(dead[0])]; this.board[i] = null; this.effect("die", i, { t: "K", c: dead[0].c }); this.note(`👑 Король ${dead[0].c === "w" ? "білих" : "чорних"} згас!`); this.finishGame(other(dead[0].c)); }
    }
    fixPortals() { this.tiles.forEach((t, i) => { if (t && t.k === "portal" && !(this.tiles[t.link] && this.tiles[t.link].k === "portal")) this.tiles[i] = null; }); }

    // шкода фігурі на клітинці sq; src — клітинка нападника (дзеркало, досвід, вампіризм)
    damage(sq, amount, src, o = {}) {
      const p = this.board[sq]; if (!p || amount <= 0) return { killed: false, dealt: 0 };
      const A = src != null && src !== sq ? this.board[src] : null;
      if (p.mirror && A) {
        p.mirror = false; this.note(`🪞 Дзеркало! Удар повертається`); this.effect("mirror", sq); return Object.assign(this.damage(src, amount, null), { reflected: true });
      }
      let a = amount;
      if (p.shield) { const s = Math.min(p.shield, a); p.shield -= s; a -= s; if (s) this.effect("shield", sq); }
      if (a <= 0) return { killed: false, dealt: 0 };
      p.hp -= a; this.effect("hit", sq, { dmg: a });
      const foe = other(p.c); this.stats[foe].dmg += a;
      if (A && A.vamp && A.c !== p.c) { const k = A.rage ? 2 : 1; A.hp = Math.min(A.max + 1, A.hp + a * k); this.effect("heal", src); if (A.rage) this.combo("Кривава лють", A.c, src); }
      if (p.hp > 0) return { killed: false, dealt: a };
      this.board[sq] = null; this.stats[foe].kills += 1; this.effect("die", sq, { t: p.t, c: p.c });
      if (!o.silent && p.t !== "K") this.note(`💀 ${PIECES[p.t].name}${p.clone ? "-двійник" : ""} ${p.c === "w" ? "білих" : "чорних"} знищено`);
      if (A && A.c !== p.c) this.gainXp(src);
      if (p.poison) {                                                     // чума: отрута переходить на сусідів-союзників
        const near = around(sq).filter((x) => this.board[x] && this.board[x].c === p.c && this.board[x].t !== "K");
        if (near.length) { near.forEach((x) => { this.board[x].poison = Math.max(this.board[x].poison || 0, 2); this.effect("poison", x); }); this.combo("Чума", foe, sq); }
      }
      if (p.t === "K") { this.note(`👑 Король ${p.c === "w" ? "білих" : "чорних"} упав!`); this.finishGame(foe); }
      return { killed: true, dealt: a };
    }
    gainXp(sq) {
      const A = this.board[sq]; if (!A || A.clone) return;
      A.xp = (A.xp || 0) + 1;
      if (A.xp === 1) { A.rank = 1; A.max += 1; A.hp += 1; this.note(`⭐ ${PIECES[A.t].name} ${A.c === "w" ? "білих" : "чорних"} стає ветераном (+1 життя)`); this.effect("rank", sq, { rank: 1 }); }
      else if (A.xp === 3) { A.rank = 2; A.hp = Math.min(A.max + 1, A.hp + 1); this.note(`🌟 ${PIECES[A.t].name} ${A.c === "w" ? "білих" : "чорних"} — ГЕРОЙ (+1 удар)`); this.effect("rank", sq, { rank: 2 }); }
    }
    // блискавка: по воді й льоду б’є ланцюгом
    lightning(sq, c) {
      this.effect("bolt", sq);
      const wet = (i) => this.tiles[i] && (this.tiles[i].k === "water" || this.tiles[i].k === "ice");
      const chain = [];
      if (wet(sq)) {
        const seen = new Set([sq]), q = [sq];
        while (q.length) { const x = q.shift(); const [r, cc] = rc(x); ORTH.forEach(([dr, dc]) => { const y = at(r + dr, cc + dc); if (y >= 0 && !seen.has(y) && wet(y)) { seen.add(y); q.push(y); if (this.board[y]) chain.push(y); } }); }
      }
      this.damage(sq, 1, null);
      if (chain.length && this.phase === "play") { this.combo("Ланцюгова блискавка", c, sq); chain.forEach((y) => { if (this.phase === "play" && this.board[y]) { this.effect("bolt", y); this.damage(y, 1, null); } }); }
    }
    // лава на клітинку; на воді чи льоду — паровий вибух
    makeLava(sq, ttl, c) {
      const t = this.tiles[sq];
      if (t && ["wall", "hole", "portal", "void"].includes(t.k)) return false;
      if (t && (t.k === "ice" || t.k === "water")) {
        this.tiles[sq] = { k: "steam", ttl: 1 }; this.effect("steam", sq);
        if (this.board[sq] && this.phase === "play") { this.combo("Паровий вибух", c, sq); this.damage(sq, 1, null); }
        return true;
      }
      this.tiles[sq] = { k: "lava", ttl };
      return false;
    }
    // метеор: 2 шкоди в центрі, 1 навколо, вирва
    impact(sq) {
      this.tiles[sq] = null; this.effect("meteor", sq); this.note(`☄️ Метеор упав!`);
      this.damage(sq, 2, null);
      around(sq).forEach((x) => { if (this.phase === "play" && this.board[x]) this.damage(x, 1, null); this.effect("boom", x); });
      if (!this.board[sq] && !this.tiles[sq]) this.tiles[sq] = { k: "hole", ttl: 2 };
    }
    finishGame(winner) {
      if (this.phase === "end") return;
      this.winner = winner; this.phase = "end"; this.deadline = null; this.total = null;
      this.results = { winner, winners: winner && this.seats[winner] ? [this.seats[winner]] : [], rounds: this.round, stats: this.stats };
      const loser = winner ? this.seats[other(winner)] : null;                // глядачі по черзі: хто програв — у кінець черги
      if (loser && this.order.length > 2 && this.order.includes(loser)) this.order = this.order.filter((x) => x !== loser).concat(loser);
      this.touch();
    }
    // фігура стала на клітинку: міна, скриня, портал, лід / невагомість, підвищення пішака
    arrive(sq, from, depth = 0) {
      const p = this.board[sq]; if (!p) return sq;
      const t = this.tiles[sq];
      if (t && t.k === "mine" && t.own !== p.c) {
        this.tiles[sq] = null; this.note(`💣 Міна! ${PIECES[p.t].name} −2, уламки летять на сусідів`); this.effect("boom", sq);
        around(sq).forEach((x) => { if (this.phase === "play" && this.board[x] && this.board[x].c === p.c) this.damage(x, 1, null); });
        if (this.phase !== "play") return -1;
        const r = this.damage(sq, 2, null); if (r.killed) return -1;
      } else if (t && t.k === "chest") {
        this.tiles[sq] = null; const hand = this.hands[p.c];
        if (hand.length < HAND_MAX + 1) { hand.push(pickW(CARDS)); this.note(`🎁 ${this.cname(p.c)} відкрив(ла) скриню — нова карта`); } else { p.hp = Math.min(p.max + 1, p.hp + 1); this.note(`🎁 Скриня лікує фігуру`); }
        this.effect("chest", sq);
      } else if (t && t.k === "portal" && depth === 0 && !this.board[t.link] && enterable(this.tiles, t.link)) {
        this.board[t.link] = p; this.board[sq] = null; this.effect("portal", t.link); this.effect("portal", sq); this.note(`🌀 ${PIECES[p.t].name} пройшов(ла) крізь портал`); return this.arrive(t.link, null, 1);
      }
      const slippery = (t && t.k === "ice") || (this.realm === "cosmos" && depth === 0);
      if (slippery && from != null && depth < 2 && this.board[sq] === p) {
        const [r1, c1] = rc(from), [r2, c2] = rc(sq), dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1), straight = r1 === r2 || c1 === c2 || Math.abs(r2 - r1) === Math.abs(c2 - c1);
        const nx = straight ? at(r2 + dr, c2 + dc) : -1;
        if (nx >= 0 && !this.board[nx] && enterable(this.tiles, nx)) { this.board[nx] = p; this.board[sq] = null; this.effect("slide", nx, { from: sq }); return this.arrive(nx, sq, depth + 1); }
      }
      if (p.t === "P" && ((p.c === "w" && rc(sq)[0] === 0) || (p.c === "b" && rc(sq)[0] === 7))) { p.t = "Q"; p.max = 3 + (p.rank ? 1 : 0); p.hp = Math.max(p.hp, 2); p.gun = 0; this.note(`👑 Пішак став ферзем!`); this.effect("promote", sq); }
      return sq;
    }

    act(pid, msg) {
      if (msg.slot === "resign") { const c = this.colorOf(pid); if (this.phase !== "play" || !c) throw new GameError("Не можна"); this.note(`🏳 ${this.name(pid)} здається`); this.finishGame(other(c)); return; }
      if (this.phase !== "play") throw new GameError("Партія не йде");
      const c = this.colorOf(pid); if (!c) throw new GameError("Ти глядач");
      if (c !== this.turn) throw new GameError("Зараз хід суперника");
      const n = (v) => (v == null ? null : Number(v));
      if (msg.slot === "move") return this.doMove(c, Number(msg.from), Number(msg.to));
      if (msg.slot === "shoot") return this.doShoot(c, Number(msg.from), Number(msg.to));
      if (msg.slot === "skill") return this.doSkill(c, Number(msg.from));
      if (msg.slot === "card") return this.doCard(c, Number(msg.i), n(msg.a), n(msg.b));
      if (msg.slot === "end") { if (!this.ts.used && this.canMoveLocked()) throw new GameError("Спершу зроби хід"); this.endTurn(); return; }
      throw new GameError("Невідома дія");
    }
    pieceOk(c, sq) {
      const p = this.board[sq]; if (!p || p.c !== c) throw new GameError("Обери свою фігуру");
      if (p.frozen) throw new GameError("❄️ Фігура вмерзла в лід");
      if (this.ts.lock != null && this.ts.lock !== p.id) throw new GameError("🔥 Цей хід — лише фігурою з вогняним слідом");
      return p;
    }
    doMove(c, from, to) {
      const p = this.pieceOk(c, from), ghost = this.ts.ghost === p.id;
      const m = movesOf(this.st(), from, { ghost }).find((x) => x.to === to); if (!m) throw new GameError("Так ходити не можна");
      const fire = this.ts.fire === p.id, path = fire ? pathOf(from, to) : [];
      p.moved = true;
      if (m.attack) {
        const q = this.board[to], atk = atkOf(p);
        this.note(`⚔️ ${PIECES[p.t].name} б’є: ${this.pname(q)} (−${atk})`);
        this.effect("slash", to, { from });
        const r = this.damage(to, atk, from);
        if (this.phase !== "play") return;
        if (r.killed && this.board[from] === p) { this.board[to] = p; this.board[from] = null; this.effect("move", to, { from }); this.arrive(to, from); }
      } else { this.board[to] = p; this.board[from] = null; this.effect("move", to, { from }); this.arrive(to, from); }
      if (this.phase !== "play") return;
      if (fire) {
        let melt = false;
        path.forEach((i) => {
          const t = this.tiles[i];
          if (this.board[i] || (t && ["portal", "void", "hole", "wall"].includes(t.k))) return;
          if (t && t.k === "ice") { this.tiles[i] = { k: "water", ttl: 3 }; melt = true; this.effect("steam", i); return; }
          this.tiles[i] = { k: "fire", ttl: this.realm === "volcano" ? 3 : 2 };
        });
        this.effect("fire", from);
        if (melt) this.combo("Танення", c, from);
      }
      this.after(fire ? p.id : null);
    }
    doShoot(c, from, to) {
      const p = this.pieceOk(c, from);
      if (!shotsOf(this.st(), from).includes(to)) throw new GameError("Туди не вистрілити");
      p.gun -= 1; const q = this.board[to];
      this.note(`🔫 Постріл у ${this.pname(q)}${p.gun ? "" : " — набої скінчилися"}`); this.effect("shot", to, { from });
      let behind = -1;
      if (p.rage) {                                                       // бронебійні: куля летить далі
        const [r0, c0] = rc(from), [r1, c1] = rc(to), dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
        for (let d = 1; d <= 4; d++) { const x = at(r1 + dr * d, c1 + dc * d); if (x < 0) break; if (this.tiles[x] && this.tiles[x].k === "wall") break; if (this.board[x]) { if (this.board[x].c !== c) behind = x; break; } }
      }
      this.damage(to, 1 + (p.rage ? 1 : 0) + (p.rank >= 2 ? 1 : 0), from);
      if (this.phase !== "play") return;
      if (behind >= 0 && this.board[behind]) { this.combo("Бронебійні кулі", c, behind); this.effect("shot", behind, { from: to }); this.damage(behind, 1, from); if (this.phase !== "play") return; }
      this.after(null);
    }
    doSkill(c, from) {
      const p = this.pieceOk(c, from), S = SKILLS[p.t];
      if (p.cd) throw new GameError(`${S.e} ${S.name} перезаряджається: ще ${p.cd} ${p.cd === 1 ? "хід" : "ходи"}`);
      const tg = skillTargets(this.st(), from);
      const need = p.t === "P" ? tg.buff.some((x) => (this.board[x].shield || 0) < SHIELD_MAX) : p.t === "K" ? tg.buff.length : p.t === "B" ? tg.hit.length || tg.heal.length : tg.hit.length;
      if (!need) throw new GameError(p.t === "P" ? "Щити вже повні" : p.t === "K" ? "Поруч немає союзників" : p.t === "B" ? "На діагоналях нікого" : "Поруч немає ворогів");
      p.cd = S.cd; this.stats[c].skills += 1;
      this.note(`${S.e} ${PIECES[p.t].name} ${c === "w" ? "білих" : "чорних"}: «${S.name}»`);
      this.effect("skill", from, { t: p.t, c });
      if (p.t === "P") {
        const ph = tg.buff.length >= 4;
        tg.buff.forEach((x) => { this.board[x].shield = Math.min(SHIELD_MAX, (this.board[x].shield || 0) + (ph ? 2 : 1)); this.effect("shield", x); });
        if (ph) this.combo("Фаланга", c, from);
      } else if (p.t === "N") tg.hit.forEach((x) => { if (this.phase === "play" && this.board[x] && this.board[from] === p) { this.effect("boom", x); this.damage(x, 1, from); } });
      else if (p.t === "R") tg.hit.forEach((x) => { if (this.phase === "play" && this.board[x] && this.board[from] === p) { this.effect("shot", x, { from }); this.damage(x, 1, from); } });
      else if (p.t === "B") {
        tg.heal.forEach((x) => { const q = this.board[x]; q.hp = Math.min(q.max, q.hp + 1); this.effect("heal", x); });
        tg.hit.forEach((x) => { if (this.phase === "play" && this.board[x] && this.board[from] === p) { this.effect("holy", x); this.damage(x, 1, from); } });
      } else if (p.t === "Q") {
        const [r0, c0] = rc(from);
        tg.hit.forEach((x) => {
          if (this.phase !== "play" || !this.board[x] || this.board[from] !== p) return;
          const res = this.damage(x, 1, from); if (res.killed || !this.board[x] || this.phase !== "play") return;
          const [r1, c1] = rc(x), y = at(r1 + (r1 - r0), c1 + (c1 - c0));
          const fall = y < 0 || (this.tiles[y] && ["void", "hole", "lava"].includes(this.tiles[y].k));
          if (y >= 0 && !this.board[y] && enterable(this.tiles, y)) { this.board[y] = this.board[x]; this.board[x] = null; this.effect("slide", y, { from: x }); this.arrive(y, x, 2); }
          else if (fall) { this.combo("У безодню", c, x); this.damage(x, 1, null); }
        });
      } else if (p.t === "K") {
        const last = p.hp <= 2;
        tg.buff.forEach((x) => { const q = this.board[x]; q.rage = Math.max(q.rage || 0, 3); if (last) q.shield = Math.min(SHIELD_MAX, (q.shield || 0) + 1); this.effect("rage", x); });
        if (last) this.combo("Останній бій", c, from);
      }
      if (this.phase !== "play") return;
      this.after(null);
    }
    after(fireId) {
      this.ts.used += 1;
      if (fireId != null) this.ts.lock = this.board.some((p) => p && p.id === fireId) ? fireId : null;
      if (this.ts.used >= this.ts.moves || !this.canMoveLocked()) this.endTurn(); else this.touch();
    }
    cardOk(c, k, a, b) {
      const C = CARDS[k], P = a != null && a >= 0 ? this.board[a] : null, own = P && P.c === c, enemy = P && P.c !== c;
      const inRange = a != null && a >= 0 && a < 64, [ar, ac] = inRange ? rc(a) : [-1, -1];
      const ok = { own, ownP: own && P.t === "P", ownNK: own && P.t !== "K", ownHurt: own && P.hp < P.max, ownClone: own && !["K", "Q"].includes(P.t) && !P.clone,
        enemy, enemyNK: enemy && P.t !== "K", enemyMinor: enemy && ["R", "B", "N"].includes(P.t),
        empty: inRange && !this.board[a] && !this.tiles[a], any: inRange, inner: inRange && ar >= 1 && ar <= 6 && ac >= 1 && ac <= 6, none: true }[C.tgt];
      if (!ok) return "Ця карта сюди не підходить";
      if (C.two === "empty" && !(b != null && b >= 0 && b < 64 && !this.board[b] && enterable(this.tiles, b))) return "Обери вільну клітинку";
      if (C.two === "own" && !(b != null && b !== a && this.board[b] && this.board[b].c === c)) return "Обери другу свою фігуру";
      if (["fire", "ghost", "rage", "vamp"].includes(k) && P.frozen) return "❄️ Фігура вмерзла в лід";
      if (k === "fire" && !movesOf(this.st(), a).length) return "Цій фігурі нікуди ходити";
      if (k === "clone" && !around(a).some((x) => !this.board[x] && enterable(this.tiles, x))) return "Поруч немає місця для двійника";
      return null;
    }
    doCard(c, i, a, b) {
      const hand = this.hands[c], k = hand[i], C = CARDS[k]; if (!C) throw new GameError("Немає такої карти");
      if (this.ts.card) throw new GameError("Одна карта за хід");
      if (this.ts.used) throw new GameError("Карту грають до ходу");
      const bad = this.cardOk(c, k, a, b); if (bad) throw new GameError(bad);
      const P = a != null && a >= 0 ? this.board[a] : null;
      hand.splice(i, 1); this.ts.card = true; this.stats[c].cards += 1;
      this.note(`${C.e} ${this.cname(c)}: «${C.name}»${P ? " → " + this.pname(P) : ""}`);
      this.effect("card", a == null ? -1 : a, { card: k, c });
      if (k === "fire") {
        this.ts.fire = P.id; this.ts.lock = P.id; this.ts.moves = Math.max(this.ts.moves, 2);
        if (P.poison) { P.poison = 0; P.hp = Math.min(P.max, P.hp + 1); this.effect("heal", a); this.combo("Випалювання", c, a); }
      }
      else if (k === "gun") P.gun = 3;
      else if (k === "shield") { P.shield = Math.min(SHIELD_MAX, (P.shield || 0) + 2); this.effect("shield", a); }
      else if (k === "freeze") {
        const hot = this.tiles[a] && ["fire", "lava"].includes(this.tiles[a].k);
        if (hot) { this.combo("Термошок", c, a); this.tiles[a] = null; this.damage(a, 2, null); }
        else { P.frozen = this.realm === "frost" ? 3 : 2; this.effect("freeze", a); }
      }
      else if (k === "tele") { this.board[b] = P; this.board[a] = null; this.effect("portal", a); this.effect("portal", b); this.arrive(b, null, 1); }
      else if (k === "heal") { P.hp = Math.min(P.max + 1, P.hp + 2); this.effect("heal", a); }
      else if (k === "bolt") this.lightning(a, c);
      else if (k === "ghost") this.ts.ghost = P.id;
      else if (k === "mine") this.tiles[a] = { k: "mine", own: c };
      else if (k === "swap") { const Q = this.board[b]; this.board[a] = Q; this.board[b] = P; this.effect("portal", a); this.effect("portal", b); }
      else if (k === "rage") { P.rage = 3; this.effect("rage", a); }
      else if (k === "wall") this.tiles[a] = { k: "wall", ttl: 3 };
      else if (k === "poison") { P.poison = this.realm === "swamp" ? 4 : 3; this.effect("poison", a); }
      else if (k === "frog") { P.t = "P"; P.max = 1 + (P.rank ? 1 : 0); P.hp = Math.min(P.hp, P.max); P.moved = true; this.effect("frog", a); }
      else if (k === "mirror") { P.mirror = true; this.effect("mirror", a); }
      else if (k === "volcano") { const [r0, c0] = rc(a); [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const s = at(r0 + dr, c0 + dc); if (s < 0 || this.phase !== "play") return;
          const steam = this.makeLava(s, 2, c); this.effect("boom", s); if (!steam && this.board[s]) this.damage(s, 1, null); }); }
      else if (k === "promote") { const t = ["N", "B", "R"][rnd(3)]; P.t = t; P.max = PIECES[t].hp + (P.rank ? 1 : 0); P.hp = P.max; P.gun = 0; this.effect("promote", a); this.note(`⬆️ Пішак став: ${PIECES[t].name.toLowerCase()}`); }
      else if (k === "haste") this.ts.moves = Math.max(this.ts.moves, 2);
      else if (k === "meteor") this.tiles[a] = { k: "meteor", own: c, at: this.ply + 2 };
      else if (k === "vortex") { const [r0, c0] = rc(a); this.remap((i) => { const [r, cc] = rc(i), dr = r - r0, dc = cc - c0; return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 ? at(r0 + dc, c0 - dr) : i; }); this.effect("vortex", a); }
      else if (k === "clone") { const free = around(a).filter((x) => !this.board[x] && enterable(this.tiles, x)), s = free[rnd(free.length)];
        this.board[s] = { id: ++this.ids, t: P.t, c, hp: 1, max: 1, xp: 0, rank: 0, cd: 0, moved: true, clone: true }; this.effect("clone", s, { from: a }); }
      else if (k === "vamp") { P.vamp = 3; this.effect("vamp", a); }
      else if (k === "blackhole") {
        this.tiles[a] = { k: "void", ttl: 2 }; this.effect("blackhole", a);
        around(a).forEach((x) => { if (this.board[x] && this.phase === "play") this.damage(x, 1, null); });
        const [r0, c0] = rc(a);
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== 2 || this.phase !== "play") continue;
          const s = at(r0 + dr, c0 + dc); if (s < 0 || !this.board[s]) continue;
          const y = at(r0 + Math.sign(dr), c0 + Math.sign(dc));
          if (y >= 0 && !this.board[y] && enterable(this.tiles, y)) { this.board[y] = this.board[s]; this.board[s] = null; this.effect("slide", y, { from: s }); this.arrive(y, null, 1); }
        }
      }
      if (this.phase === "play" && !this.canMoveLocked()) this.endTurn(); else this.touch();
    }
    // переставити всю дошку (дзеркало, карусель, вихор): fn — нове місце клітинки
    remap(fn) {
      const nb = Array(64).fill(null), nt = Array(64).fill(null);
      for (let i = 0; i < 64; i++) { const j = fn(i); nb[j] = this.board[i]; nt[j] = this.tiles[i]; }
      nt.forEach((t) => { if (t && t.k === "portal") t.link = fn(t.link); });
      this.board = nb; this.tiles = nt;
    }

    /* ---------- світи й події дошки */
    freeSquares(rows = [2, 3, 4, 5]) { const out = []; for (let i = 0; i < 64; i++) if (rows.includes(rc(i)[0]) && !this.board[i] && !this.tiles[i]) out.push(i); return out; }
    take(list, n) { const out = []; while (out.length < n && list.length) out.push(list.splice(rnd(list.length), 1)[0]); return out; }
    strike() {
      const ps = []; this.board.forEach((p, i) => { if (p && p.t !== "K") ps.push(i); });
      if (ps.length) { const i = ps[rnd(ps.length)]; this.note(`⛈ Блискавка б’є: ${this.pname(this.board[i])}`); this.lightning(i, null); }
    }
    realmTick() {
      const R = this.realm; if (R === "arcana") return;
      if (R === "volcano") this.take(this.freeSquares([2, 3, 4, 5]), 2).forEach((i) => this.makeLava(i, 2, null));
      else if (R === "frost") this.take(this.freeSquares([1, 2, 3, 4, 5, 6]), 2).forEach((i) => { this.tiles[i] = { k: "ice", ttl: 3 }; });
      else if (R === "swamp") this.take(this.freeSquares([1, 2, 3, 4, 5, 6]), 1).forEach((i) => { this.tiles[i] = { k: "water", ttl: 3 }; });
      else if (R === "storm") this.strike();
      else if (R === "desert" && this.tiles.filter((t) => t && t.k === "chest").length < 3) this.take(this.freeSquares(), 1).forEach((i) => { this.tiles[i] = { k: "chest", ttl: 6 }; this.effect("chest", i); });
      if (this.phase !== "play") return;
      this.realmLeft -= 1;
      if (this.realmLeft <= 0) { this.note(`🔮 ${REALMS[R].name} минає — дошка повертається до Аркани`); this.realm = "arcana"; this.realmLeft = 0; this.effect("realm", -1, { realm: "arcana" }); }
    }
    setRealm(k) {
      this.realm = k; this.realmLeft = REALM_ROUNDS; this.effect("realm", -1, { realm: k });
      if (k === "volcano") this.take(this.freeSquares(), 4).forEach((i) => this.makeLava(i, 3, null));
      else if (k === "frost") { this.tiles.forEach((t, i) => { if (t && (t.k === "fire" || t.k === "lava")) this.tiles[i] = { k: "ice", ttl: 3 }; }); this.take(this.freeSquares([1, 2, 3, 4, 5, 6]), 6).forEach((i) => { this.tiles[i] = { k: "ice", ttl: 4 }; }); }
      else if (k === "swamp") this.take(this.freeSquares([1, 2, 3, 4, 5, 6]), 5).forEach((i) => { this.tiles[i] = { k: "water", ttl: 4 }; });
      else if (k === "storm") for (let j = 0; j < 3 && this.phase === "play"; j++) this.strike();
      else if (k === "cosmos") this.portals();
      else if (k === "desert") { this.tiles.forEach((t, i) => { if (t && (t.k === "water" || t.k === "ice")) this.tiles[i] = null; }); this.take(this.freeSquares(), 3).forEach((i) => { this.tiles[i] = { k: "chest", ttl: 6 }; }); }
    }
    portals() { const sq = this.take(this.freeSquares([1, 2, 3, 4, 5, 6]), 4); for (let j = 0; j + 1 < sq.length; j += 2) { this.tiles[sq[j]] = { k: "portal", link: sq[j + 1], ttl: 4, pair: j / 2 }; this.tiles[sq[j + 1]] = { k: "portal", link: sq[j], ttl: 4, pair: j / 2 }; } }
    applyEvent(k) {
      const E = EVENTS[k]; if (!E) return;
      this.lastEvent = k; this.note(`${E.e} Подія: ${E.name}! ${E.desc}`); this.effect("event", -1, { ev: k });
      if (E.realm) return this.setRealm(k);
      if (k === "quake") this.take(this.freeSquares(), 4).forEach((i) => { this.tiles[i] = { k: "hole", ttl: 3 }; this.effect("crumble", i); });
      else if (k === "shape") {
        const keys = Object.keys(SHAPES).sort(() => Math.random() - .5);
        for (const s of keys) {
          const cells = SHAPES[s].cells().filter((i) => !this.board[i] && !this.tiles[i]);
          if (cells.length < 4) continue;
          cells.forEach((i) => { this.tiles[i] = { k: "void", ttl: 3 }; this.effect("crumble", i); });
          this.note(`🗺 Нова форма дошки: «${SHAPES[s].name}»`); this.shape = s; break;
        }
      }
      else if (k === "mirror") { this.remap((i) => { const [r, c] = rc(i); return at(r, 7 - c); }); this.effect("flipboard", -1); }
      else if (k === "carousel") { this.remap((i) => { const [r, c] = rc(i); return r === 3 ? at(r, (c + 1) % 8) : r === 4 ? at(r, (c + 7) % 8) : i; }); this.effect("carousel", -1); }
      else if (k === "portals") this.portals();
      else if (k === "meteors") {
        const cand = []; for (let i = 16; i < 48; i++) if (!this.tiles[i] && !(this.board[i] && this.board[i].t === "K")) cand.push(i);
        this.take(cand, 3).forEach((i) => { this.tiles[i] = { k: "meteor", own: null, at: this.ply + 2 }; });
      }
      else if (k === "fog") this.rules.fog = 2;
      else if (k === "bless") this.board.forEach((p, i) => { if (p) { p.cd = 0; if (p.hp < p.max) { p.hp += 1; this.effect("heal", i); } } });
      else if (k === "chaos") this.rules.chaos = 2;
      else if (k === "rush") this.rules.rush = 1;
      else if (k === "rain") ["w", "b"].forEach((c) => { for (let j = 0; j < 2 && this.hands[c].length < HAND_MAX + 1; j++) this.hands[c].push(pickW(CARDS)); });
    }

    /* ---------- таймер: задовго думав — хід за тебе (як зробив би бот) */
    tick() {
      if (!this.deadline || this.phase !== "play") return false;
      const sid = this.seats[this.turn], away = sid && this.members[sid] && !this.members[sid].online;
      if (this.clock() < this.deadline && !(away && this.clock() > this.deadline - TURN_SECONDS + OFFLINE_SECONDS)) return false;
      const c = this.turn; this.note(`⏱ ${this.cname(c)} ${away ? "не на зв’язку" : "думав(ла) надто довго"} — хід зроблено автоматично`);
      autoPlay(this, c, false);
      return true;
    }
    skip(by) { if (by !== this.host || this.phase !== "play") throw new GameError("Лише хост"); this.note(`⏭ Хост пропустив хід ${this.cname(this.turn)}`); this.endTurn(); }
    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Не можна");
      this.order.filter((p) => !this.members[p].online).forEach((p) => { delete this.members[p]; this.order = this.order.filter((x) => x !== p); });
      this.phase = "lobby"; this.resetGame(); this.deadline = null; this.touch();
    }
    channelsFor() { return { all: true }; }
    say(pid, channel, text) {
      text = String(text || "").trim().slice(0, 300); if (!text) return;
      const m = this.members[pid];
      this.chat.all.push({ from: pid, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look || {}, text, ts: Math.round(this.clock() * 1000) });
      this.chat.all = this.chat.all.slice(-CHAT_LIMIT); this.touch();
    }

    view(pid) {
      const me = this.colorOf(pid), end = this.phase === "end", fog = this.rules.fog && me && !end;
      let seen = null;
      if (fog) { seen = Array(64).fill(false); this.board.forEach((p, i) => { if (p && p.c === me) { const [r, c] = rc(i); for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) { const s = at(r + dr, c + dc); if (s >= 0) seen[s] = true; } } }); }
      const board = this.board.map((p, i) => (!p || (seen && !seen[i] && p.c !== me) ? null : { id: p.id, t: p.t, c: p.c, hp: p.hp, max: p.max, shield: p.shield || 0, frozen: p.frozen || 0, poison: p.poison || 0, rage: p.rage || 0,
        gun: p.gun || 0, mirror: !!p.mirror, moved: !!p.moved, vamp: p.vamp || 0, clone: !!p.clone, xp: p.xp || 0, rank: p.rank || 0, cd: p.cd || 0 }));
      const tiles = this.tiles.map((t, i) => (!t ? null : t.k === "mine" && t.own !== me && !end ? null : seen && !seen[i] && t.k === "mine" ? null : Object.assign({}, t)));
      const players = this.order.map((id) => { const m = this.members[id]; return { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host, color: this.colorOf(id), alive: true }; });
      return {
        game: "mchess", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "mchess", title: "Магічні шахи", emoji: "♟️", accent: "#a05bff", accent2: "#1a0a3a" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, seats: this.seats, me, turn: this.turn, round: this.round, ply: this.ply, board, tiles, fog: seen, rules: Object.assign({}, this.rules), realm: this.realm, realmLeft: this.realmLeft,
        hand: me ? this.hands[me].slice() : [], hands: { w: this.hands.w.length, b: this.hands.b.length }, ts: this.ts ? Object.assign({}, this.ts) : null,
        next: this.next, inRounds: Math.max(0, this.nextAt - this.round), log: this.log.slice(-10), fx: this.fx.slice(), fxSeq: this.fxSeq,
        winner: this.winner, winners: this.results ? this.results.winners : [], results: this.results || null,
        chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  /* ---------------------------------------------------------------- бот і автохід: карта (іноді) + найкращий хід / навичка за простою оцінкою */
  function planCard(room, c, smart) {
    const hand = room.hands[c]; if (!hand.length || room.ts.card || room.ts.used) return null;
    const st = room.st(), mine = [], foes = []; room.board.forEach((p, i) => { if (p) (p.c === c ? mine : foes).push(i); });
    const empty = []; for (let i = 0; i < 64; i++) if (!room.board[i] && !room.tiles[i]) empty.push(i);
    const kingSq = mine.find((i) => room.board[i].t === "K"), foeKing = foes.find((i) => room.board[i].t === "K");
    const danger = threats(st, other(c));
    const P = (s) => room.board[s], val = (s) => VALUE[P(s).t];
    const cluster = (s) => around(s).concat(s).reduce((a, x) => a + (P(x) ? (P(x).c === c ? -VALUE[P(x).t] - 2 : Math.min(VALUE[P(x).t], 12) + 1) : 0), 0);
    const tries = [];
    hand.forEach((k, i) => {
      if (k === "bolt") { const kill = foes.filter((s) => P(s).hp === 1 && !P(s).shield && !P(s).mirror).sort((a, b) => val(b) - val(a))[0]; if (kill != null) tries.push([20 + val(kill), { i, a: kill }]); else if (foeKing != null) tries.push([6, { i, a: foeKing }]); }
      if (k === "heal") { const h = mine.filter((s) => P(s).hp < P(s).max).sort((a, b) => val(b) - val(a))[0]; if (h != null) tries.push([5 + val(h) * (P(h).t === "K" ? .2 : 1), { i, a: h }]); }
      if (k === "shield" && kingSq != null) tries.push([danger.has(kingSq) ? 14 : 3, { i, a: kingSq }]);
      if (k === "mirror" && kingSq != null) tries.push([danger.has(kingSq) ? 12 : 2, { i, a: kingSq }]);
      if (k === "freeze") { const q = foes.filter((s) => movesOf(st, s).some((m) => m.attack)).sort((a, b) => val(b) - val(a))[0]; if (q != null) tries.push([7, { i, a: q }]); }
      if (k === "poison") { const q = foes.filter((s) => P(s).t !== "K").sort((a, b) => val(b) - val(a))[0]; if (q != null) tries.push([5, { i, a: q }]); }
      if (k === "frog") { const q = foes.filter((s) => ["R", "B", "N"].includes(P(s).t)).sort((a, b) => val(b) - val(a))[0]; if (q != null) tries.push([8, { i, a: q }]); }
      if (k === "gun") { const pw = mine.filter((s) => P(s).t === "P" && !P(s).gun); if (pw.length) tries.push([5, { i, a: pw[rnd(pw.length)] }]); }
      if (k === "promote") { const pw = mine.filter((s) => P(s).t === "P"); if (pw.length) tries.push([6, { i, a: pw[rnd(pw.length)] }]); }
      if (k === "rage" || k === "vamp") { const s = mine.find((x) => !P(x).frozen && movesOf(st, x).some((m) => m.attack)); if (s != null) tries.push([6, { i, a: s }]); }
      if (k === "fire" || k === "ghost") { const s = mine.filter((x) => P(x).t !== "K" && !P(x).frozen && movesOf(st, x).length); if (s.length) tries.push([3, { i, a: s[rnd(s.length)] }]); }
      if (k === "haste") tries.push([4, { i }]);
      if (k === "wall" && kingSq != null) { const adj = around(kingSq).filter((s) => !room.board[s] && !room.tiles[s]); if (adj.length && danger.has(kingSq)) tries.push([6, { i, a: adj[rnd(adj.length)] }]); }
      if (k === "mine" && empty.length) { const mid = empty.filter((s) => { const r = rc(s)[0]; return c === "w" ? r >= 2 && r <= 4 : r >= 3 && r <= 5; }); if (mid.length) tries.push([2, { i, a: mid[rnd(mid.length)] }]); }
      if ((k === "volcano" || k === "meteor") && foes.length) { const best = foes.filter((x) => P(x).t !== "K" || k === "meteor").map((s) => [cluster(s), s]).sort((a, b) => b[0] - a[0])[0]; if (best && best[0] > 0) tries.push([2 + best[0] * .6, { i, a: best[1] }]); }
      if (k === "blackhole") { const best = empty.map((s) => [cluster(s), s]).sort((a, b) => b[0] - a[0])[0]; if (best && best[0] > 2) tries.push([best[0] * .5, { i, a: best[1] }]); }
      if (k === "clone") { const s = mine.filter((x) => ["R", "B", "N"].includes(P(x).t) && !P(x).clone && around(x).some((y) => !room.board[y] && enterable(room.tiles, y))); if (s.length) tries.push([4, { i, a: s[rnd(s.length)] }]); }
      if (k === "tele") { const s = mine.filter((x) => P(x).t !== "K" && P(x).t !== "P"); const e = empty.filter((x) => !danger.has(x)); if (s.length && e.length) tries.push([2, { i, a: s[rnd(s.length)], b: e[rnd(e.length)] }]); }
      if (k === "swap") { const s = mine.filter((x) => P(x).t !== "K"); if (s.length > 1) tries.push([1, { i, a: s[0], b: s[s.length - 1] }]); }
      if (k === "vortex" && foeKing != null) { const [r, cc] = rc(foeKing); tries.push([1.5, { i, a: at(Math.min(6, Math.max(1, r)), Math.min(6, Math.max(1, cc))) }]); }
    });
    if (!tries.length) return null;
    tries.sort((x, y) => y[0] - x[0]);
    const best = tries[0]; if (best[0] < (smart ? 4 : 6) && Math.random() < .5) return null;
    if (room.cardOk(c, hand[best[1].i], best[1].a == null ? null : best[1].a, best[1].b == null ? null : best[1].b)) return null;
    return Object.assign({ slot: "card" }, best[1]);
  }
  function skillScore(room, sq) {
    const st = room.st(), p = room.board[sq]; if (!skillReady(st, sq)) return null;
    const t = skillTargets(st, sq), B = room.board;
    let s = 0;
    t.hit.forEach((x) => { const q = B[x], eff = q.shield ? 0 : 1; s += eff >= q.hp ? 9 + Math.min(VALUE[q.t], 12) * 5 : eff * Math.min(VALUE[q.t], 10) * 1.2 + (q.t === "K" ? 18 : 0); if (q.mirror) s -= 4; });
    t.heal.forEach((x) => { s += 2 + Math.min(VALUE[B[x].t], 6) * .6; });
    if (p.t === "P") s += t.buff.length >= 4 ? 4 : .3 + t.buff.length * .25;
    if (p.t === "K") s += t.buff.filter((x) => movesOf(st, x).some((m) => m.attack)).length * 3 + (p.hp <= 2 ? 4 : 0);
    return s + Math.random();
  }
  function planMove(room, c) {
    const st = room.st(), danger = threats(st, other(c)), all = [];
    room.board.forEach((p, i) => {
      if (!p || p.c !== c || p.frozen) return; if (room.ts.lock != null && room.ts.lock !== p.id) return;
      const ghost = room.ts.ghost === p.id;
      movesOf(st, i, { ghost }).forEach((m) => {
        let s = Math.random() * 1.5; const q = room.board[m.to];
        if (m.attack) { const eff = Math.max(0, atkOf(p) - (q.shield || 0)); s += eff >= q.hp ? 10 + Math.min(VALUE[q.t], 12) * 6 + (q.t === "K" ? 500 : 0) : eff * Math.min(VALUE[q.t], 12) * 1.5 + (q.t === "K" ? 25 : 0); if (q.mirror) s -= 6; }
        else { if (danger.has(m.to)) s -= VALUE[p.t] * 3; if (danger.has(i)) s += VALUE[p.t] * 2.5; if (p.t === "P") s += .6; const r = rc(m.to)[0]; s += (3.5 - Math.abs(3.5 - r)) * .15;
          const t = room.tiles[m.to]; if (t && t.k === "chest") s += 6; if (t && t.k === "meteor") s -= 8; if (t && t.k === "mine" && t.own !== c) s -= 8; }
        if (p.t === "K" && !m.attack) s -= 1.5;
        all.push([s, { slot: "move", from: i, to: m.to }]);
      });
      shotsOf(st, i).forEach((to) => { const q = room.board[to]; all.push([(q.hp <= 1 ? 9 + Math.min(VALUE[q.t], 12) * 6 + (q.t === "K" ? 500 : 0) : Math.min(VALUE[q.t], 12) * 2) + (q.t === "K" ? 20 : 0) + Math.random(), { slot: "shoot", from: i, to }]); });
      const sk = skillScore(room, i); if (sk != null) all.push([sk, { slot: "skill", from: i }]);
    });
    if (!all.length) return null;
    all.sort((a, b) => b[0] - a[0]);
    return all[0][1];
  }
  // повний хід за гравця (таймер) — без затримок
  function autoPlay(room, c, smart) {
    for (let guard = 0; guard < 6 && room.phase === "play" && room.turn === c; guard++) {
      const card = guard === 0 && smart ? planCard(room, c, smart) : null;
      if (card) { try { room.doCard(c, card.i, card.a == null ? null : card.a, card.b == null ? null : card.b); continue; } catch (e) { /* не вийшло — просто хід */ } }
      const mv = planMove(room, c);
      if (!mv) { room.endTurn(); break; }
      try { if (mv.slot === "shoot") room.doShoot(c, mv.from, mv.to); else if (mv.slot === "skill") room.doSkill(c, mv.from); else room.doMove(c, mv.from, mv.to); } catch (e) { room.endTurn(); break; }
    }
    room.touch();
  }

  const api = { MChessRoom, PIECES, SKILLS, CARDS, EVENTS, REALMS, COMBOS, SHAPES, VALUE, ECLIPSE, REALM_ROUNDS, movesOf, shotsOf, skillTargets, skillReady, threats, pathOf, planCard, planMove, autoPlay, rc, at, around, atkOf,
    MIN_PLAYERS, MAX_PLAYERS, TURN_SECONDS, HAND_MAX };
  root.MChess = api;
  Engine.MChessRoom = MChessRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
