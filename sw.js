const CACHE_NAME = 'gecko-breeding-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/register.html',
  '/list.html',
  '/tree.html',
  '/marketplace.html',
  '/clear-storage.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// 설치 시 캐시에 파일들 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시가 열렸습니다');
        return cache.addAll(urlsToCache);
      })
  );
});

// 요청 시 캐시에서 응답
self.addEventListener('fetch', event => {
  // chrome-extension:// 스키마 요청은 무시
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // data: URL 요청은 무시
  if (event.request.url.startsWith('data:')) {
    return;
  }
  
  // blob: URL 요청은 무시
  if (event.request.url.startsWith('blob:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에 있으면 캐시된 응답 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크에서 가져오기
        return fetch(event.request)
          .then(response => {
            // 유효한 응답이 아니면 그대로 반환
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 응답을 복제하여 캐시에 저장
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.log('캐시 저장 실패:', error);
              });

            return response;
          })
          .catch(error => {
            console.log('네트워크 요청 실패:', error);
            return new Response('네트워크 오류', { status: 503 });
          });
      })
  );
});

// 캐시 업데이트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // 백그라운드에서 데이터 동기화 로직
  console.log('백그라운드 동기화 실행');
} 