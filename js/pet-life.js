/* Жизнь питомца: что он делает прямо сейчас (спит, гоняется за хвостом, икает…), игрушки, приколы на голову, подарки, задания.
   Занятие выбирается по генам и времени — у одного питомца оно одинаковое на любом телефоне в эти 15 минут. */
"use strict";

// занятие: cls — анимация тела, prop — предмет рядом, fx — частицы вокруг, text — реплика в облачке, short — подпись в списке
const mkAct = (cls, prop, fx, text, short, extra) => Object.assign({ cls, prop, fx, text, short }, extra || {});
const HOBBY_ACT = [
  mkAct("act-toy", "🔘", "sparkle", "перебираю пуговицы…", "перебирает пуговицы"), mkAct("act-stare", "🪟", "rain", "кап-кап…", "смотрит на дождь"),
  mkAct("act-stare", "🔭", "stars", "…сорок один, сорок два…", "считает звёзды"), mkAct("act-hop", "🍞", "crumbs", "ещё этаж!", "строит башню из крошек"),
  mkAct("act-pounce", "🧦", "dust", "попался, носок!", "охотится на носок"), mkAct("act-sing", "🎤", "notes", "♪ ля-ля-ля ♪", "поёт"),
  mkAct("act-roll", "", "dust", "вжу-у-ух!", "катается по полу"), mkAct("act-box", "📦", "question", "меня тут нет", "сидит в коробке"),
  mkAct("act-sniff", "🌸", "petals", "м-м-м, цветочек", "нюхает цветок"), mkAct("act-chew", "✏️", "crumbs", "хрум-хрум", "грызёт карандаш"),
  mkAct("act-tick", "⏰", "tick", "тик-так…", "слушает часы"), mkAct("act-hop", "", "dust", "пылинка!", "гоняет пылинки"),
  mkAct("act-sleep", "⌨️", "zzz", "фффффффф…", "спит на клавиатуре", { sleep: true }), mkAct("act-toy", "🍬", "sparkle", "ещё фантик в коллекцию!", "собирает фантики"),
  mkAct("act-paint", "🖼", "paint", "шедевр!", "рисует лапой"), mkAct("act-pounce", "👤", "anger", "БУ!", "пугает тени"),
  mkAct("act-blow", "", "bubbles", "буль-буль-буль", "пускает пузыри"), mkAct("act-dance", "📻", "notes", "♪ туц-туц ♪", "танцует"),
  mkAct("act-pounce", "", "butterfly", "стой, бабочка!", "ловит бабочку"), mkAct("act-float", "", "sparkle", "оммм…", "медитирует"),
  mkAct("act-toy", "🪨", "dust", "этот — самый красивый", "собирает камушки"), mkAct("act-dig", "🕳", "dirt", "копаю-копаю", "копает ямку"),
  mkAct("act-sleep", "🧦", "zzz", "уютное гнёздышко…", "дремлет в гнезде из носков", { sleep: true }), mkAct("act-pounce", "", "sun", "зайчик!", "ловит солнечного зайчика"),
  mkAct("act-sing", "🦜", "echo", "кукареку! мяу! гав!", "подражает звукам"), mkAct("act-stare", "📺", "tv", "ха-ха-ха!", "смотрит мультики"),
  mkAct("act-juggle", "🥜", "nuts", "оп-оп-оп!", "жонглирует орешками"), mkAct("act-swing", "🪟", "", "ииии-ха!", "качается на шторах"),
  mkAct("act-write", "📜", "hearts", "о хозяин, ты прекрасен…", "сочиняет стихи"), mkAct("act-guard", "🥣", "anger", "это МОЯ миска", "охраняет миску"),
  mkAct("act-stare", "🔭", "stars", "там Большая Медведица", "изучает небо"), mkAct("act-face", "🪞", "laugh", "бе-бе-бе!", "строит рожицы"),
];
const QUIRK_ACT = [
  mkAct("act-shake", "", "sneeze", "апчхи!", "чихает от радости"), mkAct("act-scared", "🥒", "sweat", "А-А-А! ОГУРЕЦ!", "испугался огурца"),
  mkAct("act-sleep", "", "snore", "ХРРР… ХРРР…", "храпит", { sleep: true }), mkAct("act-grumpy", "⏰", "anger", "бесит этот будильник", "ворчит на будильник"),
  mkAct("act-belly", "", "hearts", "почеши пузико!", "подставляет пузико"), mkAct("act-shake", "", "anger", "только не уши!", "прячет уши"),
  mkAct("act-sleep", "", "zzz", "уснул на ровном месте…", "внезапно уснул", { sleep: true }), mkAct("act-grumpy", "📱", "anger", "опять в телефоне?", "ревнует к телефону"),
  mkAct("act-hop", "🎁", "sparkle", "я тебе кое-что принёс!", "несёт подарок"), mkAct("act-stare", "", "dots", "…", "смотрит в одну точку"),
  mkAct("act-hiccup", "", "hic", "ик!", "икает"), mkAct("act-wave", "🧊", "cold", "привет, холодильник!", "здоровается с холодильником"),
  mkAct("act-sleep", "", "mumble", "бу-бу-бу… мои печеньки…", "бормочет во сне", { sleep: true }), mkAct("act-scared", "🌀", "sweat", "ПЫЛЕСОС!!!", "прячется от пылесоса"),
  mkAct("act-shake", "", "sneeze", "а-а-апчхи!", "чихает от пыли"), mkAct("act-back", "", "dust", "так тоже можно", "ходит задом наперёд"),
  mkAct("act-sneak", "🍖", "question", "это на потом…", "прячет еду"), mkAct("act-sleep", "🧸", "zzz", "мой мишка…", "спит в обнимку", { sleep: true }),
  mkAct("act-bark", "📮", "anger", "ГАВ! ГАВ!", "лает на почтальона"), mkAct("act-sneak", "🧦", "sparkle", "твой носок теперь мой", "таскает носки"),
  mkAct("act-face", "🪞", "laugh", "какой я красивый", "кривляется у зеркала"), mkAct("act-purr", "", "hearts", "мррр-мррр…", "мурчит"),
  mkAct("act-scared", "⛈", "sweat", "гром!..", "боится грозы"), mkAct("act-sleep", "🐑", "sheep", "одна овечка… две…", "считает овечек", { sleep: true }),
];
// обычные занятия, которые бывают у любого питомца
const IDLE_ACT = [
  mkAct("act-blow", "", "bubbles", "буль!", "пускает пузыри"), mkAct("act-yawn", "", "", "ааауф…", "зевает"), mkAct("act-dance", "", "notes", "♪", "пританцовывает"),
  mkAct("act-pounce", "", "butterfly", "бабочка!", "гонится за бабочкой"), mkAct("act-shake", "", "dust", "чешусь-чешусь", "чешется"), mkAct("act-float", "", "sparkle", "я лёгкий, как пёрышко", "парит в мечтах"),
  mkAct("act-spin", "", "stars", "уиии!", "кружится"), mkAct("act-wave", "", "hearts", "привет!", "машет лапкой"), mkAct("act-sleep", "", "zzz", "Zzz…", "задремал", { sleep: true }),
  mkAct("act-stare", "", "fly", "муха…", "следит за мухой"), mkAct("act-hop", "", "", "прыг-скок!", "прыгает"), mkAct("act-yawn", "", "", "м-м-м, потянусь", "потягивается"),
  mkAct("act-purr", "", "notes", "мр-мр-мр", "мурлычет"), mkAct("act-float", "", "thought", "а что, если…", "мечтает"), mkAct("act-face", "", "laugh", "хи-хи", "хихикает"),
];
const toyOf = (k) => Pets.TOYS.find((x) => x[0] === k);
const mskHour = (t) => Math.floor((t / 3600 + 3) % 24);
const ACT_SLOT = 90;                                                       // занятие меняется каждые полторы минуты

