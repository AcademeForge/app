const CACHE_NAME = "academeforge-v8";

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

  /* Only GET requests */
  if (request.method !== "GET") return;

  /* Never cache backend/API */
  if (
    request.url.includes("supabase.co") ||
    request.url.includes("/functions/v1/") ||
    request.url.includes("/rest/v1/") ||
    request.url.includes("/auth/v1/")
  ) {
    return;
  }

  /* HTML Pages -> Network First */
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then(response => {

          if (response && response.status === 200) {

            const clone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, clone))
              .catch(() => {});
          }

          return response;
        })

        .catch(async () => {

          const cached = await caches.match(request);

          if (cached) return cached;

          return caches.match("/offline/index.html");
        })

    );

    return;
  }

  /* Frontend Assets -> Cache First */
  event.respondWith(

    caches.match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)

          .then(response => {

            if (
              !response ||
              response.status !== 200
            ) {
              return response;
            }

            const clone = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, clone))
              .catch(() => {});

            return response;
          })

          .catch(() => caches.match(request));

      })

  );

});
