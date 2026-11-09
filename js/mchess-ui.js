/* Магічні шахи: меню, лобі, дошка, карти-чари, навички, світи, анімації. Рушій — js/mchess.js; спільні S, send, esc, av… — з app.js.
   Фігури — власні SVG: тіло + оздоблення + шари стану (вогонь, лід, отрута, хром, бойова розмальовка з рушницею, двійник, герой). */
"use strict";

/* ---------------------------------------------------------------- SVG-фігури */
const mcCirc = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 1 ${2 * r} 0 a${r} ${r} 0 1 1 ${-2 * r} 0 Z`;
const MC_BODY = {
  P: "M50 18 A15 15 0 0 1 61 43 Q66 45 66 49 Q66 53 58 53 Q62 62 67 76 Q78 78 79 86 L79 91 L21 91 L21 86 Q22 78 33 76 Q38 62 42 53 Q34 53 34 49 Q34 45 39 43 A15 15 0 0 1 50 18 Z",
  R: "M24 91 L24 84 Q26 78 32 77 L35 77 L37 50 L31 46 L31 20 L40 20 L40 28 L46 28 L46 20 L54 20 L54 28 L60 28 L60 20 L69 20 L69 46 L63 50 L65 77 L68 77 Q74 78 76 84 L76 91 Z",
  B: mcCirc(50, 10, 6) + " M50 15 Q67 29 65 45 Q63 53 57 55 L61 58 Q61 62 57 62 Q60 70 64 77 Q74 78 76 84 L76 91 L24 91 L24 84 Q26 78 36 77 Q40 70 43 62 Q39 62 39 58 L43 55 Q37 53 35 45 Q33 29 50 15 Z",
  N: "M30 91 L30 84 Q32 78 38 77 Q40 67 47 58 Q37 61 30 63 Q21 64 19 57 Q18 50 25 46 L39 34 Q41 26 45 21 L43 12 Q50 13 54 19 Q63 19 69 28 Q77 40 75 56 Q73 68 68 77 Q76 78 78 84 L78 91 Z",
  Q: "M24 91 L24 84 Q26 78 34 77 Q36 64 37 54 L29 50 L21 27 L31 40 L36 18 L43 36 L50 13 L57 36 L64 18 L69 40 L79 27 L71 50 L63 54 Q64 64 66 77 Q74 78 76 84 L76 91 Z "
    + [[21, 24], [36, 15], [50, 10], [64, 15], [79, 24]].map(([x, y]) => mcCirc(x, y, 4)).join(" "),
  K: "M46 5 L54 5 L54 11 L60 11 L60 18 L54 18 L54 34 L46 34 L46 18 L40 18 L40 11 L46 11 Z M24 91 L24 84 Q26 78 34 77 Q36 62 38 55 Q25 51 25 40 Q25 29 37 29 Q44 29 50 35 Q56 29 63 29 Q75 29 75 40 Q75 51 62 55 Q64 62 66 77 Q74 78 76 84 L76 91 Z",
};
const mcTr = (d, v = "trim", extra = "") => `<path style="fill:var(--${v})${extra}" d="${d}"/>`;
const MC_TRIM = {
  P: mcTr("M21 82 L79 82 L79 86 L21 86 Z") + mcTr("M36 47 Q50 44 64 47 L64 51 Q50 48 36 51 Z"),
  R: mcTr("M24 82 L76 82 L76 86 L24 86 Z") + mcTr("M31 44 L69 44 L69 48 L31 48 Z") + mcTr("M46 57 L54 57 L54 68 L46 68 Z", "ink", ";opacity:.55"),
  B: mcTr("M24 82 L76 82 L76 86 L24 86 Z") + mcTr("M41 55 L59 55 L59 59 L41 59 Z") + mcTr("M56 26 L46 40 L48.5 41.5 L58.5 28 Z", "ink") + mcTr(mcCirc(50, 10, 3)),
  N: mcTr("M30 82 L78 82 L78 86 L30 86 Z") + mcTr("M54 19 Q66 22 71 34 Q75 44 73 56 L69 56 Q71 44 67 34 Q62 25 52 22 Z") + mcTr(mcCirc(46, 30, 2.8), "ink") + mcTr(mcCirc(24, 54, 1.7), "ink"),
  Q: mcTr("M24 82 L76 82 L76 86 L24 86 Z") + mcTr("M36 54 L64 54 L63 58 L37 58 Z") + [[21, 24], [36, 15], [50, 10], [64, 15], [79, 24]].map(([x, y]) => mcTr(mcCirc(x, y, 2.6))).join(""),
  K: mcTr("M24 82 L76 82 L76 86 L24 86 Z") + mcTr("M37 55 L63 55 L62 59 L38 59 Z") + mcTr("M47.5 7.5 L52.5 7.5 L52.5 13.5 L57.5 13.5 L57.5 15.5 L52.5 15.5 L52.5 31 L47.5 31 L47.5 15.5 L42.5 15.5 L42.5 13.5 L47.5 13.5 Z")
    + `<path style="fill:#ff3b5c" d="${mcCirc(50, 43, 3.6)}"/>`,
};
const MC_PAINT = {           // бойова розмальовка (обрізається по силуету)
  P: `<path fill="#ff2e55" d="M28 27 L72 21 L72 26 L28 32 Z"/><path fill="#ffd23f" d="M28 64 L74 56 L74 61 L28 69 Z"/><path fill="#ff2e55" d="M28 71 L74 63 L74 66 L28 74 Z"/>`,
  other: `<path fill="#ff2e55" d="M20 60 L80 50 L80 55 L20 65 Z"/><path fill="#ffd23f" d="M20 67 L80 57 L80 60 L20 70 Z"/>`,
};
function mcDefs() {
  if (document.getElementById("mc-defs")) return;
  const g = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ""}/>`).join("")}</linearGradient>`;
  const defs = [
    g("mcg-w", [[0, "#fffdf5"], [.55, "#efe2c4"], [1, "#b89a6a"]]),
    g("mcg-b", [[0, "#5e4392"], [.55, "#2a1848"], [1, "#0c0618"]]),
    g("mcg-shine", [[0, "#fff", 0], [.2, "#fff", .55], [.42, "#fff", 0], [1, "#fff", 0]], 1, 0),
    g("mcg-fire", [[0, "#fff3a0"], [.45, "#ff9a2a"], [1, "#b81e06"]]),
    g("mcg-ice", [[0, "#ffffff"], [.5, "#b8ecff"], [1, "#4f9fdc"]]),
    g("mcg-poison", [[0, "#e2ff8a"], [.5, "#6ad03a"], [1, "#1a5a10"]]),
    g("mcg-rage", [[0, "#ffb4a0"], [.5, "#ff3a2a"], [1, "#5a0606"]]),
    g("mcg-chrome", [[0, "#ffffff"], [.3, "#8f9cab"], [.5, "#f7fbff"], [.7, "#5f6c7a"], [1, "#dfe6ee"]], 1, 1),
    g("mcg-clone", [[0, "#e8fdff"], [1, "#3aa8e8"]]),
    g("mcg-gold", [[0, "#fff6c0"], [.5, "#ffc83a"], [1, "#9a6206"]]),
    g("mcg-vamp", [[0, "#ff7a9a"], [1, "#4a0012"]]),
    Object.entries(MC_BODY).map(([k, d]) => `<path id="mcb-${k}" d="${d}"/><clipPath id="mcc-${k}"><path d="${d}"/></clipPath>`).join(""),
    Object.entries(MC_TRIM).map(([k, d]) => `<g id="mct-${k}">${d}</g>`).join(""),
    `<g id="mcs-gun"><path style="fill:#7a4420" d="M0 10 L12 5 L15 12 L3 17 Z"/><path style="fill:#23232e" d="M10 4 L36 -5 L38 1 L13 11 Z"/><path style="fill:#3a3a48" d="M17 8 L19 15 L24 13 L22 6 Z"/><path style="fill:#ffd23f" d="M35 -5 L39 -6 L40 -1 L37 0 Z"/></g>`,
  ].join("");
  const el = document.createElement("div");
  el.innerHTML = `<svg id="mc-defs" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true"><defs>${defs}</defs></svg>`;
  document.body.appendChild(el.firstChild);
}
// фігура: SVG + шари стану. o.mini — для меню (без анімацій)
function mcPiece(p, o = {}) {
  const t = p.t, burn = o.burn, layers = [];
  const over = (grad, op) => layers.push(`<use href="#mcb-${t}" style="fill:url(#${grad});opacity:${op}"/>`);
  if (p.clone) over("mcg-clone", .7);
  if (p.rage) over("mcg-rage", .42);
  if (p.vamp) over("mcg-vamp", .45);
  if (p.poison) over("mcg-poison", .62);
  if (p.mirror) over("mcg-chrome", .86);
  if (burn) over("mcg-fire", .6);
  if (p.frozen) over("mcg-ice", .78);
  const paint = p.gun ? `<g clip-path="url(#mcc-${t})">${MC_PAINT[t === "P" ? "P" : "other"]}</g>` : "";
  const gun = p.gun ? `<use href="#mcs-gun" transform="translate(${t === "P" ? "56 60" : "60 62"}) rotate(-28)"/>` : "";
  const cls = [p.c, burn ? "burn" : "", o.ghost ? "ghost" : "", p.frozen ? "frozen" : "", p.rage ? "rage" : "", p.shield ? "shield" : "", p.mirror ? "mirror" : "", p.poison ? "poison" : "", p.clone ? "clone" : "", p.vamp ? "vamp" : "", p.rank >= 2 ? "mc-hero" : p.rank ? "mc-vet" : ""].filter(Boolean).join(" ");
  const svg = `<svg class="mc-pc" viewBox="0 0 100 100"><use href="#mcb-${t}" class="pb"/><use href="#mcb-${t}" style="fill:url(#mcg-shine)"/>${layers.join("")}${paint}<use href="#mct-${t}"/>${gun}</svg>`;
  if (o.mini) return `<span class="mc-pw mini ${cls}">${svg}</span>`;
  const halo = p.rank >= 2 ? '<i class="mc-halo"></i>' : "";
  const extra = (p.frozen ? '<i class="mc-ice"></i>' : "") + (p.shield ? '<i class="mc-bub"></i>' : "")
    + (burn ? '<i class="mc-flame f1"></i><i class="mc-flame f2"></i><i class="mc-flame f3"></i>' : "") + (p.poison ? '<i class="mc-bubs"></i>' : "") + (p.vamp ? '<i class="mc-bat">🦇</i>' : "")
    + (p.rank ? `<i class="mc-rank r${p.rank}">${p.rank >= 2 ? "★★" : "★"}</i>` : "") + (o.ready ? '<i class="mc-ready"></i>' : "");
  return `<span class="mc-pw ${cls} ${o.anim || ""}"${o.key ? ` data-k="${o.key}"` : ""}${o.style || ""}>${halo}${svg}${extra}</span>`;
}

