/**
 * Utility functions for managing room state using sessionStorage
 */

const ROOM_NAME_KEY = 'current-room-name';

/**
 * Set the current room name in sessionStorage
 * @param roomName 
 */
export const setCurrentRoomName = (roomName: string | null): void => {
    if (roomName === null) {
        sessionStorage.removeItem(ROOM_NAME_KEY);
    } else {
        sessionStorage.setItem(ROOM_NAME_KEY, roomName);
    }
};

/**
 * Get the current room name from sessionStorage
 * @returns The current room name or null if not set
 */
export const getCurrentRoomName = (): string | null => {
    return sessionStorage.getItem(ROOM_NAME_KEY);
};

/**
 * Clear the current room name from sessionStorage
 */
export const clearCurrentRoomName = (): void => {
    sessionStorage.removeItem(ROOM_NAME_KEY);
};