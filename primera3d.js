// Vista en primera persona en 3D real (WebGL amb Three.js).
// Fa servir l'estat i les funcions de dibuix del joc (J, mapa, dibuixaParella...) que són globals.
import * as THREE from './lib/three.module.min.js';

const PIS = .78, BAIXOS = .9, ULL = .58; // alçades en caselles
let renderer, camera, cel, canvas3d, resolucio = 1, tempsMig = 16, ultimFotograma = 0, ultimAjust = 0;
const escenes = new Map();
let actual = null;

// ---------- Textures procedimentals ----------
function llenç(w, h, pinta) { const c = document.createElement('canvas'); c.width = w; c.height = h; pinta(c.getContext('2d'), w, h); return c; }
function textura(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function soroll(g, w, h, colors, n, mida) { for (let i = 0; i < n; i++) { g.fillStyle = colors[i % colors.length]; g.fillRect(Math.random() * w, Math.random() * h, mida * (.5 + Math.random()), mida * (.5 + Math.random())); } }

const FACANES = ['#efe3cc', '#e8d6b5', '#f3ead8', '#dccaa8', '#e9d9c0', '#d9c3a0', '#f0e1c8', '#cfbf9f'];
function texPis(color, persiana, balco) {
  return llenç(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, color); gr.addColorStop(1, '#00000000');
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    soroll(g, w, h, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.07)', 'rgba(90,70,40,.06)'], 900, 3);
    g.fillStyle = 'rgba(80,60,40,.12)'; for (let i = 0; i < 4; i++) g.fillRect(Math.random() * w, Math.random() * h * .3, 2, 30 + Math.random() * 60); // regalims
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, h - 10, w, 4);
    // finestra
    const x = 70, y = 40, fw = 116, fh = 150;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 10, y - 8, fw + 20, fh + 22);
    g.fillStyle = '#f2ece0'; g.fillRect(x - 8, y - 10, fw + 16, fh + 18);
    const vidre = g.createLinearGradient(x, y, x + fw, y + fh); vidre.addColorStop(0, '#9fc3dc'); vidre.addColorStop(.45, '#36566e'); vidre.addColorStop(1, '#1d3242');
    g.fillStyle = vidre; g.fillRect(x, y, fw, fh);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + 40, y); g.lineTo(x + 10, y + 60); g.fill();
    g.fillStyle = '#e8e2d6'; g.fillRect(x + fw / 2 - 3, y, 6, fh); g.fillRect(x, y + fh * .45, fw, 5);
    g.fillStyle = '#d9d2c3'; g.fillRect(x - 14, y + fh + 4, fw + 28, 10); // ampit
    // persianes obertes
    for (const px of [x - 58, x + fw + 12]) {
      g.fillStyle = persiana; g.fillRect(px, y - 6, 46, fh + 10);
      g.fillStyle = 'rgba(0,0,0,.22)'; for (let k = 0; k < fh + 10; k += 9) g.fillRect(px + 3, y - 6 + k, 40, 3);
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(px, y - 6, 4, fh + 10);
    }
    if (balco) { // balcó de ferro forjat
      g.fillStyle = '#c9c2b2'; g.fillRect(x - 30, y + fh - 4, fw + 60, 12);
      g.strokeStyle = '#1e1e1e'; g.lineWidth = 3; g.strokeRect(x - 28, y + fh - 50, fw + 56, 46);
      for (let k = x - 28; k < x + fw + 28; k += 12) { g.beginPath(); g.moveTo(k, y + fh - 50); g.lineTo(k, y + fh - 4); g.stroke(); }
    }
  });
}
function texBaixos(color, tipus) {
  return llenç(256, 256, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    soroll(g, w, h, ['rgba(0,0,0,.06)', 'rgba(255,255,255,.06)'], 700, 3);
    g.fillStyle = '#a99f8e'; g.fillRect(0, h - 34, w, 34); soroll(g, w, 34, ['rgba(0,0,0,.1)'], 80, 4); // sòcol de pedra
    if (tipus === 0) { // botiga amb tendal
      const c = ['#c0392b', '#2e86de', '#27ae60', '#e67e22'][Math.floor(Math.random() * 4)];
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#f4f1ea' : c; g.fillRect(i * 32, 20, 32, 46); }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 66, w, 8);
      const v = g.createLinearGradient(0, 80, 0, h - 34); v.addColorStop(0, '#8fbad6'); v.addColorStop(1, '#2c4b60');
      g.fillStyle = '#2a2a2a'; g.fillRect(16, 82, 150, h - 116); g.fillStyle = v; g.fillRect(22, 88, 138, h - 128);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(30, 90, 18, h - 132);
      g.fillStyle = '#5a3b26'; g.fillRect(180, 80, 60, h - 80); g.fillStyle = '#d4a017'; g.fillRect(228, 160, 5, 5);
    } else if (tipus === 1) { // portal
      g.fillStyle = '#d8d0bf'; g.fillRect(70, 40, 116, h - 40);
      g.fillStyle = '#4a2f1d'; g.fillRect(80, 54, 96, h - 54); g.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 60; k < h; k += 26) g.fillRect(84, k, 88, 3);
      g.fillStyle = '#d4a017'; g.beginPath(); g.arc(160, 160, 5, 0, Math.PI * 2); g.fill();
    } else { // finestra amb reixa
      g.fillStyle = '#2c3e4c'; g.fillRect(70, 70, 116, 120); g.strokeStyle = '#1a1a1a'; g.lineWidth = 4;
      for (let k = 70; k <= 186; k += 19) { g.beginPath(); g.moveTo(k, 70); g.lineTo(k, 190); g.stroke(); }
    }
  });
}
function texTeula(color) {
  return llenç(128, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = -8; x < w; x += 16) {
      const ox = (y / 16) % 2 ? 8 : 0, gr = g.createLinearGradient(0, y, 0, y + 16);
      gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(0,0,0,.35)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + ox + 8, y + 10, 8, 9, 0, 0, Math.PI); g.fill();
    }
    soroll(g, w, h, ['rgba(0,0,0,.12)', 'rgba(255,255,255,.06)', 'rgba(60,80,40,.15)'], 220, 3);
  });
}
const texPedra = () => llenç(128, 128, (g, w, h) => { g.fillStyle = '#9a7b5c'; g.fillRect(0, 0, w, h); soroll(g, w, h, ['#86694c', '#a88a68', '#6f5640', '#b39878'], 500, 8); });
const texParetCasa = () => llenç(128, 128, (g, w, h) => { g.fillStyle = '#efe4cf'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(190,140,90,.13)'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 14, h); g.fillStyle = '#7a5136'; g.fillRect(0, h - 10, w, 10); });
const texTanca = () => llenç(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#b8c2cc'; g.lineWidth = 2; for (let i = -h; i < w + h; i += 14) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } g.fillStyle = '#6b7580'; g.fillRect(0, 0, w, 6); });
const texAltaveu = () => llenç(128, 256, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); for (const y of [64, 180]) { g.fillStyle = '#2b2b2b'; g.beginPath(); g.arc(64, y, 50, 0, Math.PI * 2); g.fill(); g.fillStyle = '#555'; g.beginPath(); g.arc(64, y, 18, 0, Math.PI * 2); g.fill(); } });
const texFulles = c => llenç(64, 64, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); soroll(g, w, h, ['rgba(255,255,255,.12)', 'rgba(0,0,0,.2)', 'rgba(120,180,60,.2)'], 260, 5); });
const texOnes = () => llenç(256, 256, (g, w, h) => { g.fillStyle = '#2f6f9a'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(200,235,255,.25)'; g.lineWidth = 2; for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.arc(x, y, 6 + Math.random() * 10, .2, Math.PI - .2); g.stroke(); } });

// Dibuixos que es comparteixen entre totes les escenes
const TEXTURES = {};
function preparaTextures() { Object.assign(TEXTURES, { paret: texParetCasa(), tanca: texTanca(), porta: texTanca(), altaveu: texAltaveu() }); }

// ---------- Construcció d'una escena per a cada mapa ----------
const mat = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: .9, metalness: 0 }, o));

