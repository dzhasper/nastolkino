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

  function host(settings, snapshot) {
    stop();
    role = "host"; wanted = true;
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const tryOpen = () => {
        const c = snapshot ? snapshot.code : Engine.newCode();
        peer = new Peer(peerId(c), options());
        peer.on("open", () => {
          code = c;
          if (snapshot) {
            Object.values(snapshot.members).forEach((m) => { m.online = m.id === h.me; });
            if (snapshot._remaining != null) snapshot.deadline = Date.now() / 1000 + Math.max(10, snapshot._remaining);
            delete snapshot._remaining;
          }
          hub = new Engine.Hub(deliver, Object.assign({ id: h.me }, h.profile()), settings, c, snapshot || null);
          hub.listeners.push(saveSnapshot);
          clearInterval(ticker);
          ticker = setInterval(() => hub && hub.tick(), 500);
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
          if (err.type === "unavailable-id") {
            peer.destroy();
            attempts += 1;
            if (!snapshot && attempts < 10) return tryOpen();                 // код занят — берём другой
            if (snapshot && attempts < 25) return setTimeout(tryOpen, 3000);  // старое соединение ещё не отпустило код
            return reject(new Error("Не удалось открыть комнату"));
          }
          if (!code && ["network", "server-error", "socket-error", "socket-closed", "browser-incompatible"].includes(err.type)) {
            peer.destroy();
            reject(new Error(err.type === "browser-incompatible" ? "Это приложение не поддерживает прямую связь" : "Нет связи с сервером встреч. Проверьте интернет"));
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

  function closeRoom() {
    conns.forEach((c) => { try { c.send({ t: "closed" }); } catch (e) { /* уже закрыто */ } });
    try { localStorage.removeItem(SNAPSHOT); } catch (e) { /* ничего */ }
    setTimeout(stop, 300);
  }

  /* ---------------------------------------------------------------- игрок */
  function join(roomCode) {
    stop();
    role = "client"; wanted = true; everConnected = false;
    code = roomCode.toUpperCase();
    status("connecting");
    peer = new Peer(options());
    peer.on("open", connectToHost);
    peer.on("disconnected", () => { if (wanted && peer && !peer.destroyed) setTimeout(() => peer && !peer.destroyed && peer.reconnect(), 1500); });
    peer.on("error", (err) => {
      if (err.type === "peer-unavailable") {
        if (!everConnected) { h.onMessage({ t: "error", text: "Комната не найдена. Проверьте код" }); stop(); h.onMessage({ t: "left" }); }
        else retry();
      } else if (["network", "server-error", "socket-error", "socket-closed"].includes(err.type)) retry();
    });
  }

  function connectToHost() {
    if (!wanted || !peer || peer.destroyed) return;
    if (conn) { try { conn.close(); } catch (e) { /* ничего */ } }
    conn = peer.connect(peerId(code), { reliable: true, serialization: "json" });
    const timeout = setTimeout(() => { if (conn && !conn.open) retry(); }, 12000);
    conn.on("open", () => {
      clearTimeout(timeout);
      everConnected = true;
      status("ok");
      conn.send({ t: "hello", pid: h.me, profile: h.profile(), key: deviceKey });
    });
    conn.on("data", (d) => {
      if (d && (d.t === "closed" || d.t === "kicked" || d.t === "left")) { wanted = false; setTimeout(stop, 100); }
      h.onMessage(d);
    });
    conn.on("close", () => { if (wanted) retry(); });
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
      if (msg.t === "leave") { closeRoom(); setTimeout(() => h.onMessage({ t: "left" }), 0); return; }
      hub.handle(h.me, msg);
    } else if (role === "client" && conn && conn.open) {
      conn.send(msg);
      if (msg.t === "leave") { wanted = false; setTimeout(stop, 300); }
    } else if (role === "client" && msg.t === "leave") {
      stop(); h.onMessage({ t: "left" });
    } else h.onMessage({ t: "error", text: "Нет связи с комнатой… переподключаюсь" });
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

  return Object.assign(h, { host, join, send, stop, loadSnapshot, isHost: () => role === "host", code: () => code, _hub: () => hub });
})();
