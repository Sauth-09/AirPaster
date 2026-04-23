// ---------------------------------------------------------------------------
// QR Scanner Service — Camera-based QR Code Reader
// ---------------------------------------------------------------------------
// Uses jsQR library to decode QR codes from camera feed.
// Pure functional, dependency-injected service.
// ---------------------------------------------------------------------------

import jsQR from "jsqr";

/**
 * @typedef {Object} QRScannerService
 * @property {(videoEl: HTMLVideoElement, canvasEl: HTMLCanvasElement, onResult: Function) => Promise<Function>} startScanning
 * @property {() => void} stopScanning
 */

/**
 * Creates a QR Scanner service instance.
 * @returns {QRScannerService}
 */
export const createQRScannerService = () => {
  let animationFrameId = null;
  let activeStream = null;

  /**
   * Start scanning QR codes using the device camera.
   * @param {HTMLVideoElement} videoEl - Video element to display camera feed
   * @param {HTMLCanvasElement} canvasEl - Hidden canvas for frame processing
   * @param {(result: {roomId: string, key: string|null, fullUrl: string}) => void} onResult - Callback when QR decoded
   * @returns {Promise<Function>} Stop function
   */
  const startScanning = async (videoEl, canvasEl, onResult) => {
    if (!videoEl || !canvasEl) {
      throw new Error("[QRScanner] Video and canvas elements are required");
    }

    try {
      // Request rear camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      activeStream = stream;
      videoEl.srcObject = stream;
      videoEl.setAttribute("playsinline", "true");
      await videoEl.play();

      const ctx = canvasEl.getContext("2d", { willReadFrequently: true });
      let lastResult = "";

      const scanFrame = () => {
        if (videoEl.readyState !== videoEl.HAVE_ENOUGH_DATA) {
          animationFrameId = requestAnimationFrame(scanFrame);
          return;
        }

        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);

        const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data !== lastResult) {
          lastResult = code.data;
          const parsed = parseAirPasteUrl(code.data);
          if (parsed) {
            onResult(parsed);
          }
        }

        animationFrameId = requestAnimationFrame(scanFrame);
      };

      animationFrameId = requestAnimationFrame(scanFrame);

      return stopScanning;
    } catch (error) {
      console.error("[QRScanner] Camera access error:", error);
      throw error;
    }
  };

  /**
   * Stop scanning and release camera resources.
   */
  const stopScanning = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      activeStream = null;
    }
  };

  /**
   * Parse an AirPaste mobile URL to extract room ID and encryption key.
   * Expected format: https://...?room=XXXX-XXX#key=abc123
   * @param {string} url
   * @returns {{roomId: string, key: string|null, fullUrl: string}|null}
   */
  const parseAirPasteUrl = (url) => {
    try {
      const parsed = new URL(url);

      // Validate it looks like an AirPaste URL
      const roomId = parsed.searchParams.get("room");
      if (!roomId || !/^\d{4}-\d{3}$/.test(roomId)) {
        return null;
      }

      // Extract encryption key from hash
      let key = null;
      const hash = parsed.hash;
      if (hash && hash.includes("key=")) {
        const keyMatch = hash.match(/key=([A-Za-z0-9_-]+)/);
        if (keyMatch) {
          key = keyMatch[1];
        }
      }

      return { roomId, key, fullUrl: url };
    } catch {
      return null;
    }
  };

  return Object.freeze({ startScanning, stopScanning });
};
