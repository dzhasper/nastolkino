/* Одиночные игры. На монеты — блэкджек, «Выше или ниже», напёрстки (у каждой свой дневной лимит, сервер проверяет тоже).
   Просто так — мемори, реакция, тир, змейка (личные рекорды). Колесо фортуны — раз в день. И мини-игры с питомцем. */
"use strict";

const SOLO_GAMES = { bj: { cap: 200, reason: "solo_bj" }, hilo: { cap: 100, reason: "solo_hilo" }, cups: { cap: 100, reason: "solo_cups" }, snake: { cap: 150, reason: "solo_snake" } };
const soloToday = () => new Date().toISOString().slice(0, 10);
const soloGot = (g) => (store.solo2 && store.solo2.day === soloToday() ? store.solo2[g] || 0 : 0);
function soloEarn(g, n) {
  if (!store.solo2 || store.solo2.day !== soloToday()) store.solo2 = { day: soloToday() };
  const add = Math.max(0, Math.min(n, SOLO_GAMES[g].cap - (store.solo2[g] || 0)));
  if (!add) return 0;
  store.solo2[g] = (store.solo2[g] || 0) + add;
  if (Api.on && Api.ready) Api.solo(add, SOLO_GAMES[g].reason); else { store.coins += add; saveProfile(); }
  return add;
}
const soloRnd = (n) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
const soloRec = (k) => (store.rec || {})[k];
function soloSetRec(k, v, lower) {
  store.rec = store.rec || {};
  const old = store.rec[k];
  if (old == null || (lower ? v < old : v > old)) { store.rec[k] = v; saveProfile(); return true; }
  return false;
}
const soloTop = (title, sub, back = "solo") => `<div class="top"><button class="avatar" data-a="go" data-v="${back}">←</button><div class="grow"><h1>${title}</h1>
  <div class="muted small">${sub}</div></div>${coinPill()}</div>`;
const capLine = (g) => `<div class="small muted mt center">Сегодня заработано ${soloGot(g)} из ${SOLO_GAMES[g].cap} 🪙</div>`;

