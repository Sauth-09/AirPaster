// ---------------------------------------------------------------------------
// Popup Entry Point — Extension UI Controller
// ---------------------------------------------------------------------------
// Orchestrates all services via dependency injection.
// No business logic here — only UI coordination.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, STATUS_DISPLAY_DURATION, URL_REGEX } from "./utils/constants.js";
import { $, setText, show, hide, on, setStatusClass, addClass, removeClass } from "./utils/dom-helpers.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createRoomService } from "./services/room-service.js";
import { createQRService } from "./services/qr-service.js";
import { createClipboardService } from "./services/clipboard-service.js";
import { createHistoryService } from "./services/history-service.js";

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
  openLinkBtn: $("#open-link-btn"),
  newRoomBtn: $("#new-room-btn"),
  // Send to mobile
  sendToMobileInput: $("#send-to-mobile-input"),
  sendToMobileBtn: $("#send-to-mobile-btn"),
  // History
  historyToggleBtn: $("#history-toggle-btn"),
  historyCount: $("#history-count"),
  historyChevron: $("#history-chevron"),
  historyPanel: $("#history-panel"),
  historyList: $("#history-list"),
  historyClearBtn: $("#history-clear-btn"),
  historyEmpty: $("#history-empty"),
});

// ---------------------------------------------------------------------------
// Utility: Check if text is a URL
// ---------------------------------------------------------------------------

const isUrl = (text) => URL_REGEX.test(text.trim());

// ---------------------------------------------------------------------------
// Utility: Format timestamp for history
// ---------------------------------------------------------------------------

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
};

// ---------------------------------------------------------------------------
// UI State Management
// ---------------------------------------------------------------------------

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

const showReceivedText = (elements, text) => {
  setText(elements.receivedText, text);
  show(elements.receivedSection);

  // Show/hide "Open Link" button based on URL detection
  if (isUrl(text)) {
    show(elements.openLinkBtn);
  } else {
    hide(elements.openLinkBtn);
  }
};

// ---------------------------------------------------------------------------
// History Rendering
// ---------------------------------------------------------------------------

const renderHistory = (elements, historyService, clipboardService) => {
  const items = historyService.getItems();
  const { historyList, historyClearBtn, historyEmpty, historyCount } = elements;

  setText(historyCount, String(items.length));

  if (items.length === 0) {
    historyList.innerHTML = "";
    hide(historyClearBtn);
    show(historyEmpty);
    return;
  }

  hide(historyEmpty);
  show(historyClearBtn);

  historyList.innerHTML = items.map((item, index) => {
    const icon = item.direction === "sent" ? "📤" : "📥";
    const time = formatTime(item.timestamp);
    return `
      <div class="history-item" data-index="${index}" title="Click to copy">
        <span class="history-item-icon">${icon}</span>
        <span class="history-item-text">${escapeHtml(item.text)}</span>
        <span class="history-item-time">${time}</span>
      </div>
    `;
  }).join("");

  // Click to copy handler (event delegation)
  historyList.onclick = async (e) => {
    const itemEl = e.target.closest(".history-item");
    if (!itemEl) return;

    const index = parseInt(itemEl.dataset.index, 10);
    const item = items[index];
    if (item) {
      await clipboardService.copyToClipboard(item.fullText);
      itemEl.style.background = "rgba(52, 211, 153, 0.15)";
      setTimeout(() => {
        itemEl.style.background = "";
      }, 500);
    }
  };
};

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

const initApp = async () => {
  const elements = getElements();

  // --- Create services (Dependency Injection) ---
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const roomService = createRoomService();
  const qrService = createQRService();
  const clipboardService = createClipboardService();
  const historyService = createHistoryService();

  // Track the last received text for "copy again" functionality
  let lastReceivedText = "";
  let currentRoomId = null;

  // --- Setup Room ---
  const setupRoom = async (roomId) => {
    currentRoomId = roomId;
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

    // Listen for incoming data from mobile (toPC)
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

          // Add to history
          historyService.addItem(text, "received");
          renderHistory(elements, historyService, clipboardService);

          // Update status
          const statusMsg = isUrl(text)
            ? "Link copied to clipboard!"
            : "Copied to clipboard!";
          updateStatus(elements, STATUS.COPIED, statusMsg);
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
    firebaseService.dispose();
    const roomId = roomService.generateRoomId();
    await setupRoom(roomId);
  };

  // --- Send to Mobile handler ---
  const handleSendToMobile = async () => {
    const text = elements.sendToMobileInput.value.trim();
    if (!text || !currentRoomId) return;

    elements.sendToMobileBtn.disabled = true;

    try {
      await firebaseService.sendToMobile(currentRoomId, text);
      historyService.addItem(text, "sent");
      renderHistory(elements, historyService, clipboardService);
      elements.sendToMobileInput.value = "";
      elements.sendToMobileBtn.disabled = true;
    } catch (error) {
      console.error("[Popup] Send to mobile failed:", error);
      updateStatus(elements, STATUS.ERROR, "Failed to send to phone");
      setTimeout(() => {
        updateStatus(elements, STATUS.WAITING, "Waiting for more...");
      }, STATUS_DISPLAY_DURATION);
    }
  };

  // --- Event Listeners ---

  // New room
  on(elements.newRoomBtn, "click", startNewRoom);

  // Copy again
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

  // Open link in new tab
  on(elements.openLinkBtn, "click", () => {
    if (lastReceivedText && isUrl(lastReceivedText)) {
      window.open(lastReceivedText, "_blank");
    }
  });

  // Send to mobile - input enable/disable
  on(elements.sendToMobileInput, "input", () => {
    elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
  });

  // Send to mobile - click
  on(elements.sendToMobileBtn, "click", handleSendToMobile);

  // Send to mobile - Enter key
  on(elements.sendToMobileInput, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendToMobile();
    }
  });

  // History toggle
  let historyOpen = false;
  on(elements.historyToggleBtn, "click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) {
      show(elements.historyPanel);
      addClass(elements.historyChevron, "open");
    } else {
      hide(elements.historyPanel);
      removeClass(elements.historyChevron, "open");
    }
  });

  // History clear
  on(elements.historyClearBtn, "click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService, clipboardService);
  });

  // Initial history render
  renderHistory(elements, historyService, clipboardService);

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
