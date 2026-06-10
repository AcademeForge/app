const CACHE_NAME = "academeforge-v4";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline/",
  "/offline/index.html"
];

/* INSTALL */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/* FETCH */
self.addEventListener("fetch", event => {

  const request = event.request;

  /* Ignore non-GET requests */
  if (request.method !== "GET") {
    return;
  }

  /* Ignore Supabase APIs */
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/functions/v1/")
  ) {
    return;
  }

  /* HTML Navigation Requests */
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });

          return response;
        })
        .catch(async () => {

          const cachedPage = await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          return caches.match("/offline/index.html");
        })
    );

    return;
  }

  /* Static Assets */
  event.respondWith(
    caches.match(request).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(request)
        .then(response => {

          if (!response || response.status !== 200) {
            return response;
          }

          const responseClone = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });

          return response;
        })
        .catch(() => {
          return caches.match(request);
        });

    })
  );

});
