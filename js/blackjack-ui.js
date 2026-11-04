/* Блэкджек: экраны, монеты, проверка честной раздачи. Общие S, send, av, esc и т. п. — из app.js. */
"use strict";

const SUIT = { S: "♠", H: "♥", D: "♦", C: "♣" };
const plural = (n, one, few, many) => (n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many);
const bjMe = () => (S.room ? S.room.players.find((p) => p.id === S.me) : null);
const chip = (n) => `<span class="bj-chip">🪙 ${n}</span>`;
function cardHtml(c, big) {
  if (c === "??") return `<div class="pcard-x back ${big ? "big" : ""}"><i></i></div>`;
  const r = c.slice(0, -1), s = c.slice(-1), red = s === "H" || s === "D";
  return `<div class="pcard-x ${red ? "red" : ""} ${big ? "big" : ""}"><b>${r}</b><span>${SUIT[s]}</span><em>${SUIT[s]}</em></div>`;
}

/* ---------------------------------------------------------------- меню */
function viewBlackjackMenu() {
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("casino")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Блекджек</h1>
      <div class="muted small">Гравці проти гравців · ${Blackjack.MIN_PLAYERS}–${Blackjack.MAX_PLAYERS} за столом</div></div>${coinPill()}</div>
    <div class="card bj-rules">
      <p>Кожен отримує дві карти: <b>перша закрита</b> від суперників, решта відкриті. Ходимо <b>по колу, по одній дії</b>: <b>«Ще»</b> — узяти карту, <b>«Пас»</b> — не брати, <b>«Подвоїти»</b> (лише першим ходом) — подвоїти ставку й узяти рівно одну карту. <b>Карти відкриваються, коли всі гравці підряд сказали «Пас»</b>; хтось узяв карту — пасуємо заново.</p>
      <p>Більше 21 — перебір, але про нього знаєш лише ти: тисни «Пас», як усі. <b>Найближчий до 21 забирає банк</b>. Блекджек (туз + десятка з перших двох карт) сильніший за будь-які інші 21. Нічия — банк ділиться. Усі перебрали — ставки повертаються.</p>
      <p>Хост обирає: <b>на інтерес</b> або <b>на монети</b>. На монетах ставлять усі однаково.</p>
    </div>
    <div class="card bj-fair">🔒 <b>Чесна роздача.</b> Перед кожною роздачею нова колода з 52 карт. Хост заздалегідь «запечатує» її відбитком (SHA-256), кожен телефон додає свою випадковість, а після розкриття твій телефон сам перевіряє, що жодну карту не підмінили.</div>
    <button class="btn mt2" data-a="bj-create">Сісти за стіл</button>
    <div class="section-title">Або увійди за кодом</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Увійти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
function viewBlackjackRoom() {
  const r = S.room;
  bjCoins(r);
  const fade = S.bjFade !== r.code + r.phase + r.handNo; S.bjFade = r.code + r.phase + r.handNo;
  const views = { lobby: bjLobby, bet: bjTable, play: bjTable, show: bjTable, wait: bjTable, end: bjEnd };
  return `${netBanner()}<div class="${fade ? "fade-in" : ""}">${(views[r.phase] || bjLobby)()}</div>
    ${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}

function bjLobby() {
  const r = S.room, s = r.settings, enough = r.players.filter((p) => p.online).length >= Blackjack.MIN_PLAYERS;
  return lobbyBento({ kicker: "Блекджек", title: "Стіл", codeLabel: "Код столу", countLabel: "Місць", seats: "За столом", max: Blackjack.MAX_PLAYERS, right: coinPill(),
    settings: "bj-settings", scene: "casino", rulesLabel: "Ставки",
    rules: s.stake ? `🪙 <b>На монети: ${s.stake} з кожного за роздачу</b><div class="small">Банк роздачі забирає найкращий. Треба мати хоча б ${s.stake} монет.</div>` : `🎲 <b>На інтерес</b><div class="small">Без монет — просто хто кого.</div>`,
    enough, start: "Роздати карти", waitText: `Чекаємо гравців (мінімум ${Blackjack.MIN_PLAYERS})`, hostWait: "Чекаємо, коли хост почне роздачу…" });
}

function bjSeat(p) {
  const r = S.room, win = r.results && r.results.winners.includes(p.id), turn = r.turn === p.id;
  const tag = p.blackjack ? "БЛЕКДЖЕК" : p.bust ? "ПЕРЕБІР" : p.folded ? "СКИДАННЯ" : p.doubled ? "×2" : r.phase === "play" && p.stood ? "ПАС" : "";
  const pay = r.phase === "show" && r.results ? r.results.payout[p.id] : null;
  return `<div class="bj-seat ${turn ? "turn" : ""} ${win ? "win" : ""} ${p.bust ? "bust" : ""} ${p.id === S.me ? "me" : ""}">
    <div class="bj-who">${av(p, "sm")}<div class="grow"><b>${p.id === S.me ? "Ви" : nm(p)}</b>
      <div class="small muted">${p.score != null ? `${p.score} оч.` : p.cards ? `${p.cards.length} карт` : ""}${p.net ? ` · <span class="${p.net > 0 ? "plus" : "minus"}">${p.net > 0 ? "+" : ""}${p.net}</span>` : ""}</div></div>
      ${tag ? `<span class="bj-tag ${p.bust ? "bad" : p.blackjack ? "gold" : ""}">${tag}</span>` : ""}${pay ? `<span class="bj-pay">+${pay}</span>` : ""}</div>
    <div class="bj-cards">${(p.cards || []).map((c) => cardHtml(c)).join("")}</div></div>`;
}

function bjTable() {
  const r = S.room, me = bjMe() || {}, s = r.settings;
  const timer = r.deadline ? `<span class="bj-timer" id="timer" data-total="${r.total}"><span id="timer-num">${fmtTime(remaining())}</span></span>` : "";
  const turnP = r.players.find((p) => p.id === r.turn);
  let actions = "";
  if (r.phase === "bet") {
    const can = !s.stake || (S.profile.coins || 0) >= s.stake;
    actions = r.my_joined === undefined
      ? `<div class="card center"><b>Роздача №${r.handNo}</b>${s.stake ? ` · ставка ${chip(s.stake)}` : " · на інтерес"}<div class="small muted mt">${can ? "Граєш цю роздачу?" : `Бракує монет: у тебе ${S.profile.coins}`}</div></div>
         <div class="row mt bj-act"><button class="btn grow" data-a="bj-bet" data-v="1" ${can ? "" : "disabled"}>Граю${s.stake ? ` · ${s.stake}` : ""}</button><button class="btn ghost grow" data-a="bj-bet" data-v="0">Пропускаю</button></div>`
      : `<div class="card center">${r.my_joined ? "✓ Ти в роздачі. Чекаємо решту…" : "Ти пропускаєш цю роздачу"}</div>`;
  } else if (r.phase === "play") {
    const mine = r.turn === S.me, myp = r.players.find((p) => p.id === S.me);
    if (mine) {
      const canDouble = myp.cards.length === 2 && (!s.stake || (S.profile.coins || 0) >= s.stake);
      actions = `<div class="your-turn bj">ТВІЙ ХІД · ${myp.score} оч.${myp.bust ? " · перебір" : ""}</div>${myp.bust ? `<div class="small muted center">Про перебір знаєш лише ти — тисни «Пас»</div>` : ""}
        <div class="bj-act3"><button class="btn" data-a="bj-act" data-v="hit" ${myp.bust ? "disabled" : ""}>Ще</button><button class="btn ghost" data-a="bj-act" data-v="stand">Пас</button>
        <button class="btn gold" data-a="bj-act" data-v="double" ${canDouble ? "" : "disabled"}>Подвоїти${s.stake ? ` · ${s.stake}` : ""}</button></div>`;
    } else actions = `<div class="card center">Ходить <b>${esc(turnP ? turnP.name : "")}</b>${myp && myp.playing ? `<div class="small muted mt">У тебе ${myp.score} оч.${myp.bust ? " · перебір" : ""}</div>` : ""}</div>`;
    actions += `<div class="small muted center mt bj-passes">Пас поспіль: <b>${r.passes || 0}</b> з ${r.need || 0} · карти відкриються, коли всі підряд скажуть «Пас». Узяв карту — рахунок пасів з нуля</div>`;
  } else if (r.phase === "show") {
    const res = r.results, v = bjVerify(r);
    actions = `<div class="card center bj-result">${res.winners.length ? `🏆 <b>${res.winners.map((id) => esc((r.players.find((p) => p.id === id) || {}).name || "?")).join(", ")}</b> ${res.winners.length > 1 ? "ділять" : "забирає"} банк${r.pot ? ` ${chip(r.pot)}` : ""}` : "Усі перебрали — ставки повернулися"}
      ${res.payout[S.me] ? `<div class="bj-myp">Тобі +${res.payout[S.me]}</div>` : ""}</div>
      <div class="card bj-check ${v.ok ? "ok" : "bad"}">${v.ok ? "✅ Роздача чесна — твій телефон перевірив відбиток колоди й кожну карту" : `⚠️ Роздача не сходиться: ${esc(v.why)}`}
        <details><summary>Докладніше</summary><div class="tiny">Відбиток: ${r.reveal.commit}<br>Секрет хоста: ${r.reveal.serverSeed}<br>Випадковості гравців: ${Object.entries(r.reveal.seeds).map(([k, x]) => `${esc((r.players.find((p) => p.id === k) || {}).name || k)}: ${x}`).join("<br>")}</div></details></div>
      ${isHost() ? `<div class="row mt"><button class="btn small grow" data-a="skip">Наступна роздача</button><button class="btn ghost small grow" data-a="bj-finish">Завершити гру</button></div>` : `<div class="small muted center mt">Наступна роздача скоро…</div>`}`;
  } else if (r.phase === "wait") {
    actions = `<div class="card center">Замало гравців для роздачі</div>${isHost() ? `<div class="row mt"><button class="btn small grow" data-a="skip">Нова роздача</button><button class="btn ghost small grow" data-a="bj-finish">Завершити гру</button></div>` : ""}`;
  }
  const playing = r.players.filter((p) => p.playing), idle = r.players.filter((p) => !p.playing);
  return `<div class="bj-head"><div class="grow"><b>Роздача №${r.handNo}</b><div class="small">${s.stake ? `Ставка ${s.stake} · у тебе 🪙 ${S.profile.coins}` : "На інтерес"}</div></div>
      ${r.pot ? `<div class="bj-pot">БАНК<br>${chip(r.pot)}</div>` : ""}${timer}</div>
    <div class="bj-felt">
      ${r.phase === "bet" ? `<div class="bj-seal">🔒 Колоду запечатано<br><code>${(r.commit || "").slice(0, 12)}…${(r.commit || "").slice(-6)}</code><div class="small">${r.players.filter((p) => p.joined).length} у роздачі</div></div>` : ""}
      ${playing.map(bjSeat).join("")}
      ${r.phase !== "bet" && !playing.length ? `<div class="center muted">Карти ще не роздані</div>` : ""}
    </div>
    ${actions}
    ${idle.length && r.phase !== "bet" ? `<div class="small muted mt">Не грають цю роздачу: ${idle.map((p) => esc(p.name)).join(", ")}</div>` : ""}
    <div class="section-title">За столом</div>
    <div class="card bj-log">${(r.log || []).slice().reverse().map((l, i) => `<div class="ev ${i === 0 ? "new" : ""}">${esc(l)}</div>`).join("") || '<div class="muted">Тиша…</div>'}</div>
    ${me.id ? "" : ""}`;
}

function bjEnd() {
  const r = S.room;
  const list = r.players.slice().sort((a, b) => b.net - a.net);
  return `<div class="win mt bj-end"><div class="kicker">ГРУ ЗАВЕРШЕНО</div><h2>${list[0] && list[0].net > 0 ? esc(list[0].name) : "Нічия"}</h2>
      <p>${r.handNo} ${plural(r.handNo, "роздача", "роздачі", "роздач")}${r.settings.stake ? ` · ставка ${r.settings.stake}` : ""}</p></div>
    <div class="section-title">Підсумки</div>
    <div class="card">${list.map((p) => `<div class="row bj-sum">${av(p, "sm")}<b class="grow">${p.id === S.me ? "Ви" : nm(p)}</b><span class="${p.net > 0 ? "plus" : p.net < 0 ? "minus" : "muted"}">${p.net > 0 ? "+" : ""}${p.net}</span></div>`).join("")}</div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ще гра</button>` : `<div class="card center mt2 muted">Хост може почати нову гру</div>`}
    <button class="btn ghost mt" data-a="leave">Встати з-за столу</button>`;
}

function bjSettingsSheet() {
  const s = S.room.settings;
  return `<h2>⚙️ Ставки</h2>
    <div class="section-title">З кожного гравця за роздачу</div>
    <div class="chips">${Blackjack.STAKES.map((v) => `<button class="pill ${s.stake === v ? "on" : ""}" data-a="bj-set" data-v="${v}">${v ? `🪙 ${v}` : "на інтерес"}</button>`).join("")}</div>
    ${stakeOwnRow(s.stake, Blackjack.STAKE_MAX, Blackjack.STAKES)}
    <div class="small muted mt">Ставлять усі однаково. Монети — ті, що зароблені в іграх і скринях.</div>`;
}

/* ---------------------------------------------------------------- монеты: ставка списывается при раздаче, выигрыш приходит при вскрытии */
// с ботами: ставок нет, но выигранная раздача — по 5 монет за каждого бота в ней
function bjBotWin(r) {
  const me = r.players.find((p) => p.id === S.me), bots = r.players.filter((p) => /^bot_/.test(p.id) && p.playing).length;
  if (!bots || !me || !me.playing || r.phase !== "show" || !r.results || !r.results.winners.includes(S.me)) return;
  const key = "bjb:" + r.code + ":" + r.game_no + ":" + r.handNo;
  if (store.bjBotPaid === key) return;
  store.bjBotPaid = key;
  const add = BOT_COIN * bots;
  if (Api.on && Api.ready) Api.solo(add, "bots"); else { store.coins += add; saveProfile(); }
  coinRain(); toast(`Обіграв ботів: +${add} 🪙`);
}
function bjCoins(r) {
  bjBotWin(r);
  if (!r.settings.stake) return;
  const me = r.players.find((p) => p.id === S.me);
  const tbl = Api.table(r);
  if (tbl) return bjBank(r, me, tbl);
  if (!me || !me.playing) return;
  const base = "bj:" + r.code + ":" + r.game_no + ":" + r.handNo;
  let changed = false;
  if (store.bjAnte !== base) { store.bjAnte = base; store.coins = Math.max(0, (store.coins || 0) - r.settings.stake); changed = true; }
  if (me.doubled && store.bjDouble !== base) { store.bjDouble = base; store.coins = Math.max(0, (store.coins || 0) - r.settings.stake); changed = true; }
  if (r.phase === "show" && r.results && store.bjPaid !== base) {
    store.bjPaid = base; const pay = r.results.payout[S.me] || 0;
    if (pay) { store.coins += pay; changed = true; if (r.results.winners.includes(S.me)) { coinRain(); notify("success"); } }
  }
  if (changed) { saveProfile(); syncProfile(); }
}

// монеты через банк стола на сервере: ставка уходит сразу, хост присылает итог, сервер переводит выигрыш
function bjBank(r, me, tbl) {
  const hand = String(r.handNo), base = tbl + ":" + hand, done = (S.bjBank = S.bjBank || {});
  const once = (k, fn) => { if (!done[base + k]) { done[base + k] = 1; fn(); } };
  if (me && me.playing) once(":a", () => Api.bet(tbl, hand, "ante", r.settings.stake).catch((e) => toast("Ставка не списалася: " + e.message)));
  if (me && me.doubled) once(":d", () => Api.bet(tbl, hand, "double", r.settings.stake).catch((e) => toast("Подвоєння не списалося: " + e.message)));
  if (r.phase === "show" && r.results) {
    if (isHost()) once(":s", () => setTimeout(() => Api.settle(tbl, hand, r.results.payout).catch(() => { done[base + ":s"] = 0; }), 2000));   // даём ставкам дойти до сервера
    if (me && me.playing) once(":r", () => {
      if ((r.results.payout[S.me] || 0) > 0 && r.results.winners.includes(S.me)) { coinRain(); notify("success"); }
      [4000, 9000].forEach((ms) => setTimeout(() => Api.coins().then(() => render()).catch(() => {}), ms));   // забрать выигрыш с сервера
    });
  }
}

function bjVerify(r) {
  const key = r.code + ":" + r.game_no + ":" + r.handNo;
  S.bjChecked = S.bjChecked || {};
  if (!S.bjChecked[key]) S.bjChecked[key] = Blackjack.verify(r.reveal);
  return S.bjChecked[key];
}

const BJ_ACTIONS = {
  "bj-create": () => {
    haptic("medium");
    S.screen = "connecting"; S.joining = ""; render();
    Net.host({ game: "blackjack" }).catch((e) => { toast(e.message); S.screen = "blackjack"; render(); });
  },
  "bj-settings": () => { S.sheet = { type: "bj-settings" }; renderOverlay(); },
  "bj-set": (v) => send({ t: "settings", settings: { stake: Number(v) } }),
  "bj-bet": (v) => { send({ t: "act", slot: "bet", play: v === "1", seed: Blackjack.randomHex(16) }); haptic("medium"); },
  "bj-act": (v) => { send({ t: "act", slot: v }); haptic(v === "double" ? "heavy" : "light"); },
  "bj-finish": () => send({ t: "finish" }),
};
