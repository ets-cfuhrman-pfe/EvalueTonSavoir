import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';

const BASE_URL = 'http://localhost';
const user = { username: 'admin@example.com', password: 'adminPassword' };
const numberRooms = 5;
const studentPerRoom = 59; // Max is 60; 1 slot reserved for the teacher
const roomAssociations = {};
const allSockets = []; // Track all active WebSocket connections

async function createRoomContainers(token) {
    const roomCreationPromises = Array.from({ length: numberRooms }, async () => {
        const room = await createRoomContainer(BASE_URL, token);
        if (room?.id) {
            roomAssociations[room.id] = { teacher: null, students: [] };
            console.log(`Created room with ID: ${room.id}`);
        } else {
            console.warn('Failed to create a room.');
        }
    });

    await Promise.allSettled(roomCreationPromises);
    console.log(`Created ${Object.keys(roomAssociations).length} room containers.`);
}

async function addAndConnectTeachers() {
    const teacherCreationPromises = Object.keys(roomAssociations).map(async (roomId, index) => {
        const teacher = new Teacher(`teacher_${index}`, roomId);
        const socket = await teacher.connectToRoom(BASE_URL);

        if (socket.connected) {
            allSockets.push(socket); 
            roomAssociations[roomId].teacher = teacher;
            console.log(`Teacher ${teacher.username} connected to room ${roomId}.`);
        } else {
            console.warn(`Failed to connect teacher_${index} to room ${roomId}`);
        }
    });

    await Promise.allSettled(teacherCreationPromises);
    console.log('All teachers added and connected to their respective rooms.');
}

async function addAndConnectStudents() {
    const studentCreationPromises = Object.entries(roomAssociations).flatMap(([roomId, association], roomIndex) =>
        Array.from({ length: studentPerRoom }, async (_, i) => {
            const student = new Student(`student_${roomIndex}_${i}`, roomId);
            const socket = await student.connectToRoom(BASE_URL);

            if (socket.connected) {
                allSockets.push(socket); 
                association.students.push(student);
                console.log(`Student ${student.username} connected to room ${roomId}.`);
            } else {
                console.warn(`Failed to connect student_${roomIndex}_${i} to room ${roomId}`);
            }
        })
    );

    await Promise.allSettled(studentCreationPromises);
    console.log('All students added and connected to their respective rooms.');
}

function closeAllSockets() {
    console.log('Closing all Socket.IO connections...');
    allSockets.forEach((socket) => {
        if (socket && socket.connected) { 
            try {
                socket.disconnect(); 
                console.log('Disconnected Socket.IO connection.');
            } catch (error) {
                console.error('Error disconnecting Socket.IO socket:', error.message);
            }
        }
    });
    console.log('All Socket.IO connections disconnected.');
}

async function main() {
    try {
        const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
        if (!token) throw new Error('Failed to log in.');

        await createRoomContainers(token);  
        await addAndConnectTeachers();      
        await addAndConnectStudents();     

        console.log('All tasks completed.');
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

// Handle script termination and exit
process.on('SIGINT', () => {
    console.log('Script interrupted (Ctrl+C).');
    closeAllSockets();
    process.exit(0);
});

process.on('exit', closeAllSockets);

main();
