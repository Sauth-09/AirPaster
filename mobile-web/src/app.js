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
import { createI18nService } from "./services/i18n-service.js";
import { createQRScannerService } from "./services/qr-scanner-service.js";
import { createWebRTCService } from "./services/webrtc-service.js";

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

const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const triggerDownloadMobile = (base64Data, fileName, mimeType) => {
  const link = document.createElement("a");
  link.href = `data:${mimeType};base64,${base64Data}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  receivedFileMobileSection: $("#received-file-mobile-section"),
  downloadFileMobileBtn: $("#download-file-mobile-btn"),
  mobileFileIcon: $("#mobile-file-icon"),
  mobileFileName: $("#mobile-file-name"),
  mobileFileSize: $("#mobile-file-size"),
  mobileImagePreview: $("#mobile-image-preview"),
  // History
  historyToggle: $("#history-toggle-mobile"),
  historyCount: $("#history-count-mobile"),
  historyPanel: $("#history-panel-mobile"),
  historyList: $("#history-list-mobile"),
  historyClear: $("#history-clear-mobile"),
  historyEmpty: $("#history-empty-mobile"),
  // QR Scanner
  scanQRBtn: $("#scan-qr-btn"),
  qrScannerModal: $("#qr-scanner-modal"),
  qrScannerClose: $("#qr-scanner-close"),
  qrVideo: $("#qr-video"),
  qrCanvas: $("#qr-canvas"),
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

const renderHistory = (elements, historyService, t) => {
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
    const icon = item.direction === "sent" ? "📤" : item.isFile ? "📎" : "📥";
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
        showToast(elements, t("copiedToast"), "success");
      } catch {
        elements.textInput.value = item.fullText;
        updateCharCount(elements);
        showToast(elements, t("pastedToast"), "success");
      }
    }
  };
};

// ---------------------------------------------------------------------------
// Connect to Room (main logic)
// ---------------------------------------------------------------------------

const connectToRoom = (elements, roomId, keyBase64, t) => {
  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const historyService = createHistoryService();
  const cryptoService = createCryptoService();
  const fileService = createFileService(t);
  const sessionService = createSessionService();

  let encryptionKey = null;
  let lastReceivedFromPC = "";
  let lastReceivedFileMobile = null;
  let webrtcService = null;
  let currentFileToSend = null;

  // Save session for reconnect
  sessionService.saveSession(roomId, keyBase64);

  // Update UI
  setText(elements.connectionText, t("connectedToRoom"));
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
    if (!text) { showToast(elements, t("enterTextToast"), "error"); return; }
    if (text.length > MAX_TEXT_LENGTH) {
      showToast(elements, t("maxCharsToast", { max: MAX_TEXT_LENGTH.toLocaleString() }), "error");
      return;
    }

    setSendLoading(elements, true);
    try {
      const payload = await encryptPayload({ text });
      await firebaseService.sendToRoom(roomId, payload);
      historyService.addItem(text, "sent");
      renderHistory(elements, historyService, t);
      showToast(elements, t("sentToComputerToast"), "success");
      elements.textInput.value = "";
      updateCharCount(elements);
    } catch (err) {
      console.error("[App] Send failed:", err);
      showToast(elements, t("failedToSendToast"), "error");
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
    setText(elements.fileSendingText, t("fileSending", { filename: file.name }));

    try {
      if (file.size > 10 * 1024 * 1024) {
        // P2P WebRTC Transfer for > 10MB
        webrtcService = createWebRTCService(
          (progress) => {
            setText(elements.fileSendingText, t("p2pSendingPercent", { percent: Math.round(progress * 100) }));
          },
          () => {}, // Resolved by sendFile promise
          (err) => {
            console.error("[WebRTC] Error:", err);
            showToast(elements, t("p2pTransferFailed"), "error");
            hide(elements.fileSending);
          }
        );
        currentFileToSend = file;
        const offerSdp = await webrtcService.createOffer({ name: file.name, size: file.size, type: file.type });
        const payload = await encryptPayload({
          webrtc: { type: "offer", sdp: offerSdp, fileMeta: { name: file.name, size: file.size, type: file.type } }
        });
        await firebaseService.sendToRoom(roomId, payload);
        setText(elements.fileSendingText, t("p2pConnecting"));
        return; // UI completes when answer received
      }

      // Normal Firebase Transfer for <= 10MB
      const processedFile = await fileService.processFile(file);
      const payload = await encryptPayload({ file: processedFile });
      await firebaseService.sendToRoom(roomId, payload);
      historyService.addItem(`📎 ${file.name}`, "sent");
      renderHistory(elements, historyService, t);
      showToast(elements, t("fileSentToast", { filename: file.name }), "success");
    } catch (err) {
      console.error("[App] File send failed:", err);
      showToast(elements, err.message || t("failedToSendToast"), "error");
    } finally {
      if (file.size <= 10 * 1024 * 1024) {
        hide(elements.fileSending);
      }
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
      if (!data) { showToast(elements, t("decryptFailedToast"), "error"); return; }

      // --- Handle WebRTC Signaling ---
      if (data.webrtc) {
        if (data.webrtc.type === "offer") {
          show(elements.fileSending);
          setText(elements.fileSendingText, t("p2pReceiving"));
          
          webrtcService = createWebRTCService(
            (progress) => {
              setText(elements.fileSendingText, t("p2pReceivingPercent", { percent: Math.round(progress * 100) }));
            },
            async (blob, meta) => {
              hide(elements.fileSending);
              const url = URL.createObjectURL(blob);
              lastReceivedFileMobile = { name: meta.name, size: meta.size, type: meta.type, url: url, isBlob: true };

              setText(elements.mobileFileIcon, fileService.getFileIcon(meta.type));
              setText(elements.mobileFileName, meta.name);
              setText(elements.mobileFileSize, formatBytes(meta.size));

              if (meta.type.startsWith("image/")) {
                elements.mobileImagePreview.src = url;
                show(elements.mobileImagePreview);
              } else {
                hide(elements.mobileImagePreview);
              }

              show(elements.receivedFileMobileSection);
              hide(elements.receivedFromPC);

              historyService.addItem(`📎 ${meta.name} (P2P)`, "received");
              renderHistory(elements, historyService, t);
              showToast(elements, t("fileSentToast", { filename: meta.name }) || "File received", "success");
              
              webrtcService.dispose();
            },
            (err) => {
              console.error("[WebRTC] Error:", err);
              hide(elements.fileSending);
              showToast(elements, t("p2pTransferFailed"), "error");
            }
          );

          const answerSdp = await webrtcService.handleOffer(data.webrtc.sdp, data.webrtc.fileMeta);
          await firebaseService.sendToRoom(roomId, await encryptPayload({ webrtc: { type: "answer", sdp: answerSdp } }));
        } else if (data.webrtc.type === "answer") {
          await webrtcService.setAnswer(data.webrtc.sdp);
          try {
            await webrtcService.sendFile(currentFileToSend);
            historyService.addItem(`📎 ${currentFileToSend.name} (P2P)`, "sent");
            renderHistory(elements, historyService, t);
            showToast(elements, t("fileSentToast", { filename: currentFileToSend.name }), "success");
          } catch (err) {
            console.error("[WebRTC] Send failed:", err);
            showToast(elements, t("p2pTransferFailed"), "error");
          }
          hide(elements.fileSending);
          webrtcService.dispose();
        }

        try { await firebaseService.clearToMobile(roomId); } catch {}
        return;
      }

      if (data.file) {
        const f = data.file;
        lastReceivedFileMobile = f;

        setText(elements.mobileFileIcon, fileService.getFileIcon(f.type));
        setText(elements.mobileFileName, f.name);
        setText(elements.mobileFileSize, formatBytes(f.size));

        if (f.type.startsWith("image/")) {
          elements.mobileImagePreview.src = `data:${f.type};base64,${f.data}`;
          show(elements.mobileImagePreview);
        } else {
          hide(elements.mobileImagePreview);
        }

        show(elements.receivedFileMobileSection);
        hide(elements.receivedFromPC);

        historyService.addItem(`📎 ${f.name}`, "received");
        renderHistory(elements, historyService, t);
        showToast(elements, t("fileSentToast", { filename: f.name }) || "File received", "success");
      }

      if (data.text) {
        lastReceivedFromPC = data.text;
        setText(elements.receivedFromPCText, data.text);
        show(elements.receivedFromPC);
        hide(elements.receivedFileMobileSection);

        if (isUrl(data.text)) { show(elements.openLinkMobileBtn); }
        else { hide(elements.openLinkMobileBtn); }

        historyService.addItem(data.text, "received");
        renderHistory(elements, historyService, t);
        showToast(elements, t("receivedFromPctoast"), "success");
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
      showToast(elements, t("copiedToast"), "success");
    } catch {
      elements.textInput.value = lastReceivedFromPC;
      updateCharCount(elements);
      showToast(elements, t("pastedToast"), "success");
    }
  });

  // --- Open link ---
  elements.openLinkMobileBtn.addEventListener("click", () => {
    if (lastReceivedFromPC && isUrl(lastReceivedFromPC)) {
      window.open(lastReceivedFromPC, "_blank");
    }
  });

  // --- Download file mobile ---
  if (elements.downloadFileMobileBtn) {
    elements.downloadFileMobileBtn.addEventListener("click", () => {
      if (lastReceivedFileMobile) {
        if (lastReceivedFileMobile.isBlob) {
          const link = document.createElement("a");
          link.href = lastReceivedFileMobile.url;
          link.download = lastReceivedFileMobile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          triggerDownloadMobile(lastReceivedFileMobile.data, lastReceivedFileMobile.name, lastReceivedFileMobile.type);
        }
      }
    });
  }

  // --- History ---
  let historyOpen = false;
  elements.historyToggle.addEventListener("click", () => {
    historyOpen = !historyOpen;
    if (historyOpen) show(elements.historyPanel);
    else hide(elements.historyPanel);
  });

  elements.historyClear.addEventListener("click", () => {
    historyService.clearHistory();
    renderHistory(elements, historyService, t);
  });

  renderHistory(elements, historyService, t);
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
  const qrScannerService = createQRScannerService();
  
  const i18n = createI18nService();
  i18n.initDom();
  const t = i18n.t;

  const roomId = urlService.getRoomIdFromUrl();
  const keyBase64 = urlService.getEncryptionKeyFromUrl();

  // --- QR Scanner Logic ---
  const openQRScanner = () => {
    show(elements.qrScannerModal);

    qrScannerService
      .startScanning(elements.qrVideo, elements.qrCanvas, (result) => {
        // QR code scanned successfully
        qrScannerService.stopScanning();
        hide(elements.qrScannerModal);

        showToast(elements, t("roomConnected", { roomId: result.roomId }), "success");

        // Navigate to room URL or connect directly
        hide(elements.noRoomSection);
        removeClass(elements.connectionBar, "disconnected");
        connectToRoom(elements, result.roomId, result.key, t);
      })
      .catch((error) => {
        console.error("[App] QR scanner error:", error);
        hide(elements.qrScannerModal);
        showToast(elements, t("cameraAccessDenied"), "error");
      });
  };

  const closeQRScanner = () => {
    qrScannerService.stopScanning();
    hide(elements.qrScannerModal);
  };

  // QR scanner button click
  if (elements.scanQRBtn) {
    elements.scanQRBtn.addEventListener("click", openQRScanner);
  }

  // QR scanner close button
  if (elements.qrScannerClose) {
    elements.qrScannerClose.addEventListener("click", closeQRScanner);
  }

  // --- Room found in URL ---
  if (roomId) {
    connectToRoom(elements, roomId, keyBase64, t);
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
    const timeAgoStr = sessionService.getTimeAgo(lastSession.timestamp);
    // Use t() to render 'just now' or 'X min ago'
    let timeLabel = t("justNow");
    if (timeAgoStr !== "just now") {
      const min = timeAgoStr.split(" ")[0];
      timeLabel = t("minAgo", { min });
    }
    
    setText(elements.reconnectInfo, t("reconnectInfoBase", { roomId: lastSession.roomId, timeAgo: timeLabel }));

    elements.reconnectBtn.addEventListener("click", () => {
      hide(elements.noRoomSection);
      removeClass(elements.connectionBar, "disconnected");
      connectToRoom(elements, lastSession.roomId, lastSession.encryptionKey, t);
    });
  }
};

document.addEventListener("DOMContentLoaded", initApp);
