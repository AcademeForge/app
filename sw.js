const CACHE_NAME = "academeforge-v3";

const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline/",
  "/offline/index.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
      .then(() => self.skipWaiting())
  );
});

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

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") return;

  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/functions/v1/")
  ) {
    return;
  }

  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => cache.put(request, copy));

          return response;
        })
        .catch(async () => {

          const cached = await caches.match(request);

          if (cached) return cached;

          return caches.match("/offline/");
        })
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {

      if (cached) return cached;

      return fetch(request)
        .then(response => {

          if (
            response.status === 200 &&
            response.type === "basic"
          ) {
            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, response.clone()));
          }

          return response;
        });
    })
  );

});
