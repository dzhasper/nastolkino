/* Настолкино без хостинга: интерфейс + профиль на телефоне. Игру ведёт телефон хоста (js/engine.js, js/net.js). */
"use strict";

const tg = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData ? window.Telegram.WebApp : null;
const $app = document.getElementById("app");
const $overlay = document.getElementById("overlay");

const S = {
  ws: null, connected: false, me: null, profile: null, registered: false, catalog: null, suggest: "",
  room: null, screen: "loading", tab: "games", setup: { theme: "classic" }, joinCode: "",
  regName: "", regAvatar: null, sel: { ability: 0, target: null, duel: false },
  chatOpen: false, chatTab: "all", seen: {}, offset: 0, flipOpen: false, sheet: null,
  pendingRoom: new URLSearchParams(location.search).get("room"), lastPhaseKey: "",
};

/* ---------------------------------------------------------------- утилиты */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const haptic = (type = "light") => { try { tg && tg.HapticFeedback.impactOccurred(type); } catch (e) { /* нет */ } };
const notify = (type) => { try { tg && tg.HapticFeedback.notificationOccurred(type); } catch (e) { /* нет */ } };
const theme = (key) => S.catalog.themes.find((t) => t.key === key) || S.catalog.themes[0];
const player = (id) => (S.room ? S.room.players.find((p) => p.id === id) : null);
const isHost = () => S.room && S.room.host === S.me;

/* ---------------------------------------------------------------- стили сценариев */
const ORD_F = ["первая", "вторая", "третья", "четвёртая", "пятая", "шестая", "седьмая", "восьмая", "девятая", "десятая"];
const ORD_M = ["первый", "второй", "третий", "четвёртый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый"];
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const pad = (n) => String(n).padStart(2, "0");
const ordF = (n) => ORD_F[n - 1] || `№ ${n}`;
const ordM = (n) => ORD_M[n - 1] || `№ ${n}`;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const SKINS = {
  classic: { night: (n) => `Ночь ${ordF(n)}`, day: (n) => `День ${ordM(n)}`, vote: "Приговор", verdict: "Решение города",
    lobby: "Сходка", discuss: "Обсуждение", nightSub: "Город спит", team: { mafia: "Семья", town: "Город", solo: "Одиночка", bounty: "Одиночка" } },
  "90s": { night: (n) => `Ночь #${pad(n)}`, day: (n) => `Стрелка #${pad(n)}`, vote: "Сходняк", verdict: "Базар окончен",
    lobby: "Хата", discuss: "Разборки", nightSub: "Пейджеры молчат", team: { mafia: "Братва", town: "Граждане", solo: "Сам по себе", bounty: "Сам по себе" } },
  halloween: { night: (n) => `${cap(ordF(n))} ночь`, day: (n) => `${cap(ordM(n))} рассвет`, vote: "Суд деревни", verdict: "Костёр",
    lobby: "Шабаш", discuss: "Совет у камина", nightSub: "Луна над кладбищем", team: { mafia: "Клан", town: "Деревня", solo: "Зверь", bounty: "Зверь" } },
  bunker: { night: (n) => `> ЦИКЛ ${pad(n)} :: ОТБОЙ`, day: (n) => `> ЦИКЛ ${pad(n)} :: ПОДЪЁМ`, vote: "> ГОЛОСОВАНИЕ: КАРАНТИН",
    verdict: "> РЕШЕНИЕ СОВЕТА", lobby: "> ШЛЮЗ ОТКРЫТ", discuss: "СОВЕТ БУНКЕРА", nightSub: "АВАРИЙНОЕ ОСВЕЩЕНИЕ",
    team: { mafia: "ЗАРАЖЁН", town: "ЧИСТ", solo: "НЕИЗВЕСТНО", bounty: "НЕИЗВЕСТНО" } },
  west: { night: (n) => `Ночь ${ordF(n)}`, day: (n) => `День ${ordM(n)}`, vote: "Суд города", verdict: "Виселица",
    lobby: "Салун", discuss: "Разговоры в салуне", nightSub: "Койоты воют", team: { mafia: "Банда", town: "Горожанин", solo: "Чужак", bounty: "Охотник" } },
  office: { night: (n) => `Ночная смена · ${n}`, day: (n) => `Планёрка · день ${n}`, vote: "Голосование на увольнение",
    verdict: "Решение руководства", lobby: "Переговорка", discuss: "Обсуждение в общем чате", nightSub: "Офис пуст",
    team: { mafia: "Конкуренты", town: "Команда", solo: "Фрилансер", bounty: "Фрилансер" } },
};
const SOLO_SKINS = ["draw", "roulette", "blackjack"];
const skinKey = () => (S.screen === "room" && S.room ? (SOLO_SKINS.includes(S.room.game) ? S.room.game : S.room.settings.theme)
  : S.screen === "mafia" ? S.setup.theme : SOLO_SKINS.includes(S.screen) ? S.screen : "app");
const SK = () => SKINS[skinKey()] || SKINS.classic;

const ICON_PATHS = {
  night: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  day: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
  vote: '<rect x="4" y="11" width="16" height="9" rx="1"/><path d="M8 11V4h8v7M10 7.5h4M4 15h16"/>',
  verdict: '<path d="M12 3v18M6 21h12M5 7h14M5 7l-3 6.5a3 3 0 0 0 6 0zM19 7l-3 6.5a3 3 0 0 0 6 0z"/>',
  end: '<path d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 2.6 3.6M17 6h2.5a2.5 2.5 0 0 1-2.6 3.6"/>',
  card: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
};
const icon = (k, size = 54) => (PX() && k !== "card") ? Pixel.sprite(k, ["night", "day"].includes(k) ? Math.max(2, Math.round(size / 28)) : Math.max(2, Math.round(size / 14))) : `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[k] || ""}</svg>`;

const PX = () => S.pixel && typeof Pixel !== "undefined";
const themeBg = (t) => (PX() ? `background-image:url(${Pixel.scene(t.key)})` : `background:linear-gradient(150deg, ${t.accent}, ${t.accent2})`);
const emo = (e, res = 28) => (PX() ? Pixel.emoji(e, Math.max(res, 24)) : e);

function av(p, cls = "") {
  if (!p) return `<div class="avatar ${cls}"></div>`;
  const big = /\b(big|huge)\b/.test(cls);
  const frame = cls.includes("mini") ? "" : Shop.frameImg(p.look && p.look.frame);
  const inner = PX() ? (p.photo ? Pixel.photo(p.photo, big ? 64 : 32) : Pixel.emoji(p.avatar, big ? 40 : 24))
    : p.photo ? `<img src="${esc(p.photo)}" alt="" referrerpolicy="no-referrer" loading="lazy">` : esc(p.avatar);
  const kind = PX() ? "pxav" : p.photo ? "photo" : "";
  return `<div class="avatar ${kind} ${cls} ${frame ? "framed" : ""}">${frame ? `<div class="av-in">${inner}</div>${frame}` : inner}</div>`;
}
const nm = (p) => Shop.nameFx(p.name, p.look && p.look.fx);

function toast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

function guestId() {
  let id = null;
  try { id = localStorage.getItem("party_guest"); } catch (e) { /* приватный режим */ }
  if (!id) {
    id = "g_" + Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
    try { localStorage.setItem("party_guest", id); } catch (e) { /* ничего */ }
  }
  return id;
}

function setColors(accent, accent2) {
  document.documentElement.style.setProperty("--accent", accent || "#8b5cf6");
  document.documentElement.style.setProperty("--accent2", accent2 || "#3b0764");
}

/* ---------------------------------------------------------------- профиль (хранится в Telegram CloudStorage и на телефоне) */
const AVATARS = ["😎", "🦊", "🐼", "🐸", "🦁", "🐯", "🐵", "🦄", "🐙", "🐧", "🦉", "🐺", "👻", "🤖", "👽", "🎃", "🤠",
  "🧛", "🧟", "🥷", "👑", "🍕", "🔥", "💎"];
const PROFILE_KEY = "nk_profile";
let store = {};

function catalog() {
  const c = window.APP_CONFIG || {};
  return { app: c.app || "Настолкино", min: Engine.MIN_PLAYERS, max: Engine.MAX_PLAYERS, avatars: AVATARS,
    modes: Object.entries(Engine.MODES).map(([key, m]) => Object.assign({ key }, m)),
    themes: Object.entries(Engine.THEMES).map(([key, t]) => ({ key, title: t.title, emoji: t.emoji, tagline: t.tagline, twist: t.twist,
      accent: t.accent, accent2: t.accent2, specials: t.specials.map(([k, n]) => ({ key: k, from: n })),
      roles: Object.entries(t.roles).map(([k, r]) => ({ key: k, name: r.name, emoji: r.emoji, team: r.team, desc: r.desc, motto: r.motto || "" })) })) };
}

function profileView() {
  const fav = Object.entries(store.roles || {}).sort((a, b) => b[1] - a[1])[0];
  return { name: store.name, avatar: store.avatar || "🙂", photo: store.use_photo !== false && store.tg_photo ? store.tg_photo : null,
    has_tg_photo: !!store.tg_photo, use_photo: store.use_photo !== false, games: store.games || 0, wins: store.wins || 0,
    favorite_role: fav ? fav[0] : null, coins: store.coins || 0,
    look: Object.assign(Shop.look(), { lv: String(Shop.level(store.games)), g: String(store.games || 0), w: String(store.wins || 0), c: String(Math.max(0, store.coins || 0)) }, store.pet ? { pet: store.pet } : {}) };
}

