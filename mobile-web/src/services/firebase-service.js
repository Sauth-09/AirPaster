// ---------------------------------------------------------------------------
// Firebase Service — Mobile Web (Sender)
// ---------------------------------------------------------------------------
// Factory function that creates a Firebase service for sending data.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, serverTimestamp } from "firebase/database";
import { DB_ROOMS_PATH } from "../utils/constants.js";

/**
 * @typedef {Object} MobileFirebaseService
 * @property {(roomId: string, text: string) => Promise<void>} sendToRoom
 */

/**
 * Creates a Firebase service instance for the mobile web sender.
 * @param {Object} config - Firebase configuration object
 * @returns {MobileFirebaseService}
 */
export const createFirebaseService = (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);

  /**
   * Send text data to a specific room.
   * @param {string} roomId
   * @param {string} text
   * @returns {Promise<void>}
   */
  const sendToRoom = async (roomId, text) => {
    if (!roomId) {
      throw new Error("[FirebaseService] Room ID is required");
    }
    if (!text || text.trim().length === 0) {
      throw new Error("[FirebaseService] Text content is required");
    }

    try {
      const roomRef = ref(db, `${DB_ROOMS_PATH}/${roomId}`);
      await set(roomRef, {
        text: text.trim(),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[FirebaseService] Send error for room ${roomId}:`, error);
      throw error;
    }
  };

  return Object.freeze({ sendToRoom });
};
