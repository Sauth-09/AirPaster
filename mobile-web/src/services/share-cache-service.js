// ---------------------------------------------------------------------------
// Share Cache Service — Read/Clear Shared Data from IndexedDB
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

export const createShareCacheService = () => {
  const getSharedData = async () => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("share", "readonly");
        const request = tx.objectStore("share").get("shared-data");
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error("[ShareCacheService] Failed to read shared data:", error);
      return null;
    }
  };

  const clearSharedData = async () => {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("share", "readwrite");
        tx.objectStore("share").delete("shared-data");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("[ShareCacheService] Failed to clear shared data:", error);
    }
  };

  const hasPendingShare = async () => {
    const data = await getSharedData();
    return data !== null;
  };

  return Object.freeze({ getSharedData, clearSharedData, hasPendingShare });
};