function saveProfile() {
  const data = JSON.stringify(store);
  try { localStorage.setItem(PROFILE_KEY, data); } catch (e) { /* приватный режим */ }
  try { if (tg && tg.CloudStorage) tg.CloudStorage.setItem(PROFILE_KEY, data); } catch (e) { /* старый клиент */ }
  S.profile = profileView();
  Api.sync();                                              // разница монет уходит на сервер (если он подключён)
  if (Api.pushProfile && S.profile) Api.pushProfile(S.profile);
}

function loadProfile(done) {
  try { store = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch (e) { store = {}; }
  const finish = () => {
    const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    if (user) {                                            // имя и фото из Telegram — без регистрации
      if (!store.name) store.name = (user.first_name || user.username || "Игрок").slice(0, 20);
      if (!store.avatar) store.avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
      if (user.photo_url) store.tg_photo = user.photo_url;
    }
    Shop.attach(store);
    Api.attach(store, saveProfile);
    saveProfile();
    done();
  };
  if (!store.name && tg && tg.CloudStorage) {
    try {
      tg.CloudStorage.getItem(PROFILE_KEY, (err, value) => {
        if (!err && value) { try { store = JSON.parse(value); } catch (e) { /* испорчено */ } }
        finish();
      });
      return;
    } catch (e) { /* старый клиент */ }
  }
  finish();
}

function recordGame(room) {
  const key = room.code + ":" + room.version;
  if (!room.my || store.lastGame === room.code + room.log.length) return;
  store.lastGame = room.code + room.log.length;
  store.games = (store.games || 0) + 1;
  if ((room.winners || []).includes(S.me)) store.wins = (store.wins || 0) + 1;
  store.roles = store.roles || {};
  store.roles[room.my.role.name] = (store.roles[room.my.role.name] || 0) + 1;
  S.reward = { key: store.lastGame, sum: Shop.reward((room.winners || []).includes(S.me), !!room.my.alive) };
  saveProfile();
  syncProfile();
  return key;
}

/* ---------------------------------------------------------------- связь (js/net.js) */
const send = (msg) => Net.send(msg);

function boot() {
  S.catalog = catalog();
  S.me = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? "tg" + tg.initDataUnsafe.user.id : guestId();
  const cfg = window.APP_CONFIG || {};
  S.bot = cfg.bot || ""; S.miniapp = cfg.miniapp || "";
  Net.me = S.me;
  Net.profile = () => ({ name: S.profile.name, avatar: S.profile.avatar, photo: S.profile.photo, look: S.profile.look });
  Net.onMessage = onMessage;
  Net.onStatus = (s) => { S.net = s; const el = document.getElementById("net-banner"); if (el) el.outerHTML = netBanner(); else if (S.screen === "room") render(); };
  loadProfile(() => {
    S.pixel = store.pixel !== false;
    S.sound = store.sound !== false;
    S.registered = !!store.name;
    const startParam = tg && tg.initDataUnsafe ? tg.initDataUnsafe.start_param : null;
    if (startParam && /^[A-Z0-9]{4}$/i.test(startParam)) S.pendingRoom = startParam;
    S.screen = S.registered ? "home" : "register";
    const qs = new URLSearchParams(location.search);
    if (S.registered && (qs.get("tab") === "pets" || startParam === "pets")) { S.screen = "pets"; S.petSel = Number(qs.get("pet")) || null; }
    if (S.registered && (qs.get("tab") === "shop" || startParam === "cases")) S.screen = "shop";
    Api.onState = petOnState;
    Api.start();
    const bcode = qs.get("battle") || (startParam && /^b_[0-9A-F]{8}$/i.test(startParam) ? startParam.slice(2) : null);
    const tcode = qs.get("trade") || (startParam && /^t_[0-9A-F]{8}$/i.test(startParam) ? startParam.slice(2) : null);
    if (S.registered && qs.get("u") && Api.on) setTimeout(() => openPlayer(qs.get("u")), 300);
    if (S.registered && qs.get("tour")) tourOpen(qs.get("tour"));
    else if (S.registered && bcode) battleOpen(bcode);
    else if (S.registered && tcode) tradeOpen(tcode);
    const snapshot = Net.loadSnapshot();
    if (snapshot && !S.pendingRoom) { resumeHost(snapshot); return render(); }
    if (S.registered && S.pendingRoom) joinRoom(S.pendingRoom);
    render();
  });
}

function joinRoom(code) {
  S.pendingRoom = null;
  S.screen = "connecting"; S.joining = code.toUpperCase();
  render();
  Net.join(code);
}

function resumeHost(snapshot) {
  S.screen = "connecting"; S.joining = snapshot.code;
  Net.host(null, snapshot).catch((e) => { toast(e.message); S.screen = "home"; render(); });
}

function netBanner() {
  if (S.screen !== "room" || !S.net || S.net === "ok") return '<div id="net-banner"></div>';
  return `<div id="net-banner" class="net-banner">${S.net === "lost" ? "📡 Связь с хостом потеряна — ждём его и переподключаемся…" : "🔌 Подключаемся…"}</div>`;
}

function onMessage(m) {
  if (m.t === "state") {
    const prev = S.room;
    if (m.room.game === "draw") drawOnState(m.room);
    if (m.room.game === "roulette") { S.room = m.room; rouTurnReset(); }
    const keep = m.room.game === "draw" && S.screen === "room" && (drawKeepScreen(m.room, prev)
      || (m.room.phase === "guess" && prev && prev.phase === "guess" && document.activeElement && document.activeElement.id === "guess-input"));
    S.room = m.room;
    S.offset = m.room.now - Date.now();
    S.screen = "room";
    if (keep) return;
    const key = m.room.phase + ":" + (m.room.night || m.room.turn || 0) + ":" + (m.room.day || 0);
    if (key !== S.lastPhaseKey) {
      S.lastPhaseKey = key;
      S.sel = { ability: 0, target: null, duel: false };
      if (m.room.phase === "reveal") S.flipOpen = false;
      if (prev && prev.phase !== m.room.phase) notify(m.room.phase === "end" ? "success" : "warning");
      if (m.room.game !== "roulette") window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (m.room.phase === "end" && m.room.game !== "blackjack") (m.room.game === "draw" ? recordDraw : m.room.game === "roulette" ? recordRoulette : recordGame)(m.room);
    render();
    renderChat();
  } else if (m.t === "ink") {
    drawOnInk(m);
  } else if (m.t === "closed" || m.t === "left" || m.t === "kicked") S.sheet = null;
  if (m.t === "closed") {
    toast("Хост закрыл комнату");
    S.room = null; S.screen = "home"; S.chatOpen = false; render(); renderChat();
  } else if (m.t === "error") {
    notify("error");
    toast(m.text);
  } else if (m.t === "left" || m.t === "kicked") {
    if (m.t === "kicked") toast("Хост убрал вас из комнаты");
    S.room = null; S.screen = "home"; S.chatOpen = false; render(); renderChat();
  }
}

/* ---------------------------------------------------------------- отрисовка */
function render() {
  document.body.dataset.skin = skinKey();
  document.body.dataset.screen = S.screen;
  document.body.dataset.pstyle = S.profile ? S.profile.look.style : "rpg";
  document.body.classList.toggle("pixel", !!S.pixel);
  document.body.classList.toggle("night", S.screen === "room" && !!S.room && S.room.phase === "night");
  if (S.screen === "room" && S.room) setColors(S.room.theme.accent, S.room.theme.accent2);
  else if (S.screen === "mafia") setColors(theme(S.setup.theme).accent, theme(S.setup.theme).accent2);
  else setColors();
  const screens = { connecting: viewConnecting, loading: viewLoading, register: viewRegister, home: viewHome, profile: viewProfile, shop: viewShop, pets: viewPets, solo: viewSolo, "solo-bj": viewSoloBj, "solo-hilo": viewSoloHilo, "solo-cups": viewSoloCups, "solo-wheel": viewSoloWheel, "solo-memo": viewSoloMemo, "solo-react": viewSoloReact, "solo-shoot": viewSoloShoot, "solo-snake": viewSoloSnake, petfun: viewPetFun, mafia: viewMafia, draw: viewDrawMenu, roulette: viewRouletteMenu, blackjack: viewBlackjackMenu, room: viewRoom };
  $app.innerHTML = (screens[S.screen] || viewLoading)();
  renderOverlay();
  if (PX()) Pixel.apply();
  drawMount();
  rouMount();
  if (S.screen === "solo-snake") snakeDraw();
  if (S.screen === "petfun" && S.fun && S.fun.game === "fetch" && S.fun.phase === "play") { const m = document.getElementById("fetch-mark"); if (m) m.style.left = fetchPos() + "%"; }
  updateBack();
  if (tg) {
    const bg = getComputedStyle(document.body).getPropertyValue("--bg").trim() || "#0b0b14";
    try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); } catch (e) { /* старый клиент */ }
  }
}

function updateBack() {
  if (!tg) return;
  const back = S.screen === "mafia" || S.screen === "draw" || S.screen === "roulette" || S.screen === "blackjack" || S.screen === "profile" || S.screen === "shop" || S.screen === "pets" || S.screen.startsWith("solo") || S.screen === "petfun" || (S.screen === "room" && S.room && ["lobby", "end"].includes(S.room.phase));
  if (back) tg.BackButton.show(); else tg.BackButton.hide();
}

