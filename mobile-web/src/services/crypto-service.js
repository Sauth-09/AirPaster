// ---------------------------------------------------------------------------
// Crypto Service — End-to-End Encryption (AES-256-GCM) — Mobile
// ---------------------------------------------------------------------------

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const CHUNK_SIZE = 8192;

const bytesToBase64 = (bytes) => {
  const binary = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    binary[i] = String.fromCharCode(bytes[i]);
  }
  return btoa(binary.join(""));
};

const base64ToBytes = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const createCryptoService = () => {
  /**
   * Generate a new AES-256-GCM encryption key.
   * @returns {Promise<CryptoKey>}
   */
  const generateKey = async () => {
    return crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
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
    return btoa(String.fromCharCode.apply(null, bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };

  const importKey = async (base64) => {
    const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const bytes = base64ToBytes(padded);

    return crypto.subtle.importKey(
      "raw",
      bytes,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  };

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
      data: bytesToBase64(cipherBytes),
      iv: bytesToBase64(iv),
    };
  };

  const decrypt = async (key, cipherBase64, ivBase64) => {
    const cipherBytes = base64ToBytes(cipherBase64);
    const iv = base64ToBytes(ivBase64);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(plainBuffer);
  };

  return Object.freeze({ generateKey, exportKey, importKey, encrypt, decrypt });
};
