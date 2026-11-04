/* Подвал в 3D: «Последний заряд» (дробовик в центре стола на 2–4), «Русская рулетка» (револьвер, большой круглый стол на 2–6)
   и «Верю — не верю» (карты: у каждого свой револьвер, над столом висит карта, которую требует стол).
   Во время партии сцена — на весь экран, горизонтально (если телефон держат вертикально, страница повёрнута: body.cfs-rot).
   Стиль — игры конца 90-х: низкие полигоны, текстуры 32×32 без сглаживания, «дрожащие» вершины, кадр 240 px с урезанными цветами.
   Люди — js/cellar-people.js. Подписи (имена, предметы) — обычный HTML поверх сцены.
   Важное правило: состояние стола (сердца, звёздочки, раны, смерть) меняется только когда доиграла анимация —
   экран держит очередь (js/roulette-ui.js), а сколько длится анимация события, говорит Cellar.timing(e). */
const Cellar = (() => {
  "use strict";
  let T = null;                                              // THREE после загрузки
  let renderer, scene, camera, rt, post, postScene, postCam, raf = 0, host = null, canvas = null, labelLayer = null;
  let W = 240, H = 240, clock0 = 0, lastDraw = 0;
  const state = { mode: "shotgun", seats: [], figs: {}, me: null, gunYaw: 0, shake: 0, flash: 0, hurt: 0, flicker: 0, smoke: [], dust: null, view: null, evAim: null };
  let gun, rev, lamp, spot, bulb, redLight, candleLight, roomGroup, figGroup, decals, tableGroup;
  const api = { onPick: null, onPickItem: null, onPickGun: null };
  const P = () => window.CellarPeople;

  /* ---------------------------------------------------------------- загрузка three.js по требованию */
  let waiting = null;
  function load(cb) {
    if (window.THREE) { T = T || window.THREE; return cb(); }
    if (waiting) return waiting.push(cb);
    waiting = [cb];
    const s = document.createElement("script");
    s.src = "vendor/three.min.js";
    s.onload = () => { T = window.THREE; const w = waiting; waiting = null; w.forEach((f) => f()); };
    s.onerror = () => { const w = waiting; waiting = null; s.remove(); w.forEach((f) => f(new Error("Не удалось загрузить 3D"))); };
    document.head.appendChild(s);
  }

  /* ---------------------------------------------------------------- пиксельные текстуры, нарисованные кодом */
  function tex(size, draw, rep = 1) {
    const c = document.createElement("canvas"); c.width = c.height = size;
    const g = c.getContext("2d"); draw(g, size);
    const t = new T.CanvasTexture(c);
    t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep);
    return t;
  }
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const noise = (g, s, base, spread, n) => { for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = base + (rnd() - .5) * spread; g.fillStyle = `rgb(${v * n[0] | 0},${v * n[1] | 0},${v * n[2] | 0})`; g.fillRect(x, y, 1, 1); } };
  const TEX = {
    brick: () => tex(32, (g, s) => {
      noise(g, s, 70, 18, [1, .62, .5]);
      g.fillStyle = "#1a1210";
      for (let y = 0; y < s; y += 8) { g.fillRect(0, y, s, 1); for (let x = ((y / 8) % 2) * 8; x < s; x += 16) g.fillRect(x, y, 1, 8); }
      g.fillStyle = "rgba(20,30,10,.35)"; for (let i = 0; i < 30; i++) g.fillRect(rnd() * s | 0, rnd() * s | 0, 2, 1);
      g.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 6; i++) g.fillRect(rnd() * s | 0, 20 + rnd() * 12 | 0, 1, 6 + rnd() * 6 | 0);   // подтёки сырости
    }, 3),
    concrete: () => tex(32, (g, s) => {
      noise(g, s, 46, 14, [1, .98, .92]);
      g.fillStyle = "rgba(0,0,0,.3)"; for (let i = 0; i < 6; i++) { const x = rnd() * s, y = rnd() * s; for (let k = 0; k < 10; k++) g.fillRect(x + rnd() * 6 | 0, y + rnd() * 6 | 0, 1, 1); }
      g.fillStyle = "rgba(70,0,0,.55)"; for (let k = 0; k < 14; k++) g.fillRect(20 + rnd() * 7 | 0, 6 + rnd() * 6 | 0, 1, 1);
    }, 4),
    wood: () => tex(32, (g, s) => {
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const v = 60 + Math.sin(x * .7 + Math.sin(y * .3) * 2) * 9 + (rnd() - .5) * 10; g.fillStyle = `rgb(${v | 0},${v * .62 | 0},${v * .4 | 0})`; g.fillRect(x, y, 1, 1); }
      g.fillStyle = "#1e120a"; for (let x = 0; x < s; x += 8) g.fillRect(x, 0, 1, s);
      g.fillStyle = "rgba(0,0,0,.25)"; for (let k = 0; k < 40; k++) g.fillRect(rnd() * s | 0, rnd() * s | 0, 1, 1);
    }, 2),
    felt: (red) => tex(32, (g, s) => {                       // старое сукно: зелёное (дробовик) или бордовое (револьвер), в пятнах
      noise(g, s, 52, 10, red ? [.9, .3, .3] : [.42, .78, .5]);
      g.fillStyle = "rgba(60,0,0,.55)"; for (let k = 0; k < 26; k++) g.fillRect(6 + rnd() * 9 | 0, 18 + rnd() * 7 | 0, 1, 1);
      g.fillStyle = "rgba(0,0,0,.3)"; for (let k = 0; k < 60; k++) g.fillRect(rnd() * s | 0, rnd() * s | 0, 1, 1);
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(3, 9, 5, 1); g.fillRect(24, 26, 1, 4);   // прожжённые сигаретой
    }, 3),
    metal: () => tex(8, (g, s) => noise(g, s, 52, 16, [.9, .92, 1])),
    blued: () => tex(16, (g, s) => { noise(g, s, 46, 10, [.8, .86, 1]); g.fillStyle = "rgba(200,210,230,.35)"; g.fillRect(0, 3, s, 1); g.fillRect(0, 11, s, 1); }),
    engraved: () => tex(16, (g, s) => {
      noise(g, s, 120, 20, [.95, .95, 1]);
      g.fillStyle = "#4a4a54"; for (let i = 0; i < 16; i++) { const a = i * .9; g.fillRect(8 + Math.cos(a) * (2 + i * .35) | 0, 8 + Math.sin(a) * (2 + i * .35) | 0, 1, 1); }
      g.fillRect(2, 2, 12, 1); g.fillRect(2, 13, 12, 1);
    }),
    grip: () => tex(16, (g, s) => { noise(g, s, 70, 14, [1, .6, .38]); g.fillStyle = "rgba(0,0,0,.4)"; for (let y = 0; y < s; y += 2) for (let x = (y / 2) % 2; x < s; x += 2) g.fillRect(x, y, 1, 1); }),
    door: () => tex(32, (g, s) => {
      noise(g, s, 40, 10, [.7, .78, .72]);
      g.fillStyle = "#14140f"; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s); g.fillRect(s - 1, 0, 1, s);
      g.fillStyle = "#0a0a08"; g.fillRect(10, 5, 12, 6); g.fillStyle = "#3a3a30"; for (let x = 12; x < 22; x += 3) g.fillRect(x, 5, 1, 6);
      g.fillStyle = "#5a4a2a"; g.fillRect(25, 17, 3, 2);
      g.fillStyle = "rgba(60,30,10,.5)"; for (let k = 0; k < 60; k++) g.fillRect(rnd() * s | 0, 20 + rnd() * 12 | 0, 1, 1);
    }),
    tally: () => tex(32, (g, s) => {
      g.clearRect(0, 0, s, s); g.fillStyle = "rgba(230,220,200,.7)";
      for (let k = 0; k < 4; k++) { const bx = 2 + k * 8, by = 6 + (k % 2) * 12; for (let i = 0; i < 4; i++) g.fillRect(bx + i * 1.5 | 0, by, 1, 7); for (let i = 0; i < 6; i++) g.fillRect(bx + i, by + 5 - i, 1, 1); }
    }),
    label: () => tex(16, (g, s) => { g.fillStyle = "#e8d8a0"; g.fillRect(0, 0, s, s); g.fillStyle = "#8a1a10"; g.fillRect(2, 4, 12, 3); g.fillStyle = "#3a2a1a"; g.fillRect(3, 9, 10, 1); g.fillRect(4, 11, 8, 1); }),
    shells: () => tex(16, (g, s) => { g.fillStyle = "#8a1a12"; g.fillRect(0, 0, s, s); g.fillStyle = "#e8c040"; g.fillRect(0, 6, s, 4); g.fillStyle = "#2a0a06"; g.fillRect(3, 7, 10, 1); }),
    vest: () => tex(16, (g, s) => { noise(g, s, 70, 14, [.62, .8, .45]); g.fillStyle = "#24361a"; g.fillRect(0, 5, s, 1); g.fillRect(0, 11, s, 1); g.fillRect(7, 0, 1, s); }),
  };

  // карты «Верю — не верю»: рубашка и лицо (король, дама, туз, джокер), рисуются кодом
  const CARD_TEX = {};
  function cardTex(rank) {
    if (CARD_TEX[rank]) return CARD_TEX[rank];
    const c = document.createElement("canvas"); c.width = 30; c.height = 42;
    const g = c.getContext("2d");
    if (rank === "back") {
      g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 30, 42);
      g.fillStyle = "#6a0c12"; g.fillRect(2, 2, 26, 38);
      g.fillStyle = "#9a1a1e"; for (let y = 3; y < 40; y += 4) for (let x = 3 + ((y >> 2) % 2) * 2; x < 28; x += 4) g.fillRect(x, y, 2, 2);
      g.fillStyle = "#e0b040"; g.fillRect(13, 17, 4, 8); g.fillRect(11, 19, 8, 4);
    } else {
      const red = rank === "Q", ink = rank === "J" ? "#ffd23f" : red ? "#b0101a" : "#141014";   // джокер — фиолетовый с золотом, не спутать с дамой
      g.fillStyle = rank === "J" ? "#3a1466" : "#f0e6cc"; g.fillRect(0, 0, 30, 42);
      g.fillStyle = "#c8b890"; g.fillRect(0, 0, 30, 1); g.fillRect(0, 41, 30, 1); g.fillRect(0, 0, 1, 42); g.fillRect(29, 0, 1, 42);
      g.fillStyle = ink; g.font = "bold 9px monospace"; g.textBaseline = "top";
      const L = { K: "К", Q: "Д", A: "Т", J: "Дж" }[rank];
      g.fillText(L, 2, 2);
      g.save(); g.translate(28, 40); g.rotate(Math.PI); g.fillText(L, 0, 0); g.restore();
      const px = (pts) => pts.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
      g.fillStyle = ink;
      if (rank === "K") { px([[8, 12, 14, 3], [8, 8, 2, 4], [14, 7, 2, 5], [20, 8, 2, 4], [9, 15, 12, 10], [11, 25, 8, 6]]); g.fillStyle = "#e0b040"; px([[8, 11, 14, 2], [14, 6, 2, 2], [8, 7, 2, 2], [20, 7, 2, 2]]); g.fillStyle = "#f0e6cc"; px([[12, 18, 2, 2], [16, 18, 2, 2]]); }
      if (rank === "Q") { px([[10, 9, 10, 3], [9, 12, 12, 12], [7, 24, 16, 8]]); g.fillStyle = "#e0b040"; px([[10, 7, 2, 2], [14, 6, 2, 3], [18, 7, 2, 2], [10, 9, 10, 1]]); g.fillStyle = "#f0e6cc"; px([[12, 15, 2, 2], [16, 15, 2, 2], [13, 20, 4, 1]]); }
      if (rank === "A") { px([[14, 9, 2, 2], [12, 11, 6, 3], [10, 14, 10, 4], [9, 18, 12, 4], [10, 22, 4, 2], [16, 22, 4, 2], [14, 22, 2, 6], [11, 28, 8, 2]]); }
      if (rank === "J") { g.fillStyle = "#b0101a"; px([[7, 10, 6, 4], [17, 10, 6, 4], [12, 8, 6, 6]]); g.fillStyle = "#2a6a2a"; px([[9, 14, 12, 3]]); g.fillStyle = "#e0b040"; px([[6, 9, 2, 2], [22, 9, 2, 2], [14, 6, 2, 2]]); g.fillStyle = "#e8c8a0"; px([[10, 17, 10, 9]]); g.fillStyle = "#141014"; px([[12, 20, 2, 2], [16, 20, 2, 2], [12, 23, 6, 1]]); g.fillStyle = "#b0101a"; px([[9, 26, 12, 6]]); }
    }
    const t = new T.CanvasTexture(c); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false;
    return (CARD_TEX[rank] = t);
  }
  const CARD_W = .15, CARD_H = .21;
  // карта рубашкой вверх (лежит на столе); flip — лицом вверх
  function cardMesh(rank) {
    const edge = mat({ color: 0xe8dcc0 }), back = mat({ map: cardTex("back") }), face = mat({ map: cardTex(rank || "back") });
    return new T.Mesh(new T.BoxGeometry(CARD_W, .004, CARD_H), [edge, edge, back, face, edge, edge]);
  }

  /* ---------------------------------------------------------------- пост-обработка: урезание цветов + дизеринг */
  const POST_FS = `
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float flash, hurt, time, dark;
    varying vec2 vUv;
    float bayer(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int i = x + y * 4;
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0; return 0.0; }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = mix(c, vec3(1.0, .95, .8), flash * .6);
      c = mix(c, vec3(.55, 0.0, 0.0), hurt * .55);
      vec2 d = vUv - .5; c *= 1.0 - dot(d, d) * (1.4 + dark * 3.0);  // виньетка (сильнее, когда ствол у виска)
      c = pow(c, vec3(.82)) * 1.12; c.r *= 1.05; c.b *= .92;
      float th = (bayer(gl_FragCoord.xy) - .5) * .7;
      float L = 8.0;
      c = floor(c * L + th + .5) / L;
      gl_FragColor = vec4(c, 1.0);
    }`;

  /* ---------------------------------------------------------------- общие детали; вершины «дрожат», как на старых приставках */
  const snap = (m) => { m.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n  gl_Position.xy = floor(gl_Position.xy / gl_Position.w * vec2(150.0, 130.0) + .5) / vec2(150.0, 130.0) * gl_Position.w;"); }; return m; };
  const mat = (o) => snap(new T.MeshLambertMaterial(o));
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const cyl = (r1, r2, l, m, seg = 8) => new T.Mesh(new T.CylinderGeometry(r1, r2, l, seg), m);
  const put = (parent, m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
  function spriteTex(c) { const t = new T.CanvasTexture(c); t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; }
  function disposeTree(o) { o.traverse((x) => { if (x.geometry && x.geometry !== state.partGeo) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }); }
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------------------------------------------------------------- дробовик: двуствольный */
  function makeGun() {
    const g = new T.Group();
    const steel = mat({ color: 0x8e92a0, map: TEX.blued(), emissive: 0x101014, flatShading: true });
    const plate = mat({ color: 0xc8c8d0, map: TEX.engraved(), emissive: 0x18181c, flatShading: true });
    const dark = mat({ color: 0x1c1c22, flatShading: true }), blackM = new T.MeshBasicMaterial({ color: 0x000000 });
    const woodM = mat({ color: 0x7a4422, map: TEX.wood(), flatShading: true }), woodD = mat({ color: 0x3a1e0e, flatShading: true });
    const brass = mat({ color: 0xd8b050, emissive: 0x2a1a00 });
    const front = new T.Group(); g.add(front);
    [-.037, .037].forEach((x) => {
      put(g, cyl(.035, .035, .3, steel, 10), x, .06, -.2, Math.PI / 2);
      put(front, cyl(.035, .035, .32, steel, 10), x, .06, -.51, Math.PI / 2);
      put(front, cyl(.04, .04, .03, dark, 10), x, .06, -.665, Math.PI / 2);
      put(front, new T.Mesh(new T.CircleGeometry(.025, 10), blackM), x, .06, -.681, 0, Math.PI);
      put(g, new T.Mesh(new T.CircleGeometry(.03, 10), mat({ color: 0xd8d8e0, emissive: 0x404040 })), x, .06, -.351, 0, Math.PI);
    });
    put(g, box(.03, .02, .05, dark), 0, .03, -.04);
    put(g, box(.022, .016, .3, dark), 0, .101, -.2);
    for (let i = 0; i < 6; i++) put(g, box(.024, .004, .006, steel), 0, .11, -.33 + i * .05);
    put(front, box(.022, .016, .3, dark), 0, .101, -.5);
    put(front, box(.012, .016, .012, brass), 0, .116, -.655);
    put(front, box(.15, .03, .03, dark), 0, .06, -.53);
    put(g, box(.1, .056, .26, woodM), 0, .012, -.2);
    for (let i = 0; i < 5; i++) put(g, box(.102, .006, .01, woodD), 0, .0, -.3 + i * .045);
    put(g, box(.126, .11, .17, plate), 0, .045, .02);
    put(g, cyl(.018, .018, .135, dark, 6), 0, .0, -.065, 0, 0, Math.PI / 2);
    put(g, box(.035, .02, .08, dark), 0, .108, .075, 0, .45);
    put(g, box(.03, .01, .03, brass), 0, .103, .02);
    [[-.022, .085], [.022, .095]].forEach(([x, z]) => put(g, box(.018, .045, .03, dark), x, .112, z, -.55));
    put(g, box(.02, .012, .13, dark), 0, -.05, .085); put(g, box(.02, .05, .012, dark), 0, -.025, .02); put(g, box(.02, .04, .012, dark), 0, -.03, .145);
    put(g, box(.012, .035, .012, steel), 0, -.018, .065, .3); put(g, box(.012, .03, .012, steel), 0, -.016, .1, .3);
    put(g, box(.09, .1, .15, woodM), 0, .0, .18, .2);
    for (let i = 0; i < 3; i++) put(g, box(.092, .004, .1, woodD), 0, -.03 + i * .025, .18, .2);
    put(g, box(.1, .145, .32, woodM), 0, -.035, .38, .1);
    put(g, box(.03, .06, .2, woodM), .05, .0, .4, .1);
    put(g, box(.108, .17, .03, mat({ color: 0x3a1410 })), 0, -.055, .545, .1);
    put(g, cyl(.012, .012, .03, steel, 6), 0, -.1, .3, 0, 0, Math.PI / 2);
    const muzzle = new T.PointLight(0xffc070, 0, 4); muzzle.position.set(0, .06, -.75); g.add(muzzle);
    g.userData = { muzzle, front };
    return g;
  }

  /* ---------------------------------------------------------------- револьвер: ствол смотрит по +z (для lookAt) */
  function makeRevolver() {
    const g = new T.Group(), inner = new T.Group(); g.add(inner);
    const steel = mat({ color: 0xc0c4d0, map: TEX.blued(), emissive: 0x24242a, flatShading: true });
    const dark = mat({ color: 0x3a3a44, emissive: 0x0a0a0c, flatShading: true }), gripM = mat({ color: 0xa85a2a, map: TEX.grip(), emissive: 0x1a0800, flatShading: true });
    put(inner, cyl(.022, .024, .3, steel, 8), 0, .05, .2, Math.PI / 2);                 // ствол
    put(inner, box(.03, .03, .3, dark), 0, .078, .2);                                      // планка над стволом
    put(inner, box(.012, .022, .014, steel), 0, .098, .34);                                // мушка
    put(inner, new T.Mesh(new T.CircleGeometry(.014, 8), new T.MeshBasicMaterial({ color: 0x000000 })), 0, .05, .351);
    const cylG = new T.Group(); cylG.position.set(0, .045, .015); inner.add(cylG);         // барабан на 6 гнёзд
    put(cylG, cyl(.058, .058, .1, steel, 12), 0, 0, 0, Math.PI / 2);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; put(cylG, new T.Mesh(new T.CircleGeometry(.014, 6), new T.MeshBasicMaterial({ color: 0x0a0a0a })), Math.cos(a) * .034, Math.sin(a) * .034, .051); put(cylG, box(.006, .006, .1, dark), Math.cos(a + .52) * .058, Math.sin(a + .52) * .058, 0); }
    put(inner, box(.05, .1, .14, steel), 0, .02, .01);                                     // рамка
    const hammer = put(inner, box(.016, .05, .03, dark), 0, .085, -.07, -.5);             // курок
    put(inner, box(.012, .04, .012, dark), 0, -.03, .02, .4);                              // спуск
    put(inner, new T.Mesh(new T.TorusGeometry(.035, .007, 4, 8, Math.PI), dark), 0, -.03, .02, 0, Math.PI / 2, Math.PI);   // скоба
    put(inner, box(.046, .16, .07, gripM), 0, -.08, -.08, -.35);                          // рукоять
    put(inner, box(.05, .02, .075, dark), 0, -.155, -.105, -.35);
    const muzzle = new T.PointLight(0xffc070, 0, 4); muzzle.position.set(0, .05, .4); g.add(muzzle);
    // своя рука, когда револьвер у тебя (вид из глаз)
    const vm = new T.Group(); vm.visible = false; inner.add(vm);
    const skin = mat({ color: 0xc89068, flatShading: true }), sleeve = mat({ color: 0x3a3430, flatShading: true });
    put(vm, box(.07, .1, .09, skin), 0, -.08, -.09, -.35);
    put(vm, box(.026, .026, .06, skin), -.03, .0, .0);
    put(vm, box(.085, .085, .14, sleeve), .005, -.15, -.2, -.35);
    g.userData = { muzzle, cyl: cylG, hammer, vm, inner };
    g.scale.setScalar(1.6);
    return g;
  }

  /* ---------------------------------------------------------------- предметы на столе */
  function itemMesh(key) {
    const g = new T.Group(), add = (m, x, y, z, rx, ry, rz) => put(g, m, x, y, z, rx, ry, rz);
    const steel = mat({ color: 0x9a9aa8, flatShading: true }), black = mat({ color: 0x1a1a1e, flatShading: true });
    if (key === "flashlight") {                                    // фонарик: рифлёная ручка, широкая голова, светящееся стекло
      add(cyl(.026, .026, .14, black, 8), 0, .03, 0, 0, 0, Math.PI / 2);
      for (let i = 0; i < 5; i++) add(cyl(.028, .028, .006, mat({ color: 0x3a3a40 }), 8), -.05 + i * .02, .03, 0, 0, 0, Math.PI / 2);
      add(cyl(.045, .028, .05, mat({ color: 0x4a4a52, flatShading: true }), 8), .095, .04, 0, 0, 0, Math.PI / 2);
      add(new T.Mesh(new T.CircleGeometry(.038, 8), new T.MeshBasicMaterial({ color: 0xfff0a0 })), .121, .04, 0, 0, Math.PI / 2, 0);
      add(box(.02, .014, .022, mat({ color: 0xc02020 })), .02, .06, 0);
      add(box(.004, .02, .02, mat({ color: 0x8a8a90 })), -.075, .03, 0);
    } else if (key === "spin") {                                   // коробка патронов: открыта, гильзы торчат
      add(box(.13, .07, .09, mat({ color: 0x8a1a12, map: TEX.shells(), flatShading: true })), 0, .035, 0);
      add(box(.134, .012, .094, mat({ color: 0xd8c890 })), 0, .072, -.06, -.9);
      for (let i = 0; i < 4; i++) { add(cyl(.012, .012, .03, mat({ color: i % 2 ? 0xa01010 : 0x2a6a2a }), 6), -.045 + i * .03, .085, .01); add(cyl(.013, .013, .006, mat({ color: 0xd8b050 }), 6), -.045 + i * .03, .072, .01); }
    } else if (key === "mirror") {                                 // ручное зеркальце: овальная рама и ручка
      const fr = add(cyl(.06, .06, .012, mat({ color: 0x8a6a2a, flatShading: true }), 10), 0, .01, 0); fr.scale.set(1, 1, 1.3);
      const gl = add(cyl(.05, .05, .014, mat({ color: 0xd8f4ff, emissive: 0x3a6a80 }), 10), 0, .012, 0); gl.scale.set(1, 1, 1.3);
      add(box(.022, .012, .1, mat({ color: 0x6a4a1a })), 0, .008, .12);
      add(box(.03, .014, .02, mat({ color: 0xd8b050 })), 0, .01, .07);
    } else if (key === "vest") {                                   // сложенный бронежилет с карманами
      const vm = mat({ color: 0x4a6a32, map: TEX.vest(), flatShading: true }), vd = mat({ color: 0x2a4020 });
      add(box(.17, .05, .13, vm), 0, .025, 0);
      add(box(.05, .02, .045, vd), -.045, .058, .02); add(box(.05, .02, .045, vd), .045, .058, .02);
      add(box(.18, .012, .02, black), 0, .052, -.04); add(box(.04, .01, .14, black), -.06, .052, 0);
    } else if (key === "freeze") {                                 // бутылка стоит: зелёное стекло, плечики, горлышко, пробка, этикетка
      const glass = mat({ color: 0x2a8a3e, emissive: 0x0a2a10, transparent: true, opacity: .88, flatShading: true });
      add(cyl(.034, .036, .13, glass, 8), 0, .065, 0);
      add(cyl(.016, .034, .045, glass, 8), 0, .152, 0);
      add(cyl(.013, .014, .05, glass, 8), 0, .2, 0);
      add(cyl(.016, .016, .01, glass, 8), 0, .224, 0);
      add(cyl(.012, .012, .02, mat({ color: 0x9a7040 }), 6), 0, .235, 0);
      add(cyl(.0365, .0365, .05, mat({ color: 0xe8d8a0, map: TEX.label() }), 8), 0, .065, 0);
      add(box(.006, .1, .006, new T.MeshBasicMaterial({ color: 0xc8ffd0 })), .024, .08, .024);   // блик на стекле
    } else if (key === "medkit") {                                 // шприц: поршень, цилиндр с красным, игла, упоры
      add(cyl(.02, .02, .12, mat({ color: 0xe8f0f0, transparent: true, opacity: .65 }), 8), 0, .025, 0, 0, 0, Math.PI / 2);
      add(cyl(.016, .016, .07, mat({ color: 0xd0101e, emissive: 0x400004 }), 8), .01, .025, 0, 0, 0, Math.PI / 2);
      add(cyl(.004, .004, .07, steel, 4), .095, .025, 0, 0, 0, Math.PI / 2);
      add(cyl(.006, .006, .07, mat({ color: 0xd8d8d8 }), 4), -.09, .025, 0, 0, 0, Math.PI / 2);
      add(box(.01, .03, .03, mat({ color: 0xe8e8e8 })), -.125, .025, 0);
      add(box(.01, .012, .07, mat({ color: 0xe8e8e8 })), -.06, .025, 0);
    } else if (key === "ear") {                                    // слуховая трубка
      add(cyl(.055, .014, .11, mat({ color: 0xb08a4a, flatShading: true }), 8), 0, .045, 0, 0, 0, Math.PI / 2);
      add(cyl(.058, .058, .01, mat({ color: 0xd8b060 }), 8), .055, .045, 0, 0, 0, Math.PI / 2);
      add(cyl(.012, .012, .1, mat({ color: 0x6a4a2a }), 6), -.1, .04, .03, 0, .6, Math.PI / 2);
      add(cyl(.016, .016, .02, mat({ color: 0x2a2a2a }), 6), -.15, .04, .06, 0, .6, Math.PI / 2);
    } else if (key === "box") {
      add(box(.12, .07, .09, mat({ color: 0x5a2e14, map: TEX.wood(), flatShading: true })), 0, .035, 0);
      const lid = add(box(.124, .02, .094, mat({ color: 0x6a3a1a, flatShading: true })), 0, .08, 0); lid.name = "lid";
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(box(.016, .074, .016, mat({ color: 0xc8a040 })), sx * .056, .037, sz * .041));
      add(box(.02, .022, .008, mat({ color: 0xd8b040 })), 0, .06, .048);
    } else if (key === "stake") {
      for (let i = 0; i < 4; i++) add(cyl(.04, .04, .012, mat({ color: 0xffd23f, emissive: 0x3a2a00, flatShading: true }), 10), (i % 2) * .008, .007 + i * .013, 0);
      add(cyl(.04, .04, .012, mat({ color: 0xffd23f, emissive: 0x3a2a00 }), 10), .07, .007, .02);
    } else if (key === "saw") {
      add(box(.2, .012, .012, steel), 0, .05, 0); add(box(.012, .05, .012, steel), -.094, .025, 0); add(box(.012, .05, .012, steel), .094, .025, 0);
      add(box(.19, .016, .004, mat({ color: 0xd8d8e0 })), 0, .008, 0);
      for (let i = 0; i < 9; i++) add(box(.006, .008, .005, mat({ color: 0xb8b8c0 })), -.085 + i * .021, .002, 0);
      add(box(.04, .05, .022, mat({ color: 0x2a6a2a, flatShading: true })), -.12, .035, 0, 0, 0, .3);
    } else if (key === "thief") {                                  // кожаная перчатка с пальцами
      const lea = mat({ color: 0x2a2222, flatShading: true });
      add(box(.08, .025, .09, lea), 0, .013, 0);
      for (let i = 0; i < 4; i++) add(box(.017, .02, .065 - Math.abs(i - 1.5) * .008, lea), -.03 + i * .02, .012, -.075);
      add(box(.018, .02, .05, lea), .052, .012, 0, 0, -.6, 0);
      add(box(.084, .024, .03, mat({ color: 0x6a1a1a })), 0, .014, .055);
    } else add(box(.09, .06, .07, mat({ color: 0x888888 })), 0, .03, 0);
    return g;
  }

  function makeChair(idx) {
    const g = new T.Group(), w = mat({ color: [0x3a2414, 0x2e2010, 0x34200e, 0x2a1c10][idx % 4], map: TEX.wood(), flatShading: true });
    put(g, box(.62, .06, .5, w), 0, .48, 0);
    put(g, box(.62, .7, .06, w), 0, .88, -.24);
    put(g, box(.62, .08, .07, w), 0, 1.26, -.24);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => put(g, box(.05, .48, .05, w), sx * .27, .24, sz * .21));
    return g;
  }

  /* ---------------------------------------------------------------- игрок за столом */
  function dropFig(f) {
    figGroup.remove(f); disposeTree(f); f.userData.person.dispose();
    if (f.userData.rv) { scene.remove(f.userData.rv); disposeTree(f.userData.rv); f.userData.rv = null; }
  }
  function makeFigure(p, idx) {
    const g = new T.Group();
    const person = P().build(T, p.char != null ? p.char : idx, { snap });
    g.add(person.root);
    const chair = makeChair(idx); chair.position.set(0, 0, -.12); person.body.add(chair);
    const ud = { idx, p, person, dead: false, jolt: 0, hp: -1, wounds: 0, itemsKey: "", hands: null, sp: .18, hx: 0, hy: 0 };
    const hearts = new T.Group(); hearts.position.y = 1.95; g.add(hearts);
    const rugM = mat({ color: [0x4a1810, 0x14304a, 0x2e3a14, 0x4a3410][idx % 4], emissive: 0x000000 });
    const rug = put(g, new T.Mesh(new T.PlaneGeometry(1.2, .52), rugM), 0, .782, 1.0, -Math.PI / 2);
    const items = new T.Group(); g.add(items);
    const mirror = new T.Group();                                   // зеркало в раме на подставке
    put(mirror, box(.34, .44, .03, mat({ color: 0x6a4a1a, flatShading: true })), 0, 0, 0);
    put(mirror, box(.28, .38, .032, mat({ color: 0xc8ecff, emissive: 0x4a8aa0 })), 0, 0, 0);
    put(mirror, box(.04, .3, .04, mat({ color: 0x4a3010 })), 0, -.3, 0);
    put(mirror, box(.16, .03, .12, mat({ color: 0x4a3010 })), 0, -.44, 0);
    mirror.position.set(.42, .95, .62); mirror.rotation.y = -.35; mirror.visible = false; g.add(mirror);
    const stars = makeStars(); person.head.add(stars);
    const pool = put(g, new T.Mesh(new T.CircleGeometry(.42, 9), mat({ color: 0x5a0008, transparent: true, opacity: .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })), 0, .787, .72, -Math.PI / 2);
    pool.position.z = .86; pool.visible = false;                                           // лужа под головой (растёт после смерти лицом в стол)
    const fan = new T.Group(); fan.position.set(0, 1.02, .5); fan.rotation.x = -.35; person.body.add(fan);   // карты в руках («Верю — не верю»)
    Object.assign(ud, { hearts, items, mirror, rug, rugM, chair, stars, pool, fan, fanN: -1 });
    g.userData = ud;
    return g;
  }

  function makeStars() {
    const g = new T.Group(), c = document.createElement("canvas"); c.width = c.height = 16;
    const x = c.getContext("2d"); x.fillStyle = "#ffe040"; x.beginPath();
    for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7.5, a = -Math.PI / 2 + i * Math.PI / 5; x.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); }
    x.fill(); x.fillStyle = "#fff8c0"; x.fillRect(7, 6, 2, 2);
    const t = spriteTex(c);
    for (let i = 0; i < 5; i++) {
      const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, alphaTest: .4, depthTest: false }));
      const a = i / 5 * Math.PI * 2; sp.scale.set(.15, .15, 1); sp.position.set(Math.cos(a) * .24, 0, Math.sin(a) * .24); g.add(sp);
    }
    g.position.set(0, .42, 0); g.visible = false;
    return g;
  }

  /* ---------------------------------------------------------------- сцена: комната (общая) и стол (свой для каждого режима) */
  const RS = 3.5, RH = 3.3;
  function build() {
    scene = new T.Scene();
    scene.background = new T.Color(0x050403);
    scene.fog = new T.Fog(0x080504, 5, 12);
    camera = new T.PerspectiveCamera(58, W / H, .05, 30);
    scene.add(camera);
    roomGroup = new T.Group(); scene.add(roomGroup);
    const conc = TEX.concrete(); conc.repeat.set(3, 3);
    put(roomGroup, new T.Mesh(new T.PlaneGeometry(RS * 2, RS * 2), mat({ map: conc })), 0, 0, 0, -Math.PI / 2);
    const seam = mat({ color: 0x1a1612 });
    for (let i = -3; i <= 3; i++) { put(roomGroup, box(RS * 2, .004, .03, seam), 0, .002, i); put(roomGroup, box(.03, .004, RS * 2, seam), i, .002, 0); }
    const brick = TEX.brick(); brick.repeat.set(4, 2);
    [[0, -RS, 0], [0, RS, Math.PI], [-RS, 0, Math.PI / 2], [RS, 0, -Math.PI / 2]].forEach(([x, z, r]) => {
      put(roomGroup, new T.Mesh(new T.PlaneGeometry(RS * 2, RH), mat({ map: brick })), x, RH / 2, z, 0, r);
      put(roomGroup, box(RS * 2, .22, .06, mat({ color: 0x241a14 })), x * .985, .11, z * .985, 0, r);
      put(roomGroup, box(RS * 2, .16, .1, mat({ color: 0x1a1410 })), x * .98, RH - .08, z * .98, 0, r);
    });
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => put(roomGroup, box(.34, RH, .34, mat({ color: 0x3a2a22, map: TEX.concrete() })), sx * (RS - .17), RH / 2, sz * (RS - .17)));
    put(roomGroup, new T.Mesh(new T.PlaneGeometry(RS * 2, RS * 2), mat({ color: 0x14100c })), 0, RH, 0, Math.PI / 2);
    [-1.6, 0, 1.6].forEach((x) => put(roomGroup, box(.18, .2, RS * 2, mat({ color: 0x2a1c12, map: TEX.wood() })), x, RH - .1, 0));
    put(roomGroup, box(1.3, 2.2, .05, mat({ color: 0x1a1410 })), 1.4, 1.1, -RS + .005);
    put(roomGroup, new T.Mesh(new T.PlaneGeometry(1.1, 2.1), mat({ map: TEX.door() })), 1.4, 1.05, -RS + .03);
    const pipeM = mat({ color: 0x4a4030, map: TEX.metal(), flatShading: true });
    [[2.75, .1], [2.95, .07]].forEach(([y, r]) => put(roomGroup, cyl(r, r, RS * 2, pipeM, 6), 0, y, -RS + .2, 0, 0, Math.PI / 2));
    put(roomGroup, cyl(.08, .08, RH, pipeM, 6), -2.4, RH / 2, -RS + .2);
    put(roomGroup, new T.Mesh(new T.TorusGeometry(.14, .025, 4, 8), mat({ color: 0x8a1a10 })), -2.4, 1.5, -RS + .32);
    put(roomGroup, new T.Mesh(new T.PlaneGeometry(.9, .9), mat({ map: TEX.tally(), transparent: true })), -1.0, 1.75, -RS + .02);
    // полка с банками у левой стены, бочка и ящики, матрас в углу
    put(roomGroup, box(1.1, .05, .3, mat({ color: 0x2a1c12 })), -RS + .17, 1.6, -.8, 0, Math.PI / 2);
    put(roomGroup, box(1.1, .05, .3, mat({ color: 0x2a1c12 })), -RS + .17, 2.1, -.8, 0, Math.PI / 2);
    [-1.2, -1.0, -.75, -.5].forEach((z, i) => put(roomGroup, cyl(.07, .07, .18 + (i % 3) * .04, mat({ color: [0x3a5a2a, 0x5a3a1a, 0x2a2a3a, 0x6a5a2a][i], transparent: true, opacity: .85 }), 6), -RS + .2, 1.72 + (i % 3) * .02, z));
    [-1.1, -.6].forEach((z) => put(roomGroup, box(.18, .22, .18, mat({ color: 0x5a4a30, map: TEX.wood() })), -RS + .2, 2.24, z));
    put(roomGroup, cyl(.32, .32, .9, mat({ color: 0x3a2a1a, map: TEX.wood(), flatShading: true }), 10), -RS + .55, .45, 2.4);
    [.15, .78].forEach((y) => put(roomGroup, cyl(.335, .335, .05, mat({ color: 0x2a2a2e }), 10), -RS + .55, y, 2.4));
    put(roomGroup, box(.7, .6, .7, mat({ color: 0x4a3018, map: TEX.wood() })), RS - .6, .3, RS - 1.2, 0, .3);
    put(roomGroup, box(.5, .45, .5, mat({ color: 0x3e2814, map: TEX.wood() })), RS - .6, .825, RS - 1.2, 0, .1);
    put(roomGroup, box(1.6, .14, .8, mat({ color: 0x6a6450 })), 1.6, .07, RS - .5, 0, .05);
    put(roomGroup, box(1.5, .02, .7, mat({ color: 0x4a2a1a })), 1.62, .145, RS - .5, 0, .05);
    const chain = mat({ color: 0x4a4a52 });
    for (let i = 0; i < 9; i++) put(roomGroup, new T.Mesh(new T.TorusGeometry(.04, .012, 3, 6), chain), RS - .25, RH - .15 - i * .085, -1.6, 0, i % 2 ? Math.PI / 2 : 0);
    put(roomGroup, new T.Mesh(new T.TorusGeometry(.07, .015, 3, 8, Math.PI * 1.3), chain), RS - .25, RH - .95, -1.6, 0, 0, Math.PI);
    decals = new T.Group(); scene.add(decals);
    splat(new T.Vector3(-1.2, 1.4, -RS + .03), new T.Euler(0, 0, 0), .9, 0x5a0008);
    splat(new T.Vector3(2.3, .01, -1.6), new T.Euler(-Math.PI / 2, 0, 0), 1.2, 0x3a0006);
    // лампа на проводе: жестяной абажур, лампочка, конус света
    lamp = new T.Group(); lamp.position.set(0, 3.3, 0); scene.add(lamp);
    put(lamp, box(.015, 1.1, .015, mat({ color: 0x111111 })), 0, -.55, 0);
    put(lamp, cyl(.05, .05, .08, mat({ color: 0x2a2a2a }), 6), 0, -1.12, 0);
    put(lamp, new T.Mesh(new T.ConeGeometry(.36, .24, 8, 1, true), mat({ color: 0x3a4a3a, side: T.DoubleSide, flatShading: true })), 0, -1.26, 0);
    put(lamp, new T.Mesh(new T.TorusGeometry(.36, .012, 3, 8), mat({ color: 0x5a6a5a })), 0, -1.38, 0, Math.PI / 2);
    bulb = put(lamp, new T.Mesh(new T.SphereGeometry(.075, 6, 4), new T.MeshBasicMaterial({ color: 0xffe0a0 })), 0, -1.36, 0);
    state.cone = put(lamp, new T.Mesh(new T.ConeGeometry(1.25, 2.2, 10, 1, true), new T.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: .05, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })), 0, -2.45, 0);
    spot = new T.SpotLight(0xffd8a0, 3.4, 10, .9, .5, 1); spot.position.set(0, -1.3, 0); lamp.add(spot);
    spot.target.position.set(0, -4, 0); lamp.add(spot.target);
    scene.add(new T.AmbientLight(0x4a3830, 1.1));
    const fill = new T.PointLight(0xffb070, .6, 9); fill.position.set(0, 2.2, 2.5); scene.add(fill);
    redLight = new T.PointLight(0xff2010, 1.2, 7); redLight.position.set(-2.6, 2.6, -3.1); scene.add(redLight);
    put(roomGroup, box(.12, .08, .06, new T.MeshBasicMaterial({ color: 0xff3020 })), -2.6, 2.6, -RS + .04);
    state.beam = new T.PointLight(0xfff0b0, 0, 3); scene.add(state.beam);
    figGroup = new T.Group(); scene.add(figGroup);
    state.cross = crosshair();
    const n = 26, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - .5) * 2.2; pos[i * 3 + 1] = .9 + rnd() * 1.6; pos[i * 3 + 2] = (rnd() - .5) * 2.2; }
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    state.dust = new T.Points(dg, new T.PointsMaterial({ color: 0xa89070, size: 1, sizeAttenuation: false, transparent: true, opacity: .35 }));
    scene.add(state.dust);
    setMode("shotgun", true);
  }

  // размеры стола и мест для режима
  const GEO = { shotgun: { table: 1.5, R: 2.05, cam: [0, 2.15, 3.22] }, revolver: { table: 1.95, R: 2.5, cam: [0, 2.2, 3.12] }, bluff: { table: 1.5, R: 2.05, cam: [0, 2.1, 3.2] } };
  const geo = () => GEO[state.mode] || GEO.shotgun;
  function setMode(mode, force) {
    if (!force && state.mode === mode && tableGroup) return;
    state.mode = mode;
    if (tableGroup) { scene.remove(tableGroup); disposeTree(tableGroup); }
    Object.values(state.figs).forEach((f) => { dropFig(f); }); state.figs = {};
    tableGroup = new T.Group(); scene.add(tableGroup);
    const r = geo().table, red = mode === "revolver", cards = mode === "bluff", seg = red ? 14 : 10;
    spot.angle = red ? 1.12 : .9; spot.penumbra = red ? .6 : .5; spot.distance = red ? 12 : 10;   // большой стол — шире свет
    put(tableGroup, cyl(r, r, .1, mat({ map: TEX.wood(), flatShading: true }), seg), 0, .72, 0);
    put(tableGroup, cyl(r - .28, r - .28, .102, mat({ map: TEX.felt(red), color: cards ? 0x6a8ab0 : 0xffffff, flatShading: true }), seg), 0, .722, 0);
    put(tableGroup, new T.Mesh(new T.TorusGeometry(r - .27, .02, 3, seg), mat({ color: 0xa88a40, emissive: 0x1a1000 })), 0, .775, 0, Math.PI / 2, 0, Math.PI / seg);
    put(tableGroup, cyl(r + .06, r - .04, .08, mat({ color: 0x2e1a0c, flatShading: true }), seg), 0, .64, 0);
    put(tableGroup, cyl(.16, .26, .62, mat({ color: 0x2a1a0e, flatShading: true }), 6), 0, .31, 0);
    put(tableGroup, cyl(.55, .65, .08, mat({ color: 0x24160c, flatShading: true }), 6), 0, .04, 0);
    // мелочи на столе: свеча, карты, монеты, окурки
    const cnd = new T.Group(); cnd.position.set(-r * .6, .78, -r * .42); tableGroup.add(cnd);
    put(cnd, cyl(.08, .09, .02, mat({ color: 0x8a7a5a }), 8), 0, 0, 0);
    put(cnd, cyl(.035, .035, .16, mat({ color: 0xe8dcc0, flatShading: true }), 6), 0, .09, 0);
    put(cnd, box(.012, .03, .012, new T.MeshBasicMaterial({ color: 0xffc040 })), 0, .19, 0);
    if (candleLight) scene.remove(candleLight);
    candleLight = new T.PointLight(0xffa040, .6, 2.2); candleLight.position.set(-r * .6, 1.05, -r * .42); scene.add(candleLight);
    const cardM = mat({ color: 0xe8e0d0 }), backM = mat({ color: 0x7a1a1a });
    [[.52, -.46, .4], [.6, -.4, -.3], [.47, -.33, 1.2]].forEach(([x, z, rr], i) => put(tableGroup, box(.12, .006, .17, i === 2 ? backM : cardM), x * r, .778 + i * .002, z * r, 0, rr));
    [[-.2, .63], [.27, -.66]].forEach(([x, z]) => put(tableGroup, cyl(.04, .04, .01, mat({ color: 0xb08a30, emissive: 0x201400 }), 8), x * r, .78, z * r));
    put(tableGroup, cyl(.07, .06, .03, mat({ color: 0x5a5a5a, flatShading: true }), 8), r * .35, .79, r * .5);   // пепельница
    for (let i = 0; i < 3; i++) put(tableGroup, cyl(.008, .008, .05, mat({ color: 0xd8c8a0 }), 4), r * .35 + (i - 1) * .02, .81, r * .5, 0, i, Math.PI / 2.4);
    if (gun) { scene.remove(gun); disposeTree(gun); gun = null; }
    if (rev) { scene.remove(rev); disposeTree(rev); rev = null; }
    if (red) { rev = makeRevolver(); rev.position.set(0, .8, 0); rev.rotation.set(0, .6, Math.PI / 2); scene.add(rev); state.revPos = rev.position.clone(); state.revQ = rev.quaternion.clone(); }
    else if (cards) {                                                    // карта стола висит под лампой и медленно крутится; куча карт — в центре
      const hang = new T.Group(); hang.position.set(0, 1.62, 0); hang.visible = false; tableGroup.add(hang);
      put(hang, box(.006, .5, .006, mat({ color: 0x2a2a2a })), 0, .45, 0);
      const fm = mat({ map: cardTex("K"), emissive: 0x1a1408 }), ed = mat({ color: 0xe8dcc0 });
      const big = put(hang, new T.Mesh(new T.BoxGeometry(.34, .48, .006), [ed, ed, ed, ed, fm, fm]), 0, 0, 0);
      put(hang, box(.05, .03, .012, mat({ color: 0x5a5a5a })), 0, .25, 0);
      state.rankCard = { g: hang, mesh: big, mat: fm, rank: null };
      state.pileG = new T.Group(); state.pileG.position.set(0, .782, 0); tableGroup.add(state.pileG); state.pileN = 0;
    }
    else { gun = makeGun(); gun.scale.setScalar(1.4); gun.position.set(0, .86, 0); scene.add(gun); }
    if (!cards) { state.rankCard = null; state.pileG = null; }
    state.aim = null; state.spin = null; state.sawn = false; state.cam = null; state.look = null; state.claim = null; state.reveal = null;
    resetDecals();
  }

  function splat(pos, rot, size, color, big) {
    const t = tex(32, (g, s) => {
      g.clearRect(0, 0, s, s);
      const col = "#" + color.toString(16).padStart(6, "0"), dark = "#2a0004", c = s / 2;
      g.fillStyle = col;
      for (let i = 0; i < (big ? 260 : 150); i++) { const a = rnd() * 6.28, r = Math.pow(rnd(), big ? 1.1 : 1.7) * (s * .45); g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 1 + (rnd() < .5 ? 1 : 0), 1 + (rnd() < .3 ? 1 : 0)); }
      g.beginPath(); g.arc(c, c, s * (big ? .22 : .12), 0, 6.28); g.fill();
      for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = s * (.3 + rnd() * .18); g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 2, 2); }
      g.fillStyle = dark; for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = rnd() * s * .18; g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 1, 1); }
      g.fillStyle = col; for (let i = 0; i < 6; i++) { const x = c - 8 + rnd() * 16 | 0; g.fillRect(x, c, 1 + (rnd() < .4), 5 + rnd() * 12 | 0); }
    });
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.copy(pos); m.rotation.copy(rot); decals.add(m);
    while (decals.children.length > 80) { const old = decals.children[2]; decals.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); }
    return m;
  }
  function resetDecals() { if (!decals) return; while (decals.children.length > 2) { const old = decals.children[decals.children.length - 1]; decals.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); } }

  function crosshair() {
    const c = document.createElement("canvas"); c.width = c.height = 15;
    const g = c.getContext("2d"); g.fillStyle = "#ff1a20";
    [[7, 0, 1, 5], [7, 10, 1, 5], [0, 7, 5, 1], [10, 7, 5, 1], [6, 6, 3, 3]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    g.fillStyle = "#000"; g.fillRect(7, 7, 1, 1);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: spriteTex(c), transparent: true, depthTest: false }));
    sp.renderOrder = 11; sp.scale.set(.36, .36, 1); sp.visible = false; scene.add(sp);
    return sp;
  }

  /* ---------------------------------------------------------------- места за столом */
  const seatPos = (rel, n) => { const a = (rel / n) * Math.PI * 2, R = geo().R; return { x: Math.sin(a) * R, z: Math.cos(a) * R, a }; };
  const yawTo = (x, z) => Math.atan2(-x, -z);
  const worldOf = (f, x, y, z) => f.localToWorld(new T.Vector3(x, y, z));
  const headOf = (f) => { if (!f) return new T.Vector3(0, 1.4, 0); if (f.userData.rel === 0) return camera.position.clone().add(new T.Vector3(0, -.3, -.35)); const p = new T.Vector3(); f.userData.person.head.getWorldPosition(p); p.y += .15; return p; };
  const chestOf = (f) => { if (!f || f.userData.rel === 0) return headOf(f).add(new T.Vector3(0, -.3, 0)); const p = new T.Vector3(); f.userData.person.torso.getWorldPosition(p); return p; };

  // куча карт рубашкой вверх в центре стола
  function setPile(n) {
    const g = state.pileG; if (!g || state.pileN === n) return;
    while (g.children.length > n) { const m = g.children.pop(); m.geometry.dispose(); [].concat(m.material).forEach((x) => x.dispose()); }
    while (g.children.length < n) { const k = g.children.length, c = cardMesh(null), a = rnd() * 6.28, d = .05 + rnd() * .2; c.position.set(Math.cos(a) * d, k * .0045, Math.sin(a) * d + .1); c.rotation.y = rnd() * 6.28; g.add(c); }
    state.pileN = n;
  }
  function sync(room, me) {
    if (!scene) return;
    setMode(room.game === "bluff" ? "bluff" : room.mode === "revolver" || room.game === "revolver" ? "revolver" : "shotgun");
    const seats = room.seats && room.seats.length ? room.seats : room.players.map((p) => p.id);
    const mine = seats.indexOf(me);
    const n = Math.max(2, seats.length + (mine < 0 ? 1 : 0));
    state.me = me; state.seats = seats; state.room = room;
    const shotgun = state.mode === "shotgun";
    seats.forEach((pid, i) => {
      const p = room.players.find((x) => x.id === pid);
      if (!p) return;
      const rel = mine < 0 ? i + 1 : (i - mine + n) % n;
      let f = state.figs[pid];
      if (f && p.char != null && f.userData.p.char !== p.char) { dropFig(f); delete state.figs[pid]; f = null; }   // новая партия — новый персонаж
      if (!f) { f = makeFigure(p, i); figGroup.add(f); state.figs[pid] = f; }
      const sp = seatPos(rel, n);
      f.position.set(sp.x, 0, sp.z); f.rotation.y = sp.a + Math.PI;
      const ud = f.userData;
      if (ud.rel !== rel) { ud.rel = rel; ud.person.self(rel === 0); ud.chair.visible = rel !== 0; }
      ud.name = p.name; ud.pid = pid; ud.alive = p.alive; ud.brave = !!p.brave;
      if (ud.hp !== p.hp) {
        ud.hearts.children.slice().forEach((h) => { ud.hearts.remove(h); h.geometry.dispose(); h.material.dispose(); });
        for (let k = 0; k < room.maxHp; k++) {
          const h = box(.08, .08, .08, k < p.hp ? mat({ color: 0xd0101e, emissive: 0x500006 }) : mat({ color: 0x2a1a1a }));
          h.position.x = (k - (room.maxHp - 1) / 2) * .13; ud.hearts.add(h);
        }
        ud.hp = p.hp;
      }
      if ((p.wounds || 0) > ud.wounds) { ud.wounds = p.wounds; ud.person.setWounds(ud.wounds, shotgun); }
      ud.hearts.visible = rel !== 0 && p.alive && room.maxHp > 1;
      ud.rug.visible = shotgun; ud.items.visible = shotgun;
      const ik = shotgun ? (p.items || []).join(",") : "";
      if (ud.itemsKey !== ik) {
        ud.items.children.slice().forEach((m) => { ud.items.remove(m); disposeTree(m); });
        (shotgun ? p.items || [] : []).forEach((k, j) => {              // до четырёх предметов в ряд
          const m = itemMesh(k), cnt = Math.max(1, (p.items || []).length);
          m.position.set((j - (cnt - 1) / 2) * (rel === 0 ? .3 : .27), 0, 0);
          m.rotation.y = ((j * 1.7) % 1 - .5) * .6; m.scale.setScalar(1.4);
          m.userData = { pid, index: j, key: k };
          m.traverse((o) => { o.userData.item = m; });
          ud.items.add(m);
        });
        ud.itemsKey = ik;
      }
      ud.items.position.set(0, .78, 1.0);
      const st = p.status || {};
      if (!!st.mirror !== !!ud.hasMirror) { ud.hasMirror = !!st.mirror; if (ud.hasMirror) mirrorRise(f); else if (!ud.mirrorBroken) ud.mirror.visible = false; ud.mirrorBroken = false; }
      if (!!st.vest !== !!ud.hasVest) {
        const was = ud.hasVest; ud.hasVest = !!st.vest;
        ud.person.vest.visible = ud.hasVest; ud.person.vest.userData.on = ud.hasVest;
        if (ud.hasVest && rel !== 0) burst(chestOf(f), 0x5aa83a, 14, .8);
        else if (was && !ud.vestTorn && rel !== 0) burst(chestOf(f), 0x4a6a32, 10, .6);
        ud.vestTorn = false;
      }
      // карты в руках: сколько у игрока, столько рубашек веером (своих — нет, свои внизу экрана)
      const fanN = state.mode === "bluff" && p.alive && rel !== 0 ? Math.max(0, p.cards || 0) : 0;
      if (ud.fanN !== fanN) {
        ud.fan.children.slice().forEach((m) => { ud.fan.remove(m); m.geometry.dispose(); });
        for (let k = 0; k < fanN; k++) {
          const c = new T.Mesh(state.fanGeo || (state.fanGeo = new T.BoxGeometry(CARD_W * .9, CARD_H * .9, .004)), state.fanMat || (state.fanMat = mat({ map: cardTex("back") })));
          const a = (k - (fanN - 1) / 2) * .26; c.position.set(Math.sin(a) * .1, Math.cos(a) * .05 - .05, k * .003); c.rotation.z = -a; ud.fan.add(c);
        }
        ud.fanN = fanN;
      }
      ud.fan.visible = fanN > 0;
      // свой револьвер у каждого («Верю — не верю»): лежит на столе перед игроком
      if (state.mode === "bluff" && !ud.rv) { ud.rv = makeRevolver(); ud.rv.scale.setScalar(1.25); scene.add(ud.rv); ud.rvPos = worldOf(f, .4, .8, .74); ud.rvQ = new T.Quaternion(); ud.rv.position.copy(ud.rvPos); }
      if (ud.rv) ud.rv.visible = !ud.dead || ud.deathKind !== "left";
      ud.bounty = state.mode === "revolver" ? p.bounty || 0 : 0;          // награда за голову (револьвер) — подпись над головой
      ud.frozen = !!st.frozen;
      ud.stars.visible = ud.frozen && !ud.dead && rel !== 0;
      if (!p.alive && !ud.dead) die(f, p.death || "table", true);
      if (p.alive && ud.dead) revive(f);
    });
    Object.keys(state.figs).forEach((pid) => { if (!seats.includes(pid)) { const f = state.figs[pid]; dropFig(f); delete state.figs[pid]; } });
    state.turn = room.turn; state.phase = room.phase;
    if (state.mode === "bluff" && room.table) {
      const rc = state.rankCard;
      if (rc && rc.rank !== room.table.rank) { rc.rank = room.table.rank; rc.mat.map = cardTex(room.table.rank || "back"); rc.mat.needsUpdate = true; }
      setPile(room.table.pile || 0);
      state.myCards = (room.hand || []).length;
    }
    if (shotgun) {
      if (room.sawed && !state.sawn) sawOff();
      if (!room.sawed && state.sawn && !state.sawBackSoon) { state.sawBackSoon = true; setTimeout(() => { state.sawBackSoon = false; if (state.sawn) sawBack(); }, 1700); }
      gun.userData.muzzle.position.z = room.sawed ? -.4 : -.75;
      const aim = room.phase === "play" ? room.aim : null;
      const af = aim && state.figs[aim], tf = state.figs[room.turn];
      const target = af ? yawTo(af.position.x, af.position.z) : tf && ["play", "shot"].includes(room.phase) ? yawTo(-tf.position.x, -tf.position.z) : null;
      if (aim !== state.aim) spinTo(target, !!aim);
      else if (target != null && state.spin == null && Math.abs(angDiff(target, state.gunYaw)) > .01 && !state.firing) spinTo(target, false);
      state.aim = aim;
    } else state.aim = room.phase === "play" ? room.aim : null;
  }

  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  function spinTo(target, big) {
    if (target == null) return;
    const d = angDiff(target, state.gunYaw);
    const turns = big ? (d >= 0 ? 1 : -1) * Math.PI * 2 : 0;
    state.spin = { from: state.gunYaw, to: state.gunYaw + d + turns, t: 0, dur: big ? 1.05 : .55 };
    if (big && api.onSpin) api.onSpin();
  }

  function wallSplat(wp, size) {
    const RW = 3.47, ax = Math.abs(wp.x), az = Math.abs(wp.z);
    if (az >= ax) splat(new T.Vector3(wp.x * RW / Math.max(az, .01) * .9, 1.2 + rnd() * .8, Math.sign(wp.z) * RW), new T.Euler(0, wp.z > 0 ? Math.PI : 0, rnd() * .6 - .3), size * (.8 + rnd() * .4), 0x5a0008, true);
    else splat(new T.Vector3(Math.sign(wp.x) * RW, 1.2 + rnd() * .8, wp.z * RW / Math.max(ax, .01) * .9), new T.Euler(0, wp.x > 0 ? -Math.PI / 2 : Math.PI / 2, rnd() * .6 - .3), size * (.8 + rnd() * .4), 0x5a0008, true);
  }

  /* ---------------------------------------------------------------- смерть: лицом в стол или назад с простреленной головой */
  function die(f, kind, instant) {
    const ud = f.userData;
    ud.dead = true; ud.deathKind = kind; ud.deadAt = instant ? -99 : performance.now() / 1000; ud.impact = !!instant;
    ud.stars.visible = false; ud.hearts.visible = false;
    if (kind === "left" || ud.rel === 0) { f.visible = false; return; }   // ушёл из-за стола; свои руки после смерти не показываем
    if (kind === "head") { ud.person.head.visible = false; ud.person.stump.visible = true; }
    if (kind === "limb") {                                             // дробь оторвала руку: культя у плеча
      const arm = ud.person.arms.R; arm.sh.visible = false;
      if (!ud.limbStump) { ud.limbStump = put(arm.sh.parent, box(.15, .1, .15, mat({ color: 0x7a000c })), arm.sh.position.x, arm.sh.position.y - .04, arm.sh.position.z); }
      ud.limbStump.visible = true;
    }
    if (instant) {
      const wp = f.position;
      if (kind === "table") { ud.pool.visible = ud.rel !== 0; ud.pool.scale.setScalar(1); }
      splat(new T.Vector3(wp.x * 1.1, .013, wp.z * 1.1), new T.Euler(-Math.PI / 2, 0, rnd() * 6), 1.4, 0x3a0005, true);
    }
  }
  function revive(f) {
    const ud = f.userData;
    ud.dead = false; ud.deathKind = null; f.visible = true; ud.pool.visible = false;
    ud.person.head.visible = true; ud.person.stump.visible = false; ud.person.tilt.rotation.set(0, 0, 0); ud.person.tilt.position.z = -.6;
    ud.person.arms.R.sh.visible = true; if (ud.limbStump) ud.limbStump.visible = false;
  }
  function headBurst(f, from) {                                     // голова разлетается: кровь, осколки, брызги на стене
    const h = headOf(f), dir = h.clone().sub(from || new T.Vector3(0, 1.2, 0)).setY(0).normalize();
    burst(h, 0x9a000c, 60, 1.8, { size: .05, life: 1.5, push: dir });
    burst(h, 0x6a0008, 30, 1.1, { size: .04, life: 1.8, up: .2, push: dir });
    burst(h, 0xd8b090, 10, 1.4, { size: .045, life: 1.2, push: dir });
    burst(h, 0xe8e0d0, 6, 1.6, { size: .025, life: 1, push: dir });
    const wp = f.position.clone();
    wallSplat(wp.clone().add(dir.clone().multiplyScalar(1.2)), 1.8); wallSplat(wp, 1.2);
    splat(new T.Vector3(wp.x * .62, .786, wp.z * .62), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .9, 0x7a000a, true);
    state.flicker = Math.max(state.flicker, .8);
  }

  function limbBurst(f, from) {                                     // рука отлетает: куски рукава и кожи, кровь фонтаном
    const sh = f.userData.person.arms.R.sh.getWorldPosition(new T.Vector3()), dir = sh.clone().sub(from || new T.Vector3(0, 1.2, 0)).setY(0).normalize();
    burst(sh, 0x9a000c, 44, 1.5, { size: .045, life: 1.4, push: dir });
    burst(sh, f.userData.person.look.topC || 0x3a3430, 4, 1.6, { size: .11, life: 3, push: dir, up: .8 });
    burst(sh, 0xc89068, 3, 1.5, { size: .08, life: 3, push: dir, up: .9 });
    wallSplat(f.position.clone().add(dir.clone().multiplyScalar(1.1)), 1.4);
    state.flicker = Math.max(state.flicker, .6);
  }

  /* ---------------------------------------------------------------- частицы, трассеры, гильзы, ножовка, зеркало */
  const parts = [];
  const partGeo = () => state.partGeo || (state.partGeo = new T.BoxGeometry(1, 1, 1));
  function burst(pos, color, n = 12, speed = 1, opt = {}) {
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(partGeo(), new T.MeshBasicMaterial({ color, transparent: true }));
      m.scale.setScalar((opt.size || .04) * (.7 + rnd() * .6));
      m.position.copy(pos);
      const v = new T.Vector3((rnd() - .5) * 2, opt.up != null ? opt.up + rnd() * .5 : rnd() * 1.4, (rnd() - .5) * 2).multiplyScalar(speed);
      if (opt.push) v.addScaledVector(opt.push, speed * 1.4);
      m.userData = { v, life: opt.life || .9, max: opt.life || .9, g: opt.gravity != null ? opt.gravity : 3.5 };
      scene.add(m); parts.push(m);
    }
  }
  function tracer(a, b, color = 0xffd890) {
    const l = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color, transparent: true }));
    l.userData = { life: .25, max: .25, line: true }; scene.add(l); parts.push(l);
  }
  const casings = [];
  function ejectShell(live, from) {
    const m = new T.Mesh(new T.CylinderGeometry(.03, .03, .12, 6), mat({ color: live ? 0xa01010 : 0x2a6a2a, flatShading: true }));
    m.position.copy(from);
    m.userData = { v: new T.Vector3((rnd() - .5) * 1.4, 1.6, (rnd() - .5) * 1.4), spin: (rnd() - .5) * 18, rest: false };
    scene.add(m); casings.push(m);
    if (casings.length > 14) { const old = casings.shift(); scene.remove(old); disposeTree(old); }
  }
  const muzzleWorld = () => (state.mode === "revolver" ? rev.localToWorld(new T.Vector3(0, .05, .38)) : gun.localToWorld(new T.Vector3(0, .06, state.sawn ? -.36 : -.7)));

  function sawOff() {
    const front = gun.userData.front;
    state.sawn = true;
    scene.attach(front);
    const from = front.position.clone(), q0 = front.quaternion.clone();
    const to = new T.Vector3(.62, .8, -.4), q1 = new T.Quaternion().setFromEuler(new T.Euler(0, 2.2, 0));
    burst(muzzleWorld(), 0xffd040, 18, .7, { size: .025, life: .6 });
    anim.push({ t: 0, dur: .7, step: (k) => { front.position.lerpVectors(from, to, k); front.position.y += Math.sin(k * Math.PI) * .35; front.quaternion.slerpQuaternions(q0, q1, k); } });
  }
  function sawBack() {
    const front = gun.userData.front;
    state.sawn = false;
    gun.attach(front);
    const from = front.position.clone(), q0 = front.quaternion.clone(), q1 = new T.Quaternion();
    anim.push({ t: 0, dur: .8, step: (k) => { const e = ease(k); front.position.lerpVectors(from, new T.Vector3(), e); front.position.y += Math.sin(k * Math.PI) * .25; front.quaternion.slerpQuaternions(q0, q1, e); },
      done: () => burst(muzzleWorld(), 0xc8c8d0, 8, .4, { size: .02, life: .4 }) });
  }
  function mirrorRise(f) {
    const m = f.userData.mirror; m.visible = f.userData.rel !== 0;
    anim.push({ t: 0, dur: .9, step: (k) => { m.position.y = .55 + .4 * Math.min(1, k * 1.3); m.rotation.y = -.35 + (1 - k) * Math.PI * 4; m.scale.setScalar(.3 + .7 * Math.min(1, k * 1.5)); },
      done: () => burst(worldOf(f, .42, 1.1, .62), 0xe8f8ff, 10, .5, { size: .03, life: .5, gravity: 0 }) });
  }
  const mirrorAt = (f) => (f.userData.rel === 0 ? camera.position.clone().add(new T.Vector3(.35, -.6, -.9)) : worldOf(f, .42, .95, .62));
  function mirrorShatter(f) {
    const p = mirrorAt(f);
    burst(p, 0xc8ecff, 26, 1.1, { size: .035, life: 1.2 });
    burst(p, 0x6a4a1a, 6, .8, { size: .05, life: 1 });
    f.userData.mirror.visible = false; f.userData.mirrorBroken = true;
  }

  /* ---------------------------------------------------------------- события и их длительность */
  const anim = [];
  // when — момент удара (с начала анимации), hold — сколько держать старое состояние на экране
  function timing(e) {
    if (!e) return { when: 0, hold: 0 };
    if (state.mode === "bluff") {                                    // «Верю — не верю»: раздача, ход, вскрытие, выстрел
      if (e.kind === "deal") return { when: 0, hold: 1.3 };
      if (e.kind === "play") return { when: 0, hold: .9 };
      if (e.kind === "call") return { when: 0, hold: 2.9 };
      if (e.kind === "shot") { const w = 1.35 + (e.wait || 0); return { when: w, hold: w + (e.live ? 1.6 : 1.0) }; }
      return { when: 0, hold: e.kind === "redeal" ? .8 : 0 };
    }
    if (e.kind === "shot") {
      if (state.mode === "revolver" || e.chance != null) { const w = (e.self ? 1.15 : .95) + (e.wait || 0); return { when: w, hold: w + (e.live ? 1.1 : .6) }; }
      const w = (e.dice ? 4.05 : e.redirected ? 1.05 : .7) + (e.wait || 0);
      return { when: w, hold: w + (e.live ? .7 : .45) };
    }
    if (e.kind === "load") return { when: 0, hold: e.chambers ? 1.3 : 1.4 };
    if (e.kind === "spin") return { when: 0, hold: 1.1 };
    if (e.kind === "skip") return { when: 0, hold: .5 };
    if (e.kind === "item") return { when: 0, hold: { freeze: .8, thief: .9, spin: 1.05, box: .9, flashlight: .9, ear: .9, saw: .7, mirror: .9, vest: .5, medkit: .5 }[e.item] || .3 };
    return { when: 0, hold: 0 };
  }

  // летящая карта: из a в b по дуге (рубашкой вверх), потом исчезает
  function flyCard(a, b, delay, dur, rank, done) {
    const c = cardMesh(rank); c.visible = false; scene.add(c);
    const spin = (rnd() - .5) * 3;
    anim.push({ t: -delay, dur, step: (k) => { if (k <= 0) return; c.visible = true; c.position.lerpVectors(a, b, ease(k)); c.position.y += Math.sin(k * Math.PI) * .3; c.rotation.y = spin * (1 - k); },
      done: () => { scene.remove(c); c.geometry.dispose(); [].concat(c.material).forEach((m) => m.dispose()); if (done) done(); } });
  }
  const handOf = (f) => (!f || f.userData.rel === 0 ? camera.localToWorld(new T.Vector3(0, -.55, -.7)) : f.userData.fan.localToWorld(new T.Vector3(0, 0, 0)));
  const pileAt = () => new T.Vector3(0, .8, .1);
  function bluffEvent(e) {
    const f = state.figs[e.who];
    if (e.kind === "deal") {
      const rc = state.rankCard;
      if (rc && e.rank) { rc.rank = e.rank; rc.mat.map = cardTex(e.rank); rc.mat.needsUpdate = true; state.rankShow = { at: performance.now() }; }
      Object.values(state.figs).filter((x) => !x.userData.dead).forEach((x, i) => { for (let k = 0; k < 3; k++) flyCard(pileAt(), handOf(x), .3 + i * .12 + k * .07, .45); });
      state.claim = null;
    } else if (e.kind === "play") {
      for (let k = 0; k < e.cnt; k++) flyCard(handOf(f), pileAt().add(new T.Vector3((rnd() - .5) * .2, 0, (rnd() - .5) * .2)), k * .1, .5);
      state.claim = { pid: e.who, text: "«" + (window.Bluff ? Bluff.claimText(e.cnt, e.rank) : e.cnt) + "»", until: performance.now() + 9000 };
      if (f) f.userData.use = performance.now() / 1000;
    } else if (e.kind === "call") {                                   // «Не верю!»: последние карты взлетают и переворачиваются лицом
      state.claim = { pid: e.who, text: "Не верю!", hot: true, until: performance.now() + 2600 };
      state.reveal = { until: performance.now() + 5200 };
      const n = e.cards.length;
      e.cards.forEach((rk, i) => {
        const c = cardMesh(rk); c.scale.setScalar(1.9); scene.add(c);
        const to = new T.Vector3((i - (n - 1) / 2) * .36, 1.2, .55), from = pileAt();
        const ok = rk === e.rank || rk === "J";
        anim.push({ t: -i * .12, dur: .7, step: (k) => { if (k < 0) return; c.position.lerpVectors(from, to, ease(Math.max(0, k))); c.rotation.x = -Math.PI / 2 * ease(Math.max(0, k)); },
          done: () => { burst(to.clone(), ok ? 0x5aff7a : 0xff2a2a, 10, .4, { size: .03, life: .6, gravity: 0 }); } });
        anim.push({ t: 0, dur: 4.6, done: () => { anim.push({ t: 0, dur: .4, step: (k) => { c.position.y = 1.2 - k * .4; c.scale.setScalar(1.9 * (1 - k * .8)); }, done: () => { scene.remove(c); c.geometry.dispose(); [].concat(c.material).forEach((m) => m.dispose()); } }); } });
      });
    } else if (e.kind === "shot") {                                   // берёт свой револьвер, подносит к виску, рука дрожит — и заминка
      const now = performance.now(), tm = timing(e);
      state.firing = true; state.evAim = { who: e.who, target: e.who, at: now, until: now + tm.hold * 1000 + 300 };
      state.sus = { who: e.who, target: e.who, self: true, from: now + 1350, until: now + tm.when * 1000 };
      anim.push({ t: 0, dur: tm.when, done: () => { fireBluff(e); state.firing = false; } });
    }
  }
  function fireBluff(e) {
    const f = state.figs[e.who]; if (!f || !f.userData.rv) return;
    const ud = f.userData, r = ud.rv, mz = r.localToWorld(new T.Vector3(0, .05, .38));
    ud.rvRecoil = e.live ? 1 : .25; ud.pull = performance.now() / 1000; ud.rvTurn = (ud.rvTurn || 0) + 1; state.sus = null;
    if (!e.live) { burst(mz, 0x8a8070, 3, .2, { size: .02, life: .4, gravity: -.2 }); state.relief = { pid: e.who, at: performance.now() }; return; }
    state.flash = 1; state.shake = e.who === state.me ? 1 : .6; state.flicker = .7;
    r.userData.muzzle.intensity = 6;
    impact(f, Object.assign({ dmg: 1 }, e), mz);
  }

  function event(e) {
    if (!scene || !e) return;
    if (state.mode === "bluff") return bluffEvent(e);
    if (e.kind === "shot") {
      const now = performance.now(), tm = timing(e), w = e.wait || 0;
      state.firing = true; state.evAim = { who: e.who, target: e.target, at: now, until: now + tm.hold * 1000 + 300 };
      if (state.mode === "revolver") {
        state.sus = { who: e.who, target: e.target, self: !!e.self, from: now + 300, until: now + tm.when * 1000 };
        anim.push({ t: 0, dur: tm.when, done: () => { fireRevolver(e); state.firing = false; } });
        return;
      }
      const target = state.figs[e.target];
      if (target) spinTo(yawTo(target.position.x, target.position.z), false);
      state.sus = { who: e.who, target: e.target, self: !!e.self, from: now + 700, until: now + (.7 + w) * 1000 };
      anim.push({ t: 0, dur: .7 + w, done: () => { fire(e); state.firing = false; } });
    } else if (e.kind === "load") {
      if (state.mode === "revolver") {                                // барабан: патрон вставляют и раскручивают
        state.revSpin = 1.2; state.revHome = performance.now() + 1300;
        burst(new T.Vector3(0, .95, 0), 0xd8b050, 6, .3, { size: .02, life: .4 });
        return;
      }
      Object.values(state.figs).filter((f) => !f.userData.dead).concat(Array.from({ length: e.house || 0 }, () => null)).forEach((f, i) => {
        const from = f ? (f.userData.rel === 0 ? camera.position.clone().add(new T.Vector3(0, -.6, -.8)) : worldOf(f, 0, .95, .75)) : new T.Vector3((rnd() - .5) * 3, 2.6, -2.8);
        const sh = new T.Mesh(new T.CylinderGeometry(.03, .03, .12, 6), mat({ color: f ? 0x8a1010 : 0x4a4a4a, flatShading: true }));
        sh.visible = false; scene.add(sh);
        anim.push({ t: -i * .18, dur: .55, step: (k) => { if (k <= 0) return; sh.visible = true; sh.position.lerpVectors(from, gun.position, k); sh.position.y += Math.sin(k * Math.PI) * .6; sh.rotation.x = k * 9; },
          done: () => { scene.remove(sh); disposeTree(sh); burst(gun.position.clone(), 0xc8a040, 4, .3, { size: .02, life: .3 }); } });
      });
      anim.push({ t: 0, dur: 1.2 + Object.keys(state.figs).length * .18, step: (k) => { gun.rotation.z = Math.sin(k * 30) * .05 * (1 - k); } });
    } else if (e.kind === "spin") {                                    // крутанул барабан револьвера
      state.revSpin = 1.0;
    } else if (e.kind === "item") {
      const f = state.figs[e.who], tf = state.figs[e.target];
      if (f) { f.userData.use = performance.now() / 1000; anim.push({ t: 0, dur: .4, step: (k) => { f.userData.items.position.y = .9 - .12 * k; } }); }
      const at = (ff, y = 1.6) => (ff ? (ff.userData.rel === 0 ? camera.position.clone().add(new T.Vector3(0, -.5, -.6)) : worldOf(ff, 0, y, .2)) : new T.Vector3(0, 1.4, 1.8));
      if (e.item === "spin") anim.push({ t: 0, dur: 1, step: (k) => { gun.rotation.z = k * Math.PI * 2; gun.position.y = .86 + Math.sin(k * Math.PI) * .4; }, done: () => { gun.rotation.z = 0; } });
      if (e.item === "freeze" && tf) {                                // бутылка летит по дуге, кувыркаясь, — и в голову
        const from = at(f, 1.15), to = tf.userData.rel === 0 ? camera.position.clone().add(new T.Vector3(0, -.15, -.35)) : headOf(tf);
        const b = itemMesh("freeze"); b.scale.setScalar(1.7); scene.add(b);
        anim.push({ t: 0, dur: .65, step: (k) => { b.position.lerpVectors(from, to, k); b.position.y += Math.sin(k * Math.PI) * .7; b.rotation.z = k * 14; b.rotation.y = k * 5; },
          done: () => {
            scene.remove(b); disposeTree(b);
            burst(to.clone(), 0x3aaa5a, 30, 1.4, { size: .035, life: .9 });
            burst(to.clone(), 0xe8f8e0, 12, 1.8, { size: .02, life: .5 });
            burst(to.clone(), 0xffe040, 8, .6, { size: .05, life: .6, gravity: 0 });
            if (tf.userData.rel === 0) { state.shake = Math.max(state.shake, .9); state.hurt = Math.max(state.hurt || 0, .35); }
            else tf.userData.jolt = 1;
            state.flicker = .2;
          } });
      }
      if (e.item === "medkit") burst(at(f, 1.3), 0xff3040, 16, .6, { up: .8, gravity: -.5, life: 1.2, size: .05 });
      if (e.item === "stake") burst(at(f, .9), 0xffd23f, 10, .5, { size: .04, life: .8 });
      if (e.item === "vest" && f) burst(chestOf(f), 0x5aa83a, 16, .7, { size: .035, life: .7 });
      if (e.item === "ear" && tf) for (let i = 0; i < 3; i++) {
        const ring = new T.Mesh(new T.TorusGeometry(.2, .015, 4, 12), new T.MeshBasicMaterial({ color: 0xe8a090, transparent: true }));
        ring.position.copy(headOf(tf)); ring.lookAt(camera.position); ring.visible = false; scene.add(ring);
        anim.push({ t: -i * .25, dur: .8, step: (k) => { if (k <= 0) return; ring.visible = true; ring.scale.setScalar(1 + k * 2.5); ring.material.opacity = 1 - k; }, done: () => { scene.remove(ring); disposeTree(ring); } });
      }
      if (e.item === "flashlight") {
        const a = at(f, 1.0), b = gun.position.clone().add(new T.Vector3(0, .3, 0));
        anim.push({ t: 0, dur: 1.4, step: (k) => { state.beam.position.lerpVectors(a, b, Math.min(1, k * 2)); state.beam.intensity = Math.sin(k * Math.PI) * 4; }, done: () => { state.beam.intensity = 0; } });
      }
      if (e.item === "box" && f) {
        const bx = itemMesh("box"); bx.scale.setScalar(2.2); bx.position.copy(f.userData.rel === 0 ? camera.position.clone().add(new T.Vector3(0, -.75, -1)) : worldOf(f, 0, .78, .55)); scene.add(bx);
        const lid = bx.getObjectByName("lid"), note = put(bx, box(.08, .002, .1, new T.MeshBasicMaterial({ color: 0xf0e8d0 })), 0, .05, 0);
        anim.push({ t: 0, dur: 1.6, step: (k) => { lid.rotation.x = -Math.min(1, k * 3) * 1.9; lid.position.z = -Math.min(1, k * 3) * .04; note.position.y = .05 + Math.min(1, Math.max(0, k * 3 - .5)) * .12; note.rotation.y = k * 6; },
          done: () => { scene.remove(bx); disposeTree(bx); } });
      }
      if (e.item === "thief" && f && tf) {
        const st = itemMesh(e.stolen); st.scale.setScalar(1.8); scene.add(st);
        const a = worldOf(tf, 0, .9, 1.0), b = worldOf(f, 0, .9, 1.0);
        anim.push({ t: 0, dur: .9, step: (k) => { st.position.lerpVectors(a, b, k); st.position.y += Math.sin(k * Math.PI) * .7; st.rotation.y = k * 8; }, done: () => { scene.remove(st); disposeTree(st); } });
        burst(a, 0x888888, 8, .4, { size: .03, life: .5 });
      }
    } else if (e.kind === "win") state.flicker = 2.5;
  }

  // попадание: кровь, рана на теле, смерть
  function impact(hf, e, from) {
    if (!hf) return;
    const ud = hf.userData, me = ud.rel === 0, h = headOf(hf), c = chestOf(hf);
    if (e.absorbed) {                                                // жилет принял удар и разлетелся
      burst(c, 0x5aa83a, 18, 1, { size: .04, life: .8 }); burst(c, 0xd8c040, 6, .8, { size: .02, life: .4 });
      ud.vestTorn = true; ud.person.vest.visible = false; ud.hasVest = false; ud.jolt = .7;
      return;
    }
    const n = e.dmg > 1 ? 2 : 1, aimHead = e.out && e.death === "head", pellets = state.mode === "shotgun";
    if (!me) {
      if (pellets) {                                                 // дробь: облако крови
        const at = aimHead ? h : c.clone().lerp(h, .3);
        burst(at, 0x9a000c, 36 * n, 1.4, { size: .045, life: 1.3 });
        burst(at, 0x6a0008, 22 * n, .7, { size: .035, life: 1.6, up: -.2 });
        burst(at, 0xc0101a, 12, 2.2, { size: .025, life: .6, gravity: 1 });
      } else {                                                       // пуля: маленький вход и струйка брызг с другой стороны
        const at = e.self || ["temple", "slump"].includes(e.death) || !e.out ? h.clone().add(new T.Vector3(0, -.08, 0)) : c.clone().lerp(h, .55);
        const dir = at.clone().sub(from || new T.Vector3(0, 1.2, 0)).normalize();
        burst(at, 0x9a000c, 8, .4, { size: .025, life: .8 });
        burst(at.clone().addScaledVector(dir, .14), 0x8a000c, 30, 1.25, { size: .02, life: 1.1, push: dir, up: .05 });
        burst(at.clone().addScaledVector(dir, .14), 0xc0101a, 10, 2.1, { size: .014, life: .45, gravity: 1, push: dir });
      }
      ud.wounds += e.dmg || 1; ud.person.setWounds(ud.wounds, pellets);
      ud.jolt = pellets ? 1 : .8; ud.redT = .35;
    }
    const wp = hf.position, k = state.mode === "revolver" ? .7 : .55;
    for (let i = 0; i < (pellets ? n + 1 : 1); i++) splat(new T.Vector3(wp.x * (k + rnd() * .15) + (rnd() - .5) * .4, .786 + rnd() * .002, wp.z * (k + rnd() * .15) + (rnd() - .5) * .4), new T.Euler(-Math.PI / 2, 0, rnd() * 6), (pellets ? .4 : .25) + rnd() * .35, 0x7a000a, i === 0 && pellets);
    if (!me) wallSplat(wp, pellets ? 1.2 : .7);
    splat(new T.Vector3(wp.x * 1.25 + (rnd() - .5) * .5, .012, wp.z * 1.25 + (rnd() - .5) * .5), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .9 + rnd() * .5, 0x4a0006);
    if (me) { state.hurt = 1; splat(new T.Vector3((rnd() - .5) * .6, .787, geo().R - .65), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .8, 0x8a000c, true); }
    if (e.out) {
      if (pellets && aimHead && !me) headBurst(hf, from);              // голову и руки сносит только дробь
      if (pellets && e.death === "limb" && !me) limbBurst(hf, from);
      die(hf, e.death || "table", false);
    }
  }

  function fire(e) {                                                  // дробовик
    const mz = muzzleWorld();
    const tf = state.figs[e.target], hf = state.figs[e.hit], sf = state.figs[e.who];
    ejectShell(e.live, gun.localToWorld(new T.Vector3(0, .1, .05)));
    state.gunKick = e.live ? 1 : .3;
    if (sf) sf.userData.pull = performance.now() / 1000;
    state.sus = null;
    if (!e.live) { if (e.self) state.relief = { pid: e.who, at: performance.now() }; return; }
    state.flash = 1; state.shake = e.hit === state.me ? 1 : .55; state.flicker = .6;
    gun.userData.muzzle.intensity = 6;
    for (let i = 0; i < 8; i++) puff();
    if (e.dice && tf && sf) {                                         // два зеркала: в цель → в стрелка → кубики → в того, кому выпало больше
      const m1 = mirrorAt(tf), m2 = mirrorAt(sf);
      tracer(mz, m1, 0xffe0a0);
      anim.push({ t: 0, dur: .15, done: () => { mirrorShatter(tf); tracer(m1, m2, 0xc8ecff); } });
      anim.push({ t: 0, dur: .35, done: () => { mirrorShatter(sf); state.orbit = { at: m2.clone(), t: 0, until: performance.now() + 2900 }; } });
      anim.push({ t: 0, dur: 3.35, done: () => { const from = state.orbitPos ? state.orbitPos.clone() : m2; state.orbit = null; tracer(from, hf ? headOf(hf) : from, 0xffd890); state.flash = .8; state.shake = e.hit === state.me ? 1 : .6; impact(hf, e, from); } });
      return;
    }
    if (e.redirected && tf) {
      const mp = mirrorAt(tf);
      tracer(mz, mp); anim.push({ t: 0, dur: .12, done: () => { tracer(mp, headOf(hf), 0xc8ecff); mirrorShatter(tf); } });
      anim.push({ t: 0, dur: .35, done: () => impact(hf, e, mp) });
      return;
    }
    tracer(mz, e.absorbed ? chestOf(hf) : headOf(hf));
    impact(hf, e, mz);
  }

  function fireRevolver(e) {
    const mz = muzzleWorld(), hf = state.figs[e.target], sf = state.figs[e.who];
    state.revRecoil = e.live ? 1 : .25; state.revTurn = (state.revTurn || 0) + 1;
    if (sf) sf.userData.pull = performance.now() / 1000;
    state.sus = null;
    if (!e.live) { burst(mz, 0x8a8070, 3, .2, { size: .02, life: .4, gravity: -.2 }); if (e.self) state.relief = { pid: e.who, at: performance.now() }; return; }
    state.flash = 1; state.shake = e.target === state.me ? 1 : .6; state.flicker = .7;
    rev.userData.muzzle.intensity = 6;
    if (e.who !== state.me) for (let i = 0; i < 6; i++) puff();        // дым у самого лица закрыл бы весь экран
    if (!e.self) tracer(mz, headOf(hf));
    if (e.took && hf && sf) setTimeout(() => flyCoins(headOf(hf).add(new T.Vector3(0, .4, 0)), sf.userData.rel === 0 ? camera.localToWorld(new T.Vector3(0, -.3, -.8)) : headOf(sf).add(new T.Vector3(0, .4, 0))), 900);
    impact(hf, Object.assign({ dmg: 1 }, e), e.self ? mz.clone().add(new T.Vector3(0, 0, 0)) : sf ? headOf(sf) : mz);
  }

  // награда за голову переходит к стрелку: монетки летят дугой
  function flyCoins(a, b) {
    for (let i = 0; i < 9; i++) {
      const c = cyl(.035, .035, .01, mat({ color: 0xffd23f, emissive: 0x5a3a00 }), 8); c.visible = false; scene.add(c);
      const off = new T.Vector3((rnd() - .5) * .2, (rnd() - .5) * .1, (rnd() - .5) * .2);
      anim.push({ t: -i * .07, dur: .75, step: (k) => { if (k <= 0) return; c.visible = true; c.position.lerpVectors(a, b, ease(k)).add(off); c.position.y += Math.sin(k * Math.PI) * .5; c.rotation.x = k * 12; },
        done: () => { scene.remove(c); c.geometry.dispose(); c.material.dispose(); if (i === 8) burst(b, 0xffd23f, 10, .4, { size: .025, life: .5 }); } });
    }
  }
  function puff() {
    const m = new T.Mesh(partGeo(), new T.MeshBasicMaterial({ color: 0x8a8070, transparent: true, opacity: .55 }));
    m.scale.setScalar(.08); m.position.copy(muzzleWorld());
    m.userData = { v: new T.Vector3((rnd() - .5) * .3, .3 + rnd() * .3, (rnd() - .5) * .3), life: 1.6 };
    scene.add(m); state.smoke.push(m);
  }

  /* ---------------------------------------------------------------- позы: куда смотрят, где руки, как падают */
  const tv = () => state.tv || (state.tv = { a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), pole: new T.Vector3() });
  function pose(f, t, dt, i) {
    const ud = f.userData, ps = ud.person, rev0 = state.mode === "revolver", bl = state.mode === "bluff";
    const play = ["play", "shot", "reload", "deal", "reveal"].includes(state.phase);
    const turn = state.turn === ud.pid && ["play", "shot"].includes(state.phase);
    const ev = state.evAim && performance.now() < state.evAim.until ? state.evAim : null;
    const aim = ev ? ev.target : state.aim;
    const aimedAt = aim === ud.pid && (ev ? ev.who : state.turn) !== ud.pid && !ud.dead;
    const holder = (rev0 && !ud.dead && play && ((ev && ev.who === ud.pid) || (!ev && turn))) || (bl && !ud.dead && !!ev && ev.who === ud.pid);
    ud.jolt = Math.max(0, ud.jolt - dt * 2.2);
    if (ud.redT) { ud.redT = Math.max(0, ud.redT - dt); ps.setRed(Math.floor(t * 20) % 2 ? ud.redT * 2 : 0); }
    const lp = (cur, want, k) => cur + (want - cur) * Math.min(1, dt * k);
    // руки: точки в пространстве тела
    let L = [.2 + Math.sin(t * .7 + i) * .02, .8, .58], R = [-.2, .8, .58 + Math.sin(t * .9 + i) * .02], lean = .18, twist = 0;
    if (ud.frozen) { R = [-.1, 1.5, .18]; lean = .05; }
    if (bl && ud.fanN > 0) { L = [.12, 1.0, .5]; R = [-.12, 1.0, .5]; lean = .08; }
    if (aimedAt) { L = [.3, 1.42, .28]; R = [-.3, 1.42, .28]; lean = -.14; }
    if (!rev0 && turn && state.aim && !aimedAt) { R = [-.08, .84, 1.0]; lean = .34; }
    if (ud.pull && t - ud.pull < .25) lean += .12;
    // напряжение: палец на спуске — стрелок часто дышит и дрожит, тот, в кого целятся, трясётся с поднятыми руками, остальные отшатываются
    const nowP = performance.now(), sus = !ud.dead && state.sus && nowP < state.sus.until && nowP >= state.sus.from ? state.sus : null, sk = sus ? state.susK || 0 : 0;
    let shiver = 0;
    if (sus) {
      if (sus.who === ud.pid) shiver = .012 + sk * .03;
      else if (sus.target === ud.pid) shiver = .01 + sk * .026;
      else { lean -= .1 * (.4 + sk); if (i % 2 === 0) L = [.07, 1.43, .24]; else R = [-.08, 1.38, .26]; }   // ладонь ко рту
    }
    if (shiver) { const j = (a, b) => (Math.sin(t * a + i) + Math.sin(t * b)) * shiver * .5; L = [L[0] + j(31, 47), L[1] + j(37, 29), L[2]]; R = [R[0] + j(41, 23), R[1] + j(33, 53), R[2]]; }
    const relief = state.relief && state.relief.pid === ud.pid ? (nowP - state.relief.at) / 1000 : 9;   // щёлк — выдох, плечи опускаются
    if (relief < 1.8 && !ud.dead) lean += .32 * Math.sin(Math.min(1, relief / 1.8) * Math.PI);
    // смерть: у каждого вида своя анимация. Дробь: лицом в стол, голову сносит, отбрасывает назад, разворачивает и роняет, отрывает руку.
    // Пуля (револьвер): валится вбок у виска, оседает лицом в стол, сползает со стула, падает назад вместе со стулом
    let tilt = 0, tiltZ = 0, slideZ = 0, sp = null, hx = null, hyD = null, hz = 0, tw = null;
    if (ud.dead) {
      const k = t - ud.deadAt, K = ud.deathKind, side = ud.idx % 2 ? 1 : -1;
      const pr = (a, b) => Math.min(1, Math.max(0, (k - a) / (b - a)));
      const thud = (at, size) => {                                     // удар об пол: пыль, лужа, тряска
        if (k < at || ud.impact) return; ud.impact = true;
        const wp = f.position; burst(new T.Vector3(wp.x * 1.25, .1, wp.z * 1.25), 0x6a5a4a, 14, .6, { size: .05, life: .7 });
        splat(new T.Vector3(wp.x * 1.28, .013, wp.z * 1.28), new T.Euler(-Math.PI / 2, 0, rnd() * 6), size, 0x4a0006, true); state.shake = Math.max(state.shake, .25);
      };
      const pool = (at) => {                                           // лужа под головой на столе
        if (k >= at && !ud.impact) { ud.impact = true; if (ud.rel !== 0) { burst(headOf(f), 0x8a000c, 14, .5, { size: .04, life: 1 }); ud.pool.visible = true; ud.poolAt = t; } }
        if (ud.pool.visible) { const g = ud.poolAt ? Math.min(1, (t - ud.poolAt) / 3.5) : 1; ud.pool.scale.setScalar(.25 + g * .9); }
      };
      if (K === "table" || K === "limb") {
        sp = k < .12 ? -.35 * (k / .12) : k < .62 ? -.35 + 1.47 * Math.pow((k - .12) / .5, 2) : k < .8 ? 1.12 - Math.sin((k - .62) / .18 * Math.PI) * .12 : 1.05;
        hx = .45; L = [.44, .79, .78]; R = K === "limb" ? R : [-.4, .79, .66];
        pool(.6);
      } else if (K === "slump") {                                       // дёрнулся, замер — и медленно оседает лицом в стол, голова набок
        sp = k < .12 ? -.28 * (k / .12) : k < .7 ? -.28 + .2 * pr(.12, .7) : k < 1.7 ? -.08 + 1.13 * Math.pow(pr(.7, 1.7), 2.2) : 1.05 - Math.sin(pr(1.7, 1.85) * Math.PI) * .06;
        hx = .3 + .15 * pr(1.2, 1.7); hyD = side * .9; hz = side * .25 * pr(1.3, 1.7);
        L = [.46, .79, .74]; R = [-.25, .45 + .3 * (1 - pr(.8, 1.6)), .35];
        pool(1.7);
      } else if (K === "temple") {                                      // у виска: голову дёргает вбок, тело заваливается на бок, рука с револьвером падает
        hz = (k < .08 ? (k / .08) : 1) * .75 * -side; hx = .25 * pr(.1, .6);
        tiltZ = side * .95 * Math.pow(pr(.18, 1.15), 2) - (k > 1.15 && k < 1.35 ? Math.sin(pr(1.15, 1.35) * Math.PI) * .06 * side : 0);
        sp = .25 * pr(.1, .7);
        L = [.3, .55, .35]; R = [-.35, .3 + .4 * (1 - pr(.1, .5)), .25];
        if (k >= 1.15 && !ud.impact) { ud.impact = true; const wp = f.position; splat(new T.Vector3(wp.x * 1.05 + side * .5, .013, wp.z * 1.05), new T.Euler(-Math.PI / 2, 0, rnd() * 6), 1, 0x4a0006, true); state.shake = Math.max(state.shake, .15); }
      } else if (K === "side") {                                        // сползает со стула вбок и падает на пол
        sp = .2 * pr(0, .3); tiltZ = side * (1.5 * Math.pow(pr(.25, 1.05), 2) - (k > 1.05 && k < 1.25 ? Math.sin(pr(1.05, 1.25) * Math.PI) * .1 : 0));
        hyD = side * .5; hz = side * .3 * pr(.4, 1);
        L = [.55, .4, .2]; R = [-.55, .4, .2];
        thud(1.05, 1.2);
      } else if (K === "flyback") {                                     // дробь отбрасывает назад вместе со стулом, руки вверх
        tilt = -1.5 * Math.pow(pr(0, .42), 1.4) + (k > .42 && k < .62 ? Math.sin(pr(.42, .62) * Math.PI) * .14 : 0);
        slideZ = -.55 * Math.pow(pr(0, .45), .7); sp = -.45;
        L = [.7, 1.55, -.35]; R = [-.7, 1.45, -.2];
        thud(.45, 1.6);
      } else if (K === "spin") {                                        // разворачивает от удара и роняет на бок
        tw = side * (1.1 * (1 - Math.pow(1 - pr(0, .4), 3)) - .45 * pr(.5, 1.1)); sp = .3 * pr(.2, .6);
        tiltZ = -side * 1.45 * Math.pow(pr(.35, 1.05), 2); hz = -side * .3;
        L = [.45, .55, .4]; R = [-.45, .6, .35];
        thud(1.05, 1.3);
      } else {                                                          // «head» (дробь, голову снесло) и «back» (пуля, падает назад) — назад вместе со стулом
        sp = k < .25 ? -.4 * (k / .25) : -.2;
        tilt = k < .25 ? 0 : k < .95 ? -1.42 * Math.pow((k - .25) / .7, 2) : k < 1.12 ? -1.42 + Math.sin((k - .95) / .17 * Math.PI) * .12 : -1.42;
        L = [.5, 1.15, -.1]; R = [-.5, 1.05, .05];
        thud(.95, 1.5);
      }
    }
    ps.tilt.rotation.set(tilt, 0, tiltZ); ps.tilt.position.z = -.6 + slideZ;
    ud.sp = sp != null ? sp : lp(ud.sp, lean - ud.jolt * .5, 6);
    ps.spine.rotation.set(ud.sp, tw != null ? tw : lp(ps.spine.rotation.y, twist, 5), ud.frozen && !ud.dead ? Math.sin(t * 3 + i) * .07 : 0);
    ps.spine.scale.y = 1 + (ud.dead ? 0 : shiver ? Math.sin(t * 8.5 + i) * .028 : Math.sin(t * 1.6 + i) * .012);
    // голова: смотрит на того, кто ходит, или на того, в кого целятся
    let look = null;
    if (!ud.dead) {
      const shooter = state.figs[ev ? ev.who : state.turn], tgt = state.figs[aim];
      if (aimedAt && shooter) look = headOf(shooter);
      else if (tgt && tgt !== f) look = headOf(tgt);
      else if (shooter && shooter !== f && play) look = headOf(shooter);
      else if (state.mode === "shotgun" || bl) look = new T.Vector3(0, .9, 0);
    }
    let wantY = 0, wantX = .05;
    if (look) { const lc = ps.body.worldToLocal(tv().a.copy(look)); wantY = Math.max(-1.1, Math.min(1.1, Math.atan2(lc.x, lc.z))); wantX = Math.max(-.5, Math.min(.6, Math.atan2(1.45 - lc.y, Math.hypot(lc.x, lc.z)) - ud.sp * .6)); }
    if (holder && (aim === ud.pid || bl)) { wantY = 0; wantX = .15; }
    ud.hy = lp(ud.hy, ud.dead ? (hyD != null ? hyD : ud.deathKind === "table" ? .35 : 0) : wantY, 4);
    ud.hx = hx != null ? hx : lp(ud.hx, wantX - ud.jolt * .6, 5);
    ps.head.rotation.set(ud.hx + (shiver ? Math.sin(t * 27 + i) * shiver * .9 : 0) + (relief < 1.8 && !ud.dead ? .3 * Math.sin(Math.min(1, relief / 1.8) * Math.PI) : 0), ud.hy, ud.dead ? hz : ud.frozen ? Math.sin(t * 3.2 + i) * .22 : holder && (aim === ud.pid || bl) ? -.15 : 0);
    // кисти — плавно к нужным точкам, затем руки по IK
    ud.hands = ud.hands || { L: new T.Vector3(...L), R: new T.Vector3(...R) };
    const k = Math.min(1, dt * (ud.dead ? 7 : aimedAt || shiver ? 9 : 6));
    ud.hands.L.lerp(tv().b.set(...L), k); ud.hands.R.lerp(tv().c.set(...R), k);
    f.updateMatrixWorld(true);
    const reachArm = (arm, local, side) => {
      const w = ps.body.localToWorld(tv().a.copy(local));
      const pole = ps.body.localToWorld(tv().pole.set(side * .7, .6, -.6));
      P().reach(T, arm, w, pole);
    };
    reachArm(ps.arms.L, ud.hands.L, 1);
    ps.arms.R.el.visible = !(holder && ud.rel === 0);                  // у тебя револьвер — своя правая рука нарисована вместе с ним
    if (!holder) reachArm(ps.arms.R, ud.hands.R, -1);                   // у держащего револьвер правую руку ставит placeRevolver
    ud.stars.rotation.y = t * 2.4; ud.stars.children.forEach((st, j) => { st.position.y = Math.sin(t * 4 + j) * .03; });
    ud.hearts.rotation.y = t;
    ud.rugM.emissive.setRGB(turn ? .18 + Math.sin(t * 4) * .08 : 0, turn ? .06 : 0, 0);
  }

  // где должен быть револьвер: в руке у того, чей ход (или у тебя перед глазами), иначе — на столе
  const RQ = { q: null, m: null, up: null };
  function placeRevolver(t, dt) {
    const ev = state.evAim && performance.now() < state.evAim.until ? state.evAim : null;
    const holderId = ev ? ev.who : ["play", "shot"].includes(state.phase) ? state.turn : null, aim = ev ? ev.target : state.aim;
    const hf = holderId && state.figs[holderId];
    const pos = new T.Vector3(), look = new T.Vector3();
    const reloading = state.phase === "reload" || (state.revHome && performance.now() < state.revHome);
    let onTable = !hf || hf.userData.dead || reloading;
    const vm = rev.userData.vm;
    vm.visible = false; state.revWant = null; state.selfAim = 0; state.vmScale = 1.6;
    if (!onTable && hf.userData.rel === 0) {                           // у тебя в руке: вид из глаз
      vm.visible = true; state.vmScale = .62;
      if (aim === state.me) { pos.copy(camera.localToWorld(tv().a.set(.25, .0, -.5))); look.copy(camera.localToWorld(tv().b.set(-.5, .05, -.36))); state.selfAim = 1; state.vmScale = .5; }
      else if (aim && state.figs[aim]) { pos.copy(camera.localToWorld(tv().a.set(.15, -.17, -.5))); look.copy(headOf(state.figs[aim])); }
      else { pos.copy(camera.localToWorld(tv().a.set(.16, -.22, -.5))); look.copy(camera.localToWorld(tv().b.set(.05, -.9, -2.4))); }
    } else if (!onTable) {
      const ps = hf.userData.person;
      if (aim === holderId) {                                          // у виска
        ps.head.updateWorldMatrix(true, false);
        pos.copy(ps.head.localToWorld(tv().a.set(-.21, .17, .02)));
        look.copy(ps.head.localToWorld(tv().b.set(.3, .17, 0)));
      } else {
        const sh = ps.arms.R.sh.getWorldPosition(tv().a);
        const tgt = aim && state.figs[aim] ? headOf(state.figs[aim]) : ps.body.localToWorld(tv().b.set(-.1, .55, 1.6));
        pos.copy(sh).addScaledVector(tv().c.copy(tgt).sub(sh).normalize(), aim ? .62 : .5);
        if (!aim) pos.y = Math.max(pos.y, .9);
        look.copy(tgt);
      }
      state.revWant = pos.clone();
    } else {
      pos.set(0, .82, 0); state.vmScale = 1.3;
    }
    const k = Math.min(1, dt * (onTable ? 5 : 9));
    state.revPos.lerp(pos, k);
    if (onTable) {
      state.revYaw = (state.revYaw || 0) + dt * (state.revSpin ? 14 * state.revSpin : 0);
      RQ.q = RQ.q || new T.Quaternion();
      RQ.q.setFromEuler(new T.Euler(0, state.revYaw, Math.PI / 2, "YXZ"));
    } else {
      RQ.m = RQ.m || new T.Matrix4(); RQ.q = RQ.q || new T.Quaternion(); RQ.up = RQ.up || new T.Vector3(0, 1, 0);
      RQ.m.lookAt(look, state.revPos, RQ.up); RQ.q.setFromRotationMatrix(RQ.m);
    }
    state.revQ.slerp(RQ.q, k);
    rev.position.copy(state.revPos); rev.quaternion.copy(state.revQ);
    if (!onTable && susOf(holderId)) { shake3(rev, t, (.002 + .012 * (state.susK || 0)) * (hf.userData.rel === 0 ? .7 : 1.3)); if (state.revWant) state.revWant.copy(rev.position); }
    rev.scale.setScalar(rev.scale.x + (state.vmScale - rev.scale.x) * Math.min(1, dt * 8));
    state.revRecoil = Math.max(0, (state.revRecoil || 0) - dt * 4);
    if (state.revRecoil) rev.rotateX(-state.revRecoil * .6);
    if (state.revSpin) state.revSpin = Math.max(0, state.revSpin - dt * .8);
    const cylZ = (state.revTurn || 0) * Math.PI / 3 + (state.revSpin ? t * 30 * state.revSpin : 0);
    rev.userData.cyl.rotation.z += (cylZ - rev.userData.cyl.rotation.z) * Math.min(1, dt * 12);
    rev.userData.hammer.rotation.x = aim && !onTable ? -1.0 : -.5;
    rev.userData.muzzle.intensity = Math.max(0, rev.userData.muzzle.intensity - dt * 30);
  }

  // дрожь ствола, пока палец на спуске: чем дольше заминка, тем сильнее
  function shake3(o, t, amp) {
    if (!amp) return;
    o.position.x += (Math.sin(t * 41) + Math.sin(t * 67 + 1)) * amp * .5; o.position.y += (Math.sin(t * 37 + 2) + Math.sin(t * 59)) * amp * .5; o.position.z += Math.sin(t * 47 + 3) * amp * .4;
    o.rotateX(Math.sin(t * 31) * amp * 2.2); o.rotateY(Math.sin(t * 43 + 1) * amp * 2.2);
  }
  const susOf = (pid) => { const n = performance.now(), su = state.sus; return su && su.who === pid && n >= su.from && n < su.until ? su : null; };

  // «Верю — не верю»: у каждого свой револьвер. Лежит на столе; проигравший вскрытие поднимает его к виску
  function placeBluff(t, dt) {
    const ev = state.evAim && performance.now() < state.evAim.until ? state.evAim : null;
    state.selfAim = 0;
    Object.values(state.figs).forEach((f) => {
      const ud = f.userData, r = ud.rv; if (!r) return;
      const hold = ev && ev.who === ud.pid && !ud.dead, vm = r.userData.vm;
      const pos = tv().a, look = tv().b;
      let scale = 1.25; vm.visible = false;
      const el = hold && ev.at ? (performance.now() - ev.at) / 1000 : 9, pick = el < .6;   // сначала берёт со стола и смотрит на него, потом медленно — к виску
      if (hold && ud.rel === 0) {
        vm.visible = true; scale = .5; state.selfAim = pick ? 0 : 1;
        if (pick) { pos.copy(camera.localToWorld(new T.Vector3(.1, -.3, -.6))); look.copy(camera.localToWorld(new T.Vector3(-.1, -.4, -1.8))); }
        else { pos.copy(camera.localToWorld(new T.Vector3(.25, 0, -.5))); look.copy(camera.localToWorld(new T.Vector3(-.5, .05, -.36))); }
      } else if (hold) {
        const ps = ud.person; ps.head.updateWorldMatrix(true, false);
        if (pick) { pos.copy(ps.body.localToWorld(new T.Vector3(-.12, 1.08, .48))); look.copy(ps.body.localToWorld(new T.Vector3(-.12, .95, 1.6))); }
        else { pos.copy(ps.head.localToWorld(new T.Vector3(-.21, .17, .02))); look.copy(ps.head.localToWorld(new T.Vector3(.3, .17, 0))); }
      }
      const k = Math.min(1, dt * (hold ? (pick ? 5 : 3.2) : 5));
      ud.rvPos = ud.rvPos || r.position.clone(); ud.rvQ = ud.rvQ || r.quaternion.clone();
      const want = new T.Quaternion();
      if (hold) { const m = new T.Matrix4().lookAt(look, pos, new T.Vector3(0, 1, 0)); want.setFromRotationMatrix(m); ud.rvPos.lerp(pos, k); }
      else { ud.rvPos.lerp(worldOf(f, .42, .8, .74), k); want.setFromEuler(new T.Euler(0, f.rotation.y + 2.2, Math.PI / 2, "YXZ")); }
      ud.rvQ.slerp(want, k);
      r.position.copy(ud.rvPos); r.quaternion.copy(ud.rvQ);
      if (hold && susOf(ud.pid)) shake3(r, t, (.002 + .013 * (state.susK || 0)) * (ud.rel === 0 ? .7 : 1.4));
      r.scale.setScalar(r.scale.x + (scale - r.scale.x) * Math.min(1, dt * 8));
      ud.rvRecoil = Math.max(0, (ud.rvRecoil || 0) - dt * 4);
      if (ud.rvRecoil) r.rotateX(-ud.rvRecoil * .6);
      const cylZ = (ud.rvTurn || 0) * Math.PI / 3;
      r.userData.cyl.rotation.z += (cylZ - r.userData.cyl.rotation.z) * Math.min(1, dt * 12);
      r.userData.hammer.rotation.x = hold ? -1.0 : -.5;
      r.userData.muzzle.intensity = Math.max(0, r.userData.muzzle.intensity - dt * 30);
      if (hold && ud.rel !== 0) P().reach(T, ud.person.arms.R, r.position, ud.person.body.localToWorld(new T.Vector3(-.9, 1.2, -.3)));
    });
  }

  /* ---------------------------------------------------------------- подписи поверх сцены (HTML): имена и предметы */
  const labelPool = [];
  const rotOn = () => document.body.classList.contains("cfs-rot");
  const hostW = () => (host ? host.clientWidth : 1), hostH = () => (host ? host.clientHeight : 1);
  // точка сцены → координаты внутри сцены (CSS-пиксели, без учёта поворота страницы)
  const toScreen = (w) => { const v = w.clone().project(camera); return { x: (v.x + 1) / 2 * hostW(), y: (1 - v.y) / 2 * hostH(), z: v.z }; };
  // касание → координаты внутри сцены: страница может быть повёрнута на 90° (горизонтальный вид при вертикальном телефоне)
  function local(ev) {
    const r = canvas.getBoundingClientRect();
    if (rotOn()) return { x: ev.clientY - r.top, y: r.right - ev.clientX };
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function updateLabels() {
    if (!labelLayer || !host || !host.isConnected) return;
    const Wd = hostW(), Hd = hostH();
    if (!Wd || !Hd) return;
    const items = [], now = performance.now(), topY = host.classList.contains("fs") ? 74 : 30;   // на весь экран — не залезать под верхнюю строку
    const ITEMS = window.Roulette ? Roulette.ITEMS : {};
    Object.values(state.figs).forEach((f) => {
      const ud = f.userData;
      if (ud.rel !== 0 && f.visible) items.push({ kind: "name", text: ud.name + (ud.brave && ud.alive ? " 🎖" : ""), world: worldOf(f, 0, ud.dead ? 1.3 : 2.1, 0), turn: state.turn === ud.pid && ["play", "shot"].includes(state.phase), dead: !ud.alive, prio: 0 });
      if (ud.bounty && ud.alive && ud.rel !== 0 && f.visible) items.push({ kind: "bounty", text: "🪙 " + ud.bounty, world: worldOf(f, 0, 2.42, 0), prio: -1 });
      if (state.claim && state.claim.pid === ud.pid && now < state.claim.until && ud.rel !== 0 && f.visible) items.push({ kind: "claim", text: state.claim.text, hot: state.claim.hot, world: worldOf(f, 0, 2.45, 0), prio: -1 });
      if (ud.rel === 0 && ud.items.visible) ud.items.children.forEach((m) => {             // свои предметы подписаны значком — их можно нажать
        const info = ITEMS[m.userData.key] || { emoji: "?" };
        items.push({ kind: "item", text: info.emoji, world: m.localToWorld(new T.Vector3(0, -.02, .14)), mine: true, sel: m.userData.index === state.sel, data: m.userData, prio: 1, below: true });
      });
    });
    items.sort((a, b) => a.prio - b.prio);
    const taken = [];
    const hits = (b) => taken.some((o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y);
    let used = 0;
    items.forEach((it) => {
      const v = it.world.clone().project(camera);
      if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) return;
      const x = (v.x + 1) / 2 * Wd, y = (1 - v.y) / 2 * Hd;
      const el = labelPool[used] || (labelPool[used] = Object.assign(document.createElement("div"), { className: "c3-label" }));
      if (el.parentNode !== labelLayer) labelLayer.appendChild(el);
      used++;
      const cls = `c3-label ${it.kind} ${it.mine ? "mine" : ""} ${it.turn ? "turn" : ""} ${it.dead ? "dead" : ""} ${it.sel ? "sel" : ""} ${it.hot ? "hot" : ""}`;
      el.style.display = "block";
      if (el.textContent !== it.text || el._cls !== cls || !el._w) { el.className = cls; el.textContent = it.text; el._cls = cls; el._w = el.offsetWidth; el._h = el.offsetHeight; }
      const w = el._w, h = el._h;
      const bx = { x: Math.max(2, Math.min(Wd - w - 2, x - w / 2)), y: Math.max(topY, it.below ? y : y - h), w, h };
      for (let k = 0; k < 6 && hits(bx) && !it.below; k++) bx.y += h + 2;
      if (bx.y + h > Hd - 2) { el.style.display = "none"; return; }
      taken.push(bx);
      el.style.transform = `translate(${Math.round(bx.x)}px, ${Math.round(bx.y)}px)`;
      el._data = it.data || null;
    });
    for (let i = used; i < labelPool.length; i++) labelPool[i].style.display = "none";
  }

  /* ---------------------------------------------------------------- цикл кадров */
  function frame(ms) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || ms - lastDraw < 22) return;
    lastDraw = ms;
    const t = ms / 1000, dt = Math.min(.05, clock0 ? t - clock0 : .016); clock0 = t;
    const nowF = performance.now(), su = state.sus && nowF < state.sus.until ? state.sus : null;
    state.susK = su && nowF >= su.from ? Math.min(1, (nowF - su.from) / Math.max(1, su.until - su.from)) : 0;
    state.beat = (state.beat || 0) + dt * (1.1 + state.susK * 1.8);
    const pulse = state.susK ? Math.pow(Math.max(0, Math.sin(state.beat * Math.PI * 2)), 12) : 0;
    const fovWant = (state.baseFov || camera.fov) * (1 - .17 * state.susK);
    if (Math.abs(camera.fov - fovWant) > .05) { camera.fov += (fovWant - camera.fov) * Math.min(1, dt * (state.susK ? 1.6 : 4)); camera.updateProjectionMatrix(); }
    lamp.rotation.z = Math.sin(t * .9) * .09; lamp.rotation.x = Math.sin(t * .63) * .05;
    const flick = state.flicker > 0 ? (Math.random() < .5 ? .2 : 1) : (Math.random() < .004 ? .35 : 1);
    state.flicker = Math.max(0, state.flicker - dt);
    spot.intensity = 3.4 * flick; bulb.material.color.setHex(flick < 1 ? 0x6a5030 : 0xffe0a0); state.cone.material.opacity = .05 * flick;
    redLight.intensity = 1 + Math.sin(t * 2.2) * .3;
    candleLight.intensity = .5 + Math.sin(t * 13) * .08 + Math.random() * .08;
    const sh = state.shake; state.shake = Math.max(0, state.shake - dt * 1.8);
    const table = state.view === "table", rev0 = state.mode === "revolver";
    const c0 = geo().cam;
    const camWant = table ? new T.Vector3(0, 2.75, 1.55) : new T.Vector3(c0[0] + Math.sin(t * .7) * .03, c0[1] + Math.sin(t * 1.1) * .015, c0[2]);
    state.cam = state.cam || camWant.clone(); state.cam.lerp(camWant, Math.min(1, dt * 4));
    camera.position.set(state.cam.x + (Math.random() - .5) * sh * .18, state.cam.y + (Math.random() - .5) * sh * .12, state.cam.z);
    const ev = state.evAim && performance.now() < state.evAim.until ? state.evAim : null;
    const aimNow = ev ? ev.target : state.aim, turnNow = ev ? ev.who : state.turn;
    const want = new T.Vector3(0, 1.0, -.3), tf = state.figs[turnNow], af = state.figs[aimNow];
    if (table) want.set(0, .72, .2);
    else if (aimNow && turnNow === state.me && af && af.userData.rel !== 0) want.set(af.position.x * .62, 1.2, af.position.z * .62);
    else if ((rev0 || state.mode === "bluff") && ev && aimNow === state.me) want.set(0, 1.05, -.6);
    else if (rev0 && aimNow === state.me) want.set(0, 1.05, -.6);
    else if (!ev && state.reveal && performance.now() < state.reveal.until) want.set(0, 1.08, .3);
    else if (tf && turnNow !== state.me && tf.userData.rel !== 0) want.set(tf.position.x * .5, 1.1, tf.position.z * .5 - .1);
    const nowMs = performance.now(), fo = state.focus && state.figs[state.focus.pid];
    if (!table && state.free && (state.free.hold || nowMs - state.free.at < 3500)) {
      const d = 3; want.set(camera.position.x + Math.sin(state.free.yaw) * Math.cos(state.free.pitch) * d, camera.position.y + Math.sin(state.free.pitch) * d, camera.position.z - Math.cos(state.free.yaw) * Math.cos(state.free.pitch) * d);
    } else if (!table && fo && nowMs - state.focus.at < 4500) want.set(fo.position.x * .62, 1.3, fo.position.z * .62);
    else { state.free = null; state.focus = null; }
    state.look = state.look || want.clone();
    state.look.lerp(want, Math.min(1, dt * 3.5));
    camera.lookAt(state.look.x + (Math.random() - .5) * sh * .1, state.look.y + (Math.random() - .5) * sh * .1, state.look.z);
    if (state.debugCam) { camera.position.set(...state.debugCam.pos); camera.lookAt(...state.debugCam.look); }   // только для проверки сцены
    state.roll = (state.roll || 0) + ((state.selfAim ? -.13 : 0) - (state.roll || 0)) * Math.min(1, dt * 4);
    if (state.roll) camera.rotateZ(state.roll);
    camera.updateMatrixWorld();
    if (!rev0 && gun) {                                              // дробовик: раскрутка к цели, отдача
      if (state.spin) {
        const s = state.spin; s.t += dt; const k = Math.min(1, s.t / s.dur);
        const e = 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * .04;
        state.gunYaw = s.from + (s.to - s.from) * e;
        if (k >= 1) { state.gunYaw = s.to; state.spin = null; }
      }
      state.gunKick = Math.max(0, (state.gunKick || 0) - dt * 3);
      gun.rotation.y = state.gunYaw;
      gun.rotation.x = -state.gunKick * .5;
      state.gunUp = (state.gunUp || 0) + ((state.aim ? 1 : 0) - (state.gunUp || 0)) * Math.min(1, dt * 5);
      gun.position.y = .86 + state.gunUp * .06 + (state.spin ? .04 : 0);
      if (state.aim && !state.spin) gun.rotation.z = Math.sin(t * 9) * .015;
      if (state.susK) { gun.rotation.z += (Math.sin(t * 37) + Math.sin(t * 53)) * .012 * state.susK; gun.position.y += Math.sin(t * 43) * .006 * state.susK; }
      gun.userData.muzzle.intensity = Math.max(0, gun.userData.muzzle.intensity - dt * 30);
    }
    const lit = .55 + .45 * flick;
    Object.values(state.figs).forEach((f, i) => { pose(f, t, dt, i); });
    if (rev0) placeRevolver(t, dt);
    if (state.mode === "bluff") placeBluff(t, dt);
    const mf = state.figs[state.me];                                   // свой выбранный предмет приподнят
    if (mf) mf.userData.items.children.forEach((m) => { const up = m.userData.index === state.sel ? .1 + Math.sin(t * 5) * .015 : 0; m.position.y += (up - m.position.y) * Math.min(1, dt * 8); });
    if (state.rankCard) {                                              // карта стола: спускается, делает один полный оборот и уходит вверх
      const rc = state.rankCard, sh = state.rankShow, k = sh ? (performance.now() - sh.at) / 2700 : 2;
      rc.g.visible = k < 1;
      if (k < 1) {
        const inK = Math.min(1, k / .16), outK = Math.max(0, (k - .84) / .16);
        rc.g.position.y = 1.62 + (1 - ease(inK)) * .9 + ease(outK) * .9; rc.g.scale.setScalar(Math.max(.01, ease(inK) * (1 - ease(outK))));
        rc.g.rotation.y = ease(Math.min(1, Math.max(0, (k - .1) / .78))) * Math.PI * 2; rc.g.rotation.z = Math.sin(t * .9) * .04;
      } else state.rankShow = null;
    }
    Object.values(state.figs).forEach((f) => { if (rev0 && f.userData.rel !== 0) { const ud = f.userData, ev2 = state.evAim && performance.now() < state.evAim.until ? state.evAim : null; if ((ev2 ? ev2.who : state.turn) === ud.pid && state.revWant && !ud.dead && ["play", "shot"].includes(state.phase)) { const pole = ud.person.body.localToWorld(new T.Vector3(-.9, (ev2 ? ev2.target : state.aim) === ud.pid ? 1.2 : -.4, -.3)); P().reach(T, ud.person.arms.R, state.revWant, pole); } } });
    void lit;
    // орбита пули между зеркалами, пока катятся кубики
    if (state.orbit) {
      const o = state.orbit; o.t += dt;
      const a = o.t * 7, r = .9 + Math.sin(o.t * 3) * .2;
      state.orbitPos = state.orbitPos || new T.Vector3();
      state.orbitPos.set(Math.cos(a) * r, 1.15 + Math.sin(o.t * 5) * .15, Math.sin(a) * r);
      if (!state.orbitMesh) { state.orbitMesh = new T.Mesh(new T.SphereGeometry(.035, 5, 4), new T.MeshBasicMaterial({ color: 0xfff0a0 })); scene.add(state.orbitMesh); }
      state.orbitMesh.visible = true; state.orbitMesh.position.copy(state.orbitPos);
      if (Math.random() < .5) burst(state.orbitPos, 0xffd890, 1, .1, { size: .02, life: .25, gravity: 0 });
    } else if (state.orbitMesh) state.orbitMesh.visible = false;
    state.smoke = state.smoke.filter((m) => { m.userData.life -= dt; m.position.addScaledVector(m.userData.v, dt); m.scale.multiplyScalar(1 + dt * .45); m.material.opacity = Math.max(0, m.userData.life / 4);
      if (m.userData.life <= 0) { scene.remove(m); m.material.dispose(); return false; } return true; });
    const dp = state.dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) { let y = dp.getY(i) + dt * .03; if (y > 2.6) y = .9; dp.setY(i, y); dp.setX(i, dp.getX(i) + Math.sin(t + i) * dt * .02); }
    dp.needsUpdate = true;
    const tr = geo().table;
    for (let i = parts.length - 1; i >= 0; i--) {
      const m = parts[i], u = m.userData; u.life -= dt;
      if (!u.line) {
        u.v.y -= u.g * dt; m.position.addScaledVector(u.v, dt);
        const fl = Math.hypot(m.position.x, m.position.z) < tr ? .79 : 0;
        if (m.position.y < fl && m.position.y > fl - .3) { m.position.y = fl; u.v.set(0, 0, 0); }
        else if (m.position.y < 0) { m.position.y = 0; u.v.set(0, 0, 0); }
      }
      m.material.opacity = Math.max(0, u.life / u.max);
      if (u.life <= 0) { scene.remove(m); if (u.line) m.geometry.dispose(); m.material.dispose(); parts.splice(i, 1); }
    }
    casings.forEach((m) => { const u = m.userData; if (u.rest) return; u.v.y -= 6 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.spin * dt; m.rotation.z += u.spin * .5 * dt;
      const fl = Math.hypot(m.position.x, m.position.z) < tr - .02 ? .8 : .03; if (m.position.y <= fl) { m.position.y = fl; u.v.multiplyScalar(.3); u.v.y = Math.abs(u.v.y) > .5 ? -u.v.y * .3 : 0; if (u.v.length() < .2) { u.rest = true; m.rotation.x = Math.PI / 2; } } });
    if (af && aimNow !== state.me && aimNow !== turnNow && af.userData.rel !== 0 && !af.userData.dead) { state.cross.visible = true; state.cross.position.copy(headOf(af)); state.cross.scale.setScalar(.3 + Math.sin(t * 8) * .05); }
    else state.cross.visible = false;
    for (let i = anim.length - 1; i >= 0; i--) { const a = anim[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); if (a.step) a.step(k); if (k >= 1) { anim.splice(i, 1); if (a.done) a.done(); } }
    state.flash = Math.max(0, state.flash - dt * 5); state.hurt = Math.max(0, state.hurt - dt * .7);
    state.dark = (state.dark || 0) + ((state.selfAim ? 1 : 0) - (state.dark || 0)) * Math.min(1, dt * 3);
    post.uniforms.flash.value = state.flash; post.uniforms.hurt.value = Math.max(state.hurt, pulse * .12 * state.susK); post.uniforms.time.value = t;
    post.uniforms.dark.value = Math.max(state.dark, state.susK * .5 + pulse * .35);
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    updateLabels();
  }

  /* ---------------------------------------------------------------- подключение к странице */
  function resize() {
    if (!host || !renderer) return;
    const rw = Math.max(1, hostW()), rh = Math.max(1, hostH()), wide = rw / rh > 1.3;
    W = wide ? 320 : 240; H = Math.max(140, Math.round((W * rh) / rw));
    renderer.setSize(W, H, false);
    rt.setSize(W, H);
    post.uniforms.res.value.set(W, H);
    camera.aspect = W / H; camera.fov = W / H < 1.1 ? (state.mode === "revolver" ? 70 : 66) : W / H > 1.6 ? (state.mode === "revolver" ? 54 : 50) : 56; state.baseFov = camera.fov; camera.updateProjectionMatrix();
  }

  function pickAt(lx, ly) {
    const ray = state.ray || (state.ray = new T.Raycaster());
    ray.setFromCamera(new T.Vector2((lx / hostW()) * 2 - 1, -(ly / hostH()) * 2 + 1), camera);
    const near = (w, r) => { const p = toScreen(w); return p.z < 1 && Math.hypot(p.x - lx, p.y - ly) < r ? Math.hypot(p.x - lx, p.y - ly) : null; };
    // свои предметы на столе: ближайший к пальцу
    const mf = state.figs[state.me];
    if (mf && mf.userData.items.visible && api.onPickItem) {
      let best = null, bd = 40;
      mf.userData.items.children.forEach((m) => { const d = near(m.localToWorld(new T.Vector3(0, .04, 0)), 40); if (d != null && d < bd) { bd = d; best = m; } });
      if (best) { api.onPickItem(best.userData); return; }
    }
    // револьвер: в «Русской рулетке» — крутануть барабан
    if (state.mode === "revolver" && rev && api.onPickGun && state.turn === state.me && near(rev.position, 46) != null) { api.onPickGun(); return; }
    const meshes = [];
    Object.values(state.figs).forEach((f) => { if (f.userData.rel !== 0 && f.visible) f.userData.person.hit.forEach((m) => { m.userData.pid = f.userData.pid; meshes.push(m); }); });
    let hit = ray.intersectObjects(meshes)[0], pid = hit && hit.object.userData.pid;
    if (!pid) {                                                        // промахнулся по коробке — берём ближайшего к лучу
      let best = .5;
      Object.values(state.figs).forEach((f) => { if (f.userData.rel === 0 || !f.visible) return; const d = ray.ray.distanceToPoint(headOf(f).add(new T.Vector3(0, -.25, 0))); if (d < best) { best = d; pid = f.userData.pid; } });
    }
    if (!pid) return;
    const f = state.figs[pid];
    if (state.turn !== state.me || (f && f.userData.dead) || !api.onPick) { state.focus = { pid, at: performance.now() }; state.free = null; return; }
    api.onPick(pid);
  }

  function mount(el, cb) {
    if (host === el && renderer) return cb && cb();
    state.wantHost = el;
    load((err) => {
      if (err) return cb && cb(err);
      if (state.wantHost !== el || !el.isConnected) return;
      if (!window.CellarPeople) return cb && cb(new Error("Не загрузились персонажи подвала"));
      host = el;
      if (!renderer) {
        canvas = document.createElement("canvas"); canvas.className = "cellar-canvas";
        try { renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" }); }
        catch (e) { renderer = null; return cb && cb(new Error("Этот телефон не умеет 3D — играть можно кнопками ниже")); }
        renderer.setPixelRatio(1);
        rt = new T.WebGLRenderTarget(W, H, { minFilter: T.NearestFilter, magFilter: T.NearestFilter });
        post = new T.ShaderMaterial({ uniforms: { tDiffuse: { value: rt.texture }, res: { value: new T.Vector2(W, H) }, flash: { value: 0 }, hurt: { value: 0 }, time: { value: 0 }, dark: { value: 0 } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: POST_FS });
        postScene = new T.Scene(); postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));
        build();
        let down = null;
        const tapStart = (ev) => { const l = local(ev); down = { x: l.x, y: l.y, t: performance.now() }; };
        const tapEnd = (ev, fn) => { const l = local(ev); if (down && Math.hypot(l.x - down.x, l.y - down.y) < 12 && performance.now() - down.t < 500) fn(l); down = null; };
        canvas.addEventListener("pointerdown", tapStart);
        canvas.addEventListener("pointerup", (ev) => { if (state.free) state.free.hold = false; tapEnd(ev, (l) => pickAt(l.x, l.y)); });
        canvas.addEventListener("pointercancel", () => { if (state.free) state.free.hold = false; });
        canvas.style.touchAction = "pan-y";
        canvas.addEventListener("pointermove", (ev) => {
          const l = local(ev);
          if (!down || state.view === "table" || Math.abs(l.x - down.x) < 8) return;
          if (!state.free || !state.free.hold) {
            const look = state.look || new T.Vector3(0, 1, -.3), dx = look.x - camera.position.x, dy = look.y - camera.position.y, dz = look.z - camera.position.z;
            state.free = { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), at: performance.now(), hold: true, lx: l.x };
          }
          const f = state.free;
          f.yaw = Math.max(-1.75, Math.min(1.75, f.yaw + (l.x - f.lx) * .006)); f.lx = l.x; f.at = performance.now(); state.focus = null;
        });
        labelLayer = document.createElement("div"); labelLayer.className = "c3-labels";
        labelLayer.addEventListener("pointerdown", tapStart);
        labelLayer.addEventListener("pointerup", (ev) => tapEnd(ev, () => {
          const el2 = ev.target.closest(".c3-label.item");
          if (el2 && el2._data && api.onPickItem) api.onPickItem(el2._data);
        }));
      }
      if (canvas.parentNode !== el) el.appendChild(canvas);
      if (labelLayer.parentNode !== el) el.appendChild(labelLayer);
      resize();
      if (!raf) raf = requestAnimationFrame(frame);
      cb && cb();
    });
  }

  function unmount() {
    cancelAnimationFrame(raf); raf = 0;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    if (labelLayer && labelLayer.parentNode) labelLayer.parentNode.removeChild(labelLayer);
    host = null;
  }

  let lit = null;
  function highlight(it) {
    if (lit) lit.position.y = 0;
    lit = it; anim.push({ t: 0, dur: .35, step: (k) => { it.position.y = Math.sin(k * Math.PI) * .12; } });
  }
  function setView(v) { state.view = v; }
  function select(i) { state.sel = i == null ? null : i; }

  // новая партия — убрать кровь, гильзы и людей прошлой
  function reset() {
    if (!scene) return;
    Object.values(state.figs).forEach((f) => { dropFig(f); }); state.figs = {};
    casings.forEach((m) => { scene.remove(m); disposeTree(m); }); casings.length = 0;
    if (state.sawn && gun) { gun.attach(gun.userData.front); gun.userData.front.position.set(0, 0, 0); gun.userData.front.quaternion.identity(); state.sawn = false; }
    resetDecals();
    state.aim = null; state.spin = null; state.evAim = null; state.orbit = null; anim.length = 0; state.firing = false; state.sus = null; state.relief = null; state.rankShow = null;
  }

  window.addEventListener("resize", resize);
  // для проверок: где на экране (внутри сцены) голова игрока, свой предмет, револьвер
  const _probe = { head: (pid) => state.figs[pid] && toScreen(headOf(state.figs[pid])), item: (i) => { const f = state.figs[state.me], m = f && f.userData.items.children[i]; return m && toScreen(m.localToWorld(new T.Vector3(0, .04, 0))); }, rev: () => rev && toScreen(rev.position) };
  return Object.assign(api, { mount, unmount, sync, event, reset, resize, setView, select, timing, ready: () => !!renderer, _state: state, _probe });
})();
