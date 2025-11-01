// Имя кэша. Меняйте версию (v1, v2), если хотите обновить закэшированные файлы.
const CACHE_NAME = 'transmission-cache-v1';

// Список основных файлов, необходимых для запуска приложения.
// Удалены ./favicon.png и ./index.html для повышения надежности установки.
// Остальные ресурсы (например, скрипты с CDN) будут кэшироваться динамически при первом доступе.
const urlsToCache = [
  '/',
  'https://cdn.jsdelivr.net/npm/intro.js@7.2.0/minified/intro.js',
  'https://cdn.jsdelivr.net/npm/intro.js@7.2.0/minified/introjs.min.css',
];

// Этап установки: открываем кэш и добавляем в него основные файлы.
self.addEventListener('install', (event) => {
  // Пропускаем ожидание, чтобы новый Service Worker активировался сразу после установки.
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Кэш открыт, добавляем основные ресурсы');
        return cache.addAll(urlsToCache);
      })
  );
});

// Этап активации: удаляем старые версии кэша и берем управление на себя.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Захватываем контроль над открытыми страницами
  );
});

// Этап перехвата запросов (fetch): стратегия "Сначала кэш, потом сеть".
self.addEventListener('fetch', (event) => {
  // Мы обрабатываем только GET-запросы.
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Игнорируем запросы к Firebase и другим сервисам Google, чтобы не мешать их собственной логике.
  if (url.hostname.includes('googleapis.com')) {
    return;
  }
  // Аналитику Vercel также всегда отправляем в сеть.
  if (url.hostname.includes('vitals.vercel-insights.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Если ресурс есть в кэше - отдаем его.
      if (cachedResponse) {
        return cachedResponse;
      }

      // Если ресурса в кэше нет - идем в сеть.
      return fetch(event.request).then((networkResponse) => {
        // Если из сети пришел успешный ответ, клонируем его и сохраняем в кэш.
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        // Отдаем ответ из сети браузеру.
        return networkResponse;
      }).catch(error => {
        console.error('Ошибка при запросе к сети:', error);
        // При ошибке сети (офлайн) для уже закэшированных ресурсов ничего не произойдет,
        // а для новых будет стандартная ошибка сети.
      });
    })
  );
});