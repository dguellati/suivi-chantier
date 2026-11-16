/* =========================================================
   Constantes
   ========================================================= */
const ETAPES = [
  {id:'tracage',     nom:'Traçage',           court:'Traçage',     couleur:'#2563eb'},
  {id:'equerres',    nom:'Pose des équerres', court:'Équerres',    couleur:'#facc15', texte:'#111'},
  {id:'ldv',         nom:'Pose LDV',          court:'LDV',         couleur:'#db2777'},
  {id:'parepluie',   nom:'Pose pare-pluie',   court:'Pare-pluie',  couleur:'#16a34a'},
  {id:'ossature',    nom:'Pose ossature',     court:'Ossature',    couleur:'#f97316'},
  {id:'bardage',     nom:'Pose bardage',      court:'Bardage',     couleur:'#374151'},
  {id:'ebrasements', nom:'Pose ébrasements',  court:'Ébrasements', couleur:'#ef1c1c', mode:'ouvertures'},
];
/* Les ébrasements ne se dessinent pas : on coche les fenêtres et les portes placées par le bureau */
const estOuv = e => e && e.mode==='ouvertures';
const TYPES_OUV = {F:{l:'Fenêtre', i:'🪟'}, P:{l:'Porte', i:'🚪'}};
const ETAPE = Object.fromEntries(ETAPES.map(e=>[e.id,e]));
/* Couleurs proposées pour les étapes ajoutées par le bureau (différentes des 7 étapes et des annotations) */
const COULEURS_EXTRA = [
  {c:'#06b6d4',n:'Turquoise'},{c:'#84cc16',n:'Vert pomme',t:'#111'},{c:'#1e3a8a',n:'Bleu marine'},{c:'#0f766e',n:'Vert canard'},
  {c:'#f9a8d4',n:'Rose pâle',t:'#111'},{c:'#d6b88a',n:'Sable',t:'#111'},{c:'#9ca3af',n:'Gris clair',t:'#111'},{c:'#9f1239',n:'Bordeaux'}];
/* Palette des annotations : 6 couleurs sur une ligne */
const ANNOT_COULEURS = [['#111827','Noir'],['#e11d1d','Rouge'],['#1d4ed8','Bleu'],['#15a34a','Vert'],['#facc15','Jaune'],['#ffffff','Blanc']];
/* Menu Forme : rectangle, ellipse, triangle (contour ou rempli) */
const FORMES = [['rect','Rectangle'],['cercle','Ellipse'],['triangle','Triangle']];
const MAIL_COMMANDES = (window.CONFIG&&window.CONFIG.MAIL_COMMANDES) || 'derouach@ader-bardage.fr';
const STATUTS = {
  present:{l:'Présent',i:'✔'}, maladie:{l:'Maladie',i:'🤒'}, conge:{l:'Congé',i:'🏖️'},
  intemperies:{l:'Intempéries',i:'🌧️'}, autre:{l:'Autre',i:'❓'}
};
const PERIODES = {J:'Journée', M:'Matin', A:'Après-midi'};
const JOURS = {J:1, M:.5, A:.5};

/* =========================================================
   Utilitaires
   ========================================================= */
const $ = s => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2,'0');
const ymd = d => d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const today = () => ymd(new Date());
const addDays = (s,n) => { const d = new Date(s+'T12:00:00'); d.setDate(d.getDate()+n); return ymd(d); };
const dow = s => new Date(s+'T12:00:00').getDay();
const fmtLong = s => new Date(s+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const fmtShort = s => new Date(s+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'2-digit'});
const fmtHeure = t => new Date(t).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const num = (v,d=1) => v.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const groupBy = (l,f) => l.reduce((o,x)=>{ (o[f(x)]=o[f(x)]||[]).push(x); return o; },{});
function mondayOf(s){ const d = dow(s); return addDays(s, d===0 ? -6 : 1-d); }

/* Petit « ✔ » discret d'une seconde (chef) */
function toastMini(){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t=document.createElement('div'); t.className='toast mini'; t.textContent='✔'; t.setAttribute('role','status'); t.setAttribute('aria-label','Enregistré');
  document.body.appendChild(t); setTimeout(()=>t.remove(), 1000);
}
/* Message d'aide montré une seule fois par appareil */
function aideUneFois(cle, msg){ if(ls.get('aide-'+cle)) return; ls.set('aide-'+cle,'1'); toast(msg); }
function toast(msg, kind=''){
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t = document.createElement('div'); t.className = 'toast '+kind; t.textContent = msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), kind==='warn'?4500:2600);
}
function openSheet(html){
  closeSheet();
  const ov = document.createElement('div'); ov.className='ov'; ov.id='ov';
  ov.innerHTML = `<div class="sheet">${html}</div>`;
  ov.addEventListener('click', e => { if(e.target===ov) closeSheet(); });
  document.body.appendChild(ov);
}
function closeSheet(){ const o = $('#ov'); if(o) o.remove(); }
/* Confirmation et saisie dans la page (les fenêtres confirm/prompt du navigateur sont bloquées une fois publiée) */
let _ask=null;
function askConfirm(msg, fn, ok='Supprimer'){
  _ask=fn;
  openSheet(`<h2>${esc(msg)}</h2><div class="row" style="margin-top:14px"><button class="btn bad" onclick="const f=_ask;closeSheet();f&&f()">${ok}</button><button class="btn sec" onclick="closeSheet()">Annuler</button></div>`);
}
/* Petite bulle « Supprimer » à l'endroit touché ; toucher ailleurs la ferme */
let _dernierToucher=[innerWidth/2, innerHeight/2];
document.addEventListener('pointerup', e=>{ _dernierToucher=[e.clientX, e.clientY]; }, true);
document.addEventListener('pointerdown', e=>{ const b=$('#bulle'); if(b && !b.contains(e.target)) b.remove(); }, true);
function bulleSupprimer(fn){
  $('#bulle')?.remove();
  const b=document.createElement('div'); b.id='bulle'; b.className='bulle';
  const [x,y]=_dernierToucher;
  b.style.left=Math.min(Math.max(x,60),innerWidth-60)+'px'; b.style.top=Math.max(y,70)+'px';
  b.innerHTML='<button>Supprimer</button>';
  b.firstChild.onclick=()=>{ b.remove(); fn(); };
  document.body.appendChild(b);
}
function askText(titre, val, fn, attrs='', ok='Enregistrer'){
  _ask=fn;
  openSheet(`<h2>${esc(titre)}</h2><input type="text" id="askIn" value="${esc(val)}" ${attrs} style="width:100%;font-size:18px">
    <div class="row" style="margin-top:14px"><button class="btn" onclick="const v=$('#askIn').value,f=_ask;closeSheet();f&&f(v)">${ok}</button><button class="btn sec" onclick="closeSheet()">Annuler</button></div>`);
  setTimeout(()=>$('#askIn')?.focus(),50);
}

/* =========================================================
   Stockage (IndexedDB, repli en mémoire)
   ========================================================= */
const DB = {
  db:null, mem:{},
  open(){ return new Promise(res=>{ try{
      const r = indexedDB.open('suivi-chantier', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('kv'); r.result.createObjectStore('images'); };
      r.onsuccess = () => { DB.db = r.result; res(true); };
      r.onerror = () => res(false);
    }catch(e){ res(false); } }); },
  get(st,k){ if(!DB.db) return Promise.resolve(DB.mem[st+'/'+k]);
    return new Promise(res=>{ try{ const q = DB.db.transaction(st).objectStore(st).get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>res(undefined);}catch(e){res(undefined)} }); },
  put(st,k,v){ if(!DB.db){ DB.mem[st+'/'+k]=v; return Promise.resolve(); }
    return new Promise(res=>{ try{ const tx = DB.db.transaction(st,'readwrite'); tx.objectStore(st).put(v,k); tx.oncomplete=()=>res(); tx.onerror=()=>res(); }catch(e){res()} }); },
  del(st,k){ if(!DB.db){ delete DB.mem[st+'/'+k]; return Promise.resolve(); }
    return new Promise(res=>{ try{ const tx = DB.db.transaction(st,'readwrite'); tx.objectStore(st).delete(k); tx.oncomplete=()=>res(); tx.onerror=()=>res(); }catch(e){res()} }); },
};
const EMPTY = () => ({chantiers:[], plans:[], salaries:[], dessins:[], pointages:[], conges:[], chefs:[], bureauPin:null, equipes:[], equipesInit:[], annotations:[], photos:[], commandes:[], zones:[], ouvertures:[]});
let S = EMPTY();
let saveTimer = null;
function save(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async()=>{
    if(SY.sb) suivreChangements();
    await DB.put('kv','state', JSON.parse(JSON.stringify(S)));
    await sauverSync(); synchroniser();
  }, 150);
}
/* Images : plans (clé = id du plan), photos (ph_<id>) et vignettes (th_<id>).
   Gardées sur l'appareil et envoyées dans le stockage en ligne « fichiers ». */
const imgCache = {};
async function imageURL(key){
  if(imgCache[key]) return imgCache[key];
  let b = await DB.get('images', key);
  if(!b && SY.sb && connecte() && navigator.onLine){
    try{ const {data,error}=await SY.sb.storage.from('fichiers').download(key); if(!error && data){ b=data; await DB.put('images', key, b); } }catch(e){ console.warn(e); }
  }
  if(!b) return null;
  return imgCache[key] = URL.createObjectURL(b);
}
async function putImage(key, blob){ await DB.put('images', key, blob); if(SY.sb){ SY.files.push({op:'up', key}); sauverSync(); } }
function delImage(key){ DB.del('images', key); delete imgCache[key]; if(SY.sb){ SY.files=SY.files.filter(f=>f.key!==key); SY.files.push({op:'del', key}); sauverSync(); } }

/* =========================================================
   Synchronisation avec la base en ligne (Supabase)
   Chaque élément (chantier, dessin, pointage…) est une ligne de la table « records ».
   Les modifications partent dès qu'il y a du réseau ; sans réseau, elles attendent dans la file.
   ========================================================= */
const CFG = window.CONFIG || {};
const COLLECTIONS = ['chantiers','plans','salaries','dessins','pointages','conges','chefs','equipes','annotations','photos','commandes','zones','ouvertures'];
const SY = { sb:null, session:null, shadow:{}, outbox:{}, files:[], lastPull:'1970-01-01T00:00:00.000Z', busy:false, etat:'local', erreur:'' };
const recId = (kind,id) => kind+':'+id;
function itemsDe(){
  const m={};
  for(const k of COLLECTIONS) for(const x of (S[k]||[])) m[recId(k,x.id)]={kind:k, data:x};
  m['config:config']={kind:'config', data:{id:'config', bureauPin:S.bureauPin||null, equipesInit:S.equipesInit||[]}};
  return m;
}
function suivreChangements(){
  const cur=itemsDe();
  for(const [id,{kind,data}] of Object.entries(cur)){ const j=JSON.stringify(data); if(SY.shadow[id]!==j){ SY.shadow[id]=j; SY.outbox[id]={id, kind, data:JSON.parse(j), deleted:false}; } }
  for(const id of Object.keys(SY.shadow)) if(!cur[id]){ delete SY.shadow[id]; SY.outbox[id]={id, kind:id.split(':')[0], data:{}, deleted:true}; }
}
function sauverSync(){ return DB.put('kv','sync',{outbox:SY.outbox, files:SY.files, lastPull:SY.lastPull}); }
function appliquer(r){
  if(r.kind==='config'){ if(!r.deleted){ S.bureauPin=r.data.bureauPin||null; S.equipesInit=r.data.equipesInit||[]; } SY.shadow[r.id]=JSON.stringify(itemsDe()['config:config'].data); return; }
  if(!COLLECTIONS.includes(r.kind)) return;
  const itemId=r.id.slice(r.kind.length+1), arr=S[r.kind]=S[r.kind]||[], i=arr.findIndex(x=>x.id===itemId);
  if(r.deleted){ if(i>=0) arr.splice(i,1); delete SY.shadow[r.id]; }
  else { if(i>=0) arr[i]=r.data; else arr.push(r.data); SY.shadow[r.id]=JSON.stringify(r.data); }
}
async function pousser(){
  const items=Object.values(SY.outbox);
  for(let i=0;i<items.length;i+=200){
    const lot=items.slice(i,i+200);
    const {error}=await SY.sb.from('records').upsert(lot.map(r=>({id:r.id, kind:r.kind, data:r.data, deleted:r.deleted})));
    if(error) throw error;
    lot.forEach(r=>{ if(SY.outbox[r.id]===r) delete SY.outbox[r.id]; });
  }
}
async function tirer(){
  /* On relit 10 s en arrière pour ne rien manquer ; une ligne en attente d'envoi sur cet appareil garde la version locale */
  let depuis=new Date(new Date(SY.lastPull).getTime()-10000).toISOString(), change=false, dernier=SY.lastPull;
  for(let tour=0; tour<50; tour++){
    const {data,error}=await SY.sb.from('records').select('id,kind,data,deleted,updated_at').gt('updated_at',depuis).order('updated_at').limit(1000);
    if(error) throw error;
    if(!data.length) break;
    for(const r of data){ if(SY.outbox[r.id]) continue; const avant=SY.shadow[r.id]; appliquer(r); if(SY.shadow[r.id]!==avant) change=true; }
    depuis=dernier=data[data.length-1].updated_at;
    if(data.length<1000) break;
  }
  if(dernier>SY.lastPull) SY.lastPull=dernier;
  return change;
}
async function envoyerFichiers(){
  while(SY.files.length){
    const f=SY.files[0];
    if(f.op==='up'){ const b=await DB.get('images', f.key); if(b){ const {error}=await SY.sb.storage.from('fichiers').upload(f.key, b, {upsert:true, contentType:b.type||'image/png'}); if(error) throw error; } }
    else await SY.sb.storage.from('fichiers').remove([f.key]);
    SY.files.shift(); await sauverSync();
  }
}
async function synchroniser(){
  if(!SY.sb || !connecte() || SY.busy){ majEtat(); return; }
  if(!navigator.onLine){ SY.etat='horsligne'; majEtat(); return; }
  SY.busy=true; SY.etat='sync'; majEtat();
  try{
    await envoyerFichiers(); await pousser(); const change=await tirer();
    SY.etat='ok'; SY.erreur='';
    await DB.put('kv','state', JSON.parse(JSON.stringify(S))); await sauverSync();
    if(change) rafraichirVue();
  }catch(e){ console.warn(e); SY.etat='erreur'; SY.erreur=e.message||String(e); }
  SY.busy=false; majEtat();
}
/* Après une synchro qui apporte du nouveau : on redessine sans casser un dessin en cours */
function rafraichirVue(){
  if(U.viewer && (U.screen==='chefChantier' || (U.screen==='bureau' && U.btab==='avancement'))){ refreshLayers(); renderStepbar(); if(U.screen==='bureau') renderAvSide(); updateBanner(); return; }
  const tape=document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if(!$('#ov') && !$('#lb') && !$('#mov') && !tape) render();
}
function enAttente(){ return Object.keys(SY.outbox).length + SY.files.length; }
function libEtat(){
  if(!SY.sb) return '';
  const n=enAttente();
  if(SY.etat==='sync') return '⏳ Envoi…';
  if(SY.etat==='horsligne' || !navigator.onLine) return `📴 Hors ligne${n?` · ${n} en attente`:''}`;
  if(SY.etat==='erreur') return '⚠️ Synchro en erreur';
  return n ? `⏳ ${n} en attente` : '☁️ À jour';
}
function majEtat(){ const el=$('#sy'); if(el) el.textContent=libEtat(); }
/* Mode test : pas d'écran de connexion (la base doit être ouverte avec supabase/test-ouvrir.sql) */
function connecte(){ return !!(SY.session || CFG.TEST_SANS_CONNEXION); }
async function demarrerSync(){
  if(!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || !window.supabase) return;
  SY.sb=window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {auth:{persistSession:true, autoRefreshToken:true}});
  const sv=await DB.get('kv','sync'); if(sv){ SY.outbox=sv.outbox||{}; SY.files=sv.files||[]; SY.lastPull=sv.lastPull||SY.lastPull; }
  for(const [id,{data}] of Object.entries(itemsDe())) if(!SY.outbox[id]) SY.shadow[id]=JSON.stringify(data);
  try{ const {data}=await SY.sb.auth.getSession(); SY.session=data.session; }catch(e){ console.warn(e); }
  SY.sb.auth.onAuthStateChange((_e,s)=>{ SY.session=s; });
  setInterval(synchroniser, 20000);
  window.addEventListener('online', synchroniser);
  window.addEventListener('offline', ()=>{ SY.etat='horsligne'; majEtat(); });
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') synchroniser(); });
}
/* ---------- Connexion de l'appareil au compte de l'entreprise ---------- */
function vAppareil(){
  return `<header class="top"><div class="ttl"><b>🏗️ Suivi Chantier</b><small>Connexion de l'appareil</small></div></header>
  <div class="scroll"><div class="wrap" style="max-width:440px">
    <div class="card"><h3>Connecter ce téléphone ou ce PC</h3>
      <p class="hint" style="margin-top:0">À faire une seule fois par appareil, avec le compte de l'entreprise. Ensuite, chaque chef se connecte avec son nom et son code.</p>
      <form onsubmit="event.preventDefault();connecterAppareil()">
        <label class="f">Adresse e-mail du compte<input type="email" id="apMail" autocomplete="username" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;font-size:17px"></label>
        <label class="f" style="margin-top:10px">Mot de passe<input type="password" id="apMdp" autocomplete="current-password" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px;font-size:17px"></label>
        <button class="btn xl" type="submit" id="apBtn">Connecter l'appareil</button>
      </form>
      <p class="hint" id="apErr" style="color:var(--bad)"></p></div>
  </div></div>`;
}
async function connecterAppareil(){
  const mail=$('#apMail').value.trim(), mdp=$('#apMdp').value, btn=$('#apBtn'), err=$('#apErr');
  if(!mail||!mdp){ err.textContent='Indiquez l\'adresse e-mail et le mot de passe.'; return; }
  if(!navigator.onLine){ err.textContent='Pas de réseau : la première connexion demande internet.'; return; }
  btn.disabled=true; btn.textContent='Connexion…'; err.textContent='';
  let data, error;
  try{ ({data,error}=await SY.sb.auth.signInWithPassword({email:mail.toLowerCase(), password:mdp})); }catch(e){ error=e; }
  if(error){ btn.disabled=false; btn.textContent='Connecter l\'appareil';
    const m=String(error.message||error);
    err.textContent = /invalid login/i.test(m) ? 'Connexion refusée : adresse ou mot de passe incorrect.'
      : /not confirmed/i.test(m) ? 'Compte pas encore confirmé : dans Supabase, confirmez l\'utilisateur (Auto Confirm).'
      : /fetch|network|load failed/i.test(m) ? 'La base en ligne ne répond pas depuis cette page (accès bloqué ou pas de réseau).'
      : 'Connexion refusée : '+m;
    return; }
  SY.session=data.session;
  await premiereSynchro();
  go('home');
}
/* Première connexion : si la base en ligne a déjà des données, l'appareil les reprend ;
   si elle est vide et que l'appareil a des données, on propose de les envoyer. */
async function premiereSynchro(){
  try{
    const {count,error}=await SY.sb.from('records').select('id',{count:'exact', head:true}).eq('deleted',false);
    if(error) throw error;
    const local=COLLECTIONS.some(k=>(S[k]||[]).length);
    if(count>0){
      S=EMPTY(); SY.shadow={}; SY.outbox={}; SY.files=[]; SY.lastPull='1970-01-01T00:00:00.000Z';
      await DB.put('kv','state', S); await sauverSync(); await synchroniser(); render(); toast('✔ Données de l\'entreprise chargées');
    } else if(local){
      askConfirm('La base en ligne est vide. Envoyer les données de cet appareil (chantiers, plans, photos, pointages…) pour les partager ?', envoyerTout, 'Envoyer');
    } else synchroniser();
  }catch(e){ console.warn(e); toast('Synchro impossible pour l\'instant : '+(e.message||e),'warn'); }
}
function envoyerTout(){
  SY.shadow={}; suivreChangements();
  S.plans.forEach(p=>SY.files.push({op:'up', key:p.id}));
  S.photos.forEach(p=>{ SY.files.push({op:'up', key:'ph_'+p.id}); SY.files.push({op:'up', key:'th_'+p.id}); });
  sauverSync().then(synchroniser); toast('Envoi des données en cours…');
}
async function deconnecterAppareil(){
  askConfirm('Déconnecter cet appareil du compte de l\'entreprise ? Les données non envoyées resteront sur l\'appareil.', async()=>{ await SY.sb.auth.signOut(); SY.session=null; U.bureauOK=false; go('home'); }, 'Déconnecter');
}
function hydrate(){ document.querySelectorAll('img[data-k]').forEach(async im=>{ const u=await imageURL(im.dataset.k); if(u) im.src=u; im.removeAttribute('data-k'); }); }
const ls = { get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }, set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} } };

/* =========================================================
   Étapes par chantier
   ========================================================= */
const defEtapes = () => ETAPES.map(e=>({...e}));
const chOf = id => S.chantiers.find(c=>c.id===id);
function etapesTout(chId){ const c=chOf(chId); return c?.etapes?.length ? c.etapes : ETAPES; }
function etapesVis(chId){ return etapesTout(chId).filter(e=>!e.masque); }
function etp(chId,id){ return etapesTout(chId).find(e=>e.id===id) || ETAPE[id] || {id, nom:'Étape supprimée', court:'?', couleur:'#999999'}; }
/* Étapes à montrer dans les tableaux : celles affichées + les masquées qui ont déjà des dessins sur ce plan */
function etapesAffichees(plan){ const used=new Set(S.dessins.filter(d=>d.planId===plan.id).map(d=>d.etape)); return etapesTout(plan.chantierId).filter(e=>!e.masque||used.has(e.id)); }

/* =========================================================
   Géométrie
   ========================================================= */
