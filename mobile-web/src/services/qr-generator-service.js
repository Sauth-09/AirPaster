// ---------------------------------------------------------------------------
// QR Generator Service — QR Code Generation (Mobile Host Mode)
// ---------------------------------------------------------------------------
// Wraps the 'qrcode' library for clean QR code generation on mobile.
// Used when the PWA creates a room and needs to display a QR code
// for another device to scan.
// ---------------------------------------------------------------------------

import QRCode from "qrcode";
import { QR_OPTIONS } from "../utils/constants.js";

/**
 * @typedef {Object} QRGeneratorService
 * @property {(container: HTMLElement, url: string) => Promise<void>} generateQRCode
 * @property {(container: HTMLElement) => void} clearQRCode
 */

/**
 * Creates a QR Code generator service instance.
 * @param {Object} [options] - Override default QR options
 * @returns {QRGeneratorService}
 */
export const createQRGeneratorService = (options = {}) => {
  const qrOptions = { ...QR_OPTIONS, ...options };

  /**
   * Generate a QR code and render it as a canvas inside the container.
   * @param {HTMLElement} container - DOM element to render the QR code into
   * @param {string} url - URL to encode
   * @returns {Promise<void>}
   */
  const generateQRCode = async (container, url) => {
    if (!container) {
      throw new Error("[QRGeneratorService] Container element is required");
    }
    if (!url) {
      throw new Error("[QRGeneratorService] URL is required");
    }

    // Clear previous content
    container.innerHTML = "";

    try {
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);
      await QRCode.toCanvas(canvas, url, qrOptions);
    } catch (error) {
      console.error("[QRGeneratorService] QR generation failed:", error);
      throw error;
    }
  };

  /**
   * Clear the QR code from the container.
   * @param {HTMLElement} container
   */
  const clearQRCode = (container) => {
    if (container) {
      container.innerHTML = "";
    }
  };

  return Object.freeze({ generateQRCode, clearQRCode });
};
