// console.log('constantsMock.tsx is loaded');

// constants.tsx
const ENV_VARIABLES = {
    MODE: 'production',
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || "",
    VITE_BACKEND_SOCKET_URL: process.env.VITE_BACKEND_SOCKET_URL || "",
};

// console.log(`ENV_VARIABLES.VITE_BACKEND_URL=${ENV_VARIABLES.VITE_BACKEND_URL}`);
// console.log(`ENV_VARIABLES.VITE_BACKEND_SOCKET_URL=${ENV_VARIABLES.VITE_BACKEND_SOCKET_URL}`);

export { ENV_VARIABLES };
