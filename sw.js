/*
 * Offline support for the home-screen web app. Filled in at build time by vite.config.ts:
 * VERSION becomes a hash of the build, ASSETS the list of files to keep on the phone.
 * Only the empty app is cached. Student data never passes through here: it lives in IndexedDB.
 */
const VERSION = "ff0d96f47a89";
const ASSETS = [
  "./",
  "./index.html",
  "./assets/index-D6LAWUmB.js",
  "./assets/CaseloadStep-BTkaiAqa.js",
  "./assets/ClassListsStep-BBoJ7N8e.js",
  "./assets/ConcernsStep-DBWZn9np.js",
  "./assets/ConfirmStep-KBtpmwIz.js",
  "./assets/DisciplineStep-Ckkpv29F.js",
  "./assets/HistoryStep-BHz1oNHx.js",
  "./assets/MyClassesStep-CaW2OzTz.js",
  "./assets/TimetableStep-DlJU0a9W.js",
  "./assets/classListPdf-C6oxF4iF.js",
  "./assets/classNotes-C5f3xTiT.js",
  "./assets/esm-1sAMKA5o.js",
  "./assets/esm-B3x6dpIC.js",
  "./assets/esm-BLlnDCPR.js",
  "./assets/esm-Cqdv57Se.js",
  "./assets/esm-Ds3A66Il.js",
  "./assets/esm-Dz00i68b.js",
  "./assets/files-ClDW02D0.js",
  "./assets/jsQR-B1eQcpQl.js",
  "./assets/jszip.min-CMUAYIqb.js",
  "./assets/logo-D2ecn3Y0.js",
  "./assets/observationsSheet-C1t14Wgh.js",
  "./assets/observationsWord-YAmhZJ9o.js",
  "./assets/pdf-BZCtmfih.js",
  "./assets/pdf-DybXlvuc.js",
  "./assets/pdf.worker.min-ebeaCm-m.js",
  "./assets/periodReport-mpDYwVIU.js",
  "./assets/rolldown-runtime-Dd_uD5pT.js",
  "./assets/studentReport-uUQI22Q9.js",
  "./assets/time-PUD3MHdy.js",
  "./assets/vault-E1gyQYw7.js",
  "./assets/web-BNDWkbQD.js",
  "./assets/web-BuCMOczf.js",
  "./assets/web-CfyV_6jh.js",
  "./assets/web-CiOSAZ_U.js",
  "./assets/web-DJQNwZfV.js",
  "./assets/web-DcqxUt4a.js",
  "./assets/amiri-arabic-400-normal-D0NIBXga.woff2",
  "./assets/amiri-arabic-700-normal-D8FrblyB.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-400-normal-CyU-ddYS.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-500-normal-C4MQITzh.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-600-normal-0pRdybE_.woff2",
  "./assets/ibm-plex-sans-arabic-arabic-700-normal-DrtBj6UE.woff2",
  "./assets/index-Bjfc3WPZ.css",
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
