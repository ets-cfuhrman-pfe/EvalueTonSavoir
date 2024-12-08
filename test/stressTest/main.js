import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { Watcher } from './class/watcher.js';
import { TestMetrics } from './class/metrics.js';
import dotenv from 'dotenv';
import generateMetricsReport from './utility/metrics_generator.js';

dotenv.config();

const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost',
    auth: {
        username: process.env.USER_EMAIL || 'admin@admin.com',
        password: process.env.USER_PASSWORD || 'admin'
    },
    rooms: {
        count: parseInt(process.env.NUMBER_ROOMS || '15'),
        usersPerRoom: parseInt(process.env.USERS_PER_ROOM || '60'),
        batchSize: parseInt(process.env.BATCH_SIZE || 5),
        batchDelay: parseInt(process.env.BATCH_DELAY || 250)
    },
    simulation: {
        maxMessages: parseInt(process.env.MAX_MESSAGES_ROUND || '20'),
        messageInterval: parseInt(process.env.CONVERSATION_INTERVAL || '1000'),
        responseTimeout: parseInt(process.env.MESSAGE_RESPONSE_TIMEOUT || 5000)
    }
};

const rooms = new Map();
const metrics = new TestMetrics();

// Changes to setupRoom function
async function setupRoom(token, index) {
    try {
        const room = await createRoomContainer(config.baseUrl, token);
        if (!room?.id) throw new Error('Room creation failed');
        metrics.roomsCreated++;

        const teacher = new Teacher(`teacher_${index}`, room.id);
        // Only create watcher for first room (index 0)
        const watcher = index === 0 ? new Watcher(`watcher_${index}`, room.id) : null;

        await Promise.all([
            teacher.connectToRoom(config.baseUrl)
                .then(() => metrics.usersConnected++)
                .catch(err => {
                    metrics.userConnectionsFailed++;
                    metrics.logError('teacherConnection', err);
                    console.warn(`Teacher ${index} connection failed:`, err.message);
                }),
            // Only connect watcher if it exists
            ...(watcher ? [
                watcher.connectToRoom(config.baseUrl)
                    .then(() => metrics.usersConnected++)
                    .catch(err => {
                        metrics.userConnectionsFailed++;
                        metrics.logError('watcherConnection', err);
                        console.warn(`Watcher ${index} connection failed:`, err.message);
                    })
            ] : [])
        ]);

        // Adjust number of students based on whether room has a watcher
        const studentCount = watcher ?
            config.rooms.usersPerRoom - 2 : // Room with watcher: subtract teacher and watcher
            config.rooms.usersPerRoom - 1;  // Rooms without watcher: subtract only teacher

        const students = Array.from({ length: studentCount },
            (_, i) => new Student(`student_${index}_${i}`, room.id));

        rooms.set(room.id, { teacher, watcher, students });
        return room.id;
    } catch (err) {
        metrics.roomsFailed++;
        metrics.logError('roomSetup', err);
        console.warn(`Room ${index} setup failed:`, err.message);
        return null;
    }
}

async function connectParticipants(roomId) {
    const { students } = rooms.get(roomId);
    const participants = [...students];

    for (let i = 0; i < participants.length; i += config.rooms.batchSize) {
        const batch = participants.slice(i, i + config.rooms.batchSize);
        await Promise.all(batch.map(p =>
            Promise.race([
                p.connectToRoom(config.baseUrl).then(() => {
                    metrics.usersConnected++;
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]).catch(err => {
                metrics.userConnectionsFailed++;
                metrics.logError('studentConnection', err);
                console.warn(`Connection failed for ${p.username}:`, err.message);
            })
        ));
        await new Promise(resolve => setTimeout(resolve, config.rooms.batchDelay));
    }
}

async function simulate() {
    const simulations = Array.from(rooms.entries()).map(async ([roomId, { teacher, students }]) => {
        const connectedStudents = students.filter(student => student.socket?.connected);
        const expectedResponses = connectedStudents.length;

        for (let i = 0; i < config.simulation.maxMessages; i++) {
            metrics.messagesAttempted++;
            const initialMessages = teacher.nbrMessageReceived;

            try {
                teacher.broadcastMessage(`Message ${i + 1} from ${teacher.username}`);
                metrics.messagesSent++;

                await Promise.race([
                    new Promise(resolve => {
                        const checkResponses = setInterval(() => {
                            const receivedResponses = teacher.nbrMessageReceived - initialMessages;
                            if (receivedResponses >= expectedResponses) {
                                metrics.messagesReceived += receivedResponses;
                                clearInterval(checkResponses);
                                resolve();
                            }
                        }, 100);
                    }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Response timeout')), config.simulation.responseTimeout)
                    )
                ]);
            } catch (error) {
                metrics.logError('messaging', error);
                console.error(`Error in room ${roomId} message ${i + 1}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, config.simulation.messageInterval));
        }
    });

    await Promise.all(simulations);
    console.log('All room simulations completed');
}

async function generateReport() {
    const watcherRoom = Array.from(rooms.entries()).find(([_, room]) => room.watcher);
    if (!watcherRoom) {
        throw new Error('No watcher found in any room');
    }
    const data = {
        [watcherRoom[0]]: watcherRoom[1].watcher.roomRessourcesData
    };
    return generateMetricsReport(data, metrics);
}

function cleanup() {
    for (const { teacher, watcher, students } of rooms.values()) {
        [teacher, watcher, ...students].forEach(p => p?.disconnect());
    }
}

async function main() {
    try {
        const token = await attemptLoginOrRegister(config.baseUrl, config.auth.username, config.auth.password);
        if (!token) throw new Error('Authentication failed');

        console.log('Creating rooms...');
        const roomIds = await Promise.all(
            Array.from({ length: config.rooms.count }, (_, i) => setupRoom(token, i))
        );

        console.log('Connecting participants...');
        await Promise.all(roomIds.filter(Boolean).map(connectParticipants));

        console.log('Retrieving baseline metrics...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('Starting simulation across all rooms...');
        await simulate();

        console.log('Simulation complete. Waiting for system stabilization...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('Generating final report...');
        const folderName = await generateReport();
        console.log(`Metrics report generated in ${folderName.outputDir}`);

        console.log('All done!');
    } catch (error) {
        metrics.logError('main', error);
        console.error('Error:', error.message);
    } finally {
        cleanup();
    }
}

['SIGINT', 'exit', 'uncaughtException', 'unhandledRejection'].forEach(event => {
    process.on(event, cleanup);
});

main();