function viewConnecting() {
  return `<div class="loading"><div class="center"><div class="spinner" style="margin:0 auto 14px"></div>
    <div class="display">${esc(S.joining || "")}</div><div class="muted mt">Подключаюсь к комнате…</div>
    <button class="btn ghost small mt2" data-a="cancel-join">Отмена</button></div></div>`;
}

function viewLoading() {
  return `<div class="loading"><div class="center"><div class="spinner" style="margin:0 auto 14px"></div>
    <div class="muted">Загружаю…</div></div></div>`;
}

function avatarGrid(selected) {
  const list = S.catalog.avatars.concat(S.registered ? Shop.ownedAvatars() : []);
  return `<div class="avatars">${list.map((a) =>
    `<button data-a="avatar" data-v="${a}" class="${a === selected ? "sel" : ""}">${emo(a, 24)}</button>`).join("")}</div>`;
}

function viewRegister() {
  if (S.regAvatar === null) S.regAvatar = S.catalog.avatars[Math.floor(Math.random() * S.catalog.avatars.length)];
  if (!S.regName) S.regName = S.suggest;
  return `<div class="fade-in">
    <div class="hero">${PX() ? `<div class="pxscene title" style="background-image:url(${Pixel.scene("arcade")})"></div>` : ""}<div class="logo">${PX() ? Pixel.sprite("dice", 4) : "🎲"}</div><h1>${esc(S.catalog.app)}</h1>
      ${PX() ? '<div class="press-start">▶ НАЖМИ СТАРТ</div>' : ""}
      <p class="muted mt">Настолки с друзьями прямо в Telegram.<br>Мафия, вечеринки и не только.</p></div>
    <div class="section-title">Как тебя зовут?</div>
    <input class="input" id="reg-name" maxlength="20" placeholder="Имя или ник" value="${esc(S.regName)}" autocomplete="off">
    <div class="section-title">Выбери аватар</div>
    ${avatarGrid(S.regAvatar)}
    <button class="btn mt2" data-a="register">Поехали 🚀</button>
  </div>`;
}

function tabs() {
  const hungry = Api.state && Api.state.pets.some((p) => p.alive && !p.egg && petLive(p).hunger < 25);
  const b = (k, ic, label) => `<button class="${S.screen === k ? "on" : ""}" data-a="tab" data-v="${k}"><span class="ti">${ic}</span><span>${label}</span></button>`;
  return `<div class="tabs t4">${b("home", "🎲", "Игры")}${b("pets", "🐾", `Питомцы${hungry ? '<i class="dot"></i>' : ""}`)}${b("shop", "🎁", `Кейсы${Shop.chestReady() || Shop.CASES.some((c) => caseFree(c.key)) || (Api.state && Api.state.season && seasonLeft() > 0) ? '<i class="dot"></i>' : ""}`)}${b("profile", "👤", "Профиль")}</div>`;
}
const coinPill = () => `<button class="coins" data-a="tab" data-v="shop">${PX() ? Pixel.sprite("coin", 2) : "🪙"}<b>${S.profile.coins}</b></button>`;

const SOON = [["🐊", "Крокодил", "Покажи слово без слов"], ["🎩", "Шляпа", "Объясни как можно больше слов"],
  ["🤔", "Кто я?", "Угадай, кто написан у тебя на лбу"], ["🔥", "Правда или действие", "Классика вечеринок"],
  ["💡", "Ассоциации", "Найди общее у разных слов"]];

function viewHome() {
  const p = S.profile;
  return `<div class="fade-in">
    <div class="top"><div class="logo">${PX() ? Pixel.sprite("dice", 3) : "🎲"}</div><div class="grow"><h1>${esc(S.catalog.app)}</h1>
      <div class="muted small">Привет, ${esc(p.name)}!</div></div>${coinPill()}</div>
    <div class="game-hero" data-a="go" data-v="mafia" ${PX() ? `style="background-image:url(${Pixel.scene("arcade")})"` : ""}>
      ${PX() ? `<div class="big-emoji">${Pixel.emoji("🕴️", 40)}</div>` : '<div class="big-emoji">🕴️</div>'}
      <div class="pill" style="background:rgba(255,255,255,.15)">🔥 ${S.catalog.min}–${S.catalog.max} игроков</div>
      <h2 class="mt">Мафия</h2>
      <p>6 сценариев: Классика, 90-е, Хэллоуин, Бункер, Дикий Запад, Корпоратив</p>
      <button class="btn">Играть ▶</button>
    </div>
    <div class="game-hero draw-hero mt2" data-a="go" data-v="draw" ${PX() ? `style="background-image:url(${Pixel.scene("studio")})"` : ""}>
      <div class="pill" style="background:rgba(255,255,255,.15)">✨ Новинка · ${Draw.MIN_PLAYERS}–${Draw.MAX_PLAYERS} игроков</div>
      <h2 class="mt">Рисовалка</h2>
      <p>Один рисует слово — остальные угадывают. Художник раздаёт баллы</p>
      <button class="btn">Рисовать ▶</button>
    </div>
    <div class="game-hero rou-hero mt2" data-a="go" data-v="roulette" ${PX() ? `style="background-image:url(${Pixel.scene("cellar")})"` : ""}>
      <div class="pill" style="background:rgba(120,0,10,.55)">🩸 3D · ${Roulette.MIN_PLAYERS}–${Roulette.MAX_PLAYERS} игрока</div>
      <h2 class="mt">Последний заряд</h2>
      <p>Подвал, стол и один дробовик. Каждый тайно заряжает свой патрон</p>
      <button class="btn">Спуститься ▶</button>
    </div>
    <div class="game-hero bj-hero mt2" data-a="go" data-v="blackjack" ${PX() ? `style="background-image:url(${Pixel.scene("casino")})"` : ""}>
      <div class="pill" style="background:rgba(10,60,30,.7)">🃏 ${Blackjack.MIN_PLAYERS}–${Blackjack.MAX_PLAYERS} игроков · на монеты</div>
      <h2 class="mt">Блэкджек</h2>
      <p>Игроки против игроков. Честная раздача: колода проверяется на твоём телефоне</p>
      <button class="btn">За стол ▶</button>
    </div>
    <button class="game-hero solo-hero mt2" data-a="go" data-v="solo" ${PX() ? `style="background-image:url(${Pixel.scene("arcade")})"` : ""}>
      <div class="pill" style="background:rgba(60,20,80,.7)">👤 один · против бота</div>
      <h2 class="mt">Одиночные игры</h2>
      <p>Колесо фортуны, блэкджек, «Выше или ниже», напёрстки — на монеты. Мемори, реакция, тир и змейка — просто так</p>
      <span class="btn">Играть ▶</span>
    </button>
    <button class="game-hero petfun-hero mt2" data-a="pet-games" ${PX() ? `style="background-image:url(${Pixel.scene("studio")})"` : ""}>
      <div class="pill" style="background:rgba(20,70,60,.7)">🐾 ты и питомец</div>
      <h2 class="mt">Игры с питомцем</h2>
      <p>Апорт, прятки и пузыри. Компанейские питомцы обожают играть, а одиночки любят тишину</p>
      <span class="btn">Играть ▶</span>
    </button>
    <div class="section-title">Есть код комнаты?</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
    <div class="section-title">Скоро</div>
    <div class="games">${SOON.map(([e, n, d]) => `<div class="game-tile"><span class="soon">СКОРО</span><div class="e">${emo(e)}</div>
      <b>${n}</b><span class="muted small">${d}</span></div>`).join("")}</div>
  </div>${tabs()}`;
}

function myCard(lookOverride) {
  const p = S.profile;
  return Shop.card({ name: p.name, games: p.games, wins: p.wins, avatarHtml: av(Object.assign({}, p, { look: lookOverride || p.look }), "huge") },
    lookOverride || p.look);
}

function viewProfile() {
  const p = S.profile;
  return `<div class="fade-in">
    <div class="top"><div class="grow"><h1>Профиль</h1><div class="muted small">${S.me.startsWith("tg") ? "Вход через Telegram" : "Гостевой профиль"}</div></div>${coinPill()}</div>
    ${myCard()}
    ${petBadge(store.pet, true)}
    <div class="row mt2"><button class="btn grow" data-a="tab" data-v="shop">🎁 Кейсы и инвентарь</button></div>
    ${Shop.chestReady() ? `<button class="card chest mt" data-a="chest">${PX() ? Pixel.sprite("end", 3) : "🎁"}<div class="grow"><b>Ежедневный сундук</b><div class="muted small">Открой и забери монеты</div></div><span class="pill on">Открыть</span></button>` : ""}
    ${p.favorite_role ? `<div class="card mt"><span class="muted small">Чаще всего играешь</span><br><b>${esc(p.favorite_role)}</b></div>` : ""}
    <div class="section-title">Изменить профиль</div>
    <input class="input" id="reg-name" maxlength="20" value="${esc(S.regName || p.name)}">
    ${p.has_tg_photo ? `<div class="card mt"><div class="toggle"><span>Фото из Telegram</span>
      <button class="switch ${p.use_photo ? "on" : ""}" data-a="photo-toggle"></button></div></div>` : ""}
    <div class="mt">${avatarGrid(S.regAvatar || p.avatar)}</div>
    <button class="btn mt" data-a="register">Сохранить</button>
    <div class="card mt2"><div class="toggle"><span>👾 Пиксельный стиль</span><button class="switch ${S.pixel ? "on" : ""}" data-a="pixel-toggle"></button></div></div>
  </div>${tabs()}`;
}

