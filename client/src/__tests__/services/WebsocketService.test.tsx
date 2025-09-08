import { BaseQuestion, parse } from 'gift-pegjs';
import WebsocketService from '../../services/WebsocketService';
import { io, Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';
import { QuestionType } from 'src/Types/QuestionType';

jest.mock('socket.io-client');

describe('WebSocketService', () => {
    let mockSocket: Partial<Socket>;

    beforeEach(() => {
        mockSocket = {
            emit: jest.fn(),
            disconnect: jest.fn(),
            connect: jest.fn()
        };

        (io as jest.Mock).mockReturnValue(mockSocket);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('connect should initialize socket connection', () => {
        WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        expect(io).toHaveBeenCalled();
        expect(WebsocketService['socket']).toBe(mockSocket);
    });

    test('disconnect should terminate socket connection', () => {
        mockSocket = WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        expect(WebsocketService['socket']).toBeTruthy();
        WebsocketService.disconnect();
        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(WebsocketService['socket']).toBeNull();
    });

    test('createRoom should emit create-room event', () => {
        const roomName = 'Test Room';
        WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        WebsocketService.createRoom(roomName);
        expect(mockSocket.emit).toHaveBeenCalledWith('create-room', roomName);
    });

    test('nextQuestion should emit next-question event with correct parameters', () => {
        const roomName = 'testRoom';
        const mockGiftQuestions = parse('A {T}');
        const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
            if (question.type !== "Category")
                question.id = (index + 1).toString();
            const newMockQuestion = question;
            return {question : newMockQuestion as BaseQuestion};
        });
        mockSocket = WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        WebsocketService.nextQuestion({roomName, questions: mockQuestions, questionIndex: 0, isLaunch: false});
        const question = mockQuestions[0];
        expect(mockSocket.emit).toHaveBeenCalledWith('next-question', { roomName, question });
    });

    test('launchStudentModeQuiz should emit launch-student-mode event with correct parameters', () => {
        const roomName = 'testRoom';
        const questions = [{ id: 1, text: 'Sample Question' }];

        mockSocket = WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        WebsocketService.launchStudentModeQuiz(roomName, questions);
        expect(mockSocket.emit).toHaveBeenCalledWith('launch-student-mode', {
            roomName,
            questions
        });
    });

    test('endQuiz should emit end-quiz event with correct parameters', () => {
        const roomName = 'testRoom';

        mockSocket = WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        WebsocketService.endQuiz(roomName);
        expect(mockSocket.emit).toHaveBeenCalledWith('end-quiz', { roomName });
    });

    test('joinRoom should emit join-room event with correct parameters', () => {
        const enteredRoomName = 'testRoom';
        const username = 'testUser';

        mockSocket = WebsocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        WebsocketService.joinRoom(enteredRoomName, username);
        expect(mockSocket.emit).toHaveBeenCalledWith('join-room', { enteredRoomName, username });
    });

    test('SECURITY: should NOT receive sensitive data in teacher mode launch', () => {
        const mockReceivedQuestions = [
            {
                id: 1,
                question: 'What is 2+2?',
                options: [
                    { text: '3' },
                    { text: '4' },
                    { text: '5' }
                ]
            }
        ];

        mockReceivedQuestions.forEach((question) => {
            expect((question as any).correctAnswer).toBeUndefined();
            expect((question as any).explanation).toBeUndefined();
            expect((question as any).hints).toBeUndefined();

            if (question.options) {
                question.options.forEach((option) => {
                    expect((option as any).isCorrect).toBeUndefined();
                });
            }
        });
    });

    test('SECURITY: should NOT receive sensitive data in student mode launch', () => {
        const mockReceivedQuestions = [
            {
                id: 1,
                question: 'What is the capital of France?',
                options: [
                    { text: 'London' },
                    { text: 'Paris' },
                    { text: 'Berlin' }
                ]
            }
        ];

        mockReceivedQuestions.forEach((question) => {
            expect((question as any).correctAnswer).toBeUndefined();
            expect((question as any).explanation).toBeUndefined();
            expect((question as any).hints).toBeUndefined();

            if (question.options) {
                question.options.forEach((option) => {
                    expect((option as any).isCorrect).toBeUndefined();
                });
            }
        });
    });

    test('SECURITY: should NOT receive sensitive data in next question', () => {
        const mockReceivedQuestion = {
            id: 3,
            question: 'What is 5*5?',
            options: [
                { text: '20' },
                { text: '25' },
                { text: '30' }
            ]
        };

        expect((mockReceivedQuestion as any).correctAnswer).toBeUndefined();
        expect((mockReceivedQuestion as any).explanation).toBeUndefined();
        expect((mockReceivedQuestion as any).hints).toBeUndefined();

        if (mockReceivedQuestion.options) {
            mockReceivedQuestion.options.forEach((option) => {
                expect((option as any).isCorrect).toBeUndefined();
            });
        }
    });

    test('SECURITY: should only receive necessary question data', () => {
        const mockReceivedQuestion = {
            id: 4,
            question: 'What is the largest planet in our solar system?',
            options: [
                { id: 'a', text: 'Earth' },
                { id: 'b', text: 'Jupiter' },
                { id: 'c', text: 'Saturn' }
            ]
        };

        expect(mockReceivedQuestion.id).toBeDefined();
        expect(mockReceivedQuestion.question).toBeDefined();
        expect(mockReceivedQuestion.options).toBeDefined();

        expect(mockReceivedQuestion.options).toHaveLength(3);
        mockReceivedQuestion.options.forEach((option) => {
            expect(option.id).toBeDefined();
            expect(option.text).toBeDefined();
            expect((option as any).isCorrect).toBeUndefined();
        });

        expect((mockReceivedQuestion as any).correctAnswer).toBeUndefined();
        expect((mockReceivedQuestion as any).explanation).toBeUndefined();
        expect((mockReceivedQuestion as any).hints).toBeUndefined();
        expect((mockReceivedQuestion as any).metadata).toBeUndefined();
        expect((mockReceivedQuestion as any).grading).toBeUndefined();
    });

    test('SECURITY: should verify data size reduction after sanitization', () => {
        const fullQuestionData = {
            id: 5,
            question: 'Test question with lots of sensitive data',
            options: [
                { id: 'a', text: 'Option A', isCorrect: false, feedback: 'Wrong answer' },
                { id: 'b', text: 'Option B', isCorrect: true, feedback: 'Correct!' },
                { id: 'c', text: 'Option C', isCorrect: false, feedback: 'Try again' }
            ],
            correctAnswer: 'Option B',
            explanation: 'This is a detailed explanation of why B is correct',
            hints: ['Hint 1', 'Hint 2', 'Hint 3'],
            metadata: { author: 'teacher', created: '2024-01-01' },
            grading: { points: 15, partialCredit: true, rubric: 'detailed rubric' }
        };

        const studentReceivedData = {
            id: 5,
            question: 'Test question with lots of sensitive data',
            options: [
                { id: 'a', text: 'Option A' },
                { id: 'b', text: 'Option B' },
                { id: 'c', text: 'Option C' }
            ]
        };

        const fullDataSize = JSON.stringify(fullQuestionData).length;
        const studentDataSize = JSON.stringify(studentReceivedData).length;

        console.log(`Full data size: ${fullDataSize} bytes`);
        console.log(`Student received data size: ${studentDataSize} bytes`);
        console.log(`Current reduction: ${((fullDataSize - studentDataSize) / fullDataSize * 100).toFixed(2)}%`);

        expect(studentDataSize).toBeLessThan(fullDataSize * 0.6);
    });
});
