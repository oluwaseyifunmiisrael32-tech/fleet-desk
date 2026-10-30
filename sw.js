/* FleetDesk service worker: always fetches the newest app when online; the cached copy is only a fallback for no signal. */
const CACHE='fleetdesk-v23';
const SHELL=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin) return;           // data (Apps Script), fonts, libraries: normal network
  e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(r,copy)); return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
});
