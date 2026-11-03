/* Сезонный пропуск: бесплатный, на месяц, 30 уровней. Опыт и награды считает сервер (/api/pass/claim, state.pass) */
"use strict";

const PASS_HOW = [["login", "Зайти в игру (раз в день)"], ["game", "Сыграть партию с друзьями"], ["bots", "Победить ботов"], ["battle", "Бой питомцев"], ["quest", "Выполнить задание дня"],
  ["bonus", "Все задания дня"], ["case", "Открыть кейс"], ["craft", "Мастерская: ключ или контракт"], ["feed", "Покормить питомца"], ["play", "Поиграть с питомцем"],
  ["wheel", "Колесо фортуны"], ["solo", "Одиночная игра на монеты"], ["pet", "Погладить питомца"], ["buy", "Купить еду"]];

const passState = () => (Api.on && Api.state && Api.state.pass) || null;
function passCard(cls = "") {
  const p = passState(); if (!p) return "";
  const lv = p.level, into = p.xp - lv * p.step, pct = lv >= p.max ? 100 : Math.round(into / p.step * 100);
  return `<button class="card pass-card ${cls}" data-a="go" data-v="pass"><span class="pc-ico">🎫</span><div class="grow"><b>Сезонный пропуск «${esc(p.name)}»</b>
    <div class="small muted">Уровень ${lv} из ${p.max}${p.ready ? ` · <b class="pc-ready">🎁 наград ждут: ${p.ready}</b>` : ""}</div>
    <div class="pc-bar"><i style="width:${pct}%"></i></div></div><span class="muted">›</span></button>`;
}
/* ---------------------------------------------------------------- дорожка уровней, как в пропусках шутеров: тянется вбок, вехи крупнее */
const PASS_ICO = { coins: "🪙", case: "🎁", food: "🍖", egg: "🥚", toy: "🧸", shards: "✨", title: "🏷", frame: "🖼", mg: "💉" };
function passTile(p, i) {
  const lvl = i + 1, have = p.claimed.includes(lvl), open = lvl <= p.level, mile = (p.milestones || [15, 30]).includes(lvl), kind = (p.kinds || [])[i] || "";
  const num = (/(\d[\d\s]*)/.exec(p.rewards[i]) || [])[1];
  const big = kind === "frame" ? `<span class="pt-prev">${av(Object.assign({}, S.profile, { look: Object.assign({}, S.profile.look, { frame: "ps" + p.tag }) }), "")}</span>`
    : kind === "coins" ? `<span class="pt-ico">${PX() ? Pixel.sprite("coin", 3) : "🪙"}</span><b class="pt-num">${esc(String(num || "").replace(/\s/g, ""))}</b>`
    : `<span class="pt-ico">${PASS_ICO[kind] || "🎁"}</span>${kind === "shards" || kind === "food" || (kind === "case" && /×|x\d/.test(p.rewards[i])) ? `<b class="pt-num">${esc(String(num || ""))}</b>` : ""}`;
  return `<button class="pass-tile ${have ? "have" : open ? "open" : "lock"} ${mile ? "mile" : ""} ${S.passSel === lvl ? "sel" : ""} k-${kind}" data-a="pass-sel" data-v="${lvl}" id="pt-${lvl}">
    <span class="pt-lv">${lvl}</span>${big}<span class="pt-st">${have ? "✓" : open ? "ЗАБРАТЬ" : "🔒"}</span></button>`;
}
function passDetail(p) {
  const lvl = S.passSel || Math.min(p.max, p.level + 1), i = lvl - 1, have = p.claimed.includes(lvl), open = lvl <= p.level;
  const mile = (p.milestones || []).includes(lvl), kind = (p.kinds || [])[i];
  const note = kind === "frame" ? "Эксклюзив месяца — после сезона её уже не достать. Вместе с ней — титул «Покоритель сезона»"
    : kind === "title" ? "Титул этого сезона — его видят все в профиле" : kind === "egg" ? "Яйцо питомца — вылупится, когда придёт время"
    : kind === "coins" ? "Монеты сразу на счёт" : mile ? "Веха сезона" : "";
  return `<div class="card pass-detail ${mile ? "mile" : ""}"><div class="pd-lv">${lvl}<span>уровень</span></div><div class="grow"><b>${esc(p.rewards[i])}</b>${note ? `<div class="small muted">${esc(note)}</div>` : ""}
      ${!open ? `<div class="small muted">Откроется через ${(lvl * p.step - p.xp)} опыта</div>` : ""}</div>
    ${have ? `<span class="pr-st">✓</span>` : open ? `<button class="btn small" data-a="pass-claim" data-v="${lvl}">Забрать</button>` : `<span class="pr-st">🔒</span>`}</div>`;
}
function viewPass() {
  const p = passState();
  if (!p) return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Сезонный пропуск</h1></div></div>
    <div class="card">${Api.on ? `<div class="spinner" style="margin:10px auto"></div>` : "Пропуск работает через сервер — открой Настолкино из бота."}</div></div>${tabs()}`;
  const lv = p.level, into = p.xp - lv * p.step, pct = lv >= p.max ? 100 : Math.round(into / p.step * 100), left = Math.max(0, p.ends - Math.floor(Date.now() / 1000));
  const nextMile = (p.milestones || []).find((m) => m > lv);
  const coinsLeft = p.rewards.reduce((a, t, i) => a + ((p.kinds || [])[i] === "coins" && !p.claimed.includes(i + 1) ? Number(t.replace(/\D/g, "")) || 0 : 0), 0);
  return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Сезонный пропуск</h1>
      <div class="muted small">«${esc(p.name)}» · до конца сезона ${fmtLeft2(left)}</div></div>${coinPill()}</div>
    <div class="card pass-hero"><div class="ph-lv"><b>${lv}</b><span>из ${p.max}</span></div><div class="grow">
      <div class="small"><b>${lv >= p.max ? "Сезон пройден! 🏆" : `До ${lv + 1}-го уровня — ${p.step - into} опыта`}</b></div><div class="pc-bar big"><i style="width:${pct}%"></i></div>
      <div class="tiny muted">Сегодня: ${p.dayXp} / ${p.dayCap} опыта${nextMile ? ` · ближайшая веха — ${nextMile}-й уровень` : ""}</div></div></div>
    ${p.ready ? `<button class="btn mt pass-all" data-a="pass-claim" data-v="all">🎁 Забрать всё (${p.ready})</button>` : ""}
    <div class="pass-track" id="pass-track"><div class="pt-line"><i style="width:${Math.min(100, (lv + (lv >= p.max ? 0 : pct / 100)) / p.max * 100)}%"></i></div>
      <div class="pt-row">${p.rewards.map((_, i) => passTile(p, i)).join("")}</div></div>
    ${passDetail(p)}
    <div class="small muted mt">Пропуск бесплатный: опыт даёт обычная игра, ничего не покупается. ${coinsLeft ? `Ещё можно получить <b>🪙 ${coinsLeft}</b> монет в этом сезоне.` : ""} Каждый месяц — новый сезон, своя рамка и титулы.</div>
    <details class="card pass-how mt"><summary><b>Как получать опыт</b></summary>${PASS_HOW.map(([k, t]) => `<div><span>${esc(t)}</span><b>+${p.xpFor[k] || 0}</b></div>`).join("")}</details>
  </div>${tabs()}`;
}
// дорожка сама прокручивается к текущему уровню
function passMount() {
  const tr = document.getElementById("pass-track"), p = passState(); if (!tr || !p) return;
  tr.style.scrollBehavior = "auto";
  if (S.passX != null) tr.scrollLeft = S.passX;                         // перерисовка — дорожка остаётся там, где её оставили
  else {
    const lvl = Math.max(1, Math.min(p.max, p.ready ? p.claimed.length + 1 : p.level + 1)), el = document.getElementById("pt-" + lvl);
    if (el) tr.scrollLeft = Math.max(0, el.offsetLeft - tr.clientWidth / 2 + el.offsetWidth / 2);
  }
  tr.style.scrollBehavior = "";
  tr.onscroll = () => { S.passX = tr.scrollLeft; };
}
const PASS_ACTIONS = {
  "pass-sel": (v) => { const tr = document.getElementById("pass-track"); if (tr) S.passX = tr.scrollLeft; S.passSel = Number(v); haptic(); render(); },
  "pass-claim": (v) => Api.act("/api/pass/claim", { level: v }).then((st) => {
    notify("success"); haptic("heavy"); coinRain();
    S.sheet = { type: "pass-got", list: st.passGot || [] }; renderOverlay(); render();
  }).catch((e) => { notify("error"); toast(e.message); }),
};
function passGotSheet() {
  const list = (S.sheet && S.sheet.list) || [];
  return `<div class="gift-pop"><div class="gp-box">🎫</div><h2>Награды пропуска</h2><div class="gp-list">${list.map((t) => `<div class="gp-row"><span class="gp-i">🎁</span><div class="grow"><b>${esc(t)}</b></div></div>`).join("")}</div></div>`;
}
