export class TestMetrics {
    constructor() {
        this.reset();
    }

    reset() {
        this.roomsCreated = 0;
        this.roomsFailed = 0;
        this.usersConnected = 0;
        this.userConnectionsFailed = 0;
        this.messagesAttempted = 0;
        this.messagesSent = 0;
        this.messagesReceived = 0;
        this.errors = new Map();
    }

    logError(category, error) {
        if (!this.errors.has(category)) {
            this.errors.set(category, []);
        }
        this.errors.get(category).push(error);
    }

    getSummary() {
        return {
            rooms: {
                created: this.roomsCreated,
                failed: this.roomsFailed,
                total: this.roomsCreated + this.roomsFailed
            },
            users: {
                connected: this.usersConnected,
                failed: this.userConnectionsFailed,
                total: this.usersConnected + this.userConnectionsFailed
            },
            messages: {
                attempted: this.messagesAttempted,
                sent: this.messagesSent,
                received: this.messagesReceived
            },
            errors: Object.fromEntries(
                Array.from(this.errors.entries()).map(([k, v]) => [k, v.length])
            )
        };
    }
}