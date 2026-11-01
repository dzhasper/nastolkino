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
    const ridge = (base, amp, f, col, rim, rough = 1, flats = []) => {
      const ph = R() * 100, ph2 = R() * 100;
      const hs = [];
      for (let x = 0; x < W; x++) hs.push(Math.round(base - amp * (.6 * Math.sin(x * f + ph) + .3 * Math.sin(x * f * 2.7 + ph2) + .1 * rough * (R() - .5))));
      flats.forEach(([x0, x1]) => {                         // ровная площадка, чтобы здание стояло на земле, а не висело
        const lvl = Math.round(hs.slice(Math.max(0, x0), Math.min(W, x1)).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(W, x1) - Math.max(0, x0)));
        for (let x = Math.max(0, x0 - 14); x < Math.min(W, x1 + 14); x++) {
          const k = x < x0 ? (x0 - x) / 14 : x >= x1 ? (x - x1 + 1) / 14 : 0;
          hs[x] = Math.round(lvl * (1 - k) + hs[x] * k);
        }
      });
      for (let x = 0; x < W; x++) { rect(x, hs[x], 1, H - hs[x], col); if (rim) px(x, hs[x], rim); }
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
    // мягкая тень под предметом — чтобы он стоял на земле
    const shadow = (cx, y, w, c = "#00000066") => { for (let dy = -1; dy <= 1; dy++) { const ww = w * (1 - Math.abs(dy) * .35); for (let x = -ww / 2; x < ww / 2; x++) if (BAYER[(y + dy) & 3][(Math.round(cx + x)) & 3] < 11 - Math.abs(x) / ww * 10) px(cx + x, y + dy, c); } };
    const glow = (cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y) / r; if (d < 1 && BAYER[(cy + y) & 3][(cx + x) & 3] < (1 - d) * 9) px(cx + x, cy + y, c); } };
    return { rect, px, grad, disc, ball, line, ridge, stars, dither, glow, shadow };
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
      far.forEach((h, x) => { for (let y = h; y < 58; y++) if (y < 56 || BAYER[y & 3][x & 3] < 8) t.px(x, y, y === h ? "#ffffff" : x % 7 < 2 ? "#d8e2ff" : "#f4f8ff"); });
      t.ridge(92, 10, .04, "#3c8c48", "#5cb85c");
      for (let i = 0; i < 40; i++) { const x = R() * W, y = 84 + R() * 12; t.disc(x, y, 3, "#2a6e36"); t.px(x - 1, y - 2, "#4caa58"); }
      const hill = t.ridge(122, 8, .03, "#2f9e44", "#6ed46e", 1, [[190, 280]]);
      t.dither(0, 126, W, 34, "#268a3a", .35);
      const cx = 205, cy = hill[235] + 1;                   // замок стоит на ровной площадке холма
      t.shadow(cx + 28, cy, 84, "#1e6e30");
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
        t.rect(x, H - 30 - h, w, h + 8, "#0c0c0c");
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
        for (let y = 0; y < 36; y++) for (let x = Math.round(-y * .5); x <= y * .5; x++) {
          const k = (1 - Math.abs(x) / (y * .5 + 1)) * (1 - y / 60);
          if (BAYER[(H - 57 + y) & 3][(lx + x) & 3] < k * 9) t.px(lx + x, H - 57 + y, y > 30 ? "#6a5420" : "#4a3c18");
        }
        t.shadow(lx + 1, H - 21, 22, "#5a4a2066");
      });
      t.shadow(216, H - 4, 50, "#000000aa");                 // машина стоит на мостовой
      t.rect(194, H - 15, 44, 9, "#161616"); t.rect(202, H - 22, 26, 7, "#161616"); t.rect(194, H - 15, 44, 1, "#3a3a3a"); t.rect(202, H - 22, 26, 1, "#3a3a3a");
      t.rect(205, H - 20, 9, 4, "#2a2a2a"); t.rect(216, H - 20, 9, 4, "#2a2a2a");
      t.disc(204, H - 6, 3, "#000"); t.disc(228, H - 6, 3, "#000"); t.px(204, H - 6, "#444"); t.px(228, H - 6, "#444");
      t.rect(236, H - 13, 2, 2, "#fff4c0"); t.glow(242, H - 12, 9, "#5a4a20");
      for (let x = 0; x < 44; x++) { const w = Math.round(Math.sqrt(1 - ((x - 22) / 22) ** 2) * 3); t.rect(258 + x, H - 9 - w / 2, 1, w, "#141418"); }   // лужа с отражением луны
      t.rect(270, H - 9, 10, 1, "#7a0a12"); t.rect(273, H - 8, 5, 1, "#5a0610");
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
      t.rect(0, 140, W, 20, "#14061e"); t.rect(0, 140, W, 1, "#ff2bd6"); t.rect(0, 141, W, 1, "#5a1a5a");   // тротуар
      for (let x = 6; x < W; x += 22) t.rect(x, 152, 10, 1, "#3a1a4a");
      const kx = 112;                                        // ларёк стоит на тротуаре
      for (let y = 0; y < 10; y++) for (let x = -y * 2; x < 64 + y * 2; x++) if (BAYER[(150 + y) & 3][(kx + x) & 3] < 6 - y * .5) t.px(kx + x, 150 + y, "#7a5a1a");   // свет витрины на асфальте
      t.shadow(kx + 32, 150, 76, "#000000aa");
      t.rect(kx, 116, 64, 34, "#2a0a3a"); t.rect(kx + 62, 116, 2, 34, "#1a0428"); t.rect(kx - 3, 111, 70, 6, "#ff2bd6"); t.rect(kx - 3, 111, 70, 1, "#ff9af0");
      t.rect(kx + 4, 120, 56, 15, "#ffd400"); t.rect(kx + 4, 135, 56, 3, "#c89a00");
      for (let i = 0; i < 7; i++) t.rect(kx + 6 + i * 8, 122, 5, 10, ["#ff4a4a", "#4aff7a", "#4ab0ff", "#ffffff", "#ff9a3a", "#c84aff", "#ffea4a"][i]);
      for (let i = 0; i < 8; i++) t.rect(kx + 4 + i * 7, 120, 1, 15, "#2a0a3a");
      t.rect(kx + 22, 140, 20, 10, "#14061e"); t.rect(kx + 24, 142, 16, 8, "#ffd400");   // окошко «24 часа»
      const cx = 226;                                        // «девятка» у тротуара
      t.shadow(cx + 28, 151, 62, "#000000aa");
      t.rect(cx, 136, 56, 11, "#3a2a5a"); t.rect(cx, 136, 56, 1, "#7a6aa8"); t.rect(cx + 10, 127, 32, 10, "#3a2a5a"); t.rect(cx + 10, 127, 32, 1, "#7a6aa8");
      t.rect(cx + 12, 129, 13, 7, "#5ab0ff"); t.rect(cx + 27, 129, 13, 7, "#5ab0ff"); t.px(cx + 13, 130, "#c8e8ff"); t.px(cx + 28, 130, "#c8e8ff");
      t.disc(cx + 12, 147, 4, "#0a0212"); t.disc(cx + 44, 147, 4, "#0a0212"); t.disc(cx + 12, 147, 1, "#7a7a8a"); t.disc(cx + 44, 147, 1, "#7a7a8a");
      t.rect(cx + 53, 139, 3, 3, "#fff4c0"); t.rect(cx, 139, 2, 3, "#ff2a2a");
    },
    halloween(ctx, R, t) {                                  // ХЭЛЛОУИН: кладбище, особняк, луна, летучие мыши
      t.grad(0, H, ["#05020a", "#0e0518", "#1a0a2e", "#2a1048", "#3a1660", "#4a1e70"]);
      t.stars(110, 70);
      t.glow(232, 40, 52, "#5a3a7a");
      t.ball(232, 40, 28, "#fff6d8", "#f0deaa", "#c8b07a");
      [[222, 32, 5], [242, 50, 6], [238, 28, 3], [218, 50, 3]].forEach(([x, y, r]) => { t.disc(x, y, r, "#d8c48e"); t.disc(x - 1, y - 1, r - 1, "#e8d4a0"); });
      [[150, 74, 40], [270, 80, 46], [190, 86, 50]].forEach(([cx, cy, cw]) => { for (let k = 0; k < cw; k += 6) t.glow(cx + k, cy, 6, "#3a1e58"); });   // облака ниже луны
      const bat = (bx, by, s) => {
        t.rect(bx - 1, by, 3, 3, "#000"); t.px(bx - 1, by - 1, "#000"); t.px(bx + 1, by - 1, "#000");
        for (let i = 1; i <= 5 * s; i++) { const yy = by + Math.round(Math.sin(i / s) * 2) - 1; t.rect(bx + 1 + i, yy, 1, 2, "#000"); t.rect(bx - 1 - i, yy, 1, 2, "#000"); }
      };
      bat(200, 30, 1); bat(260, 66, 1.4); bat(150, 22, 1); bat(220, 56, 1);
      const hill = t.ridge(96, 14, .02, "#0c0614", "#2a1640", 1, [[50, 122]]);
      const hx = 60, hy = hill[86] + 1;                     // особняк стоит на ровной вершине холма
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
        t.glow(qx, qy, r * 3, "#5a2a10"); t.shadow(qx, qy + r, r * 3, "#00000099");
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
      [[90, 112, 20], [111, 118, 14], [95, 96, 16], [206, 114, 18]].forEach(([cx, cy, s]) => {   // ящики стоят на полу или друг на друге
        t.rect(cx, cy, s, s, "#3a3420"); t.rect(cx, cy, s, 2, "#5a5030"); t.rect(cx + s - 2, cy, 2, s, "#2a2416");
        t.line(cx, cy + 2, cx + s - 1, cy + s - 1, "#2a2416"); t.line(cx + s - 1, cy + 2, cx, cy + s - 1, "#2a2416");
        t.rect(cx + 2, cy + s / 2 - 1, 5, 2, "#f5c400");
      });
      t.shadow(110, 133, 50, "#000000aa"); t.shadow(215, 133, 26, "#000000aa");
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
        t.shadow(cx + w / 2 + 3, by, w * 4, "#8a5a2a99");
        t.rect(cx, by - h, w, h, "#2f7a3a"); t.rect(cx, by - h, 1, h, "#5aa85a"); t.rect(cx + w - 1, by - h, 1, h, "#1e5a28");
        for (let y = by - h + 2; y < by; y += 3) t.px(cx + 2, y, "#1e5a28");
        t.rect(cx - 6 * s, by - h * .55, 6 * s, 4, "#2f7a3a"); t.rect(cx - 6 * s, by - h * .85, 4, h * .32, "#2f7a3a");
        t.rect(cx + w, by - h * .4, 6 * s, 4, "#2f7a3a"); t.rect(cx + w + 6 * s - 4, by - h * .7, 4, h * .32, "#2f7a3a");
        t.disc(cx + w / 2, by - h, w / 2, "#2f7a3a");
        for (let i = 0; i < 8; i++) t.px(cx - 1 + R() * (w + 2), by - h + R() * h, "#d8f0b0");
      };
      cactus(30, 146, 40, 1.4); cactus(276, 152, 34, 1.2); cactus(226, 122, 18, .8);
      t.shadow(191, 149, 14, "#8a5a2a99"); t.disc(190, 144, 5, "#b07a3a"); for (let i = 0; i < 10; i++) t.line(190, 144, 190 + (R() - .5) * 12, 144 + (R() - .5) * 12, "#8a5a2a");
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
    space(ctx, R, t) {                                      // КОСМОС: туманность, планета с кольцом, ракета
      t.grad(0, H, ["#02010a", "#070320", "#0e0632", "#160a3e", "#0a0526"]);
      for (let i = 0; i < 9; i++) { const nx = 30 + R() * 260, ny = 20 + R() * 120; t.glow(nx, ny, 22 + R() * 18, ["#3a1468", "#122a6a", "#5a1450"][i % 3]); }
      t.stars(230, H);
      t.glow(92, 70, 46, "#1a3a8a");
      t.ball(92, 70, 30, "#7ac8ff", "#3a7ad0", "#16307a");
      for (let i = 0; i < 6; i++) { const y = 52 + i * 6; for (let x = 66; x < 120; x++) if (Math.hypot(x - 92, y - 70) < 29 && BAYER[y & 3][x & 3] < 5) t.px(x, y, "#5aa0e8"); }
      for (let a = 0; a < Math.PI * 2; a += .004) {          // кольцо: задняя половина закрыта планетой
        const x = 92 + Math.cos(a) * 52, y = 70 + Math.sin(a) * 11 - Math.cos(a) * 6;
        if (Math.sin(a) < 0 && Math.hypot(x - 92, (y - 70)) < 30) continue;
        t.px(x, y, Math.sin(a * 3) > 0 ? "#ffd8a0" : "#c89a6a"); t.px(x, y + 1, "#7a5a3a");
      }
      t.ball(250, 34, 9, "#e8e0d8", "#a8a098", "#5a5650");
      t.px(247, 31, "#8a8278"); t.px(253, 37, "#8a8278");
      for (let i = 0; i < 7; i++) { const ax = 170 + R() * 130, ay = 90 + R() * 60, r = 2 + R() * 4; t.ball(ax, ay, r, "#8a7a6a", "#5a4a3a", "#2a2018"); }
      const rx = 200, ry = 96;                                // ракета летит вверх вправо
      for (let i = 0; i < 26; i++) t.glow(rx - 8 - i * 1.6, ry + 10 + i * 1.6, 4 - i / 9, i < 8 ? "#ffd166" : "#ff6a3a");
      for (let k = 0; k < 18; k++) for (let w = -4; w <= 4; w++) {
        const x = rx + k * .8 + w * .8, y = ry - k * .8 + w * .8;
        t.px(x, y, w < -2 ? "#c8c8d8" : w > 2 ? "#7a7a90" : "#f4f4ff");
      }
      t.disc(rx + 7, ry - 7, 2, "#3ab0ff"); t.px(rx + 6, ry - 8, "#c8ecff");
      t.line(rx - 4, ry + 1, rx - 8, ry + 5, "#d0263a"); t.line(rx + 1, ry + 5, rx - 3, ry + 9, "#d0263a");
      t.line(rx + 14, ry - 14, rx + 17, ry - 17, "#d0263a");
    },
    winter(ctx, R, t) {                                     // ЗИМНИЙ ЛЕС: закат, ели в снегу, избушка с дымом
      t.grad(0, 110, ["#1a2050", "#2e3a7a", "#5a5aa0", "#a07ab0", "#f0a0a0", "#ffd0a8"]);
      t.stars(50, 30);
      const far = t.ridge(78, 18, .02, "#8a96c8", "#c8d4f4");
      far.forEach((h, x) => { for (let y = h; y < h + 5; y++) if (BAYER[y & 3][x & 3] < 10) t.px(x, y, "#e8eeff"); });
      const pine = (x, by, h, c1, c2, snow) => {               // ель стоит основанием на снегу
        t.rect(x - 1, by - 4, 3, 4, "#3a2418");
        for (let i = 0; i < h; i++) { const w = Math.round((i / h) * h * .42 * (1 + .25 * ((i % 6) / 6))); t.rect(x - w, by - 4 - h + i, w * 2 + 1, 1, (i % 6) < 2 ? c2 : c1); if ((i % 6) === 0 && i > 2) t.rect(x - w, by - 4 - h + i, w * 2 + 1, 1, snow); }
        t.shadow(x, by, h * .8, "#8a9ac866");
      };
      const mid = t.ridge(112, 6, .03, "#c8d4f0", "#ffffff");
      for (let i = 0; i < 16; i++) { const x = 6 + i * 20 + R() * 8; pine(x, mid[Math.min(W - 1, Math.round(x))] + 2, 18 + R() * 10, "#2a4a5a", "#3a5e6a", "#dfe8ff"); }
      const near = t.ridge(140, 5, .025, "#e8eeff", "#ffffff", 1, [[188, 262]]);
      t.dither(0, 146, W, 14, "#c8d4f0", .3);
      const hx = 196, hy = near[220] + 1;                     // избушка на ровном месте
      t.shadow(hx + 28, hy, 70, "#8a9ac899");
      t.rect(hx, hy - 24, 56, 24, "#6a3a22"); for (let y = hy - 24; y < hy; y += 4) t.rect(hx, y, 56, 1, "#4a2614");
      for (let i = 0; i < 18; i++) t.rect(hx - 4 + i * 1.8, hy - 24 - i, 64 - i * 3.6, 1, i < 3 ? "#ffffff" : "#e8eeff");
      t.rect(hx + 40, hy - 46, 7, 14, "#5a3a2a");
      for (let i = 0; i < 14; i++) t.glow(hx + 44 + Math.sin(i / 2) * 4 + i * .6, hy - 50 - i * 3, 3 + i / 5, "#c8c8e0");
      [[hx + 8, hy - 17], [hx + 38, hy - 17]].forEach(([wx, wy]) => { t.glow(wx + 5, wy + 4, 10, "#ffcc6a"); t.rect(wx, wy, 10, 8, "#ffd27a"); t.rect(wx + 4, wy, 2, 8, "#4a2614"); t.rect(wx, wy + 3, 10, 1, "#4a2614"); });
      t.rect(hx + 22, hy - 14, 10, 14, "#3a1e10");
      pine(40, near[40] + 2, 40, "#1e3a48", "#2a4e5a", "#ffffff"); pine(290, near[290] + 2, 46, "#1e3a48", "#2a4e5a", "#ffffff"); pine(150, near[150] + 2, 30, "#1e3a48", "#2a4e5a", "#ffffff");
      for (let i = 0; i < 12; i++) { const fx = 100 + i * 8, fy = 150 + (i % 2) * 2; t.rect(fx, fy, 2, 1, "#a8b4d8"); }
      for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * H; t.px(x, y, "#ffffff"); if (R() < .2) t.px(x + 1, y, "#ffffffaa"); }
    },
    sakura(ctx, R, t) {                                     // САКУРА: Фудзи, пагода, тории, лепестки
      t.grad(0, 112, ["#ffd8e8", "#ffe4ec", "#fff0e8", "#fff8ec"]);
      t.ball(250, 34, 16, "#ff6a5a", "#ff5a4a", "#e84a3a");
      for (let x = 60; x < 260; x++) {                        // Фудзи со снежной шапкой
        const h = Math.round(46 + Math.abs(x - 160) * .62 - Math.max(0, 22 - Math.abs(x - 160)) * .3);
        for (let y = h; y < 112; y++) t.px(x, y, y < 58 + Math.sin(x / 3) * 2 ? "#ffffff" : x > 160 ? "#7a7ab8" : "#8e8ec8");
      }
      t.ridge(104, 6, .03, "#a8c89a", "#c8e0b8");
      t.rect(0, 112, W, 48, "#8ac0d8");                        // озеро с отражением
      for (let y = 114; y < 132; y += 3) for (let x = 0; x < W; x += 1) if (BAYER[y & 3][x & 3] < 3) t.px(x, y, "#c8e8f4");
      t.dither(80, 114, 160, 10, "#9898c8", .3);
      t.rect(0, 132, W, 28, "#6aa85a"); t.rect(0, 132, W, 1, "#8ac87a"); t.dither(0, 140, W, 20, "#5a984a", .3);
      const px0 = 34, py = 132;                               // пагода стоит на берегу
      t.shadow(px0 + 14, py, 46, "#3a6a3a99");
      for (let k = 0; k < 4; k++) {
        const y = py - 12 - k * 14, w = 30 - k * 5;
        t.rect(px0 + 14 - w / 2 + 3, y, w - 6, 12, "#b8302a"); t.rect(px0 + 14 - w / 2 + 6, y + 3, 3, 6, "#ffd27a");
        for (let i = 0; i < 5; i++) t.rect(px0 + 14 - w / 2 - i, y - 4 + i, w + i * 2, 1, "#3a2a3a");
      }
      t.rect(px0 + 13, py - 74, 2, 10, "#3a2a3a");
      const tx = 252;                                         // тории
      t.shadow(tx + 18, py, 52, "#3a6a3a99");
      t.rect(tx, py - 36, 4, 36, "#d0302a"); t.rect(tx + 32, py - 36, 4, 36, "#d0302a");
      t.rect(tx - 6, py - 40, 48, 4, "#d0302a"); t.rect(tx - 8, py - 43, 52, 3, "#2a1a1a"); t.rect(tx - 2, py - 30, 40, 3, "#d0302a");
      const tree = (x, by, h) => {                            // сакура: ствол стоит на земле, крона облаком
        t.shadow(x, by, 30, "#3a6a3a99");
        t.line(x, by, x - 3, by - h, "#4a2a2a"); t.line(x + 1, by, x - 2, by - h, "#4a2a2a"); t.line(x - 2, by - h * .6, x + 10, by - h - 4, "#4a2a2a");
        for (let i = 0; i < 16; i++) t.disc(x - 4 + (R() - .5) * 34, by - h - 2 + (R() - .5) * 16, 4 + R() * 4, i % 3 ? "#ffb0c8" : "#ff8ab0");
        for (let i = 0; i < 30; i++) t.px(x - 4 + (R() - .5) * 36, by - h + (R() - .5) * 18, "#ffe4ee");
      };
      tree(120, 146, 34); tree(206, 150, 28);
      for (let i = 0; i < 70; i++) { const x = R() * W, y = R() * H; t.px(x, y, "#ff9ab8"); t.px(x + 1, y + 1, "#ffc8d8"); }
    },
    ocean(ctx, R, t) {                                      // ПОДВОДНЫЙ МИР: лучи, кораллы, сундук
      t.grad(0, H, ["#4ad0f0", "#1a9ad8", "#0a6ab8", "#08488a", "#062a5a"]);
      for (let i = 0; i < 6; i++) { const x0 = 20 + i * 55; for (let y = 0; y < 120; y++) for (let x = 0; x < 10; x++) if (BAYER[y & 3][(x0 + x + y / 3) & 3] < 4 - y / 40) t.px(x0 + x + y / 3, y, "#9ae8ff"); }
      const floor = t.ridge(142, 5, .03, "#e8c88a", "#fff0c0", 1, [[130, 186]]);
      t.dither(0, 148, W, 12, "#c8a86a", .35);
      const weed = (x, by, h, c) => { for (let y = 0; y < h; y++) { const xx = x + Math.sin(y / 5) * 3; t.rect(xx, by - y, 2, 1, c); if (y % 6 === 0) t.rect(xx + 2, by - y, 3, 1, c); } };
      [10, 26, 74, 214, 290, 306].forEach((x, i) => weed(x, floor[x], 30 + (i * 13) % 26, i % 2 ? "#2a9a5a" : "#3ab86a"));
      const coral = (x, by, c, c2) => {                        // коралл растёт от дна
        const br = (x0, y0, len, ang, d) => { if (d === 0) return; const x1 = x0 + Math.cos(ang) * len, y1 = y0 - Math.sin(ang) * len; t.line(x0, y0, x1, y1, c); t.line(x0 + 1, y0, x1 + 1, y1, c2); br(x1, y1, len * .7, ang + .5, d - 1); br(x1, y1, len * .7, ang - .5, d - 1); };
        br(x, by, 10, Math.PI / 2, 4);
      };
      coral(50, floor[50], "#ff6a8a", "#d04a6a"); coral(250, floor[250], "#ff9a4a", "#d0702a"); coral(104, floor[104], "#c86aff", "#9a4ad0");
      const cx = 140, cy = floor[158] + 1;                    // сундук на дне
      t.glow(cx + 18, cy - 10, 26, "#ffe08a");
      t.shadow(cx + 18, cy, 46, "#8a6a3a99");
      t.rect(cx, cy - 16, 36, 16, "#8a4a1a"); t.rect(cx, cy - 16, 36, 2, "#b86a2a"); t.rect(cx, cy - 9, 36, 2, "#d8a020");
      t.rect(cx + 2, cy - 26, 32, 10, "#9a5420"); t.rect(cx, cy - 22, 36, 1, "#d8a020"); t.rect(cx + 16, cy - 12, 4, 5, "#ffd23f");
      for (let i = 0; i < 9; i++) t.disc(cx + 6 + i * 3, cy - 17 - (i % 3), 2, i % 2 ? "#ffd23f" : "#ffe680");
      const fish = (x, y, c, c2, dir) => { t.disc(x, y, 4, c); t.rect(x - 2, y - 1, 4, 1, c2); for (let i = 0; i < 4; i++) t.rect(x - dir * (5 + i), y - i, 1, i * 2 + 1, c); t.px(x + dir * 2, y - 1, "#000"); };
      fish(70, 60, "#ffb020", "#fff", 1); fish(230, 44, "#ff5a5a", "#fff", -1); fish(196, 80, "#ffd23f", "#2a6aff", 1); fish(40, 96, "#7af0ff", "#2a8aff", -1); fish(290, 100, "#ff8ac8", "#fff", -1);
      for (let i = 0; i < 30; i++) { const x = R() * W, y = R() * 130, r = R() < .3 ? 2 : 1; if (r === 2) { t.px(x - 1, y, "#c8f4ff"); t.px(x + 1, y, "#c8f4ff"); t.px(x, y - 1, "#c8f4ff"); t.px(x, y + 1, "#c8f4ff"); } else t.px(x, y, "#e8fcff"); }
    },
    dungeon(ctx, R, t) {                                    // ПОДЗЕМЕЛЬЕ: кладка, факелы, решётка, сундук
      t.rect(0, 0, W, H, "#16121e");
      for (let y = 0; y < 128; y += 8) for (let x = -((y / 8) % 2) * 8; x < W; x += 16) {
        const c = ["#2a2434", "#2e2838", "#26202e"][Math.floor(R() * 3)];
        t.rect(x + 1, y + 1, 15, 7, c); t.rect(x + 1, y + 1, 15, 1, "#3a3446"); if (R() < .15) t.px(x + 4 + R() * 8, y + 3 + R() * 3, "#1a1622");
        if (R() < .06) t.rect(x + 2, y + 6, 6, 2, "#2a4a2a");
      }
      t.rect(0, 128, W, 32, "#1e1a26");                        // пол из плит
      for (let y = 128; y < H; y += 8) { t.rect(0, y, W, 1, "#100c16"); for (let x = (y / 8) % 2 * 12; x < W; x += 24) t.rect(x, y, 1, 8, "#100c16"); }
      t.rect(0, 128, W, 2, "#3a3446");
      const torch = (x, y) => { t.glow(x, y - 4, 34, "#5a2a10"); t.glow(x, y - 4, 18, "#8a4a14"); t.rect(x - 1, y, 3, 10, "#5a3a1a"); t.rect(x - 3, y + 8, 7, 2, "#3a3a44");
        t.disc(x, y - 3, 3, "#ff8a1a"); t.disc(x, y - 4, 2, "#ffd23f"); t.px(x, y - 7, "#ff5a1a"); };
      torch(60, 54); torch(260, 54);
      const dx = 128;                                          // решётчатая дверь в арке
      for (let y = 0; y < 34; y++) { const w = y < 32 ? Math.round(Math.sqrt(1 - ((32 - y) / 32) ** 2) * 32) : 32; t.rect(dx + 32 - w, 50 + y, w * 2, 1, "#08060c"); }
      t.rect(dx, 82, 64, 46, "#08060c");
      for (let x = dx + 4; x < dx + 64; x += 8) t.rect(x, 52, 2, 76, "#5a5a68");
      for (let y = 70; y < 128; y += 14) t.rect(dx, y, 64, 2, "#5a5a68");
      for (let i = 0; i < 18; i++) { const a = Math.PI * (i / 17); t.rect(dx + 32 - Math.cos(a) * 36 - 2, 84 - Math.sin(a) * 36 - 2, 5, 5, "#3a3446"); }
      const chain = (x, y0, n) => { for (let i = 0; i < n; i++) t.rect(x, y0 + i * 3, 2, 2, i % 2 ? "#6a6a78" : "#4a4a58"); };
      chain(24, 0, 20); chain(296, 0, 16);
      const sx = 222, sy = 128;                                // скелет сидит у стены
      t.shadow(sx + 8, sy, 26, "#00000099");
      t.disc(sx + 6, sy - 26, 5, "#e8e4d8"); t.px(sx + 4, sy - 27, "#16121e"); t.px(sx + 8, sy - 27, "#16121e");
      for (let i = 0; i < 4; i++) t.rect(sx + 2, sy - 19 + i * 3, 9, 1, "#d8d4c8");
      t.rect(sx + 6, sy - 20, 1, 12, "#d8d4c8"); t.line(sx + 2, sy - 18, sx - 4, sy - 8, "#d8d4c8"); t.rect(sx + 3, sy - 8, 14, 2, "#d8d4c8"); t.rect(sx + 15, sy - 6, 2, 6, "#d8d4c8");
      const cx = 66, cy = 128;                                 // сундук с монетами
      t.shadow(cx + 14, cy, 36, "#00000099");
      t.rect(cx, cy - 14, 28, 14, "#6a3a1a"); t.rect(cx, cy - 14, 28, 2, "#8a5a2a"); t.rect(cx, cy - 8, 28, 2, "#9a9aa8");
      t.rect(cx + 12, cy - 10, 4, 5, "#ffd23f"); for (let i = 0; i < 6; i++) t.disc(cx + 4 + i * 4, cy - 15, 2, i % 2 ? "#ffd23f" : "#ffe680");
      t.disc(cx + 36, cy - 2, 2, "#ffd23f"); t.disc(cx + 41, cy - 1, 2, "#ffe680");
    },
    shop(ctx, R, t) {                                       // ЛАВКА ПРИКОЛОВ: полки с товаром, прилавок, вывеска
      t.rect(0, 0, W, H, "#3a2014");
      for (let x = 0; x < W; x += 14) { t.rect(x, 0, 13, 120, ["#4a2a18", "#52301c", "#462816"][Math.floor(R() * 3)]); t.rect(x + 13, 0, 1, 120, "#2a140a"); if (R() < .5) t.px(x + 4, 10 + R() * 100, "#2a140a"); }
      t.glow(160, 40, 70, "#6a3a14");
      const shelf = (y) => { t.rect(8, y, 304, 4, "#7a4a24"); t.rect(8, y, 304, 1, "#a8703a"); t.rect(8, y + 4, 304, 2, "#2a140a"); };
      [46, 84].forEach(shelf);
      const items = (y) => {                                    // товар стоит на полке
        for (let x = 14; x < 300;) {
          const k = Math.floor(R() * 5), c = ["#ff4a8a", "#4ad0ff", "#7aff6a", "#ffd23f", "#c86aff", "#ff8a3a"][Math.floor(R() * 6)];
          if (k === 0) { t.rect(x, y - 12, 8, 12, c); t.rect(x + 2, y - 15, 4, 3, "#e8e0d0"); t.rect(x + 1, y - 10, 2, 6, "#ffffff88"); x += 12; }
          else if (k === 1) { t.ball(x + 5, y - 6, 5, "#ffffff", c, "#00000066"); t.rect(x + 4, y - 14, 3, 3, "#8a5a2a"); x += 13; }
          else if (k === 2) { t.rect(x, y - 9, 12, 9, c); t.rect(x, y - 9, 12, 2, "#ffffff55"); t.rect(x + 5, y - 9, 2, 9, "#ffd23f"); x += 16; }
          else if (k === 3) { t.rect(x, y - 16, 10, 16, "#e8e0d0"); t.rect(x + 1, y - 15, 8, 14, c); t.rect(x + 3, y - 12, 4, 4, "#ffffff"); x += 14; }
          else { for (let i = 0; i < 3; i++) t.rect(x + i, y - 3 - i * 3, 9 - i * 2 + 2, 3, "#ffd23f"); t.rect(x, y - 3, 11, 1, "#c8900a"); x += 15; }
        }
      };
      items(46); items(84);
      t.rect(100, 4, 120, 22, "#2a140a"); t.rect(102, 6, 116, 18, "#ffd23f"); t.rect(104, 8, 112, 14, "#c8302a");   // вывеска
      t.rect(124, 0, 2, 4, "#1a0a04"); t.rect(194, 0, 2, 4, "#1a0a04");
      [[112, 11], [196, 11]].forEach(([x, y]) => { t.disc(x, y + 4, 4, "#ffd23f"); t.disc(x, y + 4, 2, "#c8900a"); });
      for (let i = 0; i < 9; i++) t.rect(124 + i * 8, 12, 5, 6, "#ffe8a0");
      const lamp = (x) => { t.rect(x, 0, 1, 18, "#1a0a04"); t.rect(x - 4, 18, 9, 7, "#2a140a"); t.rect(x - 3, 19, 7, 5, "#ffd27a"); t.glow(x, 22, 26, "#8a5a1a"); };
      lamp(40); lamp(280);
      t.rect(0, 120, W, 40, "#5a3018"); t.rect(0, 120, W, 3, "#b8783a"); t.rect(0, 123, W, 2, "#2a140a");   // прилавок
      for (let x = 0; x < W; x += 40) t.rect(x, 125, 1, 35, "#3a1e0e");
      t.dither(0, 140, W, 20, "#4a2612", .4);
      for (let i = 0; i < 14; i++) { const x = 130 + (i % 5) * 7 + Math.floor(i / 5) * 3, y = 118 - Math.floor(i / 5) * 3; t.disc(x, y, 3, i % 2 ? "#ffd23f" : "#ffe680"); t.px(x - 1, y - 1, "#fff8c0"); }
      t.rect(220, 104, 26, 16, "#c8c8d0"); t.rect(220, 104, 26, 3, "#e8e8f0"); t.rect(224, 109, 18, 6, "#2a8a4a"); t.rect(228, 98, 8, 6, "#c8c8d0");   // касса
      t.rect(60, 108, 18, 12, "#8a4a1a"); t.rect(60, 108, 18, 2, "#ffd23f"); t.rect(67, 112, 4, 4, "#ffd23f");
    },
    studio(ctx, R, t) {                                     // МАСТЕРСКАЯ ХУДОЖНИКА: мольберт, окно, краски
      t.rect(0, 0, W, 118, "#f2d9b0");
      for (let x = 0; x < W; x += 16) { t.rect(x, 0, 8, 118, "#eccf9f"); }
      t.rect(0, 110, W, 8, "#c8946a"); t.rect(0, 110, W, 1, "#e8b88a");
      const wx = 22;                                          // окно с видом на город
      t.rect(wx - 4, 14, 84, 70, "#8a5a3a"); t.grad(18, 80, ["#7ac8ff", "#a8dcff", "#ffe0b0"], wx, wx + 76);
      t.disc(wx + 58, 34, 7, "#fff4b0");
      for (let i = 0; i < 6; i++) { const bx = wx + i * 13, bh = 12 + (i * 7) % 18; t.rect(bx, 80 - bh, 11, bh, ["#8a9ac8", "#7a8ab8", "#9aaad0"][i % 3]); for (let y = 80 - bh + 3; y < 78; y += 4) t.px(bx + 3, y, "#ffe8a0"); }
      t.rect(wx + 36, 18, 4, 62, "#8a5a3a"); t.rect(wx, 46, 76, 3, "#8a5a3a"); t.rect(wx - 6, 82, 88, 4, "#6a4028");
      t.rect(wx + 4, 76, 10, 6, "#c8562a"); for (let i = 0; i < 5; i++) t.line(wx + 9, 76, wx + 4 + i * 3, 66, "#3a9a4a");   // цветок на подоконнике
      [[124, 18, 30, 22, "#ff77a8"], [160, 26, 22, 28, "#29adff"], [290, 16, 22, 30, "#ffec27"]].forEach(([x, y, w, h, c]) => {   // картины на стене
        t.rect(x - 2, y - 2, w + 4, h + 4, "#6a4028"); t.rect(x, y, w, h, "#fff1e8"); t.disc(x + w / 2, y + h / 2, Math.min(w, h) / 3, c); t.rect(x + 2, y + h - 6, w - 4, 3, "#00e436");
      });
      t.rect(0, 118, W, 42, "#a8703a");                        // деревянный пол
      for (let y = 118; y < H; y += 7) { t.rect(0, y, W, 1, "#8a5a2a"); for (let x = (y * 13) % 40; x < W; x += 40) t.rect(x, y, 1, 7, "#8a5a2a"); }
      t.dither(0, 140, W, 20, "#9a6432", .3);
      const ex = 196;                                         // мольберт с холстом стоит на полу
      t.shadow(ex + 30, 150, 74, "#5a3a1a99");
      t.line(ex + 6, 150, ex + 24, 40, "#6a4028"); t.line(ex + 7, 150, ex + 25, 40, "#6a4028");
      t.line(ex + 54, 150, ex + 36, 40, "#6a4028"); t.line(ex + 55, 150, ex + 37, 40, "#6a4028");
      t.line(ex + 30, 40, ex + 30, 146, "#5a3420");
      t.rect(ex + 4, 104, 52, 4, "#7a4a2a");
      t.rect(ex - 2, 44, 64, 60, "#fff8ec"); t.rect(ex - 2, 44, 64, 1, "#d8c8b0"); t.rect(ex + 61, 44, 1, 60, "#d8c8b0");
      const cx = ex + 30, cy = 78;                              // на холсте — котик (как будто нарисован в игре)
      t.disc(cx, cy, 14, "#ffa300"); t.disc(cx, cy, 12, "#ffb83a");
      for (let i = 0; i < 6; i++) { t.px(cx - 9 + i, cy - 16 + i, "#ffa300"); t.px(cx + 9 - i, cy - 16 + i, "#ffa300"); t.rect(cx - 10, cy - 15 + i, i + 1, 1, "#ffa300"); t.rect(cx + 10 - i, cy - 15 + i, i + 1, 1, "#ffa300"); }
      t.rect(cx - 6, cy - 3, 3, 4, "#000"); t.rect(cx + 4, cy - 3, 3, 4, "#000"); t.px(cx - 5, cy - 3, "#fff"); t.px(cx + 5, cy - 3, "#fff");
      t.rect(cx - 1, cy + 2, 3, 2, "#ff004d"); t.line(cx - 4, cy + 6, cx, cy + 5, "#000"); t.line(cx, cy + 5, cx + 4, cy + 6, "#000");
      [[-16, 1], [-16, 4], [16, 1], [16, 4]].forEach(([dx, dy]) => t.line(cx + dx * .6, cy + dy, cx + dx * 1.2, cy + dy - 1 + (dy > 2 ? 2 : 0), "#000"));
      t.rect(ex + 2, 48, 6, 3, "#29adff"); t.rect(ex + 50, 96, 8, 3, "#00e436");
      const px0 = 122, py = 150;                              // палитра и банки с краской на полу
      t.shadow(px0 + 16, py, 40, "#5a3a1a99");
      for (let y = -8; y <= 0; y++) { const w = Math.round(Math.sqrt(1 - (y / 9) ** 2) * 18); t.rect(px0 + 16 - w, py - 4 + y, w * 2, 1, "#e8c890"); }
      [["#ff004d", -10], ["#29adff", -3], ["#ffec27", 4], ["#00e436", 11]].forEach(([c, dx]) => t.disc(px0 + 16 + dx, py - 8, 2, c));
      [[92, "#ff77a8"], [272, "#29adff"], [288, "#ffec27"]].forEach(([x, c]) => {
        t.shadow(x + 7, 151, 20, "#5a3a1a99");
        t.rect(x, 136, 14, 15, "#c2c3c7"); t.rect(x, 136, 14, 2, "#e8e8ee"); t.rect(x, 136, 14, 4, c); t.rect(x + 1, 140, 2, 10, "#ffffff88");
        t.rect(x + 3, 151, 4, 1, c);
      });
      t.rect(70, 132, 12, 18, "#7ac8ff"); t.rect(70, 132, 12, 2, "#c8ecff"); t.shadow(76, 151, 18, "#5a3a1a99");     // стакан с кистями
      [[72, "#ff004d"], [75, "#ffa300"], [79, "#29adff"]].forEach(([x, c], i) => { t.rect(x, 116 - i * 3, 2, 18 + i * 3, "#8a5a2a"); t.rect(x, 113 - i * 3, 2, 4, c); });
    },
    cellar(ctx, R, t) {                                     // ПОДВАЛ «ПОСЛЕДНЕГО ЗАРЯДА»: стол, лампа, револьвер, кровь
      t.rect(0, 0, W, H, "#070504");
      for (let y = 0; y < 118; y += 6) for (let x = -((y / 6) % 2) * 6; x < W; x += 12) {   // кирпич во тьме
        const d = Math.hypot((x - 160) / 1.6, y - 40) / 150;
        const c = d < .5 ? "#2a1a14" : d < .75 ? "#1c120e" : "#120c0a";
        t.rect(x + 1, y + 1, 11, 5, c);
      }
      t.rect(0, 118, W, 42, "#100c0a"); t.dither(0, 118, W, 42, "#1e1814", .3);
      t.rect(40, 18, 4, 60, "#14100c"); t.rect(36, 16, 260, 3, "#1e1810"); t.rect(36, 22, 260, 2, "#18140e");   // трубы
      for (let i = 0; i < 40; i++) t.px(60 + R() * 200, 30 + R() * 80, "#3a0a0a");
      for (let k = 0; k < 3; k++) { const x = 70 + k * 90 + R() * 20, y = 40 + R() * 30; for (let i = 0; i < 24; i++) t.px(x + (R() - .5) * 14, y + (R() - .5) * 10, "#5a0810"); for (let i = 0; i < 3; i++) t.rect(x - 4 + i * 4, y, 1, 8 + R() * 14, "#4a0610"); }
      t.rect(159, 0, 2, 34, "#0a0a0a");                         // лампа и световой конус
      for (let i = 0; i < 9; i++) t.rect(160 - 4 - i, 34 + i, 8 + i * 2, 1, "#2a3a2a");
      t.rect(157, 43, 6, 3, "#ffe0a0"); t.glow(160, 46, 20, "#6a4a20");
      for (let y = 46; y < 130; y++) { const w = (y - 46) * .95; for (let x = -w; x <= w; x++) { const k = (1 - Math.abs(x) / (w + 1)) * (1 - (y - 46) / 120); if (BAYER[y & 3][(160 + Math.round(x)) & 3] < k * 7) t.px(160 + x, y, "#3a2a14"); } }
      t.shadow(160, 150, 190, "#00000099");                    // стол
      for (let y = 0; y < 22; y++) { const w = 92 - Math.abs(y - 10) * .6; t.rect(160 - w, 110 + y, w * 2, 1, y < 2 ? "#6a4428" : y < 16 ? (y % 5 ? "#3e2614" : "#32200f") : "#1a100a"); }
      t.rect(150, 132, 20, 20, "#1a100a");
      for (let i = 0; i < 40; i++) t.px(110 + R() * 30, 114 + R() * 10, "#6a0810");    // кровь на столе
      t.rect(112, 118, 18, 3, "#5a0810");
      const gx = 150, gy = 116;                                 // револьвер
      t.rect(gx, gy, 34, 4, "#5a5a62"); t.rect(gx, gy, 34, 1, "#9a9aa8"); t.rect(gx + 30, gy - 2, 12, 8, "#2a2a30"); t.rect(gx + 33, gy - 3, 7, 10, "#6a6a74");
      t.rect(gx + 40, gy + 2, 10, 5, "#4a2a16"); t.rect(gx + 42, gy + 6, 8, 5, "#3a2010");
      [[198, 116], [206, 117], [214, 115]].forEach(([x, y], i) => { t.rect(x, y, 3, 6, i === 1 ? "#c8a040" : "#b0101a"); t.rect(x, y, 3, 1, "#e8c060"); });   // заряды
      const fig = (x, flip) => {                                 // силуэты за столом
        t.rect(x - 14, 60, 28, 50, "#0c0908"); t.rect(x - 9, 40, 18, 20, "#0e0b0a"); t.rect(x - 12, 37, 24, 4, "#060504");
        t.rect(x - 5 + flip, 48, 2, 2, "#c01020"); t.rect(x + 2 + flip, 48, 2, 2, "#c01020");
      };
      fig(70, 1); fig(250, -1);
      t.dither(0, 0, W, H, "#00000066", .15);
    },
    casino(ctx, R, t) {                                     // ПОДПОЛЬНОЕ КАЗИНО: сукно, карты, фишки, лампа
      t.rect(0, 0, W, H, "#0c0806");
      for (let x = 0; x < W; x += 10) { t.rect(x, 0, 6, 92, x % 20 ? "#3a0a10" : "#4a0e14"); t.rect(x + 6, 0, 4, 92, "#22060a"); }   // бархатные шторы
      t.rect(0, 88, W, 6, "#6a4a1a"); t.rect(0, 88, W, 1, "#c8a040");
      t.rect(159, 0, 2, 22, "#0a0a0a");
      for (let i = 0; i < 10; i++) t.rect(160 - 6 - i * 1.6, 22 + i, 12 + i * 3.2, 1, "#1e3a1e");
      t.rect(156, 32, 8, 3, "#ffe8a0"); t.glow(160, 36, 24, "#6a5a20");
      for (let y = 36; y < 128; y++) { const w = (y - 36) * 1.15; for (let x = -w; x <= w; x++) { const k = (1 - Math.abs(x) / (w + 1)) * (1 - (y - 36) / 140); if (BAYER[y & 3][(160 + Math.round(x)) & 3] < k * 5) t.px(160 + x, y, "#3a3418"); } }
      t.shadow(160, 152, 260, "#00000099");
      for (let y = 0; y < 44; y++) {                              // стол с сукном, видим сверху-сбоку
        const w = 150 - Math.pow(Math.abs(y - 22) / 22, 2) * 30;
        t.rect(160 - w, 102 + y, w * 2, 1, y < 3 || y > 40 ? "#5a3418" : (y + (y >> 2)) % 7 ? "#14602e" : "#106028");
      }
      t.dither(20, 106, 280, 36, "#1a7036", .25);
      for (let x = 30; x < 290; x += 3) t.px(x, 104, "#c8a040");
      const card = (x, y, red, back) => { t.rect(x, y, 14, 19, "#1a1a1a"); t.rect(x + 1, y + 1, 12, 17, back ? "#8a1a1a" : "#f4f0e4");
        if (back) { for (let i = 0; i < 6; i++) t.rect(x + 3, y + 3 + i * 2, 8, 1, "#c84040"); } else { t.rect(x + 3, y + 3, 3, 4, red ? "#d0101a" : "#1a1a1a"); t.rect(x + 6, y + 9, 3, 3, red ? "#d0101a" : "#1a1a1a"); } };
      card(118, 110, true); card(134, 112, false); card(180, 110, false, true); card(196, 113, true);
      card(60, 118, false); card(76, 119, true, true); card(236, 118, true); card(252, 120, false, true);
      const stack = (x, y, n, c) => { for (let i = 0; i < n; i++) { t.rect(x, y - i * 2, 12, 3, c); t.rect(x, y - i * 2, 12, 1, "#ffffff55"); t.px(x + 3, y - i * 2 + 1, "#ffffff"); t.px(x + 8, y - i * 2 + 1, "#ffffff"); } };
      stack(150, 134, 6, "#d0101a"); stack(164, 136, 4, "#1a5ad0"); stack(156, 140, 8, "#e8c040"); stack(100, 132, 3, "#1a1a1a"); stack(214, 134, 5, "#2a8a3a");
      [[40, 64], [280, 64]].forEach(([x, y]) => { t.rect(x - 9, y, 18, 28, "#0c0908"); t.rect(x - 6, y - 14, 12, 14, "#0e0b0a"); t.rect(x - 8, y - 16, 16, 3, "#060504"); t.rect(x - 3, y - 8, 2, 1, "#c8a040"); t.rect(x + 1, y - 8, 2, 1, "#c8a040"); });
      for (let i = 0; i < 20; i++) t.px(R() * W, 96 + R() * 4, "#c8a04066");
    },
  };
  // ТРОН СОЗДАТЕЛЯ (только у администратора): чёрный зал, колонны, трон, чаши с чёрно-белым пламенем
  SCENES.throne = (ctx, R, t) => {
    t.grad(0, H, ["#000000", "#08080a", "#121216", "#1a1a20", "#0a0a0c"]);
    for (let i = 0; i < 60; i++) t.px(R() * W, R() * 70, R() < .3 ? "#ffffff" : "#6a6a72");
    [[30, 12], [86, 16], [234, 16], [290, 12]].forEach(([x, w]) => {               // колонны
      t.rect(x - w / 2, 18, w, 122, "#1e1e24"); t.rect(x - w / 2, 18, 2, 122, "#3a3a44"); t.rect(x + w / 2 - 2, 18, 2, 122, "#0c0c10");
      t.rect(x - w / 2 - 3, 14, w + 6, 5, "#2e2e36"); t.rect(x - w / 2 - 3, 138, w + 6, 5, "#2e2e36");
    });
    t.glow(160, 70, 70, "#2a2a32");
    t.rect(0, 140, W, 20, "#0e0e12"); t.dither(0, 140, W, 20, "#1c1c22", .4);
    for (let y = 0; y < 18; y++) t.rect(160 - 26 - y * 1.5, 142 + y, 52 + y * 3, 1, y % 3 ? "#1a1a1e" : "#24242a");   // ковёр-ступени
    t.rect(132, 48, 56, 76, "#141418"); t.rect(132, 48, 56, 2, "#e8e8e8"); t.rect(132, 48, 2, 76, "#e8e8e8"); t.rect(186, 48, 2, 76, "#e8e8e8");   // спинка трона
    [[132, 40], [160, 30], [186, 40]].forEach(([x, y]) => { t.rect(x - 4, y, 8, 10, "#e8e8e8"); t.rect(x - 2, y - 4, 4, 4, "#ffffff"); });         // зубцы-короны
    t.rect(138, 58, 44, 50, "#0a0a0c"); t.glow(160, 80, 18, "#3a3a44");
    t.rect(124, 104, 72, 12, "#1e1e24"); t.rect(124, 104, 72, 2, "#bdbdbd"); t.rect(118, 96, 8, 30, "#18181c"); t.rect(194, 96, 8, 30, "#18181c");
    t.rect(126, 116, 68, 24, "#101014"); t.rect(126, 116, 68, 1, "#6a6a72");
    for (const cx of [58, 262]) {                                                  // чаши с чёрно-белым огнём
      t.rect(cx - 10, 112, 20, 4, "#3a3a44"); t.rect(cx - 7, 116, 14, 4, "#2a2a32"); t.rect(cx - 2, 120, 4, 20, "#2a2a32"); t.rect(cx - 8, 138, 16, 3, "#3a3a44");
      t.glow(cx, 100, 22, "#5a5a62");
      for (let i = 0; i < 26; i++) { const x = cx - 8 + R() * 16, h = 6 + R() * 18; for (let k = 0; k < h; k++) t.px(x + Math.sin(k * .5 + i) * 1.2, 111 - k, k > h * .7 ? "#ffffff" : k > h * .4 ? "#c8c8c8" : "#6a6a72"); }
    }
    for (let i = 0; i < 9; i++) { const x = 70 + i * 22; t.rect(x, 150, 4, 1, "#ffffff88"); t.rect(x + 1, 149, 2, 3, "#ffffff55"); }   // светящиеся знаки на полу
    t.dither(0, 0, W, H, "#00000055", .12);
  };
  // ---- сезонные фоны
  SCENES.s_ice = (ctx, R, t) => {                                 // СЕВЕРНОЕ СИЯНИЕ: ночь, ленты сияния, снежные холмы, ели
    t.grad(0, 110, ["#020814", "#06142a", "#0a2240", "#123458", "#1c4a70"]);
    t.stars(120, 80);
    for (let band = 0; band < 3; band++) for (let x = 0; x < W; x++) {
      const y0 = 26 + band * 14 + Math.sin(x * .03 + band * 2) * 10 + Math.sin(x * .011) * 6, h = 16 + Math.sin(x * .05 + band) * 6;
      for (let k = 0; k < h; k++) if (BAYER[(Math.round(y0) + k) & 3][x & 3] < (1 - k / h) * 12) t.px(x, y0 + k, [ "#1affb0", "#2ad8ff", "#7a5aff"][band]);
    }
    t.ridge(118, 14, .02, "#c8e4f4", "#ffffff"); t.ridge(132, 8, .05, "#a8c8e0", "#e8f4ff");
    t.rect(0, 136, W, 24, "#dceef8"); t.dither(0, 136, W, 24, "#b8d4e8", .3);
    for (let i = 0; i < 14; i++) { const x = 8 + i * 23 + R() * 8, h = 18 + R() * 16; for (let k = 0; k < h; k++) { const w = (k / h) * 7; t.rect(x - w, 138 - h + k, w * 2 + 1, 1, k % 4 === 0 ? "#e8f4ff" : "#0e2a24"); } }
    for (let i = 0; i < 60; i++) t.px(R() * W, R() * H, "#ffffffcc");
  };
  SCENES.s_moon = (ctx, R, t) => {                                // КРОВАВАЯ ЛУНА: багровое небо, огромная луна, кладбище, мёртвые деревья, мыши
    t.grad(0, 130, ["#0a0004", "#1e0208", "#3a0410", "#5a0816", "#2a0408"]);
    t.glow(220, 48, 46, "#6a0a14"); t.disc(220, 48, 26, "#c8101e"); t.disc(214, 42, 8, "#e8303a"); t.disc(230, 56, 5, "#a00c18"); t.disc(226, 38, 3, "#a00c18");
    t.ridge(126, 10, .03, "#14020a", "#2a0410");
    t.rect(0, 132, W, 28, "#0c0204"); t.dither(0, 132, W, 28, "#1a0408", .3);
    [[40, 1], [96, -1], [276, 1]].forEach(([x, s2]) => { t.rect(x, 80, 3, 54, "#070102"); for (let k = 0; k < 4; k++) t.line(x + 1, 92 + k * 9, x + 1 + s2 * (12 - k * 2), 84 + k * 9, "#070102"); });
    for (let i = 0; i < 7; i++) { const x = 120 + i * 22 + R() * 6, h = 10 + R() * 6; t.rect(x, 134 - h, 3, h, "#1a0a0c"); t.rect(x - 3, 134 - h + 3, 9, 2, "#1a0a0c"); }
    for (let i = 0; i < 6; i++) { const x = 60 + R() * 200, y = 20 + R() * 50; t.rect(x - 3, y, 7, 1, "#070102"); t.px(x - 4, y - 1, "#070102"); t.px(x + 4, y - 1, "#070102"); }
  };
  SCENES.s_neon = (ctx, R, t) => {                                // НЕОН-СИТИ: ночь, небоскрёбы с неоновыми окнами, вывески, дождь
    t.grad(0, H, ["#0a0418", "#140830", "#22104a", "#2e1458", "#120620"]);
    t.glow(160, 120, 90, "#3a0a4a");
    for (let i = 0; i < 16; i++) {
      const x = i * 21 + R() * 6, w = 14 + R() * 10, h = 50 + R() * 80, top = 150 - h, col = R() < .5 ? "#00e5ff" : "#ff2bd6";
      t.rect(x, top, w, h, i % 2 ? "#0c0618" : "#120a22"); t.rect(x, top, w, 1, col);
      for (let y = top + 4; y < 146; y += 5) for (let k = x + 2; k < x + w - 2; k += 4) if (R() < .45) t.rect(k, y, 2, 2, R() < .5 ? col : "#ffe14d");
    }
    [[54, 70, "#ff2bd6"], [200, 56, "#00e5ff"], [262, 84, "#ffe14d"]].forEach(([x, y, c]) => { t.rect(x, y, 30, 10, "#05020a"); t.rect(x, y, 30, 1, c); t.rect(x, y + 9, 30, 1, c); t.rect(x + 4, y + 4, 22, 2, c); });
    t.rect(0, 150, W, 10, "#08040e"); for (let x = 0; x < W; x += 3) if (R() < .4) t.px(x, 152 + R() * 6, R() < .5 ? "#00e5ff66" : "#ff2bd666");
    for (let i = 0; i < 120; i++) { const x = R() * W, y = R() * 150; t.px(x, y, "#9ad8ff55"); t.px(x - 1, y + 2, "#9ad8ff33"); }
  };
  SCENES.s_dragon = (ctx, R, t) => {                              // ХРАМ ДРАКОНА: закатное небо, горы, пагода, фонари, золотое солнце
    t.grad(0, 120, ["#2a0610", "#6a1018", "#b8301e", "#e8702a", "#ffb84a"]);
    t.glow(250, 70, 40, "#ffd890"); t.disc(250, 70, 18, "#ffe8a0");
    t.ridge(104, 26, .015, "#5a1a20", "#8a2a28"); t.ridge(118, 14, .04, "#3a0e14", "#5a1a1c");
    t.rect(0, 132, W, 28, "#1a0608"); t.dither(0, 132, W, 28, "#2a0c0c", .3);
    const px0 = 110;                                               // пагода
    [[0, 64, 40], [24, 52, 34], [46, 40, 28]].forEach(([dy, w, top]) => { t.rect(px0 - w / 2, 132 - dy - 10, w, 10, "#3a0a0c"); t.rect(px0 - w / 2 - 6, 132 - dy - 12, w + 12, 3, "#7a1418"); t.px(px0 - w / 2 - 7, 132 - dy - 13, "#ffd23f"); t.px(px0 + w / 2 + 6, 132 - dy - 13, "#ffd23f"); });
    t.rect(px0 - 1, 62, 2, 12, "#ffd23f");
    for (let i = 0; i < 9; i++) { const x = 20 + i * 34 + R() * 6, y = 20 + (i % 3) * 14 + R() * 10; t.line(x, 0, x, y, "#2a0a0a"); t.rect(x - 3, y, 7, 8, "#e8202a"); t.rect(x - 3, y + 2, 7, 1, "#ffd23f"); t.glow(x, y + 4, 7, "#ff8a3a"); }
    for (let i = 0; i < 30; i++) t.px(R() * W, 90 + R() * 40, "#ffd23f88");
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
