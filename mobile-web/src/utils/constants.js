// ---------------------------------------------------------------------------
// Application Constants — Mobile Web
// ---------------------------------------------------------------------------

/** Firebase Realtime Database root path for rooms */
export const DB_ROOMS_PATH = "rooms";

/** Room ID format validation regex: XXXX-XXX */
export const ROOM_ID_REGEX = /^\d{4}-\d{3}$/;

/** Room ID format: XXXX-XXX (4 digits - 3 digits) */
export const ROOM_ID_LENGTH_LEFT = 4;
export const ROOM_ID_LENGTH_RIGHT = 3;

/** Mobile Web Base URL for QR code generation */
export const MOBILE_WEB_BASE_URL = "https://sauth-09.github.io/AirPaster/mobile-web/";

/** QR Code generation options (mobile host mode) */
export const QR_OPTIONS = {
  width: 240,
  margin: 3,
  errorCorrectionLevel: "H",
  color: {
    dark: "#000000",
    light: "#ffffff",
  },
};

/** Maximum text length allowed */
export const MAX_TEXT_LENGTH = 10000;

/** Status message display duration (ms) */
export const STATUS_DISPLAY_DURATION = 3000;

/** URL detection regex */
export const URL_REGEX = /^https?:\/\/[^\s]+$/i;

/** Maximum number of history items to store */
export const MAX_HISTORY_ITEMS = 10;

/** LocalStorage key for history */
export const HISTORY_STORAGE_KEY = "airpaste_history_mobile";

/** UI Status types */
export const STATUS = Object.freeze({
  IDLE: "idle",
  SENDING: "sending",
  SENT: "sent",
  ERROR: "error",
  NO_ROOM: "no_room",
});
