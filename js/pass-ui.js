/* Сезонный пропуск: бесплатный, на месяц, 30 уровней. Опыт и награды считает сервер (/api/pass/claim, state.pass) */
"use strict";

const PASS_HOW = [["login", "Зайти в гру (раз на день)"], ["game", "Зіграти партію з друзями"], ["bots", "Перемогти ботів"], ["battle", "Бій улюбленців"], ["quest", "Виконати завдання дня"],
  ["bonus", "Усі завдання дня"], ["case", "Відкрити кейс"], ["craft", "Ключ у майстерні або крафт"], ["feed", "Нагодувати улюбленця"], ["play", "Пограти з улюбленцем"],
  ["wheel", "Колесо фортуни"], ["solo", "Одиночна гра на монети"], ["pet", "Погладити улюбленця"], ["buy", "Купити їжу"]];

const passState = () => (Api.on && Api.state && Api.state.pass) || null;
function passCard(cls = "") {
  const p = passState(); if (!p) return "";
  const lv = p.level, into = p.xp - lv * p.step, pct = lv >= p.max ? 100 : Math.round(into / p.step * 100);
  return `<button class="card pass-card ${cls}" data-a="go" data-v="pass"><span class="pc-ico">🎫</span><div class="grow"><b>Сезонна перепустка «${esc(p.name)}»</b>
    <div class="small muted">Рівень ${lv} з ${p.max}${p.ready ? ` · <b class="pc-ready">🎁 нагород чекають: ${p.ready}</b>` : ""}</div>
    <div class="pc-bar"><i style="width:${pct}%"></i></div></div><span class="muted">›</span></button>`;
}
/* ---------------------------------------------------------------- дорожка уровней, как в пропусках шутеров: тянется вбок, вехи крупнее */
const PASS_ICO = { coins: "🪙", case: "🎁", food: "🍖", egg: "🥚", toy: "🧸", shards: "✨", title: "🏷", frame: "🖼", mg: "💉", hat: "🎩", feeder: "🪣", mgchance: "💉" };
// плитка уровня; prem — премиум-дорожка (свои награды, своя рамка, золото)
function passTile(p, i, prem) {
  const lvl = i + 1, cl = prem ? p.pclaimed || [] : p.claimed, rw = prem ? p.prewards || [] : p.rewards, kinds = prem ? p.pkinds || [] : p.kinds || [];
  const have = cl.includes(lvl), open = lvl <= p.level && (!prem || p.premium), mile = (p.milestones || [15, 30]).includes(lvl), kind = kinds[i] || "";
  const num = (/(\d[\d\s]*)/.exec(rw[i] || "") || [])[1];
  const big = kind === "frame" ? `<span class="pt-prev">${av(Object.assign({}, S.profile, { look: Object.assign({}, S.profile.look, { frame: (prem ? "pp" : "ps") + p.tag }) }), "")}</span>`
    : kind === "coins" ? `<span class="pt-ico">${PX() ? Pixel.sprite("coin", 3) : "🪙"}</span><b class="pt-num">${esc(String(num || "").replace(/\s/g, ""))}</b>`
    : kind === "hat" ? `<span class="pt-ico pt-hat">${Pets.sprite("27f3a9c51e2b84d06a1c3f5e7092b4d6e-" + (/німб|нимб/i.test(rw[i]) ? "phalo" : "pcrown"), 40)}</span>`
    : kind === "feeder" ? `<span class="pt-ico">${feederArt(/Сезонн/.test(rw[i]) ? "pass" : "wood", 34)}</span>`
    : `<span class="pt-ico">${PASS_ICO[kind] || "🎁"}</span>${kind === "shards" || kind === "food" || kind === "mgchance" || (kind === "case" && /×|x\d/.test(rw[i])) ? `<b class="pt-num">${esc(String(num || ""))}${kind === "mgchance" ? "%" : ""}</b>` : ""}`;
  return `<button class="pass-tile ${prem ? "prem" : ""} ${have ? "have" : open ? "open" : "lock"} ${mile ? "mile" : ""} ${S.passSel === lvl ? "sel" : ""} k-${kind}" data-a="pass-sel" data-v="${lvl}" id="${prem ? "pp" : "pt"}-${lvl}">
    <span class="pt-lv">${lvl}</span>${big}<span class="pt-st">${have ? "✓" : open ? "ЗАБРАТИ" : prem && !p.premium ? "👑" : "🔒"}</span></button>`;
}
function passDetail(p) {
  const lvl = S.passSel || Math.min(p.max, p.level + 1), i = lvl - 1, open = lvl <= p.level;
  const mile = (p.milestones || []).includes(lvl), kind = (p.kinds || [])[i], pk = (p.pkinds || [])[i];
  const note = kind === "frame" ? "Ексклюзив місяця — після сезону її вже не дістати. Разом з нею — титул «Підкорювач сезону»"
    : kind === "title" ? "Титул цього сезону — його бачать усі в профілі" : kind === "egg" ? "Яйце улюбленця — вилупиться, коли прийде час"
    : kind === "coins" ? "Монети одразу на рахунок" : mile ? "Віха сезону" : "";
  const pnote = pk === "frame" ? "Та сама рамка сезону, але преміум: свій колір і багатша анімація" : pk === "hat" ? "Цю річ не можна вибити з кейсів — лише тут" : pk === "feeder" ? "Лежить у запасі — увімкнеш, коли захочеш" : pk === "mgchance" ? "Пощастить — шприц із мутагеном, ні — 300 уламків" : "";
  const row = (prem) => { const cl = prem ? p.pclaimed || [] : p.claimed, have = cl.includes(lvl), can = open && (!prem || p.premium);
    return `<div class="pd-row ${prem ? "prem" : ""}"><div class="grow"><span class="pd-tag">${prem ? "👑 Преміум" : "Звичайна"}</span><b>${esc(prem ? (p.prewards || [])[i] || "" : p.rewards[i])}</b>${(prem ? pnote : note) ? `<div class="small muted">${esc(prem ? pnote : note)}</div>` : ""}</div>
      ${have ? `<span class="pr-st">✓</span>` : can ? `<button class="btn small ${prem ? "star" : ""}" data-a="pass-claim" data-v="${prem ? "p" : ""}${lvl}">Забрати</button>` : `<span class="pr-st">${prem && !p.premium ? "👑" : "🔒"}</span>`}</div>`; };
  return `<div class="card pass-detail ${mile ? "mile" : ""}"><div class="pd-lv">${lvl}<span>рівень</span></div><div class="grow">${row(false)}${p.prewards ? row(true) : ""}
      ${!open ? `<div class="small muted">Відкриється через ${(lvl * p.step - p.xp)} досвіду</div>` : ""}</div></div>`;
}
// плашка премиума: что внутри и кнопка покупки за звёзды
function passPremCard(p) {
  if (!p.prewards) return "";
  if (p.premium) return `<div class="card pass-prem on"><span class="pp-crown">👑</span><div class="grow"><b>Преміум-перепустку відкрито</b><div class="small">Друга доріжка — твоя до кінця сезону${p.pready ? ` · нагород чекають: <b>${p.pready}</b>` : ""}</div></div></div>`;
  const coins = (p.prewards || []).reduce((a, t, i) => a + ((p.pkinds || [])[i] === "coins" ? Number(t.replace(/\D/g, "")) || 0 : 0), 0);
  return `<div class="card pass-prem"><span class="pp-crown">👑</span><div class="grow"><b>Преміум-перепустка</b>
    <div class="small">Друга доріжка на тих самих рівнях: <b>🪙 ${coins.toLocaleString("uk-UA")}</b>, яйця, легендарні кейси, німб і зоряна корона для улюбленця (лише тут), сезонна годівничка, шанс на мутаген і анімована преміум-рамка</div></div>
    <button class="btn small star" data-a="stars-buy" data-v="premium">${p.pstars || 299} ⭐</button></div>`;
}
function viewPass() {
  const p = passState();
  if (!p) return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Сезонна перепустка</h1></div></div>
    <div class="card">${Api.on ? `<div class="spinner" style="margin:10px auto"></div>` : "Перепустка працює через сервер — відкрий Настолкіно з бота."}</div></div>${tabs()}`;
  const lv = p.level, into = p.xp - lv * p.step, pct = lv >= p.max ? 100 : Math.round(into / p.step * 100), left = Math.max(0, p.ends - Math.floor(Date.now() / 1000));
  const nextMile = (p.milestones || []).find((m) => m > lv);
  const coinsLeft = p.rewards.reduce((a, t, i) => a + ((p.kinds || [])[i] === "coins" && !p.claimed.includes(i + 1) ? Number(t.replace(/\D/g, "")) || 0 : 0), 0);
  return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>Сезонна перепустка</h1>
      <div class="muted small">«${esc(p.name)}» · до кінця сезону ${fmtLeft2(left)}</div></div>${coinPill()}</div>
    <div class="card pass-hero"><div class="ph-lv"><b>${lv}</b><span>з ${p.max}</span></div><div class="grow">
      <div class="small"><b>${lv >= p.max ? "Сезон пройдено! 🏆" : `До ${lv + 1}-го рівня — ${p.step - into} досвіду`}</b></div><div class="pc-bar big"><i style="width:${pct}%"></i></div>
      <div class="tiny muted">Сьогодні: ${p.dayXp} / ${p.dayCap} досвіду${nextMile ? ` · найближча віха — ${nextMile}-й рівень` : ""}</div></div></div>
    ${passPremCard(p)}
    ${p.ready + (p.pready || 0) ? `<button class="btn mt pass-all" data-a="pass-claim" data-v="all">🎁 Забрати все (${p.ready + (p.pready || 0)})</button>` : ""}
    <div class="pass-track" id="pass-track"><div class="pt-line"><i style="width:${Math.min(100, (lv + (lv >= p.max ? 0 : pct / 100)) / p.max * 100)}%"></i></div>
      <div class="pt-row">${p.rewards.map((_, i) => passTile(p, i)).join("")}</div>
      ${p.prewards ? `<div class="pt-row prem ${p.premium ? "on" : ""}">${p.prewards.map((_, i) => passTile(p, i, true)).join("")}</div>` : ""}</div>
    ${passDetail(p)}
    <div class="small muted mt">Звичайна доріжка безплатна: досвід дає звичайна гра. Преміум — друга доріжка нагород за зірки Telegram. ${coinsLeft ? `Ще можна отримати <b>🪙 ${coinsLeft}</b> монет цього сезону.` : ""} Щомісяця — новий сезон, своя рамка й титули.</div>
    <details class="card pass-how mt"><summary><b>Як отримувати досвід</b></summary>${PASS_HOW.map(([k, t]) => `<div><span>${esc(t)}</span><b>+${p.xpFor[k] || 0}</b></div>`).join("")}</details>
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
  "pass-claim": (v) => Api.act("/api/pass/claim", v === "all" ? { level: "all", track: "all" } : /^p\d+$/.test(String(v)) ? { level: Number(String(v).slice(1)), track: "prem" } : { level: Number(v), track: "free" }).then((st) => {
    notify("success"); haptic("heavy"); coinRain();
    S.sheet = { type: "pass-got", list: st.passGot || [] }; renderOverlay(); render();
  }).catch((e) => { notify("error"); toast(e.message); }),
};
function passGotSheet() {
  const list = (S.sheet && S.sheet.list) || [];
  return `<div class="gift-pop"><div class="gp-box">🎫</div><h2>Нагороди перепустки</h2><div class="gp-list">${list.map((t) => `<div class="gp-row"><span class="gp-i">🎁</span><div class="grow"><b>${esc(t)}</b></div></div>`).join("")}</div></div>`;
}
