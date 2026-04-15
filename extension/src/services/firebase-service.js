// ---------------------------------------------------------------------------
// Firebase Service — Extension (Receiver + Sender)
// ---------------------------------------------------------------------------
// Handles: real-time listening on toPC, sending to toMobile,
// file transfers, and room cleanup.
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

  let activeUnsubscribe = null;

  /**
   * Listen to a room for incoming data from mobile (toPC path).
   * Callback receives the full data object (may contain text or file).
   * @param {string} roomId
   * @param {(data: Object|null, error?: Error) => void} callback
   */
  const listenToRoom = (roomId, callback) => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }

    const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);

    onValue(
      toPCRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          callback(data);
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
   * Send text from extension to mobile (toMobile path).
   * @param {string} roomId
   * @param {Object} payload - Data to send (text, encrypted, or file)
   */
  const sendToMobile = async (roomId, payload) => {
    if (!roomId) throw new Error("[FirebaseService] Room ID required");

    try {
      const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);
      await set(toMobileRef, {
        ...payload,
        timestamp: Date.now(),
        _nonce: Math.random().toString(36).slice(2),
      });
    } catch (error) {
      console.error(`[FirebaseService] Send to mobile error:`, error);
      throw error;
    }
  };

  /**
   * Clear toPC data after processing.
   * @param {string} roomId
   */
  const clearRoom = async (roomId) => {
    try {
      const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);
      await remove(toPCRef);
    } catch (error) {
      console.error(`[FirebaseService] Clear room error:`, error);
      throw error;
    }
  };

  const dispose = () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
  };

  return Object.freeze({ listenToRoom, sendToMobile, clearRoom, dispose });
};