// что питомец делает прямо сейчас: одинаково на любом телефоне в эти полторы минуты
function petActivity(p, t = petNow()) {
  const tr = Pets.traits(p.dna), sl = Pets.sleepState(p.dna, t), slot = Math.floor(t / ACT_SLOT);
  const b = (i) => parseInt(p.dna.slice(i * 2, i * 2 + 2), 16) || 0, h = (b(0) * 31 + slot * 17 + b(1) * 7) % 100, k = (b(2) + slot * 13) % 1000;
  if (p.den) return mkAct("act-sleep", "🏠", "zzz", "сплю в домике…", "спит в домике", { sleep: true, note: "в домике голодает вчетверо медленнее" });
  if (sl.asleep) return Object.assign(mkAct("act-sleep", "", tr.quirkIdx === 2 ? "snore" : tr.quirkIdx === 23 ? "sheep" : tr.quirkIdx === 12 ? "mumble" : "zzz",
    tr.quirkIdx === 2 ? "ХРРР… ХРРР…" : tr.quirkIdx === 12 ? "бу-бу-бу…" : "Zzz…", "спит"), { sleep: true, note: `${tr.chrono.name}: спит до ${sl.wake}:00` });
  if (tr.quirkIdx === 6 && h < 25) return QUIRK_ACT[6];
  if (p.toy && p.toy_at && t - p.toy_at < 1800 && toyOf(p.toy)) return mkAct("act-toy", toyOf(p.toy)[2], "sparkle", "моя " + toyOf(p.toy)[1].toLowerCase() + "!", "играет: " + toyOf(p.toy)[1].toLowerCase());
  if (p.fed_at && t - p.fed_at < 600) return tr.quirkIdx === 10 ? QUIRK_ACT[10] : mkAct("act-chew", "🍽", "crumbs", "ням-ням-ням", "ест");
  if (p.gift) return QUIRK_ACT[8];
  if (!tr.immortal && p.hunger != null && p.hunger < 25) return mkAct("act-hungry", "🥣", "question", "покорми меня…", "голодный!");
  if (p.mood != null && p.mood < 20) return mkAct("act-sad", "", "rain", "мне грустно…", "грустит");
  if (tr.quirkIdx === 3 && [7, 8].includes(mskHour(t))) return QUIRK_ACT[3];
  const r = (h + slot) % 10;                                               // хобби и странность видно часто, обычные занятия — между ними
  if (r < 4) return HOBBY_ACT[tr.hobbyIdx];
  if (r < 6) return QUIRK_ACT[tr.quirkIdx];
  if (r < 7 && p.mood > 75) return mkAct("act-hop", "", "hearts", "я счастлив!", "радуется");
  if (r < 8) return h < 50 ? mkAct("act-chase", "", "dust", "где мой хвост?!", "гоняется за хвостом") : IDLE_ACT[k % IDLE_ACT.length];
  return IDLE_ACT[k % IDLE_ACT.length];
}

