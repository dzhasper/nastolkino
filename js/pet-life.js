/* Жизнь питомца: что он делает прямо сейчас (спит, гоняется за хвостом, икает…), игрушки, приколы на голову, подарки, задания.
   Занятие выбирается по генам и времени — у одного питомца оно одинаковое на любом телефоне в эти 15 минут. */
"use strict";

const HOBBY_ACT = [
  { prop: "🔘", cls: "act-toy", text: "перебирает пуговицы" }, { prop: "🌧", cls: "act-stare", text: "смотрит на дождь" },
  { prop: "✨", cls: "act-stare", text: "считает звёзды: …41, 42…" }, { prop: "🍞", cls: "act-hop", text: "строит башню из крошек" },
  { prop: "🧦", cls: "act-pounce", text: "охотится на носок!" }, { prop: "🎵", cls: "act-sing", text: "♪ ля-ля-ля ♪" },
  { prop: "", cls: "act-roll", text: "катается по полу" }, { prop: "📦", cls: "act-box", text: "спрятался в коробку" },
  { prop: "🌸", cls: "act-stare", text: "нюхает цветочек" }, { prop: "✏️", cls: "act-chew", text: "грызёт карандаш" },
  { prop: "⏰", cls: "act-stare", text: "тик-так… тик-так…" }, { prop: "·", cls: "act-hop", text: "гоняет пылинки" },
  { prop: "⌨️", cls: "act-sleep", text: "уснул на клавиатуре… ffffffff", sleep: true }, { prop: "🍬", cls: "act-toy", text: "собирает фантики" },
  { prop: "🖐", cls: "act-paint", text: "рисует лапой на стекле" }, { prop: "👤", cls: "act-pounce", text: "пугает тени: БУ!" },
];
const QUIRK_ACT = [
  { cls: "act-shake", text: "апчхи! 🤧" }, { prop: "🥒", cls: "act-scared", text: "А-А-А! ОГУРЕЦ!" }, null,
  { prop: "⏰", cls: "act-grumpy", text: "бесит этот будильник 💢" }, { cls: "act-roll", text: "почеши пузико!" },
  { cls: "act-shake", text: "только не уши!" }, null, { prop: "📱", cls: "act-grumpy", text: "опять в телефоне сидишь?" },
  { prop: "🎁", cls: "act-hop", text: "я тебе кое-что принёс!" }, { cls: "act-stare", text: "…" },
  { cls: "act-hiccup", text: "ик!" }, { prop: "🧊", cls: "act-wave", text: "привет, холодильник!" },
];
const toyOf = (k) => Pets.TOYS.find((x) => x[0] === k);
const mskHour = (t) => Math.floor((t / 3600 + 3) % 24);

function petActivity(p, t = petNow()) {
  const tr = Pets.traits(p.dna), sl = Pets.sleepState(p.dna, t);
  const slot = Math.floor(t / 900), h = (parseInt(p.dna.slice(0, 2), 16) * 31 + slot * 17 + parseInt(p.dna.slice(2, 4), 16)) % 100;
  if (p.den) return { key: "den", sleep: true, cls: "act-sleep", prop: "🏠", text: "спит в домике… Zzz", note: "в домике почти не голодает" };
  if (sl.asleep) return { key: "sleep", sleep: true, cls: "act-sleep", prop: "", text: tr.quirkIdx === 2 ? "ХРРР… ХРРР…" : "Zzz…", note: `${tr.chrono.name}: спит до ${sl.wake}:00` };
  if (tr.quirkIdx === 6 && h < 30) return { key: "nap", sleep: true, cls: "act-sleep", prop: "", text: "уснул на ровном месте… Zzz" };
  if (p.toy && p.toy_at && t - p.toy_at < 1800 && toyOf(p.toy)) return { key: "toy", cls: "act-toy", prop: toyOf(p.toy)[2], text: "играет: " + toyOf(p.toy)[1].toLowerCase() };
  if (tr.quirkIdx === 10 && p.fed_at && t - p.fed_at < 1200) return Object.assign({ key: "hiccup" }, QUIRK_ACT[10]);
  if (p.gift) return Object.assign({ key: "gift" }, QUIRK_ACT[8]);
  if (tr.quirkIdx === 3 && [7, 8].includes(mskHour(t))) return Object.assign({ key: "grumpy" }, QUIRK_ACT[3]);
  if (h < 12) return { key: "chase", cls: "act-chase", prop: "", text: "где мой хвост?!" };
  if (h < 55) return Object.assign({ key: "hobby" }, HOBBY_ACT[tr.hobbyIdx]);
  if (h < 75 && QUIRK_ACT[tr.quirkIdx]) return Object.assign({ key: "quirk" }, QUIRK_ACT[tr.quirkIdx]);
  return { key: "idle", cls: "", prop: "", text: "" };
}

