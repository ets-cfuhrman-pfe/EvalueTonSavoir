// student.js
import { RoomParticipant } from './roomParticipant.js';

export class Student extends RoomParticipant {

    nbrMessageReceived = 0;

    constructor(username, roomName) {
        super(username, roomName);
    }

    connectToRoom(baseUrl) {
        return super.connectToRoom(baseUrl);
    }

    onConnected() {
        this.joinRoom();
        this.listenForTeacherMessage();
    }

    joinRoom() {
        if (this.socket) {
            this.socket.emit('join-room', {
                enteredRoomName: this.roomName,
                username: this.username
            });
        }
    }

    listenForTeacherMessage() {
        if (this.socket) {
            this.socket.on('message-sent-teacher', ({ message }) => {
                this.nbrMessageReceived++;
                this.respondToTeacher(message);
            });
        }
    }

    respondToTeacher(message) {
        const reply = `${this.username} replying to: "${message}"`;
        if (this.socket) {
            this.socket.emit('message-from-student', {
                roomName: this.roomName,
                message: reply
            });
        }
    }
}