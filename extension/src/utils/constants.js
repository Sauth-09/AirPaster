// ---------------------------------------------------------------------------
// Application Constants — Extension
// ---------------------------------------------------------------------------

/**
 * Base URL of the mobile web page (deployed on GitHub Pages or similar).
 * Update this with your actual deployment URL.
 * @example "https://your-username.github.io/airpaste/"
 */
export const MOBILE_WEB_BASE_URL = "https://sauth-09.github.io/AirPaster/mobile-web/";

/** Firebase Realtime Database root path for rooms */
export const DB_ROOMS_PATH = "rooms";

/** Room ID format: XXXX-XXX (4 digits - 3 digits) */
export const ROOM_ID_LENGTH_LEFT = 4;
export const ROOM_ID_LENGTH_RIGHT = 3;

/** QR Code generation options */
export const QR_OPTIONS = {
  width: 280,
  margin: 3,
  errorCorrectionLevel: "H",
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

/** Status message display duration (ms) */
export const STATUS_DISPLAY_DURATION = 3000;

/** URL detection regex */
export const URL_REGEX = /^https?:\/\/[^\s]+$/i;

/** Maximum number of history items to store */
export const MAX_HISTORY_ITEMS = 10;

/** LocalStorage key for history */
export const HISTORY_STORAGE_KEY = "airpaste_history";

/** UI Status types */
export const STATUS = Object.freeze({
  IDLE: "idle",
  WAITING: "waiting",
  COPIED: "copied",
  ERROR: "error",
  SENDING: "sending",
  SENT: "sent",
});