/* ---------------------------------------------------------------- колода */
const SOLO_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function newDeck() {
  const d = [];
  for (const s of "SHDC") for (const r of SOLO_RANKS) d.push(r + s);
  for (let i = d.length - 1; i > 0; i--) { const j = soloRnd(i + 1); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
const rankOf = (c) => c.slice(0, -1);
function handTotal(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { const r = rankOf(c); if (r === "A") { aces++; t += 11; } else t += ["J", "Q", "K"].includes(r) ? 10 : Number(r); }
  while (t > 21 && aces) { t -= 10; aces--; }
  return t;
}

/* ---------------------------------------------------------------- меню */
function viewSolo() {
  const st = Api.on && Api.state, wh = st && st.wheel;
  const tile = (screen, emoji, name, sub, extra = "") => `<button class="solo-tile ${extra}" data-a="go" data-v="${screen}"><span class="st-e">${emoji}</span><b>${name}</b><span class="small muted">${sub}</span></button>`;
  const recTxt = (k, unit, none = "рекорда нет") => (soloRec(k) != null ? `рекорд: ${soloRec(k)}${unit}` : none);
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("solo")})"></div>
    ${soloTop("Одиночные игры", "Против бота, на рекорд и с питомцем", "home")}
    <button class="card wheel-card ${wh && wh.ready ? "ready" : ""}" data-a="go" data-v="solo-wheel"><span class="wc-e">🎡</span><div class="grow"><b>Колесо фортуны</b>
      <div class="small muted">${!Api.on ? "Работает через сервер" : wh && wh.ready ? "Бесплатно раз в день — крути!" : "Уже крутил сегодня — приходи завтра"}</div></div><span class="pill ${wh && wh.ready ? "on" : ""}">${wh && wh.ready ? "Крутить" : "Завтра"}</span></button>
    <div class="section-title">🪙 На монеты</div>
    <div class="solo-grid">
      ${tile("solo-bj", "🃏", "Блэкджек", `победа 5–8 🪙 · ${soloGot("bj")}/${SOLO_GAMES.bj.cap}`)}
      ${tile("solo-hilo", "⬆️", "Выше или ниже", `до 10 🪙 · ${soloGot("hilo")}/${SOLO_GAMES.hilo.cap}`)}
      ${tile("solo-cups", "🥤", "Напёрстки", `3–5 🪙 · ${soloGot("cups")}/${SOLO_GAMES.cups.cap}`)}
      ${tile("solo-snake", "🐍", "Змейка", `съел ÷ 2 🪙 · ${soloGot("snake")}/${SOLO_GAMES.snake.cap}`)}
      ${tile("petfun", "🐾", "С питомцем", "радует питомца", "pet")}
    </div>
    <div class="section-title">🎈 Просто так</div>
    <div class="solo-grid">
      ${tile("solo-memo", "🧠", "Мемори", recTxt("memo", " ходов"))}
      ${tile("solo-react", "⚡", "Реакция", recTxt("react", " мс"))}
      ${tile("solo-shoot", "🎯", "Тир", recTxt("shoot", " очков"))}
    </div>
  </div>${tabs()}`;
}

/* ---------------------------------------------------------------- блэкджек с дилером: победа 5–8 монет, поражение — ничего */
function viewSoloBj() {
  const g = S.sbj || (S.sbj = { deck: newDeck(), player: [], dealer: [], phase: "bet", stats: { w: 0, l: 0, p: 0 } });
  const hide = g.phase === "play";
  const dealer = g.dealer.map((c, i) => cardHtml(hide && i === 1 ? "??" : c, true)).join("");
  const res = g.phase === "done" ? `<div class="sbj-res ${g.result}">${{ win: "Победа!", bj: "Блэкджек!", push: "Ничья", lose: "Дилер выиграл", bust: "Перебор!" }[g.result]}${g.got ? ` +${g.got} 🪙` : g.capped ? " (лимит на сегодня)" : ""}</div>` : "";
  return `<div class="fade-in">
    ${soloTop("Блэкджек", `Счёт: ${g.stats.w} побед · ${g.stats.l} поражений · ${g.stats.p} ничьих`)}
    <div class="sbj-table">
      <div class="sbj-side"><div class="small muted">Дилер${g.dealer.length ? ` · ${hide ? "?" : handTotal(g.dealer)}` : ""}</div><div class="bj-cards">${dealer || '<div class="muted small">—</div>'}</div></div>
      ${res}
      <div class="sbj-side"><div class="small muted">Ты${g.player.length ? ` · ${handTotal(g.player)}` : ""}</div><div class="bj-cards">${g.player.map((c) => cardHtml(c, true)).join("") || '<div class="muted small">—</div>'}</div></div>
    </div>
    ${g.phase === "play" ? `<div class="row mt2"><button class="btn grow" data-a="sbj-hit">Ещё карту</button><button class="btn ghost grow" data-a="sbj-stand">Хватит</button></div>`
      : `<button class="btn mt2" data-a="sbj-deal">${g.phase === "bet" ? "Раздать" : "Ещё раздача"}</button>`}
    <div class="small muted mt center">Дилер берёт до 17. Победа — от 5 до 8 🪙, блэкджек — 8 🪙, поражение — ничего.</div>${capLine("bj")}
  </div>`;
}
function sbjFinish(g, result) {
  g.phase = "done"; g.result = result;
  const reward = result === "bj" ? 8 : result === "win" ? 5 + soloRnd(4) : 0;
  g.got = reward ? soloEarn("bj", reward) : 0; g.capped = reward > 0 && !g.got;
  if (result === "win" || result === "bj") { g.stats.w++; notify("success"); if (g.got) coinRain(); } else if (result === "push") g.stats.p++; else { g.stats.l++; notify("error"); }
  render();
}
const soloDraw = (g) => { if (g.deck.length < 10) g.deck = newDeck(); return g.deck.pop(); };

/* ---------------------------------------------------------------- выше или ниже: максимум 10 монет за серию, 100 в день */
const HILO_PAY = [0, 0, 0, 2, 3, 4, 5, 6, 8, 10];
const hiloVal = (c) => { const r = rankOf(c); return r === "A" ? 14 : r === "K" ? 13 : r === "Q" ? 12 : r === "J" ? 11 : Number(r); };
function viewSoloHilo() {
  const g = S.shilo || (S.shilo = { deck: newDeck(), card: null, streak: 0, phase: "start", best: 0 });
  const pay = HILO_PAY[Math.min(g.streak, HILO_PAY.length - 1)];
  const msg = g.phase === "lost" ? `<div class="sbj-res lose">Мимо! Серия ${g.lostStreak} сгорела</div>` : g.phase === "cashed" ? `<div class="sbj-res win">Забрал${g.got ? ` +${g.got} 🪙` : " (лимит на сегодня)"}</div>`
    : g.last ? `<div class="sbj-res ${g.last === "same" ? "push" : "win"}">${g.last === "same" ? "Такая же — серия сохраняется" : "Угадал!"}</div>` : "";
  return `<div class="fade-in">
    ${soloTop("Выше или ниже", `Лучшая серия: ${g.best}`)}
    <div class="hilo-card">${g.card ? cardHtml(g.card, true) : '<div class="pcard-x back big"><i></i></div>'}</div>
    <div class="hilo-streak">Серия: <b>${g.streak}</b>${g.streak >= 3 ? ` · можно забрать <b>${pay} 🪙</b>` : g.phase === "play" ? ` · монеты с серии 3` : ""}</div>
    ${msg}
    ${g.phase === "play" ? `<div class="row mt2"><button class="btn grow" data-a="hilo-guess" data-v="hi">⬆️ Выше</button><button class="btn grow" data-a="hilo-guess" data-v="lo">⬇️ Ниже</button></div>
      ${g.streak >= 3 ? `<button class="btn ghost mt" data-a="hilo-cash">💰 Забрать ${pay} 🪙</button>` : ""}`
      : `<button class="btn mt2" data-a="hilo-start">${g.phase === "start" ? "Начать" : "Новая серия"}</button>`}
    <div class="small muted mt center">Туз — старшая карта. Серия 3 — 2 🪙, 5 — 4 🪙, 7 — 6 🪙, 9 и больше — 10 🪙.</div>${capLine("hilo")}
  </div>`;
}

/* ---------------------------------------------------------------- напёрстки: следи за шариком */
function viewSoloCups() {
  const g = S.cups || (S.cups = { phase: "start", slot: [0, 1, 2], ball: 1, streak: 0, best: 0 });
  const cup = (i) => `<button class="cup ${g.phase === "show" && i === g.ball ? "up" : ""} ${g.phase === "done" && (i === g.ball || i === g.picked) ? "up" : ""}" id="cup${i}" data-a="cups-pick" data-v="${i}"
      style="left:${4 + g.slot[i] * 33}%" ${g.phase === "pick" ? "" : "disabled"}><span class="cup-body"><i></i></span>${i === g.ball ? '<span class="cup-ball"></span>' : ""}</button>`;
  const msg = g.phase === "done" ? `<div class="sbj-res ${g.win ? "win" : "lose"}">${g.win ? `Нашёл!${g.got ? ` +${g.got} 🪙` : " (лимит на сегодня)"}` : "Мимо! Шарик был тут"}</div>`
    : g.phase === "pick" ? `<div class="hilo-streak">Где шарик?</div>` : g.phase === "shuffle" ? `<div class="hilo-streak">Следи…</div>` : "";
  return `<div class="fade-in">
    ${soloTop("Напёрстки", `Серия: ${g.streak} · лучшая: ${g.best}`)}
    <div class="cups">${[0, 1, 2].map(cup).join("")}</div>
    ${msg}
    ${["start", "done"].includes(g.phase) ? `<button class="btn mt2" data-a="cups-start">${g.phase === "start" ? "Играть" : "Ещё раз"}</button>` : ""}
    <div class="small muted mt center">Чем длиннее серия — тем быстрее крутятся стаканчики. Угадал: 3 🪙, на серии — 4 и 5 🪙.</div>${capLine("cups")}
  </div>`;
}
function cupsShuffle() {
  const g = S.cups, swaps = Math.min(14, 5 + g.streak * 2), speed = Math.max(170, 380 - g.streak * 35);
  let n = 0;
  const step = () => {
    if (S.screen !== "solo-cups" || g.phase !== "shuffle") return;
    if (n++ >= swaps) { g.phase = "pick"; render(); return; }
    const a = soloRnd(3), b = (a + 1 + soloRnd(2)) % 3;
    const ia = g.slot.indexOf(a), ib = g.slot.indexOf(b);
    g.slot[ia] = b; g.slot[ib] = a;
    [ia, ib].forEach((i) => { const el = document.getElementById("cup" + i); if (el) { el.style.transitionDuration = speed * .9 + "ms"; el.style.left = 4 + g.slot[i] * 33 + "%"; } });
    haptic();
    setTimeout(step, speed);
  };
  setTimeout(step, 250);
}

/* ---------------------------------------------------------------- колесо фортуны */
const WHEEL_COLORS = ["#ff5a5f", "#ffb020", "#4fd18b", "#4fa8ff", "#b05cff", "#ff7ac8", "#2ec4b6", "#f4d35e", "#ee6c4d", "#7b8cff", "#9aa4b8", "#c3f73a"];
function viewSoloWheel() {
  const st = Api.on && Api.state, wh = st && st.wheel, w = S.wheel || (S.wheel = { angle: 0, spinning: false, got: null });
  if (!wh) return `<div class="fade-in">${soloTop("Колесо фортуны", "Раз в день — бесплатно")}<div class="card mt">Колесо работает через сервер — открой Настолкино из бота.</div></div>`;
  const n = wh.segs.length, a = 360 / n;
  const grad = wh.segs.map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * a}deg ${(i + 1) * a}deg`).join(", ");
  return `<div class="fade-in">
    ${soloTop("Колесо фортуны", "Раз в день — бесплатно")}
    <div class="wheel-wrap"><div class="wheel-ptr">▼</div>
      <div class="wheel-disc" id="wheel-disc" style="background:conic-gradient(${grad});transform:rotate(${w.angle}deg)">
        ${wh.segs.map((s, i) => `<span class="wheel-lbl" style="--a:${(i + .5) * a}deg">${esc(s)}</span>`).join("")}</div>
      <div class="wheel-hub">🎡</div></div>
    ${w.got ? `<div class="sbj-res win">Выпало: ${esc(w.got)}</div>` : ""}
    <button class="btn mt2" data-a="wheel-spin" ${wh.ready && !w.spinning ? "" : "disabled"}>${w.spinning ? "Крутится…" : wh.ready ? "Крутить!" : "Приходи завтра"}</button>
    <div class="small muted mt center">Монеты, осколки, еда, кейсы, сундук с монетами — и крошечный шанс на яйцо. Одна попытка в день.</div>
  </div>`;
}

