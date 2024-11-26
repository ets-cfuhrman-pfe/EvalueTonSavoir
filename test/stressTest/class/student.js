import { io } from "socket.io-client";

export class Student {
    constructor(username, roomName) {
        this.username = username;
        this.roomName = roomName;
        this.socket = null;
    }

    connectToRoom(baseUrl) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(baseUrl, {
                    path: `/api/room/${this.roomName}/socket`,
                    transports: ['websocket'],
                    autoConnect: true,
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 10000,
                    timeout: 20000,
                });

                this.socket.on('connect', () => {
                    this.joinRoom(this.roomName, this.username);
                    this.listenForMessages(); // Start listening for messages
                    resolve(this.socket);
                });

                this.socket.on('error', (error) => {
                    reject(new Error(`Connection error: ${error.message}`));
                });

            } catch (error) {
                console.error(`Error connecting ${this.name} to room ${this.roomName}:`, error.message);
                reject(error);
            }
        });
    }

    joinRoom(roomName, username) {
        if (this.socket) {
            this.socket.emit('join-room', { roomName, username });
        }
    }

    sendMessage(message) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('message-test', { room: this.roomName, message });
        }
    }

    listenForMessages() {
        if (this.socket) {
            this.socket.on('message-test', (data) => {
                console.log(`Message received in room ${this.roomName} by ${this.username}:`, data.message);
            });
        }
    }
}
