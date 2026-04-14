// ---------------------------------------------------------------------------
// Crypto Service — End-to-End Encryption (AES-256-GCM) — Mobile
// ---------------------------------------------------------------------------
// Same interface as extension crypto-service. Key is extracted from URL hash.
// ---------------------------------------------------------------------------

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

export const createCryptoService = () => {
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

  return Object.freeze({ importKey, encrypt, decrypt });
};
