/* FleetDesk service worker: fetches the newest app when online (falls back to the saved copy after 3.5 seconds on a slow signal or when offline). The spreadsheet library is kept so it does not download every time. */
const CACHE='fleetdesk-v53', LIBS='fleetdesk-libs';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil((async()=>{ const old=(await caches.keys()).filter(x=>x!==CACHE&&x!==LIBS); await Promise.all(old.map(x=>caches.delete(x))); await self.clients.claim(); if(old.length){ const cs=await self.clients.matchAll({type:'window'}); cs.forEach(c=>{ try{ c.navigate(c.url); }catch(x){} }); } })()); });   // an upgrade reloads any open window so nobody keeps running an old version
self.addEventListener('fetch',e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method==='GET'&&u.hostname==='cdnjs.cloudflare.com'){ e.respondWith(caches.open(LIBS).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{ try{ c.put(r,res.clone()); }catch(x){} return res; })))); return; }
  if(r.method!=='GET'||u.origin!==location.origin) return;           // data (Apps Script), fonts: normal network
  const net=fetch(r,{cache:'no-cache'}).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(r,copy)); return res; });
  const slow=new Promise(res=>setTimeout(()=>res(caches.match(r)),3500));
  e.respondWith(Promise.race([net.catch(()=>null),slow]).then(x=>x||net.catch(()=>caches.match(r)).then(y=>y||caches.match('index.html'))));
});
