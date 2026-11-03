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
    ["plane", "Самолёт", "✈️", ["Пилот", "Стюардесса", "Пассажир эконом-класса", "Пассажир бизнес-класса", "Бортмеханик", "Безбилетник", "Ребёнок у иллюминатора"]],
    ["hospital", "Больница", "🏥", ["Хирург", "Медсестра", "Пациент", "Главврач", "Интерн", "Санитар", "Посетитель"]],
    ["bank", "Банк", "🏦", ["Кассир", "Охранник", "Управляющий", "Клиент", "Грабитель", "Инкассатор", "Консультант"]],
    ["beach", "Пляж", "🏖", ["Спасатель", "Продавец мороженого", "Турист", "Сёрфер", "Фотограф", "Ребёнок с ведёрком", "Загорающий"]],
    ["school", "Школа", "🏫", ["Учитель", "Директор", "Отличник", "Двоечник", "Завхоз", "Повар в столовой", "Родитель"]],
    ["circus", "Цирк", "🎪", ["Клоун", "Акробат", "Дрессировщик", "Фокусник", "Зритель", "Жонглёр", "Билетёр"]],
    ["submarine", "Подводная лодка", "🛳", ["Капитан", "Штурман", "Кок", "Акустик", "Механик", "Радист", "Юнга"]],
    ["station", "Космическая станция", "🛰", ["Командир", "Инженер", "Учёный", "Пилот", "Космический турист", "Врач", "Инопланетянин"]],
    ["casino", "Казино", "🎰", ["Крупье", "Охранник", "Хайроллер", "Официант", "Администратор", "Шулер", "Новичок"]],
    ["restaurant", "Ресторан", "🍽", ["Шеф-повар", "Официант", "Посетитель", "Ресторанный критик", "Посудомойщик", "Сомелье", "Музыкант"]],
    ["police", "Полицейский участок", "🚓", ["Детектив", "Дежурный", "Задержанный", "Адвокат", "Начальник", "Свидетель", "Журналист"]],
    ["theatre", "Театр", "🎭", ["Актёр", "Режиссёр", "Суфлёр", "Зритель", "Гардеробщица", "Осветитель", "Критик"]],
    ["train", "Поезд дальнего следования", "🚆", ["Машинист", "Проводник", "Пассажир с курицей", "Студент", "Контролёр", "Повар вагона-ресторана", "Турист"]],
    ["pirates", "Пиратский корабль", "🏴‍☠️", ["Капитан", "Боцман", "Кок", "Юнга", "Пленник", "Канонир", "Попугай"]],
    ["army", "Военная база", "🪖", ["Генерал", "Рядовой", "Повар", "Медик", "Связист", "Новобранец", "Часовой"]],
    ["market", "Супермаркет", "🛒", ["Кассир", "Охранник", "Покупатель", "Грузчик", "Промоутер", "Директор магазина", "Уборщик"]],
    ["spa", "Спа-салон", "🧖", ["Массажист", "Администратор", "Клиент", "Косметолог", "Стилист", "Мастер маникюра", "Уборщица"]],
    ["embassy", "Посольство", "🏛", ["Посол", "Секретарь", "Охранник", "Турист", "Дипломат", "Переводчик", "Беженец"]],
    ["university", "Университет", "🎓", ["Профессор", "Студент", "Декан", "Аспирант", "Уборщик", "Библиотекарь", "Абитуриент"]],
    ["hotel", "Отель", "🏨", ["Портье", "Горничная", "Постоялец", "Менеджер", "Швейцар", "Бармен", "Охранник"]],
    ["museum", "Музей", "🖼", ["Экскурсовод", "Смотритель", "Турист", "Реставратор", "Директор", "Школьник", "Вор картин"]],
    ["filmset", "Киностудия", "🎬", ["Режиссёр", "Актёр", "Каскадёр", "Оператор", "Гримёр", "Звукорежиссёр", "Статист"]],
    ["zoo", "Зоопарк", "🦁", ["Смотритель", "Ветеринар", "Посетитель", "Продавец сладкой ваты", "Фотограф", "Ребёнок", "Директор"]],
    ["farm", "Ферма", "🚜", ["Фермер", "Доярка", "Тракторист", "Ветеринар", "Работник", "Гость из города", "Пугало"]],
    ["building", "Стройка", "🏗", ["Прораб", "Крановщик", "Каменщик", "Сварщик", "Архитектор", "Инспектор", "Сторож"]],
    ["club", "Ночной клуб", "🪩", ["Диджей", "Бармен", "Охранник", "Танцор", "Посетитель", "Фотограф", "Промоутер"]],
    ["library", "Библиотека", "📚", ["Библиотекарь", "Студент", "Писатель", "Пенсионер", "Школьник", "Уборщица", "Исследователь"]],
    ["metro", "Метро", "🚇", ["Машинист", "Дежурная по станции", "Пассажир", "Музыкант в переходе", "Контролёр", "Уборщик", "Турист с картой"]],
    ["wedding", "Свадьба", "💍", ["Жених", "Невеста", "Тамада", "Свидетель", "Тёща", "Фотограф", "Гость"]],
    ["stadium", "Футбольный стадион", "🏟", ["Вратарь", "Нападающий", "Судья", "Тренер", "Болельщик", "Комментатор", "Продавец хот-догов"]],
    ["polar", "Полярная станция", "🧊", ["Начальник станции", "Метеоролог", "Повар", "Врач", "Радист", "Учёный", "Белый медведь"]],
    ["fire", "Пожарная часть", "🚒", ["Командир", "Пожарный", "Водитель", "Диспетчер", "Новичок", "Спасённый кот", "Журналист"]],
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
      if (this.phase !== "lobby" && this.phase !== "end") throw new GameError("Игра уже идёт — дождитесь следующей партии");
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`Комната заполнена (${MAX_PLAYERS} игроков)`);
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
    kick(by, pid) { if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Нельзя"); this.leave(pid); }
    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole(pid) { if (this.phase === "reveal" && this.players.includes(pid)) { this.seen[pid] = true; this.touch(); if (this.players.filter((p) => this.members[p].online).every((p) => this.seen[p])) this.startPlay(); } }
    online() { return this.order.filter((p) => this.members[p].online); }
    name(pid) { return (this.members[pid] || {}).name || "?"; }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }

    start(by) {
      if (by !== this.host) throw new GameError("Начать может только хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Игра уже идёт");
      if (this.online().length < MIN_PLAYERS) throw new GameError(`Нужно минимум ${MIN_PLAYERS} игрока`);
      this.resetGame();
      this.gameNo += 1;
      this.players = this.online().slice(0, MAX_PLAYERS);
      this.players.forEach((p) => { this.scores[p] = 0; });
      this.chat = { all: [] };
      this.nextRound();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
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
      if (!this.players.includes(pid)) throw new GameError("Ты не в этой партии");
      const slot = d.slot;
      if (slot === "accuse") {
        if (this.phase !== "play") throw new GameError("Обвинить можно только во время раунда");
        if (this.accused[pid]) throw new GameError("Ты уже обвинял в этом раунде — по разу на раунд");
        if (!this.players.includes(d.target) || d.target === pid) throw new GameError("Выбери другого игрока");
        this.accused[pid] = true;
        this.left = Math.max(10, this.deadline - this.clock());             // время раунда на паузе
        this.vote = { by: pid, target: d.target, votes: { [pid]: true } };
        this.phase = "vote"; this.setTimer(VOTE_SEC); this.touch();
        this.checkVote();
      } else if (slot === "vote") {
        if (this.phase !== "vote" || !this.vote) throw new GameError("Сейчас не голосование");
        if (pid === this.vote.target) throw new GameError("Обвиняемый не голосует");
        this.vote.votes[pid] = !!d.value; this.touch();
        this.checkVote();
      } else if (slot === "guess") {
        if (pid !== this.spy) throw new GameError("Угадывает локацию только шпион");
        if (!["play", "vote"].includes(this.phase)) throw new GameError("Сейчас нельзя");
        const loc = LOCATIONS.find((l) => l[0] === d.target);
        if (!loc) throw new GameError("Нет такой локации");
        this.finishRound(d.target === this.location ? "guessed" : "missed", { guess: d.target });
      } else if (slot === "final") {
        if (this.phase !== "final") throw new GameError("Сейчас не финальное голосование");
        if (!this.players.includes(d.target) || d.target === pid) throw new GameError("За себя голосовать нельзя");
        this.final[pid] = d.target; this.touch();
        if (this.players.filter((p) => this.members[p].online).every((p) => this.final[p])) this.closeFinal();
      } else throw new GameError("Сейчас нельзя");
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
      this.history.push({ round: this.round, kind: "vote_fail", text: `${this.name(v.by)} обвинил(а) ${this.name(v.target)}, но не все согласны — играем дальше` });
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
      const text = why === "caught" ? `Шпиона вычислили: это ${this.name(this.spy)}!` : why === "wrong" ? `Обвинили невиновного (${this.name(info.accused)}) — шпион ${this.name(this.spy)} победил`
        : why === "guessed" ? `Шпион ${this.name(this.spy)} угадал локацию — «${loc[1]}»!` : why === "missed" ? `Шпион ${this.name(this.spy)} назвал не ту локацию и раскрыл себя`
        : why === "tie" ? `Голоса разделились — шпион ${this.name(this.spy)} ускользнул` : `Шпион ${this.name(this.spy)} сбежал из игры`;
      this.result = { why, spy: this.spy, spyWon, location: this.location, add, text, guess: info && info.guess ? info.guess : null, accused: info && info.accused ? info.accused : null, count: info && info.count ? info.count : null };
      this.history.push({ round: this.round, kind: "result", text });
      this.vote = null; this.final = null; this.left = 0;
      this.phase = "result"; this.setTimer(RESULT_SEC); this.touch();
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
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
        theme: { key: "spy", title: "Шпион", emoji: "🕵️", accent: "#2ec4b6", accent2: "#1b2a41" },
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
