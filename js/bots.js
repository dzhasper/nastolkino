/* Боты: любой хост может добавить их в свою комнату в любом режиме.
   Бот — игрок, которого «держит» телефон хоста: входит в комнату и сам ходит во всех режимах.
   Боты не подглядывают: в мафии знают только свою роль, свои проверки, открытые роли погибших, голоса и чат;
   в «Последнем заряде» считают патроны по выстрелам и своим предметам; в блэкджеке видят только открытые карты. */
"use strict";

const Bots = (() => {
  const NAMES = ["Бот Піксель", "Бот Груша", "Бот Байт", "Бот Кекс", "Бот Тостер", "Бот Мармелад", "Бот Чип", "Бот Дейл", "Бот Кулька", "Бот Вафелька", "Бот Ват", "Бот Бублик",
    "Бот Сосиска", "Бот Квант", "Бот Пончик", "Бот Гном", "Бот Лимон", "Бот Їжачок", "Бот Мурчик"];
  const AVA = ["🤖", "👾", "🦾", "🛸", "🧸", "🐙", "🦊", "🐸", "🐼", "🦉"];
  const isBot = (pid) => /^bot_/.test(String(pid));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const chance = (p) => Math.random() < p;
  const hub = () => (typeof Net !== "undefined" && Net.isHost() ? Net._hub() : null);
  const wait = {};                                                     // бот «думает» перед ходом
  let timer = null, seq = 0;
  const mem = (room, id) => { room._ai = room._ai || {}; return room._ai[id] = room._ai[id] || {}; };   // память бота (в сохранение комнаты не попадает)
  const think = (id, a, b) => { wait[id] = Date.now() + a + Math.random() * (b - a); };

  const allowed = () => true;                                         // боты доступны всем (раньше — только админу)
  function add() {
    const h = hub();
    if (!h || !allowed()) return toast("Ботів додає лише хост — у своїй кімнаті");
    if (h.room.settings && h.room.settings.tour) return toast("У турнірі ботів немає — лише живі суперники");
    if (h.room.kind === "draw" || h.room.kind === "spy") return toast(h.room.kind === "spy" ? "У «Шпигуні» ботів немає — тут потрібне живе спілкування" : "У малювалці ботів немає — лише живі художники");
    const room = h.room, used = room.order.map((p) => room.members[p].name);
    const id = "bot_" + Date.now().toString(36) + (seq++);
    const name = NAMES.find((x) => !used.includes(x)) || "Бот №" + (room.order.length + 1);
    h.handle(id, { t: "hello", profile: { name, avatar: pick(AVA), look: { c: "999", frame: pick(["none", "wood", "gold", "neon"]) } } });
    if (["blackjack", "roulette", "revolver", "bluff"].includes(room.kind) && room.settings.stake) { room.updateSettings({ stake: 0 }); toast("З ботами — лише на інтерес, без монет"); }
    h.push(); start();
  }
  function removeAll() {
    const h = hub(); if (!h) return;
    h.room.order.filter(isBot).forEach((id) => h.handle(id, { t: "leave" }));
  }
  function start() { if (!timer) timer = setInterval(tick, 500); }
  const act = (h, id, msg, a = 1200, b = 3500) => { h.handle(id, Object.assign({ t: "act" }, msg)); think(id, a, b); };
  const say = (h, room, id, text) => { if (text) h.handle(id, { t: "chat", channel: "all", text }); };

  function tick() {
    const h = hub();
    if (!h) return;
    const room = h.room, bots = room.order.filter((p) => isBot(p) && room.members[p] && room.members[p].online);
    for (const id of bots) {
      if (Date.now() < (wait[id] || 0)) continue;
      try {
        if (room.kind === "draw") drawBot(h, room, id);
        else if (room.kind === "roulette") rouletteBot(h, room, id);
        else if (room.kind === "revolver") revolverBot(h, room, id);
        else if (room.kind === "bluff") bluffBot(h, room, id);
        else if (room.kind === "blackjack") bjBot(h, room, id);
        else if (room.kind === "mchess") mchessBot(h, room, id);
        else mafiaBot(h, room, id);
      } catch (e) { think(id, 2500, 3500); if (Bots.debug) console.error(e); }
    }
  }

  /* ================================================================ мафия */
  const CLEAN = /не мафі|не мафи|чист|мирн|довір|доверя|вірю|верю|не він|не вона|не он|не она|невинн|невинов/i, ACCUSE = /мафі|мафи|підозр|подозр|голосу|вбивц|убивц|убийц|бреш|бреше|врёт|врет|лжёт|лжет|дон|вампір|вампир|перевер|оборот|маніяк|маньяк|страт|казн|він\b|вона\b|он\b|она\b/i;
  function mafiaKnow(room, id) {
    const g = room.game, me = g.players[id], m = mem(room, id), names = {};
    if (m.game !== g) Object.assign(m, { game: g, sus: {}, known: {}, claims: {}, priv: 0, chat: 0, votedDays: {}, saidDay: 0, said: 0, accusedMe: null, checked: {} });
    Object.values(g.players).forEach((p) => { names[p.name.toLowerCase()] = p.id; });
    const byName = (s) => { s = String(s || "").trim().toLowerCase(); if (names[s]) return names[s]; const k = Object.keys(names).find((n) => s.startsWith(n)); return k ? names[k] : null; };
    const theme = g.theme;
    // свои ночные результаты
    me.private.slice(m.priv).forEach((t) => {
      const r = /Ніч \d+: (.+?) — (.+)$/.exec(t);
      if (!r) return;
      const pid = byName(r[1]); if (!pid) return;
      const res = r[2];
      if (/🔴/.test(res)) m.known[pid] = "mafia";
      else if (/🟢/.test(res)) m.known[pid] = "town";
      else if (/це .+🎯/.test(res)) m.known[pid] = "sheriff";
      else if (/^не /.test(res)) m.checked[pid] = true;
      else {                                                     // проверка роли: ищем роль по названию
        const role = Object.values(theme.roles).find((x) => res.includes(x.name));
        m.known[pid] = /навернен/.test(res) || (role && role.team === "mafia") ? "mafia" : role && role.team === "solo" ? "solo" : "town";
      }
      m.checked[pid] = true;
    });
    m.priv = me.private.length;
    // открытые роли погибших
    if (room.settings.reveal) Object.values(g.players).forEach((p) => { if (!p.alive) m.known[p.id] = p.team === "mafia" ? "mafia" : p.team; });
    // итоги голосований: кто голосовал против мирного — подозрителен
    if (["verdict", "night", "end"].includes(room.phase) && g.day && !m.votedDays[g.day] && !room.settings.anonymous && Object.keys(g.votes).length) {
      m.votedDays[g.day] = true;
      const cnt = {}; Object.values(g.votes).forEach((t) => { if (t) cnt[t] = (cnt[t] || 0) + 1; });
      const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], out = top && !g.players[top].alive ? g.players[top] : null;   // казнённый — лидер голосования, который выбыл
      if (out && room.settings.reveal) Object.entries(g.votes).forEach(([v, t]) => {
        if (v === id) return;
        if (t === out.id) m.sus[v] = (m.sus[v] || 0) + (out.team === "mafia" ? -1 : 1.5);
        else m.sus[v] = (m.sus[v] || 0) + (out.team === "mafia" ? .8 : -.3);
      });
    }
    // чат: заявки на роли, обвинения
    const chat = room.chat.all;
    chat.slice(m.chat).forEach((c) => {
      if (c.from === id || !g.players[c.from]) return;
      const text = c.text.toLowerCase();
      const ment = Object.values(g.players).filter((p) => p.id !== c.from && text.includes(p.name.toLowerCase()));
      const claim = Object.entries(theme.roles).find(([k, r]) => r.team === "town" && k !== "civ" && /\bя\b/.test(text) && text.includes(r.name.toLowerCase()));
      if (claim) {
        m.claims[c.from] = claim[0];
        if (me.role === claim[0] && me.team === "town") m.sus[c.from] = (m.sus[c.from] || 0) + 4;   // самозванец: эта роль у меня!
        else m.sus[c.from] = (m.sus[c.from] || 0) - .6;
      }
      ment.forEach((p) => {
        const defend = CLEAN.test(text), accuse = !defend && ACCUSE.test(text);
        if (!accuse) return;
        if (p.id === id) { m.accusedMe = c.from; if (me.team !== "mafia") m.sus[c.from] = (m.sus[c.from] || 0) + .9; }
        else if (m.known[p.id] === "mafia") m.sus[c.from] = (m.sus[c.from] || 0) - .5;
        else if (m.known[p.id] === "town") m.sus[c.from] = (m.sus[c.from] || 0) + .5;
        m.heat = m.heat || {}; m.heat[p.id] = (m.heat[p.id] || 0) + 1;     // кого обсуждают
      });
    });
    m.chat = chat.length;
    return m;
  }
  const teamOf = (g, pid) => g.players[pid].team;
  function mafiaBot(h, room, id) {
    const g = room.game;
    if (!g) return;
    const v = room.view(id), my = v.my, me = g.players[id];
    if (v.phase === "reveal" && !room.seen_reveal.has(id)) { h.handle(id, { t: "seen" }); think(id, 600, 1500); return; }
    if (!my || !my.alive) return;
    const m = mafiaKnow(room, id), mafia = me.team === "mafia", solo = me.team === "solo", theme = g.theme;
    const alive = g.alive().filter((p) => p.id !== id), mates = mafia ? alive.filter((p) => p.team === "mafia") : [];
    const nm = (pid) => g.players[pid].name;
    const sus = (pid) => (m.known[pid] === "mafia" ? 100 : m.known[pid] === "town" || m.known[pid] === "sheriff" ? -100 : (m.sus[pid] || 0) + (m.heat && m.heat[pid] || 0) * .15);
    const key = (x) => (x && x.id ? x.id : x);
    const mostSus = (list) => list.slice().sort((a, b) => sus(key(b)) - sus(key(a)) || Math.random() - .5)[0];
    const threat = (pid) => (m.known[pid] === "sheriff" ? 10 : 0) + (m.claims[pid] ? 4 : 0) + (m.accusedMates && m.accusedMates[pid] || 0) + Math.random();
    if (mafia) { m.accusedMates = {}; room.chat.all.forEach((c) => { if (mates.some((x) => c.text.toLowerCase().includes(x.name.toLowerCase()) && c.from !== x.id) && !CLEAN.test(c.text)) m.accusedMates[c.from] = (m.accusedMates[c.from] || 0) + 2; }); }

    if (v.phase === "night") {
      if (my.team_vote && !my.team_vote.choice && my.team_vote.targets.length) {
        const tv = Object.values(my.team_vote.votes || {}).filter((t) => my.team_vote.targets.includes(t));
        const target = tv.length ? tv.sort((a, b) => tv.filter((x) => x === b).length - tv.filter((x) => x === a).length)[0]   // поддерживаем своих
          : my.team_vote.targets.slice().sort((a, b) => threat(b) - threat(a))[0];
        return act(h, id, { slot: "team", target });
      }
      if (my.abilities && my.abilities.length && my.own_choice == null) {
        const use = my.abilities.filter((a) => a.left !== 0 && a.targets.length);
        for (const a of use) {
          const T = a.targets, unk = T.filter((t) => !m.checked[t] && !m.known[t]);
          let target = null;
          if (a.kind === "check_team" || a.kind === "check_role") target = unk.length ? mostSus(unk) : null;
          else if (a.kind === "find_sheriff") target = unk.length ? T.filter((t) => !m.checked[t]).sort((x, y) => threat(y) - threat(x))[0] : null;
          else if (a.kind === "heal") {
            const claimed = T.filter((t) => m.claims[t] || m.known[t] === "sheriff" || m.known[t] === "town");
            target = T.includes(id) && chance(.35) ? id : claimed.length && chance(.6) ? pick(claimed) : T.slice().sort((x, y) => sus(x) - sus(y))[0];
          } else if (a.kind === "block") target = mafia ? T.filter((t) => teamOf(g, t) !== "mafia").sort((x, y) => threat(y) - threat(x))[0] : mostSus(T);
          else if (a.kind === "convert") target = T.sort((x, y) => threat(y) - threat(x))[0];
          else if (a.kind === "kill" || a.kind === "shot") {
            if (solo) target = T.sort((x, y) => threat(y) - threat(x))[0];
            else if (mafia) target = T.filter((t) => teamOf(g, t) !== "mafia").sort((x, y) => threat(y) - threat(x))[0];
            else { const s = mostSus(T); target = s && sus(s) >= 2 ? s : null; }   // мирный стреляет, только если почти уверен
          } else target = mostSus(T);
          if (target) return act(h, id, { slot: "own", ability: a.idx, target });
        }
        return act(h, id, { slot: "own", target: "pass" });
      }
      return;
    }

    if (v.phase === "day") {
      // дуэль — только против того, кто точно мафия
      const duel = my.abilities && my.abilities.find((a) => a.kind === "duel" && a.left !== 0);
      const sure = alive.find((p) => m.known[p.id] === "mafia");
      if (duel && sure && !mafia && chance(.5)) return act(h, id, { slot: "own", ability: duel.idx, target: sure.id });
      if (m.saidDay !== g.day) { m.saidDay = g.day; m.said = 0; }
      if (m.said < 2 && (v.can_write || []).includes("all") && chance(.85)) {
        m.said++;
        const line = mafiaLine(room, g, id, m, { mafia, solo, alive, mates, sus, threat, nm, mostSus, theme });
        if (line) { say(h, room, id, line); think(id, 1800, 4200); return; }
      }
      if (!my.ready) return act(h, id, { slot: "ready" }, 1500, 3000);
      return;
    }

    if (v.phase === "vote" && my.can_vote && my.voted === "none") {
      if (!m.voteWait) { m.voteWait = Date.now() + 2500 + Math.random() * 4000; return; }   // сначала посмотреть, как голосуют другие
      if (Date.now() < m.voteWait) return;
      m.voteWait = 0;
      const votes = Object.entries(g.votes).filter(([, t]) => t), cnt = {};
      votes.forEach(([, t]) => { cnt[t] = (cnt[t] || 0) + 1; });
      const lead = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
      let target;
      if (mafia) {
        const town = alive.filter((p) => p.team !== "mafia");
        target = lead && teamOf(g, lead) !== "mafia" && lead !== id ? lead : town.sort((a, b) => threat(b.id) - threat(a.id))[0];
        target = target && target.id ? target.id : target;
      } else if (me.bounty_target && g.players[me.bounty_target].alive) target = me.bounty_target;
      else {
        const sure = alive.find((p) => m.known[p.id] === "mafia");
        const best = mostSus(alive);
        if (sure) target = sure.id;
        else if (lead && lead !== id && sus(lead) > -1 && (!best || sus(lead) >= sus(best.id) - 1)) target = lead;   // поддержать разумное большинство
        else if (best && sus(best.id) > .4) target = best.id;
        else target = g.day <= 1 && chance(.4) ? null : best ? best.id : null;
      }
      if (target === id) target = null;
      h.handle(id, { t: "act", slot: "vote", target: target || null });
      think(id, 800, 1500);
    }
  }
  // что сказать днём: по фактам, а не наугад
  function mafiaLine(room, g, id, m, c) {
    const { mafia, alive, mates, sus, nm, mostSus, theme } = c;
    const me = g.players[id], role = g.role(me);
    const dead = Object.values(g.players).filter((p) => !p.alive && p.id !== id);
    const lastDead = g.log.slice().reverse().find((e) => e.kind === "death");
    if (m.accusedMe && g.players[m.accusedMe] && g.players[m.accusedMe].alive && chance(.8)) {
      const who = nm(m.accusedMe); m.accusedMe = null;
      return pick([`Я ${mafia ? "мирний" : "мирний"}, ${who}, годі на мене звалювати!`, `${who}, а чого ти так рвешся мене стратити? Підозріло`, `Не я це. ${who}, краще поясни, за кого ти голосував учора`]);
    }
    if (!mafia) {
      const sure = alive.find((p) => m.known[p.id] === "mafia");
      if (sure && role.abilities.some((a) => /check/.test(a.kind))) return `Я ${role.name.toLowerCase()}. Перевірив ${sure.name} — це ${theme.mafia_team.toLowerCase()}! Голосуємо за ${sure.name}`;
      const clean = alive.find((p) => m.known[p.id] === "town");
      if (clean && chance(.3)) return `${clean.name} чистий, я впевнений. Не чіпайте його`;
      const s = mostSus(alive);
      if (s && sus(s.id) > .8) return pick([`Мені не подобається ${s.name}: голосував проти мирного`, `${s.name} поводиться підозріло — пропоную голосувати за нього`, `Я за ${s.name}. Згадайте, кого він захищав`]);
      if (lastDead && g.day > 1 && chance(.5)) return pick([`Шкода… Хтось із нас знає, хто це зробив`, `Мафія прибирає найактивніших. Хто сьогодні мовчить?`, `Давайте по порядку: хто за кого голосував учора?`]);
      return pick(["Я мирний. Поки нічого не знаю, слухаю вас", "Пропоную не поспішати й не страчувати навмання", "Хтось перевіряв когось уночі?"]);
    }
    // мафия: прикрывает своих, давит на опасных
    const accuser = Object.keys(m.accusedMates || {}).find((p) => g.players[p] && g.players[p].alive && g.players[p].team !== "mafia");
    if (accuser && chance(.7)) return pick([`${nm(accuser)} надто впевнено всіх звинувачує. Схоже на мафію`, `А мені здається, ${nm(accuser)} просто відводить від себе підозри`]);
    const victim = alive.filter((p) => p.team !== "mafia").sort((a, b) => sus(b.id) - sus(a.id))[0];
    if (victim && chance(.6)) return pick([`Голосую за ${victim.name}: він усю гру ухиляється від відповіді`, `${victim.name}, ти вчора проголосував дивно. Поясни`]);
    if (mates.length && chance(.3)) return `${pick(mates).name} точно не мафія, я за ним стежу`;
    return pick(["Я мирний житель, чесно", "Давайте вислухаємо всіх, а потім вирішимо", "Уночі я спав, нічого не бачив"]);
  }

  /* ================================================================ рисовалка */
  // скетчи: узнаваемые картинки из линий и заливок на холсте 160×160 (цвета — номера палитры рисовалки)
  const arc = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 22) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry)); } return p; };
  const O = (cx, cy, r, n) => arc(cx, cy, r, r, 0, Math.PI * 2, n);
  const brush = (w) => (w >= 8 ? 7 : w >= 5 ? 4 : w === 3 ? 2 : w);       // кисти рисовалки: 1, 2, 4, 7
  const S = (c, w, ...segs) => (segs.length > 1 && segs.every(Array.isArray) ? segs.map((p) => ({ k: "s", c, w: brush(w), p })) : { k: "s", c, w: brush(w), p: segs.flat() });   // несколько отрезков — отдельные штрихи
  const F = (c, x, y) => ({ k: "f", c, x, y });
  const star = (cx, cy, R, r) => { const p = []; for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr)); } return p; };
  const heart = (cx, cy, s) => { const p = []; for (let i = 0; i <= 28; i++) { const t = i / 28 * Math.PI * 2; p.push(Math.round(cx + 16 * Math.sin(t) ** 3 * s), Math.round(cy - (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s)); } return p; };
  const SKETCH = {
    "солнце": () => [S(1, 2, O(80, 80, 28)), F(10, 80, 80), ...Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return S(9, 4, [80 + Math.cos(a) * 36, 80 + Math.sin(a) * 36, 80 + Math.cos(a) * 54, 80 + Math.sin(a) * 54].map(Math.round)); })],
    "луна": () => [S(1, 2, O(80, 80, 42)), F(10, 80, 80), S(0, 3, O(104, 66, 36)), F(0, 104, 66), S(14, 2, [30, 30, 32, 34], [130, 120, 132, 124])],
    "звезда": () => [S(1, 3, star(80, 84, 58, 24)), F(10, 80, 84)],
    "дом": () => [S(1, 3, [40, 80, 120, 80, 120, 142, 40, 142, 40, 80]), F(7, 55, 110), S(1, 3, [30, 82, 80, 34, 130, 82, 30, 82]), F(5, 80, 65), S(1, 2, [68, 105, 88, 105, 88, 142, 68, 142, 68, 105]), F(8, 78, 125), S(1, 2, [96, 92, 114, 92, 114, 108, 96, 108, 96, 92]), F(13, 105, 100)],
    "дерево": () => [S(1, 2, [72, 150, 72, 100, 88, 100, 88, 150, 72, 150]), F(8, 80, 125), S(1, 2, O(80, 68, 40)), F(11, 80, 68)],
    "ёлка": () => [S(1, 2, [80, 16, 55, 58, 68, 58, 44, 98, 62, 98, 36, 136, 124, 136, 98, 98, 116, 98, 92, 58, 105, 58, 80, 16]), F(12, 80, 90), S(1, 2, [72, 136, 88, 136, 88, 154, 72, 154, 72, 136]), F(8, 80, 145), S(1, 2, star(80, 16, 10, 4)), F(10, 80, 16)],
    "цветок": () => [S(12, 4, [80, 152, 80, 92]), S(12, 3, [80, 126, 104, 110, 84, 118]), ...[0, 1, 2, 3, 4, 5].flatMap((i) => { const a = i * Math.PI / 3, x = Math.round(80 + Math.cos(a) * 22), y = Math.round(68 + Math.sin(a) * 22); return [S(1, 2, O(x, y, 14)), F(6, x, y)]; }), S(1, 2, O(80, 68, 11)), F(10, 80, 68)],
    "гриб": () => [S(1, 3, [...arc(80, 78, 52, 40, Math.PI, Math.PI * 2), 132, 78, 28, 78]), F(5, 80, 60), F(0, 0, 0), S(1, 2, O(62, 60, 6)), F(0, 62, 60), S(1, 2, O(96, 54, 7)), F(0, 96, 54), S(1, 2, [64, 78, 96, 78, 100, 138, 60, 138, 64, 78]), F(7, 80, 108)],
    "машина": () => [S(1, 3, [18, 112, 22, 88, 52, 86, 68, 64, 112, 64, 128, 86, 146, 92, 146, 114, 18, 114, 18, 112]), F(5, 90, 100), S(1, 2, [74, 70, 92, 70, 92, 86, 64, 86, 74, 70]), F(13, 82, 80), S(1, 2, [98, 70, 110, 70, 120, 86, 98, 86, 98, 70]), F(13, 106, 80), S(1, 2, O(48, 116, 15)), F(1, 48, 116), S(1, 2, O(118, 116, 15)), F(1, 118, 116)],
    "рыба": () => [S(1, 3, arc(72, 80, 48, 28)), F(9, 72, 80), S(1, 3, [118, 80, 148, 54, 148, 106, 118, 80]), F(9, 138, 80), S(1, 2, O(46, 72, 5)), F(1, 46, 72), S(1, 2, [70, 60, 84, 46, 92, 60])],
    "птица": () => [S(1, 3, arc(78, 96, 38, 26)), F(13, 78, 96), S(1, 3, O(114, 68, 16)), F(13, 114, 68), S(1, 2, [128, 64, 148, 70, 128, 76, 128, 64]), F(9, 136, 70), S(1, 3, O(118, 64, 3)), S(1, 3, [60, 92, 78, 76, 96, 92]), S(1, 3, [40, 96, 22, 86, 26, 104, 40, 104])],
    "кот": () => [S(1, 3, O(80, 88, 42)), F(9, 80, 88), S(1, 3, [46, 64, 50, 26, 76, 50]), F(9, 54, 48), S(1, 3, [114, 64, 110, 26, 84, 50]), F(9, 106, 48), S(1, 3, O(64, 82, 6)), F(12, 64, 82), S(1, 3, O(96, 82, 6)), F(12, 96, 82), S(6, 4, [76, 96, 84, 96, 80, 102, 76, 96]), S(1, 2, [74, 106, 80, 110, 86, 106]), S(1, 1, [40, 96, 70, 100], [40, 106, 70, 104], [120, 96, 90, 100], [120, 106, 90, 104])],
    "собака": () => [S(1, 3, arc(80, 88, 36, 42)), F(7, 80, 88), S(1, 3, arc(42, 82, 13, 30)), F(8, 42, 82), S(1, 3, arc(118, 82, 13, 30)), F(8, 118, 82), S(1, 3, O(66, 78, 5)), F(1, 66, 78), S(1, 3, O(94, 78, 5)), F(1, 94, 78), S(1, 3, arc(80, 100, 9, 6)), F(1, 80, 100), S(5, 4, [80, 108, 80, 122]), S(1, 2, [70, 110, 80, 114, 90, 110])],
    "яблоко": () => [S(1, 3, O(80, 92, 42)), F(5, 80, 92), S(8, 5, [80, 52, 86, 30]), S(1, 2, [86, 40, 112, 28, 98, 50, 86, 40]), F(11, 98, 40)],
    "банан": () => [S(1, 3, [30, 66, 48, 110, 86, 130, 128, 122, 142, 104, 124, 110, 88, 110, 58, 92, 42, 60, 30, 66]), F(10, 80, 112), S(8, 4, [30, 66, 26, 58])],
    "мяч": () => [S(1, 3, O(80, 80, 46)), S(1, 2, arc(80, 80, 18, 46, -Math.PI / 2, Math.PI / 2, 14)), S(1, 2, arc(80, 80, 18, 46, Math.PI / 2, Math.PI * 1.5, 14)), F(5, 50, 80), F(13, 110, 80), F(10, 80, 80)],
    "облако": () => [S(1, 3, [...arc(52, 98, 24, 22, Math.PI * .5, Math.PI * 1.5, 10), ...arc(80, 76, 30, 30, Math.PI, Math.PI * 2, 12), ...arc(110, 96, 26, 24, Math.PI * 1.5, Math.PI * 2.5, 10), 52, 120]), F(3, 80, 96)],
    "дождь": () => [S(1, 3, [...arc(52, 70, 24, 22, Math.PI * .5, Math.PI * 1.5, 10), ...arc(80, 50, 30, 30, Math.PI, Math.PI * 2, 12), ...arc(110, 68, 26, 24, Math.PI * 1.5, Math.PI * 2.5, 10), 52, 92]), F(3, 80, 70), ...[[50, 105], [72, 115], [94, 105], [116, 115], [62, 135], [104, 135]].map(([x, y]) => S(13, 3, [x, y, x - 5, y + 14]))],
    "снеговик": () => [S(1, 3, O(80, 124, 30)), S(1, 3, O(80, 78, 22)), S(1, 3, O(80, 42, 16)), S(1, 4, [74, 38, 75, 39], [86, 38, 87, 39]), S(1, 2, [80, 44, 100, 48, 80, 50, 80, 44]), F(9, 86, 47), S(1, 4, [80, 72, 80, 73], [80, 84, 80, 85], [80, 112, 80, 113]), S(8, 3, [58, 78, 30, 60], [102, 78, 130, 60])],
    "шарик": () => [S(1, 3, arc(80, 64, 32, 40)), F(5, 80, 64), S(1, 2, [76, 104, 84, 104, 80, 110, 76, 104]), S(1, 2, [80, 110, 72, 124, 88, 136, 76, 152])],
    "зонт": () => [S(1, 3, [...arc(80, 76, 58, 44, Math.PI, Math.PI * 2, 18), 118, 76, 99, 70, 80, 76, 61, 70, 42, 76, 22, 76]), F(5, 80, 54), S(1, 4, [80, 76, 80, 132, 90, 142, 100, 132])],
    "очки": () => [S(1, 4, O(48, 80, 22)), F(13, 48, 80), S(1, 4, O(112, 80, 22)), F(13, 112, 80), S(1, 4, [70, 76, 90, 76]), S(1, 3, [26, 76, 10, 66], [134, 76, 150, 66])],
    "часы": () => [S(1, 5, O(80, 80, 50)), ...Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return S(1, 2, [80 + Math.cos(a) * 42, 80 + Math.sin(a) * 42, 80 + Math.cos(a) * 48, 80 + Math.sin(a) * 48].map(Math.round)); }), S(1, 4, [80, 80, 80, 46]), S(5, 3, [80, 80, 106, 92])],
    "ключ": () => [S(1, 4, O(44, 80, 22)), S(1, 3, O(44, 80, 8)), F(10, 30, 80), S(1, 5, [66, 80, 142, 80]), S(1, 5, [118, 80, 118, 98], [134, 80, 134, 94])],
    "сердце": () => [S(1, 3, heart(80, 78, 3.6)), F(5, 80, 80)],
    "корона": () => [S(1, 3, [32, 122, 32, 62, 56, 92, 80, 46, 104, 92, 128, 62, 128, 122, 32, 122]), F(10, 80, 105), S(1, 2, O(80, 106, 8)), F(5, 80, 106), S(1, 2, O(52, 108, 6)), F(13, 52, 108), S(1, 2, O(108, 108, 6)), F(11, 108, 108)],
    "ракета": () => [S(1, 3, [80, 16, 102, 50, 102, 116, 58, 116, 58, 50, 80, 16]), F(3, 80, 80), S(1, 2, O(80, 64, 11)), F(13, 80, 64), S(1, 2, [58, 92, 38, 126, 58, 116]), F(5, 52, 112), S(1, 2, [102, 92, 122, 126, 102, 116]), F(5, 108, 112), S(1, 2, [66, 118, 80, 152, 94, 118, 66, 118]), F(9, 80, 126)],
    "лодка": () => [S(1, 3, [26, 104, 134, 104, 116, 132, 44, 132, 26, 104]), F(8, 80, 118), S(1, 3, [80, 104, 80, 26]), S(1, 2, [83, 30, 83, 98, 128, 98, 83, 30]), F(5, 96, 80), S(13, 3, [10, 145, 30, 140, 50, 145, 70, 140, 90, 145, 110, 140, 130, 145, 150, 140])],
    "торт": () => [S(1, 3, [36, 92, 124, 92, 124, 142, 36, 142, 36, 92]), F(6, 80, 120), S(0, 4, [36, 104, 50, 112, 64, 104, 78, 112, 92, 104, 106, 112, 124, 104]), S(1, 2, [74, 62, 86, 62, 86, 92, 74, 92, 74, 62]), F(13, 80, 76), S(1, 2, [80, 40, 88, 52, 80, 60, 72, 52, 80, 40]), F(9, 80, 52)],
    "мороженое": () => [S(1, 3, [52, 78, 108, 78, 80, 150, 52, 78]), F(9, 80, 100), S(8, 2, [60, 92, 96, 120], [100, 92, 66, 120]), S(1, 3, O(80, 62, 28)), F(6, 80, 60)],
    "морковь": () => [S(1, 3, [58, 50, 102, 50, 80, 150, 58, 50]), F(9, 80, 80), S(11, 5, [80, 50, 66, 18], [80, 50, 80, 14], [80, 50, 96, 20]), S(8, 2, [66, 76, 76, 74], [72, 104, 82, 102])],
    "арбуз": () => [S(12, 8, arc(80, 68, 62, 62, 0, Math.PI, 18), [18, 68, 142, 68]), F(5, 80, 96), ...[[56, 88], [80, 100], [104, 88], [68, 112], [92, 112]].map(([x, y]) => S(1, 4, [x, y, x + 1, y + 2]))],
    "улитка": () => [S(1, 3, [20, 124, 140, 124, 140, 112, 128, 104, 30, 104, 20, 124]), F(7, 80, 116), S(1, 3, O(84, 78, 34)), F(8, 70, 60), S(16, 3, (() => { const p = []; for (let i = 0; i < 40; i++) { const a = i * .45, r = 2 + i * .75; p.push(Math.round(84 + Math.cos(a) * r), Math.round(78 + Math.sin(a) * r)); } return p; })()), S(1, 3, [130, 104, 136, 80], [140, 106, 150, 84]), S(1, 5, [136, 79, 137, 80], [150, 83, 151, 84])],
    "паук": () => [S(1, 3, O(80, 90, 24)), F(1, 80, 90), S(1, 3, O(80, 58, 13)), F(1, 80, 58), ...[-1, 1].flatMap((s) => [0, 1, 2, 3].map((i) => S(1, 3, [80 + s * 20, 80 + i * 8, 80 + s * 44, 66 + i * 14, 80 + s * 60, 86 + i * 16])))],
    "бабочка": () => [S(1, 3, arc(54, 64, 26, 24)), F(6, 54, 64), S(1, 3, arc(106, 64, 26, 24)), F(6, 106, 64), S(1, 3, arc(58, 106, 19, 17)), F(9, 58, 106), S(1, 3, arc(102, 106, 19, 17)), F(9, 102, 106), S(1, 7, [80, 48, 80, 124]), S(1, 2, [80, 48, 66, 26], [80, 48, 94, 26])],
    "черепаха": () => [S(1, 3, [...arc(80, 100, 50, 40, Math.PI, Math.PI * 2, 18), 130, 100, 30, 100]), F(12, 80, 82), S(11, 2, [62, 72, 80, 64, 98, 72, 98, 90, 80, 96, 62, 90, 62, 72]), S(1, 3, O(140, 92, 12)), F(11, 140, 92), S(1, 6, [46, 102, 40, 118], [110, 102, 116, 118])],
    "радуга": () => [5, 9, 10, 11, 13, 15].map((c, i) => S(c, 7, arc(80, 132, 74 - i * 7, 74 - i * 7, Math.PI, Math.PI * 2, 22))),
    "молния": () => [S(1, 3, [92, 12, 48, 86, 78, 86, 60, 148, 118, 64, 86, 64, 106, 12, 92, 12]), F(10, 84, 72)],
    "снежинка": () => [0, 1, 2].flatMap((i) => { const a = i * Math.PI / 3, dx = Math.cos(a) * 60, dy = Math.sin(a) * 60; return [S(13, 4, [80 - dx, 80 - dy, 80 + dx, 80 + dy].map(Math.round)), S(13, 3, [80 + dx * .6 + dy * .2, 80 + dy * .6 - dx * .2, 80 + dx * .8, 80 + dy * .8, 80 + dx * .6 - dy * .2, 80 + dy * .6 + dx * .2].map(Math.round)), S(13, 3, [80 - dx * .6 + dy * .2, 80 - dy * .6 - dx * .2, 80 - dx * .8, 80 - dy * .8, 80 - dx * .6 - dy * .2, 80 - dy * .6 + dx * .2].map(Math.round))]; }),
    "кактус": () => [S(1, 3, [68, 132, 68, 40, 92, 40, 92, 132]), S(1, 3, [68, 92, 44, 92, 44, 62, 56, 62, 56, 80, 68, 80], [92, 84, 116, 84, 116, 54, 104, 54, 104, 72, 92, 72]), S(1, 3, [50, 132, 110, 132, 102, 154, 58, 154, 50, 132]), F(11, 80, 80), F(11, 50, 74), F(11, 110, 64), F(8, 80, 142)],
    "глаз": () => [S(1, 3, [...arc(80, 110, 70, 50, Math.PI * 1.2, Math.PI * 1.8, 12), ...arc(80, 50, 70, 50, Math.PI * .2, Math.PI * .8, 12), 24, 80]), S(1, 2, O(80, 80, 20)), F(13, 80, 72), S(1, 2, O(80, 80, 8)), F(1, 80, 80)],
    "улыбка": () => [S(1, 3, O(80, 80, 52)), F(10, 80, 50), S(1, 5, [62, 64, 62, 72], [98, 64, 98, 72]), S(1, 4, arc(80, 86, 30, 24, Math.PI * .15, Math.PI * .85, 12))],
    "подарок": () => [S(1, 3, [36, 70, 124, 70, 124, 142, 36, 142, 36, 70]), F(5, 56, 106), F(5, 104, 106), S(10, 10, [80, 70, 80, 142], [36, 104, 124, 104]), S(1, 3, [80, 70, 60, 48, 56, 66, 80, 70, 100, 48, 104, 66, 80, 70]), F(10, 64, 60), F(10, 96, 60)],
    "свеча": () => [S(1, 3, [66, 62, 94, 62, 94, 146, 66, 146, 66, 62]), F(3, 80, 100), S(1, 2, [80, 62, 80, 52]), S(1, 2, [80, 18, 92, 40, 80, 54, 68, 40, 80, 18]), F(9, 80, 40)],
    "флаг": () => [S(1, 5, [44, 18, 44, 152]), S(1, 3, [47, 22, 128, 22, 118, 50, 128, 76, 47, 76, 47, 22]), F(5, 80, 48)],
    "якорь": () => [S(1, 5, O(80, 30, 11)), S(1, 6, [80, 41, 80, 136]), S(1, 6, [56, 60, 104, 60]), S(1, 6, arc(80, 100, 42, 36, Math.PI * .05, Math.PI * .95, 14)), S(1, 6, [36, 104, 30, 92], [124, 104, 130, 92])],
    "колесо": () => [S(1, 9, O(80, 80, 52)), S(3, 4, O(80, 80, 40)), ...Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return S(2, 3, [80, 80, Math.round(80 + Math.cos(a) * 42), Math.round(80 + Math.sin(a) * 42)]); }), S(1, 3, O(80, 80, 8)), F(1, 80, 80)],
    "тыква": () => [S(1, 3, arc(80, 96, 58, 44)), F(9, 80, 96), S(8, 3, arc(80, 96, 22, 44, -Math.PI / 2, Math.PI / 2, 12)), S(8, 3, arc(80, 96, 22, 44, Math.PI / 2, Math.PI * 1.5, 12)), S(1, 3, [76, 52, 74, 30, 86, 30, 84, 52]), F(12, 80, 42)],
    "яйцо": () => [S(1, 3, (() => { const p = []; for (let i = 0; i <= 26; i++) { const t = i / 26 * Math.PI * 2, rx = 38 * (1 - .18 * Math.sin(t)); p.push(Math.round(80 + Math.cos(t) * rx), Math.round(86 + Math.sin(t) * 50)); } return p; })()), F(7, 80, 90)],
    "сыр": () => [S(1, 3, [24, 112, 130, 72, 136, 118, 24, 140, 24, 112]), F(10, 80, 116), S(1, 2, O(60, 120, 7)), F(9, 60, 120), S(1, 2, O(100, 112, 9)), F(9, 100, 112), S(1, 2, [24, 112, 136, 118])],
    "пицца": () => [S(1, 3, [36, 38, 124, 38, 80, 148, 36, 38]), F(10, 80, 70), S(8, 9, [36, 38, 124, 38]), ...[[64, 60], [96, 62], [80, 92], [72, 118]].flatMap(([x, y]) => [S(1, 2, O(x, y, 8)), F(5, x, y)])],
    "кит": () => [S(1, 3, arc(72, 96, 56, 32)), F(13, 72, 96), S(1, 3, [124, 90, 150, 66, 146, 96, 150, 120, 124, 104]), F(13, 140, 94), S(1, 4, [48, 92, 49, 93]), S(13, 3, [70, 62, 70, 40], [70, 46, 58, 32], [70, 46, 82, 32]), S(0, 3, [26, 108, 60, 116, 100, 112])],
    "гора": () => [S(1, 3, [8, 140, 58, 46, 84, 92, 106, 62, 152, 140, 8, 140]), F(15, 60, 120), S(1, 2, [58, 46, 46, 68, 58, 62, 70, 68, 58, 46]), F(0, 58, 56)],
    "пальма": () => [S(8, 8, [76, 150, 80, 110, 86, 70]), ...[[-1, 0], [1, 0], [-1, 1], [1, 1], [0, -1]].map(([sx, k]) => S(11, 6, [86, 70, 86 + sx * 30, 60 + k * 14, 86 + sx * 52, 74 + k * 20])), S(10, 6, [20, 150, 140, 150])],
    "стул": () => [S(8, 6, [50, 20, 50, 150], [50, 92, 110, 92], [110, 92, 110, 150], [50, 30, 50, 92], [50, 30, 66, 30, 66, 92])],
    "чашка": () => [S(1, 3, [42, 62, 108, 62, 100, 132, 50, 132, 42, 62]), F(13, 75, 100), S(1, 4, arc(110, 92, 16, 20, -Math.PI / 2, Math.PI / 2, 10)), S(3, 3, [62, 50, 56, 40, 62, 30], [84, 50, 78, 40, 84, 30])],
    "книга": () => [S(1, 3, [80, 46, 30, 36, 30, 124, 80, 134, 130, 124, 130, 36, 80, 46, 80, 134]), F(7, 55, 85), F(7, 105, 85), S(2, 2, [40, 60, 70, 64], [40, 76, 70, 80], [40, 92, 70, 96], [90, 64, 120, 60], [90, 80, 120, 76], [90, 96, 120, 92])],
    "телефон": () => [S(1, 4, [56, 22, 104, 22, 104, 138, 56, 138, 56, 22]), F(1, 60, 26), S(13, 3, [62, 34, 98, 34, 98, 116, 62, 116, 62, 34]), F(13, 80, 76), S(3, 3, O(80, 127, 4))],
    "огонь": () => [S(1, 3, [80, 14, 120, 84, 118, 122, 80, 148, 42, 122, 40, 84, 60, 96, 66, 52, 80, 14]), F(5, 80, 100), S(9, 3, [80, 60, 100, 104, 80, 136, 60, 104, 80, 60]), F(9, 80, 110), S(10, 3, [80, 96, 90, 118, 80, 134, 70, 118, 80, 96]), F(10, 80, 120)],
    "шапка": () => [S(1, 3, [...arc(80, 110, 48, 60, Math.PI, Math.PI * 2, 18), 128, 110, 32, 110]), F(13, 80, 80), S(1, 3, [28, 108, 132, 108, 132, 128, 28, 128, 28, 108]), F(0, 80, 118), S(1, 3, O(80, 44, 12)), F(5, 80, 44)],
    "носок": () => [S(1, 3, [60, 20, 100, 20, 100, 104, 126, 118, 120, 146, 72, 140, 60, 116, 60, 20]), F(5, 80, 70), S(0, 6, [60, 40, 100, 40], [60, 60, 100, 60])],
    "мышь": () => [S(1, 3, arc(80, 100, 42, 28)), F(3, 80, 100), S(1, 3, O(110, 74, 14)), F(6, 110, 74), S(1, 3, O(84, 72, 12)), F(6, 84, 72), S(1, 4, [116, 96, 117, 97]), S(5, 4, [122, 106, 124, 108]), S(1, 3, [38, 104, 18, 92, 22, 120, 10, 128])],
    "змея": () => [S(11, 12, [20, 120, 40, 100, 60, 120, 80, 100, 100, 120, 118, 100]), S(1, 3, O(126, 94, 12)), F(11, 126, 94), S(1, 4, [128, 90, 129, 91]), S(5, 2, [138, 96, 150, 92], [150, 92, 154, 88], [150, 92, 154, 98])],
    "пингвин": () => [S(1, 3, arc(80, 92, 40, 56)), F(14, 80, 50), S(0, 2, arc(80, 104, 26, 40)), F(0, 80, 104), S(0, 4, [70, 66, 71, 67], [90, 66, 91, 67]), S(1, 2, [74, 76, 86, 76, 80, 86, 74, 76]), F(9, 80, 79), S(9, 6, [62, 150, 74, 150], [86, 150, 98, 150])],
    "сова": () => [S(1, 3, arc(80, 90, 44, 54)), F(8, 80, 120), S(1, 3, [46, 50, 52, 26, 68, 42], [114, 50, 108, 26, 92, 42]), S(1, 3, O(62, 74, 15)), F(0, 62, 74), S(1, 3, O(98, 74, 15)), F(0, 98, 74), S(1, 4, O(62, 74, 5)), F(1, 62, 74), S(1, 4, O(98, 74, 5)), F(1, 98, 74), S(1, 2, [74, 92, 86, 92, 80, 104, 74, 92]), F(9, 80, 95)],
    "лиса": () => [S(1, 3, [30, 50, 50, 20, 70, 50, 90, 50, 110, 20, 130, 50, 116, 100, 80, 140, 44, 100, 30, 50]), F(9, 80, 70), S(1, 2, [44, 100, 80, 104, 116, 100]), F(0, 70, 112), S(1, 4, [62, 72, 63, 73], [98, 72, 99, 73]), S(1, 3, O(80, 132, 6)), F(1, 80, 132)],
    "осьминог": () => [S(1, 3, [...arc(80, 70, 40, 40, Math.PI, Math.PI * 2, 16), 120, 90, 40, 90, 40, 70]), F(6, 80, 60), ...[0, 1, 2, 3, 4, 5].map((i) => { const x = 46 + i * 14; return S(6, 6, [x, 90, x - 6, 110, x + 4, 128, x - 4, 146]); }), S(1, 4, [66, 64, 67, 65], [94, 64, 95, 65])],
    "краб": () => [S(1, 3, arc(80, 96, 40, 26)), F(5, 80, 96), S(5, 6, [44, 86, 26, 64], [116, 86, 134, 64]), S(1, 3, [18, 64, 26, 50, 34, 64, 26, 70, 18, 64], [126, 64, 134, 50, 142, 64, 134, 70, 126, 64]), F(5, 26, 62), F(5, 134, 62), S(1, 4, [70, 70, 70, 80], [90, 70, 90, 80]), S(5, 4, [48, 112, 34, 128], [62, 118, 54, 136], [112, 112, 126, 128], [98, 118, 106, 136])],
    "медуза": () => [S(1, 3, [...arc(80, 72, 44, 40, Math.PI, Math.PI * 2, 16), 124, 72, 36, 72]), F(15, 80, 56), ...[0, 1, 2, 3, 4].map((i) => S(15, 4, [48 + i * 16, 72, 42 + i * 16, 96, 52 + i * 16, 118, 44 + i * 16, 146]))],
    "лампа": () => [S(1, 3, [56, 30, 104, 30, 122, 78, 38, 78, 56, 30]), F(10, 80, 54), S(1, 5, [80, 78, 80, 136]), S(1, 3, [52, 136, 108, 136, 108, 146, 52, 146, 52, 136]), F(2, 80, 141)],
    "стол": () => [S(8, 8, [16, 70, 144, 70]), S(8, 6, [30, 74, 30, 140], [130, 74, 130, 140])],
    "гитара": () => [S(1, 3, O(70, 108, 32)), S(1, 3, O(92, 78, 22)), F(8, 70, 116), F(8, 92, 74), S(1, 3, O(76, 98, 9)), F(1, 76, 98), S(16, 6, [96, 72, 140, 24]), S(1, 2, [58, 120, 136, 28])],
  };
  const DRAWABLE = Object.keys(SKETCH);
  const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-яіїєґ0-9]/g, "");
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const similar = (a, b) => { a = norm(a); b = norm(b); return a && b && (a === b || (a.length >= 4 && (b.startsWith(a.slice(0, 4)) || lev(a, b) <= Math.max(1, Math.floor(b.length / 4))))); };
  function drawBot(h, room, id) {
    const me = room.drawer === id, m = mem(room, id);
    if (room.phase === "choose" && me) {
      const can = room.options.map((w, i) => [w, i]).filter(([w]) => SKETCH[w]);
      return act(h, id, { slot: "pick", target: can.length ? pick(can)[1] : Math.floor(Math.random() * room.options.length) }, 1500, 3500);
    }
    if (room.phase === "draw" && me) {
      if (m.word !== room.word) { m.word = room.word; m.ops = (SKETCH[room.word] ? SKETCH[room.word]() : doodle()).flat(); m.i = 0; }
      if (m.i < m.ops.length) { h.handle(id, { t: "ink", op: m.ops[m.i++] }); think(id, 500, 1100); return; }
      return act(h, id, { slot: "done" }, 2500, 4000);
    }
    if (room.phase === "guess" && !me && room.guesses && !room.guesses[id]) {
      if (!m.guessAt || m.guessFor !== room.word) { m.guessFor = room.word; m.guessAt = Date.now() + 2500 + Math.random() * 6000; return; }
      if (Date.now() < m.guessAt) return;
      const drawerBot = isBot(room.drawer), sketched = drawerBot && SKETCH[room.word], inked = (room.ink || []).length;
      const hard = /hard/.test(room.settings.words) ? .2 : /medium/.test(room.settings.words) ? .35 : .5;
      const p = sketched ? .8 : drawerBot ? .08 : inked < 3 ? .05 : Math.min(.75, hard + inked * .02);   // видит рисунок «как человек»: чем больше нарисовано — тем легче
      const wrong = DRAWABLE.filter((w) => w !== room.word);
      return act(h, id, { slot: "guess", text: chance(p) ? room.word : pick(wrong) }, 800, 1500);
    }
    if (room.phase === "judge" && me) {
      Object.entries(room.guesses).forEach(([pid, g]) => { if (!(room.marks[pid] > 0) && similar(g, room.word)) h.handle(id, { t: "act", slot: "mark", target: pid, value: norm(g) === norm(room.word) ? 2 : 1 }); });
      return act(h, id, { slot: "award" }, 1200, 2500);
    }
  }
  const doodle = () => Array.from({ length: 6 }, () => { const cx = 30 + Math.random() * 100, cy = 30 + Math.random() * 100; return S(Math.floor(1 + Math.random() * 15), 4, O(Math.round(cx), Math.round(cy), Math.round(8 + Math.random() * 26), 14)); });

  /* ================================================================ «Последний заряд»: считает патроны, помнит обиды, выбирает цель с умом */
  // что бот знает честно: свой заряд, свои фонарик/шкатулку/подслушку (их видит и человек), выстрелы и предметы на столе
  function rouKnow(room, id) {
    const m = mem(room, id);
    if (m.gameNo !== room.gameNo) Object.assign(m, { gameNo: room.gameNo, ev: 0, live: 0, blank: 0, grudge: {}, threat: {}, peeked: {}, bold: (Math.random() - .5) * .12, turnKey: "", acts: 0 });
    room.events.filter((e) => e.n > m.ev).forEach((e) => {
      if (e.kind === "load") { m.live = 0; m.blank = 0; m.peeked = {}; }
      else if (e.kind === "shot") {
        if (e.live) m.live++; else m.blank++;
        if (e.who !== id && e.target === id) m.grudge[e.who] = (m.grudge[e.who] || 0) + (e.live ? 3 : 2);          // целился в меня — запомню
        else if (e.who !== id && !e.self) m.threat[e.who] = (m.threat[e.who] || 0) + (e.live ? 1 : .5);          // вообще агрессивный
        if (e.redirected && e.hit === id) m.grudge[e.target] = (m.grudge[e.target] || 0) + 1;
      } else if (e.kind === "item") {
        if (e.item === "spin") m.peeked = {};
        if (["flashlight", "box", "ear"].includes(e.item) && e.who !== id) m.peeked[e.who] = true;              // он что-то знает про патроны
        if ((e.item === "freeze" || e.item === "thief" || e.item === "ear") && e.target === id && e.who !== id) m.grudge[e.who] = (m.grudge[e.who] || 0) + 1.5;
      }
    });
    m.ev = room.eventN;
    const known = (room.peek || {})[id] || {}, heard = (room.heard || {})[id] || {};
    m.known = known;
    if (known[0]) { m.p = known[0] === "live" ? 1 : 0; return m; }
    // боевых в магазине: состав объявлен всем после зарядки — точное число минус уже вылетевшие
    let eLive;
    if (room.liveTotal != null && room.fired) eLive = room.liveTotal - room.fired.live;
    else {                                                              // старое сохранение комнаты: оцениваем, как раньше
      const alive = Object.keys(room.contrib || {});
      let unknown = 0; eLive = 0;
      alive.forEach((p) => { const v = p === id ? room.contrib[id] : heard[p]; if (v) eLive += v === "live" ? 1 : 0; else unknown++; });
      eLive += .5 * (unknown + room.house) - m.live;
    }
    let n = room.drum.length;
    Object.entries(known).forEach(([, t]) => { n--; if (t === "live") eLive--; });
    m.p = n > 0 ? Math.max(0, Math.min(1, eLive / n)) : .5;
    return m;
  }

  const ROU_VALUE = { saw: 5, box: 4.5, medkit: 4, vest: 3.5, mirror: 3.5, flashlight: 3, freeze: 2.5, ear: 2, spin: 1.5, thief: 1.5, stake: 1 };
  // насколько выгодно стрелять в каждого соперника (боевым): добить, отомстить, убрать самого опасного
  function rouTargets(room, id, m, dmg) {
    const alive = room.seats.filter((p) => room.hp[p] > 0), others = alive.filter((p) => p !== id);
    const nextP = room.nextAfter(id);
    return others.map((o) => {
      const st = room.status[o] || {}, hp = room.hp[o], items = room.items[o] || [];
      let s = 1, why = "";
      if (st.mirror) return { id: o, s: -9, why: "mirror" };            // зеркало вернёт пулю мне
      if (st.vest) { s -= dmg > 1 ? 3 : 1.6; why = "vest"; }
      if (hp <= dmg && !st.vest) { s += 3; why = "kill"; }              // можно выбить из игры — меньше соперников
      else s += (room.settings.hp - hp) * .35;                          // уже ранен — дожать
      s += Math.min(4, (m.grudge[o] || 0) * .55) + Math.min(2, (m.threat[o] || 0) * .3);
      s += items.reduce((a, k) => a + (ROU_VALUE[k] || 1), 0) * .12;    // у кого много полезного — тот опаснее
      if (m.peeked[o]) s += .6;                                         // он знает патроны — опасен на следующем ходу
      if (o === nextP && others.length > 1) s += .4;                    // следующий по кругу стреляет сразу после меня
      if ((m.grudge[o] || 0) >= 3 && why !== "kill") why = "grudge";
      return { id: o, s, why };
    });
  }
  // взвешенный случай: лучшая цель вероятнее, но не всегда
  function rouPick(list, temp = .9) {
    const ok = list.filter((t) => t.s > -5);
    if (!ok.length) return null;
    const w = ok.map((t) => Math.exp(t.s / temp)), sum = w.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < ok.length; i++) { r -= w[i]; if (r <= 0) return ok[i]; }
    return ok[ok.length - 1];
  }

  function rouletteBot(h, room, id) {
    if (!(room.hp && room.hp[id] > 0)) return;
    if (room.phase === "load" && !room.contrib[id]) {
      const hps = room.seats.filter((p) => room.hp[p] > 0).map((p) => room.hp[p]);
      const weak = room.hp[id] <= Math.min(...hps), safe = (room.status[id] || {}).vest || (room.status[id] || {}).mirror;
      return act(h, id, { slot: "load", value: chance(safe ? .75 : weak ? .35 : .58) ? "live" : "blank" }, 1000, 3000);   // раненый кладёт холостой чаще
    }
    if (room.phase !== "play" || room.turn !== id) return;
    const m = rouKnow(room, id), items = room.items[id] || [], has = (k) => items.includes(k);
    const me = room.status[id] || {}, hp = room.hp[id], maxHp = room.settings.hp, name = (p) => room.members[p].name;
    const others = room.seats.filter((p) => room.hp[p] > 0 && p !== id);
    const tk = room.gameNo + ":" + room.loads + ":" + room.drum.length + ":" + id;
    if (m.turnKey !== tk) { m.turnKey = tk; m.acts = 0; m.said = false; }
    const useItem = (k, target, pickIdx) => { m.acts++; h.handle(id, { t: "act", slot: "item", index: items.indexOf(k), key: k, target: target || null, pick: pickIdx == null ? null : pickIdx }); think(id, ["box", "flashlight", "ear"].includes(k) ? 2200 : 1300, ["box", "flashlight", "ear"].includes(k) ? 4200 : 2600); return true; };   // после фонарика/шкатулки — «смотрит» и думает
    const line = (t) => { if (!m.said && t) { m.said = true; say(h, room, id, t); } };
    const p = m.p, sure = p === 0 || p === 1;
    const aiming = !!(m.aimFor && m.aimFor.key.startsWith(tk + ":"));      // уже водит стволом — предметы больше не трогает

    if (m.acts < 6 && !aiming) {                                                   // сначала предметы — по делу, не все подряд
      if (has("medkit") && hp < maxHp && (hp <= 2 || maxHp - hp >= 2 || chance(.4))) return useItem("medkit");
      if (!sure) {
        if (has("box")) return useItem("box");
        if (has("flashlight") && (room.drum.length <= 4 || (p > .3 && p < .7))) return useItem("flashlight");
        const spy = others.find((o) => m.peeked[o]);                     // видел, что он светил фонариком или открывал шкатулку, — подслушать его
        if (has("ear") && spy) { m.peeked[spy] = false; return useItem("ear", spy); }
      }
      if (has("thief")) {                                               // крадём самое ценное, что пригодится прямо сейчас
        let best = null;
        others.forEach((o) => (room.items[o] || []).forEach((k, j) => {
          if (k === "thief") return;
          let v = ROU_VALUE[k] || 1;
          if (k === "medkit" && hp >= maxHp) v = 1.5;
          if (k === "saw" && p >= .6) v += 2;
          if (k === "box" && !sure) v += 1.5;
          v += Math.min(1, (m.grudge[o] || 0) * .2) + Math.random() * .3;
          if (!best || v > best.v) best = { o, j, v };
        }));
        if (best && best.v >= 2) { line(chance(.4) ? `${name(best.o)}, це тепер моє` : ""); return useItem("thief", best.o, best.j); }
      }
      // кто-то знает порядок патронов, а я — нет: встряхнуть, чтобы его знания сгорели
      if (has("spin") && !sure && Object.keys(m.peeked).some((o) => room.hp[o] > 0) && chance(.55)) { line(chance(.5) ? "Що ви там підгледіли? Забудьте" : ""); return useItem("spin"); }
      if (has("vest") && !me.vest && (hp <= 2 || hp < maxHp || Object.values(m.grudge).some((g) => g >= 3))) return useItem("vest");
      if (has("mirror") && !me.mirror && (hp <= maxHp - 1 || Object.values(m.grudge).some((g) => g >= 2) || chance(.35))) return useItem("mirror");
      if (has("stake") && hp >= Math.ceil(maxHp / 2) && chance(.6)) return useItem("stake");
    }

    // стрелять в себя или в соперника? Холостой в себя — лишний ход; боевой в себя — минус сердце (с жилетом — только жилет)
    const dmgNow = room.sawed ? 2 : 1;
    let thr = .45 + m.bold;                                              // базовый порог: в себя, если боевой маловероятен
    if (hp <= dmgNow && !me.vest) thr -= .17;                            // одно сердце — рисковать собой нельзя
    if (me.vest) thr += .12;
    if (others.length >= 2) thr -= .04;
    const list = rouTargets(room, id, m, dmgNow), goodT = list.some((t) => t.s > -5);
    const gut = sure ? p : Math.max(0, Math.min(1, p + (Math.random() - .5) * .3));   // как живой человек: иногда ошибается «на глаз»
    let selfShot = gut < thr;
    if (p === 0) selfShot = true;                                       // точно холостой — в себя, ход останется у меня
    if (p === 1) selfShot = false;                                      // точно боевой — только в соперника

    if (!selfShot && m.acts < 6 && !aiming) {
      if (!goodT && has("spin") && p >= .6) { line("Ні, так не піде. Перемішаємо"); return useItem("spin"); }   // все за зеркалами
      if (has("freeze") && others.length >= 1 && p >= .5) {             // бутылкой по голове тому, кто ходит после меня (вдвоём — это лишний ход мне)
        const nx = room.nextAfter(id), tgt = others.length === 1 ? others[0] : (list.find((t) => t.id === nx && t.s > 2) ? nx : others.slice().sort((a, b) => ((m.grudge[b] || 0) + (room.items[b] || []).length) - ((m.grudge[a] || 0) + (room.items[a] || []).length))[0]);
        if (tgt && !(room.status[tgt] || {}).frozen) { line(chance(.5) ? pick(["Лови!", `${name(tgt)}, спіймай-но`, "Посидь, відпочинь"]) : ""); return useItem("freeze", tgt); }
      }
      if (has("saw") && !room.sawed && p >= .75) {                      // обрез — только когда боевой почти наверняка
        const top = list.filter((t) => t.s > -5).sort((a, b) => b.s - a.s)[0];
        if (top && !(room.status[top.id] || {}).vest && (room.hp[top.id] >= 2 || p === 1)) { line(chance(.5) ? "Зараз буде боляче" : ""); return useItem("saw"); }
      }
    } else if (selfShot && m.acts < 6 && !aiming && has("freeze") && others.length > 1 && chance(.35)) {
      const nx = room.nextAfter(id); if (!(room.status[nx] || {}).frozen) { line(chance(.4) ? "Лови!" : ""); return useItem("freeze", nx); }
    }

    let target;
    if (selfShot) target = id;
    else {
      if (m.aimFor && m.aimFor.key === tk + ":" + m.acts) target = m.aimFor.id;
      else {
        const chosen = rouPick(list, p === 1 ? .7 : 1.1);
        target = chosen ? chosen.id : (me.vest || hp > dmgNow ? (others.sort((a, b) => room.hp[b] - room.hp[a])[0] || id) : id);   // все с зеркалами: снять зеркало у самого живучего
        m.why = chosen ? chosen.why : "";
      }
    }
    // напряжение: бот водит стволом по столу, иногда долго думает, иногда стреляет сразу — по ситуации и характеру
    const left = room.deadline ? room.deadline - room.clock() : 99, key = tk + ":" + m.acts;
    if (!m.aimFor || m.aimFor.key !== key) {
      const alive = room.seats.filter((q) => room.hp[q] > 0), unsure = sure ? 0 : 1 - Math.abs(p - .5) * 2;
      const style = Math.random();
      let fakes = style < .22 ? 0 : style < .7 ? 1 + (Math.random() < unsure ? 1 : 0) : 2 + Math.floor(Math.random() * 2);
      if (p === 1 && chance(.5)) fakes = Math.max(fakes, 2);              // знает, что боевой, — играет с жертвами
      if (p === 0 && chance(.4)) fakes = Math.max(fakes, 1);              // знает, что холостой, — пугает, а потом в себя
      const steps = [];
      for (let i = 0; i < fakes; i++) {
        const pool = alive.filter((q) => q !== target && q !== steps[steps.length - 1]);
        if (pool.length) steps.push(pick(pool));
      }
      steps.push(target);
      const slow = chance(.18 + unsure * .25);                              // «долго думает» перед первым движением
      m.aimFor = { key, id: target, steps, i: 0, slow, quick: style < .22 && !slow };
      if (slow) { if (chance(.4)) line(pick(["Хм…", "Дайте подумати", "Так-так…", "Складний вибір"])); think(id, 3500, 7500); return; }
    }
    const plan = m.aimFor;
    if (left < 7) { if (room.aim !== target) { h.handle(id, { t: "act", slot: "aim", target }); think(id, 500, 900); return; } return act(h, id, { slot: "shoot", target }, 600, 900); }
    if (plan.i < plan.steps.length) {
      const to = plan.steps[plan.i++], last = plan.i === plan.steps.length;
      if (room.aim !== to || !last) h.handle(id, { t: "act", slot: "aim", target: to });
      if (!last) {
        if (chance(.22)) line(to === id ? pick(["А може, в себе?..", "Або так…"]) : pick([`${name(to)}?..`, "Хто ж, хто ж…", "Не смикайтеся", `Подивися на мене, ${name(to)}`]));
        return think(id, plan.quick ? 700 : 1100, plan.quick ? 1300 : 2900);
      }
      if (chance(.3)) {
        const nm = target !== id ? name(target) : "";
        line(target === id ? (p === 0 ? pick(["Знаю, що роблю", "Там порожньо. Дивіться", "Спокійно — холостий"]) : pick(["Відчуваю, холостий…", "Ризикну. В себе", "Ну, удаче, не підведи"]))
          : m.why === "kill" ? pick([`${nm}, це кінець`, `Прощавай, ${nm}`, "Доб’ю"]) : m.why === "grudge" ? pick([`${nm}, ти перший почав(ла)`, `Це за минулий раз, ${nm}`, `${nm}, це особисте`])
          : p === 1 ? pick([`${nm}, я знаю, що там`, "Цей точно бойовий"]) : pick([`${nm}, нічого особистого`, `Пробач, ${nm}`, "Подивимося…"]));
      }
      return think(id, plan.quick ? 600 : 1300, plan.quick ? 1200 : plan.steps.length > 2 ? 4200 : 3000);   // палец на спуске
    }
    if (room.aim !== target) { h.handle(id, { t: "act", slot: "aim", target }); think(id, 800, 1500); return; }
    m.aimFor = null;
    act(h, id, { slot: "shoot", target }, 1200, 2000);
  }

  /* ================================================================ русская рулетка: шанс виден всем — бот считает его и держит паузу */
  function revolverBot(h, room, id) {
    if (room.phase !== "play" || room.turn !== id || !(room.hp[id] > 0)) return;
    const m = mem(room, id), name = (p) => room.members[p].name;
    const tk = room.gameNo + ":" + room.loads + ":" + room.fired + ":" + room.left + ":" + id;
    if (m.turnKey !== tk) { m.turnKey = tk; m.plan = null; m.said = false; }
    m.grudge = m.grudge || {};
    room.events.slice(-6).forEach((e) => { if (e.kind === "shot" && e.target === id && e.who !== id && !m["g" + e.n]) { m["g" + e.n] = 1; m.grudge[e.who] = (m.grudge[e.who] || 0) + 1; } });
    const line = (t) => { if (!m.said && t) { m.said = true; say(h, room, id, t); } };
    const p = 1 / room.left;                                              // шанс, что выстрелит сейчас
    const others = room.seats.filter((q) => q !== id && room.canTarget(id, q));
    if (!m.plan) {
      // крутить барабан — когда шанс большой, а стрелять придётся в себя (все остальные — храбрецы)
      if (!room.spun[id] && !others.length && p >= 1 / 3) { line(pick(["Ні-ні, крутнемо", "Спершу покрутимо", "Удаче, крутися"])); return act(h, id, { slot: "spin" }, 1500, 2600); }
      // в себя — ради «храбреца», пока шанс маленький; в остальных — по обидам и по слабым
      const self = !others.length || (p <= 1 / 5 && chance(.5)) || (p <= 1 / 4 && chance(.25)) || (p <= 1 / 3 && chance(.06));
      let target = id;
      if (!self) {
        const sc = (q) => (m.grudge[q] || 0) * 1.4 + (room.hp[q] <= 1 ? .6 : 0) + Math.random() * 1.5;
        target = others.slice().sort((a, b) => sc(b) - sc(a))[0];
      }
      const alive = room.seats.filter((q) => room.hp[q] > 0), steps = [];
      const fakes = chance(.25) ? 0 : 1 + (chance(.35) ? 1 : 0) + (p >= .5 && chance(.5) ? 1 : 0);
      for (let i = 0; i < fakes; i++) { const pool = alive.filter((q) => q !== target && q !== steps[steps.length - 1] && room.canTarget(id, q)); if (pool.length) steps.push(pick(pool)); }
      steps.push(target);
      m.plan = { steps, i: 0, target, slow: chance(.2 + p * .4) };
      if (m.plan.slow) { if (chance(.4)) line(pick(["Хм…", "Так…", "Дайте зібратися", p >= .5 ? "Тут уже гаряче" : "Хто ж сьогодні…"])); return think(id, 3000, 6500); }
    }
    const plan = m.plan, left = room.deadline ? room.deadline - room.clock() : 99;
    if (left < 6) { if (room.aim !== plan.target) { h.handle(id, { t: "act", slot: "aim", target: plan.target }); return think(id, 500, 800); } return act(h, id, { slot: "shoot", target: plan.target }, 600, 900); }
    if (plan.i < plan.steps.length) {
      const to = plan.steps[plan.i++], last = plan.i === plan.steps.length;
      if (room.aim !== to) h.handle(id, { t: "act", slot: "aim", target: to });
      if (!last) { if (chance(.2)) line(to === id ? "А може, в себе?.." : pick([`${name(to)}?..`, "Не смикайся", "Хто ж, хто ж…"])); return think(id, 1100, 2600); }
      if (chance(.35)) line(plan.target === id ? pick(["Ну, удаче…", "Дивіться уважно", "Ризикну"]) : (m.grudge[plan.target] ? pick([`${name(plan.target)}, це за минулий раз`, "Нічого особистого… хоча ні, особисте"]) : pick([`Пробач, ${name(plan.target)}`, `${name(plan.target)}, не кліпай`, "Подивимося…"])));
      return think(id, 1400, p >= .5 ? 4200 : 3000);                    // палец на спуске
    }
    if (room.aim !== plan.target) { h.handle(id, { t: "act", slot: "aim", target: plan.target }); return think(id, 700, 1200); }
    m.plan = null;
    act(h, id, { slot: "shoot", target: plan.target }, 1200, 2000);
  }

  /* ================================================================ «Верю — не верю»: знает только свои карты и то, что лежит на столе */
  function bluffBot(h, room, id) {
    if (room.phase !== "play" || room.turn !== id || !(room.hp[id] > 0)) return;
    const m = mem(room, id), hand = room.hands[id] || [], rank = room.rank, last = room.last;
    const good = (c) => c === rank || c === "J";
    const tk = room.gameNo + ":" + room.round + ":" + room.pile + ":" + id;
    if (m.turnKey !== tk) { m.turnKey = tk; m.slow = chance(.3); if (m.slow) return think(id, 1500, 3500); }
    // можно ли верить последнему: сколько «нужных» карт ещё могло быть у него
    if (last && last.by !== id && room.hp[last.by] > 0) {
      const mine = hand.filter(good).length, pool = 8 - mine;                // 6 нужных + 2 джокера, минус мои
      const before = room.pile - last.n;                                   // сколько уже положили до него — часть «нужных» могла уйти туда
      let p = [0, .22, .4, .6][last.n] + Math.min(.25, before * .03) + (mine >= 4 ? .2 : 0) + (!room.hands[last.by].length ? .12 : 0);
      if (!hand.filter(good).length && hand.length) p += .1;                // самому нечем крыть — проще не поверить
      if (last.n > pool) p = 1;
      if (!hand.length || chance(Math.min(.95, p))) {
        if (chance(.4)) say(h, room, id, pick(["Не вірю!", "Брехня!", "Ану покажи", "Розкриваємо", "Блефуєш"]));
        return act(h, id, { slot: "call" }, 1500, 2500);
      }
    }
    if (!hand.length) return;
    const gi = hand.map((c, i) => (good(c) ? i : -1)).filter((i) => i >= 0), bi = hand.map((c, i) => (good(c) ? -1 : i)).filter((i) => i >= 0);
    let cards;
    if (gi.length) {
      const k = Math.min(gi.length, chance(.5) ? 1 : chance(.7) ? 2 : 3);
      cards = gi.slice(0, k);
      if (cards.length < 3 && bi.length && chance(.18)) cards.push(bi[0]);   // иногда подмешивает лишнюю
    } else cards = bi.slice(0, chance(.75) || bi.length < 2 ? 1 : 2);       // нечем крыть — блефует
    if (chance(.25)) say(h, room, id, pick(["Чесно-чесно", "Повір мені", "Тримай", "Ну?", "Ваш хід"]));
    act(h, id, { slot: "play", cards }, 1300, 2600);
  }

  /* ================================================================ блэкджек: играет от открытых карт соперников */
  const val = (c) => { const r = c.slice(0, -1); return r === "A" ? 11 : ["J", "Q", "K"].includes(r) ? 10 : Number(r); };
  const bjTotal = (cards) => { let t = 0, a = 0; cards.forEach((c) => { if (c.slice(0, -1) === "A") a++; t += val(c); }); while (t > 21 && a) { t -= 10; a--; } return t; };
  function bjBot(h, room, id) {
    if (room.phase === "bet" && !(id in room.joined)) return act(h, id, { slot: "bet", play: true, seed: Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("") }, 800, 2500);
    if (room.phase !== "play" || room.turn !== id) return;
    const hand = room.hands[id], mine = bjTotal(hand.cards), v = room.view(id);
    // оценка соперников по открытым картам: закрытая первая карта — в среднем 7
    let need = 0, later = 0;
    v.players.filter((p) => p.playing && p.id !== id).forEach((p) => {
      if (p.bust) return;
      const shown = (p.cards || []).filter((c) => c !== "??"), est = Math.min(21, bjTotal(shown) + 7);
      if (p.done) need = Math.max(need, est); else later++;
    });
    if (later) need = Math.max(need, 17);
    const soft = hand.cards.some((c) => c.slice(0, -1) === "A") && mine <= 21 && (() => { let t = 0; hand.cards.forEach((c) => { t += c.slice(0, -1) === "A" ? 1 : val(c); }); return t + 10 === mine; })();
    const bustP = mine <= 11 ? 0 : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10].filter((x) => mine + x > 21).length / 13;
    let move;
    if (hand.cards.length === 2 && (mine === 10 || mine === 11) && !room.settings.stake) move = "double";
    else if (mine > need && mine >= 17) move = "stand";
    else if (mine < need) move = soft || bustP < .75 ? "hit" : "stand";       // проигрываю — рискую
    else move = soft || bustP < .4 ? "hit" : "stand";
    if (chance(.15)) say(h, room, id, move === "hit" ? pick(["Ще!", "Давай ще одну", "Ризикну"]) : move === "double" ? "Подвоюю!" : pick(["Пас", "Досить", "Мені досить", "Стою"]));
    act(h, id, { slot: move }, 1000, 2500);
  }

  /* ================================================================ магічні шахи: спершу (іноді) карта, потім найкращий хід за оцінкою рушія */
  function mchessBot(h, room, id) {
    if (room.phase !== "play") return;
    const c = room.colorOf(id); if (!c || room.turn !== c) return;
    const m = mem(room, id), turnKey = room.ply;
    if (m.mcTurn !== turnKey) { m.mcTurn = turnKey; m.mcCard = false; m.mcUp = false; return think(id, 900, 2200); }   // «думає» перед ходом
    const lvl = room.settings.bot || 2;                                // складність: 1 новачок, 2 звичайний, 3 майстер
    if (!m.mcUp) { m.mcUp = true; const up = MChess.planUpgrade(room, c, lvl); if (up) return act(h, id, up, 700, 1300); }
    if (!m.mcCard) {
      m.mcCard = true;
      const card = MChess.planCard(room, c, lvl);
      if (card) { if (chance(.25)) say(h, room, id, pick(["Тримай чари ✨", "А ось і магія", "Ха!", "Не чекав?", "🔥🔥🔥"])); return act(h, id, card, 900, 1800); }
    }
    const mv = MChess.planMove(room, c, lvl);
    if (!mv) return act(h, id, { slot: "end" }, 600, 1200);
    act(h, id, mv, 1000, 2200);
  }

  // кнопки в лобби: у хоста своей комнаты
  function bar(room) {
    if (!allowed() || !Net.isHost() || !room || room.game === "draw" || room.game === "spy" || (room.settings && room.settings.tour) || !["lobby", "end"].includes(room.phase)) return "";
    const n = room.players ? room.players.filter((p) => isBot(p.id)).length : 0;
    return `<div class="card bot-bar"><div class="grow small">🤖 <b>Боти</b> — якщо бракує гравців${n ? ` · ботів: ${n}` : ""}${n && ["blackjack", "roulette", "revolver", "bluff"].includes(room.game) ? "<br><span class=\"muted\">з ботами — без ставок</span>" : ""}<br><span class=\"muted\">Переможеш — по 🪙5 за кожного бота</span></div>
      <button class="btn small" data-a="bot-add">＋ Бот</button>${n ? `<button class="btn ghost small" data-a="bot-clear">Прибрати</button>` : ""}</div>`;
  }

  // после перезапуска приложения хост снова «ведёт» ботов из сохранённой комнаты
  setInterval(() => { const h = hub(); if (h && !timer && h.room.order.some(isBot)) start(); }, 3000);

  return { debug: false, add, removeAll, bar, isBot, SKETCH, ACTIONS: { "bot-add": add, "bot-clear": removeAll } };
})();