function ringArea(r){ let a=0; for(let i=0;i<r.length;i++){ const p=r[i], q=r[(i+1)%r.length]; a += p[0]*q[1]-q[0]*p[1]; } return Math.abs(a)/2; }
function multiArea(m){ let a=0; for(const poly of m) poly.forEach((r,i)=>{ a += i===0 ? ringArea(r) : -ringArea(r); }); return a; }
const PC = () => window.polygonClipping;
const isMulti = g => Array.isArray(g[0][0][0]);
const flat = list => list.flatMap(g => isMulti(g) ? g : [g]);
function toPoly(pts){ const r = pts.map(p=>[p[0],p[1]]); r.push([pts[0][0],pts[0][1]]); return [r]; }
function unionM(list){
  list = list.filter(g => g && g.length);
  if(!list.length) return [];
  if(!PC()) return flat(list);
  try{ return PC().union(...list); }catch(e){ console.warn(e); return flat(list); }
}
function diffM(a,b){
  if(!a.length) return []; if(!b.length || !PC()) return a;
  try{ return PC().difference(a,b); }catch(e){ console.warn(e); return a; }
}
const unionDessins = ds => unionM(ds.filter(d=>d.points.length>=3).map(d=>toPoly(d.points)));
function pathD(m){ return m.map(poly=>poly.map(r=>'M'+r.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z').join('')).join(''); }
function inPoly(pt, pts){
  let c=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const [xi,yi]=pts[i],[xj,yj]=pts[j];
    if(((yi>pt[1])!==(yj>pt[1])) && pt[0] < (xj-xi)*(pt[1]-yi)/(yj-yi)+xi) c=!c;
  } return c;
}
function distSeg(p,a,b){ const vx=b[0]-a[0], vy=b[1]-a[1], L=vx*vx+vy*vy; const t=L?clamp(((p[0]-a[0])*vx+(p[1]-a[1])*vy)/L,0,1):0; return Math.hypot(a[0]+t*vx-p[0], a[1]+t*vy-p[1]); }
function distLigne(p,pts){ let d=Infinity; for(let i=1;i<pts.length;i++) d=Math.min(d,distSeg(p,pts[i-1],pts[i])); return pts.length===1?Math.hypot(p[0]-pts[0][0],p[1]-pts[0][1]):d; }
const rectPts = (a,b) => [[a[0],a[1]],[b[0],a[1]],[b[0],b[1]],[a[0],b[1]]];

function interM(a,b){ if(!a.length||!b.length||!PC()) return []; try{ return PC().intersection(a,b); }catch(e){ console.warn(e); return []; } }
const m2f = v => (v||0).toLocaleString('fr-FR',{maximumFractionDigits:1})+' m²';
const zonesDe = plan => S.zones.filter(z=>z.planId===plan.id);
/* Forme réelle d'une zone : son contour moins les parties déduites (fenêtres, portes…) */
function zoneGeom(z){
  const ext=[toPoly(z.points)], tr=(z.trous||[]).filter(t=>t.length>=3);
  return tr.length ? diffM(ext, unionM(tr.map(toPoly))) : ext;
}
const unionZones = plan => unionM(zonesDe(plan).map(zoneGeom));
/* Échelle du plan : mètres par pixel du plan, à partir d'une cote connue */
const mpp = plan => { const e=plan?.echelle; if(!e) return 0; const d=Math.hypot(e.b[0]-e.a[0], e.b[1]-e.a[1]); return d ? e.m/d : 0; };
const m2Calcule = (z, plan) => { const k=mpp(plan); return k ? +(multiArea(zoneGeom(z))*k*k).toFixed(2) : null; };
/* Avec une échelle, les m² d'une zone se calculent tout seuls (sauf si le bureau les a tapés à la main) */
function majM2(z){ const plan=S.plans.find(p=>p.id===z.planId), v=m2Calcule(z,plan); if(v!=null && z.m2auto!==false){ z.m2=v; z.m2auto=true; } }
/* Tolérance : s'il reste moins de 2 % d'une zone pour une étape, la zone compte comme terminée */
const TOLERANCE_FIN = 0.02;
/* m² faits par étape dans une zone : part de la zone couverte par le dessin × surface réelle saisie par le bureau */
function statsZone(z){
  const ds=S.dessins.filter(d=>d.planId===z.planId), zp=zoneGeom(z), za=multiArea(zp), r={};
  for(const e of etapesTout(z.chantierId)){
    const u=unionDessins(ds.filter(d=>d.etape===e.id));
    let v = za&&u.length ? Math.min(z.m2, multiArea(interM(u,zp))/za*z.m2) : 0;
    if(v>0 && z.m2-v < z.m2*TOLERANCE_FIN) v=z.m2;   // il reste moins de 2 % : la zone est terminée pour cette étape
    r[e.id]=v;
  }
  return r;
}
function statsM2Plan(plan){
  const zs=zonesDe(plan); if(!zs.length) return null;
  const fait={}; for(const z of zs){ const r=statsZone(z); for(const k in r) fait[k]=(fait[k]||0)+r[k]; }
  return {tot:zs.reduce((s,z)=>s+z.m2,0), fait, zones:zs};
}
/* Avancement de chaque étape : en m² si le bureau a tracé des zones de travail,
   sinon en % de toute la surface dessinée sur le plan (toutes étapes confondues = 100 %) */
function statsPlan(plan){
  const st=statsPlanSurfaces(plan), so=statsOuv(ouvDe(plan)), base=st.pct;
  st.ouv=so;
  st.pct = id => estOuv(etp(plan.chantierId,id)) ? (so.tot ? so.faites/so.tot*100 : 0) : base(id);
  if(!st.ref && so.tot) st.ref=1;
  return st;
}
function statsPlanSurfaces(plan){
  const m2=statsM2Plan(plan);
  if(m2) return {m2, ref:m2.tot, pct:id=>m2.tot?clamp((m2.fait[id]||0)/m2.tot*100,0,100):0};
  const ds = S.dessins.filter(d=>d.planId===plan.id);
  const parEtape = {};
  for(const e of etapesTout(plan.chantierId)) parEtape[e.id] = multiArea(unionDessins(ds.filter(d=>d.etape===e.id)));
  const ref = multiArea(unionDessins(ds));
  const pct = id => ref ? clamp((parEtape[id]||0)/ref*100, 0, 100) : 0;
  return {m2:null, parEtape, ref, pct};
}
const fmtPct = v => v==null ? '—' : num(v,0)+' %';
/* Libellé court d'avancement : « 30 / 40 m² » avec des zones, sinon « 75 % » */
const libAv = (st,e) => estOuv(e) ? libStatsOuv(st.ouv) : st.m2 ? `${num(st.m2.fait[e.id]||0,0)} / ${num(st.m2.tot,0)} m²` : fmtPct(st.pct(e.id));

/* Couches SVG selon la vue */
function buildLayers(plan, vue){
  const ds = S.dessins.filter(d=>d.planId===plan.id && !enEdition.has(d.id));
  const E = etapesTout(plan.chantierId), col = id => etp(plan.chantierId,id).couleur;
  let h = '';
  const path = (m, c, op) => m.length ? `<path d="${pathD(m)}" fill="${c}" fill-opacity="${op}" fill-rule="evenodd" stroke="${c}" stroke-width="2" vector-effect="non-scaling-stroke"/>` : '';
  if(vue.type==='avancement'){
    const Un = E.map(e=>unionDessins(ds.filter(d=>d.etape===e.id)));
    const vis = []; let acc = [];
    for(let k=E.length-1;k>=0;k--){
      vis[k] = acc.length ? diffM(Un[k], acc) : Un[k];
      if(Un[k].length) acc = acc.length ? unionM([acc, Un[k]]) : Un[k];
    }
    E.forEach((e,k)=>{ h += path(vis[k], e.couleur, .5); });
  } else if(vue.type==='etape'){
    const Un = unionDessins(ds.filter(d=>d.etape===vue.etape));
    const reste = diffM(zonesDe(plan).length ? unionZones(plan) : unionDessins(ds), Un);
    if(reste.length) h += `<path d="${pathD(reste)}" fill="url(#hatch)" fill-rule="evenodd" stroke="#b91c1c" stroke-width="1.5" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
    h += path(Un, col(vue.etape), .55);
  } else if(vue.type==='jour'){
    ds.filter(d=>d.date===vue.date).forEach(d=>{ h += path([toPoly(d.points)], col(d.etape), .45); });
  } else {
    ds.forEach(d=>{ h += path([toPoly(d.points)], col(d.etape), .22); });
  }
  return h;
}
/* Annotations (stylo, flèche, texte) : traits sans remplissage, jamais comptés dans l'avancement */
const tailleTexte = plan => Math.max(plan.w,plan.h)/75;
/* Zones de travail tracées par le bureau : contour en pointillés + nom et surface */
function zonesSVG(plan){
  const T=tailleTexte(plan)*.8;
  const lp=P=>'M'+P.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L')+'Z';
  return zonesDe(plan).filter(z=>!enEdition.has(z.id)).map(z=>{
    const xs=z.points.map(p=>p[0]), ys=z.points.map(p=>p[1]), x=Math.min(...xs)+T*.3, y=Math.min(...ys)+T*1.15;
    const c=z.couleur||'#1d4ed8', ct=c==='#ffffff'?'#111827':c;
    /* Bureau : zone bien colorée ; chef : fond léger pour garder les couleurs des étapes lisibles */
    return `<path d="${pathD(zoneGeom(z))}" fill="${c}" fill-opacity="${enBureau()?.45:.06}" fill-rule="evenodd" stroke="none"/>
      <path d="${lp(z.points)}" fill="none" stroke="${ct}" stroke-width="2.5" ${enBureau()?'':'stroke-dasharray="10 6"'} vector-effect="non-scaling-stroke"/>
      ${(z.trous||[]).map(t=>`<path d="${lp(t)}" fill="url(#hatch)" stroke="#dc2626" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`).join('')}
      <text x="${x}" y="${y}" font-size="${T}" font-weight="700" font-family="system-ui,sans-serif" fill="${ct}" stroke="#fff" stroke-width="${T/6}" paint-order="stroke">${esc(z.nom)} · ${z.m2?m2f(z.m2):'m² ?'}</text>`;
  }).join('');
}
/* Ouvertures (fenêtres F1, F2… et portes P1, P2…) placées par le bureau, cochées par le chef pour les ébrasements */
const ouvDe = plan => S.ouvertures.filter(o=>o.planId===plan.id);
/* Rayon d'une pastille : au moins 15 px à l'écran pour être touchée facilement au doigt */
const tailleOuv = plan => Math.max(Math.max(plan.w,plan.h)/95, 15/(U.viewer?.s||1));
const libOuv = o => `${TYPES_OUV[o.type].i} ${o.type}${o.num}`;
/* Pendant le tracé des rectangles, les pastilles s'effacent pour ne pas cacher le plan */
function renderOuv(){
  const plan=curPlan(); if(!U.viewer || !plan) return;
  U.viewer.ouvG.innerHTML=ouverturesSVG(plan);
  U.viewer.ouvG.setAttribute('opacity', ['etape','zone','trou','echelle','modif'].includes(U.outil) ? '.25' : '1');
}
function ouverturesSVG(plan){
  const R=tailleOuv(plan);
  return ouvDe(plan).map(o=>{
    const fond=o.fait?'#16a34a':'#ffffff', txt=o.fait?'#ffffff':'#111827', bord=o.fait?'#14532d':'#111827';
    return `<g transform="translate(${o.x},${o.y})"><circle r="${R}" fill="${fond}" stroke="${bord}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
      <text text-anchor="middle" dy="${R*.36}" font-size="${R*(o.fait?1:.95)}" font-weight="800" font-family="system-ui,sans-serif" fill="${txt}">${o.fait?'✔':o.type+o.num}</text>
      ${o.fait?`<text text-anchor="middle" y="${R*2.05}" font-size="${R*.75}" font-weight="700" font-family="system-ui,sans-serif" fill="#14532d" stroke="#fff" stroke-width="${R/6}" paint-order="stroke">${o.type}${o.num}</text>`:''}</g>`;
  }).join('');
}
function hitOuv(plan, pt){
  const tol=tailleOuv(plan)*1.4;
  let best=null, bd=tol;
  for(const o of ouvDe(plan)){ const d=Math.hypot(pt[0]-o.x, pt[1]-o.y); if(d<bd){ bd=d; best=o; } }
  return best;
}
/* Compte des ouvertures faites / à faire, pour un plan ou un chantier */
function statsOuv(liste){
  const r={tot:liste.length, faites:0, F:{tot:0,faites:0}, P:{tot:0,faites:0}};
  for(const o of liste){ r[o.type].tot++; if(o.fait){ r.faites++; r[o.type].faites++; } }
  return r;
}
const libStatsOuv = s => `${s.faites} / ${s.tot} ouvertures`;
function annotSVG(plan){
  if(!U.showNotes) return '';
  return S.annotations.filter(a=>a.planId===plan.id && !enEdition.has(a.id)).map(a=>annotUneSVG(a, plan)).join('');
}
/* Une annotation : trait au stylo (3 épaisseurs), forme (rectangle, ellipse, triangle ; contour ou rempli),
   texte ; les anciennes flèches restent affichées */
function annotUneSVG(a, plan){
  const c=a.couleur, halo = c==='#ffffff' ? '#111827' : '#ffffff', T=tailleTexte(plan), A=Math.max(plan.w,plan.h)/90;
  if(a.type==='texte') return `<text x="${a.points[0][0]}" y="${a.points[0][1]}" font-size="${T}" font-weight="700" font-family="system-ui,sans-serif" fill="${c}" stroke="${halo}" stroke-width="${T/7}" paint-order="stroke">${esc(a.texte)}</text>`;
  if(a.type==='forme') return formeSVG(a, plan);
  let d='M'+a.points.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
  if(a.type==='fleche' && a.points.length===2){
    const [p,q]=a.points, g=Math.atan2(q[1]-p[1],q[0]-p[0]);
    d+=`M${(q[0]-A*Math.cos(g-.45)).toFixed(1)} ${(q[1]-A*Math.sin(g-.45)).toFixed(1)}L${q[0]} ${q[1]}L${(q[0]-A*Math.cos(g+.45)).toFixed(1)} ${(q[1]-A*Math.sin(g+.45)).toFixed(1)}`;
  }
  const w=a.epaisseur||4;
  return `<path d="${d}" fill="none" stroke="${halo}" stroke-opacity=".8" stroke-width="${w+4}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
}
/* Forme à partir de deux coins opposés ; remplie = semi-transparente pour voir le plan dessous */
function formeSVG(a, plan, apercu=false){
  const b=bbox(a.points), c=a.couleur, halo = c==='#ffffff' ? '#111827' : '#ffffff';
  const remp = a.plein ? `fill="${c}" fill-opacity=".35"` : 'fill="none"';
  const trait = s => `stroke="${s}" stroke-width="${s===c?3:7}" ${s===c?'':'stroke-opacity=".7"'} ${apercu?'stroke-dasharray="8 6"':''} stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  const geo = (f,s) => a.forme==='cercle' ? `<ellipse cx="${(b.x0+b.x1)/2}" cy="${(b.y0+b.y1)/2}" rx="${(b.x1-b.x0)/2}" ry="${(b.y1-b.y0)/2}" ${f} ${trait(s)}/>`
    : a.forme==='triangle' ? `<path d="M${(b.x0+b.x1)/2} ${b.y0}L${b.x1} ${b.y1}L${b.x0} ${b.y1}Z" ${f} ${trait(s)}/>`
    : `<rect x="${b.x0}" y="${b.y0}" width="${b.x1-b.x0}" height="${b.y1-b.y0}" ${f} ${trait(s)}/>`;
  return geo('fill="none"', halo) + geo(remp, c);
}
function hitAnnot(plan, a, pt, tol){
  if(a.type==='texte'){ const T=tailleTexte(plan), [x,y]=a.points[0], w=a.texte.length*T*.6; return pt[0]>=x-tol && pt[0]<=x+w+tol && pt[1]>=y-T-tol && pt[1]<=y+tol; }
  if(a.type==='forme'){ const b=bbox(a.points); return pt[0]>=b.x0-tol && pt[0]<=b.x1+tol && pt[1]>=b.y0-tol && pt[1]<=b.y1+tol; }
  return distLigne(pt,a.points) < tol;
}
/* Allège un trait au stylo (algorithme de Douglas-Peucker) : la forme reste la même,
   mais il garde peu de points, faciles à attraper au doigt */
function alleger(P, eps){
  if(P.length<3) return P;
  let dm=0, im=0; const a=P[0], b=P[P.length-1];
  for(let i=1;i<P.length-1;i++){ const d=distSeg(P[i],a,b); if(d>dm){ dm=d; im=i; } }
  if(dm<=eps) return [a,b];
  return alleger(P.slice(0,im+1),eps).slice(0,-1).concat(alleger(P.slice(im),eps));
}
/* Épingles des photos */
const taillePin = plan => Math.max(plan.w,plan.h)/80;
function pinsSVG(plan){
  if(!U.showNotes) return '';
  const R=taillePin(plan);
  return S.photos.filter(p=>p.planId===plan.id && p.x!=null).map(p=>`<g transform="translate(${p.x},${p.y})"><path d="M0 0C${-R} ${-R*1.2} ${-R} ${-R*2.4} 0 ${-R*2.4}C${R} ${-R*2.4} ${R} ${-R*1.2} 0 0Z" fill="#dc2626" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cy="${-R*1.6}" r="${R*.45}" fill="#fff"/></g>`).join('');
}
function hitPin(plan, pt){
  const R=taillePin(plan), tol=Math.max(R*1.3, 22/(U.viewer?.s||1));
  return S.photos.filter(p=>p.planId===plan.id && p.x!=null).sort((a,b)=>b.createdAt-a.createdAt).find(p=>Math.hypot(pt[0]-p.x, pt[1]-(p.y-R*1.4))<tol);
}

/* =========================================================
   Visionneuse de plan (zoom, déplacement, dessin, accroche)
   ========================================================= */
/* Rectangle : 4 coins dont les côtés sont horizontaux / verticaux */
const estRect = P => P.length===4 && P.every((p,i)=>{ const q=P[(i+1)%4]; return Math.abs(p[0]-q[0])<0.01 || Math.abs(p[1]-q[1])<0.01; });
const bbox = P => { const xs=P.map(p=>p[0]), ys=P.map(p=>p[1]); return {x0:Math.min(...xs), y0:Math.min(...ys), x1:Math.max(...xs), y1:Math.max(...ys)}; };
const POIGNEES = {nw:[0,0], n:[.5,0], ne:[1,0], e:[1,.5], se:[1,1], s:[.5,1], sw:[0,1], w:[0,.5]};

class Viewer{
  constructor(host, plan, o={}){
    this.host=host; this.plan=plan; this.o=o;
    this.s=1; this.tx=0; this.ty=0; this.mode='consult'; this.pts=[]; this.color='#000'; this.stroke=null;
    /* Rectangles en cours : rects[i] = 4 coins ; meta[i] = null (nouveau) ou l'élément enregistré qu'on modifie */
    this.rects=[]; this.meta=[]; this.retires=[]; this.sel=null; this.drag=null; this.numeroter=false; this.nouveaux=true;
    this.ptrs=new Map(); this.snapPts=[]; this.snapSegs=[]; this.userMoved=false;
    host.innerHTML = `<div class="vw"><div class="stage" style="width:${plan.w}px;height:${plan.h}px"><img alt="" draggable="false">
      <svg viewBox="0 0 ${plan.w} ${plan.h}" width="${plan.w}" height="${plan.h}">
        <defs><pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#fecaca" fill-opacity=".35"/><line x1="0" y1="0" x2="0" y2="14" stroke="#dc2626" stroke-width="4" stroke-opacity=".55"/></pattern></defs>
        <g class="lay"></g><g class="ouv"></g><g class="drw"></g></svg></div><div class="vw-load">Chargement du plan…</div></div>
      ${o.sansZoom?'':'<div class="zoombar"><button data-z="in" aria-label="Zoomer">+</button><button data-z="out" aria-label="Dézoomer">−</button><button data-z="fit" aria-label="Plan entier">⤢</button></div>'}`;
    this.vw=host.querySelector('.vw'); this.stage=host.querySelector('.stage');
    this.img=host.querySelector('img'); this.lay=host.querySelector('.lay'); this.ouvG=host.querySelector('.ouv'); this.drw=host.querySelector('.drw');
    imageURL(plan.id).then(url=>{ const l=host.querySelector('.vw-load'); if(url){ this.img.src=url; l&&l.remove(); } else if(l) l.textContent='Plan introuvable'; });
    host.querySelector('.zoombar')?.addEventListener('click', e=>{
      const z = e.target.closest('button')?.dataset.z; if(!z) return;
      const r = this.vw.getBoundingClientRect();
      if(z==='fit'){ this.userMoved=false; this.fit(); } else this.zoomAt(r.width/2, r.height/2, z==='in'?1.7:1/1.7);
    });
    const vw=this.vw;
    vw.addEventListener('pointerdown', e=>this.down(e));
    vw.addEventListener('pointermove', e=>this.move(e));
    vw.addEventListener('pointerup', e=>this.up(e));
    vw.addEventListener('pointercancel', e=>this.up(e));
    vw.addEventListener('contextmenu', e=>e.preventDefault());
    vw.addEventListener('wheel', e=>{ e.preventDefault(); const r=vw.getBoundingClientRect(); this.zoomAt(e.clientX-r.left, e.clientY-r.top, Math.exp(-e.deltaY*0.0015)); }, {passive:false});
    this.ro = new ResizeObserver(()=>{ if(!this.userMoved) this.fit(); }); this.ro.observe(vw);
    requestAnimationFrame(()=>this.fit());
  }
  get fitS(){ const r=this.vw.getBoundingClientRect(); return Math.min(r.width/this.plan.w, r.height/this.plan.h)*0.94 || 0.1; }
  fit(){ const r=this.vw.getBoundingClientRect(); if(!r.width) return; this.s=this.fitS; this.tx=(r.width-this.plan.w*this.s)/2; this.ty=(r.height-this.plan.h*this.s)/2; this.apply(); }
  focusOn(x,y){ const r=this.vw.getBoundingClientRect(); this.s=clamp(this.fitS*3, this.fitS, 30); this.tx=r.width/2-x*this.s; this.ty=r.height/2-y*this.s; this.userMoved=true; this.apply(); }
  zoomAt(cx,cy,f){ const ns=clamp(this.s*f, this.fitS*0.5, 30); const px=(cx-this.tx)/this.s, py=(cy-this.ty)/this.s; this.s=ns; this.tx=cx-px*ns; this.ty=cy-py*ns; this.userMoved=true; this.apply(); }
  apply(){
    this.stage.style.transform=`translate(${this.tx}px,${this.ty}px) scale(${this.s})`; this.renderDraw();
    /* Les pastilles des ouvertures gardent la même taille à l'écran quel que soit le zoom */
    if(this.o.onZoom && !this._zr){ this._zr=requestAnimationFrame(()=>{ this._zr=0; this.o.onZoom(); }); }
  }
  rel(e){ const r=this.vw.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top}; }
  toImg(p){ return [clamp((p.x-this.tx)/this.s,0,this.plan.w), clamp((p.y-this.ty)/this.s,0,this.plan.h)]; }
  changed(){ this.renderDraw(); this.o.onDraw&&this.o.onDraw(this.rects); }
  /* Poignée du rectangle sélectionné sous le doigt (zone de prise d'environ 18 px) */
  poigneeSous(pt){
    if(this.sel==null) return null;
    const b=bbox(this.rects[this.sel]), tol=18/this.s;
    for(const [k,[fx,fy]] of Object.entries(POIGNEES)){ const x=b.x0+(b.x1-b.x0)*fx, y=b.y0+(b.y1-b.y0)*fy; if(Math.hypot(pt[0]-x,pt[1]-y)<tol) return k; }
    return null;
  }
  rectSous(pt){ for(let i=this.rects.length-1;i>=0;i--) if(inPoly(pt,this.rects[i])) return i; return null; }
  down(e){
    /* Souris : clic droit ou molette enfoncée = déplacer le plan, même pendant un tracé */
    const panSouris = e.pointerType==='mouse' && (e.button===1 || e.button===2);
    if(e.pointerType==='mouse' && e.button!==0 && !panSouris) return;
    try{ this.vw.setPointerCapture(e.pointerId); }catch(_){}
    this.ptrs.set(e.pointerId, this.rel(e));
    if(this.ptrs.size===1){
      const p=this.rel(e); this.st={x:p.x,y:p.y,tx:this.tx,ty:this.ty}; this.moved=false; this.multi=false; this.panSouris=panSouris;
      if(panSouris) return;
      if(this.mode==='stylo') this.stroke=[this.toImg(p)];
      /* Sélection : l'application dit si on attrape une poignée ou l'élément sélectionné */
      if(this.mode==='select') this.selDrag=this.o.onSelDown ? this.o.onSelDown(this.toImg(p)) : null;
      /* Forme glissée (nuage, rectangle, cercle, triangle, flèche) : coin de départ */
      if(this.mode==='forme' && this.formeType!=='poly') this.fdrag={a:this.toImg(p), b:null};
      if(this.mode==='draw' && this.pts.length){
        /* Tracé par points en cours : on peut attraper un point déjà posé pour le déplacer */
        const brut=this.toImg(p), i=this.pts.findIndex(q=>Math.hypot(q[0]-brut[0],q[1]-brut[1])<(this.ouvert?24:14)/this.s);
        if(i>=0) this.ptDrag={i, actif:false};
      }
      if(this.mode==='draw' && !this.pts.length){   // pendant un tracé par points, glisser = déplacer le plan
        const brut=this.toImg(p), h=this.poigneeSous(brut);
        /* Coin d'une zone déjà enregistrée : on le tire pour le déplacer */
        const so = this.sel==null && this.o.sommetSous ? this.o.sommetSous(brut, 14/this.s) : null;
        if(so) this.drag={type:'sommet', so, x0:p.x, y0:p.y};
        else if(h) this.drag={type:'resize', h, orig:bbox(this.rects[this.sel]), x0:p.x, y0:p.y};
        else if(this.sel!=null && inPoly(brut,this.rects[this.sel])) this.drag={type:'move', start:brut, orig:this.rects[this.sel].map(q=>[...q]), x0:p.x, y0:p.y};
        else this.drag={type:'new', a:this.snap(brut), brut, b:null, x0:p.x, y0:p.y};
      }
    } else if(this.ptrs.size===2){
      /* Deux doigts : zoom et déplacement ; le geste en cours est abandonné */
      this.multi=true; this.stroke=null; this.fdrag=null;
      if(this.selDrag){ this.selDrag.cancel && this.selDrag.cancel(); this.selDrag=null; }
      if(this.drag && this.drag.type==='sommet' && this.drag.actif) this.o.onSommetAnnule&&this.o.onSommetAnnule(this.drag.so);
      if(this.ptDrag){ if(this.ptDrag.actif && this.ptDrag.orig) this.pts[this.ptDrag.i]=this.ptDrag.orig; this.ptDrag=null; }
      if(this.drag && this.drag.type==='move') this.rects[this.sel]=this.drag.orig;
      if(this.drag && this.drag.type==='resize'){ const o=this.drag.orig; this.rects[this.sel]=rectPts([o.x0,o.y0],[o.x1,o.y1]); }
      this.drag=null; const [a,b]=[...this.ptrs.values()];
      this.pz={d:Math.hypot(a.x-b.x,a.y-b.y)||1, s:this.s, px:((a.x+b.x)/2-this.tx)/this.s, py:((a.y+b.y)/2-this.ty)/this.s};
      this.renderDraw();
    }
  }
  move(e){
    if(!this.ptrs.has(e.pointerId)) return;
    this.ptrs.set(e.pointerId, this.rel(e));
    if(this.ptrs.size>=2 && this.pz){
      const [a,b]=[...this.ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y);
      const mx=(a.x+b.x)/2, my=(a.y+b.y)/2; const ns=clamp(this.pz.s*d/this.pz.d, this.fitS*0.5, 30);
      this.s=ns; this.tx=mx-this.pz.px*ns; this.ty=my-this.pz.py*ns; this.userMoved=true; this.apply();
    } else if(this.ptrs.size===1 && !this.multi && this.st){
      const p=this.rel(e), d=this.drag;
      const bouge = Math.hypot(p.x-this.st.x, p.y-this.st.y)>8;
      if(!this.panSouris && this.mode==='draw' && this.ptDrag){
        if(!bouge && !this.ptDrag.actif) return;
        if(!this.ptDrag.actif){ this.ptDrag.actif=true; this.ptDrag.orig=this.pts[this.ptDrag.i]; }
        this.pts[this.ptDrag.i]=this.snap(this.toImg(p)); this.renderDraw(); return;
      }
      if(!this.panSouris && this.mode==='draw' && d && (d.type!=='new' || this.nouveaux)){
        if(!bouge && !d.actif) return;
        if(d.type==='sommet' && !d.actif) this.o.onSommetDebut&&this.o.onSommetDebut(d.so);   // la zone se cache, l'aimant l'ignore
        d.actif=true; const q=this.toImg(p);
        if(d.type==='sommet') d.so.points[d.so.i]=this.snap(q);
        else if(d.type==='new') d.b=q;
        else if(d.type==='move'){ const dx=q[0]-d.start[0], dy=q[1]-d.start[1]; this.rects[this.sel]=d.orig.map(c=>[c[0]+dx, c[1]+dy]); }
        else this.rects[this.sel]=this.redim(d, q);
        this.renderDraw(); return;
      }
      if(!this.panSouris && this.mode==='select' && this.selDrag){
        if(!bouge && !this.selDrag.actif) return;
        this.selDrag.actif=true; this.selDrag.move(this.toImg(p)); this.renderDraw(); return;
      }
      if(!this.panSouris && this.mode==='forme' && this.fdrag){
        if(!bouge && !this.fdrag.b) return;
        this.fdrag.b=this.toImg(p); this.renderDraw(); return;
      }
      if(!this.panSouris && this.mode==='stylo' && this.stroke){
        const q=this.toImg(p), l=this.stroke[this.stroke.length-1];
        if(Math.hypot(q[0]-l[0],q[1]-l[1])>3/this.s){ this.stroke.push(q); this.renderDraw(); }
        return;
      }
      const dx=p.x-this.st.x, dy=p.y-this.st.y;
      if(!this.moved && bouge) { this.moved=true; this.vw.style.cursor='grabbing'; }
      if(this.moved){ this.tx=this.st.tx+dx; this.ty=this.st.ty+dy; this.userMoved=true; this.stage.style.transform=`translate(${this.tx}px,${this.ty}px) scale(${this.s})`; }
    }
  }
  /* Redimensionnement selon la poignée tirée (coin = 2 côtés, milieu = 1 côté) */
  redim(d, q){
    let {x0,y0,x1,y1}=d.orig; const h=d.h;
    if(h.includes('w')) x0=q[0]; if(h.includes('e')) x1=q[0];
    if(h.includes('n')) y0=q[1]; if(h.includes('s')) y1=q[1];
    return rectPts([Math.min(x0,x1),Math.min(y0,y1)],[Math.max(x0,x1),Math.max(y0,y1)]);
  }
  assezGrand(R){ const b=bbox(R); return (b.x1-b.x0)*this.s>8 && (b.y1-b.y0)*this.s>8; }
  up(e){
    if(!this.ptrs.has(e.pointerId)) return;
    const p=this.rel(e); this.ptrs.delete(e.pointerId); this.vw.style.cursor='';
    if(this.ptrs.size<2) this.pz=null;
    if(this.ptrs.size===0){
      const valide = e.type==='pointerup' && !this.multi;
      if(this.panSouris){
        this.panSouris=false;
        /* Clic droit sans bouger = fermer la zone tracée par points */
        if(e.type==='pointerup' && !this.moved && this.mode==='draw' && this.avecPoints) this.fermerPoly();
      }
      else if(this.mode==='draw' && this.ptDrag){ const g=this.ptDrag; this.ptDrag=null; if(!g.actif && valide && !this.moved){} this.renderDraw(); }   // point déplacé (ou simplement touché)
      else if(this.mode==='draw' && this.pts.length){ if(valide && !this.moved) this.ajouterPoint(p); else this.renderDraw(); }
      else if(this.mode==='select' && this.selDrag && this.selDrag.actif){
        /* Modification terminée : l'application l'enregistre tout de suite */
        const h=this.selDrag; this.selDrag=null; valide ? h.up(this.toImg(p)) : (h.cancel&&h.cancel()); this.renderDraw();
      }
      else if(this.mode==='forme' && this.fdrag && this.fdrag.b){
        const f=this.fdrag; this.fdrag=null;
        if(valide && Math.abs(f.b[0]-f.a[0])*this.s>8 || valide && Math.abs(f.b[1]-f.a[1])*this.s>8) this.o.onForme && this.o.onForme([f.a, this.toImg(p)]);
        this.renderDraw();
      }
      else if(this.mode==='draw') this.finGeste(p, valide);
      else if(this.mode==='stylo'){
        if(e.type==='pointerup' && this.stroke && this.stroke.length>1 && !this.multi) this.o.onStroke&&this.o.onStroke(this.stroke);
        this.stroke=null; this.renderDraw();
      } else if(e.type==='pointerup' && !this.moved && !this.multi) this.tap(p);
      this.selDrag=null; this.fdrag=null;
      this.st=null;
    }
  }
  finGeste(p, valide){
    const d=this.drag; this.drag=null;
    if(d && d.type==='sommet' && d.actif){
      /* Coin d'une zone déplacé : enregistré dès qu'on lâche */
      valide ? this.o.onSommet&&this.o.onSommet(d.so) : this.o.onSommetAnnule&&this.o.onSommetAnnule(d.so);
      this.renderDraw(); return;
    }
    if(!d || !valide){ this.renderDraw(); return; }
    const brut=this.toImg(p);
    if(!d.actif){
      /* Simple toucher : sélectionner un rectangle en cours, ou reprendre un élément enregistré, ou désélectionner */
      if(this.moved){ this.renderDraw(); return; }
      if(this.avecPoints){
        /* Tracé par points : toucher un rectangle en cours le sélectionne, sinon on pose un coin */
        const i=this.rectSous(brut);
        if(i!=null){ this.sel=i; this.changed(); return; }
        if(this.sel!=null){ this.sel=null; this.changed(); return; }
        this.ajouterPoint(p); return;
      }
      const i=this.rectSous(brut);
      if(i!=null) this.sel=i;
      else if(this.o.onPick && this.o.onPick(brut)) {}
      else this.sel=null;
      this.changed(); return;
    }
    if(d.type==='new'){
      /* Nouveau rectangle créé dès qu'on lâche ; l'aimant ne doit jamais l'écraser */
      if(!this.nouveaux){ this.renderDraw(); return; }
      const ok=(a,b)=>Math.abs(b[0]-a[0])*this.s>8 && Math.abs(b[1]-a[1])*this.s>8;
      let a=d.a, b=this.snap(brut);
      if(!ok(a,b)) b=brut;
      if(!ok(a,b)) a=d.brut;
      if(ok(a,b)){ this.rects.push(rectPts(a,b)); this.meta.push(null); this.sel=null; }
    } else if(d.type==='move'){
      /* Aimant après déplacement : on cale le rectangle sur le bord le plus proche, sans le déformer */
      const R=this.rects[this.sel], b=bbox(R), c1=this.snap([b.x0,b.y0],this.sel), c2=this.snap([b.x1,b.y1],this.sel);
      const dx = c1[0]!==b.x0 ? c1[0]-b.x0 : c2[0]!==b.x1 ? c2[0]-b.x1 : 0;
      const dy = c1[1]!==b.y0 ? c1[1]-b.y0 : c2[1]!==b.y1 ? c2[1]-b.y1 : 0;
      this.rects[this.sel]=R.map(c=>[c[0]+dx, c[1]+dy]);
    } else {
      /* Aimant sur le côté ou le coin qu'on vient de tirer */
      const q=this.snap(brut, this.sel), R=this.redim(d, q);
      this.rects[this.sel] = this.assezGrand(R) ? R : (this.assezGrand(this.redim(d,brut)) ? this.redim(d,brut) : rectPts([d.orig.x0,d.orig.y0],[d.orig.x1,d.orig.y1]));
    }
    this.changed();
  }
  supprimerSel(){
    if(this.sel==null) return;
    const m=this.meta[this.sel]; if(m) this.retires.push(m);
    this.rects.splice(this.sel,1); this.meta.splice(this.sel,1); this.sel=null; this.changed();
  }
  /* Tracé par points : 1er coin, 2e coin… ; toucher le 1er coin, ✔ ou clic droit ferme la forme */
  ajouterPoint(p){
    const raw=[(p.x-this.tx)/this.s, (p.y-this.ty)/this.s];
    if(raw[0]<-20||raw[1]<-20||raw[0]>this.plan.w+20||raw[1]>this.plan.h+20) return;
    const pt=this.snap(this.toImg(p));
    if(!this.ouvert && this.pts.length>=3 && Math.hypot(pt[0]-this.pts[0][0], pt[1]-this.pts[0][1])<16/this.s) return;   // on ferme au clic droit
    const l=this.pts[this.pts.length-1]; if(l && Math.hypot(pt[0]-l[0],pt[1]-l[1])<2/this.s) return;
    this.pts.push(pt); this.renderDraw(); this.o.onPts&&this.o.onPts();
  }
  fermerPoly(){
    const min=this.ouvert?2:3;   // un trait : 2 points suffisent ; une zone : 3
    if(this.pts.length<min){ toast(`Il faut au moins ${min} points`); return; }
    const P=this.pts; this.pts=[]; this.renderDraw();
    this.o.onPoly&&this.o.onPoly(P); this.o.onPts&&this.o.onPts();
  }
  retirerPoint(){ this.pts.pop(); this.renderDraw(); this.o.onPts&&this.o.onPts(); }
  /* Reprendre un élément déjà enregistré pour le modifier */
  charger(points, meta){ this.rects.push(points.map(q=>[...q])); this.meta.push(meta); this.sel=this.rects.length-1; this.changed(); }
  tap(p){
    const raw=[(p.x-this.tx)/this.s, (p.y-this.ty)/this.s];
    if(raw[0]<-20||raw[1]<-20||raw[0]>this.plan.w+20||raw[1]>this.plan.h+20) return;
    const pt=this.toImg(p);
    if(this.mode==='echelle'){
      /* Échelle : les 2 extrémités d'une cote connue */
      if(this.pts.length>=2) this.pts=[];
      this.pts.push(this.snap(pt)); this.renderDraw();
      if(this.pts.length===2) this.o.onEchelle&&this.o.onEchelle(this.pts.slice());
    } else if(this.mode==='fleche'){
      this.pts.push(pt); this.renderDraw();
      if(this.pts.length===2){ const P=this.pts; this.pts=[]; this.renderDraw(); this.o.onArrow&&this.o.onArrow(P); }
    } else if(this.mode==='forme' && this.formeType==='poly'){
      /* Polygone : on touche les coins ; toucher le premier coin ferme la forme (enregistrée aussitôt) */
      if(this.pts.length>=3 && Math.hypot(pt[0]-this.pts[0][0], pt[1]-this.pts[0][1])<16/this.s){ const P=this.pts; this.pts=[]; this.renderDraw(); this.o.onForme&&this.o.onForme(P); }
      else { this.pts.push(pt); this.renderDraw(); }
    } else this.o.onTap&&this.o.onTap(pt);
  }
  setSnap(ds){
    this.snapPts=[]; this.snapSegs=[];
    for(const d of ds){ const P=d.points; P.forEach((p,i)=>{ this.snapPts.push(p); this.snapSegs.push([p, P[(i+1)%P.length]]); }); }
  }
  /* Aimant : un coin lâché à moins d'environ 1 cm à l'écran d'un coin ou d'un bord (zones, dessins,
     autres rectangles en cours) s'y colle, pour ne laisser ni bande oubliée ni chevauchement */
  snap(p, sauf=null){
    if(this.sansAimant) return p;
    const th=34/this.s; let best=null, bd=th*0.7;
    const autres=this.rects.filter((_,i)=>i!==sauf);
    for(const q of this.snapPts.concat(autres.flat())){ const d=Math.hypot(q[0]-p[0],q[1]-p[1]); if(d<bd){bd=d;best=q;} }
    if(best) return [best[0],best[1]];
    const segs=this.snapSegs.slice(); for(const R of autres) R.forEach((q,i)=>segs.push([q, R[(i+1)%R.length]]));
    let x=p[0], y=p[1], bx=th, by=th;
    for(const [a,b] of segs){
      if(Math.abs(a[0]-b[0])<1e-6){ const d=Math.abs(p[0]-a[0]); if(d<bx && p[1]>=Math.min(a[1],b[1])-th && p[1]<=Math.max(a[1],b[1])+th){ bx=d; x=a[0]; } }
      else if(Math.abs(a[1]-b[1])<1e-6){ const d=Math.abs(p[1]-a[1]); if(d<by && p[0]>=Math.min(a[0],b[0])-th && p[0]<=Math.max(a[0],b[0])+th){ by=d; y=a[1]; } }
    }
    if(x!==p[0] || y!==p[1]) return [x,y];
    bd=th*0.75;
    for(const [a,b] of segs){
      const vx=b[0]-a[0], vy=b[1]-a[1], L=vx*vx+vy*vy; if(!L) continue;
      const t=clamp(((p[0]-a[0])*vx+(p[1]-a[1])*vy)/L,0,1); const q=[a[0]+t*vx,a[1]+t*vy];
      const d=Math.hypot(q[0]-p[0],q[1]-p[1]); if(d<bd){bd=d;best=q;}
    }
    return best ? best : p;
  }
  setMode(m, color, opts={}){
    this.mode=m; if(color) this.color=color; this.numeroter=!!opts.numeroter; this.nouveaux=opts.nouveaux!==false; this.avecPoints=!!opts.points; this.sansAimant=opts.aimant===false; this.ouvert=!!opts.ligne;
    this.formeType=opts.forme||'rect'; this.formePlein=!!opts.plein; this.selDrag=null; this.fdrag=null;
    this.pts=[]; this.rects=[]; this.meta=[]; this.retires=[]; this.sel=null; this.drag=null; this.stroke=null;
    this.vw.classList.toggle('drawing', m!=='consult'); this.renderDraw();
  }
  renderDraw(){
    const r=7/this.s, c=this.color; let h='';
    if(this.mode==='draw'){
      const rect=(R,col,op,dash)=>`<polygon points="${R.map(p=>p[0]+','+p[1]).join(' ')}" fill="${col}" fill-opacity="${op}" stroke="${col}" stroke-width="3" ${dash?'stroke-dasharray="8 6"':''} vector-effect="non-scaling-stroke"/>`;
      let n=0;
      this.rects.forEach((R,i)=>{
        const m=this.meta[i], col=m?.couleur||c;
        h+=rect(R,col,.35,false);
        if(this.numeroter && !m){ n++; const b=bbox(R), T=16/this.s;
          h+=`<text x="${(b.x0+b.x1)/2}" y="${(b.y0+b.y1)/2+T*.35}" text-anchor="middle" font-size="${T}" font-weight="800" font-family="system-ui,sans-serif" fill="#0f3a5f" stroke="#fff" stroke-width="${T/5}" paint-order="stroke">Z${n}</text>`; }
      });
      if(this.sel!=null && this.rects[this.sel]){
        const b=bbox(this.rects[this.sel]);
        h+=`<rect x="${b.x0}" y="${b.y0}" width="${b.x1-b.x0}" height="${b.y1-b.y0}" fill="none" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
        for(const [fx,fy] of Object.values(POIGNEES)) h+=`<circle cx="${b.x0+(b.x1-b.x0)*fx}" cy="${b.y0+(b.y1-b.y0)*fy}" r="${8/this.s}" fill="#fff" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
      }
      if(this.drag && this.drag.type==='new' && this.drag.b && this.nouveaux) h+=rect(rectPts(this.drag.a, this.drag.b),c,.2,true);
      if(this.drag && this.drag.type==='new' && this.drag.actif && this.nouveaux) h+=`<circle cx="${this.drag.a[0]}" cy="${this.drag.a[1]}" r="${r}" fill="#fff" stroke="${c}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
    }
    /* Coins des zones enregistrées : petits ronds qu'on peut tirer */
    if(this.mode==='draw' && this.o.sommetsVisibles){
      const d=this.drag;
      if(d && d.type==='sommet' && d.actif){ const P=d.so.points, col=d.so.couleur||c;
        h+=`<polygon points="${P.map(p=>p[0]+','+p[1]).join(' ')}" fill="${col}" fill-opacity=".15" stroke="${col}" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
        h+=`<circle cx="${P[d.so.i][0]}" cy="${P[d.so.i][1]}" r="${9/this.s}" fill="#fff" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"/>`; }
      for(const P of this.o.sommetsVisibles()) for(const q of P) h+=`<circle cx="${q[0]}" cy="${q[1]}" r="${5/this.s}" fill="#fff" stroke="#374151" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    }
    /* Points posés (zone par points, échelle) : le 1er est plus gros */
    if((this.mode==='draw' || this.mode==='echelle') && this.pts.length){
      const cc=c==='#ffffff'?'#111827':c, w=this.ouvert?(STYLOS.find(s=>s[0]===U.stylo)||STYLOS[1])[1]:3;
      if(this.mode==='draw' && !this.ouvert && this.pts.length>=3) h+=`<polygon points="${this.pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="${c}" fill-opacity=".15" stroke="none"/>`;
      h+=`<polyline points="${this.pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
      /* Points assez gros pour être attrapés au doigt et déplacés */
      this.pts.forEach((p,i)=>{ h+=`<circle cx="${p[0]}" cy="${p[1]}" r="${(this.ouvert?9:(i?6:10))/this.s}" fill="${!this.ouvert&&!i?cc:'#fff'}" stroke="${cc}" stroke-width="3" vector-effect="non-scaling-stroke"/>`; });
    }
    if(this.mode==='select' && this.o.selSVG) h+=this.o.selSVG(this.s);
    if(this.mode==='forme'){
      if(this.fdrag && this.fdrag.b) h+=formeSVG({forme:this.formeType, plein:this.formePlein, couleur:c, points:[this.fdrag.a,this.fdrag.b]}, this.plan, true);
      if(this.formeType==='poly' && this.pts.length){
        h+=`<polyline points="${this.pts.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="${c==='#ffffff'?'#111827':c}" stroke-width="3" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>`;
        this.pts.forEach((p,i)=>{ h+=`<circle cx="${p[0]}" cy="${p[1]}" r="${(i?7:10)/this.s}" fill="#fff" stroke="${c==='#ffffff'?'#111827':c}" stroke-width="3" vector-effect="non-scaling-stroke"/>`; });
      }
    }
    if(this.mode==='stylo' && this.stroke && this.stroke.length>1) h+=`<polyline points="${this.stroke.map(p=>p[0]+','+p[1]).join(' ')}" fill="none" stroke="${c==='#ffffff'?'#111827':c}" stroke-width="${(STYLOS.find(s=>s[0]===U.stylo)||STYLOS[1])[1]}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
    if(this.mode==='fleche' && this.pts.length===1) h+=`<circle cx="${this.pts[0][0]}" cy="${this.pts[0][1]}" r="${r}" fill="${c}" stroke="#111827" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
    this.drw.innerHTML=h;
  }
  destroy(){ this.ro.disconnect(); }
}

/* =========================================================
   Données de démonstration
   ========================================================= */
async function planDemoBlob(){
  const W=3000, H=1900, c=document.createElement('canvas'); c.width=W; c.height=H;
  const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,W,H);
  g.strokeStyle='#eef0f3'; g.lineWidth=1; for(let x=0;x<W;x+=60){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();} for(let y=0;y<H;y+=60){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  const X0=300,Y0=400,X1=2700,Y1=1600;
  g.strokeStyle='#111'; g.lineWidth=6; g.strokeRect(X0,Y0,X1-X0,Y1-Y0);
  g.lineWidth=3; g.strokeStyle='#374151';
  [[480,560],[900,560],[1320,560],[1740,560],[2160,560],[480,1040],[900,1040],[1740,1040],[2160,1040]].forEach(([x,y])=>{ g.strokeRect(x,y,240,300); g.beginPath(); g.moveTo(x+120,y); g.lineTo(x+120,y+300); g.stroke(); });
  g.strokeRect(1290,1100,300,500);
  g.lineWidth=2; g.strokeStyle='#9ca3af'; g.setLineDash([12,8]); [900,1500,2100].forEach(x=>{g.beginPath();g.moveTo(x,Y0);g.lineTo(x,Y1);g.stroke();}); g.setLineDash([]);
  g.strokeStyle='#b91c1c'; g.fillStyle='#b91c1c'; g.lineWidth=3; g.font='bold 44px sans-serif'; g.textAlign='center';
  g.beginPath(); g.moveTo(X0,1720); g.lineTo(X1,1720); g.moveTo(X0,1690); g.lineTo(X0,1750); g.moveTo(X1,1690); g.lineTo(X1,1750); g.stroke();
  g.fillText('20,00 m',(X0+X1)/2,1705);
  g.beginPath(); g.moveTo(180,Y0); g.lineTo(180,Y1); g.moveTo(150,Y0); g.lineTo(210,Y0); g.moveTo(150,Y1); g.lineTo(210,Y1); g.stroke();
  g.save(); g.translate(160,(Y0+Y1)/2); g.rotate(-Math.PI/2); g.fillText('10,00 m',0,0); g.restore();
  g.fillStyle='#111'; g.textAlign='left'; g.font='bold 60px sans-serif'; g.fillText('FAÇADE NORD — Plan de démonstration',300,230);
  g.font='36px sans-serif'; g.fillStyle='#6b7280'; g.fillText('Travées T1 à T4 (pointillés)',300,300);
  ['T1','T2','T3','T4'].forEach((t,i)=>{ g.fillStyle='#9ca3af'; g.font='bold 40px sans-serif'; g.fillText(t,[560,1160,1760,2360][i],450); });
  return new Promise(res=>c.toBlob(b=>res({blob:b,w:W,h:H}),'image/png'));
}
async function chargerDemo(){
  const t=today();
  const ch1={id:uid(), nom:'Résidence Les Tilleuls (démo)', adresse:'12 rue des Tilleuls', actif:true, etapes:defEtapes()};
  const ch2={id:uid(), nom:'Groupe scolaire Jaurès (démo)', adresse:'Av. Jean Jaurès', actif:true, etapes:defEtapes()};
  const {blob,w,h}=await planDemoBlob();
  const pl={id:uid(), chantierId:ch1.id, nom:'Façade Nord', w, h};
  await putImage(pl.id, blob);
  const noms=['Ahmed B.','Karim M.','Julien R.','Sofiane T.','Marc L.'];
  const sal=noms.map(n=>({id:uid(), nom:n, actif:true}));
  S.chantiers.push(ch1,ch2); S.plans.push(pl); S.salaries.push(...sal);
  const c1={id:uid(), nom:'Ahmed B.', pin:'1234'}, c2={id:uid(), nom:'Karim M.', pin:'5678'};
  S.chefs.push(c1,c2);
  const base={planId:pl.id, chantierId:ch1.id, auteur:'Ahmed B.', auteurId:c1.id, createdAt:Date.now()};
  S.dessins.push(
    {...base, id:uid(), etape:'tracage',  date:addDays(t,-2), points:rectPts([300,400],[1500,1600])},
    {...base, id:uid(), etape:'equerres', date:addDays(t,-1), points:rectPts([300,400],[1500,1600])},
    {...base, id:uid(), etape:'ldv',      date:addDays(t,-1), points:rectPts([300,400],[1140,1600])},
  );
  [[600,710],[1020,710],[1440,710],[1860,710],[2280,710],[600,1190],[1020,1190],[1860,1190],[2280,1190]].forEach(([x,y],i)=>S.ouvertures.push({id:uid(), planId:pl.id, chantierId:ch1.id, type:'F', num:i+1, x, y, fait:i<2, date:i<2?addDays(t,-1):null, auteur:i<2?'Ahmed B.':'', auteurId:i<2?c1.id:'', createdAt:Date.now()}));
  S.ouvertures.push({id:uid(), planId:pl.id, chantierId:ch1.id, type:'P', num:1, x:1440, y:1350, fait:false, date:null, auteur:'', auteurId:'', createdAt:Date.now()});
  ['T1','T2','T3','T4'].forEach((n,i)=>S.zones.push({id:uid(), planId:pl.id, chantierId:ch1.id, nom:'Travée '+n, m2:50, points:rectPts([300+i*600,400],[900+i*600,1600]), createdAt:Date.now()}));
  S.annotations.push({...base, id:uid(), type:'texte', couleur:'#7c3aed', points:[[1180,1000]], texte:'Manque 2 équerres', date:addDays(t,-1)},
    {...base, id:uid(), type:'fleche', couleur:'#7c3aed', points:[[1300,960],[1460,760]], texte:'', date:addDays(t,-1)});
  for(const d of [addDays(t,-2), addDays(t,-1)]){
    if(dow(d)===0||dow(d)===6) continue;
    sal.slice(0,3).forEach(s=>S.pointages.push({id:uid(), salarieId:s.id, chantierId:ch1.id, date:d, periode:'J', statut:'present'}));
    S.pointages.push({id:uid(), salarieId:sal[3].id, chantierId:ch1.id, date:d, periode:'M', statut:'present'});
    S.pointages.push({id:uid(), salarieId:sal[3].id, chantierId:ch2.id, date:d, periode:'A', statut:'present'});
  }
  S.conges.push({id:uid(), salarieId:sal[4].id, debut:addDays(t,-2), fin:addDays(t,4)});
  S.commandes.push({id:uid(), chantierId:ch1.id, auteur:'Ahmed B.', auteurId:c1.id, texte:'40 × équerres 120 mm (manque façade nord)\n2 × rouleaux de pare-pluie (stock fini)', lignes:[{produit:'Équerres 120 mm',qte:'40',pourquoi:'Manque façade nord'},{produit:'Rouleaux de pare-pluie',qte:'2',pourquoi:'Stock fini'}], date:addDays(t,-1), createdAt:Date.now()-86400000, mail:'attente', traitee:false});
  save(); toast('Données de démonstration chargées');
}

/* =========================================================
   État de l'interface
   ========================================================= */
const U = { screen:'home', chefId: ls.get('chef-id') || '', bureauOK:false, chantierId:null, planId:null, etape:null, outil:null, chefVue:'avancement',
  stylo: ls.get('stylo') || 'moyen', zoneCouleur: ls.get('zone-couleur') || '#1d4ed8',forme: (()=>{ try{ const f=JSON.parse(ls.get('forme-annot')); if(f && FORMES.some(x=>x[0]===f.type)) return {type:f.type, plein:false}; }catch(_){} return {type:'rect', plein:false}; })(),
  annotCouleur: ANNOT_COULEURS.some(c=>c[0]===ls.get('annot-couleur')) ? ls.get('annot-couleur') : '#e11d1d', showNotes:true, sel:null, selGeom:null,
  ptChantier: ls.get('pt-chantier') || '', btab:'accueil', avVue:{type:'avancement', etape:'tracage', date:today()}, ptDu:mondayOf(today()), ptAu:today(), ptCh:'',
  ouvType:'F', zCh:'', prCh:'', prMode:'jour', prDate:today(),
  phCh:'', phDu:addDays(today(),-6), phAu:today(), phList:[], lbI:0, cmdCh:'', cmdFiltre:'atraiter', focus:null, openEt:{}, newCol:{}, photoPt:null, viewer:null };
const chefCourant = () => S.chefs.find(c=>c.id===U.chefId);
const nomChef = () => chefCourant()?.nom || 'Chef';
const estAMoi = d => d.auteurId ? d.auteurId===U.chefId : d.auteur===nomChef();
const enBureau = () => U.screen==='bureau';

function go(screen, extra={}){ Object.assign(U, extra, {screen}); render(); }
let lastScreen='';
function render(){
  if(U.viewer){ U.viewer.destroy(); U.viewer=null; }
  if(!(U.screen==='chefChantier' || (U.screen==='bureau' && U.btab==='avancement'))) document.body.classList.remove('pe');
  if(SY.sb && !connecte()){ U.screen='appareil'; }
  else if(U.screen==='appareil') U.screen='home';
  if(U.screen.startsWith('chef') && U.screen!=='chefLogin' && !chefCourant()) U.screen='chefLogin';
  if(U.screen==='bureau' && !U.bureauOK) U.screen='bureauLogin';
  const key=U.screen+'|'+U.btab, sc=$('.scroll'), top= key===lastScreen && sc ? sc.scrollTop : 0;
  const f={appareil:vAppareil, home:vHome, chefLogin:vChefLogin, bureauLogin:vBureauLogin, chefAccueil:vChefAccueil, chefPointage:vChefPointage, chefChantiers:vChefChantiers,
    chefChantier:vChefChantier, chefPhotos:vChefPhotos, chefMateriel:vChefMateriel, bureau:vBureau}[U.screen]||vHome;
  $('#app').innerHTML=f();
  lastScreen=key; const sc2=$('.scroll'); if(sc2&&top) sc2.scrollTop=top;
  majEtat();
  after();
}
function after(){
  if(U.screen==='chefChantier') mountChefViewer();
  if(U.screen==='bureau' && U.btab==='avancement') mountAvViewer();
  hydrate();
}
/* En-tête avec le bouton ☰ du menu */
function hdr(titre, sous, {back='', act=''}={}){
  return `<header class="top"><button class="back" onclick="openMenu()" aria-label="Menu">☰</button>${back?`<button class="back" onclick="${back}" aria-label="Retour">←</button>`:''}<div class="ttl"><b>${titre}</b>${sous?`<small>${sous}</small>`:''}</div>${SY.sb?'<button class="sy" id="sy" onclick="synchroniser()" aria-label="État de la synchronisation"></button>':''}${act}</header>`;
}

/* ---------- Menu à gauche ---------- */
function openMenu(){
  const chef=U.screen.startsWith('chef');
  const items = chef
    ? [['chefAccueil','🏠','Accueil'],['chefPointage','👷','Pointage'],['chefChantiers','🏗️','Chantiers'],['chefPhotos','📷','Photos'],['chefMateriel','📦','Matériel à commander']]
    : [['accueil','📊','Tableau de bord'],['chantiers','🏗️','Chantiers'],['avancement','🗺️','Avancement'],['zones','▭','Zones de travail'],['production','📈','Production'],['photos','📷','Photos'],['salaries','👷','Salariés'],['pointages','🗓️','Pointages'],['commandes','📦','Commandes'],['comptes','🔑','Comptes']];
  const cur = chef ? (U.screen==='chefChantier'?'chefChantiers':U.screen) : U.btab;
  const d=document.createElement('div'); d.className='mov'; d.id='mov';
  d.innerHTML=`<nav class="drawer" aria-label="Menu"><div class="dh">${chef?'👤 '+esc(nomChef()):'🖥️ Bureau'}<small>${fmtLong(today())}</small></div>
    ${items.map(([k,i,l])=>`<button class="${cur===k?'on':''}" onclick="closeMenu();${chef?`go('${k}')`:`go('bureau',{btab:'${k}',bCh:null})`}"><span>${i}</span>${l}</button>`).join('')}
    <div class="dsep"></div>
    ${chef?`<button onclick="closeMenu();logoutChef()"><span>🚪</span>Déconnexion</button>`:`<button onclick="closeMenu();U.bureauOK=false;go('home')"><span>🔒</span>Verrouiller</button>`}</nav>`;
  d.addEventListener('click',e=>{ if(e.target===d) closeMenu(); });
  document.body.appendChild(d);
}
function closeMenu(){ $('#mov')?.remove(); }

/* ---------- Accueil ---------- */
function vHome(){
  const vide=!S.chantiers.length;
  return `<div class="scroll"><div class="home">
    <h1>🏗️ Suivi Chantier</h1><p>Qui utilise l'application ?</p>
    <button class="bigbtn" onclick="go('chefAccueil')"><span class="i">👷</span><span>Chef de chantier<small>Pointage du jour · Dessiner sur les plans</small></span></button>
    <button class="bigbtn" onclick="go('bureau')"><span class="i">🖥️</span><span>Bureau<small>Tableau de bord, chantiers, salariés, exports</small></span></button>
    ${vide&&!SY.sb?`<div class="card" style="margin-top:10px"><b>Première utilisation ?</b><p class="muted" style="text-align:left;margin:6px 0 10px">Chargez un chantier d'exemple (plan, salariés, comptes chefs) pour essayer tout de suite.</p><button class="btn" onclick="chargerDemo().then(render)">Charger la démonstration</button></div>`:''}
  </div></div>`;
}

/* ---------- Connexion (code à 4 chiffres) ---------- */
let pinBuf='', pinSel=null;
function vPad(titre, sous){
  return `<div class="pin"><h2>${titre}</h2><p class="muted">${sous}</p>
    <div class="dots">${[0,1,2,3].map(i=>`<i class="${i<pinBuf.length?'on':''}"></i>`).join('')}</div>
    <div class="pad">${['1','2','3','4','5','6','7','8','9','','0','⌫'].map(k=>k===''?'<span></span>':`<button onclick="pinKey('${k}')">${k}</button>`).join('')}</div></div>`;
}
function pinKey(k){
  if(k==='⌫') pinBuf=pinBuf.slice(0,-1); else if(pinBuf.length<4) pinBuf+=k;
  if(pinBuf.length===4){ const code=pinBuf; pinBuf=''; return pinCheck(code); }
  render();
}
function pinCheck(code){
  if(U.screen==='bureauLogin'){
    if(code===(S.bureauPin||'0000')){ U.bureauOK=true; go('bureau'); } else { toast('Code incorrect','warn'); render(); }
    return;
  }
  const c=S.chefs.find(x=>x.id===pinSel);
  if(c && code===c.pin){ U.chefId=c.id; ls.set('chef-id',c.id); pinSel=null; go('chefAccueil'); }
  else { toast('Code incorrect','warn'); render(); }
}
function vChefLogin(){
  const back = pinSel ? `pinSel=null;pinBuf='';render()` : `pinBuf='';go('home')`;
  const head=`<header class="top"><button class="back" onclick="${back}" aria-label="Retour">←</button><div class="ttl"><b>Connexion chef de chantier</b></div></header>`;
  if(pinSel){ const c=S.chefs.find(x=>x.id===pinSel); return head+`<div class="scroll">${vPad('👷 '+esc(c?.nom),'Tapez votre code à 4 chiffres')}</div>`; }
  return head+`<div class="scroll"><div class="wrap" style="max-width:520px"><h3 style="margin:4px 0 12px">Qui êtes-vous ?</h3>
    ${S.chefs.length ? S.chefs.map(c=>`<button class="chantier-card" onclick="pinSel='${c.id}';pinBuf='';render()">👷 ${esc(c.nom)}</button>`).join('')
      : '<p class="muted">Aucun compte chef de chantier. Le bureau doit en créer un (Bureau → Comptes).</p>'}
  </div></div>`;
}
function vBureauLogin(){
  return `<header class="top"><button class="back" onclick="pinBuf='';go('home')" aria-label="Retour">←</button><div class="ttl"><b>Connexion bureau</b></div></header>
  <div class="scroll">${vPad('🖥️ Bureau','Tapez le code du bureau')}${S.bureauPin?'':'<p class="hint" style="text-align:center">Code par défaut : 0000 — à changer dans Bureau → Comptes.</p>'}</div>`;
}

/* ---------- Chef : accueil = 2 boutons (Pointage / Chantiers) ---------- */
function vChefAccueil(){
  const d=today(); const n=new Set(S.pointages.filter(p=>p.date===d && p.statut==='present').map(p=>p.salarieId)).size;
  return hdr('Bonjour '+esc(nomChef()), fmtLong(d))+`<div class="scroll"><div class="home" style="margin-top:6vh">
    <button class="bigbtn" onclick="go('chefPointage')"><span class="i">👷</span><span>Pointage<small>${n?`${n} présent${n>1?'s':''} pointé${n>1?'s':''} aujourd'hui`:"Pointer l'équipe du jour"}</small></span></button>
    <button class="bigbtn" onclick="ouvrirDernierChantier()"><span class="i">🏗️</span><span>Chantiers<small>${dernierChantier()?esc(dernierChantier().nom):'Dessiner le travail sur les plans'}</small></span></button>
  </div></div>`;
}
/* Le chef arrive directement sur le dernier chantier et le dernier plan utilisés */
function dernierChantier(){ const c=chOf(ls.get('dernier-chantier')); return c && c.actif && S.plans.some(p=>p.chantierId===c.id) ? c : null; }
function ouvrirDernierChantier(){
  const c=dernierChantier();
  if(!c) return go('chefChantiers');
  const pl=ls.get('dernier-plan'); go('chefChantier',{chantierId:c.id, planId:S.plans.some(p=>p.id===pl&&p.chantierId===c.id)?pl:null, etape:null});
}
function logoutChef(){ U.chefId=''; ls.set('chef-id',''); go('home'); }
function chantierActifCourant(){ const ch=S.chantiers.filter(c=>c.actif); if(!ch.find(c=>c.id===U.ptChantier)) U.ptChantier=ch[0]?.id||''; return ch; }
function selectChantier(ch, onchange){ return `<select class="big" id="selCh" onchange="${onchange}">${ch.map(x=>`<option value="${x.id}" ${x.id===U.ptChantier?'selected':''}>${esc(x.nom)}</option>`).join('')}</select>`; }
function vChefPointage(){
  const ch=chantierActifCourant();
  return hdr('👷 Pointage', fmtLong(today()), {back:"go('chefAccueil')"})+`<div class="scroll"><div class="wrap" style="max-width:640px">
    ${ch.length ? vPointage(ch) : '<p class="muted">Aucun chantier en cours.</p>'}
  </div></div>`;
}
function vChefChantiers(){
  const ch=S.chantiers.filter(c=>c.actif);
  return hdr('🏗️ Chantiers', 'Choisissez le chantier', {back:"go('chefAccueil')"})+`<div class="scroll"><div class="wrap" style="max-width:640px">
    ${ch.map(c=>{ const n=S.plans.filter(p=>p.chantierId===c.id).length;
      return `<button class="chantier-card" onclick="go('chefChantier',{chantierId:'${c.id}',planId:null,etape:null})">🏗️ ${esc(c.nom)}<small>${esc(c.adresse?c.adresse+' · ':'')}${n} plan${n>1?'s':''}</small></button>`; }).join('') || '<p class="muted">Aucun chantier. Le bureau doit en créer un.</p>'}
  </div></div>`;
}

/* ---------- Chef : chantier = uniquement le plan ---------- */
function vChefChantier(){
  const c=chOf(U.chantierId); if(!c) return vChefChantiers();
  const head=hdr(esc(c.nom), fmtLong(today()), {back:"go('chefChantiers',{etape:null})"});
  const plans=S.plans.filter(p=>p.chantierId===c.id);
  if(!plans.length) return head+`<div class="scroll"><p class="muted">Aucun plan pour ce chantier. Le bureau doit en ajouter un.</p></div>`;
  if(!plans.find(p=>p.id===U.planId)) U.planId=plans[0].id;
  const plan=plans.find(p=>p.id===U.planId);
  return head+`<div class="plan-area">
    <div class="vwrap"><div class="vhost" id="vhost"></div>
      <div class="banner" id="banner" hidden></div><div class="dtools" id="dtools" hidden></div><div class="flyout" id="flyout" hidden></div>
      <div class="plannav">${plans.length>1?`<button onclick="planSuivant(-1)" aria-label="Plan précédent">◀</button>`:''}<span title="${esc(plan.nom)}">${esc(plan.nom)}</span>${plans.length>1?`<button onclick="planSuivant(1)" aria-label="Plan suivant">▶</button>`:''}</div>
    </div>
    <div class="stepbar" id="stepbar"></div>
  </div>`;
}
function curPlan(){ return S.plans.find(p=>p.id===U.planId); }
function mountChefViewer(){
  const plan=curPlan(); if(!plan || !$('#vhost')) return;
  U.outil=null; U.etape=null; U.showNotes=true; U.pile=[];
  ls.set('dernier-chantier', plan.chantierId); ls.set('dernier-plan', plan.id);
  U.viewer=new Viewer($('#vhost'), plan, {sansZoom:true,
    onDraw:rectsTraces,
    onTap:p=> U.outil==='gomme'?gommeTap(p) : U.outil==='photo'?photoTap(p) : U.outil==='ouv'?ouvTap(p) : U.outil==='texte'?texteTap(p) : U.outil==='select'?selectTap(p) : consultTap(p,false),
    onStroke:traitStylo, onForme:formeTracee, onPoly:polyTrace, onPts:renderDtools, onSelDown:selDown, selSVG, onZoom:renderOuv, onPick:reprendre});
  refreshLayers(); renderStepbar(); renderDtools(); focusSiBesoin();
}
/* Nom du plan en bas avec ◀ ▶ pour passer au plan suivant du chantier */
function planSuivant(n){
  const plans=S.plans.filter(p=>p.chantierId===curPlan().chantierId), i=plans.findIndex(p=>p.id===U.planId);
  U.planId=plans[(i+n+plans.length)%plans.length].id; U.etape=null; render();
}
function zoomPlan(f){ const v=U.viewer; if(!v) return; const r=v.vw.getBoundingClientRect(); v.zoomAt(r.width/2, r.height/2, f); }
function planEntier(){ const v=U.viewer; if(v){ v.userMoved=false; v.fit(); } }
/* Plein écran : le plan prend toute la place (l'en-tête disparaît) */
function pleinEcran(){
  const on=!document.body.classList.contains('pe');
  document.body.classList.toggle('pe', on);
  try{ if(on && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{}); else if(!on && document.fullscreenElement) document.exitFullscreen().catch(()=>{}); }catch(_){}
  renderDtools(); setTimeout(planEntier, 150);
}
/* ↩ hors tracé : annule la dernière action du chef sur ce plan (rectangles, note, photo, ébrasement coché) */
function annulerDernier(){
  const a=(U.pile||[]).pop(); if(!a) return toast('Rien à annuler');
  if(a.k==='d') S.dessins=S.dessins.filter(x=>!a.ids.includes(x.id));
  else if(a.k==='a') S.annotations=S.annotations.filter(x=>!a.ids.includes(x.id));
  else if(a.k==='p'){ S.photos=S.photos.filter(x=>!a.ids.includes(x.id)); a.ids.forEach(id=>{ delImage('ph_'+id); delImage('th_'+id); }); }
  else if(a.k==='o'){ const o=S.ouvertures.find(x=>x.id===a.ids[0]); if(o) Object.assign(o,{fait:false, date:null, faitAt:null, auteur:'', auteurId:''}); }
  else if(a.k==='edit'){ const i=S[a.coll].findIndex(x=>x.id===a.id); if(i>=0) S[a.coll][i]=a.avant; if(a.extra) S[a.coll]=S[a.coll].filter(x=>!a.extra.includes(x.id)); }
  else if(a.k==='del'){ S[a.coll].push(a.item); }
  else if(a.k==='zn') S.zones=S.zones.filter(x=>!a.ids.includes(x.id));
  U.sel=null; if(U.viewer) U.viewer.renderDraw();
  save(); refreshLayers(); renderStepbar(); renderDtools(); if(enBureau()) renderAvSide(); toastMini();
}
function focusSiBesoin(){ if(U.focus){ const f=U.focus; U.focus=null; setTimeout(()=>U.viewer&&U.viewer.focusOn(f[0],f[1]),120); } }
function chefVueObj(){ return U.chefVue==='jour' ? {type:'jour', date:today()} : {type:U.chefVue}; }
function refreshLayers(){
  const plan=curPlan(); if(!U.viewer||!plan) return;
  U.viewer.setSnap([...S.dessins.filter(d=>d.planId===plan.id), ...zonesDe(plan)].filter(x=>!enEdition.has(x.id)));
  U.viewer.lay.innerHTML=buildLayers(plan, enBureau()?U.avVue:chefVueObj())+zonesSVG(plan)+annotSVG(plan)+pinsSVG(plan);
  renderOuv();
}
const VUES={avancement:'Avancement', jour:"Aujourd'hui", toutes:'Toutes les couches'};
function renderVtools(){ renderDtools(); }
function cycleVue(){ const o=Object.keys(VUES); U.chefVue=o[(o.indexOf(U.chefVue)+1)%o.length]; refreshLayers(); renderDtools(); toast('Vue : '+VUES[U.chefVue]); }
function renderStepbar(){
  const el=$('#stepbar'); if(!el) return;
  const plan=curPlan(); const fait={};
  S.dessins.filter(d=>d.planId===plan.id && d.date===today()).forEach(d=>fait[d.etape]=true);
  el.innerHTML=etapesVis(plan.chantierId).map((e,i)=>`<button class="${U.etape===e.id?'on':''}" style="background:${e.couleur};color:${e.texte||'#fff'}" onclick="startStep('${e.id}')">${i+1}. ${esc(e.court)}<small>${fait[e.id]?"✔ fait aujourd'hui":'&nbsp;'}</small></button>`).join('')
    +`<button class="${U.outil==='photo'?'on':''}" style="background:#374151;color:#fff" onclick="basculer('photo')">📷 Photo<small>sur le plan</small></button>`;
}
/* Outils du plan :
   chef   : 'etape' (rectangles d'avancement) | 'select' (↖ sélectionner) | 'stylo' | 'forme' | 'texte' | 'photo' | 'gomme' | 'ouv' (ébrasements)
   bureau : 'zone' (zones de travail) | 'placer' (fenêtres et portes)
   Tout s'enregistre au fur et à mesure ; ↩ annule la dernière action. */
const enEdition = new Set();   // éléments en cours de modification (cachés de leur couche pendant le geste)
function setOutil(o){
  const v=U.viewer; if(!v) return;
  U.outil=o; if(o!=='etape' && o!=='ouv') U.etape=null;
  if(o!=='select') U.sel=null;
  fermerFlyout();
  if(enEdition.size){ enEdition.clear(); refreshLayers(); }
  const c=U.annotCouleur;
  if(o==='etape') v.setMode('draw', etp(curPlan().chantierId,U.etape).couleur);
  else if(o==='zone') v.setMode('draw', U.zoneCouleur, {points:true});
  else if(o==='trou') v.setMode('draw', '#dc2626', {points:true, aimant:false});   // une fenêtre est dans la zone : pas d'aimant sur ses bords
  else if(o==='echelle') v.setMode('echelle', '#dc2626');
  else if(o==='stylo') v.setMode('draw', c, {points:true, nouveaux:false, aimant:false, ligne:true});   // stylo : lignes droites point par point
  else if(o==='forme') v.setMode('forme', c, {forme:U.forme.type, plein:U.forme.plein});
  else if(o==='texte' || o==='photo' || o==='ouv' || o==='placer' || o==='select') v.setMode(o, c);
  else v.setMode('consult');
  renderStepbar(); renderDtools(); updateBanner(); renderOuv();
  if(o==='etape') aideUneFois('etape', 'Glissez d\'un coin à l\'autre pour tracer un rectangle');
  if(o==='zone') aideUneFois('zone4', 'Cliquez les coins un par un, clic droit pour fermer · tirez un coin pour le déplacer');
  if(o==='stylo') aideUneFois('stylo-pts', 'Touchez les points un par un, puis ✔ pour terminer le trait');
  if(o==='trou') aideUneFois('trou2', 'Tracez la partie à déduire dans une zone : cliquez les coins puis clic droit (ou glissez)');
  if(o==='select') aideUneFois('select', 'Touchez un rectangle ou une annotation pour le modifier');
  if(o==='ouv') aideUneFois('ouv', 'Touchez une pastille quand l\'ébrasement est fait');
  if(o==='texte') aideUneFois('texte', 'Touchez l\'endroit où écrire');
}
/* Une étape « ouvertures » (ébrasements) ne se dessine pas : on coche les pastilles */
function startStep(id){ U.etape=id; setOutil(estOuv(etp(curPlan().chantierId,id)) ? 'ouv' : 'etape'); }
function stopDraw(){ setOutil(null); }
const basculer = o => setOutil(U.outil===o ? null : o);

/* ---------- Menus qui s'ouvrent à côté de la barre (stylo, forme, couleur) ---------- */
const STYLOS = [['fin',2,'Trait fin'],['moyen',4,'Trait moyen'],['epais',8,'Trait épais']];
/* Menu du stylo : un « S » dans chaque épaisseur */
const icoStylo = w => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M7 19 C 15 19, 15 12, 12 12 S 9 5, 17 5" fill="none" stroke="currentColor" stroke-width="${w/1.6+1}" stroke-linecap="round"/></svg>`;
/* Icônes de la barre, en traits blancs comme Fieldwire */
const ICO_CRAYON = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"><path d="M4 20 L5 15.5 L16 4.5 a2 2 0 0 1 3 0 l0.5 0.5 a2 2 0 0 1 0 3 L8.5 19 Z"/><path d="M14 6.5 L17.5 10"/><path d="M5 15.5 L8.5 19"/></svg>`;
const ICO_FORMES = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="8.5" width="12" height="12" rx="2.5"/><path d="M8.5 8.5 V6 a2.5 2.5 0 0 1 2.5 -2.5 H18 a2.5 2.5 0 0 1 2.5 2.5 V13 a2.5 2.5 0 0 1 -2.5 2.5 H15.5"/></svg>`;
function icoForme(f, plein){
  const a=plein?'fill="currentColor"':'fill="none"', s='stroke="currentColor" stroke-width="2" stroke-linejoin="round"';
  const d={ rect:`<rect x="4" y="5" width="16" height="14" ${a} ${s}/>`, cercle:`<ellipse cx="12" cy="12" rx="9" ry="7" ${a} ${s}/>`,
    triangle:`<path d="M12 4 L20 19 L4 19 Z" ${a} ${s}/>` }[f] || '';
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">${d}</svg>`;
}
/* Stylo / Forme : 1er toucher = l'outil s'active et son menu s'ouvre ; menu ouvert = on le replie ;
   menu replié = on arrête l'outil. Couleur : ouvre ou replie la palette. */
function clicMenu(type){
  const fl=$('#flyout'), ouvert=fl && !fl.hidden && fl.dataset.type===type;
  if(type==='couleur') return ouvert ? fermerFlyout() : ouvrirFlyout('couleur');
  if(U.outil!==type){ setOutil(type); ouvrirFlyout(type); }
  else if(ouvert) fermerFlyout();
  else stopDraw();
}
function ouvrirFlyout(type){
  const fl=$('#flyout'), btn=$(`#dtools button[data-m="${type}"]`); if(!fl || !btn) return;
  const r=btn.getBoundingClientRect(), w=$('.vwrap').getBoundingClientRect();
  fl.dataset.type=type; fl.style.top=(r.top-w.top)+'px'; fl.style.left=(r.right-w.left+6)+'px';
  const b=(fn,html,titre,on)=>`<button class="${on?'on':''}" onclick="${fn}" title="${titre}" aria-label="${titre}">${html}</button>`;
  if(type==='stylo') fl.innerHTML=STYLOS.map(([k,w,t])=>b(`choisirStylo('${k}')`, icoStylo(w), t, U.outil==='stylo'&&U.stylo===k)).join('');
  if(type==='forme') fl.innerHTML=FORMES.map(([k,t])=>b(`choisirForme('${k}',false)`, icoForme(k,false), t, U.outil==='forme'&&U.forme.type===k)).join('');
  if(type==='couleur') fl.innerHTML=ANNOT_COULEURS.map(([c,n])=>b(`choisirCouleur('${c}')`, `<span class="pastille" style="background:${c}"></span>`, n, (enBureau()?U.zoneCouleur:U.sel?couleurSel():U.annotCouleur)===c)).join('');
  fl.hidden=false;
}
function fermerFlyout(){ const fl=$('#flyout'); if(fl) fl.hidden=true; }
function choisirStylo(k){ U.stylo=k; ls.set('stylo',k); setOutil('stylo'); }
function choisirForme(k,plein){ U.forme={type:k, plein}; ls.set('forme-annot', JSON.stringify(U.forme)); setOutil('forme'); }
/* Toucher le plan replie un menu ouvert */
document.addEventListener('pointerdown', e=>{ const fl=$('#flyout'); if(fl && !fl.hidden && !e.target.closest('#flyout') && !e.target.closest('#dtools')) fermerFlyout(); }, true);
function choisirCouleur(c){
  fermerFlyout();
  if(enBureau()){
    /* Bureau : couleur des prochaines zones ; une zone rectangle en cours de modification change aussi */
    U.zoneCouleur=c; ls.set('zone-couleur',c);
    const v=U.viewer;
    if(v){ v.color=c;
      if(U.outil==='zone' && v.sel!=null && v.meta[v.sel]){ const z=S.zones.find(x=>x.id===v.meta[v.sel].id); if(z){ (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:z.id, avant:JSON.parse(JSON.stringify(z))}); z.couleur=c; v.meta[v.sel].couleur=c; save(); } }
      v.renderDraw(); }
    renderDtools(); return;
  }
  if(U.sel){ modifierSel(x=>{ x.couleur=c; }); return; }   // une annotation sélectionnée change de couleur
  U.annotCouleur=c; ls.set('annot-couleur',c); if(U.viewer) U.viewer.color=c; renderDtools();
}

