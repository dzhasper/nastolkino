/* Жизнь питомца: что он делает прямо сейчас (спит, гоняется за хвостом, икает…), игрушки, приколы на голову, подарки, задания.
   Занятие выбирается по генам и времени — у одного питомца оно одинаковое на любом телефоне в эти 15 минут. */
"use strict";

// занятие: cls — анимация тела, prop — предмет рядом, fx — частицы вокруг, text — реплика в облачке, short — подпись в списке
const mkAct = (cls, prop, fx, text, short, extra) => Object.assign({ cls, prop, fx, text, short }, extra || {});
const HOBBY_ACT = [
  mkAct("act-toy", "🔘", "sparkle", "перебираю ґудзики…", "перебирає ґудзики"), mkAct("act-stare", "🪟", "rain", "кап-кап…", "дивиться на дощ"),
  mkAct("act-stare", "🔭", "stars", "…сорок один, сорок два…", "рахує зірки"), mkAct("act-hop", "🍞", "crumbs", "ще поверх!", "будує вежу з крихт"),
  mkAct("act-pounce", "🧦", "dust", "попалася, шкарпетко!", "полює на шкарпетку"), mkAct("act-sing", "🎤", "notes", "♪ ля-ля-ля ♪", "співає"),
  mkAct("act-roll", "", "dust", "вжу-у-ух!", "катається по підлозі"), mkAct("act-box", "📦", "question", "мене тут немає", "сидить у коробці"),
  mkAct("act-sniff", "🌸", "petals", "м-м-м, квіточка", "нюхає квітку"), mkAct("act-chew", "✏️", "crumbs", "хрум-хрум", "гризе олівець"),
  mkAct("act-tick", "⏰", "tick", "тік-так…", "слухає годинник"), mkAct("act-hop", "", "dust", "порошинка!", "ганяє порошинки"),
  mkAct("act-sleep", "⌨️", "zzz", "фффффффф…", "спить на клавіатурі", { sleep: true }), mkAct("act-toy", "🍬", "sparkle", "ще фантик у колекцію!", "збирає фантики"),
  mkAct("act-paint", "🖼", "paint", "шедевр!", "малює лапою"), mkAct("act-pounce", "👤", "anger", "БУ!", "лякає тіні"),
  mkAct("act-blow", "", "bubbles", "буль-буль-буль", "пускає бульбашки"), mkAct("act-dance", "📻", "notes", "♪ туц-туц ♪", "танцює"),
  mkAct("act-pounce", "", "butterfly", "стій, метелику!", "ловить метелика"), mkAct("act-float", "", "sparkle", "оммм…", "медитує"),
  mkAct("act-toy", "🪨", "dust", "цей — найгарніший", "збирає камінці"), mkAct("act-dig", "🕳", "dirt", "копаю-копаю", "копає ямку"),
  mkAct("act-sleep", "🧦", "zzz", "затишне гніздечко…", "дрімає в гнізді зі шкарпеток", { sleep: true }), mkAct("act-pounce", "", "sun", "зайчик!", "ловить сонячного зайчика"),
  mkAct("act-sing", "🦜", "echo", "кукуріку! няв! гав!", "наслідує звуки"), mkAct("act-stare", "📺", "tv", "ха-ха-ха!", "дивиться мультики"),
  mkAct("act-juggle", "🥜", "nuts", "оп-оп-оп!", "жонглює горішками"), mkAct("act-swing", "🪟", "", "ііі-ха!", "гойдається на шторах"),
  mkAct("act-write", "📜", "hearts", "о господарю, ти чудовий…", "складає вірші"), mkAct("act-guard", "🥣", "anger", "це МОЯ миска", "охороняє миску"),
  mkAct("act-stare", "🔭", "stars", "там Велика Ведмедиця", "вивчає небо"), mkAct("act-face", "🪞", "laugh", "бе-бе-бе!", "корчить пики"),
];
const QUIRK_ACT = [
  mkAct("act-shake", "", "sneeze", "апчхи!", "чхає від радості"), mkAct("act-scared", "🥒", "sweat", "А-А-А! ОГІРОК!", "злякався огірка"),
  mkAct("act-sleep", "", "snore", "ХРРР… ХРРР…", "хропе", { sleep: true }), mkAct("act-grumpy", "⏰", "anger", "дратує цей будильник", "бурчить на будильник"),
  mkAct("act-belly", "", "hearts", "почухай пузико!", "підставляє пузико"), mkAct("act-shake", "", "anger", "тільки не вуха!", "ховає вуха"),
  mkAct("act-sleep", "", "zzz", "заснув на рівному місці…", "раптом заснув", { sleep: true }), mkAct("act-grumpy", "📱", "anger", "знову в телефоні?", "ревнує до телефона"),
  mkAct("act-hop", "🎁", "sparkle", "я тобі дещо приніс!", "несе подарунок"), mkAct("act-stare", "", "dots", "…", "дивиться в одну точку"),
  mkAct("act-hiccup", "", "hic", "ік!", "гикає"), mkAct("act-wave", "🧊", "cold", "привіт, холодильнику!", "вітається з холодильником"),
  mkAct("act-sleep", "", "mumble", "бу-бу-бу… моє печиво…", "бурмоче уві сні", { sleep: true }), mkAct("act-scared", "🌀", "sweat", "ПИЛОСОС!!!", "ховається від пилососа"),
  mkAct("act-shake", "", "sneeze", "а-а-апчхи!", "чхає від пилу"), mkAct("act-back", "", "dust", "так теж можна", "ходить задом наперед"),
  mkAct("act-sneak", "🍖", "question", "це на потім…", "ховає їжу"), mkAct("act-sleep", "🧸", "zzz", "мій ведмедик…", "спить в обіймах", { sleep: true }),
  mkAct("act-bark", "📮", "anger", "ГАВ! ГАВ!", "гавкає на листоношу"), mkAct("act-sneak", "🧦", "sparkle", "твоя шкарпетка тепер моя", "тягає шкарпетки"),
  mkAct("act-face", "🪞", "laugh", "який я гарний", "кривляється перед дзеркалом"), mkAct("act-purr", "", "hearts", "мррр-мррр…", "муркоче"),
  mkAct("act-scared", "⛈", "sweat", "грім!..", "боїться грози"), mkAct("act-sleep", "🐑", "sheep", "одна овечка… дві…", "рахує овечок", { sleep: true }),
];
// обычные занятия, которые бывают у любого питомца
const IDLE_ACT = [
  mkAct("act-blow", "", "bubbles", "буль!", "пускає бульбашки"), mkAct("act-yawn", "", "", "аааух…", "позіхає"), mkAct("act-dance", "", "notes", "♪", "пританцьовує"),
  mkAct("act-pounce", "", "butterfly", "метелик!", "женеться за метеликом"), mkAct("act-shake", "", "dust", "чухаюся-чухаюся", "чухається"), mkAct("act-float", "", "sparkle", "я легкий, як пір’їнка", "ширяє в мріях"),
  mkAct("act-spin", "", "stars", "уііі!", "кружляє"), mkAct("act-wave", "", "hearts", "привіт!", "махає лапкою"), mkAct("act-sleep", "", "zzz", "Zzz…", "задрімав", { sleep: true }),
  mkAct("act-stare", "", "fly", "муха…", "стежить за мухою"), mkAct("act-hop", "", "", "стриб-скок!", "стрибає"), mkAct("act-yawn", "", "", "м-м-м, потягнуся", "потягується"),
  mkAct("act-purr", "", "notes", "мр-мр-мр", "мурличе"), mkAct("act-float", "", "thought", "а що, як…", "мріє"), mkAct("act-face", "", "laugh", "хі-хі", "хихоче"),
];
const toyOf = (k) => Pets.TOYS.find((x) => x[0] === k);
const mskHour = (t) => Pets.kyivHour(t);                            // година за Києвом
const ACT_SLOT = 90;                                                       // занятие меняется каждые полторы минуты

