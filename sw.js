const CACHE_NAME = "academeforge-v1";

const STATIC_FILES = [
  "/",
  "/index.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
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

self.addEventListener("fetch", (event) => {

  const request = event.request;

  // Never touch POST requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Supabase APIs
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/functions/v1/")
  ) {
    return;
  }

  // HTML pages -> Network First
  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  // Static files -> Cache First
  event.respondWith(
    caches.match(request).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(request)
        .then(response => {

          if (
            response &&
            response.status === 200 &&
            response.type === "basic"
          ) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));
          }

          return response;
        });
    })
  );

});
