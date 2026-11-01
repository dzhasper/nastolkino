/* Бои питомцев: 1×1, 2×2, 3×3 (бойцы сменяют друг друга, место в команде может занять друг), турниры с сеткой.
   Бой считает сервер (server/worker.js → simulate), здесь — вызовы, выбор бойцов и повтор с анимацией. */
"use strict";

function linkFor(prefix, code, q) {
  if (S.bot) return S.miniapp ? `https://t.me/${S.bot}/${S.miniapp}?startapp=${prefix}_${code}` : `https://t.me/${S.bot}?start=${prefix}_${code}`;
  return `${location.origin}${location.pathname}?${q}=${code}`;
}
function shareLink(link, text) {
  if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
  else if (navigator.share) navigator.share({ text, url: link }).catch(() => {});
  else { navigator.clipboard && navigator.clipboard.writeText(`${text}\n${link}`); toast("Ссылка скопирована"); }
}
const fightCode = (f) => f.rarity + f.dna;
const statLine = (s) => `<div class="bstats small"><span>❤️ ${s.hp}</span><span>⚔️ ${s.atk}</span><span>🛡 ${s.def}</span><span>💨 ${s.spd}</span></div>`;
const teamNames = (t) => (t || []).map((f) => f.name).join(" + ") || "?";
const myFighters = () => (Api.state ? Api.state.pets : []).filter((p) => p.alive && !p.egg);

function battleLoadList() {
  if (!Api.on || !Api.ready) return;
  Api.call("/api/battle/list", {}).then((r) => { S.battleList = r.battles; if (S.screen === "pets" && S.petTab === "battle" && !S.battleCode && !S.tourId) render(); }).catch(() => {});
  Api.call("/api/tour/list", {}).then((r) => { S.tourList = r.tours; if (S.screen === "pets" && S.petTab === "battle" && !S.battleCode && !S.tourId) render(); }).catch(() => {});
}
function battleOpen(code) {
  S.screen = "pets"; S.petTab = "battle"; S.petSel = null; S.tourId = null; S.battleCode = String(code).toUpperCase(); S.battle = null; S.replay = null; S.battlePick = [];
  render();
  if (!Api.on) return;
  Api.call("/api/battle/get", { code: S.battleCode }).then((r) => {
    S.battle = r.battle;
    if (r.battle.status === "done") replayStart(true);
    render();
  }).catch((e) => { toast(e.message); S.battleCode = null; render(); });
}

/* ---------------------------------------------------------------- вкладка «Бои» */
function viewBattleTab() {
  if (S.battleCode) return battleScreen();
  if (S.tourId) return tourScreen();
  const list = S.battleList, tours = S.tourList || [];
  const row = (b) => {
    const me = b.side === 1 ? b.teams.b : b.teams.a, foe = b.side === 1 ? b.teams.a : b.teams.b;
    const res = b.status === "done" ? (b.winner === b.side ? `<span class="win-tag">🏆 Победа</span>` : `<span class="lose-tag">Поражение</span>`)
      : b.status === "open" ? `<span class="muted">⏳ ${b.size}×${b.size}</span>` : b.status === "refused" ? `<span class="muted">отказ</span>` : `<span class="muted">истёк</span>`;
    return `<button class="card brow" data-a="battle-open" data-v="${b.code}">${me && me[0] ? Pets.sprite(fightCode(me[0]), 44) : ""}<div class="grow"><b>${esc(teamNames(me))}</b>
      <div class="small muted">${b.tour ? "🏆 " + esc(b.tour.name) + " · " : ""}${foe && foe.length ? "против " + esc(teamNames(foe)) : "вызов " + b.size + "×" + b.size}</div></div>${res}</button>`;
  };
  const tourRow = (t) => `<button class="card brow tour-row ${t.status}" data-a="tour-open" data-v="${t.id}"><span class="tour-cup">🏆</span><div class="grow"><b>${esc(t.name)}</b>
      <div class="small muted">${t.status === "reg" ? `запись: ${t.players}/${t.size}` : t.status === "run" ? "идёт" : "окончен"} · приз: ${esc(t.prize)}</div></div>${t.joined ? `<span class="win-tag">ты в деле</span>` : t.status === "reg" ? `<span class="pill on">Записаться</span>` : ""}</button>`;
  return `${tours.length ? `<div class="section-title">🏆 Турниры</div><div class="blist">${tours.map(tourRow).join("")}</div>` : ""}
    <div class="card small mt">⚔️ Вызов — из карточки питомца: <b>1×1</b>, <b>2×2</b> или <b>3×3</b>. В командном бою бойцы выходят по очереди, место в команде может занять друг.
      Решают характеристики, мутации, стихия, сытость и настроение. <b>Победа +12 🪙, поражение +4 🪙.</b></div>
    <div class="section-title">Мои бои</div>
    ${!list ? `<div class="muted small">Загружаю…</div>` : list.length ? `<div class="blist">${list.map(row).join("")}</div>` : `<div class="muted small">Боёв пока не было</div>`}`;
}

