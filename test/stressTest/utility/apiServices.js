import axios from "axios";
import { io } from "socket.io-client";

/**
 * Logs in a user.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} - The authentication token if successful.
 */
async function login(baseUrl, email, password) {
  if (!email || !password) throw new Error("Email and password are required.");

  try {
    const res = await axios.post(`${baseUrl}/api/user/login`, { email, password }, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 200 && res.data.token) {
      console.log(`Login successful for ${email}`);
      return res.data.token;
    }
    throw new Error(`Login failed. Status: ${res.status}`);
  } catch (error) {
    console.error(`Login error for ${email}:`, error.message);
    throw error;
  }
}

/**
 * Registers a new user.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} - A success message if registration is successful.
 */
async function register(baseUrl, email, password) {
  if (!email || !password) throw new Error("Email and password are required.");

  try {
    const res = await axios.post(`${baseUrl}/api/user/register`, { email, password }, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 200) {
      console.log(`Registration successful for ${email}`);
      return res.data.message || "Registration completed successfully.";
    }
    throw new Error(`Registration failed. Status: ${res.status}`);
  } catch (error) {
    console.error(`Registration error for ${email}:`, error.message);
    throw error;
  }
}

/**
 * Attempts to log in a user, or registers and logs in if the login fails.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} username - The user's email/username.
 * @param {string} password - The user's password.
 * @returns {Promise<string|null>} - The authentication token if successful, otherwise null.
 */
export async function attemptLoginOrRegister(baseUrl, username, password) {
  try {
    return await login(baseUrl, username, password);
  } catch (loginError) {
    console.log(`Login failed for ${username}. Attempting registration...`);
    try {
      await register(baseUrl, username, password);
      return await login(baseUrl, username, password);
    } catch (registerError) {
      console.error(`Registration and login failed for ${username}:`, registerError.message);
      return null;
    }
  }
}

/**
 * Creates a new room.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} token - The authorization token.
 * @returns {Promise<object>} - The created room object if successful.
 */
export async function createRoomContainer(baseUrl, token) {
  if (!token) throw new Error("Authorization token is required.");

  try {
    const res = await axios.post(`${baseUrl}/api/room`, {}, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) return res.data;
    throw new Error(`Room creation failed. Status: ${res.status}`);
  } catch (error) {
    console.error("Room creation error:", error.message);
    throw error;
  }
}

/**
 * Captures resource usage from multiple containers via WebSocket.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string[]} roomIds - List of room IDs.
 * @param {number} interval - Time interval between captures (ms).
 * @param {function} shouldStop - Callback to determine if capturing should stop.
 * @param {object} metrics - Metrics object to store resource usage.
 */
export async function captureResourceUsageForContainers(baseUrl, roomIds, interval, shouldStop, metrics) {
  console.log("Starting resource usage capture...");

  const sockets = {};
  const resourceData = {};

  // Initialize WebSocket connections for each room
  roomIds.forEach((id) => {
    resourceData[id] = [];
    const socket = io(baseUrl, {
      path: `/api/room/${id}/socket`,
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
    });

    socket.on("connect", () => console.log(`Connected to room ${id}`));
    socket.on("connect_error", (err) => console.error(`Connection error for room ${id}:`, err.message));
    sockets[id] = socket;
  });

  // Capture resource usage periodically
  while (!shouldStop()) {
    for (const id of roomIds) {
      const socket = sockets[id];
      if (socket?.connected) {
        try {
          socket.emit("get-usage");
          socket.once("usage-data", (data) => {
            resourceData[id].push({ timestamp: Date.now(), ...data });
          });
        } catch (error) {
          console.warn(`Error capturing metrics for room ${id}:`, error.message);
        }
      } else {
        console.warn(`Socket not connected for room ${id}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  // Close all WebSocket connections
  Object.values(sockets).forEach((socket) => socket.close());
  console.log("Resource usage capture completed.");

  metrics.resourceUsage = resourceData;
}
