// ---------------------------------------------------------------------------
// Crypto Service — End-to-End Encryption (AES-256-GCM)
// ---------------------------------------------------------------------------
// Uses Web Crypto API for encryption. Key is shared via QR URL hash fragment
// so it never reaches the server.
// ---------------------------------------------------------------------------

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Creates a Crypto service instance.
 * @returns {Object} Frozen service interface
 */
export const createCryptoService = () => {
  /**
   * Generate a new AES-256 encryption key.
   * @returns {Promise<CryptoKey>}
   */
  const generateKey = async () => {
    return crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true, // extractable
      ["encrypt", "decrypt"]
    );
  };

  /**
   * Export a CryptoKey to a URL-safe base64 string.
   * @param {CryptoKey} key
   * @returns {Promise<string>}
   */
  const exportKey = async (key) => {
    const raw = await crypto.subtle.exportKey("raw", key);
    const bytes = new Uint8Array(raw);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  /**
   * Import a CryptoKey from a URL-safe base64 string.
   * @param {string} base64 - URL-safe base64 encoded key
   * @returns {Promise<CryptoKey>}
   */
  const importKey = async (base64) => {
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));

    return crypto.subtle.importKey(
      "raw",
      bytes,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  };

  /**
   * Encrypt a string with AES-GCM.
   * @param {CryptoKey} key
   * @param {string} plaintext
   * @returns {Promise<{data: string, iv: string}>} Base64 encoded ciphertext + IV
   */
  const encrypt = async (key, plaintext) => {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );

    const cipherBytes = new Uint8Array(cipherBuffer);
    return {
      data: btoa(String.fromCharCode(...cipherBytes)),
      iv: btoa(String.fromCharCode(...iv)),
    };
  };

  /**
   * Decrypt AES-GCM encrypted data.
   * @param {CryptoKey} key
   * @param {string} cipherBase64 - Base64 encoded ciphertext
   * @param {string} ivBase64 - Base64 encoded IV
   * @returns {Promise<string>} Decrypted plaintext
   */
  const decrypt = async (key, cipherBase64, ivBase64) => {
    const cipherBytes = Uint8Array.from(atob(cipherBase64), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

    const plainBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(plainBuffer);
  };

  return Object.freeze({ generateKey, exportKey, importKey, encrypt, decrypt });
};