/* ---------------------------------------------------------------- вызов: формат и бойцы */
function battleSetupSheet() {
  const st = S.bsetup, pets = myFighters();
  if (!st) return "";
  return `<h2>⚔️ Вызов на бой</h2>
    <div class="seg mt" style="grid-template-columns:repeat(3,1fr)">${[1, 2, 3].map((n) => `<button class="${st.size === n ? "on" : ""}" data-a="bsetup-size" data-v="${n}">${n}×${n}</button>`).join("")}</div>
    <div class="small muted mt">${st.size === 1 ? "Один на один." : `Команды по ${st.size}. Бойцы выходят по очереди: выбыл один — выходит следующий. Можешь выставить своих или оставить места другу — он вступит по той же ссылке.`}</div>
    <div class="section-title">Твои бойцы · ${st.pets.length}/${st.size}</div>
    <div class="pick-grid">${pets.map((p) => `<button class="pick ${st.pets.includes(p.id) ? "on" : ""}" data-a="bsetup-pet" data-v="${p.id}">${Pets.sprite(petCode(p), 48)}<span>${esc(Pets.name(p.dna))}</span>
      ${bar(p.energy, "energy")}</button>`).join("")}</div>
    <button class="btn mt2" data-a="bsetup-go" ${st.pets.length ? "" : "disabled"}>Создать вызов</button>`;
}

function slotCard(f) {
  return `<div class="slot r${f.rarity}">${Pets.sprite(fightCode(f), 52)}<div class="grow"><b>${esc(f.name)}</b><div class="small muted">${esc(f.owner || "")}</div>${statLine(f.stats || Pets.stats(f.dna, f.rarity))}</div></div>`;
}
function battleScreen() {
  const b = S.battle, back = `<button class="btn ghost small" data-a="battle-back">← Все бои</button>`;
  if (!Api.on) return `${back}<div class="card mt">Бои работают через сервер — открой Настолкино из бота.</div>`;
  if (!b) return `${back}<div class="card center mt"><div class="spinner" style="margin:10px auto"></div></div>`;
  if (b.status === "done") return `${back}${b.tour ? `<div class="small muted mt">🏆 ${esc(b.tour.name)} · ${esc(b.tour.round)}</div>` : ""}${arena(b)}`;
  if (b.status !== "open") return `${back}<div class="card center mt">${b.status === "refused" ? `😾 Бой не состоялся${b.reason ? ": " + esc(b.reason) : ""}` : b.status === "cancel" ? "Вызов отменён" : "⌛ Вызов истёк — его никто не принял за сутки"}</div>`;
  const free = { a: b.size - b.teams.a.length, b: b.size - b.teams.b.length };
  const team = (k, title) => `<div class="team"><div class="section-title">${title} · ${b.teams[k].length}/${b.size}</div>
    ${b.teams[k].map(slotCard).join("")}${Array.from({ length: free[k] }, () => `<div class="slot empty">свободное место</div>`).join("")}</div>`;
  let act = "";
  if (b.side != null) {
    act = `<button class="btn mt" data-a="battle-share">📨 ${free.a || free.b ? "Позвать соперника или друга в команду" : "Отправить ссылку"}</button>
      ${b.mine ? `<button class="btn ghost small mt" data-a="battle-cancel">Отменить вызов</button>` : ""}
      ${free[b.side ? "b" : "a"] ? `<button class="btn ghost small mt" data-a="battle-join" data-v="${b.side ? "b" : "a"}">＋ Добавить ещё своего бойца</button>` : ""}`;
  } else {
    act = `${free.b ? `<button class="btn mt" data-a="battle-join" data-v="b">⚔️ Принять вызов — выставить бойца</button>` : ""}
      ${free.a ? `<button class="btn ghost mt" data-a="battle-join" data-v="a">🤝 Вступить в команду ${esc(b.teams.a[0] ? b.teams.a[0].owner : "")}</button>` : ""}`;
  }
  const pick = S.battleJoin ? battleJoinPicker(b, free[S.battleJoin]) : "";
  return `${back}<div class="card center mt"><b>Бой ${b.size}×${b.size}</b><div class="small muted">Когда обе команды наберутся — бой начнётся сам. Вызов живёт сутки.</div></div>
    ${team("a", b.size > 1 ? "Команда 1" : "Вызывает")}${team("b", b.size > 1 ? "Команда 2" : "Соперник")}${pick || act}`;
}
function battleJoinPicker(b, free) {
  const mine = myFighters().filter((p) => ![...b.teams.a, ...b.teams.b].some((f) => f.id === p.id));
  return `<div class="section-title">Выбери бойцов · ${S.battlePick.length}/${free}</div>
    ${mine.length ? `<div class="pet-grid">${mine.map((p) => { const t = Pets.traits(p.dna);
      return `<button class="pet-card ${S.battlePick.includes(p.id) ? "main" : ""}" data-a="battle-pick" data-v="${p.id}">${Pets.sprite(petCode(p), 72)}<b>${esc(t.name)}</b>
        ${statLine(Pets.stats(p.dna, p.rarity))}${bar(p.energy, "energy")}</button>`; }).join("")}</div>
      <button class="btn mt2" data-a="battle-go" ${S.battlePick.length ? "" : "disabled"}>⚔️ В бой!</button>`
      : `<div class="card muted small">Нет свободных вылупившихся питомцев.</div>`}
    <button class="btn ghost small mt" data-a="battle-join" data-v="">Отмена</button>`;
}

