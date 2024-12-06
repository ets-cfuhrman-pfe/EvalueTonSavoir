import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { Watcher } from './class/watcher.js';
import dotenv from 'dotenv';
import generateMetricsReport from './utility/metrics_generator.js';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost';
const user = {
    username: process.env.USER_EMAIL || 'admin@admin.com',
    password: process.env.USER_PASSWORD || 'admin'
};
const numberRooms = parseInt(process.env.NUMBER_ROOMS || '4');
const usersPerRoom = parseInt(process.env.USERS_PER_ROOM || '60');
const roomAssociations = {};
const maxMessages = parseInt(process.env.MAX_MESSAGES || '20');
const conversationInterval = parseInt(process.env.CONVERSATION_INTERVAL || '1000');
const batchSize = 5;
const batchDelay = 250;
const roomDelay = 500;

/**
 * Creates a room and immediately connects a teacher to it.
 */
async function createRoomWithTeacher(token, index) {
    try {
        const room = await createRoomContainer(BASE_URL, token);
        if (!room?.id) {
            throw new Error('Room creation failed');
        }

        // Initialize room associations
        roomAssociations[room.id] = { watcher: null, teacher: null, students: [] };

        // Create and connect teacher immediately
        const teacher = new Teacher(`teacher_${index}`, room.id);
        roomAssociations[room.id].teacher = teacher;

        // Connect teacher to room
        await teacher.connectToRoom(BASE_URL);

        return room.id;
    } catch (err) {
        console.warn(`Failed to create/connect room ${index + 1}:`, err.message);
        return null;
    }
}

/**
 * Creates rooms and connects teachers with controlled concurrency.
 */
async function createRoomContainers() {
    console.log('Attempting login or register to get token');
    const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
    if (!token) throw new Error('Failed to login or register.');

    console.log('Room creation with immediate teacher connection');
    const roomPromises = Array.from({ length: numberRooms }, (_, index) =>
        createRoomWithTeacher(token, index)
    );

    const results = await Promise.allSettled(roomPromises);
    const successfulRooms = results.filter(r => r.status === 'fulfilled' && r.value).length;

    console.log(`Total rooms created and connected (${numberRooms}): ${successfulRooms}`);
    console.log('Finished room creation and teacher connection');
}

/**
 * Adds remaining participants (watcher, students) to rooms.
 */
function addRemainingUsers() {
    console.log('Adding remaining room participants');
    Object.keys(roomAssociations).forEach((roomId, roomIndex) => {
        const participants = roomAssociations[roomId];

        // Add watcher
        participants.watcher = new Watcher(`watcher_${roomIndex}`, roomId);

        // Add students
        for (let i = 0; i < usersPerRoom - 2; i++) {
            participants.students.push(new Student(`student_${roomIndex}_${i}`, roomId));
        }
    });
    console.log('Finished adding remaining room participants');
}

/**
 * Connects remaining participants to their respective rooms.
 */
async function connectRemainingParticipants(baseUrl) {
    console.log('Connecting remaining participants in batches');

    for (const [roomId, participants] of Object.entries(roomAssociations)) {
        console.log(`Processing room ${roomId}`);

        const remainingParticipants = [
            participants.watcher,
            ...participants.students
        ].filter(Boolean);

        // Connect in smaller batches with longer delays
        for (let i = 0; i < remainingParticipants.length; i += batchSize) {
            const batch = remainingParticipants.slice(i, i + batchSize);

            // Add connection timeout handling
            const batchPromises = batch.map(participant =>
                Promise.race([
                    participant.connectToRoom(baseUrl),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Connection timeout')), 10000)
                    )
                ]).catch(err => {
                    console.warn(
                        `Failed to connect ${participant.username} in room ${roomId}:`,
                        err.message
                    );
                    return null;
                })
            );

            await Promise.all(batchPromises);

            // Cleanup disconnected sockets
            batch.forEach(participant => {
                if (!participant.socket?.connected) {
                    participant.disconnect();
                }
            });

            await new Promise(resolve => setTimeout(resolve, batchDelay));
        }

        // Add delay between rooms
        await new Promise(resolve => setTimeout(resolve, roomDelay));
    }

    console.log('Finished connecting remaining participants');
}

// Rest of the code remains the same
async function simulateParticipants() {
    const conversationPromises = Object.entries(roomAssociations).map(async ([roomId, participants]) => {
        const { teacher, students } = participants;

        if (!teacher || students.length === 0) {
            console.warn(`Room ${roomId} has no teacher or students to simulate.`);
            return;
        }

        console.log(`Starting simulation for room ${roomId}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        for (let i = 0; i < maxMessages; i++) {
            const teacherMessage = `Message ${i + 1} from ${teacher.username}`;
            teacher.broadcastMessage(teacherMessage);
            await new Promise(resolve => setTimeout(resolve, conversationInterval));
        }

        console.log(`Finished simulation for room ${roomId}`);
    });

    await Promise.all(conversationPromises);
}

function disconnectParticipants() {
    console.time('Disconnecting participants');
    Object.values(roomAssociations).forEach(participants => {
        participants.teacher?.disconnect();
        participants.watcher?.disconnect();
        participants.students.forEach(student => student.disconnect());
    });
    console.timeEnd('Disconnecting participants');
    console.log('All participants disconnected successfully.');
}

async function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateExecutionData() {
    console.log('Generating execution data');

    const allRoomsData = {};
    for (const [roomId, participants] of Object.entries(roomAssociations)) {
        if (participants.watcher?.roomRessourcesData.length > 0) {
            // Add phase markers to the data
            const data = participants.watcher.roomRessourcesData;
            const simulationStartIdx = 20; // Assuming first 20 samples are baseline
            const simulationEndIdx = data.length - 20; // Last 20 samples are post-simulation

            data.forEach((sample, index) => {
                if (index < simulationStartIdx) {
                    sample.phase = 'baseline';
                } else if (index > simulationEndIdx) {
                    sample.phase = 'post-simulation';
                } else {
                    sample.phase = 'simulation';
                }
            });

            allRoomsData[roomId] = data;
        }
    }

    const result = await generateMetricsReport(allRoomsData);
    console.log(`Generated metrics in ${result.outputDir}`);

    console.log('Finished generating execution data');
}

async function main() {
    try {
        await createRoomContainers();
        addRemainingUsers();
        await connectRemainingParticipants(BASE_URL);

        // Wait for initial baseline metrics
        console.log('Collecting baseline metrics...');
        await wait(5000);

        await simulateParticipants();

        console.log('Waiting for system to stabilize...');
        await wait(5000); // 5 second delay
        
        await generateExecutionData();
        console.log('All tasks completed successfully!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Graceful shutdown handlers
process.on('SIGINT', () => {
    console.log('Process interrupted (Ctrl+C).');
    disconnectParticipants();
    process.exit(0);
});

process.on('exit', disconnectParticipants);

process.on('uncaughtException', err => {
    console.error('Uncaught Exception:', err);
    disconnectParticipants();
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    disconnectParticipants();
    process.exit(1);
});

main();