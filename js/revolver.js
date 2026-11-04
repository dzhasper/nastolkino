/* «Русская рулетка» — подвальный режим на 2–6 игроков за большим круглым столом. Движок комнаты (работает в телефоне хоста).
   Револьвер на 6 гнёзд, в одном — боевой патрон, место случайное. Ходят по кругу: в свой ход выбираешь, в кого стрелять, — в себя или в любого.
   Выстрелил в себя и выжил — «храбрец»: до твоего следующего хода в тебя целиться нельзя. Раз за зарядку можно крутануть барабан.
   Когда патрон выстрелил, барабан перезаряжается: снова один патрон в случайном гнезде.
   Деньги: каждый ставит одинаково. Выжил после выстрела в себя — берёшь со стола 🎖 фишку храбреца. Выбил соперника выстрелом —
   забираешь все его фишки. Погиб от своей руки — твои фишки остаются на столе и уходят победителю.
   В конце половина банка делится по фишкам (у кого сколько), вторая половина и остаток — последнему за столом. Нет фишек — весь банк ему. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  const MIN_PLAYERS = 2, MAX_PLAYERS = 6, CHAMBERS = 6, CHAT_LIMIT = 80, CHAR_N = 10;
  const SHOT_PAUSE = 2.4, LIVE_PAUSE = 3.6, RELOAD_PAUSE = 2.6, CHIP_SHARE = .5, CHIP_COIN = 3, CHIP_COIN_MAX = 15;
  const HP_OPTIONS = [1, 2, 3], TURN_TIMES = [15, 20, 30, 45], STAKES = [0, 10, 25, 50, 100, 250, 500, 1000], STAKE_MAX = 10000;
  const okStake = (v) => Number.isInteger(v) && v >= 0 && v <= STAKE_MAX;
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  class RevolverRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "revolver";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "revolver", hp: 1, turnTime: 20, stake: 0 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.seats = []; this.hp = {}; this.chars = {}; this.wounds = {}; this.deaths = {};
      this.pos = 0; this.left = CHAMBERS; this.loads = 0; this.spun = {}; this.brave = {}; this.fired = 0; this.chips = {}; this.tableChips = 0;
      this.turn = null; this.aim = null; this.events = []; this.eventN = 0; this.winner = null; this.pending = null;
    }

    dump() {
      const out = {};
      Object.keys(this).forEach((k) => { if (k !== "clock") out[k] = this[k]; });
      return JSON.parse(JSON.stringify(out));
    }

    touch() { this.version += 1; }

    updateSettings(s) {
      if (HP_OPTIONS.includes(Number(s.hp))) this.settings.hp = Number(s.hp);
      if (TURN_TIMES.includes(Number(s.turnTime))) this.settings.turnTime = Number(s.turnTime);
      if (s.stake != null && okStake(Number(s.stake)) && !(Number(s.stake) && this.order.some((p) => /^bot_/.test(p)))) this.settings.stake = Number(s.stake);
      this.touch();
    }

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.phase !== "lobby" && this.phase !== "end") throw new GameError("Игра уже идёт — дождитесь следующей партии");
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`За столом только ${MAX_PLAYERS} мест`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();
    }

    leave(pid) {
      if (!this.members[pid]) return;
      if (this.phase === "lobby" || (this.phase === "end" && !this.seats.includes(pid))) { delete this.members[pid]; this.order = this.order.filter((x) => x !== pid); }
      else if (this.phase === "end") this.members[pid].online = false;
      else {
        this.members[pid].online = false;
        if (this.hp[pid] > 0) {
          this.hp[pid] = 0; this.deaths[pid] = "left"; this.tableChips = (this.tableChips || 0) + ((this.chips || {})[pid] || 0); if (this.chips) this.chips[pid] = 0;
          this.event({ kind: "left", who: pid, text: `${this.name(pid)} встаёт из-за стола и уходит` });
          if (!this.checkWin() && this.phase === "play" && this.turn === pid) { this.turn = this.nextAfter(pid); this.startTurn(); }
          else if (this.phase === "shot" && this.pending && this.pending.next === pid) this.pending.next = this.nextAfter(pid);
          if (this.aim === pid) this.aim = null;
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
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }
    event(e) { this.eventN += 1; e.n = this.eventN; this.events.push(e); this.events = this.events.slice(-30); return e; }

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
      this.seats.forEach((p, i) => { this.hp[p] = this.settings.hp; this.chars[p] = looks[i % CHAR_N]; this.wounds[p] = 0; });
      this.chat = { all: [] };
      this.turn = pick(this.seats);
      this.event({ kind: "start", text: "Дверь подвала закрылась. Револьвер лежит в центре стола." });
      this.reload();
      this.startTurn();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
      this.phase = "lobby";
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.resetGame(); this.deadline = null; this.touch();
    }

    // один боевой в случайное из шести гнёзд; pos — сколько пустых гнёзд до него
    reload() {
      this.loads += 1; this.pos = Math.floor(Math.random() * CHAMBERS); this.left = CHAMBERS; this.spun = {}; this.fired = 0;
      this.event({ kind: "load", chambers: CHAMBERS, text: `Барабан заряжен: один патрон из ${CHAMBERS}. Где он — не знает никто` });
    }

    nextAfter(pid) {
      const i = this.seats.indexOf(pid);
      for (let k = 1; k <= this.seats.length; k++) { const p = this.seats[(i + k) % this.seats.length]; if (this.hp[p] > 0) return p; }
      return pid;
    }

    startTurn() {
      this.phase = "play"; this.aim = null;
      if (this.brave[this.turn]) delete this.brave[this.turn];        // храбрость действует до своего следующего хода
      this.setTimer(this.settings.turnTime);
      this.touch();
    }

    canTarget(pid, target) { return this.hp[target] > 0 && (target === pid || !this.brave[target]); }

    setAim(pid, target) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (!(this.hp[target] > 0)) throw new GameError("Он(а) уже не за столом");
      if (!this.canTarget(pid, target)) throw new GameError(`${this.name(target)} — храбрец: выстрелил(а) в себя и выжил(а). До своего хода в него(неё) целиться нельзя`);
      this.aim = target; this.touch();
    }

    spin(pid) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (this.spun[pid]) throw new GameError("Барабан крутят один раз за зарядку");
      this.spun[pid] = true;
      this.pos = Math.floor(Math.random() * CHAMBERS); this.left = CHAMBERS;
      this.event({ kind: "spin", who: pid, text: `${this.name(pid)} крутит барабан. Шансы снова — 1 из ${CHAMBERS}` });
      this.touch();
    }

    shoot(pid, target) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (!(this.hp[target] > 0)) throw new GameError("Он(а) уже не за столом");
      if (!this.canTarget(pid, target)) throw new GameError("В храбреца сейчас стрелять нельзя");
      const live = this.pos === 0, self = target === pid, chance = this.left;
      this.fired += 1;
      if (!live) { this.pos -= 1; this.left -= 1; }
      let out = false, took = 0, chip = false;
      this.chips = this.chips || {};
      if (live) {
        this.hp[target] = Math.max(0, this.hp[target] - 1); this.wounds[target] = (this.wounds[target] || 0) + 1;
        out = this.hp[target] === 0;
        if (out) {
          this.deaths[target] = self ? "head" : Math.random() < .5 ? "table" : "head";
          const had = this.chips[target] || 0; this.chips[target] = 0;
          if (self) this.tableChips = (this.tableChips || 0) + had;       // погиб от своей руки — фишки остаются на столе
          else { took = had; this.chips[pid] = (this.chips[pid] || 0) + had; }   // выбил — забрал его фишки
        }
      } else if (self) { this.brave[pid] = true; this.chips[pid] = (this.chips[pid] || 0) + 1; chip = true; }
      const who = this.name(pid), tn = this.name(target);
      const text = !live ? (self ? `${who} приставляет револьвер к виску… щёлк. Берёт фишку храбреца 🎖` : `${who} стреляет в ${tn}… щёлк. Пусто`)
        : `${who} стреляет в ${self ? "себя" : tn} — БАХ! ${out ? `${self ? who : tn} падает${took ? ` · ${who} забирает фишки: ${took}` : ""}` : "Минус сердце"}`;
      this.event({ kind: "shot", who: pid, target, hit: live ? target : null, live, self, out, chance, chip, took, death: out ? this.deaths[target] : null, text });
      if (this.checkWin()) return;
      this.pending = { next: this.nextAfter(pid), reload: live };
      this.phase = "shot"; this.aim = null; this.setTimer(live ? LIVE_PAUSE : SHOT_PAUSE); this.touch();
    }

    checkWin() {
      const alive = this.alive();
      if (alive.length > 1) return false;
      this.winner = alive[0] || null;
      this.event({ kind: "win", who: this.winner, text: this.winner ? `${this.name(this.winner)} — последний(яя) за столом` : "За столом никого не осталось" });
      this.phase = "end"; this.deadline = null; this.total = null; this.aim = null; this.touch();
      return true;
    }

    act(pid, d) {
      if (!this.seats.includes(pid) || !(this.hp[pid] > 0)) throw new GameError("Ты не за столом");
      if (d.slot === "shoot") return this.shoot(pid, d.target);
      if (d.slot === "aim") return this.setAim(pid, d.target);
      if (d.slot === "spin") return this.spin(pid);
      throw new GameError("Сейчас нельзя");
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
      if (this.phase !== "lobby" && this.phase !== "end") this.advance();
    }

    advance() {
      if (this.phase === "shot") {
        const p = this.pending || { next: this.nextAfter(this.turn) };
        this.pending = null;
        if (p.reload) { this.phase = "reload"; this.turn = this.hp[p.next] > 0 ? p.next : this.nextAfter(p.next); this.reload(); this.setTimer(RELOAD_PAUSE); this.touch(); return; }
        this.turn = this.hp[p.next] > 0 ? p.next : this.nextAfter(p.next);
        this.startTurn();
      } else if (this.phase === "reload") {
        if (!(this.hp[this.turn] > 0)) this.turn = this.nextAfter(this.turn);
        this.startTurn();
      } else if (this.phase === "play") {                       // время вышло — рука сама жмёт на спуск (в себя)
        if (!(this.hp[this.turn] > 0)) { this.turn = this.nextAfter(this.turn); return this.startTurn(); }
        this.event({ kind: "timeout", who: this.turn, text: `${this.name(this.turn)} слишком долго думал(а) — рука сама поднялась к виску` });
        this.shoot(this.turn, this.turn);
      }
    }

    // делёж банка: половина — по фишкам храбреца, остальное — последнему за столом
    payout() {
      const stake = this.settings.stake || 0, pot = stake * this.seats.length, out = {};
      if (!pot || this.phase !== "end") return null;
      const chips = this.chips || {}, own = this.seats.filter((p) => chips[p] > 0);
      const total = own.reduce((a, p) => a + chips[p], 0) + (this.winner ? this.tableChips || 0 : 0);
      let paid = 0;
      if (total) {
        const each = Math.floor(pot * CHIP_SHARE / total);
        own.forEach((p) => { out[p] = chips[p] * each; paid += out[p]; });
        if (this.winner) { out[this.winner] = (out[this.winner] || 0) + (this.tableChips || 0) * each; paid += (this.tableChips || 0) * each; }
      }
      if (this.winner) out[this.winner] = (out[this.winner] || 0) + pot - paid;
      return out;
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
          seat: this.seats.indexOf(id), hp: this.hp[id] || 0, alive: this.phase === "lobby" || this.hp[id] > 0, brave: !!this.brave[id], spun: !!this.spun[id], chips: (this.chips || {})[id] || 0,
          char: this.chars[id] != null ? this.chars[id] : null, wounds: this.wounds[id] || 0, death: this.deaths[id] || null, items: [], status: {} };
      });
      return {
        game: "revolver", mode: "revolver", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "revolver", title: "Русская рулетка", emoji: "🔫", accent: "#b0141f", accent2: "#2a0808" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, seats: this.seats.slice(), stake: this.settings.stake || 0, pot: (this.settings.stake || 0) * this.seats.length, turn: this.turn,
        aim: this.phase === "play" ? this.aim || null : null, winner: this.winner, maxHp: this.settings.hp,
        cyl: { chambers: CHAMBERS, left: this.left, fired: this.fired, loads: this.loads }, events: this.events.slice(-12), table_chips: this.tableChips || 0, payout: this.payout(),
        chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  const api = { RevolverRoom, HP_OPTIONS, TURN_TIMES, STAKES, STAKE_MAX, CHAMBERS, CHAR_N, MIN_PLAYERS, MAX_PLAYERS, CHIP_SHARE, CHIP_COIN, CHIP_COIN_MAX };
  root.Revolver = api;
  Engine.RevolverRoom = RevolverRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
