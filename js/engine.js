/* Движок мафии и комнаты — работает в телефоне хоста. Перенос game/mafia.py и game/room.py на JavaScript.
   Все данные — простые объекты, поэтому состояние можно сохранить и восстановить (хост свернул Telegram и вернулся). */
(function (root) {
  "use strict";
  const DATA = root.GAME_DATA || (typeof require !== "undefined" ? require("./themes.js") : null);
  const { THEMES, MODES, MIN_PLAYERS, MAX_PLAYERS } = DATA;
  const KILL_KINDS = ["kill", "shot"];
  const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const REVEAL_SECONDS = 25;
  const VERDICT_SECONDS = 7;
  const CHAT_LIMIT = 80;

  class GameError extends Error {}

  const rnd = { choice: (a) => a[Math.floor(Math.random() * a.length)],
    shuffle: (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; } };
  const fmt = (s, kw) => s.replace(/\{(\w+)\}/g, (m, k) => (k in kw ? kw[k] : m));
  const mafiaCount = (n) => Math.max(1, Math.round(n / 3.5));
  const countBy = (arr) => { const c = new Map(); arr.forEach((x) => c.set(x, (c.get(x) || 0) + 1)); return c; };
  const newCode = () => Array.from({ length: 4 }, () => rnd.choice(CODE_ALPHABET)).join("");

  function rolePlan(theme, n, enabled) {
    const specials = theme.specials.filter(([k, need]) => n >= need && (!enabled || enabled.includes(k))).map(([k]) => k);
    let m = mafiaCount(n);
    const plan = [];
    if (specials.includes("don")) { plan.push("don"); m -= 1; }
    for (let i = 0; i < m; i++) plan.push("mafia");
    specials.forEach((k) => { if (k !== "don" && plan.length < n) plan.push(k); });
    while (plan.length < n) plan.push("civ");
    return plan;
  }

  /* ================================================================ игра */
  class Mafia {
    constructor(themeKey, players, settings, restore) {
      if (restore) { Object.assign(this, restore); this.theme = THEMES[this.theme_key]; this.ready = new Set(restore.ready); return; }
      if (!THEMES[themeKey]) throw new GameError("Нет такого сценария");
      if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) throw new GameError(`Нужно от ${MIN_PLAYERS} до ${MAX_PLAYERS} игроков`);
      this.theme_key = themeKey;
      this.theme = THEMES[themeKey];
      this.settings = Object.assign({ reveal: true, anonymous: false, roles: null }, settings || {});
      this.players = {};
      players.forEach(([id, name, avatar]) => {
        this.players[id] = { id, name, avatar, role: "civ", team: "town", alive: true, converted: false, uses: {}, last_used: {},
          last_heal: null, armor: false, bounty_target: null, bounty_won: false, silenced_day: 0, private: [] };
      });
      this.order = players.map((p) => p[0]);
      this.phase = "night"; this.day = 0; this.night = 0;
      this.log = []; this.night_actions = {}; this.ready = new Set(); this.votes = {};
      this.winner = null; this.winners = [];
      this.stats = {};                                       // для турниров: убийства мафии, спасения доктора, найденная мафия, верные голоса
      this.assignRoles();
    }

    dump() {
      const out = Object.assign({}, this);
      delete out.theme;
      out.ready = Array.from(this.ready);
      return JSON.parse(JSON.stringify(out));
    }

    assignRoles() {
      const plan = rnd.shuffle(rolePlan(this.theme, this.order.length, this.settings.roles));
      this.order.forEach((pid, i) => {
        const p = this.players[pid]; const r = this.theme.roles[plan[i]];
        p.role = plan[i]; p.team = r.team; p.armor = r.passive === "armor";
      });
      Object.values(this.players).forEach((p) => { if (this.role(p).passive === "bounty") this.newBountyTarget(p); });
      this.say("intro", this.pick("intro"));
    }

    newBountyTarget(p) {
      const options = this.alive().filter((q) => q.team === "town" && q.id !== p.id);
      p.bounty_target = options.length ? rnd.choice(options).id : null;
      if (p.bounty_target) p.private.push(`🎯 Твоя цель: ${this.players[p.bounty_target].name}. Добейся, чтобы город её повесил.`);
    }

    role(p) { return p.converted ? this.theme.roles.mafia : this.theme.roles[p.role]; }
    roleTitle(p) { const r = this.role(p); return `${r.emoji} ${r.name}` + (p.converted ? " (обращён)" : ""); }
    alive() { return this.order.map((id) => this.players[id]).filter((p) => p.alive); }
    pick(key, kw = {}) {
      const options = this.theme.story[key] || THEMES.classic.story[key] || [""];
      return fmt(rnd.choice(options), kw);
    }
    stat(pid, k) { const s = (this.stats = this.stats || {})[pid] = (this.stats || {})[pid] || { kills: 0, saves: 0, finds: 0, votes: 0 }; s[k] += 1; }
    say(kind, text, extra) { if (text) this.log.push(Object.assign({ day: this.day, night: this.night, kind, text, ts: Date.now() }, extra || {})); }
    // кто выбыл — для анимации; роль только если её разрешено открывать всем
    gone(q, how) { const r = this.role(q); return { who: q.id, how, role: this.settings.reveal ? { name: r.name, emoji: r.emoji, team: q.team, converted: !!q.converted } : null }; }

    abilities(p, phase) {
      if (!p.alive || p.converted) return [];
      const want = phase || (this.phase === "day" ? "day" : "night");
      const out = [];
      this.role(p).abilities.forEach((a, i) => {
        if (a.kind === "mafia_kill" || a.phase !== want) return;
        if (a.uses !== null && (p.uses[i] || 0) >= a.uses) return;
        if (a.cooldown && i in p.last_used && this.night - p.last_used[i] <= a.cooldown) return;
        if (a.even_nights && this.night % 2) return;
        out.push([i, a]);
      });
      return out;
    }

    validTargets(p, kind) {
      const alive = this.alive();
      if (kind === "heal") return alive.filter((q) => q.id !== p.last_heal).map((q) => q.id);
      if (kind === "mafia_kill" || kind === "convert") return alive.filter((q) => q.team !== "mafia").map((q) => q.id);
      return alive.filter((q) => q.id !== p.id).map((q) => q.id);
    }

    inTeamVote(p) { return p.alive && p.team === "mafia"; }

    startNight() {
      this.phase = "night"; this.night += 1; this.night_actions = {};
      this.say("night", this.pick("night"));
      if (this.theme_key === "halloween" && this.night % 2 === 0 && Object.values(this.players).some((p) => p.role === "werewolf" && p.alive))
        this.say("night", this.pick("full_moon"));
    }

    nightAct(pid, slot, target, ability) {
      const p = this.players[pid];
      if (this.phase !== "night" || !p || !p.alive) throw new GameError("Сейчас нельзя");
      const entry = this.night_actions[pid] || (this.night_actions[pid] = {});
      if (slot === "team") {
        if (!this.inTeamVote(p)) throw new GameError("Ты не в команде мафии");
        if (target !== "pass" && !this.validTargets(p, "mafia_kill").includes(target)) throw new GameError("Нельзя выбрать эту цель");
        entry.team = target; return;
      }
      if (slot !== "own") throw new GameError("Неизвестное действие");
      if (target === "pass") { entry.own = "pass"; return; }
      const opt = this.abilities(p, "night").find(([i]) => i === ability);
      if (!opt) throw new GameError("Способность недоступна");
      if (!this.validTargets(p, opt[1].kind).includes(target)) throw new GameError("Нельзя выбрать эту цель");
      entry.own = [ability, target];
    }

    nightDone() {
      return this.alive().every((p) => {
        const e = this.night_actions[p.id] || {};
        if (this.inTeamVote(p) && !("team" in e)) return false;
        if (this.abilities(p, "night").length && !("own" in e)) return false;
        return true;
      });
    }

    teamVotes() {
      const v = {};
      Object.entries(this.night_actions).forEach(([pid, e]) => {
        const p = this.players[pid];
        if (e.team && e.team !== "pass" && p.alive && p.team === "mafia") v[pid] = e.team;
      });
      return v;
    }

    resolveNight() {
      const acts = [];
      Object.entries(this.night_actions).forEach(([pid, e]) => {
        const p = this.players[pid];
        if (e.own && e.own !== "pass") { const [idx, t] = e.own; acts.push([p, this.role(p).abilities[idx].kind, t, idx]); }
      });
      const blocked = new Set(acts.filter(([, k]) => k === "block").map(([, , t]) => t));
      const privateMsg = {};
      acts.forEach(([p, kind, t, idx]) => {                 // использования считаются, даже если отвлекли
        p.uses[idx] = (p.uses[idx] || 0) + 1; p.last_used[idx] = this.night;
        if (kind === "heal") p.last_heal = t;
      });
      const effective = acts.filter(([p]) => {
        if (blocked.has(p.id)) { privateMsg[p.id] = privateMsg[p.id] || "🚫 Этой ночью тебя отвлекли — способность не сработала."; return false; }
        return true;
      });
      const healed = new Set(effective.filter(([, k]) => k === "heal").map(([, , t]) => t));
      effective.forEach(([, k, t]) => { if (k === "silence") this.players[t].silenced_day = this.day + 1; });

      const allVotes = this.teamVotes();
      Object.keys(allVotes).forEach((pid) => { if (blocked.has(pid)) privateMsg[pid] = privateMsg[pid] || "🚫 Этой ночью тебя отвлекли — твой голос не учтён."; });
      const votes = {};
      Object.entries(allVotes).forEach(([pid, t]) => { if (!blocked.has(pid)) votes[pid] = t; });
      let teamTarget = null;
      if (Object.keys(votes).length) {
        const counts = countBy(Object.values(votes));
        const top = Math.max(...counts.values());
        const best = [...counts].filter(([, c]) => c === top).map(([t]) => t);
        const leader = Object.keys(votes).find((pid) => this.role(this.players[pid]).leader);
        teamTarget = best.length > 1 && leader && best.includes(votes[leader]) ? votes[leader] : rnd.choice(best.sort());
      }
      const converts = effective.filter(([, k]) => k === "convert");
      const kills = [];
      if (converts.length) {
        teamTarget = null;                                   // в ночь укуса/заражения клан не убивает
        converts.forEach(([, , t]) => {
          const q = this.players[t];
          if (healed.has(t) || !q.alive || q.team === "mafia") return;
          q.team = "mafia"; q.converted = true;
          q.private.push(`🩸 Этой ночью тебя обратили. Теперь ты в команде «${this.theme.mafia_team}». Твоя прежняя роль больше не действует.`);
        });
      }
      if (teamTarget) kills.push(teamTarget);
      effective.forEach(([, k, t]) => { if (KILL_KINDS.includes(k)) kills.push(t); });

      const died = []; let saved = false;
      [...new Set(kills)].forEach((t) => {
        const q = this.players[t];
        if (!q.alive) return;
        if (healed.has(t)) { saved = true; return; }
        if (q.armor) { q.armor = false; saved = true; q.private.push("🛡️ Этой ночью на тебя напали, но защита спасла. Второй раз не спасёт."); return; }
        q.alive = false; died.push(q);
        if (t === teamTarget) Object.keys(votes).forEach((pid) => { if (votes[pid] === t) this.stat(pid, "kills"); });   // убийство клана — тем, кто за него голосовал
        effective.forEach(([p, k, tt]) => { if (KILL_KINDS.includes(k) && tt === t) this.stat(p.id, "kills"); });
      });
      [...new Set(kills)].forEach((t) => {                  // доктор спас мирного: тот был целью, но выжил благодаря лечению
        const q = this.players[t];
        if (q.alive && healed.has(t) && q.team !== "mafia") effective.forEach(([p, k, tt]) => { if (k === "heal" && tt === t) this.stat(p.id, "saves"); });
      });

      effective.forEach(([p, kind, t]) => {
        const q = this.players[t];
        if (kind === "check_team") { p.private.push(`🔎 Ночь ${this.night}: ${q.name} — ${q.team === "mafia" ? "🔴 " + this.theme.mafia_team : "🟢 не мафия"}.`); if (q.team === "mafia") this.stat(p.id, "finds"); }
        else if (kind === "check_role") p.private.push(`🔎 Ночь ${this.night}: ${q.name} — ${this.roleTitle(q)}.`);
        else if (kind === "find_sheriff") {
          const found = this.role(q).sheriff && !q.converted;
          const sheriff = (Object.values(this.theme.roles).find((r) => r.sheriff) || { name: "комиссар" }).name;
          p.private.push(`🔎 Ночь ${this.night}: ${q.name} — ` + (found ? `это ${sheriff}! 🎯` : `не ${sheriff}.`));
        }
      });
      Object.entries(privateMsg).forEach(([pid, text]) => this.players[pid].private.push(text));

      this.day += 1; this.phase = "day";
      died.forEach((q) => this.say("death", this.settings.reveal ? this.pick("dead", { name: q.name, role: this.roleTitle(q) }) : this.pick("dead_hidden", { name: q.name }), this.gone(q, "night")));
      if (!died.length) this.say("calm", this.pick("none"));
      if (saved) this.say("saved", this.pick("saved"));
      this.alive().forEach((q) => { if (q.silenced_day === this.day) this.say("silenced", this.pick("silenced", { name: q.name }) || `${q.name} сегодня без голоса.`); });
      Object.values(this.players).forEach((b) => {
        if (b.alive && b.bounty_target && !this.players[b.bounty_target].alive && !b.bounty_won) this.newBountyTarget(b);
      });
      this.ready = new Set(); this.votes = {};
      this.checkWin();
    }

    dayAct(pid, ability, target) {
      const p = this.players[pid];
      if (this.phase !== "day" || !p || !p.alive) throw new GameError("Сейчас нельзя");
      if (!this.abilities(p, "day").find(([i]) => i === ability) || !this.validTargets(p, "duel").includes(target)) throw new GameError("Способность недоступна");
      p.uses[ability] = (p.uses[ability] || 0) + 1;
      const q = this.players[target];
      this.say("duel", this.pick("duel", { a: p.name, b: q.name }) || `${p.name} вызывает ${q.name} на дуэль!`);
      const loser = rnd.choice([p, q]);
      loser.alive = false;
      this.say("death", this.pick(this.settings.reveal ? "duel_dead" : "duel_dead_hidden", { name: loser.name, role: this.roleTitle(loser) }), this.gone(loser, "duel"));
      this.checkWin();
      return loser.id;
    }

    setReady(pid) { if (this.phase === "day" && this.players[pid].alive) this.ready.add(pid); }
    allReady() { return this.alive().every((p) => this.ready.has(p.id)); }
    startVote() { this.phase = "vote"; this.votes = {}; }
    canVote(p) { return p.alive && p.silenced_day !== this.day; }

    vote(pid, target) {
      const p = this.players[pid];
      if (this.phase !== "vote" || !p || !this.canVote(p)) throw new GameError("Ты не можешь голосовать");
      if (target !== null && (!this.players[target] || !this.players[target].alive || target === pid)) throw new GameError("Нельзя голосовать за этого игрока");
      this.votes[pid] = target;
    }
    voteDone() { return this.alive().filter((p) => this.canVote(p)).every((p) => p.id in this.votes); }

    resolveVote() {
      const vals = Object.values(this.votes);
      const counts = countBy(vals.filter((t) => t));
      const skips = vals.filter((t) => t === null).length;
      let out = null;
      if (counts.size) {
        const top = Math.max(...counts.values());
        const best = [...counts].filter(([, c]) => c === top).map(([t]) => t);
        if (best.length === 1 && top > skips) out = this.players[best[0]];
      }
      this.phase = "verdict";
      if (out) {
        out.alive = false;
        if (out.team !== "town") Object.entries(this.votes).forEach(([pid, t]) => { if (t === out.id) this.stat(pid, "votes"); });   // верно голосовали против мафии
        this.say("out", this.pick(this.settings.reveal ? "out" : "out_hidden", { name: out.name, role: this.roleTitle(out) }), this.gone(out, "vote"));
        Object.values(this.players).forEach((b) => {
          if (b.alive && b.bounty_target === out.id && !b.bounty_won) {
            b.bounty_won = true;
            this.say("bounty", this.pick("bounty", { name: b.name }) || `${b.name} получает награду!`);
          }
        });
      } else this.say("vote_none", this.pick("vote_none"));
      this.checkWin();
      return out ? out.id : null;
    }

    checkWin() {
      if (this.winner) return this.winner;
      const alive = this.alive();
      const mafia = alive.filter((p) => p.team === "mafia");
      const solo = alive.filter((p) => p.team === "solo");
      if (!mafia.length && !solo.length) this.winner = "town";
      else if (solo.length && alive.length <= 2) this.winner = "solo";
      else if (!solo.length && mafia.length >= alive.length - mafia.length) this.winner = "mafia";
      if (this.winner) {
        this.phase = "end";
        const all = Object.values(this.players);
        this.winners = all.filter((p) => p.team === this.winner && (this.winner !== "solo" || p.alive)).map((p) => p.id);
        all.forEach((p) => { if (p.bounty_won) this.winners.push(p.id); });
        this.say("end", this.pick(`win_${this.winner}`));
      }
      return this.winner;
    }
  }

  /* ================================================================ комната */
  class Room {
    constructor(code, host, settings, restore, clock) {
      this.clock = clock || (() => Date.now() / 1000);
      if (restore) {
        Object.assign(this, restore);
        this.game = restore.game ? new Mafia(null, null, null, restore.game) : null;
        this.seen_reveal = new Set(restore.seen_reveal || []);
        return;
      }
      this.code = code; this.host = host.id;
      this.members = { [host.id]: host }; this.order = [host.id];
      this.version = 0;
      this.settings = { theme: "classic", mode: "classic", reveal: true, anonymous: false, roles: null };
      this.updateSettings(settings || {});
      this.phase = "lobby"; this.game = null; this.deadline = null; this.seen_reveal = new Set();
      this.chat = { all: [], mafia: [], dead: [] };
    }

    dump() {
      return { code: this.code, host: this.host, members: this.members, order: this.order, version: this.version,
        settings: this.settings, phase: this.phase, deadline: this.deadline, seen_reveal: Array.from(this.seen_reveal),
        chat: this.chat, game: this.game ? this.game.dump() : null };
    }

    touch() { this.version += 1; }

    updateSettings(s) {
      if (THEMES[s.theme]) { this.settings.theme = s.theme; this.settings.roles = null; }
      if (MODES[s.mode]) this.settings.mode = s.mode;
      ["reveal", "anonymous"].forEach((k) => { if (k in s) this.settings[k] = !!s[k]; });
      if (Array.isArray(s.roles)) {
        const allowed = THEMES[this.settings.theme].specials.map(([k]) => k);
        this.settings.roles = s.roles.filter((r) => allowed.includes(r));
      }
      this.touch();
    }

    join(m) {
      if (this.members[m.id]) { Object.assign(this.members[m.id], { online: true, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); this.touch(); return; }
      if (this.phase !== "lobby") throw new GameError("Игра уже идёт — дождитесь следующей партии");
      if (this.order.length >= MAX_PLAYERS) throw new GameError(`Комната заполнена (${MAX_PLAYERS} игроков)`);
      this.members[m.id] = m; this.order.push(m.id); this.touch();
    }

    leave(pid) {
      if (!this.members[pid]) return;
      if (this.phase === "lobby" || this.phase === "end") { delete this.members[pid]; this.order = this.order.filter((x) => x !== pid); }
      else this.members[pid].online = false;
      this.touch();
    }

    kick(by, pid) {
      if (by !== this.host || pid === this.host || this.phase !== "lobby") throw new GameError("Нельзя");
      this.leave(pid);
    }

    setOnline(pid, online) { if (this.members[pid]) { this.members[pid].online = online; this.touch(); } }
    timer(key) { return MODES[this.settings.mode][key]; }

    start(by) {
      if (by !== this.host) throw new GameError("Начать может только хост");
      if (!["lobby", "end"].includes(this.phase)) throw new GameError("Игра уже идёт");
      if (this.order.length < MIN_PLAYERS) throw new GameError(`Нужно минимум ${MIN_PLAYERS} игрока`);
      const players = this.order.map((pid) => [pid, this.members[pid].name, this.members[pid].avatar]);
      this.game = new Mafia(this.settings.theme, players, { reveal: this.settings.reveal, anonymous: this.settings.anonymous, roles: this.settings.roles });
      this.chat = { all: [], mafia: [], dead: [] };
      this.phase = "reveal"; this.seen_reveal = new Set(); this.deadline = this.clock() + REVEAL_SECONDS;
      this.touch();
    }

    backToLobby(by) {
      if (by !== this.host || this.phase !== "end") throw new GameError("Нельзя");
      this.order.filter((p) => !this.members[p].online).forEach((p) => this.leave(p));
      this.phase = "lobby"; this.game = null; this.deadline = null; this.touch();
    }

    seenRole(pid) {
      if (this.phase !== "reveal") return;
      this.seen_reveal.add(pid);
      if (this.order.filter((p) => this.members[p].online).every((p) => this.seen_reveal.has(p))) this.advance();
      this.touch();
    }

    act(pid, d) {
      const g = this.game;
      if (!g) throw new GameError("Игра не начата");
      const slot = d.slot; const target = d.target === undefined ? null : d.target;
      if (this.phase === "night") { g.nightAct(pid, slot, target, d.ability); if (g.nightDone()) this.advance(); }
      else if (this.phase === "day") {
        if (slot === "ready") { g.setReady(pid); if (g.allReady()) this.advance(); }
        else if (slot === "own") { g.dayAct(pid, d.ability, target); if (g.phase === "end") this.finish(); }
      } else if (this.phase === "vote") { g.vote(pid, target); if (g.voteDone()) this.advance(); }
      else throw new GameError("Сейчас нельзя");
      this.touch();
    }

    skip(by) {
      if (by !== this.host) throw new GameError("Только хост");
      if (["reveal", "day", "verdict", "night", "vote"].includes(this.phase)) this.advance();
    }

    advance() {
      const g = this.game; const now = this.clock();
      if (this.phase === "reveal") { g.startNight(); this.phase = "night"; this.deadline = now + this.timer("night"); }
      else if (this.phase === "night") {
        g.resolveNight();
        if (g.phase === "end") return this.finish();
        this.phase = "day"; this.deadline = now + this.timer("discussion");
      } else if (this.phase === "day") { g.startVote(); this.phase = "vote"; this.deadline = now + this.timer("vote"); }
      else if (this.phase === "vote") {
        g.resolveVote();
        if (g.phase === "end") return this.finish();
        this.phase = "verdict"; this.deadline = now + VERDICT_SECONDS;
      } else if (this.phase === "verdict") { g.startNight(); this.phase = "night"; this.deadline = now + this.timer("night"); }
      this.touch();
    }

    finish() { this.phase = "end"; this.deadline = null; this.touch(); }
    tick() { if (this.deadline && this.clock() >= this.deadline) { this.advance(); return true; } return false; }

    channelsFor(pid) {
      const g = this.game;
      if (!g || this.phase === "lobby") return { all: true };
      const p = g.players[pid];
      if (!p) return {};
      if (this.phase === "end") return { all: true, dead: false, mafia: p.team === "mafia" };
      const out = { all: p.alive && ["day", "vote", "verdict", "reveal"].includes(this.phase) };
      if (p.team === "mafia") out.mafia = p.alive;
      if (!p.alive) out.dead = true;
      return out;
    }

    say(pid, channel, text) {
      text = String(text || "").trim().slice(0, 300);
      if (!text) return;
      if (!this.channelsFor(pid)[channel]) throw new GameError("Сейчас писать в этот чат нельзя");
      const m = this.members[pid];
      this.chat[channel].push({ from: pid, name: m.name, avatar: m.avatar, photo: m.photo, look: m.look || {}, text, ts: Math.round(this.clock() * 1000) });
      this.chat[channel] = this.chat[channel].slice(-CHAT_LIMIT);
      this.touch();
    }

    readable(pid) {
      const g = this.game;
      if (!g || this.phase === "lobby") return { all: true };
      const p = g.players[pid]; const ended = this.phase === "end";
      return { all: true, mafia: ended || !!(p && p.team === "mafia"), dead: ended || !!(p && !p.alive) };
    }

    planPreview() {
      const theme = THEMES[this.settings.theme];
      const plan = rolePlan(theme, Math.max(this.order.length, MIN_PLAYERS), this.settings.roles);
      const counts = countBy(plan);
      return [...counts].map(([k, c]) => ({ key: k, name: theme.roles[k].name, emoji: theme.roles[k].emoji, team: theme.roles[k].team, count: c, desc: theme.roles[k].desc }));
    }

    view(pid) {
      const g = this.game; const theme = THEMES[this.settings.theme];
      const me = g ? g.players[pid] : null;
      const myMafia = !!(me && me.team === "mafia");
      const ended = this.phase === "end";
      const players = this.order.map((id) => {
        const m = this.members[id];
        const row = { id, name: m.name, avatar: m.avatar, photo: m.photo || null, look: m.look || {}, online: m.online, host: id === this.host };
        if (g && g.players[id]) {
          const gp = g.players[id];
          row.alive = gp.alive;
          row.silenced = gp.silenced_day === g.day && ["day", "vote"].includes(this.phase);
          row.ready = g.ready.has(id) && this.phase === "day";
          if (ended || id === pid || (!gp.alive && this.settings.reveal) || (myMafia && gp.team === "mafia")) {
            const r = g.role(gp);
            row.role = { name: r.name, emoji: r.emoji, team: gp.team, converted: gp.converted };
          }
          if (this.phase === "vote" && !this.settings.anonymous && id in g.votes) row.vote = g.votes[id] || "skip";
        }
        return row;
      });
      const view = { code: this.code, host: this.host, me: pid, phase: this.phase, players,
        deadline: this.deadline ? Math.round(this.deadline * 1000) : null, now: Math.round(this.clock() * 1000),
        settings: this.settings, theme: { key: this.settings.theme, title: theme.title, emoji: theme.emoji, accent: theme.accent,
          accent2: theme.accent2, mafia_team: theme.mafia_team, town_team: theme.town_team },
        mode: MODES[this.settings.mode], version: this.version, plan: this.planPreview() };
      if (g) {
        view.day = g.day; view.night = g.night; view.log = g.log.slice(-40);
        if (["vote", "verdict"].includes(this.phase) || ended) {
          const counts = {};
          Object.values(g.votes).forEach((t) => { const k = t || "skip"; counts[k] = (counts[k] || 0) + 1; });
          view.vote_counts = counts;
        }
        if (ended) { view.winner = g.winner; view.winners = g.winners; view.stats = g.stats || {}; }
      }
      if (me) {
        const r = g.role(me);
        const my = { alive: me.alive, role: { key: me.role, name: r.name, emoji: r.emoji, desc: r.desc, team: me.team, converted: me.converted, motto: r.motto || "" },
          private: me.private.slice(-20), can_vote: this.phase === "vote" ? g.canVote(me) : false,
          voted: this.phase === "vote" ? (pid in g.votes ? g.votes[pid] : "none") : null };
        my.team_name = me.team === "mafia" ? theme.mafia_team : me.team === "town" ? theme.town_team : "Сам за себя";
        if (me.bounty_target) my.bounty = g.players[me.bounty_target].name;
        const entry = g.night_actions[pid] || {};
        if (this.phase === "night" && me.alive) {
          if (g.inTeamVote(me)) {
            const votes = {};
            Object.entries(g.night_actions).forEach(([k, v]) => { if (g.players[k].team === "mafia" && v.team) votes[k] = v.team; });
            my.team_vote = { targets: g.validTargets(me, "mafia_kill"), choice: entry.team || null,
              label: (r.abilities.find((a) => a.kind === "mafia_kill") || { label: "Убить" }).label, votes };
          }
          my.abilities = g.abilities(me, "night").map(([i, a]) => ({ idx: i, label: a.label, kind: a.kind, targets: g.validTargets(me, a.kind),
            left: a.uses === null ? null : a.uses - (me.uses[i] || 0) }));
          const own = entry.own;
          my.own_choice = own === undefined ? null : own === "pass" ? "pass" : { idx: own[0], target: own[1] };
        }
        if (this.phase === "day" && me.alive) {
          my.abilities = g.abilities(me, "day").map(([i, a]) => ({ idx: i, label: a.label, kind: a.kind, targets: g.validTargets(me, a.kind),
            left: a.uses - (me.uses[i] || 0) }));
          my.ready = g.ready.has(pid);
        }
        view.my = my;
      }
      view.chat = {};
      Object.entries(this.readable(pid)).forEach(([ch, can]) => { if (can) view.chat[ch] = this.chat[ch].slice(-40); });
      view.can_write = Object.entries(this.channelsFor(pid)).filter(([, ok]) => ok).map(([ch]) => ch);
      return view;
    }
  }

  /* ================================================================ хост: обработка сообщений игроков */
  class Hub {
    /* send(pid, data) — доставить сообщение игроку (себе — локально, остальным — по сети) */
    constructor(send, hostProfile, settings, code, restore) {
      this.send = send;
      const kind = restore ? restore.kind : settings && settings.game;
      const Kind = { draw: api.DrawRoom, roulette: api.RouletteRoom, revolver: api.RevolverRoom, bluff: api.BluffRoom, blackjack: api.BlackjackRoom, spy: api.SpyRoom }[kind] || Room;   // мафия, рисовалка, подвал (дробовик, револьвер, «Верю — не верю»), блэкджек или шпион
      this.room = restore ? new Kind(null, null, null, restore) : new Kind(code, member(hostProfile), settings);
      if (!restore && settings && settings.tour) { this.room.settings.tour = settings.tour; if ("stake" in this.room.settings) this.room.settings.stake = 0; }   // турнирный стол: только свои, без ставок
      if (!restore && settings && settings.mini) { this.room.settings.mini = settings.mini; if ("stake" in this.room.settings) this.room.settings.stake = 0; }   // личный турнир с ботами: без ставок
      this.listeners = [];
    }

    handle(pid, msg) {
      const room = this.room;
      try {
        const t = msg.t;
        if (t === "ink") {                                  // штрих рисовалки — сразу всем, без пересылки всего состояния
          if (room.inkOp && room.inkOp(pid, msg.op)) room.order.forEach((p) => { if (p !== pid && room.members[p].online) this.send(p, { t: "ink", op: msg.op }); });
          return;
        }
        if (t === "hello" || t === "profile") {
          const tour = room.settings && room.settings.tour;
          if (t === "hello" && tour && Array.isArray(tour.players) && !tour.players.includes(pid) && !room.members[pid]) throw new GameError("Это турнирный стол — сесть могут только его участники");
          const m = member(Object.assign({}, msg.profile || {}, { id: pid }));
          if (t === "hello") room.join(m);
          else if (room.members[pid]) { Object.assign(room.members[pid], { name: m.name, avatar: m.avatar, photo: m.photo, look: m.look }); room.touch(); }
        } else if (t === "settings") {
          if (pid !== room.host || room.phase !== "lobby") throw new GameError("Настройки меняет хост в лобби");
          const ns = Object.assign({}, msg.settings || {}); if (room.settings.tour) delete ns.stake;   // в турнире — без ставок
          room.updateSettings(ns);
        } else if (t === "start") room.start(pid);
        else if (t === "seen") room.seenRole(pid);
        else if (t === "act") room.act(pid, msg);
        else if (t === "skip") room.skip(pid);
        else if (t === "kick") { room.kick(pid, msg.id); this.send(msg.id, { t: "kicked" }); }
        else if (t === "again") room.backToLobby(pid);
        else if (t === "finish" && room.kind === "blackjack") room.finish(pid);
        else if (t === "chat") room.say(pid, msg.channel || "all", msg.text);
        else if (t === "leave") { room.leave(pid); this.send(pid, { t: "left" }); }
        else throw new GameError("Неизвестная команда");
      } catch (e) {
        if (!(e instanceof GameError)) console.error(e);
        this.send(pid, { t: "error", text: e instanceof GameError ? e.message : "Что-то пошло не так" });
        return;
      }
      this.push();
      if (msg.t === "hello" && room.phase === "draw" && room.ink) this.send(pid, { t: "ink", all: room.ink });   // вернулся во время рисования
    }

    offline(pid) { this.room.setOnline(pid, false); this.push(); }
    tick() {
      try { if (this.room.tick()) this.push(); }
      catch (e) { console.error(e); this.room.deadline = null; this.push(); }   // одна ошибка не должна вешать стол навсегда
    }

    push() {
      this.room.order.forEach((pid) => { if (this.room.members[pid].online) this.send(pid, { t: "state", room: this.room.view(pid) }); });
      this.listeners.forEach((fn) => fn(this.room));
    }
  }

  function member(p) {
    return { id: p.id, name: String(p.name || "Игрок").slice(0, 20), avatar: String(p.avatar || "🙂").slice(0, 4),
      photo: typeof p.photo === "string" && /^https?:\/\//.test(p.photo) ? p.photo : null, look: lookOf(p.look), online: true };
  }

  // оформление профиля из магазина (рамка, фон, вид карточки, титул, эффект имени): только короткие ключи
  function lookOf(l) {
    const out = {};
    if (l && typeof l === "object") ["frame", "bg", "style", "title", "fx", "lv", "g", "w", "c"].forEach((k) => { if (typeof l[k] === "string" && /^[a-z0-9_-]{1,24}$/.test(l[k])) out[k] = l[k]; });
    if (l && typeof l.pet === "string" && /^[0-4][0-9a-f]{32}(?:[0-9a-f]{2}){0,5}(?:\.[bt])?(?:-[a-z]{2,12})?$/.test(l.pet)) out.pet = l.pet;      // главный питомец: редкость + ДНК
    return out;
  }

  const api = { Mafia, Room, Hub, GameError, rolePlan, newCode, member, THEMES, MODES, MIN_PLAYERS, MAX_PLAYERS };
  root.Engine = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
