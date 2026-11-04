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
    cock: () => { tone(900, .03, .3, "square"); setTimeout(() => tone(500, .04, .3, "square"), 60); },          // взвёл курок
    revClick: () => { tone(2200, .025, .35, "square"); noise(.04, 4000, .3, 2); setTimeout(() => tone(700, .03, .15, "square"), 40); },
    revBang: () => { noise(.7, 2600, 1.2, 3.4); tone(110, .35, .9, "sine", .35); },
    cylSpin: () => { for (let i = 0; i < 14; i++) setTimeout(() => tone(1400 - i * 40, .015, .1, "square"), i * 45 + i * i * 2); },
    dice: () => { for (let i = 0; i < 16; i++) setTimeout(() => tone(600 + Math.random() * 900, .02, .08, "square"), i * 100 + Math.random() * 40); },
    heart: (loud) => { tone(56, .14, loud ? 1 : .5, "sine", .7); setTimeout(() => tone(48, .17, loud ? .85 : .42, "sine", .7), 150); },
    breath: () => noise(1.1, 700, .12, 1.4),
    card: () => { noise(.05, 5000, .25, 3); setTimeout(() => noise(.04, 3500, .18, 3), 60); },
    shuffle: () => { for (let i = 0; i < 12; i++) setTimeout(() => noise(.03, 4200 + Math.random() * 1500, .16, 3), i * 45 + Math.random() * 20); },
    liar: () => { tone(180, .25, .5, "square", .6); setTimeout(() => tone(120, .35, .5, "square", .5), 160); },
    bottle: () => { setTimeout(() => { tone(180, .12, .5, "square", .5); noise(.35, 6000, .45, 2); for (let i = 0; i < 5; i++) setTimeout(() => tone(2400 + Math.random() * 2400, .08, .08, "sine"), 40 + i * 50); }, 650); },   // бац и звон стекла
  };
})();
document.addEventListener("pointerdown", () => { if (S.screen === "room" && S.room && ["roulette", "revolver", "bluff"].includes(S.room.game)) Sfx.unlock(); }, { passive: true });

const RI = () => Roulette.ITEMS;
const rouMe = () => (S.room ? S.room.players.find((p) => p.id === S.me) : null);
const hearts = (n, max) => Array.from({ length: max }, (_, i) => `<i class="hrt ${i < n ? "on" : ""}"></i>`).join("");

