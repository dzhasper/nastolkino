/* Одиночные игры против бота: немного монет каждый день (лимит — 200 в день, на сервере тоже). */
"use strict";

const SOLO_CAP = 200;
const soloToday = () => new Date().toISOString().slice(0, 10);
const soloGot = () => (store.soloDay === soloToday() ? store.soloGot || 0 : 0);
function soloEarn(n) {
  if (store.soloDay !== soloToday()) { store.soloDay = soloToday(); store.soloGot = 0; }
  const add = Math.max(0, Math.min(n, SOLO_CAP - store.soloGot));
  if (!add) return 0;
  store.soloGot += add;
  if (Api.on && Api.ready) Api.solo(add); else { store.coins += add; saveProfile(); }
  return add;
}

/* ---------------------------------------------------------------- колода */
const SOLO_RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
function newDeck() {
  const d = [];
  for (const s of "SHDC") for (const r of SOLO_RANKS) d.push(r + s);
  for (let i = d.length - 1; i > 0; i--) { const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1); [d[i], d[j]] = [d[j], d[i]]; }
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
  const got = soloGot();
  return `<div class="fade-in">
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Одиночные игры</h1>
      <div class="muted small">Против бота · немного монет каждый день</div></div>${coinPill()}</div>
    <div class="card solo-cap"><div class="pstat"><span>🪙 Заработано сегодня</span><b>${got} / ${SOLO_CAP}</b></div>${bar(got / SOLO_CAP * 100, "mood")}
      ${got >= SOLO_CAP ? `<div class="small muted mt">На сегодня всё — играть можно дальше, но уже на интерес. Завтра лимит обновится.</div>` : ""}</div>
    <button class="game-hero solo-hero mt2" data-a="go" data-v="solo-bj" ${PX() ? `style="background-image:url(${Pixel.scene("casino")})"` : ""}>
      <div class="pill" style="background:rgba(10,60,30,.7)">🃏 против дилера</div><h2 class="mt">Блэкджек с дилером</h2>
      <p>Набери больше дилера, но не больше 21. Победа +3 🪙, блэкджек +5 🪙</p><span class="btn">Играть ▶</span></button>
    <button class="game-hero solo-hero mt2" data-a="go" data-v="solo-hilo" ${PX() ? `style="background-image:url(${Pixel.scene("arcade")})"` : ""}>
      <div class="pill" style="background:rgba(60,20,80,.7)">⬆️⬇️ серия угадываний</div><h2 class="mt">Выше или ниже</h2>
      <p>Угадай, будет следующая карта выше или ниже. Чем длиннее серия — тем больше монет. Ошибся — серия сгорает</p><span class="btn">Играть ▶</span></button>
  </div>${tabs()}`;
}

/* ---------------------------------------------------------------- блэкджек с дилером */
function viewSoloBj() {
  const g = S.sbj || (S.sbj = { deck: newDeck(), player: [], dealer: [], phase: "bet", stats: { w: 0, l: 0, p: 0 } });
  const hide = g.phase === "play";
  const dealer = g.dealer.map((c, i) => cardHtml(hide && i === 1 ? "??" : c, true)).join("");
  const res = g.phase === "done" ? `<div class="sbj-res ${g.result}">${{ win: "Победа!", bj: "Блэкджек!", push: "Ничья", lose: "Дилер выиграл", bust: "Перебор!" }[g.result]}${g.got ? ` +${g.got} 🪙` : g.capped ? " (лимит на сегодня)" : ""}</div>` : "";
  return `<div class="fade-in">
    <div class="top"><button class="avatar" data-a="go" data-v="solo">←</button><div class="grow"><h1>Блэкджек</h1>
      <div class="muted small">Счёт: ${g.stats.w} побед · ${g.stats.l} поражений · ${g.stats.p} ничьих</div></div>${coinPill()}</div>
    <div class="sbj-table">
      <div class="sbj-side"><div class="small muted">Дилер${g.dealer.length ? ` · ${hide ? "?" : handTotal(g.dealer)}` : ""}</div><div class="bj-cards">${dealer || '<div class="muted small">—</div>'}</div></div>
      ${res}
      <div class="sbj-side"><div class="small muted">Ты${g.player.length ? ` · ${handTotal(g.player)}` : ""}</div><div class="bj-cards">${g.player.map((c) => cardHtml(c, true)).join("") || '<div class="muted small">—</div>'}</div></div>
    </div>
    ${g.phase === "play" ? `<div class="row mt2"><button class="btn grow" data-a="sbj-hit">Ещё карту</button><button class="btn ghost grow" data-a="sbj-stand">Хватит</button></div>`
      : `<button class="btn mt2" data-a="sbj-deal">${g.phase === "bet" ? "Раздать" : "Ещё раздача"}</button>`}
    <div class="small muted mt center">Дилер берёт карты до 17. Сегодня заработано ${soloGot()} из ${SOLO_CAP} 🪙</div>
  </div>`;
}
function sbjFinish(g, result) {
  g.phase = "done"; g.result = result;
  const reward = result === "bj" ? 5 : result === "win" ? 3 : 0;
  g.got = reward ? soloEarn(reward) : 0; g.capped = reward > 0 && !g.got;
  if (result === "win" || result === "bj") { g.stats.w++; notify("success"); } else if (result === "push") g.stats.p++; else { g.stats.l++; notify("error"); }
  render();
}
const soloDraw = (g) => { if (g.deck.length < 10) g.deck = newDeck(); return g.deck.pop(); };

