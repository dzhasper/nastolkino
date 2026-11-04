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
    s_dawn: { wood: "#ff9a6a", dark: "#b8504a", light: "#ffd0a0", metal: "#fff4d0", mlight: "#ffffff", lock: "#ff6a8a", glow: "#ffe066" },
    s_noon: { wood: "#ffc21a", dark: "#c8800a", light: "#fff0a0", metal: "#3ac0ff", mlight: "#bfefff", lock: "#ffffff", glow: "#ffffff" },
    s_dusk: { wood: "#c84a6a", dark: "#6a1a4a", light: "#ff8a5a", metal: "#ffd23f", mlight: "#fff0a0", lock: "#ffd23f", glow: "#ff9ad0" },
    s_night: { wood: "#2a2a7a", dark: "#10103a", light: "#4a4ad0", metal: "#c8d0ff", mlight: "#ffffff", lock: "#ffe066", glow: "#c8d0ff" },
    s_halloween: { wood: "#ff7a18", dark: "#a83a08", light: "#ffb060", metal: "#2a1a3a", mlight: "#5a3a7a", lock: "#7aff6a", glow: "#7aff6a" },
    s_cosmos: { wood: "#3a1a7a", dark: "#14062a", light: "#6a3ad0", metal: "#7ae0ff", mlight: "#ffffff", lock: "#ff7ae0", glow: "#7ae0ff" },
    s_olymp: { wood: "#fff4d0", dark: "#c8a050", light: "#ffffff", metal: "#ffc21a", mlight: "#fff8c0", lock: "#3ac0ff", glow: "#ffe066" },
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
    if ((key === "dark" || key === "s_neon" || key === "s_moon" || key === "s_night" || key === "s_halloween" || key === "s_cosmos") && y >= 16 && y <= 20 && (xx === 10 || xx === 20) ) col = pal.glow;
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
const seasonsLive = () => (Api.on && Api.state ? Api.state.seasons || (Api.state.season ? [Api.state.season] : []) : []);
const seasonLeft = (k) => { const se = seasonsLive().find((x) => !k || x.key === k); return se ? se.until - (Date.now() + (Api.state.skew || 0)) / 1000 : 0; };
const seasonOnShelf = (k) => seasonLeft(k) > 0;
const WHEN_RU = { dawn: "🌅 буває лише вранці", noon: "☀️ буває лише вдень", dusk: "🌇 буває лише ввечері", night: "🌙 буває лише вночі", any: "🎲 з’являється у випадковий час", super: "🌌 СУПЕРРІДКІСНИЙ · три речі одразу" };
const fmtLeft = (sec) => `${Math.floor(Math.max(0, sec) / 60)}:${String(Math.floor(Math.max(0, sec) % 60)).padStart(2, "0")}`;
const caseFree = (key) => (Api.on && Api.state && Api.state.cases && Api.state.cases[key]) || 0;
const invCount = () => Shop.ITEMS.filter((it) => (it.price || it.excl || it.season || it.petcase || it.mg) && Shop.owns(it)).length;
const shardPill = () => (Api.on && Api.state ? `<span class="pill shard-pill" data-a="shop-tab" data-v="craft">✨ ${Api.state.shards || 0}</span>` : "");
const tierTag = (t) => `<span class="tier-tag" style="--tc:${Shop.TIERS[t].color}">${Shop.TIERS[t].name}</span>`;

function viewShop() {
  const tab = S.shopTab || "cases";
  return `<div class="fade-in">
    <div class="pxscene shop-scene" style="background-image:url(${Pixel.scene("shop")})"><div class="shop-sign">${tab === "inv" ? "Інвентар" : tab === "craft" ? "Майстерня" : "Кейси"}</div></div>
    <div class="top"><div class="grow"><h1>${tab === "inv" ? "Інвентар" : tab === "craft" ? "Майстерня" : "Кейси"}</h1><div class="muted small">${tab === "inv" ? "Усе вибите — тут. Натисни, щоб приміряти" : tab === "craft" ? "Уламки й ключі до кейсів" : "Речі лише вибиваються — відкривай за монети"}</div></div>${shardPill()}${coinPill()}</div>
    ${dailyCard()}
    <div class="seg seg3 mt">
      <button class="${tab === "cases" ? "on" : ""}" data-a="shop-tab" data-v="cases">🎁 Кейси</button>
      <button class="${tab === "inv" ? "on" : ""}" data-a="shop-tab" data-v="inv">🎒 Речі <span class="seg-n">${invCount()}</span></button>
      <button class="${tab === "craft" ? "on" : ""}" data-a="shop-tab" data-v="craft">⚒ Майстерня</button>
    </div>
    ${tab === "inv" ? viewInv() : tab === "craft" ? viewCraft() : viewCaseList()}
  </div>${tabs()}`;
}

