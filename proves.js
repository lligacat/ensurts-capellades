// Proves automàtiques del joc. Obre la pàgina amb ?proves al final de l'adreça i els resultats surten a la pantalla i a la consola.
// Fan servir les funcions i l'estat globals del joc, i deixen el moneder i la botiga tal com estaven.

const CLAUS = ['ensurts-moneder', 'ensurts-skins', 'ensurts-explosions', 'ensurts-missions'];

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
  prova("Si en Guillem t'encasta, perds una vida", () => {
    j.cotxe = Object.assign(nouBestia(), { x: j.x, y: j.y, estat: 'conduit' }); J.bestia = j.cotxe;
    const vides = J.vides; J.guillem = { x: j.x + 10, y: j.y, vx: 0, vy: 0, t: 1, ang: 0 }; j.invul = 0;
    actualitzaCarretera(.016);
    return J.vides === vides - 1 || 'vides ' + vides + ' -> ' + J.vides;
  });
  prova('Les autoestopistes et porten a Vic i paguen 2.500 punts', () => {
    J.vides = 3; J.ciutat = 'capellades'; activaCiutat('capellades'); J.zona = null;
    const v = Object.assign(nouBestia(), { x: VIC_SORTIDA.x, y: VIC_SORTIDA.y, estat: 'conduit' }); j.cotxe = v; J.bestia = v; j.x = v.x; j.y = v.y;
    J.autostop = { x: v.x, y: v.y, estat: 'dins' }; const abans = J.punts;
    actualitzaCarretera(.016);
    return (J.ciutat === 'vic' && J.autostopOk && J.punts - abans === 2500) || 'ciutat ' + J.ciutat + ', punts +' + (J.punts - abans);
  });
  J.cobrat = true; tornaAlMenu();

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
