/* Arte caricaturesco original (SVG) para torres y personajes */
(function(){
const INK='#1b1030';
const S=`stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
let _tid=0;
function tower(t,w){
  w=w||200; const u='t'+(++_tid);
  let defs='',body='';
  const flag=(x,y,c)=>`<line x1="${x}" y1="${y}" x2="${x}" y2="${y-34}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path class="flag" d="M${x} ${y-34} q14 -6 28 2 q-14 6 -28 14 z" fill="${c}" ${S}/>`;
  if(t==='e'){
    defs=`<linearGradient id="${u}a" x1="0" x2="1"><stop offset="0" stop-color="#ffe48a"/><stop offset=".5" stop-color="#f7c443"/><stop offset=".5" stop-color="#d48d1c"/><stop offset="1" stop-color="#a8650f"/></linearGradient>
      <radialGradient id="${u}g" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#fff8c8"/><stop offset="1" stop-color="#f5b731"/></radialGradient>
      <linearGradient id="${u}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5d38a"/><stop offset="1" stop-color="#c9963f"/></linearGradient>`;
    body=`<ellipse cx="110" cy="182" rx="104" ry="14" fill="url(#${u}s)" ${S}/>
    <path d="M36 176 q6 -26 14 -40" stroke="#6b4a1a" stroke-width="5" fill="none"/><g fill="#2fa36a" ${S}><path d="M50 136 q-22 -4 -30 8 q16 -6 30 -8z"/><path d="M50 136 q18 -12 32 -4 q-18 0 -32 4z"/><path d="M50 136 q-6 -20 6 -28 q-2 16 -6 28z"/></g>
    <path d="M110 26 L196 176 L24 176 Z" fill="url(#${u}a)" ${S}/>
    <path d="M110 26 L196 176 L130 176 Z" fill="#000" opacity=".12"/>
    <g stroke="#8a5a12" stroke-width="2.5" opacity=".7"><path d="M90 61 H130 M76 86 H144 M62 111 H158 M48 136 H172 M34 161 H186"/><path d="M100 61 v25 M120 86 v25 M88 111 v25 M132 111 v25 M76 136 v25 M110 136 v25 M146 136 v25"/></g>
    <path d="M110 26 L124 50 H96 Z" fill="url(#${u}g)" ${S}/><path class="glint" d="M106 34 l4 -6 4 6 -4 6z" fill="#fff"/>
    <g transform="translate(110 112)"><path d="M-30 0 q15 -10 30 -2 q15 -8 30 2 q-15 4 -30 0 q-15 4 -30 0z" fill="#3d6bd8" ${S}/><circle r="9" fill="#ff6a2a" ${S}/></g>
    <path d="M100 176 v-20 a10 10 0 0 1 20 0 v20z" fill="#3a2300" ${S}/>
    <rect x="170" y="96" width="14" height="80" fill="#e9c27a" ${S}/><path d="M170 96 l7 -14 7 14z" fill="#ffd23f" ${S}/><path d="M174 110 h6 M174 122 h6 M174 134 h6 M174 146 h6" stroke="#8a5a12" stroke-width="2"/>
    ${flag(177,82,'#f5b731')}`;
  } else if(t==='c'){
    defs=`<linearGradient id="${u}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6b5e"/><stop offset="1" stop-color="#b8231d"/></linearGradient>
      <linearGradient id="${u}w" x1="0" x2="1"><stop offset="0" stop-color="#fff1d8"/><stop offset="1" stop-color="#e0c79c"/></linearGradient>
      <radialGradient id="${u}l"><stop offset="0" stop-color="#fff3a0"/><stop offset="1" stop-color="#ff8a1f"/></radialGradient>`;
    const tier=(y,wd,h,rw)=>`<rect x="${110-wd/2}" y="${y}" width="${wd}" height="${h}" fill="url(#${u}w)" ${S}/>
      <g stroke="#8e1d1a" stroke-width="5"><line x1="${110-wd/2+8}" y1="${y+2}" x2="${110-wd/2+8}" y2="${y+h}"/><line x1="${110+wd/2-8}" y1="${y+2}" x2="${110+wd/2-8}" y2="${y+h}"/></g>
      <path d="M${110-rw/2} ${y+4} Q110 ${y-16} ${110+rw/2} ${y+4} L${110+rw/2+6} ${y-6} Q${110+rw/2-10} ${y-4} ${110+wd/2} ${y-16} H${110-wd/2} Q${110-rw/2+10} ${y-4} ${110-rw/2-6} ${y-6} Z" fill="url(#${u}r)" ${S}/>
      <path d="M${110-wd/2} ${y-16} H${110+wd/2}" stroke="#ffd23f" stroke-width="3"/>
      <circle cx="${110-rw/2-6}" cy="${y-6}" r="3.5" fill="#ffd23f" ${S}/><circle cx="${110+rw/2+6}" cy="${y-6}" r="3.5" fill="#ffd23f" ${S}/>`;
    body=`<rect x="14" y="170" width="192" height="18" rx="6" fill="#8d847c" ${S}/><path d="M30 170 v18 M60 170 v18 M90 170 v18 M130 170 v18 M160 170 v18 M190 170 v18" stroke="#5e5650" stroke-width="2"/>
    <path d="M24 170 q8 -30 18 -40 q10 10 16 40z" fill="#1f7a4d" ${S}/><path d="M30 150 q12 -8 22 0" fill="none" stroke="#0f4f30" stroke-width="3"/>
    ${tier(128,96,42,132)}${tier(88,74,30,108)}${tier(54,56,24,86)}
    <rect x="98" y="142" width="24" height="28" rx="12" fill="#8e1d1a" ${S}/><circle cx="110" cy="108" r="8" fill="#ffd23f" ${S}/><rect x="104" y="102" width="12" height="12" fill="#8e1d1a"/>
    <g class="lantern"><line x1="66" y1="124" x2="66" y2="134" stroke="${INK}" stroke-width="2"/><ellipse cx="66" cy="141" rx="7" ry="9" fill="url(#${u}l)" ${S}/></g>
    <g class="lantern"><line x1="154" y1="124" x2="154" y2="134" stroke="${INK}" stroke-width="2"/><ellipse cx="154" cy="141" rx="7" ry="9" fill="url(#${u}l)" ${S}/></g>
    <line x1="110" y1="38" x2="110" y2="10" stroke="#ffd23f" stroke-width="5"/><circle cx="110" cy="22" r="5" fill="#ffd23f" ${S}/><circle cx="110" cy="10" r="4" fill="#ffd23f" ${S}/>
    ${flag(184,170,'#ef4a42')}`;
  } else {
    defs=`<linearGradient id="${u}m" x1="0" x2="1"><stop offset="0" stop-color="#d7dcc4"/><stop offset=".55" stop-color="#a7b293"/><stop offset="1" stop-color="#7d8a6c"/></linearGradient>
      <linearGradient id="${u}j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fd49b"/><stop offset="1" stop-color="#0b6b50"/></linearGradient>`;
    const step=(y,wd)=>`<rect x="${110-wd/2}" y="${y}" width="${wd}" height="22" fill="url(#${u}m)" ${S}/><path d="M${110-wd/2+6} ${y+11} H${110+wd/2-6}" stroke="#6d7a5c" stroke-width="2" stroke-dasharray="10 6"/>`;
    body=`<ellipse cx="110" cy="182" rx="104" ry="14" fill="#3f7d34" ${S}/>
    ${step(154,184)}${step(132,156)}${step(110,128)}${step(88,100)}
    <path d="M94 176 V88 H126 V176 Z" fill="#8f9b7c" ${S}/><path d="M94 166 H126 M94 156 H126 M94 146 H126 M94 136 H126 M94 126 H126 M94 116 H126 M94 106 H126 M94 96 H126" stroke="${INK}" stroke-width="2"/>
    <g ${S}><path d="M86 176 q-6 -14 6 -16 q8 4 4 16z" fill="#20c08f"/><path d="M134 176 q6 -14 -6 -16 q-8 4 -4 16z" fill="#20c08f"/></g>
    <circle cx="88" cy="166" r="2" fill="${INK}"/><circle cx="132" cy="166" r="2" fill="${INK}"/>
    <rect x="80" y="50" width="60" height="38" fill="#e3e7d2" ${S}/><path d="M98 88 V66 a12 12 0 0 1 24 0 V88z" fill="${INK}"/>
    <path d="M74 52 H146 L138 40 H82 Z" fill="url(#${u}j)" ${S}/>
    <path d="M88 40 V22 H132 V40" fill="#c9533a" ${S}/><path d="M96 22 v18 M110 22 v18 M124 22 v18" stroke="${INK}" stroke-width="2"/>
    <g class="glint"><circle cx="110" cy="14" r="6" fill="#fff3b0" ${S}/></g>
    <g fill="#1f9a5e" ${S}><path d="M14 180 q-2 -30 16 -44 q4 24 -4 44z"/><path d="M200 180 q4 -34 -14 -46 q-6 26 2 46z"/></g>
    ${flag(40,140,'#20c08f')}`;
  }
  return `<svg class="tw" viewBox="0 0 220 200" width="${w}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${body}</svg>`;
}
function crest(t,sz){ sz=sz||48;
  const c={e:['#f5b731','#94620a'],c:['#ef4a42','#8e1d1a'],m:['#20c08f','#0b6b50']}[t];
  let sym='';
  if(t==='e') sym=`<path d="M32 18 a6 7 0 1 1 0.1 0 M32 32 V50 M23 35 H41" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linecap="round"/>`;
  if(t==='c') sym=`<circle cx="32" cy="32" r="15" fill="#ffd23f" ${S}/><rect x="26" y="26" width="12" height="12" fill="${c[1]}" stroke="${INK}" stroke-width="3"/>`;
  if(t==='m') sym=`<path d="M18 34 q14 -18 28 0 q-6 12 -14 12 q-8 0 -14 -12z" fill="#fff6c8" ${S}/><path d="M24 34 q8 -6 16 0" fill="none" stroke="${INK}" stroke-width="3"/>`;
  return `<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" aria-hidden="true"><path d="M8 8 H56 V34 Q56 52 32 60 Q8 52 8 34 Z" fill="${c[0]}" ${S}/><path d="M14 14 H50 V34 Q50 47 32 54 Q14 47 14 34 Z" fill="${c[1]}" opacity=".55"/>${sym}</svg>`;
}

/* Personaje chibi parametrizado */
function chibi(o){
  const skin=o.skin||'#c98e5e', robe=o.robe||'#3d8bff', robe2=o.robe2||'#fff';
  let back='',hat='',acc='',hair='',face='';
  const eyes=`<ellipse cx="80" cy="92" rx="7" ry="9" fill="#fff" ${S}/><ellipse cx="120" cy="92" rx="7" ry="9" fill="#fff" ${S}/>
    <circle cx="82" cy="94" r="3.5" fill="${INK}"/><circle cx="118" cy="94" r="3.5" fill="${INK}"/>
    <ellipse cx="70" cy="108" rx="7" ry="4" fill="#ff8a8a" opacity=".55"/><ellipse cx="130" cy="108" rx="7" ry="4" fill="#ff8a8a" opacity=".55"/>`;
  const mouth=`<path d="M90 112 Q100 122 110 112" fill="none" ${S}/>`+(o.beard?`<path d="M86 132 Q100 158 114 132 Q100 140 86 132Z" fill="${o.beard}" ${S}/>`:'');
  switch(o.hat){
    case 'nemes': back=`<path d="M48 86 Q50 40 100 38 Q150 40 152 86 L162 140 L124 128 L76 128 L38 140 Z" fill="#f5c84c" ${S}/><path d="M50 100 L44 136 M150 100 L156 136 M60 70 L56 120 M140 70 L144 120" stroke="#3d6bd8" stroke-width="7"/>`;
      hat=`<path d="M62 62 Q100 44 138 62 L136 74 Q100 64 64 74 Z" fill="#3d6bd8" ${S}/><path d="M100 50 q-8 -14 0 -20 q8 6 0 20" fill="#ffd23f" ${S}/>`;break;
    case 'sundisk': hat=`<circle cx="100" cy="22" r="22" fill="#ff6a2a" ${S}/><path d="M74 36 q26 14 52 0" fill="none" stroke="#ffd23f" stroke-width="6"/><path d="M64 66 Q100 46 136 66 L134 76 Q100 66 66 76Z" fill="#ffd23f" ${S}/>`;
      hair=`<path d="M58 78 Q52 120 64 140 L70 96 Z M142 78 Q148 120 136 140 L130 96 Z" fill="#2a2a5a" ${S}/>`;break;
    case 'stars': hair=`<path d="M56 90 Q46 150 70 160 L76 90 Z M144 90 Q154 150 130 160 L124 90 Z" fill="${INK}"/><path d="M56 80 Q60 44 100 44 Q140 44 144 80 Q120 60 100 62 Q80 60 56 80Z" fill="${INK}"/>`;
      acc=[[70,180],[120,170],[96,200],[136,205],[60,212],[110,224]].map(p=>`<path d="M${p[0]} ${p[1]-6} l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" fill="#fff"/>`).join('');break;
    case 'bald': hat=`<path d="M60 74 Q100 40 140 74" fill="${skin}" ${S}/>`;break;
    case 'band': hair=`<path d="M56 84 Q56 44 100 44 Q144 44 144 84 Q140 66 100 64 Q60 66 56 84Z" fill="#4a3020" ${S}/>`;hat=`<path d="M56 74 Q100 60 144 74" fill="none" stroke="#f5f0d0" stroke-width="7"/><circle cx="100" cy="66" r="6" fill="#20c08f" ${S}/>`;break;
    case 'futou': hat=`<path d="M64 70 Q66 40 100 40 Q134 40 136 70 Z" fill="${INK}"/><rect x="82" y="26" width="36" height="22" rx="8" fill="${INK}"/><path d="M64 64 L22 56 L24 64 L64 70 M136 64 L178 56 L176 64 L136 70" fill="${INK}" stroke="${INK}" stroke-width="4"/>`;break;
    case 'bun': hair=`<path d="M58 80 Q58 44 100 44 Q142 44 142 80 Q130 62 100 62 Q70 62 58 80Z" fill="${INK}"/><circle cx="100" cy="36" r="13" fill="${INK}"/>`;hat=`<rect x="94" y="16" width="12" height="26" rx="3" fill="#ffd23f" ${S}/>`;break;
    case 'quetzal': hat=['#20c08f','#2fa36a','#0b6b50','#2fa36a','#20c08f'].map((c,i)=>`<ellipse cx="100" cy="32" rx="11" ry="30" fill="${c}" ${S} transform="rotate(${(i-2)*24} 100 62)"/>`).join('')+`<path d="M60 70 Q100 50 140 70 L136 80 Q100 66 64 80Z" fill="#ffd23f" ${S}/><circle cx="100" cy="66" r="7" fill="#20c08f" ${S}/>`;break;
    case 'jaguar': hat=`<path d="M58 78 Q60 36 100 34 Q140 36 142 78 Q120 62 100 62 Q80 62 58 78Z" fill="#f5a623" ${S}/><circle cx="64" cy="40" r="10" fill="#f5a623" ${S}/><circle cx="136" cy="40" r="10" fill="#f5a623" ${S}/>`+[[80,48],[100,42],[120,48],[90,56],[112,56]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${INK}"/>`).join('');break;
    case 'moon': hair=`<path d="M56 90 Q46 150 66 158 L74 90 Z M144 90 Q154 150 134 158 L126 90 Z" fill="#2b1a10"/><path d="M56 82 Q58 44 100 44 Q142 44 144 82 Q120 60 100 62 Q80 60 56 82Z" fill="#2b1a10"/>`;hat=`<path d="M84 40 A24 24 0 1 0 118 22 A18 18 0 1 1 84 40Z" fill="#fff3b0" ${S}/>`;break;
    case 'curl': hair=`<path d="M56 84 Q50 44 100 42 Q150 44 144 84 Q136 60 100 60 Q64 60 56 84Z" fill="#e8e8e8" ${S}/>`;hat=`<path d="M60 64 Q100 50 140 64" fill="none" stroke="#c8a24a" stroke-width="6"/>`;break;
  }
  if(o.serpent){ // Kukulkán: serpiente emplumada
    return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.label||''}">
    <path d="M40 220 Q20 170 70 160 Q130 150 120 110" fill="none" stroke="${INK}" stroke-width="34" stroke-linecap="round"/>
    <path d="M40 220 Q20 170 70 160 Q130 150 120 110" fill="none" stroke="#20c08f" stroke-width="26" stroke-linecap="round"/>
    <path d="M40 220 Q20 170 70 160 Q130 150 120 110" fill="none" stroke="#ffd23f" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>
    ${['#20c08f','#ff5a5a','#3d8bff','#ffd23f','#20c08f'].map((c,i)=>`<ellipse cx="118" cy="40" rx="10" ry="30" fill="${c}" ${S} transform="rotate(${(i-2)*26} 118 72)"/>`).join('')}
    <ellipse cx="122" cy="96" rx="44" ry="34" fill="#20c08f" ${S}/>
    <path d="M148 104 Q176 108 170 122 Q150 124 140 116" fill="#ff8a8a" ${S}/>
    <ellipse cx="112" cy="86" rx="9" ry="11" fill="#fff" ${S}/><circle cx="114" cy="88" r="4.5" fill="${INK}"/>
    <ellipse cx="140" cy="86" rx="8" ry="10" fill="#fff" ${S}/><circle cx="141" cy="88" r="4" fill="${INK}"/>
    <path d="M170 122 l10 6 -12 0" fill="#ff5a5a" ${S}/></svg>`;
  }
  switch(o.acc){
    case 'scroll': acc+=`<rect x="140" y="160" width="34" height="46" rx="6" fill="#f5e6c0" ${S}/><path d="M146 172 h22 M146 182 h22 M146 192 h14" stroke="${INK}" stroke-width="2"/>`;break;
    case 'ankh': acc+=`<path d="M160 150 a10 12 0 1 1 0.1 0 M160 172 V214 M146 178 H174" fill="none" stroke="#ffd23f" stroke-width="7"/>`;break;
    case 'sunspot': acc+=`<circle cx="160" cy="176" r="22" fill="#ffb02e" ${S}/><circle cx="154" cy="170" r="5" fill="${INK}"/><circle cx="166" cy="182" r="3" fill="${INK}"/>`;break;
    case 'chart': acc+=`<rect x="138" y="156" width="42" height="50" rx="4" fill="#f3e2c6" ${S}/>`+[[148,168],[166,174],[156,186],[170,196],[146,196]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#ef4a42"/>`).join('')+`<path d="M148 168 L166 174 L156 186 L170 196" fill="none" stroke="${INK}" stroke-width="1.5"/>`;break;
    case 'armillary': acc+=`<circle cx="160" cy="176" r="22" fill="none" stroke="#c8a24a" stroke-width="5"/><ellipse cx="160" cy="176" rx="22" ry="8" fill="none" stroke="#c8a24a" stroke-width="5"/><ellipse cx="160" cy="176" rx="8" ry="22" fill="none" stroke="#c8a24a" stroke-width="5"/><circle cx="160" cy="176" r="5" fill="#3d8bff" ${S}/><line x1="160" y1="198" x2="160" y2="220" ${S}/>`;break;
    case 'clocktower': acc+=`<rect x="146" y="150" width="30" height="60" fill="#ef4a42" ${S}/><path d="M140 152 L161 132 L182 152Z" fill="#8e1d1a" ${S}/><circle cx="161" cy="170" r="9" fill="#fff" ${S}/><path d="M161 170 V164 M161 170 h5" stroke="${INK}" stroke-width="2"/>`;break;
    case 'gnomon': acc+=`<rect x="152" y="130" width="14" height="86" fill="#9b8f86" ${S}/><path d="M166 214 L196 214" stroke="#ffd23f" stroke-width="6"/><circle cx="182" cy="130" r="10" fill="#ffd23f" ${S}/>`;break;
    case 'codex': acc+=`<path d="M136 160 h16 v48 h-16z M152 160 h16 v48 h-16z M168 160 h16 v48 h-16z" fill="#f5efe0" ${S}/><circle cx="144" cy="176" r="4" fill="#ef4a42"/><rect x="156" y="182" width="8" height="8" fill="#20c08f"/><circle cx="176" cy="192" r="4" fill="#3d8bff"/>`;break;
    case 'venus': acc+=`<path d="M162 150 l6 16 17 1 -13 11 5 17 -15 -10 -15 10 5 -17 -13 -11 17 -1z" fill="#fff3b0" ${S}/><line x1="162" y1="196" x2="162" y2="222" ${S}/>`;break;
    case 'jade': acc+=`<path d="M70 154 Q100 176 130 154" fill="none" stroke="#20c08f" stroke-width="9"/><circle cx="100" cy="170" r="8" fill="#20c08f" ${S}/>`;break;
    case 'rabbit': acc+=`<ellipse cx="160" cy="200" rx="18" ry="14" fill="#fff" ${S}/><ellipse cx="152" cy="178" rx="5" ry="14" fill="#fff" ${S}/><ellipse cx="166" cy="178" rx="5" ry="14" fill="#fff" ${S}/><circle cx="166" cy="198" r="2.5" fill="${INK}"/>`;break;
    case 'clepsydra': acc+=`<path d="M144 156 h34 l-6 52 h-22z" fill="#9fd8ff" ${S}/><path d="M150 176 h22" stroke="#3d8bff" stroke-width="3"/>`;break;
  }
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.label||''}">
  ${back}
  <path d="M56 236 Q60 150 100 146 Q140 150 144 236 Z" fill="${robe}" ${S}/>
  <path d="M100 146 L100 236" stroke="${robe2}" stroke-width="10"/>
  <path d="M82 150 L100 176 L118 150" fill="${robe2}" ${S}/>
  <circle cx="54" cy="196" r="12" fill="${skin}" ${S}/><circle cx="146" cy="196" r="12" fill="${skin}" ${S}/>
  ${hair}
  <circle cx="100" cy="96" r="48" fill="${skin}" ${S}/>
  ${o.hat==='stars'?`<circle cx="100" cy="96" r="44" fill="none"/>`:''}
  ${eyes}${mouth}${hat}${acc}
  </svg>`;
}

const CHARS={
  e:[
    {name:'Nut',role:'Diosa del cielo',txt:'Se arqueaba sobre la tierra; cada amanecer daba a luz al Sol.',o:{skin:'#3a59c9',robe:'#2b3f99',robe2:'#ffd23f',hat:'stars'}},
    {name:'Ra',role:'Dios del Sol',txt:'Cruzaba el cielo en su barca de día y el inframundo de noche.',o:{skin:'#c98e5e',robe:'#f5c84c',robe2:'#ff6a2a',hat:'sundisk',acc:'ankh'}},
    {name:'Imhotep',role:'Arquitecto y sabio',txt:'Constructor de la primera pirámide escalonada, orientada con el cielo.',o:{skin:'#b97a4c',robe:'#f2ead8',robe2:'#3d8bff',hat:'bald',acc:'scroll'}},
    {name:'Ptolomeo III',role:'Faraón',txt:'Su Decreto de Canopo (238 a.C.) propuso añadir un día cada 4 años.',o:{skin:'#d4a070',robe:'#f2ead8',robe2:'#f5b731',hat:'nemes',acc:'clepsydra'}},
    {name:'Sosígenes',role:'Astrónomo de Alejandría',txt:'Asesoró la reforma juliana (46 a.C.): un año de 365¼ días.',o:{skin:'#d9a878',robe:'#8a5cd8',robe2:'#fff',hat:'curl',beard:'#e8e8e8',acc:'scroll'}}
  ],
  c:[
    {name:'Gan De',role:'Astrónomo (s. IV a.C.)',txt:'Anotó una mancha solar hacia el 364 a.C., dos mil años antes del telescopio.',o:{skin:'#efc89a',robe:'#ef4a42',robe2:'#ffd23f',hat:'futou',acc:'sunspot',beard:'#1b1030'}},
    {name:'Shi Shen',role:'Astrónomo (s. IV a.C.)',txt:'Uno de los primeros catalogadores de estrellas de China.',o:{skin:'#efc89a',robe:'#3d6bd8',robe2:'#fff',hat:'futou',acc:'chart'}},
    {name:'Zhang Heng',role:'Astrónomo imperial',txt:'Construyó esferas armilares movidas por agua para seguir el cielo.',o:{skin:'#efc89a',robe:'#20a080',robe2:'#ffd23f',hat:'bun',acc:'armillary',beard:'#1b1030'}},
    {name:'Su Song',role:'Ingeniero (c. 1090)',txt:'Su torre-reloj de 12 m en Kaifeng movía una esfera que seguía las estrellas.',o:{skin:'#efc89a',robe:'#8e1d1a',robe2:'#ffd23f',hat:'futou',acc:'clocktower'}},
    {name:'Guo Shoujing',role:'Astrónomo (1276)',txt:'Su torre de Gaocheng midió la sombra del Sol y el año con gran precisión.',o:{skin:'#efc89a',robe:'#f39c1f',robe2:'#8e1d1a',hat:'bun',acc:'gnomon'}}
  ],
  m:[
    {name:'Kukulkán',role:'Serpiente emplumada',txt:'Ligado a Venus; su sombra baja por El Castillo en los equinoccios.',o:{serpent:true}},
    {name:'Itzamná',role:'Señor del cielo',txt:'Dios creador asociado a la escritura y al saber del calendario.',o:{skin:'#a8673c',robe:'#20c08f',robe2:'#ffd23f',hat:'band',acc:'codex'}},
    {name:'Ixchel',role:'Diosa de la Luna',txt:'Los mayas seguían la Luna para anticipar eclipses en sus tablas.',o:{skin:'#b8784a',robe:'#e8486b',robe2:'#fff3b0',hat:'moon',acc:'rabbit'}},
    {name:'Pakal el Grande',role:'Gobernante de Palenque',txt:'Rey del Clásico maya, cuando florecieron sus calendarios.',o:{skin:'#a8673c',robe:'#0b6b50',robe2:'#ffd23f',hat:'quetzal',acc:'jade'}},
    {name:'Ah K\'in',role:'Sacerdote astrónomo',txt:'Contaba los 584 días de Venus y corregía el error de las tablas.',o:{skin:'#9a5c34',robe:'#f39c1f',robe2:'#1b1030',hat:'jaguar',acc:'venus'}}
  ]
};
window.Art={tower,crest,chibi,CHARS};
})();
