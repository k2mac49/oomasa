/* 屋台レジ Service Worker：アプリ本体をキャッシュしてオフライン起動 */
const CACHE = "regi-cache-v10";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 画面（HTML）はネット優先＝更新が必ず届く。電波が弱い現場でも待たされないよう
   2.5秒でキャッシュに切り替える。画像やmanifestは従来どおりキャッシュ優先。 */
const NET_TIMEOUT = 2500;

function fromNetwork(req){
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), NET_TIMEOUT);
    fetch(req).then(res => {
      clearTimeout(timer);
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      resolve(res);
    }).catch(err => { clearTimeout(timer); reject(err); });
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const isDoc = req.mode === "navigate" || req.destination === "document";
  if (isDoc) {
    e.respondWith(
      fromNetwork(req).catch(() =>
        caches.match(req).then(hit => hit || caches.match("./index.html"))
      )
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
