// ---------------------------------------------------------------------------
// Clipboard Service — System Clipboard Operations
// ---------------------------------------------------------------------------
// Wraps the Clipboard API with fallback for older environments.
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ClipboardService
 * @property {(text: string) => Promise<boolean>} copyToClipboard
 */

/**
 * Creates a Clipboard service instance.
 * @returns {ClipboardService}
 */
export const createClipboardService = () => {
  /**
   * Copy text to the system clipboard.
   * Uses the modern Clipboard API with a fallback to execCommand.
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} True if copy succeeded
   */
  const copyToClipboard = async (text) => {
    if (!text) {
      console.warn("[ClipboardService] Empty text — nothing to copy");
      return false;
    }

    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.warn("[ClipboardService] Clipboard API failed, trying fallback:", error);
      }
    }

    // Fallback: execCommand('copy')
    try {
      return copyViaExecCommand(text);
    } catch (error) {
      console.error("[ClipboardService] All copy methods failed:", error);
      return false;
    }
  };

  /**
   * Fallback copy method using a temporary textarea and execCommand.
   * @param {string} text
   * @returns {boolean}
   */
  const copyViaExecCommand = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Prevent scrolling to bottom
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand("copy");
    document.body.removeChild(textarea);
    return success;
  };

  return Object.freeze({ copyToClipboard });
};