/* ---------- Barre d'outils verticale à gauche, façon Fieldwire ---------- */
function renderDtools(){
  const el=$('#dtools'); if(!el || !U.viewer) return;
  const o=U.outil, bur=enBureau(), sep='<i class="sep"></i>', pe=document.body.classList.contains('pe');
  const b=(fn,sym,titre,{cls='',on=false,dis=false}={})=>`<button class="${cls}${on?' on':''}" onclick="${fn}" title="${titre}" aria-label="${titre}" ${dis?'disabled':''}>${sym}</button>`;
  let h=b('pleinEcran()', pe?'🗗':'⛶', pe?'Quitter le plein écran':'Plein écran');
  if(bur){
    h+=sep+b("basculer('zone')",ICO_CRAYON,'Tracer une zone de travail (clic droit pour fermer)',{on:o==='zone'})
      +b("clicMenu('couleur')",`<span class="pastille" style="background:${U.zoneCouleur}"></span>`,'Couleur des zones').replace('<button','<button data-m="couleur"')
      +b("basculer('trou')",'✂️','Déduire une surface (fenêtre, porte…)',{on:o==='trou'})
      +b("if(U.outil==='placer') stopDraw(); else { U.ouvType='F'; setOutil('placer'); }",'🪟','Placer les fenêtres et les portes',{on:o==='placer'});
    const n=(o==='zone' || o==='trou') ? U.viewer.pts.length : 0;
    if(n) h+=sep+b('U.viewer.retirerPoint()','↩','Retirer le dernier point');
    else h+=sep+b('annulerDernier()','↩','Annuler ma dernière action',{dis:!(U.pile||[]).length});
    if(o==='trou') h+=sep+b('stopDraw()','✖','Fermer');
    if(o==='placer') h+=sep+b("U.ouvType='F';renderDtools()",'🪟','Placer des fenêtres',{on:U.ouvType==='F'})+b("U.ouvType='P';renderDtools()",'🚪','Placer des portes',{on:U.ouvType==='P'})+b('stopDraw()','✔','Terminé',{cls:'ok'});
    if(o==='zone') h+=sep+(U.viewer.sel!=null?b('U.viewer.supprimerSel()','🗑','Supprimer la zone sélectionnée'):'')+b('stopDraw()','✖','Fermer');
  } else {
    h+=sep+b("basculer('select')",'↖','Sélectionner et modifier',{on:o==='select'})
      +sep+b("clicMenu('stylo')",ICO_CRAYON,'Stylo',{on:o==='stylo'}).replace('<button','<button data-m="stylo"')
      +b("clicMenu('forme')",ICO_FORMES,'Ajouter une forme',{on:o==='forme'}).replace('<button','<button data-m="forme"')
      +b("basculer('texte')",'<b style="font-family:Georgia,serif;font-size:21px">a</b>','Texte',{on:o==='texte'})
      +b("clicMenu('couleur')",`<span class="pastille" style="background:${U.sel?couleurSel():U.annotCouleur}"></span>`,'Couleur').replace('<button','<button data-m="couleur"')
      +sep+b("basculer('photo')",'📷','Photo sur le plan',{on:o==='photo'})+b("basculer('gomme')",'🧽','Gomme',{on:o==='gomme'})
      +sep+b('showStats()','📊','Avancement en m²')
      +sep+b('annulerDernier()','↩','Annuler ma dernière action',{dis:!(U.pile||[]).length});
    /* Stylo point par point : ✔ termine le trait, ✕ retire le dernier point */
    const np=o==='stylo' ? U.viewer.pts.length : 0;
    if(np) h+=sep+b('U.viewer.fermerPoly()','✔',np>=2?'Terminer le trait':'Touchez au moins 2 points',{cls:'ok', dis:np<2})+b('U.viewer.retirerPoint()','⌫','Retirer le dernier point');
    if(o==='select' && U.sel){
      const x=itemSel();
      h+=sep+(x && x.type==='texte'?b('modifierTexteSel()','✎','Modifier le texte'):'')+b('supprimerSel()','🗑','Supprimer')+b('deselectionner()','✖','Désélectionner');
    }
    if(o==='etape'){ const e=etp(curPlan().chantierId,U.etape); h+=sep+`<span class="dcount" style="background:${e.couleur};color:${e.texte||'#fff'}" title="${esc(e.nom)}">${esc(e.court.slice(0,2))}</span>`+b('stopDraw()','✖','Fermer'); }
    if(o==='ouv'){ const plan=curPlan(), e=etp(plan.chantierId,U.etape), so=statsOuv(ouvDe(plan));
      h+=sep+`<span class="dcount large" style="background:${e.couleur};color:${e.texte||'#fff'}" title="${so.faites} ouvertures faites sur ${so.tot}">${so.faites}/${so.tot}</span>`+b('listeOuv()','📋','Liste des fenêtres et portes')+b('stopDraw()','✖','Fermer'); }
  }
  el.hidden=false; el.innerHTML=h;
}
/* Plus de bandeau en haut du plan : tout passe par la barre de gauche */
function updateBanner(){ renderDtools(); const b=$('#banner'); if(b) b.hidden=true; }

