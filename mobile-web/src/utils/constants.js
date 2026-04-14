// ---------------------------------------------------------------------------
// Application Constants — Mobile Web
// ---------------------------------------------------------------------------

/** Firebase Realtime Database root path for rooms */
export const DB_ROOMS_PATH = "rooms";

/** Room ID format validation regex: XXXX-XXX */
export const ROOM_ID_REGEX = /^\d{4}-\d{3}$/;

/** Maximum text length allowed */
export const MAX_TEXT_LENGTH = 10000;

/** Status message display duration (ms) */
export const STATUS_DISPLAY_DURATION = 3000;

/** UI Status types */
export const STATUS = Object.freeze({
  IDLE: "idle",
  SENDING: "sending",
  SENT: "sent",
  ERROR: "error",
  NO_ROOM: "no_room",
});