/* ---------------------------------------------------------------- повтор боя */
let replayTimer = null;
function replayApply(r, e) {
  r.act = e.f || [0, 0];
  r.hp.a[r.act[0]] = e.hp[0]; r.hp.b[r.act[1]] = e.hp[1];
  if (e.t === "out") (e.a ? r.hp.b : r.hp.a)[(r.act[e.a])] = 0;
}
function replayStart(fromStart) {
  const b = S.battle;
  if (!b || !b.log) return;
  const r = { i: 0, act: [0, 0], hp: { a: b.teams.a.map((f) => f.stats.hp), b: b.teams.b.map((f) => f.stats.hp) }, text: "", done: false };
  clearTimeout(replayTimer);
  if (!fromStart) { b.log.forEach((e) => replayApply(r, e)); r.i = b.log.length; r.done = true; }
  S.replay = r;
  if (fromStart) replayTimer = setTimeout(replayStep, 900);
}
const LOG_TEXT = {
  hit: (A, D, d) => `${A} бьёт ${D}: −${d}`, crit: (A, D, d) => `💥 Крит! ${A} наносит ${d}`, miss: (A, D) => `${D} уворачивается`,
  burn: (A, D, d) => `🔥 ${A} горит: −${d}`, burnon: (A, D) => `🔥 ${A} поджигает ${D}`, freeze: (A, D) => `❄️ ${D} заморожен`,
  frozen: (A) => `🧊 ${A} пропускает ход`, stun: (A, D) => `🐙 Щупальца оглушают ${D}`, heal: (A, D, d) => `💚 ${A} лечится: +${d}`,
  drain: (A, D, d) => `🧛 ${A} пьёт здоровье: +${d}`, shield: (A, D, d) => `💎 Щит ${A} гасит ${d}`, double: (A) => `👯 ${A} бьёт ещё раз!`,
  revive: (A) => `🧟 ${A} поднимается с 1 здоровьем!`, rebirth: (A, D, d) => `🔥 ${A} возрождается из пепла: +${d}!`, revenge: (A) => `😤 ${A} жаждет реванша: +10% к атаке`,
  out: (A) => `💤 ${A} выбывает`, in: (A) => `➡️ На арену выходит ${A}!`,
};
function replayStep() {
  const b = S.battle, r = S.replay;
  if (!b || !r || r.done || S.screen !== "pets" || S.battleCode !== b.code) return;
  const e = b.log[r.i];
  if (!e) { r.done = true; render(); notify(b.winner === b.side ? "success" : "warning"); if (b.winner === b.side) coinRain(); return; }
  const prevAct = r.act.slice();
  r.i++; replayApply(r, e);
  const T = [b.teams.a, b.teams.b], nameOf = (s) => (T[s][r.act[s]] || T[s][T[s].length - 1]).name;
  r.text = (LOG_TEXT[e.t] || (() => ""))(nameOf(e.a), nameOf(1 - e.a), e.d);
  if (e.t === "in" || prevAct[0] !== r.act[0] || prevAct[1] !== r.act[1]) { render(); replayTimer = setTimeout(replayStep, 900); return; }   // новый боец — перерисовать арену
  const fa = document.getElementById("f0"), fb = document.getElementById("f1"), me = e.a === 0 ? fa : fb, foe = e.a === 0 ? fb : fa;
  const hit = ["hit", "crit"].includes(e.t);
  if (me && foe) {
    if (hit || e.t === "double") { me.classList.remove("lunge"); void me.offsetWidth; me.classList.add("lunge"); }
    const target = ["burn", "heal", "drain", "frozen", "revive", "rebirth", "revenge", "shield", "out"].includes(e.t) ? me : foe;
    if (hit || e.t === "burn") { target.classList.remove("hurt"); void target.offsetWidth; target.classList.add("hurt"); }
    if (e.t === "out") target.classList.add("faint");
    if (e.d) floatNum(target, (["heal", "drain", "rebirth"].includes(e.t) ? "+" : "−") + e.d, e.t);
  }
  arenaBars();
  const log = document.getElementById("blog"); if (log) log.textContent = r.text;
  if (e.t === "crit") haptic("heavy"); else if (hit) haptic("light");
  replayTimer = setTimeout(replayStep, e.t === "crit" || e.t === "out" ? 900 : 620);
}
function arenaBars() {
  const b = S.battle, r = S.replay;
  ["a", "b"].forEach((k, s) => {
    const max = b.teams[k][r.act[s]] ? b.teams[k][r.act[s]].stats.hp : 1, hp = r.hp[k][r.act[s]] ?? 0;
    const el = document.getElementById("hp" + s), t = document.getElementById("hpt" + s);
    if (el) { el.style.width = Math.max(0, Math.min(100, hp / max * 100)) + "%"; el.parentNode.classList.toggle("low", hp / max < .3); }
    if (t) t.textContent = hp;
  });
}
function floatNum(el, text, t) {
  const n = document.createElement("i");
  n.className = "fnum " + t; n.textContent = text;
  el.appendChild(n); setTimeout(() => n.remove(), 1100);
}