// что питомец делает прямо сейчас: одинаково на любом телефоне в эти полторы минуты
function petActivity(p, t = petNow()) {
  const tr = Pets.traits(p.dna), sl = Pets.sleepState(p.dna, t), slot = Math.floor(t / ACT_SLOT);
  const b = (i) => parseInt(p.dna.slice(i * 2, i * 2 + 2), 16) || 0, h = (b(0) * 31 + slot * 17 + b(1) * 7) % 100, k = (b(2) + slot * 13) % 1000;
  if (p.den) return mkAct("act-sleep", "🏠", "zzz", "сплю в будиночку…", "спить у будиночку", { sleep: true, note: "у будиночку голодує вчетверо повільніше" });
  if (sl.asleep) return Object.assign(mkAct("act-sleep", "", tr.quirkIdx === 2 ? "snore" : tr.quirkIdx === 23 ? "sheep" : tr.quirkIdx === 12 ? "mumble" : "zzz",
    tr.quirkIdx === 2 ? "ХРРР… ХРРР…" : tr.quirkIdx === 12 ? "бу-бу-бу…" : "Zzz…", "спить"), { sleep: true, note: `${tr.chrono.name}: спить до ${sl.wake}:00` });
  if (tr.quirkIdx === 6 && h < 25) return QUIRK_ACT[6];
  if (p.toy && p.toy_at && t - p.toy_at < 1800 && toyOf(p.toy)) return mkAct("act-toy", toyOf(p.toy)[2], "sparkle", "моя " + toyOf(p.toy)[1].toLowerCase() + "!", "грається: " + toyOf(p.toy)[1].toLowerCase());
  if (p.holds && toyOf(p.holds) && h < 45) {                           // игрушка в лапах — не выпускает
    const o = toyOf(p.holds), line = [["моє!", "не віддає: "], ["не чіпай!", "охороняє: "], ["хрум-хрум", "гризе: "], ["нікому не дам", "пригортає до себе: "]][(slot + b(3)) % 4];
    return mkAct("act-toy", o[2], "sparkle", line[0], line[1] + o[1].toLowerCase());
  }
  if (p.fed_at && t - p.fed_at < 600) return tr.quirkIdx === 10 ? QUIRK_ACT[10] : mkAct("act-chew", "🍽", "crumbs", "ням-ням-ням", "їсть");
  if (p.gift) return QUIRK_ACT[8];
  if (!tr.immortal && p.hunger != null && p.hunger < 25) return mkAct("act-hungry", "🥣", "question", "нагодуй мене…", "голодний!");
  if (p.mood != null && p.mood < 20) return mkAct("act-sad", "", "rain", "мені сумно…", "сумує");
  if (tr.quirkIdx === 3 && [7, 8].includes(mskHour(t))) return QUIRK_ACT[3];
  const r = (h + slot) % 10;                                               // хобби и странность видно часто, обычные занятия — между ними
  if (r < 4) return HOBBY_ACT[tr.hobbyIdx];
  if (r < 6) return QUIRK_ACT[tr.quirkIdx];
  if (r < 7 && p.mood > 75) return mkAct("act-hop", "", "hearts", "я щасливий!", "радіє");
  if (r < 8) return h < 50 ? mkAct("act-chase", "", "dust", "де мій хвіст?!", "ганяється за хвостом") : IDLE_ACT[k % IDLE_ACT.length];
  return IDLE_ACT[k % IDLE_ACT.length];
}

