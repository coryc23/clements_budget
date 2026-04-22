// =============================================================
// Service Worker for the Budget PWA
// =============================================================
// The ONLY reason this file exists is so browsers let the user
// "install" the site as a PWA. Without a registered service worker,
// the install prompt never appears.
//
// Deliberately minimal: no caching of app shell, no offline
// support, no background sync. Every request goes straight to the
// network. This means:
//   - The app is always fresh (no stale-after-deploy issues)
//   - No offline mode (you must have internet to use it)
//   - Zero risk of showing outdated code after a Vercel deploy
//
// If you ever want real offline support later, this is where you'd
// add caching logic. For a two-person budget app that's always
// online, the simpler approach is better.
// =============================================================

self.addEventListener('install', (event) => {
  // Skip waiting so new versions activate immediately on next load
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim clients right away so first-load gets the new SW
  event.waitUntil(self.clients.claim());
});

// Pass-through: every fetch goes directly to the network.
self.addEventListener('fetch', (event) => {
  // Intentionally no event.respondWith() — browser handles normally.
});
