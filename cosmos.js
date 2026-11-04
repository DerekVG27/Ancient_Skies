/* Viaje Cósmico: simulador 3D a escala real con viaje en el tiempo */
(function(){
'use strict';
const Cosmos=window.Cosmos={};
let started=false, running=false;
Cosmos.start=function(){ running=true; if(started){ last=performance.now(); return; } started=true; buildHud(); loadThree().then(()=>new Promise(r=>setTimeout(r,60))).then(init).catch(e=>{ $('#cz-load').textContent='No se pudo cargar el motor 3D: '+e.message; }); };
Cosmos.pause=function(){ running=false; };
Cosmos._t=k=>tour(k); Cosmos._go=(id,d)=>{ const b=byId[id]; select(b); goTo(b,d?{dist:b.R*d}:null); }; Cosmos._wh=id=>traverseWH(byId[id]); Cosmos._loc=v=>{ if(surf){ surf.loc=v; surf.wt=v; } }; Cosmos._nodome=()=>{ skyDome.visible=false; }; Cosmos._T=()=>terrain&&({vis:terrain.visible,pos:terrain.position.toArray(),wh:terrain.material.uniforms.uWH.value,wv:terrain.material.uniforms.uWave.value,wd:terrain.material.uniforms.uWDir.value.toArray(),mask:terrain.layers.mask,alt:surf&&surf.alt,dome:skyDome.visible}); Cosmos._st=()=>({dil,simJD,surf:surf?{lat:surf.lat,lon:surf.lon,loc:surf.loc}:null,mode,target:target&&target.id}); Cosmos._sky=on=>{ skyMats.forEach(m=>m.uniforms.uBright.value=on?1:0); window.__nosky=!on; }; Cosmos._dv=()=>bodies.filter(b=>b.disk3&&b.disk3.g.visible).map(b=>b.id+':'+(b.R/b.dist*uPx).toFixed(1)); Cosmos._vis=()=>bodies.filter(b=>(b.sprite&&b.sprite.visible)||b.obj.visible).filter(b=>{const v=project(b);return v.z<1&&Math.abs(v.x-0.675)<0.08&&Math.abs(v.y+0.10)<0.08}).map(b=>b.id+':'+b.kind); Cosmos._tess=()=>{ enterTesseract(byId.sgra); }; Cosmos._book=()=>{ const f=tess.frags[0]; tess.cam.position.copy(f.pos).add(new THREE.Vector3(3,3,3)); tess.cam.lookAt(f.pos); }; Cosmos._fast=f=>{ if(plungeS) plungeS.t=plungeS.dur*f; }; Cosmos._go=(id,d)=>{select(byId[id]);goTo(byId[id],d?{dist:d}:null)}; Cosmos._y=y=>setYear(y); Cosmos._jd=(y,m,d)=>{simJD=calToJD(y,m,d)}; Cosmos._r=r=>setRate(r);
function loadThree(){ return new Promise((res,rej)=>{ if(window.THREE) return res(); const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload=()=>res(); s.onerror=()=>rej(new Error('red')); document.head.appendChild(s); }); }
const $=(s,r=document)=>r.querySelector(s);

/* ---------------- constantes físicas ---------------- */
const AU=149597870.7, PC=3.0856775814913673e13, LY=9.4607304725808e12, CK=299792.458, RS=695700, DAY=86400, YEAR=365.25*86400, J2000=2451545.0, D2R=Math.PI/180;
const EPS=23.43928*D2R;
const AG=[[-0.0548755604,-0.8734370902,-0.4838350155],[0.4941094279,-0.4448296300,0.7469822445],[-0.8676661490,-0.1980763734,0.4559837762]];
const eq2gal=v=>[AG[0][0]*v[0]+AG[0][1]*v[1]+AG[0][2]*v[2],AG[1][0]*v[0]+AG[1][1]*v[1]+AG[1][2]*v[2],AG[2][0]*v[0]+AG[2][1]*v[1]+AG[2][2]*v[2]];
const gal2eq=g=>[AG[0][0]*g[0]+AG[1][0]*g[1]+AG[2][0]*g[2],AG[0][1]*g[0]+AG[1][1]*g[1]+AG[2][1]*g[2],AG[0][2]*g[0]+AG[1][2]*g[1]+AG[2][2]*g[2]];
const ecl2eq=v=>{const c=Math.cos(EPS),s=Math.sin(EPS);return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c]};
function radec(ra,dec,d){const a=ra*D2R,b=dec*D2R;return [d*Math.cos(b)*Math.cos(a),d*Math.cos(b)*Math.sin(a),d*Math.sin(b)]}
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const len=a=>Math.hypot(a[0],a[1],a[2]), norm=a=>{const l=len(a)||1;return [a[0]/l,a[1]/l,a[2]/l]}, dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const yearToJD=y=>J2000+(y-2000)*365.25;
const jdToYear=j=>2000+(j-J2000)/365.25;
const GAL_N_EQ=gal2eq([0,0,1]);

/* ---------- calendario (juliano antes de 1582, gregoriano después) ---------- */
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function jdToCal(jd){
  const Z=Math.floor(jd+0.5), F=jd+0.5-Z; let A=Z;
  if(Z>=2299161){const al=Math.floor((Z-1867216.25)/36524.25);A=Z+1+al-Math.floor(al/4);}
  const B=A+1524, C=Math.floor((B-122.1)/365.25), D=Math.floor(365.25*C), E=Math.floor((B-D)/30.6001);
  const day=B-D-Math.floor(30.6001*E)+F, m=E<14?E-1:E-13, y=m>2?C-4716:C-4715;
  return {y,m,d:Math.floor(day),h:(day%1)*24};
}
function calToJD(y,m,d){ if(m<=2){y--;m+=12} let B=0; if(y>1582||(y===1582&&(m>10||(m===10&&d>=15)))){const A=Math.floor(y/100);B=2-A+Math.floor(A/4)} return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5; }
function fmtYear(y){ return y<=0 ? (1-y).toLocaleString('es-CR')+' a.C.' : String(y); }
function fmtDate(jd){ if(jd<0) return 'año '+fmtYear(Math.floor(jdToYear(jd))); const c=jdToCal(jd); const hh=Math.floor(c.h), mm=Math.floor((c.h-hh)*60); return `${c.d} ${MES[c.m-1]} ${fmtYear(c.y)} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} TU`; }
const nf=(x,d=0)=>x.toLocaleString('es-CR',{maximumFractionDigits:d,minimumFractionDigits:0});
function sig(x){ if(!isFinite(x)) return '∞'; const a=Math.abs(x); if(a>=1e6){const e=Math.floor(Math.log10(a));return nf(x/Math.pow(10,e),2)+' × 10'+sup(e)} return nf(x,a<10?2:a<100?1:0); }
function sup(n){return String(n).split('').map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'['0123456789'.indexOf(c)]||'⁻').join('')}
function fmtDist(km){
  if(km<1e6) return sig(km)+' km';
  if(km<0.05*LY) return sig(km/AU)+' UA ('+sig(km)+' km)';
  if(km<1e6*LY) return sig(km/LY)+' años luz';
  return sig(km/LY/1e6)+' millones de años luz';
}
function fmtDur(s){
  const a=Math.abs(s);
  if(a<60) return nf(s,1)+' s'; if(a<3600) return nf(s/60,1)+' min'; if(a<DAY) return nf(s/3600,1)+' h';
  if(a<YEAR) return nf(s/DAY,1)+' días'; if(a<1e6*YEAR) return sig(s/YEAR)+' años'; return sig(s/YEAR/1e6)+' millones de años';
}
function fmtSpeed(v){ return v<0.01*CK ? sig(v)+' km/s' : sig(v/CK)+' c ('+sig(v)+' km/s)'; }

/* ---------------- color de cuerpo negro ---------------- */
function bbColor(T){ T=T/100; let r,g,b;
  if(T<=66){r=255;g=99.47*Math.log(T)-161.12;b=T<=19?0:138.52*Math.log(T-10)-305.04}else{r=329.7*Math.pow(T-60,-0.1332);g=288.12*Math.pow(T-60,-0.0755);b=255}
  const c=x=>Math.max(0,Math.min(255,x))/255; return [c(r),c(g),c(b)]; }
function BC(T){const x=Math.log10(T)-4;return -8.499*x**4+13.421*x**3-8.131*x**2-3.901*x-0.438}
function MvFromRT(R,T){const L=R*R*Math.pow(T/5772,4);return 4.74-2.5*Math.log10(L)+BC(T)}
function RfromMvT(M,T){const L=Math.pow(10,(4.74-(M-BC(T)))/2.5);return Math.sqrt(L)/Math.pow(T/5772,2)}

/* ================= DATOS ================= */
// Elementos keplerianos (JPL, Standish) eclíptica J2000: a,e,I,L,ϖ,Ω y tasas por siglo
const PLAN=[
 ['mercury','Mercurio',[0.38709927,0.20563593,7.00497902,252.25032350,77.45779628,48.33076593,0.00000037,0.00001906,-0.00594749,149472.67411175,0.16047689,-0.12534081],2439.7,[281.01,61.42],1407.6,.14,'#a8a29a'],
 ['venus','Venus',[0.72333566,0.00677672,3.39467605,181.97909950,131.60246718,76.67984255,0.00000390,-0.00004107,-0.00078890,58517.81538729,0.00268329,-0.27769418],6051.8,[272.76,67.16],-5832.5,.69,'#e8d29a'],
 ['earth','Tierra',[1.00000261,0.01671123,-0.00001531,100.46457166,102.93768193,0.0,0.00000562,-0.00004392,-0.01294668,35999.37244981,0.32327364,0.0],6371,[0,90],23.9345,.43,'#6fa8ff'],
 ['mars','Marte',[1.52371034,0.09339410,1.84969142,-4.55343205,-23.94362959,49.55953891,0.00001847,0.00007882,-0.00813131,19140.30268499,0.44441088,-0.29257343],3389.5,[317.68,52.89],24.6229,.17,'#d0703f'],
 ['jupiter','Júpiter',[5.20288700,0.04838624,1.30439695,34.39644051,14.72847983,100.47390909,-0.00011607,-0.00013253,-0.00183714,3034.74612775,0.21252668,0.20469106],69911,[268.06,64.50],9.925,.54,'#d9b48a'],
 ['saturn','Saturno',[9.53667594,0.05386179,2.48599187,49.95424423,92.59887831,113.66242448,-0.00125060,-0.00050991,0.00193609,1222.49362201,-0.41897216,-0.28867794],58232,[40.59,83.54],10.656,.5,'#e6cf94'],
 ['uranus','Urano',[19.18916464,0.04725744,0.77263783,313.23810451,170.95427630,74.01692503,-0.00196176,-0.00004397,-0.00242939,428.48202785,0.40805281,0.04240589],25362,[257.31,-15.18],-17.24,.49,'#a7e1e8'],
 ['neptune','Neptuno',[30.06992276,0.00859048,1.77004347,-55.12002969,44.96476227,131.78422574,0.00026291,0.00005105,0.00035372,218.45945325,-0.32241464,-0.00508664],24622,[299.36,43.46],16.11,.44,'#4f7bea'],
 ['pluto','Plutón',[39.48211675,0.24882730,17.14001206,238.92903833,224.06891629,110.30393684,-0.00031596,0.00005170,0.00004818,145.20780515,-0.04062942,-0.01183482],1188.3,[132.99,-6.16],-153.3,.5,'#d9c2a0']
];
const PINFO={
 mercury:'El planeta más cercano al Sol. Un año dura 88 días terrestres.',
 venus:'El astro de guerra de los mayas, ligado a Kukulkán. Su ciclo sinódico medio es de 583,92 días; los mayas usaban 584 y corregían el error acumulado en el Códice de Dresde. Acelera el tiempo y obsérvalo desde la Tierra.',
 earth:'Nuestro observatorio. Desde aquí Egipto, China y los mayas registraron el cielo. La Tierra gira cada 23 h 56 min; las mareas alargan el día unos 1,8 ms por siglo, algo que se midió con eclipses antiguos registrados en China.',
 mars:'El planeta rojo. Su periodo sinódico real es de unos 779,9 días; los mayas usaban 780 = 3 × 260.',
 jupiter:'El gigante del sistema solar: 11 veces el diámetro de la Tierra. La Gran Mancha Roja es una tormenta más grande que nuestro planeta.',
 saturn:'Sus anillos de hielo miden casi 280.000 km de diámetro pero apenas decenas de metros de grosor.',
 uranus:'Gira tumbado: su eje está inclinado 98°.',
 neptune:'A 30 UA del Sol: la luz solar tarda más de 4 horas en llegar.',
 pluto:'Planeta enano en el cinturón de Kuiper. La luz del Sol tarda unas 5,5 horas en llegar.'
};
// estrellas: id, nombre, AR°, Dec°, dist pc, V (mag aparente), R (R☉, opcional), T (K), cat, info
const STARS=[
 ['sirius','Sirio (Sopdet)',101.2872,-16.7161,2.64,-1.46,1.71,9940,'civ','La estrella más brillante del cielo nocturno. Para Egipto era Isis/Sopdet: su orto helíaco anunciaba la crecida del Nilo y el Año Nuevo. Tiene una compañera enana blanca, Sirio B.'],
 ['betelgeuse','Betelgeuse',88.7929,7.4071,168,0.5,764,3600,'civ','Supergigante roja en Orión, la constelación que los egipcios asociaban con Osiris. Si estuviera en lugar del Sol, llegaría más allá de la órbita de Marte. Explotará como supernova en algún momento de los próximos ~100.000 años.'],
 ['rigel','Rigel',78.6345,-8.2016,264,0.13,78.9,12100,'civ','Supergigante azul, el «pie» de Orión. Unas 120.000 veces más luminosa que el Sol.'],
 ['polaris','Polaris',37.9546,89.2641,133,1.98,37.5,6015,'civ','La estrella polar actual. En China, la estrella polar representaba al emperador y las constelaciones a su corte. Por la precesión, no siempre fue la estrella polar.'],
 ['thuban','Thuban',211.0973,64.3758,94,3.65,3.4,10100,'civ','Hacia 2700 a.C., cuando se construían las pirámides, Thuban era la estrella más cercana al polo norte celeste.'],
 ['kochab','Kochab',222.6764,74.1555,40.1,2.08,42,4130,'civ','Según Spence (2000), Kochab y Mizar pudieron usarse para orientar la Gran Pirámide hacia el norte (hipótesis debatida).'],
 ['mizar','Mizar',200.9814,54.9254,26.3,2.04,2.4,9000,'civ','Estrella de la Osa Mayor que, junto con Kochab, se ha propuesto para orientar la Gran Pirámide (Spence, 2000).'],
 ['alcyone','Alcyone (Pléyades)',56.8712,24.1051,136,2.87,9.3,13000,'civ','La estrella más brillante de las Pléyades, cúmulo observado por casi todas las culturas antiguas.'],
 ['vega','Vega',279.2347,38.7837,7.68,0.03,2.36,9600,'civ','Fue la estrella polar hace unos 14.000 años y lo será de nuevo hacia el año 13.700.'],
 ['proxima','Próxima Centauri',217.4289,-62.6795,1.301,11.13,0.154,3042,'near','La estrella más cercana al Sol: 4,24 años luz. A la velocidad de Voyager 1 tardarías unos 75.000 años en llegar.'],
 ['uyscuti','UY Scuti',276.9017,-12.4664,1500,11.2,909,3365,'giant','Una de las estrellas más grandes conocidas. Su tamaño depende de su distancia, que es incierta. Está muy oscurecida por el polvo de la Vía Láctea.'],
 ['vycma','VY Canis Majoris',110.7430,-25.7675,1170,7.95,1420,3490,'giant','Hipergigante roja rodeada de una nebulosa de material expulsado. Si estuviera en el lugar del Sol, llegaría más allá de Júpiter.'],
 ['st218','Stephenson 2-18',279.7599,-6.0321,5800,15.0,2150,3200,'giant','Candidata a estrella más grande conocida (~2.150 radios solares), aunque su distancia y tamaño se debaten.'],
 ['antares','Antares',247.3519,-26.4320,170,1.06,680,3660,'giant','Supergigante roja, el «corazón» del Escorpión. Futura supernova.'],
 ['rhocas','Rho Cassiopeiae',358.5958,57.4994,1050,4.5,636,6000,'giant','Hipergigante amarilla que expulsa enormes cantidades de masa en erupciones. Futura supernova.'],
 ['etacar','Eta Carinae',161.2648,-59.6844,2300,4.3,240,15000,'giant','Sistema de estrellas muy masivas (~100 masas solares). En 1843 tuvo una «gran erupción» que la volvió la segunda estrella más brillante del cielo.'],
 ['r136a1','R136a1',84.6754,-69.1010,49970,12.2,39,46000,'giant','La estrella más masiva conocida (~200 masas solares), en la Gran Nube de Magallanes.'],
 ['deneb','Deneb',310.3580,45.2803,802,1.25,203,8500,'giant','Supergigante blanca muy luminosa, una de las estrellas más lejanas visibles a simple vista.'],
 ['ikpeg','IK Pegasi',321.611,19.3756,46,6.08,1.6,7700,'fsn','Sistema con una enana blanca masiva. Dentro de millones de años podría explotar como supernova tipo Ia, como las de 1006 o 1572.'],
 ['procyon','Proción',114.825,5.225,3.51,0.34,null,6530,'bg'],['canopus','Canopo',95.988,-52.696,95,-0.74,null,7350,'bg'],['arcturus','Arturo',213.915,19.182,11.26,-0.05,null,4290,'bg'],
 ['capella','Capella',79.172,45.998,13.1,0.08,null,4970,'bg'],['aldebaran','Aldebarán',68.980,16.509,20,0.86,null,3910,'bg'],['spica','Espiga',201.298,-11.161,77,0.97,null,22400,'bg'],
 ['altair','Altair',297.696,8.868,5.13,0.76,null,7700,'bg'],['fomalhaut','Fomalhaut',344.413,-29.622,7.7,1.16,null,8590,'bg'],['regulus','Régulo',152.093,11.967,24.3,1.40,null,12460,'bg'],
 ['pollux','Pólux',116.329,28.026,10.3,1.14,null,4670,'bg'],['castor','Cástor',113.650,31.888,15.6,1.58,null,10300,'bg'],['achernar','Achernar',24.429,-57.237,43,0.46,null,15000,'bg'],
 ['hadar','Hadar',210.956,-60.373,120,0.61,null,25000,'bg'],['acrux','Ácrux',186.650,-63.099,99,0.77,null,28000,'bg'],['mimosa','Mimosa',191.930,-59.689,85,1.25,null,27000,'bg'],
 ['gacrux','Gacrux',187.791,-57.113,27,1.59,null,3600,'bg'],['imai','Imai',183.786,-58.749,105,2.79,null,22000,'bg'],['bellatrix','Bellatrix',81.283,6.350,77,1.64,null,22000,'bg'],
 ['alnilam','Alnilam (Tres Marías)',84.053,-1.202,600,1.69,42,27000,'civ','La estrella central del cinturón de Orión (las Tres Marías). Supergigante azul unas 400.000 veces más luminosa que el Sol. Para los egipcios, Orión era Osiris. Las tres estrellas no están juntas: solo se alinean vistas desde la Tierra.'],['alnitak','Alnitak (Tres Marías)',85.190,-1.943,226,1.77,20,29000,'civ','Estrella triple, la más oriental del cinturón de Orión. Junto a ella están las nebulosas de la Flama y la Cabeza de Caballo. Una hipótesis muy debatida (Bauval, 1994) propuso que las pirámides de Giza imitan el cinturón; la mayoría de los arqueólogos la rechaza.'],['mintaka','Mintaka (Tres Marías)',83.002,-0.299,380,2.23,16.5,29500,'civ','La estrella más occidental del cinturón de Orión, casi exactamente sobre el ecuador celeste: sale casi por el este exacto y se pone por el oeste exacto en todo el planeta.'],
 ['saiph','Saiph',86.939,-9.670,198,2.09,null,26000,'bg'],['dubhe','Dubhe',165.932,61.751,37.7,1.79,null,4660,'bg'],['merak','Merak',165.460,56.383,24.4,2.37,null,9380,'bg'],
 ['phecda','Phecda',178.458,53.695,25.5,2.44,null,9350,'bg'],['megrez','Megrez',183.857,57.033,24.7,3.31,null,9480,'bg'],['alioth','Alioth',193.507,55.960,25.3,1.77,null,9020,'bg'],
 ['alkaid','Alkaid',206.885,49.313,31.9,1.86,null,15500,'bg'],['schedar','Schedar',10.127,56.537,70,2.24,null,4660,'bg'],['caph','Caph',2.295,59.150,16.8,2.28,null,7080,'bg'],
 ['gcas','Gamma Cas',14.177,60.717,168,2.47,null,25000,'bg'],['ruchbah','Ruchbah',21.454,60.235,30.5,2.68,null,8400,'bg'],['shaula','Shaula',263.402,-37.104,175,1.62,null,25000,'bg'],
 ['sargas','Sargas',264.330,-42.998,82,1.86,null,7300,'bg'],['dschubba','Dschubba',240.083,-22.622,150,2.29,null,27000,'bg'],['mirfak','Mirfak',51.081,49.861,155,1.79,null,6350,'bg']
];
// supernovas: id, nombre, AR, Dec, dist pc, fecha de llegada de la luz (año decimal), tipo, M pico, A (extinción a la Tierra), v (km/s), remanente, texto
const SNE=[
 ['sn185','SN 185',220.73,-62.47,2500,[185,12,7],'Ia',-19.3,0.3,5000,'RCW 86','Registrada en los anales de la dinastía Han: visible unos 8 meses en Centauro. Es la supernova registrada más antigua propuesta; su remanente sería RCW 86.'],
 ['sn1006','SN 1006',225.71,-41.94,2200,[1006,5,1],'Ia',-19.3,0.1,5000,'SNR 1006','La supernova más brillante de la historia (magnitud ≈ −7,5). Registrada en China, Japón, Egipto, Iraq y Europa. No se encontró una compañera gigante superviviente.'],
 ['sn1054','SN 1054 (Cangrejo)',83.6332,22.0145,2000,[1054,7,4],'CC',-18.5,1.0,1500,'Nebulosa del Cangrejo','La «estrella invitada» de 1054: visible de día 23 días y de noche 653 según la dinastía Song. Su remanente, la Nebulosa del Cangrejo, tiene un pulsar de 33,4 ms. La fecha histórica permitió descubrir que la nebulosa se está acelerando.'],
 ['sn1181','SN 1181',13.297,67.5006,2300,[1181,8,6],'Iax',-14.0,2.2,1100,'Pa 30','Registrada en China y Japón durante 185 días en Casiopea. Su remanente Pa 30 sugiere una explosión débil tipo Iax, quizá por fusión de enanas blancas.'],
 ['sn1572','SN 1572 (Tycho)',6.334,64.142,2500,[1572,11,6],'Ia',-19.3,3.3,5000,'Remanente de Tycho','Observada por Tycho Brahe y registrada en Corea y China. En 2008, el eco de su luz reflejada en polvo permitió confirmar que fue una Ia normal.'],
 ['sn1604','SN 1604 (Kepler)',262.675,-21.4917,5100,[1604,10,9],'Ia',-19.3,3.3,5000,'Remanente de Kepler','La última supernova vista a simple vista en nuestra galaxia. Observada por Kepler y registrada en Corea y China.'],
 ['casa','Cas A (~1680)',350.85,58.815,3400,[1680,8,16],'CC',-16.0,6.0,5000,'Casiopea A','Explotó hace unos 340 años, pero casi nadie la vio: el polvo de la galaxia la oscureció. Un ejemplo del sesgo del archivo histórico del que habla el ensayo.'],
 ['sn1987a','SN 1987A',83.8667,-69.2697,51400,[1987,2,23],'CC',-15.85,0.2,3000,'SN 1987A','En la Gran Nube de Magallanes. La supernova más cercana observada con telescopios modernos; se detectaron sus neutrinos.'],
 ['fbet','Betelgeuse (futura)',88.7929,7.4071,168,null,'CC',-17.0,0.1,3000,'','Si Betelgeuse explotara hoy, brillaría como la Luna en cuarto creciente (magnitud ≈ −11) y sería visible de día por semanas. No es peligrosa a 548 años luz. Nadie sabe cuándo pasará: podría ser mañana o dentro de 100.000 años.'],
 ['fant','Antares (futura)',247.3519,-26.4320,170,null,'CC',-17.0,0.4,3000,'','Otra supergigante roja cercana. Su supernova sería tan brillante como la de Betelgeuse.'],
 ['feta','Eta Carinae (futura)',161.2648,-59.6844,2300,null,'CC',-18.5,1.7,4000,'','Podría terminar como una supernova muy luminosa o incluso como hipernova. A 7.500 años luz, no sería peligrosa.'],
 ['frho','Rho Cassiopeiae (futura)',358.5958,57.4994,1050,null,'CC',-17.0,1.3,3000,'','Hipergigante amarilla al final de su vida.'],
 ['fik','IK Pegasi (futura Ia)',321.611,19.3756,46,null,'Ia',-19.3,0.0,5000,'','Escenario hipotético dentro de millones de años: una supernova Ia a 150 años luz brillaría mucho más que la Luna llena.']
];

/* ================= ESTADO ================= */
let renderer,scene,camera,W=1,H=1,uPx=1;
let simJD=yearToJD(2026.84), rate=1, rdir=1, last=0, hudT=0;
let cam=[0,0,0]; let camQ=null; // cámara: posición doble precisión en km (marco ecuatorial)
let mode='orbit', target=null, sel=null, orbitOff=[0,0,1], flight=null, cruise=null;
let speedMode='auto', autoMul=1, realV=CK, linkTime=true, shipTime=0, keys={}, fovT=60;
let showLabels=2, showOrbits=true, uiHidden=false, earthView=false;
const bodies=[], byId={};
const S_LIN=1e6;
function compressK(r){ return r<S_LIN?1:S_LIN*(1+Math.log(r/S_LIN))/r; }

/* ================= RUIDO ================= */
function hash(i,j,k,s){let h=(i*374761393+j*668265263+k*2147483647+s*1274126177)|0;h=(h^(h>>>13))*1274126177|0;return ((h^(h>>>16))>>>0)/4294967296}
function vnoise(x,y,z,s){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  const L=(a,b,t)=>a+(b-a)*t; const h=(a,b,c)=>hash(xi+a,yi+b,zi+c,s);
  return L(L(L(h(0,0,0),h(1,0,0),u),L(h(0,1,0),h(1,1,0),u),v),L(L(h(0,0,1),h(1,0,1),u),L(h(0,1,1),h(1,1,1),u),v),w)}
function fbm(x,y,z,o,s){let a=0,f=1,amp=.5,t=0;for(let i=0;i<o;i++){a+=amp*vnoise(x*f,y*f,z*f,s+i);t+=amp;f*=2.03;amp*=.5}return a/t}
function earthTex(){
  const w=1024,h=512; const mk=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const cc=mk(),ca=mk(),ck=mk(); const xc=cc.getContext('2d'),xa=ca.getContext('2d'),xk=ck.getContext('2d');
  const ic=xc.createImageData(w,h),ia=xa.createImageData(w,h),ik=xk.createImageData(w,h);
  for(let j=0;j<h;j++){ const lat=(0.5-(j+.5)/h)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat),al=Math.abs(lat);
    for(let i=0;i<w;i++){ const lon=(i+.5)/w*2*Math.PI; const px=cl*Math.cos(lon),py=sl,pz=cl*Math.sin(lon);
      const wq=fbm(px*2.5+7,py*2.5,pz*2.5,3,5)-.5;
      const n=fbm(px*1.7+wq*.9+5,py*1.7+wq*.7,pz*1.7-wq*.8,6,11);
      const o=(j*w+i)*4; let r,g,b,oc=0,city=0;
      const iceT=1.2-0.12*fbm(px*5,py*5,pz*5,3,2);
      if(n<.53){ const t=sstep(.38,.53,n); r=8+20*t; g=28+65*t; b=72+80*t; oc=255; if(al>iceT+.05){r=225;g=235;b=245;oc=60;} }
      else { const e=(n-.53)/.47, dry=fbm(px*5+2,py*5,pz*5,4,7);
        let c;
        if(al<.32) c=dry>.56?[196,168,112]:mix([28,84,34],[52,108,44],dry);
        else if(al<.62) c=dry>.47?mix([205,176,120],[226,200,150],dry):mix([60,104,48],[110,120,64],dry);
        else if(al<1.0) c=mix([56,92,52],[86,104,70],dry);
        else c=[140,138,122];
        if(e>.28) c=mix(c,[118,104,88],sstep(.28,.45,e)); if(e>.5) c=mix(c,[236,238,242],sstep(.5,.62,e));
        if(al>iceT) c=[236,240,246];
        [r,g,b]=c;
        const cf=fbm(px*110,py*110,pz*110,2,17), reg=fbm(px*4+3,py*4,pz*4,3,19); if(al<1.05&&e<.4&&reg>.5) city=Math.max(0,(cf-.6)*4.5)*(n<.58?1.5:.7)*(reg-.5)*4*255; }
      ic.data[o]=r;ic.data[o+1]=g;ic.data[o+2]=b;ic.data[o+3]=255;
      ia.data[o]=Math.min(255,city);ia.data[o+1]=oc;ia.data[o+2]=0;ia.data[o+3]=255;
      const cn=fbm(px*3+9+wq*1.5,py*6.5,pz*3,6,23); const cv=sstep(.5,.72,cn)*(al>1.3?.6:1)*255;
      ik.data[o]=cv;ik.data[o+1]=cv;ik.data[o+2]=cv;ik.data[o+3]=255; } }
  xc.putImageData(ic,0,0);xa.putImageData(ia,0,0);xk.putImageData(ik,0,0);
  const T=c=>{const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.wrapS=THREE.RepeatWrapping;return t;};
  return [T(cc),T(ca),T(ck)];
}
function craters(c,n,seed,dark){ const x=c.getContext('2d'),w=c.width,h=c.height; let s=seed;
  const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let i=0;i<n;i++){ const lat=Math.asin(2*rnd()-1), lon=rnd()*2*Math.PI; const r=Math.pow(rnd(),4.5)*h*.08+1.2; const cx=lon/(2*Math.PI)*w, cy=(.5-lat/Math.PI)*h; const sx=1/Math.max(.15,Math.cos(lat));
    x.save(); x.translate(cx,cy); x.scale(sx,1);
    const g=x.createRadialGradient(-r*.15,-r*.15,r*.1,0,0,r); g.addColorStop(0,`rgba(0,0,0,${dark})`); g.addColorStop(.75,`rgba(0,0,0,${dark*.6})`); g.addColorStop(.86,'rgba(255,255,255,.28)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.beginPath(); x.arc(0,0,r,0,7); x.fill(); x.restore(); } }
function texSphere(w,h,fn){
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');const im=x.createImageData(w,h);const d=im.data;
  for(let j=0;j<h;j++){const lat=(0.5-(j+.5)/h)*Math.PI,cl=Math.cos(lat),sl=Math.sin(lat);
    for(let i=0;i<w;i++){const lon=(i+.5)/w*2*Math.PI;const p=[cl*Math.cos(lon),sl,cl*Math.sin(lon)];const col=fn(p,lat);const o=(j*w+i)*4;d[o]=col[0];d[o+1]=col[1];d[o+2]=col[2];d[o+3]=col.length>3?col[3]:255;}}
  x.putImageData(im,0,0);if(fn.post)fn.post(c);const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;
}
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const TEX={
 earth:(p,lat)=>{const n=fbm(p[0]*2.2+5,p[1]*2.2,p[2]*2.2,6,11);const ice=Math.abs(lat)>1.22-0.12*fbm(p[0]*5,p[1]*5,p[2]*5,3,2);
   if(ice) return [235,240,248]; if(n<.52){const dd=sstep(.3,.52,n);return mix([10,30,80],[30,80,150],dd)}
   const dry=fbm(p[0]*6,p[1]*6,p[2]*6,4,7), tr=Math.abs(lat)<.45&&dry>.5; return tr?mix([170,140,90],[200,170,110],dry):mix([40,100,45],[110,120,70],sstep(.5,.75,dry)+sstep(.62,.7,n)*.5)},
 clouds:(p)=>{const n=fbm(p[0]*3+9,p[1]*6,p[2]*3,6,23);const a=sstep(.5,.75,n)*235;return [255,255,255,a]},
 mercury:(p)=>{const n=fbm(p[0]*5,p[1]*5,p[2]*5,6,3),c=fbm(p[0]*14,p[1]*14,p[2]*14,3,5);const v=110+90*n-40*sstep(.62,.7,c);return [v,v*.95,v*.88]},
 moon:(p)=>{const n=fbm(p[0]*3,p[1]*3,p[2]*3,6,41),c=fbm(p[0]*16,p[1]*16,p[2]*16,3,4);let v=150+70*n;if(n<.45)v-=55;v-=30*sstep(.6,.7,c);return [v,v,v*.97]},
 venus:(p,lat)=>{const n=fbm(p[0]*2+Math.sin(lat*5)*.5,p[1]*7,p[2]*2,5,8);return [215+30*n,180+40*n,110+40*n]},
 mars:(p,lat)=>{if(Math.abs(lat)>1.35)return [240,235,230];const n=fbm(p[0]*3,p[1]*3,p[2]*3,6,15);const dk=sstep(.5,.62,fbm(p[0]*2+3,p[1]*2,p[2]*2,4,16));return mix([200,105,60],[110,60,40],dk*.8+ (n-.5)*.6)},
 jupiter:(p,lat)=>{const t=fbm(p[0]*2.5,p[1]*9,p[2]*2.5,5,19), t2=fbm(p[0]*7,p[1]*20,p[2]*7,3,3);const y=Math.sin(lat)*9+(t-.5)*1.6+(t2-.5)*.35;const b=.5+.5*Math.sin(y*2.1);const b2=.5+.5*Math.sin(y*5.3);let c=mix(mix([176,120,86],[238,222,196],b),[214,170,120],b2*.35);if(Math.abs(lat)>1.1)c=mix(c,[150,130,120],.5);
   const gx=Math.atan2(p[2],p[0])-1.1, gy=lat+0.38; const gr=(gx*gx)/.06+(gy*gy)/.006; if(gr<1) c=mix(c,[190,90,60],1-gr); return c},
 saturn:(p,lat)=>{const t=fbm(p[0]*2,p[1]*12,p[2]*2,4,29);const b=.5+.5*Math.sin((Math.sin(lat)*8+(t-.5)*.8)*2);let c=mix([196,170,118],[238,220,172],b);if(Math.abs(lat)>1.25)c=mix(c,[120,140,150],.4);return c},
 uranus:(p,lat)=>{const b=.5+.5*Math.sin(Math.sin(lat)*6);return mix([150,210,220],[175,228,232],b*.4)},
 neptune:(p,lat)=>{const t=fbm(p[0]*3,p[1]*4,p[2]*3,4,31);const b=.5+.5*Math.sin((Math.sin(lat)*7+t)*2);let c=mix([45,80,190],[80,120,220],b);const gx=Math.atan2(p[2],p[0]),gy=lat+.35;if(gx*gx/.05+gy*gy/.01<1)c=[30,45,120];return c},
 pluto:(p,lat)=>{const n=fbm(p[0]*3,p[1]*3,p[2]*3,5,51);const lon=Math.atan2(p[2],p[0]);const heart=((lon-0.3)**2)/.25+((lat-.2)**2)/.12<1;return heart?[235,225,210]:mix([150,110,80],[205,170,130],n)},
 io:(p)=>{const n=fbm(p[0]*5,p[1]*5,p[2]*5,5,61);return mix([230,210,90],[200,120,50],sstep(.5,.75,n))},
 europa:(p)=>{const n=fbm(p[0]*4,p[1]*4,p[2]*4,5,62),l=Math.abs(fbm(p[0]*9,p[1]*9,p[2]*9,3,63)-.5)<.02;return l?[150,90,60]:mix([220,210,195],[190,170,150],n)},
 ganymede:(p)=>{const n=fbm(p[0]*4,p[1]*4,p[2]*4,5,64);return mix([110,100,90],[180,170,160],sstep(.4,.6,n))},
 callisto:(p)=>{const n=fbm(p[0]*6,p[1]*6,p[2]*6,5,65);return mix([60,55,50],[130,120,105],n)},
 titan:(p,lat)=>{const n=fbm(p[0]*2,p[1]*4,p[2]*2,4,66);return mix([200,140,60],[225,170,80],n)}
};

TEX.proxb=(p,lat)=>{ const lon=Math.atan2(p[2],p[0]); const sub=Math.cos(lat)*Math.cos(lon); const n=fbm(p[0]*3,p[1]*3,p[2]*3,5,71); if(sub>0.55+0.15*(n-.5)) return mix([20,50,95],[40,90,140],n); if(sub>0.15+0.2*(n-.5)) return mix([120,95,70],[160,130,95],n); return mix([200,210,225],[235,240,248],n); };
TEX.miller=(p,lat)=>{ const n=fbm(p[0]*3+2,p[1]*3,p[2]*3,5,81); const c=mix([34,54,66],[66,92,104],n); const cl=sstep(.55,.78,fbm(p[0]*2.5,p[1]*6,p[2]*2.5,5,83)); return mix(c,[205,210,215],cl*.65); };
TEX.mann=(p,lat)=>{ const n=fbm(p[0]*4,p[1]*4,p[2]*4,6,84), r=Math.abs(fbm(p[0]*10,p[1]*10,p[2]*10,3,85)-.5)<.03; let c=mix([170,186,204],[236,243,250],n); if(r) c=mix(c,[110,132,160],.55); return c; };
TEX.edmunds=(p,lat)=>{ const n=fbm(p[0]*3,p[1]*3,p[2]*3,6,86), d=.5+.5*Math.sin(p[0]*14+fbm(p[0]*5,p[1]*5,p[2]*5,3,87)*6); return mix(mix([140,80,42],[205,140,85],n),[232,178,118],d*.25); };
TEX.moon.post=c=>craters(c,700,7,.16); TEX.mercury.post=c=>craters(c,900,11,.16); TEX.callisto.post=c=>craters(c,700,13,.25); TEX.ganymede.post=c=>craters(c,400,17,.2);
/* ================= GLSL ================= */
const NOISE=`vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod289(i);
vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;
const VLOG=`#include <common>
#include <logdepthbuf_pars_vertex>`;
const FLOG=`#include <logdepthbuf_pars_fragment>`;
function smat(o){ return new THREE.ShaderMaterial(Object.assign({uniforms:{},transparent:false},o)); }
const starVS=`${VLOG}
varying vec3 vN; varying vec3 vP; varying vec3 vV;
void main(){ vP=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`;
const starFS=`${FLOG}
uniform vec3 uCol; uniform float uTime; uniform float uCool;
varying vec3 vN; varying vec3 vP; varying vec3 vV;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 float mu=max(dot(normalize(vN),normalize(vV)),0.0);
 float limb=0.35+0.65*pow(mu,0.55);
 float s=mix(55.0,9.0,uCool);
 float n=snoise(vP*s+vec3(uTime*0.05))*0.6+snoise(vP*s*2.3-vec3(uTime*0.08))*0.4;
 float big=snoise(vP*2.2+vec3(uTime*0.01));
 vec3 c=uCol*(1.05+0.22*n+uCool*0.25*big)*limb;
 c+=vec3(0.15)*pow(mu,3.0)*(1.0-uCool);
 c=pow(max(c,vec3(0.0)),vec3(1.0+uCool*0.7));
 gl_FragColor=vec4(c,1.0);
}`;
const atmoVS=`${VLOG}
varying vec3 vN; varying vec3 vV;
void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`;
const atmoFS=`${FLOG}
uniform vec3 uCol; uniform vec3 uSun; uniform float uK;
varying vec3 vN; varying vec3 vV;
void main(){
#include <logdepthbuf_fragment>
 float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),uK);
 float lit=smoothstep(-0.35,0.4,dot(normalize(vN),uSun));
 gl_FragColor=vec4(uCol*f*lit*1.4,1.0);
}`;
const planetVS=`${VLOG}
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vO;
void main(){ vUv=uv; vO=position; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`;
const planetFS=`${FLOG}
uniform sampler2D uMap; uniform sampler2D uAux; uniform sampler2D uCloud;
uniform float uHasMap,uHasAux,uHasCloud,uSpec,uTime,uDet,uDetA,uAtmK,uAmb,uHasBump,uBumpK;
uniform sampler2D uBump; uniform vec3 uCol,uSun,uAtm,uPoleV;
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying vec3 vO;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 vec3 n=normalize(vN), v=normalize(vV), l=normalize(uSun);
 if(uHasBump>0.5){ float du=1.0/1024.0, dv=1.0/512.0; float hL=texture2D(uBump,vUv-vec2(du,0.0)).r, hR=texture2D(uBump,vUv+vec2(du,0.0)).r, hD=texture2D(uBump,vUv-vec2(0.0,dv)).r, hU=texture2D(uBump,vUv+vec2(0.0,dv)).r;
   vec3 T=normalize(cross(uPoleV,n)+1e-5); vec3 B=cross(n,T); n=normalize(n+uBumpK*((hR-hL)*T-(hU-hD)*B)); }
 vec3 base=uHasMap>0.5?texture2D(uMap,vUv).rgb:uCol;
 float dn=snoise(vO*uDet)*0.55+snoise(vO*uDet*3.1)*0.3+snoise(vO*uDet*9.3)*0.15;
 base*=1.0+uDetA*dn;
 float ndl=dot(n,l); float diff=max(ndl,0.0); float day=smoothstep(-0.1,0.2,ndl);
 vec3 col=base*(uAmb+1.08*pow(diff,0.8));
 col*=mix(vec3(1.0),vec3(1.0,0.75,0.55),smoothstep(0.25,0.0,ndl)*day*uAtmK);
 float ocean=uHasAux>0.5?texture2D(uAux,vUv).g:0.0;
 if(uSpec>0.0){ vec3 h=normalize(l+v); float nh=max(dot(n,h),0.0); col+=vec3(1.0,0.93,0.8)*pow(nh,260.0)*uSpec*ocean*day*0.9; col+=vec3(0.6,0.7,0.9)*pow(nh,6.0)*0.05*ocean*day; }
 float cl=0.0;
 if(uHasCloud>0.5){ vec2 cu=vUv+vec2(uTime,0.0); cl=texture2D(uCloud,cu).r; float sh=texture2D(uCloud,cu+vec2(0.0025,0.0012)).r; col*=1.0-0.5*sh*day; col=mix(col,vec3(0.98,0.99,1.0)*(uAmb*0.4+1.12*pow(diff,0.7)),cl); }
 if(uHasAux>0.5){ float city=texture2D(uAux,vUv).r; col+=vec3(1.0,0.68,0.3)*city*(1.0-smoothstep(-0.18,0.04,ndl))*(1.0-cl*0.85)*1.6; }
 float fr=pow(1.0-max(dot(n,v),0.0),2.2);
 col+=uAtm*fr*smoothstep(-0.25,0.45,ndl)*uAtmK;
 gl_FragColor=vec4(col,1.0);
}`;
const haloAtmFS=`${FLOG}
uniform vec3 uCol; uniform vec3 uSun; uniform float uEdge; uniform float uI;
varying vec3 vN; varying vec3 vV;
void main(){
#include <logdepthbuf_fragment>
 vec3 n=normalize(vN); float d=dot(n,normalize(vV));
 float I=pow(clamp(-d/uEdge,0.0,1.0),2.4);
 float lit=smoothstep(-0.4,0.35,dot(n,uSun));
 gl_FragColor=vec4(uCol*I*lit*uI,1.0);
}`;
const coronaFS=`${FLOG}
uniform vec3 uCol; uniform float uTime; varying vec2 vUv;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 vec2 q=vUv*2.0-1.0; float r=length(q)*6.0; if(r<0.98||r>6.0) discard;
 float a=atan(q.y,q.x);
 float n=0.55+0.45*snoise(vec3(cos(a)*4.0,sin(a)*4.0,uTime*0.08+r*0.15));
 float n2=0.6+0.4*snoise(vec3(cos(a)*11.0,sin(a)*11.0,uTime*0.05));
 float I=pow(1.0/r,3.0)*n*n2*smoothstep(6.0,2.5,r)*1.6;
 gl_FragColor=vec4(uCol*I,1.0);
}`;
const lensVS=`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`;
const lensFS=`uniform sampler2D tS; uniform vec2 uC; uniform float uRe; uniform float uAsp; uniform float uSh;
varying vec2 vUv;
void main(){ vec2 d=vUv-uC; d.x*=uAsp; float r=length(d);
 vec2 src=d; if(r>1e-5) src=d*(1.0-(uRe*uRe)/(r*r));
 vec2 uv=uC+vec2(src.x/uAsp,src.y);
 vec3 c=texture2D(tS,clamp(uv,0.001,0.999)).rgb;
 float out1=step(0.0,uv.x)*step(uv.x,1.0)*step(0.0,uv.y)*step(uv.y,1.0);
 if(r<uRe){ float f=smoothstep(uSh,uRe,r); c*=mix(0.15,1.0,out1)*f*f; }
 c*=1.0+0.8*exp(-pow((r-uRe)/(uRe*0.05+0.002),2.0));
 gl_FragColor=vec4(c,1.0);
}`;
const ringVS=`${VLOG}
varying vec3 vP; varying vec3 vW;
void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv;
#include <logdepthbuf_vertex>
}`;
const ringFS=`${FLOG}
uniform float uLit; uniform vec3 uSunL; uniform sampler2D uRT; uniform float uHasRT;
varying vec3 vP;
float band(float r,float a,float b){return step(a,r)*step(r,b);}
void main(){
#include <logdepthbuf_fragment>
 float r=length(vP.xy)*58232.0;
 float d=0.0;
 d+=0.18*band(r,74658.0,92000.0);
 d+=(0.75+0.06*sin(r*0.0021)+0.04*sin(r*0.013))*band(r,92000.0,117580.0);
 d+=0.04*band(r,117580.0,122170.0);
 d+=(0.5+0.1*sin(r*0.004))*band(r,122170.0,136775.0)*(1.0-band(r,133423.0,133745.0));
 d+=0.25*band(r,140100.0,140260.0);
 vec3 col=mix(vec3(0.62,0.56,0.47),vec3(0.95,0.88,0.74),d); if(uHasRT>0.5){ vec3 rt=texture2D(uRT,vec2(clamp((r-74658.0)/(140300.0-74658.0),0.0,1.0),0.5)).rgb; col=rt*1.15; d=max(d*0.6, dot(rt,vec3(0.33))*0.9)*step(74658.0,r); }
 if(d<0.01) discard;
 vec3 L=normalize(uSunL); vec3 P=vec3(vP.xy,0.0); float b=dot(P,L); float c=dot(P,P)-1.0; float disc=b*b-c;
 float shadow=(disc>0.0&&(-b-sqrt(max(disc,0.0)))>0.0)?0.07:1.0;
 float lit=(0.18+0.82*pow(abs(L.z),0.5))*shadow;
 gl_FragColor=vec4(col*lit*uLit,d*0.95);
}`;
const skyVS=`${VLOG}
uniform vec3 uCam; uniform mat3 uG2E; uniform float uPx; uniform float uDpr; uniform float uMode; uniform float uBright; uniform float uUnit; uniform float uNoExt; uniform float uFade;
attribute float aM; attribute vec3 aC; attribute float aS;
varying vec3 vC; varying float vA;
void main(){
 vec3 rel=position-uCam; float d=max(length(rel),1e-5);
 vec3 dir=uG2E*(rel/d);
 vec4 mv=viewMatrix*vec4(dir*5.0e7,1.0);
 gl_Position=projectionMatrix*mv;
 float zm=abs(0.5*(position.z+uCam.z)+20.0);
 float dpc=d*uUnit; float A=(1.0-uNoExt)*(dpc/1000.0)*exp(-zm/140.0);
 if(uMode<0.5){
   float m=aM+5.0*log(dpc/10.0)/2.302585+A;
   float b=pow(10.0,-0.4*(m-6.5));
   gl_PointSize=clamp(1.3+1.6*sqrt(b),1.0,7.0)*uDpr;
   vA=clamp(b*0.8,0.0,1.0)*uBright; vC=aC;
 } else {
   float px=aS/d*uPx;
   float a=aM*min(1.0,(px*px)/9.0)*exp(-A*0.35);
   a*=smoothstep(0.7,3.5,d/aS);
   gl_PointSize=clamp(px,2.0,180.0)*uDpr;
   vA=a*uBright; vC=aC;
 }
 vA*=uFade; if(vA<0.003) gl_PointSize=0.0;
#include <logdepthbuf_vertex>
}`;
const skyFS=`${FLOG}
uniform float uMode;
varying vec3 vC; varying float vA;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; float r2=dot(q,q); if(r2>1.0) discard;
 float f=uMode<0.5? exp(-r2*4.0) : exp(-r2*2.5);
 gl_FragColor=vec4(vC*f*vA,uMode>1.5? f*vA : 1.0);
}`;
const nebVS=`${VLOG}
uniform float uSize; uniform float uPx; uniform float uDpr;
attribute vec3 aC; varying vec3 vC;
void main(){ vC=aC; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; float ps=uSize/max(-mv.z,1e-6)*uPx; gl_PointSize=clamp(ps,1.0,48.0)*uDpr; vC*=clamp(48.0/ps,0.15,1.0);
#include <logdepthbuf_vertex>
}`;
const nebFS=`${FLOG}
uniform float uA; varying vec3 vC;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; float r2=dot(q,q); if(r2>1.0) discard; gl_FragColor=vec4(vC*exp(-r2*3.0)*uA,1.0);}`;
const bbVS=`${VLOG}
varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
#include <logdepthbuf_vertex>
}`;
const shadowFS=`${FLOG}
uniform float uRing; varying vec2 vUv;
void main(){
#include <logdepthbuf_fragment>
 float r=length(vUv*2.0-1.0); if(r>1.0) discard;
 float core=1.0-smoothstep(0.375,0.385,r);
 float ring=exp(-pow((r-0.392)/0.012,2.0))*uRing;
 if(core<0.01&&ring<0.01) discard;
 gl_FragColor=vec4(vec3(1.0,0.8,0.55)*ring,max(core,clamp(ring,0.0,1.0)));
}`;
const haloFS=`${FLOG}
uniform float uB; uniform vec2 uAx; uniform float uTime; varying vec2 vUv;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 vec2 q=vUv*2.0-1.0; float r=length(q); if(r>1.0||r<0.39) discard;
 float arc=pow(abs(dot(normalize(q),uAx)),3.0);
 float prof=smoothstep(0.39,0.42,r)*(1.0-smoothstep(0.45,0.75,r));
 float n=0.7+0.3*snoise(vec3(q*6.0,uTime*0.2));
 gl_FragColor=vec4(vec3(1.0,0.7,0.4)*arc*prof*n*uB,1.0);
}`;
const diskVS=`${VLOG}
varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
#include <logdepthbuf_vertex>
}`;
const diskFS=`${FLOG}
uniform vec3 uCam; uniform float uTime; uniform float uB; uniform float uOut;
varying vec3 vP;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 float r=length(vP.xy); float ang=atan(vP.y,vP.x);
 float t=pow(3.0/r,0.75)*pow(max(0.0,1.0-sqrt(3.0/r)),0.25);
 vec3 tang=normalize(vec3(-vP.y,vP.x,0.0));
 float beta=clamp(sqrt(0.5/max(r-1.0,0.5)),0.0,0.7);
 vec3 n=normalize(uCam-vP);
 float g=1.0/sqrt(1.0-beta*beta);
 float D=1.0/(g*(1.0-beta*dot(tang,n)));
 float sp=ang+2.2*log(r)-uTime*0.6/pow(r/3.0,1.5);
 float turb=0.62+0.25*snoise(vec3(cos(sp)*2.0,sin(sp)*2.0,r*0.35))+0.13*snoise(vec3(cos(sp)*6.0,sin(sp)*6.0,r*1.2));
 float ring=0.85+0.15*sin(r*2.6);
 float I=pow(t,2.4)*7.0*turb*ring*pow(D,3.0)*uB;
 I*=smoothstep(3.0,3.4,r)*(1.0-smoothstep(uOut*0.6,uOut,r));
 vec3 col=mix(vec3(1.0,0.35,0.08),vec3(1.0,0.92,0.8),clamp(t*2.2*D,0.0,1.0));
 col=mix(col,vec3(0.75,0.85,1.0),clamp((D-1.2)*0.8,0.0,0.6));
 gl_FragColor=vec4(col*I,1.0);
}`;
const beamVS=`${VLOG}
varying float vY; void main(){ vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
#include <logdepthbuf_vertex>
}`;
const beamFS=`${FLOG}
uniform vec3 uCol; uniform float uA; varying float vY;
void main(){
#include <logdepthbuf_fragment>
 float f=1.0-clamp(abs(vY),0.0,1.0); gl_FragColor=vec4(uCol*f*f*uA,1.0);}`;

/* ================= HUD ================= */
function buildHud(){
  const root=$('#v-cosmos');
  const st=document.createElement('style');
  st.textContent=`
  #cz{position:absolute;inset:0;overflow:hidden;color:#dff6ff;--cy:#7fe3ff;--am:#ffb347;--pn:#06101ccc;--ln:#7fe3ff33;font-family:var(--f-data);font-size:14px}
  #cz canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab}
  #cz .lbls{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  #cz .lb{position:absolute;left:0;top:0;white-space:nowrap;font-size:12px;color:#cfe9ff;text-shadow:0 0 3px #000,0 0 6px #000;pointer-events:auto;cursor:pointer;padding:2px 4px 2px 10px}
  #cz .lb::before{content:"";position:absolute;left:-4px;top:50%;width:8px;height:8px;margin-top:-4px;border:1px solid currentColor;border-radius:50%}
  #cz .lb.t{color:var(--am);font-weight:600}
  #cz .lb.sn{color:#ff9ad5}#cz .lb.bh{color:#c7a6ff}#cz .lb.ns{color:#8ff0ff}#cz .lb.planet{color:#ffe7a8}
  #cz .pn{position:absolute;background:var(--pn);border:1px solid var(--ln);border-radius:10px;backdrop-filter:blur(6px)}
  #cz .top{left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));top:calc(10px + env(safe-area-inset-top,0px));display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:8px 10px}
  #cz .b{background:#0b2236;border:1px solid var(--ln);color:#dff6ff;border-radius:7px;padding:5px 9px;font:inherit;font-size:13px;white-space:nowrap}
  #cz .b:hover{border-color:var(--cy)} #cz .b.on{background:var(--cy);color:#04121d;border-color:var(--cy)}
  #cz .b.hot{background:var(--am);color:#1d1000;border-color:var(--am)}
  #cz select,#cz input{background:#0b2236;border:1px solid var(--ln);color:#dff6ff;border-radius:7px;padding:5px 6px;font:inherit;font-size:13px;max-width:100%}
  #cz .date{font-size:17px;font-weight:600;color:#fff;font-variant-numeric:tabular-nums;min-width:15ch}
  #cz .sp{flex:1}
  #cz .menu{left:max(10px,env(safe-area-inset-left,0px));top:calc(70px + env(safe-area-inset-top,0px));bottom:calc(90px + env(safe-area-inset-bottom,0px));width:min(300px,80vw);overflow:auto;padding:10px}
  #cz .vpop{right:max(10px,env(safe-area-inset-right,0px));top:calc(64px + env(safe-area-inset-top,0px));width:min(320px,92vw);padding:12px;display:grid;gap:10px;z-index:20;font-size:13px}
  #cz .vpop label{display:grid;gap:4px;color:#9fd2e8;min-width:0}#cz .vpop select{width:100%}#cz .vpop{z-index:26}#cz .vpop .row{display:flex;gap:8px;flex-wrap:wrap}
  #cz .msearch{position:sticky;top:-10px;background:#06101cf2;padding:4px 0 8px;z-index:2}
  #cz .msearch input{width:100%;font-size:15px;padding:8px 10px}
  #cz .b:disabled{opacity:.4}
  #cz .menu h3{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--am);margin:12px 4px 6px}
  #cz .menu button{display:block;width:100%;text-align:left;background:none;border:0;color:#dff6ff;padding:5px 8px;border-radius:6px;font:inherit;font-size:13px}
  #cz .menu button:hover{background:#7fe3ff22}
  #cz .menu button small{color:#8fb3c9;margin-left:6px}
  #cz .info{right:max(10px,env(safe-area-inset-right,0px));top:calc(70px + env(safe-area-inset-top,0px));width:min(360px,calc(100vw - 20px));max-height:calc(100% - 180px);overflow:auto;padding:14px}
  #cz .info h2{margin:0 0 2px;font-size:22px;color:#fff;font-weight:600}
  #cz .info .k{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--am)}
  #cz .info p{font-family:var(--f-body);font-weight:600;font-size:14px;line-height:1.45;color:#cfe3ef;margin:8px 0}
  #cz .info dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:8px 0;font-size:12.5px}
  #cz .info dt{color:#8fb3c9}#cz .info dd{margin:0;color:#fff;font-variant-numeric:tabular-nums;min-width:0;overflow-wrap:anywhere}
  #cz .info .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  #cz .bot{left:max(10px,env(safe-area-inset-left,0px));right:max(10px,env(safe-area-inset-right,0px));bottom:calc(10px + env(safe-area-inset-bottom,0px));display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 10px}
  #cz .ro{font-size:12.5px;color:#9fd2e8;font-variant-numeric:tabular-nums}
  #cz .ro b{color:#fff;font-weight:600}
  #cz .toast{position:absolute;left:50%;top:84px;transform:translateX(-50%);padding:8px 14px;font-size:14px;max-width:min(640px,90vw);text-align:center;pointer-events:none;transition:opacity .4s}
  #cz .load{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:10px;font-size:18px;color:var(--cy);background:radial-gradient(circle at 50% 45%,#0b2236,#000 70%);z-index:50;text-align:center}
  #cz .load small{color:#8fb3c9;font-size:13px}
  #cz .ld-orb{position:relative;width:120px;height:120px;border:1px solid #7fe3ff44;border-radius:50%;animation:czspin 2.4s linear infinite}
  #cz .ld-orb b{position:absolute;left:50%;top:50%;width:26px;height:26px;margin:-13px;border-radius:50%;background:radial-gradient(#fff6c8,#ffb347);box-shadow:0 0 30px #ffb347}
  #cz .ld-orb i{position:absolute;left:50%;top:-6px;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:#6fa8ff;box-shadow:0 0 10px #6fa8ff}
  @keyframes czspin{to{transform:rotate(1turn)}}
  #cz .help{left:50%;bottom:76px;transform:translateX(-50%);padding:10px 14px;font-size:12.5px;line-height:1.6;max-width:min(720px,94vw)}
  #cz .help kbd{border:1px solid var(--ln);border-radius:4px;padding:0 4px;color:#fff}
  #cz .vis{display:inline-block;padding:1px 6px;border-radius:4px;font-size:11px}
  #cz [hidden]{display:none!important}
  #cz .more-btn{display:none}
  #cz .ic{display:none}#cz.dev-phone .ic{display:inline}#cz.dev-phone .lg{display:none}
  /* ---- tablet ---- */
  #cz.dev-tablet .top .ro,#cz.dev-tablet #cz-go,#cz.dev-tablet #cz-help{display:none}
  #cz.dev-tablet .info{width:min(330px,46vw);max-height:calc(100% - 200px)}
  #cz.dev-tablet .b{padding:8px 11px}
  /* ---- celular ---- */
  #cz.dev-phone{font-size:13px}
  #cz.dev-phone .b,#cz.dev-phone select{padding:7px 9px;font-size:13px;min-height:36px}
  #cz.dev-phone .more-btn{display:inline-block;font-size:18px;line-height:1}
  #cz.dev-phone .top{gap:6px;padding:6px 8px;flex-wrap:wrap;left:max(6px,env(safe-area-inset-left,0px));right:max(6px,env(safe-area-inset-right,0px));top:calc(6px + env(safe-area-inset-top,0px))}
  #cz.dev-phone .top .sp{display:none}
  #cz.dev-phone .date{font-size:12px;min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;order:5;flex-basis:100%}
  #cz.dev-phone .top>*:not(a):not(#cz-mbtn):not(#cz-rate):not(#cz-more):not(.date){display:none}
  #cz.dev-phone.more .top>*:not(.sp){display:inline-flex!important}
  #cz.dev-phone .b{white-space:nowrap}
  #cz.dev-phone .bot .b{padding:6px 8px;font-size:12px;min-height:32px}
  #cz.dev-phone .bot{flex-wrap:wrap;row-gap:4px}
  #cz.dev-phone.more .top .sp{display:none}
  #cz.dev-phone #cz-rate{max-width:42vw}
  #cz.dev-phone .bot{left:max(6px,env(safe-area-inset-left,0px));right:max(6px,env(safe-area-inset-right,0px));bottom:calc(6px + env(safe-area-inset-bottom,0px));gap:6px;padding:6px 8px}
  #cz.dev-phone .bot>span[style],#cz.dev-phone #cz-smode,#cz.dev-phone #cz-v,#cz.dev-phone #cz-linkw,#cz.dev-phone .grav{display:none!important}
  #cz.dev-phone.more .bot #cz-smode{display:inline-block!important}
  #cz.dev-phone #cz-ro{flex-basis:100%;font-size:11px;max-height:2.6em;overflow:hidden;line-height:1.3}
  #cz.dev-phone .menu{left:6px;right:6px;width:auto;top:calc(56px + env(safe-area-inset-top,0px));bottom:calc(136px + env(safe-area-inset-bottom,0px));height:auto}
  #cz.dev-phone .info{left:6px;right:6px;width:auto;top:auto;bottom:calc(132px + env(safe-area-inset-bottom,0px));max-height:38vh;padding:10px 12px}
  #cz.dev-phone .info h2{font-size:18px;cursor:pointer}
  #cz.dev-phone .info h2::after{content:" ▾";font-size:12px;color:#8fb3c9}
  #cz.dev-phone .info.collapsed h2::after{content:" ▸"}
  #cz.dev-phone .info p{font-size:13px}
  #cz.dev-phone .info.collapsed p,#cz.dev-phone .info.collapsed dl{display:none}
  #cz.dev-phone .info.collapsed .acts .b{padding:5px 8px;font-size:12px;min-height:30px}
  #cz.dev-phone .info .acts .b{flex:1 1 auto}
  #cz.dev-phone .vpop{left:6px;right:6px;width:auto;top:calc(56px + env(safe-area-inset-top,0px));max-height:60vh;overflow:auto}
  #cz.dev-phone .help,#cz.dev-phone .cl{display:none!important}
  #cz.dev-phone .lb{font-size:11px;padding:2px 3px 2px 9px}
  #cz.dev-phone .toast{top:auto;bottom:calc(150px + env(safe-area-inset-bottom,0px));font-size:12.5px}
  #cz.dev-phone .surfbar{top:calc(96px + env(safe-area-inset-top,0px));font-size:12px}
  #cz.dev-phone .tessui{font-size:13px}#cz.dev-phone .tessui h2{font-size:20px}
  #cz.dev-phone .fallmsg{font-size:13px;bottom:calc(70px + env(safe-area-inset-bottom,0px))}
  #cz.noui .pn,#cz.noui .lbls{display:none}
  #cz .cl{position:absolute;left:0;top:0;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#7fa8ffaa;white-space:nowrap;transform-origin:left}
  #cz .cl.c{color:#ffab80cc;letter-spacing:0;text-transform:none;font-size:13px}#cz .cl small{font-size:10px;opacity:.75}
  #cz .grav{display:none}#cz.free .grav{display:inline-flex;align-items:center;gap:4px}
  #cz .surfbar{left:50%;top:calc(70px + env(safe-area-inset-top,0px));transform:translateX(-50%);display:flex;gap:8px;align-items:center;padding:8px 12px;flex-wrap:wrap;max-width:94vw;font-size:13px}
  #cz .cz-wh{position:absolute;inset:-20%;z-index:55;pointer-events:none;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.95) 0,rgba(170,200,255,.65) 7%,rgba(60,80,170,.3) 20%,rgba(0,0,0,0) 38%),repeating-radial-gradient(circle at 50% 50%,rgba(120,160,255,0) 0 16px,rgba(140,175,255,.25) 21px,rgba(120,160,255,0) 27px);animation:czwh 4.3s ease-in-out forwards}
  @keyframes czwh{0%{opacity:0;transform:scale(.15) rotate(0)}35%{opacity:1;transform:scale(1.5) rotate(100deg)}50%{opacity:1;transform:scale(3) rotate(170deg);filter:brightness(2.2)}100%{opacity:0;transform:scale(5) rotate(280deg)}}
  #cz #cz-dclk{position:absolute;bottom:100px;left:16px;z-index:12;display:grid;grid-template-columns:auto auto;gap:4px 18px;align-items:end;background:rgba(6,10,20,.62);backdrop-filter:blur(6px);border:1px solid rgba(140,190,255,.25);border-radius:14px;padding:8px 16px;color:#e8f0ff;font-variant-numeric:tabular-nums;pointer-events:none;max-width:92%}
  #cz #cz-dclk small{display:block;font-size:11px;opacity:.7;letter-spacing:.04em;text-transform:uppercase}
  #cz #cz-dclk b{font-size:22px;font-weight:700;display:block}#cz #cz-dclk .e b{color:#ffcf7a}
  #cz #cz-dclk p{margin:0;grid-column:1/-1;text-align:center;font-size:11px;opacity:.65}
  #cz.dev-phone #cz-dclk{bottom:128px;left:8px;padding:6px 10px;gap:10px}#cz.dev-phone #cz-dclk b{font-size:16px}
  #cz .cz-wake{position:absolute;inset:0;z-index:60;pointer-events:none;animation:czwk 6.2s forwards;background:radial-gradient(ellipse at center,transparent 30%,#000 75%)}
  #cz .cz-wake i{position:absolute;left:-5%;right:-5%;height:52%;background:#000;border-radius:0 0 50% 50%/0 0 30% 30%}
  #cz .cz-wake i:first-child{top:0;animation:czlidT 6.2s forwards}#cz .cz-wake i:last-child{bottom:0;border-radius:50% 50% 0 0/30% 30% 0 0;animation:czlidB 6.2s forwards}
  @keyframes czlidT{0%,30%{transform:translateY(0)}45%{transform:translateY(-35%)}55%{transform:translateY(-10%)}100%{transform:translateY(-100%)}}
  @keyframes czlidB{0%,30%{transform:translateY(0)}45%{transform:translateY(35%)}55%{transform:translateY(10%)}100%{transform:translateY(100%)}}
  @keyframes czwk{0%{background-color:#fff}8%{background-color:#000}70%{opacity:1}100%{opacity:0}}
  #cz.waking canvas{animation:czblur 6.2s forwards}
  @keyframes czblur{0%,35%{filter:blur(14px) brightness(1.5)}100%{filter:none}}
  #cz .cz-black{position:absolute;inset:0;background:#000;z-index:55;pointer-events:none;animation:czblack 3s forwards}
  #cz .cz-black.out{animation:czbout 2.8s forwards}
  @keyframes czblack{from{opacity:0}to{opacity:1}} @keyframes czbout{from{opacity:1}to{opacity:0}}
  #cz .fallmsg{position:absolute;left:50%;bottom:calc(140px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:58;font-size:16px;color:#cfe9ff;text-shadow:0 0 8px #000,0 0 3px #000;letter-spacing:.06em;text-align:center;max-width:90vw;pointer-events:none}
  #cz .cz-white{position:absolute;inset:0;background:#fff;z-index:60;pointer-events:none;animation:czwhite 2.6s forwards}
  @keyframes czwhite{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
  #cz .tessui{position:absolute;left:max(16px,env(safe-area-inset-left,0px));bottom:calc(20px + env(safe-area-inset-bottom,0px));max-width:min(520px,92vw);padding:16px 18px;background:#1a0f05cc;border:1px solid #ffc07055;border-radius:12px;color:#ffe6c0;z-index:30}
  #cz .tessui h2{margin:2px 0 6px;font-size:26px;color:#ffd27a}#cz .tessui .k{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#ffb347}
  #cz .tessui p{font-family:var(--f-body);font-weight:600;line-height:1.45;margin:6px 0}#cz .tessui p.sm{font-size:12px;opacity:.75}
  #cz .tline{position:absolute;left:50%;top:38%;transform:translateX(-50%);width:min(760px,90vw);text-align:center;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:clamp(20px,3.2vw,34px);color:#ffe6b8;text-shadow:0 0 18px #ffb34788,0 0 3px #000;opacity:0;pointer-events:none;z-index:31;display:none}
  #cz.tess .tline{display:block}#cz .tline.on{animation:tline 6s forwards}
  @keyframes tline{0%{opacity:0;letter-spacing:.3em;filter:blur(6px)}18%{opacity:1;letter-spacing:.02em;filter:blur(0)}75%{opacity:1}100%{opacity:0;filter:blur(4px)}}
  #cz .tfrag{position:absolute;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);width:min(620px,92vw);padding:16px 20px;border-radius:12px;background:linear-gradient(#2a1a08e6,#140c04e6);border:1px solid #ffc07066;box-shadow:0 0 40px #ffb34733;color:#fbe9c8;font-family:Georgia,serif;font-size:clamp(15px,2vw,19px);line-height:1.45;opacity:0;transition:opacity .6s,transform .6s;pointer-events:none;z-index:32;display:none}
  #cz.tess .tfrag{display:block}#cz .tfrag.on{opacity:1;transform:translate(-50%,0)}
  #cz .tfrag small{display:block;font-family:var(--f-data);font-style:normal;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ffb347;margin-bottom:6px}
  #cz .tessui{top:calc(14px + env(safe-area-inset-top,0px));bottom:auto!important;max-width:min(380px,92vw)!important;padding:12px 14px!important;background:#0d0804b8!important}
  #cz .tessui p{font-size:13px}
  #cz.dev-phone .tessui p:not(.sm){display:none}
  #cz.tess .touch{display:flex}
  #cz.tess .pn,#cz.tess .lbls,#cz.falling .pn,#cz.falling .lbls{display:none}
  #cz .fallcancel{display:none}#cz.falling .fallcancel{display:block;position:absolute;right:16px;bottom:16px;z-index:59}
  #cz .dil{color:#9fd8ff}
  #cz .touch{position:absolute;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(84px + env(safe-area-inset-bottom,0px));display:none;flex-direction:column;gap:8px}
  #cz .touch .b{width:56px;height:48px;font-size:18px}
  #cz.free .touch{display:flex}
  @media (max-width:760px){#cz .menu{top:auto;bottom:calc(84px + env(safe-area-inset-bottom,0px));height:45vh}#cz .info{top:auto;bottom:calc(84px + env(safe-area-inset-bottom,0px));max-height:42vh}#cz .date{font-size:14px}}
  `;
  document.head.appendChild(st);
  const RATES=[[0,'Pausa'],[1,'1 s = 1 s (real)'],[5,'1 s = 5 s'],[10,'1 s = 10 s'],[30,'1 s = 30 s'],[60,'1 s = 1 min'],[600,'1 s = 10 min'],[1800,'1 s = 30 min'],[3600,'1 s = 1 h'],[21600,'1 s = 6 h'],[43200,'1 s = 12 h'],[86400,'1 s = 1 día'],[604800,'1 s = 1 semana'],[2629800,'1 s = 1 mes'],[YEAR,'1 s = 1 año'],[10*YEAR,'1 s = 10 años'],[100*YEAR,'1 s = 100 años'],[1000*YEAR,'1 s = 1.000 años'],[10000*YEAR,'1 s = 10.000 años']];
  const VS=[[1,'1 km/s'],[11.2,'11,2 km/s · escape de la Tierra'],[17,'17 km/s · Voyager 1'],[192,'192 km/s · Parker Solar Probe'],[0.1*CK,'10 % de la luz'],[0.5*CK,'50 % de la luz'],[0.9*CK,'90 % de la luz'],[0.99*CK,'99 % de la luz'],[CK,'Velocidad de la luz (c)'],[10*CK,'10 c (imposible)'],[1000*CK,'1.000 c (imposible)'],[1e6*CK,'1 millón c (imposible)'],[1e9*CK,'1.000 millones c (imposible)']];
  root.innerHTML=`<div id="cz">
   <div class="load" id="cz-load"><div class="ld-orb"><i></i><b></b></div><div>Encendiendo motores…</div><small>Generando 260.000 estrellas, galaxias y planetas a escala real</small></div>
   <div class="lbls" id="cz-clbl"></div><div class="lbls" id="cz-lbls"></div>
   <div class="fallmsg" id="cz-fall" hidden></div><button class="b fallcancel" id="cz-fallx">Abortar la caída</button>
   <div class="pn surfbar" id="cz-surfbar" hidden><span id="cz-surfinfo"></span><select id="cz-site" aria-label="Lugar de aterrizaje"></select><button class="b hot" id="cz-lift">🚀 Despegar</button></div>
   <div class="tline" id="cz-tline"></div>
   <div class="tfrag" id="cz-tfrag"></div>
   <div class="tessui" id="cz-tess" hidden><div class="k">Más allá del horizonte de eventos</div><h2>El teseracto</h2><p>Una biblioteca de cinco dimensiones donde el tiempo es un lugar. Acércate a las columnas para leer los fragmentos del ensayo grabados en ellas. Arrastra para mirar; <kbd>W</kbd>/<kbd>S</kbd> (o mantén pulsado ▲) para avanzar.</p><p class="sm">Ficción inspirada en la relatividad: nadie sabe qué hay dentro de un agujero negro.</p><button class="b hot" id="cz-tessout">Volver a la Tierra</button></div>
   <div class="pn top">
     <a class="b" href="#inicio" style="text-decoration:none">◀ Inicio</a>
     <button class="b" id="cz-mbtn">☰ Destinos</button>
     <span class="date" id="cz-date">—</span>
     <button class="b" id="cz-rev" title="Invertir el sentido del tiempo">⏪</button>
     <button class="b" id="cz-slow" title="Más lento ( [ )">−</button>
     <select id="cz-rate" aria-label="Escala de tiempo">${RATES.map(r=>`<option value="${r[0]}" ${r[0]===1?'selected':''}>${r[1]}</option>`).join('')}</select>
     <button class="b" id="cz-fast" title="Más rápido ( ] )">+</button>
     <button class="b" id="cz-now">Hoy</button>
     <label class="ro">Año <input id="cz-year" type="number" step="1" style="width:7ch" aria-label="Ir al año (negativo = a.C.)"></label><button class="b" id="cz-go">Ir</button>
     <span class="sp"></span>
     <button class="b on" id="cz-conbtn" title="Mostrar u ocultar constelaciones (tecla C)">✦ Constelaciones</button>
     <button class="b" id="cz-light" title="Cambiar iluminación (tecla L)">🌑 Luz realista</button>
     <button class="b" id="cz-vbtn" title="Opciones de vista">⚙ Vista</button>
     <button class="b" id="cz-help">?</button>
     <button class="b" id="cz-full">⛶</button>
     <button class="b more-btn" id="cz-more" aria-label="Más opciones">⋯</button>
   </div>
   <div class="pn vpop" id="cz-vpop" hidden>
     <label>Constelaciones <select id="cz-con" aria-label="Tipo de constelaciones"><option value="1">Occidentales (88)</option><option value="2">28 mansiones chinas</option></select></label>
     <label>Etiquetas <select id="cz-lbl" aria-label="Etiquetas"><option value="2">Destinos</option><option value="3">Todas</option><option value="0">Ninguna</option></select></label>
     <label>Iluminación <select id="cz-lsel"><option value="real">Realista (luz del Sol, exposición automática)</option><option value="studio">Estudio (foco desde la cámara)</option></select></label>
     <label>Dispositivo <select id="cz-dev"><option value="auto">Detectar automáticamente</option><option value="phone">Celular</option><option value="tablet">Tablet</option><option value="desktop">Computadora</option></select></label>
     <label>Calidad gráfica <select id="cz-qual"><option value="auto">Automática</option><option value="ligera">Ligera (celulares y equipos modestos)</option><option value="normal">Normal</option><option value="ultra">Ultra (tarjeta gráfica potente)</option></select></label>
     <small style="color:#8fb3c9">La resolución se ajusta sola para mantener la fluidez. La cantidad de estrellas cambia al recargar.</small>
     <div class="row"><button class="b on" id="cz-snd">🔊 Sonido</button><button class="b on" id="cz-orb">Órbitas</button><button class="b" id="cz-mw" title="Ver el universo en microondas">📡 Microondas</button></div>
   </div>
   <div class="pn menu" id="cz-menu" hidden></div>
   <div class="pn info" id="cz-info" hidden></div>
   <div class="pn bot">
     <button class="b" id="cz-back" title="Volver al destino anterior (Retroceso)" disabled>↩ Atrás</button>
     <button class="b on" data-mode="orbit"><span class="ic">🪐 </span>Orbitar</button>
     <button class="b" data-mode="free"><span class="ic">🚀 </span>Vuelo libre</button>
     <button class="b" data-mode="earth"><span class="ic">🌍 </span><span class="lg">Desde la </span>Tierra</button>
     <span style="width:1px;height:22px;background:var(--ln)"></span>
     <select id="cz-smode" aria-label="Tipo de velocidad"><option value="auto">Velocidad automática</option><option value="real">Viaje real (velocidad fija)</option></select>
     <select id="cz-v" aria-label="Velocidad" hidden>${VS.map(v=>`<option value="${v[0]}" ${v[0]===CK?'selected':''}>${v[1]}</option>`).join('')}</select>
     <label class="ro" id="cz-linkw" hidden><input type="checkbox" id="cz-link" checked> el viaje usa el reloj simulado</label>
     <label class="ro grav"><input type="checkbox" id="cz-grav"> Gravedad real</label><button class="b grav" id="cz-orbitnow">Entrar en órbita</button>
     <span class="ro" id="cz-ro"></span>
   </div>
   <div class="pn help" id="cz-helpbox" hidden>
     <b>Orbitar:</b> arrastra para girar alrededor del destino · rueda/pellizco para acercarte.<br>
     <b>Vuelo libre:</b> <kbd>W</kbd><kbd>S</kbd> avanzar/retroceder · <kbd>A</kbd><kbd>D</kbd> lados · <kbd>R</kbd><kbd>F</kbd> subir/bajar · <kbd>Q</kbd><kbd>E</kbd> rotar · arrastra para mirar · rueda: velocidad · <kbd>Shift</kbd> ×10.<br>
     <b>Desde la Tierra:</b> arrastra para mirar el cielo · rueda = zoom de telescopio.<br>
     <b>Tiempo:</b> elige cuánto tiempo simulado pasa por cada segundo real. En «Viaje real» la nave se mueve a la velocidad elegida y el reloj simulado avanza a la vez, así ves las distancias reales.<br>
     <b>Atajos:</b> <kbd>/</kbd> buscar · <kbd>Enter</kbd> viajar al seleccionado · <kbd>Retroceso</kbd> destino anterior · <kbd>[</kbd> <kbd>]</kbd> tiempo más lento/rápido · <kbd>Espacio</kbd> pausa · <kbd>C</kbd> constelaciones · <kbd>L</kbd> luz realista/estudio · <kbd>H</kbd> ocultar interfaz · <kbd>Esc</kbd> cerrar paneles.<br>
     Clic en un nombre para ver información, doble clic para viajar.
   </div>
   <div class="touch"><button class="b" id="cz-fw">▲</button><button class="b" id="cz-bw">▼</button></div>
   <div class="pn toast" id="cz-toast" style="opacity:0"></div>
  </div>`;
  const DEVK='cz-dev'; let devPref=(()=>{ try{ return localStorage.getItem(DEVK)||'auto'; }catch(e){ return 'auto'; } })();
  const detectDev=()=>{ const w=innerWidth, h=innerHeight, touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0; const sm=Math.min(w,h);
    if(sm<560||w<640) return 'phone'; if(touch&&Math.max(w,h)<1400) return 'tablet'; return 'desktop'; };
  const applyDev=()=>{ const d=devPref==='auto'?detectDev():devPref; const z=$('#cz'); ['phone','tablet','desktop'].forEach(k=>z.classList.toggle('dev-'+k,k===d)); window.__czDev=d;
    if(d==='phone'){ $('#cz-helpbox').hidden=true; if(showLabels===3) showLabels=2; } };
  $('#cz-dev').value=devPref; $('#cz-dev').onchange=e=>{ devPref=e.target.value; try{ localStorage.setItem(DEVK,devPref); }catch(er){} applyDev(); };
  addEventListener('resize',()=>{ if(devPref==='auto') applyDev(); }); applyDev();
  $('#cz-more').onclick=()=>$('#cz').classList.toggle('more');
  $('#cz-mbtn').onclick=()=>{ $('#cz-menu').hidden=!$('#cz-menu').hidden; if(!$('#cz-menu').hidden){ const q=$('#cz-q'); q&&setTimeout(()=>q.focus(),30); } };
  $('#cz-qual').value=qualPref; $('#cz-qual').onchange=e=>{ setQual(e.target.value); toast('Calidad: '+e.target.selectedOptions[0].textContent,2500); };
  $('#cz-snd').onclick=()=>{ soundOn=!soundOn; $('#cz-snd').classList.toggle('on',soundOn); $('#cz-snd').textContent=soundOn?'🔊 Sonido':'🔇 Sonido'; if(!soundOn) droneSet(0); };
  $('#cz-vbtn').onclick=()=>{ $('#cz-vpop').hidden=!$('#cz-vpop').hidden; };
  const setLight=m=>{ lightMode=m; $('#cz-lsel').value=m; $('#cz-light').textContent=m==='studio'?'💡 Luz de estudio':'🌑 Luz realista'; $('#cz-light').classList.toggle('on',m==='studio');
    toast(m==='studio'?'Luz de estudio: un foco ilumina todo desde tu cámara, para ver cada objeto completo.':'Luz realista: solo ilumina el Sol (o la estrella más cercana); el lado nocturno es oscuro y la vista se ajusta al brillo como una cámara.',5000); };
  $('#cz-light').onclick=()=>setLight(lightMode==='studio'?'real':'studio'); $('#cz-lsel').onchange=e=>setLight(e.target.value);
  const stepRate=d=>{ const sl=$('#cz-rate'); const i=Math.max(0,Math.min(sl.options.length-1,sl.selectedIndex+d)); sl.selectedIndex=i; rate=+sl.options[i].value; toast(sl.options[i].textContent,1200); };
  $('#cz-slow').onclick=()=>stepRate(-1); $('#cz-fast').onclick=()=>stepRate(1);
  $('#cz-back').onclick=()=>goBack();
  addEventListener('keydown',e=>{ if($('#v-cosmos').hidden||inTess||e.target.closest('input,select')) return; const k=e.key;
    if(k==='['){ stepRate(-1); } else if(k===']'){ stepRate(1); }
    else if(k==='Escape'){ ['#cz-menu','#cz-vpop','#cz-helpbox','#cz-info'].forEach(id=>$(id).hidden=true); sel=null; }
    else if(k==='Backspace'){ e.preventDefault(); goBack(); }
    else if((k==='Enter'||k==='g'||k==='G')&&sel){ goTo(sel); }
    else if(k==='l'||k==='L'){ setLight(lightMode==='studio'?'real':'studio'); }
    else if(k==='/'){ e.preventDefault(); $('#cz-menu').hidden=false; $('#cz-q').focus(); } });
  $('#cz-help').onclick=()=>{ $('#cz-helpbox').hidden=!$('#cz-helpbox').hidden; };
  $('#cz-full').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():$('#cz').requestFullscreen()}catch(e){}};
  $('#cz-rate').onchange=e=>{rate=+e.target.value};
  $('#cz-rev').onclick=()=>{rdir*=-1;$('#cz-rev').classList.toggle('hot',rdir<0);toast(rdir<0?'El tiempo corre hacia atrás':'El tiempo corre hacia adelante')};
  $('#cz-now').onclick=()=>{ const d=new Date(); simJD=d.getTime()/86400000+2440587.5; };
  $('#cz-go').onclick=()=>{ const y=parseFloat($('#cz-year').value); if(isFinite(y)) setYear(y<=0&&y!==0?y+1:y); };
  $('#cz-lbl').onchange=e=>{showLabels=+e.target.value};
  let conType=1;
  const setCon=on=>{ constMode=on?conType:0; $('#cz-conbtn').classList.toggle('on',on); $('#cz-conbtn').textContent=on?'✦ Constelaciones':'✧ Sin constelaciones'; };
  $('#cz-con').onchange=e=>{ conType=+e.target.value; setCon(true); };
  $('#cz-conbtn').onclick=()=>setCon(constMode===0);
  addEventListener('keydown',e=>{ if($('#v-cosmos').hidden||e.target.closest('input,select')) return; if(e.key.toLowerCase()==='c') setCon(constMode===0); });
  $('#cz-mw').onclick=()=>{microwave=!microwave;$('#cz-mw').classList.toggle('on',microwave);toast(microwave?'Visión de microondas: ves el fondo cósmico, la luz más antigua del universo.':'Visión normal.')};
  $('#cz-lift').onclick=()=>leaveSurface();
  $('#cz-site').onchange=e=>{ if(surf) land(surf.b,(SITES[surf.b.id]||[])[+e.target.value]); };
  $('#cz-tessout').onclick=()=>exitTesseract();
  $('#cz-fallx').onclick=()=>{ if(plungeS){ const b=plungeS.b; setMode('orbit'); target=b; goTo(b,{dist:b.R*60}); toast('Caída abortada: la nave escapa del agujero negro.'); } };
  $('#cz-grav').onchange=e=>{gravityOn=e.target.checked; vel=[0,0,0]; toast(gravityOn?'Gravedad real activada: la nave cae hacia los objetos masivos. Usa W/S para acelerar y «Entrar en órbita» para orbitar. El tiempo simulado controla la física.':'Gravedad desactivada.',7000)};
  $('#cz-orbitnow').onclick=()=>{ if(!gravityOn){ gravityOn=true; $('#cz-grav').checked=true; } orbitHere(); };
  $('#cz-orb').onclick=()=>{showOrbits=!showOrbits;$('#cz-orb').classList.toggle('on',showOrbits)};
  document.querySelectorAll('#cz [data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  $('#cz-smode').onchange=e=>{speedMode=e.target.value;$('#cz-v').hidden=speedMode!=='real';$('#cz-linkw').hidden=speedMode!=='real'; if(speedMode==='real'){toast('Viaje real: elige la velocidad y la escala de tiempo. Abre un destino y pulsa «Viajar a esta velocidad».');}};
  $('#cz-v').onchange=e=>{realV=+e.target.value; if(realV>CK) toast('Más rápido que la luz es imposible según la relatividad; aquí sirve para cruzar la galaxia.');};
  $('#cz-link').onchange=e=>{linkTime=e.target.checked};
  const hold=(id,k)=>{const b=$(id);b.onpointerdown=()=>keys[k]=true;b.onpointerup=b.onpointerleave=()=>keys[k]=false;};
  hold('#cz-fw','w');hold('#cz-bw','s');
}
let toastT=0;
function toast(t,ms=4200){const e=$('#cz-toast');if(!e)return;e.textContent=t;e.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>e.style.opacity=0,ms);}
function setYear(y){ simJD=yearToJD(y); }

/* ================= CREACIÓN DE CUERPOS ================= */
let sphereGeo,planeGeo,glowTex,sunLight;
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.08,'rgba(255,255,255,.85)');g.addColorStop(.25,'rgba(255,255,255,.25)');g.addColorStop(.6,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c);}
let flareTex;
function flareTexture(){const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');const g=x.createRadialGradient(S/2,S/2,0,S/2,S/2,S/2);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.05,'rgba(255,255,255,.9)');g.addColorStop(.16,'rgba(255,255,255,.28)');g.addColorStop(.45,'rgba(255,255,255,.05)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,S,S);
  x.globalCompositeOperation='lighter';
  const spike=(a,w,l,al)=>{x.save();x.translate(S/2,S/2);x.rotate(a);const lg=x.createLinearGradient(-l,0,l,0);lg.addColorStop(0,'rgba(255,255,255,0)');lg.addColorStop(.5,`rgba(255,255,255,${al})`);lg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=lg;x.beginPath();x.moveTo(-l,0);x.lineTo(0,-w);x.lineTo(l,0);x.lineTo(0,w);x.fill();x.restore();};
  spike(0,2.2,S/2,.9);spike(Math.PI/2,2.2,S/2,.9);spike(Math.PI/4,1.2,S*.3,.35);spike(-Math.PI/4,1.2,S*.3,.35);
  return new THREE.CanvasTexture(c);}
function addBody(b){
  b.cur=b.cur||[0,0,0]; b.R=b.R||1; b.dist=1; b.obj=b.obj||new THREE.Group(); scene.add(b.obj);
  if(b.glow){ const sm=new THREE.SpriteMaterial({map:(b.kind==='star'||b.kind==='sn')?flareTex:glowTex,color:new THREE.Color().setRGB(...b.glow),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,sizeAttenuation:false}); b.sprite=new THREE.Sprite(sm); b.sprite.renderOrder=5; scene.add(b.sprite); }
  if((b.menu!==false||b.cat==='bg')&&b.cat){ const l=document.createElement('div'); l.className='lb '+(b.kind||''); l.textContent=b.name; l.onclick=e=>{e.stopPropagation();select(b)}; l.ondblclick=e=>{e.stopPropagation();goTo(b)}; $('#cz-lbls').appendChild(l); b.lbl=l; }
  bodies.push(b); byId[b.id]=b; return b;
}
function starMesh(T,cool){
  const c=bbColor(T);
  const m=smat({vertexShader:starVS,fragmentShader:starFS,uniforms:{uCol:{value:new THREE.Vector3(...c)},uTime:{value:0},uCool:{value:cool?1:0}}});
  return new THREE.Mesh(sphereGeo,m);
}
function makeStar(o){
  // o: id,name,pos,R(R☉),T,Mv,cat,info,kind
  const b=Object.assign({kind:'star',menu:true},o);
  b.Rkm=o.R*RS; b.R=b.Rkm; b.T=o.T; b.glow=bbColor(o.T);
  const mesh=starMesh(o.T,o.T<4500); b.obj=new THREE.Group(); b.obj.add(mesh); b.mesh=mesh;
  if(o.cat!=='bg'){ const cm=smat({vertexShader:bbVS,fragmentShader:coronaFS,uniforms:{uCol:{value:new THREE.Vector3(...bbColor(o.T))},uTime:{value:0}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false}); const co=new THREE.Mesh(planeGeo,cm); co.scale.setScalar(6); co.renderOrder=4; b.obj.add(co); b.corona=co; }
  b.fixed=o.pos; b.getPos=o.getPos||(()=>b.fixed);
  b.view=b.R*5;
  return addBody(b);
}
function binaryOffset(jd,P,a,e,tp,u,v){ // devuelve vector relativo (km) en el plano u,v
  const M=2*Math.PI*((jd-tp)/P%1); let E=M; for(let i=0;i<10;i++) E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const x=a*(Math.cos(E)-e), y=a*Math.sqrt(1-e*e)*Math.sin(E);
  return [u[0]*x+v[0]*y,u[1]*x+v[1]*y,u[2]*x+v[2]*y];
}
function basisFor(pos,tilt){ const los=norm(pos); let u=norm(cross([0,0,1],los)); let v=cross(los,u); const c=Math.cos(tilt),s=Math.sin(tilt); // plano que contiene la línea de visión si tilt=0
  return [u, [v[0]*c+los[0]*s, v[1]*c+los[1]*s, v[2]*c+los[2]*s]]; }

function keplerPlanet(el,jd){
  const T=(jd-J2000)/36525; const a=el[0]+el[6]*T,e=Math.max(0,el[1]+el[7]*T),I=(el[2]+el[8]*T)*D2R,Lm=el[3]+el[9]*T,wb=el[4]+el[10]*T,O=el[5]+el[11]*T;
  const w=(wb-O)*D2R,Om=O*D2R; let M=((Lm-wb)*D2R)%(2*Math.PI); if(M>Math.PI)M-=2*Math.PI; if(M<-Math.PI)M+=2*Math.PI;
  let E=M+e*Math.sin(M); for(let i=0;i<8;i++) E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));
  const xp=a*(Math.cos(E)-e), yp=a*Math.sqrt(1-e*e)*Math.sin(E);
  const cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(Om),sO=Math.sin(Om),cI=Math.cos(I),sI=Math.sin(I);
  return ecl2eq([((cw*cO-sw*sO*cI)*xp+(-sw*cO-cw*sO*cI)*yp)*AU,((cw*sO+sw*cO*cI)*xp+(-sw*sO+cw*cO*cI)*yp)*AU,((sw*sI)*xp+(cw*sI)*yp)*AU]);
}
function moonGeo(jd){ const d=jd-J2000; const L=(218.316+13.176396*d)*D2R, M=(134.963+13.064993*d)*D2R, F=(93.272+13.229350*d)*D2R;
  const lam=L+6.289*D2R*Math.sin(M), bet=5.128*D2R*Math.sin(F), r=385001-20905*Math.cos(M);
  return ecl2eq([r*Math.cos(bet)*Math.cos(lam),r*Math.cos(bet)*Math.sin(lam),r*Math.sin(bet)]); }
function poleQuat(ra,dec){ const p=radec(ra,dec,1); return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(p[0],p[1],p[2])); }

function planetBody(id,name,R,col,texKey,opts){
  const gas=['jupiter','saturn','uranus','neptune'].includes(id);
  const atmTint={earth:[0.35,0.6,1.0],venus:[1.0,0.85,0.55],mars:[1.0,0.6,0.4],titan:[1.0,0.6,0.25],uranus:[0.5,0.85,0.95],neptune:[0.35,0.55,1.0],jupiter:[0.9,0.8,0.6],saturn:[0.9,0.8,0.6]}[id]||[0,0,0];
  const cc=new THREE.Color(col);
  const mat=smat({vertexShader:planetVS,fragmentShader:planetFS,uniforms:{uMap:{value:null},uAux:{value:null},uCloud:{value:null},uHasMap:{value:0},uHasAux:{value:0},uHasCloud:{value:0},uSpec:{value:id==='earth'?1:0},uTime:{value:0},
    uDet:{value:gas?3:9},uDetA:{value:gas?0.035:0.12},uAtmK:{value:id==='earth'?0.9:atmTint[0]?0.45:0},uAmb:{value:0.012},uHasBump:{value:0},uBumpK:{value:0},uBump:{value:null},uPoleV:{value:new THREE.Vector3(0,1,0)},uCol:{value:new THREE.Vector3(cc.r,cc.g,cc.b)},uSun:{value:new THREE.Vector3(1,0,0)},uAtm:{value:new THREE.Vector3(...atmTint)}}});
  mat.transparent=false; mat.depthWrite=true; const mesh=new THREE.Mesh(sphereGeo,mat); mesh.renderOrder=2;
  const b=Object.assign({id,name,kind:'planet',R,col,texKey,mesh,obj:new THREE.Group(),view:R*4},opts||{});
  b.obj.add(mesh);
  const c=new THREE.Color(col); b.glow=[c.r,c.g,c.b];
  return addBody(b);
}
const TEXF={earth:['earth.jpg','earth_bump.jpg',2.2],moon:['moon.jpg','moon_bump.jpg',3.0],mercury:['mercury.jpg','mercury_bump.jpg',2.5],mars:['mars.jpg','mars_bump.jpg',3.0],jupiter:['jupiter.jpg'],saturn:['saturn.jpg'],uranus:['uranus.jpg'],neptune:['neptune.jpg'],pluto:['pluto.jpg']};
function ensureTex(b){
  if(b.texDone||!b.texKey) return; b.texDone=true;
  const U=b.mesh.material.uniforms;
  const F=TEXF[b.id];
  const proc=()=>{ if(b.id==='earth'){ const [c,a,k]=earthTex(); U.uMap.value=c; U.uAux.value=a; U.uCloud.value=k; U.uHasAux.value=1; U.uHasCloud.value=1; }
    else { const big=['jupiter','mars','saturn','moon','mercury','venus'].includes(b.id)?[1024,512]:[512,256]; U.uMap.value=texSphere(big[0],big[1],TEX[b.texKey]); } U.uHasMap.value=1; };
  if(!F){ proc(); return; }
  const L=new THREE.TextureLoader(), ld=(f,cb)=>L.load('tex/'+f,t=>{ t.anisotropy=8; t.wrapS=THREE.RepeatWrapping; cb(t); },undefined,()=>{ if(f===F[0]) proc(); });
  ld(F[0],t=>{ U.uMap.value=t; U.uHasMap.value=1; U.uDetA.value=0.025; });
  if(F[1]) ld(F[1],t=>{ U.uBump.value=t; U.uHasBump.value=1; U.uBumpK.value=F[2]||1.5; });
  if(b.id==='earth'){ ld('earth_aux.jpg',t=>{ U.uAux.value=t; U.uHasAux.value=1; }); ld('earth_clouds.jpg',t=>{ U.uCloud.value=t; U.uHasCloud.value=1; }); }
  if(b.id==='saturn'&&b.ringMat) ld('saturn_ring.jpg',t=>{ b.ringMat.uniforms.uRT.value=t; b.ringMat.uniforms.uHasRT.value=1; });
}
function atmo(b,col,k,scale){ const m=smat({vertexShader:atmoVS,fragmentShader:haloAtmFS,uniforms:{uCol:{value:new THREE.Vector3(...col)},uSun:{value:new THREE.Vector3(1,0,0)},uEdge:{value:Math.sqrt(1-1/(scale*scale))},uI:{value:k}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.BackSide});
  const a=new THREE.Mesh(sphereGeo,m); a.scale.setScalar(scale); b.obj.add(a); b.atmo=a; }

function makeNS(o){ // estrella de neutrones: púlsar o magnetar
  const b=Object.assign({kind:'ns',menu:true},o); b.R=12; b.view=900;
  const g=new THREE.Group(); const spin=new THREE.Group(); g.add(spin); const mag=new THREE.Group(); spin.add(mag); mag.rotation.z=(o.tilt||35)*D2R;
  const sm=smat({vertexShader:starVS,fragmentShader:starFS,uniforms:{uCol:{value:new THREE.Vector3(...(o.mag?[0.75,0.7,1.0]:[0.8,0.9,1.0]))},uTime:{value:0},uCool:{value:0}}});
  spin.add(new THREE.Mesh(sphereGeo,sm));
  const Lb=o.mag?40:150, cone=new THREE.ConeGeometry(Math.tan((o.mag?14:9)*D2R)*Lb,Lb,32,1,true); cone.translate(0,-Lb/2,0); cone.scale(1,1,1);
  const bm=smat({vertexShader:beamVS,fragmentShader:beamFS,uniforms:{uCol:{value:new THREE.Vector3(...(o.mag?[0.8,0.45,1.0]:[0.55,0.85,1.0]))},uA:{value:o.mag?0.35:0.6}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  // normalizar y para el desvanecimiento
  const pa=cone.attributes.position; for(let i=0;i<pa.count;i++) pa.setY(i,pa.getY(i));
  const beam1=new THREE.Mesh(cone,bm); beam1.scale.set(1,1,1); const beam2=beam1.clone(); beam2.rotation.z=Math.PI;
  bm.vertexShader=beamVS.replace('vY=position.y','vY=position.y/'+Lb.toFixed(1));
  mag.add(beam1); mag.add(beam2);
  // líneas del campo dipolar
  const pts=[]; const Ls=o.mag?[2,3,4.5,7,11,16]:[2,3.5,6,10]; const nphi=o.mag?12:8;
  for(const Lv of Ls) for(let k=0;k<nphi;k++){ const ph=k/nphi*Math.PI*2; const t0=Math.asin(Math.sqrt(1/Lv)); let prev=null;
    for(let i=0;i<=40;i++){ const th=t0+(Math.PI-2*t0)*i/40; const r=Lv*Math.sin(th)**2; const p=[r*Math.sin(th)*Math.cos(ph),r*Math.cos(th),r*Math.sin(th)*Math.sin(ph)]; if(prev) pts.push(...prev,...p); prev=p; } }
  const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
  const lines=new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:o.mag?0xc77dff:0x6fd6ff,transparent:true,opacity:o.mag?0.55:0.35,blending:THREE.AdditiveBlending,depthWrite:false}));
  mag.add(lines);
  b.obj=g; b.spin=spin; b.beamMat=bm; b.glow=o.mag?[0.8,0.6,1]:[0.7,0.9,1]; b.Mv=o.Mv||6; b.fixed=o.pos; b.getPos=()=>b.fixed; b.ang=0;
  return addBody(b);
}
function makeBH(o){
  const b=Object.assign({kind:'bh',menu:true},o); const Rs=2.953*o.M; b.R=Rs; b.view=Rs*(o.disk?55:30);
  const g=new THREE.Group();
  const shadow=new THREE.Mesh(planeGeo,smat({vertexShader:bbVS,fragmentShader:shadowFS,uniforms:{uRing:{value:o.disk?1.3:0.6}},transparent:true,depthWrite:true}));
  shadow.scale.setScalar(6.75); shadow.renderOrder=1; shadow.layers.set(1); g.add(shadow);
  let disk=null,halo=null,dm=null,hm=null;
  if(o.disk){
    dm=smat({vertexShader:diskVS,fragmentShader:diskFS,uniforms:{uCam:{value:new THREE.Vector3()},uTime:{value:0},uB:{value:o.disk},uOut:{value:o.outer||24}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide});
    disk=new THREE.Mesh(new THREE.RingGeometry(3,o.outer||24,256,16),dm); disk.renderOrder=2; disk.layers.set(1);
    const n=o.normal||[0.3,0.2,1]; disk.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...norm(n))); g.add(disk);
    hm=smat({vertexShader:bbVS,fragmentShader:haloFS,uniforms:{uB:{value:o.disk*1.1},uAx:{value:new THREE.Vector2(0,1)},uTime:{value:0}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    halo=new THREE.Mesh(planeGeo,hm); halo.scale.setScalar(6.75); halo.renderOrder=3; halo.layers.set(1); g.add(halo);
    if(o.jet){ const jl=600, jg=new THREE.ConeGeometry(jl*0.015,jl,24,1,true); jg.translate(0,-jl/2,0);
      const jm=smat({vertexShader:beamVS.replace('vY=position.y','vY=position.y/'+jl.toFixed(1)),fragmentShader:beamFS,uniforms:{uCol:{value:new THREE.Vector3(0.5,0.65,1.0)},uA:{value:0.16}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,side:THREE.DoubleSide});
      const j1=new THREE.Mesh(jg,jm); j1.layers.set(1); j1.rotation.x=-Math.PI/2; const jw=new THREE.Group(); jw.add(j1); const j2=j1.clone(); j2.layers.set(1); j2.rotation.x=Math.PI/2; jw.add(j2); jw.quaternion.copy(disk.quaternion); g.add(jw); }
  }
  if(o.disk){ const nn=norm(o.normal||[0.3,0.2,1]); const pp=norm(cross(nn,[0,0,1])); b.approach=norm(add(mul(nn,0.14),mul(pp,1))); b.view=Rs*(o.view||26); b.upv=new THREE.Vector3(...nn); b.outer=o.outer||24; }
  b.obj=g; b.shadow=shadow; b.disk=disk; b.halo=halo; b.dm=dm; b.hm=hm; b.fixed=o.pos; b.getPos=o.getPos||(()=>b.fixed);
  if(o.disk) b.glow=[1,0.75,0.5], b.Mv=o.Mv;
  return addBody(b);
}
/* ---------- Interstellar (ficción científica) ---------- */
const whVS=`${VLOG}
varying vec3 vN; varying vec3 vW;
void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 wp=modelMatrix*vec4(position,1.0); vW=wp.xyz; gl_Position=projectionMatrix*viewMatrix*wp;
#include <logdepthbuf_vertex>
}`;
const whFS=`${FLOG}
uniform float uTime; uniform vec3 uG; uniform float uKind;
varying vec3 vN; varying vec3 vW;
float hs(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453); }
vec3 sky(vec3 d0,float ta){ vec3 c=vec3(0.0); float ca=cos(ta), sa=sin(ta); vec3 d=vec3(ca*d0.x-sa*d0.z,d0.y,sa*d0.x+ca*d0.z);
 for(int k=0;k<3;k++){ float sc=55.0+float(k)*65.0; vec3 q=d*sc; vec3 i=floor(q); vec3 f=fract(q)-0.5; float h=hs(i+float(k)*7.0); if(h>0.92){ vec3 o=vec3(hs(i+1.3),hs(i+2.1),hs(i+3.7))-0.5; float r=length(f-o*0.6); c+=mix(vec3(0.7,0.8,1.0),vec3(1.0,0.85,0.6),hs(i+5.0))*smoothstep(0.14,0.0,r)*(h-0.92)*13.0; } }
 float band=exp(-pow(dot(d,normalize(vec3(0.3,1.0,0.2)))/0.2,2.0)); c+=vec3(0.32,0.28,0.4)*band*0.55;
 d=d0; float g=dot(d,uG); float ang=acos(clamp(g,-1.0,1.0));
 if(uKind<0.5){ c+=vec3(1.0,0.72,0.42)*exp(-pow((ang-0.075)/0.012,2.0))*2.2; vec3 ax=normalize(cross(uG,vec3(0.2,1.0,0.1))); float dsk=abs(dot(d,ax)); c+=vec3(1.0,0.62,0.32)*exp(-dsk*dsk/0.00012)*smoothstep(0.3,0.07,ang)*2.0; c+=vec3(1.0,0.55,0.25)*exp(-ang*14.0)*0.5; if(ang<0.065) c*=0.0; }
 else { c+=vec3(1.0,0.92,0.75)*exp(-ang*40.0)*2.0+vec3(0.9,0.8,0.55)*exp(-pow((ang-0.3)/0.03,2.0))*0.25; }
 return c; }
void main(){
#include <logdepthbuf_fragment>
 vec3 N=normalize(vN), V=normalize(-vW); float mu=max(dot(N,V),0.0);
 vec3 r=refract(-V,N,0.6);
 vec3 c=sky(normalize(r),uTime*0.01);
 c=mix(c,vec3(0.5,0.65,1.0)*0.6,pow(1.0-mu,3.0)*0.5)+vec3(0.6,0.75,1.0)*pow(1.0-mu,9.0)*1.6;
 gl_FragColor=vec4(c,1.0);
}`;
function makeWH(o){ const m=smat({vertexShader:whVS,fragmentShader:whFS,uniforms:{uTime:{value:0},uG:{value:new THREE.Vector3(0,0,1)},uKind:{value:o.kindV||0}}}); const mesh=new THREE.Mesh(sphereGeo,m); mesh.layers.set(2); mesh.renderOrder=2;
  const g=new THREE.Group(); g.add(mesh); const b=Object.assign({kind:'wh',menu:true,obj:g,wm:m,glow:[0.6,0.75,1],Mv:44},o); b.view=b.R*5; return addBody(b); }
function buildInterstellar(){
  const gp=radec(84.0,-69.5,0.06*PC); // «otra galaxia»: en el simulador vive en un «bolsillo» cercano (precisión numérica) y solo se ve al cruzar el agujero de gusano
  const nrm=[0.12,1,0.22];
  const G=makeBH({id:'garg',name:'Gargantúa (Interstellar)',cat:'inter',pos:gp,M:1e8,disk:0.8,outer:13,normal:nrm,Mv:-17,info:'El agujero negro supermasivo de la película Interstellar (2014): unos 100 millones de masas solares, diseñado con el físico Kip Thorne (Nobel 2017). Su imagen en la película fue una de las primeras simulaciones realistas de un disco de acreción curvado por la gravedad. Es ficción, pero su física es real. En la película gira casi a la velocidad máxima posible; aquí se dibuja sin giro.'});
  const N=norm(nrm), U=norm(cross(N,[0,0,1])), V=cross(N,U);
  const orb=(rRs,P,ph,zRs)=>()=>{ const a=2*Math.PI*gclk/P+ph, r=rRs*G.R; return add(G.cur,add(add(mul(U,Math.cos(a)*r),mul(V,Math.sin(a)*r)),mul(N,(zRs||0)*G.R))); };
  const mk=(id,nm,R,col,rRs,P,ph,zRs,info,o)=>{ const b=planetBody(id,nm,R,col,id,Object.assign({cat:'inter',alb:.35,info,lightFrom:'garg'},o||{})); b.getPos=orb(rRs,P,ph,zRs); b.mesh.layers.set(2); return b; };
  const mi=mk('miller','Planeta de Miller',9600,'#5a7480',4.3,1.6,0.6,0.3,'Un mundo cubierto por un mar poco profundo, en órbita muy cerca de Gargantúa. La gravedad del agujero negro levanta olas de marea de más de un kilómetro. Por la enorme dilatación del tiempo, cada hora aquí equivale a 7 años en la Tierra: el equipo de la Endurance pierde 23 años en una sola visita. (En un agujero negro sin giro como el que se dibuja aquí, una órbita estable no permitiría tanta dilatación; la película usa uno que gira casi al máximo.)',
    {dilF:61320,landMsg:'Aterrizaste en el planeta de Miller. Mira el reloj: cada segundo tuyo son casi 17 horas en la Tierra. El tiempo corre a 1 minuto por segundo; mira hacia Gargantúa y espera la ola…'});
  atmo(mi,[0.55,0.65,0.75],0.6,1.02); mi.atmo.layers.set(2);
  const ma=mk('mann','Planeta de Mann',6100,'#c8d4e2',85,95,2.2,0,'Un mundo helado con nubes congeladas y aire con amoníaco. El doctor Mann envió datos falsos para que lo rescataran. Está lejos de Gargantúa: aquí la dilatación del tiempo casi no se nota.',{landMsg:'Planeta de Mann: hielo y nubes congeladas. Aquí el tiempo corre casi igual que en la Tierra.'});
  atmo(ma,[0.7,0.8,1.0],0.5,1.02); ma.atmo.layers.set(2);
  const ed=mk('edmunds','Planeta de Edmunds',7000,'#c58a55',210,520,4.1,0,'Un planeta desértico, rocoso y con aire respirable: el destino final de Brand y la esperanza de la humanidad (el «plan B»). Está lejos del agujero negro, así que su tiempo corre casi como el de la Tierra.',{landMsg:'Planeta de Edmunds: desierto rocoso con aire respirable. Aquí Brand empieza la nueva colonia.'});
  atmo(ed,[1.0,0.7,0.45],0.55,1.02); ed.atmo.layers.set(2);
  const off=[0.31,0.73,0.61]; // salida del agujero de gusano en el sistema de Gargantúa
  makeWH({id:'whg',name:'Agujero de gusano (lado de Gargantúa)',cat:'inter',R:1,dest:'whs',look:'garg',kindV:1,getPos:()=>add(G.cur,mul(norm(add(mul(U,1),mul(N,0.15))),330*G.R)),
    info:'La salida del agujero de gusano en el sistema de Gargantúa. Atravesarlo te devuelve junto a Saturno.',arrive:'Saliste al otro lado: el sistema de Gargantúa, en otra galaxia. Elige Miller, Mann o Edmunds en el menú «Interstellar» para aterrizar.'});
  makeWH({id:'whs',name:'Agujero de gusano junto a Saturno',cat:'inter',R:1,dest:'whg',look:'saturn',kindV:0,getPos:()=>add(byId.saturn.cur,mul(off,2.6e6)),
    info:'En Interstellar, una esfera de unos 2 km de diámetro aparece cerca de Saturno: un atajo por una dimensión extra hasta otra galaxia. Por eso se ve como una bola de cristal que muestra un cielo lejano. Los agujeros de gusano son soluciones de la relatividad general, pero nunca se han observado.',arrive:'De vuelta en el sistema solar, junto a Saturno.'});
}
function traverseWH(b,then){ const D=byId[b.dest]; if(!D) return; stopGrand(); if(surf) setMode('orbit'); flight=null; cruise=null; gravityOn=false; vel=[0,0,0];
  const ov=document.createElement('div'); ov.className='cz-wh'; $('#cz').appendChild(ov); setTimeout(()=>ov.remove(),4300);
  toast('Entras en la esfera: el espacio se dobla a tu alrededor…',3200);
  setTimeout(()=>{ updatePositions(simJD); const G=byId[D.look]||D; const away=norm(sub(D.cur,G.cur)); cam=add(D.cur,mul(away,D.R*9)); target=G; select(G); orbitOff=sub(cam,G.cur); mode='orbit'; lookAt(G.cur);
    navHist.push(b.id); calcW(); if(then&&then!==D&&then!==G){ select(then); goTo(then,{noWH:true,nohist:true}); toast((D.id==='whg'?'Cruzaste el agujero de gusano hacia el sistema de Gargantúa. ':'Cruzaste el agujero de gusano de regreso. ')+'Rumbo a '+then.name+'.',7000); } else toast(D.arrive,9000); },1700); }
let interW=false;
function calcW(){ const G=byId.garg; interW=!!G&&len(sub(cam,G.cur))<6000*AU; }
function hideW(b){ if(!byId.garg) return false; if(b.cat==='inter'&&b.id!=='whs') return !interW; return interW&&b.cat!=='bg'&&b.kind!=='cmb'&&b.kind!=='gal'&&len(b.cur)<2e4*AU; }
function makeSN(a){
  const [id,name,ra,dec,dpc,tE,type,M,Aobs,v,rem,info]=a;
  const pos=radec(ra,dec,dpc*PC);
  const tEy=tE?jdToYear(calToJD(tE[0],tE[1],tE[2])):null;
  const b={id,name,kind:'sn',cat:tE==null?'fsn':'sn',menu:true,pos,dpc,tEarth:tEy,type,Mpk:M,Aobs,vexp:v,rem,info,fixed:pos,getPos:()=>pos,R:1e6};
  const g=new THREE.Group();
  // progenitora
  const prog=type==='CC'?starMesh(3500,true):starMesh(20000,false);
  b.progR=type==='CC'?(id==='fbet'?764:id==='fant'?680:id==='feta'?240:id==='frho'?636:500)*RS:6000; g.add(prog); b.prog=prog;
  // remanente
  const N=type==='CC'?22000:16000; const P=new Float32Array(N*3), C=new Float32Array(N*3);
  for(let i=0;i<N;i++){ let x,y,z; do{x=Math.random()*2-1;y=Math.random()*2-1;z=Math.random()*2-1}while(x*x+y*y+z*z>1);
    const l=Math.hypot(x,y,z)||1; let r,c;
    if(type==='CC'){ const fil=Math.random()<.6; r=fil?0.62+0.38*Math.pow(Math.random(),.4):Math.pow(Math.random(),.5)*0.8; const sq=[1.0,0.72,0.8];
      x=x/l*r*sq[0];y=y/l*r*sq[1];z=z/l*r*sq[2]; const n=fbm(x*3+1,y*3,z*3,4,7); if(fil&&Math.abs(n-.5)>.06){i--;continue;}
      c=fil?(Math.random()<.5?[1.0,0.45,0.25]:[0.55,0.95,0.45]):[0.45,0.6,1.0]; }
    else { const ux=x/l,uy=y/l,uz=z/l; const n=fbm(ux*3+5,uy*3,uz*3,4,9); const fil=Math.abs(n-.5)<.045; if(!fil&&Math.random()<.7){i--;continue;} r=(fil?0.93:0.8+0.2*Math.random())*(0.95+0.1*n); x=ux*r;y=uy*r;z=uz*r; c=fil?(Math.random()<.6?[1.0,0.42,0.32]:[1.0,0.75,0.55]):[0.45,0.62,1.0]; }
    P.set([x,y,z],i*3); C.set(c,i*3); }
  const ng=new THREE.BufferGeometry(); ng.setAttribute('position',new THREE.BufferAttribute(P,3)); ng.setAttribute('aC',new THREE.BufferAttribute(C,3));
  const nm=smat({vertexShader:nebVS,fragmentShader:nebFS,uniforms:{uSize:{value:1},uPx:{value:1},uDpr:{value:1},uA:{value:0.6}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  const neb=new THREE.Points(ng,nm); neb.frustumCulled=false; g.add(neb); b.neb=neb; b.nm=nm;
  const fire=new THREE.Mesh(sphereGeo,smat({vertexShader:starVS,fragmentShader:fireFS,uniforms:{uCol:{value:new THREE.Vector3(1,1,1)},uTime:{value:0},uI:{value:1}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false})); fire.visible=false; g.add(fire); b.fire=fire;
  const vol=makeVol(STYLE[id]!=null?STYLE[id]:(type==='CC'?0:2)); if(vol){ g.add(vol); b.vol=vol; vol.visible=false; }
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:type==='CC'?0x7fa8ff:0xff7a6a,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:type==='CC'?.55:.22})); g.add(core); b.core=core;
  b.obj=g; b.glow=type==='CC'?[0.75,0.85,1]:[0.85,0.9,1];
  return addBody(b);
}
function snState(b,jd,camPos){
  if(b.tEarth==null) return null;
  const tExp=b.tEarth-b.dpc*3.26156; // año de la explosión (en el lugar)
  const dly=len(sub(camPos,b.pos))/LY; // años de viaje de la luz hasta la cámara
  let age=(jdToYear(jd)-(tExp+dly))*365.25; // días desde que la luz llegó a la cámara
  if(b.cat==='sn') age+=(b.type==='Ia'?18:b.type==='Iax'?15:14)*0.85; // la fecha histórica es el primer avistamiento, cerca del máximo
  return {tExp,age,dly};
}
function snAbsMag(b,age){ if(age<0) return null; const M=b.Mpk; const rise=b.type==='Ia'?18:b.type==='Iax'?15:14;
  if(age<rise) return M+4*Math.pow(1-age/rise,2); const d=age-rise; return d<25?M+0.08*d:M+2+0.016*(d-25); }
function remRadius(b,ageYears){ if(ageYears<=0) return 0; const v=b.vexp*YEAR; if(b.type==='CC') return v*ageYears; const ts=200; return ageYears<ts?v*ageYears:v*ts*Math.pow(ageYears/ts,0.4); }

/* ---------- extinción por polvo (modelo simple de disco) ---------- */
function extinctionModel(a,b){ // a,b en km (marco ecuatorial)
  const ga=eq2gal(a), gb=eq2gal(b); let A=0; const n=8; const L=len(sub(a,b))/PC/1000;
  for(let i=0;i<n;i++){ const t=(i+.5)/n; const z=(ga[2]+(gb[2]-ga[2])*t)/PC+20; A+=Math.exp(-Math.abs(z)/140); }
  return 1.0*L*A/n;
}

/* ================= GALAXIA ================= */
function gaussian(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function buildGalaxy(){
  const GC=[8178,0,-20];
  const stars=[], glow=[], dust=[];
  function diskPoint(arm){ // coordenadas centradas en el CG (pc)
    let R=-2600*Math.log(1-Math.random()*0.995); if(R>16000) R=Math.random()*16000; let th;
    if(arm&&R>2500){ const k=Math.floor(Math.random()*4); th=Math.log(R/2500)/Math.tan(12.5*D2R)+k*Math.PI/2+gaussian()*0.18; }
    else th=Math.random()*Math.PI*2;
    return [R*Math.cos(th),R*Math.sin(th),gaussian()*(arm?140:320)];
  }
  function bulgePoint(){ const bar=27*D2R; let x=gaussian()*1600,y=gaussian()*600,z=gaussian()*450; return [x*Math.cos(bar)-y*Math.sin(bar),x*Math.sin(bar)+y*Math.cos(bar),z]; }
  const toHelio=p=>[-p[0]+GC[0]+0*0, -p[1], p[2]+GC[2]]; // el Sol queda en (-8178,0) visto desde el CG; eje x del Sol al CG
  function col(t){ return t<0.15?[0.65,0.75,1.0]:t<0.5?[1.0,0.97,0.9]:t<0.85?[1.0,0.85,0.65]:[1.0,0.65,0.45]; }
  // estrellas resueltas en toda la galaxia
  for(let i=0;i<70000*Q.count;i++){ const r=Math.random(); const p=r<0.18?bulgePoint():diskPoint(r<0.7); const h=toHelio(p);
    const dS=Math.hypot(h[0],h[1],h[2]); if(dS<1500) continue; const M=(dS<3000?-4:-5)+Math.random()*9*Math.pow(Math.random(),0.5); stars.push(h,M,col(Math.random()*(r<0.18?0.6:1)+(r<0.18?0.4:0))); }
  // vecindario solar (estrellas luminosas, para un cielo rico)
  // (el vecindario solar ahora viene del catálogo real Hipparcos)
  // brillo difuso (bloques de miles de estrellas)
  for(let i=0;i<60000*Q.count;i++){ const r=Math.random(); const isB=r<0.25; const p=isB?bulgePoint():diskPoint(r<0.75); const h=toHelio(p);
    const s=(isB?220:110)+Math.random()*(isB?260:140);
    const c=isB?[1.0,0.82,0.6]:(r<0.75?[0.65,0.72,1.0]:[1.0,0.9,0.78]);
    glow.push(h,isB?0.022:0.045,c,s); }
  // regiones de formación estelar (rosadas) y cúmulos azules en los brazos
  for(let i=0;i<5000;i++){ const p=diskPoint(true); p[2]=gaussian()*50; const h=toHelio(p); if(Math.hypot(h[0],h[1])<300) continue; glow.push(h,Math.random()<.6?0.16:0.12,Math.random()<.6?[1.0,0.42,0.68]:[0.55,0.7,1.0],20+Math.random()*50); }
  for(let i=0;i<9000;i++){ const p=diskPoint(true); p[2]=gaussian()*80; const h=toHelio(p); if(Math.hypot(h[0],h[1],h[2])<2500) continue; stars.push(h,-6+Math.random()*3,[0.62,0.74,1.0]); }
  // polvo
  for(let i=0;i<22000;i++){ let p=diskPoint(true); p[2]=gaussian()*60; const h=toHelio(p); if(Math.hypot(h[0],h[1])<120) continue; dust.push(h,0.45,[0.0,0.0,0.0],60+Math.random()*120); }
  // galaxias vecinas como brillo difuso
  function extGal(ra,dec,dkpc,n,rad,incl,pa,c){ const ctr=eq2gal(radec(ra,dec,dkpc*1000)); const n1=norm([Math.cos(pa),Math.sin(pa),0]); let ax=norm(cross(norm(ctr),[0,0,1])); const ay=cross(norm(ctr),ax);
    const ci=Math.cos(incl),si=Math.sin(incl);
    for(let i=0;i<n;i++){ const R=-rad*0.3*Math.log(1-Math.random()*0.98), th=Math.random()*Math.PI*2; const x=R*Math.cos(th), y=R*Math.sin(th)*ci, z=R*Math.sin(th)*si+gaussian()*rad*0.02;
      const los=norm(ctr); const pnt=[ctr[0]+ax[0]*x+ay[0]*y+los[0]*z,ctr[1]+ax[1]*x+ay[1]*y+los[1]*z,ctr[2]+ax[2]*x+ay[2]*y+los[2]*z];
      glow.push(pnt,0.05,c,rad*0.04+Math.random()*rad*0.05); } }
  if(!isGL2) for(const gx of REAL_GAL) galaxyParticles(glow,dust,stars,Object.assign({pk:0.3},gx));
  function layer(arr,mode,stride){
    const n=arr.length/stride, P=new Float32Array(n*3), M=new Float32Array(n), C=new Float32Array(n*3), S=new Float32Array(n);
    for(let i=0;i<n;i++){ const o=i*stride; P.set(arr[o],i*3); M[i]=arr[o+1]; C.set(arr[o+2],i*3); S[i]=stride>3?arr[o+3]:1; }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('aM',new THREE.BufferAttribute(M,1)); g.setAttribute('aC',new THREE.BufferAttribute(C,3)); g.setAttribute('aS',new THREE.BufferAttribute(S,1));
    const m=smat({vertexShader:skyVS,fragmentShader:skyFS,uniforms:{uCam:{value:new THREE.Vector3()},uG2E:{value:new THREE.Matrix3()},uPx:{value:1},uDpr:{value:1},uMode:{value:mode},uBright:{value:1},uUnit:{value:1},uNoExt:{value:0},uFade:{value:1}},
      transparent:true,depthWrite:false,blending:mode>1.5?THREE.CustomBlending:THREE.AdditiveBlending});
    if(mode>1.5){ m.blendEquation=THREE.AddEquation; m.blendSrc=THREE.ZeroFactor; m.blendDst=THREE.OneMinusSrcAlphaFactor; }
    const pts=new THREE.Points(g,m); pts.frustumCulled=false; pts.renderOrder=mode>1.5?-9:mode>0.5?-10:-8; scene.add(pts); return m;
  }
  const g2e=new THREE.Matrix3().set(AG[0][0],AG[1][0],AG[2][0],AG[0][1],AG[1][1],AG[2][1],AG[0][2],AG[1][2],AG[2][2]);
  skyLayer=layer; G2E=g2e;
  const mats=[layer(glow,1,4),layer(dust,2,4),layer(stars,0,3)];
  mats.forEach(m=>m.uniforms.uG2E.value.copy(g2e));
  return mats;
}

/* ================= EXTENSIONES v3 ================= */
const MPC=1e6*PC;
let skyLayer=null, G2E=null, webMats=[], constel={w:null,c:null,lbl:[]}, messierMat=null, cmb=null, laniakea=null, beltMat=null, kuiperMat=null;
let lightMode='real', expo=1, navHist=[];
let constMode=1, showWeb=true, microwave=false, gravityOn=false, vel=[0,0,0];

/* ---------- cielo real: catálogo Hipparcos (d3-celestial), constelaciones y objetos Messier ---------- */
function bvTemp(bv){ return 4600*(1/(0.92*bv+1.7)+1/(0.92*bv+0.62)); }
function loadSky(){
  fetch('sky.json').then(r=>r.json()).then(D=>{
    const s=D.s, arr=[];
    for(let i=0;i<s.length;i+=5){ const ra=s[i]/100, dec=s[i+1]/100, m=s[i+2]/100, bv=s[i+3]/100, d=s[i+4];
      const p=eq2gal(radec(ra,dec,d)); const M=m-5*Math.log10(d/10); arr.push(p,M,bbColor(Math.max(2500,Math.min(30000,bvTemp(bv))))); }
    const mt=skyLayer(arr,0,3); mt.uniforms.uNoExt.value=1; mt.uniforms.uG2E.value.copy(G2E); skyMats.push(mt);
    // constelaciones
    const mk=(lines,col,op)=>{ const v=[]; for(const L of lines){ for(let j=0;j+3<L.length;j+=2){ const a=radec(L[j],L[j+1],3.5e7), b=radec(L[j+2],L[j+3],3.5e7); v.push(...a,...b); } }
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); const m=new THREE.LineBasicMaterial({color:col,transparent:true,opacity:op,depthWrite:false});
      const o=new THREE.LineSegments(g,m); o.frustumCulled=false; o.renderOrder=-7; scene.add(o); return o; };
    constel.w=mk(D.w,0x6f9fff,.35); constel.c=mk(D.c,0xff8a5c,.45);
    const box=$('#cz-clbl');
    D.wn.forEach(n=>{ const e=document.createElement('div'); e.className='cl w'; e.textContent=n[0]; box.appendChild(e); constel.lbl.push({e,dir:radec(n[1],n[2],1),k:'w'}); });
    D.cn.forEach(n=>{ const e=document.createElement('div'); e.className='cl c'; e.innerHTML=`${n[0]} <small>${n[1]} · ${n[2]}</small>`; box.appendChild(e); constel.lbl.push({e,dir:radec(n[3],n[4],1),k:'c'}); });
    // objetos Messier (nebulosas y cúmulos; las galaxias ya están en 3D)
    const P=[],C=[],S=[];
    const col={en:[1,.45,.6],rn:[.5,.65,1],snr:[1,.6,.45],pn:[.5,1,.85],oc:[.75,.85,1],gc:[1,.92,.75],dn:[.3,.3,.3]};
    for(const o of D.m){ const t=o[2]; if(/g/.test(t)&&t!=='gc') continue; const dim=parseFloat(String(o[4]).split('x')[0])||5; const dir=radec(o[5],o[6],1);
      P.push(dir[0],dir[1],dir[2]); C.push(...(col[t]||[.8,.8,1])); S.push(dim/60*D2R); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('aC',new THREE.Float32BufferAttribute(C,3)); g.setAttribute('aS',new THREE.Float32BufferAttribute(S,1));
    messierMat=smat({vertexShader:`${VLOG}
uniform float uPx; uniform float uDpr; uniform float uFade; attribute vec3 aC; attribute float aS; varying vec3 vC; varying float vA;
void main(){ vC=aC; vec4 mv=viewMatrix*vec4(position*3.6e7,1.0); gl_Position=projectionMatrix*mv; float px=aS*uPx; gl_PointSize=clamp(px,2.0,300.0)*uDpr; vA=uFade*0.28*clamp(9.0/px,0.15,1.0);
#include <logdepthbuf_vertex>
}`,fragmentShader:`${FLOG}
varying vec3 vC; varying float vA;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; float r2=dot(q,q); if(r2>1.0) discard; gl_FragColor=vec4(vC*exp(-r2*3.5)*vA,1.0);}`,
      uniforms:{uPx:{value:1},uDpr:{value:1},uFade:{value:1}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
    const mp=new THREE.Points(g,messierMat); mp.frustumCulled=false; mp.renderOrder=-7; scene.add(mp);
    toast('Cielo real cargado: 25.676 estrellas del catálogo Hipparcos, 88 constelaciones y las 28 mansiones lunares chinas.',5000);
  }).catch(()=>toast('No se pudo cargar el catálogo de estrellas reales.'));
}
function updateConstel(){
  const near=len(cam)/PC; const fade=1-sstep(15,60,near);
  if(constel.w){ constel.w.visible=constMode===1&&fade>0; constel.c.visible=constMode===2&&fade>0; constel.w.material.opacity=.35*fade; constel.c.material.opacity=.5*fade; }
  if(messierMat){ messierMat.uniforms.uFade.value=fade; messierMat.uniforms.uPx.value=uPx; messierMat.uniforms.uDpr.value=renderer.getPixelRatio(); }
  const v=new THREE.Vector3();
  for(const L of constel.lbl){ const on=fade>0&&((constMode===1&&L.k==='w')||(constMode===2&&L.k==='c'))&&showLabels>0; if(!on){ L.e.hidden=true; continue; }
    v.set(L.dir[0]*3.5e7,L.dir[1]*3.5e7,L.dir[2]*3.5e7).project(camera); if(v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1){ L.e.hidden=true; continue; }
    L.e.hidden=false; L.e.style.opacity=fade; L.e.style.transform=`translate(${(v.x+1)/2*W}px,${(1-v.y)/2*H}px)`; }
}

/* ---------- cometas y asteroides ---------- */
function orbitPos(o,jd){ // elementos: a(UA), e, i, Ω, ω, tp (JD) — o M0 en época
  const n=2*Math.PI/(365.25*Math.pow(o.a,1.5)); let M=o.tp!=null?n*(jd-o.tp):(o.M0*D2R+n*(jd-o.ep));
  M=((M%(2*Math.PI))+3*Math.PI)%(2*Math.PI)-Math.PI; const e=o.e; let E=e>0.8?Math.PI*Math.sign(M)*.5+M*.5:M; for(let k=0;k<40;k++){ const dE=(E-e*Math.sin(E)-M)/(1-e*Math.cos(E)); E-=dE; if(Math.abs(dE)<1e-12) break; }
  const xp=o.a*(Math.cos(E)-e), yp=o.a*Math.sqrt(1-e*e)*Math.sin(E); const w=o.w*D2R,Om=o.O*D2R,I=o.i*D2R;
  const cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(Om),sO=Math.sin(Om),cI=Math.cos(I),sI=Math.sin(I);
  return ecl2eq([((cw*cO-sw*sO*cI)*xp+(-sw*cO-cw*sO*cI)*yp)*AU,((cw*sO+sw*cO*cI)*xp+(-sw*sO+cw*cO*cI)*yp)*AU,((sw*sI)*xp+(cw*sI)*yp)*AU]);
}
const tailVS=`${VLOG}
uniform vec3 uAnti; uniform vec3 uLag; uniform float uL; uniform float uPx; uniform float uDpr; uniform float uSize;
attribute vec4 aT; varying float vA; varying float vIon;
void main(){ float s=aT.x; vIon=aT.w; vec3 side=normalize(cross(uAnti,uLag+vec3(1e-4)));
 vec3 p = vIon>0.5 ? uAnti*s*uL*1.25 + side*aT.y*uL*0.02*s + cross(uAnti,side)*aT.z*uL*0.02*s
                   : uAnti*s*uL + uLag*s*s*uL*0.35 + side*aT.y*uL*0.10*s + cross(uAnti,side)*aT.z*uL*0.06*s;
 vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(uSize*uL*(0.008+0.025*s)/max(-mv.z,1e-6)*uPx,1.0,22.0)*uDpr; vA=(1.0-s)*(vIon>0.5?0.32:0.2);
#include <logdepthbuf_vertex>
}`;
const tailFS=`${FLOG}
uniform float uA; varying float vA; varying float vIon;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; float r2=dot(q,q); if(r2>1.0) discard; vec3 c=vIon>0.5?vec3(0.45,0.7,1.0):vec3(1.0,0.92,0.75); gl_FragColor=vec4(c*exp(-r2*3.0)*vA*uA,1.0);}`;
function makeComet(o){
  const b=Object.assign({kind:'comet',cat:'comets',menu:true,R:o.Rn||5},o); b.getPos=jd=>orbitPos(o,jd);
  const g=new THREE.Group();
  const nm=smat({vertexShader:planetVS,fragmentShader:planetFS,uniforms:{uMap:{value:null},uAux:{value:null},uCloud:{value:null},uHasMap:{value:0},uHasAux:{value:0},uHasCloud:{value:0},uSpec:{value:0},uTime:{value:0},uDet:{value:6},uDetA:{value:0.5},uAtmK:{value:0},uAmb:{value:0.02},uCol:{value:new THREE.Vector3(.25,.22,.2)},uSun:{value:new THREE.Vector3(1,0,0)},uAtm:{value:new THREE.Vector3()}}});
  const nuc=new THREE.Mesh(sphereGeo,nm); nuc.scale.set(1.4,1,.9); b.mesh=nuc;
  const N=7000, T=new Float32Array(N*4); for(let i=0;i<N;i++){ const ion=i<N*.35?1:0; T.set([Math.pow(Math.random(),ion?.8:.6),gaussian(),gaussian(),ion],i*4); }
  const tg=new THREE.BufferGeometry(); tg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3)); tg.setAttribute('aT',new THREE.BufferAttribute(T,4));
  const tm=smat({vertexShader:tailVS,fragmentShader:tailFS,uniforms:{uAnti:{value:new THREE.Vector3(1,0,0)},uLag:{value:new THREE.Vector3(0,1,0)},uL:{value:1},uPx:{value:1},uDpr:{value:1},uSize:{value:1},uA:{value:1}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  const tail=new THREE.Points(tg,tm); tail.frustumCulled=false; b.tail=tail; b.tm=tm;
  const coma=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xbfe0ff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); b.coma=coma;
  b.obj=g; g.add(nuc); scene.add(tail); scene.add(coma);
  b.glow=[0.75,0.85,1]; b.view=3e6;
  addBody(b);
  // órbita
  const og=new THREE.BufferGeometry(); og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(361*3),3));
  const ol=new THREE.Line(og,new THREE.LineBasicMaterial({color:0x8fd0ff,transparent:true,opacity:.25,depthWrite:false})); ol.frustumCulled=false; scene.add(ol);
  orbitLines.push({b,line:ol,pts:null,jd:-1e9,el2:o});
  return b;
}
function updateComet(b,p,k,dtR){
  const sunv=sub(byId.sun.cur,b.cur), rs=len(sunv)/AU, anti=norm(mul(sunv,-1));
  const v=sub(orbitPos(b,simJD+0.5),b.cur), lag=norm(sub(mul(norm(v),-1),mul(anti,dot(norm(v),anti)*-1)));
  const act=Math.max(0,Math.min(1,(5-rs)/3)); const L=(b.tailK||4e7)*Math.pow(Math.max(rs,.3),-1.5)*act;
  b.obj.scale.setScalar(b.R*k); b.obj.visible=b.R/b.dist*uPx>0.3;
  b.tail.position.copy(p); b.tail.scale.setScalar(k); b.tail.visible=L>1e5;
  const U=b.tm.uniforms; U.uAnti.value.set(...anti); U.uLag.value.set(...lag); U.uL.value=L; U.uPx.value=uPx; U.uDpr.value=renderer.getPixelRatio(); U.uSize.value=1; U.uA.value=act;
  const comaR=Math.max(b.R*30,L*0.015); const cpx=comaR/b.dist*uPx; b.coma.position.copy(p); b.coma.scale.setScalar(comaR*k*2.5); b.coma.visible=act>0.02&&cpx>0.5; b.coma.material.opacity=act*.45;
  const sd=norm(sunv); b.mesh.material.uniforms.uSun.value.copy(new THREE.Vector3(...sd).transformDirection(camera.matrixWorldInverse));
  const m=(b.H||5.5)+5*Math.log10(Math.max(b.dist/AU,1e-9))+2.5*(b.nAct||4)*Math.log10(Math.max(rs,.1)); b.appMag=m; sprite(b,p,k,m,0); b.vis=visTxt(m)+(act>0.05?` · cola de ≈ ${fmtDist(L)}`:' · sin cola (lejos del Sol)');
}
function makeBelt(n,amin,amax,col,ecc,inc,gaps){
  const P=new Float32Array(n*3), A=new Float32Array(n*4);
  for(let i=0;i<n;i++){ let a; do{ a=amin+(amax-amin)*Math.random(); }while(gaps&&gaps.some(g=>Math.abs(a-g[0])<g[1]));
    A.set([a,(Math.random()*2-1)*inc*D2R,Math.random()*Math.PI*2,Math.random()*Math.PI*2],i*4); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('aO',new THREE.BufferAttribute(A,4));
  const m=smat({vertexShader:`${VLOG}
uniform vec3 uCam; uniform float uT; uniform float uPx; uniform float uDpr; uniform float uEps;
attribute vec4 aO; varying float vA;
void main(){ float a=aO.x; float n=6.283185/(365.25*pow(a,1.5)); float L=aO.w+n*uT; float om=aO.z;
 vec3 pe=vec3(cos(L),sin(L),0.0)*a; float ci=cos(aO.y), si=sin(aO.y); pe=vec3(pe.x, pe.y*ci, pe.y*si);
 pe=vec3(pe.x*cos(om)-pe.y*sin(om), pe.x*sin(om)+pe.y*cos(om), pe.z);
 vec3 eq=vec3(pe.x, pe.y*cos(uEps)-pe.z*sin(uEps), pe.y*sin(uEps)+pe.z*cos(uEps));
 vec3 rel=(eq-uCam)*1.495978707e8; float r=length(rel); float k= r<1.0e6?1.0:1.0e6*(1.0+log(r/1.0e6))/r;
 vec4 mv=viewMatrix*vec4(rel*k,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(2.0e5/r*uPx,1.0,3.0)*uDpr; vA=clamp(3.0e7/r,0.06,0.7);
#include <logdepthbuf_vertex>
}`,fragmentShader:`${FLOG}
uniform vec3 uCol; varying float vA;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; if(dot(q,q)>1.0) discard; gl_FragColor=vec4(uCol*vA,1.0);}`,
    uniforms:{uCam:{value:new THREE.Vector3()},uT:{value:0},uPx:{value:1},uDpr:{value:1},uEps:{value:EPS},uCol:{value:new THREE.Vector3(...col)}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  const pts=new THREE.Points(g,m); pts.frustumCulled=false; pts.renderOrder=3; scene.add(pts); m.pts=pts; return m;
}

/* ---------- galaxias reales, red cósmica, Laniakea, grandes murallas y CMB ---------- */
function galBasisEq(o){ const ctr=eq2gal(radec(o.ra,o.dec,o.dist)); const los=norm(ctr); const ex=norm(cross(los,[0,0,1])), ey=cross(ex,los);
  const pa=(o.pa||0)*D2R, inc=(o.incl==null?50:o.incl)*D2R; const c=Math.cos(pa), s=Math.sin(pa);
  const ax=add(mul(ex,c),mul(ey,s)), ay0=add(mul(ex,-s),mul(ey,c)); const ay=add(mul(ay0,Math.cos(inc)),mul(los,Math.sin(inc))), az=cross(ax,ay);
  return {ax:norm(gal2eq(ax)),ay:norm(gal2eq(ay)),az:norm(gal2eq(az))}; }
function galaxyParticles(glow,dust,stars,o){
  // o: ra,dec,dist(pc),R(pc),type:'S','SB','E','S0','Irr',incl,pa,n,col
  const ctr=eq2gal(radec(o.ra,o.dec,o.dist)); const los=norm(ctr); const ex=norm(cross(los,[0,0,1])), ey=cross(ex,los);
  const pa=(o.pa||0)*D2R, inc=(o.incl==null?50:o.incl)*D2R; const c=Math.cos(pa), s=Math.sin(pa);
  const ax=add(mul(ex,c),mul(ey,s)), ay0=add(mul(ex,-s),mul(ey,c)); const ay=add(mul(ay0,Math.cos(inc)),mul(los,Math.sin(inc))), az=cross(ax,ay);
  const put=(x,y,z)=>[ctr[0]+ax[0]*x+ay[0]*y+az[0]*z,ctr[1]+ax[1]*x+ay[1]*y+az[1]*z,ctr[2]+ax[2]*x+ay[2]*y+az[2]*z];
  const R=o.R, n=o.n||6000, T=o.type;
  for(let i=0;i<n;i++){
    let x,y,z,col,size,a=0.05;
    const u=Math.random();
    if(T==='E'){ const r=R*Math.pow(Math.random(),2.2)*1.2; const th=Math.acos(2*Math.random()-1), ph=Math.random()*Math.PI*2; x=r*Math.sin(th)*Math.cos(ph); y=r*Math.sin(th)*Math.sin(ph)*(o.flat||.8); z=r*Math.cos(th)*(o.flat||.8); col=[1,.86,.68]; size=R*.05+Math.random()*R*.05; a=.055; }
    else if(T==='Irr'){ const cl=Math.floor(Math.random()*7); const cx=Math.sin(cl*2.1)*R*.5, cy=Math.cos(cl*3.3)*R*.35; x=cx+gaussian()*R*.25; y=cy+gaussian()*R*.2; z=gaussian()*R*.08; col=u<.3?[1,.5,.75]:[.75,.82,1]; size=R*.04+Math.random()*R*.05; a=.06; }
    else if(u<(T==='S0'?.55:.22)){ const r=Math.abs(gaussian())*R*(T==='S0'?.28:.15); const th=Math.random()*Math.PI*2; x=r*Math.cos(th)*(T==='SB'?1.6:1); y=r*Math.sin(th)*(T==='SB'?.45:1); z=gaussian()*R*(T==='S0'?.12:.06); col=[1,.85,.62]; size=R*.04+Math.random()*R*.04; a=.06; }
    else { let r=-R*.32*Math.log(1-Math.random()*.97); let th;
      if(T==='S0'){ th=Math.random()*Math.PI*2; } else { const arms=T==='SB'?2:(o.arms||2); const k=Math.floor(Math.random()*arms); const r0=T==='SB'?R*.25:R*.08; th=Math.log(Math.max(r,r0)/r0)/Math.tan((o.pitch||14)*D2R)+k*2*Math.PI/arms+gaussian()*(.22+.15*Math.random()); if(T==='SB'&&r<R*.25){ th=(Math.random()<.5?0:Math.PI)+gaussian()*.12; } }
      x=r*Math.cos(th); y=r*Math.sin(th); z=gaussian()*R*.015; const hii=Math.random()<.12&&T!=='S0';
      col=hii?[1,.42,.66]:(Math.random()<.6?[.62,.74,1]:[1,.93,.82]); size=hii?R*.01+Math.random()*R*.015:R*.025+Math.random()*R*.04; a=hii?.14:.05;
      if(dust&&Math.random()<.18&&T!=='E') dust.push(put(x*.97,y*.97,z*.5),.5,[0,0,0],R*.02+Math.random()*R*.03); }
    glow.push(put(x,y,z),a*(o.pk||1),col,size);
    if(stars&&Math.random()<.15) stars.push(put(x,y,z),-7+Math.random()*2,col);
  }
  if(o.ring){ for(let i=0;i<n*.15;i++){ const th=Math.random()*Math.PI*2, r=R*(.75+.08*gaussian()); dust.push(put(r*Math.cos(th),r*Math.sin(th),gaussian()*R*.01),.6,[0,0,0],R*.03); } }
}
const REAL_GAL=[
 {id:'m31',ra:10.6847,dec:41.2690,dist:765000,R:22000,type:'S',incl:77,pa:38,n:16000,pitch:9},
 {id:'m33',ra:23.4621,dec:30.6599,dist:860000,R:9000,type:'S',incl:55,pa:23,n:7000,pitch:20,arms:2,name:'Galaxia del Triángulo (M33)',info:'Tercera galaxia más grande del Grupo Local, a unos 2,7 millones de años luz.'},
 {id:'lmc',ra:80.894,dec:-69.756,dist:50000,R:4500,type:'SB',incl:35,pa:170,n:7000},
 {id:'smc',ra:13.187,dec:-72.829,dist:62000,R:2500,type:'Irr',incl:60,pa:45,n:3000,name:'Pequeña Nube de Magallanes',info:'Galaxia enana satélite de la Vía Láctea, visible a simple vista desde el hemisferio sur.'},
 {id:'m81',ra:148.888,dec:69.065,dist:3.6e6,R:14000,type:'S',incl:58,pa:157,n:7000,pitch:13,name:'Galaxia de Bode (M81)',info:'Espiral «de libro» a 12 millones de años luz.'},
 {id:'m82',ra:148.970,dec:69.680,dist:3.6e6,R:6000,type:'Irr',incl:80,pa:65,n:3500,name:'Galaxia del Cigarro (M82)',info:'Galaxia con brote estelar: forma estrellas 10 veces más rápido que la Vía Láctea.'},
 {id:'m51',ra:202.470,dec:47.195,dist:8.6e6,R:12000,type:'S',incl:22,pa:163,n:8000,pitch:18,name:'Galaxia del Remolino (M51)',info:'Espiral clásica interactuando con su compañera NGC 5195.'},
 {id:'m101',ra:210.802,dec:54.349,dist:6.4e6,R:26000,type:'S',incl:18,pa:39,n:8000,pitch:22,arms:4,name:'Galaxia del Molinete (M101)',info:'Gran espiral vista de frente, casi el doble de la Vía Láctea.'},
 {id:'m104',ra:189.998,dec:-11.623,dist:9.55e6,R:15000,type:'S0',incl:84,pa:90,n:9000,ring:true,name:'Galaxia del Sombrero (M104)',info:'Gran bulbo brillante y un anillo de polvo visto casi de canto.'},
 {id:'m87g',ra:187.706,dec:12.391,dist:16.8e6,R:30000,type:'E',flat:.9,n:9000,name:'Galaxia M87',info:'Galaxia elíptica gigante en el corazón del cúmulo de Virgo; en su centro vive M87*.'},
 {id:'cena',ra:201.365,dec:-43.019,dist:3.8e6,R:15000,type:'E',flat:.75,n:7000,ring:true,name:'Centaurus A',info:'Galaxia elíptica con una banda de polvo, resultado de una colisión de galaxias.'},
 {id:'n1300',ra:49.921,dec:-19.411,dist:18.7e6,R:18000,type:'SB',incl:35,pa:106,n:7000,pitch:16,name:'NGC 1300',info:'Galaxia espiral barrada: una barra central de la que nacen dos brazos.'},
 {id:'n253',ra:11.888,dec:-25.288,dist:3.5e6,R:13000,type:'S',incl:78,pa:52,n:6000,name:'Galaxia del Escultor (NGC 253)',info:'Espiral polvorienta con brote estelar, vista casi de canto.'},
 {id:'m83',ra:204.254,dec:-29.866,dist:4.6e6,R:8000,type:'SB',incl:25,pa:44,n:5000,name:'Galaxia del Molinillo Austral (M83)',info:'Espiral barrada con mucha formación de estrellas.'}
];
/* ---------- macroestructura v4: galaxias individuales, cúmulos reales, Shapley en rayos X, Laniakea con flujos ---------- */
const galVS=`${VLOG}
uniform vec3 uCam; uniform mat3 uG2E; uniform float uPx; uniform float uDpr; uniform float uFade;
attribute vec3 aC; attribute float aS; attribute vec4 aP; varying vec3 vC; varying vec4 vP; varying float vA;
void main(){ vec3 rel=position-uCam; float d=max(length(rel),1e-6); vec3 dir=uG2E*(rel/d);
 vec4 mv=viewMatrix*vec4(dir*5.0e7,1.0); gl_Position=projectionMatrix*mv;
 float px=aS/d*uPx; float sz=max(px,1.6); gl_PointSize=min(sz,320.0)*uDpr;
 vA=aP.w*uFade*min(1.0,px*px/2.5+0.04)*smoothstep(0.15,1.2,d/aS); if(px>320.0) vA*=320.0/px;
 vC=aC; vP=aP; if(vA<0.004) gl_PointSize=0.0;
#include <logdepthbuf_vertex>
}`;
const galFS=`${FLOG}
varying vec3 vC; varying vec4 vP; varying float vA;
void main(){
#include <logdepthbuf_fragment>
 vec2 q=gl_PointCoord*2.0-1.0; float ca=cos(vP.y), sa=sin(vP.y); vec2 r2=vec2(ca*q.x-sa*q.y, sa*q.x+ca*q.y);
 float ax=max(vP.z,0.12); vec2 e=vec2(r2.x, r2.y/ax); float r=length(e); if(r>1.0) discard;
 vec3 col; float I;
 if(vP.x<0.5){ I=exp(-r*7.0)*1.6+exp(-r*2.6)*0.45; I*=1.0-smoothstep(0.75,1.0,r); col=vC; }
 else { float th=atan(e.y,e.x); float arms=0.55+0.45*sin(2.0*th-9.0*log(r+0.06));
   float disk=exp(-r*3.4)*(0.35+0.65*arms*smoothstep(0.04,0.25,r)); float bul=exp(-r*16.0)*1.8;
   I=(disk+bul)*(1.0-smoothstep(0.8,1.0,r));
   col=mix(vec3(1.0,0.86,0.62),vC,smoothstep(0.05,0.35,r));
   if(ax<0.38){ float lane=exp(-pow(r2.y/(0.035*ax/0.2+0.01),2.0))*smoothstep(0.08,0.3,abs(r2.x)); I*=1.0-0.75*lane; } }
 gl_FragColor=vec4(col*I*vA*0.6,1.0);
}`;
let galMats=[], gcMats=[];
function galLayer(arr,fadeK){ // arr: [pos(Mpc gal), col, size(Mpc), type, angle, axis, bright]
  const n=arr.length/7, P=new Float32Array(n*3), C=new Float32Array(n*3), S=new Float32Array(n), A=new Float32Array(n*4);
  for(let i=0;i<n;i++){ const o=i*7; P.set(arr[o],i*3); C.set(arr[o+1],i*3); S[i]=arr[o+2]; A.set([arr[o+3],arr[o+4],arr[o+5],arr[o+6]],i*4); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('aC',new THREE.BufferAttribute(C,3)); g.setAttribute('aS',new THREE.BufferAttribute(S,1)); g.setAttribute('aP',new THREE.BufferAttribute(A,4));
  const m=smat({vertexShader:galVS,fragmentShader:galFS,uniforms:{uCam:{value:new THREE.Vector3()},uG2E:{value:G2E},uPx:{value:1},uDpr:{value:1},uFade:{value:1}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  const pts=new THREE.Points(g,m); pts.frustumCulled=false; pts.renderOrder=-9; scene.add(pts); m.fadeK=fadeK||[0.3,2.5]; galMats.push(m); return m;
}
function pushGal(arr,p,early,bright,sizeK){
  const E=Math.random()<early; const big=Math.random()<0.04;
  const sz=(E?(0.012+Math.random()*0.05):(0.015+Math.random()*0.035))*(big?2.2:1)*(sizeK||1);
  const col=E?[1.0,0.83+Math.random()*.06,0.6+Math.random()*.08]:(Math.random()<.6?[0.66,0.76,1.0]:[0.95,0.92,0.88]);
  const axis=E?(0.55+Math.random()*0.45):Math.max(0.12,Math.abs(Math.cos(Math.random()*Math.PI/2))*0.95);
  arr.push(p,col,sz,E?0:1,Math.random()*Math.PI,axis,(bright||1)*(0.55+Math.random()*0.6));
}
function clusterGalaxies(arr,glow,c,N,rc,rmax,hot){
  // cD central gigante
  arr.push(c,[1.0,0.85,0.66],0.22*(N>500?1:0.7),0,Math.random()*Math.PI,0.75,1.4);
  for(let i=0;i<N;i++){ const u=Math.random()*0.985; let r=rc*Math.sqrt(u/(1-u)); if(r>rmax) r=rmax*Math.random();
    const th=Math.acos(2*Math.random()-1), ph=Math.random()*Math.PI*2; const p=add(c,[r*Math.sin(th)*Math.cos(ph),r*Math.sin(th)*Math.sin(ph)*0.8,r*Math.cos(th)*0.9]);
    pushGal(arr,p,0.85-0.6*Math.min(1,r/rmax),1,1); }
  // luz intracúmulo
  for(let k=0;k<18;k++) glow.push(add(c,[gaussian()*rc*1.5,gaussian()*rc*1.5,gaussian()*rc*1.5]),.006,[1,.86,.7],rc*4+Math.random()*rc*3);
  if(hot){ for(let k=0;k<26;k++) glow.push(add(c,[gaussian()*rc*1.1,gaussian()*rc*1.1,gaussian()*rc*1.1]),.045*hot,[1,.3,.45],rc*2.5+Math.random()*rc*1.5);
    for(let k=0;k<30;k++) glow.push(add(c,[gaussian()*rc*4,gaussian()*rc*4,gaussian()*rc*3]),.01*hot,[.25,.8,.85],rc*10+Math.random()*rc*6); }
}
const zMpc=z=>z*4283;
function buildWeb(){
  const real=[['Cúmulo de Virgo',187.7,12.4,16.5,9,'Unas 1.300–2.000 galaxias a 54 millones de años luz, el corazón de nuestro Supercúmulo Local. En su centro está la elíptica gigante M87.'],
   ['Cúmulo de Fornax',54.6,-35.45,19,4,'Cúmulo compacto del cielo austral, dominado por la galaxia elíptica NGC 1399.'],
   ['Cúmulo de Centauro',192.2,-41.3,52,6,'Cúmulo rico en galaxias dentro de Laniakea, cerca del Gran Atractor.'],
   ['Cúmulo de Hidra',159.2,-27.5,54,5,'Uno de los cúmulos más grandes cerca de la Vía Láctea; su gas caliente brilla en rayos X.'],
   ['Gran Atractor (Norma)',243.6,-60.9,67,9,'Anomalía gravitatoria hacia la que caen la Vía Láctea y miles de galaxias a unos 600 km/s. Está detrás del disco de nuestra galaxia, oculto por el polvo.'],
   ['Cúmulo de Coma',194.95,27.98,100,10,'Más de 1.000 galaxias, casi todas elípticas. Aquí Fritz Zwicky propuso en 1933 la existencia de la materia oscura.'],
   ['Cúmulo de Perseo',49.95,41.51,73,7,'El cúmulo más brillante del cielo en rayos X. Su agujero negro central emite una «nota» sonora 57 octavas por debajo del do central.'],
   ['Cúmulo de Hércules (Abell 2151)',241.3,17.7,150,6,'Cúmulo joven y desordenado, lleno de galaxias espirales que aún se están fusionando.']];
  const realN=real.map(r=>({p:eq2gal(radec(r[1],r[2],r[3])),w:r[4],name:r[0],info:r[5]}));
  const glow=[], gals=[], field=[];
  for(const nd of realN) clusterGalaxies(gals,glow,nd.p,nd.w*80,0.22,2.6,nd.name.includes('Perseo')||nd.name.includes('Coma')||nd.name.includes('Hidra')?0.6:0);
  // Supercúmulo de Shapley: cúmulos de Abell reales, gas caliente en rayos X (rosa) y efecto Sunyaev-Zel'dovich (cian)
  const sh=[['A3558',201.99,-31.50,.048,1.4],['A3562',203.40,-31.67,.049,.9],['A3556',201.03,-31.67,.048,.8],['A3560',203.10,-33.10,.049,.6],['A3528',191.83,-29.01,.054,.9],['A3530',193.90,-30.35,.054,.6],['A3532',194.34,-30.37,.055,.7],['A3571',206.87,-32.87,.039,.9],['A3559',202.46,-29.51,.047,.5]];
  const shN=sh.map(c=>({p:eq2gal(radec(c[1],c[2],zMpc(c[3]))),w:c[4],name:c[0]}));
  for(const c of shN) clusterGalaxies(gals,glow,c.p,Math.round(c.w*420),0.25,3,1.2*c.w);
  for(let i=0;i<shN.length-1;i++){ const A=shN[i].p,B=shN[i+1].p; for(let k=0;k<80;k++){ const t=Math.random(); glow.push(add(add(mul(A,1-t),mul(B,t)),[gaussian()*2,gaussian()*2,gaussian()*2]),.005,[.25,.8,.85],5+Math.random()*4); pushGal(field,add(add(mul(A,1-t),mul(B,t)),[gaussian()*3,gaussian()*3,gaussian()*3]),.5,.8); } }
  realN.push({p:mul(add(shN[0].p,shN[1].p),.5),w:14,name:'Supercúmulo de Shapley',info:'La mayor concentración de galaxias del universo cercano: más de 8.000 galaxias en 25 cúmulos a unos 650 millones de años luz. El rosa muestra el gas a decenas de millones de grados que brilla en rayos X; el cian, el gas detectado por cómo deforma el fondo de microondas (efecto Sunyaev-Zel’dovich).',view:20});
  function region(nodes,maxL,step,thick,blob,alpha,col,galN){
    for(const nd of nodes){ if(!nd.name) for(let k=0;k<nd.w*6;k++) glow.push(add(nd.p,[gaussian()*thick,gaussian()*thick,gaussian()*thick]),alpha*1.6,[1,.86,.72],blob*(.8+Math.random())); if(galN) for(let k=0;k<nd.w*galN;k++) pushGal(field,add(nd.p,[gaussian()*thick*.7,gaussian()*thick*.7,gaussian()*thick*.7]),.7,.9); }
    for(let i=0;i<nodes.length;i++){ const A=nodes[i].p; const d=[]; for(let j=0;j<nodes.length;j++){ if(j===i) continue; const L=len(sub(nodes[j].p,A)); if(L<maxL) d.push([j,L]); } d.sort((x,y)=>x[1]-y[1]);
      for(const [j,L] of d.slice(0,3)){ if(j<i) continue; const B=nodes[j].p; const nn=Math.max(3,Math.floor(L/step)); const mid=add(mul(add(A,B),.5),[gaussian()*L*.1,gaussian()*L*.1,gaussian()*L*.1]);
        for(let k=0;k<nn;k++){ const t=Math.random(),u=1-t; const q=[u*u*A[0]+2*u*t*mid[0]+t*t*B[0],u*u*A[1]+2*u*t*mid[1]+t*t*B[1],u*u*A[2]+2*u*t*mid[2]+t*t*B[2]]; glow.push(add(q,[gaussian()*thick,gaussian()*thick,gaussian()*thick]),alpha,col,blob*(.7+Math.random()));
          if(galN&&Math.random()<.5) pushGal(field,add(q,[gaussian()*thick*.6,gaussian()*thick*.6,gaussian()*thick*.6]),.45,.7); } } }
  }
  const inner=realN.slice(); for(let i=0;i<1500;i++){ let p; do{ p=[(Math.random()*2-1)*600,(Math.random()*2-1)*600,(Math.random()*2-1)*600]; }while(len(p)>600||len(p)<28); inner.push({p,w:1+Math.random()*3}); }
  region(inner,110,5,2.2,2.2,.06,[.75,.72,1],3);
  const outer=[]; for(let i=0;i<2600;i++){ let p; do{ p=[(Math.random()*2-1)*4500,(Math.random()*2-1)*4500,(Math.random()*2-1)*4500]; }while(len(p)>4500||len(p)<600); outer.push({p,w:1+Math.random()*2}); }
  region(outer,750,28,22,26,.2,[.72,.7,1],0);
  { const c=eq2gal(radec(195,3,310)); const ax=norm(eq2gal(radec(120,0,1))); for(let k=0;k<5000;k++){ const t=(Math.random()-.5)*420; const q=add(add(c,mul(ax,t)),[gaussian()*10,gaussian()*10,gaussian()*10]); glow.push(q,.18,[.9,.82,1],2.5+Math.random()*2); if(k%2) pushGal(field,q,.5,.8); } }
  { const c=eq2gal(radec(240,30,5000)); const ax=norm(cross(norm(c),[0,0,1])), ay=cross(norm(c),ax);
    for(let k=0;k<18000;k++){ const t=(Math.random()-.5)*3000, w=gaussian()*450, h=gaussian()*120; glow.push(add(add(add(c,mul(ax,t)),mul(ay,w)),mul(norm(c),h)),.28,[1,.78,.5],20+Math.random()*20); } }
  const m=skyLayer(glow,1,4); m.uniforms.uNoExt.value=1; m.uniforms.uUnit.value=1e6; m.uniforms.uG2E.value.copy(G2E); webMats.push(m);
  galLayer(gals,[0.3,2.5]); galLayer(field,[3,14]);
  return realN;
}
/* cúmulos globulares: estrellas individuales en 3D */
function buildGlobulars(){
  const list=[['m13','Cúmulo de Hércules (M13)',250.4235,36.4613,7100,300000,1.7,'Unas 300.000 estrellas en una esfera de 145 años luz. En 1974 se le envió el mensaje de Arecibo: tardará 25.000 años en llegar.'],
    ['omegacen','Omega Centauri',201.697,-47.4795,5200,10000000,3.6,'El cúmulo globular más grande de la Vía Láctea: unos 10 millones de estrellas. Quizá es el núcleo de una galaxia enana devorada.'],
    ['47tuc','47 Tucanae',6.0236,-72.0813,4500,1000000,1.2,'Segundo cúmulo globular más brillante del cielo, junto a la Pequeña Nube de Magallanes. Tiene más de 20 púlsares de milisegundos.'],
    ['m4','M4',245.8968,-26.5257,2200,100000,1.2,'Uno de los cúmulos globulares más cercanos; contiene enanas blancas de las estrellas más antiguas de la galaxia.']];
  for(const [id,name,ra,dec,dpc,Nreal,rc,info] of list){
    const c=eq2gal(radec(ra,dec,dpc)); const arr=[]; const N=id==='omegacen'?60000:id==='m13'?42000:30000; const rt=rc*30;
    for(let i=0;i<N;i++){ const u=Math.random()*0.99; let r=rc*Math.sqrt(u/(1-u)); if(r>rt) r=rt*Math.random();
      const th=Math.acos(2*Math.random()-1), ph=Math.random()*Math.PI*2; const p=add(c,[r*Math.sin(th)*Math.cos(ph),r*Math.sin(th)*Math.sin(ph),r*Math.cos(th)]);
      const k=Math.random(); let M,col; if(k<0.05){ M=-2.5+Math.random()*2; col=[1,.68,.42]; } else if(k<0.09){ M=0.3+Math.random()*.5; col=[.62,.74,1]; } else if(k<0.3){ M=1+Math.random()*2.5; col=[1,.88,.7]; } else { M=3.5+Math.random()*2.5; col=[1,.95,.85]; }
      M+=1.2; arr.push(p,M,col); }
    const mt=skyLayer(arr,0,3); mt.uniforms.uNoExt.value=1; mt.uniforms.uG2E.value.copy(G2E); skyMats.push(mt);
    const g=[]; for(let k=0;k<30;k++) g.push(add(c,[gaussian()*rc*1.5,gaussian()*rc*1.5,gaussian()*rc*1.5]),.012,[1,.9,.75],rc*4); const gm=skyLayer(g,1,4); gm.uniforms.uNoExt.value=1; gm.uniforms.uG2E.value.copy(G2E); skyMats.push(gm);
    const pe=radec(ra,dec,dpc*PC); addBody({id,name,kind:'gal',cat:'gc',menu:true,R:rc*10*PC,view:rc*28*PC,fixed:pe,getPos:()=>pe,info,dpc});
  }
}
/* Laniakea: líneas de flujo de las galaxias hacia el Gran Atractor */
function buildLaniakea(){
  const GA=eq2gal(radec(243.6,-60.9,67));
  const att=[{p:GA,w:1.0},{p:eq2gal(radec(187.7,12.4,16.5)),w:.18},{p:eq2gal(radec(192.2,-41.3,52)),w:.3},{p:eq2gal(radec(159.2,-27.5,54)),w:.25},{p:eq2gal(radec(243.6,-60.9,67)),w:.2}];
  const basins=[{c:GA,R:75,col:[1.0,0.68,0.28],att,end:GA,n:1300},
    {c:eq2gal(radec(49.95,41.51,73)),R:55,col:[0.3,0.45,0.8],att:[{p:eq2gal(radec(49.95,41.51,73)),w:1}],end:eq2gal(radec(49.95,41.51,73)),n:420},
    {c:eq2gal(radec(201.99,-31.5,206)),R:90,col:[0.3,0.45,0.8],att:[{p:eq2gal(radec(201.99,-31.5,206)),w:1}],end:eq2gal(radec(201.99,-31.5,206)),n:520},
    {c:eq2gal(radec(194.95,27.98,100)),R:45,col:[0.3,0.45,0.8],att:[{p:eq2gal(radec(194.95,27.98,100)),w:1}],end:eq2gal(radec(194.95,27.98,100)),n:300}];
  const v=[], a=[], col=[], glow=[], dots=[];
  for(const B of basins){
    // árbol de nodos: cada nodo fluye hacia un nodo más cercano al atractor
    const nodes=[{p:B.end,par:-1}]; for(let i=0;i<70;i++){ let p; do{ p=add(B.c,[(Math.random()*2-1)*B.R,(Math.random()*2-1)*B.R,(Math.random()*2-1)*B.R*.7]); }while(len(sub(p,B.c))>B.R); nodes.push({p,par:-1}); }
    if(B===basins[0]) nodes.push({p:[0,0,0],par:-1});
    for(let i=1;i<nodes.length;i++){ const di=len(sub(nodes[i].p,B.end)); let best=0,bd=1e9; for(let j=0;j<nodes.length;j++){ if(j===i) continue; const dj=len(sub(nodes[j].p,B.end)); if(dj>=di*0.9) continue; const L=len(sub(nodes[j].p,nodes[i].p))+dj*0.35; if(L<bd){bd=L;best=j;} } nodes[i].par=best; }
    for(let i=0;i<B.n;i++){ let s0; if(B===basins[0]&&i<90) s0=[gaussian()*5,gaussian()*5,gaussian()*5]; else { do{ s0=add(B.c,[(Math.random()*2-1)*B.R,(Math.random()*2-1)*B.R,(Math.random()*2-1)*B.R*.7]); }while(len(sub(s0,B.c))>B.R); }
      let ni=0,nd=1e9; for(let j=1;j<nodes.length;j++){ const L=len(sub(nodes[j].p,s0)); if(L<nd){nd=L;ni=j;} }
      const path=[s0]; let k=ni, guard=0; while(k>=0&&guard++<40){ path.push(nodes[k].p); k=nodes[k].par; }
      const jit=[gaussian(),gaussian(),gaussian()];
      let prev=s0; const segs=[]; for(let q=0;q<path.length-1;q++){ const A=path[Math.max(0,q-1)],P1=path[q],P2=path[q+1],P3=path[Math.min(path.length-1,q+2)]; const L=len(sub(P2,P1)); const n=Math.max(2,Math.ceil(L/1.5));
        for(let t=1;t<=n;t++){ const u=t/n,u2=u*u,u3=u2*u; const cr=[0,1,2].map(d=>0.5*((2*P1[d])+(-A[d]+P2[d])*u+(2*A[d]-5*P1[d]+4*P2[d]-P3[d])*u2+(-A[d]+3*P1[d]-3*P2[d]+P3[d])*u3));
          const spread=Math.min(1,len(sub(cr,B.end))/B.R)*2.2; segs.push(add(cr,mul(jit,spread))); } }
      const n=segs.length; for(let q=0;q<n;q++){ const t=(q+1)/n; v.push(...prev,...segs[q]); a.push(Math.max(0,t-1/n),t); col.push(...B.col,...B.col); prev=segs[q]; if(Math.random()<.04) dots.push(add(segs[q],[gaussian()*.5,gaussian()*.5,gaussian()*.5]),.5,[.9,.95,1],.3+Math.random()*.4); } }
    for(let k=0;k<60;k++) glow.push(add(B.c,[gaussian()*B.R*.45,gaussian()*B.R*.45,gaussian()*B.R*.35]),B===basins[0]?.016:.008,B.col,B.R*.5+Math.random()*B.R*.3);
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(v,3)); g.setAttribute('aT',new THREE.Float32BufferAttribute(a,1)); g.setAttribute('aC',new THREE.Float32BufferAttribute(col,3));
  const m=smat({vertexShader:`${VLOG}
uniform vec3 uCam; uniform mat3 uG2E; uniform float uA; attribute float aT; attribute vec3 aC; varying float vA; varying vec3 vC;
void main(){ vec3 rel=position-uCam; float d=max(length(rel),1e-6); vec3 dir=uG2E*(rel/d); vec4 mv=viewMatrix*vec4(dir*5.0e7,1.0); gl_Position=projectionMatrix*mv; vA=uA*0.35*(0.25+0.75*aT); vC=aC;
#include <logdepthbuf_vertex>
}`,fragmentShader:`${FLOG}
varying float vA; varying vec3 vC; void main(){
#include <logdepthbuf_fragment>
 gl_FragColor=vec4(vC*vA,1.0);}`,uniforms:{uCam:{value:new THREE.Vector3()},uG2E:{value:G2E},uA:{value:0}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  const L=new THREE.LineSegments(g,m); L.frustumCulled=false; L.renderOrder=-6; scene.add(L);
  const gm=skyLayer(glow.concat(dots),1,4); gm.uniforms.uNoExt.value=1; gm.uniforms.uUnit.value=1e6; gm.uniforms.uG2E.value.copy(G2E);
  return {mat:m,obj:L,GA,glowMat:gm};
}

const cmbFS=`${FLOG}
uniform float uA; varying vec3 vP;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 vec3 d=normalize(vP);
 float n=snoise(d*3.0)*0.45+snoise(d*7.0)*0.3+snoise(d*16.0)*0.17+snoise(d*38.0)*0.08;
 n+=0.12*d.x;
 vec3 c1=vec3(0.02,0.12,0.55), c2=vec3(0.15,0.6,0.95), c3=vec3(1.0,0.95,0.75), c4=vec3(0.98,0.45,0.1), c5=vec3(0.6,0.05,0.02);
 float t=clamp(n*0.9+0.5,0.0,1.0);
 vec3 c=t<0.25?mix(c1,c2,t/0.25):t<0.5?mix(c2,c3,(t-0.25)/0.25):t<0.75?mix(c3,c4,(t-0.5)/0.25):mix(c4,c5,(t-0.75)/0.25);
 gl_FragColor=vec4(c*uA,1.0);
}`;

/* ---------- superficie de planetas ---------- */
let surf=null, skyDome=null, terrain=null;
const SKY={earth:{z:[0.18,0.42,0.92],h:[0.62,0.78,0.98],s:[1.0,0.42,0.12],a:1},mars:{z:[0.62,0.45,0.3],h:[0.85,0.68,0.5],s:[0.35,0.55,0.95],a:.9},venus:{z:[0.75,0.55,0.25],h:[0.95,0.75,0.4],s:[0.9,0.5,0.2],a:1,over:1},titan:{z:[0.55,0.35,0.12],h:[0.8,0.55,0.25],s:[0.6,0.35,0.1],a:1,over:1},
  jupiter:{z:[0.25,0.32,0.55],h:[0.85,0.75,0.6],s:[0.9,0.6,0.3],a:1},saturn:{z:[0.35,0.38,0.5],h:[0.9,0.82,0.62],s:[0.9,0.7,0.4],a:1},uranus:{z:[0.35,0.7,0.8],h:[0.6,0.88,0.92],s:[0.4,0.7,0.8],a:1},neptune:{z:[0.1,0.25,0.7],h:[0.35,0.55,0.95],s:[0.3,0.5,0.9],a:1}};
SKY.miller={z:[0.28,0.34,0.4],h:[0.52,0.58,0.62],s:[0.55,0.45,0.32],a:0.5}; SKY.mann={z:[0.42,0.52,0.68],h:[0.8,0.85,0.9],s:[0.9,0.8,0.7],a:0.7}; SKY.edmunds={z:[0.5,0.42,0.34],h:[0.88,0.74,0.56],s:[1.0,0.6,0.3],a:0.65};
const SITES={miller:[['Mar poco profundo (aterrizaje del Ranger)',0,0]],mann:[['Glaciar de nubes congeladas',0,0]],edmunds:[['Campamento de Edmunds',0,0]],earth:[['San José, Costa Rica',9.93,-84.08],['Chichén Itzá',20.68,-88.57],['Giza (pirámides)',29.98,31.13],['Kaifeng (dinastía Song)',34.8,114.3],['Hven (Tycho Brahe)',55.9,12.7]],mars:[['Cráter Jezero',18.4,77.5],['Olympus Mons',18.65,-133.8]],moon:[['Mar de la Tranquilidad (Apolo 11)',0.67,23.47]],titan:[['Lugar del Huygens',-10.3,192.3]]};
const domeVS=`varying vec3 vD; void main(){ vD=position; vec4 mv=viewMatrix*vec4(position*1.0e3,1.0); gl_Position=projectionMatrix*mv; gl_Position.z=gl_Position.w*0.999999; }`;
const domeFS=`uniform vec3 uN,uS,uZ,uH,uSet; uniform float uA,uOver,uNoSun;
varying vec3 vD;
void main(){ vec3 v=normalize(vD); float alt=dot(v,uN), sa=dot(uS,uN);
 float day=smoothstep(-0.2,0.08,sa); float tw=smoothstep(-0.25,0.0,sa)*(1.0-smoothstep(0.0,0.3,sa));
 float h=pow(1.0-max(alt,0.0),3.0);
 vec3 c=mix(uZ,uH,h)*day;
 float mu=max(dot(v,uS),0.0);
 c+=uSet*pow(mu,3.0)*tw*(0.6+h)*1.2+uSet*h*tw*0.5;
 c+=vec3(1.0,0.95,0.85)*(pow(mu,400.0)*3.0+pow(mu,14.0)*0.25)*day*(1.0-uNoSun);
 float a=clamp(max(day*1.05,tw*0.6)*uA,0.0,0.992); if(uOver>0.5) a=max(a,0.9);
 c+=vec3(0.02,0.025,0.05)*(1.0-day);
 gl_FragColor=vec4(c,a);
}`;
function buildTerrain(b,lat,lon){
  if(terrain){ scene.remove(terrain); terrain.geometry.dispose(); }
  const N=b.id==='miller'?240:180, S=60; const pos=[], col=[], idx=[];
  const amp=b.id==='miller'?0.004:b.id==='mann'?1.4:b.id==='edmunds'?0.5:b.id==='moon'||b.id==='mercury'?0.9:b.id==='mars'?0.7:b.id==='earth'?0.35:0.4; const seed=(lat*7+lon*3)|0;
  const base=new THREE.Color(b.col); const tx=b.mesh.material.uniforms.uMap.value; let img=null;
  try{ if(tx&&tx.image){ const c=tx.image; const x=c.getContext('2d'); const u=((lon/360)%1+1)%1, v=.5-lat/180; const d=x.getImageData(Math.floor(u*c.width),Math.floor(v*c.height),1,1).data; base.setRGB(d[0]/255,d[1]/255,d[2]/255); } }catch(e){}
  if(b.id==='earth'&&base.b>base.g&&base.b>base.r) base.setRGB(.32,.45,.22);
  if(b.id==='miller') base.setRGB(.15,.21,.24); if(b.id==='mann') base.setRGB(.78,.84,.9); if(b.id==='edmunds') base.setRGB(.66,.42,.25);
  for(let j=0;j<=N;j++) for(let i=0;i<=N;i++){ const x=(i/N-.5)*2*S, y=(j/N-.5)*2*S; const r2=x*x+y*y;
    let h=amp*(fbm(x*.05+seed,y*.05,1.3,6,seed)-.45)*2+amp*.4*(fbm(x*.3,y*.3,5,3,seed+1)-.5);
    if(b.id==='moon'||b.id==='mercury'){ const cr=fbm(x*.08+9,y*.08,2,2,seed+5); if(cr>.62) h-=(cr-.62)*3; }
    if(b.id==='mann'){ const rg=1-Math.abs(fbm(x*.04,y*.04,7,4,seed+9)*2-1); h+=rg*rg*rg*3.0; }
    if(b.id==='edmunds') h+=0.22*Math.sin(x*.35+y*.12+fbm(x*.05,y*.05,3,3,seed+4)*8);
    h*=sstep(0,4,Math.sqrt(r2)); // terreno plano bajo los pies
    const z=h-r2/(2*b.R);
    pos.push(x,y,z);
    const n=fbm(x*.6,y*.6,3,3,seed+2); const k=b.id==='miller'?.9+.15*n:b.id==='mann'?.8+.25*n+Math.min(.2,h*.05):.82+.3*n+h*.15; col.push(base.r*k,base.g*k,base.b*k); }
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const a=j*(N+1)+i; idx.push(a,a+1,a+N+1,a+1,a+N+2,a+N+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=smat({vertexShader:`${VLOG}
varying vec3 vC; varying vec3 vN; varying float vD; varying float vCrest; varying float vWg; varying vec3 vW; attribute vec3 color;
uniform float uWave,uWH; uniform vec2 uWDir;
void main(){ vC=color; vec3 p=position; vec3 nn=normal; vCrest=0.0; vWg=0.0;
 if(uWH>0.0){ float s=dot(p.xy,uWDir); float dd=s-uWave; float w=dd<0.0?1.0:4.5; float g=exp(-dd*dd/(w*w)); float lt=0.8+0.2*sin(dot(p.xy,vec2(-uWDir.y,uWDir.x))*0.11); float hh=uWH*g*lt; p.z+=hh; vWg=g*clamp(uWH,0.0,1.0); float dg=-2.0*dd/(w*w)*hh; nn=normalize(nn-vec3(uWDir*dg,0.0)); vCrest=smoothstep(0.55,1.0,g)*smoothstep(-0.4,0.3,dd)*clamp(uWH,0.0,1.0); }
 vN=normalize(mat3(modelMatrix)*nn); vec4 wp=modelMatrix*vec4(p,1.0); vW=wp.xyz; vD=length(wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp;
#include <logdepthbuf_vertex>
}`,fragmentShader:`${FLOG}
uniform vec3 uS; uniform vec3 uFog; uniform float uDay; uniform float uWater;
varying vec3 vC; varying vec3 vN; varying float vD; varying float vCrest; varying float vWg; varying vec3 vW;
void main(){
#include <logdepthbuf_fragment>
 vec3 N=normalize(vN); float l=max(dot(N,uS),0.0); vec3 c=vC*(0.07+1.0*l*uDay);
 if(uWater>0.5){ vec3 V=normalize(-vW); float fr=pow(1.0-max(dot(N,V),0.0),4.0); c=mix(c,uFog*1.15,fr*0.75); vec3 R=reflect(-uS,N); c+=vec3(1.0,0.85,0.65)*pow(max(dot(R,V),0.0),60.0)*0.3*uDay; c=mix(c,vec3(0.16,0.3,0.32)*(0.35+0.65*uDay),vWg*0.55); c=mix(c,vec3(0.82,0.88,0.9)*(0.2+0.8*uDay),vCrest*0.75); }
 float f=1.0-exp(-vD*0.035); c=mix(c,uFog,f*0.9); float edge=smoothstep(52.0,60.0,vD);
 gl_FragColor=vec4(c,1.0-edge);
}`,uniforms:{uS:{value:new THREE.Vector3(0,0,1)},uFog:{value:new THREE.Vector3(.5,.6,.8)},uDay:{value:1},uWater:{value:b.id==='miller'?1:0},uWave:{value:40},uWH:{value:0},uWDir:{value:new THREE.Vector2(0,1)}},transparent:true});
  terrain=new THREE.Mesh(g,m); terrain.frustumCulled=false; terrain.renderOrder=6; terrain.layers.set(2); scene.add(terrain);
}
function surfBasis(){ const b=surf.b; const q=b.obj.quaternion; const cl=Math.cos(surf.lat*D2R);
  const loc=new THREE.Vector3(cl*Math.cos(surf.lon*D2R),Math.sin(surf.lat*D2R),-cl*Math.sin(surf.lon*D2R)).applyQuaternion(q);
  const pole=new THREE.Vector3(0,1,0).applyQuaternion(q); const n=loc.clone().normalize(); let e=new THREE.Vector3().crossVectors(pole,n); if(e.length()<1e-6) e.set(1,0,0); e.normalize(); const no=new THREE.Vector3().crossVectors(n,e);
  return {n,e,no}; }
function land(b,site){
  const st=site||((SITES[b.id]||[])[0])||[b.name,10,20];
  surf={b,lat:st[1],lon:st[2],az:0,alt:12*D2R,name:st[0],gas:['jupiter','saturn','uranus','neptune'].includes(b.id),loc:0,jd0:simJD,waveT:-1};
  flight=null; cruise=null; mode='surface'; earthView=false; target=b; ensureTex(b);
  if(b.cat==='inter'&&byId.garg){ const G=byId.garg; const d=norm(sub(G.cur,b.cur)); const nd=[G.upv.x,G.upv.y,G.upv.z]; let pp=sub(nd,mul(d,dot(nd,d))); pp=len(pp)<1e-6?norm(cross(d,[0,0,1])):norm(pp);
    const el=(b.id==='miller'?32:b.id==='mann'?18:12)*D2R; const nn=norm(add(mul(d,Math.sin(el)),mul(pp,Math.cos(el))));
    surf.lat=Math.asin(Math.max(-1,Math.min(1,nn[1])))/D2R; surf.lon=Math.atan2(-nn[2],nn[0])/D2R;
    const {e,no,n}=surfBasis(); const dv=new THREE.Vector3(...d); surf.az=Math.atan2(dv.dot(e),dv.dot(no)); surf.alt=Math.min(0.14,Math.asin(dv.dot(n))*0.3); }
  if(!surf.gas) buildTerrain(b,surf.lat,surf.lon); else if(terrain){ terrain.visible=false; }
  const sk=SKY[b.id]; if(skyDome) skyDome.visible=!!sk;
  if(sk){ const U=skyDome.material.uniforms; U.uZ.value.set(...sk.z); U.uH.value.set(...sk.h); U.uSet.value.set(...sk.s); U.uA.value=sk.a; U.uOver.value=sk.over?1:0; U.uNoSun.value=b.lightFrom==='garg'?1:0; }
  document.querySelectorAll('#cz [data-mode]').forEach(x=>x.classList.remove('on')); $('#cz').classList.remove('free'); $('#cz-surfbar').hidden=false; $('#cz-site').innerHTML=(SITES[b.id]||[st]).map((s,i)=>`<option value="${i}" ${s[0]===st[0]?'selected':''}>${s[0]}</option>`).join('');
  fovT=70; if(b.landMsg){ toast(b.landMsg,12000); return; } toast(surf.gas?`Flotas entre las nubes de ${b.name}: no tiene superficie sólida.`:`Aterrizaste en ${b.name} · ${st[0]}. Arrastra para mirar el cielo; acelera el tiempo para ver girar las estrellas.`,7000);
}
function clock(s){ s=Math.max(0,s); const h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=Math.floor(s%60); return `${h}:${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`; }
function longDur(s){ const y=Math.floor(s/YEAR), r=s-y*YEAR, mo=Math.floor(r/(YEAR/12)), d=Math.floor((r-mo*YEAR/12)/DAY), h=Math.floor((r-mo*YEAR/12-d*DAY)/3600); return y?`${y} año${y===1?'':'s'}, ${mo} mes${mo===1?'':'es'}, ${d} d`:mo?`${mo} mes${mo===1?'':'es'}, ${d} días`:`${d} días, ${h} h`; }
function leaveSurface(){ if(!surf) return; const b=surf.b; const {n}=surfBasis(); cam=add(b.cur,[n.x*b.R*3,n.y*b.R*3,n.z*b.R*3]); surf=null; if(terrain) terrain.visible=false; if(skyDome) skyDome.visible=false; $('#cz-surfbar').hidden=true; target=b; setMode('orbit'); }
function updateSurface(){
  const b=surf.b; const {n,e,no}=surfBasis(); const h=surf.gas?b.R*0.0004:b.cat==='inter'?0.012:0.0019;
  cam=add(b.cur,[n.x*(b.R+h),n.y*(b.R+h),n.z*(b.R+h)]);
  const ca=Math.cos(surf.alt); const look=no.clone().multiplyScalar(ca*Math.cos(surf.az)).add(e.clone().multiplyScalar(ca*Math.sin(surf.az))).add(n.clone().multiplyScalar(Math.sin(surf.alt)));
  tmpM||(tmpM=new THREE.Matrix4(),V0=new THREE.Vector3()); tmpM.lookAt(V0,look,n); camQ.setFromRotationMatrix(tmpM);
  const Ls=b.lightFrom&&byId[b.lightFrom]?byId[b.lightFrom]:byId.sun; const sd=norm(sub(Ls.cur,cam)); const S=new THREE.Vector3(...sd);
  if(skyDome&&skyDome.visible){ const U=skyDome.material.uniforms; U.uN.value.copy(n); U.uS.value.copy(S); }
  const sa=S.dot(n); surf.day=Math.max(0,Math.min(1,(sa+0.2)/0.28))*(SKY[b.id]?SKY[b.id].a:0);
  if(terrain&&!surf.gas){ terrain.visible=true; const gp=add(b.cur,[n.x*b.R,n.y*b.R,n.z*b.R]); const rel=sub(gp,cam); terrain.position.set(...rel);
    const m=new THREE.Matrix4().makeBasis(e,no,n); terrain.quaternion.setFromRotationMatrix(m);
    const U=terrain.material.uniforms; U.uS.value.copy(S); if(lightMode==='studio'){ U.uS.value.copy(n.clone().multiplyScalar(.7).add(S.clone().multiplyScalar(.3)).normalize()); } const sk=SKY[b.id]; U.uFog.value.set(...(sk?sk.h.map(x=>x*Math.max(.05,surf.day)):[0,0,0])); U.uDay.value=Math.max(0.05,Math.min(1,sa*4+0.3));
    if(b.id==='miller'){ const wx=S.dot(e), wy=S.dot(no); const wl=Math.hypot(wx,wy)||1; U.uWDir.value.set(wx/wl,wy/wl); const ph=(surf.wt*1.2)%120; const wv=50-ph; U.uWave.value=wv; U.uWH.value=wv>0?1.3*sstep(0,9,wv)*sstep(50,42,wv):0;
      if(wv<30&&wv>20&&surf.waveT!==Math.floor(surf.wt*1.2/120)){ surf.waveT=Math.floor(surf.wt*1.2/120); toast('«Esas no son montañas… son olas.» Una ola de marea de más de 1 km, levantada por la gravedad de Gargantúa.',6000); } }
    else U.uWH.value=0; }
  $('#cz-surfinfo').textContent=`${b.name} · ${surf.name} · lat ${nf(surf.lat,1)}°, lon ${nf(surf.lon,1)}° · ${Ls===byId.sun?'Sol':Ls.name.split(' ')[0]} a ${nf(Math.asin(Math.max(-1,Math.min(1,sa)))/D2R,0)}° sobre el horizonte`;
  if(b.dilF){ let dc=$('#cz-dclk'); if(!dc){ dc=document.createElement('div'); dc.id='cz-dclk'; $('#cz').appendChild(dc); } dc.hidden=false;
    const Ey=(simJD-surf.jd0)*DAY; dc.innerHTML=`<div><small>Tu reloj en ${b.name.split(' (')[0]}</small><b>${clock(surf.loc)}</b></div><div class="e"><small>Mientras tanto, en la Tierra</small><b>${longDur(Ey)}</b></div><p>1 hora aquí = 7 años allá</p>`; }
}

/* ---------- física de gravedad ---------- */
const GM={sun:1.32712e11,mercury:22032,venus:324859,earth:398600,moon:4902.8,mars:42828,jupiter:1.26687e8,saturn:3.7931e7,uranus:5.794e6,neptune:6.8365e6,pluto:869.6,io:5960,europa:3203,ganymede:9888,callisto:7179,titan:8978};
function bodyGM(b){ if(GM[b.id]) return GM[b.id]; if(b.kind==='bh') return b.M*1.32712e11; if(b.kind==='ns') return 1.4*1.32712e11; if(b.kind==='star'){ const L=Math.pow(b.R/RS,2)*Math.pow(b.T/5772,4); return Math.max(.08,Math.min(150,Math.pow(L,1/3.5)))*1.32712e11; } return 0; }
function gravAcc(p){ let a=[0,0,0], best=0, bb=null; for(const b of bodies){ if(hideW(b)) continue; const g=b._gm!=null?b._gm:(b._gm=bodyGM(b)); if(!g) continue; const d=sub(b.cur,p), r2=Math.max(dot(d,d),Math.pow(b.kind==='bh'?b.R*0.5:b.R,2)); const r=Math.sqrt(r2); const k=g/(r2*r); a=add(a,mul(d,k)); const ai=g/r2; if(ai>best){best=ai;bb=b;} } return [a,best,bb]; }
function physicsStep(dt){
  let left=dt, n=0;
  while(Math.abs(left)>0&&n<300){ const [ns]=nearestSurface(); const sp=len(vel)+1e-9; let h=Math.min(Math.abs(left),Math.max(1e-3,0.02*ns/sp)); h*=Math.sign(left);
    const [a]=gravAcc(cam); vel=add(vel,mul(a,h)); cam=add(cam,mul(vel,h)); left-=h; n++;
    for(const b of bodies){ if(b.kind==='planet'||b.kind==='star'){ const d=sub(cam,b.cur), l=len(d); if(l<b.R*1.001){ cam=add(b.cur,mul(norm(d),b.R*1.001)); vel=[0,0,0]; toast('¡Impacto contra '+b.name+'! La nave se detuvo.'); } } } }
}
function orbitHere(){ const [a,,bb]=gravAcc(cam); if(!bb) return; const r=sub(cam,bb.cur), rl=len(r); const v=Math.sqrt(bb._gm/rl); const t=norm(cross(r,[0,0,1])); vel=mul(t,v); toast(`Órbita circular alrededor de ${bb.name}: ${fmtSpeed(v)}. Periodo ≈ ${fmtDur(2*Math.PI*rl/v)}.`,6000); }

/* ---------- agujero negro: lente con mapa cúbico, dilatación, embudo y teseracto ---------- */
let gclk=0;
let lensFrame=0, cubeRT=null, cubeCam=null, bhLensMat=null, bhLensScene=null, dil=1, inTess=false, tess=null, fellAt=0;
const bhLensFS=`uniform samplerCube tC; uniform mat4 uInvP; uniform mat4 uCW; uniform vec3 uBH; uniform float uRc; uniform float uWarn; uniform float uDbg;
varying vec2 vUv;
void main(){ vec2 nd=vUv*2.0-1.0; vec4 vp=uInvP*vec4(nd,-1.0,1.0); vec3 dv=normalize(vp.xyz/vp.w); vec3 d=normalize(mat3(uCW)*dv);
 float ct=dot(d,uBH); float st=sqrt(max(0.0,1.0-ct*ct)); float rc=max(uRc,1.0001); float g=sqrt(1.0-1.0/rc);
 float b=rc*st/g; float bc=2.598076;
 if(uDbg>0.5){ gl_FragColor=vec4(textureCube(tC,d).rgb+vec3(0.0,0.0,0.15),1.0); return; }
 float kc=pow(smoothstep(1.0,1.6,rc),0.8);
 bool cap = (ct>0.0&&b<bc) || (rc<1.5&&ct>=0.0) || (rc<1.5&&ct<0.0&&b>bc*max(kc,0.0));
 if(cap){ float edge=exp(-pow((b-bc)/0.05,2.0))*0.6; gl_FragColor=vec4(vec3(1.0,0.75,0.45)*edge*0.0,1.0); return; }
 float x=b/bc; float af=max(2.0/b+1.47/(b*b), -log(max(x-1.0,1e-6))-0.40); float a=min(af*(1.0+ct)*0.5,18.0);
 vec3 ax=cross(d,uBH); float al=length(ax); vec3 src=d; if(al>1e-6){ ax/=al; src=d*cos(a)+cross(ax,d)*sin(a); }
 vec3 c=textureCube(tC,src).rgb;
 float tk=clamp((5.0-rc)/4.0,0.0,1.0);
 if(tk>0.0&&al>1e-6){ for(int i=1;i<6;i++){ float aa=a*(1.0+float(i)*0.09*tk); c+=textureCube(tC,d*cos(aa)+cross(ax,d)*sin(aa)).rgb*(1.0-float(i)/6.0); } c/=1.0+tk*2.5; }
 float sh=1.0/g; c*=mix(vec3(1.0),vec3(0.55,0.8,1.6),clamp((sh-1.0)*0.6,0.0,1.0))*min(sh,1.8)*mix(1.0,0.55,tk);
 if(rc<1.5){ float edgeT=b/(bc*max(kc,1e-3)); c*=smoothstep(1.0,0.6,edgeT)*0.8+0.2; }
 c*=1.0+1.2*exp(-pow((b-bc)/(0.08+0.02*b),2.0));
 c+=vec3(1.0,0.3,0.2)*uWarn*0.25*(1.0-vUv.y);
 gl_FragColor=vec4(c,1.0);
}`;
function initBHLens(){
  cubeRT=new THREE.WebGLCubeRenderTarget(Q.cube,{generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter}); cubeCam=new THREE.CubeCamera(1e-3,1e8,cubeRT); cubeCam.children.forEach(c=>c.layers.set(0));
  bhLensMat=new THREE.ShaderMaterial({vertexShader:lensVS,fragmentShader:bhLensFS,uniforms:{tC:{value:cubeRT.texture},uInvP:{value:new THREE.Matrix4()},uCW:{value:new THREE.Matrix4()},uBH:{value:new THREE.Vector3()},uRc:{value:100},uWarn:{value:0},uDbg:{value:0}},depthTest:false,depthWrite:false});
  bhLensScene=new THREE.Scene(); const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bhLensMat); q.frustumCulled=false; bhLensScene.add(q);
}
let cubeFace=0, lastLens=0;
function cubeStep(n){ const now=performance.now(); cubeCam.updateMatrixWorld(true); if(now-lastLens>600){ cubeCam.update(renderer,scene); } else { for(let k=0;k<n;k++){ const f=cubeFace++%6; renderer.setRenderTarget(cubeRT,f); renderer.render(scene,cubeCam.children[f]); } renderer.setRenderTarget(null); } lastLens=now; }
function strongestBH(){ let best=null,bv=0; for(const b of bodies){ if(b.kind!=='bh'||hideW(b)) continue; b.dist=len(sub(b.cur,cam)); const rc=b.dist/b.R; const v=1/rc; if(v>bv){bv=v;best=b;} } return best; }
let plungeS=null, darkS=null, tessCool=0;
function plunge(b){ stopGrand(); if(surf) setMode('orbit'); flight=null; cruise=null; gravityOn=false; target=b; select(b);
  const r0=Math.min(Math.max(len(sub(cam,b.cur))/b.R,12),60); plungeS={b,t:0,dur:26,dir:norm(sub(cam,b.cur)),r0}; sel=null; $('#cz-info').hidden=true; $('#cz-menu').hidden=true; $('#cz').classList.add('falling');
  $('#cz-fall').hidden=false; toast('Cayendo hacia el horizonte de eventos. Primero verás crecer la sombra; luego la nave gira y verás el universo comprimirse en un túnel de luz.',9000); }
function updatePlunge(dtR){
  const P=plungeS, b=P.b; P.t+=Math.min(dtR,0.05); const u=Math.min(1,P.t/P.dur);
  const rc=1.0+(P.r0-1.0)*Math.pow(1-u,2.6)+0.004*(1-u);
  cam=add(b.cur,mul(P.dir,rc*b.R));
  const toBH=mul(P.dir,-1), away=P.dir; const s=sstep(0.42,0.78,u);
  const side=norm(cross(P.dir,[0,0,1])); const look=norm(add(mul(slerpV(toBH,away,s),1),mul(side,Math.sin(s*Math.PI)*0.5)));
  tmpM||(tmpM=new THREE.Matrix4(),V0=new THREE.Vector3()); tmpM.lookAt(V0,new THREE.Vector3(...look),new THREE.Vector3(...side)); const q=new THREE.Quaternion().setFromRotationMatrix(tmpM); camQ.slerp(q,1-Math.exp(-dtR*4));
  fovT=70+25*s; P.txT=(P.txT||0)+dtR; if(P.txT>0.25){ P.txT=0;
  $('#cz-fall').textContent=rc>3?`Distancia al horizonte: ${nf(rc-1,1)} radios · 1 s tuyo = ${fmtDur(1/Math.sqrt(1-1/rc))} fuera`:rc>1.05?`Cerca del horizonte · el universo se comprime en un túnel · 1 s tuyo = ${fmtDur(1/Math.sqrt(1-1/rc))} fuera`:'Cruzando el horizonte de eventos…'; }
  if(u>=1){ plungeS=null; startDarkness(b); }
}
function startDarkness(b){
  if(darkS||inTess) return; plungeS=null; flight=null; darkS={b,t0:performance.now()};
  const ov=document.createElement('div'); ov.className='cz-black'; ov.id='cz-black'; $('#cz').appendChild(ov);
  $('#cz-fall').hidden=false; $('#cz-fall').textContent='Solo oscuridad… sigues cayendo';
  setTimeout(()=>{ $('#cz-fall').hidden=true; darkS=null; enterTesseract(b); },5200);
}

function enterTesseract(b){
  if(inTess) return; inTess=true; fellAt=simJD; flight=null; plungeS=null; $('#cz').classList.remove('falling');
  const bl=$('#cz-black'); if(bl){ bl.classList.add('out'); setTimeout(()=>bl.remove(),3000); }
  if(!tess) tess=buildTesseract();
  tess.collapse=0; tess.collapsed=false; tess.root.scale.setScalar(1); tess.t0=performance.now(); tess.from=b; tess.lineI=0; tess.lineT=0; tess.cam.position.set(0,0,0); tess.vel.set(0,0,0); $('#cz-tess').hidden=false; $('#cz').classList.add('tess'); droneSet(0); tessSound(true);
  tess.exitT=setTimeout(exitTesseract,180000);
}
function exitTesseract(){ if(!inTess||!tess||tess.collapse) return; tess.collapse=performance.now(); tess.collapsed=false; clearTimeout(tess.exitT); $('#cz-tess').hidden=true; $('#cz-tfrag').classList.remove('on'); const ln=$('#cz-tline'); ln.textContent='La estructura se pliega sobre sí misma…'; ln.classList.remove('on'); void ln.offsetWidth; ln.classList.add('on'); tessSound(false); }
function finishTessExit(){
  if(!inTess) return; inTess=false; tess.collapse=0; tess.root.scale.setScalar(1); tess.edgeM.uniforms.uCol.value.set(1.0,0.72,0.35); clearTimeout(tess.exitT); $('#cz-tess').hidden=true; $('#cz').classList.remove('tess'); tessSound(false); $('#cz-tfrag').classList.remove('on'); $('#cz-tline').classList.remove('on'); renderer.setRenderTarget(null);
  const ov=document.createElement('div'); ov.className='cz-wake'; ov.innerHTML='<i></i><i></i>'; $('#cz').appendChild(ov); setTimeout(()=>ov.remove(),6200); $('#cz').classList.add('waking'); setTimeout(()=>$('#cz').classList.remove('waking'),6200);
  const bl=$('#cz-black'); if(bl) bl.remove(); plungeS=null; darkS=null; flight=null; cruise=null; gravityOn=false; vel=[0,0,0];
  const yrs=(simJD-fellAt)/365.25; tessCool=performance.now()+4000;
  const E=byId.earth; updatePositions(simJD); land(E,SITES.earth[0]); updateSurface(); last=performance.now();
  setTimeout(()=>toast(`Despiertas en la Tierra, en San José, Costa Rica. ¿Fue un sueño? ${yrs>0.01?'Según el reloj, pasaron '+fmtDur(yrs*YEAR)+'.':''} (Ficción científica: nadie sabe qué hay dentro de un agujero negro.)`,11000),3500);
}
/* ---------- Teseracto v2: biblioteca de cinco dimensiones ---------- */
const ESSAY=[
 'Pocas disciplinas dependen tanto del tiempo como la astrofísica, y pocas tienen una línea de base observacional tan corta.',
 'Procesos como el frenado de un pulsar, la expansión de un remanente o la variación de la rotación terrestre operan en escalas de siglos a milenios.',
 'Los registros humanos permiten extender retrospectivamente esa línea de base observacional.',
 'El legado egipcio que llegó a la astronomía matemática no es la precisión supuesta de sus monumentos, sino la regularidad deliberada de su calendario.',
 'Sus estaciones (Akhet, Peret, Shemu) seguían el régimen del Nilo, y la tradición asoció el Año Nuevo al orto helíaco de Sirio (Sopdet).',
 'Los textos sitúan la cabeza y la ingle de Nut en los horizontes occidental y oriental; la Vía Láctea podría corresponder a su torso y a sus brazos.',
 'Los relojes estelares y la división de la noche en horas muestran una tradición egipcia de medición temporal basada en observaciones del cielo.',
 'El legado chino es el único de los tres que la astrofísica contemporánea usa como dato en artículos actuales.',
 'El Atlas de Dunhuang incluye 1.339 estrellas en 257 asterismos, distribuidas en doce mapas por ángulo horario y un mapa circumpolar.',
 'Los registros chinos del cometa Halley son casi continuos desde 240 a.C.',
 'La fricción de mareas transfiere momento angular de la rotación terrestre a la órbita lunar y alarga el día.',
 'Sin corrección, un eclipse de la época Han se ubicaría a casi un octavo de vuelta del lugar donde fue visto.',
 'Esa sensibilidad convierte a cada registro fechado y localizado en una medición de la rotación terrestre.',
 'Escribas de la corte china ayudan a medir la respuesta del manto terrestre al fin de la última glaciación.',
 'Su valor no depende de que esos registros hayan transmitido un método a Occidente, sino de que conservan información temporal que los instrumentos actuales no pueden recuperar.',
 'La asociación de la Nebulosa del Cangrejo con la estrella invitada de 1054 ofrece un caso especialmente claro de uso científico de un archivo histórico.',
 'La nebulosa se expande más rápido de lo que permitiría una expansión libre: algo la está acelerando.',
 'Un periodo tan corto descartó las enanas blancas pulsantes y confirmó que los pulsares son estrellas de neutrones en rotación.',
 'Al combinar la fecha histórica con mediciones modernas, se puede estudiar la edad del remanente, la expansión de sus filamentos y la evolución de su pulsar.',
 'Las supernovas de tipo Ia desempeñaron un papel central en el descubrimiento de la expansión acelerada del universo.',
 'Para localizar un eco de luz hay que conocer el tiempo transcurrido, porque el polvo que refleja está sobre un paraboloide definido por ct.',
 'Un espectro tomado en 2008 clasificó una explosión de 1572.',
 'Para la Vía Láctea el problema observacional es complejo: la vemos desde dentro y el polvo del disco oculta una fracción importante de los eventos.',
 'La astronomía maya muestra una tradición de predicción basada en ciclos, múltiplos comunes y correcciones aritméticas.',
 '37.960 = 65 × 584 = 146 × 260 = 104 × 365. En 37.960 días los tres ciclos vuelven a coincidir.',
 'La tabla de Venus del Códice de Dresde está construida sobre esa periodicidad.',
 'El prefacio de la tabla incluye reglas para restar días al reiniciarla, con el propósito de limitar la acumulación del desfase.',
 'Desde latitudes tropicales, determinadas zonas de la región interior de la Vía Láctea culminan a mayor altura.',
 'La falta de un documento intermedio justifica calificar una transmisión como no demostrada, no declarar imposible el contacto.',
 'Una tradición puede haber transmitido convenciones y, por separado, conservar observaciones que siglos después adquieren valor científico.',
 'Un registro puede reinterpretarse cuando aparecen nuevas técnicas de datación, imágenes, espectros o mediciones de movimiento.',
 'La documentación de 1054 es un ejemplo de cómo una observación histórica puede convertirse en una restricción para la investigación contemporánea.',
 'Buscar sistemáticamente referencias a astros nuevos fechables en fuentes mesoamericanas y otras tradiciones tropicales.',
 'Tratar cada registro antiguo como una medición con error modelado de posición, fecha y brillo, no como una identificación binaria.'
];
const STREAK_VS=`varying vec3 vL; varying vec3 vW; varying float vS;
void main(){ vL=position; vec4 w=instanceMatrix*vec4(position,1.0); vS=floor(fract(dot(instanceMatrix[3].xyz,vec3(0.131,0.717,0.373)))*97.0); vW=(modelMatrix*w).xyz; gl_Position=projectionMatrix*viewMatrix*modelMatrix*w; }`;
const STREAK_FS=`uniform float uT; uniform vec3 uCam; varying vec3 vL; varying vec3 vW; varying float vS;
float h(float x){ return fract(sin(x*127.1)*43758.5453); }
void main(){
 // a lo largo de x se estira el tiempo: lomos de libros convertidos en líneas
 float u=(vL.y+0.5)*60.0+vS*7.0; float id=floor(u); float f=fract(u);
 float r=h(id+vS*3.1);
 vec3 c=r<0.25?vec3(0.45,0.16,0.08):r<0.5?vec3(0.62,0.48,0.3):r<0.7?vec3(0.2,0.12,0.07):r<0.85?vec3(0.85,0.75,0.55):vec3(0.25,0.35,0.42);
 c*=0.55+0.45*smoothstep(0.0,0.15,f)*smoothstep(1.0,0.85,f);
 float along=vL.x+0.5;
 float pulse=exp(-pow((fract(along*0.6-uT*0.07+h(id)*3.0)-0.5)/0.03,2.0));
 c+=vec3(1.0,0.82,0.5)*pulse*0.9*step(0.6,h(id+1.7));
 c*=0.75+0.35*sin(along*3.0+id);
 float d=length(vW-uCam); c*=exp(-d*0.022); c+=vec3(0.04,0.03,0.02)*(1.0-exp(-d*0.02));
 gl_FragColor=vec4(c,1.0);
}`;
const EDGE_FS=`uniform float uT; uniform vec3 uCam; uniform vec3 uCol; varying vec3 vW; varying float vP;
void main(){ float d=length(vW-uCam); float p=0.35+0.65*pow(0.5+0.5*sin(vP*0.35-uT*2.2),6.0); gl_FragColor=vec4(uCol*p*exp(-d*0.018),1.0); }`;
const EDGE_VS=`attribute float aP; varying vec3 vW; varying float vP; void main(){ vP=aP; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`;
const POST_FS=`uniform sampler2D tCur; uniform sampler2D tPrev; uniform float uDecay; uniform float uMode; uniform vec2 uRes; uniform float uT; varying vec2 vUv;
void main(){
 if(uMode<0.5){ vec3 c=texture2D(tCur,vUv).rgb; vec3 p=texture2D(tPrev,vUv+ (vUv-0.5)*-0.004).rgb; gl_FragColor=vec4(max(c,p*uDecay),1.0); return; }
 vec2 d=(vUv-0.5); float k=dot(d,d);
 vec3 c; c.r=texture2D(tCur,vUv+d*0.012*k*4.0).r; c.g=texture2D(tCur,vUv).g; c.b=texture2D(tCur,vUv-d*0.012*k*4.0).b;
 vec3 bl=vec3(0.0); for(int i=1;i<=6;i++){ float o=float(i)*0.004; bl+=texture2D(tCur,vUv+vec2(o,0.0)).rgb+texture2D(tCur,vUv-vec2(o,0.0)).rgb+texture2D(tCur,vUv+vec2(0.0,o)).rgb+texture2D(tCur,vUv-vec2(0.0,o)).rgb; }
 bl/=24.0; c+=max(bl-0.55,0.0)*1.2;
 c*=1.0-smoothstep(0.15,0.75,k*1.6);
 c=c/(1.0+c*0.25);
 gl_FragColor=vec4(c,1.0);
}`;
function columnText(txt){
  const c=document.createElement('canvas'); c.width=2048; c.height=268; const x=c.getContext('2d');
  x.font='italic 58px Georgia, serif'; const words=txt.split(' '); const lines=[]; let line='';
  for(const w of words){ const t=line?line+' '+w:w; if(x.measureText(t).width>1940){ lines.push(line); line=w; } else line=t; } lines.push(line);
  const L=lines.slice(0,3); const fs=L.length>2?52:58; x.font=`italic ${fs}px Georgia, serif`; x.textAlign='center'; x.textBaseline='middle';
  L.forEach((l,k)=>{ const y=134+(k-(L.length-1)/2)*fs*1.15; x.shadowColor='rgba(255,170,60,.9)'; x.shadowBlur=22; x.fillStyle='rgba(255,214,150,.95)'; x.fillText(l,1024,y); x.shadowBlur=0; x.fillStyle='rgba(255,245,220,1)'; x.fillText(l,1024,y); });
  const t=new THREE.CanvasTexture(c); t.anisotropy=8; return t;
}
function bookTexture(txt,i){
  const c=document.createElement('canvas'); c.width=640; c.height=400; const x=c.getContext('2d');
  const g=x.createRadialGradient(320,200,40,320,200,360); g.addColorStop(0,'rgba(255,214,140,.55)'); g.addColorStop(1,'rgba(255,214,140,0)'); x.fillStyle=g; x.fillRect(0,0,640,400);
  const page=(px,flip)=>{ x.save(); x.translate(px,40); const pg=x.createLinearGradient(flip?0:280,0,flip?280:0,0); pg.addColorStop(0,'#f3e6c4'); pg.addColorStop(1,'#d9c79a'); x.fillStyle=pg; x.beginPath(); x.moveTo(0,10); x.quadraticCurveTo(140,-8,280,10); x.lineTo(280,330); x.quadraticCurveTo(140,312,0,330); x.closePath(); x.fill(); x.restore(); };
  page(40,false); page(320,true);
  x.fillStyle='#5a3a18'; x.fillRect(318,46,4,320);
  x.fillStyle='#3b2610'; x.font='italic 15px Georgia, serif'; x.fillText('Del archivo celeste a la cosmología',62,82);
  x.fillStyle='#8a6a3a'; x.font='12px Georgia, serif'; x.fillText('fragmento '+(i+1)+' · Egipto · China · Mayas',62,104);
  x.strokeStyle='#b8995e'; x.beginPath(); x.moveTo(62,116); x.lineTo(278,116); x.stroke();
  for(let k=0;k<9;k++){ x.fillStyle='rgba(90,60,25,.18)'; x.fillRect(62,132+k*22,200-((k*37)%70),3); }
  x.fillStyle='#2b1a08'; x.font='17px Georgia, serif'; const words=txt.split(' '); let line='', y=86; const lines=[];
  for(const w of words){ const t=line?line+' '+w:w; if(x.measureText(t).width>238){ lines.push(line); line=w; } else line=t; } lines.push(line);
  const lh=Math.min(24,250/lines.length); lines.forEach((l,k)=>x.fillText(l,346,86+k*lh));
  const t=new THREE.CanvasTexture(c); t.anisotropy=4; return t;
}
function buildTesseract(){
  const S=new THREE.Scene(); S.background=new THREE.Color(0x020308);
  const cam=new THREE.PerspectiveCamera(72,W/H,0.05,400); cam.position.set(0,0,0);
  const C=14, N=4, SPAN=C*N*2, PER=3*C;
  const root=new THREE.Group(); S.add(root);
  // estantes estirados en el tiempo (líneas de libros)
  const streakM=new THREE.ShaderMaterial({vertexShader:STREAK_VS,fragmentShader:STREAK_FS,uniforms:{uT:{value:0},uCam:{value:new THREE.Vector3()}}});
  const boxG=new THREE.BoxGeometry(1,1,1); const inst=[];
  for(let a=0;a<3;a++) for(let i=-N;i<=N;i++) for(let j=-N;j<=N;j++){ if(Math.random()<0.18) continue;
    for(let s=-N;s<N;s++){ const p=[0,0,0]; p[a]=s*C+C/2; p[(a+1)%3]=i*C; p[(a+2)%3]=j*C;
      const sc=[0,0,0]; sc[a]=C*0.98; sc[(a+1)%3]=2.2; sc[(a+2)%3]=2.2;
      // el eje largo del material es x local: rotar la caja
      const q=new THREE.Quaternion(); if(a===1) q.setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2); if(a===2) q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
      const e=[p,q,[C*0.98,2.2,2.2]]; e.a=a; inst.push(e); } }
  const IM=new THREE.InstancedMesh(boxG,streakM,inst.length); const M4=new THREE.Matrix4();
  inst.forEach(([p,q,s],i)=>{ M4.compose(new THREE.Vector3(...p),q,new THREE.Vector3(...s)); IM.setMatrixAt(i,M4); }); root.add(IM);
  // fragmentos del ensayo grabados en las columnas (patrón que se repite cada 3 celdas)
  const perm=[]; for(let k=0;k<81;k++) perm.push(k<ESSAY.length*2?k%ESSAY.length:-1); for(let k=80;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); [perm[k],perm[j]]=[perm[j],perm[k]]; }
  const slots=ESSAY.map(()=>[]); const frags=[];
  inst.forEach(([p,q],i)=>{ const a=inst[i].a; const im=((Math.round(p[(a+1)%3]/C)%3)+3)%3, jm=((Math.round(p[(a+2)%3]/C)%3)+3)%3, sm=((Math.floor(p[a]/C)%3)+3)%3; const id=perm[a*27+im*9+jm*3+sm]; if(id<0) return;
    for(const side of [1,-1]){ const off=new THREE.Vector3(0,0,1.13*side).applyQuaternion(q); const qq=q.clone(); if(side<0) qq.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI)); const pos=new THREE.Vector3(...p).add(off); slots[id].push([pos,qq]); frags.push({pos,id}); } });
  const fragG=new THREE.PlaneGeometry(13,1.7);
  ESSAY.forEach((t,id)=>{ if(!slots[id].length) return; const m=new THREE.MeshBasicMaterial({map:columnText(t),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide,fog:true});
    const FM=new THREE.InstancedMesh(fragG,m,slots[id].length); slots[id].forEach(([pos,qq],k)=>{ M4.compose(pos,qq,new THREE.Vector3(1,1,1)); FM.setMatrixAt(k,M4); }); root.add(FM); });
  // aristas luminosas del retículo (luz que fluye = tiempo)
  const ev=[], ep=[];
  for(let a=0;a<3;a++) for(let i=-N;i<=N;i++) for(let j=-N;j<=N;j++) for(const o of [[1.15,1.15],[-1.15,1.15],[1.15,-1.15],[-1.15,-1.15]]){ const A=[0,0,0],B=[0,0,0]; A[a]=-N*C; B[a]=N*C; A[(a+1)%3]=B[(a+1)%3]=i*C+o[0]; A[(a+2)%3]=B[(a+2)%3]=j*C+o[1]; ev.push(...A,...B); ep.push(-N*C,N*C); }
  const eg=new THREE.BufferGeometry(); eg.setAttribute('position',new THREE.Float32BufferAttribute(ev,3)); eg.setAttribute('aP',new THREE.Float32BufferAttribute(ep,1));
  const edgeM=new THREE.ShaderMaterial({vertexShader:EDGE_VS,fragmentShader:EDGE_FS,uniforms:{uT:{value:0},uCam:{value:new THREE.Vector3()},uCol:{value:new THREE.Vector3(1.0,0.72,0.35)}},blending:THREE.AdditiveBlending,transparent:true,depthWrite:false});
  root.add(new THREE.LineSegments(eg,edgeM));
  // cubos de cristal anidados (el teseracto se repite dentro de sí mismo)
  const glass=[]; const nest=new THREE.Group(); root.add(nest);
  const cubeEdges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1,1,1));
  for(let k=0;k<14;k++){ const g=new THREE.Group(); g.position.set((Math.floor(Math.random()*6)-3)*C+C/2,(Math.floor(Math.random()*6)-3)*C+C/2,(Math.floor(Math.random()*6)-3)*C+C/2);
    for(let l=0;l<4;l++){ const col=[0x9ff6ff,0xffffff,0xffb8e6,0x7fd8ff][l]; const m=new THREE.LineSegments(cubeEdges,new THREE.LineBasicMaterial({color:col,transparent:true,opacity:0.85-l*0.15,blending:THREE.AdditiveBlending,depthWrite:false})); m.scale.setScalar(6*Math.pow(0.55,l)); g.add(m); }
    const face=new THREE.Mesh(new THREE.BoxGeometry(6,6,6),new THREE.MeshBasicMaterial({color:0x4fb8ff,transparent:true,opacity:0.05,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide})); g.add(face);
    g.userData.spin=(Math.random()-.5)*0.4; nest.add(g); glass.push(g); }
  // hipercubo central (proyección 4D)
  const V4=[]; for(let i=0;i<16;i++) V4.push([(i&1?1:-1),(i&2?1:-1),(i&4?1:-1),(i&8?1:-1)]);
  const E4=[]; for(let i=0;i<16;i++) for(let j=i+1;j<16;j++){ let d=0; for(let k=0;k<4;k++) if(V4[i][k]!==V4[j][k]) d++; if(d===1) E4.push(i,j); }
  const hg=new THREE.BufferGeometry(); hg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(E4.length*3),3));
  const hyper=new THREE.LineSegments(hg,new THREE.LineBasicMaterial({color:0xffe0a8,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false})); S.add(hyper);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffd28a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0.6})); core.scale.setScalar(10); S.add(core);
  // libros con fragmentos del ensayo
  const books=[]; const bg=new THREE.PlaneGeometry(4.8,3);
  if(false) ESSAY.forEach((t,i)=>{ const m=new THREE.MeshBasicMaterial({map:bookTexture(t,i),color:0xb8b0a0,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.NormalBlending});
    const b=new THREE.Mesh(bg,m); b.position.set((Math.random()-.5)*SPAN*0.9,(Math.random()-.5)*SPAN*0.9,(Math.random()-.5)*SPAN*0.9); b.userData={t,i,ph:Math.random()*6}; S.add(b); books.push(b); });
  // polvo de luz
  const NP=2500, pp=new Float32Array(NP*3); for(let i=0;i<NP;i++){ pp[i*3]=(Math.random()-.5)*SPAN; pp[i*3+1]=(Math.random()-.5)*SPAN; pp[i*3+2]=(Math.random()-.5)*SPAN; }
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  const motes=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffe6b0,size:0.12,transparent:true,opacity:0.8,blending:THREE.AdditiveBlending,depthWrite:false})); root.add(motes);
  S.fog=new THREE.FogExp2(0x0a0812,0.02);
  // posproceso: ecos 4D (estelas), aberración cromática y brillo
  const mkRT=()=>new THREE.WebGLRenderTarget(4,4,{depthBuffer:true});
  const post={cur:mkRT(),a:mkRT(),b:mkRT(),mat:new THREE.ShaderMaterial({vertexShader:lensVS,fragmentShader:POST_FS,uniforms:{tCur:{value:null},tPrev:{value:null},uDecay:{value:0.86},uMode:{value:0},uRes:{value:new THREE.Vector2()},uT:{value:0}},depthTest:false,depthWrite:false})};
  post.scene=new THREE.Scene(); const pq=new THREE.Mesh(new THREE.PlaneGeometry(2,2),post.mat); pq.frustumCulled=false; post.scene.add(pq);
  nest.visible=false; hyper.visible=false; core.visible=false;
  return {frags,PER,S,cam,root,streakM,edgeM,glass,hyper,core,V4,E4,books,motes,post,C,SPAN,yaw:0,pitch:-0.25,vel:new THREE.Vector3(),near:null,lineT:0,lineI:0};
}
const TESS_LINES=['Ya no caes.','El tiempo aquí no pasa: es un lugar que puedes recorrer.','Cada línea de luz es un instante estirado. En las columnas está escrito lo que alguien anotó del cielo.','Ves el pasado, el presente y el futuro a la vez.','Por un momento, eres un ser de cuatro dimensiones.'];
let tessPad=null;
function tessSound(on){ try{ if(!on){ if(tessPad){ tessPad.g.gain.setTargetAtTime(0,tessPad.ac.currentTime,0.6); } return; }
  if(!soundOn) return; if(!tessPad){ const AC=window.AudioContext||window.webkitAudioContext; const ac=new AC(); const g=ac.createGain(); g.gain.value=0; const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; f.connect(g); g.connect(ac.destination);
    [110,164.8,220,329.6,440.5].forEach((fr,i)=>{ const o=ac.createOscillator(); o.type=i%2?'triangle':'sine'; o.frequency.value=fr; const og=ac.createGain(); og.gain.value=0.12/(i+1); const l=ac.createOscillator(); l.frequency.value=0.07+i*0.03; const lg=ac.createGain(); lg.gain.value=0.05/(i+1); l.connect(lg); lg.connect(og.gain); o.connect(og); og.connect(f); o.start(); l.start(); });
    tessPad={ac,g}; } if(tessPad.ac.state==='suspended') tessPad.ac.resume(); tessPad.g.gain.setTargetAtTime(0.25,tessPad.ac.currentTime,2.0); }catch(e){} }
function tessFrame(now,dtR){
  const T=tess, t=(now-T.t0)/1000, c=T.cam;
  const d=renderer.getPixelRatio(); const w=Math.max(2,Math.floor(W*d)), h=Math.max(2,Math.floor(H*d));
  if(T.post.cur.width!==w||T.post.cur.height!==h){ [T.post.cur,T.post.a,T.post.b].forEach(r=>r.setSize(w,h)); }
  // hipercubo 4D girando en dos planos
  const A=t*0.35, B=t*0.23; const pts=T.V4.map(v=>{ let [x,y,z,ww]=v; let x1=x*Math.cos(A)-ww*Math.sin(A), w1=x*Math.sin(A)+ww*Math.cos(A); let y1=y*Math.cos(B)-w1*Math.sin(B), w2=y*Math.sin(B)+w1*Math.cos(B); const k=4.2/(3-w2); return [x1*k,y1*k,z*k]; });
  const arr=T.hyper.geometry.attributes.position.array; for(let i=0;i<T.E4.length;i++) arr.set(pts[T.E4[i]],i*3); T.hyper.geometry.attributes.position.needsUpdate=true;
  // movimiento: caída suave perpetua + control
  c.aspect=W/H; c.fov=72+6*Math.sin(t*0.2); c.updateProjectionMatrix();
  const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(T.pitch,T.yaw,Math.sin(t*0.13)*0.12,'YXZ')); c.quaternion.slerp(q,1-Math.exp(-dtR*6));
  const fw=new THREE.Vector3(0,0,-1).applyQuaternion(c.quaternion);
  const thrust=(keys.w?1:0)-(keys.s?1:0); const target=fw.clone().multiplyScalar(2.2+thrust*(keys.shift?18:7)).add(new THREE.Vector3(0,-0.9,0));
  T.vel.lerp(target,1-Math.exp(-dtR*1.5)); c.position.addScaledVector(T.vel,dtR);
  // retículo infinito: el mundo se repite alrededor de la cámara
  const PR=T.PER; const snap=new THREE.Vector3(Math.round(c.position.x/PR)*PR,Math.round(c.position.y/PR)*PR,Math.round(c.position.z/PR)*PR);
  let cs=1; if(T.collapse){ const k=Math.min(1,(now-T.collapse)/3800); const e=k*k*k; cs=Math.max(0.002,1-e); T.root.rotation.set(e*2.2,e*3.1,e*1.7); T.edgeM.uniforms.uCol.value.set(1+e*3,0.72+e*2,0.35+e*2);
    c.fov=72+e*60; c.updateProjectionMatrix(); if(k>=1&&!T.collapsed){ T.collapsed=true; finishTessExit(); return; } }
  else T.root.rotation.set(0,0,0);
  T.root.scale.setScalar(cs); T.root.position.copy(c.position).add(snap.sub(c.position).multiplyScalar(cs));
  T.hyper.position.copy(c.position).add(fw.clone().multiplyScalar(26)); T.hyper.lookAt(c.position); T.core.position.copy(T.hyper.position);
  T.streakM.uniforms.uT.value=t; T.streakM.uniforms.uCam.value.copy(c.position); T.edgeM.uniforms.uT.value=t; T.edgeM.uniforms.uCam.value.copy(c.position);
  T.glass.forEach((g,i)=>{ g.rotation.x+=dtR*g.userData.spin; g.rotation.y+=dtR*g.userData.spin*0.7; g.children.forEach((m,l)=>{ if(l<4) m.rotation.set(t*0.2*(l+1),t*0.15*(l+1),0); }); });
  // fragmentos: el más cercano se lee en grande
  let best=null, bd=1e9; const rp=T.root.position; for(const f of T.frags){ const dx=f.pos.x*cs+rp.x-c.position.x, dy=f.pos.y*cs+rp.y-c.position.y, dz=f.pos.z*cs+rp.z-c.position.z; const d2=dx*dx+dy*dy+dz*dz; if(d2<bd){ bd=d2; best=f; } }
  const box=$('#cz-tfrag'); if(best&&bd<64&&!T.collapse){ if(T.near!==best.id){ T.near=best.id; box.innerHTML=`<small>Fragmento ${best.id+1} del ensayo</small>“${ESSAY[best.id]}”`; } box.classList.add('on'); } else { box.classList.remove('on'); T.near=null; }
  // narración
  T.lineT+=dtR; const ln=$('#cz-tline'); if(T.lineI<TESS_LINES.length&&T.lineT>(T.lineI===0?1.5:6.5)){ ln.textContent=TESS_LINES[T.lineI]; ln.classList.remove('on'); void ln.offsetWidth; ln.classList.add('on'); T.lineI++; T.lineT=0; }
  // render con ecos 4D
  const P=T.post; renderer.setRenderTarget(P.cur); renderer.render(T.S,c);
  const prev=P.flip?P.a:P.b, next=P.flip?P.b:P.a; P.flip=!P.flip;
  P.mat.uniforms.uMode.value=0; P.mat.uniforms.tCur.value=P.cur.texture; P.mat.uniforms.tPrev.value=prev.texture; P.mat.uniforms.uDecay.value=0.84; renderer.setRenderTarget(next); renderer.render(P.scene,lensCam);
  P.mat.uniforms.uMode.value=1; P.mat.uniforms.tCur.value=next.texture; renderer.setRenderTarget(null); renderer.render(P.scene,lensCam);
}

/* ---------- supernova: bola de fuego ---------- */
const fireFS=`${FLOG}
uniform vec3 uCol; uniform float uTime; uniform float uI; varying vec3 vN; varying vec3 vP; varying vec3 vV;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
 float mu=max(dot(normalize(vN),normalize(vV)),0.0);
 float n=snoise(vP*3.0+vec3(uTime*0.3))*0.5+snoise(vP*7.0-vec3(uTime*0.5))*0.3+snoise(vP*16.0)*0.2;
 float rt=0.65+0.5*n; float limb=pow(mu,0.4);
 vec3 c=uCol*rt*limb*uI*1.6+vec3(1.0)*pow(rt,4.0)*0.25*uI;
 gl_FragColor=vec4(c,1.0);
}`;

/* ================= v5: CALIDAD, NEBULOSAS VOLUMÉTRICAS, GALAXIAS, AGUJERO NEGRO TRAZADO ================= */
const QUAL={ligera:{pr:1,steps:28,bh:110,cube:256,tex:512,cubeEvery:4,count:0.5},normal:{pr:1.5,steps:48,bh:190,cube:384,tex:1024,cubeEvery:2,count:1},ultra:{pr:2,steps:80,bh:300,cube:512,tex:2048,cubeEvery:1,count:1.3}};
function autoQual(){ const mob=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)||Math.min(screen.width,screen.height)<700; const cores=navigator.hardwareConcurrency||4; return mob||cores<=4?'ligera':'normal'; }
let qualPref=(()=>{ try{ return localStorage.getItem('cz-qual')||'auto'; }catch(e){ return 'auto'; } })();
let Q=QUAL[qualPref==='auto'?autoQual():qualPref]||QUAL.normal;
let prNow=1, ftEMA=16, ftT=0, isGL2=false, noise3D=null;
function setQual(k){ qualPref=k; try{ localStorage.setItem('cz-qual',k); }catch(e){} Q=QUAL[k==='auto'?autoQual():k]; prNow=Math.min(devicePixelRatio||1,Q.pr); renderer.setPixelRatio(prNow); onResize(); }
function dynRes(dtR){ // resolución dinámica: mantiene ~30-60 fps en cualquier equipo
  ftEMA+=(dtR*1000-ftEMA)*0.08; ftT+=dtR; if(ftT<1.2) return; ftT=0;
  const maxPR=Math.min(devicePixelRatio||1,Q.pr); let np=prNow;
  if(ftEMA>38&&prNow>0.5) np=Math.max(0.5,prNow*0.85); else if(ftEMA<22&&prNow<maxPR) np=Math.min(maxPR,prNow*1.12);
  if(Math.abs(np-prNow)>0.02){ prNow=np; renderer.setPixelRatio(prNow); onResize(); }
}
/* ---------- textura de ruido 3D (rápida en la GPU) ---------- */
function makeNoise3D(){
  const N=64, A=new Float32Array(N*N*N); for(let i=0;i<A.length;i++) A[i]=Math.random();
  const B=new Float32Array(A.length), id=(x,y,z)=>((z&63)*N+(y&63))*N+(x&63);
  for(let pass=0;pass<2;pass++){ const S=pass?B:A, D=pass?A:B;
    for(let z=0;z<N;z++) for(let y=0;y<N;y++) for(let x=0;x<N;x++){ let s=0; for(let k=-1;k<=1;k++) s+=S[id(x+k,y,z)]+S[id(x,y+k,z)]+S[id(x,y,z+k)]; D[id(x,y,z)]=s/9; } }
  let mn=1,mx=0; for(const v of A){ if(v<mn)mn=v; if(v>mx)mx=v; }
  const U=new Uint8Array(A.length); for(let i=0;i<A.length;i++) U[i]=Math.round((A[i]-mn)/(mx-mn)*255);
  const t=new THREE.DataTexture3D(U,N,N,N); t.format=THREE.RedFormat; t.type=THREE.UnsignedByteType; t.minFilter=t.magFilter=THREE.LinearFilter; t.wrapS=t.wrapT=t.wrapR=THREE.RepeatWrapping; t.unpackAlignment=1; t.needsUpdate=true; return t;
}
/* ---------- nebulosas volumétricas (raymarching) ---------- */
const volVS=`${VLOG}
varying vec3 vO; void main(){ vO=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
#include <logdepthbuf_vertex>
}`;
const volFS=`precision highp sampler3D;
${FLOG}
uniform sampler3D uN; uniform vec3 uCamO; uniform float uStyle,uSteps,uInt,uSeed,uTime;
varying vec3 vO;
float n3(vec3 p){ return texture(uN,p*0.0625).r; }
float fbm(vec3 p){ return n3(p)*0.5+n3(p*2.03+0.31)*0.27+n3(p*4.07+0.7)*0.15+n3(p*8.1+0.13)*0.08; }
float ridge(vec3 p){ float a=1.0-abs(2.0*n3(p)-1.0); float b=1.0-abs(2.0*n3(p*2.1+0.4)-1.0); return a*a*0.62+b*b*0.38; }
float sdCap(vec3 p, vec3 a, vec3 b, float ra, float rb){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-mix(ra,rb,h); }
vec4 neb(vec3 p){
 float r=length(p); vec3 q=p*1.0+uSeed; vec3 e=vec3(0.0); float ab=0.0;
 vec3 w=vec3(fbm(q*1.2),fbm(q*1.2+3.1),fbm(q*1.2+5.7))-0.5;
 if(uStyle<0.5){ // Cangrejo
   vec3 ps=p*vec3(1.0,1.38,1.15); float rs=length(ps+w*0.25);
   float fil=pow(ridge(q*3.4+w*1.6),9.0)+0.6*pow(ridge(q*6.5+w*2.5),12.0);
   float shell=smoothstep(1.0,0.78,rs)*smoothstep(0.25,0.62,rs);
   float m=fbm(q*1.6+7.0);
   vec3 fc=mix(vec3(1.0,0.38,0.12),vec3(0.75,0.25,1.0),smoothstep(0.4,0.6,m));
   fc=mix(fc,vec3(1.0,0.86,0.66),pow(fil,1.2)*0.45);
   e+=fc*fil*shell*9.0+vec3(0.45,0.15,0.55)*shell*pow(fbm(q*2.5),3.0)*0.35;
   float core=exp(-rs*rs*3.2)*(0.25+pow(fbm(q*2.0+w*2.0),1.5)*1.4);
   e+=vec3(0.38,0.55,1.0)*core*1.6+vec3(0.85,0.9,1.0)*exp(-rs*rs*25.0)*1.0;
   ab=fil*shell*1.2;
 } else if(uStyle<1.5){ // SN 185 (RCW 86)
   float ang=atan(p.y,p.x); float rr=length(p+w*0.16);
   float shell=exp(-pow((rr-0.66)/0.03,2.0)); float side=0.2+0.8*smoothstep(-0.3,0.9,cos(ang+0.9));
   float fil=pow(ridge(q*3.0),3.0);
   e+=vec3(0.2,1.0,0.65)*shell*side*(0.4+1.8*fil)*2.0;
   e+=vec3(0.12,0.22,1.0)*smoothstep(0.7,0.35,rr)*fbm(q*1.3)*0.45*(0.3+side);
   float dust=fbm(q*0.9+9.0); e+=vec3(1.0,0.2,0.05)*smoothstep(0.5,0.75,rr)*pow(dust,2.2)*1.3*smoothstep(1.0,0.82,r);
   e+=vec3(1.0,0.75,0.3)*pow(ridge(q*2.0+4.0),8.0)*smoothstep(0.55,0.8,rr)*smoothstep(1.0,0.85,r)*1.2;
 } else if(uStyle<2.5){ // SN 1006
   float rr=length(p+w*0.07); float inside=smoothstep(0.83,0.7,rr);
   float mA=fbm(q*2.4), mB=fbm(q*2.4+5.0);
   e+=vec3(1.0,0.16,0.32)*inside*pow(smoothstep(0.35,0.75,mA),2.0)*2.2;
   e+=vec3(0.25,0.42,1.0)*inside*pow(smoothstep(0.4,0.8,mB),2.0)*2.0;
   float rim=exp(-pow((rr-0.81)/0.03,2.0)); e+=vec3(0.35,0.55,1.0)*rim*(0.6+fbm(q*4.0))*2.0;
   float ne=smoothstep(0.55,0.95,dot(normalize(p),normalize(vec3(0.55,0.8,0.2))));
   e+=vec3(1.0,0.88,0.3)*exp(-pow((rr-0.825)/0.009,2.0))*ne*6.0;
 } else if(uStyle<3.5){ // SN 1604 (Kepler)
   float rr=length(p+w*0.12); float north=0.5+0.5*smoothstep(-0.6,0.8,p.y);
   float sh=exp(-pow((rr-0.66)/0.13,2.0));
   e+=vec3(1.0,0.58,0.32)*sh*pow(fbm(q*3.0),1.6)*2.2*north;
   e+=vec3(1.0,0.95,0.85)*sh*pow(ridge(q*3.4),7.0)*3.0*north;
   e+=vec3(0.7,0.25,0.2)*smoothstep(0.6,0.2,rr)*fbm(q*2.0)*0.5;
   e+=vec3(0.25,0.45,1.0)*exp(-pow((rr-0.82)/0.04,2.0))*(0.5+fbm(q*3.0))*1.6;
 } else if(uStyle<4.5){ // SN 1572 (Tycho)
   float rr=length(p+w*0.06);
   e+=vec3(0.95,0.25,0.25)*smoothstep(0.82,0.4,rr)*pow(fbm(q*3.0),2.0)*1.6;
   e+=vec3(1.0,0.7,0.3)*exp(-pow((rr-0.7)/0.08,2.0))*pow(ridge(q*3.0),4.0)*2.0;
   e+=vec3(0.3,0.5,1.0)*exp(-pow((rr-0.83)/0.035,2.0))*(0.6+fbm(q*5.0))*2.0;
 } else if(uStyle<5.5){ // Cas A
   float rr=length(p+w*0.15); float ring=exp(-pow((rr-0.55)/0.1,2.0)); float k=pow(ridge(q*4.0),5.0);
   vec3 kc=mix(vec3(0.3,1.0,0.5),vec3(1.0,0.5,0.15),smoothstep(0.35,0.65,fbm(q*2.0)));
   e+=kc*ring*k*4.0+vec3(0.3,0.4,1.0)*exp(-pow((rr-0.82)/0.04,2.0))*1.2;
 } else if(uStyle<6.5){ // SN 1987A: anillos
   float rxz=length(p.xz); float ring=exp(-pow((rxz-0.45)/0.025,2.0)-pow(p.y/0.03,2.0));
   float spots=pow(n3(vec3(atan(p.z,p.x)*6.0,0.0,1.0)),3.0);
   e+=vec3(1.0,0.8,0.85)*ring*(0.4+3.0*spots)*3.0;
   for(int k=-1;k<=1;k+=2){ float yy=p.y-float(k)*0.32; e+=vec3(1.0,0.35,0.5)*exp(-pow((length(p.xz)-0.85)/0.02,2.0)-pow(yy/0.03,2.0))*1.2; }
   e+=vec3(0.6,0.7,1.0)*exp(-r*r*40.0)*0.8;
 } else if(uStyle<7.5){ // Pilares de la Creación
   vec3 pp=p+w*0.18;
   float d=min(sdCap(pp,vec3(-0.42,-1.05,0.0),vec3(-0.30,0.72,0.05),0.21,0.11), min(sdCap(pp,vec3(0.06,-1.05,-0.05),vec3(0.12,0.12,0.0),0.15,0.08), sdCap(pp,vec3(0.5,-1.05,0.05),vec3(0.46,-0.25,0.08),0.12,0.07)));
   d+=(fbm(q*4.0)-0.5)*0.12+(fbm(q*11.0)-0.5)*0.05;
   float dens=smoothstep(0.03,-0.08,d);
   float edge=exp(-pow(d/0.018,2.0));
   float lit=smoothstep(-0.4,0.6,pp.y+0.3*pp.x)*0.8+0.2;
   e+=vec3(1.0,0.58,0.22)*edge*lit*6.0 + vec3(1.0,0.92,0.75)*edge*pow(ridge(q*7.0),5.0)*8.0*lit;
   ab+=dens*30.0;
   e+=vec3(0.22,0.1,0.04)*dens*fbm(q*5.0)*0.8;
   float box=smoothstep(1.0,0.35,length(p*vec3(0.85,0.7,1.2)));
   float gas=fbm(q*1.4+w); e+=mix(vec3(0.08,0.32,0.95),vec3(0.3,0.6,1.0),fbm(q*2.0+2.0))*(gas*gas*1.1+0.05)*box;
   e+=vec3(1.0,0.55,0.2)*pow(fbm(q*2.0+8.0),3.0)*box*0.7*smoothstep(-0.2,1.0,p.y);
 } else if(uStyle>8.5){ // Nebulosa del Águila (M16)
   vec3 pp=p+w*0.65; float rr=length(pp*vec3(0.8,1.05,1.5)); float body=smoothstep(1.0,0.3,rr);
   float cav=smoothstep(0.62,0.12,length((pp-vec3(0.1,-0.05,0.0))*vec3(1.0,0.8,1.5))+(fbm(q*2.5)-0.5)*0.4);
   float wall=body*(1.0-cav); float f=fbm(q*1.6+w*1.5); float rg=pow(ridge(q*3.2+w*2.0),5.0);
   e+=vec3(0.1,0.42,1.0)*cav*body*(0.5+f)*6.0;
   e+=vec3(1.0,0.5,0.2)*wall*pow(f,2.0)*7.0+vec3(1.0,0.75,0.45)*rg*wall*9.0*smoothstep(0.3,0.0,abs(cav-0.3));
   e+=vec3(0.9,0.45,0.2)*pow(fbm(q*1.2+20.0),2.0)*smoothstep(1.0,0.6,rr)*0.4;
   ab+=wall*smoothstep(0.5,0.75,fbm(q*3.0+11.0))*7.0;
 } else { // Nebulosa de Orión
   float rr=length(p*vec3(1.0,1.1,1.6)+w*0.35);
   float body=smoothstep(1.0,0.2,rr);
   float f=fbm(q*1.8+w*1.5); float rg=pow(ridge(q*2.6+w),4.0);
   e+=vec3(1.0,0.32,0.4)*body*f*f*1.6 + vec3(1.0,0.55,0.5)*rg*body*1.4;
   e+=vec3(0.45,0.8,0.9)*exp(-rr*rr*6.0)*f*1.2 + vec3(0.9,0.95,1.0)*exp(-rr*rr*60.0)*0.6;
   ab+=smoothstep(0.55,0.75,fbm(q*2.2+11.0))*body*4.0;
 }
 return vec4(e,ab);
}
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
#include <logdepthbuf_fragment>
 vec3 ro=uCamO, rd=normalize(vO-uCamO);
 vec3 t1=(-1.0-ro)/rd, t2=(1.0-ro)/rd; vec3 tmn=min(t1,t2), tmx=max(t1,t2);
 float t0=max(max(tmn.x,tmn.y),max(tmn.z,0.0)), tE=min(min(tmx.x,tmx.y),tmx.z);
 if(tE<=t0){ discard; }
 float ds=(tE-t0)/uSteps; float t=t0+ds*hash12(gl_FragCoord.xy);
 vec3 col=vec3(0.0); float T=1.0;
 for(int i=0;i<128;i++){ if(float(i)>=uSteps) break; vec3 p=ro+rd*t; vec4 s=neb(p); col+=T*s.rgb*ds; T*=exp(-s.a*ds); if(T<0.02) break; t+=ds; }
 gl_FragColor=vec4(col*uInt,(1.0-T));
}`;
const STYLE={sn1054:0,sn185:1,sn1006:2,sn1604:3,sn1572:4,casa:5,sn1987a:6,sn1181:4};
function makeVol(style,seed){
  if(!isGL2) return null;
  const m=smat({vertexShader:volVS,fragmentShader:volFS,uniforms:{uN:{value:noise3D},uCamO:{value:new THREE.Vector3()},uStyle:{value:style},uSteps:{value:Q.steps},uInt:{value:1},uSeed:{value:seed||Math.random()*10},uTime:{value:0}},
    transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.CustomBlending});
  m.blendEquation=THREE.AddEquation; m.blendSrc=THREE.OneFactor; m.blendDst=THREE.OneMinusSrcAlphaFactor;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),m); mesh.renderOrder=4; mesh.frustumCulled=false;
  mesh.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6); return mesh;
}
let _inv=null;
const STYLE_I=[0.35,0.8,0.8,0.45,0.6,0.7,0.8,1.0,0.8,0.55];
function updVol(mesh,inten){ inten*=STYLE_I[mesh.material.uniforms.uStyle.value]||1; _inv=_inv||new THREE.Matrix4(); mesh.updateMatrixWorld(); _inv.copy(mesh.matrixWorld).invert(); const U=mesh.material.uniforms; U.uCamO.value.set(0,0,0).applyMatrix4(_inv); U.uSteps.value=Q.steps; U.uInt.value=inten; }
function makeNebula(o){ // nebulosas de emisión fijas (Pilares, Orión)
  const pos=radec(o.ra,o.dec,o.dpc*PC); const b={id:o.id,name:o.name,kind:'neb',cat:'neb',menu:true,R:o.Rpc*PC,view:o.Rpc*PC*3.2,fixed:pos,getPos:()=>pos,info:o.info,dpc:o.dpc,glow:o.glow||[1,.6,.6],Mv:o.Mv};
  const g=new THREE.Group(); const vm=makeVol(o.style,o.seed); if(vm){ vm.rotation.set(o.rot[0],o.rot[1],o.rot[2]); g.add(vm); b.vol=vm; }
  if(o.view) b.view=o.Rpc*PC*o.view; if(vm){ const z=new THREE.Vector3(0,0,1).applyEuler(vm.rotation); b.approach=[z.x,z.y,z.z]; b.upv=new THREE.Vector3(0,1,0).applyEuler(vm.rotation); }
  b.obj=g; b.inten=o.inten||1; return addBody(b);
}
/* ---------- galaxias: discos con textura procedural de alta resolución ---------- */
const galPlaneFS=`${FLOG}
uniform sampler2D uT; uniform float uI; uniform float uDust; varying vec2 vUv;
void main(){
#include <logdepthbuf_fragment>
 vec4 c=texture2D(uT,vUv);
 if(uDust>0.5){ gl_FragColor=vec4(vec3(1.0-c.a*0.82),1.0); }
 else gl_FragColor=vec4(c.rgb*uI,1.0);
}`;
function drawGalTex(o,S){
  const em=document.createElement('canvas'); em.width=em.height=S; const x=em.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,S,S);
  const du=document.createElement('canvas'); du.width=du.height=S; const y=du.getContext('2d');
  const C=S/2, R=S*0.47, T=o.type; const k=S/1024;
  x.globalCompositeOperation='lighter';
  const dot=(ctx,px,py,r,col,a)=>{ ctx.fillStyle=`rgba(${col[0]},${col[1]},${col[2]},${a})`; ctx.fillRect(px-r/2,py-r/2,r,r); };
  const blob=(ctx,px,py,r,col,a)=>{ const g=ctx.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,`rgba(${col[0]},${col[1]},${col[2]},${a})`); g.addColorStop(1,`rgba(${col[0]},${col[1]},${col[2]},0)`); ctx.fillStyle=g; ctx.fillRect(px-r,py-r,2*r,2*r); };
  const N=Math.round(70000*Q.count*(S/1024));
  const arms=T==='SB'?2:(o.arms||2), pitch=(o.pitch||14)*D2R, r0=T==='SB'?R*0.26:R*0.07;
  const armTh=(r,k2)=>Math.log(Math.max(r,r0)/r0)/Math.tan(pitch)+k2*2*Math.PI/arms;
  if(T==='E'){ blob(x,C,C,R*0.95,[255,215,170],0.35); blob(x,C,C,R*0.45,[255,228,190],0.6); blob(x,C,C,R*0.15,[255,245,225],0.9);
    for(let i=0;i<N*0.5;i++){ const r=R*Math.pow(Math.random(),2.2), a=Math.random()*6.283; dot(x,C+Math.cos(a)*r,C+Math.sin(a)*r*(o.flat||.85),1.4*k,[255,220,180],0.12); } }
  else if(T==='Irr'){ for(let c=0;c<9;c++){ const cx=C+Math.sin(c*2.1)*R*.45, cy=C+Math.cos(c*3.3)*R*.3; blob(x,cx,cy,R*(.15+.1*Math.random()),[200,215,255],.25);
      for(let i=0;i<N/12;i++){ const px=cx+gaussian()*R*.12, py=cy+gaussian()*R*.1; const hii=Math.random()<.08; dot(x,px,py,(hii?2.5:1.3)*k,hii?[255,110,170]:[200,215,255],hii?.5:.14); } } }
  else {
    // bulbo
    const bR=T==='S0'?R*0.42:R*0.2;
    blob(x,C,C,bR*1.6,[255,210,160],0.28); blob(x,C,C,bR*0.7,[255,228,190],0.45); blob(x,C,C,bR*0.22,[255,245,230],0.7);
    if(T==='SB'){ x.save(); x.translate(C,C); x.scale(1,0.28); blob(x,0,0,r0*1.1,[255,225,180],0.45); x.restore(); }
    for(let i=0;i<N;i++){
      const inArm=Math.random()<0.62&&T!=='S0'; let r=-R*0.3*Math.log(1-Math.random()*0.985); if(r>R) continue; let th;
      if(T==='S0'){ th=Math.random()*6.283; if(Math.random()<0.55) r=R*(0.74+gaussian()*0.05); }
      else if(T==='SB'&&r<r0){ th=(Math.random()<.5?0:Math.PI)+gaussian()*0.1; r*=1; }
      else th=inArm?armTh(r,Math.floor(Math.random()*arms))+gaussian()*0.16*(1+r/R):Math.random()*6.283;
      const px=C+Math.cos(th)*r, py=C+Math.sin(th)*r; const t=r/R;
      const col=t<0.25?[255,222,180]:(inArm?[175,200,255]:[225,225,245]);
      dot(x,px,py,(inArm?2.2:1.6)*k,col,inArm?0.26:0.1);
    }
    if(T!=='S0'&&T!=='E'){ for(let i=0;i<N*0.025;i++){ const r=R*(0.18+0.8*Math.random()); const th=armTh(r,Math.floor(Math.random()*arms))+gaussian()*0.1; const hii=Math.random()<0.6;
        blob(x,C+Math.cos(th)*r,C+Math.sin(th)*r,(hii?2.2:3)*k*(1+Math.random()),hii?[255,95,160]:[150,190,255],hii?0.7:0.5); } }
    if(T==='S0'){ for(let i=0;i<N*0.03;i++){ const th=Math.random()*6.283, r=R*(0.76+gaussian()*0.035); blob(x,C+Math.cos(th)*r,C+Math.sin(th)*r,3*k,[200,220,255],0.35); } }
    // polvo
    for(let i=0;i<N*0.45;i++){ let r,th;
      if(T==='S0'){ r=R*(0.68+gaussian()*0.03); th=Math.random()*6.283; }
      else { r=R*(0.12+0.85*Math.random()); th=armTh(r,Math.floor(Math.random()*arms))-0.22+gaussian()*0.08; if(T==='SB'&&r<r0) continue; }
      y.fillStyle=`rgba(0,0,0,${T==='S0'?0.35:0.12})`; const s=(2+Math.random()*4)*k; y.fillRect(C+Math.cos(th)*r-s/2,C+Math.sin(th)*r-s/2,s,s); }
  }
  // borde suave
  x.globalCompositeOperation='destination-in'; const m=x.createRadialGradient(C,C,R*0.75,C,C,R*1.05); m.addColorStop(0,'#fff'); m.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=m; x.fillRect(0,0,S,S);
  const te=new THREE.CanvasTexture(em), td=new THREE.CanvasTexture(du); te.anisotropy=td.anisotropy=8; return [te,td];
}
function makeGalDisk(b,o){
  // o.ax/ay/az: base del disco en coordenadas ecuatoriales
  const g=new THREE.Group(); const m=new THREE.Matrix4().makeBasis(new THREE.Vector3(...o.ax),new THREE.Vector3(...o.ay),new THREE.Vector3(...o.az)); g.quaternion.setFromRotationMatrix(m);
  const planes=[], dusts=[];
  const plane=(z,dust,I)=>{ const mt=smat({vertexShader:bbVS,fragmentShader:galPlaneFS,uniforms:{uT:{value:null},uI:{value:I},uDust:{value:dust?1:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
    if(dust){ mt.blending=THREE.CustomBlending; mt.blendEquation=THREE.AddEquation; mt.blendSrc=THREE.ZeroFactor; mt.blendDst=THREE.SrcColorFactor; } else mt.blending=THREE.AdditiveBlending;
    const p=new THREE.Mesh(planeGeo,mt); p.position.z=z; p.renderOrder=dust?6:4; p.frustumCulled=false; g.add(p); (dust?dusts:planes).push(p); };
  const th=o.type==='E'?0.0:0.018; [-2,-1,0,1,2].forEach(i=>plane(i*th,false,0.32)); if(o.type!=='E'&&o.type!=='Irr') [-1,-0.5,0,0.5,1].forEach(i=>plane(i*th*(o.type==='S0'?1.2:0.6),true,1));
  const bul=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffe2b8,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:o.type==='S0'?0.9:0.55})); bul.scale.setScalar(o.type==='S0'?0.85:o.type==='E'?1.2:0.45); bul.renderOrder=5; g.add(bul);
  g.visible=false; scene.add(g);
  b.disk3={g,planes,dusts,bul,o,done:false,az:o.az};
}
function updGalDisk(b,p,k){
  const D=b.disk3; const angR=b.R/b.dist*uPx; if(window.__nodisk){ D.g.visible=false; return; }
  let a=sstep(3,18,angR)*(D.o.inFade?sstep(1.3,2.2,b.dist/b.R):sstep(0.35,1.0,b.dist/b.R))*(microwave?0.2:1)*Math.min(1,expo*1.6);
  D.g.visible=a>0.01; if(!D.g.visible) return;
  if(!D.done){ D.done=true; const [te,td]=drawGalTex(D.o,Q.tex); D.planes.forEach(p=>p.material.uniforms.uT.value=te); D.dusts.forEach(p=>p.material.uniforms.uT.value=td); }
  D.g.position.copy(p); D.g.scale.setScalar(b.R*k);
  const vdir=norm(sub(b.cur,cam)); const ci=Math.abs(dot(vdir,D.az)); const edge=Math.pow(Math.min(5,1/Math.max(ci,0.04)),0.55);
  D.planes.forEach(pl=>pl.material.uniforms.uI.value=0.5*a*edge); D.dusts.forEach(pl=>pl.visible=a>0.15); D.bul.material.opacity=(D.o.type==='S0'?0.85:0.5)*a;
}
/* ---------- agujero negro: trazado de rayos en la métrica de Schwarzschild ---------- */
const bhTraceFS=`uniform samplerCube tC; uniform mat4 uInvP; uniform mat4 uCW; uniform mat3 uToD; uniform mat3 uFromD; uniform vec3 uCP;
uniform float uRin,uRout,uDisk,uTime,uSteps,uWarn,uR0,uDbg;
varying vec2 vUv;
${NOISE}
void main(){
 vec2 nd=vUv*2.0-1.0; vec4 vp=uInvP*vec4(nd,-1.0,1.0); vec3 dv=normalize(vp.xyz/vp.w); vec3 dw=normalize(mat3(uCW)*dv);
 vec3 d=uToD*dw; vec3 p=uCP; float rc=length(p);
 if(rc>uR0){ float b=dot(p,d); float c=dot(p,p)-uR0*uR0; float disc=b*b-c;
   if(disc<0.0||b>0.0){ vec3 L=normalize(-p); float ct=dot(d,L); float st=sqrt(max(0.0,1.0-ct*ct)); float bb=rc*st; float a=(1.0/max(bb,1.0))*(1.0+ct); vec3 ax=cross(d,L); float al=length(ax); vec3 src=d; if(al>1e-6){ ax/=al; src=d*cos(a)+cross(ax,d)*sin(a); }
     gl_FragColor=vec4(textureCube(tC,uFromD*src).rgb+vec3(0.0,uDbg*0.3,0.0),1.0); return; }
   p=p+d*(-b-sqrt(disc)); }
 vec3 v=d; vec3 hv=cross(p,v); float h2=dot(hv,hv);
 vec3 col=vec3(0.0); float alpha=0.0; bool cap=false; float glowAcc=0.0;
 for(int i=0;i<400;i++){ if(float(i)>=uSteps) break;
   float r=length(p); if(r<1.0){ cap=true; break; }
   if(r>uR0*1.02&&dot(p,v)>0.0) break;
   float dt=clamp(0.07*(r-0.8),0.012,2.0);
   vec3 acc=-1.5*h2*p/pow(r,5.0); vec3 pp=p; v+=acc*dt; p+=v*dt;
   glowAcc+=exp(-pow((r-1.5)/0.05,2.0))*dt;
   if(uDisk>0.0&&pp.y*p.y<0.0){ vec3 q=mix(pp,p,pp.y/(pp.y-p.y)); float rq=length(q.xz);
     if(rq>uRin*0.92&&rq<uRout){ float ang=atan(q.z,q.x); float x=uRin/rq;
       float T=pow(x,0.75)*pow(max(0.0,1.0-sqrt(min(x,1.0))),0.25)*3.0;
       float beta=clamp(sqrt(0.5/max(rq-1.0,0.4)),0.0,0.78); vec3 ph=normalize(vec3(-q.z,0.0,q.x)); float cosA=dot(ph,-normalize(v));
       float D=sqrt(1.0-beta*beta)/(1.0-beta*cosA); float g=sqrt(max(0.0,1.0-1.0/rq));
       float rot=uTime*0.6/pow(rq/3.0,1.5); float ca=cos(ang-rot), sa=sin(ang-rot);
       float n=0.6+0.32*snoise(vec3(ca*rq*0.18,sa*rq*0.18,rq*0.9))+0.2*snoise(vec3(ca*1.2,sa*1.2,rq*2.4))+0.08*snoise(vec3(ca*3.0,sa*3.0,rq*4.5));
       float I=T*max(n,0.05)*pow(D*g,3.2)*uDisk*smoothstep(uRout,uRout*0.55,rq)*smoothstep(uRin*0.92,uRin*1.1,rq);
       float t=clamp(I*0.7,0.0,1.8);
       vec3 dc=mix(vec3(0.55,0.06,0.0),vec3(1.0,0.42,0.08),smoothstep(0.0,0.45,t)); dc=mix(dc,vec3(1.0,0.86,0.62),smoothstep(0.45,1.1,t)); dc=mix(dc,vec3(0.85,0.92,1.0),smoothstep(1.1,1.8,t)*0.5);
       float op=clamp(I*1.6+0.08*smoothstep(uRout,uRout*0.4,rq),0.0,0.97);
       col+=(1.0-alpha)*dc*min(I*1.7,4.0); alpha+=(1.0-alpha)*op; if(alpha>0.985) break; } }
 }
 vec3 bg=cap?vec3(0.0):textureCube(tC,uFromD*normalize(v)).rgb;
 float gc=1.0/sqrt(max(1e-4,1.0-1.0/max(rc,1.0001)));
 bg*=mix(vec3(1.0),vec3(0.6,0.8,1.5),clamp((gc-1.0)*0.5,0.0,1.0))*min(gc,2.0);
 col+=(1.0-alpha)*bg + vec3(1.0,0.7,0.45)*min(glowAcc*0.35,0.6)*uDisk*(1.0-alpha);
 float vg=length(nd); col*=1.0-uWarn*0.5*smoothstep(0.4,1.4,vg); col+=vec3(0.5,0.0,0.0)*uWarn*0.25*smoothstep(0.6,1.4,vg);
 gl_FragColor=vec4(col+vec3(uDbg*0.3,0.0,0.0)*(cap?2.0:1.0),1.0);
}`;
let bhTraceMat=null, bhTraceScene=null, drone=null;
function initBHTrace(){
  bhTraceMat=new THREE.ShaderMaterial({vertexShader:lensVS,fragmentShader:bhTraceFS,uniforms:{tC:{value:cubeRT.texture},uInvP:{value:new THREE.Matrix4()},uCW:{value:new THREE.Matrix4()},uToD:{value:new THREE.Matrix3()},uFromD:{value:new THREE.Matrix3()},uCP:{value:new THREE.Vector3()},uRin:{value:3},uRout:{value:24},uDisk:{value:1},uTime:{value:0},uSteps:{value:Q.bh},uWarn:{value:0},uR0:{value:40},uDbg:{value:0}},depthTest:false,depthWrite:false});
  bhTraceScene=new THREE.Scene(); const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bhTraceMat); q.frustumCulled=false; bhTraceScene.add(q);
}
function bhFrame(b){ // base del disco: X, N (normal), Z
  const dq=b.disk?b.disk.quaternion:new THREE.Quaternion(); const X=new THREE.Vector3(1,0,0).applyQuaternion(dq), N=new THREE.Vector3(0,0,1).applyQuaternion(dq), Z=new THREE.Vector3().crossVectors(X,N);
  return [X,N,Z];
}
function droneSet(level){ // zumbido grave y creciente al acercarse a un agujero negro
  try{ if(level<=0.001){ if(drone) drone.g.gain.setTargetAtTime(0,drone.ac.currentTime,0.3); return; }
    if(!drone){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; const ac=new AC(); const g=ac.createGain(); g.gain.value=0; g.connect(ac.destination);
      const o1=ac.createOscillator(), o2=ac.createOscillator(), o3=ac.createOscillator(); o1.type='sine'; o1.frequency.value=38; o2.type='sawtooth'; o2.frequency.value=38.7; o3.type='sine'; o3.frequency.value=57;
      const f=ac.createBiquadFilter(); f.type='lowpass'; f.frequency.value=180; o2.connect(f); f.connect(g); o1.connect(g); o3.connect(g); o1.start(); o2.start(); o3.start(); drone={ac,g,o3}; }
    if(drone.ac.state==='suspended') drone.ac.resume(); drone.g.gain.setTargetAtTime(Math.min(0.22,level*0.22),drone.ac.currentTime,0.4); drone.o3.frequency.setTargetAtTime(57-level*15,drone.ac.currentTime,0.5);
  }catch(e){} }
let soundOn=true;

const galVolFS=`precision highp sampler3D;
${FLOG}
uniform sampler3D uN; uniform vec3 uCamO; uniform float uSteps,uInt,uThk,uType,uArms,uPitch,uSeed;
varying vec3 vO;
float n3(vec3 p){ return texture(uN,p*0.0625).r; }
float fbm(vec3 p){ return n3(p)*0.5+n3(p*2.03+0.31)*0.27+n3(p*4.07+0.7)*0.15+n3(p*8.1+0.13)*0.08; }
float ridge(vec3 p){ float a=1.0-abs(2.0*n3(p)-1.0); return a*a; }
vec4 gal(vec3 p){
 vec3 q=vec3(p.xy,p.z*uThk); float r=length(p.xy); float th=atan(p.y,p.x); vec3 e=vec3(0.0); float ab=0.0;
 if(uType>3.5){ float rr=length(q*vec3(1.0,1.2,1.25)); e=vec3(1.0,0.83,0.64)*(exp(-rr/0.03)*10.0+exp(-rr/0.16)*4.0)*smoothstep(1.0,0.5,rr); return vec4(e,0.0); }
 vec3 sp=p*vec3(1.0,1.0,uThk)+uSeed;
 vec2 w=vec2(fbm(sp*3.0),fbm(sp*3.0+3.1))-0.5;
 float rw=r+w.x*0.06; float zh=0.01+0.025*r; float zf=exp(-abs(q.z)/zh);
 float edgeR=smoothstep(1.0,0.72,r);
 float disk=exp(-rw/0.3)*zf*edgeR;
 float rb0=uType>0.5&&uType<1.5?0.24:0.06;
 float lr=log(max(rw,rb0)/rb0);
 float phase=uArms*(th+w.y*0.7)-uArms*lr/tan(uPitch);
 float arm=uType>2.5?smoothstep(0.42,0.75,fbm(sp*4.0)):(uType>1.5?0.35:pow(0.5+0.5*cos(phase),1.6));
 float lane=uType>1.5?0.0:pow(0.5+0.5*cos(phase+0.55),7.0);
 float inner=smoothstep(rb0*0.7,rb0*1.5,r)*edgeR;
 float bar=0.0; if(uType>0.5&&uType<1.5){ bar=exp(-pow(p.x/0.26,2.0)-pow(p.y/0.055,2.0))*zf; }
 float fil=pow(ridge(sp*vec3(9.0,9.0,9.0)+vec3(w*2.0,0.0)),3.0);
 float clump=0.35+1.3*fbm(sp*vec3(7.0,7.0,7.0)+3.3); arm*=clump;
 if(uType<1.5){ float spur=pow(0.5+0.5*cos(phase*1.0+6.0*(fbm(sp*2.5+9.0)-0.5)+1.6),5.0)*smoothstep(0.35,0.65,fbm(sp*3.5+1.0)); arm=max(arm,spur*0.8*clump); }
 e+=vec3(0.45,0.62,1.0)*disk*(0.6+2.4*arm*inner)*5.0;
 e+=vec3(1.0,0.48,0.15)*disk*arm*inner*(0.3+fil*5.0)*4.0;
 float k=smoothstep(0.74,0.88,n3(sp*vec3(30.0)))*arm*inner*zf;
 e+=vec3(1.0,0.32,0.55)*k*14.0+vec3(0.7,0.85,1.0)*3.0*smoothstep(0.8,0.92,n3(sp*vec3(41.0)+7.0))*arm*inner*zf*3.0;
 float rb=length(q); float bs=uType>1.5&&uType<2.5?2.2:1.0;
 e+=vec3(1.0,0.86,0.66)*(exp(-rb/0.02)*10.0+exp(-rb/(0.07*bs))*2.4*bs);
 e+=vec3(1.0,0.84,0.6)*bar*4.0;
 ab=zf*exp(-rw/0.5)*(lane*inner*(0.3+fil*1.5)*3.0+0.03)*edgeR*22.0;
 if(uType>1.5&&uType<2.5){ float ring=exp(-pow((r-0.74)/0.045,2.0)); ab+=zf*ring*(0.5+fbm(sp*12.0))*90.0; e+=vec3(0.75,0.82,1.0)*zf*exp(-pow((r-0.78)/0.06,2.0))*0.8; }
 return vec4(e,ab);
}
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
#include <logdepthbuf_fragment>
 vec3 ro=uCamO, rd=normalize(vO-uCamO);
 vec3 t1=(-1.0-ro)/rd, t2=(1.0-ro)/rd; vec3 tmn=min(t1,t2), tmx=max(t1,t2);
 float t0=max(max(tmn.x,tmn.y),max(tmn.z,0.0)), tE=min(min(tmx.x,tmx.y),tmx.z);
 if(tE<=t0) discard;
 float ds=(tE-t0)/uSteps; float t=t0+ds*hash12(gl_FragCoord.xy); vec3 col=vec3(0.0); float T=1.0;
 for(int i=0;i<160;i++){ if(float(i)>=uSteps) break; vec4 s=gal(ro+rd*t); col+=T*s.rgb*ds; T*=exp(-s.a*ds); if(T<0.02) break; t+=ds; }
 gl_FragColor=vec4(col*uInt,1.0-T);
}`;
const GTYPE={S:0,SB:1,S0:2,Irr:3,E:4};
function makeGalVol(b,o){
  const T=GTYPE[o.type]||0; const thk=T===4?0.85:T===3?0.25:T===2?0.16:0.11;
  const m=smat({vertexShader:volVS,fragmentShader:galVolFS,uniforms:{uN:{value:noise3D},uCamO:{value:new THREE.Vector3()},uSteps:{value:Q.steps*1.3},uInt:{value:0.5},uThk:{value:thk},uType:{value:T},uArms:{value:o.arms||2},uPitch:{value:(o.pitch||14)*D2R},uSeed:{value:Math.random()*20}},transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.CustomBlending});
  m.blendEquation=THREE.AddEquation; m.blendSrc=THREE.OneFactor; m.blendDst=THREE.OneMinusSrcAlphaFactor;
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2),m); mesh.frustumCulled=false; mesh.renderOrder=4;
  const g=new THREE.Group(); g.add(mesh); const M=new THREE.Matrix4().makeBasis(new THREE.Vector3(...o.ax),new THREE.Vector3(...o.ay),new THREE.Vector3(...o.az)); g.quaternion.setFromRotationMatrix(M); g.visible=false; scene.add(g);
  b.gvol={g,mesh,thk,o};
}
function makeGalAny(b,o){ if(isGL2) makeGalVol(b,o); else makeGalDisk(b,o); }
function updGalVol(b,p,k){
  const G=b.gvol; const angR=b.R/b.dist*uPx; let a=sstep(1.5,8,angR)*(G.o.inFade?sstep(1.25,2.0,b.dist/b.R):1)*(microwave?0.2:1)*Math.min(1,expo*1.6);
  G.g.visible=a>0.01; if(!G.g.visible) return;
  G.g.position.copy(p); G.g.scale.set(b.R*k,b.R*k,b.R*k*G.thk);
  G.g.updateMatrixWorld(); _inv=_inv||new THREE.Matrix4(); _inv.copy(G.mesh.matrixWorld).invert(); const U=G.mesh.material.uniforms; U.uCamO.value.set(0,0,0).applyMatrix4(_inv); U.uSteps.value=Math.round(Q.steps*1.3); U.uInt.value=0.8*a;
}
/* ================= INIT ================= */
let skyMats=[], orbitLines=[], lensRT=null, lensMat=null, lensScene=null, lensCam=null;
function init(){
  const box=$('#cz');
  renderer=new THREE.WebGLRenderer({antialias:Q.pr>1,logarithmicDepthBuffer:true,powerPreference:'high-performance'});
  isGL2=renderer.capabilities.isWebGL2; if(isGL2) noise3D=makeNoise3D(); prNow=Math.min(devicePixelRatio||1,Q.pr);
  renderer.setPixelRatio(prNow); box.insertBefore(renderer.domElement,box.firstChild);
  scene=new THREE.Scene(); camera=new THREE.PerspectiveCamera(60,1,1e-3,1e8); camQ=new THREE.Quaternion();
  sphereGeo=new THREE.SphereGeometry(1,128,64); planeGeo=new THREE.PlaneGeometry(2,2); glowTex=glowTexture(); flareTex=flareTexture();
  scene.add(new THREE.AmbientLight(0x101418,1)); sunLight=new THREE.PointLight(0xffffff,1.35,0,0); scene.add(sunLight);
  skyMats=buildGalaxy();
  lensRT=new THREE.WebGLRenderTarget(4,4); lensMat=new THREE.ShaderMaterial({vertexShader:lensVS,fragmentShader:lensFS,uniforms:{tS:{value:null},uC:{value:new THREE.Vector2(.5,.5)},uRe:{value:0},uAsp:{value:1},uSh:{value:0}},depthTest:false,depthWrite:false});
  lensScene=new THREE.Scene(); const lq=new THREE.Mesh(new THREE.PlaneGeometry(2,2),lensMat); lq.frustumCulled=false; lensScene.add(lq); lensCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  // ---- Sol
  makeStar({id:'sun',name:'Sol',cat:'solar',pos:[0,0,0],R:1,T:5772,Mv:4.83,info:'Nuestra estrella. La luz tarda 8 min 20 s en llegar a la Tierra. Para Egipto, Ra cruzaba el cielo en una barca.',pole:[286.13,63.87],rotH:25.38*24});
  // ---- planetas
  for(const p of PLAN){
    const [id,name,el,R,pole,rot,alb,col]=p;
    const b=planetBody(id,name,R,col,id,{cat:'solar',el,pole:poleQuat(pole[0],pole[1]),rotH:rot,alb,info:PINFO[id]});
    b.getPos=jd=>keplerPlanet(el,jd);
    if(id==='earth'){ atmo(b,[0.3,0.55,1.0],1.5,1.03); b.pole=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1)); }
    if(id==='venus') atmo(b,[1.0,0.85,0.5],1.1,1.04);
    if(id==='mars') atmo(b,[1.0,0.6,0.4],0.6,1.02);
    if(id==='uranus'||id==='neptune') atmo(b,[0.5,0.8,1.0],0.8,1.025);
    if(id==='saturn'){ const rg=new THREE.RingGeometry(74658/58232,140300/58232,256,4); const rm=smat({vertexShader:ringVS,fragmentShader:ringFS,uniforms:{uLit:{value:1},uSunL:{value:new THREE.Vector3(0,0,1)},uRT:{value:null},uHasRT:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide});
      const ring=new THREE.Mesh(rg,rm); ring.rotation.x=-Math.PI/2; b.ringHolder=new THREE.Group(); b.ringHolder.add(ring); b.obj.add(b.ringHolder); b.ringMat=rm; }
    // órbita
    const og=new THREE.BufferGeometry(); og.setAttribute('position',new THREE.BufferAttribute(new Float32Array(361*3),3));
    const ol=new THREE.Line(og,new THREE.LineBasicMaterial({color:new THREE.Color(col),transparent:true,opacity:.35,depthWrite:false})); ol.frustumCulled=false; scene.add(ol);
    orbitLines.push({b,line:ol,pts:null,jd:-1e9});
  }
  const E=byId.earth, J=byId.jupiter, Sa=byId.saturn;
  const moon=planetBody('moon','Luna',1737.4,'#bdbdbd','moon',{cat:'solar',alb:.12,info:'Los mayas agrupaban lunaciones para anticipar eclipses: la tabla del Códice de Dresde abarca 405 lunaciones (≈ 11.960 días = 46 tzolk\'in).',pole:poleQuat(270,66.5),rotH:655.7,parent:E});
  moon.getPos=jd=>add(E.cur,moonGeo(jd));
  const sats=[['io','Ío',J,421700,1.769,1821.6,'io'],['europa','Europa',J,671034,3.551,1560.8,'europa'],['ganymede','Ganímedes',J,1070412,7.155,2634.1,'ganymede'],['callisto','Calisto',J,1882709,16.689,2410.3,'callisto'],['titan','Titán',Sa,1221870,15.945,2574.7,'titan']];
  sats.forEach(([id,name,par,a,P,R,tex],i)=>{ const b=planetBody(id,name,R,'#cccccc',tex,{cat:'moons',alb:.5,parent:par,info:id==='titan'?'La luna de Saturno con atmósfera densa de nitrógeno.':'Una de las lunas galileanas de Júpiter (posiciones aproximadas).'});
    b.getPos=jd=>{ const ang=2*Math.PI*((jd-J2000)/P)+i*1.7; const q=par.pole; const v=new THREE.Vector3(Math.cos(ang)*a,0,Math.sin(ang)*a).applyQuaternion(q); return add(par.cur,[v.x,v.y,v.z]); };
    if(id==='titan') atmo(b,[1.0,0.65,0.25],1.2,1.08); });
  // ---- estrellas
  for(const s of STARS){
    const [id,name,ra,dec,d,V,R0,T,cat,info]=s;
    const pos=radec(ra,dec,d*PC);
    let R=R0, Mv;
    if(R){ Mv=MvFromRT(R,T); } else { Mv=V-5*Math.log10(d/10); R=RfromMvT(Mv,T); }
    makeStar({id,name,cat,pos,R,T,Mv,info,menu:cat!=='bg',kind:'star',dpc:d});
  }
  // Alfa Centauri A+B (binaria real)
  { const ctr=radec(219.9021,-60.8340,1.338*PC); const [u,v]=basisFor(ctr,0.6); const P=79.91*365.25, a=23.4*AU, e=0.5179, tp=yearToJD(1955.56);
    makeStar({id:'acena',name:'Alfa Centauri A',cat:'near',pos:ctr,R:1.22,T:5790,Mv:MvFromRT(1.22,5790),info:'Estrella gemela del Sol en el sistema más cercano, junto con Alfa Centauri B y Próxima. Órbita de 79,9 años.',getPos:jd=>add(ctr,mul(binaryOffset(jd,P,a,e,tp,u,v),-0.45))});
    // planetas del sistema de Alfa Centauri
    const orbitP=(star,a,P,i0,ph)=>{ const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(i0,ph,0)); return jd=>{ const s0=byId[star].cur; const an=2*Math.PI*((jd-J2000)/P)+ph*3; const v=new THREE.Vector3(Math.cos(an)*a*AU,0,Math.sin(an)*a*AU).applyQuaternion(q); return add(s0,[v.x,v.y,v.z]); }; };
    setTimeout(()=>{},0);
    const PLX=[['proxb','Próxima b',6800,'#8a7a6a','proxb','proxima',0.04857,11.186,'Planeta rocoso de ~1,1 masas terrestres en la zona habitable de Próxima Centauri: el exoplaneta más cercano a nosotros (4,2 años luz). Probablemente tiene acoplamiento de marea: un lado siempre de día y otro siempre de noche. Su superficie aquí es una ilustración.'],
      ['proxd','Próxima d',5100,'#8f8174','mercury','proxima',0.02885,5.122,'Planeta muy pequeño (~¼ de la masa terrestre) y muy cercano a su estrella, confirmado en 2022.'],
      ['proxc','Próxima c (candidato)',14000,'#9aa8b8','neptune','proxima',1.49,1928,'Candidato a planeta frío de ~7 masas terrestres; su existencia todavía se discute.'],
      ['acenab','Alfa Centauri A b (candidato)',62000,'#d8c08a','saturn','acena',2.0,980,'Posible gigante gaseoso parecido a Saturno detectado por el telescopio James Webb en 2025; falta confirmarlo. Su órbita es aproximada.']];
    PLX.forEach(([id,nm,R,col,tex,star,a,P,inf],i)=>{ const b=planetBody(id,nm,R,col,tex,{cat:'near',alb:.3,info:inf,lightFrom:star,rotH:P*24}); b.getPos=orbitP(star,a,P,0.4+i*0.15,i*1.7); if(id==='proxb') atmo(b,[0.6,0.5,1.0],0.7,1.025); });
    makeStar({id:'acenb',name:'Alfa Centauri B',cat:'near',pos:ctr,R:0.86,T:5260,Mv:MvFromRT(0.86,5260),info:'Compañera de Alfa Centauri A. Juntas son el tercer punto más brillante del cielo nocturno.',getPos:jd=>add(ctr,mul(binaryOffset(jd,P,a,e,tp,u,v),0.55))}); }
  // Sirio B (enana blanca)
  { const S=byId.sirius; const ctr=S.fixed; const [u,v]=basisFor(ctr,1.2); const P=50.13*365.25,a=19.8*AU,e=0.5923,tp=yearToJD(1994.57);
    S.getPos=jd=>add(ctr,mul(binaryOffset(jd,P,a,e,tp,u,v),-0.33));
    makeStar({id:'siriusb',name:'Sirio B',cat:'dead',pos:ctr,R:0.0084,T:25000,Mv:11.18,info:'Enana blanca: tiene la masa del Sol en un tamaño parecido al de la Tierra. Es lo que queda de una estrella que murió sin explotar. Una enana blanca así, con una compañera, puede terminar como supernova Ia.',getPos:jd=>add(ctr,mul(binaryOffset(jd,P,a,e,tp,u,v),0.67))}); }
  // Algol (binaria eclipsante, ligada al Calendario de El Cairo)
  { const ctr=radec(47.0422,40.9556,28*PC); const [u,v]=basisFor(ctr,0.15); const P=2.867328, a=0.062*AU, tp=2451545.0;
    makeStar({id:'algola',name:'Algol',cat:'civ',pos:ctr,R:2.73,T:12550,Mv:MvFromRT(2.73,12550),info:'Binaria eclipsante: cada 2,867 días la estrella oscura pasa frente a la brillante y Algol baja de brillo. Jetsu et al. propusieron que el Calendario de El Cairo (c. 1200 a.C.) contiene un periodo de 2,850 días (hipótesis debatida). Pon el tiempo a «1 s = 1 h» y mírala.',getPos:jd=>add(ctr,mul(binaryOffset(jd,P,a,0,tp,u,v),-0.18))});
    makeStar({id:'algolb',name:'Algol B',cat:'civ',menu:false,pos:ctr,R:3.48,T:4500,Mv:MvFromRT(3.48,4500),info:'Subgigante naranja que eclipsa a Algol A.',getPos:jd=>add(ctr,mul(binaryOffset(jd,P,a,0,tp,u,v),0.82))}); }
  // ---- supernovas
  SNE.forEach(makeSN);
  makeNebula({id:'m16',name:'Nebulosa del Águila (M16)',ra:274.716,dec:-13.78,dpc:1740,Rpc:10,view:2.0,style:9,rot:[0.05,0.1,0.0],seed:5.3,inten:1.0,Mv:-6,glow:[.6,.7,1],info:'Enorme nube de gas de unos 70 × 55 años luz, a 5.700 años luz, en la constelación de la Serpiente. En su centro, el cúmulo joven NGC 6611 (de apenas 1 a 2 millones de años) ilumina y talla el gas: de ahí nacen los Pilares de la Creación. Colores según la «paleta Hubble»: azul = oxígeno, naranja = hidrógeno y azufre.'});
  makeNebula({id:'pillars',name:'Pilares de la Creación (M16)',ra:274.700,dec:-13.807,dpc:1740,Rpc:1.6,view:2.3,style:7,rot:[0.15,0.3,0.0],seed:3.7,inten:1.1,Mv:-4,glow:[1,.7,.5],info:'Columnas de gas y polvo frío de unos 4 años luz de alto en la Nebulosa del Águila, a unos 5.700 años luz. Por dentro nacen estrellas; la luz ultravioleta de estrellas jóvenes cercanas va evaporando sus puntas (los bordes brillantes). Hubble los fotografió en 1995 y en 2014; el James Webb, en 2022.'});
  { const c=eq2gal(radec(274.70,-13.80,1740)); const arr=[]; for(let i=0;i<260;i++){ const r=Math.abs(gaussian())*3.0; const th=Math.acos(2*Math.random()-1), ph=Math.random()*6.283; arr.push(add(c,[r*Math.sin(th)*Math.cos(ph),r*Math.sin(th)*Math.sin(ph),r*Math.cos(th)]),-1+Math.random()*6,Math.random()<.7?[.62,.75,1]:[1,.9,.75]); } const mt=skyLayer(arr,0,3); mt.uniforms.uNoExt.value=1; mt.uniforms.uG2E.value.copy(G2E); skyMats.push(mt); }
  makeNebula({id:'m42',name:'Nebulosa de Orión (M42)',ra:83.822,dec:-5.391,dpc:412,Rpc:3.6,view:2.2,style:8,rot:[0.4,0.2,0.1],seed:8.1,inten:1.8,Mv:-5,glow:[1,.55,.65],info:'La guardería de estrellas más cercana, a 1.340 años luz, justo debajo del cinturón de Orión, la constelación que los egipcios veían como Osiris. Se ve a simple vista como una mancha difusa en la «espada» de Orión. En su centro, las estrellas del Trapecio iluminan el gas.'});
  ({fbet:'betelgeuse',fant:'antares',feta:'etacar',frho:'rhocas',fik:'ikpeg'}); Object.entries({fbet:'betelgeuse',fant:'antares',feta:'etacar',frho:'rhocas',fik:'ikpeg'}).forEach(([a,c])=>byId[a].starId=c);
  byId.sn1054.child='crabpsr';
  // ---- estrellas de neutrones
  makeNS({id:'crabpsr',name:'Púlsar del Cangrejo',cat:'dead',pos:radec(83.6332,22.0145,2000*PC),P:0.0334,Mv:3.4,tilt:50,info:'Estrella de neutrones de unos 12 km de radio que gira 30 veces por segundo (P = 33,4 ms). Pierde energía de rotación a ≈ 4,5 × 10³⁸ erg/s, unas 100.000 veces la luminosidad del Sol: eso alimenta la nebulosa. Nació en la supernova de 1054.'});
  makeNS({id:'vela',name:'Púlsar de Vela',cat:'dead',pos:radec(128.8359,-45.1764,287*PC),P:0.0893,Mv:6,tilt:40,info:'Púlsar joven (~11.000 años) que gira 11 veces por segundo. Es famoso por sus «glitches»: pequeños saltos repentinos de velocidad.'});
  makeNS({id:'j0437',name:'PSR J0437−4715',cat:'dead',pos:radec(69.3166,-47.2525,156.8*PC),P:0.005757,Mv:8,tilt:30,info:'Púlsar de milisegundos: gira 174 veces por segundo. Es uno de los relojes naturales más precisos que se conocen.'});
  makeNS({id:'sgr1806',name:'SGR 1806−20 (magnetar)',cat:'dead',mag:true,pos:radec(272.1638,-20.4110,8700*PC),P:7.55,Mv:9,tilt:20,info:'Magnetar: estrella de neutrones con un campo magnético de ~10¹⁵ gauss, mil billones de veces el de la Tierra. El 27 de diciembre de 2004 su llamarada gigante alteró la ionosfera terrestre desde unos 28.000 años luz. Distancia incierta.'});
  makeNS({id:'sgr1935',name:'SGR 1935+2154 (magnetar)',cat:'dead',mag:true,pos:radec(293.7316,21.8968,9000*PC),P:3.245,Mv:9,tilt:25,info:'En 2020 emitió un estallido rápido de radio (FRB): la primera vez que se vio uno en nuestra galaxia. Distancia incierta.'});
  // ---- agujeros negros
  const sgr=radec(266.4168,-29.0078,8178*PC);
  const sgrA=makeBH({id:'sgra',name:'Sagitario A*',cat:'bh',pos:sgr,M:4.15e6,disk:0.35,outer:18,normal:[0.2,0.7,0.6],Mv:0,info:'El agujero negro supermasivo del centro de la Vía Láctea: 4,15 millones de masas solares. Su horizonte mide ≈ 12 millones de km (0,08 UA). Su disco es tenue: es un agujero negro «hambriento». Mira la estrella S2 orbitándolo cada 16 años.'});
  makeBH({id:'cygx1',name:'Cygnus X-1',cat:'bh',pos:radec(299.5903,35.2016,2220*PC),M:21.2,disk:1.7,outer:40,normal:[0.5,0.3,0.8],Mv:-1,getPos:jd=>add(byId.cygx1.fixed,mul(binaryOffset(jd,5.5998,0.2*AU,0,2451545,...basisFor(byId.cygx1.fixed,0.7)),0.66)),info:'El primer agujero negro estelar identificado (1964–1971): 21 masas solares. Su horizonte mide solo ~63 km. Arranca gas de su compañera supergigante azul, que forma un disco caliente que brilla en rayos X.'});
  { const c=byId.cygx1.fixed; const [u,v]=basisFor(c,0.7); { const B=byId.cygx1, nn=norm(cross(u,v)); B.disk.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...nn)); B.diskN=nn; B.upv=new THREE.Vector3(...nn); } makeStar({id:'hde226868',name:'HDE 226868',cat:'bh',menu:false,pos:c,R:22,T:31000,Mv:MvFromRT(22,31000),info:'Supergigante azul compañera de Cygnus X-1.',getPos:jd=>add(c,mul(binaryOffset(jd,5.5998,0.2*AU,0,2451545,u,v),-0.34))}); }
  makeBH({id:'gaiabh1',name:'Gaia BH1',cat:'bh',pos:radec(262.1712,-0.5809,480*PC),M:9.6,disk:0,info:'El agujero negro conocido más cercano a la Tierra: ~1.560 años luz. Está «dormido»: no tiene disco y se descubrió por el movimiento de su estrella compañera, parecida al Sol.'});
  { const c=byId.gaiabh1.fixed; const [u,v]=basisFor(c,1.0); byId.gaiabh1.getPos=jd=>add(c,mul(binaryOffset(jd,185.6,1.4*AU,0.45,2451545,u,v),0.09));
    makeStar({id:'gaiabh1s',name:'Gaia BH1 (estrella)',cat:'bh',menu:false,pos:c,R:1.0,T:5850,Mv:MvFromRT(1,5850),info:'Estrella parecida al Sol que orbita el agujero negro Gaia BH1.',getPos:jd=>add(c,mul(binaryOffset(jd,185.6,1.4*AU,0.45,2451545,u,v),-0.91))}); }
  makeBH({id:'gaiabh3',name:'Gaia BH3',cat:'bh',pos:radec(294.828,14.9318,590*PC),M:33,disk:0,info:'El agujero negro estelar más masivo de nuestra galaxia conocido (33 masas solares), descubierto en 2024 por el satélite Gaia. Está dormido.'});
  makeBH({id:'m87',name:'M87*',cat:'bh',pos:radec(187.7059,12.3911,16.8e6*PC),M:6.5e9,disk:1.1,outer:22,normal:[0.2,-0.4,1],jet:true,Mv:-8,info:'Agujero negro supermasivo de la galaxia M87: 6.500 millones de masas solares. Su horizonte es más grande que la órbita de Plutón. Fue el primero fotografiado (Event Horizon Telescope, 2019). Lanza un chorro de partículas casi a la velocidad de la luz.'});
  // S2 orbitando Sgr A*
  { const c=sgr, los=norm(c), east=norm(cross([0,0,1],los)), north=cross(los,east);
    const a=1031*AU,e=0.884,P=16.05*365.25,tp=yearToJD(2018.38),i=134.2*D2R,Om=228.2*D2R,w=66.3*D2R;
    makeStar({id:'s2',name:'Estrella S2',cat:'bh',pos:c,R:6,T:28000,Mv:MvFromRT(6,28000),info:'Estrella que orbita Sagitario A* cada 16 años, llegando a 120 UA del agujero negro a casi 7.700 km/s. Su órbita demostró la existencia del agujero negro (Nobel de Física 2020).',
      getPos:jd=>{ const M=2*Math.PI*(((jd-tp)/P)%1); let E=M; for(let k=0;k<12;k++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E)); const nu=2*Math.atan2(Math.sqrt(1+e)*Math.sin(E/2),Math.sqrt(1-e)*Math.cos(E/2)); const r=a*(1-e*Math.cos(E));
        const X=r*(Math.cos(Om)*Math.cos(w+nu)-Math.sin(Om)*Math.sin(w+nu)*Math.cos(i)), Y=r*(Math.sin(Om)*Math.cos(w+nu)+Math.cos(Om)*Math.sin(w+nu)*Math.cos(i)), Z=r*Math.sin(w+nu)*Math.sin(i);
        return [c[0]+north[0]*X+east[0]*Y+los[0]*Z,c[1]+north[1]*X+east[1]*Y+los[1]*Z,c[2]+north[2]*X+east[2]*Y+los[2]*Z]; }}); }
  // ---- galaxia (puntos virtuales)
  const gcPos=gal2eq([8178*PC,0,-20*PC]);
  const mwb=addBody({id:'mwview',name:'Vía Láctea (vista desde fuera)',kind:'gal',cat:'gal',menu:true,R:15000*PC,view:30000*PC,fixed:gcPos,getPos:()=>gcPos,approach:norm(add(GAL_N_EQ,mul(norm(sub([0,0,0],gcPos)),0.5))),info:'Nuestra galaxia: un disco de unos 100.000 años luz con brazos espirales y una barra central. El Sol está a unos 26.700 años luz del centro. Desde dentro la vemos como una franja en el cielo, que los mayas relacionaban con la ceiba sagrada y los egipcios quizá con la diosa Nut.'});
  makeGalAny(mwb,{type:'SB',arms:4,pitch:12.5,inFade:true,ax:norm(gal2eq([1,0,0])),ay:norm(gal2eq([0,1,0])),az:GAL_N_EQ});
  const GINFO={m31:['Andrómeda (M31)','La gran galaxia vecina, a 2,5 millones de años luz. La luz que ves salió cuando aún no existían los humanos modernos. Chocará con la Vía Láctea en unos 4.500 millones de años.'],lmc:['Gran Nube de Magallanes','Galaxia satélite a 160.000 años luz. Allí explotó SN 1987A y vive R136a1, la estrella más masiva conocida.']};
  for(const gx of REAL_GAL){ const nm=gx.name||GINFO[gx.id][0], inf=gx.info||GINFO[gx.id][1]; const p=radec(gx.ra,gx.dec,gx.dist*PC); const gb=addBody({id:gx.id,name:nm,kind:'gal',cat:'gal',menu:true,R:gx.R*PC,view:gx.R*PC*1.7,fixed:p,getPos:()=>p,info:inf,dpc:gx.dist}); makeGalAny(gb,Object.assign({},gx,galBasisEq(gx))); gb.approach=norm(add(mul(galBasisEq(gx).az,gx.type==='S0'?0.03:0.42),mul(norm(sub([0,0,0],p)),0.6))); }
  // TON 618 y púlsares nuevos
  makeBH({id:'ton618',name:'TON 618',cat:'bh',pos:radec(186.6017,31.4685,5.58e9*PC),M:6.6e10,disk:1.7,outer:30,normal:[0.3,0.5,1],jet:true,Mv:-30.4,info:'Uno de los agujeros negros más masivos conocidos: unas 66.000 millones de masas solares (estimación). Su horizonte mide unas 1.300 UA, unas 40 veces la órbita de Neptuno. Es un cuásar: su disco brilla como billones de soles. Su luz viajó 10.800 millones de años; hoy está a unos 18.000 millones de años luz por la expansión del universo.'});
  makeNS({id:'b1919',name:'PSR B1919+21 (el primer púlsar)',cat:'dead',pos:radec(290.437,21.884,700*PC),P:1.3373,Mv:9,tilt:40,info:'Descubierto por Jocelyn Bell en 1967. Sus pulsos eran tan regulares que lo apodaron «LGM-1» («hombrecitos verdes»). Distancia aproximada.'});
  makeNS({id:'geminga',name:'Geminga',cat:'dead',pos:radec(98.4757,17.7703,250*PC),P:0.2371,Mv:9,tilt:50,info:'Púlsar cercano que brilla sobre todo en rayos gamma. Su nombre significa «no está» en dialecto milanés.'});
  makeNS({id:'j1748',name:'PSR J1748−2446ad (el más rápido)',cat:'dead',pos:radec(267.0204,-24.779,5900*PC),P:0.001396,Mv:9,tilt:30,info:'El púlsar que gira más rápido conocido: 716 vueltas por segundo. Su ecuador se mueve a casi un cuarto de la velocidad de la luz. Vive en el cúmulo globular Terzan 5.'});
  { const c=radec(288.8671,16.1076,6400*PC); const [u,v]=basisFor(c,0.8); const P=7.752/24, a=1.95e6, e=0.617;
    makeNS({id:'b1913',name:'PSR B1913+16 (Hulse–Taylor)',cat:'dead',pos:c,P:0.059,Mv:9,tilt:35,info:'Dos estrellas de neutrones que se orbitan cada 7,75 horas. Su órbita se encoge porque emiten ondas gravitacionales, como predijo Einstein (Nobel de Física 1993).'});
    byId.b1913.getPos=jd=>add(c,mul(binaryOffset(jd,P,a,e,2451545,u,v),-0.5));
    makeNS({id:'b1913b',name:'Compañera de Hulse–Taylor',cat:'dead',menu:false,pos:c,P:2,Mv:12,tilt:20}); byId.b1913b.getPos=jd=>add(c,mul(binaryOffset(jd,P,a,e,2451545,u,v),0.5)); }
  { const c=radec(114.4635,-30.6613,735*PC); const [u,v]=basisFor(c,0.1); const P=2.454/24, a=8.8e5;
    makeNS({id:'j0737',name:'PSR J0737−3039 (púlsar doble)',cat:'dead',pos:c,P:0.0227,Mv:9,tilt:40,info:'El único sistema conocido donde las dos estrellas de neutrones son púlsares. Se orbitan cada 2,45 horas y se eclipsan.'});
    byId.j0737.getPos=jd=>add(c,mul(binaryOffset(jd,P,a,0.088,2451545,u,v),-0.5));
    makeNS({id:'j0737b',name:'Púlsar B',cat:'dead',menu:false,pos:c,P:2.77,Mv:12,tilt:60}); byId.j0737b.getPos=jd=>add(c,mul(binaryOffset(jd,P,a,0.088,2451545,u,v),0.5)); }
  { const c=radec(195.0149,12.6825,710*PC); makeNS({id:'b1257',name:'PSR B1257+12 (Lich, con planetas)',cat:'dead',pos:c,P:0.00622,Mv:9,tilt:30,info:'Alrededor de este púlsar se descubrieron en 1992 los primeros planetas fuera del sistema solar: Draugr, Poltergeist y Fobetor. Viven bañados por la radiación del púlsar.'});
    [['draugr','Draugr',0.19,25.26,1700],['polterg','Poltergeist',0.36,66.5,10000],['phobetor','Fobetor',0.46,98.2,9800]].forEach(([id,nm,aa,P,R],i)=>{ const b=planetBody(id,nm,R,'#7a6a8a','mercury',{cat:'dead',menu:true,alb:.2,info:'Planeta que orbita al púlsar Lich. Su «sol» es una estrella de neutrones.'}); const pole=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...norm(c)));
      b.getPos=jd=>{ const ang=2*Math.PI*((jd-J2000)/P)+i*2; const vv=new THREE.Vector3(Math.cos(ang)*aa*AU,0,Math.sin(ang)*aa*AU).applyQuaternion(pole); return add(c,[vv.x,vv.y,vv.z]); }; b.lightFrom='b1257'; }); }
  // cometas y asteroides
  makeComet({id:'halley',name:'Cometa Halley',a:17.834,e:0.96714,i:162.262,O:58.42,w:111.33,tp:2446470.96,Rn:5.5,H:5.5,nAct:4,tailK:6e7,info:'Los astrónomos chinos lo registraron casi en cada visita desde el 240 a.C. Vuelve cada ~76 años; su último paso cerca del Sol fue el 9 de febrero de 1986 y volverá en 2061. Acelera el tiempo para ver crecer su cola.'});
  makeComet({id:'halebopp',name:'Cometa Hale-Bopp',a:186,e:0.99511,i:89.43,O:282.47,w:130.59,tp:2450539.64,Rn:30,H:-0.8,nAct:4,tailK:1.4e8,info:'El «Gran Cometa de 1997», visible a simple vista durante 18 meses. Su núcleo mide unos 60 km. Vuelve cada ~2.500 años.'});
  [['ceres','Ceres (planeta enano)',2.7663,.0789,10.59,80.26,73.3,291,470,'Planeta enano y el objeto más grande del cinturón de asteroides; tiene depósitos de sal brillante.'],['vesta','Vesta',2.3615,.0885,7.14,103.7,151.7,26,263,'Segundo objeto más masivo del cinturón; tiene un cráter gigante en su polo sur.'],['pallas','Palas',2.7704,.2302,34.93,172.9,310.9,30,256,'Asteroide grande con una órbita muy inclinada.'],
   ['eros','Eros',1.458,.2228,10.83,304.3,178.9,100,8.4,'Asteroide cercano a la Tierra; la sonda NEAR aterrizó en él en 2001.'],['bennu','Bennu',1.1264,.2037,6.035,2.06,66.22,140,0.245,'La sonda OSIRIS-REx trajo muestras de este asteroide a la Tierra en 2023.'],['apophis','Apophis',0.9224,.1912,3.34,203.96,126.6,200,0.17,'El 13 de abril de 2029 pasará a unos 32.000 km de la Tierra, más cerca que los satélites geoestacionarios, y se verá a simple vista. No chocará.']]
   .forEach(([id,nm,a,e,i,O,w,M0,R,inf])=>{ const b=planetBody(id,nm,R,'#8a8580','moon',{cat:'comets',alb:.1,info:inf+' (Posición aproximada.)'}); b.getPos=jd=>orbitPos({a,e,i,O,w,M0,ep:2460200.5},jd); if(R<50) b.mesh.scale.set(1.5,1,.8); });
  beltMat=makeBelt(14000,2.1,3.3,[.8,.75,.68],0.1,9,[[2.5,.03],[2.82,.02],[2.95,.02]]);
  kuiperMat=makeBelt(6000,30,50,[.6,.7,.85],0.1,12,null);
  // macroestructura
  const clusters=buildWeb();
  clusters.forEach((c,i)=>{ const p=gal2eq(mul(c.p,MPC)); addBody({id:'cl'+i,name:c.name,kind:'gal',cat:'cosmo',menu:true,R:3*MPC,view:(c.view||4.5)*MPC,fixed:p,getPos:()=>p,info:(c.info||'Cúmulo de galaxias real.')+' (La posición del cúmulo es real; sus galaxias individuales son una simulación con la forma y el número típicos.)',dpc:len(c.p)*1e6}); });
  buildGlobulars();
  addBody({id:'aqui',name:'Vía Láctea (estás aquí)',kind:'gal',cat:'cosmo',menu:true,R:15000*PC,view:1e6*PC,fixed:[0,0,0],getPos:()=>[0,0,0]}); byId.aqui.lbl&&(byId.aqui.lbl.style.color='#ff6a6a');
  laniakea=buildLaniakea();
  { const p=gal2eq(mul(laniakea.GA,MPC)); addBody({id:'laniakea',name:'Laniakea (nuestro supercúmulo)',kind:'gal',cat:'cosmo',menu:true,R:80*MPC,view:190*MPC,approach:norm([0.2,0.9,0.4]),fixed:p,getPos:()=>p,info:'«Cielo inmenso» en hawaiano: el supercúmulo al que pertenece la Vía Láctea, de unos 520 millones de años luz y 100.000 galaxias. Las líneas doradas son los flujos de galaxias que caen hacia el Gran Atractor; las azules, los de los supercúmulos vecinos (Perseo-Piscis, Shapley, Coma). Laniakea se definió en 2014 por estos movimientos (Tully et al.).'}); }
  { const p=gal2eq(mul(eq2gal(radec(195,3,310)),MPC)); addBody({id:'sloan',name:'Gran Muralla de Sloan',kind:'gal',cat:'cosmo',menu:true,R:200*MPC,view:900*MPC,fixed:p,getPos:()=>p,info:'Filamento de galaxias de unos 1.400 millones de años luz de largo, a unos 1.000 millones de años luz.'}); }
  { const p=radec(240,30,5000*MPC); addBody({id:'hcb',name:'Gran Muralla de Hércules–Corona Boreal',kind:'gal',cat:'cosmo',menu:true,R:1500*MPC,view:9000*MPC,fixed:p,getPos:()=>p,info:'La estructura más grande conocida del universo: unos 10.000 millones de años luz de largo, detectada por destellos de rayos gamma. Su existencia todavía se debate.'}); }
  addBody({id:'web',name:'Red cósmica',kind:'gal',cat:'cosmo',menu:true,R:2000*MPC,view:7500*MPC,fixed:[0,0,0],getPos:()=>[0,0,0],approach:norm([0.3,0.5,0.8]),info:'A gran escala, las galaxias forman filamentos y murallas alrededor de enormes vacíos, como una telaraña. (Los filamentos lejanos son una simulación estadística.)'});
  { const g=new THREE.Group(); const cm=smat({vertexShader:ringVS,fragmentShader:cmbFS,uniforms:{uA:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide}); const sph=new THREE.Mesh(sphereGeo,cm); sph.renderOrder=-11; g.add(sph);
    cmb=addBody({id:'cmb',name:'Fondo cósmico de microondas',kind:'cmb',cat:'cosmo',menu:true,R:14300*MPC,view:42000*MPC,fixed:[0,0,0],getPos:()=>[0,0,0],obj:g,approach:norm([0.4,0.3,0.86]),info:'La luz más antigua del universo, emitida 380.000 años después del Big Bang, hace 13.800 millones de años. Hoy esa «pared» está a unos 46.000 millones de años luz por la expansión. Los colores muestran diminutas diferencias de temperatura (de cien milésimas de grado), las semillas de todas las galaxias. Cualquier observador del universo está en el centro de su propia esfera.'}); cmb.cm=cm; }
  buildInterstellar();
  // cielo atmosférico y lente del agujero negro
  { const dm=new THREE.ShaderMaterial({vertexShader:domeVS,fragmentShader:domeFS,uniforms:{uN:{value:new THREE.Vector3(0,1,0)},uS:{value:new THREE.Vector3(0,1,0)},uZ:{value:new THREE.Vector3()},uH:{value:new THREE.Vector3()},uSet:{value:new THREE.Vector3()},uA:{value:1},uOver:{value:0},uNoSun:{value:0}},transparent:true,depthTest:false,depthWrite:false,side:THREE.BackSide});
    skyDome=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),dm); skyDome.renderOrder=-5; skyDome.layers.set(2); skyDome.frustumCulled=false; skyDome.visible=false; scene.add(skyDome); }
  initBHLens(); initBHTrace(); loadSky(); window.__cz={get bhm(){return bhTraceMat},get renderer(){return renderer},get cubeRT(){return cubeRT},get cubeCam(){return cubeCam},get scene(){return scene},get camera(){return camera}};

  buildMenu();
  // posición inicial: mirando la Tierra
  updatePositions(simJD);
  target=E; orbitOff=mul(norm([0.3,-1,0.35]),E.R*3.2); cam=add(E.cur,orbitOff); lookAt(E.cur);
  select(E);
  bindInput();
  ensureTex(E);
  $('#cz-load').remove();
  onResize(); addEventListener('resize',onResize);
  last=performance.now(); requestAnimationFrame(frame);
  toast('Bienvenidos a bordo. Pulsa / para buscar un destino, doble clic en un nombre para viajar y ? para ver todos los atajos.',7000);
}
function onResize(){ const box=$('#cz'); W=box.clientWidth||innerWidth; H=box.clientHeight||innerHeight; renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); const d=renderer.getPixelRatio(); if(lensRT) lensRT.setSize(W*d,H*d); }

/* ================= MENÚ ================= */
function buildMenu(){
  const groups=[['solar','Sistema Solar'],['moons','Lunas'],['civ','Estrellas de las civilizaciones'],['sn','Supernovas históricas'],['fsn','Supernovas del futuro'],['giant','Estrellas gigantes'],['near','Vecinas del Sol'],['dead','Estrellas muertas: púlsares, magnetares, enanas blancas'],['neb','Nebulosas'],['bh','Agujeros negros'],['inter','Interstellar (ficción científica)'],['comets','Cometas y asteroides'],['gc','Cúmulos globulares'],['gal','Galaxias'],['cosmo','Macroestructura del universo']];
  const tours=`<h3>Experiencias</h3>
   <button data-tour="1054">★ Ver nacer la estrella invitada de 1054 desde la Tierra</button>
   <button data-tour="1054b">★ Estar junto a la supernova del Cangrejo cuando explotó</button>
   <button data-tour="venus">★ El ciclo maya de Venus (584 días)</button>
   <button data-tour="algol">★ Los eclipses de Algol (Calendario de El Cairo)</button>
   <button data-tour="bet">★ ¿Y si Betelgeuse explota hoy?</button>
   <button data-tour="light">★ Viajar a la velocidad de la luz: Sol → Tierra</button>
   <button data-tour="grand">🚀 Gran Tour automático (12 paradas)</button>
   <button data-tour="zoomout">🌌 Del Sol al fondo de microondas</button>
   <button data-tour="plunge">🕳 Caer en Sagitario A*</button>
   <button data-tour="miller">🌊 Interstellar: aterrizar en el planeta de Miller</button>
   <button data-tour="wormhole">🌀 El agujero de gusano junto a Saturno</button>
   <button data-tour="chichen">🛬 Noche en Chichén Itzá</button>
   <button data-tour="mars">🛬 Atardecer en Marte</button>
   <button data-tour="halley">☄ El cometa Halley en 1986</button>
   <button data-tour="orion">✦ Las Tres Marías y Orión (Osiris)</button>
   <button data-tour="gargantua">🕳 Frente a un agujero negro</button>
   <button data-tour="rand">🎲 Sorpréndeme</button>`;
  $('#cz-menu').innerHTML=`<div class="msearch"><input id="cz-q" type="search" placeholder="Buscar destino… (tecla /)" autocomplete="off" aria-label="Buscar destino"></div>`+tours+groups.map(([c,t])=>{ const items=bodies.filter(b=>b.cat===c&&b.menu!==false); if(!items.length) return '';
    return `<h3>${t}</h3>`+items.map(b=>`<button data-id="${b.id}">${b.name}${b.dpc?`<small>${nf(b.dpc*3.2616,0)} a.l.</small>`:''}</button>`).join(''); }).join('');
  $('#cz-menu').querySelectorAll('[data-id]').forEach(e=>e.onclick=()=>{ const b=byId[e.dataset.id]; select(b); goTo(b); if(window.__czDev!=='desktop'){ $('#cz-menu').hidden=true; $('#cz').classList.remove('more'); } });
  $('#cz-menu').querySelectorAll('[data-tour]').forEach(e=>e.onclick=()=>{ tour(e.dataset.tour); if(window.__czDev!=='desktop'){ $('#cz-menu').hidden=true; $('#cz').classList.remove('more'); } });
  const fold=t=>t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  $('#cz-q').oninput=e=>{ const q=fold(e.target.value.trim()); const M=$('#cz-menu');
    M.querySelectorAll('button').forEach(bt=>bt.hidden=!!q&&!fold(bt.textContent).includes(q));
    M.querySelectorAll('h3').forEach(h=>{ let n=h.nextElementSibling, any=false; while(n&&n.tagName==='BUTTON'){ if(!n.hidden) any=true; n=n.nextElementSibling; } h.hidden=!!q&&!any; }); };
  $('#cz-q').onkeydown=e=>{ if(e.key==='Enter'){ const bt=[...$('#cz-menu').querySelectorAll('button')].find(x=>!x.hidden); if(bt) bt.click(); } if(e.key==='Escape') $('#cz-menu').hidden=true; };
}
function setRate(r){ rate=r; const s=$('#cz-rate'); let best=0; [...s.options].forEach((o,i)=>{ if(Math.abs(+o.value-r)<Math.abs(+s.options[best].value-r)) best=i; }); s.selectedIndex=best; rdir=1; $('#cz-rev').classList.remove('hot'); }
let gtour=null;
const GRAND=[['earth','Empezamos en casa: la Tierra, nuestro observatorio.'],['moon','La Luna: los mayas agrupaban sus lunaciones para anticipar eclipses.'],['sun','El Sol: para Egipto, Ra cruzaba el cielo en una barca.'],['jupiter','Júpiter, el gigante: su Gran Mancha Roja es más grande que la Tierra.'],['saturn','Saturno y sus anillos de hielo.'],['sirius','Sirio, la Sopdet egipcia, y su pequeña compañera enana blanca.'],['betelgeuse','Betelgeuse: una supergigante roja que algún día será supernova.'],['sn1054','La Nebulosa del Cangrejo: el remanente de la estrella invitada de 1054.'],['crabpsr','En su centro, un púlsar de 12 km que gira 30 veces por segundo.'],['sgra','Sagitario A*: el agujero negro del centro de la galaxia, con la estrella S2.'],['mwview','Nuestra galaxia vista desde fuera. Tres pueblos miraron esta franja desde la Tierra.'],['m31','Andrómeda, la galaxia vecina, a 2,5 millones de años luz.']];
function stopGrand(msg){ if(!gtour) return; clearTimeout(gtour.t); gtour=null; if(msg) toast(msg); }
function grandStep(){ if(!gtour) return; const L=gtour.list||GRAND.map(g=>[g[0],null,g[1]]); const [id,dist,txt]=L[gtour.i]; const b=byId[id]; if(surf) setMode('orbit'); select(b); goTo(b,dist?{dist}:null); toast(`Parada ${gtour.i+1}/${L.length} · ${txt}`,9000);
  gtour.t=setTimeout(()=>{ if(!gtour) return; gtour.i++; if(gtour.i>=L.length){ stopGrand('Fin del recorrido. ¡Ahora explora por tu cuenta!'); return; } grandStep(); },(flight?flight.dur:3000)+8000); }
function tour(k){
  if(k==='orion'){ stopGrand(); const b=byId.alnilam; select(b); setMode('earth'); lookAt(b.cur); fovT=28; toast('Desde la Tierra: el cinturón de Orión, las Tres Marías. Debajo, la Nebulosa de Orión. Para Egipto, Orión era Osiris.',8000); return; }
  if(k==='gargantua'){ stopGrand(); const b=byId.cygx1; select(b); goTo(b); setRate(1); toast('Cygnus X-1: el disco de gas se curva por encima y por debajo de la sombra. Arrastra para girar a su alrededor.',8000); return; }
  if(k==='miller'){ stopGrand(); updatePositions(simJD); select(byId.miller); land(byId.miller); setRate(60); return; }
  if(k==='wormhole'){ stopGrand(); const b=byId.whs; select(b); goTo(b); toast('Una esfera que muestra otra galaxia: es la entrada del agujero de gusano. Pulsa «Atravesar» cuando llegues.',8000); return; }
  if(k==='zoomout'){ stopGrand(); gtour={i:0,list:[['earth',null,'La Tierra'],['sun',80*AU,'El sistema solar entero cabe aquí'],['sun',60*LY,'El vecindario solar: las estrellas que vemos de noche'],['mwview',null,'La Vía Láctea: 100.000 años luz'],['m31',2.2e6*LY,'El Grupo Local: la Vía Láctea y Andrómeda'],['laniakea',null,'Laniakea: nuestro supercúmulo'],['web',null,'La red cósmica: filamentos y vacíos'],['cmb',null,'El fondo cósmico de microondas: el límite del universo observable']]}; grandStep(); return; }
  if(k==='plunge'){ stopGrand(); const b=byId.sgra; select(b); goTo(b,{dist:b.R*80}); setTimeout(()=>plunge(b),7000); return; }
  if(k==='chichen'){ stopGrand(); land(byId.earth,SITES.earth[1]); setRate(600); toast('Chichén Itzá. El tiempo corre a 10 minutos por segundo: espera la noche para ver la Vía Láctea y las constelaciones. Cambia a «28 mansiones chinas» arriba.',9000); return; }
  if(k==='mars'){ stopGrand(); land(byId.mars,SITES.mars[0]); setRate(300); toast('Cráter Jezero, Marte. Los atardeceres marcianos son azules por el polvo fino. El tiempo corre a 5 minutos por segundo.',9000); return; }
  if(k==='halley'){ stopGrand(); const c=calToJD(1986,2,9); simJD=c-40; setRate(43200); select(byId.halley); goTo(byId.halley,{dist:2.5e7}); toast('Febrero de 1986: Halley pasa cerca del Sol y despliega su cola. 1 s = 12 horas.',8000); return; }
  if(k==='grand'){ stopGrand(); setRate(1); setYear(2026.84); gtour={i:0}; grandStep(); return; }
  if(k==='rand'){ const pool=bodies.filter(b=>b.menu!==false&&b.cat&&b.cat!=='bg'); const b=pool[Math.random()*pool.length|0]; select(b); goTo(b); toast('Destino sorpresa: '+b.name,4000); return; }
  stopGrand();
  if(k==='1054'){ const b=byId.sn1054; simJD=yearToJD(b.tEarth)-12; setRate(43200); select(b); setMode('earth'); lookAt(b.pos); fovT=35; toast('4 de julio de 1054 se acerca. Estás en la Tierra mirando hacia Tauro. El tiempo corre a 12 horas por segundo.',7000); }
  if(k==='1054b'){ const b=byId.sn1054; const st=snState(b,simJD,cam); simJD=yearToJD(st.tExp)-0.5; setRate(86400); select(b); goTo(b,{dist:40*AU}); toast('Viajaste unos 6.500 años antes de 1054: la explosión ocurrió realmente aquí, y su luz tardará 6.500 años en llegar a la Tierra.',8000); }
  if(k==='venus'){ simJD=yearToJD(2026.8); setRate(2629800); select(byId.venus); setMode('earth'); lookAt(byId.venus.cur); fovT=70; toast('Desde la Tierra: Venus aparece al amanecer, desaparece y reaparece al atardecer. El ciclo completo dura ~584 días. 1 s = 1 mes.',8000); }
  if(k==='algol'){ select(byId.algola); goTo(byId.algola,{dist:0.25*AU}); setRate(3600); toast('Algol: la estrella naranja pasa frente a la azul cada 2,867 días. 1 s = 1 hora.',7000); }
  if(k==='bet'){ const b=byId.fbet; detonate(b); }
  if(k==='light'){ const E=byId.earth,S=byId.sun; flight=null; setMode('free'); cam=add(S.cur,mul(norm(sub(E.cur,S.cur)),S.R*1.6)); lookAt(E.cur); select(E); target=E;
    speedMode='real'; $('#cz-smode').value='real'; $('#cz-v').hidden=false; $('#cz-linkw').hidden=false; realV=CK; $('#cz-v').value=String(CK); linkTime=true; $('#cz-link').checked=true; setRate(1); startCruise(E);
    toast('Viajas a la velocidad de la luz y el tiempo corre a ritmo real: tardarás 8 minutos y 20 segundos en llegar a la Tierra. Sube la escala de tiempo para ir más rápido.',9000); }
}
function detonate(b){ b.tEarth=jdToYear(simJD)+10/365.25; select(b); setMode('earth'); lookAt(b.pos); fovT=50; setRate(43200);
  toast(`Simulación hipotética: la luz de la supernova llega a la Tierra en 10 días. Mira cómo cambia su brillo. (${b.name})`,8000); }

/* ================= SELECCIÓN E INFO ================= */
let infoCollapsed=false;
function select(b){ sel=b; infoCollapsed=window.__czDev==='phone'; renderInfo(); }
let infoT=0;
function renderInfo(){
  const box=$('#cz-info'); if(!sel){box.hidden=true;return;} box.hidden=false;
  const b=sel, d=len(sub(b.cur,cam)), E=byId.earth, de=len(sub(b.cur,E.cur));
  const kindName=b.cat==='comets'&&b.kind==='planet'?'Asteroide':b.cat==='cosmo'?'Estructura del universo':{star:'Estrella',planet:b.parent?'Luna':'Planeta',ns:'Estrella de neutrones',bh:'Agujero negro',wh:'Agujero de gusano (ficción)',sn:'Supernova',gal:'Galaxia',comet:'Cometa',cmb:'Límite del universo observable'}[b.kind]||'';
  let facts=[['Distancia a ti',fmtDist(d)],['La luz tarda (a ti)',fmtDur(d/CK)]];
  if(b.id!=='earth') facts.push(['Distancia a la Tierra',b.cat==='inter'&&b.id!=='whs'?'otra galaxia (ficción: solo se llega por el agujero de gusano)':fmtDist(de)]);
  if(b.kind==='star') facts.push(['Radio',b.R/RS>=0.05?nf(b.R/RS,b.R/RS<10?2:0)+' R☉ ('+sig(b.R)+' km)':sig(b.R)+' km'],['Temperatura',nf(b.T)+' K']);
  if(b.kind==='planet') facts.push(['Radio',nf(b.R)+' km'],['Tamaño',b.R>6371*1.05?`≈ ${nf(b.R/6371,1)} veces el diámetro de la Tierra`:b.R<6371*.95?`${nf(b.R/6371*100,0)} % del diámetro de la Tierra`:'como la Tierra']);
  if(b.kind==='star'){ const x=b.R/RS; facts.push(['Comparado con el Sol',x>=1.5?`su diámetro es ≈ ${nf(x,0)} veces el del Sol; cabrían ≈ ${sig(x*x*x)} soles dentro`:x<0.02?`del tamaño de la Tierra (${nf(b.R/6371,1)} radios terrestres)`:x<0.9?`${nf(x*100,0)} % del diámetro del Sol`:'parecida al Sol']); if(x>100) facts.push(['Si estuviera en lugar del Sol',b.R>5.2*AU?'se tragaría hasta Júpiter':b.R>1.52*AU?'llegaría más allá de Marte':b.R>AU?'se tragaría la Tierra':'se tragaría Mercurio y Venus']); }
  if(b.kind==='ns') facts.push(['Radio','≈ 12 km'],['Periodo de rotación',b.P<1?nf(b.P*1000,1)+' ms ('+nf(1/b.P,0)+' vueltas/s)':nf(b.P,2)+' s']);
  if(b.kind==='bh'){ facts.push(['Masa',sig(b.M)+' masas solares'],['Radio del horizonte',fmtDist(b.R)]); const rc=d/b.R; if(rc>1) facts.push(['Tu tiempo aquí',`1 hora tuya = ${fmtDur(3600/Math.sqrt(1-1/rc))} en la Tierra`]); }
  if(b.vis) facts.push(['Brillo aparente desde aquí',b.vis]);
  facts.push(['A 17 km/s (Voyager 1)',fmtDur(d/17)]);
  let extra='', acts=`<button class="b" data-a="go">Viajar aquí</button>`;
  if(speedMode==='real') acts+=`<button class="b hot" data-a="cruise">Viajar a ${$('#cz-v').selectedOptions[0].textContent.split(' · ')[0]}</button>`;
  if(b.kind!=='gal'&&b.kind!=='cmb'&&b.id!=='earth') acts+=`<button class="b" data-a="earth">Verlo desde la Tierra</button>`;
  if(b.kind==='planet'&&b.cat!=='comets'&&b.R>150) acts+=`<button class="b hot" data-a="land">${['jupiter','saturn','uranus','neptune'].includes(b.id)?'☁ Flotar en sus nubes':'🛬 Aterrizar'}</button>`;
  if(b.kind==='bh') acts+=`<button class="b hot" data-a="plunge">🕳 Lanzarse al agujero negro</button>`;
  if(b.kind==='wh') acts+=`<button class="b hot" data-a="wh">🌀 Atravesar el agujero de gusano</button>`;
  if(b.dilF) facts.push(['Dilatación del tiempo (película)','1 hora aquí = 7 años en la Tierra (factor ≈ 61.000)']);
  if(b.kind==='sn'){
    if(b.tEarth!=null){ const st=snState(b,simJD,E.cur); const c=jdToCal(yearToJD(b.tEarth));
      facts.unshift(['Su luz llega a la Tierra',`${c.d} ${MES[c.m-1]} ${fmtYear(c.y)}`],['Explotó realmente en',`≈ ${fmtYear(Math.round(st.tExp))} (la luz viajó ${nf(b.dpc*3.2616,0)} años)`]);
      if(b.rem) facts.push(['Remanente',b.rem]);
      acts+=`<button class="b hot" data-a="sntime">Ir a ${fmtYear(Math.floor(b.tEarth))} y verla desde la Tierra</button><button class="b" data-a="snthere">Estar ahí cuando explotó</button>`;
      if(b.cat==='fsn') acts+=`<button class="b" data-a="det">Reiniciar simulación</button>`;
    } else { acts+=`<button class="b hot" data-a="det">Simular su explosión (hipotético)</button>`; }
  }
  box.innerHTML=`<div class="k">${kindName}${b.dpc?` · ${nf(b.dpc*3.2616,0)} años luz`:''}</div><h2>${b.name}</h2>${b.info?`<p>${b.info}</p>`:''}${extra}
   <dl>${facts.map(f=>`<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('')}</dl><div class="acts">${acts}<button class="b" data-a="close">Cerrar</button></div>`;
  { const h2=box.querySelector('h2'); if(h2) h2.onclick=()=>{ if(window.__czDev==='phone'){ box.classList.toggle('collapsed'); infoCollapsed=box.classList.contains('collapsed'); } }; box.classList.toggle('collapsed',window.__czDev==='phone'&&infoCollapsed); }
  box.querySelectorAll('[data-a]').forEach(e=>e.onclick=()=>{ const a=e.dataset.a;
    if(a==='go') goTo(b); if(a==='close'){sel=null;box.hidden=true;}
    if(a==='earth'){ setMode('earth'); lookAt(b.cur); }
    if(a==='cruise') startCruise(b);
    if(a==='land') land(b,(SITES[b.id]||[])[0]);
    if(a==='plunge') plunge(b);
    if(a==='wh') traverseWH(b);
    if(a==='sntime'){ simJD=yearToJD(b.tEarth)-12; setRate(43200); setMode('earth'); lookAt(b.pos); fovT=40; toast('Faltan unos días para que su luz llegue a la Tierra. 1 s = 12 horas.',6000); }
    if(a==='snthere'){ const st=snState(b,simJD,cam); simJD=yearToJD(st.tExp)-0.5; setRate(86400); goTo(b,{dist:40*AU}); }
    if(a==='det') detonate(b);
  });
}

/* ================= CÁMARA ================= */
let tmpM=null, V0=null;
function lookAt(p,upv){ if(!tmpM){tmpM=new THREE.Matrix4();V0=new THREE.Vector3();} const d=sub(p,cam); const up=upv||new THREE.Vector3(0,1,0).applyQuaternion(camQ);
  tmpM.lookAt(V0,new THREE.Vector3(d[0],d[1],d[2]).normalize(),up); const q=new THREE.Quaternion().setFromRotationMatrix(tmpM); camQ.copy(q); }
function viewDist(b){ if(b.kind==='sn'){ const st=snState(b,simJD,cam); const ry=st?Math.max(0,jdToYear(simJD)-st.tExp):0; const rr=remRadius(b,ry); return Math.max(b.progR*6, rr*3.2, 20*AU); } return b.view||b.R*4; }
function setMode(m){
  if(plungeS){ plungeS=null; $('#cz-fall').hidden=true; $('#cz').classList.remove('falling'); }
  if(surf&&m!=='surface'){ surf=null; if(terrain) terrain.visible=false; if(skyDome) skyDome.visible=false; $('#cz-surfbar').hidden=true; }
  if(m==='earth'){ earthView=true; cam=byId.earth.cur.slice(); } else earthView=false;
  if(mode==='earth'&&m!=='earth'){ const E=byId.earth; cam=add(E.cur,mul([0,0,1],E.R*4)); if(target&&target!==E){ orbitOff=sub(cam,target.cur); } }
  mode=m; flight=null; if(m!=='free') cruise=null;
  if(m==='orbit'&&target){ orbitOff=sub(cam,target.cur); lookAt(target.cur); }
  if(m!=='earth') fovT=60;
  document.querySelectorAll('#cz [data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===m));
  $('#cz').classList.toggle('free',m==='free');
  if(m==='earth') toast('Estás en el centro de la Tierra (la Tierra está oculta). Arrastra para mirar el cielo y usa la rueda como telescopio.',5000);
}
function goBack(){ while(navHist.length){ const id=navHist.pop(); const b=byId[id]; if(b&&b!==target){ select(b); goTo(b,{nohist:true}); break; } } $('#cz-back').disabled=!navHist.length; }
function goTo(b,opt){
  opt=opt||{}; if(byId.garg&&!opt.noWH){ const toI=b.cat==='inter'&&b.id!=='whs'; if(toI!==interW){ traverseWH(byId[interW?'whg':'whs'],b); return; } }
  if(!opt.nohist&&target&&target!==b){ navHist.push(target.id); if(navHist.length>30) navHist.shift(); const bb=$('#cz-back'); if(bb) bb.disabled=false; } if(mode==='earth'||surf) setMode('orbit');
  const d1=opt.dist||viewDist(b); let dir=norm(sub(cam,b.cur)); if(b.approach) dir=b.approach;
  if(b.id==='cygx1'&&byId.hde226868&&b.diskN){ dir=norm(add(norm(sub(byId.hde226868.cur,b.cur)),mul(b.diskN,0.17))); }
  if(b.kind==='planet'&&b.id!=='sun'){ const sd=norm(sub((b.lightFrom&&byId[b.lightFrom]?byId[b.lightFrom]:byId.sun).cur,b.cur)); dir=norm(add(mul(dir,0.35),mul(add(sd,[0,0,0.25]),0.9))); }
  if(len(sub(cam,b.cur))<d1*1.01&&!b.approach){ /* ya está cerca */ }
  flight={b,t0:performance.now(),d0:Math.max(len(sub(cam,b.cur)),1),d1,dir0:norm(sub(cam,b.cur)),dir1:dir,q0:camQ.clone()};
  const ratio=Math.abs(Math.log(flight.d0/d1)); flight.dur=Math.min(9000,2200+ratio*260);
  mode='orbit'; target=b; cruise=null; document.querySelectorAll('#cz [data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode==='orbit')); $('#cz').classList.remove('free');
}
function startCruise(b){ if(speedMode!=='real'){ goTo(b); return; } target=b; select(b); if(mode!=='free') setMode('free'); cruise={b,dist0:len(sub(b.cur,cam))}; shipTime=0; lookAt(b.cur);
  if(rate===0) toast('El reloj está en pausa: elige una escala de tiempo para que la nave avance.');
}
function slerpV(a,b,t){ const d=Math.max(-1,Math.min(1,dot(a,b))); const th=Math.acos(d); if(th<1e-4) return norm(add(mul(a,1-t),mul(b,t))); const s=Math.sin(th); return add(mul(a,Math.sin((1-t)*th)/s),mul(b,Math.sin(t*th)/s)); }

/* ================= ENTRADA ================= */
let drag=null, pts=new Map(), pinch0=0;
function bindInput(){
  const cv=renderer.domElement;
  cv.addEventListener('pointerdown',e=>{ stopGrand(); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId,[e.clientX,e.clientY]); drag={x:e.clientX,y:e.clientY,moved:0}; if(pts.size===2){ const [a,b]=[...pts.values()]; pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]); } cv.style.cursor='grabbing'; });
  cv.addEventListener('pointermove',e=>{ if(!drag||!pts.has(e.pointerId)) return; const p=pts.get(e.pointerId); const dx=e.clientX-p[0], dy=e.clientY-p[1]; pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2){ const [a,b]=[...pts.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]); if(pinch0){ zoom((pinch0-d)*3); } pinch0=d; return; }
    drag.moved+=Math.abs(dx)+Math.abs(dy); rotateView(dx,dy); });
  const up=e=>{ pts.delete(e.pointerId); cv.style.cursor='grab'; if(drag&&drag.moved<6&&pts.size===0) pick(e.clientX,e.clientY,false); if(pts.size===0) drag=null; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('dblclick',e=>pick(e.clientX,e.clientY,true));
  cv.addEventListener('wheel',e=>{ e.preventDefault(); zoom(e.deltaY); },{passive:false});
  addEventListener('keydown',e=>{ if($('#v-cosmos').hidden||e.target.closest('input,select')) return; const k=e.key.toLowerCase(); keys[k]=true; if(e.shiftKey) keys.shift=true;
    if(k==='h') { uiHidden=!uiHidden; $('#cz').classList.toggle('noui',uiHidden); }
    if(k===' '){ e.preventDefault(); if(rate){ rate0=rate; setRate(0);} else setRate(rate0||1); } });
  addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; if(!e.shiftKey) keys.shift=false; });
}
let rate0=1;
function rotateView(dx,dy){
  const f=fovT/60*0.0045;
  if(inTess){ tess.yaw-=dx*0.004; tess.pitch=Math.max(-1.4,Math.min(1.4,tess.pitch-dy*0.004)); return; }
  if(surf){ surf.az+=dx*f*1.1; surf.alt=Math.max(-0.5,Math.min(1.56,surf.alt+dy*f*1.1)); return; }
  if(mode==='orbit'&&target&&!flight){
    const qY=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0).applyQuaternion(camQ),-dx*0.006);
    const qX=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0).applyQuaternion(camQ),-dy*0.006);
    const q=qY.multiply(qX); const v=new THREE.Vector3(...orbitOff).applyQuaternion(q); orbitOff=[v.x,v.y,v.z]; camQ.premultiply(q);
  } else {
    const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(-dy*f*(mode==='earth'?-1:1)*(mode==='earth'?-1:1),-dx*f,0,'YXZ'));
    camQ.multiply(q);
  }
}
function zoom(dy){
  const s=Math.sign(dy)*Math.min(3,Math.abs(dy)/60+0.5);
  if(mode==='orbit'&&target){ flight=null; const d=len(orbitOff); const minD=target.kind==='gal'||target.kind==='cmb'?target.R*0.02:target.kind==='sn'?AU:target.kind==='bh'?target.R*0.6:target.R*1.08; const nd=Math.max(minD,d*Math.pow(1.18,s)); orbitOff=mul(norm(orbitOff),nd); }
  else if(mode==='earth'||surf){ fovT=Math.max(0.3,Math.min(100,fovT*Math.pow(1.15,s))); }
  else { autoMul=Math.max(1e-4,Math.min(1e4,autoMul*Math.pow(1.3,-s))); toast('Multiplicador de velocidad: ×'+sig(autoMul),1500); }
}
function project(b){ const o=b.sprite||b.obj; const v=b._sp||(b._sp=new THREE.Vector3()); v.copy(o.position).project(camera); return v; }
function pick(x,y,go){
  const r=renderer.domElement.getBoundingClientRect(); let best=null,bd=28;
  for(const b of bodies){ if(b.menu===false&&!b.lbl) continue; if(earthView&&b.id==='earth') continue; if(hideW(b)) continue; const v=project(b); if(v.z>1||v.z<-1) continue; const sx=(v.x+1)/2*r.width, sy=(1-v.y)/2*r.height; const d=Math.hypot(sx-(x-r.left),sy-(y-r.top)); if(d<bd){bd=d;best=b;} }
  if(best){ select(best); if(go) goTo(best); }
}

/* ================= ACTUALIZACIÓN ================= */
function updatePositions(jd){ for(const b of bodies){ const p=b.getPos?b.getPos(jd):b.fixed; b.cur=p; } }
function nearestSurface(){ let m=Infinity,nb=null; for(const b of bodies){ if(b.kind==='gal'||b.kind==='cmb'||(earthView&&b.id==='earth')||hideW(b)) continue; if(b.cat==='bg'&&!b.R) continue; const d=len(sub(b.cur,cam))-(b.kind==='sn'?0:b.R); if(d<m){m=d;nb=b;} } return [Math.max(m,0.01),nb]; }
function updateCamera(dtR,dtSim){
  const E=byId.earth;
  if(plungeS){ updatePlunge(dtR); return; }
  if(surf&&!flight){ updateSurface(); return; }
  if(flight){
    const f=flight, s=Math.min(1,(performance.now()-f.t0)/f.dur), e=s<.5?4*s*s*s:1-Math.pow(-2*s+2,3)/2;
    const d=Math.exp(Math.log(f.d0)+(Math.log(f.d1)-Math.log(f.d0))*e); const dir=slerpV(f.dir0,f.dir1,e);
    cam=add(f.b.cur,mul(dir,d));
    const tq=camQ.clone(); lookAt(f.b.cur,f.b.upv); const lq=camQ.clone(); camQ.copy(tq).slerp(lq,Math.min(1,s*2.5+0.02));
    if(s>=1){ flight=null; orbitOff=sub(cam,f.b.cur); }
    return;
  }
  if(mode==='orbit'&&target){ cam=add(target.cur,orbitOff); return; }
  if(mode==='earth'){ cam=E.cur.slice(); return; }
  // vuelo libre
  const fw=new THREE.Vector3(0,0,-1).applyQuaternion(camQ), rt=new THREE.Vector3(1,0,0).applyQuaternion(camQ), upv=new THREE.Vector3(0,1,0).applyQuaternion(camQ);
  let v;
  if(speedMode==='real'){ v=realV*(linkTime?Math.abs(dtSim):dtR); }
  else { const [ns]=nearestSurface(); v=Math.max(0.5,ns*0.9)*autoMul*dtR*(keys.shift?10:1); }
  if(cruise){
    const b=cruise.b, to=sub(b.cur,cam), dist=len(to), stop=viewDist(b);
    if(dist<=stop+v){ cam=add(b.cur,mul(norm(sub(cam,b.cur)),stop)); cruise=null; toast(`Llegaste a ${b.name}. Tiempo de viaje a bordo: ${fmtDur(shipTime)}.`,7000); target=b; setMode('orbit'); return; }
    cam=add(cam,mul(norm(to),v)); const beta=Math.min(realV/CK,0.999999999); if(realV<CK) shipTime+=(linkTime?Math.abs(dtSim):dtR)*Math.sqrt(1-beta*beta); else shipTime+=0;
    const tq=camQ.clone(); lookAt(b.cur); const lq=camQ.clone(); camQ.copy(tq).slerp(lq,0.08);
    return;
  }
  if(gravityOn){ const th=0.01*autoMul*(keys.shift?10:1); if(keys.w) vel=add(vel,[fw.x*th*Math.abs(dtSim||dtR),fw.y*th*Math.abs(dtSim||dtR),fw.z*th*Math.abs(dtSim||dtR)]); if(keys.s) vel=mul(vel,Math.max(0,1-dtR*2));
    if(keys.q) camQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),dtR*1.2)); if(keys.e) camQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-dtR*1.2));
    if(keys.arrowleft) rotateView(-dtR*400,0); if(keys.arrowright) rotateView(dtR*400,0); if(keys.arrowup) rotateView(0,-dtR*300); if(keys.arrowdown) rotateView(0,dtR*300);
    if(dtSim) physicsStep(dtSim*Math.min(dil,50)); return; }
  const mv=[0,0,0]; const ad=(vec,k)=>{mv[0]+=vec.x*k;mv[1]+=vec.y*k;mv[2]+=vec.z*k};
  if(keys.w||keys.arrowup&&false) ad(fw,1); if(keys.s) ad(fw,-1); if(keys.a) ad(rt,-1); if(keys.d) ad(rt,1); if(keys.r) ad(upv,1); if(keys.f) ad(upv,-1);
  if(keys.q) camQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),dtR*1.2));
  if(keys.e) camQ.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-dtR*1.2));
  if(keys.arrowleft) rotateView(-dtR*400,0); if(keys.arrowright) rotateView(dtR*400,0); if(keys.arrowup) rotateView(0,-dtR*300); if(keys.arrowdown) rotateView(0,dtR*300);
  const ml=len(mv); if(ml>0){ cam=add(cam,mul(mv,v/ml)); if(speedMode==='real'){ const beta=Math.min(realV/CK,0.999999); shipTime+=(linkTime?Math.abs(dtSim):dtR)*Math.sqrt(Math.max(0,1-beta*beta)); } }
  // no atravesar cuerpos
  for(const b of bodies){ if(b.kind==='planet'||b.kind==='star'){ const d=sub(cam,b.cur), l=len(d); if(l<b.R*1.02) cam=add(b.cur,mul(norm(d),b.R*1.02)); } }
}
function magPx(m){ if(m>9.5) return 0; return Math.min(260,2.2*Math.pow(10,-0.11*(m-6))); }
function sprite(b,p,k,m,minPx){
  if(!b.sprite) return; const s=b.sprite; let px=Math.max(magPx(m),minPx||0); if(px<=0.5){ s.visible=false; return; }
  s.visible=true; s.position.copy(p); const sc=px*2*Math.tan(camera.fov*D2R/2)/H; s.scale.set(sc,sc,1); s.material.opacity=Math.max(0.15,Math.min(1,(9.5-m)/3))*(m>-8?Math.min(1,expo*1.5):1);
}

function frame(now){
  requestAnimationFrame(frame);
  if(!running) return;
  const dtR=Math.min(0.1,(now-last)/1000); last=now;
  if(inTess){ tessFrame(now,dtR); return; }
  if(darkS){ renderer.setRenderTarget(null); renderer.setClearColor(0x000000,1); renderer.clear(); return; }
  { const bh=strongestBH(); dil=1; if(bh&&bh.dist){ const rc=bh.dist/bh.R; if(rc<=1.0&&!plungeS){ if(performance.now()>tessCool){ startDarkness(bh); return; } } else dil=Math.min(1e6,1/Math.sqrt(Math.max(1e-12,1-1/Math.max(rc,1.000001)))); } }
  { const mi=byId.miller; if(mi&&mi.cur){ let f=0; if(surf&&surf.b===mi) f=1; else f=sstep(60,4,len(sub(mi.cur,cam))/mi.R); if(f>0) dil=Math.exp(Math.log(dil)*(1-f)+Math.log(mi.dilF)*f); } }
  const dtSim=rate*rdir*dtR; gclk+=dtSim/DAY; if(surf){ surf.loc+=dtSim; surf.wt=(surf.wt||0)+dtR; }
  simJD+=dtSim*dil/DAY; const minJD=yearToJD(-20000), maxJD=yearToJD(200000); if(simJD<minJD) simJD=minJD; if(simJD>maxJD) simJD=maxJD;
  updatePositions(simJD); calcW();
  updateCamera(dtR,dtSim);
  // cámara
  camera.quaternion.copy(camQ); camera.fov+= (fovT-camera.fov)*Math.min(1,dtR*6); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  uPx=H/(2*Math.tan(camera.fov*D2R/2));
  const dpr=renderer.getPixelRatio();
  const camGal=eq2gal(cam).map(x=>x/PC);
  // exposición: en modo realista, un objeto muy brillante en pantalla «ciega» las estrellas, como una cámara o el ojo
  { let mb=99; const fw=new THREE.Vector3(0,0,-1).applyQuaternion(camQ), cf=Math.cos(camera.fov*D2R*0.7);
    for(const b of bodies){ if(b.appMag==null||!b.obj.visible&&!(b.sprite&&b.sprite.visible)) continue; const v=norm(sub(b.cur,cam)); if(fw.x*v[0]+fw.y*v[1]+fw.z*v[2]<cf) continue;
      let m=b.appMag; if(b.kind==='planet'){ const ang=b.R/Math.max(b.dist,1)*uPx; if(ang>H*0.08) m=Math.min(m,-9); } if(m<mb) mb=m; }
    const tgt=lightMode==='studio'?1:(mb>-5?1:Math.max(0.025,Math.pow(10,-0.4*(-5-mb)*0.3))); expo+=(tgt-expo)*Math.min(1,dtR*2.5); }
  const skyB=(microwave?0.25:surf&&surf.day?Math.max(0.03,1-surf.day):1)*expo;
  for(const m of skyMats){ m.uniforms.uCam.value.set(camGal[0],camGal[1],camGal[2]); m.uniforms.uPx.value=uPx; m.uniforms.uDpr.value=dpr; m.uniforms.uBright.value=window.__nosky?0:skyB; }
  const nearGal=target&&target.gvol&&target.dist<target.R*6?0.12:1;
  { const dM=len(cam)/MPC; for(const m of webMats){ m.uniforms.uCam.value.set(camGal[0]/1e6,camGal[1]/1e6,camGal[2]/1e6); m.uniforms.uPx.value=uPx; m.uniforms.uDpr.value=dpr; m.uniforms.uFade.value=sstep(4,25,dM)*(microwave?.3:1)*nearGal; }
    for(const m of galMats){ m.uniforms.uCam.value.set(camGal[0]/1e6,camGal[1]/1e6,camGal[2]/1e6); m.uniforms.uPx.value=uPx; m.uniforms.uDpr.value=dpr; m.uniforms.uFade.value=sstep(m.fadeK[0],m.fadeK[1],dM)*(microwave?.3:1)*expo*nearGal; }
    if(laniakea){ laniakea.mat.uniforms.uCam.value.set(camGal[0]/1e6,camGal[1]/1e6,camGal[2]/1e6); laniakea.mat.uniforms.uA.value=(target&&(target.id==='laniakea'||target.id==='aqui')?0.6:target&&target.cat==='cosmo'&&target.id!=='web'?0:0.1)*sstep(10,60,dM)*(1-sstep(1500,4000,dM)); laniakea.obj.visible=laniakea.mat.uniforms.uA.value>0.005; const G=laniakea.glowMat.uniforms; G.uCam.value.set(camGal[0]/1e6,camGal[1]/1e6,camGal[2]/1e6); G.uPx.value=uPx; G.uDpr.value=dpr; G.uFade.value=Math.min(1,laniakea.mat.uniforms.uA.value*2.5); } }
  { const cAU=mul(cam,1/AU); for(const m of [beltMat,kuiperMat]) if(m){ m.uniforms.uCam.value.set(...cAU); m.uniforms.uT.value=simJD-J2000; m.uniforms.uPx.value=uPx; m.uniforms.uDpr.value=dpr; } }
  updateConstel();
  // brillo del cielo: cerca del Sol de día reduce un poco la galaxia
  const tsec=now/1000;
  const sun=byId.sun, E=byId.earth;
  const sunRel=sub(sun.cur,cam), sunK=compressK(len(sunRel));
  sunLight.position.set(sunRel[0]*sunK,sunRel[1]*sunK,sunRel[2]*sunK);
  const camEarth=earthView;
  if(beltMat&&beltMat.pts){ beltMat.pts.visible=!interW; if(kuiperMat&&kuiperMat.pts) kuiperMat.pts.visible=!interW; }
  for(const b of bodies){
    if(hideW(b)){ b.obj.visible=false; if(b.sprite) b.sprite.visible=false; if(b.lbl) b.lbl.hidden=true; b.appMag=null; b.dist=len(sub(b.cur,cam)); continue; }
    const rel=sub(b.cur,cam); const r=Math.max(len(rel),1e-9); b.dist=r; const k=compressK(r);
    const p=new THREE.Vector3(rel[0]*k,rel[1]*k,rel[2]*k);
    b.obj.position.copy(p);
    const angR=b.R/r*uPx; // radio en px
    if(b.kind==='planet'){
      const hide=camEarth&&b.id==='earth'; b.obj.visible=!hide&&angR>0.3; if(b.atmo) b.atmo.visible=!(surf&&surf.b===b);
      b.obj.scale.setScalar(b.R*k);
      if(b.pole){ const spin=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), b.id==='earth'?(280.46061837+360.98564736629*(simJD-J2000))*D2R : 2*Math.PI*((simJD-J2000)*24/(b.rotH||24)%1)); b.obj.quaternion.copy(b.pole).multiply(spin); }
      if(angR>30) ensureTex(b);
      { const sd=norm(sub(b.lightFrom&&byId[b.lightFrom]?byId[b.lightFrom].cur:sun.cur,b.cur)); let v=new THREE.Vector3(...sd).transformDirection(camera.matrixWorldInverse); const U=b.mesh.material.uniforms; if(lightMode==='studio'&&!(surf&&surf.b===b)){ v=new THREE.Vector3(-0.45,0.55,1).normalize(); U.uAmb.value=0.16; } else U.uAmb.value=0.0015; U.uSun.value.copy(v); U.uTime.value=(tsec*0.0004)%1; if(U.uHasBump.value) U.uPoleV.value.set(0,1,0).applyQuaternion(b.obj.quaternion).transformDirection(camera.matrixWorldInverse); if(b.atmo) b.atmo.material.uniforms.uSun.value.copy(v);
        if(b.ringMat){ b.obj.updateMatrixWorld(); const ring=b.ringHolder.children[0]; const q=new THREE.Quaternion(); ring.getWorldQuaternion(q); const L=new THREE.Vector3(...sd).applyQuaternion(q.invert()); b.ringMat.uniforms.uSunL.value.copy(L); } }
      // brillo aparente (luz reflejada)
      const Lb=b.cat==='inter'&&byId.garg?byId.garg:sun; const rs=len(sub(b.cur,Lb.cur))/AU/(b.cat==='inter'?8:1), ph=(1+dot(norm(sub(Lb.cur,b.cur)),norm(sub(cam,b.cur))))/2;
      if(b.cat==='inter'&&byId.garg&&b.obj.visible){ const G=byId.garg, tg=sub(G.cur,cam), dg=len(tg); if(r>dg&&dot(norm(rel),mul(tg,1/dg))>Math.cos(Math.asin(Math.min(1,2.7*G.R/dg)))) b.obj.visible=false; }
      const m=-26.74-2.5*Math.log10(Math.max(1e-30,b.alb*Math.pow(b.R/r,2)*ph/(rs*rs)));
      b.appMag=m; if(b.sprite){ sprite(b,p,k,Math.max(m,-3), angR>2?0:2); if(b.sprite.visible&&angR>2) b.sprite.visible=false; if(hide) b.sprite.visible=false; }
    } else if(b.kind==='star'){
      b.obj.scale.setScalar(b.R*k); b.obj.visible=angR>0.25&&!b.gone; if(b.gone&&b.sprite){b.sprite.visible=false;b.vis='Explotó como supernova (simulación)';if(b.lbl)b.lbl.hidden=true;continue;} if(b.mesh) b.mesh.material.uniforms.uTime.value=tsec;
      const dpc=r/PC; const A=b.id==='sun'?0:extinctionModel(cam,b.cur); const m=b.Mv+5*Math.log10(Math.max(dpc,1e-12)/10)+A; b.appMag=m;
      sprite(b,p,k,m,angR*2.2); if(b.sprite&&angR>6) b.sprite.material.opacity*=Math.max(0,Math.min(1,(26-angR)/20)); if(b.sprite&&surf&&surf.day&&b.id!=='sun') b.sprite.material.opacity*=Math.max(0,1-surf.day*1.1);
      if(b.corona){ b.corona.visible=angR>1.5; b.corona.quaternion.copy(camQ); b.corona.material.uniforms.uTime.value=tsec; }
      b.vis=visTxt(m);
    } else if(b.kind==='ns'){
      b.obj.scale.setScalar(b.R*k); b.obj.visible=angR>0.02&&!b.unborn; if(b.unborn){ if(b.sprite)b.sprite.visible=false; b.vis='Aún no ha nacido en esta fecha'; if(b.lbl)b.lbl.hidden=true; continue; }
      const w=2*Math.PI/b.P*rate*rdir; const wv=Math.sign(w)*Math.min(Math.abs(w),2*Math.PI*(b.mag?0.6:1.4)); b.ang+=wv*dtR; b.spin.rotation.y=b.ang;
      const m=b.Mv+5*Math.log10(Math.max(r/PC,1e-12)/10); b.appMag=m; sprite(b,p,k,m,angR>0.5?angR*60:0);
      b.vis=visTxt(m);
    } else if(b.kind==='bh'){
      b.obj.scale.setScalar(b.R*k); b.obj.visible=angR>0.01;
      b.shadow.quaternion.copy(camQ); b.shadow.quaternion.premultiply(b.obj.quaternion.clone().invert());
      if(b.disk){ b.dm.uniforms.uTime.value=(tsec*0.25)%1000; b.hm.uniforms.uTime.value=tsec;
        const inv=new THREE.Matrix4().copy(b.disk.matrix).invert(); b.obj.updateMatrixWorld(); const local=new THREE.Vector3(0,0,0).applyMatrix4(new THREE.Matrix4().copy(b.disk.matrixWorld).invert()); b.dm.uniforms.uCam.value.copy(local);
        b.halo.quaternion.copy(camQ);
        const n3=new THREE.Vector3(0,0,1).applyQuaternion(b.disk.quaternion).applyQuaternion(camQ.clone().invert()); const ax=new THREE.Vector2(n3.x,n3.y); if(ax.length()<1e-3) ax.set(0,1); ax.normalize(); b.hm.uniforms.uAx.value.copy(ax);
        b.hm.uniforms.uB.value=b.disk?(1-Math.abs(n3.z))*0.9*(b.dm.uniforms.uB.value):0;
        const m=(b.Mv||0)+5*Math.log10(Math.max(r/PC,1e-12)/10)+extinctionModel(cam,b.cur); sprite(b,p,k,m,angR>1?0:0); if(b.sprite&&angR>3) b.sprite.visible=false; b.vis=visTxt(m);
      }
    } else if(b.kind==='sn'){
      const st=snState(b,simJD,cam); let ageY=-1, M=null;
      if(st){ ageY=st.age/365.25; M=snAbsMag(b,st.age); }
      if(b.starId&&byId[b.starId]) byId[b.starId].gone=!!(st&&st.age>0);
      if(b.child&&byId[b.child]) byId[b.child].unborn=!st||st.age<0;
      const pr=b.prog; pr.visible=(!st||st.age<0)&&!b.starId; const prR=b.progR; pr.scale.setScalar(prR/1); pr.material.uniforms.uTime.value=tsec;
      b.obj.scale.setScalar(k);
      const rr=remRadius(b,ageY); b.neb.visible=rr>0; b.core.visible=rr>0; if(rr>0){ b.neb.scale.setScalar(rr); b.nm.uniforms.uSize.value=rr*k*(b.type==='CC'?0.016:0.013); b.core.scale.setScalar(rr*(b.type==='CC'?1.5:2.4)); b.nm.uniforms.uPx.value=uPx; b.nm.uniforms.uDpr.value=dpr; b.nm.uniforms.uA.value=Math.min(1,st.age/40)*(b.type==='CC'?0.55:0.4)*Math.max(0.25,Math.min(1,600/(ageY+1))); }
      if(b.vol){ const px=rr/b.dist*uPx; b.vol.visible=rr>0&&px>2.5; b.neb.visible=false; if(b.vol.visible){ b.vol.scale.setScalar(rr*1.25); updVol(b.vol,Math.min(1,st.age/120)*Math.min(1,expo*1.5)); } b.core.visible=rr>0&&px<30; b.core.material.opacity=0.35*(1-sstep(5,30,px)); }
      b.R=Math.max(prR,rr);
      if(b.fire){ const ad=st?st.age:-1; const on=ad>=0&&ad<400; b.fire.visible=on; if(on){ const Rf=b.vexp*1.3*Math.max(ad,0.02)*DAY; b.fire.scale.setScalar(Rf); const Mn=snAbsMag(b,ad)||b.Mpk+10; const I=Math.pow(10,-0.4*(Mn-b.Mpk)); const T=5000+28000*Math.exp(-ad/12); const c=bbColor(T); const U=b.fire.material.uniforms; U.uCol.value.set(...c); U.uI.value=Math.min(1.4,I*1.3); U.uTime.value=tsec;
        if(ad<0.4&&b.dist<5e9&&!b.flashed){ b.flashed=true; const ov=document.createElement('div'); ov.className='cz-white'; $('#cz').appendChild(ov); setTimeout(()=>ov.remove(),2600); } } }
      const dpc=r/PC; const Aearth=b.Aobs, Amod=extinctionModel(cam,b.pos), AmodE=extinctionModel(E.cur,b.pos); const A=AmodE>0.01?Aearth*Math.min(3,Amod/AmodE):Amod;
      if(M!=null&&M<b.Mpk+16){ const m=M+5*Math.log10(Math.max(dpc,1e-12)/10)+A; b.appMag=m; sprite(b,p,k,m,0); b.vis=visTxt(m)+(m<-4?' · visible de día':''); }
      else { b.appMag=null; b.vis=!st?'Aún no explota (simulación)':st.age<0?'Su luz aún no ha llegado aquí':'El destello ya se apagó; queda el remanente'; if(b.sprite) b.sprite.visible=false; }
    } else if(b.kind==='gal'){ b.obj.visible=false; if(b.disk3) updGalDisk(b,p,k); if(b.gvol) updGalVol(b,p,k); }
    else if(b.kind==='neb'){ b.obj.scale.setScalar(b.R*k); const px=b.R/b.dist*uPx; if(b.vol){ b.vol.visible=px>2; if(b.vol.visible) updVol(b.vol,b.inten*Math.min(1,expo*1.5)*(b.id==='m16'&&target&&target.id==='pillars'&&len(sub(cam,byId.pillars.cur))<byId.pillars.R*8?0.25:1)); } const m=(b.Mv||5)+5*Math.log10(Math.max(b.dist/PC,1e-9)/10); b.appMag=m; sprite(b,p,k,m,px>6?0:2); if(b.sprite&&px>6) b.sprite.visible=false; b.vis=visTxt(m); }
    else if(b.kind==='comet'){ updateComet(b,p,k,dtR); }
    else if(b.kind==='wh'){ b.obj.scale.setScalar(b.R*k); b.obj.visible=angR>0.05; const U=b.wm.uniforms; U.uTime.value=tsec; const dv=norm(rel); U.uG.value.set(dv[0],dv[1],dv[2]); const m=b.Mv+5*Math.log10(Math.max(r/PC,1e-15)/10); b.appMag=m; sprite(b,p,k,m,angR>1.5?0:3); if(b.sprite&&angR>1.5) b.sprite.visible=false; b.vis=visTxt(m); }
    else if(b.kind==='cmb'){ b.obj.scale.setScalar(b.R*k); const dE=len(cam)/MPC; b.cm.uniforms.uA.value=microwave?0.95:0.95*sstep(10500,16000,dE); b.obj.visible=b.cm.uniforms.uA.value>0.01; }
    // etiquetas
    if(b.lbl){
      let show=showLabels>0&&(showLabels===3||b===target||b===sel||b.cat!=='bg')&&!b.gone&&!b.unborn;
      if(window.__czDev==='phone'&&b!==target&&b!==sel&&!(b.appMag!=null&&b.appMag<1.5&&b.kind!=='gal')&&!(b.kind==='planet'&&!b.parent&&r<60*AU)) show=false;
      if(b.kind==='planet'&&b.parent&&len(sub(b.parent.cur,cam))>b.parent.R*400&&b!==target) show=false;
      if(b.cat==='moons'&&len(sub(b.cur,cam))>4e7&&b!==target) show=false;
      if(b.kind==='planet'&&!b.parent&&r>300*AU&&b!==target&&b!==sel) show=false;
      if(camEarth&&b.id==='earth') show=false;
      if(b.id==='aqui') show=len(cam)>2*MPC&&showLabels>0;
      if(b.cat==='gc'&&b!==target&&b!==sel&&len(sub(b.cur,cam))>40000*PC) show=false;
      if(show){ const v=project(b); if(v.z<1&&v.z>-1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05){ const sx=(v.x+1)/2*W, sy=(1-v.y)/2*H; const off=Math.min(60,angR)+4; b.lbl.style.transform=`translate(${sx+off}px,${sy-8}px)`; b.lbl.hidden=false; b.lbl.classList.toggle('t',b===target||b===sel); } else b.lbl.hidden=true; }
      else b.lbl.hidden=true;
    }
  }
  // ocultar etiquetas tapadas por planetas/estrellas grandes en pantalla
  { const occ=bodies.filter(o=>(o.kind==='planet'||o.kind==='star')&&o.obj.visible&&o.R/o.dist*uPx>12&&!(earthView&&o.id==='earth'));
    if(occ.length) for(const b of bodies){ if(!b.lbl||b.lbl.hidden||occ.includes(b)) continue; const v=b._sp; if(!v) continue;
      for(const o of occ){ if(b.dist<=o.dist) continue; const w=project(o); const rp=o.R/o.dist*uPx; const dx=(v.x-w.x)*W/2, dy=(v.y-w.y)*H/2; if(dx*dx+dy*dy<rp*rp){ b.lbl.hidden=true; break; } } } }
  // órbitas
  for(const o of orbitLines){
    o.line.visible=showOrbits&&!earthView&&!interW;
    if(!o.line.visible) continue;
    if(!o.pts||Math.abs(simJD-o.jd)>3650){ o.jd=simJD; o.pts=[];
      if(o.el2){ const q=o.el2; for(let i=0;i<=360;i++){ const E=i/360*2*Math.PI; const xp=q.a*(Math.cos(E)-q.e), yp=q.a*Math.sqrt(1-q.e*q.e)*Math.sin(E); const w=q.w*D2R,Om=q.O*D2R,I=q.i*D2R; const cw=Math.cos(w),sw=Math.sin(w),cO=Math.cos(Om),sO=Math.sin(Om),cI=Math.cos(I),sI=Math.sin(I);
          o.pts.push(ecl2eq([((cw*cO-sw*sO*cI)*xp+(-sw*cO-cw*sO*cI)*yp)*AU,((cw*sO+sw*cO*cI)*xp+(-sw*sO+cw*cO*cI)*yp)*AU,((sw*sI)*xp+(cw*sI)*yp)*AU])); } }
      else { const el=o.b.el; const Pd=36525*360/el[9]; for(let i=0;i<=360;i++){ o.pts.push(keplerPlanet(el,simJD+Pd*i/360)); } } }
    const arr=o.line.geometry.attributes.position.array;
    for(let i=0;i<=360;i++){ const q=sub(o.pts[i],cam); const k=compressK(len(q)); arr[i*3]=q[0]*k; arr[i*3+1]=q[1]*k; arr[i*3+2]=q[2]*k; }
    o.line.geometry.attributes.position.needsUpdate=true;
    o.line.material.opacity=(len(cam)>2000*AU?0.12:0.35)*(target&&target.kind==='planet'&&len(sub(cam,target.cur))<target.R*60?0.15:1);
  }
  // agujero negro: trazado de rayos (cerca) o lente aproximada (lejos)
  let lb=strongestBH(), lensOn=false, trace=false, rcL=1e9;
  if(lb&&lb.obj.visible){ rcL=lb.dist/lb.R; const v=project(lb); const onS=v.z>-1&&v.z<1&&Math.abs(v.x)<1.8&&Math.abs(v.y)<1.8; const thE=Math.sqrt(2/rcL);
    const R0=Math.max((lb.disk?lb.outer:6)*1.25,28); const pxR0=R0/rcL*uPx; if(!window.__notrace&&((onS&&pxR0>10)||rcL<R0*1.4)) trace=true; else if(rcL<60||(onS&&Math.tan(Math.min(thE,1.2))*uPx>4)) lensOn=true; lb._R0=R0; }
  droneSet(soundOn&&lb&&!inTess?sstep(300,4,rcL)*(running?1:0):0);
  if(trace||lensOn){
    camera.layers.set(0); cubeCam.position.set(0,0,0); cubeStep(plungeS?1:(4-Math.min(3,Q.cubeEvery)));
    renderer.setRenderTarget(null);
    if(trace){ const U=bhTraceMat.uniforms; const [X,N,Z]=bhFrame(lb); U.uToD.value.set(X.x,X.y,X.z,N.x,N.y,N.z,Z.x,Z.y,Z.z); U.uFromD.value.copy(U.uToD.value).transpose();
      const rel=mul(sub(cam,lb.cur),1/lb.R); U.uCP.value.set(rel[0],rel[1],rel[2]).applyMatrix3(U.uToD.value);
      U.uInvP.value.copy(camera.projectionMatrixInverse); U.uCW.value.copy(camera.matrixWorld); U.uRin.value=3; U.uRout.value=lb.disk?lb.outer:3.1; U.uDisk.value=lb.disk?lb.dm.uniforms.uB.value:0; U.uTime.value=tsec; U.uSteps.value=plungeS?Math.min(Q.bh,120):Q.bh; U.uR0.value=lb._R0; U.uWarn.value=1-sstep(2.5,14,rcL); U.uDbg.value=window.__dbg?1:0; window.__bh={toD:U.uToD.value.elements.slice(),cw:U.uCW.value.elements.slice(0,4),ip:U.uInvP.value.elements.slice(0,4),cp:U.uCP.value.toArray(),r0:U.uR0.value,steps:U.uSteps.value,rout:U.uRout.value,disk:U.uDisk.value};
      bhTraceMat.uniformsNeedUpdate=true; renderer.render(bhTraceScene,lensCam); }
    else { const U=bhLensMat.uniforms; U.uInvP.value.copy(camera.projectionMatrixInverse); U.uCW.value.copy(camera.matrixWorld); U.uBH.value.copy(lb.obj.position).normalize(); U.uRc.value=rcL; U.uWarn.value=rcL<4&&lb.M<1e4?1:0; U.uDbg.value=0; renderer.render(bhLensScene,lensCam); }
    renderer.autoClear=false; renderer.clearDepth(); camera.layers.set(1);
    const hid=[lb.shadow,lb.disk,lb.halo].filter(Boolean); if(trace) hid.forEach(o=>o.visible=false); else lb.shadow.visible=rcL>25;
    renderer.render(scene,camera); camera.layers.set(2); renderer.render(scene,camera); renderer.autoClear=true; camera.layers.enableAll(); hid.forEach(o=>o.visible=true); lb.shadow.visible=true;
  } else { camera.layers.enableAll(); renderer.render(scene,camera); }
  dynRes(dtR);
  if(now-hudT>200){ hudT=now; hud(); }
  if(sel&&now-infoT>1000){ infoT=now; renderInfo(); }
}
function visTxt(m){ if(m==null) return ''; if(m<-30) return 'deslumbrante (estás muy cerca)'; const t=m<-4?'muy brillante':m<1?'brillante':m<6.5?'visible a simple vista':m<12?'solo con telescopio':'invisible sin grandes telescopios'; return `magnitud ${nf(m,1)} (${t})`; }
function hud(){
  $('#cz-date').textContent=fmtDate(simJD);
  const [ns,nb]=nearestSurface();
  let v=speedMode==='real'?realV*(linkTime?Math.abs(rate):1):Math.max(0.5,ns*0.9)*autoMul*(keys.shift?10:1);
  let t=`<b>${surf?'En la superficie':mode==='orbit'?'Orbitando':mode==='earth'?'En la Tierra':'Vuelo libre'}</b>`;
  if(mode==='free') t+=` · velocidad ${speedMode==='real'?fmtSpeed(realV):fmtSpeed(v)}`+(speedMode==='real'&&linkTime?` · distancia por segundo real: ${fmtDist(v)}`:'');
  if(speedMode==='real'&&realV<CK){ const g=1/Math.sqrt(1-Math.pow(realV/CK,2)); t+=` · γ = ${nf(g,3)}`; }
  if(speedMode==='real'&&shipTime>0) t+=` · reloj a bordo: ${fmtDur(shipTime)}`;
  if(target){ const d=len(sub(target.cur,cam)); t+=` · a <b>${target.name}</b>: ${fmtDist(d)}`;
    if(cruise){ const sim=d/realV; t+=` · llegada en ${fmtDur(sim)} simulados`+(linkTime&&rate?` = ${fmtDur(sim/Math.abs(rate))} reales`:''); } }
  t+=` · más cercano: ${nb?nb.name:'—'} (${fmtDist(ns)})`;
  if(mode==='earth'||surf) t+=` · campo de visión ${nf(camera.fov,1)}°`;
  if(dil>1.0005) t+=` · <span class="dil">⏳ 1 s tuyo = ${fmtDur(dil)} en la Tierra${dil>1000?' · 1 hora tuya = '+fmtDur(3600*dil):''}</span>`;
  { const dc=$('#cz-dclk'); if(dc) dc.hidden=!(surf&&surf.b.dilF); }
  if(gravityOn&&mode==='free'){ const [,ga,gb]=gravAcc(cam); t+=` · v = ${fmtSpeed(len(vel))} · gravedad ${sig(ga*1000/9.81)} g${gb?' ('+gb.name+')':''}`; }
  $('#cz-ro').innerHTML=t;
}
})();