/* ---------- Enregistrement automatique des rectangles (étapes et zones) ---------- */
/* Découpe des rectangles du chef par les zones de travail : ce qui dépasse est coupé ; un rectangle
   n'est refusé que s'il est vraiment hors zone (moins de 5 % de sa surface dans une zone) */
function decouper(plan, rects){
  const zs=zonesDe(plan), morceaux=[]; let refuses=0;
  for(const R of rects){
    if(!zs.length || !PC()){ morceaux.push(R); continue; }
    const inter=interM([toPoly(R)], unionZones(plan));
    if(multiArea(inter) < ringArea(R)*0.05){ refuses++; continue; }
    morceaux.push(...inter.map(poly=>poly[0].slice(0,-1)).filter(r=>r.length>=3 && ringArea(r)>1));
  }
  return {morceaux, refuses};
}
const arrondir = m => m.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]);
/* Appelé à chaque rectangle tracé ou modifié dans le viewer */
function rectsTraces(){
  const v=U.viewer;
  if(U.outil==='etape') return enregistrerEtape(v);
  if(U.outil==='zone') return enregistrerZones(v);
  if(U.outil==='trou'){ const R=v.rects.filter((_,i)=>!v.meta[i]); v.rects=[]; v.meta=[]; v.sel=null; v.renderDraw(); R.forEach(ajouterTrou); }
}
/* Coins des zones : avec l'outil ✏️, on tire un coin pour corriger le tracé */
function sommetSous(pt, tol){
  if(U.outil!=='zone') return null;
  for(const z of zonesDe(curPlan()).filter(x=>!enEdition.has(x.id)).reverse()){
    const i=z.points.findIndex(q=>Math.hypot(q[0]-pt[0],q[1]-pt[1])<tol);
    if(i>=0) return {id:z.id, i, couleur:z.couleur, points:z.points.map(q=>[...q])};
  }
  return null;
}
const sommetsVisibles = () => U.outil==='zone' ? zonesDe(curPlan()).filter(z=>!enEdition.has(z.id)).map(z=>z.points) : [];
function sommetDeplace(so){
  const z=S.zones.find(x=>x.id===so.id); enEdition.delete(so.id);
  if(z && ringArea(so.points)>1){
    (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:z.id, avant:JSON.parse(JSON.stringify(z))});
    z.points=arrondir(so.points); majM2(z); save(); toastMini();
  }
  refreshLayers(); renderAvSide(); renderDtools();
}
/* Zone ou partie à déduire tracée par points */
function polyTrace(P){
  const v=U.viewer;
  if(U.outil==='stylo'){ const w=(STYLOS.find(s=>s[0]===U.stylo)||STYLOS[1])[1]; return saveAnnot('stylo', P, '', {epaisseur:w}); }
  if(U.outil==='zone'){ v.rects.push(P); v.meta.push(null); enregistrerZones(v); }
  else if(U.outil==='trou') ajouterTrou(P);
}
/* Partie à déduire : rangée dans la zone qui la contient le plus */
function ajouterTrou(P){
  const plan=curPlan(), T=[toPoly(P)];
  let best=null, ba=0;
  for(const z of zonesDe(plan)){ const a=multiArea(interM(T,[toPoly(z.points)])); if(a>ba){ ba=a; best=z; } }
  if(!best || ba<ringArea(P)*0.5) return toast('Tracez la partie à déduire à l\'intérieur d\'une zone','warn');
  (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:best.id, avant:JSON.parse(JSON.stringify(best))});
  const avant=best.m2, aAv=multiArea(zoneGeom(best));
  best.trous=[...(best.trous||[]), arrondir(P)];
  if(mpp(plan) && best.m2auto!==false) majM2(best);
  else if(best.m2 && aAv) best.m2=+(best.m2*multiArea(zoneGeom(best))/aAv).toFixed(2);   // sans échelle : en proportion de la surface tapée
  save(); refreshLayers(); renderAvSide(); renderDtools();
  toast(best.m2 ? `✂️ −${m2f(avant-best.m2)} · ${best.nom} : ${m2f(best.m2)}` : `✂️ Déduit de ${best.nom}`);
}
/* Échelle : 2 points sur une cote connue, puis sa longueur réelle */
function echelleTracee(P){
  const plan=curPlan();
  askText('Longueur réelle entre les 2 points (en mètres)', '', t=>{
    U.viewer.pts=[]; U.viewer.renderDraw();
    const m=parseFloat(String(t).replace(',','.'));
    if(!(m>0)) return toast('Indiquez une longueur, ex. 20 ou 12,5','warn');
    plan.echelle={a:P[0].map(x=>+x.toFixed(2)), b:P[1].map(x=>+x.toFixed(2)), m:+m.toFixed(3)};
    zonesDe(plan).forEach(z=>{ if(z.m2auto!==false || !z.m2){ z.m2auto=true; majM2(z); } });
    save(); setOutil(null); refreshLayers(); renderAvSide();
    toast(`📏 Échelle réglée : ${num(m,2)} m. Les m² des zones se calculent tout seuls.`);
  }, 'inputmode="decimal" placeholder="Ex. 20 ou 12,5"', 'Valider');
}
function enregistrerEtape(v){
  const rects=v.rects.slice(); v.rects=[]; v.meta=[]; v.sel=null; v.renderDraw();
  if(!rects.length) return;
  const plan=curPlan(), e=etp(plan.chantierId,U.etape), {morceaux, refuses}=decouper(plan, rects);
  if(!morceaux.length) return toast('Dessinez à l\'intérieur d\'une zone de travail','warn');
  const ids=[];
  for(const m of morceaux){ const id=uid(); ids.push(id); S.dessins.push({id, planId:plan.id, chantierId:plan.chantierId, etape:e.id, date:today(), auteur:nomChef(), auteurId:U.chefId, points:arrondir(m), createdAt:Date.now()}); }
  (U.pile=U.pile||[]).push({k:'d', ids});
  save(); refreshLayers(); renderStepbar(); renderDtools();
  if(refuses) toast('Rectangle hors zone ignoré','warn'); else toastMini();
}
/* Bureau : une zone tracée est créée aussitôt, puis une petite case demande sa surface ;
   une zone déplacée, étirée ou supprimée est enregistrée tout de suite */