/* ---------------------------------------------------------------- меню подвала: выбор режима */
const CELLAR_GAMES = ["roulette", "revolver", "bluff"];
const isRev = (r) => !!r && r.game === "revolver";
const isBluff = (r) => !!r && r.game === "bluff";
const modeOf = (r) => (isBluff(r) ? "bluff" : isRev(r) ? "revolver" : "roulette");
const CONTROLS = `<p>🎮 <b>Управление — от первого лица.</b> Во время партии экран сам переходит в горизонтальный вид — поверни телефон. Нажми на соперника — ствол повернётся на него, «Выстрел» — нажать на спуск, «В себя» — навести ствол на себя. Пальцем влево-вправо — оглядеться.</p>`;
function rouRulesHtml(mode) {
  if (mode === "bluff") return `
    <p>Колода: <b>6 королей, 6 дам, 6 тузов и 2 джокера</b>. Каждому раздают по ${Bluff.HAND} карт. В начале раздачи над столом появляется карта — <b>что требует стол</b>: короли, дамы или тузы. Она делает один оборот и исчезает (что требует стол — написано вверху экрана).</p>
    <p>В свой ход кладёшь рубашкой вверх <b>1–3 карты</b> и говоришь, что это то, что требует стол. <b>Джокер</b> подходит за что угодно. Можно и соврать.</p>
    <p>Следующий решает: поверить и положить свои — или сказать <b>«Не верю!»</b>. Карты вскрывают: соврал — стреляет лжец, сказал правду — стреляет тот, кто не поверил.</p>
    <p>🔫 <b>У каждого свой револьвер</b>: шесть гнёзд, один патрон, где он — не знает никто. Барабан не крутят — каждый щелчок приближает патрон. Сколько раз ты уже нажимал(а) на спуск — помни сам(а). Проигравший подносит револьвер к виску, рука дрожит — и случайная заминка перед выстрелом.</p>
    <p>🃏 <b>Джокер</b> — фиолетовая карта со звездой: подходит за любую. При вскрытии видно, чьи карты открыли, и под каждой картой — что это.</p>
    <p>Кончились карты — тебя пропускают. Остались карты только у одного — следующий обязан сказать «Не верю!». После выстрела — новая раздача и новая карта стола.</p>
    <p>🪙 На монеты: каждый ставит одинаково, последний живой забирает весь банк.</p>
    <p>🎮 Свои карты — внизу экрана: нажми на 1–3 карты и «Положить». Или «Не верю!», если не веришь тому, кто положил перед тобой.</p>`;
  if (mode === "revolver") return `
    <p>Револьвер на ${Revolver.CHAMBERS} гнёзд, патрон один, где он — не знает никто. Ходят по кругу. Никаких подсказок и счётчиков — только револьвер и нервы.</p>
    <p>В свой ход выбираешь цель — <b>себя или любого за столом</b> — и жмёшь на спуск. Выстрелило — минус сердце (обычно оно одно), барабан перезаряжается.</p>
    <p>🎖 <b>Храбрец.</b> Выстрелил(а) в себя и выжил(а) — до твоего следующего хода в тебя целиться нельзя.</p>
    <p>🔄 Раз за зарядку можно <b>крутануть барабан</b> — нажми на револьвер у себя в руке.</p>
    <p>🪙 <b>Банк.</b> Каждый ставит одинаково — сколько в банке, показывают в начале партии. Весь банк забирает последний за столом.</p>
    <p>🎯 <b>Награда за голову</b> (только когда за столом одни живые игроки, без ботов): выбил соперника — над тобой появляется <b>+${Revolver.BOUNTY} 🪙</b> и всё, что было над ним. Выбил двоих — над тобой уже 🪙100 и больше. Победил — забираешь банк и свою награду. Выбили тебя — твою награду забирает стрелок (и получает ещё ${Revolver.BOUNTY} сверху). Погиб от своей руки — награда сгорает.</p>
    <p>😰 Перед выстрелом палец замирает на спуске — случайная заминка, сердце колотится. Пуля не сносит голову: человек валится вбок, оседает на стол, сползает со стула или падает назад.</p>
    ${CONTROLS}`;
  const it = Object.values(RI());
  return `
    <p>Перед каждой зарядкой <b>каждый тайно заряжает в дробовик один патрон</b> — боевой или холостой. Подвал докладывает ещё несколько своих.</p>
    <p>Сразу после зарядки все видят, <b>сколько боевых и холостых</b> — один раз, потом считать придётся самому: счётчиков на экране нет.</p>
    <p>В свой ход целишься <b>в себя или в соперника</b>. Холостой в себя — ходишь ещё раз. Боевой — минус сердце.</p>
    <p>🎒 <b>Предметы</b> лежат перед тобой на столе — <b>не больше ${Roulette.MAX_ITEMS}</b>. У кого уже ${Roulette.MAX_ITEMS}, тому на следующей зарядке новых не дают. Нажми на свой предмет — и «Применить» (бутылку, подслушку и перчатку — потом на соперника). Что делает каждый — только здесь, в правилах: во время игры подсказок нет.</p>
    <div class="rou-items mt">${it.map((x) => `<div class="ri">${emo(x.emoji, 24)}<div><b>${esc(x.name)}</b><div class="small muted">${esc(x.desc)}</div></div></div>`).join("")}</div>
    ${CONTROLS}`;
}
function viewRouletteMenu() {
  return `<div class="fade-in">
    <div class="pxscene big" style="background-image:url(${Pixel.scene("cellar")})"></div>
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Подвал</h1>
      <div class="muted small">Стол, лампа и оружие. Выбери, во что играть</div></div></div>
    <div class="bm-modes">
      <div class="card bm-mode shotgun">
        <div class="bm-head"><div class="bm-ico">💥</div><div class="grow"><b>Последний заряд</b><div class="tiny muted">дробовик · ${Roulette.MIN_PLAYERS}–${Roulette.MAX_PLAYERS} игрока · предметы</div></div></div>
        <p class="small">Каждый тайно кладёт в дробовик патрон — боевой или холостой. Стреляешь в себя или в соперника, пользуешься предметами. Последний за столом забирает всё.</p>
        <button class="btn" data-a="rou-create" data-v="roulette">Сесть за стол</button>
      </div>
      <div class="card bm-mode revolver">
        <div class="bm-head"><div class="bm-ico">🔫</div><div class="grow"><b>Русская рулетка</b><div class="tiny muted">револьвер · ${Revolver.MIN_PLAYERS}–${Revolver.MAX_PLAYERS} игроков · награда за голову</div></div></div>
        <p class="small">В барабане на ${Revolver.CHAMBERS} гнёзд — один патрон. Последний за столом забирает банк. За каждого выбитого над тобой растёт награда за голову — выбьют тебя, её заберёт стрелок.</p>
        <button class="btn" data-a="rou-create" data-v="revolver">Сесть за стол</button>
      </div>
      <div class="card bm-mode bluff">
        <div class="bm-head"><div class="bm-ico">🎴</div><div class="grow"><b>Верю — не верю</b><span class="new-badge">NEW</span><div class="tiny muted">карты и свой револьвер · ${Bluff.MIN_PLAYERS}–${Bluff.MAX_PLAYERS} игрока</div></div></div>
        <p class="small">Стол требует королей, дам или тузов. Кладёшь карты рубашкой вверх — правду или блеф. Не поверили и поймали — стреляешь в себя. Поверили зря — стреляют они.</p>
        <button class="btn" data-a="rou-create" data-v="bluff">Сесть за стол</button>
      </div>
    </div>
    <details class="card rou-rules mt"><summary><b>Правила «Последнего заряда»</b></summary>${rouRulesHtml("roulette")}</details>
    <details class="card rou-rules mt"><summary><b>Правила «Русской рулетки»</b></summary>${rouRulesHtml("revolver")}</details>
    <details class="card rou-rules mt"><summary><b>Правила «Верю — не верю»</b></summary>${rouRulesHtml("bluff")}</details>
    <div class="section-title">Или войди по коду</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната: лобби — обычный экран, партия — на весь экран, от первого лица */
function viewRouletteRoom() {
  const r = S.room;
  rouStake(r);
  if (r.phase === "lobby") {
    const fk = r.code + ":l", fade = S.rouFade !== fk; S.rouFade = fk;
    return `${netBanner()}<div class="${fade ? "fade-in" : ""}">
      <div class="stage ${isRev(r) ? "rev" : ""}" id="stage"><div class="stage-hud"><div class="drum">ПОДВАЛ</div><button class="snd" data-a="rou-sound">${S.sound === false ? "🔇" : "🔊"}</button></div>
        <div class="stage-msg" id="stage-msg"></div><div class="stage-loading" id="stage-loading">загрузка подвала…</div></div>
      ${rouLobby()}</div>
      ${r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
  }
  S.rouFade = r.code + ":g";
  return cellarFs(r);
}

