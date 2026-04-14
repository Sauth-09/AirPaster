// ---------------------------------------------------------------------------
// Mobile Web Entry Point — App Controller
// ---------------------------------------------------------------------------
// Orchestrates URL parsing, Firebase sending/receiving, history, and UI state.
// No business logic in the UI layer.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, MAX_TEXT_LENGTH, STATUS_DISPLAY_DURATION, URL_REGEX } from "./utils/constants.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createUrlService } from "./services/url-service.js";
import { createHistoryService } from "./services/history-service.js";

// ---------------------------------------------------------------------------
// DOM Helpers (inline for mobile — keeps bundle small)
// ---------------------------------------------------------------------------

const $ = (selector) => document.querySelector(selector);

const setText = (el, text) => {
  if (el) el.textContent = text;
};

const show = (el) => {
  if (el) el.classList.remove("hidden");
};

const hide = (el) => {
  if (el) el.classList.add("hidden");
};

const addClass = (el, ...cls) => {
  if (el) el.classList.add(...cls);
};

const removeClass = (el, ...cls) => {
  if (el) el.classList.remove(...cls);
};

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

const isUrl = (text) => URL_REGEX.test(text.trim());

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

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
// DOM Element References
// ---------------------------------------------------------------------------

const getElements = () => ({
  connectionBar: $("#connection-bar"),
  connectionText: $("#connection-text"),
  connectionRoomId: $("#connection-room-id"),
  noRoomSection: $("#no-room-section"),
  inputSection: $("#input-section"),
  textInput: $("#text-input"),
  charCount: $("#char-count"),
  sendBtn: $("#send-btn"),
  sendBtnText: $("#send-btn-text"),
  sendBtnLoader: $("#send-btn-loader"),
  sendBtnContent: $(".send-btn-content"),
  toast: $("#toast"),
  toastIcon: $("#toast-icon"),
  toastText: $("#toast-text"),
  // Received from PC
  receivedFromPC: $("#received-from-pc"),
  receivedFromPCText: $("#received-from-pc-text"),
  openLinkMobileBtn: $("#open-link-mobile-btn"),
  copyReceivedBtn: $("#copy-received-btn"),
  // History
  historyToggle: $("#history-toggle-mobile"),
  historyCount: $("#history-count-mobile"),
  historyPanel: $("#history-panel-mobile"),
  historyList: $("#history-list-mobile"),
  historyClear: $("#history-clear-mobile"),
  historyEmpty: $("#history-empty-mobile"),
});

// ---------------------------------------------------------------------------
// Toast Notifications
// ---------------------------------------------------------------------------

let toastTimer = null;

const showToast = (elements, message, type = "success") => {
  const { toast, toastIcon, toastText } = elements;

  if (toastTimer) clearTimeout(toastTimer);

  removeClass(toast, "toast-success", "toast-error", "hidden");
  addClass(toast, `toast-${type}`);
  setText(toastIcon, type === "success" ? "✓" : "✕");
  setText(toastText, message);

  requestAnimationFrame(() => {
    addClass(toast, "visible");
  });

  toastTimer = setTimeout(() => {
    removeClass(toast, "visible");
    setTimeout(() => {
      addClass(toast, "hidden");
    }, 300);
  }, STATUS_DISPLAY_DURATION);
};

// ---------------------------------------------------------------------------
// Send Button State Management
// ---------------------------------------------------------------------------

const setSendLoading = (elements, loading) => {
  const { sendBtn, sendBtnContent, sendBtnLoader } = elements;

  sendBtn.disabled = loading;

  if (loading) {
    hide(sendBtnContent);
    show(sendBtnLoader);
    removeClass(sendBtnLoader, "hidden");
  } else {
    show(sendBtnContent);
    hide(sendBtnLoader);
  }
};

// ---------------------------------------------------------------------------
// Character Count
// ---------------------------------------------------------------------------

const updateCharCount = (elements) => {
  const count = elements.textInput.value.length;
  const formatted = count.toLocaleString();
  const max = MAX_TEXT_LENGTH.toLocaleString();
  setText(elements.charCount, `${formatted} / ${max}`);
  elements.sendBtn.disabled = count === 0;
};

// ---------------------------------------------------------------------------
// History Rendering (Mobile)
// ---------------------------------------------------------------------------