function enregistrerZones(v){
  const plan=curPlan(), nouvelles=[];
  v.rects.forEach((R,i)=>{ const m=v.meta[i];
    if(m){ const z=S.zones.find(x=>x.id===m.id); if(z){ (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:z.id, avant:JSON.parse(JSON.stringify(z))}); z.points=arrondir(R); majM2(z); } }
    else { const z={id:uid(), planId:plan.id, chantierId:plan.chantierId, nom:`Zone ${zonesDe(plan).length+nouvelles.length+1}`, m2:0, couleur:U.zoneCouleur, points:arrondir(R), createdAt:Date.now()}; majM2(z); nouvelles.push(z); }
  });
  v.retires.forEach(m=>{ const z=S.zones.find(x=>x.id===m.id); if(z){ (U.pile=U.pile||[]).push({k:'del', coll:'zones', item:JSON.parse(JSON.stringify(z))}); S.zones=S.zones.filter(x=>x.id!==z.id); } });
  S.zones.push(...nouvelles);
  v.rects=[]; v.meta=[]; v.retires=[]; v.sel=null; enEdition.clear();
  save(); refreshLayers(); v.renderDraw(); renderAvSide(); renderDtools();
  if(nouvelles.length){
    /* Avec une échelle, la surface est calculée : pas de question ; sinon on la demande */
    if(mpp(plan)) toast(`▭ ${nouvelles.map(z=>`${z.nom} : ${m2f(z.m2)}`).join(' · ')}`);
    else { (U.pile=U.pile||[]).push({k:'zn', ids:nouvelles.map(z=>z.id)}); const z=nouvelles[0]; sheetZone(z, (nom,m2)=>{ z.nom=nom; z.m2=m2; z.m2auto=false; save(); refreshLayers(); renderAvSide(); }, true); }
    if(mpp(plan)) (U.pile=U.pile||[]).push({k:'zn', ids:nouvelles.map(z=>z.id)});
  }
  else toastMini();
}
/* ↩ pendant un tracé = annuler la dernière action */
function undoPt(){ annulerDernier(); }

/* ---------- Zones de travail (bureau) ---------- */
function reprendre(pt){
  if(U.outil!=='zone') return false;
  const plan=curPlan(), z=zonesDe(plan).filter(x=>!enEdition.has(x.id) && inPoly(pt,x.points)).pop();
  if(!z) return false;
  if(!estRect(z.points)){ toast('Cette zone n\'est pas un rectangle : supprimez-la et retracez-la','warn'); return true; }
  enEdition.add(z.id); refreshLayers();
  U.viewer.charger(z.points, {kind:'zone', id:z.id, nom:z.nom, couleur:z.couleur||'#1d4ed8'});
  renderDtools();
  return true;
}
function sheetZone(z, fn, nouvelle=false){
  _ask=fn;
  openSheet(`<h2>${nouvelle?'▭ Surface de la nouvelle zone':'Modifier la zone'}</h2>
    <label class="f">Surface réelle (m²)<input type="text" id="zM2" inputmode="decimal" value="${z?.m2?String(z.m2).replace('.',','):''}" placeholder="Ex. 40 ou 18,5" style="font-size:20px"></label>
    <label class="f" style="margin-top:10px">Nom de la zone<input type="text" id="zNom" value="${esc(z?.nom||'')}" maxlength="40" placeholder="Ex. Façade Sud – R+1"></label>
    <div class="row" style="margin-top:14px"><button class="btn" onclick="validZone()">Enregistrer</button><button class="btn sec" onclick="closeSheet()">${nouvelle?'Plus tard':'Annuler'}</button></div>`);
  setTimeout(()=>$('#zM2')?.focus(),50);
  $('#zM2')?.addEventListener('keydown', e=>{ if(e.key==='Enter') validZone(); });
}
function validZone(){
  const n=$('#zNom').value.trim(), m=parseFloat(String($('#zM2').value).replace(',','.'));
  if(!n) return toast('Donnez un nom à la zone'); if(!(m>0)) return toast('Indiquez la surface en m²');
  const f=_ask; closeSheet(); f(n, +m.toFixed(2));
}
/* Depuis la fiche d'une zone : reprendre sa forme pour la déplacer ou l'étirer */
function modifierFormeZone(id){
  closeSheet(); const z=S.zones.find(x=>x.id===id); if(!z) return;
  setOutil('zone');
  if(!estRect(z.points)) return toast('Tirez un coin de la zone pour le déplacer');
  enEdition.add(z.id); refreshLayers(); U.viewer.charger(z.points, {kind:'zone', id:z.id, nom:z.nom, couleur:z.couleur||'#1d4ed8'}); renderDtools();
}

/* ---------- ↖ Sélectionner : rectangles d'étape et annotations du chef ----------
   La modification est enregistrée dès qu'on lâche. */
