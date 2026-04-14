// ---------------------------------------------------------------------------
// Mobile Web Entry Point — App Controller
// ---------------------------------------------------------------------------
// Orchestrates URL parsing, Firebase sending, and UI state management.
// No business logic in the UI layer.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, MAX_TEXT_LENGTH, STATUS_DISPLAY_DURATION } from "./utils/constants.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createUrlService } from "./services/url-service.js";

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
});

// ---------------------------------------------------------------------------
// Toast Notifications
// ---------------------------------------------------------------------------

let toastTimer = null;

/**
 * Show a toast notification.
 * @param {Object} elements
 * @param {string} message
 * @param {"success"|"error"} type
 */
const showToast = (elements, message, type = "success") => {
  const { toast, toastIcon, toastText } = elements;

  // Clear previous timer
  if (toastTimer) clearTimeout(toastTimer);

  // Remove old type classes
  removeClass(toast, "toast-success", "toast-error", "hidden");

  // Set type
  addClass(toast, `toast-${type}`);
  setText(toastIcon, type === "success" ? "✓" : "✕");
  setText(toastText, message);

  // Show with animation
  requestAnimationFrame(() => {
    addClass(toast, "visible");
  });

  // Auto-hide
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

/**
 * Set the send button to loading state.
 * @param {Object} elements
 * @param {boolean} loading
 */
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

/**
 * Update the character count display.
 * @param {Object} elements
 */
const updateCharCount = (elements) => {
  const count = elements.textInput.value.length;
  const formatted = count.toLocaleString();
  const max = MAX_TEXT_LENGTH.toLocaleString();
  setText(elements.charCount, `${formatted} / ${max}`);

  // Update send button state
  elements.sendBtn.disabled = count === 0;
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

  // --- Room found: setup sender ---
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);

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

  // --- Send handler ---
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

      // Success!
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

  // Initial char count
  updateCharCount(elements);

  // Focus the textarea
  elements.textInput.focus();
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", initApp);
