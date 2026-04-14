// ---------------------------------------------------------------------------
// Firebase Service — Extension (Receiver + Sender)
// ---------------------------------------------------------------------------
// Handles: initialization, real-time listening on toPC, sending to toMobile,
// and room cleanup.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, remove, off } from "firebase/database";
import { DB_ROOMS_PATH } from "../utils/constants.js";

/**
 * Creates a Firebase service instance for the extension.
 * @param {Object} config - Firebase configuration object
 * @returns {Object} Frozen service interface
 */
export const createFirebaseService = (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);

  // Track active listeners for cleanup
  let activeUnsubscribe = null;

  /**
   * Listen to a room for incoming data from mobile (toPC path).
   * @param {string} roomId
   * @param {(text: string|null, error?: Error) => void} callback
   * @returns {Function} Unsubscribe function
   */
  const listenToRoom = (roomId, callback) => {
    // Clean up previous listener if any
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }

    const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);

    const unsubscribe = onValue(
      toPCRef,
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
      off(toPCRef);
      activeUnsubscribe = null;
    };

    return activeUnsubscribe;
  };

  /**
   * Send text from the extension to the mobile device (toMobile path).
   * @param {string} roomId
   * @param {string} text
   * @returns {Promise<void>}
   */
  const sendToMobile = async (roomId, text) => {
    if (!roomId || !text || text.trim().length === 0) {
      throw new Error("[FirebaseService] Room ID and text are required");
    }

    try {
      const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);
      await set(toMobileRef, {
        text: text.trim(),
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[FirebaseService] Send to mobile error for room ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Clear the toPC data after it has been received and processed.
   * @param {string} roomId
   * @returns {Promise<void>}
   */
  const clearRoom = async (roomId) => {
    try {
      const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);
      await remove(toPCRef);
    } catch (error) {
      console.error(`[FirebaseService] Clear room error for ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Dispose all active listeners and clean up resources.
   */
  const dispose = () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
  };

  return Object.freeze({ listenToRoom, sendToMobile, clearRoom, dispose });
};
