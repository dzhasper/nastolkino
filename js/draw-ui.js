/* Рисовалка: экраны и холст. Функции вызываются из app.js (общие S, send, av, esc и т. п. объявлены там). */
"use strict";

const DRAW_TOOLS = [["pen", "✏️", "Олівець"], ["fill", "🪣", "Заливка"], ["eraser", "🧽", "Гумка"]];
const drawPen = () => (S.pen = S.pen || { c: 1, w: 2, tool: "pen" });
const amDrawer = () => S.room && S.room.drawer === S.me;

/* ---------------------------------------------------------------- меню игры */
function viewDrawMenu() {
  const step = (n, t, d) => `<div class="how"><b>${n}</b><div><div class="how-t">${t}</div><div class="muted small">${d}</div></div></div>`;
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("studio")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>🎨 Малювалка</h1>
      <div class="muted small">Один малює — усі вгадують · ${Draw.MIN_PLAYERS}–${Draw.MAX_PLAYERS} гравців</div></div></div>
    <div class="card">
      ${step(1, "Художник обирає слово", "З трьох варіантів. Інші його не бачать")}
      ${step(2, "Малює на піксельному полотні", "Усі бачать малюнок наживо, на своїх телефонах")}
      ${step(3, "Кожен пише відповідь", "Одним словом. Час на відповідь хост налаштовує сам")}
      ${step(4, "Художник роздає бали", "Вгадав — +2, майже — +1. Художнику +1 за кожного, хто вгадав")}
      ${step(5, "Усім показують слово", "І малює наступний. Наприкінці — таблиця переможців")}
    </div>
    <button class="btn mt2" data-a="draw-create">Створити кімнату</button>
    <div class="section-title">Або увійди за кодом</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Увійти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
function viewDrawRoom() {
  const r = S.room;
  const views = { lobby: drawLobby, choose: drawChoose, draw: drawDrawing, guess: drawGuess, judge: drawJudge, reveal: drawReveal, end: drawEnd };
  return `${netBanner()}<div class="fade-in">
    <div class="pxscene ${r.phase === "lobby" ? "big" : "slim"}" style="background-image:url(${Pixel.scene("studio")})"></div>
    ${(views[r.phase] || drawLobby)()}</div>
    ${["lobby", "choose", "reveal", "end"].includes(r.phase) && r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}

const drawerP = () => player(S.room.drawer) || {};
const roundLabel = () => `Раунд ${S.room.turn} з ${S.room.turns}`;
const settingLine = (s) => `✏️ ${s.drawTime} с на малюнок · ⌛ ${s.guessTime} с на відповідь · 🔁 ${s.rounds === 1 ? "1 коло" : s.rounds + " кола"} · 📚 ${Draw.DIFFS[s.words]}`;

function drawLobby() {
  const r = S.room, enough = r.players.filter((p) => p.online).length >= Draw.MIN_PLAYERS;
  return lobbyBento({ kicker: "Малювалка · кімната", title: "Майстерня", max: Draw.MAX_PLAYERS, settings: "draw-settings", rulesLabel: "Правила",
    rules: `<b class="display">🎨 Малювалка</b><div class="small muted mt">${settingLine(r.settings)}</div>
      <div class="small mt">Кожен гравець намалює ${r.settings.rounds === 1 ? "одну картинку" : r.settings.rounds + " картинки"}. Поки малюють, чат закритий — без підказок!</div>`,
    enough, start: "Почати гру 🎬", waitText: `Чекаємо гравців (мінімум ${Draw.MIN_PLAYERS})` });
}

function scoreBoard(opts = {}) {
  const list = S.room.players.slice().sort((a, b) => b.score - a.score);
  const gained = opts.gained || {};
  return `<div class="card scores">${list.map((p, i) => `<div class="sc ${p.id === S.me ? "me" : ""} ${p.online ? "" : "off"}">
      <span class="pl">${i + 1}</span>${av(p, "sm")}<div class="grow nmline"><b>${p.id === S.me ? "Ви" : nm(p)}</b>
      <span class="small muted">${p.drawer ? "✏️ малює" : opts.answered && p.answered ? "✓ відповів(ла)" : ""}</span></div>
      ${gained[p.id] ? `<span class="plus">+${gained[p.id]}</span>` : ""}<span class="pts">${p.score}</span></div>`).join("")}</div>`;
}

function wordTiles(word, hidden) {
  return `<div class="tiles">${[...word].map((ch) => ch === " " ? '<i class="gap"></i>' : `<i>${hidden || ch === "_" ? "" : esc(ch)}</i>`).join("")}</div>`;
}

function board(cls = "") { return `<div class="board-wrap ${cls}"><canvas id="board" width="${Draw.SIZE}" height="${Draw.SIZE}"></canvas></div>`; }

function drawChoose() {
  const r = S.room, d = drawerP();
  if (amDrawer()) {
    return `${gamebar("Твоя черга малювати", roundLabel())}
      <div class="phase-hero"><h2>Обери слово</h2><p class="muted mt">Його побачиш лише ти</p></div>
      <div class="words">${(r.options || []).map((w, i) => `<button class="btn word-btn" data-a="draw-pick" data-v="${i}">${esc(w)}</button>`).join("")}</div>
      <div class="section-title">Рахунок</div>${scoreBoard()}`;
  }
  return `${gamebar(`${esc(d.name)} обирає слово`, roundLabel())}
    <div class="waiting">${av(d, "huge")}<h2 class="mt2">${nm(d)}</h2><p class="muted mt">Зараз малюватиме. Готуйся вгадувати!</p></div>
    <div class="section-title">Рахунок</div>${scoreBoard()}${hostSkip("Далі")}`;
}

function drawTools() {
  const pen = drawPen();
  return `<div class="tools">
    <div class="palette">${Draw.PALETTE.map((c, i) => i === 0 ? "" : `<button class="sw ${pen.c === i && pen.tool !== "eraser" ? "on" : ""}" style="background:${c}" data-a="pen-color" data-v="${i}"></button>`).join("")}</div>
    <div class="toolrow">${DRAW_TOOLS.map(([k, e, t]) => `<button class="tool ${pen.tool === k ? "on" : ""}" data-a="pen-tool" data-v="${k}" title="${t}">${emo(e, 20)}</button>`).join("")}
      ${Draw.BRUSHES.map((w) => `<button class="tool size ${pen.w === w ? "on" : ""}" data-a="pen-size" data-v="${w}"><i style="width:${3 + w * 2}px;height:${3 + w * 2}px"></i></button>`).join("")}
      <button class="tool" data-a="pen-undo" title="Скасувати">${emo("↩️", 20)}</button><button class="tool" data-a="pen-clear" title="Очистити">${emo("🗑️", 20)}</button></div>
  </div>`;
}

function drawDrawing() {
  const r = S.room, d = drawerP();
  if (amDrawer()) {
    return `${gamebar("Малюй!", roundLabel())}
      <div class="secret"><span class="small muted">Твоє слово</span>${wordTiles(r.word)}</div>
      ${board("live")}${drawTools()}
      <button class="btn mt" data-a="draw-done">Готово — хай вгадують</button>`;
  }
  return `${gamebar(`${esc(d.name)} малює`, roundLabel())}
    <div class="secret"><span class="small muted">Загадано слово з ${r.hint.replace(/ /g, "").length} літер</span>${wordTiles(r.hint)}</div>
    ${board()}
    <div class="card center mt small">👀 Дивись уважно — відповідь напишеш, коли час малювання скінчиться</div>
    ${hostSkip("Досить малювати")}`;
}

function drawGuess() {
  const r = S.room;
  const left = r.players.filter((p) => !p.drawer && p.online);
  const done = left.filter((p) => p.answered).length;
  if (amDrawer()) {
    return `${gamebar("Вгадують…", roundLabel())}${board()}
      <div class="card center mt">Твоє слово: <b>${esc(r.word)}</b><div class="muted small mt">Відповіли ${done} з ${left.length}. Потім ти роздаси бали</div></div>
      ${scoreBoard({ answered: true })}${hostSkip("До балів")}`;
  }
  return `${gamebar("Що це?", roundLabel())}${board()}
    ${r.my_guess ? `<div class="card center mt">Твоя відповідь: <b>${esc(r.my_guess)}</b><div class="muted small mt">Відповіли ${done} з ${left.length}. Можна змінити</div></div>` : ""}
    <form class="guess-form mt" id="guess-form"><input class="input" id="guess-input" maxlength="30" placeholder="Одним словом…" autocomplete="off" value="${esc(S.guessDraft || "")}">
      <button class="btn" type="submit">${r.my_guess ? "Змінити" : "Відповісти"}</button></form>
    <div class="section-title">${roundLabel()}</div>${scoreBoard({ answered: true })}${hostSkip("До балів")}`;
}

function drawJudge() {
  const r = S.room, d = drawerP();
  if (amDrawer()) {
    const names = (id) => (player(id) || {}).name || "?";
    return `${gamebar("Роздай бали", roundLabel())}
      <div class="card center">Було загадано: <b>${esc(r.word)}</b><div class="muted small mt">Познач, хто вгадав. Точні відповіді вже зараховано</div></div>
      <div class="answers mt">${(r.answers || []).map((a) => `<div class="ans">
        ${av(player(a.id), "sm")}<div class="grow"><div class="small muted">${esc(names(a.id))}</div><b class="ans-t">${esc(a.text)}</b></div>
        <div class="marks">${[[0, "✗", "повз"], [1, "≈", "майже +1"], [2, "✓", "вгадав +2"]].map(([v, s, t]) =>
          `<button class="mk mk${v} ${a.mark === v ? "on" : ""}" data-a="draw-mark" data-v="${a.id}:${v}" title="${t}">${s}${v ? `<small>+${v}</small>` : ""}</button>`).join("")}</div></div>`).join("")}</div>
      <button class="btn mt2" data-a="draw-award">Роздати бали й показати слово</button>`;
  }
  return `${gamebar(`${esc(d.name)} роздає бали`, roundLabel())}${board()}
    <div class="card center mt">${r.my_guess ? `Твоя відповідь: <b>${esc(r.my_guess)}</b>` : "Ти не встиг(ла) відповісти"}<div class="muted small mt">Художник дивиться відповіді…</div></div>
    ${hostSkip("Показати слово")}`;
}

function drawReveal() {
  const r = S.room, d = drawerP();
  const mark = (v) => (v === 2 ? '<span class="tag2">✓ вгадав</span>' : v === 1 ? '<span class="tag1">≈ майже</span>' : '<span class="tag0">✗ повз</span>');
  return `${gamebar("Це було…", roundLabel())}
    <div class="reveal-word">${wordTiles(r.word)}</div>
    ${board()}
    <div class="small muted center mt">Малював(ла) ${esc(d.name)} · ${r.gained && r.gained[r.drawer] ? `+${r.gained[r.drawer]} за тих, хто вгадав` : "ніхто не вгадав"}</div>
    ${(r.answers || []).length ? `<div class="answers mt">${r.answers.map((a) => `<div class="ans">${av(player(a.id), "sm")}
      <div class="grow"><div class="small muted">${esc((player(a.id) || {}).name || "")}</div><b class="ans-t">${esc(a.text)}</b></div>${mark(a.mark)}</div>`).join("")}</div>` : ""}
    <div class="section-title">Рахунок</div>${scoreBoard({ gained: r.gained })}
    ${hostSkip(r.turn >= r.turns ? "До підсумків" : "Наступний художник")}`;
}

function drawEnd() {
  const r = S.room;
  const list = r.players.slice().sort((a, b) => b.score - a.score);
  const top = list[0] && list[0].score > 0 ? list.filter((p) => p.score === list[0].score) : [];
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  setTimeout(confetti, 50);
  const podium = list.slice(0, 3);
  return `<div class="win mt"><div class="ph-icon">${icon("end", 64)}</div><div class="small kicker">ПІДСУМКИ</div>
      <h2>${top.length ? top.map((p) => esc(p.name)).join(", ") : "Нічия"}</h2>
      <p>${top.length ? `Найкращий художник і відгадувач: ${top[0].score} балів` : "Ніхто не набрав балів"}</p>
      ${rw ? `<div class="reward-coins">${PX() ? Pixel.sprite("coin", 3) : "🪙"} +${rw} монет</div>` : ""}</div>
    <div class="podium">${[1, 0, 2].map((i) => podium[i] ? `<div class="pod p${i + 1}">${av(podium[i], i === 0 ? "big" : "")}<b>${nm(podium[i])}</b>
      <div class="step"><span>${i + 1}</span><small>${podium[i].score}</small></div></div>` : "").join("")}</div>
    <div class="section-title">Таблиця</div>${scoreBoard()}
    <div class="section-title">Що малювали</div>
    <div class="card">${(r.history || []).map((h) => `<div class="story small">${esc((player(h.drawer) || {}).name || "?")}: «${esc(h.word)}» — ${h.of ? `вгадали ${h.right} з ${h.of}` : "ніхто не відповів"}</div>`).join("")}</div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ще партія</button>` : `<div class="card center mt2 muted">Хост може почати нову партію</div>`}
    <button class="btn ghost mt" data-a="leave">Вийти в меню</button>`;
}

function drawSettingsSheet() {
  const s = S.room.settings;
  const opt = (key, list, fmt) => `<div class="chips">${list.map((v) => `<button class="pill ${s[key] === v ? "on" : ""}" data-a="draw-set" data-v="${key}:${v}">${fmt(v)}</button>`).join("")}</div>`;
  return `<h2>⚙️ Налаштування малювалки</h2>
    <div class="section-title">Час на малюнок</div>${opt("drawTime", Draw.DRAW_TIMES, (v) => `${v} с`)}
    <div class="section-title">Час на відповідь</div>${opt("guessTime", Draw.GUESS_TIMES, (v) => `${v} с`)}
    <div class="section-title">Скільки разів малює кожен</div>${opt("rounds", [1, 2, 3], (v) => `${v} ${v === 1 ? "раз" : "рази"}`)}
    <div class="section-title">Слова</div>${opt("words", Object.keys(Draw.DIFFS), (v) => Draw.DIFFS[v])}`;
}

/* ---------------------------------------------------------------- холст: отрисовка и рисование пальцем */
let boardDirty = false;
function scheduleBoard() {
  if (boardDirty) return;
  boardDirty = true;
  requestAnimationFrame(() => { boardDirty = false; paintBoard(); });
}
function paintBoard() {
  const cv = document.getElementById("board");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(Draw.SIZE, Draw.SIZE);
  Draw.paint(S.ink || [], img.data);
  ctx.putImageData(img, 0, 0);
}

let pending = [], flushTimer = null, drawing = false, lastPt = null;
function inkSend(op) { Draw.applyOp(S.ink, op); send({ t: "ink", op }); scheduleBoard(); }
function flushInk() { if (pending.length) { send({ t: "ink", op: { k: "a", p: pending } }); pending = []; } }

function drawMount() {
  const cv = document.getElementById("board");
  if (!cv) return;
  paintBoard();
  if (!S.room || S.room.phase !== "draw" || !amDrawer()) return;
  const at = (e) => {
    const r = cv.getBoundingClientRect();
    return [Math.max(0, Math.min(Draw.SIZE - 1, Math.floor(((e.clientX - r.left) / r.width) * Draw.SIZE))),
      Math.max(0, Math.min(Draw.SIZE - 1, Math.floor(((e.clientY - r.top) / r.height) * Draw.SIZE)))];
  };
  cv.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const pen = drawPen(), [x, y] = at(e);
    if (pen.tool === "fill") { inkSend({ k: "f", c: pen.c, x, y }); haptic(); return; }
    drawing = true; lastPt = [x, y];
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* старый браузер */ }
    inkSend({ k: "s", c: pen.tool === "eraser" ? 0 : pen.c, w: pen.tool === "eraser" ? Math.max(4, pen.w) : pen.w, p: [x, y] });
    clearInterval(flushTimer); flushTimer = setInterval(flushInk, 60);
  });
  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach((ev) => {
      const [x, y] = at(ev);
      if (x === lastPt[0] && y === lastPt[1]) return;
      lastPt = [x, y];
      const last = S.ink[S.ink.length - 1];
      if (last && last.k === "s") last.p.push(x, y);
      pending.push(x, y);
    });
    scheduleBoard();
  });
  const stop = () => { if (!drawing) return; drawing = false; flushInk(); clearInterval(flushTimer); };
  cv.addEventListener("pointerup", stop);
  cv.addEventListener("pointercancel", stop);
  cv.addEventListener("lostpointercapture", stop);
}

