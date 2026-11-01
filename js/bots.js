/* Боты для проверки игр — только у администратора (тестовая версия).
   Бот — игрок, которого «держит» телефон хоста: входит в комнату и сам делает ходы во всех режимах
   (мафия, рисовалка, «Последний заряд», блэкджек). Обычные игроки кнопок не видят. */
"use strict";

const Bots = (() => {
  const NAMES = ["Бот Пиксель", "Бот Груша", "Бот Байт", "Бот Кекс", "Бот Тостер", "Бот Мармелад", "Бот Чип", "Бот Дейл", "Бот Шарик", "Бот Вафля", "Бот Ватт", "Бот Бублик",
    "Бот Сосиска", "Бот Квант", "Бот Пончик", "Бот Гном", "Бот Лимон", "Бот Ёжик", "Бот Мурзик"];
  const AVA = ["🤖", "👾", "🦾", "🛸", "🧸", "🐙", "🦊", "🐸", "🐼", "🦉"];
  const SAY = ["Я мирный, честно!", "Мне кажется, это {n}", "{n} ведёт себя подозрительно", "Я ничего не видел 👀", "Давайте не торопиться", "Голосую за {n}!", "Хм…", "Это точно не я"];
  const GUESS = ["кот", "дом", "солнце", "машина", "рыба", "дерево", "собака", "ракета", "цветок", "торт", "гриб", "луна"];
  const isBot = (pid) => /^bot_/.test(String(pid));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const hub = () => (typeof Net !== "undefined" && Net.isHost() ? Net._hub() : null);
  const wait = {};                                                     // бот «думает» перед ходом
  let timer = null, seq = 0;

  const allowed = () => !!(typeof Api !== "undefined" && Api.on && Api.state && Api.state.admin);
  function add() {
    const h = hub();
    if (!h || !allowed()) return toast("Боты — только у администратора, и только в своей комнате");
    const room = h.room, used = room.order.map((p) => room.members[p].name);
    const id = "bot_" + Date.now().toString(36) + (seq++);
    const name = NAMES.find((x) => !used.includes(x)) || "Бот №" + (room.order.length + 1);
    h.handle(id, { t: "hello", profile: { name, avatar: pick(AVA), look: { c: "999", frame: pick(["none", "wood", "gold", "neon"]) } } });
    if (room.kind === "blackjack" && room.settings.stake) { room.updateSettings({ stake: 0 }); toast("С ботами — только на интерес, без монет"); }
    h.push(); start();
  }
  function removeAll() {
    const h = hub(); if (!h) return;
    h.room.order.filter(isBot).forEach((id) => h.handle(id, { t: "leave" }));
  }
  function start() { if (!timer) timer = setInterval(tick, 600); }
  const act = (h, id, msg) => { h.handle(id, Object.assign({ t: "act" }, msg)); wait[id] = Date.now() + 1200 + Math.random() * 2500; };

  function tick() {
    const h = hub();
    if (!h) return;
    const room = h.room, bots = room.order.filter((p) => isBot(p) && room.members[p] && room.members[p].online);
    for (const id of bots) {
      if (Date.now() < (wait[id] || 0)) continue;
      try {
        if (room.kind === "draw") drawBot(h, room, id);
        else if (room.kind === "roulette") rouletteBot(h, room, id);
        else if (room.kind === "blackjack") bjBot(h, room, id);
        else mafiaBot(h, room, id);
      } catch (e) { wait[id] = Date.now() + 3000; }
    }
  }

  /* ---------- мафия */
  function mafiaBot(h, room, id) {
    if (!room.game) return;
    const v = room.view(id), my = v.my;
    if (v.phase === "reveal" && !room.seen_reveal.has(id)) { h.handle(id, { t: "seen" }); wait[id] = Date.now() + 800; return; }
    if (!my || !my.alive) return;
    const others = v.players.filter((p) => p.alive && p.id !== id);
    if (v.phase === "night") {
      if (my.team_vote && !my.team_vote.choice && my.team_vote.targets.length) return act(h, id, { slot: "team", target: pick(my.team_vote.targets) });
      if (my.abilities && my.abilities.length && my.own_choice == null) {
        const ab = my.abilities.filter((a) => a.left !== 0 && a.targets.length);
        return ab.length ? (() => { const a = pick(ab); act(h, id, { slot: "own", ability: a.idx, target: pick(a.targets) }); })() : act(h, id, { slot: "own", target: "pass" });
      }
    }
    if (v.phase === "day" && !my.ready) {
      if (Math.random() < .5 && others.length && (v.can_write || []).includes("all")) h.handle(id, { t: "chat", channel: "all", text: pick(SAY).replace("{n}", pick(others).name) });
      return act(h, id, { slot: "ready" });
    }
    if (v.phase === "vote" && my.can_vote && my.voted === "none") act(h, id, { slot: "vote", target: Math.random() < .15 || !others.length ? null : pick(others).id });
  }

  /* ---------- рисовалка: бот рисует каракули и угадывает (иногда правильно) */
  function drawBot(h, room, id) {
    const me = room.drawer === id;
    if (room.phase === "choose" && me) return act(h, id, { slot: "pick", target: Math.floor(Math.random() * 3) });
    if (room.phase === "draw" && me) {
      room._botInk = room._botInk || 0;
      if (room._botInk >= 7) { room._botInk = 0; return act(h, id, { slot: "done" }); }
      room._botInk++;
      const S = 160, cx = 30 + Math.random() * 100, cy = 30 + Math.random() * 100, r = 10 + Math.random() * 30, pts = [];
      if (Math.random() < .5) for (let a = 0; a <= 6.4; a += .4) pts.push(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r));
      else for (let i = 0; i < 6; i++) pts.push(Math.round(Math.random() * S), Math.round(Math.random() * S));
      h.handle(id, { t: "ink", op: { k: "s", c: Math.floor(Math.random() * 8), w: 4, p: pts } });
      wait[id] = Date.now() + 700;
      return;
    }
    if (room.phase === "guess" && !me && room.guesses && !room.guesses[id]) return act(h, id, { slot: "guess", text: Math.random() < .45 && room.word ? room.word : pick(GUESS) });
    if (room.phase === "judge" && me) act(h, id, { slot: "award" });
  }

  /* ---------- «Последний заряд» */
  function rouletteBot(h, room, id) {
    if (!(room.hp && room.hp[id] > 0)) return;
    if (room.phase === "load" && !room.contrib[id]) return act(h, id, { slot: "load", value: Math.random() < .5 ? "live" : "blank" });
    if (room.phase === "play" && room.turn === id) {
      const others = Object.keys(room.hp).filter((p) => room.hp[p] > 0 && p !== id);
      if (!room.aim) return act(h, id, { slot: "aim", target: Math.random() < .2 || !others.length ? id : pick(others) });
      act(h, id, { slot: "shoot", target: room.aim });
    }
  }

  /* ---------- блэкджек: берёт до 17 */
  const bjTotal = (cards) => { let t = 0, a = 0; cards.forEach((c) => { const r = c.slice(0, -1); if (r === "A") { a++; t += 11; } else t += ["J", "Q", "K"].includes(r) ? 10 : Number(r); }); while (t > 21 && a) { t -= 10; a--; } return t; };
  function bjBot(h, room, id) {
    if (room.phase === "bet" && !(id in room.joined)) return act(h, id, { slot: "bet", play: true, seed: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("") });
    if (room.phase === "play" && room.turn === id) { const hand = room.hands[id]; act(h, id, { slot: hand && bjTotal(hand.cards) < 17 ? "hit" : "stand" }); }
  }

  // кнопки в лобби: только админ и только хост своей комнаты
  function bar(room) {
    if (!allowed() || !Net.isHost() || !room || !["lobby", "end"].includes(room.phase)) return "";
    const n = room.players ? room.players.filter((p) => isBot(p.id)).length : 0;
    return `<div class="card bot-bar"><div class="grow small">🤖 <b>Тест с ботами</b> — видно только админу${n ? ` · ботов: ${n}` : ""}</div>
      <button class="btn small" data-a="bot-add">＋ Бот</button>${n ? `<button class="btn ghost small" data-a="bot-clear">Убрать</button>` : ""}</div>`;
  }

  // после перезапуска приложения хост снова «ведёт» ботов из сохранённой комнаты
  setInterval(() => { const h = hub(); if (h && !timer && h.room.order.some(isBot)) start(); }, 3000);

  return { add, removeAll, bar, isBot, ACTIONS: { "bot-add": add, "bot-clear": removeAll } };
})();