function seasonCards() {
  const coins = S.profile.coins, live = seasonsLive().filter((x) => seasonOnShelf(x.key)).map((x) => x.key);
  const keys = [...new Set([...live, ...Shop.SEASONS.map((x) => x.key).filter((k) => caseFree(k))])];
  const cards = keys.map((k) => {
    const c = anyCase(k), free = caseFree(k), on = live.includes(k), can = free || (on && coins >= c.price);
    return `<div class="case-card season c-${k} ${c.triple ? "super" : ""}" style="--sc:${c.color}"><div class="season-tag">${on ? `⏳ зникне через <b data-season-until="${k}">${fmtLeft(seasonLeft(k))}</b>` : "🎟 твоя сезонна скриня"}</div>
      <div class="case-art">${caseImg(k, 92)}${free ? `<span class="case-free">×${free}</span>` : ""}</div>
      <div class="grow"><b class="case-name">${c.emoji} ${esc(c.name)}</b><div class="small muted">${esc(c.desc)}. Речі з нього більше ніде не випадають.</div>
        <div class="season-when">${WHEN_RU[c.when] || ""}</div>
        <div class="case-tiers">${c.w.map((w, i) => (w ? `<i style="background:${Shop.TIERS[i].color};flex:${w}"></i>` : "")).join("")}</div>
        <div class="row case-btns"><button class="btn small" data-a="case-open" data-v="${k}" ${can ? "" : "disabled"}>${free ? "Відкрити безплатно" : can ? `Відкрити · 🪙 ${c.price}` : `Бракує ${c.price - coins}`}</button>
          <button class="btn ghost small" data-a="case-odds" data-v="${k}">Шанси</button></div></div></div>`;
  }).join("");
  return cards + (Api.on && !live.length ? `<div class="card small season-hint">🌗 <b>Сезонні скрині</b> з’являються на годину: свої — вранці, вдень, увечері й уночі, тематичні — у випадковий час, а зрідка — суперскриня на три речі одразу. Поява — пост у групі.</div>` : "");
}

function viewCaseList() {
  const coins = S.profile.coins;
  return `<div class="case-list">${seasonCards()}${Shop.CASES.map((c) => {
    const free = caseFree(c.key), can = free || coins >= c.price, sum = c.w.reduce((a, b) => a + b, 0);
    return `<div class="case-card c-${c.key}">
      <div class="case-art">${caseImg(c.key, 92)}${free ? `<span class="case-free">×${free}</span>` : ""}</div>
      <div class="grow"><b class="case-name">${esc(c.name)}</b><div class="small muted">${esc(c.desc)}</div>
        <div class="case-tiers">${c.w.map((w, i) => (w ? `<i style="background:${Shop.TIERS[i].color};flex:${w}" title="${Shop.TIERS[i].name} ${Math.round(w / sum * 100)}%"></i>` : "")).join("")}</div>
        <div class="row case-btns"><button class="btn small" data-a="case-open" data-v="${c.key}" ${can ? "" : "disabled"}>${free ? "Відкрити безплатно" : can ? `Відкрити · 🪙 ${c.price}` : `Бракує ${c.price - coins}`}</button>
          <button class="btn ghost small" data-a="case-odds" data-v="${c.key}">Шанси</button></div></div></div>`;
  }).join("")}</div>
  <div class="card small muted mt earn">${PX() ? Pixel.sprite("coin", 2) : "🪙"} Монети: +${Shop.REWARD.game} за партію, +${Shop.REWARD.win} за перемогу, +${Shop.REWARD.alive} якщо дожив(ла) до кінця.
    ${Api.on ? `Повторна річ не зникає — копії накопичуються (×2, ×3…). У майстерні 5 речей однієї рідкісності міняються на одну — з шансом на вищу рідкісність, а ✨ уламки — на ключі до кейсів.` : `Повторна річ перетворюється на монети: ${Shop.DUP.map((d, i) => `<b style="color:${Shop.TIERS[i].color}">${d}</b>`).join(" / ")}.`}</div>`;
}

function caseOddsSheet(key) {
  const c = anyCase(key);
  if (!c) return "";
  if (c.season) {
    const sum = c.w.reduce((a, b) => a + b, 0), have = Shop.seasonPool(key).filter((it) => Shop.owns(it));
    return `<h2>${c.emoji} ${esc(c.name)}</h2><p class="muted small">Сезонний кейс: його речі більше ніде не випадають. Що всередині — секрет, доки не виб’єш.</p>
      <div class="odds">${c.w.map((w, i) => `<div class="odd"><span>${tierTag(i)}</span><b>${Math.round(w / sum * 1000) / 10}%</b></div>`).join("")}</div>
      <div class="section-title">Ти вже вибив · ${have.length} з ${Shop.seasonPool(key).length}</div>
      ${have.length ? `<div class="odds-items">${have.map((it) => `<span class="have">✓ ${esc(it.name)}</span>`).join("")}</div>` : `<div class="muted small">Поки нічого — усе попереду</div>`}`;
  }
  const sum = c.w.reduce((a, b) => a + b, 0), itemShare = (1 - c.egg) * (1 - c.food);
  const pct = (v) => (v >= .1 ? Math.round(v * 1000) / 10 : Math.round(v * 1000) / 10 || "<0.1") + "%";
  return `<h2>${esc(c.name)}</h2><p class="muted small">Шанси чесні: випадіння вирішує сервер, а не телефон.</p>
    <div class="odds">${c.w.map((w, i) => (w ? `<div class="odd"><span>${tierTag(i)}</span><b>${pct(itemShare * w / sum)}</b></div>` : "")).join("")}
      ${c.food ? `<div class="odd"><span>🍖 Їжа для улюбленців ×2–4</span><b>${pct((1 - c.egg) * c.food)}</b></div>` : ""}
      ${c.egg ? `<div class="odd"><span>🥚 Яйце улюбленця</span><b>${pct(c.egg)}</b></div>` : ""}</div>
    ${c.w.map((w, i) => { if (!w) return ""; const L = Shop.poolOf(c).filter((it) => Shop.tier(it) === i), mine = L.filter((it) => Shop.owns(it)).length;
      return `<div class="section-title">${tierTag(i)} · ${L.length} речей, у тебе ${mine}</div><div class="odds-items">${L.slice(0, 36)
      .map((it) => `<span class="${Shop.owns(it) ? "have" : ""}">${Shop.owns(it) ? "✓ " : ""}${esc(it.name)}</span>`).join("")}${L.length > 36 ? `<span class="muted">…і ще ${L.length - 36}</span>` : ""}</div>`; }).join("")}`;
}