// частицы вокруг питомца
const PFX = { zzz: ["z", "z", "Z"], snore: ["Х", "Р", "Р"], sheep: ["🐑", "🐑", "🐑"], mumble: ["бу", "бу", "…"], notes: ["♪", "♫", "♪"], bubbles: ["○", "◦", "○"],
  hearts: ["❤", "❤", "❤"], stars: ["★", "✦", "★"], sparkle: ["✦", "✧", "✦"], petals: ["🌸", "✿", "🌸"], rain: ["|", "|", "|"], dust: ["·", "∙", "·"], crumbs: ["·", "·", "·"],
  sweat: ["💧", "💧"], anger: ["💢"], question: ["?"], thought: ["💭"], tick: ["тик", "так"], sneeze: ["апчхи!"], hic: ["ик!"], cold: ["❄", "❄"], paint: ["●", "●", "●"],
  butterfly: ["🦋"], fly: ["•"], dots: ["·", "·", "·"], dirt: ["▪", "▪", "▪"], sun: ["☀"], echo: ["♪", "!", "?"], tv: ["ха", "ха"], nuts: ["●", "●", "●"], laugh: ["ха", "хи", "ха"] };
const pfxHtml = (fx) => (fx && PFX[fx] ? `<span class="pfx pfx-${fx}">${PFX[fx].map((c, i) => `<i style="--i:${i}">${c}</i>`).join("")}</span>` : "");

