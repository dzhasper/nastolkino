/* Турниры по играм: экран турнира (запись, сетка, столы, итоги) и связь турнирных комнат с сервером.
   Сервер (/api/cup/*) сам ставит турниры по расписанию, делит на столы и выдаёт призы. Телефон хоста стола открывает комнату,
   остальные садятся по коду; итог партии отправляют все, кто сидел за столом. В «Мафии» — 5 партий подряд, очки за игру. */
"use strict";

const cupNow = () => Math.floor(Date.now() / 1000);
const CUP_KIND = { revolver: { game: "revolver", ico: "🔫" }, roulette: { game: "roulette", ico: "💥" }, bluff: { game: "bluff", ico: "🎴" }, mafia: { game: "mafia", ico: "🕴" } };

// карточка на главной — только когда турнир скоро, идёт или ты в нём только что играл
function cupCard() {
  const c = Api.on && Api.state && Api.state.cup; if (!c) return "";
  const soon = c.status === "plan" && c.start_at - cupNow() < 4 * 3600;
  if (!["reg", "play"].includes(c.status) && !soon && !(c.status === "done" && c.joined)) return "";
  const left = Math.max(0, c.start_at - cupNow());
  const line = c.status === "reg" ? (c.joined ? `✓ Ти записаний(а) · старт через ${fmtLeft2(left)}` : `Запис відкрито · старт через ${fmtLeft2(left)}`)
    : c.status === "plan" ? `Запис відкриється за 40 хвилин · старт через ${fmtLeft2(left)}` : c.status === "play" ? (c.joined ? (c.out ? "Ти вибув(ла) — дивись, хто переможе" : "🔥 Ти в грі — відкрий свій стіл") : "Триває зараз — дивись сітку") : "Підсумки і твої призи";
  return `<button class="card cup-card ${c.big ? "big" : ""} ${c.status}" data-a="go" data-v="cup"><span class="cc-ico">${c.big ? "👑" : "🏆"}</span><div class="grow"><b>${esc(c.title)}</b>
    <div class="small">${line}</div></div><span class="muted">›</span></button>`;
}

function cupLoad(id) {
  return Api.call("/api/cup/get", id ? { id } : {}).then((r) => { S.cup = r.cup; S.cupAt = Date.now(); if (S.screen === "cup") render(); }).catch((e) => { S.cupErr = e.message; if (S.screen === "cup") render(); });
}
setInterval(() => { if (S.screen === "cup" && Api.ready && !document.hidden) cupLoad(S.cup && S.cup.id); }, 5000);