const renderHistory = (elements, historyService) => {
  const items = historyService.getItems();
  const { historyList, historyClear, historyEmpty, historyCount } = elements;

  setText(historyCount, String(items.length));

  if (items.length === 0) {
    historyList.innerHTML = "";
    hide(historyClear);
    show(historyEmpty);
    return;
  }

  hide(historyEmpty);
  show(historyClear);

  historyList.innerHTML = items.map((item, index) => {
    const icon = item.direction === "sent" ? "📤" : "📥";
    const time = formatTime(item.timestamp);
    return `
      <div class="history-item-mobile" data-index="${index}">
        <span class="history-item-mobile-icon">${icon}</span>
        <span class="history-item-mobile-text">${escapeHtml(item.text)}</span>
        <span class="history-item-mobile-time">${time}</span>
      </div>
    `;
  }).join("");

  // Click to copy (event delegation)
  historyList.onclick = async (e) => {
    const itemEl = e.target.closest(".history-item-mobile");
    if (!itemEl) return;

    const index = parseInt(itemEl.dataset.index, 10);
    const item = items[index];
    if (item) {
      try {
        await navigator.clipboard.writeText(item.fullText);
        showToast(elements, "Copied!", "success");
      } catch (err) {
        // Fallback: put in textarea
        elements.textInput.value = item.fullText;
        updateCharCount(elements);
        showToast(elements, "Pasted into text box", "success");
      }
    }
  };
};

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

const initApp = () => {
  const elements = getElements();

  // --- Create services (Dependency Injection) ---
  const urlService = createUrlService();
  const roomId = urlService.getRoomIdFromUrl();

  // --- No room ID: show warning ---
  if (!roomId) {
    addClass(elements.connectionBar, "disconnected");
    setText(elements.connectionText, "No room connected");
    setText(elements.connectionRoomId, "");
    show(elements.noRoomSection);
    hide(elements.inputSection);
    return;
  }

  // --- Room found: setup sender + receiver ---
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const historyService = createHistoryService();

  // Track last received text for copy/open
  let lastReceivedFromPC = "";

  // Update connection bar
  setText(elements.connectionText, "Connected to room");
  setText(elements.connectionRoomId, roomId);

  // Show input section
  hide(elements.noRoomSection);
  show(elements.inputSection);

  // --- Character count updates ---
  elements.textInput.addEventListener("input", () => {
    updateCharCount(elements);
  });

  // --- Send to PC handler ---
  const handleSend = async () => {
    const text = elements.textInput.value.trim();

    if (!text) {
      showToast(elements, "Please enter some text first", "error");
      return;
    }

    if (text.length > MAX_TEXT_LENGTH) {
      showToast(elements, `Text exceeds ${MAX_TEXT_LENGTH.toLocaleString()} character limit`, "error");
      return;
    }

    setSendLoading(elements, true);

    try {
      await firebaseService.sendToRoom(roomId, text);

      // Add to history
      historyService.addItem(text, "sent");
      renderHistory(elements, historyService);

      showToast(elements, "Sent to your computer!", "success");
      elements.textInput.value = "";
      updateCharCount(elements);
    } catch (error) {
      console.error("[App] Send failed:", error);
      showToast(elements, "Failed to send. Check your connection.", "error");
    } finally {
      setSendLoading(elements, false);
    }
  };

  // Send button click
  elements.sendBtn.addEventListener("click", handleSend);

  // Ctrl+Enter / Cmd+Enter to send
  elements.textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  });

  // --- Listen for data from PC (toMobile) ---
  firebaseService.listenToRoom(roomId, async (text, error) => {
    if (error) {
      console.error("[App] Listen error:", error);
      return;
    }

    if (text) {
      lastReceivedFromPC = text;

      // Show received section
      setText(elements.receivedFromPCText, text);
      show(elements.receivedFromPC);

      // Show/hide open link button
      if (isUrl(text)) {
        show(elements.openLinkMobileBtn);
      } else {
        hide(elements.openLinkMobileBtn);
      }

      // Add to history
      historyService.addItem(text, "received");
      renderHistory(elements, historyService);

      // Show toast
      showToast(elements, "Received from computer!", "success");

      // Clear from Firebase
      try {
        await firebaseService.clearToMobile(roomId);
      } catch (clearError) {
        console.warn("[App] Failed to clear toMobile:", clearError);
      }
    }
  });

  // --- Copy received text ---
  elements.copyReceivedBtn.addEventListener("click", async () => {
    if (!lastReceivedFromPC) return;
    try {
      await navigator.clipboard.writeText(lastReceivedFromPC);
      showToast(elements, "Copied!", "success");
    } catch (err) {
      // Fallback: put in textarea
      elements.textInput.value = lastReceivedFromPC;
      updateCharCount(elements);
      showToast(elements, "Pasted into text box", "success");
    }
  });

  // --- Open link from PC ---
  elements.openLinkMobileBtn.addEventListener("click", () => {
    if (lastReceivedFromPC && isUrl(lastReceivedFromPC)) {
      window.open(lastReceivedFromPC, "_blank");
    }
  });

  // --- History toggle ---
  let historyOpen = false;
  elements.historyToggle.addEventListener("click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) {
      show(elements.historyPanel);
    } else {
      hide(elements.historyPanel);
    }
  });

  // --- History clear ---
  elements.historyClear.addEventListener("click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService);
  });

  // --- Initial renders ---
  renderHistory(elements, historyService);
  updateCharCount(elements);
  elements.textInput.focus();
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", initApp);