// сцена питомца с занятием
function petStageHtml(p, size = 190) {
  const a = petActivity(p);
  return `<div class="pet-stage r${p.rarity}" data-a="pet-pet" id="pet-stage">
    <div class="pet-act ${a.cls}">${Pets.sprite(petCode(p), size, { sleep: !!a.sleep })}${a.prop ? `<span class="pet-prop">${a.prop}</span>` : ""}${pfxHtml(a.fx)}</div>
    ${a.text ? `<div class="pet-bubble">${esc(a.text)}</div>` : ""}${a.note ? `<div class="pet-note">${esc(a.note)}</div>` : ""}<div class="pet-fx" id="pet-fx"></div></div>`;
}
// маленькая живая картинка для списка
function petMiniHtml(p, size = 80) {
  const a = petActivity(p);
  return `<span class="pet-live"><span class="pet-act mini ${a.cls}">${Pets.sprite(petCode(p), size, { sleep: !!a.sleep })}${a.prop ? `<span class="pet-prop">${a.prop}</span>` : ""}${pfxHtml(a.fx)}</span></span>
    <span class="pet-doing">${esc(a.short || "")}</span>`;
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

/* ---------------------------------------------------------------- уход за всеми: сцена кормления
   Любимая еда — только если игрок её уже узнал и она есть в кладовке. Иначе — случайная (нелюбимую, если знаем, не даём). */
function carePlan() {
  const st = Api.state, food = Object.assign({}, st.food || {}), foods = st.foods || {};
  const okFood = (k) => food[k] > 0 && foods[k] && ["food", "treat"].includes(foods[k].cat);
  const rows = st.pets.filter((p) => p.alive && !p.egg).map(petLive).sort((a, b) => a.hunger - b.hunger).map((p) => {
    const t = Pets.traits(p.dna), k = petKnow(p.id);
    if (p.den) return { p, mode: "den" };
    if (t.immortal) return { p, mode: "imm" };
    if (p.hunger >= 90) return { p, mode: "full" };
    let item = null, mode = "rand";
    if (k.fav && okFood(t.fav)) { item = t.fav; mode = "fav"; }
    else { const list = Object.keys(food).filter((x) => okFood(x) && !(k.dis && x === t.dis)); if (list.length) item = list[Math.floor(Math.random() * list.length)]; }
    if (!item) return { p, mode: "none" };
    food[item]--;
    return { p, item, mode };
  });
  return rows;
}
function careScene() {
  const c = S.care, n = c.rows.filter((r) => r.item).length;
  const cell = (r, i) => {
    const shown = c.phase !== "plan" && i < c.shown, res = r.res || {}, t = Pets.traits(r.p.dna);
    const tag = r.mode === "fav" ? "⭐ любимое" : r.mode === "rand" ? "🎲 наугад" : r.mode === "full" ? "😌 сыт" : r.mode === "imm" ? "♾️ не ест" : r.mode === "den" ? "🏠 спит" : "🚫 нет еды";
    const react = !shown ? "" : res.error ? "✋" : res.reaction === "fav" ? "😍" : res.reaction === "dis" ? "🤢" : res.reaction ? "😋" : "";
    const say = !shown ? "" : res.error ? esc(res.error) : res.reaction === "fav" ? "обожает это!" : res.reaction === "dis" ? "фу, не любит" : res.reaction ? (res.stash ? "припрятал на потом" : "ням!") : r.mode === "full" ? "уже сыт" : r.mode === "den" ? "спит в домике" : r.mode === "imm" ? "ему еда не нужна" : "";
    return `<div class="care-cell ${shown ? "go" : ""} ${shown && r.item && !res.error ? "eat" : ""}">
      <span class="care-food">${r.item ? Pets.FOOD_EMOJI[r.item] || "🍽" : ""}</span>
      <span class="pet-act ${shown && r.item && !res.error ? "act-chew" : r.mode === "den" ? "act-sleep" : ""}">${Pets.sprite(petCode(r.p), 64, { sleep: r.mode === "den" })}</span>
      ${react ? `<span class="care-react">${react}</span>` : ""}${shown && r.petted ? `<span class="care-heart">❤</span>` : ""}
      <span class="care-bowl">🥣</span><b>${esc(t.name)}</b><span class="small muted">${shown && say ? say : r.item ? `${tag} · ${esc(petFood(r.item).name)}` : tag}</span></div>`;
  };
  const head = c.phase === "plan" ? `<div class="small">Кому что достанется: ⭐ — любимая еда (если ты её уже узнал и она есть в кладовке), 🎲 — случайная из кладовки.</div>`
    : c.phase === "run" ? `<div class="small">Кормим… ${Math.min(c.shown, c.rows.length)}/${c.rows.length}</div>`
    : `<div class="small"><b>Готово!</b> Накормлено: ${c.rows.filter((r) => r.res && r.res.reaction).length}, поглажено: ${c.rows.filter((r) => r.petted).length}${c.found.length ? `. Узнал любимую еду: ${c.found.map(esc).join(", ")}` : ""}</div>`;
  return `<div class="card care-head"><div class="q-head">🤲 Уход за всеми</div>${head}</div>
    <div class="care-grid">${c.rows.map(cell).join("")}</div>
    ${c.phase === "plan" ? `<button class="btn mt2" data-a="care-go" ${n ? "" : "disabled"}>${n ? `🍽 Покормить (${n}) и погладить` : "Некого кормить или нет еды"}</button>
      <button class="btn ghost mt" data-a="care-reroll">🎲 Перемешать случайную еду</button>` : ""}
    ${c.phase === "done" || c.phase === "plan" ? `<button class="btn ghost mt" data-a="care-close">← К питомцам</button>` : ""}
    ${c.phase === "plan" && !Object.keys(Api.state.food || {}).length ? `<div class="small muted mt center">Кладовка пуста — еда продаётся во вкладке «🛒 Лавка» (оптом ×10 со скидкой)</div>` : ""}`;
}
function careReveal() {
  const c = S.care;
  if (!c || c.phase !== "run") return;
  c.shown++;
  const r = c.rows[c.shown - 1];
  if (r && r.res && r.res.reaction) haptic(r.res.reaction === "fav" ? "medium" : "light");
  if (c.shown >= c.rows.length) { c.phase = "done"; notify("success"); saveProfile(); }
  if (S.screen === "pets" && S.care === c) render();
  if (c.phase === "run") setTimeout(careReveal, 650);
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
  "care-open": () => { S.care = { phase: "plan", rows: carePlan(), shown: 0, found: [] }; haptic(); render(); window.scrollTo(0, 0); },
  "care-reroll": () => { S.care.rows = carePlan(); haptic(); render(); },
  "care-close": () => { S.care = null; render(); },
  "care-go": () => {
    const c = S.care; if (!c || c.phase !== "plan") return;
    c.phase = "run"; c.shown = 0; render();
    Api.act("/api/pet/careall", { plan: c.rows.filter((r) => r.item).map((r) => ({ pet: r.p.id, item: r.item })) }).then((st) => {
      const fed = st.care.fed, petted = st.care.petted.map((x) => x.pet);
      c.rows.forEach((r) => {
        r.res = fed.find((x) => x.pet === r.p.id) || null; r.petted = petted.includes(r.p.id);
        const k = petKnow(r.p.id);
        if (r.res && r.res.reaction === "fav" && !k.fav) { k.fav = 1; c.found.push(Pets.traits(r.p.dna).name + " — " + petFood(r.item).name); }
        if (r.res && r.res.reaction === "dis") k.dis = 1;
      });
      setTimeout(careReveal, 300);
    }).catch((e) => { c.phase = "plan"; petErr(e); render(); });
  },
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
