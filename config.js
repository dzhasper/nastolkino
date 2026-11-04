/* Налаштування — змініть під себе після створення бота.
   bot:      ім’я бота без @ (наприклад "nastolkino_bot") — для посилань-запрошень
   miniapp:  коротке ім’я Mini App з @BotFather → /newapp (наприклад "play") — запрошення відкриє гру одразу в кімнаті
   api:      адреса свого сервера Cloudflare (ВСТАНОВЛЕННЯ.md), наприклад "https://nastolkino.ім’я.workers.dev" —
             потрібна для улюбленців, промокодів і монет на сервері. Порожньо — усе працює як раніше, без улюбленців
   peer:     свій сервер зустрічей PeerJS (не обов’язково; за замовчуванням безплатний публічний 0.peerjs.com) */
window.APP_CONFIG = {
  app: "Настолкіно",
  bot: "nastolkino_bot",
  miniapp: "play",
  api: "https://nastolkino.nastolkino-server.workers.dev",
  peer: null,
};
