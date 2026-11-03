/* Экран «Питомцы»: яйца, уход, кормление, магазин еды, промокоды, кладбище. Данные — с сервера (js/api.js). */
"use strict";

const PET_DAY = 86400;
const petNow = () => (Date.now() + ((Api.state && Api.state.skew) || 0)) / 1000;
const petStage = (p) => (p.egg ? "" : Pets.stageOf(p.grown, petNow()));
const petCode = (p) => { const st = petStage(p); return p.rarity + p.dna + (st ? "." + st : "") + (p.hat && !p.egg ? "-" + p.hat : ""); };
const petFood = (k) => (Api.state && Api.state.foods && Api.state.foods[k]) || { name: k, hunger: 0, mood: 0, price: 0 };
function petTime(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec >= PET_DAY) return `${Math.floor(sec / PET_DAY)} д ${Math.floor((sec % PET_DAY) / 3600)} ч`;
  if (sec >= 3600) return `${Math.floor(sec / 3600)} ч ${Math.floor((sec % 3600) / 60)} мин`;
  if (sec >= 60) return `${Math.floor(sec / 60)} мин ${sec % 60} с`;
  return `${sec} с`;
}
// сытость считаем прямо сейчас, без запроса: с 100 до 0 за сутки, ещё сутки — и смерть
function petLive(p) {
  const t = petNow();
  if (p.egg) return Object.assign({}, p, { left: p.hatch - t });
  const imm = Pets.traits(p.dna).immortal, full = p.full_at != null ? p.full_at : p.starve_at - 2 * PET_DAY;
  return Object.assign({}, p, { hunger: imm ? 100 : Pets.hungerAt(p.dna, full, p.den, t), dieIn: p.starve_at - t });
}
const petKnow = (id) => ((store.petKnow = store.petKnow || {})[id] = store.petKnow[id] || {});
const bar = (v, cls) => `<div class="pbar ${cls} ${v < 25 ? "low" : ""}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
const moodText = (m) => (m > 70 ? "Счастлив" : m > 40 ? "Спокоен" : m > 15 ? "Грустит" : "Обиделся");
const hungerText = (h) => (h > 60 ? "Сыт" : h > 25 ? "Проголодался" : h > 0 ? "Голодает" : "Умирает от голода");

function viewPets() {
  if (Api.on && Api.ready) leagueLoad();
  const head = `<div class="top"><div class="grow"><h1>🐾 Питомцы</h1><div class="muted small">Каждый — единственный в мире</div></div>${coinPill()}</div>`;
  if (!Api.on) {
    const cfg = window.APP_CONFIG || {};
    return `<div class="fade-in">${head}<div class="card center pets-off">${Pets.sprite("3" + "7f3a9c51e2b84d06a1c3f5e7092b4d6e" + "28", 140)}
      <b class="mt">Питомцы живут на сервере</b><div class="muted small mt">${cfg.api ? "Открой Настолкино из Telegram-бота — тогда питомцы, яйца и промокоды заработают." : "Сервер ещё не подключён. Инструкция — в файле СЕРВЕР_УСТАНОВКА.md."}</div></div></div>${tabs()}`;
  }
  const st = Api.state;
  if (!st) return `<div class="fade-in">${head}<div class="card center"><div class="spinner" style="margin:10px auto"></div><div class="muted small">${Api.error ? esc(Api.error) + " — пробую ещё раз…" : "Загружаю питомцев…"}</div></div></div>${tabs()}`;
  const tab = S.petTab || "list", sel = tab === "list" && S.petSel && st.pets.find((p) => p.id === S.petSel && p.alive);
  const t = (k, label) => `<button class="${tab === k ? "on" : ""}" data-a="pets-tab" data-v="${k}">${label}</button>`;
  const body = sel ? petDetail(petLive(sel)) : tab === "shop" ? petShop() : tab === "battle" ? viewBattleTab() : tab === "trade" ? viewTradeTab() : petList();
  return `<div class="fade-in pets">${head}${sel ? "" : `<div class="seg seg4">${t("list", "🐾 Мои")}${t("shop", "🛒 Лавка")}${t("battle", "⚔️ Бои")}${t("trade", "🔄 Обмен")}</div>`}${body}</div>${tabs()}`;
}

function petList() {
  const st = Api.state, live = st.pets.filter((p) => p.alive).map(petLive), dead = st.pets.filter((p) => !p.alive);
  const card = (p) => {
    if (p.egg) return `<button class="pet-card egg" data-a="pets-sel" data-v="${p.id}">${Pets.sprite(petCode(p), 80, { egg: true })}
      <b>Яйцо</b><span class="small muted" data-until="${p.hatch}" data-egg="1">${p.left > 0 ? "через " + petTime(p.left) : "вылупляется!"}</span></button>`;
    const t = Pets.traits(p.dna);
    return `<button class="pet-card ${p.hunger < 25 ? "hungry" : ""} ${st.main_pet === p.id ? "main" : ""}" data-a="pets-sel" data-v="${p.id}">
      ${st.main_pet === p.id ? '<span class="pet-star">★</span>' : ""}${p.den ? '<span class="pet-zz">🏠</span>' : ""}${t.collect ? '<span class="pet-cl">✦</span>' : p.receptive ? '<span class="pet-cl dna">🧬</span>' : ""}${petMiniHtml(p, 80)}
      <b>${esc(t.name)}</b><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>${t.muts.length ? `<span class="mut-icons">${t.muts.map((m) => m.emoji).join("")}</span>` : ""}${bar(p.hunger, "food")}</button>`;
  };
  if (S.care) return careScene();
  const den = st.den || { rooms: 0, used: 0 };
  const care = live.filter((p) => !p.egg).length >= 2 ? `<div class="care-bar"><button class="btn" data-a="care-open">🤲 Уход за всеми</button>
    <span class="den-pill" title="Комнаты в домике">🏠 ${den.used}/${den.rooms}</span></div>` : "";
  return `${questsCard()}${leagueCard()}${care}${toysCard()}${live.length ? `<div class="pet-grid">${live.map(card).join("")}</div>`
      : `<div class="card center"><div class="pet-empty">🥚</div><b>Питомцев пока нет</b><div class="muted small mt">Яйца выпадают из промокодов и раздач в боте, а очень редко — из ежедневного сундука.</div></div>`}
    ${live.some((p) => !p.egg && p.hunger < 25) ? `<div class="card warn mt">⚠️ Кто-то голодает. Без еды двое суток — питомец умирает навсегда.</div>` : ""}
    ${petPantry()}
    <div class="section-title">Промокод</div>
    <div class="row"><input class="input grow" id="promo-code" maxlength="24" placeholder="Например: A1B2C3D4" autocomplete="off"><button class="btn small" data-a="promo">ОК</button></div>
    ${dead.length ? `<button class="card grave-toggle mt2" data-a="pets-grave">🕯 Кладбище питомцев · ${dead.length}<span class="muted">${S.petGrave ? "▲" : "▼"}</span></button>
      ${S.petGrave ? `<div class="pet-grid grave">${dead.map((p) => `<div class="pet-card dead">${Pets.sprite(petCode(p), 64, { dead: true })}<b>${esc(Pets.name(p.dna))}</b>
        <span class="small muted">${p.died ? new Date(p.died * 1000).toLocaleDateString("ru-RU") : ""}</span></div>`).join("")}</div>` : ""}` : ""}`;
}

function petPantry(inShop) {
  const food = Api.state.food || {}, keys = Object.keys(food).filter((k) => food[k] > 0);
  return `<div class="section-title">Кладовка</div>${keys.length
    ? `<div class="pantry">${keys.map((k) => `<span class="food-chip">${Pets.FOOD_EMOJI[k] || "🍽"} ${esc(petFood(k).name)} <b>×${food[k]}</b></span>`).join("")}</div>`
    : `<div class="muted small">${inShop ? "Пусто. Купи ниже 👇" : "Пусто. Еда — во вкладке «🛒 Лавка»"}</div>`}`;
}

const SHOP_CATS = [["food", "🍖 Еда", "Сытость: кормить каждый день"], ["treat", "🍬 Лакомства", "Поднимают настроение — грустный питомец не дерётся"], ["battle", "⚔️ Для боя", "Энергия и усиления на следующий бой"]];
function petShop() {
  const cat = S.shopFood || "food", have = Api.state.food || {};
  const foods = Object.entries(Api.state.foods || {}).filter(([, f]) => !f.special && (f.cat || "food") === cat).sort((a, b) => a[1].price - b[1].price);
  const c = SHOP_CATS.find((x) => x[0] === cat);
  return `${petPantry(true)}
    <div class="cats cats3 mt">${SHOP_CATS.map(([k, n]) => `<button class="pill ${k === cat ? "on" : ""}" data-a="food-cat" data-v="${k}">${n}</button>`).join("")}</div>
    <div class="small muted mt">${c[2]}</div>
    <div class="food-shop mt">${foods.map(([k, f]) => `<div class="food-row">
      <span class="fe">${Pets.FOOD_EMOJI[k] || "🍽"}</span><div class="grow"><b>${esc(f.name)}</b>${have[k] ? ` <span class="small muted">· есть ${have[k]}</span>` : ""}
        <div class="small muted">${f.desc ? esc(f.desc) : `+${f.hunger} сытости${f.mood ? ` · +${f.mood} настроения` : ""}`}</div></div>
      <div class="buy2"><button class="btn small" data-a="food-buy" data-v="${k}" ${S.profile.coins < f.price ? "disabled" : ""}>🪙 ${f.price}</button>
        <button class="btn ghost small" data-a="food-buy5" data-v="${k}" ${S.profile.coins < f.price * 5 ? "disabled" : ""}>×5</button>
        <button class="btn ghost small" data-a="food-buy10" data-v="${k}" ${S.profile.coins < Math.round(f.price * 8) ? "disabled" : ""}>×10 −20%</button></div></div>`).join("")}</div>
    <div class="card small muted mt">🍏 Золотое яблоко и ✨ звёздная пыль не продаются — только в промокодах и раздачах бота.</div>`;
}

function petDetail(p) {
  const st = Api.state;
  if (p.egg) {
    return `<button class="btn ghost small" data-a="pets-back">← Все питомцы</button>
      <div class="pet-stage egg">${Pets.sprite(petCode(p), 180, { egg: true })}</div>
      <div class="card center"><b>Яйцо</b><div class="muted small mt">Кто внутри — никто не знает. Даже редкость.</div>
      <div class="display mt" data-until="${p.hatch}" data-egg="1">${p.left > 0 ? petTime(p.left) : "вылупляется!"}</div></div>`;
  }
  const t = Pets.traits(p.dna), k = petKnow(p.id), food = st.food || {}, soc = Pets.SOCIAL[t.social];
  const foods = Object.keys(food).filter((x) => food[x] > 0);
  return `<button class="btn ghost small" data-a="pets-back">← Все питомцы</button>
    ${petStageHtml(p)}${p.receptive ? `<button class="dna-side" data-a="pet-mg-open" title="Принимает мутагены">🧬<i>${(p.mg || []).length}/2</i></button>` : ""}
    <div class="pet-title"><b class="pet-name">${esc(t.name)}</b> <span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span><div class="small muted">ДНК ${t.code} · ${esc(t.shape)}</div></div>
    ${petCollectBlock(p, t)}${petMutBlock(t)}
    <div class="card">
      ${petGrowLine(p)}
      ${t.immortal ? `<div class="pstat"><span>♾️ Не нуждается в еде — никогда</span><b>∞</b></div>` : `<div class="pstat"><span>🍖 ${hungerText(p.hunger)}${p.den ? " · 🏠 в домике голодает вчетверо медленнее" : Pets.sleepState(p.dna, petNow()).asleep ? " · 💤 спит — голодает на 30% медленнее" : ""}</span><b>${p.hunger}%</b></div>${bar(p.hunger, "food")}`}
      <div class="pstat mt"><span>💛 ${moodText(p.mood)}</span><b>${p.mood}%</b></div>${bar(p.mood, "mood")}
      ${t.reborn ? `<div class="small mt">🔥 Феникс не умирает: если долго не кормить, он сгорит и возродится из пепла яйцом</div>` : ""}
      ${p.hunger < 25 && !t.reborn ? `<div class="warn small mt">⚠️ Умрёт через <b data-until="${p.starve_at}">${petTime(p.dieIn)}</b>, если не покормить</div>` : ""}
    </div>
    <div class="section-title">Покормить</div>
    ${foods.length ? `<div class="pantry">${foods.map((x) => `<button class="food-chip" data-a="pet-feed" data-v="${x}">${Pets.FOOD_EMOJI[x] || "🍽"} ${esc(petFood(x).name)} <b>×${food[x]}</b></button>`).join("")}</div>`
      : `<div class="muted small">Еды нет — купи во вкладке «🛒 Лавка».</div>`}
    <div class="small muted mt">Погладь — просто нажми на питомца.</div>
    ${petLifeBlock(p, t)}
    ${petCareBlock(p, t)}
    ${petBattleCard(p, t)}
    <div class="section-title">Характер</div>
    <div class="card pet-info">
      <div><span class="muted">Нрав</span><b>${esc(t.temper)} · ${esc(soc.name)}</b></div><div class="small muted">${esc(soc.desc)}</div>
      <div><span class="muted">Хобби</span><b>${Pets.HOBBY_FX[t.hobbyIdx][0]} ${esc(t.hobby)}</b></div><div class="small fx-line">↳ ${esc(Pets.HOBBY_FX[t.hobbyIdx][1])}</div>
      <div><span class="muted">Странность</span><b>${esc(t.quirk)}</b></div><div class="small fx-line">↳ ${esc(Pets.QUIRK_FX[t.quirkIdx])}</div>
      ${t.partner ? `<div><span class="muted">Второй — ${esc(t.partner.name)}</span><b>${esc(t.partner.temper)}, ${esc(t.partner.hobby)}</b></div>` : ""}
      <div><span class="muted">Обожает</span><b>${k.fav ? `${Pets.FOOD_EMOJI[t.fav]} ${esc(petFood(t.fav).name)}` : "??? — узнаешь, когда угадаешь"}</b></div>
      <div><span class="muted">Терпеть не может</span><b>${k.dis ? `${Pets.FOOD_EMOJI[t.dis]} ${esc(petFood(t.dis).name)}` : "???"}</b></div>
      <div><span class="muted">Вылупился</span><b>${new Date(p.hatch * 1000).toLocaleDateString("ru-RU")}</b></div>
    </div>
    ${st.main_pet === p.id ? `<div class="card center small mt">★ Главный питомец — его видят все в твоём профиле</div>`
      : `<button class="btn mt" data-a="pet-main">★ Сделать главным</button>`}`;
}

function petHatchSheet(id) {
  const p = Api.state && Api.state.pets.find((x) => x.id === id);
  if (!p) return "";
  const t = Pets.traits(p.dna);
  if (t.collect) return `<div class="center hatch"><div class="gift-head">${p.from === "tour" ? "🏆 Приз турнира!" : "🎁 Подарок от администратора!"}</div>
    <div class="pet-stage r${p.rarity} big collect">${Pets.sprite(petCode(p), 200)}</div>
    <h2>${esc(t.name)}</h2><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>
    <div class="small mt">${p.from === "tour" ? "Ты победил в турнире и забираешь коллекционного питомца." : "Администратор подарил тебе коллекционного питомца."}</div>
    <div class="card small mt">✦ Он единственный в мире, не голодает и останется с тобой навсегда.<br>${esc(t.collect.desc)}</div></div>`;
  return `<div class="center hatch"><div class="small muted">Скорлупа треснула…</div>
    <div class="pet-stage r${p.rarity} big">${Pets.sprite(petCode(p), 200)}</div>
    <h2>${esc(t.name)}</h2><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>
    ${t.muts.length ? `<div class="mt">${petMutBlock(t, true)}</div>` : ""}
    <div class="muted small mt">${esc(t.temper)}, ${esc(Pets.SOCIAL[t.social].name.toLowerCase())}. Хобби: ${esc(t.hobby)}.</div>
    <div class="small mt">Не забывай кормить каждый день — иначе он умрёт навсегда.</div></div>`;
}

// коллекционный: единственный в мире
function petCollectBlock(p, t) {
  if (!t.collect) return "";
  const c = t.collect, set = Pets.COLLECT_SETS[c.set], mine = (Api.state.pets || []).filter((x) => x.alive && x.collect && Pets.collectOf(x.dna) && Pets.collectOf(x.dna).set === c.set).length;
  const total = Pets.COLLECT.filter((x) => x.set === c.set).length;
  return `<div class="card collect-box"><div class="cl-head">✦ Коллекционный · ${set.emoji} ${esc(set.name)} <span class="muted">${mine}/${total}</span></div>
    <div class="small">${esc(c.desc)}</div>
    <div class="small muted mt">Сложность получения: ${"★".repeat(c.hard)}${"☆".repeat(5 - c.hard)} · ${p.from === "tour" ? "приз турнира" : "подарок администратора"}</div>
    <div class="small muted">Единственный в мире. Не голодает, не умирает, его нельзя отдать в обмен.</div>
    <div class="small mt">🎖 ${esc(set.bonus)}</div></div>`;
}
// рост
function petGrowLine(p) {
  const st = petStage(p);
  if (!st) return "";
  const left = p.grown - petNow();
  return `<div class="pstat grow-line"><span>${Pets.STAGES[st].emoji} ${Pets.STAGES[st].name} · вырастет через ${petTime(left)}</span><b>${st === "b" ? "1/3" : "2/3"}</b></div>
    <div class="small muted">${esc(Pets.STAGES[st].care)}. Каждая кормёжка ускоряет рост на 2 часа, бутылочка роста 🍼 — на 6 часов</div>`;
}
// домик, мутагены, мини-игры
function petCareBlock(p, t) {
  const mgs = (Api.state.inv || []).filter((x) => x.startsWith("mg:")).length;
  return `<div class="section-title">Уход</div><div class="card">
    <div class="row case-btns"><button class="btn small" data-a="pet-fun" ${p.den ? "disabled" : ""}>🎮 Мини-игры</button>
      <button class="btn ghost small" data-a="pet-den" data-v="${p.den ? 0 : 1}">${p.den ? "☀️ Разбудить" : "🏠 В домик"}</button>
      ${p.receptive ? `<button class="btn ghost small" data-a="pet-mg-open">💉 Мутаген ${(p.mg || []).length}/2</button>` : ""}</div>
    <div class="small muted mt">${p.den ? "Спит в домике: голодает вчетверо медленнее, настроение не портится. Но не играет и не дерётся." : `Домик — для тех, кого сейчас некогда кормить: там голодает вчетверо медленнее, но не играет и не дерётся. Комнат: ${(Api.state.den || {}).used || 0} из ${(Api.state.den || {}).rooms || 0} — их больше, когда больше питомцев (10 питомцев — 4 комнаты).`}</div>
    <div class="small muted">🎮 Хочет играть ${Pets.funWant(p.dna, petStage(p))} раз${Pets.funWant(p.dna, petStage(p)) === 1 ? "" : "а"} в день${p.fun ? ` · сегодня уже ${p.fun}` : ""}${t.social === 0 ? " — любит тишину, не зови слишком часто" : t.social === 2 ? " — обожает внимание" : ""}</div>
    ${p.receptive ? `<div class="small mt">🧬 Принимает мутагены: можно уколоть ещё ${2 - (p.mg || []).length}${mgs ? ` · у тебя шприцов: ${mgs}` : " · шприцов пока нет (турниры и редко — «Питомник»)"}</div>` : ""}
    ${(p.mg || []).length ? `<div class="small muted">💉 Уколото: ${p.mg.map((k) => { const it = Shop.byKey(k); return it ? "«" + esc(it.name) + "»" : ""; }).join(", ")}</div>` : ""}</div>`;
}
// выбор мутагена
function petMgSheet() {
  const p = Api.state && Api.state.pets.find((x) => x.id === S.petSel);
  if (!p) return "";
  const list = (Api.state.inv || []).filter((x) => x.startsWith("mg:")).map((k) => Shop.byKey(k)).filter(Boolean);
  const used = (p.mg || []).length;
  return `<h2>💉 Мутагены</h2><p class="muted small">Укол меняет облик навсегда. Не больше двух на питомца (уколото ${used}/2). Мутация той же группы заменит старую.</p>
    ${!p.receptive ? `<div class="card">Этот питомец не принимает мутагены — у него нет значка 🧬</div>` : used >= 2 ? `<div class="card">Уже уколото два мутагена — больше нельзя</div>`
      : list.length ? `<div class="mg-list">${list.map((it) => { const m = Pets.MUTATIONS.find((x) => x.key === it.mg);
        return `<button class="card mg-row" data-a="pet-mg-inject" data-v="mg:${it.id}">${Pets.syringe(40)}<div class="grow"><b>«${esc(it.name)}»</b><div class="small">${m.emoji} ${esc(m.name)}</div><div class="small muted">${esc(m.desc)}</div></div><span class="muted">›</span></button>`; }).join("")}</div>`
      : `<div class="card muted small">Шприцов нет. Их дают за турниры, а в кейсе «Питомник» — шанс 0,01%.</div>`}`;
}

// бой: характеристики, энергия, победы
function petBattleCard(p, t) {
  const s0 = Pets.stats(p.dna, p.rarity), gm = Pets.STAGES[petStage(p)].mul, s = gm === 1 ? s0 : { hp: Math.round(s0.hp * gm), atk: Math.round(s0.atk * gm), def: Math.round(s0.def * gm), spd: s0.spd }, sk = Pets.skills(p.dna), buff = { atk: "🍫 +15% атаки", def: "🥫 +4 защиты", spd: "🌶️ +4 скорости" }[p.buff];
  return `<div class="section-title">Бой</div><div class="card">
    <div class="bstats"><span>❤️ <b>${s.hp}</b></span><span>⚔️ <b>${s.atk}</b></span><span>🛡 <b>${s.def}</b></span><span>💨 <b>${s.spd}</b></span></div>
    ${gm < 1 ? `<div class="small muted mt">${Pets.STAGES[petStage(p)].emoji} Пока ${Pets.STAGES[petStage(p)].name.toLowerCase()} — сила ${Math.round(gm * 100)}%. Вырастет — станет сильнее.</div>` : ""}
    <div class="pstat mt"><span>⚡ Энергия</span><b>${p.energy}%</b></div>${bar(p.energy, "energy")}
    <div class="small muted mt">🏆 Побед: ${p.wins} · поражений: ${p.losses}${p.streak > 1 ? ` · ${p.streak} подряд` : ""}${buff ? ` · усиление: ${buff}` : ""}</div>
    ${sk.length ? `<div class="small mt">${sk.map((x) => `${x.emoji} ${esc(x.text)}`).join(" · ")}</div>` : ""}
    <button class="btn mt" data-a="battle-new" data-v="${p.id}">⚔️ Вызвать на бой</button>
    <div class="small muted mt">Ссылку на бой отправь другу — он выберет своего бойца. В боях питомцы не умирают.</div></div>`;
}

// мутации: облик поверх генов
function petMutBlock(t, short) {
  if (!t.muts.length) return "";
  const head = t.muts.length > 1 ? `🧬 ${t.muts.length} мутации` : "🧬 Мутация";
  return `<div class="mut-box ${short ? "short" : ""}"><div class="mut-head">${head}</div>${t.muts.map((m) => `<div class="mut g-${m.group}"><span class="me">${m.emoji}</span><div><b>${esc(m.name)}</b>${short ? "" : `<div class="small muted">${esc(m.desc)}</div>`}</div></div>`).join("")}</div>`;
}

// маленькая плашка питомца для профиля и чужой карточки
function petBadge(code, mine) {
  if (!code || !/^[0-4][0-9a-f]{32}(?:[0-9a-f]{2}){0,5}(?:\.[bt])?(?:-[a-z]{2,12})?$/.test(code)) return "";
  const r = Number(code[0]), dna = code.slice(1).split("-")[0].split(".")[0];
  return `<div class="card pet-badge" ${mine ? 'data-a="tab" data-v="pets"' : ""}>${Pets.sprite(code, 56)}<div class="grow"><b>${esc(Pets.name(dna))}</b>
    <div><span class="rar r${r}">${Pets.rarityName(r, dna)}</span> ${Pets.muts(dna).map((m) => m.emoji).join("")}</div></div>${mine ? '<span class="muted">›</span>' : ""}</div>`;
}

function petFx(text) {
  const box = document.getElementById("pet-fx");
  if (!box) return;
  for (let i = 0; i < 5; i++) {
    const el = document.createElement("i");
    el.textContent = text; el.style.left = 20 + Math.random() * 60 + "%"; el.style.animationDelay = i * .12 + "s";
    box.appendChild(el); setTimeout(() => el.remove(), 1600);
  }
}

// короткая анимация на сцене и реплика в облачке
function petJump(cls) {
  const el = document.querySelector("#pet-stage .pet-act");
  if (!el) return;
  el.classList.remove("jump-" + cls); void el.offsetWidth; el.classList.add("jump-" + cls);
  setTimeout(() => el.classList.remove("jump-" + cls), 1200);
}
function petSay(text) {
  const st = document.getElementById("pet-stage");
  if (!st) return;
  let b = st.querySelector(".pet-bubble");
  if (!b) { b = document.createElement("div"); b.className = "pet-bubble"; st.appendChild(b); }
  b.textContent = text; b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
}

// после каждого ответа сервера: показать вылупившихся, перерисовать экран
function petOnState() {
  const st = Api.state;
  if (st && Array.isArray(st.inv) && st.inv.includes("frame:bwfire") && !store.creatorSet) {   // администратор получил набор — сразу надеваем
    store.creatorSet = true;
    ["frame:bwfire", "bg:throne", "style:creator", "title:creator", "fx:bwflame", "ava:key"].forEach((k) => { const it = Shop.byKey(k); if (it) Shop.equip(it); });
    saveProfile(); syncProfile(); toast("👑 Набор Создателя надет");
  }
  if (st && Array.isArray(st.gifts) && st.gifts.length && !S.room && !S.sheet) {   // тебе что-то подарили — показываем сразу
    S.sheet = { type: "gifts", list: st.gifts.slice() }; st.gifts = [];
    notify("success"); haptic("heavy"); renderOverlay();
    Api.call("/api/gifts/seen", {}).catch(() => {});
  }
  if (st) {
    store.petSeen = store.petSeen || [];
    const fresh = st.pets.find((p) => p.alive && !p.egg && !store.petSeen.includes(p.id));
    if (fresh) {
      store.petSeen.push(fresh.id); saveProfile();
      if (!S.room && !S.sheet) { S.sheet = { type: "hatch", id: fresh.id }; notify("success"); renderOverlay(); }
    }
  }
  const busy = document.activeElement && document.activeElement.tagName === "INPUT";
  if (!busy && ["pets", "home", "profile", "shop"].includes(S.screen)) render();
}

/* ---------------------------------------------------------------- лига недели: таблица лидеров по боям */
const leagueCard = () => (Api.on ? `<button class="card league-card" data-a="go" data-v="league"><span class="lg-ico">🏆</span><div class="grow"><b>Лига недели</b>
  <div class="small muted">${S.league && S.league.me ? `Ты на ${S.league.me.rank}-м месте · ${S.league.me.pts} очков` : "Бои с другими игроками — очки, в конце недели призы топ-10"}</div></div><span class="muted">›</span></button>` : "");
function leagueLoad(force) {
  if (!Api.on || !Api.ready || S.leagueBusy || (!force && S.leagueAt && Date.now() - S.leagueAt < 30000)) return;
  S.leagueBusy = true;
  Api.call("/api/league", {}).then((r) => { S.league = r.league; S.leagueAt = Date.now(); }).catch(() => {}).finally(() => { S.leagueBusy = false; if (["league", "pets"].includes(S.screen)) render(); });
}
function fmtLeft2(sec) { const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60); return d ? `${d} дн ${h} ч` : h ? `${h} ч ${m} мин` : `${m} мин`; }
function viewLeague() {
  leagueLoad();
  const L = S.league, medal = (n) => (n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : n);
  const row = (r) => `<div class="lg-row ${r.uid === Number(S.me.slice(2)) ? "me" : ""}"><span class="lg-rank">${medal(r.rank)}</span><span class="lg-pet">${r.pet ? Pets.sprite(r.pet, 36) : "🐾"}</span>
    <div class="grow"><b>${esc(r.name)}</b><div class="small muted">${r.wins} побед из ${r.games}</div></div><b class="lg-pts">${r.pts}</b></div>`;
  return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="pets">←</button><div class="grow"><h1>Лига недели</h1>
      <div class="muted small">${L ? `До конца недели: ${fmtLeft2(Math.max(0, L.ends - Math.floor(Date.now() / 1000)))}` : "Загружаю…"}</div></div>${coinPill()}</div>
    ${L && L.me ? `<div class="card lg-mine"><div class="lg-big">${medal(L.me.rank)}</div><div class="grow"><b>Твоё место: ${L.me.rank}</b><div class="small">${L.me.pts} очков · ${L.me.wins} побед из ${L.me.games} боёв</div></div></div>`
      : `<div class="card small">Ты ещё не дрался на этой неделе. Вызови друга на бой в карточке питомца — каждая победа +3 очка, поражение +1.</div>`}
    ${L ? `<div class="section-title">Призы</div><div class="card lg-prizes">${L.prizes.map((p) => `<div class="lg-prize"><b>${p.place === "1" ? "🥇" : p.place === "2" ? "🥈" : p.place === "3" ? "🥉" : "🏅 " + p.place}</b><span>${esc(p.text)}</span></div>`).join("")}</div>
    <div class="section-title">Таблица</div>
    <div class="card lg-table">${L.top.length ? L.top.map(row).join("") : `<div class="muted small center">Пока никто не дрался — будь первым!</div>`}</div>
    ${L.last && L.last.length ? `<div class="section-title">Прошлая неделя</div><div class="card lg-table">${L.last.map(row).join("")}</div>` : ""}
    <div class="small muted mt">Очки — только за бои с другими игроками: победа +3, поражение +1. С одним и тем же соперником за неделю считаются первые ${L.pairCap} боёв. Неделя — с понедельника, призы приходят сами.</div>`
      : `<div class="card center"><div class="spinner" style="margin:10px auto"></div></div>`}
  </div>${tabs()}`;
}

