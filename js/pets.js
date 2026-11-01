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
    pechenka: "🍪", morozhenoe: "🍦", tort: "🍰", energetik: "🥤", baton: "🍫", bronya: "🥫", perets: "🌶️", pyl: "✨" };
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
    "гоняет пылинки", "спит на клавиатуре", "собирает фантики", "рисует лапой на стекле", "пугает тени"];
  const QUIRK = ["чихает, когда радуется", "боится огурцов", "храпит громче хозяина", "обижается на будильник", "любит, когда чешут пузо",
    "не любит, когда трогают уши", "засыпает посреди игры", "ревнует к телефону", "приносит подарки (обычно мусор)",
    "смотрит в одну точку по полчаса", "икает после еды", "здоровается с холодильником"];
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
  ].map(([id, key, group, emoji, name, desc]) => ({ id, key, group, emoji, name, desc }));
  const MUT_ID = Object.fromEntries(MUTATIONS.map((m) => [m.id, m]));

  const byte = (dna, i) => parseInt(String(dna).slice(i * 2, i * 2 + 2), 16) || 0;
  const name = (dna) => NAME_A[byte(dna, 0) % NAME_A.length] + NAME_B[byte(dna, 1) % NAME_B.length];
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
    const ks = muts(dna).map((m) => m.key);
    return ks.includes("pair") ? `${name(dna)} & ${name(partner(dna))}` : ks.includes("twins") ? `${name(dna)}-${name(dna)}` : name(dna);
  }
  function traits(dna) {
    const fav = FOOD_KEYS[byte(dna, 5) % FOOD_KEYS.length];
    const dis = FOOD_KEYS[(FOOD_KEYS.indexOf(fav) + 1 + (byte(dna, 6) % (FOOD_KEYS.length - 1))) % FOOD_KEYS.length];
    const ms = muts(dna), pair = ms.some((m) => m.key === "pair"), p2 = pair ? partner(dna) : null;
    return {
      name: fullName(dna), social: byte(dna, 4) % 3, fav, dis, shape: SHAPES[byte(dna, 2) % SHAPES.length],
      temper: TEMPER[byte(dna, 12) % TEMPER.length], hobby: HOBBY[byte(dna, 11) % HOBBY.length], quirk: QUIRK[byte(dna, 13) % QUIRK.length],
      code: String(dna).slice(0, 4).toUpperCase() + "-" + String(dna).slice(28, 32).toUpperCase(),
      muts: ms, element: ms.find((m) => m.group === "element") || null,
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
    return { hp, atk, def, spd };
  }
  // что умеет в бою (из мутаций и стихии)
  const SKILLS = {
    fire: "поджигает врага", ice: "может заморозить", storm: "чаще бьёт критом", shadow: "уворачивается", crystal: "кристальный щит",
    cosmic: "подлечивается звёздами", vampire: "пьёт здоровье", zombie: "встаёт один раз после поражения", angel: "лечится, когда плохо",
    werewolf: "звереет на половине здоровья", cthulhu: "оглушает щупальцами", twins: "бьёт дважды", pair: "бьёт дважды", wizard: "магия пробивает защиту",
    ghost: "уворачивается", ninja: "уворачивается", tiny: "юркий", glitch: "телепортируется от ударов", sixeyes: "меткий", bigeye: "меткий",
  };
  const skills = (dna) => muts(dna).filter((m) => SKILLS[m.key]).map((m) => ({ emoji: m.emoji, text: SKILLS[m.key] }));
  const rarityName = (rarity, dna) => { const el = muts(dna).find((m) => m.group === "element"); return RARITY[rarity].name + (el ? " · " + el.name : ""); };

  /* ---------------------------------------------------------------- цвета */
  const hsl = (h, s, l) => `hsl(${((h % 360) + 360) % 360} ${Math.max(0, Math.min(100, s))}% ${Math.max(0, Math.min(100, l))}%)`;
  function palette(dna, rarity, M) {
    const hue = Math.round(byte(dna, 3) * 360 / 256), hue2 = hue + 140 + (byte(dna, 14) % 80);
    const sat = [42, 62, 74, 80, 88][rarity], fluke = byte(dna, 15);
    let base = { h: hue, s: sat, l: 58 }, skin = "normal";
    const over = M.zombie ? { h: 95, s: 24, l: 52 } : M.vampire ? { h: 265, s: 14, l: 84 } : M.mummy ? { h: 40, s: 34, l: 76 }
      : M.ghost ? { h: 195, s: 45, l: 86 } : M.skeleton ? { h: 250, s: 14, l: 22 } : M.werewolf ? { h: 26, s: 26, l: 44 }
      : M.demon ? { h: 356, s: 70, l: 46 } : M.angel ? { h: 46, s: 60, l: 90 } : M.cthulhu ? { h: 168, s: 40, l: 44 }
      : M.ice ? { h: 194, s: 72, l: 74 } : M.shadow ? { h: 265, s: 34, l: 16 } : M.cosmic ? { h: 238, s: 58, l: 20 } : null;
    if (over) { base = over; skin = "mut"; }
    else if (fluke >= 252 - rarity * 3) { skin = "albino"; base = { h: hue, s: 8, l: 90 }; }          // редкие окрасы
    else if (fluke < 3 + rarity * 2) { skin = "shadow"; base = { h: hue, s: 30, l: 16 }; }
    else if (rarity >= 3 && fluke % 7 === 0) { skin = "gold"; base = { h: 44, s: 92, l: 56 }; }
    const rainbow = rarity === 4 && skin === "normal", dark = base.l < 30;
    return {
      skin, hue, hue2,
      body: (dy) => (rainbow ? hsl(hue + dy * 14, 85, 62) : hsl(base.h, base.s, base.l)),
      light: (dy) => (rainbow ? hsl(hue + dy * 14, 90, 78) : hsl(base.h, base.s - 6, base.l + (dark ? 10 : 14))),
      dark: (dy) => (rainbow ? hsl(hue + dy * 14, 70, 44) : hsl(base.h, base.s + 4, base.l - (dark ? 8 : 18))),
      line: dark ? hsl(M.shadow ? 275 : hue, 70, 55) : hsl(base.h, Math.min(60, base.s), 14),
      accent: hsl(hue2, Math.max(50, sat), 60), accentDark: hsl(hue2, Math.max(50, sat), 42),
      eye: M.vampire ? "#ff2b3b" : M.werewolf || M.demon || M.mummy ? "#ffd23b" : M.shadow || skin === "shadow" ? hsl(M.shadow ? 280 : hue2, 100, 70) : dark ? "#f4f0ff" : "#14121c",
      glow: RARITY[rarity].color,
    };
  }

  /* ---------------------------------------------------------------- форма тела по генам */
  const W = 40;
  function geo(dna, f, dead, cx, bottom, scale, M) {
    const shape = M.ghost ? 4 : byte(dna, 2) % 7;
    let rx = 7 + (byte(dna, 8) >> 6) + (shape === 3 || shape === 0 ? 1 : 0), ry = 7 + ((byte(dna, 9) >> 6) & 1) + (shape === 2 ? 2 : 0);
    if (shape === 2) rx -= 1;
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
        default: return u * u + v * v <= 1;
      }
    };
    const top = Math.round(cy - ry * (shape === 6 ? 1 : .92)), eyeY = Math.round(cy - ry * .12);
    return { shape, rx, ry, cx, cy, bottom, inside, top, eyeY, eX: Math.max(2, Math.round(rx * .4)), mY: eyeY + 3, ex: Math.round(rx * .55) };
  }

  /* ---------------------------------------------------------------- один кадр */
  function frame(code, f, dead) {
    const rarity = Math.max(0, Math.min(4, Number(code[0]) || 0)), dna = code.slice(1);
    const M = {}; muts(dna).forEach((m) => { M[m.key] = true; });
    const g = Array.from({ length: W }, () => Array(W).fill(null));
    const solid = Array.from({ length: W }, () => Array(W).fill(false));
    const put = (x, y, c, s = true) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < W) { g[y][x] = c; if (s) solid[y][x] = true; } };
    const empty = (x, y) => { x = Math.round(x); y = Math.round(y); return x >= 0 && y >= 0 && x < W && y < W && !g[y][x]; };
    const isSolid = (x, y) => solid[Math.round(y)] && solid[Math.round(y)][Math.round(x)];
    const side = (fn) => { fn(-1); fn(1); };
    const live = !dead, wave = live ? f % 2 : 0;
    const scale = (M.giant ? 1.15 : M.tiny ? .7 : 1) * (M.twins || M.pair ? .82 : 1.1);
    const bottom = 36.5 - (M.ghost && live ? [1, 2, 3, 2, 1, 0][f] + 1 : 0);
    const genes = M.twins || M.pair ? [{ dna, cx: 13.5 }, { dna: M.pair ? partner(dna) : dna, cx: 25.5 }] : [{ dna, cx: 19.5 }];
    const B = genes.map((b) => Object.assign(b, { P: palette(b.dna, rarity, M), G: geo(b.dna, live ? f : 0, dead, b.cx, bottom, scale, M) }));
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

    // ---- тела по генам
    B.forEach(({ G, P, dna: d }) => {
      const { cx, cy, rx, ry, top, ex } = G;
      for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y)) {
        const u = (x + .5 - cx) / rx, v = (y + .5 - cy) / ry, dy = Math.round(v * 3), lit = -(u * .55 + v * .75);
        put(x, y, lit > .62 ? P.light(dy) : lit < -.55 ? P.dark(dy) : P.body(dy));
      }
      const inB = (x, y) => G.inside(Math.round(x), Math.round(y));
      const pat = M.mummy || M.skeleton || M.cosmic || M.shadow ? 0 : byte(d, 10) % 7;
      if (pat === 1) for (let i = 0; i < 5; i++) { const sx = Math.round(cx - rx + 2 + (byte(d, (i + 3) % 16) % Math.max(1, Math.round(rx * 2 - 3)))), sy = Math.round(cy - ry * .2 + (byte(d, (i + 8) % 16) % Math.max(1, Math.round(ry)))); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([a, b]) => inB(sx + a, sy + b) && put(sx + a, sy + b, P.accentDark)); }
      if (pat === 2) for (let y = Math.round(cy - ry); y < cy - 1; y++) if ((y + byte(d, 7)) % 4 === 0) for (let x = 0; x < W; x++) if (inB(x, y) && inB(x, y + 1)) put(x, y, P.dark(0));
      if (pat === 3 || pat === 6) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const u = (x + .5 - cx) / (rx * .62), v = (y + .5 - (cy + ry * .45)) / (ry * .55); if (u * u + v * v <= 1 && inB(x, y)) put(x, y, pat === 6 ? P.accent : hsl(P.hue, 30, 86)); }
      if (pat === 4) for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (inB(x, y) && y > cy + ry * .25) put(x, y, (x + y) % 2 ? P.accent : P.accentDark);
      if (pat === 5) [[-.5, -.55], [.45, -.7], [.1, -.85]].forEach(([a, b]) => { const sx = cx + a * rx, sy = cy + b * ry; if (inB(sx, sy)) { put(sx, sy, "#fff6c0"); put(sx - 1, sy, P.accent); put(sx + 1, sy, P.accent); put(sx, sy - 1, P.accent); put(sx, sy + 1, P.accent); } });
      // уши / рога / антенны по генам (оборотню — волчьи, магу их закрывает шляпа)
      const ears = M.werewolf ? 8 : M.wizard ? -1 : byte(d, 7) % 8;
      if (ears === 1) side((s) => { const bx = cx + s * ex; for (let i = 0; i < 4; i++) for (let j = 0; j < 4 - i; j++) put(bx + j - (3 - i) / 2, top + 1 - i, i > 0 && i < 3 && j === Math.floor((3 - i) / 2) ? "#ffb3c8" : P.body(-3)); });
      if (ears === 2) side((s) => { for (let i = 0; i < 7; i++) { put(cx + s * (ex - 1), top - i, P.body(-3)); put(cx + s * ex, top - i, i > 1 && i < 6 ? "#ffb3c8" : P.body(-3)); } });
      if (ears === 3) side((s) => { [[0, 0], [1, 0], [0, -1], [1, -1], [s < 0 ? -1 : 2, 0], [s < 0 ? -1 : 2, -1], [0, -2], [1, -2]].forEach(([a, b]) => put(cx + s * ex + a - .5, top + b, P.dark(-3))); });
      if (ears === 4) side((s) => { for (let i = 0; i < 4; i++) { put(cx + s * (ex - 1 + i * .5), top - i, "#efe6cf"); put(cx + s * (ex + i * .5), top - i, "#cfc2a0"); } });
      if (ears === 5) { for (let i = 1; i < 5; i++) put(cx, top - i, P.line); put(cx, top - 5, P.accent); put(cx - 1, top - 5, P.accent); put(cx, top - 6, P.accent); put(cx - 1, top - 6, P.accent); }
      if (ears === 6) { put(cx, top - 1, "#3b8f3b"); put(cx, top - 2, "#3b8f3b"); for (let i = 0; i < 3; i++) { put(cx + 1 + i, top - 3 - (i === 1 ? 1 : 0), "#6fd16f"); put(cx - 1 - i, top - 2 - (i === 1 ? 1 : 0), "#4fb34f"); } }
      if (ears === 7) side((s) => { const wx = cx + s * (rx + .5); for (let i = 0; i < 4; i++) for (let j = 0; j < 3 - (i >> 1); j++) put(wx + s * j, cy - 1 + i - (wave ? 1 : 0), i === 0 ? P.light(0) : P.accent); });
      if (ears === 8) side((s) => { const bx = cx + s * ex; for (let i = 0; i < 6; i++) { const w = Math.max(0, 2 - Math.floor(i / 2)); for (let j = -w; j <= w; j++) put(bx + j + s * Math.floor(i / 3), top + 1 - i, j === 0 && i > 0 && i < 4 ? "#e8a0a8" : P.dark(-3)); } });
      // хвост, лапки
      const tail = M.demon ? 0 : byte(d, 14) % 4, tx = Math.round(cx + rx), ty = Math.round(cy + ry * .45);
      if (tail === 1) { put(tx, ty, P.body(1)); put(tx + 1, ty - 1, P.body(1)); }
      if (tail === 2) { const w = wave; [[0, 0], [1, -1], [2, -2], [2, -3], [1, -4 + w], [0, -4 + w]].forEach(([a, b]) => put(tx + a, ty + b, P.accentDark)); }
      if (tail === 3) { [[0, 0], [1, 0], [2, -1], [1, -1]].forEach(([a, b]) => put(tx + a, ty + b, P.light(0))); }
      if (G.shape !== 4) side((s) => { const fx = Math.round(cx + s * rx * .45); put(fx, G.bottom + .2, P.dark(3)); put(fx + (s < 0 ? -1 : 1), G.bottom + .2, P.dark(3)); if (M.werewolf) put(fx + (s < 0 ? -2 : 2), G.bottom + .2, "#f4efe0"); });
      // украшения по генам — если нет костюма
      const acc = M.pirate || M.ninja || M.wizard || M.hero || M.cyborg ? 0 : (byte(d, 6) >> 3) % 9;
      if (acc === 1) [[-1, 0], [-2, -1], [-2, 1], [0, 0], [1, 0], [2, -1], [2, 1]].forEach(([a, b]) => put(cx + ex * .4 + a + 2, top + 1 + b, "#ff4d6d"));
      if (acc === 2) for (let x = Math.round(cx - rx * .8); x <= Math.round(cx + rx * .8); x++) if (inB(x, cy + ry * .3)) { put(x, cy + ry * .3, "#e0403a"); if (x === Math.round(cx + rx * .3)) { put(x, cy + ry * .3 + 1, "#e0403a"); put(x, cy + ry * .3 + 2, "#b02a2a"); } }
      if (acc === 3 && rarity >= 3) { const cy2 = top - (ears === 5 || ears === 6 ? 7 : 2); [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-2, -1], [0, -1], [2, -1], [-2, -2], [0, -2], [2, -2]].forEach(([a, b]) => put(cx + a, cy2 + b, b === 0 ? "#d99a00" : "#ffd43b")); }
    });

    // ---- сиамские: общее тело снизу, две головы сверху
    if (B.length === 2) {
      const [a, b] = B, y0 = Math.round(Math.max(a.G.cy, b.G.cy) - 1), y1 = Math.round(Math.min(a.G.bottom, b.G.bottom) - 1);
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
      if (M.cthulhu) [-1.5, -.5, .5, 1.5].forEach((k, n) => {
        const L = Math.round(ry * .8) + 3 + (n % 2);
        for (let j = 0; j < L; j++) { const x = Math.round(cx + k * 1.7 + Math.sin((j + f + n * 2) * .9) * (j > 2 ? 1 : 0)), y = mY - 1 + j; put(x, y, j === L - 1 ? "#0b2622" : j % 3 === 2 ? "#a8f0d8" : "#123f38"); }
      });
    });

    // ---- контур
    const out = [];
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (!solid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid[y + b] && solid[y + b][x + a])) out.push([x, y]);
    out.forEach(([x, y]) => put(x, y, P0.line, false));

    // ---- космос внутри тела
    if (M.cosmic && live) B.forEach(({ G, dna: d }) => { for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) if (G.inside(x, y) && ((x * 7 + y * 13 + byte(d, (x + y) % 16)) % 19) === 0) put(x, y, (x + y + f) % 3 === 0 ? "#ffffff" : (x + f) % 2 ? "#9fb0ff" : "#ffe9a8", false); });

    // ---- мордочки
    const blink = live && f === 5;
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
        if (kind === "slit") { put(x - 1, y, "#ffffff"); put(x, y, "#ffffff"); put(x + 1, y, "#ffffff"); return; }
        if (kind === "socket") { [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]].forEach(([a, b]) => put(x + a, y + b, "#0a0810")); put(x, y, wave ? "#ffffff" : "#c8c8ff"); return; }
        if (kind === "laser") { put(x, y, "#ff2020"); put(x + 1, y, "#ffb0b0"); put(x, y + 1, "#c00000"); put(x + 1, y + 1, "#ff2020"); return; }
        if (kind === "patch") { for (let a = -1; a <= 2; a++) for (let b = -1; b <= 1; b++) put(x + a, y + b, "#121014"); for (let i = 1; i < 6; i++) put(x - i, y - 1 - Math.ceil(i / 2), "#121014"); return; }
        return dot(x, y);
      };
      let kind = ["dot", "big", "sleepy", "cyclops", "three", "angry", rarity >= 2 ? "star" : "big", rarity >= 3 ? "heart" : "dot"][byte(d, 8) % 8];
      if (M.vampire || M.werewolf || M.demon || M.shadow || M.zombie || M.mummy || M.cyborg || M.pirate) kind = kind === "three" ? "three" : "dot";
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
        eyeAt(cx - eX - .5, eyeY, M.hero ? "slit" : k);
        if (!M.mummy) eyeAt(cx + eX - .5, eyeY, M.hero ? "slit" : M.cyborg ? "laser" : M.pirate ? "patch" : M.zombie ? "big" : k);   // у мумии второй глаз под бинтом
        if (kind === "three") eyeAt(cx - .5, eyeY - 3, "dot");
        if ((kind === "angry" || M.demon) && live) { put(cx - eX - 2, eyeY - 2, P.line); put(cx - eX - 1, eyeY - 2, P.line); put(cx - eX, eyeY - 1, P.line); put(cx + eX + 1, eyeY - 2, P.line); put(cx + eX, eyeY - 2, P.line); put(cx + eX - 1, eyeY - 1, P.line); }
      }
      // рот
      const L = P.line;
      if (M.cthulhu || M.ninja) { /* щупальца или маска */ }
      else if (dead) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); }
      else if (M.vampire) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + 1.5, mY, L); put(cx - 1.5, mY + 1, "#ffffff"); put(cx + 1.5, mY + 1, "#ffffff"); }
      else if (M.werewolf) { for (let a = -2; a <= 2; a++) put(cx + a - .5, mY, L); put(cx - .5, mY + 1, "#7a2030"); put(cx + .5, mY + 1, "#7a2030"); put(cx - 2.5, mY + 1, "#ffffff"); put(cx + 1.5, mY + 1, "#ffffff"); }
      else if (M.zombie) { put(cx - 1.5, mY, L); put(cx - .5, mY - 1, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); put(cx - .5, mY, "#e8e4c8"); }
      else if (M.skeleton) { for (let a = -2; a <= 2; a++) { put(cx + a - .5, mY, (a + 2) % 2 ? "#0a0810" : "#e8e4d8"); put(cx + a - .5, mY + 1, (a + 3) % 2 ? "#0a0810" : "#e8e4d8"); } }
      else {
        const mouth = byte(d, 9) % 7;
        if (mouth === 0) { put(cx - 1.5, mY - 1, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); }
        else if (mouth === 1) { for (let a = -2; a <= 2; a++) put(cx + a - .5, mY, L); put(cx - 1.5, mY + 1, "#fff"); put(cx + 1.5, mY + 1, "#fff"); }
        else if (mouth === 2) { put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx - .5, mY + 1, "#7a2030"); put(cx + .5, mY + 1, "#7a2030"); }
        else if (mouth === 3) { put(cx - 1.5, mY, L); put(cx - .5, mY, L); put(cx + .5, mY, L); put(cx + .5, mY + 1, "#ff7a9a"); put(cx + 1.5, mY + 1, "#ff7a9a"); }
        else if (mouth === 4) { put(cx - 1.5, mY - 1, "#ffa424"); put(cx - .5, mY - 1, "#ffa424"); put(cx + .5, mY - 1, "#ffa424"); put(cx - .5, mY, "#d97a00"); }
        else if (mouth === 5) { put(cx - 2.5, mY - 1, L); put(cx - 1.5, mY, L); put(cx - .5, mY - 1, L); put(cx + .5, mY, L); put(cx + 1.5, mY - 1, L); }
      }
      if (live && byte(d, 13) % 2 && !(M.skeleton || M.zombie || M.mummy || M.ninja || M.shadow || M.cosmic || M.sixeyes)) { put(cx - eX - 2.5, mY - 1, "#ff8fab"); put(cx + eX + 1.5, mY - 1, "#ff8fab"); }
    });

    // ---- стихии и свечение (поверх, без контура)
    const fx = [];
    if (live) B.forEach(({ G, dna: d }) => {
      const { cx, rx, ry, bottom: bt } = G;
      if (M.fire) {
        for (let x = Math.round(cx - rx * .9); x <= Math.round(cx + rx * .9); x++) {
          if (x < 0 || x >= W) continue;
          let y = 0; while (y < W && !g[y][x]) y++;
          if (y >= W) continue;
          const h = 2 + ((x * 7 + f * 5 + byte(d, x % 16)) % 5) - (Math.abs(x - cx) > rx * .55 ? 2 : 0);
          for (let k = 0; k < h; k++) if (empty(x, y - 1 - k)) put(x, y - 1 - k, k === h - 1 ? "#fff3a0" : k > h * .6 ? "#ffd23b" : k > h * .3 ? "#ff8a1f" : "#ff4a1f", false);
        }
        side((s) => { for (let k = 0; k < 3 + ((f + (s > 0 ? 3 : 0)) % 3); k++) { const x = Math.round(cx + s * (rx + 1)) + (k > 1 ? s : 0), y = Math.round(G.cy + 2 - k); if (empty(x, y)) put(x, y, k > 1 ? "#ffd23b" : "#ff6a1f", false); } });
        fx.push([Math.round(cx - rx + ((f * 5) % Math.max(1, Math.round(rx * 2)))), Math.max(1, G.top - 6 - f), "#ffd23b"]);
      }
      if (M.storm) {
        const sx = f % 2 ? Math.round(cx + rx + 3) : Math.round(cx - rx - 3), sy = Math.round(G.cy - 4 + (f % 3) * 2);
        [[0, 0], [1, 1], [0, 2], [1, 3], [0, 4], [1, 5]].forEach(([a, b], i) => empty(sx + a, sy + b) && put(sx + a, sy + b, i % 2 ? "#7af0ff" : "#fff27a", false));
        fx.push([Math.round(cx + ((f * 7) % Math.max(1, Math.round(rx * 2))) - rx), G.top - 2, "#fff27a"]);
      }
      if (M.shadow) for (let i = 0; i < 9; i++) { const x = Math.round(cx - rx - 3 + ((i * 11 + byte(d, i)) % Math.round(rx * 2 + 6))), y = Math.round(bt - ((i * 5 + f * 2) % Math.round(ry * 2 + 2))); if (empty(x, y)) put(x, y, i % 3 ? "#3a1f5c" : "#6a3fa0", false); }
      if (M.ice) fx.push([[4, 35, 7, 33, 3, 36][f], [10, 16, 26, 6, 21, 12][f], "#e8fbff"]);
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
    return { g, fx, glow: live && rarity >= 3 ? P0.glow : null, ghost: !!M.ghost, glitch: !!M.glitch && live };
  }

  /* ---------------------------------------------------------------- в картинку */
  const cache = {};
  const FR = 6;
  function stripUrl(code, dead) {
    const key = code + (dead ? ":dead" : "");
    if (cache[key]) return cache[key];
    if (typeof document === "undefined") return "";
    const c = document.createElement("canvas"); c.width = W * FR; c.height = W;
    const x = c.getContext("2d");
    for (let f = 0; f < FR; f++) {
      const fr = frame(code, dead ? 0 : f, dead);
      const ox = f * W;
      if (fr.glow) {                                                    // мягкое свечение вокруг легендарных
        x.globalAlpha = [.55, .4, .3, .4, .55, .45][f]; x.fillStyle = fr.glow;
        for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) if (!fr.g[yy][xx] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => fr.g[yy + b] && fr.g[yy + b][xx + a])) x.fillRect(ox + xx, yy, 1, 1);
      }
      x.globalAlpha = fr.ghost ? [.62, .7, .78, .7, .62, .55][f] : 1;
      for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) if (fr.g[yy][xx]) { x.fillStyle = fr.g[yy][xx]; x.fillRect(ox + xx, yy, 1, 1); }
      x.globalAlpha = 1;
      fr.fx.forEach(([sx, sy, col]) => { x.fillStyle = col; x.fillRect(ox + sx, sy, 1, 1); x.globalAlpha = .6; x.fillRect(ox + sx - 1, sy, 1, 1); x.fillRect(ox + sx + 1, sy, 1, 1); x.fillRect(ox + sx, sy - 1, 1, 1); x.fillRect(ox + sx, sy + 1, 1, 1); x.globalAlpha = 1; });
      if (fr.glitch && f !== 2 && f !== 5) { x.globalAlpha = .55; x.fillStyle = "#ff00d4"; x.fillRect(ox + 9 + f, 20 + f, 3, 1); x.fillStyle = "#00f0ff"; x.fillRect(ox + 27 - f, 27 - f, 3, 1); x.globalAlpha = 1; }
      if (fr.glitch && (f === 2 || f === 5)) {                          // глитч: строки съезжают, цветная кайма
        const y0 = 12 + (f * 3) % 12;
        for (let yy = y0; yy < y0 + 3; yy++) { const row = x.getImageData(ox, yy, W, 1); x.clearRect(ox, yy, W, 1); x.putImageData(row, ox + (f === 2 ? 2 : -2), yy); }
        x.clearRect(ox - 2, 0, 2, W); x.clearRect(ox + W, 0, 2, W);
        x.globalAlpha = .7; x.fillStyle = "#ff00d4"; x.fillRect(ox + 8, y0 - 1, 6, 1); x.fillStyle = "#00f0ff"; x.fillRect(ox + 24, y0 + 4, 7, 1); x.globalAlpha = 1;
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
    const key = "egg:" + dna;
    if (cache[key]) return cache[key];
    if (typeof document === "undefined") return "";
    const c = document.createElement("canvas"); c.width = W * FR; c.height = W;
    const x = c.getContext("2d"), hue = Math.round(byte(dna, 3) * 360 / 256);
    const wob = [0, 0, 1, 0, -1, 0], ex = 19.5, ey = 24;
    const inEgg = (xx, yy) => { const u = (xx + .5 - ex) / 10, v = (yy + .5 - ey) / 13, w = v < 0 ? u / (1 + v * .28) : u; return w * w + v * v <= 1; };
    for (let f = 0; f < FR; f++) {
      const ox = f * W + wob[f];
      for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) {
        const inside = inEgg(xx, yy);
        if (!inside && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inEgg(xx + a, yy + b))) { x.fillStyle = "#2a2233"; x.fillRect(ox + xx, yy, 1, 1); }
        if (!inside) continue;
        const u = (xx + .5 - ex) / 10, v = (yy + .5 - ey) / 13, lit = -(u * .5 + v * .8), spot = ((xx * 7 + yy * 13 + byte(dna, (xx + yy) % 16)) % 23) < 2;
        x.fillStyle = spot ? hsl(hue, 60, 52) : lit > .55 ? "#fffaf0" : lit < -.5 ? "#d8cfc0" : "#f1ead8";
        x.fillRect(ox + xx, yy, 1, 1);
      }
    }
    return (cache[key] = c.toDataURL());
  }

  // HTML: живой анимированный спрайт. code = цифра редкости + ДНК (+ мутации)
  const sprite = (code, size = 96, opts = {}) => {
    if (!code) return "";
    const url = opts.egg ? eggUrl(code.slice(1)) : stripUrl(code, opts.dead);
    return `<i class="pet-spr ${opts.dead ? "dead" : ""} ${opts.cls || ""}" style="width:${size}px;height:${size}px;background-image:url(${url})"></i>`;
  };

  const api = { RARITY, FOOD_KEYS, FOOD_EMOJI, SOCIAL, TEMPER, MUTATIONS, stats, skills, traits, name: fullName, muts, partner, rarityName, sprite, frame };
  root.Pets = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