/* ---------------------------------------------------------------- магазин приколов */
function shopPreview(it) {
  const p = S.profile;
  if (it.cat === "frame") return `<div class="sp-av">${av(Object.assign({}, p, { look: { frame: it.id } }), "big")}</div>`;
  if (it.cat === "bg") return it.id === "none" ? `<div class="sp-bg empty">пусто</div>` : `<div class="sp-bg" style="background-image:url(${Pixel.scene(it.id)})"></div>`;
  if (it.cat === "toy") return `<div class="sp-ava sp-toy">${it.emoji}</div>`;
  if (it.cat === "mg") return `<div class="sp-ava sp-mg">${Pets.syringe(64)}</div>`;
  if (it.cat === "hat") { const st = Api.state, mp = st && st.pets.find((x) => x.id === st.main_pet && x.alive && !x.egg) || (st && st.pets.find((x) => x.alive && !x.egg));
    return `<div class="sp-ava">${Pets.sprite((mp ? mp.rarity + mp.dna : "27f3a9c51e2b84d06a1c3f5e7092b4d6e") + "-" + it.id, 64)}</div>`; }
  if (it.cat === "style") return `<div class="sp-style">${Shop.card({ name: p.name, games: p.games, wins: p.wins, avatarHtml: av(p, "sm") }, Object.assign({}, p.look, { style: it.id }), { mini: true })}</div>`;
  if (it.cat === "title") return `<div class="sp-title">${it.text ? esc(it.text) : "—"}</div>`;
  if (it.cat === "fx") return `<div class="sp-fx">${Shop.nameFx(p.name, it.id)}</div>`;
  return `<div class="sp-ava">${emo(it.emoji, 32)}</div>`;
}

// экран кейсов и инвентаря — в js/cases-ui.js (viewShop)

// чужой профиль по команде /profile в боте (?u=ID): только посмотреть
function playerSheet(d) {
  if (!d) return `<div class="center"><div class="spinner" style="margin:10px auto"></div><div class="muted small">Загружаю профиль…</div></div>`;
  if (d.error) return `<h2>😕 ${esc(d.error)}</h2>`;
  const pr = d.profile || {}, pl = { name: d.name, avatar: pr.avatar || "🙂", photo: pr.photo || null, look: pr.look || {} };
  const main = d.pets.find((p) => p.id === d.main_pet) || d.pets[0];
  const code = (p) => p.rarity + p.dna + (p.stage ? "." + p.stage : "") + (p.hat ? "-" + p.hat : "");
  return `<div class="center small muted">👀 Профиль игрока — только посмотреть</div>
    ${Shop.card({ name: d.name, games: pr.games || 0, wins: pr.wins || 0, avatarHtml: av(pl, "huge") }, Object.assign({}, Shop.DEFAULT, pr.look || {}))}
    ${d.username ? `<div class="center small muted">@${esc(d.username)}</div>` : ""}
    <div class="section-title">Питомцы · ${d.pets.length}</div>
    ${d.pets.length ? `<div class="pet-grid">${d.pets.map((p) => { const t = Pets.traits(p.dna);
      return `<div class="pet-card ${main && p.id === main.id ? "main" : ""}">${main && p.id === main.id ? '<span class="pet-star">★</span>' : ""}${t.collect ? '<span class="pet-cl">✦</span>' : ""}${Pets.sprite(code(p), 72)}
        <b>${esc(t.name)}</b><span class="rar r${p.rarity}">${Pets.rarityName(p.rarity, p.dna)}</span><span class="small muted">🏆 ${p.wins} · 💉 ${p.mg}/2</span></div>`; }).join("")}</div>` : `<div class="muted small">Питомцев пока нет</div>`}
    <div class="small muted center mt">Вещей в инвентаре: ${d.items} · с нами с ${new Date(d.since * 1000).toLocaleDateString("ru-RU")}</div>`;
}
function openPlayer(q) {
  S.sheet = { type: "player", data: null }; renderOverlay();
  Api.call("/api/profile/view", { q: String(q) }).then((r) => { if (S.sheet && S.sheet.type === "player") { S.sheet.data = r.player; renderOverlay(); } })
    .catch((e) => { if (S.sheet && S.sheet.type === "player") { S.sheet.data = { error: e.message }; renderOverlay(); } });
}

function peekSheet(pl) {
  const lk = pl.look || {};
  return `${Shop.card({ name: pl.name, games: Number(lk.g || 0), wins: Number(lk.w || 0), avatarHtml: av(pl, "huge") }, lk)}${petBadge(lk.pet)}`;
}

function viewMafia() {
  const th = theme(S.setup.theme);
  return `<div class="fade-in">
    <div class="top"><button class="avatar" data-a="tab" data-v="home">←</button><div class="grow"><h1>🕴️ Мафия</h1>
      <div class="muted small">Ведущий автоматический — играют все</div></div></div>
    <div class="section-title">Выбери сценарий</div>
    <div class="themes">${S.catalog.themes.map((t) => `<button class="theme ${t.key === th.key ? "sel" : ""}" data-a="theme" data-v="${t.key}"
      style="${themeBg(t)}"><div class="e">${emo(t.emoji)}</div><b>${esc(t.title)}</b>
      <span>${esc(t.tagline)}</span></button>`).join("")}</div>
    <div class="card mt"><div class="row"><div style="font-size:30px">${emo(th.emoji, 16)}</div><div class="grow"><b>${esc(th.title)}</b>
      <div class="muted small">${esc(th.twist)}</div></div></div>
      <button class="btn ghost small mt" data-a="roles" data-v="${th.key}">👥 Все роли сценария</button></div>
    <button class="btn mt2" data-a="create">Создать комнату</button>
    <div class="section-title">Или войди по коду</div>
    <div class="join-box"><input class="input" id="join-code" maxlength="4" placeholder="KQ7F" value="${esc(S.joinCode)}" autocomplete="off">
      <button class="btn" data-a="join">Войти</button></div>
  </div>`;
}

/* ---------------------------------------------------------------- комната */
function remaining() {
  if (!S.room || !S.room.deadline) return null;
  return Math.max(0, Math.ceil((S.room.deadline - (Date.now() + S.offset)) / 1000));
}

function timerSvg() {
  const r = S.room;
  if (!r.deadline) return "";
  const total = r.total || ({ night: r.mode.night, day: r.mode.discussion, vote: r.mode.vote, reveal: 25, verdict: 7 }[r.phase]) || 30;
  const left = remaining();
  const frac = Math.max(0, Math.min(1, left / total));
  const c = 2 * Math.PI * 25;
  return `<div class="timer" id="timer" data-total="${total}"><svg width="58" height="58"><circle cx="29" cy="29" r="25" stroke="rgba(255,255,255,.12)" stroke-width="5" fill="none"/>
    <circle id="timer-arc" cx="29" cy="29" r="25" stroke="var(--accent)" stroke-width="5" fill="none" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}"/></svg><span id="timer-num">${fmtTime(left)}</span></div>`;
}

function fmtTime(s) { return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : String(s); }

function gamebar(title, sub) {
  return `<div class="gamebar"><div class="title"><span class="kicker">${esc(S.room.theme.title)}</span><b>${title}</b>
    <span class="muted small">${sub}</span></div>${timerSvg()}</div>`;
}

function phaseHero(kind, title, sub) {
  return `<div class="phase-hero ph-${kind}"><div class="ph-icon">${icon(kind)}</div>${title ? `<h2>${title}</h2>` : ""}
    ${sub ? `<p class="muted mt">${sub}</p>` : ""}</div>`;
}

function playerTiles(list, opts = {}) {
  return `<div class="players">${list.map((p) => {
    const pick = opts.pick && opts.pick.includes(p.id);
    const sel = opts.sel === p.id;
    const voters = opts.voters ? (opts.voters[p.id] || []) : [];
    const count = opts.counts ? opts.counts[p.id] : 0;
    const role = p.role ? `<div class="role-mini ${"team-" + p.role.team}">${emo(p.role.emoji, 12)} ${esc(p.role.name)}</div>` : "";
    const nopick = opts.pick && !pick && p.alive !== false;
    return `<div class="player ${p.alive === false ? "dead" : ""} ${p.online ? "" : "off"} ${pick ? "pick" : ""} ${nopick ? "nopick" : ""} ${sel ? "sel" : ""} ${opts.peek ? "pick" : ""}"
      ${pick ? `data-a="${opts.action}" data-v="${p.id}"` : opts.peek ? `data-a="peek" data-v="${p.id}"` : ""}>
      ${p.host ? `<span class="tag">👑</span>` : ""}${p.silenced ? `<span class="tagl">🤐</span>` : ""}${p.ready ? `<span class="tagb">✋</span>` : ""}
      ${count ? `<span class="count">${count}</span>` : ""}
      ${opts.kick && !p.host && p.id !== S.me ? `<button class="kick" data-a="kick" data-v="${p.id}">✕</button>` : ""}
      ${av(p)}<div class="nm">${p.id === S.me ? "Вы" : nm(p)}</div>${role}
      ${voters.length ? `<div class="votes">${voters.map((v) => av(player(v), "mini")).join("")}</div>` : ""}
    </div>`;
  }).join("")}</div>`;
}

