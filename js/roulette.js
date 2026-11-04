/* «Последний заряд» — мрачная рулетка на 2–4 игроков. Движок комнаты (работает в телефоне хоста).
   Своя фишка: перед каждой зарядкой КАЖДЫЙ игрок тайно кладёт в барабан один патрон — боевой или холостой,
   подвал докладывает ещё несколько случайных. Дальше по очереди: целишься в себя или в соперника и жмёшь на спуск.
   Холостой в себя — ходишь ещё раз. Предметы помогают узнать заряды, защититься или помешать другим. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  const MIN_PLAYERS = 2, MAX_PLAYERS = 4, MAX_ITEMS = 4, CHAT_LIMIT = 80;   // больше 4 предметов не держит никто: у кого 4 — новых не дают
  const LOAD_SECONDS = 20, SHOT_PAUSE = 2.4, DICE_PAUSE = 6.2, CHAR_N = 10;
  const HP_OPTIONS = [2, 3, 4, 5], TURN_TIMES = [20, 30, 45, 60], ITEM_OPTIONS = [0, 1, 2, 3], STAKES = [0, 10, 25, 50, 100, 250, 500, 1000], STAKE_MAX = 10000;
  // своя ставка: любое целое от 0 до STAKE_MAX (кнопки — только подсказки)
  const okStake = (v) => Number.isInteger(v) && v >= 0 && v <= STAKE_MAX;
  const ITEMS = {
    flashlight: { name: "Фонарик", emoji: "🔦", desc: "Подсветить один случайный патрон в магазине — узнаешь, боевой ли он" },
    spin: { name: "Встряска", emoji: "🔄", desc: "Встряхнуть дробовик: оставшиеся патроны перемешаются" },
    mirror: { name: "Зеркальце", emoji: "🪞", desc: "Следующий боевой выстрел в тебя от соперника уйдёт обратно в стрелка. Если зеркальце есть и у стрелка — пуля мечется по столу, и кубики (1–50) решают, в кого она попадёт" },
    vest: { name: "Жилет", emoji: "🦺", desc: "Поглотит одно попадание" },
    freeze: { name: "Бутылка", emoji: "🍾", desc: "Швырнуть бутылку сопернику в голову: над ним закружатся звёздочки, и он пропустит свой следующий ход", target: true },
    medkit: { name: "Аптечка", emoji: "💉", desc: "Вернуть одно сердце" },
    ear: { name: "Подслушка", emoji: "👂", desc: "Подслушать соперника: узнаешь всё, что он знает про патроны (что ему показали фонарик и шкатулка)", target: true },
    box: { name: "Шкатулка", emoji: "📦", desc: "Внутри записка: какой патрон следующий. Видишь только ты" },
    saw: { name: "Ножовка", emoji: "🪚", desc: "Отпилить стволы: следующий выстрел снимет 2 сердца. Сгорает даже на холостом" },
    thief: { name: "Перчатка вора", emoji: "🧤", desc: "Стащить у соперника любой его предмет себе", target: true, steal: true },
    stake: { name: "Ставка", emoji: "🪙", desc: "Поставить на себя: если выживешь до конца, получишь +15 монет за каждую ставку" },
  };
  const KEYS = Object.keys(ITEMS);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  class RouletteRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "roulette";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "roulette", hp: 3, turnTime: 30, items: 2, stake: 0 };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.seats = []; this.hp = {}; this.items = {}; this.status = {}; this.notes = {}; this.stakes = {};
      this.sawed = false; this.chars = {}; this.wounds = {}; this.deaths = {};
      this.drum = []; this.loadTotal = 0; this.house = 0; this.contrib = {}; this.loads = 0;
      this.peek = {}; this.heard = {};                             // что каждый знает сейчас: патроны по местам, кто что зарядил
      this.liveTotal = 0; this.blankTotal = 0; this.fired = { live: 0, blank: 0 };   // состав магазина — его видят все
      this.turn = null; this.events = []; this.eventN = 0; this.winner = null; this.pending = null;
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
      if (ITEM_OPTIONS.includes(Number(s.items))) this.settings.items = Number(s.items);
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
      else if (this.phase === "end") this.members[pid].online = false;   // сидевший за столом остаётся в итогах
      else {
        this.members[pid].online = false;
        if (this.hp[pid] > 0) { this.hp[pid] = 0; (this.deaths = this.deaths || {})[pid] = "left"; this.event({ kind: "left", who: pid, text: `${this.name(pid)} встаёт из-за стола и уходит` }); this.afterDamage(); }
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
    know(pid, i, t) { ((this.peek = this.peek || {})[pid] = this.peek[pid] || {})[i] = t; }
    note(pid, text) { (this.notes[pid] = this.notes[pid] || []).push(text); this.notes[pid] = this.notes[pid].slice(-8); }
    event(e) { this.eventN += 1; e.n = this.eventN; this.events.push(e); this.events = this.events.slice(-30); return e; }

    start(by) {
      if (by !== this.host) throw new GameError("Начать может только хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Игра уже идёт");
      const online = this.order.filter((p) => this.members[p].online);
      if (online.length < MIN_PLAYERS) throw new GameError(`Нужно минимум ${MIN_PLAYERS} игрока`);
      const poor = online.slice(0, MAX_PLAYERS).filter((p) => this.settings.stake && Number((this.members[p].look || {}).c || 0) < this.settings.stake);
      if (poor.length) throw new GameError(`Не хватает монет на ставку ${this.settings.stake}: ${poor.map((p) => this.name(p)).join(", ")}`);
      this.resetGame();
      this.gameNo = (this.gameNo || 0) + 1;                       // номер партии — чтобы телефоны поняли, что стол новый
      this.seats = online.slice(0, MAX_PLAYERS);
      this.seats.forEach((p) => { this.hp[p] = this.settings.hp; this.items[p] = []; this.status[p] = {}; this.notes[p] = []; this.wounds[p] = 0; });
      const looks = shuffle(Array.from({ length: CHAR_N }, (_, i) => i));          // каждому — свой случайный персонаж
      this.seats.forEach((p, i) => { this.chars[p] = looks[i % CHAR_N]; });
      this.chat = { all: [] };
      this.turn = pick(this.seats);
      this.event({ kind: "start", text: "Дверь подвала закрылась. Лампа качается над столом." });
      this.startLoad();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
      this.phase = "lobby";
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.resetGame(); this.deadline = null; this.touch();
    }

    /* ---------- зарядка: каждый тайно кладёт заряд */
    startLoad() {
      this.phase = "load"; this.contrib = {}; this.loads += 1; this.peek = {}; this.heard = {};
      this.setTimer(LOAD_SECONDS);
      this.touch();
    }

    load(pid, value) {
      if (!(this.hp[pid] > 0)) throw new GameError("Ты уже не за столом");
      if (!["live", "blank"].includes(value)) throw new GameError("Боевой или холостой?");
      if (this.phase !== "load") throw new GameError("Сейчас не зарядка");
      this.contrib[pid] = value; this.touch();
      if (this.alive().every((p) => this.contrib[p])) this.finishLoad();
    }

    finishLoad() {
      this.alive().forEach((p) => { if (!this.contrib[p]) this.contrib[p] = Math.random() < .5 ? "live" : "blank"; });
      const house = 1 + Math.floor(Math.random() * 3) + (this.loads > 2 ? 1 : 0);      // со временем подвал злее
      let fromHouse = Array.from({ length: house }, () => (Math.random() < .5 ? "live" : "blank")), rerolled = false;
      // все патроны холостые — подвал перезаряжает свои, пока не попадётся боевой
      for (let i = 0; i < 20 && !Object.values(this.contrib).concat(fromHouse).includes("live"); i++) { rerolled = true; fromHouse = Array.from({ length: house }, () => (Math.random() < .5 ? "live" : "blank")); }
      if (!Object.values(this.contrib).concat(fromHouse).includes("live")) fromHouse[0] = "live";
      const drum = Object.values(this.contrib).concat(fromHouse);
      this.drum = shuffle(drum); this.loadTotal = this.drum.length; this.house = house;
      this.liveTotal = drum.filter((x) => x === "live").length; this.blankTotal = drum.length - this.liveTotal; this.fired = { live: 0, blank: 0 };
      const n = this.settings.items;
      this.alive().forEach((p) => { for (let i = 0; i < n && this.items[p].length < MAX_ITEMS; i++) this.items[p].push(pick(KEYS)); });
      this.event({ kind: "load", total: this.loadTotal, house, live: this.liveTotal, blank: this.blankTotal, rerolled,
        text: `${rerolled ? "Все положили холостые — подвал перезарядил свои. " : ""}Дробовик заряжен: ${this.loadTotal} патронов — 🔴 ${this.liveTotal} боевых и ⚪ ${this.blankTotal} холостых (${this.alive().length} от вас, ${house} от подвала). Порядок — случайный${n ? `. Каждому выдано предметов: ${n}` : ""}` });
      if (!(this.hp[this.turn] > 0)) this.turn = this.nextAfter(this.turn);
      this.startTurn();
    }

    /* ---------- ходы */
    nextAfter(pid) {
      const i = this.seats.indexOf(pid);
      for (let k = 1; k <= this.seats.length; k++) { const p = this.seats[(i + k) % this.seats.length]; if (this.hp[p] > 0) return p; }
      return pid;
    }

    startTurn() {
      this.phase = "play";
      let guard = 0;
      while (this.status[this.turn] && this.status[this.turn].frozen && guard++ < 8) {
        this.status[this.turn].frozen = false;
        this.event({ kind: "skip", who: this.turn, text: `${this.name(this.turn)} ещё видит звёздочки после бутылки и пропускает ход 💫` });
        this.turn = this.nextAfter(this.turn);
      }
      this.aim = null;
      this.setTimer(this.settings.turnTime);
      this.touch();
    }

    // игрок наводит ствол — все видят, в кого
    setAim(pid, target) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (!(this.hp[target] > 0)) throw new GameError("Он(а) уже не за столом");
      this.aim = target; this.touch();
    }

    useItem(pid, idx, target, pickIdx, expect) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      const key = this.items[pid][idx];
      if (!key) throw new GameError("Нет такого предмета");
      if (expect != null && key !== expect) throw new GameError("Предметы уже поменялись — выбери ещё раз");
      const st = this.status[pid], nm = this.name(pid), it = ITEMS[key];
      if (it.target && !(this.hp[target] > 0 && target !== pid)) throw new GameError("Выбери соперника за столом");
      if (key === "flashlight") {
        const i = Math.floor(Math.random() * this.drum.length);
        this.know(pid, i, this.drum[i]);
        this.note(pid, `🔦 Патрон №${i + 1} по очереди — ${this.drum[i] === "live" ? "БОЕВОЙ" : "холостой"}${i === 0 ? " (это следующий выстрел)" : ` (будет ${i + 1}-м выстрелом)`}`);
        this.event({ kind: "item", item: key, who: pid, text: `${nm} светит фонариком в магазин` });
      } else if (key === "spin") {
        shuffle(this.drum); this.peek = {};                       // все прежние подсказки больше не верны
        this.event({ kind: "item", item: key, who: pid, text: `${nm} встряхивает дробовик. Всё, что вы знали, — уже неправда` });
      } else if (key === "mirror") {
        if (st.mirror) throw new GameError("Зеркальце уже стоит");
        st.mirror = true; this.event({ kind: "item", item: key, who: pid, text: `${nm} ставит перед собой зеркальце` });
      } else if (key === "vest") {
        if (st.vest) throw new GameError("Жилет уже надет");
        st.vest = true; this.event({ kind: "item", item: key, who: pid, text: `${nm} надевает жилет` });
      } else if (key === "freeze") {
        this.status[target].frozen = true;
        this.event({ kind: "item", item: key, who: pid, target, text: `${nm} швыряет бутылку в ${this.name(target)} — БАЦ! Звёздочки над головой, пропустит ход 🍾💫` });
      } else if (key === "medkit") {
        if (this.hp[pid] >= this.settings.hp) throw new GameError("Сердца и так полные");
        this.hp[pid] += 1; this.event({ kind: "item", item: key, who: pid, text: `${nm} колет аптечку и возвращает сердце` });
      } else if (key === "box") {
        const next = this.drum[0]; this.know(pid, 0, next);
        this.note(pid, `📦 Записка в шкатулке: «Следующий — ${next === "live" ? "БОЕВОЙ" : "холостой"}»`);
        this.event({ kind: "item", item: key, who: pid, text: `${nm} открывает шкатулку и молча читает записку` });
      } else if (key === "thief") {
        const theirs = this.items[target];
        if (!theirs.length) throw new GameError("У него(неё) ничего нет");
        const k = Number.isInteger(pickIdx) && theirs[pickIdx] ? pickIdx : Math.floor(Math.random() * theirs.length);
        const stolen = theirs.splice(k, 1)[0];
        this.items[pid].splice(idx, 1, stolen);                    // перчатка уходит, на её место — добыча
        this.event({ kind: "item", item: key, who: pid, target, stolen, text: `${nm} тянется через стол и забирает у ${this.name(target)}: ${ITEMS[stolen].emoji} ${ITEMS[stolen].name}` });
        this.touch();
        return;
      } else if (key === "saw") {
        if (this.sawed) throw new GameError("Стволы уже отпилены");
        this.sawed = true;
        this.event({ kind: "item", item: key, who: pid, text: `${nm} отпиливает стволы. Следующий выстрел снимет два сердца` });
      } else if (key === "stake") {
        this.stakes[pid] = (this.stakes[pid] || 0) + 1;
        this.event({ kind: "item", item: key, who: pid, text: `${nm} кладёт монету на стол: ставка на себя (×${this.stakes[pid]})` });
      } else if (key === "ear") {                                  // подслушка: что знает он — теперь знаешь и ты
        const theirs = Object.entries((this.peek || {})[target] || {}).sort((x, y) => x[0] - y[0]);
        theirs.forEach(([i, t]) => this.know(pid, +i, t));
        this.note(pid, `👂 Подслушал(а) ${this.name(target)}: ${theirs.length ? theirs.map(([i, t]) => `${+i === 0 ? "следующий выстрел" : `${+i + 1}-й выстрел`} — ${t === "live" ? "БОЕВОЙ" : "холостой"}`).join(", ") : "ничего не знает про патроны"}`);
        this.event({ kind: "item", item: key, who: pid, target, text: `${nm} подслушивает ${this.name(target)}` });
      }
      this.items[pid].splice(idx, 1);
      this.touch();
    }

    shoot(pid, target) {
      if (this.phase !== "play" || pid !== this.turn) throw new GameError("Сейчас не твой ход");
      if (!(this.hp[target] > 0)) throw new GameError("Он(а) уже не за столом");
      const shell = this.drum.shift();
      if (this.fired) this.fired[shell === "live" ? "live" : "blank"]++;
      Object.keys(this.peek || {}).forEach((p) => {                // подсказки сдвигаются: №2 стал следующим
        const k = {}; Object.entries(this.peek[p]).forEach(([i, t]) => { if (+i > 0) k[+i - 1] = t; }); this.peek[p] = k;
      });
      const live = shell === "live";
      let hit = target, redirected = false, absorbed = false, dice = null;
      const dmg = this.sawed ? 2 : 1;
      this.sawed = false;                                         // обрез — на один выстрел, даже если холостой
      if (live) {
        const tm = hit !== pid && this.status[hit].mirror, sm = hit !== pid && this.status[pid].mirror;
        if (tm && sm) {                                           // два зеркала: пуля отскакивает в стрелка, от его зеркала — в случайного
          this.status[hit].mirror = false; this.status[pid].mirror = false; redirected = true;
          const pool = this.alive().filter((p) => p !== pid);
          for (let k = 0; k < 12; k++) {                          // кубики 1–50 у каждого; ничья — бросаем заново
            dice = {}; pool.forEach((p) => { dice[p] = 1 + Math.floor(Math.random() * 50); });
            const best = Math.max(...Object.values(dice)), top = pool.filter((p) => dice[p] === best);
            if (top.length === 1 || k === 11) { hit = top[Math.floor(Math.random() * top.length)]; dice[hit] = best; if (top.length > 1) top.forEach((p) => { if (p !== hit) dice[p] = Math.max(1, best - 1); }); break; }
          }
        } else if (tm) { this.status[hit].mirror = false; redirected = true; hit = pid; }
        if (this.status[hit].vest) { this.status[hit].vest = false; absorbed = true; }
        else { this.hp[hit] = Math.max(0, this.hp[hit] - dmg); this.wounds[hit] = (this.wounds[hit] || 0) + dmg; }
      }
      const self = target === pid, out = live && !absorbed && this.hp[hit] === 0;
      // как умирает от дроби: лицом в стол, голову сносит, отбрасывает назад, разворачивает и роняет, отрывает руку
      if (out) this.deaths[hit] = pick(["table", "head", "flyback", "spin", "limb"]);
      const wait = +((self ? .9 + Math.random() * 1.9 : .5 + Math.random() * 1.4)).toFixed(2);   // палец на спуске: заминка, одна на всех
      const who = this.name(pid), tn = this.name(target);
      const text = !live ? (self ? `${who} стреляет в себя… щёлк. Холостой — ещё один ход` : `${who} стреляет в ${tn}… щёлк. Холостой`)
        : dice ? `${who} стреляет в ${tn} — два зеркала! Пуля мечется по столу, кубики решили: ${this.name(hit)}${absorbed ? ", но жилет спасает" : out ? " — и он(а) падает" : ""}`
        : redirected ? `${who} стреляет в ${tn} — зеркальце! Пуля уходит в самого стрелка${absorbed ? ", но жилет спасает" : ""}`
        : absorbed ? `${who} стреляет в ${self ? "себя" : tn} — БАХ! Жилет принял удар`
        : `${who} стреляет в ${self ? "себя" : tn}${dmg > 1 ? " из обреза" : ""} — БАХ! ${this.hp[hit] > 0 ? (dmg > 1 ? "Минус два сердца" : "Минус сердце") : `${this.name(hit)} падает со стула`}`;
      this.event({ kind: "shot", who: pid, target, hit, live, redirected, absorbed, self, dmg, out, death: out ? this.deaths[hit] : null, dice, wait, text });
      this.afterShot(pid, !live && self, (dice ? DICE_PAUSE : SHOT_PAUSE) + wait);
    }

    afterShot(pid, again, pause = SHOT_PAUSE) {
      if (this.checkWin()) return;
      // пауза, пока у всех доиграет анимация выстрела, потом следующий ход
      this.pending = { next: again && this.hp[pid] > 0 ? pid : this.nextAfter(pid) };
      this.phase = "shot"; this.setTimer(pause); this.touch();
    }

    afterDamage() {
      if (this.checkWin()) return;
      if (this.phase === "play" && !(this.hp[this.turn] > 0)) { this.turn = this.nextAfter(this.turn); this.startTurn(); }
      if (this.phase === "shot" && this.pending && !(this.hp[this.pending.next] > 0)) this.pending.next = this.nextAfter(this.pending.next);
      if (this.phase === "load" && this.alive().every((p) => this.contrib[p])) this.finishLoad();
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
      if (this.phase === "load" && d.slot === "load") return this.load(pid, d.value);
      if (d.slot === "item") return this.useItem(pid, Number(d.index), d.target, d.pick == null ? null : Number(d.pick), typeof d.key === "string" ? d.key : null);
      if (d.slot === "shoot") return this.shoot(pid, d.target);
      if (d.slot === "aim") return this.setAim(pid, d.target);
      throw new GameError("Сейчас нельзя");
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
      if (this.phase !== "lobby" && this.phase !== "end") this.advance();
    }

    advance() {
      if (this.phase === "load") this.finishLoad();
      else if (this.phase === "shot") {
        let next = this.pending ? this.pending.next : this.nextAfter(this.turn);
        if (!(this.hp[next] > 0)) next = this.nextAfter(next);
        this.turn = next; this.pending = null;
        if (!this.drum.length) this.startLoad(); else this.startTurn();
      } else if (this.phase === "play") {                       // время вышло — палец сам жмёт на спуск
        if (!(this.hp[this.turn] > 0)) { this.turn = this.nextAfter(this.turn); return this.startTurn(); }
        this.event({ kind: "timeout", who: this.turn, text: `${this.name(this.turn)} слишком долго думал(а) — рука дрогнула` });
        this.shoot(this.turn, this.turn);
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
          seat: this.seats.indexOf(id), hp: this.hp[id] || 0, alive: this.phase === "lobby" || this.hp[id] > 0,
          items: (this.items[id] || []).slice(), status: Object.assign({}, this.status[id] || {}), loaded: !!this.contrib[id], stakes: (this.stakes || {})[id] || 0,
          char: (this.chars || {})[id] != null ? this.chars[id] : null, wounds: (this.wounds || {})[id] || 0, death: (this.deaths || {})[id] || null };
      });
      return {
        game: "roulette", mode: "shotgun", game_no: this.gameNo || 0, code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "roulette", title: "Последний заряд", emoji: "🎯", accent: "#c0141f", accent2: "#3a0a0a" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, seats: this.seats.slice(), sawed: !!this.sawed, stake: this.settings.stake || 0, pot: (this.settings.stake || 0) * this.seats.length, turn: this.turn, aim: this.phase === "play" ? this.aim || null : null, winner: this.winner, maxHp: this.settings.hp,
        drum: { left: this.drum.length, total: this.loadTotal, house: this.house, live: this.liveTotal || 0, blank: this.blankTotal || 0,
          liveLeft: Math.max(0, (this.liveTotal || 0) - ((this.fired || {}).live || 0)), blankLeft: Math.max(0, (this.blankTotal || 0) - ((this.fired || {}).blank || 0)) },
        my_load: this.contrib[pid] || null, notes: (this.notes[pid] || []).slice(), events: this.events.slice(-12),
        known: Object.entries((this.peek || {})[pid] || {}).map(([i, t]) => ({ at: +i + 1, live: t === "live" })).sort((a, b) => a.at - b.at),
        heard: Object.entries((this.heard || {})[pid] || {}).map(([id, t]) => ({ id, name: this.name(id), live: t === "live" })),
        chat: { all: this.chat.all.slice(-40) }, can_write: ["all"],
      };
    }
  }

  const api = { RouletteRoom, ITEMS, KEYS, HP_OPTIONS, TURN_TIMES, ITEM_OPTIONS, STAKES, STAKE_MAX, CHAR_N, MIN_PLAYERS, MAX_PLAYERS, MAX_ITEMS };
  root.Roulette = api;
  Engine.RouletteRoom = RouletteRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