// частицы вокруг питомца
const PFX = { zzz: ["z", "z", "Z"], snore: ["Х", "Р", "Р"], sheep: ["🐑", "🐑", "🐑"], mumble: ["бу", "бу", "…"], notes: ["♪", "♫", "♪"], bubbles: ["○", "◦", "○"],
  hearts: ["❤", "❤", "❤"], stars: ["★", "✦", "★"], sparkle: ["✦", "✧", "✦"], petals: ["🌸", "✿", "🌸"], rain: ["|", "|", "|"], dust: ["·", "∙", "·"], crumbs: ["·", "·", "·"],
  sweat: ["💧", "💧"], anger: ["💢"], question: ["?"], thought: ["💭"], tick: ["тік", "так"], sneeze: ["апчхи!"], hic: ["ік!"], cold: ["❄", "❄"], paint: ["●", "●", "●"],
  butterfly: ["🦋"], fly: ["•"], dots: ["·", "·", "·"], dirt: ["▪", "▪", "▪"], sun: ["☀"], echo: ["♪", "!", "?"], tv: ["ха", "ха"], nuts: ["●", "●", "●"], laugh: ["ха", "хі", "ха"] };
const pfxHtml = (fx) => (fx && PFX[fx] ? `<span class="pfx pfx-${fx}">${PFX[fx].map((c, i) => `<i style="--i:${i}">${c}</i>`).join("")}</span>` : "");

