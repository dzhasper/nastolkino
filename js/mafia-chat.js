/* Мафия в виде чата (вид по умолчанию): ведущий пишет в ленту, игроки переписываются, действия — кнопками внизу.
   Лента живёт отдельно от перерисовки экрана: новые сообщения только дописываются, поэтому анимации не сбиваются.
   Чат команды мафии сюда приходит только тем, кто в мафии, — это решает хост (engine.js → readable), не экран. */
"use strict";

const MChat = (() => {
  let lastPhase = "", root = null, feed = null, gameKey = "", nodes = new Map(), priv = {}, marks = {}, atBottom = true, unread = 0, firstFill = true, inputSig = "";
  const isMafia = (r) => r && !["draw", "roulette", "revolver", "bluff", "blackjack", "spy"].includes(r.game);
  const PHASES = ["reveal", "night", "day", "vote", "verdict"];
  const active = () => S.screen === "room" && isMafia(S.room) && PHASES.includes(S.room.phase) && store.mafiaView !== "cards";
  const hostNow = () => Date.now() + (S.offset || 0);
  const pl = (id) => (S.room.players || []).find((p) => p.id === id);
  const TEAM = { town: "мирные", mafia: "мафия", solo: "сам за себя" };

  /* ---------------------------------------------------------------- каркас */
  function ensure() {
    if (root) return;
    root = document.createElement("div"); root.id = "mc-root"; root.className = "mc";
    root.innerHTML = `<div class="mc-head" id="mc-head"></div><div class="mc-strip" id="mc-strip"></div>
      <div class="mc-feedwrap"><div class="mc-feed" id="mc-feed"></div><button class="mc-down" id="mc-down" data-a="mc-down">↓</button></div>
      <div class="mc-dock" id="mc-dock"></div><div class="mc-input" id="mc-input"></div>`;
    document.body.appendChild(root);
    feed = root.querySelector("#mc-feed");
    feed.addEventListener("scroll", () => { atBottom = feed.scrollHeight - feed.scrollTop - feed.clientHeight < 80; if (atBottom) { unread = 0; downBtn(); } }, { passive: true });
  }
  function reset() { cineQ = []; if (feed) feed.innerHTML = ""; nodes = new Map(); priv = {}; marks = {}; atBottom = true; unread = 0; firstFill = true; inputSig = ""; }
  function downBtn() { const b = root && root.querySelector("#mc-down"); if (b) { b.classList.toggle("show", !atBottom); b.textContent = unread ? `↓ ${unread}` : "↓"; } }

  /* ---------------------------------------------------------------- что показать в ленте */
  function host(text, cls = "", extra = "") {
    return `<div class="mc-host ${cls}"><div class="mh-ava">${emo(S.room.theme.emoji, 20)}</div><div class="mh-b"><div class="mh-who">Ведущий${extra}</div>${esc(text)}</div></div>`;
  }
  function divider(kind, title, sub) {
    const ico = { night: "🌙", day: "☀️", vote: "⚖️", verdict: "🔨" }[kind] || "•";
    return `<div class="mc-div d-${kind}"><div class="md-sky"><span class="md-ico">${ico}</span></div><b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ""}</div>`;
  }
  function killCard(e) {
    const p = pl(e.who) || { name: "?", avatar: "👤", look: {} }, role = e.role;
    const how = e.how || (e.kind === "out" ? "vote" : "night");
    const title = how === "vote" ? "⚖️ Город изгнал" : how === "duel" ? "🤠 Проиграл(а) дуэль" : "🔪 Не пережил(а) ночь";
    const stamp = how === "vote" ? "ИЗГНАН" : "УБИТ";
    return `<div class="mc-kill how-${how}">
      <div class="mk-stage"><div class="mk-av"><span class="mk-face">${av(p, "big")}</span><i class="mk-cross"></i><i class="mk-flash"></i><i class="mk-blood"></i>${how === "vote" ? '<i class="mk-gavel">🔨</i>' : ""}</div><b class="mk-stamp">${stamp}</b></div>
      <div class="mk-body"><div class="mk-title">${title}</div><div class="mk-name">${nm(p)}</div>
        <div class="mk-role ${role ? "team-" + role.team : "hidden"}">${role ? `<span>Кем был(а):</span><b>${emo(role.emoji, 16)} ${esc(role.name)}${role.converted ? " (обращён)" : ""}</b><i>${TEAM[role.team] || ""}</i>` : "<span>Роль осталась тайной</span>"}</div>
        <div class="mk-text">${esc(e.text)}</div></div></div>`;
  }
  function chatMsg(m, ch) {
    const mine = m.from === S.me, tag = ch === "mafia" ? `<span class="ch-tag mafia">🩸 команда</span>` : ch === "dead" ? `<span class="ch-tag dead">👻 морг</span>` : "";
    return `<div class="mc-msg ${mine ? "mine" : ""} ch-${ch}">${mine ? "" : av(m, "sm")}<div class="b">${mine ? tag : `<div class="who">${esc(m.name)}${tag}</div>`}${esc(m.text)}</div></div>`;
  }
  function roleMsg(r) {
    const my = r.my, ro = my.role;
    const mates = r.players.filter((p) => p.id !== S.me && p.role && p.role.team === "mafia" && ro.team === "mafia");
    return `<div class="mc-host role"><div class="mh-ava">${emo(r.theme.emoji, 20)}</div><div class="mh-b"><div class="mh-who">Ведущий · 🔒 только тебе</div>Раздаю роли. Никому не показывай экран.
      <div class="mc-flip ${S.flipOpen || r.phase !== "reveal" ? "open" : ""}" id="mc-flip" data-a="mc-flip"><div class="flip-in">
        <div class="face front">${cardFront(skinKey())}</div><div class="face back">${cardBack(skinKey(), my)}</div></div></div>
      <div class="mc-rolemini team-${ro.team}">${emo(ro.emoji, 16)} <b>${esc(ro.name)}</b> · ${esc(my.team_name || "")}</div>
      ${mates.length ? `<div class="mc-mates">Твоя команда: ${mates.map((m) => `<b>${esc(m.name)}</b> <span class="muted">${esc(m.role.name)}</span>`).join(", ")}</div>` : ""}
      ${my.bounty ? `<div class="mc-mates">🎯 Твоя цель: <b>${esc(my.bounty)}</b></div>` : ""}</div></div>`;
  }

  function items(r) {
    const out = [], log = r.log || [], t0 = (log[0] && log[0].ts) || 0, my = r.my || {};
    if (my.role) out.push({ key: "role", ts: t0 - 2, html: roleMsg(r), cls: "" });
    const nights = new Set(), days = new Set();
    log.forEach((e, i) => {
      const ts = e.ts || t0 + i, key = "l:" + (e.ts || 0) + ":" + e.kind + ":" + e.day + ":" + e.night + ":" + e.text.slice(0, 40);
      if (e.kind === "night" && !nights.has(e.night)) {
        nights.add(e.night);
        out.push({ key: "dn:" + e.night, ts: ts - .5, html: divider("night", SK().night(e.night), "Город засыпает") });
      }
      if (["death", "calm", "saved", "silenced", "duel"].includes(e.kind) && e.day && !days.has(e.day) && !(e.kind === "death" && e.how === "duel")) {
        days.add(e.day);
        out.push({ key: "dd:" + e.day, ts: ts - .5, html: divider("day", SK().day(e.day), "Город просыпается") });
      }
      if ((e.kind === "death" || e.kind === "out") && e.who) out.push({ key, ts, html: killCard(e), cls: "big", kill: e });
      else if (e.kind === "out") out.push({ key, ts, html: host(e.text, "out"), cls: "" });
      else if (e.kind === "night") out.push({ key, ts, html: host(e.text, "night"), cls: "" });
      else out.push({ key, ts, html: host(e.text, e.kind), cls: "" });
    });
    Object.entries(marks).forEach(([k, m]) => out.push({ key: k, ts: m.ts, html: divider(m.kind, m.title, m.sub) }));
    (my.private || []).forEach((t) => { if (!(t in priv)) priv[t] = firstFill ? t0 + 1 : hostNow(); out.push({ key: "p:" + t, ts: priv[t], html: host(t, "priv", " · 🔒 только тебе") }); });
    Object.entries(r.chat || {}).forEach(([ch, list]) => list.forEach((m) => out.push({ key: `c:${ch}:${m.ts}:${m.from}`, ts: m.ts, html: chatMsg(m, ch), cls: "", chat: m.from !== S.me })));
    return out.sort((a, b) => a.ts - b.ts);
  }

  function fill(r) {
    const list = items(r);
    let added = 0;
    list.forEach((it) => {
      if (nodes.has(it.key)) return;
      const el = document.createElement("div");
      el.className = "mc-item " + (it.cls || "") + (firstFill ? "" : " new");
      el.dataset.ts = it.ts; el.innerHTML = it.html;
      const after = [...feed.children].find((c) => Number(c.dataset.ts) > it.ts);
      if (after) feed.insertBefore(el, after); else feed.appendChild(el);
      nodes.set(it.key, el); added++;
      if (!firstFill) setTimeout(() => el.classList.remove("new"), 6000);
      if (!firstFill && it.kill) cine(it.kill);
    });
    if (added) {
      if (PX()) Pixel.apply(feed);
      if (atBottom || firstFill) requestAnimationFrame(() => { feed.scrollTop = feed.scrollHeight; });
      else { unread += added; downBtn(); }
    }
    const rm = nodes.get("role");                                       // после раздачи карта сворачивается в строчку
    if (rm) rm.classList.toggle("compact", r.phase !== "reveal");
    firstFill = false;
  }

  // смерть крупно поверх чата: прицел → выстрел → кровь → штамп → кем был(а); потом карточка остаётся в ленте
  let cineQ = [], cineOn = false;
  function cine(e) { cineQ.push(e); if (!cineOn) cineNext(); }
  function cineNext() {
    const e = cineQ.shift();
    if (!e || !root) { cineOn = false; return; }
    cineOn = true;
    const d = document.createElement("div"); d.className = "mc-cine how-" + (e.how || "night");
    d.innerHTML = `<div class="mc-item new">${killCard(e)}</div><div class="mc-cine-tap">нажми, чтобы закрыть</div>`;
    root.appendChild(d); if (PX()) Pixel.apply(d);
    try { haptic("heavy"); setTimeout(() => notify(e.how === "vote" ? "warning" : "error"), 1000); } catch (x) { /* нет */ }
    let done = false;
    const close = () => { if (done) return; done = true; d.classList.add("out"); setTimeout(() => { d.remove(); cineNext(); }, 380); };
    d.onclick = close; setTimeout(close, 4600);
  }

  /* ---------------------------------------------------------------- шапка, игроки, действия */
  function head(r) {
    const my = r.my || {}, ro = my.role;
    const title = { reveal: "Раздача ролей", night: SK().night(r.night), day: SK().day(r.day), vote: SK().vote, verdict: SK().verdict }[r.phase] || "";
    const sub = { reveal: "Запомни роль", night: SK().nightSub, day: SK().discuss, vote: r.settings.anonymous ? "Тайное голосование" : "Открытое голосование", verdict: SK().day(r.day) }[r.phase] || "";
    return `${netBanner()}<button class="mc-back" data-a="leave">←</button>
      <div class="mc-ttl"><span class="kicker">${esc(r.theme.title)}</span><b>${esc(title)}</b><span class="small muted">${esc(sub)}</span></div>
      ${ro ? `<button class="mc-rolechip team-${ro.team}" data-a="mc-role" title="${esc(ro.name)}">${emo(ro.emoji, 20)}<i>роль</i></button>` : ""}${timerSvg()}`;
  }
  function strip(r) {
    return r.players.map((p) => `<button class="ms-p ${p.alive === false ? "dead" : ""} ${p.id === S.me ? "me" : ""} ${p.ready ? "ready" : ""}" data-a="peek" data-v="${p.id}">
      ${av(p, "sm")}${p.alive === false ? '<i class="ms-x">✝</i>' : ""}${p.ready ? '<i class="ms-r">✋</i>' : ""}${p.silenced ? '<i class="ms-r">🤐</i>' : ""}
      <span>${p.id === S.me ? "Вы" : esc(p.name)}</span>${p.role && p.id !== S.me ? `<em class="team-${p.role.team}">${emo(p.role.emoji, 10)}</em>` : ""}</button>`).join("")
      + `<button class="ms-p ms-view" data-a="mafia-view"><span class="ms-ico">▦</span><span>Карточки</span></button>`;
  }
  function chips(list, o = {}) {
    return `<div class="mc-chips">${list.map((p) => {
      const can = !o.pick || o.pick.includes(p.id), sel = o.sel === p.id, cnt = o.counts ? o.counts[p.id] : 0, vs = o.voters ? (o.voters[p.id] || []) : [];
      return `<button class="mc-chip ${sel ? "on" : ""} ${can ? "" : "off"}" ${can && o.action ? `data-a="${o.action}" data-v="${p.id}"` : "disabled"}>
        ${av(p, "sm")}<span>${p.id === S.me ? "Вы" : esc(p.name)}</span>${cnt ? `<i class="cnt">${cnt}</i>` : ""}${vs.length ? `<i class="vs">${vs.map((v) => av(pl(v), "mini")).join("")}</i>` : ""}</button>`;
    }).join("")}</div>`;
  }
  const skipBtn = (label) => (isHost() ? `<button class="mc-skip" data-a="skip">⏭ ${esc(label)}</button>` : "");
  function dock(r) {
    const my = r.my || {}, alive = r.players.filter((p) => p.alive);
    if (r.phase === "reveal") {
      return S.flipOpen ? `<div class="mc-row"><button class="btn grow" data-a="seen">✓ Я запомнил(а) — к игре</button>${skipBtn("Сразу")}</div>`
        : `<div class="mc-hint">👆 Нажми на карту в чате, чтобы открыть свою роль</div>${skipBtn("Начать сразу")}`;
    }
    if (!my.alive && r.phase !== "verdict") return `<div class="mc-hint">👻 Ты выбыл(а). Смотри и пиши в «Морг» — живые его не видят</div>${skipBtn("Дальше")}`;
    if (r.phase === "night") {
      let out = "";
      if (my.team_vote) {
        const voters = {};
        Object.entries(my.team_vote.votes || {}).forEach(([w, t]) => { if (t !== "pass") (voters[t] = voters[t] || []).push(w); });
        out += `<div class="mc-q">🩸 ${esc(r.theme.mafia_team)}: ${esc(my.team_vote.label)}</div>${chips(alive, { pick: my.team_vote.targets, sel: my.team_vote.choice, action: "team", voters })}
          <button class="mc-pass ${my.team_vote.choice === "pass" ? "on" : ""}" data-a="team" data-v="pass">Никого этой ночью</button>`;
      }
      if (my.abilities && my.abilities.length) {
        const own = my.own_choice, ab = my.abilities[Math.min(S.sel.ability, my.abilities.length - 1)], chosen = own && own !== "pass" ? own.target : null;
        out += `<div class="mc-q">✨ ${my.abilities.length > 1 ? my.abilities.map((a, i) => `<button class="pill ${a === ab ? "on" : ""}" data-a="ability" data-v="${i}">${esc(a.label)}${a.left != null ? ` · ${a.left}` : ""}</button>`).join(" ") : esc(ab.label) + (ab.left != null ? ` · осталось ${ab.left}` : "")}</div>
          ${own ? `<div class="mc-done">${own === "pass" ? "Ты пропускаешь эту ночь" : `✓ ${esc((my.abilities.find((a) => a.idx === own.idx) || {}).label || "Выбор")}: <b>${esc((pl(own.target) || {}).name || "")}</b> — можно изменить`}</div>` : ""}
          ${chips(alive, { pick: ab.targets, sel: S.sel.target || chosen, action: "target" })}
          <div class="mc-row"><button class="btn small grow" data-a="own" ${S.sel.target ? "" : "disabled"}>${esc(ab.label)}${S.sel.target ? " → " + esc((pl(S.sel.target) || {}).name || "") : ""}</button><button class="btn ghost small" data-a="own-pass">Пропустить</button></div>`;
      }
      return (out || `<div class="mc-hint">😴 Ты спишь. Жди утра…</div>`) + skipBtn("Закончить ночь");
    }
    if (r.phase === "day") {
      const ready = alive.filter((p) => p.ready).length;
      let duel = "";
      if (my.abilities && my.abilities.length) {
        const ab = my.abilities[0];
        duel = S.sel.duel ? `<div class="mc-q">🤠 ${esc(ab.label)}: с кем?</div>${chips(alive, { pick: ab.targets, sel: S.sel.target, action: "target" })}
            <div class="mc-row"><button class="btn danger small grow" data-a="duel" ${S.sel.target ? "" : "disabled"}>Вызвать на дуэль</button><button class="btn ghost small" data-a="duel-cancel">Отмена</button></div>`
          : `<button class="mc-pass" data-a="duel-open">🤠 ${esc(ab.label)} (осталось: ${ab.left})</button>`;
      }
      return `${duel}<div class="mc-row"><button class="btn grow" data-a="ready" ${my.ready ? "disabled" : ""}>${my.ready ? "✓ Ты готов(а)" : "✋ Готов(а) голосовать"} · ${ready}/${alive.length}</button>${skipBtn("К голосованию")}</div>`;
    }
    if (r.phase === "vote") {
      const voters = {};
      r.players.forEach((p) => { if (p.vote && p.vote !== "skip") (voters[p.vote] = voters[p.vote] || []).push(p.id); });
      const counts = r.settings.anonymous ? (r.vote_counts || {}) : {}, skipV = (r.vote_counts || {}).skip || 0;
      if (!my.can_vote) return `<div class="mc-hint">🤐 Сегодня ты без голоса</div>${chips(alive, { voters, counts })}${skipBtn("Подвести итог")}`;
      return `<div class="mc-q">⚖️ Кого выгоняем?</div>${chips(alive, { pick: alive.filter((p) => p.id !== S.me).map((p) => p.id), sel: my.voted !== "none" ? my.voted : null, action: "vote", voters, counts })}
        <div class="mc-row"><button class="mc-pass grow ${my.voted === null ? "on" : ""}" data-a="vote" data-v="skip">Воздержаться${skipV ? " · " + skipV : ""}</button>${skipBtn("Итог")}</div>`;
    }
    if (r.phase === "verdict") return `<div class="mc-hint">Город решил. Скоро ночь…</div>${skipBtn("Наступает ночь")}`;
    return "";
  }
  function input(r) {
    const can = r.can_write || [];
    if (!can.includes(S.chatTab)) S.chatTab = r.phase === "night" && can.includes("mafia") ? "mafia" : can[0] || "all";
    const el = root.querySelector("#mc-input"), sig = can.join(",") + "|" + S.chatTab + "|" + r.phase;
    if (sig === inputSig) return;
    inputSig = sig;
    const old = document.getElementById("chat-input"), keep = old ? old.value : "";
    if (!can.length) {
      el.innerHTML = `<div class="mc-closed">${r.phase === "night" ? "🌙 Ночью город спит — общий чат молчит" : r.phase === "reveal" ? "Сначала все смотрят роли" : "Сейчас писать нельзя"}</div>`;
      return;
    }
    const NAMES = { all: "💬 Всем", mafia: "🩸 Команде", dead: "👻 Морг" };
    const ph = { all: "Сообщение всем…", mafia: "Шёпот команде — остальные не видят…", dead: "Пишут только выбывшие…" }[S.chatTab];
    el.innerHTML = `${can.length > 1 ? `<div class="mc-chs">${can.map((c) => `<button class="pill ${c === S.chatTab ? "on" : ""}" data-a="mc-ch" data-v="${c}">${NAMES[c]}</button>`).join("")}</div>` : ""}
      ${S.chatTab === "mafia" ? '<div class="mc-secret">🔒 Это видит только ваша команда</div>' : ""}
      <form class="chat-form ch-${S.chatTab}" id="chat-send"><input class="input" id="chat-input" maxlength="300" placeholder="${ph}" autocomplete="off"><button class="btn" type="submit">➤</button></form>`;
    const inp = document.getElementById("chat-input"); if (inp) inp.value = keep;
  }

  /* ---------------------------------------------------------------- снаружи */
  function sync() {
    const on = active();
    document.body.classList.toggle("mc-on", on);
    if (!on) { if (root) root.style.display = "none"; return; }
    ensure(); root.style.display = "";
    const r = S.room, gk = r.code + ":" + (((r.log || [])[0] || {}).ts || "");
    if (gk !== gameKey) { gameKey = gk; reset(); }
    const pk = r.phase + ":" + r.day + ":" + r.night;
    if (pk !== lastPhase) { lastPhase = pk; atBottom = true; unread = 0; downBtn(); }   // новая фаза — показываем самое свежее
    if (r.phase === "vote" && !marks["dv:" + r.day]) marks["dv:" + r.day] = { kind: "vote", title: SK().vote, sub: "Город решает, кого выгнать", ts: firstFill ? hostNow() - 1 : hostNow() };
    root.classList.toggle("night", r.phase === "night");
    root.querySelector("#mc-head").innerHTML = head(r);
    root.querySelector("#mc-strip").innerHTML = strip(r);
    root.querySelector("#mc-dock").innerHTML = dock(r);
    input(r);
    fill(r);
    if (PX()) { Pixel.apply(root.querySelector("#mc-head")); Pixel.apply(root.querySelector("#mc-strip")); Pixel.apply(root.querySelector("#mc-dock")); }
  }
  function roleSheet() {
    const r = S.room, my = r.my;
    return `<div class="flip open mc-sheetcard"><div class="flip-in"><div class="face front">${cardFront(skinKey())}</div><div class="face back">${cardBack(skinKey(), my)}</div></div></div>`;
  }
  const ACTIONS = {
    "mc-flip": () => { const f = document.getElementById("mc-flip"); if (f && !f.classList.contains("open")) { f.classList.add("open"); S.flipOpen = true; haptic("heavy"); sync(); } },
    "mc-role": () => { S.sheet = { type: "mc-role" }; renderOverlay(); },
    "mc-ch": (v) => { S.chatTab = v; inputSig = ""; sync(); const i = document.getElementById("chat-input"); if (i) i.focus(); },
    "mc-down": () => { feed.scrollTop = feed.scrollHeight; atBottom = true; unread = 0; downBtn(); },
    "mafia-view": () => { store.mafiaView = store.mafiaView === "cards" ? "chat" : "cards"; saveProfile(); render(); },
  };
  return { sync, active, isMafia, roleSheet, ACTIONS };
})();
