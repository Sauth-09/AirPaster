// ---------------------------------------------------------------------------
// Firebase Service — Mobile Web (Sender + Receiver + Host Mode)
// ---------------------------------------------------------------------------
// Handles: sending data/files to PC, listening for data from PC, cleanup.
// Host mode: enables the PWA to create rooms and act as a host for
// phone-to-phone transfer (writes to toMobile, listens on toPC).
// ---------------------------------------------------------------------------

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, off } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";
import { DB_ROOMS_PATH } from "../utils/constants.js";

export const createFirebaseService = async (config) => {
  const app = initializeApp(config);
  const db = getDatabase(app);
  const auth = getAuth(app);

  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("[FirebaseService] Authentication failed:", error);
    throw error;
  }

  let activeUnsubscribe = null;

  // -------------------------------------------------------------------------
  // Client Mode (existing) — PWA as QR scanner / joiner
  // -------------------------------------------------------------------------

  /**
   * Send a payload to the PC/host (toPC path).
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
   * Listen to a room for incoming data from PC/host (toMobile path).
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

  // -------------------------------------------------------------------------
  // Host Mode (new) — PWA as room creator for phone-to-phone transfer
  // -------------------------------------------------------------------------

  /**
   * Send a payload to the client/joiner (toMobile path).
   * Used when the PWA is the host (room creator).
   * @param {string} roomId
   * @param {Object} payload
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
      console.error(`[FirebaseService] Send to mobile error for room ${roomId}:`, error);
      throw error;
    }
  };

  /**
   * Listen to a room for incoming data from the client/joiner (toPC path).
   * Used when the PWA is the host (room creator).
   * @param {string} roomId
   * @param {(data: Object|null, error?: Error) => void} callback
   */
  const listenToPC = (roomId, callback) => {
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
        console.error(`[FirebaseService] Listen toPC error for room ${roomId}:`, error);
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
   * Clear toPC data after processing (host mode).
   * @param {string} roomId
   */
  const clearToPC = async (roomId) => {
    try {
      const toPCRef = ref(db, `${DB_ROOMS_PATH}/${roomId}/toPC`);
      await remove(toPCRef);
    } catch (error) {
      console.error(`[FirebaseService] Clear toPC error:`, error);
      throw error;
    }
  };

  // -------------------------------------------------------------------------

  const dispose = () => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
    }
  };

  return Object.freeze({
    // Client mode
    sendToRoom,
    listenToRoom,
    clearToMobile,
    // Host mode
    sendToMobile,
    listenToPC,
    clearToPC,
    // Common
    dispose,
  });
};
