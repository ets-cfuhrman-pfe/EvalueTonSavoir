// server/config/health.js

// In-memory state for OAuth health
let oauthTokenFailure = null;

module.exports = {
    /**
     * Mark an OAuth token failure
     * @param {Object} details - Error details
     */
    markOAuthTokenFailure: (details) => {
        // Whitelist safe fields to prevent leaking sensitive data
        oauthTokenFailure = {
            timestamp: new Date(),
            provider: details?.provider,
            message: details?.message,
            statusCode: details?.statusCode
        };
    },

    /**
     * Clear the OAuth token failure state
     */
    clearOAuthTokenFailure: () => {
        oauthTokenFailure = null;
    },

    /**
     * Get the current OAuth health status
     * @returns {Object} - { status: 'up' | 'down', error: Object | null }
     */
    getOAuthStatus: () => {
        if (oauthTokenFailure) {
            return {
                status: 'down',
                error: oauthTokenFailure
            };
        }
        return {
            status: 'up',
            error: null
        };
    },

    /**
     * Analyzes an OAuth/OIDC error and marks health failure if it's a server-side token issue.
     * @param {Error} err - The error object from passport callback
     * @param {string} providerName - The name of the auth provider
     * @returns {boolean} - True if marked as failure, false otherwise
     */
    checkAndMarkOAuthTokenFailure: (err, providerName) => {
        const isInternalError =
            err?.name === 'InternalOAuthError' &&
            /Failed to obtain access token/i.test(err.message);

        // Exclude client errors like expired code, reused code, invalid grant
        // only want to restart on server errors or network errors 
        const isClientSideError = err?.oauthError?.statusCode >= 400 && err?.oauthError?.statusCode < 500;

        if (isInternalError && !isClientSideError) {
            // Updated to remove sensitive oauthErrorData and prioritize oauthError.statusCode
            module.exports.markOAuthTokenFailure({
                provider: providerName,
                message: err.message,
                statusCode: err?.oauthError?.statusCode || err.statusCode
            });
            return true;
        }
        return false;
    }
};