/* ---------------------------------------------------------------- выше или ниже */
const HILO_PAY = [0, 0, 0, 2, 3, 5, 7, 10, 13, 15];
const hiloVal = (c) => { const r = rankOf(c); return r === "A" ? 14 : r === "K" ? 13 : r === "Q" ? 12 : r === "J" ? 11 : Number(r); };
function viewSoloHilo() {
  const g = S.shilo || (S.shilo = { deck: newDeck(), card: null, streak: 0, phase: "start", best: 0 });
  const pay = HILO_PAY[Math.min(g.streak, HILO_PAY.length - 1)];
  const msg = g.phase === "lost" ? `<div class="sbj-res lose">Мимо! Серия ${g.lostStreak} сгорела</div>` : g.phase === "cashed" ? `<div class="sbj-res win">Забрал${g.got ? ` +${g.got} 🪙` : " (лимит на сегодня)"}</div>`
    : g.last ? `<div class="sbj-res ${g.last === "same" ? "push" : "win"}">${g.last === "same" ? "Такая же — серия сохраняется" : "Угадал!"}</div>` : "";
  return `<div class="fade-in">
    <div class="top"><button class="avatar" data-a="go" data-v="solo">←</button><div class="grow"><h1>Выше или ниже</h1>
      <div class="muted small">Лучшая серия: ${g.best}</div></div>${coinPill()}</div>
    <div class="hilo-card">${g.card ? cardHtml(g.card, true) : '<div class="pcard-x back big"><i></i></div>'}</div>
    <div class="hilo-streak">Серия: <b>${g.streak}</b>${g.streak >= 3 ? ` · можно забрать <b>${pay} 🪙</b>` : g.phase === "play" ? ` · монеты с серии 3` : ""}</div>
    ${msg}
    ${g.phase === "play" ? `<div class="row mt2"><button class="btn grow" data-a="hilo-guess" data-v="hi">⬆️ Выше</button><button class="btn grow" data-a="hilo-guess" data-v="lo">⬇️ Ниже</button></div>
      ${g.streak >= 3 ? `<button class="btn ghost mt" data-a="hilo-cash">💰 Забрать ${pay} 🪙</button>` : ""}`
      : `<button class="btn mt2" data-a="hilo-start">${g.phase === "start" ? "Начать" : "Новая серия"}</button>`}
    <div class="small muted mt center">Туз — старшая карта. Серия 3 — 2 🪙, 5 — 5 🪙, 7 — 10 🪙, 9+ — 15 🪙. Сегодня ${soloGot()} из ${SOLO_CAP} 🪙</div>
  </div>`;
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
  "hilo-cash": () => { const g = S.shilo; const pay = HILO_PAY[Math.min(g.streak, HILO_PAY.length - 1)]; g.got = soloEarn(pay); g.phase = "cashed"; g.streak = 0; if (g.got) { notify("success"); coinRain(); } render(); },
};
