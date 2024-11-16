import { attemptLoginOrRegister, createRoomContainer } from './utility/apiServices.js';
import { Student } from './class/student.js';
import { Teacher } from './class/teacher.js';

const BASE_URL = 'http://localhost';
const user = { username: 'admin@example.com', password: 'adminPassword' };
const numberRooms = 5;
const studentPerRoom = 59; // Max : 60, 1 place réservée pour le professeur
const roomAssociations = {};
const allSockets = []; // Suivi de toutes les connexions WebSocket actives

// Métriques
const metrics = {
    roomsCreated: 0,
    roomsFailed: 0,
    teachersConnected: 0,
    teachersFailed: 0,
    studentsConnected: 0,
    studentsFailed: 0,
    startTime: null,
    endTime: null,
};

async function createRoomContainers(token) {
    console.time('Temps de création des salles');
    const roomCreationPromises = Array.from({ length: numberRooms }, async () => {
        const room = await createRoomContainer(BASE_URL, token);
        if (room?.id) {
            roomAssociations[room.id] = { teacher: null, students: [] };
            metrics.roomsCreated++;
            console.log(`Salle créée avec l'ID : ${room.id}`);
        } else {
            metrics.roomsFailed++;
            console.warn('Échec de la création d’une salle.');
        }
    });

    await Promise.allSettled(roomCreationPromises);
    console.timeEnd('Temps de création des salles');
    console.log(`Nombre total de salles créées : ${Object.keys(roomAssociations).length}`);
}

async function addAndConnectTeachers() {
    console.time('Temps de connexion des enseignants');
    const teacherCreationPromises = Object.keys(roomAssociations).map(async (roomId, index) => {
        const teacher = new Teacher(`teacher_${index}`, roomId);
        const start = Date.now();
        const socket = await teacher.connectToRoom(BASE_URL);
        const latency = Date.now() - start;

        if (socket.connected) {
            allSockets.push(socket);
            roomAssociations[roomId].teacher = teacher;
            metrics.teachersConnected++;
            console.log(`Enseignant ${teacher.username} connecté à la salle ${roomId}. Latence : ${latency}ms`);
        } else {
            metrics.teachersFailed++;
            console.warn(`Échec de la connexion de l'enseignant ${index} à la salle ${roomId}`);
        }
    });

    await Promise.allSettled(teacherCreationPromises);
    console.timeEnd('Temps de connexion des enseignants');
    console.log('Tous les enseignants ont été ajoutés et connectés à leurs salles respectives.');
}

async function addAndConnectStudents() {
    console.time('Temps de connexion des étudiants');
    const studentCreationPromises = Object.entries(roomAssociations).flatMap(([roomId, association], roomIndex) =>
        Array.from({ length: studentPerRoom }, async (_, i) => {
            const student = new Student(`student_${roomIndex}_${i}`, roomId);
            const start = Date.now();
            const socket = await student.connectToRoom(BASE_URL);
            const latency = Date.now() - start;

            if (socket.connected) {
                allSockets.push(socket);
                association.students.push(student);
                metrics.studentsConnected++;
                console.log(`Étudiant ${student.username} connecté à la salle ${roomId}. Latence : ${latency}ms`);
            } else {
                metrics.studentsFailed++;
                console.warn(`Échec de la connexion de l'étudiant ${roomIndex}_${i} à la salle ${roomId}`);
            }
        })
    );

    await Promise.allSettled(studentCreationPromises);
    console.timeEnd('Temps de connexion des étudiants');
    console.log('Tous les étudiants ont été ajoutés et connectés à leurs salles respectives.');
}

function closeAllSockets() {
    console.log('Fermeture de toutes les connexions Socket.IO...');
    allSockets.forEach((socket) => {
        if (socket && socket.connected) {
            try {
                socket.disconnect();
                console.log('Connexion Socket.IO déconnectée.');
            } catch (error) {
                console.error('Erreur lors de la déconnexion du socket Socket.IO :', error.message);
            }
        }
    });
    console.log('Toutes les connexions Socket.IO ont été déconnectées.');
}

function generateReport(){
    console.log('Toutes les tâches ont été terminées.');
        console.log('--- Résultats du test de charge ---');
        console.log(`Salles créées : ${metrics.roomsCreated}`);
        console.log(`Échecs de création de salles : ${metrics.roomsFailed}`);
        console.log(`Enseignants connectés : ${metrics.teachersConnected}`);
        console.log(`Échecs de connexion des enseignants : ${metrics.teachersFailed}`);
        console.log(`Étudiants connectés : ${metrics.studentsConnected}`);
        console.log(`Échecs de connexion des étudiants : ${metrics.studentsFailed}`);
        console.log(`Durée totale d'exécution : ${(metrics.endTime - metrics.startTime) / 1000}s`);
        console.log('Utilisation de la mémoire :', process.memoryUsage());
}

async function main() {
    try {
        metrics.startTime = new Date();
        const token = await attemptLoginOrRegister(BASE_URL, user.username, user.password);
        if (!token) throw new Error('Échec de la connexion.');

        await createRoomContainers(token);
        await addAndConnectTeachers();
        await addAndConnectStudents();

        metrics.endTime = new Date();
        
        generateReport();
    } catch (error) {
        console.error('Une erreur est survenue :', error.message);
    }
}

// Gestion de l'interruption et de la fermeture
process.on('SIGINT', () => {
    console.log('Script interrompu (Ctrl+C).');
    closeAllSockets();
    process.exit(0);
});

process.on('exit', closeAllSockets);

main();