function cellarFs(r) {
  const me = rouMe(), seated = !!me && r.seats.includes(S.me), bl = isBluff(r), rv = isRev(r);
  const mine = seated && me.alive && r.turn === S.me && r.phase === "play" && !BQ.busy;
  const turnP = r.players.find((p) => p.id === r.turn) || {};
  const tag = ["play", "shot"].includes(r.phase) && !BQ.busy ? `<div class="cfs-turn ${r.turn === S.me ? "me" : ""}">${r.turn === S.me ? "ТВОЙ ХОД" : "ХОДИТ: " + esc(turnP.name || "").toUpperCase()}</div>` : "";
  const timer = r.deadline && ["play", "load"].includes(r.phase) ? `<div class="cfs-timer" id="timer" data-total="${r.total}"><span id="timer-num">${fmtTime(remaining())}</span></div>` : "";
  const hp = seated && me.alive && ((!bl && r.maxHp > 1) || (rv && me.bounty)) ? `<div class="cfs-hp">${rv && me.bounty ? `<span class="cfs-bounty">🎯 🪙${me.bounty}</span>` : ""}${!bl && r.maxHp > 1 ? hearts(me.hp, r.maxHp) : ""}</div>` : "";
  const rank = bl && r.table && r.table.rank ? `<div class="cfs-rank">СТОЛ: <b>${Bluff.RANKS[r.table.rank].many.toUpperCase()}</b></div>` : "";
  const sub = S.rouSub && Date.now() - S.rouSub.at < 5200 ? `<div class="cfs-sub show" id="cfs-sub" style="animation-delay:-${((Date.now() - S.rouSub.at) / 1000).toFixed(2)}s">${esc(S.rouSub.text)}</div>` : `<div class="cfs-sub" id="cfs-sub"></div>`;
  const controls = r.phase === "end" ? `<div class="cfs-end"><div class="cfs-endc">${rouEnd()}</div></div>` : bl ? bluffControls(r, me, mine) : rv ? revControls(r, me, mine) : rouControls(r, me, mine);
  return `${netBanner()}<div class="cfs ${bl ? "bl" : rv ? "rv" : "sg"}" id="cfs">
    <div class="stage fs ${rv ? "rev" : ""}" id="stage"><div class="stage-msg" id="stage-msg"></div><div class="stage-loading" id="stage-loading">загрузка подвала…</div></div>
    <div class="cfs-top">
      <div class="cfs-btns"><button data-a="leave" title="Выйти">🚪</button><button data-a="rou-sound">${S.sound === false ? "🔇" : "🔊"}</button>${r.players.length > 1 ? `<button data-a="chat">💬<span id="chat-badge"></span></button>` : ""}<button data-a="rou-rot" title="Повернуть экран">⟲</button></div>
      <div class="cfs-mid">${rank}${tag}${timer}</div>${hp}
    </div>
    ${sub}${controls}
  </div>`;
}

const cfsWatch = (me) => (!me || me.seat < 0 ? `<div class="cfs-note">👀 Ты смотришь партию — следующую сыграешь за столом</div>` : !me.alive ? `<div class="cfs-note">Ты выбыл(а) — смотри, чем кончится</div>` : null);
function fireBtns(r) {
  const aim = r.aim, self = aim === S.me;
  return `${aim ? "" : `<div class="cfs-note dim">нажми на соперника — или «В себя»</div>`}
    <div class="cfs-act"><button class="act self ${self ? "on" : ""}" data-a="rou-aim" data-v="${S.me}">В СЕБЯ</button><button class="act fire" data-a="rou-fire" ${aim ? "" : "disabled"}>ВЫСТРЕЛ</button></div>`;
}
// «Последний заряд»: зарядка, предметы на столе, выстрел
function rouControls(r, me) {
  const w = cfsWatch(me); if (w) return w;
  if (r.phase === "load") {
    if (r.my_load) return `<div class="cfs-note">Заряжено: <b class="sh-${r.my_load}">${r.my_load === "live" ? "боевой" : "холостой"}</b>. Ждём остальных…</div>`;
    return `<div class="cfs-load"><div class="cfs-q">Заряди один патрон — никто не увидит какой</div>
      <div class="row"><button class="shell live" data-a="rou-load" data-v="live"><i></i>БОЕВОЙ</button><button class="shell blank" data-a="rou-load" data-v="blank"><i></i>ХОЛОСТОЙ</button></div></div>`;
  }
  if (!(r.turn === S.me && r.phase === "play") || BQ.busy) return "";
  const sel = S.rouItem != null ? me.items[S.rouItem] : null, it = sel ? RI()[sel] : null;
  const cancel = `<button class="act ghost" data-a="rou-item" data-v="">✕</button>`;
  if (it && it.steal && S.rouSteal) {
    const v = r.players.find((p) => p.id === S.rouSteal) || { items: [], name: "" };
    return `<div class="cfs-pick"><div class="cfs-q">${emo(it.emoji, 16)} Что забрать у ${esc(v.name)}?</div>
      <div class="row">${v.items.map((k, j) => `<button class="pk" data-a="rou-use" data-v="${S.rouItem}:${v.id}:${j}">${emo(RI()[k].emoji, 26)}</button>`).join("") || '<span class="muted small">у него(неё) пусто</span>'}</div></div>
      <div class="cfs-act">${cancel}</div>`;
  }
  if (it && it.target) return `<div class="cfs-note hot">${emo(it.emoji, 16)} → нажми на соперника</div><div class="cfs-act">${cancel}</div>`;
  if (it) return `<div class="cfs-act">${cancel}<button class="act use" data-a="rou-use" data-v="${S.rouItem}:">${emo(it.emoji, 18)} ПРИМЕНИТЬ</button></div>`;
  return fireBtns(r);
}
// «Русская рулетка»: только выстрел — в соперника или в себя; барабан крутят, нажав на револьвер
function revControls(r, me, mine) {
  const w = cfsWatch(me); if (w) return w;
  if (!mine) return me.brave ? `<div class="cfs-note">🎖 Ты храбрец — до твоего хода в тебя не целятся</div>` : "";
  return fireBtns(r);
}
// «Верю — не верю»: свои карты внизу, «Положить» и «Не верю!»
const CARD_HTML = { K: ["К", "♚"], Q: ["Д", "♛"], A: ["Т", "♠"], J: ["★", "🃏"] };
const CARD_NAME = { K: "король", Q: "дама", A: "туз", J: "джокер" };
// карта в руке и при вскрытии; у джокера — своя фиолетовая рубашка и подпись, чтобы не спутать с дамой
const cardInner = (c) => `<b>${CARD_HTML[c][0]}</b><i>${CARD_HTML[c][1]}</i><b class="br">${CARD_HTML[c][0]}</b>${c === "J" ? "<em>ДЖОКЕР</em>" : ""}`;
function bluffControls(r, me, mine) {
  const w = cfsWatch(me); if (w) return w;
  const hand = r.hand || [], sel = (S.bluffSel || []).filter((i) => i < hand.length), n = hand.length;
  const canPlay = mine && n > 0 && !r.must_call;
  const cards = hand.map((c, i) => {
    const k = i - (n - 1) / 2, on = sel.includes(i);
    return `<button class="bcard r-${c} ${on ? "on" : ""}" ${canPlay ? `data-a="bluff-pick" data-v="${i}"` : "disabled"} style="transform:translateY(${Math.abs(k) * 5 - (on ? 26 : 0)}px) rotate(${k * 6}deg)">${cardInner(c)}</button>`;
  }).join("");
  const note = mine && r.must_call ? `<div class="cfs-note hot up">Карт нет — остаётся только «Не верю!»</div>` : "";
  return `${note}<div class="cfs-hand ${canPlay ? "live" : ""}">${cards}</div>
    ${mine ? `<div class="cfs-act">${r.can_call ? `<button class="act call" data-a="bluff-call">НЕ ВЕРЮ!</button>` : ""}${canPlay ? `<button class="act fire" data-a="bluff-play" ${sel.length ? "" : "disabled"}>ПОЛОЖИТЬ${sel.length ? `<small>${sel.length}</small>` : ""}</button>` : ""}</div>` : ""}`;
}

