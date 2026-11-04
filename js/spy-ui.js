/* «Шпион»: экраны. Общие S, send, av, esc, playerTiles и т. п. — из app.js */
"use strict";

/* ---------------------------------------------------------------- меню игры */
function viewSpyMenu() {
  const step = (n, t, d) => `<div class="how"><b>${n}</b><div><div class="how-t">${t}</div><div class="muted small">${d}</div></div></div>`;
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("spy")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>🕵️ Шпигун</h1>
      <div class="muted small">Усі знають, де ви. Крім одного · ${Spy.MIN_PLAYERS}–${Spy.MAX_PLAYERS} гравців</div></div></div>
    <div class="card">
      ${step(1, "Кожен отримує карту", "На ній локація й твоя роль: «Літак — пілот». Одному випадає «Ти шпигун»")}
      ${step(2, "Ставте одне одному запитання", "Уголос або в чаті. Відповідай так, щоб свої зрозуміли, а шпигун — ні")}
      ${step(3, "Шпигун слухає й угадує", "Будь-коли він може назвати локацію. Угадав — перемога")}
      ${step(4, "Підозрюєш? Звинувачуй!", "Якщо всі інші згодні — гравець розкривається. Звинуватити можна раз за раунд")}
      ${step(5, "Час вийшов — фінальне голосування", "Більшість укаже на шпигуна — місто перемогло. Нічия — шпигун вислизнув")}
    </div>
    <button class="btn mt2" data-a="spy-create">Створити кімнату</button>
    <div class="section-title">Або увійди за кодом</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Увійти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
const spyName = (id) => { const p = S.room.players.find((x) => x.id === id); return p ? (p.id === S.me ? "Ви" : p.name) : "?"; };
function viewSpyRoom() {
  const r = S.room;
  const v = { lobby: spyLobby, reveal: spyReveal, play: spyPlay, vote: spyVote, final: spyFinal, result: spyResult, end: spyEnd }[r.phase] || spyLobby;
  return `${netBanner()}<div class="fade-in spy-room ph-${r.phase}">${v()}</div>
    ${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}
function spyBar(title, sub) {
  const r = S.room;
  return `<div class="gamebar"><div class="title"><span class="kicker">🕵️ Шпигун · раунд ${r.round} з ${r.rounds}</span><b>${title}</b><span class="muted small">${sub || ""}</span></div>${timerSvg()}</div>`;
}
function spyLobby() {
  const r = S.room, enough = r.players.filter((p) => p.online).length >= Spy.MIN_PLAYERS;
  return lobbyBento({ kicker: "Шпигун · кімната", title: "Явочна квартира", max: Spy.MAX_PLAYERS, settings: "spy-settings", scene: "spy", rulesLabel: "Правила",
    rules: `<b class="display">🕵️ Шпигун</b>
      <div class="small mt">⏱ ${Math.round(r.settings.time / 60)} хв на раунд · ${r.settings.rounds} ${plural(r.settings.rounds, "раунд", "раунди", "раундів")} · ${Spy.LOCATIONS.length} локацій</div>
      <div class="small mt">Очки: спіймали шпигуна — усім по 1, тому, хто звинуватив, +1 зверху. Шпигун угадав локацію — +3, уникнув викриття — +2.</div>`,
    enough, start: "Почати гру 🕵️", waitText: `Чекаємо гравців (мінімум ${Spy.MIN_PLAYERS})` });
}
// карта: локация и роль или «ты шпион»
function spyCardHtml(c, big) {
  if (!c) return `<div class="spy-card"><div class="muted">Ти дивишся цю партію</div></div>`;
  if (c.spy) return `<div class="spy-card spy ${big ? "big" : ""}"><div class="sc-emo">🕵️</div><div class="sc-loc">ТИ — ШПИГУН</div><div class="sc-role">Дізнайся, де всі, і не видай себе</div></div>`;
  return `<div class="spy-card ${big ? "big" : ""}"><div class="sc-emo">${c.emoji}</div><div class="sc-loc">${esc(c.location)}</div><div class="sc-role">Твоя роль: <b>${esc(c.role)}</b></div></div>`;
}
function spyReveal() {
  const r = S.room, me = r.players.find((p) => p.id === S.me) || {};
  return `${spyBar("Твоя карта", "Нікому не показуй екран")}
    <div class="spy-flip ${S.spyOpen ? "open" : ""}" data-a="spy-open"><div class="flip-in">
      <div class="face front spy-back"><div class="sb-mark">🕵️</div><div class="cf-line">Натисни, щоб відкрити</div></div>
      <div class="face back">${spyCardHtml(r.card, true)}</div></div></div>
    <button class="btn mt" data-a="seen" ${S.spyOpen && !me.seen ? "" : "disabled"}>${me.seen ? "✓ Чекаємо решту…" : "Запам’ятав(ла)"}</button>
    <div class="small muted center mt">Подивилися: ${r.players.filter((p) => p.seen).length} з ${r.players.filter((p) => p.playing).length}</div>
    ${hostSkip("Почати одразу")}`;
}
function spyLocGrid(clickable) {
  const r = S.room, cross = S.spyCross || {};
  return `<div class="spy-locs">${r.locations.map((l) => `<button class="spy-loc ${cross[l.key] ? "x" : ""}" data-a="${clickable ? "spy-guess" : "spy-cross"}" data-v="${l.key}"><span>${l.emoji}</span>${esc(l.name)}</button>`).join("")}</div>`;
}
function spyPlay() {
  const r = S.room, me = r.players.find((p) => p.id === S.me) || {}, spy = r.card && r.card.spy;
  const others = r.players.filter((p) => p.playing && p.id !== S.me);
  return `${spyBar("Шукаємо шпигуна", `Першим питає: ${esc(spyName(r.first))}`)}
    <button class="spy-mini" data-a="spy-peek">${S.spyPeek ? spyCardHtml(r.card) : `<span>🃏 Моя карта</span><span class="muted small">натисни, щоб подивитися</span>`}</button>
    ${spy ? `<button class="btn mt" data-a="spy-guess-open">🎯 Я знаю, де ми! Назвати локацію</button>` : ""}
    <div class="section-title">Звинуватити</div>
    <div class="spy-acc">${others.map((p) => `<button class="spy-pl" data-a="spy-accuse" data-v="${p.id}" ${me.accused ? "disabled" : ""}>${av(p, "sm")}<span>${esc(p.name)}</span></button>`).join("")}</div>
    <div class="small muted">${me.accused ? "Ти вже звинувачував у цьому раунді" : "Якщо всі інші погодяться — гравець розкриється. Помилка — перемога шпигуна. Можна раз за раунд."}</div>
    <div class="section-title">Можливі локації <span class="muted small">— натисни, щоб викреслити</span></div>
    ${spyLocGrid(false)}
    ${(r.history || []).length ? `<div class="card small mt">${r.history.slice(-3).map((h) => `<div>• ${esc(h.text)}</div>`).join("")}</div>` : ""}
    ${hostSkip("До фінального голосування")}`;
}
function spyVote() {
  const r = S.room, v = r.vote, amTarget = v.target === S.me, my = v.votes[S.me];
  const voters = r.players.filter((p) => p.playing && p.online && p.id !== v.target);
  return `${spyBar("Звинувачення!", `${esc(spyName(v.by))} вважає, що шпигун — ${esc(spyName(v.target))}`)}
    <div class="card spy-vote center"><div class="sv-who">${av(r.players.find((p) => p.id === v.target), "huge")}</div>
      <h2>${esc(spyName(v.target))} — шпигун?</h2><div class="small muted">Треба, щоб погодилися всі. Одне «ні» — звинувачення знімається</div>
      ${amTarget ? `<div class="card mt">Тебе звинувачують. Виправдовуйся в чаті!</div>`
        : `<div class="row mt"><button class="btn grow ${my === true ? "on" : ""}" data-a="spy-vote" data-v="1">👍 Так, це він</button><button class="btn ghost grow ${my === false ? "on" : ""}" data-a="spy-vote" data-v="0">👎 Ні</button></div>`}
      <div class="sv-list mt">${voters.map((p) => `<span class="pill">${esc(p.name)} ${v.votes[p.id] === true ? "👍" : v.votes[p.id] === false ? "👎" : "…"}</span>`).join("")}</div></div>
    ${r.card && r.card.spy ? `<button class="btn ghost mt" data-a="spy-guess-open">🎯 Назвати локацію, поки не пізно</button>` : ""}`;
}
function spyFinal() {
  const r = S.room, others = r.players.filter((p) => p.playing && p.id !== S.me);
  return `${spyBar("Фінальне голосування", "Час вийшов — хто шпигун?")}
    <div class="small center mt">Проголосували: ${r.final_n} з ${r.players.filter((p) => p.playing && p.online).length}. Нічия — шпигун вислизнув.</div>
    <div class="spy-acc mt">${others.map((p) => `<button class="spy-pl ${r.my_final === p.id ? "on" : ""}" data-a="spy-final" data-v="${p.id}">${av(p, "sm")}<span>${esc(p.name)}</span>${r.my_final === p.id ? "<b>✓</b>" : ""}</button>`).join("")}</div>
    ${r.card && r.card.spy ? `<button class="btn ghost mt" data-a="spy-guess-open">🎯 Назвати локацію</button>` : ""}
    ${hostSkip("Підбити підсумок")}`;
}
function spyResult() {
  const r = S.room, x = r.result; if (!x) return "";
  const won = x.spyWon ? x.spy === S.me : x.spy !== S.me;
  return `${spyBar("Підсумок раунду", "")}
    <div class="card spy-res ${x.spyWon ? "spywin" : "townwin"}">
      <div class="sr-big">${x.spyWon ? "🕵️ Шпигун переміг" : "🎉 Шпигуна спіймали"}</div>
      <div class="sr-row">${av(r.players.find((p) => p.id === x.spy), "big")}<div><div class="small muted">Шпигуном був(ла)</div><b>${esc(spyName(x.spy))}</b></div></div>
      <div class="sr-loc">${x.location ? `${x.location.emoji} ${esc(x.location.name)}` : ""}</div>
      <div class="small mt">${esc(x.text)}</div>
      <div class="mt"><b>${won ? "Ти у виграші 👍" : "Цього разу повз"}</b></div></div>
    <div class="section-title">Очки</div>
    ${spyScores(x.add)}
    <div class="small muted center mt">${r.round < r.rounds ? "Скоро наступний раунд…" : "Зараз підсумки партії…"}</div>
    ${hostSkip(r.round < r.rounds ? "Наступний раунд" : "До підсумків")}`;
}
function spyScores(add = {}) {
  const list = S.room.players.filter((p) => p.playing).sort((a, b) => b.score - a.score);
  return `<div class="card scores">${list.map((p, i) => `<div class="sc ${p.id === S.me ? "me" : ""}"><span class="pl">${i + 1}</span>${av(p, "sm")}<div class="grow nmline"><b>${p.id === S.me ? "Ви" : nm(p)}</b></div>
    ${add[p.id] ? `<span class="plus">+${add[p.id]}</span>` : ""}<span class="pts">${p.score}</span></div>`).join("")}</div>`;
}
function spyEnd() {
  const r = S.room, iWon = (r.winners || []).includes(S.me);
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  return `<div class="win mt"><div class="ph-icon" style="font-size:56px">🕵️</div><div class="small kicker">ПІДСУМКИ</div>
      <h2>${r.winners && r.winners.length ? r.winners.map(spyName).map(esc).join(", ") : "Нічия"}</h2><p class="mt"><b>${iWon ? "Ти переміг(ла)!" : "Цього разу не пощастило"}</b></p>
      ${rw ? `<div class="reward-coins">🪙 +${rw} монет</div>` : ""}</div>
    <div class="section-title">Рахунок</div>${spyScores()}
    ${(r.history || []).length ? `<div class="section-title">Як це було</div><div class="card small">${r.history.filter((h) => h.kind === "result").map((h) => `<div class="story">Раунд ${h.round}: ${esc(h.text)}</div>`).join("")}</div>` : ""}
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ще партія</button>` : `<div class="card center mt2 muted">Хост може почати нову партію</div>`}
    <button class="btn ghost mt" data-a="leave">Вийти в меню</button>`;
}
function spySettingsSheet() {
  const s = S.room.settings;
  return `<h2>⚙️ Налаштування</h2>
    <div class="section-title">Час на раунд</div><div class="chips">${Spy.TIMES.map((t) => `<button class="pill ${s.time === t ? "on" : ""}" data-a="spy-set" data-v="time:${t}">${t / 60} хв</button>`).join("")}</div>
    <div class="section-title">Раундів</div><div class="chips">${Spy.ROUNDS.map((n) => `<button class="pill ${s.rounds === n ? "on" : ""}" data-a="spy-set" data-v="rounds:${n}">${n}</button>`).join("")}</div>`;
}
function spyGuessSheet() {
  return `<h2>🎯 Де ми?</h2><div class="small muted">Угадаєш — +3 очки й перемога. Помилишся — розкриєш себе.</div>${spyLocGrid(true)}`;
}
// очки и награда в конце партии
function recordSpy(room) {
  const mine = room.players.find((p) => p.id === S.me);
  const key = "spy:" + room.code + ":" + room.game_no;
  if (!mine || !mine.playing || store.lastSpy === key) return;
  store.lastSpy = key; store.games = (store.games || 0) + 1;
  const won = (room.winners || []).includes(S.me);
  if (won) store.wins = (store.wins || 0) + 1;
  store.lastGame = key; S.reward = { key, sum: gameReward(room, won, true) };
  saveProfile(); syncProfile();
}

const SPY_ACTIONS = {
  "spy-create": () => { haptic("medium"); S.screen = "connecting"; S.joining = ""; render(); Net.host({ game: "spy" }).catch((e) => { toast(e.message); S.screen = "spy"; render(); }); },
  "spy-settings": () => { S.sheet = { type: "spy-settings" }; renderOverlay(); },
  "spy-set": (v) => { const [k, val] = v.split(":"); send({ t: "settings", settings: { [k]: Number(val) } }); },
  "spy-open": () => { if (!S.spyOpen) { S.spyOpen = true; haptic("heavy"); render(); } },
  "spy-peek": () => { S.spyPeek = !S.spyPeek; haptic(); render(); },
  "spy-cross": (k) => { S.spyCross = S.spyCross || {}; S.spyCross[k] = !S.spyCross[k]; haptic(); render(); },
  "spy-accuse": (id) => {
    const q = `Звинуватити ${spyName(id)}? Якщо всі погодяться, а це не шпигун — переможе шпигун.`;
    const go = () => { send({ t: "act", slot: "accuse", target: id }); haptic("heavy"); };
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "spy-vote": (v) => { send({ t: "act", slot: "vote", value: v === "1" }); haptic("medium"); },
  "spy-final": (id) => { send({ t: "act", slot: "final", target: id }); haptic("medium"); },
  "spy-guess-open": () => { S.sheet = { type: "spy-guess" }; renderOverlay(); },
  "spy-guess": (k) => {
    const l = S.room.locations.find((x) => x.key === k);
    const go = () => { S.sheet = null; renderOverlay(); send({ t: "act", slot: "guess", target: k }); haptic("heavy"); };
    const q = `Назвати «${l ? l.name : k}»? Помилка — розкриєш себе.`;
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
};