// игрушка в инвентаре: сколько копий, чья любимая, хватает ли на всех
function toyTileMarks(k) {
  const i = toyInfo(k);
  return `${i.n > 1 ? `<span class="toy-n">×${i.n}</span>` : ""}${i.lovers.length ? `<span class="toy-lovers">${i.lovers.slice(0, 4).map((x) => `<i title="${esc(Pets.name(x.dna))}">${Pets.sprite(petCode(x), 20)}</i>`).join("")}${i.lovers.length > 4 ? `<em>+${i.lovers.length - 4}</em>` : ""}<b>❤</b></span>` : ""}${i.short ? `<span class="toy-short">потрібна ще ${i.short}</span>` : ""}`;
}
function toyBar(it) {
  const i = toyInfo(it.id), names = (l) => l.map((x) => esc(Pets.name(x.dna))).join(", ");
  return `<div class="shop-bar toy-bar"><div class="grow"><b>${it.emoji} ${esc(it.name)}</b> <span class="small muted">· копій: ${i.n} з 4</span>
    <div class="small mt">${i.lovers.length ? `❤ Улюблена в: <b>${names(i.lovers)}</b>` : `<span class="muted">Поки нічия не улюблена</span>`}</div>
    ${i.short ? `<div class="small toy-warn">⚠️ Люблять ${i.lovers.length}, а копій ${i.n}. Вибий ще ${i.short} у «Розпліднику» — інакше ділитимуть: добрі по черзі, а жадібний чи злий може й зовсім не віддати.</div>`
      : i.lovers.length > 1 ? `<div class="small good">✓ Копій вистачає — кожному своя</div>` : ""}
    ${i.holders.length ? `<div class="small">🐾 Зараз у лапах у: ${names(i.holders)}</div>` : ""}
    ${i.floor ? `<div class="small">🛋 Під диваном: ${i.floor} <button class="pill" data-a="toy-fetch" data-v="${it.id}">дістати</button></div>` : ""}
    ${i.haters.length ? `<div class="small muted">Не люблять: ${names(i.haters)} — можуть закинути під диван</div>` : ""}</div>
    <button class="btn small" data-a="case-pets">🐾 До улюбленців</button></div>`;
}

// инвентарь: только то, что реально есть у игрока (и стартовые вещи). Невыбитое не показываем вовсе — пусть будет сюрпризом.
function viewInv() {
  const p = S.profile, cat = S.shopCat || "frame";
  const items = Shop.ITEMS.filter((x) => x.cat === cat && Shop.owns(x)).sort((a, b) => (Shop.tier(b) - Shop.tier(a)) || (a.price - b.price));
  const tryIt = S.shopTry && S.shopTry.cat === cat ? Shop.byId(cat, S.shopTry.id) : null;
  const lookNow = Object.assign({}, p.look, tryIt && tryIt.cat !== "ava" ? { [cat]: tryIt.id } : {});
  const worn = (it) => (it.cat === "ava" ? p.badge === it.emoji : p.look[it.cat] === it.id);
  const ranked = (it) => it.price || it.excl || it.season || it.petcase || it.mg;
  let bar = "";
  if (tryIt && Shop.owns(tryIt)) {
    const t = Shop.tier(tryIt), src = tryIt.coll ? "🐉 " + tryIt.desc : tryIt.excl ? (tryIt.cat === "title" && tryIt.desc ? "🐉 " + tryIt.desc : "👑 набір Творця") : tryIt.season ? "🌙 " + (Shop.seasonByKey(tryIt.season) || {}).name : "";
    const m = tryIt.mg ? Pets.MUTATIONS.find((x) => x.key === tryIt.mg) : null;
    const act = tryIt.cat === "toy" ? `<button class="btn small" data-a="case-pets">🐾 До улюбленців</button>` : tryIt.cat === "hat" || tryIt.cat === "mg" ? `<button class="btn small" data-a="case-pets">🐾 До улюбленців</button>`
      : tryIt.cat === "pic" ? (worn(tryIt) ? `<button class="btn small ghost" data-a="pic-set" data-v="none">Повернути фото Telegram</button>` : `<button class="btn small" data-a="shop-equip">Поставити аватаркою</button>`)
      : tryIt.cat === "ava" ? (worn(tryIt) ? `<button class="btn small ghost" data-a="badge" data-v="none">Зняти з ніка</button>` : `<button class="btn small" data-a="shop-equip">Поставити біля ніка</button>`)
      : worn(tryIt) ? `<button class="btn small" disabled>Вдягнуто ✓</button>` : `<button class="btn small" data-a="shop-equip">Вдягнути</button>`;
    if (tryIt.cat === "toy" && typeof toyInfo === "function") bar = toyBar(tryIt);
    else bar = `<div class="shop-bar"><div class="grow"><b>${esc(tryIt.name)}</b><div class="small muted">${ranked(tryIt) ? tierTag(t) : ""} ${m ? `${m.emoji} ${esc(m.name)} — уколи улюбленцю зі значком 🧬` : tryIt.cat === "hat" ? "У бою: " + Pets.hatFxText(tryIt.id) + ". Вдягається улюбленцю в його картці" : src ? esc(src) : worn(tryIt) ? "Вдягнуто" : "Є в тебе"}</div></div>
      ${act}</div>`;
  }
  if (S.craft && Api.on) return viewCraftBench();
  if (bar && tryIt && Api.on && craftOk(tryIt)) bar = bar.replace(/<\/div>\s*$/, `<button class="btn small ghost craft-btn" data-a="craft-start" data-v="${tryIt.cat}:${tryIt.id}">⚒ Крафт</button></div>`);
  const petCat = ["toy", "hat", "mg"].includes(cat);
  return `<div class="shop-preview">${petCat ? `<div class="sp-big">${tryIt ? shopPreview(tryIt) : `<div class="muted small">${cat === "mg" ? "💉 Мутагени змінюють вигляд улюбленця назавжди" : cat === "toy" ? "🧸 Іграшки для улюбленців" : "🎩 Приколи на голову улюбленцю"}</div>`}</div>` : cat === "ava" ? `<div class="sp-big sp-nick"><div class="nick-prev">${nm(Object.assign({}, p, { name: Shop.withBadge(p.base || p.name, tryIt ? tryIt.emoji : p.badge) }))}</div><div class="small muted">Значок стоїть у кінці ніка — лише один</div></div>` : myCard(lookNow)}</div>
    <div class="cats">${Shop.CATS.map((c) => { const have = Shop.ITEMS.filter((x) => x.cat === c.key && ranked(x) && Shop.owns(x)).length;
      return `<button class="pill ${c.key === cat ? "on" : ""}" data-a="shop-cat" data-v="${c.key}">${c.icon} ${c.name}${have ? ` <span class="seg-n">${have}</span>` : ""}</button>`; }).join("")}</div>
    <div class="shop-grid ${cat}">${items.map((it) => { const t = Shop.tier(it);
      return `<button class="shop-item ${tryIt === it ? "sel" : ""} ${worn(it) ? "worn" : ""}" style="--tc:${ranked(it) ? Shop.TIERS[t].color : "transparent"}" data-a="shop-try" data-v="${it.id}">
        ${shopPreview(it)}<b>${esc(it.name)}</b><span class="price">${worn(it) ? "✓ вдягнуто" : ranked(it) ? Shop.TIERS[t].name : "є"}</span>${it.cat === "toy" ? toyTileMarks(it.id) : invN(it.cat + ":" + it.id) > 1 ? `<span class="inv-n">×${invN(it.cat + ":" + it.id)}</span>` : ""}</button>`; }).join("")}</div>
    ${items.filter(ranked).length ? "" : `<div class="card small muted center mt">${cat === "mg" ? "Шприців поки немає. Їх дають за турніри, а в «Розпліднику» — шанс 0,01%" : petCat ? "Поки порожньо — це випадає з кейса «Розплідник»" : "Тут поки тільки стартове. Усе, що виб’єш у кейсах, з’явиться тут."}</div>`}
    ${bar}`;
}

