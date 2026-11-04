/* Кормушки: у каждой — своя пиксельная картинка. Карточка на экране питомцев, выбор и включение (с подтверждением),
   раздел в лавке и покупка за звёзды Telegram. Логика кормления — на сервере (server/worker.js → feederRun). */
"use strict";
const FEEDER_ORDER = ["wood", "copper", "gold", "pass"];
const FEEDER_INFO = {
  wood: { name: "Деревянная кормушка", dur: "1 день", how: "в лавке за 200 🪙", tier: 0 },
  copper: { name: "Медная кормушка", dur: "7 дней", how: "за 49 ⭐", tier: 1 },
  gold: { name: "Золотая кормушка", dur: "30 дней", how: "за 149 ⭐", tier: 3 },
  pass: { name: "Сезонная кормушка", dur: "7 дней", how: "из премиум-пропуска", tier: 2 },
};
const feederArtCache = {};
// рисунок 32×32: подставка, миска с кормом, бункер; у каждой кормушки — свои материалы и украшения
function feederUrl(kind) {
  if (feederArtCache[kind]) return feederArtCache[kind];
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const x = c.getContext("2d"), R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, P = (a, b, col) => R(a, b, 1, 1, col);
  const kibble = (y0, cols) => { for (let i = 0; i < 18; i++) P(8 + ((i * 7) % 16), y0 + ((i * 3) % 3), cols[i % cols.length]); };
  if (kind === "wood") {                                   // деревянное корытце на ножках, доски с прожилками, горка корма
    R(7, 26, 3, 5, "#5a3414"); R(22, 26, 3, 5, "#5a3414");
    R(4, 18, 24, 9, "#2a1408"); R(5, 19, 22, 7, "#a8642a"); R(5, 19, 22, 2, "#c88444");
    for (let i = 0; i < 4; i++) R(6 + i * 6, 21, 1, 5, "#7a4418");
    R(5, 23, 22, 1, "#8a5020"); kibble(16, ["#c8803a", "#e0a050", "#8a4a18"]); R(9, 15, 14, 2, "#d89048"); R(12, 13, 8, 2, "#c8803a");
    R(3, 17, 26, 2, "#3a1a08"); R(3, 17, 26, 1, "#c88444");
  } else if (kind === "copper") {                          // медная миска на стойке, бункер с окошком, заклёпки
    R(10, 3, 12, 14, "#4a1e08"); R(11, 4, 10, 12, "#c86a2a"); R(11, 4, 3, 12, "#e8945a"); R(19, 4, 2, 12, "#8a3a10");
    R(13, 6, 6, 7, "#2a1206"); R(14, 7, 4, 5, "#e0a050"); P(15, 8, "#ffd090"); P(16, 10, "#a85a20");
    [[12, 5], [19, 5], [12, 14], [19, 14]].forEach(([a, b]) => P(a, b, "#ffd0a0"));
    R(14, 17, 4, 4, "#8a3a10"); R(15, 17, 2, 4, "#c86a2a");
    R(4, 21, 24, 6, "#4a1e08"); R(5, 22, 22, 4, "#c86a2a"); R(5, 22, 22, 1, "#f0a870"); R(6, 25, 20, 1, "#8a3a10");
    kibble(19, ["#e0a050", "#c8803a", "#ffd090"]); R(8, 27, 16, 2, "#3a1606"); R(10, 29, 12, 2, "#6a2a0c");
  } else if (kind === "gold") {                            // золотой автомат: стеклянный бункер, рубин и сапфир, сияние
    R(9, 1, 14, 17, "#5a3a00"); R(10, 2, 12, 15, "#ffd23f"); R(10, 2, 3, 15, "#fff0a0"); R(20, 2, 2, 15, "#c8900a");
    R(12, 4, 8, 9, "#2a1a00"); R(13, 5, 6, 7, "#bfe8ff"); R(13, 9, 6, 3, "#e0a050"); P(14, 6, "#ffffff"); P(15, 7, "#ffffff");
    R(15, 14, 2, 2, "#ff2a4a"); P(15, 14, "#ffb0c0"); R(11, 14, 2, 2, "#3ec8ff"); R(19, 14, 2, 2, "#3ec8ff");
    R(14, 18, 4, 3, "#c8900a");
    R(3, 21, 26, 6, "#5a3a00"); R(4, 22, 24, 4, "#ffd23f"); R(4, 22, 24, 1, "#fff6c0"); R(5, 25, 22, 1, "#c8900a");
    kibble(19, ["#e0a050", "#ffd090", "#c8803a"]); R(7, 27, 18, 2, "#3a2600"); R(9, 29, 14, 2, "#8a6000");
    [[3, 4], [27, 8], [26, 18], [5, 14]].forEach(([a, b], i) => { P(a, b, "#ffffff"); if (i % 2) { P(a - 1, b, "#fff0a0"); P(a + 1, b, "#fff0a0"); P(a, b - 1, "#fff0a0"); P(a, b + 1, "#fff0a0"); } });
  } else {                                                 // сезонная: кристалл, фиолетовое основание, звезда
    for (let y = 0; y < 16; y++) { const w = y < 8 ? 2 + y : 2 + (15 - y) * .9; R(16 - w, 1 + y, w * 2, 1, y < 2 ? "#e8f8ff" : y < 9 ? "#8ad8ff" : "#4a8ad8"); }
    R(13, 4, 2, 8, "#ffffff"); R(18, 6, 1, 6, "#c8f0ff"); R(15, 7, 3, 3, "#e0a050");
    P(16, 1, "#ffffff"); P(15, 0, "#ffe066"); P(17, 0, "#ffe066");
    R(4, 20, 24, 7, "#2a0a4a"); R(5, 21, 22, 5, "#8a3ae8"); R(5, 21, 22, 1, "#c89aff"); R(6, 25, 20, 1, "#5a1a9a");
    kibble(18, ["#e0a050", "#ffd090", "#8ad8ff"]); R(8, 27, 16, 2, "#1a0630"); R(10, 29, 12, 2, "#4a1a7a");
    R(14, 22, 4, 3, "#ffe066"); P(13, 23, "#ffe066"); P(18, 23, "#ffe066"); P(15, 21, "#ffe066"); P(16, 21, "#ffe066");
  }
  return (feederArtCache[kind] = c.toDataURL());
}
function feederArt(kind, px = 56, on = false) {
  return `<span class="fdr-art k-${kind} ${on ? "on" : ""}" style="width:${px}px;height:${px}px"><img src="${feederUrl(kind)}" alt=""><i></i><i></i><i></i></span>`;
}
const feederLeft = (sec) => (sec >= 86400 ? `${Math.floor(sec / 86400)} д ${Math.floor((sec % 86400) / 3600)} ч` : sec >= 3600 ? `${Math.floor(sec / 3600)} ч ${Math.floor((sec % 3600) / 60)} мин` : `${Math.max(1, Math.floor(sec / 60))} мин`);
const feederHave = (fd) => FEEDER_ORDER.reduce((a, k) => a + ((fd && fd.have && fd.have[k]) || 0), 0);