/* ---------------------------------------------------------------- точкове оновлення екрана: живі вузли лишаються, тож анімації не перезапускаються,
   а кнопки не підміняються під пальцем. Вузли з data-k зіставляються за ключем, решта — за порядком */
function mcMorph(root, html) {
  const tpl = document.createElement("template"); tpl.innerHTML = html;
  mcSyncKids(root, tpl.content);
}
function mcSyncKids(a, b) {
  const old = [...a.childNodes], neu = [...b.childNodes], keyed = new Map(), loose = [];
  old.forEach((n) => { const k = n.nodeType === 1 && n.getAttribute("data-k"); if (k) keyed.set(k, n); else loose.push(n); });
  let li = 0; const out = [];
  for (const y of neu) {
    const k = y.nodeType === 1 && y.getAttribute("data-k");
    let x = null;
    if (k) { x = keyed.get(k) || null; if (x) keyed.delete(k); } else if (li < loose.length) x = loose[li++];
    if (x && x.nodeType === y.nodeType && x.nodeName === y.nodeName && mcSyncNode(x, y)) out.push(x);
    else out.push(document.importNode(y, true));
  }
  out.forEach((n, i) => { if (a.childNodes[i] !== n) a.insertBefore(n, a.childNodes[i] || null); });
  while (a.childNodes.length > out.length) a.removeChild(a.lastChild);
}
function mcSyncNode(x, y) {                     // false — вузол треба замінити
  if (x.nodeType === 3 || x.nodeType === 8) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; return true; }
  if (x.nodeType !== 1) return false;
  if (x.nodeName === "CANVAS") return ["class", "data-emoji", "data-src", "data-res"].every((n) => x.getAttribute(n) === y.getAttribute(n));
  if (x.nodeName === "INPUT" || x.nodeName === "TEXTAREA") return false;
  for (const at of [...y.attributes]) if (x.getAttribute(at.name) !== at.value) x.setAttribute(at.name, at.value);
  for (const at of [...x.attributes]) if (!y.hasAttribute(at.name)) x.removeAttribute(at.name);
  mcSyncKids(x, y);
  return true;
}

/* ---------------------------------------------------------------- довідники */
const MC_TILE_NAME = { fire: "Вогонь — не ступити", lava: "Лава — не ступити; хто стоїть, отримує 1 шкоди на початку ходу", hole: "Провалля — не ступити", wall: "Стіна — не пройти й не прострелити",
  ice: "Лід — ковзаєш далі; проводить блискавку", water: "Вода — проводить блискавку", steam: "Пара — не пройти й не прострелити", portal: "Портал — вийдеш з парного", chest: "Скриня — нова карта",
  mine: "Твоя міна — суперник її не бачить", void: "Безодня — клітинки немає", meteor: "Сюди падає метеор!" };
const MC_FX_MS = { hit: 900, die: 1000, heal: 900, shield: 800, bolt: 900, boom: 900, freeze: 900, portal: 800, shot: 700, fire: 900, mirror: 900, chest: 900, slide: 380, promote: 1200, frog: 1000,
  move: 320, card: 1700, skill: 1300, event: 2700, realm: 1600, combo: 2000, start: 2400, draw: 1200, rank: 1500, slash: 450, holy: 900, steam: 1000, crumble: 900, clone: 900, vamp: 900, poison: 900,
  rage: 900, meteor: 1100, vortex: 900, blackhole: 1100, flipboard: 900, carousel: 700, upgrade: 1500 };
const mcCol = (c) => (c === "w" ? "білі" : "чорні");
const MC_ASK = { own: "свою фігуру", ownP: "свого пішака", ownNK: "свою фігуру (не короля)", ownHurt: "свою поранену фігуру", ownClone: "свою туру, слона, коня чи пішака", enemy: "чужу фігуру",
  enemyNK: "чужу фігуру (не короля)", enemyMinor: "чужу туру, слона чи коня", empty: "вільну клітинку", any: "клітинку", inner: "центр квадрата 3×3 (не край дошки)" };