// сцена питомца с занятием
function petStageHtml(p, size = 190) {
  const a = petActivity(p);
  const lonely = !a.sleep && p.att != null && p.att < 25 && !p.den;              // дуется: тучка над головой, медленно покачивается
  return `<div class="pet-stage r${p.rarity} ${lonely ? "sulk" : ""}" data-a="pet-pet" id="pet-stage">${lonely ? '<span class="sulk-cloud">☁️<i>💧</i><i>💧</i></span>' : ""}
    <div class="pet-act ${a.cls}">${Pets.sprite(petCode(p), size, { sleep: !!a.sleep })}${a.prop ? `<span class="pet-prop">${a.prop}</span>` : ""}${pfxHtml(a.fx)}</div>
    ${a.text ? `<div class="pet-bubble">${esc(a.text)}</div>` : ""}${a.note ? `<div class="pet-note">${esc(a.note)}</div>` : ""}<div class="pet-fx" id="pet-fx"></div></div>`;
}
// маленькая живая картинка для списка
function petMiniHtml(p, size = 80) {
  const a = petActivity(p);
  return `<span class="pet-live"><span class="pet-act mini ${a.cls}">${Pets.sprite(petCode(p), size, { sleep: !!a.sleep })}${a.prop ? `<span class="pet-prop">${a.prop}</span>` : ""}${pfxHtml(a.fx)}</span></span>
    <span class="pet-doing">${esc(a.short || "")}</span>`;
}

/* ---------------------------------------------------------------- игрушки дома: копии, кто любит, у кого в лапах, под диваном */
const TOY_ACC = { ball: "м’ячик", mouse: "мишку", yarn: "клубок", bone: "кісточку", sock: "шкарпетку", bell: "дзвіночок", duck: "качечку", feather: "перо", frisbee: "фрисбі", box: "коробку",
  cucumber: "огірок", teddy: "ведмедика", yoyo: "йо-йо", kite: "змія", laser: "указку", rocket: "ракету" };
const homePets = () => ((Api.state && Api.state.pets) || []).filter((x) => x.alive && !x.egg);
function toyInfo(k) {
  const s = ((Api.state && Api.state.toys) || {})[k] || { n: 0, held: [], floor: 0, free: 0 }, pets = homePets();
  const lovers = pets.filter((x) => Pets.toyPrefs(x.dna).fav === k), haters = pets.filter((x) => Pets.toyPrefs(x.dna).dislikes.includes(k));
  return Object.assign({}, s, { lovers, haters, holders: s.held.map((id) => pets.find((x) => x.id === id)).filter(Boolean), short: Math.max(0, lovers.length - s.n) });
}
const petNm = (x) => (x ? Pets.name(x.dna) : "?");
function toyNews(limit = 4, petId) {
  const log = ((Api.state && Api.state.toylog) || []).filter((e) => !petId || e.pet === petId || e.other === petId).slice(0, limit);
  if (!log.length) return "";
  const ico = { snatch: "😤", repelled: "🛡", wait: "⏳", throw: "💢", tantrum: "💢", take: "🤫", share: "🤝", gave: "🤝", shelf: "📥", refuse: "🙅", drop: "📥", thrown: "💢" };
  return `<div class="toy-news">${log.map((e) => `<div class="tn ${e.kind}"><span>${ico[e.kind] || "🧸"}</span><div>${esc(e.text)}<i>${petAgo(e.ts)}</i></div></div>`).join("")}</div>`;
}
function petAgo(ts) { const d = Math.max(0, Math.floor(Date.now() / 1000 - ts)); return d < 90 ? "щойно" : d < 3600 ? Math.round(d / 60) + " хв тому" : d < 86400 ? Math.round(d / 3600) + " год тому" : Math.round(d / 86400) + " дн тому"; }
// под диваном: что туда зашвырнули
function toyFloorHtml() {
  const toys = (Api.state && Api.state.toys) || {}, under = Object.keys(toys).filter((k) => toys[k].floor > 0);
  return under.length ? `<div class="toy-floor">🛋 Під диваном: ${under.map((k) => `<button class="pill" data-a="toy-fetch" data-v="${k}">${(toyOf(k) || [])[2]} ${esc((toyOf(k) || [])[1] || k)}${toys[k].floor > 1 ? " ×" + toys[k].floor : ""} · дістати</button>`).join("")}</div>` : "";
}
// карточка в списке питомцев: новости игрушек и споры
function toysCard() {
  const toys = (Api.state && Api.state.toys) || {};
  if (!Object.keys(toys).length) return "";
  const fights = Object.keys(toys).map((k) => [k, toyInfo(k)]).filter(([, i]) => i.short > 0);
  const news = toyNews(3), floor = toyFloorHtml();
  if (!news && !floor && !fights.length) return "";
  return `<div class="card toys-card"><b>🧸 Іграшки</b>${fights.map(([k, i]) => `<div class="toy-fight">⚠️ ${(toyOf(k) || [])[2]} ${esc((toyOf(k) || [])[1])}: люблять ${i.lovers.map(petNm).map(esc).join(", ")}, а є ${i.n} — ділять і сваряться. Потрібна ще ${i.short}</div>`).join("")}
    ${news}${floor}</div>`;
}