// карточка на экране «Мои питомцы»
function feederCard() {
  const fd = Api.state && Api.state.feeder; if (!fd) return "";
  const have = feederHave(fd), best = FEEDER_ORDER.slice().reverse().find((k) => fd.have[k] > 0) || "wood";
  if (fd.active) {
    const left = fd.until - Math.floor(Date.now() / 1000), k = FEEDER_INFO[fd.kind] ? fd.kind : "wood";
    return `<button class="card fdr-card on" data-a="feeder-open">${feederArt(k, 58, true)}<div class="grow"><b>🪣 Кормушка работает</b>
      <div class="small">${esc(FEEDER_INFO[k].name)} · ещё ${feederLeft(left)}</div><div class="small muted">Кормит сама, когда сытость ниже 40%${have ? ` · в запасе ещё ${have}` : ""}</div></div><span class="pill on">ВКЛ</span></button>`;
  }
  return `<button class="card fdr-card" data-a="feeder-open">${feederArt(best, 58)}<div class="grow"><b>🪣 Кормушка</b>
    <div class="small muted">${have ? `В запасе: ${have}. Включи — и она сама будет кормить питомцев, даже когда тебя нет` : "Сама кормит питомцев, пока тебя нет в игре. Есть в лавке"}</div></div>
    <span class="pill">${have ? "Включить" : "В лавку"}</span></button>`;
}
// окно выбора: все кормушки с количеством; включить — с подтверждением
function feederSheet() {
  const fd = Api.state && Api.state.feeder; if (!fd) return "";
  const now = Math.floor(Date.now() / 1000);
  return `<h2>🪣 Кормушки</h2><div class="small muted mt">Кормит всех питомцев едой из кладовки, когда сытость ниже 40%. Знает любимую еду — даёт её, иначе любую, кроме нелюбимой. Спящих не будит.</div>
    ${fd.active ? `<div class="card fdr-now mt">${feederArt(fd.kind || "wood", 40, true)}<div class="grow small">Работает ещё <b>${feederLeft(fd.until - now)}</b>. Новая кормушка добавит своё время.</div></div>` : ""}
    <div class="fdr-list mt">${FEEDER_ORDER.map((k) => { const n = fd.have[k] || 0, I = FEEDER_INFO[k];
      return `<div class="fdr-row t${I.tier} ${n ? "" : "none"}">${feederArt(k, 52, false)}<div class="grow"><b>${esc(I.name)}</b><div class="small muted">${I.dur} · ${n ? `у тебя ${n}` : esc(I.how)}</div></div>
        ${n ? `<button class="btn small" data-a="feeder-use" data-v="${k}">Включить</button>` : k === "wood" ? `<button class="btn ghost small" data-a="feeder-shop">В лавку</button>` : k === "pass" ? "" : `<button class="btn ghost small" data-a="stars-buy" data-v="${k === "copper" ? "feeder_week" : "feeder_month"}">${k === "copper" ? "49" : "149"} ⭐</button>`}</div>`; }).join("")}</div>`;
}
// раздел лавки
function feederShop() {
  const fd = Api.state && Api.state.feeder; if (!fd) return "";
  const price = (fd.kinds && fd.kinds.wood && fd.kinds.wood.price) || 200;
  return `<div class="section-title">🪣 Кормушки</div><div class="fdr-shop">
    <div class="fdr-row t0">${feederArt("wood", 52)}<div class="grow"><b>Деревянная</b><div class="small muted">1 день сама кормит${fd.have.wood ? ` · есть ${fd.have.wood}` : ""}</div></div>
      <button class="btn small" data-a="feeder-buy" ${S.profile.coins < price ? "disabled" : ""}>🪙 ${price}</button></div>
    <div class="fdr-row t1">${feederArt("copper", 52)}<div class="grow"><b>Медная</b><div class="small muted">7 дней${fd.have.copper ? ` · есть ${fd.have.copper}` : ""}</div></div>
      <button class="btn small star" data-a="stars-buy" data-v="feeder_week">49 ⭐</button></div>
    <div class="fdr-row t3">${feederArt("gold", 52)}<div class="grow"><b>Золотая</b><div class="small muted">30 дней${fd.have.gold ? ` · есть ${fd.have.gold}` : ""}</div></div>
      <button class="btn small star" data-a="stars-buy" data-v="feeder_month">149 ⭐</button></div></div>
    <div class="small muted mt">Купленная кормушка лежит в запасе, пока ты её не включишь — кнопка «🪣 Кормушка» на вкладке «Мои».</div>`;
}
// оплата звёздами: счёт открывается прямо в Telegram, товар выдаёт сервер после оплаты
function starsBuy(what) {
  return Api.call("/api/stars/invoice", { what }).then((r) => {
    const tg = window.Telegram && window.Telegram.WebApp;
    const done = (status) => {
      if (status === "paid") { notify("success"); haptic("heavy"); toast("⭐ Оплачено! Сейчас всё появится"); setTimeout(() => Api.refresh().then(render).catch(() => {}), 1500); setTimeout(() => Api.refresh().then(render).catch(() => {}), 5000); }
      else if (status === "failed") toast("Оплата не прошла");
    };
    if (tg && tg.openInvoice) tg.openInvoice(r.link, done); else window.open(r.link, "_blank");
  }).catch((e) => toast(e.message));
}
const FEEDER_ACTIONS = {
  "feeder-open": () => { const fd = Api.state && Api.state.feeder; if (fd && !fd.active && !feederHave(fd)) { S.petTab = "shop"; S.petSel = null; render(); window.scrollTo(0, 0); return; } S.sheet = { type: "feeder" }; haptic(); renderOverlay(); },
  "feeder-shop": () => { S.sheet = null; renderOverlay(); S.screen = "pets"; S.petTab = "shop"; S.petSel = null; render(); window.scrollTo(0, 0); },
  "feeder-buy": () => Api.act("/api/feeder/buy", { qty: 1 }).then(() => { haptic("medium"); toast("🪣 Деревянная кормушка — в запасе"); render(); }).catch((e) => toast(e.message)),
  "feeder-use": (k) => {
    const fd = Api.state.feeder, I = FEEDER_INFO[k], tg = window.Telegram && window.Telegram.WebApp;
    const list = FEEDER_ORDER.filter((x) => fd.have[x]).map((x) => `${FEEDER_INFO[x].name.split(" ")[0].toLowerCase()}: ${fd.have[x]}`).join(", ");
    const q = `Включить «${I.name}» на ${I.dur}?\nУ тебя: ${list}.${fd.active ? "\nКормушка уже работает — время добавится." : ""}`;
    const go = () => Api.act("/api/feeder/use", { kind: k }).then((st) => { notify("success"); haptic("heavy"); S.sheet = null; renderOverlay();
      toast(`🪣 Кормушка работает до ${new Date(st.feeder.until * 1000).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`); render(); }).catch((e) => toast(e.message));
    if (tg && tg.showConfirm) tg.showConfirm(q, (ok) => ok && go()); else if (confirm(q)) go();
  },
  "stars-buy": (what) => starsBuy(what),
};
