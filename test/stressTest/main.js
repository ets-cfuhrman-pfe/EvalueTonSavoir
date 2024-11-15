import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';

const BASE_URL = 'http://localhost';
const user = {
    username: 'admin@example.com',
    password: 'adminPassword',
};

const numberRooms = 30;
const studentPerRoom = 59; // Max is 60; 1 slot is reserved for the teacher

const roomAssociations = {};
const allSockets = []; // Track all active WebSocket connections

async function createRoomsAndTeachers(token) {
    const roomCreationPromises = [];
    const teachers = [];

    for (let index = 0; index < numberRooms; index++) {
        roomCreationPromises.push(
            createRoomContainer(BASE_URL, token).then((room) => {
                if (room?.id) {
                    const teacher = new Teacher(`teacher_${index}`, room.id);
                    teachers.push(teacher);

                    roomAssociations[room.id] = {
                        teacher,
                        students: [],
                    };

                    // Track teacher WebSocket for cleanup
                    if (teacher.socket) {
                        allSockets.push(teacher.socket);
                    }
                }
            })
        );
    }

    await Promise.allSettled(roomCreationPromises);
    console.log(`Created ${Object.keys(roomAssociations).length} rooms with associated teachers.`);
    return teachers;
}

async function connectTeachersToRooms(teachers) {
    const teacherConnectionPromises = teachers.map(async (teacher) => {
        await teacher.connectToRoom(BASE_URL);
        if (teacher.socket) {
            allSockets.push(teacher.socket); // Track WebSocket
        }
    });

    await Promise.allSettled(teacherConnectionPromises);
    console.log('All teachers connected to their rooms.');
}

async function addAndConnectStudents() {
    const studentCreationPromises = [];

    Object.entries(roomAssociations).forEach(([roomId, association], roomIndex) => {
        for (let i = 0; i < studentPerRoom; i++) {
            const student = new Student(`student_${roomIndex}_${i}`, roomId);
            association.students.push(student);

            studentCreationPromises.push(
                student.connectToRoom(BASE_URL).then(() => {
                    if (student.socket) {
                        allSockets.push(student.socket); // Track WebSocket
                    }
                })
            );
        }
    });

    await Promise.allSettled(studentCreationPromises);
    console.log('All students connected to their respective rooms.');
}

function closeAllSockets() {
    console.log('Closing all WebSocket connections...');
    allSockets.forEach((socket) => {
        try {
            if (socket.readyState === socket.OPEN) {
                socket.close(); // Gracefully close the WebSocket
                console.log('Closed WebSocket connection.');
            }
        } catch (error) {
            console.error('Error closing WebSocket:', error.message);
        }
    });
    console.log('All WebSocket connections closed.');
}

async function main() {
    try {
        const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
        if (!token) {
            console.error('Failed to log in. Exiting...');
            return;
        }

        const teachers = await createRoomsAndTeachers(token);
        await connectTeachersToRooms(teachers);
        await addAndConnectStudents();

        console.log('All tasks completed.');
    } catch (error) {
        console.error('An error occurred:', error.message);
    } finally {
        closeAllSockets();
    }
}

// Handle script termination (Ctrl+C)
process.on('SIGINT', () => {
    console.log('Script interrupted (Ctrl+C).');
    closeAllSockets();
    process.exit(0); // Exit cleanly
});

// Handle script exit
process.on('exit', () => {
    closeAllSockets();
});

main();