/* ---------------------------------------------------------------- правила: однаково в меню й у «❓ Як грати» під час партії */
function mcRulesHtml() {
  const C = MChess.CARDS, E = MChess.EVENTS, P = MChess.PIECES, SK = MChess.SKILLS, RM = MChess.REALMS, UP = MChess.UP_COST;
  const cat = Object.entries(E).filter(([, e]) => !e.realm);
  return `<div class="card mc-howto"><b class="mc-h">Як грати</b>
      <ol>
        <li><b>Мета</b> — знищити ворожого <b>короля</b> (❤️4). Шаху й мату немає. У кожної фігури є життя ❤️ і удар ⚔️: добив — займаєш клітинку, не добив — лишаєшся на місці.</li>
        <li><b>Хід:</b> торкнися своєї фігури — на дошці засвітяться ходи (точки) й атаки (червоні кільця). Торкнися клітинки — і фігура піде.</li>
        <li><b>Картка фігури.</b> Після дотику під дошкою з’являється картка: життя, удар, ранг і <b>навичка</b> — кнопка «Застосувати» (замість ходу, потім перезарядка).</li>
        <li><b>Карти-чари</b> внизу: торкнися карти → на дошці засвітяться цілі → торкнися цілі. Карту грають <b>до ходу</b>, одну за хід.</li>
        <li><b>Посилення фігур ✨.</b> Мана: +1 щоходу й +1 за кожне вбивство. У картці своєї фігури — «⬆️ Посилити»: ⭐ ветеран за ✨${UP[0]} (+1 життя), 🌟 герой за ✨${UP[1]} (+1 удар). Раз за хід, хід не забирає. Фігура росте й сама — за вбивства (1 — ветеран, 3 — герой).</li>
        <li><b>Світи й катаклізми:</b> кожні кілька раундів дошка змінюється — про наступну подію видно над дошкою. Поєднання чар і світу дає <b>комбо</b>.</li>
      </ol></div>
    <div class="section-title">Фігури й навички</div>
    <div class="mc-units">${["K", "Q", "R", "B", "N", "P"].map((k) => `<div class="mc-unit"><div class="mc-ucell">${mcPiece({ t: k, c: k === "K" || k === "N" || k === "P" ? "w" : "b", hp: 1, max: 1 }, { mini: true })}</div>
      <div class="grow"><b>${P[k].name}</b> <span class="small muted">❤️ ${P[k].hp} · ⚔️ ${P[k].atk}</span><div class="small"><b>${SK[k].e} ${SK[k].name}</b> — ${esc(SK[k].desc)} <span class="muted">(раз на ${SK[k].cd} ходи)</span></div></div></div>`).join("")}</div>
    <div class="section-title">Як фігури змінюються</div>
    <div class="mc-looks">${[["burn", { t: "N", c: "w" }, "🔥 Палає"], ["frozen", { t: "R", c: "b", frozen: 2 }, "❄️ Вмерзла"], ["gun", { t: "P", c: "w", gun: 3 }, "🔫 Озброєна"], ["poison", { t: "B", c: "b", poison: 2 }, "☠️ Отруєна"],
      ["mirror", { t: "Q", c: "w", mirror: true }, "🪞 Дзеркальна"], ["clone", { t: "N", c: "b", clone: true }, "👥 Двійник"], ["vet", { t: "R", c: "w", rank: 1 }, "⭐ Ветеран"], ["hero", { t: "B", c: "w", rank: 2 }, "🌟 Герой"]]
      .map(([k, p, nmx]) => `<div class="mc-look"><div class="mc-ucell">${mcPiece(Object.assign({ hp: 1, max: 1 }, p), { mini: true, burn: k === "burn" })}</div><small>${nmx}</small></div>`).join("")}</div>
    <div class="section-title">Світи · ${Object.keys(RM).length}</div>
    <div class="mc-realms">${Object.entries(RM).map(([k, r]) => `<div class="mc-realm realm-${k}"><div class="mc-rprev">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<i class="${(i + (i > 3 ? 1 : 0)) % 2 ? "d" : "l"}"></i>`).join("")}</div><div class="grow"><b>${r.e} ${r.name}</b><div class="small">${esc(r.desc)}</div></div></div>`).join("")}</div>
    <div class="section-title">Комбо · ${MChess.COMBOS.length}</div>
    <div class="mc-combos">${MChess.COMBOS.map((x) => `<div class="mc-combo"><span>${x.e}</span><div class="grow"><b>${x.name}</b><div class="small">${esc(x.how)} → ${esc(x.what)}</div></div></div>`).join("")}</div>
    <div class="section-title">Карти-чари · ${Object.keys(C).length}</div>
    <div class="mc-gallery">${Object.entries(C).map(([k, c]) => `<div class="mc-gcard ck-${k}"><span>${c.e}</span><b>${c.name}</b><small>${esc(c.desc)}</small></div>`).join("")}</div>
    <div class="section-title">Катаклізми · ${cat.length}</div>
    <div class="mc-gallery ev">${cat.map(([, e]) => `<div class="mc-gcard"><span>${e.e}</span><b>${e.name}</b><small>${esc(e.desc)}</small></div>`).join("")}</div>`;
}

/* ---------------------------------------------------------------- меню */
function viewMChessMenu() {
  mcDefs();
  return `<div class="fade-in mc-menu">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("mchess")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Магічні шахи</h1>
      <div class="muted small">1 на 1 або проти бота · фігури з життями й навичками · карти-чари · світи</div></div>${coinPill()}</div>
    <button class="btn mt" data-a="mc-create">♟️ Створити стіл</button>
    <div class="small muted center mt">У лобі можна покликати друга або додати бота (Новачок, Звичайний чи Майстер)</div>
    <div class="section-title">Або увійди за кодом</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Увійти</button></div>
    <div class="mt2">${mcRulesHtml()}</div>
  </div>`;
}
function mcHelpSheet() { mcDefs(); return `<h2>❓ Як грати</h2><div class="mc-helpsheet">${mcRulesHtml()}</div>`; }

/* ---------------------------------------------------------------- кімната */
function viewMChessRoom() {
  const r = S.room;
  mcDefs(); mcTrack(r);
  if (r.phase === "lobby") return `${netBanner()}<div class="fade-in">${mcLobby()}</div>${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
  return `${netBanner()}<div class="mc-room realm-${r.realm || "arcana"}">${mcTable()}</div>${r.players.filter((p) => !/^bot_/.test(p.id)).length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}

function mcLobby() {
  const r = S.room, s = r.settings, enough = r.players.filter((p) => p.online).length >= MChess.MIN_PLAYERS;
  const bots = r.players.some((p) => /^bot_/.test(p.id));
  return lobbyBento({ kicker: "Магічні шахи", title: "Чарівна дошка", codeLabel: "Код столу", countLabel: "За столом", seats: "Гравці й глядачі", max: MChess.MAX_PLAYERS, right: coinPill(),
    settings: "mc-settings", scene: "mchess", rulesLabel: "Правила",
    rules: `${s.chaos === 2 ? "🌪 <b>Шалена магія</b> — світ чи катаклізм кожні 2 раунди" : "✨ <b>Звичайна магія</b> — світ чи катаклізм кожні 3 раунди"}
      <div class="small">🤖 Бот: <b>${MChess.BOT_LEVELS[s.bot || 2]}</b>${bots ? "" : " (додай бота кнопкою «＋ Бот», якщо граєш сам)"} · складність — у ⚙️</div>
      <div class="small">Знищ короля суперника ❤️×4. Колір — випадково. Решта за столом дивляться.</div>`,
    enough, start: "♟️ Почати партію", waitText: "Чекаємо суперника — поклич друга або додай бота", hostWait: "Чекаємо, коли хост почне партію…" });
}

function mcSettingsSheet() {
  const s = S.room.settings, lv = s.bot || 2;
  const lvl = { 1: ["🐣", "Новачок", "ходить майже навмання, рідко грає карти"], 2: ["🙂", "Звичайний", "б’є, коли може, грає карти й навички"], 3: ["🧠", "Майстер", "прораховує твою відповідь, посилює фігури, грає точно"] };
  return `<h2>⚙️ Налаштування</h2>
    <div class="section-title">🤖 Складність бота</div>
    <div class="mc-lvls">${[1, 2, 3].map((v) => `<button class="mc-lvl ${lv === v ? "on" : ""}" data-a="mc-set-bot" data-v="${v}"><span>${lvl[v][0]}</span><b>${lvl[v][1]}</b><small>${lvl[v][2]}</small></button>`).join("")}</div>
    <div class="section-title">Як часто змінюється дошка</div>
    <div class="chips"><button class="pill ${s.chaos !== 2 ? "on" : ""}" data-a="mc-set" data-v="1">✨ Кожні 3 раунди</button><button class="pill ${s.chaos === 2 ? "on" : ""}" data-a="mc-set" data-v="2">🌪 Кожні 2 раунди</button></div>
    <div class="small muted mt">У «шаленій» магії світи й катаклізми приходять частіше — партії коротші й непередбачуваніші.</div>`;
}

// стан вибору на телефоні: фігура, карта, перша ціль карти. Скидається, коли змінюється хід
function mcSel() {
  const r = S.room, key = r.code + ":" + r.game_no + ":" + r.ply + ":" + (r.ts ? r.ts.used + "/" + r.ts.card : "");
  if (!S.mc || S.mc.key !== key) S.mc = { key, sel: null, card: null, a: null, info: S.mc && S.mc.key && S.mc.key.split(":")[1] === String(r.game_no) ? S.mc.info : null };
  return S.mc;
}
// анімації: коли ефект уперше прийшов. Повторний рендер продовжує анімацію з того ж місця (від’ємна затримка)
function mcTrack(r) {
  const t = (S.mcFx = S.mcFx && S.mcFx.code === r.code ? S.mcFx : { code: r.code, seen: {}, first: true }), now = Date.now();
  (r.fx || []).forEach((f) => { if (!t.seen[f.n]) { t.seen[f.n] = t.first ? 1 : now; if (!t.first) mcFeel(r, f); } });
  t.first = false;
  if (r.phase === "play" && r.me && r.turn === r.me && t.turn !== r.ply) { if (t.turn != null) { haptic("medium"); notify("warning"); } }
  t.turn = r.ply;
}
function mcFeel(r, f) {                 // вібрація на сильні моменти
  if (["combo", "die", "meteor", "event"].includes(f.k)) haptic("heavy");
  else if (["hit", "bolt", "boom", "shot"].includes(f.k)) haptic("light");
}
const mcAge = (f) => Date.now() - ((S.mcFx && S.mcFx.seen[f.n]) || 0);
const mcLive = (r) => (r.fx || []).filter((f) => mcAge(f) < (MC_FX_MS[f.k] || 800));
const mcDelay = (f, plus = 0) => `animation-delay:${plus - Math.max(0, mcAge(f))}ms`;

function mcState(r) { return { board: r.board, tiles: r.tiles, rules: r.rules || {}, realm: r.realm }; }
function mcMyTurn(r) { return r.phase === "play" && r.me && r.turn === r.me; }
function mcMoves(r, sq) {
  const p = r.board[sq], ts = r.ts || {};
  if (!p || p.c !== r.me || (ts.lock != null && ts.lock !== p.id)) return { moves: [], shots: [] };
  const st = mcState(r);
  return { moves: MChess.movesOf(st, sq, { ghost: ts.ghost === p.id }), shots: MChess.shotsOf(st, sq) };
}
const MC_BLOCK = ["fire", "lava", "hole", "wall", "steam", "void"];
// чи підходить клітинка як ціль карти (дзеркало перевірки на хості)
function mcCardOk(r, k, sq, step, a) {
  const C = MChess.CARDS[k], P = r.board[sq], own = P && P.c === r.me, enemy = P && P.c !== r.me, tile = r.tiles[sq];
  const kind = step === 2 ? C.two : C.tgt, [row, col] = MChess.rc(sq);
  if (step === 2 && sq === a) return false;
  if (kind === "empty") return !P && !(tile && (step === 2 ? MC_BLOCK.includes(tile.k) : true));
  if (kind === "own") { if (!own) return false; if (k === "fire") return !P.frozen && MChess.movesOf(mcState(r), sq).length > 0; if (["ghost", "rage", "vamp"].includes(k)) return !P.frozen; return true; }
  if (kind === "ownClone") return own && !["K", "Q"].includes(P.t) && !P.clone && MChess.around(sq).some((x) => !r.board[x] && !(r.tiles[x] && MC_BLOCK.includes(r.tiles[x].k)));
  return { ownP: own && P.t === "P", ownNK: own && P.t !== "K", ownHurt: own && P.hp < P.max, enemy, enemyNK: enemy && P.t !== "K", enemyMinor: enemy && ["R", "B", "N"].includes(P.t),
    any: sq >= 0, inner: row >= 1 && row <= 6 && col >= 1 && col <= 6 }[kind] || false;
}

function mcBar(r, color, mine) {
  const pid = r.seats[color], p = r.players.find((x) => x.id === pid) || { name: color === "w" ? "Білі" : "Чорні", look: {} };
  const king = r.board.find((x) => x && x.t === "K" && x.c === color), turn = r.phase === "play" && r.turn === color;
  const mana = (r.mana && r.mana[color]) || 0;
  return `<div class="mc-bar ${turn ? "turn" : ""} ${mine ? "me" : ""} c-${color}">${av(p, "sm")}<div class="grow mc-who"><b>${mine ? "Ви" : nm(p)}</b>
      <div class="small"><span class="mc-dot ${color}"></span>${mcCol(color)}${turn ? ` · <span class="mc-turnlbl">${mine ? "твій хід" : "ходить"}</span>` : ""}</div></div>
    <div class="mc-mana" title="мана — для посилення фігур">✨<b>${mana}</b></div>
    <div class="mc-cards-n" title="карт у руці">${"<i></i>".repeat(r.hands[color] || 0)}</div>
    <div class="mc-king">${king ? `👑 ${"<i class=\"on\"></i>".repeat(Math.max(0, king.hp))}${"<i></i>".repeat(Math.max(0, king.max - king.hp))}` : r.fog && !mine ? "👑 ?" : "💀"}</div></div>`;
}

// центр клітинки у відсотках дошки (з урахуванням повороту для чорних)
function mcXY(sq, flip) { const [r, c] = MChess.rc(sq), x = flip ? 7 - c : c, y = flip ? 7 - r : r; return [(x + .5) * 12.5, (y + .5) * 12.5]; }

function mcCell(r, sq, ctx) {
  const p = r.board[sq], t = r.tiles[sq], [row, col] = MChess.rc(sq), light = (row + col) % 2 === 0, fogged = r.fog && !r.fog[sq];
  const cls = [light ? "l" : "d"], style = [];
  if (t) cls.push("t-" + t.k + (t.k === "portal" ? " pp" + (t.pair || 0) : ""));
  if (fogged) cls.push("fog");
  if (ctx.sel === sq || ctx.a === sq) cls.push("sel");
  if (ctx.info === sq && ctx.sel !== sq) cls.push("look");
  if (ctx.moveTo.has(sq)) cls.push(p ? "atk" : "mv");
  if (ctx.shots.has(sq)) cls.push("shot");
  if (ctx.targets.has(sq)) cls.push("tg");
  if (ctx.skill.has(sq)) cls.push("sk");
  if (ctx.last.has(sq)) cls.push("last");
  // хвилі: зміна світу, карусель, вихор, провал
  const [dr, dc] = ctx.flip ? [7 - row, 7 - col] : [row, col];
  if (ctx.realmFx) { cls.push("rwave"); style.push(mcDelay(ctx.realmFx, (dr + dc) * 45)); }
  if (ctx.carFx && (row === 3 || row === 4)) { const dir = (ctx.flip ? -1 : 1) * (row === 3 ? 1 : -1); cls.push("car"); style.push(`--cx:${-dir * 100}%;${mcDelay(ctx.carFx)}`); }
  if (ctx.vortex && Math.abs(row - ctx.vortex.r) <= 1 && Math.abs(col - ctx.vortex.c) <= 1 && !(row === ctx.vortex.r && col === ctx.vortex.c)) { cls.push("vtx"); style.push(mcDelay(ctx.vortex.f)); }
  const crumble = ctx.fx.find((f) => f.k === "crumble" && f.sq === sq) || (ctx.fx.find((f) => f.k === "blackhole" && f.sq === sq));
  let inner = "";
  if (t) {
    const ttl = t.ttl && !["chest"].includes(t.k) ? `<b class="mc-ttl" data-k="ttl">${t.ttl}</b>` : "";
    const art = { fire: '<i class="mc-flame tf1"></i><i class="mc-flame tf2"></i>', chest: '<i class="mc-chest">🎁</i>', mine: '<i class="mc-mine">💣</i>', portal: '<i class="mc-swirl"></i>',
      meteor: '<i class="mc-mring"></i><i class="mc-metico">☄️</i>', steam: '<i class="mc-puff p1"></i><i class="mc-puff p2"></i>', void: `<i class="mc-voidrim"></i>${crumble ? `<i class="mc-crumb" style="${mcDelay(crumble)}"></i>` : ""}`,
      hole: crumble ? `<i class="mc-crumb" style="${mcDelay(crumble)}"></i>` : "", lava: '<i class="mc-lavab"></i>', water: '<i class="mc-wave"></i>' }[t.k] || "";
    inner += `<i class="mc-tile" data-k="t-${t.k}${t.pair || ""}">${art}</i>${ttl}`;
  }
  if (p) {
    const ts = r.ts || {}, mv = ctx.fx.find((f) => (f.k === "move" || f.k === "slide") && f.sq === sq && f.from != null);
    const hurt = !mv && ctx.fx.find((f) => f.k === "hit" && f.sq === sq);
    let st = "", anim = "";
    if (mv) { const [r0, c0] = MChess.rc(mv.from), k = ctx.flip ? -1 : 1; st = ` style="--dx:${(c0 - col) * k * 100}%;--dy:${(r0 - row) * k * 100}%;${mcDelay(mv)}"`; anim = "moving"; }
    else if (hurt) { st = ` style="${mcDelay(hurt)}"`; anim = "hurt"; }
    const mineTurn = ctx.my && p.c === r.me && (ts.lock == null || ts.lock === p.id);
    inner += mcPiece(p, { key: "p" + p.id, burn: ts.fire === p.id, ghost: ts.ghost === p.id, anim, style: st, ready: mineTurn && mcSkillWorth(r, sq) });
    const hp = Array.from({ length: Math.max(p.max, p.hp) }, (_, i) => `<i class="${i < p.hp ? (i >= p.max ? "x" : "on") : ""}"></i>`).join("");
    inner += `<span class="mc-hp" data-k="hp">${hp}</span>${p.gun ? `<span class="mc-st" data-k="st"><em>🔫${p.gun}</em></span>` : ""}`;
  }
  if (ctx.targets.has(sq) && ctx.cardE) inner += `<i class="mc-tgico" data-k="tgi">${ctx.cardE}</i>`;
  ctx.fx.filter((f) => f.sq === sq && !["move", "card", "skill", "combo", "crumble", "upgrade"].includes(f.k)).forEach((f) => {
    const txt = { hit: `−${f.dmg || 1}`, die: "💥", heal: "+", shield: "🛡", bolt: "⚡", boom: "💥", freeze: "❄️", portal: "🌀", shot: "💥", fire: "🔥", mirror: "✨", chest: "🎁", slide: "", promote: "👑", frog: "🐸",
      rank: f.rank >= 2 ? "ГЕРОЙ!" : "ВЕТЕРАН!", slash: "", holy: "", steam: "♨️", clone: "👥", vamp: "🩸", poison: "☠️", rage: "😡", meteor: "", blackhole: "", vortex: "" }[f.k];
    if (txt) inner += `<i class="mc-fx fx-${f.k}" data-k="f${f.n}" style="${mcDelay(f)}">${txt}</i>`;
    if (f.k === "die" && f.t) inner += `<span class="mc-dying" data-k="d${f.n}" style="${mcDelay(f)}">${mcPiece({ t: f.t, c: f.c, hp: 1, max: 1 }, { mini: true })}</span>`;
  });
  return `<button class="mc-c ${cls.join(" ")}" data-k="c${sq}" data-a="mc-cell" data-v="${sq}"${style.length ? ` style="${style.join(";")}"` : ""}>${inner}</button>`;
}

// шар ефектів над дошкою: блискавки з неба, метеори, хвилі навичок, спалахи чар, постріли
const MC_BURST = { fire: "#ff8a2a", freeze: "#9fe8ff", heal: "#2ee87a", poison: "#7ad84a", rage: "#ff3b3b", shield: "#5ad0ff", mirror: "#ffffff", portal: "#c86aff", vamp: "#ff2a5a",
  clone: "#5ad0ff", rank: "#ffd23f", upgrade: "#ffd23f", promote: "#ffd23f", frog: "#7ad84a", boom: "#ff8a2a", steam: "#e8f0ff", chest: "#ffd23f", die: "#ff5a3a", holy: "#fff6c0", hit: "#ff3b5c" };
const MC_CARDC = { fire: "#ff8a2a", gun: "#ff4d4d", shield: "#5ad0ff", freeze: "#9fe8ff", tele: "#c86aff", heal: "#2ee87a", bolt: "#fff6a0", ghost: "#e8f0ff", mine: "#c08a5a", swap: "#c86aff",
  rage: "#ff3b3b", wall: "#c08a5a", poison: "#7ad84a", frog: "#7ad84a", mirror: "#ffffff", volcano: "#ff6a1a", promote: "#ffd23f", haste: "#ffd23f", meteor: "#ff8a2a", vortex: "#c86aff",
  clone: "#5ad0ff", vamp: "#ff2a5a", blackhole: "#6a2aff" };
function mcFxLayer(r, live, flip) {
  let out = "";
  const pos = (sq) => { const [x, y] = mcXY(sq, flip); return `left:${x}%;top:${y}%`; };
  const line = (f, cls) => {
    const [x0, y0] = mcXY(f.from, flip), [x1, y1] = mcXY(f.sq, flip), len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    return `<i class="${cls}" data-k="l${f.n}" style="left:${x0}%;top:${y0}%;width:${len}%;transform:rotate(${ang}deg);${mcDelay(f)}"></i>`;
  };
  live.forEach((f) => {
    if (f.k === "shot" && f.from != null) out += line(f, "mc-tracer");
    else if (f.k === "slash" && f.from != null) out += line(f, "mc-slashline");
    if (f.k === "bolt" && f.sq >= 0) {                                        // блискавка з неба зиґзаґом
      const [x, y] = mcXY(f.sq, flip); let pts = `${x + ((f.n * 37) % 20) - 10},-4`, px = x + ((f.n * 37) % 20) - 10;
      for (let i = 1; i <= 5; i++) { const yy = -4 + (y + 4) * i / 6, xx = px + (((f.n * (i + 3) * 53) % 14) - 7); pts += ` ${xx},${yy}`; px = (xx + x) / 2; }
      pts += ` ${x},${y}`;
      out += `<svg class="mc-boltsvg" data-k="v${f.n}" viewBox="0 0 100 100" preserveAspectRatio="none" style="${mcDelay(f)}"><polyline points="${pts}" class="g"/><polyline points="${pts}" class="c"/></svg><i class="mc-flash" data-k="h${f.n}" style="${mcDelay(f)}"></i>`;
    }
    if (f.k === "meteor" && f.sq >= 0) out += `<i class="mc-meteorfall" data-k="m${f.n}" style="${pos(f.sq)};${mcDelay(f)}">☄️</i>`;
    if (f.k === "skill" && f.sq >= 0) {                                       // хвиля навички від фігури
      const big = { N: 3, Q: 3.2, K: 3, P: 2.2, B: 2, R: 2 }[f.t] || 2, col = { N: "#ffb02a", Q: "#c86aff", K: "#ffd23f", P: "#5ad0ff", B: "#fff6c0", R: "#ff6a3a" }[f.t];
      out += `<i class="mc-wavering" data-k="w${f.n}" style="${pos(f.sq)};--ws:${big * 12.5}%;--wc:${col};${mcDelay(f)}"></i>`;
      if (f.t === "B") [45, 135, 225, 315].forEach((a, j) => { out += `<i class="mc-beam" data-k="b${f.n}-${j}" style="${pos(f.sq)};transform:rotate(${a}deg);${mcDelay(f)}"></i>`; });
    }
    if (f.k === "card" && f.sq >= 0) out += `<i class="mc-burst big" data-k="c${f.n}" style="${pos(f.sq)};--bc:${MC_CARDC[f.card] || "#c89aff"};${mcDelay(f)}"></i>`;
    if (MC_BURST[f.k] && f.sq >= 0 && !["hit"].includes(f.k)) out += `<i class="mc-burst" data-k="u${f.n}" style="${pos(f.sq)};--bc:${MC_BURST[f.k]};${mcDelay(f)}"></i>`;
    if (f.k === "upgrade" && f.sq >= 0) out += `<i class="mc-pillar" data-k="p${f.n}" style="${pos(f.sq)};${mcDelay(f)}"></i>`;
  });
  return `<div class="mc-fxl">${out}</div>`;
}

