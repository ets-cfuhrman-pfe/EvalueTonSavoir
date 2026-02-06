const health = require('../../config/health');

describe('Health Config - OAuth Status Unit Test', () => {
    beforeEach(() => {
        health.clearOAuthTokenFailure();
    });

    test('should return UP status by default', () => {
        const status = health.getOAuthStatus();
        expect(status).toEqual({ status: 'up', error: null });
    });

    test('should return DOWN status when failure is marked', () => {
        const errorData = {
            provider: 'test-provider',
            message: 'Failed to obtain access token',
            statusCode: 500
        };

        health.markOAuthTokenFailure(errorData);

        const status = health.getOAuthStatus();
        expect(status.status).toBe('down');
        expect(status.error).toMatchObject(errorData);
        expect(status.error.timestamp).toBeDefined();
    });

    test('should return UP status after clearing failure', () => {
        health.markOAuthTokenFailure({ message: 'fail' });
        expect(health.getOAuthStatus().status).toBe('down');

        health.clearOAuthTokenFailure();
        expect(health.getOAuthStatus().status).toBe('up');
        expect(health.getOAuthStatus().error).toBeNull();
    });
});
