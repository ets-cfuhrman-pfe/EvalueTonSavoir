import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';
import { Watcher } from './class/watcher.js';
import dotenv from 'dotenv';
import generateMetricsReport from './utility/metrics_generator.js';

dotenv.config();

const config = {
    baseUrl: process.env.BASE_URL || 'http://msevignyl.duckdns.org',
    auth: {
        username: process.env.USER_EMAIL || 'admin@admin.com',
        password: process.env.USER_PASSWORD || 'admin'
    },
    rooms: {
        count: parseInt(process.env.NUMBER_ROOMS || '5'),
        usersPerRoom: parseInt(process.env.USERS_PER_ROOM || '60'),
        batchSize: 5,
        batchDelay: 250
    },
    simulation: {
        maxMessages: parseInt(process.env.MAX_MESSAGES || '20'),
        messageInterval: parseInt(process.env.CONVERSATION_INTERVAL || '1000'),
        responseTimeout: 5000
    }
};

const rooms = new Map();

async function setupRoom(token, index) {
    try {
        const room = await createRoomContainer(config.baseUrl, token);
        if (!room?.id) throw new Error('Room creation failed');

        const teacher = new Teacher(`teacher_${index}`, room.id);
        const watcher = new Watcher(`watcher_${index}`, room.id);
        await Promise.all([
            teacher.connectToRoom(config.baseUrl)
                .catch(err => console.warn(`Teacher ${index} connection failed:`, err.message)),
            watcher.connectToRoom(config.baseUrl)
                .catch(err => console.warn(`Watcher ${index} connection failed:`, err.message))
        ]);

        const students = Array.from({ length: config.rooms.usersPerRoom - 2 },
            (_, i) => new Student(`student_${index}_${i}`, room.id));

        rooms.set(room.id, { teacher, watcher, students });
        return room.id;
    } catch (err) {
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
                p.connectToRoom(config.baseUrl),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
            ]).catch(err => console.warn(`Connection failed for ${p.username}:`, err.message))
        ));
        await new Promise(resolve => setTimeout(resolve, config.rooms.batchDelay));
    }
}

async function simulate() {
    const simulations = Array.from(rooms.entries()).map(async ([roomId, { teacher, students }]) => {
        const connectedStudents = students.filter(student => student.socket?.connected);
        const expectedResponses = connectedStudents.length;

        for (let i = 0; i < config.simulation.maxMessages; i++) {
            const initialMessages = teacher.nbrMessageReceived;

            teacher.broadcastMessage(`Message ${i + 1} from ${teacher.username}`);

            try {
                await Promise.race([
                    new Promise(resolve => {
                        const checkResponses = setInterval(() => {
                            const receivedResponses = teacher.nbrMessageReceived - initialMessages;
                            if (receivedResponses >= expectedResponses) {
                                clearInterval(checkResponses);
                                resolve();
                            }
                        }, 100);
                    })
                ]);
            } catch (error) {
                console.error(`Error in room ${roomId} message ${i + 1}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, config.simulation.messageInterval));
        }
    });

    // Wait for all simulations to complete
    await Promise.all(simulations);
    console.log('All room simulations completed');
}

async function generateReport() {
    const data = Object.fromEntries(
        Array.from(rooms.entries()).map(([id, { watcher }]) => [
            id,
            watcher.roomRessourcesData
        ])
    );
    return generateMetricsReport(data);
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
        await new Promise(resolve => setTimeout(resolve, 10000)); // Baseline metrics

        console.log('Starting simulation across all rooms...');
        await simulate();

        console.log('Simulation complete. Waiting for system stabilization...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // System stabilization

        console.log('All simulations finished, generating final report...');
        const folderName = await generateReport();
        console.log(`Metrics report generated in ${folderName.outputDir}`);

        console.log('All done!');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        cleanup();
    }
}

['SIGINT', 'exit', 'uncaughtException', 'unhandledRejection'].forEach(event => {
    process.on(event, cleanup);
});

main();