function itemSel(){ if(!U.sel) return null; return (U.sel.k==='d'?S.dessins:S.annotations).find(x=>x.id===U.sel.id)||null; }
const couleurSel = () => { const x=itemSel(); return x && U.sel.k==='a' ? x.couleur : U.annotCouleur; };
/* Comment se modifie l'élément : 'box' (poignées du cadre), 'pts' (chaque point), 'texte' (déplacer seulement) */
function genreSel(x, k){
  if(k==='d') return 'box';
  if(x.type==='texte') return 'texte';
  if(x.type==='forme' && x.forme!=='poly') return 'box';
  return 'pts';
}
function bboxItem(x, k){
  if(k==='a' && x.type==='texte'){ const T=tailleTexte(curPlan()), [px,py]=x.points[0]; return {x0:px, y0:py-T, x1:px+x.texte.length*T*.6, y1:py+T*.2}; }
  return bbox(x.points);
}
function choisirSous(pt){
  const plan=curPlan(), tol=22/(U.viewer?.s||1);
  const an=S.annotations.filter(a=>a.planId===plan.id && hitAnnot(plan,a,pt,tol)).sort((a,b)=>b.createdAt-a.createdAt)[0];
  if(an) return {k:'a', x:an};
  const d=S.dessins.filter(x=>x.planId===plan.id && inPoly(pt,x.points)).sort((a,b)=>b.createdAt-a.createdAt)[0];
  return d ? {k:'d', x:d} : null;
}
function selectTap(pt){
  const t=choisirSous(pt);
  if(!t){ U.sel=null; }
  else if(!estAMoi(t.x)){ toast('Fait par un autre chef : demandez au bureau','warn'); U.sel=null; }
  else if(t.k==='d' && !estRect(t.x.points)){ toast('Cette forme ne peut pas être modifiée : effacez-la et retracez-la','warn'); U.sel=null; }
  else U.sel={k:t.k, id:t.x.id};
  U.viewer.renderDraw(); renderDtools();
}
function deselectionner(){ U.sel=null; U.viewer?.renderDraw(); renderDtools(); }
/* Poignées et contour de l'élément sélectionné (géométrie en cours pendant un geste) */
function selSVG(s){
  const x=itemSel(); if(!x) return '';
  const g=genreSel(x,U.sel.k), P=U.selGeom||x.points, it={...x, points:P}, r=8/s;
  let h='';
  if(enEdition.has(x.id)) h+= U.sel.k==='d' ? `<polygon points="${P.map(p=>p.join(',')).join(' ')}" fill="${etp(x.chantierId,x.etape).couleur}" fill-opacity=".45" stroke="none"/>` : annotUneSVG(it, curPlan());
  const b=bboxItem(it, U.sel.k);
  h+=`<rect x="${b.x0}" y="${b.y0}" width="${b.x1-b.x0}" height="${b.y1-b.y0}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
  const rond=(cx,cy)=>`<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="#2563eb" stroke-width="3" vector-effect="non-scaling-stroke"/>`;
  if(g==='box') for(const [fx,fy] of Object.values(POIGNEES)) h+=rond(b.x0+(b.x1-b.x0)*fx, b.y0+(b.y1-b.y0)*fy);
  if(g==='pts') P.forEach(p=>{ h+=rond(p[0],p[1]); });
  return h;
}
/* Début d'un geste en mode sélection : poignée, point ou corps de l'élément sélectionné */
function selDown(pt){
  const x=itemSel(); if(!x) return null;
  const k=U.sel.k, g=genreSel(x,k), s=U.viewer.s, tol=18/s, orig=x.points.map(p=>[...p]), b=bboxItem(x,k);
  let applique=null;
  if(g==='box'){
    for(const [h,[fx,fy]] of Object.entries(POIGNEES)) if(Math.hypot(pt[0]-(b.x0+(b.x1-b.x0)*fx), pt[1]-(b.y0+(b.y1-b.y0)*fy))<tol){
      applique=q=>{ let {x0,y0,x1,y1}=b; if(h.includes('w')) x0=q[0]; if(h.includes('e')) x1=q[0]; if(h.includes('n')) y0=q[1]; if(h.includes('s')) y1=q[1];
        const a=[Math.min(x0,x1),Math.min(y0,y1)], c=[Math.max(x0,x1),Math.max(y0,y1)]; return k==='d' ? rectPts(a,c) : [a,c]; };
      break;
    }
  }
  if(!applique && g==='pts'){
    const i=orig.findIndex(p=>Math.hypot(pt[0]-p[0],pt[1]-p[1])<tol);
    if(i>=0) applique=q=>orig.map((p,j)=>j===i?[q[0],q[1]]:p);
  }
  const dedans = pt[0]>=b.x0-tol && pt[0]<=b.x1+tol && pt[1]>=b.y0-tol && pt[1]<=b.y1+tol;
  if(!applique && dedans) applique=q=>orig.map(p=>[p[0]+q[0]-pt[0], p[1]+q[1]-pt[1]]);
  if(!applique) return null;
  return {
    move(q){ if(!enEdition.has(x.id)){ enEdition.add(x.id); refreshLayers(); } U.selGeom=applique(q); },
    up(q){ const P=applique(q); U.selGeom=null; enEdition.delete(x.id); validerGeom(x, k, P); },
    cancel(){ U.selGeom=null; enEdition.delete(x.id); refreshLayers(); }
  };
}
/* Enregistrement immédiat d'une modification (avec la possibilité de l'annuler par ↩) */
function validerGeom(x, k, P){
  const avant=JSON.parse(JSON.stringify(x));
  if(k==='d'){
    const plan=curPlan(), {morceaux}=decouper(plan,[P]);
    if(!morceaux.length){ toast('Dessinez à l\'intérieur d\'une zone de travail','warn'); refreshLayers(); return; }
    x.points=arrondir(morceaux[0]);
    const extra=morceaux.slice(1).map(m=>({...x, id:uid(), points:arrondir(m), createdAt:Date.now()}));
    S.dessins.push(...extra);
    (U.pile=U.pile||[]).push({k:'edit', coll:'dessins', id:x.id, avant, extra:extra.map(e=>e.id)});
  } else {
    x.points=P.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)]);
    (U.pile=U.pile||[]).push({k:'edit', coll:'annotations', id:x.id, avant});
  }
  save(); refreshLayers(); renderDtools(); toastMini();
}
function modifierSel(fn){
  const x=itemSel(); if(!x) return;
  (U.pile=U.pile||[]).push({k:'edit', coll:U.sel.k==='d'?'dessins':'annotations', id:x.id, avant:JSON.parse(JSON.stringify(x))});
  fn(x); save(); refreshLayers(); U.viewer.renderDraw(); renderDtools(); toastMini();
}
function modifierTexteSel(){ const x=itemSel(); if(!x) return; askText('Modifier le texte', x.texte, t=>{ t=t.trim(); if(t) modifierSel(y=>{ y.texte=t; }); }, 'maxlength="60"'); }
function supprimerSel(){
  const x=itemSel(); if(!x) return;
  const coll=U.sel.k==='d'?'dessins':'annotations';
  (U.pile=U.pile||[]).push({k:'del', coll, item:JSON.parse(JSON.stringify(x))});
  S[coll]=S[coll].filter(y=>y.id!==x.id); U.sel=null;
  save(); refreshLayers(); U.viewer.renderDraw(); renderStepbar(); renderDtools(); toastMini();
}
function editZone(id){ const z=S.zones.find(x=>x.id===id); sheetZone(z, (nom,m2)=>{ if(m2!==z.m2) z.m2auto=false; z.nom=nom; z.m2=m2; save(); refreshLayers(); renderAvSide(); toast('✔ Zone modifiée'); }); }
function delZone(id){ const z=S.zones.find(x=>x.id===id); askConfirm(`Supprimer la zone « ${z.nom} » ? Les dessins des chefs restent enregistrés.`, ()=>{ S.zones=S.zones.filter(x=>x.id!==id); save(); refreshLayers(); renderAvSide(); }); }
function ficheZone(z, bureau){
  const r=statsZone(z), plan=S.plans.find(p=>p.id===z.planId);
  const nt=(z.trous||[]).length, calc=m2Calcule(z,plan);
  return `<div class="zfiche"><div class="row"><b class="grow">▭ ${esc(z.nom)}</b><b>${m2f(z.m2)}</b></div>
    ${bureau?`<div class="row" style="margin:-2px 0 6px;gap:6px">${ANNOT_COULEURS.map(([c,n])=>`<button class="pastille${(z.couleur||'#1d4ed8')===c?' on':''}" style="background:${c}" title="${n}" aria-label="Couleur ${n}" onclick="couleurZone('${z.id}','${c}')"></button>`).join('')}
      ${calc!=null && z.m2auto===false?`<span class="hint">L'échelle donne ${m2f(calc)} <button class="btn sec sm" onclick="recalcZone('${z.id}')">Utiliser le calcul</button></span>`:''}
      ${nt?`<span class="hint">✂️ ${nt} partie${nt>1?'s':''} déduite${nt>1?'s':''}</span> <button class="btn sec sm" onclick="retirerTrous('${z.id}')">Retirer les déductions</button>`:''}</div>`:''}
    <table><tbody>${etapesAffichees(plan).filter(e=>!estOuv(e)).map(e=>{ const f=r[e.id]||0, fini=f>=z.m2-0.05;
      return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${fini?'✔ ':''}${m2f(f)} / ${m2f(z.m2)}</td><td class="num">${fini?'':`<b>reste ${m2f(z.m2-f)}</b>`}</td></tr>`; }).join('')}</tbody></table>
    ${bureau?`<div class="row" style="margin-top:8px"><button class="btn sec sm" onclick="editZone('${z.id}')">Nom et m²</button>${U.btab==='avancement'?`<button class="btn sec sm" onclick="modifierFormeZone('${z.id}')">✏️ Modifier la forme</button>`:''}<button class="btn bad sm" onclick="delZone('${z.id}')">Supprimer la zone</button></div>`:''}</div>`;
}
function couleurZone(id,c){
  const z=S.zones.find(x=>x.id===id); if(!z) return;
  (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:z.id, avant:JSON.parse(JSON.stringify(z))});
  z.couleur=c; save(); closeSheet(); refreshLayers(); renderAvSide(); toastMini();
}
function recalcZone(id){ const z=S.zones.find(x=>x.id===id); if(!z) return; z.m2auto=true; majM2(z); save(); closeSheet(); refreshLayers(); renderAvSide(); toast(`${z.nom} : ${m2f(z.m2)}`); }
function retirerTrous(id){
  const z=S.zones.find(x=>x.id===id); if(!z) return;
  askConfirm(`Retirer les ${z.trous.length} partie(s) déduite(s) de « ${z.nom} » ?`, ()=>{
    (U.pile=U.pile||[]).push({k:'edit', coll:'zones', id:z.id, avant:JSON.parse(JSON.stringify(z))});
    const aAv=multiArea(zoneGeom(z)), plan=S.plans.find(p=>p.id===z.planId);
    z.trous=[];
    if(mpp(plan) && z.m2auto!==false) majM2(z); else if(z.m2 && aAv) z.m2=+(z.m2*multiArea(zoneGeom(z))/aAv).toFixed(2);
    save(); refreshLayers(); renderAvSide(); renderDtools(); toast(`${z.nom} : ${m2f(z.m2)}`);
  }, 'Retirer');
}
/* Annotation enregistrée dès qu'on lève le doigt */
function saveAnnot(type, pts, texte='', extra={}){
  const plan=curPlan();
  const id=uid();
  S.annotations.push({id, planId:plan.id, chantierId:plan.chantierId, type, couleur:U.annotCouleur, points:pts.map(p=>[+p[0].toFixed(1),+p[1].toFixed(1)]), texte, ...extra, date:today(), auteur:nomChef(), auteurId:U.chefId, createdAt:Date.now()});
  (U.pile=U.pile||[]).push({k:'a', ids:[id]});
  save(); refreshLayers(); renderDtools();
}
function traitStylo(pts){ const w=(STYLOS.find(s=>s[0]===U.stylo)||STYLOS[1])[1]; saveAnnot('stylo', alleger(pts, 2.5/(U.viewer?.s||1)), '', {epaisseur:w}); }
function formeTracee(pts){ saveAnnot('forme', pts, '', {forme:U.forme.type, plein:U.forme.plein}); }
function texteTap(pt){ askText('Texte à écrire sur le plan', '', t=>{ t=t.trim(); if(t) saveAnnot('texte',[pt],t); }, 'maxlength="60"', 'Écrire'); }
/* Gomme : dessins d'étapes et annotations du chef à cet endroit */
function aCetEndroit(pt, vue){
  const plan=curPlan(), tol=24/(U.viewer?.s||1);
  let ds=S.dessins.filter(d=>d.planId===plan.id && inPoly(pt,d.points));
  if(vue.type==='jour') ds=ds.filter(d=>d.date===vue.date);
  if(vue.type==='etape') ds=ds.filter(d=>d.etape===vue.etape);
  const an=U.showNotes ? S.annotations.filter(a=>a.planId===plan.id && hitAnnot(plan,a,pt,tol)) : [];
  return {ds, an};
}
const libAnnot = a => a.type==='texte' ? `🔤 Texte « ${esc(a.texte)} »` : a.type==='fleche' ? '↗️ Flèche' : '✏️ Trait au stylo';
/* Gomme : rectangles, annotations et épingles de photos du chef à cet endroit */
function gommeTap(pt){
  const plan=curPlan(), {ds, an}=aCetEndroit(pt, chefVueObj()), pin=hitPin(plan, pt);
  if(!ds.length && !an.length && !pin) return toast('Rien à effacer à cet endroit');
  const items=[...(pin?[{k:'p',x:pin}]:[]), ...an.map(a=>({k:'a',x:a})), ...ds.map(d=>({k:'d',x:d}))].filter(i=>estAMoi(i.x)).sort((a,b)=>b.x.createdAt-a.x.createdAt);
  if(!items.length) return toast('Fait par un autre chef : demandez au bureau','warn');
  const lib=({k,x})=> k==='d' ? esc(etp(plan.chantierId,x.etape).nom) : k==='p' ? `📍 Photo${x.note?' « '+esc(x.note)+' »':''}` : libAnnot(x);
  const col=({k,x})=> k==='d' ? etp(plan.chantierId,x.etape).couleur : k==='p' ? '#dc2626' : (x.couleur==='#ffffff'?'#9ca3af':x.couleur);
  openSheet(`<h2>🧽 Effacer quoi ?</h2>${items.map(i=>`<button class="chantier-card" style="border-left:10px solid ${col(i)};font-size:18px" onclick="gommeDel('${i.k}','${i.x.id}')">${lib(i)}<small>${fmtLong(i.x.date)}</small></button>`).join('')}
    <button class="btn sec" onclick="closeSheet()">Annuler</button>`);
}
function gommeDel(k,id){
  if(k==='d') S.dessins=S.dessins.filter(x=>x.id!==id);
  else if(k==='p'){ S.photos=S.photos.filter(x=>x.id!==id); delImage('ph_'+id); delImage('th_'+id); }
  else S.annotations=S.annotations.filter(x=>x.id!==id);
  save(); closeSheet(); refreshLayers(); renderStepbar(); toastMini();
}
function consultTap(pt, bureau){
  const plan=curPlan();
  const ouv=hitOuv(plan, pt);
  if(ouv) return ficheOuv(ouv, bureau);
  const pin = U.showNotes && hitPin(plan, pt);
  if(pin){ U.phList=S.photos.filter(p=>p.planId===plan.id).sort((a,b)=>b.createdAt-a.createdAt).map(p=>p.id); return openPhoto(pin.id); }
  const {ds, an}=aCetEndroit(pt, bureau?U.avVue:chefVueObj());
  /* Les fiches en m² des zones ne s'ouvrent qu'au bureau ; le chef a ses m² avec 📊 */
  const zs=bureau ? zonesDe(plan).filter(z=>inPoly(pt,z.points)) : [];
  if(!ds.length && !an.length && !zs.length) return;
  ds.sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  const ligne=(col,titre,x,k)=>`<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line);flex-wrap:nowrap"><span class="dot" style="background:${col};border:1px solid #9ca3af"></span><div class="grow"><b>${titre}</b><div class="hint">${fmtShort(x.date)} · ${esc(x.auteur)}</div></div>${bureau||estAMoi(x)?`<button class="btn bad sm" onclick="delElem('${k}','${x.id}',${bureau})">Supprimer</button>`:''}</div>`;
  openSheet(`<h2>À cet endroit</h2>${zs.map(z=>ficheZone(z,bureau)).join('')}${ds.length?'<div class="hint" style="margin-top:4px">Dessins</div>':''}${ds.map(d=>{ const e=etp(plan.chantierId,d.etape); return ligne(e.couleur, esc(e.nom), d, 'd'); }).join('')}${an.map(a=>ligne(a.couleur, libAnnot(a), a, 'a')).join('')}
    <div style="margin-top:14px"><button class="btn sec" onclick="closeSheet()">Fermer</button></div>`);
}
function delElem(k, id, bureau){
  askConfirm(k==='d'?'Supprimer ce dessin ?':'Supprimer cette annotation ?', ()=>{
    if(k==='d') S.dessins=S.dessins.filter(d=>d.id!==id); else S.annotations=S.annotations.filter(a=>a.id!==id);
    save(); refreshLayers(); if(bureau) renderAvSide(); else renderStepbar();
  });
}
function showStats(){
  const plan=curPlan(); const st=statsPlan(plan), prod=productionJour(plan.chantierId, today()), E=etapesAffichees(plan);
  const lignesProd=E.filter(e=>prod[e.id]>0).map(e=>`<div class="mrow"><span class="ml"><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</span><b>+${estOuv(e)?prod[e.id]+' ouverture'+(prod[e.id]>1?'s':''):m2f(prod[e.id])}</b></div>`).join('');
  openSheet(`<h2>📊 ${esc(plan.nom)}</h2>${tableStats(plan, st)}
    <h3 style="margin:16px 0 6px">🗓️ Posé aujourd'hui sur ce chantier</h3>${lignesProd||'<p class="hint" style="margin:0">Rien pour l\'instant.</p>'}
    <div style="margin-top:14px"><button class="btn sec" onclick="closeSheet()">Fermer</button></div>`);
}
const ligneOuvStats = (e, so) => { const pc=so.tot?so.faites/so.tot*100:0;
  return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${so.faites} / ${so.tot}</td><td class="num"><b>${so.tot-so.faites} ouv.</b></td><td style="min-width:70px"><div class="bar"><i style="width:${pc}%;background:${e.couleur}"></i></div></td></tr>`; };
function tableStats(plan, st){
  const E=etapesAffichees(plan), so=st.ouv||statsOuv(ouvDe(plan));
  if(st.m2){
    const {tot,fait,zones}=st.m2;
    return `<p class="hint" style="margin:0 0 8px">${zones.length} zone${zones.length>1?'s':''} de travail · <b>${m2f(tot)}</b> au total. Touchez une zone sur le plan pour son détail.</p>
    <div class="tbl"><table><thead><tr><th>Étape</th><th class="num">Fait</th><th class="num">Reste</th><th></th></tr></thead><tbody>
    ${E.map(e=>{ if(estOuv(e)) return ligneOuvStats(e, so); const f=fait[e.id]||0, pc=tot?clamp(f/tot*100,0,100):0;
      return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${m2f(f)}</td><td class="num"><b>${m2f(Math.max(tot-f,0))}</b></td><td style="min-width:70px"><div class="bar"><i style="width:${pc}%;background:${e.couleur}"></i></div></td></tr>`; }).join('')}
    </tbody></table></div>`;
  }
  if(!st.ref) return '<p class="muted">Rien de dessiné sur ce plan pour l\'instant.</p>';
  return `<p class="hint" style="margin:0 0 8px">100 % = toute la surface dessinée sur ce plan (toutes étapes confondues).</p>
  <div class="tbl"><table><thead><tr><th>Étape</th><th>Avancement</th><th class="num">Reste</th><th></th></tr></thead><tbody>
  ${E.map(e=>{ if(estOuv(e)) return ligneOuvStats(e, so); const pc=st.pct(e.id);
    return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${fmtPct(pc)}</td><td class="num">${fmtPct(100-pc)}</td><td style="min-width:70px"><div class="bar"><i style="width:${pc}%;background:${e.couleur}"></i></div></td></tr>`; }).join('')}
  </tbody></table></div>`;
}

/* ---------- Ébrasements : cocher les ouvertures ---------- */
function ouvToggle(id, depuisListe){
  const o=S.ouvertures.find(x=>x.id===id); if(!o) return;
  const fin=()=>{ save(); refreshLayers(); updateBanner(); if(depuisListe) listeOuv(); };
  if(!o.fait){
    Object.assign(o, {fait:true, date:today(), faitAt:Date.now(), auteur:enBureau()?'Bureau':nomChef(), auteurId:enBureau()?'':U.chefId});
    if(enBureau()) toast(`✔ ${libOuv(o)} : ébrasement fait`); else { toastMini(); (U.pile=U.pile||[]).push({k:'o', ids:[o.id]}); }
    fin();
  } else {
    if(!enBureau() && !estAMoi(o)) return toast(`${libOuv(o)} a été coché par ${o.auteur} : demandez au bureau`,'warn');
    bulleSupprimer(()=>{ Object.assign(o,{fait:false, date:null, auteur:'', auteurId:''}); fin(); });
  }
}
function ouvTap(pt){
  const o=hitOuv(curPlan(), pt);
  if(!o) return toast(ouvDe(curPlan()).length ? 'Touchez une pastille 🪟 ou 🚪' : 'Le bureau n\'a pas encore placé les ouvertures sur ce plan');
  ouvToggle(o.id);
}
function listeOuv(){
  const plan=curPlan(), L=ouvDe(plan).slice().sort((a,b)=>a.type.localeCompare(b.type)||a.num-b.num);
  openSheet(`<h2>🟥 Ébrasements · ${libStatsOuv(statsOuv(L))}</h2>
    ${L.length?`<div class="checklist">${L.map(o=>`<label><input type="checkbox" ${o.fait?'checked':''} onclick="event.preventDefault();ouvToggle('${o.id}',true)"> ${libOuv(o)}<span class="hint grow" style="text-align:right">${o.fait?`${fmtShort(o.date)} · ${esc(o.auteur)}`:'à faire'}</span></label>`).join('')}</div>`:'<p class="muted">Aucune ouverture placée sur ce plan.</p>'}
    <button class="btn sec" onclick="closeSheet()">Fermer</button>`);
}
function ficheOuv(o, bureau){
  openSheet(`<h2>${libOuv(o)} · ${TYPES_OUV[o.type].l}</h2>
    <p>${o.fait?`<span class="badge ok">✔ Ébrasement fait</span> le ${fmtLong(o.date)} par ${esc(o.auteur)}`:'<span class="badge warn">À faire</span>'}</p>
    <div class="row">${bureau?`<button class="btn" onclick="closeSheet();ouvToggle('${o.id}')">${o.fait?'Annuler l\'ébrasement':'✔ Marquer fait'}</button>
      <button class="btn sec" onclick="changerTypeOuv('${o.id}')">Changer en ${o.type==='F'?'porte 🚪':'fenêtre 🪟'}</button>
      <button class="btn bad" onclick="delOuv('${o.id}')">Supprimer</button>`:''}<button class="btn sec" onclick="closeSheet()">Fermer</button></div>`);
}
/* Bureau : placer les pastilles, numérotées automatiquement F1, F2… / P1, P2… */
function prochainNum(plan, type){ return Math.max(0, ...ouvDe(plan).filter(o=>o.type===type).map(o=>o.num))+1; }
function placerTap(pt){
  const plan=curPlan(), o=hitOuv(plan, pt);
  if(o) return ficheOuv(o, true);
  S.ouvertures.push({id:uid(), planId:plan.id, chantierId:plan.chantierId, type:U.ouvType, num:prochainNum(plan,U.ouvType), x:+pt[0].toFixed(1), y:+pt[1].toFixed(1), fait:false, date:null, auteur:'', auteurId:'', createdAt:Date.now()});
  save(); refreshLayers(); updateBanner(); renderAvSide();
}
function changerTypeOuv(id){ const o=S.ouvertures.find(x=>x.id===id), plan=S.plans.find(p=>p.id===o.planId); o.type=o.type==='F'?'P':'F'; o.num=prochainNum(plan,o.type); save(); closeSheet(); refreshLayers(); renderAvSide(); }
function delOuv(id){ const o=S.ouvertures.find(x=>x.id===id); askConfirm(`Supprimer ${libOuv(o)} du plan ?`, ()=>{ S.ouvertures=S.ouvertures.filter(x=>x.id!==id); save(); refreshLayers(); renderAvSide(); updateBanner(); }); }

/* ---------- Production du jour (en m² par étape, ouvertures en nombre) ----------
   Pour chaque étape, seul ce qui est nouveau ce jour-là compte : une surface déjà dessinée
   un autre jour pour la même étape n'est pas comptée une deuxième fois. */
function productionJour(chId, d){
  const res={};
  for(const pl of S.plans.filter(p=>p.chantierId===chId)){
    const zs=zonesDe(pl); if(!zs.length) continue;
    const ds=S.dessins.filter(x=>x.planId===pl.id);
    for(const e of etapesTout(chId)){
      if(estOuv(e)) continue;
      const jour=ds.filter(x=>x.etape===e.id && x.date===d); if(!jour.length) continue;
      const avant=unionDessins(ds.filter(x=>x.etape===e.id && x.date<d)), uj=unionDessins(jour), neuf=avant.length?diffM(uj,avant):uj;
      for(const z of zs){ const za=ringArea(z.points); if(za) res[e.id]=(res[e.id]||0)+multiArea(interM(neuf,[toPoly(z.points)]))/za*z.m2; }
    }
  }
  const eo=etapesTout(chId).find(estOuv);
  if(eo){ const n=S.ouvertures.filter(o=>o.chantierId===chId && o.fait && o.date===d).length; if(n) res[eo.id]=n; }
  return res;
}
/* Fait « à la date d » (inclus), pour la colonne Total fait de la production */
function faitJusqua(chId, e, d){
  if(estOuv(e)) return S.ouvertures.filter(o=>o.chantierId===chId && o.fait && o.date<=d).length;
  let t=0;
  for(const pl of S.plans.filter(p=>p.chantierId===chId)){
    const u=unionDessins(S.dessins.filter(x=>x.planId===pl.id && x.etape===e.id && x.date<=d)); if(!u.length) continue;
    for(const z of zonesDe(pl)){ const za=ringArea(z.points); if(za) t+=Math.min(z.m2, multiArea(interM(u,[toPoly(z.points)]))/za*z.m2); }
  }
  return t;
}
const totalZonesCh = chId => S.zones.filter(z=>z.chantierId===chId).reduce((s,z)=>s+z.m2,0);
const fmtQte = (e,v) => estOuv(e) ? `${Math.round(v)} ouv.` : m2f(v);

/* ---------- Photos ---------- */
async function compresser(file, max, q){
  const url=URL.createObjectURL(file);
  try{
    const im=new Image(); await new Promise((r,j)=>{ im.onload=r; im.onerror=()=>j(new Error('Photo illisible')); im.src=url; });
    const k=Math.min(1, max/Math.max(im.naturalWidth,im.naturalHeight));
    const c=document.createElement('canvas'); c.width=Math.round(im.naturalWidth*k); c.height=Math.round(im.naturalHeight*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    return await new Promise(r=>c.toBlob(r,'image/jpeg',q));
  } finally { URL.revokeObjectURL(url); }
}
async function ajouterPhotos(files, ctx){
  files=[...files].filter(f=>f.type.startsWith('image/')||/\.(jpe?g|png|heic|webp)$/i.test(f.name)); if(!files.length) return [];
  toast(`Ajout de ${files.length} photo${files.length>1?'s':''}…`);
  const out=[];
  for(const f of files){
    try{
      const id=uid();
      await putImage('ph_'+id, await compresser(f,1600,.82));
      await putImage('th_'+id, await compresser(f,360,.7));
      const p={id, chantierId:ctx.chantierId, planId:ctx.planId||null, x:ctx.x??null, y:ctx.y??null, date:today(), auteur:enBureau()?'Bureau':nomChef(), auteurId:enBureau()?'':U.chefId, note:'', createdAt:Date.now()};
      S.photos.push(p); out.push(p);
    }catch(e){ console.error(e); toast('Une photo n\'a pas pu être ajoutée : '+e.message,'warn'); }
  }
  save();
  if(out.length===1) askText('Ajouter une note à la photo (facultatif)', '', t=>{ out[0].note=t.trim(); save(); }, 'maxlength="120" placeholder="Ex. Façade Sud, angle nord-est"');
  else if(out.length) toast(`✔ ${out.length} photos ajoutées`);
  return out;
}
/* Deux façons d'ajouter : l'appareil photo s'ouvre directement, ou la galerie */
function boutonsPhoto(handler){
  return `<label class="bigbtn" style="justify-content:center;cursor:pointer">📷 Prendre une photo<input type="file" accept="image/*" capture="environment" hidden onchange="${handler}"></label>
    <label class="btn sec" style="display:block;text-align:center;margin-top:10px;padding:14px;cursor:pointer">🖼️ Galerie<input type="file" accept="image/*" multiple hidden onchange="${handler}"></label>`;
}
function photoTap(pt){ U.photoPt=pt; openSheet(`<h2>📷 Photo à cet endroit</h2>${boutonsPhoto('photoPlanChoisie(this)')}<button class="btn sec" style="margin-top:10px;width:100%" onclick="closeSheet()">Annuler</button>`); }
async function photoPlanChoisie(input){
  const plan=curPlan(), pt=U.photoPt, files=[...input.files]; closeSheet(); if(!files.length||!pt) return;
  const ajout=await ajouterPhotos(files, {chantierId:plan.chantierId, planId:plan.id, x:+pt[0].toFixed(1), y:+pt[1].toFixed(1)});
  if(ajout.length) (U.pile=U.pile||[]).push({k:'p', ids:ajout.map(p=>p.id)});
  stopDraw(); refreshLayers();
}
async function photosPage(input, chId){ const files=[...input.files]; if(!files.length) return; await ajouterPhotos(files, {chantierId:chId}); render(); }
function vGrillePhotos(list, parChantier){
  list=list.slice().sort((a,b)=>b.createdAt-a.createdAt);
  U.phList=list.map(p=>p.id);
  if(!list.length) return '<p class="muted">Aucune photo pour l\'instant.</p>';
  const grid=ps=>`<div class="phgrid">${ps.map(p=>`<button class="ph" onclick="openPhoto('${p.id}')" aria-label="Photo du ${fmtShort(p.date)}"><img data-k="th_${p.id}" alt="">${p.planId?'<span class="pinb">📍</span>':''}</button>`).join('')}</div>`;
  const byDate=groupBy(list, p=>p.date);
  return Object.keys(byDate).sort().reverse().map(d=>{ const l=byDate[d];
    const corps = parChantier ? Object.entries(groupBy(l,p=>p.chantierId)).map(([c,ps])=>`<div class="hint" style="margin:8px 0 6px;font-weight:600">🏗️ ${esc(chOf(c)?.nom||'?')}</div>${grid(ps)}`).join('') : grid(l);
    return `<div class="phday"><h3>${fmtLong(d)} · ${l.length} photo${l.length>1?'s':''}</h3>${corps}</div>`; }).join('');
}
function vChefPhotos(){
  const ch=chantierActifCourant();
  return hdr('📷 Photos', 'Rangées par date', {back:"go('chefAccueil')"})+`<div class="scroll"><div class="wrap" style="max-width:760px">
    ${ch.length?`<div class="card" style="padding:12px"><label class="f">Chantier${selectChantier(ch,"U.ptChantier=this.value;ls.set('pt-chantier',this.value);render()")}</label>
      <div style="margin-top:12px">${boutonsPhoto(`photosPage(this,'${U.ptChantier}')`)}</div></div>
      ${vGrillePhotos(S.photos.filter(p=>p.chantierId===U.ptChantier), false)}`:'<p class="muted">Aucun chantier en cours.</p>'}
  </div></div>`;
}
function openPhoto(id){ U.lbI=U.phList.indexOf(id); if(U.lbI<0){ U.phList=[id]; U.lbI=0; } drawLb(); }
function closeLb(){ $('#lb')?.remove(); }
function navLb(n){ const L=U.phList.length; U.lbI=(U.lbI+n+L)%L; drawLb(); }
async function drawLb(){
  const p=S.photos.find(x=>x.id===U.phList[U.lbI]); if(!p) return closeLb();
  let d=$('#lb');
  if(!d){ d=document.createElement('div'); d.id='lb'; d.className='lb'; document.body.appendChild(d); }
  const can=enBureau()||estAMoi(p), n=U.phList.length, surPlan=p.planId && S.plans.some(x=>x.id===p.planId);
  d.innerHTML=`<div class="lbtop"><span>${n>1?`${U.lbI+1} / ${n}`:''}</span><button onclick="closeLb()" aria-label="Fermer">✕</button></div>
    <div class="lbimg" id="lbZone"><img id="lbImg" alt="">${n>1?`<button class="lbn l" onclick="navLb(-1)" aria-label="Photo précédente">‹</button><button class="lbn r" onclick="navLb(1)" aria-label="Photo suivante">›</button>`:''}</div>
    <div class="lbinfo"><b style="text-transform:capitalize">${fmtLong(p.date)}</b> · ${fmtHeure(p.createdAt)} · ${esc(p.auteur)} · ${esc(chOf(p.chantierId)?.nom||'')}${p.note?`<div>📝 ${esc(p.note)}</div>`:''}
      <div class="row" style="margin-top:10px">${surPlan?`<button class="btn" onclick="voirSurPlan('${p.id}')">📍 Voir sur le plan</button>`:''}${can?`<button class="btn sec" onclick="noterPhoto('${p.id}')">📝 Note</button><button class="btn bad" onclick="delPhoto('${p.id}')">Supprimer</button>`:''}</div></div>`;
  const z=$('#lbZone'); let x0=null;
  z.addEventListener('pointerdown',e=>{ x0=e.clientX; });
  z.addEventListener('pointerup',e=>{ if(x0!=null && n>1 && Math.abs(e.clientX-x0)>60) navLb(e.clientX<x0?1:-1); x0=null; });
  const u=await imageURL('ph_'+p.id); const im=$('#lbImg'); if(im&&u) im.src=u;
}
function noterPhoto(id){ const p=S.photos.find(x=>x.id===id); askText('Note de la photo', p.note||'', t=>{ p.note=t.trim(); save(); drawLb(); }, 'maxlength="120"'); }
function delPhoto(id){
  askConfirm('Supprimer cette photo ?', ()=>{
    S.photos=S.photos.filter(x=>x.id!==id); delImage('ph_'+id); delImage('th_'+id); save();
    U.phList=U.phList.filter(x=>x!==id); if(!U.phList.length) closeLb(); else { U.lbI=Math.min(U.lbI,U.phList.length-1); drawLb(); }
    if(U.viewer) refreshLayers(); else render();
  });
}
function voirSurPlan(id){
  const p=S.photos.find(x=>x.id===id); closeLb();
  if(enBureau()) go('bureau',{btab:'avancement', chantierId:p.chantierId, planId:p.planId, focus:[p.x,p.y]});
  else go('chefChantier',{chantierId:p.chantierId, planId:p.planId, focus:[p.x,p.y]});
}

/* ---------- Matériel à commander ---------- */
function cmdCard(c, bureau){
  return `<div class="card"><div class="row"><b class="grow">🏗️ ${esc(chOf(c.chantierId)?.nom||'?')}</b><span class="hint">${fmtShort(c.date)} · ${fmtHeure(c.createdAt)}</span></div>
    <div class="hint">👷 ${esc(c.auteur)}</div>${tableCmd(c)}
    <div class="row">${c.mail==='envoye'?'<span class="badge ok">✔ Mail envoyé</span>':'<span class="badge warn">⏳ Mail en attente d\'envoi</span>'}${c.traitee?'<span class="badge ok">✔ Traitée</span>':''}
      ${bureau?`<div class="grow"></div><button class="btn sec sm" onclick="togCmd('${c.id}')">${c.traitee?'Rouvrir':'✔ Marquer traitée'}</button><button class="btn bad sm" onclick="delCmd('${c.id}')" aria-label="Supprimer">✕</button>`:''}</div></div>`;
}
function vChefMateriel(){
  const ch=chantierActifCourant();
  const mes=S.commandes.filter(c=>c.auteurId===U.chefId).sort((a,b)=>b.createdAt-a.createdAt).slice(0,20);
  return hdr('📦 Matériel à commander', fmtLong(today()), {back:"go('chefAccueil')"})+`<div class="scroll"><div class="wrap" style="max-width:640px">
    ${ch.length?`<div class="card"><label class="f">Chantier${selectChantier(ch,"U.ptChantier=this.value;ls.set('pt-chantier',this.value)")}</label>
      <div class="cmdgrid" id="cmdLignes" style="margin-top:12px"><i>Produit</i><i>Quantité</i><i>Pourquoi ?</i>${ligneCmd()+ligneCmd()+ligneCmd()}</div>
      <button class="btn sec sm" style="margin:8px 0 12px" onclick="$('#cmdLignes').insertAdjacentHTML('beforeend',ligneCmd())">➕ Ajouter une ligne</button>
      <button class="btn xl" onclick="envoyerCommande()">📨 Envoyer</button></div>`:'<p class="muted">Aucun chantier en cours.</p>'}
    <h2 class="sec-t">Mes demandes</h2>${mes.map(c=>cmdCard(c,false)).join('')||'<p class="muted">Aucune demande pour l\'instant.</p>'}
  </div></div>`;
}
/* Une ligne de commande : produit · quantité · pourquoi */
const ligneCmd = () => `<input type="text" class="cP" placeholder="Ex. : équerres 120 mm" maxlength="80"><input type="text" class="cQ" placeholder="Qté" maxlength="15"><input type="text" class="cW" placeholder="Ex. : manque façade nord" maxlength="120">`;
function tableCmd(c){
  if(!c.lignes) return `<div class="cmdtxt">${esc(c.texte)}</div>`;   // anciennes demandes en texte libre
  return `<div class="tbl"><table class="cmdtab"><thead><tr><th>Produit</th><th class="num">Qté</th><th>Pourquoi</th></tr></thead><tbody>
    ${c.lignes.map(l=>`<tr><td><b>${esc(l.produit)}</b></td><td class="num">${esc(l.qte)}</td><td class="hint">${esc(l.pourquoi)}</td></tr>`).join('')}</tbody></table></div>`;
}
function envoyerCommande(){
  const P=[...document.querySelectorAll('#cmdLignes .cP')], Q=[...document.querySelectorAll('#cmdLignes .cQ')], W=[...document.querySelectorAll('#cmdLignes .cW')];
  const lignes=P.map((p,i)=>({produit:p.value.trim(), qte:Q[i].value.trim(), pourquoi:W[i].value.trim()})).filter(l=>l.produit||l.qte||l.pourquoi);
  if(!lignes.length) return toast('Écrivez au moins un produit');
  if(lignes.some(l=>!l.produit)) return toast('Il manque le nom d\'un produit','warn');
  if(lignes.some(l=>!l.qte)) return toast('Il manque une quantité','warn');
  const t=lignes.map(l=>`${l.qte} × ${l.produit}${l.pourquoi?' ('+l.pourquoi+')':''}`).join('\n');
  S.commandes.push({id:uid(), chantierId:$('#selCh').value, auteur:nomChef(), auteurId:U.chefId, lignes, texte:t, date:today(), createdAt:Date.now(), mail:'attente', traitee:false});
  save(); render(); toastMini();
}
function togCmd(id){ const c=S.commandes.find(x=>x.id===id); c.traitee=!c.traitee; save(); render(); }
function delCmd(id){ askConfirm('Supprimer cette demande ?', ()=>{ S.commandes=S.commandes.filter(x=>x.id!==id); save(); render(); }); }

/* ---------- Pointage ---------- */
const overlaps=(a,b)=>a==='J'||b==='J'||a===b;
function congeLe(salId,date){ return S.conges.find(c=>c.salarieId===salId && c.debut<=date && date<=c.fin); }
function setPointage(salId, chId, date, periode, statut){
  S.pointages=S.pointages.filter(p=>!(p.salarieId===salId && p.chantierId===chId && p.date===date && overlaps(p.periode,periode)));
  /* On note qui a pointé et à quelle heure : sert aux rapports du jour du bureau */
  if(statut) S.pointages.push({id:uid(), salarieId:salId, chantierId:chId, date, periode, statut, chefId:enBureau()?'':U.chefId, createdAt:Date.now()});
  save();
  if(statut==='present'){
    const o=S.pointages.find(p=>p.salarieId===salId && p.date===date && p.chantierId!==chId && p.statut==='present' && overlaps(p.periode,periode));
    if(o){ const s=S.salaries.find(x=>x.id===salId), c=chOf(o.chantierId); toast(`⚠️ ${s?.nom} est déjà pointé (${PERIODES[o.periode].toLowerCase()}) sur ${c?.nom}`, 'warn'); }
  }
}
/* Équipe du jour : au premier affichage, reprend la dernière équipe connue sur ce chantier */
function equipeDuJour(chId, d){
  const key=chId+'|'+d;
  if(!S.equipesInit.includes(key)){
    const deja=S.equipes.some(e=>e.chantierId===chId&&e.date===d) || S.pointages.some(p=>p.chantierId===chId&&p.date===d);
    if(!deja){
      for(let i=1;i<=14;i++){
        const dd=addDays(d,-i);
        const prev=new Set([...S.equipes.filter(e=>e.chantierId===chId&&e.date===dd).map(e=>e.salarieId), ...S.pointages.filter(p=>p.chantierId===chId&&p.date===dd).map(p=>p.salarieId)]);
        if(prev.size){ [...prev].filter(id=>S.salaries.some(s=>s.id===id&&s.actif)).forEach(id=>S.equipes.push({chantierId:chId,date:d,salarieId:id})); break; }
      }
    }
    S.equipesInit.push(key); save();
  }
  return [...new Set([...S.equipes.filter(e=>e.chantierId===chId&&e.date===d).map(e=>e.salarieId), ...S.pointages.filter(p=>p.chantierId===chId&&p.date===d).map(p=>p.salarieId)])];
}
/* Un seul geste : toute l'équipe du jour pointée « journée », sauf ceux déjà pointés ici, en congé prévu
   ou déjà présents ailleurs aujourd'hui. Le chef ne touche ensuite que les exceptions. */
function tousPresents(){
  const d=today(), ch=U.ptChantier; let n=0;
  for(const id of equipeDuJour(ch,d)){
    if(S.pointages.some(p=>p.salarieId===id && p.date===d && (p.chantierId===ch || p.statut==='present'))) continue;
    if(congeLe(id,d)) continue;
    S.pointages.push({id:uid(), salarieId:id, chantierId:ch, date:d, periode:'J', statut:'present', chefId:enBureau()?'':U.chefId, createdAt:Date.now()}); n++;
  }
  save(); render(); toastMini();
}
function vPointage(ch){
  const c=chOf(U.ptChantier), d=today();
  const eq=equipeDuJour(c.id,d).map(id=>S.salaries.find(s=>s.id===id)).filter(Boolean);
  return `<div class="card" style="padding:12px"><label class="f">Chantier du pointage${selectChantier(ch,"U.ptChantier=this.value;ls.set('pt-chantier',this.value);render()")}</label></div>
    <div class="row" style="margin-bottom:12px">${eq.length?`<button class="btn grow" style="padding:14px;font-size:17px" onclick="tousPresents()">✔ Tous présents (journée)</button>`:''}</div>
    ${eq.length ? eq.map(s=>rowPt(s,c,d)).join('') : '<p class="muted">Personne dans l\'équipe pour l\'instant.</p>'}
    <button class="bigbtn addbtn" onclick="sheetAjout()">➕ Ajouter un salarié à l'équipe</button>`;
}
function rowPt(s,c,d){
  const recs=S.pointages.filter(p=>p.salarieId===s.id && p.chantierId===c.id && p.date===d);
  const has=per=>recs.some(p=>p.periode===per && p.statut==='present');
  const abs=recs.filter(p=>p.statut!=='present');
  const autres=S.pointages.filter(p=>p.salarieId===s.id && p.chantierId!==c.id && p.date===d);
  const cg=congeLe(s.id,d);
  const st = recs.length ? recs.map(p=>`${STATUTS[p.statut].i} ${STATUTS[p.statut].l}${p.periode!=='J'?' ('+PERIODES[p.periode].toLowerCase()+')':''}`).join(' · ') : (cg?'🏖️ En congé (prévu par le bureau)':'Pas encore pointé');
  return `<div class="pt-row"><div class="row" style="flex-wrap:nowrap"><div class="nm grow">${esc(s.nom)}</div><button class="xbtn" onclick="retirerEquipe('${s.id}')" aria-label="Retirer de l'équipe">✕</button></div><div class="st">${st}</div>
    ${autres.map(p=>`<div class="pt-other">${PERIODES[p.periode]} : ${STATUTS[p.statut].i} ${esc(chOf(p.chantierId)?.nom||'?')}</div>`).join(' ')}
    <div class="pt-btns">
      <button class="${has('J')?'on':''}" onclick="tapPt('${s.id}','J')">✔ Journée</button>
      <button class="${has('M')?'on':''}" onclick="tapPt('${s.id}','M')">Matin</button>
      <button class="${has('A')?'on':''}" onclick="tapPt('${s.id}','A')">Après-midi</button>
      <button class="abs ${abs.length?'on':''}" onclick="sheetAbs('${s.id}')">${abs.length?STATUTS[abs[0].statut].i:'Absent'}</button>
    </div></div>`;
}
function tapPt(salId, per){
  const d=today(), ch=U.ptChantier;
  const exists=S.pointages.some(p=>p.salarieId===salId && p.chantierId===ch && p.date===d && p.periode===per && p.statut==='present');
  setPointage(salId, ch, d, per, exists?null:'present'); render();
}
function retirerEquipe(salId){
  const d=today(), ch=U.ptChantier; const s=S.salaries.find(x=>x.id===salId);
  const faire=()=>{
    S.equipes=S.equipes.filter(e=>!(e.salarieId===salId&&e.chantierId===ch&&e.date===d));
    S.pointages=S.pointages.filter(p=>!(p.salarieId===salId&&p.chantierId===ch&&p.date===d));
    save(); render();
  };
  if(S.pointages.some(p=>p.salarieId===salId&&p.chantierId===ch&&p.date===d)) askConfirm(`Retirer ${s?.nom} de l'équipe du jour ? Son pointage sur ce chantier sera effacé.`, faire, 'Retirer');
  else faire();
}
function sheetAjout(){
  const d=today(), ch=U.ptChantier; const eq=new Set(equipeDuJour(ch,d));
  const dispo=S.salaries.filter(s=>s.actif && !eq.has(s.id));
  openSheet(`<h2>➕ Ajouter à l'équipe du jour</h2>${dispo.length ? dispo.map(s=>{
      const ailleurs=S.pointages.filter(p=>p.salarieId===s.id&&p.date===d).map(p=>`${PERIODES[p.periode].toLowerCase()} : ${STATUTS[p.statut].i} ${esc(chOf(p.chantierId)?.nom||'?')}`);
      const cg=congeLe(s.id,d);
      return `<button class="chantier-card" style="font-size:18px" onclick="ajouterEquipe('${s.id}')">👷 ${esc(s.nom)}<small>${ailleurs.length?ailleurs.join(' · '):cg?'🏖️ En congé (prévu)':'Pas encore pointé aujourd\'hui'}</small></button>`; }).join('')
    : '<p class="muted">Tous les salariés sont déjà dans l\'équipe.</p>'}<button class="btn sec" onclick="closeSheet()">Fermer</button>`);
}
function ajouterEquipe(salId){ S.equipes.push({chantierId:U.ptChantier, date:today(), salarieId:salId}); save(); closeSheet(); render(); }
let absSel={per:'J'};
function sheetAbs(salId){
  const s=S.salaries.find(x=>x.id===salId); absSel={per:'J', sal:salId};
  const draw=()=>`<h2>${esc(s.nom)} — absent</h2>
    <div class="segp">${Object.entries(PERIODES).map(([k,l])=>`<button class="${absSel.per===k?'on':''}" onclick="absSel.per='${k}';$('.sheet').innerHTML=window._absDraw()">${l}</button>`).join('')}</div>
    <div class="motifs">${['maladie','conge','autre'].map(k=>`<button onclick="setPointage('${salId}',U.ptChantier,today(),absSel.per,'${k}');closeSheet();render()">${STATUTS[k].i}<br>${STATUTS[k].l}</button>`).join('')}</div>
    <div class="row"><button class="btn bad" onclick="setPointage('${salId}',U.ptChantier,today(),'J',null);closeSheet();render()">Effacer son pointage du jour</button><button class="btn sec" onclick="closeSheet()">Fermer</button></div>`;
  window._absDraw=draw; openSheet(draw());
}

/* =========================================================
   Bureau
   ========================================================= */
const BTITRES={accueil:'📊 Tableau de bord', chantiers:'🏗️ Chantiers', avancement:'🗺️ Avancement', zones:'▭ Zones de travail', production:'📈 Production', photos:'📷 Photos', salaries:'👷 Salariés', pointages:'🗓️ Pointages', commandes:'📦 Commandes', comptes:'🔑 Comptes'};
function vBureau(){
  if(!BTITRES[U.btab]) U.btab='accueil';
  const body={accueil:vBAccueil, chantiers:vBChantiers, avancement:vBAvancement, zones:vBZones, production:vBProduction, photos:vBPhotos, salaries:vBSalaries, pointages:vBPointages, commandes:vBCommandes, comptes:vBComptes}[U.btab]();
  return hdr(BTITRES[U.btab], 'Bureau · '+fmtLong(today()))+body;
}

/* ---------- Tableau de bord ---------- */
function vBAccueil(){
  const d=today(); const ch=S.chantiers.filter(c=>c.actif);
  const cmd=S.commandes.filter(c=>!c.traitee).sort((a,b)=>b.createdAt-a.createdAt);
  /* Un carreau par chantier : équipe du jour, posé aujourd'hui, photos, demandes, avancement ; toucher = page du chantier */
  const tuiles=ch.map(c=>{
    const recs=S.pointages.filter(p=>p.chantierId===c.id&&p.date===d);
    const pres=new Set(recs.filter(p=>p.statut==='present').map(p=>p.salarieId)).size;
    const abs=new Set(recs.filter(p=>p.statut!=='present').map(p=>p.salarieId)).size;
    const ph=S.photos.filter(p=>p.chantierId===c.id&&p.date===d).length, nc=cmd.filter(x=>x.chantierId===c.id).length;
    const prod=productionJour(c.id,d), pose=etapesVis(c.id).filter(e=>!estOuv(e)).reduce((s,e)=>s+(prod[e.id]||0),0);
    return `<button class="tuile tdb" onclick="go('bureau',{btab:'chantiers',bCh:'${c.id}'})">
      <b>🏗️ ${esc(c.nom)}</b>
      <span class="tm">👷 <b>${pres}</b> présent${pres>1?'s':''}${abs?` · ${abs} absent${abs>1?'s':''}`:''}${pose?` · 📈 +${num(pose,1)} m² auj.`:''}</span>
      <span class="tm">${ph?`📷 ${ph} photo${ph>1?'s':''} auj.`:''}${ph&&nc?' · ':''}${nc?`📦 ${nc} demande${nc>1?'s':''}`:''}</span></button>`;
  }).join('');
  const act=S.dessins.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,10).map(x=>{
    const p=S.plans.find(p=>p.id===x.planId), c=chOf(x.chantierId), e=etp(x.chantierId,x.etape);
    return `<tr><td>${fmtShort(x.date)}</td><td>${esc(x.auteur)}</td><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="hint">${esc(c?.nom||'')} · ${esc(p?.nom||'')}</td></tr>`; }).join('');
  return `<div class="scroll"><div class="wrap">
    <div class="tuiles" style="margin-bottom:14px">${tuiles||'<p class="muted">Aucun chantier en cours.</p>'}</div>
    <div class="card"><div class="row" style="margin-bottom:6px"><h3 class="grow" style="margin:0">📦 Matériel à commander${cmd.length?` (${cmd.length})`:''}</h3><button class="btn sec sm" onclick="go('bureau',{btab:'commandes'})">Tout voir</button></div>
      ${cmd.length?cmd.slice(0,4).map(c=>`<div class="alert warn"><b>${esc(chOf(c.chantierId)?.nom||'?')}</b> · ${esc(c.auteur)} · ${fmtShort(c.date)}<br>${esc(c.texte.split('\n')[0])}${c.texte.includes('\n')?'…':''}</div>`).join(''):'<p class="muted" style="margin:0">Aucune demande à traiter.</p>'}</div>
    ${vRapportsJour(d)}
    <div class="card"><h3>🕒 Dernières activités</h3>${act?`<div class="tbl"><table><tbody>${act}</tbody></table></div>`:'<p class="muted" style="margin:0">Rien pour l\'instant.</p>'}</div>
  </div></div>`;
}

