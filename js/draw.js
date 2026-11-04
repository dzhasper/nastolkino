/* Рисовалка: движок комнаты (работает в телефоне хоста) + общий пиксельный холст 160×160 для всех телефонов.
   Один рисует загаданное слово, остальные смотрят рисунок вживую, потом каждый пишет ответ одним словом,
   художник раздаёт баллы угадавшим, и всем показывается слово. */
(function (root) {
  "use strict";
  const Engine = root.Engine || (typeof require !== "undefined" ? require("./engine.js") : null);
  const { GameError } = Engine;

  /* ---------------------------------------------------------------- холст: операции рисования */
  const SIZE = 160;
  // 0 — бумага (ластик), дальше палитра в духе 8-битных приставок
  const PALETTE = ["#ffffff", "#000000", "#5f574f", "#c2c3c7", "#7e2553", "#ff004d", "#ff77a8", "#ffccaa",
    "#ab5236", "#ffa300", "#ffec27", "#00e436", "#008751", "#29adff", "#1d2b53", "#83769c", "#3a2a1a"];
  const BRUSHES = [1, 2, 4, 7];
  const MAX_OPS = 3000, MAX_PTS = 4000;
  const int = (v) => Math.max(0, Math.min(SIZE - 1, Math.round(Number(v) || 0)));

  // применить операцию к списку; false — операция некорректна
  function applyOp(list, op) {
    if (!op || typeof op !== "object") return false;
    if (op.k === "s") {                                         // начало линии
      if (list.length >= MAX_OPS || !Array.isArray(op.p)) return false;
      list.push({ k: "s", c: Math.max(0, Math.min(PALETTE.length - 1, op.c | 0)), w: BRUSHES.includes(op.w) ? op.w : 2, p: op.p.slice(0, MAX_PTS).map(int) });
      return true;
    }
    if (op.k === "a") {                                         // продолжение последней линии
      const last = list[list.length - 1];
      if (!last || last.k !== "s" || !Array.isArray(op.p) || last.p.length > MAX_PTS * 2) return false;
      op.p.slice(0, MAX_PTS).forEach((v) => last.p.push(int(v)));
      return true;
    }
    if (op.k === "f") { if (list.length >= MAX_OPS) return false; list.push({ k: "f", c: Math.max(0, Math.min(PALETTE.length - 1, op.c | 0)), x: int(op.x), y: int(op.y) }); return true; }
    if (op.k === "u") { list.pop(); return true; }
    if (op.k === "x") { list.length = 0; return true; }
    return false;
  }

  // нарисовать весь список в буфер RGBA SIZE×SIZE (одинаково на всех телефонах)
  const RGB = PALETTE.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  function paint(list, buf) {
    const px = new Uint8Array(SIZE * SIZE);                      // индексы цветов
    const dot = (x, y, c, w) => {
      const r0 = -Math.floor((w - 1) / 2), r1 = r0 + w;
      for (let dy = r0; dy < r1; dy++) for (let dx = r0; dx < r1; dx++) {
        if (w >= 4 && (dx === r0 || dx === r1 - 1) && (dy === r0 || dy === r1 - 1)) continue;   // круглая кисть
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < SIZE && yy < SIZE) px[yy * SIZE + xx] = c;
      }
    };
    const line = (x0, y0, x1, y1, c, w) => {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) { dot(x0, y0, c, w); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    };
    const fill = (x, y, c) => {
      const from = px[y * SIZE + x];
      if (from === c) return;
      const stack = [y * SIZE + x];
      while (stack.length) {
        const i = stack.pop();
        if (px[i] !== from) continue;
        px[i] = c;
        const xx = i % SIZE;
        if (xx > 0) stack.push(i - 1); if (xx < SIZE - 1) stack.push(i + 1);
        if (i >= SIZE) stack.push(i - SIZE); if (i < SIZE * (SIZE - 1)) stack.push(i + SIZE);
      }
    };
    list.forEach((op) => {
      if (op.k === "f") return fill(op.x, op.y, op.c);
      const p = op.p;
      if (p.length < 2) return;
      if (p.length < 4) return dot(p[0], p[1], op.c, op.w);
      for (let i = 2; i + 1 < p.length; i += 2) line(p[i - 2], p[i - 1], p[i], p[i + 1], op.c, op.w);
    });
    for (let i = 0; i < px.length; i++) { const c = RGB[px[i]]; buf[i * 4] = c[0]; buf[i * 4 + 1] = c[1]; buf[i * 4 + 2] = c[2]; buf[i * 4 + 3] = 255; }
    return buf;
  }

  /* ---------------------------------------------------------------- слова */
  const WORDS = {
    easy: ("кіт собака будинок сонце дерево машина риба птах квітка яблуко банан м’яч місяць зірка хмара дощ сніговик ялинка гриб " +
      "кулька парасолька окуляри годинник ключ телефон книжка стілець стіл ліжко лампа чашка ложка виделка ніж торт піца морозиво морква " +
      "кавун груша вишня лимон корова свиня кінь заєць миша змія равлик павук метелик бджола черепаха жирафа слон лев качка " +
      "серце корона ракета літак корабель потяг велосипед гітара барабан шапка шкарпетка черевик футболка сукня замок міст " +
      "гора море острів веселка блискавка вогонь сніжинка кактус пальма зуб око ніс рука нога усмішка подарунок свічка прапор якір " +
      "колесо човен паротяг акула медуза восьминіг краб пінгвін сова лисиця вовк ведмідь їжак кит гарбуз яйце хліб сир цукерка").split(" "),
    medium: ("вампір привид пірат робот дракон русалка єдиноріг чарівник принцеса лицар ковбой космонавт клоун ніндзя " +
      "супергерой зомбі мумія скелет інопланетянин динозавр вулкан водоспад пустеля печера маяк млин світлофор фонтан " +
      "карусель намет багаття рюкзак компас телескоп мікроскоп магніт батарейка лампочка вентилятор пилосос холодильник " +
      "телевізор комп’ютер навушники мікрофон фотоапарат камера скрипка піаніно труба акордеон шахи кубик пазл гойдалка " +
      "гірка батут басейн душ ванна дзеркало гребінець зубна_щітка мило рушник подушка ковдра будильник календар " +
      "лист конверт марка посилка кошик візок драбина ліфт ескалатор гелікоптер підводний_човен повітряна_куля парашут " +
      "трактор екскаватор пожежна_машина швидка поліція в’язниця банк ресторан лікарня школа зоопарк цирк кінотеатр стадіон").split(" ").map((w) => w.replace(/_/g, " ")),
    hard: ("алібі шпигун зрада змова пограбування свідок допит детектив відбиток кайданки сейф скарб карта_скарбів " +
      "корабельна_аварія землетрус затемнення північне_сяйво чорна_діра невагомість гравітація луна тінь відображення міраж " +
      "сон кошмар дежавю ностальгія лінь натхнення ревнощі удача сюрприз секрет таємниця мрія паніка нудьга " +
      "бермудський_трикутник ейфелева_вежа статуя_свободи піраміда колізей стоунхендж золоті_ворота " +
      "селфі мем вайфай пароль хмарне_сховище вірус антивірус лайк підписник стрим блогер дедлайн планірка відпустка " +
      "понеділок п’ятниця година_пік затор черга решта квитанція інфляція кредит іпотека").split(" ").map((w) => w.replace(/_/g, " ")),
  };
  const DIFFS = { easy: "Легкі", medium: "Середні", hard: "Складні", mix: "Упереміш" };
  const DRAW_TIMES = [40, 60, 80, 100, 120];
  const GUESS_TIMES = [15, 20, 30, 45, 60];
  const CHOOSE_SECONDS = 15, JUDGE_SECONDS = 40, REVEAL_SECONDS = 12;
  const MIN_PLAYERS = 2, MAX_PLAYERS = 20, CHAT_LIMIT = 80;
  const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-яіїєґ0-9]/g, "");
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------------------------------------------------------------- комната рисовалки */
  class DrawRoom {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) { Object.assign(this, restore); return; }
      this.kind = "draw";
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { game: "draw", drawTime: 80, guessTime: 30, rounds: 1, words: "mix" };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.deadline = null; this.total = null;
      this.chat = { all: [] };
      this.resetGame();
    }

    resetGame() {
      this.scores = {}; this.turn = -1; this.turns = []; this.drawer = null; this.word = null; this.options = [];
      this.ink = []; this.guesses = {}; this.marks = {}; this.used = []; this.history = [];
    }

    dump() {
      const out = {};
      Object.keys(this).forEach((k) => { if (k !== "clock") out[k] = this[k]; });
      return JSON.parse(JSON.stringify(out));
    }

    touch() { this.version += 1; }

    updateSettings(s) {
      if (DRAW_TIMES.includes(Number(s.drawTime))) this.settings.drawTime = Number(s.drawTime);
      if (GUESS_TIMES.includes(Number(s.guessTime))) this.settings.guessTime = Number(s.guessTime);
      if ([1, 2, 3].includes(Number(s.rounds))) this.settings.rounds = Number(s.rounds);
      if (DIFFS[s.words]) this.settings.words = s.words;
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
      else { this.members[pid].online = false; if (pid === this.drawer && ["choose", "draw"].includes(this.phase)) this.endDrawing(); }
      this.touch();
    }

    kick(by, pid) {
      if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Не можна");
      this.leave(pid);
    }

    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    seenRole() {}
    online() { return this.order.filter((p) => this.members[p].online); }
    guessers() { return this.order.filter((p) => p !== this.drawer && this.members[p].online); }
    setTimer(sec) { this.total = sec; this.deadline = this.clock() + sec; }

    start(by) {
      if (by !== this.host) throw new GameError("Почати може лише хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Гра вже триває");
      if (this.online().length < MIN_PLAYERS) throw new GameError(`Потрібно щонайменше ${MIN_PLAYERS} гравці`);
      this.resetGame();
      this.order.forEach((p) => { this.scores[p] = 0; });
      for (let r = 0; r < this.settings.rounds; r++) this.turns.push(...this.order);
      this.chat = { all: [] };
      this.nextTurn();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Не можна");
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.phase = "lobby"; this.deadline = null; this.touch();
    }

    pickOptions() {
      const pool = this.settings.words === "mix" ? [].concat(WORDS.easy, WORDS.medium, WORDS.hard) : WORDS[this.settings.words];
      const fresh = pool.filter((w) => !this.used.includes(w));
      return shuffle((fresh.length >= 3 ? fresh : pool).slice()).slice(0, 3);
    }

    nextTurn() {
      do { this.turn += 1; } while (this.turn < this.turns.length && !(this.members[this.turns[this.turn]] && this.members[this.turns[this.turn]].online));
      if (this.turn >= this.turns.length || this.online().length < MIN_PLAYERS) return this.finish();
      this.drawer = this.turns[this.turn];
      this.word = null; this.options = this.pickOptions(); this.ink = []; this.guesses = {}; this.marks = {};
      this.phase = "choose"; this.setTimer(CHOOSE_SECONDS);
      this.touch();
    }

    choose(i) {
      this.word = this.options[Math.max(0, Math.min(this.options.length - 1, Number(i) || 0))];
      this.used.push(this.word);
      this.phase = "draw"; this.setTimer(this.settings.drawTime);
      this.touch();
    }

    endDrawing() { this.phase = "guess"; this.setTimer(this.settings.guessTime); this.touch(); }

    startJudge() {
      // точные совпадения художнику отмечать не нужно — они уже засчитаны, но он может поправить
      this.marks = {};
      Object.entries(this.guesses).forEach(([pid, g]) => { if (norm(g) && norm(g) === norm(this.word)) this.marks[pid] = 2; });
      if (!Object.keys(this.guesses).length || !this.members[this.drawer].online) return this.award();
      this.phase = "judge"; this.setTimer(JUDGE_SECONDS); this.touch();
    }

    award() {
      const gained = {};
      let right = 0;
      Object.keys(this.guesses).forEach((pid) => {
        const pts = this.marks[pid] || 0;
        gained[pid] = pts;
        if (pts > 0) { right += 1; this.scores[pid] = (this.scores[pid] || 0) + pts; }
      });
      gained[this.drawer] = right;
      this.scores[this.drawer] = (this.scores[this.drawer] || 0) + right;
      this.history.push({ drawer: this.drawer, word: this.word, right, of: Object.keys(this.guesses).length });
      this.gained = gained;
      this.phase = "reveal"; this.setTimer(REVEAL_SECONDS); this.touch();
    }

    finish() { this.phase = "end"; this.deadline = null; this.total = null; this.drawer = null; this.touch(); }

    act(pid, d) {
      const slot = d.slot;
      if (this.phase === "choose" && slot === "pick") { if (pid !== this.drawer) throw new GameError("Слово обирає художник"); this.choose(d.target); }
      else if (this.phase === "draw" && slot === "done") { if (pid !== this.drawer) throw new GameError("Не можна"); this.endDrawing(); }
      else if (this.phase === "guess" && slot === "guess") {
        if (pid === this.drawer || !this.members[pid]) throw new GameError("Художник не вгадує");
        const text = String(d.text || "").trim().replace(/\s+/g, " ").slice(0, 30);
        if (!text) throw new GameError("Напиши відповідь");
        this.guesses[pid] = text; this.touch();
        if (this.guessers().every((p) => this.guesses[p])) this.startJudge();
      } else if (this.phase === "judge" && slot === "mark") {
        if (pid !== this.drawer) throw new GameError("Бали роздає художник");
        if (!(d.target in this.guesses)) throw new GameError("Немає такої відповіді");
        const v = Number(d.value);
        this.marks[d.target] = [0, 1, 2].includes(v) ? v : 0; this.touch();
      } else if (this.phase === "judge" && slot === "award") {
        if (pid !== this.drawer) throw new GameError("Бали роздає художник");
        this.award();
      } else throw new GameError("Зараз не можна");
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Лише хост");
      if (this.phase !== "lobby" && this.phase !== "end") this.advance();
    }

    advance() {
      if (this.phase === "choose") this.choose(0);
      else if (this.phase === "draw") this.endDrawing();
      else if (this.phase === "guess") this.startJudge();
      else if (this.phase === "judge") this.award();
      else if (this.phase === "reveal") this.nextTurn();
    }

    tick() { if (this.deadline && this.clock() >= this.deadline) { this.advance(); return true; } return false; }

    // рисование: только художник и только во время рисования
    inkOp(pid, op) { return this.phase === "draw" && pid === this.drawer && applyOp(this.ink, op); }

    channelsFor() { return { all: ["lobby", "reveal", "end", "choose"].includes(this.phase) }; }

    say(pid, channel, text) {
      text = String(text || "").trim().slice(0, 300);
      if (!text) return;
      if (channel !== "all" || !this.channelsFor(pid).all) throw new GameError("Поки триває раунд, чат закритий — не підказуй!");
      const m = this.members[pid];
      this.chat.all.push({ from: pid, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look || {}, text, ts: Math.round(this.clock() * 1000) });
      this.chat.all = this.chat.all.slice(-CHAT_LIMIT);
      this.touch();
    }

    view(pid) {
      const amDrawer = pid === this.drawer;
      const open = ["reveal", "end"].includes(this.phase);
      const showWord = amDrawer || open;
      const players = this.order.map((id) => {
        const m = this.members[id];
        return { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host,
          score: this.scores[id] || 0, drawer: id === this.drawer, answered: !!this.guesses[id], alive: true };
      });
      const answers = (amDrawer && this.phase === "judge") || this.phase === "reveal"
        ? Object.entries(this.guesses).map(([id, text]) => ({ id, text, mark: this.marks[id] || 0, gained: this.gained ? this.gained[id] : 0 })) : null;
      return {
        game: "draw", code: this.code, host: this.host, version: this.version, now: Math.round(this.clock() * 1000),
        theme: { key: "draw", title: "Малювалка", emoji: "🎨", accent: "#ff4f7b", accent2: "#29adff" },
        settings: this.settings, phase: this.phase, deadline: this.deadline ? Math.round(this.deadline * 1000) : null, total: this.total,
        players, drawer: this.drawer, turn: this.turn + 1, turns: this.turns.length,
        word: showWord ? this.word : null, hint: this.word && !showWord ? this.word.replace(/[^\s-]/g, "_") : null,
        options: amDrawer && this.phase === "choose" ? this.options : null,
        my_guess: this.guesses[pid] || null, answers, gained: this.phase === "reveal" ? this.gained : null,
        ink: this.phase === "draw" ? null : this.ink, history: this.history,
        chat: { all: this.chat.all.slice(-40) }, can_write: this.channelsFor(pid).all ? ["all"] : [],
      };
    }
  }

  const api = { DrawRoom, applyOp, paint, SIZE, PALETTE, BRUSHES, WORDS, DIFFS, DRAW_TIMES, GUESS_TIMES, MIN_PLAYERS, MAX_PLAYERS, norm };
  root.Draw = api;
  Engine.DrawRoom = DrawRoom;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