function construeix(nom) {
  const m = mapa, sc = new THREE.Scene(), zona = ZONES[nom];
  const nit = nom === 'patum', interior = nom === 'casa', vic = nom === 'vic';
  const horitzo = interior ? 0xe8dcc6 : nit ? 0x1a1430 : vic ? 0xc9d2da : 0xcfe2ee;
  sc.fog = new THREE.Fog(horitzo, interior ? 6 : vic ? 4 : 8, interior ? 30 : vic ? 26 : 42);
  sc.background = new THREE.Color(horitzo);
  // Terra: el mateix mapa dibuixat, però sense edificis ni arbres
  const terra = terraReduida(nom);
  const tt = textura(terra); tt.repeat.set(1, 1); tt.wrapS = tt.wrapT = THREE.ClampToEdgeWrapping;
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), mat({ map: tt, roughness: .95 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(MW / 2, 0, MH / 2); sol.receiveShadow = true; sc.add(sol);
  // Cel
  if (!interior) {
    const geo = new THREE.SphereGeometry(120, 32, 16);
    const top = nit ? new THREE.Color(0x05040f) : vic ? new THREE.Color(0x8ea2b2) : new THREE.Color(0x3d7fc4);
    const sh = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: top }, baix: { value: new THREE.Color(horitzo) } },
      vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 baix; varying vec3 p; void main(){ float k = smoothstep(-.05,.55,p.y); vec3 c = mix(baix, top, k); float sol = pow(max(dot(p, normalize(vec3(-.4,.55,-.6))),0.),300.); gl_FragColor = vec4(c + vec3(1.,.95,.8)*sol*1.5, 1.); }',
    });
    cel = new THREE.Mesh(geo, sh); sc.add(cel);
    sc.userData.cel = cel;
  }
  // Llums
  sc.add(new THREE.HemisphereLight(nit ? 0x443366 : 0xcfe6ff, nit ? 0x221a10 : 0x6b5a45, interior ? 1.4 : nit ? .7 : 1.1));
  const sun = new THREE.DirectionalLight(nit ? 0x8877ff : 0xfff1d6, interior ? 0 : nit ? .6 : 2.6);
  sun.castShadow = !interior; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 });
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .02;
  sc.add(sun); sc.add(sun.target); sc.userData.sun = sun;
  if (interior) for (const [x, y] of [[12.5, 9.5], [20.5, 9.5], [28.5, 9.5], [12.5, 16.5], [20.5, 16.5], [28.5, 16.5]]) { const l = new THREE.PointLight(0xffe2b0, 6, 8, 1.6); l.position.set(x, 1.15, y); sc.add(l); }

  // Materials compartits
  const persianes = ['#3f6b45', '#3f6b45', '#2f5a6b', '#6b4a2f'];
  const pisos = FACANES.map((c, i) => texPis(c, persianes[i % 4], i % 3 === 0));
  const baixos = FACANES.map((c, i) => texBaixos(c, i % 3));
  const teules = ['#a8473a', '#b5543a', '#9c5a3c', '#8f4a3a'].map(texTeula);
  const pedra = texPedra();
  const M = { cubells: new Map(), pisos, baixos, teules, pedra, interior, nom, paret: TEXTURES.paret, tanca: TEXTURES.tanca, porta: TEXTURES.porta, altaveu: TEXTURES.altaveu };

  // Edificis: cada bloc de caselles iguals es fa amb una sola caixa
  const vist = Array.from({ length: MH }, () => Array(MW).fill(false));
  M.rocaMat = mat({ map: textura(pedra, 1, 2), color: 0xd8b48a, roughness: 1, flatShading: true });
  const solids = new Set([C.EDIF, C.GARATGE, C.ESGL, C.MOLI, C.ROCA, C.PARET, C.TANCA, C.ALTAVEU, C.ESCENARI, C.PORTA, C.BUIT, C.SAGRADA, C.GLORIES, C.PEDRERA, C.ESTADI, C.MONESTIR, C.BOSC]);
  // Montserrat: agulles de roca altes, una per casella, en lloc d'un bloc pla
  if (nom === 'capellades') for (let y = 30; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (m[y][x] !== C.ROCA) continue;
    vist[y][x] = true;
    const alt = 1.6 + hash(x * 5, y * 3) * 4.5, r = .45 + hash(y, x) * .25;
    M.cubells.has(M.rocaMat) || M.cubells.set(M.rocaMat, { geos: [], ombra: true });
    M.cubells.get(M.rocaMat).geos.push(new THREE.CylinderGeometry(r * .55, r, alt, 7).translate(x + .5, alt / 2, y + .5));
    M.cubells.get(M.rocaMat).geos.push(new THREE.SphereGeometry(r * .58, 7, 5).translate(x + .5, alt, y + .5));
  }
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = m[y][x]; if (vist[y][x] || !solids.has(t)) continue;
    // rectangle més gran possible del mateix tipus a partir d'aquí
    let w = 1; while (x + w < MW && m[y][x + w] === t && !vist[y][x + w]) w++;
    let h = 1; while (y + h < MH && [...Array(w)].every((_, k) => m[y + h][x + k] === t && !vist[y + h][x + k])) h++;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) vist[yy][xx] = true;
    afegeixBloc(sc, t, x, y, w, h, M);
  }
  buidaCubells(sc, M.cubells);
  // Arbres
  const tronc = mat({ color: 0x5b3d25 });
  const llocsArbre = []; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (m[y][x] === C.ARBRE) llocsArbre.push({ x: x + .5, z: y + .5, s: 1.1 + hash(x, y) * .5, h: hash(x, y) });
  const boles = [];
  llocsArbre.forEach((a, k) => { for (let i = 0; i < 5; i++) boles.push({ a, r: .32 + hash(i, k * 7) * .22, ox: (hash(i, k) - .5) * .5, oy: .95 + hash(k, i) * .55, oz: (hash(k + i, 3) - .5) * .5 }); });
  const fullesM = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), mat({ map: textura(texFulles('#4c8f3e')), roughness: .85, flatShading: true }), Math.max(1, boles.length));
  const troncsM = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .09, .9, 7), tronc, Math.max(1, llocsArbre.length));
  const tmp = new THREE.Matrix4(), col = new THREE.Color();
  llocsArbre.forEach((a, i) => { tmp.makeScale(a.s, a.s, a.s).setPosition(a.x, .45 * a.s, a.z); troncsM.setMatrixAt(i, tmp); });
  boles.forEach((b, i) => fullesM.setColorAt(i, col.setHSL(.27 + b.a.h * .06, .45, .32 + (i % 5) * .03)));
  fullesM.count = boles.length; troncsM.count = llocsArbre.length;
  fullesM.castShadow = troncsM.castShadow = true; fullesM.receiveShadow = true; sc.add(fullesM, troncsM);
  const arbresG = { fullesM, boles };
  // Bosc del circuit: pins
  if (nom === 'muntanya') {
    const pins = []; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (m[y][x] === C.BOSC) pins.push([x + .2 + hash(x, y) * .6, y + .2 + hash(y, x) * .6, .8 + hash(x * 3, y) * .8]);
    const cono = new THREE.InstancedMesh(new THREE.ConeGeometry(.45, 1.6, 7), mat({ color: 0x24502a, flatShading: true }), pins.length);
    const pal = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .08, .5, 5), tronc, pins.length);
    const mm = new THREE.Matrix4();
    pins.forEach(([x, y, s], i) => { mm.makeScale(s, s, s).setPosition(x, .5 * s + .8 * s, y); cono.setMatrixAt(i, mm); mm.makeScale(s, s, s).setPosition(x, .25 * s, y); pal.setMatrixAt(i, mm); });
    cono.castShadow = true; sc.add(cono, pal);
  }
  // Aigua
  let aigua = null;
  const aig = []; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (m[y][x] === C.AIGUA || m[y][x] === C.MAR) aig.push([x, y]);
  if (aig.length) {
    const to = textura(texOnes(), 1, 1);
    aigua = mat({ map: to, color: 0x8fc0e0, roughness: .08, metalness: .35, transparent: true, opacity: .92 });
    const pl = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), aigua, aig.length), tm = new THREE.Matrix4();
    aig.forEach(([x, y], i) => { tm.makeTranslation(x + .5, .02, y + .5); pl.setMatrixAt(i, tm); }); pl.receiveShadow = true; sc.add(pl);
  }
  // Rètols dels locals temàtics sobre la porta
  for (const l of LOCALS[nom] || []) {
    const T = TIPUS_LOCAL[l.tipus];
    const rt = llenç(512, 96, (g) => { g.fillStyle = '#141414'; g.fillRect(0, 0, 512, 96); g.strokeStyle = T.color; g.lineWidth = 8; g.strokeRect(6, 6, 500, 84); g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(T.nom, 256, 50); });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .42), new THREE.MeshBasicMaterial({ map: textura(rt), toneMapped: false }));
    pl.position.set(l.x, 1.2, Math.floor(l.y) + .02); sc.add(pl);
  }
  // Fanals al llarg de les voreres
  if (!zona) {
    const llocs = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (m[y][x] !== C.CARRER || (x + y) % 4) continue;
      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) if (m[y + dy] && EDIFS.has(m[y + dy][x + dx])) { llocs.push([x + .5 + dx * .38, y + .5 + dy * .38]); break; }
    }
    const pal = new THREE.InstancedMesh(new THREE.CylinderGeometry(.025, .035, 1.5, 6), mat({ color: 0x2b2f33, metalness: .6, roughness: .4 }), llocs.length);
    const cap = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 8, 6), mat({ color: 0xfff3c0, emissive: 0xffe9a8, emissiveIntensity: .6 }), llocs.length);
    const mm = new THREE.Matrix4();
    llocs.forEach(([x, y], i) => { mm.makeTranslation(x, .75, y); pal.setMatrixAt(i, mm); mm.makeTranslation(x, 1.52, y); cap.setMatrixAt(i, mm); });
    pal.castShadow = true; sc.add(pal, cap);
  }
  // Pluja
  const gotes = new Float32Array(1500 * 6), pluja = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xc8d8ff, transparent: true, opacity: .45 }));
  pluja.geometry.setAttribute('position', new THREE.BufferAttribute(gotes, 3)); pluja.visible = false; pluja.frustumCulled = false; sc.add(pluja);
  return { sc, sun, arbresG, aigua, pluja, gotes, cotxes: [], sprites: [], ombres: [] };
}

