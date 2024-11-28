import { io } from "socket.io-client";

export class RoomParticipant {
    constructor(username, roomName) {
        this.username = username;
        this.roomName = roomName;
        this.socket = null;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async connectToRoom(baseUrl) {
        let retries = 0;
        const maxRetries = 2;
        const retryDelay = 2000;

        const cleanup = () => {
            if (this.socket) {
                this.socket.removeAllListeners();
                this.socket.disconnect();
                this.socket = null;
            }
        };

        while (retries < maxRetries) {
            try {
                const socket = io(baseUrl, {
                    path: `/api/room/${this.roomName}/socket`,
                    transports: ['websocket'],
                    timeout: 8000,
                    reconnection: false,
                    forceNew: true
                });

                const result = await new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        cleanup();
                        reject(new Error('Connection timeout'));
                    }, 8000);

                    socket.on('connect', () => {
                        clearTimeout(timeout);
                        this.socket = socket;
                        this.onConnected(); // Add this line
                        resolve(socket);
                    });

                    socket.on('connect_error', (error) => {
                        clearTimeout(timeout);
                        cleanup();
                        reject(new Error(`Connection error: ${error.message}`));
                    });

                    socket.on('error', (error) => {
                        clearTimeout(timeout);
                        cleanup();
                        reject(new Error(`Socket error: ${error.message}`));
                    });
                });

                return result;

            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    onConnected() {
        // To be implemented by child classes
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}