/* ---------------------------------------------------------------- мемори: пары питомцев */
function viewSoloMemo() {
  const g = S.memo;
  const done = g && g.cards.every((c) => c.done);
  return `<div class="fade-in">
    ${soloTop("Мемори", `Найди пары питомцев · рекорд: ${soloRec("memo") != null ? soloRec("memo") + " ходов" : "—"}`)}
    ${g ? `<div class="hilo-streak">Ходов: <b>${g.moves}</b></div>
      <div class="memo-grid">${g.cards.map((c, i) => `<button class="memo-card ${c.open || c.done ? "open" : ""} ${c.done ? "done" : ""}" data-a="memo-flip" data-v="${i}">
        ${c.open || c.done ? Pets.sprite(c.code, 56) : "<span>?</span>"}</button>`).join("")}</div>
      ${done ? `<div class="sbj-res win">Все пары за ${g.moves} ходов!${g.rec ? " Новый рекорд 🏆" : ""}</div><button class="btn mt2" data-a="memo-start">Ещё раз</button>` : ""}`
      : `<div class="card center mt">16 карточек, 8 пар питомцев. Открывай по две и запоминай.</div><button class="btn mt2" data-a="memo-start">Играть</button>`}
  </div>`;
}

/* ---------------------------------------------------------------- реакция */
function viewSoloReact() {
  const g = S.react || (S.react = { phase: "idle", times: [] });
  const txt = { idle: "Нажми, чтобы начать", wait: "Жди зелёный…", go: "ЖМИ!", early: "Рано! Нажми, чтобы ещё раз", res: `${g.last} мс — нажми для следующей`, end: `Среднее: ${g.avg} мс${g.rec ? " · рекорд 🏆" : ""}. Ещё?` }[g.phase];
  return `<div class="fade-in">
    ${soloTop("Реакция", `5 попыток · рекорд: ${soloRec("react") != null ? soloRec("react") + " мс" : "—"}`)}
    <button class="react-pad ${g.phase}" data-a="react-tap"><b>${txt}</b>${g.times.length ? `<span class="small">${g.times.map((x) => x + " мс").join(" · ")}</span>` : ""}</button>
  </div>`;
}