function mcBanner(r, live, me) {
  const pick = (k) => live.filter((f) => f.k === k).slice(-1)[0];
  const ev = pick("event"), realm = pick("realm"), combo = pick("combo"), start = pick("start"), cast = pick("card"), skill = pick("skill"), up = pick("upgrade");
  if (ev) { const E = MChess.EVENTS[ev.ev]; return `<div class="mc-evbig ${E.realm ? "realm-" + ev.ev : ""}" data-k="b${ev.n}" style="${mcDelay(ev)}"><small class="k">${E.realm ? "НОВИЙ СВІТ" : "КАТАКЛІЗМ"}</small><span>${E.e}</span><b>${E.name}!</b><small>${esc(E.desc)}</small></div>`; }
  if (realm && realm.realm === "arcana") return `<div class="mc-evbig realm-arcana" data-k="b${realm.n}" style="${mcDelay(realm)}"><small class="k">СВІТ ЗМІНИВСЯ</small><span>🔮</span><b>Аркана</b><small>Дошка повертається до звичайної магії</small></div>`;
  if (combo) return `<div class="mc-combo-b" data-k="b${combo.n}" style="${mcDelay(combo)}"><small>КОМБО!</small><b>${esc(combo.name)}</b></div>`;
  if (start) { const n = (c) => esc((r.players.find((p) => p.id === r.seats[c]) || { name: mcCol(c) }).name);
    return `<div class="mc-vs" data-k="b${start.n}" style="${mcDelay(start)}"><div class="w">${mcPiece({ t: "K", c: "w", hp: 1, max: 1 }, { mini: true })}<b>${n("w")}</b></div><span>VS</span><div class="b">${mcPiece({ t: "K", c: "b", hp: 1, max: 1 }, { mini: true })}<b>${n("b")}</b></div></div>`; }
  if (up && up.c !== me) return `<div class="mc-cast up" data-k="b${up.n}" style="${mcDelay(up)}"><span>${up.rank >= 2 ? "🌟" : "⭐"}</span><b>${up.rank >= 2 ? "Герой!" : "Ветеран!"}</b><small>${up.rank >= 2 ? "+1 удар" : "+1 життя"}</small></div>`;
  if (cast && cast.c !== me) { const C = MChess.CARDS[cast.card]; return `<div class="mc-cast c-${cast.c}" data-k="b${cast.n}" style="${mcDelay(cast)}"><span>${C.e}</span><b>${C.name}</b><small>грає суперник</small></div>`; }
  if (skill && skill.c !== me) { const K = MChess.SKILLS[skill.t]; return `<div class="mc-cast skill c-${skill.c}" data-k="b${skill.n}" style="${mcDelay(skill)}"><span>${K.e}</span><b>${K.name}</b><small>${MChess.PIECES[skill.t].name} суперника</small></div>`; }
  return "";
}