/* ---------------------------------------------------------------- мастерская: ключи за осколки (как на сервере: /api/craft) */
const KEY_COST = 50, KEY_ODDS = [["Підвальний", 40], ["«Розплідник»", 22], ["Темний", 22], ["Легендарний", 6], ["Сезонний — будь-який, навіть якого немає на вітрині", 10]];
const invN = (k) => ((Api.state && Api.state.invn) || {})[k] || (store.owned.includes(k) ? 1 : 0);   // сколько копий вещи
function viewCraft() {
  if (!Api.on) return `<div class="card mt">Майстерня працює через сервер — відкрий Настолкіно з бота.</div>`;
  const st = Api.state; if (!st) return `<div class="card center mt"><div class="spinner" style="margin:10px auto"></div></div>`;
  const sh = st.shards || 0, keys = Object.entries(st.cases || {}).filter(([, n]) => n > 0);
  return `<div class="card craft-head"><div class="ch-n">✨ ${sh}</div><div class="small">Уламки дають жмені в кейсах, колесо фортуни й перемоги в боях.</div></div>
    <div class="section-title">🔑 Ключі</div>
    <div class="card key-card"><div class="row"><span class="key-ico">🗝</span><div class="grow"><b>Ключ до випадкового кейса</b>
      <div class="small muted">${KEY_ODDS.map(([n, p]) => `${n} — ${p}%`).join(" · ")}</div></div></div>
      <button class="btn mt" data-a="craft-key" ${sh < KEY_COST ? "disabled" : ""}>🔑 Викувати ключ · ✨${KEY_COST}</button></div>
    ${keys.length ? `<div class="key-list">${keys.map(([k, n]) => { const c = anyCase(k); return c ? `<div class="key-row"><div class="kr-art">${caseImg(k, 44)}</div><div class="grow"><b>${esc(c.name)}</b><div class="small muted">🔑 ключів: ${n}${c.season ? " · сезонний, відкривається будь-коли" : ""}</div></div><button class="btn small" data-a="case-open" data-v="${k}">Відкрити</button></div>` : ""; }).join("")}</div>` : ""}
    <div class="card small muted mt">⚒ <b>Крафт</b> — в інвентарі: натисни на будь-яку річ → «⚒ Крафт» і доклади ще речей тієї самої категорії й рідкісності (усього 5).</div>`;
}

