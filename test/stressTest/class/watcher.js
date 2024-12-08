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
                    const timestamp = Date.now();
                    // Store each container's metrics separately with timestamp
                    data.forEach(containerStat => {
                        const existingData = this.roomRessourcesData.find(d => d.containerId === containerStat.containerId);
                        if (existingData) {
                            existingData.metrics.push({
                                timestamp,
                                ...containerStat
                            });
                        } else {
                            this.roomRessourcesData.push({
                                containerId: containerStat.containerId,
                                containerName: containerStat.containerName,
                                metrics: [{
                                    timestamp,
                                    ...containerStat
                                }]
                            });
                        }
                    });
                });
            } catch (error) {
                console.warn(`Error capturing metrics for room ${this.roomName}:`, error.message);
            }
        }
    }

    startCheckingResources(intervalMs = 500) {
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
