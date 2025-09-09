/**
 * User role management utilities
 * Determines and manages user roles based on authentication
 */

/**
 * Determines user role based on socket metadata, JWT token, or socket actions
 * In this application:
 * - Teachers authenticate and create rooms (have JWT tokens)
 * - Students can join rooms without authentication (no JWT tokens)
 * @param {Object} socket - Socket.IO socket object
 * @returns {string} User role ('teacher' or 'student')
 */
function getUserRole(socket) {
  try {
    // First, check if we already determined the role and stored it
    if (socket.userData?.role) {
      return socket.userData.role;
    }

    // Try to get JWT token from socket handshake query parameters
    const token = socket.handshake.query.token || socket.handshake.auth?.token;

    if (!token || token === '') {
      // No token means unauthenticated user (student joining a room)
      return 'student';
    }

    // Verify and decode the JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract roles from the decoded token
    if (decoded.roles && Array.isArray(decoded.roles)) {
      // Prioritize teacher/admin role if present
      if (decoded.roles.includes('teacher') || decoded.roles.includes('admin')) {
        return 'teacher';
      }
      if (decoded.roles.includes('student')) {
        return 'student';
      }
    }

    console.warn('roleManager: No valid roles found in JWT token, defaulting to student');
    return 'student';

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // Invalid or expired token - treat as student (unauthenticated)
      return 'student';
    }
    console.error('roleManager: Error decoding JWT token:', error.message);
    // Default to student role for security (more restrictive)
    return 'student';
  }
}

/**
 * Sets user role in socket metadata for future reference
 * @param {Object} socket - Socket.IO socket object
 * @param {string} role - User role to set
 */
function setUserRole(socket, role) {
  if (!socket.userData) {
    socket.userData = {};
  }
  socket.userData.role = role;
}

/**
 * Validates if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if role is valid
 */
function isValidRole(role) {
  return ['teacher', 'student', 'admin'].includes(role);
}

/**
 * Gets the default role for security (most restrictive)
 * @returns {string} Default role
 */
function getDefaultRole() {
  return 'student';
}

module.exports = {
  getUserRole,
  setUserRole,
  isValidRole,
  getDefaultRole
};
