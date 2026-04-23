// ---------------------------------------------------------------------------
// Share Target Entry Point — Handles shared content from phone share menu
// ---------------------------------------------------------------------------
// Flow:
// 1. Read shared data from SW cache
// 2. Check for active room session
// 3. If no room → open QR scanner
// 4. On QR scan → connect to room + send shared data
// 5. Show success/error state
// ---------------------------------------------------------------------------

import { FIREBASE_CONFIG } from "./config/firebase-config.js";
import { STATUS_DISPLAY_DURATION } from "./utils/constants.js";

import { createFirebaseService } from "./services/firebase-service.js";
import { createCryptoService } from "./services/crypto-service.js";
import { createSessionService } from "./services/session-service.js";
import { createShareCacheService } from "./services/share-cache-service.js";
import { createQRScannerService } from "./services/qr-scanner-service.js";
import { createI18nService } from "./services/i18n-service.js";

// ---------------------------------------------------------------------------
// DOM Helpers
// ---------------------------------------------------------------------------

const $ = (s) => document.querySelector(s);
const setText = (el, t) => { if (el) el.textContent = t; };
const show = (el) => { if (el) el.classList.remove("hidden"); };
const hide = (el) => { if (el) el.classList.add("hidden"); };

// ---------------------------------------------------------------------------
// DOM References
// ---------------------------------------------------------------------------

const getElements = () => ({
  shareInfo: $("#share-info"),
  shareInfoTitle: $("#share-info-title"),
  shareInfoDesc: $("#share-info-desc"),
  sharePreview: $("#share-preview"),
  sharePreviewFile: $("#share-preview-file"),
  sharePreviewFilename: $("#share-preview-filename"),
  sharePreviewText: $("#share-preview-text"),
  sharePreviewTextContent: $("#share-preview-textcontent"),
  qrScannerSection: $("#qr-scanner-section"),
  qrVideo: $("#qr-video"),
  qrCanvas: $("#qr-canvas"),
  sendingProgress: $("#sending-progress"),
  sendingText: $("#sending-text"),
  sendSuccess: $("#send-success"),
  closeBtn: $("#close-btn"),
  sendError: $("#send-error"),
  errorDesc: $("#error-desc"),
  retryBtn: $("#retry-btn"),
  toast: $("#toast"),
  toastIcon: $("#toast-icon"),
  toastText: $("#toast-text"),
});

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

let toastTimer = null;

const showToast = (elements, message, type = "success") => {
  const { toast, toastIcon, toastText } = elements;
  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.remove("toast-success", "toast-error", "hidden");
  toast.classList.add(`toast-${type}`);
  setText(toastIcon, type === "success" ? "✓" : "✕");
  setText(toastText, message);
  requestAnimationFrame(() => toast.classList.add("visible"));
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.classList.add("hidden"), 300);
  }, STATUS_DISPLAY_DURATION);
};

// ---------------------------------------------------------------------------
// Show Shared Content Preview
// ---------------------------------------------------------------------------

const showSharedPreview = (elements, sharedData) => {
  show(elements.sharePreview);

  if (sharedData.file) {
    show(elements.sharePreviewFile);
    setText(elements.sharePreviewFilename, sharedData.file.name);
  }

  const textContent = sharedData.text || sharedData.url || sharedData.title;
  if (textContent) {
    show(elements.sharePreviewText);
    const truncated = textContent.length > 80
      ? textContent.substring(0, 80) + "..."
      : textContent;
    setText(elements.sharePreviewTextContent, truncated);
  }
};

// ---------------------------------------------------------------------------
// Send Shared Data to Room
// ---------------------------------------------------------------------------