function petLifeBlock(p, t) {
  const tp = t.toys, k = petKnow(p.id), inv = (Api.state && Api.state.inv) || [];
  const toys = inv.filter((x) => x.startsWith("toy:")).map((x) => toyOf(x.slice(4))).filter(Boolean);
  const hats = inv.filter((x) => x.startsWith("hat:"));
  const mode = { one: "однолюб — грається лише з однією улюбленою іграшкою", easy: "невибагливий — радий будь-якій іграшці", some: "любить різноманіття — та сама швидко набридає", lots: "дуже любить різноманіття — потрібно багато різних іграшок" }[tp.mode];
  const fav = toyOf(tp.fav);
  return `<div class="section-title">Фішки</div>
    <div class="card perks">${t.perks.map((x) => `<div class="perk"><span class="pe">${x.emoji}</span><div><b>${esc(x.name)}</b><div class="small muted">${esc(x.desc)}</div></div></div>`).join("")}
      <div class="perk"><span class="pe">${t.chrono.key === "owl" ? "🦉" : t.chrono.key === "lark" ? "🐓" : "🌗"}</span><div><b>${esc(t.chrono.name)}</b><div class="small muted">${esc(t.chrono.desc)}${t.chrono.key !== "any" ? ". Сплячий улюбленець не б’ється" : ""}</div></div></div></div>
    <div class="section-title">Іграшки</div>
    <div class="card"><div class="small">🧸 ${esc(mode)}</div>
      <div class="small mt"><span class="muted">Улюблена:</span> ${k.toyFav || inv.includes("toy:" + tp.fav) ? `${fav[2]} ${esc(fav[1])}` : "??? — дізнаєшся, коли він її обере"}</div>
      <div class="small"><span class="muted">Не візьме:</span> ${(k.toyNo || []).length ? k.toyNo.map((x) => { const o = toyOf(x); return o ? o[2] + " " + esc(o[1]) : ""; }).join(", ") : "???"}</div>
      <div class="small mt">${toys.length ? `Твої іграшки: ${toys.map((o) => { const i = toyInfo(o[0]); return o[2] + (i.n > 1 ? "×" + i.n : ""); }).join(" ")}` : `<span class="muted">Іграшок немає — їх вибивають лише з кейса «Розплідник»</span>`}</div>
      ${p.holds && toyOf(p.holds) ? (() => { const o = toyOf(p.holds), i = toyInfo(p.holds), want = i.lovers.filter((x) => x.id !== p.id && !i.held.includes(x.id));
        return `<div class="toy-hold"><span class="th-ico">${o[2]}</span><div class="grow"><b>У лапах: ${esc(o[1])}</b>${p.holds === tp.fav ? " ❤" : ""}
          ${want.length ? `<div class="small muted">Її теж любить ${want.map(petNm).map(esc).join(", ")} — ${i.free ? "є вільна копія" : "а копія одна"}</div>` : ""}</div></div>
          <div class="row case-btns"><button class="btn ghost small" data-a="toy-give-open">🤝 Віддати іншому</button><button class="btn ghost small" data-a="toy-give" data-v="0">📥 Забрати на полицю</button></div>`; })() : ""}
      ${toyNews(3, p.id)}
      <div class="row mt case-btns"><button class="btn small" data-a="pet-play" ${toys.length ? "" : "disabled"}>🎾 Пограти</button>
        <button class="btn ghost small" data-a="pet-hat-open">🎩 ${p.hat ? "Прикол: " + esc((Pets.HATS.find((h) => h[0] === p.hat) || [])[1] || "") : hats.length ? "Вдягнути прикол" : "Приколів немає"}</button>
        ${p.gift ? `<button class="btn small" data-a="pet-gift">🎁 Що він приніс?</button>` : ""}</div>
      <div class="small muted mt">Улюбленець сам обирає, у що гратися, і тримає іграшку в себе. Нелюбу може закинути під диван, забіяка — відібрати чуже, жадібний — не віддати. Добрі діляться по черзі.</div></div>`;
}