/* ---------------------------------------------------------------- тир */
function viewSoloShoot() {
  const g = S.shoot || (S.shoot = { phase: "start", score: 0 });
  return `<div class="fade-in">
    ${soloTop("Тир", `20 секунд · рекорд: ${soloRec("shoot") != null ? soloRec("shoot") : "—"}`)}
    <div class="hilo-streak">Очки: <b id="shoot-score">${g.score}</b> · <span id="shoot-time">${g.phase === "play" ? Math.max(0, Math.ceil((g.end - Date.now()) / 1000)) + " с" : "20 с"}</span></div>
    <div class="shoot-area" id="shoot-area">${g.phase === "play" ? `<button class="shoot-t" id="shoot-t" data-a="shoot-hit" style="left:${g.x}%;top:${g.y}%">🎯</button>` : ""}</div>
    ${g.phase !== "play" ? `${g.phase === "end" ? `<div class="sbj-res win">${g.score} очков${g.rec ? " — новый рекорд 🏆" : ""}</div>` : ""}<button class="btn mt2" data-a="shoot-start">${g.phase === "start" ? "Начать" : "Ещё раз"}</button>` : ""}
  </div>`;
}
function shootMove() {
  const g = S.shoot; g.x = 5 + soloRnd(80); g.y = 5 + soloRnd(78);
  const el = document.getElementById("shoot-t"); if (el) { el.style.left = g.x + "%"; el.style.top = g.y + "%"; el.style.fontSize = Math.max(22, 40 - g.score) + "px"; }
}

