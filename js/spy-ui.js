/* «Шпион»: экраны. Общие S, send, av, esc, playerTiles и т. п. — из app.js */
"use strict";

/* ---------------------------------------------------------------- меню игры */
function viewSpyMenu() {
  const step = (n, t, d) => `<div class="how"><b>${n}</b><div><div class="how-t">${t}</div><div class="muted small">${d}</div></div></div>`;
  return `<div class="fade-in">
    <div class="spy-hero"><span>🕵️</span></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>🕵️ Шпион</h1>
      <div class="muted small">Все знают, где вы. Кроме одного · ${Spy.MIN_PLAYERS}–${Spy.MAX_PLAYERS} игроков</div></div></div>
    <div class="card">
      ${step(1, "Каждый получает карту", "На ней локация и твоя роль: «Самолёт — пилот». Одному выпадает «Ты шпион»")}
      ${step(2, "Задавайте друг другу вопросы", "Вслух или в чате. Отвечай так, чтобы свои поняли, а шпион — нет")}
      ${step(3, "Шпион слушает и угадывает", "В любой момент он может назвать локацию. Угадал — победа")}
      ${step(4, "Подозреваешь? Обвиняй!", "Если все остальные согласны — игрок раскрывается. Обвинить можно раз за раунд")}
      ${step(5, "Время вышло — финальное голосование", "Большинство укажет на шпиона — город победил. Ничья — шпион ускользнул")}
    </div>
    <button class="btn mt2" data-a="spy-create">Создать комнату</button>
    <div class="section-title">Или войди по коду</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
const spyName = (id) => { const p = S.room.players.find((x) => x.id === id); return p ? (p.id === S.me ? "Вы" : p.name) : "?"; };
function viewSpyRoom() {
  const r = S.room;
  const v = { lobby: spyLobby, reveal: spyReveal, play: spyPlay, vote: spyVote, final: spyFinal, result: spyResult, end: spyEnd }[r.phase] || spyLobby;
  return `${netBanner()}<div class="fade-in spy-room ph-${r.phase}">${v()}</div>
    ${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}
function spyBar(title, sub) {
  const r = S.room;
  return `<div class="gamebar"><div class="title"><span class="kicker">🕵️ Шпион · раунд ${r.round} из ${r.rounds}</span><b>${title}</b><span class="muted small">${sub || ""}</span></div>${timerSvg()}</div>`;
}
function spyLobby() {
  const r = S.room, enough = r.players.filter((p) => p.online).length >= Spy.MIN_PLAYERS;
  return `<div class="top"><button class="avatar" data-a="leave">←</button><div class="grow"><h1>Явочная квартира</h1>
      <div class="muted small">${r.players.length} из ${Spy.MAX_PLAYERS} игроков</div></div></div>
    <div class="card code-card"><div class="muted small">КОД КОМНАТЫ</div><div class="code">${r.code}</div>
      <div class="row mt"><button class="btn ghost small grow" data-a="copy">📋 Скопировать</button>
      <button class="btn small grow" data-a="share">📨 Позвать друзей</button></div></div>
    <div class="section-title">Игроки</div>
    ${playerTiles(r.players, { kick: isHost(), peek: true })}
    <div class="section-title">Правила</div>
    <div class="card"><div class="row"><div class="grow"><b class="display">🕵️ Шпион</b>
      <div class="small muted mt">⏱ ${Math.round(r.settings.time / 60)} мин на раунд · ${r.settings.rounds} ${plural(r.settings.rounds, "раунд", "раунда", "раундов")} · ${Spy.LOCATIONS.length} локаций</div></div>
      ${isHost() ? `<button class="btn ghost small" data-a="spy-settings">⚙️</button>` : ""}</div>
      <div class="small mt">Очки: поймали шпиона — всем по 1, обвинившему +1 сверху. Шпион угадал локацию — +3, ушёл от разоблачения — +2.</div></div>
    ${isHost() ? `<button class="btn mt2" data-a="start" ${enough ? "" : "disabled"}>${enough ? "Начать игру 🕵️" : `Ждём игроков (минимум ${Spy.MIN_PLAYERS})`}</button>`
      : `<div class="card center mt2 muted">⏳ Ждём, когда хост начнёт игру…</div>`}`;
}
// карта: локация и роль или «ты шпион»
function spyCardHtml(c, big) {
  if (!c) return `<div class="spy-card"><div class="muted">Ты смотришь эту партию</div></div>`;
  if (c.spy) return `<div class="spy-card spy ${big ? "big" : ""}"><div class="sc-emo">🕵️</div><div class="sc-loc">ТЫ — ШПИОН</div><div class="sc-role">Узнай, где все, и не выдай себя</div></div>`;
  return `<div class="spy-card ${big ? "big" : ""}"><div class="sc-emo">${c.emoji}</div><div class="sc-loc">${esc(c.location)}</div><div class="sc-role">Твоя роль: <b>${esc(c.role)}</b></div></div>`;
}
function spyReveal() {
  const r = S.room, me = r.players.find((p) => p.id === S.me) || {};
  return `${spyBar("Твоя карта", "Никому не показывай экран")}
    <div class="spy-flip ${S.spyOpen ? "open" : ""}" data-a="spy-open"><div class="flip-in">
      <div class="face front spy-back"><div class="sb-mark">🕵️</div><div class="cf-line">Нажми, чтобы открыть</div></div>
      <div class="face back">${spyCardHtml(r.card, true)}</div></div></div>
    <button class="btn mt" data-a="seen" ${S.spyOpen && !me.seen ? "" : "disabled"}>${me.seen ? "✓ Ждём остальных…" : "Запомнил(а)"}</button>
    <div class="small muted center mt">Посмотрели: ${r.players.filter((p) => p.seen).length} из ${r.players.filter((p) => p.playing).length}</div>
    ${hostSkip("Начать сразу")}`;
}
function spyLocGrid(clickable) {
  const r = S.room, cross = S.spyCross || {};
  return `<div class="spy-locs">${r.locations.map((l) => `<button class="spy-loc ${cross[l.key] ? "x" : ""}" data-a="${clickable ? "spy-guess" : "spy-cross"}" data-v="${l.key}"><span>${l.emoji}</span>${esc(l.name)}</button>`).join("")}</div>`;
}
function spyPlay() {
  const r = S.room, me = r.players.find((p) => p.id === S.me) || {}, spy = r.card && r.card.spy;
  const others = r.players.filter((p) => p.playing && p.id !== S.me);
  return `${spyBar("Ищем шпиона", `Первым спрашивает: ${esc(spyName(r.first))}`)}
    <button class="spy-mini" data-a="spy-peek">${S.spyPeek ? spyCardHtml(r.card) : `<span>🃏 Моя карта</span><span class="muted small">нажми, чтобы посмотреть</span>`}</button>
    ${spy ? `<button class="btn mt" data-a="spy-guess-open">🎯 Я знаю, где мы! Назвать локацию</button>` : ""}
    <div class="section-title">Обвинить</div>
    <div class="spy-acc">${others.map((p) => `<button class="spy-pl" data-a="spy-accuse" data-v="${p.id}" ${me.accused ? "disabled" : ""}>${av(p, "sm")}<span>${esc(p.name)}</span></button>`).join("")}</div>
    <div class="small muted">${me.accused ? "Ты уже обвинял в этом раунде" : "Если все остальные согласятся — игрок раскроется. Ошибка — победа шпиона. Можно раз за раунд."}</div>
    <div class="section-title">Возможные локации <span class="muted small">— нажми, чтобы вычеркнуть</span></div>
    ${spyLocGrid(false)}
    ${(r.history || []).length ? `<div class="card small mt">${r.history.slice(-3).map((h) => `<div>• ${esc(h.text)}</div>`).join("")}</div>` : ""}
    ${hostSkip("К финальному голосованию")}`;
}
function spyVote() {
  const r = S.room, v = r.vote, amTarget = v.target === S.me, my = v.votes[S.me];
  const voters = r.players.filter((p) => p.playing && p.online && p.id !== v.target);
  return `${spyBar("Обвинение!", `${esc(spyName(v.by))} считает, что шпион — ${esc(spyName(v.target))}`)}
    <div class="card spy-vote center"><div class="sv-who">${av(r.players.find((p) => p.id === v.target), "huge")}</div>
      <h2>${esc(spyName(v.target))} — шпион?</h2><div class="small muted">Нужно, чтобы согласились все. Один «нет» — обвинение снимается</div>
      ${amTarget ? `<div class="card mt">Тебя обвиняют. Оправдывайся в чате!</div>`
        : `<div class="row mt"><button class="btn grow ${my === true ? "on" : ""}" data-a="spy-vote" data-v="1">👍 Да, это он</button><button class="btn ghost grow ${my === false ? "on" : ""}" data-a="spy-vote" data-v="0">👎 Нет</button></div>`}
      <div class="sv-list mt">${voters.map((p) => `<span class="pill">${esc(p.name)} ${v.votes[p.id] === true ? "👍" : v.votes[p.id] === false ? "👎" : "…"}</span>`).join("")}</div></div>
    ${r.card && r.card.spy ? `<button class="btn ghost mt" data-a="spy-guess-open">🎯 Назвать локацию, пока не поздно</button>` : ""}`;
}
function spyFinal() {
  const r = S.room, others = r.players.filter((p) => p.playing && p.id !== S.me);
  return `${spyBar("Финальное голосование", "Время вышло — кто шпион?")}
    <div class="small center mt">Проголосовали: ${r.final_n} из ${r.players.filter((p) => p.playing && p.online).length}. Ничья — шпион ускользнул.</div>
    <div class="spy-acc mt">${others.map((p) => `<button class="spy-pl ${r.my_final === p.id ? "on" : ""}" data-a="spy-final" data-v="${p.id}">${av(p, "sm")}<span>${esc(p.name)}</span>${r.my_final === p.id ? "<b>✓</b>" : ""}</button>`).join("")}</div>
    ${r.card && r.card.spy ? `<button class="btn ghost mt" data-a="spy-guess-open">🎯 Назвать локацию</button>` : ""}
    ${hostSkip("Подвести итог")}`;
}
function spyResult() {
  const r = S.room, x = r.result; if (!x) return "";
  const won = x.spyWon ? x.spy === S.me : x.spy !== S.me;
  return `${spyBar("Итог раунда", "")}
    <div class="card spy-res ${x.spyWon ? "spywin" : "townwin"}">
      <div class="sr-big">${x.spyWon ? "🕵️ Шпион победил" : "🎉 Шпиона поймали"}</div>
      <div class="sr-row">${av(r.players.find((p) => p.id === x.spy), "big")}<div><div class="small muted">Шпионом был(а)</div><b>${esc(spyName(x.spy))}</b></div></div>
      <div class="sr-loc">${x.location ? `${x.location.emoji} ${esc(x.location.name)}` : ""}</div>
      <div class="small mt">${esc(x.text)}</div>
      <div class="mt"><b>${won ? "Ты в выигрыше 👍" : "В этот раз мимо"}</b></div></div>
    <div class="section-title">Очки</div>
    ${spyScores(x.add)}
    <div class="small muted center mt">${r.round < r.rounds ? "Скоро следующий раунд…" : "Сейчас итоги партии…"}</div>
    ${hostSkip(r.round < r.rounds ? "Следующий раунд" : "К итогам")}`;
}
function spyScores(add = {}) {
  const list = S.room.players.filter((p) => p.playing).sort((a, b) => b.score - a.score);
  return `<div class="card scores">${list.map((p, i) => `<div class="sc ${p.id === S.me ? "me" : ""}"><span class="pl">${i + 1}</span>${av(p, "sm")}<div class="grow nmline"><b>${p.id === S.me ? "Вы" : nm(p)}</b></div>
    ${add[p.id] ? `<span class="plus">+${add[p.id]}</span>` : ""}<span class="pts">${p.score}</span></div>`).join("")}</div>`;
}
function spyEnd() {
  const r = S.room, iWon = (r.winners || []).includes(S.me);
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  return `<div class="win mt"><div class="ph-icon" style="font-size:56px">🕵️</div><div class="small kicker">ИТОГИ</div>
      <h2>${r.winners && r.winners.length ? r.winners.map(spyName).map(esc).join(", ") : "Ничья"}</h2><p class="mt"><b>${iWon ? "Ты победил(а)!" : "В этот раз не повезло"}</b></p>
      ${rw ? `<div class="reward-coins">🪙 +${rw} монет</div>` : ""}</div>
    <div class="section-title">Счёт</div>${spyScores()}
    ${(r.history || []).length ? `<div class="section-title">Как это было</div><div class="card small">${r.history.filter((h) => h.kind === "result").map((h) => `<div class="story">Раунд ${h.round}: ${esc(h.text)}</div>`).join("")}</div>` : ""}
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ещё партия</button>` : `<div class="card center mt2 muted">Хост может начать новую партию</div>`}
    <button class="btn ghost mt" data-a="leave">Выйти в меню</button>`;
}
function spySettingsSheet() {
  const s = S.room.settings;
  return `<h2>⚙️ Настройки</h2>
    <div class="section-title">Время на раунд</div><div class="chips">${Spy.TIMES.map((t) => `<button class="pill ${s.time === t ? "on" : ""}" data-a="spy-set" data-v="time:${t}">${t / 60} мин</button>`).join("")}</div>
    <div class="section-title">Раундов</div><div class="chips">${Spy.ROUNDS.map((n) => `<button class="pill ${s.rounds === n ? "on" : ""}" data-a="spy-set" data-v="rounds:${n}">${n}</button>`).join("")}</div>`;
}
function spyGuessSheet() {
  return `<h2>🎯 Где мы?</h2><div class="small muted">Угадаешь — +3 очка и победа. Ошибёшься — раскроешь себя.</div>${spyLocGrid(true)}`;
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
    const q = `Обвинить ${spyName(id)}? Если все согласятся, а это не шпион — победит шпион.`;
    const go = () => { send({ t: "act", slot: "accuse", target: id }); haptic("heavy"); };
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "spy-vote": (v) => { send({ t: "act", slot: "vote", value: v === "1" }); haptic("medium"); },
  "spy-final": (id) => { send({ t: "act", slot: "final", target: id }); haptic("medium"); },
  "spy-guess-open": () => { S.sheet = { type: "spy-guess" }; renderOverlay(); },
  "spy-guess": (k) => {
    const l = S.room.locations.find((x) => x.key === k);
    const go = () => { S.sheet = null; renderOverlay(); send({ t: "act", slot: "guess", target: k }); haptic("heavy"); };
    const q = `Назвать «${l ? l.name : k}»? Ошибка — раскроешь себя.`;
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
};
