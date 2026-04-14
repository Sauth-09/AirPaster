// ---------------------------------------------------------------------------
// QR Code Service — QR Code Generation
// ---------------------------------------------------------------------------
// Wraps the 'qrcode' library for clean QR code generation.
// ---------------------------------------------------------------------------

import QRCode from "qrcode";
import { QR_OPTIONS } from "../utils/constants.js";

/**
 * @typedef {Object} QRService
 * @property {(container: HTMLElement, url: string) => Promise<void>} generateQRCode
 * @property {(container: HTMLElement) => void} clearQRCode
 */

/**
 * Creates a QR Code service instance.
 * @param {Object} [options] - Override default QR options
 * @returns {QRService}
 */
export const createQRService = (options = {}) => {
  const qrOptions = { ...QR_OPTIONS, ...options };

  /**
   * Generate a QR code and render it as a canvas inside the container.
   * @param {HTMLElement} container - DOM element to render the QR code into
   * @param {string} url - URL to encode
   * @returns {Promise<void>}
   */
  const generateQRCode = async (container, url) => {
    if (!container) {
      throw new Error("[QRService] Container element is required");
    }
    if (!url) {
      throw new Error("[QRService] URL is required");
    }

    // Clear previous content
    container.innerHTML = "";

    try {
      // Create a canvas element
      const canvas = document.createElement("canvas");
      container.appendChild(canvas);

      await QRCode.toCanvas(canvas, url, qrOptions);
    } catch (error) {
      console.error("[QRService] QR generation failed:", error);
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
