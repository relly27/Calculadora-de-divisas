const CACHE_NAME = 'v7';
const MAX_CACHE_DAYS = 4; // Configura el número máximo de días
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/assets/calculator.png'
];

// Función para borrar caché expirada
const clearExpiredCache = async () => {
  const cache = await caches.open(CACHE_NAME);
  const cachedRequests = await cache.keys();
  const now = new Date();

  cachedRequests.forEach(async (request) => {
    const cachedResponse = await cache.match(request);
    if (!cachedResponse) return;

    const cachedDate = new Date(cachedResponse.headers.get('date'));
    const cacheAgeInDays = (now - cachedDate) / (1000 * 60 * 60 * 24);

    if (cacheAgeInDays > MAX_CACHE_DAYS) {
      await cache.delete(request);
      console.log(`Borrado recurso expirado: ${request.url}`);
    }
  });
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('Borrando caché antigua:', name);
            return caches.delete(name);
          }
        })
      )
    )
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Verificación de frescura (solo para respuestas cacheadas)
      if (response) {
        const cachedDate = new Date(response.headers.get('date'));
        const cacheAgeInDays = (new Date() - cachedDate) / (1000 * 60 * 60 * 24);
        
        if (cacheAgeInDays > MAX_CACHE_DAYS) {
          console.log(`Recurso expirado: ${event.request.url}`);
          return fetch(event.request) // Obtener versión fresca
            .then(freshResponse => {
              const clone = freshResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clone));
              return freshResponse;
            })
            .catch(() => response); // Fallback al recurso expirado si falla la red
        }
        return response;
      }
      return fetch(event.request); // No estaba en caché
    })
  );
});

// Limpieza periódica (cada 24 horas)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'clean-cache') {
    event.waitUntil(clearExpiredCache());
  }
});