function viewRoom() {
  const r = S.room;
  if (r.game === "draw") return viewDrawRoom();
  if (r.game === "roulette") return viewRouletteRoom();
  if (r.game === "blackjack") return viewBlackjackRoom();
  const views = { lobby: viewLobby, reveal: viewReveal, night: viewNight, day: viewDay, vote: viewVote, verdict: viewVerdict, end: viewEnd };
  return `${netBanner()}${r.phase === "night" ? '<div class="night-sky"></div><div class="stars"></div>' : ""}
    <div class="fade-in" key="${r.phase}">${PX() ? `<div class="pxscene ${r.phase === "lobby" ? "big" : ""}" style="background-image:url(${Pixel.scene(r.settings.theme)})"></div>` : ""}${(views[r.phase] || viewLobby)()}</div>
    ${r.phase !== "lobby" || r.players.length > 1 ? `<button class="chat-fab" data-a="chat">💬<span id="chat-badge"></span></button>` : ""}`;
}

function viewLobby() {
  const r = S.room;
  const th = theme(r.settings.theme);
  const enough = r.players.length >= S.catalog.min;
  return `
    <div class="top"><button class="avatar" data-a="leave">←</button><div class="grow"><h1>${esc(SK().lobby)}</h1>
      <div class="muted small">${r.players.length} из ${S.catalog.max} игроков</div></div></div>
    <div class="card code-card"><div class="muted small">КОД КОМНАТЫ</div><div class="code">${r.code}</div>
      <div class="row mt"><button class="btn ghost small grow" data-a="copy">📋 Скопировать</button>
      <button class="btn small grow" data-a="share">📨 Позвать друзей</button></div></div>
    <div class="section-title">Игроки</div>
    ${playerTiles(r.players, { kick: isHost(), peek: true })}
    <div class="section-title">Сценарий</div>
    <div class="card lobby-theme" style="${PX() ? "" : `background:linear-gradient(150deg, ${th.accent}33, ${th.accent2}66)`}">
      <div class="row"><div style="font-size:40px">${emo(th.emoji, 16)}</div><div class="grow"><b class="display">${esc(th.title)}</b>
        <div class="small" style="opacity:.85">${esc(th.tagline)}</div></div>
        ${isHost() ? `<button class="btn ghost small" data-a="settings">⚙️</button>` : ""}</div>
      <div class="small mt" style="opacity:.85">✨ ${esc(th.twist)}</div>
      <div class="chips mt">${r.plan.map((x) => `<span class="pill" title="${esc(x.desc)}">${emo(x.emoji, 12)} ${esc(x.name)}${x.count > 1 ? " ×" + x.count : ""}</span>`).join("")}</div>
      <div class="chips mt"><span class="pill">${r.mode.emoji} ${esc(r.mode.title)}</span>
        <span class="pill">${r.settings.reveal ? "👁 Роли умерших видны" : "🙈 Роли скрыты"}</span>
        <span class="pill">${r.settings.anonymous ? "🗳 Тайное голосование" : "🗳 Открытое голосование"}</span></div>
    </div>
    ${isHost() ? `<button class="btn mt2" data-a="start" ${enough ? "" : "disabled"}>${enough ? "Начать игру 🎬" : `Ждём игроков (минимум ${S.catalog.min})`}</button>`
      : `<div class="card center mt2 muted">⏳ Ждём, когда хост начнёт игру…</div>`}`;
}

function viewReveal() {
  const my = S.room.my;
  const mates = S.room.players.filter((p) => p.id !== S.me && p.role && p.role.team === "mafia" && my.role.team === "mafia");
  return `${gamebar("Твоя роль", "Никому не показывай экран")}
    <div class="flip ${S.flipOpen ? "open" : ""}" data-a="flip"><div class="flip-in">
      <div class="face front">${cardFront(skinKey())}</div>
      <div class="face back">${cardBack(skinKey(), my)}</div>
    </div></div>
    ${mates.length ? `<div class="card mt"><span class="kicker">Твоя команда</span><div class="mates mt">${mates.map((m) =>
      `<div class="row">${av(m, "sm")}<b>${esc(m.name)}</b><span class="muted small">${esc(m.role.name)}</span></div>`).join("")}</div></div>` : ""}
    ${my.bounty ? `<div class="card mt"><span class="kicker">Твоя цель</span><div class="mt"><b>🎯 ${esc(my.bounty)}</b></div></div>` : ""}
    <button class="btn mt" data-a="seen" ${S.flipOpen ? "" : "disabled"}>Я запомнил(а) — к игре</button>
    ${hostSkip("Начать сразу")}`;
}

/* ---------------------------------------------------------------- карты персонажей */
function cardFront(skin) {
  const fronts = {
    classic: `<div class="cf"><div class="cf-mono">M</div><div class="cf-line">Коснись, чтобы открыть</div></div>`,
    "90s": `<div class="cf"><div class="reels"><i></i><i></i></div><div class="cf-line">▶ PLAY · нажми</div></div>`,
    halloween: `<div class="cf"><div class="cf-moon">☾</div><div class="cf-stars">✦ ✧ ✦</div><div class="cf-line">Открой судьбу</div></div>`,
    bunker: `<div class="cf"><div class="cf-stamp">СЕКРЕТНО</div><div class="cf-line">[ ОТКРЫТЬ ФАЙЛ ]</div></div>`,
    west: `<div class="cf"><div class="cf-star">★</div><div class="cf-line">Переверни листовку</div></div>`,
    office: `<div class="cf"><div class="cf-chip"></div><div class="cf-line">Приложите пропуск</div></div>`,
  };
  return fronts[skin] || fronts.classic;
}

function cardBack(skin, my) {
  const r = my.role;
  const th = theme(S.room.settings.theme);
  const num = th.roles.findIndex((x) => x.key === r.key) + 1;
  const me = player(S.me) || {};
  const team = (SKINS[skin] || SKINS.classic).team[r.team] || "";
  const glyph = PX() ? `<div class="glyph">${Pixel.emoji(r.emoji, 40)}</div>` : `<div class="glyph"><span>${r.emoji}</span></div>`;
  const portrait = !me.photo ? glyph : PX() ? `<div class="portrait">${Pixel.photo(me.photo, 64)}</div>`
    : `<div class="portrait"><img src="${esc(me.photo)}" alt="" referrerpolicy="no-referrer"></div>`;
  const motto = r.motto ? `<div class="rc-motto">«${esc(r.motto)}»</div>` : "";
  const desc = `<div class="rc-desc">${esc(r.desc)}</div>`;
  const evil = r.team !== "town";
  const t = {
    classic: `<div class="rc"><div class="rc-top"><span>№ ${pad(num)}</span><span>${esc(team)}</span></div>
      <div class="rc-art">${glyph}</div><div class="rc-name">${esc(r.name)}</div>${motto}${desc}
      <div class="rc-stamp ${evil ? "evil" : ""}">${evil ? "Семья" : "Город"}</div></div>`,
    "90s": `<div class="rc"><div class="vhs-top"><span>VHS</span><span>SP · 180 MIN</span></div>
      <div class="vhs-label"><div class="rc-art">${glyph}</div><div class="rc-name" data-text="${esc(r.name)}">${esc(r.name)}</div></div>
      <div class="vhs-stripes"><i></i><i></i><i></i></div>${motto}${desc}<div class="vhs-rec"><b>●</b> REC · 1994 · ${esc(team)}</div></div>`,
    halloween: `<div class="rc"><div class="tarot-num">${ROMAN[num - 1] || num}</div><div class="tarot-window">${glyph}</div>
      <div class="rc-name">${esc(r.name)}</div>${motto}${desc}<div class="tarot-team">✦ ${esc(team)} ✦</div></div>`,
    bunker: `<div class="rc"><div class="hazard"></div><div class="file-head"><span>ФАЙЛ № 07-${pad(num)}</span><span>${r.team === "mafia" ? "⚠ БИОУГРОЗА" : "ДОПУСК B"}</span></div>
      <div class="file-row"><div class="rc-art">${glyph}</div><div class="file-data">
        <div><i>СУБЪЕКТ</i>${esc(me.name || "")}</div><div><i>НАЗНАЧЕНИЕ</i>${esc(r.name)}</div>
        <div><i>СТАТУС</i><b class="${r.team === "mafia" ? "bad" : "ok"}">${esc(team)}</b></div></div></div>${motto}${desc}
      <div class="file-foot">&gt; КОНЕЦ ЗАПИСИ_</div></div>`,
    west: `<div class="rc"><div class="wanted">${evil ? "Разыскивается" : r.key === "sheriff" ? "Закон" : "Житель"}</div>
      <div class="wanted-sub">${evil ? "живым или мёртвым" : "Дэд-Крик · 1879"}</div><div class="rc-art">${portrait}</div>
      <div class="rc-name">${esc(r.name)}</div><div class="wanted-who">${esc(me.name || "")}</div>${motto}${desc}
      <div class="reward">${evil ? "Награда · $500" : "★ " + esc(team) + " ★"}</div></div>`,
    office: `<div class="rc"><div class="badge-hole"></div><div class="badge-co"><b>ООО «Вектор»</b><span>${r.team === "mafia" ? "доступ: все этажи" : "сотрудник"}</span></div>
      <div class="badge-main"><div class="rc-art">${portrait}</div><div><div class="badge-name">${esc(me.name || "")}</div>
        <div class="rc-name">${esc(r.name)}</div><div class="badge-dept">${esc(team)}</div></div></div>${motto}${desc}
      <div class="barcode"></div></div>`,
  };
  return `<div class="rc-wrap rc-team-${r.team}">${t[skin] || t.classic}</div>`;
}

