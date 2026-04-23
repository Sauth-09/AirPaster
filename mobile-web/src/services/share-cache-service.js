// ---------------------------------------------------------------------------
// Share Cache Service — Read/Clear Shared Data from Service Worker Cache
// ---------------------------------------------------------------------------
// The Service Worker stores shared data in a special cache when the phone's
// share menu sends data to AirPaste. This service reads and clears that data.
// ---------------------------------------------------------------------------

const SHARE_CACHE_NAME = "airpaste-share";
const SHARE_CACHE_KEY = "shared-data";

/**
 * Creates a Share Cache service instance.
 * @returns {Object} Frozen service interface
 */
export const createShareCacheService = () => {
  /**
   * Read shared data from the SW cache (if available).
   * @returns {Promise<{title?: string, text?: string, url?: string, file?: Object}|null>}
   */
  const getSharedData = async () => {
    try {
      const cache = await caches.open(SHARE_CACHE_NAME);
      const response = await cache.match(SHARE_CACHE_KEY);
      if (!response) return null;

      const data = await response.json();
      return data && Object.keys(data).length > 0 ? data : null;
    } catch (error) {
      console.error("[ShareCacheService] Failed to read shared data:", error);
      return null;
    }
  };

  /**
   * Clear the shared data cache after it has been consumed.
   * @returns {Promise<void>}
   */
  const clearSharedData = async () => {
    try {
      const cache = await caches.open(SHARE_CACHE_NAME);
      await cache.delete(SHARE_CACHE_KEY);
    } catch (error) {
      console.error("[ShareCacheService] Failed to clear shared data:", error);
    }
  };

  /**
   * Check if there is pending shared data.
   * @returns {Promise<boolean>}
   */
  const hasPendingShare = async () => {
    try {
      const cache = await caches.open(SHARE_CACHE_NAME);
      const response = await cache.match(SHARE_CACHE_KEY);
      return response !== undefined;
    } catch {
      return false;
    }
  };

  return Object.freeze({ getSharedData, clearSharedData, hasPendingShare });
};