/* ---------- Rapports du jour (bureau) : fabriqués automatiquement à partir de ce que chaque chef a saisi ---------- */
function activiteChef(chefId, d){
  const a={
    pts:S.pointages.filter(p=>p.date===d && p.chefId===chefId),
    ds:S.dessins.filter(x=>x.date===d && x.auteurId===chefId),
    ouv:S.ouvertures.filter(o=>o.fait && o.date===d && o.auteurId===chefId),
    ph:S.photos.filter(p=>p.date===d && p.auteurId===chefId),
    cm:S.commandes.filter(c=>c.date===d && c.auteurId===chefId),
    an:S.annotations.filter(x=>x.date===d && x.auteurId===chefId),
  };
  a.chantiers=[...new Set(Object.values(a).flat().map(x=>x.chantierId).filter(Boolean))];
  a.derniere=Math.max(0, ...Object.values(a).filter(Array.isArray).flat().map(x=>x.faitAt||x.createdAt||0));
  a.vide=!a.pts.length && !a.ds.length && !a.ouv.length && !a.ph.length && !a.cm.length && !a.an.length;
  return a;
}
function resumeActivite(a, d){
  const pres=new Set(a.pts.filter(p=>p.statut==='present').map(p=>p.salarieId)).size, abs=new Set(a.pts.filter(p=>p.statut!=='present').map(p=>p.salarieId)).size;
  const morceaux=[];
  if(a.pts.length) morceaux.push(`👷 ${pres} présent${pres>1?'s':''}${abs?`, ${abs} absent${abs>1?'s':''}`:''}`);
  for(const ch of a.chantiers){ const p=productionJour(ch,d);
    etapesVis(ch).forEach(e=>{ if(estOuv(e)) return; if(p[e.id]>0 && a.ds.some(x=>x.chantierId===ch && x.etape===e.id)) morceaux.push(`<span class="dot" style="background:${e.couleur}"></span>${esc(e.court)} +${m2f(p[e.id])}`); }); }
  if(a.ouv.length) morceaux.push(`🟥 ${a.ouv.length} ébrasement${a.ouv.length>1?'s':''}`);
  if(a.ph.length) morceaux.push(`📷 ${a.ph.length} photo${a.ph.length>1?'s':''}`);
  if(a.cm.length) morceaux.push(`📦 ${a.cm.length} demande${a.cm.length>1?'s':''}`);
  return morceaux.join(' · ');
}
function vRapportsJour(d){
  if(!S.chefs.length) return '';
  const lignes=S.chefs.map(c=>{ const a=activiteChef(c.id,d);
    if(a.vide) return `<div class="alert warn"><b>${esc(c.nom)}</b> · ⏳ rien de saisi aujourd'hui</div>`;
    return `<button class="chantier-card" style="font-size:16px;padding:12px 14px;margin-bottom:8px" onclick="ouvrirRapport('${c.id}','${d}')"><b>${esc(c.nom)}</b> · ${a.chantiers.map(x=>esc(chOf(x)?.nom||'?')).join(', ')} · dernière activité <b>${fmtHeure(a.derniere)}</b><small>${resumeActivite(a,d)}</small></button>`; }).join('');
  return `<div class="card"><h3>📋 Rapports du jour</h3>${lignes}</div>`;
}
function ouvrirRapport(chefId, d){
  const c=S.chefs.find(x=>x.id===chefId), a=activiteChef(chefId,d), nomS=id=>S.salaries.find(s=>s.id===id)?.nom||'?';
  const plans=[...new Set(a.ds.map(x=>x.planId))].map(id=>S.plans.find(p=>p.id===id)).filter(Boolean);
  openSheet(`<h2>📋 ${esc(c.nom)} · ${fmtShort(d)}</h2>
    <p class="hint" style="margin-top:0">Dernière activité à ${fmtHeure(a.derniere)} · ${a.chantiers.map(x=>esc(chOf(x)?.nom||'?')).join(', ')}</p>
    <p>${resumeActivite(a,d)}</p>
    ${a.pts.length?`<h3>👷 Pointage</h3><table><tbody>${a.pts.map(p=>`<tr><td>${esc(nomS(p.salarieId))}</td><td>${PERIODES[p.periode]}</td><td>${STATUTS[p.statut].i} ${STATUTS[p.statut].l}</td></tr>`).join('')}</tbody></table>`:''}
    ${a.ouv.length?`<h3>🟥 Ébrasements faits</h3><p>${a.ouv.map(libOuv).join(' · ')}</p>`:''}
    ${a.cm.length?`<h3>📦 Matériel demandé</h3>${a.cm.map(x=>tableCmd(x)).join('')}`:''}
    ${a.ph.length?`<h3>📷 Photos</h3>${vGrillePhotos(a.ph,false)}`:''}
    <div class="row" style="margin-top:14px">${plans.map(p=>`<button class="btn sec" onclick="closeSheet();U.avVue={type:'jour',etape:U.avVue.etape,date:'${d}'};go('bureau',{btab:'avancement',chantierId:'${p.chantierId}',planId:'${p.id}'})">🗺️ ${esc(p.nom)}</button>`).join('')}<button class="btn sec" onclick="closeSheet()">Fermer</button></div>`);
  hydrate();
}

