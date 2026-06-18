// ---------------------------------------------------------------------------
// Update Service — Handles Cache Purging & Force Reload
// ---------------------------------------------------------------------------

/**
 * Creates an Update service instance.
 * @returns {Object} Frozen service interface
 */
export const createUpdateService = () => {
  /**
   * Clears all service worker registrations and cache storages,
   * then reloads the page to fetch the latest assets from the server.
   * @returns {Promise<void>}
   */
  const forceUpdate = async () => {
    try {
      // 1. Unregister all service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Clear all cache storages
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    } catch (error) {
      console.error("[UpdateService] Failed to clear application caches:", error);
    } finally {
      // 3. Force reload the page
      window.location.reload(true);
    }
  };

  return Object.freeze({ forceUpdate });
};
