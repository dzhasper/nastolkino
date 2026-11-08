/* Подвал: низкополигональные люди в духе игр конца 90-х (коробки, текстуры 32×32 без сглаживания).
   10 типажей; у каждого игрока за столом — свой (номер выдаёт хост, у всех одинаковый).
   Скелет простой: таз → спина → шея → голова, плечо → локоть → кисть. Руки ставятся по точкам (двухзвенная IK),
   поэтому любая поза — это просто «куда положить кисти» плюс наклон спины и головы.
   Раны рисуются прямо на текстурах лица и груди: каждая новая — в своём месте. */
const CellarPeople = (() => {
  "use strict";
  const SKINS = ["#c89068", "#a8704a", "#e2b48c", "#7e5234", "#efc6a2"];
  const LOOKS = [
    { name: "Здоровань", skin: 0, wide: 1.16, hair: "bald", top: "tank", topC: "#d8d2c2", pants: "#2a2a30", beard: "stubble", scar: 1, tattoo: 1 },
    { name: "Піджак", skin: 4, wide: 1, hair: "slick", hairC: "#1a1410", top: "suit", topC: "#26262e", shirt: "#d6d4cc", tie: "#7a1010", pants: "#1e1e24", mustache: 1 },
    { name: "Спортсмен", skin: 2, wide: 1.04, hair: "cap", capC: "#232323", top: "track", topC: "#1e3c8c", stripe: "#e6e6e6", pants: "#1a1a22", beard: "stubble" },
    { name: "Байкер", skin: 1, wide: 1.12, hair: "bandana", capC: "#8a1414", hairC: "#3a2616", top: "leather", topC: "#1a1614", pants: "#2a3040", beard: "full", glasses: "shades" },
    { name: "Старий", skin: 4, wide: .92, hair: "old", hairC: "#bdbab2", top: "sweater", topC: "#5e4a36", pants: "#3a3228", glasses: "round", wrinkles: 1, mustache: 1 },
    { name: "В’язень", skin: 2, wide: 1, hair: "buzz", hairC: "#2a2420", top: "robe", topC: "#4c5054", pants: "#3c4044", tattoo: 1, scar: 1 },
    { name: "Механік", skin: 3, wide: 1.06, hair: "capback", capC: "#c05010", hairC: "#1a1410", top: "overall", topC: "#2a4a7a", shirt: "#b8a888", pants: "#2a4a7a", grease: 1, beard: "goatee" },
    { name: "Каптур", skin: 1, wide: 1, hair: "hood", capC: "#38383c", top: "hoodie", topC: "#38383c", pants: "#22242a", mask: "#141414" },
    { name: "Руда", skin: 4, wide: .9, hair: "long", hairC: "#a8380e", top: "jacket", topC: "#6a1616", shirt: "#1a1a1a", pants: "#1a1a20", lips: "#a8101e", lashes: 1 },
    { name: "Охоронець", skin: 3, wide: 1.02, hair: "flatcap", capC: "#1c283a", hairC: "#1a1410", top: "uniform", topC: "#4a5c6e", shirt: "#4a5c6e", tie: "#141c28", pants: "#1c2430", badge: 1 },
  ];

  /* ---------------------------------------------------------------- текстуры, нарисованные кодом */
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => { let s = (seed % 2147483646) + 1; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k)))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }

  function paintFace(g, L) {
    const skin = SKINS[L.skin], R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const r = rng(hash(L.name));
    R(0, 0, 32, 32, skin);
    for (let i = 0; i < 70; i++) R(r() * 32 | 0, r() * 32 | 0, 1, 1, shade(skin, .9 + r() * .16));   // кожа неровная
    R(0, 22, 32, 10, shade(skin, .9)); R(2, 28, 28, 4, shade(skin, .82));                          // тень под скулами, челюсть
    R(4, 14, 3, 6, shade(skin, 1.08)); R(25, 14, 3, 6, shade(skin, 1.08));                          // скулы на свету
    // волосы по краю лба
    if (["slick", "buzz", "long", "capback"].includes(L.hair)) { R(0, 0, 32, L.hair === "buzz" ? 4 : 6, L.hairC); if (L.hair === "slick") R(4, 6, 24, 1, shade(L.hairC, 1.4)); if (L.hair === "long") { R(0, 0, 4, 26, L.hairC); R(28, 0, 4, 26, L.hairC); } }
    if (L.hair === "old") { R(0, 4, 3, 14, L.hairC); R(29, 4, 3, 14, L.hairC); }
    if (L.wrinkles) { R(8, 6, 16, 1, shade(skin, .78)); R(10, 8, 12, 1, shade(skin, .8)); R(6, 17, 2, 1, shade(skin, .75)); R(24, 17, 2, 1, shade(skin, .75)); }
    // брови и глаза
    const brow = L.hairC && L.hair !== "old" ? shade(L.hairC, .8) : shade(skin, .45);
    R(6, 10, 7, 2, brow); R(19, 10, 7, 2, brow);
    R(7, 13, 5, 3, "#e8e2d4"); R(20, 13, 5, 3, "#e8e2d4");
    R(9, 13, 2, 3, "#2a1c14"); R(21, 13, 2, 3, "#2a1c14");
    R(7, 16, 5, 1, shade(skin, .7)); R(20, 16, 5, 1, shade(skin, .7));                             // мешки под глазами
    if (L.lashes) { R(6, 12, 7, 1, "#140c0a"); R(19, 12, 7, 1, "#140c0a"); }
    // нос
    R(15, 13, 3, 8, shade(skin, 1.06)); R(14, 19, 5, 2, shade(skin, .78)); R(14, 20, 1, 1, "#3a2016"); R(18, 20, 1, 1, "#3a2016");
    // рот
    if (L.lips) { R(11, 24, 10, 2, L.lips); R(12, 26, 8, 1, shade(L.lips, .7)); }
    else { R(11, 24, 10, 1, "#4a2018"); R(12, 25, 8, 1, shade(skin, .72)); }
    if (L.beard === "stubble") for (let i = 0; i < 120; i++) R(3 + r() * 26 | 0, 20 + r() * 12 | 0, 1, 1, shade(skin, .55));
    if (L.beard === "full") { R(2, 20, 28, 12, L.hairC); R(4, 18, 24, 3, L.hairC); R(11, 24, 10, 2, "#2a140c"); for (let i = 0; i < 40; i++) R(2 + r() * 28 | 0, 20 + r() * 12 | 0, 1, 1, shade(L.hairC, 1.3)); }
    if (L.beard === "goatee") { R(12, 26, 8, 6, L.hairC); R(10, 22, 12, 2, L.hairC); }
    if (L.mustache) R(10, 22, 12, 2, L.hairC || "#3a2a1a");
    if (L.scar) { for (let i = 0; i < 9; i++) R(22 - i, 8 + i * 1.4 | 0, 1, 2, "#d07a70"); }
    if (L.glasses === "shades") { R(5, 12, 9, 5, "#0a0a0c"); R(18, 12, 9, 5, "#0a0a0c"); R(14, 13, 4, 1, "#0a0a0c"); R(6, 13, 3, 1, "#5a6a7a"); R(19, 13, 3, 1, "#5a6a7a"); }
    if (L.glasses === "round") { g.strokeStyle = "#2a2018"; g.lineWidth = 1; g.strokeRect(6.5, 11.5, 7, 6); g.strokeRect(18.5, 11.5, 7, 6); R(13, 14, 6, 1, "#2a2018"); }
    if (L.mask) { R(0, 19, 32, 13, L.mask); for (let i = 0; i < 30; i++) R(r() * 32 | 0, 19 + r() * 13 | 0, 1, 1, "#262626"); }
    if (L.grease) { R(4, 18, 4, 2, "rgba(20,14,10,.6)"); R(23, 8, 3, 2, "rgba(20,14,10,.5)"); }
  }

  function paintChest(g, L) {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const r = rng(hash(L.name + "t")), skin = SKINS[L.skin], C = L.topC;
    R(0, 0, 32, 32, C);
    for (let i = 0; i < 90; i++) R(r() * 32 | 0, r() * 32 | 0, 1, 1, shade(C, .86 + r() * .2));
    if (L.top === "tank") { R(0, 0, 32, 5, skin); R(0, 0, 7, 32, skin); R(25, 0, 7, 32, skin); R(10, 0, 12, 4, skin); R(7, 5, 18, 27, C); R(9, 4, 14, 2, skin);
      for (let i = 0; i < 16; i++) R(9 + r() * 14 | 0, 10 + r() * 20 | 0, 2, 1, "rgba(120,90,40,.35)"); }   // майка в пятнах
    if (L.top === "suit") { R(11, 0, 10, 20, L.shirt); R(14, 2, 4, 22, L.tie); R(15, 0, 2, 3, shade(L.tie, .7)); R(7, 0, 5, 16, shade(C, 1.3)); R(20, 0, 5, 16, shade(C, 1.3)); [20, 25].forEach((y) => R(15, y, 2, 2, "#8a7a5a")); R(3, 22, 6, 1, shade(C, .6)); R(23, 22, 6, 1, shade(C, .6)); }
    if (L.top === "track") { R(15, 0, 2, 32, "#c8c8c8"); R(12, 0, 8, 3, shade(C, .7)); R(0, 8, 32, 2, L.stripe); R(3, 16, 5, 4, L.stripe); }
    if (L.top === "leather") { for (let y = 0; y < 32; y++) R(10 + (y * .25 | 0), y, 2, 1, "#8a8a92"); R(0, 0, 10, 6, shade(C, 1.6)); R(22, 0, 10, 6, shade(C, 1.6)); R(4, 12, 6, 1, "#5a5a62"); R(22, 18, 6, 1, "#5a5a62"); for (let i = 0; i < 6; i++) R(2 + i * 5, 1, 1, 1, "#c8c8d0"); }
    if (L.top === "sweater") { for (let y = 2; y < 32; y += 3) for (let x = (y % 2) * 2; x < 32; x += 4) R(x, y, 2, 1, shade(C, 1.25)); R(10, 0, 12, 4, shade(C, .7)); R(12, 0, 8, 2, "#d8d0c0"); }
    if (L.top === "robe") { R(12, 0, 8, 6, skin); R(11, 0, 1, 10, shade(C, .6)); R(20, 0, 1, 10, shade(C, .6)); R(20, 12, 8, 5, "#d8d8d0"); R(21, 13, 6, 1, "#2a2a2a"); R(21, 15, 4, 1, "#2a2a2a"); }
    if (L.top === "overall") { R(0, 0, 32, 32, L.shirt); R(6, 8, 20, 24, C); R(7, 0, 4, 9, C); R(21, 0, 4, 9, C); R(8, 7, 2, 2, "#c8c8c8"); R(22, 7, 2, 2, "#c8c8c8"); R(11, 12, 10, 7, shade(C, .8)); R(3, 20, 4, 3, "rgba(20,14,10,.5)"); R(20, 24, 5, 2, "rgba(20,14,10,.5)"); }
    if (L.top === "hoodie") { R(8, 0, 16, 6, shade(C, .65)); R(13, 4, 1, 9, "#d8d8d8"); R(18, 4, 1, 8, "#d8d8d8"); R(7, 20, 18, 9, shade(C, .82)); R(7, 20, 18, 1, shade(C, .65)); }
    if (L.top === "jacket") { R(10, 0, 12, 32, L.shirt); R(7, 0, 4, 14, shade(C, 1.35)); R(21, 0, 4, 14, shade(C, 1.35)); R(13, 0, 6, 3, SKINS[L.skin]); R(14, 3, 4, 1, "#d8c040"); }
    if (L.top === "uniform") { R(15, 0, 2, 32, shade(C, .75)); R(14, 2, 4, 14, L.tie); R(4, 8, 8, 6, shade(C, .82)); R(20, 8, 8, 6, shade(C, .82)); R(21, 5, 5, 4, "#d8b040"); R(22, 6, 3, 2, "#8a6a10"); R(3, 0, 6, 2, "#1a2a3a"); R(23, 0, 6, 2, "#1a2a3a"); }
  }

  function paintArm(g, L) {                                  // рукава: ткань или голая кожа с наколками
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    const bare = L.top === "tank" || L.top === "robe";
    const C = bare ? SKINS[L.skin] : L.topC, r = rng(hash(L.name + "a"));
    R(0, 0, 16, 16, C);
    for (let i = 0; i < 30; i++) R(r() * 16 | 0, r() * 16 | 0, 1, 1, shade(C, .85 + r() * .25));
    if (L.top === "track") { R(2, 0, 2, 16, L.stripe); R(6, 0, 2, 16, L.stripe); }
    if (L.tattoo && bare) { R(4, 3, 6, 5, "#2a3a5a"); R(5, 4, 4, 3, SKINS[L.skin]); R(6, 5, 2, 1, "#2a3a5a"); R(3, 11, 9, 1, "#2a3a5a"); R(7, 10, 1, 3, "#2a3a5a"); }
  }

  /* ---------------------------------------------------------------- раны: каждая в своём месте, кровь стекает вниз */
  const FACE_SPOTS = [[22, 8], [9, 19], [16, 4], [25, 21], [6, 9], [13, 27]];
  const CHEST_SPOTS = [[16, 14], [9, 9], [23, 21], [11, 25], [24, 7], [17, 28], [5, 18]];
  // рана: велика пляма свіжої крові (яскрава середина, темніші краї), діри, бризки довкола й потёки донизу — щоб було видно і в темному підвалі
  function wound(g, x, y, k, r, pellets, H = 32) {
    const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(a | 0, b | 0, w, h); };
    const rad = (pellets ? 6.5 : 5) * k, pick = (l) => l[(r() * l.length) | 0];
    for (let i = 0; i < 170 * k; i++) { const a = r() * 6.28, d = Math.pow(r(), .55) * rad; R(x + Math.cos(a) * d, y + Math.sin(a) * d * .85, 1 + (r() < .4), 1 + (r() < .3), pick(["#d0101c", "#e81822", "#b80c18", "#f02028"])); }
    for (let i = 0; i < 60 * k; i++) { const a = r() * 6.28, d = Math.pow(r(), 1.3) * rad * .6; R(x + Math.cos(a) * d, y + Math.sin(a) * d * .85, 1, 1, r() < .5 ? "#ff3a40" : "#ff5a5a"); }
    const holes = pellets ? 6 : 1;
    for (let i = 0; i < holes; i++) { const hx = x + (pellets ? (r() - .5) * rad * 1.3 : 0), hy = y + (pellets ? (r() - .5) * rad * 1.1 : 0); R(hx - 1, hy - 1, 3, 3, "#3a0004"); R(hx, hy, 1 + (pellets ? 0 : 1), 1 + (pellets ? 0 : 1), "#0a0001"); }
    for (let i = 0; i < 16 * k; i++) { const a = r() * 6.28, d = rad * (1 + r() * 1.4); R(x + Math.cos(a) * d, y + Math.sin(a) * d * .9, 1, 1, pick(["#e8141e", "#d0101a"])); }   // бризки
    for (let i = 0; i < 4 + k * 4; i++) {                                // потёки донизу
      let sx = x - rad * .7 + r() * rad * 1.4; const len = 4 + r() * Math.max(4, H - y - 2);
      for (let j = 0; j < len; j++) { if (j % 5 === 4 && r() < .4) sx += r() < .5 ? -1 : 1; R(sx, y + j, 1 + (j < 3 && r() < .5), 1, j < len * .6 ? "#d81420" : "#a00c16"); }
      R(sx - (r() < .5), y + len, 2, 1, "#8a000e");                       // крапля на кінці
    }
  }

  /* ---------------------------------------------------------------- сборка персонажа */
  function build(T, idx, opt) {
    const L = LOOKS[((idx % LOOKS.length) + LOOKS.length) % LOOKS.length];
    const mats = [], snap = opt.snap || ((m) => m);
    const lam = (o) => { const m = snap(new T.MeshLambertMaterial(Object.assign({ flatShading: true }, o))); mats.push(m); return m; };
    const texOf = (c) => { const t = new T.CanvasTexture(c); t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; };
    const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
    const put = (parent, m, x, y, z) => { m.position.set(x, y, z); parent.add(m); return m; };
    const skinM = lam({ color: SKINS[L.skin] });
    // текстуры: лицо и грудь перерисовываются при ранениях
    const faceC = canvas(32, 32), chestC = canvas(32, 32), armC = canvas(16, 16);
    paintFace(faceC.getContext("2d"), L); paintChest(chestC.getContext("2d"), L); paintArm(armC.getContext("2d"), L);
    const face0 = faceC.getContext("2d").getImageData(0, 0, 32, 32), chest0 = chestC.getContext("2d").getImageData(0, 0, 32, 32);
    const arm0 = armC.getContext("2d").getImageData(0, 0, 16, 16);
    const sideC = canvas(16, 32), sg0 = sideC.getContext("2d"); sg0.fillStyle = L.topC; sg0.fillRect(0, 0, 16, 32);   // боки тулуба: теж у крові
    const side0 = sg0.getImageData(0, 0, 16, 32), sideT = texOf(sideC), sideM = lam({ map: sideT });
    const faceT = texOf(faceC), chestT = texOf(chestC), armT = texOf(armC);
    const faceM = lam({ map: faceT }), chestM = lam({ map: chestT }), armM = lam({ map: armT });
    const topM = lam({ color: L.topC }), pantsM = lam({ color: L.pants || "#22222a" }), shoeM = lam({ color: "#141210" });
    const hairM = lam({ color: L.hairC || L.capC || "#1a1410" }), capM = lam({ color: L.capC || L.hairC || "#222" });
    const backSkin = L.hair === "hood" ? capM : ["slick", "buzz", "long", "capback", "old"].includes(L.hair) ? hairM : skinM;
    const W = L.wide || 1;

    const root = new T.Group();                                // место за столом, смотрит на центр стола (+z)
    const tilt = new T.Group(); tilt.position.z = -.6; root.add(tilt);   // ось у задних ножек стула — для падения назад
    const body = new T.Group(); body.position.z = .6; tilt.add(body);
    const hips = new T.Group(); hips.position.y = .56; body.add(hips);
    put(hips, box(.4 * W, .16, .3, pantsM), 0, 0, 0);
    [-1, 1].forEach((s) => {                                   // ноги: бёдра вперёд, голени вниз
      put(hips, box(.15, .14, .42, pantsM), s * .1 * W, -.02, .2);
      put(hips, box(.13, .48, .13, pantsM), s * .1 * W, -.28, .4);
      put(hips, box(.14, .07, .22, shoeM), s * .1 * W, -.53, .46);
    });
    const spine = new T.Group(); spine.position.y = .07; hips.add(spine);
    const torso = put(spine, box(.46 * W, .56, .26, [sideM, sideM, topM, topM, chestM, topM]), 0, .28, 0);
    const vest = new T.Group(); vest.visible = false; spine.add(vest);
    const vestM = lam({ color: "#3e5a2c" }), vestD = lam({ color: "#2a4020" }), strap = lam({ color: "#1e1e1a" });
    put(vest, box(.5 * W, .42, .3, vestM), 0, .3, 0);
    [-1, 1].forEach((s) => { put(vest, box(.12 * W, .12, .05, vestD), s * .12 * W, .22, .16); put(vest, box(.12 * W, .1, .05, vestD), s * .12 * W, .38, .16); put(vest, box(.07, .16, .28, vestM), s * .19 * W, .58, 0); });
    put(vest, box(.52 * W, .04, .31, strap), 0, .14, 0); put(vest, box(.52 * W, .04, .31, strap), 0, .44, 0);
    const neck = new T.Group(); neck.position.y = .56; spine.add(neck);
    put(neck, box(.12, .08, .12, skinM), 0, .03, 0);
    const head = new T.Group(); head.position.y = .07; neck.add(head);
    const headMesh = put(head, box(.26, .3, .26, [skinM, skinM, backSkin === skinM ? skinM : hairM, skinM, faceM, backSkin]), 0, .15, 0);
    put(head, box(.04, .08, .05, skinM), .145, .15, 0); put(head, box(.04, .08, .05, skinM), -.145, .15, 0);   // уши
    const hairG = new T.Group(); head.add(hairG);
    if (L.hair === "slick") { put(hairG, box(.28, .07, .28, hairM), 0, .31, -.01); put(hairG, box(.28, .2, .06, hairM), 0, .22, -.12); }
    if (L.hair === "buzz") put(hairG, box(.27, .04, .27, hairM), 0, .31, 0);
    if (L.hair === "cap" || L.hair === "capback") { put(hairG, box(.29, .1, .29, capM), 0, .33, 0); put(hairG, box(.24, .02, .14, capM), 0, .29, L.hair === "cap" ? .19 : -.19); }
    if (L.hair === "bandana") { put(hairG, box(.28, .08, .28, capM), 0, .3, 0); put(hairG, box(.06, .06, .1, capM), .05, .28, -.17); put(hairG, box(.28, .1, .06, hairM), 0, .2, -.13); }
    if (L.hair === "old") put(hairG, box(.28, .12, .07, hairM), 0, .17, -.12);
    if (L.hair === "flatcap") { put(hairG, box(.3, .08, .3, capM), 0, .33, 0); put(hairG, box(.28, .02, .12, capM), 0, .3, .18); put(hairG, box(.08, .05, .02, lam({ color: "#c8a040" })), 0, .34, .15); }
    if (L.hair === "long") { put(hairG, box(.29, .08, .29, hairM), 0, .31, 0); put(hairG, box(.3, .44, .08, hairM), 0, .06, -.12); put(hairG, box(.05, .3, .22, hairM), .14, .14, -.02); put(hairG, box(.05, .3, .22, hairM), -.14, .14, -.02); }
    if (L.hair === "hood") { put(hairG, box(.33, .06, .33, capM), 0, .33, 0); put(hairG, box(.33, .36, .05, capM), 0, .15, -.15); put(hairG, box(.04, .36, .3, capM), .165, .15, 0); put(hairG, box(.04, .36, .3, capM), -.165, .15, 0); }
    const stump = new T.Group(); stump.visible = false; neck.add(stump);   // после выстрела в голову
    put(stump, box(.14, .06, .14, lam({ color: "#7a000c" })), 0, .1, 0);
    put(stump, box(.1, .04, .1, lam({ color: "#d8c8b0" })), .02, .14, 0);
    // руки: плечо → локоть → кисть
    const arms = {};
    [["L", 1], ["R", -1]].forEach(([k, s]) => {
      const sh = new T.Group(); sh.position.set(s * .28 * W, .5, 0); spine.add(sh);
      put(sh, box(.13, .32, .13, armM), 0, -.15, 0);
      const el = new T.Group(); el.position.y = -.31; sh.add(el);
      put(el, box(.12, .3, .12, armM), 0, -.14, 0).userData.keep = true;
      const hand = new T.Group(); hand.position.y = -.3; el.add(hand);
      put(hand, box(.1, .1, .07, skinM), 0, -.04, 0).userData.keep = true;
      put(hand, box(.04, .06, .04, skinM), s * -.05, -.02, .04).userData.keep = true;    // большой палец
      arms[k] = { sh, el, hand, side: s, l1: .31, l2: .3 };
    });
    const hit = [torso, headMesh];
    let wounds = 0;
    function setWounds(n, pellets) {                           // n ранень: кожне — на груді (і дедалі більше), з другого — ще й обличчя, руки в бризках
      if (n === wounds) return;
      wounds = n;
      const fg = faceC.getContext("2d"), cg = chestC.getContext("2d"), ag = armC.getContext("2d");
      const sg = sideC.getContext("2d");
      fg.putImageData(face0, 0, 0); cg.putImageData(chest0, 0, 0); ag.putImageData(arm0, 0, 0); sg.putImageData(side0, 0, 0);
      const r = rng(hash(L.name + ":w"));
      if (n >= 2) { cg.fillStyle = `rgba(200,0,16,${Math.min(.62, .22 + n * .12)})`; cg.fillRect(3, 12, 26, 20); }        // одяг просочується кров’ю
      if (n >= 3) { cg.fillStyle = "rgba(170,0,14,.55)"; cg.fillRect(0, 6, 32, 26); fg.fillStyle = "rgba(200,0,16,.3)"; fg.fillRect(0, 14, 32, 18); }
      for (let i = 0; i < n; i++) {
        const [x, y] = CHEST_SPOTS[i % CHEST_SPOTS.length]; wound(cg, x, y, 1 + i * .18, r, pellets);
        if (i >= 1) { const [fx, fy] = FACE_SPOTS[(i - 1) % FACE_SPOTS.length]; wound(fg, fx, fy, .7 + i * .12, r, pellets); }
        for (let j = 0; j < 10 + i * 6; j++) { ag.fillStyle = r() < .5 ? "#e8141e" : "#b00c18"; ag.fillRect((r() * 16) | 0, (r() * 16) | 0, 1 + (r() < .3), 1 + (r() < .5)); }   // бризки на руках
        wound(sg, 3 + r() * 10, 6 + r() * 12, .55 + i * .1, r, pellets);                                                     // і на боках
      }
      faceT.needsUpdate = true; chestT.needsUpdate = true; armT.needsUpdate = true; sideT.needsUpdate = true;
    }
    function setRed(k) { mats.forEach((m) => { if (m.emissive) m.emissive.setRGB(k * .6, 0, 0); }); }
    function dispose() {
      root.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      [faceT, chestT, armT, sideT].forEach((t) => t.dispose()); mats.forEach((m) => m.dispose());
    }
    return { root, tilt, body, hips, spine, torso, vest, neck, head, hairG, stump, arms, hit, setWounds, setRed, dispose, look: L,
      self: (on) => { root.traverse((o) => { if (o.isMesh) o.visible = !on || !!o.userData.keep; }); } };   // за себя видны только предплечья и кисти
  }

  /* ---------------------------------------------------------------- руки по точкам: двухзвенная IK */
  let V = null;
  function tmp(T) { if (!V) V = { a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), d: new T.Vector3(), e: new T.Vector3(), q: new T.Quaternion(), down: new T.Vector3(0, -1, 0) }; return V; }
  function pointBone(T, bone, target) {
    const v = tmp(T);
    bone.parent.updateWorldMatrix(true, false);
    bone.parent.getWorldQuaternion(v.q).invert();
    bone.getWorldPosition(v.a);
    v.b.copy(target).sub(v.a);
    if (v.b.lengthSq() < 1e-6) return;
    v.b.normalize().applyQuaternion(v.q);
    bone.quaternion.setFromUnitVectors(v.down, v.b);
  }
  // кисть — в точку hand (мир), локоть — в сторону pole (мир)
  function reach(T, arm, hand, pole) {
    const v = tmp(T);
    arm.sh.updateWorldMatrix(true, false);
    const S = arm.sh.getWorldPosition(v.c), l1 = arm.l1, l2 = arm.l2;
    const d = v.d.copy(hand).sub(S); let dist = d.length();
    if (dist < 1e-4) return;
    d.divideScalar(dist); dist = Math.min(dist, l1 + l2 - .002);
    const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const p = v.e.copy(pole).sub(S); p.addScaledVector(d, -p.dot(d)); if (p.lengthSq() < 1e-6) p.set(0, -1, 0); p.normalize();
    const E = new T.Vector3().copy(S).addScaledVector(d, a).addScaledVector(p, h);
    const H = new T.Vector3().copy(S).addScaledVector(d, dist);
    pointBone(T, arm.sh, E);
    arm.sh.updateWorldMatrix(false, true);
    arm.el.quaternion.identity();
    pointBone(T, arm.el, H);
  }

  return { LOOKS, SKINS, build, reach, pointBone, N: LOOKS.length };
})();
if (typeof window !== "undefined") window.CellarPeople = CellarPeople;
if (typeof module !== "undefined") module.exports = CellarPeople;
