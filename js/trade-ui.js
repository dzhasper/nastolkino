/* Обмен по ссылке: каждый кладёт питомцев, вещи, еду, кейсы. Оба жмут «Готово» — обмен проходит.
   Одна сторона пустая — это подарок. Любое изменение снимает «Готово» у обоих (сервер: /api/trade/*). */
"use strict";

function tradeLoadList() {
  if (!Api.on || !Api.ready) return;
  Api.call("/api/trade/list", {}).then((r) => { S.tradeList = r.trades; if (S.screen === "pets" && S.petTab === "trade" && !S.tradeCode) render(); }).catch(() => {});
}
function tradeOpen(code) {
  S.screen = "pets"; S.petTab = "trade"; S.petSel = null; S.tradeCode = String(code).toUpperCase(); S.trade = null;
  render();
  if (!Api.on) return;
  Api.call("/api/trade/get", { code: S.tradeCode }).then((r) => { S.trade = r.trade; render(); })
    .catch((e) => { toast(e.message); S.tradeCode = null; render(); });
}

const offerEmpty = (o) => !o || (!o.pets.length && !o.items.length && !Object.keys(o.food).length && !Object.keys(o.cases).length);
function offerChips(o) {
  if (offerEmpty(o)) return `<div class="muted small">Поки нічого</div>`;
  const chips = [];
  o.pets.forEach((p) => chips.push(`<span class="tchip pet">${p.egg ? Pets.sprite(petCode(p), 36, { egg: true }) : Pets.sprite(petCode(p), 36)}${p.egg ? "Яйце" : esc(Pets.name(p.dna))}
    <i class="rar r${p.rarity}">${p.egg ? "?" : Pets.RARITY[p.rarity].name}</i></span>`));
  o.items.forEach((k) => { const it = Shop.byKey(k); if (it) chips.push(`<span class="tchip item" style="--tc:${Shop.TIERS[Shop.tier(it)].color}"><span class="ti-prev">${shopPreview(it)}</span>${esc(it.name)}</span>`); });
  Object.entries(o.food).forEach(([k, n]) => chips.push(`<span class="tchip">${Pets.FOOD_EMOJI[k] || "🍽"} ${esc(petFood(k).name)} ×${n}</span>`));
  Object.entries(o.cases).forEach(([k, n]) => { const c = Shop.caseByKey(k); chips.push(`<span class="tchip">${caseImg(k, 28)} ${esc(c ? c.name : k)} ×${n}</span>`); });
  return `<div class="tchips">${chips.join("")}</div>`;
}

function viewTradeTab() {
  if (S.tradeCode) return tradeScreen();
  const list = S.tradeList;
  return `<div class="card small mt">🔄 Створи обмін і надішли посилання. Кожен кладе, що віддає: улюбленців, яйця, речі, їжу, кейси.
      Коли обидва натиснуть «Готово» — усе поміняється місцями. Якщо друга сторона нічого не кладе — це подарунок. Монети не передаються.</div>
    <button class="btn mt" data-a="trade-new">🔄 Створити обмін</button>
    <div class="section-title">Відкриті обміни</div>
    ${!list ? `<div class="muted small">Завантажую…</div>` : list.length ? `<div class="blist">${list.map((t) => `<button class="card brow" data-a="trade-open" data-v="${t.code}">
      <div class="grow"><b>Обмін ${t.code}</b><div class="small muted">${t.partner ? "з " + esc(t.partner) : "чекаємо другого гравця"}</div></div><span class="muted">›</span></button>`).join("")}</div>`
      : `<div class="muted small">Немає відкритих обмінів</div>`}`;
}

