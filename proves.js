// Proves automàtiques del joc. Obre la pàgina amb ?proves al final de l'adreça i els resultats surten a la pantalla i a la consola.
// Fan servir les funcions i l'estat globals del joc, i deixen el moneder i la botiga tal com estaven.

const CLAUS = ['ensurts-tir', 'ensurts-ralli-millor', 'ensurts-moneder', 'ensurts-skins', 'ensurts-explosions', 'ensurts-missions', 'ensurts-historia', 'ensurts-mode', 'ensurts-paquets', 'ensurts-garatge'];

export async function executa() {
  const resultats = [], guardat = Object.fromEntries(CLAUS.map(k => [k, localStorage.getItem(k)]));
  const prova = (nom, fn) => { try { const r = fn(); resultats.push([nom, r === true, r === true ? '' : String(r)]); } catch (e) { resultats.push([nom, false, e.message]); } };
  const neteja = () => CLAUS.forEach(k => localStorage.removeItem(k));

  // --- Moneder i botiga ---
  neteja();
  prova('Comprar una skin resta 1.000 punts del moneder', () => {
    moneder.suma(2500);
    if (!compraSkin('subimena')) return 'no ha deixat comprar';
    if (moneder.get() !== 1500) return 'moneder = ' + moneder.get();
    return comprats().includes('subimena') || 'la skin no queda comprada';
  });
  prova('No es pot comprar dues vegades la mateixa skin', () => compraSkin('subimena') === false && moneder.get() === 1500 || 'ha cobrat dues vegades');
  prova('Sense prou punts no es pot comprar', () => { neteja(); moneder.suma(300); return compraSkin('nil') === false && moneder.get() === 300 || 'ha comprat sense diners'; });

  // --- Botiga d'explosions ---
  prova("Comprar una explosió la guarda per a la propera partida", () => {
    neteja(); moneder.suma(2000);
    if (!comprarExplosio()) return 'no ha deixat comprar';
    return (moneder.get() === 500 && explosionsGuardades() === 1) || 'moneder ' + moneder.get() + ', guardades ' + explosionsGuardades();
  });
  prova("A la partida següent l'explosió comprada s'equipa (2 en total)", () => {
    comenca(PERSONATGES[0]);
    const ok = J.bombes === 2 && explosionsGuardades() === 0;
    const r = ok || 'bombes ' + J.bombes + ', guardades ' + explosionsGuardades();
    J.cobrat = true; tornaAlMenu();
    return r;
  });

  // --- Missions diàries ---
  prova('Les missions del dia són 3, diferents i sempre les mateixes', () => {
    const d = new Date(2026, 9, 22), a = missionsAvui(d), b = missionsAvui(d);
    return (a.length === 3 && new Set(a.map(m => m.id)).size === 3 && a.map(m => m.id).join() === b.map(m => m.id).join()) || a.map(m => m.id).join();
  });
  prova('Una missió feta es paga una sola vegada', () => {
    neteja();
    const totFet = { espantades: 99, ginebra: true, parellesFetes: new Set(['nilafrica']), cotxesDestruits: 9, quadres: 9, kos: 9, mercedesFet: true, autostopOk: true, punts: 99999, dinersRecollits: 9999, uriFet: true };
    const primer = comprovaMissions(totFet), premi = primer.reduce((a, m) => a + m.premi, 0);
    if (primer.length !== 3) return 'missions pagades: ' + primer.length;
    if (moneder.get() !== premi) return 'moneder ' + moneder.get() + ' i premi ' + premi;
    return comprovaMissions(totFet).length === 0 || "s'han pagat dues vegades";
  });

  // --- Intel·ligència de la Subimena ---
  prova('Amb la Subimena, la policia busca al costat contrari', () => {
    const o = objectiuPolicia({ x: 100, y: 100 }, { x: 150, y: 80 }, true);
    return (o.x === 50 && o.y === 120) || JSON.stringify(o);
  });
  prova('Sense la Subimena, la policia va cap al jugador', () => { const o = objectiuPolicia({ x: 100, y: 100 }, { x: 150, y: 80 }, false); return (o.x === 150 && o.y === 80) || JSON.stringify(o); });

  // --- Mecàniques dins la partida ---
  neteja();
  comenca(PERSONATGES[0]);
  const j = J.jug; j.invul = 0;
  prova('Una parella amb nom dona el doble de punts', () => {
    const normal = Object.assign(novaParella('passeja'), { x: j.x + 40, y: j.y, fx: -1, fy: 0, alerta: 0 }), especial = Object.assign(novaParella('passeja'), { x: j.x - 40, y: j.y, fx: 1, fy: 0, alerta: 0, especial: PARELLES_NOM[1] });
    J.parelles = [normal]; J.combo = 1; let abans = J.punts; fesAtac(normal.x, normal.y, 10); const pn = J.punts - abans;
    J.parelles = [especial]; J.combo = 1; abans = J.punts; fesAtac(especial.x, especial.y, 10); const pe = J.punts - abans;
    return pe === pn * 2 || 'normal ' + pn + ', amb nom ' + pe;
  });
  prova('Fer HOLAAA puja el nivell de cerca de la policia', () => { J.cerca = 0; j.arma = null; j.recBuh = 0; accio(); return Math.abs(J.cerca - .35) < 1e-9 || 'cerca = ' + J.cerca; });
  prova("Si en Guillem t'encasta, et destrossa el cotxe però no perds cap vida", () => {
    j.cotxe = Object.assign(nouBestia(), { x: j.x, y: j.y, estat: 'conduit' }); J.bestia = j.cotxe; const v = j.cotxe;
    const vides = J.vides; J.guillem = { x: j.x + 10, y: j.y, vx: 0, vy: 0, t: 1, ang: 0 }; j.invul = 0;
    actualitzaCarretera(.016);
    return (J.vides === vides && !j.cotxe && v.estat === 'espatllat') || 'vides ' + vides + ' -> ' + J.vides + ', cotxe ' + v.estat;
  });
  prova('Al mode pacífic no hi ha policia ni res que et faci mal', () => {
    const ab = J.pacific; J.pacific = true; J.agents.push(nouAgent()); J.cotxes.push(nouCotxe('policia', 400)); J.guillem = { x: j.x, y: j.y, t: 5, vx: 0, vy: 0 };
    const vides = J.vides; j.invul = 0; ferit('PROVA'); pacifica(); const ok = J.agents.length === 0 && !J.cotxes.some(c => c.tipus === 'policia') && !J.guillem && J.vides === vides;
    J.pacific = ab; return ok || 'agents ' + J.agents.length;
  });
  prova('Les autoestopistes et porten a Vic i paguen 2.500 punts', () => {
    J.vides = 3; J.ciutat = 'capellades'; activaCiutat('capellades'); J.zona = null;
    const v = Object.assign(nouBestia(), { x: VIC_SORTIDA.x, y: VIC_SORTIDA.y, estat: 'conduit' }); j.cotxe = v; J.bestia = v; j.x = v.x; j.y = v.y;
    J.autostop = { x: v.x, y: v.y, estat: 'dins' }; const abans = J.punts;
    actualitzaCarretera(.016);
    return (J.vicVisitat && J.autostopOk && J.punts - abans === 2500) || 'a Vic: ' + !!J.vicVisitat + ', punts +' + (J.punts - abans);
  });
  J.cobrat = true; tornaAlMenu();

  // --- El món gran ---
  const modeAbans = modeJoc; modeJoc = 'arcade';
  comenca(PERSONATGES[0]);
  prova('El món fa 960x720 i comences a casa del Ramon', () => (MW === 960 && MH === 720 && Math.hypot(J.jug.x - CASA_LLOC.x, J.jug.y - CASA_LLOC.y) < 1) || MW + 'x' + MH + ' a ' + [J.jug.x / TS, J.jug.y / TS]);
  prova('Des de casa es pot arribar a peu a tots els pobles i a la comissaria', () => {
    const vist = new Uint8Array(MW * MH), cua = [Math.floor(CASA_LLOC.y / TS) * MW + Math.floor(CASA_LLOC.x / TS)]; vist[cua[0]] = 1;
    for (let k = 0; k < cua.length; k++) { const i = cua[k], x = i % MW, y = (i / MW) | 0; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue; const n = ny * MW + nx; if (!vist[n] && transitable(mapa[ny][nx])) { vist[n] = 1; cua.push(n); } } }
    const llocs = POBLES.map(p => [p.nom, p.x + 8 * Math.floor(p.w / 16), p.y + 7 * Math.floor(p.h / 14)]).concat([['VIC', VIC.x0 + 17, VIC.y0 + 11], ['COMISSARIA', COMISSARIA.porta, COMISSARIA.y0 + 2], ['LLOGUER DE BICIS', Math.floor(LLOGUER_BICIS.x / TS), Math.floor(LLOGUER_BICIS.y / TS) + 1], ['TELECADIRA', Math.floor(TELECADIRA.baix.x / TS), Math.floor(TELECADIRA.baix.y / TS)]], GASOLINERES.map((g, i) => ['GASOLINERA ' + i, g.x + 1, g.y + 2]));
    const no = llocs.filter(([, x, y]) => ![0, 1].some(a => [0, 1].some(b => vist[(y + b) * MW + x + a]))).map(l => l[0]);
    return no.length === 0 || 'no hi arribes: ' + no.join(', ');
  });

  // --- Pistola ---
  prova("La pistola s'agafa a la caixa de casa i deixa K.O. un policia", () => {
    const j = J.jug; j.x = PISTOLA_LLOC.x; j.y = PISTOLA_LLOC.y + 20; actualitzaPistola(.016);
    if (!j.pistola) return 'no has agafat la pistola';
    j.y += 300; // lluny de la caixa, que si no recarrega
    const a = Object.assign(nouAgent(), { x: j.x + 160, y: j.y }); J.agents = [a];
    disparaPistola(); for (let i = 0; i < 20 && !(a.ko > 0); i++) actualitzaPistola(.016);
    return (a.ko > 0 && j.pistola.bales === BALES_MAX - 1) || 'ko ' + a.ko + ', bales ' + j.pistola.bales;
  });
  prova("Entrar a la comissaria comença l'assalt i 40 mossos K.O. et fan guanyar", () => {
    const j = J.jug; j.x = (COMISSARIA.porta + 1) * TS; j.y = (COMISSARIA.y0 + 5) * TS; j.invul = 99;
    actualitzaBatalla(.016);
    if (!J.batalla || J.agents.filter(a => a.mosso).length < 8) return 'no ha començat';
    for (let i = 0; i < 40; i++) { const m = J.agents.find(a => a.mosso && !(a.ko > 0)) || (J.agents.push(nouMosso()), J.agents[J.agents.length - 1]); koAgent(m); }
    J.cobrat = true; actualitzaBatalla(.016); actualitzaBatalla(8);
    return (J.guanyat && estat === 'final') || 'kos ' + (J.batalla && J.batalla.kos) + ', estat ' + estat;
  });
  tornaAlMenu();

  // --- Policia, detenció i calabós ---
  comenca(PERSONATGES[0]);
  prova('La policia no et persegueix fins que no la lies', () => {
    const j = J.jug; j.invul = 0; const a = Object.assign(nouAgent(), { x: j.x - 80, y: j.y, fx: 1, fy: 0 }); J.agents = [a];
    for (let i = 0; i < 10; i++) actualitza(.05);
    return (!J.liada && a.estat !== 'persegueix') || 'liada ' + J.liada + ', estat ' + a.estat;
  });
  prova('Sense fer res greu, la policia et deté i acabes al calabós', () => {
    const j = J.jug; J.liada = true; J.gravetat = 0; j.invul = 0; const a = Object.assign(nouAgent(), { x: j.x + 50, y: j.y, fx: -1, fy: 0 }); J.agents = [a];
    for (let i = 0; i < 20 && estat === 'joc'; i++) actualitza(.05);
    if (estat === 'busted') J.continuaDetencio(); // sense esperar la pantalla BUSTED
    if (estat !== 'video') return 'no hi ha detenció (estat ' + estat + ')';
    acabaVideo();
    return (J.zona === 'presso' && mapa[10][16] === C.TANCA) || 'zona ' + J.zona;
  });
  prova("Espantant el guàrdia s'obre la cel·la i per la sortida et fuges", () => {
    const g = J.agents[0]; g.x = 17 * TS; g.y = 12 * TS; J.jug.x = 17.5 * TS; J.jug.y = 9.4 * TS; J.jug.recBuh = 0; accio(); // arrambat als barrots
    if (mapa[10][16] === C.TANCA) return 'la cel·la segueix tancada';
    J.agents.forEach(a => a.glacat = 99); J.jug.x = 20.5 * TS; J.jug.y = 26.6 * TS; const ap = accioPropera(); if (ap) ap.fer();
    return (!J.zona && Math.abs(J.jug.x - (COMISSARIA.porta + 1) * TS) < 2) || 'zona ' + J.zona;
  });
  prova('Espantar el benziner: benzina gratis però avisa la policia', () => {
    const gs = GASOLINERES[0], b = J.benziners[0], j = J.jug;
    const v = J.aparcats.find(v => v.tipus === 'carromato'); j.x = v.x; j.y = v.y; pujaVila(); const c = j.cotxe; c.benzina = 10;
    c.x = j.x = sortidorDe(gs).x; c.y = j.y = sortidorDe(gs).y + 40; J.liada = false;
    fesAtac(b.x, b.y, 80, {}); const ap = accioPropera(); if (!ap) return 'no surt cap acció';
    ap.fer();
    return (c.benzina === 100 && J.liada && J.gravetat >= 1 && ap.boto === 'GRATIS') || ap.text + ' · benzina ' + c.benzina;
  });
  prova('Un míssil rebenta els edificis de prop', () => {
    baixaVila(); const p = POBLES[1]; let x = 0, y = 0;
    for (let yy = p.y; yy < p.y + p.h && !x; yy++) for (let xx = p.x; xx < p.x + p.w; xx++) if (mapa[yy][xx] === C.EDIF) { x = xx; y = yy; break; }
    if (!x) return 'no hi ha cap edifici';
    explosioMissil({ x: (x + .5) * TS, y: (y + .5) * TS, t: 0 });
    return mapa[y][x] === C.RUNA || 'casella ' + mapa[y][x];
  });
  prova("Amb una bici, el telecadira et puja a les pistes d'Arinsal", () => {
    const j = J.jug; J.punts = 1000; j.x = LLOGUER_BICIS.x; j.y = LLOGUER_BICIS.y + 60; accioPropera().fer();
    if (!j.bici || J.punts !== 600) return 'bici ' + j.bici + ', punts ' + J.punts;
    j.x = TELECADIRA.baix.x; j.y = TELECADIRA.baix.y + 30; accioPropera().fer();
    for (let i = 0; i < 70 && J.zona !== 'arinsal'; i++) actualitza(.1);
    return J.zona === 'arinsal' || 'zona ' + J.zona;
  });
  J.cobrat = true; tornaAlMenu();

  // --- Coses a l'estil GTA ---
  comenca(PERSONATGES[0]);
  prova('Una ramonada fa fugir el conductor i et pots endur el cotxe', () => {
    const j = J.jug, c = J.cotxes.find(c => c.tipus === 'normal'); j.x = c.x + 40; j.y = c.y; j.recBuh = 0; accio();
    if (J.cotxes.includes(c) || c.tipus !== 'robat') return 'el conductor no ha fugit';
    const ap = accioPropera(); if (!ap || ap.boto !== 'PUJAR') return 'acció: ' + (ap && ap.text);
    ap.fer(); return (j.cotxe === c && J.liada) || 'no condueixes el cotxe';
  });
  prova('Cada model té la seva velocitat punta real (un esportiu arriba als 230 km/h)', () => {
    const j = J.jug, v = j.cotxe, punta = model => { v.model = model; v.x = 200 * TS; v.y = 16.5 * TS; v.ang = 0; v.va = 0; v.benzina = 100; j.x = v.x; j.y = v.y; let max = 0; tecles.KeyW = true; for (let i = 0; i < 1000; i++) { condueix(v, j, 0, 0, 0, .03); max = Math.max(max, v.va); v.x = 200 * TS; } tecles.KeyW = false; return Math.round(max / KMH); };
    const e = punta('esportiu'), c = punta('camio'), u = punta('utilitari'); v.model = undefined;
    return (e >= 220 && e <= 232 && c <= 106 && c > 80 && u > 150 && u <= 171) || 'esportiu ' + e + ', camió ' + c + ', utilitari ' + u;
  });
  prova("Si la lies molt arriba l'exèrcit, i un soldat et porta a la presó de l'illa", () => {
    const j = J.jug, ab = { liada: J.liada, cerca: J.cerca, gravetat: J.gravetat, agents: J.agents, cotxes: J.cotxes }; J.zona = null; J.pacific = false;
    J.liada = true; J.cerca = 5; J.gravetat = 15; J.exercit = null; actualitzaExercit(.1); if (!J.exercit) return "no ve l'exèrcit";
    const c = nouCotxe('militar', 950); c.x = j.x + 200; c.y = j.y; J.cotxes = [c]; actualitzaVehicles(.05);
    const soldats = J.agents.filter(a => a.militar); if (soldats.length < 4) return 'soldats: ' + soldats.length;
    j.invul = 0; soldats[0].x = j.x + 10; soldats[0].y = j.y; soldats[0].glacat = 0; estat = 'joc'; actualitzaVehicles(.05);
    const ok = estat === 'busted'; J.continuaDetencio = null; estat = 'joc'; Object.assign(J, ab); J.exercit = null; return ok || 'no et detenen';
  });
  prova("De la presó de l'illa només se surt amb les claus, la porta i la barca (o complint la condemna)", () => {
    const j = J.jug; entraIlla(); const I = J.illa;
    try {
      j.x = 30 * TS; j.y = 31.4 * TS; const tancada = accioPropera(); if (!tancada || tancada.boto !== 'TANCADA') return 'la porta no és tancada';
      j.x = 30 * TS; j.y = 20 * TS; I.pati = false; I.tPati = 99; const g = J.agents[1]; g.x = j.x - 100; g.y = j.y; g.ruta = [{ x: g.x, y: g.y }]; g.r = 0; g.fx = 1; g.fy = 0; g.glacat = 0; j.invul = 0; actualitzaGuardiaIlla(g, .05);
      if (!dinsCellaIlla(j) || I.condemna <= 240) return "el guàrdia no t'ha enxampat";
      I.condemna = .01; actualitza(.05); const lliure = !J.illa; acabaVideo(); estat = 'joc';
      return (lliure && J.zona === null && Math.hypot(j.x - PORT_ILLA.x, j.y - PORT_ILLA.y) < 50) || 'zona ' + J.zona;
    } finally { if (J.zona === 'illa') { J.illa = null; sortirZona(); } if (VID) acabaVideo(); estat = 'joc'; }
  });
  prova('Al concessionari es compra un cotxe de tuning i queda al garatge del Ramon', () => {
    const j = J.jug; localStorage.removeItem('ensurts-garatge'); moneder.suma(-moneder.get()); moneder.suma(25000);
    const e = EXPOSICIO.find(e => e.model === 'skyline'); j.cotxe = null; j.x = e.x; j.y = e.y + 60; const ac = accioPropera();
    if (!ac || ac.boto !== 'COMPRAR') return 'acció: ' + (ac && ac.boto); ac.fer();
    const c = J.aparcats.find(c => c.tipus === 'propi' && c.model === 'skyline'), pl = placesGaratge()[0];
    if (!c || Math.hypot(c.x - pl.x, c.y - pl.y) > 5 || moneder.get() !== 3000) return 'cotxe ' + !!c + ', moneder ' + moneder.get();
    J.aparcats = []; posaAparcats(); return (J.aparcats.some(c => c.tipus === 'propi' && c.model === 'skyline') && accioConcessionari(e).boto === 'TEU') || 'no hi és a la partida següent';
  });
  prova('Hi ha semàfors, senyals i rotondes, i el trànsit para en vermell', () => {
    llestSenyals(); const S = [...SEMAFORS.values()].find(s => s.llums); if (!S || SENYALS.length < 50 || !mapa.rotondes.length) return 'semàfors ' + SEMAFORS.size + ', senyals ' + SENYALS.length;
    const eix = llumSemafor(S, 'h') === 'vermell' ? 'h' : 'v', c = nouCotxe('normal', 300); c.model = 'berlina';
    if (eix === 'h') { c.x = (S.ix - 1.5) * TS; c.y = (S.iy + 1.5) * TS; c.fx = 1; c.fy = 0; c.cami = [[(S.ix + .5) * TS, (S.iy + 1.5) * TS]]; } else { c.x = (S.ix + .5) * TS; c.y = (S.iy - 1.5) * TS; c.fx = 0; c.fy = 1; c.cami = [[(S.ix + .5) * TS, (S.iy + .5) * TS]]; }
    const x0 = c.x, y0 = c.y, ab = J.cotxes; J.cotxes = [c]; condueixNPC(c, .1); J.cotxes = ab;
    return (llumSemafor(S, eix) !== 'verd' && c.x === x0 && c.y === y0) || 'el cotxe no ha parat (' + llumSemafor(S, eix) + ')';
  });
  prova("Si et quedes davant un cotxe gaire estona, t'atropella", () => {
    baixaVila(); const j = J.jug; J.vides = 3; j.invul = 0; const c = nouCotxe('normal', 300); c.estat = 'roda'; c.fx = 1; c.fy = 0; c.ang = 0; c.cami = [{ x: c.x + 999, y: c.y }]; J.cotxes = [c]; j.x = c.x + 70; j.y = c.y;
    const v0 = J.vides; for (let i = 0; i < 90 && J.vides === v0; i++) actualitzaVehicles(.1);
    return J.vides < v0 || 'espera ' + c.espera;
  });
  prova("A l'armeria es poden comprar armes de foc", () => {
    const j = J.jug; J.punts = 6000; const l = LOCALS.capellades.find(l => l.tipus === 'armeria'); j.x = l.x * TS; j.y = l.y * TS + 30; localProper().fer();
    if (J.zona !== 'armeria') return 'no has entrat';
    j.x = VITRINES[2].x; j.y = VITRINES[2].y + 40; accioPropera().fer();
    const ok = j.pistola && j.pistola.tipus === 'uzi' && J.punts === 3500; sortirZona(); return ok || 'arma ' + (j.pistola && j.pistola.tipus) + ', punts ' + J.punts;
  });
  prova('Un míssil al bosc hi cala foc i venen els bombers', () => {
    const j = J.jug; let pos = null; for (let y = 60; y < 200 && !pos; y++) for (let x = 150; x < 300; x++) if (mapa[y][x] === C.ARBRE && mapa[y][x + 1] === C.ARBRE) { pos = [x, y]; break; }
    j.x = (pos[0] + 12) * TS; j.y = pos[1] * TS; j.invul = 999; explosioMissil({ x: (pos[0] + .5) * TS, y: (pos[1] + .5) * TS, t: 0 });
    if (!J.focsBosc.size) return 'no hi ha foc';
    for (let i = 0; i < 80 && !J.bombers; i++) actualitzaFocs(.1);
    return !!J.bombers || 'no han vingut els bombers';
  });
  prova("En Guillem avisa abans d'arribar i després va recte", () => {
    const j = J.jug; J.liada = true; J.guillem = null; J.tGuillem = 0; if (!j.cotxe) { const v = J.aparcats.find(v => v.tipus === 'carromato'); j.x = v.x; j.y = v.y; pujaVila(); }
    j.cotxe.fx = 1; j.cotxe.fy = 0; actualitzaCarretera(.016); const g = J.guillem; if (!g) return 'no ha vingut';
    const x0 = g.x; actualitzaCarretera(.5); if (g.avis <= 0 || g.x !== x0) return "no espera durant l'avís";
    actualitzaCarretera(2); return (g.vx !== 0 || g.vy !== 0) || 'no arrenca';
  });
  prova('En Guillem fa drift i la policia et perd', () => {
    baixaVila(); J.guillem = null; const j = J.jug; J.liada = true; J.drift = null; J.tDrift = 0; const a = Object.assign(nouAgent(), { x: j.x + 200, y: j.y, estat: 'persegueix', ultim: { x: j.x, y: j.y } }); J.agents = [a];
    actualitzaDrift(.016); if (!J.drift) return 'no ha vingut'; actualitzaDrift(.1);
    return a.estat === 'patrulla' || 'estat ' + a.estat;
  });
  prova('Conduint tranquil, la policia no et persegueix ni et punxa les rodes', () => {
    const j = J.jug; J.liada = false; J.cerca = 0; if (!j.cotxe) { const v = J.aparcats.find(v => v.tipus === 'carromato'); j.x = v.x; j.y = v.y; pujaVila(); }
    const c = nouCotxe('policia', 300); c.estat = 'roda'; c.x = j.x + 40; c.y = j.y; J.cotxes = [c]; J.tPoliCotxe = 0;
    actualitzaVehicles(.05); actualitzaVehicles(.05);
    const ok = (c.estat === 'marxa' && j.cotxe && J.cotxes.filter(x => x.tipus === 'policia' && x.estat !== 'marxa').length === 0) || 'estat ' + c.estat; baixaVila(); return ok;
  });
  prova('Al circuit de ral·lis hi ha cotxes al paddock i una volta per tots els controls queda cronometrada', () => {
    localStorage.removeItem('ensurts-ralli-millor'); const j = J.jug; if (j.cotxe) baixaVila();
    const rc = J.aparcats.filter(c => c.tipus === 'ralli'); if (rc.length < 4) return 'cotxes: ' + rc.length;
    if (mapa[RALLI.sortida[1]][RALLI.sortida[0]] !== C.TERRA) return 'la sortida no és de terra';
    j.x = rc[0].x; j.y = rc[0].y; pujaVila(); const v = j.cotxe; if (!v || v.tipus !== 'ralli') return 'no condueixes un cotxe de ral·li';
    J.ralli = null; J.semafor = null; const s0 = ptRalli(0); v.x = j.x = s0.x; v.y = j.y = s0.y; for (let k = 0; k < 11; k++) actualitzaRalli(.4); if (!J.ralli || !J.ralli.actiu) return 'el semàfor no ha donat la sortida';
    if (v.benzina !== 100) return 'el cotxe de ral·li gasta benzina';
    for (let i = 1; i <= RALLI.punts.length; i++) { const p = ptRalli(i % RALLI.punts.length); v.x = j.x = p.x; v.y = j.y = p.y; for (let k = 0; k < 3; k++) actualitzaRalli(.5); }
    const ok = millorRalli() > 0 || 'cap volta'; baixaVila(); return ok;
  });
  prova('Al camp de tir es pot fer el concurs de precisió i el de tir al plat', () => {
    localStorage.removeItem('ensurts-tir'); const j = J.jug; if (j.cotxe) baixaVila();
    j.x = CAMP_TIR.precisio.x * TS; j.y = CAMP_TIR.precisio.y * TS; const ap = accioPropera(); if (!ap || ap.boto !== 'CONCURS') return 'no surt el concurs';
    ap.fer(); for (let i = 0; i < 10; i++) { J.jug.recPis = 0; J.tir.t = 0; tirConcurs(); }
    if (!J.tir.fi || J.tir.n !== 10) return 'precisió: ' + J.tir.n + ' tirs';
    J.tir = null; comencaTir('plat'); for (let i = 0; i < 400 && !J.tir.fi; i++) { actualitzaTir(.05); if (J.tir.plat && J.tir.plat.tocat === undefined) { J.jug.recPis = 0; tirConcurs(); } }
    const ok = (J.tir.fi && millorsTir().precisio > 0) || 'plat: ' + J.tir.n; J.tir = null; return ok;
  });
  prova('La patrulla para i en baixen dos policies', () => {
    const j = J.jug; J.liada = true; const c = nouCotxe('policia', 300); c.aPeu = true; c.x = j.x + 150; c.y = j.y; J.cotxes = [c]; const n0 = J.agents.length;
    actualitzaVehicles(.05);
    return (c.buit && J.agents.length === n0 + 2) || 'agents ' + (J.agents.length - n0);
  });
  prova('Passar per una rampa a tota velocitat fa saltar el cotxe', () => {
    const j = J.jug; if (!j.cotxe) { const a = J.aparcats.find(v => v.tipus === 'carromato'); j.x = a.x; j.y = a.y; pujaVila(); }
    const v = j.cotxe, r = RAMPES[0]; Object.assign(v, { x: r.x - 10, y: r.y, fx: 1, fy: 0, vel: 500, salt: 0 }); j.x = v.x; j.y = v.y;
    const p0 = J.punts; actualitzaRampes(.016);
    return (v.salt > 0 && J.punts - p0 === 1000) || 'salt ' + v.salt + ', punts +' + (J.punts - p0);
  });
  prova('Agafar un paquet amagat suma 500 i queda guardat', () => {
    localStorage.removeItem('ensurts-paquets'); J.paquetsFets = null; baixaVila();
    const p = llistaPaquets()[3], j = J.jug; j.x = p.x; j.y = p.y; const p0 = J.punts; actualitzaPaquets();
    return (J.punts - p0 === 500 && paquetsTrobats().has(p.id) && llistaPaquets().length === NPAQUETS) || 'punts +' + (J.punts - p0);
  });
  prova("La ràdio canvia d'emissora i torna a començar", () => { J.radio = 0; for (let i = 0; i < EMISSORES.length; i++) canviaRadio(); return J.radio === 0 || 'ràdio ' + J.radio; });
  prova('De nit és fosc i de dia no', () => { J.hora = 23; const n = nitFactor(); J.hora = 12; return (n === 1 && nitFactor() === 0) || 'nit ' + n; });
  J.cobrat = true; tornaAlMenu();

  // --- Mode història ---
  prova("Mode història: la primera missió és enformigonar el salt de l'Eloi Mena", () => {
    localStorage.removeItem('ensurts-historia'); modeJoc = 'historia';
    comenca(PERSONATGES[0]);
    if (J.temps !== Infinity || !J.historia) return 'no és mode història';
    const e = J.elois.find(e => e.nom === 'bassa'), sc = J.sacs.find(s => s.eloi === e), j = J.jug;
    j.x = sc.x; j.y = sc.y; actualitzaElois(.05); if (!j.ciment) return 'no has agafat el ciment';
    j.x = e.L.x - e.sp.dx * 30; j.y = e.L.y - e.sp.dy * 30; accioPropera().fer(); if (!e.formigo) return 'no hi ha formigó';
    e.estat = 'prepara'; e.t = 0; for (let i = 0; i < 40 && !J.eloiFet; i++) actualitzaElois(.05);
    if (e.estat !== 'estampat') return "l'Eloi no s'ha estampat (" + e.estat + ')';
    actualitzaHistoria(.016); return (J.historia.i === 1 && progresHistoria.get() === 1) || 'missió ' + J.historia.i;
  });
  prova('La segona missió és agafar la pistola', () => { J.jug.pistola = { bales: 30 }; preparaMissio(); actualitzaHistoria(.016); return J.historia.i === 2 || 'missió ' + J.historia.i; });
  prova('Les missions de comptar (5 parelles) només compten des que comencen', () => {
    preparaMissio(); const H = J.historia; J.espantades += 4; actualitzaHistoria(.016);
    if (H.i !== 2) return 'massa aviat';
    J.espantades += 1; actualitzaHistoria(.016);
    return H.i === 3 || 'missió ' + H.i;
  });
  J.cobrat = true; tornaAlMenu(); modeJoc = modeAbans;

  // Tot com estava
  neteja(); for (const [k, v] of Object.entries(guardat)) if (v !== null) localStorage.setItem(k, v);
  pintaBotiga();

  const ok = resultats.filter(r => r[1]).length;
  console.log('PROVES: ' + ok + '/' + resultats.length + ' correctes');
  resultats.forEach(([nom, b, msg]) => console[b ? 'log' : 'error']((b ? 'OK   ' : 'FALLA') + ' ' + nom + (msg ? ' — ' + msg : '')));
  const caixa = document.createElement('div');
  caixa.id = 'resultatsProves';
  caixa.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:50;background:#111;color:#fff;border:3px solid #2fd38a;padding:12px;font:10px monospace;max-width:520px;max-height:60vh;overflow:auto';
  caixa.innerHTML = '<b>PROVES: ' + ok + '/' + resultats.length + '</b><br>' + resultats.map(([nom, b, msg]) => (b ? '✔ ' : '✘ ') + nom + (msg ? ' — ' + msg : '')).join('<br>');
  document.body.appendChild(caixa);
  window.resultatsProves = { ok, total: resultats.length, resultats };
  return window.resultatsProves;
}
