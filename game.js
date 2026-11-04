/* Táctica Royale: Mayas vs China vs Egipto — v3 (torneo por duelos) */
(function(){
'use strict';
const TEAMS={
  m:{name:'Mayas',adj:'Maya',color:'#20c08f',dark:'#0b6b50',light:'#8ff5cf',keys:['1','2','3','4'],pkey:'5',p2key:'6',p2:'Ofrenda de cacao',p2i:'🌿',p2desc:'Recuperas 90 PS al final de la ronda.',god:'Kukulkán',power:'Invocar a Kukulkán',pdesc:'La serpiente emplumada causa 180 de daño y tu daño ×2 esta ronda.',obs:4},
  c:{name:'China',adj:'China',color:'#ef4a42',dark:'#8e1d1a',light:'#ffb3a8',keys:['q','w','e','r'],pkey:'t',p2key:'y',p2:'Espejo de bronce',p2i:'🪞',p2desc:'La mitad del daño que recibas esta ronda rebota al rival (máx. 120).',god:'Dragón Azul',power:'Invocar al Dragón Azul',pdesc:'El guardián del cielo del este roba 200 PS al rival.',obs:0},
  e:{name:'Egipto',adj:'Egipcia',color:'#f5b731',dark:'#94620a',light:'#ffe9a8',keys:['a','s','d','f'],pkey:'g',p2key:'h',p2:'Arpón de Horus',p2i:'🔱',p2desc:'Horus lanza su arpón: 75 de daño directo al rival.',god:'Ra',power:'Invocar a Ra',pdesc:'La barca solar cura 250 PS y recibes la mitad del daño esta ronda.',obs:2}
};
const ORDER=['m','c','e'];
const MAXHP=700, QTIME=15000, DUELQ=4, PCOST=10, P2COST=5;
const L=['A','B','C','D'];
const CIVTAG={e:['Egipto','#c98512'],c:['China','#d8352d'],m:['Mayas','#119a6c'],x:['El ensayo','#6b4bd8'],b:['¡Bonus!','#c94cf0']};
const DEFAULT_URL='https://claude.ai/artifact/WEWvawGWCdDZJMsDsN314E';

/* ---------- Preguntas (solo de la infografía, la presentación y el ensayo) ---------- */
// d: 'b' baja · 'm' media
const BANK=[
 {c:'e',d:'b',q:'¿Cuántos días tenía el calendario civil egipcio?',o:['365','360','260','584'],x:'12 meses de 30 días más 5 días de fiesta: 365 días.'},
 {c:'e',d:'b',q:'Para Egipto, el cielo era la diosa…',o:['Nut','Isis','Maat','Hathor'],x:'Nut se arqueaba sobre la tierra, cubierta de estrellas, y cada mañana daba a luz al Sol.'},
 {c:'e',d:'b',q:'¿Hacia dónde apunta la Gran Pirámide casi sin error?',o:['Al norte','Al este','Al oeste','A la Luna'],x:'Sus lados se desvían del norte verdadero apenas unos 3 minutos de arco.'},
 {c:'e',d:'b',q:'¿Qué nos dejó Egipto que todavía usamos?',o:['El año de 365 días y el día de 24 horas','El número cero','El mapa estelar más antiguo','Las tablas de eclipses'],x:'Nuestro calendario y nuestro reloj tienen raíces egipcias.'},
 {c:'e',d:'b',q:'Para los egipcios, la constelación de Orión era el dios…',o:['Osiris','Ra','Anubis','Horus'],x:'Orión era Osiris y Sirio era Isis.'},
 {c:'e',d:'m',q:'¿Cuántos grupos de estrellas (decanos) marcaban las horas de la noche en Egipto?',o:['36','12','24','52'],x:'36 decanos, uno cada 10 días: el origen de nuestro día de 24 horas.'},
 {c:'e',d:'m',q:'En Abu Simbel, ¿en qué meses entra el Sol hasta el fondo del templo?',o:['Febrero y octubre','Enero y julio','Solo en diciembre','Marzo y septiembre'],x:'Dos veces al año la luz ilumina el santuario del fondo.'},
 {c:'e',d:'m',q:'¿Cuántas estaciones tenía el año egipcio?',o:['3','4','2','12'],x:'Inundación, siembra y cosecha, al ritmo del Nilo.'},
 {c:'e',d:'m',q:'El reloj de agua de Karnak es de alrededor del año…',o:['1400 a.C.','1054 d.C.','46 a.C.','1500 d.C.'],x:'Marcaba las horas de la noche para los rituales.'},
 {c:'e',d:'m',q:'Según el ensayo, el calendario civil de 365 días se desfasaba respecto a Sirio…',o:['1 día cada 4 años','1 día cada año','10 días por año','Nunca se desfasaba'],x:'Porque el año entre ortos de Sirio dura unos 365,25 días.'},
 {c:'e',d:'m',q:'La reforma juliana (46 a.C.) adoptó un año de…',o:['365¼ días','360 días','365 días exactos','584 días'],x:'Se elaboró con la asesoría de Sosígenes de Alejandría.'},
 {c:'e',d:'m',q:'¿Cómo cruzaba Ra el cielo cada día?',o:['En una barca','En un carro de fuego','Montado en un dragón','Volando como halcón'],x:'De día cruzaba el cielo y de noche el inframundo.'},
 {c:'c',d:'b',q:'¿Cómo llamaban los astrónomos chinos a las estrellas que aparecían de repente?',o:['Estrellas invitadas','Estrellas fugaces','Estrellas imperiales','Estrellas dragón'],x:'Hoy esos registros permiten fechar supernovas.'},
 {c:'c',d:'b',q:'¿Qué dejó la «estrella invitada» de 1054?',o:['La Nebulosa del Cangrejo','El cometa Halley','Los anillos de Saturno','La Vía Láctea'],x:'Los astrónomos todavía usan ese registro.'},
 {c:'c',d:'b',q:'¿Cuál es el mapa de estrellas completo más antiguo que se conserva?',o:['El Atlas de Dunhuang','El Códice de Dresde','El Calendario de El Cairo','El Almagesto'],x:'Del siglo VII, con unas 1.300 estrellas.'},
 {c:'c',d:'b',q:'Para China, el cielo era…',o:['Un gobierno que juzgaba al emperador','Una diosa que da a luz al Sol','Un tiempo que gira en ciclos','Un océano de agua'],x:'El emperador era el Hijo del Cielo.'},
 {c:'c',d:'b',q:'¿Qué movía la torre-reloj de Su Song (c. 1090)?',o:['El agua','El viento','El vapor','Caballos'],x:'Medía 12 metros y tenía una esfera de bronce que seguía las estrellas.'},
 {c:'c',d:'b',q:'¿Quién anotaba cada fenómeno del cielo en China, generación tras generación?',o:['La Oficina Astronómica del Estado','Los monjes de un templo','Los comerciantes','Los soldados de la Gran Muralla'],x:'Un programa de vigilancia del cielo de más de dos mil años.'},
 {c:'c',d:'m',q:'Completa la idea china del universo: «Cielo redondo, tierra…»',o:['cuadrada','plana','redonda','infinita'],x:'Aparece en monedas, altares y templos.'},
 {c:'c',d:'m',q:'En el cielo chino, la estrella polar representaba…',o:['Al emperador','Al Sol','Al pueblo','A un dragón'],x:'Las constelaciones eran sus funcionarios.'},
 {c:'c',d:'m',q:'¿Qué anotó Gan De hacia el 364 a.C.?',o:['Una mancha en el Sol','Un eclipse de Luna','Una supernova','El cometa Halley'],x:'Dos mil años antes del telescopio.'},
 {c:'c',d:'m',q:'El observatorio de Gaocheng (1276) logró medir…',o:['El año con precisión de segundos','La distancia a la Luna','El tamaño del Sol','La velocidad de la luz'],x:'Lo hacía midiendo la sombra del Sol.'},
 {c:'c',d:'m',q:'El Mandato del Cielo es una idea de la dinastía…',o:['Zhou','Song','Han','Ming'],x:'De la dinastía Zhou, hacia el 1046 a.C.'},
 {c:'c',d:'m',q:'Para China, ¿qué podía significar un cometa o un eclipse?',o:['Que el gobierno iba mal','Que llegaba la lluvia','Que era Año Nuevo','Nada especial'],x:'Todo en el cielo era un mensaje.'},
 {c:'m',d:'b',q:'¿Cuántos días tiene el calendario ritual maya?',o:['260','365','584','360'],x:'Se combinaba con el calendario solar de 365 días.'},
 {c:'m',d:'b',q:'Los calendarios mayas de 260 y 365 días vuelven a coincidir cada…',o:['52 años','10 años','100 años','365 años'],x:'Como engranajes que vuelven a encajar.'},
 {c:'m',d:'b',q:'¿Qué forma tenía el cero maya?',o:['De concha','De círculo','De serpiente','De sol'],x:'En Mesoamérica ya se usaba hacia el 36 a.C.'},
 {c:'m',d:'b',q:'¿Cómo se llama el inframundo maya?',o:['Xibalbá','Duat','Olimpo','Valhalla'],x:'Cielo, tierra y Xibalbá eran los tres mundos.'},
 {c:'m',d:'b',q:'¿Qué aparece en El Castillo de Chichén Itzá en los equinoccios?',o:['Una serpiente de luz','Un eclipse','Un arcoíris','Un dragón de fuego'],x:'La sombra de las escalinatas forma una serpiente.'},
 {c:'m',d:'b',q:'Para los mayas, Venus era un astro de…',o:['Guerra','Lluvia','Amor','Cosecha'],x:'Ligado a Kukulkán y a momentos de peligro y cambio.'},
 {c:'m',d:'m',q:'¿En qué códice están las tablas mayas para predecir Venus y los eclipses?',o:['Códice de Dresde','Atlas de Dunhuang','Calendario de El Cairo','Códice de Karnak'],x:'Los códices eran libros de corteza.'},
 {c:'m',d:'m',q:'¿Cómo se llama el observatorio de Chichén Itzá?',o:['El Caracol','La Torre del Sol','El Faro','Gaocheng'],x:'Junto con los Grupos E, servía para seguir al Sol y a Venus.'},
 {c:'m',d:'m',q:'¿Cuántos escalones suma El Castillo de Chichén Itzá?',o:['365','260','52','584'],x:'Uno por cada día del año solar.'},
 {c:'m',d:'m',q:'¿Qué árbol sagrado unía los tres mundos mayas?',o:['La ceiba','El roble','El bambú','La palmera'],x:'Se ha relacionado con la Vía Láctea.'},
 {c:'m',d:'m',q:'¿Cuántos niveles tenía el cielo maya?',o:['13','9','7','3'],x:'Xibalbá, el inframundo, tenía 9.'},
 {c:'x',d:'b',q:'¿Qué hay en el centro de la Nebulosa del Cangrejo?',o:['Un púlsar (estrella de neutrones)','Un agujero negro','Un planeta','Una estrella como el Sol'],x:'Gira una vez cada 33,4 milisegundos.'},
 {c:'x',d:'m',q:'Según el ensayo, la astronomía maya es un caso de…',o:['Convergencia: desarrollo independiente','Copia de la astronomía china','Herencia del calendario egipcio','Mito sin cálculos'],x:'Soluciones comparables sin una cadena de transmisión demostrada.'},
 {c:'x',d:'m',q:'¿Por qué las supernovas tipo Ia sirven para medir distancias?',o:['Su brillo máximo se puede calibrar','Son las más cercanas','Siempre son azules','Duran mil años'],x:'Son «velas estandarizables».'},
 {c:'x',d:'m',q:'¿Qué permitió descubrir la fecha histórica de 1054 sobre la Nebulosa del Cangrejo?',o:['Que se expande más rápido de lo esperado','Que es un agujero negro','Que está dentro del sistema solar','Que dejó de existir'],x:'Sus filamentos apuntan a ~1130–1140: algo la está acelerando.'}
];
// Eventos celestes (bonus cada 3 preguntas)
const EVENTS={
 sn1054:{title:'La estrella invitada',date:'4 de julio de 1054',sub:'Una estrella nueva aparece en Tauro… ¡y se ve de día!',sky:'day',say:['¡Mira, una estrella de día!','¡Una estrella invitada!','¡Una luz nueva!'],
   q:{q:'¿Cuántos días se vio de día la «estrella invitada» de 1054?',o:['23 días','3 días','185 días','Un solo día'],x:'Fue visible de día 23 días y de noche 653, según la dinastía Song.'}},
 halley:{title:'Un cometa en el cielo',date:'240 a.C.',sub:'Los astrónomos chinos anotan un cometa con larga cola.',sky:'night',say:['¡Una estrella con cola!','¡Anótenlo: un cometa!','¡Un mensaje del cielo!'],
   q:{q:'¿Desde qué año anotaron los chinos el cometa Halley?',o:['240 a.C.','1054 d.C.','364 a.C.','1500 d.C.'],x:'Lo registraron casi en cada visita durante más de dos mil años.'}},
 eclipse:{title:'¡Eclipse total de Sol!',date:'Un día cualquiera… a mediodía',sub:'La Luna tapa al Sol y el día se vuelve noche.',sky:'eclipse',say:['¡Lo predijimos!','¡El cielo nos advierte!','¡Ra se apaga!'],
   q:{q:'¿Qué hacían las tablas mayas de eclipses?',o:['Marcaban los meses en que un eclipse era posible','Medían la temperatura del Sol','Contaban las estrellas','Guiaban barcos en el mar'],x:'Eran tablas para anticipar eclipses, en el Códice de Dresde.'}},
 venus:{title:'Vuelve Venus',date:'Al amanecer',sub:'Venus reaparece brillante sobre el horizonte del este.',sky:'dawn',say:['¡Kukulkán regresa!','Qué brillante…','¡La estrella del alba!'],
   q:{q:'Según los mayas, ¿cada cuántos días repite Venus su ciclo?',o:['584','260','365','52'],x:'El valor real es 583,92 días: corregían el pequeño error.'}},
 sirius:{title:'Regresa Sirio',date:'Verano, antes del amanecer',sub:'Sirio reaparece en el horizonte del este, justo antes que el Sol.',sky:'dawn',say:['Qué estrella tan blanca','Una estrella nueva al alba','¡Isis ha vuelto!'],
   q:{q:'Cuando Sirio reaparecía al amanecer, ¿qué anunciaba en Egipto?',o:['La crecida del Nilo','El invierno','Un eclipse','La cosecha de maíz'],x:'Era el Año Nuevo egipcio.'}},
 sn1006:{title:'La supernova más brillante',date:'1 de mayo de 1006',sub:'Una estrella brilla tanto que casi proyecta sombras.',sky:'night',say:['¡Ilumina la selva!','¡Una estrella invitada enorme!','¡Brilla como la Luna!'],
   q:{q:'¿Quiénes registraron la supernova de 1006?',o:['China, Japón, Egipto, Iraq y Europa','Solo China','Solo los mayas','Nadie la vio'],x:'Llegó a magnitud ≈ −7,5: la más brillante de la historia registrada.'}}
};

const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- sonido ---------- */
let AC=null;
function tone(f,d=.12,type='square',v=.08,slide=0,delay=0){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime+delay;const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d)}catch(e){}}
const sfx={tick:()=>tone(880,.05),go:()=>{tone(523,.1);tone(784,.18,'square',.08,0,.11)},hit:()=>{tone(160,.3,'sawtooth',.1,50);tone(90,.25,'square',.06,40,.02)},heal:()=>tone(600,.3,'sine',.08,1300),
  win:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.3,'triangle',.1,0,i*.15)),lock:()=>tone(1200,.06,'sine'),power:()=>tone(260,.5,'sawtooth',.07,1600),boom:()=>tone(80,.8,'sawtooth',.14,25),
  vs:()=>{tone(110,.5,'sawtooth',.1,55);tone(220,.4,'square',.06,110,.15)},mystic:()=>[392,494,587,784].forEach((f,i)=>tone(f,.6,'sine',.06,0,i*.18)),flash:()=>tone(1800,1.2,'sine',.05,200)};

