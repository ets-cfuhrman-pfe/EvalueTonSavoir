// server/config/health.js

// In-memory state for OAuth health
let oauthTokenFailure = null;

module.exports = {
    /**
     * Mark an OAuth token failure
     * @param {Object} details - Error details
     */
    markOAuthTokenFailure: (details) => {
        oauthTokenFailure = {
            timestamp: new Date(),
            ...details
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
    }
};