function mcTable() {
  const r = S.room, me = r.me, flip = me === "b", sel = mcSel(), my = mcMyTurn(r);
  const live = mcLive(r);
  const vfx = live.filter((f) => f.k === "vortex").slice(-1)[0];
  const ctx = { sel: null, info: sel.info, moveTo: new Set(), shots: new Set(), targets: new Set(), skill: new Set(), a: sel.a, fx: live, flip, last: new Set(), my, cardE: null,
    realmFx: live.filter((f) => f.k === "realm").slice(-1)[0], carFx: live.filter((f) => f.k === "carousel").slice(-1)[0], vortex: vfx ? { r: MChess.rc(vfx.sq)[0], c: MChess.rc(vfx.sq)[1], f: vfx } : null };
  live.filter((f) => f.k === "move").forEach((f) => { ctx.last.add(f.from); ctx.last.add(f.sq); });
  const aiming = my && sel.card != null && r.hand[sel.card];
  if (aiming) {
    const k = r.hand[sel.card], step = sel.a == null ? 1 : 2; ctx.cardE = MChess.CARDS[k].e;
    for (let i = 0; i < 64; i++) if (mcCardOk(r, k, i, step, sel.a)) ctx.targets.add(i);
  } else if (my && sel.sel != null) {
    const m = mcMoves(r, sel.sel); ctx.sel = sel.sel;
    m.moves.forEach((x) => ctx.moveTo.add(x.to)); m.shots.forEach((x) => ctx.shots.add(x));
    const tg = MChess.skillTargets(mcState(r), sel.sel); if (tg && !r.board[sel.sel].cd) tg.hit.concat(tg.heal).forEach((x) => ctx.skill.add(x));
  }
  const cells = []; for (let d = 0; d < 64; d++) cells.push(mcCell(r, flip ? 63 - d : d, ctx));
  const files = "abcdefgh", ranks = "87654321";
  const coordsF = `<div class="mc-files">${[...Array(8)].map((_, i) => `<span>${files[flip ? 7 - i : i]}</span>`).join("")}</div>`;
  const coordsR = `<div class="mc-ranks">${[...Array(8)].map((_, i) => `<span>${ranks[flip ? 7 - i : i]}</span>`).join("")}</div>`;
  const foe = me ? (me === "w" ? "b" : "w") : "b", mine = me || "w";
  const RM = MChess.REALMS[r.realm || "arcana"];
  const rules = Object.entries(r.rules || {}).map(([k, n]) => { const E = MChess.EVENTS[k]; return E ? `<span class="pill on">${E.e} ${E.name} · ${n} р.</span>` : ""; }).join("");
  const nxt = MChess.EVENTS[r.next];
  const eclipse = r.round >= MChess.ECLIPSE - 3 ? `<span class="pill ${r.round > MChess.ECLIPSE ? "bad" : ""}">🌑 ${r.round > MChess.ECLIPSE ? "Затемнення: королі −1 щораунду" : `Затемнення з ${MChess.ECLIPSE + 1}-го раунду`}</span>` : "";
  const timer = r.deadline ? `<span class="bj-timer mc-timer" id="timer" data-total="${r.total}"><span id="timer-num">${fmtTime(remaining())}</span></span>` : "";
  const flipFx = live.filter((f) => f.k === "flipboard").slice(-1)[0], shake = live.filter((f) => ["meteor", "blackhole", "combo"].includes(f.k)).slice(-1)[0];
  const boardStyle = flipFx ? mcDelay(flipFx) : shake ? mcDelay(shake) : "";
  return `<div class="mc-head"><button class="avatar" data-a="leave">←</button><div class="grow"><small>Раунд ${r.round}</small><b>${RM.e} ${RM.name}${r.realm && r.realm !== "arcana" ? ` <em>ще ${r.realmLeft} р.</em>` : ""}</b></div>
      <button class="mc-help" data-a="mc-help">❓</button>${timer}</div>
    ${mcBar(r, foe, false)}
    <div class="mc-strip">${rules}${r.phase === "play" && nxt ? `<span class="pill next">${r.inRounds <= 0 ? "Зараз" : `Через ${r.inRounds} р.`}: ${nxt.e} ${nxt.name}</span>` : ""}${eclipse}</div>
    <div class="mc-boardwrap">${coordsR}<div class="mc-board realm-${r.realm || "arcana"} ${r.rules && r.rules.fog ? "fogon" : ""} ${aiming ? "aiming" : ""} ${flipFx ? "flipin" : shake ? "quake" : ""}" style="${boardStyle}">
      <i class="mc-amb"></i>${cells.join("")}${mcFxLayer(r, live, flip)}${mcBanner(r, live, me)}</div>${coordsF}</div>
    ${mcBar(r, mine, !!me)}
    ${r.phase === "end" ? mcEnd() : mcAction()}
    <div class="section-title">Хроніка</div>
    <div class="card bj-log mc-log">${(r.log || []).slice().reverse().map((l, i) => `<div class="ev ${i === 0 ? "new" : ""} ${/КОМБО/.test(l) ? "combo" : ""}">${esc(l)}</div>`).join("") || '<div class="muted">Тиша…</div>'}</div>`;
}

