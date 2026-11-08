/* Связь без сервера: телефон хоста держит игру, остальные подключаются к нему напрямую (WebRTC через PeerJS).
   Код комнаты = адрес хоста в PeerJS. Если хост свернул Telegram — состояние сохранено, игроки ждут и переподключаются. */
const Net = (() => {
  "use strict";
  const PREFIX = "nastolkino-v1-";
  const SNAPSHOT = "nk_host_room";
  const PID = /^(tg\d+|g_[a-z0-9]{8,32})$/;
  let peer = null, hub = null, conn = null, role = null, code = null, ticker = null, retryTimer = null;
  let wanted = false, everConnected = false;
  const conns = new Map();                     // pid -> соединение (у хоста)
  const keys = new Map();                      // pid -> секрет устройства: чужой не займёт твоё место
  const deviceKey = (() => { let k = null; try { k = localStorage.getItem("nk_device"); } catch (e) { /* нет */ }
    if (!k) { k = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join(""); try { localStorage.setItem("nk_device", k); } catch (e) { /* нет */ } }
    return k; })();
  const h = { onMessage: () => {}, onStatus: () => {}, me: null, profile: () => ({}) };

  function options() {
    const custom = new URLSearchParams(location.search).get("peer");       // для тестов: ?peer=localhost:9000
    if (custom) {
      const [host, port] = custom.split(":");
      return { host, port: Number(port) || 9000, path: "/", secure: false, debug: 1 };
    }
    return Object.assign({ debug: 1 }, (window.APP_CONFIG && window.APP_CONFIG.peer) || {});
  }
  const peerId = (c) => PREFIX + c.toLowerCase();
  const status = (s) => h.onStatus(s);

  /* ---------------------------------------------------------------- хост */
  function deliver(pid, data) {
    if (pid === h.me) { setTimeout(() => h.onMessage(data), 0); return; }
    const c = conns.get(pid);
    if (c && c.open) c.send(data);
    if (c && (data.t === "kicked" || data.t === "left")) setTimeout(() => c.close(), 300);
  }

  function saveSnapshot(room) {
    try { localStorage.setItem(SNAPSHOT, JSON.stringify({ saved: Date.now(), room: room.dump() })); } catch (e) { /* нет места */ }
  }

  function loadSnapshot() {
    try {
      const s = JSON.parse(localStorage.getItem(SNAPSHOT) || "null");
      if (s && Date.now() - s.saved < 3 * 3600 * 1000 && s.room && s.room.host === h.me) {
        // время, пока хоста не было, не считается: таймер фазы продолжается с того же места
        if (s.room.deadline) s.room._remaining = s.room.deadline - s.saved / 1000;
        return s.room;
      }
    } catch (e) { /* испорчено */ }
    return null;
  }

  // opts.code — постійний код (турнірний стіл): зайнятий — значить, хост уже є, треба просто сісти; opts.takeover — перехоплюємо стіл після хоста
  function host(settings, snapshot, opts = {}) {
    stop();
    role = "host"; wanted = true;
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const tryOpen = () => {
        const c = snapshot ? snapshot.code : opts.code || Engine.newCode();
        peer = new Peer(peerId(c), options());
        peer.on("open", () => {
          code = c;
          if (snapshot) {
            Object.values(snapshot.members).forEach((m) => { m.online = m.id === h.me; });
            if (snapshot._remaining != null) snapshot.deadline = Date.now() / 1000 + Math.max(10, snapshot._remaining);
            delete snapshot._remaining;
          }
          hub = new Engine.Hub(deliver, Object.assign({ id: h.me }, h.profile()), settings, c, snapshot || null);
          if (opts.takeover) { hub.room.host = h.me; if (opts.left && hub.room.members[opts.left]) { try { hub.room.leave(opts.left); } catch (e) { /* уже немає */ } } }
          hub.listeners.push(saveSnapshot, replicate);
          clearInterval(ticker);
          let pingAt = 0;
          ticker = setInterval(() => {
            if (!hub) return;
            hub.tick();
            if (Date.now() - pingAt > 2000) { pingAt = Date.now(); conns.forEach((x) => { if (x.open) { try { x.send({ t: "ping" }); } catch (e) { /* закрито */ } } }); }   // «пульс»: гравці бачать, що хост живий
          }, 500);
          status("ok");
          hub.push();
          resolve(c);
        });
        peer.on("connection", (c2) => {
          c2.on("data", (d) => onPeerData(c2, d));
          c2.on("close", () => {
            if (c2.pid && conns.get(c2.pid) === c2) { conns.delete(c2.pid); if (hub) hub.offline(c2.pid); }
          });
        });
        peer.on("disconnected", () => { if (wanted && peer && !peer.destroyed) setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1500); });
        peer.on("error", (err) => {
          if (err.type === "unavailable-id" && code && hub && role === "host") {   // телефон «спав», а стіл уже підхопив інший — сідаємо до нього гравцем
            const c0 = code; stop(); join(c0); return;
          }
          if (err.type === "unavailable-id") {
            peer.destroy();
            attempts += 1;
            if (opts.code && !snapshot) return reject(Object.assign(new Error("busy"), { busy: true }));   // стіл уже відкрив інший — сідаємо до нього
            if (opts.takeover && attempts >= 8) return reject(new Error("Стіл уже тримає інший гравець"));
            if (!snapshot && attempts < 10) return tryOpen();                 // код занят — берём другой
            if (snapshot && attempts < 25) return setTimeout(tryOpen, 3000);  // старое соединение ещё не отпустило код
            return reject(new Error("Не вдалося відкрити кімнату"));
          }
          if (!code && ["network", "server-error", "socket-error", "socket-closed", "browser-incompatible"].includes(err.type)) {
            peer.destroy();
            reject(new Error(err.type === "browser-incompatible" ? "Цей застосунок не підтримує прямий зв’язок" : "Немає зв’язку із сервером зустрічей. Перевірте інтернет"));
          }
        });
      };
      tryOpen();
    });
  }

  function onPeerData(c, d) {
    if (typeof d === "string") { try { d = JSON.parse(d); } catch (e) { return; } }
    if (!d || typeof d !== "object") return;
    if (d.t === "hello") {
      if (!PID.test(String(d.pid || "")) || d.pid === h.me || (c.pid && c.pid !== d.pid)) return c.close();
      const k = String(d.key || "");
      if (keys.has(d.pid) && keys.get(d.pid) !== k) return c.close();
      keys.set(d.pid, k);
      c.pid = d.pid;
      const old = conns.get(d.pid);
      if (old && old !== c) old.close();
      conns.set(d.pid, c);
    }
    if (c.pid && conns.get(c.pid) === c && hub) hub.handle(c.pid, d);
  }

  // наступник — перший живий гравець після хоста: у нього завжди свіжа копія стану, і якщо хост зникне, стіл продовжиться на його телефоні
  const isBot = (p) => /^bot_/.test(p);
  const successors = (room) => room.order.filter((p) => p !== h.me && !isBot(p) && room.members[p] && room.members[p].online).slice(0, 2);
  const successor = (room) => successors(room)[0];
  let repAt = 0, repTimer = null;
  function replicate(room) {                                   // копія — двом наступникам: другий підхопить, якщо й перший зник
    const doIt = () => {
      repAt = Date.now(); const dump = room.dump();
      successors(room).forEach((sp, rank) => { const c = conns.get(sp); if (c && c.open) { try { c.send({ t: "snap", room: dump, at: Date.now(), rank }); } catch (e) { /* завелике чи закрите */ } } });
    };
    clearTimeout(repTimer);
    if (Date.now() - repAt > 800) doIt(); else repTimer = setTimeout(doIt, 800);
  }
  // хост іде, а гра триває (турнір або вже йде партія й є люди) — віддаємо стіл наступникові замість закриття
  function handover() {
    const room = hub && hub.room; if (!room) return false;
    const sp = successor(room), c = sp && conns.get(sp);
    if (!c || !c.open) return false;
    if (!(room.settings && room.settings.tour) && ["lobby", "end"].includes(room.phase)) return false;
    try { c.send({ t: "handover", room: room.dump(), at: Date.now(), left: h.me }); } catch (e) { return false; }
    try { localStorage.removeItem(SNAPSHOT); } catch (e) { /* ничего */ }
    wanted = false; setTimeout(stop, 500);
    return true;
  }

  function closeRoom() {
    conns.forEach((c) => { try { c.send({ t: "closed" }); } catch (e) { /* уже закрыто */ } });
    try { localStorage.removeItem(SNAPSHOT); } catch (e) { /* ничего */ }
    setTimeout(stop, 300);
  }

  /* ---------------------------------------------------------------- игрок */
  let snap = null, onNoHost = null;
  // хост зник (сервер зустрічей його не знає) або сам передав стіл: наступник відкриває той самий код зі своєю копією
  function takeover(room, at, left) {
    if (!room || role !== "client") return false;
    const c0 = code, r = JSON.parse(JSON.stringify(room));
    if (r.deadline) r._remaining = r.deadline - (at || Date.now()) / 1000;
    r.code = c0; snap = null; status("connecting");
    host(null, r, { takeover: true, left: left || null })
      .then(() => h.onMessage({ t: "host-moved" }))
      .catch(() => join(c0));
    return true;
  }
  function join(roomCode, opts = {}) {
    stop();
    role = "client"; wanted = true; everConnected = false; snap = null; onNoHost = opts.noHost || null;
    code = roomCode.toUpperCase();
    status("connecting");
    peer = new Peer(options());
    peer.on("open", connectToHost);
    peer.on("disconnected", () => { if (wanted && peer && !peer.destroyed) setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1500); });
    peer.on("error", (err) => {
      if (err.type === "peer-unavailable") {
        if (!everConnected && onNoHost) { const fn = onNoHost; onNoHost = null; stop(); fn(); }                          // турнірний стіл: хоста ще немає — стаємо ним
        else if (!everConnected) { h.onMessage({ t: "error", text: "Кімнату не знайдено. Перевірте код" }); stop(); h.onMessage({ t: "left" }); }
        else if (snap && Date.now() - snap.at < 15 * 60 * 1000 && snap.room.phase !== "end") {                       // хоста немає — стіл продовжується в мене
          if (!snap.rank) takeover(snap.room, snap.at);
          else { const s0 = snap; retry(); setTimeout(() => { if (snap === s0 && (!conn || !conn.open)) takeover(s0.room, s0.at); }, 7000); }   // другий наступник чекає першого
        }
        else retry();
      } else if (["network", "server-error", "socket-error", "socket-closed"].includes(err.type)) retry();
    });
  }

  // хост мовчить довше 7 секунд (телефон вимкнувся, зник зв’язок) — перепідключаємося; якщо його вже немає на сервері зустрічей — стіл підхоплює наступник
  let lastData = 0;
  setInterval(() => {
    if (role !== "client" || !wanted || !conn || !conn.open || !lastData) return;
    if (Date.now() - lastData > 7000) { lastData = 0; const c = conn; conn = null; try { c.close(); } catch (e) { /* ничего */ } retry(); }
  }, 1000);

  function connectToHost() {
    if (!wanted || !peer || peer.destroyed) return;
    if (conn) { const old = conn; conn = null; try { old.close(); } catch (e) { /* ничего */ } }
    const my = peer.connect(peerId(code), { reliable: true, serialization: "json" });
    conn = my;
    const timeout = setTimeout(() => { if (conn === my && !my.open) retry(); }, 12000);
    my.on("open", () => {
      clearTimeout(timeout);
      if (conn !== my) return;
      everConnected = true; lastData = Date.now();
      status("ok");
      my.send({ t: "hello", pid: h.me, profile: h.profile(), key: deviceKey });
    });
    my.on("data", (d) => {
      if (conn !== my) return;
      lastData = Date.now();
      if (d && d.t === "ping") return;
      if (d && d.t === "snap") { if (d.room && d.room.code === code) snap = { room: d.room, at: d.at || Date.now(), rank: d.rank || 0 }; return; }   // копія стану на випадок, якщо хост зникне
      if (d && d.t === "handover") { if (d.room) takeover(d.room, d.at, d.left); return; }
      if (d && (d.t === "closed" || d.t === "kicked" || d.t === "left")) { wanted = false; setTimeout(stop, 100); }
      h.onMessage(d);
    });
    my.on("close", () => { if (wanted && conn === my) retry(); });
  }

  function retry() {
    if (!wanted) return;
    status("lost");
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (!wanted) return;
      if (!peer || peer.destroyed) return join(code);
      if (peer.disconnected) peer.reconnect();
      connectToHost();
    }, 3000);
  }

  /* ---------------------------------------------------------------- общее */
  function send(msg) {
    if (role === "host" && hub) {
      if (msg.t === "leave") { if (!handover()) closeRoom(); clearInterval(ticker); hub = null; setTimeout(() => h.onMessage({ t: "left" }), 0); return; }   // свій стан більше не шлемо — інакше екран повернеться в кімнату
      hub.handle(h.me, msg);
    } else if (role === "client" && conn && conn.open) {
      conn.send(msg);
      if (msg.t === "leave") { wanted = false; setTimeout(stop, 300); }
    } else if (role === "client" && msg.t === "leave") {
      stop(); h.onMessage({ t: "left" });
    } else h.onMessage({ t: "error", text: "Немає зв’язку з кімнатою… перепідключаюся" });
  }

  function stop() {
    wanted = false;
    clearInterval(ticker); clearTimeout(retryTimer);
    conns.forEach((c) => { try { c.close(); } catch (e) { /* ничего */ } });
    conns.clear();
    if (conn) { try { conn.close(); } catch (e) { /* ничего */ } }
    if (peer) { try { peer.destroy(); } catch (e) { /* ничего */ } }
    peer = null; conn = null; hub = null; role = null;
  }

  /* хост свернул Telegram (телефон «заморозил» страницу) — после возвращения сдвигаем таймер на время отсутствия */
  let hiddenAt = null;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && role === "host" && hub && hub.room.deadline) {
      const away = (Date.now() - hiddenAt) / 1000;
      if (away > 2) { hub.room.deadline += away; hub.room.touch(); hub.push(); }
    }
    hiddenAt = null;
  });

  function hostOrJoin(fixed, settings) {
    return new Promise((resolve, reject) => {
      const asHost = () => host(settings, null, { code: fixed }).then((c) => resolve({ host: true, code: c }))
        .catch((e) => { if (e && e.busy) { join(fixed, { noHost: () => setTimeout(asHost, 1500) }); resolve({ host: false, code: fixed }); } else reject(e); });
      join(fixed, { noHost: asHost });
      setTimeout(() => resolve({ host: role === "host", code: fixed }), 9000);
    });
  }

  return Object.assign(h, { host, join, hostOrJoin, send, stop, loadSnapshot, isHost: () => role === "host", code: () => code, _hub: () => hub, _snap: () => snap, _takeover: takeover });
})();