// страница на весь экран и горизонтально: если телефон вертикальный — поворачиваем всю страницу (body.cfs-rot)
function rouFs() {
  const on = !!document.getElementById("cfs");
  const rot = on && store.rouRot !== false && window.innerHeight > window.innerWidth;
  const was = document.body.classList.contains("cfs-rot");
  document.documentElement.style.setProperty("--fs-w", window.innerWidth + "px");
  document.documentElement.style.setProperty("--fs-h", window.innerHeight + "px");
  document.body.classList.toggle("cfs-on", on);
  document.body.classList.toggle("cfs-rot", rot);
  if (on !== !!S.rouFsOn) {
    S.rouFsOn = on;
    try { if (tg && tg.isVersionAtLeast && tg.isVersionAtLeast("8.0")) { if (on && !tg.isFullscreen) tg.requestFullscreen(); else if (!on && tg.isFullscreen) tg.exitFullscreen(); } } catch (e) { /* старый клиент */ }
  }
  if (on !== !!S.rouFsWas || rot !== was) { S.rouFsWas = on; if (typeof Cellar !== "undefined") setTimeout(() => Cellar.resize(), 30); }
}
window.addEventListener("resize", () => { if (S.screen === "room" && S.room && CELLAR_GAMES.includes(S.room.game)) rouFs(); });

function rouLobby() {
  const r = S.room, s = r.settings, mode = modeOf(r), M = { roulette: Roulette, revolver: Revolver, bluff: Bluff }[mode];
  const enough = r.players.filter((p) => p.online).length >= M.MIN_PLAYERS;
  const title = { roulette: "Последний заряд", revolver: "Русская рулетка", bluff: "Верю — не верю" }[mode];
  const line = mode === "revolver" ? `❤️ Сердец: <b>${s.hp}</b> · ⏱ Ход: <b>${s.turnTime} с</b> · 🔫 ${Revolver.CHAMBERS} гнёзд, 1 патрон`
    : mode === "bluff" ? `⏱ Ход: <b>${s.turnTime} с</b> · 🎴 по ${Bluff.HAND} карт · 🔫 у каждого свой револьвер`
    : `❤️ Сердец: <b>${s.hp}</b> · ⏱ Ход: <b>${s.turnTime} с</b> · 🎒 Предметов за зарядку: <b>${s.items}</b> (не больше ${Roulette.MAX_ITEMS})`;
  return lobbyBento({ kicker: "Подвал", title, codeLabel: "Код двери", countLabel: "Мест", seats: "За столом", max: M.MAX_PLAYERS,
    settings: "rou-settings", scene: "cellar", rulesLabel: "Правила стола",
    rules: `<div class="small">${s.stake ? `🪙 <b>На монеты: ставка ${s.stake}</b>, банк ${s.stake * Math.min(r.players.length, M.MAX_PLAYERS)}${mode === "revolver"  ? ", последний забирает всё + 🎯 награда за головы" : ", выживший забирает всё"}<br>` : "🎲 На интерес<br>"}${line}</div>
      <button class="btn ghost small mt" data-a="rou-rules">📖 Как играть</button>`,
    enough, start: "Закрыть дверь и начать", waitText: `Ждём игроков (минимум ${M.MIN_PLAYERS})`, hostWait: "Ждём, когда хост закроет дверь…" });
}

function rouEnd() {
  const r = S.room, w = r.players.find((p) => p.id === r.winner);
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  return `<div class="win rou-win"><div class="kicker">${r.winner === S.me ? "ТЫ ВЫБРАЛСЯ(ЛАСЬ) ИЗ ПОДВАЛА" : "ДВЕРЬ ОТКРЫЛАСЬ"}</div>
      ${w ? `<div class="mt">${av(w, "big")}</div><h2>${nm(w)}</h2><p>последний(яя) за столом${w.stakes ? ` · ставок: ${w.stakes}` : ""}${r.pot ? ` · банк 🪙${r.pot}` : ""}${isRev(r) && w.bounty ? ` · 🎯 награда 🪙${w.bounty}` : ""}</p>` : "<h2>Никто</h2>"}
      ${rw ? `<div class="reward-coins">${PX() ? Pixel.sprite("coin", 3) : "🪙"} +${rw} монет</div>` : ""}</div>
    <div class="row mt">${isHost() ? `<button class="btn grow" data-a="again">🔁 Ещё партия</button>` : `<div class="card center grow muted small">Хост может начать новую партию</div>`}
    <button class="btn ghost grow" data-a="leave">Наверх</button></div>`;
}

