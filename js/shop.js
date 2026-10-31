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

    I("bg", "rpg", "Замок", 0), I("bg", "arcade", "Аркада", 80), I("bg", "office", "Офис", 100), I("bg", "classic", "Нуар", 100),
    I("bg", "90s", "Район 90-х", 100), I("bg", "halloween", "Кладбище", 120), I("bg", "bunker", "Бункер", 120), I("bg", "west", "Салун", 120),
    I("bg", "shop", "Лавка", 150), I("bg", "winter", "Зимний лес", 160), I("bg", "sakura", "Сакура", 180), I("bg", "ocean", "Подводный мир", 180),
    I("bg", "dungeon", "Подземелье", 200), I("bg", "space", "Космос", 220),

    I("style", "rpg", "Ролевая игра", 0, { desc: "Синее окно героя, уровень и полоски" }),
    I("style", "dossier", "Досье", 150, { desc: "Папка детектива со штампом" }),
    I("style", "terminal", "Терминал", 180, { desc: "Зелёный экран бункера" }),
    I("style", "vhs", "Кассета", 180, { desc: "Наклейка на видеокассете из 90-х" }),
    I("style", "badge", "Пропуск", 200, { desc: "Бейдж сотрудника со штрихкодом" }),
    I("style", "tarot", "Карта таро", 200, { desc: "Мистическая карта с римским числом" }),
    I("style", "wanted", "Разыскивается", 220, { desc: "Плакат с наградой за твою голову" }),
    I("style", "arcade", "Аркада", 250, { desc: "Таблица рекордов игрового автомата" }),

    I("title", "none", "Без титула", 0, { text: "" }),
    I("title", "honest", "Честный житель", 50, { text: "Честный житель" }), I("title", "suspect", "Вечно подозреваемый", 60, { text: "Вечно подозреваемый" }),
    I("title", "paranoid", "Главный параноик", 70, { text: "Главный параноик" }), I("title", "alibi", "Мастер алиби", 90, { text: "Мастер алиби" }),
    I("title", "eye", "Глаз-алмаз", 100, { text: "Глаз-алмаз" }), I("title", "soul", "Душа компании", 100, { text: "Душа компании" }),
    I("title", "devil", "Адвокат дьявола", 120, { text: "Адвокат дьявола" }), I("title", "silent", "Тихий убийца", 140, { text: "Тихий убийца" }),
    I("title", "bluff", "Король блефа", 160, { text: "Король блефа" }), I("title", "self", "Сам себе мафия", 180, { text: "Сам себе мафия" }),
    I("title", "hood", "Легенда района", 220, { text: "Легенда района" }), I("title", "night", "Хозяин ночи", 260, { text: "Хозяин ночи" }),
    I("title", "untouch", "Неприкасаемый", 300, { text: "Неприкасаемый" }), I("title", "godfather", "Крёстный отец", 400, { text: "Крёстный отец" }),

    I("fx", "none", "Обычное имя", 0), I("fx", "glow", "Сияние", 120), I("fx", "wave", "Волна", 160), I("fx", "gold", "Золотое имя", 180),
    I("fx", "glitch", "Глитч", 220), I("fx", "rainbow", "Радуга", 250), I("fx", "fire", "Пламя", 300),

    I("ava", "dragon", "Дракон", 40, { emoji: "🐉" }), I("ava", "dino", "Динозавр", 40, { emoji: "🦖" }), I("ava", "invader", "Пришелец", 50, { emoji: "👾" }),
    I("ava", "wizard", "Волшебник", 50, { emoji: "🧙" }), I("ava", "shark", "Акула", 50, { emoji: "🦈" }), I("ava", "bat", "Летучая мышь", 60, { emoji: "🦇" }),
    I("ava", "spider", "Паук", 60, { emoji: "🕷️" }), I("ava", "skull", "Череп", 70, { emoji: "💀" }), I("ava", "clown", "Клоун", 70, { emoji: "🤡" }),
    I("ava", "oni", "Демон", 80, { emoji: "👹" }), I("ava", "genie", "Джинн", 80, { emoji: "🧞" }), I("ava", "villain", "Злодей", 90, { emoji: "🦹" }),
  ];
  const byId = (cat, id) => ITEMS.find((x) => x.cat === cat && x.id === id);
  const DEFAULT = { frame: "none", bg: "rpg", style: "rpg", title: "none", fx: "none" };
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
  const frameCache = {};
  function frameUrl(key) {
    if (!FRAMES[key]) return "";
    if (frameCache[key]) return frameCache[key];
    const c = document.createElement("canvas"); c.width = N; c.height = N;
    let seed = 7; for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const R = () => { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 8) / 16777216; };
    FRAMES[key](painter(c.getContext("2d")), R);
    return (frameCache[key] = c.toDataURL());
  }
  const frameImg = (key) => {
    if (!key || key === "none" || !FRAMES[key]) return "";
    const it = byId("frame", key);
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
  const owns = (it) => it.price === 0 || store.owned.includes(it.cat + ":" + it.id);
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
    const scene = typeof Pixel !== "undefined" ? Pixel.scene(lk.bg) : "";
    const bg = `<div class="pc-scene" style="background-image:url(${scene})"></div>`;
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

  return { CATS, ITEMS, DEFAULT, REWARD, byId, attach, owns, look, buy, equip, reward, chestReady, openChest, ownedAvatars, frameImg, frameUrl,
    card, nameFx, level, rank, titleText, demo, get coins() { return store ? store.coins : 0; } };
})();
