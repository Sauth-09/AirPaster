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
import { createI18nService } from "./services/i18n-service.js";
import { createSessionService } from "./services/session-service.js";
import { createFileService } from "./services/file-service.js";
import { createSettingsService } from "./services/settings-service.js";
import { createWebRTCService } from "./services/webrtc-service.js";

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
  popupFileInput: $("#popup-file-input"),
  popupFileSending: $("#popup-file-sending"),
  popupFileSendingText: $("#popup-file-sending-text"),
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

// Icons are now handled by fileService.getFileIcon() for better modularity.

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

const renderHistory = (elements, historyService, clipboardService, t) => {
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
// ---------------------------------------------------------------------------
// Notifications Helper
// ---------------------------------------------------------------------------

const showNotification = (title, message, userSettings) => {
  if (userSettings && userSettings.notificationsEnabled === false) return;
  
  if (chrome && chrome.notifications) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: title,
      message: message,
      priority: 2
    });
  }
};

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

  const i18nService = createI18nService();
  i18nService.initDom();
  const t = i18nService.t;

  const sessionService = createSessionService();
  const fileService = createFileService(t);
  const settingsService = createSettingsService();
  
  const userSettings = await settingsService.loadSettings();

  let lastReceivedText = "";
  let lastReceivedFile = null;
  let currentRoomId = null;
  let encryptionKey = null;
  let encryptionKeyBase64 = null;
  let webrtcService = null;
  let currentFileToSend = null;

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

    sessionService.saveSession(roomId, encryptionKeyBase64);

    const mobileUrl = roomService.buildMobileUrl(roomId, encryptionKeyBase64);
    try {
      await qrService.generateQRCode(elements.qrContainer, mobileUrl);
    } catch {
      updateStatus(elements, STATUS.ERROR, t("qrError"));
      return;
    }

    updateStatus(elements, STATUS.WAITING, t("waitingConnection"));
    hide(elements.receivedSection);
    hide(elements.receivedFileSection);

    // Listen for incoming data
    firebaseService.listenToRoom(roomId, async (rawData, error) => {
      if (error) {
        updateStatus(elements, STATUS.ERROR, t("connError"));
        return;
      }
      if (!rawData) return;

      const data = await decryptPayload(rawData);
      if (!data) {
        updateStatus(elements, STATUS.ERROR, t("decryptError"));
        return;
      }

      // --- Handle WebRTC Signaling ---
      if (data.webrtc) {
        if (data.webrtc.type === "offer") {
          show(elements.popupFileSending);
          setText(elements.popupFileSendingText, t("p2pReceiving"));
          
          webrtcService = createWebRTCService(
            (progress) => {
              setText(elements.popupFileSendingText, t("p2pReceivingPercent", { percent: Math.round(progress * 100) }));
            },
            async (blob, meta) => {
              hide(elements.popupFileSending);
              const url = URL.createObjectURL(blob);
              lastReceivedFile = { name: meta.name, size: meta.size, type: meta.type, url: url, isBlob: true };
              
              setText(elements.fileIcon, fileService.getFileIcon(meta.type));
              setText(elements.fileName, meta.name);
              setText(elements.fileSize, formatBytes(meta.size));

              if (meta.type.startsWith("image/")) {
                elements.imagePreview.src = url;
                show(elements.imagePreview);
              } else {
                hide(elements.imagePreview);
              }

              show(elements.receivedFileSection);
              hide(elements.receivedSection);

              historyService.addItem(`📎 ${meta.name} (P2P)`, "received");
              renderHistory(elements, historyService, clipboardService, t);
              updateStatus(elements, STATUS.COPIED, t("fileReceived"));
              showNotification("AirPaste", `${t("notifFileReceived")} ${meta.name}`, userSettings);
              
              webrtcService.dispose();
              webrtcService = null;
            },
            (err) => {
              console.error("[WebRTC] Error:", err);
              hide(elements.popupFileSending);
              updateStatus(elements, STATUS.ERROR, t("p2pTransferFailed"));
            }
          );

          const answerSdp = await webrtcService.handleOffer(data.webrtc.sdp, data.webrtc.fileMeta);
          await firebaseService.sendToMobile(roomId, await encryptPayload({ webrtc: { type: "answer", sdp: answerSdp } }));
        } else if (data.webrtc.type === "answer") {
          if (!webrtcService) {
            try { await firebaseService.clearRoom(currentRoomId); } catch {}
            return;
          }
          await webrtcService.setAnswer(data.webrtc.sdp);
          try {
            await webrtcService.sendFile(currentFileToSend);
            historyService.addItem(`📎 ${currentFileToSend.name} (P2P)`, "sent");
            renderHistory(elements, historyService, clipboardService, t);
            updateStatus(elements, STATUS.COPIED, "File sent!");
            setTimeout(() => updateStatus(elements, STATUS.WAITING, t("waitingMore")), STATUS_DISPLAY_DURATION);
          } catch (err) {
            console.error("[WebRTC] Send failed:", err);
            updateStatus(elements, STATUS.ERROR, t("p2pTransferFailed"));
          }
          hide(elements.popupFileSending);
          elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
          webrtcService.dispose();
          webrtcService = null;
        }

        try { await firebaseService.clearRoom(currentRoomId); } catch {}
        return;
      }

      // --- Handle file ---
      if (data.file) {
        const f = data.file;
        lastReceivedFile = f;

        setText(elements.fileIcon, fileService.getFileIcon(f.type));
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
        renderHistory(elements, historyService, clipboardService, t);
        updateStatus(elements, STATUS.COPIED, t("fileReceived"));
        showNotification("AirPaste", `${t("notifFileReceived")} ${f.name}`, userSettings);
      }

      // --- Handle text ---
      if (data.text) {
        const text = data.text;

        const success = await clipboardService.copyToClipboard(text);
        if (success) {
          lastReceivedText = text;
          historyService.addItem(text, "received");
          renderHistory(elements, historyService, clipboardService, t);

          const msg = isUrl(text) ? t("linkCopied") : t("copiedClipboard");
          updateStatus(elements, STATUS.COPIED, msg);
          showNotification("AirPaste", isUrl(text) ? t("notifLinkCopied") : t("notifTextCopied"), userSettings);

          setText(elements.receivedText, text);
          show(elements.receivedSection);
          hide(elements.receivedFileSection);

          if (isUrl(text)) { show(elements.openLinkBtn); }
          else { hide(elements.openLinkBtn); }
        } else {
          updateStatus(elements, STATUS.ERROR, t("failedToCopy"));
        }
      }

      // Clear from Firebase
      try { await firebaseService.clearRoom(roomId); } catch {}

      setTimeout(() => {
        updateStatus(elements, STATUS.WAITING, t("waitingMore"));
      }, STATUS_DISPLAY_DURATION);
    });
  };

  // --- New room ---
  const startNewRoom = async () => {
    sessionService.clearSession();
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
      renderHistory(elements, historyService, clipboardService, t);
      elements.sendToMobileInput.value = "";
    } catch (err) {
      console.error("[Popup] Send failed:", err);
      updateStatus(elements, STATUS.ERROR, t("failedToSendToast") || "Failed to send");
      setTimeout(() => updateStatus(elements, STATUS.WAITING, t("waitingConnection")), STATUS_DISPLAY_DURATION);
    }
  };

  const handleFileSelectPopup = async (file) => {
    if (!file || !currentRoomId) return;

    show(elements.popupFileSending);
    setText(elements.popupFileSendingText, t("fileSending", { filename: file.name }));
    elements.sendToMobileBtn.disabled = true;

    try {
      if (file.size > 10 * 1024 * 1024) {
        // P2P WebRTC Transfer for > 10MB
        webrtcService = createWebRTCService(
          (progress) => {
            setText(elements.popupFileSendingText, t("p2pSendingPercent", { percent: Math.round(progress * 100) }));
          },
          () => {}, // Resolved by sendFile promise
          (err) => {
            console.error("[WebRTC] Error:", err);
            updateStatus(elements, STATUS.ERROR, t("p2pTransferFailed"));
            hide(elements.popupFileSending);
            elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
          }
        );
        currentFileToSend = file;
        const offerSdp = await webrtcService.createOffer({ name: file.name, size: file.size, type: file.type });
        const payload = await encryptPayload({
          webrtc: { type: "offer", sdp: offerSdp, fileMeta: { name: file.name, size: file.size, type: file.type } }
        });
        await firebaseService.sendToMobile(currentRoomId, payload);
        setText(elements.popupFileSendingText, t("p2pConnecting"));
        return; // UI logic completes when answer is received
      }

      // Normal Firebase Transfer for <= 10MB
      const processedFile = await fileService.processFile(file);
      const payload = await encryptPayload({ file: processedFile });
      await firebaseService.sendToMobile(currentRoomId, payload);
      historyService.addItem(`📎 ${file.name}`, "sent");
      renderHistory(elements, historyService, clipboardService, t);
      updateStatus(elements, STATUS.COPIED, "File sent!");
      setTimeout(() => updateStatus(elements, STATUS.WAITING, t("waitingMore")), STATUS_DISPLAY_DURATION);
    } catch (err) {
      console.error("[Popup] File send failed:", err);
      updateStatus(elements, STATUS.ERROR, err.message || t("failedToSendToast") || "Failed to send");
      setTimeout(() => updateStatus(elements, STATUS.WAITING, t("waitingConnection")), STATUS_DISPLAY_DURATION);
    } finally {
      // For WebRTC we hide this later when transfer finishes
      if (file.size <= 10 * 1024 * 1024) {
        hide(elements.popupFileSending);
        elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
      }
    }
  };

  // --- Event Listeners ---
  on(elements.newRoomBtn, "click", startNewRoom);

  on(elements.copyAgainBtn, "click", async () => {
    if (!lastReceivedText) return;
    const ok = await clipboardService.copyToClipboard(lastReceivedText);
    if (ok) {
      updateStatus(elements, STATUS.COPIED, t("copiedAgain"));
      setTimeout(() => updateStatus(elements, STATUS.WAITING, t("waitingMore")), STATUS_DISPLAY_DURATION);
    }
  });

  on(elements.openLinkBtn, "click", () => {
    if (lastReceivedText && isUrl(lastReceivedText)) {
      window.open(lastReceivedText, "_blank");
    }
  });

  on(elements.downloadFileBtn, "click", () => {
    if (lastReceivedFile) {
      if (lastReceivedFile.isBlob) {
        const link = document.createElement("a");
        link.href = lastReceivedFile.url;
        link.download = lastReceivedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        triggerDownload(lastReceivedFile.data, lastReceivedFile.name, lastReceivedFile.type);
      }
    }
  });

  on(elements.sendToMobileInput, "input", () => {
    elements.sendToMobileBtn.disabled = elements.sendToMobileInput.value.trim().length === 0;
  });
  on(elements.sendToMobileBtn, "click", handleSendToMobile);
  on(elements.sendToMobileInput, "keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleSendToMobile(); }
  });

  on(elements.popupFileInput, "change", (e) => {
    handleFileSelectPopup(e.target.files[0]);
    e.target.value = "";
  });

  let historyOpen = false;
  on(elements.historyToggleBtn, "click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) { show(elements.historyPanel); addClass(elements.historyChevron, "open"); }
    else { hide(elements.historyPanel); removeClass(elements.historyChevron, "open"); }
  });

  on(elements.historyClearBtn, "click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService, clipboardService, t);
  });

  renderHistory(elements, historyService, clipboardService, t);
  
  const lastSession = sessionService.getSession(userSettings);
  if (lastSession) {
    encryptionKeyBase64 = lastSession.encryptionKeyBase64;
    encryptionKey = await cryptoService.importKey(encryptionKeyBase64);
    await setupRoom(lastSession.roomId);
  } else {
    await startNewRoom();
  }

  window.addEventListener("unload", () => firebaseService.dispose());
};

document.addEventListener("DOMContentLoaded", initApp);