/* ---------- room ---------- */
let roomP=null;
function getRoom(){ if(!roomP){ const cl=(window.claude&&window.claude.use)?window.claude.use('room').catch(()=>null):Promise.resolve(null);
  roomP=cl.then(r=>r||(window.CielosNet?window.CielosNet.room():null)); } return roomP; }
function newCode(){const A='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<4;i++)s+=A[Math.random()*A.length|0];return s}

/* ---------- QR ---------- */
let qrP=null;
function loadQR(){ if(window.qrcode) return Promise.resolve(); if(!qrP) qrP=new Promise((res,rej)=>{ const srcs=['https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js','https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js']; let i=0;
  const tryOne=()=>{ if(i>=srcs.length) return rej(new Error('qr')); const s=document.createElement('script'); s.src=srcs[i++]; s.onload=()=>window.qrcode?res():tryOne(); s.onerror=tryOne; document.head.appendChild(s); }; tryOne(); }); return qrP; }
function drawQR(cv,text){
  return loadQR().then(()=>{ const q=qrcode(0,'M'); q.addData(text); q.make(); const n=q.getModuleCount(); const px=Math.floor(320/(n+4)); const sz=px*(n+4);
    cv.width=sz; cv.height=sz; const x=cv.getContext('2d'); x.fillStyle='#fff7e6'; x.fillRect(0,0,sz,sz);
    for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)){ const finder=(r<7&&c<7)||(r<7&&c>=n-7)||(r>=n-7&&c<7); x.fillStyle=finder?'#2a1660':'#1b1030';
      const X=(c+2)*px, Y=(r+2)*px; if(finder) x.fillRect(X,Y,px,px); else { x.beginPath(); x.arc(X+px/2,Y+px/2,px*.48,0,7); x.fill(); } }
    return true; }).catch(()=>{ const x=cv.getContext('2d'); cv.width=cv.height=320; x.fillStyle='#fff7e6'; x.fillRect(0,0,320,320); x.fillStyle='#1b1030'; x.font='bold 18px sans-serif'; x.textAlign='center'; x.fillText('No se pudo generar el QR',160,150); x.fillText('Usa el enlace y el código',160,176); return false; });
}

