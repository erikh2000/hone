const CACHE_NAME = 'static-cache-v1';

const PUBLIC_FILES_TO_CACHE = [
  '/index.html'
];

async function _fetchViteManifestJsonCacheEntries() {
  try {
    const manifestResponse = await fetch('/.vite/manifest.json');
    const manifest = await manifestResponse.json();
    return Object.values(manifest).map((entry) => `/${entry.file}`);
  } catch (error) {
    console.warn(`Failed to fetch .vite/manifest.json: ${error.message}`); // In dev environment, this is benign. To make it go away, run "npm run build".
    return [];
  }
}

async function _fetchManifestJsonCacheEntries() {
  try {
    const manifestResponse = await fetch('/manifest.json');
    const manifest = await manifestResponse.json();
    return Object.values(manifest.icons).map((entry) => entry.src);
  } catch (error) {
    console.warn(`Failed to fetch manifest.json: ${error.message}`);
    return [];
  }
}

async function _getAssetsToCache() {
  const assetsToCache = await _fetchViteManifestJsonCacheEntries();
  assetsToCache.push(...await _fetchManifestJsonCacheEntries());
  assetsToCache.push(...PUBLIC_FILES_TO_CACHE);
  return assetsToCache;
}

async function _onInstall() {
  const assetsToCache = await _getAssetsToCache();
  console.log('Caching the following assets:', assetsToCache);
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(assetsToCache);
}

function _onFetch(event) {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
}

function _onActivate(event) {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
}

self.addEventListener('install', _onInstall);
self.addEventListener('fetch', _onFetch);
self.addEventListener('activate', _onActivate);