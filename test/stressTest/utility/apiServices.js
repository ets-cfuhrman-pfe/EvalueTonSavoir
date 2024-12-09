import axios from "axios";

// Logs in a user.
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

// Registers a new user.
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

// Attempts to log in a user, or registers and logs in if the login fails.
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

// Creates a new room
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