function toyGiveSheet() {
  const p = homePets().find((x) => x.id === S.petSel);
  if (!p || !p.holds) return `<div class="muted">Іграшки в лапах уже немає</div>`;
  const o = toyOf(p.holds), list = homePets().filter((x) => x.id !== p.id && !x.den);
  return `<h2>${o[2]} Кому віддати ${esc(TOY_ACC[p.holds] || o[1])}?</h2><div class="small muted mt">${esc(petNm(p))} вирішить сам: добрий віддасть, жадібний чи злий — може й не віддати, а то й закинути під диван.</div>
    <div class="toy-give-list mt">${list.map((x) => { const pr = Pets.toyPrefs(x.dna), love = pr.fav === p.holds, hate = pr.dislikes.includes(p.holds);
      return `<button class="toy-give-row" data-a="toy-give" data-v="${x.id}">${Pets.sprite(petCode(x), 40)}<div class="grow"><b>${esc(petNm(x))}</b><div class="small ${love ? "good" : hate ? "bad" : "muted"}">${love ? "❤ це і його улюблена" : hate ? "терпіти таких не може" : "просто пограється"}${x.holds ? ` · зараз у нього ${(toyOf(x.holds) || [])[2] || ""}` : ""}</div></div><span>›</span></button>`; }).join("") || '<div class="muted">Більше нікому — улюбленець один</div>'}</div>`;
}

