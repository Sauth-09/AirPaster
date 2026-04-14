// ---------------------------------------------------------------------------
// Popup Entry Point — Extension UI Controller
// ---------------------------------------------------------------------------
// Orchestrates services: Firebase, QR, clipboard, crypto, history.
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS, STATUS_DISPLAY_DURATION, URL_REGEX } from "./utils/constants.js";
import { $, setText, show, hide, on, setStatusClass, addClass, removeClass } from "./utils/dom-helpers.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createRoomService } from "./services/room-service.js";
import { createQRService } from "./services/qr-service.js";
import { createClipboardService } from "./services/clipboard-service.js";
import { createHistoryService } from "./services/history-service.js";
import { createCryptoService } from "./services/crypto-service.js";

// ---------------------------------------------------------------------------
// DOM References
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
  // File
  receivedFileSection: $("#received-file-section"),
  downloadFileBtn: $("#download-file-btn"),
  fileIcon: $("#file-icon"),
  fileName: $("#file-name"),
  fileSize: $("#file-size"),
  imagePreview: $("#image-preview"),
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
// Helpers
// ---------------------------------------------------------------------------

const isUrl = (text) => URL_REGEX.test(text.trim());

const formatTime = (ts) => {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const escapeHtml = (t) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const getFileIcon = (type) => {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("word") || type.includes("document")) return "📝";
  if (type.includes("sheet") || type.includes("excel")) return "📊";
  if (type.includes("zip")) return "📦";
  return "📎";
};

// ---------------------------------------------------------------------------
// UI State
// ---------------------------------------------------------------------------

const updateStatus = (elements, status, message) => {
  const map = {
    [STATUS.WAITING]: "status-waiting",
    [STATUS.COPIED]: "status-copied",
    [STATUS.ERROR]: "status-error",
  };
  setStatusClass(elements.statusSection, "status-section", map[status] || "status-waiting");
  setText(elements.statusText, message);
};

// ---------------------------------------------------------------------------
// History Rendering
// ---------------------------------------------------------------------------

const renderHistory = (elements, historyService, clipboardService) => {
  const items = historyService.getItems();
  setText(elements.historyCount, String(items.length));

  if (items.length === 0) {
    elements.historyList.innerHTML = "";
    hide(elements.historyClearBtn);
    show(elements.historyEmpty);
    return;
  }

  hide(elements.historyEmpty);
  show(elements.historyClearBtn);

  elements.historyList.innerHTML = items.map((item, i) => {
    const icon = item.direction === "sent" ? "📤" : item.isFile ? "📎" : "📥";
    return `<div class="history-item" data-index="${i}" title="Click to copy">
      <span class="history-item-icon">${icon}</span>
      <span class="history-item-text">${escapeHtml(item.text)}</span>
      <span class="history-item-time">${formatTime(item.timestamp)}</span>
    </div>`;
  }).join("");

  elements.historyList.onclick = async (e) => {
    const el = e.target.closest(".history-item");
    if (!el) return;
    const item = items[parseInt(el.dataset.index, 10)];
    if (item) {
      await clipboardService.copyToClipboard(item.fullText);
      el.style.background = "rgba(52,211,153,0.15)";
      setTimeout(() => { el.style.background = ""; }, 500);
    }
  };
};

// ---------------------------------------------------------------------------
// File Download Helper
// ---------------------------------------------------------------------------

const triggerDownload = (base64Data, fileName, mimeType) => {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64Data}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ---------------------------------------------------------------------------
// App Init
// ---------------------------------------------------------------------------

