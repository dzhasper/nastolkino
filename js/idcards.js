/* ID-картки з кейсів: у кожної — свій макет, а не лише колір (паспорт, квиток, чек, полароїд, газета, скрижаль…).
   Колір беруть із палітри речі: --g1 світлий, --g2 середній, --g3 темний, --g4 акцент. Стилі — idcards.css */
"use strict";
(function (root) {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  // сузір’я з імені: однакове ім’я — однакові зорі
  function sky(seed) {
    let s = seed || 1; const R = () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return (s >>> 8) / 16777216; };
    const pts = Array.from({ length: 7 }, (_, i) => [20 + i * 38 + R() * 20, 18 + R() * 64]);
    const dust = Array.from({ length: 34 }, () => `<circle cx="${(R() * 300).toFixed(1)}" cy="${(R() * 160).toFixed(1)}" r="${(R() * .9 + .3).toFixed(2)}"/>`).join("");
    return `<svg class="ts-sky" viewBox="0 0 300 160" preserveAspectRatio="none"><g class="d">${dust}</g><polyline points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}"/>
      <g class="s">${pts.map(([x, y], i) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 3 ? 2.2 : 3.2}"/>`).join("")}</g></svg>`;
  }
  const mrz = (s) => (String(s).toUpperCase().replace(/[^A-ZА-ЯІЇЄҐ0-9]+/g, "<") + "<".repeat(26)).slice(0, 26);

  // c: { name — ім’я з ефектом (HTML), plain — ім’я текстом, title, lv, rate, wins, games, avatar, bg }
  function render(tpl, c) {
    const { name, title, lv, rate, wins, games, avatar, bg } = c, t = esc(title), num = String(1000 + games * 37 + wins * 11).slice(-4);
    const body = (extra = "") => `<div class="pc-body">${avatar}<div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${t}</div>${extra}</div></div>`;
    const T = {
      /* ---------- сезонні */
      newspaper: () => `<div class="tn-mast">Ранковий вісник</div><div class="tn-date"><span>№ ${games}</span><span>НАСТОЛКІНО</span><span>ціна 1 🪙</span></div>
        <div class="tn-head">${name}: ${wins ? `уже ${wins} перемог!` : "перший вихід у світ!"}</div>
        <div class="tn-row"><div class="tn-photo">${bg}${avatar}</div><div class="tn-cols"><b>«${t}»</b><i></i><i></i><i></i><i></i><i style="width:60%"></i><span>Рівень ${lv} · удача ${rate}%</span></div></div>`,
      postcard: () => `<div class="tp-hello">Привіт з моря!</div><div class="tp-row"><div class="tp-pic">${bg}${avatar}</div>
        <div class="tp-addr"><div class="tp-stamp">☀️<small>${lv} 🪙</small></div><div class="tp-post"></div><i>Кому:</i><b class="pc-name">${name}</b><i>${t}</i><u></u><span>${wins} перемог · ${games} ігор</span></div></div>`,
      cinema: () => `<div class="tc-film"></div><div class="tc-wrap"><div class="tc-main"><div class="tc-top"><b>Кінотеатр «Заграва»</b><span>сеанс 21:00</span></div>
        ${body(`<div class="tc-seat"><span>ряд <b>${lv}</b></span><span>місце <b>${wins}</b></span><span>зал <b>${rate}%</b></span></div>`)}</div>
        <div class="tc-stub"><span>контроль</span><b>${num}</b></div></div><div class="tc-film"></div>`,
      starmap: () => `${sky(hash(c.plain))}<div class="ts-top"><span>✦ Зоряна карта</span><span>RA ${lv}h ${rate}m · DEC +${wins}°</span></div>
        <div class="pc-body">${avatar}<div class="pc-main"><small class="ts-k">сузір’я</small><div class="pc-name">${name}</div><div class="pc-sub">${t}</div></div></div><div class="ts-foot">${games} ночей · ${wins} перемог</div>`,
      pumpkin: () => `<div class="tk-face"><i></i><i></i><b></b></div><div class="tk-title">Цукерки або життя!</div>
        ${body(`<div class="tk-candy">🍬 × ${wins} · 🎃 рівень ${lv}</div>`)}<div class="tk-corn"></div>`,
      mission: () => `${bg}<div class="tm-row"><div class="tm-patch"><div class="tm-orbit"><i></i></div>${avatar}</div>
        <div class="tm-info"><small>місія NK-${lv} · космонавт</small><div class="pc-name">${name}</div><div class="pc-sub">${t}</div>
        <div class="tm-data"><span>польотів <b>${games}</b></span><span>посадок <b>${wins}</b></span></div></div></div><div class="tm-foot">✦ ✦ ✦ НАСТОЛКІНО · ОРБІТА ${rate}% ✦ ✦ ✦</div>`,
      tablet: () => `<div class="tt-mea"></div><div class="tt-in"><div class="tt-head">✦ Скрижаль ✦</div>
        ${body(`<div class="tt-num">${ROMAN[Math.min(lv, 20) - 1] || lv} · ${wins} перемог</div>`)}</div><div class="tt-mea"></div>`,
      jade: () => `<div class="tj-roll"></div><div class="tj-paper"><div class="tj-col">胜利者</div>${body(`<div class="tj-txt">рівень ${lv} · ${wins} перемог</div>`)}<div class="tj-seal">胜</div></div><div class="tj-roll"></div>`,
      /* ---------- турнірні та кристалічна */
      finalticket: () => `<div class="tf-main"><div class="tf-top"><b>🏆 Фінал</b><span>Кубок Настолкіно</span></div>${body()}
        <div class="tf-seat"><span>трибуна<b>VIP</b></span><span>ряд<b>${lv}</b></span><span>місце<b>${wins}</b></span></div></div>
        <div class="tf-stub"><div class="tf-holo"></div><span>ADMIT ONE</span><div class="tf-bar"></div><small>№ ${num}</small></div>`,
      champion: () => `<div class="tch-in"><div class="tch-stars">★★★★★</div><div class="tch-photo">${bg}${avatar}<div class="tch-rib">CHAMPION</div></div>
        <div class="pc-name">${name}</div><div class="pc-sub">${t}</div>
        <div class="tch-stats"><div><b>${wins}</b><span>перемог</span></div><div><b>${games}</b><span>ігор</span></div><div><b>${lv}</b><span>рівень</span></div><div><b>${rate}%</b><span>удача</span></div></div></div>`,
      belt: () => `<div class="tb-strap"></div><div class="tb-side"><i></i></div><div class="tb-plate"><div class="tb-wc">World Champion</div>${avatar}<div class="pc-name">${name}</div>
        <div class="pc-sub">${t}</div><div class="tb-wc s">Настолкіно · ${wins} перемог</div></div><div class="tb-side"><i></i></div>`,
      crystal: () => `${bg}<div class="tcr-shards"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="tcr-top">✧ Кристалічна душа ✧</div>
        ${body(`<div class="tcr-cut">граней ${games} · блиск ${rate}%</div>`)}`,
      /* ---------- звичайні (k_ / f_): 12 макетів у кольорах матеріалу */
      passport: () => `<div class="tg-ph"><span>Паспорт гравця</span><b>🎲</b></div><div class="tg-pp">${avatar}<div class="tg-f"><i>прізвище / ім’я</i><b class="pc-name">${name}</b>
        <i>статус</i><b>${t}</b><i>рівень · перемог</i><b>${lv} · ${wins}</b></div></div><div class="tg-mrz">P&lt;NKL&lt;${esc(mrz(c.plain))}<br>${num}NKL${String(lv).padStart(2, "0")}&lt;&lt;${String(wins).padStart(3, "0")}&lt;${String(games).padStart(3, "0")}&lt;&lt;&lt;&lt;&lt;&lt;</div>`,
      license: () => `<div class="tg-lh"><b>Посвідчення гравця</b><span>NK</span></div><div class="tg-ll">${avatar}<div class="tg-lf"><div><i>1.</i><b class="pc-name">${name}</b></div>
        <div><i>2.</i>${t}</div><div><i>4a.</i>рівень ${lv} · ${rate}%</div><div><i>5.</i>№ ${num}</div><div class="tg-cat"><span>A</span><span>B</span><span class="${lv >= 5 ? "" : "no"}">C</span><span class="${lv >= 10 ? "" : "no"}">D</span></div></div></div>
        <div class="tg-sign">${esc(c.plain)}</div>`,
      library: () => `<div class="tg-bh">Читацький квиток <b>№ ${num}</b></div>${body()}
        <div class="tg-due"><span class="st">перемог ${wins}</span><span class="st r">ігор ${games}</span><span class="st b">рівень ${lv}</span></div>`,
      boarding: () => `<div class="tg-bpm"><div class="tg-air"><b>✈ Настолкіно Air</b><span>посадковий талон</span></div><div class="tg-route"><b>NKL</b><i>- - ✈ - -</i><b>WIN</b></div>
        ${body()}<div class="tg-fl"><span>рейс<b>NK${lv}${wins % 100}</b></span><span>вихід<b>${"ABCDEF"[lv % 6]}${games % 20}</b></span><span>місце<b>${lv}${"ABCDEF"[wins % 6]}</b></span></div></div>
        <div class="tg-bps"><span>${num}</span><div class="tg-bar"></div><small>BOARDING</small></div>`,
      receipt: () => `<div class="tg-rc"><div class="tg-rch">*** НАСТОЛКІНО ***<br>чек № ${num}</div>${body()}
        <div class="tg-rl"><span>ПЕРЕМОГИ</span><b>× ${wins}</b></div><div class="tg-rl"><span>ПАРТІЇ</span><b>× ${games}</b></div><div class="tg-rl"><span>РІВЕНЬ</span><b>${lv}</b></div>
        <div class="tg-rl tot"><span>РАЗОМ УДАЧІ</span><b>${rate}%</b></div><div class="tg-rch">дякуємо за гру!</div></div>`,
      polaroid: () => `<div class="tg-po"><div class="tg-tape"></div><div class="tg-pph">${bg}${avatar}</div><div class="tg-cap"><b class="pc-name">${name}</b><span>${t} · ${wins} 🏆</span></div></div>`,
      stamp: () => `<div class="tg-st"><div class="tg-sti">${bg}<div class="tg-stv">${lv}<small>монет</small></div><div class="tg-stc">Настолкіно · пошта</div>${avatar}
        <div class="pc-name">${name}</div><div class="pc-sub">${t}</div><div class="tg-pm"><span>${games} · ${wins}</span></div></div></div>`,
      dogtag: () => `<div class="tg-chain"></div><div class="tg-tag"><i class="tg-hole"></i>${avatar}<div class="tg-emb"><b class="pc-name">${name}</b><span>${t}</span>
        <span>NK-${num} · LV ${lv}</span><span>ПЕРЕМОГ ${wins} · ІГОР ${games}</span></div></div>`,
      comic: () => `<div class="tg-cm">${bg}<div class="tg-dots"></div><div class="tg-boom">БАХ!</div><div class="tg-cmb">${avatar}<div class="tg-bub"><b class="pc-name">${name}</b><span>${t}</span></div></div>
        <div class="tg-cap2">випуск № ${games} · ${wins} перемог</div></div>`,
      blueprint: () => `<div class="tg-bt"><b>Креслення гравця</b><span>арк. ${lv}/${games || 1}</span></div><div class="pc-body"><div class="tg-dim">${avatar}<i class="h"></i><i class="v"></i></div>
        <div class="pc-main"><div class="pc-name">${name}</div><div class="pc-sub">${t}</div><div class="tg-spec"><span>перемоги</span><b>${wins}</b><span>ККД</span><b>${rate}%</b><span>масштаб</span><b>1:${lv}</b></div></div></div>`,
      cartridge: () => `<div class="tg-ridge"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="tg-label">${bg}<div class="tg-lt"><b>NASTOLKINO</b><span>LV-${String(lv).padStart(2, "0")}</span></div>${body()}</div><div class="tg-pins"></div>`,
      diploma: () => `<div class="tg-dip"><div class="tg-dh">Грамота</div><div class="tg-dt">нагороджується</div>${body()}<div class="tg-dt">за ${wins} перемог у ${games} партіях</div><div class="tg-seal">★</div></div>`,
    };
    return T[tpl] ? T[tpl]() : "";
  }
  const api = { render, sky };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.IdCards = api;
})(typeof window !== "undefined" ? window : globalThis);