function arena(b) {
  if (!S.replay) replayStart(false);
  const r = S.replay, T = [b.teams.a, b.teams.b];
  const side = (s) => {
    const k = s ? "b" : "a", i = Math.min(r.act[s], T[s].length - 1), f = T[s][i], hp = r.hp[k][i] ?? 0, max = f.stats.hp;
    const bench = T[s].length > 1 ? `<div class="bench">${T[s].map((x, j) => `<span class="${r.hp[k][j] <= 0 ? "out" : ""} ${j === i ? "cur" : ""}">${Pets.sprite(fightCode(x), 26)}</span>`).join("")}</div>` : "";
    return `<div class="fighter ${s ? "right" : "left"} ${hp <= 0 ? "faint" : ""}" id="f${s}">${bench}
      <div class="fname"><b>${esc(f.name)}</b><span class="small muted">${esc(f.owner || "")}</span></div>
      <div class="hpbar ${hp / max < .3 ? "low" : ""}"><i id="hp${s}" style="width:${Math.max(0, Math.min(100, hp / max * 100))}%"></i></div>
      <div class="small muted">❤️ <span id="hpt${s}">${hp}</span> / ${max}</div>
      <div class="fspr">${Pets.sprite(fightCode(f), 110)}</div></div>`;
  };
  const won = b.winner === b.side, wname = teamNames(T[b.winner]);
  const myReward = b.rewards && S.me.startsWith("tg") ? b.rewards[S.me.slice(2)] : null;
  const reward = myReward ? ` · +${myReward} 🪙` : "";
  return `<div class="arena">${side(0)}<div class="vs">VS</div>${side(1)}</div>
    <div class="card blog" id="blog">${esc(r.done ? "Бой окончен" : r.text || "Бой начинается…")}</div>
    ${r.done ? `<div class="card center bres ${b.side == null ? "" : won ? "won" : "lost"}"><div class="display">${b.side == null ? "🏆 " + esc(wname) : won ? "🏆 Победа!" : "Поражение"}</div>
        <div class="small muted mt">${b.side == null ? "победа в этом бою" : won ? `${esc(wname)} — сильнее${reward}` : `Победа за ${esc(wname)}. Питомцы немного расстроены${reward}`}</div>
        <button class="btn ghost small mt" data-a="replay-again">▶️ Смотреть ещё раз</button></div>`
      : `<button class="btn ghost small mt" data-a="replay-skip">⏭ Пропустить</button>`}`;
}