function petHatSheet() {
  const p = Api.state && Api.state.pets.find((x) => x.id === S.petSel);
  if (!p) return "";
  const hats = (Api.state.inv || []).filter((x) => x.startsWith("hat:")).map((x) => x.slice(4));
  const base = p.rarity + p.dna;
  return `<h2>🎩 Приколи на голову</h2><p class="muted small">Вибиваються з кейса «Розплідник». Один прикол — на одному улюбленці.</p>
    ${hats.length ? `<div class="pick-grid">${hats.map((h) => `<button class="pick ${p.hat === h ? "on" : ""}" data-a="pet-hat-set" data-v="${h}">${Pets.sprite(base + "-" + h, 64)}
      <span>${esc((Pets.HATS.find((x) => x[0] === h) || [])[1] || h)}</span></button>`).join("")}</div>` : `<div class="card muted small">Приколів поки немає</div>`}
    ${p.hat ? `<button class="btn ghost mt" data-a="pet-hat-set" data-v="">Зняти прикол</button>` : ""}`;
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
    const tag = r.mode === "fav" ? "⭐ улюблене" : r.mode === "rand" ? "🎲 навмання" : r.mode === "full" ? "😌 ситий" : r.mode === "imm" ? "♾️ не їсть" : r.mode === "den" ? "🏠 спить" : "🚫 немає їжі";
    const react = !shown ? "" : res.error ? "✋" : res.reaction === "fav" ? "😍" : res.reaction === "dis" ? "🤢" : res.reaction ? "😋" : "";
    const say = !shown ? "" : res.error ? esc(res.error) : res.reaction === "fav" ? "обожнює це!" : res.reaction === "dis" ? "фу, не любить" : res.reaction ? (res.stash ? "приховав на потім" : "ням!") : r.mode === "full" ? "уже ситий" : r.mode === "den" ? "спить у будиночку" : r.mode === "imm" ? "йому їжа не потрібна" : "";
    return `<div class="care-cell ${shown ? "go" : ""} ${shown && r.item && !res.error ? "eat" : ""}">
      <span class="care-food">${r.item ? Pets.FOOD_EMOJI[r.item] || "🍽" : ""}</span>
      <span class="pet-act ${shown && r.item && !res.error ? "act-chew" : r.mode === "den" ? "act-sleep" : ""}">${Pets.sprite(petCode(r.p), 64, { sleep: r.mode === "den" })}</span>
      ${react ? `<span class="care-react">${react}</span>` : ""}${shown && r.petted ? `<span class="care-heart">❤</span>` : ""}
      <span class="care-bowl">🥣</span><b>${esc(t.name)}</b><span class="small muted">${shown && say ? say : r.item ? `${tag} · ${esc(petFood(r.item).name)}` : tag}</span></div>`;
  };
  const head = c.phase === "plan" ? `<div class="small">Кому що дістанеться: ⭐ — улюблена їжа (якщо ти її вже дізнався і вона є в коморі), 🎲 — випадкова з комори.</div>`
    : c.phase === "run" ? `<div class="small">Годуємо… ${Math.min(c.shown, c.rows.length)}/${c.rows.length}</div>`
    : `<div class="small"><b>Готово!</b> Нагодовано: ${c.rows.filter((r) => r.res && r.res.reaction).length}, погладжено: ${c.rows.filter((r) => r.petted).length}${c.found.length ? `. Дізнався улюблену їжу: ${c.found.map(esc).join(", ")}` : ""}</div>`;
  return `<div class="card care-head"><div class="q-head">🤲 Догляд за всіма</div>${head}</div>
    <div class="care-grid">${c.rows.map(cell).join("")}</div>
    ${c.phase === "plan" ? `<button class="btn mt2" data-a="care-go" ${n ? "" : "disabled"}>${n ? `🍽 Нагодувати (${n}) і погладити` : "Нема кого годувати або немає їжі"}</button>
      <button class="btn ghost mt" data-a="care-reroll">🎲 Перемішати випадкову їжу</button>` : ""}
    ${c.phase === "done" || c.phase === "plan" ? `<button class="btn ghost mt" data-a="care-close">← До улюбленців</button>` : ""}
    ${c.phase === "plan" && !Object.keys(Api.state.food || {}).length ? `<div class="small muted mt center">Комора порожня — їжа продається у вкладці «🛒 Крамниця» (гуртом ×10 зі знижкою)</div>` : ""}`;
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
const QUEST_TEXT = { feed: "Нагодуй улюбленця", pet: "Погладь улюбленця", play: "Пограйся з улюбленцем", case: "Відкрий будь-який кейс", battle: "Позмагайся в бою улюбленців", buy: "Купи щось у крамниці", craft: "Створи річ у майстерні" };
function questsCard() {
  const q = Api.state && Api.state.quests;
  if (!q) return "";
  const all = q.list.every((x) => x.claimed);
  return `<div class="card quests"><div class="q-head">📋 Завдання на сьогодні</div>
    ${q.list.map((x) => { const done = x.have >= x.need;
      return `<div class="q-row ${x.claimed ? "claimed" : ""}"><div class="grow"><b>${QUEST_TEXT[x.key] || x.key}</b>${x.need > 1 ? ` <span class="muted small">${Math.min(x.have, x.need)}/${x.need}</span>` : ""}
        ${bar(Math.min(1, x.have / x.need) * 100, "mood")}</div>${x.claimed ? `<span class="win-tag">✓</span>` : `<button class="btn small" data-a="quest-claim" data-v="${x.key}" ${done ? "" : "disabled"}>🪙 ${x.coins}</button>`}</div>`; }).join("")}
    <div class="q-row bonus"><div class="grow small">Усі три — бонус</div>${q.bonus ? `<span class="win-tag">✓</span>` : `<button class="btn small" data-a="quest-claim" data-v="bonus" ${all ? "" : "disabled"}>🪙 ${q.bonusCoins}</button>`}</div></div>`;
}

