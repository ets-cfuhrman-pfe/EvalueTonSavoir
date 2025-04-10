// constants.tsx
const ENV_VARIABLES = {
    MODE: process.env.MODE || "production",
    VITE_BACKEND_URL: process.env.VITE_BACKEND_URL || "",
    BACKEND_URL: process.env.SITE_URL != undefined ? `${process.env.SITE_URL}${process.env.USE_PORTS ? `:${process.env.BACKEND_PORT}` : ''}` : process.env.VITE_BACKEND_URL || '',
    FRONTEND_URL: process.env.SITE_URL != undefined ? `${process.env.SITE_URL}${process.env.USE_PORTS ? `:${process.env.PORT}` : ''}` : ''
};

console.log(`ENV_VARIABLES.VITE_BACKEND_URL=${ENV_VARIABLES.VITE_BACKEND_URL}`);

export { ENV_VARIABLES };