// Un sol material per a cada dibuix de façana: la repetició es fa escalant les coordenades de textura de cada caixa
const materials = new Map();
const matDe = (c, extra) => { if (!materials.has(c)) materials.set(c, mat(Object.assign({ map: textura(c) }, extra))); return materials.get(c); };
function caixaUV(w, alt, h, rx) {
  const geo = new THREE.BoxGeometry(w, alt, h), uv = geo.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const [sx, sy] = f < 2 ? [h, rx] : f < 4 ? [1, 1] : [w, rx];
    for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy); }
  }
  return geo;
}

// Les peces de tots els edificis s'agrupen per material i al final es fusionen en poques malles (molt més ràpid)
const MAT_CORNISA = mat({ color: 0xd8cfbf }), MAT_XEMENEIA = mat({ color: 0x9a5a40 }), MAT_PUNXA = mat({ color: 0x6e6656, flatShading: true });
const MAT_ESCENARI = mat({ color: 0x3a2a1f }), MAT_BUIT = mat({ color: 0x111111 });
const MAT_COLORS = [0xe63946, 0xf2c230, 0x2a9d8f].map(c => mat({ color: c, emissive: c, emissiveIntensity: .25 }));
const MAT_GLORIES = mat({ color: 0x4f86c6, emissive: 0x1d4f9a, emissiveIntensity: .45, roughness: .25, metalness: .5, side: THREE.DoubleSide });
const MAT_PEDRERA = mat({ color: 0xf1ebdd, roughness: .8 });
const MAT_ESTADI = mat({ color: 0xa50044, roughness: .7 });
const MAT_PI = mat({ color: 0x24502a, flatShading: true });
function fusiona(geos) {
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g);
  const total = parts.reduce((a, g) => a + g.attributes.position.count, 0), out = new THREE.BufferGeometry();
  for (const nom of ['position', 'normal', 'uv']) {
    const mida = parts[0].attributes[nom].itemSize, arr = new Float32Array(total * mida); let o = 0;
    for (const g of parts) { arr.set(g.attributes[nom].array, o); o += g.attributes[nom].array.length; }
    out.setAttribute(nom, new THREE.BufferAttribute(arr, mida));
  }
  out.computeBoundingSphere();
  return out;
}
function buidaCubells(sc, cubells) {
  for (const [material, { geos, ombra }] of cubells) {
    const malla = new THREE.Mesh(fusiona(geos), material);
    malla.castShadow = ombra; malla.receiveShadow = true; sc.add(malla);
  }
}

