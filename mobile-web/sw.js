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
        const file = validFiles[0]; // Take the first file
        const arrayBuffer = await file.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        sharedData.file = {
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          data: base64,
        };
      }
    }

    // Store shared data in a special cache for the share-target page to read
    const cache = await caches.open("airpaste-share");
    const blob = new Blob([JSON.stringify(sharedData)], {
      type: "application/json",
    });
    const response = new Response(blob);
    await cache.put("shared-data", response);

    // Redirect to share-target.html (GET) so the page can process the data
    return Response.redirect("./share-target.html", 303);
  } catch (error) {
    console.error("[SW] Share target error:", error);
    return Response.redirect("./share-target.html?error=1", 303);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}