/* ---------------------------------------------------------------- змейка */
const SNAKE_N = 15;
function viewSoloSnake() {
  const g = S.snake;
  return `<div class="fade-in">
    ${soloTop("Змейка", `Свайп или кнопки · рекорд: ${soloRec("snake") != null ? soloRec("snake") : "—"} · монеты: съеденное ÷ 2 (сегодня ${soloGot("snake")}/${SOLO_GAMES.snake.cap})`)}
    <div class="hilo-streak">Съедено: <b id="snake-score">${g ? g.score : 0}</b></div>
    <canvas class="snake-cv" id="snake-cv" width="300" height="300"></canvas>
    ${g && g.alive ? `<div class="snake-pad"><button data-a="snake-dir" data-v="0,-1">▲</button><div><button data-a="snake-dir" data-v="-1,0">◀</button><button data-a="snake-dir" data-v="1,0">▶</button></div><button data-a="snake-dir" data-v="0,1">▼</button></div>`
      : `${g ? `<div class="sbj-res ${g.rec || g.coins ? "win" : "lose"}">Съедено: ${g.score}${g.rec ? " — новый рекорд 🏆" : ""}<div class="small">${g.coins ? `+${g.coins} 🪙 (съеденное пополам)` : g.score >= 2 ? "Лимит монет за змейку на сегодня исчерпан" : "Съешь хотя бы 2 — получишь монету"}</div></div>` : ""}<button class="btn mt2" data-a="snake-start">${g ? "Ещё раз" : "Играть"}</button>`}
  </div>`;
}
function snakeDraw() {
  const cv = document.getElementById("snake-cv"), g = S.snake;
  if (!cv) return;
  if (!cv.dataset.bound) {                                       // свайпы
    cv.dataset.bound = 1; let sx = 0, sy = 0;
    cv.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    cv.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) > 18) SOLO_ACTIONS["snake-dir"](Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "1,0" : "-1,0") : (dy > 0 ? "0,1" : "0,-1")); }, { passive: true });
  }
  const x = cv.getContext("2d"), c = 300 / SNAKE_N;
  x.fillStyle = "#141826"; x.fillRect(0, 0, 300, 300);
  x.fillStyle = "#1b2133"; for (let i = 0; i < SNAKE_N; i++) for (let j = 0; j < SNAKE_N; j++) if ((i + j) % 2) x.fillRect(i * c, j * c, c, c);
  if (!g) return;
  x.font = c * .9 + "px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText("🍖", g.food[0] * c + c / 2, g.food[1] * c + c / 2 + 1);
  g.body.forEach(([bx, by], i) => { x.fillStyle = i === 0 ? "#7dff8a" : i % 2 ? "#3ac85a" : "#2fae4a"; x.fillRect(bx * c + 1, by * c + 1, c - 2, c - 2); });
  const [hx, hy] = g.body[0]; x.fillStyle = "#0a1a0e"; x.fillRect(hx * c + c * .3, hy * c + c * .3, 3, 3); x.fillRect(hx * c + c * .62, hy * c + c * .3, 3, 3);
}
function snakeFood(g) { let p; do p = [soloRnd(SNAKE_N), soloRnd(SNAKE_N)]; while (g.body.some(([a, b]) => a === p[0] && b === p[1])); return p; }
function snakeTick() {
  const g = S.snake;
  if (!g || !g.alive || S.screen !== "solo-snake") return;
  g.dir = g.next;
  const h = [g.body[0][0] + g.dir[0], g.body[0][1] + g.dir[1]];
  if (h[0] < 0 || h[1] < 0 || h[0] >= SNAKE_N || h[1] >= SNAKE_N || g.body.some(([a, b]) => a === h[0] && b === h[1])) {
    g.alive = false; g.rec = soloSetRec("snake", g.score); g.coins = soloEarn("snake", Math.floor(g.score / 2));   // монеты: съеденное пополам
    if (g.coins) coinRain(); notify(g.rec || g.coins ? "success" : "error"); render(); setTimeout(snakeDraw, 0); return;
  }
  g.body.unshift(h);
  if (h[0] === g.food[0] && h[1] === g.food[1]) { g.score++; g.food = snakeFood(g); haptic(); const el = document.getElementById("snake-score"); if (el) el.textContent = g.score; } else g.body.pop();
  snakeDraw();
  setTimeout(snakeTick, Math.max(85, 160 - g.score * 4));
}

