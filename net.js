/* Conexión de celulares fuera de claude.ai: PeerJS (WebRTC, sin cuenta ni servidor propio).
   Ofrece la misma interfaz que el «room» de Claude: join(nombre, rol) → {presence, onPeers, leave}. */
(function(){
'use strict';
const PREFIX='cielos-antiguos-v1-';
let libP=null;
function loadLib(){ if(window.Peer) return Promise.resolve(); if(!libP) libP=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src='peerjs.min.js'; s.onload=()=>window.Peer?res():rej(new Error('peerjs')); s.onerror=()=>rej(new Error('peerjs')); document.head.appendChild(s); }); return libP; }
const PEER_OPTS={config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'}]}};

function hostRoom(name){
  return new Promise((res,rej)=>{
    const peer=new Peer(PREFIX+name,PEER_OPTS); const conns=new Map(); let me={}, handlers=[], errH=[], opened=false;
    const emitPeers=()=>{ const list=[...conns.values()].filter(c=>c.presence).map(c=>({peer:c.id,presence:c.presence,updatedAt:c.updatedAt,isMe:false,sameTab:false,kind:'viewer',guest:false,by:null})); handlers.forEach(h=>{ try{ h({peers:list,joined:[],left:[],updated:[]}); }catch(e){} }); };
    const sendAll=()=>{ const msg=JSON.stringify({t:'h',p:me}); conns.forEach(c=>{ if(c.conn.open) try{ c.conn.send(msg); }catch(e){} }); };
    peer.on('open',()=>{ opened=true; res(api); });
    peer.on('connection',conn=>{ const rec={id:conn.peer,conn,presence:null,updatedAt:0}; conns.set(conn.peer,rec);
      conn.on('open',()=>{ try{ conn.send(JSON.stringify({t:'h',p:me})); }catch(e){} });
      conn.on('data',d=>{ try{ const m=typeof d==='string'?JSON.parse(d):d; if(m.t==='p'){ rec.presence=m.p; rec.updatedAt=Date.now(); emitPeers(); } }catch(e){} });
      conn.on('close',()=>{ conns.delete(conn.peer); emitPeers(); }); conn.on('error',()=>{ conns.delete(conn.peer); emitPeers(); }); });
    peer.on('disconnected',()=>{ try{ peer.reconnect(); }catch(e){} });
    peer.on('error',e=>{ if(!opened) rej(e); else errH.forEach(h=>h({code:'upstream_error',message:String(e.type||e)})); });
    const api={name,presence(patch){ for(const k in patch){ if(patch[k]===null) delete me[k]; else me[k]=patch[k]; } sendAll(); return Promise.resolve(); },
      onPeers(fn,onErr){ handlers.push(fn); if(onErr) errH.push(onErr); setTimeout(emitPeers,0); return ()=>{ handlers=handlers.filter(h=>h!==fn); }; },
      peers(){ return []; }, connected(){ return !peer.disconnected; },
      leave(){ try{ peer.destroy(); }catch(e){} return Promise.resolve(); }};
    setTimeout(()=>{ if(!opened) rej(new Error('timeout')); },15000);
  });
}
function phoneRoom(name){
  return new Promise((res,rej)=>{
    const peer=new Peer(PEER_OPTS); let conn=null, me={}, handlers=[], host=null, dead=false, opened=false;
    const emit=()=>{ const list=host?[{peer:'host',presence:host,updatedAt:host._at,isMe:false,sameTab:false,kind:'viewer',guest:false,by:null}]:[]; handlers.forEach(h=>{ try{ h({peers:list,joined:[],left:[],updated:[]}); }catch(e){} }); };
    const send=()=>{ if(conn&&conn.open) try{ conn.send(JSON.stringify({t:'p',p:me})); }catch(e){} };
    const connect=()=>{ if(dead) return; conn=peer.connect(PREFIX+name,{reliable:true});
      conn.on('open',send);
      conn.on('data',d=>{ try{ const m=typeof d==='string'?JSON.parse(d):d; if(m.t==='h'){ host=Object.assign({},m.p); host._at=Date.now(); emit(); } }catch(e){} });
      conn.on('close',()=>{ host=null; emit(); setTimeout(connect,2500); });
      conn.on('error',()=>{}); };
    peer.on('open',()=>{ opened=true; connect(); res(api); });
    peer.on('error',e=>{ if(!opened) rej(e); else if(e.type==='peer-unavailable'){ host=null; emit(); setTimeout(connect,3000); } });
    peer.on('disconnected',()=>{ try{ peer.reconnect(); }catch(e){} });
    const api={name,presence(patch){ for(const k in patch){ if(patch[k]===null) delete me[k]; else me[k]=patch[k]; } send(); return Promise.resolve(); },
      onPeers(fn){ handlers.push(fn); setTimeout(emit,0); return ()=>{ handlers=handlers.filter(h=>h!==fn); }; },
      peers(){ return []; }, connected(){ return !!(conn&&conn.open); },
      leave(){ dead=true; try{ peer.destroy(); }catch(e){} return Promise.resolve(); }};
    setTimeout(()=>{ if(!opened) rej(new Error('timeout')); },15000);
  });
}
window.CielosNet={ room(){ return loadLib().then(()=>({ peerjs:true, join:(name,role)=>role==='host'?hostRoom(name):phoneRoom(name) })).catch(()=>null); } };
})();
