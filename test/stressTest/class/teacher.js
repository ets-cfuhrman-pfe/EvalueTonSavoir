import { io } from "socket.io-client";

export class Teacher {
    constructor(username, roomName) {
        this.username = username;
        this.roomName = roomName;
        this.socket = null;
    }

    connectToRoom(baseUrl) {
        this.socket = io(baseUrl, {
            path: `/api/room/${this.roomName}/socket`,
            transports: ['websocket'],autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 10000,
            timeout: 20000,
        });

        this.socket.on('connect', () => {
            this.createRoom(this.roomName);
        });

        this.socket.on('create-success', () => {
        });

        return this.socket;
    }

    createRoom() {
        if (this.socket) {
            this.socket.emit('create-room', this.roomName || undefined);
        }
    }
}