/* ======================= FONDO ANIMADO DEL ARENA ======================= */
function makeBackdrop(cv){
  const ctx=cv.getContext('2d'); let W=0,H=0,stat=null,stars=[];
  function build(){ W=cv.width=cv.clientWidth*Math.min(devicePixelRatio,2); H=cv.height=cv.clientHeight*Math.min(devicePixelRatio,2);
    stat=document.createElement('canvas'); stat.width=W; stat.height=H; const x=stat.getContext('2d');
    const ar=document.getElementById('g-arena'), rt=cv.getBoundingClientRect(); let hz=.64; if(ar&&ar.offsetParent&&!document.getElementById('v-juego').classList.contains('noarena')){ const r=ar.getBoundingClientRect(); hz=Math.min(.85,Math.max(.4,(r.top-rt.top+ r.height*.45)/rt.height)); } else hz=.9; cv._hz=hz;
    const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#120b3a'); g.addColorStop(hz*.7,'#2a1a6e'); g.addColorStop(hz-.01,'#4b2c8c'); g.addColorStop(hz,'#2f7a3b'); g.addColorStop(1,'#123a1c'); x.fillStyle=g; x.fillRect(0,0,W,H);
    // vía láctea
    for(let i=0;i<2600;i++){ const t=Math.random(); const cx=t*W, cy=H*.08+t*H*.32+(Math.random()-.5)*H*.12*Math.random(); x.fillStyle=`rgba(${200+Math.random()*55|0},${180+Math.random()*60|0},255,${Math.random()*.08})`; x.beginPath(); x.arc(cx,cy,Math.random()*6*W/1400+1,0,7); x.fill(); }
    // montañas lejanas
    x.fillStyle='#24154f'; x.beginPath(); x.moveTo(0,H*hz); for(let i=0;i<=24;i++){ x.lineTo(i/24*W,H*(hz-.08+.05*Math.sin(i*1.7)+.02*Math.sin(i*5.3))); } x.lineTo(W,H*hz); x.fill();
    // césped con losetas tipo arena
    const gy=H*hz; const tile=Math.max(28,W/36);
    for(let yy=gy;yy<H;yy+=tile*.5) for(let xx=((yy-gy)/(tile*.5))%2?-tile/2:0;xx<W;xx+=tile){ x.fillStyle=((xx/tile+(yy-gy)/(tile*.5))|0)%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.05)'; x.fillRect(xx,yy,tile,tile*.5); }
    const lg=x.createLinearGradient(0,gy,0,gy+H*.06); lg.addColorStop(0,'rgba(255,220,150,.18)'); lg.addColorStop(1,'rgba(255,220,150,0)'); x.fillStyle=lg; x.fillRect(0,gy,W,H*.06);
    // camino de piedra
    
    stars=Array.from({length:160},()=>({x:Math.random()*W,y:Math.random()*H*.55,r:Math.random()*1.6+.4,p:Math.random()*7,s:Math.random()*.8+.4}));
  }
  let shoot=null;
  cv._rebuild=()=>{stat=null}; function draw(t){ if(!cv.isConnected) return; if(!cv.clientWidth){ requestAnimationFrame(draw); return; } if(!stat||cv.clientWidth*Math.min(devicePixelRatio,2)!==W) build(); ctx.drawImage(stat,0,0);
    for(const s of stars){ ctx.globalAlpha=.35+.65*Math.abs(Math.sin(s.p+(reduce?0:t/1000*s.s))); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r*(W/1400+.5),0,7); ctx.fill(); }
    ctx.globalAlpha=1;
    if(!reduce){ if(!shoot&&Math.random()<.004) shoot={x:Math.random()*W*.8,y:Math.random()*H*.25,t:0}; if(shoot){ shoot.t+=1; const k=shoot.t*W/90; const g=ctx.createLinearGradient(shoot.x+k,shoot.y+k*.35,shoot.x+k-W*.08,shoot.y+k*.35-W*.028); g.addColorStop(0,'rgba(255,255,255,.9)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.strokeStyle=g; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(shoot.x+k,shoot.y+k*.35); ctx.lineTo(shoot.x+k-W*.08,shoot.y+k*.35-W*.028); ctx.stroke(); if(shoot.t>40) shoot=null; } }
    requestAnimationFrame(draw); }
  requestAnimationFrame(draw);
}

/* ======================= PARTÍCULAS Y EFECTOS (FX) ======================= */
let FX=null;
function makeFX(cv){
  const ctx=cv.getContext('2d'); const parts=[], effects=[]; let W=0,H=0,dpr=1;
  function size(){ dpr=Math.min(devicePixelRatio,2); W=cv.width=Math.max(1,cv.clientWidth*dpr); H=cv.height=Math.max(1,cv.clientHeight*dpr); }
  size(); addEventListener('resize',size);
  const P=o=>parts.push(Object.assign({vx:0,vy:0,g:0,life:1,decay:.022,r:3,col:'#fff',sq:false,add:true,rot:0,vr:0,grow:0},o));
  function burst(x,y,col,n,sp){ x*=dpr;y*=dpr; for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=(Math.random()*.8+.4)*(sp||7)*dpr; P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-2*dpr,col,r:(Math.random()*4+2)*dpr,g:.22*dpr}); }
    effects.push({t0:performance.now(),dur:450,draw(t){ if(t>=450) return 'done'; const k=t/450; ctx.globalAlpha=1-k; ctx.strokeStyle=col; ctx.lineWidth=7*dpr*(1-k); ctx.beginPath(); ctx.arc(x,y,(10+k*120)*dpr,0,7); ctx.stroke(); ctx.globalAlpha=1; }}); }
  function debris(x,y,n){ x*=dpr;y*=dpr; for(let i=0;i<n;i++){ const a=-Math.PI*(.1+.8*Math.random()), v=(Math.random()*7+3)*dpr; P({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,col:['#8a7a66','#c9b08a','#5e5146','#e9d7b0'][i%4],r:(Math.random()*5+3)*dpr,g:.45*dpr,sq:true,add:false,decay:.012,vr:(Math.random()-.5)*.4}); } }
  function smoke(x,y,n){ x*=dpr;y*=dpr; for(let i=0;i<n;i++) P({x:x+(Math.random()-.5)*40*dpr,y,vx:(Math.random()-.5)*.6*dpr,vy:-(Math.random()*1.2+.4)*dpr,col:'rgba(70,60,80,.5)',r:(Math.random()*12+10)*dpr,add:false,decay:.008,grow:.25*dpr}); }
  function flash(col,a){ effects.push({t0:performance.now(),dur:350,draw(t){ if(t>=350) return 'done'; ctx.globalAlpha=(a||.5)*(1-t/350); ctx.fillStyle=col; ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; }}); }
  const bez=(p0,c,p1,t)=>{const u=1-t;return [u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]};
  function glowDot(x,y,r,col){ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'#fff'); g.addColorStop(.3,col); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); }
  // ---- disparos temáticos ----
  function shoot(kind,a,b,col,cb){
    const p0=[a[0]*dpr,a[1]*dpr], p1=[b[0]*dpr,b[1]*dpr], t0=performance.now();
    if(kind==='m'){ // serpiente de jade
      const c=[(p0[0]+p1[0])/2,Math.min(p0[1],p1[1])-H*.32], hist=[];
      effects.push({t0,dur:950,draw(t){ const s=Math.min(1,t/950); const [x,y]=bez(p0,c,p1,s); const nx=-(p1[1]-p0[1]), ny=(p1[0]-p0[0]); const nl=Math.hypot(nx,ny)||1; const w=Math.sin(s*Math.PI*5)*26*dpr*(1-s);
          hist.unshift([x+nx/nl*w,y+ny/nl*w]); if(hist.length>22) hist.pop();
          for(let i=hist.length-1;i>=0;i--){ const [hx,hy]=hist[i]; const r=(13-i*.45)*dpr; ctx.fillStyle=i%3===0?'#ffd23f':'#20c08f'; ctx.strokeStyle='#0b3b2c'; ctx.lineWidth=2*dpr; ctx.beginPath(); ctx.arc(hx,hy,Math.max(2,r),0,7); ctx.fill(); ctx.stroke(); }
          const [hx,hy]=hist[0]; ['#ff5a5a','#3d8bff','#ffd23f','#20c08f'].forEach((fc,i)=>{ ctx.save(); ctx.translate(hx,hy); ctx.rotate(-1.2+i*.55+Math.sin(t/60)*.1); ctx.fillStyle=fc; ctx.beginPath(); ctx.ellipse(0,-20*dpr,5*dpr,14*dpr,0,0,7); ctx.fill(); ctx.restore(); });
          ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(hx+4*dpr,hy-4*dpr,4*dpr,0,7); ctx.fill(); ctx.fillStyle='#1b1030'; ctx.beginPath(); ctx.arc(hx+5*dpr,hy-4*dpr,2*dpr,0,7); ctx.fill();
          if(Math.random()<.6) P({x:hx,y:hy,vx:(Math.random()-.5)*2*dpr,vy:(Math.random()-.5)*2*dpr,col:Math.random()<.5?'#8ff5cf':'#ffd23f',r:3*dpr,decay:.04});
          if(s>=1) return 'hit'; }});
    } else if(kind==='c'){ // cohetes de fuegos artificiales
      let left=3;
      for(let k=0;k<3;k++){ const c=[(p0[0]+p1[0])/2+(k-1)*60*dpr,Math.min(p0[1],p1[1])-H*(.25+k*.06)], end=[p1[0]+(k-1)*30*dpr,p1[1]+(k-1)*10*dpr];
        effects.push({t0:t0+k*160,dur:720,draw(t){ if(t<0) return; const s=Math.min(1,t/720); const [x,y]=bez(p0,c,end,s);
          for(let i=0;i<3;i++) P({x,y,vx:(Math.random()-.5)*1.5*dpr,vy:(Math.random()-.5)*1.5*dpr+1*dpr,col:i?'#ffb347':'#fff3b0',r:(2+Math.random()*2)*dpr,decay:.05});
          glowDot(x,y,14*dpr,'#ff6a2a');
          if(s>=1){ for(let i=0;i<34;i++){ const a=i/34*Math.PI*2; P({x,y,vx:Math.cos(a)*6*dpr,vy:Math.sin(a)*6*dpr,col:i%2?'#ff4a3d':'#ffd23f',r:3*dpr,g:.08*dpr,decay:.025}); } if(--left===0) cb&&cb(); return 'done'; } }}); }
      return;
    } else if(kind==='e'){ // rayo solar
      const top=[p0[0],p0[1]-60*dpr];
      effects.push({t0,dur:850,draw(t){ if(t<300){ glowDot(top[0],top[1],(20+t/300*30)*dpr,'#ffd23f'); return; }
          const k=Math.min(1,(t-300)/150), fade=t>700?1-(t-700)/150:1; ctx.globalAlpha=Math.max(0,fade);
          const ex=top[0]+(p1[0]-top[0])*k, ey=top[1]+(p1[1]-top[1])*k;
          for(const [w,c] of [[34,'rgba(255,180,60,.35)'],[18,'rgba(255,220,120,.7)'],[7,'#fffbe0']]){ ctx.strokeStyle=c; ctx.lineWidth=w*dpr; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(top[0],top[1]); ctx.lineTo(ex,ey); ctx.stroke(); }
          glowDot(top[0],top[1],40*dpr,'#ffd23f'); ctx.globalAlpha=1;
          if(Math.random()<.8){ const q=Math.random(); P({x:top[0]+(ex-top[0])*q,y:top[1]+(ey-top[1])*q,vx:(Math.random()-.5)*3*dpr,vy:(Math.random()-.5)*3*dpr,col:'#ffe9a8',r:3*dpr,decay:.05}); }
          if(k>=1&&!this.hit){ this.hit=true; cb&&cb(); }
          if(t>=850) return 'done'; }});
      return;
    }
    effects[effects.length-1].onhit=()=>{ cb&&cb(); };
  }
  // ---- invocaciones de dioses ----
  function god(kind,a,b,cb){
    const p0=[a[0]*dpr,a[1]*dpr], p1=[b?b[0]*dpr:0,b?b[1]*dpr:0], t0=performance.now();
    if(kind==='m'||kind==='c'){
      const hist=[]; const N=kind==='m'?46:64; const dur=2600; let hit=false;
      effects.push({t0,dur,draw(t){ const s=Math.min(1,t/dur);
        let x,y;
        if(kind==='m'){ // sube en espiral y cae en picada sobre el rival
          if(s<.6){ const q=s/.6; x=p0[0]+Math.sin(q*Math.PI*2.2)*W*.22*q; y=p0[1]-q*H*.75+Math.cos(q*Math.PI*2.2)*40*dpr; }
          else { const q=(s-.6)/.4; const sx=p0[0]+Math.sin(2.2*Math.PI)*W*.22, sy=p0[1]-H*.75; x=sx+(p1[0]-sx)*q*q; y=sy+(p1[1]-sy)*q*q; } }
        else { // el dragón ondula sobre el cielo
          const q=Math.min(1,s/.7); x=p0[0]+(p1[0]-p0[0])*q; y=H*.22+Math.sin(q*Math.PI*3)*H*.08; }
        hist.unshift([x,y]); if(hist.length>N) hist.pop();
        ctx.lineCap='round';
        for(let i=hist.length-1;i>0;i--){ const [hx,hy]=hist[i]; const r=(kind==='m'?40:38)*dpr*(1-i/N*.75);
          ctx.fillStyle=kind==='m'?(i%4===0?'#ffd23f':'#1fb884'):(i%4===0?'#bfe9ff':'#2f7fe0'); ctx.strokeStyle=kind==='m'?'#0b3b2c':'#0b2a66'; ctx.lineWidth=3*dpr; ctx.beginPath(); ctx.arc(hx,hy,r,0,7); ctx.fill(); ctx.stroke();
          if(kind==='c'&&i%5===0){ ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(hx,hy-r); ctx.lineTo(hx-r*.4,hy-r*1.7); ctx.lineTo(hx+r*.4,hy-r*1.2); ctx.fill(); } }
        const [hx,hy]=hist[0]; const hr=(kind==='m'?54:50)*dpr;
        if(kind==='m'){ ['#ff5a5a','#3d8bff','#ffd23f','#20c08f','#ff5a5a','#3d8bff','#ffd23f'].forEach((fc,i)=>{ ctx.save(); ctx.translate(hx,hy); ctx.rotate(-1.6+i*.5+Math.sin(t/80)*.08); ctx.fillStyle=fc; ctx.strokeStyle='#1b1030'; ctx.lineWidth=2*dpr; ctx.beginPath(); ctx.ellipse(0,-hr*1.4,hr*.28,hr*.8,0,0,7); ctx.fill(); ctx.stroke(); ctx.restore(); }); }
        else { ctx.strokeStyle='#ffd23f'; ctx.lineWidth=5*dpr; ctx.beginPath(); ctx.moveTo(hx-hr*.4,hy-hr*.6); ctx.lineTo(hx-hr*.9,hy-hr*1.6); ctx.moveTo(hx+hr*.4,hy-hr*.6); ctx.lineTo(hx+hr*.9,hy-hr*1.6); ctx.stroke();
          ctx.strokeStyle='#bfe9ff'; ctx.lineWidth=3*dpr; ctx.beginPath(); ctx.moveTo(hx+hr*.7,hy+hr*.2); ctx.quadraticCurveTo(hx+hr*1.6,hy+hr*Math.sin(t/120),hx+hr*2.2,hy+hr*.8); ctx.moveTo(hx+hr*.7,hy+hr*.4); ctx.quadraticCurveTo(hx+hr*1.4,hy+hr*1.4,hx+hr*2,hy+hr*1.9); ctx.stroke(); }
        ctx.fillStyle=kind==='m'?'#1fb884':'#2f7fe0'; ctx.strokeStyle='#1b1030'; ctx.lineWidth=4*dpr; ctx.beginPath(); ctx.ellipse(hx,hy,hr*1.15,hr*.85,0,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(hx+hr*.35,hy-hr*.25,hr*.28,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle='#1b1030'; ctx.beginPath(); ctx.arc(hx+hr*.42,hy-hr*.22,hr*.13,0,7); ctx.fill();
        ctx.fillStyle='#ff8a8a'; ctx.beginPath(); ctx.moveTo(hx+hr*1.05,hy+hr*.2); ctx.lineTo(hx+hr*1.6,hy+hr*.35); ctx.lineTo(hx+hr*1.05,hy+hr*.45); ctx.fill();
        for(let i=0;i<3;i++) P({x:hist[hist.length-1][0],y:hist[hist.length-1][1],vx:(Math.random()-.5)*3*dpr,vy:(Math.random()-.5)*3*dpr,col:kind==='m'?'#8ff5cf':'#bfe9ff',r:4*dpr,decay:.03});
        if(kind==='c'&&s>.7){ const k=(s-.7)/.3; ctx.globalAlpha=.85; for(const [w,c] of [[40,'rgba(120,180,255,.35)'],[16,'rgba(200,230,255,.85)']]){ ctx.strokeStyle=c; ctx.lineWidth=w*dpr; ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(p1[0],p1[1]); ctx.stroke(); } ctx.globalAlpha=1;
          for(let i=0;i<4;i++){ const q=Math.random(); P({x:p1[0]+(p0[0]-p1[0])*q,y:p1[1]+(p0[1]-p1[1])*q-Math.sin(q*Math.PI)*H*.2,vx:(p0[0]-p1[0])*.01,vy:0,col:'#c94cf0',r:4*dpr,decay:.03}); } }
        if(!hit&&((kind==='m'&&s>=.98)||(kind==='c'&&s>=.75))){ hit=true; cb&&cb(); }
        if(s>=1) return 'done'; }});
    } else { // Ra: el disco solar con alas y la barca
      const dur=2700; let done=false;
      effects.push({t0,dur,draw(t){ const s=Math.min(1,t/dur); const rise=Math.min(1,s/.35); const cx=p0[0], cy=p0[1]-H*(.15+.35*rise); const R=(70+20*Math.sin(t/200))*dpr;
        ctx.globalCompositeOperation='lighter'; for(let i=0;i<24;i++){ const a=i/24*Math.PI*2+t/900; ctx.strokeStyle=`rgba(255,200,80,${.35*rise})`; ctx.lineWidth=10*dpr; ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R); ctx.lineTo(cx+Math.cos(a)*R*(1.8+.3*Math.sin(i*3+t/100)),cy+Math.sin(a)*R*(1.8+.3*Math.sin(i*3+t/100))); ctx.stroke(); }
        glowDot(cx,cy,R*2.2,'rgba(255,190,60,.8)'); ctx.globalCompositeOperation='source-over';
        const wing=Math.min(1,Math.max(0,(s-.2)/.3));
        for(const sg of [-1,1]){ ctx.save(); ctx.translate(cx,cy); ctx.scale(sg,1); ctx.fillStyle='#3d6bd8'; ctx.strokeStyle='#1b1030'; ctx.lineWidth=4*dpr;
          for(let f=0;f<4;f++){ ctx.beginPath(); ctx.moveTo(R*.6,-R*.1+f*R*.18); ctx.quadraticCurveTo(R*(1.6+wing*1.2),-R*(.9-f*.25)*wing,R*(1.2+wing*2.0-f*.3),R*(.05+f*.18)); ctx.closePath(); ctx.fillStyle=f%2?'#ffd23f':'#3d6bd8'; ctx.fill(); ctx.stroke(); } ctx.restore(); }
        ctx.fillStyle='#ff6a2a'; ctx.strokeStyle='#1b1030'; ctx.lineWidth=5*dpr; ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.fill(); ctx.stroke();
        ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.arc(cx,cy,R*.6,0,7); ctx.fill();
        // barca
        const bx=cx+(-1+2*s)*W*.12, by=cy+R*1.4; ctx.fillStyle='#c98512'; ctx.beginPath(); ctx.moveTo(bx-R*1.4,by); ctx.quadraticCurveTo(bx,by+R*.6,bx+R*1.4,by); ctx.lineTo(bx+R*1.1,by+R*.15); ctx.lineTo(bx-R*1.1,by+R*.15); ctx.fill(); ctx.stroke();
        if(s>.35&&Math.random()<.9) for(let i=0;i<3;i++) P({x:cx+(Math.random()-.5)*W*.25,y:cy+R,vx:(Math.random()-.5)*dpr,vy:(2+Math.random()*3)*dpr,col:'#ffe9a8',r:3*dpr,decay:.012});
        if(s>.5){ ctx.globalAlpha=.4*Math.min(1,(s-.5)*4); ctx.strokeStyle='#ffe9a8'; ctx.lineWidth=6*dpr; ctx.beginPath(); ctx.arc(p0[0],p0[1]+20*dpr,110*dpr,Math.PI,0); ctx.stroke(); ctx.globalAlpha=1; }
        if(!done&&s>.55){ done=true; cb&&cb(); }
        if(s>=1) return 'done'; }});
    }
  }
  function loop(now){ if(!cv.isConnected) return; requestAnimationFrame(loop); if(cv.clientWidth*dpr!==W) size(); ctx.clearRect(0,0,W,H);
    for(let i=effects.length-1;i>=0;i--){ const e=effects[i]; ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; const r=e.draw(now-e.t0); ctx.globalAlpha=1; if(r==='hit'){ effects.splice(i,1); e.onhit&&e.onhit(); } else if(r==='done'||now-e.t0>e.dur+2000) effects.splice(i,1); }
    for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=p.g; p.r+=p.grow; p.rot+=p.vr; p.life-=p.decay; if(p.life<=0){parts.splice(i,1);continue;}
      ctx.globalCompositeOperation=p.add?'lighter':'source-over'; ctx.globalAlpha=Math.max(0,p.life); ctx.fillStyle=p.col;
      if(p.sq){ ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r,-p.r,p.r*2,p.r*2); ctx.restore(); } else { ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(p.add?p.life:1),0,7); ctx.fill(); } }
    ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over'; }
  requestAnimationFrame(loop);
  return {burst,debris,smoke,flash,shoot,god};
}