function rouSettingsSheet() {
  const s = S.room.settings, mode = modeOf(S.room), M = { roulette: Roulette, revolver: Revolver, bluff: Bluff }[mode];
  const opt = (key, list, fmt) => `<div class="chips">${list.map((v) => `<button class="pill ${s[key] === v ? "on" : ""}" data-a="rou-set" data-v="${key}:${v}">${fmt(v)}</button>`).join("")}</div>`;
  return `<h2>⚙️ Правила стола</h2>
    ${mode === "bluff" ? "" : `<div class="section-title">Сердец у каждого</div>${opt("hp", M.HP_OPTIONS, (v) => "❤️".repeat(v))}`}
    <div class="section-title">Время на ход</div>${opt("turnTime", M.TURN_TIMES, (v) => `${v} с`)}
    ${mode === "roulette" ? `<div class="section-title">Предметов за каждую зарядку</div>${opt("items", Roulette.ITEM_OPTIONS, (v) => (v ? v : "без предметов"))}<div class="tiny muted">Больше ${Roulette.MAX_ITEMS} предметов на руках не бывает</div>` : ""}
    <div class="section-title">Ставка (монеты, которые ты нафармил)</div>${opt("stake", M.STAKES, (v) => (v ? `🪙 ${v}` : "на интерес"))}
    ${stakeOwnRow(s.stake, M.STAKE_MAX, M.STAKES)}
    <div class="small muted mt">Каждый за столом ставит одинаково. Последний за столом забирает весь банк.${mode === "revolver" ? ` С живыми игроками ещё и награда за голову: +${Revolver.BOUNTY} 🪙 за каждого выбитого.` : ""}</div>`;
}

// своя сумма ставки — больше, чем на кнопках (общая для подвала и блэкджека)
function stakeOwnRow(cur, max, presets) {
  return `<div class="stake-own mt"><input class="input" id="stake-own" type="number" inputmode="numeric" min="1" max="${max}" step="1" placeholder="Своя ставка: 1–${max}" value="${cur && !presets.includes(cur) ? cur : ""}">
    <button class="btn small" data-a="stake-own" data-v="${max}">Поставить</button></div>
    ${cur && !presets.includes(cur) ? `<div class="tiny muted mt">Сейчас своя ставка: 🪙 ${cur}</div>` : ""}`;
}

/* ---------------------------------------------------------------- 3D и анимации событий */
function rouTurnReset() {
  const k = S.room ? S.room.code + ":" + S.room.turn + ":" + S.room.phase + ":" + ((S.room.table || {}).pile || 0) : "";
  if (k !== S.rouTurnKey) { S.rouTurnKey = k; S.rouItem = null; S.rouSteal = null; S.bluffSel = []; }
}

function rouMount() {
  rouFs();
  if (typeof Cellar !== "undefined") {
    // нажал на соперника: предмет «на кого-то» — применить к нему, иначе — навести ствол
    Cellar.onPick = (pid) => {
      const r = S.room, me = rouMe(); if (!r || r.turn !== S.me || r.phase !== "play" || BQ.busy) return;
      const it = S.rouItem != null && me ? RI()[me.items[S.rouItem]] : null;
      if (it && it.target) { if (it.steal) { S.rouSteal = pid; haptic(); render(); } else ROU_ACTIONS["rou-use"](`${S.rouItem}:${pid}`); return; }
      const p = r.players.find((x) => x.id === pid);
      if (isRev(r) && p && p.brave) { toast(`${p.name} — храбрец: до своего хода в него(неё) целиться нельзя`); return; }
      ROU_ACTIONS["rou-aim"](pid);
    };
    // нажал на свой предмет на столе: выбрать (ещё раз — снять выбор)
    Cellar.onPickItem = (it) => {
      const r = S.room; if (!r || r.game !== "roulette" || it.pid !== S.me || r.turn !== S.me || r.phase !== "play" || BQ.busy) return;
      S.rouItem = S.rouItem === it.index ? null : it.index; S.rouSteal = null; haptic(); render();
    };
    // нажал на револьвер в руке: крутануть барабан (раз за зарядку)
    Cellar.onPickGun = () => { const me = rouMe(); if (!me || me.spun) return toast("Барабан в эту зарядку уже крутили"); ROU_ACTIONS["rev-spin"](); };
    Cellar.onSpin = () => Sfx.spin();
    Cellar.select(S.rouItem);
  }
  const el = document.getElementById("stage");
  if (!el) { if (typeof Cellar !== "undefined") Cellar.unmount(); return; }
  Cellar.mount(el, (err) => {
    if (!S.room || !CELLAR_GAMES.includes(S.room.game) || document.getElementById("stage") !== el) return;   // экран уже сменился
    const ld = document.getElementById("stage-loading");
    if (err) { if (ld) ld.textContent = err.message; return; }
    if (ld) ld.remove();
    Cellar.sync(S.room, S.me);
    rouEvents();
  });
}

/* ---------------------------------------------------------------- очередь: стол меняется только когда доиграла анимация
   Пришло новое состояние с выстрелом — сначала играем выстрел (на экране ещё старые сердца, патроны, звёздочки),
   и только когда пуля долетела и кровь упала, показываем новое состояние. Следующие состояния ждут своей очереди. */
