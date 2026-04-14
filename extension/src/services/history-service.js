// ---------------------------------------------------------------------------
// History Service — LocalStorage-based transfer history
// ---------------------------------------------------------------------------
// Stores last N transfers for quick access. Pure functions, no side effects
// beyond localStorage.
// ---------------------------------------------------------------------------

import { MAX_HISTORY_ITEMS, HISTORY_STORAGE_KEY } from "../utils/constants.js";

/**
 * Creates a History service instance.
 * @param {string} [storageKey] - Override the default storage key
 * @returns {Object} Frozen service interface
 */
export const createHistoryService = (storageKey = HISTORY_STORAGE_KEY) => {
  /**
   * Get all history items from localStorage.
   * @returns {Array<{text: string, direction: string, timestamp: number}>}
   */
  const getItems = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("[HistoryService] Failed to read history:", error);
      return [];
    }
  };

  /**
   * Add a new item to history (most recent first).
   * @param {string} text - The transferred text
   * @param {"sent"|"received"} direction - Transfer direction
   */
  const addItem = (text, direction) => {
    try {
      const items = getItems();

      const newItem = {
        text: text.length > 200 ? text.substring(0, 200) + "..." : text,
        fullText: text,
        direction,
        timestamp: Date.now(),
      };

      // Add to beginning, keep max items
      items.unshift(newItem);
      if (items.length > MAX_HISTORY_ITEMS) {
        items.length = MAX_HISTORY_ITEMS;
      }

      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (error) {
      console.error("[HistoryService] Failed to save history item:", error);
    }
  };

  /**
   * Clear all history items.
   */
  const clearHistory = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[HistoryService] Failed to clear history:", error);
    }
  };

  return Object.freeze({ getItems, addItem, clearHistory });
};
