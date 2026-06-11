// Oxford 5000 service worker
const CACHE = 'oxford5000-9352ab88';
const ASSETS = ['.', 'index.html', 'manifest.webmanifest',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(
    ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  // 다른 도메인(폰트/Supabase 등)은 그냥 네트워크로
  if(url.origin!==location.origin) return;
  // 페이지 이동: 네트워크 우선, 실패하면 캐시
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{
      const cp=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); return r;
    }).catch(()=>caches.match('index.html').then(r=>r||caches.match('.'))));
    return;
  }
  // 그 외 같은 도메인 자원: 캐시 우선, 없으면 네트워크 후 캐시에 저장
  e.respondWith(caches.match(req).then(c=>c||fetch(req).then(r=>{
    const cp=r.clone(); caches.open(CACHE).then(ch=>ch.put(req,cp)); return r;
  }).catch(()=>c)));
});