function viewCup() {
  const c = S.cup;
  if (!Api.on) return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Турнір</h1></div></div><div class="card">Турніри працюють через сервер — відкрий Настолкіно з бота.</div></div>${tabs()}`;
  if (!c) { if (!S.cupAt) cupLoad(S.cupWant); return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Турнір</h1></div></div>
    <div class="card center">${S.cupAt ? "Зараз турнірів немає. Вони проходять щодня — зазирни пізніше 🏆" : `<div class="spinner" style="margin:10px auto"></div>`}</div></div>${tabs()}`; }
  const left = Math.max(0, c.start_at - cupNow());
  const st = { plan: "скоро", reg: "триває запис", play: `раунд ${c.round}`, done: "завершено", cancel: "не відбувся" }[c.status] || "";
  let body = "";
  if (c.status === "plan" || c.status === "reg") {
    body += `<div class="card cup-reg"><div class="cr-time"><b>${fmtLeft2(left)}</b><span>до старту</span></div><div class="grow small">${c.status === "plan" ? "Запис відкриється за 40 хвилин до старту." : `Записалися: <b>${c.count}</b> · потрібно щонайменше ${c.min}`}</div></div>
      ${c.status === "reg" ? (c.joined ? `<div class="card center small">✓ Ти в списку. Коли турнір почнеться, бот напише в особисті, за яким ти столом.</div><button class="btn ghost mt" data-a="cup-leave">Вийти з турніру</button>`
        : `<button class="btn mt" data-a="cup-join">✍️ Узяти участь</button>`) : ""}`;
  }
  if (c.status === "play" || c.status === "done") body += cupMyTable(c) + cupBracket(c);
  if (c.status === "done" && c.my && c.my.prize) body += `<div class="card cup-prize"><b>${c.my.place === 1 ? "🥇 Ти переміг(ла)!" : c.my.place ? `Твоє місце: ${c.my.place}` : "Підсумки"}</b>${c.kind === "mafia" ? ` · очки: ${c.my.points}` : ""}
    <div class="gp-list mt">${c.my.prize.map((t) => `<div class="gp-row"><span class="gp-i">🎁</span><div class="grow"><b>${esc(t)}</b></div></div>`).join("")}</div><div class="tiny muted mt">Призи вже в тебе. Список прийшов і в особисті від бота.</div></div>`;
  if (c.status === "cancel") body += `<div class="card center">Не набралося гравців. Наступний турнір — скоро!</div>`;
  return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>${c.big ? "👑 " : "🏆 "}Турнір</h1>
      <div class="muted small">${c.ico} ${esc(c.ru)} · ${st}</div></div>${coinPill()}</div>
    <div class="card cup-hero ${c.big ? "big" : ""}"><b>${esc(c.title)}</b><div class="small muted">${c.kind === "mafia" ? `${c.matches} партій поспіль за одним столом. Очки: перемога команди +3, дожив до кінця +1, вбивство мафії +2, порятунок лікарем +2, знайдена мафія +1, правильний голос +1` : "Сітка: столи по 4 → переможці далі → півфінал → фінал удвох. Кожен стіл — одна партія до останнього, хто вижив"}</div>
      <div class="cup-prizes mt">${c.prizes.map((t) => `<div>${esc(t)}</div>`).join("")}</div><div class="tiny muted mt">Без ставок — монети не потрібні, лише призи</div></div>
    ${body}
  </div>${tabs()}`;
}

// твой стол: открыть (хосту) или сесть по коду
function cupMyTable(c) {
  if (c.status !== "play") return "";
  const t = c.tables.find((x) => x.round === c.round && x.players.some((p) => p.uid === c.me));
  if (!t) return c.joined ? `<div class="card center small">${c.my && c.my.out ? "Ти вибув(ла). Дивись сітку — хто дійде до фіналу?" : "Чекаємо наступний раунд…"}</div>` : "";
  const host = t.host === c.me, inRoom = S.room && S.room.code === t.code && S.screen === "room";
  let act;
  if (t.status === "done") act = `<div class="small mt">${t.winner === c.me ? "✅ Ти переміг(ла) за цим столом — чекаємо інші столи" : c.kind === "mafia" ? "Серію зіграно — чекаємо інші столи" : "Стіл дограно"}</div>`;
  else if (host && !t.code) act = `<button class="btn mt" data-a="cup-open" data-v="${t.id}">🚪 Відкрити стіл</button><div class="tiny muted mt">Ти — хост: відкрий стіл, решта сядуть за кодом. Не відкриєш за 10 хвилин — переможця вибере випадок серед тих, хто зайшов</div>`;
  else if (!t.code) act = `<div class="small mt">⏳ Чекаємо, поки хост відкриє стіл…</div>`;
  else act = `<button class="btn mt" data-a="cup-sit" data-v="${t.code}">${inRoom ? "↩ Повернутися за стіл" : `🪑 Сісти за стіл · ${t.code}`}</button>`;
  return `<div class="card cup-mine"><b>Твій стіл №${t.idx}</b>${c.kind === "mafia" && t.match ? ` · зіграно партій: ${t.match} з ${c.matches}` : ""}
    <div class="cup-seats mt">${t.players.map((p) => `<span class="${p.uid === t.host ? "host" : ""} ${p.uid === c.me ? "me" : ""}">${p.uid === t.host ? "👑 " : ""}${esc(p.uid === c.me ? "Ти" : p.name)}</span>`).join("")}</div>${act}</div>`;
}

// сетка: раунды колонками, столы — карточками
function cupBracket(c) {
  if (c.kind === "mafia") {
    const s = c.standings || [];
    return `<div class="section-title">Очки серії</div><div class="card cup-stand">${s.length ? s.map((p, i) => `<div class="${p.uid === c.me ? "me" : ""}"><span>${i + 1}.</span><b class="grow">${esc(p.name)}</b><span>${p.points}</span></div>`).join("") : "<div class='small muted'>Поки без очок</div>"}</div>`;
  }
  const rounds = [...new Set(c.tables.map((t) => t.round))];
  const label = (r) => { const ts = c.tables.filter((t) => t.round === r), small = ts.every((t) => t.players.length <= 2);
    return ts.length === 1 ? "Фінал" : small && ts.length === 2 ? "Півфінал" : r === 1 ? "Групи" : `Раунд ${r}`; };
  return `<div class="section-title">Сітка</div><div class="cup-bracket">${rounds.map((r) => `<div class="cb-col"><div class="cb-h">${label(r)}</div>${c.tables.filter((t) => t.round === r).map((t) => `
      <div class="cb-t ${t.status} ${t.players.some((p) => p.uid === c.me) ? "mine" : ""}"><div class="cb-n">Стіл ${t.idx}${t.status === "play" ? " · грають" : t.status === "wait" ? " · чекають" : ""}</div>
        ${t.players.map((p) => `<div class="cb-p ${t.winner === p.uid ? "win" : t.status === "done" ? "lose" : ""} ${p.uid === c.me ? "me" : ""}">${t.winner === p.uid ? "🏆 " : ""}${esc(p.uid === c.me ? "Ти" : p.name)}</div>`).join("")}</div>`).join("")}</div>`).join("")}</div>`;
}

/* ---------------------------------------------------------------- турнирная комната */
function cupTour(t, c) { return { cup: c.id, table: t.id, kind: c.kind, players: t.players.map((p) => "tg" + p.uid), match: 1, matches: c.matches || 1 }; }
// хост: все за столом — начинаем сами; партия кончилась — отправляем итог; в мафии — следующая партия через 12 секунд
function cupRoom(room) {
  const tour = room && room.settings && room.settings.tour; if (!tour) return;
  const host = Net.isHost(), hub = host ? Net._hub() : null;
  if (host && room.phase === "lobby") {
    const all = tour.players.every((p) => room.players.some((x) => x.id === p && x.online));
    const key = room.code + ":" + tour.match;
    if (all && S.cupStart !== key) { S.cupStart = key; setTimeout(() => { if (S.room && S.room.phase === "lobby") send({ t: "start" }); }, 3000); }
  }
  if (room.phase !== "end") return;
  const rk = room.code + ":" + tour.cup + ":" + tour.match + ":" + (room.game_no || 0);
  if (S.cupReported === rk) return;
  S.cupReported = rk;
  if (tour.kind === "mafia") {
    if (!host || !hub || !hub.room.game) return;
    const g = hub.room.game, st = g.stats || {};
    const players = Object.values(g.players).map((p) => ({ id: p.id, won: (g.winners || []).includes(p.id), alive: p.alive, kills: (st[p.id] || {}).kills || 0, saves: (st[p.id] || {}).saves || 0, finds: (st[p.id] || {}).finds || 0, votes: (st[p.id] || {}).votes || 0 }));
    Api.call("/api/cup/report", { id: tour.cup, table: tour.table, match: tour.match, players }).then((r) => {
      toast(r.done ? "🏆 Серію зіграно — підсумки в турнірі" : `Партія ${tour.match} з ${tour.matches} записана`);
      if (!r.done && tour.match < tour.matches) setTimeout(() => {                       // следующая партия серии
        const h = Net._hub(); if (!h || h.room.phase !== "end") return;
        h.room.settings.tour.match = tour.match + 1;
        h.handle(S.me, { t: "again" }); setTimeout(() => h.handle(S.me, { t: "start" }), 1500);
      }, 12000);
    }).catch((e) => toast(e.message));
  } else if (room.winner) Api.call("/api/cup/report", { id: tour.cup, table: tour.table, winner: room.winner }).then(() => toast("🏆 Підсумок столу надіслано в турнір")).catch(() => {});
}

/* ---------------------------------------------------------------- личный турнир с ботами: приходит в личку в случайные дни, живёт сутки.
   Раунд — комната на твоём телефоне: сам добавляешь ботов, игра стартует сама, итог уходит на сервер */
const MINI_STEPS = (m) => (m.rounds > 1 ? ["Стіл на чотирьох", "Півфінал", "Фінал"] : ["Партія з ботами"]);
const MINI_BOTS = (m) => (m.kind === "mafia" ? 7 : m.round === 0 ? 3 : 1);
function miniTile() {
  const m = Api.on && Api.state && Api.state.mini; if (!m || m.status !== "open") return "";
  const left = Math.max(0, m.until - cupNow());
  return `<button class="tile w2 cuptile hot" data-a="mini-open" data-v="${m.id}"><span class="t-dot"></span><div class="t-k">🤖 Особистий турнір</div><div class="t-v">${m.ico} ${esc(MINI_STEPS(m)[m.round] || "")}</div>
    <div class="t-s">зникне через ${fmtLeft2(left)}</div></button>`;
}
function miniLoad(id) {
  return Api.call("/api/mini/get", { id }).then((r) => { S.mini = r.mini; if (S.screen === "mini") render(); }).catch((e) => { S.miniErr = e.message; if (S.screen === "mini") render(); });
}
function viewMini() {
  const top = `<div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Особистий турнір</h1><div class="muted small">лише для тебе · суперники — боти</div></div></div>`;
  const m = S.mini;
  if (!Api.on) return `<div class="fade-in">${top}<div class="card">Особисті турніри працюють через сервер гри.</div></div>`;
  if (!m) { if (!S.miniErr && S.miniWant) miniLoad(S.miniWant); return `<div class="fade-in">${top}<div class="card center">${S.miniErr ? esc(S.miniErr) : '<div class="spinner" style="margin:10px auto"></div>'}</div></div>`; }
  const steps = MINI_STEPS(m), left = Math.max(0, m.until - cupNow());
  const st = (i) => (m.status === "won" || i < m.round ? "done" : m.status === "open" && i === m.round ? "cur" : m.status === "lost" && i === m.round ? "lost" : "");
  const em = (i) => ({ done: "✓ перемога", cur: "зараз", lost: "виліт" })[st(i)] || "попереду";
  const head = m.status === "won" ? `<div class="card center mini-res won"><div class="display">🥇 Турнір виграно!</div><div class="small mt">Приз уже в тебе: ${m.prize.map(esc).join(" + ")}</div></div>`
    : m.status === "lost" ? `<div class="card center mini-res lost"><div class="display">Виліт: ${esc(steps[m.round] || "")}</div><div class="small mt">Втішні монети нараховано. Новий особистий турнір прийде іншого дня</div></div>`
    : m.status === "gone" ? `<div class="card center mini-res">⌛ Турнір зник — минула доба</div>` : "";
  return `<div class="fade-in">${top}
    <div class="card cup-hero mini-hero"><b>${m.ico} ${esc(m.name)}</b><div class="small muted">${m.rounds > 1 ? "Стіл на чотирьох → півфінал → фінал. Програв раунд — турнір завершено" : "Одна партія за столом з ботами: переможе твоя команда — турнір твій"}</div>
      ${m.status === "open" ? `<div class="mini-left">⏳ зникне через <b>${fmtLeft2(left)}</b></div>` : ""}</div>
    ${head}
    <div class="mini-steps">${steps.map((x, i) => `<div class="mini-step ${st(i)}"><b>${i + 1}</b><span>${esc(x)}</span><em>${em(i)}</em></div>`).join("")}</div>
    <div class="card mini-prize"><span>🎁</span><div class="grow"><b>Приз за перемогу</b><div class="small">${m.prize.map(esc).join(" + ")}</div></div></div>
    ${m.status === "open" ? `<button class="btn mt" data-a="mini-play">▶️ Грати: ${esc(steps[m.round])}</button><div class="small muted mt center">Кімната відкриється в тебе, боти сядуть самі</div>` : ""}
  </div>${tabs()}`;
}
// комната личного турнира: хост сажает ботов, стартует, по концу партии отправляет итог
function miniRoom(room) {
  const mini = room && room.settings && room.settings.mini; if (!mini || !Net.isHost()) return;
  const hub = Net._hub(); if (!hub) return;
  if (room.phase === "lobby") {
    const key = room.code + ":" + mini.round;
    if (S.miniSeat !== key) {
      S.miniSeat = key;
      const need = mini.bots - (room.players.length - 1);
      for (let i = 0; i < need; i++) setTimeout(() => Bots.add(), 250 * i);
      setTimeout(() => { const h = Net._hub(); if (h && h.room.phase === "lobby") send({ t: "start" }); }, 600 + 250 * need);
    }
    return;
  }
  if (room.phase !== "end") return;
  const rk = room.code + ":" + mini.id + ":" + mini.round;
  if (S.miniReported === rk) return;
  S.miniReported = rk;
  const won = room.game === "mafia" || !room.game ? (room.winners || []).includes(S.me) : room.winner === S.me;
  Api.call("/api/mini/report", { id: mini.id, round: mini.round, won }).then((r) => {
    S.mini = r.mini; if (r.coins != null) Api.refresh().catch(() => {});
    toast(r.mini.status === "won" ? "🥇 Особистий турнір виграно — приз у тебе!" : won ? "✅ Раунд виграно — далі!" : `Виліт${r.cons ? ` · втішні +${r.cons} 🪙` : ""}`);
    notify(won ? "success" : "warning");
    setTimeout(() => { if (S.room && S.room.code === room.code && S.room.phase === "end") { send({ t: "leave" }); } S.screen = "mini"; render(); }, 5000);
  }).catch((e) => toast(e.message));
}

const CUP_ACTIONS = {
  "mini-open": (id) => { haptic(); S.screen = "mini"; S.mini = null; S.miniErr = null; S.miniWant = Number(id) || (Api.state && Api.state.mini ? Api.state.mini.id : null); render(); window.scrollTo(0, 0); },
  "mini-play": () => {
    const m = S.mini; if (!m || m.status !== "open") return;
    haptic("medium");
    Api.call("/api/mini/start", { id: m.id }).then((r) => {
      S.mini = r.mini; S.screen = "connecting"; S.joining = ""; render();
      const mini = { id: m.id, round: m.round, kind: m.kind, bots: MINI_BOTS(m) };
      return Net.host(m.kind === "mafia" ? { theme: S.setup.theme, mini } : { game: CUP_KIND[m.kind].game, mini });
    }).catch((e) => { toast(e.message); S.screen = "mini"; render(); });
  },
  "cup-join": () => Api.call("/api/cup/join", { id: S.cup.id }).then((r) => { S.cup = r.cup; notify("success"); haptic("medium"); Api.refresh().catch(() => {}); render(); }).catch((e) => toast(e.message)),
  "cup-leave": () => Api.call("/api/cup/leave", { id: S.cup.id }).then((r) => { S.cup = r.cup; render(); }).catch((e) => toast(e.message)),
  "cup-open": (v) => {
    const c = S.cup, t = c && c.tables.find((x) => x.id === Number(v)); if (!t) return;
    const tour = cupTour(t, c), settings = c.kind === "mafia" ? Object.assign({}, { theme: S.setup.theme }, { tour }) : { game: CUP_KIND[c.kind].game, tour };
    haptic("medium"); S.screen = "connecting"; S.joining = ""; render();
    Net.host(settings).then((code) => Api.call("/api/cup/room", { id: c.id, table: t.id, code })).then((r) => { if (r && r.cup) S.cup = r.cup; })
      .catch((e) => { toast(e.message); S.screen = "cup"; render(); });
  },
  "cup-sit": (v) => { if (S.room && S.room.code === v) { S.screen = "room"; return render(); } joinRoom(v); },
};