// панель під дошкою: приціл карти, або картка фігури, або карти в руці + підказка
function mcAction() {
  const r = S.room, sel = mcSel(), ts = r.ts || {}, my = mcMyTurn(r);
  let status = "";                                                  // «твій хід» уже видно на смузі гравця — тут лише подробиці
  if (!r.me) status = `<div class="mc-status wait">👀 Ти глядач · ходять ${mcCol(r.turn)}</div>`;
  else if (!my) status = `<div class="mc-status wait">⏳ Хід суперника… Торкайся фігур, щоб роздивитися</div>`;
  else {
    const left = (ts.moves || 1) - (ts.used || 0);
    const bits = [(ts.moves || 1) > 1 ? `ще ходів: ${left} з ${ts.moves}` : "", ts.lock != null ? "🔥 ходить палаюча фігура" : ""].filter(Boolean);
    if (bits.length) status = `<div class="mc-status go">${bits.join(" · ")}</div>`;
  }
  let panel = "";
  if (my && sel.card != null && r.hand[sel.card]) {
    const k = r.hand[sel.card], C = MChess.CARDS[k], step = sel.a == null ? 1 : 2;
    panel = `<div class="mc-aim ck-${k}"><span class="e">${C.e}</span><div class="grow"><b>${C.name}</b><div class="small">${esc(C.desc)}</div>
        <div class="mc-aimhint">👆 Торкнися ${MC_ASK[step === 2 ? C.two : C.tgt] || "цілі"}${step === 2 ? " — куди" : ""} на дошці — цілі світяться ${C.e}</div></div>
      <button class="btn ghost small" data-a="mc-cancel">✕</button></div>`;
  } else if (sel.info != null && (r.board[sel.info] || r.tiles[sel.info])) panel = mcPieceCard(r, sel.info);
  const canCard = my && !ts.card && !ts.used;
  const hand = r.me ? `<div class="mc-handwrap"><div class="mc-handt">🃏 Карти-чари${my ? (canCard ? " · торкнися, щоб зіграти (до ходу)" : ts.card ? " · карту вже зіграно" : " · після ходу карти не грають") : ""}</div>
    <div class="mc-hand">${(r.hand || []).map((k, i) => { const C = MChess.CARDS[k]; return `<button class="mc-card ck-${k} ${sel.card === i ? "on" : ""} ${canCard ? "" : "off"}" data-a="mc-card" data-v="${i}"><span>${C.e}</span><b>${C.name}</b></button>`; }).join("")}
    ${(r.hand || []).length ? "" : `<div class="small muted mc-nohand">Карт немає — нові приходять на початку ходу й зі скринь 🎁</div>`}</div></div>` : "";
  const hint = !panel && r.me ? `<div class="mc-hint">👆 Торкнися будь-якої фігури — побачиш її ходи, життя, навичку й посилення ✨</div>` : "";
  const stuck = my && !mcCanAct(r);
  const btns = r.me ? `<div class="row mc-btns">${my && ts.used && (ts.moves || 1) > ts.used ? `<button class="btn grow" data-a="mc-end">Завершити хід</button>` : stuck ? `<button class="btn grow" data-a="mc-end">Пропустити хід</button>` : ""}
    ${S.mcResign && Date.now() - S.mcResign < 5000 ? `<button class="btn small mc-resign-ok" data-a="mc-resign-ok">🏳 Так, здаюся</button><button class="btn ghost small" data-a="mc-resign-no">Ні</button>`
      : `<button class="btn ghost small" data-a="mc-resign">🏳 Здатися</button>`}${isHost() && mcAway(r) ? `<button class="btn ghost small" data-a="mc-skip">⏭ Пропустити хід (гравець не на зв’язку)</button>` : ""}</div>` : "";
  return `<div class="mc-act">${status}${panel}${hand}${panel ? "" : hint}${btns}</div>`;
}