// сцена питомца с занятием
function petStageHtml(p, size = 190) {
  const a = petActivity(p);
  return `<div class="pet-stage r${p.rarity}" data-a="pet-pet" id="pet-stage">
    <div class="pet-act ${a.cls}">${Pets.sprite(petCode(p), size, { sleep: !!a.sleep })}${a.prop ? `<span class="pet-prop">${a.prop}</span>` : ""}${a.sleep ? `<span class="pet-zzz">z<i>z</i><b>Z</b></span>` : ""}</div>
    ${a.text ? `<div class="pet-bubble">${esc(a.text)}</div>` : ""}${a.note ? `<div class="pet-note">${esc(a.note)}</div>` : ""}<div class="pet-fx" id="pet-fx"></div></div>`;
}

function petLifeBlock(p, t) {
  const tp = t.toys, k = petKnow(p.id), inv = (Api.state && Api.state.inv) || [];
  const toys = inv.filter((x) => x.startsWith("toy:")).map((x) => toyOf(x.slice(4))).filter(Boolean);
  const hats = inv.filter((x) => x.startsWith("hat:"));
  const mode = { one: "однолюб — играет только с одной любимой игрушкой", easy: "неприхотлив — рад любой игрушке", some: "любит разнообразие — одна и та же быстро надоедает", lots: "очень любит разнообразие — нужно много разных игрушек" }[tp.mode];
  const fav = toyOf(tp.fav);
  return `<div class="section-title">Фишки</div>
    <div class="card perks">${t.perks.map((x) => `<div class="perk"><span class="pe">${x.emoji}</span><div><b>${esc(x.name)}</b><div class="small muted">${esc(x.desc)}</div></div></div>`).join("")}
      <div class="perk"><span class="pe">${t.chrono.key === "owl" ? "🦉" : t.chrono.key === "lark" ? "🐓" : "🌗"}</span><div><b>${esc(t.chrono.name)}</b><div class="small muted">${esc(t.chrono.desc)}${t.chrono.key !== "any" ? ". Спящий питомец не дерётся" : ""}</div></div></div></div>
    <div class="section-title">Игрушки</div>
    <div class="card"><div class="small">🧸 ${esc(mode)}</div>
      <div class="small mt"><span class="muted">Любимая:</span> ${k.toyFav ? `${fav[2]} ${esc(fav[1])}` : "??? — узнаешь, когда он её выберет"}</div>
      <div class="small"><span class="muted">Не возьмёт:</span> ${(k.toyNo || []).length ? k.toyNo.map((x) => { const o = toyOf(x); return o ? o[2] + " " + esc(o[1]) : ""; }).join(", ") : "???"}</div>
      <div class="small mt">${toys.length ? `Твои игрушки: ${toys.map((o) => o[2]).join(" ")}` : `<span class="muted">Игрушек нет — их выбивают только из кейса «Питомник»</span>`}</div>
      <div class="row mt case-btns"><button class="btn small" data-a="pet-play" ${toys.length ? "" : "disabled"}>🎾 Поиграть</button>
        <button class="btn ghost small" data-a="pet-hat-open">🎩 ${p.hat ? "Прикол: " + esc((Pets.HATS.find((h) => h[0] === p.hat) || [])[1] || "") : hats.length ? "Надеть прикол" : "Приколов нет"}</button>
        ${p.gift ? `<button class="btn small" data-a="pet-gift">🎁 Что он принёс?</button>` : ""}</div>
      <div class="small muted mt">Питомец сам выбирает, во что играть. Нелюбимое не возьмёт, а без разнообразия заскучает.</div></div>`;
}

function petHatSheet() {
  const p = Api.state && Api.state.pets.find((x) => x.id === S.petSel);
  if (!p) return "";
  const hats = (Api.state.inv || []).filter((x) => x.startsWith("hat:")).map((x) => x.slice(4));
  const base = p.rarity + p.dna;
  return `<h2>🎩 Приколы на голову</h2><p class="muted small">Выбиваются из кейса «Питомник». Один прикол — на одном питомце.</p>
    ${hats.length ? `<div class="pick-grid">${hats.map((h) => `<button class="pick ${p.hat === h ? "on" : ""}" data-a="pet-hat-set" data-v="${h}">${Pets.sprite(base + "-" + h, 64)}
      <span>${esc((Pets.HATS.find((x) => x[0] === h) || [])[1] || h)}</span></button>`).join("")}</div>` : `<div class="card muted small">Приколов пока нет</div>`}
    ${p.hat ? `<button class="btn ghost mt" data-a="pet-hat-set" data-v="">Снять прикол</button>` : ""}`;
}

