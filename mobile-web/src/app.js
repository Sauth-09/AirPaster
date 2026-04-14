// ---------------------------------------------------------------------------
// Mobile Web Entry Point — App Controller
// ---------------------------------------------------------------------------
// Orchestrates: text/file sending, receiving from PC, encryption,
// session reconnect, history.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, MAX_TEXT_LENGTH, STATUS_DISPLAY_DURATION, URL_REGEX } from "./utils/constants.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createUrlService } from "./services/url-service.js";
import { createHistoryService } from "./services/history-service.js";
import { createCryptoService } from "./services/crypto-service.js";
import { createFileService } from "./services/file-service.js";
import { createSessionService } from "./services/session-service.js";

// ---------------------------------------------------------------------------
// DOM Helpers
// ---------------------------------------------------------------------------

const $ = (s) => document.querySelector(s);
const setText = (el, t) => { if (el) el.textContent = t; };
const show = (el) => { if (el) el.classList.remove("hidden"); };
const hide = (el) => { if (el) el.classList.add("hidden"); };
const addClass = (el, ...c) => { if (el) el.classList.add(...c); };
const removeClass = (el, ...c) => { if (el) el.classList.remove(...c); };

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const isUrl = (t) => URL_REGEX.test(t.trim());

const escapeHtml = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
};

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const getElements = () => ({
  encryptionBadge: $("#encryption-badge"),
  connectionBar: $("#connection-bar"),
  connectionText: $("#connection-text"),
  connectionRoomId: $("#connection-room-id"),
  noRoomSection: $("#no-room-section"),
  reconnectBtn: $("#reconnect-btn"),
  reconnectInfo: $("#reconnect-info"),
  inputSection: $("#input-section"),
  textInput: $("#text-input"),
  charCount: $("#char-count"),
  sendBtn: $("#send-btn"),
  sendBtnContent: $(".send-btn-content"),
  sendBtnLoader: $("#send-btn-loader"),
  // File
  photoInput: $("#photo-input"),
  fileInput: $("#file-input"),
  fileSending: $("#file-sending"),
  fileSendingText: $("#file-sending-text"),
  // Toast
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
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

const showToast = (elements, message, type = "success") => {
  const { toast, toastIcon, toastText } = elements;
  if (toastTimer) clearTimeout(toastTimer);
  removeClass(toast, "toast-success", "toast-error", "hidden");
  addClass(toast, `toast-${type}`);
  setText(toastIcon, type === "success" ? "✓" : "✕");
  setText(toastText, message);
  requestAnimationFrame(() => addClass(toast, "visible"));
  toastTimer = setTimeout(() => {
    removeClass(toast, "visible");
    setTimeout(() => addClass(toast, "hidden"), 300);
  }, STATUS_DISPLAY_DURATION);
};

// ---------------------------------------------------------------------------
// Send Button State
// ---------------------------------------------------------------------------

const setSendLoading = (elements, loading) => {
  elements.sendBtn.disabled = loading;
  if (loading) {
    hide(elements.sendBtnContent);
    show(elements.sendBtnLoader);
  } else {
    show(elements.sendBtnContent);
    hide(elements.sendBtnLoader);
  }
};

const updateCharCount = (elements) => {
  const count = elements.textInput.value.length;
  setText(elements.charCount, `${count.toLocaleString()} / ${MAX_TEXT_LENGTH.toLocaleString()}`);
  elements.sendBtn.disabled = count === 0;
};

// ---------------------------------------------------------------------------
// History Rendering
// ---------------------------------------------------------------------------

const renderHistory = (elements, historyService) => {
  const items = historyService.getItems();
  setText(elements.historyCount, String(items.length));

  if (items.length === 0) {
    elements.historyList.innerHTML = "";
    hide(elements.historyClear);
    show(elements.historyEmpty);
    return;
  }

  hide(elements.historyEmpty);
  show(elements.historyClear);

  elements.historyList.innerHTML = items.map((item, i) => {
    const icon = item.direction === "sent" ? "📤" : "📥";
    return `<div class="history-item-mobile" data-index="${i}">
      <span class="history-item-mobile-icon">${icon}</span>
      <span class="history-item-mobile-text">${escapeHtml(item.text)}</span>
      <span class="history-item-mobile-time">${formatTime(item.timestamp)}</span>
    </div>`;
  }).join("");

  elements.historyList.onclick = async (e) => {
    const el = e.target.closest(".history-item-mobile");
    if (!el) return;
    const item = items[parseInt(el.dataset.index, 10)];
    if (item) {
      try {
        await navigator.clipboard.writeText(item.fullText);
        showToast(elements, "Copied!", "success");
      } catch {
        elements.textInput.value = item.fullText;
        updateCharCount(elements);
        showToast(elements, "Pasted into text box", "success");
      }
    }
  };
};

// ---------------------------------------------------------------------------
// Connect to Room (main logic)
// ---------------------------------------------------------------------------

const connectToRoom = (elements, roomId, keyBase64) => {
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const historyService = createHistoryService();
  const cryptoService = createCryptoService();
  const fileService = createFileService();
  const sessionService = createSessionService();

  let encryptionKey = null;
  let lastReceivedFromPC = "";

  // Save session for reconnect
  sessionService.saveSession(roomId, keyBase64);

  // Update UI
  setText(elements.connectionText, "Connected to room");
  setText(elements.connectionRoomId, roomId);
  hide(elements.noRoomSection);
  show(elements.inputSection);

  // Show encryption badge if key present
  if (keyBase64) {
    show(elements.encryptionBadge);
  }

  // --- Setup encryption ---
  const setupEncryption = async () => {
    if (keyBase64) {
      encryptionKey = await cryptoService.importKey(keyBase64);
    }
  };

  const encryptPayload = async (payload) => {
    if (!encryptionKey) return payload;
    const plaintext = JSON.stringify(payload);
    const { data, iv } = await cryptoService.encrypt(encryptionKey, plaintext);
    return { encrypted: true, data, iv };
  };

  const decryptPayload = async (rawData) => {
    if (!encryptionKey || !rawData.encrypted) return rawData;
    try {
      const decrypted = await cryptoService.decrypt(encryptionKey, rawData.data, rawData.iv);
      return JSON.parse(decrypted);
    } catch (err) {
      console.error("[App] Decryption failed:", err);
      return null;
    }
  };

  // --- Text input ---
  elements.textInput.addEventListener("input", () => updateCharCount(elements));

  // --- Send text ---
  const handleSend = async () => {
    const text = elements.textInput.value.trim();
    if (!text) { showToast(elements, "Enter some text first", "error"); return; }
    if (text.length > MAX_TEXT_LENGTH) {
      showToast(elements, `Max ${MAX_TEXT_LENGTH.toLocaleString()} characters`, "error");
      return;
    }

    setSendLoading(elements, true);
    try {
      const payload = await encryptPayload({ text });
      await firebaseService.sendToRoom(roomId, payload);
      historyService.addItem(text, "sent");
      renderHistory(elements, historyService);
      showToast(elements, "Sent to computer!", "success");
      elements.textInput.value = "";
      updateCharCount(elements);
    } catch (err) {
      console.error("[App] Send failed:", err);
      showToast(elements, "Failed to send", "error");
    } finally {
      setSendLoading(elements, false);
    }
  };

  elements.sendBtn.addEventListener("click", handleSend);
  elements.textInput.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleSend(); }
  });

  // --- Send file handler ---
  const handleFileSelect = async (file) => {
    if (!file) return;

    show(elements.fileSending);
    setText(elements.fileSendingText, `Sending ${file.name}...`);

    try {
      const processedFile = await fileService.processFile(file);
      const payload = await encryptPayload({ file: processedFile });
      await firebaseService.sendToRoom(roomId, payload);
      historyService.addItem(`📎 ${file.name}`, "sent");
      renderHistory(elements, historyService);
      showToast(elements, `${file.name} sent!`, "success");
    } catch (err) {
      console.error("[App] File send failed:", err);
      showToast(elements, err.message || "Failed to send file", "error");
    } finally {
      hide(elements.fileSending);
    }
  };

  elements.photoInput.addEventListener("change", (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = ""; // Reset for re-select
  });

  elements.fileInput.addEventListener("change", (e) => {
    handleFileSelect(e.target.files[0]);
    e.target.value = "";
  });

  // --- Listen for data from PC ---
  const initListener = async () => {
    await setupEncryption();

    firebaseService.listenToRoom(roomId, async (rawData, error) => {
      if (error) { console.error("[App] Listen error:", error); return; }
      if (!rawData) return;

      const data = await decryptPayload(rawData);
      if (!data) { showToast(elements, "Decryption failed", "error"); return; }

      if (data.text) {
        lastReceivedFromPC = data.text;
        setText(elements.receivedFromPCText, data.text);
        show(elements.receivedFromPC);

        if (isUrl(data.text)) { show(elements.openLinkMobileBtn); }
        else { hide(elements.openLinkMobileBtn); }

        historyService.addItem(data.text, "received");
        renderHistory(elements, historyService);
        showToast(elements, "Received from computer!", "success");
      }

      try { await firebaseService.clearToMobile(roomId); } catch {}
    });
  };

  initListener();

  // --- Copy received ---
  elements.copyReceivedBtn.addEventListener("click", async () => {
    if (!lastReceivedFromPC) return;
    try {
      await navigator.clipboard.writeText(lastReceivedFromPC);
      showToast(elements, "Copied!", "success");
    } catch {
      elements.textInput.value = lastReceivedFromPC;
      updateCharCount(elements);
      showToast(elements, "Pasted into text box", "success");
    }
  });

  // --- Open link ---
  elements.openLinkMobileBtn.addEventListener("click", () => {
    if (lastReceivedFromPC && isUrl(lastReceivedFromPC)) {
      window.open(lastReceivedFromPC, "_blank");
    }
  });

  // --- History ---
  let historyOpen = false;
  elements.historyToggle.addEventListener("click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) show(elements.historyPanel);
    else hide(elements.historyPanel);
  });

  elements.historyClear.addEventListener("click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService);
  });

  renderHistory(elements, historyService);
  updateCharCount(elements);
  elements.textInput.focus();
};

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

const initApp = () => {
  const elements = getElements();
  const urlService = createUrlService();
  const sessionService = createSessionService();

  const roomId = urlService.getRoomIdFromUrl();
  const keyBase64 = urlService.getEncryptionKeyFromUrl();

  // --- Room found in URL ---
  if (roomId) {
    connectToRoom(elements, roomId, keyBase64);
    return;
  }

  // --- No room: check for saved session ---
  addClass(elements.connectionBar, "disconnected");
  setText(elements.connectionText, "No room connected");
  setText(elements.connectionRoomId, "");
  show(elements.noRoomSection);
  hide(elements.inputSection);

  const lastSession = sessionService.getLastSession();
  if (lastSession) {
    show(elements.reconnectBtn);
    setText(elements.reconnectInfo,
      `Room ${lastSession.roomId} · ${sessionService.getTimeAgo(lastSession.timestamp)}`
    );

    elements.reconnectBtn.addEventListener("click", () => {
      hide(elements.noRoomSection);
      removeClass(elements.connectionBar, "disconnected");
      connectToRoom(elements, lastSession.roomId, lastSession.encryptionKey);
    });
  }
};

document.addEventListener("DOMContentLoaded", initApp);
