import { RoomParticipant } from './roomParticipant.js';

export class Watcher extends RoomParticipant {

    roomRessourcesData = [];
    checkRessourceInterval = null;

    constructor(username, roomName) {
        super(username, roomName);
    }

    connectToRoom(baseUrl) {
        return super.connectToRoom(baseUrl);
    }

    onConnected() {
        this.startCheckingResources();
    }

    checkRessource() {
        if (this.socket?.connected) {
            try {
                this.socket.emit("get-usage");
                this.socket.once("usage-data", (data) => {
                    //console.log(`Watcher ${this.username} received data:`, data);
                    this.roomRessourcesData.push({ timestamp: Date.now(), ...data });
                });
            } catch (error) {
                console.warn(`Error capturing metrics for room ${this.roomName}:`, error.message);
            }
        } else {
            console.warn(`Socket not connected for room ${this.roomName}`);
        }
    }

    startCheckingResources(intervalMs = 250) {
        if (this.checkRessourceInterval) {
            console.warn(`Resource checking is already running for room ${this.roomName}.`);
            return;
        }

        this.checkRessourceInterval = setInterval(() => this.checkRessource(), intervalMs);
    }

    stopCheckingResources() {
        if (this.checkRessourceInterval) {
            clearInterval(this.checkRessourceInterval);
            this.checkRessourceInterval = null;
        }
    }

    disconnect() {
        this.stopCheckingResources();
        super.disconnect();
    }
}