// окно «Тебе подарили»: что пришло и куда посмотреть
const GIFT_ICO = { coins: "🪙", egg: "🥚", food: "🍖", case: "🎁", mg: "💉", pet: "🐉" }, GIFT_SRC = { admin: "от администратора", tour: "приз за турнир", gw: "из раздачи", ref: "за приглашённого друга", league: "приз лиги недели", pass: "сезонный пропуск", welcome: "подарок новичку" };
function giftsSheet() {
  const list = (S.sheet && S.sheet.list) || [], first = list[0] || {};
  const go = { mg: "gift-go:mg", pet: "gift-go:pets", egg: "gift-go:pets", food: "gift-go:pets", case: "gift-go:cases", coins: "" }[first.kind] || "";
  return `<div class="gift-pop"><div class="gp-box">🎁</div><h2>Тебе подарили!</h2>
    <div class="gp-list">${list.map((g) => `<div class="gp-row"><span class="gp-i">${GIFT_ICO[g.kind] || "🎁"}</span><div class="grow"><b>${esc(g.text)}</b><div class="small muted">${GIFT_SRC[g.src] || ""} · ${petAgo(g.ts)}</div></div></div>`).join("")}</div>
    ${go ? `<button class="btn mt" data-a="gift-go" data-v="${go.split(":")[1]}">👀 Посмотреть</button>` : ""}</div>`;
}