/* ---------------------------------------------------------------- ежедневные задания */
const QUEST_TEXT = { feed: "Покорми питомца", pet: "Погладь питомца", play: "Поиграй с питомцем", case: "Открой любой кейс", battle: "Сразись в бою питомцев", buy: "Купи что-нибудь в лавке" };
function questsCard() {
  const q = Api.state && Api.state.quests;
  if (!q) return "";
  const all = q.list.every((x) => x.claimed);
  return `<div class="card quests"><div class="q-head">📋 Задания на сегодня</div>
    ${q.list.map((x) => { const done = x.have >= x.need;
      return `<div class="q-row ${x.claimed ? "claimed" : ""}"><div class="grow"><b>${QUEST_TEXT[x.key] || x.key}</b>${x.need > 1 ? ` <span class="muted small">${Math.min(x.have, x.need)}/${x.need}</span>` : ""}
        ${bar(Math.min(1, x.have / x.need) * 100, "mood")}</div>${x.claimed ? `<span class="win-tag">✓</span>` : `<button class="btn small" data-a="quest-claim" data-v="${x.key}" ${done ? "" : "disabled"}>🪙 ${x.coins}</button>`}</div>`; }).join("")}
    <div class="q-row bonus"><div class="grow small">Все три — бонус</div>${q.bonus ? `<span class="win-tag">✓</span>` : `<button class="btn small" data-a="quest-claim" data-v="bonus" ${all ? "" : "disabled"}>🪙 ${q.bonusCoins}</button>`}</div></div>`;
}

const JUNK = ["фантик", "пуговицу", "крышку от бутылки", "сухой листик", "один носок", "камешек", "скрепку", "перо голубя"];
const LIFE_ACTIONS = {
  "pet-play": () => {
    const p = Api.state.pets.find((x) => x.id === S.petSel);
    if (!p) return;
    const t = Pets.traits(p.dna);
    haptic();
    Api.act("/api/pet/play", { pet: p.id }).then((st) => {
      const r = st.play, o = r.toy ? toyOf(r.toy) : null, k = petKnow(p.id);
      if (r.reaction === "fav") { k.toyFav = 1; notify("success"); toast(`${t.name} схватил ${o[1].toLowerCase()} — это его любимая! ❤`); petFx("❤"); }
      else if (r.reaction === "ok") { toast(`${t.name} выбрал: ${o[2]} ${o[1].toLowerCase()}`); petFx("✨"); }
      else if (r.reaction === "seek") toast(`${t.name} обнюхал игрушки и отвернулся: он однолюб и ищет свою единственную любимую`);
      else if (r.reaction === "bored") toast(`${t.name} зевает: эти игрушки ему надоели — нужно больше разных`);
      else if (r.reaction === "scared") { k.toyNo = [...new Set([...(k.toyNo || []), "cucumber"])]; notify("error"); toast(`${t.name} увидел огурец и в ужасе подпрыгнул! 🥒😱`); }
      else { const no = Pets.toyPrefs(p.dna).dislikes.filter((x) => (Api.state.inv || []).includes("toy:" + x)); k.toyNo = [...new Set([...(k.toyNo || []), ...no])]; toast(`${t.name} фыркнул: ни одна из твоих игрушек ему не нравится`); }
      saveProfile(); render();
    }).catch(petErr);
  },
  "pet-hat-open": () => { S.sheet = { type: "pet-hat" }; renderOverlay(); },
  "pet-hat-set": (h) => Api.act("/api/pet/hat", { pet: S.petSel, hat: h || null }).then(() => { S.sheet = null; renderOverlay(); syncProfile(); haptic("medium"); render(); }).catch(petErr),
  "pet-gift": () => Api.act("/api/pet/gift", { pet: S.petSel }).then((st) => {
    const g = st.gift;
    if (g.kind === "junk") toast(`Он принёс тебе ${JUNK[g.value] || "что-то"}. Спасибо… наверное 😅`);
    else if (g.kind === "coins") { coinRain(); toast(`Он притащил ${g.value} монет! 🪙`); }
    else toast(`Он принёс еду: ${Pets.FOOD_EMOJI[g.value] || "🍖"} ${petFood(g.value).name}`);
    render();
  }).catch(petErr),
  "quest-claim": (k) => Api.act("/api/quest/claim", { key: k }).then((st) => { notify("success"); toast(`Награда: +${st.got} 🪙`); coinRain(); render(); }).catch(petErr),
};