/* ---------------------------------------------------------------- данные с хоста */
function drawOnState(room) {
  const key = room.code + ":" + room.turn;
  if (key !== S.inkKey) { S.inkKey = key; S.ink = []; S.guessDraft = ""; }
  if (room.ink) S.ink = JSON.parse(JSON.stringify(room.ink));      // своя копия: у хоста состояние приходит без сети, по ссылке
}
function drawOnInk(m) {
  S.ink = S.ink || [];
  if (m.all) S.ink = JSON.parse(JSON.stringify(m.all)); else Draw.applyOp(S.ink, m.op);
  scheduleBoard();
}
// пока художник рисует, не перерисовываем экран целиком — иначе оборвётся линия под пальцем
const drawKeepScreen = (room, prev) => room.game === "draw" && room.phase === "draw" && room.drawer === S.me && prev && prev.phase === "draw" && prev.turn === room.turn;

function recordDraw(room) {
  const key = "draw:" + room.code + ":" + (room.history || []).length + ":" + room.version;
  const mine = room.players.find((p) => p.id === S.me);
  if (!mine || store.lastDraw === room.code + (room.history || []).length) return;
  store.lastDraw = room.code + (room.history || []).length;
  store.games = (store.games || 0) + 1;
  const best = Math.max(...room.players.map((p) => p.score));
  const won = best > 0 && mine.score === best;
  if (won) store.wins = (store.wins || 0) + 1;
  store.lastGame = key;
  S.reward = { key, sum: Shop.reward(won, true) };
  saveProfile(); syncProfile();
}

