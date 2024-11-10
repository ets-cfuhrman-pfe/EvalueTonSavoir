
const BaseRoomProvider = require('../roomsProviders/base-provider.js');
//const ClusterRoomProvider = require('../roomsProviders/cluster-provider.js');
const DockerRoomProvider = require('../roomsProviders/docker-provider.js');
//const KubernetesRoomProvider = require('../roomsProviders/kubernetes-provider');

class RoomsController {
    constructor(options = {}, roomRepository) {
        this.provider = this.createProvider(
            options.provider || process.env.ROOM_PROVIDER || 'cluster',
            options.providerOptions,
            roomRepository
        );
        this.roomRepository = roomRepository;
        this.setupCleanup();
    }

    createProvider(type, options, repository) {
        switch (type) {
            /*
            case 'cluster':
                return new ClusterRoomProvider(options, this.roomRepository);
                */
            // Uncomment these as needed
            case 'docker':
                return new DockerRoomProvider(options, repository);
            /*
            case 'kubernetes':
                return new KubernetesRoomProvider(options);
            */
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }

    setupCleanup() {
        setInterval(() => {
            this.provider.cleanup().catch(console.error);
        }, 30000);
    }

    async createRoom(options = {}) {
        const roomId = options.roomId || this.generateRoomId();
        return await this.provider.createRoom(roomId, options);
    }

    async deleteRoom(roomId) {
        return await this.provider.deleteRoom(roomId);
    }

    async getRoomStatus(roomId) {
        return await this.provider.getRoomStatus(roomId);
    }

    async listRooms() {
        return await this.provider.listRooms();
    }

    generateRoomId() {
        return Math.random().toString(36).substring(2, 7);
    }
}

module.exports = RoomsController;