/* ---------------------------------------------------------------- турниры */
function tourOpen(id) {
  S.screen = "pets"; S.petTab = "battle"; S.petSel = null; S.battleCode = null; S.tourId = Number(id); S.tour = null; S.tourPick = null;
  render();
  if (!Api.on) return;
  Api.call("/api/tour/get", { id: S.tourId }).then((r) => { S.tour = r.tour; render(); }).catch((e) => { toast(e.message); S.tourId = null; render(); });
}
function tourScreen() {
  const t = S.tour, back = `<button class="btn ghost small" data-a="tour-back">← Все бои</button>`;
  if (!Api.on) return `${back}<div class="card mt">Турниры работают через сервер — открой Настолкино из бота.</div>`;
  if (!t) return `${back}<div class="card center mt"><div class="spinner" style="margin:10px auto"></div></div>`;
  const total = t.rounds.length ? t.rounds[0].length : 0;
  const rname = (n) => (n === 1 ? "Финал" : n === 2 ? "Полуфинал" : `1/${n} финала`);
  const fighterLine = (f, won) => f ? `<div class="tm-f ${won ? "won" : ""}">${Pets.sprite(fightCode(f), 30)}<span><b>${esc(f.name)}</b><i>${esc(f.owner)}</i></span></div>` : `<div class="tm-f bye">— проход —</div>`;
  const bracket = t.rounds.map((ms, ri) => `<div class="tround"><div class="tr-title">${rname(Math.max(1, total >> ri))}</div>${ms.map((m) => `<div class="tmatch">
      ${fighterLine(m.a, m.winner === 0)}${fighterLine(m.b, m.winner === 1)}
      ${m.code ? `<button class="tm-play" data-a="battle-open" data-v="${m.code}">▶</button>` : ""}${m.note ? `<div class="tm-note">${esc(m.note)}</div>` : ""}</div>`).join("")}</div>`).join("");
  const mine = myFighters();
  let act = "";
  if (t.status === "reg") {
    act = t.joined ? `<div class="card center mt">✅ Ты записан. Раунды пройдут сами — результаты пришлёт бот.</div><button class="btn ghost small mt" data-a="tour-leave">Выписаться</button>`
      : `<div class="section-title">Выбери бойца для турнира</div>${mine.length ? `<div class="pet-grid">${mine.map((p) => `<button class="pet-card ${S.tourPick === p.id ? "main" : ""}" data-a="tour-pick" data-v="${p.id}">
          ${Pets.sprite(petCode(p), 64)}<b>${esc(Pets.name(p.dna))}</b>${statLine(Pets.stats(p.dna, p.rarity))}</button>`).join("")}</div>
        <button class="btn mt2" data-a="tour-join" ${S.tourPick ? "" : "disabled"}>🏆 Записаться</button>
        <div class="small muted mt">В день боя питомец должен быть сыт, бодр и в настроении: если откажется драться — проиграет.</div>` : `<div class="card muted small">Нужен вылупившийся питомец.</div>`}`;
  }
  return `${back}<div class="card tour-head mt"><div class="tour-cup big">🏆</div><div class="grow"><b class="tour-name">${esc(t.name)}</b>
      <div class="small muted">${t.status === "reg" ? `Запись: ${t.players}/${t.size}` : t.status === "run" ? `Идёт · раунды каждые ${Math.round(t.interval / 60)} мин` : t.status === "done" ? "Окончен" : "Отменён"}</div>
      <div class="small">Приз: <b>${esc(t.prize)}</b></div></div></div>
    ${t.winner ? `<div class="card center mt tour-win">${Pets.sprite(fightCode(t.winner), 96)}<div class="display">🏆 ${esc(t.winner.name)}</div><div class="small muted">${esc(t.winner.owner)} — победитель</div></div>` : ""}
    ${act}
    ${t.rounds.length ? `<div class="section-title">Сетка</div><div class="bracket">${bracket}</div>`
      : t.list.length ? `<div class="section-title">Участники</div><div class="tchips">${t.list.filter(Boolean).map((f) => `<span class="tchip pet">${Pets.sprite(fightCode(f), 32)}${esc(f.name)} <i class="muted">${esc(f.owner)}</i></span>`).join("")}</div>` : ""}`;
}

