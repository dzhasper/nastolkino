/* Кейсы и инвентарь. Вещи не продаются — только выбиваются из кейсов за монеты.
   С сервером выпадение решает сервер (js/api.js → /api/case/open), без сервера — телефон (Shop.openCaseLocal). */
"use strict";

/* ---------------------------------------------------------------- пиксельные сундуки */
const CASE_ART = {};
function caseArt(key) {
  if (CASE_ART[key]) return CASE_ART[key];
  const W = 32, H = 28, c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d");
  const pal = {
    basement: { wood: "#8a5a2b", dark: "#5e3a17", light: "#b77d40", metal: "#6b6f78", mlight: "#b5b9c2", lock: "#c9a227", glow: null },
    dark: { wood: "#3b2257", dark: "#22123a", light: "#5d3c8c", metal: "#2a2a35", mlight: "#5b5b70", lock: "#7dff6a", glow: "#7dff6a" },
    legend: { wood: "#d99a00", dark: "#9a6a00", light: "#ffd04a", metal: "#fff1b0", mlight: "#ffffff", lock: "#ff3b5b", glow: "#fff6b0" },
    s_ice: { wood: "#9be3ff", dark: "#3a8ac8", light: "#e8fbff", metal: "#ffffff", mlight: "#bfefff", lock: "#1affb0", glow: "#ffffff" },
    s_moon: { wood: "#5a0810", dark: "#2a0206", light: "#8a1018", metal: "#1a0a0c", mlight: "#4a2a2c", lock: "#ff3b4a", glow: "#ff3b4a" },
    s_neon: { wood: "#160a2a", dark: "#0a0418", light: "#2a1650", metal: "#00e5ff", mlight: "#ff2bd6", lock: "#ffe14d", glow: "#00e5ff" },
    s_dragon: { wood: "#c8101e", dark: "#7a0810", light: "#ff4a3a", metal: "#ffd23f", mlight: "#fff4b0", lock: "#ffd23f", glow: "#ffd23f" },
    zoo: { wood: "#4fa83a", dark: "#2a6a22", light: "#8ad86a", metal: "#c89a50", mlight: "#f0d090", lock: "#ff8fb0", glow: "#ffe14d" },
  }[key] || { wood: "#8a5a2b", dark: "#5e3a17", light: "#b77d40", metal: "#6b6f78", mlight: "#b5b9c2", lock: "#c9a227", glow: null };
  const g = Array.from({ length: H }, () => Array(W).fill(null));
  for (let y = 3; y <= 24; y++) for (let xx = 2; xx <= 29; xx++) {
    if (y === 3 && (xx < 4 || xx > 27)) continue;
    if (y === 4 && (xx < 3 || xx > 28)) continue;
    let col = y <= 10 ? (y <= 5 ? pal.light : pal.wood) : (y >= 22 ? pal.dark : pal.wood);
    if (y === 10 || y === 11) col = pal.dark;
    if ((xx === 6 || xx === 7 || xx === 24 || xx === 25)) col = xx % 2 ? pal.metal : pal.mlight;
    if (xx >= 13 && xx <= 18 && y >= 8 && y <= 15) col = (xx === 13 || xx === 18 || y === 8 || y === 15) ? pal.metal : pal.mlight;
    if (xx >= 15 && xx <= 16 && y >= 11 && y <= 12) col = pal.lock;
    if ((key === "dark" || key === "s_neon" || key === "s_moon") && y >= 16 && y <= 20 && (xx === 10 || xx === 20) ) col = pal.glow;
    if (key === "dark" && y === 18 && (xx === 11 || xx === 19)) col = pal.glow;
    g[y][xx] = col;
  }
  if (key === "zoo") {                                       // «Питомник»: ушки на крышке, лапка спереди, травка снизу
    [[5, 2], [6, 1], [6, 2], [7, 2], [24, 2], [25, 1], [25, 2], [26, 2]].forEach(([a, b]) => { g[b][a] = pal.dark; });
    g[2][6] = "#ff8fb0"; g[2][25] = "#ff8fb0";
    for (let yy = 16; yy <= 19; yy++) for (let xx = 13; xx <= 18; xx++) if (!((yy === 16 || yy === 19) && (xx === 13 || xx === 18))) g[yy][xx] = "#ff8fb0";
    [[12, 14], [14, 13], [17, 13], [19, 14]].forEach(([a, b]) => { g[b][a] = "#ff8fb0"; g[b + 1][a] = "#ff8fb0"; });
    [[3, 24], [5, 23], [8, 24], [22, 24], [25, 23], [28, 24]].forEach(([a, b]) => { g[b][a] = "#7ae05a"; g[b + 1] && (g[b + 1][a] = "#7ae05a"); });
  }
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    if (g[y][xx]) { x.fillStyle = g[y][xx]; x.fillRect(xx, y, 1, 1); continue; }
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => g[y + b] && g[y + b][xx + a] && g[y + b][xx + a] !== "#140c08")) { x.fillStyle = "#140c08"; x.fillRect(xx, y, 1, 1); }
  }
  if (key === "legend" || key.startsWith("s_")) [[1, 1], [30, 2], [0, 14], [31, 20], [28, 26]].forEach(([a, b]) => { x.fillStyle = "#fff6b0"; x.fillRect(a, b, 1, 1); });
  return (CASE_ART[key] = c.toDataURL());
}
const caseImg = (key, w = 96) => `<img class="case-img" src="${caseArt(key)}" style="width:${w}px;height:${Math.round(w * 28 / 32)}px" alt="">`;

