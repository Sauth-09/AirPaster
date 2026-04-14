// ---------------------------------------------------------------------------
// Application Constants — Extension
// ---------------------------------------------------------------------------

/**
 * Base URL of the mobile web page (deployed on GitHub Pages or similar).
 * Update this with your actual deployment URL.
 * @example "https://your-username.github.io/airpaste/"
 */
export const MOBILE_WEB_BASE_URL = "https://your-username.github.io/airpaste/";

/** Firebase Realtime Database root path for rooms */
export const DB_ROOMS_PATH = "rooms";

/** Room ID format: XXXX-XXX (4 digits - 3 digits) */
export const ROOM_ID_LENGTH_LEFT = 4;
export const ROOM_ID_LENGTH_RIGHT = 3;

/** QR Code generation options */
export const QR_OPTIONS = {
  width: 200,
  margin: 2,
  color: {
    dark: "#e0e0e0",
    light: "#00000000", // transparent background
  },
};

/** Status message display duration (ms) */
export const STATUS_DISPLAY_DURATION = 3000;

/** UI Status types */
export const STATUS = Object.freeze({
  IDLE: "idle",
  WAITING: "waiting",
  COPIED: "copied",
  ERROR: "error",
  SENDING: "sending",
  SENT: "sent",
});