const BQ = { q: [], busy: false, timer: 0 };
const bqKey = (r) => r.code + ":" + (r.game_no || 0) + (r.phase === "lobby" ? ":lobby" : "");
function bqHold(m) {                                                    // true — сообщение придержано
  const r = m.room;
  if (!r || !CELLAR_GAMES.includes(r.game)) return false;
  const shown = S.room;
  if (S.screen !== "room" || !shown || shown.code !== r.code || typeof Cellar === "undefined" || !Cellar.ready() || S.rouGame !== bqKey(r) || !document.getElementById("stage")) { bqFlush(); return false; }
  const top = (x) => { const e = x.events || []; return e.length ? e[e.length - 1].n : 0; };
  const last = BQ.q[BQ.q.length - 1], fresh = top(r) > (last ? top(last.room) : S.rouSeen || 0);
  if (!fresh && last && !last._fresh) BQ.q[BQ.q.length - 1] = m;       // подряд состояния без событий (наводка, чат) — нужен только последний
  else { m._fresh = fresh; BQ.q.push(m); }
  if (!BQ.busy) bqNext();
  return true;
}
function bqFlush() { clearTimeout(BQ.timer); const q = BQ.q; BQ.q = []; BQ.busy = false; return q; }
function bqNext() {
  const m = BQ.q.shift();
  if (!m) { BQ.busy = false; return; }
  const r = m.room, evs = (r.events || []).filter((e) => e.n > (S.rouSeen || 0));
  if (evs.length) S.rouSeen = evs[evs.length - 1].n;
  const fast = BQ.q.filter((x) => x._fresh).length >= 4;               // сильно отстали — догоняем без анимаций
  let t = 0;
  if (!fast) evs.forEach((e) => { const at = t; if (at <= 0) rouPlay1(e, r); else setTimeout(() => rouPlay1(e, r), at * 1000); t += Cellar.timing(e).hold; });
  if (t <= 0) { BQ.busy = BQ.q.length > 0; onMessage(m, true); return bqNext(); }
  const was = BQ.busy; BQ.busy = true;
  if (!was) render();                                                    // кнопки «выстрел» и т. п. — неактивны, пока идёт анимация
  BQ.timer = setTimeout(() => { BQ.busy = BQ.q.length > 0; onMessage(m, true); bqNext(); }, t * 1000);
}

function rouEvents() {
  const r = S.room;
  const evs = r.events || [];
  const top = evs.length ? evs[evs.length - 1].n : 0;
  const gameKey = bqKey(r);
  if (S.rouGame !== gameKey) {                                          // новая партия — чистый стол, без старых анимаций
    S.rouGame = gameKey; S.rouSeen = top; S.rouItem = null; S.rouSteal = null; S.rouInspect = null; S.rouView = null;
    Cellar.reset(); Cellar.setView(null); Cellar.sync(r, S.me);
    if (r.phase !== "lobby" && evs.length && evs[0].kind === "start" && evs.length <= 4) evs.forEach((e) => rouPlay1(e, r));   // только что началась: банк, раздача, карта стола
    return;
  }
  evs.filter((e) => e.n > (S.rouSeen || 0)).forEach((e) => rouPlay1(e, r));
  S.rouSeen = Math.max(S.rouSeen || 0, top);
}

// одно событие: 3D-анимация, звук и надпись — звук выстрела ровно в момент удара
// заминка перед выстрелом: сердце бьётся всё чаще, у того, кто стреляет или под прицелом, — громко и с вибрацией
const RH = { timers: [] };
function rouHeart(e, tm) {
  const w = e.wait || 0; if (!w) return;
  RH.timers.forEach(clearTimeout); RH.timers = [];
  const mine = e.who === S.me || e.target === S.me, end = tm.when - .12;
  let at = Math.max(0, tm.when - w), gap = .82;
  RH.timers.push(setTimeout(() => Sfx.breath(), at * 1000));
  while (at < end) {
    RH.timers.push(setTimeout(() => { Sfx.heart(mine); if (mine) haptic("light"); }, at * 1000));
    at += gap; gap = Math.max(.36, gap * .86);
  }
}
function rouSub(text) {
  S.rouSub = { text, at: Date.now() };
  const el = document.getElementById("cfs-sub"); if (!el) return;
  el.textContent = text; el.style.animationDelay = "0s"; el.classList.remove("show"); void el.offsetWidth; el.classList.add("show");
}
function rouPlay1(e, r) {
  Cellar.event(e, r);
  const rv = isRev(r) || isBluff(r), tm = Cellar.timing(e);
  if (e.text && !rouSecret(e) && e.kind !== "load") setTimeout(() => rouSub(e.text), e.kind === "shot" ? tm.when * 1000 : e.kind === "call" ? 2300 : 0);
  if (isBluff(r)) return bluffPlay1(e, r, tm);
  const msg = (cls, text) => { const m = document.getElementById("stage-msg"); if (m) { m.className = "stage-msg show " + cls; m.textContent = text; } };
  if (e.kind === "start") setTimeout(() => rouPotIntro(r), 300);
  if (e.kind === "shot") {
    rouHeart(e, tm);
    if (e.dice) setTimeout(() => rouDice(e, r), 1050 + (e.wait || 0) * 1000);
    if (rv && e.self) setTimeout(() => Sfx.cock(), 250);
    setTimeout(() => {
      const meHit = e.live && e.hit === S.me && !e.absorbed;
      if (meHit) rouHurt(e);
      else if (e.live) { (rv ? Sfx.revBang : Sfx.bang)(); notify("warning"); try { tg && tg.HapticFeedback.impactOccurred("heavy"); } catch (x) { /* нет */ } }
      else (rv ? Sfx.revClick : Sfx.click)();
      msg((e.live ? "bang" : "blank") + (e.live && (e.absorbed || e.redirected) ? " long" : ""),
        e.live ? (e.absorbed ? "БАХ! ЖИЛЕТ" : e.dice ? "РИКОШЕТ!" : e.redirected ? "ЗЕРКАЛО!" : e.dmg > 1 ? "БАХ! ×2" : "БАХ!") : "щёлк");
      if (e.live && e.out) setTimeout(Sfx.thud, e.death === "head" ? 950 : 600);
    }, tm.when * 1000);
  } else if (e.kind === "load") {
    Sfx.spin();
    if (rv) msg("load", "1 патрон из " + (e.chambers || 6));
    else { msg("load", `${e.total} патронов`); setTimeout(() => rouLoadReveal(e), 400); }
  } else if (e.kind === "spin") { Sfx.cylSpin(); msg("load", "барабан раскручен"); }
  else if (e.kind === "item") { Sfx.blip(); if (e.item === "spin") Sfx.spin(); if (e.item === "saw") Sfx.saw(); if (e.item === "freeze") Sfx.bottle(); if (["flashlight", "box", "ear", "spin", "thief"].includes(e.item)) setTimeout(() => rouReveal(e), e.item === "spin" || e.item === "thief" ? 600 : 1600); }
  else if (e.kind === "win") Sfx.thud();
}

