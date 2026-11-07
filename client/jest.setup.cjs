 
process.env.VITE_BACKEND_URL = 'http://localhost:4000/';
process.env.VITE_BACKEND_SOCKET_URL = 'https://ets-glitch-backend.glitch.me/';

// jsdom does not expose TextEncoder/TextDecoder (browsers do); use Node's implementation.
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