function afegeixBloc(sc, t, x, y, w, h, M) {
  const cx0 = x + w / 2, cz = y + h / 2, hs = hash(x, y);
  const posa = (geo, material, ombra = true) => { if (!M.cubells.has(material)) M.cubells.set(material, { geos: [], ombra }); M.cubells.get(material).geos.push(geo); };
  const caixa = (alt, material, base = 0, rep = 1, ombra = true) => posa(caixaUV(w, alt, h, rep).translate(cx0, base + alt / 2, cz), material, ombra);
  if (t === C.EDIF || t === C.ESGL || t === C.MOLI || t === C.GARATGE) {
    const v = Math.floor(hs * FACANES.length), pisos = t === C.ESGL ? 3 : t === C.GARATGE ? 1 : 2 + Math.floor(hash(y, x) * 3);
    if (t === C.GARATGE) {
      M.porta3d = M.porta3d || llenç(256, 256, (g) => { g.fillStyle = '#cfd2d6'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#8f959b'; g.fillRect(16, 60, 224, 196); g.fillStyle = '#6f757b'; for (let k = 60; k < 256; k += 12) g.fillRect(16, k, 224, 4); g.fillStyle = '#f2c230'; g.fillRect(60, 12, 136, 34); g.fillStyle = '#111'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.fillText('TAXIS', 128, 38); });
      caixa(1.3, matDe(M.porta3d));
    } else {
      const baix = t === C.EDIF ? M.baixos[v] : t === C.ESGL ? M.pedra : M.baixos[(v + 1) % M.baixos.length];
      caixa(BAIXOS, matDe(baix));
      caixa(pisos * PIS, matDe(t === C.ESGL ? M.pedra : M.pisos[(v + (t === C.MOLI ? 2 : 0)) % M.pisos.length]), BAIXOS, pisos);
      // Cornisa i teulada a quatre aigües
      const top = BAIXOS + pisos * PIS;
      posa(new THREE.BoxGeometry(w + .12, .08, h + .12).translate(cx0, top + .04, cz), MAT_CORNISA);
      const mt = matDe(M.teules[Math.floor(hs * 4) % 4], { roughness: .8, flatShading: true }); mt.map.repeat.set(3, 3);
      posa(new THREE.ConeGeometry(Math.SQRT1_2, .55, 4, 1).rotateY(Math.PI / 4).scale(w + .2, 1, h + .2).translate(cx0, top + .08 + .275, cz), mt);
      if (hash(x * 3, y * 7) > .6) posa(new THREE.BoxGeometry(.18, .5, .18).translate(cx0 + w * .25, top + .45, cz - h * .2), MAT_XEMENEIA);
      if (t === C.ESGL) { // campanar
        posa(caixaUV(.8, 2.4, .8, 3).translate(cx0, top + 1.2, cz - .2), matDe(M.pedra));
        posa(new THREE.ConeGeometry(.62, .9, 4).rotateY(Math.PI / 4).translate(cx0, top + 2.85, cz - .2), MAT_PUNXA);
      }
    }
  } else if (t === C.ROCA) { caixa(3.5, matDe(M.pedra), 0, 3);
  } else if (t === C.PARET) { caixa(1.3, matDe(M.paret));
    if (!M.sostre) { M.sostre = true; const s = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), mat({ color: 0xf4efe6, side: THREE.DoubleSide })); s.rotation.x = Math.PI / 2; s.position.set(MW / 2, 1.3, MH / 2); sc.add(s); }
  } else if (t === C.TANCA || t === C.PORTA) {
    caixa(1.2, matDe(t === C.PORTA ? M.porta : M.tanca, { transparent: true, alphaTest: .4, side: THREE.DoubleSide, color: t === C.PORTA ? 0xffd23f : 0xffffff }), 0, 1, false);
  } else if (t === C.ALTAVEU) { caixa(nomGran(M.nom, y) ? 2.2 : 1.6, matDe(M.altaveu, { roughness: .7 }));
  } else if (t === C.SAGRADA) { // basílica amb torres altes de pedra
    caixa(1.6, matDe(M.pedra), 0, 2);
    const torres = [[.15, .2, 6.5], [.38, .1, 7.5], [.62, .1, 7.5], [.85, .2, 6.5], [.42, .62, 8.6], [.58, .62, 8.6], [.5, .45, 10], [.2, .9, 5], [.8, .9, 5]];
    for (const [fx, fz, alt] of torres) {
      const tx = x + fx * w, tz = y + fz * h;
      posa(new THREE.CylinderGeometry(.22, .34, alt, 9).translate(tx, alt / 2, tz), matDe(M.pedra));
      posa(new THREE.ConeGeometry(.24, .9, 9).translate(tx, alt + .45, tz), MAT_PUNXA);
      posa(new THREE.SphereGeometry(.13, 8, 6).translate(tx, alt + .95, tz), MAT_COLORS[Math.floor(alt) % 3]);
    }
  } else if (t === C.GLORIES) { // torre en forma de bala amb llums de colors
    posa(new THREE.CylinderGeometry(w * .5, w * .55, 7, 24, 1, true).translate(cx0, 3.5, cz), MAT_GLORIES);
    posa(new THREE.SphereGeometry(w * .5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 1.4, 1).translate(cx0, 7, cz), MAT_GLORIES);
  } else if (t === C.PEDRERA) { // façana blanca ondulada amb xemeneies guerreres
    for (let i = 0; i < 6; i++) posa(caixaUV(w + Math.sin(i * 1.3) * .3, .5, h + Math.cos(i) * .25, 1).translate(cx0, .25 + i * .5, cz), MAT_PEDRERA);
    for (let i = 0; i < 8; i++) posa(new THREE.ConeGeometry(.15, .6, 6).translate(x + .5 + hash(i, 4) * (w - 1), 3.3, y + .5 + hash(4, i) * (h - 1)), MAT_CORNISA);
  } else if (t === C.ESTADI) { caixa(2.2, MAT_ESTADI, 0, 3);
  } else if (t === C.MONESTIR) {
    caixa(2.4, matDe(M.pedra), 0, 3);
    posa(new THREE.ConeGeometry(Math.SQRT1_2, .7, 4).rotateY(Math.PI / 4).scale(w + .2, 1, h + .2).translate(cx0, 2.75, cz), MAT_PUNXA);
  } else if (t === C.BOSC) { // vores del món: arbres alts
    if (M.nom === 'muntanya') return;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) posa(new THREE.ConeGeometry(.5, 2, 7).translate(xx + .5, 1.6, yy + .5), MAT_PI);
  } else if (t === C.ESCENARI) { caixa(.6, MAT_ESCENARI);
  } else if (t === C.BUIT) { caixa(1.3, MAT_BUIT); }
}