function tradeScreen() {
  const t = S.trade, back = `<button class="btn ghost small" data-a="trade-back">← Обміни</button>`;
  if (!Api.on) return `${back}<div class="card mt">Обмін працює через сервер — відкрий Настолкіно з бота.</div>`;
  if (!t) return `${back}<div class="card center mt"><div class="spinner" style="margin:10px auto"></div></div>`;
  if (t.status === "done") return `${back}<div class="card center mt"><div class="display">✅ Обмін завершено</div></div>
    <div class="section-title">Ти отримав</div><div class="card">${offerChips(t.them)}</div><div class="section-title">Ти віддав</div><div class="card">${offerChips(t.me)}</div>`;
  if (t.status !== "open") return `${back}<div class="card center mt">${t.status === "cancel" ? "Обмін скасовано" : "⌛ Термін обміну минув"}</div>`;
  const gift = !offerEmpty(t.me) && offerEmpty(t.them) ? "Ти нічого не отримуєш — це подарунок 🎁" : offerEmpty(t.me) && !offerEmpty(t.them) ? "Тобі дарують 🎁" : "";
  return `${back}
    <div class="card trade-head"><div class="grow"><b>Обмін ${t.code}</b><div class="small muted">${t.partner ? "з " + esc(t.partner) : "чекаємо другого гравця — надішли йому посилання"}</div></div>
      <button class="btn small" data-a="trade-share">📨 Посилання</button></div>
    ${!t.partner && t.side === "a" && t.status === "open" && Api.state && Api.state.group ? `<button class="btn ghost small wide mt" data-a="trade-group" ${(S.tradeGroup || {})[t.code] ? "disabled" : ""}>${(S.tradeGroup || {})[t.code] ? "📢 Обмін уже в групі" : `📢 Закинути обмін у групу ${esc(Api.state.group.title)}`}</button>` : ""}
    <div class="section-title">Ти віддаєш ${t.my_ready ? "· ✅ готовий" : ""}</div>
    <div class="card tbox">${offerChips(t.me)}<button class="btn ghost small mt" data-a="trade-pick">＋ Обрати, що віддати</button></div>
    <div class="section-title">Ти отримуєш ${t.their_ready ? "· ✅ готовий" : ""}</div>
    <div class="card tbox">${offerChips(t.them)}</div>
    ${gift ? `<div class="small center mt">${gift}</div>` : ""}
    <button class="btn mt2 ${t.my_ready ? "ghost" : ""}" data-a="trade-ready" ${t.waiting || (offerEmpty(t.me) && offerEmpty(t.them)) ? "disabled" : ""}>${t.my_ready ? "Скасувати готовність" : "✅ Готово"}</button>
    <div class="small muted center mt">${t.waiting ? "Другий гравець ще не відкрив посилання" : t.my_ready && !t.their_ready ? "Чекаємо, поки другий натисне «Готово»" : "Якщо хтось щось змінить — «Готово» зніметься в обох"}</div>
    <button class="btn ghost small mt" data-a="trade-cancel">Скасувати обмін</button>`;
}

/* ---------------------------------------------------------------- выбор, что отдать */
function tradePickSheet() {
  const st = Api.state, pk = S.pick;
  if (!st || !pk) return "";
  const pets = st.pets.filter((p) => p.alive && !p.collect), food = st.food || {}, cases = st.cases || {};
  const items = (st.inv || []).map((k) => Shop.byKey(k)).filter(Boolean).sort((a, b) => Shop.tier(b) - Shop.tier(a));
  const step = (kind, k, n, max) => `<span class="stepper"><button data-a="pick-step" data-v="${kind}|${k}|-1" ${n ? "" : "disabled"}>−</button><b>${n}</b><button data-a="pick-step" data-v="${kind}|${k}|1" ${n < max ? "" : "disabled"}>+</button></span>`;
  return `<h2>Що віддаєш</h2>
    <div class="section-title">Улюбленці та яйця</div>
    ${pets.length ? `<div class="pick-grid">${pets.map((p) => `<button class="pick ${pk.pets.includes(p.id) ? "on" : ""}" data-a="pick-pet" data-v="${p.id}">
      ${p.egg ? Pets.sprite(petCode(p), 48, { egg: true }) : Pets.sprite(petCode(p), 48)}<span>${p.egg ? "Яйце" : esc(Pets.name(p.dna))}</span></button>`).join("")}</div>` : `<div class="muted small">Немає</div>`}
    <div class="section-title">Речі</div>
    ${items.length ? Shop.CATS.map((c) => { const list = items.filter((it) => it.cat === c.key); if (!list.length) return "";
      return `<div class="small muted mt">${c.icon} ${c.name}</div><div class="shop-grid trade-grid">${list.map((it) => { const k = it.cat + ":" + it.id;
        return `<button class="shop-item ${pk.items.includes(k) ? "sel" : ""}" style="--tc:${Shop.TIERS[Shop.tier(it)].color}" data-a="pick-item" data-v="${k}">${pk.items.includes(k) ? '<span class="pick-ok">✓</span>' : ""}
          ${shopPreview(it)}<b>${esc(it.name)}</b><span class="price">${Shop.TIERS[Shop.tier(it)].name}</span></button>`; }).join("")}</div>`; }).join("")
      : `<div class="muted small">Речей поки немає — вони випадають із кейсів. Стартові (безплатні) речі є в усіх, їх не передати</div>`}
    <div class="section-title">Їжа</div>
    ${Object.keys(food).filter((k) => food[k] > 0).map((k) => `<div class="pick-row"><span>${Pets.FOOD_EMOJI[k] || "🍽"} ${esc(petFood(k).name)} <span class="muted small">із ${food[k]}</span></span>${step("food", k, pk.food[k] || 0, food[k])}</div>`).join("") || `<div class="muted small">Немає</div>`}
    <div class="section-title">Кейси</div>
    ${Object.keys(cases).map((k) => `<div class="pick-row"><span>${caseImg(k, 28)} ${esc(Shop.caseByKey(k).name)} <span class="muted small">із ${cases[k]}</span></span>${step("cases", k, pk.cases[k] || 0, cases[k])}</div>`).join("") || `<div class="muted small">Немає</div>`}
    <button class="btn mt2" data-a="pick-save">Покласти в обмін</button>`;
}
function tradePickSave() {
  const pk = S.pick;
  S.sheet = null; renderOverlay();
  if (!pk || !S.trade) return;
  Api.call("/api/trade/set", { code: S.trade.code, offer: pk }).then((r) => { S.trade = r.trade; S.pick = null; render(); haptic("medium"); }).catch(petErr);
}