/* ---------------------------------------------------------------- крафт из инвентаря: 5 вещей одной категории и редкости → одна той же категории, такой же редкости или лучше */
const CRAFT_ODDS = [[55, 40, 5], [70, 30], [80, 20]];                 // та же / +1 / +2 — как на сервере
const CRAFT_CATS = ["frame", "bg", "style", "fx", "title", "ava", "pic", "toy", "hat"];
// крафтится то, что выпадает из кейсов, «Питомника» и сезонных сундуков; не крафтятся легендарки, вещи админа и награды пропуска
const craftOk = (it) => !!it && CRAFT_CATS.includes(it.cat) && !it.excl && !it.mg && !it.pass && (it.price > 0 || it.petcase || it.season) && Shop.tier(it) < 3;
function viewCraftBench() {
  const c = S.craft, t = c.tier, cat = Shop.CATS.find((x) => x.key === c.cat) || { name: c.cat, icon: "" }, sel = c.sel;
  const used = (k) => sel.filter((x) => x === k).length;
  const items = ((Api.state && Api.state.inv) || []).map((k) => Shop.byKey(k)).filter((it) => craftOk(it) && it.cat === c.cat && Shop.tier(it) === t)
    .sort((a, b) => invN(b.cat + ":" + b.id) - invN(a.cat + ":" + a.id));
  const odds = CRAFT_ODDS[t] || [];
  return `<div class="card craft-bench" style="--tc:${Shop.TIERS[t].color}">
      <div class="row"><div class="grow"><b>⚒ Крафт · ${cat.icon} ${esc(cat.name)}</b><div class="small muted">5 речей: ${esc(Shop.TIERS[t].name.toLowerCase())} рідкісність · копії теж рахуються</div></div>
        <button class="btn ghost small" data-a="craft-cancel">Скасувати</button></div>
      <div class="ct-slots mt">${Array.from({ length: 5 }, (_, i) => { const k = sel[i], it = k && Shop.byKey(k);
        return `<button class="ct-slot ${it ? "full" : ""}" style="--tc:${Shop.TIERS[t].color}" ${it ? `data-a="craft-del" data-v="${i}"` : "disabled"}>${it ? shopPreview(it) : `<span>${i + 1}</span>`}</button>`; }).join("")}</div>
      <div class="craft-odds mt">${odds.map((p, d) => `<span style="--tc:${Shop.TIERS[t + d].color}"><b>${p}%</b> ${esc(Shop.TIERS[t + d].name.toLowerCase())}</span>`).join("")}</div>
      <div class="small muted mt">Випаде ${esc(cat.name.toLowerCase())} з будь-якого кейса чи сезонної скрині — така сама рідкісність або краща, гірше не буває.</div>
      <button class="btn mt" data-a="craft-go" ${sel.length === 5 ? "" : "disabled"}>⚒ Скрафтити${sel.length < 5 ? ` · ще ${5 - sel.length}` : ""}</button></div>
    <div class="section-title">Що докласти</div>
    ${items.length ? `<div class="shop-grid craft-grid">${items.map((it) => { const k = it.cat + ":" + it.id, n = invN(k), left = n - used(k);
      return `<button class="shop-item ${left ? "" : "off"}" style="--tc:${Shop.TIERS[t].color}" ${left ? `data-a="craft-add" data-v="${k}"` : "disabled"}>
        ${shopPreview(it)}<b>${esc(it.name)}</b><span class="price">×${n}${used(k) ? ` · у крафті ${used(k)}` : ""}</span>${n > 1 ? `<span class="inv-n">×${n}</span>` : ""}</button>`; }).join("")}</div>`
      : `<div class="card small muted center">Таких речей більше немає — відкрий кілька кейсів</div>`}`;
}
function craftUnwear(k) {
  const it = Shop.byKey(k);
  if (it && store.look && store.look[it.cat] === it.id && !Shop.owns(it)) { store.look[it.cat] = Shop.DEFAULT[it.cat]; saveProfile(); syncProfile(); }
}
function craftDo(body) {
  Api.act("/api/craft", body).then((st) => {
    const c = st.craft;
    if (c.op === "craft") { S.craft = null; S.shopTry = null; (c.from || []).forEach(craftUnwear); }
    notify(c.op === "craft" && !c.up ? "warning" : "success"); haptic("heavy");
    if (c.op === "key" || c.up) coinRain();
    S.sheet = Object.assign({ type: "craft-done" }, c); renderOverlay(); render();
  }).catch((e) => { notify("error"); toast(e.message); });
}
function craftDoneSheet() {
  const c = S.sheet;
  if (c.op === "key") return `<div class="center craft-res"><div class="key-pop">🗝</div><h2>Ключ викувано!</h2>
    <div class="cl-prize">${caseImg(c.kind, 96)}</div><div class="cl-name">${esc(c.name)}</div>
    ${c.season ? `<div class="small mt">Сезонний кейс: ключ відкриває його будь-коли, навіть коли кейса немає на вітрині</div>` : ""}
    <button class="btn mt2" data-a="case-open" data-v="${c.kind}">Відкрити зараз</button></div>`;
  const it = Shop.byKey(c.item); if (!it) return "";
  const t = Shop.tier(it);
  const p = c.odds ? Math.round((c.odds[c.up] || 0) * 100) : 0;
  return `<div class="center craft-res ${c.up ? "up" : "same"}"><h2>${c.up > 1 ? "🚀 Неймовірно — на дві рідкісності вище!" : c.up ? "📈 Пощастило — рідкісність вища!" : "⚒ Скрафтовано"}</h2><div class="cl-prize">${shopPreview(it)}</div>
    <div class="cl-name" style="color:${Shop.TIERS[t].color}">${esc(it.name)}</div>${tierTag(t)}
    <div class="small muted mt">${c.up ? `Випав шанс ${p}%` : `Та сама рідкісність (шанс ${p}%)`}${c.copy ? ` · тепер таких ×${c.copy}` : ""}</div>
    ${["toy", "hat"].includes(it.cat) ? "" : `<button class="btn mt2" data-a="case-equip" data-v="${it.cat}:${it.id}">Вдягнути</button>`}</div>`;
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
  if (it.cat === "bg") return `<div class="ct-bg" style="background-image:url(${Shop.sceneUrl(it.id)})"></div>`;
  if (it.cat === "style") return `<div class="ct-ico">🪪</div>`;
  if (it.cat === "toy") return `<div class="ct-ico">${it.emoji}</div>`;
  if (it.cat === "pic") return `<div class="ct-ico ct-pic"><img src="${Loot.picUrl(it.id)}" alt=""></div>`;
  if (it.cat === "hat") return `<div class="ct-ico">${Pets.sprite("2" + "8c3a9c51e2b84d06a1c3f5e7092b4d6e-" + it.id, 44)}</div>`;
  if (it.cat === "mg") return `<div class="ct-ico">${Pets.syringe(40)}</div>`;
  if (it.cat === "title") return `<div class="ct-title">«${esc(it.text)}»</div>`;
  if (it.cat === "fx") return `<div class="ct-fx">${Shop.nameFx([...Shop.splitBadge(S.profile.name || "Ім’я").base].slice(0, 7).join(""), it.id)}</div>`;
  return `<div class="ct-ico">${emo(it.emoji, 32)}</div>`;
}
const dropTier = (d) => (d.type === "mystery" ? d.tier : d.type === "item" ? Shop.tier(Shop.byKey(d.item)) : d.type === "egg" ? 3 : 0);
const dropName = (d) => (d.type === "mystery" ? "???" : d.type === "shards" ? `Уламки ×${d.qty}` : d.type === "egg" ? "Яйце улюбленця" : d.type === "food" ? (Api.state && Api.state.foods && Api.state.foods[d.item] ? Api.state.foods[d.item].name : "Їжа") + " ×" + d.qty : (Shop.byKey(d.item) || {}).name || "");
const caseCell = (d) => `<div class="rcell" style="--tc:${Shop.TIERS[dropTier(d)].color}">${caseThumb(d)}<span>${esc(dropName(d))}</span></div>`;

