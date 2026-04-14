// ---------------------------------------------------------------------------
// Popup Entry Point — Extension UI Controller
// ---------------------------------------------------------------------------
// Orchestrates all services via dependency injection.
// No business logic here — only UI coordination.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, STATUS_DISPLAY_DURATION } from "./utils/constants.js";
import { $, setText, show, hide, on, setStatusClass } from "./utils/dom-helpers.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createRoomService } from "./services/room-service.js";
import { createQRService } from "./services/qr-service.js";
import { createClipboardService } from "./services/clipboard-service.js";

// ---------------------------------------------------------------------------
// DOM Element References
// ---------------------------------------------------------------------------

const getElements = () => ({
  qrContainer: $("#qr-container"),
  roomId: $("#room-id"),
  statusSection: $("#status-section"),
  statusText: $("#status-text"),
  receivedSection: $("#received-section"),
  receivedText: $("#received-text"),
  copyAgainBtn: $("#copy-again-btn"),
  newRoomBtn: $("#new-room-btn"),
});

// ---------------------------------------------------------------------------
// UI State Management
// ---------------------------------------------------------------------------

/**
 * Update the status section UI.
 * @param {Object} elements - DOM elements
 * @param {string} status - One of STATUS enum values
 * @param {string} message - Status message text
 */
const updateStatus = (elements, status, message) => {
  const { statusSection, statusText } = elements;

  const statusClassMap = {
    [STATUS.WAITING]: "status-waiting",
    [STATUS.COPIED]: "status-copied",
    [STATUS.ERROR]: "status-error",
  };

  const cssClass = statusClassMap[status] || "status-waiting";
  setStatusClass(statusSection, "status-section", cssClass);
  setText(statusText, message);
};

/**
 * Show the received text section with the given content.
 * @param {Object} elements - DOM elements
 * @param {string} text - Received text
 */
const showReceivedText = (elements, text) => {
  setText(elements.receivedText, text);
  show(elements.receivedSection);
};

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the application — create services, generate room, wire up UI.
 */
const initApp = async () => {
  const elements = getElements();

  // --- Create services (Dependency Injection) ---
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const roomService = createRoomService();
  const qrService = createQRService();
  const clipboardService = createClipboardService();

  // Track the last received text for "copy again" functionality
  let lastReceivedText = "";

  // --- Setup Room ---
  const setupRoom = async (roomId) => {
    // Update UI with room ID
    setText(elements.roomId, roomId);

    // Generate QR code
    const mobileUrl = roomService.buildMobileUrl(roomId);
    try {
      await qrService.generateQRCode(elements.qrContainer, mobileUrl);
    } catch (error) {
      updateStatus(elements, STATUS.ERROR, "QR code generation failed");
      return;
    }

    // Reset status
    updateStatus(elements, STATUS.WAITING, "Waiting for connection...");
    hide(elements.receivedSection);

    // Listen for incoming data
    firebaseService.listenToRoom(roomId, async (text, error) => {
      if (error) {
        updateStatus(elements, STATUS.ERROR, "Connection error. Try a new room.");
        return;
      }

      if (text) {
        // Copy to clipboard
        const success = await clipboardService.copyToClipboard(text);

        if (success) {
          lastReceivedText = text;
          updateStatus(elements, STATUS.COPIED, "Copied to clipboard!");
          showReceivedText(elements, text);

          // Clear the room in Firebase
          try {
            await firebaseService.clearRoom(roomId);
          } catch (clearError) {
            console.warn("[Popup] Failed to clear room:", clearError);
          }

          // Reset status after delay
          setTimeout(() => {
            updateStatus(elements, STATUS.WAITING, "Waiting for more...");
          }, STATUS_DISPLAY_DURATION);
        } else {
          updateStatus(elements, STATUS.ERROR, "Failed to copy to clipboard");
        }
      }
    });
  };

  // --- Start with a new room ---
  const startNewRoom = async () => {
    // Clean up previous listener
    firebaseService.dispose();

    const roomId = roomService.generateRoomId();
    await setupRoom(roomId);
  };

  // --- Event Listeners ---
  on(elements.newRoomBtn, "click", startNewRoom);

  on(elements.copyAgainBtn, "click", async () => {
    if (lastReceivedText) {
      const success = await clipboardService.copyToClipboard(lastReceivedText);
      if (success) {
        updateStatus(elements, STATUS.COPIED, "Copied again!");
        setTimeout(() => {
          updateStatus(elements, STATUS.WAITING, "Waiting for more...");
        }, STATUS_DISPLAY_DURATION);
      }
    }
  });

  // --- Initial setup ---
  await startNewRoom();

  // Cleanup on popup close
  window.addEventListener("unload", () => {
    firebaseService.dispose();
  });
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", initApp);
