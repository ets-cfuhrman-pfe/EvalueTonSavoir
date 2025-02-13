// WebSocketService.tsx
import { io, Socket } from 'socket.io-client';

// Must (manually) sync these types to server/socket/socket.js

export type AnswerSubmissionToBackendType = {
    roomName: string;
    username: string;
    answer: string | number | boolean;
    idQuestion: number;
};

export type AnswerReceptionFromBackendType = {
    idUser: string;
    username: string;
    answer: string | number | boolean;
    idQuestion: number;
};

class WebSocketService {
    private socket: Socket | null = null;

    connect(backendUrl: string): Socket {
        // console.log(`WebSocketService.connect('${backendUrl}')`);

        // // Ensure the URL uses wss: if the URL starts with https:
        // const protocol = backendUrl.startsWith('https:') ? 'wss:' : 'ws:';
        // console.log(`WebSocketService.connect: protocol=${protocol}`);
        // const url = backendUrl.replace(/^http(s):/, protocol);
        // console.log(`WebSocketService.connect: changed url=${url}`);
        const url = backendUrl || window.location.host;

        this.socket = io(url, {
            transports: ['websocket'],
            reconnectionAttempts: 1
        });

        return this.socket;
    }


    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    createRoom() {
        if (this.socket) {
            this.socket.emit('create-room');
        }
    }

    nextQuestion(roomName: string, question: unknown) {
        if (this.socket) {
            this.socket.emit('next-question', { roomName, question });
        }
    }

    launchStudentModeQuiz(roomName: string, questions: unknown) {
        if (this.socket) {
            this.socket.emit('launch-student-mode', { roomName, questions });
        }
    }

    endQuiz(roomName: string) {
        if (this.socket) {
            this.socket.emit('end-questionnaire', { roomName });
        }
    }

    joinRoom(enteredRoomName: string, username: string) {
        if (this.socket) {
            this.socket.emit('join-room', { enteredRoomName, username });
        }
    }

    submitAnswer(answerData: AnswerSubmissionToBackendType
        // roomName: string,
        // answer: string | number | boolean,
        // username: string,
        // idQuestion: string
    ) {
        if (this.socket) {
            this.socket?.emit('submit-answer',
                //     {
                //     answer: answer,
                //     roomName: roomName,
                //     username: username,
                //     idQuestion: idQuestion
                // }
                answerData
            );
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
