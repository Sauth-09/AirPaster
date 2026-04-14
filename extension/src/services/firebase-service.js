// ---------------------------------------------------------------------------
// Firebase Service — Extension (Receiver)
// ---------------------------------------------------------------------------
// Factory function that creates a Firebase service with dependency injection.
// Handles: initialization, real-time listening, room cleanup.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, remove, off } from "firebase/database";
import { DB_ROOMS_PATH } from "../utils/constants.js";

/**
 * @typedef {Object} FirebaseService
 * @property {(roomId: string, callback: Function) => Function} listenToRoom
 * @property {(roomId: string) => Promise<void>} clearRoom
 * @property {() => void} dispose
 */

/**
 * Creates a Firebase service instance.
 * @param {Object} config - Firebase configuration object
 * @returns {FirebaseService}
 */
export const createFirebaseService = (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);

  // Track active listeners for cleanup
  let activeUnsubscribe = null;

  /**
   * Listen to a room for incoming data.
   * Calls the callback with the text value whenever the room data changes.
   * @param {string} roomId
   * @param {(text: string|null) => void} callback
   * @returns {Function} Unsubscribe function
   */
  const listenToRoom = (roomId, callback) => {
    // Clean up previous listener if any
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }

    const roomRef = ref(db, `${DB_ROOMS_PATH}/${roomId}`);

    const unsubscribe = onValue(
      roomRef,
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
      off(roomRef);
      activeUnsubscribe = null;
    };

    return activeUnsubscribe;
  };

  /**
   * Clear/delete a room after data has been received and processed.
   * @param {string} roomId
   * @returns {Promise<void>}
   */
  const clearRoom = async (roomId) => {
    try {
      const roomRef = ref(db, `${DB_ROOMS_PATH}/${roomId}`);
      await remove(roomRef);
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

  return Object.freeze({ listenToRoom, clearRoom, dispose });
};
