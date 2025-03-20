const CACHE_NAME = 'mi-cache-v1';
const urlsToCache = [
  '/',              // Página principal
  '/index.html',    // Archivo HTML
  '/styles.css',    // Archivo CSS
  '/main.js',        // Archivo JavaScript
  '/assets/calculator.png' // Imágenes u otros recursos
];

self.addEventListener('install', function(event) {
  // Almacena los recursos en caché durante la instalación
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devuelve el recurso desde la caché si está disponible
        if (response) {
          return response;
        }
        // Si no está en la caché, haz una solicitud a la red
        return fetch(event.request);
      })
  );
});