/* ======================= ESCENA DE EVENTO CELESTE ======================= */
const obsImg={};
function chibiImg(t){ if(obsImg[t]) return obsImg[t]; const c=Art.CHARS[t][TEAMS[t].obs]; const im=new Image(); im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(Art.chibi(c.o)); obsImg[t]=im; return im; }
function playEvent(key){
  return new Promise(done=>{
    const ev=EVENTS[key]; const host=$('#v-juego');
    const wrap=document.createElement('div'); wrap.className='evt';
    wrap.innerHTML=`<canvas></canvas><div class="evt-cap"><div class="evt-k">Evento celeste · ${esc(ev.date)}</div><h2>${esc(ev.title)}</h2><p>${esc(ev.sub)}</p></div><button class="cr-btn ghost evt-skip">Saltar ▶</button>`;
    host.appendChild(wrap); const cv=wrap.querySelector('canvas'); const ctx=cv.getContext('2d');
    const dpr=Math.min(devicePixelRatio,2); const W=cv.width=host.clientWidth*dpr, H=cv.height=host.clientHeight*dpr;
    const imgs={m:chibiImg('m'),c:chibiImg('c'),e:chibiImg('e')};
    const stars=Array.from({length:260},()=>({x:Math.random()*W,y:Math.random()*H*.7,r:(Math.random()*1.4+.4)*dpr,p:Math.random()*7}));
    const DUR=7600, t0=performance.now(); let fin=false; sfx.mystic();
    let flashed=false;
    const end=()=>{ if(fin) return; fin=true; wrap.classList.add('out'); setTimeout(()=>{wrap.remove();done();},450); };
    wrap.querySelector('.evt-skip').onclick=end;
    const gy=H*.74;
    function sky(dark,dawn){ const g=ctx.createLinearGradient(0,0,0,gy);
      const lerp=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
      const top=lerp([70,140,255],[8,8,34],dark), mid=lerp([170,215,255],[30,22,80],dark), bot=dawn?lerp([255,170,110],[60,30,90],dark*.6):lerp([220,240,255],[60,40,110],dark);
      g.addColorStop(0,`rgb(${top})`); g.addColorStop(.6,`rgb(${mid})`); g.addColorStop(1,`rgb(${bot})`); ctx.fillStyle=g; ctx.fillRect(0,0,W,gy+2);
      if(dark>.3){ for(const s of stars){ ctx.globalAlpha=(dark-.3)/.7*(.4+.6*Math.abs(Math.sin(s.p+performance.now()/900))); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,7); ctx.fill(); } ctx.globalAlpha=1; } }
    function star(x,y,r,col,spikes){ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,'#fff'); g.addColorStop(.12,col); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill();
      if(spikes){ ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=2*dpr; for(let k=0;k<4;k++){ const a=k*Math.PI/2+Math.PI/4*0; ctx.beginPath(); ctx.moveTo(x-Math.cos(a)*r*1.6,y-Math.sin(a)*r*1.6); ctx.lineTo(x+Math.cos(a)*r*1.6,y+Math.sin(a)*r*1.6); ctx.stroke(); } } }
    function ground(dark){ const sil=`rgba(${Math.round(30-20*dark)},${Math.round(20-10*dark)},${Math.round(60-20*dark)},1)`;
      // Maya (izquierda): selva y pirámide escalonada
      ctx.fillStyle=sil; ctx.beginPath(); ctx.moveTo(0,gy); for(let i=0;i<=10;i++){ ctx.quadraticCurveTo(i*W*.034-W*.017,gy-H*(.06+.03*Math.sin(i*2)),i*W*.034,gy-H*.03); } ctx.lineTo(W*.36,gy+2); ctx.lineTo(0,gy+2); ctx.fill();
      const px=W*.16, pw=W*.16; for(let k=0;k<5;k++){ const w=pw*(1-k*.17), h=H*.035; ctx.fillRect(px-w/2,gy-h*(k+1),w,h+1); } ctx.fillRect(px-pw*.12,gy-H*.035*5-H*.05,pw*.24,H*.05);
      // China (centro): montañas y pagoda
      ctx.beginPath(); ctx.moveTo(W*.33,gy); ctx.lineTo(W*.42,gy-H*.17); ctx.lineTo(W*.47,gy-H*.1); ctx.lineTo(W*.55,gy-H*.22); ctx.lineTo(W*.66,gy); ctx.fill();
      const cx=W*.5; for(let k=0;k<3;k++){ const w=W*(.07-k*.017), y=gy-H*(.06+k*.07); ctx.fillRect(cx-w*.35,y,w*.7,H*.06); ctx.beginPath(); ctx.moveTo(cx-w*.75,y+H*.012); ctx.quadraticCurveTo(cx,y-H*.05,cx+w*.75,y+H*.012); ctx.fill(); }
      // Egipto (derecha): dunas y pirámides
      ctx.beginPath(); ctx.moveTo(W*.64,gy); ctx.quadraticCurveTo(W*.8,gy-H*.05,W,gy-H*.02); ctx.lineTo(W,gy+2); ctx.lineTo(W*.64,gy+2); ctx.fill();
      [[.78,.2],[.9,.13],[.7,.09]].forEach(([x,s])=>{ ctx.beginPath(); ctx.moveTo(W*x-W*s*.5,gy); ctx.lineTo(W*x,gy-W*s*.48); ctx.lineTo(W*x+W*s*.5,gy); ctx.fill(); });
      const gg=ctx.createLinearGradient(0,gy,0,H); gg.addColorStop(0,`rgb(${Math.round(40-25*dark)},${Math.round(30-15*dark)},${Math.round(70-30*dark)})`); gg.addColorStop(1,'#0b0820'); ctx.fillStyle=gg; ctx.fillRect(0,gy,W,H-gy);
      if(key==='sirius'){ ctx.fillStyle='rgba(120,190,255,.28)'; ctx.fillRect(W*.62,gy+H*.004,W*.38,H*.01); }
      // luces: antorchas y faroles
      ctx.globalCompositeOperation='lighter';
      [[.16,gy-H*.2,'255,170,60'],[.1,gy-H*.05,'255,170,60'],[.22,gy-H*.05,'255,170,60'],[.46,gy-H*.1,'255,120,60'],[.54,gy-H*.1,'255,120,60'],[.5,gy-H*.2,'255,200,90'],[.78,gy-H*.03,'255,190,90'],[.86,gy-H*.02,'255,190,90']].forEach(([x,y,c],i)=>{
        const f=(.75+.25*Math.sin(performance.now()/120+i*2))*(.35+.65*dark); const r=H*.035; const g=ctx.createRadialGradient(W*x,y,0,W*x,y,r); g.addColorStop(0,`rgba(${c},${.9*f})`); g.addColorStop(1,`rgba(${c},0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(W*x,y,r,0,7); ctx.fill(); });
      // borde iluminado del horizonte
      const rim=ctx.createLinearGradient(0,gy-H*.25,0,gy); rim.addColorStop(0,'rgba(0,0,0,0)'); rim.addColorStop(1,ev.sky==='dawn'?'rgba(255,140,80,.18)':'rgba(140,120,255,.12)'); ctx.fillStyle=rim; ctx.fillRect(0,gy-H*.25,W,H*.25);
      ctx.globalCompositeOperation='source-over';
    }
    function people(t){ const s=Math.min(W,H)*.3; const pos={m:W*.2,c:W*.5,e:W*.8};
      for(const k of ORDER){ const im=imgs[k]; if(!im.complete) continue; const bob=Math.sin(t/300+pos[k])*4*dpr; ctx.save(); ctx.translate(pos[k],H*.97+bob); ctx.rotate(-0.12); ctx.drawImage(im,-s*.42,-s,s*.84,s); ctx.restore(); }
      if(t>2600){ const a=Math.min(1,(t-2600)/400); ctx.globalAlpha=a; ctx.font=`900 ${Math.round(18*dpr)}px Nunito, sans-serif`; ctx.textAlign='center';
        ev.say.forEach((txt,i)=>{ const k=ORDER[i]; const x=pos[k], y=H*.97-s-26*dpr; const w=ctx.measureText(txt).width+28*dpr; ctx.fillStyle='#fff'; ctx.strokeStyle='#1b1030'; ctx.lineWidth=3*dpr; rr(x-w/2,y-30*dpr,w,36*dpr,12*dpr); ctx.fill(); ctx.stroke(); ctx.fillStyle='#1b1030'; ctx.fillText(txt,x,y-6*dpr); }); ctx.globalAlpha=1; } }
    function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
    function frame(now){ if(fin) return; const t=now-t0; const p=Math.min(1,t/DUR);
      let dark=ev.sky==='night'?1:ev.sky==='dawn'?.55:0;
      if(ev.sky==='eclipse'){ const c=Math.max(0,1-Math.abs(p-.55)/.25); dark=Math.min(1,c*1.4); }
      if(ev.sky==='dawn') dark=.75-.4*p;
      sky(dark,ev.sky==='dawn');
      if(ev.sky==='day'||ev.sky==='eclipse'){ const sx=W*.62, sy=H*.4; star(sx,sy,90*dpr,'rgba(255,230,150,.9)'); ctx.fillStyle='#fff6d0'; ctx.beginPath(); ctx.arc(sx,sy,34*dpr,0,7); ctx.fill();
        if(ev.sky==='eclipse'){ const mx=sx+(1-p/.55)*160*dpr*(p<.55?1:0)+(p>.55?-(p-.55)/.45*160*dpr:0);
          if(dark>.6){ ctx.globalCompositeOperation='lighter'; for(let k=0;k<14;k++){ const a=k/14*Math.PI*2+t/4000; ctx.strokeStyle=`rgba(220,230,255,${.25*dark})`; ctx.lineWidth=6*dpr; ctx.beginPath(); ctx.moveTo(sx+Math.cos(a)*36*dpr,sy+Math.sin(a)*36*dpr); ctx.lineTo(sx+Math.cos(a)*(80+20*Math.sin(k*3))*dpr,sy+Math.sin(a)*(80+20*Math.sin(k*3))*dpr); ctx.stroke(); } ctx.globalCompositeOperation='source-over'; }
          ctx.fillStyle='#120c28'; ctx.beginPath(); ctx.arc(mx,sy,35*dpr,0,7); ctx.fill(); } }
      if(key==='sn1054'||key==='sn1006'){ const x=key==='sn1054'?W*.38:W*.3, y=key==='sn1054'?H*.24:H*.42; const on=Math.max(0,(t-1500)/2200); if(on>0){ if(!flashed){flashed=true;sfx.flash();} const r=(18+on*(key==='sn1006'?120:80))*dpr*(1+.05*Math.sin(t/90)); star(x,y,Math.min(r,(key==='sn1006'?150:100)*dpr),key==='sn1054'?'rgba(200,220,255,.9)':'rgba(255,240,220,.9)',true); if(key==='sn1006'){ ctx.fillStyle=`rgba(200,210,255,${.12*Math.min(1,on)})`; ctx.fillRect(0,0,W,H);} } }
      if(key==='halley'){ const k=Math.min(1,t/6500); const x=W*(.1+.6*k), y=H*(.14+.18*k); const tg=ctx.createLinearGradient(x,y,x-W*.22,y-H*.12); tg.addColorStop(0,'rgba(200,230,255,.9)'); tg.addColorStop(1,'rgba(200,230,255,0)'); ctx.strokeStyle=tg; ctx.lineCap='round'; for(let s=0;s<3;s++){ ctx.lineWidth=(16-s*5)*dpr; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x-W*.1,y-H*(.03+s*.02),x-W*(.22+s*.03),y-H*(.12+s*.03)); ctx.stroke(); } star(x,y,24*dpr,'rgba(220,240,255,.95)'); }
      if(key==='venus'){ const k=Math.min(1,t/5000); const x=W*.18+k*W*.05, y=gy-H*.02-k*H*.32; star(x,y,(22+12*Math.sin(t/200))*dpr,'rgba(255,250,220,.95)',true); }
      if(key==='sirius'){ const k=Math.min(1,t/5000); const x=W*.84, y=gy-H*.02-k*H*.22; star(x,y,(18+8*Math.sin(t/150))*dpr,'rgba(190,215,255,.95)',true); const sg=ctx.createRadialGradient(W*.95,gy,0,W*.95,gy,H*.4); sg.addColorStop(0,'rgba(255,180,90,.5)'); sg.addColorStop(1,'rgba(255,180,90,0)'); ctx.fillStyle=sg; ctx.fillRect(W*.5,gy-H*.4,W*.5,H*.4); }
      ground(dark); people(t);
      if(t>=DUR) end(); else requestAnimationFrame(frame); }
    requestAnimationFrame(frame);
  });
}

/* =================== ANFITRIÓN =================== */
let H=null; window.__gH=()=>H;
function newState(){ return {gid:Math.random().toString(36).slice(2,8),phase:'lobby',pool:[],evs:[],qn:0,cur:null,
  matches:[],mi:-1,duel:null,wait:null,dq:0,hp:{m:MAXHP,c:MAXHP,e:MAXHP},en:{m:0,c:0,e:0},pwOn:{},pw2On:{},ans:{},qStart:0,res:null,winner:null,streak:{m:0,c:0,e:0}}; }
let room=null, hostBuilt=false, timerId=null, players={m:0,c:0,e:0}, code=null, joinUrl=(window.claude?store.get('cielos-url')||DEFAULT_URL:location.href.split('#')[0]), named=null;

function host(){
  const root=$('#v-juego');
  if(hostBuilt) return; hostBuilt=true; H=newState(); code=newCode();
  root.innerHTML=`<canvas class="g-bg" aria-hidden="true"></canvas>
  <div class="g-top">
    <a class="cr-btn ghost sm" href="#inicio">◀ Inicio</a>
    <span class="round outline-text" id="g-round">Táctica Royale</span>
    <span class="spacer"></span>
    <div class="bracket-mini" id="g-bm"></div>
    <span class="pill" id="g-code" hidden></span>
    <span class="pill" id="g-net">Conectando…</span>
    <button class="pill" id="g-mod" title="Botones para marcar respuestas a mano">Moderador</button>
    <button class="pill" id="g-full">Pantalla completa</button>
  </div>
  <div class="g-main" id="g-main">
    <div class="stage" id="g-stage"></div>
    <div class="arena" id="g-arena">${ORDER.map(t=>`
      <div class="tower" id="tw-${t}" style="--tc:${TEAMS[t].color};--td:${TEAMS[t].dark}">
        <div class="bubble" id="bb-${t}" hidden></div>
        <div class="hpwrap">${Art.crest(t,42)}<div class="hp"><i></i><b>${MAXHP}</b></div></div>
        <div class="badges" id="bd-${t}"></div>
        <div class="plat">${Art.tower(t)}<div class="cracks"></div></div>
        <div class="ttl">${TEAMS[t].name}</div>
        <div class="elix">${'<i></i>'.repeat(10)}</div>
        <div class="pwrow"><button class="pw" id="pw-${t}" disabled title="${esc(TEAMS[t].pdesc)}">⚡ ${TEAMS[t].god}</button><button class="pw p2" id="pw2-${t}" disabled title="${esc(TEAMS[t].p2desc)}">${TEAMS[t].p2i} ${TEAMS[t].p2}</button></div>
        <div class="mods">${L.map((l,k)=>`<button data-t="${t}" data-k="${k}">${l}</button>`).join('')}</div>
        <div class="keys">Teclas ${TEAMS[t].keys.join(' ').toUpperCase()} · dios ${TEAMS[t].pkey.toUpperCase()} · ${TEAMS[t].p2i} ${TEAMS[t].p2key.toUpperCase()} · <span id="pl-${t}">0</span> 📱</div>
        <div class="waitlbl">En espera</div>
      </div>`).join('')}
    </div>
    <canvas class="fx" id="g-fx"></canvas><div class="fxdom" id="g-main-fx"></div>
  </div>`;
  makeBackdrop(root.querySelector('.g-bg')); FX=makeFX($('#g-fx'));
  $('#g-mod').onclick=()=>document.body.classList.toggle('modmode');
  $('#g-full').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}catch(e){}};
  root.querySelectorAll('.mods button').forEach(b=>b.onclick=()=>answer(b.dataset.t,+b.dataset.k,performance.now()));
  ORDER.forEach(t=>{ $('#pw-'+t).onclick=()=>activatePower(t); $('#pw2-'+t).onclick=()=>activatePower2(t); });
  addEventListener('keydown',onKey);
  connectHost(); renderLobby(); renderTowers();
}
function connectHost(){
  getRoom().then(async r=>{
    room=r;
    if(!r){ $('#g-net').textContent='Sin celulares · usen el teclado'; renderLobby(); return; }
    $('#g-net').textContent='Conectando celulares…';
    for(let i=0;i<3&&!named;i++){ try{ named=await r.join('g-'+code.toLowerCase(),'host'); }catch(e){ named=null; if(r.peerjs){ code=newCode(); renderLobby(); } else break; } }
    if(r.peerjs&&!named){ room=null; $('#g-net').textContent='Sin conexión a internet para celulares · usen el teclado'; renderLobby(); return; }
    const R=named||r;
    $('#g-net').textContent='📱 Listo para celulares'; $('#g-net').classList.add('on');
    R.onPeers(ch=>onPeers(ch.peers),()=>{ $('#g-net').textContent='Sin celulares · usen el teclado'; $('#g-net').classList.remove('on'); });
    publish(); renderLobby();
  });
}
async function changeCode(){
  code=newCode();
  if(room){ try{ if(named) await named.leave(); }catch(e){} try{ named=await room.join('g-'+code.toLowerCase(),'host'); named.onPeers(ch=>onPeers(ch.peers)); }catch(e){ named=null; } publish(); }
  players={m:0,c:0,e:0}; renderLobby();
}
function onPeers(peers){
  const cnt={m:0,c:0,e:0};
  for(const p of peers){ const pr=p.presence||{}; if(pr.r!=='p'||!TEAMS[pr.t]) continue; cnt[pr.t]++;
    if(pr.g!==H.gid) continue;
    if(H.phase==='q'&&pr.a&&pr.a.qi===H.qid&&typeof pr.a.k==='number'){ const t=performance.now()-(Date.now()-p.updatedAt); answer(pr.t,pr.a.k,Math.max(H.qStart,t)); }
    if(H.phase==='q'&&pr.pw===H.qid) activatePower(pr.t);
    if(H.phase==='q'&&pr.pw2===H.qid) activatePower2(pr.t); }
  players=cnt; ORDER.forEach(t=>{const e=$('#pl-'+t); if(e) e.textContent=cnt[t]});
  if(H.phase==='lobby'){ const e=$('#lb-count'); if(e) e.innerHTML=countHtml(); }
}
function setArena(on){ const v=$('#v-juego'); v.classList.toggle('noarena',!on); const bg=v.querySelector('.g-bg'); bg&&bg._rebuild&&bg._rebuild(); }
function publish(){
  const R=named||room; if(!R) return; const q=H.cur;
  const st={r:'host',g:H.gid,ph:H.phase,qi:H.qid||0,hp:H.hp,en:H.en,lk:Object.keys(H.ans),pw:Object.keys(H.pwOn),pw2:Object.keys(H.pw2On),duel:H.duel,wait:H.wait,m:H.mi+1};
  if(q&&(H.phase==='q'||H.phase==='rev')){ st.q=q.q; st.o=q.o; st.rem=Math.max(0,QTIME-(performance.now()-H.qStart)); st.bonus=q.bonus?1:0; }
  if(H.phase==='rev'&&H.res){ st.ok=q.a; st.res=H.res.summary; }
  if(H.phase==='event') st.ev=H.cur&&H.cur.evTitle;
  if(H.phase==='end') st.win=H.winner;
  R.presence(st).catch(()=>{});
}
const inDuel=t=>H.duel&&H.duel.includes(t);
const alive=()=>(H.duel||[]).filter(t=>H.hp[t]>0);
const countHtml=()=>ORDER.map(t=>`<span style="color:${TEAMS[t].color}">${TEAMS[t].name} <b>${players[t]}</b></span>`).join(' · ');

function renderLobby(){
  if(H.phase!=='lobby') return; setArena(false); renderBracketMini();
  const link=joinUrl.replace(/#.*$/,'')+'#p-'+code.toLowerCase();
  $('#g-code').hidden=false; $('#g-code').textContent='Código '+code;
  $('#g-stage').innerHTML=`<div class="lobby">
    <div class="lb-main">
      <div class="lb-title"><span>Mayas</span><i>VS</i><span>China</span><i>VS</i><span>Egipto</span></div>
      <div class="rules">
        <div class="rule"><b>Torneo por duelos</b>Duelo 1: dos civilizaciones. Duelo 2: la ganadora contra la que esperaba. Duelo 3: las otras dos. Gran final: la ganadora del duelo 3 contra la del duelo 2.</div>
        <div class="rule"><b>Cada duelo</b>${MAXHP} PS por torre y hasta ${DUELQ} preguntas de 15 s. Quien acierta primero golpea más fuerte; responder en menos de 3 s es ¡crítico! Fallar cuesta 60 PS.</div>
        <div class="rule"><b>Eventos celestes</b>Cada 3 preguntas el cielo hace algo increíble y llega una pregunta bonus que cura y carga energía.</div>
        <div class="rule"><b>Dioses</b>La energía se carga más rápido si vas perdiendo. Con 10 de energía, invoca a tu dios durante una pregunta.</div>
      </div>
      <div class="powers">${ORDER.map(t=>`<div class="power" style="--tc:${TEAMS[t].color}">${Art.crest(t,40)}<div><b>${TEAMS[t].god} · 10 ⚡</b><span>${TEAMS[t].pdesc}</span><b style="margin-top:4px">${TEAMS[t].p2i} ${TEAMS[t].p2} · 5 ⚡</b><span>${TEAMS[t].p2desc}</span></div></div>`).join('')}</div>
      <button class="cr-btn big" id="g-start">¡Comenzar el torneo! ▶</button>
    </div>
    <div class="lb-qr">
      <div class="qr-h">Únete con tu celular</div>
      <canvas id="g-qr" width="320" height="320" aria-label="Código QR para unirse"></canvas>
      <div class="qr-code">${code}</div>
      <div class="qr-count" id="lb-count">${room?countHtml():'Celulares no disponibles en esta vista'}</div>
      <details class="qr-cfg"><summary>Configurar enlace del QR</summary>
        <label for="g-url">Pega aquí el enlace de esta página (Compartir → Copiar enlace)</label>
        <input id="g-url" type="url" value="${esc(joinUrl)}">
        <div class="qr-row"><button class="pill" id="g-urlok">Usar este enlace</button><button class="pill" id="g-newcode">Nuevo código</button><button class="pill" id="g-copy">Copiar enlace de equipo</button></div>
        <small>Los celulares necesitan internet. Si la red del aula bloquea la conexión, usen datos móviles o el teclado.</small>
      </details>
    </div>
  </div>`;
  drawQR($('#g-qr'),link);
  $('#g-start').onclick=startGame;
  $('#g-urlok').onclick=()=>{ const v=$('#g-url').value.trim(); if(/^https?:\/\//.test(v)){ joinUrl=v; store.set('cielos-url',v); renderLobby(); } };
  $('#g-newcode').onclick=changeCode;
  $('#g-copy').onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(link).then(()=>{$('#g-copy').textContent='¡Copiado!'}).catch(()=>{$('#g-url').value=link;$('#g-url').select();}); };
}
function renderTowers(){
  for(const t of ORDER){
    const tw=$('#tw-'+t); if(!tw) continue; const hp=H.hp[t];
    const role=!H.duel?'':H.duel[0]===t?'L':H.duel[1]===t?'R':'W';
    tw.style.order=role==='L'?0:role==='R'?2:1; tw.classList.toggle('waiting',role==='W'); tw.classList.toggle('right',role==='R');
    tw.querySelector('.hp i').style.transform=`scaleX(${hp/MAXHP})`; tw.querySelector('.hp b').textContent=Math.round(hp);
    tw.classList.toggle('dead',inDuel(t)&&hp<=0); tw.classList.toggle('low',inDuel(t)&&hp>0&&hp<=MAXHP*.35);
    tw.querySelector('.cracks').className='cracks'+(inDuel(t)&&hp<MAXHP*.66?' c1':'')+(inDuel(t)&&hp<MAXHP*.33?' c2':'');
    tw.querySelectorAll('.elix i').forEach((e,i)=>e.classList.toggle('on',i<H.en[t]));
    const pw=$('#pw-'+t); const can=inDuel(t)&&hp>0&&H.en[t]>=PCOST&&!H.pwOn[t];
    pw.disabled=!(H.phase==='q'&&can); pw.classList.toggle('ready',can); pw.classList.toggle('active',!!H.pwOn[t]);
    const p2=$('#pw2-'+t); const can2=inDuel(t)&&hp>0&&H.en[t]>=P2COST&&!H.pw2On[t]; p2.disabled=!(H.phase==='q'&&can2); p2.classList.toggle('ready',can2); p2.classList.toggle('active',!!H.pw2On[t]);
    const b=[]; if(inDuel(t)&&hp>0&&hp<=MAXHP*.35) b.push('<span class="badge fury">🔥 Furia +50 %</span>'); if(H.pwOn[t]) b.push(`<span class="badge pwb">⚡ ${TEAMS[t].god}</span>`); if(H.pw2On[t]) b.push(`<span class="badge pwb">${TEAMS[t].p2i} ${TEAMS[t].p2}</span>`); if(H.streak[t]>=2) b.push(`<span class="badge">🔥 Racha ×${H.streak[t]}</span>`);
    $('#bd-'+t).innerHTML=b.join('');
  }
}
function renderBracketMini(){
  const e=$('#g-bm'); if(!e) return;
  if(!H.matches.length){ e.innerHTML=''; return; }
  e.innerHTML=H.matches.map((m,i)=>`<span class="bm${i===H.mi?' now':''}">${i===3?'Final':'D'+(i+1)} ${m.a?Art.crest(m.a,18):'?'}<i>vs</i>${m.b?Art.crest(m.b,18):'?'}${m.w?'→'+Art.crest(m.w,18):''}</span>`).join('');
}
function buildPool(){
  const by={e:{b:[],m:[]},c:{b:[],m:[]},m:{b:[],m:[]},x:{b:[],m:[]}};
  shuffle(BANK).forEach(q=>by[q.c][q.d].push(q));
  const out=[]; let k=0;
  // alterna civilizaciones; 2 fáciles por cada media
  while(out.length<BANK.length){ const civ=['e','c','m','e','c','m','x'][k%7]; const diff=(k%3===2)?'m':'b'; const q=by[civ][diff].pop()||by[civ][diff==='b'?'m':'b'].pop(); if(q) out.push(q); k++; if(k>400) break; }
  return out;
}
function startGame(){
  const g=H.gid; H=newState(); H.gid=g+'x'; H.pool=buildPool(); H.evs=shuffle(Object.keys(EVENTS));
  const first=shuffle(ORDER.slice());
  H.matches=[{a:first[0],b:first[1]},{a:null,b:first[2]},{a:null,b:null},{a:null,b:null}];
  $('#g-code').hidden=true; setArena(true); startMatch(0);
}
function startMatch(i){
  H.mi=i; const m=H.matches[i]; H.duel=[m.a,m.b]; H.wait=ORDER.find(t=>!H.duel.includes(t)); H.dq=0;
  H.hp={m:MAXHP,c:MAXHP,e:MAXHP}; H.streak={m:0,c:0,e:0};
  H.phase='bracket'; publish(); renderTowers(); renderBracketMini();
  $('#g-round').textContent=i===3?'¡Gran final!':`Duelo ${i+1} de 4`;
  showBracket().then(()=>vsIntro()).then(nextStep);
}
function showBracket(){
  return new Promise(res=>{
    const M=H.matches, slot=(m,i)=>`<div class="br-m${i===H.mi?' now':''}${m.w?' done':''}"><div class="br-k">${i===3?'Gran final':'Duelo '+(i+1)}</div>
      <div class="br-row">${m.a?`<span class="${m.w&&m.w!==m.a?'lost':''}">${Art.crest(m.a,40)}${TEAMS[m.a].name}</span>`:'<span class="tbd">?</span>'}<i>vs</i>${m.b?`<span class="${m.w&&m.w!==m.b?'lost':''}">${Art.crest(m.b,40)}${TEAMS[m.b].name}</span>`:'<span class="tbd">?</span>'}</div></div>`;
    $('#g-stage').innerHTML=`<div class="bracket"><h2>Camino al título</h2><div class="br-grid">${M.map(slot).join('')}</div><button class="cr-btn" id="g-bgo">¡Al duelo! ▶</button></div>`;
    let ok=false; const go=()=>{ if(ok) return; ok=true; res(); };
    $('#g-bgo').onclick=go; setTimeout(go,reduce?1500:5200);
  });
}
function vsIntro(){
  return new Promise(res=>{ sfx.vs(); const [a,b]=H.duel;
    $('#g-stage').innerHTML=`<div class="vs">${[a,b].map((t,i)=>`<div class="vs-c" style="--tc:${TEAMS[t].color};animation-delay:${i*.3}s">${Art.crest(t,130)}<b>${TEAMS[t].name}</b></div>${i<1?'<i style="animation-delay:.2s">VS</i>':''}`).join('')}</div><div class="vs-wait">${Art.crest(H.wait,28)} ${TEAMS[H.wait].name} espera su turno</div>`;
    setTimeout(res,reduce?600:2300); });
}
function prepQ(src,special){ const perm=shuffle([0,1,2,3]); return {q:src.q,o:perm.map(i=>src.o[i]),a:perm.indexOf(0),x:src.x,c:src.c,d:src.d,special}; }
function nextStep(){
  if(H.phase==='end') return;
  H.ans={}; H.pwOn={}; H.pw2On={}; H.res=null;
  // ¿toca evento celeste? (cada 3 preguntas)
  if(H.qn>0&&H.qn%3===0&&!H.evDone){ H.evDone=true; const key=H.evs[(H.qn/3-1)%H.evs.length]; const ev=EVENTS[key];
    H.cur=prepQ(ev.q,false); H.cur.bonus=true; H.cur.c='b'; H.cur.evTitle=ev.title;
    H.phase='event'; publish(); $('#g-round').textContent='Evento celeste'; $('#g-stage').innerHTML='';
    playEvent(key).then(()=>{ H.phase='ready'; $('#g-stage').innerHTML=`<div class="banner bonus">¡Pregunta bonus!<small>Aciertos: daño ×1,5 · +100 PS · +3 energía</small></div>`; publish(); setTimeout(showQ,1900); });
    return; }
  H.evDone=false;
  const src=H.pool.shift()||shuffle(BANK)[0];
  H.dq++; H.qn++;
  const sd=H.dq>DUELQ, special=!sd&&H.qn%5===0;
  H.cur=prepQ(src,special); H.phase='ready';
  $('#g-round').textContent=(H.mi===3?'Final':'Duelo '+(H.mi+1))+(sd?' · Muerte súbita':` · Pregunta ${H.dq}/${DUELQ}`);
  const tag=CIVTAG[H.cur.c];
  $('#g-stage').innerHTML=`<div class="banner${special?' super':''}">${sd?'¡Muerte súbita!':special?'¡Ronda Supernova!':'Pregunta '+H.dq}<small>${special?'Daño ×2 · ':''}Tema: ${tag[0]}${src.d==='m'?' · dificultad media':''}</small></div>`;
  publish(); renderTowers(); setTimeout(showQ,1700);
}
function showQ(){
  if(H.phase!=='ready') return;
  const q=H.cur, tag=CIVTAG[q.c];
  H.phase='q'; H.qStart=performance.now(); H.qid=(H.qid||0)+1;
  $('#g-stage').innerHTML=`<div class="qcard${q.bonus?' is-bonus':''}${q.special?' is-super':''}">
    <div class="ribbon" style="--rc:${tag[1]}">${tag[0]}${q.special?' · ×2':''}${q.bonus?' · ×1,5':''}</div>
    <div class="qhead"><p class="qtext">${esc(q.q)}</p><div class="timer" id="g-timer"><span id="g-tn">10</span></div></div>
    <div class="opts">${q.o.map((o,k)=>`<div class="opt" data-k="${k}"><b>${L[k]}</b><span>${esc(o)}</span><span class="who" id="who-${k}"></span></div>`).join('')}</div>
  </div>`;
  ORDER.forEach(t=>{const b=$('#bb-'+t); b.hidden=!inDuel(t)||H.hp[t]<=0; b.className='bubble'; b.textContent='Pensando…';});
  sfx.go(); publish(); renderTowers();
  let last=10; clearInterval(timerId);
  timerId=setInterval(()=>{ const rem=Math.max(0,QTIME-(performance.now()-H.qStart)); const tm=$('#g-timer'); if(!tm){clearInterval(timerId);return;}
    tm.style.setProperty('--p',rem/QTIME); const s=Math.ceil(rem/1000); $('#g-tn').textContent=s; tm.classList.toggle('hot',s<=3);
    if(s!==last){ last=s; if(s<=3&&s>0) sfx.tick(); }
    if(rem<=0||alive().every(t=>H.ans[t])){ clearInterval(timerId); reveal(); } },50);
}
function onKey(ev){
  if($('#v-juego').hidden) return; if(ev.target.closest&&ev.target.closest('input,select,textarea,details')) return;
  const k=ev.key.toLowerCase();
  if(H.phase==='q') for(const t of ORDER){ const i=TEAMS[t].keys.indexOf(k); if(i>=0){answer(t,i,performance.now());return;} if(k===TEAMS[t].pkey){activatePower(t);return;} if(k===TEAMS[t].p2key){activatePower2(t);return;} }
  if((k===' '||k==='enter')&&!ev.repeat){ const btn=$('#g-next')||$('#g-bgo')||$('#g-start'); if(btn&&!btn.disabled){ev.preventDefault();btn.click();} }
}
function answer(t,k,time){
  if(H.phase!=='q'||!inDuel(t)||H.hp[t]<=0||H.ans[t]) return;
  H.ans[t]={k,t:Math.max(0,time-H.qStart)}; sfx.lock();
  const b=$('#bb-'+t); if(b){b.hidden=false;b.className='bubble done';b.textContent='¡Listo! '+(H.ans[t].t/1000).toFixed(1)+' s';}
  publish();
}
function towerPt(t,top){ const r=$('#tw-'+t+' svg.tw').getBoundingClientRect(), f=$('#g-fx').getBoundingClientRect(); return [r.left+r.width/2-f.left,r.top+r.height*(top?.12:.5)-f.top]; }
function floatTxt(t,txt,cls){ const [x,y]=towerPt(t); const d=document.createElement('div'); d.className='dmg '+(cls||''); d.style.left=x+'px'; d.style.top=y+'px'; d.textContent=txt; $('#g-main-fx').appendChild(d); setTimeout(()=>d.remove(),1500); }
function shake(big){ const m=$('#g-main'); m.classList.remove('shake','shake2'); void m.offsetWidth; m.classList.add(big?'shake2':'shake'); }
function activatePower2(t){
  if(H.phase!=='q'||!inDuel(t)||H.hp[t]<=0||H.en[t]<P2COST||H.pw2On[t]) return;
  H.pw2On[t]=true; H.en[t]-=P2COST; sfx.lock(); const [x,y]=towerPt(t); FX.burst(x,y,TEAMS[t].light,34,4);
  floatTxt(t,TEAMS[t].p2i+' '+TEAMS[t].p2,'pwr'); renderTowers(); publish();
}
function activatePower(t){
  if(H.phase!=='q'||!inDuel(t)||H.hp[t]<=0||H.en[t]<PCOST||H.pwOn[t]) return;
  H.pwOn[t]=true; H.en[t]-=PCOST; sfx.power(); const [x,y]=towerPt(t); FX.burst(x,y,TEAMS[t].color,60,6);
  floatTxt(t,'⚡ ¡'+TEAMS[t].god+' responde!','pwr'); renderTowers(); publish();
}
function godTitle(t){ const d=document.createElement('div'); d.className='godtitle'; d.style.setProperty('--tc',TEAMS[t].color); d.innerHTML=`<small>¡Invocación divina!</small>${TEAMS[t].god.toUpperCase()}`; $('#g-main-fx').appendChild(d); setTimeout(()=>d.remove(),2600); }
function reveal(){
  if(H.phase!=='q') return; H.phase='rev';
  const q=H.cur, al=alive(), mult=q.special?2:q.bonus?1.5:1;
  const correct=al.filter(t=>H.ans[t]&&H.ans[t].k===q.a).sort((a,b)=>H.ans[a].t-H.ans[b].t);
  const steps=[], summary={}, RANK=[[140,140],[60,60]];
  al.forEach(t=>summary[t]={ok:!!(H.ans[t]&&H.ans[t].k===q.a),ans:H.ans[t]?H.ans[t].k:null,rank:0});
  // dioses primero
  for(const t of al) if(H.pwOn[t]){ const o=al.find(x=>x!==t); if(t==='m'&&o) steps.push({type:'god',from:t,to:o,amt:180}); if(t==='c'&&o) steps.push({type:'god',from:t,to:o,amt:200,steal:true}); if(t==='e') steps.push({type:'god',from:t,to:o,amt:250,heal:true}); }
  if(q.bonus) correct.forEach(t=>steps.push({type:'heal',to:t,amt:100}));
  correct.forEach((t,r)=>{ summary[t].rank=r+1; const tt=H.ans[t].t, frac=Math.max(0,(QTIME-tt)/QTIME); let dmg=(RANK[r][0]+RANK[r][1]*frac)*mult;
    const crit=r===0&&tt<3000; if(crit) dmg*=1.3; if(H.hp[t]<=MAXHP*.35) dmg*=1.5; if(H.pwOn.m&&t==='m') dmg*=2; if(H.streak[t]>=2) dmg*=1.15; dmg=Math.round(dmg/10)*10;
    al.filter(o=>o!==t).forEach(o=>{ let d=dmg; if(o==='e'&&H.pwOn.e) d=Math.round(d/20)*10; steps.push({type:'hit',from:t,to:o,amt:d,crit}); }); });
  al.forEach(t=>{ if(H.ans[t]&&H.ans[t].k!==q.a&&!(t==='m'&&H.pwOn.m)) steps.push({type:'self',to:t,amt:Math.round(60*mult)}); });
  // poderes secundarios
  if(H.pw2On.e&&al.includes('e')){ const o=al.find(x=>x!=='e'); if(o) steps.push({type:'spear',from:'e',to:o,amt:75}); }
  if(H.pw2On.c&&al.includes('c')){ const o=al.find(x=>x!=='c'); if(o){ let tot=0; for(const st of steps){ if(st.to==='c'&&(st.type==='hit'||st.type==='spear'||(st.type==='god'&&!st.heal))) tot+=st.amt; } const amt=Math.min(120,Math.round(tot*0.5/10)*10); if(amt>0) steps.push({type:'reflect',from:'c',to:o,amt}); else steps.push({type:'fizzle',to:'c'}); } }
  if(H.pw2On.m&&al.includes('m')) steps.push({type:'heal',to:'m',amt:90,cacao:true});
  al.forEach(t=>{ H.streak[t]=summary[t].ok&&summary[t].rank===1?H.streak[t]+1:0; });
  H.res={summary,steps};
  document.querySelectorAll('.opt').forEach(o=>{const k=+o.dataset.k; o.classList.toggle('correct',k===q.a); o.classList.toggle('dim',k!==q.a);});
  al.forEach(t=>{ if(H.ans[t]){ const w=$('#who-'+H.ans[t].k); if(w) w.insertAdjacentHTML('beforeend',`<i style="background:${TEAMS[t].color}" title="${TEAMS[t].name}"></i>`);} });
  al.forEach(t=>{const b=$('#bb-'+t); if(!b) return; b.hidden=false; const s=summary[t]; b.className='bubble '+(s.ok?'ok':H.ans[t]?'bad':'');
    b.textContent=!H.ans[t]?'Sin respuesta':s.ok?`✔ ${s.rank}.º · ${(H.ans[t].t/1000).toFixed(1)} s`:'✘ Incorrecta'; });
  const card=$('.qcard'); if(card) card.insertAdjacentHTML('beforeend',`<div class="fact"><b>¿Sabías que…?</b> ${esc(q.x)}</div><div class="next-row"><button class="cr-btn" id="g-next" disabled>Siguiente ▶</button></div>`);
  publish(); renderTowers();
  playSteps(steps).then(()=>{
    const [a,b]=H.duel; const lo=Math.min(H.hp[a],H.hp[b]), hi=Math.max(H.hp[a],H.hp[b]);
    for(const t of ORDER){ let g=!inDuel(t)?1:lo===hi?2:H.hp[t]===lo?4:1; if(q.bonus&&summary[t]&&summary[t].ok) g+=3; H.en[t]=Math.min(10,H.en[t]+g); }
    for(const t of ORDER) if(summary[t]) summary[t].hp=H.hp[t];
    renderTowers(); publish();
    const nb=$('#g-next'); const left=alive();
    const over=left.length<=1||(H.dq>=DUELQ&&!q.bonus&&H.hp[a]!==H.hp[b]);
    if(over){ const w=left.length===1?left[0]:(H.hp[a]>H.hp[b]?a:b); if(nb){ nb.disabled=false; nb.textContent='Ver resultado del duelo ▶'; nb.onclick=()=>endMatch(w,left.length<=1); } return; }
    if(nb){nb.disabled=false;nb.onclick=nextStep;}
  });
}
function applyHp(t,delta){ const before=H.hp[t]; H.hp[t]=Math.max(0,Math.min(MAXHP,H.hp[t]+delta));
  if(delta<0){const tw=$('#tw-'+t);tw.classList.remove('hit');void tw.offsetWidth;tw.classList.add('hit');}
  if(before>0&&H.hp[t]<=0){ sfx.boom(); shake(true); FX.flash('#fff',.6); floatTxt(t,'¡K.O.!','ko'); const [x,y]=towerPt(t); FX.burst(x,y,'#ffb347',140,13); FX.debris(x,y,50); FX.smoke(x,y,20); }
  renderTowers(); }
const shootP=(kind,a,b,col)=>new Promise(res=>{ FX.shoot(kind,towerPt(a,kind==='e'),towerPt(b),col,res); });
const godP=(t,o)=>new Promise(res=>{ const st=$('#g-stage'); st.classList.add('dimmed'); godTitle(t); sfx.mystic(); FX.god(t,towerPt(t,true),o?towerPt(o):null,()=>{ res(); setTimeout(()=>st.classList.remove('dimmed'),900); }); });
async function playSteps(steps){
  const wait=ms=>new Promise(r=>setTimeout(r,ms)); await wait(500);
  for(const s of steps){
    if(s.type==='god'){ await godP(s.from,s.to); sfx.boom();
      if(s.heal){ applyHp(s.from,s.amt); floatTxt(s.from,'+'+s.amt,'heal'); const [x,y]=towerPt(s.from); FX.burst(x,y,'#ffe9a8',80,6); }
      else if(s.steal){ const a=Math.min(s.amt,H.hp[s.to]); applyHp(s.to,-a); floatTxt(s.to,'-'+a,'crit'); applyHp(s.from,a); floatTxt(s.from,'+'+a,'heal'); shake(true); const [x,y]=towerPt(s.to); FX.burst(x,y,'#6fb3ff',90,10); }
      else { applyHp(s.to,-s.amt); floatTxt(s.to,'-'+s.amt,'crit'); shake(true); const [x,y]=towerPt(s.to); FX.burst(x,y,'#20c08f',110,11); FX.debris(x,y,30); }
      await wait(700); continue; }
    if(s.type==='spear'){ if(H.hp[s.to]<=0) continue; floatTxt(s.from,'🔱 ¡Arpón de Horus!','pwr'); await shootP('e',s.from,s.to,'#ffe9a8'); sfx.hit(); const [x,y]=towerPt(s.to); FX.burst(x,y,'#ffd23f',60,9); shake(false); applyHp(s.to,-s.amt); floatTxt(s.to,'-'+s.amt,'crit'); await wait(250); continue; }
    if(s.type==='reflect'){ if(H.hp[s.to]<=0) continue; floatTxt(s.from,'🪞 ¡Reflejo!','pwr'); await shootP('c',s.from,s.to,'#ffb3a8'); sfx.hit(); const [x,y]=towerPt(s.to); FX.burst(x,y,'#ffffff',50,8); applyHp(s.to,-s.amt); floatTxt(s.to,'-'+s.amt+' 🪞','crit'); await wait(250); continue; }
    if(s.type==='fizzle'){ floatTxt(s.to,'🪞 Sin daño que reflejar','bad'); await wait(300); continue; }
    if(s.type==='heal'){ if(s.cacao) floatTxt(s.to,'🌿 Ofrenda de cacao','pwr'); sfx.heal(); applyHp(s.to,s.amt); floatTxt(s.to,'+'+s.amt,'heal'); const [x,y]=towerPt(s.to); FX.burst(x,y,'#4ade80',36,4); }
    else if(s.type==='hit'){ if(H.hp[s.to]<=0) continue; await shootP(s.from,s.from,s.to,TEAMS[s.from].color); sfx.hit(); const [x,y]=towerPt(s.to); FX.burst(x,y,TEAMS[s.from].color,50,9); FX.debris(x,y,s.crit?24:12); if(H.hp[s.to]-s.amt<MAXHP*.4) FX.smoke(x,y,6);
      shake(s.crit); applyHp(s.to,-s.amt); floatTxt(s.to,'-'+s.amt,s.crit?'crit':''); if(s.crit){ floatTxt(s.from,'¡CRÍTICO!','pwr'); FX.flash(TEAMS[s.from].color,.25); } }
    else if(s.type==='self'){ if(H.hp[s.to]<=0) continue; sfx.hit(); applyHp(s.to,-s.amt); floatTxt(s.to,'-'+s.amt+' ✘','bad'); const [x,y]=towerPt(s.to); FX.debris(x,y,8); }
    await wait(260);
  }
  await wait(300);
}
function endMatch(w,ko){
  const m=H.matches[H.mi]; m.w=w; const l=H.duel.find(t=>t!==w);
  H.phase='mres'; publish(); renderBracketMini();
  sfx.win();
  $('#g-stage').innerHTML=`<div class="mres" style="--tc:${TEAMS[w].color}"><div class="mres-k">${H.mi===3?'Gran final':'Duelo '+(H.mi+1)} · ${ko?'por K.O.':'por PS'}</div>
    <div class="mres-row">${Art.crest(w,110)}<h2>¡Gana ${TEAMS[w].name}!</h2></div><p>${TEAMS[l].name} cae, pero aún puede volver en el siguiente duelo.</p><button class="cr-btn" id="g-next">${H.mi===3?'Coronar al campeón 🏆':'Siguiente duelo ▶'}</button></div>`;
  const [x,y]=towerPt(w); FX.burst(x,y,TEAMS[w].color,90,9);
  $('#g-next').onclick=()=>{
    if(H.mi===0){ H.matches[1].a=w; startMatch(1); }
    else if(H.mi===1){ const others=ORDER.filter(t=>t!==w); H.matches[2].a=others[0]; H.matches[2].b=others[1]; H.matches[3].b=w; startMatch(2); }
    else if(H.mi===2){ H.matches[3].a=w; startMatch(3); }
    else endGame(w);
  };
}
function endGame(w){
  clearInterval(timerId);
  w=w||H.duel[0];
  H.phase='end'; H.winner=w; publish(); ORDER.forEach(t=>{const b=$('#bb-'+t); if(b) b.hidden=true;});
  $('#g-round').textContent='¡Campeón del torneo!'; sfx.win(); setArena(false);
  const T=TEAMS[w];
  $('#g-stage').innerHTML=`<div class="winner" style="--tc:${T.color};--td:${T.dark}">
    <div class="win-rays" aria-hidden="true"></div>
    <div class="win-h">${Art.crest(w,90)}<div><div class="win-k">Campeona de los Cielos Antiguos</div><h2>¡Victoria ${T.adj}!</h2></div></div>
    <div class="chars">${Art.CHARS[w].map((c,i)=>`<div class="char" style="animation-delay:${.5+i*.35}s"><div class="char-art">${Art.chibi(Object.assign({label:c.name},c.o))}</div><h4>${esc(c.name)}</h4><p class="role">${esc(c.role)}</p><p>${esc(c.txt)}</p></div>`).join('')}</div>
    <div class="win-acts"><button class="cr-btn" id="g-again">Jugar de nuevo</button><a class="cr-btn blue" href="#cosmos">Ir al Viaje Cósmico 🚀</a></div>
  </div>`;
  let n=0; const iv=setInterval(()=>{ const f=$('#g-fx').getBoundingClientRect(); FX.burst(Math.random()*f.width,Math.random()*f.height*.6,[T.color,'#ffd23f','#ffffff','#c94cf0'][n%4],50,8); if(++n>14) clearInterval(iv); },300);
  $('#g-again').onclick=()=>{ const g=H.gid; H=newState(); H.gid=g+'r'; $('#g-round').textContent='Táctica Royale'; renderTowers(); renderLobby(); publish(); };
}

/* =================== CELULAR =================== */
let phoneBuilt=false, P={team:null,room:null,R:null,host:null,hostAt:0,sentQi:-1,code:null};
function phone(c){
  if(c){ c=c.toUpperCase(); if(P.code!==c){ P.code=c; store.set('cielos-code',c); if(phoneBuilt) joinPhone(); } }
  if(phoneBuilt) return; phoneBuilt=true;
  P.team=store.get('cielos-team'); P.code=P.code||store.get('cielos-code');
  $('#v-equipo').innerHTML=`<div class="ph" id="ph"></div>`;
  getRoom().then(r=>{ P.room=r; joinPhone(); });
  renderPhone(); setInterval(tickPhone,100);
}
async function joinPhone(){
  if(!P.room||!P.code){ renderPhone(); return; }
  try{ if(P.R&&P.R.leave) await P.R.leave(); }catch(e){}
  try{ P.R=await P.room.join('g-'+P.code.toLowerCase(),'phone'); }catch(e){ P.R=null; renderPhone(); return; }
  P.host=null;
  P.R.onPeers(ch=>{ let best=null; for(const p of ch.peers){ const pr=p.presence||{}; if(pr.r==='host'&&(!best||p.updatedAt>best.updatedAt)) best=p; }
    if(best&&best!==P.hostPeer){ P.hostPeer=best; const k=JSON.stringify(Object.assign({},best.presence,{rem:0,_at:0})); const ch=k!==P.hostKey; P.hostKey=k; P.host=best.presence; P.hostAt=best.updatedAt; if(ch) renderPhone(); } else if(!best&&P.host){ P.host=null; renderPhone(); } },()=>{P.R=null;renderPhone();});
  if(P.team) P.R.presence({r:'p',t:P.team}).catch(()=>{});
  renderPhone();
}
function pickTeam(t){ P.team=t; store.set('cielos-team',t); if(P.R) P.R.presence({r:'p',t,g:P.host&&P.host.g||null,a:null,pw:null}).catch(()=>{}); renderPhone(); }
function renderPhone(){
  const el=$('#ph'); if(!el) return;
  if(!P.code){
    el.innerHTML=`<a href="#inicio" class="ph-back">◀ Inicio</a><div class="ph-hero"><h2>Únete a la batalla</h2><p>Escanea el QR del proyector o escribe el código de la partida.</p></div>
    <form class="ph-code" id="ph-cf"><label for="ph-ci">Código de partida</label><input id="ph-ci" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD"><button class="cr-btn">Entrar</button></form>`;
    $('#ph-cf').onsubmit=e=>{e.preventDefault(); const v=$('#ph-ci').value.trim().toUpperCase(); if(v.length===4){ P.code=v; store.set('cielos-code',v); joinPhone(); renderPhone(); }};
    return;
  }
  if(!P.team){
    el.innerHTML=`<a href="#inicio" class="ph-back">◀ Inicio</a><div class="ph-hero"><div class="ph-k">Partida ${esc(P.code)}</div><h2>¿Cuál es tu civilización?</h2></div>
    <div class="teampick">${ORDER.map(t=>`<button data-t="${t}" style="--tc:${TEAMS[t].color};--td:${TEAMS[t].dark}">${Art.tower(t,92)}<span>${TEAMS[t].name}</span></button>`).join('')}</div>
    <button class="pill" id="ph-cc">Cambiar código</button>`;
    el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>pickTeam(b.dataset.t));
    $('#ph-cc').onclick=()=>{P.code=null;store.set('cielos-code','');renderPhone();};
    return;
  }
  const T=TEAMS[P.team], h=P.host; let body='';
  if(!P.room) body=`<div class="status">No se pudo conectar este celular.<small>Revisa tu conexión a internet y recarga la página. Mientras tanto, tu equipo responde con las teclas <b>${T.keys.join(' ').toUpperCase()}</b> del proyector.</small></div>`;
  else if(!h) body=`<div class="status">Buscando la partida ${esc(P.code)}…<small>Revisa que el código coincida con el del proyector.</small></div>`;
  else {
    const en=h.en?h.en[P.team]:0, playing=h.duel&&h.duel.includes(P.team), dead=playing&&h.hp&&h.hp[P.team]<=0;
    const mini=h.duel?`<div class="mini2">${h.duel.map(t=>`<div style="--tc:${TEAMS[t].color}">${Art.crest(t,30)}<div class="hp"><i style="transform:scaleX(${(h.hp&&h.hp[t]||0)/MAXHP})"></i><b>${h.hp?Math.round(h.hp[t]):''}</b></div></div>`).join('<span>vs</span>')}</div>`:'';
    if(h.ph==='lobby') body=`<div class="status">¡Listos!<small>Esperen a que empiece el torneo.</small></div>`;
    else if(h.ph==='end') body=`<div class="status" style="color:${TEAMS[h.win]?TEAMS[h.win].color:'#fff'}">🏆 ¡${TEAMS[h.win]?TEAMS[h.win].name:''} gana el torneo!</div>`;
    else if(!playing) body=`<div class="status sky">Tu civilización espera su turno<small>Ahora se enfrentan ${h.duel?h.duel.map(t=>TEAMS[t].name).join(' y '):'…'}. ¡Estudien el cielo!</small></div>`;
    else if(h.ph==='bracket'||h.ph==='mres') body=`<div class="status">${h.ph==='bracket'?'¡Prepárense para el duelo '+h.m+'!':'Duelo terminado'}<small>Miren el proyector.</small></div>`;
    else if(h.ph==='event') body=`<div class="status sky">✨ ¡Miren al proyector!<small>${esc(h.ev||'Algo pasa en el cielo…')}</small></div>`;
    else if(h.ph==='ready') body=`<div class="status">¡Prepárense!<small>Viene la ${h.bonus?'pregunta bonus':'siguiente pregunta'}…</small></div>`;
    else if(h.ph==='q'){
      const locked=(h.lk||[]).includes(P.team)||P.sentQi===h.qi, canPw=en>=PCOST&&!(h.pw||[]).includes(P.team), canP2=en>=P2COST&&!(h.pw2||[]).includes(P.team);
      if(dead) body=`<div class="status">Tu torre cayó.<small>¡Ánimo para el siguiente duelo!</small></div>`;
      else body=`<div class="bar"><i id="ph-bar"></i></div><div class="pq">${h.bonus?'<span class="pb">BONUS</span> ':''}${esc(h.q||'')}</div>
        ${locked?`<div class="status ok">¡Respuesta enviada! 🔒</div>`:`<div class="popts">${(h.o||[]).map((o,k)=>`<button class="opt" data-k="${k}"><b>${L[k]}</b><span>${esc(o)}</span></button>`).join('')}</div>`}
        <div class="pwrow"><button class="pw ${canPw?'ready':''}" id="ph-pw" ${canPw?'':'disabled'}>⚡ ${T.god} (10)</button><button class="pw p2 ${canP2?'ready':''}" id="ph-pw2" ${canP2?'':'disabled'}>${T.p2i} ${T.p2} (5)</button></div><div class="note" style="text-align:center">Energía ${en}/10</div>`;
    }
    else if(h.ph==='rev'){ const r=h.res&&h.res[P.team];
      body=`<div class="status ${r&&r.ok?'ok':'bad'}">${!r?'Ronda terminada':r.ok?`✔ ¡Correcto! Lugar ${r.rank}`:r.ans==null?'Sin respuesta':'✘ Incorrecta'}<small>Respuesta: ${L[h.ok]} · ${esc((h.o||[])[h.ok]||'')}</small></div>`; }
    body+=mini+`<div class="ph-en">${Array.from({length:10},(_,i)=>`<i class="${i<en?'on':''}"></i>`).join('')}</div>`;
  }
  el.innerHTML=`<div class="ph-team" style="--tc:${T.color};--td:${T.dark}">${Art.crest(P.team,46)}<h2>${T.name}</h2><span></span><button class="pill" id="ph-chg">Cambiar</button></div>`+body;
  $('#ph-chg').onclick=()=>{P.team=null;store.set('cielos-team','');renderPhone();};
  el.querySelectorAll('.popts .opt').forEach(b=>b.onclick=()=>{ if(!P.R||!h) return; P.sentQi=h.qi; P.R.presence({r:'p',t:P.team,g:h.g,a:{qi:h.qi,k:+b.dataset.k}}).catch(()=>{}); try{navigator.vibrate&&navigator.vibrate(40)}catch(e){} renderPhone(); });
  const pw2=$('#ph-pw2'); if(pw2) pw2.onclick=()=>{ if(P.R&&h) P.R.presence({pw2:h.qi,g:h.g,r:'p',t:P.team}).catch(()=>{}); pw2.disabled=true; };
  const pw=$('#ph-pw'); if(pw) pw.onclick=()=>{ if(P.R&&h) P.R.presence({pw:h.qi,g:h.g,r:'p',t:P.team}).catch(()=>{}); pw.disabled=true; };
}
function tickPhone(){ const b=$('#ph-bar'), h=P.host; if(!b||!h||h.ph!=='q') return; const rem=Math.max(0,(h.rem||0)-(Date.now()-P.hostAt)); b.style.width=(rem/QTIME*100)+'%'; }

window.Game={host,phone,_end:()=>endGame(H&&H.duel?H.duel[0]:'m')};
})();
