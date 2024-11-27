import { io } from "socket.io-client";

export class RoomParticipant {
    constructor(username, roomName) {
        this.username = username;
        this.roomName = roomName;
        this.socket = null;
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    async connectToRoom(baseUrl, onConnectCallback) {
        let retries = 0;

        const connect = () => {
            return new Promise((resolve, reject) => {
                try {
                    const socket = io(baseUrl, {
                        path: `/api/room/${this.roomName}/socket`,
                        transports: ['websocket'],
                        timeout: 5000,
                        reconnection: true,
                        reconnectionAttempts: 3,
                        reconnectionDelay: 1000,
                    });

                    const connectionTimeout = setTimeout(() => {
                        socket.close();
                        reject(new Error('Connection timeout'));
                    }, 5000);

                    socket.on('connect', () => {
                        clearTimeout(connectionTimeout);
                        this.socket = socket;
                        if (onConnectCallback) {
                            onConnectCallback();
                        }
                        resolve(socket);
                    });

                    socket.on('connect_error', (error) => {
                        clearTimeout(connectionTimeout);
                        reject(new Error(`Connection error: ${error.message}`));
                    });

                } catch (error) {
                    reject(error);
                }
            });
        };

        while (retries < this.maxRetries) {
            try {
                return await connect();
            } catch (error) {
                retries++;
                if (retries === this.maxRetries) {
                    throw new Error(`Failed to connect ${this.username} after ${this.maxRetries} attempts: ${error.message}`);
                }
                console.warn(`Retry ${retries}/${this.maxRetries} for ${this.username}`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}