/* Связь с сервером (server/worker.js). Если сервер не указан в config.js или приложение открыто не из Telegram —
   всё работает по-старому, монеты хранятся только на телефоне.
   Монеты: игра меняет store.coins как раньше, а здесь разница уходит на сервер очередью (с ключами от повторов).
   Сервер — главный: его ответ поправляет баланс (например, если упёрлись в дневной лимит заработка). */
"use strict";

(function (root) {
  const cfg = root.APP_CONFIG || {};
  const base = (cfg.api || "").replace(/\/+$/, "");
  const wa = root.Telegram && root.Telegram.WebApp;
  const initData = wa && wa.initData ? wa.initData : "";
  const on = !!(base && initData);

  let store = null, save = () => {}, chain = Promise.resolve(), flushing = false, retry = null;
  const Api = { on, ready: false, state: null, onState: null, error: null };

  // все запросы строго по очереди — так баланс не путается
  function call(path, body) {
    const p = chain.then(() => fetch(base + path, {
      method: "POST", headers: { "content-type": "application/json", authorization: "tma " + initData },
      body: JSON.stringify(body || {}),
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { const e = new Error(data.error || "Сервер недоступний"); e.status = r.status; e.data = data; throw e; }
      return data;
    }));
    chain = p.catch(() => {});
    return p;
  }

  const pendingSum = () => (store.q || []).reduce((s, x) => s + x[1], 0);
  function applyCoins(c) {
    if (typeof c !== "number") return;
    store.srv = c;
    store.coins = c + pendingSum();
  }
  function applyState(st) {
    if (!st) return st;
    applyCoins(st.coins);
    if (Array.isArray(st.inv)) store.owned = st.inv.slice();                     // инвентарь хранит сервер
    if (st.chest === false) store.chest = new Date().toISOString().slice(0, 10);   // сундук уже открыт (может, с другого телефона)
    if (st.pets) {
      st.skew = (st.now || Date.now()) - Date.now();
      Api.state = st;
      const main = st.pets.find((p) => p.id === st.main_pet && p.alive && !p.egg);
      store.pet = main ? (typeof petCode === "function" ? petCode(main) : main.rarity + main.dna) : "";
    }
    save();
    if (Api.onState) Api.onState(st);
    return st;
  }

  // вызывается после каждого сохранения профиля: новая разница монет → в очередь
  function sync() {
    if (!on || !Api.ready) return;
    store.q = store.q || [];
    const d = Math.round(store.coins - (store.srv + pendingSum()));
    if (d) store.q.push(["c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), d]);
    flush();
  }
  async function flush() {
    if (flushing || !store.q || !store.q.length) return;
    flushing = true;
    try {
      while (store.q.length) {
        const [key, delta, reason] = store.q[0];
        try {
          const r = await call("/api/coins", { delta, key, reason: reason || (delta > 0 ? "game" : "spend") });
          store.q.shift(); applyCoins(r.coins);
        } catch (e) {
          if (e.status === 409 || e.status === 400) {             // не хватило монет на сервере — отменяем трату
            store.q.shift();
            if (e.data && typeof e.data.coins === "number") applyCoins(e.data.coins); else store.coins = store.srv + pendingSum();
            Api.error = e.message;
          } else { clearTimeout(retry); retry = setTimeout(flush, 8000); break; }   // нет связи — повторим позже
        }
        save();
      }
    } finally { flushing = false; }
    if (Api.onState) Api.onState(Api.state);
  }

  Api.attach = (s, saveFn) => { store = s; save = saveFn; };
  Api.sync = sync;
  Api.start = () => {
    if (!on) return Promise.resolve(null);
    return call("/api/me", { coins: Math.max(0, Math.floor(store.coins || 0)), owned: store.owned || [] }).then((st) => {
      Api.ready = true; store.q = store.q || [];
      if (typeof store.srv !== "number") store.q = [];             // первый вход: локальные монеты уже перенесены на сервер
      applyState(st); flush(); return st;
    }).catch((e) => { Api.error = e.message; retry = setTimeout(Api.start, 15000); return null; });
  };
  Api.call = (path, body) => call(path, body);
  // заработок в одиночных играх: отдельный дневной лимит на сервере
  Api.solo = (n, reason = "solo") => {
    store.q = store.q || [];
    store.coins += n;
    store.q.push(["s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), n, reason]);
    save();
  };
  // общий стол на монеты: ставка списывается сервером сразу, выигрыш приходит из банка стола (без дневного лимита)
  const coinsBack = (r) => { if (r && typeof r.coins === "number") { applyCoins(r.coins); save(); if (Api.onState) Api.onState(Api.state); } return r; };
  Api.table = (room) => (on && Api.ready && room && /^tg\d+$/.test(String(room.host)) ? `${room.game === "blackjack" ? "bj" : "rou"}:${room.code}:${room.host}:${room.game_no || 0}` : null);
  Api.bet = (tbl, hand, kind, amount) => call("/api/table/bet", { tbl, hand: String(hand), kind, amount }).then(coinsBack)
    .catch((e) => { coinsBack(e.data); throw e; });
  Api.settle = (tbl, hand, pay) => call("/api/table/settle", { tbl, hand: String(hand), pay: pay || {} }).then(coinsBack);
  Api.coins = () => (Api.ready ? call("/api/me", {}).then(applyState) : Promise.resolve(null));
  // публичный профиль (его смотрят по команде /profile в боте): отправляем, только если изменился, не чаще раза в 5 секунд
  let profT = null, profLast = "";
  Api.pushProfile = (p) => {
    if (!on || !Api.ready) return;
    const data = JSON.stringify({ avatar: p.avatar, badge: p.badge || "", look: p.look, games: p.games, wins: p.wins, photo: p.photo || null });
    if (data === profLast) return;
    clearTimeout(profT);
    profT = setTimeout(() => { profLast = data; call("/api/profile/save", { profile: JSON.parse(data) }).catch(() => { profLast = ""; }); }, 5000);
  };                     // запрос без обновления баланса (бои, обмены)
  Api.refresh = () => (Api.ready ? call("/api/me", {}).then(applyState) : Api.start());
  // действия с питомцами и едой — ответ всегда содержит полное новое состояние
  Api.act = (path, body) => call(path, body).then(applyState);

  root.Api = Api;
})(typeof window !== "undefined" ? window : globalThis);
