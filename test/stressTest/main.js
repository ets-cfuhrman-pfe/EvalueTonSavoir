import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { Watcher } from './class/watcher.js';

const BASE_URL = 'http://localhost';
const user = { username: 'admin@example.com', password: 'adminPassword' };
const numberRooms = 20;
const usersPerRoom = 60;
const roomAssociations = {};
const maxMessages = 20; // Number of conversation rounds
const conversationInterval = 1000; // Interval between teacher messages (ms)
const batchSize = 10;       // Number of simultaneous connections
const batchDelay = 500; 

/**
 * Creates rooms with controlled concurrency.
 */
async function createRoomContainers() {
    console.log('Attempting login or register to get token');
    const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
    if (!token) throw new Error('Failed to login or register.');

    console.log('Room creation');
    const roomPromises = Array.from({ length: numberRooms }, async (_, index) => {
        try {
            const room = await createRoomContainer(BASE_URL, token);
            if (room?.id) {
                roomAssociations[room.id] = { watcher: null, teacher: null, students: [] };
                console.log(`Room ${index + 1} created with ID: ${room.id}`);
            }
        } catch (err) {
            console.warn(`Failed to create room ${index + 1}:`, err.message);
        }
    });

    // Use Promise.allSettled to ensure all promises complete
    await Promise.allSettled(roomPromises);

    console.log(`Total rooms created: ${Object.keys(roomAssociations).length}`);
    console.log('Finished room creation');
}

/**
 * Adds participants (teacher, watcher, students) to rooms.
 */
function addUsersToRoom() {
    console.log('Adding room participants');
    Object.keys(roomAssociations).forEach((roomId, roomIndex) => {
        const participants = roomAssociations[roomId];

        // Assign a teacher and watcher
        console.log('adding users to room ' + roomId);
        participants.teacher = new Teacher(`teacher_${roomIndex}`, roomId);
        participants.watcher = new Watcher(`watcher_${roomIndex}`, roomId);

        // Add students
        for (let i = 0; i < usersPerRoom - 2; i++) {
            participants.students.push(new Student(`student_${roomIndex}_${i}`, roomId));
        }
    });
    console.log('Finished adding room participants');
}

/**
 * Connects participants to their respective rooms.
 */
async function connectParticipants(baseUrl) {
    console.log('Connecting participants in batches');
    const batchSize = 10; // Connect 10 participants at a time
    const batchDelay = 500; // Wait 500ms between batches

    for (const [roomId, participants] of Object.entries(roomAssociations)) {
        console.log(`Processing room ${roomId}`);
        
        // Collect all participants for this room
        const allParticipants = [
            participants.teacher,
            participants.watcher,
            ...participants.students
        ].filter(Boolean);

        // Process participants in batches
        for (let i = 0; i < allParticipants.length; i += batchSize) {
            const batch = allParticipants.slice(i, i + batchSize);
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
    
    console.log('Finished connecting participants');
}

/**
 * Simulates a conversation between the teacher and students in each room.
 */
async function simulateParticipants() {
    const conversationPromises = Object.entries(roomAssociations).map(async ([roomId, participants]) => {
        const { teacher, students } = participants;

        if (!teacher || students.length === 0) {
            console.warn(`Room ${roomId} has no teacher or students to simulate.`);
            return;
        }

        console.log(`Starting simulation for room ${roomId}`);

        // Wait for room creation and joins to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        for (let i = 0; i < maxMessages; i++) {
            const teacherMessage = `Message ${i + 1} from ${teacher.username}`;
            teacher.broadcastMessage(teacherMessage);
            // Add delay between messages
            await new Promise(resolve => setTimeout(resolve, conversationInterval));
        }

        console.log(`Finished simulation for room ${roomId}`);
    });

    await Promise.all(conversationPromises);
}

/**
 * Disconnects all participants from rooms.
 */
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

/**
 * Main orchestration function.
 */
async function main() {
    try {
        await createRoomContainers();
        addUsersToRoom();
        await connectParticipants(BASE_URL);
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

// Execute the main function
main();
