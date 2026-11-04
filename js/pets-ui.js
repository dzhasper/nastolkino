/* Экран «Питомцы»: яйца, уход, кормление, магазин еды, промокоды, кладбище. Данные — с сервера (js/api.js). */
"use strict";

const PET_DAY = 86400;
const petNow = () => (Date.now() + ((Api.state && Api.state.skew) || 0)) / 1000;
const petStage = (p) => (p.egg ? "" : Pets.stageOf(p.grown, petNow()));
const petCode = (p) => { const st = petStage(p); return p.rarity + p.dna + (st ? "." + st : "") + (p.hat && !p.egg ? "-" + p.hat : ""); };
const petFood = (k) => (Api.state && Api.state.foods && Api.state.foods[k]) || { name: k, hunger: 0, mood: 0, price: 0 };
function petTime(sec) {
  sec = Math.max(0, Math.round(sec));
  if (sec >= PET_DAY) return `${Math.floor(sec / PET_DAY)} д ${Math.floor((sec % PET_DAY) / 3600)} год`;
  if (sec >= 3600) return `${Math.floor(sec / 3600)} год ${Math.floor((sec % 3600) / 60)} хв`;
  if (sec >= 60) return `${Math.floor(sec / 60)} хв ${sec % 60} с`;
  return `${sec} с`;
}
// сытость считаем прямо сейчас, без запроса: с 100 до 0 за сутки, ещё сутки — и смерть
function petLive(p) {
  const t = petNow();
  if (p.egg) return Object.assign({}, p, { left: p.hatch - t });
  const imm = Pets.traits(p.dna).immortal, full = p.full_at != null ? p.full_at : p.starve_at - 2 * PET_DAY;
  const att = p.att == null ? 70 : p.den || !p.att_at || !p.att_rate ? p.att : Math.max(0, Math.min(100, Math.round((p.att_base != null ? p.att_base : p.att) - Math.max(0, t - p.att_at) / 3600 * p.att_rate * .85)));
  return Object.assign({}, p, { hunger: imm ? 100 : Pets.hungerAt(p.dna, full, p.den, t), dieIn: p.starve_at - t, att, lonely: att < 25 });
}
const petKnow = (id) => ((store.petKnow = store.petKnow || {})[id] = store.petKnow[id] || {});
const bar = (v, cls) => `<div class="pbar ${cls} ${v < 25 ? "low" : ""}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
// внимание: ласка, мини-игры и игрушки; одиночки — понемногу, компанейские — побольше
const attText = (p) => (p.att > 70 ? "Уваги вистачає" : p.att > 40 ? "Хоче поспілкуватися" : p.att >= 25 ? "Нудьгує" : "Дметься — потрібна увага");
function attHint(p) {
  const t = Pets.traits(p.dna), pk = (Pets.perks(p.dna) || []).map((x) => x.key || x);
  const food = pk.includes("glutton") || pk.includes("gourmet") || pk.includes("sweet") ? " Ненажера: смачна їжа з рук — теж увага." : "";
  return (t.social === 2 ? "Компанійський — обожнює, коли його гладять і з ним граються, швидко нудьгує." : t.social === 1 ? "Любить і ігри, і ласку — у міру." : "Одинак — уваги потрібно потроху: тихі ігри та іграшки, гладити не частіше ніж раз на пару годин.") + food;
}
const moodText = (m) => (m > 70 ? "Щасливий" : m > 40 ? "Спокійний" : m > 15 ? "Сумує" : "Образився");
const hungerText = (h) => (h > 60 ? "Ситий" : h > 25 ? "Зголоднів" : h > 0 ? "Голодує" : "Помирає з голоду");

function viewPets() {
  if (Api.on && Api.ready) leagueLoad();
  const head = `<div class="top"><div class="grow"><h1>🐾 Улюбленці</h1><div class="muted small">Кожен — єдиний у світі</div></div>${coinPill()}</div>`;
  if (!Api.on) {
    const cfg = window.APP_CONFIG || {};
    return `<div class="fade-in">${head}<div class="card center pets-off">${Pets.sprite("3" + "7f3a9c51e2b84d06a1c3f5e7092b4d6e" + "28", 140)}
      <b class="mt">Улюбленці живуть на сервері</b><div class="muted small mt">${cfg.api ? "Відкрий Настолкіно з Telegram-бота — тоді улюбленці, яйця й промокоди запрацюють." : "Сервер ще не підключено. Інструкція — у файлі ВСТАНОВЛЕННЯ.md."}</div></div></div>${tabs()}`;
  }
  const st = Api.state;
  if (!st) return `<div class="fade-in">${head}<div class="card center"><div class="spinner" style="margin:10px auto"></div><div class="muted small">${Api.error ? esc(Api.error) + " — пробую ще раз…" : "Завантажую улюбленців…"}</div></div></div>${tabs()}`;
  const tab = S.petTab || "list", sel = tab === "list" && S.petSel && st.pets.find((p) => p.id === S.petSel && p.alive);
  const t = (k, label) => `<button class="${tab === k ? "on" : ""}" data-a="pets-tab" data-v="${k}">${label}</button>`;
  const body = sel ? petDetail(petLive(sel)) : tab === "shop" ? petShop() : tab === "battle" ? viewBattleTab() : tab === "trade" ? viewTradeTab() : petList();
  return `<div class="fade-in pets">${head}${sel ? "" : `<div class="seg seg4">${t("list", "🐾 Мої")}${t("shop", "🛒 Крамниця")}${t("battle", "⚔️ Бої")}${t("trade", "🔄 Обмін")}</div>`}${body}</div>${tabs()}`;
}

function petList() {
  const st = Api.state, live = st.pets.filter((p) => p.alive).map(petLive), dead = st.pets.filter((p) => !p.alive);
  const card = (p) => {
    if (p.egg) return `<button class="pet-card egg" data-a="pets-sel" data-v="${p.id}">${Pets.sprite(petCode(p), 80, { egg: true })}
      <b>Яйце</b><span class="small muted" data-until="${p.hatch}" data-egg="1">${p.left > 0 ? "через " + petTime(p.left) : "вилуплюється!"}</span></button>`;
    const t = Pets.traits(p.dna);
    return `<button class="pet-card ${p.hunger < 25 ? "hungry" : ""} ${p.lonely ? "lonely" : ""} ${st.main_pet === p.id ? "main" : ""}" data-a="pets-sel" data-v="${p.id}">${p.dep ? '<span class="pet-lonely dep" title="Депресія">😞</span>' : p.lonely ? '<span class="pet-lonely" title="Нудьгує">💔</span>' : ""}
      ${st.main_pet === p.id ? '<span class="pet-star">★</span>' : ""}${p.den ? '<span class="pet-zz">🏠</span>' : ""}${t.collect ? '<span class="pet-cl">✦</span>' : p.receptive ? '<span class="pet-cl dna">🧬</span>' : ""}${petMiniHtml(p, 80)}
      <b>${esc(t.name)}</b><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>${t.muts.length ? `<span class="mut-icons">${t.muts.map((m) => m.emoji).join("")}</span>` : ""}${bar(p.hunger, "food")}${bar(p.att, "att")}</button>`;
  };
  if (S.care) return careScene();
  const den = st.den || { rooms: 0, used: 0 };
  const care = live.filter((p) => !p.egg).length >= 2 ? `<div class="care-bar"><button class="btn" data-a="care-open">🤲 Догляд за всіма</button>
    <span class="den-pill" title="Кімнати в будиночку">🏠 ${den.used}/${den.rooms}</span></div>` : "";
  return `${feederCard()}${typeof nannyCard === "function" ? nannyCard() : ""}${questsCard()}${leagueCard()}${care}${toysCard()}${live.length ? `<div class="pet-grid">${live.map(card).join("")}</div>`
      : `<div class="card center"><div class="pet-empty">🥚</div><b>Улюбленців поки немає</b><div class="muted small mt">Яйця випадають із промокодів і роздач у боті, а дуже рідко — зі щоденної скрині.</div></div>`}
    ${live.some((p) => !p.egg && p.hunger < 25) ? `<div class="card warn mt">⚠️ Хтось голодує. Без їжі дві доби — улюбленець помирає назавжди.</div>` : ""}
    ${petPantry()}
    <div class="section-title">Промокод</div>
    <div class="row"><input class="input grow" id="promo-code" maxlength="24" placeholder="Наприклад: A1B2C3D4" autocomplete="off"><button class="btn small" data-a="promo">ОК</button></div>
    ${dead.length ? `<button class="card grave-toggle mt2" data-a="pets-grave">🕯 Цвинтар улюбленців · ${dead.length}<span class="muted">${S.petGrave ? "▲" : "▼"}</span></button>
      ${S.petGrave ? `<div class="pet-grid grave">${dead.map((p) => `<div class="pet-card dead">${Pets.sprite(petCode(p), 64, { dead: true })}<b>${esc(Pets.name(p.dna))}</b>
        <span class="small muted">${p.died ? new Date(p.died * 1000).toLocaleDateString("uk-UA") : ""}</span></div>`).join("")}</div>` : ""}` : ""}`;
}

function petPantry(inShop) {
  const food = Api.state.food || {}, keys = Object.keys(food).filter((k) => food[k] > 0);
  return `<div class="section-title">Комора</div>${keys.length
    ? `<div class="pantry">${keys.map((k) => `<span class="food-chip">${Pets.FOOD_EMOJI[k] || "🍽"} ${esc(petFood(k).name)} <b>×${food[k]}</b></span>`).join("")}</div>`
    : `<div class="muted small">${inShop ? "Порожньо. Купи нижче 👇" : "Порожньо. Їжа — у вкладці «🛒 Крамниця»"}</div>`}`;
}

const SHOP_CATS = [["food", "🍖 Їжа", "Ситість: годувати щодня"], ["treat", "🍬 Ласощі", "Піднімають настрій — сумний улюбленець не б’ється"], ["battle", "⚔️ Для бою", "Енергія й посилення на наступний бій"]];
function petShop() {
  const cat = S.shopFood || "food", have = Api.state.food || {};
  const foods = Object.entries(Api.state.foods || {}).filter(([, f]) => !f.special && (f.cat || "food") === cat).sort((a, b) => a[1].price - b[1].price);
  const c = SHOP_CATS.find((x) => x[0] === cat);
  return `${petPantry(true)}
    <div class="cats cats3 mt">${SHOP_CATS.map(([k, n]) => `<button class="pill ${k === cat ? "on" : ""}" data-a="food-cat" data-v="${k}">${n}</button>`).join("")}</div>
    <div class="small muted mt">${c[2]}</div>
    <div class="food-shop mt">${foods.map(([k, f]) => `<div class="food-row">
      <span class="fe">${Pets.FOOD_EMOJI[k] || "🍽"}</span><div class="grow"><b>${esc(f.name)}</b>${have[k] ? ` <span class="small muted">· є ${have[k]}</span>` : ""}
        <div class="small muted">${f.desc ? esc(f.desc) : `+${f.hunger} ситості${f.mood ? ` · +${f.mood} настрою` : ""}`}</div></div>
      <div class="buy2"><button class="btn small" data-a="food-buy" data-v="${k}" ${S.profile.coins < f.price ? "disabled" : ""}>🪙 ${f.price}</button>
        <button class="btn ghost small" data-a="food-buy5" data-v="${k}" ${S.profile.coins < f.price * 5 ? "disabled" : ""}>×5</button>
        <button class="btn ghost small" data-a="food-buy10" data-v="${k}" ${S.profile.coins < Math.round(f.price * 8) ? "disabled" : ""}>×10 −20%</button></div></div>`).join("")}</div>
    <div class="card small muted mt">🍏 Золоте яблуко й ✨ зоряний пил не продаються — лише в промокодах і роздачах бота.</div>
    ${feederShop()}`;
}

// тоска и депрессия: сколько осталось и что с питомцем
function petDepBlock(p) {
  const now = petNow();
  if (p.dep) return `<div class="dep-card mt"><b>😞 Депресія · ще <span data-until="${p.dep.until}">${petTime(p.dep.until - now)}</span></b>
    <div class="small">Його надто довго не помічали. Усі сили −25%, настрій не вище 50. «${esc(p.dep.name)}» — ${esc(p.dep.eff)}.</div>
    ${p.dep.refuse || p.att < 40 ? `<div class="small warn">⚠️ Уваги менше 40% — часто відмовляється від їжі, навіть із годівнички. Може померти! Погладь, пограйся або найми няню</div>` : `<div class="small good">✓ Уваги вистачає — їсть нормально</div>`}</div>`;
  if (p.att < 20 && !Pets.traits(p.dna).immortal) return `<div class="dep-card sad mt"><b>💔 Тужить</b><div class="small">Увага майже на нулі. Якщо вона протримається на нулі пів доби — почнеться депресія на тиждень: відмова від їжі, слабкість у бою, свої зриви за характером.</div></div>`;
  return "";
}
function petDetail(p) {
  const st = Api.state;
  if (p.egg) {
    return `<button class="btn ghost small" data-a="pets-back">← Усі улюбленці</button>
      <div class="pet-stage egg">${Pets.sprite(petCode(p), 180, { egg: true })}</div>
      <div class="card center"><b>Яйце</b><div class="muted small mt">Хто всередині — ніхто не знає. Навіть рідкісність.</div>
      <div class="display mt" data-until="${p.hatch}" data-egg="1">${p.left > 0 ? petTime(p.left) : "вилуплюється!"}</div></div>`;
  }
  const t = Pets.traits(p.dna), k = petKnow(p.id), food = st.food || {}, soc = Pets.SOCIAL[t.social];
  const foods = Object.keys(food).filter((x) => food[x] > 0);
  return `<button class="btn ghost small" data-a="pets-back">← Усі улюбленці</button>
    ${petStageHtml(p)}${p.receptive ? `<button class="dna-side" data-a="pet-mg-open" title="Приймає мутагени">🧬<i>${(p.mg || []).length}/2</i></button>` : ""}
    <div class="pet-title"><b class="pet-name">${esc(t.name)}</b> <span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span><div class="small muted">ДНК ${t.code} · ${esc(t.shape)}</div></div>
    ${petCollectBlock(p, t)}${petMutBlock(t)}
    <div class="card">
      ${petGrowLine(p)}
      ${t.immortal ? `<div class="pstat"><span>♾️ Не потребує їжі — ніколи</span><b>∞</b></div>` : `<div class="pstat"><span>🍖 ${hungerText(p.hunger)}${p.den ? " · 🏠 у будиночку голодує вчетверо повільніше" : Pets.sleepState(p.dna, petNow()).asleep ? " · 💤 спить — голодує на 30% повільніше" : ""}</span><b>${p.hunger}%</b></div>${bar(p.hunger, "food")}`}
      <div class="pstat mt"><span>💛 ${moodText(p.mood)}</span><b>${p.mood}%</b></div>${bar(p.mood, "mood")}
      <div class="pstat mt"><span>💗 ${attText(p)}</span><b>${p.att}%</b></div>${bar(p.att, "att")}<div class="tiny muted att-hint">${esc(attHint(p))}</div>
      ${petDepBlock(p)}
      ${t.reborn ? `<div class="small mt">🔥 Фенікс не помирає: якщо довго не годувати, він згорить і відродиться з попелу яйцем</div>` : ""}
      ${p.hunger < 25 && !t.reborn ? `<div class="warn small mt">⚠️ Помре через <b data-until="${p.starve_at}">${petTime(p.dieIn)}</b>, якщо не нагодувати</div>` : ""}
    </div>
    <div class="section-title">Нагодувати</div>
    ${foods.length ? `<div class="pantry">${foods.map((x) => `<button class="food-chip" data-a="pet-feed" data-v="${x}">${Pets.FOOD_EMOJI[x] || "🍽"} ${esc(petFood(x).name)} <b>×${food[x]}</b></button>`).join("")}</div>`
      : `<div class="muted small">Їжі немає — купи у вкладці «🛒 Крамниця».</div>`}
    <div class="small muted mt">Погладь — просто натисни на улюбленця.</div>
    ${petLifeBlock(p, t)}
    ${petCareBlock(p, t)}
    ${petBattleCard(p, t)}
    <div class="section-title">Характер</div>
    <div class="card pet-info">
      <div><span class="muted">Вдача</span><b>${esc(t.temper)} · ${esc(soc.name)}</b></div><div class="small muted">${esc(soc.desc)}</div>
      <div><span class="muted">Хобі</span><b>${Pets.HOBBY_FX[t.hobbyIdx][0]} ${esc(t.hobby)}</b></div><div class="small fx-line">↳ ${esc(Pets.HOBBY_FX[t.hobbyIdx][1])}</div>
      <div><span class="muted">Дивацтво</span><b>${esc(t.quirk)}</b></div><div class="small fx-line">↳ ${esc(Pets.QUIRK_FX[t.quirkIdx])}</div>
      ${t.partner ? `<div><span class="muted">Другий — ${esc(t.partner.name)}</span><b>${esc(t.partner.temper)}, ${esc(t.partner.hobby)}</b></div>` : ""}
      <div><span class="muted">Обожнює</span><b>${k.fav ? `${Pets.FOOD_EMOJI[t.fav]} ${esc(petFood(t.fav).name)}` : "??? — дізнаєшся, коли вгадаєш"}</b></div>
      <div><span class="muted">Терпіти не може</span><b>${k.dis ? `${Pets.FOOD_EMOJI[t.dis]} ${esc(petFood(t.dis).name)}` : "???"}</b></div>
      <div><span class="muted">Вилупився</span><b>${new Date(p.hatch * 1000).toLocaleDateString("uk-UA")}</b></div>
    </div>
    ${st.main_pet === p.id ? `<div class="card center small mt">★ Головний улюбленець — його бачать усі у твоєму профілі</div>`
      : `<button class="btn mt" data-a="pet-main">★ Зробити головним</button>`}`;
}

function petHatchSheet(id) {
  const p = Api.state && Api.state.pets.find((x) => x.id === id);
  if (!p) return "";
  const t = Pets.traits(p.dna);
  if (t.collect) return `<div class="center hatch"><div class="gift-head">${p.from === "tour" ? "🏆 Приз турніру!" : "🎁 Подарунок від адміністратора!"}</div>
    <div class="pet-stage r${p.rarity} big collect">${Pets.sprite(petCode(p), 200)}</div>
    <h2>${esc(t.name)}</h2><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>
    <div class="small mt">${p.from === "tour" ? "Ти переміг у турнірі й забираєш колекційного улюбленця." : "Адміністратор подарував тобі колекційного улюбленця."}</div>
    <div class="card small mt">✦ Він єдиний у світі, не голодує й залишиться з тобою назавжди.<br>${esc(t.collect.desc)}</div></div>`;
  return `<div class="center hatch"><div class="small muted">Шкаралупа тріснула…</div>
    <div class="pet-stage r${p.rarity} big">${Pets.sprite(petCode(p), 200)}</div>
    <h2>${esc(t.name)}</h2><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span>
    ${t.muts.length ? `<div class="mt">${petMutBlock(t, true)}</div>` : ""}
    <div class="muted small mt">${esc(t.temper)}, ${esc(Pets.SOCIAL[t.social].name.toLowerCase())}. Хобі: ${esc(t.hobby)}.</div>
    <div class="small mt">Не забувай годувати щодня — інакше він помре назавжди.</div></div>`;
}

// набір власника колекційного: міні-картка з усім набором (аватарка, рамка, фон, ID-картка, сяйво імені, значок) і кнопка «вдягнути все»
function collKitHtml(key) {
  const pic = Shop.byId("pic", "c_" + key); if (!pic) return "";
  const own = Api.state && (Api.state.inv || []).includes("pic:c_" + key);
  const ava = Shop.byId("ava", "c_" + key), badge = ava ? ava.emoji : "";
  const lk = Object.assign({}, Shop.DEFAULT, { frame: "c_" + key, bg: "c_" + key, style: "c_" + key, fx: "c_" + key, title: (S.profile.look || {}).title || "none" });
  const pl = Object.assign({}, S.profile, { look: lk, photo: new URL(Loot.picUrl("c_" + key), location.href).href });
  const worn = ["frame", "bg", "style", "fx", "pic"].every((k) => (store.look || {})[k] === "c_" + key) && store.badge === badge;
  return `<div class="coll-kit mt"><div class="small"><b>🎁 Набір «${esc(pic.name)}»</b> — аватарка, рамка, фон, ID-картка, сяйво імені й знак ${esc(badge)}</div>
    <div class="ck-card">${Shop.card({ name: Shop.cleanName(S.profile.name) + (badge ? " " + badge : ""), games: S.profile.games, wins: S.profile.wins, avatarHtml: av(pl, "sm") }, lk, { mini: true })}</div>
    ${own ? `<button class="btn ${worn ? "ghost" : ""} small mt" data-a="coll-wear" data-v="${key}" ${worn ? "disabled" : ""}>${worn ? "✓ Набір уже на тобі" : "✨ Вдягнути весь набір"}</button>` : ""}</div>`;
}
function collWear(key, quiet) {
  const inv = (Api.state && Api.state.inv) || [];
  store.look = store.look || {};
  ["pic", "frame", "bg", "style", "fx"].forEach((cat) => { if (inv.includes(cat + ":c_" + key)) store.look[cat] = "c_" + key; });
  const ava = Shop.byId("ava", "c_" + key); if (ava && inv.includes("ava:c_" + key)) store.badge = ava.emoji;
  saveProfile(); syncProfile();
  const it = Shop.byId("pic", "c_" + key); if (!quiet) { toast("🐉 Набір «" + (it ? it.name : key) + "» вдягнуто"); haptic("medium"); }
  return it;
}

// коллекционный: единственный в мире
function petCollectBlock(p, t) {
  if (!t.collect) return "";
  const c = t.collect, set = Pets.COLLECT_SETS[c.set], mine = (Api.state.pets || []).filter((x) => x.alive && x.collect && Pets.collectOf(x.dna) && Pets.collectOf(x.dna).set === c.set).length;
  const total = Pets.COLLECT.filter((x) => x.set === c.set).length;
  return `<div class="card collect-box"><div class="cl-head">✦ Колекційний · ${set.emoji} ${esc(set.name)} <span class="muted">${mine}/${total}</span></div>
    <div class="small">${esc(c.desc)}</div>
    <div class="small muted mt">Складність отримання: ${"★".repeat(c.hard)}${"☆".repeat(5 - c.hard)} · ${p.from === "tour" ? "приз турніру" : "подарунок адміністратора"}</div>
    <div class="small muted">Єдиний у світі. Не голодує, не помирає. Можна віддати в обміні — разом із ним піде й його набір.</div>
    ${collKitHtml(c.key)}${(() => { const set = Pets.COLLECT.filter((x) => x.set === c.set).every((x) => (Api.state.pets || []).some((q) => q.alive && q.collect === x.key)); return set ? collKitHtml("set_" + c.set) : ""; })()}
    <div class="small mt">🎖 ${esc(set.bonus)}</div></div>`;
}
// рост
function petGrowLine(p) {
  const st = petStage(p);
  if (!st) return "";
  const left = p.grown - petNow();
  return `<div class="pstat grow-line"><span>${Pets.STAGES[st].emoji} ${Pets.STAGES[st].name} · виросте через ${petTime(left)}</span><b>${st === "b" ? "1/3" : "2/3"}</b></div>
    <div class="small muted">${esc(Pets.STAGES[st].care)}. Кожне годування пришвидшує ріст на 2 години, пляшечка росту 🍼 — на 6 годин</div>`;
}
// домик, мутагены, мини-игры
function petCareBlock(p, t) {
  const mgs = (Api.state.inv || []).filter((x) => x.startsWith("mg:")).length;
  return `<div class="section-title">Догляд</div><div class="card">
    <div class="row case-btns"><button class="btn small" data-a="pet-fun" ${p.den ? "disabled" : ""}>🎮 Міні-ігри</button>
      <button class="btn ghost small" data-a="pet-den" data-v="${p.den ? 0 : 1}">${p.den ? "☀️ Розбудити" : "🏠 У будиночок"}</button>
      ${p.receptive ? `<button class="btn ghost small" data-a="pet-mg-open">💉 Мутаген ${(p.mg || []).length}/2</button>` : ""}</div>
    <div class="small muted mt">${p.den ? "Спить у будиночку: голодує вчетверо повільніше, настрій не псується. Але не грається й не б’ється." : `Будиночок — для тих, кого зараз ніколи годувати: там голодує вчетверо повільніше, але не грається й не б’ється. Кімнат: ${(Api.state.den || {}).used || 0} з ${(Api.state.den || {}).rooms || 0} — їх більше, коли більше улюбленців (10 улюбленців — 4 кімнати).`}</div>
    <div class="small muted">🎮 Хоче гратися ${((n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "раз" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? "рази" : "разів"}`)(Pets.funWant(p.dna, petStage(p)))} на день${p.fun ? ` · сьогодні вже ${p.fun}` : ""}${t.social === 0 ? " — любить тишу, не клич надто часто" : t.social === 2 ? " — обожнює увагу" : ""}</div>
    ${p.receptive ? `<div class="small mt">🧬 Приймає мутагени: можна вколоти ще ${2 - (p.mg || []).length}${mgs ? ` · у тебе шприців: ${mgs}` : " · шприців поки немає (турніри й рідко — «Розплідник»)"}</div>` : ""}
    ${(p.mg || []).length ? `<div class="small muted">💉 Уколото: ${p.mg.map((k) => { const it = Shop.byKey(k); return it ? "«" + esc(it.name) + "»" : ""; }).join(", ")}</div>` : ""}</div>`;
}
// выбор мутагена
function petMgSheet() {
  const p = Api.state && Api.state.pets.find((x) => x.id === S.petSel);
  if (!p) return "";
  const list = (Api.state.inv || []).filter((x) => x.startsWith("mg:")).map((k) => Shop.byKey(k)).filter(Boolean);
  const used = (p.mg || []).length;
  return `<h2>💉 Мутагени</h2><p class="muted small">Укол змінює вигляд назавжди. Не більше двох на улюбленця (уколото ${used}/2). Мутація тієї самої групи замінить стару.</p>
    ${!p.receptive ? `<div class="card">Цей улюбленець не приймає мутагени — у нього немає значка 🧬</div>` : used >= 2 ? `<div class="card">Уже вколото два мутагени — більше не можна</div>`
      : list.length ? `<div class="mg-list">${list.map((it) => { const m = Pets.MUTATIONS.find((x) => x.key === it.mg);
        return `<button class="card mg-row" data-a="pet-mg-inject" data-v="mg:${it.id}">${Pets.syringe(40)}<div class="grow"><b>«${esc(it.name)}»</b><div class="small">${m.emoji} ${esc(m.name)}</div><div class="small muted">${esc(m.desc)}</div></div><span class="muted">›</span></button>`; }).join("")}</div>`
      : `<div class="card muted small">Шприців немає. Їх дають за турніри, а в кейсі «Розплідник» — шанс 0,01%.</div>`}`;
}

// бой: характеристики, энергия, победы
function petBattleCard(p, t) {
  const s0 = Pets.stats(p.dna, p.rarity), gm = Pets.STAGES[petStage(p)].mul, s = gm === 1 ? s0 : { hp: Math.round(s0.hp * gm), atk: Math.round(s0.atk * gm), def: Math.round(s0.def * gm), spd: s0.spd }, sk = Pets.skills(p.dna), buff = { atk: "🍫 +15% атаки", def: "🥫 +4 захисту", spd: "🌶️ +4 швидкості" }[p.buff];
  return `<div class="section-title">Бій</div><div class="card">
    <div class="bstats"><span>❤️ <b>${s.hp}</b></span><span>⚔️ <b>${s.atk}</b></span><span>🛡 <b>${s.def}</b></span><span>💨 <b>${s.spd}</b></span></div>
    ${gm < 1 ? `<div class="small muted mt">${Pets.STAGES[petStage(p)].emoji} Поки ${Pets.STAGES[petStage(p)].name.toLowerCase()} — сила ${Math.round(gm * 100)}%. Виросте — стане сильнішим.</div>` : ""}
    <div class="pstat mt"><span>⚡ Енергія</span><b>${p.energy}%</b></div>${bar(p.energy, "energy")}
    <div class="small muted mt">🏆 Перемог: ${p.wins} · поразок: ${p.losses}${p.streak > 1 ? ` · ${p.streak} поспіль` : ""}${buff ? ` · посилення: ${buff}` : ""}</div>
    ${sk.length ? `<div class="small mt">${sk.map((x) => `${x.emoji} ${esc(x.text)}`).join(" · ")}</div>` : ""}
    <button class="btn mt" data-a="battle-new" data-v="${p.id}">⚔️ Викликати на бій</button>
    <div class="small muted mt">Посилання на бій надішли другові — він обере свого бійця. У боях улюбленці не помирають.</div></div>`;
}

// мутации: облик поверх генов
function petMutBlock(t, short) {
  if (!t.muts.length) return "";
  const head = t.muts.length > 1 ? `🧬 ${t.muts.length} мутації` : "🧬 Мутація";
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
    saveProfile(); syncProfile(); toast("👑 Набір Творця вдягнуто");
  }
  if (st && Array.isArray(st.inv) && st.inv.includes("pic:creator") && !store.creatorPic) {   // аватарка Творца — сразу на админе
    store.creatorPic = true; store.look = store.look || {}; store.look.pic = "creator"; saveProfile(); syncProfile();
  }
  if (st && Array.isArray(st.inv) && store.look) {                // вещи коллекционера ушли вместе с питомцем — снимаем
    let ch = false;
    for (const [cat, id] of Object.entries(store.look)) { const it = Shop.byId(cat, id); if (it && it.coll && !st.inv.includes(cat + ":" + id)) { store.look[cat] = Shop.DEFAULT[cat]; ch = true; } }
    const bAva = store.badge && Shop.ITEMS.find((x) => x.cat === "ava" && x.coll && x.emoji === store.badge);
    if (bAva && !st.inv.includes("ava:" + bAva.id)) { store.badge = ""; ch = true; }
    // новий колекційний (чи вся колекція) — його набір одразу вдягаємо, один раз на кожен набір
    const kits = st.inv.filter((k) => /^pic:c_/.test(k)).map((k) => k.slice(6));
    const seen = (Array.isArray(store.collKits) ? store.collKits : []).filter((k) => kits.includes(k)), fresh = kits.filter((k) => !seen.includes(k));
    store.collKits = seen.concat(fresh);
    if (fresh.length) { const pick = fresh.find((k) => k.startsWith("set_")) || fresh[fresh.length - 1]; const it = collWear(pick, true); ch = false; toast("🐉 Тобі дістався набір «" + (it ? it.name : pick) + "» — уже вдягнуто"); }
    if (ch) { saveProfile(); syncProfile(); }
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
const leagueCard = () => (Api.on ? `<button class="card league-card" data-a="go" data-v="league"><span class="lg-ico">🏆</span><div class="grow"><b>Ліга тижня</b>
  <div class="small muted">${S.league && S.league.me ? `Ти на ${S.league.me.rank}-му місці · ${S.league.me.pts} очок` : "Бої з іншими гравцями — очки, наприкінці тижня призи топ-10"}</div></div><span class="muted">›</span></button>` : "");
function leagueLoad(force) {
  if (!Api.on || !Api.ready || S.leagueBusy || (!force && S.leagueAt && Date.now() - S.leagueAt < 30000)) return;
  S.leagueBusy = true;
  Api.call("/api/league", {}).then((r) => { S.league = r.league; S.leagueAt = Date.now(); }).catch(() => {}).finally(() => { S.leagueBusy = false; if (["league", "pets"].includes(S.screen)) render(); });
}
function fmtLeft2(sec) { const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600), m = Math.floor((sec % 3600) / 60); return d ? `${d} дн ${h} год` : h ? `${h} год ${m} хв` : `${m} хв`; }
function viewLeague() {
  leagueLoad();
  const L = S.league, medal = (n) => (n === 1 ? "🥇" : n === 2 ? "🥈" : n === 3 ? "🥉" : n);
  const row = (r) => `<div class="lg-row ${r.uid === Number(S.me.slice(2)) ? "me" : ""}"><span class="lg-rank">${medal(r.rank)}</span><span class="lg-pet">${r.pet ? Pets.sprite(r.pet, 36) : "🐾"}</span>
    <div class="grow"><b>${esc(r.name)}</b><div class="small muted">${r.wins} перемог із ${r.games}</div></div><b class="lg-pts">${r.pts}</b></div>`;
  return `<div class="fade-in"><div class="top"><button class="avatar" data-a="tab" data-v="pets">←</button><div class="grow"><h1>Ліга тижня</h1>
      <div class="muted small">${L ? `До кінця тижня: ${fmtLeft2(Math.max(0, L.ends - Math.floor(Date.now() / 1000)))}` : "Завантажую…"}</div></div>${coinPill()}</div>
    ${L && L.me ? `<div class="card lg-mine"><div class="lg-big">${medal(L.me.rank)}</div><div class="grow"><b>Твоє місце: ${L.me.rank}</b><div class="small">${L.me.pts} очок · ${L.me.wins} перемог із ${L.me.games} боїв</div></div></div>`
      : `<div class="card small">Ти ще не бився цього тижня. Виклич друга на бій у картці улюбленця — кожна перемога +3 очки, поразка +1.</div>`}
    ${L ? `<div class="section-title">Призи</div><div class="card lg-prizes">${L.prizes.map((p) => `<div class="lg-prize"><b>${p.place === "1" ? "🥇" : p.place === "2" ? "🥈" : p.place === "3" ? "🥉" : "🏅 " + p.place}</b><span>${esc(p.text)}</span></div>`).join("")}</div>
    <div class="section-title">Таблиця</div>
    <div class="card lg-table">${L.top.length ? L.top.map(row).join("") : `<div class="muted small center">Поки ніхто не бився — будь першим!</div>`}</div>
    ${L.last && L.last.length ? `<div class="section-title">Минулий тиждень</div><div class="card lg-table">${L.last.map(row).join("")}</div>` : ""}
    <div class="small muted mt">Очки — лише за бої з іншими гравцями: перемога +3, поразка +1. З тим самим суперником за тиждень рахуються перші ${L.pairCap} боїв. Тиждень — з понеділка, призи приходять самі.</div>`
      : `<div class="card center"><div class="spinner" style="margin:10px auto"></div></div>`}
  </div>${tabs()}`;
}

// окно «Тебе подарили»: что пришло и куда посмотреть
const GIFT_ICO = { coins: "🪙", egg: "🥚", food: "🍖", case: "🎁", mg: "💉", pet: "🐉" }, GIFT_SRC = { admin: "від адміністратора", tour: "приз за турнір", gw: "з роздачі", ref: "за запрошеного друга", league: "приз ліги тижня", pass: "сезонна перепустка", welcome: "подарунок новачкові" };
function giftsSheet() {
  const list = (S.sheet && S.sheet.list) || [], first = list[0] || {};
  const go = { mg: "gift-go:mg", pet: "gift-go:pets", egg: "gift-go:pets", food: "gift-go:pets", case: "gift-go:cases", coins: "" }[first.kind] || "";
  return `<div class="gift-pop"><div class="gp-box">🎁</div><h2>Тобі подарували!</h2>
    <div class="gp-list">${list.map((g) => `<div class="gp-row"><span class="gp-i">${GIFT_ICO[g.kind] || "🎁"}</span><div class="grow"><b>${esc(g.text)}</b><div class="small muted">${GIFT_SRC[g.src] || ""} · ${petAgo(g.ts)}</div></div></div>`).join("")}</div>
    ${go ? `<button class="btn mt" data-a="gift-go" data-v="${go.split(":")[1]}">👀 Подивитися</button>` : ""}</div>`;
}

let petRefreshing = false, petActSlot = 0;
setInterval(() => {
  if (S.screen !== "pets") return;
  const t = petNow();
  const slot = Math.floor(t / ACT_SLOT), busy = document.activeElement && document.activeElement.tagName === "INPUT";
  if (slot !== petActSlot) { const first = !petActSlot; petActSlot = slot; if (!first && !S.care && !S.sheet && !busy && (S.petTab || "list") === "list") render(); }   // питомцы сменили занятие
  document.querySelectorAll("[data-until]").forEach((el) => {
    const left = Number(el.dataset.until) - t;
    el.textContent = left > 0 ? (el.dataset.egg && el.classList.contains("small") ? "через " : "") + petTime(left) : el.dataset.egg ? "вилуплюється!" : "0 с";
    if (left <= 0 && el.dataset.egg && !petRefreshing) { petRefreshing = true; Api.refresh().catch(() => {}).then(() => { petRefreshing = false; }); }
  });
}, 1000);

const petErr = (e) => { notify("error"); toast(e.message || "Помилка"); };
const PET_ACTIONS = {
  "pets-sel": (v) => { S.petSel = Number(v); haptic(); render(); window.scrollTo(0, 0); },
  "pets-tab": (v) => { S.petTab = v; S.petSel = null; S.care = null; haptic(); render(); window.scrollTo(0, 0); if (v === "battle") battleLoadList(); if (v === "trade") tradeLoadList(); },
  "food-cat": (v) => { S.shopFood = v; haptic(); render(); },
  "food-buy5": (item) => Api.act("/api/food/buy", { item, qty: 5 }).then(() => { haptic("medium"); toast(`Куплено: ${petFood(item).name} ×5`); }).catch(petErr),
  "pets-back": () => { S.petSel = null; render(); },
  "coll-wear": (v) => { collWear(String(v)); render(); },
  "pets-grave": () => { S.petGrave = !S.petGrave; render(); },
  "pet-pet": () => {
    haptic();
    const p = Api.state.pets.find((x) => x.id === S.petSel), q = p ? Pets.traits(p.dna).quirkIdx : -1;
    Api.act("/api/pet/pet", { pet: S.petSel }).then((st) => {
      const r = st.reaction;
      if (r === "asleep") { petFx("💤"); return toast("Тсс… він спить"); }
      petJump(r === "annoyed" ? "act-shake" : "act-hop");
      if (r === "annoyed" && q === 5) { petFx("💢"); return toast("Тільки не вуха!"); }
      petFx(r === "annoyed" ? "💢" : r === "happy" ? (q === 0 ? "🤧" : "❤") : "✨");
      if (r === "happy" && q === 0) petSay("апчхи! 🤧");
      else if (q === 4 && r !== "annoyed") petSay("пузико! ще!");
      if (r === "annoyed") toast(q === 5 ? "Тільки не вуха!" : "Йому не подобається, коли тискають так часто");
    }).catch(petErr);
  },
  "pet-feed": (item) => {
    const p = Api.state.pets.find((x) => x.id === S.petSel);
    if (!p) return;
    const t = Pets.traits(p.dna);
    Api.act("/api/pet/feed", { pet: p.id, item }).then((st) => {
      const k = petKnow(p.id);
      if (st.reaction === "fav") { k.fav = 1; saveProfile(); notify("success"); toast(`${t.name} обожнює це! ❤`); }
      else if (st.reaction === "dis") { k.dis = 1; saveProfile(); toast(`${t.name} кривиться… з’їв, але без радості`); }
      else { haptic("medium"); toast("Ням!"); }
      setTimeout(() => { petFx(st.reaction === "dis" ? "🤢" : st.reaction === "fav" ? "😍" : "🍖"); petJump("act-chew"); if (t.quirkIdx === 10) setTimeout(() => petSay("ік!"), 900); }, 60);
    }).catch(petErr);
  },
  "pet-den": (v) => Api.act("/api/pet/den", { pet: S.petSel, on: v === "1" }).then(() => { haptic("medium"); toast(v === "1" ? "🏠 Спить у будиночку" : "☀️ Прокинувся!"); }).catch(petErr),
  "pet-mg-open": () => { S.sheet = { type: "pet-mg" }; renderOverlay(); },
  "pet-mg-inject": (k) => {
    const go = () => Api.act("/api/pet/inject", { pet: S.petSel, item: k }).then((st) => {
      S.sheet = null; renderOverlay(); notify("success"); coinRain();
      toast(`💉 Мутація: ${st.inject.name}${st.inject.replaced.length ? " (замінила попередню)" : ""}`); setTimeout(() => petFx("🧬"), 80);
    }).catch(petErr);
    const q = "Вколоти мутаген? Це назавжди.";
    if (tg) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "pet-fun": () => { S.funPet = S.petSel; S.fun = null; S.funFrom = "pets"; S.screen = "petfun"; render(); window.scrollTo(0, 0); },
  "food-buy10": (item) => Api.act("/api/food/buy", { item, qty: 10 }).then(() => { haptic("medium"); toast(`Куплено гуртом: ${petFood(item).name} ×10 (−20%)`); }).catch(petErr),
  "pet-main": () => Api.act("/api/pet/main", { pet: S.petSel }).then(() => { syncProfile(); toast("Тепер він у твоєму профілі ★"); }).catch(petErr),
  "food-buy": (item) => Api.act("/api/food/buy", { item, qty: 1 }).then(() => { haptic("medium"); toast(`Куплено: ${petFood(item).name}`); }).catch(petErr),
  promo: () => {
    const el = document.getElementById("promo-code"), code = el ? el.value.trim() : "";
    if (!code) return toast("Введи промокод");
    el.blur();
    Api.act("/api/promo", { code }).then((st) => { notify("success"); toast("🎉 Отримано: " + st.got); coinRain(); }).catch(petErr);
  },
};
