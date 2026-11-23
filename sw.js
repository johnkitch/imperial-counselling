/*
 * Offline support for the home-screen web app. Filled in at build time by vite.config.ts:
 * VERSION becomes a hash of the build, ASSETS the list of files to keep on the phone.
 * Only the empty app is cached. Student data never passes through here: it lives in IndexedDB.
 */
const VERSION = "a707ca8802b0";
const ASSETS = [
  "./",
  "./index.html",
  "./assets/index-B2wU8Whb.js",
  "./assets/ClassListsStep-BKUWi0Ya.js",
  "./assets/ConcernsStep-DsDd9M3u.js",
  "./assets/ConfirmStep-CegVM-I7.js",
  "./assets/DisciplineStep-CugIASoF.js",
  "./assets/HistoryStep-BtjU9C2h.js",
  "./assets/MyClassesStep-RqVgNLU6.js",
  "./assets/TimetableStep-P0MbIyYg.js",
  "./assets/classNotes-DB_XPYQ6.js",
  "./assets/db-Pwdg-xhg.js",
  "./assets/esm-8O2-4395.js",
  "./assets/esm-BCfbO1xJ.js",
  "./assets/esm-C-g3O0cC.js",
  "./assets/esm-CKepQGHB.js",
  "./assets/esm-CgJyBxPW.js",
  "./assets/esm-myED0iLd.js",
  "./assets/files-ClDW02D0.js",
  "./assets/jsQR-B1eQcpQl.js",
  "./assets/logo-BB462EX5.js",
  "./assets/observationsSheet-DeH1W4c8.js",
  "./assets/observationsWord-5GNM9uxE.js",
  "./assets/pdf-CCordE1x.js",
  "./assets/pdf.worker.min-BZvI6j8m.js",
  "./assets/periodReport-DPTQYLH8.js",
  "./assets/rolldown-runtime-Dd_uD5pT.js",
  "./assets/studentReport-naODdGUS.js",
  "./assets/time-PUD3MHdy.js",
  "./assets/web-6PRrZNZE.js",
  "./assets/web-B3Jizwf8.js",
  "./assets/web-BpB5Js-9.js",
  "./assets/web-CC4VBKHW.js",
  "./assets/web-DvSUie58.js",
  "./assets/web-kYSxjBVs.js",
  "./assets/amiri-arabic-400-normal-D0NIBXga.woff2",
  "./assets/amiri-arabic-700-normal-D8FrblyB.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-400-normal-CyU-ddYS.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-500-normal-C4MQITzh.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-600-normal-0pRdybE_.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-700-normal-DrtBj6UE.woff2",
  "./assets/index-DAffPZtx.css",
  "./assets/inter-latin-400-normal-C38fXH4l.woff2",
  "./assets/inter-latin-500-normal-Cerq10X2.woff2",
  "./assets/inter-latin-600-normal-LgqL8muc.woff2",
  "./assets/inter-latin-700-normal-Yt3aPRUw.woff2",
  "./assets/noto-kufi-arabic-arabic-500-normal-DrsK1iQh.woff2",
  "./assets/noto-kufi-arabic-arabic-700-normal-CGKuvZQr.woff2",
  "./assets/playfair-display-latin-600-normal-CZLGqjJe.woff2",
  "./assets/playfair-display-latin-700-normal-CuDiGg7c.woff2",
  "./assets/roboto-slab-latin-500-normal-DwNfslcc.woff2",
  "./assets/roboto-slab-latin-700-normal-WCCj9XVQ.woff2",
  "./brand/school-crest.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-64.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./manifest.webmanifest"
];
const CACHE = `imperial-counselling-${VERSION}`;
/**
 * Hosts mark files "Vary: Origin" or "Vary: Accept-Encoding", and the page's own script and style requests carry
 * different headers from the ones that filled the cache, so honouring Vary made every lookup miss and the app
 * opened blank offline. These are our own static files: the URL alone identifies them.
 */
const MATCH = { ignoreSearch: true, ignoreVary: true };
/** Update files are always read fresh, so a release is seen as soon as the phone is online. */
const NEVER_CACHED = /(?:^|\/)(?:version\.json|bundle-[^/]*\.zip)$/;

/*
 * A new version waits (no skipWaiting) until every page of the running one is closed, and is used from the next launch.
 * Taking over at once would delete, in activate, the cache that the open page still loads its lazy screens from,
 * while the release has already removed those files from the host. Copies are fetched past the browser's HTTP cache,
 * so a just-published index.html is never stored as the previous one.
 */
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })))));
});

// Runs only once no page uses the previous version any more, so its cache can go.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name.startsWith('imperial-counselling-') && name !== CACHE).map(name => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

function fromNetworkThenCache(request, fallbackUrl) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000));
  return Promise.race([fetch(request), timeout])
    .then(response => {
      if (response.ok) {
        caches.open(CACHE).then(cache => cache.put(fallbackUrl, response.clone()));
        return response.clone();
      }
      if (response.type === 'opaqueredirect') return response;
      // The host answered with an error page (an outage, or the site withdrawn or moved): the kept copy still opens the app.
      return caches.match(fallbackUrl, MATCH).then(hit => hit || response);
    })
    .catch(() => caches.match(fallbackUrl, MATCH).then(hit => hit || Response.error()));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || NEVER_CACHED.test(url.pathname)) return;

  // The page itself: newest when online (so an update arrives by itself), the kept copy when offline.
  if (request.mode === 'navigate') {
    event.respondWith(fromNetworkThenCache(request, new URL('./index.html', self.registration.scope).href));
    return;
  }

  // Everything else has its content hash in its name, or rarely changes: kept copy first.
  event.respondWith(
    caches.match(request, MATCH).then(hit => hit || fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    })),
  );
});
