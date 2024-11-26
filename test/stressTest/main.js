import { attemptLoginOrRegister, createRoomContainer, captureResourceUsageForContainers } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { writeMetricsToFile, generateGraphs } from './utility/writeMetrics.js';

const BASE_URL = 'http://localhost';
const user = { username: 'admin@example.com', password: 'adminPassword' };
const numberRooms = 20;
const studentPerRoom = 58; // Max: 60, 1 reserved for teacher
const roomAssociations = {};
const allSockets = []; // Tracks all active WebSocket connections

const metrics = {
    roomsCreated: 0,
    roomsFailed: 0,
    teachersConnected: 0,
    teachersFailed: 0,
    studentsConnected: 0,
    studentsFailed: 0,
    messagesSent: 0,
    messagesReceived: 0,
    totalLatency: 0,
    maxLatency: 0,
    minLatency: Number.MAX_SAFE_INTEGER,
    throughput: 0,
    startTime: null,
    endTime: null,
};

// Creates rooms and tracks their creation
async function createRoomContainers(token) {
    console.time('Room creation time');
    const roomCreationPromises = Array.from({ length: numberRooms }, async () => {
        try {
            const room = await createRoomContainer(BASE_URL, token);
            if (room?.id) {
                roomAssociations[room.id] = { teacher: null, students: [] };
                metrics.roomsCreated++;
                console.log(`Room created with ID: ${room.id}`);
            }
        } catch {
            metrics.roomsFailed++;
            console.warn('Failed to create a room.');
        }
    });

    await Promise.allSettled(roomCreationPromises);
    console.timeEnd('Room creation time');
    console.log(`Total rooms created: ${Object.keys(roomAssociations).length}`);
}

// Connects teachers to their respective rooms
async function addAndConnectTeachers() {
    console.time('Teacher connection time');
    const teacherPromises = Object.keys(roomAssociations).map(async (roomId, index) => {
        const teacher = new Teacher(`teacher_${index}`, roomId);
        const start = Date.now();
        const socket = await teacher.connectToRoom(BASE_URL);
        const latency = Date.now() - start;

        metrics.totalLatency += latency;
        metrics.maxLatency = Math.max(metrics.maxLatency, latency);
        metrics.minLatency = Math.min(metrics.minLatency, latency);

        if (socket.connected) {
            allSockets.push(socket);
            roomAssociations[roomId].teacher = teacher;
            metrics.teachersConnected++;
            console.log(`Teacher ${teacher.username} connected to room ${roomId}. Latency: ${latency}ms`);
        } else {
            metrics.teachersFailed++;
            console.warn(`Failed to connect teacher ${index} to room ${roomId}`);
        }
    });

    await Promise.allSettled(teacherPromises);
    console.timeEnd('Teacher connection time');
    console.log('All teachers connected to their respective rooms.');
}

// Connects students to their respective rooms
async function addAndConnectStudents() {
    console.time('Student connection time');
    const studentPromises = Object.entries(roomAssociations).flatMap(([roomId, association], roomIndex) =>
        Array.from({ length: studentPerRoom }, async (_, i) => {
            const student = new Student(`student_${roomIndex}_${i}`, roomId);
            const start = Date.now();
            const socket = await student.connectToRoom(BASE_URL);
            const latency = Date.now() - start;

            metrics.totalLatency += latency;
            metrics.maxLatency = Math.max(metrics.maxLatency, latency);
            metrics.minLatency = Math.min(metrics.minLatency, latency);

            if (socket.connected) {
                allSockets.push(socket);
                association.students.push(student);
                metrics.studentsConnected++;
            } else {
                metrics.studentsFailed++;
                console.warn(`Failed to connect student ${roomIndex}_${i} to room ${roomId}`);
            }
        })
    );

    await Promise.allSettled(studentPromises);
    console.timeEnd('Student connection time');
    console.log('All students connected to their respective rooms.');
}

// Simulates conversations in all rooms
async function simulateConversation() {
    console.log("Conversation simulation started...");
    const messages = [
        "Bonjour, tout le monde !",
        "Pouvez-vous répondre à la question 1 ?",
        "J'ai une question sur l'exercice.",
        "Voici la réponse à la question 1.",
        "Merci pour vos réponses, continuons avec la question 2.",
        "Je ne comprends pas bien, pouvez-vous expliquer à nouveau ?",
    ];

    const interval = 1000;
    const duration = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
        for (const [roomId, association] of Object.entries(roomAssociations)) {
            if (association.teacher) {
                const teacherMessage = `Teacher says: ${messages[Math.floor(Math.random() * messages.length)]}`;
                association.teacher.sendMessage(teacherMessage);
                metrics.messagesSent++;
            }

            for (const student of association.students) {
                const studentMessage = `${student.username} says: ${messages[Math.floor(Math.random() * messages.length)]}`;
                student.sendMessage(studentMessage);
                metrics.messagesSent++;
            }
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    console.log("Conversation simulation ended.");
}

// Closes all active WebSocket connections
function closeAllSockets() {
    console.log('Closing all Socket.IO connections...');
    allSockets.forEach((socket) => {
        if (socket && socket.connected) {
            try {
                socket.disconnect();
                console.log('Socket.IO connection disconnected.');
            } catch (error) {
                console.error('Error disconnecting Socket.IO connection:', error.message);
            }
        }
    });
    console.log('All Socket.IO connections have been disconnected.');
}

// Main function to orchestrate the workflow
async function main() {
    try {
        metrics.startTime = new Date();

        // Login or register
        const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
        if (!token) throw new Error('Failed to login or register.');

        // Room creation
        await createRoomContainers(token);

        // Resource monitoring and test activities
        const roomIds = Object.keys(roomAssociations);
        const usageCaptureInterval = 100;
        let testCompleted = false;

        const resourceCapturePromise = captureResourceUsageForContainers(
            BASE_URL,
            roomIds,
            usageCaptureInterval,
            () => testCompleted,
            metrics
        );

        const testPromise = (async () => {
            await addAndConnectTeachers();
            await addAndConnectStudents();
            await simulateConversation();
            testCompleted = true;
            await new Promise((resolve) => setTimeout(resolve, 5000));
        })();

        await Promise.all([resourceCapturePromise, testPromise]);

        metrics.endTime = new Date();
        writeMetricsToFile(metrics);
        await generateGraphs(metrics.resourceUsage, metrics);

        console.log("All tasks completed successfully!");
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Handle process interruptions
process.on('SIGINT', () => {
    console.log('Process interrupted (Ctrl+C).');
    closeAllSockets();
    process.exit(0);
});

process.on('exit', () => closeAllSockets());
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    closeAllSockets();
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', promise, 'reason:', reason);
    closeAllSockets();
    process.exit(1);
});

main();
