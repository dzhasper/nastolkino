/* «Последний заряд»: экраны, звук, связь с 3D-подвалом (js/roulette3d.js). Общие S, send, av, esc и т. п. — из app.js. */
"use strict";

/* ---------------------------------------------------------------- звук без файлов: всё синтезируется */
const Sfx = (() => {
  let ac = null;
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === "suspended") ac.resume(); return ac; };
  const on = () => S.sound !== false;
  function noise(dur, freq, gain, decay) {
    const a = ctx(); if (!a || !on()) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = gain;
    src.connect(f).connect(g).connect(a.destination); src.start();
  }
  function tone(freq, dur, gain, type = "sine", slide = 0, force) {
    const a = ctx(); if (!a || (!on() && !force)) return;
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), a.currentTime + dur);
    g.gain.setValueAtTime(gain, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + dur);
    o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
  }
  // попали в тебя: очень громко, с перегрузом, звук в этом режиме не выключается
  function hurtBang() {
    const a = ctx(); if (!a) return;
    const len = Math.floor(a.sampleRate * 1.6), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    const src = a.createBufferSource(); src.buffer = buf;
    const sh = a.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6); }
    sh.curve = curve;
    const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 2600;
    const comp = a.createDynamicsCompressor(); comp.threshold.value = -6; comp.ratio.value = 2;
    const g = a.createGain(); g.gain.value = 3.2;
    src.connect(f).connect(sh).connect(g).connect(comp).connect(a.destination); src.start();
    tone(48, 1.1, 1, "sine", .35, true); tone(95, .6, .8, "square", .3, true);
    setTimeout(() => tone(3400, 2.2, .05, "sine", 1, true), 250);           // звон в ушах
  }
  return {
    unlock: () => ctx(), hurtBang,
    bang: () => { noise(.9, 1400, 1.1, 3); tone(70, .5, .9, "sine", .4); },
    click: () => { tone(1800, .03, .25, "square"); noise(.05, 3000, .25, 2); },
    spin: () => { for (let i = 0; i < 8; i++) setTimeout(() => tone(900 + i * 30, .02, .12, "square"), i * 70); },
    blip: () => tone(520, .12, .15, "triangle", 1.6),
    load: () => { tone(300, .06, .2, "square"); setTimeout(() => tone(220, .08, .2, "square"), 90); },
    thud: () => tone(55, .4, .7, "sine", .6),
    saw: () => { for (let i = 0; i < 6; i++) setTimeout(() => noise(.12, 4000 - (i % 2) * 1500, .35, 1), i * 140); },
    bottle: () => { setTimeout(() => { tone(180, .12, .5, "square", .5); noise(.35, 6000, .45, 2); for (let i = 0; i < 5; i++) setTimeout(() => tone(2400 + Math.random() * 2400, .08, .08, "sine"), 40 + i * 50); }, 650); },   // бац и звон стекла
  };
})();
document.addEventListener("pointerdown", () => { if (S.screen === "room" && S.room && S.room.game === "roulette") Sfx.unlock(); }, { passive: true });

const RI = () => Roulette.ITEMS;
const rouMe = () => (S.room ? S.room.players.find((p) => p.id === S.me) : null);
const hearts = (n, max) => Array.from({ length: max }, (_, i) => `<i class="hrt ${i < n ? "on" : ""}"></i>`).join("");

