/* «Верю — не верю» — подвальный режим на 2–4 игроков: карты на столе и у каждого свой револьвер. Движок комнаты (работает в телефоне хоста).
   Колода: 6 королей, 6 дам, 6 тузов и 2 джокера. Каждому — по 5 карт. Подвал объявляет, что требует стол: короли, дамы или тузы.
   В свой ход кладёшь рубашкой вверх 1–3 карты и говоришь, что это то, что требует стол. Джокер подходит за что угодно.
   Следующий решает: поверить и положить свои — или сказать «Не верю!». Карты вскрывают: соврал — стреляет лжец, сказал правду — тот, кто не поверил.
   Стреляют в себя из своего револьвера: шесть гнёзд, один патрон, где он — не знает никто, барабан не крутят — с каждым щелчком ближе.
   У кого кончились карты, того пропускают; если карты остались только у одного — следующий обязан сказать «Не верю!».
   После выстрела — новая раздача и новая карта стола. Последний живой забирает банк. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  const MIN_PLAYERS = 2, MAX_PLAYERS = 4, HAND = 5, MAX_PLAY = 3, CHAMBERS = 6, CHAT_LIMIT = 80, CHAR_N = 10;
  const DEAL_PAUSE = 3.6, CALL_PAUSE = 6.0, LIVE_EXTRA = 1.4;   // раздача: карта стола показывается и делает один оборот
  const TURN_TIMES = [15, 20, 30, 45], STAKES = [0, 10, 25, 50, 100, 250, 500, 1000], STAKE_MAX = 10000;
  const okStake = (v) => Number.isInteger(v) && v >= 0 && v <= STAKE_MAX;
  const RANKS = {
    K: { name: "Король", many: "Короли", f: false, ico: "♚", forms: ["король", "короля", "короля"] },
    Q: { name: "Дама", many: "Дамы", f: true, ico: "♛", forms: ["дама", "дамы", "дамы"] },
    A: { name: "Туз", many: "Тузы", f: false, ico: "♠", forms: ["туз", "туза", "туза"] },
    J: { name: "Джокер", many: "Джокеры", f: false, ico: "🃏", forms: ["джокер", "джокера", "джокера"] },
  };
  const TABLE_RANKS = ["K", "Q", "A"];
  const DECK = [].concat(...TABLE_RANKS.map((r) => Array(6).fill(r)), ["J", "J"]);
  const NUM = { 1: ["Один", "Одна"], 2: ["Два", "Две"], 3: ["Три", "Три"] };
  const claimText = (n, rank) => { const R = RANKS[rank]; return `${NUM[n][R.f ? 1 : 0]} ${R.forms[n - 1]}`; };   // «Две дамы», «Три короля»
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  class BluffRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "bluff";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "bluff", turnTime: 20, stake: 0 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.seats = []; this.hp = {}; this.chars = {}; this.deaths = {}; this.hands = {}; this.guns = {};
      this.rank = null; this.pile = 0; this.last = null; this.round = 0;
      this.turn = null; this.events = []; this.eventN = 0; this.winner = null; this.pending = null;
    }

    dump() {
      const out = {};
      Object.keys(this).forEach((k) => { if (k !== "clock") out[k] = this[k]; });
      return JSON.parse(JSON.stringify(out));
    }

    touch() { this.version += 1; }

    updateSettings(s) {
      if (TURN_TIMES.includes(Number(s.turnTime))) this.settings.turnTime = Number(s.turnTime);
      if (s.stake != null && okStake(Number(s.stake)) && !(Number(s.stake) && this.order.some((p) => /^bot_/.test(p)))) this.settings.stake = Number(s.stake);   // с ботами — без ставок
      this.touch();
    }

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.phase !== "lobby" && this.phase !== "end") throw new GameError("Игра уже идёт — дождитесь следующей партии");
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`За столом только ${MAX_PLAYERS} места`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();
    }

    leave(pid) {
      if (!this.members[pid]) return;
      if (this.phase === "lobby" || (this.phase === "end" && !this.seats.includes(pid))) { delete this.members[pid]; this.order = this.order.filter((x) => x !== pid); }
      else if (this.phase === "end") this.members[pid].online = false;
      else {
        this.members[pid].online = false;
        if (this.hp[pid] > 0) {
          this.hp[pid] = 0; this.deaths[pid] = "left"; this.hands[pid] = [];
          if (this.last && this.last.by === pid) this.last = null;            // его карты остаются в куче, но вскрывать уже некого
          this.event({ kind: "left", who: pid, text: `${this.name(pid)} встаёт из-за стола и уходит` });
          if (!this.checkWin()) {
            if (this.phase === "play" && this.turn === pid) { this.turn = this.nextAfter(pid); this.startTurn(); }
            else if (this.phase === "play") this.startTurn(true);
            else if (this.pending && this.pending.first === pid) this.pending.first = this.nextAfter(pid);
          }
        }
      }
      this.touch();
    }

    kick(by, pid) {
      if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Нельзя");
      this.leave(pid);
    }

    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole() {}
    name(pid) { return this.members[pid] ? this.members[pid].name : "?"; }
    alive() { return this.seats.filter((p) => this.hp[p] > 0); }
    cards(pid) { return (this.hands[pid] || []).length; }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }
    event(e) { this.eventN += 1; e.n = this.eventN; this.events.push(e); this.events = this.events.slice(-30); return e; }
    nextAfter(pid, need) {
      const i = this.seats.indexOf(pid);
      for (let k = 1; k <= this.seats.length; k++) { const p = this.seats[(i + k) % this.seats.length]; if (this.hp[p] > 0 && (!need || need(p))) return p; }
      return null;
    }
    // обязан сказать «Не верю»: у самого карт нет, а положивший последним — живой соперник
    mustCall(pid) { return !!this.last && this.last.by !== pid && this.hp[this.last.by] > 0 && !this.cards(pid); }
    canCall(pid) { return !!this.last && this.last.by !== pid && this.hp[this.last.by] > 0; }

    start(by) {
      if (by !== this.host) throw new GameError("Начать может только хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Игра уже идёт");
      const online = this.order.filter((p) => this.members[p].online);
      if (online.length < MIN_PLAYERS) throw new GameError(`Нужно минимум ${MIN_PLAYERS} игрока`);
      const poor = online.slice(0, MAX_PLAYERS).filter((p) => this.settings.stake && Number((this.members[p].look || {}).c || 0) < this.settings.stake);
      if (poor.length) throw new GameError(`Не хватает монет на ставку ${this.settings.stake}: ${poor.map((p) => this.name(p)).join(", ")}`);
      this.resetGame();
      this.gameNo = (this.gameNo || 0) + 1;
      this.seats = online.slice(0, MAX_PLAYERS);
      const looks = shuffle(Array.from({ length: CHAR_N }, (_, i) => i));
      this.seats.forEach((p, i) => {
        this.hp[p] = 1; this.chars[p] = looks[i % CHAR_N];
        this.guns[p] = { pos: Math.floor(Math.random() * CHAMBERS), pulls: 0 };   // у каждого свой револьвер: один патрон в случайном гнезде
      });
      this.chat = { all: [] };
      this.event({ kind: "start", text: "Дверь подвала закрылась. Перед каждым — колода и свой револьвер." });
      this.newRound(pick(this.seats));
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
      this.phase = "lobby";
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.resetGame(); this.deadline = null; this.touch();
    }

    /* ---------- раздача: новая карта стола, по 5 карт живым */
    newRound(first) {
      this.round += 1;
      const deck = shuffle(DECK.slice());
      this.hands = {};
      this.alive().forEach((p) => { this.hands[p] = deck.splice(0, HAND); });
      this.rank = pick(TABLE_RANKS); this.pile = 0; this.last = null;
      this.turn = this.hp[first] > 0 ? first : this.nextAfter(first);
      this.phase = "deal"; this.pending = null;
      this.event({ kind: "deal", rank: this.rank, round: this.round, first: this.turn, text: `Раздача №${this.round}. Стол требует: ${RANKS[this.rank].many.toUpperCase()}. Первым ходит ${this.name(this.turn)}` });
      this.setTimer(DEAL_PAUSE); this.touch();
    }

    // ход: кто без карт и не обязан вскрывать — того пропускаем; если карт нет ни у кого и вскрывать нечего — пересдача
    startTurn(keep) {
      let guard = 0;
      while (guard++ < 8 && !this.cards(this.turn) && !this.mustCall(this.turn)) {
        const nx = this.nextAfter(this.turn, (p) => this.cards(p) > 0 || this.mustCall(p));
        if (!nx) { this.event({ kind: "redeal", text: "Карты кончились у всех — пересдача" }); return this.newRound(this.turn); }
        this.turn = nx;
      }
      this.phase = "play";
      if (!keep) this.setTimer(this.settings.turnTime);
      this.touch();
    }

    play(pid, idx, expect) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      const hand = this.hands[pid] || [];
      if (!hand.length) throw new GameError("Карт нет — остаётся только «Не верю!»");
      if (!Array.isArray(idx)) throw new GameError("Выбери карты");
      const list = [...new Set(idx.map(Number))].filter((i) => Number.isInteger(i) && i >= 0 && i < hand.length);
      if (!list.length || list.length !== idx.length) throw new GameError("Выбери от одной до трёх карт");
      if (list.length > MAX_PLAY) throw new GameError(`Не больше ${MAX_PLAY} карт за раз`);
      if (Array.isArray(expect) && expect.join() !== hand.join()) throw new GameError("Карты уже поменялись — выбери ещё раз");
      const cards = list.map((i) => hand[i]);
      this.hands[pid] = hand.filter((_, i) => !list.includes(i));
      this.last = { by: pid, cards, n: cards.length }; this.pile += cards.length;
      this.event({ kind: "play", who: pid, cnt: cards.length, rank: this.rank, left: this.hands[pid].length, text: `${this.name(pid)} кладёт ${cards.length} ${cards.length === 1 ? "карту" : "карты"}: «${claimText(cards.length, this.rank)}»` });
      // следующий — первый живой после него с картами; если карты остались только у положившего — следующий обязан вскрыть
      this.turn = this.nextAfter(pid, (p) => this.cards(p) > 0) || this.nextAfter(pid);
      if (this.turn === pid) this.turn = this.nextAfter(pid);
      this.startTurn();
    }

    call(pid) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (!this.canCall(pid)) throw new GameError("Вскрывать нечего");
      const L = this.last, truth = L.cards.every((c) => c === this.rank || c === "J"), loser = truth ? pid : L.by;
      this.event({ kind: "call", who: pid, target: L.by, cards: L.cards.slice(), rank: this.rank, truth, loser,
        text: `${this.name(pid)}: «Не верю!» Вскрываем: ${L.cards.map((c) => RANKS[c].name.toLowerCase()).join(", ")} — ${truth ? `правда. Стреляет ${this.name(pid)}` : `${this.name(L.by)} соврал(а) и стреляет`}` });
      const g = this.guns[loser], live = g.pos === 0;
      g.pulls += 1; if (!live) g.pos -= 1;
      const wait = +(1.2 + Math.random() * 2.4).toFixed(2);              // рука дрожит у виска — заминка, одна на всех
      if (live) { this.hp[loser] = 0; this.deaths[loser] = pick(["temple", "slump", "chest"]); this.hands[loser] = []; }
      this.event({ kind: "shot", who: loser, target: loser, hit: live ? loser : null, self: true, live, out: live, pulls: g.pulls, death: live ? this.deaths[loser] : null, wait,
        text: live ? `${this.name(loser)} приставляет револьвер к виску — БАХ!` : `${this.name(loser)} приставляет револьвер к виску… щёлк. Повезло` });
      this.last = null; this.phase = "reveal"; this.pending = { first: loser };
      this.setTimer(CALL_PAUSE + wait + (live ? LIVE_EXTRA : 0)); this.touch();
    }

    checkWin() {
      const alive = this.alive();
      if (alive.length > 1) return false;
      this.winner = alive[0] || null;
      this.event({ kind: "win", who: this.winner, text: this.winner ? `${this.name(this.winner)} — последний(яя) за столом` : "За столом никого не осталось" });
      this.phase = "end"; this.deadline = null; this.total = null; this.touch();
      return true;
    }

    act(pid, d) {
      if (!this.seats.includes(pid) || !(this.hp[pid] > 0)) throw new GameError("Ты не за столом");
      if (d.slot === "play") return this.play(pid, d.cards, d.expect);
      if (d.slot === "call") return this.call(pid);
      throw new GameError("Сейчас нельзя");
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
      if (this.phase !== "lobby" && this.phase !== "end") this.advance();
    }

    advance() {
      if (this.phase === "deal") this.startTurn();
      else if (this.phase === "reveal") {
        const first = this.pending ? this.pending.first : this.turn;
        this.pending = null;
        if (!this.checkWin()) this.newRound(first);
      } else if (this.phase === "play") {                       // время вышло: без карт — вскрывает, с картами — кладёт одну наугад
        const p = this.turn;
        if (!(this.hp[p] > 0)) { this.turn = this.nextAfter(p); return this.startTurn(); }
        this.event({ kind: "timeout", who: p, text: `${this.name(p)} слишком долго думал(а)` });
        if (this.mustCall(p)) this.call(p);
        else if (this.cards(p)) this.play(p, [Math.floor(Math.random() * this.cards(p))]);
        else { this.turn = this.nextAfter(p); this.startTurn(); }
      }
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
      const players = this.order.map((id) => {
        const m = this.members[id];
        return { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host,
          seat: this.seats.indexOf(id), hp: this.hp[id] || 0, alive: this.phase === "lobby" || this.hp[id] > 0, cards: this.cards(id),
          pulls: (this.guns[id] || {}).pulls || 0, char: this.chars[id] != null ? this.chars[id] : null, death: this.deaths[id] || null, items: [], status: {}, wounds: 0 };
      });
      return {
        game: "bluff", mode: "bluff", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "bluff", title: "Верю — не верю", emoji: "🎴", accent: "#b0141f", accent2: "#2a0808" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, seats: this.seats.slice(), stake: this.settings.stake || 0, pot: (this.settings.stake || 0) * this.seats.length, turn: this.turn, aim: null, winner: this.winner, maxHp: 1,
        table: { rank: this.rank, pile: this.pile, round: this.round, last: this.last ? { by: this.last.by, n: this.last.n } : null },
        hand: (this.hands[pid] || []).slice(), must_call: this.phase === "play" && this.turn === pid && this.mustCall(pid), can_call: this.phase === "play" && this.turn === pid && this.canCall(pid),
        events: this.events.slice(-12), chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  const api = { BluffRoom, RANKS, TABLE_RANKS, DECK, HAND, MAX_PLAY, CHAMBERS, TURN_TIMES, STAKES, STAKE_MAX, CHAR_N, MIN_PLAYERS, MAX_PLAYERS, claimText };
  root.Bluff = api;
  Engine.BluffRoom = BluffRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