/* ---------------------------------------------------------------- мини-игры с питомцем */
const FUN_GAMES = { fetch: ["🎾", "Апорт", "Брось мячик точно в зелёную зону — питомец принесёт"], hide: ["📦", "Прятки", "Питомец прячется в коробку — найди его"], bubbles: ["🫧", "Пузыри", "Лопай пузыри вместе с питомцем, пока не кончилось время"] };
function funPets() { return Api.on && Api.state ? Api.state.pets.filter((p) => p.alive && !p.egg && Date.now() / 1000 >= p.hatch) : []; }
function viewPetFun() {
  const pets = funPets(), st = Api.on && Api.state;
  const head = `<div class="pxscene big" style="background-image:url(${Pixel.scene("petfun")})"></div>` + soloTop("Игры с питомцем", "Каждый питомец любит игры по-своему", S.funFrom || "solo");
  if (!Api.on) return `<div class="fade-in">${head}<div class="card mt">Питомцы живут на сервере — открой Настолкино из бота.</div></div>`;
  if (!pets.length) return `<div class="fade-in">${head}<div class="card center mt">Питомцев пока нет — они вылупляются из яиц</div></div>`;
  const p = pets.find((x) => x.id === S.funPet) || pets.find((x) => x.id === st.main_pet) || pets[0];
  S.funPet = p.id;
  if (S.fun && S.fun.pet === p.id && S.fun.phase !== "menu") return viewFunGame(p);
  const t = Pets.traits(p.dna), want = Pets.funWant(p.dna, petStage(p)), left = Math.max(0, want - (p.fun || 0)), asleep = Pets.sleepState(p.dna, petNow()).asleep;
  const stg = petStage(p), mood = (t.social === 0 ? "Любит тишину — не зови слишком часто, иначе разозлится" : t.social === 2 ? "Обожает внимание — готов играть снова и снова" : "Поиграет пару раз, потом устанет")
    + (stg === "b" ? ". Малыш — ему нужно больше внимания" : stg === "t" ? ". Подросток — играет чуть чаще взрослых" : "");
  return `<div class="fade-in">${head}
    ${pets.length > 1 ? `<div class="fun-pets">${pets.map((x) => `<button class="${x.id === p.id ? "on" : ""}" data-a="fun-pet" data-v="${x.id}">${Pets.sprite(petCode(x), 44)}</button>`).join("")}</div>` : ""}
    <div class="pet-stage r${p.rarity} small-stage">${Pets.sprite(petCode(p), 130, { sleep: asleep || p.den })}</div>
    <div class="card center"><b>${esc(t.name)}</b><div class="small">${esc(mood)}</div>
      <div class="small muted mt">${p.den ? "🏠 Спит в домике — разбуди его в карточке" : asleep ? "💤 Спит — поиграете, когда проснётся" : left ? `Хочет поиграть ещё ${left} раз${left === 1 ? "" : "а"} сегодня` : "😮‍💨 На сегодня ему хватит. Позовёшь ещё — настроение испортится"}</div></div>
    <div class="fun-list">${Object.entries(FUN_GAMES).map(([k, [e, n, d]]) => `<button class="card brow" data-a="fun-start" data-v="${k}" ${asleep || p.den ? "disabled" : ""}><span class="st-e">${e}</span><div class="grow"><b>${n}</b><div class="small muted">${d}</div></div><span class="muted">›</span></button>`).join("")}</div>
  </div>`;
}
function viewFunGame(p) {
  const g = S.fun, [e, n] = FUN_GAMES[g.game], spr = (cls = "") => `<span class="fun-pet ${cls}" id="fun-pet">${Pets.sprite(petCode(p), 88)}</span>`;
  const back = `<button class="btn ghost small" data-a="fun-quit">← Другие игры</button>`;
  if (g.phase === "result") {
    const r = g.res || {}, txt = { great: "в восторге! 😍", ok: "доволен 🙂", meh: "так себе… 😐", tired: "устал от внимания 😒" }[r.reaction] || "доволен";
    return `<div class="fade-in">${soloTop(e + " " + n, "Игра окончена", S.funFrom || "solo")}
      <div class="pet-stage r${p.rarity} small-stage">${Pets.sprite(petCode(p), 130)}<div class="pet-fx" id="pet-fx"></div></div>
      <div class="card center"><b>Очки: ${g.score}/10</b><div class="mt">${esc(Pets.traits(p.dna).name)} ${txt}</div>
        ${r.dm != null ? `<div class="small muted">Настроение ${r.dm >= 0 ? "+" : ""}${r.dm}${r.left != null ? ` · хочет ещё ${r.left} раз` : ""}</div>` : ""}</div>
      <button class="btn mt2" data-a="fun-start" data-v="${g.game}">Ещё раз</button>${back}</div>`;
  }
  if (g.game === "fetch") return `<div class="fade-in">${soloTop(e + " " + n, `Бросок ${Math.min(g.round + 1, 5)} из 5 · попаданий: ${g.hits}`, S.funFrom || "solo")}
    <div class="fetch-field">${spr(g.anim || "")}<span class="fetch-ball ${g.anim || ""}">🎾</span></div>
    <div class="fetch-meter"><i class="zone" style="left:${g.z0}%;width:${g.z1 - g.z0}%"></i><b id="fetch-mark"></b></div>
    <button class="btn mt2" data-a="fetch-throw" ${g.busy ? "disabled" : ""}>🎾 Бросить!</button>${back}</div>`;
  if (g.game === "hide") return `<div class="fade-in">${soloTop(e + " " + n, `Раунд ${Math.min(g.round + 1, 5)} из 5 · нашёл: ${g.found}`, S.funFrom || "solo")}
    <div class="hide-row">${Array.from({ length: g.n }, (_, i) => `<button class="hide-box ${g.open === i ? "open" : ""}" data-a="hide-pick" data-v="${i}" ${g.busy ? "disabled" : ""}>
      ${g.open != null && i === g.at ? Pets.sprite(petCode(p), 56) : "📦"}</button>`).join("")}</div>
    <div class="hilo-streak">${g.busy && g.open == null ? "Закрой глаза… он прячется" : g.open == null ? "В какой коробке?" : g.open === g.at ? "Нашёл! 🎉" : "Пусто…"}</div>${back}</div>`;
  return `<div class="fade-in">${soloTop(e + " " + n, `Лопнуто: <span id="bub-n">${g.pops}</span> · <span id="bub-t">${Math.max(0, Math.ceil((g.end - Date.now()) / 1000))}</span> с`, S.funFrom || "solo")}
    <div class="bub-area" id="bub-area">${spr("bub-pet")}</div>${back}</div>`;
}
function funFinish(score) {
  const g = S.fun; g.score = Math.max(0, Math.min(10, Math.round(score))); g.phase = "result"; g.res = null;
  render();
  if (!Api.on) return;
  Api.act("/api/pet/minigame", { pet: g.pet, game: g.game, score: g.score }).then((st) => { g.res = st.fun; if (S.screen === "petfun") { render(); setTimeout(() => petFx(st.fun.reaction === "tired" ? "💢" : "❤"), 60); } })
    .catch((e) => { toast(e.message); });
}
function fetchLoop() {
  const g = S.fun;
  if (!g || g.game !== "fetch" || g.phase !== "play" || S.screen !== "petfun") return;
  const el = document.getElementById("fetch-mark");
  if (el && !g.busy) el.style.left = fetchPos() + "%";
  requestAnimationFrame(fetchLoop);
}
const fetchPos = () => { const g = S.fun; return 50 + 48 * Math.sin((performance.now() - g.t0) / (520 - g.round * 50)); };
function bubSpawn() {
  const g = S.fun;
  if (!g || g.game !== "bubbles" || g.phase !== "play" || S.screen !== "petfun") return;
  const left = Math.ceil((g.end - Date.now()) / 1000), tEl = document.getElementById("bub-t");
  if (tEl) tEl.textContent = Math.max(0, left);
  if (Date.now() >= g.end) return funFinish(g.pops / 2);
  const area = document.getElementById("bub-area");
  if (area) {
    const b = document.createElement("button");
    b.className = "bubble"; b.textContent = "🫧"; b.style.left = 4 + soloRnd(84) + "%"; b.style.animationDuration = 2.4 + soloRnd(12) / 10 + "s";
    b.onclick = () => { if (b.classList.contains("pop")) return; b.classList.add("pop"); g.pops++; haptic(); const n = document.getElementById("bub-n"); if (n) n.textContent = g.pops;
      const pet = document.getElementById("fun-pet"); if (pet) { pet.classList.remove("jump"); void pet.offsetWidth; pet.classList.add("jump"); } setTimeout(() => b.remove(), 250); };
    area.appendChild(b); setTimeout(() => b.remove(), 4000);
  }
  setTimeout(bubSpawn, 430);
}
function hideRound() {
  const g = S.fun; g.open = null; g.busy = true; g.at = soloRnd(g.n); render();
  setTimeout(() => { if (S.fun === g) { g.busy = false; render(); } }, 1100);
}