/* ---------- Zones de travail (bureau) : total, fait et reste en m² ---------- */
function selChantierBureau(cle){
  const ch=S.chantiers; if(!ch.find(c=>c.id===U[cle])) U[cle]=(ch.find(c=>c.actif)||ch[0])?.id||'';
  return `<select class="big" onchange="U.${cle}=this.value;render()">${ch.map(c=>`<option value="${c.id}" ${c.id===U[cle]?'selected':''}>${esc(c.nom)}${c.actif?'':' (archivé)'}</option>`).join('')}</select>`;
}
function vBZones(){
  if(!S.chantiers.length) return `<div class="scroll"><p class="muted">Aucun chantier.</p></div>`;
  const sel=selChantierBureau('zCh'), chId=U.zCh, plans=S.plans.filter(p=>p.chantierId===chId);
  const tot=totalZonesCh(chId), E=etapesVis(chId), so=statsOuv(S.ouvertures.filter(o=>o.chantierId===chId));
  const fait={}; for(const p of plans){ const m=statsM2Plan(p); if(m) for(const k in m.fait) fait[k]=(fait[k]||0)+m.fait[k]; }
  const principale=E.slice().reverse().find(e=>!estOuv(e) && (fait[e.id]||0)>0) || E.find(e=>!estOuv(e));
  return `<div class="scroll"><div class="wrap" style="max-width:900px">
    <div class="card" style="padding:12px"><label class="f">Chantier${sel}</label></div>
    ${tot?`<div class="card"><h3>🏗️ Total du chantier</h3>
      <div class="row" style="gap:18px;margin-bottom:10px"><div><div class="hint">À réaliser</div><b style="font-size:22px">${m2f(tot)}</b></div>
        ${principale?`<div><div class="hint">${esc(principale.court)} fait</div><b style="font-size:22px">${m2f(fait[principale.id])}</b></div><div><div class="hint">${esc(principale.court)} reste</div><b style="font-size:26px;color:var(--bad)">${m2f(Math.max(tot-(fait[principale.id]||0),0))}</b></div>`:''}</div>
      <div class="tbl"><table><thead><tr><th>Étape</th><th class="num">Fait</th><th class="num">Reste</th><th></th></tr></thead><tbody>
      ${E.map(e=>{ if(estOuv(e)) return ligneOuvStats(e, so); const f=fait[e.id]||0, pc=tot?clamp(f/tot*100,0,100):0;
        return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${m2f(f)}</td><td class="num"><b>${m2f(Math.max(tot-f,0))}</b></td><td style="min-width:80px"><div class="bar"><i style="width:${pc}%;background:${e.couleur}"></i></div></td></tr>`; }).join('')}
      </tbody></table></div></div>`
    :`<div class="card"><p class="muted" style="margin:0">Aucune zone de travail sur ce chantier. Ouvrez un plan ci-dessous et tracez les zones avec leur surface.</p></div>`}
    ${plans.map(p=>{ const zs=zonesDe(p);
      return `<div class="card"><div class="row" style="margin-bottom:8px"><h3 class="grow" style="margin:0">🗺️ ${esc(p.nom)}</h3><span class="hint">${zs.length} zone${zs.length>1?'s':''} · ${m2f(zs.reduce((s,z)=>s+z.m2,0))}</span>
        <button class="btn sec sm" onclick="go('bureau',{btab:'avancement',chantierId:'${chId}',planId:'${p.id}'})">✏️ Tracer / modifier sur le plan</button></div>
        ${zs.map(z=>ficheZone(z,true)).join('')||'<p class="hint" style="margin:0">Pas encore de zone sur ce plan.</p>'}</div>`; }).join('')||'<p class="muted">Ce chantier n\'a pas de plan.</p>'}
  </div></div>`;
}

/* ---------- Production par jour / par semaine (bureau) ---------- */
function vBProduction(){
  if(!S.chantiers.length) return `<div class="scroll"><p class="muted">Aucun chantier.</p></div>`;
  const sel=selChantierBureau('prCh'), chId=U.prCh, E=etapesVis(chId), d=U.prDate, tot=totalZonesCh(chId), so=statsOuv(S.ouvertures.filter(o=>o.chantierId===chId));
  const nav=`<div class="row"><button class="btn sec sm" onclick="U.prDate=addDays(U.prDate,${U.prMode==='jour'?-1:-7});render()" aria-label="Précédent">◀</button>
    <input type="date" value="${d}" onchange="U.prDate=this.value;render()"><button class="btn sec sm" onclick="U.prDate=addDays(U.prDate,${U.prMode==='jour'?1:7});render()" aria-label="Suivant">▶</button>
    <div class="segp grow"><button class="${U.prMode==='jour'?'on':''}" onclick="U.prMode='jour';render()">Jour</button><button class="${U.prMode==='semaine'?'on':''}" onclick="U.prMode='semaine';render()">Semaine</button></div></div>`;
  let corps;
  if(U.prMode==='jour'){
    const p=productionJour(chId,d);
    corps=`<h3 style="text-transform:capitalize">${fmtLong(d)}</h3><div class="tbl"><table><thead><tr><th>Étape</th><th class="num">Posé ce jour</th><th class="num">Total fait</th><th class="num">Reste</th></tr></thead><tbody>
      ${E.map(e=>{ const f=faitJusqua(chId,e,d), t=estOuv(e)?so.tot:tot;
        return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num"><b>${p[e.id]?'+'+fmtQte(e,p[e.id]):'—'}</b></td><td class="num">${fmtQte(e,f)}</td><td class="num">${fmtQte(e,Math.max(t-f,0))}</td></tr>`; }).join('')}
      </tbody></table></div>`;
  } else {
    const lundi=mondayOf(d), jours=[0,1,2,3,4,5,6].map(i=>addDays(lundi,i)), prod=jours.map(j=>productionJour(chId,j));
    corps=`<h3>Semaine du ${fmtShort(lundi)} au ${fmtShort(jours[6])}</h3><div class="tbl"><table><thead><tr><th>Étape</th>${jours.map(j=>`<th class="num">${fmtShort(j)}</th>`).join('')}<th class="num">Semaine</th></tr></thead><tbody>
      ${E.map(e=>{ const v=prod.map(p=>p[e.id]||0), s=v.reduce((a,b)=>a+b,0);
        return `<tr><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td>${v.map(x=>`<td class="num">${x?fmtQte(e,x):'—'}</td>`).join('')}<td class="num"><b>${s?fmtQte(e,s):'—'}</b></td></tr>`; }).join('')}
      </tbody></table></div>`;
  }
  return `<div class="scroll"><div class="wrap" style="max-width:1000px">
    <div class="card" style="padding:12px"><label class="f">Chantier${sel}</label><div style="margin-top:10px">${nav}</div></div>
    <div class="card">${tot||so.tot?corps:'<p class="muted" style="margin:0">Pour calculer la production en m², tracez d\'abord les zones de travail du chantier (menu ▭ Zones de travail).</p>'}
      <p class="hint" style="margin:10px 0 0">Calculé à partir des dessins des chefs dans les zones de travail. Une surface déjà faite un autre jour pour la même étape n'est pas recomptée. Les ébrasements se comptent en ouvertures.</p></div>
  </div></div>`;
}

/* ---------- Photos (bureau) ---------- */
function vBPhotos(){
  const chs=S.chantiers;
  const list=S.photos.filter(p=>p.date>=U.phDu && p.date<=U.phAu && (!U.phCh||p.chantierId===U.phCh));
  return `<div class="scroll"><div class="wrap">
    <div class="card"><div class="row">
      <label class="f">Chantier<select onchange="U.phCh=this.value;render()"><option value="">Tous</option>${chs.map(c=>`<option value="${c.id}" ${U.phCh===c.id?'selected':''}>${esc(c.nom)}</option>`).join('')}</select></label>
      <label class="f">Du<input type="date" value="${U.phDu}" onchange="U.phDu=this.value;render()"></label>
      <label class="f">Au<input type="date" value="${U.phAu}" onchange="U.phAu=this.value;render()"></label>
      <span class="hint" style="align-self:flex-end">${list.length} photo${list.length>1?'s':''}</span></div></div>
    ${vGrillePhotos(list, !U.phCh)}
  </div></div>`;
}

/* ---------- Commandes (bureau) ---------- */
function vBCommandes(){
  let list=S.commandes.filter(c=>!U.cmdCh||c.chantierId===U.cmdCh);
  if(U.cmdFiltre==='atraiter') list=list.filter(c=>!c.traitee);
  list.sort((a,b)=>b.createdAt-a.createdAt);
  return `<div class="scroll"><div class="wrap" style="max-width:800px">
    <div class="card"><div class="row">
      <label class="f">Chantier<select onchange="U.cmdCh=this.value;render()"><option value="">Tous</option>${S.chantiers.map(c=>`<option value="${c.id}" ${U.cmdCh===c.id?'selected':''}>${esc(c.nom)}</option>`).join('')}</select></label>
      <div class="segp grow" style="align-self:flex-end"><button class="${U.cmdFiltre==='atraiter'?'on':''}" onclick="U.cmdFiltre='atraiter';render()">À traiter</button><button class="${U.cmdFiltre==='toutes'?'on':''}" onclick="U.cmdFiltre='toutes';render()">Toutes</button></div></div>
      <p class="hint" style="margin:10px 0 0">Les demandes doivent partir par mail à <b>${MAIL_COMMANDES}</b>. L'envoi automatique sera branché avec la base en ligne : en attendant, elles sont marquées « en attente d'envoi ».</p></div>
    ${list.map(c=>cmdCard(c,true)).join('')||'<p class="muted">Aucune demande.</p>'}
  </div></div>`;
}

/* ---------- Comptes ---------- */
function vBComptes(){
  return `<div class="scroll"><div class="wrap" style="max-width:720px">
    <div class="card"><h3>👷 Comptes chefs de chantier</h3><p class="hint" style="margin-top:0">Chaque chef se connecte avec son nom et son code à 4 chiffres. Tous les chefs voient tous les chantiers en cours.</p>
      <div class="row" style="margin-bottom:10px"><input type="text" id="nChef" class="grow" placeholder="Nom du chef"><input type="text" id="nPin" inputmode="numeric" maxlength="4" placeholder="Code (4 chiffres)" style="width:160px"><button class="btn" onclick="addChef()">Créer</button></div>
      <table><tbody>${S.chefs.map(c=>`<tr><td><b>${esc(c.nom)}</b></td><td class="hint">code : ••••</td><td class="num" style="white-space:nowrap"><button class="btn sec sm" onclick="pinChef('${c.id}')">Changer le code</button> <button class="btn bad sm" onclick="delChef('${c.id}')" aria-label="Supprimer">✕</button></td></tr>`).join('')||'<tr><td class="muted">Aucun compte</td></tr>'}</tbody></table></div>
    <div class="card"><h3>🖥️ Code du bureau</h3><p class="hint" style="margin-top:0">${S.bureauPin?'Code personnalisé enregistré.':'Code actuel : 0000 (par défaut). Changez-le.'}</p>
      <div class="row"><input type="text" id="bPin" inputmode="numeric" maxlength="4" placeholder="Nouveau code" style="width:160px"><button class="btn" onclick="setBureauPin()">Enregistrer</button></div></div>
    ${SY.sb?`<div class="card"><h3>☁️ Base en ligne</h3><p style="margin:0 0 6px">État : <b>${libEtat()}</b>${SY.erreur?` <span class="hint">(${esc(SY.erreur)})</span>`:''}</p>
      <p class="hint" style="margin-top:0">Appareil connecté avec : ${esc(SY.session?.user?.email||'—')}</p>
      <div class="row"><button class="btn sec" onclick="synchroniser()">🔄 Synchroniser maintenant</button><button class="btn bad" onclick="deconnecterAppareil()">Déconnecter cet appareil</button></div></div>`
    :`<p class="hint">⚠️ L'application n'est pas encore reliée à la base en ligne : les données restent sur cet appareil.</p>`}
  </div></div>`;
}
const pinOK=v=>/^\d{4}$/.test(v);
function addChef(){ const n=$('#nChef').value.trim(), p=$('#nPin').value.trim(); if(!n) return toast('Nom du chef ?'); if(!pinOK(p)) return toast('Le code doit faire 4 chiffres'); S.chefs.push({id:uid(),nom:n,pin:p}); save(); render(); toast('✔ Compte créé'); }
function pinChef(id){ const c=S.chefs.find(x=>x.id===id); askText('Nouveau code à 4 chiffres pour '+c.nom, '', p=>{ if(!pinOK(p.trim())) return toast('Le code doit faire 4 chiffres'); c.pin=p.trim(); save(); toast('✔ Code changé'); }, 'inputmode="numeric" maxlength="4"'); }
function delChef(id){ askConfirm('Supprimer ce compte ? Ses dessins restent enregistrés.', ()=>{ S.chefs=S.chefs.filter(c=>c.id!==id); save(); render(); }); }
function setBureauPin(){ const p=$('#bPin').value.trim(); if(!pinOK(p)) return toast('Le code doit faire 4 chiffres'); S.bureauPin=p; save(); render(); toast('✔ Code du bureau changé'); }

/* ---------- Chantiers, plans & étapes ---------- */
function couleursDispo(c){ const pris=new Set(c.etapes.map(e=>e.couleur)); return [...ETAPES.map(e=>({c:e.couleur,n:e.court,t:e.texte})), ...COULEURS_EXTRA].filter(x=>!pris.has(x.c)); }
function couleurChoisie(c){ const d=couleursDispo(c); return d.find(x=>x.c===U.newCol[c.id]) || d[0]; }
function vEtapesCh(c){
  const used=new Set(S.dessins.filter(d=>d.chantierId===c.id).map(d=>d.etape)), E=c.etapes, dispo=couleursDispo(c), sel=couleurChoisie(c);
  return `<details class="et" ${U.openEt[c.id]?'open':''} ontoggle="U.openEt['${c.id}']=this.open"><summary><b>Étapes du chantier</b> <span class="hint">(${E.filter(e=>!e.masque).length} affichées)</span></summary>
    <div class="tbl"><table><tbody>${E.map((e,i)=>`<tr class="${e.masque?'masq':''}"><td><span class="dot" style="background:${e.couleur}"></span>${i+1}. ${esc(e.nom)} ${e.masque?'<span class="badge warn">masquée</span>':''}</td><td class="num" style="white-space:nowrap">
      <button class="btn sec sm" onclick="moveEtape('${c.id}','${e.id}',-1)" ${i?'':'disabled'} aria-label="Monter">↑</button> <button class="btn sec sm" onclick="moveEtape('${c.id}','${e.id}',1)" ${i<E.length-1?'':'disabled'} aria-label="Descendre">↓</button>
      <button class="btn sec sm" onclick="togEtape('${c.id}','${e.id}')">${e.masque?'Afficher':'Masquer'}</button>
      ${used.has(e.id)?'':`<button class="btn bad sm" onclick="delEtape('${c.id}','${e.id}')" aria-label="Supprimer l'étape">✕</button>`}</td></tr>`).join('')}</tbody></table></div>
    ${dispo.length?`<div class="row" style="margin-top:10px"><input type="text" id="ne-${c.id}" class="grow" maxlength="30" placeholder="Nouvelle étape (ex. Pose isolant)"><button class="btn" onclick="addEtape('${c.id}')">Ajouter</button></div>
      <div class="colpick" id="cp-${c.id}">${dispo.map(x=>`<button class="${x.c===sel.c?'on':''}" style="background:${x.c}" title="${x.n}" aria-label="Couleur ${x.n}" onclick="pickCol(this,'${c.id}','${x.c}')"></button>`).join('')}</div>
      <p class="hint" style="margin:6px 0 0">Une étape qui a déjà des zones dessinées ne peut pas être supprimée, seulement masquée.</p>`:'<p class="hint">Toutes les couleurs sont déjà utilisées.</p>'}
  </details>`;
}
function pickCol(btn, chId, col){ U.newCol[chId]=col; btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on', b===btn)); }
function addEtape(chId){
  const c=chOf(chId), n=$('#ne-'+chId).value.trim(); if(!n) return toast('Nom de l\'étape ?');
  const col=couleurChoisie(c); if(!col) return;
  c.etapes.push({id:'x'+uid(), nom:n, court:n.length>14?n.slice(0,13)+'…':n, couleur:col.c, texte:col.t}); U.newCol[chId]=null; U.openEt[chId]=true;
  save(); render(); toast('✔ Étape ajoutée');
}
function moveEtape(chId,id,dir){ const E=chOf(chId).etapes, i=E.findIndex(e=>e.id===id), j=i+dir; if(j<0||j>=E.length) return; [E[i],E[j]]=[E[j],E[i]]; save(); render(); }
function togEtape(chId,id){ const e=chOf(chId).etapes.find(x=>x.id===id); e.masque=!e.masque; save(); render(); }
function delEtape(chId,id){ const c=chOf(chId), e=c.etapes.find(x=>x.id===id); askConfirm(`Supprimer l'étape « ${e.nom} » de ce chantier ?`, ()=>{ c.etapes=c.etapes.filter(x=>x.id!==id); save(); render(); }); }
/* Chantiers (bureau) : un carreau par chantier ; toucher un carreau ouvre la page du chantier */
function vBChantiers(){
  const c=U.bCh && chOf(U.bCh);
  if(c) return vBChantier(c);
  const tri=S.chantiers.slice().sort((a,b)=>(b.actif-a.actif) || a.nom.localeCompare(b.nom));
  const d=today();
  return `<div class="scroll"><div class="wrap">
    <div class="tuiles">
      ${tri.map(c=>{
        const np=S.plans.filter(p=>p.chantierId===c.id).length, nph=S.photos.filter(p=>p.chantierId===c.id).length;
        const pres=new Set(S.pointages.filter(p=>p.chantierId===c.id&&p.date===d&&p.statut==='present').map(p=>p.salarieId)).size;
        return `<button class="tuile${c.actif?'':' arch'}" onclick="go('bureau',{btab:'chantiers',bCh:'${c.id}'})">
          <span class="ti">🏗️</span><b>${esc(c.nom)}</b>${c.actif?'':'<span class="badge warn">archivé</span>'}
          <small>${esc(c.adresse||'')}</small>
          <span class="tm">📄 ${np} plan${np>1?'s':''} · 📷 ${nph}${pres?` · 👷 ${pres} auj.`:''}</span></button>`;
      }).join('')}
      <button class="tuile neuf" onclick="addChantier()"><span class="ti">➕</span><b>Nouveau chantier</b></button>
    </div>
    <div class="row" style="margin-top:14px">${S.chantiers.length?'':'<button class="btn sec" onclick="chargerDemo().then(render)">Charger la démonstration</button>'}<button class="btn bad sm" onclick="resetAll()">Tout effacer</button></div>
  </div></div>`;
}
function vBChantier(c){
  const plans=S.plans.filter(p=>p.chantierId===c.id);
  return `<div class="scroll"><div class="wrap">
    <button class="btn sec sm" onclick="go('bureau',{btab:'chantiers',bCh:null})">← Tous les chantiers</button>
    <div class="card" style="margin-top:10px"><div class="row"><div class="grow"><h3 style="margin:0">🏗️ ${esc(c.nom)} ${c.actif?'':'<span class="badge warn">archivé</span>'}</h3><div class="hint">${esc(c.adresse||'')}</div></div>
      <button class="btn sec sm" onclick="renChantier('${c.id}')">Renommer</button>
      <button class="btn sec sm" onclick="adrChantier('${c.id}')">Adresse</button>
      <button class="btn sec sm" onclick="togChantier('${c.id}')">${c.actif?'Archiver':'Réactiver'}</button>
      <button class="btn bad sm" onclick="delChantier('${c.id}')">Supprimer</button></div></div>
    <div class="card"><h3>📄 Plans</h3>
      <div class="tbl"><table><tbody>
      ${plans.map(p=>`<tr><td><b>${esc(p.nom)}</b></td>
        <td class="num" style="white-space:nowrap"><button class="btn sec sm" onclick="go('bureau',{btab:'avancement',chantierId:'${c.id}',planId:'${p.id}'})">Voir</button> <button class="btn bad sm" onclick="delPlan('${p.id}')" aria-label="Supprimer le plan">✕</button></td></tr>`).join('') || `<tr><td class="muted">Aucun plan</td></tr>`}
      </tbody></table></div>
      <div class="row" style="margin-top:10px"><label class="btn sec" style="cursor:pointer">➕ Ajouter un plan (PDF ou image)<input type="file" accept="application/pdf,image/*" hidden onchange="importPlan(this,'${c.id}')"></label><span class="hint" id="imp-${c.id}"></span></div>
    </div>
    <div class="card" style="padding-top:2px">${vEtapesCh(c).replace('class="et"','class="et" style="border-top:0;margin-top:0"')}</div>
    <div class="row"><button class="btn sec sm" onclick="go('bureau',{btab:'photos',phCh:'${c.id}'})">📷 Photos du chantier</button><button class="btn sec sm" onclick="go('bureau',{btab:'pointages',ptCh:'${c.id}'})">🗓️ Pointages du chantier</button></div>
  </div></div>`;
}
function addChantier(){ askText('Nom du nouveau chantier', '', n=>{ n=(n||'').trim(); if(!n) return; const id=uid(); S.chantiers.push({id, nom:n, adresse:'', actif:true, etapes:defEtapes()}); save(); go('bureau',{btab:'chantiers',bCh:id}); }, 'maxlength="80"', 'Créer'); }
function adrChantier(id){ const c=chOf(id); askText('Adresse du chantier', c.adresse||'', a=>{ c.adresse=(a||'').trim(); save(); render(); }, 'maxlength="150"'); }
function renChantier(id){ const c=chOf(id); askText('Renommer le chantier', c.nom, n=>{ if(n&&n.trim()){ c.nom=n.trim(); save(); render(); } }); }
function togChantier(id){ const c=chOf(id); c.actif=!c.actif; save(); render(); }
function delChantier(id){
  askConfirm('Supprimer ce chantier, ses plans, ses dessins, ses photos et ses pointages ?', ()=>{
    S.plans.filter(p=>p.chantierId===id).forEach(p=>delImage(p.id));
    S.photos.filter(p=>p.chantierId===id).forEach(p=>{ delImage('ph_'+p.id); delImage('th_'+p.id); });
    S.chantiers=S.chantiers.filter(c=>c.id!==id); S.plans=S.plans.filter(p=>p.chantierId!==id);
    for(const k of ['dessins','pointages','annotations','photos','commandes','equipes','zones','ouvertures']) S[k]=S[k].filter(x=>x.chantierId!==id);
    U.bCh=null; save(); render();
  });
}
function delPlan(id){ askConfirm('Supprimer ce plan, ses dessins et ses annotations ? Les photos restent dans la page Photos.', ()=>{
  delImage(id); S.plans=S.plans.filter(p=>p.id!==id); S.dessins=S.dessins.filter(d=>d.planId!==id); S.annotations=S.annotations.filter(a=>a.planId!==id); S.zones=S.zones.filter(z=>z.planId!==id); S.ouvertures=S.ouvertures.filter(o=>o.planId!==id);
  S.photos.forEach(p=>{ if(p.planId===id){ p.planId=null; p.x=null; p.y=null; } }); save(); render(); }); }
function resetAll(){ askConfirm('Effacer TOUTES les données (chantiers, plans, photos, salariés, pointages, comptes) ?', ()=>{
  S.plans.forEach(p=>delImage(p.id)); S.photos.forEach(p=>{ delImage('ph_'+p.id); delImage('th_'+p.id); }); S=EMPTY(); save(); render(); }, 'Tout effacer'); }

async function importPlan(input, chId){
  const file=input.files[0]; if(!file) return; const info=$('#imp-'+chId);
  const nomBase=file.name.replace(/\.[^.]+$/,'');
  const MAX=4096;
  try{
    if(file.type==='application/pdf' || /\.pdf$/i.test(file.name)){
      if(!window.pdfjsLib) throw new Error('Lecteur PDF indisponible (connexion internet ?)');
      const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
      const n=Math.min(pdf.numPages,20);
      for(let i=1;i<=n;i++){
        info.textContent=`Import page ${i}/${n}…`;
        const page=await pdf.getPage(i); const v1=page.getViewport({scale:1});
        const vp=page.getViewport({scale:Math.min(MAX/Math.max(v1.width,v1.height), 8)});
        const c=document.createElement('canvas'); c.width=Math.floor(vp.width); c.height=Math.floor(vp.height);
        const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height);
        await page.render({canvasContext:g, viewport:vp}).promise;
        const blob=await new Promise(r=>c.toBlob(r,'image/png'));
        await addPlan(chId, n>1?`${nomBase} – p.${i}`:nomBase, blob, c.width, c.height);
      }
    } else {
      const url=URL.createObjectURL(file); const im=new Image();
      await new Promise((r,j)=>{ im.onload=r; im.onerror=()=>j(new Error('Image illisible')); im.src=url; });
      const k=Math.min(1, MAX/Math.max(im.naturalWidth,im.naturalHeight));
      const c=document.createElement('canvas'); c.width=Math.round(im.naturalWidth*k); c.height=Math.round(im.naturalHeight*k);
      const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(im,0,0,c.width,c.height);
      URL.revokeObjectURL(url);
      await addPlan(chId, nomBase, await new Promise(r=>c.toBlob(r,'image/png')), c.width, c.height);
    }
    save(); render(); toast('✔ Plan ajouté');
  }catch(e){ console.error(e); info.textContent=''; toast('Import impossible : '+e.message,'warn'); }
}
async function addPlan(chId, nom, blob, w, h){ const p={id:uid(), chantierId:chId, nom, w, h}; await putImage(p.id, blob); S.plans.push(p); }

/* ---------- Avancement ---------- */
function vBAvancement(){
  const chs=S.chantiers; if(!chs.length) return `<div class="scroll"><p class="muted">Aucun chantier.</p></div>`;
  if(!chs.find(c=>c.id===U.chantierId)) U.chantierId=chs[0].id;
  const plans=S.plans.filter(p=>p.chantierId===U.chantierId);
  if(!plans.find(p=>p.id===U.planId)) U.planId=plans[0]?.id||null;
  const v=U.avVue, plan=curPlan(), E=plan?etapesAffichees(plan):[];
  if(v.type==='etape' && !E.some(e=>e.id===v.etape)) v.etape=E[0]?.id;
  return `<div class="scroll"><div class="wrap" style="max-width:1400px">
    <div class="row" style="margin-bottom:12px">
      <select onchange="go('bureau',{chantierId:this.value,planId:null})">${chs.map(c=>`<option value="${c.id}" ${c.id===U.chantierId?'selected':''}>${esc(c.nom)}</option>`).join('')}</select>
      ${plans.length?`<select onchange="go('bureau',{planId:this.value})">${plans.map(p=>`<option value="${p.id}" ${p.id===U.planId?'selected':''}>${esc(p.nom)}</option>`).join('')}</select>`:''}
    </div>
    ${!plans.length?'<p class="muted">Aucun plan pour ce chantier.</p>':`
    <div class="av-grid"><div class="vwrap"><div class="vhost" id="vhost"></div><div class="banner" id="banner" hidden></div><div class="dtools" id="dtools" hidden></div><div class="flyout" id="flyout" hidden></div></div>
      <div>
        <div class="card"><h3>▭ Zones de travail</h3>
          <p class="hint" style="margin-top:0">Tracez les zones où les équipes vont travailler et indiquez leur surface : les chefs dessinent dedans et l'avancement se calcule en m².</p>
          <button class="btn" onclick="setOutil('zone')">➕ Tracer une zone de travail</button></div>
        <div class="card"><h3>🟥 Fenêtres et portes (ébrasements)</h3>
          <p class="hint" style="margin-top:0">Placez une pastille sur chaque ouverture. Les chefs la cochent quand l'ébrasement est fait.</p>
          <div class="row"><button class="btn" onclick="U.ouvType='F';setOutil('placer')">➕ 🪟 Fenêtres</button><button class="btn" onclick="U.ouvType='P';setOutil('placer')">➕ 🚪 Portes</button></div></div>
        <div class="card"><h3>Affichage</h3>
          <div class="segp" style="margin-bottom:10px">${[['avancement','Avancement'],['etape','Une étape'],['jour','Par jour'],['toutes','Toutes']].map(([k,l])=>`<button class="${v.type===k?'on':''}" onclick="U.avVue.type='${k}';go('bureau')">${l}</button>`).join('')}</div>
          ${v.type==='etape'?`<select onchange="U.avVue.etape=this.value;refreshLayers()">${E.map(e=>`<option value="${e.id}" ${e.id===v.etape?'selected':''}>${esc(e.nom)}</option>`).join('')}</select><p class="hint">Hachuré rouge = dessiné pour d'autres étapes, mais pas encore fait pour celle-ci.</p>`:''}
          ${v.type==='jour'?`<div class="row"><button class="btn sec sm" onclick="shiftJour(-1)" aria-label="Jour précédent">◀</button><input type="date" value="${v.date}" onchange="U.avVue.date=this.value;refreshLayers();renderAvSide()"><button class="btn sec sm" onclick="shiftJour(1)" aria-label="Jour suivant">▶</button></div>`:''}
          ${v.type==='avancement'?'<p class="hint" style="margin:0">Chaque endroit prend la couleur de l\'étape la plus avancée.</p>':''}
          <div class="row" style="margin-top:10px;gap:6px 12px">${E.map(e=>`<span class="hint"><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</span>`).join('')}</div>
          <label class="hint" style="display:flex;gap:8px;align-items:center;margin-top:10px"><input type="checkbox" ${U.showNotes?'checked':''} onchange="U.showNotes=this.checked;refreshLayers()"> Afficher les annotations et les photos 📍</label>
        </div>
        <div id="avside"></div>
      </div></div>`}
  </div></div>`;
}
function shiftJour(n){ U.avVue.date=addDays(U.avVue.date,n); go('bureau'); }
function mountAvViewer(){
  const plan=curPlan(); if(!plan||!$('#vhost')) return;
  U.outil=null; U.etape=null;
  U.pile=[];
  U.viewer=new Viewer($('#vhost'), plan, {sansZoom:true, onTap:p=> U.outil==='placer'?placerTap(p) : consultTap(p,true), onDraw:rectsTraces, onZoom:renderOuv, onPick:reprendre,
    onPoly:polyTrace, onPts:renderDtools, onEchelle:echelleTracee,
    sommetSous, sommetsVisibles, onSommetDebut:so=>{ enEdition.add(so.id); refreshLayers(); }, onSommet:sommetDeplace, onSommetAnnule:so=>{ enEdition.delete(so.id); refreshLayers(); }});
  refreshLayers(); renderAvSide(); renderDtools(); focusSiBesoin();
}
function renderAvSide(){
  const el=$('#avside'); const plan=curPlan(); if(!el||!plan) return;
  const st=statsPlan(plan);
  const ds=S.dessins.filter(d=>d.planId===plan.id);
  const byKey=groupBy(ds, d=>d.date+'|'+d.etape);
  const lignes=Object.entries(byKey).map(([k,l])=>{ const [date,etape]=k.split('|'); return {date,etape,m:st.ref?multiArea(unionDessins(l))/st.ref*100:null,auteurs:[...new Set(l.map(d=>d.auteur))].join(', ')}; })
    .filter(r=>U.avVue.type!=='jour'||r.date===U.avVue.date).sort((a,b)=>b.date.localeCompare(a.date));
  const zs=zonesDe(plan);
  el.innerHTML=`<div class="card"><h3>Avancement par étape</h3>${tableStats(plan,st)}</div>
    ${zs.length?`<div class="card"><h3>▭ Zones de ce plan (${zs.length})</h3>${zs.map(z=>ficheZone(z,true)).join('')}</div>`:''}
    <div class="card"><h3>Historique ${U.avVue.type==='jour'?'du '+fmtShort(U.avVue.date):'jour par jour'}</h3>
    ${lignes.length?`<div class="tbl"><table><thead><tr><th>Date</th><th>Étape</th><th class="num">Part de la zone</th><th>Par</th></tr></thead><tbody>
      ${lignes.map(r=>{ const e=etp(plan.chantierId,r.etape); return `<tr><td>${fmtShort(r.date)}</td><td><span class="dot" style="background:${e.couleur}"></span>${esc(e.court)}</td><td class="num">${fmtPct(r.m)}</td><td class="hint">${esc(r.auteurs)}</td></tr>`; }).join('')}
    </tbody></table></div><p class="hint">Touchez une zone sur le plan pour voir le détail ou la supprimer, ou une épingle 📍 pour voir la photo.</p>`:'<p class="muted">Rien de dessiné.</p>'}</div>`;
}

/* ---------- Salariés & congés ---------- */
function vBSalaries(){
  const sal=S.salaries;
  return `<div class="scroll"><div class="wrap" style="max-width:800px">
    <div class="card"><h3>Salariés</h3><div class="row" style="margin-bottom:10px"><input type="text" id="nSal" class="grow" placeholder="Nom du salarié"><button class="btn" onclick="addSal()">Ajouter</button></div>
      <table><tbody>${sal.map(s=>`<tr><td><b>${esc(s.nom)}</b> ${s.actif?'':'<span class="badge warn">inactif</span>'}</td><td class="num" style="white-space:nowrap">
        <button class="btn sec sm" onclick="renSal('${s.id}')">Renommer</button> <button class="btn sec sm" onclick="togSal('${s.id}')">${s.actif?'Désactiver':'Réactiver'}</button> <button class="btn bad sm" onclick="delSal('${s.id}')" aria-label="Supprimer">✕</button></td></tr>`).join('')||'<tr><td class="muted">Aucun salarié</td></tr>'}</tbody></table></div>
    <div class="card"><h3>🏖️ Congés prévus</h3><p class="hint" style="margin-top:0">Le salarié apparaîtra « en congé » chez le chef de chantier, sans saisie de sa part.</p>
      <div class="row" style="margin-bottom:10px"><select id="cgS">${sal.map(s=>`<option value="${s.id}">${esc(s.nom)}</option>`).join('')}</select>
        <label class="f">Du<input type="date" id="cgD" value="${today()}"></label><label class="f">Au<input type="date" id="cgF" value="${today()}"></label><button class="btn" onclick="addConge()" style="align-self:flex-end">Ajouter</button></div>
      <table><tbody>${S.conges.slice().sort((a,b)=>b.debut.localeCompare(a.debut)).map(c=>`<tr><td>${esc(S.salaries.find(s=>s.id===c.salarieId)?.nom||'?')}</td><td>du ${fmtShort(c.debut)} au ${fmtShort(c.fin)}</td><td class="num"><button class="btn bad sm" onclick="delConge('${c.id}')" aria-label="Supprimer">✕</button></td></tr>`).join('')||'<tr><td class="muted">Aucun congé prévu</td></tr>'}</tbody></table></div>
  </div></div>`;
}
function addSal(){ const n=$('#nSal').value.trim(); if(!n) return; S.salaries.push({id:uid(),nom:n,actif:true}); save(); render(); }
function renSal(id){ const s=S.salaries.find(x=>x.id===id); askText('Renommer le salarié', s.nom, n=>{ if(n&&n.trim()){ s.nom=n.trim(); save(); render(); } }); }
function togSal(id){ const s=S.salaries.find(x=>x.id===id); s.actif=!s.actif; save(); render(); }
function delSal(id){ askConfirm('Supprimer ce salarié et tous ses pointages ?', ()=>{ S.salaries=S.salaries.filter(s=>s.id!==id); S.pointages=S.pointages.filter(p=>p.salarieId!==id); S.conges=S.conges.filter(c=>c.salarieId!==id); save(); render(); }); }
function addConge(){ const s=$('#cgS').value, d=$('#cgD').value, f=$('#cgF').value; if(!s||!d||!f||f<d) return toast('Dates invalides'); S.conges.push({id:uid(),salarieId:s,debut:d,fin:f}); save(); render(); }
function delConge(id){ S.conges=S.conges.filter(c=>c.id!==id); save(); render(); }

/* ---------- Pointages (bureau) ---------- */
function joursOuvres(du,au){ const r=[]; for(let d=du; d<=au && r.length<400; d=addDays(d,1)) if(dow(d)!==0&&dow(d)!==6) r.push(d); return r; }
function pointagesFiltres(){ return S.pointages.filter(p=>p.date>=U.ptDu && p.date<=U.ptAu && (!U.ptCh||p.chantierId===U.ptCh)); }
function alertes(){
  const out=[]; const fin = U.ptAu>today()?today():U.ptAu;
  for(const d of joursOuvres(U.ptDu, fin)){
    for(const s of S.salaries.filter(x=>x.actif)){
      const recs=S.pointages.filter(p=>p.salarieId===s.id && p.date===d);
      const cg=congeLe(s.id,d);
      const pres=recs.filter(p=>p.statut==='present');
      for(let i=0;i<pres.length;i++) for(let j=i+1;j<pres.length;j++) if(pres[i].chantierId!==pres[j].chantierId && overlaps(pres[i].periode,pres[j].periode))
        out.push({k:'bad', t:`${fmtShort(d)} · ${s.nom} pointé sur 2 chantiers en même temps`});
      if(cg) continue;
      const cov=p=>recs.some(r=>overlaps(r.periode,p));
      const m=cov('M'), a=cov('A');
      if(!m&&!a) out.push({k:'warn', t:`${fmtShort(d)} · ${s.nom} n'est pointé nulle part`});
      else if(!m||!a) out.push({k:'warn', t:`${fmtShort(d)} · ${s.nom} : ${!m?'matin':'après-midi'} non pointé`});
    }
  }
  return out;
}
/* Calendrier du mois : chaque jour montre le nombre de présents ; toucher un jour = liste des salariés */
function moisPt(n){ const [y,m]=(U.ptMois||today().slice(0,7)).split('-').map(Number); const d=new Date(y,m-1+n,1); U.ptMois=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; render(); }
function vCalPointage(){
  const m=U.ptMois||(U.ptMois=today().slice(0,7)), [y,mo]=m.split('-').map(Number), nb=new Date(y,mo,0).getDate();
  const jour=U.ptJour||(U.ptJour=today()), auj=today();
  const decal=(dow(m+'-01')+6)%7;   // semaine du lundi au dimanche
  let cases=''; for(let i=0;i<decal;i++) cases+='<span></span>';
  for(let i=1;i<=nb;i++){
    const d=`${m}-${String(i).padStart(2,'0')}`, recs=S.pointages.filter(p=>p.date===d && (!U.ptCh||p.chantierId===U.ptCh));
    const pres=new Set(recs.filter(p=>p.statut==='present').map(p=>p.salarieId)).size, abs=new Set(recs.filter(p=>p.statut!=='present').map(p=>p.salarieId)).size;
    const we=dow(d)===0||dow(d)===6;
    cases+=`<button class="${d===jour?'sel ':''}${d===auj?'auj ':''}${we?'we':''}" onclick="U.ptJour='${d}';render()"><b>${i}</b>${pres?`<small class="np">👷 ${pres}</small>`:''}${abs?`<small class="na">${abs} abs.</small>`:''}</button>`;
  }
  const titre=new Date(y,mo-1,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  return `<div class="card"><div class="row" style="margin-bottom:8px"><button class="btn sec sm" onclick="moisPt(-1)" aria-label="Mois précédent">◀</button><h3 class="grow" style="margin:0;text-align:center;text-transform:capitalize">${titre}</h3><button class="btn sec sm" onclick="moisPt(1)" aria-label="Mois suivant">▶</button></div>
    <div class="cal"><i>L</i><i>M</i><i>M</i><i>J</i><i>V</i><i>S</i><i>D</i>${cases}</div></div>
    ${vJourPointage(jour)}`;
}
function vJourPointage(d){
  const lignes=S.salaries.filter(s=>s.actif).map(s=>{
    const recs=S.pointages.filter(p=>p.salarieId===s.id && p.date===d && (!U.ptCh||p.chantierId===U.ptCh));
    const cg=!U.ptCh && !recs.length && congeLe(s.id,d);
    if(U.ptCh && !recs.length) return null;
    const ordre=recs.some(p=>p.statut==='present')?0 : recs.length||cg?1 : 2;
    const txt=recs.length ? recs.map(p=>p.statut==='present'
        ? `<span class="okp">✔${esc(chOf(p.chantierId)?.nom||'?')}</span> <span class="hint">${PERIODES[p.periode]}</span>`
        : `${STATUTS[p.statut].i} ${STATUTS[p.statut].l} <span class="hint">${PERIODES[p.periode]}</span>`).join('<br>')
      : cg ? '🏖️ Congé prévu' : '<span class="muted">Non pointé</span>';
    return {ordre, h:`<tr><td><b>${esc(s.nom)}</b></td><td>${txt}</td></tr>`, nom:s.nom};
  }).filter(Boolean).sort((a,b)=>a.ordre-b.ordre || a.nom.localeCompare(b.nom));
  return `<div class="card"><h3 style="text-transform:capitalize">${fmtLong(d)}</h3>
    <div class="tbl"><table><tbody>${lignes.map(l=>l.h).join('')||'<tr><td class="muted">Personne n\'est pointé ce jour-là</td></tr>'}</tbody></table></div></div>`;
}
function vBPointages(){
  const recs=pointagesFiltres().sort((a,b)=>b.date.localeCompare(a.date));
  const sal=S.salaries, chs=S.chantiers;
  const nomS=id=>sal.find(s=>s.id===id)?.nom||'?', nomC=id=>chOf(id)?.nom||'?';
  const rec={}; recs.forEach(p=>{ const r=rec[p.salarieId]=rec[p.salarieId]||{ch:{},maladie:0,conge:0,autre:0};
    if(p.statut==='present') r.ch[p.chantierId]=(r.ch[p.chantierId]||0)+JOURS[p.periode]; else r[p.statut==='intemperies'?'autre':p.statut]+=JOURS[p.periode]; });
  if(!U.ptCh) for(const s of sal) for(const d of joursOuvres(U.ptDu,U.ptAu)) if(congeLe(s.id,d) && !S.pointages.some(p=>p.salarieId===s.id&&p.date===d)){ const r=rec[s.id]=rec[s.id]||{ch:{},maladie:0,conge:0,autre:0}; r.conge+=1; }
  const al=alertes();
  return `<div class="scroll"><div class="wrap" style="max-width:1200px">
    ${vCalPointage()}
    <div class="card"><div class="row">
      <label class="f">Du<input type="date" value="${U.ptDu}" onchange="U.ptDu=this.value;render()"></label>
      <label class="f">Au<input type="date" value="${U.ptAu}" onchange="U.ptAu=this.value;render()"></label>
      <label class="f">Chantier<select onchange="U.ptCh=this.value;render()"><option value="">Tous</option>${chs.map(c=>`<option value="${c.id}" ${U.ptCh===c.id?'selected':''}>${esc(c.nom)}</option>`).join('')}</select></label>
      <div class="grow"></div><button class="btn" onclick="exporter()" style="align-self:flex-end">⬇️ Export Excel</button></div></div>
    ${al.length?`<div class="card"><h3>⚠️ À vérifier (${al.length})</h3>${al.slice(0,40).map(a=>`<div class="alert warn">${esc(a.t)}</div>`).join('')}${al.length>40?`<p class="hint">… et ${al.length-40} autres</p>`:''}</div>`:''}
    <div class="card"><h3>Récapitulatif (en jours)</h3><div class="tbl"><table><thead><tr><th>Salarié</th><th>Présence par chantier</th><th class="num">Total présent</th><th class="num">🤒</th><th class="num">🏖️</th><th class="num">❓</th></tr></thead><tbody>
      ${Object.entries(rec).map(([id,r])=>{ const tot=Object.values(r.ch).reduce((a,b)=>a+b,0); return `<tr><td><b>${esc(nomS(id))}</b></td><td>${Object.entries(r.ch).map(([c,j])=>`${esc(nomC(c))} : <b>${num(j,1)}</b>`).join('<br>')||'—'}</td><td class="num"><b>${num(tot,1)}</b></td><td class="num">${r.maladie||''}</td><td class="num">${r.conge||''}</td><td class="num">${r.autre||''}</td></tr>`; }).join('')||'<tr><td colspan="7" class="muted">Aucun pointage sur la période</td></tr>'}
    </tbody></table></div></div>
    <div class="card"><h3>Ajouter / corriger un pointage</h3><div class="row">
      <input type="date" id="cD" value="${today()}"><select id="cS">${sal.map(s=>`<option value="${s.id}">${esc(s.nom)}</option>`).join('')}</select>
      <select id="cC">${chs.map(c=>`<option value="${c.id}">${esc(c.nom)}</option>`).join('')}</select>
      <select id="cP">${Object.entries(PERIODES).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select>
      <select id="cT">${Object.entries(STATUTS).filter(([k])=>k!=='intemperies').map(([k,v])=>`<option value="${k}">${v.i} ${v.l}</option>`).join('')}</select>
      <button class="btn" onclick="corrPt()">Enregistrer</button></div></div>
  </div></div>`;
}
function corrPt(){ const s=$('#cS').value, c=$('#cC').value; if(!s||!c) return toast('Salarié et chantier requis'); setPointage(s, c, $('#cD').value, $('#cP').value, $('#cT').value); render(); toast('Pointage enregistré'); }
function delPt(id){ S.pointages=S.pointages.filter(p=>p.id!==id); save(); render(); }

function exporter(){
  const nomS=id=>S.salaries.find(s=>s.id===id)?.nom||'?', nomC=id=>chOf(id)?.nom||'?';
  const det=pointagesFiltres().sort((a,b)=>a.date.localeCompare(b.date)||nomS(a.salarieId).localeCompare(nomS(b.salarieId)))
    .map(p=>({Date:p.date, 'Salarié':nomS(p.salarieId), Chantier:nomC(p.chantierId), 'Période':PERIODES[p.periode], Statut:STATUTS[p.statut].l, Jours:JOURS[p.periode]}));
  if(!U.ptCh) for(const s of S.salaries) for(const d of joursOuvres(U.ptDu,U.ptAu)) if(congeLe(s.id,d) && !S.pointages.some(p=>p.salarieId===s.id&&p.date===d))
    det.push({Date:d,'Salarié':s.nom,Chantier:'—','Période':'Journée',Statut:'Congé (prévu)',Jours:1});
  const rec={}; det.forEach(r=>{ const k=r['Salarié']+'|'+r.Chantier; const o=rec[k]=rec[k]||{'Salarié':r['Salarié'],Chantier:r.Chantier,'Présent (j)':0,'Maladie (j)':0,'Congé (j)':0,'Autre (j)':0};
    const col={'Présent':'Présent (j)','Maladie':'Maladie (j)','Congé':'Congé (j)','Congé (prévu)':'Congé (j)','Intempéries':'Autre (j)','Autre':'Autre (j)'}[r.Statut]; o[col]+=r.Jours; });
  const av=[]; for(const p of S.plans){ if(U.ptCh && p.chantierId!==U.ptCh) continue; const st=statsPlan(p);
    etapesAffichees(p).forEach(e=>av.push(estOuv(e)
      ? {Chantier:nomC(p.chantierId), Plan:p.nom, 'Étape':e.nom, 'Ouvertures faites':st.ouv.faites, 'Ouvertures à faire':st.ouv.tot-st.ouv.faites, 'Avancement (%)':Math.round(st.pct(e.id))}
      : st.m2
      ? {Chantier:nomC(p.chantierId), Plan:p.nom, 'Étape':e.nom, 'Total zones (m²)':+st.m2.tot.toFixed(2), 'Fait (m²)':+(st.m2.fait[e.id]||0).toFixed(2), 'Reste (m²)':+Math.max(st.m2.tot-(st.m2.fait[e.id]||0),0).toFixed(2), 'Avancement (%)':Math.round(st.pct(e.id))}
      : {Chantier:nomC(p.chantierId), Plan:p.nom, 'Étape':e.nom, 'Avancement (%)':st.ref?Math.round(st.pct(e.id)):''})); }
  const zo=[]; for(const z of S.zones){ if(U.ptCh && z.chantierId!==U.ptCh) continue; const p=S.plans.find(x=>x.id===z.planId); if(!p) continue; const r=statsZone(z);
    etapesAffichees(p).filter(e=>!estOuv(e)).forEach(e=>zo.push({Chantier:nomC(z.chantierId), Plan:p.nom, Zone:z.nom, 'Surface (m²)':z.m2, 'Étape':e.nom, 'Fait (m²)':+(r[e.id]||0).toFixed(2), 'Reste (m²)':+Math.max(z.m2-(r[e.id]||0),0).toFixed(2)})); }
  const fname=`pointages_${U.ptDu}_au_${U.ptAu}`;
  if(window.XLSX){
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(det.length?det:[{Info:'Aucun pointage'}]), 'Pointages');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(rec).length?Object.values(rec):[{Info:'—'}]), 'Récapitulatif');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(av.length?av:[{Info:'—'}]), 'Avancement');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(zo.length?zo:[{Info:'Aucune zone de travail'}]), 'Zones (m²)');
    const pr=[]; for(const c of S.chantiers){ if(U.ptCh && c.id!==U.ptCh) continue; for(let j=U.ptDu; j<=U.ptAu; j=addDays(j,1)){ const p=productionJour(c.id,j);
      etapesTout(c.id).forEach(e=>{ if(p[e.id]>0) pr.push({Date:j, Chantier:c.nom, 'Étape':e.nom, 'Posé':+p[e.id].toFixed(2), 'Unité':estOuv(e)?'ouvertures':'m²'}); }); } }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pr.length?pr:[{Info:'Aucune production sur la période'}]), 'Production par jour');
    const ou=S.ouvertures.filter(o=>!U.ptCh||o.chantierId===U.ptCh).map(o=>({Chantier:nomC(o.chantierId), Plan:S.plans.find(p=>p.id===o.planId)?.nom||'', 'Ouverture':o.type+o.num, Type:TYPES_OUV[o.type].l, 'État':o.fait?'Fait':'À faire', 'Date':o.date||'', 'Par':o.auteur||''}));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ou.length?ou:[{Info:'Aucune ouverture placée'}]), 'Ébrasements');
    XLSX.writeFile(wb, fname+'.xlsx');
  } else {
    const cols=Object.keys(det[0]||{Date:1}); const csv=[cols.join(';')].concat(det.map(r=>cols.map(c=>r[c]).join(';'))).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})); a.download=fname+'.csv'; a.click();
  }
}

/* =========================================================
   Démarrage
   ========================================================= */
/* Mise à niveau des données enregistrées par une version précédente */
function migrer(){
  for(const k of Object.keys(EMPTY())) if(Array.isArray(EMPTY()[k]) && !Array.isArray(S[k])) S[k]=[];
  S.chantiers.forEach(c=>{
    if(!c.etapes||!c.etapes.length) c.etapes=defEtapes();
    c.etapes.forEach(e=>{ if(e.id==='ebrasements' && !e.mode) e.mode='ouvertures'; });
  });
}
(async()=>{
  const ok=await DB.open();
  const st=await DB.get('kv','state');
  if(st) S=Object.assign(EMPTY(), st);
  migrer();
  await demarrerSync();
  render();
  synchroniser();
  if(!ok) toast('Stockage indisponible : les données ne seront pas conservées','warn');
})();