// картка фігури: життя, удар, ранг і як рости, стани, навичка з кнопкою, посилення за ману
function mcPieceCard(r, sq) {
  const p = r.board[sq], t = r.tiles[sq], my = mcMyTurn(r), ts = r.ts || {};
  const tileLine = t ? `<div class="mc-pline">${MC_TILE_NAME[t.k] ? `🟪 Клітинка: ${MC_TILE_NAME[t.k]}${t.ttl ? ` (ще ${t.ttl} р.)` : ""}` : ""}</div>` : "";
  if (!p) return `<div class="mc-pcard"><div class="mc-ptop"><div class="grow"><b>Клітинка ${"abcdefgh"[MChess.rc(sq)[1]]}${8 - MChess.rc(sq)[0]}</b></div><button class="mc-x" data-a="mc-close">✕</button></div>${tileLine}</div>`;
  const P = MChess.PIECES[p.t], K = MChess.SKILLS[p.t], own = p.c === r.me, rank = p.rank || 0, UP = MChess.UP_COST, mana = (r.mana && r.mana[r.me]) || 0;
  const rankName = ["Новобранець", "⭐ Ветеран", "🌟 Герой"][rank];
  const grow = p.clone ? "Двійник не росте" : rank >= 2 ? "Максимальний ранг" : `До ${rank ? "🌟 героя" : "⭐ ветерана"}: ${rank ? 3 - (p.xp || 0) : 1 - (p.xp || 0)} ${(rank ? 3 - (p.xp || 0) : 1 - (p.xp || 0)) === 1 ? "вбивство" : "вбивства"} або ✨${UP[rank]}`;
  const states = [p.shield ? ["🛡", `Щит ${p.shield} — гасить стільки шкоди`] : null, p.frozen ? ["❄️", `Вмерзла — не ходить ще ${p.frozen} ${p.frozen === 1 ? "хід" : "ходи"}`] : null, p.poison ? ["☠️", `Отрута — −1 життя ще ${p.poison} ходи`] : null,
    p.rage ? ["😡", `Лють — +1 удар (${p.rage} ходи)`] : null, p.gun ? ["🔫", `Рушниця — ${p.gun} постріли замість ходу (торкнися цілі з прицілом ⌖)`] : null, p.mirror ? ["🪞", "Дзеркало — наступний удар повернеться нападнику"] : null,
    p.vamp ? ["🧛", `Вампір — лікується від своїх ударів (${p.vamp} ходи)`] : null, p.clone ? ["👥", "Двійник — 1 життя, зникне від удару"] : null, ts.fire === p.id ? ["🔥", "Вогняний слід — ходить двічі, позаду горить"] : null,
    ts.ghost === p.id ? ["👻", "Привид — цей хід проходить крізь усе"] : null].filter(Boolean);
  let skill = "";
  if (own && my) {
    const ready = MChess.skillReady(mcState(r), sq) && (ts.lock == null || ts.lock === p.id);
    const why = p.frozen ? "вмерзла" : p.cd ? `перезарядка: ${p.cd} ${p.cd === 1 ? "хід" : "ходи"}` : ts.lock != null && ts.lock !== p.id ? "ходить палаюча фігура" : "немає цілей поруч";
    skill = ready ? `<button class="btn small mc-skbtn" data-a="mc-skill">${K.e} Застосувати</button>` : `<span class="mc-cd">${why}</span>`;
  } else skill = p.cd ? `<span class="mc-cd">перезарядка ${p.cd}</span>` : "";
  let up = "";
  if (own && my && !p.clone && rank < 2) {
    const cost = UP[rank], can = mana >= cost && !ts.up;
    up = `<button class="btn small mc-upbtn ${can ? "" : "off"}" data-a="mc-upgrade">⬆️ Посилити до ${rank ? "героя (+1 удар)" : "ветерана (+1 життя)"} · ✨${cost}</button>
      ${can ? "" : `<div class="small muted mc-upwhy">${ts.up ? "Посилювати можна раз за хід" : `Мана: ✨${mana} з ${cost} — +1 щоходу й +1 за кожне вбивство`}</div>`}`;
  }
  const moves = own && my && !p.frozen ? mcMoves(r, sq) : null;
  const mvHint = moves ? (moves.moves.length || moves.shots.length ? `<div class="mc-pline muted">👆 Точки на дошці — куди піти, червоні кільця — кого вдарити${moves.shots.length ? ", ⌖ — постріл" : ""}</div>` : `<div class="mc-pline muted">Цій фігурі зараз нікуди ходити</div>`) : "";
  return `<div class="mc-pcard ${own ? "own" : "foe"}">
    <div class="mc-ptop"><div class="mc-ucell">${mcPiece(p, { mini: true })}</div>
      <div class="grow"><b>${P.name}${p.clone ? "-двійник" : ""}</b> <span class="small muted">${own ? "твоя" : mcCol(p.c)}</span>
        <div class="mc-pstats"><span>❤️ ${p.hp}/${p.max}</span><span>⚔️ ${MChess.atkOf(p)}</span><span class="mc-rk r${rank}">${rankName}</span></div>
        <div class="small muted">${grow}</div></div>
      <button class="mc-x" data-a="mc-close">✕</button></div>
    ${states.map(([e, d]) => `<div class="mc-pline">${e} ${esc(d)}</div>`).join("")}
    <div class="mc-pskill"><span class="e">${K.e}</span><div class="grow"><b>${K.name}</b> <span class="small muted">навичка, раз на ${K.cd} ходи</span><div class="small">${esc(K.desc)}</div></div>${skill}</div>
    ${up}${mvHint}${tileLine}</div>`;
}

// той, чий хід, вийшов зі зв’язку — хост може пропустити його хід
const mcAway = (r) => { const p = r.players.find((x) => x.id === r.seats[r.turn]); return !!p && !p.online; };
// іскра «навичка готова» — лише там, де навичка зараз справді щось дасть (а не на кожному пішаку)
function mcSkillWorth(r, sq) {
  const p = r.board[sq]; if (!p || p.cd || p.frozen) return false;
  const st = mcState(r), t = MChess.skillTargets(st, sq);
  if (p.t === "P") return t.buff.length >= 4;
  if (p.t === "K") return t.buff.some((x) => MChess.movesOf(st, x).some((m) => m.attack)) || (p.hp <= 2 && t.buff.length > 0);
  return t.hit.length > 0 || t.heal.length > 0;
}
// чи може гравець щось зробити фігурами (хід, постріл, навичка) — інакше покажемо «Пропустити хід»
function mcCanAct(r) {
  const st = mcState(r), ts = r.ts || {};
  for (let i = 0; i < 64; i++) { const p = r.board[i]; if (!p || p.c !== r.me || (ts.lock != null && ts.lock !== p.id)) continue;
    if (MChess.movesOf(st, i, { ghost: ts.ghost === p.id }).length || MChess.shotsOf(st, i).length || MChess.skillReady(st, i)) return true; }
  return false;
}