function storyBlock(kinds) {
  const r = S.room;
  const items = (r.log || []).filter((e) => e.day === r.day && kinds.includes(e.kind));
  return items.map((e) => `<div class="story ${e.kind}"><div class="event">${esc(e.text)}</div></div>`).join("");
}

function notesBlock() {
  const priv = (S.room.my && S.room.my.private) || [];
  if (!priv.length) return "";
  return `<div class="card mt notes"><b>🗒 Твои заметки</b>${priv.slice().reverse().map((n) => `<div class="n small">${esc(n)}</div>`).join("")}</div>`;
}

function hostSkip(label) {
  return isHost() ? `<div class="hostbar"><button class="btn ghost small grow" data-a="skip">⏭ ${label || "Дальше"}</button></div>` : "";
}

function deadNote() {
  return S.room.my && !S.room.my.alive ? `<div class="card center mt">👻 Ты выбыл(а). Наблюдай и общайся в чате «Морг».</div>` : "";
}

function viewNight() {
  const r = S.room;
  const my = r.my || {};
  const nightLine = (r.log || []).filter((e) => e.kind === "night").slice(-2).map((e) => esc(e.text)).join("<br>");
  let body = "";
  if (my.alive && (my.team_vote || (my.abilities && my.abilities.length))) {
    const alive = r.players.filter((p) => p.alive);
    if (my.team_vote) {
      const voters = {};
      Object.entries(my.team_vote.votes || {}).forEach(([who, t]) => { if (t !== "pass") (voters[t] = voters[t] || []).push(who); });
      body += `<div class="section-title">🩸 ${esc(r.theme.mafia_team)}: ${esc(my.team_vote.label)}</div>
        ${playerTiles(alive, { pick: my.team_vote.targets, sel: my.team_vote.choice, action: "team", voters })}
        <button class="btn ghost small mt" data-a="team" data-v="pass">${my.team_vote.choice === "pass" ? "✓ " : ""}Никого этой ночью</button>`;
    }
    if (my.abilities && my.abilities.length) {
      const own = my.own_choice;
      const ab = my.abilities[Math.min(S.sel.ability, my.abilities.length - 1)];
      const chosen = own && own !== "pass" ? own.target : null;
      body += `<div class="section-title">✨ Твоя способность</div>
        ${my.abilities.length > 1 ? `<div class="ability-tabs">${my.abilities.map((a, i) =>
          `<button class="pill ${a === ab ? "on" : ""}" data-a="ability" data-v="${i}">${esc(a.label)}${a.left != null ? ` · ${a.left}` : ""}</button>`).join("")}</div>` : ""}
        ${own ? `<div class="card small">${own === "pass" ? "Ты решил(а) не действовать этой ночью." :
          `✓ ${esc(my.abilities.find((a) => a.idx === own.idx)?.label || "Выбор")}: <b>${esc(player(own.target)?.name)}</b> — можно изменить`}</div>` : ""}
        ${playerTiles(alive, { pick: ab.targets, sel: S.sel.target || chosen, action: "target" })}
        <div class="row mt"><button class="btn grow" data-a="own" ${S.sel.target ? "" : "disabled"}>${esc(ab.label)}${S.sel.target ? " → " + esc(player(S.sel.target).name) : ""}</button>
          <button class="btn ghost small" data-a="own-pass">Пропустить</button></div>`;
    }
  } else if (my.alive) {
    body = `<div class="sleep"><div class="ph-icon">${icon("night", 72)}</div><h2 class="mt">Ты спишь</h2><p class="muted mt">Жди утра…</p></div>`;
  }
  return `${gamebar(esc(SK().night(r.night)), esc(SK().nightSub))}
    ${phaseHero("night", "", nightLine)}
    ${body}${deadNote()}${notesBlock()}${hostSkip("Закончить ночь")}`;
}

function viewDay() {
  const r = S.room;
  const my = r.my || {};
  const alive = r.players.filter((p) => p.alive);
  const ready = alive.filter((p) => p.ready).length;
  let duel = "";
  if (my.alive && my.abilities && my.abilities.length) {
    const ab = my.abilities[0];
    duel = S.sel.duel
      ? `<div class="card mt"><b>🤠 ${esc(ab.label)}: выбери соперника</b><div class="mt">${playerTiles(alive, { pick: ab.targets, sel: S.sel.target, action: "target" })}</div>
         <div class="row mt"><button class="btn danger grow" data-a="duel" ${S.sel.target ? "" : "disabled"}>Вызвать на дуэль</button>
         <button class="btn ghost small" data-a="duel-cancel">Отмена</button></div></div>`
      : `<button class="btn ghost mt" data-a="duel-open">🤠 ${esc(ab.label)} (осталось: ${ab.left})</button>`;
  }
  return `${gamebar(esc(SK().day(r.day)), esc(SK().discuss))}
    ${phaseHero("day")}
    <div class="card">${storyBlock(["death", "calm", "saved", "silenced", "duel"]) || '<div class="muted">Утро.</div>'}</div>
    ${notesBlock()}
    <div class="section-title">Кто подозрителен? Обсуждайте!</div>
    ${playerTiles(r.players)}
    ${duel}
    ${my.alive ? `<button class="btn mt2" data-a="ready" ${my.ready ? "disabled" : ""}>${my.ready ? "✓ Ты готов(а)" : "✋ Готов(а) голосовать"} · ${ready}/${alive.length}</button>` : deadNote()}
    ${hostSkip("К голосованию")}`;
}

function viewVote() {
  const r = S.room;
  const my = r.my || {};
  const alive = r.players.filter((p) => p.alive);
  const voters = {};
  r.players.forEach((p) => { if (p.vote && p.vote !== "skip") (voters[p.vote] = voters[p.vote] || []).push(p.id); });
  const counts = r.settings.anonymous ? (r.vote_counts || {}) : {};
  const skipVotes = (r.vote_counts || {}).skip || 0;
  const targets = alive.filter((p) => p.id !== S.me).map((p) => p.id);
  let action = "";
  if (my.can_vote) {
    action = `${playerTiles(alive, { pick: targets, sel: my.voted !== "none" ? my.voted : null, action: "vote", voters, counts })}
      <button class="btn ghost mt" data-a="vote" data-v="skip">${my.voted === null ? "✓ " : ""}Воздержаться${skipVotes ? " · " + skipVotes : ""}</button>`;
  } else {
    action = `${playerTiles(alive, { voters, counts })}
      <div class="card center mt">${my.alive ? "🤐 Сегодня ты без голоса" : "👻 Мёртвые не голосуют"}</div>`;
  }
  return `${gamebar(esc(SK().vote), r.settings.anonymous ? "Тайное голосование" : "Открытое голосование")}
    ${phaseHero("vote", "Кого выгоняем?")}
    ${action}${hostSkip("Подвести итог")}`;
}

function viewVerdict() {
  return `${gamebar(esc(SK().verdict), esc(SK().day(S.room.day)))}
    ${phaseHero("verdict")}
    <div class="card">${storyBlock(["out", "vote_none", "bounty"])}</div>
    <div class="section-title">Игроки</div>${playerTiles(S.room.players)}${hostSkip("Наступает ночь")}`;
}

function viewEnd() {
  const r = S.room;
  const iWon = (r.winners || []).includes(S.me);
  const title = { town: r.theme.town_team, mafia: r.theme.mafia_team, solo: "Одиночка" }[r.winner];
  const endText = (r.log || []).filter((e) => e.kind === "end").map((e) => esc(e.text)).join("");
  setTimeout(confetti, 50);
  const rw = S.reward && S.reward.key === store.lastGame ? S.reward.sum : 0;
  return `<div class="win mt"><div class="ph-icon">${icon("end", 64)}</div><div class="small kicker">ПОБЕДА</div>
      <h2>${esc(title)}</h2><p>${endText}</p><p class="mt"><b>${iWon ? "Ты победил(а)!" : "В этот раз не повезло"}</b></p>
      ${rw ? `<div class="reward-coins">${PX() ? Pixel.sprite("coin", 3) : "🪙"} +${rw} монет</div>` : ""}</div>
    <div class="section-title">Кто был кем</div>
    <div class="card final-list">${r.players.map((p) => `<div class="r ${r.winners.includes(p.id) ? "winner" : ""} ${p.alive ? "" : "deadp"}">
      ${av(p, "sm")}
      <div class="grow"><b>${nm(p)}</b>${p.look && Shop.titleText(p.look) ? `<div class="small muted">${esc(Shop.titleText(p.look))}</div>` : ""}<div class="small ${p.role ? "team-" + p.role.team : ""}">${p.role ? `${p.role.emoji} ${esc(p.role.name)}${p.role.converted ? " (обращён)" : ""}` : ""}</div></div>
      <span class="small muted">${p.alive ? "жив" : "✝"}</span></div>`).join("")}</div>
    <div class="section-title">Летопись партии</div>
    <div class="card">${(r.log || []).filter((e) => e.kind !== "night").map((e) => `<div class="story ${e.kind} small">${esc(e.text)}</div>`).join("")}</div>
    ${isHost() ? `<button class="btn mt2" data-a="again">🔁 Ещё партия</button>` : `<div class="card center mt2 muted">Хост может начать новую партию</div>`}
    <button class="btn ghost mt" data-a="leave">Выйти в меню</button>`;
}