const BATTLE_ACTIONS = {
  "battle-new": (pet) => { S.bsetup = { size: 1, pets: [Number(pet)] }; S.sheet = { type: "battle-setup" }; renderOverlay(); },
  "bsetup-size": (n) => { S.bsetup.size = Number(n); S.bsetup.pets = S.bsetup.pets.slice(0, S.bsetup.size); haptic(); renderOverlay(); },
  "bsetup-pet": (id) => { id = Number(id); const a = S.bsetup.pets; S.bsetup.pets = a.includes(id) ? a.filter((x) => x !== id) : a.length < S.bsetup.size ? a.concat(id) : a; haptic(); renderOverlay(); },
  "bsetup-go": () => {
    const st = S.bsetup; S.sheet = null; renderOverlay();
    Api.call("/api/battle/new", { size: st.size, pets: st.pets }).then((r) => {
      S.petSel = null; S.petTab = "battle"; S.tourId = null; S.battleCode = r.battle.code; S.battle = r.battle; S.battleJoin = null; render(); window.scrollTo(0, 0);
      BATTLE_ACTIONS["battle-share"]();
    }).catch(petErr);
  },
  "battle-open": (code) => { haptic(); battleOpen(code); window.scrollTo(0, 0); },
  "battle-back": () => { clearTimeout(replayTimer); const fromTour = S.battle && S.battle.tour && S.tour; S.battleCode = null; S.battle = null; S.replay = null; S.battleJoin = null; if (fromTour) { S.tourId = S.tour.id; } render(); battleLoadList(); },
  "battle-share": () => {
    const b = S.battle; if (!b) return;
    const names = teamNames(b.teams.a);
    shareLink(linkFor("b", b.code, "battle"), b.size > 1 ? `⚔️ Бой питомцев ${b.size}×${b.size}! Моя команда: ${names}. Выставляй своих — или вступай ко мне в команду!` : `⚔️ Вызываю тебя на бой питомцев! Мой боец — ${names}. Выставляй своего!`);
  },
  "battle-cancel": () => Api.call("/api/battle/cancel", { code: S.battle.code }).then(() => { toast("Вызов отменён"); BATTLE_ACTIONS["battle-back"](); }).catch(petErr),
  "battle-join": (side) => { S.battleJoin = side || null; S.battlePick = []; haptic(); render(); },
  "battle-pick": (id) => {
    id = Number(id); const b = S.battle, free = b.size - b.teams[S.battleJoin].length, a = S.battlePick;
    S.battlePick = a.includes(id) ? a.filter((x) => x !== id) : a.length < free ? a.concat(id) : free === 1 ? [id] : a;
    haptic(); render();
  },
  "battle-go": () => {
    if (!S.battlePick.length) return;
    haptic("heavy");
    Api.act("/api/battle/join", { code: S.battle.code, side: S.battleJoin, pets: S.battlePick }).then((r) => {
      S.battle = r.battle; S.battleJoin = null; S.battlePick = [];
      if (r.battle.status === "done") replayStart(true); else toast("Ты в бою! Ждём остальных");
      render(); window.scrollTo(0, 0);
    }).catch(petErr);
  },
  "replay-skip": () => { clearTimeout(replayTimer); replayStart(false); render(); notify(S.battle.winner === S.battle.side ? "success" : "warning"); },
  "replay-again": () => { replayStart(true); render(); },
  "tour-open": (id) => { haptic(); tourOpen(id); window.scrollTo(0, 0); },
  "tour-back": () => { S.tourId = null; S.tour = null; render(); battleLoadList(); },
  "tour-pick": (id) => { S.tourPick = Number(id); haptic(); render(); },
  "tour-join": () => Api.call("/api/tour/join", { id: S.tour.id, pet: S.tourPick }).then((r) => { S.tour = r.tour; notify("success"); toast("Записан! 🏆"); render(); }).catch(petErr),
  "tour-leave": () => Api.call("/api/tour/leave", { id: S.tour.id }).then((r) => { S.tour = r.tour; render(); }).catch(petErr),
};

// пока вызов открыт — подтягиваем, кто вступил; бой начался — показываем повтор
setInterval(() => {
  if (S.screen !== "pets" || !S.battleCode || !S.battle || S.battle.status !== "open" || document.hidden || !Api.on) return;
  Api.call("/api/battle/get", { code: S.battleCode }).then((r) => {
    if (!S.battle || r.battle.code !== S.battle.code || JSON.stringify(r.battle) === JSON.stringify(S.battle)) return;
    S.battle = r.battle;
    if (r.battle.status === "done") { replayStart(true); notify("warning"); }
    if (!S.battleJoin) render();
  }).catch(() => {});
}, 3000);
