/* Блэкджек «Очко»: 2–6 игроков друг против друга, на интерес или на монеты. Движок работает в телефоне хоста.
   Честная раздача: перед каждой раздачей хост «запечатывает» колоду — публикует отпечаток SHA-256 своего секрета.
   Каждый игрок добавляет свою случайность. Колода = перемешивание (Фишер — Йетс) по секрету хоста + случайностям игроков + номеру раздачи.
   После раздачи секрет открывается, и каждый телефон сам проверяет, что отпечаток совпал и карты пришли ровно из этой колоды. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  /* ---------------------------------------------------------------- SHA-256 (синхронно, без зависимостей) */
  const K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d,
    0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function sha256(str) {
    const bytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(str) : Buffer.from(str, "utf8");
    const len = bytes.length, total = ((len + 9 + 63) >> 6) << 6, m = new Uint8Array(total);
    m.set(bytes); m[len] = 0x80;
    const bits = len * 8; for (let i = 0; i < 4; i++) m[total - 1 - i] = (bits >>> (i * 8)) & 0xff;
    const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), w = new Uint32Array(64);
    const rot = (x, n) => (x >>> n) | (x << (32 - n));
    for (let o = 0; o < total; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
      for (let i = 16; i < 64; i++) { const s0 = rot(w[i - 15], 7) ^ rot(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rot(w[i - 2], 17) ^ rot(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rot(e, 6) ^ rot(e, 11) ^ rot(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
    }
    return Array.from(H, (x) => x.toString(16).padStart(8, "0")).join("");
  }
  function randomHex(n = 32) {
    const c = root.crypto || (typeof require !== "undefined" ? require("crypto").webcrypto : null);
    return Array.from(c.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  /* ---------------------------------------------------------------- колода и честное перемешивание */
  const SUITS = ["S", "H", "D", "C"], RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const freshDeck = () => SUITS.flatMap((s) => RANKS.map((r) => r + s));
  // поток случайных чисел из SHA-256 (счётчик), равномерно без перекоса — отбраковкой
  function shuffleDeck(serverSeed, seeds, handNo) {
    const base = `${serverSeed}|${Object.keys(seeds).sort().map((k) => k + "=" + seeds[k]).join(",")}|${handNo}`;
    let block = "", pos = 64, ctr = 0;
    const u32 = () => { if (pos + 8 > 64) { block = sha256(base + "#" + ctr++); pos = 0; } const v = parseInt(block.slice(pos, pos + 8), 16); pos += 8; return v; };
    const below = (n) => { const lim = Math.floor(0x100000000 / n) * n; let v; do v = u32(); while (v >= lim); return v % n; };
    const deck = freshDeck();
    for (let i = deck.length - 1; i > 0; i--) { const j = below(i + 1); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  }
  const rankOf = (c) => c.slice(0, -1);
  function total(cards) {
    let t = 0, aces = 0;
    cards.forEach((c) => { const r = rankOf(c); if (r === "A") { aces++; t += 11; } else t += ["J", "Q", "K"].includes(r) ? 10 : Number(r); });
    while (t > 21 && aces) { t -= 10; aces--; }
    return t;
  }
  const isBlackjack = (cards) => cards.length === 2 && total(cards) === 21;

  // проверка на телефоне игрока: отпечаток совпал и каждая карта лежала в колоде на своём месте
  function verify(reveal) {
    if (!reveal || !reveal.serverSeed) return { ok: false, why: "Секрет ещё не открыт" };
    if (sha256(reveal.serverSeed) !== reveal.commit) return { ok: false, why: "Отпечаток колоды не совпал" };
    const deck = shuffleDeck(reveal.serverSeed, reveal.seeds, reveal.handNo);
    for (const [pid, cards] of Object.entries(reveal.dealt)) for (const [card, i] of cards) if (deck[i] !== card) return { ok: false, why: `Карта ${card} не на своём месте`, pid };
    return { ok: true };
  }

  const MIN_PLAYERS = 2, MAX_PLAYERS = 6, STAKES = [0, 10, 25, 50, 100, 250], CHAT_LIMIT = 80;
  const BET_SECONDS = 20, TURN_SECONDS = 25, SHOW_SECONDS = 12;
  const coinsOf = (m) => Number((m.look || {}).c || 0);

  class BlackjackRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "blackjack";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "blackjack", stake: 0 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.handNo = 0; this.net = {}; this.hands = {}; this.players = []; this.turn = null; this.pot = 0;
      this.serverSeed = null; this.commit = null; this.seeds = {}; this.joined = {}; this.deck = []; this.dealtPos = 0;
      this.results = null; this.reveal = null; this.log = [];
    }

    dump() { const out = {}; Object.keys(this).forEach((k) => { if (k !== "clock") out[k] = this[k]; }); return JSON.parse(JSON.stringify(out)); }
    touch() { this.version += 1; }
    name(pid) { return this.members[pid] ? this.members[pid].name : "?"; }
    note(text) { this.log.push(text); this.log = this.log.slice(-20); }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }
    online() { return this.order.filter((p) => this.members[p].online); }
    stakeOf(pid) { return this.settings.stake * (this.hands[pid] && this.hands[pid].doubled ? 2 : 1); }

    updateSettings(s) { if (STAKES.includes(Number(s.stake)) && !(Number(s.stake) && this.order.some((p) => /^bot_/.test(p)))) this.settings.stake = Number(s.stake); this.touch(); }   // с ботами — без ставок

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`За столом только ${MAX_PLAYERS} мест`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();       // можно подсесть между раздачами
    }

    leave(pid) {
      if (!this.members[pid]) return;
      if (this.phase === "play" && this.hands[pid] && !this.hands[pid].done) { this.hands[pid].done = true; this.hands[pid].folded = true; this.note(`${this.name(pid)} встаёт из-за стола — сброс`); if (this.turn === pid) this.nextTurn(); }
      if (["play", "show"].includes(this.phase) && this.hands[pid]) this.members[pid].online = false;     // карты остаются на столе до конца раздачи
      else { delete this.members[pid]; this.order = this.order.filter((x) => x !== pid); }
      if (this.phase === "bet" && this.betDone()) this.deal();
      this.touch();
    }

    kick(by, pid) { if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Нельзя"); this.leave(pid); }
    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole() {}

    start(by) {
      if (by !== this.host) throw new GameError("Начать может только хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Игра уже идёт");
      if (this.online().length < MIN_PLAYERS) throw new GameError(`Нужно минимум ${MIN_PLAYERS} игрока`);
      this.resetGame();
      this.gameNo = (this.gameNo || 0) + 1;
      this.chat = { all: [] };
      this.newHand();
    }

    // новая раздача: свежая колода, запечатанная отпечатком
    newHand() {
      this.handNo += 1;
      this.serverSeed = randomHex(32); this.commit = sha256(this.serverSeed);
      this.seeds = {}; this.joined = {}; this.hands = {}; this.players = []; this.turn = null; this.pot = 0; this.results = null; this.reveal = null;
      this.phase = "bet"; this.setTimer(BET_SECONDS);
      this.touch();
    }

    bet(pid, d) {
      if (this.phase !== "bet") throw new GameError("Ставки уже сделаны");
      if (!this.members[pid]) return;
      const seed = String(d.seed || "").replace(/[^0-9a-f]/gi, "").slice(0, 64);
      if (d.play) {
        if (this.settings.stake && coinsOf(this.members[pid]) < this.settings.stake) throw new GameError(`Не хватает монет: ставка ${this.settings.stake}`);
        if (seed.length < 16) throw new GameError("Нет случайности для колоды");
        this.seeds[pid] = seed; this.joined[pid] = true;
      } else { this.joined[pid] = false; delete this.seeds[pid]; }
      this.touch();
      if (this.betDone()) this.deal();
    }
    betDone() { return this.online().every((p) => p in this.joined); }

    deal() {
      const players = this.order.filter((p) => this.joined[p] && this.members[p] && this.members[p].online);
      if (players.length < MIN_PLAYERS) {                         // играть некому — ждём следующую раздачу
        this.note(`Раздача №${this.handNo}: мало игроков`);
        this.phase = "wait"; this.deadline = null; this.total = null; this.touch(); return;
      }
      Object.keys(this.seeds).forEach((p) => { if (!players.includes(p)) delete this.seeds[p]; });
      this.players = players;
      this.deck = shuffleDeck(this.serverSeed, this.seeds, this.handNo); this.dealtPos = 0;
      players.forEach((p) => { this.hands[p] = { cards: [], idx: [], done: false, bust: false, doubled: false, folded: false }; });
      for (let r = 0; r < 2; r++) players.forEach((p) => this.draw(p));
      this.pot = this.settings.stake * players.length;
      players.forEach((p) => { if (isBlackjack(this.hands[p].cards)) { this.hands[p].done = true; this.note(`${this.name(p)}: блэкджек!`); } });
      this.turn = null; this.phase = "play";
      this.nextTurn();
    }

    draw(pid) {
      const h = this.hands[pid];
      h.cards.push(this.deck[this.dealtPos]); h.idx.push(this.dealtPos); this.dealtPos += 1;
      if (total(h.cards) > 21) { h.bust = true; h.done = true; }
      else if (total(h.cards) === 21) h.done = true;
    }

    nextTurn() {
      const start = this.turn ? this.players.indexOf(this.turn) + 1 : 0;
      const next = this.players.slice(start).find((p) => !this.hands[p].done);
      if (!next) return this.showdown();
      this.turn = next; this.setTimer(TURN_SECONDS); this.touch();
    }

    act(pid, d) {
      if (d.slot === "bet") return this.bet(pid, d);
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      const h = this.hands[pid];
      if (d.slot === "hit") { this.draw(pid); this.note(`${this.name(pid)} берёт ещё${h.bust ? " — перебор!" : ""}`); }
      else if (d.slot === "stand") { h.done = true; this.note(`${this.name(pid)}: хватит`); }
      else if (d.slot === "double") {
        if (h.cards.length !== 2) throw new GameError("Удвоить можно только первым ходом");
        if (this.settings.stake && coinsOf(this.members[pid]) < this.settings.stake * 2) throw new GameError("Не хватает монет, чтобы удвоить");
        h.doubled = true; this.pot += this.settings.stake; this.draw(pid); h.done = true;
        this.note(`${this.name(pid)} удваивает ставку и берёт одну карту${h.bust ? " — перебор!" : ""}`);
      } else throw new GameError("Нет такого действия");
      if (h.done) this.nextTurn(); else { this.setTimer(TURN_SECONDS); this.touch(); }
    }

    // вскрытие: лучший счёт до 21 забирает банк; блэкджек сильнее обычных 21; ничья — банк делится
    showdown() {
      const score = (p) => { const h = this.hands[p]; if (h.bust || h.folded) return -1; return isBlackjack(h.cards) ? 22 : total(h.cards); };
      const best = Math.max(...this.players.map(score));
      const winners = best < 0 ? [] : this.players.filter((p) => score(p) === best);
      const payout = {};
      this.players.forEach((p) => { payout[p] = 0; });
      if (!winners.length) this.players.forEach((p) => { payout[p] = this.stakeOf(p); });     // все перебрали — ставки возвращаются
      else {
        const share = Math.floor(this.pot / winners.length);
        winners.forEach((p, i) => { payout[p] = share + (i === 0 ? this.pot - share * winners.length : 0); });
      }
      this.players.forEach((p) => { this.net[p] = (this.net[p] || 0) + payout[p] - this.stakeOf(p); });
      this.results = { winners, payout, best };
      this.reveal = { serverSeed: this.serverSeed, commit: this.commit, seeds: { ...this.seeds }, handNo: this.handNo,
        dealt: Object.fromEntries(this.players.map((p) => [p, this.hands[p].cards.map((c, i) => [c, this.hands[p].idx[i]])])) };
      this.note(winners.length ? `Раздача №${this.handNo}: ${winners.map((p) => this.name(p)).join(", ")} ${winners.length > 1 ? "делят" : "забирает"} банк` : `Раздача №${this.handNo}: все перебрали, ставки вернулись`);
      this.phase = "show"; this.turn = null; this.setTimer(SHOW_SECONDS); this.touch();
    }

    finish(by) {
      if (by !== this.host) throw new GameError("Закончить может только хост");
      if (this.phase === "play") throw new GameError("Дождись конца раздачи");
      this.phase = "end"; this.deadline = null; this.total = null; this.touch();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
      this.order.filter((p) => !this.members[p].online).forEach((p) => { delete this.members[p]; this.order = this.order.filter((x) => x !== p); });
      this.phase = "lobby"; this.resetGame(); this.deadline = null; this.touch();
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
      if (this.phase === "wait" || this.phase === "show") this.newHand();
      else if (this.phase === "bet") { this.online().forEach((p) => { if (!(p in this.joined)) this.joined[p] = false; }); this.deal(); }
      else if (this.phase === "play" && this.turn) { this.hands[this.turn].done = true; this.nextTurn(); }
    }

    tick() {
      if (!this.deadline || this.clock() < this.deadline) return false;
      if (this.phase === "bet") { this.online().forEach((p) => { if (!(p in this.joined)) this.joined[p] = false; }); this.deal(); }
      else if (this.phase === "play") { const h = this.hands[this.turn]; h.done = true; this.note(`${this.name(this.turn)} думал(а) слишком долго — хватит`); this.nextTurn(); }
      else if (this.phase === "show") { if (this.online().length >= MIN_PLAYERS) this.newHand(); else { this.phase = "wait"; this.deadline = null; this.touch(); } }
      return true;
    }

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
      const open = this.phase === "show";
      const players = this.order.map((id) => {
        const m = this.members[id], h = this.hands[id];
        let cards = null;
        if (h) cards = h.cards.map((c, i) => (open || id === pid || i > 0 ? c : "??"));   // первая карта закрыта для чужих до вскрытия
        return { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host,
          joined: this.joined[id], playing: this.players.includes(id), cards,
          score: h && (open || id === pid) ? total(h.cards) : null, blackjack: !!(h && open && isBlackjack(h.cards)),
          bust: !!(h && h.bust), done: !!(h && h.done), doubled: !!(h && h.doubled), folded: !!(h && h.folded), net: this.net[id] || 0, alive: true };
      });
      return {
        game: "blackjack", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "blackjack", title: "Блэкджек", emoji: "🃏", accent: "#d8b040", accent2: "#0a3a1e" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, seats: this.players, turn: this.turn, pot: this.pot, handNo: this.handNo, commit: this.commit, cardsLeft: this.deck.length ? 52 - this.dealtPos : 52,
        my_joined: this.joined[pid], results: this.results, reveal: this.reveal, log: this.log.slice(-8),
        chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  const api = { BlackjackRoom, sha256, randomHex, shuffleDeck, freshDeck, total, isBlackjack, verify, STAKES, MIN_PLAYERS, MAX_PLAYERS };
  root.Blackjack = api;
  Engine.BlackjackRoom = BlackjackRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