const SOLO_ACTIONS = {
  "sbj-deal": () => {
    const g = S.sbj; g.player = [soloDraw(g), soloDraw(g)]; g.dealer = [soloDraw(g), soloDraw(g)]; g.phase = "play"; g.got = 0; haptic("medium");
    const p = handTotal(g.player), d = handTotal(g.dealer);
    if (p === 21 || d === 21) return sbjFinish(g, p === 21 && d === 21 ? "push" : p === 21 ? "bj" : "lose");
    render();
  },
  "sbj-hit": () => { const g = S.sbj; g.player.push(soloDraw(g)); haptic(); if (handTotal(g.player) > 21) return sbjFinish(g, "bust"); if (handTotal(g.player) === 21) return SOLO_ACTIONS["sbj-stand"](); render(); },
  "sbj-stand": () => {
    const g = S.sbj;
    while (handTotal(g.dealer) < 17) g.dealer.push(soloDraw(g));
    const p = handTotal(g.player), d = handTotal(g.dealer);
    sbjFinish(g, d > 21 || p > d ? "win" : p === d ? "push" : "lose");
  },
  "hilo-start": () => { const g = S.shilo; if (g.deck.length < 10) g.deck = newDeck(); g.card = g.deck.pop(); g.streak = 0; g.phase = "play"; g.last = null; haptic(); render(); },
  "hilo-guess": (v) => {
    const g = S.shilo; if (g.deck.length < 2) g.deck = newDeck();
    const next = g.deck.pop(), a = hiloVal(g.card), b = hiloVal(next);
    g.card = next;
    if (a === b) { g.last = "same"; haptic(); }
    else if ((v === "hi") === (b > a)) { g.streak++; g.best = Math.max(g.best, g.streak); g.last = "ok"; haptic("medium"); if (g.streak >= 12) return SOLO_ACTIONS["hilo-cash"](); }
    else { g.lostStreak = g.streak; g.streak = 0; g.phase = "lost"; notify("error"); }
    render();
  },
  "hilo-cash": () => { const g = S.shilo; const pay = HILO_PAY[Math.min(g.streak, HILO_PAY.length - 1)]; g.got = soloEarn("hilo", pay); g.phase = "cashed"; g.streak = 0; if (g.got) { notify("success"); coinRain(); } render(); },
  "cups-start": () => {
    const g = S.cups; g.ball = soloRnd(3); g.phase = "show"; g.picked = null; render(); haptic("medium");
    setTimeout(() => { if (S.cups === g && g.phase === "show") { g.phase = "shuffle"; render(); cupsShuffle(); } }, 1100);
  },
  "cups-pick": (v) => {
    const g = S.cups; if (g.phase !== "pick") return;
    g.picked = Number(v); g.win = g.picked === g.ball; g.phase = "done";
    if (g.win) { g.streak++; g.best = Math.max(g.best, g.streak); g.got = soloEarn("cups", 2 + Math.min(3, g.streak)); notify("success"); if (g.got) coinRain(); }
    else { g.streak = 0; g.got = 0; notify("error"); }
    render();
  },
  "wheel-spin": () => {
    const w = S.wheel, wh = Api.state && Api.state.wheel; if (!wh || !wh.ready || w.spinning) return;
    w.spinning = true; w.got = null; render(); haptic("heavy");
    Api.act("/api/wheel", {}).then((st) => {
      const n = wh.segs.length, a = 360 / n, target = 360 * 6 + (360 - (st.spin.i + .5) * a) + (soloRnd(Math.floor(a * .6)) - a * .3);
      w.angle = w.angle - (w.angle % 360) + target;
      const disc = document.getElementById("wheel-disc"); if (disc) disc.style.transform = `rotate(${w.angle}deg)`;
      setTimeout(() => { w.spinning = false; w.got = st.spin.got; notify("success"); coinRain(); if (S.screen === "solo-wheel") render(); }, 4300);
    }).catch((e) => { w.spinning = false; toast(e.message); render(); });
  },
  "memo-start": () => {
    const codes = Array.from({ length: 8 }, (_, i) => String(Math.min(4, i % 5)) + Array.from({ length: 16 }, () => soloRnd(256).toString(16).padStart(2, "0")).join(""));
    const cards = codes.concat(codes).map((code) => ({ code, open: false, done: false }));
    for (let i = cards.length - 1; i > 0; i--) { const j = soloRnd(i + 1); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    S.memo = { cards, moves: 0, lock: false }; render();
  },
  "memo-flip": (v) => {
    const g = S.memo, c = g && g.cards[Number(v)];
    if (!c || g.lock || c.open || c.done) return;
    c.open = true; haptic();
    const open = g.cards.filter((x) => x.open && !x.done);
    if (open.length === 2) {
      g.moves++; g.lock = true;
      setTimeout(() => {
        if (open[0].code === open[1].code) { open.forEach((x) => { x.done = true; }); notify("success"); } else open.forEach((x) => { x.open = false; });
        g.lock = false;
        if (g.cards.every((x) => x.done)) g.rec = soloSetRec("memo", g.moves, true);
        if (S.screen === "solo-memo") render();
      }, open[0].code === open[1].code ? 250 : 700);
    }
    render();
  },
  "react-tap": () => {
    const g = S.react;
    if (g.phase === "wait") { clearTimeout(g.timer); g.phase = "early"; notify("error"); return render(); }
    if (g.phase === "go") {
      g.last = Math.round(performance.now() - g.t0); g.times.push(g.last); haptic("medium");
      if (g.times.length >= 5) { g.avg = Math.round(g.times.reduce((a, b) => a + b, 0) / g.times.length); g.rec = soloSetRec("react", g.avg, true); g.phase = "end"; } else g.phase = "res";
      return render();
    }
    if (g.phase === "end" || g.phase === "idle") g.times = [];
    g.phase = "wait"; render();
    g.timer = setTimeout(() => { if (S.react === g && g.phase === "wait") { g.phase = "go"; g.t0 = performance.now(); render(); haptic("heavy"); } }, 1200 + soloRnd(2300));
  },
  "shoot-start": () => {
    const g = S.shoot; g.phase = "play"; g.score = 0; g.end = Date.now() + 20000; g.x = 45; g.y = 40; render();
    const tick = () => {
      if (S.shoot !== g || g.phase !== "play") return;
      const left = Math.ceil((g.end - Date.now()) / 1000), el = document.getElementById("shoot-time");
      if (el) el.textContent = Math.max(0, left) + " с";
      if (Date.now() >= g.end) { g.phase = "end"; g.rec = soloSetRec("shoot", g.score); notify("success"); if (S.screen === "solo-shoot") render(); return; }
      setTimeout(tick, 200);
    };
    tick();
  },
  "shoot-hit": () => { const g = S.shoot; if (g.phase !== "play") return; g.score++; haptic(); const el = document.getElementById("shoot-score"); if (el) el.textContent = g.score; shootMove(); },
  "snake-start": () => { const g = S.snake = { body: [[7, 7], [6, 7], [5, 7]], dir: [1, 0], next: [1, 0], alive: true, score: 0 }; g.food = snakeFood(g); render(); setTimeout(() => { snakeDraw(); setTimeout(snakeTick, 300); }, 0); },
  "snake-dir": (v) => { const g = S.snake; if (!g || !g.alive) return; const [x, y] = v.split(",").map(Number); if (x === -g.dir[0] && y === -g.dir[1]) return; g.next = [x, y]; },
  "fun-pet": (v) => { S.funPet = Number(v); S.fun = null; haptic(); render(); },
  "fun-quit": () => { S.fun = null; render(); },
  "fun-start": (k) => {
    const p = funPets().find((x) => x.id === S.funPet); if (!p) return;
    haptic("medium");
    if (k === "fetch") { S.fun = { pet: p.id, game: k, phase: "play", round: 0, hits: 0, z0: 38, z1: 62, t0: performance.now() }; render(); requestAnimationFrame(fetchLoop); }
    if (k === "hide") { const t = Pets.traits(p.dna); S.fun = { pet: p.id, game: k, phase: "play", round: 0, found: 0, n: t.hobbyIdx === 7 ? 5 : 3 + (t.social === 0 ? 1 : 0) }; hideRound(); }
    if (k === "bubbles") { S.fun = { pet: p.id, game: k, phase: "play", pops: 0, end: Date.now() + 15000 }; render(); setTimeout(bubSpawn, 300); }
  },
  "fetch-throw": () => {
    const g = S.fun; if (!g || g.busy) return;
    const pos = fetchPos(), hit = pos >= g.z0 && pos <= g.z1;
    g.busy = true; g.anim = hit ? "run" : "miss"; if (hit) g.hits++; render(); haptic(hit ? "medium" : "light");
    setTimeout(() => {
      if (S.fun !== g) return;
      g.round++; g.busy = false; g.anim = ""; const shrink = g.round * 2.5; g.z0 = 38 + shrink; g.z1 = 62 - shrink; g.t0 = performance.now();
      if (g.round >= 5) return funFinish(g.hits * 2);
      render(); requestAnimationFrame(fetchLoop);
    }, 1300);
  },
  "hide-pick": (v) => {
    const g = S.fun; if (!g || g.busy || g.open != null) return;
    g.open = Number(v); if (g.open === g.at) { g.found++; notify("success"); } else haptic();
    g.busy = true; render();
    setTimeout(() => { if (S.fun !== g) return; g.round++; if (g.round >= 5) return funFinish(g.found * 2); hideRound(); }, 1100);
  },
};
