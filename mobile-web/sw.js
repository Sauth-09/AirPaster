// ---------------------------------------------------------------------------
// Service Worker — AirPaste PWA
// ---------------------------------------------------------------------------
// Handles: offline caching, Web Share Target file interception.
// ---------------------------------------------------------------------------

const CACHE_NAME = "airpaste-v1";
const ASSETS_TO_CACHE = [
  "./index.html",
  "./styles.css",
  "./dist/app.bundle.js",
  "./icons/icon48.png",
  "./icons/icon128.png",
  "./share-target.html",
];

// ---------------------------------------------------------------------------
// Install — cache critical assets
// ---------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// Activate — clean old caches
// ---------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Fetch — Share Target POST interception + cache-first for assets
// ---------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // --- Share Target POST Handler ---
  // When the user shares via the phone share menu, the browser sends a POST
  // request to share-target.html. We intercept it, extract the shared data
  // (files/text), store it in a special cache, and redirect to share-target.html
  // which will read from the cache.
  if (
    event.request.method === "POST" &&
    url.pathname.endsWith("/share-target.html")
  ) {
    event.respondWith(handleShareTarget(event.request));
    return;
  }

  // --- Cache-first strategy for GET requests ---
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// ---------------------------------------------------------------------------
// IndexedDB Helper
// ---------------------------------------------------------------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AirPasteShareDB", 1);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore("share");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ---------------------------------------------------------------------------
// Share Target Handler
// ---------------------------------------------------------------------------
async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const sharedData = {};

    // Extract text fields
    const title = formData.get("title");
    const text = formData.get("text");
    const shareUrl = formData.get("url");

    if (title) sharedData.title = title;
    if (text) sharedData.text = text;
    if (shareUrl) sharedData.url = shareUrl;

    // Extract files
    const files = formData.getAll("file");
    if (files && files.length > 0) {
      const validFiles = files.filter(
        (f) => f instanceof File && f.size > 0
      );

      if (validFiles.length > 0) {
        sharedData.file = validFiles[0]; // Store the native File object
      }
    }

    // Store shared data in IndexedDB
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("share", "readwrite");
      tx.objectStore("share").put(sharedData, "shared-data");
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    // Redirect to share-target.html (GET) so the page can process the data
    return Response.redirect("./share-target.html", 303);
  } catch (error) {
    console.error("[SW] Share target error:", error);
    return Response.redirect("./share-target.html?error=1", 303);
  }
}
