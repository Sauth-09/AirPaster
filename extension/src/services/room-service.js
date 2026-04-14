// ---------------------------------------------------------------------------
// Room Service — Room ID Generation & URL Building
// ---------------------------------------------------------------------------
// Pure functions for room ID management. No side effects.
// ---------------------------------------------------------------------------

import {
  ROOM_ID_LENGTH_LEFT,
  ROOM_ID_LENGTH_RIGHT,
  MOBILE_WEB_BASE_URL,
} from "../utils/constants.js";

/**
 * @typedef {Object} RoomService
 * @property {() => string} generateRoomId
 * @property {(roomId: string) => string} buildMobileUrl
 */

/**
 * Generate a random numeric string of given length.
 * @param {number} length
 * @returns {string}
 */
const randomDigits = (length) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");

/**
 * Creates a Room service instance.
 * @param {Object} [options]
 * @param {string} [options.baseUrl] - Override the default mobile web base URL
 * @returns {RoomService}
 */
export const createRoomService = (options = {}) => {
  const baseUrl = options.baseUrl || MOBILE_WEB_BASE_URL;

  /**
   * Generate a random room ID in format XXXX-XXX.
   * @returns {string}
   */
  const generateRoomId = () => {
    const left = randomDigits(ROOM_ID_LENGTH_LEFT);
    const right = randomDigits(ROOM_ID_LENGTH_RIGHT);
    return `${left}-${right}`;
  };

  /**
   * Build the full mobile web URL with the room ID as a query parameter.
   * @param {string} roomId
   * @returns {string}
   */
  const buildMobileUrl = (roomId) => {
    const url = new URL(baseUrl);
    url.searchParams.set("room", roomId);
    return url.toString();
  };

  return Object.freeze({ generateRoomId, buildMobileUrl });
};
