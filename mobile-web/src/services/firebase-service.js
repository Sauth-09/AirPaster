// ---------------------------------------------------------------------------
// Firebase Service — Mobile Web (Sender + Receiver)
// ---------------------------------------------------------------------------
// Handles: sending data to PC, listening for data from PC, cleanup.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, off } from "firebase/database";
import { DB_ROOMS_PATH } from "../utils/constants.js";

/**
 * Creates a Firebase service instance for the mobile web.
 * @param {Object} config - Firebase configuration object
 * @returns {Object} Frozen service interface
 */
export const createFirebaseService = (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);

  // Track active listener for cleanup
  let activeUnsubscribe = null;

  /**
   * Send text data from mobile to the PC (toPC path).
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
      const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);
      await set(toPCRef, {
        text: text.trim(),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[FirebaseService] Send error for room ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Listen to a room for incoming data from the PC (toMobile path).
   * @param {string} roomId
   * @param {(text: string|null, error?: Error) => void} callback
   * @returns {Function} Unsubscribe function
   */
  const listenToRoom = (roomId, callback) => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }

    const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);

    const unsubscribe = onValue(
      toMobileRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && data.text) {
          callback(data.text);
        }
      },
      (error) => {
        console.error(`[FirebaseService] Listen error for room ${roomId}:`, error);
        callback(null, error);
      }
    );

    activeUnsubscribe = () => {
      off(toMobileRef);
      activeUnsubscribe = null;
    };

    return activeUnsubscribe;
  };

  /**
   * Clear the toMobile data after it has been received.
   * @param {string} roomId
   * @returns {Promise<void>}
   */
  const clearToMobile = async (roomId) => {
    try {
      const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);
      await remove(toMobileRef);
    } catch (error) {
      console.error(`[FirebaseService] Clear toMobile error for ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Dispose all active listeners.
   */
  const dispose = () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
  };

  return Object.freeze({ sendToRoom, listenToRoom, clearToMobile, dispose });
};
