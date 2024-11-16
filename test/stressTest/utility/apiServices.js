import axios from "axios";

/**
 * Logs in a user.
 * @param {string} baseUrl - The base URL of the API.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<string>} - The authentication token if successful.
 */
async function login(baseUrl, email, password) {
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const url = `${baseUrl}/api/user/login`;
  const payload = { email, password };

  try {
    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Login failed. Status: ${res.status}`);
    }

    console.log(`Login successful for ${email}`);
    return res.data.token;
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
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }

  const url = `${baseUrl}/api/user/register`;
  const payload = { email, password };

  try {
    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    if (res.status !== 200) {
      throw new Error(`Registration failed. Status: ${res.status}`);
    }

    console.log(`Registration successful for ${email}`);
    return res.data.message || "Registration completed successfully.";
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
    const token = await login(baseUrl, username, password);
    console.log(`User successfully logged in: ${username}`);
    return token;
  } catch (loginError) {
    console.log(`Login failed for ${username}. Attempting registration...`);

    try {
      const registerResponse = await register(baseUrl, username, password);
      console.log(`User successfully registered: ${username}`);

      const token = await login(baseUrl, username, password);
      console.log(`User successfully logged in after registration: ${username}`);
      return token;
    } catch (registerError) {
      console.error(`Registration failed for ${username}:`, registerError.message);
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
  if (!token) {
    throw new Error("Authorization token is required.");
  }

  const url = `${baseUrl}/api/room`;

  try {
    const res = await axios.post(url, {}, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status !== 200) {
      throw new Error(`Room creation failed. Status: ${res.status}`);
    }

    //console.log("Room successfully created:", res.data);
    return res.data;
  } catch (error) {
    console.error("Room creation error:", error.message);
    throw error;
  }
}
