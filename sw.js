/* FUGA · service worker — sube CACHE en cada publicación */
const CACHE = "fuga-v5";
const ASSETS = ["./","./index.html","./icon-180.png","./icon-192.png","./icon-512.png","./manifest.json"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  if(/simpleicons\.org|fonts\.(googleapis|gstatic)\.com/.test(req.url)){
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const c = res.clone(); caches.open(CACHE).then(x => x.put(req,c)); return res;
    }).catch(() => hit)));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    const c = res.clone(); caches.open(CACHE).then(x => x.put(req,c)); return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html"))));
});