/* ---------------------------------------------------------------- экран: кейсы | инвентарь */
const anyCase = (k) => Shop.caseByKey(k) || (Shop.seasonByKey(k) ? Object.assign({ season: true, food: 0, egg: 0 }, Shop.seasonByKey(k), { name: "Кейс «" + Shop.seasonByKey(k).name + "»" }) : null);
const seasonLeft = () => { const se = Api.on && Api.state && Api.state.season; return se ? se.until - (Date.now() + (Api.state.skew || 0)) / 1000 : 0; };
const fmtLeft = (sec) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.floor(Math.max(0, sec) % 60)).padStart(2, "0")}`;
const caseFree = (key) => (Api.on && Api.state && Api.state.cases && Api.state.cases[key]) || 0;
const invCount = () => Shop.ITEMS.filter((it) => (it.price || it.excl || it.season || it.petcase || it.mg) && Shop.owns(it)).length;
const shardPill = () => (Api.on && Api.state ? `<span class="pill shard-pill" data-a="shop-tab" data-v="craft">✨ ${Api.state.shards || 0}</span>` : "");
const tierTag = (t) => `<span class="tier-tag" style="--tc:${Shop.TIERS[t].color}">${Shop.TIERS[t].name}</span>`;

function viewShop() {
  const tab = S.shopTab || "cases";
  return `<div class="fade-in">
    <div class="pxscene shop-scene" style="background-image:url(${Pixel.scene("shop")})"><div class="shop-sign">${tab === "inv" ? "Инвентарь" : tab === "craft" ? "Мастерская" : "Кейсы"}</div></div>
    <div class="top"><div class="grow"><h1>${tab === "inv" ? "Инвентарь" : tab === "craft" ? "Мастерская" : "Кейсы"}</h1><div class="muted small">${tab === "inv" ? "Всё выбитое — здесь. Нажми, чтобы примерить" : tab === "craft" ? "Осколки и переделка вещей" : "Вещи только выбиваются — открывай за монеты"}</div></div>${shardPill()}${coinPill()}</div>
    ${dailyCard()}
    <div class="seg seg3 mt">
      <button class="${tab === "cases" ? "on" : ""}" data-a="shop-tab" data-v="cases">🎁 Кейсы</button>
      <button class="${tab === "inv" ? "on" : ""}" data-a="shop-tab" data-v="inv">🎒 Вещи <span class="seg-n">${invCount()}</span></button>
      <button class="${tab === "craft" ? "on" : ""}" data-a="shop-tab" data-v="craft">⚒ Мастерская</button>
    </div>
    ${tab === "inv" ? viewInv() : tab === "craft" ? viewCraft() : viewCaseList()}
  </div>${tabs()}`;
}

function seasonCards() {
  const st = Api.on && Api.state, active = st && st.season && seasonLeft() > 0 ? st.season.key : null, coins = S.profile.coins;
  const keys = Shop.SEASONS.map((x) => x.key).filter((k) => k === active || caseFree(k));
  return keys.map((k) => {
    const c = anyCase(k), free = caseFree(k), live = k === active, can = free || (live && coins >= c.price);
    return `<div class="case-card season c-${k}" style="--sc:${c.color}"><div class="season-tag">${live ? `⏳ исчезнет через <b data-season-until="${st.season.until}">${fmtLeft(seasonLeft())}</b>` : "🎟 твой сезонный кейс"}</div>
      <div class="case-art">${caseImg(k, 92)}${free ? `<span class="case-free">×${free}</span>` : ""}</div>
      <div class="grow"><b class="case-name">${c.emoji} ${esc(c.name)}</b><div class="small muted">${esc(c.desc)}. Вещи из него не выпадают больше нигде.</div>
        <div class="case-tiers">${c.w.map((w, i) => `<i style="background:${Shop.TIERS[i].color};flex:${w}"></i>`).join("")}</div>
        <div class="row case-btns"><button class="btn small" data-a="case-open" data-v="${k}" ${can ? "" : "disabled"}>${free ? "Открыть бесплатно" : can ? `Открыть · 🪙 ${c.price}` : `Не хватает ${c.price - coins}`}</button>
          <button class="btn ghost small" data-a="case-odds" data-v="${k}">Шансы</button></div></div></div>`;
  }).join("");
}

function viewCaseList() {
  const coins = S.profile.coins;
  return `<div class="case-list">${seasonCards()}${Shop.CASES.map((c) => {
    const free = caseFree(c.key), can = free || coins >= c.price, sum = c.w.reduce((a, b) => a + b, 0);
    return `<div class="case-card c-${c.key}">
      <div class="case-art">${caseImg(c.key, 92)}${free ? `<span class="case-free">×${free}</span>` : ""}</div>
      <div class="grow"><b class="case-name">${esc(c.name)}</b><div class="small muted">${esc(c.desc)}</div>
        <div class="case-tiers">${c.w.map((w, i) => (w ? `<i style="background:${Shop.TIERS[i].color};flex:${w}" title="${Shop.TIERS[i].name} ${Math.round(w / sum * 100)}%"></i>` : "")).join("")}</div>
        <div class="row case-btns"><button class="btn small" data-a="case-open" data-v="${c.key}" ${can ? "" : "disabled"}>${free ? "Открыть бесплатно" : can ? `Открыть · 🪙 ${c.price}` : `Не хватает ${c.price - coins}`}</button>
          <button class="btn ghost small" data-a="case-odds" data-v="${c.key}">Шансы</button></div></div></div>`;
  }).join("")}</div>
  <div class="card small muted mt earn">${PX() ? Pixel.sprite("coin", 2) : "🪙"} Монеты: +${Shop.REWARD.game} за партию, +${Shop.REWARD.win} за победу, +${Shop.REWARD.alive} если дожил(а) до конца.
    ${Api.on ? `Повторная вещь превращается в ✨ осколки: ${[5, 12, 30, 80].map((d, i) => `<b style="color:${Shop.TIERS[i].color}">${d}</b>`).join(" / ")} — из них в мастерской делают новые вещи.` : `Повторная вещь превращается в монеты: ${Shop.DUP.map((d, i) => `<b style="color:${Shop.TIERS[i].color}">${d}</b>`).join(" / ")}.`}</div>`;
}

function caseOddsSheet(key) {
  const c = anyCase(key);
  if (!c) return "";
  if (c.season) {
    const sum = c.w.reduce((a, b) => a + b, 0), have = Shop.seasonPool(key).filter((it) => Shop.owns(it));
    return `<h2>${c.emoji} ${esc(c.name)}</h2><p class="muted small">Сезонный кейс: его вещи не выпадают больше нигде. Что внутри — секрет, пока не выбьешь.</p>
      <div class="odds">${c.w.map((w, i) => `<div class="odd"><span>${tierTag(i)}</span><b>${Math.round(w / sum * 1000) / 10}%</b></div>`).join("")}</div>
      <div class="section-title">Ты уже выбил · ${have.length} из ${Shop.seasonPool(key).length}</div>
      ${have.length ? `<div class="odds-items">${have.map((it) => `<span class="have">✓ ${esc(it.name)}</span>`).join("")}</div>` : `<div class="muted small">Пока ничего — всё впереди</div>`}`;
  }
  const sum = c.w.reduce((a, b) => a + b, 0), itemShare = (1 - c.egg) * (1 - c.food);
  const pct = (v) => (v >= .1 ? Math.round(v * 1000) / 10 : Math.round(v * 1000) / 10 || "<0.1") + "%";
  return `<h2>${esc(c.name)}</h2><p class="muted small">Шансы честные: выпадение решает сервер, а не телефон.</p>
    <div class="odds">${c.w.map((w, i) => (w ? `<div class="odd"><span>${tierTag(i)}</span><b>${pct(itemShare * w / sum)}</b></div>` : "")).join("")}
      ${c.food ? `<div class="odd"><span>🍖 Еда для питомцев ×2–4</span><b>${pct((1 - c.egg) * c.food)}</b></div>` : ""}
      ${c.egg ? `<div class="odd"><span>🥚 Яйцо питомца</span><b>${pct(c.egg)}</b></div>` : ""}</div>
    ${c.w.map((w, i) => (w ? `<div class="section-title">${tierTag(i)}</div><div class="odds-items">${Shop.POOL.filter((it) => Shop.tier(it) === i)
      .map((it) => `<span class="${Shop.owns(it) ? "have" : ""}">${Shop.owns(it) ? "✓ " : ""}${esc(it.name)}</span>`).join("")}</div>` : "")).join("")}`;
}

// игрушка в инвентаре: сколько копий, чья любимая, хватает ли на всех
function toyTileMarks(k) {
  const i = toyInfo(k);
  return `${i.n > 1 ? `<span class="toy-n">×${i.n}</span>` : ""}${i.lovers.length ? `<span class="toy-lovers">${i.lovers.slice(0, 4).map((x) => `<i title="${esc(Pets.name(x.dna))}">${Pets.sprite(petCode(x), 20)}</i>`).join("")}${i.lovers.length > 4 ? `<em>+${i.lovers.length - 4}</em>` : ""}<b>❤</b></span>` : ""}${i.short ? `<span class="toy-short">нужна ещё ${i.short}</span>` : ""}`;
}
function toyBar(it) {
  const i = toyInfo(it.id), names = (l) => l.map((x) => esc(Pets.name(x.dna))).join(", ");
  return `<div class="shop-bar toy-bar"><div class="grow"><b>${it.emoji} ${esc(it.name)}</b> <span class="small muted">· копий: ${i.n} из 4</span>
    <div class="small mt">${i.lovers.length ? `❤ Любимая у: <b>${names(i.lovers)}</b>` : `<span class="muted">Пока ничья не любимая</span>`}</div>
    ${i.short ? `<div class="small toy-warn">⚠️ Любят ${i.lovers.length}, а копий ${i.n}. Выбей ещё ${i.short} в «Питомнике» — иначе будут делить: добрые по очереди, а жадный или злой может вообще не отдать.</div>`
      : i.lovers.length > 1 ? `<div class="small good">✓ Копий хватает — каждому своя</div>` : ""}
    ${i.holders.length ? `<div class="small">🐾 Сейчас в лапах у: ${names(i.holders)}</div>` : ""}
    ${i.floor ? `<div class="small">🛋 Под диваном: ${i.floor} <button class="pill" data-a="toy-fetch" data-v="${it.id}">достать</button></div>` : ""}
    ${i.haters.length ? `<div class="small muted">Не любят: ${names(i.haters)} — могут зашвырнуть под диван</div>` : ""}</div>
    <button class="btn small" data-a="case-pets">🐾 К питомцам</button></div>`;
}

// инвентарь: только то, что реально есть у игрока (и стартовые вещи). Невыбитое не показываем вовсе — пусть будет сюрпризом.
function viewInv() {
  const p = S.profile, cat = S.shopCat || "frame";
  const items = Shop.ITEMS.filter((x) => x.cat === cat && Shop.owns(x)).sort((a, b) => (Shop.tier(b) - Shop.tier(a)) || (a.price - b.price));
  const tryIt = S.shopTry && S.shopTry.cat === cat ? Shop.byId(cat, S.shopTry.id) : null;
  const lookNow = Object.assign({}, p.look, tryIt && tryIt.cat !== "ava" ? { [cat]: tryIt.id } : {});
  const worn = (it) => (it.cat === "ava" ? p.avatar === it.emoji : p.look[it.cat] === it.id);
  const ranked = (it) => it.price || it.excl || it.season || it.petcase || it.mg;
  let bar = "";
  if (tryIt && Shop.owns(tryIt)) {
    const t = Shop.tier(tryIt), src = tryIt.excl ? (tryIt.cat === "title" && tryIt.desc ? "🐉 " + tryIt.desc : "👑 набор Создателя") : tryIt.season ? "🌙 " + (Shop.seasonByKey(tryIt.season) || {}).name : "";
    const m = tryIt.mg ? Pets.MUTATIONS.find((x) => x.key === tryIt.mg) : null;
    const act = tryIt.cat === "toy" ? `<button class="btn small" data-a="case-pets">🐾 К питомцам</button>` : tryIt.cat === "hat" || tryIt.cat === "mg" ? `<button class="btn small" data-a="case-pets">🐾 К питомцам</button>`
      : worn(tryIt) ? `<button class="btn small" disabled>Надето ✓</button>` : `<button class="btn small" data-a="shop-equip">Надеть</button>`;
    if (tryIt.cat === "toy" && typeof toyInfo === "function") bar = toyBar(tryIt);
    else bar = `<div class="shop-bar"><div class="grow"><b>${esc(tryIt.name)}</b><div class="small muted">${ranked(tryIt) ? tierTag(t) : ""} ${m ? `${m.emoji} ${esc(m.name)} — уколи питомцу со значком 🧬` : tryIt.cat === "hat" ? "Надевается питомцу в его карточке, снимается там же" : src ? esc(src) : worn(tryIt) ? "Надето" : "Есть у тебя"}</div></div>
      ${act}</div>`;
  }
  const petCat = ["toy", "hat", "mg"].includes(cat);
  return `<div class="shop-preview">${petCat ? `<div class="sp-big">${tryIt ? shopPreview(tryIt) : `<div class="muted small">${cat === "mg" ? "💉 Мутагены меняют облик питомца навсегда" : cat === "toy" ? "🧸 Игрушки для питомцев" : "🎩 Приколы на голову питомцу"}</div>`}</div>` : cat === "ava" ? `<div class="sp-big">${av(Object.assign({}, p, tryIt ? { avatar: tryIt.emoji, photo: null } : {}), "huge")}</div>` : myCard(lookNow)}</div>
    <div class="cats">${Shop.CATS.map((c) => { const have = Shop.ITEMS.filter((x) => x.cat === c.key && ranked(x) && Shop.owns(x)).length;
      return `<button class="pill ${c.key === cat ? "on" : ""}" data-a="shop-cat" data-v="${c.key}">${c.icon} ${c.name}${have ? ` <span class="seg-n">${have}</span>` : ""}</button>`; }).join("")}</div>
    <div class="shop-grid ${cat}">${items.map((it) => { const t = Shop.tier(it);
      return `<button class="shop-item ${tryIt === it ? "sel" : ""} ${worn(it) ? "worn" : ""}" style="--tc:${ranked(it) ? Shop.TIERS[t].color : "transparent"}" data-a="shop-try" data-v="${it.id}">
        ${shopPreview(it)}<b>${esc(it.name)}</b><span class="price">${worn(it) ? "✓ надето" : ranked(it) ? Shop.TIERS[t].name : "есть"}</span>${it.cat === "toy" ? toyTileMarks(it.id) : ""}</button>`; }).join("")}</div>
    ${items.filter(ranked).length ? "" : `<div class="card small muted center mt">${cat === "mg" ? "Шприцов пока нет. Их дают за турниры, а в «Питомнике» — шанс 0,01%" : petCat ? "Пока пусто — это выпадает из кейса «Питомник»" : "Здесь пока только стартовое. Всё, что выбьешь в кейсах, появится тут."}</div>`}
    ${bar}`;
}

/* ---------------------------------------------------------------- мастерская: осколки → вещи. Цены — как на сервере (/api/craft) */
const CRAFT = { up: [20, 50, 120], swap: [8, 20, 50, 120], make: [40, 100, 250, 700], brk: [4, 10, 25, 60] };
function viewCraft() {
  if (!Api.on) return `<div class="card mt">Мастерская работает через сервер — открой Настолкино из бота.</div>`;
  const st = Api.state; if (!st) return `<div class="card center mt"><div class="spinner" style="margin:10px auto"></div></div>`;
  const sh = st.shards || 0, inv = st.inv || [];
  const items = inv.map((k) => Shop.byKey(k)).filter((it) => it && !it.excl && !it.mg && (it.price || it.season || it.petcase)).sort((a, b) => Shop.tier(b) - Shop.tier(a));
  const sel = S.craftSel && inv.includes(S.craftSel) ? Shop.byKey(S.craftSel) : null;
  let panel = "";
  if (sel) {
    const t = Shop.tier(sel), seas = !!sel.season, worn = S.profile.look[sel.cat] === sel.id || (sel.cat === "ava" && S.profile.avatar === sel.emoji);
    panel = `<div class="card craft-panel"><div class="row"><div class="cp-prev">${shopPreview(sel)}</div><div class="grow"><b>${esc(sel.name)}</b><div>${tierTag(t)}</div>${worn ? `<div class="small muted">Сейчас надета — после переделки снимется</div>` : ""}</div></div>
      <div class="craft-ops">
        <button class="btn small" data-a="craft-op" data-v="up" ${seas || t >= 3 || sh < CRAFT.up[t] ? "disabled" : ""}>⬆️ Улучшить${t < 3 && !seas ? ` · ✨${CRAFT.up[t]}` : ""}</button>
        <button class="btn ghost small" data-a="craft-op" data-v="swap" ${seas || sh < CRAFT.swap[t] ? "disabled" : ""}>🔄 Перековать${seas ? "" : ` · ✨${CRAFT.swap[t]}`}</button>
        <button class="btn ghost small" data-a="craft-op" data-v="break">🔨 Разобрать · +✨${CRAFT.brk[t] * (seas ? 3 : 1)}</button></div>
      <div class="small muted mt">⬆️ — вещь исчезнет, взамен случайная из того же раздела редкостью выше (5% — через ступень!). 🔄 — случайная другая той же редкости. ${seas ? "Сезонные можно только разобрать — зато втрое дороже." : ""}</div></div>`;
  }
  return `<div class="card craft-head"><div class="ch-n">✨ ${sh}</div><div class="small">Осколки дают: повторы из кейсов, горсти осколков в кейсах, разбор вещей, победы в боях (+2) и колесо фортуны.</div></div>
    <div class="section-title">Создать из осколков</div>
    <div class="craft-make">${[0, 1, 2, 3].map((t) => `<button class="craft-t" style="--tc:${Shop.TIERS[t].color}" data-a="craft-make" data-v="${t}" ${sh < CRAFT.make[t] ? "disabled" : ""}>
      <b>${Shop.TIERS[t].name}</b><span>✨ ${CRAFT.make[t]}</span></button>`).join("")}</div>
    <div class="small muted mt">Случайная вещь, которой у тебя ещё нет.</div>
    <div class="section-title">Переделать свою вещь</div>
    ${panel}
    ${items.length ? `<div class="shop-grid craft-grid">${items.map((it) => `<button class="shop-item ${S.craftSel === it.cat + ":" + it.id ? "sel" : ""}" style="--tc:${Shop.TIERS[Shop.tier(it)].color}" data-a="craft-sel" data-v="${it.cat}:${it.id}">
      ${shopPreview(it)}<b>${esc(it.name)}</b><span class="price">${Shop.TIERS[Shop.tier(it)].name}</span></button>`).join("")}</div>` : `<div class="card small muted center">Вещей для переделки пока нет — открой пару кейсов</div>`}`;
}
function craftUnwear(k) {
  const it = Shop.byKey(k);
  if (it && store.look && store.look[it.cat] === it.id) { store.look[it.cat] = Shop.DEFAULT[it.cat]; saveProfile(); syncProfile(); }
}
function craftDo(body) {
  Api.act("/api/craft", body).then((st) => {
    const c = st.craft; S.craftSel = null;
    if (c.from) craftUnwear(c.from);
    if (c.op === "break") { haptic("medium"); toast(`🔨 Разобрано: +${c.shards} ✨`); render(); return; }
    notify("success"); coinRain();
    S.sheet = { type: "craft-done", item: c.item, crit: c.crit }; renderOverlay(); render();
  }).catch((e) => { notify("error"); toast(e.message); });
}
function craftDoneSheet() {
  const it = Shop.byKey(S.sheet.item); if (!it) return "";
  const t = Shop.tier(it);
  return `<div class="center"><h2>${S.sheet.crit ? "💥 Удачная ковка!" : "⚒ Готово!"}</h2><div class="cl-prize">${shopPreview(it)}</div>
    <div class="cl-name" style="color:${Shop.TIERS[t].color}">${esc(it.name)}</div>${tierTag(t)}
    ${S.sheet.crit ? `<div class="small mt">Вещь получилась сразу через ступень редкости!</div>` : ""}
    ${["toy", "hat"].includes(it.cat) ? "" : `<button class="btn mt2" data-a="case-equip" data-v="${it.cat}:${it.id}">Надеть</button>`}</div>`;
}

/* ---------------------------------------------------------------- открытие: лента с предметами */
let caseBusy = false;
const caseLayer = () => document.getElementById("case-layer");
function caseThumb(d) {
  if (d.type === "mystery") return `<div class="ct-ico mystery">❔</div>`;
  if (d.type === "egg") return `<div class="ct-ico egg">🥚</div>`;
  if (d.type === "food") return `<div class="ct-ico">${Pets.FOOD_EMOJI[d.item] || "🍖"}</div>`;
  if (d.type === "shards") return `<div class="ct-ico">✨</div>`;
  const it = Shop.byKey(d.item);
  if (!it) return "";
  if (it.cat === "frame") return `<div class="ct-av">${av(Object.assign({}, S.profile, { look: { frame: it.id } }), "")}</div>`;
  if (it.cat === "bg") return `<div class="ct-bg" style="background-image:url(${Pixel.scene(it.id)})"></div>`;
  if (it.cat === "style") return `<div class="ct-ico">🪪</div>`;
  if (it.cat === "toy") return `<div class="ct-ico">${it.emoji}</div>`;
  if (it.cat === "hat") return `<div class="ct-ico">${Pets.sprite("2" + "8c3a9c51e2b84d06a1c3f5e7092b4d6e-" + it.id, 44)}</div>`;
  if (it.cat === "mg") return `<div class="ct-ico">${Pets.syringe(40)}</div>`;
  if (it.cat === "title") return `<div class="ct-title">«${esc(it.text)}»</div>`;
  if (it.cat === "fx") return `<div class="ct-fx">${Shop.nameFx(String(S.profile.name || "Имя").slice(0, 7), it.id)}</div>`;
  return `<div class="ct-ico">${emo(it.emoji, 32)}</div>`;
}
const dropTier = (d) => (d.type === "mystery" ? d.tier : d.type === "item" ? Shop.tier(Shop.byKey(d.item)) : d.type === "egg" ? 3 : 0);
const dropName = (d) => (d.type === "mystery" ? "???" : d.type === "shards" ? `Осколки ×${d.qty}` : d.type === "egg" ? "Яйцо питомца" : d.type === "food" ? (Api.state && Api.state.foods && Api.state.foods[d.item] ? Api.state.foods[d.item].name : "Еда") + " ×" + d.qty : (Shop.byKey(d.item) || {}).name || "");
const caseCell = (d) => `<div class="rcell" style="--tc:${Shop.TIERS[dropTier(d)].color}">${caseThumb(d)}<span>${esc(dropName(d))}</span></div>`;

function caseLayerOpen(c) {
  const old = caseLayer(); if (old) old.remove();
  const el = document.createElement("div");
  el.id = "case-layer"; el.className = "case-layer c-" + c.key;
  el.innerHTML = `<div class="cl-box"><div class="cl-title">${esc(c.name)}</div><div class="cl-art shake">${caseImg(c.key, 150)}</div><div class="muted small mt">Открываем…</div></div>`;
  document.body.appendChild(el);
  if (PX()) Pixel.apply(el);
}
function caseLayerClose() { const el = caseLayer(); if (el) el.remove(); caseBusy = false; }

function caseSpin(c, drop) {
  const el = caseLayer();
  if (!el) return;
  const N = 46, WIN = 38, cells = [];
  for (let i = 0; i < N; i++) {
    if (i === WIN) { cells.push(drop); continue; }
    if (c.food && Math.random() < c.food * .6) { cells.push({ type: "food", item: Pets.FOOD_KEYS[Math.floor(Math.random() * Pets.FOOD_KEYS.length)], qty: 2 }); continue; }
    if (c.season) { cells.push({ type: "mystery", tier: Shop.rollTier(c.w) }); continue; }     // сезонные вещи держим в секрете
    const it = Shop.rollItem(Shop.rollTier(c.w), c);
    cells.push({ type: "item", item: it.cat + ":" + it.id });
  }
  el.innerHTML = `<div class="cl-box"><div class="cl-title">${esc(c.name)}</div>
    <div class="reel"><div class="reel-strip" id="reel-strip">${cells.map(caseCell).join("")}</div><i class="reel-mark"></i></div>
    <div class="cl-res" id="cl-res"><div class="muted small">Крутим…</div></div></div>`;
  if (PX()) Pixel.apply(el);
  const strip = el.querySelector("#reel-strip"), reel = el.querySelector(".reel"), CW = 92;
  const target = WIN * CW + CW / 2 - reel.clientWidth / 2 + (Math.random() - .5) * 60;
  strip.getBoundingClientRect();
  strip.style.transition = "transform 5.4s cubic-bezier(.06,.62,.12,1)";
  strip.style.transform = `translateX(${-target}px)`;
  let last = -1, done = false;
  const tick = () => {
    if (done || !strip.isConnected) return;
    const m = new DOMMatrixReadOnly(getComputedStyle(strip).transform), idx = Math.floor((-m.m41 + reel.clientWidth / 2) / CW);
    if (idx !== last) { last = idx; try { tg && tg.HapticFeedback.selectionChanged(); } catch (e) { /* нет */ } }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const finish = () => { if (done) return; done = true; caseResult(c, drop); };
  strip.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 6000);
}

function caseResult(c, drop) {
  caseBusy = false;
  const box = document.getElementById("cl-res");
  if (!box) return;
  const t = dropTier(drop), it = drop.type === "item" ? Shop.byKey(drop.item) : null;
  const win = document.querySelectorAll("#reel-strip .rcell")[38];
  if (win) win.classList.add("won");
  let prize = "", info = "", main = "";
  if (it) {
    prize = `<div class="cl-prize">${shopPreview(it)}</div>`;
    info = drop.copy ? `<div class="cl-dup">🧸 Ещё одна копия! Теперь их <b>${drop.copy}</b> — меньше ссор из-за игрушки</div>` : drop.dup ? `<div class="cl-dup">Повтор — уже есть. Превратилось в <b>${drop.shards != null ? `+${drop.shards} ✨ осколков` : `+${drop.refund} 🪙`}</b></div>`
      : it.mg ? `<div class="small">💉 Мутаген! Уколи питомцу со значком 🧬 — облик изменится навсегда</div>` : `<div class="small muted">Уже в инвентаре</div>`;
    if (!drop.dup) main = ["toy", "hat", "mg"].includes(it.cat) ? `<button class="btn" data-a="case-pets">🐾 К питомцам</button>` : `<button class="btn" data-a="case-equip" data-v="${esc(drop.item)}">Надеть</button>`;
  } else if (drop.type === "shards") {
    prize = `<div class="cl-prize big-emo">✨</div>`;
    info = `<div class="small">Осколки — для мастерской: из них создают и улучшают вещи</div>`;
    main = `<button class="btn" data-a="case-craft">⚒ В мастерскую</button>`;
  } else if (drop.type === "food") {
    prize = `<div class="cl-prize big-emo">${Pets.FOOD_EMOJI[drop.item] || "🍖"}</div>`;
    info = `<div class="small muted">Лежит в кладовке питомцев</div>`;
  } else if (drop.type === "egg") {
    const p = Api.state && Api.state.pets.find((x) => x.id === drop.pet);
    prize = `<div class="cl-prize">${p ? Pets.sprite(p.rarity + p.dna, 120, { egg: true }) : '<div class="big-emo">🥚</div>'}</div>`;
    info = `<div class="small">Яйцо питомца! Вылупится через сутки</div>`;
    main = `<button class="btn" data-a="case-pets">🐾 К питомцам</button>`;
  }
  const free = caseFree(c.key), can = free || (S.profile.coins >= c.price && (!c.season || (Api.state.season && Api.state.season.key === c.key && seasonLeft() > 0)));
  box.innerHTML = `${prize}<div class="cl-name" style="color:${Shop.TIERS[t].color}">${esc(dropName(drop))}</div>${drop.type === "item" ? tierTag(t) : ""}${info}
    <div class="cl-btns">${main}<button class="btn ghost" data-a="case-again" data-v="${c.key}" ${can ? "" : "disabled"}>${free ? `Ещё (бесплатно ×${free})` : `Ещё · 🪙 ${c.price}`}</button>
    <button class="btn ghost" data-a="case-close">Закрыть</button></div>`;
  if (PX()) Pixel.apply(box);
  notify(t >= 2 || drop.type === "egg" ? "success" : "warning");
  if (t >= 3 || drop.type === "egg") coinRain();
}

function caseOpen(key) {
  if (caseBusy) return;
  const c = anyCase(key);
  if (!c) return;
  const free = caseFree(key);
  if (!free && S.profile.coins < c.price) { notify("error"); return toast(`Не хватает ${c.price - S.profile.coins} монет`); }
  if (Api.on && !Api.ready) return toast("Нет связи с сервером, попробуй через минуту");
  if (c.season && !Api.on) return toast("Сезонные кейсы работают через сервер");
  caseBusy = true; haptic("heavy");
  caseLayerOpen(c);
  if (Api.on) {
    Api.act("/api/case/open", { kind: key }).then((st) => setTimeout(() => caseSpin(c, st.drop), 450))
      .catch((e) => { caseLayerClose(); notify("error"); toast(e.message); });
  } else {
    const r = Shop.openCaseLocal(key);
    if (r.error) { caseLayerClose(); return toast(r.error); }
    saveProfile(); render();
    setTimeout(() => caseSpin(c, r), 450);
  }
}

// «Назад» в Telegram: сначала закрыть открытие кейса (если лента уже остановилась)
function caseBack() { if (!caseLayer()) return false; if (!caseBusy) { caseLayerClose(); render(); } return true; }

const CASE_ACTIONS = {
  "shop-tab": (v) => { S.shopTab = v; S.shopTry = null; haptic(); render(); window.scrollTo(0, 0); },
  "case-open": caseOpen,
  "case-again": (key) => { caseLayerClose(); caseOpen(key); },
  "case-close": () => { caseLayerClose(); render(); },
  "case-odds": (key) => { S.sheet = { type: "case-odds", key }; renderOverlay(); },
  "case-craft": () => { caseLayerClose(); S.screen = "shop"; S.shopTab = "craft"; render(); window.scrollTo(0, 0); },
  "craft-sel": (k) => { S.craftSel = S.craftSel === k ? null : k; haptic(); render(); },
  "craft-make": (t) => craftDo({ op: "make", tier: Number(t) }),
  "craft-op": (op) => {
    const k = S.craftSel; if (!k) return;
    const it = Shop.byKey(k), q = op === "break" ? `Разобрать «${it.name}» на осколки?` : op === "up" ? `Улучшить «${it.name}»? Она исчезнет, взамен — вещь редкостью выше.` : `Перековать «${it.name}» в другую вещь той же редкости?`;
    const go = () => craftDo({ op, item: k });
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "case-pets": () => { caseLayerClose(); S.screen = "pets"; S.petSel = null; render(); window.scrollTo(0, 0); },
  "case-equip": (k) => {
    const it = Shop.byKey(k);
    if (it && Shop.equip(it)) { saveProfile(); syncProfile(); notify("success"); toast(`Надето: ${it.name} ✓`); }
    if (S.sheet && S.sheet.type === "craft-done") { S.sheet = null; renderOverlay(); }
    caseLayerClose(); render();
  },
};

// обратный отсчёт сезонного кейса; исчез — перерисовать витрину
setInterval(() => {
  if (S.screen !== "shop") return;
  const el = document.querySelector("[data-season-until]");
  if (!el) return;
  const left = seasonLeft();
  el.textContent = fmtLeft(left);
  if (left <= 0 && !caseBusy) { Api.state.season = null; render(); }
}, 1000);
