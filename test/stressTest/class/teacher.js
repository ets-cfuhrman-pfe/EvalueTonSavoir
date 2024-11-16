import { io } from "socket.io-client";

export class Teacher {
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
                    this.createRoom(this.roomName);
                    resolve(this.socket); 
                });
    
                this.socket.on('error', (error) => {
                    reject(new Error(`Connection error: ${error.message}`)); 
                });
    
                this.socket.on('create-success', () => {
                    
                });
    
            } catch (error) {
                console.error(`Error connecting ${this.name} to room ${this.roomId}:`, error.message);
                reject(error); 
            }
        });
    }

    createRoom() {
        if (this.socket) {
            this.socket.emit('create-room', this.roomName || undefined);
        }
    }
}