const nomGran = (nom, y) => nom === 'vic' && y > 15;

// ---------- Cotxes 3D ----------
function cotxe3d() {
  const g = new THREE.Group(), cos = mat({ color: 0xffffff, roughness: .35, metalness: .45 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, .32, .55), cos); b.position.y = .28; b.castShadow = true; g.add(b);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(.6, .26, .5), mat({ color: 0x9fd3f0, roughness: .1, metalness: .6 })); cab.position.set(-.05, .55, 0); cab.castShadow = true; g.add(cab);
  const roda = new THREE.CylinderGeometry(.13, .13, .1, 12), rm = mat({ color: 0x111111 });
  for (const [x, z] of [[-.35, -.28], [.35, -.28], [-.35, .28], [.35, .28]]) { const r = new THREE.Mesh(roda, rm); r.rotation.x = Math.PI / 2; r.position.set(x, .13, z); g.add(r); }
  const llum = new THREE.Mesh(new THREE.BoxGeometry(.14, .08, .1), mat({ color: 0xff2d2d, emissive: 0xff2d2d, emissiveIntensity: 1 })); llum.position.set(0, .72, 0); g.add(llum);
  g.userData = { cos, llum, cab };
  return g;
}

// ---------- Cartells per a la gent (dibuixos del joc posats drets dins el 3D) ----------
let fotograma = 0;
function sprite3d() {
  const c = document.createElement('canvas'); c.width = 160; c.height = 224;
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, alphaTest: .05 }));
  s.center.set(.5, .04); s.userData = { c, g: c.getContext('2d'), tx };
  return s;
}
function ombra3d() { const o = new THREE.Mesh(new THREE.CircleGeometry(.22, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .32, depthWrite: false })); o.rotation.x = -Math.PI / 2; return o; }