function coinRain() {
  for (let i = 0; i < 24; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.innerHTML = PX() ? Pixel.sprite("coin", 3) : "🪙";
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    el.style.animationDelay = Math.random() * 0.5 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

let confettiShown = "";
function confetti() {
  const key = S.room && S.room.code + S.room.version;
  if (!S.room || S.room.phase !== "end" || confettiShown === S.room.code + S.room.night) return;
  confettiShown = S.room.code + S.room.night;
  const items = ["🎉", "✨", "🏆", "🎊", S.room.theme.emoji];
  for (let i = 0; i < 36; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = items[i % items.length];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = 2.5 + Math.random() * 2.5 + "s";
    el.style.animationDelay = Math.random() * 0.8 + "s";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }
  return key;
}

/* ---------------------------------------------------------------- шторки (настройки, роли, чат) */
function renderOverlay() {
  if (!S.sheet) { if (!S.chatOpen) $overlay.innerHTML = ""; return; }
  let body = "";
  if (S.sheet.type === "roles") {
    const th = theme(S.sheet.theme);
    body = `<h2>${th.emoji} ${esc(th.title)}</h2><p class="muted small mt">${esc(th.twist)}</p>
      <div class="roles-list mt">${th.roles.map((r) => {
        const sp = th.specials.find((x) => x.key === r.key);
        return `<div class="r"><div class="e">${r.emoji}</div><div class="grow"><b>${esc(r.name)}</b>
          <span class="small team-${r.team}"> · ${r.team === "mafia" ? "мафия" : r.team === "town" ? "город" : "сам за себя"}</span>
          <div class="small muted">${esc(r.desc)}</div>${sp ? `<div class="small muted">появляется от ${sp.from} игроков</div>` : ""}</div></div>`;
      }).join("")}</div>`;
  } else if (S.sheet.type === "bj-settings") {
    body = S.room ? bjSettingsSheet() : "";
  } else if (S.sheet.type === "rou-settings") {
    body = rouSettingsSheet();
  } else if (S.sheet.type === "draw-settings") {
    body = drawSettingsSheet();
  } else if (S.sheet.type === "battle-setup") {
    body = battleSetupSheet();
  } else if (S.sheet.type === "trade-pick") {
    body = tradePickSheet();
  } else if (S.sheet.type === "case-odds") {
    body = caseOddsSheet(S.sheet.key);
  } else if (S.sheet.type === "pet-mg") {
    body = petMgSheet();
  } else if (S.sheet.type === "craft-done") {
    body = craftDoneSheet();
  } else if (S.sheet.type === "player") {
    body = playerSheet(S.sheet.data);
  } else if (S.sheet.type === "pet-hat") {
    body = petHatSheet();
  } else if (S.sheet.type === "hatch") {
    body = petHatchSheet(S.sheet.id);
  } else if (S.sheet.type === "peek") {
    const pl = player(S.sheet.id);
    body = pl ? peekSheet(pl) : "";
  } else if (S.sheet.type === "settings") {
    const r = S.room;
    const th = theme(r.settings.theme);
    const enabled = r.settings.roles || th.specials.map((s) => s.key);
    body = `<h2>⚙️ Настройки игры</h2>
      <div class="section-title">Сценарий</div>
      <div class="themes">${S.catalog.themes.map((t) => `<button class="theme ${t.key === th.key ? "sel" : ""}" data-a="set-theme" data-v="${t.key}"
        style="${themeBg(t)}"><div class="e">${emo(t.emoji)}</div><b>${esc(t.title)}</b></button>`).join("")}</div>
      <div class="section-title">Темп</div>
      ${S.catalog.modes.map((m) => `<button class="card" style="width:100%;text-align:left;${r.settings.mode === m.key ? "border-color:var(--accent)" : ""}" data-a="set-mode" data-v="${m.key}">
        <b>${m.emoji} ${esc(m.title)}</b>${r.settings.mode === m.key ? " ✓" : ""}<div class="small muted">${esc(m.desc)}</div></button>`).join("")}
      <div class="section-title">Правила</div>
      <div class="card">
        <div class="toggle"><span>Показывать роль выбывших</span><button class="switch ${r.settings.reveal ? "on" : ""}" data-a="set-toggle" data-v="reveal"></button></div>
        <div class="toggle"><span>Тайное голосование</span><button class="switch ${r.settings.anonymous ? "on" : ""}" data-a="set-toggle" data-v="anonymous"></button></div>
      </div>
      <div class="section-title">Особые роли</div>
      <div class="card">${th.specials.map((s) => {
        const role = th.roles.find((x) => x.key === s.key);
        return `<div class="toggle"><span>${role.emoji} ${esc(role.name)} <span class="small muted">от ${s.from}</span></span>
          <button class="switch ${enabled.includes(s.key) ? "on" : ""}" data-a="set-role" data-v="${s.key}"></button></div>`;
      }).join("")}</div>`;
  }
  $overlay.innerHTML = `<div class="sheet" data-a="close-sheet"><div class="sheet-body" data-stop="1" style="overflow-y:auto">
    ${body}<button class="btn ghost mt" data-a="close-sheet">Готово</button></div></div>`;
  if (PX()) Pixel.apply($overlay);
}

const CHANNELS = { all: "💬 Общий", mafia: "🩸 Команда", dead: "👻 Морг" };

function renderChat() {
  const r = S.room;
  const badge = document.getElementById("chat-badge");
  if (r && badge) {
    const unread = Object.entries(r.chat || {}).reduce((n, [ch, list]) => n + Math.max(0, list.length - (S.seen[ch] || 0)), 0);
    badge.innerHTML = unread && !S.chatOpen ? `<span class="badge">${unread}</span>` : "";
  }
  if (!S.chatOpen || !r) {
    if (!S.sheet) $overlay.innerHTML = "";
    return;
  }
  const chans = Object.keys(r.chat || {});
  if (!chans.includes(S.chatTab)) S.chatTab = chans[0] || "all";
  const list = (r.chat || {})[S.chatTab] || [];
  S.seen[S.chatTab] = list.length;
  const canWrite = (r.can_write || []).includes(S.chatTab);
  let sheet = document.getElementById("chat-sheet");
  if (!sheet) {
    $overlay.innerHTML = `<div class="sheet" id="chat-sheet" data-a="chat-close"><div class="sheet-body" data-stop="1">
      <div class="row" id="chat-tabs"></div><div class="msgs" id="msgs"></div><div id="chat-form"></div></div></div>`;
    sheet = document.getElementById("chat-sheet");
  }
  document.getElementById("chat-tabs").innerHTML = chans.map((c) =>
    `<button class="pill ${c === S.chatTab ? "on" : ""}" data-a="chat-tab" data-v="${c}">${CHANNELS[c]}</button>`).join("") +
    `<span class="grow"></span><button class="pill" data-a="chat-close">✕</button>`;
  const box = document.getElementById("msgs");
  box.innerHTML = list.length ? list.map((m) => `<div class="msg ${m.from === S.me ? "mine" : ""}">${av(m)}
    <div class="b">${m.from === S.me ? "" : `<div class="who">${esc(m.name)}</div>`}${esc(m.text)}</div></div>`).join("")
    : `<div class="muted center mt2">Пока тихо…</div>`;
  box.scrollTop = box.scrollHeight;
  if (PX()) Pixel.apply(box);
  const form = document.getElementById("chat-form");
  const want = canWrite ? "write" : "closed";
  if (form.dataset.mode !== want || form.dataset.ch !== S.chatTab) {
    form.dataset.mode = want;
    form.dataset.ch = S.chatTab;
    form.innerHTML = canWrite
      ? `<form class="chat-form" id="chat-send"><input class="input" id="chat-input" maxlength="300" placeholder="Сообщение…" autocomplete="off">
         <button class="btn" type="submit">➤</button></form>`
      : `<div class="muted small center mt">Сейчас писать сюда нельзя${r.phase === "night" ? " — ночь" : ""}</div>`;
  }
}

/* ---------------------------------------------------------------- действия */
const actions = {
  avatar: (v) => { S.regAvatar = v; haptic(); render(); },
  "pixel-toggle": () => { store.pixel = !S.pixel; S.pixel = store.pixel; saveProfile(); render(); },
  "photo-toggle": () => { store.use_photo = !(store.use_photo !== false); saveProfile(); syncProfile(); render(); },
  register: () => {
    const name = (document.getElementById("reg-name").value || "").trim();
    if (!name) return toast("Введите имя");
    S.regName = name;
    store.name = name.slice(0, 20);
    store.avatar = S.regAvatar || store.avatar || "🙂";
    saveProfile();
    syncProfile();
    if (S.screen === "profile") toast("Сохранено ✓");
    else {
      S.registered = true; S.screen = "home";
      if (S.pendingRoom) return joinRoom(S.pendingRoom);
      render();
    }
    haptic("medium");
  },
  shop: () => { S.screen = "shop"; render(); },
  "shop-cat": (v) => { S.shopCat = v; S.shopTry = null; haptic(); render(); },
  "shop-try": (v) => { S.shopTry = { cat: S.shopCat || "frame", id: v }; haptic(); render(); },
  "shop-equip": () => { const it = Shop.byId(S.shopTry.cat, S.shopTry.id); if (Shop.equip(it)) { saveProfile(); syncProfile(); haptic("medium"); toast("Надето ✓"); render(); } },
  chest: () => {
    if (Api.on && Api.ready) {                               // сундук на сервере: монеты и крошечный шанс на яйцо
      return Api.act("/api/chest", {}).then((st) => {
        store.chest = new Date().toISOString().slice(0, 10); saveProfile();
        notify("success"); toast(st.egg ? `Сундук: +${st.got} монет и… ЯЙЦО! 🥚` : `Сундук: +${st.got} монет!`); coinRain(); render();
      }).catch((e) => { store.chest = new Date().toISOString().slice(0, 10); saveProfile(); toast(e.message); render(); });
    }
    const sum = Shop.openChest();
    if (!sum) return;
    saveProfile(); notify("success"); toast(`Сундук: +${sum} монет!`);
    coinRain(); render();
  },
  peek: (v) => { S.sheet = { type: "peek", id: v }; haptic(); renderOverlay(); },
  "cancel-join": () => { Net.stop(); S.screen = "home"; render(); },
  tab: (v) => { S.screen = v; S.regName = ""; S.regAvatar = null; if (v === "shop") S.shopTry = null; render(); window.scrollTo(0, 0); },
  go: (v) => { S.screen = v; if (v === "petfun") { S.funFrom = "solo"; S.fun = null; } render(); window.scrollTo(0, 0); },
  "pet-games": () => { S.funFrom = "home"; S.fun = null; S.screen = "petfun"; render(); window.scrollTo(0, 0); },
  theme: (v) => { S.setup.theme = v; haptic(); render(); },
  roles: (v) => { S.sheet = { type: "roles", theme: v }; renderOverlay(); },
  create: () => {
    haptic("medium");
    S.screen = "connecting"; S.joining = ""; render();
    Net.host({ theme: S.setup.theme }).catch((e) => { toast(e.message); S.screen = "mafia"; render(); });
  },
  join: () => {
    const code = (document.getElementById("join-code").value || "").trim().toUpperCase();
    if (code.length !== 4) return toast("Код — 4 символа");
    joinRoom(code);
  },
  leave: () => {
    const go = () => send({ t: "leave" });
    if (S.room && !["lobby", "end"].includes(S.room.phase)) {
      if (tg) tg.showConfirm("Выйти из игры?", (ok) => ok && go()); else if (confirm("Выйти из игры?")) go();
    } else go();
  },
  copy: () => { navigator.clipboard && navigator.clipboard.writeText(S.room.code); toast("Код скопирован"); haptic(); },
  share: () => {
    const code = S.room.code;
    const link = S.bot ? (S.miniapp ? `https://t.me/${S.bot}/${S.miniapp}?startapp=${code}` : `https://t.me/${S.bot}?start=${code}`)
      : `${location.origin}${location.pathname}?room=${code}`;
    const game = { draw: "Го в рисовалку!", roulette: "Спускайся в подвал. Один дробовик, один стол.", blackjack: "Садись за стол, раздаю!" }[S.room.game] || "Го в мафию!";
    const text = `${game} ${S.room.theme.emoji} «${S.room.theme.title}». Код комнаты: ${code}`;
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    else if (navigator.share) navigator.share({ title: S.room.theme.title, text, url: link }).catch(() => {});
    else { navigator.clipboard && navigator.clipboard.writeText(`${text}\n${link}`); toast("Приглашение скопировано"); }
  },
  kick: (v) => send({ t: "kick", id: v }),
  settings: () => { S.sheet = { type: "settings" }; renderOverlay(); },
  "set-theme": (v) => send({ t: "settings", settings: { theme: v } }),
  "set-mode": (v) => send({ t: "settings", settings: { mode: v } }),
  "set-toggle": (v) => send({ t: "settings", settings: { [v]: !S.room.settings[v] } }),
  "set-role": (v) => {
    const th = theme(S.room.settings.theme);
    let roles = S.room.settings.roles || th.specials.map((s) => s.key);
    roles = roles.includes(v) ? roles.filter((x) => x !== v) : roles.concat([v]);
    send({ t: "settings", settings: { roles } });
  },
  "close-sheet": () => {
    if (S.sheet && S.sheet.type === "trade-pick") return tradePickSave();                    // закрыл выбор — сохраняем
    S.sheet = null; renderOverlay();
  },
  start: () => { send({ t: "start" }); haptic("heavy"); },
  flip: () => { if (!S.flipOpen) { S.flipOpen = true; haptic("heavy"); render(); } },
  seen: () => { send({ t: "seen" }); toast("Ждём остальных…"); },
  team: (v) => { send({ t: "act", slot: "team", target: v }); haptic(); },
  ability: (v) => { S.sel.ability = Number(v); S.sel.target = null; render(); },
  target: (v) => { S.sel.target = v; haptic(); render(); },
  own: () => {
    const ab = S.room.my.abilities[Math.min(S.sel.ability, S.room.my.abilities.length - 1)];
    send({ t: "act", slot: "own", ability: ab.idx, target: S.sel.target }); haptic("medium"); S.sel.target = null;
  },
  "own-pass": () => send({ t: "act", slot: "own", target: "pass" }),
  ready: () => { send({ t: "act", slot: "ready" }); haptic(); },
  "duel-open": () => { S.sel.duel = true; render(); },
  "duel-cancel": () => { S.sel.duel = false; S.sel.target = null; render(); },
  duel: () => {
    const ab = S.room.my.abilities[0];
    send({ t: "act", slot: "own", ability: ab.idx, target: S.sel.target }); notify("warning"); S.sel.duel = false;
  },
  vote: (v) => { send({ t: "act", slot: "vote", target: v === "skip" ? null : v }); haptic("medium"); },
  skip: () => send({ t: "skip" }),
  again: () => send({ t: "again" }),
  chat: () => { S.chatOpen = true; renderChat(); },
  "chat-close": () => { S.chatOpen = false; $overlay.innerHTML = ""; renderChat(); },
  "chat-tab": (v) => { S.chatTab = v; renderChat(); },
};

Object.assign(actions, DRAW_ACTIONS, ROU_ACTIONS, BJ_ACTIONS, PET_ACTIONS, LIFE_ACTIONS, CASE_ACTIONS, BATTLE_ACTIONS, TRADE_ACTIONS, SOLO_ACTIONS);

document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-a]");
  if (!el) return;
  const stop = e.target.closest("[data-stop]");
  if (stop && el.contains(stop) && el !== e.target.closest("[data-a]")) return;
  if (stop && !stop.contains(el)) return;                       // клик внутри шторки не закрывает её
  const fn = actions[el.dataset.a];
  if (fn) { e.preventDefault(); fn(el.dataset.v); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "join-code") { e.target.value = e.target.value.toUpperCase(); S.joinCode = e.target.value; }
  if (e.target.id === "reg-name") S.regName = e.target.value;
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "chat-send") return;
  e.preventDefault();
  const input = document.getElementById("chat-input");
  if (input.value.trim()) send({ t: "chat", channel: S.chatTab, text: input.value });
  input.value = "";
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.id === "join-code") actions.join();
  if (e.key === "Enter" && e.target.id === "promo-code") actions.promo();
});