function mcEnd() {
  const r = S.room, res = r.results || {}, w = r.winner, wp = w ? r.players.find((p) => p.id === r.seats[w]) : null;
  const meWon = r.me && w === r.me, st = res.stats || { w: {}, b: {} }, n = res.rounds || r.round;
  const row = (c) => `<div class="row mc-sum"><span class="mc-dot ${c}"></span><b class="grow">${esc((r.players.find((p) => p.id === r.seats[c]) || { name: mcCol(c) }).name)}</b>
    <span>💀 ${st[c].kills || 0}</span><span>⚔️ ${st[c].dmg || 0}</span><span>🃏 ${st[c].cards || 0}</span><span>💥 ${st[c].combos || 0}</span></div>`;
  return `<div class="win mt mc-win ${meWon ? "me" : ""}"><div class="mc-ucell big">${mcPiece({ t: "K", c: w || "w", hp: 1, max: 1, rank: 2 }, { mini: true })}</div><div class="kicker">${w ? "КОРОЛЯ ЗНИЩЕНО" : "НІЧИЯ"}</div><h2>${w ? `${meWon ? "Ви перемогли!" : esc(wp ? wp.name : mcCol(w))}` : "Ніхто не переміг"}</h2>
      <p>${n} ${plural(n, "раунд", "раунди", "раундів")} · ${w ? `перемогли ${mcCol(w)}` : "до останнього"}</p></div>
    <div class="card">${row("w")}${row("b")}<div class="small muted mt">💀 знищено · ⚔️ шкода · 🃏 карти · 💥 комбо</div></div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ще партія</button>` : `<div class="card center mt2 muted">Хост може почати нову партію</div>`}
    <button class="btn ghost mt" data-a="leave">Вийти з-за дошки</button>`;
}

// очки й нагорода наприкінці партії (лише тим, хто грав)
function recordMChess(room) {
  const key = "mc:" + room.code + ":" + room.game_no;
  if (!room.me || store.lastMc === key) return;
  store.lastMc = key; store.games = (store.games || 0) + 1;
  const won = room.winner === room.me;
  if (won) store.wins = (store.wins || 0) + 1;
  store.lastGame = key; S.reward = { key, sum: gameReward(room, won, true) };
  saveProfile(); syncProfile();
}

// після вибору карти — показати дошку, якщо вона прокручена за край екрана
function mcShowBoard() {
  requestAnimationFrame(() => { const b = document.querySelector(".mc-board"); if (!b) return; const rc = b.getBoundingClientRect(); if (rc.top < 0 || rc.bottom > window.innerHeight) b.scrollIntoView({ block: "center", behavior: "smooth" }); });
}
function mcShowPanel() {
  requestAnimationFrame(() => { const el = document.querySelector(".mc-pcard"); if (!el) return; const rc = el.getBoundingClientRect(); if (rc.bottom > window.innerHeight) window.scrollBy({ top: Math.min(rc.bottom - window.innerHeight + 12, Math.max(0, rc.top - 60)), behavior: "smooth" }); });
}

function mcCell1(sq) {
  const r = S.room, sel = mcSel(), my = mcMyTurn(r);
  sq = Number(sq);
  if (my && sel.card != null && r.hand[sel.card]) {
    const k = r.hand[sel.card], C = MChess.CARDS[k], step = sel.a == null ? 1 : 2;
    if (!mcCardOk(r, k, sq, step, sel.a)) { haptic("light"); toast(`${C.e} Обери ${MC_ASK[step === 2 ? C.two : C.tgt] || "ціль"} — цілі світяться`); return; }
    if (step === 1 && C.two) { sel.a = sq; haptic("light"); render(); return; }
    const msg = { t: "act", slot: "card", i: sel.card, a: step === 1 ? sq : sel.a, b: step === 2 ? sq : null };
    sel.card = null; sel.a = null; sel.info = null; send(msg); haptic("heavy"); render(); return;
  }
  if (my && sel.sel != null) {
    const m = mcMoves(r, sel.sel);
    if (m.shots.includes(sq)) { send({ t: "act", slot: "shoot", from: sel.sel, to: sq }); sel.sel = null; sel.info = null; haptic("heavy"); render(); return; }
    const mv = m.moves.find((x) => x.to === sq);
    if (mv) { send({ t: "act", slot: "move", from: sel.sel, to: sq }); sel.sel = null; sel.info = null; haptic(mv.attack ? "heavy" : "light"); render(); return; }
  }
  const p = r.board[sq];
  if (sel.info === sq && sel.sel === (my && p && p.c === r.me ? sq : null)) { sel.info = null; sel.sel = null; haptic("light"); render(); return; }   // повторний дотик — сховати
  sel.info = p || r.tiles[sq] ? sq : null;
  sel.sel = my && p && p.c === r.me ? sq : null;
  if (sel.sel != null && p.frozen) toast("❄️ Фігура вмерзла в лід — ходити не може");
  else if (sel.sel != null && r.ts && r.ts.lock != null && r.ts.lock !== p.id) toast("🔥 Цей хід — лише палаючою фігурою");
  haptic("light"); render(); if (sel.info != null) mcShowPanel();
}

const MC_ACTIONS = {
  "mc-create": () => { haptic("medium"); S.screen = "connecting"; S.joining = ""; render(); Net.host({ game: "mchess" }).catch((e) => { toast(e.message); S.screen = "mchess"; render(); }); },
  "mc-settings": () => { S.sheet = { type: "mc-settings" }; renderOverlay(); },
  "mc-set": (v) => send({ t: "settings", settings: { chaos: Number(v) } }),
  "mc-set-bot": (v) => { send({ t: "settings", settings: { bot: Number(v) } }); haptic("light"); },
  "mc-help": () => { S.sheet = { type: "mc-help" }; renderOverlay(); },
  "mc-cell": (v) => mcCell1(v),
  "mc-close": () => { const sel = mcSel(); sel.info = null; sel.sel = null; render(); },
  "mc-skill": () => { const sel = mcSel(); if (sel.sel == null) return; send({ t: "act", slot: "skill", from: sel.sel }); sel.sel = null; sel.info = null; haptic("heavy"); render(); },
  "mc-upgrade": () => {
    const r = S.room, sel = mcSel(), p = sel.info != null ? r.board[sel.info] : null; if (!p) return;
    const cost = MChess.UP_COST[p.rank || 0], mana = (r.mana && r.mana[r.me]) || 0;
    if (r.ts && r.ts.up) return toast("Посилювати можна раз за хід");
    if (mana < cost) return toast(`Бракує мани: ✨${mana} з ${cost}. Мана: +1 щоходу й +1 за вбивство`);
    send({ t: "act", slot: "upgrade", from: sel.info }); haptic("heavy");
  },
  "mc-card": (v) => {
    const r = S.room, sel = mcSel(), i = Number(v), ts = r.ts || {}, k = r.hand[i];
    if (!k) return;
    if (!mcMyTurn(r)) { toast(`${MChess.CARDS[k].e} ${MChess.CARDS[k].name}: ${MChess.CARDS[k].desc}`); return; }
    if (ts.card) return toast("Одна карта за хід — цей хід карту вже зіграно");
    if (ts.used) return toast("Карти грають до ходу фігурою. Наступного ходу — спершу карта, потім хід");
    if (sel.card === i) { sel.card = null; sel.a = null; render(); return; }
    const C = MChess.CARDS[k];
    if (C.tgt === "none") { send({ t: "act", slot: "card", i }); haptic("heavy"); sel.card = null; render(); return; }
    let any = false; for (let q = 0; q < 64 && !any; q++) any = mcCardOk(r, k, q, 1, null);
    if (!any) return toast(`${C.e} Зараз немає цілі: потрібна ${MC_ASK[C.tgt]}`);
    sel.card = i; sel.a = null; sel.sel = null; sel.info = null; haptic("light"); render(); mcShowBoard();
  },
  "mc-cancel": () => { const sel = mcSel(); sel.card = null; sel.a = null; render(); },
  "mc-end": () => { send({ t: "act", slot: "end" }); haptic("light"); },
  "mc-skip": () => send({ t: "skip" }),
  // здатися — у два дотики прямо на екрані (без системного вікна Telegram, яке в частині клієнтів не відкривається)
  "mc-resign": () => { S.mcResign = Date.now(); haptic("medium"); render(); setTimeout(() => { if (S.mcResign && Date.now() - S.mcResign >= 5000) { S.mcResign = 0; if (S.room && S.room.game === "mchess") render(); } }, 5100); },
  "mc-resign-ok": () => { S.mcResign = 0; send({ t: "act", slot: "resign" }); haptic("heavy"); render(); },
  "mc-resign-no": () => { S.mcResign = 0; render(); },
};
