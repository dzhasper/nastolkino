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
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Блэкджек</h1>
      <div class="muted small">Игроки против игроков · ${Blackjack.MIN_PLAYERS}–${Blackjack.MAX_PLAYERS} за столом</div></div>${coinPill()}</div>
    <div class="card bj-rules">
      <p>Каждый получает две карты: <b>первая закрыта</b> от соперников, остальные открыты. По очереди: <b>«Ещё»</b> — взять карту, <b>«Хватит»</b> — остановиться, <b>«Удвоить»</b> — удвоить ставку и взять ровно одну карту.</p>
      <p>Больше 21 — перебор. <b>Ближе всех к 21 забирает банк</b>. Блэкджек (туз + десятка с первых двух карт) сильнее любых других 21. Ничья — банк делится. Все перебрали — ставки возвращаются.</p>
      <p>Хост выбирает: <b>на интерес</b> или <b>на монеты</b>. На монетах ставят все одинаково.</p>
    </div>
    <div class="card bj-fair">🔒 <b>Честная раздача.</b> Перед каждой раздачей новая колода из 52 карт. Хост заранее «запечатывает» её отпечатком (SHA-256), каждый телефон добавляет свою случайность, а после вскрытия твой телефон сам проверяет, что ни одну карту не подменили.</div>
    <button class="btn mt2" data-a="bj-create">Сесть за стол</button>
    <div class="section-title">Или войди по коду</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
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
  const r = S.room, s = r.settings;
  const enough = r.players.filter((p) => p.online).length >= Blackjack.MIN_PLAYERS;
  return `<div class="pxscene" style="background-image:url(${Pixel.scene("casino")})"></div>
    <div class="top"><button class="avatar" data-a="leave">←</button><div class="grow"><h1>Стол</h1>
      <div class="muted small">${r.players.length} из ${Blackjack.MAX_PLAYERS} мест</div></div>${coinPill()}</div>
    <div class="card code-card"><div class="muted small">КОД СТОЛА</div><div class="code">${r.code}</div>
      <div class="row mt"><button class="btn ghost small grow" data-a="copy">📋 Скопировать</button>
      <button class="btn small grow" data-a="share">📨 Позвать</button></div></div>
    <div class="section-title">За столом</div>${playerTiles(r.players, { kick: isHost(), peek: true })}
    <div class="section-title">Ставки</div>
    <div class="card"><div class="row"><div class="grow">${s.stake ? `🪙 <b>На монеты: ${s.stake} с каждого за раздачу</b><div class="small muted">Банк раздачи забирает лучший. Нужно иметь хотя бы ${s.stake} монет.</div>` : `🎲 <b>На интерес</b><div class="small muted">Без монет — просто кто кого.</div>`}</div>
      ${isHost() ? `<button class="btn ghost small" data-a="bj-settings">⚙️</button>` : ""}</div></div>
    ${isHost() ? `<button class="btn mt2" data-a="start" ${enough ? "" : "disabled"}>${enough ? "Раздать карты" : `Ждём игроков (минимум ${Blackjack.MIN_PLAYERS})`}</button>`
      : `<div class="card center mt2 muted">⏳ Ждём, когда хост начнёт раздачу…</div>`}`;
}

