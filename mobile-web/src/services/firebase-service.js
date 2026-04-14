// ---------------------------------------------------------------------------
// Firebase Service — Mobile Web (Sender + Receiver)
// ---------------------------------------------------------------------------
// Handles: sending data/files to PC, listening for data from PC, cleanup.
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, off } from "firebase/database";
import { DB_ROOMS_PATH } from "../utils/constants.js";

export const createFirebaseService = (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);

  let activeUnsubscribe = null;

  /**
   * Send a payload to the PC (toPC path).
   * @param {string} roomId
   * @param {Object} payload - Data object (text, file, encrypted)
   */
  const sendToRoom = async (roomId, payload) => {
    if (!roomId) throw new Error("[FirebaseService] Room ID required");

    try {
      const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);
      await set(toPCRef, {
        ...payload,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`[FirebaseService] Send error for room ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Listen to a room for incoming data from PC (toMobile path).
   * @param {string} roomId
   * @param {(data: Object|null, error?: Error) => void} callback
   */
  const listenToRoom = (roomId, callback) => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }

    const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);

    onValue(
      toMobileRef,
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
      off(toMobileRef);
      activeUnsubscribe = null;
    };

    return activeUnsubscribe;
  };

  const clearToMobile = async (roomId) => {
    try {
      const toMobileRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toMobile`);
      await remove(toMobileRef);
    } catch (error) {
      console.error(`[FirebaseService] Clear toMobile error:`, error);
      throw error;
    }
  };

  const dispose = () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
  };

  return Object.freeze({ sendToRoom, listenToRoom, clearToMobile, dispose });
};