const initApp = async () => {
  const elements = getElements();

  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const roomService = createRoomService();
  const qrService = createQRService();
  const clipboardService = createClipboardService();
  const historyService = createHistoryService();
  const cryptoService = createCryptoService();

  let lastReceivedText = "";
  let lastReceivedFile = null;
  let currentRoomId = null;
  let encryptionKey = null;
  let encryptionKeyBase64 = null;

  // --- Generate encryption key ---
  const setupEncryption = async () => {
    const rawKey = await cryptoService.generateKey();
    encryptionKeyBase64 = await cryptoService.exportKey(rawKey);
    encryptionKey = await cryptoService.importKey(encryptionKeyBase64);
  };

  // --- Decrypt incoming data ---
  const decryptPayload = async (data) => {
    if (!encryptionKey || !data.encrypted) return data;
    try {
      const decryptedText = await cryptoService.decrypt(encryptionKey, data.data, data.iv);
      return JSON.parse(decryptedText);
    } catch (err) {
      console.error("[Popup] Decryption failed:", err);
      return null;
    }
  };

  // --- Encrypt outgoing data ---
  const encryptPayload = async (payload) => {
    if (!encryptionKey) return payload;
    const plaintext = JSON.stringify(payload);
    const { data, iv } = await cryptoService.encrypt(encryptionKey, plaintext);
    return { encrypted: true, data, iv };
  };

  // --- Setup Room ---
  const setupRoom = async (roomId) => {
    currentRoomId = roomId;
    setText(elements.roomId, roomId);

    const mobileUrl = roomService.buildMobileUrl(roomId, encryptionKeyBase64);
    try {
      await qrService.generateQRCode(elements.qrContainer, mobileUrl);
    } catch {
      updateStatus(elements, STATUS.ERROR, "QR code generation failed");
      return;
    }

    updateStatus(elements, STATUS.WAITING, "Waiting for connection...");
    hide(elements.receivedSection);
    hide(elements.receivedFileSection);

    // Listen for incoming data
    firebaseService.listenToRoom(roomId, async (rawData, error) => {
      if (error) {
        updateStatus(elements, STATUS.ERROR, "Connection error. Try a new room.");
        return;
      }
      if (!rawData) return;

      const data = await decryptPayload(rawData);
      if (!data) {
        updateStatus(elements, STATUS.ERROR, "Decryption failed");
        return;
      }

      // --- Handle file ---
      if (data.file) {
        const f = data.file;
        lastReceivedFile = f;

        setText(elements.fileIcon, getFileIcon(f.type));
        setText(elements.fileName, f.name);
        setText(elements.fileSize, formatBytes(f.size));

        if (f.type.startsWith("image/")) {
          elements.imagePreview.src = `data:${f.type};base64,${f.data}`;
          show(elements.imagePreview);
        } else {
          hide(elements.imagePreview);
        }

        show(elements.receivedFileSection);
        hide(elements.receivedSection);

        historyService.addItem(`📎 ${f.name}`, "received");
        renderHistory(elements, historyService, clipboardService);
        updateStatus(elements, STATUS.COPIED, "File received!");
      }

      // --- Handle text ---
      if (data.text) {
        const text = data.text;

        const success = await clipboardService.copyToClipboard(text);
        if (success) {
          lastReceivedText = text;
          historyService.addItem(text, "received");
          renderHistory(elements, historyService, clipboardService);

          const msg = isUrl(text) ? "Link copied!" : "Copied to clipboard!";
          updateStatus(elements, STATUS.COPIED, msg);

          setText(elements.receivedText, text);
          show(elements.receivedSection);
          hide(elements.receivedFileSection);

          if (isUrl(text)) { show(elements.openLinkBtn); }
          else { hide(elements.openLinkBtn); }
        } else {
          updateStatus(elements, STATUS.ERROR, "Failed to copy");
        }
      }

      // Clear from Firebase
      try { await firebaseService.clearRoom(roomId); } catch {}

      setTimeout(() => {
        updateStatus(elements, STATUS.WAITING, "Waiting for more...");
      }, STATUS_DISPLAY_DURATION);
    });
  };

  // --- New room ---
  const startNewRoom = async () => {
    firebaseService.dispose();
    await setupEncryption();
    const roomId = roomService.generateRoomId();
    await setupRoom(roomId);
  };

  // --- Send to mobile ---
  const handleSendToMobile = async () => {
    const text = elements.sendToMobileInput.value.trim();
    if (!text || !currentRoomId) return;

    elements.sendToMobileBtn.disabled = true;
    try {
      const payload = await encryptPayload({ text });
      await firebaseService.sendToMobile(currentRoomId, payload);
      historyService.addItem(text, "sent");
      renderHistory(elements, historyService, clipboardService);
      elements.sendToMobileInput.value = "";
    } catch (err) {
      console.error("[Popup] Send failed:", err);
      updateStatus(elements, STATUS.ERROR, "Failed to send");
      setTimeout(() => updateStatus(elements, STATUS.WAITING, "Waiting..."), STATUS_DISPLAY_DURATION);
    }
  };

  // --- Event Listeners ---
  on(elements.newRoomBtn, "click", startNewRoom);

  on(elements.copyAgainBtn, "click", async () => {
    if (!lastReceivedText) return;
    const ok = await clipboardService.copyToClipboard(lastReceivedText);
    if (ok) {
      updateStatus(elements, STATUS.COPIED, "Copied again!");
      setTimeout(() => updateStatus(elements, STATUS.WAITING, "Waiting..."), STATUS_DISPLAY_DURATION);
    }
  });

  on(elements.openLinkBtn, "click", () => {
    if (lastReceivedText && isUrl(lastReceivedText)) {
      window.open(lastReceivedText, "_blank");
    }
  });

  on(elements.downloadFileBtn, "click", () => {
    if (lastReceivedFile) {
      triggerDownload(lastReceivedFile.data, lastReceivedFile.name, lastReceivedFile.type);
    }
  });

  on(elements.sendToMobileInput, "input", () => {
    elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
  });
  on(elements.sendToMobileBtn, "click", handleSendToMobile);
  on(elements.sendToMobileInput, "keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSendToMobile(); }
  });

  let historyOpen = false;
  on(elements.historyToggleBtn, "click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) { show(elements.historyPanel); addClass(elements.historyChevron, "open"); }
    else { hide(elements.historyPanel); removeClass(elements.historyChevron, "open"); }
  });

  on(elements.historyClearBtn, "click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService, clipboardService);
  });

  renderHistory(elements, historyService, clipboardService);
  await startNewRoom();

  window.addEventListener("unload", () => firebaseService.dispose());
};

document.addEventListener("DOMContentLoaded", initApp);
