import { RoomParticipant } from './roomParticipant.js';

export class Teacher extends RoomParticipant {
    constructor(username, roomName) {
        super(username, roomName);
        this.ready = false;
    }

    connectToRoom(baseUrl) {
        return super.connectToRoom(baseUrl, () => {
            this.createRoom();
            this.listenForStudentMessage();
            
            // Add room creation confirmation listener
            this.socket.on('create-success', () => {
                console.log(`Room ${this.roomName} created by teacher ${this.username}`);
                this.ready = true;
            });
        });
    }

    createRoom() {
        if (this.socket) {
            this.socket.emit('create-room', this.roomName);
        }
    }

    broadcastMessage(message) {
        if (this.socket && this.ready) {
            this.socket.emit('message-from-teacher', {
                roomName: this.roomName,
                message
            });
        } else {
            console.warn(`Teacher ${this.username} not ready to broadcast yet`);
        }
    }

    listenForStudentMessage() {
        if (this.socket) {
            this.socket.on('message-sent-student', ({ message }) => {
                //console.log(`Teacher ${this.username} received: "${message}"`);
            });
        }
    }
}