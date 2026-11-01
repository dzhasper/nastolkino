/* Экран «Питомцы»: яйца, уход, кормление, магазин еды, промокоды, кладбище. Данные — с сервера (js/api.js). */
"use strict";

const PET_DAY = 86400;
const petNow = () => (Date.now() + ((Api.state && Api.state.skew) || 0)) / 1000;
const petCode = (p) => p.rarity + p.dna;
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
  const full = p.starve_at - 2 * PET_DAY;
  return Object.assign({}, p, { hunger: Math.max(0, Math.min(100, Math.round(100 - (t - full) / 864))), dieIn: p.starve_at - t });
}
const petKnow = (id) => ((store.petKnow = store.petKnow || {})[id] = store.petKnow[id] || {});
const bar = (v, cls) => `<div class="pbar ${cls} ${v < 25 ? "low" : ""}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
const moodText = (m) => (m > 70 ? "Счастлив" : m > 40 ? "Спокоен" : m > 15 ? "Грустит" : "Обиделся");
const hungerText = (h) => (h > 60 ? "Сыт" : h > 25 ? "Проголодался" : h > 0 ? "Голодает" : "Умирает от голода");

function viewPets() {
  const head = `<div class="top"><div class="grow"><h1>🐾 Питомцы</h1><div class="muted small">Каждый — единственный в мире</div></div>${coinPill()}</div>`;
  if (!Api.on) {
    const cfg = window.APP_CONFIG || {};
    return `<div class="fade-in">${head}<div class="card center pets-off">${Pets.sprite("3" + "7f3a9c51e2b84d06a1c3f5e7092b4d6e" + "28", 140)}
      <b class="mt">Питомцы живут на сервере</b><div class="muted small mt">${cfg.api ? "Открой Настолкино из Telegram-бота — тогда питомцы, яйца и промокоды заработают." : "Сервер ещё не подключён. Инструкция — в файле СЕРВЕР_УСТАНОВКА.md."}</div></div></div>${tabs()}`;
  }
  const st = Api.state;
  if (!st) return `<div class="fade-in">${head}<div class="card center"><div class="spinner" style="margin:10px auto"></div><div class="muted small">${Api.error ? esc(Api.error) + " — пробую ещё раз…" : "Загружаю питомцев…"}</div></div></div>${tabs()}`;
  const sel = S.petSel && st.pets.find((p) => p.id === S.petSel && p.alive);
  return `<div class="fade-in pets">${head}${sel ? petDetail(petLive(sel)) : petList()}</div>${tabs()}`;
}

function petList() {
  const st = Api.state, live = st.pets.filter((p) => p.alive).map(petLive), dead = st.pets.filter((p) => !p.alive);
  const card = (p) => {
    if (p.egg) return `<button class="pet-card egg" data-a="pets-sel" data-v="${p.id}">${Pets.sprite(petCode(p), 80, { egg: true })}
      <b>Яйцо</b><span class="small muted" data-until="${p.hatch}" data-egg="1">${p.left > 0 ? "через " + petTime(p.left) : "вылупляется!"}</span></button>`;
    const t = Pets.traits(p.dna);
    return `<button class="pet-card ${p.hunger < 25 ? "hungry" : ""} ${st.main_pet === p.id ? "main" : ""}" data-a="pets-sel" data-v="${p.id}">
      ${st.main_pet === p.id ? '<span class="pet-star">★</span>' : ""}${Pets.sprite(petCode(p), 80)}
      <b>${esc(t.name)}</b><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>${t.muts.length ? `<span class="mut-icons">${t.muts.map((m) => m.emoji).join("")}</span>` : ""}${bar(p.hunger, "food")}</button>`;
  };
  return `${live.length ? `<div class="pet-grid">${live.map(card).join("")}</div>`
      : `<div class="card center"><div class="pet-empty">🥚</div><b>Питомцев пока нет</b><div class="muted small mt">Яйца выпадают из промокодов и раздач в боте, а очень редко — из ежедневного сундука.</div></div>`}
    ${live.some((p) => !p.egg && p.hunger < 25) ? `<div class="card warn mt">⚠️ Кто-то голодает. Без еды двое суток — питомец умирает навсегда.</div>` : ""}
    ${petPantry()}
    ${petShop()}
    <div class="section-title">Промокод</div>
    <div class="row"><input class="input grow" id="promo-code" maxlength="24" placeholder="Например: A1B2C3D4" autocomplete="off"><button class="btn small" data-a="promo">ОК</button></div>
    ${dead.length ? `<button class="card grave-toggle mt2" data-a="pets-grave">🕯 Кладбище питомцев · ${dead.length}<span class="muted">${S.petGrave ? "▲" : "▼"}</span></button>
      ${S.petGrave ? `<div class="pet-grid grave">${dead.map((p) => `<div class="pet-card dead">${Pets.sprite(petCode(p), 64, { dead: true })}<b>${esc(Pets.name(p.dna))}</b>
        <span class="small muted">${p.died ? new Date(p.died * 1000).toLocaleDateString("ru-RU") : ""}</span></div>`).join("")}</div>` : ""}` : ""}`;
}

function petPantry() {
  const food = Api.state.food || {}, keys = Object.keys(food).filter((k) => food[k] > 0);
  return `<div class="section-title">Кладовка</div>${keys.length
    ? `<div class="pantry">${keys.map((k) => `<span class="food-chip">${Pets.FOOD_EMOJI[k] || "🍽"} ${esc(petFood(k).name)} <b>×${food[k]}</b></span>`).join("")}</div>`
    : `<div class="muted small">Пусто. Купи еду ниже 👇</div>`}`;
}

function petShop() {
  const foods = Object.entries(Api.state.foods || {}).filter(([, f]) => !f.special).sort((a, b) => a[1].price - b[1].price);
  return `<div class="section-title">Лавка еды</div><div class="food-shop">${foods.map(([k, f]) => `<div class="food-row">
    <span class="fe">${Pets.FOOD_EMOJI[k] || "🍽"}</span><div class="grow"><b>${esc(f.name)}</b><div class="small muted">+${f.hunger} сытости${f.mood ? ` · +${f.mood} настроения` : ""}</div></div>
    <button class="btn small" data-a="food-buy" data-v="${k}" ${S.profile.coins < f.price ? "disabled" : ""}>🪙 ${f.price}</button></div>`).join("")}</div>`;
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
    <div class="pet-stage r${p.rarity}" data-a="pet-pet" id="pet-stage">${Pets.sprite(petCode(p), 190)}<div class="pet-fx" id="pet-fx"></div></div>
    <div class="pet-title"><b class="pet-name">${esc(t.name)}</b> <span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span><div class="small muted">ДНК ${t.code} · ${esc(t.shape)}</div></div>
    ${petMutBlock(t)}
    <div class="card">
      <div class="pstat"><span>🍖 ${hungerText(p.hunger)}</span><b>${p.hunger}%</b></div>${bar(p.hunger, "food")}
      <div class="pstat mt"><span>💛 ${moodText(p.mood)}</span><b>${p.mood}%</b></div>${bar(p.mood, "mood")}
      ${p.hunger < 25 ? `<div class="warn small mt">⚠️ Умрёт через <b data-until="${p.starve_at}">${petTime(p.dieIn)}</b>, если не покормить</div>` : ""}
    </div>
    <div class="section-title">Покормить</div>
    ${foods.length ? `<div class="pantry">${foods.map((x) => `<button class="food-chip" data-a="pet-feed" data-v="${x}">${Pets.FOOD_EMOJI[x] || "🍽"} ${esc(petFood(x).name)} <b>×${food[x]}</b></button>`).join("")}</div>`
      : `<div class="muted small">Еды нет — купи в лавке на странице «Все питомцы».</div>`}
    <div class="small muted mt">Погладь — просто нажми на питомца.</div>
    <div class="section-title">Характер</div>
    <div class="card pet-info">
      <div><span class="muted">Нрав</span><b>${esc(t.temper)} · ${esc(soc.name)}</b></div><div class="small muted">${esc(soc.desc)}</div>
      <div><span class="muted">Хобби</span><b>${esc(t.hobby)}</b></div>
      <div><span class="muted">Странность</span><b>${esc(t.quirk)}</b></div>
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
  return `<div class="center hatch"><div class="small muted">Скорлупа треснула…</div>
    <div class="pet-stage r${p.rarity} big">${Pets.sprite(petCode(p), 200)}</div>
    <h2>${esc(t.name)}</h2><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>
    ${t.muts.length ? `<div class="mt">${petMutBlock(t, true)}</div>` : ""}
    <div class="muted small mt">${esc(t.temper)}, ${esc(Pets.SOCIAL[t.social].name.toLowerCase())}. Хобби: ${esc(t.hobby)}.</div>
    <div class="small mt">Не забывай кормить каждый день — иначе он умрёт навсегда.</div></div>`;
}

// мутации: облик поверх генов
function petMutBlock(t, short) {
  if (!t.muts.length) return "";
  const head = t.muts.length > 1 ? `🧬 ${t.muts.length} мутации` : "🧬 Мутация";
  return `<div class="mut-box ${short ? "short" : ""}"><div class="mut-head">${head}</div>${t.muts.map((m) => `<div class="mut g-${m.group}"><span class="me">${m.emoji}</span><div><b>${esc(m.name)}</b>${short ? "" : `<div class="small muted">${esc(m.desc)}</div>`}</div></div>`).join("")}</div>`;
}

// маленькая плашка питомца для профиля и чужой карточки
function petBadge(code, mine) {
  if (!code || !/^[0-4][0-9a-f]{32}(?:[0-9a-f]{2}){0,3}$/.test(code)) return "";
  const r = Number(code[0]);
  return `<div class="card pet-badge" ${mine ? 'data-a="tab" data-v="pets"' : ""}>${Pets.sprite(code, 56)}<div class="grow"><b>${esc(Pets.name(code.slice(1)))}</b>
    <div><span class="rar r${r}">${Pets.rarityName(r, code.slice(1))}</span> ${Pets.muts(code.slice(1)).map((m) => m.emoji).join("")}</div></div>${mine ? '<span class="muted">›</span>' : ""}</div>`;
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

// после каждого ответа сервера: показать вылупившихся, перерисовать экран
function petOnState() {
  const st = Api.state;
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

let petRefreshing = false;
setInterval(() => {
  if (S.screen !== "pets") return;
  const t = petNow();
  document.querySelectorAll("[data-until]").forEach((el) => {
    const left = Number(el.dataset.until) - t;
    el.textContent = left > 0 ? (el.dataset.egg && el.classList.contains("small") ? "через " : "") + petTime(left) : el.dataset.egg ? "вылупляется!" : "0 с";
    if (left <= 0 && el.dataset.egg && !petRefreshing) { petRefreshing = true; Api.refresh().catch(() => {}).then(() => { petRefreshing = false; }); }
  });
}, 1000);

const petErr = (e) => { notify("error"); toast(e.message || "Ошибка"); };
const PET_ACTIONS = {
  "pets-sel": (v) => { S.petSel = Number(v); haptic(); render(); window.scrollTo(0, 0); },
  "pets-back": () => { S.petSel = null; render(); },
  "pets-grave": () => { S.petGrave = !S.petGrave; render(); },
  "pet-pet": () => {
    haptic();
    Api.act("/api/pet/pet", { pet: S.petSel }).then((st) => {
      const r = st.reaction;
      petFx(r === "annoyed" ? "💢" : r === "happy" ? "❤" : "✨");
      if (r === "annoyed") toast("Ему не нравится, когда тискают так часто");
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
      setTimeout(() => petFx(st.reaction === "dis" ? "🤢" : st.reaction === "fav" ? "😍" : "🍖"), 60);
    }).catch(petErr);
  },
  "pet-main": () => Api.act("/api/pet/main", { pet: S.petSel }).then(() => { syncProfile(); toast("Теперь он в твоём профиле ★"); }).catch(petErr),
  "food-buy": (item) => Api.act("/api/food/buy", { item, qty: 1 }).then(() => { haptic("medium"); toast(`Куплено: ${petFood(item).name}`); }).catch(petErr),
  promo: () => {
    const el = document.getElementById("promo-code"), code = el ? el.value.trim() : "";
    if (!code) return toast("Введи промокод");
    el.blur();
    Api.act("/api/promo", { code }).then((st) => { notify("success"); toast("🎉 Получено: " + st.got); coinRain(); }).catch(petErr);
  },
};
