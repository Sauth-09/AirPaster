// ---------------------------------------------------------------------------
// File Service — Image Compression & File-to-Base64 Conversion
// ---------------------------------------------------------------------------
// Handles camera/gallery photos and document files for transfer.
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_IMAGE_WIDTH = 1200;
const IMAGE_QUALITY = 0.8;

/**
 * Creates a File service instance.
 * @returns {Object} Frozen service interface
 */
export const createFileService = () => {
  /**
   * Validate file size.
   * @param {File} file
   * @returns {{valid: boolean, message?: string}}
   */
  const validateFile = (file) => {
    if (!file) {
      return { valid: false, message: "No file selected" };
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return { valid: false, message: `File too large (${sizeMB}MB). Max 2MB.` };
    }
    return { valid: true };
  };

  /**
   * Check if a file is an image.
   * @param {File} file
   * @returns {boolean}
   */
  const isImage = (file) => file.type.startsWith("image/");

  /**
   * Compress an image file using Canvas API.
   * Resizes to maxWidth while keeping aspect ratio.
   * @param {File} file
   * @returns {Promise<string>} Base64 data URL
   */
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file"));

      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error("Failed to load image"));

        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;

          // Scale down if needed
          if (width > MAX_IMAGE_WIDTH) {
            height = Math.round((height * MAX_IMAGE_WIDTH) / width);
            width = MAX_IMAGE_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 (JPEG for smaller size)
          const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
          const base64 = dataUrl.split(",")[1];
          resolve(base64);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  };

  /**
   * Convert any file to base64 string.
   * @param {File} file
   * @returns {Promise<string>} Base64 encoded data
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.split(",")[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  };

  /**
   * Process a file for sending: compress if image, convert to base64.
   * @param {File} file
   * @returns {Promise<{name: string, type: string, size: number, data: string}>}
   */
  const processFile = async (file) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    let data;
    let type = file.type;

    if (isImage(file)) {
      data = await compressImage(file);
      type = "image/jpeg"; // Compressed to JPEG
    } else {
      data = await fileToBase64(file);
    }

    return {
      name: file.name,
      type,
      size: file.size,
      data,
    };
  };

  /**
   * Get a display-friendly icon for a file type.
   * @param {string} mimeType
   * @returns {string} Emoji icon
   */
  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("zip") || mimeType.includes("compressed")) return "📦";
    if (mimeType.startsWith("text/")) return "📃";
    return "📎";
  };

  return Object.freeze({
    validateFile,
    isImage,
    compressImage,
    fileToBase64,
    processFile,
    getFileIcon,
    MAX_FILE_SIZE,
  });
};
