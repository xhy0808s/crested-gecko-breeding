'use strict';

const CACHE_NAME = 'gecko-breeding-v3.0.0';
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './firebase-sync.js', 
  './bulk-import.js',
  './user-auth.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.svg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/dist/web/static/pretendard.css'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 캐시 파일 추가 중...');
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('일부 파일 캐시 실패:', err);
          // 중요하지 않은 파일은 무시하고 진행
        });
      })
  );
  self.skipWaiting(); // 즉시 활성화
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker 활성화됨');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // 즉시 제어권 획득
    })
  );
});

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // chrome-extension, data, blob URL은 무시
  if (event.request.url.startsWith('chrome-extension://') ||
      event.request.url.startsWith('data:') ||
      event.request.url.startsWith('blob:')) {
    return;
  }

  // Firebase 및 Google 서비스는 네트워크 우선
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // 나머지는 캐시 우선
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // 성공한 응답만 캐시에 저장
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      }).catch(() => {
        // 오프라인 시 기본 페이지 반환
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', (event) => {
  console.log('🔄 백그라운드 동기화 실행:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // 클라이언트에게 동기화 명령 전송
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'BACKGROUND_SYNC',
            action: 'sync'
          });
        });
      })
    );
  }
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '게코 브리딩', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    tag: 'gecko-notification',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'view',
        title: '확인',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '게코 브리딩 시스템', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// 메시지 수신 처리
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'REQUEST_SYNC') {
    // 즉시 동기화 요청
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'START_SYNC'
        });
      });
    });
  }
});

console.log('🚀 Service Worker 로드 완료 - v3.0.0');