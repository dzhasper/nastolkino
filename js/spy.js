/* «Шпион»: движок комнаты (работает в телефоне хоста).
   Все, кроме шпиона, знают локацию и свою роль. Игроки по очереди задают друг другу вопросы (вслух или в чате).
   Шпион должен понять, где все, и угадать локацию. Остальные — вычислить шпиона.
   В любой момент можно обвинить игрока: если все остальные согласны — он раскрывается.
   Время вышло — финальное голосование. Очки за раунды, в конце — победитель. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  const MIN_PLAYERS = 3, MAX_PLAYERS = 12, CHAT_LIMIT = 120;
  const TIMES = [300, 420, 600], ROUNDS = [1, 3, 5], REVEAL_SEC = 25, VOTE_SEC = 30, FINAL_SEC = 45, RESULT_SEC = 12;
  // локация: [ключ, название, эмодзи, роли]
  const LOCATIONS = [
    ["plane", "Літак", "✈️", ["Пілот", "Стюардеса", "Пасажир економкласу", "Пасажир бізнес-класу", "Бортмеханік", "Безбілетник", "Дитина біля ілюмінатора"]],
    ["hospital", "Лікарня", "🏥", ["Хірург", "Медсестра", "Пацієнт", "Головний лікар", "Інтерн", "Санітар", "Відвідувач"]],
    ["bank", "Банк", "🏦", ["Касир", "Охоронець", "Керуючий", "Клієнт", "Грабіжник", "Інкасатор", "Консультант"]],
    ["beach", "Пляж", "🏖", ["Рятувальник", "Продавець морозива", "Турист", "Серфер", "Фотограф", "Дитина з відерцем", "Засмагальник"]],
    ["school", "Школа", "🏫", ["Учитель", "Директор", "Відмінник", "Двієчник", "Завгосп", "Кухар у їдальні", "Батько"]],
    ["circus", "Цирк", "🎪", ["Клоун", "Акробат", "Дресирувальник", "Фокусник", "Глядач", "Жонглер", "Білетер"]],
    ["submarine", "Підводний човен", "🛳", ["Капітан", "Штурман", "Кок", "Акустик", "Механік", "Радист", "Юнга"]],
    ["station", "Космічна станція", "🛰", ["Командир", "Інженер", "Науковець", "Пілот", "Космічний турист", "Лікар", "Іншопланетянин"]],
    ["casino", "Казино", "🎰", ["Круп’є", "Охоронець", "Хайролер", "Офіціант", "Адміністратор", "Шулер", "Новачок"]],
    ["restaurant", "Ресторан", "🍽", ["Шеф-кухар", "Офіціант", "Відвідувач", "Ресторанний критик", "Посудомийник", "Сомельє", "Музикант"]],
    ["police", "Поліцейська дільниця", "🚓", ["Детектив", "Черговий", "Затриманий", "Адвокат", "Начальник", "Свідок", "Журналіст"]],
    ["theatre", "Театр", "🎭", ["Актор", "Режисер", "Суфлер", "Глядач", "Гардеробниця", "Освітлювач", "Критик"]],
    ["train", "Потяг далекого прямування", "🚆", ["Машиніст", "Провідник", "Пасажир із куркою", "Студент", "Контролер", "Кухар вагона-ресторану", "Турист"]],
    ["pirates", "Піратський корабель", "🏴‍☠️", ["Капітан", "Боцман", "Кок", "Юнга", "Бранець", "Канонір", "Папуга"]],
    ["army", "Військова база", "🪖", ["Генерал", "Рядовий", "Кухар", "Медик", "Зв’язківець", "Новобранець", "Вартовий"]],
    ["market", "Супермаркет", "🛒", ["Касир", "Охоронець", "Покупець", "Вантажник", "Промоутер", "Директор магазину", "Прибиральник"]],
    ["spa", "Спа-салон", "🧖", ["Масажист", "Адміністратор", "Клієнт", "Косметолог", "Стиліст", "Майстер манікюру", "Прибиральниця"]],
    ["embassy", "Посольство", "🏛", ["Посол", "Секретар", "Охоронець", "Турист", "Дипломат", "Перекладач", "Біженець"]],
    ["university", "Університет", "🎓", ["Професор", "Студент", "Декан", "Аспірант", "Прибиральник", "Бібліотекар", "Абітурієнт"]],
    ["hotel", "Готель", "🏨", ["Портьє", "Покоївка", "Постоялець", "Менеджер", "Швейцар", "Бармен", "Охоронець"]],
    ["museum", "Музей", "🖼", ["Екскурсовод", "Доглядач", "Турист", "Реставратор", "Директор", "Школяр", "Викрадач картин"]],
    ["filmset", "Кіностудія", "🎬", ["Режисер", "Актор", "Каскадер", "Оператор", "Гример", "Звукорежисер", "Статист"]],
    ["zoo", "Зоопарк", "🦁", ["Доглядач", "Ветеринар", "Відвідувач", "Продавець солодкої вати", "Фотограф", "Дитина", "Директор"]],
    ["farm", "Ферма", "🚜", ["Фермер", "Доярка", "Тракторист", "Ветеринар", "Працівник", "Гість із міста", "Опудало"]],
    ["building", "Будова", "🏗", ["Виконроб", "Кранівник", "Муляр", "Зварник", "Архітектор", "Інспектор", "Сторож"]],
    ["club", "Нічний клуб", "🪩", ["Діджей", "Бармен", "Охоронець", "Танцюрист", "Відвідувач", "Фотограф", "Промоутер"]],
    ["library", "Бібліотека", "📚", ["Бібліотекар", "Студент", "Письменник", "Пенсіонер", "Школяр", "Прибиральниця", "Дослідник"]],
    ["metro", "Метро", "🚇", ["Машиніст", "Чергова по станції", "Пасажир", "Музикант у переході", "Контролер", "Прибиральник", "Турист із мапою"]],
    ["wedding", "Весілля", "💍", ["Наречений", "Наречена", "Тамада", "Свідок", "Теща", "Фотограф", "Гість"]],
    ["stadium", "Футбольний стадіон", "🏟", ["Воротар", "Нападник", "Суддя", "Тренер", "Уболівальник", "Коментатор", "Продавець хот-догів"]],
    ["polar", "Полярна станція", "🧊", ["Начальник станції", "Метеоролог", "Кухар", "Лікар", "Радист", "Науковець", "Білий ведмідь"]],
    ["fire", "Пожежна частина", "🚒", ["Командир", "Пожежник", "Водій", "Диспетчер", "Новачок", "Врятований кіт", "Журналіст"]],
  ];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  class SpyRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "spy";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "spy", time: 420, rounds: 3 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.scores = {}; this.round = 0; this.used = []; this.players = []; this.spy = null; this.location = null; this.roles = {};
      this.seen = {}; this.accused = {}; this.vote = null; this.final = null; this.result = null; this.history = []; this.first = null; this.left = 0; this.gameNo = (this.gameNo || 0);
    }

    dump() { const out = {}; Object.keys(this).forEach((k) => { if (k !== "clock") out[k] = this[k]; }); return JSON.parse(JSON.stringify(out)); }
    touch() { this.version += 1; }

    updateSettings(s) {
      if (TIMES.includes(Number(s.time))) this.settings.time = Number(s.time);
      if (ROUNDS.includes(Number(s.rounds))) this.settings.rounds = Number(s.rounds);
      this.touch();
    }

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.phase !== "lobby" && this.phase !== "end") throw new GameError("Гра вже триває — дочекайтеся наступної партії");
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`Кімната заповнена (${MAX_PLAYERS} гравців)`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();
    }

    leave(pid) {
      if (!this.members[pid]) return;
      if (this.phase === "lobby" || this.phase === "end") { delete this.members[pid]; this.order = this.order.filter((x) => x !== pid); }
      else {
        this.members[pid].online = false;
        if (pid === this.spy && ["reveal", "play", "vote", "final"].includes(this.phase)) this.finishRound("left", null);   // шпион сбежал — город победил
        else if (this.vote && this.phase === "vote") this.checkVote();
      }
      this.touch();
    }
    kick(by, pid) { if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Не можна"); this.leave(pid); }
    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole(pid) { if (this.phase === "reveal" && this.players.includes(pid)) { this.seen[pid] = true; this.touch(); if (this.players.filter((p) => this.members[p].online).every((p) => this.seen[p])) this.startPlay(); } }
    online() { return this.order.filter((p) => this.members[p].online); }
    name(pid) { return (this.members[pid] || {}).name || "?"; }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }

    start(by) {
      if (by !== this.host) throw new GameError("Почати може лише хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Гра вже триває");
      if (this.online().length < MIN_PLAYERS) throw new GameError(`Потрібно щонайменше ${MIN_PLAYERS} гравці`);
      this.resetGame();
      this.gameNo += 1;
      this.players = this.online().slice(0, MAX_PLAYERS);
      this.players.forEach((p) => { this.scores[p] = 0; });
      this.chat = { all: [] };
      this.nextRound();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Не можна");
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.phase = "lobby"; this.deadline = null; this.touch();
    }

    nextRound() {
      this.round += 1;
      const free = LOCATIONS.filter((l) => !this.used.includes(l[0])), loc = pick(free.length ? free : LOCATIONS);
      this.used.push(loc[0]); this.location = loc[0];
      const live = this.players.filter((p) => this.members[p] && this.members[p].online);
      this.spy = pick(live.length ? live : this.players);
      const roles = shuffle(loc[3].slice());
      this.roles = {}; let k = 0;
      this.players.forEach((p) => { if (p !== this.spy) this.roles[p] = roles[k++ % roles.length]; });
      this.seen = {}; this.accused = {}; this.vote = null; this.final = null; this.result = null;
      this.first = pick(live.length ? live : this.players);
      this.phase = "reveal"; this.setTimer(REVEAL_SEC); this.touch();
    }

    startPlay() { this.phase = "play"; this.setTimer(this.left > 0 ? this.left : this.settings.time); this.left = 0; this.touch(); }

    act(pid, d) {
      if (!this.players.includes(pid)) throw new GameError("Ти не в цій партії");
      const slot = d.slot;
      if (slot === "accuse") {
        if (this.phase !== "play") throw new GameError("Звинуватити можна лише під час раунду");
        if (this.accused[pid]) throw new GameError("Ти вже звинувачував у цьому раунді — по разу на раунд");
        if (!this.players.includes(d.target) || d.target === pid) throw new GameError("Обери іншого гравця");
        this.accused[pid] = true;
        this.left = Math.max(10, this.deadline - this.clock());             // время раунда на паузе
        this.vote = { by: pid, target: d.target, votes: { [pid]: true } };
        this.phase = "vote"; this.setTimer(VOTE_SEC); this.touch();
        this.checkVote();
      } else if (slot === "vote") {
        if (this.phase !== "vote" || !this.vote) throw new GameError("Зараз не голосування");
        if (pid === this.vote.target) throw new GameError("Обвинувачений не голосує");
        this.vote.votes[pid] = !!d.value; this.touch();
        this.checkVote();
      } else if (slot === "guess") {
        if (pid !== this.spy) throw new GameError("Локацію вгадує лише шпигун");
        if (!["play", "vote"].includes(this.phase)) throw new GameError("Зараз не можна");
        const loc = LOCATIONS.find((l) => l[0] === d.target);
        if (!loc) throw new GameError("Немає такої локації");
        this.finishRound(d.target === this.location ? "guessed" : "missed", { guess: d.target });
      } else if (slot === "final") {
        if (this.phase !== "final") throw new GameError("Зараз не фінальне голосування");
        if (!this.players.includes(d.target) || d.target === pid) throw new GameError("За себе голосувати не можна");
        this.final[pid] = d.target; this.touch();
        if (this.players.filter((p) => this.members[p].online).every((p) => this.final[p])) this.closeFinal();
      } else throw new GameError("Зараз не можна");
    }

    voters() { return this.players.filter((p) => this.members[p].online && p !== (this.vote && this.vote.target)); }
    checkVote() {
      const v = this.vote; if (!v) return;
      const vs = this.voters();
      if (vs.some((p) => v.votes[p] === false)) { this.failVote(); return; }          // хоть один против — обвинение снято
      if (vs.every((p) => v.votes[p] === true)) this.finishRound(v.target === this.spy ? "caught" : "wrong", { accused: v.target, by: v.by });
    }
    failVote() {
      const v = this.vote; this.vote = null;
      this.history.push({ round: this.round, kind: "vote_fail", text: `${this.name(v.by)} звинуватив(ла) ${this.name(v.target)}, але не всі згодні — граємо далі` });
      this.startPlay();
    }
    closeFinal() {
      const count = {};
      Object.values(this.final).forEach((t) => { count[t] = (count[t] || 0) + 1; });
      const top = Object.entries(count).sort((a, b) => b[1] - a[1]), best = top[0];
      if (!best || (top[1] && top[1][1] === best[1])) return this.finishRound("tie", { count });   // ничья — шпион ускользнул
      this.finishRound(best[0] === this.spy ? "caught" : "wrong", { accused: best[0], count, final: true });
    }

    // итог раунда: кто победил и сколько очков
    finishRound(why, info) {
      const town = this.players.filter((p) => p !== this.spy), add = {};
      const give = (p, n) => { add[p] = (add[p] || 0) + n; this.scores[p] = (this.scores[p] || 0) + n; };
      let spyWon;
      if (why === "caught" || why === "missed" || why === "left") { spyWon = false; town.forEach((p) => give(p, 1)); if (info && info.by && why === "caught") give(info.by, 1); }
      else { spyWon = true; give(this.spy, why === "guessed" ? 3 : 2); }
      const loc = LOCATIONS.find((l) => l[0] === this.location);
      const text = why === "caught" ? `Шпигуна вирахували: це ${this.name(this.spy)}!` : why === "wrong" ? `Звинуватили невинного (${this.name(info.accused)}) — шпигун ${this.name(this.spy)} переміг`
        : why === "guessed" ? `Шпигун ${this.name(this.spy)} угадав локацію — «${loc[1]}»!` : why === "missed" ? `Шпигун ${this.name(this.spy)} назвав не ту локацію й розкрив себе`
        : why === "tie" ? `Голоси розділилися — шпигун ${this.name(this.spy)} вислизнув` : `Шпигун ${this.name(this.spy)} утік із гри`;
      this.result = { why, spy: this.spy, spyWon, location: this.location, add, text, guess: info && info.guess ? info.guess : null, accused: info && info.accused ? info.accused : null, count: info && info.count ? info.count : null };
      this.history.push({ round: this.round, kind: "result", text });
      this.vote = null; this.final = null; this.left = 0;
      this.phase = "result"; this.setTimer(RESULT_SEC); this.touch();
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Лише хост");
      if (this.phase !== "lobby" && this.phase !== "end") this.advance();
    }

    advance() {
      if (this.phase === "reveal") this.startPlay();
      else if (this.phase === "play") { this.final = {}; this.phase = "final"; this.setTimer(FINAL_SEC); this.touch(); }
      else if (this.phase === "vote") { const v = this.vote; if (v) this.voters().forEach((p) => { if (v.votes[p] === undefined) v.votes[p] = false; }); this.checkVote(); }   // не успел — значит «нет»
      else if (this.phase === "final") this.closeFinal();
      else if (this.phase === "result") { if (this.round >= this.settings.rounds) this.endGame(); else this.nextRound(); }
    }
    endGame() {
      const best = Math.max(...this.players.map((p) => this.scores[p] || 0));
      this.winners = this.players.filter((p) => (this.scores[p] || 0) === best && best > 0);
      this.phase = "end"; this.deadline = null; this.touch();
    }

    tick() { if (this.deadline && this.clock() >= this.deadline) { this.advance(); return true; } return false; }

    channelsFor() { return { all: true }; }
    say(pid, channel, text) {
      text = String(text || "").trim().slice(0, 300);
      if (!text) return;
      const m = this.members[pid];
      this.chat.all.push({ from: pid, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look || {}, text, ts: Math.round(this.clock() * 1000) });
      this.chat.all = this.chat.all.slice(-CHAT_LIMIT);
      this.touch();
    }

    view(pid) {
      const inGame = this.players.includes(pid), open = ["result", "end"].includes(this.phase), loc = LOCATIONS.find((l) => l[0] === this.location);
      const players = this.order.map((id) => {
        const m = this.members[id];
        return { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host,
          playing: this.players.includes(id), score: this.scores[id] || 0, seen: !!this.seen[id], accused: !!this.accused[id], alive: true,
          final: this.phase === "final" ? !!(this.final && this.final[id]) : false };
      });
      let card = null;
      if (inGame && !["lobby"].includes(this.phase) && this.location) card = pid === this.spy ? { spy: true } : { location: loc[1], emoji: loc[2], role: this.roles[pid] };
      return {
        game: "spy", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "spy", title: "Шпигун", emoji: "🕵️", accent: "#2ec4b6", accent2: "#1b2a41" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, round: this.round, rounds: this.settings.rounds, card, first: this.first, left: this.left,
        locations: LOCATIONS.map((l) => ({ key: l[0], name: l[1], emoji: l[2] })),
        vote: this.vote ? { by: this.vote.by, target: this.vote.target, votes: this.vote.votes } : null,
        my_final: this.final ? this.final[pid] || null : null, final_n: this.final ? Object.keys(this.final).length : 0,
        result: this.result && open ? Object.assign({}, this.result, { location: loc ? { key: loc[0], name: loc[1], emoji: loc[2] } : null, roles: this.roles }) : null,
        history: this.history.slice(-8), winners: this.phase === "end" ? this.winners || [] : [],
        chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  const api = { SpyRoom, LOCATIONS, TIMES, ROUNDS, MIN_PLAYERS, MAX_PLAYERS };
  root.Spy = api;
  Engine.SpyRoom = SpyRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
