const AUTH_LOGIN_ERROR = 1 << 0;  
const AUTH_ERROR_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

let authHealthBitmask = 0;
let lastAuthLoginError = null;

const normalizeError = (error) => {
    if (!error) {
        return 'Unknown authentication error';
    }
    if (typeof error === 'string') {
        return error;
    }
    return error.message || String(error);
};

const setAuthLoginError = (error) => {
    authHealthBitmask |= AUTH_LOGIN_ERROR;
    lastAuthLoginError = {
        message: normalizeError(error),
        timestamp: new Date().toISOString()
    };
};

const clearAuthLoginError = () => {
    authHealthBitmask &= ~AUTH_LOGIN_ERROR;
    lastAuthLoginError = null;
};

const getAuthLoginStatus = () => {
    const hasError = (authHealthBitmask & AUTH_LOGIN_ERROR) !== 0;
    
    // Auto-clear expired errors
    if (hasError && lastAuthLoginError) {
        const errorAge = Date.now() - new Date(lastAuthLoginError.timestamp).getTime();
        if (errorAge > AUTH_ERROR_EXPIRY_MS) {
            clearAuthLoginError();
            return {
                ok: true,
                error: null,
                bitmask: authHealthBitmask
            };
        }
    }
    
    return {
        ok: !hasError,
        error: hasError ? lastAuthLoginError : null,
        bitmask: authHealthBitmask
    };
};

module.exports = {
    setAuthLoginError,
    clearAuthLoginError,
    getAuthLoginStatus
};