function caseLayerOpen(c) {
  const old = caseLayer(); if (old) old.remove();
  const el = document.createElement("div");
  el.id = "case-layer"; el.className = "case-layer c-" + c.key;
  el.innerHTML = `<div class="cl-box"><div class="cl-title">${esc(c.name)}</div><div class="cl-art shake">${caseImg(c.key, 150)}</div><div class="muted small mt">Відкриваємо…</div></div>`;
  document.body.appendChild(el);
  if (PX()) Pixel.apply(el);
}
function caseLayerClose() { const el = caseLayer(); if (el) el.remove(); caseBusy = false; }

// лента с «живым» торможением: разгон, затем случайные притормаживания и последний ползок рывками — до конца не ясно, где встанет
function reelPlan(dist, dur) {
  const N = Math.max(30, Math.round(dur * 60)), v = [];
  const brakes = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({ at: .35 + Math.random() * .5, w: .025 + Math.random() * .05, k: .5 + Math.random() * .42 }));
  for (let i = 0; i < N; i++) {
    const t = i / N;
    let sp = Math.pow(1 - t, 2.3) + .01;
    for (const b of brakes) { const d = (t - b.at) / b.w; sp *= 1 - b.k * Math.exp(-d * d); }
    if (t > .84) sp *= .5 + .5 * Math.abs(Math.sin(t * 48));
    v.push(Math.max(sp, .0004));
  }
  const sum = v.reduce((a, b) => a + b, 0); let acc = 0;
  return v.map((x) => (acc += x / sum * dist));
}
function reelRun(strip, reel, target, dur, cw, onDone) {
  const plan = reelPlan(target, dur), t0 = performance.now();
  let last = -1;
  const step = (now) => {
    if (!strip.isConnected) return;
    const i = Math.min(plan.length - 1, Math.floor((now - t0) / 1000 * 60)), x = plan[i];
    strip.style.transform = `translateX(${-x}px)`;
    const idx = Math.floor((x + reel.clientWidth / 2) / cw);
    if (idx !== last) { last = idx; try { tg && tg.HapticFeedback.selectionChanged(); } catch (e) { /* нет */ } }
    if (i >= plan.length - 1) { onDone(); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// клетки ленты: случайные вещи, на нужном месте — выпавшая, рядом иногда — дразнящая редкость
function reelCells(c, drop, N, WIN) {
  const cells = [];
  for (let i = 0; i < N; i++) {
    if (i === WIN) { cells.push(c.season ? { type: "mystery", tier: dropTier(drop) } : drop); continue; }   // сезонный — секрет до остановки
    if (c.food && Math.random() < c.food * .6) { cells.push({ type: "food", item: Pets.FOOD_KEYS[Math.floor(Math.random() * Pets.FOOD_KEYS.length)], qty: 2 }); continue; }
    const tease = (i === WIN + 1 || i === WIN - 1) && Math.random() < .55;
    const t = tease ? 3 : Shop.rollTier(c.w);
    if (c.season) { cells.push({ type: "mystery", tier: t }); continue; }     // сезонные вещи держим в секрете
    const it = Shop.rollItem(t, c) || Shop.rollItem(Shop.rollTier(c.w), c);
    cells.push({ type: "item", item: it.cat + ":" + it.id });
  }
  return cells;
}
function caseSpin(c, drop, drops) {
  if (drops && drops.length > 1) return caseSpinMany(c, drops);
  const el = caseLayer();
  if (!el) return;
  const N = 52, WIN = 42, cells = reelCells(c, drop, N, WIN);
  el.innerHTML = `<div class="cl-box"><div class="cl-title">${esc(c.name)}</div>
    <div class="reel"><div class="reel-strip" id="reel-strip">${cells.map(caseCell).join("")}</div><i class="reel-mark"></i></div>
    <div class="cl-res" id="cl-res"><div class="muted small">Крутимо…</div></div></div>`;
  if (PX()) Pixel.apply(el);
  const strip = el.querySelector("#reel-strip"), reel = el.querySelector(".reel"), CW = 92;
  const target = WIN * CW + CW / 2 - reel.clientWidth / 2 + (Math.random() - .5) * 64;
  reelRun(strip, reel, target, 6.2 + Math.random() * 1.6, CW, () => caseResult(c, drop));
}
// супер-сундук: три ленты друг под другом, останавливаются по очереди
function caseSpinMany(c, drops) {
  const el = caseLayer();
  if (!el) return;
  const N = 46, WIN = 36, CW = 80;
  el.innerHTML = `<div class="cl-box triple"><div class="cl-title">${esc(c.name)} · три речі</div>
    ${drops.map((d, k) => `<div class="reel sm" id="reel${k}"><div class="reel-strip">${reelCells(c, d, N, WIN).map(caseCell).join("")}</div><i class="reel-mark"></i></div>`).join("")}
    <div class="cl-res" id="cl-res"><div class="muted small">Крутимо три стрічки…</div></div></div>`;
  if (PX()) Pixel.apply(el);
  let left = drops.length;
  drops.forEach((d, k) => {
    const reel = el.querySelector("#reel" + k), strip = reel.querySelector(".reel-strip");
    const target = WIN * CW + CW / 2 - reel.clientWidth / 2 + (Math.random() - .5) * 50;
    reelRun(strip, reel, target, 4.6 + k * 1.9 + Math.random() * .8, CW, () => {
      reel.classList.add("stopped"); const w = strip.children[WIN];
      if (w) { w.outerHTML = caseCell(d); const w2 = strip.children[WIN]; w2.classList.add("won", "reveal"); if (PX()) Pixel.apply(w2); }
      notify(dropTier(d) >= 2 ? "success" : "warning");
      if (--left === 0) caseResultMany(c, drops);
    });
  });
}
function caseResultMany(c, drops) {
  caseBusy = false;
  const box = document.getElementById("cl-res"); if (!box) return;
  const best = Math.max(...drops.map(dropTier)), free = caseFree(c.key), can = free || (S.profile.coins >= c.price && seasonOnShelf(c.key));
  box.innerHTML = `<div class="cl-three">${drops.map((d) => { const it = Shop.byKey(d.item), t = dropTier(d);
    return `<div class="cl-mini" style="--tc:${Shop.TIERS[t].color}">${it ? caseThumb(d) : ""}<b style="color:${Shop.TIERS[t].color}">${esc(dropName(d))}</b>${tierTag(t)}${d.copy ? `<span class="small">копія ×${d.copy}</span>` : d.dup ? `<span class="small">+${d.shards} ✨</span>` : ""}</div>`; }).join("")}</div>
    <div class="cl-btns"><button class="btn" data-a="case-close">Забрати</button><button class="btn ghost" data-a="case-again" data-v="${c.key}" ${can ? "" : "disabled"}>${free ? `Ще (безплатно ×${free})` : `Ще · 🪙 ${c.price}`}</button></div>`;
  if (PX()) Pixel.apply(box);
  notify("success");
  if (best >= 3) coinRain();
}

function caseResult(c, drop) {
  caseBusy = false;
  const box = document.getElementById("cl-res");
  if (!box) return;
  const t = dropTier(drop), it = drop.type === "item" ? Shop.byKey(drop.item) : null;
  let win = document.querySelectorAll("#reel-strip .rcell")[42];
  if (win && c.season) { win.outerHTML = caseCell(drop); win = document.querySelectorAll("#reel-strip .rcell")[42]; win.classList.add("reveal"); if (PX()) Pixel.apply(win); }
  if (win) win.classList.add("won");
  const lay = caseLayer(); if (lay) { lay.style.setProperty("--tc", Shop.TIERS[t].color); lay.classList.remove("flash"); void lay.offsetWidth; lay.classList.add("flash"); }
  let prize = "", info = "", main = "";
  if (it) {
    prize = `<div class="cl-prize">${shopPreview(it)}</div>`;
    info = drop.copy ? `<div class="cl-dup">${it.cat === "toy" ? "🧸" : "📦"} Ще одна копія! Тепер їх <b>×${drop.copy}</b> — ${it.cat === "toy" ? "менше сварок через іграшку" : "знадобляться для крафту: 5 однакових за рідкісністю → 1"}</div>` : drop.dup ? `<div class="cl-dup">Повтор — уже є. Перетворилося на <b>${drop.shards != null ? `+${drop.shards} ✨ уламків` : `+${drop.refund} 🪙`}</b></div>`
      : it.mg ? `<div class="small">💉 Мутаген! Уколи улюбленцю зі значком 🧬 — вигляд зміниться назавжди</div>` : `<div class="small muted">Уже в інвентарі</div>`;
    if (!drop.dup) main = ["toy", "hat", "mg"].includes(it.cat) ? `<button class="btn" data-a="case-pets">🐾 До улюбленців</button>` : `<button class="btn" data-a="case-equip" data-v="${esc(drop.item)}">Вдягнути</button>`;
  } else if (drop.type === "shards") {
    prize = `<div class="cl-prize big-emo">✨</div>`;
    info = `<div class="small">Уламки — для майстерні: з них створюють і покращують речі</div>`;
    main = `<button class="btn" data-a="case-craft">⚒ У майстерню</button>`;
  } else if (drop.type === "food") {
    prize = `<div class="cl-prize big-emo">${Pets.FOOD_EMOJI[drop.item] || "🍖"}</div>`;
    info = `<div class="small muted">Лежить у коморі улюбленців</div>`;
  } else if (drop.type === "egg") {
    const p = Api.state && Api.state.pets.find((x) => x.id === drop.pet);
    prize = `<div class="cl-prize">${p ? Pets.sprite(p.rarity + p.dna, 120, { egg: true }) : '<div class="big-emo">🥚</div>'}</div>`;
    info = `<div class="small">Яйце улюбленця! Вилупиться за добу</div>`;
    main = `<button class="btn" data-a="case-pets">🐾 До улюбленців</button>`;
  }
  const free = caseFree(c.key), can = free || (S.profile.coins >= c.price && (!c.season || seasonOnShelf(c.key)));
  box.innerHTML = `${prize}<div class="cl-name" style="color:${Shop.TIERS[t].color}">${esc(dropName(drop))}</div>${drop.type === "item" ? tierTag(t) : ""}${info}
    <div class="cl-btns">${main}<button class="btn ghost" data-a="case-again" data-v="${c.key}" ${can ? "" : "disabled"}>${free ? `Ще (безплатно ×${free})` : `Ще · 🪙 ${c.price}`}</button>
    <button class="btn ghost" data-a="case-close">Закрити</button></div>`;
  if (PX()) Pixel.apply(box);
  notify(t >= 2 || drop.type === "egg" ? "success" : "warning");
  if (t >= 3 || drop.type === "egg") coinRain();
}

function caseOpen(key) {
  if (caseBusy) return;
  const c = anyCase(key);
  if (!c) return;
  const free = caseFree(key);
  if (!free && S.profile.coins < c.price) { notify("error"); return toast(`Бракує ${c.price - S.profile.coins} монет`); }
  if (Api.on && !Api.ready) return toast("Немає зв’язку із сервером, спробуй за хвилину");
  if (c.season && !Api.on) return toast("Сезонні кейси працюють через сервер");
  caseBusy = true; haptic("heavy");
  caseLayerOpen(c);
  if (Api.on) {
    Api.act("/api/case/open", { kind: key }).then((st) => setTimeout(() => caseSpin(c, st.drop, st.drops), 650))
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
  "shop-tab": (v) => { S.shopTab = v; S.shopTry = null; S.craft = null; haptic(); render(); window.scrollTo(0, 0); },
  "case-open": caseOpen,
  "case-again": (key) => { caseLayerClose(); caseOpen(key); },
  "case-close": () => { caseLayerClose(); render(); },
  "case-odds": (key) => { S.sheet = { type: "case-odds", key }; renderOverlay(); },
  "case-craft": () => { caseLayerClose(); S.screen = "shop"; S.shopTab = "craft"; render(); window.scrollTo(0, 0); },
  "craft-key": () => craftDo({ op: "key" }),
  "craft-start": (k) => { const it = Shop.byKey(k); if (!craftOk(it)) return; S.craft = { cat: it.cat, tier: Shop.tier(it), sel: [k] }; haptic(); render(); window.scrollTo(0, 0); },
  "craft-cancel": () => { S.craft = null; haptic(); render(); },
  "craft-add": (k) => { const c = S.craft; if (c && c.sel.length < 5) { c.sel.push(k); haptic(); render(); } },
  "craft-del": (i) => { if (S.craft) { S.craft.sel.splice(Number(i), 1); haptic(); render(); } },
  "craft-go": () => {
    const sel = ((S.craft && S.craft.sel) || []).slice(); if (sel.length !== 5) return;
    const worn = sel.filter((k) => { const it = Shop.byKey(k); return it && store.look && (store.look[it.cat] === it.id || (it.cat === "ava" && store.badge === it.emoji)) && sel.filter((x) => x === k).length >= invN(k); });
    const q = `Віддати 5 речей у крафт? Натомість — одна річ.${worn.length ? " Вдягнута річ зніметься." : ""}`;
    const go = () => craftDo({ op: "craft", items: sel });
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "case-pets": () => { caseLayerClose(); S.screen = "pets"; S.petSel = null; render(); window.scrollTo(0, 0); },
  "case-equip": (k) => {
    const it = Shop.byKey(k);
    if (it && Shop.equip(it)) { saveProfile(); syncProfile(); notify("success"); toast(`Вдягнуто: ${it.name} ✓`); }
    if (S.sheet && S.sheet.type === "craft-done") { S.sheet = null; renderOverlay(); }
    caseLayerClose(); render();
  },
};

// обратный отсчёт сезонных сундуков; исчез — перерисовать витрину
setInterval(() => {
  if (S.screen !== "shop") return;
  let gone = false;
  document.querySelectorAll("[data-season-until]").forEach((el) => { const left = seasonLeft(el.getAttribute("data-season-until")); el.textContent = fmtLeft(left); if (left <= 0) gone = true; });
  if (gone && !caseBusy) render();
}, 1000);
