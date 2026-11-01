/* «Последний заряд»: 3D-подвал в жёстком пикселе старых шутеров.
   Сцена рисуется в крошечном разрешении (240 px по ширине), цвета урезаются с дизерингом, картинка растягивается без сглаживания.
   Подписи (имена, предметы) — обычный HTML поверх сцены: чёткий белый шрифт при любом размере экрана. */
const Cellar = (() => {
  "use strict";
  let T = null;                                              // THREE после загрузки
  let renderer, scene, camera, rt, post, postScene, postCam, raf = 0, host = null, canvas = null, labelLayer = null;
  let W = 240, H = 240, clock0 = 0, lastDraw = 0;
  const state = { seats: [], figs: {}, me: null, gunYaw: 0, shake: 0, flash: 0, hurt: 0, flicker: 0, smoke: [], dust: null, view: null };
  let gun, lamp, spot, bulb, redLight, candleLight, roomGroup, figGroup, decals;
  const api = { onPick: null, onPickItem: null };

  /* ---------------------------------------------------------------- загрузка three.js по требованию */
  let waiting = null;                                         // загрузка идёт — копим ожидающих, скрипт вставляем один раз
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
    felt: () => tex(32, (g, s) => {                         // старое сукно стола: тёмно-зелёное, в пятнах
      noise(g, s, 52, 10, [.42, .78, .5]);
      g.fillStyle = "rgba(60,0,0,.55)"; for (let k = 0; k < 26; k++) g.fillRect(6 + rnd() * 9 | 0, 18 + rnd() * 7 | 0, 1, 1);
      g.fillStyle = "rgba(0,0,0,.3)"; for (let k = 0; k < 60; k++) g.fillRect(rnd() * s | 0, rnd() * s | 0, 1, 1);
    }, 3),
    metal: () => tex(8, (g, s) => noise(g, s, 52, 16, [.9, .92, 1])),
    blued: () => tex(16, (g, s) => { noise(g, s, 46, 10, [.8, .86, 1]); g.fillStyle = "rgba(200,210,230,.35)"; g.fillRect(0, 3, s, 1); g.fillRect(0, 11, s, 1); }),
    engraved: () => tex(16, (g, s) => {                     // гравировка на колодке
      noise(g, s, 120, 20, [.95, .95, 1]);
      g.fillStyle = "#4a4a54"; for (let i = 0; i < 16; i++) { const a = i * .9; g.fillRect(8 + Math.cos(a) * (2 + i * .35) | 0, 8 + Math.sin(a) * (2 + i * .35) | 0, 1, 1); }
      g.fillRect(2, 2, 12, 1); g.fillRect(2, 13, 12, 1);
    }),
    door: () => tex(32, (g, s) => {
      noise(g, s, 40, 10, [.7, .78, .72]);
      g.fillStyle = "#14140f"; g.fillRect(0, 0, s, 1); g.fillRect(0, 0, 1, s); g.fillRect(s - 1, 0, 1, s);
      g.fillStyle = "#0a0a08"; g.fillRect(10, 5, 12, 6); g.fillStyle = "#3a3a30"; for (let x = 12; x < 22; x += 3) g.fillRect(x, 5, 1, 6);
      g.fillStyle = "#5a4a2a"; g.fillRect(25, 17, 3, 2);
      g.fillStyle = "rgba(60,30,10,.5)"; for (let k = 0; k < 60; k++) g.fillRect(rnd() * s | 0, 20 + rnd() * 12 | 0, 1, 1);
    }),
    tally: () => tex(32, (g, s) => {                        // зарубки на стене: кто-то считал дни
      g.clearRect(0, 0, s, s); g.fillStyle = "rgba(230,220,200,.7)";
      for (let k = 0; k < 4; k++) { const bx = 2 + k * 8, by = 6 + (k % 2) * 12; for (let i = 0; i < 4; i++) g.fillRect(bx + i * 1.5 | 0, by, 1, 7); for (let i = 0; i < 6; i++) g.fillRect(bx + i, by + 5 - i, 1, 1); }
    }),
  };

  /* ---------------------------------------------------------------- пост-обработка: урезание цветов + дизеринг */
  const POST_FS = `
    uniform sampler2D tDiffuse; uniform vec2 res; uniform float flash, hurt, time;
    varying vec2 vUv;
    float bayer(vec2 p) { int x = int(mod(p.x, 4.0)), y = int(mod(p.y, 4.0)); int i = x + y * 4;
      float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0; return 0.0; }
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = mix(c, vec3(1.0, .95, .8), flash * .6);
      c = mix(c, vec3(.55, 0.0, 0.0), hurt * .55);
      vec2 d = vUv - .5; c *= 1.0 - dot(d, d) * 1.4;                    // виньетка
      c = pow(c, vec3(.82)) * 1.12; c.r *= 1.05; c.b *= .92;            // тёплый грязный свет
      float th = (bayer(gl_FragCoord.xy) - .5) * .7;
      float L = 8.0;                                                     // мало уровней = жёсткий пиксель
      c = floor(c * L + th + .5) / L;
      gl_FragColor = vec4(c, 1.0);
    }`;

  /* ---------------------------------------------------------------- общие детали */
  const mat = (o) => new T.MeshLambertMaterial(o);
  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const cyl = (r1, r2, l, m, seg = 8) => new T.Mesh(new T.CylinderGeometry(r1, r2, l, seg), m);
  const put = (parent, m, x, y, z, rx = 0, ry = 0, rz = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m; };
  function spriteTex(canvas) { const t = new T.CanvasTexture(canvas); t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; }
  // освободить память видеокарты: у каждого объекта свои геометрии, материалы и текстуры
  function disposeTree(o) { o.traverse((x) => { if (x.geometry && x.geometry !== state.partGeo) x.geometry.dispose(); if (x.material) [].concat(x.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); }); }); }

  /* ---------------------------------------------------------------- дробовик: двуствольный, из низкополигональных деталей */
  function makeGun() {
    const g = new T.Group();
    const steel = mat({ color: 0x8e92a0, map: TEX.blued(), emissive: 0x101014, flatShading: true });
    const plate = mat({ color: 0xc8c8d0, map: TEX.engraved(), emissive: 0x18181c, flatShading: true });
    const dark = mat({ color: 0x1c1c22, flatShading: true }), blackM = new T.MeshBasicMaterial({ color: 0x000000 });
    const woodM = mat({ color: 0x7a4422, map: TEX.wood(), flatShading: true }), woodD = mat({ color: 0x3a1e0e, flatShading: true });
    const brass = mat({ color: 0xd8b050, emissive: 0x2a1a00 });
    const front = new T.Group(); g.add(front);                       // передняя часть стволов — её отпиливает ножовка
    [-.037, .037].forEach((x) => {
      const br = put(g, cyl(.035, .035, .3, steel, 10), x, .06, -.2, Math.PI / 2);
      put(front, cyl(.035, .035, .32, steel, 10), x, .06, -.51, Math.PI / 2);
      put(front, cyl(.04, .04, .03, dark, 10), x, .06, -.665, Math.PI / 2);
      put(front, new T.Mesh(new T.CircleGeometry(.025, 10), blackM), x, .06, -.681, 0, Math.PI);
      put(g, new T.Mesh(new T.CircleGeometry(.03, 10), mat({ color: 0xd8d8e0, emissive: 0x404040 })), x, .06, -.351, 0, Math.PI);   // срез (виден, когда стволы отпилены)
      void br;
    });
    put(g, box(.03, .02, .05, dark), 0, .03, -.04);                  // нижняя планка между стволами
    put(g, box(.022, .016, .3, dark), 0, .101, -.2);                 // прицельная планка с насечкой
    for (let i = 0; i < 6; i++) put(g, box(.024, .004, .006, steel), 0, .11, -.33 + i * .05);
    put(front, box(.022, .016, .3, dark), 0, .101, -.5);
    put(front, box(.012, .016, .012, brass), 0, .116, -.655);       // мушка
    put(front, box(.15, .03, .03, dark), 0, .06, -.53);              // кольцо стволов
    put(g, box(.1, .056, .26, woodM), 0, .012, -.2);                 // цевьё с насечкой
    for (let i = 0; i < 5; i++) put(g, box(.102, .006, .01, woodD), 0, .0, -.3 + i * .045);
    put(g, box(.126, .11, .17, plate), 0, .045, .02);                // колодка с гравировкой
    put(g, cyl(.018, .018, .135, dark, 6), 0, .0, -.065, 0, 0, Math.PI / 2);   // шарнир
    put(g, box(.035, .02, .08, dark), 0, .108, .075, 0, .45);        // запирающий рычаг
    put(g, box(.03, .01, .03, brass), 0, .103, .02);                 // предохранитель
    [[-.022, .085], [.022, .095]].forEach(([x, z]) => put(g, box(.018, .045, .03, dark), x, .112, z, -.55));   // курки
    // скоба и два спусковых крючка
    put(g, box(.02, .012, .13, dark), 0, -.05, .085); put(g, box(.02, .05, .012, dark), 0, -.025, .02); put(g, box(.02, .04, .012, dark), 0, -.03, .145);
    put(g, box(.012, .035, .012, steel), 0, -.018, .065, .3); put(g, box(.012, .03, .012, steel), 0, -.016, .1, .3);
    put(g, box(.09, .1, .15, woodM), 0, .0, .18, .2);                // пистолетная шейка
    for (let i = 0; i < 3; i++) put(g, box(.092, .004, .1, woodD), 0, -.03 + i * .025, .18, .2);
    put(g, box(.1, .145, .32, woodM), 0, -.035, .38, .1);            // приклад
    put(g, box(.03, .06, .2, woodM), .05, .0, .4, .1);               // щека
    put(g, box(.108, .17, .03, mat({ color: 0x3a1410 })), 0, -.055, .545, .1);   // затыльник
    put(g, cyl(.012, .012, .03, steel, 6), 0, -.1, .3, 0, 0, Math.PI / 2);       // антабка
    const muzzle = new T.PointLight(0xffc070, 0, 4); muzzle.position.set(0, .06, -.75); g.add(muzzle);
    g.userData = { muzzle, front };
    return g;
  }

  /* ---------------------------------------------------------------- предметы на столе */
  function itemMesh(key) {
    const g = new T.Group(), add = (m, x, y, z, rx, ry, rz) => put(g, m, x, y, z, rx, ry, rz);
    const steel = mat({ color: 0x9a9aa8, flatShading: true }), black = mat({ color: 0x1a1a1e, flatShading: true });
    if (key === "flashlight") {
      add(cyl(.028, .028, .15, black), 0, .03, 0, 0, 0, Math.PI / 2);
      add(cyl(.042, .03, .05, mat({ color: 0x3a3a40, flatShading: true })), .095, .04, 0, 0, 0, Math.PI / 2);
      add(new T.Mesh(new T.CircleGeometry(.036, 8), new T.MeshBasicMaterial({ color: 0xfff0a0 })), .121, .04, 0, 0, Math.PI / 2, 0);
      add(box(.02, .012, .02, mat({ color: 0xc02020 })), .02, .06, 0);
    } else if (key === "spin") {
      add(box(.12, .07, .08, mat({ color: 0x8a2a1a, flatShading: true })), 0, .035, 0);
      add(box(.124, .02, .084, mat({ color: 0xd8c890 })), 0, .055, 0);
      for (let i = 0; i < 4; i++) add(cyl(.012, .012, .03, mat({ color: 0xc8a040 }), 6), -.045 + i * .03, .085, 0);
    } else if (key === "mirror") {
      add(cyl(.055, .055, .014, mat({ color: 0x8a6a2a, flatShading: true }), 10), 0, .012, 0);
      add(cyl(.045, .045, .016, mat({ color: 0xd8f4ff, emissive: 0x3a6a80 }), 10), 0, .014, 0);
      add(box(.022, .012, .08, mat({ color: 0x6a4a1a })), 0, .01, .09);
    } else if (key === "vest") {
      add(box(.16, .04, .12, mat({ color: 0x3a5a2a, flatShading: true })), 0, .02, 0);
      add(box(.05, .012, .04, mat({ color: 0x2a4a1e })), -.04, .045, .02); add(box(.05, .012, .04, mat({ color: 0x2a4a1e })), .04, .045, .02);
      add(box(.17, .01, .02, black), 0, .042, -.035);
    } else if (key === "freeze") {
      add(box(.09, .08, .09, mat({ color: 0xa8f0ff, emissive: 0x1a5a70, transparent: true, opacity: .75, flatShading: true })), 0, .04, 0, .2, .5, .1);
      add(box(.04, .04, .04, mat({ color: 0xffffff, emissive: 0x8ad8ff })), 0, .04, 0, 0, .8, 0);
    } else if (key === "medkit") {
      add(cyl(.022, .022, .12, mat({ color: 0xe8f0f0, transparent: true, opacity: .7 })), 0, .025, 0, 0, 0, Math.PI / 2);
      add(cyl(.016, .016, .08, mat({ color: 0xd0101e, emissive: 0x400004 })), -.015, .025, 0, 0, 0, Math.PI / 2);
      add(cyl(.004, .004, .06, steel, 4), .09, .025, 0, 0, 0, Math.PI / 2);
      add(box(.012, .04, .04, mat({ color: 0xe8e8e8 })), -.068, .025, 0);
    } else if (key === "ear") {
      add(cyl(.05, .012, .1, mat({ color: 0xb08a4a, flatShading: true })), 0, .04, 0, 0, 0, Math.PI / 2);
      add(cyl(.012, .012, .08, mat({ color: 0x8a6a3a }), 6), -.08, .04, .02, 0, .6, Math.PI / 2);
    } else if (key === "box") {
      add(box(.12, .07, .09, mat({ color: 0x5a2e14, map: TEX.wood(), flatShading: true })), 0, .035, 0);
      const lid = add(box(.124, .02, .094, mat({ color: 0x6a3a1a, flatShading: true })), 0, .08, 0); lid.name = "lid";
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => add(box(.016, .074, .016, mat({ color: 0xc8a040 })), sx * .056, .037, sz * .041));
      add(box(.02, .022, .008, mat({ color: 0xd8b040 })), 0, .06, .048);
    } else if (key === "stake") {
      for (let i = 0; i < 3; i++) add(cyl(.04, .04, .012, mat({ color: 0xffd23f, emissive: 0x3a2a00, flatShading: true }), 10), (i % 2) * .006, .007 + i * .013, 0);
    } else if (key === "saw") {
      add(box(.2, .012, .012, steel), 0, .05, 0); add(box(.012, .05, .012, steel), -.094, .025, 0); add(box(.012, .05, .012, steel), .094, .025, 0);
      add(box(.19, .016, .004, mat({ color: 0xd8d8e0 })), 0, .008, 0);
      for (let i = 0; i < 9; i++) add(box(.006, .008, .005, mat({ color: 0xb8b8c0 })), -.085 + i * .021, .002, 0);
      add(box(.04, .05, .022, mat({ color: 0x2a6a2a, flatShading: true })), -.12, .035, 0, 0, 0, .3);
    } else if (key === "thief") {
      const lea = mat({ color: 0x2a2222, flatShading: true });
      add(box(.08, .025, .09, lea), 0, .013, 0);
      for (let i = 0; i < 4; i++) add(box(.016, .02, .06, lea), -.03 + i * .02, .012, -.07 + (i === 0 || i === 3 ? .01 : 0));
      add(box(.018, .02, .05, lea), .052, .012, 0, 0, -.6, 0);
      add(box(.084, .02, .02, mat({ color: 0x6a1a1a })), 0, .014, .05);
    } else add(box(.09, .06, .07, mat({ color: 0x888888 })), 0, .03, 0);
    return g;
  }

  /* ---------------------------------------------------------------- соперник: плоский пиксельный спрайт, как противники в старых шутерах */
  const COATS = [["#3e3228", "#2a2018", "#4e4032"], ["#2c343a", "#1c2228", "#3c4650"], ["#40262a", "#2a181c", "#52343a"], ["#323a28", "#20261a", "#424c34"]];
  function figureCanvas(p, idx, dead, faceImg, blood = 0) {
    const c = document.createElement("canvas"); c.width = 48; c.height = 64;
    const g = c.getContext("2d"), [c1, c2, c3] = COATS[idx % 4];
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    let bs = 7 + idx * 131;                                           // свой узор крови у каждого игрока — не прыгает при перерисовке
    const br = () => { bs = (bs * 16807) % 2147483647; return bs / 2147483647; };
    const gore = (lvl, x0, y0, w, h) => {                              // пятна и потёки: чем больше ранений, тем больше крови
      for (let i = 0; i < lvl * 70; i++) { const x = x0 + br() * w | 0, y = y0 + br() * h | 0; R(x, y, 1 + (br() < .35), 1 + (br() < .25), br() < .5 ? "#8a000c" : "#5a0008"); }
      for (let i = 0; i < lvl * 6; i++) { const x = x0 + 2 + br() * (w - 4) | 0, y = y0 + br() * h * .5 | 0; R(x, y, 1, 3 + br() * 9 | 0, "#6a000a"); }
    };
    if (!dead) {
      R(7, 30, 34, 34, c1); R(5, 34, 5, 24, c1); R(38, 34, 5, 24, c1);          // плечи, пальто
      R(7, 30, 4, 34, c3); R(5, 34, 2, 22, c3);                                 // свет слева
      R(36, 30, 5, 34, c2); R(41, 34, 2, 22, c2);                               // тень справа
      R(19, 30, 10, 16, "#b8b0a0"); R(21, 30, 6, 16, "#d8d0c0");               // рубашка
      R(23, 32, 3, 14, "#6a1010"); R(22, 31, 5, 3, "#8a1818");                  // галстук
      R(15, 30, 5, 14, c2); R(28, 30, 5, 14, c2);                               // лацканы
      [40, 46, 52].forEach((y) => R(29, y, 2, 2, "#c8a050"));                   // пуговицы
      R(18, 25, 12, 6, "#5a4232"); R(18, 29, 12, 2, "#3a2a20");                 // шея
      R(12, 6, 24, 22, "#5a4436");                                              // голова
      if (faceImg) { try { g.drawImage(faceImg, 13, 8, 22, 20); } catch (e) { /* чужое фото */ } }
      else { g.font = "19px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(p.avatar || "🙂", 24, 18); }
      g.fillStyle = "rgba(0,0,0,.5)"; g.fillRect(12, 8, 24, 4);                // тень от шляпы
      g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(12, 22, 24, 6);
      R(8, 4, 32, 4, "#18120e"); R(12, 0, 24, 5, "#221a14"); R(12, 3, 24, 1, "#6a1a14");   // шляпа с лентой
      R(4, 56, 11, 8, "#6a5040"); R(33, 56, 11, 8, "#6a5040");                 // руки на столе
      R(4, 56, 11, 1, "#8a6a52"); R(33, 56, 11, 1, "#8a6a52");
      for (let i = 0; i < 3; i++) { R(6 + i * 3, 62, 1, 2, "#4a3426"); R(35 + i * 3, 62, 1, 2, "#4a3426"); }
      if (blood > 0) {                                                // ранен: кровь на лице, рубашке, руках
        gore(blood, 12, 8, 24, 20); gore(blood * 1.4, 10, 30, 28, 26); gore(blood * .6, 4, 56, 40, 8);
        if (blood >= .5) { R(26, 10, 2, 16, "#7a000a"); R(16, 14, 1, 12, "#6a000a"); }   // потёки со лба
      }
    } else {
      R(5, 40, 38, 24, c1); R(5, 40, 38, 2, c3);                                // упал лицом на стол
      R(12, 46, 24, 16, "#4a3a2e"); R(10, 43, 28, 5, "#18120e");
      g.fillStyle = "#7a000c"; for (let i = 0; i < 80; i++) g.fillRect(3 + Math.random() * 42 | 0, 54 + Math.random() * 10 | 0, 2, 1);
      R(2, 60, 44, 4, "#5a0008");
      gore(1.4, 5, 40, 38, 24); R(16, 44, 14, 6, "#6a000a"); R(10, 50, 26, 3, "#5a0008");   // голова в луже, спина в крови
    }
    return c;
  }

  function makeChair(idx) {                                         // стул за спиной игрока
    const g = new T.Group(), w = mat({ color: [0x3a2414, 0x2e2010, 0x34200e, 0x2a1c10][idx % 4], map: TEX.wood(), flatShading: true });
    put(g, box(.62, .06, .5, w), 0, .5, 0);
    put(g, box(.62, .7, .06, w), 0, .9, -.24);
    put(g, box(.62, .08, .07, w), 0, 1.28, -.24);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => put(g, box(.05, .5, .05, w), sx * .27, .25, sz * .21));
    return g;
  }

  function makeFigure(p, idx) {
    const g = new T.Group();
    const ud = { idx, p, dead: false, jolt: 0, hp: -1, itemsKey: "" };
    const smat = new T.SpriteMaterial({ map: spriteTex(figureCanvas(p, idx, false, null)), transparent: true, alphaTest: .5 });
    const sprite = new T.Sprite(smat); sprite.scale.set(1.2, 1.6, 1); sprite.position.y = 1.25; g.add(sprite);
    if (p.photo) {                                                   // фото на лицо — только если сервер разрешает
      const img = new Image(); img.crossOrigin = "anonymous"; img.referrerPolicy = "no-referrer";
      img.onload = () => { try { const t = document.createElement("canvas").getContext("2d"); t.drawImage(img, 0, 0); t.getImageData(0, 0, 1, 1); ud.faceImg = img; if (!ud.dead) { smat.map.dispose(); smat.map = spriteTex(figureCanvas(p, idx, false, img, ud.blood || 0)); smat.needsUpdate = true; } } catch (e) { /* остаётся эмодзи */ } };
      img.src = p.photo;
    }
    const chair = makeChair(idx); chair.position.set(0, 0, -.32); g.add(chair);
    const hearts = new T.Group(); hearts.position.y = 2.2; g.add(hearts);
    const rugM = mat({ color: [0x4a1810, 0x14304a, 0x2e3a14, 0x4a3410][idx % 4], emissive: 0x000000 });
    const rug = put(g, new T.Mesh(new T.PlaneGeometry(1.2, .52), rugM), 0, .782, 1.0, -Math.PI / 2);   // коврик с вещами
    const items = new T.Group(); g.add(items);
    const mirror = new T.Group();                                    // зеркало в раме, поднимается из-за стола
    put(mirror, box(.34, .44, .03, mat({ color: 0x6a4a1a, flatShading: true })), 0, 0, 0);
    put(mirror, box(.28, .38, .032, mat({ color: 0xc8ecff, emissive: 0x4a8aa0 })), 0, 0, 0);
    put(mirror, box(.04, .3, .04, mat({ color: 0x4a3010 })), 0, -.3, 0);
    mirror.position.set(.42, .95, .62); mirror.rotation.y = -.35; mirror.visible = false; g.add(mirror);
    const vest = new T.Group();
    put(vest, box(.36, .32, .05, mat({ color: 0x3a5a2a, flatShading: true })), 0, 0, 0);
    [-.09, .09].forEach((x) => put(vest, box(.08, .07, .02, mat({ color: 0x2a4a1e })), x, -.05, .03));
    vest.position.set(0, 1.05, .32); vest.visible = false; g.add(vest);
    Object.assign(ud, { sprite, smat, hearts, items, mirror, vest, rug, rugM, chair });
    g.userData = ud;
    return g;
  }

  /* ---------------------------------------------------------------- сцена */
  function build() {
    scene = new T.Scene();
    scene.background = new T.Color(0x050403);
    scene.fog = new T.Fog(0x080504, 5, 12);
    camera = new T.PerspectiveCamera(58, W / H, .05, 30);
    roomGroup = new T.Group(); scene.add(roomGroup);
    // квадратная комната 7×7: стены, колонны в углах, плинтусы, балки
    const RS = 3.5, RH = 3.3;
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
    put(roomGroup, new T.Mesh(new T.PlaneGeometry(.9, .9), mat({ map: TEX.tally(), transparent: true })), -1.0, 1.75, -RS + .02);   // зарубки на стене
    put(roomGroup, box(1.1, .05, .3, mat({ color: 0x2a1c12 })), -RS + .17, 1.6, -.8, 0, Math.PI / 2);
    [-1.1, -.9, -.6].forEach((z, i) => put(roomGroup, cyl(.07, .07, .18 + i * .04, mat({ color: [0x3a5a2a, 0x5a3a1a, 0x2a2a3a][i] }), 6), -RS + .2, 1.72 + i * .02, z));
    put(roomGroup, box(.7, .6, .7, mat({ color: 0x4a3018, map: TEX.wood() })), RS - .6, .3, RS - 1.2, 0, .3);
    put(roomGroup, box(.5, .45, .5, mat({ color: 0x3e2814, map: TEX.wood() })), RS - .6, .825, RS - 1.2, 0, .1);
    const chain = mat({ color: 0x4a4a52 });                          // цепь с крюком у стены
    for (let i = 0; i < 9; i++) put(roomGroup, new T.Mesh(new T.TorusGeometry(.04, .012, 3, 6), chain), RS - .25, RH - .15 - i * .085, -1.6, 0, i % 2 ? Math.PI / 2 : 0);
    put(roomGroup, new T.Mesh(new T.TorusGeometry(.07, .015, 3, 8, Math.PI * 1.3), chain), RS - .25, RH - .95, -1.6, 0, 0, Math.PI);
    // кровь на стене и полу
    decals = new T.Group(); scene.add(decals);
    splat(new T.Vector3(-1.2, 1.4, -RS + .03), new T.Euler(0, 0, 0), .9, 0x5a0008);
    splat(new T.Vector3(2.3, .01, -1.6), new T.Euler(-Math.PI / 2, 0, 0), 1.2, 0x3a0006);
    // стол: дерево по краю, сукно внутри, ножка
    put(scene, cyl(1.5, 1.5, .1, mat({ map: TEX.wood(), flatShading: true }), 10), 0, .72, 0);
    put(scene, cyl(1.22, 1.22, .102, mat({ map: TEX.felt(), flatShading: true }), 10), 0, .722, 0);
    put(scene, new T.Mesh(new T.TorusGeometry(1.23, .02, 3, 10), mat({ color: 0xa88a40, emissive: 0x1a1000 })), 0, .775, 0, Math.PI / 2, 0, Math.PI / 10);
    put(scene, cyl(1.56, 1.46, .08, mat({ color: 0x2e1a0c, flatShading: true }), 10), 0, .64, 0);
    put(scene, cyl(.16, .26, .62, mat({ color: 0x2a1a0e, flatShading: true }), 6), 0, .31, 0);
    put(scene, cyl(.55, .65, .08, mat({ color: 0x24160c, flatShading: true }), 6), 0, .04, 0);
    // мелочи на столе: свеча, карты, старые монеты
    const cnd = new T.Group(); cnd.position.set(-.92, .78, -.62); scene.add(cnd);
    put(cnd, cyl(.08, .09, .02, mat({ color: 0x8a7a5a }), 8), 0, 0, 0);
    put(cnd, cyl(.035, .035, .16, mat({ color: 0xe8dcc0, flatShading: true }), 6), 0, .09, 0);
    put(cnd, box(.012, .03, .012, new T.MeshBasicMaterial({ color: 0xffc040 })), 0, .19, 0);
    state.beam = new T.PointLight(0xfff0b0, 0, 3); scene.add(state.beam);
    candleLight = new T.PointLight(0xffa040, .6, 2.2); candleLight.position.set(-.92, 1.05, -.62); scene.add(candleLight);
    const cardM = mat({ color: 0xe8e0d0 }), backM = mat({ color: 0x7a1a1a });
    [[.78, -.7, .4], [.9, -.6, -.3], [.7, -.5, 1.2]].forEach(([x, z, r], i) => put(scene, box(.12, .006, .17, i === 2 ? backM : cardM), x, .778 + i * .002, z, 0, r));
    [[-.3, .95], [.4, -1.0]].forEach(([x, z]) => put(scene, cyl(.04, .04, .01, mat({ color: 0xb08a30, emissive: 0x201400 }), 8), x, .78, z));
    // лампа на проводе
    lamp = new T.Group(); lamp.position.set(0, 3.3, 0); scene.add(lamp);
    put(lamp, box(.015, 1.1, .015, mat({ color: 0x111111 })), 0, -.55, 0);
    put(lamp, new T.Mesh(new T.ConeGeometry(.32, .22, 8, 1, true), mat({ color: 0x2a3a2a, side: T.DoubleSide })), 0, -1.25, 0);
    bulb = put(lamp, new T.Mesh(new T.SphereGeometry(.07, 6, 4), new T.MeshBasicMaterial({ color: 0xffe0a0 })), 0, -1.34, 0);
    spot = new T.SpotLight(0xffd8a0, 3.2, 10, .85, .5, 1); spot.position.set(0, -1.3, 0); lamp.add(spot);
    spot.target.position.set(0, -4, 0); lamp.add(spot.target);
    scene.add(new T.AmbientLight(0x4a3830, 1.1));
    const fill = new T.PointLight(0xffb070, .6, 9); fill.position.set(0, 2.2, 2.5); scene.add(fill);
    redLight = new T.PointLight(0xff2010, 1.2, 7); redLight.position.set(-2.6, 2.6, -3.1); scene.add(redLight);
    put(roomGroup, box(.12, .08, .06, new T.MeshBasicMaterial({ color: 0xff3020 })), -2.6, 2.6, -RS + .04);
    // дробовик в центре стола
    gun = makeGun(); gun.scale.setScalar(1.4); gun.position.set(0, .86, 0); scene.add(gun);
    figGroup = new T.Group(); scene.add(figGroup);
    state.cross = crosshair();
    // пылинки в луче
    const n = 26, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - .5) * 2.2; pos[i * 3 + 1] = .9 + rnd() * 1.6; pos[i * 3 + 2] = (rnd() - .5) * 2.2; }
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    state.dust = new T.Points(dg, new T.PointsMaterial({ color: 0xa89070, size: 1, sizeAttenuation: false, transparent: true, opacity: .35 }));
    scene.add(state.dust);
  }

  function splat(pos, rot, size, color, big) {
    const t = tex(32, (g, s) => {
      g.clearRect(0, 0, s, s);
      const col = "#" + color.toString(16).padStart(6, "0"), dark = "#2a0004", c = s / 2;
      g.fillStyle = col;
      for (let i = 0; i < (big ? 260 : 150); i++) { const a = rnd() * 6.28, r = Math.pow(rnd(), big ? 1.1 : 1.7) * (s * .45); g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 1 + (rnd() < .5 ? 1 : 0), 1 + (rnd() < .3 ? 1 : 0)); }
      g.beginPath(); g.arc(c, c, s * (big ? .22 : .12), 0, 6.28); g.fill();                 // плотное ядро
      for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = s * (.3 + rnd() * .18); g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 2, 2); }   // капли вокруг
      g.fillStyle = dark; for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = rnd() * s * .18; g.fillRect(c + Math.cos(a) * r | 0, c + Math.sin(a) * r | 0, 1, 1); }
      g.fillStyle = col; for (let i = 0; i < 6; i++) { const x = c - 8 + rnd() * 16 | 0; g.fillRect(x, c, 1 + (rnd() < .4), 5 + rnd() * 12 | 0); }   // потёки вниз
    });
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.position.copy(pos); m.rotation.copy(rot); decals.add(m);
    while (decals.children.length > 70) { const old = decals.children[2]; decals.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); }
    return m;
  }

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
  const R = 2.05;
  const seatPos = (rel, n) => { const a = (rel / n) * Math.PI * 2; return { x: Math.sin(a) * R, z: Math.cos(a) * R, a }; };
  const yawTo = (x, z) => Math.atan2(-x, -z);                       // поворот, при котором ствол смотрит на точку (x, z)
  const worldOf = (f, x, y, z) => f.localToWorld(new T.Vector3(x, y, z));

  function sync(room, me) {
    if (!scene) return;
    const seats = room.seats && room.seats.length ? room.seats : room.players.map((p) => p.id);
    const mine = seats.indexOf(me);                                   // не за столом (зритель) — смотрит с пустого места
    const n = Math.max(2, seats.length + (mine < 0 ? 1 : 0));
    state.me = me; state.seats = seats; state.room = room;
    seats.forEach((pid, i) => {
      const p = room.players.find((x) => x.id === pid);
      if (!p) return;
      const rel = mine < 0 ? i + 1 : (i - mine + n) % n;
      let f = state.figs[pid];
      if (!f) { f = makeFigure(p, i); figGroup.add(f); state.figs[pid] = f; }
      const sp = seatPos(rel, n);
      f.position.set(sp.x, 0, sp.z); f.rotation.y = sp.a + Math.PI;
      const ud = f.userData;
      ud.rel = rel; ud.name = p.name; ud.pid = pid; ud.alive = p.alive;
      ud.sprite.visible = rel !== 0; ud.chair.visible = rel !== 0;   // себя не видно — только свои вещи
      if (ud.hp !== p.hp) {                                           // сердца над головой
        ud.hearts.children.slice().forEach((h) => { ud.hearts.remove(h); h.geometry.dispose(); h.material.dispose(); });
        for (let k = 0; k < room.maxHp; k++) {
          const h = box(.09, .09, .09, k < p.hp ? mat({ color: 0xd0101e, emissive: 0x500006 }) : mat({ color: 0x2a1a1a }));
          h.position.x = (k - (room.maxHp - 1) / 2) * .14; ud.hearts.add(h);
        }
        const bl = room.maxHp ? Math.max(ud.blood || 0, 1 - p.hp / room.maxHp) : 0;   // ранили — кровь на одежде остаётся до конца партии (аптечка её не смывает)
        if (p.alive && !ud.dead && bl > (ud.blood || 0)) {
          ud.blood = bl; ud.smat.map.dispose(); ud.smat.map = spriteTex(figureCanvas(p, ud.idx, false, ud.faceImg || null, bl)); ud.smat.needsUpdate = true;
        }
        ud.hp = p.hp;
      }
      ud.hearts.visible = rel !== 0 && p.alive;
      const ik = p.items.join(",");
      if (ud.itemsKey !== ik) {                                       // вещи на коврике: два ряда по три
        ud.items.children.slice().forEach((m) => { ud.items.remove(m); disposeTree(m); });
        p.items.forEach((k, j) => {
          const m = itemMesh(k), col = j % 3, row = Math.floor(j / 3);
          m.position.set((col - 1) * (rel === 0 ? .4 : .34), 0, (row - .5) * (rel === 0 ? .26 : .22));
          m.rotation.y = ((j * 1.7) % 1 - .5) * .6; m.scale.setScalar(1.4);
          m.userData = { pid, index: j, key: k };
          m.traverse((o) => { o.userData.item = m; });
          ud.items.add(m);
        });
        ud.itemsKey = ik;
      }
      ud.items.position.set(0, .78, 1.0);
      if (!!p.status.mirror !== !!ud.hasMirror) { ud.hasMirror = !!p.status.mirror; if (ud.hasMirror) mirrorRise(f); else setTimeout(() => { if (!ud.hasMirror) ud.mirror.visible = false; }, 1600); }
      if (!!p.status.vest !== !!ud.hasVest) { ud.hasVest = !!p.status.vest; ud.vest.visible = ud.hasVest && rel !== 0; if (ud.hasVest) burst(worldOf(f, 0, 1.1, .4), 0x5aa83a, 14, .8); }
      ud.frozen = !!p.status.frozen;
      if (!p.alive && !ud.dead) { ud.dead = true; slump(f, p); }
    });
    Object.keys(state.figs).forEach((pid) => { if (!seats.includes(pid)) { const f = state.figs[pid]; figGroup.remove(f); disposeTree(f); delete state.figs[pid]; } });
    state.turn = room.turn; state.phase = room.phase;
    if (room.sawed && !state.sawn) sawOff();                          // кусок ствола падает на стол
    if (!room.sawed && state.sawn && !state.sawBackSoon) { state.sawBackSoon = true; setTimeout(() => { state.sawBackSoon = false; if (state.sawn) sawBack(); }, 1700); }
    gun.userData.muzzle.position.z = room.sawed ? -.4 : -.75;
    // куда смотрит ствол: на цель; если цели нет — прикладом к тому, чей ход
    const aim = room.phase === "play" ? room.aim : null;
    const af = aim && state.figs[aim], tf = state.figs[room.turn];
    const target = af ? yawTo(af.position.x, af.position.z) : tf && ["play", "shot"].includes(room.phase) ? yawTo(-tf.position.x, -tf.position.z) : null;
    if (aim !== state.aim) spinTo(target, !!aim);
    else if (target != null && state.spin == null && Math.abs(angDiff(target, state.gunYaw)) > .01 && !state.firing) spinTo(target, false);
    state.aim = aim;
  }

  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
  // дробовик раскручивается на столе, как бутылочка, и останавливается на цели
  function spinTo(target, big) {
    if (target == null) return;
    const d = angDiff(target, state.gunYaw);
    const turns = big ? (d >= 0 ? 1 : -1) * Math.PI * 2 : 0;
    state.spin = { from: state.gunYaw, to: state.gunYaw + d + turns, t: 0, dur: big ? 1.05 : .55 };
    if (big && api.onSpin) api.onSpin();                              // звук раскрутки
  }

  // брызги на стене за спиной: ближайшая стена по направлению от центра стола
  function wallSplat(wp, size) {
    const RS = 3.47, ax = Math.abs(wp.x), az = Math.abs(wp.z);
    if (az >= ax) splat(new T.Vector3(wp.x * RS / Math.max(az, .01) * .9, 1.2 + rnd() * .8, Math.sign(wp.z) * RS), new T.Euler(0, wp.z > 0 ? Math.PI : 0, rnd() * .6 - .3), size * (.8 + rnd() * .4), 0x5a0008, true);
    else splat(new T.Vector3(Math.sign(wp.x) * RS, 1.2 + rnd() * .8, wp.z * RS / Math.max(ax, .01) * .9), new T.Euler(0, wp.x > 0 ? -Math.PI / 2 : Math.PI / 2, rnd() * .6 - .3), size * (.8 + rnd() * .4), 0x5a0008, true);
  }
  function slump(f, p) {                                            // выбывший падает лицом на стол, под ним лужа
    const ud = f.userData;
    ud.smat.map.dispose(); ud.smat.map = spriteTex(figureCanvas(p, ud.idx, true, null)); ud.smat.needsUpdate = true;
    const wp = new T.Vector3(); f.getWorldPosition(wp);
    splat(new T.Vector3(wp.x * .55, .785, wp.z * .55), new T.Euler(-Math.PI / 2, 0, rnd() * 6), 1.1, 0x6a0008, true);
    splat(new T.Vector3(wp.x * .42, .787, wp.z * .42), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .7, 0x4a0006);
    splat(new T.Vector3(wp.x * 1.1, .013, wp.z * 1.1), new T.Euler(-Math.PI / 2, 0, rnd() * 6), 1.6, 0x3a0005, true);   // лужа натекла на пол
    if (ud.rel !== 0) wallSplat(wp, 1.6);
  }

  /* ---------------------------------------------------------------- эффекты: частицы, трассеры, гильзы, ножовка, зеркало */
  const parts = [];
  const partGeo = () => state.partGeo || (state.partGeo = new T.BoxGeometry(1, 1, 1));
  function burst(pos, color, n = 12, speed = 1, opt = {}) {
    for (let i = 0; i < n; i++) {
      const m = new T.Mesh(partGeo(), new T.MeshBasicMaterial({ color, transparent: true }));
      m.scale.setScalar(opt.size || .04);
      m.position.copy(pos);
      const v = new T.Vector3((rnd() - .5) * 2, opt.up != null ? opt.up + rnd() * .5 : rnd() * 1.4, (rnd() - .5) * 2).multiplyScalar(speed);
      m.userData = { v, life: opt.life || .9, max: opt.life || .9, g: opt.gravity != null ? opt.gravity : 3.5 };
      scene.add(m); parts.push(m);
    }
  }
  function tracer(a, b, color = 0xffd890) {
    const l = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color, transparent: true }));
    l.userData = { life: .22, max: .22, line: true }; scene.add(l); parts.push(l);
  }
  const casings = [];
  function ejectShell(live) {                                       // гильза вылетает и остаётся на столе
    const m = new T.Mesh(new T.CylinderGeometry(.03, .03, .12, 6), mat({ color: live ? 0xa01010 : 0x2a6a2a, flatShading: true }));
    m.position.copy(gun.localToWorld(new T.Vector3(0, .1, .05)));
    m.userData = { v: new T.Vector3((rnd() - .5) * 1.4, 1.6, (rnd() - .5) * 1.4), spin: (rnd() - .5) * 18, rest: false };
    scene.add(m); casings.push(m);
    if (casings.length > 14) { const old = casings.shift(); scene.remove(old); disposeTree(old); }
  }
  const muzzleWorld = () => gun.localToWorld(new T.Vector3(0, .06, state.sawn ? -.36 : -.7));

  function sawOff() {
    const front = gun.userData.front;
    state.sawn = true;
    scene.attach(front);                                              // отделяем кусок ствола от ружья
    const from = front.position.clone(), q0 = front.quaternion.clone();
    const to = new T.Vector3(.62, .8, -.4), q1 = new T.Quaternion().setFromEuler(new T.Euler(0, 2.2, 0));
    burst(muzzleWorld(), 0xffd040, 18, .7, { size: .025, life: .6 });
    anim.push({ t: 0, dur: .7, step: (k) => { front.position.lerpVectors(from, to, k); front.position.y += Math.sin(k * Math.PI) * .35; front.quaternion.slerpQuaternions(q0, q1, k); } });
  }
  function sawBack() {
    const front = gun.userData.front;
    state.sawn = false;
    gun.attach(front);                                                // кусок летит обратно и прирастает
    const from = front.position.clone(), q0 = front.quaternion.clone(), q1 = new T.Quaternion();
    anim.push({ t: 0, dur: .8, step: (k) => { const e = k * k * (3 - 2 * k); front.position.lerpVectors(from, new T.Vector3(), e); front.position.y += Math.sin(k * Math.PI) * .25; front.quaternion.slerpQuaternions(q0, q1, e); },
      done: () => burst(muzzleWorld(), 0xc8c8d0, 8, .4, { size: .02, life: .4 }) });
  }
  function mirrorRise(f) {
    const m = f.userData.mirror; m.visible = f.userData.rel !== 0;     // своё зеркало не загораживает обзор
    anim.push({ t: 0, dur: .9, step: (k) => { m.position.y = .55 + .4 * Math.min(1, k * 1.3); m.rotation.y = -.35 + (1 - k) * Math.PI * 4; m.scale.setScalar(.3 + .7 * Math.min(1, k * 1.5)); },
      done: () => burst(worldOf(f, .42, 1.1, .62), 0xe8f8ff, 10, .5, { size: .03, life: .5, gravity: 0 }) });
  }
  function mirrorShatter(f) {
    const p = worldOf(f, .42, .95, .62);
    burst(p, 0xc8ecff, 26, 1.1, { size: .035, life: 1.2 });
    burst(p, 0x6a4a1a, 6, .8, { size: .05, life: 1 });
    f.userData.mirror.visible = false;
  }

  /* ---------------------------------------------------------------- события: выстрел, предмет, зарядка */
  const anim = [];
  function event(e) {
    if (!scene || !e) return;
    if (e.kind === "shot") {
      const target = state.figs[e.target];
      if (target) spinTo(yawTo(target.position.x, target.position.z), false);
      state.firing = true;
      anim.push({ t: 0, dur: .7, done: () => { fire(e); state.firing = false; } });
    } else if (e.kind === "load") {
      // патроны вылетают от каждого игрока и по дуге залетают в дробовик
      Object.values(state.figs).filter((f) => !f.userData.dead).concat(Array.from({ length: e.house || 0 }, () => null)).forEach((f, i) => {
        const from = f ? worldOf(f, 0, .85, .75) : new T.Vector3((rnd() - .5) * 3, 2.6, -2.8);
        const sh = new T.Mesh(new T.CylinderGeometry(.03, .03, .12, 6), mat({ color: f ? 0x8a1010 : 0x4a4a4a, flatShading: true }));
        sh.visible = false; scene.add(sh);
        anim.push({ t: -i * .22, dur: .6, step: (k) => { if (k <= 0) return; sh.visible = true; sh.position.lerpVectors(from, gun.position, k); sh.position.y += Math.sin(k * Math.PI) * .6; sh.rotation.x = k * 9; },
          done: () => { scene.remove(sh); disposeTree(sh); burst(gun.position.clone(), 0xc8a040, 4, .3, { size: .02, life: .3 }); } });
      });
      anim.push({ t: 0, dur: 1.2 + Object.keys(state.figs).length * .22, step: (k) => { gun.rotation.z = Math.sin(k * 30) * .05 * (1 - k); } });
    } else if (e.kind === "item") {
      const f = state.figs[e.who], tf = state.figs[e.target];
      if (f) anim.push({ t: 0, dur: .4, step: (k) => { f.userData.items.position.y = .9 - .12 * k; } });
      const at = (ff, y = 1.6) => (ff ? worldOf(ff, 0, y, .2) : new T.Vector3(0, 1.4, 1.8));
      if (e.item === "spin") anim.push({ t: 0, dur: 1, step: (k) => { gun.rotation.z = k * Math.PI * 2; gun.position.y = .86 + Math.sin(k * Math.PI) * .4; }, done: () => { gun.rotation.z = 0; } });
      if (e.item === "freeze" && tf) burst(at(tf, 1.3), 0x9af0ff, 30, 1, { size: .05, life: 1.2 });
      if (e.item === "medkit") burst(at(f, 1.3), 0xff3040, 16, .6, { up: .8, gravity: -.5, life: 1.2, size: .05 });
      if (e.item === "stake") burst(at(f, .9), 0xffd23f, 10, .5, { size: .04, life: .8 });
      if (e.item === "ear" && tf) for (let i = 0; i < 3; i++) {
        const ring = new T.Mesh(new T.TorusGeometry(.2, .015, 4, 12), new T.MeshBasicMaterial({ color: 0xe8a090, transparent: true }));
        ring.position.copy(at(tf, 1.65)); ring.lookAt(camera.position); ring.visible = false; scene.add(ring);
        anim.push({ t: -i * .25, dur: .8, step: (k) => { if (k <= 0) return; ring.visible = true; ring.scale.setScalar(1 + k * 2.5); ring.material.opacity = 1 - k; }, done: () => { scene.remove(ring); disposeTree(ring); } });
      }
      if (e.item === "flashlight") {                                 // луч фонарика на дробовик
        const a = at(f, 1.0), b = gun.position.clone().add(new T.Vector3(0, .3, 0));
        anim.push({ t: 0, dur: 1.4, step: (k) => { state.beam.position.lerpVectors(a, b, Math.min(1, k * 2)); state.beam.intensity = Math.sin(k * Math.PI) * 4; }, done: () => { state.beam.intensity = 0; } });
      }
      if (e.item === "box" && f) {                                    // шкатулка открывается, записка выпрыгивает
        const bx = itemMesh("box"); bx.scale.setScalar(2.2); bx.position.copy(worldOf(f, 0, .78, .55)); scene.add(bx);
        const lid = bx.getObjectByName("lid"), note = put(bx, box(.08, .002, .1, new T.MeshBasicMaterial({ color: 0xf0e8d0 })), 0, .05, 0);
        anim.push({ t: 0, dur: 1.6, step: (k) => { lid.rotation.x = -Math.min(1, k * 3) * 1.9; lid.position.z = -Math.min(1, k * 3) * .04; note.position.y = .05 + Math.min(1, Math.max(0, k * 3 - .5)) * .12; note.rotation.y = k * 6; },
          done: () => { scene.remove(bx); disposeTree(bx); } });
      }
      if (e.item === "thief" && f && tf) {                            // предмет перелетает от соперника к вору
        const st = itemMesh(e.stolen); st.scale.setScalar(1.8); scene.add(st);
        const a = worldOf(tf, 0, .9, 1.0), b = worldOf(f, 0, .9, 1.0);
        anim.push({ t: 0, dur: .9, step: (k) => { st.position.lerpVectors(a, b, k); st.position.y += Math.sin(k * Math.PI) * .7; st.rotation.y = k * 8; }, done: () => { scene.remove(st); disposeTree(st); } });
        burst(a, 0x888888, 8, .4, { size: .03, life: .5 });
      }
    } else if (e.kind === "win") state.flicker = 2.5;
  }

  function fire(e) {
    const mz = muzzleWorld();
    const tf = state.figs[e.target], hf = state.figs[e.hit];
    const head = (f) => (f && f.userData.rel !== 0 ? worldOf(f, 0, 1.55, .1) : camera.position.clone().add(new T.Vector3(0, -.35, -.4)));
    ejectShell(e.live);
    state.gunKick = e.live ? 1 : .3;
    if (!e.live) return;
    if (e.redirected && tf) {                                         // трассер в зеркало и обратно в стрелка
      const mp = worldOf(tf, .42, .95, .62);
      tracer(mz, mp); setTimeout(() => { tracer(mp, head(hf), 0xc8ecff); mirrorShatter(tf); }, 90);
    } else tracer(mz, head(hf));
    if (hf && !e.absorbed && hf.userData.rel !== 0) {                // фонтан крови: брызги, капли падают на стол, облачко
      const n = e.dmg > 1 ? 2 : 1;
      burst(head(hf), 0x9a000c, 40 * n, 1.5, { size: .05, life: 1.3 });
      burst(head(hf), 0x6a0008, 24 * n, .7, { size: .035, life: 1.6, up: -.2 });
      burst(head(hf), 0xc0101a, 14, 2.2, { size: .025, life: .6, gravity: 1 });
    }
    if (e.absorbed && hf) burst(head(hf), 0x5aa83a, 14, .9, { size: .04, life: .7 });
    state.flash = 1; state.shake = e.hit === state.me ? 1 : .55; state.flicker = .6;
    gun.userData.muzzle.intensity = 6;
    if (e.hit === state.me && !e.absorbed) state.hurt = 1;
    if (hf && !e.absorbed) {
      hf.userData.jolt = 1;
      const wp = hf.position;
      const n = e.dmg > 1 ? 3 : 2;                                    // обрез — крови вдвое больше
      for (let i = 0; i < n; i++) splat(new T.Vector3(wp.x * (.5 + rnd() * .2) + (rnd() - .5) * .4, .786 + rnd() * .002, wp.z * (.5 + rnd() * .2) + (rnd() - .5) * .4), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .45 + rnd() * .45, 0x7a000a, i === 0);   // на столе
      if (hf.userData.rel !== 0) { wallSplat(wp, 1.3); if (e.dmg > 1) wallSplat(wp, 1); }   // стена за спиной
      splat(new T.Vector3(wp.x * 1.3 + (rnd() - .5) * .5, .012, wp.z * 1.3 + (rnd() - .5) * .5), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .9 + rnd() * .5, 0x4a0006);   // на полу
      if (hf.userData.rel === 0) splat(new T.Vector3((rnd() - .5) * .6, .787, 0), new T.Euler(-Math.PI / 2, 0, rnd() * 6), .8, 0x8a000c, true);   // попали в тебя: кровь прямо перед тобой
    }
    for (let i = 0; i < 8; i++) puff();
  }

  function puff() {
    const m = new T.Mesh(partGeo(), new T.MeshBasicMaterial({ color: 0x8a8070, transparent: true, opacity: .55 }));
    m.scale.setScalar(.08); m.position.copy(muzzleWorld());
    m.userData = { v: new T.Vector3((rnd() - .5) * .3, .3 + rnd() * .3, (rnd() - .5) * .3), life: 1.6 };
    scene.add(m); state.smoke.push(m);
  }

  /* ---------------------------------------------------------------- подписи поверх сцены (HTML): имена и предметы */
  const labelPool = [];
  function updateLabels() {
    if (!labelLayer || !host || !host.isConnected) return;
    const rect = host.getBoundingClientRect(), Wd = rect.width, Hd = rect.height;
    if (!Wd || !Hd) return;
    const items = [], table = state.view === "table";
    const ITEMS = window.Roulette ? Roulette.ITEMS : {};
    Object.values(state.figs).forEach((f) => {
      const ud = f.userData;
      if (ud.rel !== 0) items.push({ kind: "name", text: ud.name, world: worldOf(f, 0, 2.38, 0), turn: state.turn === ud.pid && ["play", "shot"].includes(state.phase), dead: !ud.alive, prio: 0 });
      const list = ud.items.children;
      if (!list.length) return;
      if (table) list.forEach((m) => {
        const info = ITEMS[m.userData.key] || { name: m.userData.key, emoji: "" };
        items.push({ kind: "item", text: `${info.emoji} ${info.name}`, world: m.localToWorld(new T.Vector3(0, .11, 0)), mine: ud.rel === 0, data: m.userData, prio: ud.rel === 0 ? 1 : 2 });
      });
      else items.push({ kind: "item", text: list.map((m) => (ITEMS[m.userData.key] || {}).emoji || "?").join(" "), world: worldOf(f, 0, .95, 1.0), mine: ud.rel === 0, prio: ud.rel === 0 ? 1 : 2 });
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
      const cls = `c3-label ${it.kind} ${it.mine ? "mine" : ""} ${it.turn ? "turn" : ""} ${it.dead ? "dead" : ""} ${table ? "big" : ""}`;
      el.style.display = "block";
      if (el.textContent !== it.text || el._cls !== cls || !el._w) { el.className = cls; el.textContent = it.text; el._cls = cls; el._w = el.offsetWidth; el._h = el.offsetHeight; }   // размер меряем только при смене текста
      const w = el._w, h = el._h;
      const bx = { x: Math.max(2, Math.min(Wd - w - 2, x - w / 2)), y: Math.max(30, y - h), w, h };   // не залезать под верхнюю строку
      for (let k = 0; k < 6 && hits(bx); k++) bx.y += h + 2;                                          // наложилось — сдвигаем вниз, а не прячем
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
    if (document.hidden || ms - lastDraw < 22) return;               // не больше ~45 кадров в секунду, на паузе — ничего
    lastDraw = ms;
    const t = ms / 1000, dt = Math.min(.05, clock0 ? t - clock0 : .016); clock0 = t;
    // лампа качается, иногда моргает; свеча дрожит
    lamp.rotation.z = Math.sin(t * .9) * .09; lamp.rotation.x = Math.sin(t * .63) * .05;
    const flick = state.flicker > 0 ? (Math.random() < .5 ? .2 : 1) : (Math.random() < .004 ? .35 : 1);
    state.flicker = Math.max(0, state.flicker - dt);
    spot.intensity = 3.2 * flick; bulb.material.color.setHex(flick < 1 ? 0x6a5030 : 0xffe0a0);
    redLight.intensity = 1 + Math.sin(t * 2.2) * .3;
    candleLight.intensity = .5 + Math.sin(t * 13) * .08 + Math.random() * .08;
    // камера: дыхание + тряска; режим осмотра стола — сверху
    const sh = state.shake; state.shake = Math.max(0, state.shake - dt * 1.8);
    const table = state.view === "table";
    const camWant = table ? new T.Vector3(0, 2.75, 1.55) : new T.Vector3(Math.sin(t * .7) * .03, 2.15 + Math.sin(t * 1.1) * .015, 3.22);
    state.cam = state.cam || camWant.clone(); state.cam.lerp(camWant, Math.min(1, dt * 4));
    camera.position.set(state.cam.x + (Math.random() - .5) * sh * .18, state.cam.y + (Math.random() - .5) * sh * .12, state.cam.z);
    // взгляд: в свой ход — между дробовиком и целью; в чужой — на того, кто ходит
    const want = new T.Vector3(0, 1.0, -.3), tf = state.figs[state.turn], af = state.figs[state.aim];
    if (table) want.set(0, .72, .2);
    else if (state.aim && state.turn === state.me && af && af.userData.rel !== 0) want.set(af.position.x * .55, 1.1, af.position.z * .55);
    else if (tf && state.turn !== state.me && tf.userData.rel !== 0) want.set(tf.position.x * .5, 1.05, tf.position.z * .5 - .1);
    // сам оглядываешься: провёл пальцем — камера поворачивается; нажал на игрока — смотришь на него. Через пару секунд камера возвращается к игре
    const nowMs = performance.now(), fo = state.focus && state.figs[state.focus.pid];
    if (!table && state.free && (state.free.hold || nowMs - state.free.at < 3500)) {
      const d = 3; want.set(camera.position.x + Math.sin(state.free.yaw) * Math.cos(state.free.pitch) * d, camera.position.y + Math.sin(state.free.pitch) * d, camera.position.z - Math.cos(state.free.yaw) * Math.cos(state.free.pitch) * d);
    } else if (!table && fo && nowMs - state.focus.at < 4500) want.set(fo.position.x * .62, 1.25, fo.position.z * .62);
    else { state.free = null; state.focus = null; }
    state.look = state.look || want.clone();
    state.look.lerp(want, Math.min(1, dt * 3.5));
    camera.lookAt(state.look.x + (Math.random() - .5) * sh * .1, state.look.y + (Math.random() - .5) * sh * .1, state.look.z);
    // дробовик: раскрутка к цели, отдача, лёгкое дрожание
    if (state.spin) {
      const s = state.spin; s.t += dt; const k = Math.min(1, s.t / s.dur);
      const e = 1 - Math.pow(1 - k, 3) + Math.sin(k * Math.PI) * .04;   // замедляется к концу, чуть «перекатывается»
      state.gunYaw = s.from + (s.to - s.from) * e;
      if (k >= 1) { state.gunYaw = s.to; state.spin = null; }
    }
    state.gunKick = Math.max(0, (state.gunKick || 0) - dt * 3);
    gun.rotation.y = state.gunYaw;
    gun.rotation.x = -state.gunKick * .5;
    state.gunUp = (state.gunUp || 0) + ((state.aim ? 1 : 0) - (state.gunUp || 0)) * Math.min(1, dt * 5);
    gun.position.y = .86 + state.gunUp * .06 + (state.spin ? .04 : 0);
    if (state.aim && !state.spin) gun.rotation.z = Math.sin(t * 9) * .015;
    gun.userData.muzzle.intensity = Math.max(0, gun.userData.muzzle.intensity - dt * 30);
    // фигуры: дыхание, вздрагивание; коврик того, чей ход, подсвечен
    const lit = .55 + .45 * flick;
    Object.values(state.figs).forEach((f, i) => {
      const ud = f.userData;
      ud.jolt = Math.max(0, ud.jolt - dt * 2.5);
      ud.sprite.position.y = (ud.dead ? 1.0 : 1.25 + Math.sin(t * 1.3 + i) * .012) + ud.jolt * .08;
      ud.sprite.position.z = -ud.jolt * .25;
      const red = ud.jolt > .3 && Math.floor(t * 20) % 2 === 0;
      if (red) ud.smat.color.setRGB(1, .15, .15);
      else if (ud.frozen) ud.smat.color.setRGB(.55 * lit, .85 * lit, 1 * lit);
      else ud.smat.color.setRGB(.95 * lit, .82 * lit, .7 * lit);
      ud.hearts.rotation.y = t;
      const turn = state.turn === ud.pid && ["play", "shot"].includes(state.phase);
      ud.rugM.emissive.setRGB(turn ? .18 + Math.sin(t * 4) * .08 : 0, turn ? .06 : 0, 0);
    });
    state.smoke = state.smoke.filter((m) => { m.userData.life -= dt; m.position.addScaledVector(m.userData.v, dt); m.scale.multiplyScalar(1 + dt * .9); m.material.opacity = Math.max(0, m.userData.life / 3);
      if (m.userData.life <= 0) { scene.remove(m); m.material.dispose(); return false; } return true; });
    const dp = state.dust.geometry.attributes.position;
    for (let i = 0; i < dp.count; i++) { let y = dp.getY(i) + dt * .03; if (y > 2.6) y = .9; dp.setY(i, y); dp.setX(i, dp.getX(i) + Math.sin(t + i) * dt * .02); }
    dp.needsUpdate = true;
    for (let i = parts.length - 1; i >= 0; i--) {
      const m = parts[i], u = m.userData; u.life -= dt;
      if (!u.line) {
        u.v.y -= u.g * dt; m.position.addScaledVector(u.v, dt);
        const fl = Math.hypot(m.position.x, m.position.z) < 1.5 ? .79 : 0;
        if (m.position.y < fl) { m.position.y = fl; u.v.set(0, 0, 0); }
      }
      m.material.opacity = Math.max(0, u.life / u.max);
      if (u.life <= 0) { scene.remove(m); if (u.line) m.geometry.dispose(); m.material.dispose(); parts.splice(i, 1); }
    }
    casings.forEach((m) => { const u = m.userData; if (u.rest) return; u.v.y -= 6 * dt; m.position.addScaledVector(u.v, dt); m.rotation.x += u.spin * dt; m.rotation.z += u.spin * .5 * dt;
      const fl = Math.hypot(m.position.x, m.position.z) < 1.48 ? .8 : .03; if (m.position.y <= fl) { m.position.y = fl; u.v.multiplyScalar(.3); u.v.y = Math.abs(u.v.y) > .5 ? -u.v.y * .3 : 0; if (u.v.length() < .2) { u.rest = true; m.rotation.x = Math.PI / 2; } } });
    // красный прицел на цели
    if (af && state.aim !== state.me && af.userData.rel !== 0) { state.cross.visible = true; state.cross.position.copy(worldOf(af, 0, 1.5, 0)); state.cross.scale.setScalar(.32 + Math.sin(t * 8) * .05); }
    else state.cross.visible = false;
    for (let i = anim.length - 1; i >= 0; i--) { const a = anim[i]; a.t += dt; const k = Math.min(1, a.t / a.dur); if (a.step) a.step(k); if (k >= 1) { anim.splice(i, 1); if (a.done) a.done(); } }
    state.flash = Math.max(0, state.flash - dt * 5); state.hurt = Math.max(0, state.hurt - dt * .7);
    post.uniforms.flash.value = state.flash; post.uniforms.hurt.value = state.hurt; post.uniforms.time.value = t;
    renderer.setRenderTarget(rt); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.render(postScene, postCam);
    updateLabels();
  }

  /* ---------------------------------------------------------------- подключение к странице */
  function resize() {
    if (!host || !renderer) return;
    const r = host.getBoundingClientRect();
    W = 240; H = Math.max(140, Math.round((W * r.height) / Math.max(1, r.width)));
    renderer.setSize(W, H, false);
    rt.setSize(W, H);
    post.uniforms.res.value.set(W, H);
    camera.aspect = W / H; camera.fov = W / H < 1.1 ? 66 : 56; camera.updateProjectionMatrix();
  }

  function pickAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const ray = state.ray || (state.ray = new T.Raycaster());
    ray.setFromCamera(new T.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), camera);
    if (state.view === "table") {                                      // в режиме стола — выбираем предмет
      const meshes = []; Object.values(state.figs).forEach((f) => f.userData.items.traverse((o) => { if (o.isMesh) meshes.push(o); }));
      const h = ray.intersectObjects(meshes)[0];
      if (h && api.onPickItem) { const it = h.object.userData.item; api.onPickItem(it.userData); highlight(it); }
      return;
    }
    const sprites = Object.values(state.figs).filter((f) => f.userData.sprite.visible).map((f) => { f.userData.sprite.userData.pid = f.userData.pid; return f.userData.sprite; });
    const hit = ray.intersectObjects(sprites)[0];
    if (!hit) return;
    const pid = hit.object.userData.pid, f = state.figs[pid];
    if (state.turn !== state.me || (f && f.userData.dead) || !api.onPick) { state.focus = { pid, at: performance.now() }; state.free = null; return; }   // не твой ход — просто посмотреть на него
    api.onPick(pid);
  }

  function mount(el, cb) {
    if (host === el && renderer) return cb && cb();
    state.wantHost = el;
    load((err) => {
      if (err) return cb && cb(err);
      if (state.wantHost !== el || !el.isConnected) return;          // пока грузилось, экран перерисовали — ждём новый вызов
      host = el;
      if (!renderer) {
        canvas = document.createElement("canvas"); canvas.className = "cellar-canvas";
        try { renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: "low-power" }); }
        catch (e) { renderer = null; return cb && cb(new Error("Этот телефон не умеет 3D — играть можно кнопками ниже")); }
        renderer.setPixelRatio(1);
        rt = new T.WebGLRenderTarget(W, H, { minFilter: T.NearestFilter, magFilter: T.NearestFilter });
        post = new T.ShaderMaterial({ uniforms: { tDiffuse: { value: rt.texture }, res: { value: new T.Vector2(W, H) }, flash: { value: 0 }, hurt: { value: 0 }, time: { value: 0 } },
          vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: POST_FS });
        postScene = new T.Scene(); postCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        postScene.add(new T.Mesh(new T.PlaneGeometry(2, 2), post));
        build();
        // тап, а не начало прокрутки: палец почти не сдвинулся и отпущен быстро
        let down = null;
        const tapStart = (ev) => { down = { x: ev.clientX, y: ev.clientY, t: performance.now() }; };
        const tapEnd = (ev, fn) => { if (down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 10 && performance.now() - down.t < 450) fn(ev); down = null; };
        canvas.addEventListener("pointerdown", tapStart);
        canvas.addEventListener("pointerup", (ev) => { if (state.free) state.free.hold = false; tapEnd(ev, () => pickAt(ev.clientX, ev.clientY)); });
        canvas.addEventListener("pointercancel", () => { if (state.free) state.free.hold = false; });
        // провести пальцем влево-вправо — оглядеться за столом (вверх-вниз страница по-прежнему листается)
        canvas.style.touchAction = "pan-y";
        canvas.addEventListener("pointermove", (ev) => {
          if (!down || state.view === "table" || Math.abs(ev.clientX - down.x) < 8) return;
          if (!state.free || !state.free.hold) {
            const look = state.look || new T.Vector3(0, 1, -.3), dx = look.x - camera.position.x, dy = look.y - camera.position.y, dz = look.z - camera.position.z;
            state.free = { yaw: Math.atan2(dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)), at: performance.now(), hold: true, lx: ev.clientX };
          }
          const f = state.free;
          f.yaw = Math.max(-1.75, Math.min(1.75, f.yaw + (ev.clientX - f.lx) * .006)); f.lx = ev.clientX; f.at = performance.now(); state.focus = null;
        });
        labelLayer = document.createElement("div"); labelLayer.className = "c3-labels";
        labelLayer.addEventListener("pointerdown", tapStart);
        labelLayer.addEventListener("pointerup", (ev) => tapEnd(ev, () => {   // нажатие на подпись предмета = выбор предмета
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
  function highlight(it) {                                           // выбранный предмет подпрыгивает
    if (lit) lit.position.y = 0;
    lit = it; anim.push({ t: 0, dur: .35, step: (k) => { it.position.y = Math.sin(k * Math.PI) * .12; } });
  }
  function setView(v) { state.view = v; }

  // новая партия — убрать кровь, гильзы и фигуры прошлой
  function reset() {
    if (!scene) return;
    Object.values(state.figs).forEach((f) => { figGroup.remove(f); disposeTree(f); }); state.figs = {};
    casings.forEach((m) => { scene.remove(m); disposeTree(m); }); casings.length = 0;
    if (state.sawn) { gun.attach(gun.userData.front); gun.userData.front.position.set(0, 0, 0); gun.userData.front.quaternion.identity(); state.sawn = false; }
    while (decals.children.length > 2) { const old = decals.children[decals.children.length - 1]; decals.remove(old); old.geometry.dispose(); old.material.map.dispose(); old.material.dispose(); }
    state.aim = null; state.spin = null;
  }

  window.addEventListener("resize", resize);
  return Object.assign(api, { mount, unmount, sync, event, reset, resize, setView, ready: () => !!renderer });
})();
