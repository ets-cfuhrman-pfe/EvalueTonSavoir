import { RoomParticipant } from './roomParticipant.js';

export class Teacher extends RoomParticipant {

    nbrMessageReceived = 0;

    constructor(username, roomName) {
        super(username, roomName);
        this.ready = false;
    }

    connectToRoom(baseUrl) {
        return super.connectToRoom(baseUrl);
    }

    onConnected() {
        this.createRoom();
        this.listenForStudentMessage();
    }

    createRoom() {
        if (this.socket) {
            this.socket.emit('create-room', this.roomName);
        }
    }

    broadcastMessage(message) {
        if (this.socket) {
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
                this.nbrMessageReceived++;
            });
        }
    }
}