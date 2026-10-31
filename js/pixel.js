/* Пиксель-арт: спрайты, процедурные пиксельные сцены для вкладок и сценариев, пикселизация фото и эмодзи.
   Всё рисуется в маленьком разрешении и увеличивается без сглаживания (image-rendering: pixelated). */
const Pixel = (() => {
  "use strict";

  /* ---------------------------------------------------------------- спрайты из строк */
  const SPR = {
    dice: { pal: { "#": "#1b1030", w: "#fff6e8", s: "#d8c8e8", k: "#1b1030", r: "#e0263a" }, rows: [
      ".############.", "#wwwwwwwwwwww#", "#wkkwwwwwwkkw#", "#wkkwwwwwwkkw#", "#wwwwwwwwwwww#", "#wwwwwrrwwwww#",
      "#wwwwwrrwwwww#", "#wwwwwwwwwwww#", "#wkkwwwwwwkkw#", "#wkkwwwwwwkkw#", "#wwwwwwwwwwww#", "#ssssssssssss#", ".############."] },
    vote: { pal: { "#": "#120c20", w: "#fffaf0", k: "#120c20", b: "currentColor", d: "#00000055" }, rows: [
      "....######....", "....#wwww#....", "....#wkkw#....", "....#wwww#....", ".############.", ".#bbbkkkkbbb#.",
      ".#bbbbbbbbbb#.", ".#bbbbbbbbbb#.", ".#bbbbbbbbbb#.", ".#bbbbbbbbbb#.", ".#dddddddddd#.", ".############."] },
    verdict: { pal: { "#": "currentColor" }, rows: [
      ".......#.......", "......###......", "..###########..", "..#....#....#..", ".#.#...#...#.#.", "#...#..#..#...#",
      "#####..#..#####", ".###...#...###.", ".......#.......", ".......#.......", ".....#####.....", "....#######...."] },
    end: { pal: { "#": "#2a1600", y: "#ffd23f", o: "#d08a10" }, rows: [
      "..##########..", "###yyyyyyyy###", "#.#yyyyyyyy#.#", "#.#yyyyyyyo#.#", ".##yyyyyyyo##.", "...#yyyyyo#...",
      "....#yyyo#....", ".....#yo#.....", "......##......", "......##......", ".....#yo#.....", "...########...",
      "...#yyyyyo#...", "...########..."] },
    heart: { pal: { "#": "#2a0610", r: "#ff3355", w: "#ffb3c1" }, rows: [
      ".##.##.", "#wr#rr#", "#rrrrr#", ".#rrr#.", "..#r#..", "...#..."] },
    star: { pal: { "#": "#2a1a00", y: "#ffd23f" }, rows: [
      "....#....", "...#y#...", "...#y#...", "####y####", ".#yyyyy#.", "..#yyy#..", ".#yy#yy#.", ".#y#.#y#.", ".##...##."] },
    skull: { pal: { "#": "#120c20", w: "#f2ecff", k: "#120c20" }, rows: [
      "..######..", ".#wwwwww#.", "#wwwwwwww#", "#w##ww##w#", "#w##ww##w#", "#wwwkkwww#", ".#wwwwww#.", "..#wkwkw#.",
      "..######.."] },
    coin: { pal: { "#": "#3a2400", y: "#ffd23f", o: "#e09a18", w: "#fff4b0" }, rows: [
      "..####..", ".#wyyy#.", "#wyoyyo#", "#yyoyyo#", "#yyoyyo#", "#yyoyyo#", ".#yyyo#.", "..####.."] },
  };

  const B = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function moon() {                                         // полная луна 30×30: объём, кратеры, светлый край
    const rows = [], n = 30, c = 14.5;
    const craters = [[10, 11, 3.2], [18, 19, 4], [19, 9, 2.2], [9, 20, 2], [14, 25, 1.6]];
    for (let y = 0; y < n; y++) {
      let r = "";
      for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - c, y - c);
        if (d > 13.6) { r += "."; continue; }
        const cr = craters.find(([cx, cy, cr0]) => Math.hypot(x - cx, y - cy) < cr0);
        const rim = craters.find(([cx, cy, cr0]) => { const dd = Math.hypot(x - cx + .8, y - cy + .8); return dd < cr0 && Math.hypot(x - cx, y - cy) >= cr0 - .1; });
        const shade = (x + y) / 34 + B[y & 3][x & 3] / 28 > 1.25;
        r += d > 12.6 ? (x + y > 30 ? "o" : "h") : cr ? "c" : rim ? "h" : shade ? "s" : "a";
      }
      rows.push(r);
    }
    return { pal: { a: "currentColor", s: "#00000030", c: "#00000045", o: "#00000060", h: "#ffffff70" }, rows };
  }
  function sun() {                                          // солнце 31×31: диск с объёмом и лучи
    const rows = [], n = 31, c = 15;
    for (let y = 0; y < n; y++) {
      let r = "";
      for (let x = 0; x < n; x++) {
        const d = Math.hypot(x - c, y - c), ang = Math.atan2(y - c, x - c);
        const ray = d > 10.5 && d < 15.5 && Math.abs(((ang / (Math.PI / 6)) % 1 + 1) % 1 - .5) > .38 - (15.5 - d) * .015;
        if (d <= 8.6) {
          const shade = (x - y) / 20 + B[y & 3][x & 3] / 32 > .55;
          r += d > 7.6 ? "o" : (x - c + 3) ** 2 + (y - c + 3) ** 2 < 5 ? "w" : shade ? "s" : "a";
        } else r += ray ? (d > 13.5 ? "s" : "a") : ".";
      }
      rows.push(r);
    }
    return { pal: { a: "currentColor", s: "#00000030", o: "#00000060", w: "#ffffffaa" }, rows };
  }
  SPR.night = moon();
  SPR.day = sun();

  function sprite(name, scale = 4, extraClass = "") {
    const s = SPR[name];
    if (!s) return "";
    const h = s.rows.length, w = s.rows[0].length;
    let rects = "";
    s.rows.forEach((row, y) => {
      let x = 0;
      while (x < w) {
        const c = row[x];
        let run = 1;
        while (x + run < w && row[x + run] === c) run++;
        if (c !== "." && s.pal[c]) rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${s.pal[c]}"/>`;
        x += run;
      }
    });
    return `<svg class="sprite ${extraClass}" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  /* ---------------------------------------------------------------- процедурные сцены 320×160 */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const W = 320, H = 160;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function tools(ctx, R) {
    const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
    const px = (x, y, c) => rect(x, y, 1, 1, c);
    // градиент с упорядоченным дизерингом (как в играх 90-х)
    const grad = (y0, y1, cols, x0 = 0, x1 = W) => {
      for (let y = Math.round(y0); y < y1; y++) {
        const t = ((y - y0) / Math.max(1, y1 - y0)) * (cols.length - 1);
        const i = Math.min(cols.length - 2, Math.floor(t)), f = t - i;
        for (let x = x0; x < x1; x++) px(x, y, f * 16 > BAYER[y % 4][x % 4] + .5 ? cols[i + 1] : cols[i]);
      }
    };
    const disc = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + r * .5)); rect(cx - w, cy + y, w * 2 + 1, 1, c); } };
    // шар с объёмом: свет слева сверху, тень дизерингом
    const ball = (cx, cy, r, light, mid, dark) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r + r * .5) continue;
        const l = (-(x) - y) / (r * 1.4) + .1;
        const th = (BAYER[(cy + y) & 3][(cx + x) & 3] / 16) - .5;
        px(cx + x, cy + y, l + th * .35 > .45 ? light : l + th * .35 > -.35 ? mid : dark);
      }
    };
    const line = (x0, y0, x1, y1, c) => {
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let e = dx + dy;
      for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
    };
    // гряда гор/холмов: высоты из суммы синусов + шум, со светлой кромкой
    const ridge = (base, amp, f, col, rim, rough = 1) => {
      const ph = R() * 100, ph2 = R() * 100;
      const hs = [];
      for (let x = 0; x < W; x++) {
        const h = Math.round(base - amp * (.6 * Math.sin(x * f + ph) + .3 * Math.sin(x * f * 2.7 + ph2) + .1 * rough * (R() - .5)));
        hs.push(h); rect(x, h, 1, H - h, col);
        if (rim) px(x, h, rim);
      }
      return hs;
    };
    const stars = (n, yMax) => {
      for (let i = 0; i < n; i++) {
        const x = R() * W, y = R() * yMax, r = R();
        px(x, y, r < .7 ? "#ffffff" : r < .85 ? "#bfe6ff" : "#ffe8b0");
        if (r > .96) { px(x - 1, y, "#ffffff88"); px(x + 1, y, "#ffffff88"); px(x, y - 1, "#ffffff88"); px(x, y + 1, "#ffffff88"); }
      }
    };
    const dither = (x0, y0, w, h, c, d = .5) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (BAYER[y & 3][x & 3] < d * 16) px(x, y, c); };
    const glow = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y) / r; if (d < 1 && BAYER[(cy + y) & 3][(cx + x) & 3] < (1 - d) * 9) px(cx + x, cy + y, c); } };
    return { rect, px, grad, disc, ball, line, ridge, stars, dither, glow };
  }

  // дом/небоскрёб с окнами, карнизами и крышей
  function building(t, R, x, y, w, h, o) {
    t.rect(x, y, w, h, o.wall);
    if (o.shade) t.rect(x + w - 3, y, 3, h, o.shade);
    if (o.edge) t.rect(x, y, 1, h, o.edge);
    for (let wy = y + o.top; wy < y + h - (o.bottom || 6); wy += o.gy) {
      if (o.ledge && (wy - y) % (o.gy * 4) === o.top) t.rect(x - 1, wy - 2, w + 2, 1, o.ledge);
      for (let wx = x + o.side; wx < x + w - o.side - o.ww + 1; wx += o.gx) {
        const r = R();
        const c = r < o.lit ? o.lights[Math.floor(R() * o.lights.length)] : o.dark;
        t.rect(wx, wy, o.ww, o.wh, c);
        if (r < o.lit && R() < .12 && o.ww > 2) t.rect(wx + 1, wy + o.wh - 2, 1, 2, "#00000099");   // силуэт в окне
        if (o.frame) t.rect(wx, wy + o.wh, o.ww, 1, o.frame);
      }
    }
  }

  const SCENES = {
    arcade(ctx, R, t) {                                     // ГЛАВНАЯ: синтвейв-аркада
      t.grad(0, 98, ["#07021a", "#14063a", "#2c0c5e", "#5a1478", "#9a2280", "#e0467a", "#ff8a5c"]);
      t.stars(160, 60);
      for (let y = -36; y <= 0; y++) {                      // солнце с прорезями
        const w = Math.floor(Math.sqrt(36 * 36 - y * y));
        const gap = y > -22 && (y + 36) % Math.max(2, Math.round(6 + y / 5)) === 0;
        if (gap) continue;
        const c = y < -26 ? "#fff3a0" : y < -18 ? "#ffd166" : y < -10 ? "#ffa04f" : y < -4 ? "#ff6f61" : "#ff3e7a";
        t.rect(160 - w, 97 + y, w * 2, 1, c);
      }
      t.glow(160, 80, 52, "#ff6f9f");
      t.ridge(92, 16, .03, "#3a0d5c", "#c04aa0");
      t.ridge(97, 9, .06, "#22073e", "#7a2a8a");
      for (let x = 4; x < W; x += 7) { const h = 3 + Math.floor(R() * 9); t.rect(x, 98 - h, 5, h, "#16052c"); if (R() < .6) t.px(x + 2, 98 - h + 2, "#ffd166"); }
      t.rect(0, 98, W, 62, "#0a0118");
      for (let k = 1; k < 13; k++) { const y = 98 + Math.round(k * k * .38); t.rect(0, y, W, 1, "#ff3ec8"); t.rect(0, y + 1, W, 1, "#7a1a6a"); }
      for (let k = -18; k <= 18; k++) t.line(160 + k * 5, 98, 160 + k * 26, H, "#ff3ec8");
      const palm = (bx, dir) => {                           // высокая пальма-силуэт на фоне заката
        let x = bx, top = 0;
        for (let i = 0; i < 96; i++) { x = bx + dir * (i * i) / 420; t.rect(x, 158 - i, 4 - (i > 60 ? 1 : 0), 1, i % 5 ? "#0e0218" : "#2a0a3e"); top = 158 - i; }
        const tx = Math.round(x + 1), ty = top;
        [[-1, -.15], [-1, .35], [-.6, .8], [1, -.2], [1, .3], [.6, .85], [-.2, -1], [.3, -.9]].forEach(([ax, ay]) => {
          for (let i = 0; i < 30; i++) {
            const lx = tx + ax * i, ly = ty + ay * i + i * i * .025;
            t.rect(lx, ly, 2, 2, "#0e0218");
            if (i % 3 === 0 && i > 4) t.rect(lx - ay * 3, ly + 2, 1, 3, "#0e0218");
          }
        });
      };
      palm(18, 1); palm(300, -1);
    },
    rpg(ctx, R, t) {                                        // ПРОФИЛЬ: замок на холме, как в JRPG
      t.grad(0, 100, ["#2a46b8", "#3e62d8", "#5a86ee", "#86acfa", "#b8d4ff"]);
      for (let i = 0; i < 7; i++) {                          // облака с тенью снизу
        const cx = R() * W, cy = 10 + R() * 40, n = 3 + Math.floor(R() * 3);
        for (let k = 0; k < n; k++) t.disc(cx + k * 9, cy + (k % 2) * 2, 6 + (k % 2) * 2, "#e6eeff");
        for (let k = 0; k < n; k++) t.disc(cx + k * 9, cy - 2 + (k % 2) * 2, 5 + (k % 2) * 2, "#ffffff");
      }
      const far = t.ridge(70, 22, .025, "#5a6cb8", "#8090d0");
      far.forEach((h, x) => { if (h < 58) for (let y = h; y < h + 6 - (x % 3); y++) t.px(x, y, "#f4f8ff"); });
      t.ridge(92, 10, .04, "#3c8c48", "#5cb85c");
      for (let i = 0; i < 40; i++) { const x = R() * W, y = 84 + R() * 12; t.disc(x, y, 3, "#2a6e36"); t.px(x - 1, y - 2, "#4caa58"); }
      const hill = t.ridge(122, 8, .03, "#2f9e44", "#6ed46e");
      t.dither(0, 126, W, 34, "#268a3a", .35);
      const cx = 205, cy = hill[220] - 2;                   // замок
      t.rect(cx, cy - 34, 56, 34, "#9a9ab8");
      for (let y = cy - 34; y < cy; y += 4) for (let x = cx + ((y / 4) % 2) * 3; x < cx + 56; x += 6) t.rect(x, y, 5, 1, "#8484a4");
      for (let x = cx; x < cx + 56; x += 6) t.rect(x, cy - 38, 4, 4, "#9a9ab8");
      [[cx - 10, 52, 12], [cx + 54, 52, 12], [cx + 21, 66, 14]].forEach(([tx, th, tw]) => {
        t.rect(tx, cy - th, tw, th, "#a8a8c8"); t.rect(tx + tw - 3, cy - th, 3, th, "#8888a8");
        for (let i = 0; i < tw / 2 + 2; i++) t.rect(tx + tw / 2 - i, cy - th - 14 + i * 1.3, i * 2, 1, i % 3 ? "#d03a3a" : "#a82828");
        t.rect(tx + tw / 2, cy - th - 22, 1, 8, "#3a2a1a"); t.rect(tx + tw / 2 + 1, cy - th - 22, 7, 4, "#ffd23f");
        t.rect(tx + tw / 2 - 1, cy - th + 10, 3, 5, "#2a2a3e"); t.px(tx + tw / 2, cy - th + 11, "#ffd23f");
      });
      t.rect(cx + 23, cy - 14, 10, 14, "#3a2a1a"); t.disc(cx + 28, cy - 14, 5, "#3a2a1a");
      for (let i = 0; i < 4; i++) t.rect(cx + 6 + i * 12, cy - 26, 3, 5, "#ffd23f");
      for (let y = cy; y < H; y++) { const w = 6 + (y - cy) * .5; t.rect(cx + 28 - w / 2 + Math.sin(y / 9) * 8, y, w, 1, "#d8c08a"); }
      for (let i = 0; i < 220; i++) { const x = R() * W, y = 128 + R() * 32; t.px(x, y, "#4ac85a"); t.px(x, y - 1, "#7ae07a"); }
      for (let i = 0; i < 30; i++) { const x = R() * W, y = 130 + R() * 28, c = ["#ff6b9a", "#ffe066", "#ffffff", "#a8c8ff"][i % 4]; t.px(x, y, c); t.px(x + 1, y, c); t.px(x, y - 1, c); }
      for (let i = 0; i < 5; i++) { const bx = 40 + R() * 120, by = 20 + R() * 30; t.line(bx - 3, by - 2, bx, by, "#1a2050"); t.line(bx, by, bx + 3, by - 2, "#1a2050"); }
    },
    classic(ctx, R, t) {                                    // НУАР: ночной город, кровавая луна, дождь
      t.grad(0, H, ["#000000", "#050505", "#0b0b0b", "#151515", "#1e1e1e"]);
      t.glow(250, 34, 40, "#3a0408");
      t.ball(250, 34, 20, "#d01a26", "#a0101a", "#5a0610");
      [[244, 28, 3], [256, 40, 4], [252, 24, 2]].forEach(([x, y, r]) => t.disc(x, y, r, "#7a0a12"));
      for (let x = 0; x < W;) {                              // дальний ряд
        const w = 14 + Math.floor(R() * 20), h = 50 + Math.floor(R() * 50);
        t.rect(x, H - 30 - h, w, h, "#0c0c0c");
        for (let wy = H - 28 - h; wy < H - 32; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 4) if (R() < .08) t.px(wx, wy, "#8a7a3a");
        x += w;
      }
      for (let x = -4; x < W;) {                             // ближний ряд
        const w = 26 + Math.floor(R() * 26), h = 40 + Math.floor(R() * 56), y = H - 22 - h;
        building(t, R, x, y, w, h, { wall: "#141414", shade: "#0e0e0e", edge: "#222", ledge: "#262626", top: 5, gy: 6, gx: 6, side: 3, ww: 3, wh: 3,
          lit: .2, lights: ["#e8c860", "#f4efe6", "#d8a040", "#c0141f"], dark: "#0a0a0a", frame: "#1e1e1e" });
        if (R() < .4) { t.rect(x + w / 2 - 6, y - 10, 12, 10, "#141414"); t.rect(x + w / 2 - 7, y - 11, 14, 1, "#262626"); t.rect(x + w / 2 - 5, y - 4, 2, 4, "#0a0a0a"); }
        if (R() < .5) { t.rect(x + w - 6, y - 16, 1, 16, "#2a2a2a"); t.px(x + w - 6, y - 17, "#ff2a2a"); }
        x += w + 2;
      }
      t.rect(0, H - 22, W, 22, "#070707");
      t.rect(0, H - 22, W, 1, "#2a2a2a");
      [40, 150, 270].forEach((lx) => {                       // фонари со светом
        t.rect(lx, H - 60, 2, 38, "#2a2a2a"); t.rect(lx - 6, H - 61, 12, 2, "#2a2a2a"); t.rect(lx - 5, H - 59, 10, 2, "#ffe8a0");
        for (let y = 0; y < 36; y++) for (let x = -y * .45; x < y * .45; x++) if (BAYER[(H - 57 + y) & 3][(lx + Math.round(x)) & 3] < 4) t.px(lx + x, H - 57 + y, "#4a3c18");
      });
      t.rect(196, H - 16, 40, 8, "#101010"); t.rect(204, H - 22, 22, 6, "#101010"); t.disc(204, H - 8, 3, "#000"); t.disc(228, H - 8, 3, "#000");
      t.rect(234, H - 14, 3, 2, "#fff4c0"); t.glow(240, H - 13, 10, "#5a4a20");
      t.disc(250, H - 6, 4, "#3a0408");                      // отражение луны в луже
      for (let i = 0; i < 260; i++) { const rx = R() * W, ry = R() * (H - 20); t.line(rx, ry, rx - 2, ry + 4, i % 3 ? "#262626" : "#3a3a3a"); }
      for (let i = 0; i < 40; i++) { const sx = R() * W; t.rect(sx, H - 4 - R() * 14, 3, 1, "#2a2a2a"); }
    },
    "90s"(ctx, R, t) {                                      // 90-е: неоновый закат, хрущёвки, ларёк, «девятка»
      t.grad(0, 112, ["#0c0216", "#1e0632", "#3e0a52", "#7a1466", "#c42a6a", "#ff5a5a", "#ffa04a"]);
      t.stars(60, 40);
      for (let y = -40; y <= 0; y++) {
        const w = Math.floor(Math.sqrt(1600 - y * y));
        if (y > -26 && (y + 40) % Math.max(2, Math.round(7 + y / 5)) === 0) continue;
        t.rect(150 - w, 111 + y, w * 2, 1, y < -28 ? "#fff6a0" : y < -16 ? "#ffd24a" : "#ff9a3a");
      }
      [[6, 74, 66], [96, 60, 52], [186, 86, 74], [282, 50, 46]].forEach(([bx, bw, bh]) => {   // панельки
        const by = 112 - bh;
        building(t, R, bx, by, bw, bh, { wall: "#1c0a2a", shade: "#140620", edge: "#2e1240", top: 4, gy: 9, gx: 8, side: 4, ww: 5, wh: 4, bottom: 4,
          lit: .32, lights: ["#ffd400", "#ffe680", "#00e5ff", "#5ab0ff", "#ff2bd6"], dark: "#2a1238", frame: "#3a1a4a" });
        for (let wy = by + 9; wy < 108; wy += 9) for (let wx = bx + 4; wx < bx + bw - 8; wx += 16) t.rect(wx - 1, wy + 5, 7, 2, "#3a1a4a");   // балконы
        for (let i = 0; i < 3; i++) { const dx = bx + 6 + R() * (bw - 12), dy = by + 10 + R() * (bh - 20); t.disc(dx, dy, 2, "#9a9aa8"); t.px(dx, dy, "#5a5a68"); }
        t.rect(bx + bw / 2, by - 8, 1, 8, "#2e1240"); t.line(bx + bw / 2 - 4, by - 8, bx + bw / 2 + 4, by - 8, "#2e1240");
      });
      t.line(0, 60, W, 52, "#1a0626"); t.line(0, 63, W, 56, "#1a0626");
      t.rect(0, 112, W, 48, "#0a0212");
      for (let k = 1; k < 10; k++) { const y = 112 + Math.round(k * k * .48); t.rect(0, y, W, 1, "#00e5ff"); }
      for (let k = -16; k <= 16; k++) t.line(150 + k * 6, 112, 150 + k * 30, H, "#0090b0");
      const kx = 120;                                        // ларёк
      t.rect(kx, 116, 64, 30, "#2a0a3a"); t.rect(kx - 2, 112, 68, 5, "#ff2bd6"); t.rect(kx + 4, 120, 56, 14, "#ffd400");
      for (let i = 0; i < 7; i++) t.rect(kx + 6 + i * 8, 122, 5, 9, ["#ff4a4a", "#4aff7a", "#4ab0ff", "#ffffff", "#ff9a3a", "#c84aff", "#ffea4a"][i]);
      for (let i = 0; i < 8; i++) t.rect(kx + 4 + i * 7, 120, 1, 14, "#2a0a3a");
      t.glow(kx + 32, 128, 30, "#5a1a4a");
      const cx = 230;                                        // «девятка»
      t.rect(cx, 134, 54, 10, "#3a2a5a"); t.rect(cx + 10, 126, 30, 9, "#3a2a5a"); t.rect(cx + 12, 128, 12, 6, "#5ab0ff"); t.rect(cx + 26, 128, 12, 6, "#5ab0ff");
      t.disc(cx + 12, 145, 5, "#0a0212"); t.disc(cx + 42, 145, 5, "#0a0212"); t.disc(cx + 12, 145, 2, "#7a7a8a"); t.disc(cx + 42, 145, 2, "#7a7a8a");
      t.rect(cx + 51, 136, 3, 3, "#fff4c0"); t.rect(cx, 136, 2, 3, "#ff2a2a");
    },
    halloween(ctx, R, t) {                                  // ХЭЛЛОУИН: кладбище, особняк, луна, летучие мыши
      t.grad(0, H, ["#05020a", "#0e0518", "#1a0a2e", "#2a1048", "#3a1660", "#4a1e70"]);
      t.stars(110, 70);
      t.glow(232, 40, 52, "#5a3a7a");
      t.ball(232, 40, 28, "#fff6d8", "#f0deaa", "#c8b07a");
      [[222, 32, 5], [242, 50, 6], [238, 28, 3], [218, 50, 3]].forEach(([x, y, r]) => { t.disc(x, y, r, "#d8c48e"); t.disc(x - 1, y - 1, r - 1, "#e8d4a0"); });
      [[176, 34, 70], [214, 52, 64]].forEach(([cx, cy, cw]) => t.dither(cx, cy, cw, 4, "#3a1e58", .35));   // дымка облаков
      const bat = (bx, by, s) => {
        t.rect(bx - 1, by, 3, 3, "#000"); t.px(bx - 1, by - 1, "#000"); t.px(bx + 1, by - 1, "#000");
        for (let i = 1; i <= 5 * s; i++) { const yy = by + Math.round(Math.sin(i / s) * 2) - 1; t.rect(bx + 1 + i, yy, 1, 2, "#000"); t.rect(bx - 1 - i, yy, 1, 2, "#000"); }
      };
      bat(200, 30, 1); bat(260, 66, 1.4); bat(150, 22, 1); bat(220, 56, 1);
      const hill = t.ridge(96, 14, .02, "#0c0614", "#2a1640");
      const hx = 60, hy = hill[80];                         // особняк на холме
      t.rect(hx, hy - 34, 50, 34, "#100818"); t.rect(hx + 8, hy - 50, 14, 16, "#100818");
      for (let i = 0; i < 30; i++) t.rect(hx + 25 - i, hy - 34 - 14 + i * .9, i * 2, 1, "#0a0410");
      for (let i = 0; i < 9; i++) t.rect(hx + 15 - i, hy - 62 + i * 1.4, i * 2, 1, "#0a0410");
      [[hx + 6, hy - 26], [hx + 20, hy - 26], [hx + 36, hy - 26], [hx + 12, hy - 14], [hx + 30, hy - 14], [hx + 13, hy - 44]].forEach(([wx, wy], i) => {
        t.rect(wx, wy, 6, 7, i % 3 === 1 ? "#1a0a20" : "#ffb347"); t.rect(wx + 2, wy, 1, 7, "#100818"); t.rect(wx, wy + 3, 6, 1, "#100818");
      });
      const tree = (x, y, len, ang, depth) => {
        if (depth === 0 || len < 2) return;
        const x2 = x + Math.cos(ang) * len, y2 = y - Math.sin(ang) * len;
        t.line(x, y, x2, y2, "#08040c"); if (depth > 3) t.line(x + 1, y, x2 + 1, y2, "#08040c");
        tree(x2, y2, len * .72, ang + .45 + R() * .2, depth - 1); tree(x2, y2, len * .7, ang - .5 - R() * .2, depth - 1);
      };
      tree(290, 128, 22, Math.PI / 2, 7); tree(20, 132, 18, Math.PI / 2 + .1, 6);
      t.ridge(132, 4, .05, "#07030c", "#1e1030");
      for (let x = 100; x < 280; x += 6) { t.rect(x, 116, 1, 16, "#1a1028"); t.px(x, 115, "#2a1a3a"); }
      t.rect(100, 120, 180, 1, "#1a1028");
      [[112, 0], [136, 1], [160, 2], [186, 0], [214, 1], [244, 2], [268, 0]].forEach(([gx, k], i) => {   // надгробия
        const gh = 16 + (i % 3) * 4, gy = 138 - gh;
        if (k === 1) { t.rect(gx + 5, gy - 4, 3, gh + 4, "#6a6a80"); t.rect(gx, gy + 2, 13, 3, "#6a6a80"); t.rect(gx + 7, gy - 4, 1, gh + 4, "#4a4a5e"); return; }
        t.rect(gx, gy, 14, gh, "#62627a"); t.disc(gx + 7, gy, 7, "#62627a"); t.rect(gx + 11, gy - 3, 3, gh + 3, "#4a4a5e");
        t.rect(gx + 3, gy + 2, 7, 1, "#4a4a5e"); t.rect(gx + 3, gy + 5, 5, 1, "#4a4a5e");
        if (k === 2) t.line(gx + 4, gy - 4, gx + 8, gy + 6, "#3a3a4a");
        t.dither(gx, gy + gh - 4, 14, 4, "#3a6a3a", .4);
      });
      [[90, 146, 7], [200, 150, 6], [298, 148, 5]].forEach(([qx, qy, r]) => {   // тыквы-фонари
        t.glow(qx, qy, r * 3, "#5a2a10");
        t.ball(qx, qy, r, "#ffa040", "#f2711c", "#b84a10");
        t.rect(qx - 1, qy - r - 3, 3, 3, "#2f7a3a");
        t.rect(qx - r / 2 - 1, qy - 2, 2, 2, "#ffe066"); t.rect(qx + r / 2 - 1, qy - 2, 2, 2, "#ffe066"); t.rect(qx - r / 2, qy + 2, r, 1, "#ffe066");
      });
      t.dither(0, 140, W, 20, "#5a4080", .22);
      t.dither(0, 150, W, 10, "#6a5090", .3);
    },
    bunker(ctx, R, t) {                                     // БУНКЕР: панели, трубы, гермодверь, мониторы
      t.rect(0, 0, W, H, "#040804");
      for (let x = 0; x < W; x += 32) {
        t.rect(x, 0, 31, 132, "#0b170d"); t.rect(x, 0, 1, 132, "#16281a"); t.rect(x + 30, 0, 1, 132, "#050a06");
        for (let y = 4; y < 132; y += 16) { t.px(x + 3, y, "#2a4a2e"); t.px(x + 27, y, "#2a4a2e"); t.px(x + 3, y + 1, "#050a06"); t.px(x + 27, y + 1, "#050a06"); }
      }
      [[12, 6, "#2a4a2e"], [24, 4, "#223e28"], [34, 3, "#1c3420"]].forEach(([y, h, c]) => {
        t.rect(0, y, W, h, c); t.rect(0, y, W, 1, "#4a7a50"); t.rect(0, y + h - 1, W, 1, "#0a160c");
        for (let x = 10; x < W; x += 46) { t.rect(x, y - 2, 4, h + 4, "#18301c"); t.rect(x, y - 2, 4, 1, "#3d6a44"); }
      });
      t.disc(70, 26, 5, "#5a1a1a"); t.disc(70, 26, 3, "#8a2a2a"); t.rect(69, 20, 2, 12, "#3a0a0a");
      for (let i = 0; i < 4; i++) t.line(0, 46 + i * 2, W, 50 + i * 3, i % 2 ? "#141414" : "#1a1a10");
      const dx = 130;                                        // гермодверь
      t.rect(dx - 4, 50, 68, 82, "#141e16"); t.rect(dx, 54, 60, 78, "#24342a"); t.rect(dx, 54, 60, 2, "#3a5240");
      for (let y = 58; y < 130; y += 12) for (let x = dx + 4; x < dx + 60; x += 52) t.disc(x, y, 1, "#5a7a60");
      t.ball(dx + 30, 92, 15, "#5a7a60", "#3a5a40", "#22382a");
      t.disc(dx + 30, 92, 10, "#24342a"); t.disc(dx + 30, 92, 3, "#5a7a60");
      for (let a = 0; a < 4; a++) t.line(dx + 30, 92, dx + 30 + Math.cos(a * Math.PI / 2 + .3) * 13, 92 + Math.sin(a * Math.PI / 2 + .3) * 13, "#5a7a60");
      t.rect(dx + 2, 60, 56, 6, "#f5c400"); for (let x = dx + 2; x < dx + 58; x += 8) t.rect(x, 60, 4, 6, "#111");
      t.glow(dx + 30, 46, 16, "#5a1410"); t.ball(dx + 30, 46, 4, "#ff8a7a", "#ff3b2f", "#a01810");
      [[18, 58], [236, 54]].forEach(([mx, my], m) => {        // мониторы с графиками
        t.rect(mx, my, 66, 46, "#0e1c10"); t.rect(mx + 3, my + 3, 60, 40, "#020a04");
        for (let y = my + 3; y < my + 43; y += 2) t.rect(mx + 3, y, 60, 1, "#06140a");
        if (m === 0) { for (let y = my + 7; y < my + 40; y += 5) t.rect(mx + 6, y, 10 + Math.floor(R() * 40), 2, "#9cff57"); }
        else { let yy = my + 30; for (let x = mx + 5; x < mx + 60; x++) { yy += Math.round((R() - .5) * 4); yy = Math.max(my + 8, Math.min(my + 40, yy)); t.px(x, yy, "#9cff57"); t.px(x, yy + 1, "#4a8a2a"); } t.rect(mx + 6, my + 6, 18, 3, "#ff5a3c"); }
        t.glow(mx + 33, my + 23, 40, "#0e2a12");
        t.rect(mx + 28, my + 46, 10, 4, "#0e1c10");
      });
      [[96, 112], [104, 120], [210, 116]].forEach(([cx, cy]) => { t.rect(cx, cy, 20, 20, "#3a3420"); t.rect(cx, cy, 20, 2, "#5a5030"); t.line(cx, cy + 2, cx + 19, cy + 19, "#2a2416"); t.line(cx + 19, cy + 2, cx, cy + 19, "#2a2416"); });
      t.rect(0, 132, W, 8, "#111"); for (let x = 0; x < W; x += 12) t.rect(x, 132, 6, 8, "#f5c400");
      t.rect(0, 140, W, 20, "#0a0e0a"); for (let x = 0; x < W; x += 4) t.rect(x, 140, 1, 20, "#141c14"); for (let y = 142; y < H; y += 4) t.rect(0, y, W, 1, "#141c14");
    },
    west(ctx, R, t) {                                       // ДИКИЙ ЗАПАД: закат, столовые горы, салун, кактусы
      t.grad(0, 100, ["#ffe9b0", "#ffd27a", "#ffb04f", "#ff8a45", "#f0603e", "#c8463e"]);
      t.glow(160, 96, 60, "#fff0b0");
      t.ball(160, 98, 30, "#fffbe0", "#fff1b8", "#ffe08a");
      for (let i = 0; i < 4; i++) { const bx = 40 + R() * 240, by = 16 + R() * 30; t.line(bx - 4, by - 2, bx, by, "#3a1a10"); t.line(bx, by, bx + 4, by - 2, "#3a1a10"); }
      [[0, 66, 58], [60, 58, 46], [214, 70, 54], [278, 50, 64]].forEach(([mx, mw, mh]) => {   // столовые горы с пластами
        const my = 100 - mh;
        t.rect(mx + 4, my, mw - 8, mh, "#9a4434"); t.rect(mx, my + 8, mw, mh - 8, "#9a4434");
        for (let y = my + 4; y < 100; y += 5) t.rect(mx + (y < my + 8 ? 4 : 0), y, mw - (y < my + 8 ? 8 : 0), 1, "#b85a42");
        t.rect(mx + mw - 10, my + 8, 10, mh - 8, "#7a3428"); t.rect(mx + 4, my, mw - 8, 1, "#d8785a");
        t.dither(mx, 92, mw, 8, "#c86a4a", .3);
      });
      t.grad(100, H, ["#e8b46a", "#dca05a", "#c98a48"]);
      for (let i = 0; i < 90; i++) { const x = R() * W, y = 104 + R() * 56; t.px(x, y, "#a8703a"); }
      for (let i = 0; i < 12; i++) { const x = R() * W, y = 112 + R() * 44; t.rect(x, y, 3, 2, "#8a6a4a"); t.px(x, y, "#b8987a"); }
      const sx = 90, sy = 100;                               // салун
      t.rect(sx, sy - 40, 70, 40, "#7a4424"); t.rect(sx + 10, sy - 56, 50, 16, "#7a4424");
      for (let y = sy - 56; y < sy; y += 3) t.rect(sx + (y < sy - 40 ? 10 : 0), y, y < sy - 40 ? 50 : 70, 1, "#6a3a1e");
      t.rect(sx + 14, sy - 52, 42, 9, "#e8d0a0"); for (let i = 0; i < 6; i++) t.rect(sx + 17 + i * 6, sy - 50, 4, 5, "#5a2a12");
      t.rect(sx - 4, sy - 22, 78, 3, "#4a2612"); for (let x = sx - 2; x < sx + 72; x += 12) t.rect(x, sy - 19, 2, 19, "#4a2612");
      [[sx + 6, sy - 34], [sx + 52, sy - 34]].forEach(([wx, wy]) => { t.rect(wx, wy, 12, 9, "#ffd27a"); t.rect(wx + 5, wy, 2, 9, "#4a2612"); });
      t.rect(sx + 28, sy - 16, 14, 16, "#2a1408"); t.rect(sx + 28, sy - 12, 6, 8, "#8a5a2a"); t.rect(sx + 36, sy - 12, 6, 8, "#8a5a2a");
      t.rect(sx + 84, sy - 30, 4, 30, "#5a3418"); t.rect(sx + 104, sy - 30, 4, 30, "#5a3418"); t.rect(sx + 80, sy - 52, 32, 24, "#6a3c1c");
      for (let y = sy - 52; y < sy - 28; y += 4) t.rect(sx + 80, y, 32, 1, "#5a3418");
      const cactus = (cx, by, h, s) => {                      // кактус-сагуаро с рёбрами
        const w = 5 * s;
        t.rect(cx, by - h, w, h, "#2f7a3a"); t.rect(cx, by - h, 1, h, "#5aa85a"); t.rect(cx + w - 1, by - h, 1, h, "#1e5a28");
        for (let y = by - h + 2; y < by; y += 3) t.px(cx + 2, y, "#1e5a28");
        t.rect(cx - 6 * s, by - h * .55, 6 * s, 4, "#2f7a3a"); t.rect(cx - 6 * s, by - h * .85, 4, h * .32, "#2f7a3a");
        t.rect(cx + w, by - h * .4, 6 * s, 4, "#2f7a3a"); t.rect(cx + w + 6 * s - 4, by - h * .7, 4, h * .32, "#2f7a3a");
        t.disc(cx + w / 2, by - h, w / 2, "#2f7a3a");
        for (let i = 0; i < 8; i++) t.px(cx - 1 + R() * (w + 2), by - h + R() * h, "#d8f0b0");
      };
      cactus(30, 146, 40, 1.4); cactus(276, 152, 34, 1.2); cactus(226, 122, 18, .8);
      t.disc(190, 144, 5, "#b07a3a"); for (let i = 0; i < 10; i++) t.line(190, 144, 190 + (R() - .5) * 12, 144 + (R() - .5) * 12, "#8a5a2a");
      for (let x = 0; x < 80; x += 10) { t.rect(x, 130, 2, 14, "#6a4424"); } t.rect(0, 134, 80, 1, "#6a4424"); t.rect(0, 139, 80, 1, "#6a4424");
    },
    office(ctx, R, t) {                                     // КОРПОРАТИВ: стеклянные башни и рабочий стол
      t.grad(0, H, ["#5ab4f0", "#78c4f6", "#98d4fa", "#bce4fe", "#dcf2ff"]);
      for (let i = 0; i < 6; i++) { const x = R() * W, y = 8 + R() * 30; for (let k = 0; k < 4; k++) { t.disc(x + k * 8, y + (k % 2), 5 + (k % 2), "#e8f4ff"); t.disc(x + k * 8, y - 1 + (k % 2), 4 + (k % 2), "#ffffff"); } }
      for (let x = 0; x < W;) {
        const w = 26 + Math.floor(R() * 24), h = 60 + Math.floor(R() * 70), y = 132 - h;
        building(t, R, x, y, w, h, { wall: R() < .5 ? "#3a7cbc" : "#2e6aa8", shade: "#25588e", edge: "#8ac4ee", ledge: "#5a9ad0", top: 4, gy: 5, gx: 4, side: 2, ww: 3, wh: 3, bottom: 2,
          lit: .25, lights: ["#d8f0ff", "#ffffff", "#bfe4ff"], dark: "#4a8cc8" });
        for (let i = 0; i < h; i += 1) if ((i + x) % 9 < 2) t.px(x + 2 + ((i * 3) % (w - 4)), y + i, "#9ad0f6");   // блики на стекле
        if (R() < .5) { t.rect(x + w / 2 - 1, y - 12, 2, 12, "#5a6a7a"); t.px(x + w / 2, y - 13, "#ff3b2f"); }
        x += w + 4;
      }
      t.rect(0, 132, W, 28, "#d8ccb4"); t.rect(0, 132, W, 2, "#b8ac94"); t.dither(0, 140, W, 20, "#cbbfa6", .3);
      const mx = 200;                                       // ЭЛТ-монитор с окном Windows
      t.rect(mx, 94, 58, 42, "#e8e0cc"); t.rect(mx, 94, 58, 2, "#f8f4e8"); t.rect(mx + 56, 94, 2, 42, "#b8b0a0");
      t.rect(mx + 5, 99, 48, 32, "#008080");
      t.rect(mx + 10, 104, 34, 22, "#c0c0c0"); t.rect(mx + 10, 104, 34, 4, "#000080"); t.rect(mx + 40, 105, 3, 2, "#c0c0c0");
      for (let i = 0; i < 3; i++) t.rect(mx + 13, 111 + i * 4, 18 + i * 3, 1, "#404040");
      t.rect(mx + 20, 136, 18, 4, "#d8d0bc"); t.rect(mx + 12, 140, 36, 3, "#c8c0ac");
      t.rect(mx - 50, 140, 44, 8, "#e8e0cc"); for (let x = mx - 48; x < mx - 8; x += 4) for (let y = 141; y < 147; y += 2) t.rect(x, y, 3, 1, "#a8a090");
      t.rect(mx + 70, 128, 10, 12, "#ffffff"); t.rect(mx + 80, 131, 3, 5, "#ffffff"); t.rect(mx + 71, 129, 8, 2, "#6a3a1a");
      for (let i = 0; i < 3; i++) t.line(mx + 73 + i * 2, 124, mx + 74 + i * 2, 118, "#ffffffaa");
      t.rect(40, 120, 14, 16, "#b4643a"); t.rect(40, 120, 14, 2, "#d07a4a");                   // растение
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * .35; t.line(47, 120, 47 + Math.cos(a) * 20, 120 + Math.sin(a) * 20, i % 2 ? "#3a9a4a" : "#2e7e3c"); }
      t.rect(100, 136, 30, 10, "#ffffff"); t.rect(104, 134, 30, 10, "#f4f4f4"); for (let y = 136; y < 143; y += 2) t.rect(108, y, 20, 1, "#c0c0d0");
    },
  };
  SCENES.mafia = SCENES.classic;

  const cache = {};
  function scene(key) {
    if (cache[key]) return cache[key];
    const draw = SCENES[key] || SCENES.arcade;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    let seed = 0;
    for (const ch of key) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const R = rng(seed || 7);
    draw(ctx, R, tools(ctx, R));
    cache[key] = c.toDataURL();
    return cache[key];
  }

  /* ---------------------------------------------------------------- пикселизация эмодзи и фото */
  const images = {};
  function drawPix(canvas) {
    const n = Number(canvas.dataset.res || 16);
    canvas.width = n; canvas.height = n;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    if (canvas.dataset.emoji) {
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `${Math.round(n * .86)}px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif`;
      ctx.fillText(canvas.dataset.emoji, n / 2, n / 2 + n * .06);
    } else if (canvas.dataset.src) {
      const src = canvas.dataset.src;
      const paint = (img) => {
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, n, n);
      };
      let img = images[src];
      if (img && img.complete && img.naturalWidth) paint(img);
      else {
        if (!img) { img = new Image(); img.referrerPolicy = "no-referrer"; img.src = src; images[src] = img; }
        img.addEventListener("load", () => paint(img), { once: true });
      }
    }
    canvas.dataset.done = "1";
  }
  function apply(root = document) { root.querySelectorAll("canvas.pix:not([data-done])").forEach(drawPix); }
  const emoji = (e, res = 32, cls = "") => `<canvas class="pix ${cls}" data-res="${res}" data-emoji="${String(e).replace(/"/g, "")}"></canvas>`;
  const photo = (src, res = 48, cls = "") => `<canvas class="pix ${cls}" data-res="${res}" data-src="${String(src).replace(/"/g, "&quot;")}"></canvas>`;

  return { sprite, scene, apply, emoji, photo, SCENES };
})();
