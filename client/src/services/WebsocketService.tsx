import { io, Socket } from 'socket.io-client';
import { QuestionType } from 'src/Types/QuestionType';

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

    createRoom(roomName: string) {
        if (this.socket) {
            this.socket.emit('create-room', roomName); 
        }
    }

    // deleteRoom(roomName: string) {
    //     console.log('WebsocketService: deleteRoom', roomName);
    //     if (this.socket) {
    //         console.log('WebsocketService: emit: delete-room', roomName);
    //         this.socket.emit('delete-room', roomName);
    //     }
    // }

    nextQuestion(args: {roomName: string, questions: QuestionType[] | undefined, questionIndex: number, isLaunch: boolean}) {
        // deconstruct args
        const { roomName, questions, questionIndex, isLaunch } = args;
        console.log('WebsocketService: nextQuestion', roomName, questions, questionIndex, isLaunch);
        if (!questions || !questions[questionIndex]) {
            throw new Error('WebsocketService: nextQuestion: question is null');
        }
        
        if (this.socket) {
            if (isLaunch) {
                this.socket.emit('launch-teacher-mode', { roomName, questions });
            }
            const question = questions[questionIndex];
            this.socket.emit('next-question', { roomName, question });
        }
    }

    launchStudentModeQuiz(roomName: string, questions: unknown) {
        console.log('WebsocketService: launchStudentModeQuiz', roomName, questions, this.socket);
        if (this.socket) {
            this.socket.emit('launch-student-mode', { roomName, questions });
        }
    }

    endQuiz(roomName: string) {
        if (this.socket) {
            this.socket.emit('end-quiz', { roomName });
        }
    }

    joinRoom(enteredRoomName: string, username: string) {
        if (this.socket) {
            this.socket.emit('join-room', { enteredRoomName, username });
        }
    }

    submitAnswer(answerData: AnswerSubmissionToBackendType) {
        if (this.socket) {
            this.socket?.emit('submit-answer', answerData
            );
        }
    }
}

const webSocketService = new WebSocketService();
export default webSocketService;
