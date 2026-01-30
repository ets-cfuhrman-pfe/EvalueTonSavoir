const AUTH_LOGIN_ERROR = Math.trunc(1);

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