// «Верю — не верю»: раздача, карты на стол, вскрытие, выстрел
function bluffPlay1(e, r, tm) {
  const msg = (cls, text) => { const m = document.getElementById("stage-msg"); if (m) { m.className = "stage-msg show " + cls; m.textContent = text; } };
  if (e.kind === "deal") { Sfx.shuffle(); msg("load", Bluff.RANKS[e.rank].many.toUpperCase()); }
  else if (e.kind === "play") Sfx.card();
  else if (e.kind === "call") { Sfx.liar(); msg("bang", "НЕ ВЕРЮ!"); haptic("heavy"); setTimeout(() => bluffReveal(e, r), 750); }
  else if (e.kind === "start") setTimeout(() => rouPotIntro(r), 300);
  else if (e.kind === "shot") {
    rouHeart(e, tm);
    setTimeout(() => Sfx.cock(), 900);
    setTimeout(() => {
      if (e.live && e.hit === S.me) rouHurt(e);
      else if (e.live) { Sfx.revBang(); notify("warning"); try { tg && tg.HapticFeedback.impactOccurred("heavy"); } catch (x) { /* нет */ } }
      else Sfx.revClick();
      msg(e.live ? "bang" : "blank", e.live ? "БАХ!" : "щёлк");
      if (e.live && e.out) setTimeout(Sfx.thud, 950);
    }, tm.when * 1000);
  } else if (e.kind === "win") Sfx.thud();
}
// начало партии: сколько в банке и за что капают монеты
function rouPotIntro(r) {
  const bounty = isRev(r) && r.bounty_on;
  if (!r.pot && !bounty) return;
  const old = document.getElementById("rou-reveal"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-reveal"; d.className = "rou-reveal pot";
  d.innerHTML = `<div class="rr-card">${r.pot ? `<div class="rr-small">БАНК ПАРТИИ</div><div class="rr-big">🪙 ${r.pot}</div><div class="rr-small">заберёт последний за столом</div>` : `<div class="rr-big">🎯 Награда за голову</div>`}
    ${bounty ? `<div class="rr-small mt">🎯 За каждого выбитого — <b>+${Revolver.BOUNTY} 🪙 над головой</b>. Выбьют тебя — всё, что над тобой, заберёт стрелок. Победишь — заберёшь банк и свою награду.</div>` : ""}</div>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("fade"), 3600);
  setTimeout(() => d.remove(), 4100);
}

// вскрытие: чьи карты, что он сказал, каждая карта с подписью и почему правда или враньё
function bluffReveal(e, r) {
  const nm = (id) => (id === S.me ? "ты" : ((r.players.find((p) => p.id === id) || {}).name || "?"));
  const many = Bluff.RANKS[e.rank].many.toLowerCase(), bad = e.cards.filter((c) => c !== e.rank && c !== "J");
  const why = e.truth ? (e.cards.includes("J") ? `все карты — ${many} (джокер подходит за любую)` : `все карты — ${many}`)
    : `${bad.map((c) => CARD_NAME[c]).join(", ")} — не ${Bluff.RANKS[e.rank].forms[0]}`;
  const old = document.getElementById("rou-reveal"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-reveal"; d.className = "rou-reveal bluff " + (e.truth ? "blank" : "live");
  d.innerHTML = `<div class="rr-card"><div class="rr-small">${esc(nm(e.who))} не поверил(а). Вскрываем карты: <b>${esc(nm(e.target))}</b></div>
    <div class="rr-small">сказал(а): «${esc(Bluff.claimText(e.cards.length, e.rank))}»</div>
    <div class="bl-cards">${e.cards.map((c, i) => `<div class="bl-c" style="--i:${i}"><span class="bcard r-${c} ${c === e.rank || c === "J" ? "ok" : "bad"}">${cardInner(c)}</span><small>${CARD_NAME[c]}</small></div>`).join("")}</div>
    <div class="rr-big">${e.truth ? "ПРАВДА" : "ВРАНЬЁ!"}</div><div class="rr-small">${esc(why)}</div><div class="rr-small">Стреляет в себя: <b>${esc(nm(e.loser))}</b></div></div>`;
  d.onclick = () => d.remove();
  document.body.appendChild(d);
  setTimeout(() => d.classList.add("fade"), 2300);
  setTimeout(() => d.remove(), 2800);
}

// два зеркала: пуля мечется по столу, а у каждого (кроме стрелка) катится кубик 1–50
function rouDice(e, r) {
  const ids = Object.keys(e.dice || {}); if (!ids.length) return;
  const nm = (id) => (id === S.me ? "Ты" : ((r.players.find((p) => p.id === id) || {}).name || "?"));
  const old = document.getElementById("rou-dice"); if (old) old.remove();
  const d = document.createElement("div"); d.id = "rou-dice"; d.className = "rou-dice";
  d.innerHTML = `<div class="rd-card"><div class="rd-t">🪞🪞 Двойной рикошет!</div><div class="rd-s">Пуля мечется между зеркалами. Кубики 1–50: у кого больше — в того и попадёт</div>
    ${ids.map((id) => `<div class="rd-row" data-id="${esc(id)}"><span class="rd-n">${esc(nm(id))}</span><b class="rd-v">?</b></div>`).join("")}</div>`;
  document.body.appendChild(d);
  Sfx.dice();
  const rows = [...d.querySelectorAll(".rd-row")];
  const iv = setInterval(() => rows.forEach((row) => { row.querySelector(".rd-v").textContent = 1 + Math.floor(Math.random() * 50); }), 70);
  setTimeout(() => {
    clearInterval(iv);
    rows.forEach((row) => { const id = row.dataset.id; row.querySelector(".rd-v").textContent = e.dice[id]; row.classList.add(id === e.hit ? "win" : "lose"); });
    Sfx.blip();
  }, 1800);
  setTimeout(() => d.classList.add("fade"), 2900);
  setTimeout(() => d.remove(), 3400);
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
      setTimeout(() => Api.settle(tbl, "g", room.payout || (room.winner ? { [room.winner]: room.pot } : {})).catch(() => { S.rouBank[key + ":s"] = 0; }), 2000);
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
  let sum = gameReward(room, won, me.alive);
  const share = room.payout ? room.payout[S.me] || 0 : won ? room.pot || 0 : 0;   // банк — выжившему
  if (share) { if (Api.table(room)) [4000, 9000].forEach((ms) => setTimeout(() => Api.coins().then(() => render()).catch(() => {}), ms)); else store.coins += share; sum += share; }   // с сервера — переводом из банка стола
  if (won && me.stakes) { store.coins += me.stakes * 15; sum += me.stakes * 15; }
  if (isRev(room) && won && room.bounty_on && me.bounty) { store.coins += me.bounty; sum += me.bounty; }   // награда за голову — победителю (только с живыми игроками)
  store.lastGame = key; S.reward = { key, sum };
  saveProfile(); syncProfile();
}

const ROU_ACTIONS = {
  "rou-create": (v) => {
    haptic("medium"); Sfx.unlock();
    S.screen = "connecting"; S.joining = ""; render();
    Net.host({ game: ["revolver", "bluff"].includes(v) ? v : "roulette" }).catch((e) => { toast(e.message); S.screen = "roulette"; render(); });
  },
  "rev-spin": () => { if (!S.room || S.room.turn !== S.me || BQ.busy) return; send({ t: "act", slot: "spin" }); haptic("medium"); },
  "stake-own": (v) => {                                                 // своя ставка: проверяем, хватает ли своих монет
    const max = Number(v) || 10000, el = document.getElementById("stake-own"), n = Math.floor(Number(el && el.value));
    if (!(n >= 1 && n <= max)) return toast(`Ставка — целое число от 1 до ${max}`);
    const have = (Api.state && Api.state.coins != null) ? Api.state.coins : store.coins || 0;
    if (n > have) return toast(`У тебя только ${have} монет`);
    send({ t: "settings", settings: { stake: n } }); haptic("medium"); S.sheet = null; renderOverlay();
  },
  "rou-settings": () => { S.sheet = { type: "rou-settings" }; renderOverlay(); },
  "rou-rules": () => { S.sheet = { type: "rou-rules" }; renderOverlay(); },
  "rou-rot": () => { store.rouRot = store.rouRot === false; saveProfile(); toast(store.rouRot === false ? "Экран не поворачивается" : "Горизонтальный вид"); rouFs(); },
  "bluff-pick": (v) => { const i = Number(v), sel = (S.bluffSel || []).slice(), j = sel.indexOf(i);
    if (j >= 0) sel.splice(j, 1); else if (sel.length >= Bluff.MAX_PLAY) return toast(`Не больше ${Bluff.MAX_PLAY} карт за раз`); else sel.push(i);
    S.bluffSel = sel; haptic(); render(); },
  "bluff-play": () => { const r = S.room, sel = S.bluffSel || []; if (!r || r.turn !== S.me || BQ.busy || !sel.length) return;
    send({ t: "act", slot: "play", cards: sel.slice(), expect: (r.hand || []).slice() }); S.bluffSel = []; Sfx.card(); haptic("medium"); },
  "bluff-call": () => { if (!S.room || S.room.turn !== S.me || BQ.busy) return; send({ t: "act", slot: "call" }); haptic("heavy"); },
  "rou-set": (v) => { const [k, val] = v.split(":"); send({ t: "settings", settings: { [k]: Number(val) } }); },
  "rou-load": (v) => { Sfx.load(); send({ t: "act", slot: "load", value: v }); haptic("medium"); },
  "rou-item": (v) => { S.rouItem = v === "" ? null : Number(v); S.rouSteal = null; haptic(); render(); },
  "rou-steal": (v) => { S.rouSteal = v; haptic(); render(); },
  "rou-use": (v) => { const [i, target, pick] = v.split(":"); const me = rouMe(); S.rouItem = null; S.rouSteal = null;
    send({ t: "act", slot: "item", index: Number(i), key: me && me.items[Number(i)], target: target || null, pick: pick == null || pick === "" ? null : Number(pick) }); haptic("medium"); render(); },
  "rou-aim": (v) => { if (!S.room || S.room.turn !== S.me || S.room.phase !== "play" || BQ.busy) return; send({ t: "act", slot: "aim", target: v }); haptic(); },
  "rou-fire": () => { if (S.room && S.room.aim && !BQ.busy) { S.rouItem = null; send({ t: "act", slot: "shoot", target: S.room.aim }); haptic("heavy"); } },
  "rou-shoot": (v) => { S.rouItem = null; send({ t: "act", slot: "shoot", target: v }); haptic("heavy"); },
  "rou-sound": () => { S.sound = S.sound === false; store.sound = S.sound; saveProfile(); Sfx.unlock(); render(); },
};