const JUNK = ["фантик", "ґудзик", "кришечку від пляшки", "сухий листочок", "одну шкарпетку", "камінчик", "скріпку", "голубине перо"];
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
      const on = r.other ? r.other.name : "";
      if (r.reaction === "snatch") { k.toyFav = 1; notify("warning"); toast(`${t.name} без дозволу вирвав ${TOY_ACC[r.toy] || o[1]} у ${on}! 😤`); petFx("😤"); }
      else if (r.reaction === "repelled") { notify("error"); toast(`${t.name} поліз відбирати іграшку в ${on}, але дістав відсіч 🛡`); }
      else if (r.reaction === "wait") toast(`${t.name} хоче свою улюблену, але вона в лапах у ${on}. Чекає… (або вибий ще одну копію)`);
      else if (r.reaction === "throw") { k.toyNo = [...new Set([...(k.toyNo || []), r.toy])]; notify("error"); toast(`${t.name} схопив ${TOY_ACC[r.toy] || o[1]}, потрусив і закинув під диван! 💢`); petFx("💢"); }
      else if (r.reaction === "fav") { k.toyFav = 1; notify("success"); toast(`${t.name} схопив ${o[1].toLowerCase()} — це його улюблена! ❤`); petFx("❤"); }
      else if (r.reaction === "ok") { toast(`${t.name} обрав: ${o[2]} ${o[1].toLowerCase()}`); petFx("✨"); }
      else if (r.reaction === "seek") toast(`${t.name} обнюхав іграшки й відвернувся: він однолюб і шукає свою єдину улюблену`);
      else if (r.reaction === "bored") toast(`${t.name} позіхає: ці іграшки йому набридли — потрібно більше різних`);
      else if (r.reaction === "scared") { k.toyNo = [...new Set([...(k.toyNo || []), "cucumber"])]; notify("error"); toast(`${t.name} побачив огірок і з жахом підстрибнув! 🥒😱`); }
      else { const no = Pets.toyPrefs(p.dna).dislikes.filter((x) => (Api.state.inv || []).includes("toy:" + x)); k.toyNo = [...new Set([...(k.toyNo || []), ...no])]; toast(`${t.name} пирхнув: жодна з твоїх іграшок йому не подобається`); }
      saveProfile(); render();
    }).catch(petErr);
  },
  "pet-hat-open": () => { S.sheet = { type: "pet-hat" }; renderOverlay(); },
  "toy-give-open": () => { S.sheet = { type: "toy-give" }; renderOverlay(); },
  "toy-give": (v) => {
    const to = Number(v) || 0;
    Api.act("/api/pet/toygive", { pet: S.petSel, to: to || null }).then((st) => {
      const g = st.give; S.sheet = null; renderOverlay();
      notify(g.ok && g.kind !== "thrown" ? "success" : "error"); haptic(g.ok ? "medium" : "heavy");
      toast((g.ok ? (g.kind === "thrown" ? "💢 " : "🤝 ") : g.kind === "tantrum" ? "💢 " : "🙅 ") + g.text); petFx(g.ok ? (g.kind === "thrown" ? "💢" : "🤝") : "😠");
      render();
    }).catch(petErr);
  },
  "toy-fetch": (k) => Api.act("/api/toy/fetch", { toy: k }).then(() => { haptic("medium"); toast(`Дістав з-під дивана: ${(toyOf(k) || [])[2]} ${(toyOf(k) || [])[1]} — знову на полиці`); render(); }).catch(petErr),
  "pet-hat-set": (h) => Api.act("/api/pet/hat", { pet: S.petSel, hat: h || null }).then(() => { S.sheet = null; renderOverlay(); syncProfile(); haptic("medium"); render(); }).catch(petErr),
  "pet-gift": () => Api.act("/api/pet/gift", { pet: S.petSel }).then((st) => {
    const g = st.gift;
    if (g.kind === "junk") toast(`Він приніс тобі ${JUNK[g.value] || "щось"}. Дякую… мабуть 😅`);
    else if (g.kind === "coins") { coinRain(); toast(`Він притягнув ${g.value} монет! 🪙`); }
    else toast(`Він приніс їжу: ${Pets.FOOD_EMOJI[g.value] || "🍖"} ${petFood(g.value).name}`);
    render();
  }).catch(petErr),
  "quest-claim": (k) => Api.act("/api/quest/claim", { key: k }).then((st) => { notify("success"); toast(`Нагорода: +${st.got} 🪙`); coinRain(); render(); }).catch(petErr),
};