// ---------- Inici i dibuix de cada fotograma ----------
export function inicia() {
  canvas3d = document.createElement('canvas'); canvas3d.id = 'joc3d';
  canvas3d.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:0;display:none';
  document.body.prepend(canvas3d);
  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: false, powerPreference: 'high-performance' });
  resolucio = Math.min(devicePixelRatio || 1, 1); renderer.setPixelRatio(resolucio);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  camera = new THREE.PerspectiveCamera(72, 1, .05, 130);
  preparaTextures();
}

export function invalida(nom) { const e = escenes.get(nom); if (e) { escenes.delete(nom); setTimeout(() => e.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); }), 0); } }

export function amaga() { if (canvas3d) canvas3d.style.display = 'none'; }

export function dibuixa(w, h) {
  if (!renderer) inicia();
  canvas3d.style.display = 'block';
  if (canvas3d.width !== Math.round(w * renderer.getPixelRatio())) { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const clau = J.zona || J.ciutat;
  if (!escenes.has(clau)) escenes.set(clau, construeix(clau));
  actual = escenes.get(clau);
  const E = actual, j = J.jug, t = performance.now() / 1000;
  // Càmera als ulls del personatge
  const ang = j.ang ?? Math.atan2(j.fy, j.fx), bob = j.mou ? Math.sin(j.pas) * .025 : Math.sin(t * 1.6) * .006;
  const sac = J.tremolor > 0 ? (Math.random() - .5) * .08 * J.tremolor : 0;
  const alt = j.cotxe ? .62 : j.vespa ? .78 : ULL;
  camera.position.set(j.x / TS + sac, alt + bob, j.y / TS + sac);
  camera.lookAt(j.x / TS + Math.cos(ang), alt + bob - .02, j.y / TS + Math.sin(ang));
  // Sol i ombres seguint el jugador
  E.sun.position.set(camera.position.x - 9, 16, camera.position.z - 12); E.sun.target.position.set(camera.position.x, 0, camera.position.z); E.sun.target.updateMatrixWorld();
  if (E.sc.userData.cel) E.sc.userData.cel.position.copy(camera.position);
  // Vent als arbres i ones a l'aigua
  { // vent: les copes es balancegen
    const { fullesM, boles } = E.arbresG, tmp = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc3 = new THREE.Vector3();
    boles.forEach((b, i) => { const a = b.a, ox = Math.sin(t * 1.3 + a.x) * .05 * b.oy; v.set(a.x + (b.ox + ox) * a.s, b.oy * a.s, a.z + b.oz * a.s); sc3.setScalar(b.r * a.s); tmp.compose(v, q.setFromEuler(e.set(0, i, 0)), sc3); fullesM.setMatrixAt(i, tmp); });
    fullesM.instanceMatrix.needsUpdate = true;
  }
  if (E.aigua) E.aigua.map.offset.set(t * .02, t * .013);
  // Cotxes
  const llista = [...J.cotxes, J.vila, J.subi, J.carro].filter(c => c && c !== j.cotxe);
  if (!J.zona) llista.push({ x: TAXI.x, y: TAXI.y, ang: 0, tipus: 'taxi', color: '#f2c230' });
  while (E.cotxes.length < llista.length) { const c = cotxe3d(); E.sc.add(c); E.cotxes.push(c); }
  E.cotxes.forEach((m, i) => {
    const c = llista[i]; m.visible = !!c; if (!c) return;
    m.position.set(c.x / TS, 0, c.y / TS); m.rotation.y = -(c.ang || 0);
    const col = c.tipus === 'policia' ? '#f4f6fa' : c.tipus === 'subineta' ? '#2c5aa0' : c.tipus === 'vilamovil' ? '#f7f7f2' : c.tipus === 'carromato' ? '#0d0d10' : c.color;
    m.userData.cos.color.set(col); m.scale.setScalar(c.tipus === 'subineta' ? 1.25 : 1);
    m.userData.llum.visible = c.tipus === 'policia'; if (c.tipus === 'policia') m.userData.llum.material.color.set(Math.floor(t * 6) % 2 ? 0xff2d2d : 0x2d6bff), m.userData.llum.material.emissive.copy(m.userData.llum.material.color);
  });
  // Gent i coses: les més properes que es veuen, com a cartells drets
  const fx = Math.cos(ang), fy = Math.sin(ang), cosos = [];
  const posa = (e, k, fn) => { const dx = e.x - j.x, dy = e.y - j.y, d = Math.hypot(dx, dy); if (d < 1700 && (dx * fx + dy * fy) > -40) cosos.push({ e, k, fn, d }); };
  J.parelles.forEach(p => posa(p, 2.3, g => dibuixaParella(g, p)));
  J.agents.forEach(a => posa(a, 2.3, g => dibuixaAgent(g, a)));
  J.matons.forEach(mt => posa(mt, 2.6, g => dibuixaMaton(g, mt)));
  J.pintors.forEach(p => posa(p, 2, g => dibuixaPintor(g, p)));
  J.armes.forEach(a => posa(a, 2, g => dibuixaArmaTerra(g, a)));
  J.vespes.forEach(v => !v.ocupada && posa(v, 2.2, g => dibuixaVespa(g, v)));
  if (J.ciutat === 'vic' && !J.zona) { J.control.forEach(c => posa(c, 2.3, g => dibuixaControl(g, c))); J.tendes.forEach(tn => posa(tn, 1.4, g => dibuixaTenda(g, tn))); }
  J.gegants.forEach(ge => posa(ge, 1, g => dibuixaGegant(g, ge)));
  if (J.guita) posa(J.guita, 1, g => dibuixaGuita(g, J.guita));
  J.multitud.forEach(mu => posa(mu, 2.3, g => personaPetita(g, mu.x, mu.y - Math.abs(Math.sin(mu.ball)) * 5, mu.pr, 0, false, false)));
  J.focs.forEach(fc => posa(fc, 1.2, g => dibuixaFoc(g, fc)));
  J.sorpreses.forEach(s => SORPRESES[s.tipus].dibuixa && posa(s, s.tipus === 'gallina' || s.tipus === 'gat' ? 2.4 : 1.6, g => SORPRESES[s.tipus].dibuixa(g, s)));
  J.clons.forEach(c => posa(c, 1.3, g => { const jr = J.jug, gx = jr.x, gy = jr.y; Object.assign(jr, { x: c.x, y: c.y }); g.globalAlpha = .6; dibuixaJugador(g); g.globalAlpha = 1; Object.assign(jr, { x: gx, y: gy }); }));
  cosos.sort((a, b) => a.d - b.d); cosos.length = Math.min(cosos.length, 34); fotograma++;
  while (E.sprites.length < cosos.length) { const s = sprite3d(), o = ombra3d(); E.sc.add(s, o); E.sprites.push(s); E.ombres.push(o); }
  E.sprites.forEach((s, i) => {
    const o = cosos[i], om = E.ombres[i]; s.visible = om.visible = !!o; if (!o) return;
    const { g, c, tx } = s.userData;
    if (s.userData.e !== o.e || i < 8 || (fotograma + i) % 4 === 0) { // els propers cada fotograma, els llunyans cada tres
      s.userData.e = o.e;
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height);
      g.translate(c.width / 2, c.height * .96); g.scale(o.k, o.k); g.translate(-o.e.x, -o.e.y);
      o.fn(g); tx.needsUpdate = true;
    }
    const ample = c.width / o.k / TS, alcada = c.height / o.k / TS;
    s.scale.set(ample, alcada, 1); s.position.set(o.e.x / TS, 0, o.e.y / TS);
    om.position.set(o.e.x / TS, .015, o.e.y / TS); om.scale.setScalar(o.k > 2 ? 1 : 1.6);
  });
  // Pluja al voltant de la càmera
  E.pluja.visible = J.pluja > 0;
  if (E.pluja.visible) {
    const p = E.gotes;
    for (let i = 0; i < p.length; i += 6) {
      let y = (p[i + 1] || Math.random() * 3) - .18; if (y < 0) { p[i] = camera.position.x + (Math.random() - .5) * 12; p[i + 2] = camera.position.z + (Math.random() - .5) * 12; y = 3; }
      p[i + 1] = y; p[i + 3] = p[i] - .02; p[i + 4] = y - .14; p[i + 5] = p[i + 2];
    }
    E.pluja.geometry.attributes.position.needsUpdate = true;
  }
  renderer.render(E.sc, camera);
  const ara = performance.now(); if (ultimFotograma) tempsMig = tempsMig * .92 + Math.min(100, ara - ultimFotograma) * .08; ultimFotograma = ara;
  if (ara - ultimAjust > 1500) {
    ultimAjust = ara;
    const nova = tempsMig > 30 ? Math.max(.5, resolucio - .1) : tempsMig < 19 ? Math.min(Math.min(devicePixelRatio || 1, 1.25), resolucio + .05) : resolucio;
    if (Math.abs(nova - resolucio) > .01) { resolucio = nova; renderer.setPixelRatio(resolucio); renderer.setSize(w, h, false); }
  }
}
