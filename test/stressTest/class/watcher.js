import { RoomParticipant } from './roomParticipant.js';

export class Watcher extends RoomParticipant {

    roomRessourcesData = [];
    checkRessourceInterval = null;

    constructor(username, roomName) {
        super(username, roomName);
    }

    async connectToRoom(baseUrl) {
        await super.connectToRoom(baseUrl);
        this.startCheckingResources();
    }

    checkRessource() {
        if (this.socket?.connected) {
            try {
                this.socket.emit("get-usage");
                this.socket.once("usage-data", (data) => {
                    this.roomRessourcesData.push({ timestamp: Date.now(), ...data });
                });
            } catch (error) {
                console.warn(`Error capturing metrics for room ${this.roomName}:`, error.message);
            }
        } else {
            console.warn(`Socket not connected for room ${this.roomName}`);
        }
    }

    startCheckingResources(intervalMs = 500) {
        if (this.checkRessourceInterval) {
            console.warn(`Resource checking is already running for room ${this.roomName}.`);
            return;
        }

        this.checkRessourceInterval = setInterval(() => this.checkRessource(), intervalMs);
        console.log(`Started resource checking for room ${this.roomName}.`);
    }

    stopCheckingResources() {
        if (this.checkRessourceInterval) {
            clearInterval(this.checkRessourceInterval);
            this.checkRessourceInterval = null;
            console.log(`Stopped resource checking for room ${this.roomName}.`);
        }
    }

    disconnect() {
        this.stopCheckingResources();
        super.disconnect();
    }
}
