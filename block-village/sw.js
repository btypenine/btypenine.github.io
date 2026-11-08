// 블록 빌리지 오프라인 캐시: 게임 화면은 항상 최신(네트워크 우선), 소리·아이콘은 캐시 우선
const CACHE = 'block-village-v0.8';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'music/music_day.mp3', 'music/music_night.mp3', 'sounds/sfx_bomb.mp3', 'sounds/sfx_build.mp3', 'sounds/sfx_checkpoint.mp3', 'sounds/sfx_chest.mp3', 'sounds/sfx_clear.mp3', 'sounds/sfx_click.mp3', 'sounds/sfx_coin.mp3', 'sounds/sfx_combo.mp3', 'sounds/sfx_dawn.mp3', 'sounds/sfx_defeat.mp3', 'sounds/sfx_drop.mp3', 'sounds/sfx_gem.mp3', 'sounds/sfx_hammer.mp3', 'sounds/sfx_hurt.mp3', 'sounds/sfx_kill.mp3', 'sounds/sfx_levelup.mp3', 'sounds/sfx_merge.mp3', 'sounds/sfx_night.mp3', 'sounds/sfx_place.mp3', 'sounds/sfx_revive.mp3', 'sounds/sfx_w_arrow.mp3', 'sounds/sfx_w_aura.mp3', 'sounds/sfx_w_axe.mp3', 'sounds/sfx_w_bolt.mp3', 'sounds/sfx_w_lightning.mp3'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                       // 외부 요청(브리지 등)은 건드리지 않음
  if (req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; })));
});