let petRefreshing = false, petActSlot = 0;
setInterval(() => {
  if (S.screen !== "pets") return;
  const t = petNow();
  const slot = Math.floor(t / ACT_SLOT), busy = document.activeElement && document.activeElement.tagName === "INPUT";
  if (slot !== petActSlot) { const first = !petActSlot; petActSlot = slot; if (!first && !S.care && !S.sheet && !busy && (S.petTab || "list") === "list") render(); }   // питомцы сменили занятие
  document.querySelectorAll("[data-until]").forEach((el) => {
    const left = Number(el.dataset.until) - t;
    el.textContent = left > 0 ? (el.dataset.egg && el.classList.contains("small") ? "через " : "") + petTime(left) : el.dataset.egg ? "вылупляется!" : "0 с";
    if (left <= 0 && el.dataset.egg && !petRefreshing) { petRefreshing = true; Api.refresh().catch(() => {}).then(() => { petRefreshing = false; }); }
  });
}, 1000);

const petErr = (e) => { notify("error"); toast(e.message || "Ошибка"); };
const PET_ACTIONS = {
  "pets-sel": (v) => { S.petSel = Number(v); haptic(); render(); window.scrollTo(0, 0); },
  "pets-tab": (v) => { S.petTab = v; S.petSel = null; S.care = null; haptic(); render(); window.scrollTo(0, 0); if (v === "battle") battleLoadList(); if (v === "trade") tradeLoadList(); },
  "food-cat": (v) => { S.shopFood = v; haptic(); render(); },
  "food-buy5": (item) => Api.act("/api/food/buy", { item, qty: 5 }).then(() => { haptic("medium"); toast(`Куплено: ${petFood(item).name} ×5`); }).catch(petErr),
  "pets-back": () => { S.petSel = null; render(); },
  "pets-grave": () => { S.petGrave = !S.petGrave; render(); },
  "pet-pet": () => {
    haptic();
    const p = Api.state.pets.find((x) => x.id === S.petSel), q = p ? Pets.traits(p.dna).quirkIdx : -1;
    Api.act("/api/pet/pet", { pet: S.petSel }).then((st) => {
      const r = st.reaction;
      if (r === "asleep") { petFx("💤"); return toast("Тсс… он спит"); }
      petJump(r === "annoyed" ? "act-shake" : "act-hop");
      if (r === "annoyed" && q === 5) { petFx("💢"); return toast("Только не уши!"); }
      petFx(r === "annoyed" ? "💢" : r === "happy" ? (q === 0 ? "🤧" : "❤") : "✨");
      if (r === "happy" && q === 0) petSay("апчхи! 🤧");
      else if (q === 4 && r !== "annoyed") petSay("пузико! ещё!");
      if (r === "annoyed") toast(q === 5 ? "Только не уши!" : "Ему не нравится, когда тискают так часто");
    }).catch(petErr);
  },
  "pet-feed": (item) => {
    const p = Api.state.pets.find((x) => x.id === S.petSel);
    if (!p) return;
    const t = Pets.traits(p.dna);
    Api.act("/api/pet/feed", { pet: p.id, item }).then((st) => {
      const k = petKnow(p.id);
      if (st.reaction === "fav") { k.fav = 1; saveProfile(); notify("success"); toast(`${t.name} обожает это! ❤`); }
      else if (st.reaction === "dis") { k.dis = 1; saveProfile(); toast(`${t.name} морщится… съел, но без радости`); }
      else { haptic("medium"); toast("Ням!"); }
      setTimeout(() => { petFx(st.reaction === "dis" ? "🤢" : st.reaction === "fav" ? "😍" : "🍖"); petJump("act-chew"); if (t.quirkIdx === 10) setTimeout(() => petSay("ик!"), 900); }, 60);
    }).catch(petErr);
  },
  "pet-den": (v) => Api.act("/api/pet/den", { pet: S.petSel, on: v === "1" }).then(() => { haptic("medium"); toast(v === "1" ? "🏠 Спит в домике" : "☀️ Проснулся!"); }).catch(petErr),
  "pet-mg-open": () => { S.sheet = { type: "pet-mg" }; renderOverlay(); },
  "pet-mg-inject": (k) => {
    const go = () => Api.act("/api/pet/inject", { pet: S.petSel, item: k }).then((st) => {
      S.sheet = null; renderOverlay(); notify("success"); coinRain();
      toast(`💉 Мутация: ${st.inject.name}${st.inject.replaced.length ? " (заменила прежнюю)" : ""}`); setTimeout(() => petFx("🧬"), 80);
    }).catch(petErr);
    const q = "Уколоть мутаген? Это навсегда.";
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "pet-fun": () => { S.funPet = S.petSel; S.fun = null; S.funFrom = "pets"; S.screen = "petfun"; render(); window.scrollTo(0, 0); },
  "food-buy10": (item) => Api.act("/api/food/buy", { item, qty: 10 }).then(() => { haptic("medium"); toast(`Куплено оптом: ${petFood(item).name} ×10 (−20%)`); }).catch(petErr),
  "pet-main": () => Api.act("/api/pet/main", { pet: S.petSel }).then(() => { syncProfile(); toast("Теперь он в твоём профиле ★"); }).catch(petErr),
  "food-buy": (item) => Api.act("/api/food/buy", { item, qty: 1 }).then(() => { haptic("medium"); toast(`Куплено: ${petFood(item).name}`); }).catch(petErr),
  promo: () => {
    const el = document.getElementById("promo-code"), code = el ? el.value.trim() : "";
    if (!code) return toast("Введи промокод");
    el.blur();
    Api.act("/api/promo", { code }).then((st) => { notify("success"); toast("🎉 Получено: " + st.got); coinRain(); }).catch(petErr);
  },
};