function bjSeat(p) {
  const r = S.room, win = r.results && r.results.winners.includes(p.id), turn = r.turn === p.id;
  const tag = p.blackjack ? "БЛЭКДЖЕК" : p.bust ? "ПЕРЕБОР" : p.folded ? "СБРОС" : p.doubled ? "×2" : r.phase === "play" && p.done ? "ХВАТИТ" : "";
  const pay = r.phase === "show" && r.results ? r.results.payout[p.id] : null;
  return `<div class="bj-seat ${turn ? "turn" : ""} ${win ? "win" : ""} ${p.bust ? "bust" : ""} ${p.id === S.me ? "me" : ""}">
    <div class="bj-who">${av(p, "sm")}<div class="grow"><b>${p.id === S.me ? "Вы" : nm(p)}</b>
      <div class="small muted">${p.score != null ? `${p.score} очк.` : p.cards ? `${p.cards.length} карт` : ""}${p.net ? ` · <span class="${p.net > 0 ? "plus" : "minus"}">${p.net > 0 ? "+" : ""}${p.net}</span>` : ""}</div></div>
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
      ? `<div class="card center"><b>Раздача №${r.handNo}</b>${s.stake ? ` · ставка ${chip(s.stake)}` : " · на интерес"}<div class="small muted mt">${can ? "Играешь эту раздачу?" : `Не хватает монет: у тебя ${S.profile.coins}`}</div></div>
         <div class="row mt bj-act"><button class="btn grow" data-a="bj-bet" data-v="1" ${can ? "" : "disabled"}>Играю${s.stake ? ` · ${s.stake}` : ""}</button><button class="btn ghost grow" data-a="bj-bet" data-v="0">Пропускаю</button></div>`
      : `<div class="card center">${r.my_joined ? "✓ Ты в раздаче. Ждём остальных…" : "Ты пропускаешь эту раздачу"}</div>`;
  } else if (r.phase === "play") {
    const mine = r.turn === S.me, myp = r.players.find((p) => p.id === S.me);
    if (mine) {
      const canDouble = myp.cards.length === 2 && (!s.stake || (S.profile.coins || 0) >= s.stake);
      actions = `<div class="your-turn bj">ТВОЙ ХОД · ${myp.score} очк.</div>
        <div class="bj-act3"><button class="btn" data-a="bj-act" data-v="hit">Ещё</button><button class="btn ghost" data-a="bj-act" data-v="stand">Хватит</button>
        <button class="btn gold" data-a="bj-act" data-v="double" ${canDouble ? "" : "disabled"}>Удвоить${s.stake ? ` · ${s.stake}` : ""}</button></div>`;
    } else actions = `<div class="card center">Ходит <b>${esc(turnP ? turnP.name : "")}</b>${myp && myp.playing ? `<div class="small muted mt">У тебя ${myp.score} очк.</div>` : ""}</div>`;
  } else if (r.phase === "show") {
    const res = r.results, v = bjVerify(r);
    actions = `<div class="card center bj-result">${res.winners.length ? `🏆 <b>${res.winners.map((id) => esc((r.players.find((p) => p.id === id) || {}).name || "?")).join(", ")}</b> ${res.winners.length > 1 ? "делят" : "забирает"} банк${r.pot ? ` ${chip(r.pot)}` : ""}` : "Все перебрали — ставки вернулись"}
      ${res.payout[S.me] ? `<div class="bj-myp">Тебе +${res.payout[S.me]}</div>` : ""}</div>
      <div class="card bj-check ${v.ok ? "ok" : "bad"}">${v.ok ? "✅ Раздача честная — твой телефон проверил отпечаток колоды и каждую карту" : `⚠️ Раздача не сходится: ${esc(v.why)}`}
        <details><summary>Подробнее</summary><div class="tiny">Отпечаток: ${r.reveal.commit}<br>Секрет хоста: ${r.reveal.serverSeed}<br>Случайности игроков: ${Object.entries(r.reveal.seeds).map(([k, x]) => `${esc((r.players.find((p) => p.id === k) || {}).name || k)}: ${x}`).join("<br>")}</div></details></div>
      ${isHost() ? `<div class="row mt"><button class="btn small grow" data-a="skip">Следующая раздача</button><button class="btn ghost small grow" data-a="bj-finish">Закончить игру</button></div>` : `<div class="small muted center mt">Следующая раздача скоро…</div>`}`;
  } else if (r.phase === "wait") {
    actions = `<div class="card center">Мало игроков для раздачи</div>${isHost() ? `<div class="row mt"><button class="btn small grow" data-a="skip">Новая раздача</button><button class="btn ghost small grow" data-a="bj-finish">Закончить игру</button></div>` : ""}`;
  }
  const playing = r.players.filter((p) => p.playing), idle = r.players.filter((p) => !p.playing);
  return `<div class="bj-head"><div class="grow"><b>Раздача №${r.handNo}</b><div class="small">${s.stake ? `Ставка ${s.stake} · у тебя 🪙 ${S.profile.coins}` : "На интерес"}</div></div>
      ${r.pot ? `<div class="bj-pot">БАНК<br>${chip(r.pot)}</div>` : ""}${timer}</div>
    <div class="bj-felt">
      ${r.phase === "bet" ? `<div class="bj-seal">🔒 Колода запечатана<br><code>${(r.commit || "").slice(0, 12)}…${(r.commit || "").slice(-6)}</code><div class="small">${r.players.filter((p) => p.joined).length} в раздаче</div></div>` : ""}
      ${playing.map(bjSeat).join("")}
      ${r.phase !== "bet" && !playing.length ? `<div class="center muted">Карты ещё не розданы</div>` : ""}
    </div>
    ${actions}
    ${idle.length && r.phase !== "bet" ? `<div class="small muted mt">Не играют эту раздачу: ${idle.map((p) => esc(p.name)).join(", ")}</div>` : ""}
    <div class="section-title">За столом</div>
    <div class="card bj-log">${(r.log || []).slice().reverse().map((l, i) => `<div class="ev ${i === 0 ? "new" : ""}">${esc(l)}</div>`).join("") || '<div class="muted">Тишина…</div>'}</div>
    ${me.id ? "" : ""}`;
}

function bjEnd() {
  const r = S.room;
  const list = r.players.slice().sort((a, b) => b.net - a.net);
  return `<div class="win mt bj-end"><div class="kicker">ИГРА ОКОНЧЕНА</div><h2>${list[0] && list[0].net > 0 ? esc(list[0].name) : "Ничья"}</h2>
      <p>${r.handNo} ${plural(r.handNo, "раздача", "раздачи", "раздач")}${r.settings.stake ? ` · ставка ${r.settings.stake}` : ""}</p></div>
    <div class="section-title">Итоги</div>
    <div class="card">${list.map((p) => `<div class="row bj-sum">${av(p, "sm")}<b class="grow">${p.id === S.me ? "Вы" : nm(p)}</b><span class="${p.net > 0 ? "plus" : p.net < 0 ? "minus" : "muted"}">${p.net > 0 ? "+" : ""}${p.net}</span></div>`).join("")}</div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ещё игра</button>` : `<div class="card center mt2 muted">Хост может начать новую игру</div>`}
    <button class="btn ghost mt" data-a="leave">Встать из-за стола</button>`;
}

function bjSettingsSheet() {
  const s = S.room.settings;
  return `<h2>⚙️ Ставки</h2>
    <div class="section-title">С каждого игрока за раздачу</div>
    <div class="chips">${Blackjack.STAKES.map((v) => `<button class="pill ${s.stake === v ? "on" : ""}" data-a="bj-set" data-v="${v}">${v ? `🪙 ${v}` : "на интерес"}</button>`).join("")}</div>
    <div class="small muted mt">Ставят все одинаково. Монеты — те, что нафармлены в играх и сундуках.</div>`;
}

/* ---------------------------------------------------------------- монеты: ставка списывается при раздаче, выигрыш приходит при вскрытии */
function bjCoins(r) {
  if (!r.settings.stake) return;
  const me = r.players.find((p) => p.id === S.me);
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