/* ---------------------------------------------------------------- меню */
function viewRouletteMenu() {
  const it = Object.values(RI());
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("cellar")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Последний заряд</h1>
      <div class="muted small">Подвал, стол, один дробовик · ${Roulette.MIN_PLAYERS}–${Roulette.MAX_PLAYERS} игрока</div></div></div>
    <div class="card rou-rules">
      <p>Перед каждой зарядкой <b>каждый тайно заряжает в дробовик один патрон</b> — боевой или холостой. Подвал докладывает ещё несколько своих.</p>
      <p>Потом все видят, <b>сколько всего патронов и сколько из них боевых и холостых</b> — но не порядок и не то, кто что положил. Если все патроны вышли холостыми, подвал перезаряжает свои.</p>
      <p>В свой ход целишься <b>в себя или в соперника</b>. Холостой в себя — ходишь ещё раз. Боевой — минус сердце.</p>
      <p>Последний, кто остался за столом, забирает всё.</p>
    </div>
    <div class="section-title">Предметы на столе</div>
    <div class="rou-items">${it.map((x) => `<div class="ri">${emo(x.emoji, 24)}<div><b>${esc(x.name)}</b><div class="small muted">${esc(x.desc)}</div></div></div>`).join("")}</div>
    <button class="btn mt2" data-a="rou-create">Спуститься в подвал</button>
    <div class="section-title">Или войди по коду</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
function viewRouletteRoom() {
  const r = S.room;
  rouStake(r);
  const panels = { lobby: rouLobby, load: rouLoad, play: () => rouInspect() + rouPlay(), shot: () => rouInspect() + rouPlay(), end: rouEnd };
  const fade = S.rouFade !== r.code + r.phase; S.rouFade = r.code + r.phase;
  return `${netBanner()}<div class="${fade ? "fade-in" : ""}">
    <div class="stage" id="stage"><div class="stage-hud">
      <div class="drum">${r.pot ? `<span class="pot">🪙${r.pot}</span> ` : ""}${r.phase === "lobby" ? "ПОДВАЛ" : r.phase === "load" ? "ЗАРЯДКА…" : `<span class="d-live">🔴${r.drum.liveLeft}</span> <span class="d-blank">⚪${r.drum.blankLeft}</span> <i class="d-of">из ${r.drum.total}</i>`}</div>
      ${r.deadline && ["play", "load"].includes(r.phase) ? `<div class="stage-timer" id="timer" data-total="${r.total}"><span id="timer-num">${fmtTime(remaining())}</span></div>` : ""}
      ${["play", "shot", "load"].includes(r.phase) ? `<button class="snd" data-a="rou-view">${S.rouView === "table" ? "↩" : "🔍"}</button>` : ""}
      <button class="snd" data-a="rou-sound">${S.sound === false ? "🔇" : "🔊"}</button>
    </div><div class="stage-msg" id="stage-msg"></div><div class="stage-loading" id="stage-loading">загрузка подвала…</div>
    ${["play", "shot"].includes(r.phase) && S.rouView !== "table" ? `<div class="turn-tag ${r.turn === S.me ? "me" : ""}">${r.turn === S.me ? "ТВОЙ ХОД" : `ХОДИТ: ${esc((r.players.find((p) => p.id === r.turn) || {}).name || "")}`}</div>` : ""}</div>
    ${r.phase !== "lobby" ? statusBar() : ""}
    ${(panels[r.phase] || rouLobby)()}
    ${r.phase !== "lobby" ? `<div class="section-title">За столом</div>${rouSeats()}` : ""}
    ${r.phase !== "lobby" ? `<div class="section-title">Что происходит</div><div class="card rou-log">${(r.events || []).filter((e) => !rouSecret(e)).slice().reverse().slice(0, 7).map((e, i) =>
      `<div class="ev ${e.kind} ${i === 0 ? "new" : ""}">${esc(e.text)}</div>`).join("")}</div>` : ""}
  </div>
  ${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}

function rouSeats() {
  const r = S.room;
  return `<div class="seats">${r.seats.map((id) => { const p = r.players.find((x) => x.id === id); if (!p) return "";
    const st = p.status || {};
    const canAim = r.phase === "play" && r.turn === S.me && p.alive;
    return `<div class="seat ${r.turn === id && ["play", "shot"].includes(r.phase) ? "turn" : ""} ${p.alive ? "" : "dead"} ${id === S.me ? "me" : ""} ${r.aim === id ? "aimed" : ""}" ${canAim ? `data-a="rou-aim" data-v="${id}"` : ""}>
      ${av(p, "sm")}<div class="grow"><b>${id === S.me ? "Вы" : nm(p)}</b><div class="hearts">${hearts(p.hp, r.maxHp)}</div>
      <div class="inv">${p.items.map((k) => `<span title="${esc(RI()[k].name)}">${RI()[k].emoji}</span>`).join("") || '<span class="muted">пусто</span>'}</div>
      <div class="st">${st.vest ? "🦺" : ""}${st.mirror ? "🪞" : ""}${st.frozen ? "💫" : ""}${p.stakes ? `🪙×${p.stakes}` : ""}${r.phase === "load" && p.alive ? (p.loaded ? " ✓ зарядил(а)" : " …") : ""}</div></div></div>`; }).join("")}</div>`;
}

function rouLobby() {
  const r = S.room, s = r.settings;
  const enough = r.players.filter((p) => p.online).length >= Roulette.MIN_PLAYERS;
  return `<div class="top"><button class="avatar" data-a="leave">←</button><div class="grow"><h1>Подвал</h1>
      <div class="muted small">${r.players.length} из ${Roulette.MAX_PLAYERS} мест за столом</div></div></div>
    <div class="card code-card"><div class="muted small">КОД ДВЕРИ</div><div class="code">${r.code}</div>
      <div class="row mt"><button class="btn ghost small grow" data-a="copy">📋 Скопировать</button>
      <button class="btn small grow" data-a="share">📨 Позвать</button></div></div>
    <div class="section-title">За столом</div>${playerTiles(r.players, { kick: isHost(), peek: true })}
    <div class="section-title">Правила стола</div>
    <div class="card"><div class="row"><div class="grow small">${s.stake ? `🪙 <b>На монеты: ставка ${s.stake}</b>, выживший забирает банк ${s.stake * Math.min(r.players.length, Roulette.MAX_PLAYERS)}<br>` : "🎲 На интерес<br>"}❤️ Сердец: <b>${s.hp}</b> · ⏱ Ход: <b>${s.turnTime} с</b> · 🎒 Предметов за зарядку: <b>${s.items}</b></div>
      ${isHost() ? `<button class="btn ghost small" data-a="rou-settings">⚙️</button>` : ""}</div></div>
    ${Bots.bar(S.room)}
    ${isHost() ? `<button class="btn mt2" data-a="start" ${enough ? "" : "disabled"}>${enough ? "Закрыть дверь и начать" : `Ждём игроков (минимум ${Roulette.MIN_PLAYERS})`}</button>`
      : `<div class="card center mt2 muted">⏳ Ждём, когда хост закроет дверь…</div>`}`;
}

function rouLoad() {
  const r = S.room, me = rouMe();
  if (!me || !me.alive || r.seats.indexOf(S.me) < 0) return `<div class="card center">Остальные заряжают барабан…</div>`;
  if (r.my_load) return `<div class="card center load-done">Ты зарядил(а) <b class="${r.my_load}">${r.my_load === "live" ? "БОЕВОЙ" : "холостой"}</b> патрон.
    <div class="muted small mt">Никто не знает, что именно. Ждём остальных…</div></div>${hostSkip("Зарядить сейчас")}`;
  return `<div class="card center"><b>Заряди один патрон</b><div class="muted small mt">Что ты положил(а), не увидит никто. Подвал добавит ещё несколько своих, и все узнают, сколько всего боевых и холостых — но не порядок.</div></div>
    <div class="row mt load-btns"><button class="btn grow shell-live" data-a="rou-load" data-v="live">🔴 Боевой</button>
      <button class="btn grow shell-blank" data-a="rou-load" data-v="blank">⚪ Холостой</button></div>`;
}

function rouInspect() {
  const r = S.room, it = S.rouInspect;
  if (S.rouView !== "table") return "";
  if (!it) return `<div class="card center inspect"><b>🔍 Осмотр стола</b><div class="muted small mt">Нажми на любой предмет на столе — увидишь, что он делает. Свои вещи подписаны красным.</div>
    <button class="btn ghost small mt" data-a="rou-view">↩ Вернуться</button></div>`;
  const owner = r.players.find((p) => p.id === it.pid) || {}, mine = it.pid === S.me, info = RI()[it.key];
  const list = owner.items || [];
  if (list[it.index] !== it.key) { const j = list.indexOf(it.key); if (j < 0) { S.rouInspect = null; return rouInspect(); } it.index = j; }   // вещи сдвинулись (кража, использование)
  const canUse = mine && r.phase === "play" && r.turn === S.me;
  return `<div class="card inspect"><div class="row">${emo(info.emoji, 32)}<div class="grow"><b>${esc(info.name)}</b><div class="small muted">${mine ? "твой предмет" : "у игрока " + esc(owner.name || "")}</div></div></div>
    <div class="small mt">${esc(info.desc)}</div>
    <div class="row mt">${canUse ? `<button class="btn small grow" data-a="${info.target ? "rou-item" : "rou-use"}" data-v="${info.target ? it.index : it.index + ":"}">Использовать</button>` : ""}
      <button class="btn ghost small grow" data-a="rou-view">↩ Вернуться</button></div></div>`;
}

function rouPlay() {
  const r = S.room, me = rouMe();
  if (!me || me.seat < 0) return `<div class="card center turn-wait">👀 Ты смотришь эту партию. Следующую сыграешь за столом.</div>`;
  const mine = r.turn === S.me && r.phase === "play";
  const turnP = r.players.find((p) => p.id === r.turn) || {};
  const notes = (r.notes || []).slice().reverse();
  let out = "";
  if (!mine) {
    out += `<div class="card center turn-wait">${r.phase === "shot" ? "…" : `Ходит <b>${esc(turnP.name || "")}</b>`}${me && !me.alive ? `<div class="muted small mt">Ты выбыл(а). Смотри, чем кончится</div>` : ""}
      <div class="tiny muted mt">👀 Проведи пальцем по сцене влево-вправо, чтобы оглядеться, или нажми на игрока — посмотришь на него</div></div>`;
  } else {
    const opps = r.seats.map((id) => r.players.find((p) => p.id === id)).filter((p) => p && p.id !== S.me && p.alive);
    const sel = S.rouItem != null ? me.items[S.rouItem] : null;
    if (sel && RI()[sel].steal && S.rouSteal) {                         // что украсть
      const v = r.players.find((p) => p.id === S.rouSteal);
      out += `<div class="card"><b>🧤 Что стащить у ${esc(v.name)}?</b>
        <div class="my-items mt">${v.items.map((k, j) => `<button class="mi" data-a="rou-use" data-v="${S.rouItem}:${v.id}:${j}">${emo(RI()[k].emoji, 24)}<span>${esc(RI()[k].name)}</span></button>`).join("") || '<div class="muted">У него(неё) пусто</div>'}</div>
        <button class="btn ghost small mt" data-a="rou-item" data-v="">Отмена</button></div>`;
    } else if (sel && RI()[sel].target) {
      out += `<div class="card"><b>${emo(RI()[sel].emoji, 16)} ${esc(RI()[sel].name)}: на кого?</b>
        <div class="aim mt">${opps.map((p) => RI()[sel].steal ? `<button class="btn ghost small" data-a="rou-steal" data-v="${p.id}">${esc(p.name)} · ${p.items.map((k) => RI()[k].emoji).join("") || "пусто"}</button>`
          : `<button class="btn ghost small" data-a="rou-use" data-v="${S.rouItem}:${p.id}">${esc(p.name)}</button>`).join("")}</div>
        <button class="btn ghost small mt" data-a="rou-item" data-v="">Отмена</button></div>`;
    } else {
      const aim = r.aim, aimP = r.players.find((p) => p.id === aim);
      if (r.sawed) out += `<div class="sawed">🪚 Стволы отпилены — следующий выстрел снимет 2 сердца</div>`;
      out += `<div class="your-turn">${aim ? (aim === S.me ? "СТВОЛ СМОТРИТ НА ТЕБЯ" : `ЦЕЛЬ: ${esc(aimP.name).toUpperCase()}`) : "ТВОЙ ХОД — ВЫБЕРИ ЦЕЛЬ"}</div>
        <div class="targets"><button class="btn small ${aim === S.me ? "on" : "ghost"}" data-a="rou-aim" data-v="${S.me}">🎯 Себя</button>
        ${opps.map((p) => `<button class="btn small ${aim === p.id ? "on" : "ghost"}" data-a="rou-aim" data-v="${p.id}">🎯 ${esc(p.name)}</button>`).join("")}</div>
        <button class="btn fire mt" data-a="rou-fire" ${aim ? "" : "disabled"}>💥 Выстрел</button>
        ${S.rouView === "table" ? "" : `<button class="btn ghost small mt" data-a="rou-view">🔍 Осмотреть стол и выбрать предмет</button>`}
        <div class="small muted center mt">Можно нажать на игрока прямо за столом — дробовик повернётся на него. Холостой в себя — ещё один ход. Сначала можно использовать предметы.</div>`;
    }
    if (me.items.length) out += `<div class="section-title">Твои предметы</div><div class="my-items">${me.items.map((k, i) =>
      `<button class="mi ${S.rouItem === i ? "on" : ""}" data-a="${RI()[k].target ? "rou-item" : "rou-use"}" data-v="${RI()[k].target ? i : i + ":"}" title="${esc(RI()[k].desc)}">${emo(RI()[k].emoji, 24)}<span>${esc(RI()[k].name)}</span></button>`).join("")}</div>`;
  }
  const known = r.known || [], heard = r.heard || [];
  if (known.length || heard.length || notes.length) out += `<div class="card notes mt"><b>🗒 Что ты знаешь сейчас</b>
    ${known.map((k) => `<div class="kn ${k.live ? "live" : "blank"}">${k.at === 1 ? "▶ Следующий выстрел" : `${k.at}-й выстрел отсюда`} — <b>${k.live ? "БОЕВОЙ" : "холостой"}</b></div>`).join("")}
    ${heard.map((h) => `<div class="kn ${h.live ? "live" : "blank"}">👂 ${esc(h.name)} зарядил(а) — <b>${h.live ? "боевой" : "холостой"}</b></div>`).join("")}
    ${!known.length && !heard.length ? `<div class="small muted">Сейчас ничего точно не известно</div>` : ""}
    ${notes.length ? `<details class="mt"><summary class="tiny muted">Журнал подсказок</summary>${notes.map((n) => `<div class="n small">${esc(n)}</div>`).join("")}</details>` : ""}
    <div class="tiny muted mt">Счёт идёт от следующего выстрела и сам сдвигается после каждого. Встряска 🔄 стирает всё</div></div>`;
  return out;
}

function rouEnd() {
  const r = S.room, w = r.players.find((p) => p.id === r.winner);
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  return `<div class="win rou-win"><div class="kicker">${r.winner === S.me ? "ТЫ ВЫБРАЛСЯ(ЛАСЬ) ИЗ ПОДВАЛА" : "ДВЕРЬ ОТКРЫЛАСЬ"}</div>
      ${w ? `<div class="mt">${av(w, "big")}</div><h2>${nm(w)}</h2><p>последний(яя) за столом${w.stakes ? ` · ставок: ${w.stakes}` : ""}</p>` : "<h2>Никто</h2>"}
      ${rw ? `<div class="reward-coins">${PX() ? Pixel.sprite("coin", 3) : "🪙"} +${rw} монет</div>` : ""}</div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ещё партия</button>` : `<div class="card center mt2 muted">Хост может начать новую партию</div>`}
    <button class="btn ghost mt" data-a="leave">Подняться наверх</button>`;
}

function rouSettingsSheet() {
  const s = S.room.settings;
  const opt = (key, list, fmt) => `<div class="chips">${list.map((v) => `<button class="pill ${s[key] === v ? "on" : ""}" data-a="rou-set" data-v="${key}:${v}">${fmt(v)}</button>`).join("")}</div>`;
  return `<h2>⚙️ Правила стола</h2>
    <div class="section-title">Сердец у каждого</div>${opt("hp", Roulette.HP_OPTIONS, (v) => "❤️".repeat(v))}
    <div class="section-title">Время на ход</div>${opt("turnTime", Roulette.TURN_TIMES, (v) => `${v} с`)}
    <div class="section-title">Предметов за каждую зарядку</div>${opt("items", Roulette.ITEM_OPTIONS, (v) => (v ? v : "без предметов"))}
    <div class="section-title">Ставка (монеты, которые ты нафармил)</div>${opt("stake", Roulette.STAKES, (v) => (v ? `🪙 ${v}` : "на интерес"))}
    <div class="small muted mt">Каждый за столом ставит одинаково. Выживший забирает весь банк.</div>`;
}

/* ---------------------------------------------------------------- строка состояния, как в старых шутерах */
function statusBar() {
  const r = S.room, me = rouMe();
  const seated = me && r.seats.includes(S.me);
  const hp = seated ? me.hp : 0;
  return `<div class="dbar">
    <div class="dcell"><b class="big">${seated ? hp : "—"}</b><span>СЕРДЦА</span></div>
    <div class="dcell dshells"><b class="big"><i class="c-live">${r.drum.liveLeft}</i><i class="c-sep">/</i><i class="c-blank">${r.drum.blankLeft}</i></b><span>БОЕВ / ХОЛ</span></div>
    <div class="dface"><canvas id="dface" width="24" height="24"></canvas></div>
    <div class="dcell"><b class="big">${seated ? me.items.length : "—"}</b><span>ПРЕДМЕТЫ</span></div>
    <div class="dcell"><b class="big">${r.seats.filter((id) => { const p = r.players.find((x) => x.id === id); return p && p.alive; }).length}</b><span>ИГРОКОВ</span></div>
  </div>`;
}

// лицо в строке состояния: чем меньше сердец, тем больше крови
function drawFace() {
  const c = document.getElementById("dface"), me = rouMe();
  if (!c || !me) return;
  const g = c.getContext("2d"), r = S.room;
  const blood = me.alive ? 1 - me.hp / r.maxHp : 1;
  const paint = (img) => {
    g.fillStyle = "#2a1a14"; g.fillRect(0, 0, 24, 24);
    if (img) g.drawImage(img, 0, 0, 24, 24);
    else { g.font = "20px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(me.avatar || "🙂", 12, 13); }
    let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    g.fillStyle = "#9a000c";
    for (let i = 0; i < blood * 90; i++) { const x = rnd() * 24 | 0, y = rnd() * 24 | 0; g.fillRect(x, y, 1 + (rnd() < .3), 1); }
    for (let i = 0; i < blood * 5; i++) { const x = 3 + rnd() * 18 | 0; g.fillRect(x, 2 + rnd() * 8 | 0, 1, 4 + rnd() * 10 | 0); }
    if (!me.alive) { g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(0, 0, 24, 24); }
  };
  paint(null);
  if (me.photo) { const img = new Image(); img.referrerPolicy = "no-referrer"; img.onload = () => paint(img); img.src = me.photo; }
}

/* ---------------------------------------------------------------- 3D и анимации событий */
function rouTurnReset() {
  const k = S.room ? S.room.code + ":" + S.room.turn + ":" + S.room.phase : "";
  if (k !== S.rouTurnKey) { S.rouTurnKey = k; S.rouItem = null; S.rouSteal = null; }
}

function rouMount() {
  if (typeof Cellar !== "undefined") {
    Cellar.onPick = (pid) => ROU_ACTIONS["rou-aim"](pid);
    Cellar.onPickItem = (it) => { if (!S.room || !["play", "shot"].includes(S.room.phase)) return; S.rouInspect = it; if (S.rouView !== "table") { S.rouView = "table"; Cellar.setView("table"); } haptic(); render(); };
    Cellar.onSpin = () => Sfx.spin();
  }
  const el = document.getElementById("stage");
  if (!el) { if (typeof Cellar !== "undefined") Cellar.unmount(); return; }
  Cellar.mount(el, (err) => {
    if (!S.room || S.room.game !== "roulette" || document.getElementById("stage") !== el) return;   // экран уже сменился
    const ld = document.getElementById("stage-loading");
    if (err) { if (ld) ld.textContent = err.message; return; }
    if (ld) ld.remove();
    Cellar.sync(S.room, S.me);
    rouEvents();
  });
  drawFace();
}

function rouEvents() {
  const r = S.room;
  const evs = r.events || [];
  const top = evs.length ? evs[evs.length - 1].n : 0;
  const gameKey = r.code + ":" + (r.game_no || 0) + (r.phase === "lobby" ? ":lobby" : "");
  if (S.rouGame !== gameKey) {                                          // новая партия — чистый стол, без старых анимаций
    S.rouGame = gameKey; S.rouSeen = top; S.rouItem = null; S.rouSteal = null; S.rouInspect = null; S.rouView = null;
    Cellar.reset(); Cellar.setView(null); Cellar.sync(r, S.me); return;
  }
  evs.filter((e) => e.n > (S.rouSeen || 0)).forEach((e) => {
    Cellar.event(e, r);
    const msg = document.getElementById("stage-msg");
    if (e.kind === "shot") {
      setTimeout(() => {
        const meHit = e.live && e.hit === S.me && !e.absorbed;
        if (meHit) rouHurt(e);
        else if (e.live) { Sfx.bang(); notify("warning"); try { tg && tg.HapticFeedback.impactOccurred("heavy"); } catch (x) { /* нет */ } }
        else Sfx.click();
        const m = document.getElementById("stage-msg");
        if (m) { m.className = "stage-msg show " + (e.live ? "bang" : "blank") + (e.live && (e.absorbed || e.redirected) ? " long" : ""); m.textContent = e.live ? (e.absorbed ? "БАХ! ЖИЛЕТ" : e.redirected ? "ЗЕРКАЛО!" : e.dmg > 1 ? "БАХ! ×2" : "БАХ!") : "щёлк"; }
        if (e.live && e.out) setTimeout(Sfx.thud, 600);
      }, 700);
    } else if (e.kind === "load") { Sfx.spin(); if (msg) { msg.className = "stage-msg show load"; msg.textContent = `${e.total} патронов`; } setTimeout(() => rouLoadReveal(e), 400); }
    else if (e.kind === "item") { Sfx.blip(); if (e.item === "spin") Sfx.spin(); if (e.item === "saw") Sfx.saw(); if (e.item === "freeze") Sfx.bottle(); if (["flashlight", "box", "ear", "spin", "thief"].includes(e.item)) setTimeout(() => rouReveal(e), e.item === "spin" || e.item === "thief" ? 600 : 1600); }
    else if (e.kind === "win") Sfx.thud();
  });
  S.rouSeen = top;
}

// фонарик, шкатулка, подслушка — тайное дело: остальные видят только анимацию на столе, без надписей
const rouSecret = (e) => e.kind === "item" && ["flashlight", "box", "ear"].includes(e.item) && e.who !== S.me;

// после зарядки: сколько боевых и сколько холостых (патроны показываются и перемешиваются)
function rouLoadReveal(e) {
  if (e.live == null) return;
  const shells = [...Array(e.live).fill("live"), ...Array(e.blank).fill("blank")];
  const old = document.getElementById("rou-reveal"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-reveal"; d.className = "rou-reveal load";
  d.innerHTML = `<div class="rr-card"><div class="rr-big">🔫 Заряжено ${e.total} ${e.total < 5 ? "патрона" : "патронов"}</div>
    <div class="rr-shells">${shells.map((k, i) => `<i class="sh ${k}" style="--i:${i}"></i>`).join("")}</div>
    <div class="rr-count"><b class="c-live">🔴 ${e.live} ${e.live === 1 ? "боевой" : "боевых"}</b><b class="c-blank">⚪ ${e.blank} ${e.blank === 1 ? "холостой" : "холостых"}</b></div>
    <div class="rr-small">${e.rerolled ? "Все положили холостые — подвал перезарядил свои патроны.<br>" : ""}${e.total - e.house} от игроков и ${e.house} от подвала. Порядок — случайный, кто что положил — тайна.</div></div>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("mix"), 1300);
  setTimeout(() => d.classList.add("fade"), 4200);
  setTimeout(() => d.remove(), 4800);
}

// в тебя попали: экран мгновенно красный, кровь стекает, громкий выстрел (мимо выключателя звука), сильная вибрация
function rouHurt(e) {
  Sfx.hurtBang(); notify("error");
  try { tg && tg.HapticFeedback.impactOccurred("heavy"); setTimeout(() => tg && tg.HapticFeedback.impactOccurred("heavy"), 120); setTimeout(() => tg && tg.HapticFeedback.impactOccurred("rigid"), 260); } catch (x) { /* нет */ }
  try { navigator.vibrate && navigator.vibrate([400, 80, 250]); } catch (x) { /* нет */ }
  const old = document.getElementById("rou-hurt"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-hurt"; d.className = "rou-hurt" + (e.dmg > 1 ? " x2" : "");
  let drops = "";
  for (let i = 0; i < (e.dmg > 1 ? 26 : 16); i++) {
    const x = Math.random() * 100, y = Math.random() * 70, sz = 18 + Math.random() * 70, run = 30 + Math.random() * 160;
    drops += `<i style="left:${x}%;top:${y}%;--s:${sz | 0}px;--run:${run | 0}px;--d:${(Math.random() * .4).toFixed(2)}s"></i>`;
  }
  d.innerHTML = `<div class="rh-flash"></div><div class="rh-drops">${drops}</div><div class="rh-txt">${e.out ? "ТЫ ВЫБЫЛ(А)" : e.dmg > 1 ? "−2 ❤" : "−1 ❤"}</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("fade"), 2600);
  setTimeout(() => d.remove(), 4200);
}

// после фонарика, шкатулки, подслушки — крупный понятный текст: что именно узнал
function rouReveal(e) {
  const r = S.room; if (!r || r.game !== "roulette") return;
  const mine = e.who === S.me, it = RI()[e.item] || {}, nm = (id) => ((r.players.find((p) => p.id === id) || {}).name || "?");
  let big = "", small = "", cls = "";
  if (mine && e.item === "flashlight") {
    const n = (r.notes || []).slice().reverse().find((t) => t.startsWith("🔦")) || "", m = /№(\d+).+— (БОЕВОЙ|холостой)/.exec(n);
    if (!m) return;
    const k = Number(m[1]), live = m[2] === "БОЕВОЙ";
    cls = live ? "live" : "blank";
    big = `${k === 1 ? "Следующий патрон" : `Патрон №${k}`} — ${live ? "БОЕВОЙ" : "холостой"}`;
    small = k === 1 ? "Это тот, что выстрелит прямо сейчас" : `№1 — следующий выстрел. Этот выстрелит ${k}-м по счёту (если никто не встряхнёт дробовик)`;
  } else if (mine && e.item === "box") {
    const n = (r.notes || []).slice().reverse().find((t) => t.startsWith("📦")) || "", live = /БОЕВОЙ/.test(n);
    if (!n) return;
    cls = live ? "live" : "blank";
    big = `Следующий выстрел — ${live ? "БОЕВОЙ" : "холостой"}`;
    small = live ? "Стреляй в соперника — или отпили стволы 🪚" : "Можно смело стрелять в себя: холостой в себя — ещё один ход";
  } else if (mine && e.item === "ear") {
    const n = (r.notes || []).slice().reverse().find((t) => t.startsWith("👂")) || "", none = /ничего не знает/.test(n);
    if (!n) return;
    const what = n.replace(/^👂 Подслушал\(а\) [^:]+: /, "");
    cls = none ? "" : /БОЕВОЙ/.test(what) ? "live" : "blank";
    big = none ? `${nm(e.target)} ничего не знает про патроны` : what.charAt(0).toUpperCase() + what.slice(1);
    small = none ? "Он(а) ещё не пользовался(ась) фонариком или шкатулкой" : `Это знает ${nm(e.target)} — теперь знаешь и ты. №1 — следующий выстрел`;
  } else if (e.item === "spin") {
    big = "Патроны перемешаны"; small = "Всё, что знали про порядок патронов, — больше не верно";
  } else if (e.item === "thief") {
    if (!mine && e.target !== S.me) return;                         // чужую кражу видно на столе — без надписи
    const st = RI()[e.stolen] || {};
    big = `${mine ? "Ты стащил(а)" : e.target === S.me ? `${nm(e.who)} стащил(а) у тебя` : `${nm(e.who)} стащил(а)`}: ${st.emoji || ""} ${st.name || ""}`; small = "";
  } else return;                                                     // чужой фонарик/шкатулка/подслушка — только анимация, без надписей
  const old = document.getElementById("rou-reveal"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-reveal"; d.className = "rou-reveal " + cls;
  d.innerHTML = `<div class="rr-card"><div class="rr-ico">${emo(it.emoji || "❔", 34)}</div><div class="rr-big">${esc(big)}</div>${small ? `<div class="rr-small">${esc(small)}</div>` : ""}</div>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("fade"), mine ? 3800 : 2200);
  setTimeout(() => d.remove(), mine ? 4400 : 2800);
}

// ставка списывается один раз, когда партия началась и ты сидишь за столом
function rouStake(room) {
  if (!room.stake || !room.seats.includes(S.me) || room.phase === "lobby") return;
  const tbl = Api.table(room);
  if (tbl) {                                                         // банк стола на сервере: ставка уходит сразу, банк получит выживший
    const key = "rb:" + tbl; S.rouBank = S.rouBank || {};
    if (!S.rouBank[key]) { S.rouBank[key] = 1; Api.bet(tbl, "g", "ante", room.stake).then(() => toast(`Ставка ${room.stake} монет в банке`)).catch((e) => toast("Ставка не списалась: " + e.message)); }
    if (room.phase === "end" && isHost() && !S.rouBank[key + ":s"]) {
      S.rouBank[key + ":s"] = 1;
      setTimeout(() => Api.settle(tbl, "g", room.winner ? { [room.winner]: room.pot } : {}).catch(() => { S.rouBank[key + ":s"] = 0; }), 2000);
    }
    return;
  }
  const key = "rs:" + room.code + ":" + room.game_no;
  if (store.lastRouStake === key) return;
  store.lastRouStake = key; store.coins = Math.max(0, (store.coins || 0) - room.stake);
  saveProfile(); syncProfile(); toast(`Ставка ${room.stake} монет в банке`);
}

function recordRoulette(room) {
  const key = "rou:" + room.code + ":" + (room.game_no || 0) + ":" + room.events.slice(-1)[0].n;
  const me = room.players.find((p) => p.id === S.me);
  if (!me || me.seat < 0 || store.lastRou === key) return;
  store.lastRou = key;
  store.games = (store.games || 0) + 1;
  const won = room.winner === S.me;
  if (won) store.wins = (store.wins || 0) + 1;
  let sum = Shop.reward(won, me.alive);
  if (won && room.pot) { if (Api.table(room)) [4000, 9000].forEach((ms) => setTimeout(() => Api.coins().then(() => render()).catch(() => {}), ms)); else store.coins += room.pot; sum += room.pot; }   // банк выжившему (с сервера — переводом)
  if (won && me.stakes) { store.coins += me.stakes * 15; sum += me.stakes * 15; }
  store.lastGame = key; S.reward = { key, sum };
  saveProfile(); syncProfile();
}

const ROU_ACTIONS = {
  "rou-create": () => {
    haptic("medium"); Sfx.unlock();
    S.screen = "connecting"; S.joining = ""; render();
    Net.host({ game: "roulette" }).catch((e) => { toast(e.message); S.screen = "roulette"; render(); });
  },
  "rou-settings": () => { S.sheet = { type: "rou-settings" }; renderOverlay(); },
  "rou-set": (v) => { const [k, val] = v.split(":"); send({ t: "settings", settings: { [k]: Number(val) } }); },
  "rou-load": (v) => { Sfx.load(); send({ t: "act", slot: "load", value: v }); haptic("medium"); },
  "rou-item": (v) => { S.rouItem = v === "" ? null : Number(v); S.rouSteal = null; if (v !== "") { S.rouView = null; Cellar.setView(null); S.rouInspect = null; } haptic(); render(); },
  "rou-steal": (v) => { S.rouSteal = v; haptic(); render(); },
  "rou-use": (v) => { const [i, target, pick] = v.split(":"); const me = rouMe(); S.rouItem = null; S.rouSteal = null; S.rouInspect = null;
    send({ t: "act", slot: "item", index: Number(i), key: me && me.items[Number(i)], target: target || null, pick: pick == null || pick === "" ? null : Number(pick) }); haptic("medium"); render(); },
  "rou-view": () => { S.rouView = S.rouView === "table" ? null : "table"; S.rouInspect = null; Cellar.setView(S.rouView); haptic(); render(); },
  "rou-aim": (v) => { if (!S.room || S.room.turn !== S.me || S.room.phase !== "play") return; send({ t: "act", slot: "aim", target: v }); haptic(); },
  "rou-fire": () => { if (S.room && S.room.aim) { S.rouItem = null; send({ t: "act", slot: "shoot", target: S.room.aim }); haptic("heavy"); } },
  "rou-shoot": (v) => { S.rouItem = null; send({ t: "act", slot: "shoot", target: v }); haptic("heavy"); },
  "rou-sound": () => { S.sound = S.sound === false; store.sound = S.sound; saveProfile(); Sfx.unlock(); render(); },
};
