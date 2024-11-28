import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { Watcher } from './class/watcher.js';

const BASE_URL = 'http://localhost';
const user = { username: 'admin@example.com', password: 'adminPassword' };
const numberRooms = 10;
const usersPerRoom = 60;
const roomAssociations = {};
const maxMessages = 20;
const conversationInterval = 1000;
const batchSize = 20;
const batchDelay = 250;


/**
 * Creates a room and immediately connects a teacher to it.
 */
async function createRoomWithTeacher(token, index) {
    try {
        const room = await createRoomContainer(BASE_URL, token);
        if (!room?.id) {
            throw new Error('Room creation failed');
        }

        console.log(`Room ${index + 1} created with ID: ${room.id}`);

        // Initialize room associations
        roomAssociations[room.id] = { watcher: null, teacher: null, students: [] };

        // Create and connect teacher immediately
        const teacher = new Teacher(`teacher_${index}`, room.id);
        roomAssociations[room.id].teacher = teacher;

        // Connect teacher to room
        await teacher.connectToRoom(BASE_URL);
        console.log(`Teacher connected to room ${room.id}`);

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

    console.log(`Total rooms created and connected: ${successfulRooms}`);
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
        console.log('Adding users to room ' + roomId);
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

        // Collect remaining participants for this room
        const remainingParticipants = [
            participants.watcher,
            ...participants.students
        ].filter(Boolean);

        // Process participants in batches
        for (let i = 0; i < remainingParticipants.length; i += batchSize) {
            const batch = remainingParticipants.slice(i, i + batchSize);
            const batchPromises = batch.map(participant =>
                participant.connectToRoom(baseUrl)
                    .catch(err => {
                        console.warn(
                            `Failed to connect ${participant.username} in room ${roomId}:`,
                            err.message
                        );
                        return null;
                    })
            );

            await Promise.all(batchPromises);
            await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
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

async function main() {
    try {
        await createRoomContainers();
        addRemainingUsers();
        await connectRemainingParticipants(BASE_URL);
        await simulateParticipants();

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