const DRAW_ACTIONS = {
  "draw-create": () => {
    haptic("medium");
    S.screen = "connecting"; S.joining = ""; render();
    Net.host({ game: "draw" }).catch((e) => { toast(e.message); S.screen = "draw"; render(); });
  },
  "draw-settings": () => { S.sheet = { type: "draw-settings" }; renderOverlay(); },
  "draw-set": (v) => { const [k, val] = v.split(":"); send({ t: "settings", settings: { [k]: k === "words" ? val : Number(val) } }); },
  "draw-pick": (v) => { send({ t: "act", slot: "pick", target: Number(v) }); haptic("medium"); },
  "draw-done": () => { flushInk(); send({ t: "act", slot: "done" }); haptic("medium"); },
  "draw-mark": (v) => { const [id, val] = v.split(":"); send({ t: "act", slot: "mark", target: id, value: Number(val) }); haptic(); },
  "draw-award": () => { send({ t: "act", slot: "award" }); notify("success"); },
  "pen-color": (v) => { const p = drawPen(); p.c = Number(v); if (p.tool === "eraser") p.tool = "pen"; haptic(); render(); },
  "pen-tool": (v) => { drawPen().tool = v; haptic(); render(); },
  "pen-size": (v) => { drawPen().w = Number(v); haptic(); render(); },
  "pen-undo": () => { inkSend({ k: "u" }); haptic(); },
  "pen-clear": () => {
    const go = () => { inkSend({ k: "x" }); haptic("heavy"); };
    if (tg) tg.showConfirm("Стерти весь малюнок?", (ok) => ok && go()); else if (confirm("Стерти весь малюнок?")) go();
  },
};

document.addEventListener("submit", (e) => {
  if (e.target.id !== "guess-form") return;
  e.preventDefault();
  const input = document.getElementById("guess-input");
  const text = input.value.trim();
  if (!text) return toast("Напиши відповідь");
  S.guessDraft = text;
  send({ t: "act", slot: "guess", text });
  haptic("medium");
});
document.addEventListener("input", (e) => { if (e.target.id === "guess-input") S.guessDraft = e.target.value; });