setInterval(() => {
  const num = document.getElementById("timer-num");
  const arc = document.getElementById("timer-arc");
  const box = document.getElementById("timer");
  if (!num || !S.room || !S.room.deadline) return;
  const left = remaining();
  num.textContent = fmtTime(left);
  if (!arc) { num.parentNode.classList.toggle("low", left <= 5); return; }
  const c = 2 * Math.PI * 25;
  arc.setAttribute("stroke-dashoffset", c * (1 - Math.max(0, Math.min(1, left / Number(box.dataset.total)))));
  if (left <= 5) arc.setAttribute("stroke", "var(--bad)");
}, 250);

if (tg) {
  tg.ready();
  tg.expand();
  try { tg.disableVerticalSwipes(); } catch (e) { /* старый клиент */ }
  tg.BackButton.onClick(() => {
    if (caseBack()) return;                                                                 // открытие кейса
    if (S.sheet || S.chatOpen) { S.sheet = null; S.chatOpen = false; $overlay.innerHTML = ""; renderChat(); return; }   // сначала закрыть шторку
    if (S.screen === "room") actions.leave();
    else if (S.screen === "pets" && S.battleCode) actions["battle-back"]();
    else if (S.screen === "pets" && S.tradeCode) actions["trade-back"]();
    else if (S.screen === "pets" && S.tourId) actions["tour-back"]();
    else if (S.screen.startsWith("solo-")) { S.screen = "solo"; render(); }
    else if (S.screen === "petfun") { if (S.fun) { S.fun = null; render(); } else { S.screen = S.funFrom || "solo"; render(); } }
    else if (S.screen === "pets" && S.petSel) actions["pets-back"]();
    else { S.screen = "home"; render(); }
  });
}
function syncProfile() { if (S.room) send({ t: "profile", profile: Net.profile() }); }

boot();