const sendSharedData = async (elements, sharedData, roomId, keyBase64, t) => {
  // Show sending progress
  hide(elements.shareInfo);
  hide(elements.qrScannerSection);
  show(elements.sendingProgress);

  const firebaseService = createFirebaseService(FIREBASE_CONFIG);
  const cryptoService = createCryptoService();
  const sessionService = createSessionService();

  try {
    // Setup encryption
    let encryptionKey = null;
    if (keyBase64) {
      encryptionKey = await cryptoService.importKey(keyBase64);
    }

    const encryptPayload = async (payload) => {
      if (!encryptionKey) return payload;
      const plaintext = JSON.stringify(payload);
      const { data, iv } = await cryptoService.encrypt(encryptionKey, plaintext);
      return { encrypted: true, data, iv };
    };

    // Save session
    sessionService.saveSession(roomId, keyBase64);

    // Prepare and send data
    if (sharedData.file) {
      setText(elements.sendingText, t("fileSending", { filename: sharedData.file.name }));
      const payload = await encryptPayload({ file: sharedData.file });
      await firebaseService.sendToRoom(roomId, payload);
    } else {
      const text = sharedData.text || sharedData.url || sharedData.title || "";
      if (!text) throw new Error("No content to send");

      setText(elements.sendingText, t("sendingNow"));
      const payload = await encryptPayload({ text });
      await firebaseService.sendToRoom(roomId, payload);
    }

    // Show success
    hide(elements.sendingProgress);
    show(elements.sendSuccess);

    // Clear shared data cache
    const shareCacheService = createShareCacheService();
    await shareCacheService.clearSharedData();

    firebaseService.dispose();
  } catch (error) {
    console.error("[ShareTarget] Send failed:", error);
    hide(elements.sendingProgress);
    show(elements.sendError);
    setText(elements.errorDesc, error.message || t("failedToSendToast"));
  }
};

// ---------------------------------------------------------------------------
// Start QR Scanner
// ---------------------------------------------------------------------------

const startQRScanner = (elements, sharedData, t) => {
  const qrScanner = createQRScannerService();

  show(elements.qrScannerSection);

  qrScanner
    .startScanning(elements.qrVideo, elements.qrCanvas, (result) => {
      // QR code successfully scanned!
      qrScanner.stopScanning();

      showToast(elements, t("roomConnected", { roomId: result.roomId }), "success");

      // Send the shared data
      sendSharedData(elements, sharedData, result.roomId, result.key, t);
    })
    .catch((error) => {
      console.error("[ShareTarget] QR scanner error:", error);
      hide(elements.qrScannerSection);
      show(elements.sendError);
      setText(elements.errorDesc, t("cameraAccessDenied"));
    });

  return qrScanner;
};

// ---------------------------------------------------------------------------
// App Initialization
// ---------------------------------------------------------------------------

const initShareTarget = async () => {
  const elements = getElements();
  const shareCacheService = createShareCacheService();
  const sessionService = createSessionService();

  const i18n = createI18nService();
  i18n.initDom();
  const t = i18n.t;

  // Read shared data from SW cache
  const sharedData = await shareCacheService.getSharedData();

  if (!sharedData) {
    // No shared data — might have been opened directly
    setText(elements.shareInfoTitle, t("noShareData"));
    setText(elements.shareInfoDesc, t("noShareDataDesc"));
    hide(elements.qrScannerSection);
    return;
  }

  // Show what's being shared
  showSharedPreview(elements, sharedData);

  // Check for active room session
  const lastSession = sessionService.getLastSession();

  if (lastSession) {
    // Active room exists — send directly!
    setText(elements.shareInfoTitle, t("sendingToRoom", { roomId: lastSession.roomId }));
    setText(elements.shareInfoDesc, t("sendingNow"));
    hide(elements.qrScannerSection);

    await sendSharedData(
      elements,
      sharedData,
      lastSession.roomId,
      lastSession.encryptionKey,
      t
    );
  } else {
    // No active room — show QR scanner
    setText(elements.shareInfoTitle, t("shareReadyTitle"));
    setText(elements.shareInfoDesc, t("shareReadyDesc"));

    const qrScanner = startQRScanner(elements, sharedData, t);

    // Retry button
    elements.retryBtn?.addEventListener("click", () => {
      hide(elements.sendError);
      show(elements.shareInfo);
      startQRScanner(elements, sharedData, t);
    });
  }

  // Close button
  elements.closeBtn?.addEventListener("click", () => {
    window.close();
    // Fallback: redirect to main page
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 300);
  });
};

document.addEventListener("DOMContentLoaded", initShareTarget);