// пока открыт обмен — подтягиваем изменения второй стороны
setInterval(() => {
  if (S.screen !== "pets" || S.petTab !== "trade" || !S.tradeCode || !S.trade || S.trade.status !== "open" || S.sheet || document.hidden) return;
  Api.call("/api/trade/get", { code: S.tradeCode }).then((r) => {
    if (JSON.stringify(r.trade) === JSON.stringify(S.trade)) return;
    const done = r.trade.status === "done" && S.trade.status !== "done";
    S.trade = r.trade;
    if (done) { notify("success"); Api.refresh().catch(() => {}); }
    render();
  }).catch(() => {});
}, 2500);

const TRADE_ACTIONS = {
  "trade-new": () => Api.call("/api/trade/new", {}).then((r) => { S.tradeCode = r.trade.code; S.trade = r.trade; render(); TRADE_ACTIONS["trade-share"](); }).catch(petErr),
  "trade-open": (code) => { haptic(); tradeOpen(code); window.scrollTo(0, 0); },
  "trade-back": () => { S.tradeCode = null; S.trade = null; render(); tradeLoadList(); },
  "trade-group": () => { if (!S.trade) return; const c = S.trade.code; Api.call("/api/group/trade", { code: c }).then(() => { (S.tradeGroup = S.tradeGroup || {})[c] = 1; toast("📢 Обмін у групі — чекай на пропозиції"); notify("success"); render(); }).catch((e) => toast(e.message)); },
  "trade-share": () => { if (S.trade) shareLink(linkFor("t", S.trade.code, "trade"), "🔄 Давай мінятися улюбленцями й речами в Настолкіно!"); },
  "trade-pick": () => {
    const me = S.trade.me;
    S.pick = { pets: me.pets.map((p) => p.id), items: me.items.slice(), food: Object.assign({}, me.food), cases: Object.assign({}, me.cases) };
    S.sheet = { type: "trade-pick" }; renderOverlay();
  },
  "pick-pet": (id) => { id = Number(id); const a = S.pick.pets; S.pick.pets = a.includes(id) ? a.filter((x) => x !== id) : a.concat(id).slice(0, 6); haptic(); renderOverlay(); },
  "pick-item": (k) => { const a = S.pick.items; S.pick.items = a.includes(k) ? a.filter((x) => x !== k) : a.concat(k).slice(0, 20); haptic(); renderOverlay(); },
  "pick-step": (v) => { const [kind, k, d] = v.split("|"); const m = S.pick[kind]; m[k] = Math.max(0, (m[k] || 0) + Number(d)); if (!m[k]) delete m[k]; haptic(); renderOverlay(); },
  "pick-save": tradePickSave,
  "trade-ready": () => {
    const ready = !S.trade.my_ready;
    Api.act("/api/trade/ready", { code: S.trade.code, ready }).then((r) => {
      S.trade = r.trade;
      if (r.trade.status === "done") { notify("success"); toast("✅ Обмін завершено!"); coinRain(); } else haptic("medium");
      render();
    }).catch(petErr);
  },
  "trade-cancel": () => {
    const go = () => Api.call("/api/trade/cancel", { code: S.trade.code }).then((r) => { S.trade = r.trade; render(); }).catch(petErr);
    if (tg) tg.showConfirm("Скасувати обмін?", (ok) => ok && go()); else if (confirm("Скасувати обмін?")) go();
  },
};
